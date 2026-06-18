import { getMusicById, getVariationProfileById } from './audio-registry.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AudioPlaybackLayer {
  constructor({ onLog }) {
    this.onLog = onLog;
    this.activeBackgroundIndex = 0;
    this.abortResolvers = new Set();
    this.backgroundAudios = [new Audio(), new Audio()];
    this.phraseAudio = new Audio();
    this.previewAudio = new Audio();
    for (const audio of this.backgroundAudios) {
      audio.loop = true;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
    }
    for (const audio of [this.phraseAudio, this.previewAudio]) {
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.preservesPitch = false;
      audio.webkitPreservesPitch = false;
      audio.mozPreservesPitch = false;
    }
  }

  #activeBackground() {
    return this.backgroundAudios[this.activeBackgroundIndex];
  }

  #inactiveBackground() {
    return this.backgroundAudios[1 - this.activeBackgroundIndex];
  }

  async #fadeVolume(audio, target, durationMs = 180) {
    const safeTarget = Math.max(0, Math.min(1, target));
    if (durationMs <= 0) {
      audio.volume = safeTarget;
      return;
    }
    const start = audio.volume;
    const startedAt = performance.now();
    while (performance.now() - startedAt < durationMs) {
      const progress = (performance.now() - startedAt) / durationMs;
      audio.volume = start + (safeTarget - start) * Math.min(1, progress);
      await wait(20);
    }
    audio.volume = safeTarget;
  }

  async #switchBackgroundTrack(music, volume, state) {
    const active = this.#activeBackground();
    if (state !== 'running') {
      active.pause();
      active.currentTime = 0;
      active.src = music.src;
      active.volume = volume;
      return;
    }
    const incoming = this.#inactiveBackground();
    incoming.pause();
    incoming.currentTime = 0;
    incoming.src = music.src;
    incoming.volume = 0;
    await incoming.play().catch(() => undefined);
    await Promise.all([
      this.#fadeVolume(active, 0, 280),
      this.#fadeVolume(incoming, volume, 280),
    ]);
    active.pause();
    active.currentTime = 0;
    this.activeBackgroundIndex = 1 - this.activeBackgroundIndex;
    this.onLog?.(`Background changed to ${music.label}.`);
  }

  async applySettings(previous, next, state, isPhrasePlaying) {
    const music = getMusicById(next.selectedMusicId);
    if (!previous) {
      const active = this.#activeBackground();
      active.src = music.src;
      active.volume = next.musicVolume;
    } else if (previous.selectedMusicId !== next.selectedMusicId) {
      await this.#switchBackgroundTrack(music, next.musicVolume, state);
    } else {
      this.#activeBackground().volume = isPhrasePlaying ? next.musicVolume * 0.32 : next.musicVolume;
    }
    this.phraseAudio.volume = next.phraseVolume;
  }

  async startBackground(settings) {
    this.previewAudio.pause();
    this.previewAudio.currentTime = 0;
    const background = this.#activeBackground();
    background.src = getMusicById(settings.selectedMusicId).src;
    background.volume = 0;
    await background.play().catch(() => undefined);
    this.#fadeVolume(background, settings.musicVolume, 350).catch(() => undefined);
  }

  #releaseAbortWaiters() {
    for (const resolve of this.abortResolvers) resolve();
    this.abortResolvers.clear();
  }

  #waitForAbortableDelay(ms) {
    return new Promise((resolve) => {
      const abort = () => {
        this.abortResolvers.delete(abort);
        clearTimeout(timer);
        resolve(false);
      };
      const timer = setTimeout(() => {
        this.abortResolvers.delete(abort);
        resolve(true);
      }, ms);
      this.abortResolvers.add(abort);
    });
  }

  async #playAudio(audio, src, rate, targetVolume, fadeMs = 160) {
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.volume = 0;
    audio.playbackRate = rate;
    audio.preservesPitch = false;
    audio.webkitPreservesPitch = false;
    audio.mozPreservesPitch = false;
    let abortResolver;
    let fadeOutTimer;
    const ended = new Promise((resolve) => {
      audio.addEventListener('ended', () => resolve(true), { once: true });
      audio.addEventListener('error', () => resolve(false), { once: true });
    });
    const aborted = new Promise((resolve) => {
      abortResolver = () => {
        audio.pause();
        resolve(false);
      };
      this.abortResolvers.add(abortResolver);
    });
    const played = await audio.play().then(() => true).catch(() => false);
    if (!played) {
      this.abortResolvers.delete(abortResolver);
      return false;
    }
    this.#fadeVolume(audio, targetVolume, fadeMs).catch(() => undefined);
    const scheduleFadeOut = () => {
      const durationMs = Number.isFinite(audio.duration) ? (audio.duration * 1000) / Math.max(0.1, rate) : 0;
      if (durationMs > fadeMs * 2) {
        fadeOutTimer = setTimeout(
          () => this.#fadeVolume(audio, 0, fadeMs).catch(() => undefined),
          durationMs - fadeMs,
        );
      }
    };
    if (audio.readyState >= 1) scheduleFadeOut();
    else audio.addEventListener('loadedmetadata', scheduleFadeOut, { once: true });
    try {
      return (await Promise.race([ended, aborted])) === true;
    } finally {
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      this.abortResolvers.delete(abortResolver);
    }
  }

  async playPhraseGroup(plan, settings, isRunning, onCue) {
    const background = this.#activeBackground();
    await this.#fadeVolume(background, settings.musicVolume * 0.32, 180);
    try {
      for (let index = 0; index < plan.repeatCount; index += 1) {
        if (!isRunning()) return false;
        const completed = await this.#playAudio(
          this.phraseAudio,
          plan.phrase.src,
          plan.playbackRate,
          settings.phraseVolume,
        );
        if (!completed || !isRunning()) return false;
        onCue?.();
        if (index < plan.repeatCount - 1) {
          const gapCompleted = await this.#waitForAbortableDelay(plan.cueGapMs);
          if (!gapCompleted || !isRunning()) return false;
        }
      }
      return true;
    } finally {
      if (isRunning()) await this.#fadeVolume(background, settings.musicVolume, 220);
    }
  }

  async previewPhrase(phrase, settings) {
    const profile = getVariationProfileById(settings.variationProfileId);
    const minRate = settings.modeId === 'custom' ? settings.minPlaybackRate : profile.minPlaybackRate;
    const maxRate = settings.modeId === 'custom' ? settings.maxPlaybackRate : profile.maxPlaybackRate;
    const rate = Number(((minRate + maxRate) / 2).toFixed(2));
    return this.#playAudio(this.previewAudio, phrase.src, rate, settings.phraseVolume, 120);
  }

  pause() {
    for (const audio of this.backgroundAudios) audio.pause();
    this.phraseAudio.pause();
    this.#releaseAbortWaiters();
  }

  stop() {
    for (const audio of [...this.backgroundAudios, this.phraseAudio]) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.#releaseAbortWaiters();
  }

  dispose() {
    this.stop();
    this.previewAudio.pause();
    this.previewAudio.currentTime = 0;
  }
}
