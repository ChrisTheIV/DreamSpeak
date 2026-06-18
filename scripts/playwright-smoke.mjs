import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

function findChromiumExecutable() {
  const base = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const candidates = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('chromium-'))
    .map((entry) => join(base, entry.name, 'chrome-win64', 'chrome.exe'))
    .filter((candidate) => existsSync(candidate))
    .sort();

  if (candidates.length === 0) {
    throw new Error('Could not find a downloaded Chromium executable under ms-playwright.');
  }

  return candidates[candidates.length - 1];
}

async function setValue(page, selector, value) {
  await page.locator(selector).evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

const executablePath = findChromiumExecutable();
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const mediaRequests = [];

  page.on('request', (request) => {
    if (request.resourceType() === 'media' || /\.wav(\?|$)/i.test(request.url())) {
      mediaRequests.push(request.url());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#start-button');

  await page.locator('#music-select').selectOption('ocean');
  await setValue(page, '#phrase-volume', 0.6);
  await setValue(page, '#music-volume', 0.2);
  await setValue(page, '#min-delay', 3);
  await setValue(page, '#max-delay', 3);
  await setValue(page, '#min-repeats', 1);
  await setValue(page, '#max-repeats', 1);
  await setValue(page, '#min-rate', 1);
  await setValue(page, '#max-rate', 1);
  await setValue(page, '#sleep-timer', 0);

  await page.locator('#start-button').click();
  await page.waitForFunction(() =>
    document.querySelector('#session-log')?.textContent?.includes('Session started')
  );

  const runningState = await page.locator('#session-state').textContent();
  const logBeforePlayback = await page.locator('#session-log').innerText();

  await page.waitForTimeout(4200);

  const currentPhraseAfter = await page.locator('#current-phrase').textContent();
  const nextDelayAfter = await page.locator('#next-delay').textContent();
  const repeatAfter = await page.locator('#repeat-count').textContent();
  const rateAfter = await page.locator('#playback-rate').textContent();
  const sleepTimerLabel = await page.locator('#sleep-timer-label').textContent();
  const logAfter = await page.locator('#session-log').innerText();

  await page.locator('#pause-button').click();
  await page.waitForTimeout(150);
  const pausedState = await page.locator('#session-state').textContent();

  await page.locator('#start-button').click();
  await page.waitForTimeout(150);
  await page.locator('#stop-button').click();
  await page.waitForTimeout(150);
  const stoppedState = await page.locator('#session-state').textContent();

  const phraseRequests = mediaRequests.filter((url) => /phrases\/phrase-\d\d\.wav/i.test(url));
  const musicRequests = mediaRequests.filter((url) => /music\/(rain|ocean|drift)\.wav/i.test(url));

  const result = {
    runningState,
    pausedState,
    stoppedState,
    currentPhraseAfter,
    nextDelayAfter,
    repeatAfter,
    rateAfter,
    sleepTimerLabel,
    phraseRequests: phraseRequests.length,
    musicRequests: musicRequests.length,
    logBeforePlayback,
    logAfter,
  };

  console.log(JSON.stringify(result, null, 2));

  if (runningState !== 'Running') throw new Error(`Expected Running state, saw ${runningState}`);
  if (pausedState !== 'Paused') throw new Error(`Expected Paused state, saw ${pausedState}`);
  if (stoppedState !== 'Idle') throw new Error(`Expected Idle state, saw ${stoppedState}`);
  if (!currentPhraseAfter || currentPhraseAfter === 'Nothing yet') {
    throw new Error('Expected a played phrase to appear after the delay window.');
  }
  if (phraseRequests.length === 0) {
    throw new Error('Expected at least one phrase audio request.');
  }
  if (musicRequests.length === 0) {
    throw new Error('Expected at least one music audio request.');
  }
  if (!sleepTimerLabel || sleepTimerLabel !== 'Off') {
    throw new Error(`Expected the sleep timer label to be Off, saw ${sleepTimerLabel}`);
  }
  if (!logBeforePlayback?.includes('Session started')) {
    throw new Error('Expected the log to show the session started.');
  }
  if (!logAfter?.includes('Playing')) {
    throw new Error('Expected the log to show a phrase group playback event.');
  }
} finally {
  await browser.close();
}
