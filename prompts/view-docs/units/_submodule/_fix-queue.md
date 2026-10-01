# Fix queue — `_submodule` units (16–19)

> Built 2026-09-30 · updated 2026-10-01 · commit `4d890646` (framework `b1b82a1`) · units triaged: 19 `scheduler`,
> 18 `notifications` (inventory + mutation), 17 `reminders-admin` · findings considered: 62 · batches: 27 framework ·
> 0 app-side · escalations: 4

> **Why a separate queue.** The app's queue (`docs/views/_fix-queue.md`) covers units 1–15. Units 16–19 document
> framework modules (`src/_common/modules/*`), so every batch here is a **`vue_framework` commit first, then a pointer
> bump in this repo** (CLAUDE.md, *`src/_common` is a submodule*). Batch ids are `S<n>` and escalations `§S<n>` so
> they can never be confused with the app queue's `F<n>` / `FW<n>` / `§<n>`. Unit 16 (`reminders-user`) has run
> but is not yet absorbed. Append its batches here, continuing the numbering, and fold its findings named below as
> cross-unit duplicates into those batches instead of opening new ones.
>
> Closing an item follows the app queue's rule — a move, not a mark — but this queue has no `_fix-queue-log.md` yet.
> Create one beside this file the first time a batch closes.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| S1 | Run history on job detail has a 0 px scroll box | **framework** | `scheduler/X1` | low |
| S2 | Needs-attention children shrink — rollup card crushed | **framework** | `scheduler/B5` | trivial |
| S3 | Jobs grid too wide — Next run and actions off-screen; default sort pushes a tie-breaker | **framework** | `scheduler/B1`, `P1` | low |
| S4 | Disabled Trigger / Replay explain themselves only via an unreachable `title` | **framework** | `scheduler/B2` | low |
| S5 | Detail-page breadcrumbs: duplicate crumb on job **and reminder**, stale crumb on run not-found | **framework** | `scheduler/B3`, `B4`, `reminders-admin/B3` | low |
| S6 | Ambiguous accessible names — run links and copy buttons | **framework** | `scheduler/A1`, `A2` | trivial |
| S7 | Detail pages report a 404/500 twice (alert + interceptor snackbar) — scheduler **and reminders** | **framework** | `scheduler/P3`, `reminders-admin/P2` | trivial |
| S8 | Run detail presentation — retries called replays, idle *Show all*, CRLF blank lines | **framework** | `scheduler/P4`, `P5`, `P6` | low |
| S9 | Overdue / failed attention lists in no meaningful order | **framework** | `scheduler/P7` | trivial |
| S10 | Inbox never loads unless the SignalR handshake succeeds | **framework** | `notifications/B1` | medium |
| S11 | `DateTimeHelper` formatters speak only Slovak (framework-wide default) | **framework** | `notifications/B2`, `scheduler/P2` | low |
| S12 | Notifications controls with no name or a repeated one | **framework** | `notifications/A1`, `A3`, `A5`, `A7` | low |
| S13 | Closing a `useDialog()` dialog drops focus to `<body>` (framework-wide component) | **framework** | `notifications/A2` | low |
| S14 | Preference cards' purple palette fails contrast | **framework** | `notifications/A4` | low |
| S15 | Action toasts time out in 3 s, and so does the only Undo (framework-wide default) | **framework** | `notifications/A6` | trivial |
| S16 | Notifications copy that says the wrong thing | **framework** | `notifications/P2`, `P3`, `P4`, `P6` | low |
| S17 | Both notifications routes claim to be "Home" in the breadcrumb | **framework** | `notifications/P1` | trivial |
| S18 | Reminder pages clip their own content — detail cards and the history notice shrink | **framework** | `reminders-admin/X1`, `B6` | trivial |
| S19 | Reminder grid DTOs drop schedule fields the server sends | **framework** | `reminders-admin/B1`, `B2`, `P4` | low |
| S20 | Date-only filter bounds are sent as instants, so "to" excludes its own day | **framework** | `reminders-admin/B4`, `P8` (+ `reminders-user/B3`) | low |
| S21 | Dispatch history renders a raw key for skip reasons the client does not know | **framework** | `reminders-admin/B5` | trivial |
| S22 | A reminder has no identity on screen — row actions, detail heading, upcoming rows | **framework** | `reminders-admin/A1`, `P3`, `P5` | low |
| S23 | Reminder list default sorts omit `BasicTable`'s tie-breaker | **framework** | `reminders-admin/P1` (+ `reminders-user/P2`) | trivial |
| S24 | Dispatch history: an empty actions column, and a correction that names an id nobody can see | **framework** | `reminders-admin/P6`, `P7` | low |
| S25 | `BasicTable`'s select column checkboxes have no name (framework-wide component) | **framework** | `reminders-admin/A2` | low |
| S26 | `FilterPanel` chip remove buttons are all named "Close" (framework-wide component) | **framework** | `reminders-admin/A3` (+ `reminders-user/A4`) | trivial |
| S27 | `ExportMenu` joins its open list into the button's name; items have no role (framework-wide component) | **framework** | `reminders-admin/A4` | low |

`scheduler/P2` was *not batched* on the first pass, deferred to the app queue's *Contradictions* §22. It is now in
**S11**. §22 is a note, not a queued fix ("unfiled, unobserved in a browser"), so deferring to it parked the
defect nowhere. `notifications/B2` is the first observed instance. See *Re-grades & notes*.

---

## S1. Run history on job detail has a 0 px scroll box
- **Scope:** **[framework]** `src/_common/modules/scheduler/` (submodule commit + pointer bump)
- **Closes:** `scheduler/X1`
- **Root cause:** `BasicTable`'s root is `h-100 d-flex flex-column` and needs a definite-height flex parent (the
  contract `FW4` documented in `components.md › Data tables › Layout`). `JobRunHistory` is mounted in a plain `VCard`
  inside `SchedulerDetailPage`'s content-height `VContainer`, so `.v-table__wrapper` resolves to 0 px at every viewport:
  the header row and every data row are clipped, and the footer and toolbar intercept clicks. The jobs list works only
  because its own `VContainer` is `h-100 d-flex flex-column`. This is the same shape as the app's `F12`.
- **Files:** `component/JobRunHistory.vue` (root `div.d-flex.flex-column`, `BasicTable`), `view/SchedulerJobDetailView.vue:143-154`
  (the wrapping `VCard`), `component/SchedulerDetailPage.vue` (container).
- **What to change:** give the run grid a definite height inside the job page. Simplest: a fixed/min height on the
  `JobRunHistory` root (e.g. `height: min(70vh, 900px)`) with the table `flex-fill` + `min-height: 0`. Alternative:
  make the detail page a height-bounded flex column down to the card — but that also changes run detail's scrolling,
  so prefer the local fix.
- **Do not change:** `BasicTable`'s default layout (a framework-wide default; `FW4` chose documentation).
- **Verification:** `scheduler/X1` `Verify:`; also un-`fixme` *"the run-history grid shows its rows"* in
  `e2e/tests/scheduler.draft.spec.ts` and switch the replay test from `focus()`+Enter to `.click()`.
- **Risk:** any other framework page that nests `BasicTable` in a card has the same bug. Grep `BasicTable` under
  `src/_common/modules/` while you are there, but fix only what you measure.

## S2. Needs-attention children shrink — rollup card crushed
- **Scope:** **[framework]** `view/SchedulerNeedsAttentionView.vue`
- **Closes:** `scheduler/B5`
- **Root cause:** the page's `VContainer` is `d-flex flex-column ga-4` and, inside the app's height-bounded main area, a
  836 px scroll box holding 1596 px of content. Every child is `flex-shrink: 1`, and the rollup `VCard`
  (`overflow: hidden`) is the one that gives way — 32 px of a 104 px card.
- **Files:** `SchedulerNeedsAttentionView.vue:2-5` (container), `:118-176` (rollup card).
- **What to change:** `flex-shrink-0` on the container's direct children (the count row, the rollup card, the list
  row, the all-clear card), or drop `d-flex flex-column` for a plain block stack.
