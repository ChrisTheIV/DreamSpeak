# `public/app.js`

Owns the browser UI wiring, DOM rendering, settings persistence, and control handlers.

Does not own:
- random scheduling
- audio playback lifecycle
- audio asset definitions
- sleep timer execution

Inputs:
- DOM nodes from `public/index.html`
- settings from `localStorage`
- callbacks from `AudioSessionEngine`

Outputs:
- updates visible UI state
- forwards user actions to the engine

Dependencies:
- `public/modules/audio-registry.js`
- `public/modules/phrase-scheduler.js`
- `public/modules/audio-session-engine.js`
