# A9 · Archive instead of delete, and merge duplicates

- **Scope:** `../../../src/core/activity`
- **Backend:** yes, substantially — **this prompt designs the contract and writes it up itself**. The frontend cannot go live until the server side lands, so the
  deliverable is a working frontend against the contract you define, plus the contract.
- **Model / effort:** **Opus 5**, high — product design with an implementation attached, and the destructive path has to be right.
- **Depends on:** A3 (the table it changes), A7 (cache invalidation on merge)
- **Unblocks:** nothing

---

```
Two related problems the module has today, both created by its own design.

=== Problem 1: activities accumulate and there is no way to retire one ===

An activity is referenced by activity history records, to-do items, planner tasks, tracking mappings
and leisure profiles. The only lifecycle operation the UI offers is hard delete
(ActivityTable.vue onDelete → `deleteEntity(item.id)`), and what that does to a year of history
records pointing at it is not knowable from the frontend — it either cascades, orphans, or 409s. The
user cannot tell which, because the failure path is a generic snackbar.

So in practice nobody deletes anything, and the activity picker grows monotonically. Every dropdown in
the app pays for it.

**Ask:** archive. An archived activity keeps all its history, disappears from every picker, and stays
visible in the settings table behind a filter. Unarchiving restores it. Hard delete stays, but only
for activities with no references — and the backend tells the frontend which those are rather than the
frontend guessing.

=== Problem 2: the app manufactures duplicates ===

Three mechanisms create near-identical activities with no uniqueness check anywhere:

  - quick-create from four different dialogs (todoList ×2, dayPlanner ×2) — types a name, gets an
    activity, no "did you mean the existing one?"
  - quick-edit in **Clone** mode (quickCreateActivityComposition.ts:34) — explicitly duplicates, and
    the locale even ships a `copySuffix: ' - kópia'` key for it
  - inline create from the '+' button on the activity picker (ActivitySelectionForm.vue:168)

"Reading", "reading", "Reading " and "Reading - kópia" are four separate activities with four separate
history trails, and every dashboard groups by name (see prompts/activity-history/backend/B1-group-ids.md
— the same collision, one module over).

**Ask:** merge. Pick two or more activities in the settings table, choose the survivor, and every
reference — history, to-do items, planner tasks, tracking mappings — repoints to it. The others are
deleted.

=== Frontend work ===

You define the contract as you build — the field and endpoint names below are a starting point, not a
handed-down spec. Whatever you settle on, write it up at the end (see the last section).

1. **Activity DTO + filter**: `isArchived: boolean`, `usageCount: number`, `canDelete: boolean` on
   Activity; `isArchived: boolean | null` on ActivityFilter (null = both, the default view shows
   unarchived only).
2. **Settings table**: an archived-state toggle in the filter bar (Active / Archived / All), a
   usage-count column, archive/unarchive as row actions. Delete stays a row action but is disabled
   with an explanatory tooltip when `canDelete` is false — do not offer an action that will 409.
   Archived rows render dimmed.
3. **Merge flow**: multi-select in the table → "Merge…" action → a dialog listing the selected
   activities with their usage counts, radio-select the survivor, and a confirmation that states
   plainly what will happen ("3 activities and 412 history records will be merged into 'Reading'.
   This cannot be undone."). Use `useDialog().confirm` for the final step. This is irreversible —
   it gets a confirmation regardless of the user's `askBeforeDelete` preference.
4. **Every picker filters archived out.** This is the part that is easy to half-do: the combination
   matrix (`{source}/form-select-options`), the three `all-options` endpoints, and the leisure forms
   all feed pickers. Excluding archived rows belongs server-side on all of them — an archived activity
   leaking back into one dropdown makes the whole feature pointless, and client-side filtering means
   remembering to do it in five places forever. Enumerate every one of those endpoints in the contract
   ask, and verify each in the running app once the server side lands.
5. **Cache invalidation**: archive, unarchive and merge all invalidate the A7 store — merge
   invalidates everything, including the combination matrix.
6. Full SK + EN locale coverage for all new strings, per A4's rules.

=== Deliberately not in scope ===

- **Duplicate prevention at create time.** A "similar activity exists" warning on quick-create sounds
  right and is the wrong shape: quick-create exists precisely because the user does not want to stop
  and think, and interrupting it converts a 2-second action into a decision. Merge cleans up after the
  fact instead, which is where the user actually has the context to judge. If you disagree after
  building this, write it up — do not implement it here.
- **Archiving roles and categories.** Same argument would apply, but they number in the tens, not the
  hundreds. Not worth the surface area.
- **Undo for merge.** Would require the backend to retain the pre-merge mapping. The confirmation
  dialog is the safeguard.

=== Write the backend ask last ===

When the frontend is built, write `prompts/activity/backend/A9-backend.md`. Last, not first — the
implementation is what tells you which fields you actually read and which endpoints actually feed a
picker, and a contract written from a guess is how you end up with a `usageCount` nobody displays.

Rules, matching the other modules' backend asks (see
`prompts/activity-history/backend/B1-group-ids.md` for the house format):

  - **Contract only.** Endpoints, methods, routes, request shapes, response fields with types and
    nullability, in the JSON casing your `fromJson` reads. No entities, no EF configuration, no
    migrations, no soft-delete-vs-flag opinion, no indexes. The .NET solution is not in this repo and
    anything past the contract is a guess dressed as a spec.
  - Lead with the problem and its live consequences, then the ask.
  - **State the business rules, because these are not inferable from the frontend**, and they are the
    substance of this one:
      · what "archived" means to every other query — history, dashboards, tracking mappings, to-do
        items and planner tasks that reference an archived activity keep working and keep displaying
        the name; only *pickers* exclude it
      · exactly which endpoints exclude archived rows by default, and which take an explicit flag
      · what `canDelete` counts as a reference (list the entity types), and what a delete of a
        referenced activity returns today — this is unknown from the frontend and the answer changes
        the UI
      · merge semantics: every reference type that must repoint, whether the merge is atomic, what
        happens to the merged-away activities (deleted vs. archived), and what happens if two of the
        selected activities are referenced by the same to-do item
      · whether merging is permitted across different roles or categories, and which wins
  - Ask for the failure responses explicitly — merge with an invalid survivor id, merge of one item,
    archive of an already-archived activity — and their status codes.
  - Close with what the frontend does with each field, so the backend can push back on anything that
    costs more than it is worth.

Verify: archive an activity and confirm it vanishes from all four picker paths (timer view, to-do
dialog, planner dialog, tracking mapping) while its history stays intact in /activity-history. Merge
two activities and confirm the history dashboard totals for the survivor equal the sum of both.
`npm run type-check` (baseline 72) and `npm run lint`.
```
