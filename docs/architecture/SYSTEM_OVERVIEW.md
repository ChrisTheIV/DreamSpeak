# System Overview

DreamSpeak is a browser-based lucid-dream intention audio app built around **semi-intentional sleep interruption**. Its defining mode plays bounded but unpredictable pre-recorded cues often enough to catch the user while drifting and resist full sleep onset. It does not claim to detect REM or sleep stages.

## Product model

A session combines:
- one session mode
- one phrase goal/set with individually enabled clips
- one ambient track
- one voice-variation profile
- an optional sleep timer
- optional advanced timing overrides

`Edge of sleep` is the default mode. It deliberately keeps gaps short and unpredictable across three phases: Settling, Threshold, and Holding the edge. WBTB and Nap are optional alternatives. Custom exposes direct timing controls.

## Core parts

### Audio Session Engine
Owns start, pause, resume, stop, active elapsed time, sleep timer execution, countdown state, and session summaries. It coordinates the scheduler with the playback layer.

### Audio Playback Layer
Owns browser audio elements, ambient crossfades, phrase fades, ambient ducking, cue repeats, preview playback, pause, and stop.

### Phrase Scheduler
Owns all bounded randomization. It selects the phrase, phase-aware delay, repeat count, cue gap, and playback rate. The UI never makes random scheduling decisions.

### Audio Asset Registry
Owns canonical phrase clips, phrase categories, goal sets, ambient tracks, session modes, phase bounds, variation profiles, and settings normalization.

### Playback UI
Owns configuration, local persistence, phrase selection and preview actions, live rendering, optional outcome feedback, and state-appropriate controls. Detailed numeric settings are secondary to the bedtime workflow.

### Local Session Feedback
Stores a small optional local history containing session summary, outcome, and cue-intensity rating. It is not a dream journal and does not send data to a server.

## MVP boundaries

- No TTS
- No REM detection
- No AI phrase generation
- Pre-recorded phrase files only
- Background audio and phrase audio remain separate
- Scheduler owns randomization and phase selection
- Edge mode must remain surprise-oriented and interruption-capable
- Feedback is optional and local

## Documentation rule

If an important file changes, update its matching `.system.md` file in the same task.
