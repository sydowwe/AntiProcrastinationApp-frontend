# H6 · Error states and request lifecycle

- **Scope:** all six widgets in `src/core/home/component/`, `composable/useTodayPlan.ts`
- **Backend:** none
- **Model / effort:** Sonnet 5, medium–high
- **Depends on:** H4 (the shell gains an `error` state), H5 (requests live in one place), H1 item 6 (removes the worst swallowing catches)
- **Unblocks:** nothing

---

```
The home dashboard has exactly two states per widget: loading, and content-or-empty. There is no
third. Every failure path renders as an empty success:

  ActivityHistoryWidget.vue:83   catch { pieData = null }        → "No activity tracked today"
  useTodayPlan.ts:263-266        catch { calendar = null; … }    → "No plan for today" + a
                                                                   "Plan today" CTA that would
                                                                   create a second plan
  RoutineTodoWidget.vue:185-192  try/finally with no catch       → an unhandled rejection; the
                                                                   list stays empty and the spinner
                                                                   clears, so it reads as "all done"
  TodoListWidget.vue:97-105      same shape
  TodoListWidget.vue:94          .catch(() => load())            → the tick silently reverts
  RoutineTodoWidget.vue:182      .catch(() => load())            → same

The "no plan for today" case is the worst of these: a user whose request failed is invited to create
a plan that already exists on the server.

Do this:

1. Add an `error` state to WidgetCard (H4's shell): an unobtrusive in-card message plus a Retry
   button that re-invokes the widget's own loader. Not a snackbar — the failure is scoped to one
   card and the user needs to know WHICH card is stale, which a global snackbar cannot say.

2. Give every widget three distinct states — loading / error / (content | empty) — and make the
   empty state reachable only on a successful response. Concretely: keep a per-widget `error` ref,
   set it in `catch`, clear it at the start of each load.

3. `useTodayPlan.load()` (line 255) is shared by NowBar and DayPlannerWidget, so its error state is
   shared too. Expose it from the composable alongside `loading`. NowBar is a full-width bar, not a
   card — give it its own compact failed state ("couldn't load today's plan · Retry") rather than
   reusing the card treatment, and make sure it does NOT render the `noCalendar` headline
   (NowBar.vue:218) or the "Plan today" button (line 120-128) when the cause is an error.

4. Optimistic writes: the toggles in both todo widgets and the mutations in useTodayPlan
   (`setStatus`, `snoozeTask`, `extendTask`) revert on failure with no explanation. Keep the
   optimistic update, keep the revert, and add a snackbar via
   `useSnackbar().showErrorSnackbar(...)` naming what failed to save. Note that
   `.catch(() => load())` in the widgets is heavier than it needs to be — a full refetch to undo one
   tick; revert the single item instead, as useTodayPlan already does at lines 130-132.

5. Consider `useRequestState` / `createRequestState` from @/_common/api/ — read it first. If it
   already gives per-request loading+error refs in the shape needed here, use it rather than adding
   six hand-rolled pairs of refs. If it does not fit, say why in a comment and keep the local refs.

6. Requests are not cancelled. Six widgets fire on mount; navigating away mid-flight leaves them to
   resolve into unmounted components. This is currently harmless (they only write to refs) but it
   will not stay harmless once retry exists. Cancel in-flight requests on unmount, or at minimum
   guard the assignment. Do not build a request-dedup layer; if the fan-out turns out to be the real
   problem, that is an aggregate-endpoint question and H7 owns it.

Do not change layout, copy, or which data each widget fetches. New user-facing strings go in
src/core/home/_locales/home.{sk,en}.ts, both files, SK primary.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then, with the network throttled to
offline in devtools, reload the home page: every widget must show a distinct error state with a
working Retry, and none may claim there is no plan / no activity / nothing to do. Restore the
network and confirm Retry recovers each one without a full page reload.
```
