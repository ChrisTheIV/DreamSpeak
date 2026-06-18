import { getModeById, getVariationProfileById } from './audio-registry.js';

function clampRange(min, max) {
  return min <= max ? [min, max] : [max, min];
}

export class PhraseScheduler {
  constructor(registry, random = Math.random) {
    this.registry = registry;
    this.random = random;
    this.recentPhraseIds = [];
  }

  #randInt(min, max) {
    const [lo, hi] = clampRange(min, max);
    return Math.floor(lo + this.random() * (hi - lo + 1));
  }

  #randFloat(min, max) {
    const [lo, hi] = clampRange(min, max);
    return lo + this.random() * (hi - lo);
  }

  #resolvePhase(settings, elapsedSeconds) {
    const mode = getModeById(settings.modeId);
    if (mode.id === 'custom' || !mode.phases?.length) {
      return {
        id: 'custom',
        label: 'Custom timing',
        minDelaySeconds: settings.minDelaySeconds,
        maxDelaySeconds: settings.maxDelaySeconds,
        minRepeats: settings.minRepeats,
        maxRepeats: settings.maxRepeats,
      };
    }

    return mode.phases.find((phase) => phase.untilSeconds === null || elapsedSeconds < phase.untilSeconds)
      || mode.phases[mode.phases.length - 1];
  }

  buildPlan(settings, elapsedSeconds = 0) {
    const enabledPhrases = this.registry.phrases.filter((phrase) => settings.enabledPhraseIds.includes(phrase.id));
    if (enabledPhrases.length === 0) return null;

    const recentWindow = Math.min(3, Math.max(0, enabledPhrases.length - 1));
    const recentIds = this.recentPhraseIds.slice(-recentWindow);
    const candidatePool = enabledPhrases.filter((phrase) => !recentIds.includes(phrase.id));
    const pool = candidatePool.length > 0 ? candidatePool : enabledPhrases;
    const phrase = pool[Math.floor(this.random() * pool.length)] || pool[0];
    const phase = this.#resolvePhase(settings, elapsedSeconds);
    const variation = getVariationProfileById(settings.variationProfileId);
    const rateRange = settings.modeId === 'custom'
      ? [settings.minPlaybackRate, settings.maxPlaybackRate]
      : [variation.minPlaybackRate, variation.maxPlaybackRate];

    const plan = {
      phrase,
      phaseId: phase.id,
      phaseLabel: phase.label,
      repeatCount: this.#randInt(phase.minRepeats, phase.maxRepeats),
      delaySeconds: this.#randInt(phase.minDelaySeconds, phase.maxDelaySeconds),
      playbackRate: Number(this.#randFloat(rateRange[0], rateRange[1]).toFixed(2)),
      cueGapMs: this.#randInt(280, 680),
    };

    this.recentPhraseIds.push(phrase.id);
    this.recentPhraseIds = this.recentPhraseIds.slice(-8);
    return plan;
  }

  reset() {
    this.recentPhraseIds = [];
  }
}
