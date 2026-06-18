import { getMusicById } from './audio-registry.js';

function nowLabel(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export class AudioSessionEngine {
  constructor({ registry, scheduler, onStateChange, onPlan, onLog }) {
    this.registry = registry;
    this.scheduler = scheduler;
    this.onStateChange = onStateChange;
    this.onPlan = onPlan;
    this.onLog = onLog;
    this.settings = null;
    this.state = 'idle';
    this.startAt = null;
    this.elapsedMs = 0;
    this.pendingTimeout = null;
    this.sleepTimerTimeout = null;
    this.sleepTimerDeadline = null;
    this.sleepTimerRemainingMs = null;
    this.abortResolvers = new Set();
    this.currentPlan = null;
    this.backgroundAudio = new Audio();
    this.phraseAudio = new Audio();
    this.backgroundAudio.loop = true;
    this.backgroundAudio.preload = 'auto';
    this.phraseAudio.preload = 'auto';
    this.backgroundAudio.crossOrigin = 'anonymous';
    this.phraseAudio.crossOrigin = 'anonymous';
    this.backgroundAudio.preservesPitch = false;
    this.phraseAudio.preservesPitch = false;
  }

  applySettings(settings) {
    this.settings = structuredClone(settings);
    const music = getMusicById(this.settings.selectedMusicId);
    this.backgroundAudio.src = music.src;
    this.backgroundAudio.volume = this.settings.musicVolume;
    this.phraseAudio.volume = this.settings.phraseVolume;
    if (this.state === 'idle') {
      this.sleepTimerRemainingMs = this.settings.sleepTimerMinutes > 0 ? this.settings.sleepTimerMinutes * 60000 : null;
      this.sleepTimerDeadline = null;
    }
  }

  getSnapshot() {
    const sleepTimerLabel = this.sleepTimerDeadline
      ? `${Math.max(1, Math.ceil(Math.max(0, this.sleepTimerDeadline - Date.now()) / 60000))}m left`
      : this.settings?.sleepTimerMinutes > 0
        ? `${this.settings.sleepTimerMinutes}m`
        : 'Off';

    return {
      state: this.state,
      elapsedLabel: nowLabel(this.elapsedMs),
      currentPhraseLabel: this.currentPlan?.phrase?.label || 'Nothing yet',
      nextDelayLabel: this.currentPlan ? `${this.currentPlan.delaySeconds}s` : 'Waiting',
      repeatLabel: this.currentPlan ? `${this.currentPlan.repeatCount}x` : 'Waiting',
      playbackRateLabel: this.currentPlan ? `${this.currentPlan.playbackRate.toFixed(2)}x` : 'Waiting',
      musicLabel: getMusicById(this.settings?.selectedMusicId).label,
      sleepTimerLabel,
    };
  }

  #emitState() {
    this.onStateChange?.(this.getSnapshot());
  }

  #log(message) {
    this.onLog?.(message);
  }

  #clearPending() {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  #clearSleepTimer() {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }
  }

  #armSleepTimer(durationMs) {
    this.#clearSleepTimer();

    if (durationMs <= 0) {
      this.sleepTimerDeadline = null;
      this.sleepTimerRemainingMs = null;
      return;
    }

    this.sleepTimerRemainingMs = durationMs;
    this.sleepTimerDeadline = Date.now() + durationMs;
    this.sleepTimerTimeout = setTimeout(() => {
      this.sleepTimerTimeout = null;
      this.sleepTimerDeadline = null;
      this.sleepTimerRemainingMs = null;
      this.#log('Sleep timer reached. Session stopped.');
      this.stop();
    }, durationMs);
  }

  #releaseAbortWaiters() {
    for (const resolve of this.abortResolvers) {
      resolve();
    }
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

  async #playAudio(audio, src, rate, volume) {
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.volume = volume;
    audio.playbackRate = rate;
    audio.preservesPitch = false;
    audio.webkitPreservesPitch = false;
    audio.mozPreservesPitch = false;

    let abortResolver;
    const ended = new Promise((resolve) => {
      const handler = () => {
        audio.removeEventListener('ended', handler);
        resolve(true);
      };
      audio.addEventListener('ended', handler);
    });

    const aborted = new Promise((resolve) => {
      abortResolver = () => resolve(false);
      this.abortResolvers.add(abortResolver);
    });

    const played = await audio.play().then(() => true).catch(() => false);
    if (!played) {
      this.abortResolvers.delete(abortResolver);
      return false;
    }

    try {
      const outcome = await Promise.race([ended, aborted]);
      return outcome === true;
    } finally {
      this.abortResolvers.delete(abortResolver);
    }
  }

  async #playPhraseGroup(plan) {
    this.currentPlan = plan;
    this.onPlan?.(plan);
    this.#emitState();
    this.#log(`Playing "${plan.phrase.label}" at ${plan.playbackRate.toFixed(2)}x for ${plan.repeatCount} repeat(s).`);

    for (let index = 0; index < plan.repeatCount; index += 1) {
      if (this.state !== 'running') return;
      const completed = await this.#playAudio(this.phraseAudio, plan.phrase.src, plan.playbackRate, this.settings.phraseVolume);
      if (!completed || this.state !== 'running') return;
      if (index < plan.repeatCount - 1) {
        const gapCompleted = await this.#waitForAbortableDelay(plan.cueGapMs);
        if (!gapCompleted || this.state !== 'running') return;
      }
    }
  }

  async #runLoop() {
    while (this.state === 'running') {
      const plan = this.scheduler.buildPlan(this.settings);
      this.currentPlan = plan;
      this.onPlan?.(plan);
      this.#emitState();
      this.#log(`Next cue in ${plan.delaySeconds}s: ${plan.phrase.label}`);
      this.pendingTimeout = setTimeout(async () => {
        this.pendingTimeout = null;
        if (this.state !== 'running') return;
        await this.#playPhraseGroup(plan);
        if (this.state === 'running') {
          this.#runLoop();
        }
      }, plan.delaySeconds * 1000);
      return;
    }
  }

  async start() {
    if (!this.settings) {
      throw new Error('Settings must be applied before starting.');
    }

    if (this.state === 'running') return;
    if (this.state === 'idle') {
      this.startAt = Date.now();
      this.elapsedMs = 0;
      this.sleepTimerRemainingMs = this.settings.sleepTimerMinutes > 0 ? this.settings.sleepTimerMinutes * 60000 : null;
    }

    this.state = 'running';
    this.backgroundAudio.src = getMusicById(this.settings.selectedMusicId).src;
    this.backgroundAudio.volume = this.settings.musicVolume;
    if (this.sleepTimerRemainingMs && this.sleepTimerRemainingMs > 0) {
      this.#armSleepTimer(this.sleepTimerRemainingMs);
    }
    await this.backgroundAudio.play().catch(() => undefined);
    this.#log('Session started.');
    this.#emitState();
    await this.#runLoop();
  }

  async pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.#clearPending();
    if (this.sleepTimerDeadline) {
      this.sleepTimerRemainingMs = Math.max(0, this.sleepTimerDeadline - Date.now());
      this.sleepTimerDeadline = null;
      this.#clearSleepTimer();
    }
    this.backgroundAudio.pause();
    this.phraseAudio.pause();
    this.#releaseAbortWaiters();
    this.#log('Session paused.');
    this.#emitState();
  }

  async stop() {
    if (this.state === 'idle') return;
    this.state = 'idle';
    this.#clearPending();
    this.#clearSleepTimer();
    this.backgroundAudio.pause();
    this.backgroundAudio.currentTime = 0;
    this.phraseAudio.pause();
    this.phraseAudio.currentTime = 0;
    this.#releaseAbortWaiters();
    this.currentPlan = null;
    this.elapsedMs = 0;
    this.startAt = null;
    this.sleepTimerDeadline = null;
    this.sleepTimerRemainingMs = this.settings?.sleepTimerMinutes > 0 ? this.settings.sleepTimerMinutes * 60000 : null;
    this.#log('Session stopped.');
    this.#emitState();
  }

  updateElapsed(now = Date.now()) {
    if (this.state === 'running' && this.startAt) {
      this.elapsedMs = now - this.startAt;
      this.#emitState();
    }
  }

  dispose() {
    this.stop();
  }
}
