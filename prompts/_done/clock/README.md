# Clock prompts

Timezone and wall-clock correctness, which is cross-cutting rather than owned by one module. Written
to be pasted into a fresh session in this repo — `CLAUDE.md` auto-loads there, so the prompts carry
only task-specific facts.

## Index

| #  | Prompt                                   | Kind | Backend  | Model      | Effort |
|----|------------------------------------------|------|----------|------------|--------|
| C1 | [Clock correctness, repo-wide](C1-clock-audit.md) | bug  | possibly | **Opus 5** | high   |

## What already landed

Do not redo these; read them as the worked examples.

- **`_common/composable/general/useUserClock.ts`** (framework `b64390f`, app `32e87ba`) —
  `userTimeZone`, `isoDateInUserZone`, `minutesOfDayInUserZone`, `timeInUserZone`,
  `isTodayInUserZone`, over a cached `Intl.DateTimeFormat`. Registered through
  `installFramework({ userTimeZone })` rather than importing the user store, because
  `composable/general/` and `utils/` import nothing from `modules/` and that boundary is what lets an
  app opt out of the user module. Unregistered it falls back to the browser's zone, so adoption is
  per-app.
- **`core/home`** — the date signal in `useDashboardRefresh`, `nowMinutes`, the three persisted
  `Time.fromDate` calls, `NowBar`'s date labels. Plus `assertServerDateAgrees` in `useTodayPlan.ts`,
  a tripwire comparing the client's day boundary against the server's.
- **`core/dayPlanner`** — eleven sites, listed in `migration-revision.md` R16.

## The distinction the whole thing turns on

A `Date` is used for three different things and only one belongs to `useUserClock`:

| Kind | Examples | Read it with |
|---|---|---|
| **Instant** | `new Date()`, `currentTime`, a tracking `startTimestamp` | `useUserClock` |
| **Calendar day** | a picked date, a route param, `store.viewedDate`, a local midnight | `formatDateForApi` — browser-local fields round-trip |
| **Date arithmetic** | `d.setDate(d.getDate() + 7)` | nothing — already correct |

Most grep hits are the third kind. Converting one of those, or passing a calendar-day `Date` to
`isoDateInUserZone`, introduces an off-by-one-day bug that looks like a fix.

## Severity, and why this is not cosmetic

Three classes, worst first:

1. **UTC reads** — `toISOString().slice(0, 10)` is not merely browser-local, it is UTC, so it is
   wrong for everyone west of Greenwich in the evening and east of it in the early morning
   *regardless of any timezone setting*. `Calendar.isToday` had this; `CalendarActivityDaySummary`
   still does.
2. **Persisted wall-clock times** — a wrong hour is written to the database and no later fix
   recovers it. The three timer views in `core/activityHistory` are the remaining instances.
3. **Display-only reads** — wrong by the offset, nothing persisted.

## Confirmed remaining defects

Every one below was found by reading the code, not by pattern-matching:

- **`core/historyDashboard/dto/response/CalendarActivityDaySummary.ts:22`** — `isToday` compared
  against `new Date().toISOString().slice(0, 10)`. Exactly the bug already fixed in
  `dayPlanner/dto/response/Calendar.ts`.
- **`core/activityHistory/view/{PomodoroTimerView,StopWatchView,TimerView}.vue`** — three
  `emit('started', Time.fromDate(startTimestamp))`, persisting a browser-zone hour as when work
  actually happened. Direct analogue of the already-fixed `DayPlannerLogTimeController.vue:114`.
- **`core/todoList/component/normal/ToDoListItemDialog.vue:190`** — a suggested-time prefill off
  `now.getHours()`, which the user then silently accepts.
- **`core/activityTracking`** — four display reads across the stacked-bar chart and timeline axis.

## Deliberately out of scope

- `dayPlannerStore.datetimeToSlotIndex` — zero callers, ambiguous parameter. Delete or leave.
- `RepeatingTaskDialog.vue:374-375` — a real `toISOString()` off-by-one, but date-picker
  serialisation rather than a clock bug.
- `_common/component/dateTime/DateTimePicker.vue` — almost certainly a calendar-day value, and it is
  a shared component other apps use.
- `_common/utils/DateTimeHelper.ts`'s `isSameDay` / `formatDateForApi` — these *are* the calendar-day
  primitives and are correct.

## Not verified

Nothing in `core/home` or `core/dayPlanner` has been loaded in a browser — no backend was reachable
when they were written. The `Intl` arithmetic underneath them *was* checked directly (dates and
minutes moving together across zones, midnight reading `00:00` under `hourCycle: 'h23'`, DST and
half-hour offsets, `RangeError` on unsupported zones). Those are different claims and C1 asks the
next agent to keep them apart too.
