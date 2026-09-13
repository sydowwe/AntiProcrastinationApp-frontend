# home — findings

> Pass: inventory · captured 2026-09-13 · commit `430e6f03`

**Tally:** blocker 0 · bug 3 · a11y 0 · polish 0 · opportunity 0 · unverified 1

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `430e6f03` | initial inventory pass. All ten `H1`–`H10` prompts (`prompts/_done/home/`) had already landed — verified live, not assumed: real current date in the pie-chart request and the activity-history deep link (H1), route-name fix on "Add to planner" (H1), `resetTodayPlan()`/`effectScope`/day-rollover watcher present (H2), one shared `WidgetCard` shell (H4), due-date chips on to-do rows + persisted-store `hideDone` toggle *attempted* (H8 — see B3), one dashboard-wide refresh coordinator with visibility/day-change/online/interval triggers (H7), NowBar as sole owner of the focus task with `DayPlannerWidget`'s focus block removed (H9). The three bugs below are new, found by driving the browser against real seeded data — none are regressions of a listed H-prompt defect. |

---

### B1. RoutineTodoWidget's header controls are clipped off-screen at a common desktop width
- **Status:** open
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

### B2. NowBar shows a contradictory "Done" + "No plan for today" pair while the plan is still loading
- **Status:** open
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

### B3. `hideDoneTodoList`/`hideDoneRoutine` never persist, and the reason is a stale claim in CLAUDE.md
- **Status:** open
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

---

### U1. Widget error/retry states not verified against a real failure
- **Status:** open
- **Severity:** unverified
- **Where:** All four `WidgetCard`-based widgets' `error`/`errorText`/retry paths
  (`WidgetCard.vue:38-57`), and `DayPlannerWidget`'s own equivalent block
  (`DayPlannerWidget.vue:94-112`) — the client-side half of H6's "every failure renders as an empty
  success" fix.
- **What would verify it:** This pass only observed the happy path (200s throughout) and the
  documented stale-token 401 burst, which resolves itself on refresh rather than surfacing as a
  widget-level error. Confirming H6's fix holds needs a forced 4xx/5xx on one of the six data
  endpoints (a network route override, e.g. `playwright-cli route` returning 500 for
  `todo-list-item/dashboard-widget`) and a check that the affected widget shows its `errorText` +
  Retry button rather than a false empty state, that the other five widgets are unaffected, and that
  Retry actually re-fires the request.
