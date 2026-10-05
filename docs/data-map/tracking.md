# tracking — data-map extract

> Extracted 2026-10-01 · commit `4d890646` (no uncommitted changes under `src/core/activityTracking/` or either unit's docs) ·
> units: 05 `tracking-dashboards`, 06 `tracking-settings` · modules: `activityTracking`
> DTO files read: 76 · fields mapped: 157 · skipped by rule: ids, join-only FKs, transport wrappers
> Also skipped: pure container fields (`active`/`background`/`stat`, `totals`, `domains`/`processes`/`apps`/`items`,
> `activities`, `sessions`, `primary/detail/backgroundSessions`, `*Sessions` lanes, `coveredBy` itself, `baseline`,
> `longestBlock`, `monitorBreakdown`, `windowTitles` lists in the details response, `devices`, `days`). Their element fields
> are mapped instead. Also skipped: enum/option files, `Position.ts`, and `StackedBarsInput.ts` (a client view-model, not
> wire data), plus the `fromRow`/`updatePattern`/`hasPattern`/`patternLabel` helpers (request builders, not reads).
>
> **Conventions for this group.** Ledger tags in the *field* column: **W** web extension, **D** desktop, **A** android,
> **U** unified (merged server-side from the other three). A family table maps a field **once** and lists the ledgers that
> carry it. The ledgers' raw data is written by **external clients** (browser extension heartbeat, desktop agent, Android
> sync), never by this web app. Their fields are therefore `derived` (in a response, never in a request from this client),
> with *captured in* = `external client (<ledger>)`. Chart payload fields are server aggregates of that data, also
> `derived`. The only data this app captures is the mapping rules on the two settings screens, plus the dashboards'
> filter/range state.

## Summary
- **This group writes almost nothing.** Unit 05 is read-only. Its only captured data is query state (`date`, `dateTo`, `from`, `to`, `view`, `baseline`, `window`, `selected`, and `sources` on unified), all URL-synced and echoed by the controls that set it. Unit 06 captures one entity, the **mapping rule** (desktop and android), plus its filter state. The **web-extension ledger has no settings screen**: its domains cannot be mapped or ignored from this app.
- **The identifier is dropped wherever a panel only needs the display name.** `DesktopProcessSummaryDto.processName`, `AndroidAppSummaryDto.packageName`, `DesktopTimelineSession.processName` and `AndroidTimelineSession.packageName` are parsed and then dropped by the view's `to*` mappers. As a result, **dashboard selection is keyed on the display name** (`productName` / `appLabel`), even though the server groups by the identifier. Two desktop processes that share a product name therefore collide on selection and on the details lookup (`DesktopPieChartSection.vue:175`). The server added a serialized `Key`/`Label` pair to every per-source item (`IDashboardItem.cs`) to fix exactly this, and the client parses neither.
- **Derived but unread (biggest items):** the whole `DomainDetailsResponse` (`getDomainDetails` has no caller); `ActivityStat.averageSeconds` (all four ledgers); `FocusBlock.startedAt`/`endedAt` (the strip names the longest block but never says *when* it happened, even though this is the most time-bearing fact in the payload); per-window-title `activeSeconds`/`backgroundSeconds`/`fullscreenSeconds`/`soundSeconds` on the desktop process detail; `DesktopProcessPieData.windowTitles`/`entries`; `UnifiedSummaryItem.sources` and `UnifiedWindowItem.sources`; and the B23 echo fields `AndroidAppDetailsResponse.packageName`/`appLabel`/`totalSeconds`.
- **Phantom and missing fields:** `DayTotals.totalVisits` is read and rendered, but **no backend member exists**, so it always shows "-". Meanwhile the server's `TotalEntries` on the same object is dropped. `SummaryCardsData.totalSeconds` is unread anyway, and the web backend (`DomainSummaryDto`) never sends it.
- **Mapping rule:** the pattern fields, `isIgnored` and `activity` are spent (Mappings tab plus edit round-trip). `isActive` is an `echo`: it is written and shown by the same inline switch (O1), and its only other effect is server-side, through `coveredBy`. `roleId`/`categoryId` are parsed only so they survive the full-replace PUT. No surface shows a role/category target, so such a rule renders with a blank target, and `edit()` reopens it in *To ignored* mode (`DesktopSettingsView.vue:160-167`).
- **B23 / B24:** the client reads every B24 field (`coveredBy.mappingId`/`target`/`targetName`, `coverage` filter). For B23 it reads everything the panel needs (sessions, mean/longest, first/last use, devices, days). The response's own `packageName`/`appLabel`/`totalSeconds` go unread, because the panel shows the pie row's copies.
- **Cross-module:** no other module reads tracking *data*. History reuses tracking's `StackedBarsChart` component and the `BaselineType` enum (see the history extract). Tracking reads `activity`'s `ActivityFilterFormResponse` on mapping rows.
- **Time-bearing data with notification potential:** none of it is user-authored. The candidates are all derived: `FocusBlock.startedAt`/`endedAt`, `AndroidAppDetailsResponse.firstUseUtc`/`lastUseUtc`, timeline `startedAt`/`endedAt`, and the focus/baseline durations ("longer than your usual block", "longest break").

## Entities

### Web extension ledger — entities
No entity or settings DTO exists client-side. The extension posts heartbeats (`WebExtensionHeartbeatRequest`, backend only), and this app has no mapping or ignore screen for domains. Everything the web ledger contributes appears in the chart families below with tag **W**.

