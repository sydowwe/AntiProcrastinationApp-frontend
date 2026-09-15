# Unit 10 — todo-routine

Module: `todoList`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `todo-routine`
- Module: `todoList`
- Pass: `mutation`
- Views & routes:
    `RoutineToDoListView`   `/routine-todo-list`
    `RoutineSettingsView`   `/routine-settings`
- Intent sources: prompts/_done/todo-motivation/README.md, R1-streak-freeze.md,
  R2-fresh-start-review.md, N2-defuse-overdue.md, S1-progress-bars.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak BEFORE you reach the locale sweep
  below, that is the failure this line has always meant — stop and report. Once you are
  deliberately in the sweep, Slovak is expected.

THIS IS A RE-RUN, and every app-side finding from round 1 is already code-fixed (round 3,
2026-09-13 — see docs/views/todo-routine/findings.md). So this pass is mostly
VERIFICATION, not discovery: for each finding below, run its own `Verify:` block and
record pass/fail. Re-file something only if it genuinely fails. The docs you are updating
already exist — add a round, do not start them over.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Drive the browser with playwright-cli, per CLAUDE.md's "Browser verification" section —
including its sign-in and state-load sequence. Use your own session and run
`playwright-cli close` when you finish. Prefer `find` over `snapshot`. Charts are echarts
on <canvas> and are invisible to the snapshot: read them from the populating response,
an eval, or a screenshot — never report one as empty on snapshot evidence alone.

Three checks this pass MUST make that an ordinary English-only pass cannot:

1. A SHORT SLOVAK SPOT-CHECK, for findings B4 and B6 only. Both were hardcoded English
   literals, not missing keys — so in English a fixed string and an un-localized one render
   identical text and EN proves nothing. Slovak is the only thing that distinguishes a
   string that goes through `$t()` from one that never did.
   Keep it to two screens; you are NOT sweeping the app for un-localized text. That class
   is now caught statically by `@intlify/vue-i18n/no-raw-text` in `eslint.config.ts`, which
   covers raw text nodes AND `label`/`title`/`hint`/`placeholder` attributes across every
   `.vue` file, and `npm run lint` is at 0 errors. So a hardcoded literal anywhere in `src`
   is already a lint failure — do not spend browser time re-finding them.
   How: /user/settings → Appearance → the language select → Slovak. Then check
   /routine-settings (title, Add button, column headers, and the add/edit dialog's labels
   and hints) and /routine-todo-list (the streak flame's tooltip, which needs an item with
   streak > 0). Anything still in English is a `bug` that survived the fix.
   THEN SWITCH THE ACCOUNT BACK TO ENGLISH before you finish. This is a persisted account
   preference, not a session toggle — and e2e/fixtures/auth.ts pins these accounts to EN
   precisely so label-based locators work, so leaving it in Slovak breaks the e2e suite
   for everyone after you. Confirm the revert took before you close.
   While you are in Slovak, also re-check P1 ("Total count" clipped). P1 was FOUND in
   English and is checkable there, but the Slovak label "Celkový počet" is longer than
   "Total count", so a fix that looks right in EN can still clip in SK. Check both.

2. THE ANCHOR-DAY COLUMN on /routine-settings — the "Reset anchor" column, on a period
   whose length is NOT week-aligned (>14 days, so Monthly/Yearly). It used to render a
   hardcoded `${value}th`, i.e. "1th"/"2th"/"3th". It now goes through
   `Intl.PluralRules(..., 'ordinal')`, so: EN must show 1st / 2nd / 3rd / 4th / 21st,
   and SK must show "1." / "21." — the same number with a period, for every day. If a
   seeded period has resetAnchorDay 0 the column shows "—" and proves nothing; edit one
   to a day like 1, 2, 3 or 21 to exercise it, and put it back afterwards.

3. THE MULTI-COUNT COUNTER HIT-TEST — genuinely open, and NOT settled by the accessible-
   name fix that just landed. TodoListItemCounter.vue swaps its two branches on VHover:
   the decrement button renders under `isHovering`, the increment target (a
   VProgressLinear) under `v-else`. By construction a real mouse must already be hovering
   in order to click, which argues the increment branch can never receive a mouse click —
   yet todo-lists/U2 recorded a single click on a fresh 2/5 item incrementing it to 3/5.
   Those two do not agree and source cannot settle it. Settle it live: on a multi-count
   item, find the element under the cursor IMMEDIATELY BEFORE the click, click it, and
   record which of `minus` / `increment` actually fired and what the count did. If
   increment is genuinely unreachable by a real mouse — as opposed to reachable only via
   Playwright's synthetic event ordering — that is a NEW `bug`, on top of A1.
   This one mutates a seed row, so read the mutation rules in CLAUDE.md's "Mutating
   specs" section first: prefer creating your own item over touching a fixture-pinned one.

