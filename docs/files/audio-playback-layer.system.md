# `public/modules/audio-playback-layer.js`

Owns low-level audio playback.

Background ambience uses decoded Web Audio buffers with `AudioBufferSourceNode.loop` for sample-accurate looping. Two gain-controlled decks support live track crossfades. A standard looping `Audio` element remains as a compatibility fallback.

Phrase playback remains separate from ambience. While a phrase is active, ambient output is multiplied by the normalized `ambienceDuringPhraseRatio` setting. A value of `1` preserves the normal ambient volume, `0.5` plays it at half that volume, and `0` mutes it until phrase playback finishes.

Also owns phrase fades, repeated-cue gaps, previews, pause, stop, and audio teardown.

It does not own scheduling, session timing, UI state, or persistence.
