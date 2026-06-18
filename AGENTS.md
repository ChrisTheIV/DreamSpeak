# AGENTS.md

Use Product System Planner for unclear product or system decisions.
Use TODO Intake after the product behavior is decided.
Use TO-DO Executer only when a concrete TODO spec exists in `to-do/`.
Do not implement vague ideas directly.

Before changing important files, read:
- `docs/architecture/SYSTEM_OVERVIEW.md`
- `docs/architecture/LOCKED_SYSTEM_DECISIONS.md`
- relevant `docs/files/*.system.md`

If you change an important file, update its matching `.system.md` file in the same task.
Locked system decisions are binding unless changed through a decision doc.

Lucid-dream MVP rules:
- no TTS
- use pre-recorded phrase files
- vary only speed and pitch
- keep randomization in scheduler logic, not UI
- keep background audio and phrase audio separate
