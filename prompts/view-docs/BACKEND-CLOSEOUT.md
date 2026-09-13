# Backend ask close-out — runbook

Run this as **Opus 5 or Sonnet 5, high effort**, in a session **with a browser** and with the **API and dev
server running**. It settles the terminal state of every `backend/Bn-*.md`, moves the finished ones to
`backend/_done/`, and repoints every link that names them.

It is a **verification** pass, not a documentation pass. It edits markdown and moves files. It must not touch
`src/`.

**Why it exists:** the asks were written over several days against a moving backend, and at least two have
since gone stale in ways nobody noticed — `B6`'s headline screenshot no longer reproduces, and `B3`'s four
"known fixture gaps" are all seeded in the current fixture. Deleting them outright was considered and
rejected: the last round of deletions (`B1`, `B5`) left **six dangling links in `README.md`** that are still
there. The repo's own convention is a `_done/` folder — ten modules already use
`prompts/_done/<module>/backend/`, and the sweep's unit prompts use `units/_done/`.

---

## Prompt — paste from here down

You are closing out the backend asks of the view-documentation sweep. Work in the repo root. This is a
Windows machine — use the **PowerShell tool** for shell commands, never Bash. `CLAUDE.md` auto-loads.

**Do not edit anything under `src/`.** Do not write any new backend ask file. Do not delete any file.

### Hard constraints

- **Never round-trip a file's contents through the shell.** Use the Write/Edit tools. No
  `Get-Content x | Set-Content x`, no `sed -i`. This task is almost entirely markdown editing and these files
  are full of em dashes and arrows — a shell round-trip double-encodes every one of them (cp1252 hazard, see
  `CLAUDE.md`). This is the single easiest way to ruin this task invisibly.
- **Moving a file is `git mv`**, so history follows it.
- **Do not write a new `backend/Bn-*.md`.** Backend asks are written by the person who hits the defect, in
  the course of hitting it. An ask that is partly answered gets **updated in place**, not re-sent.
- **Verify every claim before acting on it.** Everything in the table below is what a previous session
  believed on 2026-09-13; the whole reason this runbook exists is that some of it was already wrong. A `✅`
  in that table is a hypothesis, not a fact.

### Prerequisites — confirm all four, and stop if any fails

1. **API running against a LOCAL Postgres**, base `https://localhost:8080` (see `.env.development`). If
   `POST /api/test/seed` answers 401, the endpoint is not registered — that means "not enabled here", never
   "log in first". Stop and say so.
2. **Dev server on `https://localhost:3000` exactly** — kill whatever holds the port rather than accepting a
   fall-forward to 3001/3002, or every guarded route bounces to `/login`.
3. **`playwright-cli` works** and `.playwright/cli.config.json` is present. Expect the first page load in a
   fresh browser to fail on the self-signed cert — one `reload` clears it. Expect a 401 burst on a stale
   token — the same reload clears that too. Neither is a defect.
4. **A fresh seed.** Re-POST `/api/test/seed` and re-read `e2e/.state/seed.json`; note that reseeding
   invalidates `e2e/.state/auth-*.json`, so sign in through the form afterwards. Credentials come from
   `seed.json`'s `primaryUser` — never hardcode them.

### How to probe a grid endpoint correctly

Three of the checks below are "does this grid still 500 on this sort key". Get the request body right or you
will answer the wrong question — that is exactly how `B5` came to be written as a backend ask for what was a
frontend bug. The wire shape is `FilteredTableRequest` → `BaseTableRequest` + `SortByRequest`, verified
against source:

```json
{
  "itemsPerPage": 25,
  "page": 1,
  "sortBy": [{ "key": "activity.name", "isDesc": false }],
  "useFilter": false,
  "filter": null
}
```

Note `useFilter`, not `hasFilter`, and `isDesc`, not `order` — the client maps `VSortItem.order` to
`SortByRequest.isDesc` on the way out (`src/_common/dto/request/base/SortByRequest.ts`).

Sign in through the form, then run each probe as a `playwright-cli eval` `fetch` from the signed-in page so
it carries the session. Record the **status and the response body**, not just the status.

