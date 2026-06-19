import { getMusicById, getVariationProfileById } from './audio-registry.js';

const BACKGROUND_FADE_MS = 320;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AudioPlaybackLayer {
  constructor({ onLog }) {
    this.onLog = onLog;
    this.abortResolvers = new Set();
    this.backgroundBufferCache = new Map();
    this.audioContext = null;
    this.activeBackgroundIndex = 0;
    this.backgroundDecks = [
      { source: null, gain: null, trackId: null },
      { source: null, gain: null, trackId: null },
    ];
    this.fallbackBackgroundAudios = [new Audio(), new Audio()];
    this.usingFallbackBackground = false;
    this.phraseAudio = new Audio();
    this.previewAudio = new Audio();

    for (const audio of this.fallbackBackgroundAudios) {
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

  #audioContextConstructor() {
    return globalThis.AudioContext || globalThis.webkitAudioContext || null;
  }

  async #ensureAudioContext() {
    const AudioContextConstructor = this.#audioContextConstructor();
    if (!AudioContextConstructor) return null;
    if (!this.audioContext) this.audioContext = new AudioContextConstructor();
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    return this.audioContext;
  }

  #activeDeck() {
    return this.backgroundDecks[this.activeBackgroundIndex];
  }

  #inactiveDeck() {
    return this.backgroundDecks[1 - this.activeBackgroundIndex];
  }

  #activeFallback() {
    return this.fallbackBackgroundAudios[this.activeBackgroundIndex];
  }

  #inactiveFallback() {
    return this.fallbackBackgroundAudios[1 - this.activeBackgroundIndex];
  }

  async #loadBackgroundBuffer(music) {
    if (this.backgroundBufferCache.has(music.src)) return this.backgroundBufferCache.get(music.src);
    const context = await this.#ensureAudioContext();
    if (!context) return null;
    const response = await fetch(music.src);
    if (!response.ok) throw new Error(`Could not load ${music.label} ambience.`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    this.backgroundBufferCache.set(music.src, buffer);
    return buffer;
  }

  #stopDeck(deck) {
    if (!deck) return;
    try {
      deck.source?.stop();
    } catch {
      // The source may already be stopped.
    }
    try {
      deck.source?.disconnect();
      deck.gain?.disconnect();
    } catch {
      // Disconnect is best-effort during teardown.
    }
    deck.source = null;
    deck.gain = null;
    deck.trackId = null;
  }

  #startDeck(deck, music, buffer, initialVolume) {
    const context = this.audioContext;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, initialVolume)), context.currentTime);
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    deck.source = source;
    deck.gain = gain;
    deck.trackId = music.id;
  }

  #rampDeckVolume(deck, target, durationMs = 180) {
    if (!deck?.gain || !this.audioContext) return;
    const gain = deck.gain.gain;
    const now = this.audioContext.currentTime;
    const safeTarget = Math.max(0, Math.min(1, target));
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(safeTarget, now + durationMs / 1000);
  }

  async #fadeFallbackVolume(audio, target, durationMs = 180) {
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

  async #setBackgroundVolume(target, durationMs = 180) {
    if (this.usingFallbackBackground) {
      await this.#fadeFallbackVolume(this.#activeFallback(), target, durationMs);
      return;
    }
    this.#rampDeckVolume(this.#activeDeck(), target, durationMs);
    await wait(durationMs);
  }

  async #startWebAudioBackground(music, volume) {
    const buffer = await this.#loadBackgroundBuffer(music);
    if (!buffer) return false;
    const active = this.#activeDeck();
    this.#stopDeck(active);
    this.#startDeck(active, music, buffer, 0);
    this.#rampDeckVolume(active, volume, BACKGROUND_FADE_MS);
    this.usingFallbackBackground = false;
    return true;
  }

  async #startFallbackBackground(music, volume) {
    const active = this.#activeFallback();
    active.pause();
    active.currentTime = 0;
    active.src = music.src;
    active.volume = 0;
    await active.play().catch(() => undefined);
    this.#fadeFallbackVolume(active, volume, BACKGROUND_FADE_MS).catch(() => undefined);
    this.usingFallbackBackground = true;
  }

  async #switchWebAudioBackground(music, volume) {
    const buffer = await this.#loadBackgroundBuffer(music);
    if (!buffer) return false;
    const outgoing = this.#activeDeck();
    const incoming = this.#inactiveDeck();
    this.#stopDeck(incoming);
    this.#startDeck(incoming, music, buffer, 0);
    this.#rampDeckVolume(outgoing, 0, BACKGROUND_FADE_MS);
    this.#rampDeckVolume(incoming, volume, BACKGROUND_FADE_MS);
    await wait(BACKGROUND_FADE_MS + 40);
    this.#stopDeck(outgoing);
    this.activeBackgroundIndex = 1 - this.activeBackgroundIndex;
    return true;
  }

  async #switchFallbackBackground(music, volume) {
    const outgoing = this.#activeFallback();
    const incoming = this.#inactiveFallback();
    incoming.pause();
    incoming.currentTime = 0;
    incoming.src = music.src;
    incoming.volume = 0;
    await incoming.play().catch(() => undefined);
    await Promise.all([
      this.#fadeFallbackVolume(outgoing, 0, BACKGROUND_FADE_MS),
      this.#fadeFallbackVolume(incoming, volume, BACKGROUND_FADE_MS),
    ]);
    outgoing.pause();
    outgoing.currentTime = 0;
    this.activeBackgroundIndex = 1 - this.activeBackgroundIndex;
  }

  async #switchBackgroundTrack(music, volume, state) {
    if (state !== 'running') {
      this.stopBackground();
      return;
    }

    try {
      const switched = await this.#switchWebAudioBackground(music, volume);
      if (!switched) await this.#switchFallbackBackground(music, volume);
    } catch (error) {
      this.onLog?.(`${error.message} Falling back to standard audio playback.`);
      this.stopBackground();
      await this.#startFallbackBackground(music, volume);
    }
    this.onLog?.(`Background changed to ${music.label}.`);
  }

  async applySettings(previous, next, state, isPhrasePlaying) {
    const music = getMusicById(next.selectedMusicId);
    const targetVolume = next.musicVolume * (isPhrasePlaying ? next.ambienceDuringPhraseRatio : 1);

    if (previous?.selectedMusicId !== next.selectedMusicId && state === 'running') {
      await this.#switchBackgroundTrack(music, targetVolume, state);
    } else if (state === 'running') {
      await this.#setBackgroundVolume(targetVolume, 120);
    }

    this.phraseAudio.volume = next.phraseVolume;
  }

  async startBackground(settings) {
    this.previewAudio.pause();
    this.previewAudio.currentTime = 0;
    const music = getMusicById(settings.selectedMusicId);
    this.stopBackground();

    try {
      const started = await this.#startWebAudioBackground(music, settings.musicVolume);
      if (!started) await this.#startFallbackBackground(music, settings.musicVolume);
    } catch (error) {
      this.onLog?.(`${error.message} Falling back to standard audio playback.`);
      this.stopBackground();
      await this.#startFallbackBackground(music, settings.musicVolume);
    }
  }

  stopBackground() {
    for (const deck of this.backgroundDecks) this.#stopDeck(deck);
    for (const audio of this.fallbackBackgroundAudios) {
      audio.pause();
      audio.currentTime = 0;
    }
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
    let metadataHandler;
    let endedHandler;
    let errorHandler;

    const ended = new Promise((resolve) => {
      endedHandler = () => resolve(true);
      errorHandler = () => resolve(false);
      audio.addEventListener('ended', endedHandler, { once: true });
      audio.addEventListener('error', errorHandler, { once: true });
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
      audio.removeEventListener('ended', endedHandler);
      audio.removeEventListener('error', errorHandler);
      return false;
    }

    this.#fadeFallbackVolume(audio, targetVolume, fadeMs).catch(() => undefined);
    const scheduleFadeOut = () => {
      const durationMs = Number.isFinite(audio.duration) ? (audio.duration * 1000) / Math.max(0.1, rate) : 0;
      if (durationMs > fadeMs * 2) {
        fadeOutTimer = setTimeout(
          () => this.#fadeFallbackVolume(audio, 0, fadeMs).catch(() => undefined),
          durationMs - fadeMs,
        );
      }
    };
    if (audio.readyState >= 1) scheduleFadeOut();
    else {
      metadataHandler = scheduleFadeOut;
      audio.addEventListener('loadedmetadata', metadataHandler, { once: true });
    }

    try {
      return (await Promise.race([ended, aborted])) === true;
    } finally {
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      if (metadataHandler) audio.removeEventListener('loadedmetadata', metadataHandler);
      audio.removeEventListener('ended', endedHandler);
      audio.removeEventListener('error', errorHandler);
      this.abortResolvers.delete(abortResolver);
    }
  }

  async playPhraseGroup(plan, settings, isRunning, onCue) {
    await this.#setBackgroundVolume(
      settings.musicVolume * settings.ambienceDuringPhraseRatio,
      140,
    );
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
      if (isRunning()) await this.#setBackgroundVolume(settings.musicVolume, 180);
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
    this.stopBackground();
    this.phraseAudio.pause();
    this.#releaseAbortWaiters();
  }

  stop() {
    this.stopBackground();
    this.phraseAudio.pause();
    this.phraseAudio.currentTime = 0;
    this.#releaseAbortWaiters();
  }

  dispose() {
    this.stop();
    this.previewAudio.pause();
    this.previewAudio.currentTime = 0;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => undefined);
    }
  }
}
