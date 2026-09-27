# Fix queue

> Built 2026-09-21 · commit `0a174507` **plus the working tree** (the fifteenth pass's queue edits and
> the `B16` frontend half are uncommitted) · **all 15 app units are triaged, every one of them
> through a mutation round** — `_shell`, `home` (1), `activity-settings` (2), `history-review` (3),
> `history-capture` (4), `tracking-dashboards` (5), `tracking-settings` (6), `planner-day` (7),
> `planner-templates` (8), `todo-lists` (9), `todo-routine` (10), `leisure-backlog-picker` (11),
> `leisure-bucket-anchors` (12), `leisure-projects` (13), `user-settings` (14), `auth` (15). Units 16–19
> (`_submodule/`) have not run · findings considered: 200 · batches: 106

> **The sixteenth pass (2026-09-21) absorbed no unit** — no `findings.md` has changed since the
> fifteenth. What it absorbed is **two landed backend asks**: `B18` (`errorType` on every error body,
> API `cd0a252`) whose frontend half was entirely unfiled and is now `FW24` + `F85`, and `B16`, whose
> frontend half is in this repo's working tree while **the API half is still uncommitted there**. It
> also re-read five batches against the current source on both sides of the wire: `F73` and `F74` are
> confirmed and both got worse, `F76`, `F80`, `F81` and `F84` are confirmed as written, and two
> *Needs verification* rows settled from a file read.

