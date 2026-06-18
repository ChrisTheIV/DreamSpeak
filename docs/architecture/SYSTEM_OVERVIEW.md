# System Overview

This repository is being set up for a lucid-dream intention audio app. The MVP is intentionally small: play background audio, randomly select from pre-recorded phrase clips, and vary timing, repeat count, speed, and pitch without adding TTS or AI generation.

## Core parts

### Audio Session Engine
Owns playback lifecycle: start, pause, stop, fade, and synchronization of ambient audio with phrase playback.

### Phrase Scheduler
Owns all randomization and sleep-friendly timing decisions. It selects which phrase to play, how many times to repeat it, how long to wait between groups, and which speed or pitch variation to apply.

### Audio Asset Registry
Tracks the available phrase files and background tracks. It is the source of truth for file IDs, labels, enabled flags, and any per-clip variation metadata.

### Preset Settings
Stores user-facing presets such as sleep onset, WBTB, and focus or affirmation modes. Presets should configure the scheduler and engine, not duplicate their logic.

### Sleep Timer
Optionally stops the session after a user-selected duration so the app can run as a passive sleep aid without staying on all night.

### Playback UI
Exposes start, pause, stop, preset selection, and volume or timing controls. The UI should send user intent to the engine and scheduler; it should not make playback decisions itself.

## MVP boundaries

- No TTS
- No REM detection
- No AI phrase generation
- Pre-recorded phrase files only
- Background audio and phrase audio stay separate
- Scheduler owns randomization; UI does not
- Sleep timer is optional and user-controlled

## Documentation rule

If an important file changes later, update its matching `.system.md` file in the same task.
