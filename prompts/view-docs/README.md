# View documentation & audit pass — runbook

A full sweep of every view in the app, producing three durable documents per unit plus a findings list.
The pass answers two questions: **what can this app do today**, and **what should it do next**.

**This file is for the operator.** Never hand it to a unit agent — it describes phases the agent must not act
on, and invites it to self-assign the next unit.

| File | For |
| --- | --- |
| [`units/`](units/) | **Start here.** One ready-to-paste prompt per unit, `01`–`19`. Move to `units/_done/` when finished. |
| [`PROMPT-TEMPLATE.md`](PROMPT-TEMPLATE.md) | The spec every unit prompt points at. Edit this to change how *all* units behave. |
| [`TRIAGE-PROMPT.md`](TRIAGE-PROMPT.md) | Opus, no browser. Turns findings into `_fix-queue.md`, batched by root cause. |
| [`GENERATE-UNIT-PROMPTS.md`](GENERATE-UNIT-PROMPTS.md) | Regenerates `units/` if the unit definitions change. Already run. |
| [`E2E-SEED-WIRING.md`](E2E-SEED-WIRING.md) | **Open task.** Finish the Playwright wiring now that `POST /api/test/seed` exists: mirror the `authorization` locale namespace into EN, flip the default locale, get `todo-lists.spec.ts` green, and write specs for the surfaces the old seed could never render. |

Output lands in `docs/views/` — this folder is the instructions, that is the product.

---

## What gets produced

| File | Per | Written by | Contents |
| --- | --- | --- | --- |
| `docs/views/_routes.md` | once | analysis session | Every route: path, params, guard, nav entry or orphan. The manifest that proves nothing was skipped. |
| `docs/views/_shell/inventory.md` | once | browser agent | Navbar, sidebar/rail, user menu, breadcrumbs, notification bell, dialog host, snackbars. Documented once so 19 units don't repeat it. (Its findings are inline under `## Findings` rather than in a separate file — the one exception to the layout below.) |
| `docs/views/glossary.md` | once | analysis session | Activity / task / routine / template / backlog profile / anchor / project. The overlapping nouns, defined. |
| `docs/views/<unit>/usecase.md` | per unit | browser agent | What it's for. Survives a redesign. |
| `docs/views/<unit>/inventory.md` | per unit | browser agent | What's on screen right now. Falsifiable by looking. |
| `docs/views/<unit>/findings.md` | per unit | browser agent | Every gap, severity-tagged, with evidence, `Status:` and `Verify:`. A living record across rounds, not a one-shot report. |
| `docs/views/<unit>/screenshots/` | per unit | browser agent | One per view per distinct state. |
| `e2e/tests/<unit>.draft.spec.ts` | per unit, **inventory pass only** | browser agent | Real assertions for the structural tier; named `test.fixme()` stubs for anything semantic. |
| `docs/data-map.md` | once, **last** | analysis session | Every field: where captured vs where read. The unread ones are your feature backlog. |
| `docs/opportunities.md` | once, **last** | analysis session | Cross-module synthesis of every `opportunity` finding. |
| `docs/views/_fix-queue.md` | every 4–5 units | analysis session | Open findings batched by root cause, ready to hand to a fixing session. |

The last two are the reason this pass is worth running rather than just clicking around. They are only
writable once every unit is done, because captured-but-unspent data is invisible from inside a single view.

---

## Prerequisites — check all seven before starting

1. **Backend running**, with the seed data loaded. Confirm the API base URL matches `.env.development`
   (`https://localhost:8080`). Separately: `e2e/global-setup.ts` posts to `/test/seed` before every Playwright
   run, so **until that endpoint exists, no spec can execute** — draft specs get written but not run. See
   *Test data*, below.
2. **Dev server on `https://localhost:3000` exactly.** If Vite falls forward to 3001/3002 the session cookie
   doesn't apply, and every guarded route bounces to `/login`. Kill whatever holds 3000 rather than accepting
   the fall-forward.
