# Rules shared by every feature-discovery pass

Read this before your pass's own prompt. Where they disagree, your pass's prompt wins.

## What you are looking for

A **feature candidate** is something a user of this app would want that the app **cannot do today**, where at least part
of the missing piece is **backend logic**. That means one or more of these:

- a new query or aggregation (not just one more column on an existing response),
- a new scheduled job, trigger or event handler,
- a new entity, relation or lookup table,
- a new business rule enforced on the server (a validation, a state transition, a derived status).

Out of scope:

- **Frontend-only features.** If the server already returns everything needed, it belongs in `docs/opportunities.md`'s
  method, not here. Note it in your file's *Out of scope, but noticed* section and move on.
- **Adding one field to a DTO.** That is what `docs/opportunities.md` already covers.
- **Bugs.** A bug is not a feature. Note any you find in *Out of scope, but noticed*, with `file:line`, and move on.
- **Infrastructure for its own sake**, such as caching, a refactor or a new framework, unless a user-visible feature
  depends on it.

## Who the user is

This is an anti-procrastination app for people with ADHD. Judge every candidate against that:

- **Good:** lowers the cost of starting, catches the moment when a plan is quietly failing, turns what the user already
  did into something that helps them next time, removes a decision.
- **Bad:** adds a form to fill in, a list that grows when the user falls behind (a guilt pile), a score that punishes,
  or a notification the user will learn to ignore.

A candidate that needs the user to enter new data every day needs a strong reason. Prefer features that run on data the
app already collects.

## Where things are

- Frontend: this repo. Module map in `CLAUDE.md`. Per-view docs: `docs/views/<unit>/{usecase,inventory,findings}.md`
  (the `usecase.md` files say what each screen is *for*). Field map: `docs/data-map.md` and `docs/data-map/*.md`.
  Glossary of the overlapping nouns: `docs/views/glossary.md`.
- Backend: `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`, **read-only**. Projects: `AdhdTimeOrganizer` (host),
  `.Core`, `.Planning`, `.TodoLists`, `.Routines`, `.History`, `.Tracking`, `.ActivityProfiles`, `.IntegrationTests`,
  plus the `framework/` submodule. Entity shape and cascades are in `*Configuration.cs`, and contract behaviour is in
  `IntegrationTests/`. The working tree may be dirty: record `git -C <path> rev-parse --short HEAD` and say whether it was
  dirty.
- **Backend conventions: read these before any backend code.** This session runs from the frontend repo, so only the
  frontend `CLAUDE.md` loads automatically. Read the backend's own `CLAUDE.md`, `docs/architecture.md` and
  `docs/modules.md` (all under `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`) first. They define the module
  boundaries a candidate must respect and where its logic would live. For anything that touches notifications or the
  scheduler, also read `docs/notificationSetup.md`. Run the passes from the frontend repo regardless: every path in
  these prompts is relative to it.

## Dedupe: do not re-propose these

Before writing a candidate, check it against all of the following. If a candidate *extends* one of them, say which one
and what the extension adds that the original does not.

- `docs/opportunities.md`: OP1–OP23 and its *Closed* list.
- `docs/notification-audit.md`: N1–N3 and every producer in its table. **Notification delivery is audited. Do not redo
  it.** A candidate may *use* a notification, but "send a notification when X" is only new if X is a new trigger that
  the audit did not list.
- `prompts/captured-data/README.md`: C1–C5, plus its *Considered, not written up* list.
- Every set in `prompts/_done/` (`_common`, `activity`, `activity-history`, `clock`, `day-planner`, `home`, `leisure`,
  `todo-motivation`, `user`). Skim each `README.md` index.
- `docs/views/_fix-queue.md` and `docs/views/_fix-queue-log.md` for anything already queued.

## Evidence discipline

Docs in this repo go stale (see `docs/opportunities.md`'s reconciliation note). **Every claim that something is missing
must be checked against code**, in both repos, with `file:line`. "There is no endpoint for X" needs the search you ran to
establish it (for example: "no `*Endpoint.cs` in `.Planning` references `PlannerTask` with a date range"). If you could
not check a claim, mark it `unverified`. Never present it as fact.

## Candidate format

Number candidates with your pass's prefix (`F1-01`, `F2-01`, …). For each one:

```
### F1-01. <Title, written as what the user gets>
- **Moment:** when in the user's day or week this matters, in one sentence.
- **Today:** what happens now, with evidence (`file:line`, both repos where relevant).
- **Backend logic needed:** concretely: new query over which tables, new job on what schedule, new entity with which
  relations, new rule enforced where. Name the project it would live in.
- **Frontend surface:** where it would appear. Name the existing view or component.
- **Data it runs on:** existing fields it reuses, and any new input it asks of the user (say "none" if none).
- **Size:** S / M / L for backend and frontend separately.
- **Risks / open questions:** design decisions the owner must make, and ADHD failure modes (guilt pile, nag, form).
- **Dedupe:** "new", or "extends <id>: <what it adds>".
```

## Your output file

Write **only** `docs/feature-discovery/<your pass id>-<slug>.md`, for example `docs/feature-discovery/F1-journey-gaps.md`.
Structure:

1. A header: date, frontend commit, backend commit (and whether dirty), inputs read.
2. A short *Method* paragraph: what you swept and how.
3. *Candidates*, strongest first. Aim for quality: 6–12 well-evidenced candidates beat 30 thin ones.
4. *Rejected*: ideas you considered and dropped, one line each with the reason. This stops F5 and later passes from
   re-deriving them.
5. *Out of scope, but noticed*: frontend-only opportunities, bugs and stale docs, each with `file:line`.

## Hands off

- **Do not edit** anything in `src/`, `e2e/`, `src/_common`, the backend repo, or any existing doc. Another session is
  implementing `docs/opportunities.md` in this tree at the same time.
- **Do not commit**, and do not stage. The owner commits your file.
- **Do not start the dev server, the API or a browser.** This is a reading pass. The API runs under the owner's
  debugger and must not be restarted.
- Do not spawn subagents unless your pass's prompt says you may.
