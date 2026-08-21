# H2 · Delete the unreachable filter and alarm code

- **Scope:** activityHistory
- **Backend:** none
- **Model / effort:** Sonnet 5, low — mechanical, but every deletion must be verified first.
- **Depends on:** nothing (run alongside H1)
- **Unblocks:** H3, H5 (less surface to refactor and localize)

---

```
Delete the unreachable code in src/core/activityHistory/. Roughly 500 lines of it are a
filter-panel feature that no route or component renders any more, plus an alarm API with no callers.

VERIFY EACH ONE BEFORE DELETING. Search the whole of src/ (including src/_common, which imports
nothing from src/core but check anyway) for the symbol AND the filename, and confirm the only hits
are the files listed as its consumers below. If anything else references it, stop and report it
instead of deleting.

Candidates, with the consumers found:

  component/HistoryPanelFilter.vue        (279 lines) — no importers at all
  component/HistoryCurrentFilterInfo.vue  (155 lines) — only HistoryPanelFilter.vue
  dto/request/ActivityHistoryFilter.ts     (36 lines) — only those two files
  component/RecordActivityToHistoryForm.vue (35 lines) — no importers at all
  dto/response/HistoryGroupedByDate.ts     (16 lines) — no importers at all
  api/alarmApi.ts                          (28 lines) — no importers at all
  dto/request/AlarmRequest.ts              (11 lines) — only alarmApi.ts
  dto/response/Alarm.ts                    (27 lines) — CHECK THIS ONE CAREFULLY. If its only
                                            consumer is alarmApi.ts, it goes too; if the scheduler or
                                            notifications framework module uses it, keep it.

Also check dto/request/ActivityDateRangeRequest.ts and dto/request/ActivityDateRangeTypeEnum.ts —
the enum is used by HistorySummaryView and HistoryDateRangeSelector and must stay; verify whether
ActivityDateRangeRequest itself still has a caller.

After deleting:

1. Grep the two locale files (src/core/activityHistory/_locales/activityHistory.{sk,en}.ts) and
   src/locales/common.{sk,en}.ts for keys whose only consumers were the deleted files, and remove
   those keys. The activityHistory locale file currently has exactly three keys
   (recordActivityToHistory, lengthNotSet, toHistory) — check each.
2. Grep src/app/nav/navItems.ts and src/core/activityHistory/activityHistory.routes.ts for any entry
   pointing at a deleted file.
3. Report what you deleted, with line counts, and anything you decided to keep and why.

Do NOT delete anything merely because it looks unused without running the search. Do not delete
Alarm-related backend endpoints or DTOs used by the notifications module.

Verify: `npm run type-check` (baseline is 72 errors, all in src/core — the count should go down or
stay flat, never up) and `npm run lint` (must stay at 0 errors). Load every route in
activityHistory.routes.ts.
```
