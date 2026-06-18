# `scripts/playwright-smoke.mjs`

Owns the repeatable local browser smoke test for the MVP.

It verifies:
- the server responds
- the UI loads
- session controls work
- audio requests are issued
- the session transitions through running, paused, and stopped
- the sleep timer field is visible and initialized

Does not own:
- app behavior
- scheduling logic
- playback logic

Inputs:
- local `http://localhost:3000` server
- downloaded Chromium executable path from `ms-playwright`

Outputs:
- JSON summary and thrown errors when expectations fail
