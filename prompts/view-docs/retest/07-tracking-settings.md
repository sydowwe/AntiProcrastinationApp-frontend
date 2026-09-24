# Retest 07 — `tracking-settings` (8 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `tracking-settings` → `docs/views/tracking-settings/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/activity-tracking/desktop/settings/distinctEntries`, `…/desktop/settings/mappings`, and the same two under `/activity-tracking/android/settings/`

## Findings to retest

All eight were "verified by source read" against commit `39a89462`. Most of them are **write paths** that have
never been seen succeeding.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | The Mappings row and its edit/delete actions are invisible and unclickable | the row is painted (**screenshot**), and a normal click on edit opens the `distinctEntries` tab with the form filled in | no |
| X2 | blocker | "To ignored" can never be saved (the request lacks `isIgnored: true`) | on **both** platforms the body carries `isIgnored: true`, the save returns 2xx, and the rule shows under *Ignored* with no activity | **yes**: this is the row X4 deletes |
| X3 | blocker | Editing an existing mapping 400s (the update lacks `isActive`) | on **both** platforms the PUT body includes `isActive`, returns 2xx, and the change survives a reload | **yes**: change it back |
| X4 | blocker | The delete confirm sends no request, and the row survives | confirming sends a delete that returns 2xx, and the row is gone after the grid re-fetches | **yes**: delete only the rows X2 created |
| B1 | bug | No filter control on the Mappings tab ever re-fetches | each filter change fires a new `…mapping-by-pattern/grid` POST carrying the filter, on **both** platforms | no |
| B3 | bug | The distinct-entries filter isn't in the URL and is lost on reload | the URL gains a query param, and reloading that URL re-applies the filter | no |
| B6 | bug | Save failures show a generic "Failed to save mapping" message | either client validation blocks the save, or the error shows the server's own `patterns`/`target` messages | no, if it fails |
| B7 | bug | The delete confirmation shows the raw numeric id | the dialog names the row's pattern and/or target | no, if you cancel |

## Unit notes

- **Order for the writes: X2 → B7 → X4, on the same row.** Create an ignored rule with X2, open its delete
  confirmation for B7 and cancel, then delete it for X4. Do this once per platform. **Never delete a seeded
  mapping.**
- **X3:** edit a seeded mapping, confirm the change after a reload, then edit it back and confirm again.
- **The Mappings tab opens with *Type* set to `Activity`, so it shows one row per platform** (`rider64.exe →
  Desk Research`, `com.spotify.music → Read a Novel`). The seeded ignored mappings (`21002 SteamLauncher.exe`,
  `21102 com.android.settings`) are under *Ignored*. That is a filter default, not a missing row, and it has
  been misread before.
- **B6:** the easiest trigger is an invalid pattern or a missing target. Use `playwright-cli route` only if the
  form genuinely cannot produce a server 400.
