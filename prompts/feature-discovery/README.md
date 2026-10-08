# Feature-discovery prompts: features that need new backend logic

One prompt per file. Paste each into a fresh session in this repo. `../../CLAUDE.md` loads automatically, so the prompts carry only task-specific facts. **Every pass
reads [`_RULES.md`](_RULES.md) first.** That file holds the scope, the dedupe list, the candidate format and the hands-off rules, so they are written once.

## Why this set exists

`docs/opportunities.md` came from the data-map: fields the server sends and the client drops, and backlog fields nothing reads. That method can only find data that
**already exists**, so its 23 opportunities add at most a DTO field each. None of them adds a query, a job, an entity or a rule on the server.

This set looks for the other kind: features the app **cannot do today** because the backend has no logic for them. Its output is a ranked list, not code.

## Index

| #  | Prompt                                            | Question it answers                                                     | Reads backend | Model        | Effort |
|----|---------------------------------------------------|-------------------------------------------------------------------------|---------------|--------------|--------|
| F1 | [User-journey gaps](F1-journey-gaps.md)           | Where in an ADHD user's day does no module help?                        | to confirm    | **Opus 5.5** | high   |
| F2 | [Half-built backend](F2-half-built-backend.md)    | What has the server started (schema, enum, service) but never finished? | **mainly**    | Sonnet 5.5   | high   |
| F3 | [Cross-module joins](F3-cross-module-joins.md)    | What could only be answered by joining two or more modules' data?       | yes           | **Opus 5.5** | high   |
| F4 | [Day-type periods design](F4-day-type-periods.md) | Should `Calendar.label` become a period entity, and what would it buy?  | yes           | **Opus 5.5** | high   |
| F5 | [Synthesis](F5-synthesis.md)                      | Which of F1–F4's candidates are worth building, in what order?          | spot checks   | **Opus 5.5** | high   |

## How to run

- **F1–F4 are independent.** Run them in parallel, in any order, one fresh session each. Each writes only its own file under `docs/feature-discovery/`.
- **F5 runs last**, after all four files exist.
- **They are safe to run while you implement `docs/opportunities.md`.** No pass edits `src/`, `e2e/`, `src/_common` or the backend repo, and none commits. Commit
  their output yourself.

## Model calls

- **Opus, high: F1, F3, F4, F5.** These are product-judgement passes. The likely failure is a list that is technically correct but useless: a feature nobody with
  ADHD would open twice, or one that turns the app into another source of guilt.
- **Sonnet, high: F2.** A methodical sweep of the backend for loose ends. It needs thoroughness more than taste. F5 filters what it finds.

## Already covered elsewhere, so not in scope here

These are listed in `_RULES.md` § *Dedupe*. In short: everything in `docs/opportunities.md`, `docs/notification-audit.md`
(N1–N3 and the producer table), `prompts/captured-data/` (C1–C5 and its *Considered* list), and every set in
`prompts/_done/`.
