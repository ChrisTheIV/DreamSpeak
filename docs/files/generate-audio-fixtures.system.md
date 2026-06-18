# `scripts/generate-audio-fixtures.js`

Owns creation of the local WAV fixtures used by the browser MVP.

It generates:
- 20 phrase clips
- 3 ambient background loops

Does not own:
- scheduling
- playback
- UI

Inputs:
- filesystem paths under `public/audio/`

Outputs:
- generated WAV files ready for the app to serve locally
