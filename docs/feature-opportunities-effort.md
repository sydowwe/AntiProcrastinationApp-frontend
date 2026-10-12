# Feature opportunities: Opus effort per remaining step

> Written 2026-10-07 against `docs/feature-opportunities.md`. It assumes **every step runs on Opus 5.5**. It replaces
> the Sonnet entries in each FO's *Model / effort* line with an Opus effort level. If an FO's scope changes, update it
> here too.

## Closed (reviewed 2026-10-08)

Checked against each FO's *Backend logic needed* and *Frontend surface*, in both repos. No effort left to assign.
What remains is the owner's (migrations, restart) or a re-run.

| FO | Backend | Frontend | Left |
|---|---|---|---|
| FO1 | `ab5f0e7` | `ec4b7a30` | Owner applies migration `20261006183310_RoutinePeriodCompletionIsExcused` (not confirmed applied on 2026-10-08: the API was not answering on :8080). |
| FO3 phase 1 | `2748772` | `7557fe30` | Nothing. |
| FO3 phase 2 | `410dced` | `b929602b` | Nothing. Migration `20261007200704` is applied, and `todo-motivation.spec.ts` was re-run against the new route, 12/12 (`8b0595ad`). |
| FO7 | `bcf8671`, `dc5059c` (notification hub closed to tracker tokens) | `ba3e54ea` (`_common` → `a0d8095`) | Nothing. Pairing codes (option b) stay deferred. Dropping the unread `User.HasExtensionAccess` column is a later migration. |
| FO10 (closed 2026-10-12) | `3e8f0e7` | `8b0595ad` | Nothing. Migration `20261011212220_UserDefaultSleepWindow` is applied, and the settings card was browser-checked against the real API: future unmarked days move, past and custom days don't. |
| FO5 (closed 2026-10-12) | `8863158` (greeting), `1aa7f2b` + framework `5646e89` (back-off) | `874ee396` | Nothing. Migration `20261008080300_UserLastActiveAndWelcomeBack` is applied. No e2e spec; the card was checked in the browser on 2026-10-08. |

## Built, not closed (open questions raised 2026-10-08)

| FO | Backend | Frontend | Why it is not closed |
|---|---|---|---|
| FO2 | `9058535` | `4e16f51a` | The handler jumps a **step-counted** item straight to done (`DoneCount = TotalCount`) once the day total reaches `SuggestedTime`. FO2 makes that reachable from a deliberate, linked timer, so one pomodoro can finish a "4×" item. That breaks the step model (`TodoLists/docs/domain-map.md`: fully done always takes `TotalCount` ticks). No test covers a counted item. |
| FO4 | `565f3e6` (xhigh agent) | `d0b24eda` | Checked live against the real routes on 2026-10-11 (`8b0595ad`). Still open: the spec's other `next-free-slot` callers (leisure *Do it now*, the to-do handoff) are not built, so "one placement rule for three modules" holds for one module. |
| FO6 | `5c17788` | `0e2c9bcf` | Marking a day away *after* its occurrence was placed leaves the occurrence on the away day. A destructive `DefaultConflictResolution` lets a GET silently delete or carve the user's own blocks to fit an auto-placed one. Owner applies `20261007204638_RepeatingPlannerTaskMaterialisedThrough` after FO3 phase 2's migration. |

None of FO1, FO2, FO4, FO6 or FO7 has an e2e spec. Only FO3 phase 1 does (`todo-stuck-item-offer.spec.ts`).

## Remaining steps

| FO | Step | Opus effort | Why |
|---|---|---|---|
| **FO8** | ~~F3-01 (to-dos)~~ built 2026-10-12 | **high** | It sets the shared rule (medians, sample thresholds, wording). The wording must describe the estimate, never the person. |
| | ~~F2-06 (routines), F2-07 (timers)~~ both committed, browser-checked and covered by e2e specs 2026-10-12 | **medium** | Both reuse the rule; the reads only add data. |
| **FO9** | backend agent | **xhigh** | Ingest must attribute idempotently, and it needs a policy for time counted twice by desktop and Android. A wrong rule is silent and permanent. |
| **FO11** | one session | **medium** | A SQL view edit plus one table that only adds data. |
| **FO12** | F2-04 (ranker swap) | **high** | It must compare the client's ranker against the server's, and the two may have drifted apart. |
| | F3-06 (last-done seam) | **medium** | One keyed seam with three implementations. |
| **FO13** | one session | **medium** | The handler is small. The one real choice is where the handoff link lives. |

## Rule of thumb

- **xhigh:** a bug would silently write wrong data (FO4, FO9).
- **high:** a migration or backfill on a table already in use, or a rule shared across modules.
- **medium:** reads that only add data, frontend work on existing components.
- **low:** a toggle-sized frontend change.
- **max:** nothing here needs it.
