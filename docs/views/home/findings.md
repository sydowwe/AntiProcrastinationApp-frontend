# home — findings

> Pass: mutation · captured 2026-09-15 · commit `04c405e9`

**Tally:** blocker 0 · bug 4 · a11y 1 · polish 1 · opportunity 0 · unverified 0 — 6 entries; B1–B4 and A1 **fixed and verified** (see round 3), **P1 open** (x4, round 4)

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `430e6f03` | initial inventory pass. All ten `H1`–`H10` prompts (`prompts/_done/home/`) had already landed — verified live, not assumed: real current date in the pie-chart request and the activity-history deep link (H1), route-name fix on "Add to planner" (H1), `resetTodayPlan()`/`effectScope`/day-rollover watcher present (H2), one shared `WidgetCard` shell (H4), due-date chips on to-do rows + persisted-store `hideDone` toggle *attempted* (H8 — see B3), one dashboard-wide refresh coordinator with visibility/day-change/online/interval triggers (H7), NowBar as sole owner of the focus task with `DayPlannerWidget`'s focus block removed (H9). The three bugs below are new, found by driving the browser against real seeded data — none are regressions of a listed H-prompt defect. |
| 2 | 2026-09-15 | `04c405e9` | mutation pass. B1 re-confirmed open (same 218px header overflow, now measured against fixture `e2e-v4`). B2 **root-caused and widened**: what round 1 described as a narrow, hard-to-hit loading race is in fact a near-deterministic sign-in bug — reproduced on 3 of 4 fresh sign-ins in this pass regardless of network speed, traced to a specific line (`useTodayPlan.ts:512-521`), and shown to have a second, worse variant (a permanently stuck spinner, reproduced by forcing a 500 during sign-in) that also **answers round 1's U1** (H6's error/Retry UI is correct in isolation; this race is what makes it unreachable). B3 re-confirmed open, unchanged. Cross-account isolation (H2) re-verified clean — no leaked plan data switching to the secondary account, folded into B2's evidence rather than filed separately. One new bug found only by actually mutating state, **B4** (skipping a task renders it identically to completing it — the `row--done`/`aria-pressed` distinction the checkbox exists to convey is simply absent for `Cancelled`), and one new **a11y** finding, **A1**, from a masked-input edge case discovered while testing keyboard-shortcut suppression. Full task lifecycle exercised: start/finish/skip/snooze via NowBar, the day-planner-widget checkbox, the shared `TaskActionMenu`, and the **M**/**P**/**T** keyboard shortcuts, plus the hide/show-done toggle (B3). Database reseeded (`POST /api/test/seed`, fixture `e2e-v4`, `seedDateUtc` now `2026-09-15`) at the end to restore known-good state — **this invalidates `e2e/.state/auth-10001.json`; the next agent must sign in through the form rather than `state-load` it.** |
| 3 | 2026-09-24 | `1fb9de9e` | status sync, no new pass. Every finding had already been fixed and verified through `_fix-queue.md`, but this file still read "open": B1 → `F7` (`e3271007`), B2 → `F8` (`dfd64a6a`), B3 → `F9` (`9e3a9c9e`), B4 → `F59` (`dfd64a6a`), A1 → `F58` (`f457aa0c`). Each finding's source was re-read against the current tree, and the fix is still in place. The verification record for each is in `_fix-queue-log.md` under its F-number. |
| 4 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 1 view checked; new: P1. |

---

### B1. RoutineTodoWidget's header controls are clipped off-screen at a common desktop width
- **Status:** fixed and verified (2026-09-23, `F7`, `e3271007`). The period chips get their own
  zero-basis `overflow-x: auto` scroller (`.routine-periods` in `RoutineTodoWidget.vue`). The counter and
  both buttons stay anchored inside the card at 1440×900. Not measured on an account with more or fewer
  than four periods.
- **Severity:** bug
- **Where:** `/` → `RoutineTodoWidget`'s `WidgetCard` header (`src/core/home/component/WidgetCard.vue:142-153`, `.widget-card__header { flex-wrap: nowrap }` above 960px, `.widget-card { overflow: hidden }`)
- **Expected:** Every widget's "hide/show done" toggle and "open full view" button should be reachable
  by pointer at ordinary desktop widths — `WidgetCard`'s own header comment states the header is meant
  to hold "title + actions" at one height across every widget, and CLAUDE.md's coding standards call
  for the app to work at standard breakpoints, not just above some untested minimum width.
