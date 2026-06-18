function clampRange(min, max) {
  return min <= max ? [min, max] : [max, min];
}

function randInt(min, max) {
  const [lo, hi] = clampRange(min, max);
  return Math.floor(lo + Math.random() * (hi - lo + 1));
}

function randFloat(min, max) {
  const [lo, hi] = clampRange(min, max);
  return lo + Math.random() * (hi - lo);
}

export class PhraseScheduler {
  constructor(registry) {
    this.registry = registry;
    this.recentPhraseIds = [];
  }

  buildPlan(settings) {
    const enabledPhrases = this.registry.phrases.filter((phrase) => settings.enabledPhraseIds.includes(phrase.id));
    const candidatePool = enabledPhrases.filter((phrase) => !this.recentPhraseIds.slice(-3).includes(phrase.id));
    const pool = candidatePool.length > 0 ? candidatePool : enabledPhrases;
    const phrase = pool[Math.floor(Math.random() * pool.length)] || enabledPhrases[0];
    const repeatCount = randInt(settings.minRepeats, settings.maxRepeats);
    const delaySeconds = randInt(settings.minDelaySeconds, settings.maxDelaySeconds);
    const playbackRate = Number(randFloat(settings.minPlaybackRate, settings.maxPlaybackRate).toFixed(2));
    this.recentPhraseIds.push(phrase.id);
    this.recentPhraseIds = this.recentPhraseIds.slice(-8);

    return {
      phrase,
      repeatCount,
      delaySeconds,
      playbackRate,
      cueGapMs: randInt(220, 520),
    };
  }
}
