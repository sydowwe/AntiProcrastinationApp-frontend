# scheduler — findings

> Pass: inventory · captured 2026-09-30 · commit `4d890646` (framework `b1b82a1`)

**Tally:** blocker 1 · bug 6 · a11y 2 · polish 7 · opportunity 2 · unverified 3 (U1 and U2 since settled, see Status)

**Status (2026-10-04):** 16 of 21 closed or escalated: 15 fixed (X1, B1–B5, A1, A2, P1–P7), 1 escalated to the backend
(B6 → §S1). That leaves O2 (opportunity, partly built) and U3 (unverified, open). U1 and U2 were settled on 2026-10-05, and
O1 was built the same day. Fix batches are in
`prompts/view-docs/units/_submodule/_fix-queue-log.md`.

Every finding is **[framework]** — the views, components and DTOs all live in `src/_common/modules/scheduler/`
(plus the shared `BasicTable` for X1/P1), and `B6` is the framework's *server* half (`Sydowwe.Scheduler`). None is
app-side.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-30 | `4d890646` / fw `b1b82a1` | initial inventory pass |

## Intent sources — what shipped

The unit prompt warned that `prompts/_common/scheduler/` is an **open** set and to expect the code to lag it. It
does not: `git -C src/_common log -- modules/scheduler` shows S4, S5, S6, S7 and S8 committed (plus B2/B3 wiring),
and S1/S3 are visibly in the code. Checked live:

| claim | source | status |
| --- | --- | --- |
| run detail refetches on a param change | S1 #1 | ✅ 61991 → 60249 → lineage hop, h1 and body change, one request each |
| 404 vs other failure, with retry | S1 #2 | ✅ 999999 → *Job not found*; routed 500 → *Load failed* + *Try again*, which recovered |
| non-admin fallback | S1 #3 | not testable (adapter is constant `true`) |
| grid error → no unhandled rejection | S1 #4 | not triggered; source moved into `useServerTable` `onError` (S3) |
| overdue switch is part of the filter | S1 #5 | ✅ chip, `?overdue=true`, survives reload, *Clear* resets it |
| trigger/replay refresh races | S1 #6 | job detail + replay poll by correlation id (source); ✅ jobs grid reloads once, immediately, and for a fast job that reload already carries the new run — U1 |
| grids on `useServerTable`, `sortBy=key:dir`, one request on mount, filter → page 1 | S3 | ✅ one `jobs-overview` / `run-history` per action; `jobId` never in the run grid's URL |
| auto-refresh, background, stops when leaving, stale data kept on failure | S5 | ✅ one poll in 70 s; 0 requests after leaving; routed 500 → chip, data kept, no snackbar. Hidden-tab pause ✅ with a simulated hidden tab (needs-attention poller) — U2 |
| relative time, ticking, absolute on title / beside it | S5 | ✅ grid `title`, detail `now (30.09.2026 23:16:30)`, absolute beyond ~a day |
| copy buttons, payload cap + expand, attention "view all", count cards link | S6 | ✅ (copy not clicked); *View all* → 12/12; *Removed 42* → 42 |
| replay gated on job state; acknowledge resets | S6 #4 + B3 | ✅ gate present (reason unreachable — B2); ack unticked on reopen, focus on checkbox |
| `runAtUtc` / Once branch, reverse lineage as ids, no fake "actual fire time", `detail` reason | S8 + B3 | ✅ `once at 16.09.2026 0:49:28`; `Run #60257`, `Run #60270`; *Due at / Started at*; server reason strings render |

What the prompts did **not** foresee is what this file is about: layout (X1, B1, B5), the breadcrumb (B3, B4), and
the data a real registry produces (B6, P4).

---

### X1. The run history on job detail renders no rows — its scroll box is 0 px high
- **Status:** fixed 2026-10-04 (S1, framework `ff91bec`; `.v-table__wrapper` measured 524/524 on `/planovac/ulohy/59`, was 0; the run-history and replay-click e2e tests are real)
- **Severity:** blocker
- **Where:** `/planovac/ulohy/10` → *Run history* card → `.v-table__wrapper` (`JobRunHistory.vue` → `BasicTable`)
- **Expected:** the run log of the job is visible and its rows clickable — it is the only way into run detail and
  into Replay (S1, S6; plain sense).
