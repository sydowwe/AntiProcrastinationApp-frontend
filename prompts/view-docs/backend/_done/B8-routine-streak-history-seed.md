# B8 — the fixture seeds no routine *period* history, so four streak surfaces have never rendered

> ## ✅ Already done — 2026-09-14
>
> Covered by the API's `e2e-v4` work, which was uncommitted on `dev` (on top of `7f9f9e5`) when this file was
> written against `e2e-v3` — the source read below was true of v3 and simply never saw v4. Every *Done when*
> item is met, plus one this file did not ask for (the catch-up trap):
>
> 1. **Period history** — `E2eFixtureSeeder.AddRoutinePeriodHistory()`: Weekly gets 16 `RoutinePeriodCompletion`
>    rows (= `RoutineHistoryCycles`, matching the client's default `HistoryDepth`), newest-first
>    `xf.xxxx.xx.xx.xx` — met, missed, and one **frozen** (`isFrozen = true`) on the second-newest cycle so it
>    is on screen without scrolling; the miss behind it is left unfrozen so a spec can still spend a freeze.
>    Daily gets 16 rows, all 5-of-5 except one 4-of-5 eleven cycles back.
> 2. **Mixed rows, third cell state** — yes, see above.
> 3. **Counters agree with the rows by construction** — period `streak` / `bestStreak` are computed from the
>    rows by `RoutineStreakFreezeService.RecomputeStreak` (Weekly 1 / 4, Daily 11 / 30), and
>    `totalPeriodsElapsed` / `totalPeriodsCompleted` are **no longer stored** — `RoutineTimePeriodResponse.From`
>    derives them from `completionHistory` (elapsed = row count, completed = rows meeting `streakThreshold`;
>    frozen counts as elapsed, not completed). So `mockHistory()` can never fire for Daily or Weekly. Monthly
>    and Yearly are left bare on purpose so the empty state stays reachable.
> 4. **Milestone items** — four new daily items in `AddRoutines()`, one per tier of `getMilestoneIcon`:
>    `milestone30` *Drink water* 45 (the one daily item left un-ticked), `milestone90` *Journal* 120,
>    `milestone180` *Make the bed* 200, `milestone365` *Brush teeth* 400. Streaks sit well past their tier so a
>    tick/un-tick pair cannot cross a boundary. Caveat: a spec straddling midnight UTC with one un-ticked will
>    see the lapse zero it.
> 5. **Seed response / `seed.ts`** — `EXPECTED_FIXTURE_VERSION = 'e2e-v4'`, `SeedRoutineKey` gains the four
>    `milestone*` keys, `counts` gains `routinePeriodCompletions` / `frozenRoutinePeriodCompletions`;
>    `routineTimePeriods.Weekly` / `.Daily` give the period ids.
> 6. **Catch-up trap (unasked)** — `freezesRemaining` / `freezeBudgetResetsAt` are pre-stamped on all four
>    periods and `lastResetAt` sits on the current cycle boundary, so the first grouped read's
>    `TryResetCatchUp` and `RefreshFreezeBudget` are no-ops — no read of the fixture writes. Weekly shows one
>    freeze fewer than budget if the seeded freeze falls in the current calendar month.
>
> Pinned by three tests in `TestSeedEndpointTests.cs`: the catch-up/freeze-refresh no-op invariant over every
> seeded period, `Seed_LeavesAnItemStreakInEveryMilestoneTier`, and
> `Seed_LeavesTheRoutineHistoryVisibleThroughTheReadPath` (real read refresher; asserts all three cell states,
> ascending `periodStart`, `streak > 0`, `bestStreak > streak`, `0 < totalPeriodsCompleted < totalPeriodsElapsed`).
>
> **Browser pass done the same day** — `docs/views/todo-routine/findings.md`, *Round 6 browser pass*: after a
> fresh v4 seed (`fixture e2e-v4`, 32 completions / 1 frozen), all seven surfaces render and match the rows —
> review card, both heatmaps with met / missed / frozen, 94 % / 69 % with computed trends, personal bests,
> freeze chips (Weekly at 1/2, as the calendar-month caveat predicts for September), and all five milestone
> icons. `U1` and `U2` are closed. Screenshots under `docs/views/todo-routine/screenshots/*round6-v4*`.

> Measured 2026-09-13 **from source**, in the API repo (`AdhdTimeOrganizer`), against fixture `e2e-v3`.
> No running API and no browser were used to write this — see *How this was established* at the bottom for
> exactly what that does and does not prove. The client-side half is from `docs/views/todo-routine/`, which
> **was** captured in a browser (round 1, 2026-09-10).

This is not a defect. Every endpoint involved returns 200; the rows simply are not there.

---

## What is seeded, and what is not

`E2eFixtureSeeder.AddRoutines()` seeds **three `RoutineTodoList` rows** — item-level streaks in three states,
exactly as its doc comment says ("running, just started, and never completed"):

| routine | period | `Streak` | `BestStreak` |
| --- | --- | --- | --- |
| Take medication | Daily | 12 | 30 |
| Weekly review | Weekly | 1 | 4 |
| Pay rent | Monthly | 0 | 0 |

What it never writes:

1. **Period-level streak state.** The four periods come from the user-default `RoutineTimePeriodSeeder`, which
   sets `Text`, `Color`, `LengthInDays`, `StreakThreshold`, `StreakGraceDays` and `ResetAnchorDay` — and
   nothing else. So `RoutineTimePeriod.Streak`, `BestStreak`, `TotalPeriodsElapsed` and
   `TotalPeriodsCompleted` are all **0** on all four periods, for every account.
2. **Completion history.** There are **zero `RoutinePeriodCompletion` rows** — the type is not referenced in
   `E2eFixtureSeeder.cs` at all.

## What that makes impossible to document

Four surfaces in `/routine-todo-list` and `/routine-settings`, tracked as `todo-routine/U1` and `U2`:

| surface | reads | why it is empty |
| --- | --- | --- |
| Weekly review card (R2) | `totalPeriodsElapsed` | 0 on every period, so the card never has a "last period" to review |
| Completion heatmaps | `completionHistory` | no rows exist |
| Consistency % and trend | `completionHistory` | same |
| Personal bests panel | period `bestStreak` / `totalPeriodsCompleted` | both 0 |
| Milestone streak icons | **item** `streak` | see below |

**The milestone icons are the sharpest case.** `RoutineTodoListItem.vue`'s `getMilestoneIcon(streak)` has five
branches — 365 `crown`, 180 `gem`, 90 `trophy`, 30 `star`, 7 `fire-flame-curved`. The highest seeded item
streak is **12**, so only the `fire-flame-curved` branch has ever rendered. Four of the five have never been
seen by anyone, in any environment. Note it reads `item.streak`, **not** `bestStreak` — so the
`BestStreak = 30` already on "Take medication" does not reach it.

**One client-side wrinkle worth knowing before choosing how to fix this.**
`RoutineTimePeriodEntity.fromJson` falls back to a client-side `mockHistory()` when `completionHistory` comes
back empty — and `mockHistory` returns `[]` when `totalPeriodsElapsed <= 0`. So seeding *only* the counter
would light up the heatmap with **fabricated** cells, which is worse than an empty one for documentation
purposes: it looks like real data. Seed real `RoutinePeriodCompletion` rows, not just the counters. The
`isFrozen` (streak-freeze) cell state is the clearest example — the client comments that "mock history never
invents a freeze", so that third heatmap state is reachable *only* from real rows.

## Done when

1. ≥ 1 routine time period has `TotalPeriodsElapsed > 0` and a non-empty set of `RoutinePeriodCompletion`
   rows, enough to fill a heatmap at its `HistoryDepth` (Weekly's default depth is ~13, from
   `RoutineTimePeriodEntity.defaultHistoryDepth`).
2. Those completion rows are **mixed** — some meeting `StreakThreshold` and some not — so the consistency
   figure and the trend arrow have something to compute, and the heatmap shows more than one cell state.
   Ideally one row with `IsFrozen = true`, which is otherwise unreachable.
3. The same period carries a non-zero `Streak` / `BestStreak` / `TotalPeriodsCompleted` consistent with those
   rows, so the personal-bests panel has a value and it agrees with the history.
4. ≥ 1 routine item has `Streak >= 30`. Ideally also 90, 180 and 365, which needs three more items (or three
   more periods) but would be the first time those branches render at all.
5. The new ids and counts are reported in the seed response and typed in `e2e/fixtures/seed.ts`, the way
   `dayPlannerTemplates` and `trackingMappings` were for [`B3`](_done/B3-seed-fixture-coverage.md).

## Notes

- **Do not build a parameterised seed endpoint for this.** A seed endpoint that takes a shape is a second
  write API running parallel to the real one. The rule for what may go in the fixture at all lives in the API
  repo's `docs/e2eTestSeed.md`, under "What belongs in the fixture"; this ask is a request for *more fixture
  rows*, not for a way to request them.
- **Why this is being asked now, having been known since round 1.** The need was recorded as two table rows
  inside `docs/views/_fix-queue.md` and never written up, so it survived `e2e-v1 → v2 → v3` without anyone
  asking. That is the whole reason it is a file this time.
- The streak *mechanics* are not in question and need no change — `RoutineResetService` was read in the same
  pass and behaves as documented (the increment is once per cycle, guarded and tested). This is purely about
  the fixture having no history for those mechanics to have produced.

## How this was established

Source reads, in the API repo at `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`:

- `AdhdTimeOrganizer/infrastructure/testSupport/E2eFixtureSeeder.cs` — `AddRoutines()` (the three rows above);
  and a search of the whole file for `RoutinePeriodCompletion` / `TotalPeriodsElapsed` / `CompletionHistory`,
  which returns **no matches**.
- `AdhdTimeOrganizer.Routines/infrastructure/persistence/seeder/userDefault/RoutineTimePeriodSeeder.cs` — the
  four period definitions, carrying threshold and grace only.

Client-side, in this repo: `RoutineTodoListItem.vue` (`getMilestoneIcon`),
`dto/response/routine/RoutineTimePeriodEntity.ts` (`mockHistory`, `defaultHistoryDepth`), and
`docs/views/todo-routine/findings.md` U1/U2, whose evidence *was* captured in a browser.

**What this does not prove:** nobody has re-driven `/routine-todo-list` against `e2e-v3` to watch these
surfaces be empty. The source says the rows cannot exist; a browser pass would add the screenshot. The unit 10
re-run is the natural place to attach it.
