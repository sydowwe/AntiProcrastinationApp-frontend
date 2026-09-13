# Unit 07 — planner-day

Module: `dayPlanner`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `planner-day`
- Module: `dayPlanner`
- Pass: `inventory`
- Views & routes:
    `PlannerCalendarView` `/day-planner`
    `DayPlannerView` `/day-planner/:date`
    `PlannerTaskLinkView` `/day-planner/task/:id`
    `DayPlannerSettingsView` `/day-planner/settings`
- Intent sources: prompts/_done/day-planner/README.md, P3-correctness-sweep.md,
  P5-calendar-request-storm.md, P7-calendar-url-state.md, F1-now-and-next.md,
  F2-plan-vs-actual.md, P8-accessibility.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Drive the browser with playwright-cli, per CLAUDE.md's "Browser verification" section —
including its sign-in and state-load sequence. Use your own session and run
`playwright-cli close` when you finish. Prefer `find` over `snapshot`. Charts are echarts
on <canvas> and are invisible to the snapshot: read them from the populating response,
an eval, or a screenshot — never report one as empty on snapshot evidence alone.

Known for this unit — verify each, do not assume:
- P5 is literally about a calendar REQUEST STORM. The duplicate-request check the template
  asks for is the highest-value thing you can do in this unit — watch the network panel
  while changing dates and ranges, and count requests per interaction.
- `/day-planner/:date` is declared BEFORE `/day-planner/templates` in the route table, but
  vue-router ranks static segments above params so `templates` still wins. This is NOT a
  bug; it is recorded in docs/views/_routes.md because the declaration order invites the
  opposite conclusion. Do not report it.
- PlannerTaskLinkView (`/day-planner/task/:id`) is a deep-link hop that resolves a bare
  task id to the dated planner URL. It is not a screen a user browses to — test it by
  navigating directly with a real task id, and with an invalid one.
- DayPlannerSettingsView is in this unit because its settings change how the day view
  renders — verify a setting end to end, not just that it saves. Note it was recently
  split into one component per tab (95c7bbf2), so it has several tabs.
- Existing Playwright coverage: e2e/tests/dayPlanner.spec.ts already asserts arrow-key date
  navigation and the input-focus guard. Do not duplicate those in your draft spec.
- TWO BUGS ALREADY FOUND HERE (2026-09-12), so do not re-derive them:
  1. FIXED — `loadTasks` fetched repeating-task suggestions with `?date=`, but the route takes
     `{calendarId}` in the PATH. The 400 rejected the `Promise.all` it shared with the task
     fetch, so `store.tasks` was never assigned and the planner rendered an EMPTY GRID on
     every date, with the cause visible only in the console. This is the withdrawn backend ask
     B5 (it was always a frontend bug). The suggestions call is now also `.catch`-ed so it can
     never take the tasks down with it again.
  2. OPEN, NOT FIXED — the selection action bar's **Delete is unreachable** at 1280x720 with
     the sidebar expanded. `_common/component/ActionBar.vue` is `position: fixed; left: 50%;
     transform: translateX(-50%)`, i.e. centred on the VIEWPORT, while Vuetify insets content
     with `padding-left: 288px` on `.v-main`. The bar's left end slides under the nav drawer,
     which swallows the pointer events. Two specs are `test.fixme`d on it. The fix is a
     framework change (centre on the content box) and affects every view mounting ActionBar,
     so it needs the owner's call — note that a `toBeVisible()` assertion does NOT catch this,
     since Playwright's visibility is layout, not occlusion.
- Recent commits post-date the intent sources: 5c72fd5a split DayPlannerView, 4e3366ed
  collapsed six bulk-action tails into useBulkTaskAction, 64ad48c8 replaced the calendar's
  hand-rolled URL query handling.

Do only this unit. Do not continue to another one.
```
