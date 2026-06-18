import { audioRegistry, createDefaultSettings } from './modules/audio-registry.js';
import { PhraseScheduler } from './modules/phrase-scheduler.js';
import { AudioSessionEngine } from './modules/audio-session-engine.js';

const storageKey = 'dreamspeak.settings.v1';

const elements = {
  state: document.querySelector('#session-state'),
  elapsed: document.querySelector('#elapsed-time'),
  currentPhrase: document.querySelector('#current-phrase'),
  nextDelay: document.querySelector('#next-delay'),
  repeatCount: document.querySelector('#repeat-count'),
  playbackRate: document.querySelector('#playback-rate'),
  selectedMusic: document.querySelector('#selected-music'),
  start: document.querySelector('#start-button'),
  pause: document.querySelector('#pause-button'),
  stop: document.querySelector('#stop-button'),
  musicSelect: document.querySelector('#music-select'),
  phraseVolume: document.querySelector('#phrase-volume'),
  musicVolume: document.querySelector('#music-volume'),
  minDelay: document.querySelector('#min-delay'),
  maxDelay: document.querySelector('#max-delay'),
  minRepeats: document.querySelector('#min-repeats'),
  maxRepeats: document.querySelector('#max-repeats'),
  minRate: document.querySelector('#min-rate'),
  maxRate: document.querySelector('#max-rate'),
  sleepTimer: document.querySelector('#sleep-timer'),
  phraseList: document.querySelector('#phrase-list'),
  sessionLog: document.querySelector('#session-log'),
};

function loadSettings() {
  const defaults = createDefaultSettings();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return saved ? { ...defaults, ...saved } : defaults;
  } catch {
    return defaults;
  }
}

function persistSettings(settings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

function renderPhraseList(settings, onToggle) {
  elements.phraseList.innerHTML = '';
  audioRegistry.phrases.forEach((phrase) => {
    const item = document.createElement('label');
    item.className = 'phrase-item';
    item.innerHTML = `
      <input type="checkbox" ${settings.enabledPhraseIds.includes(phrase.id) ? 'checked' : ''} />
      <div class="phrase-meta">
        <strong>${phrase.label}</strong>
        <span>${phrase.id}</span>
      </div>
    `;
    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => onToggle(phrase.id, checkbox.checked));
    elements.phraseList.appendChild(item);
  });
}

function renderMusicOptions(settings) {
  elements.musicSelect.innerHTML = audioRegistry.musicTracks
    .map((music) => `<option value="${music.id}">${music.label}</option>`)
    .join('');
  elements.musicSelect.value = settings.selectedMusicId;
}

function renderSettings(settings) {
  elements.phraseVolume.value = String(settings.phraseVolume);
  elements.musicVolume.value = String(settings.musicVolume);
  elements.minDelay.value = String(settings.minDelaySeconds);
  elements.maxDelay.value = String(settings.maxDelaySeconds);
  elements.minRepeats.value = String(settings.minRepeats);
  elements.maxRepeats.value = String(settings.maxRepeats);
  elements.minRate.value = String(settings.minPlaybackRate);
  elements.maxRate.value = String(settings.maxPlaybackRate);
  elements.sleepTimer.value = String(settings.sleepTimerMinutes);
}

function pushLog(message) {
  const item = document.createElement('li');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  item.innerHTML = `${message}<span class="log-time">${time}</span>`;
  elements.sessionLog.prepend(item);
  while (elements.sessionLog.children.length > 5) {
    elements.sessionLog.removeChild(elements.sessionLog.lastElementChild);
  }
}

