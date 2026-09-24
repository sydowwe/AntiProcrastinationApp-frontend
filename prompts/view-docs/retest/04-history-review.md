# Retest 04 — `history-review` (6 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `history-review` → `docs/views/history-review/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/activity-history` (Summary), `/activity-history/calendar`, `/activity-history/detail?date=…`

## Findings to retest

All six were marked "verified (code check 2026-09-24)", which means they were never driven in a browser.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| B1 | bug | The period-total banner is clipped to about 2 characters in the Top Activities panel | at ≥1440 px, with a baseline comparison populated, the banner is readable on one line or wraps below the selects. **Screenshot** | no |
| B2 | bug | A failed dashboard request looks the same as an empty period | the panel shows an error or retry state that is visibly different from "No data for this period" | no |
| B3 | bug | The breadcrumb says "Home › Summary" on the Detail page | the breadcrumb has a segment that marks this as the Detail page | no |
| A2 | a11y | Calendar day cells have no accessible name | each cell's name gives the date, and clicking it still opens `/activity-history/detail?date=…` | no |
| P2 | polish | Pie-chart legend text can overlap the donut | the legend stays inside the hole, or moves outside when it would overflow. **Screenshot** | no |
| P3 | polish | The calendar view has no page heading | an `<h1>` matching the sibling views, above the Mode/Month/Year row | no |

## Unit notes

- **Read-only unit.**
- **B2 needs a forced failure.** Use `playwright-cli route` to answer the dashboard request with a 500, check
  the panel, then remove the route. Do not stop the API.
- **B3's `Verify:` block hardcodes `2026-09-09`.** Use a date derived from `seed.seedDateUtc` with the same
  query format. The week view is populated, and the Detail view may legitimately be empty for the seed date.
  Pick a day that has data, because B1's banner needs a populated comparison.
- The charts are on `<canvas>`. For P2, judge from the screenshot, not the snapshot.