### Distinct entries (desktop + android) — `src/core/activityTracking/dto/response/desktop/settings/TrackerDesktopDistinctEntriesResponse.ts`, `…/android/settings/TrackerAndroidDistinctEntriesResponse.ts`, `…/response/MappingCoverageResponse.ts` · request: `DesktopDistinctEntriesFilterRequest.ts`, `AndroidDistinctEntriesFilterRequest.ts` (`POST /activity-tracking/{desktop,android}/grid`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `processName` · D | `string` | external client (desktop) | Settings → distinct-entries column (`DesktopDistinctEntriesTable.vue:59`), server sort key | derived · spent | — |
| `productName` · D | `string` | external client (desktop) | Settings → column (`:60`), default sort (`:70`) | derived · spent | — |
| `windowTitle` · D | `string \| null` | external client (desktop) | Settings → column (`:61`) | derived · spent | — |
| `appLabel` · A | `string` | external client (android) | Settings → column (`AndroidDistinctEntriesTable.vue:58`) | derived · spent | — |
| `packageName` · A | `string` | external client (android) | Settings → column (`:59`) | derived · spent | — |
| `coveredBy.mappingId` · D A | `number` | server (B24 matcher) | *Rule* chip deep-link `?mappingId=` (`MappingCoverageChip.vue:4`) → highlights that row on the Mappings tab (`useDistinctEntriesUrlState.ts:96`, `DesktopMappingsTable.vue:20`). Kept although an FK, because it decides the highlight | derived · spent | — |
| `coveredBy.target` · D A | `MappingCoverageTarget` | server | chip colour/icon/text, Ignored vs not (`MappingCoverageChip.vue:37-46`) | derived · spent | — |
| `coveredBy.targetName` · D A | `string \| null` | server (activity / role·category name) | chip text (`MappingCoverageChip.vue:40-43`) | derived · spent | — |

### Mapping rule (desktop + android) — `src/core/activityTracking/dto/response/desktop/settings/TrackerDesktopMappingResponse.ts`, `…/android/settings/TrackerAndroidMappingResponse.ts` · request: `TrackerDesktopMappingRequest.ts`, `TrackerAndroidMappingRequest.ts` (`…/tracker-{desktop,android}-mapping-by-pattern`)
The one entity this app captures. The pattern fields are typed into the filter bar, which serves both as the distinct-entries search and as the rule pattern (`useMappingSettings.ts:55` `updatePattern`). Server-side, every field decides ingest attribution and `coveredBy`.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `processName` · D | `string \| null` | Settings → filter bar *Process Name* (`DesktopEntriesFilterBar.vue:6`) → Save | Mappings tab column (`DesktopMappingsTable.vue:87`); delete-confirm label (`patternLabel`); edit repopulates the bar (`DesktopSettingsView.vue:154`) | spent | — |
| `processNameMatchType` · D | `PatternMatchType \| null` | filter bar match-type select | Mappings tab column (`:88`); edit (`DesktopSettingsView.vue:155`) | spent | — |
| `productName` · D | `string \| null` | filter bar *Product Name* | Mappings column (`:89`), default sort; delete label; edit | spent | — |
| `productNameMatchType` · D | `PatternMatchType \| null` | filter bar | Mappings column (`:90`); edit | spent | — |
| `windowTitle` · D | `string \| null` | filter bar *Window Title* | Mappings column (`:91`); delete label; edit | spent | — |
| `windowTitleMatchType` · D | `PatternMatchType \| null` | filter bar | Mappings column (`:92`); edit | spent | — |
| `appLabel` · A | `string \| null` | filter bar *App Label* (`AndroidEntriesFilterBar.vue`) | Mappings column (`AndroidMappingsTable.vue:87`); delete label; edit (`AndroidSettingsView.vue`) | spent | — |
| `appLabelMatchType` · A | `PatternMatchType \| null` | filter bar | Mappings column (`:88`); edit | spent | — |
| `packageName` · A | `string \| null` | filter bar *Package Name* | Mappings column (`:89`); delete label; edit (`AndroidSettingsView.vue:154`) | spent | — |
| `packageNameMatchType` · A | `PatternMatchType \| null` | filter bar | Mappings column (`:90`); edit (`:155`) | spent | — |
| `isActive` · D A | `boolean` | Mappings tab inline `VSwitch` (O1, `DesktopMappingsTable.vue:26-38,201-216`); create defaults `true` | the same switch; edit copies it into the request (`DesktopSettingsView.vue:153`). Effect elsewhere is server-side only: an inactive rule stops producing `coveredBy` | echo | — |
| `isIgnored` · D A | `boolean \| null` | distinct-entries *To ignored* mode (`useMappingSettings.ts:58-60`) | Mappings tab *Is ignored* column (`:94`); surfaces as the *Ignored* chip via `coveredBy.target` | spent | — |
| `activity` (resp.) / `activityId` (req.) · D A | `ActivityFilterFormResponse \| null` / `number \| null` | distinct-entries *To activity* → `ActivitySelectionForm` (`useMappingSettings.ts:63`) | Mappings tab `activity.text` column (`:93`); edit repopulates activity/role/category (`DesktopSettingsView.vue:160-163`); Mappings *Activity* filter. Surfaces as `coveredBy.targetName` | spent | — |
| `roleId` · D A | `number \| null` | never by this client (forced `null` on save, `useMappingSettings.ts:56`) | only round-tripped through `fromRow` for the full-replace PUT. No column or label shows it, and `edit()` treats such a row as *To ignored* | unread | — |
| `categoryId` · D A | `number \| null` | never by this client (`:57`) | same as `roleId` | unread | — |

