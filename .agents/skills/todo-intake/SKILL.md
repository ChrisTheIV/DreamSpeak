---
name: todo-intake
description: Turn rough notes or product decisions into an executor-ready TODO spec in `to-do/`. Use when a concrete implementation plan needs task IDs, acceptance criteria, validation steps, and traceability before coding.
---

# TODO Intake

Rewrite rough notes or a weak TODO into one executor-ready spec file in `to-do/`.

## Use this skill

Use this skill when you have:
- rough product notes
- an existing TODO that needs to be rewritten
- a screen, component, or flow that needs a concrete implementation plan
- a need for traceable task IDs, acceptance criteria, and validation steps

If `Questions: ON` appears in the prompt, ask one clarifying question before drafting a large spec. Otherwise, make reasonable assumptions and list them.

## Output contract

Produce exactly one markdown spec file intended for `to-do/<name>-spec.md`.

The spec must include:
- `## Context`
- `## Requirement coverage map`
- top-level task sections with stable IDs `T1`, `T2`, etc.
- implementation checklist items
- acceptance criteria
- automated and manual validation
- appendix with the original source prompt verbatim

## Required workflow

1. Re-read the source prompt and extract numbered requirements `REQ-01`, `REQ-02`, etc.
2. Write the spec in execution order, not in brainstorm order.
3. Convert unknowns into explicit inspection subtasks.
4. Add assumptions when needed instead of hiding gaps.
5. Include exact UI layout and control behavior for screen work.
6. Include blast-radius checks when shared code or contracts are touched.
7. End with a requirement coverage map that points every REQ to tasks, subtasks, and acceptance criteria, or marks it out of scope, blocked, or assumed.

## Quality rules

- Be specific and executable.
- Do not invent APIs or contracts.
- Prefer reuse-before-create and unify shared logic.
- Keep validation realistic and based on existing repo scripts.
- Keep the source prompt verbatim in the appendix.

## Output shape

Use the repo's spec template style:
- Context first
- requirement coverage map second
- then task sections in execution order
- then the verbatim appendix

Keep the result tight enough that the TO-DO Executer can follow it without guessing.
