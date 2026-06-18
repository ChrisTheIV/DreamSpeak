# `public/app.js`

Owns browser UI wiring, rendering, local settings/history persistence, phrase toggles and previews, control handlers, and optional post-session feedback.

Does not own:
- random scheduling or phase selection
- audio playback lifecycle
- canonical preset or asset definitions
- sleep timer execution

Inputs:
- DOM nodes from `public/index.html`
- settings and feedback history from `localStorage`
- snapshots and callbacks from `AudioSessionEngine`

Outputs:
- normalized settings sent to the engine
- visible setup/live/feedback state
- state-appropriate control availability

Dependencies:
- `public/modules/audio-registry.js`
- `public/modules/phrase-scheduler.js`
- `public/modules/audio-session-engine.js`