### Settings filter state (request only) — `TrackerDesktopMappingsFilter.ts`, `TrackerAndroidMappingsFilter.ts`, `*DistinctEntriesFilterRequest.ts`
These are filters, not stored data. All are URL-backed (`useDistinctEntriesUrlState.ts:19,73-143`). The pattern half of the filter is the same set of fields as the rule pattern above and is not repeated here.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `coverage` · D A | `MappingCoverage \| null` | *All / Undecided / Covered* toggle (URL `coverage`) | same control | echo | — |
| `type` · D A | `Tracker*MappingTypeEnum` | Mappings tab *Type* select (URL `type`) | same control; swaps the activity row for *Is ignored* | echo | — |
| `isActive` (filter) · D A | `boolean \| null` | Mappings tab *Is active* tri-state (URL `isActive`) | same control | echo | — |
| `isIgnored` (filter) · D A | `boolean \| null` | Mappings tab *Is ignored* (URL `isIgnored`) | same control | echo | — |
| `activityId` (filter) · D A | `number \| null` | Mappings tab activity picker (URL `activityId`) | same control | echo | — |

Client-only, not sent: `desktopSettingsHintDismissed::u<id>` / the android twin in `localStorage` (via `useUserScopedStorage`). Shown back only by the hint itself.

### Summary-cards family — `dto/response/topDomains/SummaryCardsData.ts` (W, also the view-model all four map into), `…/topDomains/ActivityStat.ts`, `…/desktop/DesktopProcessSummaryDto.ts`, `…/android/AndroidAppSummaryDto.ts`, `…/unified/UnifiedSummaryItem.ts` · request: `SummaryCardsRequest.ts` + `Desktop/Android/UnifiedSummaryCardsRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `domain` · W | `string` | external client (web) | card title, aria-label, selection key (`ActivityDomainCard.vue:8-23,89`; `ActivitySummaryCards.vue:70-72`) | derived · spent | — |
| `processName` · D | `string` | external client (desktop) | — dropped by `toSummaryCardsData` (`DesktopActivityDashboard.vue:137-145`) | derived · unread | — |
| `productName` · D | `string` | external client (desktop) | → `SummaryCardsData.domain`: card title + selection key | derived · spent | — |
| `packageName` · A | `string` | external client (android) | — dropped (`AndroidActivityDashboard.vue:137-139`) | derived · unread | — |
| `appLabel` · A | `string` | external client (android) | → card title + selection key | derived · spent | — |
| `label` · U | `string` | server (merged identity) | → card title + selection key (`UnifiedActivityDashboard.vue:177-179`) | derived · spent | — |
| `totalSeconds` · W U (D A synthesized client-side) | `number` | server (U only; **the web backend `DomainSummaryDto` has no such member**) | — no read; cards render `active`/`background` stats | derived · unread | yes |
| `isNew` · W D A U | `boolean` | server | "NEW" chip in place of the % (`ActivityStatColumn.vue:11`) | derived · spent | — |
| `sources` · U | `ActivitySource[]` | server | source icons under the card's name, *Recorded by* tooltip and accessible name (`ActivityDomainCard`, OP20) | derived · spent | — |
| `ActivityStat.seconds` · W D A U | `number` | server | card time (`ActivityStatColumn.vue:51`), which column shows (`ActivityDomainCard.vue:85-86`), empty check (`ActivitySummaryCards.vue:125-126`) | derived · spent | yes |
| `ActivityStat.averageSeconds` · W D A U | `number \| null` | server (baseline average) | — no read outside the DTO | derived · unread | yes |
| `ActivityStat.percentChange` · W D A U | `number \| null` | server | ▲/▼ % text, colour, aria-label (`ActivityStatColumn.vue:53-74`) | derived · spent | — |

### Pie-chart family — `dto/response/pieChart/{PieChartData,DomainPieData,DayTotals}.ts` (W), `…/desktop/{DesktopPieChartResponse,DesktopProcessPieData,DesktopPieTotals}.ts`, `…/android/{AndroidPieChartResponse,AndroidAppPieData,AndroidPieTotals}.ts`, `…/unified/{UnifiedPieChartResponse,UnifiedActivityItem,UnifiedPieTotals}.ts` · request: `PieChartRequest.ts` + per-ledger twins
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `domain` · W | `string` | external client (web) | slice name, colour hash, selection, detail header (`ActivityPieChartSection.vue:110-133`, `ActivityDetailsPanel.vue:119`) | derived · spent | — |
| `processName` · D | `string` | external client (desktop) | slice colour hash (`DesktopPieChartSection.vue:161`); process-details lookup key (`:181`) | derived · spent | — |
| `productName` · D | `string` | external client (desktop) | slice label + selection key (`:159,175`) | derived · spent | — |
| `packageName` · A | `string` | external client (android) | colour hash (`AndroidPieChartSection.vue:149`), app-details lookup + refetch key (`:181,202`), panel *Package* row (`AndroidAppDetailsPanel.vue:30`) | derived · spent | — |
| `appLabel` · A | `string` | external client (android) | slice label, selection key, panel title (`AndroidPieChartSection.vue:147,160`; `AndroidAppDetailsPanel.vue:4`) | derived · spent | — |
| `label` · U | `string` | server | slice label, colour, selection, panel title (`UnifiedPieChartSection.vue:70,214-232`) | derived · spent | — |
| `activeSeconds` · W D U | `number` | server | *Active* view-mode slices; W/U detail panel rows (`ActivityDetailsPanel.vue:68`, `UnifiedPieChartSection.vue:88`) | derived · spent | yes |
| `backgroundSeconds` · W D U | `number` | server | *Background* slices; W/U detail rows | derived · spent | yes |
| `totalSeconds` · W D A U | `number` | server | *Total* slices (A always), detail totals, android share % (`AndroidAppDetailsPanel.vue:22,183`) | derived · spent | yes |
| `seconds` · A | `number` | server (set **equal** to `TotalSeconds`, `AndroidPieChartEndpoint.cs`) | — the pie reads `totalSeconds` | derived · unread | yes |
| `pages` · W | `string[]` | external client (web, URLs) | domain detail page list (`ActivityPieChartSection.vue:133` → `DomainDetailsList.vue`) | derived · spent | — |
| `entries` · W U | `number` | server | detail panel *Entries* (`ActivityDetailsPanel.vue:78`, `UnifiedPieChartSection.vue:100`) | derived · spent | — |
| `entries` · D | `number` | server | — the desktop panel shows the process-details response's `entries` instead | derived · unread | — |
| `windowTitles` · D | `string[]` | external client (desktop) | — no read. The detail panel lists the process-details response's own `windowTitles` | derived · unread | — |
| `sources` · U | `ActivitySource[]` | server | "Recorded by" chips (`UnifiedPieChartSection.vue:103-116`) | derived · spent | — |
| totals `totalSeconds` · W D A U | `number` | server | Day/Range Total row (`ActivityDetailsPanel.vue:24`, `DesktopPieChartSection.vue:76`, `AndroidPieChartSection.vue:79`, `UnifiedPieChartSection.vue:131`); android share denominator | derived · spent | yes |
| totals `activeSeconds` · W D U | `number` | server | totals panel *Active* row | derived · spent | yes |
| totals `backgroundSeconds` · W D U | `number` | server | totals panel *Background* row | derived · spent | yes |
| totals `totalDomains` · W | `number` | server | *Domains* row (`ActivityDetailsPanel.vue:42`) | derived · spent | — |
| totals `totalPages` · W | `number` | server | *Pages* row (`:47`) | derived · spent | — |
| totals `totalVisits` · W | `number \| undefined` | **nowhere: no backend member** (`DayTotalsResponse.cs` has `TotalEntries`, not `TotalVisits`) | *Visits* row, which always renders "-" (`ActivityDetailsPanel.vue:52`) | derived · spent | — |
| totals `totalProcesses` · D | `number` | server | *Processes* row (`DesktopPieChartSection.vue:91`) | derived · spent | — |
| totals `totalWindowTitles` · D | `number` | server | *Window titles* row (`:97`) | derived · spent | — |
| totals `totalEntries` · D | `number` | server | *Entries* row (`:101`) | derived · spent | — |
| totals `totalApps` · A | `number` | server | *Apps* row (`AndroidPieChartSection.vue:84`) | derived · spent | — |
| totals `totalSessions` · A U | `number` | server | *Sessions* row (`AndroidPieChartSection.vue:88`, `UnifiedPieChartSection.vue:154`) | derived · spent | — |
| totals `totalItems` · U | `number` | server | *Items* row (`UnifiedPieChartSection.vue:148`) | derived · spent | — |

