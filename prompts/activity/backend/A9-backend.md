# A9 · Backend ask — archive an activity, and merge duplicates

> **STATUS: shipped.** The backend delivered the contract as written — `PATCH /activity/{id}/archived`
> (idempotent, 204), `POST /activity/merge` (atomic, one transaction), the three fields on
> filtered-table rows and `GET /activity/{id}`, the tri-state `isArchived` filter, archived exclusion in
> the four pickers, and `?includeArchived=true` on all three `form-select-options` sources.
>
> Structurally, Core owned only 3 of ~15 activity FKs, so counting and repointing needed a new
> cross-slice seam — `IActivityReferenceSource`, seven implementations, one per owning slice, each
> stating its own collision rule.
>
> **Frontend adopted:** nothing had to change — the client was built against this contract — except the
> open question below, which was accepted and is now wired up: `includeArchived` flows
> `HistoryPanelFilter.vue` → `ActivitySelectionForm.vue` → `useActivitySelectionFormState.ts` →
> `activityOptionsStore.ensureCombinations(source, includeArchived)` →
> `fetchActivityFormSelectOptionCombinations`. The store now keys the matrix by
> `combinations:{source}:{active|withArchived}`, and `invalidateCombinations()` bumps both scopes —
> archiving moves an activity between them, so invalidating only one leaves the other stale.
>
> **Answers, for the record:**
>
> 1. **`DELETE` cascades, and has been silently destroying history.** `IsManyWithOneActivity()` defaults
>    to `Cascade` and no caller overrides it, so one delete took history rows, planner tasks (all three
>    shapes), to-do items, routines including their streaks, profiles, memory anchors, and — Cascade on
>    nullable columns — whole timer-preset rows. `ActivityEndpointTests:898` already documented it for
>    planner tasks. Since hard delete was the only lifecycle operation the UI offered, **accounts may
>    already have lost data this way.** The frontend now disables delete whenever `canDelete` is false,
>    and `useActivityCrud().deleteEntity` has exactly one call site (`ActivityTable.vue`), so the path is
>    fully gated going forward.
> 2. **References:** everything listed in the ask except two that do not exist — there is no `Alarm`
>    entity, and Reminders keys by string with no activity FK. Nothing is deliberately excluded, presets
>    included. `canDelete === (usageCount === 0)` holds with no divergence.
> 3. **Merge:** merged activities are deleted, not archived — the confirmation copy is correct. Duplicate
>    references collapse to one and a self-referential pairing is dropped, so `repointedCount` can come in
>    **below** the dialog's prediction. The dialog now says so.
> 4. **Cross-role/category merges** are permitted, survivor wins — rejecting them would block the
>    commonest real duplicate, one activity quick-created from two dialogs that defaulted to different
>    roles.
> 5. **An archived survivor** is allowed and stays archived.
> 6. **Quick-create does not resurrect** — a new active activity. *But see the unique index below; as
>    written this answer is not reachable.*
> 7. **`usageCount` is sortable**, computed in SQL inside the grid projection: one correlated count over
>    a `UNION ALL` per row, bounded by the 200-row page cap. The column stays sortable client-side.
>
> **Route note answered:** clone is `POST /activity/{id}/clone` and overwrite is
> `PUT /activity/{id}/quick-edit` — neither is `PATCH`, so `PATCH /activity/{id}/archived` is unclaimed.
> (Note the frontend still builds `PATCH /activity/{id}/{QuickEditMode}` with the PascalCase segments
> `Overwrite` / `Clone` — that is a separate drift, tracked below.)
>
> **`sortBy` checked, no change needed.** `VSortItem { key, order }` is Vuetify's client-side shape and
> never reaches the wire: `FilteredTableRequest` maps it through `SortByRequest.map()`, which emits
> `{ key, isDesc }`. The client already sends what the server binds.
>
> **Three things the answers create — see "Follow-ups" at the end of this file.**