- **Actual:** At a 1440×900 viewport (a common laptop resolution, not a phone or an unusually narrow
  window) the routine widget's header holds four period-streak chips (Daily/Weekly/Monthly/Yearly)
  plus the done/total counter plus the two icon buttons. `getBoundingClientRect()` on the
  `aria-pressed` toggle button returns `left: 1520.9, right: 1560.9`, while the header's own
  `getBoundingClientRect().right` is `1420` — the button sits **~100–140px past the visible right edge
  of the card**, clipped by the card's `overflow: hidden`. The "Open: Routine tasks" button, further
  right in DOM order, is clipped at least as badly. Both remain in the accessibility tree (so
  `find`/tab order still reaches them) but neither is visible nor clickable by a mouse user — the
  screenshot shows the "Yearly" chip's own numbers already cut off before reaching either button.
- **Evidence:** `screenshots/home--routine-header-clip.png`; `page.evaluate` measuring
  `.widget-card__header` and its `button[aria-pressed]` child's bounding rects (see above); confirmed
  via `document.querySelectorAll('.widget-card__header')[0]`: `scrollWidth: 753` vs `clientWidth: 548`
  — a 205px overflow on the routine card specifically (the other three `WidgetCard` instances did not
  overflow at this width).
- **Repro:** 1. Sign in, resize the browser to 1440×900 (or wider — the overflow scales with period
  count, not screen width, since the card is a fixed fraction of the row). 2. Load `/`. 3. Look at the
  routine widget's header. 4. Try to click "Show done"/"Hide done" or the open-full-view icon with the
  mouse.
- **Verify:** 1. Load `/` at 1440×900 with an account whose routine time periods include at least
  Daily/Weekly/Monthly/Yearly (the seed account qualifies). 2. **Pass condition:**
  `getBoundingClientRect()` on both the hide/show-done button and the open button returns a `right`
  value ≤ the header's own `right` (i.e. inside the card), and both are clickable by
  `playwright-cli click` without falling back to a forced/JS click. 3. Confirm the period-streak chips
  themselves are not cut off either.
- **Root cause guess:** `.widget-card__header` is `flex-wrap: nowrap` above the `md` breakpoint with no
  `overflow-x: auto` fallback, so a header whose intrinsic content width exceeds the card's width is
  silently clipped rather than wrapped, scrolled, or shrunk. `TodoListWidget`'s header (title + counter
  + 2 buttons) is narrow enough to fit; `RoutineTodoWidget`'s (title + N period chips + counter + 2
  buttons) is not, and N grows with however many time periods the account has configured.
- **Suggested fix:** Either let the period-streak chip row wrap onto its own line below the title (the
  way the header already does below `md`), or give the chip row its own `overflow-x: auto` scroller
  that does not also swallow the two action buttons — the buttons need to stay anchored and visible
  regardless of how many periods exist.
- **Round 2 (mutation pass, 2026-09-15):** Re-confirmed open, unchanged mechanism. Fresh measurement
  against fixture `e2e-v4` (Daily/Weekly/Monthly/Yearly periods, 1440×900): `.widget-card__header`
  `scrollWidth: 766` vs `clientWidth: 548` — a 218px overflow, same shape, slightly different pixel
  count than round 1's 205px (period-chip content differs by fixture). Not re-driven with a mouse click
  this round; the DOM measurement is the same falsifiable check round 1 used.

### B2. A sign-in race discards the day-plan fetch, leaving NowBar/DayPlannerWidget stuck on a false "No plan for today" — or, if the fetch fails, stuck spinning forever
- **Status:** fixed and verified (2026-09-22, `F8`, `dfd64a6a`). The user-id watcher in `useTodayPlan.ts`
  now ignores the `0 → id` hydration and re-fetches on `loadPromise !== null` rather than `planDate`.
  `NowBar` has a `loading` branch, and `focusMode` returns `'noPlan'` when `hasPlan` is false, so a
  plan-less day no longer shows the *DONE* kicker. This also settles `U1`.
