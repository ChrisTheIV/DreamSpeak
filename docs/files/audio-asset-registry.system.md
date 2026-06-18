# `public/modules/audio-registry.js`

Owns the canonical list of phrase clips, background music tracks, and default session settings.

Does not own:
- playback timing
- UI rendering
- audio transport state

Inputs:
- none at runtime beyond module import

Outputs:
- registry objects
- helper lookups for phrase and music IDs

Dependencies:
- local audio fixture paths under `public/audio/`
