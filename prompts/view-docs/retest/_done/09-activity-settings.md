# Retest 09 — `activity-settings` (12 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `activity-settings` → `docs/views/activity-settings/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/activity-settings/activities`, `/activity-settings/roles`, `/activity-settings/categories`

## Findings to retest

Every one of these is "fixed in code (round 3, 2026-09-24, code-only check — not re-verified live)".

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| B2 | bug | `roleIds` / `categoryIds` in the URL are dropped on a fresh load | `?roleIds=<id>` is still in the URL after load, and the rows are filtered to that role (B1 is fixed server-side, so check the rows too) | no |
| B3 | bug | `POST /api/activity/grid` fires twice on every load | exactly one request per load, with no aborted one before it | no |
| B4 | bug **[framework]** | Row-action buttons show the internal slug instead of a localized label | the titles read "Edit" / "Delete", and change language in SK. **Switch back to EN** | no |
| B5 | bug | An invalid `:tab` renders a blank page and floods the console with router warnings | a redirect to `activities` or the NotFound view, with no router warnings | no |
| B6 | bug | The breadcrumb shows only "Home" on Roles and Categories | "Home › Activity settings" when navigating directly to either tab | no |
| B7 | bug | Roles and Categories never disable Delete for a row that can't be deleted | a row with `canDelete: false` has a disabled Delete with an explanatory tooltip | no |
| B8 | bug | The Roles/Categories delete confirmation shows the raw id and a generic "Confirm" | the dialog names the row, and the button reads "Delete". **Cancel** | no |
| B9 | bug **[framework]** | `extractServerMessage` hides the specific `errors` text behind the generic `message` | the snackbar shows the server's specific text, not "One or more errors occurred!" | see notes |
| A1 | a11y | The Activities table's Delete button has no accessible name | `getByRole('button', { name: 'Delete' })` resolves, with the localized blocked text when disabled | no |
| P1 | polish | The Categories "Role" column reads as a single stored value | the header says it is an aggregate ("Roles in use") and/or it renders as chips | no |
| P2 | polish | The Categories filter combobox label is truncated | "Categories" renders in full. **Screenshot** | no |
| O1 | opportunity (built) | Role/Category icons are never shown in the settings tables | **no `Verify:` block.** Both tables have an Icon column that renders each row's icon | no |

## Unit notes

- **B2:** the `Verify:` block uses role id `11001` (Work). Confirm that id in the roles grid response before you
  rely on it.
- **B3:** count the requests in `playwright-cli requests` after a **fresh** navigation, not after switching tabs.
  The aborted duplicate appears only in the network log, never in the console.
- **B5 and B6:** router warnings log at `info`. Check `console info` as well as `console warning`.
- **B7 and B9: find a role the server refuses to delete** (a system role, or one that activities still reference).
  Pick it from the grid response's `canDelete` / system flags. For B9, confirm the delete of a row the server
  will **refuse**. The refusal is the check and nothing is deleted. If no such row exists, use
  `playwright-cli route` to answer the DELETE with a 400 whose `errors` body carries a specific message.
  **Never confirm a delete the server would accept.**
- `U3` and `U4` in this file still say `open`, but the queue calls them closed. Do not touch them, and list them
  under *Status drift* in your report.
