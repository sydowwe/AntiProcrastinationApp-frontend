# Retest 06 — `leisure-backlog-picker` (7 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `leisure-backlog-picker` → `docs/views/leisure-backlog-picker/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/leisure/backlog`, `/leisure/pick`

## Findings to retest

The ids are **round 2's**, meaning the current headings in `findings.md`. This unit was renumbered once, so do not
match these ids against older log entries without checking the title.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | Editing or deleting any backlog profile fails (wrong id) | an edited Duration saves and shows in the table; a deleted row is gone and stays gone after a reload | **yes**: see notes |
| B1 | bug | The picker hard-excludes a "no weather dependency" entry when today's weather matches nothing | an otherwise-eligible entry with weather "None" is suggested whatever the weather lookup returns | no |
| B2 | bug | Create-dialog required selects show a literal "0" that leaks into typed search | Activity, Location, Weather and Cost show placeholders, and typing into Activity leaves only what you typed | no |
| B3 | bug | Create-form validation doesn't match the server, and the failure is a generic message | an empty submit shows field validation before any request, or the snackbar gives the server's specific text | no, if validation holds |
| B4 | bug | Memory-anchor "Write it down": Highlight is required by the server, has no client rule, and the 400 is silent | an empty Highlight shows a validation message before or instead of a request | **only if it submits**: delete the anchor |
| B5 | bug **[framework]** | The Duration column renders as a percentage ("90.00 %") | a plain number with no "%", and no other duration-like column in the app has regressed | no |
| O1 | opportunity (built) | `maxParticipants` is captured and never used | **no `Verify:` block.** Read the Status line for the intended rule (it *ranks*, it does not exclude) and confirm on `/leisure/pick` with a *Who is around* setting that makes it matter | no |

## Unit notes

- **X1 without touching the fixture:** edit a seeded row's Duration, confirm it, then set it back. For the delete,
  create a throwaway backlog entry first (the same dialog is B2/B3's happy path) and delete **that** entry.
- **B1:** pick the entry from the `activity-backlog-profile/grid` response by its weather dependency, not by name.
  The weather lookup is live data. Record what `matchingWeatherDependencyIds` held when you checked.
- **`F90` (toggle-group ARIA) is not part of this file.** It was verified live on `/leisure/pick` when it was
  fixed. If it looks wrong while you are on the page anyway, report it as reopened (see `RETEST-PROMPT.md` §4,
  *Batch checks*).
