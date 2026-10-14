# Captured-data prompts — spend what the app already collects

One self-contained prompt per file. Each is written to be pasted into a fresh session in this repo. `../../CLAUDE.md` loads automatically there, so the prompts
carry only task-specific facts (file paths, line numbers, the exact fields) and do not restate conventions.

Same format and the same backend convention as [`../_done/todo-motivation`](../_done/todo-motivation/README.md) and [`../_done/leisure`](../_done/leisure/README.md).

## Where this set came from

Every `opportunity` finding in `docs/views/*/findings.md`, and every Phase-4 lead in `docs/views/_fix-queue.md` → *Deferred to opportunities*, had shipped by
2026-09-27. What remained were the **"Data this unit captures but does not spend"** sections of the fifteen `docs/views/*/usecase.md` files. Each lead below was
re-checked against `src/` on 2026-09-27 (commit `5e6c4ab7`), because those sections had gone stale before. Two had been built since the docs were written: the
day's location, weather and notes now render in `DayDetailsPanel.vue` and `CalendarDayCellContent.vue`, and a single skipped task shows its reason on the home
widget. Neither is in this set.

The organising idea is the same as the leisure set: **the data is already collected, and the user gets nothing back for having entered it.** Every prompt spends a
field the user fills in or a fact the app already knows. None of them adds a new thing for the user to fill in.

## Index

| #  | Prompt                                                              | Scope                          | Backend | Model        | Effort   |
|----|---------------------------------------------------------------------|--------------------------------|---------|--------------|----------|
| C1 | [Why I skip things ⭐](C1-skip-reason-insights.md)                  | dayPlanner                     | likely  | **Opus 5.5** | high     |
| C2 | [Rewards waiting for you ⭐](C2-rewards-waiting.md)                 | todoList × leisure × home      | likely  | **Opus 5.5** | high     |
| C3 | [Suggest a template by location](C3-template-by-location.md)        | dayPlanner                     | yes     | Sonnet 5     | medium   |
| C4 | [Routine suggested-day nudges](C4-routine-suggested-day-nudges.md)  | todoList (routine) × reminders | yes     | Sonnet 5     | med–high |
| C5 | [Timer sessions as sessions ⭐](C5-timer-sessions.md)               | activityHistory × history      | yes     | **Opus 5.5** | high     |

### Status

- **C2 — done.** Frontend shipped 2026-09-28 with its backend ask [B2](backend/B2-earned-rewards-from-the-daily-recap.md), answered and verified the same day.
  Follow-ups 2026-09-29: the home tick's recap re-read raced its own PATCH, and a planner task ticked on home never told the to-do widget or the waiting rewards.
  Both are closed; see the end of B2.

### Why five prompts and not six

The feature list had six items. **C5 folds two of them into one prompt**: grouping a Pomodoro's focus periods and rests as one session, and keeping whether a
session ran to completion or was stopped early. The reasons:

- Both live on the same path: `runningTimerStore.ts` → `PomodoroTimerView.vue`'s `saveActivity` → `useSaveActivityToHistory` → `POST activity-history`.
- Both need the same backend change, a session concept on `ActivityHistory`, and "ended automatically" is naturally a property of the session rather than of each
  row. Two prompts would write two backend asks that describe one entity from two sides.
- Building one without the other means touching the save path twice.

The other four do not share files, surfaces or a backend change, so each stays separate. C1 and C3 are both in `dayPlanner` but touch unrelated code.

## Backend-dependent prompts

All five may hit the .NET side, and C3–C5 certainly do. Each ends with the same instruction: **do all the frontend work that stands on its own first, then write
the backend ask** to `prompts/captured-data/backend/Bn-<slug>.md`, following [`backend/README.md`](backend/README.md). That directory starts empty. The API is at
`C:\Users\jakub\RiderProjects\AdhdTimeOrganizer` and **can be read**. Unlike the older sets, an agent here can confirm a field is missing rather than guess. Batch
whatever asks appear into one backend session.

## How the model calls were made

**Opus 5.5, high effort** — C1, C2, C5. Each is a design problem with a modest implementation attached, and the failure mode is a type-clean feature that misses
the point:

- **C1** writes sentences about the user's failures. The line between "useful pattern" and "a list of your excuses" is the whole task.
- **C2** can easily turn a reward into another obligation: a growing pile of unclaimed rewards is a guilt list with a nicer icon.
- **C5** changes what one history row *means*, and six downstream surfaces count rows.

**Sonnet 5** — C3 (a small, well-precedented extension of B27) and C4 (medium–high, because it spans a client refactor, a notification type and the
reminder-preference ownership rules in `CLAUDE.md`).

**Nothing here is a Haiku job.** Every prompt either writes user-facing SK/EN copy about the user's own behaviour, or changes a contract.

## Suggested order

**C3** first if you want a quick win: the frontend half is one locale string and one pattern-type branch. Then **C1 → C2**, both mostly frontend with a likely
ask each. **C5** is the largest and the only one that changes existing data semantics, so run it on its own. **C4** any time.

## Considered, not written up

- **Day-type periods** (a lookup entity instead of free-text `Calendar.label`, see the owner's 2026-04-02 brainstorm). This is a larger modelling decision, not
  spending captured data, and it deserves its own design pass.
- **Merge preview in activity settings**, **an account stats card** from `GET /user/account-deletion-summary`, and **a new-device sign-in alert** (framework-owned).
  All are viable, but none was asked for in this round.
- **`DayTotals.totalVisits`** on the web-tracking dashboard. The client already has a slot for it. It is a pure backend population gap, not a feature.
