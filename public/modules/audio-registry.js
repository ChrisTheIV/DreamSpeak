const PHRASES = [
  { id: 'phrase-01', label: 'Am I dreaming?', category: 'recognition', src: '/audio/phrases/phrase-01.wav' },
  { id: 'phrase-02', label: 'Notice anything strange.', category: 'recognition', src: '/audio/phrases/phrase-02.wav' },
  { id: 'phrase-03', label: 'Look at your hands.', category: 'recognition', src: '/audio/phrases/phrase-03.wav' },
  { id: 'phrase-04', label: 'Stay aware.', category: 'awareness', src: '/audio/phrases/phrase-04.wav' },
  { id: 'phrase-05', label: 'This is a dream.', category: 'recognition', src: '/audio/phrases/phrase-05.wav' },
  { id: 'phrase-06', label: 'Remember the dream state.', category: 'recognition', src: '/audio/phrases/phrase-06.wav' },
  { id: 'phrase-07', label: 'Keep a thread of awareness.', category: 'awareness', src: '/audio/phrases/phrase-07.wav' },
  { id: 'phrase-08', label: 'I will know when I am dreaming.', category: 'intention', src: '/audio/phrases/phrase-08.wav' },
  { id: 'phrase-09', label: 'Question the scene.', category: 'recognition', src: '/audio/phrases/phrase-09.wav' },
  { id: 'phrase-10', label: 'Watch for impossible details.', category: 'recognition', src: '/audio/phrases/phrase-10.wav' },
  { id: 'phrase-11', label: 'Re-center your attention.', category: 'stability', src: '/audio/phrases/phrase-11.wav' },
  { id: 'phrase-12', label: 'Stay calm and alert.', category: 'stability', src: '/audio/phrases/phrase-12.wav' },
  { id: 'phrase-13', label: 'This could be a dream.', category: 'recognition', src: '/audio/phrases/phrase-13.wav' },
  { id: 'phrase-14', label: 'Recognize the dream.', category: 'recognition', src: '/audio/phrases/phrase-14.wav' },
  { id: 'phrase-15', label: 'Hold the intention.', category: 'intention', src: '/audio/phrases/phrase-15.wav' },
  { id: 'phrase-16', label: 'Check reality gently.', category: 'recognition', src: '/audio/phrases/phrase-16.wav' },
  { id: 'phrase-17', label: 'Notice the shift.', category: 'awareness', src: '/audio/phrases/phrase-17.wav' },
  { id: 'phrase-18', label: 'Stay in the moment.', category: 'stability', src: '/audio/phrases/phrase-18.wav' },
  { id: 'phrase-19', label: 'Remember to recognize.', category: 'intention', src: '/audio/phrases/phrase-19.wav' },
  { id: 'phrase-20', label: 'Lana.', category: 'custom', src: '/audio/phrases/tmp6jpccqe0.wav' },
];

const MUSIC_TRACKS = [
  { id: 'rain', label: 'Rain', src: '/audio/music/rain.wav' },
  { id: 'ocean', label: 'Ocean', src: '/audio/music/ocean.wav' },
  { id: 'drift', label: 'Soft drift', src: '/audio/music/drift.wav' },
];

const PHRASE_CATEGORIES = [
  { id: 'recognition', label: 'Dream recognition' },
  { id: 'awareness', label: 'Thread of awareness' },
  { id: 'intention', label: 'Intention' },
  { id: 'stability', label: 'Calm and stability' },
  { id: 'custom', label: 'Personal' },
];

const PHRASE_GOALS = [
  {
    id: 'recognition',
    label: 'Recognize the dream',
    description: 'Short reality-questioning cues for the edge of sleep.',
    phraseIds: ['phrase-01', 'phrase-05', 'phrase-09', 'phrase-10', 'phrase-13', 'phrase-14', 'phrase-16'],
  },
  {
    id: 'awareness',
    label: 'Keep awareness alive',
    description: 'Maintain a thin thread of attention while the body drifts.',
    phraseIds: ['phrase-04', 'phrase-07', 'phrase-12', 'phrase-15', 'phrase-17', 'phrase-18'],
  },
  {
    id: 'stability',
    label: 'Stay calm when lucid',
    description: 'Rehearse calm attention and dream stabilization.',
    phraseIds: ['phrase-11', 'phrase-12', 'phrase-15', 'phrase-18'],
  },
  {
    id: 'all',
    label: 'Mixed cues',
    description: 'Use every available cue for maximum unpredictability.',
    phraseIds: PHRASES.map((phrase) => phrase.id),
  },
];

