# Unit 12 — leisure-bucket-anchors

Module: `leisure`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `leisure-bucket-anchors`
- Module: `leisure`
- Pass: `inventory`
- Views & routes:
    `BucketListView`   `/leisure/bucket-list`
    `MemoryAnchorsView`   `/leisure/memory-anchors`
- Intent sources: prompts/_done/leisure/README.md, B1-close-the-loop.md,
  M1-memory-timeline.md, B2-comfort-zone-ladder.md, L2-correctness-pass.md

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
- These two are one unit because B1 ("close the loop") treats a memory anchor as the
  COMPLETION of a bucket-list item — MemoryAnchor already carries hasBucketList and
  backlogIsOneTime, so the backend models the link even if the UI does not. Check whether
  completing a bucket-list entry can produce an anchor, and record it either way.
- L2 lists a CONFIRMED, SPECIFIC defect here: the rating scale is unreachable above 5 —
  NewMemoryAnchorForm.vue takes 1–10, MemoryAnchorTable.vue renders "/10" with thresholds
  at 8 and 5, but MemoryAnchorsView.vue:37 filters min:1 max:5. L2 claims to fix it.
  VERIFY WHETHER IT DID — this is a precise, cheap check and a real bug if it survived.
- L2 also lists a cross-module import violation in NewBucketListProfileForm.vue:47
  (imports @/core/activity/composable/, forbidden by CLAUDE.md). Check it was fixed.
- M1 wants anchors as a timeline rather than a table. Record what the view actually is
  now; if it is still a plain table, that is an `opportunity`, not a bug.

Do only this unit. Do not continue to another one.
```
