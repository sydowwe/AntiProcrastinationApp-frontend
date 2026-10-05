# Fix queue — `_submodule` units (16–19)

> Built 2026-09-30 · updated 2026-10-01 · commit `0e77f904` (framework `b1b82a1`) · units triaged: 19 `scheduler`,
> 18 `notifications` (inventory + mutation), 17 `reminders-admin`, 16 `reminders-user` (inventory + mutation) ·
> findings considered: 83 · batches: 31 framework · 0 app-side · escalations: 6

> **Why a separate queue.** The app's queue (`docs/views/_fix-queue.md`) covers units 1–15. Units 16–19 document
> framework modules (`src/_common/modules/*`), so every batch here is a **`vue_framework` commit first, then a pointer
> bump in this repo** (CLAUDE.md, *`src/_common` is a submodule*). Batch ids are `S<n>` and escalations `§S<n>` so
> they can never be confused with the app queue's `F<n>` / `FW<n>` / `§<n>`. The unit docs are in
> `docs/views/_submodule/<unit>/`.

> Closed batches, closed verification items, the per-pass narrative and the *Contradictions & re-grades* audit
> trail live in [`_fix-queue-log.md`](_fix-queue-log.md) beside this file. This file holds only open work. Closing an
> item is a move, not a mark: the body goes to the log and the summary row keeps a ✅.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| S1 | ✅ **FIXED 2026-10-04** (`ff91bec`) — Run history on job detail has a 0 px scroll box | **framework** | `scheduler/X1` | low |
| S2 | ✅ **FIXED 2026-10-04** (`d21119c`) — Needs-attention children shrink — rollup card crushed | **framework** | `scheduler/B5` | trivial |
| S3 | ✅ **FIXED 2026-10-04** (`21d230e`) — Jobs grid too wide — Next run and actions off-screen; default sort pushes a tie-breaker | **framework** | `scheduler/B1`, `P1` | low |
| S4 | ✅ **FIXED 2026-10-04** (`62451f7`) — Disabled Trigger / Replay explain themselves only via an unreachable `title` | **framework** | `scheduler/B2` | low |
| S5 | ✅ **FIXED 2026-10-04** (`6154af1`, `524312a`) — Detail-page breadcrumbs: duplicate crumb on job **and reminder**, stale crumb on run not-found | **framework** | `scheduler/B3`, `B4`, `reminders-admin/B3` | low |
| S6 | ✅ **FIXED 2026-10-04** (`62451f7`) — Ambiguous accessible names — run links and copy buttons | **framework** | `scheduler/A1`, `A2` | trivial |
| S7 | ✅ **FIXED 2026-10-04** (`62451f7`) — Detail pages report a 404/500 twice (alert + interceptor snackbar) — scheduler **and reminders** | **framework** | `scheduler/P3`, `reminders-admin/P2` | trivial |
| S8 | ✅ **FIXED 2026-10-04** (`62451f7`) — Run detail presentation — retries called replays, idle *Show all*, CRLF blank lines | **framework** | `scheduler/P4`, `P5`, `P6` | low |
| S9 | ✅ **FIXED 2026-10-04** (`62451f7`) — Overdue / failed attention lists in no meaningful order | **framework** | `scheduler/P7` | trivial |
| S10 | ✅ **FIXED 2026-10-03** (`b038d3e`) — Inbox never loads unless the SignalR handshake succeeds | **framework** | `notifications/B1` | medium |
| S11 | ✅ **FIXED 2026-10-04** (`2cbc085`) — `DateTimeHelper` formatters speak only Slovak (framework-wide default) | **framework** | `notifications/B2`, `scheduler/P2`, `reminders-user/P6` | low |
| S12 | ✅ **FIXED 2026-10-03** (`40255f1`) — Notifications controls with no name or a repeated one | **framework** | `notifications/A1`, `A3`, `A5`, `A7` | low |
| S13 | ✅ **FIXED 2026-10-04** (`60bef5b`) — Closing a dialog that mounted already open drops focus to `<body>` (framework-wide component) | **framework** | `notifications/A2`, `reminders-user/A1` | low |
| S14 | ✅ **FIXED 2026-10-03** (`5b2e76b`) — Preference cards' purple palette fails contrast | **framework** | `notifications/A4` | low |
| S15 | ✅ **FIXED 2026-10-04** (`825dfb4`) — Action toasts time out in 3 s, and so does the only Undo (framework-wide default) | **framework** | `notifications/A6` | trivial |
| S16 | ✅ **FIXED 2026-10-03** (`8c5dd57` + app-side P4 labels) — Notifications copy that says the wrong thing | **framework** | `notifications/P2`, `P3`, `P4`, `P6` | low |
| S17 | ✅ **FIXED 2026-10-04** (`7033ca2`) — Framework routes outside any nav tree claim to be "Home" in the breadcrumb | **framework** | `notifications/P1`, `reminders-user/P1` | trivial |
| S18 | ✅ **FIXED 2026-10-04** (`7c048c2`) — Reminder pages clip their own content — detail cards and the history notice shrink | **framework** | `reminders-admin/X1`, `B6` | trivial |
| S19 | ✅ **FIXED 2026-10-04** (`f103416`) — Reminder grid DTOs drop schedule fields the server sends | **framework** | `reminders-admin/B1`, `B2`, `P4` | low |
| S20 | ✅ **FIXED 2026-10-04** (`4920a5b`) — Date-only filter bounds are sent as instants, so "to" excludes its own day | **framework** | `reminders-admin/B4`, `P8`, `reminders-user/B3` | low |
| S21 | ✅ **FIXED 2026-10-04** (`60c85f0`) — Dispatch history renders a raw key for skip reasons the client does not know | **framework** | `reminders-admin/B5` | trivial |
| S22 | ✅ **FIXED 2026-10-04** (`dcd6b11`) — A reminder has no identity on screen — row actions, detail heading, upcoming rows | **framework** | `reminders-admin/A1`, `P3`, `P5` | low |
| S23 | ✅ **FIXED 2026-10-04** (`5d03e01`) — Reminder list default sorts omit `BasicTable`'s tie-breaker | **framework** | `reminders-admin/P1`, `reminders-user/P2` | trivial |
| S24 | ✅ **FIXED 2026-10-04** (`113fcaf`) — Dispatch history: an empty actions column, and a correction that names an id nobody can see | **framework** | `reminders-admin/P6`, `P7` | low |
| S25 | ✅ **FIXED 2026-10-04** (`e46b50f`) — `BasicTable`'s select column checkboxes have no name (framework-wide component) | **framework** | `reminders-admin/A2` | low |
| S26 | ✅ **FIXED 2026-10-04** (`67d4a72`) — `FilterPanel` chip remove buttons are all named "Close" (framework-wide component) | **framework** | `reminders-admin/A3`, `reminders-user/A4` | trivial |
| S27 | ✅ **FIXED 2026-10-04** (`67d4a72`) — `ExportMenu` joins its open list into the button's name; items have no role (framework-wide component) | **framework** | `reminders-admin/A4` | low |
| S28 | ✅ **FIXED 2026-10-04** (`4e385e5`) — Snooze and Dismiss never reach the server, and once they do, the default snooze delivers early | **framework** | `reminders-user/X1`, `B2` | low |
| S29 | ✅ **FIXED 2026-10-04** (`639814a`) — Reminder tables render a failed load as an empty list, in Vuetify's words | **framework** | `reminders-user/B5`, `P4` | low |
| S30 | ✅ **FIXED 2026-10-04** (`0d04853`) — My reminders: the Dismiss confirm ignores Escape and names nothing; every 400 is "no longer in the future" | **framework** | `reminders-user/A2` (Dismiss half), `P5`, `P7` | trivial |
| S31 | ✅ **FIXED 2026-10-04** (`67d4a72`) — `DateTimePicker`'s time field loses its name whenever a label is passed (framework-wide component) | **framework** | `reminders-user/A3` | trivial |

