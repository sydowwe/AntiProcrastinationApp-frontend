# X4 — `_shell` (run first)

Run as **Sonnet 5, high effort, clean context.** Run it **before any other X4 group**: every later group skips
shell defects on the strength of this one.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `shell` → playwright-cli session `-s=x4-shell`
- Account: primaryUser
- Docs: docs/views/_shell/inventory.md only. It has no findings.md. Findings go under its
  "## Findings" heading, and the mobile block goes at the end of each section it describes.
- Screenshots: docs/views/_shell/screenshots/
- What to check (the shell is framework-owned: src/_common/nav/, dialog/, feedback/, so every
  finding here is [framework]):
    1. Top app bar at 390 px: title, breadcrumbs, the #actions slot (App.vue), notification bell,
       user menu. What wraps, what's hidden, what overflows.
    2. Navigation drawer: at mobile width it should be temporary (overlay + scrim), not a rail
       pushing content. Open it, check every nav tree item is reachable by scrolling inside it,
       that choosing an item closes it, and that the scrim or Escape closes it. Check focus moves
       into it and returns afterwards.
    3. Breadcrumbs (AppBreadcrumbs) on a deep route, e.g. /day-planner/templates/<id> with an id
       from e2e/.state/seed.json dayPlannerTemplates. Do they truncate or overflow?
    4. User menu and notification bell menus: do they fit within 390 px?
    5. Snackbar: trigger one read-only. Navigating to /todo-list/999999999 shows an error state
       and may raise a snackbar. Check it isn't hidden under anything and doesn't cover the only
       action.
    6. DialogHost / MyDialog: open any simple dialog (e.g. the create dialog on /todo-list, then
       cancel) and record whether MyDialog goes full-screen below md. That tells every later
       group what to expect, so state it plainly in the mobile block.
    7. ActionBar (framework): FW17 centred it on the content area rather than the viewport.
       Check it at 390 px on a view that shows one (the day planner's selection bar appears when
       a task is selected; selecting is read-only).

Do only this group.
```
