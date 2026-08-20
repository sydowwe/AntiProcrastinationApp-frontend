# R5 · Fix the cross-module import violation

- **Scope:** activityTracking + historyDashboard
- **Backend:** none
- **Model / effort:** Sonnet 5, low effort — three import sites and one file move
- **Independent.** Run any time. Do it before U3/U4 if those get scheduled, since both touch baselines.

---

```
`src/core/historyDashboard/` reaches into `src/core/activityTracking/component/`, which CLAUDE.md
forbids: cross-module imports are allowed only via another module's `api/` or `dto/`.

The offender is `BaselineOption.ts`, which lives at
  src/core/activityTracking/component/summaryCards/BaselineOption.ts
and exports both the `BaselineType` enum (an API contract value — 'last7days', 'last30days',
'sameWeekday', 'allTime') and a `BaselineOption` value class. Three files import it across the
module boundary:

  src/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue:88
  src/core/historyDashboard/dto/request/historyDetail/DetailSummaryCardsRequest.ts:4
  src/core/historyDashboard/dto/request/historySummary/HistorySummarySummaryCardsRequest.ts:4

It is also the wrong home on its own terms: `BaselineType` is a request enum consumed by
SummaryCardsRequest, DesktopSummaryCardsRequest and AndroidSummaryCardsRequest, not a component
concern.

Move it to `src/core/activityTracking/dto/enum/BaselineOption.ts` — alongside the two enums already
there (TrackerAndroidMappingTypeEnum, TrackerDesktopMappingTypeEnum) — and repoint every importer.
Search the whole of src/ for `BaselineOption` and `BaselineType`; there are more importers inside
activityTracking itself than the three listed above. That single move makes historyDashboard's
imports legal, since they then go through `dto/`.

Split the file only if `BaselineOption` (the class with the display `title`) turns out to be
referenced solely by activityTracking components — in that case leave the class in the module and
move only the enum. Check before deciding.

Do not change any enum value, do not touch historyDashboard beyond the import paths, and do not add
a migration-revision.md entry — nothing here concerns the framework submodule.

Run `npm run type-check` and `npm run lint`.
```
