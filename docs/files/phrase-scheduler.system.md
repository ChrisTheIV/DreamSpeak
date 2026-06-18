# `public/modules/phrase-scheduler.js`

Owns all bounded randomization for DreamSpeak.

It chooses the active phase from mode plus elapsed time, the next enabled phrase with recent-phrase avoidance, delay, repeat count, cue gap, and playback rate.

Safety rules:
- empty phrase pools return `null`
- all output remains within preset/custom bounds
- single-phrase pools work
- an injected random source supports deterministic tests

It does not own UI state, audio transport, or persistence.
