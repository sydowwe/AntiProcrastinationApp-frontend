# Unit 08 — planner-templates

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

- Unit name: `planner-templates`
- Module: `dayPlanner`
- Pass: `inventory`
- Views & routes:
    `TemplateListView` `/day-planner/templates`
    `TemplateSplitView` `/day-planner/templates/split`
    `TemplateDayPlannerView` `/day-planner/templates/:templateId`
- Intent sources: prompts/_done/day-planner/README.md, P1-split-view-dead.md,
  P6-planner-shell-dedup.md, P2-store-type-contract.md, P4-localization.md

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
- THE FIXTURE NOW HAS DATA. `B3` landed 2026-09-11: `e2e-v2` seeds three templates under
  `seed.dayPlannerTemplates` — `homeOffice` ("Home Office", 5 tasks), `officeDay` ("Office
  Day", 4) and `pinned` ("Relaxed Weekend", 3, the only one with `isPinned`, so it is the
  only way the list's pinned section renders). All twelve seeded template tasks are
  foreground; none sets `isBackground`. Every view in this unit carries real data.
- `/day-planner/templates/split` (TemplateSplitView) IS REACHABLE — settled 2026-09-11, so
  this is no longer the open question the older text below made it. The list page toolbar
  has an "Edit Side by Side" button that does `router.push({ name: 'dayPlannerTemplateSplit' })`
  (it renders only at `mdAndUp`). Driven end to end: a different template selects on each
  side and both panels render their grid and editor fields. P1's fix landed. Still worth
  documenting the route's *discoverability* — one button, desktop only, no nav entry — but
  do not re-litigate whether it is dead.
- ALREADY FIXED, DO NOT HUNT IT: the `CanceledError: canceled` console errors and the
  "Unhandled error during execution of mounted hook at <TemplateListView>" that the shell
  pass saw. The older text here called it "an aborted-request race when navigating away
  quickly"; that diagnosis was wrong. `useFetchFiltered` held ONE AbortController per
  composable instance, so `loadTemplates()` fanning the mini-timeline previews out over
  `Promise.all` made the calls cancel each other — with two or more templates the
  `Promise.all` rejected and `hideFullScreenLoading()` never ran, leaving the page behind a
  permanent loading overlay with ZERO cards. Invisible while the fixture seeded none, which
  is why it survived. Fixed by keying cancellation (`requestKey`) plus a framework change
  that stops the interceptor logging deliberate cancellations at all. **If you see a
  `CanceledError` in the console on these screens, that is a regression — file it.**
- OPEN BUG, NOT ROOT-CAUSED — READ THIS BEFORE YOU BLAME YOUR OWN LOCATORS. The
  fullscreen loading overlay (`LoadingFullscreen.vue`, driven by `useLoading`'s
  `fullScreenLoading`) INTERMITTENTLY STICKS on the template screens. The page is fully
  rendered underneath — five task blocks, clean console, zero errors — but the overlay
  stays up and intercepts pointer events, so every click times out while every
  visibility assertion passes. Seen on both `/day-planner/templates` and
  `/day-planner/templates/:id`; the same URL can be clean on one visit and stuck on the
  next. Reproduced by hand (`statusOverlays=1, blocks=5`, still 1 seconds later) and in
  `templateDayPlanner.spec.ts`, which went 27/32 under `--repeat-each=2` on 2026-09-11
  with all five failures being blocked clicks.
  Ruled out: a stale dev server (restarting Vite made it worse), the leisure commit
  `a9a10ea6` (touches only `src/core/leisure/**`), `TemplatePlannerPanel` (never touches
  the overlay), a counter mismatch in `useLoading` (it is a plain boolean), and a missing
  `finally` in `TemplateDayPlannerView.loadTasks` (it has one).
  Two candidates, unverified, in the order worth chasing:
  1. `LoadingFullscreen.vue:3` binds `v-model="fullScreenLoading"` to a ref that
     `LoadingComposable.ts` returns via `readonly()`. If `VDialog` writes back to that
     model — which dialogs do — the write is dropped silently and the dialog's internal
     open state desyncs from the ref: overlay visible while the app believes it hidden.
  2. `TemplateListView.loadTemplates()` has no `try/finally` around its
     `showFullScreenLoading()` + `axiosSuccessLoadingHide = false` pair, so any throw
     leaves the overlay up AND the global auto-hide flag false.
  This is user-facing, not just a test problem: the screen intermittently accepts no
  clicks at all. If you are documenting rather than fixing, file it as a bug and move on —
  do not weaken a locator around it.
- JUDGE THE LABELLING, IT IS NOT A BUG: the header stats line counts and plans only
  non-background tasks (`taskStats` filters `nonBgTasks` by name — clearly intentional). So
  a template with 4 tasks, one of them background, reads "3 tasks". You will not see this
  with fixture data, since no seeded task is background; create one if you want to judge
  whether the wording should say so.
- READ `e2e/tests/templateDayPlanner.spec.ts` FIRST. It is 16 passing tests, no skips, and
  it is a description of these three screens written from driving them. It will save you
  rediscovering at least four things that are easy to get wrong: a background task renders
  as `.background-task-block`, not `.task-block`; the details panel has NO close control at
  desktop width (its xmark is `d-md-none` and the panel is `v-show="panelOpen || mdAndUp"`);
  the panel's action is "Update details", not "Edit details"; and the remove button on each
  tag chip has the accessible name "Close", which makes a naive `/close|xmark/` locator
  match the wrong thing.
- TemplateDayPlannerView deliberately has NO `props: true` on its route. The route comment
  explains why: params arrive as strings and would shadow the view's `number | null`
  prop, breaking every numeric consumer. The view reads the param itself. Do not report
  the missing `props: true` as an inconsistency.
- Recent commit ffe7c927 deduped the three template-card grids into TemplateCardGrid and
  added useTemplateCompare, post-dating the intent sources.

Do only this unit. Do not continue to another one.
```
