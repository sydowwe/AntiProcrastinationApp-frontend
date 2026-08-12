# A7 · Stop refetching the same select options on every mount

- **Scope:** `src/core/activity/composable/`, `src/core/activity/store/` (new), consumers across 5 modules
- **Backend:** none required to ship; may emit one contract ask at the end (see below)
- **Model / effort:** **Opus 5**, high — cache invalidation, and the invalidation points are spread across five modules.
- **Depends on:** A1 (item 4 fixes the fetch's error handling first)
- **Unblocks:** A10

---

```
Role, category and activity select options are refetched from scratch by every component that needs
them, on every mount, with no sharing and no cache. There is no store in src/core/activity/ at all.

Where it happens:

  composable/UseActivitySelectOptions.ts — three `fetchSelectOptions` wrappers over
    /activity-role/all-options, /activity-category/all-options, /activity/all-options
  composable/ActivitySelectsComposition.ts:20 — `{source}/form-select-options`, the full
    role×category×priority×period combination matrix

Callers that fire on mount:

  component/NewActivityForm.vue:83-86           → roles + categories
  component/ActivitySelectOrQuickEditFormField.vue:110-114 → categories
  view/ActivitySettingsView.vue:120-123         → roles + categories
  composable/useActivitySelectionFormState.ts:62 → the whole combination matrix
  core/leisure/component/backlog/NewBacklogProfileForm.vue      → activities
  core/leisure/component/bucketList/NewBucketListProfileForm.vue → activities
  core/leisure/component/project/NewProjectProfileForm.vue      → activities

Concretely: opening a to-do item dialog that contains an ActivitySelectOrQuickEditFormField mounts an
ActivitySelectionForm inside it, and that dialog costs a categories fetch *and* a full combination
matrix fetch — every time it opens. Open five to-do items in a row, pay for it five times. The
combination matrix is the expensive one: it is O(activities) rows wide with four nested option objects
each, and it is fetched to populate dropdowns that change maybe weekly.

=== What to build ===

A Pinia setup store, `src/core/activity/store/activityOptionsStore.ts`, per CLAUDE.md's store
conventions. It owns:

  - roleOptions, categoryOptions, activityOptions (SelectOption[])
  - combinations, keyed by ActivityOptionsSource — the matrix differs per source
    ('activity' | 'activity-history' | 'task-planner'), so this is a Map, not a single array
  - per-key loading state and a per-key in-flight promise so N simultaneous mounts share one request
    (this is the important part — the dialog case mounts several consumers in the same tick)
  - `ensureLoaded(key)` returning the cached value or the in-flight promise
  - explicit invalidation (below)

Note on persistence: stores in this app persist to sessionStorage by default. **Set `persist: false`
here.** These are server-owned lookup values; a stale sessionStorage copy surviving a reload is worse
than a refetch, and the matrix is large.

=== Invalidation is the whole job ===

The cache must be dropped when the underlying data changes. Every one of these mutates roles,
categories or activities:

  component/ActivityForm.vue                        create + update activity
  component/activityRole/ActivityRoleForm.vue       create + update role
  component/activityCategory/ActivityCategoryForm.vue create + update category
  component/ActivityTable.vue onDelete              delete activity
  component/activityRole/ActivityRoleTable.vue onDelete
  component/activityCategory/ActivityCategoryTable.vue onDelete
  composable/quickCreateActivityComposition.ts      quickCreateActivity + quickEditActivity

That last one carries an existing `//TODO needs refresh to other activities that are using this
activity` (line 33) — this prompt is what closes it.

There are also three places that already patch the options list locally instead of refetching:
NewActivityForm.vue:102 and :112 push a new SelectOption after the role/category dialog returns, and
useActivitySelectionFormState.ts:110 pushes after an activity is created. Those local pushes are the
right instinct — keep the immediacy, but route it through the store so *all* consumers see it, not
just the one component that opened the dialog. Adding to the cache and invalidating the matrix is the
usual answer: the plain option lists can be patched optimistically, the combination matrix cannot
(a new activity changes which role/category combinations exist) and must be refetched.

Prefer a single `invalidate(kind)` called from the crud composables in api/ over sprinkling
invalidation calls into components — there are seven mutation sites today and there will be more.

=== Constraints ===

- Do not add a cross-module import to make this work. Leisure's three forms currently call
  `useActivitySelectOptions().fetchActivitySelectOptions` from the activity module's `composable/`
  directory — CLAUDE.md forbids reaching into another module's composable/ or store/. That import is
  already a violation and this prompt must not deepen it: expose whatever leisure needs through
  `src/core/activity/api/`, and note the pre-existing violation in migration-revision.md if you do not
  fix it here.
- Keep `useActivitySelectOptions()`'s signature as the public façade so consumers do not all have to
  change; back it with the store.

=== If you hit a contract question, write it up at the end ===

One is likely. A1 item 3 had to guess at the nullability of `{source}/form-select-options` — whether
`categoryOption`, `taskPriorityOption` and `routineTimePeriodOption` arrive as null or are omitted
entirely, and whether `roleOption` is ever absent. The two cases need different `fromJson` code and the
frontend cannot tell them apart from a sample response.

Caching makes that sharper, not softer: a cache keyed on a response shape you guessed at is a guess
with a longer half-life. If building this leaves you unsure, write
`prompts/activity/backend/A7-backend.md` as your last step — **contract only** (fields, types,
nullability, in the JSON casing the frontend reads; no entities, no EF, no migrations), following the
format of `prompts/activity-history/backend/B2-nullability-audit.md`, which is the same kind of ask.
Mostly a request for a written answer, not for code.

If you are not unsure, do not write the file. An empty backend ask costs a review cycle.

Verify: open the network tab, open a to-do item dialog three times — one combination-matrix request
total, not three. Create a role from inside NewActivityForm and confirm it appears in the settings
view's role tab without a reload. Delete an activity and confirm it disappears from a timer view's
picker. Then `npm run type-check` (baseline 72) and `npm run lint`.
```