- **Actual:** the card shows the *Run history* heading, the toolbar and the footer (`1-25 of 58083`) and **nothing
  between them** — no column headers, no rows. `.v-table__wrapper` measures `height 0`, `scrollHeight 1356`,
  `overflow-y: auto`, at 1440×900, 1920×1080 and 390×844 alike. A mouse click on a row's Replay button times out:
  the footer and the toolbar's Filter button *intercept pointer events*. The rows are in the accessibility tree and
  reachable only by keyboard focus. With the grid invisible, **run detail has no mouse path from the UI at all**.
- **Evidence:** `screenshots/planovac-ulohy-id.png`; `eval` → `wrapper h=0 … scrollH=1356`; `playwright-cli click
  "getByRole('button', { name: 'Replay the run started at 30.09.2026 23:16:20' })"` → `TimeoutError … <div class="w-100
  pb-2 px-3 d-flex …"> intercepts pointer events`.
- **Repro:** 1. open `/planovac/ulohy/10`. 2. look at *Run history*.
- **Verify:** 1. open `/planovac/ulohy/10` at 1440×900. 2. the grid shows its six column headers and 25 rows;
  `document.querySelector('.v-table__wrapper').getBoundingClientRect().height > 0`. 3. a plain mouse click on the
  first row's *Show detail of the run started at …* lands on `/planovac/behy/:id`.
- **Root cause guess:** the F12 / FW4 shape. `BasicTable`'s root is `h-100 d-flex flex-column` and needs a
  definite-height flex parent; `JobRunHistory` sits in a plain `VCard` inside `SchedulerDetailPage`'s content-height
  `VContainer`, so the scroll box resolves to 0. The jobs list works because its `VContainer` is `h-100 d-flex
  flex-column`.
- **Suggested fix:** give the run grid a definite height inside the card (e.g. a `min-height`/`height` on the
  `BasicTable` wrapper in `JobRunHistory.vue`, or `flex-fill` + `min-height: 0` down a flex chain from a page that
  has a height). Do not change `BasicTable`'s default (FW4 documents the contract).

