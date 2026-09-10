# Generator spec — build the per-unit prompt files

Pure templating: one row of the README's unit tables → one file. **No judgment, no verification, no
enrichment.** An enrichment pass adds per-unit known-issues and sharper intent sources afterwards; this step
must not attempt it.

Runs as Haiku, parallelisable by unit range — the output is fixed substitution into the skeleton below, so
agents cannot drift from each other.

---

## Inputs

- `prompts/view-docs/README.md` → the two unit tables, "App modules" (units 1–15) and "Framework modules"
  (units 16–19). Every field you need is in the row.
- Nothing else. Do not read `PROMPT-TEMPLATE.md`, `_routes.md`, the module prompt sets, or git history.

## Output

One file per assigned unit at `prompts/view-docs/units/<NN>-<unit-name>.md`, where `<NN>` is the unit number
zero-padded to two digits and `<unit-name>` is the table's unit name verbatim (e.g. `01-home.md`,
`11-leisure-backlog-picker.md`).

## Field mapping — copy verbatim, do not rewrite

| Skeleton placeholder | Comes from |
| --- | --- |
| `<NN>` | the `#` column, zero-padded |
| `<unit-name>` | the `Unit` column, without backticks |
| `<module>` | the `Module` column |
| `<views-and-routes>` | the `Views & routes` column, reformatted one view per line (see below) |
| `<intent-sources>` | the `Intent sources` column, backticks stripped, comma-separated |
| `<mutation-line>` | see below |

**`<views-and-routes>`** — the cell lists views separated by `;`. Put each on its own line, indented four
spaces, as `` `ViewName` `route` ``, preserving the cell's own wording including any parenthetical. Keep the
order given. Example cell:

> `TodoListsView` `/todo-list`; `TodoListView` `/todo-list/:id`

becomes:

```
    `TodoListsView`   `/todo-list`
    `TodoListView`    `/todo-list/:id`
```

**`<mutation-line>`** — from the `Mutation pass?` column:
- starts with "yes" → `For the mutation pass, paste the same block with `Pass:` changed to `mutation`.` and
  append the cell's parenthetical or dash-clause if it has one (e.g. "— all four write history", "use a
  throwaway account").
- "no" → `This unit is read-only — no mutation pass.`

## Skeleton — reproduce exactly, substituting only the placeholders

````markdown
# Unit <NN> — <unit-name>

Module: `<module>`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

<mutation-line>

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `<unit-name>`
- Module: `<module>`
- Pass: `inventory`
- Views & routes:
<views-and-routes>
- Intent sources: <intent-sources>

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Invoke the claude-in-chrome skill, then load the Chrome MCP tools in ONE ToolSearch call.
Call tabs_context_mcp first, then create your own tab. Never reuse a tab from another
session. Never trigger a browser-native alert/confirm/prompt.

<!-- KNOWN-ISSUES -->

Do only this unit. Do not continue to another one.
```
````

Leave the `<!-- KNOWN-ISSUES -->` marker in place, alone on its line. The enrichment pass replaces it. Do not
write anything in its place and do not remove it.

## Rules

- **Verbatim means verbatim.** Do not correct, expand, abbreviate or improve any field. If a cell looks wrong,
  copy it as-is and mention it in your report.
- **Do not add sections**, notes, checklists or commentary to the generated files.
- **Do not create `units/_done/`** or move anything — that is handled separately.
- Files are UTF-8. Keep the em dashes and backticks as written.

## Report back with only this

```
Units generated: <NN list>
Files: prompts/view-docs/units/<...>
Cells that looked malformed (copied as-is anyway): <list, or "none">
```