Known for this unit — verify each, do not assume:
- `/routine-settings` is an ORPHAN CANDIDATE — no sidebar entry, nothing found linking to
  it (docs/views/_routes.md). CLAUDE.md requires EVERY settings page to be reachable from
  /user/settings, via ModuleSettingsSection which links by route NAME. Check whether it is
  listed there. If not, that is a finding.
- CLAUDE.md records that routineReviewStore has the reset half of its sign-in watcher but
  NOT the reload half — so after a second sign-in in the same tab its data may be empty or
  stale where activityOptionsStore's would refresh. Worth probing if you can sign out and
  back in without losing your session for the rest of the pass; if you cannot, record it
  as unverified rather than risking the pass.
- The sibling unit todo-lists (unit 9) is already documented: docs/views/todo-lists/.
  Read its inventory — these views share components and composables, and a defect already
  filed there should be cross-referenced, not re-filed.
- Recent commits post-date the intent sources: aef2b653 split RoutineToDoListView into
  four composables, 00bcc3fe extracted useUndoableListCrud shared with TodoListView.
- A2 and A3 are recorded as `fixed, needs retest only` — confirmed by source, never
  re-driven. Run their `Verify:` blocks and close them or reopen them; do not take the
  status line's word for it.
- U1 and U2 WERE seed gaps and are not any more (2026-09-14). `backend/_done/B8-routine-streak-
  history-seed.md` is closed: the `e2e-v4` fixture seeds 16 real `RoutinePeriodCompletion` rows
  on Weekly (met / missed / one frozen) and 16 on Daily, and four extra daily items with streaks
  45 / 120 / 200 / 400 so every `getMilestoneIcon` tier renders. The previous paragraph here
  ("unreachable by construction") described `e2e-v3` and is superseded.
  **The rule has therefore flipped: against a v4-seeded database, an empty weekly-review card,
  an empty heatmap or a missing milestone icon IS a defect** — file it as a new `B` finding in
  `findings.md`. Do not reopen B8 and do not write a second seed ask.
  **Both are now VERIFIED** (round 6, 2026-09-14, live against a fresh v4 seed — see *Round 6
  browser pass* in `findings.md` for the observed values per surface and the three screenshots).
  Before trusting the screen on a re-run, confirm `fixture: 'e2e-v4'` in the seed response: the
  running API can be v4 while the database is still an older seed. Do not spend the Weekly
  freeze (`31 Aug – 7 Sept`, the only frozen row) — a future spec consumes it.
  New polish finding from that pass: `P2`, weekday chips overflow the Daily column at 1440 px.
- THE COUNTER HIT-TEST IS NOW A PROBABLE BUG, not an open contradiction. `_fix-queue.md`
  re-graded it: what looked like two disagreeing pieces of evidence is "one probable bug plus
  a Playwright synthetic-event artifact", needing one confirmation. Read that entry before
  you test it — and note it caveats A1's retest, since a control can carry a correct
  accessible name and still be unreachable by a real mouse.
- **The two backend escalations are settled (round 4) — do not re-open them.** Deleting a
  time period does NOT cascade: the FK is `Restrict` and the delete is refused with a 409,
  test-covered server-side. And the streak does NOT compound on repeated toggling — the
  increment is once per cycle, guarded and tested; an accidental tick costs a bounded +1.
  Both are written up in findings.md with the source references.
- **B9 is the one finding whose defect AND fix were both never seen on screen.** It was filed
  and code-fixed in the same source-read round: deleting a period that still has routines used
  to show "This record was changed by someone else. Refresh the page and try again." (false on
  both counts), and `onDelete` now owns that 409 and names the period plus its routine count.
  **Verifying it is the highest-value thing in this pass** — everything else here has at least
  been observed once in some state. Do it safely: create your own period, assign one item to
  it, then delete the period. **Do not delete a fixture period** — the delete will be refused
  anyway, but the item you assign must be yours. Check both branches if you can: with the
  count available (the normal path) and, if you can make the grouped fetch fail, the
  count-less fallback sentence.

Do only this unit. Do not continue to another one.
```