### Detail-panel family — `dto/response/DomainDetailsResponse.ts` (W), `…/desktop/DesktopProcessDetailsResponse.ts` (D, + `DesktopWindowTitleStats`, `DesktopMonitorBreakdown`), `…/android/AndroidAppDetailsResponse.ts` (A, B23, + `AndroidAppDeviceStats`, `AndroidAppDayStats`) · request: GET query params (`processName`/`packageName`, envelope `from`/`to`, `windowStartMinutes`/`windowEndMinutes`, all derived from the dashboard range)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `DomainDetailsResponse.domain` · W | `string` | server | — **`getDomainDetails` has no caller** (`activityTrackingApi.ts:45-55`) | derived · unread | — |
| `DomainDetailsResponse.totalSeconds` · W | `number` | server | — (dead API) | derived · unread | yes |
| `DomainDetailsResponse.activeSeconds` · W | `number` | server | — (dead API) | derived · unread | yes |
| `DomainDetailsResponse.backgroundSeconds` · W | `number` | server | — (dead API) | derived · unread | yes |
| `DomainDetailsResponse.entries` · W | `number` | server | — (dead API) | derived · unread | — |
| `DomainDetailsResponse.pages` · W | `string[]` (actually built as `{url, seconds}` objects) | server | — (dead API) | derived · unread | — |
| `processName` · D | `string` | server | — the panel title uses `productName`; the lookup key comes from the pie row | derived · unread | — |
| `productName` · D | `string` | server | panel title (`DesktopProcessDetailsPanel.vue:4`) | derived · spent | — |
| `totalSeconds` · D | `number` | server | *Total* row (`:21`) | derived · spent | yes |
| `activeSeconds` · D | `number` | server | *Active* row (`:25`) | derived · spent | yes |
| `backgroundSeconds` · D | `number` | server | *Background* row (`:29`) | derived · spent | yes |
| `fullscreenSeconds` · D | `number` | external client (desktop) → server sum | *Fullscreen* row, only when > 0 (`:31-35`) | derived · spent | yes |
| `soundSeconds` · D | `number` | external client (desktop) → server sum | *Playing sound* row, only when > 0 (`:37-41`) | derived · spent | yes |
| `entries` · D | `number` | server | *Entries* row (`:45`) | derived · spent | — |
| `monitorBreakdown[].monitor` · D | `number` | external client (desktop) | *Monitor n* label, only when > 1 monitor (`:49-61`) | derived · spent | — |
| `monitorBreakdown[].activeSeconds` · D | `number` | server | monitor row duration (`:63`) | derived · spent | yes |
| `windowTitles[].windowTitle` · D | `string` | external client (desktop) | window-title list (`:84`) | derived · spent | — |
| `windowTitles[].totalSeconds` · D | `number` | server | window-title duration (`:86`) | derived · spent | yes |
| `windowTitles[].activeSeconds` · D | `number` | server | window-title split caption (OP20) | derived · spent | yes |
| `windowTitles[].backgroundSeconds` · D | `number` | server | window-title split caption (OP20) | derived · spent | yes |
| `windowTitles[].fullscreenSeconds` · D | `number` | server | window-title split caption (OP20; a share of the active part) | derived · spent | yes |
| `windowTitles[].soundSeconds` · D | `number` | server | window-title split caption (OP20; a share of the active part) | derived · spent | yes |
| `AndroidAppDetailsResponse.packageName` · A | `string` | server | — the panel shows the pie row's `packageName` (`AndroidAppDetailsPanel.vue:30`) | derived · unread | — |
| `AndroidAppDetailsResponse.appLabel` · A | `string` | server | — the title is the pie row's `appLabel` (`:4`) | derived · unread | — |
| `AndroidAppDetailsResponse.totalSeconds` · A | `number` | server | — the *Total* row is the pie row's (`:22`) | derived · unread | yes |
| `sessions` · A | `number` | server | *Sessions* row (`:64`) | derived · spent | — |
| `firstUseUtc` · A | `Date` | server | *First use* (`:76`) | derived · spent | yes |
| `lastUseUtc` · A | `Date` | server | *Last use* (`:80`) | derived · spent | yes |
| `meanSessionSeconds` · A | `number` | server | *Mean session* (`:68`) | derived · spent | yes |
| `longestSessionSeconds` · A | `number` | server | *Longest session* (`:72`) | derived · spent | yes |
| `devices[].deviceId` · A | `string` | external client (android sync) | device list, only when > 1 device (`:84-95`) | derived · spent | — |
| `devices[].totalSeconds` · A | `number` | server | device duration (`:97`) | derived · spent | yes |
| `devices[].sessions` · A | `number` | server | device session count (`:100`) | derived · spent | — |
| `days[].date` · A | `string` (YYYY-MM-DD, user clock) | server | by-day label, only when > 1 day (`:108-119`) | derived · spent | yes |
| `days[].totalSeconds` · A | `number` | server | day duration (`:121`) | derived · spent | yes |
| `days[].sessions` · A | `number` | server | day session count (`:125`) | derived · spent | — |

