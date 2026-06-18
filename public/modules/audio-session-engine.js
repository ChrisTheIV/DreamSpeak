import { getModeById, getMusicById, normalizeSettings } from './audio-registry.js';
import { AudioPlaybackLayer } from './audio-playback-layer.js';

function nowLabel(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export class AudioSessionEngine {
  constructor({ registry, scheduler, onStateChange, onPlan, onLog, onSessionEnd }) {
    this.registry = registry;
    this.scheduler = scheduler;
    this.onStateChange = onStateChange;
    this.onPlan = onPlan;
    this.onLog = onLog;
    this.onSessionEnd = onSessionEnd;
    this.settings = null;
    this.state = 'idle';
    this.accumulatedElapsedMs = 0;
    this.runningSegmentStartedAt = null;
    this.pendingTimeout = null;
    this.sleepTimerTimeout = null;
    this.sleepTimerDeadline = null;
    this.sleepTimerRemainingMs = null;
    this.currentPlan = null;
    this.currentPhrase = null;
    this.nextCueAt = null;
    this.cueCount = 0;
    this.playback = new AudioPlaybackLayer({ onLog });
  }

  #elapsedMs(now = Date.now()) {
    if (this.state === 'running' && this.runningSegmentStartedAt) {
      return this.accumulatedElapsedMs + (now - this.runningSegmentStartedAt);
    }
    return this.accumulatedElapsedMs;
  }

  async applySettings(nextSettings) {
    const previous = this.settings;
    this.settings = normalizeSettings(nextSettings);
    await this.playback.applySettings(previous, this.settings, this.state, Boolean(this.currentPhrase));
    if (this.state === 'idle') {
      this.sleepTimerRemainingMs = this.settings.sleepTimerMinutes > 0
        ? this.settings.sleepTimerMinutes * 60000
        : null;
      this.sleepTimerDeadline = null;
    } else if (this.state === 'running' && previous?.sleepTimerMinutes !== this.settings.sleepTimerMinutes) {
      const duration = this.settings.sleepTimerMinutes * 60000;
      if (duration > 0) this.#armSleepTimer(duration);
      else {
        this.#clearSleepTimer();
        this.sleepTimerDeadline = null;
        this.sleepTimerRemainingMs = null;
      }
      this.#log(this.settings.sleepTimerMinutes > 0
        ? `Sleep timer reset to ${this.settings.sleepTimerMinutes} minutes.`
        : 'Sleep timer turned off.');
    }
    this.#emitState();
  }

  getSnapshot(now = Date.now()) {
    const elapsedMs = this.#elapsedMs(now);
    const countdownSeconds = this.nextCueAt
      ? Math.max(0, Math.ceil((this.nextCueAt - now) / 1000))
      : null;
    const sleepTimerLabel = this.sleepTimerDeadline
      ? `${Math.max(1, Math.ceil(Math.max(0, this.sleepTimerDeadline - now) / 60000))}m left`
      : this.settings?.sleepTimerMinutes > 0
        ? `${this.settings.sleepTimerMinutes}m`
        : 'Off';
    return {
      state: this.state,
      elapsedMs,
      elapsedLabel: nowLabel(elapsedMs),
      modeLabel: getModeById(this.settings?.modeId).label,
      phaseLabel: this.currentPlan?.phaseLabel || 'Waiting to begin',
      currentPhraseLabel: this.currentPhrase?.label || 'Silent',
      nextPhraseLabel: this.currentPlan?.phrase?.label || 'Waiting',
      nextCueCountdown: countdownSeconds,
      nextCueLabel: countdownSeconds === null ? 'Waiting' : `${countdownSeconds}s`,
      repeatLabel: this.currentPlan ? `${this.currentPlan.repeatCount}x` : '—',
      playbackRateLabel: this.currentPlan ? `${this.currentPlan.playbackRate.toFixed(2)}x` : '—',
      musicLabel: getMusicById(this.settings?.selectedMusicId).label,
      sleepTimerLabel,
      cueCount: this.cueCount,
      canStart: Boolean(this.settings?.enabledPhraseIds?.length),
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
    this.nextCueAt = null;
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
      this.stop('timer');
    }, durationMs);
  }

  async #playPhraseGroup(plan) {
    this.currentPhrase = plan.phrase;
    this.nextCueAt = null;
    this.#emitState();
    this.#log(`Playing “${plan.phrase.label}” at ${plan.playbackRate.toFixed(2)}x for ${plan.repeatCount} repeat(s).`);
    try {
      await this.playback.playPhraseGroup(
        plan,
        this.settings,
        () => this.state === 'running',
        () => { this.cueCount += 1; },
      );
    } finally {
      this.currentPhrase = null;
      this.#emitState();
    }
  }

  async #runLoop() {
    if (this.state !== 'running') return;
    const plan = this.scheduler.buildPlan(this.settings, this.#elapsedMs() / 1000);
    if (!plan) {
      this.#log('Select at least one phrase before starting.');
      await this.stop('invalid');
      return;
    }
    this.currentPlan = plan;
    this.nextCueAt = Date.now() + plan.delaySeconds * 1000;
    this.onPlan?.(plan);
    this.#emitState();
    this.#log(`Next surprise in ${plan.delaySeconds}s: ${plan.phrase.label}`);
    this.pendingTimeout = setTimeout(async () => {
      this.pendingTimeout = null;
      if (this.state !== 'running') return;
      await this.#playPhraseGroup(plan);
      if (this.state === 'running') await this.#runLoop();
    }, plan.delaySeconds * 1000);
  }

  async start() {
    if (!this.settings) throw new Error('Settings must be applied before starting.');
    if (this.settings.enabledPhraseIds.length === 0) {
      this.#log('Select at least one phrase before starting.');
      this.#emitState();
      return false;
    }
    if (this.state === 'running') return true;
    const wasPaused = this.state === 'paused';
    if (this.state === 'idle') {
      this.accumulatedElapsedMs = 0;
      this.cueCount = 0;
      this.currentPlan = null;
      this.scheduler.reset?.();
      this.sleepTimerRemainingMs = this.settings.sleepTimerMinutes > 0
        ? this.settings.sleepTimerMinutes * 60000
        : null;
    }
    this.state = 'running';
    this.runningSegmentStartedAt = Date.now();
    await this.playback.startBackground(this.settings);
    if (this.sleepTimerRemainingMs && this.sleepTimerRemainingMs > 0) {
      this.#armSleepTimer(this.sleepTimerRemainingMs);
    }
    this.#log(wasPaused ? 'Session resumed.' : 'Edge session started.');
    this.#emitState();
    await this.#runLoop();
    return true;
  }

  async pause() {
    if (this.state !== 'running') return;
    this.accumulatedElapsedMs = this.#elapsedMs();
    this.runningSegmentStartedAt = null;
    this.state = 'paused';
    this.#clearPending();
    if (this.sleepTimerDeadline) {
      this.sleepTimerRemainingMs = Math.max(0, this.sleepTimerDeadline - Date.now());
      this.sleepTimerDeadline = null;
      this.#clearSleepTimer();
    }
    this.playback.pause();
    this.currentPhrase = null;
    this.#log('Session paused.');
    this.#emitState();
  }

  async stop(reason = 'manual') {
    if (this.state === 'idle') return;
    if (this.state === 'running') this.accumulatedElapsedMs = this.#elapsedMs();
    const summary = {
      modeId: this.settings?.modeId,
      elapsedMs: this.accumulatedElapsedMs,
      cueCount: this.cueCount,
      stoppedBy: reason,
      endedAt: new Date().toISOString(),
    };
    this.state = 'idle';
    this.runningSegmentStartedAt = null;
    this.#clearPending();
    this.#clearSleepTimer();
    this.playback.stop();
    this.currentPlan = null;
    this.currentPhrase = null;
    this.sleepTimerDeadline = null;
    this.sleepTimerRemainingMs = this.settings?.sleepTimerMinutes > 0
      ? this.settings.sleepTimerMinutes * 60000
      : null;
    this.accumulatedElapsedMs = 0;
    this.#log('Session stopped.');
    this.#emitState();
    if (summary.elapsedMs > 0 && reason !== 'dispose') this.onSessionEnd?.(summary);
  }

  async previewPhrase(phrase) {
    if (!phrase || this.state !== 'idle') return false;
    this.#log(`Previewing “${phrase.label}”.`);
    return this.playback.previewPhrase(phrase, this.settings);
  }

  updateElapsed() {
    if (this.state === 'running') this.#emitState();
  }

  dispose() {
    this.stop('dispose');
    this.playback.dispose();
  }
}
