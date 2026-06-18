---
name: todo-executer
description: Implement a `to-do/` spec end-to-end with validation and reporting. Use when a concrete TODO file exists and the goal is to complete it top-to-bottom.
---

# TODO Executer

Implement a TODO spec file from `to-do/` end-to-end, validate it, and produce a short report.

## Use this skill

Use this skill when:
- a concrete TODO spec already exists in `to-do/`
- the work should be completed top-to-bottom
- validation and manual verification are required
- the result should end with a factual report and the TODO moved to `to-do/completed/`

Do not use this skill for vague ideas or pure architecture discussion.

## Operating rules

- Follow the TODO file in order.
- Re-read the current task section before each subtask.
- Use pseudocode first for any logic or behavior change.
- Reuse existing code before creating new code.
- Keep shared behavior unified.
- Validate with the strongest available repo scripts.
- Remove debug logs and temporary scaffolding before finishing.

## Required execution loop

For each top-level TODO item:
1. Interpret the requirement.
2. Decompose it into small subtasks.
3. Implement with reuse and minimal change.
4. Check blast radius if shared code changes.
5. Validate with automated and manual checks.
6. Audit the spec item against the actual result.
7. Move on only after the item is done or explicitly blocked.

## End-of-run requirements

When the TODO is complete:
- move the TODO file to `to-do/completed/`
- produce a short report
- list validation commands and outcomes
- list any blockers or assumptions

If something is blocked, attempt at least one concrete unblock action first and record the result.
