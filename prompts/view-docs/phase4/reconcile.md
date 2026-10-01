# Phase 4 reconcile — app

Run as **Opus 5, high effort, clean context, no browser.** Run only after **all six** group extracts exist in
`docs/data-map/`: `todo`, `planner`, `history`, `tracking`, `leisure`, `account`. It does not need the submodule
units. Framework modules get their own map (`submodule.md`).

```
You are running the reconcile step of Phase 4 of the view documentation pass. Six extraction
sessions each mapped one group of app units field by field. Your job is to merge their six
files into the two app-wide documents they exist to feed. Read
prompts/view-docs/phase4/TEMPLATE-extract.md first, for what the extracts contain and what
their status values mean. Do not re-run its procedure.

Inputs, and only these:
- docs/data-map/{todo,planner,history,tracking,leisure,account}.md (all six). If any is missing,
  stop and say which.
- docs/views/glossary.md, for vocabulary.
- Source files in src/ only to settle a disagreement between two extracts. Say when you did.
Do NOT read the unit docs (usecase/inventory/findings). The extracts already distilled them, and
re-reading 100k tokens of them is the thing this split exists to avoid.

Hard constraints:
- No browser, no backend calls, no edits to src/ or to any unit doc.
- Write exactly two files: docs/data-map.md and docs/opportunities.md. Leave the six extracts in
  place; data-map.md links to them.
- This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.

## Step 1: reconcile the cross-module reads

Every extract has a "Cross-module reads" table, written from the reader's side or the owner's
side but never both. Join them on `Entity.field`:
- a read the owner marked `unread` but a reader lists → the owner was wrong: it is `spent`;
- a field two groups classified differently → settle it from source, name the file:line;
- a read listed by the reader that the owner's table doesn't have at all → add the row.
Record every correction you make. That list goes in data-map.md's "Corrections" section.

## Step 2: write docs/data-map.md

    # Data map

    > Reconciled <date> · commit `<sha>` · from docs/data-map/<six files> · app modules only
    > (framework modules: docs/data-map/framework.md)

    ## How to read this
    <The status vocabulary in five lines, and a pointer to the per-group extracts for full tables.>

    ## Unspent data: the backlog
    <THE point of the document. Every field whose final status is unread, echo or write-only,
    grouped by module. One line each: field, what it is, where it is captured, and a sentence on
    what reading it could give the user. Order by how cheap and valuable it looks, not
    alphabetically.>

    ## Server sends, client drops
    <Merged from all six. Separate entries that look deliberate from ones that look like gaps.>

    ## Cross-module data flow
    <A table, owner module → reader module → fields → purpose. Then 3–6 lines on what the flow
    shows. Which modules are pure producers? Which is the hub? (Probably home and activity.)>

    ## Time-bearing fields
    <Every field marked time: yes, as one table: entity.field · module · what the time means
    (deadline / start / duration / recurrence / period / audit) · status. This table is the
    input to backend-notification-audit.md, so make "what the time means" precise. A due date
    and a created-at are both datetimes, and only one of them could drive a reminder.>

    ## Per-module summary
    <One short block per module: field counts by status, the extract file to read for detail.>

    ## Corrections
    <Every correction from step 1, and every extract "Contradictions" entry that changes a
    conclusion.>

    ## Unsettled
    <Every `?` still open after step 1.>

## Step 3: write docs/opportunities.md

Inputs: every extract's "Opportunities" table, plus data-map.md's "Unspent data" and
"Server sends, client drops" sections.

1. Drop opportunities whose Status is fixed or wontfix into a short "Closed" list at the end,
   one line each with the reason. Don't discuss them.
2. Cluster the rest by the capability they would add, not by unit. Two units noticing the same
   unused field is one opportunity.
3. Add an opportunity for every "Unspent data" entry that no O-finding already covers, and mark
   it `from data-map` so it's clear no unit agent proposed it.

Per cluster:

    ### OP<n>. <capability, in user language>
    - **Source:** <O ids with their unit, and/or "from data-map">
    - **Data it spends:** <Entity.field list: what already exists>
    - **Where it would surface:** <view or module>
    - **Needs backend:** no | yes: <what, one line>. Do NOT write a backend ask file.
    - **Size:** S | M | L, with one line on why
    - **Value:** <one or two sentences: which user situation from the usecase docs this serves>

Order the clusters by value against size, best first. Open the file with a 5–10 line
"Top picks" list.

## When you are done

End with only this:

    Phase 4 reconcile: app
    Files: docs/data-map.md, docs/opportunities.md
    Unspent fields: <n> (unread <n> · echo <n> · write-only <n>) · server-drops: <n>
    Time-bearing fields: <n>
    Corrections to the extracts: <n> · still unsettled: <n>
    Opportunities: <n> clusters (<n> from O-findings, <n> from data-map only) · closed: <n>
    Top 3: <OP ids and one-line names>
```