---

<!-- S1 (Run history on job detail has a 0 px scroll box — scheduler/X1) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S2 (Needs-attention children shrink — rollup card crushed — scheduler/B5) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S3 (Jobs grid too wide; default sort pushes a tie-breaker — scheduler/B1, P1) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S4 (Disabled Trigger / Replay explain themselves only via an unreachable title — scheduler/B2) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S5 (Detail-page breadcrumbs — scheduler/B3, B4, reminders-admin/B3) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S6 (Ambiguous accessible names — run links and copy buttons — scheduler/A1, A2) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S7 (Detail pages report a 404/500 twice — scheduler/P3, reminders-admin/P2) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S8 (Run detail presentation — scheduler/P4, P5, P6) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S9 (Overdue / failed attention lists in no meaningful order — scheduler/P7) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S10 (Inbox never loads unless the SignalR handshake succeeds — notifications/B1) fixed 2026-10-03 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S11 (DateTimeHelper formatters speak only Slovak — notifications/B2, scheduler/P2, reminders-user/P6) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S12 (Notifications controls with no name or a repeated one — notifications/A1, A3, A5, A7) fixed 2026-10-03 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S13 (Closing a dialog that mounted already open drops focus to <body> — notifications/A2, reminders-user/A1) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S14 (Preference cards' purple palette fails contrast — notifications/A4) fixed 2026-10-03 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S15 (Action toasts time out in 3 s, and so does the only Undo — notifications/A6) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S16 (Notifications copy that says the wrong thing — notifications/P2, P3, P4, P6) fixed 2026-10-03 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S17 (Framework routes outside any nav tree claim to be "Home" — notifications/P1, reminders-user/P1) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S18 (Reminder pages clip their own content — reminders-admin/X1, B6) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S19 (Reminder grid DTOs drop schedule fields the server sends — reminders-admin/B1, B2, P4) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S20 (Date-only filter bounds are sent as instants, so "to" excludes its own day — reminders-admin/B4, P8, reminders-user/B3) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S21 (Dispatch history renders a raw key for skip reasons the client does not know — reminders-admin/B5) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S22 (A reminder has no identity on screen — reminders-admin/A1, P3, P5) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S23 (Reminder list default sorts omit BasicTable's tie-breaker — reminders-admin/P1, reminders-user/P2) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S24 (Dispatch history: an empty actions column, and a correction that names an id nobody can see — reminders-admin/P6, P7) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S25 (BasicTable's select column checkboxes have no name — reminders-admin/A2) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S26 (FilterPanel chip remove buttons are all named "Close" — reminders-admin/A3, reminders-user/A4) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S27 (ExportMenu joins its open list into the button's name; items have no role — reminders-admin/A4) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S28 (Snooze and Dismiss never reach the server; the default snooze delivers early — reminders-user/X1, B2) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S29 (Reminder tables render a failed load as an empty list — reminders-user/B5, P4) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S30 (My reminders: Dismiss confirm ignores Escape and names nothing; every 400 is "no longer in the future" — reminders-user/A2 Dismiss half, P5, P7) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- S31 (DateTimePicker's time field loses its name whenever a label is passed — reminders-user/A3) fixed 2026-10-04 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## Escalations (backend / outside this repo)

| § | ask | findings | status |
| --- | --- | --- | --- |
| §S1 | ✅ **FIXED 2026-10-05** (server-side, verified live after a restart) — Missed one-shot fires were never recovered; spent one-shots stayed `Active` | `scheduler/B6` | closed |
| §S2 | ✅ **FIXED 2026-10-05** (server `IReminderKindCatalog` + `kinds` on `GET /reminder-preference`, client renders it; verified live) — No catalog of reminder kinds, so the *Reminder types* card can never mute anything | `notifications/B3` | closed |
| §S3 | ✅ **FIXED 2026-10-05** (server `NotificationService` drops unconfigured channels before `activeIds`; verified live) — The dispatcher writes the history row for channels the deployment cannot deliver on | `notifications/B4` | closed |
| §S4 | ✅ **FIXED 2026-10-05** (server `AdminOnlyTypes` + admin-only `POST /notification/test`; matrix verified live, the inbox type filter still lists *Test*) — The developer `Test` type is in the user-facing notification catalog | `notifications/P5` | closed |
| §S6 | ✅ **FIXED 2026-10-05** (`Sydowwe.Reminders` `13b1bd6` + `a983eea`, framework `81b82c1` + `26e8693`) — The personal reminder row has no recipient-safe identity and no interval | `reminders-user/B1`, `B4` | closed |
| §S7 | ✅ **FIXED 2026-10-05** (server + framework, verified live 2026-10-05 after the API restart) — Acted-on occurrences are invisible and repeatable; a snooze may land before its occurrence | `reminders-user/B6`, `B2` (server half) | closed |

`§S5` is unused on purpose. The third pass reserved it for wall-clock (DST) recurrence, if the product ever asks for
that (log, third pass).

<!-- §S1 (Missed one-shot fires never recover; spent one-shots stay Active — scheduler/B6) fixed 2026-10-05 — body moved to _fix-queue-log.md → Closed escalations. Number retired, not reused; the table keeps its ✅ row. -->

<!-- §S2 (No reminder-kind catalog; the Reminder types card only ever shows its empty state — notifications/B3) fixed
     2026-10-05 — body moved to _fix-queue-log.md → Closed escalations. Number retired, not reused; the table keeps its ✅ row. -->

<!-- §S3 (The dispatcher counts undeliverable channels, so a muted type still reaches the inbox — notifications/B4) fixed
     2026-10-05 — body moved to _fix-queue-log.md → Closed escalations. Number retired, not reused; the table keeps its ✅ row. -->

<!-- §S4 (`Test` is offered to every user as a delivery setting — notifications/P5) fixed 2026-10-05 — body moved to
     _fix-queue-log.md → Closed escalations. Number retired, not reused; the table keeps its ✅ row. -->

<!-- §S6 (The personal reminder row has no recipient-safe identity and no interval — reminders-user/B1, B4) fixed
     2026-10-05 — body moved to _fix-queue-log.md → Closed escalations. Number retired, not reused; the table keeps its ✅ row. -->

<!-- §S7 (Acted-on occurrences are invisible and repeatable; a snooze may land before its occurrence —
     reminders-user/B6, B2 server half) fixed 2026-10-05 — body moved to _fix-queue-log.md → Closed escalations.
     Number retired, not reused; the table keeps its ✅ row. -->

## Needs verification (unverified findings, and what would settle each)

### `scheduler`
<!-- `scheduler` U1, U2, U3 verified 2026-10-05 — moved to _fix-queue-log.md → Closed verification items. -->

<!-- `notifications` U1, U2 verified 2026-10-04 — moved to _fix-queue-log.md → Closed verification items. -->

<!-- `reminders-admin` U1, U2 verified 2026-10-05 — moved to _fix-queue-log.md → Closed verification items. -->

<!-- `reminders-user` U3 settled 2026-10-05 — moved to _fix-queue-log.md → Closed verification items. -->

## Deferred to opportunities

<!-- `scheduler/O1` built 2026-10-05 — moved to _fix-queue-log.md → Closed opportunities. -->
<!-- `scheduler/O2` built 2026-10-05 (Removed hidden by default, *Include removed* switch) — moved to
     _fix-queue-log.md → Closed opportunities. -->
<!-- `reminders-admin/O1` built 2026-10-05 (server `displayLabel` from an owner-registered resolver) — moved to
     _fix-queue-log.md → Closed opportunities. It also landed §S6 (a). -->
<!-- `reminders-user/O1` built 2026-10-05 (the chip, with §S7; then *Undo* and the *My action* filter the same day) —
     moved to _fix-queue-log.md → Closed opportunities. -->
