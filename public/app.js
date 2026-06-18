import {
  applyModePreset,
  audioRegistry,
  createDefaultSettings,
  getGoalById,
  getModeById,
  getVariationProfileById,
  normalizeSettings,
} from './modules/audio-registry.js';
import { PhraseScheduler } from './modules/phrase-scheduler.js';
import { AudioSessionEngine } from './modules/audio-session-engine.js';

const settingsStorageKey = 'dreamspeak.settings.v2';
const legacySettingsStorageKey = 'dreamspeak.settings.v1';
const historyStorageKey = 'dreamspeak.session-history.v1';
const maxHistoryItems = 30;

const elements = {
  body: document.body,
  state: document.querySelector('#session-state'),
  elapsed: document.querySelector('#elapsed-time'),
  phase: document.querySelector('#phase-label'),
  nextCue: document.querySelector('#next-cue-countdown'),
  nextPhrase: document.querySelector('#next-phrase'),
  currentPhrase: document.querySelector('#current-phrase'),
  activeMode: document.querySelector('#active-mode'),
  repeatCount: document.querySelector('#repeat-count'),
  playbackRate: document.querySelector('#playback-rate'),
  selectedMusic: document.querySelector('#selected-music'),
  sleepTimerLabel: document.querySelector('#sleep-timer-label'),
  cueCount: document.querySelector('#cue-count'),
  start: document.querySelector('#start-button'),
  pause: document.querySelector('#pause-button'),
  stop: document.querySelector('#stop-button'),
  modeSelect: document.querySelector('#mode-select'),
  modeDescription: document.querySelector('#mode-description'),
  modeChip: document.querySelector('#mode-chip'),
  goalSelect: document.querySelector('#goal-select'),
  goalDescription: document.querySelector('#goal-description'),
  applyGoal: document.querySelector('#apply-goal-button'),
  musicSelect: document.querySelector('#music-select'),
  variationSelect: document.querySelector('#variation-select'),
  phraseVolume: document.querySelector('#phrase-volume'),
  phraseVolumeValue: document.querySelector('#phrase-volume-value'),
  musicVolume: document.querySelector('#music-volume'),
  musicVolumeValue: document.querySelector('#music-volume-value'),
  minDelay: document.querySelector('#min-delay'),
  maxDelay: document.querySelector('#max-delay'),
  minRepeats: document.querySelector('#min-repeats'),
  maxRepeats: document.querySelector('#max-repeats'),
  minRate: document.querySelector('#min-rate'),
  maxRate: document.querySelector('#max-rate'),
  sleepTimer: document.querySelector('#sleep-timer'),
  phraseList: document.querySelector('#phrase-list'),
  enabledCount: document.querySelector('#enabled-count'),
  validation: document.querySelector('#validation-message'),
  reset: document.querySelector('#reset-button'),
  sessionLog: document.querySelector('#session-log'),
  clearLog: document.querySelector('#clear-log-button'),
  feedbackPanel: document.querySelector('#feedback-panel'),
  dismissFeedback: document.querySelector('#dismiss-feedback-button'),
  outcomeSelect: document.querySelector('#outcome-select'),
  intensitySelect: document.querySelector('#intensity-select'),
  saveFeedback: document.querySelector('#save-feedback-button'),
  feedbackSuggestion: document.querySelector('#feedback-suggestion'),
};

function safeParse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadSettings() {
  const raw = localStorage.getItem(settingsStorageKey) ?? localStorage.getItem(legacySettingsStorageKey);
  return normalizeSettings(raw ? safeParse(raw, {}) : createDefaultSettings());
}

function persistSettings(nextSettings) {
  localStorage.setItem(settingsStorageKey, JSON.stringify(nextSettings));
}

function loadHistory() {
  const value = safeParse(localStorage.getItem(historyStorageKey) || '[]', []);
  return Array.isArray(value) ? value : [];
}

function persistHistory(history) {
  localStorage.setItem(historyStorageKey, JSON.stringify(history.slice(0, maxHistoryItems)));
}

function populateSelect(select, items) {
  select.innerHTML = items.map((item) => `<option value="${item.id}">${item.label}</option>`).join('');
}

function renderStaticOptions() {
  populateSelect(elements.modeSelect, audioRegistry.sessionModes);
  populateSelect(elements.goalSelect, audioRegistry.phraseGoals);
  populateSelect(elements.musicSelect, audioRegistry.musicTracks);
  populateSelect(elements.variationSelect, audioRegistry.variationProfiles);
}

