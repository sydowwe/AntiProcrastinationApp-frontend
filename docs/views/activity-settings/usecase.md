# activity-settings — use cases

## What this unit is for
This is the taxonomy manager for the app's central entity, `Activity` (see `docs/views/glossary.md`, "The
spine"). One screen, three tabs, lets a user create and maintain the roles, categories and activities that
every picker, timer, to-do item and planner task in the app eventually points at.

## Where it sits
Reached from the sidebar's standalone "Activity settings" link, which lands on the `activities` tab — the
other two tabs (`roles`, `categories`) have no sidebar entry and are reachable only via the in-page tab
control once here (confirmed; matches `docs/views/_shell/inventory.md`'s note under "Nav vs routes"). A user
typically arrives here from an empty-state "create one" prompt inside a picker elsewhere in the app (e.g. the
activity autocomplete's `+` button), or proactively to prune/merge/archive their activity list. From here they
go back to wherever they use the picker — nothing on this screen forwards to another module.

## Views

### ActivitySettingsView — Activities tab (`/activity-settings/activities`)
**Purpose:** Manage the list of activities: create, edit, filter, archive/unarchive, merge duplicates, delete.
**Who opens it and why:** Anyone who wants to rename an activity, retire one they no longer do, clean up
duplicates ("Reading" vs "reading"), or just see how many history records an activity has.

**What the user can do**
- Filter by name, free text, one or more roles, one or more categories, and lifecycle state (Active /
  Archived / All)
- Create an activity (name, role, category, description, "is unavoidable"), with inline quick-create for a
  new role or category from the same dialog
- Edit an activity
- Archive / unarchive an activity (reversible, no confirmation — the row stays, just dimmed and excluded from
  every picker)
- Delete an activity — only when nothing references it (`canDelete`); the button is disabled otherwise
- Select two or more activities and merge them into one survivor, repointing every history record, to-do
  item, planner task and tracking mapping, with a confirmation stating exactly how many activities and
  records will move and that it cannot be undone

**What the user can see, and the question it answers**
- The table's "Records" column (`usageCount`) — answers "how much is riding on this activity, before I
  delete or merge it?"
- The archived-row dimming + box-archive icon — answers "which of these have I already retired?"
- The disabled Delete button's tooltip — answers "why can't I delete this one?" (something references it)

**Depends on:** the shared `activityOptionsStore` (role/category lookup lists, fed to the filter comboboxes
and the create/edit dialogs' pickers — the worked example of the sign-in watcher in CLAUDE.md's
`_common/bootstrap/` section).

### ActivitySettingsView — Roles tab (`/activity-settings/roles`)
**Purpose:** Manage the role lookup table — the broad life-area an activity belongs to (Work, Health &
Fitness, Hobbies & Leisure, …).
**Who opens it and why:** Setting up the app for the first time, or renaming/recoloring/re-iconing a role.

**What the user can do**
- Filter by name and free text (its own filter state, independent of the other two tabs)
- Create / edit a role: name, description, colour, icon
- Delete a role (no archive option for roles — deliberately out of scope per `A9-archive-and-merge.md`,
  "they number in the tens, not the hundreds")

**What the user can see, and the question it answers**
- The colour swatch column — answers "what colour does this role render as in the history charts?"

**Depends on:** nothing outside the module.

### ActivitySettingsView — Categories tab (`/activity-settings/categories`)
**Purpose:** Manage the category lookup table — a finer, optional grouping inside a role.
**Who opens it and why:** Same as roles, one level down.

**What the user can do**
- Filter by name and free text
- Create / edit a category: name, description, colour, icon
- Delete a category

**What the user can see, and the question it answers**
- The "Role" column — nominally answers "which role is this category under?", but see `findings.md` P1: a
  category is not actually stored with a role foreign key (`CategoryRequest` has no `roleId` field at all),
  so this column is really "which role(s) do this category's current activities happen to use?" and can show
  more than one role, comma-joined, in a single cell.

**Depends on:** nothing outside the module.

## Entity lifecycle
- **Role / Category** — created and deleted here only, no archive state. A `canDelete`/`usageCount` pair
  gates deletion the same way as Activity's.
- **Activity** — created here or via any of the app's quick-create dialogs (to-do item, planner task,
  tracking mapping, the activity picker's own `+` button — see `A9-archive-and-merge.md`, "Problem 2", for
  why this produces near-duplicates). Archiving removes it from every picker while every existing
  reference keeps rendering its name (`glossary.md`, "Activity lifecycle"). Deleting is hard and only
  permitted with zero references. Merging is the tool for cleaning up duplicates after the fact: pick a
  survivor, every reference across history/to-do/planner/tracking repoints to it, the others are deleted —
  irreversible, confirmed with an exact count, no way to preview *which* records move beyond the count.

## Data this unit captures but does not spend
- **Role.icon / Category.icon** — captured via `IconPicker` in both create/edit forms and returned by the
  API on every role/category payload, but neither `ActivityRoleTable.vue` nor `ActivityCategoryTable.vue`
  renders an icon column. It is not entirely unspent app-wide — `ActivitySelectionForm.vue:92` renders a
  role/category chip icon elsewhere — but *within this unit* a user who just picked an icon has no way to
  see it again without reopening Edit. See `findings.md` O1.
- **Role.systemKey** — present on every Role payload (`null` for user-created roles, set for the three
  system roles the app itself relies on — confirmed: "Planner task", "Routine task", "To-do list task"),
  never surfaced in the UI at all — not a column, not a badge, not a disabled-editing indicator on a system
  role's row. Worse than just unsurfaced: `canDelete: false` is correctly returned for all three, but the
  Roles table's Delete button doesn't read that field at all and renders enabled anyway — a real gap, not a
  hypothetical one (see `findings.md` B7). What the server actually does if that Delete is confirmed remains
  open (`findings.md` U2).