3. **Signed in**, and the account's locale preference set to **English** — `/user/settings` → Appearance →
   Language. This is a persisted per-user field (`App.vue:82` sets `i18n.locale` from `currentUser.locale`);
   there is no URL override, so it must be set once by hand before any agent runs. English is deliberate: it is
   easier for the agent, **and** it is the better raw-key detector, because `EN.ts` does not spread the
   framework's Slovak-only `common` namespace at all.
4. **Chrome extension has permission for `localhost:3000`**, granted in the extension UI.
5. **A second throwaway account** exists, for the account-scoped-storage check (unit `X2`).
6. **Clean git tree**, or at least a known state — the inventory files record the commit sha they describe.
7. **Nothing else driving Chrome.** See *Do not parallelise*, below.

---

## Models and effort

| Role | Run as | Model | Effort | Why |
| --- | --- | --- | --- | --- |
| Unit pass | **a fresh session per unit** | **Sonnet 5** | high | Long and detail-dense. Paste the unit's file from `units/`, watch it, stop it if it drifts. It writes its own docs to disk, so nothing is relayed. |
| Triage | a session with **no browser** | **Opus 5** | high | Reads every `findings.md` off disk and batches them by root cause. Needs the cross-unit picture; does not need to have run a crawl. See [`TRIAGE-PROMPT.md`](TRIAGE-PROMPT.md). |
| Synthesis | same, no browser | **Opus 5** | high | `_routes.md`, `glossary.md`, `data-map.md`, `opportunities.md`. |
| Fixes | fresh session per **batch** | Sonnet 5 or Opus 5 | per batch | Driven by `_fix-queue.md`, not by individual findings. Not part of this pass. |
| Retest | one browser session | **Sonnet 5** | medium | Runs only the `Verify:` blocks of findings marked `fixed`. Minutes, not a re-crawl. |

**Run the unit passes yourself rather than delegating to a subagent.** The artifacts are identical either way —
the agent writes its docs straight to disk — so the only difference is who can hit escape mid-crawl. That
matters: the two most valuable catches so far both came from watching a run and intervening.

**High effort, both pass types.** The work looks mechanical but every failure so far has been a reasoning
failure, not a clicking failure — a miscounted tally, a source-read finding presented as observed, and a
confident wrong conclusion about a Playwright option that would have blocked all 18 remaining units. The crawl
dominates the cost; reasoning is the cheap part.

### Do not parallelise

`claude-in-chrome` drives **one** real Chrome instance. Two agents clicking at once will interleave navigations
and produce garbage inventories, and two mutation passes at once will corrupt each other's seed data. Run
**one unit at a time**, start to finish.

If you later want parallelism, the `agent-browser` skill spins up isolated browsers — but then each agent must
log in itself, and mutation passes still have to be serial because they share one backend. Not worth it for a
first run.

---

## Order of execution

### Phase 0 — foundations (analysis session, no browser except the shell pass)
| # | What |
| --- | --- |
| P0.1 | ✅ `docs/views/_routes.md` — route manifest + coverage tracker. |
| P0.2 | ✅ `docs/views/glossary.md` — the domain vocabulary, from the DTOs. |
| P0.3 | ✅ `docs/views/_shell/inventory.md` — the app shell, documented once. Had to land before any unit ran, so units don't re-document the navbar. |

### Phase 1 — inventory passes (read-only, seed data stays pristine)
Each unit in `units/`, with **Pass: `inventory`**. Each also leaves a `*.draft.spec.ts` behind.

### Phase 2 — mutation passes
The same units, re-run with **Pass: `mutation`**. Read-only units (`tracking-dashboards`, `history-review`,
`reminders-admin`, `scheduler`) don't need one — each unit file says which it is.

**Phases 1 and 2 are two separate sessions per unit, not one run of the template.** The unit file is the same
both times; only the `Pass:` line changes.

