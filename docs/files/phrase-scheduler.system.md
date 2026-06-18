# `public/modules/phrase-scheduler.js`

Owns all bounded randomization for the MVP.

It decides:
- which phrase to play next
- how many repeats to use
- how long to wait between groups
- what playback rate to use

Does not own:
- UI state
- audio element control
- persistence

Inputs:
- registry data
- current session settings

Outputs:
- a plan object for the next phrase group

Dependencies:
- `public/modules/audio-registry.js`
