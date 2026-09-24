# Retest 10 — `leisure-projects` (12 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `leisure-projects` → `docs/views/leisure-projects/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/leisure/projects` (board), `/leisure/projects?view=table`

## Findings to retest

Everything except O1 is "fixed (code check 2026-09-24, not re-verified live)".

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | Every write to an existing project 404s (status change, edit, delete) | a status button moves the card and the counts update; an edit saves and shows; a delete removes the card | **yes**: see notes |
| B1 | bug | Board/Table mode doesn't survive a reload | clicking Table puts `view=table` in the URL **immediately**, and a reload keeps Table | no |
| B2 | bug | Each board filter change fires two competing grid requests | exactly one `POST /api/activity-project-profile/grid`, carrying `itemsPerPage: 200` | no |
| B4 | bug | A fractional `estimatedHours` is rounded on edit and saved rounded | the field shows `8.5`, an unchanged Save sends `8.5`, and `8.75` is not truncated | **yes**: on your own project only |
| B5 | bug | The create dialog's Activity shows a literal "0" that leaks into search | a placeholder, and typing leaves only what you typed with the match offered | no |
| A1 | a11y **[framework]** | The FilterPanel close (×) button has no accessible name | a localized name such as "Close" | no |
| A2 | a11y | The table's "Messy" cell is a bare icon | the cell has a text alternative | no |
| A3 | a11y | The inactive readiness-status buttons have very low contrast | the two inactive icons are clearly visible on the card. **Screenshot** | no |
| P1 | polish | FilterPanel logs a recurring Vue warning about an attribute | no "Extraneous non-props attributes" warning naming `FilterPanel` | no |
| P2 | polish | The card metadata line is missing a space before the second "·" | both separators have a space on each side | no |
| P3 | polish | Filtering down to zero results shows the "no projects at all" empty state | the filtered-empty state is different from the truly-empty one (for example, it suggests clearing the filter) | no |
| O1 | opportunity (built) | Add a *NeedsShopping* project to a to-do list | **no `Verify:` block.** Read the Status line (`cfa6434d`) for the flow and drive it once | **yes**: remove the to-do item it creates |

## Unit notes

- **Create one throwaway project first** (this is B5's happy path) with `estimatedHours` set to `8.5`, then use
  it for B4, X1's edit, and **X1's delete last**. For X1's status change on a seeded card, move it and then move
  it back.
- **P1:** Vue warnings log at `info`. Use `console info`.
- **P3:** filter to something that matches nothing. Clear the filter again before moving on, because it is
  stored in the URL.
- Board mode caps at 200 rows and never pages. That is known and not a finding.