> Closed batches, closed verification items, the per-pass narrative and the *Contradictions & re-grades* audit
> trail live in [`_fix-queue-log.md`](_fix-queue-log.md). This file holds only open work.
>
> **Closing an item is a move, not a mark.** Marking a batch ✅ in place and leaving its body here is the
> wrong half of the job. It was done that way on 2026-09-22 and had to be redone. When a batch's fix is
> verified, do all four steps in the same change:
>
> 1. **Move the whole `## Fn.` body to the log**, under *Closed batches*, appended after the last batch
>    there (just above `## Closed escalations`). Keep the heading as it is. Add a
>    `> ✅ **FIXED <date>.**` blockquote directly under the heading. In it, say what changed, what was
>    verified and how, and what was **not** verified. Leave the original body under the note unchanged.
> 2. **Leave a tombstone here** where the body was:
>    `<!-- Fn (one-line title — finding ids) fixed <date> — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->`
> 3. **Mark the summary-table row** `✅ **FIXED <date>** — …` and keep the row. Batch numbers are
>    cross-referenced, so they are never deleted or reused.
> 4. **Escalations (§n) work the same way**, but only once the backend has landed **and** the frontend
>    half (if any) is done. Move the body to *Closed escalations* as `### §n — ✅ RESOLVED <date> (…)`,
>    leave a `<!-- §n … -->` tombstone, strike the § in the *Escalations* table, and move the
>    `prompts/view-docs/backend/Bn-*.md` file into `backend/_done/` with the backend's response appended.
>
> Something found and fixed in the same session without being filed gets no batch number. Record it in
> the log entry of the item it was found under (see §21's day-planner Skip).

> ⚠️ **`leisure-backlog-picker`'s finding ids were renumbered by its round 2 and mean different things now**
> (*Contradictions* §114). Its round-2 rewrite dropped the round-1 round-history row and re-lettered every
> finding, so a `Closes:` line naming that unit is ambiguous unless it says which round. The mapping, once:
> round-1 `X2` → `B1`, `X3` → `B2` + `B3`, `B1` → `B5`, `P1` → `P1 (round 1)`, and round-1 `X1` and `P2`
> are **gone from the file without a retest note**. Every reference to this unit in the queue below is
> tagged `(round 1)` or `(round 2)`. No other unit renumbered; this is the only one that needs the care.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F1 | ✅ **FIXED 2026-09-23** (`576df526`) — `defaultSortBy` on `projectFilterUrlState()`, plus a `view` re-check on every settled navigation (`route.fullPath`), because a same-tick replace *cancels* ours rather than overwriting it. Verified both `Verify:` cases, including the `sortBy`-preset one that half 1 alone still failed. Body in the log — View-mode toggle loses `view=table` to a URL-write race | app | `leisure-projects/B1` | med |
| F2 | ✅ **FIXED 2026-09-23** (`273d327b`) — one fetch: the board reads `useServerTable`'s own `items` at `itemsPerPage` 200, and `loadBoard` is gone. Reproduced first (two POSTs, one `ERR_ABORTED`); verified one POST per action in both modes, 0 aborts, the error branch and retry. Body in the log — Board mode fires two grid requests through one `AbortController` | app | `leisure-projects/B2` | med |
| F3 | ✅ **FIXED 2026-09-13** — `ActivityInfo` reads `icon`/`color` flat; the API nests them under `activity.category` / `activity.role` | app + framework | `leisure-projects/B3` | low |
| F4 | ✅ **FIXED 2026-09-22** (with `F56`, `F65`, `F71` — one naming convention across the four modules) — the convention is set here and stated in the template: a `VIcon` with no click handler renders `aria-hidden="true"` (Vuetify's own markup), so an `aria-label` on it would never reach the tree; the glyph stays decorative and a `d-sr-only` sibling carries the column's own meaning (`leisure.a11y.messy` / `notMessy`, not `general.yes`/`no`). The board card's `broom` icon got the same treatment. Verified live on `/leisure/projects` — the Messy cell reads *"Messy"* in the snapshot | app | `leisure-projects/A2` | low |
| F5 | ✅ **FIXED 2026-09-23** (`cfe9e5be`) — inactive buttons are outlined `neutral-600`: measured 4.71:1 light, 7.38:1 dark (`textMuted` tried first, only 3.0:1 on the light theme's `#CCC`). Body in the log — Inactive readiness-status buttons are invisible (non-text contrast) | app | `leisure-projects/A3` | low |
| F6 | ✅ **FIXED 2026-09-23** (`be6aef84`) — attribute deleted at all four call sites; warnings 4–5 → 0 per view, and the panel's box is pixel-identical at 1440 and 390 px. Note: the framework logs Vue warnings at *info*, so `console warning` reads 0 even while it fires. Body in the log — Dead `class="flex-1-1"` on four `FilterPanel` call sites logs a warning per render (**reconfirmed** by unit 13's round 2) | app | `leisure-projects/P1`, **`leisure-backlog-picker/P1 (round 1)`** | low |
| F7 | ✅ **FIXED 2026-09-23** (`e3271007`) — the period chips get their own zero-basis scroller (above `md`), so nothing else in the header shrinks. The buttons are back inside the card at every width, and the title, which had been squeezed to 0 px (unfiled), shows in full. Body in the log — `RoutineTodoWidget`'s header controls are clipped off-screen | app | `home/B1` | low-med |
| F8 | ✅ **FIXED 2026-09-22** — **Rewritten (round 2):** a sign-in race orphans the day-plan fetch — `useTodayPlan`'s user-id watcher bumps `loadToken` on the `0 → id` hydration, the in-flight response is discarded, nothing re-fetches, and NowBar/DayPlannerWidget stay on "No plan for today" (or spin forever if the fetch failed); the original NowBar loading gap rides along | app | `home/B2` (+ settles `home/U1`) | med |
| F9 | ✅ **FIXED 2026-09-23** — `persist: { storage: sessionStorage }` on `homeUiStore`; CLAUDE.md now says the plugin is opt-in, in both places. Verified. Body in the log — `homeUiStore` never persists, and CLAUDE.md says the opposite of what the plugin does | app + docs | `home/B3` | low |
| F10 | ✅ **FIXED 2026-09-15** — No skip-to-content link | app | `_shell/A3` | low |
| F11 | ✅ **FIXED 2026-09-13** — Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list` | app | `_shell/P1` | low |
| F12 | ✅ **FIXED 2026-09-22** — `flex-fill` on both `*MappingsTable.vue` roots (and the Android `VCardText`, for parity with desktop), `class="flex-1-1" style="min-height: 0"` on the `BasicTable`. Verified both platforms: `.v-table__wrapper` 494 px, `elementFromPoint` at the edit button's centre resolves to the button, a normal click on *edit* lands on `distinctEntries` with the form filled. Not re-checked: the 25+-row scroll case — Mappings body has zero height — the row exists but is inside a 0 px scroll box (**round 2 re-confirmed**, plus a `focus()` + Enter path that works — consistent with the scroll-box cause, not with a paint bug) | app | `tracking-settings/X1` | low |
| F13 | ✅ **FIXED 2026-09-22** — the view passes its pattern `filter` down and its Filter button reloads whichever tab is mounted; the table builds the grid filter from that pattern plus its own controls, copying the picked activity (only for type *Activity*; `isIgnored` only for *Ignored*); a narrow `watch` on type/isActive/isIgnored/activityId refetches; `@onDelete` → `deleteEntity` → re-`load()`; `deleteConfirmationColumn="patternLabel"`, a getter on both response DTOs (first non-null pattern). The Mappings tab link carries the pattern too. **Unfiled, fixed in passing:** both `Tracker*MappingResponse.fromJson` called `ActivityFilterFormResponse.fromJson(null)` for an ignored rule and threw, so any page holding one failed to parse. Verified desktop (pattern, Activity picker and type each reach the request body; the dialog reads *"…delete f72-ignored.exe?"*, `DELETE` 204, row gone); Android checked for layout and row render only — Mappings tab: no filter control reaches the grid, and the delete button reaches nothing (**grown**: the dead delete is now `X4`, observed on both platforms; the raw-id confirmation `B7` is one `deleteConfirmationColumn` attribute on the same tag) | app | `tracking-settings/B1`, **`X4`**, **`B7`** (+ `U1`, now confirmed) | med |
| F14 | ✅ **FIXED 2026-09-23** (framework `a29135a`, app `baf167ac`). The data fix as written (family paths + two redirects) fixed every crumb but left the tracking-settings tabs with **no** sidebar highlight, because a group's `isChildActive` let any matching sibling suppress a child. The framework fix makes the longest prefix win, and it also restored `/day-planner/templates/:id`. Body in the log — Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path | app **+ framework** | `tracking-settings/B2`, `activity-settings/B6` | low |
| F15 | ✅ **FIXED 2026-09-22** — Distinct-entries filter, page and sort are not in the URL (`useCoverageUrlState` grew into `useDistinctEntriesUrlState`, the whole filter through the handler shape; page/perPage/sortBy through the framework's `useTableUrlState` in the two tables. The Mappings tab's half landed with `F13`: `type`/`isActive`/`isIgnored`/`activityId` and page/perPage/sortBy through `useTableUrlState`'s filter overload (`mappingsControlsToParams`), defaults write nothing; `defaultSortBy` already holds `BasicTable`'s first column so its mount-time push writes nothing either — a bare Mappings URL stays bare on load; `type=Ignored` survives a reload) | app | `tracking-settings/B3` | med |
| F16 | ✅ **FIXED 2026-09-21** (folded into §19's frontend half — `flex-wrap` on the header, `flex-shrink: 0` on the tab toggle, both views; verified at 1440×900, body in the log) — Settings header row clips its labels at 1440 px | app | `tracking-settings/B4` | low |
| F17 | ✅ **FIXED 2026-09-23** — "every *preference* settings page", with `moduleSettingsLinks.ts` named as owner. Body in the log — CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means | docs only | `tracking-settings/P1` | trivial |
| F18 | ✅ **FIXED 2026-09-15** — the mount-time combobox rebuild wrote back into the activities filter, wiping URL ids and double-firing the grid; the two deep watchers are replaced by `@update:modelValue` handlers, so a rebuild is now a pure derivation, and an empty selection normalises to `null`. Verified live including the tab-switch case; **`U4` retested and closed with it**. Body in the log | app | `activity-settings/B2`, `B3` (+ closed `U4`) | med |
| F19 | ✅ **FIXED 2026-09-23** (`9e93fda5`). Roles: delete disabled whenever `canDelete` is false, with the reason (system role / in use, with count). Categories: always deletable, and a delete of a used category confirms and states how many activities lose it. The trash button is named, the raw-id dialog is gone. Verified on throwaway rows, SetNull path end to end. Body in the log — Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it (**grown**: the generic dialog's raw-id copy, `B8`, goes with the generic dialog) | app | `activity-settings/B7`, `A1`, **`B8`** (+ `U2`, now browser-confirmed) | med |
| F20 | ✅ **FIXED 2026-09-15** (`NotFoundView` app-side, `migration-revision.md` §14) — No catch-all route — any unknown URL renders a blank main area | app | `activity-settings/B5` | low |
| F21 | ✅ **FIXED 2026-09-23** — header "Roles in use"; column key still `role`. Verified, sort included. Body in the log — Categories table's "Role" column is a comma-joined aggregate presented as a single value | app | `activity-settings/P1` | low |
| F22 | ✅ **FIXED 2026-09-23** — `flex-wrap` + combobox `min-width`, **and** `flex-0-0` on `VTabs` (the body's fix alone clipped the Categories tab). Verified by screenshot. Body in the log — Activities filter bar clips the "Categories" label | app | `activity-settings/P2` | low |
| F23 | ✅ **FIXED 2026-09-23** (docs only, uncommitted) — runbook *Parallelism* rewritten as three questions (`-s=` always; one signed-in state per session; suspect a reseed when a row vanishes). The template makes `-s=<unit-name>` mandatory, and CLAUDE.md adds the `/auth/refresh`-401 line and a *Name your session* paragraph. Body in the log — Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens (**grown**: nor the unnamed `default` browser session, nor a mid-pass reseed) | docs only | `activity-settings/U3` (+ `todo-routine` round-5 environment note) | trivial |
| F24 | ✅ **FIXED 2026-09-14, verified in SK + no-reload EN switch** (uncommitted) — Routine components format dates through the browser's locale, not the account's — 8 `toLocaleDateString(undefined, …)` calls in 5 files | app | `todo-routine/B10` | low |
| F25 | ✅ **FIXED 2026-09-14, verified** (*Farba* in SK, *Color* in EN; uncommitted) — `/routine-settings` "Color" column header is the capitalized raw key — the title is `''` and the framework fills it in | app | *(unfiled — `todo-routine/B4`'s round-5 verification note)* | trivial |
| F26 | ✅ **FIXED 2026-09-23** — `.myAlert { flex: 0 0 auto }`, inline `max-width` dropped. Verified by screenshot (no-baseline branch). Body in the log — Period-total banner is a `flex: 1 1` (basis `0%`) item — it never has a size to wrap on, so it is squeezed to ~62 px instead of dropping to a new line | app | `history-review/B1` | trivial |
| F27 | ✅ **FIXED 2026-09-23** (`f42b3b3a`) — per-panel error + Retry on Summary, Detail, timeline and calendar; seven reads `_silent`. Two defects found on the way fixed under it (detail fired every request twice — `timeTo` 23:59 → 00:00; a "1 Jan" label on single-day empty bars, `8c809cf2`). Body in the log — History dashboards have no error state: three fetch owners null or **keep** their data on failure and every panel renders "No data for this period" — the pattern is already built in `useActivityDashboard` | app | `history-review/B2` | med |
| F28 | ✅ **FIXED 2026-09-23** — `useSetBreadcrumbExtra` with `history.detail.title`. Verified. Body in the log — `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer | app | `history-review/B3` | trivial |
| F29 | ✅ **FIXED 2026-09-22** (with `F30`, `F49`, `F78` — one clickable-`div` convention) — `StackedBarColumn` carries a localized `aria-label` (`activityTracking.stackedBars.barLabel`: name, total duration, window range) on every dashboard; where the consumer binds `@activityClick` it passes the new `interactive` prop and the bar is `role="button"` + `tabindex="0"` + Enter/Space, named *"View details for …"* via the domain card's key; unbound (Detail) it is `role="img"` with no pointer. Verified live: Tab + Enter on `/activity-history` drilled to Detail with the bar's date; Detail's bars are `img`, cursor `auto`; `/activity-tracking/unified` Enter set `?selected=`. SK label checked | app (`activityTracking/component/stackedBars/`, shared per `migration-revision.md` §7) | `history-review/A1` | low-med |
| F30 | ✅ **FIXED 2026-09-22** (with `F29`) — `historyDashboard.summaryCards.viewDetails` now reads *"Highlight {name} in the chart"* / *"Zvýrazniť {name} v grafe"*, the card carries `:aria-pressed="selected"` and `@keydown.enter.space.prevent` to the same emit. `activityTracking`'s card untouched. Verified live: Enter toggles `aria-pressed` true → false, both locales | app | `history-review/P1` | low |
| F31 | ✅ **FIXED 2026-09-23** — a pixel layout from the measured width: a side legend sized to its widest entry, or stacked (`isNarrow`, or under ~364 px) with the chart growing to fit, and a paged legend past what fits. Names truncated by pixels, the `%` never cut, colours from the theme. Verified by screenshot at 1024/1440/1920 plus a mocked 12-group body; the dark theme was not checked. Body in the log — Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas; `isNarrow` is a dead prop | app | `history-review/P2` | low-med |
| F32 | ✅ **FIXED 2026-09-23** — header row with `<h1>` + Summary button; grid `flex-fill`/`min-height: 0`. Verified by screenshot. Body in the log — `/activity-history/calendar` has no `<h1>`, unlike its two siblings | app | `history-review/P3` | trivial |
| F33 | ✅ **FIXED 2026-09-21** (with the `configured` branch `B14` added, same commit) — Google Calendar connect never sends the OAuth `state` the server's validator requires — the client half of `B1`, unobservable only because the server half breaks the flow one step earlier | app | `user-settings/B1` (client half; server half is §9) | low |
| F34 | ✅ **FIXED 2026-09-21** (one token, in the `F33` commit — same card, not `FW8`) — Google Calendar card's "Disconnect" is `error` on an elevated button — the app-side twin of `P1`, on the very row the unit compared against | app | *(unfiled twin of `user-settings/P1`)* | trivial |
| F35 | ✅ **FIXED 2026-09-15** (merge chosen) — `dateTime.secondsShort` renders raw on every running clock — and `general.from`/`general.to` on every `TimeRangePicker` in range mode: the app-side `common` mirror is written per consumer, has leaked four times, and should become the deep-merge `SK.ts` already does for `user` | app (`src/locales/`) + CLAUDE.md | `history-capture/B1` (+ two unfiled twins) | low (decision: merge vs. patch) |
| F36 | ✅ **FIXED 2026-09-24** — `allowedMinutesSelected="1"` on all eight tags, as written. Verified live: `0007` stays `00:07` in all eight fields, and *Short Sprint*'s 3-minute break re-enters as `00:03`. A 7-minute countdown schedules its alarm 7 minutes out. The menu half rests on source only. Body in the log — Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take the framework's time-of-day default; the server's own *Short Sprint* preset (3-minute rest) cannot be re-entered through the client | app | `history-capture/B2` | low |
| F37 | ✅ **FIXED 2026-09-23** — `#close` → a `v-if="editMode"` `#append` slot with the 16 px pencil, `pr-4` dropped, and `role="button"` on both chip rows. The draft spec's span locators became `getByRole('button', { name: '15m' })`. Verified live: 0 close buttons, the pencil opens the editor on both rows, and Tab lands on the chip. Body in the log — Preset chips define `#close` without `closable`, so Vuetify renders a live, always-present "Close" button that hides the chip client-side — and in edit mode the pencil *is* that button, so clicking it never opens the editor | app | `history-capture/B3` (+ unfiled inventory `A1`) | low |
| F38 | ✅ **FIXED 2026-09-15** (exactly three, as predicted) — Leftover `console.log` in `TimerPresetsSection.vue` — and two more app-side; `no-console` is configured `off` with an allow-list, which is why lint did not catch any of them | app + `eslint.config.ts` | `history-capture/P1`, **`planner-templates/P2`** | trivial |
| F39 | ✅ **FIXED 2026-09-23** (`7a612d7f`, with `FW11`'s bump. Body in the log) — The auth guard's redirect drops the destination — `router.ts:98` returns `{ name: 'login' }` with no `redirect` query, while the interceptor's own forced-logout path already writes one | app (`src/router.ts`) | `auth/B1` (write half; the read half is `FW11`) | trivial |
| F40 | ✅ **FIXED 2026-09-15** — Logging out fires `GET /routine/settings` and logs a 401 — `resetAppState()` *creates* `routineReviewStore`, the Pinia plugin calls `ensureLoaded()` on creation, and the load has no signed-out guard and no `catch` | app (`src/core/todoList/store/routineReviewStore.ts`) | `auth/P2` | low |
| F41 | ✅ **FIXED 2026-09-22** — `DayPlannerSettingsView`'s tabs stack — `d-flex` on two `VTabsWindowItem`s is `display: flex !important`, which beats the inline `display: none` Vuetify's `v-show` sets on an inactive item | app | `planner-day/B1` | trivial |
| F42 | ✅ **FIXED 2026-09-22** — `/day-planner/settings` active tab is not in the URL — a `?tab=` query, absent for the default, through the new `dayPlanner/composable/useQueryParamRef.ts` (one ref ↔ one param, validated on read, `router.replace`, writes from one tick merged) | app | `planner-day/B6` | trivial |
| F43 | ✅ **FIXED 2026-09-22** (malformed date → today in place, a *Day not available* alert for an unprovisioned one, the watcher steps back to the loaded day; body in the log) — `/day-planner/:date` with a malformed or unprovisioned date: two unguarded calendar fetches (`onMounted`'s `Promise.all`, and `useDayNavigation`'s `viewedDate` watcher) leave a blank header, an unhandled rejection and — on the second — a header for the *previous* day under the new URL | app | `planner-day/B5` (date half; the task half is settled, no defect) | low |
| F44 | ✅ **FIXED 2026-09-23**, in `FW16`'s pointer-bump commit — Calendar "Days to show" and the Range/Duration configuration do not round-trip in the URL. `days=`, `range=duration&anchor=&from=&unit=&qty=`, `range=range&from=&to=`, `month` only in month mode, each absent at its default; hydrated at setup and validated field by field. `useCalendarUrlState` now has **one writer** for every key it owns (push only when `month` changed). Surfaced `F86`. Body in the log | app (**after `FW16`**) | `planner-day/B3` (app half) | med |
| F46 | ✅ **FIXED 2026-09-23** — all four close buttons on `pieChart.closeDetails` (`F47`'s key; `closeDomainDetails` retired), web icon `fas fa-xmark`, desktop named; `B1`/`A2` specs un-`fixme`d and passing. Was: The pie-chart detail panel's close button was hand-rolled three times and drifted: `mdi-close` in a FontAwesome-only app on the web panel (blank square + console error), no accessible name at all on the desktop panel, and a "Close domain details" label on the unified panel whose items are domains, products *and* apps — one shared key, one identical button | app (`src/core/activityTracking/component/`) | `tracking-dashboards/B1`, `A2` | trivial |
| F47 | ~~Selecting an app on `/activity-tracking/android` opens no detail — the side panel has no branch on `selectedAppLabel`~~ **✅ landed 2026-09-21**, folded into `B23`'s frontend half (§18): `AndroidAppDetailsPanel.vue` renders the three instant rows and, under them, the per-app figures `B23` put on the wire — so the *"session count"* half of `B2`'s original pass condition is met too. The close button uses the `pieChart.closeDetails` key `F46` prescribes; `F46` moved the other three onto it on 2026-09-23 | app | ~~`tracking-dashboards/B2`~~ (fixed) | low |
| F48 | ✅ **FIXED 2026-09-23** — `ActivityPieChart` `showViewMode` (Android passes `false`); the timeline's *Background* legend entry derived from non-empty secondary lanes; *Split* kept (it splits time, not lanes). Was: The Android dashboard renders two controls for an Active/Background split its source does not have: the pie's Total/Active/Background radio is a **no-op** (`pieSegments` reads only `totalSeconds`; the DTO has no split), and the timeline's Active/Background legend labels a lane that is always empty | app | *(unfiled — source-certain + `tracking-dashboards.draft.spec.ts:103-105`'s own observation)* | low |
| F49 | ✅ **FIXED 2026-09-22** (with `F29`) — roles and states through attrs at every call site: range presets `radiogroup` "Date range" + `radio`/`aria-checked`; source chips `button` + `aria-pressed`; todo priorities `group` "Priority" + `checkbox`/`aria-checked`, due pair `radiogroup` "Due" + `radio`, *Clear filters* `button`; repeating-task day / date / day-type chips `button` + `aria-pressed` (inline `cursor: pointer` dropped — `v-chip--link` sets it); duration chips in a `radiogroup` "Duration" as `radio`s. Second tier (six action chips incl. `ExperiencedCell`, `MemoryAnchorTable`, `NowBar`) got `role="button"`. Arrow keys deliberately not wired. Verified live on `/activity-tracking/unified`, `/todo-list/13001`, both planner dialogs | app (`activityTracking`, `todoList`, `dayPlanner`, `leisure`, `home`) | `tracking-dashboards/A1`, `leisure-backlog-picker/A1 (round 2)` (+ the unfiled twins) | low-med |
| F50 | ✅ **FIXED 2026-09-23** (`2bf99399`, after `FW18`, so no interim workaround) — both fan-outs keyed by template id, `:hasConfirmBtn="false"`, and the pair renders only once both templates are loaded. Verified live: two GETs and two filter POSTs, all 200, none aborted, on open and reopen; only *Cancel* renders. Body in the log — The Compare Templates dialog is empty every time — **two** unkeyed `Promise.all` fan-outs from one api instance (`fetchById` ×2, then `fetchFiltered` ×2), each cancelling its own sibling; the finding's fix closes only the first; folds `B3`'s dead *Confirm* button (`:showConfirmBtn` is not a `MyDialog` prop), same file | app (`TemplateComparisonDialog.vue`) | `planner-templates/X1`, `B3` | low |
| F51 | ✅ **FIXED 2026-09-23** — landed unannounced in `fcd8050d` (the `F42` commit); verified at 390 and 1024 on both planners. The not-found alert's missing toggle fixed in `bd16953c`. Body in the log — The template planner's side panel at `<md` is the **open** panel squeezed to 400 × 16 px and pushed off-screen — not a broken "opened" state — and the template planner has **no control that reopens it** once the X is tapped (`panelOpen` is only ever set `false`); the shell is shared with `/day-planner/:date`, whose mobile layout is a different, unchecked shape | app (`PlannerSidePanelShell.vue`, `TemplateDayPlannerView.vue`, `TemplatePlannerHeader.vue`) | `planner-templates/X2` (+ the inventory's misread "collapsed pill") | med |
| F52 | ✅ **FIXED 2026-09-23** (CSS half unannounced in `fcd8050d`; this session dropped the switch's visible label for `aria-label` *"Active: {name}"* — with it the name was left two letters; body in the log) — Template card title row: the name never truncates, so the Active/Inactive switch label wraps one letter per line and the day-type chip hard-clips to "Wee" / "Workd" on every card at 1440 px | app (`TemplateCard.vue`) | `planner-templates/B1` | low |
| F53 | ✅ **FIXED 2026-09-23** (a)–(c) unannounced in `fcd8050d` — `Workday` default, `requiredRule` on name and day type, native `maxlength` 100/500, `validate()`'s `.valid` read, save inside `onConfirm`; this session added the `catch` so a rejection no longer escapes to Vue's error handler. Verified live incl. a routed 400 on *Update*; body in the log — The template form mirrors none of the API's contract: `suggestedForDayType` is `required` server-side and `?:` client-side (400 after the dialog has closed, input lost), and `Name` `[Required]`/100, `Description` 500, `Icon` 50 have no rule either — `form.validate()` validates nothing. **Round 2 read the form end to end and confirmed the batch as written** (zero `:rules` on any of the five fields; an empty `name` reached the wire unchallenged) — the batch does not grow, it just stops being an inference | app (`TaskPlannerDayTemplateRequest.ts`, `TaskPlannerDayTemplateDetailsForm.vue`) | `planner-templates/B2` (broadened in round 2) | low |
| F54 | ✅ **FIXED 2026-09-22** — Template list sort and the split view's two picks are not in the URL — `?sort=` on the list, `?left=`/`?right=` on the split view through `useQueryParamRef`; the split ids hydrate after the options load and an unknown or duplicated id is scrubbed from the URL, never sent to the grid | app (`TemplateListView.vue`, `TemplateSplitView.vue`) | `planner-templates/B4` | low-med |
| F55 | ✅ **FIXED 2026-09-22** (copies `F43`'s treatment — store reset + a *Template not found* alert; body in the log) — `/day-planner/templates/:templateId` with an unknown id keeps the **previous** template's name in the header — and, because the store persists `templateName` to `sessionStorage`, across a reload too; `loadTemplateDetails` has no `catch` at either of its two call sites (the `F43` shape, template side) | app (`TemplatePlannerPanel.vue`, `templateDayPlannerStore.ts`) | `planner-templates/B5` | low |
| F56 | ✅ **FIXED 2026-09-22** (with `F4`) — all seven named from `planner.a11y.*`: pin/unpin by `isPinned` with the template name, compare checkbox *"Select {name} for comparison"*, panel close/open shared by both shells and the mobile `bars` toggle (by `panelOpen`), split view *"Back to templates"*, and both undo buttons through an `undoLabel` computed that folds the count in (*Undo (2)*) so the badge stops being the name. The compare checkbox's second half is fixed at the cause: the sibling template `VIcon` is decorative and now `pointer-events: none` (plus `flex-shrink-0 me-1`), so a direct click lands. Verified live: `getByRole('checkbox', { name: 'Select Home Office for comparison' }).click()` checks it with no intercept; pin/back/undo/panel names all resolve, the last two at 390 px. *Undo (n)* itself was not exercised — it needs a planner mutation | app (`src/core/dayPlanner/`) | `planner-templates/A1`, `A2`, `A3` (re-identified), `U3` (settled from source) + three unfiled | low |
| F57 | ✅ **FIXED 2026-09-23**, unannounced in `fcd8050d` — a wrapping class with `height: auto` (bare `flex-wrap` squeezed two rows into one), applied to the dialog branch too because Sunday clipped there as well; verified live in panel and dialog, body in the log — The Scheduled Days picker is clipped to Mon–Fri in the 400 px template panel — `DayOfWeekPicker` cannot wrap and the panel is the only place it renders without a dialog's width | app (`TaskPlannerDayTemplateDetailsForm.vue`) | `planner-templates/P1` | trivial |
| F58 | ✅ **FIXED 2026-09-15** — The app's EN `$vuetify` block is a 180-line hand copy of Vuetify's own `en` export, byte-identical except for **two missing keys** (`timePicker.notAllowed`, `command.search`) — replace the copy with the import | app (`src/locales/common.en.ts`) | `home/A1` (+ one unfiled key) | trivial |
| F59 | ✅ **FIXED 2026-09-22** — A skipped (`Cancelled`) task renders as done in `DayPlannerWidget` — row class, `aria-pressed` and the checkbox label all key off `isFinished`, which is `Completed ∨ Cancelled` by design; and the checkbox on a cancelled row advances it to `Completed`. Surfaced a backend gap (the status PATCH dropped `skipReason`) — §21 / `B26`, landed and verified 2026-09-23 | app (`DayPlannerWidget.vue`, `useTodayPlan.ts`) | `home/B4` | low |
| F60 | ✅ **FIXED 2026-09-15** — `MemoryAnchorFilter` sent `year`/`month` while the server reads `anchorYear`/`anchorMonth`; the two wire fields are renamed and the URL keys stay `year`/`month`, so bookmarks survive. Verified live across seven filter URLs. The timeline's twelve-month check is still blocked by `F61`. Body in the log | app (`MemoryAnchorFilter.ts`, `MemoryAnchorsView.vue`, `leisureFilterUrlState.ts`; its test needed **no** change, and that is the bookmark pin) | `leisure-bucket-anchors/B1` (the two of five cases the client owns; the other three closed with ~~§13~~ `B11`) | trivial |
| F61 | ✅ **FIXED 2026-09-21** (same session as `F79`) — `LADDER_PAGE_SIZE` and `TIMELINE_PAGE_SIZE` are 200 with `ProjectsView`'s comment, both loaders `catch` into a `failed` flag (cancellations excluded via `isRequestCanceled`), and the ladder, timeline **and** board render a distinct *load failed* + *Try again* branch through the new `LeisureEmptyState`. Verified live: both grids 200, the seeded row on rung 3, July and August 2026 shaded; a routed 500 shows the error branch and *Try again* recovers. Body in the log | app (`BucketListView.vue`, `MemoryAnchorsView.vue`, `ProjectsView.vue` (board `catch` only), `component/LeisureEmptyState.vue`) | `leisure-bucket-anchors/X1`, `X2` | low |
| F62 | ✅ **FIXED 2026-09-15** — `NewMemoryAnchorForm`'s `onMounted` awaits the eligible-activities fetch with no `try/finally`, so any failure leaves the spinner on forever and the "no eligible activities" fallback unreachable — today *every* call fails, because the endpoint does not exist (§12) | app (`NewMemoryAnchorForm.vue:107-112`) | `leisure-bucket-anchors/X3` (frontend half) | trivial |
| F63 | ✅ **FIXED 2026-09-21** (same session as `F77`, `F63` first per its ordering constraint) — all eight lookup ids are `number | null = null` on the four DTOs, `MemoryAnchorForm` passes `presetActivityId` through. Verified live on `/leisure/backlog`: the fresh *Add* dialog renders the three selects empty, not "0", and an untouched *Create* shows the required message and fires no `POST`. Body in the log | app (`ActivityBacklogProfileRequest.ts`, `ActivityBucketListProfileRequest.ts`, `MemoryAnchorRequest.ts`, `ActivityProjectProfileRequest.ts` + their forms) | `leisure-backlog-picker/B2` (round 2 — round 1's `X3`, the `0` half), `leisure-bucket-anchors/B2` (`0` half), **`leisure-projects/B5`** | low-med |
| F64 | ✅ **FIXED 2026-09-23** (with API `e50bd3c`). An empty set collapses to `null` in `fetchTodayFit`. The backlog row carries `weatherDependencyCode`, and `realWeatherDependencyId` keeps *None* and unrecognised rows out of the exclusion, the bonus and both badges. Verified live in both halves; a real sunny/dry/snow row was not checked end to end (no seed row). Body in the log. Was: The picker reads an empty `matchingWeatherDependencyIds` as "nothing fits" and excludes every weather-tagged backlog entry — the server's own contract says empty means "no opinion, exclude nothing"; and the API file's comment still says the endpoint is unimplemented. **Round 2 narrowed the headline and added a second symptom:** the excluded row's dependency is the *"None"* lookup, so the batch must not hard-exclude *or* badge it, and a mocked non-empty match produced the reason chip *"Good weather for this today"* on an indoor activity | app (`useLeisurePicker.ts:250`, `leisureScoring.ts`, `leisureWeatherApi.ts`) | `leisure-backlog-picker/B1` (round 2 — round 1's `X2`), `P2` (round 1) | low |
| F65 | ✅ **FIXED 2026-09-22** (with `F4`) — `:aria-label` beside every `:title`, same key, `:title` kept as the sighted user's tooltip. Two deliberately carry more than the key: the year menu is *"Pick a year: 2026"* (a bare key would replace the visible year in the name) and the source/experienced chips and the two row-scoped delete buttons append the row (*"Delete: Learn Bouldering"*, *"Open where this came from: Bucket List"*), matching `TodoListCard`'s existing `action: name` shape. Verified live on all three views, the timeline and the ladder | app (`src/core/leisure/`) | `leisure-bucket-anchors/A1` (app half, re-graded `polish`) | trivial |
| F66 | ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90` — `falseIcon` is now required; the four sites pass `circle-xmark` / `plane-slash` / `soap`. Verified live on bucket list, backlog and projects, ✓ and ✗. Body in the log) — `boolChip`'s `falseIcon` defaults to `trueIcon`, and four of five call sites pass one icon — a `✗` chip wears a check | app (`useLeisureFilterChips.ts:19` + call sites) | `leisure-bucket-anchors/P1` | trivial |
| F67 | ✅ **FIXED AND VERIFIED 2026-09-15** (`useSessionLength.ts` — one rounding rule and one discard-with-message for all three capture views, plus the pomodoro's rest record; body in the log) — A session that rounds to zero minutes was handled three different ways by the three capture views, and none of them told the user | app (`src/core/activityHistory/`) | `history-capture/B4`, `B5` (+ the stopwatch twin) | low |
| F68 | ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90` — a `saving` gate + `:loading`; after a successful save "when" advances to the end of the span, length clears, activity stays; a failed save no longer emits `saved`. Verified live: `dblclick` → one POST 201, second save → 201 with a later start. The two check records were since removed by another session's reseed. Body in the log) — The manual-entry form fires one `POST` per click while the first is in flight, and never resets — so a second click is a `409` from the unique index, and so is *every* re-submit of an unchanged form after a success | app (`AddActivityManuallyView.vue`, `AddActivityManuallyForm.vue`) | `history-capture/B6` (was `U1`) | low |
| F69 | ✅ **FIXED AND VERIFIED 2026-09-23** (`723c48ec` — `deleteItem()` asks `shouldConfirm({ cascades: false, undoable: true })` and confirms via `useDialog().confirm()`; the undo entry stays. Verified live on both lists with the preference on (dialog; Cancel → no `DELETE`; Delete → 204 + *Undo*) and off (no dialog, 204 + *Undo*). CLAUDE.md row counts seven sites. Body in the log) — Deleting a to-do item never confirms, whatever `askBeforeDelete` says — `useUndoableListCrud.deleteItem` was never one of P3's five sites and bypasses `useDeleteConfirmation`; the routine list shares the composable | app (`src/core/todoList/composable/useUndoableListCrud.ts` + its two views) + CLAUDE.md row | `todo-lists/B7` (+ the unfiled routine twin) | low |
| F70 | ✅ **FIXED AND VERIFIED 2026-09-22** (`1bb9ae06` — `PATCH …/{id}/move` + `{ destinationListId }`; live 204 and the item lands in *Errands* under the same id; new `todo-lists.spec.ts` test covers the move and the foreign-list 404. The close-then-call shape is noted in the commit, not fixed. Body in the log) — *Move to list* has 404'd since the day it was written — the client calls `PATCH /move/{id}/{dest}` against a server route that has been `PATCH /{id}/move` + `{ destinationListId }` since 2026-05-15 | app (`todoListItemApi.ts:104-112`) | `todo-lists/B8` | trivial |
| F71 | ✅ **FIXED 2026-09-22** (with `F4`) — `toDoList.markDone` / `markStepDone` minted in this module (not imported from `home`), bound as `aria-label` on both `VCheckboxBtn`s; Vuetify's `filterInputAttrs` puts them on the `<input>`, so they are the control's name, not the wrapper's. The step key interpolates `step.name` (the queue said `step.text`; the field is `name`). Verified live on `/todo-list/13001` — six item checkboxes and three step checkboxes resolve by name. `DraggedItemPreview`'s decorative copy left alone | app (`BaseTodoListItem.vue:19`, `BaseTodoListItemSteps.vue:39`) | `todo-lists/A3` (+ one unfiled) | trivial |
| F72 | ✅ **FIXED 2026-09-22** — `saved()` branches on `mode` (*To ignored* → `isIgnored: true`, no ids; *To activity* → the activity id **alone**: `formData`'s role/category only narrow the picker, and sending them beside the activity was a second target, so the server's role/category target is deliberately not reachable from this form); request DTOs default `isActive = true`, `edit()` copies the row's value; a finished save clears `editedId` so a later save cannot re-write the row with the default. Validation: no pattern (blank counts as none) → no request and the filter bar's pattern fields are marked; the action bars are now a `VForm` so *Save* marks a missing activity. The `catch` no longer snackbars over the interceptor — only a request that got no response shows `failedToSaveMapping`. Verified desktop: empty *Save* → no request, 4 fields marked; *To ignored* → 201 with `"isIgnored":true` and null ids; edit of an API-created inactive rule → `PUT` 200 with `"isActive":false`; a duplicate → 409 and exactly one snackbar (the interceptor's typed text). Was: `useMappingSettings.saved()` sends three of the form's five facts: *To ignored* never reaches the wire (`isIgnored` stays `null` → 400 on every ignored save), `isActive` is never sent (→ the update DTO's `required` 400 on every edit), nothing validates before the request, and the view's own `catch` overwrites the interceptor's snackbar with a generic string | app (`useMappingSettings.ts`, the two `Tracker*MappingRequest.ts`, the two views' `edit()`, the two action bars) | `tracking-settings/X2`, `X3`, `B6` | med |
| FW1 | ✅ **FIXED 2026-09-23 — step 1 of 2** (`90b80e6`, bump `8739d08f`. Decided: the default protects *input*, so forms stay persistent and confirmations close on Escape, which answers "no". `useDialog().confirm()` plus ten input-less dialogs get `persistent: false`; `MyDialog`'s default is unchanged. **Step 2, flipping the default with a dirty-check guard on forms, is deferred** until every dialog goes through the central opener. Verified: backlog delete confirm closes on Escape and the row stays; the planner task form survives Escape; both pinned in specs. Body in the log) — `MyDialog` is `persistent` by default, so Escape closes nothing | **framework** | `_shell/A1` | med (decision first) |
| FW2 | ✅ **FIXED 2026-09-23** (`5397675`, bump `a7dbfda0`, in one commit with `FW5`/`FW6`/`FW7`/`FW15` — all six controls gain a localized `title`/`aria-label`: `AppTopBar`'s sidebar toggle (`general.toggleNavigation`), `FilterPanel`'s close (`general.close`), `MonthYearPicker`'s and `MyDateInput`'s chevrons (`dateTime.{previous,next}{Month,Day}`). Verified by typecheck/lint/build; `planner-day.draft.spec.ts` dropped its `nth(5)` positional fallback for `getByRole('button', { name: 'Next month' })`. Body in the log) — **Six** framework icon-only controls have no accessible name (**grown**: `MonthYearPicker`'s prev/next month, `MyDateInput`'s prev/next day) | **framework** | `_shell/A2`, `leisure-projects/A1`, **`planner-day/A1`** (+ two unfiled in `MyDateInput`) | low |
| FW3 | ✅ **CLOSED 2026-09-13** — `Time.fromJson` cannot parse the backend's string shape (the API had already switched to `{hours, minutes}` on 2026-09-11; `fromJson` now accepts both) | **framework** | `todo-lists/B4` | med |
| FW4 | ✅ **FIXED 2026-09-23** (`b4eb068` with `FW17`/`FW22`, bump `3067d954` — a *Layout* subsection under *Data tables* in `components.md`: the contract, the symptom, the shape to copy; default unchanged. Body in the log) — `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so | **framework** (docs only) | *(none — prevents the next `F12`)* | low |
| FW5 | ✅ **FIXED 2026-09-23** (`5397675`, bump `a7dbfda0`, same commit as `FW2`/`FW6`/`FW7`/`FW15` — `DataTable.vue`'s default action button now binds `:title="action.text"` and adds `:aria-label="action.text"`, matching `TableGrid`'s sibling. Body in the log) — `DataTable`'s default row actions render the internal slug as their `title`, not the localized label (**grown**: seen again on both `leisure-bucket-anchors` tables — `title="edit"`/`"delete"`, no `aria-label`) | **framework** | `activity-settings/B4`, **`leisure-bucket-anchors/A1`** (framework half) | trivial |
| FW6 | ✅ **FIXED 2026-09-23** (`5397675`, bump `a7dbfda0`, same commit as `FW2`/`FW5`/`FW7`/`FW15` — non-empty `day-cell`s gain `role="button"`, `tabindex="0"`, an Enter/Space handler and an `aria-label` from the new `calendar.dayCellLabel` key, formatted through the active i18n locale rather than the `sk`-hardcoded `formatToDateWithDay`; padding cells stay inert; a `:focus-visible` outline was added. App-side mirror: `src/locales/common.en.ts`'s full-duplicate `calendar` block gains the same key (SK's `calendar` only overrides `holidays` and merges the rest from the framework per-key, so it needed no change). Body in the log) — `CalendarGrid`'s day cells are click-only `div`s with no accessible name, role, `tabindex` or key handler — two consumers (history calendar, day-planner calendar) | **framework** | `history-review/A2` | low |
| FW7 | ✅ **FIXED 2026-09-23** (`5397675`, bump `a7dbfda0`, same commit as `FW2`/`FW5`/`FW6`/`FW15` — `MyPasswordInput.vue` replaces `appendInnerIcon`/`@click:appendInner` with a `#append-inner` `VIconBtn` carrying `user.showPassword`/`user.hidePassword`; `MyVerifyPasswordInput`/`MyNewPasswordInput` inherit it for free since both wrap `MyPasswordInput`. `user.passwordsDontMatch` added to both locales, plus the two new toggle keys. Not verified live — the harness's classifier blocks `fill` on password fields; the draft spec `fixme`s named in the finding were not promoted this pass. Body in the log) — Every password field's visibility toggle is named "{label} appended action" — Vuetify's `InputIcon` fallback, one component (`MyPasswordInput.vue`); and the mismatch message `user.passwordsDontMatch` is a key no locale file defines | **framework** | `user-settings/A1`, **`auth/A1`**, **`auth/B2`** (+ answers the message half of `user-settings/U4`) | low |
| FW8 | ✅ **FIXED 2026-09-23** (folded into `FW12`'s `549ae02`, bump `a0f116a9`; six tokens → `errorDark`/`warningDark`, pairing rule in `SETUP.md`; verified by computed style in both themes. Body in the log) — Six elevated buttons in the framework's user module use the tonal/outlined colour tokens (`error`/`warning`), and the pairing rule is written only in this app's CLAUDE.md | **framework** | `user-settings/P1` (+ the three on unit 15's signed-out views — pre-empted, and the unit did not re-file them) | trivial |
| FW9 | ✅ **FIXED 2026-09-23** (`0d83a88`, bump `b7423bc2` — new `/reset-password` view and route; the `catch` words only a no-response failure; verified live, bad token → 400 *"Invalid token."*. Body in the log) — The forgotten-password flow cannot complete at either step: ~~the request omits the `required` `recaptchaToken` (400 today)~~ **✅ token half landed** (`vue_framework` `6157283`, bump `04c405e9` — `auth/X1` verified fixed in round 3, 204 for a real and a nonexistent address), and the link the server would mail points at `/reset-password`, **a route and view that exist in no repo on this side** — plus a dead 404 branch the server never takes, a hardcoded snackbar and a `TypeError` on network failure | **framework** (new view + route) | ~~`auth/X1`~~ (fixed), `auth/B3` | med |
| FW11 | ✅ **FIXED 2026-09-23** (`8dbb5ff`, bump `7a612d7f` with `F39`; deep link → sign in → back there, `https://` and `//` redirects → `/`. Body in the log) — Post-login redirect, read half: `LoginView`'s two success handlers and `LoginVerifyQrCode` hardcode `router.push('/')`, so the `?redirect=` the interceptor already writes (and `F39` will) is never honoured — with an open-redirect guard; folds `P3`'s `console.log(valid)` and the `'No user!!!'` literal, same file | **framework** | `auth/B1` (read half), `auth/P3` | low |
| FW12 | ✅ **FIXED 2026-09-23** (`549ae02` with `FW8`, bump `a0f116a9`. **Also fixed, unfiled:** the confirm POST had no body and 415'd for *every* link, and both resend calls went to routes the server does not have — resend moved to `POST /auth/resend-confirmation-email { email }`, and `ConfirmEmailView` dropped its Resend. Body in the log) — Both confirm-e-mail views' error states are a lone button with no persistent explanation — the sibling the unit held up as the model has none either (its "body text" is the snackbar — **the unit's round 2 re-drove it and now says the same**); `ConfirmEmailView` also snackbars the literal `Error`, posts to `/resend-confirmation-email/undefined` when the link has no `userId` (**observed in round 2** — it answers 401 and trips `FW21`), and both success buttons are `color="main"`, a token the theme does not define | **framework** | `auth/B4`, `auth/B5` (+ settles `U6`: no defect) | low |
| FW13 | ✅ **FIXED 2026-09-23** (rest in `37773f3`, bump `4f7391cb` — a duplicate address reads *"An account with this email already exists"*, one snackbar; legal links open a new tab. Body in the log) — ~~`RegistrationView` fails closed on an empty reCAPTCHA token~~ **✅ guard half landed** (`vue_framework` `6157283`, bump `04c405e9` — `auth/X2` verified fixed in round 3, a real account created through the UI); what is left: its `catch` overwrites the server's `409 "User already exists"` with *"changed by someone else"* (the round-3 duplicate submit **did** answer 409), and `P1`'s legal links (`target="_blank"`), same file | **framework** | ~~`auth/O1`/`X2`~~ (fixed), `auth/P1` | low |
| FW14 | ✅ **FIXED 2026-09-21** — registration's 2FA recovery codes were received and discarded; `RegistrationView` now opens `RecoveryCodesBody` after the QR (`utils/recoveryCodes.ts` shared with `SecuritySection`) and the "no QR"/"no codes" arms go on to `/login`. Verified live and by the promoted `auth.draft.spec.ts` registration test. Body in the log | **framework** (`RegistrationView.vue`) | `auth/B8` | low |
| FW15 | ✅ **FIXED 2026-09-23** (`5397675`, bump `a7dbfda0`, same commit as `FW2`/`FW5`/`FW6`/`FW7` — `v-bind="$attrs"` moved to be the last binding on `MyDateInput`'s `VDateInput`, so a caller's `label`/`hideDetails`/`style` now win. `e2e/tests/history-review.draft.spec.ts:28`'s `getByRole('textbox', { name: 'Date' })` — the defect pinned as expected behaviour — now reads `{ name: 'From' }`, both as the finding required. Body in the log) — `MyDateInput` binds `v-bind="$attrs"` *before* its own `:label` and bare `hideDetails`, so every caller's `label` (and `hideDetails="false"`) is silently discarded — three call sites pass one, and the History summary's *From*/*To* pair both read "Date" | **framework** | `planner-day/B2` (+ the unfiled *From*/*To* twin `history-review/inventory.md:20` recorded as fact) | trivial |
| FW16 | ✅ **FIXED 2026-09-23** — `CalendarGrid` gains `v-model:dateRangeMode` / `v-model:dayVisibility` / `v-model:rangeConfig`, `DateRangePicker` gains `v-model:mode` / `v-model:rangeConfig` (types in `dto/DateRangeConfig.ts`); unbound consumers unchanged. Body in the log. Was: `CalendarGrid`'s "Days to show" and `DateRangePicker`'s mode + Range/Duration configuration are private `ref`s no consumer can read or set — expose them as optional models (defaulting to today's behaviour) so an app can round-trip them | **framework** (additive API) | `planner-day/B3` (framework half; `F44` is the app half) | med |
| FW17 | ✅ **FIXED 2026-09-23** (`b4eb068` with `FW4`/`FW22`, bump `3067d954` — `left` offset by half of `--v-layout-left − --v-layout-right`, `0px` fallbacks; the two `fixme` stubs had empty bodies and were written: Delete → confirmation, Cancel → both blocks remain, green at 1280×720. Rail state not checked by eye. Body in the log) — `ActionBar` is `position: fixed; left: 50%` — centred on the **viewport** while `.v-main` is inset by the nav drawer, so the bar's left end slides under the drawer and *Delete* is un-clickable at 1280×720; two `dayPlanner.spec.ts` specs have been `fixme`d on it since before the sweep | **framework** | *(unfiled — unit 7's brief item 2, re-confirmed in its inventory `:144`; `e2e/tests/dayPlanner.spec.ts:203-224`)* | low |
| FW18 | ✅ **FIXED 2026-09-23** (`a939450`, bump `027a8ec0`) — optional `{ requestKey }` on `fetchById`/`fetchByField`, `useFetchFiltered`'s shape, default unchanged (not the id). Unit test added (4 passing), and A1's trap and the CLAUDE.md bullet are rewritten. The `src/` sweep found only the dialog. Body in the log — `useEntityQuery.fetchById` holds one controller per **method**, so two ids fetched concurrently from one instance cancel each other — the `useFetchFiltered` bug of 2026-09-11 one helper over; give it the same optional `requestKey` (default-preserving), and amend the `prompts/_common/api/A1` trap and the CLAUDE.md `_common/api/` bullet that both say it does not need one | **framework** (additive API + docs) | *(the framework half of `planner-templates/X1`; `F50` is the app half)* | low |
| FW19 | ✅ **FIXED 2026-09-23** — landed 2026-09-21 in `vue_framework` `4ab7e61` with `FW24` (bump `adaae452`) and was never closed; verified live: the role-colour 400, a time-period 400 and the system-role 409 all show the specific `errors` text. Body in the log. Was: `extractServerMessage` returns the generic top-level `message` ("One or more errors occurred!") before it looks at `errors`, so against this API's validation shape the specific, human-written text is never shown — a colour-format rule and a system-role 409 both read as the generic string | **framework** (`src/_common/axiosConfig.ts:86-101`) | `activity-settings/B9` | low |
| FW20 | ✅ **FIXED 2026-09-23** (`e6f4b68`, bump `8739d08f`. Decided: whole-word matching (split on camelCase, `.`, `_`, `-`), **plus** an optional `TableColumn.format` that overrides the guess. Verified: *Duration* reads 45, *Inspiration* shows its text, yes/no icons intact; 28-case unit test. Body in the log) — `useTableFormatters`' zero-config heuristics match raw substrings — `durationMinutes` contains `ratio` and renders "45.00 %", `inspirationSource` contains `ratio` and renders "—" for every seeded string; the framework's own `JobRunHistory.vue` already slots `durationSeconds` and `errorSummary` around the same trap. **The `inspirationSource` half is no longer unfiled and is now proved from inside the running component** (`isPercentKey('inspirationSource')` → `true`, `formatPercent(…)` → `"—"`, `getValue(…)` → the real string), which is why it is the worse of the two: this heuristic does not mis-format real data, it **deletes** it | **framework** (`src/_common/composable/table/useTableFormatters.ts`) | `leisure-backlog-picker/B5` (round 2 — round 1's `B1`), **`leisure-bucket-anchors/B3`** | med (decision: word-boundary match vs. opt-in) |
| FW21 | ✅ **FIXED 2026-09-23** (`2351ce7`, bump `a0f116a9` — the list extended, **not** the `/auth/` prefix: the server has signed-in routes under it; unit-tested both ways. Body in the log) — The interceptor's `AUTH_ENDPOINTS` allowlist names five signed-in auth routes and none of the signed-out ones, so a 401 from `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email` or `/auth/resend-confirmation-email/*` costs a `/auth/refresh` round trip while no session exists — one wasted request, nothing visible (`logoutClient()` no-ops signed out) | **framework** (`src/_common/axiosConfig.ts:63-65`) | `auth/B7` (re-graded `bug` → `polish`) | trivial |
| F73 | ✅ **FIXED 2026-09-21** — the three leisure profile DTOs now carry a real `id` (first constructor parameter, destructured in `fromJson`, the getter deleted) and all nine write call sites pass `item.id` / `entityToEdit.id`. Verified live on `/leisure/projects`: status click → `PUT /activity-project-profile/17201` 200, edit → 200 and persisted, delete → 204 and gone after reload. Body in the log | app (`src/core/leisure/dto/response/` ×3 + 9 call sites) | `leisure-projects/X1`, `leisure-backlog-picker/X1`, `leisure-bucket-anchors/X4` | med (effort) / **high** (severity) |
| F74 | ✅ **FIXED 2026-09-22** (`eb13eb1a` — `PUT …/quick-edit` and `POST …/clone` split; a failed rename keeps the dialog open with a specific snackbar instead of saving the rest, because the task's success snackbar would overwrite the error. Verified live in the planner, to-do and routine dialogs, **clone included** — task repointed at the new id; the repeating-task dialog was not driven, no seeded row. **The toggle-off half does not reproduce:** with quick edit off, the Name field is not rendered at all. Body in the log) — **`quickEdit` posts to a route that has not existed since the rename** — the client sends `PATCH /activity/{id}/Overwrite`\|`/Clone`, the server has `PUT /activity/{id}/quick-edit` and `POST /activity/{id}/clone`; every quick-edit and every quick-clone 404s in four dialogs across two modules, and the rejection is swallowed so the whole form save is discarded with no message. Folds the toggle-off half: with quick-edit **off** the Name field is a live-looking no-op. **Sixteenth pass, from the endpoint source:** the two modes differ in **verb and response shape** (`PUT` → **204, no body**; `POST` → **200 carrying the new id**), so the one templated `API.patch(…/${mode})` cannot be repaired by renaming the path segment — it has to split in two | app (`activityApi.ts`, `QuickEditMode.ts`, `ActivitySelectOrQuickEditFormField.vue`) | `planner-day/X1` (both halves) | med |
| F75 | ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90` — an `isOverMidnight` branch rolls the end onto the next day. Verified live with a Playwright fake clock: 08:00 → 00:00 day, no line at 23:55, line with correct counts at 00:05; 08:00–23:00 day, no line at 22:31, line at 23:11. Body in the log) — `viewEndDate` never rolls an overnight view onto the next day — with the seed's `bedTime` of `00:00` it resolves to **today at midnight**, so `isDayMateriallyDone` is true all day and the plan-vs-actual verdict ("3 tasks never happened") renders at 19:54 on a day that is not over | app (`dayPlannerStore.ts:157-170`) | `planner-day/B7` | low |
| F76 | ✅ **FIXED 2026-09-21** (same session as `F73`, per its ordering constraint) — `:precision="null"` on the `estimatedHours` `VNumberInput`; the edit dialog now opens on "8.5", and a two-decimal `8.25` submits and persists as `8.25`. Body in the log | app (`NewProjectProfileForm.vue:35-39`) | `leisure-projects/B4` | trivial |
| F77 | ✅ **FIXED 2026-09-21** (same session as `F63`) — required rules on every field the API's `Create*Validator` rejects empty (backlog Location/Weather/Cost, bucket-list Experience type + Inspiration source, anchor Highlight, project Project area), and a leisure `useServerFieldErrors` composable over `extractServerFieldError` that each wrapper form's `onConfirm` routes a caught 400 through, dialog kept open. Verified live: untouched *Create* → required messages and no `POST`; a server-only refusal (*Read a Novel*, already profiled) → *"Activity already has a backlog profile."* under the Activity field. Body in the log | app (`New{Backlog,BucketList,MemoryAnchor,Project}…Form.vue` + their wrappers, `composable/useServerFieldErrors.ts`) | `leisure-backlog-picker/B3`, `B4`, `leisure-bucket-anchors/B2` (feedback half) | low-med |
| F78 | ✅ **FIXED 2026-09-22** (with `F29`) — the board card is `role="button"` + `tabindex="0"` + `aria-label` *"Edit {name}"* with `@keydown.enter.space.self.prevent` (`.self` keeps Enter on the nested status/Delete buttons from also opening the edit dialog); `BackgroundTaskBlock` is `role="button"` + `tabindex="0"` + `aria-pressed` + the composed label as `aria-label`, wired to `useTaskBlockKeyboard` like the foreground block, with a focus ring and a `selected` style. Verified live: Tab from a foreground task lands on the block, Enter selects (*1 selected*), Escape clears and keeps focus, E opens edit; mouse multi-select still 2; Enter on the card's nested *Delete* opens only the delete confirmation | app (`ProjectReadinessBoard.vue`, `BackgroundTaskBlock.vue`) | `leisure-projects/A4`, `planner-templates/A4` | low |
| F79 | ✅ **FIXED 2026-09-21** (same session as `F61`) — one `LeisureEmptyState` component replaces the seven copies; it branches *failed* → *filtered* (`filter.hasAny()`, passed down as `filtered`) → genuinely empty, and the filtered branch offers *Clear filters* (reassigns a fresh filter DTO) instead of *Add*. Verified `?activityName=zzzz` on all seven surfaces, *Clear filters* drops the param and the rows return, and `secondaryUser` still gets the onboarding copy on every surface — which also settles `leisure-projects/U1`'s table half. Body in the log | app (`src/core/leisure/component/LeisureEmptyState.vue` + 4 tables, board, ladder, timeline, 4 views, locales) | `leisure-projects/P3` | low |
| F80 | ✅ **FIXED 2026-09-23** — `metaLine()` joins the present parts with `' · '`. Verified. Body in the log — The board card's metadata line reads "Woodworking· 8.5h" — two adjacent `v-if` templates each lead with `· ` and neither emits a leading space | app (`ProjectReadinessBoard.vue:86-98`) | `leisure-projects/P2` | trivial |
| F81 | ✅ **FIXED 2026-09-23** — `arrows-left-right-to-line` (both suggested icons are the siblings'). Verified, console clean. Body in the log — The repeating-task dialog asks for `fas fa-calendar-range`, which this app does not bundle — the *Date range* recurrence tab renders with no icon and logs a FontAwesome error every time the dialog opens. **Sixteenth pass proved it and bounded it:** `calendar-range` is a FA **Pro** name absent from all three free packs (aliases included), and a sweep of every static icon literal in `src/` found **exactly two** unresolvable ones app-wide — this and `F46`'s `mdi-close`. Not the tip of an iceberg; `calendar-days` is the substitute | app (`RecurrenceType.ts:15`) | `planner-day/P1` | trivial |
| F82 | ✅ **FIXED 2026-09-23** — decided for the asterisk: the server requires `ImportanceId` on repeating tasks only. `planner.importanceRequired`. Verified. Body in the log — *Importance* blocks submission of the New/Edit Repeating Task dialog with "This field is required" and carries no `*`, unlike `* Name` and `* Activity` in the same dialog — and it is genuinely optional in the plain task dialog, so one of the two is wrong | app (`RepeatingTaskDialog.vue`) | `planner-day/P2` | trivial (decision: mark it or relax it) |
| F83 | ✅ **FIXED 2026-09-23** — "N tasks (+M background)" when M > 0. Verified against a created-and-deleted background task. Body in the log — The template header counts foreground tasks only and does not say so — two blocks on screen, "1 task" in the header; the exclusion itself is correct and confirmed live | app (`TemplateDayPlannerView.vue` `taskStats`) | `planner-templates/P3` (was `U1`) | trivial |
| F84 | ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90` — `isHistoryOtherRollup` in `HistoryGroupKey.ts`, shared with `useHistoryInsights`; the legend/tooltip read `history.summary.otherGroup`, the click is ignored. Verified live with a mocked `_other` + `Uncategorized` body: *Other*, grey, not selectable; `Uncategorized` still selects. Body in the log) — The history dashboard's pie renders the server's folded-tail row **raw** — the legend reads the literal `_other`, untranslated in both locales, and the slice is selectable (`handleChartClick` has no sentinel branch, so it emits `{id: null, name: '_other'}` and cross-highlights the summary cards). The `activityTracking` pie has translated and blocked the same sentinel since it was written; `historyDashboard` never got the branch, and `HistoryGroupKey.ts:7-8` already documents the row it does not handle. Found from the other side while closing §10 — the backend's out-of-scope flag on `HistoryPieChartBuilder.cs` was **stale** (`OtherName` is already `"_other"`), so this is app-side with no backend half. **Re-read in the API this pass: `HistoryPieChartBuilder.cs:20` is `public const string OtherName = "_other";`** — confirmed on both sides, and the backend's offer to "do the History side as a follow-up" needs no answer because there is nothing there to change | app (`historyDashboard/component/pieChart/HistoryPieChart.vue:41,75-81,113-121`) | *(unfiled — fell out of §10's closure)* | low |
| FW22 | ✅ **FIXED 2026-09-23** (`b4eb068` with `FW4`/`FW17`, bump `3067d954` — `:precision="null"` for `DECIMAL`, `0` otherwise; source and typecheck only, no consumer here. Body in the log) — `TableCellEditor`'s `DECIMAL` branch sets `:step="0.1"` and no `:precision`, so Vuetify rounds every decimal inline-edit cell to a whole number — `TableCellType.DECIMAL` does not do what it says. Source-certain, **no consumer in this app yet** | **framework** (`inlineEditTable/TableCellEditor.vue:19`) | *(unfiled — the framework twin of `leisure-projects/B4`)* | trivial |
| FW23 | ✅ **CLOSED 2026-09-23 — no change needed.** Decided (b): keep multi-sort and show the affordance. Seen live, the affordance already exists: after one plain click on a second header, both keys show Vuetify's numbered badge (*Activity ↑ 1*, *Duration (min) ↑ 2*), and clicking again cycles asc → desc → removed. The finding's "no badge beyond the primary key" does not reproduce. Body in the log — A second column-header click **adds** a sort key instead of replacing it (`sortBy=activity.name:asc,durationMinutes:asc` from one unmodified click), with no multi-sort affordance anywhere — `VDataTable`'s default, inherited by every table in the app | **framework** (decision: `BasicTable`/`DataTable` default) | `leisure-backlog-picker/P1` (round 2) | low (decision first) |
| FW24 | ✅ **FIXED 2026-09-23** — the code had landed 2026-09-21 (`vue_framework` `4ab7e61`, with `FW19`; bump `adaae452`); verified live 2026-09-23 against all five requests. One gap found and fixed: a duplicate desktop mapping's field-keyed `errors.patterns` sentence was swallowed by the generic unique wording (`bc96068`). Body in the log. Was: **`B18` landed and nothing on this side reads it.** Every error body now carries `errorType` (API `cd0a252`), and the interceptor still branches on status alone — so the four different 409s (unique / FK / concurrency / business) are one sentence, and today that sentence is the API's own untranslated English DB prose, because the 409 branch prefers `serverMessage`. Wire the type into `ErrorHandlingFunctions.handleHttpCodes` and `axiosConfig`'s 409/403 branches, status-only as the fallback | **framework** (`ErrorHandlingFunctions.ts`, `axiosConfig.ts`; submodule commit + pointer bump) | escalation §7's frontend half (+ `auth/B6`'s 403 pair, already fixed another way) | low-med |
| FW25 | ✅ **FIXED 2026-09-21** (filed and landed the same day) — three hydrations per settings visit each pushed the browser time zone, and a `PUT` racing a step-up write failed Identity's concurrency check, reported as "Wrong password"; now one in-flight hydration, one zone push per session, and `VerifyUserForm` words only a 401. **Grown on the way:** a wrong step-up password **signed the user out** (401 → refresh → identical retry → 401 → `logoutClient()`), fixed with `_credentialCheck` on the request. Same commit: the 2FA sign-in dialog closes on a refusal instead of inviting a retry the single-use token cannot honour, and the reset button reads *Reset authenticator app*. Body in the log | **framework** (`authStore.ts`, `timeZoneSync.ts`, `VerifyUserForm.vue`, `axiosConfig.ts`, `LoginVerifyQrCode.vue`) | `user-settings/B3`, `user-settings/B4` | low |
| F85 | ✅ **FIXED 2026-09-23** — landed 2026-09-21 in `adaae452` and was never closed; verified live: a raced name clash and a raced length clash each keep the dialog open with the inline error, and deleting *Daily* gives *"5 routines are still assigned…"*. Closes §7. Body in the log. Was: The two app-side `_silent` 409 workarounds can stop guessing once `FW24` lands — but **not** be deleted as `B18`'s own note suggests: `TimePeriodForm`'s inline conflict error is what keeps the dialog open with the user's input, which an interceptor snackbar cannot do. Branch both call sites on `errorType` instead of on bare status 409, and drop `useDeleteConfirmation` from the change list entirely — it is pre-flight and never sees a response | app (`TimePeriodForm.vue:160-175`, `RoutineSettingsView.vue:175-191`) | escalation §7's app half (`todo-routine/B9`, `B11` — both already fixed; this is their follow-on) | trivial (unblocked — `FW24` closed 2026-09-23) |
| F86 | ✅ **FIXED 2026-09-23** (filed and fixed the same day) — `useCalendarUrlState` re-applies every owned key on an outside navigation; **grown on the way:** a spurious *Failed to load the calendar* snackbar on every month deep link (a cancelled fetch toasted as a failure) swallowed the next Back/Forward, because Vuetify closes an open overlay and aborts the navigation; and the framework `Snackbar.vue` now sets `closeOnBack=false`, so no toast traps Back (framework-wide behaviour change, in `FW16`'s submodule commit). Body in the log. Was: Back/Forward on `/day-planner` moves the URL's `?month=` but not the grid — the codec **pushes** a history entry per month and the view reads the query only on mount, so every entry it has ever pushed is one the grid ignores. Predates `F44`; found verifying it | app (`useCalendarUrlState.ts`, `PlannerCalendarView.vue`) | *(unfiled — fell out of `F44`'s verification; P7's "back/forward walks months")* | low |
| F87 | ✅ **FIXED 2026-09-24, uncommitted** — one debounced watcher re-reads the day's counts from the server after any change to its tasks (previews excluded); the three local `completedTasks` recounts are gone. Verified live: a UI delete moves the header 0/2 → 0/1 with no reload, and loading a day fires no extra request. Body in the log. Was: after a delete, the day's *"N/M tasks · X%"* header kept the old total until a reload | app (`DayPlannerView.vue`, `Calendar.ts`) | `planner-day/B8` | low |
| F88 | ✅ **FIXED 2026-09-24, uncommitted** — the planner decides its layout from its own width, not the window (`usePlannerLayout.ts`, threshold 900 px); a narrow planner floats the side panel over the grid, closed by default. Split view at 1440: grid 516 px per pane (was ~100), the overlay opens without changing it, and the cross-template drag works. Single-planner desktop layouts unchanged. Body in the log. Was: at desktop width the split view gave each grid ~100 px and clipped the drag handle, and the panel could not be closed | app (`PlannerSidePanelShell.vue`, both planner views and headers, `useRoutinePlacement.ts`) | *(unfiled — found closing `planner-templates/U2`)* | low–medium |
| F89 | ✅ **FIXED 2026-09-24, uncommitted** — decided: `D` opens *Log time manually* to complete, because no other key opens that dialog and every other path to *Completed* goes through it; on tasks that are all completed it sets them back to *Not started*. Both are the selection bar's own paths (`handleChangeStatusOnSelected`); the store's broken `updateTaskStatus` is deleted; the grid's spoken help says the new behaviour in EN and SK. Verified live: dialog → `PATCH …/status` 204, header 1/4 → 2/4 with no reload; `D` again → 204 `notStarted`, times cleared, survives a reload. Body in the log. Was: the `D` shortcut sent `{ status }` to the time-span endpoint and got a 400 on every task | app (`PlannerTaskBlock.vue`, `DayPlannerView.vue`, `dayPlannerStore.ts`, `dayPlanner.{en,sk}.ts`) | *(unfiled — found verifying `F87`)* | trivial |
| FW26 | ✅ **FIXED 2026-09-24, uncommitted** — the success interceptor auto-hides only when no `API` request is in flight (a retried 401 counts once); `showFullScreenLoading({ manualHide: true })` sugar for the existing `axiosSuccessLoadingHide` opt-out, used at the six app sites that hide in `finally` (and `TemplateListView` gained its missing `finally`); `BaseToDoList` hides *No tasks* while the overlay is up, because the scrim is translucent. Verified: overlay 75 → 5242 ms across a 5 s list fetch (was 65 → 124 ms), no *No tasks* under it, the empty list 13003 still says it; four unit tests. **Also the same day:** overlapping loads — `TemplateDayPlannerView` and the day planner's day step hide only for the newest load (the day step's cancelled older fetch was also being read as a missing day and navigated back), and `router.beforeEach` no longer hides on a same-route navigation, which had dropped every day step's overlay after ~3 ms. Body in the log. Was: the fullscreen loader is hidden by the first successful response from *any* request (`axiosConfig.ts:233-237`), so a view that runs a side request beside its main fetch loses the overlay in ~60 ms and shows its **empty state** for the rest of a slow load: `/todo-list/:id` read *"0% No tasks"* for 5 s before its 8 items arrived. Cannot strand (the reverse of what `_shell/U2` feared). Needs a decision: a show/hide depth counter with the interceptor no longer hiding, or per-view loading flags the empty states respect. Body in the log (2026-09-24 sweep) | **framework** (`LoadingComposable.ts`, `axiosConfig.ts`); eleven `showFullScreenLoading()` call sites | *(unfiled — found closing `_shell/U2`)* | low–medium (needs a decision) |
| F90 | ✅ **FIXED 2026-09-24, uncommitted** — decided: one framework wrapper. The new `MyBtnToggle` adds `role="group"` and a required `label`, and keeps `aria-pressed` on each button in sync with Vuetify's active class. All 31 `VBtnToggle` uses moved over, framework ones included, and `DayOfWeekPicker` gained a required `label`. Verified live: `/leisure/pick` reads `group "Time available"` › `"1 h" [pressed]`, and Space moves the state. Theme, slot size, scheduled days and tracking settings were spot-checked. Body in the log. Was: no toggle group exposed which option was selected (colour only) and none had a name | **framework** (`inputs/MyBtnToggle.vue`) + 25 app files | *(unfiled — found closing the `ConstraintBar` keyboard row)* | low–medium |

89 app-side (`F90` filed 2026-09-24 from the `ConstraintBar` check and fixed the same day through a framework wrapper, body in the log — **no app batch is open**; `F87` and `F88` filed and fixed 2026-09-24 from the planner checks, bodies in the log; `F89` found verifying `F87` and fixed the same day, body in the log; `F9`, `F17`, `F19`, `F23`, `F35` and `F69` include CLAUDE.md or runbook edits; `F17` and
`F23` are nothing else; `F24`/`F25` are fixed and verified; `F45` was a reserved number, never a batch — the template-suggestions fix it was held for landed 2026-09-24 without one, and the number is retired unused;
`F85` landed 2026-09-21 unrecorded and was verified and closed 2026-09-23, body in the log; `F9`, `F17`, `F21`, `F22`, `F26`, `F28`, `F32` and `F80`–`F83` landed 2026-09-23 as one trivial sweep, bodies in the log; `F86` was filed and fixed 2026-09-23 while closing `F44`, body in the log; `F73` and `F76` landed together 2026-09-21, then `F63` and `F77`, bodies in the log) · 25
framework (`FW10` was a reserved number, never a batch — the `TimePicker` minute-60 fix it was held for landed 2026-09-24 without one, and the number is retired unused; `FW14` and `FW25` landed 2026-09-21, bodies in the log; `FW19` and `FW24` landed together 2026-09-21 unrecorded, verified and closed 2026-09-23, bodies in the log; `FW4`, `FW17` and `FW22` landed together 2026-09-23 in `b4eb068`, bodies in the log; ~~open framework batches are now `FW1`, `FW20`, `FW23`~~ — all three decided and closed 2026-09-23: `FW20` fixed, `FW1` step 1 fixed with step 2 deferred, `FW23` needed no change; bodies in the log. ~~**No framework batch is open**~~ — `FW26` filed 2026-09-24 from the `_shell/U2` check and fixed the same day, body in the log; **no framework batch is open again**) ·
22 escalations (**1 open** — **§23 filed 2026-09-24** (`B28`, a revoked session keeps its access token); **§22 closed 2026-09-24**, written, landed and verified the same day (`B27`, template suggestions). Before it, **§7 closed 2026-09-23**: `B18` had landed 2026-09-21 and its
frontend half, `FW24` + `F85`, shipped the same day unrecorded and was verified live 2026-09-23; **§19 closed 2026-09-21** when `B24` landed and its
frontend half shipped the same evening with `F16` folded in — no ask is open server-side; **§18 closed 2026-09-21** when `B23` landed and `F47` shipped with it; **§8 closed 2026-09-21** when `B19` was decided — a stable
`holidayKey`, no country preference — and its frontend half landed the same day; **§1 closed 2026-09-21** when `B15` landed with no
frontend half and the bell verified English on the EN account; §11 closed 2026-09-16 and the count line said 6 until
the fifteenth pass; §10 closed the same day when `B16` landed and its frontend half went in; §1, §2, §3, §4, §5, §6,
§8, §10, §11, §12, §13, §14 and §15 are closed,
their bodies moved to [`_fix-queue-log.md`](_fix-queue-log.md) → *Closed escalations*; §5 closed 2026-09-15
when `B20` landed with no frontend half left; §12 closed 2026-09-15 when the anchor-eligible-activities
endpoint landed and `F62` shipped; **§6 and §13 closed together 2026-09-15** when `B11` landed — one
defect class on five grids, and no frontend half, because all five filter classes already carried the
names the server adopted). **The fourteenth pass absorbed four mutation
rounds** — units 4, 6 and 9 from the working tree, and unit 15's from `04c405e9`, which the thirteenth pass
had scoped past: fourteen new findings became six app batches (`F67`–`F72`), two framework batches
(`FW14`, `FW21`) and two escalations (§14, §15), and **two framework batches shrank by half without the
queue noticing** — `FW9`'s token and `FW13`'s fail-closed guard both landed in `vue_framework` `6157283`
and were verified in unit 15's round 3. Every one of the seven new `blocker`s was read against source and
the API's: three are the same function (`useMappingSettings.saved()`, `F72`), one is `F13`'s dead delete
seen live (`X4`), one is the fourth observation of §11's colour validator (`todo-lists/X1`), and two are
already fixed. Units 11 and 12 between them added two framework batches and **three escalations** —
the most of any pass since unit 14 — and every one of the three is a client/server contract gap the
browser could only see the edge of: a validator that rejects the palette names the server's own seeder
writes (§11), an endpoint the client was told exists and which no file in the API declares (§12), and
four grid filter contracts of which the server reads eight fields out of twenty-seven (§13). The two
mutation rounds (units 1 and 2) added one app batch each from actually mutating (`F59`, and `B8` folded
into `F19`), rewrote one existing batch from the root (`F8`), and settled three `unverified` rows in a
browser. Unit 4 added no framework batch and no escalation; unit 15 added four framework batches and no
escalation — every one of its defects is in `src/_common/modules/user/` or `src/router.ts`, which is
what a unit made of framework views looks like. Unit 7 added three framework batches and no escalation,
and split one finding across the boundary (`FW16`/`F44`) — a planner view built on `CalendarGrid`,
`DateRangePicker`, `MonthYearPicker`, `MyDateInput` and `ActionBar` is five framework components deep,
and four of its seven findings landed there. Unit 5 added no framework batch — its four dashboards are
built from this module's own components on top of Vuetify and ECharts, and the one Vuetify-default gap
(`F49`) is fixed at the call sites, not in `componentDefaults` (rule 4, see the batch) — and one
escalation that the unit did not file and could not have seen on the seed (§10). Unit 8 added one
framework batch and no escalation: its blocker splits across the boundary the way `FW16`/`F44` did
(`FW18` is the helper, `F50` is the dialog), and its one apparent backend question — whether
*Suggested for day type* should be optional — is settled from the API source as **no**: the column is
non-nullable and indexed, the request field is `required`, and `/suggestions` is built on it (`F53`).

**Order among the sixteenth-pass batches.** *(Settled 2026-09-23: all three are closed. `FW24` and `FW19`
landed in one framework commit, `4ab7e61`, and `F85` came after it in the same app commit that bumped
the pointer, `adaae452`.)* `FW24` before `F85`, necessarily — `F85` reads a field the
interceptor does not yet expose, and a pointer bump sits between them. `FW24` is also worth landing in
the **same framework commit as `FW19`**: they are two different causes (message precedence vs. no
per-type wording) and stay two batches, but they are the same two files and the same user-visible
sentence, and shipping one without the other means two pointer bumps to fix one snackbar. Neither is
blocked on anything, and neither is urgent: `B18` is additive, absent `errorType` keeps today's
behaviour, and nothing in the queue waits on them.

**Order among the fifteenth-pass batches.** `F73` first and alone — it is three blockers in one edit,
it un-breaks every write on three of the four leisure surfaces, and nothing else in `leisure` can be
verified past a create until it lands (`F76`, `F77` and `F79` all need an edit or a delete to complete).
Do all three DTOs and all nine call sites in one commit and run `npm run type-check`: they share an
interface (`IIdResponse`) and a half-migration is worse than none. **`F76` in the same session as
`F73`, and before anyone opens a project edit dialog again** — today the rounding is masked by the 404,
and the moment `F73` lands, opening and saving any project silently writes `8.5 → 9`. `F74` second and
alone: it is the `F70` shape (a client calling a route the server renamed), it breaks four dialogs in
two modules, and its *Clone* half has never been observed by anyone — verify both modes. `F77` after
`F63`, not before: `F63` makes `requiredRule` able to fire at all, and `F77` is the rules and the
`catch` on top of it; landing `F77` first leaves the three selects validating a `0` that passes.
`F75` is one branch in one computed and needs no browser beyond loading today's plan before the day
ends. `F78` must agree with `F29` and `FW6` on the role/keydown/`aria-label` pattern — whichever of the
three ships first sets it, and the other two copy rather than re-decide; `F78` also wants `F51`'s
reopen control settled if both run together, for the same reason `F56` does (settled — `F51` closed
2026-09-23, a `bars` `VIconBtn` named `planner.a11y.openPanel`/`closePanel`). `F79` should **not** be
scoped to the projects view: all four leisure surfaces came out of one `L4` pass and share the branch,
and a fix that teaches only the board to say "no results" leaves three tables lying. ~~`F80`, `F81`,
`F82` and `F83` are one-line edits, independent of everything; `F81` and `F82` are the same dialog and
can share a commit, but they are different causes (a missing icon vs. a missing asterisk) and `F82`
needs a **decision** first — mark it required or relax the validator, because the plain task dialog
treats the same field as optional.~~ **All four done 2026-09-23** in the trivial sweep; `F82` was decided
for the asterisk (the API's validator requires `ImportanceId` on repeating tasks only). ~~`FW22` is two repos for one attribute and has **no consumer in this
app**, so its verification is the framework's own, not ours.~~ **`FW22` landed 2026-09-23** (`b4eb068`). ~~`FW23` needs a decision before an edit
(rule 4): single-sort is what every table in this app looks like it does, but flipping
`VDataTable`'s default changes every table in every app on the framework — and one of them may be
relying on it.~~ **`FW23` was decided (b), keep multi-sort, and closed 2026-09-23 with no change:**
the numbered badges it asked for were already there.

**Order among the fourteenth-pass batches.** `F70` first and alone — one line, and it un-breaks a
feature that has been dead since the day it was written. *(`F12` → `F72` → `F13` → `F15` all landed
2026-09-22, in that order — log, Closed batches.)* `F72` before `F13`'s verification: the mappings
table cannot be *edited* into a verifiable state until the update request carries `isActive`, and `F13`'s
delete retest wants a row this pass can create-and-delete rather than a seeded one. **Read `F72` whole
before touching `saved()`** — the finding's "always send `true`" would silently re-activate every inactive
rule on edit, because the server's update is a full PUT replace. `F69` before unit 9's next round and
before the routine list is retested: both views share the composable, so one edit changes two screens.
`F67` needs a **decision** (discard with a message, or save the seconds) before an edit, and the decision
must be made once for three views — do not fix Pomodoro to match Timer and leave Stopwatch; `F68` is
independent of it and one file. `F71` is attributes only and can ride with any `todoList` commit.
`FW14` is six lines that already exist one file over (`SecuritySection.vue:261-281`) and needs a
throwaway registration to verify — reseed after. `FW21` is an allowlist edit; land it with `FW12`, whose
`userId` guard removes the only trigger anyone has observed. `FW9` and `FW13` are **smaller than their
bodies say** — read the ✅ line at the top of each before starting; what remains of `FW13` is the `catch`
and two `target="_blank"`s.

**Order among the unit-11/12 batches.** `F61` first — two constants, and until they change neither
the ladder nor the timeline renders anything, so nothing else on those two views can be verified; it is
also the one batch here that must **not** stop at the constant (see its body — the empty-state-on-failure
half is the part `ProjectsView` did not fix either). `F64` second: it is the picker's default landing
state and closes a `blocker` with one expression. `F63` before either unit's **mutation pass** — that pass
has to submit all four create forms and will otherwise file the literal-"0" defect four more times; it
touches four DTOs and four forms, so run `npm run type-check` and do all four in one commit, not per
finding. `F62` **and §12 are both closed** (2026-09-15) — the endpoint landed and `F62`'s distinct failure
alert shipped with it. **§6 and §13 are also both closed** (2026-09-15, `B11`) — all 27 filter fields
are read now, with no client change. **`F60` is also fixed** (2026-09-15) — the one filter-field rename
the client owned, since the server grew no `year`/`month` alias; its timeline verification step is the
only thing still waiting on `F61`. `F65` and `F66` are independent of everything.
~~`FW19` and `FW20` are two repos and independent of each other; `FW20` needs a **decision** before an
edit (word-boundary matching keeps zero-config; opt-in changes every app's tables) and its verification
must include the framework's own `JobRunHistory` and every `DataTable` consumer in this app, because
loosening the match can drop a column that was formatting correctly by luck. **Do not add per-table
slots app-side as a workaround for `FW20`** unless the framework declines — the collision class is
"any key containing `ratio`/`rate`/`vat`/`date`/`sum`/`fee`", and `elevated` contains `vat`.~~ **Both
closed.** `FW20` landed 2026-09-23 as whole-word matching plus an optional `TableColumn.format`. A
column the name guesses wrong now gets a `format`, not a slot.

**The three new escalations gated three verifications.** `F63`'s *Verify* step 3
(no request fires on an empty form) holds without them; `F62`'s pass condition needed §12, and both
closed together 2026-09-15; `F60`'s needed nothing (the server already read the renamed fields) and it
is now fixed and verified, ~~**except** its timeline step, which `F61` blocks~~ — `F61` landed 2026-09-21
and the timeline step held (July and August 2026 shaded, the other twenty months empty); and
`leisure-backlog-picker/X1`'s *Verify*
block ~~is unrunnable until §13 lands, because the filter it tests has never existed on the wire~~ —
**§13 landed 2026-09-15 (`B11`), so the block is now runnable as written** against a backend build
carrying it.

**Order among the unit-1/2 mutation-round batches.** `F8` is rewritten from the root and is now
`med`, not `low-med`: read the whole batch — round 1's fix (a loading branch in `NowBar`) is still in
it but is now the *smaller* half, and applied alone it changes nothing the mutation pass observed,
because the state it hides is permanent, not transient. `F59` is independent of `F8` and touches the
same two files; ship `F8` first so `F59`'s verification is not fighting the race. `F58` is independent
of everything and is the cheapest item in this queue after `F38` — an import replacing a hand copy.
`F19` has grown by one line and no new work: `B8` closes because the generic dialog goes. `FW19` should
land **before** `F19` is verified — its verification reads a 409 snackbar, and today that snackbar is
the generic string on every table in the app.

**Order among the unit-8 batches.** ~~`F50` first and alone — it is the unit's only *observed* blocker
and a one-file change, and **it does not wait on `FW18`**: the second fan-out (`fetchFiltered`) already
has a `requestKey`, and the first (`fetchById`) can be sequenced or given a second instance today
(the workaround `A1`'s Part 2 catalogues); when `FW18` lands, the pointer-bump commit swaps that
workaround for a key, the same shape as `FW11`/`F39`. **Read the whole batch before editing the
dialog** — the finding's suggested fix moves the `CanceledError` from `:120` to `:122` and the dialog
stays empty.~~ **`FW18` and `F50` landed 2026-09-23, `FW18` first**, so the dialog never carried the
workaround. ~~`F51` is the other blocker and the only batch here that needs a resize to verify; its fix
lands in the shared shell, so **drive `/day-planner/:date` at 390 px in the same session** — unit 7
never resized, the day view's mobile layout is a different shape (`DayPlannerView.vue:3` has no
`flex-column`), and `X2`'s *Expected* assumes it works.~~ **`F51` closed 2026-09-23** — its code had
landed in `fcd8050d`; both planners were driven at 390 and 1024, `/day-planner/:date` included. ~~`F56` before `F51`'s verification if both run in
one session: `F51` adds the reopen control that `F56` then has to name — decide the label once.~~
**`F56` landed 2026-09-22, so the label is already decided:** `F51`'s reopen control reuses
`planner.a11y.openPanel` / `closePanel` (branched on `panelOpen`, as `DayPlannerHeader`'s `bars` toggle
does) and mints nothing. ~~`F52`,
`F53`, `F57` are one-file edits, independent of everything; `F53` before the unit's **mutation pass**,
which will otherwise file the lost-input defect a second time from the create path.~~ **All three
closed 2026-09-23** — their code had landed unannounced in `fcd8050d`; the mutation pass is unblocked.
`F54` and `F55`
are the `F42` and `F43` shapes on the template side and should ship **after** their siblings, copying
whatever those settle (query codec; not-found treatment) rather than deciding it a second time.
~~`FW18` is independent, additive, and two repos.~~

**Order among the unit-5 batches.** `F46` first and alone — it is a two-file, three-attribute change
and it decides the **one locale key** every detail-panel close button will share, which `F47`'s new
Android panel then reuses rather than minting a fourth. `F48` before `F47`, or in the same commit:
both edit `AndroidPieChartSection.vue`, and `F48` changes what the pie section *shows* (no radio) while
`F47` changes what it shows *when something is selected* — landing `F47` first means writing a detail
panel beside a radio that is about to disappear. `F48`'s timeline half is a separate file and a
separate prop and can ship on its own day. `F49` is independent of everything and is the one that
should **not** be scoped to this module: its `todoList` and `dayPlanner` call sites are the same edit,
and a fixing session that names the range-picker chips `radio` and leaves the priority chips and the
repeating-task day toggles as bare `span`s has fixed the symptom the unit saw and not the class. None
of the four needs a seed change; `F46` and
`F48` need the SK locale as well as EN. ~~**Run `U1`'s retest in `F27`'s verification session** — `F27`
copies this module's error pattern, and `U1` is the record that nobody has watched that pattern fail
in a browser yet; `playwright-cli route "**/api/activity-tracking/web-extension/pie-chart" --status=500`
settles both in one reload (*Needs verification*).~~ **Done 2026-09-23** — `U1` closed in `F27`'s
session; body in the log under *Closed verification items*.

**Order among the unit-7 batches.** `F41` and `F42` are one file (`DayPlannerSettingsView.vue`), both
trivial, independent of everything; ship them in one commit if convenient, but `F41` alone is a
one-line hotfix and should not wait on `F42`'s design (query vs. route param). `F43` is independent and
needs no browser beyond three URLs. **`FW16` before `F44`, and `F44` rides in the pointer-bump commit** —
the same shape as `FW11`/`F39`: a codec for state the grid does not expose changes nothing visible.
`FW15` and `FW2` edit the same file (`MyDateInput.vue`) — one `vue_framework` commit may carry both if
its message says so, but they close different findings for different reasons (a label bound in the
wrong order vs. no label at all) and stay two batches. `FW15` **breaks one draft assertion** on purpose
(`history-review.draft.spec.ts:28` pins the defect) — fix the spec in the pointer-bump commit. ~~`FW17` is
independent of everything, CSS only, and is the one that un-`fixme`s two existing specs; run
`dayPlanner.spec.ts` after the pointer bump rather than driving it by hand.~~ **`FW17` landed
2026-09-23** (`b4eb068`, bump `3067d954`). The two "existing specs" were empty `fixme` stubs, so the bump
wrote their bodies too.

**Order among the unit-15 batches.** *(2026-09-23: `FW9`, `FW11` + `F39`, `FW8` folded into `FW12`,
`FW21` and `FW13` all landed in this order. `F40` and `FW7` are what is left. The paragraph is kept
for the record.)* `FW9` first and alone — it is the sweep's only open `blocker`, it
adds a route table entry and a view, and until it lands no other auth batch's verification can
include the forgotten-password path. **Read the whole batch before editing `ForgottenPasswordView`**:
the token fix the finding asks for is one line, and applied on its own it moves the failure from a 400
on the first screen to `F20`'s blank page on the second. `FW11` and `F39` are two halves of one
behaviour (`auth/B1`) split by rule 1: `FW11` (framework, the read side) works today with the
interceptor's existing `?redirect=` write and ships first; `F39` (app, one line) rides in the
pointer-bump commit, because a guard that writes `redirect` into a login view that ignores it changes
nothing visible. `FW12` edits the same two lines `FW8` recolours (`ConfirmEmailView.vue:21`,
`ConfirmEmailChangeView.vue:20`) — land `FW8` first or fold it into `FW12`'s commit, never the reverse.
`FW13` **before the unit's mutation pass**: that pass has to submit the registration form, and today it
cannot, locally, for the reason `FW13` removes; it also makes `U1` and `U5` observable, so the retest
that follows `FW13` should run their *What would settle it* rows in the same session. `F40` is
independent of everything and needs no browser beyond a logout with the console open. `FW7`, which now
closes two of this unit's findings too, has not moved — but its verification block gains `/login` and
`/registration` as places to look.

**Order among the unit-4 batches.** `F35` first, and decide its shape before touching a locale file:
if the deep-merge is chosen, the `secondsShort` line is never written and `F4`'s `general.yes`/`general.no`
become real keys for free (§55); if the patch is chosen, `F4` must add its own two lines. `F36` and `F37`
touch different files and are independent; `F37` before the unit's **mutation pass** runs, because that
pass will exercise edit mode and file the pencil-hides-the-chip defect a second time otherwise. `F38` is
independent of everything and is the cheapest item in this queue — but turn the lint rule on *first*,
then fix what it reports, so the count is measured rather than trusted. None of the four needs the
Slovak locale to verify; `F35` needs both.

**`F36` does not change the framework default (rule 4).** The batch sets `allowedMinutesSelected="1"` at
this module's duration fields and stops. Whether `TimePicker`'s default of `'5'` is right for a
component used for both times-of-day and durations, and whether a snap should ever be silent, is a
`vue_framework` decision — raised under *Needs verification* alongside the minute-60 overflow this pass
found in the same function, because that one needs ten seconds in a browser before it is a batch.

**Order among the unit-14 batches.** `F33` is the only one whose *verification* is blocked — the
end-to-end pass needs all three parts of §9 on the server — but its *change* is not: the request body
can be asserted today (see the batch). Do it before §9 lands, or the first real OAuth round trip after
the server fix will fail on the client and get filed as a fourth backend bug. `FW7` and `FW8` touch
the same module and can ship in one `vue_framework` commit if the message says so; `FW7` is the one
that needs a look at every sign-in form in every app, `FW8` is six colour tokens. `F34` is one token,
independent of everything, and must **not** be folded into `FW8` (rule 1 — the same split as `F4`/`FW2`).

**Order among the unit-3 batches.** ~~`F27` first if any of the others is going to be verified in the same
browser session — it is the only one that changes what a *failed* request looks like, and `history-review/U1`
(the empty-state check) is only meaningful once "empty" and "failed" are distinguishable on screen.~~
**`F27` landed 2026-09-23** (`f42b3b3a`), and `history-review/U1` ran after it the same day — it found
the first-run block unreachable on Summary/Detail (fixed, `4efbb0c9`). `F29`
before `F30`: both decide what an interactive chart element is *called*, and the two should agree on a
verb ("Highlight", "Filter to", "Open the day") before either ships. ~~`F26`, `F28`, `F32` are one-line edits,
independent of everything.~~ **`F26`, `F28`, `F32` done 2026-09-23** (trivial sweep). `F31` is independent but touches the same `HistoryPieChart.vue` a light-theme
fix would (see its *Adjacent*), so do the two together or not at all. `FW6` is a separate repo and needs
an app-side locale mirror in the pointer-bump commit — see the batch.

**`F29` edits unit 5's module.** `StackedBarColumn.vue` lives in `activityTracking/component/stackedBars/`,
which `migration-revision.md` §7 documents as shared presentation owned by a feature module (the two
`activityHistory` views import it across the module boundary, and that is the recorded gap, not a new one).
~~Unit 5 has not run; when it does, its inventory will describe the post-`F29` bars.~~ **Unit 5 has run
(eleventh pass), at `6aac48bb`, before `F29`.** Its inventory lists the stacked bars as a readable
surface (`tracking-dashboards/inventory.md:40`) and its four *Keyboard* sections name the chips, cards,
session bars and close buttons — never the bar columns — so it did not re-file `history-review/A1` from
the tracking side, and `F29`'s `/activity-tracking` verification step stands as the check that the
tracking dashboards' own click semantics survive. The inventory describes the pre-`F29` bars; say so in
the commit so nobody reads that line as a regression.

**`F24` and `F25` are independent of everything, and of each other** — different files, different causes,
both in `src/core/todoList/`. `F24` needs the SK locale to verify; `F25` does not. **Both are now applied
in the working tree** (sixth pass) and were verified 2026-09-14 (the log's *Awaiting retest* table); the note about the uncommitted `todoList`
files is moot — they are all uncommitted together now.

**Order among the unit-2 batches.** `F19` before `FW5` is *verified* — once the Roles/Categories tables
have their own `#actions` slot they no longer render `DataTable`'s default buttons, so `FW5` has to be
checked on a table that still does (`/routine-settings`). ~~`F18` first if `U4` is to be retested
meaningfully, since it removes the competing request that is the only candidate explanation.~~ **Both
done 2026-09-15** — `F18` landed and `U4` was retested in the same pass and closed. `F20`,
`F23` are independent of everything (`F21` and `F22` done 2026-09-23 in the trivial sweep).

**Order within the new batches matters.** `F12` first — until the row paints, `F13`'s delete wiring and
`U1` cannot be verified. Then `F13` before `F15` and `F16`: `F13` decides what the top filter bar does on
the Mappings tab (and whether it is even shown there), which changes what `F15` has to sync to the URL and
what `F16` has to lay out. `F14` is independent (`F17` done 2026-09-23 in the trivial sweep).

**`F4` and `FW2` are the same defect class deliberately split** (batching rule 1): an unnamed icon control in
`src/core/leisure/` and two in `src/_common/`. The framework pair ships as a `vue_framework` commit plus a
pointer bump; the app one does not. Do not let a fixing session merge them. **`F4` landed 2026-09-22 and
`FW2` did not** — the split held. `FW2` should follow the convention `F4` set (log, `## F4`): bound
`:aria-label` on a control, `d-sr-only` text beside a click-less `VIcon`, which is `aria-hidden` in
Vuetify's own markup.

---

<!-- F1 (the view-mode toggle loses `view=table` to a URL-write race — leisure-projects/B1) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F2 (every board-mode filter change fires two competing grid requests through one AbortController — leisure-projects/B2) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F5 (non-active readiness-status buttons on the board are effectively invisible — leisure-projects/A3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F6 (a dead class="flex-1-1" on four FilterPanel call sites logs a Vue warning on every render — leisure-projects/P1, leisure-backlog-picker/P1 (round 1)) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F7 (RoutineTodoWidget's header controls clipped off-screen at a common desktop width — home/B1) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F8 (sign-in race orphaned the day-plan fetch — `home/B2`, settles `home/U1`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F9 (`homeUiStore` never persists; CLAUDE.md said the opposite — home/B3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F12 (Mappings table body 0 px tall — `tracking-settings/X1`) and F13 (Mappings tab: dead filter and dead delete — `B1`, `X4`, `B7`) fixed 2026-09-22 — bodies moved to _fix-queue-log.md → Closed batches. Numbers retired, not reused; the summary table keeps their ✅ rows. -->

<!-- F14 (tabbed routes get the wrong breadcrumb and sidebar highlight — tracking-settings/B2, activity-settings/B6) fixed 2026-09-23, app + framework — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F15 (distinct-entries and Mappings filter/page/sort not in the URL — `tracking-settings/B3`) fixed 2026-09-22, the Mappings half with F13 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F17 (CLAUDE.md's "every settings page" sentence — tracking-settings/P1) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F19 (Roles/Categories delete gating and cascade confirmation, trash button name — activity-settings/B7, A1, B8) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F21 (categories "Role" column is an aggregate — activity-settings/P1) and F22 (activities filter bar clips "Categories" — activity-settings/P2) fixed 2026-09-23 — bodies moved to _fix-queue-log.md → Closed batches. Numbers retired, not reused; the summary table keeps their ✅ rows. -->

<!-- F23 (parallel playwright-cli sessions must not share one storage-state file — activity-settings/U3) fixed 2026-09-23, docs only — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F26 (period-total banner has a zero flex-basis — history-review/B1) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F27 (history dashboards have no error state — history-review/B2) fixed 2026-09-23 in f42b3b3a, with two defects found during verification fixed under it (detail double-fetch from the 23:59 default; "1 Jan" on single-day empty bars, 8c809cf2) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F28 (`/activity-history/detail` breadcrumb reads "Home › Summary" — history-review/B3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F31 (pie legend overlaps the donut; `isNarrow` was a dead prop — history-review/P2) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F32 (`/activity-history/calendar` has no `<h1>` — history-review/P3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F33 + F34 (Google Calendar: send `state`; `errorDark` on the Disconnect button) fixed 2026-09-21
     together with the frontend half of `B14` (§9). Bodies in _fix-queue-log.md → Closed batches. -->

<!-- F36 (typed durations snapped to 5 minutes — eight `<TimePicker>` tags in `activityHistory` — history-capture/B2) fixed 2026-09-24 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F37 (preset chips' `#close` slot rendered a live "Close" button that swallowed the edit pencil — history-capture/B3 + the unfiled chip-role A1) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F39 (the auth guard's redirect drops the destination — `auth/B1` write half) fixed 2026-09-23 in `7a612d7f` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F41 (settings tabs stacked — `d-flex` on a `VTabsWindowItem` beat `v-show` — `planner-day/B1`) and F42 (settings tab not in the URL — `planner-day/B6`) fixed 2026-09-22 — bodies moved to _fix-queue-log.md → Closed batches on 2026-09-23. Numbers retired, not reused; the summary table keeps their ✅ rows. -->

<!-- F44 (calendar Days to show and Range/Duration configuration in the URL — `planner-day/B3`, app half) fixed 2026-09-23 in FW16's pointer-bump commit — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. The Back-button gap it surfaced was filed and fixed as F86 the same day. -->

<!-- F46 (pie-chart detail panel close button — one `pieChart.closeDetails` key on all four, `mdi-close` → `fas fa-xmark` — `tracking-dashboards/B1`, `A2`) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F48 (Android pie's no-op Total/Active/Background radio + the timeline's always-empty Background legend entry — unfiled) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F50 (the Compare Templates dialog is empty every time — two unkeyed fan-outs — planner-templates/X1, B3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F51 (template planner side panel at <md squeezed off-screen, no reopen control — planner-templates/X2) fixed 2026-09-23: the prescribed parts landed unannounced in fcd8050d (the F42 commit), the not-found alert's missing toggle in bd16953c — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F52 (template card title row — the name never truncated — `planner-templates/B1`) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F53 (the template form mirrored none of the API's contract — `planner-templates/B2`) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F54 (template list sort and the split view's picks not in the URL — `planner-templates/B4`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches on 2026-09-23. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F57 (the Scheduled Days picker clipped to Mon–Fri in the 400 px template panel — `planner-templates/P1`) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

---

<!-- F59 (a skipped task rendered as done and its checkbox completed it — `home/B4`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. The skip-reason backend gap it surfaced is recorded in the log entry. -->

<!-- F64 (the picker read an empty weather set as "nothing fits", and badged every "None" row — `leisure-backlog-picker/X2` (round 1), `B1` (round 2), `P2`) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. The badge half needed API `e50bd3c` (`weatherDependencyCode` on the backlog row). -->

<!-- F66 (`boolChip` defaulted the false icon to the true one, so four ✗ chips wore a check — `leisure-bucket-anchors/P1`) fixed 2026-09-23 in `d08a6e90` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F68 (the manual-entry form double-POSTed and never advanced "when", so a second click or a second save was a 409 — `history-capture/B6`) fixed 2026-09-23 in `d08a6e90` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F69 (deleting a to-do item never confirmed, whatever `askBeforeDelete` said — the sixth delete site bypassed `useDeleteConfirmation`; `todo-lists/B7` + the routine twin) fixed 2026-09-23 in `723c48ec` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F70 (*Move to list* called `PATCH /move/{id}/{dest}` against a server route that is `PATCH /{id}/move` + body — `todo-lists/B8`) fixed 2026-09-22 in `1bb9ae06` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F72 (`useMappingSettings.saved()` dropped mode and `isActive`, validated nothing, and overwrote the interceptor's snackbar — `tracking-settings/X2`, `X3`, `B6`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW1 (MyDialog persistent by default, so Escape closed nothing — `_shell/A1`) step 1 fixed 2026-09-23 in vue_framework `90b80e6` (bump `8739d08f`): confirmations and input-less dialogs close on Escape, forms stay persistent; step 2 (flip the default with a dirty-check guard) deferred to the central dialog opener — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW2 (six framework icon-only controls with no accessible name — AppTopBar, FilterPanel, MonthYearPicker, MyDateInput) fixed 2026-09-23 in vue_framework `5397675` with FW5/FW6/FW7/FW15 (bump `a7dbfda0`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW3 (Time.fromJson could not parse the backend's string shape) closed 2026-09-13 — body in _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW4 (DataTable/BasicTable's definite-height flex-parent contract was undocumented) fixed 2026-09-23 in vue_framework `b4eb068` with FW17/FW22 (bump `3067d954`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW5 (DataTable's default row actions render the internal slug, not the localized label) fixed 2026-09-23 in vue_framework `5397675` with FW2/FW6/FW7/FW15 (bump `a7dbfda0`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW6 (CalendarGrid's day cells are click-only divs with no accessible name, role, tabindex or key handler) fixed 2026-09-23 in vue_framework `5397675` with FW2/FW5/FW7/FW15 (bump `a7dbfda0`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW7 (every password field's visibility toggle is named "{label} appended action"; passwordsDontMatch is a raw key) fixed 2026-09-23 in vue_framework `5397675` with FW2/FW5/FW6/FW15 (bump `a7dbfda0`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW8 (six elevated buttons on the tonal/outlined tokens — `user-settings/P1`) fixed 2026-09-23, folded into FW12's framework commit `549ae02` (bump `a0f116a9`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW9 (the forgotten-password flow cannot complete — `auth/X1`, `auth/B3`) fixed 2026-09-23 in `vue_framework` `0d83a88` (bump `b7423bc2`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW11 (post-login redirect, read half — `auth/B1` read half, `auth/P3`) fixed 2026-09-23 in `vue_framework` `8dbb5ff` (bump `7a612d7f`, which carries `F39`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW12 (both confirm-e-mail views' error states are a lone button — `auth/B4`, `auth/B5`, settles `U6`) fixed 2026-09-23 in `vue_framework` `549ae02` with `FW8` folded in (bump `a0f116a9`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW13 (registration fails closed on an empty reCAPTCHA token, and its `catch` overwrites the server's message — `auth/O1`, `auth/P1`) fixed 2026-09-23: guard half `vue_framework` `6157283` (2026-09-15), the rest `37773f3` (bump `4f7391cb`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW14 (registration's 2FA recovery codes discarded) landed 2026-09-21 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused. -->

<!-- FW15 (MyDateInput binds $attrs before its own :label/hideDetails, so a caller's values are discarded) fixed 2026-09-23 in vue_framework `5397675` with FW2/FW5/FW6/FW7 (bump `a7dbfda0`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW16 (CalendarGrid's Days to show and DateRangePicker's mode/range configuration private — `planner-day/B3`, framework half) fixed 2026-09-23, pointer bump carries F44 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW17 (ActionBar centred on the viewport, so Delete slid under the nav drawer) fixed 2026-09-23 in vue_framework `b4eb068` with FW4/FW22 (bump `3067d954`, which also un-fixmes and writes the two dayPlanner.spec.ts delete specs) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW18 (useEntityQuery.fetchById cancels a sibling id — the framework half of planner-templates/X1) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

---

<!-- FW19 (extractServerMessage read the generic `message` before the `errors` map) landed 2026-09-21 in vue_framework 4ab7e61 with FW24, bump adaae452, unrecorded; verified live 2026-09-23 (role-colour 400, time-period 400, system-role 409) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW20 (useTableFormatters' substring heuristics — `durationMinutes` a percentage, `inspirationSource` a dash) fixed 2026-09-23 in vue_framework `e6f4b68` (bump `8739d08f`): whole-word matching plus an optional `TableColumn.format` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW21 (the interceptor's `AUTH_ENDPOINTS` list names none of the signed-out routes — `auth/B7`) fixed 2026-09-23 in `vue_framework` `2351ce7` (bump `a0f116a9`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->


<!-- F74 (`quickEdit` called `PATCH /activity/{id}/{mode}`; the server has `PUT …/quick-edit` and `POST …/clone` — `planner-day/X1`) fixed 2026-09-22 in `eb13eb1a` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F75 (`viewEndDate` resolved an 08:00 → 00:00 day to *today* at midnight, so plan-vs-actual gave a verdict all day — `planner-day/B7`) fixed 2026-09-23 in `d08a6e90` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->



<!-- F80 (board card metadata runs two fields together — leisure-projects/P2), F81 (`calendar-range` is a Pro-only icon — planner-day/P1), F82 (Importance required but unmarked — planner-day/P2) and F83 (template header count omits background tasks — planner-templates/P3) fixed 2026-09-23 — bodies moved to _fix-queue-log.md → Closed batches. Numbers retired, not reused; the summary table keeps their ✅ rows. -->

<!-- FW22 (TableCellEditor's DECIMAL cell rounded to whole numbers — no consumer in this app) fixed 2026-09-23 in vue_framework `b4eb068` with FW4/FW17 (bump `3067d954`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW23 (a second header click adds a sort key — `leisure-backlog-picker/P1`) decided (b), keep multi-sort, and closed 2026-09-23 with no change: the numbered badges were already there on every sorted key — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->


<!-- F84 (the history pie rendered the `_other` roll-up raw in the legend and let it be selected — unfiled, from §10's closure) fixed 2026-09-23 in `d08a6e90` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->


<!-- FW24 (B18's frontend half — word each 409/403 by errorType) landed 2026-09-21 as vue_framework 4ab7e61 (bump adaae452, unrecorded at the time), verified live 2026-09-23 with one gap fixed (a field-keyed errors entry now wins over the typed DB-409 wording, vue_framework bc96068) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F85 (the two routine-settings `_silent` 409 sites narrowed to errorType) landed 2026-09-21 in adaae452, unrecorded; verified live 2026-09-23 (name race, length race, blocked delete of Daily) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F86 (Back/Forward on /day-planner moved the URL but not the grid — found verifying F44) filed and fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW25 (three hydrations per settings visit racing a step-up write; grew user-settings/B4, the sign-out on a wrong step-up password) filed and landed 2026-09-21 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused. -->

<!-- F87 (the day header's task total stayed stale after a delete — planner-day/B8) filed and fixed 2026-09-24, uncommitted: one debounced watcher re-reads the day's counts from the server after any change to its tasks; the three local recounts are gone — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F88 (the split view at desktop width left each template's grid ~100 px — found closing planner-templates/U2) filed and fixed 2026-09-24, uncommitted: the planner decides its layout from its own width (`usePlannerLayout.ts`), and a narrow planner floats the side panel over the grid instead of beside or above it — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F89 (the `D` shortcut sent `{ status }` to the time-span endpoint and 400'd on every task) filed and fixed 2026-09-24, uncommitted: `D` now opens log time to complete (no other key opens that dialog), and sets completed tasks back to not started — both through the selection bar's own paths; the store's broken `updateTaskStatus` is deleted — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F90 (no toggle group exposed its selected option or its name — found closing the ConstraintBar keyboard row) fixed 2026-09-24, uncommitted: the framework's new `MyBtnToggle` (role="group", a required `label`, `aria-pressed` synced from Vuetify's active class) replaces all 31 `VBtnToggle` uses — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## Escalations (backend / outside this repo)

> **Written as backend prompts 2026-09-15** — every open entry below now has a file in
> `prompts/view-docs/backend/`, numbered from `B10` in order of what it blocks. Edit the file, not the
> paragraph, when the ask changes; the paragraph stays as the evidence trail. Once an ask lands **and**
> its frontend half (if any) is done, the paragraph is deleted from here and its body moved to
> [`_fix-queue-log.md`](_fix-queue-log.md) → *Closed escalations*; the § number is retired, never reused,
> so the gaps below are load-bearing for every cross-reference.
>
> | § | file | § | file |
> | --- | --- | --- | --- |
> | ~~§11~~ | `_done/B10-…` — landed, body in the log | ~~§10~~ | `_done/B16-…` — landed, body in the log |
> | ~~§6 + §13~~ | `_done/B11-…` — landed, body in the log | ~~§15~~ | `_done/B17-…` — landed, body in the log |
> | ~~§12~~ | `_done/B12-…` — landed, body in the log | ~~§7~~ | `_done/B18-…` — landed 2026-09-21 (API `cd0a252`), frontend half (`FW24` + `F85`) verified 2026-09-23, body in the log |
> | ~~§14~~ | `_done/B13-…` — landed, body in the log | ~~§8~~ | `_done/B19-…` — decided and landed 2026-09-21, frontend half the same day, body in the log |
> | ~~§9~~ | `_done/B14-…` — landed 2026-09-21 (API `1e0dc3b`), frontend half the same day, body in the log | ~~§5~~ | `_done/B20-…` — landed, body in the log |
> | ~~§1~~ | `_done/B15-…` — landed 2026-09-21, verified, body in the log | ~~§3~~ | `_done/B9-routine-untick-streak-decision.md` — answered, body in the log |
> | ~~§16~~ | `_done/B21-…` — landed 2026-09-21, frontend half the same day, body in the log | ~~§17~~ | `_done/B22-…` — landed 2026-09-21 as option (b), frontend half and the spec the same day, body in the log |
> | ~~§18~~ | `_done/B23-…` — landed 2026-09-21 (API `c00e64d`), frontend half the same day (`c2075f61`, with `F47`), body in the log | ~~§19~~ | `_done/B24-…` — landed 2026-09-21 (API dev, uncommitted at the time), frontend half the same evening with `F16` folded in, body in the log |
> | ~~§20~~ | `_done/B25-…` — landed 2026-09-21 with the decision taken (the code that trips the lock answers `UserLockedOut`), frontend half the same day, body in the log | ~~§21~~ | `_done/B26-…` — landed 2026-09-22 (API dev), verified end to end 2026-09-23, no frontend half, body in the log |
> | ~~§22~~ | `_done/B27-…` — written and landed 2026-09-24, frontend half the same day, verified live, body in the log | | |
>
> **Every landed or answered ask lives in `backend/_done/`** (corrected 2026-09-21 — this table said
> `_implemented/` for seven of them, a directory that exists and is empty). A landed ask whose frontend
> half is still open (none today; `B18` was the last, closed 2026-09-23) is also in `_done/`; the open half is tracked by its `FW`/`F` batch, not by
> the file's location.
>
> **The fifteenth pass added none**, out of 23 new findings — the first pass since unit 3 to add zero.
> That is not because nothing looked server-side: four findings were filed or guessed as backend gaps
> and three of the four were disproved by reading the API this pass. `planner-day/X1`'s missing
> `/Overwrite` route exists as `PUT …/quick-edit` (`F74`); `leisure-backlog-picker/X1 (round 2)`'s
> "contract question" was already answered empirically by its two sibling units (`F73`);
> `planner-day/B8`'s "denormalized counter" is computed live in SQL, so the premise is wrong and the
> finding moves to *Needs verification*, not here. The fourth, `leisure-bucket-anchors/B1`, is a stale
> local backend build — see *Needs verification*. **Read the API source before writing an ask**;
> three of four is not a fluke, and each of these would have shipped as a `B2x` prompt file.

<!-- §1 (notification text ignores the account locale — `_shell/B1`) closed 2026-09-21: `B15` landed as Option A (API `830cad6`), verified in the browser the same day, and there was no frontend half. The bell composes text on every read, so it follows the account's *current* locale — better than the "locale at dispatch" rule the ask settled for. Body in _fix-queue-log.md → Closed escalations. Number retired, not reused. -->

<!-- §2 (routine time period delete — Restrict, not cascade) resolved 2026-09-13; §3 (untick/streak decision) answered 2026-09-15 (API 4ab3710); §4 (activity contract — nested role/category, client half shipped as F3) resolved 2026-09-13. Bodies in _fix-queue-log.md → Closed escalations. Numbers retired, not reused. -->

<!-- §5 (grid sort keys — B7's unknown-key class 2026-09-13, B20's non-scalar-member class 2026-09-15) closed 2026-09-15: both asks landed and there was no frontend half left. Body in _fix-queue-log.md → Closed escalations. The convention it leaves behind — a sortable TableColumn over a lookup emits the `.text` leaf, not the object — is now a reminder, not a trap: getting it wrong is a 400 the interceptor shows. Number retired, not reused. -->

<!-- §6 + §13 (five grid filters — the client sent 27 field names the server never declared) closed 2026-09-15:
     `B11` landed on `dev` and there was no frontend half — all five filter classes already carried the
     adopted names, verified by inspection. Body in _fix-queue-log.md → Closed escalations. Both numbers
     retired, not reused. Two things it leaves behind: an **empty list is "no opinion"**, not "match
     nothing" (pinned by a test), and `GridFilterFieldNameTests` posts each field as a raw camelCase JSON
     property, so adding a member to one of the five records means adding a case there. `F18` and `F60`
     were unaffected and still landed app-side; both are now fixed (2026-09-15). `F18`'s verification was
     the first that could check the *table* rather than only the request body, which is what finally
     showed a `?roleIds=` bookmark working end to end. -->


<!-- §7 (four different 409s shared one sentence — the error type never crossed the wire) closed 2026-09-23:
     `B18` landed 2026-09-21 (API `cd0a252` + the same-day follow-up), and both frontend halves — `FW24`
     (framework) and `F85` (routine-settings call sites) — had shipped the same day unrecorded and were
     verified live 2026-09-23, with one gap fixed on the way (a field-keyed `errors` entry now wins over the
     typed DB-409 wording, `vue_framework` `bc96068`). Body in _fix-queue-log.md → Closed escalations.
     Number retired, not reused. -->

<!-- §7 was the last open escalation. -->



<!-- §8 (public-holiday names — `history-review/B4` + `planner-day/B4`) closed 2026-09-21: `B19` was
     decided on `dev` @ `fee54a1` — half 1 (a country preference) declined, half 2 (localised names)
     shipped as a stable `holidayKey` next to the unchanged `holidayName` — and the frontend half
     landed the same day (framework `useHolidayLabel()` + `calendar.holidays` table app-side; `calendar`
     joined the locale deep-merge). `planner-day.draft.spec.ts`'s `fixme` is a passing test. Body in
     _fix-queue-log.md → Closed escalations. Number retired, not reused. -->

<!-- §9 (Google Calendar OAuth cannot complete — `user-settings/B1`) closed 2026-09-21: `B14` landed all
     three server-side stops (API `1e0dc3b`, framework `23e13fe`) — `configured` on `GET …/status`, 503
     `ServiceNotConfigured` from `…/auth-url`, the redirect URI derived from the page URL, the state
     cookie re-scoped to the `/api` prefix, and `errorType` on the three hand-rolled 400s — and the
     frontend half (`F33` + the `configured` branch + `F34`) landed the same day. The real Google round
     trip still needs the redirect URI registered in the console (ops). Body in _fix-queue-log.md →
     Closed escalations. Number retired, not reused. -->

<!-- §10 (two sentinels for one folded-tail row: the four pie endpoints said "Other", the four stacked-bars
     ones "_other", and the client understood only the second) resolved 2026-09-16 — backend landed `B16`
     (`FoldedRow.Sentinel`, one constant for all seven folding endpoints; the pie endpoints' wire value is
     now `_other`), frontend half landed the same day: `F47`'s local guard was deleted before it was ever
     written, `OTHER_DOMAIN` replaced the eight scattered literals in `component/pieChart/`, and the
     double-fold collision the rename surfaced was closed in **two** sections, not the one §10 named
     (`ActivityPieChartSection` **and** `UnifiedPieChartSection` both bucket locally at 3 %). Body in
     _fix-queue-log.md → Closed escalations. The backend's out-of-scope flag on the History slice was stale
     — `HistoryPieChartBuilder.OtherName` is already `"_other"` — but the History *client* renders that
     sentinel raw; filed as `F84`, app-side, no backend half. Number retired, not reused. -->

<!-- §11 (colour validator demanded hex; the palette on both sides is names) resolved 2026-09-16 — backend
     landed `MustBePaletteColor()` + the `Color` 7→20 widening migration, frontend half landed the same day
     (`required` on the three pickers, `color: string = 'blue'` in the three request DTOs, and the
     `??= 'default'` line deleted from `useTodoListCategories.ts`). Verified live: the no-change Edit is a
     200 and Create with the picker untouched is a 201. Body in _fix-queue-log.md → Closed escalations.
     Nothing left open: the one transient — `"burgundy"`, the only 8-character swatch, answering
     `generalErrors: ["Data too long during Create"]` — was an API process predating the migrate; the owner
     confirmed `Color` is `character varying(20)` in the DB the same day. Number retired, not reused. -->

<!-- §12 (anchor-eligible-activities endpoint missing) resolved 2026-09-15 — landed in AdhdTimeOrganizer
     on `dev`, frontend half shipped as F62. Body in _fix-queue-log.md → Closed escalations. Number
     retired, not reused. -->

<!-- §13 closed 2026-09-15 together with §6 — same defect class, same ask (`B11`), one body in
     _fix-queue-log.md → Closed escalations. See the §6 + §13 tombstone above. Number retired, not reused. -->

<!-- §14 (auth/B6, unconfirmed login answered 401) resolved 2026-09-15 — body in _fix-queue-log.md → Closed escalations. Number retired, not reused; the list below keeps its source numbering. -->

<!-- §15 (history-capture/B4, POST /activity-history accepted a zero-length row) resolved 2026-09-15 — body in _fix-queue-log.md → Closed escalations. Number retired, not reused. The validator is now `Length.TotalSeconds > 0` on both POST and PUT; it decided `F67`'s (a)-vs-(b) question as **(a)**, which is recorded in `F67` itself. -->

<!-- §16 (auth/U4, the lockout 403's remaining time only inside an English sentence) resolved 2026-09-21 —
     backend `B21` landed `lockoutEndUtc` on the `UserLockedOut` 403 (Sydowwe.Framework, on the API's
     working tree at time of writing); frontend half the same day. Body in _fix-queue-log.md → Closed
     escalations. Number retired, not reused. -->

<!-- §17 (auth/U2, no spec could reach the 2FA login dialog — the TOTP secret only left the server as a PNG)
     resolved 2026-09-21 — backend `B22` landed option (b), `sharedKey` beside `qrCode` on every route that
     returns `TwoFactorAuthResponse` (framework `6ade033`, host `74318d1`; no fixture change, `e2e-v4` stays).
     Frontend half the same day: `QrCodeFor2FABody` renders the key as the manual-entry fallback, and — found
     on the way — `SecuritySection`'s enable path now opens that body at all (it showed only the recovery
     codes), and its reset path no longer discards the codes the reset regenerates. Spec:
     `e2e/tests/two-factor.spec.ts` (`otplib`), which also gives `user-settings/U1` its enrolment half. Body in
     _fix-queue-log.md → Closed escalations. Number retired, not reused; the list below keeps its source numbering. -->

<!-- §18 (tracking-dashboards/B2 as narrowed by §79 — an Android per-app detail read, the sibling of desktop's
     process-details) resolved 2026-09-21 — backend `B23` landed `GET /activity-tracking/android/app-details`
     exactly as asked (API `c00e64d`); frontend half the same afternoon (`c2075f61`) with `F47` folded in.
     Body in _fix-queue-log.md → Closed escalations. Number retired, not reused. -->

<!-- §19 (tracking-settings/B5, re-graded opportunity in §103 — the distinct-entries grids should say which rule
     already covers each tuple) resolved 2026-09-21 — backend `B24` landed `coveredBy` on both `/grid` rows and
     `coverage` on both filters exactly as asked, with the Android question answered (rules apply to nothing at
     ingest today; the chip there means "would match"); frontend half the same evening with `F16` folded in.
     Body in _fix-queue-log.md → Closed escalations. Number retired, not reused. -->

<!-- §20 (the 2FA login's lockout 401 carried neither the type nor the instant — `B21`'s declined follow-on)
     resolved 2026-09-21 — backend `B25` landed all three parts: the type on every 2FA-login 401
     (`Unauthorized` / `UserLockedOut` / `InvalidTwoFactorAuthToken`), `lockoutEndUtc` on the lockout row,
     and the decision taken as *yes* — the code that trips the lock answers `UserLockedOut`. The correction
     was confirmed live (the 401 carried no type at all), and the mechanism was fixed at the root: a typed
     `Send.ErrorsAsync` overload plus a Roslyn guard over every `if (x.Failed)` branch, 18 sites migrated.
     Frontend half the same day, in the submodule: `LoginVerifyQrCode.vue` branches on the type, and
     `resolveTypedHttpErrorMessage` has a 401 arm for `UserLockedOut`. Body in _fix-queue-log.md → Closed
     escalations. Number retired, not reused. -->

<!-- §21 (a planner task's skipReason was readable and never writable — found verifying F59) resolved
     2026-09-23: backend `B26` landed on the API's dev tree 2026-09-22 as asked, except that the PUT's
     clearing lives in UpdateEntity, not ApplyStatus. Verified end to end once the API was restarted.
     No frontend half. The day planner's Skip, which went to the span endpoint and saved nothing, was fixed
     unfiled in `d5e57027`. Body in _fix-queue-log.md → Closed escalations. Number retired, not reused. -->

**Not filed, the same pass — the wider surface `B25`'s response opened.** Every auth 4xx now carries a
type (`RecaptchaTokenInvalid` / `RecaptchaWrongAction` on the sign-in and registration recaptcha 400/403,
`Conflict` on a taken registration address, `IdentityError` on a policy refusal, `MissingArgument` on a 2FA
provisioning with no e-mail, `Unauthorized` on an expired Google code). None of them is declared client-side
yet; each is a wording decision for its own view (`LoginView`, `RegistrationView`, `SecuritySection`) and is
picked up when that view is next touched, not as a sweep. The one **status** change —
`/activity/{id}/clone|quick-edit|archived` DB refusals now 409 with the DB type instead of a bare 400 —
needs nothing: no call site special-cased those 400s, and the interceptor's typed 409 path already words
them.

**Looked at and deliberately not filed, same pass** — so the next reader does not re-derive them:
`planner-day/B8` says in its own row *"do not write a
backend prompt until that step has run"*; `TimePicker`'s `00:60` needs no server half —
`TimeDtoRules.cs` already rejects `minutes > 59` with a 400, which settles the *"may or may not normalise"*
note; and the three seed rows in *Seed-data gaps* (>25 desktop mappings, 2–3 projects across readiness
statuses, one sleep-less calendar day) all fail `e2eTestSeed.md`'s question 2 — the spec creates them
through the API, or `route`-mocks the body. One rule-1 answer found on the way: `history-review/U1`'s
first-run state needs an account with **zero** history, and `adminUser` (10003) is one — the seeder gives
it per-user defaults and nothing else (`E2eFixtureSeeder.cs:213`); no seed change needed.

<!-- §22 (template suggestions ignored what the user set on the template — B27) resolved 2026-09-24: written and landed the same day, frontend half the same day, verified live with no mocking. Body in _fix-queue-log.md → Closed escalations; the ask and the backend's response in backend/_done/B27-…. Number retired, not reused. -->

### §23 — a revoked session keeps working until its access token expires (`B28`) — **OPEN**

Found closing `user-settings/U2` (2026-09-24): after *Revoke*, the revoked session's requests stayed
**200** and only its `POST /auth/refresh` 401'd. The access token is a stateless 15-minute JWT with no
session id, and nothing checks it against the database. The same gap applies to revoke-all-others,
logout-all, password change or reset, e-mail change and account deletion (the API pins the last one in
`UserDataExportAndDeletionTests`). **Ask:** `prompts/view-docs/backend/B28-revoked-session-keeps-its-access-token.md`,
which proposes a stable `sid` claim plus an `OnTokenValidated` check against a cached revoked-session set
and a per-user cutoff. **No frontend half:** the interceptor already turns the resulting 401 into one
refused refresh and a redirect to `/login`. **Verify when it lands:** re-run `U2` with two
`playwright-cli` sessions; the revoked one's next request must be 401, then `/login`.

## Needs verification (unverified findings, and what would settle each)

<!-- "Awaiting retest" table (11 rows, todo-routine + todo-lists/B3) — every row closed by rounds 5-8; moved to _fix-queue-log.md → Closed verification items on 2026-09-15. -->

### `activity-settings` — nothing open (`U3` closed by `F23`; `U1` and `U2` by the mutation round, `U4` by the `F18` retest — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| ~~`U3` — repeated 401 → `/refresh` 401 → sign-out~~ | ✅ **closed 2026-09-23 by `F23`** (docs only), recorded here 2026-09-24. Re-graded to a runbook error, mechanism source-verified (token rotation, 5 s grace; *Contradictions* §19). `F23`'s log entry already names it under *Closes*; this row was never struck | Not an app defect, so nothing to retest. The runbook's *Parallelism* rules (`-s=` always, one signed-in state per session) are the fix |
| ~~`U4` — one *"0 of 0"* on an unfiltered request~~ | ✅ **closed 2026-09-15** — retested exactly as this row specified, after `F18` landed: three rounds of type-a-name / clear-it, reading `itemsCount` off each response rather than the rendered count. Identical every round — typed `1`, cleared `26`, two requests per round and no third. Body in the log | It did not recur, which fits the row's own reasoning: `F18` removed the only competing request this view fires. The row's escape hatch (capture the response body if it recurs anyway, because the cause would be somewhere unlooked) was not needed |

### `tracking-settings` — nothing open (the `F14` sidebar row closed 2026-09-23; `U1` confirmed by the mutation round as `X4` — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| ~~*(unfiled)* sidebar highlights *Desktop tracking* on the Mappings tab, nothing on `/activity-settings/roles`~~ | ✅ **closed 2026-09-23 with `F14`**, and the row's premise was half wrong: `SidebarNavItem.vue:52` decides only **top-level** items (so `/activity-settings/*` did follow the data fix). Children of a group are decided by `SidebarNavGroup.isChildActive`, which let *any* matching sibling suppress a child. On the tracking-settings tabs the data fix alone therefore highlighted **nothing**, not even `distinctEntries`, which the literal path used to highlight. That was a regression the data fix would have shipped. Fixed in the framework (`a29135a`, longest prefix wins). Measured on every tab afterwards | This is exactly why the row said *checked, not assumed*. The same framework fix restored the highlight on `/day-planner/templates/:id`, measured as empty without it. Body in the log under `F14` |
| ~~`tracking-settings/B5` — re-graded `bug` → `opportunity`, under *Deferred*~~ | ✅ **closed 2026-09-21** — `B24` landed; the *Rule* column and `?coverage=Uncovered` are the mark and the exclude the finding asked for (§19) | the distinct-entries grid is still the raw observation ledger by default (§103); the chip and the toggle are what say "already covered by a rule" |

### `history-review` — nothing open (`U1` closed 2026-09-23 after `F27`, `U2` 2026-09-24 — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| ~~`U1` — Calendar's and Summary's empty / first-run branches never seen on screen~~ | ✅ **closed 2026-09-23** — all three branches seen (Summary 2020 empty, Calendar 2020 placeholders, first-run on `adminUser`). **The first-run block could never render on Summary/Detail** — `checkFirstRunIfEmpty` counted empty stacked-bars windows as history; fixed `4efbb0c9`. Body in the log under *Closed verification items* | The row's "three `HistoryEmptyState`s" is two: the stacked-bars panel shows its idle block, not an empty state |
| ~~`U2` — the null-`wakeUpTime` path~~ | ✅ **closed 2026-09-24 — unreachable, premise stale.** `B2` made the DTO *"never null"* and the API's `Calendar.cs:29-30` are `required TimeOnly`. Forced with a routed body anyway: the month paints, no error, a nulled half renders `00:00` (`Time.fromJson(null)`). Body in the log (2026-09-24 sweep). Was: ~~**No seed row needed:** `playwright-cli route "**/api/activity-history/dashboard/calendar"` with a fulfilled body copied from a real response and one day's `wakeUpTime`/`bedTime` set to `null` (the CLI's `route` takes a body as well as a status — check `playwright-cli route --help` for the flag name rather than trusting this row). Pass: that cell renders without its sleep line and the rest of the month still paints~~ | ~~Source-only today; the fix it would confirm (`H1`, `Time | null` with independent rendering) is in the DTO and the cell component.~~ It is not any more — `B2` replaced it. No seed ask needed |

**Source-certain, unobserved, and carried inside batches rather than listed as findings** (each named in
its batch's *Adjacent* / *Root cause*, with a verification step): the timeline and calendar views keeping
the *previous* period's rows on a failed fetch, with an unhandled rejection (`F27`, cases 2 and 3 —
**closed 2026-09-23**, both routed to a 500 and seen in `F27`'s verification before the fix held); the
summary/domain cards being `role="button"` with no key handler (`F30`, **closed 2026-09-22**); Detail's
bars showing a pointer with no click consumer (`F29`, **closed 2026-09-22**); `HistoryPieChart`'s
hardcoded dark-theme legend colours and `isNarrow` being a dead prop (`F31`, **closed 2026-09-23**; the
colours were fixed from source, and the dark theme itself was not seen). **All of these are now
closed**, so the paragraph stays only as the record of how they were carried. None of them needed a
browser to be *believed*, since the code paths had one outcome, but each batch's verification is where
they got *seen*.

### `user-settings` — nothing open (`B2`, `U3`, `U4` closed 2026-09-24 by promoted specs, `U2` and `U5` the same day live in `playwright-cli`, `U1` by the 2FA spec 2026-09-21)

The unit's five `U` items share one cause that is not the app's: the harness's own safety classifier
blocked a `fill` on a password field, a `select` on the language combobox and (twice) a click on *Delete
account*. That is a **tooling** limit, not evidence about the app, and it does not carry over to a
Playwright spec — a spec is code, not the agent — so the cheapest settle for four of the six rows below
is to promote the matching `test.fixme` in `e2e/tests/user-settings.draft.spec.ts` rather than to
re-drive the screen by hand.

| finding | what settles it | note |
| --- | --- | --- |
| ~~`B2` — callback view "silent" on a missing `code` / `error=access_denied`~~ | ✅ **closed 2026-09-24, no defect** — promoted to two real tests in `user-settings.draft.spec.ts`: no code → *"Failed to connect Google Calendar"*, `error=access_denied` → *"Google Calendar connection cancelled"* (`F33`'s optional branch, already shipped). Both pass. Body in the log | — |
| ~~`U1` — 2FA enrollment~~ | ✅ **closed 2026-09-21** — the enrolment half ran for real, as the first test of `e2e/tests/two-factor.spec.ts` (on `secondaryUser` under `freshSeed`, reseeded after; the `account-isolation` sharing concern is what `freshSeed` + `afterAll` answer): switch → *Identity verification* → password → `POST /user/2fa/toggle` → the *Enabling 2FA* dialog (QR + `sharedKey`, `B22`) → *Done* → *Recovery codes*, *Done* disabled until acknowledged → switch checked. **What it found:** before this the enable path showed the codes and *never the QR* — the only way to pair an authenticator after enabling was *Show 2FA QR code*, which resets the key and regenerates the codes, and *that* handler discarded the codes it was sent. Both fixed in the framework the same day (§17, body in the log) | The Cancel half (switch stays off, no request) is still a one-minute check nobody has written down; it is not what made this row `unverified` |
| ~~`U2` — Revoke / *Log out of all other devices*~~ ✅ **closed 2026-09-24** (per-row Revoke; *Log out of all other devices* not clicked — another agent's session was live) | **Passed, one expectation corrected:** `DELETE /user/sessions/2` → 204, row gone, *"Session revoked"*. The revoked session's next requests were **200, not 401** — the JWT is stateless and lives out its ≤15 min (pinned by an API integration test); its `POST /auth/refresh` → **401**, which is the real kill. Body in the log (2026-09-24 sweep). Was: One form sign-in in a **second** CLI session (`playwright-cli -s=revoke-target open …/login`, creds from `seed.json`) creates the target; that is *one* sign-in, not the repeated burst the rate limit in `e2e/fixtures/auth.ts` guards against. Revoke it from the first session; expect the row gone and *"Session revoked"*; the second session's next request is a 401 that does not refresh. No reseed needed | **Adjacent, not filed:** the per-row *Revoke* is a direct call with **no confirmation** (`SessionsSection.vue:118-129`), while *Log out of all other devices* confirms through `MyDialog` (`:70-77`). Reversible (the device signs in again), so at most `polish` — decide when the control is exercised, not here. Its button is also one of `FW8`'s six |
| ~~`U3` — delete-account dialog copy~~ | ✅ **closed 2026-09-24, no defect** — promoted to a real test: the intent dialog shows the itemised warning with no password field, and Cancel closes everything with zero requests to `/user/delete-account`. The stale `fixme` text is gone. Body in the log | — |
| ~~`U4` — mismatched new/confirm password~~ | ✅ **closed 2026-09-24, no defect** — promoted to a real test: *"Passwords don't match"* renders (the key is defined now), Confirm stays enabled and sends no `POST /user/change-password`. Needs policy-valid passwords, since Vuetify shows only the first failing rule. Body in the log | — |
| ~~`U5` — language switch~~ ✅ **closed 2026-09-24** | **Seen live on the primary account:** *Slovak* → `PUT /user/preferences` 204, UI Slovak at once and after a reload; reverted by hand to English (not by reseed — that would have signed out a concurrent agent). Body in the log (2026-09-24 sweep). Was: **Mechanism settled.** `onLocaleChange` → `userStore.setPreferences({ locale })` → `await updatePreferences` + `Object.assign(currentUser, partial)` (`authStore.ts:33-36`) → `App.vue`'s deep watcher on `currentUser` → `i18n.locale.value = currentUser.locale` (`App.vue:94`). That is the **same watcher and the same store method** the unit verified live for the theme toggle (theme applies at `:88-93`, four lines above); only the final assignment is untested. Settle on `secondaryUser`, or on the primary account and reseed afterwards — the seed restores `locale: "EN"` (README *Prerequisites* §3) | The sweep-wide "must stay English" concern is real but cheap to honour: `POST /api/test/seed` is the revert |

### `auth` — nothing open (`U3` closed 2026-09-24 with a stand-in badge; the seed gap closed with `B22`, the deliberate one with `B21`; `U4` struck and moved to the log 2026-09-24)

Unit 15's round 2/3 (committed in `04c405e9`, absorbed in the fourteenth pass) closed three of the six:
`U1` is **observed** and batched (`FW14`), `U5` is **resolved** (working as coded — the prefill, the
autofocus and the resend panel all seen after a real registration), and `U6` was already settled from
source (§64 — the unit still lists it open; its round-2 detail, the 415 on a bodiless confirm post, is
folded into `FW12`). The three rows below are what is left; `U1`/`U5`/`U6`'s rows are in the log.

| finding | what settles it | note |
| --- | --- | --- |
| ~~`U2` — the 2FA login dialog (`LoginVerifyQrCode`) never exercised~~ | ✅ **closed 2026-09-21** — `B22` landed `sharedKey` beside the QR (§17, body in the log), and `e2e/tests/two-factor.spec.ts` now drives the dialog with an `otplib` code: password → dialog, wrong code → 401 + *Wrong code* inline, Escape leaves it open (a form, so it stays persistent under `FW1`'s decision), right code → 204 → `/`. The `?redirect=` line is a `test.fixme` naming `FW11`. Everything below is the pre-`B22` route map, kept for the record | Seen on the way and **fixed later the same day** (in `FW25`'s commit): a retry after a wrong code was a second 401 the dialog rendered as the same *Wrong code* — the token is single-use, so the dialog now closes on any refusal and says to sign in again |
| *(record)* `U2` as it stood | **Seed gap — and the §14 gate is gone as of 2026-09-15.** Round 2 registered a real 2FA-enabled throwaway through the API and still could not reach the dialog: the account also needs a confirmed e-mail, and an unconfirmed one was answered `401 "Invalid email or password"` before the flow ever reached the 2FA gate (§14 — the `PreSignInCheck` short-circuit, **now fixed**: a confirmed throwaway passes the gate and the flow returns the pending 2FA token as documented). So the routes are: (a) an `e2e-v5` account (`twoFactorUser`, 10004) seeded **confirmed** and with a known TOTP secret the seed response returns, so a spec can `otplib`-generate the code; (b) by hand, now open — needs only a confirmation mail that can be read: enrol a throwaway through registration (works since `FW13`'s half landed), confirm it, read the secret off the QR's `otpauth://` URI. The dialog's *structure* (title, `VOtpInput`, wrong-code line, Escape under `FW1`'s `persistent` default) is reachable with (b) in a minute | Route (a) is a one-paragraph seed ask if the operator wants a spec; it belongs in `B3`'s family (`prompts/view-docs/backend/_done/B3-seed-fixture-coverage.md`), not a new file. Note the `LoginVerifyQrCode` redirect line is `FW11`'s and reads the same helper — a source read covers that half |
| ~~`U3` — reCAPTCHA badge show/hide never observable~~ | ✅ **closed 2026-09-24, no defect** (`docs/views/auth/findings.md` round 4). The toggle needed an element, not Google's script. A stand-in `.grecaptcha-badge` appended on `/login`, then router pushes across flagged and unflagged public routes: `afterEach` hid it on both legal pages and showed it on `/login`, `/registration`, `/forgotten-password` and `/confirm-email`, correct both ways. The lazy load was checked in source: all five `executeRecaptcha` callers sit on `showRecaptchaBadge` routes, so the late-inserted badge stays visible there and the next navigation off them hides it | Still uncovered: Google's own rendering with a real key. The badge first appears only after a form submit; that is the lazy load as designed, not filed |
| ~~`U4` — "too many attempts" / "locked out" branches~~ | ✅ **closed 2026-09-21, struck 2026-09-24.** Both halves were seen live with `B21`: the pre-`B21` API gave the localised *"Too many failed sign-in attempts. Try again later."*; on the `B21` source, the 5th failure's 403 carried `lockoutEndUtc` and the snackbar read *"… Try again in 5 min."* The full row (numbers from the API source, the `errorType` branch in `LoginView`, the throwaway-account recipe) moved to the log → *Closed verification items* → `auth/U4` | — |

<!-- TimePicker :58/:59 → minute 60 (found triaging unit 4) confirmed and fixed 2026-09-24 in vue_framework ecf06b7 — worse than predicted: a plain TimePicker showed "09:60", and DateTimePicker moved the date to the next day on a typed 23:58. No batch number; FW10, held for it, is retired unused. Body in _fix-queue-log.md → Closed verification items. -->

### Seed-data gaps — nothing open (the last two closed 2026-09-24 by specs that create their own rows)

**The routine half is done on the API side — `B8` closed 2026-09-14, moved to
`prompts/view-docs/backend/_done/B8-routine-streak-history-seed.md`.** It was already covered by the API's
`e2e-v4` work (uncommitted on `dev` on top of `7f9f9e5` when the ask was written; `B8` measured against
`e2e-v3`, which is why source showed nothing). Every "Done when" item is met, plus the catch-up trap:
`E2eFixtureSeeder.AddRoutinePeriodHistory()` seeds 16 `RoutinePeriodCompletion` rows on Weekly
(pattern `xf.xxxx.xx.xx.xx` newest-first — met / missed / **frozen**, streak 1, best 4) and 16 on Daily (one
4-of-5 miss eleven cycles back; streak 11, best 30); `totalPeriodsElapsed` / `totalPeriodsCompleted` are now
**derived** from those rows by `RoutineTimePeriodResponse.From`, so the client's `mockHistory()` fallback cannot
fire for them, and Monthly / Yearly stay bare on purpose so the empty state is still reachable. Four new daily
items cover the remaining milestone tiers (`milestone30` Drink water 45 — the one daily item left un-ticked;
`milestone90` Journal 120; `milestone180` Make the bed 200; `milestone365` Brush teeth 400). Freeze budgets and
`lastResetAt` are pre-stamped so the first grouped read writes nothing. Typed in `e2e/fixtures/seed.ts`
(`EXPECTED_FIXTURE_VERSION = 'e2e-v4'`, the four `SeedRoutineKey`s, `counts.routinePeriodCompletions` /
`.frozenRoutinePeriodCompletions`), pinned by three tests in `TestSeedEndpointTests.cs`. Two caveats from the
seeder: Weekly has one freeze fewer than budget if the seeded freeze falls in the current calendar month, and a
spec that straddles midnight UTC with a milestone item un-ticked will see the lapse zero its streak.

**And the browser pass is done too** (`todo-routine` round 6, 2026-09-14, against a freshly v4-seeded
database): all seven surfaces render and match the seeded rows — review card with both eligible periods,
heatmaps with met / missed / frozen, 94 % and 69 % consistency with computed trends, personal bests 30/11 and
4/1, freeze chips 2 and 1, and all five milestone icons on one screen. **`U1` and `U2` are closed.**

<!-- The three routine seed rows (completionHistory, streak >= 30, routine item with steps) all closed by B8 + rounds 6/7 — moved to _fix-queue-log.md → Closed verification items on 2026-09-15. -->

<!-- The last two seed gaps (desktop mappings past one page for F12's second step; projects in all three readiness statuses) closed 2026-09-24 by specs that create and delete their own rows through the API — never seed asks. todo-routine/P2, which this paragraph still called "not queued here yet", was fixed and verified 2026-09-14 (round 6b, c4b984ca). Also recorded there: 11 pre-existing failures in tracking-settings.draft.spec.ts and leisure-projects.draft.spec.ts. Body moved to _fix-queue-log.md → Closed verification items. -->

### `planner-day` — no `unverified` filed; three items settled or found from source

The unit filed zero `unverified` findings — the first in the sweep to do so — and its six `bug`s all
carry a screenshot, a DOM read or a response body. What this section holds for it is what the source
read added:

- **`B5`'s task half is settled — no defect, dropped from the open count** (*Contradictions* §70).
  `PlannerTaskLinkView.vue:66-88` wraps both reads in `try/catch` and its own comment says the
  interceptor *"has already surfaced the failure"*. The `AxiosError` the unit saw in the console is
  `axiosConfig.ts:212-214` — `console.error('ERROR: ', error)` for every non-cancelled failure, by
  design — not an unhandled rejection. Its pass condition (*"the console shows no uncaught exception"*)
  is unattainable without changing the interceptor, and there is nothing to catch. The date half is
  real and is `F43`; note that the same interceptor line will still print there after the fix — the
  thing to assert absent is Vue's *"Unhandled error during execution of mounted hook"*, not the
  interceptor's.
- **`useDayNavigation.ts:71-84` — the second unguarded calendar fetch, source-certain, unobserved.**
  Folded into `F43` rather than listed as a separate finding (the `F27` precedent: same shape, same
  batch). What would settle it: from `/day-planner/01-01-2026`, ArrowLeft with the console open —
  expected today: `GET /calendar/by-date/31-12-2025` → 404, the tasks vanish, the header still reads
  `01.01.` (through `formatToDateWithDay`, whose weekday is hardcoded `sk` — §22, not this unit's) and
  the URL says `31-12-2025`. Ten seconds, no seed change: the seeder covers this
  year and next only (`CalendarSeeder.cs:29-31`), and `CalendarProvisioner` creates rows on writes, not
  reads.
- **`UNIT-ORDER.md`'s ISO-URL claim no longer describes the code.** The brief (*"An ISO URL 400s the
  calendar fetch and the view silently falls back to a neighbouring day's calendar"*, measured
  2026-09-11) cannot happen on the current tree: `by-date` strict-parses `dd-MM-yyyy` and 400s
  (`GetByDateCalendarEndpoint.cs:19-24`), the 400 rejects the `Promise.all` before `store.viewedDate` is
  assigned (`DayPlannerView.vue:211-214`), so an ISO URL produces `B5`'s blank header, not a neighbouring
  day. The unit was briefed to verify before filing and correctly filed only what it saw
  (`not-a-date`). `F43`'s verification includes the ISO form so the brief's row can be struck.
- **`MyDateInput`'s `style` override** (`FW15`'s adjacent): `PlannerTaskDialog.vue:26` asks for 200 px
  and gets the component's 150 px. Same one-line fix; one look at the Add Task dialog's date field
  width after `FW15` settles it. Not a finding on its own.

<!-- Template picker's `/suggestions?date=` against a `/{calendarId}` route (found triaging unit 7) confirmed and fixed 2026-09-24: the 400 reproduced on Routine → Details. The route now takes the calendar id, the picker fetches on a calendar-id watcher (so the first load asks too), and a suggestion failure is silent and never empties the template list. No batch number; F45, held for it, is retired unused. Body in _fix-queue-log.md → Closed verification items. -->

### `tracking-dashboards` — nothing open (`U1` closed 2026-09-23 in `F27`'s session — see the log)

<!-- tracking-dashboards/U1 (loading and error states never exercised) closed 2026-09-23 — every prediction held on /activity-tracking and /activity-tracking/unified, nothing new filed; body moved to _fix-queue-log.md → Closed verification items. -->

- ~~**The pie endpoints' `"Other"` row — source-certain, unobserved, backend-shaped (§10).**~~ ✅ **Closed
  2026-09-16 without a browser**: backend `B16` renamed the wire value to `_other` on all four pie
  endpoints, so the client's existing branch covers all eight routes. Still worth *seeing* once, folded
  into the mutation pass rather than left as its own row: a seed app under 1 % of the span, or one
  fulfilled `route` body, should paint a grey **Ostatné** slice that clicks to nothing — and, on
  `/activity-tracking` and `/unified` (the two sections that also bucket locally at 3 %), exactly **one**
  such legend entry, not two. That second half is the collision the rename surfaced; it is fixed in code
  and unobserved, same as everything else on this list.

### `planner-templates` — all three `unverified` closed (`U3` into `F56`, `U1` by `F83`, `U2` 2026-09-24 → `F88`)

- **`U3` — split view's back button has no accessible name. ✅ Settled from source, closes in `F56`.**
  `TemplateSplitView.vue:5-11` is `<VBtn icon="arrow-left" …>` with no `aria-label`, no `title` and no
  default-slot text; a `VBtn` given only `icon` renders an SVG and nothing an accessibility tree can
  name. There is nothing a browser would add — the unit's own rule (*"eval the button the same way
  A1/A3 were confirmed"*) would return the same `{text: "", aria: null, title: ""}` it already got for
  the pin. Folded as row 4 of `F56` rather than left waiting for a refile as "A4".
- ~~**`U1` — the header stat line excludes background tasks, never exercised.**~~ ✅ **Closed
  2026-09-23 by `F83`.** The exclusion was confirmed live against a created-and-deleted background
  task, and the header now reads *"N tasks (+M background)"*. The row's prediction (`polish`, a
  suffix) is what shipped. Body in the log under `F83`. The original row follows, for the record:
  it is a seed-shape gap (all twelve seeded template tasks are `isBackground: false`) and the
  behaviour is source-certain and deliberate (`TemplateDayPlannerView.vue:178-182` filters
  `nonBgTasks` before counting). What would settle it — **not a seed ask** (CLAUDE.md's *Mutating
  specs* rule 1): the unit's **mutation pass** creates one task with `isBackground: true` on template
  `20001` through `POST /api/template-planner-task`, reads the header, and judges the wording
  (*"5 tasks"* for a template that shows six blocks). The likely outcome is `polish` — a *"(+1
  background)"* suffix or nothing — and it goes straight into the unit's `findings.md` at that
  severity; no batch is reserved for it.
<!-- planner-templates/U2 (cross-template drag never exercised) closed 2026-09-24: the handle was unhittable — `BaseTaskBlock`'s `.task-content` is `pointer-events-none` and the handle never overrode it, so every press started the same-grid move. One-line fix in TemplatePlannerTaskBlock.vue, verified both halves live. The ≥md layout that also clips the handle is filed as F88. Body moved to _fix-queue-log.md → Closed verification items. -->


<!-- §91 ("a 400 with no snackbar — three units, three different observations") ✅ SETTLED 2026-09-16 by
     unit 11's round 2, in the mundane direction: the snackbar fires. Its `B3` says so in as many words —
     *"a snackbar reading 'One or more errors occurred!' appears and disappears within a few seconds"* —
     so round 1's `X3` poll was wrong and there is no framework intermittent. What round 2 *did* confirm
     (every `[role=alert]` in both forms empty after a rejected submit) is the absence of a **field-level**
     error, which is now `F77`. Body moved to _fix-queue-log.md → Closed verification items. -->

### `leisure-backlog-picker` — nothing open (`U1`–`U4`, the round-1 `X1`/`P2` record gap and the `ConstraintBar` keyboard check closed 2026-09-24; the last one filed `F90`); **note the round-2 renumbering** (see the warning at the top of this file)

| finding | what settles it | note |
| --- | --- | --- |
| ~~**round-1 `X1` and `P2` are gone from the file with no retest note**~~ | ✅ **both closed 2026-09-24, resolved, not re-filed** — `X1`: `?activityName=zzz-nothing` sends the name in the main grid request, the server answers `itemsCount: 0`, and the table renders `F79`'s *"Nothing matches these filters."*; `P2`: the "unimplemented" comment is gone, and the doc comment now states the real `/leisure-weather-fit` contract (the `F64` rewrite). Body in the log | — |
| ~~`U1` — the backlog table's empty state~~ ✅ **closed 2026-09-24** | **Passes** (grid routed empty): *"These are things you could do. You don't have any here yet."* + *Add*. Body in the log (2026-09-24 sweep). Was: ~~Blocked on `F73`~~ **unblocked 2026-09-21** (`F73` landed; delete now hits the row id). Delete a row created through the API and read the `#noData` slot | The finding names its own blocker as `X1`, i.e. `F73`. Do not ask for a seed variant first |
| ~~`U2` — the picker's *nothing filed at all* state~~ ✅ **closed 2026-09-24** | **Passes** (both pool grids routed empty): *"There's nothing to pick from yet…"* + *Fill the backlog*. Body in the log. Was: Sign in as `secondaryUser` (the `secondaryPage` fixture) and open `/leisure/pick` — check `e2e/.state/seed.json` for that account's leisure counts rather than assuming; if it seeds rows too, a `test.fixme` | `F64` changes the *default* landing state on the primary account from "no suggestions" to "one card" — run this after it, or the two states are indistinguishable |
| ~~`U3` — the picker's *load failed* state~~ ✅ **closed 2026-09-24** | **Passes, distinct from empty:** *"We couldn't load your activities. Try again in a moment."* + the 500 snackbar, no unhandled rejection. Nothing to file against `F61`/`F79`. Body in the log. Was: `playwright-cli route "**/api/activity-backlog-profile/grid" --status=500` and reload | Read whether the picker distinguishes *failed* from *empty*. If it does not, that is `F61`'s pattern and `F79`'s third state — file it against those, not as a new finding |
| ~~`U4` — the picker's loading skeleton~~ ✅ **closed 2026-09-24** | **Passes:** three skeleton cards while the pools are delayed, replaced by a real card on settle. The CLI's `route` has no delay flag — use `run-code` + `page.waitForTimeout` (not `setTimeout`, absent there). Body in the log. Was: `playwright-cli route` with a delay on the three pool `grid` calls, then `find "skeleton"` | Cosmetic; one screenshot. Same limitation `leisure-projects/U2` records for the board's progress bar — one throttled session settles both |
| ~~`U5` — `suggestionHistory` per-user scoping~~ | ✅ **closed 2026-09-21, no defect** — the read the row asked for: `suggestionHistory.ts:2` imports `readUserScoped, writeUserScoped` from `@/core/user/composable/useUserScopedStorage.ts` and both accessors go through them. Its own header says so (*"P4 found this key un-namespaced and scoped it by account"*), i.e. the round-2 finding was written against a state of the file that had already been fixed | No batch. The one real limitation the file documents is different and already owned elsewhere: the record is per-**device**, and moving it server-side is `backend/D1-backend.md`, not this queue |
| ~~*(unfiled)* `ConstraintBar`'s three `VBtnToggle` groups and arrow keys — round 1's `U4`, dropped by the rewrite~~ | ✅ **closed 2026-09-24 — keyboard works, and it found an a11y gap, filed as `F90`.** Driven on `/leisure/pick` at 1440: ArrowRight/ArrowLeft move neither focus nor selection (the row's predicted *"arrows do nothing"*); Tab stops on every button, 11 stops across the three groups; Space on an unselected button selects it and writes the URL (`energy=medium` → `energy=low`). The *"filter's text field"* half has nothing to test: the bar has no text field (the secondary constraints are selects), and the picker binds no keys of its own | **What it found:** the accessibility tree shows ten plain `button`s with no `[pressed]`, so the selected option in each group ("1 h", "Medium", "Just me") is conveyed by colour alone; and the groups carry no `role="group"` or name, so their captions (*Time available*, …) are not announced. → `F90`. Arrow-key roving is not a defect: a toggle group of buttons may use Tab, and `F90` notes it as an option only |

### `leisure-bucket-anchors` — nothing open (`B1` confirmed not-a-defect 2026-09-24)

| finding | what settles it | note |
| --- | --- | --- |
| ~~`B1` — numeric and date range filters "silently ignored server-side" on both grids~~ ✅ **closed 2026-09-24, not a defect** | **All three cases as predicted** on an already-current API (no restart needed): `minComfortZoneStep=5` 0 rows (unfiltered 1, step 3), `minRating=9` 1 (of 2), `year=2025` 0. Body in the log (2026-09-24 sweep). Was: Restart the local API on a build carrying `B11`, then re-run the three cases: `/leisure/bucket-list?minComfortZoneStep=5` (expect zero rows), `/leisure/memory-anchors?minRating=9` (expect one), `?year=2025` (expect zero) | ⚠️ **Re-graded `bug` → not-a-defect, pending that retest** (*Contradictions* §117). Read at the source this pass, all five fields are applied: `GridActivityBucketListProfileEndpoint.ApplyCustomFiltering` filters `MinComfortZoneStep`/`MaxComfortZoneStep`, `GridMemoryAnchorEndpoint` filters `MinRating`/`AnchorMonth`/`AnchorYear`. Round 2's reconfirmation (2026-09-15) ran against the pre-`B11` local build — the unit's **own round 3** records that it did not restart the backend until 2026-09-16. The `year`/`month` half is additionally explained by `F60`: the client sent those names while the server reads `anchorYear`/`anchorMonth`, which is the rename `F60` shipped and verified. All five cases are accounted for; none is an open server gap |
| ~~`U1`, `U2`~~ | ✅ both closed — `U1` exercised live by round 2 (create → *I did this* → 201 → the row flips to *Experienced*, progress 1→2), `U2` settled from source in the thirteenth pass and re-confirmed live by round 2's delete. Bodies in the log | — |

### `leisure-projects` — nothing open (`U1` settled 2026-09-21, `U2` 2026-09-24)

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — the genuinely-empty board and table states | ~~Blocked on `F73`~~ **settled 2026-09-21** — the board half by `F73`'s own verification (deleting the seeded `17201` through the UI rendered *"You don't have any projects here yet"* after a reload), the table half in `F79`'s session: signed in as `secondaryUser`, `/leisure/projects?view=table` rendered the same copy + *Add* through the `#noData` slot, and so did every other leisure surface | Ran in `F79`'s session as planned — the third state (filtered-to-zero) is in, and the original copy still renders where it should |
| ~~`U2` — the loading progress bar~~ ✅ **closed 2026-09-24** | **Passes on board and table:** an active `v-progress-linear` while the delayed grid is pending, none after. Body in the log (2026-09-24 sweep). Was: `playwright-cli route` with a delay on the `grid` call | Same limitation as `leisure-backlog-picker/U4`; one throttled session settles both |

<!-- planner-day/B8 (task counter stale after a delete) settled 2026-09-24: client-side, not a backend gap. DELETE → 204, the server count drops, a reload reads right; the page's own `calendar.totalTasks` is never updated after a delete. The "stale after a full reload" half did not reproduce. Filed as F87; body moved to _fix-queue-log.md → Closed verification items. -->

### `planner-templates` — both carried `unverified` closed (`U2` 2026-09-24, `U3` into `F56`)

| finding | what settles it | note |
| --- | --- | --- |
| ~~`U2` — cross-template drag on the split view~~ | ✅ **closed 2026-09-24 — a real defect, fixed.** The drop wiring was fine; the handle could not be hit. `BaseTaskBlock`'s `.task-content` is `pointer-events-none` and `.split-drag-handle` never set `auto`, so every press — a real mouse's too — landed on the block and started the same-grid move. One line in `TemplatePlannerTaskBlock.vue`; verified live at 950 px: one `PUT` with the new `templateId` and the same times, block moved, snackbar; a drop outside both panels fires nothing. At ≥`md` the handle is **also** clipped by layout → `F88`. Body in the log | Round 2's three failed attempts were right, and so was *"a real mouse cannot"* |
| ~~`U3` — the split view's back button may have no accessible name~~ | ✅ **confirmed 2026-09-21 and closed into `F56`, which already carries it as control #4.** The `eval` is unnecessary: `TemplateSplitView.vue:5-11` is `<VBtn icon="arrow-left" variant="tonal" color="secondaryOutline" size="small" @click=…/>` — no `aria-label`, no `title`, no child text and no default slot, so there is nothing for an accessible name to come from. A browser could only re-observe the markup | Stays in `F56`; no new batch, no `A5` needed on the queue's side. The remaining verification is `F56`'s own — that `getByRole('button', { name: 'Back to templates' })` resolves **after** the fix |

<!-- The `B16` two-halves sequencing note ("frontend half in this tree, backend half not committed in the
     API's") ✅ SETTLED 2026-09-21, later the same day: both halves are committed — `FoldedRow.cs` and the
     seven folding endpoints as API `5e70367`, the client's `OTHER_DOMAIN` + merge guard as `448931a5` —
     so a §10 retest now runs against the real wire value. Body in _fix-queue-log.md → Closed verification
     items. -->
### Carried forward, unchanged

<!-- todo-lists/U1 (settled, superseded by B4/FW3) and home/U1 (settled by the unit-1 mutation round) both closed — moved to _fix-queue-log.md → Closed verification items on 2026-09-15. -->

- ~~**`_shell/U1`** — snackbar stacking.~~ ✅ **closed 2026-09-24** — it does not stack: one slot, the last
  toast wins and times out cleanly (a 500 and a 404 300 ms apart → one toast, the 404's). ~~Adjacent, not
  filed: an undo toast is replaced, undo and all, by any toast inside its timeout.~~ ✅ **fixed 2026-09-24
  (`prompts/_common/snackbar/Q1`)** — the snackbar is now a `VSnackbarQueue`. Body in the log.
- ~~**`_shell/U2`** — fullscreen-loading strand.~~ ✅ **closed 2026-09-24** — it cannot strand; the overlay
  is hidden by *any* successful response, ~60 ms in, which is the opposite defect and is now **`FW26`**.
  Body in the log.

## Deferred to opportunities

> Built, fixed or closed opportunities move to [`_fix-queue-log.md`](_fix-queue-log.md) → *Closed
> opportunities*, the same way a closed batch does: the body goes under a `✅` note there, and a tombstone
> stays here. A partly built entry stays here until its last half lands.

<!-- leisure-projects/O1 (shopping-list-to-todo handoff from `NeedsShopping` cards) built 2026-09-24 — body moved to _fix-queue-log.md → Closed opportunities. -->

<!-- tracking-settings/O1 (a mapping's `isActive` is filterable, displayed, and editable nowhere) built 2026-09-24 — inline *Is active* switch on both Mappings tables — body moved to _fix-queue-log.md → Closed opportunities. -->

<!-- tracking-settings/B5 (distinct-entries list never marks an entry a rule already covers — re-graded opportunity, §103) closed 2026-09-21 via B24/§19 — body moved to _fix-queue-log.md → Closed opportunities. -->

<!-- activity-settings/O1 (role and category icons shown in neither settings table) built 2026-09-24 in de3f5d46 — body moved to _fix-queue-log.md → Closed opportunities. -->

`todo-lists/O1` remains `resolved` (round 4). **`history-review` filed no `opportunity` finding** — its
tally line says `opportunity 0` and the body agrees. Two things it *could* have filed as one, recorded here
so Phase 4 does not have to rediscover them: `HistoryPieChart.vue`'s `isNarrow` prop was the unfinished
half of a responsive layout (`F31` finished it 2026-09-23), and the Detail view's bars have no click consumer at all
(`F29` names it) — a drill-*through* from a day's window to the timeline filtered to that window would be
the natural use, and the `activityClick` payload already carries the window. Neither is an opportunity
finding by the template's definition; both are noted.
✅ **Drill-through built 2026-09-25** (uncommitted). A Detail bar is now `interactive`: it narrows the
whole view to its window, in the user's zone, and switches to the timeline. A *Back to {from}–{to}*
button restores the range drilled from, and a date change drops it. **Unfiled, fixed on the way:** the chart's
`handleActivityClick` looked up `windows[bar.windowIndex]`, but `windowIndex` indexes
`processedWindows`, where empty runs are merged. So every bar after the first gap reported the wrong
window. Summary's drill-through was affected too: a 20 Sep bar opened Detail on **16 Sep** (reproduced with
the fix stashed). Verified live: Detail 2026-09-23 → 11:00–12:00, seven records, restore → 08:00–00:00;
Summary → `date=2026-09-20`. The tracking dashboards read only the name, so they were never affected.

**`user-settings` filed no `opportunity` finding** either (tally `opportunity 0`, body agrees). One thing
worth a line for Phase 4 so it is not rediscovered: `GET /user/google-calendar/status` returns only
`{ connected }`, and the card renders *Connect* unconditionally — once §9's second ask lands (a
`configured` flag or a `503` from `auth-url`), the card can hide or disable the row on deployments with no
Google client, which is every deployment today. Not an opportunity by the template's definition; a
follow-on to §9.

**`history-capture` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). One thing for
Phase 4 so it is not rediscovered: `TimerPresetsSection` is mounted by `TimerView` only
(`TimerView.vue:42`), while the Pomodoro view has its own preset surface (`PomodoroPresetsDialog`) and
the Stopwatch and Manual views have none — so "quick times" exist for exactly one of the four capture
flows, and the *activity* presets (duration + activity) are the raw material for a one-tap "record 30 min
of X" on the Manual view that does not exist. Not an opportunity by the template's definition; noted.
✅ **Manual half built 2026-09-25** (uncommitted). `TimerPresetsSection` is mounted on the Manual view
too. A quick time sets *Length*, and an activity preset sets the activity as well, through the form's new
`applyPreset`. It deliberately does **not** save: the start time still has to be checked, so it takes two
taps, not one. Verified live with a throwaway *25m · Code Review* preset (created, applied, deleted:
`DELETE` 204). Stopwatch was left alone because it has no length for a preset to set.

**`auth` filed one `opportunity` finding, `O1`, and it is re-graded `bug` (`FW13`, §63)** — the
"policy question" it poses was answered on the server before the unit ran, so nothing is deferred.
Two things for Phase 4 so they are not rediscovered: the forgotten-password success copy promises a
mail the server may deliberately not have sent (enumeration guard, `FW9` flags the wording as a copy
decision); and the whole signed-out surface is framework-owned, so any "what should sign-in do next"
idea — remembering the last-used e-mail without persisting the whole `User`, a *resend confirmation*
link on the forgotten-password page for unconfirmed accounts (the server answers 204 for those too,
so the user is told a reset mail went out and nothing arrives) — is a `vue_framework` opportunity,
not this app's. Neither is an opportunity by the template's definition; both are noted.

**`planner-day` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). The one its
brief handed it — *"`GET /task-planner-day-template/suggestions/{calendarId}` exists, returns 200, and
the client never calls it at all"* — is **not an opportunity, it is a defect**, and the brief's premise
is wrong in an instructive way: the client *does* call it (`DayTemplatePicker.vue:216` →
`taskPlannerDayTemplateApi.ts:38-41`), with `?date=` against a route that takes `/{calendarId}` — the
withdrawn `B5` bug, byte for byte, on the sibling endpoint — and the call is guarded out at runtime by a
mount-order accident, which is why nobody has seen the 400. ~~Under *Needs verification*, `F45`-if-confirmed.~~
**Confirmed and fixed 2026-09-24** (body in the log, under *Closed verification items*). The section
renders whenever the server has suggestions, but the seed has none.
Nothing for Phase 4 from this unit.

**`tracking-dashboards` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). Two things
for Phase 4 so they are not rediscovered, both fallen out of `B2`'s narrowing (§79): **(1) an Android
per-app detail endpoint** — the sibling of desktop's `GET /activity-tracking/desktop/process-details`
— is the only way *"View details for Spotify"* ever shows more than total time, share and package
name. The rows exist (`AndroidSessionData`: `SessionStartUtc`, `DurationSeconds`, per package), so
session count, first/last use and mean session length are one `GroupBy` away server-side; the client
half is `DesktopPieChartSection.vue:169-188`'s watcher, copied. Not a defect — the web dashboard's
detail is also local-only — but it is the feature the label promises. **Written as `B23` on 2026-09-21**
(escalation §18) and **✅ landed the same day** (API `c00e64d`, frontend half with `F47` — see §18); it
stays here only as the record of where it came from. **(2) The pie sections' *Other*
bucket is computed in two places at two thresholds** (server at `minPercent: 1`; the web **and unified**
clients at 3 % — the note said "web client" and undercounted by one — the other two not at all). §10
settled the sentinel on 2026-09-16, and its frontend half had to teach both local bucketers to fold the
server's row into their own rather than let it survive as a second one. That guard is the seam: one
threshold in one place is still the tidy-up, and it is where a *"show the tail"* affordance (expand
*Other* into its members) would live.
Neither is an opportunity by the template's definition; both are noted.

<!-- leisure-backlog-picker/O1 (min/maxParticipants had no filter input and maxParticipants was not ranked) both halves fixed 2026-09-24, ranking in 9f400c79 — body moved to _fix-queue-log.md → Closed opportunities. -->

<!-- leisure-bucket-anchors/O1 (`financialGoal`, `inspirationSource` and the anchor's source flags captured but never spent) built 2026-09-24 — savings strip on the bucket list, inspiration on ladder cards, per-source chips on the timeline — body moved to _fix-queue-log.md → Closed opportunities. -->

<!-- leisure-backlog-picker/O2 (open-anchor link navigated by activity name) fixed 2026-09-24 in 31503119 — body moved to _fix-queue-log.md → Closed opportunities. -->

No open opportunity findings remain across the fifteen units triaged (all of them are in the log as of
2026-09-24). The notes above are Phase-4 leads, not findings. With unit 11's round 2,
every one of the fifteen has now been read for them at least once.

