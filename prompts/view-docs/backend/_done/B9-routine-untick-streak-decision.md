# B9 — should un-ticking a routine item inside the same cycle walk its streak back?

> ## ✅ Answered: option 2, shipped — 2026-09-15
>
> Un-ticking inside the same cycle walks the streak back. Landed in API `4ab3710` (*"Walk a routine item's
> streak back on an un-tick inside the same cycle, and break it on a miss"*), with a follow-up on the planner
> event handler.
>
> **What changed.** `RoutineTodoList.BestStreakBeforeScore` (new nullable column) is the "scored this cycle"
> mark, replacing the old `AlreadyCountedThisCycle` derivation: `null` until the item scores the open cycle;
> after the scoring tick it holds `BestStreak` as it stood *before* that tick. `RoutineResetService.UpdateItemStreak`
> (`RoutineResetService.cs:379`) now runs in both directions:
>
> - Tick, not yet scored: `BestStreakBeforeScore = BestStreak; Streak++; BestStreak = max(...)`.
>   `LastCompletedAt` still moves on every completing tick ("last completed", not "last scored").
> - Tick, already scored: no-op on the counters, as before.
> - Un-tick, mark set: `Streak--` (floored at 0), `BestStreak = max(bestBefore, Streak)`, mark cleared.
>   Un-tick/re-tick is net zero and the record is restored — the "awkward half" is handled without a history
>   recompute because the pre-score record is captured at score time.
> - Un-tick, mark null: the tick belonged to a cycle since closed — nothing to give back, no change.
>
> Every reset path clears the mark via one `OpenNewCycle` helper shared by both `TryReset` overloads, so a
> score whose cycle has closed is out of reach. The column exists because after a tick `BestStreak == Streak`
> reads identically whether the tick set the record or merely reached it.
>
> **Found on the way.** Nothing had ever zeroed `RoutineTodoList.Streak` — an item's streak was a lifetime
> count, and the `BestStreak > Streak` the seeders assume could never occur. `OpenNewCycle` now zeroes the
> item streak when the item reaches the boundary undone (the record stands); done keeps what the tick earned.
> No threshold/grace/freeze at item level — those stay period concepts.
>
> **Reach.** Both toggle endpoints; the step toggle now fires the hook on either `IsDone` transition (un-ticking
> a step of a done item never reached the streak before). `PlannerTaskIsDoneChangedEventHandler` calls
> `UpdateItemStreak` in both directions and now loads the period and runs the lazy single-item `CheckGrace` +
> `TryReset` first, like the toggle endpoints' `BeforeToggle` — otherwise a planner un-tick landing after the
> period elapsed but before any reset had run would walk back a closed cycle's score.
> `ActivityTimeRecordedEventHandler` still completes an item without loading its period, which is why the mark
> lives on the item rather than being derived against `LastResetAt`. The migration backfills the mark on rows
> that had scored under the old derivation, carrying the current record.
>
> **Tests.** `RoutineToggleIsDoneTests`: `Toggle_UntickInsideTheSameCycle_GivesTheStreakBack`,
> `Toggle_UntickAfterTheCycleClosed_LeavesTheEarlierScoreAlone`, `Toggle_UntickThenRetick_DoesNotInflateTheItemStreak`,
> `Toggle_ForceTrueTwiceOnACompleteCountedItem_DoesNotInflateTheItemStreak`,
> `Toggle_OnAnElapsedPeriod_BreaksTheStreakOfAnItemLeftUndone`,
> `PlannerHandler_OnAnElapsedPeriod_ResetsTheItemBeforeApplyingTheChange`, plus the reset-service unit tests.
>
> **For the client: nothing.** Render `streak` / `bestStreak` as sent; `BestStreakBeforeScore` is internal and
> not exposed. The "Meditation" fixture drift (6/2026-09-10 vs seeded 5/2026-09-09) is corrected by a reseed,
> and going forward a stray click undone in the same cycle leaves no trace. The `docs/e2eTestSeed.md` caveat
> option 1 would have needed is not needed.
>
> ---
>
> *Original ask below, kept as written.*

> A **decision**, not a defect report. Nothing here is broken against its own design; the question is whether
> the design is what you want. Nothing is blocked on the answer.
>
> Written 2026-09-13 from an API source read (`AdhdTimeOrganizer`). **Note the numbering collision:** this is
> backend ask `B9`, unrelated to finding `todo-routine/B9` (the refused-delete message), which is closed.

---

## Background — what was feared, and what is actually true

`docs/views/todo-routine/findings.md` escalated this as *"a done-toggle advances `streak`/`lastCompletedAt`
irreversibly … an accidental checkbox click permanently inflates a streak."* Read against the source, that
**overstates it**, and the compounding case it implies is explicitly guarded:

- `RoutineResetService.UpdateItemStreak` calls `AlreadyCountedThisCycle(item)` and returns before touching
  `Streak` / `BestStreak` if the item already scored this cycle. Its doc comment names the exact fear:
  *"un-ticking and re-ticking an item … must not walk `Streak` and `BestStreak` up. Only a reset opens the
  item up to being counted again."*
- Two tests pin it — `UpdateItemStreak_CalledTwiceInTheSameCycle_IncrementsOnlyOnce` and its control
  `UpdateItemStreak_AfterANewCycle_IncrementsAgain`.
- The **period**-level streak is unaffected by a mistake that is undone: it is evaluated at reset time from
  live state (`completedCount = items.Count(i => i.IsDone)` against `StreakThreshold`), so an accidental tick
  reverted before the period rolls over has no effect there at all.

**So the escalation is closed on its own terms.** The findings file has been corrected to say so.

## What is left, and it is small but real

The **first** tick in a fresh cycle does `Streak++` (and raises `BestStreak` if it is a record), and
un-ticking does not give it back — `UpdateItemStreak` returns immediately when `!item.IsDone`, so no decrement
path exists anywhere in the codebase.

Net cost of one accidental click: **exactly +1 on that item's streak, once, permanently**, plus possibly a
permanently inflated `BestStreak`. Bounded and non-compounding — but not reversible.

**This is not hypothetical.** It has already happened to the fixture: the round-1 documentation pass left
"Meditation" at `streak: 6` / `lastCompletedAt: 2026-09-10` instead of its seeded `5` / `2026-09-09`, from a
single accidental checkbox click while diagnosing another finding. `isDone` was restored through the UI; the
streak could not be, and the drift is now a documented caveat in the unit's own findings file.

## Why the client cannot decide this

There is no endpoint that writes an item's streak, and that looks deliberate rather than accidental — streak
fields are treated as server-owned throughout (the period update endpoint has a test asserting that *"a body
carrying streak fields cannot write them"*). The client has no way to correct a streak, and adding one
unilaterally would be the client inventing authority over a value the server owns.

It is also not something the UI can prevent. Making the checkbox harder to hit trades an accuracy problem for
a usability one on the app's most-used control, and the app is explicitly built for users who mis-click.

## The question

Pick one, or say the current behaviour is intended:

1. **Leave it.** A streak is a record of what you ticked, and an accidental tick is a real tick. Cheapest, and
   defensible — but then the fixture drift above is permanent for every future documentation pass, and worth
   saying out loud in `docs/e2eTestSeed.md` so nobody treats it as a bug later.
2. **Decrement on an un-tick inside the same cycle.** The mirror of `AlreadyCountedThisCycle`: if this item
   scored in the cycle that is still open, un-ticking gives the point back and clears the scored mark.
   `BestStreak` is the awkward half — walking it back needs either "recompute from history" or accepting that
   a personal best can be inflated by a mistake that was undone.
3. **An explicit correction path.** A "this was a mistake" affordance rather than an implicit reversal. More
   honest about intent, but it is new surface on both sides and probably not worth it for ±1.

Option 2 is what a user would expect, and it is the one the client can render without any change. But it is
your call — the streak is your model, not ours.

## Notes

- **No unit is blocked on this.** Unit 10 can run and its findings can close regardless; the only thing that
  changes with the answer is whether the fixture's streak values stay trustworthy across passes.
- If the answer is 2 or 3, the client side needs nothing new: `RoutineTodoListItem` renders whatever
  `streak` / `bestStreak` the server sends, and the undo stack is not involved (a done-toggle never populates
  it — see `todo-routine/B1`).
- Related, already answered, do not re-open: deleting a time period does **not** cascade (`Restrict`, clean
  409, test-covered) — `todo-routine/B5` step 3.
