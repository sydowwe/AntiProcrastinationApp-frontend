# Home prompts

Improvements to `../../../src/core/home` (and `src/HomeView.vue`, which belongs to it), one self-contained prompt per file. Each is written to be pasted into a fresh
session in this repo — `../../../CLAUDE.md`
auto-loads there, so the prompts carry only task-specific facts (file paths, line numbers, the existing composables) rather than restating conventions.

Correctness first, then structure, then UX. Every defect below was confirmed by reading the code.

## Index

| #   | Prompt                                                    | Kind          | Backend  | Model      | Effort   |
|-----|-----------------------------------------------------------|---------------|----------|------------|----------|
| H1  | [Correctness sweep ⭐](H1-correctness-sweep.md)           | bug           | —        | Sonnet 5   | medium   |
| H2  | [Shared-state lifecycle ⭐](H2-shared-state-lifecycle.md) | bug           | likely   | **Opus 5** | high     |
| H3  | [Module structure](H3-module-structure.md)                | debt          | —        | Sonnet 5   | low–med  |
| H4  | [Widget shell](H4-widget-shell.md)                        | debt          | —        | **Opus 5** | high     |
| H5  | [API layer](H5-api-layer.md)                              | debt          | possibly | Sonnet 5   | medium   |
| H6  | [Request lifecycle & errors](H6-request-lifecycle.md)     | bug / UX      | —        | Sonnet 5   | med–high |
| H7  | [Freshness](H7-freshness.md)                              | UX            | possibly | **Opus 5** | high     |
| H8  | [Todo widgets signal](H8-todo-widgets-signal.md)          | UX            | possibly | Sonnet 5   | medium   |
| H9  | [NowBar vs. planner overlap](H9-nowbar-vs-planner.md)     | design / debt | —        | **Opus 5** | high     |
| H10 | [Responsive, keyboard, a11y](H10-responsive-and-a11y.md)  | UX            | —        | **Opus 5** | high     |

Each prompt is independently runnable. `Depends on` in each header is about avoiding merge pain, not correctness — the only ordering that really matters is **H1
first** (it fixes two live bugs other prompts would otherwise build on) and **H3 before H4/H9/H10** (they edit files H3 moves).

## The confirmed defects

- **The activity-history widget is pinned to a hardcoded date.** `ActivityHistoryWidget.vue:59` —
  `new Date('2026-04-10')`. A debug leftover that drives both the request and the "open full view"
  link, so the card titled "Today's activity" has never shown today. (H1)
- **"Add to planner" pushes to a route that does not exist.** Both todo widgets push
  `{ name: 'taskPlanner' }`; no such route is registered — `taskPlanner` is an i18n key in
  `navItems.ts:50`, which is where it was copied from. vue-router throws. (H1)
- **Three date values are frozen at setup.** `useTodayPlan`'s `todayUrlDate`, `TodoListWidget`'s
  `today`, `RoutineTodoWidget`'s `todayDayOfWeek`/`todayDayOfMonth`. This is a dashboard people leave open; after midnight the links point at yesterday and the
  routine widget filters for the wrong day. (H1 for the values, H2 for the rollover reload)
- **The shared plan state has no lifecycle.** `useTodayPlan.ts` module state is never reset — sign in as another user and `ensureLoaded()` short-circuits on the
  stale `loadPromise`, showing the previous user's plan. The streak in localStorage is not namespaced by user either. (H2)
- **A watcher bound to the wrong scope.** The `alertsWired` guard at `useTodayPlan.ts:281` creates the alert watcher inside whichever component called first, so it
  dies with that component while the guard stays true — transition alerts then stop for the session, silently. (H2)
- **`reload()` blanks both widgets to spinners.** It reuses `loading`, so the background refresh after every completed timer tears down the UI. (H2)
- **Every failure renders as an empty success.** A 500 from the plan endpoint shows "No plan for today" plus a *Plan today* button — offering to create a plan that
  may already exist. Same shape in all four other widgets. No error state exists anywhere on the page. (H6)
- **The dashboard never refreshes.** Six `onMounted` fetches and nothing else. The clock keeps ticking, so it looks live while the data is hours old. (H7)
- **The bottom band has no breakpoints.** `cols="3" / "4" / "5"` with no `md`, inside a
  `clamp(240px, 33vh, 420px)` band — on a phone the quick-record card is ~90px wide. The top row does use `cols="12" md="6"`, so this is an omission, not a decision.
  (H10)
- **`ActivityHistoryWidget` sets `height: 450px`** on a card that `HomeView` renders with `h-100`
  inside a band that can resolve smaller — the exact overflow the HomeView comments were written about. (H1)

## Duplication, measured

- **The card shell is copy-pasted four times** with drifting padding, three different flex/overflow incantations for the scroll body, and a hardcoded `height: 64px`
  on one header to line it up with neighbours it only matches by coincidence. (H4)
- **NowBar and DayPlannerWidget render the same focus task twice**, ~200px apart, with `countdown`
  and `focusCountdown` being the same function written twice, and two mode-icon switches that disagree in the `allDone` state. The available actions differ by
  widget: extend only in one, snooze and skip only in the other. (H9)
- **Two widgets call `API.get`/`API.patch` with raw URL strings** for endpoints
  `../../../src/core/todoList/api` already owns — including `RoutineTodoWidget`, which uses the composable to read and hand-rolls the URL to write, in the same file.
  (H5)
- **Five locale keys are dead.** `home.overdue`, `dueToday`, `dueTomorrow`, `dueIn` were written for
  `TodoListWidget`, which sorts by due date and never displays one; `home.streaks` is unused entirely. (H8 wires up the first four, H1 deletes the fifth)

## Accepted, not a defect

`home` imports components from other modules — `RoutineTodoListItem`, `NormalTodoListItem`,
`HistoryPieChart`, `TrackTimeDialog`. That is a deliberate exception to the module-boundary rule:
home is the app's composition layer, and `src/_common` is a cross-project submodule, which is the wrong place for app-specific components. **Do not "fix" this and do
not raise it as a finding.** H3 puts a comment in `home.routes.ts` saying so, so it stops being re-litigated. H5 is about the *api*
layer only, which is a separate question with a real answer.

## Backend

`backend` starts empty on purpose. Prompts do not pre-write backend requests — the agent implementing a frontend prompt is the one that discovers exactly which field
was missing and writes a sharper ask than anyone could from a cold read. H2, H5, H7 and H8 each end with an escalation block telling the agent to finish the frontend
work first, then write the ask if it actually hit the wall.
`backend/README.md` holds the format and the scope rules (contract and business logic only — no storage, entity or migration decisions).
