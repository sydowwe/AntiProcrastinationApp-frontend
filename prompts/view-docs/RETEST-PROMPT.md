# Retest prompt — confirm or reopen fixed findings

Run this as **Sonnet 5, medium effort**, in **one browser session** (`playwright-cli`). It runs only the `Verify:`
blocks of findings whose fix has never been confirmed **live in a browser**. It is not a re-crawl. It fixes nothing and
documents nothing new. The one exception is a regression the agent sees while running a `Verify:` block. That gets one
line in the unit's round-history row (see *Out of scope*).

This is the *Retest round* from [`README.md`](README.md) → *Rounds*. Run it after a fix round has emptied
`_fix-queue.md`, and **before** the next triage pass. Triage needs to know which fixes did not hold.

### The per-unit files — the usual way in

[`retest/`](retest/) has one ready-to-run file per unit, numbered in the recommended order. Each file already
contains the list of findings to retest and the unit's traps, and it points back here for the rules. Open a fresh
session, give it the file (`@prompts/view-docs/retest/01-todo-lists.md` is enough), and let it run. When it
finishes, move the file to `retest/_done/` and start the next one. **Do the steps below once, before the
first file**, not before every file.

The lists are a snapshot taken on 2026-09-24. The agent re-reads every `Status:` line before acting, so a
finding verified since then is skipped rather than retested twice.

The fenced header below is only for a hand-built run, for example after a later fix round, before anyone has
regenerated `retest/`.

### Before you paste it (operator)

1. **Check that the queue really is empty.** Every batch the retest will cover must already be moved to
   `_fix-queue-log.md`. A batch still in `_fix-queue.md` is unfinished, so do not retest its findings yet.
2. **Reconcile stale `Status: open` lines.** A finding the queue or the log says is closed, but whose unit file
   still says `open`, should be updated by hand first. Otherwise the agent reports it as out of scope and you
   do the same work after the run instead of before it.
3. **Run the cheap checks first, and keep a record of them:** `npm run type-check` (should report 0 errors, and
   check the exit code), `npm run lint`, then `npm test --prefix e2e`. **The e2e run reseeds the database**, so do
   it before the retest and never during it. A failing spec is a reopened fix you have found for free. Paste the
   spec names that failed into the `Known failing specs:` line below.
4. **Hand-built runs only: set the scope.** (The `retest/` files already do this, one unit per session.) About 90 findings qualify on the first run, which is too many for one context. Split them
   by unit across **consecutive** sessions, never parallel ones: some `Verify:` blocks click checkboxes and
   delete rows, so two retests running at once would corrupt each other's seed data. A good split is:
   - Session 1: `todo-lists`, `todo-routine`, `home`, `planner-day`, `planner-templates`
   - Session 2: `activity-settings`, `history-capture`, `history-review`, `tracking-dashboards`, `tracking-settings`
   - Session 3: `leisure-*`, `user-settings`, `auth`, the framework units (`reminders-*`, `notifications`, `scheduler`), `_shell`
5. **Hand-built runs only: fill in the four lines** at the top of the fenced block. With a `retest/` file,
   add the failing spec names to your first message instead, if there were any.

---

## Prompt — paste from here down

```
Units: <comma-separated unit folder names under docs/views/, or "all">
Reseed at start: <yes | no — yes only if no other session is using the API>
Known failing specs: <spec file + test title from the pre-run e2e pass, or "none">
Commit: <short sha of HEAD>
```

You are running the **retest round** for a view-documentation sweep of this app. Work in the repo root. This
is a Windows machine, so use the **PowerShell tool** for shell commands, never Bash. `CLAUDE.md` loads
automatically. Its *Browser verification* section is the authority for signing in, and you must follow it
exactly.

**Do not edit any source file. Do not fix anything, even a one-liner.** You write to exactly two places in each
unit's `docs/views/<unit>/findings.md`:

1. the `- **Status:**` line of each finding you retested, and
2. one new row at the bottom of that file's `## Round history` table.

Nothing else. Do not edit `_fix-queue.md`, `_fix-queue-log.md`, `inventory.md`, `usecase.md` or any spec.
Triage reads your output and does the queue work.

### 1. Build the retest list before you open a browser

