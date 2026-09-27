# Retest 02 — `tracking-dashboards` (3 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `tracking-dashboards` → `docs/views/tracking-dashboards/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/activity-tracking` (web), `/activity-tracking/desktop`, `/activity-tracking/android`

## Findings to retest

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| B1 | bug | Web domain-detail close button renders no icon (`mdi-*` in a FontAwesome app) | a visible close glyph, and no `Could not find one or more icon(s)` in the console | no |
| B2 | bug | Android: selecting an app opens no detail panel | the side panel shows that app's own detail (at least active seconds and session count) | no |
| A2 | a11y | Desktop process-detail close button has no accessible name | it exposes a name that says it closes the process details | no |

## Unit notes

- **Read-only unit.** Nothing here writes.
- **The charts are echarts on `<canvas>`.** The snapshot shows nothing inside them. Open a detail panel from the
  list or legend beside the chart if there is one, otherwise click the canvas. Confirm which item you selected
  from the response body of the request that fills the chart, not from the snapshot.
- The seed has seven days across all three ledgers, relative to `seed.seedDateUtc`. If a dashboard looks
  empty, check its date range against that date before you suspect the fix.
