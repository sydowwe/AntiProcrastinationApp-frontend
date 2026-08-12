# A10 · The activity picker's daily surface

- **Scope:** `src/core/activity/component/ActivitySelectionForm.vue`, `composable/`, `view/`
- **Backend:** none (deliberately — see below)
- **Model / effort:** Sonnet 5, medium
- **Depends on:** A6 (the API it builds on), A7 (the store it stores recency in)
- **Unblocks:** nothing

---

```
The activity picker is the single most-used control in this app — every timer start, every to-do item,
every planner task goes through it. It is currently an alphabetical VIdAutocomplete over every
activity the user has ever created, which gets worse every week.

Four changes, in value order. Ship them independently; each stands alone.

--- 1. Recency ordering ---

The activity you want is overwhelmingly likely to be one of the last handful you picked. Order the
activity options by recency of selection, then alphabetically for the long tail.

Do this client-side, in localStorage — not via a backend "last used" field. Reasons: recency is a
per-device UI preference, not domain data; it costs one endpoint and one migration to do server-side
and the payoff is identical for a single-user-per-device app; and it must survive being wrong
(a corrupted or absent entry falls back to alphabetical, which is exactly today's behaviour).

Shape: a bounded list of the last ~10 activity ids, most recent first, written when a selection is
committed (not on every keystroke of the autocomplete). Bound it, prune ids that no longer exist on
read, and version the storage key so a shape change doesn't have to migrate.

Scope the recency list per role if the picker has a role selected — "the last thing I did at work"
and "the last thing I did at home" are different questions. If that turns out to complicate the
storage shape more than a little, ship the unscoped version; the unscoped version is already most of
the value.

Render the recent block visually distinct — VAutocomplete supports a `subheader` item type, or use the
`#item` slot with a divider after the recent group. Do not silently reorder with no visual cue; users
who have learned the alphabetical position of an item will think it disappeared.

--- 2. First-run and empty states ---

A brand-new account has zero roles, zero categories and zero activities. Today that means:
every dropdown in the app is an empty box with no explanation, and /activity-settings is three empty
tables. The picker's '+' button does lead to a create dialog, but nothing points at it.

Add empty states at three points:

  - the activity autocomplete with no options at all → a `#no-data` slot explaining that activities
    live under Settings, with the create action inline (the '+' button already exists next to the
    field — reference it, don't duplicate it)
  - the autocomplete with options but no *matches* for what was typed → offer "create '<typed text>'"
    which opens ActivityForm prefilled with the name. This is a real gap: today typing a
    non-existent activity name gives a blank dropdown and the user has to clear the field, click '+',
    and retype what they just typed.
  - each of the three settings tables when empty → a one-line explanation of what the entity is for
    plus the existing add action. Roles and categories especially — a new user has no idea what
    this app means by "role".

Write the copy as explanation, not instruction, and keep it to one sentence. Full SK + EN.

--- 3. Keyboard path ---

Check what actually happens end-to-end: tab into the picker, type, select, and — in the timer views —
start the timer, without touching the mouse. The '+' create button
(`_common/component/inputs/InputWithButton.vue`) sits next to the field; confirm it is reachable and
has an accessible label rather than being an icon-only button with no name. Confirm the dialogs it
opens trap focus and return it to the field on close.

Fix what is broken; if it is all fine, say so and move on. Do not add keyboard shortcuts.

--- 4. Show what is selected ---

When a role and category are chosen, the picker shows three separate dropdowns and no summary. In the
narrow embeddings (`layout: 'row'` after A6, e.g. the tracking mappings filter) the role and category
fields are often off-screen or collapsed, and the user cannot see why the activity list is short.

When the activity list is narrowed by a role or category, show it — a small chip row above the
activity field with the active narrowing and a click-to-clear, using
`_common/component/feedback/ChipWithIcon.vue`. This is also the fix for a confusing case that exists
today: pick a role, then a category that has no activities under that role, and the activity list goes
empty with no indication of which filter caused it.

=== Not in scope ===

- **Favourites / pinning.** Recency covers the same need without asking the user to curate anything.
- **Fuzzy matching.** Vuetify's default substring filter is fine for lists of this size; a fuzzy
  matcher on a 500-item list is a solution to a problem this app does not have.
- **Anything that ranks by "productivity".** Out of bounds for this module — see the reasoning in
  prompts/todo-motivation/README.md.

Verify: pick the same activity three times from different views and confirm it surfaces to the top of
the list everywhere. Clear localStorage and confirm the picker still works (alphabetical). Log in as a
brand-new account, or empty the three tables, and walk the first-run path. `npm run type-check`
(baseline 72) and `npm run lint`.
```
