# Locked System Decisions

- LSD-001: No TTS in MVP.
  - The app uses pre-recorded phrase files only.

- LSD-002: PhraseScheduler owns random phrase, repeat, delay, speed, and pitch decisions.
  - UI controls only configure the scheduler.

- LSD-003: AudioSessionEngine owns playback lifecycle.
  - It starts, pauses, stops, and coordinates playback layers.

- LSD-004: UI must not contain scheduling or randomization logic.
  - The UI should pass intent and render state, not decide playback.

- LSD-005: Background audio and phrase audio are separate layers.
  - They should be independently controllable.

- LSD-006: Randomness must be bounded and sleep-friendly.
  - Delays, repeats, and variation must stay within configured ranges.

- LSD-007: Docs must update when important files change.
  - Update the matching `.system.md` file in the same task.