function formatPercent(value) {
  return `${Math.round(Number(value) * 100)}%`;
}

function renderDescriptions() {
  const mode = getModeById(settings.modeId);
  const goal = getGoalById(settings.goalId);
  const variation = getVariationProfileById(settings.variationProfileId);
  elements.modeDescription.textContent = mode.description;
  elements.goalDescription.textContent = goal.description;
  elements.modeChip.textContent = mode.label;
  elements.variationSelect.title = variation.description;
}

function renderSettings() {
  elements.modeSelect.value = settings.modeId;
  elements.goalSelect.value = settings.goalId;
  elements.musicSelect.value = settings.selectedMusicId;
  elements.variationSelect.value = settings.variationProfileId;
  const timerValue = String(settings.sleepTimerMinutes);
  if (![...elements.sleepTimer.options].some((option) => option.value === timerValue)) {
    const option = document.createElement('option');
    option.value = timerValue;
    option.textContent = `${timerValue} minutes`;
    elements.sleepTimer.appendChild(option);
  }
  elements.sleepTimer.value = timerValue;
  elements.phraseVolume.value = String(settings.phraseVolume);
  elements.musicVolume.value = String(settings.musicVolume);
  elements.minDelay.value = String(settings.minDelaySeconds);
  elements.maxDelay.value = String(settings.maxDelaySeconds);
  elements.minRepeats.value = String(settings.minRepeats);
  elements.maxRepeats.value = String(settings.maxRepeats);
  elements.minRate.value = String(settings.minPlaybackRate);
  elements.maxRate.value = String(settings.maxPlaybackRate);
  elements.phraseVolumeValue.textContent = formatPercent(settings.phraseVolume);
  elements.musicVolumeValue.textContent = formatPercent(settings.musicVolume);
  renderDescriptions();
}

function createPhraseItem(phrase) {
  const item = document.createElement('div');
  item.className = 'phrase-item';
  item.dataset.phraseId = phrase.id;
  const label = document.createElement('label');
  label.className = 'phrase-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = settings.enabledPhraseIds.includes(phrase.id);
  checkbox.dataset.phraseId = phrase.id;
  checkbox.setAttribute('aria-label', `Enable ${phrase.label}`);
  const copy = document.createElement('span');
  copy.className = 'phrase-copy';
  const title = document.createElement('strong');
  title.textContent = phrase.label;
  const id = document.createElement('small');
  id.textContent = phrase.id;
  copy.append(title, id);
  label.append(checkbox, copy);

  const actions = document.createElement('div');
  actions.className = 'phrase-actions';
  const preview = document.createElement('button');
  preview.type = 'button';
  preview.className = 'preview-button';
  preview.textContent = 'Preview';
  preview.dataset.previewPhraseId = phrase.id;
  preview.disabled = engine?.state !== 'idle';
  preview.addEventListener('click', async () => {
    preview.disabled = true;
    preview.textContent = 'Playing…';
    await engine.previewPhrase(phrase);
    preview.textContent = 'Preview';
    preview.disabled = engine.state !== 'idle';
  });
  actions.appendChild(preview);

  checkbox.addEventListener('change', async () => {
    const enabled = new Set(settings.enabledPhraseIds);
    if (checkbox.checked) enabled.add(phrase.id);
    else enabled.delete(phrase.id);
    settings = normalizeSettings({ ...settings, enabledPhraseIds: [...enabled] });
    persistSettings(settings);
    await engine.applySettings(settings);
    updateEnabledCount();
    updateValidationAndControls(engine.getSnapshot());
  });
  item.append(label, actions);
  return item;
}

function renderPhraseList() {
  elements.phraseList.innerHTML = '';
  for (const category of audioRegistry.phraseCategories) {
    const phrases = audioRegistry.phrases.filter((phrase) => phrase.category === category.id);
    if (phrases.length === 0) continue;
    const group = document.createElement('section');
    group.className = 'phrase-group';
    const heading = document.createElement('h3');
    heading.textContent = category.label;
    const grid = document.createElement('div');
    grid.className = 'phrase-grid';
    for (const phrase of phrases) grid.appendChild(createPhraseItem(phrase));
    group.append(heading, grid);
    elements.phraseList.appendChild(group);
  }
  updateEnabledCount();
}

