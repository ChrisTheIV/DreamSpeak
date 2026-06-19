# `public/modules/audio-playback-layer.js`

Owns low-level audio playback.

Background ambience uses decoded Web Audio buffers with `AudioBufferSourceNode.loop` for sample-accurate looping. Two gain-controlled decks support live track crossfades. A standard looping `Audio` element remains as a compatibility fallback.

Phrase playback remains separate from ambience. During a phrase, ambience is reduced to 68% rather than stopped, then restored afterward.

Also owns phrase fades, repeated-cue gaps, previews, pause, stop, and audio teardown.

It does not own scheduling, session timing, UI state, or persistence.
