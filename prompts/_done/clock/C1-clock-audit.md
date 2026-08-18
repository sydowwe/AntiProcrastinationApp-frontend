# C1 · Clock correctness, repo-wide

- **Scope:** every module under `src/core/` plus `src/_common/`. `core/home` and `core/dayPlanner` are already done — read them as the worked examples, do not redo them.
- **Backend:** possibly — one contract question about how wall-clock times are interpreted server-side; see the escalation block at the end.
- **Model / effort:** Opus 5, high — the work is not mechanical. Every site needs a judgement about which of three kinds of value it holds, and the wrong judgement introduces an off-by-one-day bug that looks like a fix.
- **Depends on:** nothing. `_common/composable/general/useUserClock.ts` already exists (framework `b64390f`, app `32e87ba`).
- **Unblocks:** nothing.

---

```
This app has a user-configurable timezone (`User.timezone`, edited in user settings, seeded from
`Intl.DateTimeFormat().resolvedOptions().timeZone` at sign-in) and a server that resolves day
boundaries in it. The client historically resolved its own, from whatever zone the browser was in,
using `getHours()` / `getMinutes()` / `getDate()` / `formatDateForApi` — or, worse,
`toISOString().slice(0, 10)`, which is UTC and therefore wrong for everyone west of Greenwich in the
evening and east of it in the early morning, whatever their configured zone.

`core/home` and `core/dayPlanner` were migrated onto `_common/composable/general/useUserClock.ts`.
The rest of the repo was not. Your job is the rest, and the point of this prompt is that it is NOT a
find-and-replace: most matches you will find are correct as they stand.

--- The taxonomy: three kinds of Date, and only one of them is yours ---

1. **An instant** — `new Date()`, `useCurrentTime()`'s tick, a tracking session's `startTimestamp`.
   A moment on the world's timeline. Reading a wall-clock field off it is zone-dependent, and this
   is the ONLY class that goes through `useUserClock`.

2. **A calendar day** — a date out of a picker, a route param, a local midnight, `store.viewedDate`.
   Nothing about it is a moment; its *browser-local* year/month/day fields ARE the value. Read these
   with `formatDateForApi`, which round-trips. Passing one to `isoDateInUserZone` shifts it by a day
   — this is the way to break something while believing you are fixing it. To ask "is this picked
   day today", write `formatDateForApi(picked) === isoDateInUserZone()`.

3. **Date arithmetic** — `d.setDate(d.getDate() + 7)`, `start.setDate(start.getDate() - days)`.
   Adding days to a date you already hold. Zone-independent and CORRECT AS IS. Do not touch these.
   They are the majority of the grep hits. `_common` has nine of them and every one is fine.

The API, all taking instants:

  userTimeZone                      ComputedRef<string>, falls back to the browser's zone
  isoDateInUserZone(instant?)       'YYYY-MM-DD'   — replaces formatDateForApi(new Date())
                                                   — replaces toISOString().slice(0, 10)
  minutesOfDayInUserZone(instant?)  minutes since midnight
  timeInUserZone(instant?)          Time           — replaces Time.fromDate(...)
  isTodayInUserZone(isoDate)        boolean

Registered in `main.ts` via `installFramework({ userTimeZone })`. Unregistered it falls back to the
browser zone, so nothing breaks in other apps on this framework.

--- Severity, highest first. Work in this order. ---

**A. Persisted wall-clock times.** The value is written to the server as the hour something actually
happened. Wrong here means the database is wrong, and no later fix recovers it.

  core/activityHistory/view/PomodoroTimerView.vue:360   emit('started', Time.fromDate(startTimestamp.value))
  core/activityHistory/view/StopWatchView.vue:109       same
  core/activityHistory/view/TimerView.vue:161           same

  These three are the direct analogue of `DayPlannerLogTimeController.vue:114`, which is already
  fixed — read that one first. Follow the emit through to whoever persists it and confirm the whole
  path, rather than assuming the emit site is the only place the hour is read.

**B. "Is this today" answered in UTC.** Confirmed live bug, same shape as the `Calendar.isToday` that
was already fixed:

  core/historyDashboard/dto/response/CalendarActivityDaySummary.ts:22
      return this.date === new Date().toISOString().slice(0, 10)

  Fix is `isTodayInUserZone(this.date)`. Check what renders it before you assume the blast radius is
  small.

**C. Wall-clock prefills.** A time the user is about to accept, so a wrong one is silently saved:

  core/todoList/component/normal/ToDoListItemDialog.vue:190
      Time.fromMinutes(roundToNearestInterval(now.getHours() * 60 + now.getMinutes() + 15, 15))

  The analogue already fixed is `PlannerTaskRequest.createEmpty` / `TemplatePlannerTaskRequest.createEmpty`.

**D. Display-only reads of instants.** Wrong by the offset, but nothing is persisted. Judge whether
each is worth the churn — say so either way in your final message:

  core/activityTracking/component/stackedBars/StackedBarsChart.vue:156   d.getHours() * 60 + d.getMinutes()
  core/activityTracking/component/stackedBars/StackedBarsGrid.vue:456    `${date.getDate()} ${date.toLocaleString(...)}`
  core/activityTracking/component/stackedBars/StackedBarsGrid.vue:460    hh:mm off an instant
  core/activityTracking/component/timeline/TimelineTimeAxis.vue:43,50    axis ticks off an instant
  core/historyDashboard/component/HistoryTimeline.vue:125,140            first/last getDate() comparisons
  core/activityHistory/view/HistorySummaryView.vue:198,205               Time.fromDate(d)

  `HistoryTimeline`'s two are day-boundary comparisons between instants — decide whether they are
  class 1 or class 2 before touching them; the variable names do not tell you.

**E. Cosmetic.** `core/user/component/settings/DataExportSection.vue:36` puts a UTC date in a
download filename. Probably leave it; if you do, say so rather than silently skipping.

**Deliberately excluded — do not "fix" these:**

- `core/dayPlanner/store/dayPlannerStore.ts:189` (`datetimeToSlotIndex`) — zero callers, and its
  `Date` parameter is undetermined between class 1 and class 2. Deleting it is defensible; changing
  it is not.
- `core/dayPlanner/component/settings/RepeatingTaskDialog.vue:374-375` —
  `toISOString().split('T')[0]` on picked dates. A real off-by-one, but it is class 2 (date-picker
  serialisation), not a clock bug. Note it, leave it, or fix it as a clearly separate commit.
- `_common/component/dateTime/DateTimePicker.vue:52,66` — `Time.fromDate(model.value)` on a
  v-model'd picker value. Almost certainly class 2. Establish which before touching a shared
  component that four other apps use.
- Every `setDate(getDate() ± n)` in `_common` and elsewhere. Class 3.

`_common/utils/DateTimeHelper.ts:18,24` (`isSameDay`, `formatDateForApi`) are the class-2 primitives
themselves. They are correct. Do not route them through `useUserClock` — that would invert the very
distinction this prompt is about.

--- Rules ---

- `src/_common` may be edited, but read CLAUDE.md's submodule section first: the change must be
  generic, must not import `@/core/**`, must default to current behaviour when unregistered, must
  update `src/_common/docs/`, and must be committed IN the submodule before the app-side pointer
  bump. Note that `composable/general/` and `utils/` import nothing from `modules/` — keep it that way.
- Do not re-migrate `core/home` or `core/dayPlanner`. If you find a site there that was missed, fix
  it and say so, but they are not the job.
- Every change needs a one-line comment saying which class the value is and why. The next person
  will otherwise "simplify" it straight back.

--- Verification ---

npm run type-check (≤ 65 errors, and `src/_common` must stay at 0 — any error there is a regression,
not baseline noise), npm run lint (0 errors), npx vite build.

Then verify the arithmetic rather than eyeballing it. There is no test runner wired for `src/`
(vitest is a dependency; the only spec is `src/_common/axiosConfig.test.ts`), so the cheapest honest
check is a scratch Node script over `Intl.DateTimeFormat`, which is what was done for the original
change:

1. one instant, several zones — the date and the minute must move TOGETHER
2. local midnight must read 00:00, never 24:00 (`hourCycle: 'h23'`, not `hour12: false`)
3. a DST spring-forward instant, and a half-hour-offset zone (Asia/Kolkata)
4. an unsupported zone name must throw RangeError, so the browser-zone fallback fires
5. for each site you change, the round-trip that matters: a class-2 value read with
   `formatDateForApi` must come back unchanged in a zone six hours away

Nothing in `core/home` or `core/dayPlanner` has ever been verified in a browser, and neither will
yours be unless you can reach a backend. Say plainly in your final message which of your changes are
reasoned and which are observed. Do not describe a static check as if it were a runtime one.

--- After the frontend work: write the backend ask, IF you actually hit it ---

There is one contract question this work is likely to raise, and it is worth asking only if you find
evidence for it rather than asking it speculatively.

The client now writes wall-clock times (`actualStartTime`, `actualEndTime`, planner task
`startTime` / `endTime`) as **user-zone** local times with no offset attached. That is only correct
if the server interprets them the same way. If it stores them as UTC, or applies its own conversion,
then the fix in section A moves the bug rather than removing it.

What would be evidence: a task started at a known wall-clock time coming back from the server at a
different one; a `DateTime` field where a `TimeOnly` was expected; or an existing backend endpoint
that already converts. If you find any of that, read `prompts/home/backend/README.md` for the format
and write the ask to `prompts/home/backend/Bn-<slug>.md`, numbering from the highest `Bn` present.
State which fields, which endpoints, and what the client now sends — not a request for a
particular storage decision, which is out of scope there.

If you find no evidence, write nothing and say so. `PlannerStreakResponse` already establishes that
the server thinks in `User.Timezone`, which is weak evidence that this is already consistent.
```
