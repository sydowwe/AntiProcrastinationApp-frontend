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
| F27 | History dashboards have no error state: three fetch owners null or **keep** their data on failure and every panel renders "No data for this period" — the pattern is already built in `useActivityDashboard` | app | `history-review/B2` | med |
| F28 | ✅ **FIXED 2026-09-23** — `useSetBreadcrumbExtra` with `history.detail.title`. Verified. Body in the log — `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer | app | `history-review/B3` | trivial |
| F29 | ✅ **FIXED 2026-09-22** (with `F30`, `F49`, `F78` — one clickable-`div` convention) — `StackedBarColumn` carries a localized `aria-label` (`activityTracking.stackedBars.barLabel`: name, total duration, window range) on every dashboard; where the consumer binds `@activityClick` it passes the new `interactive` prop and the bar is `role="button"` + `tabindex="0"` + Enter/Space, named *"View details for …"* via the domain card's key; unbound (Detail) it is `role="img"` with no pointer. Verified live: Tab + Enter on `/activity-history` drilled to Detail with the bar's date; Detail's bars are `img`, cursor `auto`; `/activity-tracking/unified` Enter set `?selected=`. SK label checked | app (`activityTracking/component/stackedBars/`, shared per `migration-revision.md` §7) | `history-review/A1` | low-med |
| F30 | ✅ **FIXED 2026-09-22** (with `F29`) — `historyDashboard.summaryCards.viewDetails` now reads *"Highlight {name} in the chart"* / *"Zvýrazniť {name} v grafe"*, the card carries `:aria-pressed="selected"` and `@keydown.enter.space.prevent` to the same emit. `activityTracking`'s card untouched. Verified live: Enter toggles `aria-pressed` true → false, both locales | app | `history-review/P1` | low |
| F31 | Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas; `isNarrow` is a dead prop | app | `history-review/P2` | low-med |
| F32 | ✅ **FIXED 2026-09-23** — header row with `<h1>` + Summary button; grid `flex-fill`/`min-height: 0`. Verified by screenshot. Body in the log — `/activity-history/calendar` has no `<h1>`, unlike its two siblings | app | `history-review/P3` | trivial |
| F33 | ✅ **FIXED 2026-09-21** (with the `configured` branch `B14` added, same commit) — Google Calendar connect never sends the OAuth `state` the server's validator requires — the client half of `B1`, unobservable only because the server half breaks the flow one step earlier | app | `user-settings/B1` (client half; server half is §9) | low |
| F34 | ✅ **FIXED 2026-09-21** (one token, in the `F33` commit — same card, not `FW8`) — Google Calendar card's "Disconnect" is `error` on an elevated button — the app-side twin of `P1`, on the very row the unit compared against | app | *(unfiled twin of `user-settings/P1`)* | trivial |
| F35 | ✅ **FIXED 2026-09-15** (merge chosen) — `dateTime.secondsShort` renders raw on every running clock — and `general.from`/`general.to` on every `TimeRangePicker` in range mode: the app-side `common` mirror is written per consumer, has leaked four times, and should become the deep-merge `SK.ts` already does for `user` | app (`src/locales/`) + CLAUDE.md | `history-capture/B1` (+ two unfiled twins) | low (decision: merge vs. patch) |
| F36 | Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take the framework's time-of-day default; the server's own *Short Sprint* preset (3-minute rest) cannot be re-entered through the client | app | `history-capture/B2` | low |
| F37 | Preset chips define `#close` without `closable`, so Vuetify renders a live, always-present "Close" button that hides the chip client-side — and in edit mode the pencil *is* that button, so clicking it never opens the editor | app | `history-capture/B3` (+ unfiled inventory `A1`) | low |
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
| F50 | The Compare Templates dialog is empty every time — **two** unkeyed `Promise.all` fan-outs from one api instance (`fetchById` ×2, then `fetchFiltered` ×2), each cancelling its own sibling; the finding's fix closes only the first; folds `B3`'s dead *Confirm* button (`:showConfirmBtn` is not a `MyDialog` prop), same file | app (`TemplateComparisonDialog.vue`) | `planner-templates/X1`, `B3` | low |
| F51 | The template planner's side panel at `<md` is the **open** panel squeezed to 400 × 16 px and pushed off-screen — not a broken "opened" state — and the template planner has **no control that reopens it** once the X is tapped (`panelOpen` is only ever set `false`); the shell is shared with `/day-planner/:date`, whose mobile layout is a different, unchecked shape | app (`PlannerSidePanelShell.vue`, `TemplateDayPlannerView.vue`, `TemplatePlannerHeader.vue`) | `planner-templates/X2` (+ the inventory's misread "collapsed pill") | med |
| F52 | Template card title row: the name never truncates, so the Active/Inactive switch label wraps one letter per line and the day-type chip hard-clips to "Wee" / "Workd" on every card at 1440 px | app (`TemplateCard.vue`) | `planner-templates/B1` | low |
| F53 | The template form mirrors none of the API's contract: `suggestedForDayType` is `required` server-side and `?:` client-side (400 after the dialog has closed, input lost), and `Name` `[Required]`/100, `Description` 500, `Icon` 50 have no rule either — `form.validate()` validates nothing. **Round 2 read the form end to end and confirmed the batch as written** (zero `:rules` on any of the five fields; an empty `name` reached the wire unchallenged) — the batch does not grow, it just stops being an inference | app (`TaskPlannerDayTemplateRequest.ts`, `TaskPlannerDayTemplateDetailsForm.vue`) | `planner-templates/B2` (broadened in round 2) | low |
| F54 | ✅ **FIXED 2026-09-22** — Template list sort and the split view's two picks are not in the URL — `?sort=` on the list, `?left=`/`?right=` on the split view through `useQueryParamRef`; the split ids hydrate after the options load and an unknown or duplicated id is scrubbed from the URL, never sent to the grid | app (`TemplateListView.vue`, `TemplateSplitView.vue`) | `planner-templates/B4` | low-med |
| F55 | ✅ **FIXED 2026-09-22** (copies `F43`'s treatment — store reset + a *Template not found* alert; body in the log) — `/day-planner/templates/:templateId` with an unknown id keeps the **previous** template's name in the header — and, because the store persists `templateName` to `sessionStorage`, across a reload too; `loadTemplateDetails` has no `catch` at either of its two call sites (the `F43` shape, template side) | app (`TemplatePlannerPanel.vue`, `templateDayPlannerStore.ts`) | `planner-templates/B5` | low |
| F56 | ✅ **FIXED 2026-09-22** (with `F4`) — all seven named from `planner.a11y.*`: pin/unpin by `isPinned` with the template name, compare checkbox *"Select {name} for comparison"*, panel close/open shared by both shells and the mobile `bars` toggle (by `panelOpen`), split view *"Back to templates"*, and both undo buttons through an `undoLabel` computed that folds the count in (*Undo (2)*) so the badge stops being the name. The compare checkbox's second half is fixed at the cause: the sibling template `VIcon` is decorative and now `pointer-events: none` (plus `flex-shrink-0 me-1`), so a direct click lands. Verified live: `getByRole('checkbox', { name: 'Select Home Office for comparison' }).click()` checks it with no intercept; pin/back/undo/panel names all resolve, the last two at 390 px. *Undo (n)* itself was not exercised — it needs a planner mutation | app (`src/core/dayPlanner/`) | `planner-templates/A1`, `A2`, `A3` (re-identified), `U3` (settled from source) + three unfiled | low |
| F57 | The Scheduled Days picker is clipped to Mon–Fri in the 400 px template panel — `DayOfWeekPicker` cannot wrap and the panel is the only place it renders without a dialog's width | app (`TaskPlannerDayTemplateDetailsForm.vue`) | `planner-templates/P1` | trivial |
| F58 | ✅ **FIXED 2026-09-15** — The app's EN `$vuetify` block is a 180-line hand copy of Vuetify's own `en` export, byte-identical except for **two missing keys** (`timePicker.notAllowed`, `command.search`) — replace the copy with the import | app (`src/locales/common.en.ts`) | `home/A1` (+ one unfiled key) | trivial |
| F59 | ✅ **FIXED 2026-09-22** — A skipped (`Cancelled`) task renders as done in `DayPlannerWidget` — row class, `aria-pressed` and the checkbox label all key off `isFinished`, which is `Completed ∨ Cancelled` by design; and the checkbox on a cancelled row advances it to `Completed`. Surfaced a backend gap (the status PATCH dropped `skipReason`) — §21 / `B26`, landed and verified 2026-09-23 | app (`DayPlannerWidget.vue`, `useTodayPlan.ts`) | `home/B4` | low |
| F60 | ✅ **FIXED 2026-09-15** — `MemoryAnchorFilter` sent `year`/`month` while the server reads `anchorYear`/`anchorMonth`; the two wire fields are renamed and the URL keys stay `year`/`month`, so bookmarks survive. Verified live across seven filter URLs. The timeline's twelve-month check is still blocked by `F61`. Body in the log | app (`MemoryAnchorFilter.ts`, `MemoryAnchorsView.vue`, `leisureFilterUrlState.ts`; its test needed **no** change, and that is the bookmark pin) | `leisure-bucket-anchors/B1` (the two of five cases the client owns; the other three closed with ~~§13~~ `B11`) | trivial |
| F61 | ✅ **FIXED 2026-09-21** (same session as `F79`) — `LADDER_PAGE_SIZE` and `TIMELINE_PAGE_SIZE` are 200 with `ProjectsView`'s comment, both loaders `catch` into a `failed` flag (cancellations excluded via `isRequestCanceled`), and the ladder, timeline **and** board render a distinct *load failed* + *Try again* branch through the new `LeisureEmptyState`. Verified live: both grids 200, the seeded row on rung 3, July and August 2026 shaded; a routed 500 shows the error branch and *Try again* recovers. Body in the log | app (`BucketListView.vue`, `MemoryAnchorsView.vue`, `ProjectsView.vue` (board `catch` only), `component/LeisureEmptyState.vue`) | `leisure-bucket-anchors/X1`, `X2` | low |
| F62 | ✅ **FIXED 2026-09-15** — `NewMemoryAnchorForm`'s `onMounted` awaits the eligible-activities fetch with no `try/finally`, so any failure leaves the spinner on forever and the "no eligible activities" fallback unreachable — today *every* call fails, because the endpoint does not exist (§12) | app (`NewMemoryAnchorForm.vue:107-112`) | `leisure-bucket-anchors/X3` (frontend half) | trivial |
| F63 | ✅ **FIXED 2026-09-21** (same session as `F77`, `F63` first per its ordering constraint) — all eight lookup ids are `number | null = null` on the four DTOs, `MemoryAnchorForm` passes `presetActivityId` through. Verified live on `/leisure/backlog`: the fresh *Add* dialog renders the three selects empty, not "0", and an untouched *Create* shows the required message and fires no `POST`. Body in the log | app (`ActivityBacklogProfileRequest.ts`, `ActivityBucketListProfileRequest.ts`, `MemoryAnchorRequest.ts`, `ActivityProjectProfileRequest.ts` + their forms) | `leisure-backlog-picker/B2` (round 2 — round 1's `X3`, the `0` half), `leisure-bucket-anchors/B2` (`0` half), **`leisure-projects/B5`** | low-med |
| F64 | The picker reads an empty `matchingWeatherDependencyIds` as "nothing fits" and excludes every weather-tagged backlog entry — the server's own contract says empty means "no opinion, exclude nothing"; and the API file's comment still says the endpoint is unimplemented. **Round 2 narrowed the headline and added a second symptom:** the excluded row's dependency is the *"None"* lookup, so the batch must not hard-exclude *or* badge it, and a mocked non-empty match produced the reason chip *"Good weather for this today"* on an indoor activity | app (`useLeisurePicker.ts:250`, `leisureScoring.ts`, `leisureWeatherApi.ts`) | `leisure-backlog-picker/B1` (round 2 — round 1's `X2`), `P2` (round 1) | low |
| F65 | ✅ **FIXED 2026-09-22** (with `F4`) — `:aria-label` beside every `:title`, same key, `:title` kept as the sighted user's tooltip. Two deliberately carry more than the key: the year menu is *"Pick a year: 2026"* (a bare key would replace the visible year in the name) and the source/experienced chips and the two row-scoped delete buttons append the row (*"Delete: Learn Bouldering"*, *"Open where this came from: Bucket List"*), matching `TodoListCard`'s existing `action: name` shape. Verified live on all three views, the timeline and the ladder | app (`src/core/leisure/`) | `leisure-bucket-anchors/A1` (app half, re-graded `polish`) | trivial |
| F66 | `boolChip`'s `falseIcon` defaults to `trueIcon`, and four of five call sites pass one icon — a `✗` chip wears a check | app (`useLeisureFilterChips.ts:19` + call sites) | `leisure-bucket-anchors/P1` | trivial |
| F67 | ✅ **FIXED AND VERIFIED 2026-09-15** (`useSessionLength.ts` — one rounding rule and one discard-with-message for all three capture views, plus the pomodoro's rest record; body in the log) — A session that rounds to zero minutes was handled three different ways by the three capture views, and none of them told the user | app (`src/core/activityHistory/`) | `history-capture/B4`, `B5` (+ the stopwatch twin) | low |
| F68 | The manual-entry form fires one `POST` per click while the first is in flight, and never resets — so a second click is a `409` from the unique index, and so is *every* re-submit of an unchanged form after a success | app (`AddActivityManuallyView.vue`, `AddActivityManuallyForm.vue`) | `history-capture/B6` (was `U1`) | low |
| F69 | Deleting a to-do item never confirms, whatever `askBeforeDelete` says — `useUndoableListCrud.deleteItem` was never one of P3's five sites and bypasses `useDeleteConfirmation`; the routine list shares the composable | app (`src/core/todoList/composable/useUndoableListCrud.ts` + its two views) + CLAUDE.md row | `todo-lists/B7` (+ the unfiled routine twin) | low |
| F70 | ✅ **FIXED AND VERIFIED 2026-09-22** (`1bb9ae06` — `PATCH …/{id}/move` + `{ destinationListId }`; live 204 and the item lands in *Errands* under the same id; new `todo-lists.spec.ts` test covers the move and the foreign-list 404. The close-then-call shape is noted in the commit, not fixed. Body in the log) — *Move to list* has 404'd since the day it was written — the client calls `PATCH /move/{id}/{dest}` against a server route that has been `PATCH /{id}/move` + `{ destinationListId }` since 2026-05-15 | app (`todoListItemApi.ts:104-112`) | `todo-lists/B8` | trivial |
| F71 | ✅ **FIXED 2026-09-22** (with `F4`) — `toDoList.markDone` / `markStepDone` minted in this module (not imported from `home`), bound as `aria-label` on both `VCheckboxBtn`s; Vuetify's `filterInputAttrs` puts them on the `<input>`, so they are the control's name, not the wrapper's. The step key interpolates `step.name` (the queue said `step.text`; the field is `name`). Verified live on `/todo-list/13001` — six item checkboxes and three step checkboxes resolve by name. `DraggedItemPreview`'s decorative copy left alone | app (`BaseTodoListItem.vue:19`, `BaseTodoListItemSteps.vue:39`) | `todo-lists/A3` (+ one unfiled) | trivial |
| F72 | ✅ **FIXED 2026-09-22** — `saved()` branches on `mode` (*To ignored* → `isIgnored: true`, no ids; *To activity* → the activity id **alone**: `formData`'s role/category only narrow the picker, and sending them beside the activity was a second target, so the server's role/category target is deliberately not reachable from this form); request DTOs default `isActive = true`, `edit()` copies the row's value; a finished save clears `editedId` so a later save cannot re-write the row with the default. Validation: no pattern (blank counts as none) → no request and the filter bar's pattern fields are marked; the action bars are now a `VForm` so *Save* marks a missing activity. The `catch` no longer snackbars over the interceptor — only a request that got no response shows `failedToSaveMapping`. Verified desktop: empty *Save* → no request, 4 fields marked; *To ignored* → 201 with `"isIgnored":true` and null ids; edit of an API-created inactive rule → `PUT` 200 with `"isActive":false`; a duplicate → 409 and exactly one snackbar (the interceptor's typed text). Was: `useMappingSettings.saved()` sends three of the form's five facts: *To ignored* never reaches the wire (`isIgnored` stays `null` → 400 on every ignored save), `isActive` is never sent (→ the update DTO's `required` 400 on every edit), nothing validates before the request, and the view's own `catch` overwrites the interceptor's snackbar with a generic string | app (`useMappingSettings.ts`, the two `Tracker*MappingRequest.ts`, the two views' `edit()`, the two action bars) | `tracking-settings/X2`, `X3`, `B6` | med |
| FW1 | `MyDialog` is `persistent` by default, so Escape closes nothing | **framework** | `_shell/A1` | med (decision first) |
| FW2 | ✅ **FIXED 2026-09-23** (`5397675`, bump `a7dbfda0`, in one commit with `FW5`/`FW6`/`FW7`/`FW15` — all six controls gain a localized `title`/`aria-label`: `AppTopBar`'s sidebar toggle (`general.toggleNavigation`), `FilterPanel`'s close (`general.close`), `MonthYearPicker`'s and `MyDateInput`'s chevrons (`dateTime.{previous,next}{Month,Day}`). Verified by typecheck/lint/build; `planner-day.draft.spec.ts` dropped its `nth(5)` positional fallback for `getByRole('button', { name: 'Next month' })`. Body in the log) — **Six** framework icon-only controls have no accessible name (**grown**: `MonthYearPicker`'s prev/next month, `MyDateInput`'s prev/next day) | **framework** | `_shell/A2`, `leisure-projects/A1`, **`planner-day/A1`** (+ two unfiled in `MyDateInput`) | low |
| FW3 | ✅ **CLOSED 2026-09-13** — `Time.fromJson` cannot parse the backend's string shape (the API had already switched to `{hours, minutes}` on 2026-09-11; `fromJson` now accepts both) | **framework** | `todo-lists/B4` | med |
| FW4 | `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so | **framework** (docs only) | *(none — prevents the next `F12`)* | low |
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
| FW17 | `ActionBar` is `position: fixed; left: 50%` — centred on the **viewport** while `.v-main` is inset by the nav drawer, so the bar's left end slides under the drawer and *Delete* is un-clickable at 1280×720; two `dayPlanner.spec.ts` specs have been `fixme`d on it since before the sweep | **framework** | *(unfiled — unit 7's brief item 2, re-confirmed in its inventory `:144`; `e2e/tests/dayPlanner.spec.ts:203-224`)* | low |
| FW18 | `useEntityQuery.fetchById` holds one controller per **method**, so two ids fetched concurrently from one instance cancel each other — the `useFetchFiltered` bug of 2026-09-11 one helper over; give it the same optional `requestKey` (default-preserving), and amend the `prompts/_common/api/A1` trap and the CLAUDE.md `_common/api/` bullet that both say it does not need one | **framework** (additive API + docs) | *(the framework half of `planner-templates/X1`; `F50` is the app half)* | low |
| FW19 | `extractServerMessage` returns the generic top-level `message` ("One or more errors occurred!") before it looks at `errors`, so against this API's validation shape the specific, human-written text is never shown — a colour-format rule and a system-role 409 both read as the generic string | **framework** (`src/_common/axiosConfig.ts:86-101`) | `activity-settings/B9` | low |
| FW20 | `useTableFormatters`' zero-config heuristics match raw substrings — `durationMinutes` contains `ratio` and renders "45.00 %", `inspirationSource` contains `ratio` and renders "—" for every seeded string; the framework's own `JobRunHistory.vue` already slots `durationSeconds` and `errorSummary` around the same trap. **The `inspirationSource` half is no longer unfiled and is now proved from inside the running component** (`isPercentKey('inspirationSource')` → `true`, `formatPercent(…)` → `"—"`, `getValue(…)` → the real string), which is why it is the worse of the two: this heuristic does not mis-format real data, it **deletes** it | **framework** (`src/_common/composable/table/useTableFormatters.ts`) | `leisure-backlog-picker/B5` (round 2 — round 1's `B1`), **`leisure-bucket-anchors/B3`** | med (decision: word-boundary match vs. opt-in) |
| FW21 | ✅ **FIXED 2026-09-23** (`2351ce7`, bump `a0f116a9` — the list extended, **not** the `/auth/` prefix: the server has signed-in routes under it; unit-tested both ways. Body in the log) — The interceptor's `AUTH_ENDPOINTS` allowlist names five signed-in auth routes and none of the signed-out ones, so a 401 from `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email` or `/auth/resend-confirmation-email/*` costs a `/auth/refresh` round trip while no session exists — one wasted request, nothing visible (`logoutClient()` no-ops signed out) | **framework** (`src/_common/axiosConfig.ts:63-65`) | `auth/B7` (re-graded `bug` → `polish`) | trivial |
| F73 | ✅ **FIXED 2026-09-21** — the three leisure profile DTOs now carry a real `id` (first constructor parameter, destructured in `fromJson`, the getter deleted) and all nine write call sites pass `item.id` / `entityToEdit.id`. Verified live on `/leisure/projects`: status click → `PUT /activity-project-profile/17201` 200, edit → 200 and persisted, delete → 204 and gone after reload. Body in the log | app (`src/core/leisure/dto/response/` ×3 + 9 call sites) | `leisure-projects/X1`, `leisure-backlog-picker/X1`, `leisure-bucket-anchors/X4` | med (effort) / **high** (severity) |
| F74 | ✅ **FIXED 2026-09-22** (`eb13eb1a` — `PUT …/quick-edit` and `POST …/clone` split; a failed rename keeps the dialog open with a specific snackbar instead of saving the rest, because the task's success snackbar would overwrite the error. Verified live in the planner, to-do and routine dialogs, **clone included** — task repointed at the new id; the repeating-task dialog was not driven, no seeded row. **The toggle-off half does not reproduce:** with quick edit off, the Name field is not rendered at all. Body in the log) — **`quickEdit` posts to a route that has not existed since the rename** — the client sends `PATCH /activity/{id}/Overwrite`\|`/Clone`, the server has `PUT /activity/{id}/quick-edit` and `POST /activity/{id}/clone`; every quick-edit and every quick-clone 404s in four dialogs across two modules, and the rejection is swallowed so the whole form save is discarded with no message. Folds the toggle-off half: with quick-edit **off** the Name field is a live-looking no-op. **Sixteenth pass, from the endpoint source:** the two modes differ in **verb and response shape** (`PUT` → **204, no body**; `POST` → **200 carrying the new id**), so the one templated `API.patch(…/${mode})` cannot be repaired by renaming the path segment — it has to split in two | app (`activityApi.ts`, `QuickEditMode.ts`, `ActivitySelectOrQuickEditFormField.vue`) | `planner-day/X1` (both halves) | med |
| F75 | `viewEndDate` never rolls an overnight view onto the next day — with the seed's `bedTime` of `00:00` it resolves to **today at midnight**, so `isDayMateriallyDone` is true all day and the plan-vs-actual verdict ("3 tasks never happened") renders at 19:54 on a day that is not over | app (`dayPlannerStore.ts:157-170`) | `planner-day/B7` | low |
| F76 | ✅ **FIXED 2026-09-21** (same session as `F73`, per its ordering constraint) — `:precision="null"` on the `estimatedHours` `VNumberInput`; the edit dialog now opens on "8.5", and a two-decimal `8.25` submits and persists as `8.25`. Body in the log | app (`NewProjectProfileForm.vue:35-39`) | `leisure-projects/B4` | trivial |
| F77 | ✅ **FIXED 2026-09-21** (same session as `F63`) — required rules on every field the API's `Create*Validator` rejects empty (backlog Location/Weather/Cost, bucket-list Experience type + Inspiration source, anchor Highlight, project Project area), and a leisure `useServerFieldErrors` composable over `extractServerFieldError` that each wrapper form's `onConfirm` routes a caught 400 through, dialog kept open. Verified live: untouched *Create* → required messages and no `POST`; a server-only refusal (*Read a Novel*, already profiled) → *"Activity already has a backlog profile."* under the Activity field. Body in the log | app (`New{Backlog,BucketList,MemoryAnchor,Project}…Form.vue` + their wrappers, `composable/useServerFieldErrors.ts`) | `leisure-backlog-picker/B3`, `B4`, `leisure-bucket-anchors/B2` (feedback half) | low-med |
| F78 | ✅ **FIXED 2026-09-22** (with `F29`) — the board card is `role="button"` + `tabindex="0"` + `aria-label` *"Edit {name}"* with `@keydown.enter.space.self.prevent` (`.self` keeps Enter on the nested status/Delete buttons from also opening the edit dialog); `BackgroundTaskBlock` is `role="button"` + `tabindex="0"` + `aria-pressed` + the composed label as `aria-label`, wired to `useTaskBlockKeyboard` like the foreground block, with a focus ring and a `selected` style. Verified live: Tab from a foreground task lands on the block, Enter selects (*1 selected*), Escape clears and keeps focus, E opens edit; mouse multi-select still 2; Enter on the card's nested *Delete* opens only the delete confirmation | app (`ProjectReadinessBoard.vue`, `BackgroundTaskBlock.vue`) | `leisure-projects/A4`, `planner-templates/A4` | low |
| F79 | ✅ **FIXED 2026-09-21** (same session as `F61`) — one `LeisureEmptyState` component replaces the seven copies; it branches *failed* → *filtered* (`filter.hasAny()`, passed down as `filtered`) → genuinely empty, and the filtered branch offers *Clear filters* (reassigns a fresh filter DTO) instead of *Add*. Verified `?activityName=zzzz` on all seven surfaces, *Clear filters* drops the param and the rows return, and `secondaryUser` still gets the onboarding copy on every surface — which also settles `leisure-projects/U1`'s table half. Body in the log | app (`src/core/leisure/component/LeisureEmptyState.vue` + 4 tables, board, ladder, timeline, 4 views, locales) | `leisure-projects/P3` | low |
| F80 | ✅ **FIXED 2026-09-23** — `metaLine()` joins the present parts with `' · '`. Verified. Body in the log — The board card's metadata line reads "Woodworking· 8.5h" — two adjacent `v-if` templates each lead with `· ` and neither emits a leading space | app (`ProjectReadinessBoard.vue:86-98`) | `leisure-projects/P2` | trivial |
| F81 | ✅ **FIXED 2026-09-23** — `arrows-left-right-to-line` (both suggested icons are the siblings'). Verified, console clean. Body in the log — The repeating-task dialog asks for `fas fa-calendar-range`, which this app does not bundle — the *Date range* recurrence tab renders with no icon and logs a FontAwesome error every time the dialog opens. **Sixteenth pass proved it and bounded it:** `calendar-range` is a FA **Pro** name absent from all three free packs (aliases included), and a sweep of every static icon literal in `src/` found **exactly two** unresolvable ones app-wide — this and `F46`'s `mdi-close`. Not the tip of an iceberg; `calendar-days` is the substitute | app (`RecurrenceType.ts:15`) | `planner-day/P1` | trivial |
| F82 | ✅ **FIXED 2026-09-23** — decided for the asterisk: the server requires `ImportanceId` on repeating tasks only. `planner.importanceRequired`. Verified. Body in the log — *Importance* blocks submission of the New/Edit Repeating Task dialog with "This field is required" and carries no `*`, unlike `* Name` and `* Activity` in the same dialog — and it is genuinely optional in the plain task dialog, so one of the two is wrong | app (`RepeatingTaskDialog.vue`) | `planner-day/P2` | trivial (decision: mark it or relax it) |
| F83 | ✅ **FIXED 2026-09-23** — "N tasks (+M background)" when M > 0. Verified against a created-and-deleted background task. Body in the log — The template header counts foreground tasks only and does not say so — two blocks on screen, "1 task" in the header; the exclusion itself is correct and confirmed live | app (`TemplateDayPlannerView.vue` `taskStats`) | `planner-templates/P3` (was `U1`) | trivial |
| F84 | The history dashboard's pie renders the server's folded-tail row **raw** — the legend reads the literal `_other`, untranslated in both locales, and the slice is selectable (`handleChartClick` has no sentinel branch, so it emits `{id: null, name: '_other'}` and cross-highlights the summary cards). The `activityTracking` pie has translated and blocked the same sentinel since it was written; `historyDashboard` never got the branch, and `HistoryGroupKey.ts:7-8` already documents the row it does not handle. Found from the other side while closing §10 — the backend's out-of-scope flag on `HistoryPieChartBuilder.cs` was **stale** (`OtherName` is already `"_other"`), so this is app-side with no backend half. **Re-read in the API this pass: `HistoryPieChartBuilder.cs:20` is `public const string OtherName = "_other";`** — confirmed on both sides, and the backend's offer to "do the History side as a follow-up" needs no answer because there is nothing there to change | app (`historyDashboard/component/pieChart/HistoryPieChart.vue:41,75-81,113-121`) | *(unfiled — fell out of §10's closure)* | low |
| FW22 | `TableCellEditor`'s `DECIMAL` branch sets `:step="0.1"` and no `:precision`, so Vuetify rounds every decimal inline-edit cell to a whole number — `TableCellType.DECIMAL` does not do what it says. Source-certain, **no consumer in this app yet** | **framework** (`inlineEditTable/TableCellEditor.vue:19`) | *(unfiled — the framework twin of `leisure-projects/B4`)* | trivial |
| FW23 | A second column-header click **adds** a sort key instead of replacing it (`sortBy=activity.name:asc,durationMinutes:asc` from one unmodified click), with no multi-sort affordance anywhere — `VDataTable`'s default, inherited by every table in the app | **framework** (decision: `BasicTable`/`DataTable` default) | `leisure-backlog-picker/P1` (round 2) | low (decision first) |
| FW24 | **`B18` landed and nothing on this side reads it.** Every error body now carries `errorType` (API `cd0a252`), and the interceptor still branches on status alone — so the four different 409s (unique / FK / concurrency / business) are one sentence, and today that sentence is the API's own untranslated English DB prose, because the 409 branch prefers `serverMessage`. Wire the type into `ErrorHandlingFunctions.handleHttpCodes` and `axiosConfig`'s 409/403 branches, status-only as the fallback | **framework** (`ErrorHandlingFunctions.ts`, `axiosConfig.ts`; submodule commit + pointer bump) | escalation §7's frontend half (+ `auth/B6`'s 403 pair, already fixed another way) | low-med |
| FW25 | ✅ **FIXED 2026-09-21** (filed and landed the same day) — three hydrations per settings visit each pushed the browser time zone, and a `PUT` racing a step-up write failed Identity's concurrency check, reported as "Wrong password"; now one in-flight hydration, one zone push per session, and `VerifyUserForm` words only a 401. **Grown on the way:** a wrong step-up password **signed the user out** (401 → refresh → identical retry → 401 → `logoutClient()`), fixed with `_credentialCheck` on the request. Same commit: the 2FA sign-in dialog closes on a refusal instead of inviting a retry the single-use token cannot honour, and the reset button reads *Reset authenticator app*. Body in the log | **framework** (`authStore.ts`, `timeZoneSync.ts`, `VerifyUserForm.vue`, `axiosConfig.ts`, `LoginVerifyQrCode.vue`) | `user-settings/B3`, `user-settings/B4` | low |
| F85 | The two app-side `_silent` 409 workarounds can stop guessing once `FW24` lands — but **not** be deleted as `B18`'s own note suggests: `TimePeriodForm`'s inline conflict error is what keeps the dialog open with the user's input, which an interceptor snackbar cannot do. Branch both call sites on `errorType` instead of on bare status 409, and drop `useDeleteConfirmation` from the change list entirely — it is pre-flight and never sees a response | app (`TimePeriodForm.vue:160-175`, `RoutineSettingsView.vue:175-191`) | escalation §7's app half (`todo-routine/B9`, `B11` — both already fixed; this is their follow-on) | trivial (blocked on `FW24`) |
| F86 | ✅ **FIXED 2026-09-23** (filed and fixed the same day) — `useCalendarUrlState` re-applies every owned key on an outside navigation; **grown on the way:** a spurious *Failed to load the calendar* snackbar on every month deep link (a cancelled fetch toasted as a failure) swallowed the next Back/Forward, because Vuetify closes an open overlay and aborts the navigation; and the framework `Snackbar.vue` now sets `closeOnBack=false`, so no toast traps Back (framework-wide behaviour change, in `FW16`'s submodule commit). Body in the log. Was: Back/Forward on `/day-planner` moves the URL's `?month=` but not the grid — the codec **pushes** a history entry per month and the view reads the query only on mount, so every entry it has ever pushed is one the grid ignores. Predates `F44`; found verifying it | app (`useCalendarUrlState.ts`, `PlannerCalendarView.vue`) | *(unfiled — fell out of `F44`'s verification; P7's "back/forward walks months")* | low |

85 app-side (`F9`, `F17`, `F19`, `F23`, `F35` and `F69` include CLAUDE.md or runbook edits; `F17` and
`F23` are nothing else; `F24`/`F25` are fixed and verified; `F45` is a reserved number, not a batch;
`F85` is blocked on `FW24`; `F9`, `F17`, `F21`, `F22`, `F26`, `F28`, `F32` and `F80`–`F83` landed 2026-09-23 as one trivial sweep, bodies in the log; `F86` was filed and fixed 2026-09-23 while closing `F44`, body in the log; `F73` and `F76` landed together 2026-09-21, then `F63` and `F77`, bodies in the log) · 24
framework (`FW10` is a reserved number, not a batch — see *Needs verification*; `FW14` and `FW25` landed 2026-09-21, bodies in the log) ·
20 escalations (**1 open: §7** — §7's ask has landed, so what is open there is
the frontend half, `FW24` + `F85`, not the ask; **§19 closed 2026-09-21** when `B24` landed and its
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

**Order among the sixteenth-pass batches.** `FW24` before `F85`, necessarily — `F85` reads a field the
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
reopen control settled if both run together, for the same reason `F56` does. `F79` should **not** be
scoped to the projects view: all four leisure surfaces came out of one `L4` pass and share the branch,
and a fix that teaches only the board to say "no results" leaves three tables lying. ~~`F80`, `F81`,
`F82` and `F83` are one-line edits, independent of everything; `F81` and `F82` are the same dialog and
can share a commit, but they are different causes (a missing icon vs. a missing asterisk) and `F82`
needs a **decision** first — mark it required or relax the validator, because the plain task dialog
treats the same field as optional.~~ **All four done 2026-09-23** in the trivial sweep; `F82` was decided
for the asterisk (the API's validator requires `ImportanceId` on repeating tasks only). `FW22` is two repos for one attribute and has **no consumer in this
app**, so its verification is the framework's own, not ours. `FW23` needs a decision before an edit
(rule 4): single-sort is what every table in this app looks like it does, but flipping
`VDataTable`'s default changes every table in every app on the framework — and one of them may be
relying on it.

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
`FW19` and `FW20` are two repos and independent of each other; `FW20` needs a **decision** before an
edit (word-boundary matching keeps zero-config; opt-in changes every app's tables) and its verification
must include the framework's own `JobRunHistory` and every `DataTable` consumer in this app, because
loosening the match can drop a column that was formatting correctly by luck. **Do not add per-table
slots app-side as a workaround for `FW20`** unless the framework declines — the collision class is
"any key containing `ratio`/`rate`/`vat`/`date`/`sum`/`fee`", and `elevated` contains `vat`.

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

**Order among the unit-8 batches.** `F50` first and alone — it is the unit's only *observed* blocker
and a one-file change, and **it does not wait on `FW18`**: the second fan-out (`fetchFiltered`) already
has a `requestKey`, and the first (`fetchById`) can be sequenced or given a second instance today
(the workaround `A1`'s Part 2 catalogues); when `FW18` lands, the pointer-bump commit swaps that
workaround for a key, the same shape as `FW11`/`F39`. **Read the whole batch before editing the
dialog** — the finding's suggested fix moves the `CanceledError` from `:120` to `:122` and the dialog
stays empty. `F51` is the other blocker and the only batch here that needs a resize to verify; its fix
lands in the shared shell, so **drive `/day-planner/:date` at 390 px in the same session** — unit 7
never resized, the day view's mobile layout is a different shape (`DayPlannerView.vue:3` has no
`flex-column`), and `X2`'s *Expected* assumes it works. ~~`F56` before `F51`'s verification if both run in
one session: `F51` adds the reopen control that `F56` then has to name — decide the label once.~~
**`F56` landed 2026-09-22, so the label is already decided:** `F51`'s reopen control reuses
`planner.a11y.openPanel` / `closePanel` (branched on `panelOpen`, as `DayPlannerHeader`'s `bars` toggle
does) and mints nothing. `F52`,
`F53`, `F57` are one-file edits, independent of everything; `F53` before the unit's **mutation pass**,
which will otherwise file the lost-input defect a second time from the create path. `F54` and `F55`
are the `F42` and `F43` shapes on the template side and should ship **after** their siblings, copying
whatever those settle (query codec; not-found treatment) rather than deciding it a second time.
`FW18` is independent, additive, and two repos.

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
`F48` need the SK locale as well as EN. **Run `U1`'s retest in `F27`'s verification session** — `F27`
copies this module's error pattern, and `U1` is the record that nobody has watched that pattern fail
in a browser yet; `playwright-cli route "**/api/activity-tracking/web-extension/pie-chart" --status=500`
settles both in one reload (*Needs verification*).

**Order among the unit-7 batches.** `F41` and `F42` are one file (`DayPlannerSettingsView.vue`), both
trivial, independent of everything; ship them in one commit if convenient, but `F41` alone is a
one-line hotfix and should not wait on `F42`'s design (query vs. route param). `F43` is independent and
needs no browser beyond three URLs. **`FW16` before `F44`, and `F44` rides in the pointer-bump commit** —
the same shape as `FW11`/`F39`: a codec for state the grid does not expose changes nothing visible.
`FW15` and `FW2` edit the same file (`MyDateInput.vue`) — one `vue_framework` commit may carry both if
its message says so, but they close different findings for different reasons (a label bound in the
wrong order vs. no label at all) and stay two batches. `FW15` **breaks one draft assertion** on purpose
(`history-review.draft.spec.ts:28` pins the defect) — fix the spec in the pointer-bump commit. `FW17` is
independent of everything, CSS only, and is the one that un-`fixme`s two existing specs; run
`dayPlanner.spec.ts` after the pointer bump rather than driving it by hand.

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

**Order among the unit-3 batches.** `F27` first if any of the others is going to be verified in the same
browser session — it is the only one that changes what a *failed* request looks like, and `history-review/U1`
(the empty-state check) is only meaningful once "empty" and "failed" are distinguishable on screen. `F29`
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

## F27. History dashboards have no error state — three fetch owners null or keep their data on failure, and every panel says "No data for this period"

- **Scope:** app-side — `src/core/activityHistory/composable/useHistoryDashboard.ts`,
  `src/core/historyDashboard/component/HistoryTimeline.vue`,
  `src/core/activityHistory/view/HistoryCalendarView.vue`, and the panel components that render the
  empty state (`HistorySummaryCards.vue`, `HistoryPieChartSection.vue`, `HistoryInsights.vue`) plus the
  two views' `<StackedBarsChart>` bindings
- **Closes:** `history-review/B2`
- **Root cause — confirmed, and wider than filed.** Three different failure behaviours, none of them an
  error state:
  1. **The composable nulls and forgets.** `useHistoryDashboard.ts:135-182` — each of the four fetchers is
     `try { data = await … } catch { data = null } finally { loading = false }`. Its own comment (`:132-134`)
     says the null is deliberate so a stale chart never reads as a true one, and that *"the axios
     interceptor still raises the error snackbar"*. Both true; but `null` is also what an empty response
     *looks like* to every consumer — `HistorySummaryCards.vue:49` (`!data || data.cards.length === 0`),
     `HistoryPieChartSection.vue:14`, and `HistorySummaryView.vue:44-55` / `HistoryDetailView.vue:91-100`
     pass `StackedBarsChart` `:windows`/`:loading` and **no `:error`**, so the chart's own `windows.length
     === 0` branch (`StackedBarsChart.vue:60-69`) renders the no-data copy. A snackbar that disappears
     versus a panel that stays on screen saying *"No data for this period · 09.09.2026"* — the panel wins.
  2. **The timeline keeps the previous day.** `HistoryTimeline.vue:156-164` is `try { historyList = await
     … } finally { loading = false }` — **no `catch`**. A failed `detail/timeline` request leaves the
     *previous* date's records under the new date's `periodLabel` (`:14`), which is precisely the
     stale-reads-as-true case the composable's comment was written to prevent, and the rejection escapes
     the `watch` at `:166-169` as an unhandled one.
  3. **The calendar view renders a blank grid.** `HistoryCalendarView.vue:54-69` is the same
     `try/finally` with no `catch`. On a failed month change `days` keeps the previous month's rows;
     `CalendarGrid.calendarWeeks` (`:209-266`) looks each week up by date, finds nothing in the new range,
     pushes no weeks — and `allDaysEmpty` (`:52`) is `false` because the *old* rows have data, so the
     empty state does not render either. Blank card, no message, unhandled rejection from the
     `dateRangeChange` emit's watcher.
  Cases 2 and 3 are **source-certain and unobserved** — the unit mocked only `detail/pie-chart`. They are
  in this batch because they are the same concern in the same view family with the same fix, not because
  a browser has seen them; the verification step below is what makes them observed.
- **The pattern is already written, one module over — copy it, do not design a new one.**
  `useActivityDashboard.ts:306-316` holds one `ref(false)` error flag per panel; each fetcher resets it,
  sets it in `catch` (skipping `axios.isCancel`, `:109-110`), and requests carry `_silent: true` so the
  interceptor's snackbar is suppressed and the failure surfaces **only** as the panel's retry state
  (`:306-307`); the empty-state test at `:483-496` is guarded on `!…Error` for every panel. The four
  tracking dashboards then bind `:error`/`@retry` on every panel (`ActivityDashboard.vue:21-87`), and
  `StackedBarsChart.vue:41-57` **already renders that state** — icon, `activityTracking.common.loadFailed`,
  a Retry button emitting `retry`. `useHistoryDashboard`'s docstring (`:80-82`) says it was *"shaped after
  `activityTracking`'s `useActivityDashboard`"*; the error half is the part that was not carried over.
- **Files:** `useHistoryDashboard.ts:101-105` (add the four flags beside the loading ones), `:135-182`
  (set/reset), `:207-211` (exclude errored panels from `isEmpty` — a failed round must not trigger the
  first-run check, and must never resolve `hasAnyHistoryEver` to `false`), `:251-277` (export);
  `historyDashboardApi.ts:28-103` (`_silent: true` on the seven dashboard reads — **not** on
  `getHasAnyHistoryEver`, which has its own `catch`); `HistorySummaryCards.vue:47-53` and
  `HistoryPieChartSection.vue:14-20` (an `error?: boolean` prop and a `retry` emit, rendering the same
  shape as `ActivityPieChartSection.vue:24` — `HistoryEmptyState` can take an `error` variant, or a
  sibling `HistoryErrorState`, whichever keeps the H7 `periodLabel` off the error copy); `HistoryTimeline.vue:156-164`
  and `HistoryCalendarView.vue:54-69` (add the `catch`, an `error` ref, and the state); the two views'
  `<StackedBarsChart>` (`:error="stackedBarsError" @retry="fetchStackedBars"`) and `HistoryInsights`
  (which reads `pieChartData`/`timeOfDayData` and should hide, not say "no data", when either errored).
- **What to change:** Exactly the tracking shape, in the history composable and the two view-local
  fetchers. **Two decisions to make once, not per panel:** (a) `_silent` — adopt it, so a failed round
  is one retry state per panel and not four snackbars plus four panels; (b) the Calendar view's error
  state has to render *outside* `CalendarGrid` (the grid has no error slot and is framework) — the
  `HistoryEmptyState` slot above it at `:8-13` is the place, with `days` cleared to `[]` on failure so the
  grid is honestly empty rather than blank-with-stale-rows. Retry for the calendar re-fires
  `fetchCalendarActivity` with the last range — hold the range in a ref; `CalendarGrid` only emits it
  on change.
- **Do not change:** `StackedBarsChart.vue` — it already has the state. `HistoryEmptyState`'s existing
  callers' copy (`activityTracking.common.noDataForPeriod`) — cross-module locale reuse that the H5
  comment records as deliberate; the *error* copy can reuse `activityTracking.common.loadFailed`/`retry`
  the same way or get `historyDashboard.*` keys, but do not fork the no-data string. `checkFirstRunIfEmpty`'s
  own `catch` (`:217-225`) — it is already right.
- **Verification:** `history-review/B2`'s `Verify:` block (`playwright-cli route
  "**/api/activity-history/dashboard/detail/pie-chart" --status=500`, reload `/activity-history/detail`) —
  the pie panel shows a state visibly distinct from *"No data for this period"*, with a working Retry
  (`unroute`, click, the panel populates). Then the two cases the unit did not mock: route
  `**/dashboard/detail/timeline` → 500 and **change the date** — the timeline must not show the previous
  day's records; route `**/dashboard/calendar` → 500 and **change the month** — the calendar must show an
  error state, not a blank grid, and `playwright-cli console error` must carry **no** unhandled
  rejection. Then the summary: route `**/dashboard/summary/*` → 500 on a fresh load and confirm the
  first-run block does **not** appear (the `isEmpty` guard). Finally, with nothing routed, the seed's
  empty day (`date=2026-09-07`) must still read *"No data for this period"* — the fix must not turn empty
  into error.
- **Risk:** Medium — it touches every panel on three views and changes what a failure looks like for all
  of them. `_silent` removes a snackbar users may be used to; that is the tracking dashboards' existing
  behaviour and the consistent choice. The `isEmpty` guard is the subtle part: get it wrong in the other
  direction and a genuinely-new user with one failed panel never sees the onboarding block.

<!-- F28 (`/activity-history/detail` breadcrumb reads "Home › Summary" — history-review/B3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## F31. Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas, and `isNarrow` is a dead prop

- **Scope:** app-side `src/core/historyDashboard/component/pieChart/HistoryPieChart.vue`
- **Closes:** `history-review/P2`
- **Root cause — not "in-hole", and the suggested fix does not apply.** The legend is not inside the
  donut; it is an ECharts legend boxed to the **left 58 %** of the canvas (`HistoryPieChart.vue:59-63`:
  `orient: 'vertical', left: 0, right: '42%'`) while the pie is centred at **74 %** with an outer
  radius of 75 % (`:87-88`). On a wide canvas the pie's left edge lands at ~57 % and the two just clear.
  But `HistoryPieChartSection.vue:23-34` puts the chart in a `flex-fill` **beside a 200–250 px details
  card**, inside the Summary view's `lg="6"` column — so at 1440 the canvas is roughly 300 px wide, the
  legend box ends at ~175 px and the pie starts at ~130 px. ECharts does not clip legend text to the box
  (the `formatter` at `:73-82` truncates at 25 *characters*, which is a width the layout never measured),
  so the entry runs into the slices. Same geometry on Detail's `HistoryInsightsColumn direction="row"`.
  `isNarrow?: boolean` (`:30`) is declared, passed by `home`'s `ActivityHistoryWidget.vue:26`, and **read
  nowhere** — it is the hook this fix was supposed to hang on.
- **Files:** `HistoryPieChart.vue:27-31` (props), `:59-88` (legend and series geometry)
- **What to change:** Make the layout answer to the width. Either honour `isNarrow` (and have
  `HistoryPieChartSection` derive it from its own measured width — `useResizeObserver` is already in use
  in `HistorySummaryCards.vue:137`) or measure inside the chart component; below the threshold, put the
  legend `orient: 'horizontal'` at `bottom` and centre the pie at `['50%', '45%']`. Above it, keep the
  side layout but truncate by **pixels** — ECharts 5's `legend.textStyle.width` + `overflow:
  'truncate'` — instead of by character count, and let the pie `center` follow the legend's actual
  width rather than a constant 74 %.
- **Adjacent, source-certain, unobserved:** `textStyle.color: '#fff'` (`:69`) and `borderColor: '#666'`
  (`:64`) are hardcoded — dark-theme values on a chart that renders in both themes
  (`createAppVuetify.ts:74` defaults to dark, which is why the sweep never saw white-on-white). Read
  `useTheme().current.value.colors['on-surface']` instead. Same hardcode in
  `StackedBarsChart.vue:479` (`.legend-label { color: #fff }`) — unit 5's, out of scope, noted so a
  fixing session that opens both does not fix one.
- **Do not change:** the `avoidLabelOverlap: false` / `label.show: false` series settings — slice labels
  are off by design and the tooltip carries them. Not the 25-item cap on the request
  (`HistorySummaryView.vue:231`) — fewer entries would dodge the symptom without fixing the layout.
- **Verification:** `history-review/P2`'s `Verify:` block on `/activity-history/detail?date=2026-09-09`
  (two groups) — a **screenshot**, since the a11y tree cannot see a canvas: legend text fully clear of
  the slices. Then `/activity-history` with `?groupBy=activity` and the week range (more entries, longer
  names), at 1440 and 1920; and the home widget, which passes `isNarrow` and should get the stacked
  layout. Both themes if the colour half is taken.
- **Risk:** Low-medium. A width-driven layout switch is a second render on resize; ECharts `autoresize`
  is already on (`:4`), so the cost is the option recompute. Check the selection highlight
  (`selectedMode: 'single'`) survives a layout switch mid-selection.

<!-- F32 (`/activity-history/calendar` has no `<h1>` — history-review/P3) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F33 + F34 (Google Calendar: send `state`; `errorDark` on the Disconnect button) fixed 2026-09-21
     together with the frontend half of `B14` (§9). Bodies in _fix-queue-log.md → Closed batches. -->

## F36. Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take a time-of-day default

- **Scope:** app-side `src/core/activityHistory/` only — **not** `src/_common/component/dateTime/TimePicker.vue`
- **Closes:** `history-capture/B2`
- **Root cause:** Confirmed in source. `TimePicker.vue:69` defaults `allowedMinutesSelected = '5'`, and
  both write paths snap: the mask watcher (`:114-129`) rounds typed minutes through
  `roundToNearestInterval` (`DateTimeHelper.ts:166-168`, `Math.round(m / i) * i`), and the `timeString`
  setter (`:97-101`) rounds again for the menu. The finding's evidence is exact (`0007` → `00:05`, `0001`
  → `00:00`), and the app already states the convention the finding is asking for:
  `SuggestedTimeFormField.vue:15` passes `allowedMinutesSelected="1"` for a typed duration, while
  `TaskPlannerDayTemplateDetailsForm.vue:18,25` passes `"10"` and `QuietHoursCard.vue:43,55` `"5"` for
  times of day. **This module never passes it.** The finding counts three call sites; the module has
  **eight tags in six files**, every one a duration, every one at the default: `TimerView.vue:14`
  (Length), `PomodoroDurationCard.vue:15` (mounted three times by `PomodoroSetupPanel.vue:21-31` — the
  three fields the finding saw), `AddActivityManuallyForm.vue:16` (Length), `EditActivityHistoryForm.vue:8`
  (Length, on the history record edit dialog — unit 3's screen), `TimerPresetDialog.vue:15` (Duration),
  `PomodoroPresetFormDialog.vue:75,84,93` (Focus / Short break / Long break).
- **The preset editors are the reason this is a `bug` and not `polish`.** The API's per-user default
  seeder ships *Short Sprint* with `ShortBreakDuration = 3` (`PomodoroTimerPresetSeeder.cs:46-50`) — a
  value that every account has from day one and that `PomodoroPresetFormDialog` cannot re-enter: the
  field displays `00:03` (reads are not rounded), but the menu's `allowedMinutes` (`TimePicker.vue:91`)
  greys out 3, a typed `0003` becomes `00:05`, and the arrow buttons step 3 → 8 / 3 → 0. Touch that
  field once and the preset can never go back to what the server gave it.
- **Files:** the eight tags above.
- **What to change:** Add `allowedMinutesSelected="1"` to all eight. That is the whole change. Do it as
  one commit so the module has one rule (durations are minute-exact), and say so in the message. Two
  things to leave alone while there, both dead attributes that land on `TimePicker`'s root `div` and do
  nothing: `variant="outlined"` on `TimerPresetDialog.vue:20` and `PomodoroPresetFormDialog.vue:79,88,97`
  (`TimePicker` has no `variant` prop — `VMaskInput` takes the app default), and `minWidth`/`maxWidth` on
  `EditActivityHistoryForm.vue:12-13` (not props either; `width` is). Deleting them is harmless and
  optional; adding them as real props is a different batch.
- **Do not change:** `TimePicker.vue`'s default, `roundToNearestInterval`, or the snap itself — a
  framework-wide default is its own batch (rule 4) and the component has time-of-day consumers for
  which `'5'` is right. Do not touch the duration fields in other modules that have the same gap —
  `LogTimeBody.vue:10` (dayPlanner, unit 7 not run) and the framework's `LogTimeForm.vue:15` — they are
  the same one-attribute edit, but they belong to units that have not filed them, and the second is a
  submodule commit. Do not add a "rounded to" helper text: at `'1'` there is nothing to explain.
- **Verification:** `history-capture/B2`'s `Verify:` block, first pass condition (the field **keeps**
  `00:07`) on `/activity-history/timer`, all three Pomodoro cards and `/activity-history/manual`; then the
  three the finding did not list — open *Short Sprint* in the Pomodoro presets dialog, type `0003` into
  Short break, read `00:03`; open a quick-time preset in edit mode on `/timer` (after `F37`, or via the
  chip label), same check; open a history record's edit dialog on `/activity-history` and type an odd
  length. Then the menu: click the Length field, confirm every minute is selectable. Then Start a
  7-minute countdown and confirm `POST timer-alarm/schedule` carries an `endsAt` 7 minutes out, not 5.
- **Risk:** Low. The only behavioural change is that the arrow buttons now step by one minute instead
  of five on these fields — fine for a duration, and none of the eight passes `showArrows` anyway.

## F37. Preset chips define `#close` without `closable` — a live "Close" button that hides the chip, and in edit mode it *is* the pencil

- **Scope:** app-side `src/core/activityHistory/component/TimerPresetsSection.vue`
- **Closes:** `history-capture/B3`, and the chip-role observation the unit's inventory attributes to a
  finding `A1` that was never filed (`inventory.md:79`, *"no accessible role/name — see finding A1"*;
  *Contradictions* §49)
- **Root cause:** Confirmed against Vuetify 3's source, and the finding's guess is right:
  `VChip.js:179` is `hasClose = !!(slots.close || props.closable)`, so **defining the slot is what
  renders the button** — `<button class="v-chip__close" aria-label="Close">` (`:274-279`), always, with
  `closeProps.onClick` (`:136-141`) doing `preventDefault()`, **`stopPropagation()`**, `isActive = false`,
  `emit('click:close')`. `TimerPresetsSection.vue:44-51,93-100` puts a `v-if="editMode"` pencil *inside*
  that slot, so outside edit mode the button is empty and still focusable (the finding's observation),
  and clicking it flips the chip's private `isActive` — client-side only, no listener on `click:close`,
  back on reload (also the finding's observation). **What the finding did not see, because the pass did
  not click the pencil:** inside edit mode the pencil sits inside the same button, so a click on the one
  affordance that says "edit" is swallowed by `stopPropagation` before the chip's own
  `@click="openEditDialog(preset)"` (`:41,:90`) can run — the chip disappears and no dialog opens. The
  editor is reachable only by clicking the chip's *label*, which is what the `pr-4` padding hack on
  `:38` is compensating for. Source-certain; one outcome.
- **Files:** `TimerPresetsSection.vue:35-52` (quick-time chips), `:85-101` (activity chips)
- **What to change:** Delete both `#close` templates and move the pencil to the chip's **append** side:
  `:appendIcon="editMode ? 'pen-to-square' : undefined"` on each `VChip`. That renders no close button
  in either mode, the pencil becomes part of the chip's own click target, `openEditDialog` handles the
  click as already written, and the `:class="{ 'pr-4': editMode }"` on `:38` can go (the activity chips
  never had it — the two rows will finally match). Deletion stays where it is, behind the edit dialog's
  *Delete* button (`TimerPresetDialog.vue:38,126-133`) — do **not** take the finding's second option
  ("clicking it actually deletes the preset"): a bare × on a chip with no confirmation is the exact
  affordance the app already decided against by putting delete in a dialog. **While in the file:** the
  chips are clickable `span`s with `tabindex="0"` and Enter/Space handling (Vuetify supplies both,
  `VChip.js:169-174,195-197`) but **no `role`**, which is the inventory's unfiled `A1` and why its
  locator is `.locator('span').filter({ hasText })`. Add `role="button"` to both `VChip`s — one attribute,
  same tags, and it makes the draft spec's chip locators `getByRole('button', { name: '15m' })`. That is
  the whole a11y change; the chip text is already the accessible name.
- **Do not change:** `TimerPresetDialog.vue` — its delete path is fine for this batch. (Adjacent, not
  filed, not for this batch: `:129` confirms through `useDialog().confirm()` unconditionally rather than
  `useDeleteConfirmation`, so a user with `askBeforeDelete = false` is still asked — CLAUDE.md's
  preference-ownership table lists five delete sites and this is a sixth. Unit 4's mutation pass did
  **not** exercise it — it skipped `B3`'s surface as unchanged — so it stays source-only; `F69` is the
  same class in `todoList`, observed, and fixes its site the way this one should be fixed when touched.)
  Do not add a `closable` prop with a handler — that keeps the button and
  its "Close" name for a control that does not close anything.
- **Verification:** `history-capture/B3`'s `Verify:` block, first pass condition: outside edit mode,
  `document.querySelectorAll('.v-chip__close').length === 0` on `/activity-history/timer`, and Tab from
  the *Edit* button lands on the first chip, not on a nameless button inside it. Then the half the pass
  never ran: click *Edit*, click the **pencil** on the *15m* chip — the preset dialog opens with *15m*
  loaded and the chip is still in the row. Then `find` the chips as `button "15m"` (role check). Repeat
  the pencil click on an activity-preset chip (create one through the `+` first if the seed has none —
  `inventory.md:93` says it does not).
- **Risk:** Low. `appendIcon` renders a `VIcon` with `end: true` and **no size** (`VChip.js:253-256`),
  where the close slot forced `x-small` (`:283-291`) and the pencil forced `size="16"` — so the icon
  will come out a step larger than today. Check it visually once; if it matters, use the `#append` slot
  with the sized `VIcon` instead of the prop — same fix, no close button either way.

<!-- F39 (the auth guard's redirect drops the destination — `auth/B1` write half) fixed 2026-09-23 in `7a612d7f` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F41 (settings tabs stacked — `d-flex` on a `VTabsWindowItem` beat `v-show` — `planner-day/B1`) and F42 (settings tab not in the URL — `planner-day/B6`) fixed 2026-09-22 — bodies moved to _fix-queue-log.md → Closed batches on 2026-09-23. Numbers retired, not reused; the summary table keeps their ✅ rows. -->

<!-- F44 (calendar Days to show and Range/Duration configuration in the URL — `planner-day/B3`, app half) fixed 2026-09-23 in FW16's pointer-bump commit — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. The Back-button gap it surfaced was filed and fixed as F86 the same day. -->

<!-- F46 (pie-chart detail panel close button — one `pieChart.closeDetails` key on all four, `mdi-close` → `fas fa-xmark` — `tracking-dashboards/B1`, `A2`) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F48 (Android pie's no-op Total/Active/Background radio + the timeline's always-empty Background legend entry — unfiled) fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## F50. The Compare Templates dialog is empty every time — two unkeyed fan-outs, and the finding's fix closes one

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplateComparisonDialog.vue`
- **Closes:** `planner-templates/X1`; folds **`planner-templates/B3`** (same file, one attribute — see
  below)
- **Root cause:** Confirmed in source. `TemplateComparisonDialog.vue:107-108` destructures one
  `useTaskPlannerDayTemplateTaskCrud()` and one `useTemplatePlannerTaskCrud()`, and the `watch(dialog)`
  at `:116-132` does two fan-outs from them: `:120` `Promise.all([fetchById(ids[0]), fetchById(ids[1])])`
  and `:121-124` `Promise.all([fetchFiltered(…t1…), fetchFiltered(…t2…)])`. Both helpers abort their
  own previous call — `useEntityQuery.ts:35` unconditionally (`fetchByIdController?.abort()`, one
  controller per *method*, so a second id cancels the first), and `useFetchFiltered.ts:54-56` per
  `requestKey`, defaulting to one shared key when none is passed — so in each pair the first promise
  rejects with `CanceledError`, `Promise.all` rejects, `run()` re-throws cancellations by design
  (`useRequestState.ts:45`), and the `try … finally` at `:119-131` never reaches `sides.value = …`.
  The two-null default renders the `:00 - :00 · 0 tasks` the unit photographed. **The finding sees
  only the first pair.** Its suggested fix — key or split the two `fetchById`s — makes `:120` resolve
  and moves the identical failure to `:122`; the dialog stays empty and the console shows the same
  error one line down. `TemplateListView.vue:315-326`, in this module, already documents and uses the
  `requestKey: t.id` form for exactly this fan-out.
- **`B3`, same file:** `:6` passes `:showConfirmBtn="false"`; `MyDialog`'s prop is `hasConfirmBtn`
  (`MyDialog.vue:94,110`), so the attribute lands in `$attrs` and a live *Confirm* renders that emits
  `confirmed` to nobody. The other seven call sites in `src/` spell it correctly — one typo, not a
  class.
- **Files:** `TemplateComparisonDialog.vue:6` (`B3`), `:107-108`, `:116-132`
- **What to change:** Three edits. **(a)** `:121-124` — pass `{ requestKey: t1.id }` / `{ requestKey:
  t2.id }` as the third argument, the form `TemplateListView.vue:326` uses; the keyed API exists today.
  **(b)** `:120` — until `FW18` lands, either `await` the two `fetchById`s sequentially (one extra
  round trip inside a dialog that already shows a spinner) or take a second
  `useTaskPlannerDayTemplateTaskCrud()` instance for the right-hand side **with a comment naming the
  cause** in the `aborts its previous` wording `prompts/_common/api/A1` greps for, so that batch's
  Part 2 finds and retires it. After `FW18`: `fetchById(id, undefined, { requestKey: id })` and delete
  the workaround in the pointer-bump commit. **(c)** `:6` — `:hasConfirmBtn="false"`. Consider a
  `catch` that shows the interceptor's toast *and* keeps `sides` on the two-null default behind a
  `v-if="side.template"` guard, so a real failure reads as "nothing loaded" rather than as a template
  with no name and no tasks — the current empty-state markup is what made this look like data.
- **Do not change:** `useEntityQuery.ts` (that is `FW18`, a `vue_framework` commit); the
  `TemplatePlannerTaskFilter` window (`t.defaultWakeUpTime … defaultBedTime`) — the list view uses the
  same bounds.
- **Verification:** `X1`'s `Verify:` block — both panels show name, icon, chips and a populated
  timeline; **`playwright-cli requests` shows two `GET /task-planner-day-template/{id}` and two `POST
  /template-planner-task/filter`, none `ERR_ABORTED`** (a clean console proves nothing here —
  cancellations are not logged, `A1`'s *Traps*). Then `B3`'s: only *Cancel* renders. Open → Cancel →
  reopen with the *same* two ids, since the watcher refetches on every open.
- **Risk:** None beyond the dialog. If (b) takes the second-instance route, `A1`'s workaround table
  grows by one row until `FW18` retires it — say so in the commit.

## F51. The template planner's side panel at `<md` is the open panel, squeezed and off-screen — and nothing reopens it

- **Scope:** app-side `src/core/dayPlanner/component/PlannerSidePanelShell.vue`,
  `src/core/dayPlanner/view/TemplateDayPlannerView.vue`,
  `src/core/dayPlanner/component/template/TemplatePlannerHeader.vue`
- **Closes:** `planner-templates/X2` (+ corrects the inventory's `:162` "mobile panel-open toggle (the
  collapsed pill)" row — see *Contradictions* §86)
- **Root cause:** Two halves, and the finding describes the first through a misreading. **(1) Layout.**
  `PlannerSidePanelShell.vue:7` sets `width` as an inline style (`400px` from
  `TemplateDayPlannerView.vue:9`, `380px` by default) with `minWidth: '280px'` and no breakpoint
  override, while `TemplateDayPlannerView.vue:3` switches the container to `flex-column` below `md`
  and keeps `h-100`. So at 390 px the card is 400 px wide in a 390 px column — the page scrolls
  sideways, which is the `left: -166` and the second screenshot — and, as a column item with no
  `flex-shrink: 0` or minimum height beside a `flex-fill` grid, it is squeezed to its 16 px
  `VCardTitle` sliver. `panelOpen` starts `true` (`useRoutinePlacement.ts:28`), so **the "collapsed
  pill" the unit tapped *is* the open panel** — the two mobile screenshots show the same element
  before and after a horizontal scroll, not a closed and an opened state. **(2) No reopen.** The only
  writer of `panelOpen = true` in the template planner is its initial value: the shell's X sets it
  `false` (`:22`), `TemplatePlannerHeader.vue` has no toggle, and `v-show="panelOpen || mdAndUp"`
  (`:4`) then hides the panel until a reload. The day planner has the control the template planner
  lacks — `DayPlannerHeader.vue:7-14`, a `d-md-none` `bars` `VIconBtn` (itself unnamed; `F56`). The
  unit's *Expected* (*"the way it does on `DayPlannerSidePanel`'s default 380px"*) is unobserved: unit
  7 never resized, and `DayPlannerView.vue:3` has **no** `flex-column`, so at 390 px the day view is a
  380 px panel *beside* the grid — a different failure, not a working reference.
- **Files:** `PlannerSidePanelShell.vue:3-8` (width/height at `<md`), `:16-23` (close X);
  `TemplateDayPlannerView.vue:3,9`; `TemplatePlannerHeader.vue:3-8` (where the toggle goes);
  reference — `DayPlannerHeader.vue:7-14`, `DayPlannerView.vue:3`
- **What to change:** **(a)** In the shell, apply the caller's `width` only at `mdAndUp` (the composable
  is already there, `:85`) and go full-width below it — `width: '100%'`, drop the `minWidth` — and
  give the card `flex: 0 0 auto` (or a `min-height: fit-content`) so a column parent cannot squeeze it.
  Whether the mobile panel is an in-flow block above the grid or an overlay (`VNavigationDrawer
  temporary`, or a `VBottomSheet`) is a design choice; in-flow is the smaller change and matches the
  `flex-column` the view already opts into. **(b)** Add the reopen control to
  `TemplatePlannerHeader.vue` — the same `d-md-none` `bars` button `DayPlannerHeader.vue:7-14` renders,
  bound to the view's `panelOpen` (it is not in the header's props today; pass it as a model the way
  `DayPlannerHeader` takes `v-model:panelOpen`). Name it in the same edit — `F56` lists it. **(c)** Look
  at `DayPlannerView.vue:3` while there: it should probably take the same `flex-column flex-md-row`
  the template view has, but that is unit 7's screen and unobserved — verify before changing, and file
  what is seen rather than fixing blind.
- **Do not change:** the `mdAndUp` breakpoint (the shell's own comment says why it is not the caller's);
  `useRoutinePlacement.ts` — `panelOpen` living there is fine, it just needs a second writer.
- **Verification:** `X2`'s `Verify:` block at 390×844 on `/day-planner/templates/20001`: the panel's
  bounding box is ≤ viewport width, fully on-screen, tall enough to show *Template Name*; **plus:** tap
  X → panel gone, tap the new toggle → panel back, no reload; `window.scrollX` stays 0 throughout. Then
  the same three checks on `/day-planner/<today>` — the shell is shared, and that view's `bars` toggle
  already exists, so a fix that works only under `flex-column` shows up there.
- **Risk:** Medium — it is the chrome of both planners at every width below 960 px, and the day view's
  mobile layout has never been looked at. Screenshot both views at 390 and at 1024 (just above `md`)
  before and after.

## F52. Template card title row — the name never truncates, so the switch label and the chip pay for it

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplateCard.vue`
- **Closes:** `planner-templates/B1`
- **Root cause:** Confirmed in source. `VCardTitle` (`:8`) is `d-flex justify-space-between
  align-center`; the left group (`:9-25`, checkbox + icon + `<span>{{ template.name }}</span>`) has no
  `min-width: 0` and no `text-truncate`, so it keeps its intrinsic width, and the right group
  (`:26-51`, `DayTypeChip` + `VSwitch` with an inline `label` + pin `VIconBtn`) absorbs the shortfall:
  the switch's label box collapses to ~20 px with `white-space: normal` (one letter per line) and the
  chip clips with `text-overflow: clip`. Vuetify's `VCardTitle` sets `white-space: nowrap` and
  `overflow: hidden` on itself, which is why the row clips rather than wraps. Three cards, three
  column widths — the unit measured it on all three.
- **Files:** `TemplateCard.vue:8-51`
- **What to change:** Make the *name* the flexible part: `min-width: 0` + `text-truncate` on the name
  span (with `:title="template.name"` so the full name is recoverable), and `flex-shrink-0` on the
  right-hand group so its three controls keep their intrinsic width. Then decide whether the switch
  needs a visible label at all — the row is already the busiest in the card, and `F56` is about to
  give the pin a name; a switch named by `aria-label` with the state shown by its own thumb is the
  usual Vuetify shape. If the label stays, `white-space: nowrap` on it as well. Do **not** solve it by
  fixing the card grid's column width — the chip count and the name length are both data-driven.
- **Do not change:** `DayTypeChip` — it is shared with the comparison dialog and the day view; the clip
  is the row's fault, not the chip's.
- **Verification:** `B1`'s `Verify:` block at 1440×900 — *Active*/*Inactive* on one line, *Weekend* and
  *Workday* whole (or an ellipsis + tooltip). Add a template with a 40-character name through *Add
  Template* (`F53` makes that path safe) and confirm the *name* is what truncates.
- **Risk:** None — one row's CSS.

## F53. The template form mirrors none of the API's contract — a required enum is optional, and nothing else is checked either

- **Scope:** app-side `src/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts`,
  `src/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue`
- **Closes:** `planner-templates/B2`
- **Root cause:** Confirmed on both sides. The client DTO declares `suggestedForDayType?: DayType`
  (`TaskPlannerDayTemplateRequest.ts:14`) with no default, so a blank *Add Template* serialises without
  the key; the server's `TaskPlannerDayTemplateRequest.cs:29` is `public required DayType
  SuggestedForDayType`, and `System.Text.Json` rejects the body before validation runs — the
  `serializerErrors` 400 the unit quoted, surfaced by the interceptor as the server's generic title.
  **Wider than the finding:** the form (`TaskPlannerDayTemplateDetailsForm.vue:6-79`) declares no
  `:rules` on any field, so `validateAndGetData()`'s `form.validate()` (`:143`) is always `true`;
  `Name` is `[Required][StringLength(100)]`, `Description` `[StringLength(500)]`, `Icon`
  `[StringLength(50)]` on the server (`:11-19`), and an empty name or a 101-character one takes the
  same route — dialog closed, input gone, generic snackbar. *Duplicate* and *Edit* hide all of it
  because `fromEntity` copies a valid enum in. **Not a backend ask:** the column is non-nullable and
  indexed (`Initial.Designer.cs:1669,1701`), `/suggestions` matches on it, and every server-side
  fixture sets it — the field is required by design, and the client is the side that disagrees.
- **Files:** `TaskPlannerDayTemplateRequest.ts:14` (and `:8-19` generally),
  `TaskPlannerDayTemplateDetailsForm.vue:6-11` (name), `:30-36` (description), `:38-43` (day type),
  `:67-72` (icon)
- **What to change:** **(a)** `suggestedForDayType: DayType = DayType.Workday` (or whichever the owner
  wants as the blank-form default — the seed's three templates are two `Workday`, one `Weekend`), so
  the type stops lying and a blank form is a valid body. **(b)** Rules that mirror the contract:
  required + `maxLength(100)` on the name, `maxLength(500)` on the description, `maxLength(50)` on the
  icon, required on the day-type select — through `RulesComposition.ts` so the messages are the
  app's, not hand-written. `hideDetails` on every field means the messages need somewhere to render;
  drop it on the fields that gain a rule, or use `hideDetails="auto"`. **(c)** Optional but worth the
  look: the dialog closes on `dialogApi.close({ request })` (`TemplateDetailsForm.vue:32`) and the
  caller then calls the API (`TemplateListView.vue:337-352,371-402`), so *any* server rejection —
  a future 409 on a duplicate name, say — still costs the user their input. Moving `create`/`update`
  inside the dialog's `onConfirm` under `dialogApi.setLoading()` keeps the dialog open on failure.
  Check how the app's other `openDialog` consumers do it before diverging; if they all close-then-call,
  this is a pattern decision, not this batch's.
- **Do not change:** the server DTO; the `Time` defaults (`07:00`/`23:00`) — those already work.
- **Verification:** `B2`'s `Verify:` block — *Add Template*, name only, *Create*: **either** the select
  blocks with a required message and the dialog stays open, **or** the template is created with the
  default and the app lands on `/day-planner/templates/<newId>`; no 400, no *"One or more errors
  occurred!"*. Then an empty name → blocked in the dialog, not a 400. Confirm the list count went
  from 3 to 4 and reseed.
- **Risk:** Low. A default day type means a user who ignores the field gets `Workday` silently — the
  select shows it, and that is the trade the unit's own *Expected* offers.

<!-- F54 (template list sort and the split view's picks not in the URL — `planner-templates/B4`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches on 2026-09-23. Number retired, not reused; the summary table keeps its ✅ row. -->

## F57. The Scheduled Days picker is clipped to Mon–Fri in the 400 px template panel

- **Scope:** app-side `src/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue`
- **Closes:** `planner-templates/P1`
- **Root cause:** Confirmed. `:77` renders the framework's `DayOfWeekPicker` — a `VBtnToggle` of
  seven `size="small"` buttons with `divided`, `display: inline-flex`, no wrap — inside a `div` in a
  `flex-column` group (`:63-66`, the non-dialog branch of `:65`). Seven small buttons plus dividers need more
  than the ~360 px the panel leaves after padding, and `VCard`'s `overflow: hidden` clips the rest.
  In the dialog (`isDialog`, `flex-md-row`) the same picker has the dialog's width and is fine — the
  400 px panel is the only place it renders narrow.
- **Files:** `TaskPlannerDayTemplateDetailsForm.vue:73-78` (the label + picker block); reference —
  `src/_common/component/inputs/DayOfWeekPicker.vue` (single root, so a class on the tag lands on the
  `VBtnToggle`)
- **What to change:** App-side, one class: `class="flex-wrap"` on the `<DayOfWeekPicker>` tag lets the
  toggle break onto a second row at this width (`divided`'s inner borders look odd across a wrap —
  drop `divided` via the picker if it becomes a prop, or accept it). Alternatively `density="compact"`
  / `size="x-small"` if the picker grows those props — but that is a `vue_framework` change for a
  400 px panel this app chose, and `F6`'s reasoning applies: the smaller, app-side edit first. If the
  owner would rather widen the panel, `F51` is the batch that touches the shell's width and this
  should ride with it.
- **Do not change:** `DayOfWeekPicker.vue` (framework) in this batch; the dialog branch.
- **Verification:** `P1`'s `Verify:` block on `/day-planner/templates/20001` — all seven day buttons
  visible and togglable; then *Edit Details* from the list to confirm the dialog's row is unchanged.
- **Risk:** None.

---

<!-- F59 (a skipped task rendered as done and its checkbox completed it — `home/B4`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. The skip-reason backend gap it surfaced is recorded in the log entry. -->

## F64. The picker treats an empty weather match set as "nothing fits" — the server's contract says it means "no opinion"

- **Scope:** app-side `src/core/leisure/composable/useLeisurePicker.ts:250`,
  `src/core/leisure/api/leisureWeatherApi.ts:3-9` (comment)
- **Closes:** `leisure-backlog-picker/X2`, `P2`
- **Root cause:** `GET /leisure-weather-fit` answers `200 { matchingWeatherDependencyIds: [] }` for an
  account with no weather location — and its endpoint's own doc comment (`GetLeisureWeatherFitEndpoint.cs`)
  spells out the client's obligation: *"The client reads an empty set and a failed call identically
  ('no weather opinion'): nothing ranks up, no badge renders, nothing is excluded."* `useWeatherFit.ts`
  says the same in its header. `useLeisurePicker.ts:250` then does
  `weatherMatchIds: weatherFit.value?.matchingWeatherDependencyIds ?? null` — `[]` is not nullish, so
  `isEligible`'s backlog branch (`leisureScoring.ts:246-253`) sees a non-null list that contains no id and
  excludes **every** backlog entry with any `weatherDependencyId`, including the seed's one row whose
  dependency is the *"None"* lookup. `/leisure/pick`'s default landing state shows no backlog card at
  any time budget. `leisureWeatherApi.ts:3-9` meanwhile still says the endpoint is *"Not implemented
  server-side yet… Every call fails today"* — `P2`.
- **What to change:** Collapse the empty set to `null` **once**, at the boundary — in `fetchTodayFit`
  (return `null` when the array is empty) or in `WeatherFit.fromJson` — so every consumer, not just the
  picker, gets the contract (`fitsToday` already returns `false` for `null`, so the badge is unchanged).
  Rewrite the `leisureWeatherApi.ts` comment to describe the live endpoint and the empty-means-no-opinion
  rule.
- **Do not change:** `isEligible` — with a non-empty list it is correct, and a real mismatch must still
  exclude (`X2`'s *Verify* step 4).
- **Verification:** `X2`'s `Verify:` block — the seeded *Read a Novel* (45 min, 1 person) appears at
  ≥ 60 min / *Just me*; then `playwright-cli route "**/api/leisure-weather-fit"` fulfilled with an id
  that is *not* the row's dependency, and confirm it is excluded.
- **Risk:** None beyond deciding where the collapse lives; put it at the boundary so `O1`'s later
  `maxParticipants` work does not have to remember it.

## F66. `boolChip` reuses the true icon for the false state on four of five chips

- **Scope:** app-side `src/core/leisure/composable/useLeisureFilterChips.ts:19`;
  `BacklogView.vue:192`, `BucketListView.vue:218-219`, `ProjectsView.vue:163`
- **Closes:** `leisure-bucket-anchors/P1`
- **Root cause:** `boolChip(labelKey, trueIcon, falseIcon = trueIcon)` — the default was presumably a
  convenience, and every call site but `isRepeatable` (`rotate`/`star`) took it. The label already
  flips `✓`/`✗`; the icon does not.
- **What to change:** Either pass a false icon at the four sites (`circle-xmark` for *experienced*,
  a slashed variant for *travel*/*messy*), or drop the default and make the parameter required so the
  next chip cannot forget. The second is the fix; the first is the patch.
- **Verification:** `P1`'s `Verify:` block on `/leisure/bucket-list`, then the same chip on
  `/leisure/backlog` and `/leisure/projects`.
- **Risk:** None.

## F68. The manual-entry form fires one `POST` per click and never resets — the second click, and every re-submit after a success, is a `409`

- **Scope:** app-side `src/core/activityHistory/view/AddActivityManuallyView.vue:17-23,36-38`,
  `src/core/activityHistory/component/AddActivityManuallyForm.vue:53-82`
- **Closes:** `history-capture/B6` (round 1's `U1`, now observed — and the queue's §53 split of it, both
  halves, is settled below)
- **Root cause — confirmed, and the reset half is no longer taste.** `handleSave()` is
  `await formRef.value?.saveActivity()` with no re-entry flag; `saveActivity()` sets nothing while
  `await saveActivityToHistory(…)` is pending; the button has no `:loading`/`:disabled`. Two clicks inside
  the round trip are two `create` calls with the **same** `activityId` and `startTimestamp`, and the
  server's unique index `(UserId, ActivityId, StartTimestamp)` (`ActivityHistoryConfiguration.cs`) turns
  the second into a **409** — the mechanism the unit guessed and could not verify; confirmed at the
  source. What the finding did not draw out: `dateTime` is set once at mount (`Form.vue:53`, `new Date()`)
  and nothing resets it after a success, so a user who records a span and clicks *Record* again —
  the same activity, the same "when" — gets the same 409, surfaced as `history.errorSavingToHistory`
  (*"error saving"*) for a save that is not an error but a duplicate. That is why the reset half moves
  from "unsourced" (§53) to required: without it the form's second use is always a failure. Which fields
  reset is still the judgement §53 named — a user logging several spans of one activity plausibly wants
  the activity kept — but *"when"* must advance (to now, or to the end of the span just saved), or the
  index refuses.
- **Files:** `AddActivityManuallyView.vue` (a `saving` ref, `:loading="saving"` on the button, `@saved`
  bound); `AddActivityManuallyForm.vue` (a `reset()` in `defineExpose`, or reset inside `saveActivity()`
  after `emit('saved')`)
- **What to change:** Gate `handleSave` on a `saving` ref set around the `await` (the
  `TimerPresetDialog` confirm shape), bind it to the button's `loading`. Then the reset: on `saved`, set
  `dateTime` to `new Date()` (or to `dateTime + timeLength`, which is the more useful default for
  back-to-back logging — pick one and say why in the code) and clear `timeLength`; keep the activity
  selection. The success snackbar (`history.addedToHistory`) already fires; nothing else is needed to
  "make it obvious the save happened".
- **Do not change:** the server's index — a duplicate `(activity, start)` *is* a duplicate; the 409 is
  right. Not `useSaveActivityToHistory` — its snackbar pair is shared with the three timer views.
- **Verification:** `B6`'s `Verify:` block — `dblclick` on *Record activity to history* produces **one**
  `POST /api/activity-history` (`playwright-cli requests`), no 409, no console `AxiosError`; then a
  single save followed by a second *Record* → a second 201 with a different `startTimestamp`, not a 409.
  Reseed after.
- **Risk:** None.

## F69. Deleting a to-do item never confirms, whatever `askBeforeDelete` says — the item delete was never one of P3's five sites

- **Scope:** app-side `src/core/todoList/composable/useUndoableListCrud.ts:110-125`, its two consumers
  (`TodoListView.vue`, `RoutineToDoListView.vue`), and one row in CLAUDE.md's *sanctioned cross-module
  imports* table
- **Closes:** `todo-lists/B7` (+ the **unfiled routine twin** — `RoutineToDoListView` drives the same
  composable, so its item delete has the same gap; unit 10 ran seven rounds and never filed it because
  its deletes were of periods, not items)
- **Root cause:** Confirmed. `deleteItem()` is `await api.deleteEntity(id)` then `pushDeleteUndo(…)`,
  with no `shouldConfirm` anywhere in the file (grep: `useDeleteConfirmation` has six importers in
  `src/core`, none in `todoList/composable/useUndoableListCrud.ts`). `prompts/_done/user/P3-delete-confirmation-granularity.md`
  listed **five** delete sites, and the item delete was not among them — it was already an undo-only path
  through `useTodoListUndo` before P3 ran, so P3 never touched it. But P3's own rule covers it exactly:
  *"a delete that is a LEAF and is UNDOABLE honors the preference, and when the preference says 'don't
  ask', shows an undo affordance instead of a dialog"* — and `useDeleteConfirmation.resolveDelete()`
  encodes that (`askBeforeDelete` → `'confirm'` before it ever looks at `undoable`). With the preference
  **on** (the seed's default, the unit's screenshot), the item delete is the one site in the app that
  ignores it; with it off, the undo it already shows is the correct answer. So this is not "add a dialog"
  — it is "route the sixth site through the composable that already decides".
- **Files:** `useUndoableListCrud.ts:110` (or the two call sites, if the composable is to stay
  preference-free — it is `todoList`'s own, so importing `core/user`'s composable there is the sanctioned
  exception, same as `TodoListsView.vue:186`); `CLAUDE.md` — the `useDeleteConfirmation` row says "the
  five delete sites in `todoList`, `dayPlanner`, `historyDashboard`"; `F19` adds `activity`, this adds a
  sixth `todoList` site; rewrite the count once, not twice.
- **What to change:** Before `api.deleteEntity(id)`: `if (shouldConfirm({ cascades: false, undoable:
  true })) { const ok = await confirm({ title: …, text: t('toDoList.deleteItemConfirm', { name }) }); if
  (!ok) return }` — `useDialog().confirm()`, the shape `TodoListsView.vue:186-190` already uses for the
  list delete. `cascades: false` is right (items have no children; steps are a JSON column, not rows —
  confirm against `TodoListItemConfiguration.cs` before asserting it in a comment). Keep the undo entry
  either way — P3's *undoable* branch is what makes the "don't ask" case safe.
- **Do not change:** `useDeleteConfirmation` itself; the list and category sites (correct); the undo stack.
  Do not read `askBeforeDelete` directly — CLAUDE.md names that as the bug.
- **Verification:** `B7`'s `Verify:` block with the preference **on**: ⋮ → *Delete* → a dialog; Cancel →
  no `DELETE`, item still there; Confirm → `DELETE …/todo-list-item/{id}` 204 and the undo button. Then
  the preference **off**: no dialog, immediate delete, undo button — unchanged from today. Then
  `/routine-todo-list`, same two checks (create a throwaway routine item through the API first). Both
  locales for the new key.
- **Risk:** Low. One branch in a composable two views share — that is the point, and the risk: test both.

<!-- F70 (*Move to list* called `PATCH /move/{id}/{dest}` against a server route that is `PATCH /{id}/move` + body — `todo-lists/B8`) fixed 2026-09-22 in `1bb9ae06` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F72 (`useMappingSettings.saved()` dropped mode and `isActive`, validated nothing, and overwrote the interceptor's snackbar — `tracking-settings/X2`, `X3`, `B6`) fixed 2026-09-22 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## FW1. `MyDialog` is `persistent` by default, so Escape closes nothing

- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue` — submodule commit in `vue_framework`,
  then a pointer bump in this repo, in that order
- **Closes:** `_shell/A1`
- **Re-verified unchanged this pass:** `MyDialog.vue:86` still defaults `persistent = true`; `onEscKey()`
  (`:136`) is still the only Escape handler.
- **Its own batch, and it needs a decision before a patch** (rule 4): flipping the default changes dismissal
  semantics for every dialog in every app on the framework, including destructive confirms. The two options —
  flip the default and have guarding dialogs opt **in**, versus keep the default and have harmless call sites
  opt **out** — are not equivalent in risk.
- **Files:** `src/_common/component/dialog/MyDialog.vue:86,136`; `src/_common/docs/components.md` in the same
  commit
- **What to change:** Whichever the decision is, plus the framework docs, plus a default that keeps existing
  apps working if it goes the opt-in way.
- **Verification:** `_shell/A1`'s `Verify:` block, **both halves** — a fix that makes every dialog escapable is
  a regression, not a fix. A destructive confirm must still resist Escape.
- **Risk:** Highest in this queue. Ships to every app on `vue_framework`, and the failure mode of getting it
  wrong (a half-filled form dismissed by a stray Escape) is data loss.

<!-- FW2 (six framework icon-only controls with no accessible name — AppTopBar, FilterPanel, MonthYearPicker, MyDateInput) fixed 2026-09-23 in vue_framework `5397675` with FW5/FW6/FW7/FW15 (bump `a7dbfda0`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW3 (Time.fromJson could not parse the backend's string shape) closed 2026-09-13 — body in _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## FW4. `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so

- **Scope:** **[framework]**, **docs only** — `src/_common/docs/components.md`, the *Data tables* section;
  optionally a one-line comment above `DataTable.vue:7`. Submodule commit, then pointer bump.
- **Closes:** nothing filed. It exists so the *next* `F12` does not happen: `tracking-settings/X1` cost a
  blocker grade, three screenshots, an `elementFromPoint` investigation and a wrong framework hypothesis,
  all for a missing `flex-fill`.
- **Root cause:** `DataTable.vue:7` renders `VDataTableServer` with `height="0"` — the fill-parent trick
  described under `F12` — and `BasicTable.vue:2` wraps it in `h-100`. That is a **contract on the
  consumer**: the table must sit in a flex column whose height is definite all the way up, or its body is
  0 px tall and its rows are laid out but invisible and un-clickable. `components.md:204-258` documents
  props, slots, emits and formatters and says nothing about layout. Seventeen consumers got it right by
  copying a sibling; the two that did not are the only ones that broke.
- **What to change:** One paragraph in `components.md` under *Data tables*: the table fills its parent and
  scrolls internally (that is why headers are sticky), the parent chain must therefore be definite-height
  flex columns, `flex-fill` on the wrapper plus `class="flex-1-1" style="min-height: 0"` on the table is
  the shape to copy (`ActivityTable.vue:42-43`), and the symptom of getting it wrong is "the row is in the
  a11y tree but not on screen". **Do not change the default** — a self-sizing body would drop sticky
  headers app-wide, and per batching rule 4 that is a decision, not a docs fix. If the maintainer wants a
  guard, a dev-mode `console.warn` when the wrapper measures 0 px after mount is the shape; file it as a
  separate ask.
- **Verification:** Read-through; the sentence names the symptom a future unit agent will see.
- **Risk:** None — docs only. Two repos, two commits, in order.

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

## FW17. `ActionBar` is centred on the viewport, not the content box — *Delete* is un-clickable under the nav drawer

- **Scope:** **[framework]** `src/_common/component/ActionBar.vue:35-41,52-59` — submodule commit, then
  pointer bump; CSS only
- **Closes:** nothing filed — and that is the point. The defect was **known before the sweep**
  (`e2e/tests/dayPlanner.spec.ts:203-224`, a 22-line comment on two `test.fixme`d specs that click
  *Delete*), was handed to unit 7 as brief item 2 (*"OPEN, NOT FIXED … needs the owner's call"*), was
  **re-confirmed live** by the unit (`planner-day/inventory.md:144`, *"re-confirmed visually at this
  viewport width — not re-filed as a new finding"*), and appears in no queue. A finding that three
  documents agree on and none owns is the thing a triage exists to catch. Evidence is observed, twice;
  it is batched.
- **Root cause:** Confirmed by direct read. `.action-bar` is `position: fixed; bottom: 20px; left: 50%;
  transform: translateX(-50%); z-index: 50` (`ActionBar.vue:36-41`). `left: 50%` on a fixed element is
  50 % of the **viewport**; Vuetify insets `.v-main` by the drawer's width through
  `padding-left: var(--v-layout-left)` (`VMain.css:5`), so the bar sits ~144 px left of the content's
  centre with the drawer expanded, and its leftmost action — the planner's *Delete* — ends under the
  drawer, whose inline `z-index` is `1000 + …` from the layout composable (`composables/layout.js:7,200-209`)
  and outranks `50`. Pointer events go to the drawer.
  Five consumers, all in `dayPlanner` (`SelectionActionBar`, `BulkSelectActionBar`,
  `ApplyTemplateActionBar`, `UseTemplateActionBar`, `DayPlanner.vue`); any other app on the framework
  with a permanent drawer has the same offset. Playwright's `toBeVisible()` passes on the occluded button
  (layout, not occlusion), which is why the presence specs pass and only the two click specs fail — the
  spec comment says so, and it is worth keeping.
- **What to change:** Centre on the content box without JavaScript: Vuetify writes
  `--v-layout-left` / `--v-layout-right` onto `.v-layout` (`composables/layout.js:144-145`), and the bar
  is a descendant, so `left: calc(50% + (var(--v-layout-left, 0px) - var(--v-layout-right, 0px)) / 2)`
  keeps `translateX(-50%)` and the two transition rules (`:52-59`) untouched and follows the rail
  toggle for free. The fallbacks keep the current behaviour in an app with no `.v-layout` ancestor
  (rule: default to today when nothing is registered). Alternatively raise `z-index` above the drawer
  — **rejected**: it would draw the bar over the drawer instead of beside the content, and the drawer's
  own overlay is deliberately higher than page chrome.
- **Do not change:** the mobile `@media (max-width: 600px)` block (the drawer is temporary there and
  `--v-layout-left` is `0px`); not `useActionBarFocusReturn` / `migration-revision.md` §11 — that is
  the bar's *focus* ask, a separate framework item.
- **Verification:** Un-`fixme` the two click specs in `e2e/tests/dayPlanner.spec.ts` and run them at
  the suite's 1280×720; then by eye on `/day-planner/<today>` with the sidebar expanded **and** rail:
  the bar is centred in the white area both times and every action is clickable. `_shell`'s rail
  toggle is the control to flip. `playwright-cli` can prove occlusion the way the spec cannot:
  `document.elementFromPoint(x, y)` at the *Delete* button's centre must be the button, not
  `.v-navigation-drawer`.
- **Risk:** Low — one `left` declaration — but it ships to every app on the framework that mounts an
  `ActionBar`, and an app whose `.v-layout` has a *right* drawer moves the bar the other way, which is
  correct and worth saying in the commit message.

## FW18. `useEntityQuery.fetchById` cancels a sibling id — the 2026-09-11 `useFetchFiltered` bug, one helper over

- **Scope:** **[framework]** `src/_common/api/useEntityQuery.ts`, `src/_common/docs/api.md`
  (submodule commit + pointer bump); app-side in the pointer-bump commit: `prompts/_common/api/A1-request-key-for-sibling-fetch-helpers.md:129-131`
  and CLAUDE.md's `_common/api/` bullet
- **Closes:** the framework half of `planner-templates/X1` (`F50` is the app half; `X1` itself closes
  when the dialog renders, which `F50` achieves without this)
- **Root cause:** `useEntityQuery.ts:29-42` — one `AbortController` per **method**, `fetchById` calls
  `fetchByIdController?.abort()` before every request regardless of the id. That is right for a detail
  view switching ids (latest wins) and wrong for two ids fetched concurrently from one instance: the
  first rejects with `CanceledError`, and `Promise.all` over the pair rejects — exactly the shape
  `useFetchFiltered` had until 2026-09-11 and now documents in its own `requestKey` doc-comment
  (`useFetchFiltered.ts:15-40`, which even uses "a fan-out over ids" as its example). **Two documents
  say this helper does not have the problem, and both are wrong** (*Contradictions* §85):
  `prompts/_common/api/A1:129-131` — *"Do not add `requestKey` to `useEntityQuery`. It already holds
  a separate controller per method … which is the same idea expressed differently"* — conflates
  per-method with per-call, and CLAUDE.md's `_common/api/` bullet lists the three filtered helpers as
  the ones that "still hold a single controller per instance" and omits this one. The unit's finding
  cites *"CLAUDE.md's own documented gotcha"* for `useEntityQuery`; CLAUDE.md documents no such thing,
  which is how a component written after the `useFetchFiltered` fix reintroduced the bug — the author
  was told this helper was safe.
- **Files:** `useEntityQuery.ts:29-42` (`fetchById`; `fetchByField` `:44-59` is the same shape and
  should take the same option — `fetchAll`/`fetchSelectOptions` take no id and are genuinely
  latest-wins), `src/_common/docs/api.md`; `A1:129-131`; CLAUDE.md `_common/api/` bullet
- **What to change:** **Additive, default-preserving — not a semantics change (rule 4 does not bite).**
  Copy `useFetchFiltered.ts:13,47,54-58,71-76` — a module-level `Symbol` default key, a `Map<key,
  AbortController>`, an optional third argument `{ requestKey }` on `fetchById` (and `fetchByField`),
  identity-guarded cleanup in `finally`. Omitting the key must reproduce today's abort-previous
  behaviour exactly, so every existing caller is untouched. **Do not key by `id` by default** — it
  looks like the obvious fix, but a detail view that switches ids fast today gets the stale response
  cancelled for free, and keyed-by-id it would get both responses in arrival order; that is a
  behaviour change every app would inherit, and it is what rule 4 exists for. Then: update
  `src/_common/docs/api.md` in the same submodule commit; in the pointer-bump commit, rewrite
  `A1:129-131` to say `useEntityQuery`'s per-method controllers are *latest-wins per method* and
  `fetchById`/`fetchByField` now take `requestKey` like the others, and add `useEntityQuery` to the
  CLAUDE.md bullet's list of helpers that abort their previous call. `F50`'s workaround comes out in
  the same pointer-bump commit.
- **Do not change:** the abort itself (`A1` constraint 3 — scope it, do not remove it);
  `useRequestState.run`'s cancellation re-throw (`:45`) — it is what lets a keyed caller tell a
  cancel from a failure, and `isRequestCanceled()` depends on it.
- **Verification:** unit-level in the framework: two `fetchById`s with distinct keys from one instance
  both resolve; two with the same key (or no key) — the first rejects with a cancel; the map is empty
  after both settle. App-level: `F50`'s `requests` check after the pointer bump, with the workaround
  removed. Grep `src/` for other `Promise.all([…fetchById` / `fetchByField` — this pass found only the
  dialog, but the check is cheap and it is the class, not the instance, that ships.
- **Risk:** Low — opt-in, and `useFetchFiltered` has carried the identical shape since 2026-09-11 with
  no regression. It does ship to every app on the framework; the `Symbol` default is what makes that
  safe.

---

## FW19. `extractServerMessage` prefers the generic `message` over the specific `errors` — every validation snackbar in the app reads "One or more errors occurred!"

- **Scope:** **[framework]** `src/_common/axiosConfig.ts:86-101` — submodule commit, then pointer bump
- **Closes:** `activity-settings/B9`
- **Root cause (source-verified):** `extractServerMessage` returns on the first non-empty of `data`
  (string) → `detail` → **`message`** → `errors[first list][0]`. FastEndpoints' validation shape is
  `{ statusCode, message: "One or more errors occurred!", errors: { field: ["…"] } }` — `message` is
  always present and always generic, so the `errors` branch is unreachable against this API. The
  mutation pass read two real messages the user never saw: `errors.color` → *"Color must be a valid hex
  color code…"* (§11) and, on the system-role delete, `errors.generalErrors` → *"This is a system role
  the app files quick-created activities under, so it cannot be deleted. You can rename it instead."*
  The same function feeds `useRequestState.run`'s `error.value` (`useRequestState.ts:47-48`), so every
  composable's error string is generic too. `todo-routine/B9`'s per-call-site `_silent` workaround exists
  partly because of this.
- **Files:** `src/_common/axiosConfig.ts:86-101`; `src/_common/docs/api.md` if it documents the
  extraction order
- **What to change:** Try `errors` **before** `message`: if `errors` yields a string, return it;
  otherwise `detail`, then `message`. Keep the 500 branch's `errorId` handling as is — it reads
  `message` deliberately (`:239-249`) and a 500 body has no `errors`. Consider a field-aware variant
  (`"<field>: <text>"`) only if another app wants it; this batch is the order swap.
- **Do not change:** `handleHttpCodes` (`ErrorHandlingFunctions.ts`) — it never reads the body and
  is not this bug; escalation §7's "carry the error *type*" ask is the separate improvement.
- **Verification:** `B9`'s `Verify:` block — trigger the role-colour 400 (until §11 lands it is one
  click away) and the system-role 409; both snackbars show the specific text. Then a 500 with an
  `errorId` still shows the id.
- **Risk:** Low, but framework-wide: every app on a backend whose `errors` map holds technical strings
  will now surface them. On this backend they are authored prose; say so in the commit.

## FW20. `useTableFormatters`' substring heuristics misclassify columns — `durationMinutes` is a percentage, `inspirationSource` is a dash

- **Scope:** **[framework]** `src/_common/composable/table/useTableFormatters.ts:4-33` — submodule
  commit, then pointer bump. **Decision first** (word-boundary/segment matching vs. opt-in auto-format).
- **Closes:** `leisure-backlog-picker/B1` (+ one unfiled: the *Inspiration source* column on
  `/leisure/bucket-list` renders **"—"** for the seeded row whose value is *"A friend's climbing
  photos"* — §96)
- **Root cause (source-verified):** `isPercentKey` is `['percent','rate','vat','ratio','discount'].some(kw => lower.includes(kw))`
  (`:6,30-33`); `isCurrencyKey`, `isDateKey`, `isBooleanKey` are the same shape. `DataTable.vue:33-61`
  applies them to every column without a consumer slot. Tested against all **105** `TableColumn` keys in
  this app this pass: `durationMinutes` → `ratio` → `formatPercent(45)` = *"45.00 %"* (the finding);
  `inspirationSource` → `ratio` → `formatPercent("A friend's…")` = *"—"* (`:41`, non-number → dash), no
  slot in `BucketListTable.vue` (`:19-43` slot five other columns); `expectedCostTier` → `cost`, shielded
  by a slot. The framework's **own** `JobRunHistory.vue:90,99` slots exactly `durationSeconds` (`ratio`)
  and `errorSummary` (`sum`) — the trap was hit inside the framework and worked around rather than
  fixed. Unit 12 listed *Inspiration source* as a rendered column and did not notice its content was a
  dash; the seed says the row has text.
- **What to change:** Match on camelCase segments / word boundaries (`durationMinutes` → `duration`,
  `minutes`; `inspirationSource` → `inspiration`, `source`), or make auto-format opt-in per column
  (`TableColumn` gains a `format` hint, default `raw`). The first keeps zero-config and is a smaller
  diff; the second is honest. Either way, add a unit test that feeds every keyword-containing
  non-match (`duration`, `elevated`, `candidate`, `update`, `assumption`) and asserts `raw`.
- **Do not change:** the app's tables — no per-table slots as a workaround (see the ordering note
  above), and no rename of `durationMinutes` (it is the wire field).
- **Verification:** `B1`'s `Verify:` block (*"45"*, no percent) **and** `/leisure/bucket-list`'s
  *Inspiration source* showing the seeded text; then every `DataTable` consumer in this app that relies
  on auto-format — the tracker mapping tables (`isActive`/`isIgnored` booleans), `RoutineSettingsView`
  (`isHidden`), `ActivityTable` (`isUnavoidable`) — still renders its icons; and the framework's
  `JobRunHistory` unchanged. Both locales.
- **Risk:** Medium, framework-wide: loosening the match can un-format a column that another app named
  `vatRate`; tightening it to segments keeps those. Prefer segments.

<!-- FW21 (the interceptor's `AUTH_ENDPOINTS` list names none of the signed-out routes — `auth/B7`) fixed 2026-09-23 in `vue_framework` `2351ce7` (bump `a0f116a9`) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->


<!-- F74 (`quickEdit` called `PATCH /activity/{id}/{mode}`; the server has `PUT …/quick-edit` and `POST …/clone` — `planner-day/X1`) fixed 2026-09-22 in `eb13eb1a` — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## F75. `viewEndDate` never rolls an overnight view onto the next day, so plan-vs-actual reports a verdict all day

- **Scope:** app-side `src/core/dayPlanner/store/dayPlannerStore.ts:157-170` (`viewEndDate`)
- **Closes:** `planner-day/B7`
- **Root cause:** `viewEndDate`'s only next-day branch is `endHour >= 24`; the `else` sets
  `date.setHours(endHour, …)` on **today**. The seed's `bedTime` is `{hours: 0, minutes: 0}` — an 08:00
  → 00:00 day, i.e. midnight *at the end* — so `viewEndDate` resolves to today at 00:00:00, an instant
  that is in the past from 00:00:01 onward. `usePlanVsActual.ts:36`'s
  `isDayMateriallyDone = currentTime >= store.viewEndDate` is therefore true all day, and
  `prompts/_done/day-planner/F2-plan-vs-actual.md`'s own rule — *"Do not compute a drift verdict at
  10:00 for a day that ends at 23:00"* — never holds. Observed at 19:54 on a day with a task two minutes
  from starting: *"Planned 3h · logged 0m · 3 tasks never happened"*.
- **The module already knows the answer, one file over.** `usePlannerStoreCore.ts:99` is
  `isOverMidnight = viewStartTime.hours > viewEndTime.hours` — which is exactly true for 08:00/00:00.
  `viewEndDate` is the one place that asks a different question.
- **What to change:** in `viewEndDate`, treat `endHour < viewStartTime.hours` the same as `endHour >= 24`
  — roll the date forward one day, then set the hours. Reuse `core.isOverMidnight` rather than
  re-deriving the comparison.
- **Check the sibling while there:** `dateTimeFromSlotIndex` (same file, immediately below) uses the same
  `hours >= 24` convention, and it is *correct* there — `slotIndexToTime` emits hours past 24 for an
  overnight grid. The asymmetry is the trap: the grid's own math speaks the ≥24 dialect while
  `viewEndTime.hours` comes from `bedTime` raw. Do not "fix" the slot version to match.
- **Do not change:** `neverHappenedCount`'s `status !== Completed` test. It is a safe simplification
  *once* the gate is honest, which is the finding's own reading.
- **Verification:** `B7`'s `Verify:` block — load today's plan mid-afternoon on an 08:00–00:00 day and
  confirm the plan-vs-actual line is **absent**; then confirm it appears with correct counts once past
  the end time. A day configured with an end hour later than its start (e.g. 08:00–23:00) must be
  unaffected — that is the regression to watch, since it is the branch that works today.
- **Risk:** Low, but it changes what a *correct* day does too: anything else reading `viewEndDate` (the
  grid's own extent, `slotIndexToTime` consumers) now gets tomorrow's midnight for an overnight view.
  That is the intended meaning; grep the store's consumers before assuming nothing else depended on the
  bug.


<!-- F80 (board card metadata runs two fields together — leisure-projects/P2), F81 (`calendar-range` is a Pro-only icon — planner-day/P1), F82 (Importance required but unmarked — planner-day/P2) and F83 (template header count omits background tasks — planner-templates/P3) fixed 2026-09-23 — bodies moved to _fix-queue-log.md → Closed batches. Numbers retired, not reused; the summary table keeps their ✅ rows. -->

## FW22. `TableCellEditor`'s `DECIMAL` cell rounds to whole numbers

- **Scope:** **framework** `src/_common/component/dataTable/inlineEditTable/TableCellEditor.vue:19`
  (submodule commit + pointer bump)
- **Closes:** *(unfiled)* — found this pass while sizing `F76`. The framework twin of
  `leisure-projects/B4`, split by rule 1.
- **Root cause:** the numeric branch is `:step="cellType === TableCellType.DECIMAL ? 0.1 : 1"` with no
  `:precision`, so Vuetify's default `precision: 0` coerces every value to an integer. A cell declared
  `TableCellType.DECIMAL` therefore cannot hold a decimal — the type is decorative.
- **What to change:** `:precision="cellType === TableCellType.DECIMAL ? null : 0"`, matching the shape
  of the `step` expression beside it. Update `src/_common/docs/components.md` in the same commit (rule 3
  of the submodule contract).
- **Honest scope:** `TableCellType.DECIMAL` has **no consumer in this app** — the only two matches for it
  in `src/` are the enum declaration and this line. So this is source-certain and unobserved, it fixes
  nothing visible here, and its verification has to be a throwaway decimal column in the framework's own
  fixtures rather than a screen in this app. It ships because another app on the framework may already
  be using it, and because the `F76` fix would otherwise be app-side folklore.
- **Risk:** Low, and it is the reason to ship it deliberately rather than folding it into `F76`: any app
  currently using `DECIMAL` is getting integers today and may be relying on that rounding.

## FW23. A second column-header click adds a sort key instead of replacing it

- **Scope:** **framework** — `BasicTable`/`DataTable`'s `VDataTable` configuration
  (`src/_common/component/dataTable/`). Submodule commit + pointer bump.
- **Closes:** `leisure-backlog-picker/P1 (round 2)`
- **Root cause:** one unmodified click on a second header turned `sortBy=activity.name:asc` into
  `sortBy=activity.name:asc,durationMinutes:asc` — Vuetify's multi-sort behaviour, inherited by every
  table in the app. The server accepts it; it is simply not what the click looked like it was asking
  for, and there is no affordance anywhere (no shift-click hint, no numbered sort badges beyond the
  primary key's own "Activity 1" chip) telling the user a second sort is being layered.
- **Its own batch by rule 4.** Whatever is decided here applies to every table in every app on the
  framework, not just the four leisure ones — that needs a decision, not a patch.
- **The decision, stated plainly:** either (a) make single-sort the default and let a table opt into
  multi-sort, which matches what every table in this app looks like it does and is the finding's first
  pass condition; or (b) keep multi-sort and render the affordance — numbered badges on every active key,
  extending the chip the primary key already has. (a) is a behaviour change for other apps; (b) is more
  work and leaves a URL that grows on every click. Neither is obviously right, which is why this is
  filed as a decision.
- **What to check before deciding:** `useTableUrlState`'s `sortBy` codec already round-trips a
  comma-joined list, so (a) does not simplify the URL format — and some consumer may be reading a
  multi-key sort deliberately. Grep the framework and this app for a table passing more than one
  default sort item.
- **Verification:** `P1`'s `Verify:` block on `/leisure/backlog`, then the same two clicks on a
  `DataTable` and a `BasicTable` elsewhere in the app, and on the framework's own `JobRunHistory`.
- **Risk:** Medium for a trivial-looking change — it ships to every app on the framework and changes a
  gesture users have already learned, in whichever direction it goes.

## F84. The history dashboard's pie renders the folded-tail sentinel raw — `_other` in the legend, and the slice selects

- **Scope:** app-side `src/core/historyDashboard/component/pieChart/HistoryPieChart.vue` (+ one locale key
  if `activityTracking.common.other` is not reused — decide which, see below)
- **Closes:** *(unfiled)*. Fell out of §10's closure, from the opposite side: the backend's `B16` answer
  flagged `AdhdTimeOrganizer.History/application/dashboard/HistoryPieChartBuilder.cs` as out of scope and
  "probably the identical bug". **It is not — that flag is stale.** `HistoryPieChartBuilder.cs:20` is
  already `public const string OtherName = "_other"`, and has been; the History slice never had the
  literal `"Other"` the Tracking pies did. The server side needs nothing. **Re-read in the API repo on
  2026-09-21 and unchanged**, so the backend's *"say so and I'll do the History side as a follow-up"*
  can be answered with "nothing to do" — this batch is the whole fix. What is wrong is the *client*:
  the two modules' pies were written independently and only `activityTracking`'s learned the sentinel.
- **Root cause — a branch that exists in one pie and not the other.** `ActivityPieChart.vue` translates
  `OTHER_DOMAIN` on the way into the chart (`:62`), maps it back for the tooltip and the legend formatter
  (`:96`, `:144`) and returns early rather than emitting a selection (`:150`). `HistoryPieChart.vue` has
  none of the four: `:41` sets `name: item.name` verbatim, the legend `formatter` (`:75-81`) truncates and
  percent-suffixes that same raw string, and `handleChartClick` (`:113-121`) resolves the datum by index
  and emits `historyGroupKey(item)` for *any* slice. So the folded row shows as a literal `_other` in
  **both** locales and is a selectable group — it cross-highlights the summary cards and the stacked bars
  through `isSameHistoryGroup`, which matches it by name because its `groupId` is null.
  `HistoryGroupKey.ts:7-8` already names this row ("the pie chart's `_other` roll-up") as one of the two
  synthetic, id-less rows, so the DTO layer knew about it and the render layer did not.
- **Adjacent, already handled — do not "fix" it twice.** The **colour** is fine:
  `historyGroupColor.ts:47` routes a `groupId === null` row through `getDomainColor(name)`, which
  special-cases `_other` to grey, so the slice already paints neutrally (this is the same conclusion §11's
  body reached from the colour side). And `useHistoryInsights.ts:80` already has its own `OTHER_GROUP_NAME
  = '_other'` constant and suppresses insights derived from the roll-up — a third copy of the literal,
  which is the argument for a shared constant rather than a fourth.
- **What to change:** give `HistoryPieChart` the same three touch points `ActivityPieChart` has — a
  display-name helper used at `:41` and inside the legend `formatter`, and an early return in
  `handleChartClick` when the resolved item is the roll-up. Branch on `item.groupId === null &&
  item.name === <sentinel>`, **not on the name alone** — `HistoryGroupKey.ts:10-11` is explicit that a
  user may name a real activity `_other` and that row carries an id. Two things to decide, both small:
  (1) **which constant** — `historyDashboard` should not import `activityTracking`'s `OTHER_DOMAIN`
  (cross-module, and neither is an `api/`/`dto/` export), so either lift one shared constant somewhere
  both may import or reuse `useHistoryInsights.ts`'s `OTHER_GROUP_NAME` by exporting it; the latter is one
  line and keeps the module self-contained. (2) **which locale key** — `activityTracking.common.other` is
  the existing wording (*Ostatné*) but lives in another module's namespace; a `history.*` key with the
  same two words is the boundary-respecting answer and costs two lines in `sk`/`en`.
- **Do not change:** `HistoryPieChartBuilder.cs` or anything else server-side — the wire value is already
  correct. Not `historyGroupColor.ts` (the grey works). Not `useHistoryInsights.ts`'s suppression logic.
  Not `HistorySummaryCard.vue:21` unless the roll-up actually appears there — the summary-card endpoint is
  a different builder and this pass did not check whether it folds at all; look before adding a branch.
- **Verification:** `/activity-history/dashboard` on a `groupBy` and range where the seed has a group
  under the builder's 1 % threshold (`HistoryPieChartBuilder`'s constant), or one fulfilled `route` body
  carrying a `{"groupId": null, "name": "_other"}` row. Pass: the legend entry reads *Ostatné* (and its
  English wording in EN), the slice is grey, and clicking it changes neither the selection nor the
  summary-card highlight. Re-check that clicking a **real** grey/colourless slice still selects — the
  guard must key on the id-plus-name pair, not on the colour or on `groupId === null` alone, or
  `Uncategorized` stops selecting with it.
- **Risk:** Low, one component. The only trap is the over-broad guard above: `Uncategorized` shares the
  null `groupId` and *is* a real, selectable bucket.

## FW24. `B18` landed and nothing on this side reads it — four different 409s still share one sentence, and today that sentence is the server's English DB prose

- **Scope:** **framework** — `src/_common/composable/general/ErrorHandlingFunctions.ts` (the whole file
  is 45 lines and switches on one `number`), `src/_common/axiosConfig.ts:220-250` (the interceptor's own
  status switch), `src/_common/i18n/` locale keys under `httpErrors.*`, and
  `src/_common/docs/composables.md`. Submodule commit **then** pointer bump — never one commit.
- **Closes:** escalation §7's frontend half. No unit finding is filed against it, because no unit could
  see it: the distinction did not exist on the wire until 2026-09-21.
- **Root cause:** the API now sends `errorType` on every error body it authors — the `ResultErrorType`
  member name as a plain PascalCase string (`DbUniqueViolationError`, `DbForeignKeyError`,
  `DbConcurrencyError`, `Conflict`; on 403 `EmailNotConfirmed`, `UserLockedOut`). Landed as
  `AdhdTimeOrganizer` `cd0a252`, purely additive: the field is **absent**, not null, when the server has
  nothing better than the status. Nothing on this side reads it. `handleHttpCodes(statusCode: number)`
  takes only a number — it cannot read it without a signature change — and the interceptor's `case
  Conflict` is `showErrorSnackbar(serverMessage ?? t('httpErrors.conflict'))`.
- **The user-facing symptom is not the one escalation §7 describes, and this is the more embarrassing
  version.** §7 says a unique-index 409 tells the user *"This record was changed by someone else.
  Refresh the page and try again."* That is true only of the `handleHttpCodes` path (a call site that
  opted out with `_silent` and then routed the status back through it). On the **default** path the
  interceptor prefers `serverMessage`, and for a DB-derived 409 that is the API's internal prose —
  *"Unique constraint violation during Create"* — shown verbatim, in English, in a Slovak UI. Wrong
  sentence either way; unlocalized developer text on the path that fires most often.
- **What to change:**
  1. Give `handleHttpCodes` an optional second parameter (`errorType?: string`) and a per-type branch
     under `409` and `403`. **Optional, with the current sentence as the fallback** — every other app on
     this framework, and every older API, must keep working untouched (CLAUDE.md's rule 2 for framework
     edits). Add an `extractServerErrorType(error)` helper beside `extractServerMessage` in
     `axiosConfig.ts`, in the same shape (typeof-guarded, `undefined` when absent).
  2. Four new `httpErrors.*` keys with the wordings the backend spelled out: unique → *pick another
     value*; FK → *remove or move what still depends on this first*; concurrency → today's refresh
     sentence; business `Conflict` → **show the server's own message**, which is authored for the user.
     SK primary, EN alongside.
  3. In the interceptor's 409 branch, prefer the typed wording over `serverMessage` for the three
     DB-derived types and keep `serverMessage` for `Conflict`. That is the one behaviour change to state
     plainly in the commit message: today's raw *"Unique constraint violation during Create"* stops
     reaching users.
  4. `403`: branch `EmailNotConfirmed` / `UserLockedOut` behind the same fallback. `auth/B6` was solved
     another way and this does not reopen it — it stops the *next* consumer having to.
  5. Update `src/_common/docs/composables.md` in the same commit (rule 3).
- **Do not change:** the status codes anything maps to; `extractServerMessage`'s precedence — that is
  **`FW19`**, a different cause (a 400's `errors` map never being reached) that happens to live in the
  same two files. Keep them as two batches and land them in one framework commit; do not fold `FW19`'s
  reordering into this one and call it done. Do not touch the app-side call sites — that is `F85`, after
  the pointer bump.
- **Verification:** two live 409s, both named by the backend as the clean pair:
  `DELETE /api/activity-role/{id}` on a **system** role → `errorType: "Conflict"`, and on a role that
  still has activities → `errorType: "DbForeignKeyError"`. Same status, same endpoint, two different
  sentences on screen. Then a duplicate routine time period (`DbUniqueViolationError`), a duplicate
  desktop mapping pattern (`POST …/tracker-desktop-mapping-by-pattern` — also `DbUniqueViolationError`,
  but **with** an `errors["Patterns"]` map; the backend's 2026-09-21 follow-up named it as the second
  concrete pair, and it checks that the typed wording does not swallow a per-field map when one is
  present), and one request against an endpoint that sends no `errorType` at all (any `Send.NotFoundAsync` 404) to confirm the
  fallback. `DbConcurrencyError` **cannot be produced today** — no request DTO carries a row version, so
  no endpoint can detect a stale write; wire the branch, do not try to test it.
- **Risk:** Medium, and entirely in the other direction from usual: this ships to every app on
  `vue_framework`, and an app whose API does not send `errorType` must see no change at all. The
  fallback is the whole safety property — write the branch so an absent field is indistinguishable from
  today.

## F85. The two `_silent` 409 workarounds can read the type now — but `B18`'s own note about deleting them is wrong

- **Scope:** app-side `src/core/todoList/component/routine/dialog/TimePeriodForm.vue:160-175`,
  `src/core/todoList/view/RoutineSettingsView.vue:175-191`
- **Closes:** escalation §7's app half. The two findings behind those call sites (`todo-routine/B9`,
  `B11`) are already `fixed`; this is their follow-on, not a reopening.
- **Blocked on `FW24`** and on the pointer bump after it. There is nothing to do here first.
- **Root cause:** both sites opted out of the interceptor (`_silent: true`) and worded the 409
  themselves, because a status code was the only thing either could see. With `errorType` on the wire
  they can tell *which* 409 they got, which is the one thing both comments say they cannot.
- **`B18`'s "what changes on the frontend" list is wrong twice, and a fixing session following it would
  regress two things.** Read against the source this pass:
  - *"Delete the two `_silent` + call-site wordings."* **No.** `TimePeriodForm.onConfirm` sets
    `conflictError` and **returns without closing the dialog**, so the user keeps everything they typed
    and sees the message against the form. An interceptor snackbar cannot do that, and the dialog
    closing before the message arrives is the exact defect `todo-routine/B11` fixed. Keep `_silent`,
    keep the inline error; what changes is only the **condition** — `errorType ===
    'DbUniqueViolationError'` rather than `status === 409`, so a concurrency 409 stops being worded as
    a name collision.
  - *"`useDeleteConfirmation` can stop guessing about FK refusals it cannot see."* **It never guessed.**
    `src/core/user/composable/useDeleteConfirmation.ts` is 45 lines of pre-flight policy
    (`resolveDelete({cascades, undoable})`); it runs *before* the request and never sees a response, so
    there is nothing in it to change. The post-hoc FK handling lives at the call sites —
    `RoutineSettingsView.showDeleteBlocked` is the one that exists.
- **What to change:** in `RoutineSettingsView.onDelete`, branch `showDeleteBlocked` on `errorType ===
  'DbForeignKeyError'` instead of bare `status === 409`, and let anything else fall through to
  `handleHttpCodes` (which by then words the rest correctly). In `TimePeriodForm.onConfirm`, the same
  narrowing for `DbUniqueViolationError`. Both are one condition each.
- **Also worth a line, not a batch:** `F19` gives the roles table a pre-flight `canDelete` gate, so its
  409 becomes a race fallback only — but the pair the backend built this field for is exactly that
  endpoint (system role → `Conflict`, in-use role → `DbForeignKeyError`). If `F19` lands **after**
  `FW24`, its fallback can say which one happened instead of showing the generic sentence; if it lands
  before, nothing is lost. Do not hold either for the other.
- **Verification:** duplicate an existing routine time period's name and its `lengthInDays` in two
  separate attempts — the dialog stays open both times with a message naming the right field. Then
  delete a time period that still has routines: the *"remove these first"* dialog, not a snackbar.
- **Risk:** None beyond the sequencing. If it lands before the pointer bump, `errorType` is `undefined`
  and both conditions are false, so both sites silently stop handling the 409 they handle today — which
  is why this is blocked rather than merely ordered.

<!-- F86 (Back/Forward on /day-planner moved the URL but not the grid — found verifying F44) filed and fixed 2026-09-23 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW25 (three hydrations per settings visit racing a step-up write; grew user-settings/B4, the sign-out on a wrong step-up password) filed and landed 2026-09-21 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused. -->

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
> | ~~§12~~ | `_done/B12-…` — landed, body in the log | §7 | `_done/B18-…` — **ask landed 2026-09-21; frontend half open as `FW24` + `F85`** |
> | ~~§14~~ | `_done/B13-…` — landed, body in the log | ~~§8~~ | `_done/B19-…` — decided and landed 2026-09-21, frontend half the same day, body in the log |
> | ~~§9~~ | `_done/B14-…` — landed 2026-09-21 (API `1e0dc3b`), frontend half the same day, body in the log | ~~§5~~ | `_done/B20-…` — landed, body in the log |
> | ~~§1~~ | `_done/B15-…` — landed 2026-09-21, verified, body in the log | ~~§3~~ | `_done/B9-routine-untick-streak-decision.md` — answered, body in the log |
> | ~~§16~~ | `_done/B21-…` — landed 2026-09-21, frontend half the same day, body in the log | ~~§17~~ | `_done/B22-…` — landed 2026-09-21 as option (b), frontend half and the spec the same day, body in the log |
> | ~~§18~~ | `_done/B23-…` — landed 2026-09-21 (API `c00e64d`), frontend half the same day (`c2075f61`, with `F47`), body in the log | ~~§19~~ | `_done/B24-…` — landed 2026-09-21 (API dev, uncommitted at the time), frontend half the same evening with `F16` folded in, body in the log |
> | ~~§20~~ | `_done/B25-…` — landed 2026-09-21 with the decision taken (the code that trips the lock answers `UserLockedOut`), frontend half the same day, body in the log | ~~§21~~ | `_done/B26-…` — landed 2026-09-22 (API dev), verified end to end 2026-09-23, no frontend half, body in the log |
>
> **Every landed or answered ask lives in `backend/_done/`** (corrected 2026-09-21 — this table said
> `_implemented/` for seven of them, a directory that exists and is empty). A landed ask whose frontend
> half is still open (`B18` today) is also in `_done/`; the open half is tracked by its `FW`/`F` batch, not by
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


7. ✅ **THE ASK LANDED 2026-09-21** (`AdhdTimeOrganizer` `cd0a252`; the prompt file moved to
   `backend/_done/` and carries the full response). **This paragraph stays only because the
   frontend half has not started** — it is `FW24` (framework: read `errorType`, word each 409 and 403)
   and `F85` (app: narrow the two `_silent` call sites), in that order. Delete this entry and move the
   body to the log when both land.

   What shipped, in one line: **every error body the API authors now carries `errorType`**, the
   `ResultErrorType` member name as a plain PascalCase string, **absent** (not null) when the server
   has nothing better than the status; FluentValidation 400s carry none and keep their `errors` map.
   The values to branch on are `DbUniqueViolationError` / `DbForeignKeyError` / `DbConcurrencyError` /
   `Conflict` on 409, and `EmailNotConfirmed` / `UserLockedOut` on 403. `DbConcurrencyError` is
   unreachable today — no request DTO carries a row version — so wire it and do not expect to see it.
   The backend also named the test pair: `DELETE /api/activity-role/{id}` answers `Conflict` for a
   system role and `DbForeignKeyError` for a role that still has activities. **Two of the three
   frontend consequences it lists are wrong** — see `F85`, which corrects them rather than repeating
   them.

   **Follow-up 2026-09-21 (same day, appended to the prompt file):** the "every error body" claim was
   not quite true at landing — eleven hand-written endpoints still picked their 409 with a bare
   `EndpointHelper.ToStatusCode(...)` and dropped the type. Those are converted and a source-scan test
   (`ErrorStatusBypassGuardTests`) fails the API build on any new one. **Nothing in the contract
   changed** and nothing new opens on this side; it only widens the routes `FW24` can rely on: the two
   `…-mapping-by-pattern` creates/updates (duplicate pattern → `DbUniqueViolationError` **with**
   `errors["Patterns"]` naming the clash — relevant to `F72`'s field-by-field branch), the three tracker
   heartbeat/sync posts, `PATCH /activity/{id}/archived`, `POST /activity/merge`, every to-do step and
   toggle-done write, `PATCH /planner-task/{id}/status` and `POST /planner-task/apply-template`. The
   follow-up repeats the two wrong frontend consequences (*delete the `_silent` wordings*,
   *`useDeleteConfirmation` can stop guessing*); `F85` still stands as the correction. `FW24` gains the
   duplicate mapping pattern as a second verification pair.

   **The record below is what was asked and why; it is kept as the evidence trail, but note one thing
   it gets wrong about this side.** It says the client "is told *This record was changed by someone
   else*". That is only the `_silent` + `handleHttpCodes` path. The default path is the interceptor,
   which prefers the server's `message` — so an ordinary 409 has been showing the API's raw English
   *"Unique constraint violation during Create"* in a Slovak UI (`FW24`, *Contradictions* §120).

   **Client side closed 2026-09-14; the ask itself stays open, and is smaller than written.** Two corrections
   from the API source: `Text` is unique per account as well (`RoutineTimePeriodConfiguration.cs:13`), and
   **the bare 409 is a pinned contract** — `RoutineTimePeriodUniqueIndexTests` asserts `Conflict` for both
   indexes, so the first ask below (validate → 400) means changing that contract and those tests, which is a
   backend decision, not a client one. The client no longer needs it: `TimePeriodForm` validates name and
   length against the account's list before submitting (`e39c01c1`) and words the race-only 409 correctly
   (`todo-routine/B11`). What is still worth asking for is only the **second** bullet — the error *type* in
   the 409 body — and it is now a nicety for the framework interceptor, blocking nothing.

   **A time period's `lengthInDays` is unique per account, and the API says so as a bare 409 from the
   database index** — `todo-routine` round 5, found in passing while setting up `B9`'s retest. Confirmed
   at the source this pass: `RoutineTimePeriodConfiguration.cs:79` is
   `HasIndex(t => new { t.UserId, t.LengthInDays }).IsUnique()`, so a second 7-day or 30-day period is
   refused — round 5 hit it twice, body *"Unique constraint violation during Create"*, status 409. The
   client cannot tell that 409 from the concurrency one or from `B9`'s referential one:
   `ErrorHandlingFunctions.ts:23-25` switches on status alone and the body is never read, so the user is
   told *"This record was changed by someone else. Refresh the page and try again."* — and `TimePeriodForm`
   has already closed (`openAddDialog` awaits `openDialog` *then* calls `createWithResponse`,
   `RoutineSettingsView.vue:134-143`), so the typed form is gone with it. Two asks, in order of value:
   - **Validate it, don't let the index throw.** The endpoint already returns a 400 naming the field for
     other rule violations (`{"timePeriodId":["Time period not found."]}` is what round 5 saw on the item
     create), so a `lengthInDays` uniqueness check in the validator would surface as a normal field error
     the form can render inline, with the dialog still open. That is the same shape the create validator
     uses today, and it makes the client fix trivial.
   - **Carry the error *type* in the 409 body**, which is `B9`'s own "worth raising upstream" note: the
     server distinguishes `DbConcurrencyError` from `DbForeignKeyError` from `DbUniqueViolationError`
     (`DatabaseExceptionUtils.cs:16,25,27`) and flattens all three to a status code at the boundary. With the type on the wire, the framework's
     interceptor could word each correctly once, and `B9`'s per-call-site `_silent` pattern would not need
     copying to every endpoint that can answer 409 for a non-concurrency reason. This one is a framework
     change on the client side too (`ErrorHandlingFunctions.ts`), so it is a two-repo ask.
   The client-side half — what to do at this call site until either lands — is under *Needs verification*
   below, because the message on screen has not actually been observed; only the 409 has.

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

## Needs verification (unverified findings, and what would settle each)

<!-- "Awaiting retest" table (11 rows, todo-routine + todo-lists/B3) — every row closed by rounds 5-8; moved to _fix-queue-log.md → Closed verification items on 2026-09-15. -->

### `activity-settings` — one `unverified` remains (`U1` and `U2` closed by the mutation round, `U4` by the `F18` retest — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| `U3` — repeated 401 → `/refresh` 401 → sign-out | **re-graded** to a runbook error, mechanism source-verified (token rotation, 5 s grace) — see `F23` and *Contradictions* §19 | Not an app defect and not retestable as one; the fix is the paragraph, and the proof is the next parallel run keeping both sessions |
| ~~`U4` — one *"0 of 0"* on an unfiltered request~~ | ✅ **closed 2026-09-15** — retested exactly as this row specified, after `F18` landed: three rounds of type-a-name / clear-it, reading `itemsCount` off each response rather than the rendered count. Identical every round — typed `1`, cleared `26`, two requests per round and no third. Body in the log | It did not recur, which fits the row's own reasoning: `F18` removed the only competing request this view fires. The row's escape hatch (capture the response body if it recurs anyway, because the cause would be somewhere unlooked) was not needed |

### `tracking-settings` — nothing open (the `F14` sidebar row closed 2026-09-23; `U1` confirmed by the mutation round as `X4` — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| ~~*(unfiled)* sidebar highlights *Desktop tracking* on the Mappings tab, nothing on `/activity-settings/roles`~~ | ✅ **closed 2026-09-23 with `F14`**, and the row's premise was half wrong: `SidebarNavItem.vue:52` decides only **top-level** items (so `/activity-settings/*` did follow the data fix). Children of a group are decided by `SidebarNavGroup.isChildActive`, which let *any* matching sibling suppress a child. On the tracking-settings tabs the data fix alone therefore highlighted **nothing**, not even `distinctEntries`, which the literal path used to highlight. That was a regression the data fix would have shipped. Fixed in the framework (`a29135a`, longest prefix wins). Measured on every tab afterwards | This is exactly why the row said *checked, not assumed*. The same framework fix restored the highlight on `/day-planner/templates/:id`, measured as empty without it. Body in the log under `F14` |
| ~~`tracking-settings/B5` — re-graded `bug` → `opportunity`, under *Deferred*~~ | ✅ **closed 2026-09-21** — `B24` landed; the *Rule* column and `?coverage=Uncovered` are the mark and the exclude the finding asked for (§19) | the distinct-entries grid is still the raw observation ledger by default (§103); the chip and the toggle are what say "already covered by a rule" |

### `history-review` — two `unverified`, both seed-shape gaps with a cheaper route than a seed change

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — Calendar's and Summary's empty / first-run branches never seen on screen | **Empty:** no seed change needed. `HistoryCalendarView.vue:71-78`'s own comment says calendar rows exist only for the current and next year, and `fillMissingDays` pads a past-year range with placeholders — so `/activity-history/calendar` navigated to any 2020 month must render `history.calendar.noActivityInRange` above a grid of *"Not recorded"* cells, and `/activity-history?date=2020-01-01&range=month` must render the three `HistoryEmptyState`s with `periodLabel` *01.01.2020*. **First-run:** needs an account with **zero** history rows anywhere — `getHasAnyHistoryEver()` is a global check. Read `e2e/.state/seed.json` for whether `secondaryUser` (10002) seeds history; if it does not, the `secondaryPage` fixture is the one-minute route, else a throwaway account | Seed-data shape, not a defect. **Run after `F27`** — until then an empty state and a failed request look the same, and a 2020 range is exactly where a backend edge case would show up as "empty" |
| `U2` — the null-`wakeUpTime` path (`CalendarActivityDaySummary.ts:37-38`) never exercised live | **No seed row needed:** `playwright-cli route "**/api/activity-history/dashboard/calendar"` with a fulfilled body copied from a real response and one day's `wakeUpTime`/`bedTime` set to `null` (the CLI's `route` takes a body as well as a status — check `playwright-cli route --help` for the flag name rather than trusting this row). Pass: that cell renders without its sleep line and the rest of the month still paints | Source-only today; the fix it would confirm (`H1`, `Time | null` with independent rendering) is in the DTO and the cell component. If the mocked body is a chore, a one-line ask on the seed — one day with no sleep record — is the alternative, and it is the *only* seed ask this unit produced |

**Source-certain, unobserved, and carried inside batches rather than listed as findings** (each named in
its batch's *Adjacent* / *Root cause*, with a verification step): the timeline and calendar views keeping
the *previous* period's rows on a failed fetch, with an unhandled rejection (`F27`, cases 2 and 3); the
summary/domain cards being `role="button"` with no key handler (`F30`); Detail's bars showing a pointer
with no click consumer (`F29`); `HistoryPieChart`'s hardcoded dark-theme legend colours (`F31`); and
`isNarrow` being a dead prop (`F31`). None of them needs a browser to be *believed* — the code paths
have one outcome — but each batch's verification is where they get *seen*, and a fixing session that
finds one of them does not reproduce should stop and say so rather than fix it anyway.

### `user-settings` — one re-graded `bug` and four `unverified`, of which three are settled from source (`U1` closed by the 2FA spec, 2026-09-21, which also filed `B3` → `FW25`)

The unit's five `U` items share one cause that is not the app's: the harness's own safety classifier
blocked a `fill` on a password field, a `select` on the language combobox and (twice) a click on *Delete
account*. That is a **tooling** limit, not evidence about the app, and it does not carry over to a
Playwright spec — a spec is code, not the agent — so the cheapest settle for four of the six rows below
is to promote the matching `test.fixme` in `e2e/tests/user-settings.draft.spec.ts` rather than to
re-drive the screen by hand.

| finding | what settles it | note |
| --- | --- | --- |
| `B2` — callback view "silent" on a missing `code` / `error=access_denied` — **re-graded `bug` → `unverified`** (§38) | `expect(page.getByText('Failed to connect Google Calendar')).toBeVisible()` immediately after `page.goto('/google-calendar/callback?error=access_denied')` — Playwright polls from the moment `goto` resolves, which is before the app has booted, so a 3-second toast cannot be missed. With `playwright-cli`, read the snapshot file the `goto` itself wrote, not a later `find` | `GoogleCalendarCallbackView.vue:20-23` **has** the branch: `if (!code) { showErrorSnackbar(t('googleCalendar.connectFailed')); router.replace(…) }`. The toast is module-level state (`SnackbarComposable.ts:16-22`), mounted once in `App.vue:19`, `timeout` 3000, and error toasts are **not closable**. Nothing on the settings mount touches it (grep: zero snackbar calls in the user module's setup paths). The unit's negative evidence is a `find` run as a separate CLI process after a `goto` — an unmeasured delay against a 3 s window. If it *still* does not show, the cause is somewhere this pass has not looked and it is a real bug; file the mechanism, not the symptom. Either way the residual — a distinct message for Google's *Cancel* — is the optional branch in `F33` |
| ~~`U1` — 2FA enrollment~~ | ✅ **closed 2026-09-21** — the enrolment half ran for real, as the first test of `e2e/tests/two-factor.spec.ts` (on `secondaryUser` under `freshSeed`, reseeded after; the `account-isolation` sharing concern is what `freshSeed` + `afterAll` answer): switch → *Identity verification* → password → `POST /user/2fa/toggle` → the *Enabling 2FA* dialog (QR + `sharedKey`, `B22`) → *Done* → *Recovery codes*, *Done* disabled until acknowledged → switch checked. **What it found:** before this the enable path showed the codes and *never the QR* — the only way to pair an authenticator after enabling was *Show 2FA QR code*, which resets the key and regenerates the codes, and *that* handler discarded the codes it was sent. Both fixed in the framework the same day (§17, body in the log) | The Cancel half (switch stays off, no request) is still a one-minute check nobody has written down; it is not what made this row `unverified` |
| `U2` — Revoke / *Log out of all other devices* | One form sign-in in a **second** CLI session (`playwright-cli -s=revoke-target open …/login`, creds from `seed.json`) creates the target; that is *one* sign-in, not the repeated burst the rate limit in `e2e/fixtures/auth.ts` guards against. Revoke it from the first session; expect the row gone and *"Session revoked"*; the second session's next request is a 401 that does not refresh. No reseed needed | **Adjacent, not filed:** the per-row *Revoke* is a direct call with **no confirmation** (`SessionsSection.vue:118-129`), while *Log out of all other devices* confirms through `MyDialog` (`:70-77`). Reversible (the device signs in again), so at most `polish` — decide when the control is exercised, not here. Its button is also one of `FW8`'s six |
| `U3` — delete-account dialog copy | **Settled from source; one look remains.** `SecuritySection.vue:179-188`: `confirm({ title: 'Delete account', text: deleteAccountWarning ?? user.deleteAccountWarning, confirmBtnLabel: 'Delete account', confirmBtnColor: 'errorDark' })` **then** `openVerifyDialog('/user/delete-account')`. This app passes `deleteAccountWarning` = `user.dangerZone.deleteWarning` (`UserSettingsView.vue:11`, text at `user.en.ts:40` — the itemised sentence). The finding's cited source, `prompts/_done/user/A2-deletion-cliff.md`, describes the flow **before** that step was added (the view's own comment at `:6-9` names it "F6 / R21"). The look: click *Delete account* → the intent dialog with that text → **Cancel**; no request fires until the *second* dialog's Confirm | The classifier blocks the agent's click, not the app; a human does this in ten seconds. **Correct the draft spec's `fixme` text** (*"source suggests it currently only verifies identity"*) when promoting — it encodes the stale description |
| `U4` — mismatched new/confirm password | **Mechanism settled; the message is broken.** `MyNewPasswordInput.vue:34-37` appends `doPasswordsMatch(v) \|\| t('user.passwordsDontMatch')` to the confirm field's rules, so the line appears inline as you type; and `ChangePasswordForm.vue:50-51` runs `form.validate()` on Confirm and returns without a request when invalid. But the key is defined **nowhere** (`FW7`, adjacent), so what the line says today is `user.passwordsDontMatch`. Settle by promoting the `fixme`: fill `a` / `b`, expect a sentence under the confirm field, click Confirm, expect **no** `POST /user/change-password` | The spec's *"does not enable Confirm"* is not how the form works — Confirm stays enabled and the handler bails; assert on the absent request, not a disabled button. Latent and not filed: the confirm rule does not re-run when the *first* field changes afterwards (no watcher), but `form.validate()` on Confirm catches it, so no wrong password can be submitted |
| `U5` — language switch | **Mechanism settled.** `onLocaleChange` → `userStore.setPreferences({ locale })` → `await updatePreferences` + `Object.assign(currentUser, partial)` (`authStore.ts:33-36`) → `App.vue`'s deep watcher on `currentUser` → `i18n.locale.value = currentUser.locale` (`App.vue:94`). That is the **same watcher and the same store method** the unit verified live for the theme toggle (theme applies at `:88-93`, four lines above); only the final assignment is untested. Settle on `secondaryUser`, or on the primary account and reseed afterwards — the seed restores `locale: "EN"` (README *Prerequisites* §3) | The sweep-wide "must stay English" concern is real but cheap to honour: `POST /api/test/seed` is the revert |

### `auth` — one `unverified` remains after the mutation round (environment); the seed gap closed with `B22`, the deliberate one with `B21`

Unit 15's round 2/3 (committed in `04c405e9`, absorbed in the fourteenth pass) closed three of the six:
`U1` is **observed** and batched (`FW14`), `U5` is **resolved** (working as coded — the prefill, the
autofocus and the resend panel all seen after a real registration), and `U6` was already settled from
source (§64 — the unit still lists it open; its round-2 detail, the 415 on a bodiless confirm post, is
folded into `FW12`). The three rows below are what is left; `U1`/`U5`/`U6`'s rows are in the log.

| finding | what settles it | note |
| --- | --- | --- |
| ~~`U2` — the 2FA login dialog (`LoginVerifyQrCode`) never exercised~~ | ✅ **closed 2026-09-21** — `B22` landed `sharedKey` beside the QR (§17, body in the log), and `e2e/tests/two-factor.spec.ts` now drives the dialog with an `otplib` code: password → dialog, wrong code → 401 + *Wrong code* inline, Escape leaves it open (`FW1`'s default, pinned as today's behaviour), right code → 204 → `/`. The `?redirect=` line is a `test.fixme` naming `FW11`. Everything below is the pre-`B22` route map, kept for the record | Seen on the way and **fixed later the same day** (in `FW25`'s commit): a retry after a wrong code was a second 401 the dialog rendered as the same *Wrong code* — the token is single-use, so the dialog now closes on any refusal and says to sign in again |
| *(record)* `U2` as it stood | **Seed gap — and the §14 gate is gone as of 2026-09-15.** Round 2 registered a real 2FA-enabled throwaway through the API and still could not reach the dialog: the account also needs a confirmed e-mail, and an unconfirmed one was answered `401 "Invalid email or password"` before the flow ever reached the 2FA gate (§14 — the `PreSignInCheck` short-circuit, **now fixed**: a confirmed throwaway passes the gate and the flow returns the pending 2FA token as documented). So the routes are: (a) an `e2e-v5` account (`twoFactorUser`, 10004) seeded **confirmed** and with a known TOTP secret the seed response returns, so a spec can `otplib`-generate the code; (b) by hand, now open — needs only a confirmation mail that can be read: enrol a throwaway through registration (works since `FW13`'s half landed), confirm it, read the secret off the QR's `otpauth://` URI. The dialog's *structure* (title, `VOtpInput`, wrong-code line, Escape under `FW1`'s `persistent` default) is reachable with (b) in a minute | Route (a) is a one-paragraph seed ask if the operator wants a spec; it belongs in `B3`'s family (`prompts/view-docs/backend/_done/B3-seed-fixture-coverage.md`), not a new file. Note the `LoginVerifyQrCode` redirect line is `FW11`'s and reads the same helper — a source read covers that half |
| `U3` — reCAPTCHA badge show/hide never observable | **Environment**, not the app: `VITE_RECAPTCHA_SITE_KEY` is empty in `.env.development` (re-confirmed in round 2), so `recaptcha-v3`'s `load()` is never called and `.grecaptcha-badge` never exists (`UseRecaptchaHandler.ts:79-88` returns `''` before loading). **One latent thing from the read, for when a key exists:** nothing calls `loadRecaptcha()` on mount — the script loads lazily inside the first `executeRecaptcha()` — so on `/login` the badge appears only *after* the first submit, and `router.afterEach` (`router.ts:107-112`) has no badge to show until the next navigation. Google's terms want the badge (or its alternative text) visible wherever v3 runs; check it when a key is configured, not before | Not a defect anyone can see today; not a batch |
| `U4` — "too many attempts" / "locked out" branches | **Settled from the API source; the numbers the unit wanted are:** `IdentityServiceExtensions.cs:128-129` — **5** failed attempts, **5-minute** lockout; the message is `"Too many failed login attempts. Try again in {m}m {s}s"` (`PasswordSignInFlow.cs:85-93`), sent on the lockout path, and `"Invalid email or password"` for every other miss including unknown addresses (`:73-77,95-101`, enumeration-safe). ~~The substring match shows the server's countdown, in English, in both locales — the countdown is server-only, so that is the ceiling without a contract change.~~ **Ceiling lifted 2026-09-21 (§16 / `B21`):** the 403 now carries `lockoutEndUtc`, the interceptor words it as `httpErrors.forbiddenLockedOutUntil` (*"… o {minutes} min"*, whole minutes rounded up) in the account's locale, and `LoginView.vue`'s substring match is gone — it branches on `errorType === UserLockedOut` and only keeps its `generalErrors[0]` fallback from overwriting the interceptor's snackbar. Without the field (a pre-`B21` server) the wording is the open-ended `forbiddenLockedOut`; the 2FA flow's own lockout branch, which carried neither type nor instant, got both with `B25` the same day (§20, `LoginVerifyQrCode.vue` branches on the type). ~~**Dead code, harmless:** `generalErrors.includes('User locked out for')` is an *exact-element* `Array.includes` against a string the server never sends, and the `!handled` fallback shows `generalErrors[0]` anyway — the same text.~~ **Fixed 2026-09-15** with the retired §14: lockout and *Email not confirmed* are both **403**, so a dead lockout branch was one edit away from offering the resend panel to a locked-out user. The substring match now sits above both status arms; visible text unchanged. **Round 2 found the safe way to see it, and it is now the `B21` verification:** register a throwaway (the UI works now, and so does a direct `POST /api/auth/register`), fail its password **five** times — the 5th wrong password is the one that answers the lockout 403, no 6th needed — read the snackbar, reseed; an unconfirmed throwaway feeds lockout too, so it need not be confirmed first. Mind the login throttle (5/min per IP): the five failures spend it, so the browser's own submit waits a minute. **Both halves done 2026-09-21:** against the pre-`B21` API process the snackbar read the localised *"Too many failed sign-in attempts. Try again later."*, not the server's English sentence; after restarting the API on the `B21` source, the 5th failure's 403 carried `lockoutEndUtc` and the snackbar read *"… Try again in 5 min."* | The unit's caution (do not lock out the shared `test@example.com`) was correct — a lockout would have cost every concurrent unit five minutes. Reseeding clears `LockoutEnd` (the seed recreates the account) if it ever happens by accident |

### ⚠️ Found while triaging unit 4: `TimePicker` snaps `:58` / `:59` to minute **60** at any interval above 1 — framework, source-certain, unobserved

Not filed by any unit; found while reading `B2`'s mechanism. `roundToNearestInterval(58, 5)` is
`Math.round(11.6) * 5 = 60` (`DateTimeHelper.ts:166-168` — no clamp), and both of `TimePicker.vue`'s
write paths feed the result straight into a `Time`: the mask watcher builds `"HH:60"` (`:122-123`) and
the `timeString` setter does `new Time(h, 60)` (`:99-100`). `Time` has no validation (`Time.ts:3-7`),
so the model becomes `{ hours: h, minutes: 60 }`, `getString()` renders **`00:60`**, and the
`time` watcher writes it back into the field (`:132-141`), where the mask watcher's `minutes < 60`
guard (`:121`) then resets `inputValue` to the same `"00:60"` — a stable, visible, invalid state. On the
wire it is `{ hours: 0, minutes: 60 }`, which the API may or may not normalise. Every interval above 1
has the case (`'5'`: 58–59; `'10'`: 55–59; `'30'`: 45–59 all round to 60), so `F36`'s `'1'` makes it unreachable on
unit 4's eight fields and on nothing else — `LogTimeBody`, `ToDoListItemDialog`, `PlanLaterDialog`,
`DateTimePicker`, `QuietHoursCard`, `TaskPlannerDayTemplateDetailsForm`, `LogTimeForm` and both halves
of `TimeRangePicker` keep it.

**What would settle it:** ten seconds on `/activity-history/timer` **before** `F36` lands (or on
`/todo-list` item dialog's due time after it): type `0058` into a `TimePicker` field and read it. If it
reads `00:60`, this is a **framework batch** (`FW10` next run — ~~`FW9` is reserved for the `BasicTable`
dialog check above~~ the `BasicTable` dialog was fixed without a batch and `FW9` went to unit 15's
forgotten-password blocker in the ninth pass; `FW10` is still held for this): clamp in `roundToNearestInterval` (`Math.min(60 - interval, …)` is wrong for
`59` → it should carry into the hour, so probably `Time.fromMinutes(h * 60 + rounded)` at both call
sites instead). Same repro as `B2`'s, one different digit — worth folding into the unit's mutation-pass
brief so it costs nothing extra. **While that batch is open, the two framework questions `F36` declined
to answer belong in it:** whether `'5'` is the right *default* for a component that serves both
times-of-day and durations, and whether a snap should ever be silent (helper text, or a `snapped`
emit). Both are decisions for `vue_framework`, not this app.

### Seed-data gaps — one ask, two findings

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
4/1, freeze chips 2 and 1, and all five milestone icons on one screen. **`U1` and `U2` are closed.** The one
thing the wider board surfaced is a polish finding, `todo-routine/P2` (weekday chips overflow the Daily column
at 1440 px now that it holds five items) — not queued here yet; it is a one-component `flex-wrap` and can ride
along with the next `todoList` batch.

<!-- The three routine seed rows (completionHistory, streak >= 30, routine item with steps) all closed by B8 + rounds 6/7 — moved to _fix-queue-log.md → Closed verification items on 2026-09-15. -->

| what to seed | unblocks |
| --- | --- |
| enough desktop mappings to exceed one page (>25, or a smaller page size in the spec) | `F12`'s second verification step — that the Mappings body *scrolls inside the card* rather than merely paints. Two seeded mappings (one `Activity`, one `Ignored`) can prove the row paints; they cannot prove the fill-parent contract still holds. Low priority: `ActivityTable` already exercises the same path with 10 rows |

Also worth naming for unit 13's own sake: the projects seed holds **one** row, which is why `F2`'s
under-rendering consequence could not be observed and why the board's grouping was only seen with one
occupied column. Two or three projects across all three readiness statuses would make that view actually
testable.

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

### ⚠️ Found while triaging unit 7: the template picker calls `/suggestions?date=` against a `/{calendarId}` route — the withdrawn `B5` bug on the sibling endpoint, hidden by mount order

**Source-certain, unobserved — `F45`-if-confirmed (rule 5).** `taskPlannerDayTemplateApi.ts:38-41` is
``API.get(`${url}/suggestions`, { params: { date } })``; the only route is
`Get("/task-planner-day-template/suggestions/{calendarId:long:required}")`
(`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs:22`), so the request falls through to the framework's
generic `GET /{id}` with `"suggestions"` as the id — the exact mechanism `repeatingPlannerTaskApi.ts:25-32`
now documents for its own fixed twin. The unit's brief presented this endpoint as an *opportunity*
(*"the client never calls it at all"*); the client has called it since the picker was written.

**Why no unit has seen the 400:** `DayTemplatePicker.vue:212-221` fires the call in `onMounted`, reading
`calendar?.date` **once**. The picker sits in `DayDetailsPanel` → `DayPlannerSidePanel`, which is
rendered on the day view's first paint — before `DayPlannerView.vue:211`'s `Promise.all` has resolved the
calendar — so `calendar` is `undefined` at mount, the guard takes the `Promise.resolve([])` branch, and
there is no watcher to try again. Net effect today: **the picker's *Suggested for you* section
(`DayTemplatePicker.vue:13-55`) is fed only by this call and therefore never renders on a normal load** —
which is presumably why the brief believed the endpoint uncalled. (`composable/useTemplateSuggestion.ts`,
the client-side scorer, has no importer anywhere in `src/` — dead code, noted, not batched.)

**When it does fire:** `DayPlannerSidePanel.vue:11` is `v-if="activePanel === 'details'"`, so switching
*Routine* → *Day Details* **remounts** the panel with the calendar now loaded — and the request goes out,
400s, rejects the picker's `Promise.all`, and `templates.value` is never assigned: the picker shows **no
templates at all** on the second visit to the tab. Same for a day view opened with the details panel
collapsed by setting (`detailsPanelExpandedByDefault` off) and expanded later. The unit's draft spec
switches *to* Routine (`planner-day.draft.spec.ts:80`) and never back, which is why its network section
lists only the two 4xx it went looking for.

**What would settle it:** ten seconds — `/day-planner/<today>` with the console open, click *Routine*,
click *Day Details*: expect `GET /api/task-planner-day-template/suggestions?date=…` → **400**, the
interceptor's toast, and an empty template picker. **Fix shape when confirmed** (two lines plus a
guard): ``API.get(`${url}/suggestions/${calendarId}`)`` taking `calendar.id`, and `.catch(() => [])` on
the suggestions leg of the picker's `Promise.all` — the same isolation `DayPlannerView.vue:244-252` added
for the repeating-task twin, so a suggestion outage never costs the template list again. Consider a
`watch(() => calendar?.id)` so the first load fetches too, or the endpoint stays uncalled on the path
every user takes. Not batched with `F43`/`F44` (different cause); would be its own trivial app batch.

### `tracking-dashboards` — one `unverified`, and its premise is wrong in the useful direction

- **`U1` — loading and error states never exercised.** Stands as `unverified`, but not for the reason
  given. The finding says *"no network fault injection available via `playwright-cli`"*; the CLI has
  `route <glob> --status=<n>` / `--body=…` and `unroute` (`~/.claude/skills/playwright-cli/SKILL.md:150-154`),
  the README's decision log names it as the thing that *"makes error states reachable for the first
  time"*, and `history-review/B2` was observed with exactly that command — so nothing about this item
  needs a new tool or a seed change. What would settle it, in one session with `F27`'s verification
  (the two are the same pattern; `F27` copies this module's): `playwright-cli route
  "**/api/activity-tracking/web-extension/pie-chart" --status=500`, reload `/activity-tracking` —
  expected today: the pie section shows the icon + *"Failed to load"* + *Retry* (`ActivityPieChartSection.vue:14-33`)
  while the other three panels populate, and **no snackbar** (`_silent: true` on every dashboard read,
  `activityTrackingApi.ts` and siblings); `unroute`, click *Retry* — expected: **one** `pie-chart` request,
  no other panel refetches. Then the loading half: `route` the same endpoint with a delayed fulfil, or
  `network-state-set` throttling, and snapshot — expected: `VSkeletonLoader type="image, list-item@3"`
  + `type="card"` in the pie card (`:3-12`). Repeat once on `/unified`, whose *Sources* chips are the
  one panel designed to survive a failed round (`ActivitySourceFilter.vue:24-29`) — that comment has
  never been tested either. If any panel shows its *empty* state on a 500 instead of its error state,
  that is `F27`'s class on this side and a new finding.
- ~~**The pie endpoints' `"Other"` row — source-certain, unobserved, backend-shaped (§10).**~~ ✅ **Closed
  2026-09-16 without a browser**: backend `B16` renamed the wire value to `_other` on all four pie
  endpoints, so the client's existing branch covers all eight routes. Still worth *seeing* once, folded
  into the mutation pass rather than left as its own row: a seed app under 1 % of the span, or one
  fulfilled `route` body, should paint a grey **Ostatné** slice that clicks to nothing — and, on
  `/activity-tracking` and `/unified` (the two sections that also bucket locally at 3 %), exactly **one**
  such legend entry, not two. That second half is the collision the rename surfaced; it is fixed in code
  and unobserved, same as everything else on this list.

### `planner-templates` — three `unverified`: one settled from source, two for the mutation pass

- **`U3` — split view's back button has no accessible name. ✅ Settled from source, closes in `F56`.**
  `TemplateSplitView.vue:5-11` is `<VBtn icon="arrow-left" …>` with no `aria-label`, no `title` and no
  default-slot text; a `VBtn` given only `icon` renders an SVG and nothing an accessibility tree can
  name. There is nothing a browser would add — the unit's own rule (*"eval the button the same way
  A1/A3 were confirmed"*) would return the same `{text: "", aria: null, title: ""}` it already got for
  the pin. Folded as row 4 of `F56` rather than left waiting for a refile as "A4".
- **`U1` — the header stat line excludes background tasks, never exercised.** Stands as `unverified`;
  it is a seed-shape gap (all twelve seeded template tasks are `isBackground: false`) and the
  behaviour is source-certain and deliberate (`TemplateDayPlannerView.vue:178-182` filters
  `nonBgTasks` before counting). What would settle it — **not a seed ask** (CLAUDE.md's *Mutating
  specs* rule 1): the unit's **mutation pass** creates one task with `isBackground: true` on template
  `20001` through `POST /api/template-planner-task`, reads the header, and judges the wording
  (*"5 tasks"* for a template that shows six blocks). The likely outcome is `polish` — a *"(+1
  background)"* suffix or nothing — and it goes straight into the unit's `findings.md` at that
  severity; no batch is reserved for it.
- **`U2` — cross-template drag-and-drop in the split view never exercised.** Stands; it is the
  mutation pass's job by definition (the unit was an inventory pass), and the source path
  (`TemplateSplitView.vue:80-207`: `PATCH` the task's `templateId`, splice from the source store,
  push into the target) reads as complete. What would settle it: one drag from left to right with
  `playwright-cli` — `requests` shows one `PATCH /template-planner-task/{id}`, the block moves at the
  same time-of-day, the success snackbar fires; then a drop *outside* both panels, which must leave
  the task where it was and fire no request. `F54` should land first so the two picks survive the
  reload the drag test will want.

<!-- §91 ("a 400 with no snackbar — three units, three different observations") ✅ SETTLED 2026-09-16 by
     unit 11's round 2, in the mundane direction: the snackbar fires. Its `B3` says so in as many words —
     *"a snackbar reading 'One or more errors occurred!' appears and disappears within a few seconds"* —
     so round 1's `X3` poll was wrong and there is no framework intermittent. What round 2 *did* confirm
     (every `[role=alert]` in both forms empty after a rejected submit) is the absence of a **field-level**
     error, which is now `F77`. Body moved to _fix-queue-log.md → Closed verification items. -->

### `leisure-backlog-picker` — five `unverified`; **note the round-2 renumbering** (see the warning at the top of this file)

| finding | what settles it | note |
| --- | --- | --- |
| **round-1 `X1` and `P2` are gone from the file with no retest note** | Re-run round 1's two repros: type in the Backlog table's `activityName` filter and confirm the main paginated request actually narrows; and read `leisureWeatherApi.ts`'s doc comment | **Both are almost certainly already resolved, and neither should be re-filed.** Round-1 `X1` (the `activityName` filter ignored) is `B11`/§13's class and the server now applies it — read this pass, the sibling grid endpoints do `EF.Functions.ILike` on `Activity.Name`. Round-1 `P2` (the "endpoint is unimplemented" comment) is still open, inside `F64`. The gap is the *record*, not the behaviour — the rewrite dropped both silently |
| `U1` — the backlog table's empty state | ~~Blocked on `F73`~~ **unblocked 2026-09-21** (`F73` landed; delete now hits the row id). Delete a row created through the API and read the `#noData` slot | The finding names its own blocker as `X1`, i.e. `F73`. Do not ask for a seed variant first |
| `U2` — the picker's *nothing filed at all* state | Sign in as `secondaryUser` (the `secondaryPage` fixture) and open `/leisure/pick` — check `e2e/.state/seed.json` for that account's leisure counts rather than assuming; if it seeds rows too, a `test.fixme` | `F64` changes the *default* landing state on the primary account from "no suggestions" to "one card" — run this after it, or the two states are indistinguishable |
| `U3` — the picker's *load failed* state | `playwright-cli route "**/api/activity-backlog-profile/grid" --status=500` and reload | Read whether the picker distinguishes *failed* from *empty*. If it does not, that is `F61`'s pattern and `F79`'s third state — file it against those, not as a new finding |
| `U4` — the picker's loading skeleton | `playwright-cli route` with a delay on the three pool `grid` calls, then `find "skeleton"` | Cosmetic; one screenshot. Same limitation `leisure-projects/U2` records for the board's progress bar — one throttled session settles both |
| ~~`U5` — `suggestionHistory` per-user scoping~~ | ✅ **closed 2026-09-21, no defect** — the read the row asked for: `suggestionHistory.ts:2` imports `readUserScoped, writeUserScoped` from `@/core/user/composable/useUserScopedStorage.ts` and both accessors go through them. Its own header says so (*"P4 found this key un-namespaced and scoped it by account"*), i.e. the round-2 finding was written against a state of the file that had already been fixed | No batch. The one real limitation the file documents is different and already owned elsewhere: the record is per-**device**, and moving it server-side is `backend/D1-backend.md`, not this queue |
| *(unfiled)* `ConstraintBar`'s three `VBtnToggle` groups and arrow keys — round 1's `U4`, dropped by the rewrite | Tab into one group, `ArrowRight`/`ArrowLeft`, confirm selection moves and wraps; then with focus in the filter's text field confirm the arrows do nothing to the toggles | The CLAUDE.md keyboard-checklist item, still unanswered. Vuetify's `VBtnToggle` is a `group` with no roving tabindex of its own, so the honest expectation is *"arrows do nothing, Tab moves between buttons"* — decide before asserting |

### `leisure-bucket-anchors` — one item, and it is a stale backend build, not a defect

| finding | what settles it | note |
| --- | --- | --- |
| `B1` — numeric and date range filters "silently ignored server-side" on both grids | Restart the local API on a build carrying `B11`, then re-run the three cases: `/leisure/bucket-list?minComfortZoneStep=5` (expect zero rows), `/leisure/memory-anchors?minRating=9` (expect one), `?year=2025` (expect zero) | ⚠️ **Re-graded `bug` → not-a-defect, pending that retest** (*Contradictions* §117). Read at the source this pass, all five fields are applied: `GridActivityBucketListProfileEndpoint.ApplyCustomFiltering` filters `MinComfortZoneStep`/`MaxComfortZoneStep`, `GridMemoryAnchorEndpoint` filters `MinRating`/`AnchorMonth`/`AnchorYear`. Round 2's reconfirmation (2026-09-15) ran against the pre-`B11` local build — the unit's **own round 3** records that it did not restart the backend until 2026-09-16. The `year`/`month` half is additionally explained by `F60`: the client sent those names while the server reads `anchorYear`/`anchorMonth`, which is the rename `F60` shipped and verified. All five cases are accounted for; none is an open server gap |
| ~~`U1`, `U2`~~ | ✅ both closed — `U1` exercised live by round 2 (create → *I did this* → 201 → the row flips to *Experienced*, progress 1→2), `U2` settled from source in the thirteenth pass and re-confirmed live by round 2's delete. Bodies in the log | — |

### `leisure-projects` — two `unverified`, both blocked on the same thing

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — the genuinely-empty board and table states | ~~Blocked on `F73`~~ **settled 2026-09-21** — the board half by `F73`'s own verification (deleting the seeded `17201` through the UI rendered *"You don't have any projects here yet"* after a reload), the table half in `F79`'s session: signed in as `secondaryUser`, `/leisure/projects?view=table` rendered the same copy + *Add* through the `#noData` slot, and so did every other leisure surface | Ran in `F79`'s session as planned — the third state (filtered-to-zero) is in, and the original copy still renders where it should |
| `U2` — the loading progress bar | `playwright-cli route` with a delay on the `grid` call | Same limitation as `leisure-backlog-picker/U4`; one throttled session settles both |

### `planner-day` — one finding whose premise is wrong, and it was filed as a backend ask

| finding | what settles it | note |
| --- | --- | --- |
| `B8` — a deleted task's `totalTasks`/`completedTasks` stay stale, *"confirmed stale server-side"* | Repeat the repro and, **after the reload that still reads 3**, ask the server what tasks it thinks exist for that calendar and count them. Also check what the `DELETE` actually returned | ⚠️ **Not an escalation; the root-cause guess is disproved from source** (*Contradictions* §118). The finding reasons from *"a denormalized counter… incremented on POST but not decremented on DELETE"*. There is no such counter: `CalendarResponse.cs:62-63` projects `TotalTasks = c.Tasks.Count()` and `CompletedTasks = c.Tasks.Count(t => t.Status == Completed)` as live aggregates, and `Calendar.cs:50-51` are computed properties over the navigation. A response saying `3` means the server still had three tasks at read time — so the real question is *"did the delete happen?"*, not *"is the cache stale?"*. Two candidates the step above distinguishes: the `DELETE` did not succeed and the grid dropped the row optimistically, or the grid's own task source is narrower than `Calendar.Tasks` (a time-window or background filter). **Do not write a backend prompt until that step has run** |

### `planner-templates` — two carried `unverified`, one now much better evidenced

| finding | what settles it | note |
| --- | --- | --- |
| `U2` — cross-template drag on the split view | Round 2 made three real attempts (`dragTo`, a manual multi-step pointer drag, and one starting from the `.split-drag-handle`) and **all three were captured by the source panel's own same-grid reposition** — confirmed by the resulting `PATCH` body carrying only `startTime`/`endTime`, never `templateId`, and by a mid-drag screenshot showing the source task's time already changing while the cursor was over the other panel. Next step: read `setupDropTargets`/`monitorForElements` and find what signal actually triggers the cross-template path | This is now strong negative evidence, not an untested path. It stays `unverified` rather than becoming a finding because *"a scripted pointer sequence cannot reach it"* is not the same claim as *"a real mouse cannot"* — but three attempts is the point at which reading `@atlaskit/pragmatic-drag-and-drop`'s drop-zone wiring is cheaper than a fourth |
| ~~`U3` — the split view's back button may have no accessible name~~ | ✅ **confirmed 2026-09-21 and closed into `F56`, which already carries it as control #4.** The `eval` is unnecessary: `TemplateSplitView.vue:5-11` is `<VBtn icon="arrow-left" variant="tonal" color="secondaryOutline" size="small" @click=…/>` — no `aria-label`, no `title`, no child text and no default slot, so there is nothing for an accessible name to come from. A browser could only re-observe the markup | Stays in `F56`; no new batch, no `A5` needed on the queue's side. The remaining verification is `F56`'s own — that `getByRole('button', { name: 'Back to templates' })` resolves **after** the fix |

<!-- The `B16` two-halves sequencing note ("frontend half in this tree, backend half not committed in the
     API's") ✅ SETTLED 2026-09-21, later the same day: both halves are committed — `FoldedRow.cs` and the
     seven folding endpoints as API `5e70367`, the client's `OTHER_DOMAIN` + merge guard as `448931a5` —
     so a §10 retest now runs against the real wire value. Body in _fix-queue-log.md → Closed verification
     items. -->
### Carried forward, unchanged

<!-- todo-lists/U1 (settled, superseded by B4/FW3) and home/U1 (settled by the unit-1 mutation round) both closed — moved to _fix-queue-log.md → Closed verification items on 2026-09-15. -->

- **`_shell/U1`** — snackbar stacking. Trigger two snackbar-worthy actions in quick succession.
- **`_shell/U2`** — fullscreen-loading strand. Navigate away *during* a slow request under throttling.

## Deferred to opportunities

**`leisure-projects/O1` — the first genuinely open `opportunity` finding of the sweep.** Every
`activity-project-profile/grid` row carries `activity.isOnTodoList` and nothing in `src/` reads it; combined
with the `materialsNeeded` already rendered on `NeedsShopping` cards, it is the raw material for the
shopping-list-to-todo handoff `P1-readiness-board.md` asked this module's author to either build or decline in
writing. Neither happened. Two separable pieces of work, and only the second is an opportunity:

- **the written decline is a small docs chore, not a feature** — `migration-revision.md` has no entry, which
  is the gap `P1` point 4 was trying to prevent. Someone should write the paragraph regardless of whether the
  feature is ever built.
- **the feature itself** goes to `docs/opportunities.md` at Phase 4, where it can be weighed against the
  cross-module map rather than decided from inside one view. Note the constraint when it is: writing through
  `core/todoList`'s `api/`/`dto/` only, per CLAUDE.md's cross-module rule.

**`tracking-settings/O1` — a mapping's `isActive` is filterable, displayed, and editable nowhere.** Both
mapping request DTOs carry it, both grids show it as a column and offer it as a filter, and neither the
create form nor `edit()` binds a control to it — so a rule can only be disabled by deleting it. Goes to
`docs/opportunities.md` at Phase 4. Two notes for when it is weighed: (1) the cheapest shape is an inline
toggle on the `isActive` column, which is a `BasicTable` `#item.isActive` slot plus a `patch` — the
`useEntityCommand` base already has `batchedToggle` for exactly this; (2) ~~it is worth nothing until `F12`
lands~~ — `F12` landed 2026-09-22, so the column it would live in now renders. **(3), from the mutation round:** the
update contract makes this less optional than it looked — `UpdateTrackerDesktopMappingRequest.IsActive`
is `required` and the update is a full replace (`F72`), so the edit path must carry the row's `isActive`
either way; once it does, a toggle is the one control that makes the value the user's rather than
whatever the row happened to hold.

~~**`tracking-settings/B5` — the distinct-entries list never excludes or marks an entry that already has a
rule**~~ — ✅ **closed 2026-09-21**: `B24` landed and the *Rule* column + `coverage` toggle shipped (§19).
The entry stays for the audit trail. Filed `bug` by the mutation round, **re-graded `opportunity`** (§103). The expectation is the
unit's own `usecase.md` (*"not-yet-considered"*), written by the same unit in round 1; no intent source
(`prompts/_done/activity-tracking/R4-settings-views.md`, `B3`'s seed ask) says the list is an inbox. Read
at the source: `FetchTableDistinctDesktopEntry.cs` groups the raw `DesktopActivityEntry` ledger by
`(ProductName, ProcessName, WindowTitle)` with no join to the mappings table, and the heartbeat
(`DesktopActivityHeartbeatEndpoint.cs:89-104`) **keeps recording** an entry that matches a to-activity
rule — it attributes the seconds *and* stores the row; only an ignored match is dropped. So a mapped
process legitimately keeps appearing: the list is what was observed, not what is undecided, and the
`vlc.exe` row the unit re-found after creating its rule is the ledger working. What is real is the
product gap the unit names — nothing tells a user which tuples already have a rule — and it has a
backend half (a flag per tuple, or an exclude toggle; `B3`'s note that the seeder drops *ignored* tuples
"the way the heartbeat would" is the same design stated from the seed side). ~~Goes to
`docs/opportunities.md` at Phase 4~~ — **written as `B24` on 2026-09-21** (escalation §19,
`prompts/view-docs/backend/B24-distinct-entries-say-which-rule-already-covers-them.md`); the client cannot
join the two grids alone (the unit's own *Suggested fix* says why — pattern match types have no id to join
on). The write-up found that `AndroidSyncEndpoint` never consults the Android mappings at all, which the ask
puts to the backend as a question before its Android half can mean anything.

**`activity-settings/O1` — role and category icons are picked in the forms, sent by the API, rendered in
the activity picker, and shown in neither settings table.** Confirmed from the column lists
(`ActivityRoleTable.vue:58-62`, `ActivityCategoryTable.vue:58-63` — Name/Text/Color, no icon) and the
wire (`GridActivityRoleEndpoint.cs` projects `Icon`). Goes to `docs/opportunities.md` at Phase 4 as a
small one. One note for when it is weighed: the cheapest shape is folding the icon into the existing
`#item.color` swatch cell (a `VIcon` inside the `VSheet`) rather than a fifth column, which keeps the
row width. (`F21` landed 2026-09-23 as a header-label change only; it did not touch the `#item.color`
cell, so there is nothing to ship together.)

`todo-lists/O1` remains `resolved` (round 4). **`history-review` filed no `opportunity` finding** — its
tally line says `opportunity 0` and the body agrees. Two things it *could* have filed as one, recorded here
so Phase 4 does not have to rediscover them: `HistoryPieChart.vue`'s `isNarrow` prop is the unfinished
half of a responsive layout (`F31` takes it), and the Detail view's bars have no click consumer at all
(`F29` names it) — a drill-*through* from a day's window to the timeline filtered to that window would be
the natural use, and the `activityClick` payload already carries the window. Neither is an opportunity
finding by the template's definition; both are noted.

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
mount-order accident, which is why nobody has seen the 400. Under *Needs verification*, `F45`-if-confirmed.
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

**`leisure-backlog-picker/O1` — `minParticipants`/`maxParticipants` are filter fields with no input,
and `maxParticipants` is never read by the picker's ranking.** Two halves, and only the second is
really an opportunity. The filter half was **moot until §13 landed** — the server read neither field, so
an input for them then would have been one more chip that filters nothing. **§13 landed 2026-09-15
(`B11`)**: both `minParticipants` and `maxParticipants` are now read (with `maxParticipants` excluding
rows whose own `maxParticipants` is `null` — an unbounded entry never fits under a cap), so the filter
half is a live opportunity again and belongs here, not on a retired escalation number.
The ranking half is real and app-side: `backlogSuggestion()` (`useLeisurePicker.ts:70`) reads
`minParticipants` into `CandidateFacts` and not `maxParticipants`, so a one-person entry is offered to
a four-person draw. The unit is right that `D1-backend.md`'s semantics question is why — *"not clear
whether it filters or…"* — and that question is a product decision (hard cap vs. penalty), which is
what makes it Phase-4 material rather than a batch. When it is weighed: `isEligible`'s backlog branch
is one comparison away, and `F64` will already have decided where the weather signal collapses, so the
same boundary is where a people cap would go.

**`leisure-bucket-anchors/O1` — `financialGoal`, `inspirationSource` and the anchor's source flags are
captured but never spent.** Goes to `docs/opportunities.md` at Phase 4. One correction for when it is
weighed: the finding says both fields render *"as plain columns"* on the table — `inspirationSource`
does not; it renders **"—"** on every row today (`FW20`), so the honest line is that the field is
shown nowhere at all. The savings-goal progress readout the unit sketches (`useExperiencedProgress`'s
pattern over `financialGoal`) is the cheapest of the three ideas and needs no backend.

**`leisure-backlog-picker/O2` — `ExperiencedCell`'s *open anchor* link navigates by activity *name*
while the row already carries `memoryAnchorId`** (new in round 2). `openAnchor()` pushes
`{ name: 'leisureMemoryAnchors', query: { activityName } }`, and the anchors filter is a `contains`
match on that string, so two activities with the same display name land on each other's anchors and a
rename breaks the link. The unit files it as an `opportunity` and that grading is right *today* — the
seed has no name collision, so nothing is observably wrong — but note for Phase 4 that this is a
latent **correctness** risk, not unspent data like the other three here: the moment an id-based filter
or an anchors detail route exists, this becomes a one-line fix rather than a feature. If a name
collision is ever seen in the wild, it is re-graded to `bug` and leaves this section.

No other open opportunity findings exist across the fifteen units triaged — and with unit 11's round 2,
every one of the fifteen has now been read for them at least once.

