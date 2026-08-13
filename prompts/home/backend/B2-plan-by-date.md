# B2 · Backend ask — a day's plan in one request instead of two serialized ones

**Contract only.** Whether this is a new route, an extra filter field, or an expansion of an existing
response is the backend's decision; this describes only what the client needs in order to stop paying
two round-trips for one screen, and asks for a ruling on what "no plan for this day" means.

## The problem

`useTodayPlan.fetchPlan()` (`src/core/home/composable/useTodayPlan.ts:299-306`) cannot ask for today's
planner tasks in a single request:

```ts
const loadedCalendar = await calendarQuery().fetchByDate(usStringToUrlString(isoDate))
const loadedTasks = await planner().fetchFiltered(
    new PlannerTaskFilter(loadedCalendar.id, new Time(0, 0), new Time(23, 59)),
)
```

`PlannerTaskFilter` (`src/core/dayPlanner/dto/request/PlannerTaskFilter.ts:5`) is keyed on
`calendarId`, and the only way to learn a date's calendar id is `GET /calendar/by-date/{date}`. The
second request therefore cannot start until the first has returned. This is not a fan-out that HTTP/2
can overlap — it is strictly sequential, by contract.

The user-visible consequence: the now bar is the first thing on the home page and the widest element
on it, and it is blocked on two chained round-trips before it can say anything at all. Everything
else on the page (routine list, todo list, history pie) resolves in one.

**H7 is why this is worth raising now.** Before it, this cost was paid once per navigation to home.
`src/core/home/composable/useDashboardRefresh.ts` now repeats it on every stale tab-return and on a
five-minute backstop poll, all day, for a page people leave open in a pinned tab. The same two
serialized hops, dozens of times per session instead of once.

## The business rules

Each of these is currently a guess on the client. The frontend will follow whatever the server says.

1. **What does the server return for a date with no calendar?** This decides whether a live bug
   exists today. `fetchByField` (`src/_common/api/useEntityQuery.ts:35-46`) rejects on any non-2xx,
   and `fetchPlan`'s `catch` sets `error.value = true`. So if `GET /calendar/by-date/{date}` 404s for
   an unplanned day, then a user who has not planned today sees **"Could not load your plan" with a
   Retry button** — and the dedicated "no calendar yet, plan one" empty state
   (`DayPlannerWidget.vue:106-123`, `NowBar.vue:144`) is unreachable, along with its *Plan today*
   call to action. If instead it returns 200 with an empty body, the current code is correct.
   Which is it? If it is a 404, we would like the new shape to model "no plan" as a successful empty
   result, not an error.
2. **Is a calendar guaranteed to exist per (user, date), or created lazily on first task?** The
   client assumes lazily — it renders *Plan today* when the calendar is absent — but never creates
   one itself.
3. **Is the `from`/`until` time window (`00:00`–`23:59`) meaningful for a whole-day fetch, or is it
   an artefact of reusing the day-planner view's filter?** Home always passes the full day. If a
   whole-day read is the normal case, the window should be optional rather than required.
4. **Can a planner task belong to a date without belonging to a calendar?** If not, the calendar id
   is an implementation detail the client should not need to hold at all.

## The shape the frontend needs

One request that takes a **local date** (`YYYY-MM-DD`) and returns the day's plan. The client already
has the date; it does not need the calendar id for anything else.

Fields, and who renders each:

- **the calendar** — the client needs only enough to answer *does a plan exist for this day*.
  `NowBar.vue:144` and `DayPlannerWidget.vue:106` branch on presence alone; `calendar.id` is used
  solely to build the follow-up request this ask removes. If nothing else on the home page reads it,
  a nullable object or even a boolean would do — but see business rule 1, because "absent" must be a
  success, not a 404.
- **the day's planner tasks** — the same `PlannerTask` shape already returned by the filtered
  endpoint, no change requested. Home reads `id`, `activity` (`name`, `category.color`,
  `category.icon`, `category.name`), `startTime`, `endTime`, `status`, `actualStartTime`, `color`
  and `isBackground`. That is close to the whole DTO, so this is a **composition** ask, not a
  trimmed projection.

It should hang off whichever of the two existing endpoints is the more natural owner. It is hot:
after H7 it is the most frequently re-fetched thing on the page, and the only one with a backstop
poll.

## What changes on the frontend once this lands

- `fetchPlan()` in `src/core/home/composable/useTodayPlan.ts` loses its first `await` and its
  intermediate `loadedCalendar` variable — two chained requests become one, and the `TODO(Bn)`
  comment above it goes.
- `PlannerTaskFilter`'s `calendarId` stops being something the home module has to source. The
  day-planner view keeps using it as-is; nothing there changes.
- If business rule 1 turns out to be "404", this also fixes a live bug: unplanned days stop rendering
  as a failed request and start rendering the *Plan today* state that was written for them.

## Explicitly NOT asked for: a `/home/today` aggregate

`prompts/home/backend/README.md` lists one as a candidate from H7. Having done H7, the
recommendation is **do not build it**:

- A full refresh round is **6 requests** — this plan pair (2, serialized), the routine list and its
  time periods (2, parallel), `todo-list-item/dashboard-widget` (1), and the history pie chart (1).
  Collapsing the serialized pair takes it to 5, of which all 5 are parallel. That is not a load
  problem worth a new composite contract for a single-user app.
- It would actively undo H7. The point of `useDashboardRefresh` is that the widgets have
  *different* policies: the plan polls every five minutes because it changes from other devices, the
  two todo widgets deliberately never poll because they only change through user action, and the
  history pie has its own trigger for a finished timer. One aggregate endpoint collapses all of that
  into "refetch everything, always."
- It would also undo H6's per-widget error states: one failure in a composite response either fails
  the whole page or needs per-section error modelling, which is more contract surface than the four
  independent calls it replaces.

Latency per endpoint was **not measured** — no backend was reachable from the environment this was
implemented in. The request count above is from reading the API composables, each of which makes
exactly one HTTP call, and it is the count rather than the latency that the argument above rests on.
