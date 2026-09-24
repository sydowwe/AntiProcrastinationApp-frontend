# Retest 05 — `leisure-bucket-anchors` (6 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `leisure-bucket-anchors` → `docs/views/leisure-bucket-anchors/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/leisure/bucket-list` (Table / Ladder), `/leisure/memory-anchors` (Table / Timeline)

## Findings to retest

All six were marked "fixed (static re-check 2026-09-24)", which means they were never driven in a browser.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | The bucket-list Ladder view always shows its empty state (a 400 on the grid) | no 400, and the Ladder shows the same rows as the Table, each under the right rung | no |
| X2 | blocker | The memory-anchors Timeline always shows its empty state (the same 400) | no 400, the year strip shades the anchors' months, and their highlight notes render | no |
| X4 | blocker | Editing or deleting a bucket-list profile silently 404s | the request URL uses the profile's own `id` (not `activityId`), returns 200/204, and the table updates without a reload | **yes**: see notes |
| B2 | bug | Create dialogs show a literal "0" in required pickers, and "0" passes validation | the pickers show an empty placeholder, and **Create** with nothing picked sends no request and shows a validation message | no, if validation holds |
| B3 | bug | The Inspiration column always renders "—" | the column shows the real text for every row whose `inspirationSource` is not empty | no |
| A1 | a11y | Several icon-only controls have a `title` but no `aria-label` | each has a localized `aria-label`, and row actions ideally name the row | no |

## Unit notes

- **X4 without touching the fixture:** for the edit, change one field and then change it back. For the delete,
  first create a throwaway bucket-list profile (this also exercises B2's happy path), then delete **that** one.
- **X2's `Verify:` block names July and August 2026.** Those months come from the fixture. If the seed has moved,
  compare against the `memory-anchor/grid` response rather than the literal months.
- **Leave the memory anchors alone apart from reading them.** Deleting an anchor flips its source profile's
  `isAnchored` flag, which is exactly how the fixture drifts.
- `P1` and `O1` in this file are **open**, not fixed. They are out of scope, so do not touch them.