**The order is forced:** mutation needs the map, so it cannot sensibly run before the inventory has recorded
what the controls are.

**The split exists to give the destructive half a fresh context.** Mutation is the pass that writes to your
database and has to clean up after itself; fusing puts it at the tail of a long context, and write-as-you-go
does not help there — that protects work already done, not the risky work still to come. Unit 9's inventory
alone ran 253k tokens over 154 tool calls on a *two-view* unit, so the tail is a long way in.

A fresh mutation session also starts oriented, reading the unit's `inventory.md` off disk rather than
rediscovering the screen.

*Not* reasons, though both were claimed earlier: keeping the seed pristine (inventory-then-mutation inside one
session documents untouched data just as well — that is ordering, not a session boundary), and scheduling.

**Where fusing is fine:** a genuinely small unit — 13 `leisure-projects` or 16 `reminders-user`, one view each.
Don't fuse the big ones (7, 15, 17).

**When one unit is too big for one session** — likely 17 (5 views) and 7 (4 views) — the answer is not a
different kind of split. Run the *same* inventory pass across two sessions, divided by view group, both
appending to the same three files. That works because write-as-you-go already makes them append-safe. Splitting
a unit by view for *verification* would break the unit definition; splitting it only for *writing* does not.

**Do not start Phase 2 until `POST /test/seed` exists** (`backend/B1`). Without a reset, each mutation pass
leaves residue that the next unit documents as if it were seed data, and by unit 19 nobody can tell which is
which.

### Phase 3 — cross-cutting checks

**These are NOT per-unit.** Each is a single pass spanning many units, which is the entire reason they are
here rather than in the unit prompts — running them per unit would mean 19 redundant sign-outs and 19 partial
answers to one question. Run each once, after Phase 1.

| # | Check | Status |
| --- | --- | --- |
| X2 | **Two-account isolation.** Sign in as A, pin/dismiss things; sign in as B; confirm none of it followed. Covers `dayPlanner`, `todoList`, `activityTracking` and `leisure` in one shot instead of four. Needs the second seeded account (`backend/B1`). | needs seed |
| X4 | **Narrow viewport.** One pass at mobile width across every unit's primary view. | **blocked** — `resize_window` reported success three times in the shell pass but `window.innerWidth` never changed. Needs a different mechanism (CDP device emulation, or a Playwright-driven pass) before it is worth running. |

> There is deliberately **no signed-out sweep.** The guard is a single default-deny in `src/router.ts:74-77` —
> `public: true` passes, everything else redirects to `login` — and only seven routes carry `public` (the five
> auth views plus the two legal pages). Walking 46 routes signed out would be testing one `if` statement 46
> times. The one genuine question in that area, whether the redirect preserves the intended destination so you
> land back where you were after signing in, belongs to unit 15 (`auth`) and is asked there.

> There is deliberately **no Slovak locale sweep.** The whole documentation pass runs in English, so
> Slovak-only defects — raw keys, broken plurals — will not surface in it. That is an accepted gap, not an
> oversight: the app is used daily in Slovak, so those defects get found in ordinary use, and paying for a
> second full walk of 53 views to find them earlier is not worth it. Anything spotted that way should be filed
> straight into the relevant unit's `findings.md`.

### Phase 4 — synthesis (Opus, no browser)

Same *kind* of session as triage — Opus, no browser, reads docs off disk — but a different job, different
inputs, and it runs **once at the end** rather than every few units:

| | Triage ([`TRIAGE-PROMPT.md`](TRIAGE-PROMPT.md)) | Phase 4 synthesis |
| --- | --- | --- |
| Reads | every `findings.md` | every `usecase.md` + `inventory.md` |
| Produces | `docs/views/_fix-queue.md` | `docs/data-map.md`, then `docs/opportunities.md` |
| About | defects that exist | capability that doesn't exist yet |
| When | every 4–5 units, re-runnable | once, after all 19 |

