# Retest 08 — `planner-day` (11 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `planner-day` → `docs/views/planner-day/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/day-planner` (calendar), `/day-planner/:date`, `/day-planner/task/:id`, `/day-planner/settings`

## Findings to retest

Every one of these was marked "fixed and verified (2026-09-24, **code read only**)". None has been driven in a
browser.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | Renaming a task is silently blocked or discarded, whichever way the toggle is set | in **both** toggle states the rename succeeds and shows everywhere, or a visible error keeps the dialog open | **yes**: rename it back |
| B1 | bug | The settings view's tabs stack instead of switching | on every tab exactly one panel is visible | no |
| B2 | bug **[framework]** | `MyDateInput` ignores its `label` prop | the field reads "Source date", and one other `MyDateInput` with a custom label also shows its own label | no |
| B3 | bug | The calendar's range config and day filter don't round-trip through the URL | "Workdays (Mon-Fri)" survives a reload, and so does a non-default Duration Anchor/Unit/Quantity | **UI state only**: put it back to the defaults |
| B5 | bug | Invalid route params throw uncaught console exceptions | an invalid date or id shows a handled state or a redirect, with no uncaught exception | no |
| B6 | bug | The settings view's active tab isn't in the URL | the URL carries the tab, and a reload restores it | no |
| B7 | bug | The plan-vs-actual block counts the day as done the moment it loads | on today's view, before the day's end time, the block is **absent**; on a past day it **appears** | no |
| B8 | bug | A deleted task's day-summary counters never refresh | after the delete and a reload, the header's count and % match the task blocks in the grid | **yes**: delete a task you created |
| A1 | a11y **[framework]** | The calendar's month prev/next arrows have no accessible name | both have localized names ("Previous month" / "Next month") and still work | no |
| P1 | polish | The "Date range" recurrence tab has a missing FontAwesome icon | an icon like its siblings, and no "Could not find one or more icon(s)" error | no |
| P2 | polish | Importance is silently required in the Repeating Task dialog | the Importance label carries the required marker before any submit attempt | no |

## Unit notes

- **The `:date` param is `dd-MM-yyyy`, not ISO.** `/day-planner/2026-09-11` 400s and silently shows a
  **neighbouring** day. Build every day URL from `seed.seedDateUtc` in `dd-MM-yyyy`. For B5, an ISO or garbage
  date **is** the invalid input, so that is the one place to use one on purpose.
- **B7 depends on the time of day.** It needs a view of *today* before that day's end time. If the seed date is not
  today, or it is already past the day's end, mark B7 **blocked** and say why. Do not fake the clock by editing
  data. The second half (a past day shows the block) can always run.
- **B8:** create a throwaway task on the seed day, reload so the counters include it, delete it, reload again, and
  then compare. Do not delete a seeded task.
- **X1:** the rename goes to `PUT /api/activity/{id}/quick-edit`, so it renames the **activity**, which other
  units show too. Rename it back and confirm the original name is restored.