### Stacked-bars family — `dto/response/stackedBars/{ActivityWindow,WindowActivity}.ts` (W), `…/desktop/{DesktopStackedBarsWindow,DesktopWindowActivity}.ts`, `…/android/{AndroidStackedBarsWindow,AndroidWindowApp}.ts`, `…/unified/{UnifiedStackedBarsWindow,UnifiedWindowItem}.ts` · request: `StackedBarsRequest.ts` + per-ledger twins
All four are mapped into the client view-model `StackedBarsInputWindow` by each view's `toStackedBarsWindow`.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `windowStart` · W D A U | `Date` | server | column placement, day split, labels (`StackedBarsGrid.vue:107,391,425-499`) | derived · spent | yes |
| `windowEnd` · W D A U | `Date` | server | column width, label (`StackedBarsGrid.vue:107,445,474,499`) | derived · spent | yes |
| `domain` · W | `string` | external client (web) | segment name + colour (`ActivityDashboard.vue:132-135`) | derived · spent | — |
| `url` · W | `string?` | external client (web), "most visited URL in window" | segment tooltip (`StackedBarsTooltip.vue:17-21`) | derived · spent | — |
| `processName` · D | `string` | external client (desktop) | segment colour hash (`DesktopActivityDashboard.vue:155`) | derived · spent | — |
| `productName` · D | `string` | external client (desktop) | segment name (`:152`) | derived · spent | — |
| `packageName` · A | `string` | external client (android) | segment colour hash (`AndroidActivityDashboard.vue:149`) | derived · spent | — |
| `appLabel` · A | `string` | external client (android) | segment name (`:146`) | derived · spent | — |
| `label` · U | `string` | server | segment name + colour (`UnifiedActivityDashboard.vue:186-191`) | derived · spent | — |
| `activeSeconds` · W D U | `number` | server | solid segment height, tooltip (`StackedBarColumn.vue:28,76`; `StackedBarsChart.vue:221`) | derived · spent | yes |
| `backgroundSeconds` · W D U | `number` | server | hatched segment (`StackedBarColumn.vue:22`) | derived · spent | yes |
| `seconds` · A | `number` | server | → `activeSeconds` (android has no split; background hardcoded `0`, `AndroidActivityDashboard.vue:147-148`) | derived · spent | yes |
| `totalSeconds` · W D | `number` | server (`=> Active + Background`) | — the chart sums active + background itself (`StackedBarsChart.vue:231`) | derived · unread | yes |
| `sources` · U | `ActivitySource[]` | server | *Recorded by* row in the bar tooltip and the bar's accessible name; the *Other* column gets the union (`StackedBarsTooltip`, `StackedBarColumn`, OP20) | derived · spent | — |

### Timeline family — `dto/response/timeline/{TimelineResponse,TimelineSessionDto}.ts` (W, and the view-model U maps into), `…/desktop/{DesktopTimelineResponse,DesktopTimelineSession}.ts`, `…/android/{AndroidTimelineResponse,AndroidTimelineSession}.ts`, `…/unified/UnifiedTimelineResponse.ts` · request: `TimelineRequest.ts` + per-ledger twins (single day only)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `domain` · W | `string` | external client (web) | bar title, colour, legend, tooltip, aria-label (`TimelineSession.vue:6,49,98`; `ActivityTimeline.vue:199-213`; `TimelineTooltip.vue:6`) | derived · spent | — |
| `processName` · D | `string` | external client (desktop) | — dropped by `toTimelineSession` (`DesktopActivityDashboard.vue:160-169`). So the timeline hashes colour from `productName`, unlike the pie and bars, which hash `processName` | derived · unread | — |
| `productName` · D | `string` | external client (desktop) | → `domain` slot: bar title/colour/legend | derived · spent | — |
| `packageName` · A | `string` | external client (android) | — dropped (`AndroidActivityDashboard.vue:154-163`); colour hashes from `appLabel` here, unlike the pie | derived · unread | — |
| `appLabel` · A | `string` | external client (android) | → `domain` slot | derived · spent | — |
| `label` · U | `string` | server | → `domain` slot (`UnifiedTimelineResponse.ts` `sessionsFromObjects`), one lane per source | derived · spent | — |
| `startedAt` · W D A U | `Date` | external client → server session | bar position, stacking, tooltip *Start* (`timelineUtils.ts:46-123`, `TimelineTooltip.vue:10`) | derived · spent | yes |
| `endedAt` · W D A U | `Date` | external client → server session | bar extent, gaps, tooltip *End* (`TimelineTooltip.vue:14`) | derived · spent | yes |
| `durationSeconds` · W D A U | `number` | server | tooltip *Duration*, aria-label (`TimelineTooltip.vue:18`, `TimelineSession.vue:98`) | derived · spent | yes |
| `totalSeconds` · W D A U | `number` | server ("actual activity seconds") | tooltip *Active time* (`TimelineTooltip.vue:22`) | derived · spent | yes |
| `url` · W U | `string?` | external client (web) | tooltip URL line (`TimelineTooltip.vue:24-31`) | derived · spent | — |