function readSettingsFromUI(current) {
  const minDelay = Number(elements.minDelay.value);
  const maxDelay = Number(elements.maxDelay.value);
  const minRepeats = Number(elements.minRepeats.value);
  const maxRepeats = Number(elements.maxRepeats.value);
  const minPlaybackRate = Number(elements.minRate.value);
  const maxPlaybackRate = Number(elements.maxRate.value);
  const sleepTimerMinutes = Number(elements.sleepTimer.value);

  return {
    ...current,
    selectedMusicId: elements.musicSelect.value,
    phraseVolume: Number(elements.phraseVolume.value),
    musicVolume: Number(elements.musicVolume.value),
    minDelaySeconds: Math.min(minDelay, maxDelay),
    maxDelaySeconds: Math.max(minDelay, maxDelay),
    minRepeats: Math.min(minRepeats, maxRepeats),
    maxRepeats: Math.max(minRepeats, maxRepeats),
    minPlaybackRate: Math.min(minPlaybackRate, maxPlaybackRate),
    maxPlaybackRate: Math.max(minPlaybackRate, maxPlaybackRate),
    sleepTimerMinutes: Math.max(0, sleepTimerMinutes),
  };
}

function syncStatus(snapshot) {
  elements.state.textContent = snapshot.state[0].toUpperCase() + snapshot.state.slice(1);
  elements.elapsed.textContent = snapshot.elapsedLabel;
  elements.currentPhrase.textContent = snapshot.currentPhraseLabel;
  elements.nextDelay.textContent = snapshot.nextDelayLabel;
  elements.repeatCount.textContent = snapshot.repeatLabel;
  elements.playbackRate.textContent = snapshot.playbackRateLabel;
  elements.selectedMusic.textContent = snapshot.musicLabel;
  document.querySelector('#sleep-timer-label').textContent = snapshot.sleepTimerLabel;
}

const scheduler = new PhraseScheduler(audioRegistry);
let settings = loadSettings();
renderMusicOptions(settings);
renderSettings(settings);
renderPhraseList(settings, (phraseId, enabled) => {
  const nextEnabled = new Set(settings.enabledPhraseIds);
  if (enabled) nextEnabled.add(phraseId);
  else nextEnabled.delete(phraseId);
  settings = { ...settings, enabledPhraseIds: [...nextEnabled] };
  persistSettings(settings);
  engine.applySettings(settings);
});

const engine = new AudioSessionEngine({
  registry: audioRegistry,
  scheduler,
  onStateChange: syncStatus,
  onPlan: (plan) => {
    const snapshot = engine.getSnapshot();
    syncStatus({
      ...snapshot,
      state: engine.state,
      currentPhraseLabel: plan.phrase.label,
      nextDelayLabel: `${plan.delaySeconds}s`,
      repeatLabel: `${plan.repeatCount}x`,
      playbackRateLabel: `${plan.playbackRate.toFixed(2)}x`,
    });
  },
  onLog: pushLog,
});

engine.applySettings(settings);
syncStatus(engine.getSnapshot());

function commitSettings() {
  settings = readSettingsFromUI(settings);
  persistSettings(settings);
  renderPhraseList(settings, (phraseId, enabled) => {
    const nextEnabled = new Set(settings.enabledPhraseIds);
    if (enabled) nextEnabled.add(phraseId);
    else nextEnabled.delete(phraseId);
    settings = { ...settings, enabledPhraseIds: [...nextEnabled] };
    persistSettings(settings);
    engine.applySettings(settings);
  });
  engine.applySettings(settings);
  syncStatus(engine.getSnapshot());
}

[
  elements.musicSelect,
  elements.phraseVolume,
  elements.musicVolume,
  elements.minDelay,
  elements.maxDelay,
  elements.minRepeats,
  elements.maxRepeats,
  elements.minRate,
  elements.maxRate,
  elements.sleepTimer,
].forEach((node) => node.addEventListener('change', commitSettings));

elements.start.addEventListener('click', async () => {
  commitSettings();
  await engine.start();
});

elements.pause.addEventListener('click', async () => {
  await engine.pause();
  syncStatus(engine.getSnapshot());
});

elements.stop.addEventListener('click', async () => {
  await engine.stop();
  syncStatus(engine.getSnapshot());
});

setInterval(() => engine.updateElapsed(), 250);
window.addEventListener('beforeunload', () => engine.dispose());