- **Severity:** bug
- **Where:** `/` → `NowBar` (`src/core/home/component/NowBar.vue`) reading `focusMode`/`hasPlan` from
  `useTodayPlan()` (`src/core/home/composable/useTodayPlan.ts:163-166`)
- **Expected:** A widget either shows a loading state or shows data that agrees with itself.
  `DayPlannerWidget`, right next to it, explicitly guards on `loading` and shows a spinner
  (`DayPlannerWidget.vue:88-92`) before rendering any plan-derived content — the same page's own
  sibling widget is the standard here, not an assumption imported from elsewhere.
- **Actual:** `NowBar.vue`'s `<script setup>` destructures `now, hasPlan, focusTask, focusMode,
  focusIcon, focusCountdown, overrunMinutes, activeProgress, todayUrlDate, streak, error, taskColor,
  minutesLabel, durationLabel, startTask, finishTask, reload` from `useTodayPlan()` — **`loading` is
  not among them**, and nothing in the template branches on it. While the initial `calendar/day-plan`
  request is in flight, `tasks` is still `[]` and `hasPlan` is still `false` (their `ref()` defaults),
  which makes `focusMode` compute to `'allDone'` (no active/next/missed task found) and the headline
  compute to `home.noPlanToday` (`hasPlan` false) — rendered together as kicker **"DONE"** next to
  headline **"No plan for today"** plus a "Plan today" button, even on a day that turns out to have a
  real plan. Observed live: the very first screenshot after a fresh sign-in
  (`screenshots/home--default.png`) shows exactly this pair with the champagne-glasses icon; a
  subsequent reload of the same account, same date, same data
  (`screenshots/home--after-reload-check.png`) shows the correct "UP NEXT · Starts in 3h 2m · Feature
  Development", confirmed against the `calendar/day-plan/2026-09-13` response itself
  (`hasPlan: true`, two real tasks). The two screenshots are the same day plan at two points in the
  same load sequence, not two different underlying states.
- **Evidence:** `screenshots/home--default.png` (the false state) vs.
  `screenshots/home--after-reload-check.png` (the corrected state) for the same account/date; response
  body of the `calendar/day-plan/2026-09-13` request confirming `hasPlan: true` with 2 tasks at the
  time the false state was showing; source read of `NowBar.vue`'s destructure list (`loading` absent)
  and `useTodayPlan.ts`'s `focusMode`/`headline` computeds (independent of `hasPlan` and of `loading`
  respectively).
- **Repro:** 1. Sign in fresh (or hard-reload `/` on an account/day that has a real plan). 2. Look at
  the now bar within the first render, before the `calendar/day-plan` request resolves (throttling the
  network makes this reliable; on a fast local backend it is a narrow but real window, confirmed to
  land at least once in this pass without throttling). 3. It reads "DONE" / "No plan for today" /
  "Plan today", contradicting the plan that is about to render a moment later.
- **Verify:** 1. Throttle the network (or add an artificial delay to the day-plan endpoint in a test
  double) and load `/` on an account with a real plan for today. 2. **Pass condition:** the now bar
  shows a loading indicator (or is otherwise visibly non-final) during the fetch, and never displays
  "No plan for today" / "DONE" for a day that in fact has a plan. 3. Confirm a genuinely plan-less day
  (a date outside the seeded calendar window) still reads sensibly once loaded — see the root-cause
  note below on why the kicker text itself is also worth revisiting, not just the missing spinner.
- **Root cause guess:** Two compounding issues, both in scope of this file: (a) `NowBar` never guards
  on `loading`, unlike its sibling `DayPlannerWidget`; (b) even after loading, `focusMode`
  (`useTodayPlan.ts:164-166`) is computed purely from `tasks` and does not consult `hasPlan`, so a
  genuinely plan-less day would *also* show kicker "Done" next to "No plan for today" / "Plan today" —
  the same self-contradictory pair, just not transient. Fixing only the loading guard hides the
  transient case but leaves the steady-state contradiction on any real plan-less day.
- **Suggested fix:** Add a `v-if="loading"` branch to `NowBar` matching `DayPlannerWidget`'s spinner,
  and make `focusMode` (or the template's kicker binding) branch on `hasPlan` before falling through to
  `'allDone'` — e.g. a day with `hasPlan === false` should never render the `allDone` kicker at all.
- **Round 2 (mutation pass, 2026-09-15) — root cause found, and it is worse than "narrow window":**
  Reproduced on **3 of 4** fresh sign-ins in this pass (log out → log back in as the same seeded
  account, real plan, 3 real tasks including one `InProgress`), every time with the ordinary local
  backend — no network throttling needed, and the state does **not** self-correct: waited 3+ seconds
  with no further interaction after one reproduction and the false pair was still showing, both in
  `NowBar` **and** in `DayPlannerWidget` (which round 1 credited with guarding on `loading` correctly —
  it does, but that guard only prevents the spinner from being skipped; it does not protect against
  this). Only a full `page.reload()` fixes it. Root cause, read from
  `src/core/home/composable/useTodayPlan.ts:397-521`:
  1. `fetchPlan()` (line 397) captures `token = ++loadToken` at call time, and applies its response only
     `if (token === loadToken)` (line 404) — a stale-response guard, correct in isolation.
  2. `wireLifecycle`'s `watch(() => userStore.currentUser.id, ...)` (lines 512-521) calls
     `resetTodayPlan()` — which itself does `loadToken++` (line 467) — whenever `currentUser.id`
     changes, including the **0 → real-id** transition that happens once `GET /api/user/data` resolves
     after a fresh login (the user store's `id` starts at its empty-user default until that request
     completes).
  3. On login, `GET /api/user/data` and `GET /api/calendar/day-plan/{date}` fire together. Measured
     this pass: `user/data` **140ms**, `day-plan` **524ms** (request #2862/#2864 in this session) — so
     `user/data` resolves first, the id-watcher fires mid-flight of the day-plan request, and
     `resetTodayPlan()` bumps `loadToken` **before** the day-plan response arrives. When it does arrive,
     `token !== loadToken` and `fetchPlan()` silently discards it (the `if (token !== loadToken) return`
     at line 404) — `calendar`/`tasks`/`hasPlan` stay at the reset defaults forever, because nothing
     re-fetches: `resetTodayPlan()`'s caller only re-triggers `ensureLoaded()` `if (hadPlan && id !== 0)`
     (line 519), and `hadPlan` was computed as `planDate.value !== null` **before** the discarded
     response could have set `planDate` — so at reset time `hadPlan` is `false` and the retry never
     fires. On the reload that "fixes" it, the same race exists but resolves the other way — confirmed
     by this pass's own timing: `user/data` took **387ms** on that reload, slower than the day-plan
     fetch, so the watcher fired *after* the response had already applied. This is a coin flip, not a
     fix; it is exactly why round 1 called it "a narrow but real window" without being able to pin down
     why the width varied — the width is the gap between two unrelated requests' response times, and it
     has no reason to be either always-narrow or always-wide.
  4. Cross-account isolation itself is **not** broken by this — verified this pass by switching to
     `test2@example.com`: its own genuinely plan-less day (`hasPlan: false`, confirmed via
     `response-body` on its own `calendar/day-plan/2026-09-15`) rendered correctly with no leaked data
     from the primary account, and switching back to the primary account reproduced the race again on
     its own data, not the secondary account's. H2's user-id-watcher reset is doing its isolation job
     correctly; it is the same watcher's side effect on an in-flight request that is the bug.
- **Round 2 evidence:** `docs/views/home/screenshots/home--mutation-false-empty-state.png` (this
  pass's repro, same pair as round 1's `home--default.png`); request timings in this session — user/data
  #1415 (boot, n/a), #2862 (140ms) vs day-plan #2864 (524ms) for the reproducing login; #2841 (387ms)
  vs day-plan #2848 (n/a, resolved first) for the reload that self-corrected; `response-body 2864`
  confirming the discarded response actually carried `"hasPlan":true` with 3 real tasks at the moment
  the UI still read "No plan for today"; source read of `useTodayPlan.ts` lines 397-521 as cited above.
- **Round 2 verify:** 1. Sign out, sign in again as an account with a real plan for today (repeat up to
  4 times if needed — this is a race, not a guaranteed repro). 2. **Pass condition:** within a couple of
  seconds of landing on `/` post-login, without any manual reload, both `NowBar` and `DayPlannerWidget`
  show the real plan (or, on a genuinely plan-less day, `hasPlan: false` confirmed via the network
  response) — never a `hasPlan: true` response silently discarded. 3. A stronger check for whoever fixes
  it: either make `resetTodayPlan()`'s `loadToken` bump not orphan an in-flight *same-user* fetch (the
  watcher only needs to guard against a genuine user *change*, not the 0→real-id hydration of the same
  session), or have the reset path re-fetch unconditionally rather than gating the retry on `hadPlan`,
  which is untrustworthy at the exact moment it is read here.
- **Round 1's U1 ("widget error/retry states not verified") is now answered, and folds into this
  finding rather than staying separate:** forced `GET /api/calendar/day-plan/**` to 500 via
  `playwright-cli route`. On a plain reload with no sign-in race, both `NowBar` and `DayPlannerWidget`
  correctly show `home.loadFailedPlan`/`home.noCalendar`'s error text and a working **Retry** button
  (`DayPlannerWidget.vue:94-112`'s `v-else-if="error"` branch) — clicking Retry re-fired the request and
  rendered the real plan once the mock was removed. H6's fix is real and correctly implemented. But
  forcing the same 500 **during** a fresh sign-in reproduced a third, worse variant of this exact race:
  `resetTodayPlan()` unconditionally sets `loading.value = true` (line 473) whenever it runs, and if the
  id-watcher fires *after* the failed `load()`'s own `finally` already set `loading.value = false`, the
  reset flips it back to `true` with nothing left to flip it back — `DayPlannerWidget` hangs on its
  `VProgressCircular` **forever**, never reaching the error branch at all, confirmed still spinning after
  reload-free waiting. So H6's error UI is correct and the retry mechanism works; the bug making it
  unreachable some of the time is this finding, not a gap in H6.

### B3. `hideDoneTodoList`/`hideDoneRoutine` never persist, and the reason is a stale claim in CLAUDE.md
- **Status:** fixed and verified (2026-09-23, `F9`, `9e3a9c9e`). `homeUiStore` declares
  `{ persist: { storage: sessionStorage } }`, and CLAUDE.md now says the plugin is opt-in.
- **Severity:** bug
- **Where:** `src/core/home/store/homeUiStore.ts`; conceptually also
  `src/_common/bootstrap/createAppPinia.ts:11` and the "Pinia Stores" persistence claim in the
  repo-root `CLAUDE.md`
- **Expected:** `homeUiStore.ts`'s own doc comment states the design intent plainly: "sessionStorage
  (the app default) is enough: it only needs to survive navigating away and back, not closing the
  browser." H8 (`prompts/_done/home/H8-todo-widgets-signal.md`, item 2) required exactly this: "The
  toggle's state is not persisted anywhere... Use the sessionStorage-backed Pinia default." CLAUDE.md's
  own "`_common/bootstrap/`" section states the same thing as a repo-wide convention: "every store
  persists to sessionStorage unless it declares `persist: false`."
- **Actual:** It does not persist at all. Toggling "Show done" on the to-do widget, confirmed via
  `sessionStorage-get homeUi` immediately after the click (no reload, no navigation), returns
  `sessionStorage key 'homeUi' not found` — the plugin never wrote the key. Toggling, then navigating
  to `/todo-list` and back to `/`, shows the toggle silently reset to its default (`hideDone: true`),
  confirmed both visually (`aria-pressed`/label reverted) and via `sessionstorage-list` showing no
  `homeUi` entry at all, ever, in the session.
- **Evidence:** `sessionstorage-get homeUi` → "not found", captured immediately post-toggle;
  `sessionstorage-list` output showing only `dayPlanner` and `templateDayPlanner` keys, never `homeUi`,
  across the whole session; `node_modules/pinia-plugin-persistedstate/dist/index.js:106-130` — the
  package's default export is `createPersistedState()` called with **no arguments**, so
  `persist = auto` resolves through `options.auto ?? false` to **`false`**. `pinia.use(piniaPluginPersistedstate)`
  in `createAppPinia.ts:11` therefore registers the plugin in **opt-in** mode: a store persists only if
  it explicitly declares `persist: true` or a persist options object, never by default. This is
  independently confirmed by this app's own `dayPlannerStore.ts:277-281`, whose comment already says so
  in as many words: *"Persistence is declared explicitly: the framework's Pinia setup only persists
  stores that opt in, where this app's previous hand-rolled plugin persisted everything to
  sessionStorage by default..."* — i.e. another part of this same codebase already knows the CLAUDE.md
  claim is backwards, `homeUiStore.ts` simply was not written against that knowledge.
- **Repro:** 1. Load `/`. 2. Run `playwright-cli sessionstorage-get homeUi` → not found. 3. Click either
  widget's "Show done"/"Hide done" button. 4. Run `sessionstorage-get homeUi` again → still not found.
- **Verify:** 1. Load `/`, toggle "Hide done" on the to-do widget. 2. **Pass condition:**
  `playwright-cli sessionstorage-get homeUi` returns a JSON blob containing
  `"hideDoneTodoList":false`. 3. Navigate to `/todo-list` and back to `/` — the toggle must still read
  "Hide done" (i.e. showing done items), not have reset to the default.
- **Root cause guess:** `homeUiStore.ts`'s `defineStore('homeUi', () => {...})` call has no third
  argument at all, so it inherits whatever `createAppPinia`'s plugin registration defaults to — which,
  per the source read above, is *not* "persist unless opted out." This is the same class of gap
  `dayPlannerStore.ts` already worked around locally; `homeUiStore` is simply the next store written
  without that context. Given CLAUDE.md is checked into the repo and actively asserts the opposite of
  the installed plugin's behaviour, other stores written against that doc's claim (rather than against
  `dayPlannerStore.ts`'s own corrective comment) are worth a repo-wide check outside this unit's scope.
- **Suggested fix:** Add `{ persist: { storage: sessionStorage } }` as `homeUiStore`'s third
  `defineStore` argument, matching `dayPlannerStore.ts`'s own pattern. Separately — outside this file's
  remit, flagged here because it was discovered in the course of this unit — CLAUDE.md's Pinia
  persistence claim should be corrected or the plugin registration changed to match it; the two
  disagreeing is what let this ship.
- **Round 2 (mutation pass, 2026-09-15):** Re-confirmed open, unchanged. Toggled "Show done" on the
  to-do widget; `playwright-cli sessionstorage-get homeUi` still returns "not found" immediately after
  the click. Also confirmed the toggle resets to its default on an in-app navigation-and-back
  (`/` → `/todo-list` → `/`): both widgets' toggles read "Show done" again on return, not the "Hide
  done" state left before navigating.

### B4. A skipped (`Cancelled`) task renders identically to a completed one in the day-planner widget
- **Status:** fixed and verified (2026-09-22, `F59`, `dfd64a6a`). A skipped row now gets `row--skipped`, a
  dashed checkbox with a restore icon, `aria-pressed="false"` and a *Skipped* chip that shows the reason.
  The checkbox reopens the task to `NotStarted` instead of completing it. The skip reason depended on
  backend `B26`, which landed on 2026-09-23.
- **Severity:** bug
- **Where:** `/` → `DayPlannerWidget`'s task-row checkbox (`src/core/home/component/DayPlannerWidget.vue`,
  the `row row--done` / `check check--on` markup, `aria-pressed`/`aria-label` pair) — found only by
  actually exercising `TaskActionMenu`'s Skip action, one of the mutation pass's required lifecycle
  steps, not by reading source.
- **Expected:** `docs/views/home/inventory.md`'s own reading of this surface (round 1) describes
  "duration, missed/status chips" as part of what the day-planner list shows — i.e. a task's status is
  expected to be visually distinguishable, and the glossary's `PlannerTaskStatus` treats `Cancelled` as
  a distinct terminal state from `Completed`, with its own `skipReason`. A user glancing at the list
  after skipping a task with a stated reason should be able to tell it was skipped, not finished — and
  should not be invited to "un-finish" it via the same checkbox that un-does a real completion.
- **Actual:** After skipping the day's `InProgress` task via `TaskActionMenu` → Skip → "Ran out of
  time" (confirmed via `PATCH /api/planner-task/16002/status` → 204, followed by a refresh that
  returned `PlannerTaskStatus: "Cancelled"` for that task), the row renders with class
  `row row--done`, its checkbox `aria-pressed="true"` and `aria-label="Mark \"Bug Fixing\" as done"` —
  the exact same class and ARIA state a genuinely `Completed` task gets (compare "Morning Exercise",
  `Completed` in the same list, same `row--done`/`aria-pressed="true"` pair). No skip-reason text, no
  distinguishing chip, no strikethrough-vs-checkmark difference — nothing on screen says this task was
  skipped rather than done. The row that *was* visually distinct while the task was `InProgress` (a
  small "In progress" label next to the category) loses that distinction entirely once cancelled,
  rather than gaining a "Skipped" one.
- **Evidence:** `page.evaluate` on the checkbox's `closest()` row after the skip:
  `class="row row--done" ... aria-label="Mark \"Bug Fixing\" as done" aria-pressed="true"` (captured
  live, this session); the `PATCH .../status` response accepted the `Cancelled` status with a
  `skipReason` in the request body (`PatchPlannerTaskStatusRequest(Cancelled, null, null, reason)` per
  `useTodayPlan.ts:302-308`), so the reason reaches the server but nothing downstream of the fetch
  renders it.
- **Repro:** 1. Load `/` on a day with an `InProgress` or `NotStarted` task. 2. Open that task's
  "Actions for" menu (NowBar or the day-planner row). 3. Choose Skip → any reason. 4. Look at the
  day-planner widget's row for that task.
- **Verify:** 1. Repeat the repro above. 2. **Pass condition:** the skipped row is visually and
  semantically distinct from a completed row — different icon/class/colour, and the checkbox's
  accessible name and `aria-pressed` value do not claim the task is "done". 3. Confirm clicking the
  checkbox on a skipped row does something sensible (currently it would call `toggleTaskStatus`, whose
  `isDone` check only recognises `Completed`, so clicking a `Cancelled` row's checkbox sets it to
  `Completed` rather than restoring `NotStarted` — worth deciding deliberately rather than leaving as a
  side effect of the shared toggle).
- **Root cause guess:** The row's CSS class and the checkbox's `aria-pressed`/label are almost certainly
  derived from `isFinished(task)` (`useTodayPlan.ts:125-127`), which is `true` for **both**
  `Completed` and `Cancelled` by design (it is the correct predicate for "no longer needs a countdown or
  an alert") — but `DayPlannerWidget` appears to reuse that same boolean for the row's visual "done"
  styling instead of branching separately on `task.status === Completed` vs `=== Cancelled`.
- **Suggested fix:** Give a `Cancelled` row its own visual treatment (a muted/struck-through style, or a
  small "Skipped" chip showing `skipReason`) distinct from `Completed`'s checkmark, and change the
  checkbox to either hide itself or explicitly restore `NotStarted` for a `Cancelled` row rather than
  advancing it to `Completed`.

### A1. A Vuetify time-input's keystroke-rejected announcement resolves to a raw i18n key
- **Status:** fixed and verified (2026-09-15, `F58`, `f457aa0c`). `common.en.ts` imports Vuetify's own `en`
  export instead of a hand copy that was missing this key and `command.search`.
- **Severity:** a11y
- **Where:** `TrackTimeDialog`'s "Length" field (a Vuetify time-mask input), opened from NowBar's Track
  button, `TaskActionMenu`'s Track item, or the **T** shortcut
- **Expected:** Every user-facing string resolves through vue-i18n to real text in the active locale —
  CLAUDE.md's own Class-2 raw-key defect class, already fixed once for the reminders module this pass
  (`docs/views/_shell` and this repo's runbook both treat a raw key as a bug class, not a one-off).
- **Actual:** Typing a non-numeric character (tested: `f`) into the Length field's masked time input is
  correctly rejected (the field's value did not accept the letter — it read `"07:"` after the
  keystroke, one digit short of before, consistent with the mask discarding the invalid char), but doing
  so logs `[intlify] Not found '$vuetify.timePicker.notAllowed' key in 'EN' locale messages.` to the
  console. The key is not rendered as visible text anywhere on screen (confirmed via `find` for both
  `notAllowed` and `timePicker` immediately after triggering it) — so this is not a Class-2 visible raw
  key, but Vuetify's own a11y contract for this component uses that string for a screen-reader
  announcement of *why* the keystroke was rejected, and a sighted user's console warning is exactly what
  a screen-reader user gets nothing in place of.
- **Evidence:** Console warning captured live: `[intlify] Not found '$vuetify.timePicker.notAllowed' key
  in 'EN' locale messages. @ .../vue-i18n.js:23`; `el.value` on the Length field read `"07:"`
  immediately after the rejected keystroke (`eval "el => el.value"`); `find "notAllowed"` and
  `find "timePicker"` both returned no matches against the rendered page.
- **Repro:** 1. Open the Track Time dialog (Track button, menu item, or **T**). 2. Click into the
  "Length" field. 3. Type a letter, e.g. `f`. 4. Check the console.
- **Verify:** 1. Repeat the repro above with the browser's console open. 2. **Pass condition:** no
  `[intlify] Not found` warning fires for `$vuetify.timePicker.notAllowed` (or any `$vuetify.*` key) in
  the EN locale.
- **Root cause guess:** Vuetify ships this message key as part of its own internal locale bundle
  (`$vuetify.*`), and this app's EN locale file does not include an override or the framework does not
  merge Vuetify's own English default for it — the same shape of gap as the reminders module's missing
  `.en.ts` files (Class 2 in the runbook), but inside Vuetify's own namespace rather than this app's.
- **Suggested fix:** Confirm whether Vuetify ships its own English default for `$vuetify.timePicker.*`
  and, if the app's i18n setup is overriding rather than merging Vuetify's message catalogue, fix the
  merge; otherwise add the missing key to this app's EN (and SK) locale under the `$vuetify` namespace.

### P1. The routine widget's group chips are squeezed until their names clip — "Weekl", "Monthl" (390 px)
- **Status:** open
- **Severity:** polish
- **Where:** @390×844 · `/` → `src/core/home/component/RoutineTodoWidget.vue:65-73`. The group row (`d-flex align-center ga-2 mb-1`) holds the period `VChip`, a `VProgressLinear`, the done/total count and "+N not due today".
- **Expected:** the group's name stays readable. It's the only label telling the user which period's progress bar they're looking at (plain sense).
- **Actual:** at 390 px the widget's group rows give the chip less than its text needs. The chip has `flex-shrink: 1`, `min-width: 0` and `overflow: hidden`, so "Weekly" (text 30–75) gets a 41 px chip (30–71) and "Monthly" (text 30–80) gets 44 px (30–74). They render as "Weekl" and "Monthl". "Daily" fits. The wrapping "+1 not due today" note on the same row takes the space. Not measured at desktop width in this pass. There the widget is `md="6"` (half the row), so the chip has several times the room.
- **Evidence:** `docs/views/home/screenshots/home-routine-widget--mobile.png` (bottom: "Weekl", "Monthl"). A `Range` over each chip's text vs the chip's box, from `eval`.
- **Repro:** 1. `resize 390 844`, open `/`. 2. Scroll the page to the bottom of the "Routine tasks" widget. 3. Read the Weekly and Monthly group chips.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/`. 2. `eval "[...document.querySelectorAll('main .v-chip')].filter(c => /^(Weekly|Monthly)$/.test(c.innerText.trim())).map(c => { const r = document.createRange(); r.selectNodeContents(c); return r.getBoundingClientRect().right - c.getBoundingClientRect().right })"`. 3. **Pass condition:** every value is `<= 0` (the text ends inside its chip).
- **Suggested fix:** `class="flex-shrink-0"` on the chip, and let the "+N not due today" note wrap below the bar instead.