- **Verification:** `scheduler/B5` `Verify:` at 1440×900 with the overdue list populated.
- **Risk:** none beyond this view.

## S3. Jobs grid too wide — Next run and actions off-screen; default sort pushes a tie-breaker
- **Scope:** **[framework]** `view/SchedulerJobsView.vue`
- **Closes:** `scheduler/B1`, `scheduler/P1`
- **Root cause:** two independent issues in the same `columns` / `useServerTable` block. (1) Eight columns including a
  270 px *Handler key* (usually equal to the job key) and a three-line *Schedule* cell overflow a 1094 px box, pushing
  *Next run* — the default sort — and *Actions* off-screen. (2) `defaultSortBy` is `[nextRunAt asc]` while `BasicTable`
  appends its first column (`jobKey`), so state ≠ default on every mount: the URL is always rewritten and *Job key*
  shows a "2" badge.
- **Files:** `SchedulerJobsView.vue:242` (`defaultSortBy`), `:302-310` (`columns`), `:65-100` (key + schedule cells);
  `_common/component/dataTable/BasicTable.vue:197-198` (read only).
- **What to change:** (1) move *Handler key* into the job-key cell's caption (or detail only) and keep *Schedule* to one
  line. (2) `defaultSortBy: [new VSortItem('nextRunAt', 'asc'), new VSortItem('jobKey', 'asc')]`.
- **Do not change:** `BasicTable`'s tie-breaker push; the run grid's default (it already matches).
- **Verification:** `scheduler/B1` and `P1` `Verify:`; the draft spec's two related `fixme`s.
- **Risk:** the old URL form (`sortBy=nextRunAt:asc,jobKey:asc`) is exactly the new default, so bookmarks survive.

## S4. Disabled Trigger / Replay explain themselves only via an unreachable `title`
- **Scope:** **[framework]** `component/JobActionButtons.vue`, `component/JobRunHistory.vue`,
  `view/SchedulerRunDetailView.vue`, `utils/schedulerFormat.ts`, both locale files
- **Closes:** `scheduler/B2`
- **Root cause:** Vuetify renders a disabled `VBtn` with `pointer-events: none` and removes it from the tab order, so a
  `title` on it is shown to nobody. The B3 gate work put every reason there. Separately, `triggerTitle` knows only the
  orphaned reason, so a `Removed` job's disabled Trigger is titled "Trigger now".
- **Files:** `JobActionButtons.vue:142-145` (`canTrigger`, `triggerTitle`), `SchedulerRunDetailView.vue:46-55`,
  `JobRunHistory.vue:133-144`, `schedulerFormat.ts` (`replayTitle`).
- **What to change:** add `scheduler.actions.cannotTriggerRemoved` (sk + en) and a `triggerTitle`-style helper beside
  `replayTitle`. Carry the reason somewhere reachable: visible caption text under the two labelled header buttons;
  for the icon-only grid rows, wrap the button in a `span` that owns the `title`, or use `aria-disabled` (still
  focusable) plus `aria-describedby`. Keep one approach for all three sites.
- **Verification:** `scheduler/B2` `Verify:` on `/planovac/behy/52704` (job 11, `Removed`) and `/planovac/ulohy?status=Removed`.
- **Risk:** `aria-disabled` buttons still receive clicks. The handlers already guard (`if (!canTrigger.value …) return`)
  but check the replay path's `@click` too.

## S5. Detail-page breadcrumbs: duplicate crumb on job and reminder, stale crumb on run not-found
- **Scope:** **[framework]** `view/SchedulerJobDetailView.vue`, `view/SchedulerRunDetailView.vue`,
  `modules/reminders/view/ReminderDefinitionDetailView.vue:382-387`
- **Closes:** `scheduler/B3`, `scheduler/B4`, `reminders-admin/B3`
- **Added in the third pass:** the reminder detail makes the same assumption with the same comment ("the register
  list is not a nav path") and renders "Home › Reminder register › Reminder register › PersonalReminder", including
  on its not-found state. Whichever option below is taken must cover it too: with the shell-level de-dup it needs no
  edit, and with the per-view option it drops `registerCrumb` from both `setBreadcrumbExtra` calls. With two modules
  now affected, the shell-level option is the better bet.
- **Root cause:** both views own their `setBreadcrumbExtra` and both get it wrong in opposite directions. Job detail
  always prepends a *Scheduled jobs* crumb, on the premise that the jobs list is not a nav path, but this host's nav
  contains it and the shell's longest-prefix match (`F14`) already renders it, so it appears twice. Run detail sets
  its chain only on success, so a failed load keeps the previous run's chain.
- **Files:** `SchedulerJobDetailView.vue:208-214`, `SchedulerRunDetailView.vue:348-370`.
- **What to change:** decide once, for a *framework* module, whether the host's nav can be assumed to list the jobs
  page. If yes, job detail sets `[{ title: jobKey }]` only. If no (the safer default for other apps), have
  `useSetBreadcrumbExtra` / the shell drop an extra crumb whose `to` equals the last nav-derived crumb's, which fixes
  job detail with no per-host assumption. Run detail: reset the extra (to `[jobsCrumb]` or `[]`) in the `catch`.
- **Verification:** `scheduler/B3` and `B4` `Verify:`; `reminders-admin/B3` `Verify:`; confirm `/planovac/behy/61991`
  still shows the full three-crumb chain.
- **Risk:** the de-dup option touches the shell's breadcrumb composable — every app. If you take it, it is its own
  framework commit with a docs line in `composables.md`.

## S6. Ambiguous accessible names — run links and copy buttons
- **Scope:** **[framework]** `component/JobRunHistory.vue`, `component/CopyIconButton.vue` + its three call sites, locales
- **Closes:** `scheduler/A1`, `scheduler/A2`
- **Root cause:** names were taken from visible text or a generic `title`. The run link's text is a relative time
  ("now", "2 minutes ago", repeated), and `CopyIconButton` has one fixed title for every value.
- **Files:** `JobRunHistory.vue:83-89` (`#item.startedAt`; `startedAtOf` at `:256` already builds the absolute
  label), `CopyIconButton.vue`, `SchedulerJobDetailView.vue:67`, `SchedulerRunDetailView.vue:70,111,159`.
- **What to change:** `aria-label` on the run link from `startedAtOf(item.id)` (e.g. reuse
  `scheduler.a11y.showRunDetail`). A `label` prop on `CopyIconButton` → `aria-label`/`title` "Copy {label}", passed
  as the row's own label key at each site.
- **Verification:** `scheduler/A1`, `A2` `Verify:`.
- **Risk:** the draft spec's locators use the current names in two places (`Replay the run started at`, fine; the copy
  buttons are not located). None break.

## S7. Detail pages report a 404/500 twice (alert + interceptor snackbar) — scheduler and reminders
- **Scope:** **[framework]** `api/SchedulerApi.ts` or the two views' `fetchById` calls;
  `modules/reminders/view/ReminderDefinitionDetailView.vue:361-380` (`fetchById`) and
  `modules/reminders/view/ReminderOverviewView.vue:274-294` (`fetchReminderOverview`)
- **Closes:** `scheduler/P3`, `reminders-admin/P2`
- **Added in the third pass:** the reminder detail's 404 card and the overview's "Failed to load" / "Refresh failed —
  showing older data." lines are each accompanied by the interceptor snackbar. The overview polls every 5 min and
  on focus, so during an outage it would snackbar repeatedly. Both reminder views already own their failure copy,
  so `_silent: true` on both requests is the whole fix. Leave `MyRemindersView` to unit 16's triage.
- **Root cause:** S1 #2 made the page state the message (not-found / load-failed + *Try again*), but the requests are
  not `_silent`, so the interceptor also snackbars.
- **What to change:** pass `_silent: true` on the job and run `fetchById` (check how `useEntityQuery.fetchById` forwards
  request config; `fetchSchedulerNeedsAttention` shows the idiom).
