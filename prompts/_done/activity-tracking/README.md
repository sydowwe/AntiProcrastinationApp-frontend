# Activity tracking prompts

Improvements to `../../../src/core/activityTracking`, one self-contained prompt per file. Each is written to be pasted into a fresh session in this repo —
`../../../CLAUDE.md`
auto-loads there, so the prompts carry only task-specific facts (file paths, line numbers, the actual duplicated code) rather than restating conventions.

Two series. **R** is health: the module has real defects and the worst duplication in `../../../src/core`. **U** is capability: it can only answer "what did I do on
this one day, on this one device", which is a narrower question than the data supports.

## The premise

The module is 7,478 lines across 118 files, and three of its five views — `ActivityDashboard.vue`, `DesktopActivityDashboard.vue`, `AndroidActivityDashboard.vue` —
are ~85% the same file. The DTO tree is tripled behind them: three `PieChartRequest`s, three `StackedBarsWindow`s, three timeline responses, differing in one label
field (`domain` / `productName` / `appLabel`). It is also the only module in `../../../src/core` with no `composable/` and no `store/` — every piece of logic lives
inline in a view.

**The three views stay three views.** They are expected to diverge, so R2 extracts the shared machinery behind them rather than merging them. The convergence, where
it happens, is in the *contract* — see U4.

## Index

| #   | Prompt                                                                  | Kind       | Backend | Model      | Effort  |
|-----|-------------------------------------------------------------------------|------------|---------|------------|---------|
| R1  | [Correctness sweep ⭐](R1-correctness-sweep.md)                         | health     | —       | Sonnet 5   | low     |
| R2  | [Share the dashboard machinery ⭐](R2-share-dashboard-machinery.md)     | health     | —       | **Opus 5** | high    |
| R5  | [Fix the cross-module import](R5-baseline-boundary.md)                  | health     | —       | Sonnet 5   | low     |
| R4  | [Settings views](R4-settings-views.md)                                  | health     | maybe   | Sonnet 5   | medium  |
| R3  | [Localize the module](R3-i18n-pass.md)                                  | health     | —       | Sonnet 5   | medium  |
| U1  | [URL state](U1-url-state.md)                                            | capability | —       | Sonnet 5   | medium  |
| U2  | [Request lifecycle](U2-request-lifecycle.md)                            | capability | —       | Sonnet 5   | medium  |
| U6  | [Empty states that say something](U6-empty-and-first-run.md)            | capability | —       | Sonnet 5   | low–med |
| U3  | [Break the single-day ceiling ⭐](U3-date-range.md)                     | capability | yes     | **Opus 5** | high    |
| U5  | [Fragmentation metrics](U5-fragmentation-metrics.md)                    | capability | partly  | **Opus 5** | high    |
| U5b | [Adopt the focus-metrics endpoint](U5b-adopt-focus-metrics-endpoint.md) | capability | landed  | Sonnet 5   | medium  |
| U4  | [One picture of the day ⭐](U4-unified-source.md)                       | capability | yes     | **Opus 5** | high    |

## What R1 fixes, so you know the state of things

Every item is verified and located, not suspected:

- `view/ActivityDashboard.vue:137` — the date is hardcoded to `new Date('02-08-2026')`. The web-extension dashboard opens on a fixed day in production.
- `api/activityTrackingApi.ts:32,34` — two `console.log('[DEBUG]…')`, one `JSON.stringify`-ing every timeline response in full.
- `view/DesktopActivityDashboard.vue:263` — a local `formatDateForApi` copy shadowing the `_common` one the other two views import.
- `view/ActivityDashboard.vue:98` — the pie chart's skeleton is driven by the summary-cards loading flag; its own `pieChartLoading` is set and never read.
- `IgnoredProcessesTable.vue` (313 lines) and `RoleCategoryForm.vue` (73) are unreferenced.

Separately: the locale files contain **two keys**, and `$t(` appears in exactly one live file in the module. In an app where SK is primary, this module is
English-only — R3.

## Suggested order

**R1 → R2 → (R5 ∥ R4) → R3**, then **U1 → U2 → U6**, then the backend-dependent **U3 → U5 → U4**.