`data-map.md` is the field-level map of where each piece of data is **captured** versus where it is **read**.
The unread fields are the feature backlog, and they are invisible from inside any single unit — which is why
this cannot be folded into a unit pass or into triage. `opportunities.md` then collects every `opportunity`
finding across all units and reconciles it against that map.

**No prompt file exists for Phase 4 yet.** Write one when the units are done — its shape depends on what the
usecase docs actually end up containing.

### Phase 5 — promote the draft specs
Not "write the suite" — the structural tier already exists, written during Phase 1 while the agent still knew
which locators resolved. This phase is:

1. Decide the **test-data strategy** once, for all units: a dedicated e2e account with a reset endpoint (a
   backend ask), or specs that clean up after themselves. This is the decision that determines whether the
   suite is still runnable in three months, so make it deliberately.
2. Walk the `test.fixme()` stubs. Each one is a semantic claim a human has now triaged — fill in the assertion
   with the *correct* expected value, or delete the stub if the behaviour itself is what needs fixing.
3. Rename `<unit>.draft.spec.ts` → `<unit>.spec.ts`.
4. Run the whole suite and fold it into whatever runs on commit.

**No browser session needed for any of this.** The inventory doc plus `npx playwright test` is the entire loop —
Playwright verifies itself by running, which is exactly what a doc pass cannot do.

---

## The units

**19 units, 53 views, 50 routes**, grouped by **entity lifecycle** — not by view and not by module. The rule is
*if you'd have to open view B to verify view A, they're one unit*.

Each unit has a ready-to-paste prompt file in [`units/`](units/), numbered `01`–`19`. That file **is** the unit
definition — there is no table to consult and nothing to fill in. Move a file to `units/_done/` once its docs
have landed and you have read them, so the folder listing is the progress tracker.

Units 16–19 are **framework** units (`src/_common/modules/`): their findings are submodule issues, fixed by a
commit in `vue_framework` followed by a pointer bump, so they never share a fix batch with app-side findings.
Their prompt files say so.

Route-level detail — guards, params, nav entries, orphan candidates and which unit owns each route — lives in
[`../../docs/views/_routes.md`](../../docs/views/_routes.md), which also carries the coverage tracker.

---

## Running one unit

1. Open the unit's file in [`units/`](units/) and paste the fenced block into a **fresh Sonnet 5 session at
   high effort**. Nothing to fill in.
2. Watch it. Stop it if it drifts out of scope — that is the whole reason to run these yourself.
3. Don't start another until it finishes. One browser.
4. **Read the three files it wrote, not just its report.** Spot-check two or three findings against the app.
   The early units are where you calibrate whether its severity judgement is sane, and both of the first two
   runs shipped a miscounted tally or an unobserved finding that only a human reading the file would catch.
5. Move the file to `units/_done/` and tick the unit in `docs/views/_routes.md`'s coverage tracker.
6. If the output shape is wrong, fix `PROMPT-TEMPLATE.md` before the next unit, not after the nineteenth.

For a mutation pass, paste the same block with `Pass:` changed to `mutation`. Each unit file says whether one
applies.

**Unit 9 (`todo-lists`) is already done** — its inventory pass is in `docs/views/todo-lists/` and its file is
in `units/_done/`. It was chosen first deliberately: two views, a clean entity lifecycle, recently refactored,
and small enough that a bad output contract cost one cheap run instead of a long one. Pick similarly small
units next (13 `leisure-projects`, 16 `reminders-user`, 1 `home`) before the big ones (7, 17, 15).

---

## Rounds: how a finding becomes a fix, and how a fix gets confirmed

A finding goes through three hands, and the point of the `Status:` / `Verify:` / `Root cause guess:` fields is
that **no round has to re-drive the unit**.

**Round 1 — discovery.** The browser agent writes findings with `Status: open`.