function updateEnabledCount() {
  const count = settings.enabledPhraseIds.length;
  elements.enabledCount.textContent = `${count} selected`;
  elements.enabledCount.classList.toggle('empty', count === 0);
}

function pushLog(message) {
  const item = document.createElement('li');
  const copy = document.createElement('span');
  copy.textContent = message;
  const time = document.createElement('time');
  time.className = 'log-time';
  time.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  item.append(copy, time);
  elements.sessionLog.prepend(item);
  while (elements.sessionLog.children.length > 6) elements.sessionLog.lastElementChild.remove();
}

function readAdvancedSettings(current) {
  return normalizeSettings({
    ...current,
    modeId: 'custom',
    minDelaySeconds: elements.minDelay.value,
    maxDelaySeconds: elements.maxDelay.value,
    minRepeats: elements.minRepeats.value,
    maxRepeats: elements.maxRepeats.value,
    minPlaybackRate: elements.minRate.value,
    maxPlaybackRate: elements.maxRate.value,
  });
}

async function commitSettings(nextSettings, { rerenderPhrases = false } = {}) {
  settings = normalizeSettings(nextSettings);
  persistSettings(settings);
  renderSettings();
  if (rerenderPhrases) renderPhraseList();
  await engine.applySettings(settings);
  updateValidationAndControls(engine.getSnapshot());
}

function applyGoalSet() {
  const goal = getGoalById(settings.goalId);
  const phraseIds = goal.id === 'all'
    ? audioRegistry.phrases.map((phrase) => phrase.id)
    : [...goal.phraseIds];
  return commitSettings({ ...settings, enabledPhraseIds: phraseIds }, { rerenderPhrases: true });
}

function updateValidationAndControls(snapshot) {
  const hasPhrases = settings.enabledPhraseIds.length > 0;
  const state = snapshot?.state ?? engine.state;
  const isIdle = state === 'idle';
  const isRunning = state === 'running';
  const isPaused = state === 'paused';
  elements.validation.textContent = hasPhrases ? '' : 'Select at least one phrase before starting.';
  elements.validation.classList.toggle('visible', !hasPhrases);
  elements.start.disabled = isRunning || !hasPhrases;
  elements.start.textContent = isPaused ? 'Resume edge session' : 'Start edge session';
  elements.pause.disabled = !isRunning;
  elements.stop.disabled = isIdle;
  document.querySelectorAll('[data-preview-phrase-id]').forEach((button) => {
    button.disabled = !isIdle;
  });
}

function syncStatus(snapshot) {
  const stateLabel = snapshot.state[0].toUpperCase() + snapshot.state.slice(1);
  elements.body.dataset.sessionState = snapshot.state;
  elements.state.textContent = stateLabel;
  elements.elapsed.textContent = snapshot.elapsedLabel;
  elements.phase.textContent = snapshot.phaseLabel;
  elements.nextCue.textContent = snapshot.nextCueCountdown === null ? '—' : String(snapshot.nextCueCountdown);
  elements.nextPhrase.textContent = snapshot.nextPhraseLabel;
  elements.currentPhrase.textContent = snapshot.currentPhraseLabel;
  elements.activeMode.textContent = snapshot.modeLabel;
  elements.repeatCount.textContent = snapshot.repeatLabel;
  elements.playbackRate.textContent = snapshot.playbackRateLabel;
  elements.selectedMusic.textContent = snapshot.musicLabel;
  elements.sleepTimerLabel.textContent = snapshot.sleepTimerLabel;
  elements.cueCount.textContent = String(snapshot.cueCount);
  updateValidationAndControls(snapshot);
}

function suggestionFor(outcome, intensity) {
  if (intensity === 'too_loud' || outcome === 'woke_too_much') {
    return 'Try lowering phrase volume by 10–15%, or widen the maximum delay slightly while keeping Edge mode.';
  }
  if (intensity === 'too_quiet') {
    return 'Raise phrase volume a little before changing timing—the surprise only works if the cue reaches you.';
  }
  if (outcome === 'fell_asleep') {
    return 'Use Edge of sleep with a shorter maximum delay or one extra repeat to interrupt the final drop-off.';
  }
  if (outcome === 'held_edge') {
    return 'This balance worked. Keep the same settings for a few sessions before changing anything.';
  }
  if (outcome === 'became_lucid') {
    return 'Keep this setup saved. Repeating a successful cue pattern may strengthen the association.';
  }
  if (outcome === 'heard_drifting') {
    return 'Good sign: the cue crossed into the drift. Keep the timing and adjust only if it felt too predictable.';
  }
  return 'No clear effect yet. Change only one variable next time—volume, phrase set, or timing—not all three.';
}

