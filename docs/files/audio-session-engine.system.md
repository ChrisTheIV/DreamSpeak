# `public/modules/audio-session-engine.js`

Owns session lifecycle and user-visible session state.

It manages start, pause, resume, stop, active elapsed time excluding pauses, plan countdown state, sleep timer changes, snapshots, logs, summaries, and coordination between the scheduler and playback layer.

It does not own phrase/phase selection, low-level audio elements, DOM rendering, or local persistence.

Dependencies:
- `public/modules/audio-registry.js`
- `public/modules/phrase-scheduler.js`
- `public/modules/audio-playback-layer.js`