### Focus-metrics family — `dto/response/focusMetrics/{FocusMetricsResponse,FocusBlock,FocusMetricsBaseline}.ts` (W D A U, one shape) · request: `FocusMetricsRequest.ts`, `unified/UnifiedFocusMetricsRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `sessionCount` | `number` | server | median-session detail line "Sessions: n" (`ActivityFocusStrip.vue:195`) | derived · spent | — |
| `daysWithActivity` | `number` | server | decides per-day rate and whether block/gap comparisons are shown (`:134,153`) | derived · spent | — |
| `switchCount` | `number` | server | *Switches* stat + per-day detail (`:159-166`) | derived · spent | — |
| `medianSessionSeconds` | `number` | server | *Typical session* stat (`:194`) | derived · spent | yes |
| `longestGapSeconds` | `number \| null` | server | *Longest break* stat (`:203-207`) | derived · spent | yes |
| `longestBlock.label` | `string` | server | *Longest unbroken block* detail line (`:180`) | derived · spent | — |
| `longestBlock.startedAt` | `Date` | server | — the strip never says when the block happened | derived · unread | yes |
| `longestBlock.endedAt` | `Date` | server | — | derived · unread | yes |
| `longestBlock.seconds` | `number` | server | *Longest unbroken block* value (`:179`) | derived · spent | yes |
| `baseline.switchCount` | `number \| null` | server | "typically n" line (`:167-170`) | derived · spent | — |
| `baseline.medianSessionSeconds` | `number \| null` | server | "typically …" line (`:196-199`) | derived · spent | yes |
| `baseline.longestBlockSeconds` | `number \| null` | server | "typically …", **single-day spans only** (`:181-184`) | derived · spent | yes |
| `baseline.longestGapSeconds` | `number \| null` | server | "typically …", single-day only (`:208-211`) | derived · spent | yes |

### Unified source breakdown — `dto/response/unified/UnifiedSourceBreakdown.ts` (U) · request: `UnifiedActivityRequest.ts` (`POST /activity-tracking/unified/sources`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `source` | `ActivitySource` | server | chip lookup key (`ActivitySourceFilter.vue:130`), displacement line source | derived · spent | — |
| `hasData` | `boolean` | server | chip "no data" figure (`:168-169`) | derived · spent | — |
| `countedSeconds` | `number` | server | chip figure (`:171`) | derived · spent | yes |
| `displacedSeconds` | `number` | server | overlap note total + per-source lines + chip tooltip (`:136-148,182-187`) | derived · spent | yes |
| `displacedTo` | `ActivitySource \| null` | server | "credited to X" in lines and tooltip (`:141-147,182-187`) | derived · spent | — |

### Dashboard query parameters (request only) — `ActivityRangeRequest.ts` + every `*Request.ts` under `dto/request/{,desktop/dashboard,android/dashboard,unified}/`
These are filters, not stored data. URL keys are from `useActivityDashboard.ts:115-121` and `UnifiedActivityDashboard.vue:151`. Also URL-synced but never sent: `view` (stacked bars / timeline) and `selected` (selection key, the **display name**). The timeline Single/Split toggle is a local ref only.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `dateFrom` | `string` | header presets / *Date from* (URL `date`) | same control | echo | yes |
| `dateTo` | `string` | preset / *Date to* (URL `dateTo`) | same control; decides range mode | echo | yes |
| `from` | `Time` | *Start* (URL `from`) | same control; detail-lookup `windowStartMinutes` | echo | yes |
| `to` | `Time` | duration h/min or end time (URL `to`) | same control; `windowEndMinutes` | echo | yes |
| `baseline` | `BaselineType \| null` | *Compared to* select (URL `baseline`) | same control | echo | yes |
| `windowMinutes` | `number` | stacked-bars window select (URL `window`) | same control | echo | yes |
| `sources` · U | `ActivitySource[]` | source chips (URL `sources`, omitted when all three) | same chips | echo | — |
| `topN` | `number?` | code constant `4` in every view | — | write-only | — |
| `focusGapSeconds` | `number` | code constant `FOCUS_BLOCK_TOLERANCE_SECONDS` | strip hint text uses the constant, not the request | write-only | yes |
| `minPercent` · W D A U | `number?` | **never set** (views fold the tail client-side) | — | write-only | — |
| `minSeconds` · D A (stacked bars, timeline) | `number?` | **never set** | — | write-only | yes |

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `ActivityFilterFormResponse.{text,id,roleId,categoryId}` (nested `activity` on a mapping rule) | activity | activityTracking → `component/desktop/desktopSettings/DesktopMappingsTable.vue:93`, `component/android/androidSettings/AndroidMappingsTable.vue:91`, `view/DesktopSettingsView.vue:160-163`, `view/AndroidSettingsView.vue:156-159` | Mappings tab *Activity* column; edit repopulates the activity/role/category pickers |
| activity catalogue (role/category/activity options) | activity | activityTracking → `*DistinctEntriesActions.vue`, `*MappingsFilter.vue` via `@/core/activity/component/ActivitySelectionForm.vue` (a **component** import, not `api/`/`dto/`) | mapping target picker + Mappings *Activity* filter |
| `firstDayOfWeek` (via `useUserPreferences`) | user | activityTracking → `composable/useActivityRangePresets.ts` | *This week* preset boundaries (sanctioned composable) |
| `StackedBarsInputWindow` shape + `StackedBarsChart` + `BaselineType` (component and types, not tracking data) | activityTracking | activityHistory → `view/HistorySummaryView.vue:132-178`, `view/HistoryDetailView.vue:202-250`, `composable/useHistoryDashboard.ts:2-3`; historyDashboard → `api/historyDashboardApi.ts:19`, `component/summaryCards/HistorySummaryCards.vue:90`, `component/HistoryInsightsColumn.vue:66`, two request DTOs | history renders its own data through tracking's chart and shares the baseline enum. No tracking *response* field is read outside the module |