**Contract and business rules only.** Endpoints, request shapes, response fields with types and
nullability in the JSON casing the frontend reads, plus the rules the client genuinely cannot decide.
Nothing here is a statement about entities, columns, EF configuration, migrations, indexes, or whether
"archived" is a flag or a soft delete. The .NET solution is not in this repo.

**This one is blocking.** The frontend half of A9 is built and merged, and every part of it is dead
until these endpoints exist: the archive row action, the Active/Archived/All filter, the usage column
and the merge dialog all call routes that do not answer yet. Unlike A8, there is no working fallback —
there is no client-side way to archive anything.

## The problem

### 1. There is no way to retire an activity

An activity is referenced by activity-history records, to-do items, planner tasks, tracking mappings
and leisure profiles. The only lifecycle operation the UI has ever offered is hard delete
(`ActivityTable.vue` → `deleteEntity(item.id)`), and **the frontend cannot tell what that does** to a
year of history pointing at it. It either cascades, orphans, or 409s; the user finds out from a generic
error snackbar, or does not find out at all.

So nobody deletes anything, the activity list grows monotonically, and every dropdown in the app pays
for it — including the combination matrix, which is O(activities) rows with four nested option objects
and is fetched on the first mount of every selection form.

### 2. The app manufactures duplicates and has no way to clean them up

Three mechanisms create near-identical activities with no uniqueness check anywhere: quick-create from
four dialogs, quick-edit in **Clone** mode (which ships a `copySuffix: ' - kópia'` locale key for the
purpose), and inline create from the `+` on the activity picker. "Reading", "reading", "Reading " and
"Reading - kópia" are four activities with four separate history trails, and every dashboard groups by
name — the same collision `prompts/activity-history/backend/B1-group-ids.md` describes one module over.

## The ask

### 1. Three fields on the activity response

| Field        | Type    | Nullable | Meaning                                                                        |
| ------------ | ------- | -------- | ------------------------------------------------------------------------------ |
| `isArchived` | boolean | no       | Retired: keeps all its history, disappears from every picker                    |
| `usageCount` | integer | no       | How many rows, across **every** referencing entity type, point at this activity |
| `canDelete`  | boolean | no       | A hard delete would succeed — i.e. nothing references it                        |

Required on the rows of `POST /activity/filtered-table` and on `GET /activity/{id}`.

**Not required anywhere else.** The nested `activity` payload carried by planner tasks, to-do items,
history rows, timer presets and tracking mappings can keep its current shape —
`Activity.fromJson` defaults the three to `false / 0 / false`, chosen so a missing value never offers a
delete the server would refuse. If they are cheap to include everywhere, include them; if they cost a
join per row, leave them out of the nested payloads.

`usageCount` and `canDelete` are two views of the same count (`canDelete === (usageCount === 0)` unless
some reference type is deliberately not counted). Two fields rather than one because the UI uses them
for different things and the rule for "blocks deletion" may not be the rule for "worth showing" — say
so if they diverge.

### 2. Archive and restore

```
PATCH /activity/{id}/archived
{ "isArchived": true }
```

- **Idempotent.** Archiving an already-archived activity is a success, not a conflict — the row action
  can be double-clicked and there is no useful error to show for it.
- One endpoint for both directions rather than `/archive` + `/unarchive`, so there is one rule and one
  handler.
- Response body unused; `204` is fine.
- Route note: `PATCH /activity/{id}/Overwrite` and `PATCH /activity/{id}/Clone` already exist. If those
  are two literal routes there is no ambiguity. If they are one route with a `{mode}` parameter, either
  the literal `archived` segment must take precedence or this endpoint needs a different shape — say
  which and it will be changed here.

Archiving is **not** part of `PUT /activity/{id}`. The frontend never sends `isArchived` in
`ActivityRequest`, and a newly created activity is always active.

### 3. Merge

```
POST /activity/merge
{ "survivorId": 12, "mergedIds": [45, 78] }
```

`mergedIds` never contains `survivorId` — the dialog strips it — and is never empty.

Response:

| Field            | Type    | Nullable | Meaning                                                              |
| ---------------- | ------- | -------- | -------------------------------------------------------------------- |
| `survivorId`     | integer | no       | Echo of the request                                                  |
| `mergedCount`    | integer | no       | How many activities were deleted                                     |
| `repointedCount` | integer | no       | How many rows, across every reference type, now point at the survivor |

The two counts are what the success snackbar says. The dialog has already predicted them from the
`usageCount`s on screen and said so in the confirmation, so they are worth returning even if they are
just a row count — a table that is minutes old is what the prediction came from.

**Must be atomic.** A partially applied merge leaves history split across an activity that no longer
exists in any picker and one that does, with no way for the user to tell or to finish the job.

### 4. `isArchived` on the activity filter

`POST /activity/filtered-table` — one more field on the filter object:

| Field        | Type            | Meaning                                    |
| ------------ | --------------- | ------------------------------------------- |
| `isArchived` | boolean \| null | `false` = active only, `true` = archived only, `null` = both |

**And the rule that goes with it:** when the request carries no filter object at all (the frontend
sends `hasFilter: false` and a null filter for the unfiltered view), the server must behave as
`isArchived: false`. The settings table's default view relies on this — it is what lets the default
view keep sending exactly the request it sends today.

### 5. Which endpoints exclude archived rows

This is the part that is easy to half-do. An archived activity leaking back into one dropdown makes
the whole feature pointless, and the client cannot patch over it — filtering client-side would mean
remembering to do it in five places forever.

| Endpoint                                      | Behaviour                                                     |
| --------------------------------------------- | ------------------------------------------------------------- |
| `GET /activity/all-options`                    | **Excludes archived.** Feeds the leisure activity autocomplete, both timer-preset dialogs, and the store's shared activity list |
| `GET /activity/form-select-options`            | **Excludes archived.** The `ALL` source behind every `ActivitySelectionForm` |
| `GET /activity-history/form-select-options`    | **Excludes archived** — but see the open question below       |
| `GET /planner-task/form-select-options`        | **Excludes archived.**                                        |
| `POST /activity/filtered-table`                | Honours the filter field above; defaults to active only        |
| `GET /activity/{id}`                           | **Unaffected** — returns archived activities normally          |
| `GET /activity-role/all-options`, `GET /activity-category/all-options` | **Unaffected.** Roles and categories are not archivable (deliberate — they number in the tens). A role whose activities are all archived still appears in the role dropdown; that is accepted |
| Everything that reads a *record* — history lists and dashboards, to-do items, planner tasks and templates, tracking mappings, leisure profiles | **Unaffected.** They keep resolving the activity and keep displaying its name |

The one-line version of the rule: **only pickers exclude archived activities.** Anything that displays
an existing record keeps working exactly as it does now.

## Business rules the backend has to state

These are the substance of this ask. None of them are inferable from the frontend, and several change
what the UI does.

1. **What counts as a reference for `usageCount` and `canDelete`?** List the entity types. The frontend
   assumes: activity-history records, to-do items (normal and routine), planner tasks (normal, repeating
   and template), desktop/android/web tracking mappings, leisure backlog/project rows, timer presets and
   pomodoro presets, alarms. If any of those is deliberately excluded from the count — presets, say,
   because they are cheap to recreate — the UI needs to know, because "Records: 0" next to a delete
   button is a promise.
2. **What does `DELETE /activity/{id}` do *today* to a referenced activity?** Cascade, orphan, or 409.
   This is the single unknown that started the whole prompt. The frontend now disables delete whenever
   `canDelete` is false, so the answer mostly stops mattering — but if it currently cascades, then
   accounts have been silently losing history to it and that is worth knowing before this ships.
3. **Merge semantics.** Which reference types repoint (all of the above, presumably), whether the
   merged-away activities are **deleted or archived** (the frontend says "the other activities are gone"
   in the confirmation and expects them to disappear from the table entirely — if they are archived
   instead, say so and the copy changes), and what happens when **two of the merged activities are
   referenced by the same row** — the same to-do item pointing at both "Reading" and "reading". The
   frontend expects that to collapse to one reference, not to fail and not to duplicate the row.