**If you were started from a file in `prompts/view-docs/retest/`, that file's list is your scope.** Do not
rebuild it. Still re-read each listed finding's current `Status:` line, and skip any finding that has been
live-verified since the list was written (note it as *already verified* in your report). Then read its
`Where:`, `Verify:` and log note as described below, and continue from §2.

Otherwise, for each unit in scope, read `docs/views/<unit>/findings.md` (for `_shell`, read the `## Findings` section of
`docs/views/_shell/inventory.md`). A finding is **in scope** when its `Status:` says it is fixed but does not
claim a **live** verification. The status lines are not uniform, so read them rather than pattern-matching:

| Status reads like                                                          | In scope?                                                     |
|----------------------------------------------------------------------------|---------------------------------------------------------------|
| `fixed`, `fixed in code`, `fixed <date>`, `fixed in working tree, not browser-reverified` | **yes**                                         |
| `fixed and verified by source read`, `verified in code`                    | **yes**, because a source read is not a live check           |
| `fixed and verified` / `verified, passes` with a round that drove the browser | no, unless the *Known failing specs* line names it         |
| `open`, `unverified`, `stale`, `settled`, `resolved`, opportunity (`O*`)   | no. List any `open` finding the log calls closed under *Status drift* in your report |

Also bring into scope any finding that a **known failing spec** covers, whatever its status says.

Write the list to your first message as a table (`unit · id · one-line title · why in scope`) before doing any
browser work. If it has more than about 35 rows, stop and tell the operator how you would split it, then wait
for an answer. Do not start a run you cannot finish in one context.

For each in-scope finding, also read its `Where:` and the log's `✅ FIXED` note for the batch that closed it
(search `_fix-queue-log.md` for the finding id and unit). The FIXED note says what the fixing session checked
and what it did **not**. That second part is what you are here to check.

### 2. Environment

- **One named session for the whole run:** `-s=retest` on **every** `playwright-cli` command. Run
  `playwright-cli list` first. If another session is live, do not reseed and do not `state-load` a file it may
  be using. Sign in through the form instead.
- **Reseed only if the header says `yes`**, and only once, at the start: `POST https://localhost:8080/api/test/seed`.
  A reseed wipes every account, so never do it mid-run. After a reseed, every `e2e/.state/auth-*.json` is
  dead, so sign in fresh.
- **Signing in:** follow CLAUDE.md in this order: `state-load` → `reload` → `eval "location.pathname"` →
  **`state-save` back to the same file every time**. Refresh tokens rotate, and loading an unsaved file a
  second time signs the account out everywhere. Credentials are in `e2e/.state/seed.json`. `/auth/login` allows
  **5 sign-ins per minute per IP**, so reuse a session rather than signing in per finding.
- **Which account:** `primaryUser` by default. `reminders-admin` findings need `adminUser` (10003).
  `user-settings` isolation findings need `secondaryUser`. `auth` findings run signed out, so run them last
  in the session so that signing out does not cost you a sign-in.
- **The first load of a fresh browser fails with `ERR_CERT_VERIFIER_CHANGED`; reload once.** A burst of
  401s straight after `state-load` is the token refresh and not a defect. A 401 on `POST /api/auth/refresh`
  itself means another session rotated your token. Stop and report it.
- **Dates come from `seed.seedDateUtc`**, never from the local clock. `/day-planner/:date` takes `dd-MM-yyyy`.
- **Vue warnings log at `info`, not `warning`.** Use `playwright-cli console info` when a `Verify:` block
  asks for a clean console.

### 3. Running each `Verify:` block

Work unit by unit. For each finding:

1. Run the `Verify:` block **as written**. Do not use the `Repro:` block: `Repro` shows the bug existed, and
   `Verify` proves it is gone. If the `Verify:` block cannot be run as written (a route has moved, a fixture
   row no longer exists, a control was renamed by a later fix), work out the closest equivalent from the
   finding's `Expected:` line. Say that you did so, and why.
2. Prefer `playwright-cli find` and targeted `eval` over a full `snapshot`. Take a screenshot **only** when
   the `Verify:` condition is visual (spacing, colour, overflow, clipping), and save it as
   `docs/views/<unit>/screenshots/retest-<date>-<id>.png`.
