# A3 · One lookup table instead of three (activity)

- **Scope:** `../../../src/core/activity/component`, `../../../src/core/activity/view`
- **Backend:** none
- **Model / effort:** Sonnet 5, medium — the seam is obvious and stated below; the risk is only in not noticing the three places the tables genuinely differ.
- **Depends on:** A1 (item 5 rewrites the settings view's filter bindings)
- **Unblocks:** A4, A5 — both get three times cheaper once there is one table

---

```
src/core/activity/ has three table components that are the same component wearing different types:

  component/ActivityTable.vue                       (114 lines)
  component/activityRole/ActivityRoleTable.vue      (109 lines)
  component/activityCategory/ActivityCategoryTable.vue (108 lines)

Line for line they share: the identical BasicTable template invocation, the same five refs
(items, itemsLength, itemsPerPage=10, page=1, sortBy), the same deep watch on `props.filter` that
resets page to 1 and reloads, the same `loadItems` that hand-builds a FilteredTableRequest with a
locally computed `hasFilter`, and the same three handlers (openCreateDialog / onEdit / onDelete) that
open a dialog and reload on a truthy result.

They genuinely differ in exactly four things:

  1. the response class + entityName pair passed to useFetchFilteredTable and to the crud composable
  2. the TableColumn list
  3. the form component opened by the dialog, and its four dialog title / button label strings
  4. the extra cell slots — `role.name`/`category.name`/`isUnavoidable` on ActivityTable, `color` on
     the other two (and note RoleTable pipes the colour through `useColor().getBgColor` while
     CategoryTable binds `item.color` raw — that difference looks accidental; make them consistent
     and say which you chose)

Extract the shared 90%.

Preferred shape: a composable, not a wrapper component. `useLookupTable<TItem, TFilter>(config)` in
composable/useLookupTable.ts owning items / itemsLength / itemsPerPage / page / sortBy / loadItems /
the filter watch / onDelete, taking `{ responseClass, entityName, hasFilter }` where `hasFilter` is a
`(filter: TFilter) => boolean` predicate. Each of the three components keeps its own template — the
cell slots are what makes them different and hiding those behind a slot-forwarding wrapper trades one
kind of duplication for a worse one.

Two details worth getting right rather than copying forward:

- `hasFilter` is recomputed by hand in each loadItems (ActivityTable.vue:79-80 checks six fields;
  the other two check two). Pass it in as the predicate rather than inventing a generic
  "any non-null field" rule — ActivityFilter's `roleIds: number[] | null` needs a length check, not a
  null check, and a generic rule would get it wrong.
- All three call `loadItems()` after delete without awaiting the confirm — BasicTable owns the
  confirmation dialog (`_common/component/dataTable/BasicTable.vue:97-102`) and only emits `onDelete`
  after the user confirms, so this is correct as written. Preserve that; do not add a second confirm.

While you are in these files: they hardcode English column headers and dialog titles. **Leave them
hardcoded** — A4 localizes the module in one pass and splitting that work across two prompts produces
half-translated files. Just make sure the strings end up in exactly one place per table so A4 has a
single edit point.

The `role` column on ActivityCategoryTable (line 60, `new TableColumn('role', 'Role')`) reads
`Category.role`, which is typed `string | null` — a name, not an id or a Role. Note it in your summary;
if it renders blank in the running app, say so. Do not fix the DTO here.

Verify: /activity-settings on all three tabs — sorting, paging, filtering, create, edit, delete on
each. `npm run type-check` (baseline 72) and `npm run lint`.
```