function showFeedback(summary) {
  pendingSessionSummary = summary;
  elements.feedbackPanel.hidden = false;
  elements.feedbackSuggestion.textContent = '';
  elements.feedbackPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const scheduler = new PhraseScheduler(audioRegistry);
let settings = loadSettings();
let pendingSessionSummary = null;
const engine = new AudioSessionEngine({
  registry: audioRegistry,
  scheduler,
  onStateChange: syncStatus,
  onPlan: () => undefined,
  onLog: pushLog,
  onSessionEnd: showFeedback,
});

renderStaticOptions();
renderSettings();
renderPhraseList();
await engine.applySettings(settings);
syncStatus(engine.getSnapshot());

elements.modeSelect.addEventListener('change', async () => {
  await commitSettings(applyModePreset(settings, elements.modeSelect.value));
});

elements.goalSelect.addEventListener('change', async () => {
  settings = normalizeSettings({ ...settings, goalId: elements.goalSelect.value });
  await applyGoalSet();
});

elements.applyGoal.addEventListener('click', applyGoalSet);
elements.musicSelect.addEventListener('change', () => {
  commitSettings({ ...settings, selectedMusicId: elements.musicSelect.value });
});
elements.variationSelect.addEventListener('change', () => {
  const profile = getVariationProfileById(elements.variationSelect.value);
  commitSettings({
    ...settings,
    variationProfileId: profile.id,
    minPlaybackRate: profile.minPlaybackRate,
    maxPlaybackRate: profile.maxPlaybackRate,
  });
});
elements.sleepTimer.addEventListener('change', () => {
  commitSettings({ ...settings, sleepTimerMinutes: elements.sleepTimer.value });
});

for (const [input, field] of [
  [elements.phraseVolume, 'phraseVolume'],
  [elements.musicVolume, 'musicVolume'],
]) {
  input.addEventListener('input', () => {
    settings = normalizeSettings({ ...settings, [field]: input.value });
    elements.phraseVolumeValue.textContent = formatPercent(settings.phraseVolume);
    elements.musicVolumeValue.textContent = formatPercent(settings.musicVolume);
    persistSettings(settings);
    engine.applySettings(settings);
  });
}

for (const input of [
  elements.minDelay,
  elements.maxDelay,
  elements.minRepeats,
  elements.maxRepeats,
  elements.minRate,
  elements.maxRate,
]) {
  input.addEventListener('change', () => commitSettings(readAdvancedSettings(settings)));
}

elements.reset.addEventListener('click', async () => {
  settings = createDefaultSettings();
  persistSettings(settings);
  renderSettings();
  renderPhraseList();
  await engine.applySettings(settings);
  pushLog('Settings reset to the Edge of sleep defaults.');
});

elements.start.addEventListener('click', async () => {
  elements.feedbackPanel.hidden = true;
  await engine.start();
});
elements.pause.addEventListener('click', () => engine.pause());
elements.stop.addEventListener('click', () => engine.stop('manual'));
elements.clearLog.addEventListener('click', () => {
  elements.sessionLog.innerHTML = '';
});

elements.dismissFeedback.addEventListener('click', () => {
  elements.feedbackPanel.hidden = true;
  pendingSessionSummary = null;
});

elements.saveFeedback.addEventListener('click', () => {
  if (!pendingSessionSummary) return;
  const outcome = elements.outcomeSelect.value;
  const intensity = elements.intensitySelect.value;
  const entry = {
    ...pendingSessionSummary,
    outcome,
    intensity,
    goalId: settings.goalId,
    phraseVolume: settings.phraseVolume,
    musicVolume: settings.musicVolume,
    savedAt: new Date().toISOString(),
  };
  persistHistory([entry, ...loadHistory()]);
  elements.feedbackSuggestion.textContent = suggestionFor(outcome, intensity);
  elements.saveFeedback.disabled = true;
  elements.saveFeedback.textContent = 'Result saved';
  setTimeout(() => {
    elements.saveFeedback.disabled = false;
    elements.saveFeedback.textContent = 'Save result';
  }, 1200);
  pendingSessionSummary = null;
});

setInterval(() => engine.updateElapsed(), 250);
window.addEventListener('beforeunload', () => engine.dispose());