**Triage (Opus, no browser).** Reads every unit's `findings.md` off disk and produces
`docs/views/_fix-queue.md`: the open findings **batched by root cause**, not one ticket per finding. This is
the step that earns its keep — unit 9 and `_shell` between them found seven unnamed icon-only buttons, which is
one fix, not seven. Same for the `iconPicker` locale mirror, which is one edit resolving raw keys in at least
two dialogs. A per-finding queue would have a fixing agent open the same file seven times.

Each batch names: the root cause, the files, every finding id it closes, and whether it is app-side or
`[framework]` (submodule commit + pointer bump — never mix the two in one batch).

**Fix round.** A fresh session per batch, given the batch plus the specific findings' `Where` / `Expected` /
`Suggested fix`. It does **not** need the inventory or the usecase doc — that's the point of the finding format
carrying `file:line` and a named expectation. On success it sets those findings to `Status: fixed`.

**Retest round.** One browser agent, given **only the `Verify:` blocks of findings marked `fixed`** — across
as many units as you like, since a verify block is self-contained. It confirms or reopens each, appends a row
to the unit's *Round history* table, and writes nothing else. This is minutes, not a re-crawl, and it is
exactly why `Verify:` is mandatory and separate from `Repro:`.

Re-run a full unit pass only when the code changed enough that the *inventory* is stale — new controls, new
views, a redesign. A bug fix alone does not require it.

## Test data

`e2e/global-setup.ts` already assumes a `POST /test/seed` endpoint that resets the database to a known state,
and fails the whole run if it can't reach it. **That endpoint does not exist yet**, which is why unit 9's draft
spec was written but never executed.

**Built, as `POST /api/test/seed`** (not `/test/seed` — the API prefixes every route). The ask and the
follow-up are in [`backend/B1-test-seed-endpoint.md`](backend/B1-test-seed-endpoint.md).

**It only exists when the API points at a LOCAL database.** The endpoint is gated on the hosting environment
*and* on the database host being local. The stock dev config points at the shared remote database, so the
route is not registered — and because the API applies an authorization `FallbackPolicy`, an unmatched path
answers **401**, not 404. A 401 from global setup therefore means "not enabled here", never "log in first".
`e2e/global-setup.ts` spells this out in its error message. Check the API's startup log, which prints one line
either way.

The seed response (stable ids, counts, `seedDateUtc`) is written to `e2e/.state/seed.json` and exposed to specs
as the `seed` fixture. Derive dates from `seedDateUtc`, never `new Date()` — a run straddling midnight UTC
would otherwise flake.

Adding it is the right call, and it is the decision that determines whether this suite is still runnable in
three months. The alternative — every spec cleaning up after itself — puts the burden on all 19 units, gets it
wrong once, and then every later test runs against polluted state with no way to tell.

What it needs to be:

- **Dev/test environments only.** A route that truncates and reseeds the database must be unreachable in
  production — gate it on the hosting environment, not on a config flag someone can copy into the wrong
  `appsettings`. This is the part to get right first.
- **Synchronous and idempotent.** Returns only once the database is in the known state, and the same state
  every time.
- **Deterministic fixture data**, with stable ids the specs can reference.
- **Fast enough to run before every suite**, since `globalSetup` calls it on each run.

Worth seeding deliberately, because unit 9 found both invisible with the current data:

- ≥5 to-do items with a non-zero `suggestedTime` **and** matching activity-history entries, so the
  estimate-vs-actual calibration surfaces actually render
- at least one overdue, not-done item past the renegotiation threshold, so the overdue banner appears

Until it exists: draft specs get written and left unrun, and mutation passes must clean up after themselves.

## What "done" looks like

