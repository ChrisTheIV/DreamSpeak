import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

function findChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE && existsSync(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  }
  const roots = [process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright'), join(homedir(), '.cache', 'ms-playwright')].filter(Boolean);
  const suffixes = [join('chrome-win64', 'chrome.exe'), join('chrome-linux', 'chrome'), join('chrome-headless-shell-linux64', 'chrome-headless-shell')];
  const matches = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('chromium')) continue;
      for (const suffix of suffixes) {
        const candidate = join(root, entry.name, suffix);
        if (existsSync(candidate)) matches.push(candidate);
      }
    }
  }
  if (!matches.length) throw new Error('Could not find a Playwright Chromium executable.');
  return matches.sort().at(-1);
}

async function setValue(page, selector, value) {
  await page.locator(selector).evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

const browser = await chromium.launch({ executablePath: findChromiumExecutable(), headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const mediaRequests = [];
  const pageErrors = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'media' || /\.wav(\?|$)/i.test(request.url())) mediaRequests.push(request.url());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(process.env.DREAMSPEAK_BASE_URL || 'http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#start-button');
  if (await page.locator('#mode-select').inputValue() !== 'edge') throw new Error('Edge mode should be the default.');

  await page.locator('#phrase-list input[type="checkbox"]').evaluateAll((checkboxes) => {
    for (const checkbox of checkboxes) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForFunction(() => document.querySelector('#start-button')?.disabled === true);
  await page.locator('#apply-goal-button').click();
  await page.waitForFunction(() => document.querySelector('#start-button')?.disabled === false);

  await page.locator('#mode-select').selectOption('custom');
  await setValue(page, '#min-delay', 3);
  await setValue(page, '#max-delay', 3);
  await setValue(page, '#min-repeats', 1);
  await setValue(page, '#max-repeats', 1);
  await page.locator('#variation-select').selectOption('natural');
  await page.locator('#sleep-timer').selectOption('0');
  await page.locator('#start-button').click();
  await page.waitForFunction(() => document.querySelector('#session-state')?.textContent === 'Running');
  await page.waitForTimeout(4300);

  await page.locator('#pause-button').click();
  await page.waitForFunction(() => document.querySelector('#session-state')?.textContent === 'Paused');
  const before = await page.locator('#elapsed-time').textContent();
  await page.waitForTimeout(1100);
  const after = await page.locator('#elapsed-time').textContent();
  if (before !== after) throw new Error(`Elapsed time changed while paused: ${before} -> ${after}`);

  await page.locator('#start-button').click();
  await page.locator('#stop-button').click();
  await page.waitForFunction(() => document.querySelector('#feedback-panel')?.hidden === false);
  await page.locator('#save-feedback-button').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamspeak.session-history.v1') || '[]').length);
  if (!saved) throw new Error('Expected feedback history to persist.');
  if (!mediaRequests.some((url) => /audio\/phrases\//i.test(url))) throw new Error('Expected a phrase audio request.');
  if (pageErrors.length) throw new Error(pageErrors.join('; '));
  console.log(JSON.stringify({ edgeDefault: true, emptySelectionBlocked: true, pausedElapsedStable: true, feedbackSaved: true }, null, 2));
} finally {
  await browser.close();
}