3. For a finding about locale or Slovak wording, switch the account to SK for that check and **switch it
   back to EN** before moving on.
4. **If the block mutates data**, undo the mutation before the next finding: un-toggle, delete what you
   created, restore what you edited. Record what you created and confirm it is gone. Residue left here
   becomes a false finding in the next unit's pass.
5. Give it one of three verdicts:
   - **pass**: every pass condition held, observed live.
   - **reopened**: a pass condition failed. Record the observed value next to the expected one.
   - **blocked**: you could not reach the state (missing fixture row, a precondition you cannot produce,
     an environment failure). Say exactly what was missing. **Blocked is not pass.**

Before you reopen anything, rule out your own setup: the wrong account, the wrong date format, a stale
tab, the filter default, a leftover from another session. Try the step once more from a clean
navigation. The earlier rounds of this sweep lost time to exactly these mistakes (see CLAUDE.md and
`UNIT-ORDER.md`).

### 4. Writing it back

Replace the finding's `- **Status:**` line. Do not append a second one. Use exactly one of these forms:

```
- **Status:** fixed and verified (retest <YYYY-MM-DD>, live) — <one clause of evidence: what you saw>
- **Status:** fixed and verified (retest <YYYY-MM-DD>, e2e `<spec file>` › `<test title>` passing) — <what the test asserts>
- **Status:** open — reopened by retest <YYYY-MM-DD>: <expected> vs <observed>. Fix batch: <Fn from the log>
- **Status:** fixed, retest blocked <YYYY-MM-DD> — <what was missing>
```

Use the e2e form only when the unit file names a spec as the check and the operator's pre-run e2e pass had
that test passing. Do not run the e2e suite yourself: its global setup reseeds the database.

Leave the rest of the finding exactly as it was. When you reopen a finding, add a `- **Retest:**` line directly
under the Status line with the full observation (the steps you took, the request or the snapshot evidence,
and the screenshot path if you took one). Reopened findings are what the next triage pass acts on, so give it
the evidence.

Append **one** row per unit to `## Round history`, with the round number one past the file's last row:

```
| <n> | <date> | `<commit>` | **retest round** — <k> retested live: <ids> pass; <ids> reopened; <ids> blocked (<why, briefly>). Account(s): <…>. Mutations made and reverted: <…, or none>. <Regressions seen outside the Verify blocks, one line each, or "none">. |
```

**Batch checks with no finding behind them.** Some fixes were filed straight into the queue and never had a
finding in any unit file. `F90` is one: an app-wide change, verified live on only some screens. A `retest/`
file lists such a check under its own `## Also:` heading. There is no `Status:` line to update, so record
the result as a clause in the same round-history row, for example
`F90 (MyBtnToggle): routine-form weekday picker passes`. A group that fails is a
**new defect**. Put it under *Reopened* in your report, tagged with the batch id, and let triage file it.
Do not write a finding for it yourself.

Write each unit's changes **as soon as you finish that unit**, not at the end of the run. That way a run
that stops halfway still leaves correct files for the units it finished.

### Out of scope

- **New defects.** If you notice something broken that is not what a `Verify:` block asks about, write one
  line in that unit's round-history row and move on. Do not file a finding, do not investigate, do not look
  up the cause. The next unit pass or triage will pick it up.
- **Source reading as evidence.** You may read source to understand *where* to click. You may not mark a
  finding `verified` because the code looks right. Earlier rounds already did that, and it is the reason
  this retest exists.
- **Backend escalations** (`§n` in the queue). Their fix is server-side, so they are not yours to retest.

### Final report

Keep it short. The files hold the detail.

1. A table of every retested finding: `unit · id · verdict · one line`.
2. **Reopened**: grouped by the fix batch (`Fn`) that closed them. Two reopened findings from one batch
   usually share a single cause, and triage should see that.
3. **Blocked**: grouped by what would unblock them (a seed row, an account state, an environment fix).
4. **Status drift**: findings marked `open` that the log calls closed, which you did not touch.
5. The seed state you left behind, and whether the next session can `state-load` or must sign in fresh.
6. Anything in this prompt that was wrong or unclear. That feedback is worth as much as the verdicts.
