# Locked System Decisions

- LSD-001: No TTS in MVP.
  - The app uses pre-recorded phrase files only.

- LSD-002: `PhraseScheduler` owns random phrase, repeat, delay, phase, speed, and pitch decisions.
  - UI controls configure the scheduler; they do not randomize playback.

- LSD-003: `AudioSessionEngine` owns session lifecycle.
  - It starts, pauses, resumes, stops, coordinates the scheduler and playback layer, and executes the sleep timer.

- LSD-004: UI must not contain scheduling or randomization logic.
  - The UI passes intent and renders state.

- LSD-005: Background audio and phrase audio are separate layers.
  - They remain independently controllable, and ambience may duck under phrases.

- LSD-006: Randomness must be bounded and sleep-safe.
  - Delays, repeats, rates, fades, and volume remain within configured limits.

- LSD-007: Docs must update when important files change.
  - Update the matching `.system.md` file in the same task.

- LSD-008: Edge of sleep is the default and defining mode.
  - It intentionally uses frequent, unpredictable cues to catch the user drifting and resist full sleep onset.
  - It must not silently become a passive meditation or long-gap sleep track.

- LSD-009: Presets define phase bounds; the scheduler applies them.
  - Edge, WBTB, and Nap expose simple user choices while Custom preserves direct control.

- LSD-010: Session outcome feedback is optional and local.
  - It stays lightweight and must not grow into a mandatory dream journal inside this MVP.
