# `public/modules/audio-session-engine.js`

Owns the session lifecycle and audio transport.

It starts, pauses, resumes, and stops:
- background music playback
- phrase clip playback
- scheduled cue timing
- optional sleep timer expiry

Does not own:
- phrase selection logic
- DOM rendering
- localStorage persistence

Inputs:
- registry
- scheduler
- current settings
- pause/stop signals from the UI

Outputs:
- callbacks for state, plan, and log updates

Dependencies:
- browser `Audio` elements
- `public/modules/audio-registry.js`
- `public/modules/phrase-scheduler.js`