### The seven asks — current belief, and what settles each

| ask | belief as of 2026-09-13 | what settles it |
| --- | --- | --- |
| `B1` test-seed endpoint | **delivered.** `global-setup.ts` calls it every run and the suite executes | No probe needed. Confirm `e2e/.state/seed.json` exists and `npm test` in `e2e/` reaches at least the first spec |
| `B2` grid 500 on unmapped `sortBy` | **probably deployed.** Unit 13 drove `/leisure/projects?view=table` and got rows with `sortBy=activity.name:asc` in the URL — but the confirming request was never run | Probe `activity-backlog-profile/grid` with `activity.name` → expect **200 with rows**. Then probe a deliberately unmappable key (`zzzNotAColumn`) and record what it does — B2's own closing note says the general class was not fixed, only specific keys, and that is worth stating as fact in the close-out |
| `B3` seed fixture coverage | **looks delivered.** The current fixture is `e2e-v2` (docs still say `e2e-v1`) and `counts` now carries `dayPlannerTemplates: 3`, `webExtensionEntries: 1050`, `desktopEntries: 630`, `androidSessions: 35`, `distinctDesktopEntries: 6`, `distinctAndroidEntries: 5`, `notifications: 6`, `unreadNotifications: 3` — i.e. all four of its named gaps | Counts are not renders. Load one view per surface and confirm **rows on screen**: `/day-planner/templates`, `/activity-tracking`, `/activity-tracking/desktop/settings/distinctEntries`, `/notifikacie`. All four were blocked on this ask |
| `B4` reminders-admin 403 | **open** — believed to be unit 17's only remaining gate | Probe all four routes: `reminder-definition/grid`, `reminder-definition/{id}`, `reminder-dashboard/upcoming`, `/dispatch-history`, `/overview`. 403 on any → stays open. 200 on all → closed, and unit 17 is unblocked |
| `B5` repeating-planner-task suggestions | **withdrawn, never sent.** It is a frontend bug: the route is `GET /repeating-planner-task/suggestions/{calendarId}` and the client sends `?date=`. Currently staged as **deleted** | Nothing to verify server-side. Restore it and move it to `_done/` — see *Mechanics*. Its value is the reasoning, which `README.md:239` cites by name |
| `B6` profile grid activity name | **half-answered.** A nested `activity` object shipped for `activity-project-profile/grid` (unit 13 captured it), so the ask's headline "renders `—`" screenshot no longer reproduces — but three questions are open | Probe **all four** profile grids and diff the row key sets. Then answer, from the bodies: (a) is `icon`/`color` nested under `activity.role` or flat on `activity`; (b) do all four grids agree; (c) does `activity` carry `categoryName`. **Update the file with the answers; do not move it unless all three are settled** |
| `B7` grid sort-key audit | **unconfirmed.** Its one concrete claim is that `memory-anchor/grid` still emits `activity.name` and 500s on a header click | Probe `memory-anchor/grid` with `sortBy: activity.name`. 200 → the remap covers it, ask closes. 500 → stays open, and say so in the file |

### What "closed" means, per outcome

- **Delivered** → `git mv` to `prompts/view-docs/backend/_done/`, and add a short block at the top of the
  file: what landed, the date, and the evidence you just captured (status + the telling part of the body).
  Do not rewrite the ask's body — a reader needs to see what was asked, not a summary of it.
- **Withdrawn** (`B5`) → same move, with the existing withdrawal reasoning left intact.
- **Partly answered** (`B6` is the likely case) → stays in `backend/`. Add a dated block recording what is now
  answered and strike the parts that no longer reproduce — in particular the "what it looks like on screen"
  section, which is stale. The remaining questions must read as the whole ask, so the next person doesn't
  re-answer the settled half.
- **Still open** → stays in `backend/`. Re-date it and correct any claim your probes contradicted. An ask that
  still says something false is worse than no ask.

### Mechanics

