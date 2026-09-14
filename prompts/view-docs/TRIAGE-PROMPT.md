# Triage prompt — build the fix queue

Run this as **Opus 5, high effort**, in a session with **no browser**. It reads finished units off disk and
maintains two files. It fixes nothing and it opens nothing in a browser — if you find yourself wanting to check
the app, the finding you're checking is under-evidenced and that is itself the finding.

Run it after a batch of units completes (every 4–5 units, or once at the end). It is re-runnable: a later pass
edits the queue in place and **appends** to the log. The queue holds open work only; everything that explains
*how* the queue got to its current state goes to the log. Eleven in-place passes at ~410 KB is what happens
when the two are one file — that is why they are split.

---

## Prompt — paste from here down

You are triaging the findings from a view-documentation sweep of this app. Work in the repo root. This is a
Windows machine — use the **PowerShell tool** for shell commands, never Bash. `CLAUDE.md` auto-loads.

**Do not open a browser. Do not edit any source file. Do not fix anything.** You touch exactly two documents:
`docs/views/_fix-queue.md` (the queue — open work only) and `docs/views/_fix-queue-log.md` (the audit trail).
Read both first if they exist; a later pass builds on them rather than starting over.

### Inputs

Read, in this order:

1. `prompts/view-docs/README.md` — the runbook, for the unit table and the rounds model
2. `docs/views/_routes.md` — the route manifest and coverage tracker
3. Every `docs/views/*/findings.md` that exists, plus the `## Findings` section of
   `docs/views/_shell/inventory.md` (the shell keeps its findings inline)

Read the corresponding `inventory.md` only when a finding is ambiguous without it. You do **not** need the
`usecase.md` files.

### What you are producing

`docs/views/_fix-queue.md` — every finding with `Status: open`, **batched by root cause**.

A batch is a unit of work for one fixing session. Findings belong in the same batch when one edit, or one
coherent set of edits to the same concern, closes all of them. This is the entire point of the exercise: unit 9
and `_shell` between them reported seven icon-only controls with no accessible name. That is **one** batch, not
seven tickets — a per-finding queue would have a fixing agent open the same files repeatedly and reach seven
slightly different conclusions about what to name things.

### Batching rules — apply in this order

1. **Never mix app-side and `[framework]` findings in one batch.** `src/_common/` is a git submodule that other
   apps depend on; its fixes are a commit in `vue_framework` plus a pointer bump in this repo, in that order.
   An "identical" defect appearing in both places is **two** batches. Say so explicitly when it happens.
2. **Never mix a backend ask with a frontend fix.** A finding whose cause is server-side (a dispatch template,
   a missing endpoint, a nullable contract) cannot be closed by editing `src/`. Group those into a separate
   *Escalations* section — describe the ask, do **not** write a backend prompt file for it.
3. **Group by cause, not by symptom.** Two raw i18n keys in different modules are one locale-mirroring batch.
   Two unrelated 404 handling gaps are two batches even though both are "unhandled error".
4. **A finding whose fix would change a framework-wide default is always its own batch**, however small it
   looks — it affects every app on the framework and needs a decision, not a patch.
5. **`unverified` findings never go in a fix batch.** They go in a separate *Needs verification* section saying
   what data or state would settle each. Many will be seed-data gaps rather than defects.
6. **`opportunity` findings never go in a fix batch.** They are inputs to `docs/opportunities.md` later. List
   them under *Deferred to opportunities* and move on.

### Challenge the findings — do not just reorganise them

You are the first reader who sees every unit at once, and the agents that wrote these could each see only one.
For every finding, ask:

- **Is the evidence real?** A finding whose Evidence says "source read only" was not observed. Keep it, but
  drop it to `unverified` and say why. A `Repro` block listing steps nobody executed is worse than no finding.