- 53/53 views appear in some `docs/views/<unit>/inventory.md`, cross-checked against `_routes.md`
- every `opportunity` finding is either in `docs/opportunities.md` or explicitly dropped
- `docs/data-map.md` lists at least the unread fields per module
- the seed data is back where it started
- every `*.draft.spec.ts` is either promoted to `*.spec.ts` or deleted with a reason — none left drifting
- Playwright specs exist for the flows you actually care about regressing — not for all 53 views

---

## Decision log

Settled 2026-09-09/10 while setting this up. The **reasons** are the part that gets lost, so they are here
rather than the decisions alone. Revisit any of these — but knowing what it costs.

| Decision | Why |
| --- | --- |
| **Run unit passes yourself, in a fresh session — not via a subagent.** | Artifacts are identical (the agent writes docs to disk either way) and cost is identical. The only difference is who can hit escape mid-crawl, and mid-crawl intervention has already caught two real problems. |
| **Sonnet 5, high effort, both passes.** | Every failure so far has been a *reasoning* failure, not a clicking one — a miscounted tally, a source-read finding presented as observed, a confident wrong conclusion about a Playwright option. The crawl dominates cost; reasoning is the cheap part. |
| **Two sessions per unit: inventory, then mutation.** | Order is forced (mutation needs the map). The split gives the destructive pass — the one that writes to the DB and must clean up — a fresh context. **Not** for seed-pristineness or scheduling; both were considered and don't hold. |
| **The draft spec is written inside the inventory pass.** | The expensive part of a Playwright test is knowing which locator resolves and what to wait for. That is only knowable by driving the page. A spec written from reading `.vue` files is a set of guesses about the rendered DOM. |
| **Structural assertions only; `test.fixme()` for semantic ones.** | Structural claims are true by observation and need no triage. Semantic ones ("is this streak *right*?") would freeze today's bugs as expected behaviour. |
| **A unit too big for one session splits by view group, same pass, same files.** | Write-as-you-go makes the files append-safe. Splitting a unit by view for *verification* would break the unit definition; splitting only for *writing* does not. |
| **No signed-out sweep.** | The guard is one default-deny branch in `src/router.ts:74-77`, with seven `public` routes. Sweeping 46 routes tests one `if` 46 times. The one real question — does the login redirect preserve the destination — moved into unit 15. |
| **No Slovak locale sweep.** | The sweep runs in English, so SK-only defects won't surface. Accepted: the app is used daily in Slovak, so they get found in ordinary use. File them into the relevant unit's `findings.md` when spotted. |
| **Unit prompts are pre-generated files, not a table to fill in.** | Generation was mechanical (Haiku, parallel, verbatim from the table); the judgement — specific intent sources, per-unit known-issues — was added afterwards in one pass by a session that had `_routes.md`, the shell findings and git history already in context. Nineteen agents would each have re-derived it. |
| **Findings carry `Status:` and `Verify:`.** | So a retest round runs only the `Verify:` blocks of findings marked `fixed` — minutes, not a re-crawl. `Repro` demonstrates the bug; `Verify` proves it's gone. They are not the same field. |
| **Triage batches by root cause, not one ticket per finding.** | Unit 9 and `_shell` between them found seven unnamed icon buttons. That's one fix. A per-finding queue makes a fixing session open the same files seven times and reach seven slightly different conclusions. |
| **App-side and `[framework]` findings never share a batch.** | `src/_common` is a submodule other apps depend on: its fixes are a commit in `vue_framework` plus a pointer bump, in that order. The "same" defect in both places is two batches. |
| **No Phase 4 prompt yet.** | Its shape depends on what the `usecase.md` files actually end up containing. Writing it now means rewriting it later. |
| **`POST /test/seed` first, before further units.** | Blocks Phase 2, Phase 5 and X2. Ask written up in [`backend/B1-test-seed-endpoint.md`](backend/B1-test-seed-endpoint.md). |

**Known blocked:** X4 (narrow viewport) — `resize_window` reports success but `window.innerWidth` never changes.
Needs CDP device emulation or a Playwright-driven pass.
