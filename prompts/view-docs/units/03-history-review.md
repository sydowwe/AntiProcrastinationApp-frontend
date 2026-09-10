# Unit 03 — history-review

Module: `activityHistory`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

This unit is read-only — no mutation pass.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `history-review`
- Module: `activityHistory`
- Pass: `inventory`
- Views & routes:
    `HistorySummaryView`   `/activity-history`
    `HistoryCalendarView`   `/activity-history/calendar`
    `HistoryDetailView`   `/activity-history/detail`
- Intent sources: prompts/_done/activity-history/README.md, H1-correctness-sweep.md,
  H6-url-state-and-drilldown.md, H7-empty-states.md, H8-export.md, H10-insights.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Invoke the claude-in-chrome skill, then load the Chrome MCP tools in ONE ToolSearch call.
Call tabs_context_mcp first, then create your own tab. Never reuse a tab from another
session. Never trigger a browser-native alert/confirm/prompt.

Known for this unit — verify each, do not assume:
- `/activity-history/detail` is an ORPHAN CANDIDATE: it has no sidebar entry and nothing
  in the nav links to it (docs/views/_routes.md). H6 is about drill-down, so it is
  probably meant to be reached by clicking through from Summary or Calendar. Establish
  which — find the control that navigates there, or record that none exists. This is the
  most valuable thing you can settle in this unit.
- Many components mounted by these views live in src/core/historyDashboard/. That is a
  component library for this module and the one sanctioned cross-module exception in
  CLAUDE.md — do NOT report it as a boundary violation.
- Read-only unit: no mutation pass. Filters, sorting, range pickers and export are safe;
  do not create or delete history entries (unit 4 owns that).
- H8 covers export — exercise it, but note what it downloads rather than opening files.
- Recent commits post-date the intent sources: 13f3c61c shared the export/insights shell
  between Summary and Detail, 32a99e98 extracted the calendar day cell, 64ad48c8 replaced
  the hand-rolled URL query handling, f6af3c35 touched both views' icon buttons.

Do only this unit. Do not continue to another one.
```
