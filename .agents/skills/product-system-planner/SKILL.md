---
name: product-system-planner
description: Plan product and system behavior before implementation. Use when product ideas are unclear, UX or state decisions need to be made, edge cases or tradeoffs must be resolved, or a decision brief is needed before TODO writing or coding.
---

# Product System Planner

Decide what the product should do before anyone writes code or an implementation TODO.

## Use this skill

Use this skill when the request involves:
- unclear product behavior
- state models or object models
- UX tradeoffs, button behavior, or navigation
- edge cases, safety, undo, deletion, or trust
- turning rough notes into a decision brief

Do not write code here. Do not write a TODO spec unless the user asks for one.

## Required output

Always produce a decision brief with these sections:
1. Actual Problem
2. Current UX Failure
3. Object / State Model
4. User Actions
5. UX Options
6. Recommended Decision
7. Edge Cases
8. Final Product Rules
9. Implementation Handoff, only if useful

## Thinking rules

- Separate symptoms from root causes.
- If a button has no clear purpose, recommend removing or renaming it.
- Prefer explicit state transitions over hidden behavior.
- Prefer reversible actions where mistakes are likely.
- Be direct about tradeoffs and risks.
- Do not over-accept vague ideas.

## Handoff rules

Only produce an implementation handoff after the behavior is clear. Keep it short, concrete, and ready for TODO Intake.
