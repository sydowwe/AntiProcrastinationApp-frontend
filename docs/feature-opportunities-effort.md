# Feature opportunities: Opus effort per remaining step

> Written 2026-10-07 against `docs/feature-opportunities.md`. It assumes **every step runs on Opus 5.5**. It replaces
> the Sonnet entries in each FO's *Model / effort* line with an Opus effort level. If an FO's scope changes, update it
> here too.

## Already built (no effort to assign)

| FO | Backend | Frontend | Left |
|---|---|---|---|
| FO1 | `ab5f0e7` | `ec4b7a30` | Owner applies migration `20261006183310_RoutinePeriodCompletionIsExcused` and restarts the API. The FO1 section still says "uncommitted"; that is stale. |
| FO2 | `9058535` | `4e16f51a` | Nothing. |
| FO3 phase 1 | `2748772` | `7557fe30` | Nothing. |
| FO3 phase 2 | `410dced` | the commit after `7557fe30` | The owner applies migration `20261007200704_PlannerTaskPostponeAndRepeatingSource` and restarts the API. The migration also carries FO6's two columns. |
| FO7 | `bcf8671`, `dc5059c` (notification hub closed to tracker tokens) | `ba3e54ea` (`_common` → `a0d8095`) | Nothing. Pairing codes (option b) stay deferred. |
| FO4 | `565f3e6` (xhigh agent) | the commit after `0fd7e874` | The owner restarts the API (no migration), then checks the re-plan live; it was verified against mocked routes only. |

## Remaining steps

| FO | Step | Opus effort | Why |
|---|---|---|---|
| **FO5** | backend agent | **high**, or **xhigh** if the back-off ships in the same session | It touches four slices, adds a column on `users` and needs a framework collaborator, so two backend repos. |
| | frontend | **medium** | One card with three choices plus an undo. |
| **FO6** | backend agent | **medium** | Its two columns are already in FO3 phase 2's migration, so this is the materialiser only, with no `planner_task` migration. |
| | frontend | **low** | One switch and one small mark. |
| **FO8** | F3-01 (to-dos) | **high** | It sets the shared rule (medians, sample thresholds, wording). The wording must describe the estimate, never the person. |
| | F2-06 (routines), F2-07 (timers) | **medium** | Both reuse the rule; the reads only add data. |
| **FO9** | backend agent | **xhigh** | Ingest must attribute idempotently, and it needs a policy for time counted twice by desktop and Android. A wrong rule is silent and permanent. |
| **FO10** | backend agent | **high** | It is a one-off backfill of the pre-seeded `calendar` table, with an override marker. A wrong backfill is hard to undo. |
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
