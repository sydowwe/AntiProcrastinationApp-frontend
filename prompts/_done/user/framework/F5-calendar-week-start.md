# F5 · `CalendarGrid` ignores the user's `firstDayOfWeek` preference

**RESOLVED 2026-08-18 — see `../../../../migration-revision.md` R20.** Landed as written: `getWeekStart` /
`getWeekEnd` in `DateTimeHelper.ts` and an optional `firstDayOfWeek?: 0 | 1` prop (default `1`) on
`CalendarGrid`, plus a day-header rotation the ask did not anticipate. The rest of this file is kept as the original ask.

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap

`_common/component/calendar/CalendarGrid.vue` computes every week boundary with
`getISOWeekStart` / `getISOWeekEnd` (lines 208, 209, 225, 267), which are themselves fixed to Monday (`_common/utils/DateTimeHelper.ts:90-104` has no non-ISO
variant). The app now has a working
`firstDayOfWeek` control (`../P2-first-day-of-week.md`,
`../../../../src/core/user/component/settings/PreferencesSection.vue`) that a user can set to Sunday, but the planner calendar's week rows will keep starting on
Monday regardless — the preference has no effect on the one screen where "which day starts the week" is most visible.

## Why it cannot be fixed app-side

`CalendarGrid` takes no prop for week start and its date math is internal to the component; there is no slot or seam through which an app can override how it buckets
days into weeks.
`DateTimeHelper.ts`'s week helpers are ISO-only, so nothing in `_common/utils` can be composed app-side either without duplicating the grid's row-building logic.

## The app-side workaround kept in the meantime

`core/todoList/composable/useRoutineWeeklyReview.ts:17-28` hand-rolls its own week-start arithmetic against `useUserPreferences().firstDayOfWeek` instead of using
`DateTimeHelper`, specifically because the framework helper is Monday-only.

An audit of every week boundary in `../../../../src/core` (grep for `getISOWeek`, `isoWeek`, `startOf('week')`,
`weekStart`) found exactly three, and no direct `getISOWeek*` call site app-side at all:

- `useRoutineWeeklyReview.ts` — respects the preference, via the hand-rolled arithmetic above.
- `core/dayPlanner/view/PlannerCalendarView.vue` and `core/activityHistory/view/HistoryCalendarView.vue`
  — both render `CalendarGrid`, and both therefore ignore the preference. These are the two consumers this ask exists for.

Week *numbers* (`formatWeekLabel`'s `W1`, `DateTimeHelper.ts:96`) are legitimately ISO by definition and are out of scope.

## What the framework should expose

1. An optional `firstDayOfWeek?: 0 | 1` prop on `CalendarGrid` (0 = Sunday, 1 = Monday), defaulting to `1` so every existing consumer keeps today's ISO/Monday
   behaviour unchanged.
2. A non-ISO counterpart to `getISOWeekStart` / `getISOWeekEnd` in `DateTimeHelper.ts` — e.g.
   `getWeekStart(date, firstDayOfWeek)` / `getWeekEnd(date, firstDayOfWeek)` — so `CalendarGrid` and any future consumer share one implementation instead of each
   hand-rolling the offset arithmetic
   `useRoutineWeeklyReview.ts` currently duplicates.

## What gets deleted here when it lands

`useRoutineWeeklyReview.ts`'s hand-rolled `weekStartIso` computed (lines 17-28) is replaced with a call to the new `DateTimeHelper` helper, and the app wires
`firstDayOfWeek` from
`useUserPreferences()` into `CalendarGrid`'s new prop at its two call sites —
`core/dayPlanner/view/PlannerCalendarView.vue:2` and
`core/activityHistory/view/HistoryCalendarView.vue:2`.