- **Verification:** `scheduler/P3` `Verify:`; the 500 path (routed) shows only the *Load failed* alert;
  `reminders-admin/P2` `Verify:` (detail 404 and overview routed 503).
- **Risk:** none.

## S8. Run detail presentation — retries called replays, idle *Show all*, CRLF blank lines
- **Scope:** **[framework]** `view/SchedulerRunDetailView.vue`, locales
- **Closes:** `scheduler/P4`, `P5`, `P6`
- **Root cause:** three small rendering choices on one page. (P4) The server records automatic retries and operator
  replays under one `replaysRunId`, and the card labels all of them "replay". (P5) The expand toggle renders whenever
  there is a payload, not when the payload overflows its cap. (P6) The error message goes into `pre-wrap` untrimmed,
  and the server's `\r\n\r\n` becomes blank lines.
- **Files:** `SchedulerRunDetailView.vue:211-258` (lineage), `:142-171` (payload header), `:123-136` (error alert).
- **What to change:** (P4) neutral copy — *Re-runs* / *Re-run of* — in both locales; per-row kind is not available
  without a contract change, so do not fetch per child. (P5) show the toggle only when `payloadLineCount` exceeds what
  320 px holds, or measure `scrollHeight > clientHeight`. (P6) `errorMessage.replace(/\r\n/g, '\n').trim()`.
- **Verification:** the three findings' `Verify:` on 60249 / 60270 / 57272.
- **Risk:** none.

## S9. Overdue / failed attention lists in no meaningful order
- **Scope:** **[framework]** `component/AttentionJobList.vue` or `view/SchedulerNeedsAttentionView.vue`
- **Closes:** `scheduler/P7`
- **Root cause:** the lists render the server's order, which is neither by key nor by lateness.
- **What to change:** sort client-side before render: overdue by `nextRunAt` ascending (most late first), failed by
  `lastRunAt` descending, orphaned by `jobKey`. A presentational sort of a complete list, not a server rule.
- **Verification:** `scheduler/P7` `Verify:`.
- **Risk:** the live-region counts are order-independent. None.

## S10. Inbox never loads unless the SignalR handshake succeeds
- **Scope:** **[framework]** `src/_common/modules/notifications/composable/useNotifications.ts`, `view/NotificationsView.vue`
- **Closes:** `notifications/B1`
- **Root cause:** `connect()` awaits `hub.start()` and only then calls `loadNotifications()` (`useNotifications.ts:549-567`).
  The list and unread count are REST resources, but they are sequenced behind the realtime channel. A failed *initial*
  `start()` is not covered by `withAutomaticReconnect`, and the catch only nulls `connectPromise` for a retry nothing
  triggers. So a hub outage renders the **first-run** empty state ("No notifications yet") with badge 0, permanently.
  The coded `loadError` + Retry state is unreachable because `error` is never set. The view also reads
  `isConnected === false` as "Reconnecting…" before the first connect ever happened.
- **Files:** `useNotifications.ts:549-567` (`connect`), `:306` (the failure log), the reconnect-delay policy
  (`reconnectForever`); `NotificationsView.vue` (the "Reconnecting…" label and the skeleton gating on `isLoading`).
- **What to change:** (1) start `loadNotifications()` (list + unread count) in parallel with, or before, `hub.start()`,
  and set `isLoading` from the REST load, not the handshake. (2) On a failed initial `start()`, schedule retries with
  the same `reconnectForever` delays. (3) Label the never-connected state "Connecting…" (new key, sk + en) or hide it,
  keeping "Reconnecting…" for a dropped connection.
- **Do not change:** the live-arrival path (hub → prepend, no refetch), which works (settled in the unit's findings,
  *Settled: `_shell` B1*).
- **Verification:** `notifications/B1` `Verify:` (negotiate mocked to 503, then `unroute` and wait ~70 s for a second
  `negotiate`). Also confirm a normal load still issues exactly one `mine` + one `unread-count` (no duplicate from the
  hub's `onreconnected` refetch).
- **Risk:** the bell (`_shell`) shares this composable, so the badge's first value now comes from REST before the hub is
  up. That is the intent, but re-check the bell's `aria-label` count on first paint.

## S11. `DateTimeHelper` formatters speak only Slovak (framework-wide default)
- **Scope:** **[framework]** `src/_common/utils/DateTimeHelper.ts` + `src/_common/docs/utils.md` — its own batch
  (batching rule 4: it changes what every app on the framework renders)
- **Closes:** `notifications/B2`, `scheduler/P2`
- **Root cause:** every formatter in the file pins dayjs to `'sk'`: `DateTimeHelper.ts:73, 77, 81, 85, 89, 93, 103, 107,
  142`. `formatLocalized` is the sharpest case, because a helper named *localized* that always speaks Slovak is how an
  EN account gets "28. september 2026" day headers on `/notifikacie`. The app queue's log recorded this as
  *Contradictions* §22 (`docs/views/_fix-queue-log.md`, the numbered list under *Contradictions*) and deliberately
  left it unfiled. This is the first browser observation.
- **Files:** `DateTimeHelper.ts` (above). Consumers: `modules/notifications/utils/groupNotificationsByDay.ts:46`,
  `modules/notifications/view/NotificationsView.vue`, `component/calendar/CalendarGrid.vue`, the scheduler's EN date
  cells (`scheduler/P2`), and app-side `core/dayPlanner/component/normal/DayPlannerHeader.vue`,
  `core/dayPlanner/view/DayPlannerView.vue`, `core/historyDashboard/component/HistoryTimeline.vue`,
  `core/todoList/composable/useRoutineDateFormat.ts`, `src/i18n.ts`.
- **What to change:** resolve the locale per call from the framework's registered i18n/translator (the same source
  `useI18n().locale` reads), falling back to `'sk'` when none is registered, so an app that never set a locale renders
  exactly as today (CLAUDE.md framework rule 2). The EN dayjs locale must be imported where `sk` is. Update
  `docs/utils.md`.
- **Do not change:** the format *strings* (`'DD.MM.'`, `'HH:mm'`, …). Some app call sites chose a Slovak shape on
  purpose, and they are app-side follow-ups if they read wrong in EN, not part of this batch. Also do not patch
  `groupNotificationsByDay` on its own. That is the per-consumer fix §22 warns against.
- **Verification:** `notifications/B2` `Verify:` (EN "September 28, 2026", SK "28. september 2026"); `scheduler/P2`
  `Verify:`. Then walk the four app-side consumers above once in EN and SK, because their output changes with this
  commit.
- **Risk:** the widest-reaching batch in this queue. It changes visible dates in the planner header, history timeline
  and routine list for every EN account, which is the fix, but those screens' e2e specs may assert the Slovak shape.
  Run the full suite after the pointer bump. Say in the app-side commit that §22 is resolved.

## S12. Notifications controls with no name or a repeated one
- **Scope:** **[framework]** `src/_common/modules/notifications/` (+ both locale files)
- **Closes:** `notifications/A1`, `A3`, `A5`, `A7`
- **Root cause:** four controls take their name from nothing, or from a generic string. `VBadge` renders
  `aria-label="Badge"`, which replaces the count in the *Unread* toggle's name ("Unread Badge"). The read toggle and
  cluster use one fixed string per row. The 33 matrix `VCheckboxBtn`s and the reminder-kind `VSwitch` have no label at
  all.
- **Files:** `component/NotificationInboxToolbar.vue:13-22` (A1); `component/NotificationRow.vue:72-80`,
  `component/NotificationClusterSummary.vue` (A3); `component/NotificationTypeSettingsRow.vue:39-52` (A5);
  `reminderPreference/component/ReminderKindRow.vue:22-29` (A7).
