# R4 · Settings views — dedup, and one real inconsistency

- **Scope:** desktop + android settings
- **Backend:** none (but item 3 may turn out to need a backend answer — see below)
- **Model / effort:** Sonnet 5, medium effort
- **Independent** of R2; can run in parallel with it (they touch disjoint files).

---

```
src/core/activityTracking/view/DesktopSettingsView.vue (160 lines) and AndroidSettingsView.vue
(153 lines) are parallel copies of one another, and the five component pairs under
component/desktop/desktopSettings/ and component/android/androidSettings/ mirror each other too
(DistinctEntriesActions, DistinctEntriesTable, EntriesFilterBar, MappingsFilter, MappingsTable).

Three things to do, in order.

1. FIX THE ROUTE-PARAM DESYNC.
   Both views declare `tableView` as a local ref and read the route param only once:

       onMounted(() => {
           tableView.value = router.currentRoute.value.params.tableView as 'distinctEntries' | 'mappings'
       })

   but the route is `/activity-tracking/{desktop,android}/settings/:tableView` and the VBtnToggle
   buttons carry `to="distinctEntries"` / `to="mappings"`, so clicking a tab navigates. Because the
   component is reused across that navigation, `onMounted` does not re-run: the URL and the rendered
   table can disagree, and browser back/forward does not change the table. Also, `onMounted` blindly
   casts whatever is in the URL, so a typo'd param yields a view that renders neither table.
   Drive `tableView` from the route reactively (a computed over `useRoute().params.tableView`, with
   a validated fallback to 'distinctEntries' for an unrecognised value) and have the toggle navigate
   rather than hold state. Note `edit()` currently sets `tableView.value` *and* calls `router.push` —
   once the route is the source of truth, the push alone is enough.

2. DEDUP.
   Extract the shared logic into `src/core/activityTracking/composable/useMappingSettings.ts`,
   generic over the filter-request type, the mapping-request type and the mapping-response type. It
   owns `filter`, `formData`, `mode`, `editedId`, `request`, `clear()` and `saved()`, taking the CRUD
   pair (`create`, `update`) and a filter factory from the caller — `useTrackerDesktopMappingCrud()`
   and `useTrackerAndroidMappingCrud()` in api/{desktop,android}ActivityTrackingApi.ts already have
   matching signatures. `edit()` stays in each view: the field lists genuinely differ
   (processName/productName/windowTitle vs appLabel/packageName, and the android one needs its
   `?? undefined` / `?? filter.value.x` fallbacks because its response fields are nullable).
   Also extract the dismissible hint `VAlert` into one component. Both views duplicate it verbatim
   along with the same localStorage dismiss mechanism under two different keys
   ('desktopSettingsHintDismissed' / 'androidSettingsHintDismissed'); keep the two keys, share the
   component.

3. RESOLVE AN INCONSISTENCY — investigate before changing anything.
   The two `saved()` implementations do not agree on what they send:
   - AndroidSettingsView sets `request.activityId`, `request.roleId` and `request.categoryId` from
     `formData` directly inside `saved()`.
   - DesktopSettingsView sets only `request.activityId`, and does it indirectly through a
     `watch(formData, ..., { deep: true })`. It never sends roleId or categoryId.
   Check TrackerDesktopMappingRequest vs TrackerAndroidMappingRequest to see whether the desktop
   request even carries those fields. If it does and they are simply never populated, that is a bug —
   fix it to match android and say so. If the desktop request has no such fields, the backend derives
   them from activityId and android is sending redundant data; leave both alone and record which it
   was in your summary. Do not guess: read the two request DTOs. If neither reading is conclusive
   from the frontend alone, leave the behaviour exactly as-is and write the open question to
   `prompts/activity-tracking/backend/R4-backend.md` — contract question only, no proposed schema.

Run `npm run type-check` and `npm run lint`. Manually verify: deep-linking to
/activity-tracking/desktop/settings/mappings opens the mappings tab, browser back returns to the
distinct-entries tab, and editing a mapping still round-trips its pattern into the filter bar.
```
