# Unit 08 — planner-templates

Module: `dayPlanner`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `planner-templates`
- Module: `dayPlanner`
- Pass: `inventory`
- Views & routes:
    `TemplateListView` `/day-planner/templates`
    `TemplateSplitView` `/templates/split`
    `TemplateDayPlannerView` `/templates/:templateId`
- Intent sources: prompts/_done/day-planner/README.md, P1-split-view-dead.md,
  P6-planner-shell-dedup.md, P2-store-type-contract.md, P4-localization.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Drive the browser with playwright-cli, per CLAUDE.md's "Browser verification" section —
including its sign-in and state-load sequence. Use your own session and run
`playwright-cli close` when you finish. Prefer `find` over `snapshot`. Charts are echarts
on <canvas> and are invisible to the snapshot: read them from the populating response,
an eval, or a screenshot — never report one as empty on snapshot evidence alone.

Known for this unit — verify each, do not assume:
- `/day-planner/templates/split` (TemplateSplitView) is an ORPHAN CANDIDATE — no nav entry
  and nothing found linking to it. The intent source P1 is titled "split view dead".
  Establish whether that prompt's fix landed and the view is now reachable, or whether it
  is still dead. This is the single most valuable thing to settle in this unit.
- CONFIRMED, REPRODUCE AND WRITE UP: the shell pass hit five `CanceledError: canceled`
  console errors plus "Unhandled error during execution of mounted hook at
  <TemplateListView>" on `/day-planner/templates`, from TemplateListView.vue:126-128 via
  useFetchFiltered — an aborted-request race when navigating away quickly. It was deferred
  to this unit. It is yours: reproduce it, confirm the detail, file it properly.
- TemplateDayPlannerView deliberately has NO `props: true` on its route. The route comment
  explains why: params arrive as strings and would shadow the view's `number | null`
  prop, breaking every numeric consumer. The view reads the param itself. Do not report
  the missing `props: true` as an inconsistency.
- Recent commit ffe7c927 deduped the three template-card grids into TemplateCardGrid and
  added useTemplateCompare, post-dating the intent sources.

Do only this unit. Do not continue to another one.
```
