# H7 · Keep the dashboard fresh (the tab is open all day)

- **Scope:** `src/core/home/composable/` (new `useDashboardRefresh.ts`), all six widgets
- **Backend:** possibly — an aggregate endpoint would make this cheaper; see the escalation block at the end
- **Model / effort:** Opus 5, high — the cost of getting this wrong is a request storm, and the correct policy differs per widget.
- **Depends on:** H2 (day rollover, refresh vs. load distinction), H6 (error states must not be clobbered by a background refresh)
- **Unblocks:** nothing

---

```
This is a dashboard for an anti-procrastination app. Its whole value is telling you what is true
RIGHT NOW, and it is the kind of page people leave open in a pinned tab for eight hours. Today, every
widget fetches once in onMounted and then never again:

  useTodayPlan.load()          via ensureLoaded() in NowBar.vue:267 and DayPlannerWidget
  RoutineTodoWidget.vue:203    onMounted(() => { load(); loadPeriods() })
  TodoListWidget.vue:107       onMounted(load)
  ActivityHistoryWidget.vue:89 onMounted(load)

The clock keeps ticking — `useCurrentTime()` drives NowBar's countdown and the day strip — so the UI
looks alive while the data underneath is hours old. Concretely: complete a planner task on your
phone, or in this app's own day-planner view in another tab, and the home page never notices. Track
an activity anywhere but through NowBar's own TrackTimeDialog (which does call `reload`,
NowBar.vue:149) and "Today's activity" stays wrong for the rest of the day.

Build `src/core/home/composable/useDashboardRefresh.ts` — one place that decides WHEN, which each
widget subscribes to with its own loader. Triggers, in rough order of value:

1. **Tab becomes visible again.** `document.visibilitychange` → refresh if the data is older than a
   threshold. This is the highest-value trigger by far and the cheapest: it fires exactly when
   someone is about to look at the page. Do not refresh on every visibility change regardless of
   age — alt-tabbing twice a minute must not mean two refetches.
2. **Day rollover.** H2 makes useTodayPlan handle its own; the routine and todo widgets need it too
   (their `isSuggestedForToday` / due-date logic is date-dependent). One shared date-change signal,
   consumed by all of them.
3. **Coming back online.** `window.online` → retry whatever is in an error state (H6).
4. **A slow interval as a backstop.** Only if the widget's data can change from outside this tab.
   Pick a period in minutes, not seconds, and pause it entirely while the tab is hidden.

Per-widget policy — do NOT give them all the same one:
- **useTodayPlan** (NowBar + DayPlannerWidget): most sensitive to staleness, and already has a
  `reload()`. Visibility + rollover + a slow interval.
- **RoutineTodoWidget / TodoListWidget**: change only through user action, here or elsewhere.
  Visibility + rollover. No interval.
- **ActivityHistoryWidget**: changes whenever a timer finishes anywhere. Visibility + rollover, plus
  a refresh when a tracking session completes — NowBar already has that signal at line 149
  (`@done="reload"`), which currently reloads the plan but not the history pie. Wire the history
  widget to it too.
- **QuickRecordWidget**: static links, nothing to refresh.

Hard constraints:
- A background refresh must never blank a widget to a spinner (H2 item 4 — use the `refreshing` flag,
  not `loading`) and must never clear an existing error state until it succeeds.
- Every listener and interval must be torn down on unmount. `useDashboardRefresh` is called from six
  components; it must not register six copies of the same document-level listener — register once at
  module/scope level and fan out, the same shape useTodayPlan uses for its shared state.
- Do not refresh on window focus (`window.focus`) as well as visibilitychange; on some setups they
  both fire and you get double requests.
- Do not add a manual refresh button to every widget. If you want one, put a single one in the page
  header — but that is optional and out of scope unless it falls out naturally.

Keep the per-widget loaders. Do NOT build a client-side batcher to fake an aggregate endpoint — see
the escalation block at the end, which is where that question belongs.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then:
1. Open home, switch to another tab for a few minutes, come back — the network tab shows exactly one
   round of refresh requests and the widgets do not flash spinners.
2. Alt-tab rapidly ten times — no request storm.
3. Complete a planner task in a second tab, return to home — it shows as done.
4. Leave the page open across a date change — everything re-derives for the new day.
5. Navigate away from home — confirm in devtools that no interval or listener survives.

--- After the frontend work is done: write the backend ask, IF the numbers justify it ---

This prompt turns a one-shot page load into a repeating one. Before it, the home page fired four to
six independent requests once per navigation; after it, that round repeats on every meaningful
tab-focus, all day.

While doing verification step 1, **record the actual numbers**: how many requests one refresh round
makes, which endpoints, and their observed timings against a real backend. You are the only agent
that will ever have those measurements in hand.

Then judge whether a single `/home/today` aggregate is worth asking for. If it is, write the ask
AFTER the frontend work is finished and verified — read prompts/home/backend/README.md for the format
and scope rules, and write it to prompts/home/backend/Bn-<slug>.md. Include:

- the measured request count and timings, not an estimate — this is the whole basis of the argument
- which of the current responses would need to be composed, and the fact that the widgets currently
  read four unrelated shapes (a Calendar + PlannerTask list, a grouped routine list, a todo list, a
  pie-chart aggregate), so the ask is for composition, not a new computation
- whether the aggregate should be a strict union of the existing responses or a trimmed projection —
  and note which fields the home page actually reads, since it uses far less than the full DTOs
- what changes on the frontend if it lands: useDashboardRefresh gets one loader instead of four, and
  the per-widget staleness policies collapse into one

If the measurements show the current fan-out is fine — a handful of fast requests a few times an
hour is not a problem worth an endpoint — write nothing, and say so in your final message with the
numbers. That is a real result, not a non-answer.
```
