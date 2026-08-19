# L2 · Correctness and type-safety pass

- **Scope:** module-wide — one real user-facing bug, one architecture violation, several type escapes
- **Backend:** no
- **Model / effort:** Sonnet 5, medium effort — every item is small, located and independently verifiable

---

```
A defect pass over src/core/leisure/. Six items, all confirmed present. Fix them, do not redesign
anything, and do not fold in unrelated cleanup.

1. RATING SCALE IS INCONSISTENT — this is a real bug, not a nit.
   component/memoryAnchor/NewMemoryAnchorForm.vue takes rating on a 1–10 scale (:min="1"
   :max="10"). component/memoryAnchor/MemoryAnchorTable.vue renders "{{ item.rating }}/10" with
   ratingColor() thresholds at >=8 and >=5, also a 10-scale. But view/MemoryAnchorsView.vue's
   minRating filter is :min="1" :max="5" — so a user cannot filter for anything above 5, i.e. the
   entire top half of the scale is unreachable. Make the filter 1–10. Then grep the module for any
   other 1–5 assumption about rating and confirm there is none.
   (Do NOT "fix" comfortZoneStep, which is a genuine 1–5 scale — ComfortZoneStepper.vue renders
   five buttons and BucketListTable renders "/5". That one is consistent.)

2. CROSS-MODULE IMPORT VIOLATION — three files import another module's composable/:
   component/backlog/NewBacklogProfileForm.vue:89
   component/bucketList/NewBucketListProfileForm.vue:47
   component/project/NewProjectProfileForm.vue:67
   all do `import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'`.
   CLAUDE.md allows cross-module imports ONLY via another module's api/ or dto/ — never its
   component/, composable/ or store/. Read what that composable actually does; if it is a thin
   wrapper over an activity api/ call, import the api directly from all three call sites (a local
   leisure-side composable wrapping the activity api/ is fine). If it carries real logic that
   belongs to both modules, do not fork it into leisure — add a migration-revision.md entry
   describing the gap and say so in your summary instead.

3. TYPE ESCAPES IN BacklogTable.vue (lines ~71–80). lookupColumns/enumColumns are string arrays
   driving dynamic slots, read back through
   `(item as unknown as Record<string, LookupResponse>)[col]`. Replace with something typed —
   `keyof ActivityBacklogProfile` for the column arrays, or just write the five slots out
   explicitly like ProjectTable.vue and BucketListTable.vue already do. The explicit version is
   longer and better; the double cast defeats the DTO entirely.

4. `as number | null` CASTS IN TEMPLATES — BucketListView.vue:31,38 / MemoryAnchorsView.vue:18,26,34
   / ProjectsView.vue:18,31 / NewBacklogProfileForm.vue:58 all cast a v-model inline. That means
   the filter/request DTO field types disagree with what VNumberInput and VSelect accept. Fix the
   DTO field types (dto/request/*Filter.ts and *Request.ts) so the casts can be deleted. If a cast
   genuinely cannot go away because of a Vuetify type, leave that ONE and comment why.

5. `useEntityCommand<LookupResponse, any, any>` in api/activityLookupApi.ts:12. The lookup
   endpoints share one shape; give them a real request type in dto/request/ instead of `any, any`.

6. MEMORY ANCHOR PERIOD FORMATTING — MemoryAnchorTable.vue:83 `formatPeriod(rowId: number)` takes
   the row's id and then does `items.value.find(i => i.id === rowId)` to recover a row the slot
   already has in scope. Pass the row. Also note MemoryAnchor already exposes a `periodKey` getter
   (anchorYear * 100 + anchorMonth) which the column key references but the formatter ignores —
   make the two agree, or drop the getter if nothing needs it.

Not in scope for this prompt (other prompts own them): table boilerplate (L1), duplicated filter
selects and the duplicated 1/3/5 colour ramp (L3).

Run `npm run type-check` (baseline 72 errors, all in src/core — the count should go DOWN, never up,
and src/_common must stay clean) and `npm run lint` (0 errors).
```
