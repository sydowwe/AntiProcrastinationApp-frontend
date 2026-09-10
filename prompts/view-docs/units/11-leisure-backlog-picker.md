# Unit 11 — leisure-backlog-picker

Module: `leisure`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `leisure-backlog-picker`
- Module: `leisure`
- Pass: `inventory`
- Views & routes:
    `BacklogView`   `/leisure/backlog`
    `PickerView`    `/leisure/pick`
- Intent sources: prompts/_done/leisure/README.md, D1-what-should-i-do.md,
  L1-server-table-adoption.md, L2-correctness-pass.md, L4-onboarding-empty-states.md,
  D2-weather-aware.md

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
- These two are one unit because PickerView SPENDS what BacklogView collects — the route
  table calls it "the only one that is not a table: it spends what the other four
  collect". Verifying the picker means knowing what is in the backlog.
- L2 lists a CONFIRMED cross-module import violation in NewBacklogProfileForm.vue:89 —
  it imports from @/core/activity/composable/, which CLAUDE.md forbids (cross-module only
  via api/ or dto/). L2 claims to fix it. Check whether it actually did.
- L1 is about adopting _common/composable/table/useServerTable.ts, which the README says
  nothing in src/ used yet, and notes the module had NO URL state anywhere despite
  CLAUDE.md requiring it. Check both: does the backlog table use server-side paging, and
  do its filters survive a reload?
- The README's diagnosis is the sharpest intent source in the repo — it points out
  ActivityBacklogProfile records energy, effort type, duration, location, weather
  dependency, cost tier and party size, and the UI only offers them as filters. Anything
  still captured-but-unspent belongs in the usecase doc's "captures but does not spend"
  section — that section feeds docs/data-map.md later, so be precise about field names.
- Recent commit f6af3c35 touched useLeisurePicker.ts, post-dating the intent sources.

Do only this unit. Do not continue to another one.
```
