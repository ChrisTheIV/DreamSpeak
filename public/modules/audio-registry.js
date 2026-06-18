const PHRASES = [
  { id: 'phrase-01', label: 'Am I dreaming?', src: '/audio/phrases/phrase-01.wav' },
  { id: 'phrase-02', label: 'Notice anything strange.', src: '/audio/phrases/phrase-02.wav' },
  { id: 'phrase-03', label: 'Look at your hands.', src: '/audio/phrases/phrase-03.wav' },
  { id: 'phrase-04', label: 'Stay aware.', src: '/audio/phrases/phrase-04.wav' },
  { id: 'phrase-05', label: 'This is a dream.', src: '/audio/phrases/phrase-05.wav' },
  { id: 'phrase-06', label: 'Remember the dream state.', src: '/audio/phrases/phrase-06.wav' },
  { id: 'phrase-07', label: 'Keep a thread of awareness.', src: '/audio/phrases/phrase-07.wav' },
  { id: 'phrase-08', label: 'I will know when I am dreaming.', src: '/audio/phrases/phrase-08.wav' },
  { id: 'phrase-09', label: 'Question the scene.', src: '/audio/phrases/phrase-09.wav' },
  { id: 'phrase-10', label: 'Watch for impossible details.', src: '/audio/phrases/phrase-10.wav' },
  { id: 'phrase-11', label: 'Re-center your attention.', src: '/audio/phrases/phrase-11.wav' },
  { id: 'phrase-12', label: 'Stay calm and alert.', src: '/audio/phrases/phrase-12.wav' },
  { id: 'phrase-13', label: 'This could be a dream.', src: '/audio/phrases/phrase-13.wav' },
  { id: 'phrase-14', label: 'Recognize the dream.', src: '/audio/phrases/phrase-14.wav' },
  { id: 'phrase-15', label: 'Hold the intention.', src: '/audio/phrases/phrase-15.wav' },
  { id: 'phrase-16', label: 'Check reality gently.', src: '/audio/phrases/phrase-16.wav' },
  { id: 'phrase-17', label: 'Notice the shift.', src: '/audio/phrases/phrase-17.wav' },
  { id: 'phrase-18', label: 'Stay in the moment.', src: '/audio/phrases/phrase-18.wav' },
  { id: 'phrase-19', label: 'Remember to recognize.', src: '/audio/phrases/phrase-19.wav' },
  { id: 'phrase-20', label: 'Lana.', src: '/audio/phrases/tmp6jpccqe0.wav' },
];

const MUSIC_TRACKS = [
  { id: 'rain', label: 'Rain', src: '/audio/music/rain.wav' },
  { id: 'ocean', label: 'Ocean', src: '/audio/music/ocean.wav' },
  { id: 'drift', label: 'Soft drift', src: '/audio/music/drift.wav' },
];

export const audioRegistry = {
  phrases: PHRASES,
  musicTracks: MUSIC_TRACKS,
};

export function createDefaultSettings() {
  return {
    selectedMusicId: MUSIC_TRACKS[0].id,
    phraseVolume: 0.7,
    musicVolume: 0.22,
    minDelaySeconds: 10,
    maxDelaySeconds: 24,
    minRepeats: 1,
    maxRepeats: 3,
    minPlaybackRate: 0.95,
    maxPlaybackRate: 1.08,
    sleepTimerMinutes: 0,
    enabledPhraseIds: PHRASES.map((phrase) => phrase.id),
  };
}

export function getPhraseById(id) {
  return PHRASES.find((phrase) => phrase.id === id) || PHRASES[0];
}

export function getMusicById(id) {
  return MUSIC_TRACKS.find((track) => track.id === id) || MUSIC_TRACKS[0];
}
