# `public/modules/audio-registry.js`

Owns phrase clips, categories, goal sets, ambient tracks, session modes, phase bounds, variation profiles, defaults, and settings normalization.

It does not own random selection, timing execution, audio transport, or UI rendering.

Outputs:
- registry collections
- safe lookup helpers
- default settings
- mode-preset application
- normalized, clamped settings

Dependency: local audio files under `public/audio/`.