const SESSION_MODES = [
  {
    id: 'edge',
    label: 'Edge of sleep',
    description: 'Frequent, unpredictable cues designed to catch you drifting and stop full sleep onset.',
    sleepTimerMinutes: 45,
    phases: [
      { id: 'settling', label: 'Settling', untilSeconds: 90, minDelaySeconds: 8, maxDelaySeconds: 18, minRepeats: 1, maxRepeats: 2 },
      { id: 'threshold', label: 'Threshold', untilSeconds: 600, minDelaySeconds: 10, maxDelaySeconds: 26, minRepeats: 1, maxRepeats: 3 },
      { id: 'holding', label: 'Holding the edge', untilSeconds: null, minDelaySeconds: 14, maxDelaySeconds: 38, minRepeats: 1, maxRepeats: 3 },
    ],
  },
  {
    id: 'wbtb',
    label: 'WBTB return',
    description: 'A slightly wider surprise window for returning to bed already sleepy.',
    sleepTimerMinutes: 35,
    phases: [
      { id: 're-entry', label: 'Re-entry', untilSeconds: 180, minDelaySeconds: 10, maxDelaySeconds: 24, minRepeats: 1, maxRepeats: 2 },
      { id: 'threshold', label: 'Threshold', untilSeconds: 900, minDelaySeconds: 16, maxDelaySeconds: 42, minRepeats: 1, maxRepeats: 3 },
      { id: 'holding', label: 'Holding the edge', untilSeconds: null, minDelaySeconds: 24, maxDelaySeconds: 58, minRepeats: 1, maxRepeats: 2 },
    ],
  },
  {
    id: 'nap',
    label: 'Nap experiment',
    description: 'Shorter session with enough space to drift before each interruption.',
    sleepTimerMinutes: 25,
    phases: [
      { id: 'settling', label: 'Settling', untilSeconds: 180, minDelaySeconds: 18, maxDelaySeconds: 45, minRepeats: 1, maxRepeats: 2 },
      { id: 'threshold', label: 'Threshold', untilSeconds: null, minDelaySeconds: 28, maxDelaySeconds: 75, minRepeats: 1, maxRepeats: 2 },
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Use your own timing, repeat, and speed ranges.',
    sleepTimerMinutes: 0,
    phases: null,
  },
];

const VARIATION_PROFILES = [
  { id: 'natural', label: 'Natural', description: 'No speed or pitch variation.', minPlaybackRate: 1, maxPlaybackRate: 1 },
  { id: 'subtle', label: 'Subtle surprise', description: 'Small changes that keep the cue familiar.', minPlaybackRate: 0.97, maxPlaybackRate: 1.04 },
  { id: 'dreamlike', label: 'Dreamlike', description: 'More obvious speed and pitch shifts.', minPlaybackRate: 0.9, maxPlaybackRate: 1.12 },
];

export const audioRegistry = {
  phrases: PHRASES,
  musicTracks: MUSIC_TRACKS,
  phraseCategories: PHRASE_CATEGORIES,
  phraseGoals: PHRASE_GOALS,
  sessionModes: SESSION_MODES,
  variationProfiles: VARIATION_PROFILES,
};

export function getPhraseById(id) {
  return PHRASES.find((phrase) => phrase.id === id) || null;
}

export function getMusicById(id) {
  return MUSIC_TRACKS.find((track) => track.id === id) || MUSIC_TRACKS[0];
}

export function getModeById(id) {
  return SESSION_MODES.find((mode) => mode.id === id) || SESSION_MODES[0];
}

export function getGoalById(id) {
  return PHRASE_GOALS.find((goal) => goal.id === id) || PHRASE_GOALS[0];
}

export function getVariationProfileById(id) {
  return VARIATION_PROFILES.find((profile) => profile.id === id) || VARIATION_PROFILES[1];
}

export function createDefaultSettings() {
  const mode = getModeById('edge');
  const goal = getGoalById('recognition');
  const variation = getVariationProfileById('subtle');
  return {
    modeId: mode.id,
    goalId: goal.id,
    variationProfileId: variation.id,
    selectedMusicId: MUSIC_TRACKS[0].id,
    phraseVolume: 0.66,
    musicVolume: 0.18,
    minDelaySeconds: 8,
    maxDelaySeconds: 24,
    minRepeats: 1,
    maxRepeats: 3,
    minPlaybackRate: variation.minPlaybackRate,
    maxPlaybackRate: variation.maxPlaybackRate,
    sleepTimerMinutes: mode.sleepTimerMinutes,
    enabledPhraseIds: [...goal.phraseIds],
  };
}

export function applyModePreset(settings, modeId) {
  const mode = getModeById(modeId);
  if (mode.id === 'custom') return { ...settings, modeId: mode.id };
  const firstPhase = mode.phases[0];
  const variation = getVariationProfileById(settings.variationProfileId);
  return {
    ...settings,
    modeId: mode.id,
    sleepTimerMinutes: mode.sleepTimerMinutes,
    minDelaySeconds: firstPhase.minDelaySeconds,
    maxDelaySeconds: firstPhase.maxDelaySeconds,
    minRepeats: firstPhase.minRepeats,
    maxRepeats: firstPhase.maxRepeats,
    minPlaybackRate: variation.minPlaybackRate,
    maxPlaybackRate: variation.maxPlaybackRate,
  };
}

function finiteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSettings(input = {}) {
  const defaults = createDefaultSettings();
  const merged = { ...defaults, ...input };
  const validPhraseIds = new Set(PHRASES.map((phrase) => phrase.id));
  const enabledPhraseIds = Array.isArray(merged.enabledPhraseIds)
    ? [...new Set(merged.enabledPhraseIds.filter((id) => validPhraseIds.has(id)))]
    : [...defaults.enabledPhraseIds];
  const rawMinDelay = clamp(finiteNumber(merged.minDelaySeconds, defaults.minDelaySeconds), 3, 300);
  const rawMaxDelay = clamp(finiteNumber(merged.maxDelaySeconds, defaults.maxDelaySeconds), 3, 300);
  const rawMinRepeats = clamp(Math.round(finiteNumber(merged.minRepeats, defaults.minRepeats)), 1, 12);
  const rawMaxRepeats = clamp(Math.round(finiteNumber(merged.maxRepeats, defaults.maxRepeats)), 1, 12);
  const rawMinRate = clamp(finiteNumber(merged.minPlaybackRate, defaults.minPlaybackRate), 0.75, 1.5);
  const rawMaxRate = clamp(finiteNumber(merged.maxPlaybackRate, defaults.maxPlaybackRate), 0.75, 1.5);
  return {
    ...merged,
    modeId: getModeById(merged.modeId).id,
    goalId: getGoalById(merged.goalId).id,
    variationProfileId: getVariationProfileById(merged.variationProfileId).id,
    selectedMusicId: getMusicById(merged.selectedMusicId).id,
    phraseVolume: clamp(finiteNumber(merged.phraseVolume, defaults.phraseVolume), 0, 1),
    musicVolume: clamp(finiteNumber(merged.musicVolume, defaults.musicVolume), 0, 1),
    minDelaySeconds: Math.min(rawMinDelay, rawMaxDelay),
    maxDelaySeconds: Math.max(rawMinDelay, rawMaxDelay),
    minRepeats: Math.min(rawMinRepeats, rawMaxRepeats),
    maxRepeats: Math.max(rawMinRepeats, rawMaxRepeats),
    minPlaybackRate: Math.min(rawMinRate, rawMaxRate),
    maxPlaybackRate: Math.max(rawMinRate, rawMaxRate),
    sleepTimerMinutes: clamp(finiteNumber(merged.sleepTimerMinutes, defaults.sleepTimerMinutes), 0, 240),
    enabledPhraseIds,
  };
}
