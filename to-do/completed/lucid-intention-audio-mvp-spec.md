# Lucid Intention Audio MVP Spec

## Context
- Goal: build a small browser-based MVP for a lucid-dream intention audio app.
- In-scope: pre-recorded phrase clips, background music, randomized timing, repeat groups, speed variation, pause/resume/stop, and a local Playwright verification pass.
- Out-of-scope: TTS, REM detection, accounts, cloud sync, AI phrase generation, and mobile-only background audio behavior.
- Key constraints: keep phrase and background layers separate; keep scheduling logic out of the UI; vary playback only through bounded speed/pitch settings; use existing files or generated local fixtures.
- Primary environments: local browser on desktop, verified with Playwright.
- Assumptions: the repo starts without an app shell, so we are scaffolding one from scratch in the current workspace.
- Source prompt handling note: the original lucid-dream notes and workflow instructions are the source of truth for intent; this spec is the executable version.

## Requirement coverage map
- REQ-01: 20 pre-recorded phrase audio files -> T1, T2, T3
- REQ-02: random phrase selection and repeat groups -> T2
- REQ-03: random delay between groups -> T2
- REQ-04: background music loops quietly and is separately controlled -> T2, T3
- REQ-05: separate phrase volume and music volume -> T3
- REQ-06: start/pause/stop controls -> T3
- REQ-07: no TTS in MVP -> T1, T2, T3
- REQ-08: only vary speed/pitch, not AI generation or REM detection -> T2
- REQ-09: local storage for settings and presets -> T3
- REQ-10: verify the app with Playwright -> T4
- REQ-11: sleep timer stops a passive session after a chosen duration -> T3, T4

## 1) (T1) Scaffold the local app and audio fixtures
### Goal
Create a runnable local app shell with generated audio fixtures so the MVP can be exercised in the browser.

### Target behavior
- [ ] (T1.P1) A local server serves the app at `http://localhost:3000`.
- [ ] (T1.P2) The repo contains generated local phrase and ambient audio fixtures.
- [ ] (T1.P3) The app loads without requiring external services.

### Implementation checklist
- [ ] Create `package.json` scripts for `start` and `test:playwright`.
- [ ] Add a small Node static server.
- [ ] Add a fixture generator for 20 phrase clips and at least 2 ambient loops.
- [ ] Add the base HTML, CSS, and entry JS files.

### Acceptance criteria
- [ ] (T1.AC1) `npm start` serves the app locally.
- [ ] (T1.AC2) The generated audio files exist under a predictable local path.
- [ ] (T1.AC3) The app renders a visible shell with no runtime errors.

### Validation plan
Automated:
- [ ] Discover available package scripts after `package.json` exists.
- [ ] Run the local server and confirm the root page responds.

Manual:
- Open the app in a browser.
- Confirm the page loads and the UI shell is visible.

## 2) (T2) Implement phrase scheduling and audio session behavior
### Goal
Own all randomization and playback timing in dedicated logic, not in the UI.

### Target behavior
- [ ] (T2.P1) The scheduler picks enabled phrase clips randomly without immediate repeats.
- [ ] (T2.P2) The scheduler chooses repeat counts and inter-group delays from bounded ranges.
- [ ] (T2.P3) The audio session engine plays background music separately from phrase clips.

### Implementation checklist
- [ ] Add an audio asset registry for phrase and music fixtures.
- [ ] Add a scheduler module that returns the next phrase group plan.
- [ ] Add an audio session engine that manages play/pause/stop and scheduled playback.
- [ ] Persist the user’s chosen ranges and music selection locally.

### Acceptance criteria
- [ ] (T2.AC1) The currently selected phrase changes over time while the session runs.
- [ ] (T2.AC2) Background music keeps looping independently of phrase playback.
- [ ] (T2.AC3) Randomization stays in scheduler code, not in rendering code.

### Validation plan
Automated:
- [ ] Run the app and inspect console output for runtime errors.
- [ ] Use a browser automation check to confirm the schedule advances.

Manual:
- Start a session and watch the phrase log change.
- Pause and resume to confirm playback stops and restarts cleanly.

## 3) (T3) Build the playback UI
### Goal
Expose the core controls and settings in a simple, testable layout.

### Target behavior
- [ ] (T3.P1) The UI has start, pause, and stop controls.
- [ ] (T3.P2) The UI lets the user set phrase/music volume, delay range, repeat range, and speed range.
- [ ] (T3.P3) The UI shows the active phrase, session state, and selected music.
- [ ] (T3.P4) The UI exposes an optional sleep timer that can stop a session after a chosen duration.

### Implementation checklist
- [ ] Build the main control panel and status area.
- [ ] Add sliders or inputs for the ranges and volumes.
- [ ] Add music selection and phrase enable toggles.
- [ ] Add local persistence for settings.

### Acceptance criteria
- [ ] (T3.AC1) The user can configure and start a session from the UI.
- [ ] (T3.AC2) The UI visibly reflects the current session state.
- [ ] (T3.AC3) Volume and timing changes affect the next scheduled playback.
- [ ] (T3.AC4) The sleep timer control is visible, persists locally, and can be set to off or a finite duration.

### Validation plan
Automated:
- [ ] Use Playwright to click the main controls and confirm UI state changes.

Manual:
- Toggle a music track and change a delay range.
- Confirm the app keeps the selected settings after a reload.

## 4) (T4) Verify the MVP with Playwright and document the result
### Goal
Prove the local app works end-to-end in a real browser.

### Target behavior
- [ ] (T4.P1) Playwright can open the app and interact with the core controls.
- [ ] (T4.P2) The app shows a visible session change after Start.
- [ ] (T4.P3) Any app-specific docs created during implementation stay aligned with the code.

### Implementation checklist
- [ ] Run the app in a local browser session.
- [ ] Capture a screenshot or snapshot of the working UI.
- [ ] Add or update file-level docs for important modules.

### Acceptance criteria
- [ ] (T4.AC1) Playwright reaches the app successfully.
- [ ] (T4.AC2) The session can be started, paused, and stopped from the browser.
- [ ] (T4.AC3) The repo contains a clear summary of the implemented files and validation result.

### Validation plan
Automated:
- [ ] Playwright browser automation against `http://localhost:3000`.
- [ ] Any repo scripts needed to confirm the build or server run.

Manual:
- Re-run the core user flow in the browser.
- Confirm no console errors appear during the test pass.
