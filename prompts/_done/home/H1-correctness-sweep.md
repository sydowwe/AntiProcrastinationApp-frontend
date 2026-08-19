# H1 · Correctness sweep (home)

- **Scope:** `../../../src/core/home`, `src/HomeView.vue`
- **Backend:** none
- **Model / effort:** Sonnet 5, medium — every defect is located and diagnosed below; the work is applying fixes, not finding them.
- **Depends on:** nothing
- **Unblocks:** everything — run this first

---

```
Fix the following confirmed defects in src/core/home/. Each is a real bug with a located cause.
Do NOT restructure anything — H3 moves the view, H4 extracts the shared card shell, H5 moves the
raw API calls into the owning modules' api composables. Overlapping with those here creates
conflicts. Change behaviour only where listed.

--- 1. The activity-history widget is pinned to a hardcoded date (highest impact) ---

src/core/home/component/ActivityHistoryWidget.vue:59

    const today = formatDateForApi(new Date('2026-04-10'))

A debug leftover. `today` feeds BOTH the pie-chart request (DetailPieChartRequest, line 74-80) and
the "open in full view" router push (line 9, `query: { date: today }`). So the widget titled
"Today's activity" has, since it was written, been showing a fixed day in April 2026 and the
external-link button navigates there too.

Fix: compute it from the real current date. Do not compute it once at module scope either — see
defect 3 below; this widget's date must be derived at request time.

--- 2. "Add to planner" pushes to a route that does not exist ---

src/core/home/component/TodoListWidget.vue:51
src/core/home/component/RoutineTodoWidget.vue:107

    @addToPlanner="router.push({ name: 'taskPlanner' })"

There is no route named 'taskPlanner'. Registered names are 'toDoList' and 'routineToDoList'
(src/core/todoList/todoList.routes.ts) and 'dayPlanner' / 'plannerCalendar' etc.
(src/core/dayPlanner/dayPlanner.routes.ts). The string 'taskPlanner' appears in
src/app/nav/navItems.ts:50 as an i18n key (`navigation.taskPlanner`), which is what it was probably
copied from. vue-router throws on an unresolvable name, so the handler dies.

Fix: push to 'dayPlanner' with today's date param, matching how NowBar.vue:264 and
DayPlannerWidget.vue do it (`{ name: 'dayPlanner', params: { date: todayUrlDate } }`). Read
`todayUrlDate` from useTodayPlan() rather than recomputing the format.

Then check the rest of the router.push calls in this module resolve — the same copy-paste is the
likely origin of any other bad name.

--- 3. Three values are frozen at setup and go stale at midnight ---

- src/core/home/composable/useTodayPlan.ts:42 — `const todayUrlDate = usStringToUrlString(...)`,
  a plain const evaluated when the composable is first called. The app is a dashboard people leave
  open; after midnight every "open the planner" link points at yesterday.
- src/core/home/component/TodoListWidget.vue:72-73 — `const today = new Date(); today.setHours(0,0,0,0)`
  at setup, used by `daysDiff` for the whole session, so "overdue" drifts by a day.
- src/core/home/component/RoutineTodoWidget.vue:139-143 — `todayDayOfWeek` and `todayDayOfMonth`,
  same problem, and these decide which routine items are even shown (`isSuggestedForToday`).

Fix: make all three computed off the shared clock. `useTodayPlan()` already mirrors the framework
clock into a module-level `now` ref (line 27, 40) — turn `todayUrlDate` into a `computed`. For the
two widgets, derive from `useCurrentTime()`'s `currentTime` rather than a setup-time snapshot. Note
that `todayUrlDate` is consumed as a plain string in NowBar.vue:264 and DayPlannerWidget's
`openPlanner`, so those call sites need `.value` once it becomes a computed.

Do NOT build a full day-rollover reload here (refetching the plan when the date flips) — that is H2.
This item is only about the values themselves being live.

--- 4. Fixed height fights the layout it is placed in ---

src/core/home/component/ActivityHistoryWidget.vue:2

    <VCard style="height: 450px; display: flex; flex-direction: column">

HomeView.vue:50 renders it as `<ActivityHistoryWidget class="h-100" />` inside a column band sized
`flex: 0 1 clamp(240px, 33vh, 420px)`. The inline `height: 450px` wins over the `h-100` class, so on
any viewport where the band resolves under 450px the card overflows its column — the exact failure
the long comment at HomeView.vue:26-32 was written about.

Fix: drop the fixed height, use `height: 100%` like the sibling widgets (TodoListWidget.vue:2 and
QuickRecordWidget.vue:2 are the correct pattern — flex column + overflow hidden, no height).

--- 5. A three-child flex row with justify-space-between ---

src/core/home/component/RoutineTodoWidget.vue:3-43. The VCardTitle has THREE children (title span,
the streak VSheet group, the action-button group) under `justify-space-between`, so the streak
chips get pushed to dead-centre and the gap between the title and them changes with the streak
count. Every other widget header in the module is title + VSpacer + actions.

Fix: title, then the streak group, then `<VSpacer />`, then the actions — with `ga-2` for spacing
rather than relying on `justify-space-between`. Keep the streak sheets adjacent to the title.

Also: `loadingPeriods` (line 136, 194-201) is assigned but never read in the template. Either show
the streak sheets' loading state with it or delete the ref.

--- 6. Silent failure catches ---

Every widget treats a failed request as an empty result, so a 500 renders as a cheerful "all done"
or "nothing tracked":

- ActivityHistoryWidget.vue:83 `catch { pieData.value = null }` → renders `home.noHistory`
- useTodayPlan.ts:263-266 `catch { calendar = null; tasks = [] }` → renders `home.noCalendar`
  with a "Plan today" button, i.e. offers to create a plan that may already exist
- TodoListWidget.vue:94 and RoutineTodoWidget.vue:182 — `.catch(() => load())` on the toggle, which
  silently reverts the tick with no explanation

The full fix (a shared error state per widget) is H6. Here, do the minimum that stops lying:
remove the swallowing `catch` blocks in ActivityHistoryWidget and useTodayPlan so the axios
interceptor's error snackbar actually fires, keeping the `finally` that clears `loading`. Leave the
optimistic-toggle `.catch(() => load())` alone — H6 replaces it with a snackbar + revert.

--- 7. Dead locale keys ---

src/core/home/_locales/home.{en,sk}.ts declare `overdue`, `dueToday`, `dueTomorrow`, `dueIn`, and
`streaks`. None is referenced anywhere in src/ (checked including dynamic `$t(\`home.${...}\`)`
usage — the dynamic ones that ARE live are now/upNext/missed/allDone and skipReason.*).

The four due-* keys were meant for TodoListWidget, which sorts by due date (line 81-88) but never
displays one. That is H8 — leave the keys in place, they are about to be used. Delete only
`streaks`, which nothing plans to use.

--- Verification ---

npm run type-check   → must not exceed the 72-error baseline
npm run lint         → 0 errors
Then load the home page and confirm: the activity pie shows today's real data, "add to planner"
from both todo widgets navigates to today's planner, and the bottom band's three cards stay inside
it when the window is short.
```