## Server sends, client drops
Backend types are in `AdhdTimeOrganizer.Tracking/application/dto/response/`. Every per-source item implementing `IDashboardItem` serializes two computed members, **`Key`** (identifier) and **`Label`** (display name, falls back to `Key`). They were added so the client would stop hashing and selecting on six differently named fields (`IDashboardItem.cs`). The client parses neither, on any DTO.

| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `SummaryCardsData` (W) | `summaryCards/DomainSummaryDto` | `Key`, `Label` | Reverse gap: the client declares `totalSeconds`, but the backend has no such member, so it is `undefined` on W (unread anyway) |
| `DesktopProcessSummaryDto` | `desktop/dashboard/DesktopProcessSummaryDto` | `Key`, `Label` | client then also drops `processName` in the view mapper |
| `AndroidAppSummaryDto` | `android/dashboard/AndroidAppSummaryDto` | `Key`, `Label` | client then also drops `packageName` |
| `DomainPieData` | `pieChart/DomainPieDataDto` | `Key`, `Label` | |
| `DayTotals` | `pieChart/DayTotalsResponse` | `TotalEntries` | **The client reads `totalVisits`, which the backend does not have.** The *Visits* row is always "-", and the real count (`TotalEntries`, "count of window records") is dropped |
| `DesktopProcessPieData` | `desktop/dashboard/pieChart/DesktopPieDataDto` | `Key`, `Label` | kept but unread: `WindowTitles`, `Entries` |
| `AndroidAppPieData` | `android/dashboard/AndroidAppPieData` | `Key`, `Label` | kept but unread: `Seconds` (duplicate of `TotalSeconds`) |
| `WindowActivity` (W bars) | `stackedBars/WebExtensionStackedBarsEntry` | `Key`, `Label` | kept but unread: `TotalSeconds` |
| `DesktopWindowActivity` | `desktop/dashboard/DesktopStackedBarsEntry` | `Key`, `Label` | kept but unread: `TotalSeconds` |
| `AndroidWindowApp` | `android/dashboard/AndroidWindowApp` | `Key`, `Label` | |
| `TimelineSessionDto` (W) | `timeline/TimelineSession` | `Key`, `Label` | |
| `DesktopTimelineSession` | `desktop/dashboard/DesktopTimelineSession` | `Key`, `Label` | client then also drops `processName` |
| `AndroidTimelineSession` | `android/dashboard/AndroidTimelineSession` | `Key`, `Label` | client then also drops `packageName` |
| `DomainDetailsResponse` | `DomainDetailsResponse` + `PageVisitDto` | `Pages[].Path`, `Pages[].TotalSeconds`, `.ActiveSeconds`, `.BackgroundSeconds` | `fromJson` maps pages to `{url, seconds}`, but there is no `seconds` member, so per-page time is lost even at parse. Moot: the client never calls the endpoint |
| `DesktopPieTotals` | `DesktopDayTotalsResponse` | none | |
| `AndroidPieTotals` | `AndroidPieTotals` | none | |
| `ActivityStat` | `ActivityStatDto` / `AndroidActivityStatDto` | none | kept but unread: `AverageSeconds` |
| `DesktopProcessDetailsResponse` (+ title/monitor) | `DesktopProcessDetailsResponse`, `DesktopWindowTitleVisitDto`, `DesktopMonitorUsageDto` | none | kept but unread: `ProcessName` (per-title seconds spent by OP20) |
| `AndroidAppDetailsResponse` (+ device/day) | `AndroidAppDetailsResponse`, `AndroidDeviceUsageDto`, `AndroidDayUsageDto` | none | kept but unread: `PackageName`, `AppLabel`, `TotalSeconds` |
| `ActivityWindow` / `DesktopStackedBarsWindow` / `AndroidStackedBarsWindow` | `WebExtensionStackedBarsWindow` / `DesktopStackedBarsWindow` / `AndroidStackedBarsWindow` | none | |
| `TimelineResponse` / `DesktopTimelineResponse` / `AndroidTimelineResponse` | `WebExtensionTimelineResponse` / same / same | none | wrappers |
| `FocusMetricsResponse` / `FocusBlock` / `FocusMetricsBaseline` | `FocusMetricsResponse` / `FocusBlockDto` / `FocusBaselineDto` | none | kept but unread: `FocusBlock.StartedAt`/`EndedAt` |
| `UnifiedSummaryItem` / `UnifiedActivityItem` / `UnifiedPieTotals` / `UnifiedWindowItem` / `UnifiedStackedBarsWindow` / `UnifiedTimelineResponse` / `UnifiedSourceBreakdown` | `unified/UnifiedDashboardResponses.cs` (`UnifiedSummaryCardDto`, `UnifiedPieItemDto`, `UnifiedPieTotalsDto`, `UnifiedStackedBarsItemDto`, `UnifiedStackedBarsWindowDto`, `UnifiedTimelineResponse`, `UnifiedSourceStatusDto`) | none | none (`UnifiedSummaryCardDto.Sources`, `UnifiedStackedBarsItemDto.Sources` spent by OP20) |
| `TrackerDesktopDistinctEntriesResponse` / `TrackerAndroidDistinctEntriesResponse` | `TrackerDesktopDistinctEntriesResponse` / `AndroidDistinctEntriesResponse` | none | |
| `MappingCoverageResponse` | `MappingCoverageResponse` | none | |
| `TrackerDesktopMappingResponse` / `TrackerAndroidMappingResponse` | same names | none | kept but unread: `RoleId`, `CategoryId` (round-trip only) |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| O1 | tracking-settings | built and verified live (2026-09-24) | A mapping's `isActive` flag is filterable but not editable anywhere in this unit. Now an inline switch on both Mappings tables, re-sending the whole row as a full replace | `TrackerDesktopMapping.isActive`, `TrackerAndroidMapping.isActive` (and, as a side effect, `roleId`/`categoryId` started being parsed) |