> **⚠️ Mechanics §1 is void — 2026-09-13.** Do not restore anything. The owner's call: `B5` stays deleted
> (it was withdrawn, and its one useful lesson is now inline in `README.md`), and `E2E-TEMPLATE-SEEDING.md`
> and `E2E-SEED-WIRING.md` were deleted too, both finished and both superseded by code — every inbound link
> has been repointed and nothing dangles. This runbook's claim that `E2E-TEMPLATE-SEEDING.md` was "also
> staged deleted" was **wrong**: it was present and committed at the time of writing.

1. **Restore the two staged deletions first.** `B1` and `B5` are `D` in the index but their content is in
   `HEAD`:
   `git restore --source=HEAD --staged --worktree prompts/view-docs/backend/B1-test-seed-endpoint.md`
   (and the same for `B5-repeating-planner-task-suggestions.md`). Then move them to `_done/`. The same applies
   to `prompts/view-docs/E2E-TEMPLATE-SEEDING.md`, also staged deleted and also still linked from
   `README.md:16` — `README` already describes it as "Done, and superseded — do not run", which is exactly
   what `_done/` is for.
2. **Create `prompts/view-docs/backend/_done/`** with a `.gitkeep`, matching `units/_done/`.
3. **Repoint every link.** Current inventory — re-run the search yourself, don't trust this list:
   - `prompts/view-docs/README.md` — `B1` at lines 471, 546; `B2` at 129, 210; `B3` at 16, 191-195, 211, 504;
     `B4` at 191, 212; `B5` at 213, 239; `B6` at 214; `B7` at 215. **Six of these are already dangling**
     (`B1`, `B5`, and the `E2E-TEMPLATE-SEEDING.md` link at 16).
   - `prompts/view-docs/UNIT-ORDER.md`
   - `docs/views/_fix-queue.md` — Escalation §4 is entirely about `B6`
   - `prompts/_common/api/A1-request-key-for-sibling-fetch-helpers.md`
   - `e2e/tests/leisure-profiles.spec.ts` — a header comment
   - the backend files cross-reference each other (`B7` cites `B6` and `B2`)
4. **Update `README.md`'s blocker sections for what you closed, and only that.** Its *Before you start a unit*
   tables are what gates unit selection, and they are known stale: Class 1 still lists unit 13's table view as
   a 500, and Class 3 still lists units 05, 06, 08 and 18 as having no fixture rows. If your probes closed
   `B2` or `B3`, those rows are wrong and the next operator will skip runnable units because of them. Update
   the *Backend asks* table at `README.md:206-215` to match the new state and paths.

### Out of scope — do not do these

- Fixing the frontend bug `B5` describes (the `?date=` vs `/{calendarId}` call). The working tree already has
  `repeatingPlannerTaskApi.ts` and `DayPlannerView.vue` modified — someone is mid-fix. Leave it.
- Anything in `docs/views/*/findings.md` except the `B6`-related escalation link.
- Ticking unit 13 in `_routes.md`'s coverage tracker. Real, flagged in the fix queue, different task.
- Opening a new ask for anything your probes uncover. Record it in the report and let the person who owns
  that surface write it.

### Two corrections to carry in, from the session that wrote this

Both are in `docs/views/_fix-queue.md` as built 2026-09-13 and both are wrong; fix them if your probes agree:

1. **Escalation §1 says `_shell/B1` (notification locale) is "not re-testable on the current seed — zero
   notifications".** The `e2e-v2` fixture seeds **6 notifications, 3 unread**. It is re-testable now. If the
   titles still render Slovak on an EN account, that escalation stands on real evidence for the first time.
2. **The fixture is `e2e-v2`, not `e2e-v1`.** `README.md`, `_fix-queue.md` and several findings files still
   say `v1`. Correct it where you touch it; don't sweep for it.

### Report back with only this

```
Backend close-out complete.
Probed: <n> endpoints  ·  API build: <date/sha if known>
Moved to _done/: <list>
Still open: <list, with the one-line reason each>
Updated in place: <list>
Links repointed: <n> across <n> files  ·  dangling before: <n>  ·  dangling after: 0
README blocker table: <what changed, or "unchanged">
Contradicted the incoming belief: <list, or "nothing">
New defects found while probing (not filed): <list, or "none">
```