4. **Is merging permitted across roles and categories, and which wins?** The frontend permits it and
   shows each candidate's role and category in the dialog so the choice is visible. It assumes the
   **survivor's** role and category win and the merged-away rows' placement is simply discarded. Confirm,
   or reject the cross-role case with a 4xx and the UI will pre-validate.
5. **Can the survivor be archived?** The frontend does not prevent selecting an archived survivor in the
   All view. Either it is allowed (and the merged history lands on an activity that is invisible in every
   picker — defensible, since the user asked for it) or it is rejected; say which.
6. **Does quick-create resurrect an archived activity?** Quick-create posts a name and a role. If a user
   archives "Reading" and then quick-creates "Reading" from a to-do dialog, the frontend expects a new,
   active activity — there is deliberately **no** duplicate check at create time (see "Deliberately not
   in scope"). If the server would rather un-archive and return the existing one, that is a behaviour
   change the UI has to explain, so it needs to be stated rather than discovered.
7. **Is `usageCount` sortable?** The settings table declares the column sortable, so `sortBy` may arrive
   as `[{ key: "usageCount", order: "asc" }]`. Sorting by it is how a user finds the unused rows worth
   archiving, so it is wanted — but if it costs a correlated subquery per row, push back and the column
   will be marked non-sortable instead. It must not 400.

## Failure responses

The UI has to distinguish these, so they need distinct statuses rather than a generic 400.

| Case                                                       | Expected                                    |
| ---------------------------------------------------------- | ------------------------------------------- |
| `PATCH .../archived` on an already-archived activity        | `204` — idempotent, not an error            |
| `PATCH .../archived` with an unknown id                     | `404`                                       |
| `POST /activity/merge` with an unknown `survivorId`         | `404`                                       |
| `POST /activity/merge` with an unknown id in `mergedIds`    | `404` (the whole merge fails; no partial)   |
| `POST /activity/merge` with `mergedIds` empty               | `400`                                       |
| `POST /activity/merge` with `survivorId` inside `mergedIds` | `400` — the client strips it, so this is a bug, not a user state |
| `POST /activity/merge` across users (any id not the caller's) | `404`, not `403` — do not confirm the row exists |
| `DELETE /activity/{id}` on a referenced activity             | Whatever it does today (question 2). The UI no longer offers it, so this is now unreachable through the settings table |

A localized message body is not needed for any of these — the axios interceptor maps status codes to
snackbars — except the merge failures, which the user hits after confirming an irreversible action and
where "something went wrong" is a bad answer. A short `detail` string on the 400s would be used.

## What the frontend does with each field

So the backend can push back on anything costing more than it is worth.

| Field / endpoint       | Used by                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `isArchived` (row)     | Dims the row and renders an archive icon next to the name; picks the archive vs. restore row action |
| `usageCount` (row)     | The **Records** column; the per-candidate line in the merge dialog; the predicted "and N records" in the merge confirmation; the default survivor (highest wins) |
| `canDelete` (row)      | Enables the delete row action. When false the button is disabled and its tooltip says why — the point is never to offer an action that will 409 |
| `isArchived` (filter)  | The Active / Archived / All toggle, mirrored into the URL as `?archived=archived\|all` |
| `PATCH .../archived`   | The archive/restore row action. Invalidates the whole activity option cache, so every mounted picker refetches |
| `POST /activity/merge` | The merge dialog. Also invalidates the option cache, including the per-source combination matrix |
| `mergedCount`, `repointedCount` | The success snackbar only                                                  |

If `usageCount` turns out to be expensive on the filtered-table query, the fallback the frontend can
live with is: `canDelete` everywhere (it is the one that gates a destructive action) and `usageCount`
only on `GET /activity/{id}`, with the merge dialog fetching its candidates one by one. Say so and it
will be built that way — it is a worse dialog, not a broken one.

## Follow-ups the answers create

Written after the backend landed. None of these block A9; the first is a live defect.

### 1. The unique index on `(UserId, Name)` makes answer 6 unreachable

`ActivityConfiguration` already carries a unique index on `(UserId, Name)` — it predates this work. Read
together with "quick-create does not resurrect", that is a contradiction rather than a rule:

- The user archives "Reading" — which is now the **recommended** replacement for deleting it.
- Later they quick-create "Reading" from a to-do dialog, or type it into the picker's inline create.
- The insert violates the index. The user gets the interceptor's generic error snackbar and no activity,
  with nothing on screen explaining why, because the colliding row is invisible in every picker by
  design.

"Archive it, then create it again later" is the normal path this feature was built to enable, so this is
reachable rather than theoretical. Two possible answers:

- **Filter the index to active rows.** Create then behaves as answer 6 says. The cost is that
  **unarchive** can now collide (restoring "Reading" while an active "Reading" exists) and needs a
  distinct status — the frontend will render a specific message for it, but needs to know the code and
  whether the body carries the colliding id.
- **Keep the index global** and return a distinct status on the create, carrying enough for the client to
  say "an archived activity called *Reading* already exists" and offer to restore it. More UI, better
  answer.

Either is fine; the current state is neither. The frontend takes no action until this is decided —
guessing at a status code is how you end up rendering the wrong message for a real conflict.

### 2. `copySuffix` is referenced by no frontend code

The backend's note says Clone mode survives the unique index "only because the ` - kópia` suffix
differs". `activities.copySuffix` exists in both locale files and **nothing reads it** — grep finds only
the two `_locales` entries. `useQuickCreateActivity.quickEditActivity` sends
`QuickEditActivityRequest(name, text, categoryId)` with the name the user typed, unmodified.

So either the server appends the suffix (in which case the locale key is dead and should be deleted, and
a second clone of the same activity still collides), or nothing appends it and **cloning without
renaming violates the index today**. Worth one look at the clone handler; whichever it is, it is a
one-line fix on one side or the other.

### 3. The quick-edit routes have drifted

The frontend calls `PATCH /activity/{id}/Overwrite` and `PATCH /activity/{id}/Clone`
(`QuickEditMode`'s values are documented in-source as "the PascalCase path segment", and
`prompts/activity/backend/A8-backend.md` recorded the same). The backend now reports
`POST /activity/{id}/clone` and `PUT /activity/{id}/quick-edit`. One of the two is stale. If the routes
really did move, quick-edit and clone are broken from four dialogs right now and the fix is client-side
— confirm the current routes and it will be changed.

## One open question we could not settle client-side — ✅ answered and wired up

`GET /activity-history/form-select-options` feeds `HistoryPanelFilter.vue` — which is not a form for
creating a record, it is the **filter over history**. Excluding archived activities there means that
archiving an activity silently removes the user's ability to filter their own history by it, while the
records themselves stay visible and keep showing the name. That is a bad trade, and it is the one place
where "only pickers exclude archived" cuts against itself.

The suggested shape, not built yet:

```
GET /{source}/form-select-options?includeArchived=true
```

Default `false`, so every existing call site keeps its current behaviour and the record-creating forms
need no change. Filter surfaces pass `true`.

**Accepted and built on all three sources, and the frontend has adopted it** — `HistoryPanelFilter.vue`
is the only caller passing `true`, and `ActivitySelectionForm`'s `includeArchived` prop documents why
nothing that creates or edits a record may turn it on.

## Deliberately not asked for

- **Uniqueness or "did you mean?" at create time.** Quick-create exists precisely so the user does not
  have to stop and think; interrupting it converts a two-second action into a decision. Merge cleans up
  after the fact instead. Please do not add a uniqueness constraint on activity names — it would break
  Clone mode, which is a supported operation.
- **Undo for merge.** It would require retaining the pre-merge mapping. The confirmation dialog is the
  safeguard, and it is unconditional — it ignores the user's `askBeforeDelete` preference.
- **Archiving roles and categories.** The same argument would apply, but they number in the tens, not
  the hundreds.
- **A server-side "last used" timestamp.** Picker recency is a per-device UI preference and lives in
  localStorage (A10).
