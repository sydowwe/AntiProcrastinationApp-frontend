# H2 · `useTodayPlan` shared-state lifecycle

- **Scope:** `src/core/home/composable/useTodayPlan.ts`, `src/core/home/store/plannerStreakStore.ts`
- **Backend:** likely — the streak cannot be made correct client-side; see the escalation block at the end
- **Model / effort:** Opus 5, high — this is module-level mutable state shared by two components with a hand-rolled cache; the failure modes are subtle and easy to reintroduce.
- **Depends on:** H1 (item 3 makes `todayUrlDate` reactive; this prompt builds on that)
- **Unblocks:** H7

---

```
src/core/home/composable/useTodayPlan.ts holds module-level state — `calendar`, `tasks`, `loading`,
`now`, plus `loadPromise`, `alertsWired` and the `firedAlerts` Set (lines 24-31). That design is
deliberate and correct in intent: NowBar and DayPlannerWidget are two views of one plan and must not
drift or double-fetch. Keep the single-source-of-truth design. Fix its lifecycle, which is missing.

--- 1. Nothing ever resets it ---

The state is created once per JS module instance, i.e. once per page load, and there is no teardown
path. Consequences:

- Sign out, sign in as another user: `calendar` and `tasks` still hold the previous user's plan.
  `ensureLoaded()` (line 271) is a no-op because `loadPromise` is non-null, so the stale plan is
  what the new user sees on the home page. This is a data-leak-shaped bug, not just a refresh bug.
- The streak store persists to localStorage (plannerStreakStore.ts:65) and is likewise not
  namespaced per user, so a shared device merges two people's streaks.

Fix: add an exported `resetTodayPlan()` that clears `calendar`, `tasks`, `loadPromise`,
`firedAlerts`, and resets `loading` — then call it wherever the session ends. Find the logout path
in the framework's user module (`src/_common/modules/user/store/authStore.ts` — read it, do not
guess the export name) and hook the reset there from app-side code. Do NOT edit src/_common; it is a
git submodule. If the framework offers no hook to attach to, wire the reset from
`src/core/user/authAdapter.ts` or watch `userStore.currentUser?.id` in the composable and reset when
the id changes. Prefer the id watch if the framework has nothing to subscribe to — it is app-side
and self-contained.

Namespace the streak store by user id the same way. Do NOT try to make the streak number itself
correct — you cannot from the client, and the escalation block at the end of this prompt covers it.

--- 2. `firedAlerts` grows without bound and never rolls over ---

Line 31: `const firedAlerts = new Set<string>()`, written by `fireOnce` (line 248) with keys like
`${task.id}:pre`. Nothing removes entries. Two problems:

- On a long-lived tab spanning midnight, yesterday's task ids stay in the Set. Not harmful for
  distinct ids, but the Set is unbounded for a session that never reloads.
- More importantly the alerts themselves are wrong across a day boundary: `checkAlerts` (line 222)
  compares `startTime.getInMinutes` against `nowMinutes`, both minutes-since-midnight with no date
  component. After the date flips, every task from the loaded (now yesterday's) plan looks like it
  is starting soon again — but the Set suppresses that, so the actual behaviour is "alerts silently
  stop working" rather than "alerts fire wrongly". Both are wrong.

Fix: give the plan a date identity. Track the ISO date the current `tasks` belong to; when the
clock crosses into a new date, clear `firedAlerts`, clear the plan, and refetch for the new date.
That is the day-rollover reload H1 explicitly left out — do it here.

--- 3. `alertsWired` leaks under HMR and hides a watcher ---

Lines 30, 281-284:

    if (!alertsWired) { alertsWired = true; watch(nowMinutes, checkAlerts) }

That `watch` is created inside whichever component instance happens to call `useTodayPlan()` first,
so it is bound to that instance's effect scope and is disposed when that component unmounts — while
`alertsWired` stays true, so it is never recreated. Concretely: NowBar mounts first and wires the
watcher; if NowBar is ever unmounted while DayPlannerWidget stays (or on any HMR update of NowBar),
transition alerts stop firing for the rest of the session with no error.

Fix: create the watcher outside any component scope — either at module scope with an explicit
`effectScope()` you own, or via `watchEffect` inside a scope created next to the state at lines
24-31. The same applies to the `watch(currentTime, ...)` at line 40, which is created afresh on
every `useTodayPlan()` call: today that is two identical watchers doing the same assignment. Create
it once.

--- 4. `loading` is never true for the second consumer ---

`ensureLoaded()` returns the in-flight promise but `loading` is a shared ref that `load()` sets to
true at line 256 and false in its `finally`. Both widgets show a spinner correctly on first load.
But `reload()` (line 276) — called from NowBar's TrackTimeDialog `@done` (NowBar.vue:149) — sets
`loading` true again, so a background refresh after tracking blanks BOTH widgets to spinners. That
is a visible flicker on every completed timer.

Fix: distinguish first load from refresh. Keep `loading` for the initial fetch only and add a
separate `refreshing` flag that widgets can render as a subtle indicator (or ignore) without
tearing down their content.

--- 5. Optimistic writes have no user-visible failure ---

`setStatus` (line 124), `snoozeTask` (line 182) and `extendTask` (line 200) all mutate the task,
await the request, and silently restore the previous value on throw. The user taps "Done", the tick
animates, then quietly un-ticks. The axios interceptor may show a generic error snackbar depending
on the endpoint's config, but the revert itself is unexplained.

Fix: on revert, show an explicit snackbar via useSnackbar() naming what failed to save. Keep the
optimistic update — it is the right call for this UI — just make the rollback legible.

--- Constraints ---

- Do not change the public shape returned at lines 286-321 beyond additions; NowBar.vue and
  DayPlannerWidget.vue destructure it heavily.
- Do not edit src/_common.
- Keep the existing comments explaining WHY the state is module-level (line 22-23) and why the
  streak uses localStorage (plannerStreakStore.ts:4-10) — update them if the reasoning changes.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then manually:
1. Sign out and back in as a different user — the home page must show the new user's plan.
2. With the tab open, set the OS clock past midnight — the plan must refetch for the new date and
   alerts must arm again for the new day's tasks.
3. Track time on the active task and finish — the widgets must not blank to spinners.

--- After the frontend work is done: write the backend ask ---

Item 1 makes the streak per-user instead of per-device. It does not make the number right, and
nothing you can do in the client will. While fixing the store you will have read it closely enough
to see why: it is derived only from days the user happened to have the app open (`load()` only ever
fetches TODAY's plan), and `revokeCompletedDay` is not a correct inverse of `registerCompletedDay` —
it cannot distinguish "yesterday was also complete" from "the streak started today", so the count
drifts even on a single device.

Once the frontend work above is finished and verified, write that up as a backend ask.
Read prompts/home/backend/README.md for the required format and scope rules — contract and business
rules only, no storage or entity decisions — and write it to prompts/home/backend/Bn-<slug>.md.

The valuable part of that ask is NOT the endpoint shape, which is obvious. It is the rules the
current client only guesses at, which you will have just read in context: does a Cancelled (skipped)
task break the day, does a day with no planned tasks break the streak or is it invisible, and are
there grace days as the routine-todo side has (`streakGraceDays`, RoutineTodoWidget.vue:99). Put
every one of those to the backend as a question, citing what the client does today.

Then say in your final message that you wrote it and that the streak stays per-device until it lands.
```
