# tracking-settings — use cases

## What this unit is for

Lets a user turn raw, passively-observed desktop processes and Android apps (see
`docs/views/glossary.md`'s "Tracking vocabulary") into meaningful data: either map an observed process/app to
an `Activity` (so it counts as time spent on that activity), or mark it as ignored (so it's excluded from
tracking entirely). The mapping is pattern-based — a rule, not a one-off assignment — so it also retroactively
governs future observations that match the same pattern.

## Where it sits

Reached from the sidebar under "Web tracking" → "Desktop settings" / "Android settings", or via the in-page
link from `DesktopActivityDashboard` / `AndroidActivityDashboard` (out of this unit's scope — destination only).
A user typically arrives here after noticing an unmapped or misclassified entry on the tracking dashboard, or
proactively to set up mapping rules for a new app. From here they go back to the dashboard to see the effect,
or to `/activity-settings/activities` if the activity they want doesn't exist yet (the "Create new activity"
button shortcuts that trip without leaving this view).

## Views

### DesktopSettingsView (`/activity-tracking/desktop/settings/:tableView`)

**Purpose:** Manage pattern-based mapping rules for observed desktop processes.
**Who opens it and why:** Someone who tracked desktop time and now wants unmapped processes (e.g. `chrome.exe`)
attributed to a real activity, or excluded from tracking.

**What the user can do**
- Browse the distinct, not-yet-considered process/product/window-title combinations observed by the desktop
  tracker (`distinctEntries` tab).
- Define a pattern (process name / product name / window title, each with a match type) and either assign it
  to an activity (with role/category pre-filled from the activity) or mark it ignored, then save it as a rule
  (`Save`).
- Browse existing rules, filtered by active/inactive, type (Activity/Ignored), and — for the Activity type —
  role/category/activity (`mappings` tab).
- Edit an existing rule (loads its pattern and target back into the `distinctEntries` tab's form) or delete it.
- Create a brand-new `Activity` inline via a dialog, without leaving the settings screen.
- Dismiss a one-time explanatory hint (persisted per-account via `useUserScopedStorage`).

**What the user can see, and the question it answers**
- Distinct entries table — answers "what has the tracker seen that I haven't mapped or reviewed yet?"
- Mappings table — answers "what rules already exist, and what do they currently do?"

**Depends on:** the account's activity/role/category catalogue (`activityOptionsStore`), nothing from
`/user/preferences` or reminder preferences — this is module-owned data (raw mapping rules), not a preference.

### AndroidSettingsView (`/activity-tracking/android/settings/:tableView`)

**Purpose:** The same job as `DesktopSettingsView`, for Android app usage instead of desktop processes.
**Who opens it and why:** Same motivation, Android-tracked time instead of desktop-tracked time.

**What the user can do / see:** Identical to `DesktopSettingsView`, with the pattern fields narrowed to
`appLabel` + `packageName` (desktop's third field, `windowTitle`, has no Android equivalent — apps don't have
window titles).

**Depends on:** same as desktop.

## Entity lifecycle

A `TrackerDesktopMapping` / `TrackerAndroidMapping` is created here (via `Save`), edited here (`edit` action →
repopulates the form on the `distinctEntries` tab), and deleted here (`delete` action on the `mappings` tab —
see Findings B1, this pass could not confirm the delete actually removes anything). Deleting a mapping does not
touch the `Activity` it points to, nor any `ActivityHistory` already attributed under a prior mapping — it only
stops the rule from applying to *future* observations. Nothing else in the app creates or edits these rows;
`ActivityDashboard`/`DesktopActivityDashboard`/`AndroidActivityDashboard` only read tracking data, they don't
manage mappings.

## Data this unit captures but does not spend

- `TrackerDesktopMappingRequest.isActive` / `TrackerAndroidMapping`'s equivalent — settable via the "Is active"
  filter checkbox's presence in the mappings table's own `isActive` column, but this unit's UI has no control
  to *change* a rule's active state after creation (no toggle in the edit flow, no field in the create form).
  Worth flagging as an `opportunity` rather than a data-capture problem: the field exists and is filterable but
  not editable from this screen.
