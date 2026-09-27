# Retest 11 — `planner-templates` (14 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `planner-templates` → `docs/views/planner-templates/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/day-planner/templates`, `/day-planner/templates/:templateId`, `/day-planner/templates/split`

## Findings to retest

Every one of these is "fixed and verified **by source read** (2026-09-24)".

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | The Compare Templates dialog always renders empty | both panels show the real name, icon, chips and a timeline with task blocks, and there is no `CanceledError` | no |
| X2 | blocker | The template-detail side panel is unusable on a mobile viewport | at 390×844 the panel fits the viewport and every field is visible and tappable. **Screenshot** | no |
| B1 | bug | The card title row is too crowded at 1440 px | "Active"/"Inactive" sits on one line, and the day-type chip fits or ends in an ellipsis. **Screenshot** | no |
| B2 | bug | The create/edit form has no client validation | an empty submit shows "required" on Name and on the day type, and the dialog stays open | no, if validation holds |
| B3 | bug | The comparison dialog has a Confirm button that does nothing | only "Cancel" is present | no |
| B4 | bug | The sort choice and split-view picks aren't in the URL | both appear as query params and survive a reload or a fresh open of that URL | no |
| B5 | bug | An invalid template id shows the previously viewed template's name | a not-found state, a fallback label or a redirect, never the stale name | no |
| A1 | a11y | The card pin toggle has no accessible name | the name is localized and changes with state (Pin / Unpin) | **toggle it back** |
| A2 | a11y | The compare-mode checkbox has no name, and the card's icon blocks clicks on it | named after the template, and a direct click works without being intercepted | no |
| A3 | a11y | The mobile side-panel toggle has no accessible name | a localized name. **Mobile viewport** | no |
| P1 | polish | The Scheduled Days row is clipped in the 400 px side panel | all seven day buttons are visible or reachable | no |
| P2 | polish | `MiniTimeline.vue` leaves a debug `console.log` | no log output from it | no |
| P3 | polish | The header's task count doesn't mention background tasks | it counts them, or notes them ("1 task (+1 background)") | no |
| U3 | a11y | The split view's back button may have no name | it has an accessible name | no |

## Unit notes

- **Templates come from `seed.dayPlannerTemplates`:** `homeOffice` (5 tasks), `officeDay` (4) and `pinned` (3,
  pinned). Use those ids, not literals.
- **A1:** the `pinned` template must stay pinned, because the list's pinned section and `templateDayPlanner.spec.ts`
  depend on it. Check the name on an unpinned card, toggle it, check the name again, and toggle it back.
- **X2 and A3:** `playwright-cli resize 390 844`, then **resize back to 1440 900** before the next finding. B1's
  pass condition is about 1440 px.
- **B5:** open a valid template first, then navigate to an invalid id. The bug is a **stale** name, so it needs one
  to be stale.
- **P3** needs a template with a background task. Since 2026-09-25 the fixture seeds one on `pinned`
  (Relaxed Weekend, task `20113`), so the header there should read "3 tasks (+1 background)". This needs a
  seed taken after that change: if `pinned` shows no background block, the API or the seed predates it, so
  mark P3 **blocked** again. Do not add a task to a seeded template.
- **B2:** if validation fails to stop the submit and a template is created, delete it and reopen B2.