`tracking-dashboards/findings.md` has no `Severity: opportunity` entry. `tracking-settings` B5 (distinct entries mark covered tuples, which is `coveredBy`) is filed as `bug`, though `_fix-queue.md` §103 re-graded it to `opportunity` before it landed. It is listed here only so the reconcile pass does not count it twice.

## Contradictions
1. **tracking-dashboards `usecase.md`, "`DayTotals.totalVisits` … is `undefined` in this environment's seed data … the field itself is just never populated here".** It is not populated anywhere, because the backend has no such member. `DayTotalsResponse.cs` carries `TotalSeconds`, `ActiveSeconds`, `BackgroundSeconds`, `TotalDomains`, `TotalPages`, `TotalEntries`. The client reads a phantom `totalVisits` (`dto/response/pieChart/DayTotals.ts:8,18`, rendered at `ActivityDetailsPanel.vue:52`) and drops the real `totalEntries`. `inventory.md`'s "Domains/Pages/Visits counts" row inherits the error.
2. **tracking-dashboards `usecase.md`, "Per-page detail (`DomainDetailsResponse`, the `pages` list behind a selected web domain) is fetched but only ever shown as a flat list".** `DomainDetailsResponse` is never fetched: `getDomainDetails` (`api/activityTrackingApi.ts:45-55`) has no caller. The page list on screen comes from the pie-chart response's `DomainPieData.pages` (`ActivityPieChartSection.vue:133`), a plain URL list with no per-page time. The richer per-page breakdown (`PageVisitDto.TotalSeconds/Active/Background/Path`) exists server-side and is unused. The dead `fromJson` would also lose it, since it reads `p.seconds`.
3. **tracking-dashboards `usecase.md` (Android view: "clicking a pie slice or a card highlights it but opens no per-app detail panel") and `inventory.md` (Android "Pie chart side panel … does not change when an app is selected").** Stale. B2 is fixed via B23: `AndroidPieChartSection.vue:61-70` mounts `AndroidAppDetailsPanel` on selection and fetches `GET …/android/app-details`.
4. **tracking-dashboards `usecase.md`: Desktop is "keyed on `processName`", Android "keyed on `packageName`".** The data is keyed that way server-side, but the client's selection, `?selected=` and details lookup are keyed on the display name: `productName` (`DesktopPieChartSection.vue:147,175`; inventory confirms `?selected=JetBrains+Rider`) and `appLabel` (`AndroidPieChartSection.vue:136,160`). The identifier is reached only through a display-name lookup. Summary cards and timeline sessions discard it entirely (`DesktopActivityDashboard.vue:137-169`, `AndroidActivityDashboard.vue:137-163`).
5. **tracking-settings `usecase.md`, "Data this unit captures but does not spend: `isActive` … this unit's UI has no control to change a rule's active state".** Stale. O1 built it: `DesktopMappingsTable.vue:26-38,201-216` and the android twin. Since that switch is also the only surface that shows it, the field is now `echo` rather than missing.
6. **tracking-settings `usecase.md`: "mark it ignored half is non-functional", "every edit-save fails", "confirming [delete] does not remove anything", and "only create, to-activity mode … actually works".** All stale. X2/X3/X4 are fixed and verified 2026-09-24. In code, *To ignored* sends `isIgnored: true` (`useMappingSettings.ts:58-60`), the update always carries `isActive` (`TrackerDesktopMappingRequest.ts:14`, `DesktopSettingsView.vue:153`), and delete calls `deleteEntity` (`DesktopMappingsTable.vue:185-192`).
7. **tracking-settings `inventory.md`: "Process/Product/Window filter text and match-type — plain component state, not URL query params", and the distinct-entries table lists only three columns.** Stale. B3/B24 put the whole filter plus `coverage` in the URL (`useDistinctEntriesUrlState.ts:73-143`), and the grid has a fourth *Rule* column from `coveredBy` (`DesktopDistinctEntriesTable.vue:21-26,63`).
8. **`glossary.md`, "Distinct entries — The raw observed processes/apps not yet mapped".** The grid lists **every** observed tuple. Its default `coverage` is `All`, and each row says which rule covers it (`dto/enum/MappingCoverage.ts:105-116`, `TrackerDesktopDistinctEntriesResponse.ts:10`). "Not yet mapped" is only the `?coverage=Uncovered` view. `tracking-settings/usecase.md` already says this correctly, so only the glossary is behind.

## Unsettled
None.