### B1. Jobs list: *Next run* and the row actions are off-screen at 1440 px
- **Status:** fixed 2026-10-04 (S3, framework `21d230e`; *Handler key* is now a caption, one-shots render compact; wrapper 1094/1094, *Actions* ends at 1411 with 0 px to spare)
- **Severity:** bug
- **Where:** `/planovac/ulohy` → jobs grid (`SchedulerJobsView.vue` columns)
- **Expected:** the column the page sorts by and exists to answer ("what runs next" — the view's own comment) and the
  row actions are visible at a standard desktop width.
- **Actual:** at 1440×900 with the sidebar open the table is 1369 px wide in a 1094 px scroll box. *Last run* ends at
  x 1433, *Next run* at 1533 and *Actions* at 1686 — both behind a horizontal scroll. The *Handler key* column (270 px,
  the same text as the job key on most rows) and a three-line *Schedule* cell take the room.
- **Evidence:** `screenshots/planovac-ulohy.png`; `eval` → `wrapper client=1094 scroll=1369 … Next run:1533, Actions:1686`.
- **Repro:** 1. open `/planovac/ulohy` at 1440×900.
- **Verify:** 1. open `/planovac/ulohy` at 1440×900, sidebar open. 2. `th` *Next run* and *Actions* both end left of the
  wrapper's right edge (`getBoundingClientRect().right <= 1411`); no horizontal scrollbar on `.v-table__wrapper`.
- **Suggested fix:** drop *Handler key* to a caption under the job key (or to detail only), and let *Schedule* be
  one line.

### B2. Why an action is disabled is told only by `title` on a button that cannot be hovered
- **Status:** fixed 2026-10-04 (S4, framework `62451f7`; visible caption + `aria-describedby` on the header buttons, `span` wrapper on grid rows, new `cannotTriggerRemoved`; the orphaned variant is U3)
- **Severity:** bug
- **Where:** `/planovac/ulohy` (row *Trigger*, page 3 — `Removed` jobs) and `/planovac/behy/52704` (*Replay run*) →
  `JobActionButtons.vue` `triggerTitle`, `SchedulerRunDetailView.vue` `replayButtonTitle`, `JobRunHistory.vue` row replay
- **Expected:** B3/S6: "The title says which one, because a button that is merely dead teaches the operator nothing"
  (comment in `SchedulerRunDetailView.vue`).
- **Actual:** Vuetify gives a disabled `VBtn` `pointer-events: none` (measured), so the `title` tooltip never shows
  on hover, and a disabled button is not focusable, so the keyboard cannot reach it either. On run 52704 the only
  carrier of *"This run cannot be replayed — its job has been removed."* is that unreachable `title`. Worse on the
  jobs list: a `Removed` job's disabled *Trigger* has `title="Trigger now"` — `triggerTitle` only knows the orphaned
  reason, so there is no removed reason even in the markup (compare `replayTitle`, which has one).
- **Evidence:** `eval` on page 3 → `aria-label "Trigger job history.timer-boundary.26 now" | title=Trigger now |
  disabled=true`, `pointerEvents none`; on 52704 → `replay disabled=true title=This run cannot be replayed — its job has
  been removed. pe=none`. Screenshot `screenshots/planovac-behy-id--payload-removed-job.png`.
- **Repro:** 1. `/planovac/behy/52704`. 2. hover *Replay run* — no tooltip.
- **Verify:** 1. `/planovac/behy/52704` and `/planovac/ulohy?status=Removed`. 2. the reason for the disabled
  Replay / Trigger is visible text next to the control, or the control stays focusable (`aria-disabled`) with the
  reason in `aria-describedby`; a `Removed` job's Trigger explains *removed*, not "Trigger now".
- **Suggested fix:** render the reason as text (a caption under the header button; a tooltip on a wrapping `span`
  for icon rows), and add a `cannotTriggerRemoved` key.

### B3. Job detail breadcrumb shows *Scheduled jobs* twice
- **Status:** fixed 2026-10-04 (S5, framework `6154af1`; `useBreadcrumbs` skips an extra already in the chain; verified `Home › Scheduled jobs › Portal.SuggestionPatternRefresh`, run detail's three-crumb chain intact)
- **Severity:** bug
- **Where:** `/planovac/ulohy/10` → top-bar breadcrumb (`SchedulerJobDetailView.vue` `jobsCrumb`)
- **Expected:** `Home › Scheduled jobs › Portal.SuggestionPatternRefresh` — as run detail renders its chain.
- **Actual:** `Home › Scheduled jobs › Scheduled jobs › Portal.SuggestionPatternRefresh` — two links to
  `/planovac/ulohy`. The nav tree now resolves `/planovac/ulohy/10` under *Scheduled jobs* by longest prefix (F14),
  and the view still adds its own `jobsCrumb` on the premise, stated in its comment, that "the jobs list is not a nav
  path". On a 404 (`job` stays null, the watcher never fires) the crumb is single — which is how the two sources
  were told apart.
- **Evidence:** `screenshots/planovac-ulohy-id.png` (top bar); snapshot: two `link "Scheduled jobs"` → `/planovac/ulohy`.
- **Repro:** 1. open `/planovac/ulohy/10`.
- **Verify:** 1. open `/planovac/ulohy/10`. 2. the breadcrumb reads `Home › Scheduled jobs › Portal.SuggestionPatternRefresh`,
  exactly one *Scheduled jobs*. 3. `/planovac/behy/61991` still reads `Home › Scheduled jobs › Portal.SuggestionPatternRefresh › Run #61991`.
- **Root cause guess:** the extra is written for a host whose nav does *not* contain the jobs list. Run detail's
  path (`/planovac/behy`) matches no nav entry, so it needs all three crumbs; job detail's does.
- **Suggested fix:** job detail sets only `[{ title: jobKey }]`, or the framework skips an extra crumb whose `to`
  equals the last nav crumb. Check a host with no nav entry before choosing the first.

### B4. Run not-found keeps the previous run's breadcrumb
- **Status:** fixed 2026-10-04 (S5, framework `524312a`; the `catch` resets the extra to `[jobsCrumb]`; `/planovac/behy/999999` now reads `Home › Scheduled jobs`)
- **Severity:** bug
- **Where:** `/planovac/behy/:id` → `SchedulerRunDetailView.vue` `loadRun` catch
- **Expected:** a not-found page does not name a run it is not showing.
- **Actual:** after in-app navigation from run 60249 to 999999 the page says *Run not found* while the breadcrumb
  still reads `Home › Scheduled jobs › Routines.SuggestedToday › Run #60249`. `setBreadcrumbExtra` runs only on
  success. Reachable without typing a URL: a lineage link to a run `Scheduler.PurgeExpiredRunLogs` has purged.
- **Evidence:** `eval` after `$router.push('/planovac/behy/999999')` from 60249 → `… Run not found … || crumbs: Home >
  Scheduled jobs > Routines.SuggestedToday > Run #60249`.
- **Repro:** 1. open `/planovac/behy/60249`. 2. in-app navigate to `/planovac/behy/999999`.
- **Verify:** same steps; the breadcrumb no longer contains `Run #60249` (it reads `Home › Scheduled jobs` or `Home`).
- **Suggested fix:** clear / reset the extra in the `catch` (job detail already does it through its watcher).

### B5. Needs attention: the run-outcome rollup is crushed to 32 px and its chips are hidden
- **Status:** fixed 2026-10-04 (S2, framework `d21119c`; `flex-shrink-0` on the page's children, rollup card 104/104 was 32/104; the e2e test is real)
- **Severity:** bug
- **Where:** `/planovac/pozornost` → *Run outcomes over the last 24 h* card (`SchedulerNeedsAttentionView.vue`)
- **Expected:** the rollup (Succeeded 85 · Failed 0 · Skipped 0 · Vetoed 0) is readable — it is one of the page's
  three answers (S5/B2).
- **Actual:** at 1440×900 the card is 32 px high with `scrollHeight 104` and `overflow: hidden`: the heading is cut
  through the middle and no chip is visible. The page's `VContainer` is a fixed-height (836 px) `d-flex flex-column`
  scroll box holding 1596 px of content, so every child may shrink, and the rollup card is the one that can.
  Depends on content — with 12 overdue rows it happens; an all-clear page is shorter.
- **Evidence:** `screenshots/planovac-pozornost.png`; `eval` → `card h=32 scrollH=104 flexShrink=1 overflow=hidden |
  parent … d-flex flex-column ga-4 h=836 scrollH=1596`.
- **Repro:** 1. open `/planovac/pozornost` at 1440×900 while the overdue list has 12 rows.
- **Verify:** 1. same. 2. the rollup card's `getBoundingClientRect().height === scrollHeight` and the four chips
  `Succeeded: n`, `Failed: n`, `Skipped: n`, `Vetoed: n` are visible.
- **Suggested fix:** `flex-shrink-0` on the page's direct children (or drop `d-flex flex-column` for a block stack
  with `ga-4` replaced by margins).

### B6. Twelve one-shot jobs have been overdue for 14 days and never fired — the server's missed-fire path does not recover them
- **Status:** escalated — backend ask §S1 in `prompts/view-docs/units/_submodule/_fix-queue.md` (not yet written; nothing changes client-side)
- **Severity:** bug
- **Where:** `/planovac/ulohy?overdue=true` and `/planovac/pozornost` → *Overdue / stuck*; jobs 59–70
  (`history.timer-boundary.49`–`.60`, `History.TimerBoundaryAlarm`, `Once`, `misfirePolicy: FireAndProceed`)
- **Expected:** a `FireAndProceed` one-shot whose instant passed while the host was down fires on recovery, as the
  policy name says; and the dispatcher is plainly running (`Portal.SuggestionPatternRefresh` fires every 10 s,
  `Scheduler.OverdueJobSweep` succeeded at 21:09).
- **Actual:** `runAtUtc` 2026-09-15 22:49 → 2026-09-16 01:54, `status: Active`, `lastRunAt: null`, `isOverdue: true`.
  The server's own reason reads *"Overdue by 14 d 22 h; no run is in flight, so the fire was missed rather than
  slow."* Separately, 8 one-shots that **did** fire are still `Active` with `nextRunAt: null`, and 42 are `Removed`
  (together 58 % of the list — see O2).
- **Evidence:** `POST /scheduler-dashboard/jobs-overview` (perPage 100) body; `GET /scheduler-dashboard/health` →
  `overdueJobs: [12]`, `detail` as quoted; `screenshots/planovac-pozornost.png`.
- **Repro:** 1. open `/planovac/pozornost`.
- **Verify:** 1. open `/planovac/ulohy?overdue=true`. 2. no `History.TimerBoundaryAlarm` row older than the sweep
  interval is listed; the spent one-shots show `Removed` (or whatever terminal state the server defines) rather than
  `Active`.
- **Root cause guess:** server-side (`Sydowwe.Scheduler` dispatcher / `OverdueJobSweep`), not the client — this is an
  escalation, not a fix batch. Whether the History module should still be *creating* alarms for timers that ended two
  weeks ago is the owning module's question.
- **Suggested fix:** none client-side. Do not recompute overdue in the client.

### A1. Run-history start-time links are named by relative time — "now", "2 minutes ago", repeated
- **Status:** fixed 2026-10-04 (S6, framework `62451f7`; links are named "Show detail of the run started at …")
- **Severity:** a11y
- **Where:** `/planovac/ulohy/10` → run grid *Started at* cell (`JobRunHistory.vue` `#item.startedAt`)
- **Expected:** a link's name identifies its target (WCAG 2.4.4). The sibling eye button already does: *"Show detail
  of the run started at 30.09.2026 23:15:10"*.
- **Actual:** the link text is `RelativeTime`'s output, so the accessible names are `now`, `now`, … `2 minutes ago` ×6
  on a 10-second job; the absolute time is only on an inner `span`'s `title`.
- **Evidence:** snapshot `link "now" [ref=f15e324]`; `outerHTML` → `<a … href="/planovac/behy/61983"><span title="30.09.2026
  23:15:10">now</span></a>`.
- **Repro:** 1. `/planovac/ulohy/10`; 2. list links in the run grid (keyboard / snapshot).
- **Verify:** `getByRole('link', { name: /30\.09\.2026|Run #/ })` resolves for each row; no two row links share a name.
- **Suggested fix:** an `aria-label` from `startedAtOf(id)` (the helper already exists for the buttons).

### A2. Run detail has three buttons all named "Copy to clipboard"
- **Status:** fixed 2026-10-04 (S6, framework `62451f7`; `CopyIconButton` takes a `label`, run 52704 exposes `Copy Job key` / `Copy Correlation ID` / `Copy Payload snapshot`)
- **Severity:** a11y
- **Where:** `/planovac/behy/57272` → `CopyIconButton` beside Job key, Correlation ID and Payload
- **Expected:** each names what it copies.
- **Actual:** three identical names; only the visual position tells them apart.
- **Evidence:** snapshot of 57272: `button "Copy to clipboard"` ×3 (`f44e229`, `f44e264`, `f44e274`).
- **Repro:** 1. `/planovac/behy/57272`.
- **Verify:** the three buttons resolve as `Copy job key`, `Copy correlation ID`, `Copy payload` (or similar distinct names).
- **Suggested fix:** a `label` prop on `CopyIconButton` feeding `aria-label`/`title` (`Copy {what}`).

### P1. The jobs list always shows a second sort nobody chose, and never keeps a bare URL
- **Status:** fixed 2026-10-04 (S3, framework `21d230e`; `defaultSortBy: [nextRunAt asc, jobKey asc]`, a bare `/planovac/ulohy` keeps `location.search === ''`)
- **Severity:** polish
- **Where:** `/planovac/ulohy` → header *Job key 2* / *Next run 1*; `BasicTable.vue:197-198`
- **Expected:** default state writes nothing to the URL (the convention F15 established); visible sort = the sort set.
- **Actual:** `defaultSortBy` is `nextRunAt asc` only; `BasicTable` pushes its first column (`jobKey`) as a tie-breaker,
  so the state differs from the default and a bare `/planovac/ulohy` is replaced by
  `?page=1&perPage=25&sortBy=nextRunAt:asc,jobKey:asc`, and the *Job key* header carries a "2" badge (its accessible
  name becomes "Job key 2"). The run grid does not have this because its default sort *is* its first column.
- **Evidence:** `eval location.search` after a bare load; snapshot `columnheader "Job key 2"`.
- **Verify:** load `/planovac/ulohy`; `location.search === ''`.
- **Suggested fix:** `defaultSortBy: [nextRunAt asc, jobKey asc]`.

### P2. Dates render Slovak-style in the EN locale while the date inputs ask for `mm/dd/yyyy`
- **Status:** fixed 2026-10-04 (S11, framework `2cbc085`; `DateTimeHelper` resolves the locale per call, EN gives `10/06/2026 4:30:00 PM`; checked on `/pripomienky/moje`, not on a scheduler page)
- **Severity:** polish
- **Where:** every absolute timestamp in the unit (`formatToDateTimeWithSec`) vs the filter dialogs' `VDateInput`s
- **Expected:** one date format per locale.
- **Actual:** grid and detail show `16.09.2026 0:49:28`; *Next run from / to* and *Started from / to* show placeholder
  `mm/dd/yyyy`; the chip for an applied date filter would use the first format again.
- **Evidence:** jobs grid text; filter snapshot `/placeholder: mm/dd/yyyy`.
- **Verify:** in EN, a timestamp and a date-input placeholder use the same order.
- **Root cause guess:** `DateTimeHelper` is hardcoded `sk` — *Contradictions* §22 in the app queue; this unit is one
  more consumer, not a new cause.

### P3. A 404 on either detail page says it twice — alert and snackbar
- **Status:** fixed 2026-10-04 (S7, framework `62451f7`; `_silent: true` on both `fetchById` calls; source and typecheck only, the routed 404/500 paths were not driven in the browser)
- **Severity:** polish
- **Where:** `/planovac/ulohy/999999`, `/planovac/behy/999999`
- **Expected:** the page state is the message (S1 #2 made it one).
- **Actual:** *Job not found* / *Run not found* alert **and** the interceptor snackbar "The requested item was not
  found." The 500 path likewise pairs *Load failed* with "A server error occurred…".
- **Evidence:** `eval` → `… Job not found … || snackbars: The requested item was not found.`
- **Verify:** open `/planovac/ulohy/999999`; no `.v-snackbar` text, alert present.
- **Suggested fix:** `_silent: true` on the two `fetchById` calls — the page already renders both outcomes.

### P4. Automatic retries are presented as replays in the lineage card
- **Status:** fixed 2026-10-04 (S8, framework `62451f7`; neutral copy "Related runs" / "Re-run of" / "Re-runs of this run"; per-row kind still needs a contract change)
- **Severity:** polish
- **Where:** `/planovac/behy/60270` and `/planovac/behy/60249` → *Replay lineage*
- **Expected:** an *Automatic retry* (the header chip says so) is not described as an operator replay.
- **Actual:** 60270 reads *Replay of run: Run #60249*; 60249 reads *Replays of this run: Run #60257, Run #60270* —
  both automatic retries. The server uses one `replaysRunId` for both kinds and the card labels them all "replay".
- **Evidence:** `screenshots/planovac-behy-id--failed.png`; `eval` on 60249.
- **Verify:** on 60249 the two children are labelled as retries (or the card is titled neutrally, e.g. *Re-runs*, with
  each row's trigger source).
- **Suggested fix:** retitle neutrally; per-row kind needs the ids-with-source shape B3 deliberately did not ask for.

### P5. *Show all* is offered on a payload that is not capped
- **Status:** fixed 2026-10-04 (S8, framework `62451f7`; run 57272 has no toggle; the toggle appearing on a payload over 320 px was not verified, no fixture run has one)
- **Severity:** polish
- **Where:** `/planovac/behy/57272` → payload header
- **Actual:** a 3-line payload (`pre` 86 px of a 320 px cap) still gets *Show all*, which does nothing visible.
- **Evidence:** `eval` → `pre h=86 sh=86`, `toggle aria-expanded=false`.
- **Verify:** on 57272 no *Show all* button; on a payload taller than 320 px it appears.

### P6. The failed-run error alert renders the server's CRLFs as blank lines
- **Status:** fixed 2026-10-04 (S8, framework `62451f7`; `\r\n` normalised and trimmed, no trailing blank space; the server's own `\r\n\r\n` between its two lines still renders as one blank line)
- **Severity:** polish
- **Where:** `/planovac/behy/60270` → error `VAlert` (`white-space: pre-wrap`)
- **Actual:** `42703: column … does not exist\r\n\r\nPOSITION: 376` renders with an empty line and a tall empty band
  below the text; the alert icon sits on its own row above.
- **Evidence:** `screenshots/planovac-behy-id--failed.png`.
- **Verify:** the alert's text has no trailing blank space (trim the message, normalise `\r\n`).

### P7. The *Overdue / stuck* list has no meaningful order
- **Status:** fixed 2026-10-04 (S9, framework `62451f7`; most-overdue first, verified on `/planovac/pozornost`; the failed and orphaned lists are empty on the fixture)
- **Severity:** polish
- **Where:** `/planovac/pozornost` → overdue card
- **Actual:** rows come in the server's order — `.50, .51, .53, .56, .59, .49, …` with *Overdue by* 22 h, 22 h, 21 h, 20 h,
  19 h, 22 h — neither by key nor by how late.
- **Evidence:** page text; `GET /health` `overdueJobs` order.
- **Verify:** rows read most-overdue first (or oldest `nextRunAt` first).

### O1. *Trigger now* runs a job with one click; *Replay* needs an acknowledged warning
- **Status:** built 2026-10-05 (framework `3fd289c`, `Sydowwe.Scheduler` `dfd999a`; closed in
  `_fix-queue-log.md` → *Closed opportunities*). *Trigger now* confirms first through `useDialog().confirm`, on
  the grid row and on job detail. The confirm's second line says what the button cannot: a paused job runs
  anyway and stays paused, and a run may already be executing ("likely skipped" for a `disallowConcurrent` job).
  Server: `ScheduledJobDto.RunningSince` (the raw dispatcher marker) is now projected on every job surface
  (`SchedulerJobSignalsTests`, two new tests; 17/17 with the attention and exclude-removed classes). Browser:
  Cancel sends no request, and confirming sends one `trigger-now` → 200 on `/planovac/ulohy/10`. The
  paused/in-flight line was checked on the grid with a routed `jobs-overview`, because the API under Rider still
  runs the old build and sends no `runningSince` until it is restarted.
- **Severity:** opportunity
- **Where:** jobs grid row *Trigger job … now*, job detail *Trigger now*
- **What exists:** `ReplayConfirmDialog` — a warning, an acknowledgement checkbox and a gated confirm — for re-running
  a past run. A manual trigger has the same kind of side effects and none of that, and in the grid it sits one icon
  away from *Pause*.
- **What it could be:** a light confirm (`useDialog().confirm`) on Trigger, at least from the icon-only grid row.
  A product decision, not a defect.

### O2. The jobs list is 58 % spent one-shot alarms by default
- **Status:** partly built 2026-10-05, not yet verified in the browser. The list now hides `Removed` by default; an
  *Include removed* switch (URL `removed=true`, chip) lifts it. Server: opt-in `ExcludeRemoved` on
  `ScheduledJobsOverviewFilterRequest`, which yields to an explicit `status` (`SchedulerJobsOverviewExcludeRemovedTests`,
  3/3). The needs-attention *failed* "View all" lifts the exclusion, because that list counts Removed jobs. Still open:
  grouping one-shots by handler (needs a grouped server read), and the 8 spent-but-`Active` rows, which are B6.
- **Severity:** opportunity
- **Where:** `/planovac/ulohy`
- **What exists:** 42 `Removed` and 8 spent `Active` `History.TimerBoundaryAlarm` rows out of 73; the `status` filter;
  the count cards on needs-attention already link per status.
- **What it could be:** default the list to non-`Removed` (with an "include removed" toggle), and group or collapse
  per-instance one-shots by handler — `History.TimerBoundaryAlarm` × 62 buries the 11 recurring jobs an operator
  actually watches.

### U1. A trigger from the jobs grid reloads once, immediately — the new run is likely missed
- **Status:** settled 2026-10-05, not a defect for a fast job. Triggered `Portal.SuggestionPatternRefresh` from the grid row: `trigger-now` returned correlation `2999987a…`, the one immediate `jobs-overview` reload already carried `lastRunAt 22:02:57.867`, and run history shows that same instant as the `Manual` run (id 75009, 11 ms). The 10 s cron cannot explain it, as 22:02:57 is not a fire second. **Not settled:** a job that runs longer than the reload round-trip would still show the old *Last run* until the 120 s poll, which this probe cannot reach (no slow harmless job). Reopen only if one is seen.
- **Severity:** unverified
- **Where:** `SchedulerJobsView.vue` `@triggered="reload"`
- **Claim:** S1 #6 fixed the job-detail and replay paths with a correlation-id poll; the grid still reloads the list
  the instant the trigger is queued, so *Last run* would not change until the next 120 s refresh.
- **Evidence:** source read only, not reproduced in this pass — this unit is read-only and triggering is a real side
  effect.
- **What would settle it:** a mutation pass on a harmless job (e.g. `Portal.SuggestionPatternRefresh`): trigger from
  the grid row, watch *Last run* for 30 s.

### U2. The two pollers' hidden-tab pause was not observed
- **Status:** settled 2026-10-05 for the needs-attention poller, with a simulated hidden tab. Headless Chrome never reports hidden, so `document.visibilityState` was overridden and `visibilitychange` dispatched, which is exactly what `usePolling` reads. On `/planovac/pozornost` (60 s cadence): hidden for 135 s gave +0 `GET /scheduler-dashboard/health` (two polls would have fired); returning visible gave +1 at once; 65 s later +1 more. **Not covered:** the jobs list's 120 s poller (same `usePolling`, not run separately), and a real hidden tab, which only a headed browser shows. `reminders-admin/U1` is still open for the same reason.
- **Severity:** unverified
- **Where:** `usePolling` in `SchedulerNeedsAttentionView.vue` (60 s) and `SchedulerJobsView.vue` (120 s)
- **Claim:** S5: requests stop while the tab is hidden and one fires on return.
- **Evidence:** not testable in the headless `playwright-cli` session (the tab never reports hidden). Poll cadence,
  stop-on-leave and failure handling were verified.
- **What would settle it:** a headed browser, a second tab in front for 3 minutes, request count before/after.

### U3. Every orphan surface is untested — no job is orphaned
- **Status:** open
- **Severity:** unverified
- **Where:** jobs grid *Orphaned* chip, job detail orphan alert + chip, disabled *Trigger now* with
  `cannotTriggerOrphaned`, replay gate `cannotReplayOrphaned`, the *Orphaned* attention list
- **Evidence:** `jobs-overview` and `health` both report `isOrphaned: false` / `orphanedJobs: []` for all 73 jobs.
- **What would settle it:** a job row whose `handlerKey` has no registered handler (a test-only registration that is
  then removed, or a seed row) — the fixture has no scheduler data at all today.
