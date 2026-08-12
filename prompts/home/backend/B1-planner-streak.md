# B1 · Backend ask — server-side day-plan completion streak

**Contract only.** This states the rules the frontend currently guesses at and the fields it needs back.
Storage, entities, EF configuration, migrations, indexes, and whether the streak is stored or recomputed
are the backend agent's decisions, not requests made here.

Nothing is blocked: the streak chip renders today. What does not work is the number in it.

## The problem

`src/core/home/store/plannerStreakStore.ts` is a localStorage counter with no server behind it. The
H2 work made it per-user (`byUser` keyed by `userStore.currentUser.id`, line 35) so a shared browser
no longer merges two people's streaks. That was the only part fixable from the client. Three defects
remain, and all three are structural:

1. **It only counts days this browser had the app open.** The counter is advanced by `syncStreak()`
   (`src/core/home/composable/useTodayPlan.ts:241`), which runs after a plan is fetched or a task's
   status is patched. `fetchPlan()` (line 286) only ever fetches **today**. A user who completes
   Monday's plan on their phone and opens the desktop app on Tuesday has a desktop streak of 1.
2. **`revokeCompletedDay` is not a correct inverse of `registerCompletedDay`.** When a task is
   un-ticked, `revokeCompletedDay` (`plannerStreakStore.ts:82`) decrements `current` and rolls
   `lastCompletedDate` back one day. It has no way to know whether the previous day was also complete
   or whether the streak started today, so rolling back one day is a guess. Un-tick and re-tick a task
   and the count is silently wrong — on a single device, with no sync involved.
3. **The user-visible number depends on browser storage.** Clearing site data resets it to zero.

The user sees a flame chip with a number in two places — `NowBar.vue:131-138` and
`DayPlannerWidget.vue:20-28` (the latter also shows `best` as a tooltip). Both are presented as a fact
about the user. Right now they are a fact about the browser profile.

## The business rules

Every rule below is something the client currently **assumes**. None of them was decided anywhere; they
are what fell out of writing the widget. Please confirm or correct each — the frontend will follow the
server's answer.

1. **What makes a day count?** Client rule: every non-background task in the day's plan has status
   `completed`. Confirm.

2. **Does a `Cancelled` (skipped) task break the day?** Client rule: **yes, permanently.** Skipping is a
   first-class action in this UI — the now-bar menu offers three reasons (`NowBar.vue:108-115`:
   ran out of time / not relevant any more / no energy) — but `syncStreak()` compares
   `completedCount === totalCount` and `Cancelled` is not `Completed`, so once a task is skipped that
   day can never count. The rest of the app treats `Cancelled` as *finished*, not *failed*:
   `isFinished()` (`useTodayPlan.ts:81`) groups it with `Completed`, so a skipped task is struck through
   and stops being "missed". So the app tells the user skipping is a legitimate way to close a task, and
   then silently ends their streak for it. **This is the question that matters most.** Options as we see
   them: a skip breaks the day; a skip is neutral (the day counts on the remaining tasks); or a skip is
   neutral only for some reasons. We have no basis to choose.

3. **Does a day with no plan break the streak, or is it invisible?** The client is currently
   self-contradictory here. `syncStreak()` returns early when `totalCount === 0`
   (`useTodayPlan.ts:242`), so a no-plan day neither completes nor breaks anything — but `isAlive`
   (`plannerStreakStore.ts:64`) only counts the streak while `lastCompletedDate` is today or yesterday,
   so two consecutive no-plan days zero it anyway. Weekends and holidays are exactly this case. Which is
   it: does an empty day break the streak, extend it, or not exist as far as the streak is concerned?

4. **Does a plan with only background tasks count as empty?** Client rule: yes — `nonBackgroundTasks`
   (`useTodayPlan.ts:71`) filters `isBackground` out of both the numerator and the denominator, so
   background tasks can never complete or block a day. Confirm this is intended and not an artefact of
   the progress ring wanting the same denominator.

5. **Are there grace days?** The routine-todo side of this app already has them, per time period:
   `RoutineTodoWidget.vue:99` passes `item.timePeriod.streakGraceDays` (alongside
   `timePeriod.lengthInDays`) into `RoutineTodoListItem`'s `streakConfig`. The planner streak has no
   equivalent and no concept of one. Should it have grace days, and if so is the allowance a user
   preference, a fixed constant, or borrowed from somewhere that already exists?

6. **Which day boundary?** The client computes the date from the browser clock in local time
   (`plannerStreakStore.ts` `toIsoDate`, and `useTodayPlan.ts:65`). `User.timezone` already exists on the
   user DTO (`src/_common/modules/user/dto/response/User.ts:24`, default `Europe/Bratislava`). The server
   should decide the boundary and say which it used; the frontend will stop computing dates for this.

7. **Is a completed day retroactively editable?** Today's plan can be re-opened and a task un-ticked at
   any point (`toggleTaskStatus`). Can a past day's task status change, and if so does the streak
   recompute across the gap?

## The shape the frontend needs

One read model, returned wherever is cheapest — it is needed on every home-page load, so hanging it off
the existing plan/calendar response is preferable to a sixth independent request (the home page already
fires four to six on mount; see the H7 note in this directory's README).

| Field | Type | Nullable | Why |
|---|---|---|---|
| `currentStreak` | integer | no | The number in the flame chip, `NowBar.vue:137` and `DayPlannerWidget.vue:27`. Already zeroed by the server when dead — the frontend must not have to decide whether a streak is still alive. |
| `bestStreak` | integer | no | The tooltip on `DayPlannerWidget.vue:25`. |
| `isTodayComplete` | boolean | no | Lets the widget reflect a tick immediately without guessing the rule in question 1. |

`currentStreak` must be **the value to display**. The client currently owns the "is it still alive"
decision (`isAlive`, `plannerStreakStore.ts:64`) purely because it had to; that logic depends on rules 2,
3 and 5 above and belongs on the server with them.

Freshness: the number changes at most once per task status change. A recompute on write is enough —
this does not need to be live.

If the write path needs anything from the client to recompute (it should not — the status patch already
carries the change), say so; the frontend currently sends nothing streak-specific.

## What changes on the frontend once this lands

- `src/core/home/store/plannerStreakStore.ts` is **deleted outright** — 102 lines, including the
  per-user keying, the date arithmetic, `isAlive`, and both mutation functions.
- `syncStreak()` and its two call sites in `useTodayPlan.ts` (lines 159, 298) are deleted, along with
  the `streakStore` entry in the composable's return.
- `NowBar.vue` and `DayPlannerWidget.vue` read the three fields off the plan response instead of a store.
- The `TODO(Bn)` at `useTodayPlan.ts:240` is removed.
- The localStorage keys `plannerStreak` (pre-H2) and `plannerStreak.byUser` stop being written. Neither
  is read by anything else.