- **Is the severity honest?** Re-grade rather than inherit. State it when you change one.
- **Is it actually a duplicate?** Two units reporting the same underlying defect from different routes should
  collapse into one entry with both ids, not appear twice.
- **Is the expectation sourced?** "Expected" must point at an intent source, a CLAUDE.md rule, or plain user
  sense. An expectation that is really the agent's taste should be re-graded to `polish` or dropped.
- **Does it contradict another unit's finding?** Say so loudly; that is the most valuable thing you can find.

### Output format — the queue (`docs/views/_fix-queue.md`)

Only open work lives here. **No pass narrative, no `✅ FIXED` batch bodies, no contradiction prose.** Update the
header line's counts in place. Keep a batch's row in the *Summary* table when it closes (mark it ✅ so numbers
stay traceable) but **move its body to the log**; the same for a *Needs verification* item once it is settled or
confirmed-and-fixed. Never renumber — reserve a number if a batch collapses, and say so in the log.

```markdown
# Fix queue

> Built <date> · commit `<sha>` · units triaged: <list> · findings considered: <n> · batches: <n>

> Closed batches, closed verification items, the per-pass narrative and the *Contradictions & re-grades* audit
> trail live in [`_fix-queue-log.md`](_fix-queue-log.md). This file holds only open work.

## Summary
| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F1 | ... | app / **framework** | B1, A2, ... | low/med/high |

---

## F<n>. <batch title>
- **Scope:** app-side `src/core/...` | **[framework]** `src/_common/...` (submodule commit + pointer bump)
- **Closes:** `<unit>/B1`, `<unit>/A2`, `_shell/A2` …
- **Root cause:** <one paragraph — the single thing that is wrong>
- **Files:** <paths, with line numbers where the findings gave them>
- **What to change:** <concrete enough that a fixing session needs only this batch and the named findings —
  not the inventory, not the usecase doc>
- **Do not change:** <the adjacent thing that looks in scope but is not, if there is one>
- **Verification:** <point at the `Verify:` blocks of the findings it closes; add any batch-level check>
- **Risk:** <what this could break — especially for framework batches, which ship to other apps>

## Escalations (backend / outside this repo)
## Needs verification (unverified findings, and what would settle each)
## Deferred to opportunities
```

Keep each batch body to what a fixing session needs. `Root cause` and `What to change` are the payload;
`Closes`, `Files`, `Verification` and `Risk` are one line each where they can be — point at the finding's own
`Verify:` block rather than restating it.

### Output format — the log (`docs/views/_fix-queue-log.md`)

Append-only, never rewritten. Every pass adds **one** entry under *Pass history* (newest first, dated, with the
commit and the unit(s) absorbed — what changed in the queue and why, in one paragraph) and its
*Contradictions & re-grades* material. Everything that leaves the queue lands here.

```markdown
# Fix queue — log

> Audit trail for `_fix-queue.md`. Nothing here is open work.

## Pass history (newest first)
> **<Nth> pass, <date>, commit `<sha>` — unit <n> `<name>` absorbed.** <one paragraph>

## Closed batches
<batch bodies moved here verbatim when their fix is verified, `✅ FIXED <date>` line on top>

## Closed verification items
<Needs-verification sub-sections moved here verbatim once settled or confirmed-and-fixed>

## Contradictions & re-grades
### Contradictions
<numbered §, continuing the existing sequence — do not restart>
### Re-grades
<Every severity you changed, every finding you merged or dropped, and why. This is how a human audits your
judgement — do not omit it even when short.>
```

### Report back with only this

```
Triage complete.
Files: docs/views/_fix-queue.md (queue) · docs/views/_fix-queue-log.md (log, appended)
Units triaged: <n>  ·  findings considered: <n>
Batches: <n> app-side · <n> framework · <n> escalations
Re-grades: <n>   Merged as duplicates: <n>   Dropped: <n>
Largest batch: F<n> — <title> (closes <n> findings)
Contradictions found: <list, or "none">
```
