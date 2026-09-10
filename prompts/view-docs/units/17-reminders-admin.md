# Unit 17 — reminders-admin

Module: `_common`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

This unit is read-only — no mutation pass.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `reminders-admin`
- Module: `_common`
- Pass: `inventory`
- Views & routes:
    `ReminderDefinitionsView`   `/pripomienky/register`
    `ReminderDefinitionDetailView`   `/register/:id`
    `ReminderUpcomingView`   `/nadchadzajuce`
    `ReminderDispatchHistoryView`   `/historia`
    `ReminderOverviewView`   `/prehlad`
- Intent sources: prompts/_done/_common/reminders/README.md, R1-correctness-sweep.md,
  R9-overview.md, R12-occurrence-preview.md, R5-server-table.md, R7-admin-gating.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Invoke the claude-in-chrome skill, then load the Chrome MCP tools in ONE ToolSearch call.
Call tabs_context_mcp first, then create your own tab. Never reuse a tab from another
session. Never trigger a browser-native alert/confirm/prompt.

Known for this unit — verify each, do not assume:
- FRAMEWORK unit (src/_common/modules/reminders/). Tag every finding [framework].
- All five routes carry `meta: { requiredRole: 'admin' }`, but THIS APP HAS NO ROLE MODEL
  — its auth adapter answers true to every role getter, so the guard always passes and
  these pages are reachable by any signed-in user. "Is this correctly gated?" is therefore
  NOT a question you can answer from this app. Do not file it as a finding either way.
- R7 says authorization lives in route meta ONLY, and explicitly says not to re-add an
  in-view isAdmin guard. Do not suggest one.
- Cron expressions are QUARTZ, not Unix: 6-7 fields, seconds first, 1 = Sunday, evaluated
  in UTC. A 5-field expression is invalid. Do not report Quartz syntax as a bug.
- R5 is about adopting the shared server-table composable — check paging, sorting and
  filtering are server-side and reflected in the URL.
- Read-only unit: no mutation pass. Do NOT trigger a reminder dispatch, a replay or a
  bulk action — those send real notifications. Document the controls and stop.

Do only this unit. Do not continue to another one.
```
