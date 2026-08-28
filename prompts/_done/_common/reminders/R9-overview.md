# R9 · The overview is a dead end that never refreshes

- **Scope:** `src/_common/modules/reminders/view/ReminderOverviewView.vue`, `component/{OverviewGroupCard,OverviewFailureList}.vue`
- **Backend:** possibly — see the escalation block at the end
- **Model / effort:** **Opus 5**, high
- **Depends on:** R2 (settles the failure branch this view is missing)
- **Unblocks:** nothing

---

```
The reminders overview is the admin's answer to "is the reminder system healthy right now". It currently
answers that once, at mount, and then goes stale in silence — and almost nothing on it is clickable.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; do not fork into src/ and do not add a
migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end. Commit
and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the surrounding style
by hand (tabs, single quotes, no semicolons, camelCase props, PascalCase tags). Verify Vuetify props with
the `vuetify` MCP before using them.

--- What the view shows today ---

ReminderOverviewView.vue renders, from a single GET /reminder-dashboard/overview at mount:
  - three headline cards: due-soon count (over `dueSoonDays` days), paused count, cancelled count
  - a recent-outcomes chip row: sent / skipped / failed / reversed over the last week
  - two rollup cards: upcoming volume by owner module and by kind (OverviewGroupCard)
  - a failure list: failed dispatches not yet superseded by a correction (OverviewFailureList)

--- The problems, in order of value ---

**1. It never refreshes, and does not admit it.** `onMounted(load)` and a manual Refresh button
(lines 18-26, 189) are the whole story. This is a monitoring page — someone leaves it open on a second
monitor. Nothing on it says how old the numbers are, so "0 failures" at 09:00 still reads as "0 failures"
at 16:00.

Fix the honesty problem first and the freshness problem second:
  - Show when the data was fetched, and keep that display live (a relative "updated 4 minutes ago" that
    actually ticks). `_common/composable/general/useCurrentTime.ts` exists; read it before adding a timer.
  - Then refresh automatically. Refresh on tab focus/visibility change at minimum — that covers the
    "came back to the monitor" case for free and costs one request. A polling interval on top is
    reasonable for this page specifically; if you add one, make it slow (minutes, not seconds), pause it
    while the tab is hidden, and never let it tear the page down to a spinner. The existing `loading`
    ref drives the full-page spinner via `v-if="loading && data === null"` (line 30) — that guard already
    means a background refresh keeps the content on screen, so preserve that property rather than
    breaking it. Show the in-flight state on the Refresh button, which line 22 already does.

**2. Nothing drills down.** Three headline numbers, two rollup lists and a set of outcome chips, and only
the failure rows are links (OverviewFailureList.vue:41-46). An admin who sees "12 paused" cannot click 12.

Make the numbers navigate to the list that explains them. The destinations already exist and already
accept filters:
  - paused count      → the register, filtered to status Paused
  - cancelled count   → the register, filtered to status Cancelled
  - due-soon count    → the upcoming list, filtered to a nextOccurrence window of `dueSoonDays`
  - a rollup row (OverviewGroupCard, by owner module / by kind) → the upcoming list filtered to that
    ownerModule or kind
  - an outcome chip   → the dispatch history filtered to that outcome

  **This depends on how filters are carried in the URL.** If R5 has run, the list views serialize their
  filters to query params and you should construct the same params — read the `filterToParams` codec it
  wrote and reuse the param names rather than inventing new ones. If R5 has NOT run, only the
  `?reminderId=` deep link exists (hand-parsed in ReminderDispatchHistoryView), and building five more
  bespoke params is a mess you would then have to unpick. In that case: implement the drill-downs that
  the existing route+filter plumbing supports cleanly, skip the rest, and say plainly in your final
  message which ones you left because they need R5.

  Whatever you make clickable must be a real link (keyboard-focusable, middle-clickable, right-click
  "open in new tab"), not a `@click` on a div. OverviewFailureList.vue:41 uses RouterLink correctly —
  follow it.

**3. The failure list is unbounded and its count may be a lie.** OverviewFailureList.vue:21 renders
`items.length` as the headline number and then renders every item, with no cap and no pagination. If the
server truncates the list, the headline undercounts the actual problem on exactly the day it matters most.
If it does not, a bad night renders a thousand rows into a card.

Do the frontend-safe thing now: cap what you render, show "showing N of M" honestly if you can distinguish
them, and link through to the dispatch history filtered to Failed for the rest. Then ask the backend which
of the two it is (see below). Do not silently render `items.length` as if it were a total.

**4. Small correctness details while you are here:**
  - The recent-outcomes card is titled "last week" in the locale (`overview.recentOutcomes`,
    remindersDashboard.sk.ts:76) and documented as such in the DTO, but the window is not in the response
    — unlike `dueSoonDays`, which is. So the label is hardcoded to a window the client cannot verify.
  - `data.recentOutcomes.total > 0` (line 98) gates the whole chip row; when every outcome is zero the
    card says "no dispatches last week", which is right. Leave it.
  - RecentDispatchRollup.total is a getter on the class (ReminderOverviewResponse.ts:30-32) — fine, but
    check it survives if the response is ever spread or serialized through the composable you add.

--- Out of scope ---

- Charts. The dataviz surface here is four counts and two short lists; a chart library for that is worse
  than the chips. If you think a sparkline of dispatch outcomes over time is the right answer, that needs
  a time series the endpoint does not return — write it up as an ask instead of faking it.
- Changing what the overview endpoint returns without asking (see escalation).
- The list views themselves, their filters, or their URL state (R5).

--- Verification ---

npm run type-check — baseline 72 errors, all app-side in src/core; any src/_common error is yours.
npm run lint stays at 0.

Then, on /pripomienky/prehlad:
  - The "updated N ago" display ticks without a reload.
  - Switch to another tab for a minute and come back: the data refreshes, the page does not blank, and the
    timestamp resets.
  - Every drill-down you added lands on the right list WITH the filter applied and visible in the filter
    chips — not just the right route.
  - Middle-click one: it opens in a new tab, correctly filtered.
  - With the network blocked, a background refresh fails without destroying the content already on screen.
  - The failure card with more items than your cap shows the honest count and the link through.

--- After the frontend work is done: write the backend ask, IF you found one ---

Two things you may not be able to settle from the client:

  1. Whether `failures` is capped server-side (problem 3). You need this to know whether your "showing N
     of M" is truthful. State what you implemented and which reading it assumes.
  2. The recent-outcomes window (problem 4). `dueSoonDays` is returned so the client can label the
     due-soon card honestly; the outcomes window is not, so its label is a hardcoded guess. Asking for the
     same treatment is a one-field, additive, consistent request.

Finish and verify the frontend work first. Then read prompts/_common/reminders/backend/README.md for the format and
the scope rules — note especially that this is the FRAMEWORK's shared reminder service, so say so and say
whether your ask is additive — and write prompts/_common/reminders/backend/Bn-<slug>.md. Leave a `// TODO(Bn):` at
each site that depends on the answer.

If you find both answers in the response or in the API's own documentation, write nothing.
```
