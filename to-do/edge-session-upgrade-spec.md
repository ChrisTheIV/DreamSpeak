# Edge Session Upgrade

## Context

DreamSpeak is a lucid-dream intention-audio MVP. Its defining behavior is semi-intentional interruption: unpredictable phrase cues should catch the user off guard and keep them near the edge of sleep rather than helping them fall fully asleep.

This implementation must preserve that behavior while making the app safer, clearer, more reliable, and easier to use in bed.

Assumptions:
- The current browser-only architecture remains.
- Pre-recorded/local audio remains the only phrase source; no TTS or AI generation.
- The existing frequent-cue behavior remains available as the default `Edge of sleep` mode.
- Advanced numeric controls remain available through a custom/advanced area rather than dominating the primary UI.

Execution follows this spec. The source prompt is for traceability and intent only.

## Requirement coverage map

- REQ-01 Preserve unpredictable, frequent edge-of-sleep interruption -> T2, T3, T5
- REQ-02 Fix empty phrase selection, invalid settings, timer, pause/resume, and live music issues -> T1, T4
- REQ-03 Add simple session modes without removing custom control -> T2, T5
- REQ-04 Add staged scheduling while keeping the default mode interruptive -> T3
- REQ-05 Improve phrase organization and preview -> T2, T5
- REQ-06 Improve audio transitions and cue intelligibility -> T4
- REQ-07 Clean up the UI for bedtime use -> T5
- REQ-08 Add lightweight post-session feedback -> T6
- REQ-09 Expand validation and update system docs -> T7

## 1) (T1) Reliability and settings safety

### Target behavior
- [ ] (T1.P1) Start is unavailable when no phrase is enabled or settings are invalid.
- [ ] (T1.P2) Active elapsed time excludes paused time.
- [ ] (T1.P3) Sleep timer and music changes apply predictably during a session.

### Implementation checklist
- [ ] (T1.1) Add finite-number parsing, hard clamps, and normalized min/max ranges.
- [ ] (T1.2) Prevent or validate an empty enabled-phrase set.
- [ ] (T1.3) Track accumulated active elapsed time across pause/resume cycles.
- [ ] (T1.4) Re-arm live timer changes and switch live background tracks cleanly.
- [ ] (T1.5) Disable controls that are not meaningful in the current state.

### Acceptance criteria
- [ ] (T1.AC1) Empty phrase selection cannot crash the scheduler.
- [ ] (T1.AC2) A paused session does not increase active elapsed time.
- [ ] (T1.AC3) Invalid numeric fields are repaired or visibly rejected before start.

## 2) (T2) Session modes and phrase goals

### Target behavior
- [ ] (T2.P1) The user can choose Edge of sleep, WBTB, Nap, or Custom.
- [ ] (T2.P2) The user can choose a phrase goal/set and preview individual cues.

### Implementation checklist
- [ ] (T2.1) Add canonical mode presets to the registry.
- [ ] (T2.2) Add phrase categories and goal sets.
- [ ] (T2.3) Keep advanced numeric controls editable in Custom mode and visible in an advanced drawer for other modes.
- [ ] (T2.4) Add phrase preview controls without starting a session.

### Acceptance criteria
- [ ] (T2.AC1) Edge of sleep remains the default and retains short unpredictable cue intervals.
- [ ] (T2.AC2) Selecting a mode updates scheduler settings but does not duplicate scheduler logic in the UI.

## 3) (T3) Staged, surprise-oriented scheduling

### Target behavior
- [ ] (T3.P1) Scheduling changes over the session while remaining bounded and unpredictable.
- [ ] (T3.P2) The default phase pattern keeps the user near sleep onset rather than becoming a passive meditation track.

### Implementation checklist
- [ ] (T3.1) Add phase definitions to presets.
- [ ] (T3.2) Make PhraseScheduler choose timing/repeat/rate from the active phase.
- [ ] (T3.3) Return phase name and cue countdown metadata to the UI.
- [ ] (T3.4) Keep recent-phrase avoidance and handle one-phrase pools safely.

### Acceptance criteria
- [ ] (T3.AC1) Edge mode begins quickly and never silently expands into multi-minute gaps.
- [ ] (T3.AC2) Scheduler output always stays within preset/custom bounds.

## 4) (T4) Audio behavior

### Target behavior
- [ ] (T4.P1) Phrase cues are intelligible without abrupt starts or fighting the ambience.
- [ ] (T4.P2) Track changes do not unexpectedly stop background playback.

### Implementation checklist
- [ ] (T4.1) Add short phrase fade-in/fade-out and ambient ducking.
- [ ] (T4.2) Add a background-track crossfade/safe switch.
- [ ] (T4.3) Add a natural/subtle/dreamlike variation profile.
- [ ] (T4.4) Add a preview method using the configured phrase volume and profile.

### Acceptance criteria
- [ ] (T4.AC1) Ambient volume drops during a phrase and restores afterward.
- [ ] (T4.AC2) Natural variation does not alter rate.

## 5) (T5) Bedtime-focused UI

### Target behavior
- [ ] (T5.P1) Pre-session configuration is simple and goal-led.
- [ ] (T5.P2) Running mode prioritizes session state, phase, next cue, pause/resume, and stop.

### Implementation checklist
- [ ] (T5.1) Replace the developer-dashboard hierarchy with a compact setup card.
- [ ] (T5.2) Add clear mode, goal, ambience, duration, and variation controls.
- [ ] (T5.3) Put detailed min/max controls in an Advanced section.
- [ ] (T5.4) Display `Next cue`, `Playing now`, live countdown, and active phase separately.
- [ ] (T5.5) Improve responsive/mobile layout and dim running presentation.

### Acceptance criteria
- [ ] (T5.AC1) The primary screen can start a sensible session without editing numeric ranges.
- [ ] (T5.AC2) Current and upcoming phrase labels are never conflated.

## 6) (T6) Lightweight outcome feedback

### Target behavior
- [ ] (T6.P1) After stopping, the user can record whether cues helped, woke them, or had no effect.

### Implementation checklist
- [ ] (T6.1) Add a compact post-session feedback panel.
- [ ] (T6.2) Persist a small local history with mode, duration, outcome, and cue-volume rating.
- [ ] (T6.3) Show one simple suggestion based on the latest outcome.

### Acceptance criteria
- [ ] (T6.AC1) Feedback is optional and does not turn the app into a full dream journal.
- [ ] (T6.AC2) Saved feedback survives reload.

## 7) (T7) Validation and documentation

### Implementation checklist
- [ ] (T7.1) Expand the Playwright smoke test for modes, empty selection, pause timing, and feedback.
- [ ] (T7.2) Add deterministic scheduler checks where practical.
- [ ] (T7.3) Update SYSTEM_OVERVIEW, locked decisions if needed, and matching file docs.
- [ ] (T7.4) Run available syntax and Playwright checks.

### Acceptance criteria
- [ ] (T7.AC1) Existing start/pause/stop behavior remains covered.
- [ ] (T7.AC2) New product rules are reflected in architecture docs.

## Appendix — Source prompt (verbatim)

> the idea is for it to catch you off guard and stop you from falling asleep fully - so its semi intentional
>
> we want to keep that around - but i do like the suggestions. implement them
>
> feel free to clean up the ui if needed too
