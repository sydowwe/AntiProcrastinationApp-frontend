# A4 · i18n pass (activity)

- **Scope:** `../../../src/core/activity`
- **Backend:** none
- **Model / effort:** Sonnet 5, medium-high — mechanical extraction, but the Slovak has to read like the existing Slovak, not like a translation.
- **Depends on:** A3 (deduplicating first means writing each key once)
- **Unblocks:** nothing

---

```
src/core/activity/ has a locale file (_locales/activity.{sk,en}.ts) with ~40 keys, and almost none of
the module's UI uses it. CLAUDE.md requires every user-facing string to go through vue-i18n, SK
primary, EN fallback.

Every hardcoded string in the module, by file:

view/ActivitySettingsView.vue
  lines 8-10   tab labels: "Activities", "Roles", "Categories"
  lines 16, 22 filter labels: "Name", "Text" (twice — the activities branch and the else branch)
  lines 30, 42 combobox labels: "Roles", "Categories"

component/ActivityTable.vue
  lines 61-65  column headers: "Name", "Role", "Category", "Text", "Unavoidable"
  lines 96,105 dialog title/button: "Create Activity"/"Create", "Edit Activity"/"Save"

component/activityRole/ActivityRoleTable.vue
  lines 60-63  "Name", "Text", "Color"
  dialog: "Add new role"/"Create", "Edit role"/"Save"

component/activityCategory/ActivityCategoryTable.vue
  lines 60-64  "Role", "Name", "Text", "Color"
  dialog: "Add new category"/"Create", "Edit category"/"Save"

component/activityRole/ActivityRoleForm.vue      lines 8, 13, 18: "Name", "Text", "Color"
component/activityCategory/ActivityCategoryForm.vue  same three
component/ActivitySelectionForm.vue
  lines 10, 32  "From to-do list", "From routine to-do list"
  lines 53, 67  "Role", "Category"   ← keys already exist: activities.role, activities.category
  line 88       "Activity" with a hand-built '*' prefix — see below
component/ActivityForm.vue  line 175 of ActivitySelectionForm.vue passes dialogProps
  { title: 'Create Activity', confirmBtnLabel: 'Create' }
composable/useActivitySelectionFormState.ts
  line 97   'Please select an activity'    ← key exists: activities.pleaseSelectActivity
  line 102  `Added record of activity ${name} to history`
  line 105  `Error saving record of activity ${name} to history`

Rules for the pass:

1. Reuse before adding. activities.role / category / activity / fromToDoList / createNewActivity /
   pleaseSelectActivity / start / pause / stop already exist and are already correct in both files.
   Several of the strings above are duplicates of keys already sitting unused in the locale file.
2. Table column headers and dialog titles are generic across the three tables — 'general.name',
   'general.text', 'general.create', 'general.delete' already exist in the framework's common
   namespace (grep _common/_locales for what is there before minting activities.* duplicates).
   Entity-specific titles ("Edit role") do belong in the activity namespace.
3. Do not build strings by concatenation. ActivitySelectionForm.vue:88 does
   `:label="(isFilter ? '' : '*') + 'Activity'"`. Required-field marking is presentation — either use
   two keys or keep the asterisk out of the translated string entirely.
4. The two snackbar strings in useActivitySelectionFormState use interpolation
   (`{activity}`); follow the pattern of activities.confirmSaveActivity, which already does this.
   Note that A6 may move these two lines out of the activity module altogether — if A6 has already
   landed, localize them wherever they now live.
5. SK is primary and this app's Slovak is informal and direct ("Prosím vyberte aktivitu", not
   "Prosím, vyberte si prosím aktivitu"). Match the register in the existing file. Also fix the two
   typos already there: activities.createNewActivity reads `Vytvoriť novú aktivity` (should be
   `aktivitu`) and activities.saveActivity reads `Uložit` (should be `Uložiť`).
6. Both files must end up with identical key sets. Diff them at the end.

Write the locale files with the Write/Edit tools only — never round-trip them through the shell.
They contain Slovak diacritics and this box's PowerShell 5.1 will double-encode them (see the rule in
the user's global CLAUDE.md).

Verify: switch the app to EN and back to SK with /activity-settings open and every dialog exercised;
look for raw key names rendering (a missing key shows as `activities.foo`). `npm run lint`.
```