- **What to change:** A1: `aria-hidden` the badge and put the count in the toggle's `aria-label` via
  `notifications.unreadCount` (or give the badge that label). A3: `notifications.markReadItem` / `markUnreadItem` taking
  `{ title }`, mirroring `dismissItem`; the cluster's label from its summary text (type + count). A5:
  `aria-labelledby="<row th id> <column th id>"`, which names the box from the headers already there and so keeps the
  source comment's "don't read it twice" intent. A7: `:aria-label="kindLabel"` on the switch.
- **Do not change:** `dismissItem` (already right); the bell's own `aria-label` (already carries the count). The
  top-bar `status "Badge"` next to it is the same `VBadge` default. Hide it in the same edit if it is in this module,
  and leave it if it lives in the shell's `Navbar.vue`.
- **Verification:** the four findings' `Verify:` blocks. A7 needs a kind row first (`PUT /reminder-preference/kind`,
  as in its Repro) until §S2 lands.
- **Risk:** none functional. e2e locators that used `'Unread Badge'` or a structural fallback for the matrix can move to
  the new names.

## S13. Closing a `useDialog()` dialog drops focus to `<body>` (framework-wide component)
- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue` (or `composable/general/useDialog.ts`) — its own
  batch: every `confirm()` / `openDialog()` in the framework **and** the app goes through it
- **Closes:** `notifications/A2`
- **Root cause:** `MyDialog` records the opener in `watch(dialog, isOpen => …)` (`MyDialog.vue:144-151`), which fires
  only on a *change*. A `DialogHost` entry is mounted already open, so the open transition never happens, no opener is
  recorded, and on close there is nothing to restore. A template-declared `MyDialog` (opened by toggling its model)
  works, which is why `_shell` recorded focus return as fine.
- **Files:** `MyDialog.vue:127, 144-155`; `useDialog.ts` (`openDialog`, where the entry is pushed).
- **What to change:** capture `document.activeElement` at the moment `openDialog()` / `confirm()` is called and hand
  it to the entry. Alternatively, make the watch `{ immediate: true }` so a born-open dialog records its opener on
  mount. Restore on close, after the leave transition, if the element is still connected.
- **Verification:** `notifications/A2` `Verify:`. Then check one app-side `confirm()` (a to-do item delete) returns
  focus the same way, and that a template-declared `MyDialog` still does.
- **Risk:** nested dialogs: the inner dialog's opener is inside the outer one. Restore must target the element that
  opened *that* dialog, not the first one.

## S14. Preference cards' purple palette fails contrast
- **Scope:** **[framework]** `src/_common/modules/notifications/component/QuietHoursCard.vue`,
  `reminderPreference/component/ReminderKindList.vue`, `component/NotificationTypeSettingsCard.vue`
- **Closes:** `notifications/A4`
- **Root cause:** all three cards are `VCard color="secondary"` (`#7C3AED`, light theme), and every foreground on them
  was designed for a surface background: `color="primary"` icons ≈ 1.1:1, the info alert ≈ 1.4:1, empty-state text
  ≈ 2.4:1, and subtitles ≈ 3.7:1. Round 2 adds the states that only show once quiet hours are on: the green "✓ Saved"
  (the card's only save confirmation), the blue active-now line, the switch track, and the kind row's
  `primaryOutline` chip. N12 copied the palette from the two older cards rather than choosing it.
- **What to change:** drop `color="secondary"` so the cards are surface cards like every other settings screen. Keep
  `elevation="2"`. If the tint is a product decision, the alternative is switching *every* foreground to
  `on-secondary`, including the success/primary text colours, which is more edits and easier to get half right.
- **Verification:** `notifications/A4` `Verify:` in the light theme; also open the dark theme once, which was not
  checked by the unit.
- **Risk:** visual only; none outside this page.

## S15. Action toasts time out in 3 s, and so does the only Undo (framework-wide default)
- **Scope:** **[framework]** `src/_common/composable/general/SnackbarComposable.ts` + `docs/composables.md`, or
  locally `QuietHoursCard.vue`. Its own batch because the real fix is a default.
- **Closes:** `notifications/A6`
- **Root cause:** `showSnackbar` gives every toast `config?.timeout ?? 3000` (`SnackbarComposable.ts:98`), including
  those with an `actionLabel`. `QuietHoursCard.clear()` made the snackbar's *Undo* the only recovery for switching
  quiet hours off, deliberately replacing a confirm, and passes no timeout. Measured: visible for ~3.1 s, not
  reachable by keyboard or screen reader in that time (WCAG 2.2.1).
- **What to change:** decide the default: action toasts default to ≥ 8 s (or to no auto-dismiss while they carry an
  action), and plain toasts stay at 3 s. Four call sites pass an `actionLabel` today: `QuietHoursCard.vue:349`,
  `useNotifications.ts:293`, and app-side `TodoListView.vue:495` and `PlannerCalendarView.vue:258`. None sets a
  timeout, so all four get the new default. If the default is not wanted, the minimum is `timeout: 10000` on the
  quiet-hours toast alone.
- **Verification:** `notifications/A6` `Verify:`; the existing `SnackbarComposable.test.ts` timeout expectations
  (`:128-129` passes an explicit 8000, and the defaults test must learn the new rule).
- **Risk:** a longer action toast holds the queue longer. `MAX_PENDING_SNACKBARS` never drops action toasts, so a burst
  of them now takes longer to drain. That is acceptable, but say it in `composables.md`.

## S16. Notifications copy that says the wrong thing
- **Scope:** **[framework]** `src/_common/modules/notifications/` views + `src/_common/_locales/common.{sk,en}.ts`
  (`notifications.*`, `notifications.type.*`, `reminderPreference.quietHours.*`)
- **Closes:** `notifications/P2`, `P3`, `P4`, `P6`
- **Root cause:** four strings that do not match the state or the server. P2: `notifications.emptyFiltered` always
  offers "load older ones", even when `hasMore` is false and no button renders. P3: the bulk dismiss confirm reuses the
  singular `dismissConfirmTitle`. P4: the type labels (`common.en.ts:386-392`: "Routine ended", "Reminder digest",
  "Timer finished") are a different vocabulary from the server-rendered titles on the rows they filter ("Period
  ended", "Reminders", "Focus finished"). P6: the quiet-hours subtitle and active-now line promise "we won't disturb
  you" and "a reminder arriving now will be delivered at …", but the server never holds the in-app row, so the bell
  keeps filling during the window.
- **Files:** `view/NotificationsView.vue:119-149` (P2), `:392-396` (P3); `common.{sk,en}.ts` `notifications.type.*`
  (P4); `component/QuietHoursCard.vue:94-105` and the `reminderPreference.quietHours.subtitle` / `activeNow*` keys (P6).
- **What to change:** P2: two keys, chosen on `hasMore`. P3: a plural title key with a count (`{n}`, sk plural forms).
  P4: align each label's key noun with the server title ("Period ended" / "Period ending soon" / "Reminders"). The same
  labels head the delivery-matrix rows, so both surfaces change together. Check the sk labels against the backend's sk
  titles too. P6: one sentence in both locales saying the notification list still updates, and only push/e-mail
  copies and scheduled reminders wait for the window to end.
- **Do not change:** the server titles (a backend wording decision, and they are already English per locale);
  `TimerBoundary`'s label, since its three server titles share no noun and "Timer finished" is the nearest honest
  umbrella.
- **Verification:** the four findings' `Verify:` blocks.
- **Risk:** if §S3 lands and the server starts discounting unconfigured channels, P6's new sentence is still true. It
  describes the in-app exemption, which §S3 does not touch.

## S17. Both notifications routes claim to be "Home" in the breadcrumb
- **Scope:** **[framework]** `src/_common/modules/notifications/view/NotificationsView.vue`,
  `reminderPreference/view/ReminderPreferencesView.vue`
- **Closes:** `notifications/P1`
- **Root cause:** neither route is in a nav tree, and `useBreadcrumbs.ts:49-59` gives such a route the home crumb alone,
  rendered as the current page.
- **What to change:** `useSetBreadcrumbExtra([{ title: t('<heading key>') }])` in each view, from its own heading key.
  That is the `F28` pattern.
- **Do not change:** `useBreadcrumbs`' fallback. Whether a nav-less framework route should get a generic crumb is the
  shell question S5 raised for the scheduler. If S5 takes the shell-level option, re-check this batch is still needed
  before doing it.
- **Verification:** `notifications/P1` `Verify:`.
- **Risk:** none.

## S18. Reminder pages clip their own content — detail cards and the history notice shrink
- **Scope:** **[framework]** `src/_common/modules/reminders/view/` — three containers
- **Closes:** `reminders-admin/X1`, `reminders-admin/B6`
- **Root cause:** the `scheduler/B5` shape (S2) again. Each page's `VContainer` is a `d-flex flex-column` inside the
  app's height-bounded main area, and its children keep `flex-shrink: 1`, so `overflow: hidden` children give way
  instead of the page scrolling. Detail: all six cards shrink below their content (e.g. Content 192/277 px), so key,
  lifecycle, due date, lead chips and recipients show only their top pixels at 1440×900, and the container does not
  scroll. History: the table is meant to fill (`h-100`), but the info `VAlert` above it shrinks to 16/44 px and its
  sentence disappears.
- **Files:** `ReminderDefinitionDetailView.vue:2-5`; `ReminderDispatchHistoryView.vue:2-5, 79-85`;
  `ReminderOverviewView.vue:2-5` (same container as the detail; not yet clipping, fix it in the same edit).
- **What to change:** detail and overview: drop `d-flex flex-column` for a block stack (keep the spacing), or add
  `flex-shrink-0` to every direct child. History: `flex-shrink-0` on the alert and the announcer row only. The table
  must keep filling.
- **Do not change:** S2's scheduler view, which is its own batch, or `BasicTable`'s layout contract (`FW4`).
- **Verification:** `reminders-admin/X1` and `B6` `Verify:` at 1440×900. Then open `/pripomienky/prehlad` at 1440×720
  and confirm no card has `scrollHeight > clientHeight` except the failure list's own scroll area.
- **Risk:** the history table's height. Check that its footer stays pinned and the grid still scrolls internally.

## S19. Reminder grid DTOs drop schedule fields the server sends
- **Scope:** **[framework]** `modules/reminders/dto/response/{ReminderDefinitionGridResponse,UpcomingReminderGridResponse}.ts`,
  `view/{ReminderDefinitionsView,ReminderUpcomingView}.vue`
- **Closes:** `reminders-admin/B1`, `B2`, `P4`
- **Root cause:** the admin grid endpoints (`POST /reminder-definition/grid`, `POST /reminder-dashboard/upcoming`)
  now return the full definition row: `dueAt`, `intervalPreset`, `cron`, `anchorDate`, `endsAt`, `leadOffsets[]`,
  `recipients[]` and `payloadJson`. `ReminderDefinitionGridResponse.fromJson` maps eight fields and drops the schedule,
  so the register's recurring row reads "⟳ —". Neither DTO maps `dueAt`, so both views pass `nextOccurrenceAt` as
  "Due", which is the next lead-time nudge. #23101 reads "Due … 12:00" but is due at 13:00. The register's
  `TODO(Bn)` premise ("grid response has no cronExpression/intervalPreset") is stale, and no ask was ever written.
  Separately, `hasLeadOffsets = leadOffsets.length > 0` counts a lone `0` offset (the deadline itself) as a lead time.
- **Files:** `ReminderDefinitionGridResponse.ts:21-32`; `UpcomingReminderGridResponse.ts:60-81` (`:76`
  `hasLeadOffsets`); `ReminderDefinitionsView.vue:94-100` (and its `TODO(Bn)`); `ReminderUpcomingView.vue:120-125`.
- **What to change:** add `dueAt`, `intervalPreset`, `cronExpression` (wire key `cron`, the mapping Upcoming already
  uses) to the register DTO, and `dueAt` to the upcoming DTO. Pass all four `ReminderScheduleDisplay` props with
  `:dueAt="item.dueAt"` in both views, and delete the `TODO(Bn)`. `hasLeadOffsets` becomes "any offset < 0".
- **Do not change:** `MyRemindersView` / the personal `my-upcoming` projection. Per the DTO's own header it is a
  narrower route, and its missing `intervalPreset` is unit 16's `reminders-user/B4`, a backend ask, not this.
- **Verification:** the three findings' `Verify:` blocks.
- **Risk:** the upcoming DTO is shared with `MyRemindersView`. `dueAt` is absent on that route, so it must default to
  `null` and the personal view must keep passing what it passes today.

## S20. Date-only filter bounds are sent as instants, so "to" excludes its own day
- **Scope:** **[framework]** `modules/reminders/dto/request/{reminderFilterParams,*Filter}.ts`, the three list views'
  `chipFormatters`, `view/ReminderOverviewView.vue` (`dueSoonRoute`)
- **Closes:** `reminders-admin/B4`, `P8`. **Cross-unit duplicate:** `reminders-user/B3` (unit 16, same codec via
  `MyReminderFilter`) belongs here when unit 16 is absorbed.
- **Root cause:** every date filter in the module is a `VDateInput` day, carried as a `Date` at local midnight and
  sent as that instant. The server compares instants, so an upper bound named "2 Oct" ends at the *start* of 2 Oct
  (`?to=2026-10-02` → `"nextOccurrenceTo":"2026-10-01T22:00:00.000Z"`, and #23001 at 02.10 16:30 is excluded).
  History's `to` has the same problem: `?to=2026-09-25` drops both 25.09 dispatches. The chips then print the bound as
  an instant ("… 03.10.2026 0:00:00"), which invites that same misreading.
- **Files:** `reminderFilterParams.ts:69-75` (`writeDate`/`readDate`); `ReminderDefinitionFilter`,
  `UpcomingReminderFilter`, `DispatchHistoryFilter`, `MyReminderFilter` (serialization of the `to` fields); chip
  formatters at `ReminderDefinitionsView.vue:281-288`, `ReminderUpcomingView.vue:265-272`,
  `ReminderDispatchHistoryView.vue:248-261`; `ReminderOverviewView.vue:411-415`.
- **What to change:** decide the wire meaning of a date-only upper bound once, for all four filters. Either send the
  start of the *next* local day (and confirm the server's comparison is `<`), or send local 23:59:59.999. Keep the URL
  codec as a calendar day. It round-trips cleanly and is not the bug. Chips use `formatToDate`, not `formatInstant`.
  First, read the server's comparison in `Sydowwe.Reminders` (`<` vs `<=`) and pick the matching option. If it is
  `<=` on an instant, the end-of-day form is the one that needs no server change.
- **Do not change:** the `from` bounds (start of day is right for them), or the URL param names that the overview
  drill-downs build.
- **Verification:** `reminders-admin/B4` and `P8` `Verify:`; the overview's due-soon card count should now equal the
  upcoming list it links to, including a row due on the window's last day.
- **Risk:** the overview's due-soon link will gain rows that fall on its last day. That is the intent, since the source
  comment there already apologises for the mismatch. The timezone is the browser's, not the account's
  (`reminders-user/U3` asks about that separately).

## S21. Dispatch history renders a raw key for skip reasons the client does not know
- **Scope:** **[framework]** `modules/reminders/dto/enum/SkipReason.ts`, `_locales/remindersDashboard.{sk,en}.ts`,
  `view/ReminderDispatchHistoryView.vue:137-142`
- **Closes:** `reminders-admin/B5`
- **Root cause:** contract drift. The server's `SkipReason` (`framework/Sydowwe.Reminders/domain/enum/SkipReason.cs`)
  has eight members and the client four. The row renders `$t(\`reminderDashboard.skipReason.${item.skipReason}\`)`
  unchecked, so `QuietHours` shows as "reminderDashboard.skipReason.QuietHours". `Other` is written by the live
  scanner. Three more are "reserved" server-side.
- **What to change:** add `AlreadyDispatched`, `QuietHours`, `Cancelled`, `Other` to the enum and both locales (sk
  first). Route the caption through a helper that falls back to a generic "Skipped (other reason)" key for any value
  outside the enum, so the next server addition cannot leak a key.
- **Verification:** `reminders-admin/B5` `Verify:`.
- **Risk:** none.

## S22. A reminder has no identity on screen — row actions, detail heading, upcoming rows
- **Scope:** **[framework]** `modules/reminders/view/{ReminderDefinitionsView,ReminderUpcomingView,ReminderDefinitionDetailView}.vue`,
  `component/ReminderActionButtons.vue`, locales
- **Closes:** `reminders-admin/A1`, `P3`, `P5`
- **Root cause:** every reminder is named by its `kind`, which is a type and not an identity. With six
  `PersonalReminder`s, all row actions share names ("Pause reminder PersonalReminder" ×4), every detail `h1` and final
  crumb reads "PersonalReminder", and the upcoming row, which does show `Reminder #23001` as a caption, is not a link.
  The register's Subject cell (`{subjectType} #{subjectId}`, linking to the definition) is already the identity the
  module uses. It just is not used everywhere.
- **Files:** `ReminderDefinitionsView.vue:127, 262-266` (`kindOf`); `ReminderUpcomingView.vue:107-117, 172, 245-249`;
  `ReminderActionButtons.vue` (aria-labels); `ReminderDefinitionDetailView.vue:21, 386`.
- **What to change:** one helper, `reminderLabel(row) → "{subjectType} #{subjectId}"` (fallback `#{id}`), in
  `useReminderFormat`. Use it in every row action's `aria-label` (existing `a11y.*` keys take `{kind}`, so rename the
  param or add a `{label}` variant), and as the detail `h1` and crumb, with kind as a caption. Wrap the upcoming
  caption in the register's `RouterLink`.
- **Do not change:** the Subject/definition-id split (intended per the unit prompt), or `RecipientChips` (no PII by
  design). Resolving a human title is `reminders-admin/O1`, which is deferred.
- **Verification:** the three findings' `Verify:` blocks.
- **Risk:** `e2e/tests/reminders-admin.draft.spec.ts` scopes rows by `getByRole('row', { name: /Reminder #…/ })`,
  which still works. Its fixme stubs for A1/P3/P5 can become assertions.

## S23. Reminder list default sorts omit `BasicTable`'s tie-breaker
- **Scope:** **[framework]** `modules/reminders/view/{ReminderDefinitionsView,ReminderUpcomingView,MyRemindersView}.vue`
  (`defaultSortBy`)
- **Closes:** `reminders-admin/P1`. **Cross-unit duplicate:** `reminders-user/P2` (unit 16, `MyRemindersView`).
- **Root cause:** identical to S3 part (2). `BasicTable.vue:198` appends its first column when the sort lacks it, so a
  default of `[nextOccurrenceAt asc]` never equals the state. Every mount rewrites the URL
  (`…sortBy=nextOccurrenceAt:asc,ownerModule:asc` / `…,kind:asc`), and the first column shows a "2" badge. The
  history view is immune because its default is its first column.
- **What to change:** register `[nextOccurrenceAt asc, ownerModule asc]`; upcoming and my-reminders
  `[nextOccurrenceAt asc, kind asc]`.
- **Do not change:** `BasicTable`'s push (S3 settled that).
- **Verification:** `reminders-admin/P1` `Verify:`. Old bookmarks carry exactly the new default, so they survive.
- **Risk:** none. Can ride with S3 in one session.

## S24. Dispatch history: an empty actions column, and a correction that names an id nobody can see
- **Scope:** **[framework]** `modules/reminders/view/ReminderDispatchHistoryView.vue`, locales
- **Closes:** `reminders-admin/P6`, `P7`
- **Root cause:** two presentation choices in the ledger's table. (P6) The table passes `hasEdit/hasDelete/hasCreate =
  false` and no `#additionalActions`, but `DataTable`'s `showActions` defaults to `true`, leaving a 42 px unnamed,
  empty column. (P7) The *Corrected* chip reads "Corrects #23501", a dispatch-row id, while no column shows dispatch
  ids and the next column uses `#n` for definition ids.
- **Files:** `ReminderDispatchHistoryView.vue:92-105` (table), `:127-135` (chip); `_common/component/dataTable/DataTable.vue:140`
  (`showActions`, read only).
- **What to change:** (P6) pass `:showActions="false"` and confirm `BasicTable` forwards it to `DataTable` (fallthrough
  attrs). If it does not, add the pass-through, since that is the framework-level fix. (P7) label the chip by the
  corrected row's time if the response carries it, else mark the corrected row itself ("Corrected by a later
  record"). A dispatch-id column is the fallback. Do not fetch per row.
- **Verification:** `reminders-admin/P6`, `P7` `Verify:`.
- **Risk:** P7 may need a field the response lacks (`reversesDispatchId` is there; its `dispatchedAt` may not be).
  If so, the row-marking option needs nothing new.

## S25. `BasicTable`'s select column checkboxes have no name (framework-wide component)
- **Scope:** **[framework]** `src/_common/component/dataTable/BasicTable.vue` (+ `DataTable.vue`), `docs/components.md`.
  Its own batch under rule 4, because every `showSelect` table in every app renders these.
- **Closes:** `reminders-admin/A2`
- **Root cause:** Vuetify's `VDataTable` select column renders bare `VCheckboxBtn`s, and the framework does not override
  `header.data-table-select` / `item.data-table-select`. The register's select-all and all six row checkboxes are
  unnamed. The bulk bar they drive is carefully named, so the gap is only the checkbox.
- **What to change:** override both slots. Header `aria-label` from a framework key ("Select all rows"); rows from an
  optional `itemLabel?: (item) => string` prop, falling back to "Select row {id}". The register passes S22's
  `reminderLabel`. Document the prop.
- **Do not change:** selection semantics (`selected` as ids, the register's "only rows you can see" pruning).
- **Verification:** `reminders-admin/A2` `Verify:`; then one app-side `showSelect` table, if any exists (grep), still
  selects.
- **Risk:** overriding the select slots re-implements indeterminate / select-all behaviour. Use Vuetify's slot props
  (`allSelected`, `someSelected`, `selectAll`, `isSelected`, `toggleSelect`) rather than local state.

## S26. `FilterPanel` chip remove buttons are all named "Close" (framework-wide component)
- **Scope:** **[framework]** `src/_common/component/FilterPanel.vue` + a framework locale key. Its own batch under
  rule 4.
- **Closes:** `reminders-admin/A3`. **Cross-unit duplicate:** `reminders-user/A4`. The scheduler pass noted it
  unfiled (*Re-grades*, first pass), and it is now filed.
- **Root cause:** the chips use `VChip closable` with Vuetify's default `closeLabel` ("Close"), so every chip's remove
  button has the same name, one that also reads as closing a dialog.
- **What to change:** `:closeLabel="t('<framework key>', { label: chip.label })"` → "Remove filter: Paused" (sk + en).
- **Verification:** `reminders-admin/A3` `Verify:`; spot-check one app-side `FilterPanel` (any list with chips).
- **Risk:** e2e specs that clicked `getByRole('button', { name: 'Close' })` on a chip break. Grep `e2e/` first.

## S27. `ExportMenu` joins its open list into the button's name; items have no role (framework-wide component)
- **Scope:** **[framework]** `src/_common/component/ExportMenu.vue`. Its own batch under rule 4.
- **Closes:** `reminders-admin/A4`. The scheduler pass noted it unfiled, and it is now filed.
- **Root cause:** the open menu's content renders inside the activator, so the button's accessible name becomes
  "Export Excel (.xlsx) CSV (.csv)". The two formats are `listitem`s with no role, and only `getByText` reaches them.
- **What to change:** let `VMenu` render its content outside the activator (default attach/teleport), and make the
  formats a `VList` of items Vuetify gives `menuitem` roles (or explicit `role="menuitem"`). Check keyboard: arrow
  keys and Enter must reach and trigger each format.
- **Verification:** `reminders-admin/A4` `Verify:`; one app-side `ExportMenu` still downloads.
- **Risk:** the draft spec's `getByText('CSV (.csv)')` still resolves. Upgrade it to the role locator afterwards.

## Escalations (backend / outside this repo)

| § | ask | findings | status |
| --- | --- | --- | --- |
| §S1 | Missed one-shot fires are never recovered; spent one-shots stay `Active` | `scheduler/B6` | open — not yet written |
| §S2 | No catalog of reminder kinds, so the *Reminder types* card can never mute anything | `notifications/B3` | open — not yet written |
| §S3 | The dispatcher writes the history row for channels the deployment cannot deliver on | `notifications/B4` | open — not yet written |
| §S4 | The developer `Test` type is in the user-facing notification catalog | `notifications/P5` | open — not yet written |

### §S1 — missed one-shot fires never recover; spent one-shots stay `Active` (`B6`)
Server: `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer\framework\Sydowwe.Scheduler`. Twelve
`History.TimerBoundaryAlarm` one-shots (`misfirePolicy: FireAndProceed`, `runAtUtc` 2026-09-15 22:49 → 09-16 01:54)
are still `Active`, `lastRunAt: null`, overdue by ~14 days, while the dispatcher fires a 10-second cron job and
`Scheduler.OverdueJobSweep` succeeds every 10 minutes. The health endpoint's own reason says *"the fire was missed
rather than slow."* The ask covers three things. (a) What `FireAndProceed` is contracted to do for a one-shot whose
instant passed while the host was down, and why these never fired. (b) Which terminal status a one-shot takes after
it fires: 8 fired ones are still `Active` with `nextRunAt: null`. (c) For the owning module (History), whether alarms
for timers that ended long ago should fire at all. Contract and behaviour only. This is shared framework
infrastructure, so any change must keep existing `Active` semantics for recurring jobs. Write it to
`prompts/_common/scheduler/backend/B4-<slug>.md` in that folder's format, once someone owns the fix. Nothing
client-side changes: the overdue chip and list are correct *reports* of a server state.

### §S2 — no reminder-kind catalog; the *Reminder types* card only ever shows its empty state (`notifications/B3`)
Server: `framework/Sydowwe.Reminders/application/endpoint/preference/` has only `GET /reminder-preference` (the user's
stored overrides) and `PUT /reminder-preference/kind`. The client renders only stored rows, and nothing in `src/`
creates one except a toggle on a row that already exists. So the card's promise ("Mute a specific reminder type…")
can never be kept. The day planner's settings tab sends users to it to turn reminders off "for real"
(`dayPlanner.en.ts:27`, `PlannerRemindersTab.vue:32-37`). The ask: a catalog of the `(ownerModule, kind)` pairs this
deployment can raise, each with its effective `enabled`, either as `GET /reminder-preference/kinds` or folded into
`GET /reminder-preference`. That is the same shape as the notification-type catalog that `GET
/notification-preference/mine` already returns. **Client half after it lands** (a framework batch to append then):
render every kind from the catalog in `ReminderKindList.vue`, drop the empty-state-only path, and carry S12's A7 name
if S12 has not shipped. If the product decision is instead "the card only shows overrides", the client half is copy
only: the subtitle stops promising muting and the planner's hint points at the delivery matrix. The app-side planner
string is then an app batch. Write to `prompts/_common/notifications/backend/` (or the reminders folder, whichever owns
`Sydowwe.Reminders`) in that folder's format, once someone owns it.

### §S3 — the dispatcher counts undeliverable channels, so a muted type still reaches the inbox (`notifications/B4`)
Server: `framework/Sydowwe.Notifications/infrastructure/NotificationService.cs:63-75`. `activeIds` is the union of
recipients whose **stored preference** is on for InApp, WebPush or Email, with no check that the deployment has that
channel configured. Push is default-on for every type and unconfigured on this deployment. So a user who unticks a
type's In-app box still gets the history row and the hub push, while the settings screen, which discounts unconfigured
channels (`notificationPreferenceMatrix.ts`, `disabledChannels`), tells them "You will not get it at all — not even in
the notification list". Observed with `Test` (22104). The ask: intersect `webPushIds` / `emailIds` with the configured
channels, the same options `GET /notification-preference/channels` reads, before computing `activeIds`. Contract and
behaviour only. No client change is needed once it lands. If the server keeps today's behaviour, the client half is to
drop the silenced caption's "not even in the notification list" and count preferences rather than deliverable
channels, which contradicts the channels work (N12). Say which is intended.

### §S4 — `Test` is offered to every user as a delivery setting (`notifications/P5`)
Server: the notification-type catalog behind `GET /notification-preference/mine` includes `Test`, whose only producer is
the dev/QA `POST /notification/test` (`SendTestNotificationEndpoint.cs`). The client renders the catalog as given, on
purpose: the one time it filtered, it hid `TimerBoundary` (notifications README). So a non-admin sees a *Test* row
second in the matrix, and a *Test* option in the inbox's type filter. The ask: leave `Test` out of the catalog for
accounts that cannot raise it (or entirely outside Development). Catalog decision only. No client change is needed.

## Needs verification (unverified findings, and what would settle each)

### `scheduler`
- **`U1`** — does a Trigger from the jobs-grid row show the new run? The row reloads once, immediately (source). It is
  settled by a mutation pass on a harmless job (`Portal.SuggestionPatternRefresh`): trigger from the row and watch
  *Last run* for 30 s. If it does not update, it becomes a batch that gives the grid the job-detail's
  `usePollForRun` treatment.
- **`U2`** — do both pollers pause while the tab is hidden? It needs a headed browser with a second tab in front for 3
  minutes, counting `GET /health` and `POST jobs-overview`.
- **`U3`** — none of the orphan surfaces (grid chip, detail alert, disabled Trigger, replay gate, *Orphaned* list) can
  be exercised, because no job is orphaned. It needs a job row whose `handlerKey` has no registered handler. The e2e
  fixture has no scheduler data, and a test-only handler that registers and then disappears is the cleanest source.

### `notifications`
- **`U1`** — paging (*Load older*, `beforeId`) and "filtering never refetches page 1". The seed's primary account has
  13–14 rows against a page size of 20, so `hasMore` is always false. Needs a fixture account with ≥ 21 notifications
  (ideally 45, with one type present only on page 3). The finding's *What would verify it* has the exact request counts.
- **`U2`** — the "Originally due …" row line. Round 2 narrowed it: a quiet-hours hold never stamps
  `originallyDueAt` on the in-app row (`NotificationService.cs:122-125`), so the only producer is a Reminders-module
  occurrence delivered > 30 min late. A seeded row with `originallyDueAt` set settles it in seconds. A live repro
  takes ~40 minutes. If it renders, check it is English-formatted. It uses `Intl`, not `DateTimeHelper`, so S11 does
  not touch it.

### `reminders-admin`
- **`U1`**: the overview's 5-minute poll, its pause while the tab is hidden, and the "Updated N minutes ago" tick.
  Only the focus path was observed (throttled within 30 s, fires after 32 s). Settled by the same headed two-tab run as
  `scheduler/U2`: 6 min visible (+1 `GET …/overview`, label "5 minutes ago"), 6 min hidden (+0), return (+1).
  Worth doing in one sitting with `scheduler/U2`.
- **`U2`**: the failure card's cap and "showing N of M" line (R9 problem 3). The seed has one uncorrected failure.
  Needs a fixture with more uncorrected failed dispatches than `OverviewFailureList`'s cap. Then compare the
  headline, the rendered rows, the N-of-M line and `/pripomienky/historia?needsAttention=true`.

## Deferred to opportunities

- **`scheduler/O1`** — *Trigger now* is one click with real side effects, while *Replay* has an acknowledged warning.
  A light confirm, at least on the icon-only grid row, is a product decision.
- **`scheduler/O2`** — 50 of the 73 rows are spent or removed `History.TimerBoundaryAlarm` one-shots. Hide `Removed`
  by default and group per-instance one-shots by handler, so the 11 recurring jobs stay visible.
- **`reminders-admin/O1`**: reminders are named by kind and id everywhere, although each row's `payloadJson` carries
  a human title ("Call the dentist"). The right shape is a host-registered per-`(ownerModule, kind)` label resolver
  (like `notificationTypeMeta`) or a server `displayLabel`, not parsing the payload. Whether a title is PII in
  another host is part of the decision. S22 is the no-decision half of this. Unit 16's `reminders-user/B1` (rows
  indistinguishable on `/pripomienky/moje`) is the same gap from the user's side, so weigh the two together.

## Re-grades & notes

### First pass, 2026-09-30 — unit 19 `scheduler`

- `B6` (bug) → **escalation §S1**. The cause is server-side, and the client reports the state correctly. Severity is
  unchanged.
- `P2` (polish) → **not batched**. It duplicates app-queue §22 (`DateTimeHelper` hardcoded `sk`). *(Reversed in the
  second pass: now in S11.)*
- Pairs batched together because one fixing session edits the same block: `B1`+`P1` (jobs-grid setup), `B3`+`B4`
  (breadcrumb ownership), `A1`+`A2` (naming), and `P4`+`P5`+`P6` (run-detail cards). `X1` and `B5` are **not**
  merged, even though both are flex-height bugs. They are different containers with different fixes, and S1 must not
  change `SchedulerDetailPage` in a way that affects S2's page.
- Contradiction with the unit prompt: it said to expect the code to lag `prompts/_common/scheduler/` ("a gap here is
  usually *not built yet*"). S1, S3, S4, S5, S6, S7 and S8 have all landed (`git -C src/_common log --
  modules/scheduler`), and every listed claim checked live holds (table in `docs/views/scheduler/findings.md`). That
  prompt set is effectively done and could move to `_done/`. That is the owner's call, not this queue's.
- Not filed, observed in passing (framework-wide, outside this unit): `ExportMenu`'s open menu joins the activator's
  accessible name (`button "Export Excel (.xlsx) CSV (.csv)"`), and every `FilterPanel` chip's remove button is named
  just "Close". Whichever unit meets them next can file them.

### Second pass, 2026-10-01 — unit 18 `notifications` absorbed (inventory round 1 + mutation round 2)

- 19 findings, all `[framework]`: 14 batched into S10–S17, 3 escalated (§S2–§S4), 2 to *Needs verification*. None
  dropped and none merged across units, except `scheduler/P2`, which joins `notifications/B2` in S11.
- **Re-grade of this queue's own first-pass call:** `scheduler/P2` "not batched" → **batched in S11**. The first pass
  deferred it to the app queue's §22. §22 is a *Contradictions* note that explicitly left the defect "unfiled,
  unobserved in a browser", so deferring to it parked the fix nowhere. With a second, independently observed consumer
  (`notifications/B2`), rule 4 applies: a framework-wide default gets its own batch.
- `notifications/B3` (bug) → **escalation §S2**. The card cannot be fixed without a server catalog. Its client half is
  described in §S2, to be appended as a batch when the catalog lands. Severity unchanged.
- `notifications/B4` (bug) → **escalation §S3**. The cause is the dispatcher's `activeIds`. The client caption states
  the documented intent. Severity unchanged.
- `notifications/P5` (polish) → **escalation §S4**. It is a catalog decision, and a client filter is the documented
  wrong answer.
- `notifications/P4` looked app-side in its finding ("the label keys are app-side, `src/app/notifications/`"). They
  are not: the four labels in question are the framework's `notifications.type.*` (`src/_common/_locales/common.en.ts:
  386-392`). The app's `notificationTypeMeta.ts` registers a label only for `RoutineSuggestedToday`. So P4 is
  framework, batched in S16, and no app-side batch results.
- Kept as separate batches despite touching the same module: S12 (names) vs S16 (copy). One is a11y attributes and the
  other is visible wording with product choices in it (P4, P6). S13 and S15 are their own batches under rule 4:
  `MyDialog` and `SnackbarComposable` defaults reach every app.
- **Contradiction (resolved in the unit docs):** `docs/views/notifications/usecase.md` said the dispatcher "defers every
  notification (not just reminders)" inside quiet hours, and that turning off every deliverable channel removes a type
  from the inbox. Round 2 disproved both (P6, B4). The usecase was corrected in the same pass.
- **Contradiction, cross-repo, not queued:** the API repo's `docs/e2eTestSeed.md` still warns that "the bell's text is
  Slovak regardless of the account's locale". Round 1 settled that it is not (`_shell` B1, closed 2026-09-21 after
  backend `B15`). It is a stale doc in another repo, so fix it there when next touched.
- **Downstream app string to recheck after §S2/§S3 (second pass):** `dayPlanner.en.ts:27` sends users to reminder preferences to
  turn reminders off "entirely". Today neither the kinds card (§S2) nor the matrix (§S3, the row still lands) can
  fully do that on this deployment. If either escalation resolves as "keep behaviour", that string needs an app batch.

### Third pass, 2026-10-01 — unit 17 `reminders-admin` absorbed (inventory)

- 22 findings, all `[framework]`: 18 fix findings in 10 new batches (S18–S27) and 2 existing ones (S5, S7), 2 to
  *Needs verification*, 1 to *Deferred*. None dropped. No severities changed.
- **Merged into existing batches, by cause:** `reminders-admin/B3` → **S5**. It is the same assumption with the same
  comment, and it tips S5 toward the shell-level de-dup. `reminders-admin/P2` → **S7**, the same missing `_silent`. Both
  batches were widened in place rather than duplicated. Their titles changed, their numbers did not.
- **Related but kept separate:** S18 (reminders flex-shrink) vs S2 (scheduler flex-shrink), and S23 (reminders
  tie-breaker) vs S3 (2) (scheduler tie-breaker). Each pair has one cause but different files, and S2/S3 already carry
  scheduler-only work. A fixing session can take a pair together.
- **Rule 4 splits:** S25 (`BasicTable` select column), S26 (`FilterPanel` chip close label) and S27 (`ExportMenu`)
  each change a component every app renders. S26 and S27 file the two items the first pass noted as "observed in
  passing … whichever unit meets them next can file them".
- **Contradiction with an intent source (resolved by observation):** R1 bug 5 and the register's `TODO(Bn)` say the
  grid endpoint does not return `cronExpression`/`intervalPreset`, and the fix was parked on a backend ask that was
  never written. The live response carries `intervalPreset`, `cron` (not `cronExpression`) and `dueAt`, so S19 is
  client-only. The README's "the module is Slovak-only, do not add an EN locale" is also stale: both `.en.ts` files
  exist and render. Neither needs a batch. Both are notes for whoever next reads `prompts/_done/_common/reminders/`.
- **Contradiction between units (not yet absorbed):** unit 16's `reminders-user/B3` (date "to" bound), `A4` (chip
  "Close") and `P2` (sort tie-breaker) are the same defects as `reminders-admin/B4`, `A3` and `P1`. They are listed in
  S20, S26 and S23 as cross-unit duplicates so unit 16's triage closes them there. `reminders-user/B4`
  (interval row "—" on `/pripomienky/moje`) looks like `reminders-admin/B1` but is **not** the same cause: the
  personal `my-upcoming` projection genuinely omits `intervalPreset` (per the DTO header), so it stays a backend
  question for unit 16's triage.
- **Observed, not filed (unit's findings file, *Observed, not filed*):** a `RecurringInterval` reminder's local time
  moves with DST, because the series is a UTC instant (#23003: 10:00 in October, 9:00 November–March). This is a
  server rule in `Sydowwe.Reminders`. If the product wants wall-clock recurrence, it becomes an escalation (§S5) at
  that point. No client change either way.
- **Concurrency note:** the unit's draft spec was run once (global setup reseeds). Unit 16's files were last written
  minutes before, and no other `playwright-cli` session was live at the time.