R2 is the hinge. U1 and U2 both edit state and fetch orchestration that R2 moves into one composable; running either first means doing it three times and then
undoing it. R5 and R4 touch disjoint files and can run in parallel with each other. R3 goes after R2 for the same reason U1 does — the header it would localize three
times becomes one component.

U3, U5 and U4 all hit the same endpoints. Run them in that order and have each read the `backend` files the previous one left, so the three asks compose instead of
contradicting.

## Backend-dependent prompts

**U3** and **U4** need data the .NET side does not expose. **U5** turned out to need it only *partly*: the four measures themselves are derived client-side from
timeline sessions already served and shipped with no contract change, but comparing them against the user's own recent history, and reporting them over a multi-day
range at all, both need data the client never holds — see `backend/U5-backend.md` §0–1, which says outright that nothing in it blocks the single-day dashboard.
**R4** carries one open contract *question*, not an ask.

The .NET solution is not in this repo, so none of these can verify a contract from here. Each therefore ends with the same instruction: **do all the frontend work
that stands on its own first, then write the backend ask** to `prompts/activity-tracking/backend/<ID>-backend.md`.

That handoff file is **contract only** — the endpoint the frontend calls (method, route, request shape) and the DTO fields it consumes, with types and nullability,
in the JSON naming the frontend's `fromJson` reads. Nothing else: no entities, no EF or migrations, no FK or cascade decisions, no opinion on how a value is computed
or stored.

The boundary is deliberate. This repo cannot see the .NET solution, so anything past the contract is a guess dressed as a spec. The frontend knows exactly what it
consumes — that part it can state with authority. Implementation is the backend agent's call.

The one place the frontend is asked to *propose* rather than just consume is the triplication (in U4): three structurally identical request families and three
response families differing by one label field. The frontend can speak to that with authority because it is the thing adapting them. It is still framed as a proposal
with reasoning, and the decision stays with the backend.

Batch the resulting files into one backend session rather than opening a thread each.

## How the model calls were made

**Opus 5, high effort** — R2, U3, U4, U5. These share a property: small diffs, large consequences if the judgment is wrong. R2 is choosing where an abstraction seam
goes under an explicit "these will diverge" constraint — the failure mode is a generic dashboard nobody asked for. U4 is overlap resolution across three trackers
that double-count the same wall-clock minute; get the precedence rule wrong and every total on the page is a lie. U3 has to decide what a session timeline even
*means* over thirty days. U5's code is trivial and its framing is not — the same number presented two ways is either useful feedback or a reason to close the tab.

**Sonnet 5, low–medium** — R1, R3, R4, R5, U1, U2, U6. Located defects, mechanical moves, or work against a pattern that already exists in the repo
(`useTableUrlState.ts` for U1's shape, the existing loading/empty states for U2's error states). R1 and R5 are genuinely low: R1 is six numbered fixes with line
numbers, R5 is one file move and three import repoints.

**Nothing here is a Haiku job.** R3 needs real Slovak, and every other prompt touches either a shared component or a surface where a plausible-but-wrong result is
expensive to detect.

Bump effort if a run comes back shallow — R4 and U6 are the likeliest, since both depend on correctly reading existing behaviour before writing anything (R4's
`saved()` discrepancy, U6's three-way empty-state diagnosis).

## Deliberately excluded

- **A Pinia store for the dashboards.** State is per-view and dies with the route; a composable is the right unit. The module's problem is that logic lives in
  templates, not that it lacks a store.
- **Merging the three dashboards into one source-parameterized view.** Considered and rejected — the three sources are expected to diverge. The duplication is
  attacked at the machinery level (R2) and the contract level (U4) instead.
- **Charting library migration.** `StackedBarsGrid.vue` (641 lines) and `StackedBarsChart.vue` (433) are hand-rolled, which is a lot of custom code — but they work,
  they are already decomposed into a grid/column/tooltip split, and swapping them is a large diff with no user-visible gain. Revisit only if U3's adaptive-window
  work turns out to fight them.
- **Productivity scores, grades, streaks on tracked time.** See the framing section in U5. Volume-of-time metrics turned into a score is how a tracking tool becomes
  something the user avoids opening.
