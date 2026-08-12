# S5 · Freshness — a monitoring dashboard that never refreshes and never says when

- **Scope:** `view/SchedulerNeedsAttentionView.vue`, `view/SchedulerJobsView.vue`, `component/AttentionJobList.vue`, `composable/`
- **Backend:** likely — no "as of" timestamp exists; see the escalation block
- **Model / effort:** Opus 5, high
- **Depends on:** S1 (error states), S3 (the jobs grid's reload path)
- **Unblocks:** nothing

---

```
The scheduler is the page an operator leaves open on a second monitor. It does not behave like one.

SUBMODULE RULES — read before editing:
src/_common is the vue_framework repo mounted as a git submodule, and CLAUDE.md says never to write
to it. This task is an explicit, user-approved exception: the scheduler module lives there and
nowhere else. So:
  - Edit the files in src/_common in this working tree. Do NOT fork a file into src/, and do NOT add
    a migration-revision.md entry.
  - Leave the work in the submodule's working tree and say so in your final message; the parent repo
    will show a dirty submodule pointer. Commit inside the submodule only if the user asks.
  - ESLint and Prettier ignore src/_common, so `npm run lint` will not check your work. Match the
    surrounding style by hand: tabs, single quotes, no semicolons, tab-indented <script setup>.
  - `npm run type-check` DOES cover src/_common. Baseline is 72 errors, all app-side in src/core;
    _common is clean. Any new error under src/_common is a regression you introduced.

TWO PROBLEMS.

PROBLEM A — THE HEALTH DASHBOARD FETCHES ONCE AND NEVER AGAIN.
SchedulerNeedsAttentionView.vue:220 is `onMounted(load)`. The only other path to `load` is the manual
refresh button at :18-26. So the page that exists to answer "is anything broken right now" will
happily show a four-hour-old all-clear, with nothing on screen admitting it. An operator who leaves
it open is being actively misled — this is worse than a page that obviously has not loaded.

PROBLEM B — NOTHING IS RELATIVE.
Every timestamp in the module renders through formatDateTime as an absolute date + time with seconds:
  - nextRunAt / lastRunAt in the jobs grid (SchedulerJobsView.vue:113, :123)
  - the same two on the job detail (SchedulerJobDetailView.vue:84, :95)
  - startedAt in the run history and on the run detail
  - lastRunAt / nextRunAt inside AttentionJobItem rows
"Next run 14:32:00" makes the operator work out what time it is and subtract. "in 4 min" does not.
This matters most exactly where the module already knows something is wrong: an overdue job's
`detail` string from the server (AttentionJobItem.ts:15-16) reads "overdue by 2h" — the server
already decided relative phrasing is the right register here, and the client renders everything else
absolute.

WHAT TO BUILD

1. Auto-refresh the needs-attention dashboard.
   - Poll on a sensible fixed interval. This is a health summary, not a live feed — something on the
     order of a minute, not seconds. Put the number in one named constant with a comment.
   - PAUSE WHEN THE TAB IS HIDDEN and refresh once on becoming visible again. A dashboard left open
     for a weekend must not have hammered the endpoint 5000 times. Use the visibilitychange event or
     an existing framework helper if one exists — grep _common/composable/ before writing your own.
   - Clear the timer on unmount (onUnmounted / onScopeDispose). A stray interval firing into a
     torn-down component is the classic version of this bug.
   - The refresh must be BACKGROUND: do not blank the page to a spinner. The current `loading` ref
     drives both the initial spinner (:30) and the refresh button (:22), so a poll would tear the
     content down every minute. Separate "first load, nothing to show" from "refreshing what is
     already on screen" — the existing `v-if="loading && data === null"` guard at :30 is already
     halfway there; make the distinction explicit rather than implicit.
   - A failed poll must NOT wipe good data. loadFailed at :198 plus `data === null` at :41 already
     gets this right for the first load; keep that property when polls start failing — show the stale
     data with a quiet indication that the last refresh failed, not an error page.

2. Say how fresh it is.
   Add an "updated <relative>" line near the refresh button, ticking live. The framework already has
   useCurrentTime (src/_common/composable/general/useCurrentTime.ts) — read it first: it is a single
   app-wide timer, ref-counted across instances, and it ticks ONCE PER MINUTE. That cadence is right
   for "updated 3 min ago" and wrong for anything second-precision, which is a good reason not to try
   to be second-precise here.
   Read the escalation block before deciding WHICH timestamp you display — client receive time is not
   the same thing as server snapshot time, and the difference is exactly what an operator would be
   misled by.

3. Relative time alongside absolute, everywhere it helps.
   Add a shared formatter and use it for nextRunAt, lastRunAt and startedAt. Rules:
     - RELATIVE IS THE HEADLINE, ABSOLUTE IS THE DETAIL. "in 4 min" as the visible text with the full
       timestamp as a title/tooltip is the right default for grid cells. On the two detail pages,
       where there is room, show both.
     - Handle future and past ("in 4 min" / "2 h ago") and be explicit about the boundary — a job
       whose nextRunAt has passed is the OVERDUE case the module already flags separately
       (isOverdue), so make sure the two agree rather than contradicting each other on screen.
     - Beyond about a day, relative stops helping: "in 6 days" is worse than a date. Fall back to
       absolute past some threshold and pick it deliberately.
     - Use Intl.RelativeTimeFormat with the active locale rather than hand-writing unit strings —
       vue-i18n exposes the locale, and hand-rolled relative time in Slovak needs the same three-form
       plural rule that ScheduleDisplay gets wrong today (see S2).
     - It must TICK. A cell reading "in 1 min" ten minutes later is worse than an absolute timestamp.
       Drive it from useCurrentTime so the whole app shares one timer.
   Check whether the framework already has a relative-time formatter before writing one — grep
   _common/utils/DateTimeHelper.ts and _common/composable/. If it does, use it. If it does not, put
   yours where S4 decided the pure formatters live (or in the module's composable/ if S4 has not run).

4. While you are in the jobs grid: nextRunAt goes stale there too.
   A list left open shows next-run times that quietly become past-run times. The relative formatter
   from item 3 fixes the DISPLAY, but the isOverdue flag (SchedulerJobsView.vue:98) is computed
   server-side and will not update. Do not recompute overdue on the client — grace periods are a
   server rule (ScheduledJobGridResponse.ts:25-26 says so explicitly). Instead make sure the relative
   display does not contradict the chip, and consider whether the jobs grid deserves the same
   background refresh as the dashboard. If you add one, it must respect the same visibility pause and
   must NOT fight the operator: no refresh while a filter panel is open or a row action is in flight,
   and never a scroll or selection jump.

DO NOT, in this prompt:
  - add relative time to the payload, correlation id or lineage list (S6 owns that card),
  - add drill-down links from the attention lists (that is S6),
  - use a WebSocket or SignalR. The framework has SignalR but CLAUDE.md says it is used only by the
    notifications module; a polling admin dashboard does not justify widening that.
  - poll faster than the data can change. If the backend computes needs-attention on a schedule, a
    5-second poll is noise — which is one of the questions in the escalation block.

--- Verification ---

npm run type-check — must stay at 72 errors, all in src/core. Zero under src/_common.
Then, as an admin:
  - Leave the needs-attention page open and watch the network tab: one request per interval, and the
    content must not flicker or blank between them.
  - Switch to another browser tab for several intervals: requests must STOP, and exactly one must
    fire on returning.
  - Navigate away from the page and watch for further requests: there must be none.
  - Stop the backend while the page is open: the data on screen must stay, with a visible hint that
    refreshing failed. Restart it: the next poll must recover on its own.
  - Watch the "updated X ago" line for three minutes: it must tick without a refresh.
  - Find a job with a next run a few minutes out and confirm the grid cell counts down, that the
    absolute time is still reachable (tooltip/title), and that it does not disagree with the overdue
    chip at the moment it crosses zero.
  - Check both locales. Slovak relative time is where a hand-rolled formatter will embarrass you.

--- After the frontend work is done: write the backend ask, IF you found one ---

Item 2 is the one that will stop you. You are about to render "updated 3 minutes ago", and the
honest question is: 3 minutes since WHAT?

  - GET /scheduled-job/needs-attention returns no timestamp (see SchedulerNeedsAttentionResponse.ts —
    counts, three job lists, a rollup, nothing else). So the client can only display when IT received
    the response. If the server computes this summary on a schedule rather than on request, the data
    can already be minutes old at the moment of receipt and your "updated just now" is wrong in
    precisely the situation the page exists for.
  - The rollup is documented as "over the last day" (RecentOutcomeRollup, and the Slovak label
    scheduler.needsAttention.recentOutcomes). The client knows that window only from a translated
    string. Is it 24 hours rolling, or midnight-to-now in some timezone? An operator reading
    "Failed: 3" needs to know which.
  - Are the three job lists capped? AttentionJobList.vue:26 renders `items.length` as a headline
    count. If the server truncates at, say, 20, that headline is a lie exactly on the day it matters.
  - Relative time is computed against the CLIENT clock. On a machine with a skewed clock every
    "in 4 min" in the module is wrong. Whether the server should expose its own time is a real
    contract question, not a nitpick — but it is only worth asking if you conclude the skew matters
    more than the complexity.

Do the honest frontend-only thing first: display client receive time, and label it in a way that does
not overclaim. Leave a `// TODO(Bn):` at the site. Then, if you actually hit these walls, write the
ask AFTER the frontend work is finished and verified. Read
prompts/_common/scheduler/backend/README.md for the format and scope rules — note especially that
this is shared framework infrastructure, so prefer an additive field on the existing response over a
new endpoint — and write it to prompts/_common/scheduler/backend/Bn-<slug>.md.

If you found the answers stated somewhere authoritative, do not write anything. An ask that confirms
what you already confirmed wastes the backend agent's turn.
```
