# A5 · URL state and filter behaviour (activity settings)

- **Scope:** `../../../src/core/activity/view/ActivitySettingsView.vue`, `../../../src/core/activity/activity.routes.ts`
- **Backend:** none
- **Model / effort:** Sonnet 5, medium
- **Depends on:** A1 (item 5 fixes the combobox bindings this prompt then persists), A3 (fewer places to wire)
- **Unblocks:** nothing

---

```
/activity-settings/:tab keeps its tab in the route path and nothing else anywhere. CLAUDE.md requires
filterable/bookmarkable state — filters, tabs, search queries, pagination — to live in URL query
params. Three concrete problems in view/ActivitySettingsView.vue:

--- 1. Filters are not addressable and do not survive a reload ---

`nameTextFilter`, `activityFilter`, `roleCombobox`, `categoryCombobox` are plain refs. Reload,
back-navigation, or sharing a link loses all of it.

Move them to query params. Suggested shape (keep it flat and short — these end up in a URL people
paste):

  /activity-settings/activities?name=read&text=&roleIds=3,7&roleName=deep&categoryIds=2
  /activity-settings/roles?name=work

Read on mount, write on change with `router.replace` (not `push` — typing in a filter box must not
fill the history stack). Omit empty values rather than emitting `?name=&text=`. Parse defensively:
`roleIds=abc` must degrade to no filter, not to `[NaN]`.

The framework has `_common/composable/table/useTableUrlState.ts` — read it first. If it covers this,
use it and do not write a second implementation. If it only covers page/sort/itemsPerPage, use it for
those and add the filter half in the view.

--- 2. Every keystroke is a request ---

Lines 68-75 of each table component watch the filter deeply and call loadItems immediately. Typing
"reading" into the name box fires seven paginated queries and races them; useFetchFilteredTable does
not abort in-flight requests, so the response order decides what you see.

Debounce the filter→URL→reload path at ~300ms. Debounce once, at the source (the view), not inside
each table. Text inputs need the debounce; the comboboxes and the tab switch should apply
immediately.

--- 3. Switching tabs silently discards the filter, and the two filter shapes are conflated ---

Lines 131-140 reset all four filter objects on any tab change, so tabbing away and back loses your
work. Worse, `nameTextFilter` is shared by the roles tab and the categories tab (lines 85 and 91), so
filtering roles by name and switching to categories carries the role filter across.

Give each tab its own filter state, namespaced in the query (`?activities.name=…` is ugly; prefer
dropping the tab's params when you leave it and restoring them from history, or simply keep three
separate state objects and serialize only the active tab's). Pick one and state the choice in your
summary. The requirement is: switching tabs and coming back restores what I had, and roles/categories
never share a filter object.

--- 4. Route hardening ---

activity.routes.ts declares `path: '/activity-settings/:tab?'` with no validation. Any string routes
successfully — /activity-settings/nonsense renders the shell with three empty tab panes and no error.
Constrain the param (`:tab(activities|roles|categories)?`) and default a missing tab to 'activities'
via a redirect rather than the current `(route.params.tab as string) || 'activities'`, which leaves
the URL and the UI disagreeing.

The route also has no `meta`. Every other module's routes carry breadcrumb/title meta — check
`src/core/todoList/todoList.routes.ts` and match the convention.

--- 5. Drop the redundant tab watchers ---

There are three separate `watch(activeTab, …)` calls (lines 125, 131, 142) plus a watch on
`route.params.tab`, and they write to each other. With the tab in the route and the filters in the
query this collapses to one direction: route → state, and one handler for user-initiated tab clicks.
Untangle it rather than adding a fifth watcher.

Verify: filter the activities tab, copy the URL, open it in a new tab — same view. Reload — same view.
Browser back after three filter edits — one step, not three. Switch tabs and return — filter intact.
Then `npm run type-check` (baseline 72) and `npm run lint`.
```
