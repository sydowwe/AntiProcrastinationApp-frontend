# View documentation & audit pass — runbook

A full sweep of every view in the app, producing three durable documents per unit plus a findings list. The pass answers two questions: **what can this app do
today**, and **what should it do next**.

**This file is for the operator.** Never hand it to a unit agent — it describes phases the agent must not act on, and invites it to self-assign the next unit.

| File                                                   | For                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`units/`](units/)                                     | **Start here.** One ready-to-paste prompt per unit, `01`–`19`. Move to `units/_done/` when finished.                                                                                                                                                                                                                                                                                                                                                                       |
| [`UNIT-ORDER.md`](UNIT-ORDER.md)                       | **What's left, and how to run it.** Rewritten 2026-10-01, after units 01–15 finished: the operator's guide to units 16–19, X4 ([`x4/`](x4/)), Phase 4 ([`phase4/`](phase4/)) and Phase 5 ([`phase5/`](phase5/)): order, model, what can run in parallel, and what to check after each run. |
| [`PROMPT-TEMPLATE.md`](PROMPT-TEMPLATE.md)             | The spec every unit prompt points at. Edit this to change how *all* units behave.                                                                                                                                                                                                                                                                                                                                                                                          |
| [`TRIAGE-PROMPT.md`](TRIAGE-PROMPT.md)                 | Opus, no browser. Turns findings into `_fix-queue.md`, batched by root cause.                                                                                                                                                                                                                                                                                                                                                                                              |
| [`RETEST-PROMPT.md`](RETEST-PROMPT.md)                 | Sonnet, one browser session. Runs the `Verify:` blocks of findings fixed but never confirmed live; writes back only `Status:` lines and a round-history row. Run it after a fix round empties the queue, before the next triage. [`retest/`](retest/) holds one ready-to-run file per unit (`01`–`13`): run them in order, one fresh session each, and move each to `retest/_done/` when finished.                                                                                                                                                                                                                                         |
| [`GENERATE-UNIT-PROMPTS.md`](GENERATE-UNIT-PROMPTS.md) | Regenerates `units/` if the unit definitions change. Already run.                                                                                                                                                                                                                                                                                                                                                                                                          |

> **Two e2e wiring prompts used to sit here and are now deleted** (2026-09-13), both finished and both
> superseded by code that says the same thing closer to where it matters. `E2E-SEED-WIRING.md` wired the suite
> to `POST /api/test/seed`, flipped the default locale to EN and specced the nine surfaces that had no data
> before — every one of those now has a spec in `e2e/tests/`, and its rules are CLAUDE.md's *Writing e2e specs*
> section. `E2E-TEMPLATE-SEEDING.md` created day-planner templates by hand to unblock unit 08 before
> [`B3`](backend/_done/B3-seed-fixture-coverage.md) landed; its endpoint shapes and enum traps live in
> `e2e/fixtures/dayPlannerTemplates.ts`, which is the only part still executable.

Output lands in `docs/views/` — this folder is the instructions, that is the product.

---

## What gets produced

| File                             | Per                               | Written by       | Contents                                                                                                                                                                                                                                                    |
|----------------------------------|-----------------------------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `docs/views/_routes.md`          | once                              | analysis session | Every route: path, params, guard, nav entry or orphan. The manifest that proves nothing was skipped.                                                                                                                                                        |
| `docs/views/_shell/inventory.md` | once                              | browser agent    | Navbar, sidebar/rail, user menu, breadcrumbs, notification bell, dialog host, snackbars. Documented once so 19 units don't repeat it. (Its findings are inline under `## Findings` rather than in a separate file — the one exception to the layout below.) |
| `docs/views/glossary.md`         | once                              | analysis session | Activity / task / routine / template / backlog profile / anchor / project. The overlapping nouns, defined.                                                                                                                                                  |
| `docs/views/<unit>/usecase.md`   | per unit                          | browser agent    | What it's for. Survives a redesign.                                                                                                                                                                                                                         |
| `docs/views/<unit>/inventory.md` | per unit                          | browser agent    | What's on screen right now. Falsifiable by looking.                                                                                                                                                                                                         |
| `docs/views/<unit>/findings.md`  | per unit                          | browser agent    | Every gap, severity-tagged, with evidence, `Status:` and `Verify:`. A living record across rounds, not a one-shot report.                                                                                                                                   |
| `docs/views/<unit>/screenshots/` | per unit                          | browser agent    | One per view per distinct state. The agent reads exactly one back per view as a visual sweep — the rest are for **you**, since spacing and colour are yours to judge, not the accessibility snapshot's.                                                     |
| `e2e/tests/<unit>.draft.spec.ts` | per unit, **inventory pass only** | browser agent    | Real assertions for the structural tier; named `test.fixme()` stubs for anything semantic.                                                                                                                                                                  |
| `docs/data-map.md`               | once, **last**                    | analysis session | Every field: where captured vs where read. The unread ones are your feature backlog.                                                                                                                                                                        |
| `docs/opportunities.md`          | once, **last**                    | analysis session | Cross-module synthesis of every `opportunity` finding.                                                                                                                                                                                                      |
| `docs/views/_fix-queue.md`       | every 4–5 units                   | analysis session | Open findings batched by root cause, ready to hand to a fixing session. **Open work only** — closed batches and the audit trail move to the log below.                                                                                                       |
| `docs/views/_fix-queue-log.md`   | appended each triage pass         | analysis session | The queue's audit trail: per-pass narrative, closed batch bodies, settled verification items, contradictions & re-grades. Split out 2026-09-15 when the queue reached ~410 KB.                                                                               |

The last two are the reason this pass is worth running rather than just clicking around. They are only writable once every unit is done, because captured-but-unspent
data is invisible from inside a single view.

---

## Prerequisites — check all six before starting

1. **Backend running**, on a **local Postgres**. Confirm the API base URL matches `.env.development`
   (`https://localhost:8080`). `e2e/global-setup.ts` posts to `POST /api/test/seed` before every Playwright run; that endpoint **exists and works** (verified
   2026-09-10 — 200, fixture `e2e-v1`), but it is only registered against a local database. Against the shared remote one it is not registered and answers **401**,
   which here means "not enabled", never "log in first". See *Test data*, below.
2. **Dev server on `https://localhost:3000` exactly.** If Vite falls forward to 3001/3002 the session cookie doesn't apply, and every guarded route bounces to
   `/login`. Kill whatever holds 3000 rather than accepting the fall-forward.
3. **Signed in, in English** — no longer anything to set by hand. `src/i18n.ts` now defaults to `EN`, and the seed creates both accounts with `locale: "EN"`, so a
   seeded run renders English end to end. English is deliberate: it is easier for the agent, **and** it is the better raw-key detector, because `EN.ts` does not
   spread the framework's Slovak-only `common` namespace at all. If a view renders Slovak anyway, that is now a finding rather than a setup step you forgot.
4. **`playwright-cli` works** — `playwright-cli --version` resolves, and `.playwright/cli.config.json` is present (it is committed; without its `ignoreHTTPSErrors`
   every command dies on the self-signed cert). No Chrome extension permission is needed any more: the CLI launches its own Chrome instance and does not use your
   profile, your tabs or your session.

   **Expect the very first page load in a fresh browser to fail, and just reload.** A brand-new context hits
   `net::ERR_CERT_VERIFIER_CHANGED` on the dev server's self-signed cert, every module 404s and the app never mounts — the snapshot shows *only* the devtools toggle
   and the console carries 40–200 errors. One
   `playwright-cli reload` clears it completely. This is **separate from** the expected first-load 401 burst in CLAUDE.md's *Browser verification* section, and it is
   not a defect in the app.

   **It also produces spurious Playwright failures.** On 2026-09-11 `e2e/tests/auth.spec.ts` reported 2 failed · 6 passed: the two sign-in tests using the raw `page`
   fixture — the first navigations of the run — failed, while the six using `authenticatedPage` passed and the storage state was written correctly. Signing in by
   hand immediately afterwards worked. **Re-run before treating a first-navigation spec failure as a real defect.**
5. **A second account** — supplied by the seed as `secondaryUser` (id 10002). Nothing to create by hand.
6. **Clean git tree**, or at least a known state — the inventory files record the commit sha they describe.

---

## Before you start a unit — known blockers

> **Re-measured 2026-09-11**, signed in as the seed's `primaryUser` against a freshly reseeded local API
> (fixture `e2e-v1`). Every unit's primary routes — all 53 — were driven and checked for non-2xx responses,
> unresolved i18n keys, and whether the view *actually renders rows*. Statuses below are observed. The previous
> table (2026-09-10) is superseded; where it was wrong, the correction says so.
>
> **Five units cannot currently produce a truthful inventory**, down from six. The headline changes: unit
> **02** is unblocked, unit **17** turned out to be blocked by more than the locale gap, and the "two or three
> opaque 500s" are **one** bug.
>
> **Updated later the same day**, after two fixes landed: the reminders EN locale files shipped and are
> verified rendering (Class 2 is **resolved**), and the grid sort-key fix is in the API working tree but **not
> yet deployed** (Class 1). Once that build is out and re-verified, **16 of the 18 remaining units are
> runnable** and only **08** and **17** stay blocked. Until then it is 13.

Three failure classes. The first two produce the same trap — the view renders, so an agent documents it in good faith and files findings that are really one upstream
bug.

### Class 1 — the grid 500s, and the view renders a false empty state — ✅ **resolved**

> ✅ **Fixed server-side and verified 2026-09-13. Units 11, 12, 16 and 13's table view are unblocked, with no
> frontend change.** The whole section below is kept as history; **nothing in it still reproduces.**
>
> The answer was **both halves**, not the remap-only fix an earlier version of this note described (that fix
> and its `GridSortKeyExtensions` file are gone):
>
> - **The general class is fixed.** An unresolvable key is now a **400 naming the key** —
>   `{"errors":{"sortBy":["Unknown sort key 'zzzNotAColumn'."]}}`, key echoed, truncated at 64 chars, **no
>   `errorId`**. A body carrying an `errorId` is still an unhandled 500 and a different bug worth reporting.
> - **Every key these five views already send resolves.** `activity.name` resolves **natively** (the B6
>   reshape nests the whole `ActivityResponse` on the row, and `activity.role.name` / `activity.category.name`
>   work too); `periodKey` is a supported composite the server expands to `anchorYear, anchorMonth`;
>   `nextOccurrence` is a compatibility alias for `nextOccurrenceAt`.
> - **The rule is *resolvable*, never *nested*.** `activity.zzz` is a 400 exactly like a dot-free non-column.
>
> Two things this leaves us: migrate `/pripomienky/moje` from the `nextOccurrence` alias to `nextOccurrenceAt`
> so the backend can drop it, and give the table component an **error state distinct from its empty state** —
> that indistinguishability is why one bug was filed three times. Both are app-side; see
> [`B2`](backend/_done/B2-grid-500-on-unmapped-sortby.md) and `docs/views/_fix-queue.md`.
>
> **A new sortable column header is still a hard failure if its key is wrong** — now a 400 rather than a 500.
> The key must name a member of the **projected response DTO**, not a field of the entity. Send it once against
> the endpoint before shipping the header; a 400 names it immediately.

**One root cause, not three.** A paged grid throws whenever `sortBy` names a key it cannot map to a column. Same route, same filter, only `sortBy` differs:

| `sortBy`                                                     | Result  |
|--------------------------------------------------------------|---------|
| `[]`                                                         | **200** |
| a mapped column (`id`, `name`, `anchorYear`, `activityName`) | **200** |
| `activity.name` — nested path                                | **500** → now **200** |
| `zzzNotAColumn` — **no dot**, not a column                   | **500** → now **400**, key named |

Reproduced identically on all five `/grid` endpoints *and* on `reminder-dashboard/my-upcoming`, which is not a
`/grid` route — so it lives in a shared sorting layer. **The earlier "nested `sortBy`" hypothesis is refuted:**
a dot-free unmapped key fails the same way, so the trigger is *unmappable*, not *nested*. That distinction is what the backend needs, and it is why this is filed
once as
[`backend/_done/B2-grid-500-on-unmapped-sortby.md`](backend/_done/B2-grid-500-on-unmapped-sortby.md) rather than three times.

The 500 rendered as the table's **empty state**, which was the dangerous part — `/leisure/backlog` said *"You don't have any here yet"* while the fixture does
contain `profiles.backlog`. **That indistinguishability is still true of the component** even though the 500 is gone: a 400 and an empty list look identical on
screen. Fixing it is the app-side half of this class.

| Unit                          | Route                          | Sends            | Was                                             | Now (2026-09-13)                             |
|-------------------------------|--------------------------------|------------------|-------------------------------------------------|----------------------------------------------|
| **11** leisure-backlog-picker | `/leisure/backlog`             | `activity.name`  | **500** — false empty state                     | **200** — keep the key                       |
| **12** leisure-bucket-anchors | `/leisure/bucket-list`         | `activity.name`  | **500** — false empty state                     | **200** — keep the key                       |
| **12** leisure-bucket-anchors | `/leisure/memory-anchors`      | `periodKey`      | **500** — false empty state                     | **200** — supported composite, keep the key  |
| **16** reminders-user         | `/pripomienky/moje`            | `nextOccurrence` | **500** — "No data available"                   | **200** via alias — migrate to `nextOccurrenceAt` |
| **13** leisure-projects       | `/leisure/projects?view=table` | `activity.name`  | **500** — board mode is fine, table mode is not | **200** — keep the key                       |

**Two corrections to the previous table, both now false:**

1. ~~Unit **02** is blocked on `POST /api/activity/grid` → 405.~~ **It is not blocked.** The server has completed the `/grid` rename: `/api/activity/grid` and
   `/api/memory-anchor/grid` both answer **200**, and
   `POST /{entity}/filtered-table` now returns **405** on all five entities — the mirror image of the old symptom. `/activity-settings/activities` renders **10 real
   rows** (Bug Fixing, Build a Bookshelf, Call the Dentist, Code Review, …); the `roles` and `categories` tabs render 16 and 19. It sorts by the flat, mapped column
   `name`, which is exactly why it escapes Class 1.
2. ~~The rename is "half-finished server-side".~~ **The rename is complete.** That claim appeared in both this file and the header of
   `e2e/tests/leisure-profiles.spec.ts`; the spec comment has been corrected in place (comment only, no test change). Do not add per-call-site `path` overrides —
   there is nothing left to work around.

### Class 2 — the page renders raw i18n keys — ✅ **resolved**

> **Fixed 2026-09-11 and verified in the browser.** `src/_common/modules/reminders/_locales/` now ships
> `reminders.en.ts` and `remindersDashboard.en.ts` alongside the `.sk` files, and `src/locales/EN.ts` spreads
> both. Re-driven signed in: `/pripomienky/moje` renders *"My reminders — Upcoming reminders you are a
> recipient of…"*, `/pripomienky/register` renders *"Reminder register / Owner module / Subject / Kind /
> Schedule type / Status / Next occurrence"*, and **`reminders.scan` is gone from `/planovac/ulohy` too**.
> Zero raw keys across all five reminders views and the scheduler.
>
> It was resolved the right way — a framework commit adding the two `.en` files, per CLAUDE.md's decision tree —
> **not** the app-side `common.en.ts` mirror, which is the remedy for namespace *collisions* (R5/R6/R11) and
> this was not one. Remember the pointer bump if it has not landed yet.
>
> **This removes the locale gate from units 16 and 17 entirely.** 17 is still blocked, but now by Class 3's
> 403 alone.

Two earlier entries in this class also no longer reproduce:

| Was                                                                        | Now                                                                                                                                                                          |
|----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **19** scheduler — `reminders.scan` on `/planovac/ulohy`                   | ✅ gone, same fix                                                                                                                                                            |
| **11** leisure-backlog-picker — `enums.energyLevel.Low` on `/leisure/pick` | ✅ gone. Renders "Low / Medium / High" and "Energy: Low". Presumably the `convertToEnum` rule now in CLAUDE.md; `prompts/ENUM-DESERIALIZATION-AUDIT.md` owns the wider sweep |

**One raw key remains**, unrelated to reminders and app-side — it is a finding for the unit, not a blocker:

| Unit                   | Route                         | Key                                                                                                                                 |
|------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| **04** history-capture | `/activity-history/stopwatch` | `dateTime.secondsShort` — renders between the minute and second digits. Confirmed still present 2026-09-11, after the reminders fix |

### Class 3 — 403, and the fixture has no rows

Two failure modes that the previous table did not separate from "clean".

| Unit                       | Symptom                                                                                                                                                                                    | Ask                                         |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| ~~**17** reminders-admin~~ | ~~all five data routes → 403~~ — **resolved 2026-09-13.** The 403 was correct: those routes are Admin-gated on purpose and roll up every user's reminders unscoped. Fixture `e2e-v3` adds an `adminUser` (10003, `admin@example.com`) that passes them. **Run unit 17 signed in as `adminUser`, not `primaryUser`** | [`B4`](backend/_done/B4-reminders-admin-403.md) |
| ~~**08** planner-templates~~ | ~~"No templates yet" — two of its three views unreachable~~ — **resolved 2026-09-13**, verified on screen: three templates render, the detail view shows 5 tasks, and `/split` takes a different template on each side | [`B3`](backend/_done/B3-seed-fixture-coverage.md) |
| ~~**05** tracking-dashboards~~ | ~~full chrome over empty payloads~~ — **resolved 2026-09-13**, verified on screen: the timeline renders sessions and `pie-chart` returns 5 domains / 150 entries                                                     | [`B3`](backend/_done/B3-seed-fixture-coverage.md) |
| ~~**06** tracking-settings~~ | ~~both views: "No data available · 0-0 of 0"~~ — **resolved 2026-09-13**, verified on screen: distinct entries list rows on both platforms (desktop `1-6 of 6`, Android 5) and both *Mappings* tabs render. Brief the agent that each Mappings tab opens with its **Type** filter on `Activity`, so it shows one row — the ignored mapping is under `Ignored`, not missing | [`B3`](backend/_done/B3-seed-fixture-coverage.md) |
| ~~**18** notifications~~   | ~~`/notifikacie` is empty~~ — **resolved 2026-09-13**, verified on screen: six notifications, three unread, `All`/`Unread` and type filters populated                                                                 | [`B3`](backend/_done/B3-seed-fixture-coverage.md) |

**17 is no longer gated.** Both of its blockers are closed: the EN locale files landed (Class 2), and the 403
was answered on 2026-09-13 — it was the *fixture* that was wrong, not the policy. Signed in as `adminUser` all
five views render (`/register` 6 rows, `/nadchadzajuce` 4, `/historia` 7, `/prehlad` its five cards);
`primaryUser` still gets 403 on all five, which is the intended behaviour and worth one spec.

The contrast that made this look like a session problem is real but does not generalise: `my-upcoming` is the
user-scoped sibling and scopes by caller, and the scheduler's admin routes genuinely are open to any signed-in
user in this host.

**08 is a hard blocker; 05, 06 and 18 are not.** Those three render their whole control surface and lack only rows, so an inventory pass can document the controls —
it just must say the data was absent rather than describing an empty screen as the feature.

### Backend asks

| Ask                                                                                             | State                                                                                                                                                                                                                                                                  | Unblocks                        |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| [`B2` — grid 500 on an unmapped `sortBy`](backend/_done/B2-grid-500-on-unmapped-sortby.md)      | ✅ **answered and deployed** (2026-09-13) — **both** halves: unresolvable keys are now a **400 naming the key**, *and* every key these views already send resolves. No client change needed. Leaves two app-side follow-ups: migrate `/pripomienky/moje` to `nextOccurrenceAt`, and give the table an error state distinct from its empty state | ✅ released 11, 12, 16, 13's table view |
| [`B3` — seed fixture coverage](backend/_done/B3-seed-fixture-coverage.md)                             | ✅ **answered and delivered** (re-driven in a browser 2026-09-13) — all four surfaces seed rows and **all six criteria hold on screen**. Each *Mappings* tab opens with its **Type** filter on `Activity`, so it shows one row; the ignored mapping sits under `Ignored` and is not missing. Fixture is now `e2e-v3` | ✅ released 08, 05, 06, 18 |
| [`B4` — reminders-admin 403](backend/_done/B4-reminders-admin-403.md)                           | ✅ **answered and delivered** (2026-09-13) — the gate is deliberate; fixture `e2e-v3` adds `adminUser` (10003) plus 6 reminder rows. Client side: bump `EXPECTED_FIXTURE_VERSION`, use the new `adminPage` fixture                                                      | 17                              |
| `B5` — `repeating-planner-task/suggestions`                                                     | ⛔ **withdrawn and deleted** — not a backend ask. The route exists as `GET /repeating-planner-task/suggestions/{calendarId:long}`; the client calls `/suggestions?date=…`, which falls through to `/{id}`. A **frontend** bug, tracked in the fix queue                | —                               |
| [`B6` — profile grids omit the activity name](backend/_done/B6-profile-grid-activity-name.md)   | ✅ **answered and shipped** (2026-09-13) — option A, a nested full `ActivityResponse` on all four. Leaves a **client-side** follow-up: `ActivityInfo.fromJson` no longer finds `categoryName`/`icon`/`color`, which now hang off `activity.category` / `activity.role` | affects 12, 13                  |
| [`B7` — grid sort-key audit](backend/_done/B7-grid-sort-key-audit.md)                           | ✅ **answered in full** (2026-09-13) — §1 fixed by shape, not a remap: `activity.name` resolves natively on all four grids. Unresolvable keys now **400**, not 500                                                                                                     | 12; hardens 11, 13              |

**B7 is the exhaustive version of B2's closing warning**, and it is now closed with it. B7 read every column definition in the app against every grid response and
found one sortable column the then-current remap missed — `memory-anchor/grid` also emits `activity.name`. **The remap approach was replaced outright**, so that gap
closed with it: `memory-anchor/grid` answers 200 on both `periodKey` and `activity.name` (measured 2026-09-13). B7 also answered B6 from the client's side: all four
profile DTOs parse a **nested** `activity` object and none reads the flat `activityName`, so that field is returned and never read — which is exactly why
`activity.name`, not `activityName`, is the key to keep sending.

**The warning itself still stands, in its new form.** A sortable header whose key does not name a member of the projected response DTO is now a **400** rather than a
500. Probe the endpoint once before shipping a new column.

**B5 was withdrawn before it was sent, and the file is deleted.** The route exists as
`GET /repeating-planner-task/suggestions/{calendarId:long}` and returns 200; the client calls it as
`/suggestions?date=…`, which falls through to `/{id}`. It is a **frontend** bug and lives in the fix queue now.
The one part worth carrying: **probing an endpoint from outside cannot tell "no route" from "right route, wrong parameter"** — both look like a 404. That is how this
came to be written as a backend ask. Read the route table before filing the next one.

### Everything else is clear

Units **01, 03, 04, 07, 09, 10, 13 (board), 14, 15, 19** were driven and render real data with no 4xx/5xx. Two things found along the way that are **app-side, not
blockers**, recorded so a unit agent recognises them:

- **07** `/day-planner/:date` fires `GET /api/repeating-planner-task/suggestions?date=…` **twice**, and both
    400. **This is a frontend bug, not a missing route** — the endpoint is
         `GET /repeating-planner-task/suggestions/{calendarId:long}` and returns 200; the client sends a date query param instead of the calendar id it has already
         resolved. See
         `B5`, withdrawn and deleted — it was written as a backend ask and was not one. The day view itself is correct: `/day-planner/11-09-2026` loads calendar 984 and shows
         "1/3 tasks · 33%". **The `:date` param is `dd-MM-yyyy`, not ISO.** An ISO URL silently renders a *neighbouring* day rather than erroring, which is a
         robustness finding for the unit, not a backend defect — confirm the format before filing anything about it.
- **02** `/activity-settings/activities` fires `POST /api/activity/grid` twice on mount; the first is
  `ERR_ABORTED` and the second returns 200. Superseded duplicate, not a failure.

Only the **paginated grid family** is affected by Class 1 — `GET /api/activity/all-options` and friends return 200 throughout, so pickers, selects and non-paginated
lists render fine even in the blocked units.

---

## Models and effort

| Role      | Run as                        | Model              | Effort    | Why                                                                                                                                                                             |
|-----------|-------------------------------|--------------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Unit pass | **a fresh session per unit**  | **Sonnet 5**       | high      | Long and detail-dense. Paste the unit's file from `units/`, watch it, stop it if it drifts. It writes its own docs to disk, so nothing is relayed.                              |
| Triage    | a session with **no browser** | **Opus 5**         | high      | Reads every `findings.md` off disk and batches them by root cause. Needs the cross-unit picture; does not need to have run a crawl. See [`TRIAGE-PROMPT.md`](TRIAGE-PROMPT.md). |
| Synthesis | same, no browser              | **Opus 5**         | high      | `_routes.md`, `glossary.md`, `data-map.md`, `opportunities.md`.                                                                                                                 |
| Fixes     | fresh session per **batch**   | Sonnet 5 or Opus 5 | per batch | Driven by `_fix-queue.md`, not by individual findings. Not part of this pass.                                                                                                   |
| Retest    | one browser session           | **Sonnet 5**       | medium    | Runs only the `Verify:` blocks of findings marked `fixed`. Minutes, not a re-crawl. See [`RETEST-PROMPT.md`](RETEST-PROMPT.md).                                                  |

**Run the unit passes yourself rather than delegating to a subagent.** The artifacts are identical either way — the agent writes its docs straight to disk — so the
only difference is who can hit escape mid-crawl. That matters: the two most valuable catches so far both came from watching a run and intervening.

**High effort, both pass types.** The work looks mechanical but every failure so far has been a reasoning failure, not a clicking failure — a miscounted tally, a
source-read finding presented as observed, and a confident wrong conclusion about a Playwright option that would have blocked all 18 remaining units. The crawl
dominates the cost; reasoning is the cheap part.

### Parallelism: inventory passes can, mutation passes cannot

This used to read "do not parallelise", because `claude-in-chrome` drove **one** real Chrome instance and two agents clicking at once interleaved navigations into
garbage inventories. `playwright-cli` removes that constraint — sessions are isolated (`isolated: true` in the config) and addressable with `-s=<session>`, so two
inventory passes can run side by side without touching each other's browser state.

**Mutation passes still have to be serial.** They share one backend and one seeded account, so two at once corrupt each other's data — and `POST /api/test/seed` is a
*full reset of every account*, so one run reseeding mid-flight destroys the other's world. Run mutation units one at a time, start to finish.

If you do parallelise inventory passes, three separate questions, each with its own answer (`F23`):

- **Which browser?** Every `playwright-cli` command carries `-s=<unit-name>`, whether or not anything else is running. The unnamed `default` session is shared by
  every agent that omits `-s=`. One round lost navigations, opened dialogs it never asked for and toggled another unit's fixture rows that way.
- **Which sign-in?** **One signed-in state per concurrent session.** The API rotates the refresh token on every `POST /api/auth/refresh` and tolerates a stale one
  for 5 s only. Two sessions `state-load`ed from one `auth-*.json` therefore hold one token, and the second to refresh gets a 401 and a real sign-out, minutes
  into its pass. Load a state file into **one** session only. Every other session signs in through the form, which is fine as long as sign-ins stay under
  `/auth/login`'s 5-per-minute limit.
- **Am I the only mutating session?** Mutation passes are serial (above). A reseed wipes every account, so if a row you just created vanishes, suspect another
  agent's `POST /api/test/seed` before suspecting the app.

---

## Order of execution

### Phase 0 — foundations (analysis session, no browser except the shell pass)

| #    | What                                                                                                                                          |
|------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| P0.1 | ✅ `docs/views/_routes.md` — route manifest + coverage tracker.                                                                               |
| P0.2 | ✅ `docs/views/glossary.md` — the domain vocabulary, from the DTOs.                                                                           |
| P0.3 | ✅ `docs/views/_shell/inventory.md` — the app shell, documented once. Had to land before any unit ran, so units don't re-document the navbar. |

### Phase 1 — inventory passes (read-only, seed data stays pristine)

Each unit in `units/`, with **Pass: `inventory`**. Each also leaves a `*.draft.spec.ts` behind.

### Phase 2 — mutation passes

The same units, re-run with **Pass: `mutation`**. Read-only units (`tracking-dashboards`, `history-review`,
`reminders-admin`, `scheduler`) don't need one — each unit file says which it is.

**Phases 1 and 2 are two separate sessions per unit, not one run of the template.** The unit file is the same both times; only the `Pass:` line changes.

**The order is forced:** mutation needs the map, so it cannot sensibly run before the inventory has recorded what the controls are.

**The split exists to give the destructive half a fresh context.** Mutation is the pass that writes to your database and has to clean up after itself; fusing puts it
at the tail of a long context, and write-as-you-go does not help there — that protects work already done, not the risky work still to come. Unit 9's inventory alone
ran 253k tokens over 154 tool calls on a *two-view* unit, so the tail is a long way in.

A fresh mutation session also starts oriented, reading the unit's `inventory.md` off disk rather than rediscovering the screen.

*Not* reasons, though both were claimed earlier: keeping the seed pristine (inventory-then-mutation inside one session documents untouched data just as well — that
is ordering, not a session boundary), and scheduling.

**Where fusing is fine:** a genuinely small unit — 13 `leisure-projects` or 16 `reminders-user`, one view each. Don't fuse the big ones (7, 15, 17).

**When one unit is too big for one session** — likely 17 (5 views) and 7 (4 views) — the answer is not a different kind of split. Run the *same* inventory pass
across two sessions, divided by view group, both appending to the same three files. That works because write-as-you-go already makes them append-safe. Splitting a
unit by view for *verification* would break the unit definition; splitting it only for *writing* does not.

**Phase 2 is unblocked** — `POST /api/test/seed` landed and the reset it was waiting on exists. That also changes how a mutation pass ends: the template's "delete
everything you created, restore everything you edited" is now the *fallback*, not the primary plan. Reseeding is one idempotent call and strictly more reliable than
hand-cleanup, which only has to be got wrong once before every later unit documents residue as if it were seed data.

Two things to keep straight if you reseed at the end of a pass:

- it **wipes every account**, so never do it while another unit is mid-run (see *Parallelism*, above);
- it invalidates `e2e/.state/auth-*.json`, so the next agent must sign in again rather than `state-load` a dead token. `global-setup.ts` already clears `.state/` for
  exactly this reason.

### Phase 3 — cross-cutting checks

**These are NOT per-unit.** Each is a single pass spanning many units, which is the entire reason they are here rather than in the unit prompts — running them per
unit would mean 19 redundant sign-outs and 19 partial answers to one question. Run each once, after Phase 1.

| #  | Check                                                                                                                                                                                                  | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|----|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| X2 | **Two-account isolation.** Sign in as A, pin/dismiss things; sign in as B; confirm none of it followed. Covers `dayPlanner`, `todoList`, `activityTracking` and `leisure` in one shot instead of four. | ✅ **done, and now regression-covered.** The seed provides `secondaryUser`, and `e2e/tests/account-isolation.spec.ts` passes via the `secondaryPage` fixture. Extend that spec rather than re-running this by hand.                                                                                                                                                                                                                                            |
| X4 | **Narrow viewport.** One pass at mobile width across every unit's primary view.                                                                                                                        | ✅ **unblocked** (2026-09-10). The old blocker was the Chrome extension's `resize_window`, which reported success but never moved `window.innerWidth`. `playwright-cli resize 390 844` genuinely does — verified: `innerWidth` 1440 → 390, below Vuetify's 960 mobile breakpoint. Worth running: at least two `dayPlanner.spec.ts` fixmes are waiting on it (the Day Details toggle is `v-show`-mobile-only and simply absent from the tree at desktop width). |

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

Same *kind* of session as triage — Opus, no browser, reads docs off disk — but a different job, different inputs, and it runs **once at the end** rather than every
few units:

|          | Triage ([`TRIAGE-PROMPT.md`](TRIAGE-PROMPT.md)) | Phase 4 synthesis                                |
|----------|-------------------------------------------------|--------------------------------------------------|
| Reads    | every `findings.md`                             | every `usecase.md` + `inventory.md`              |
| Produces | `docs/views/_fix-queue.md`                      | `docs/data-map.md`, then `docs/opportunities.md` |
| About    | defects that exist                              | capability that doesn't exist yet                |
| When     | every 4–5 units, re-runnable                    | once, after all 19                               |

`data-map.md` is the field-level map of where each piece of data is **captured** versus where it is **read**. The unread fields are the feature backlog, and they are
invisible from inside any single unit — which is why this cannot be folded into a unit pass or into triage. `opportunities.md` then collects every `opportunity`
finding across all units and reconciles it against that map.

**Prompts: [`phase4/`](phase4/)** (written 2026-10-01). It isn't one session. Six Sonnet extraction sessions each map one
group of units field by field into `docs/data-map/<group>.md`, reading the DTOs as well as the docs, because the docs only
record what their agent noticed. Then one Opus session reconciles the six into `data-map.md` and `opportunities.md`. The
framework units get their own map (`docs/data-map/framework.md`), and a backend notification audit checks the app's
time-bearing fields against what the backend actually notifies about. The order is in [`UNIT-ORDER.md`](UNIT-ORDER.md).

### Phase 5 — promote the draft specs

Not "write the suite" — the structural tier already exists, written during Phase 1 while the agent still knew which locators resolved. This phase is:

1. Decide the **test-data strategy** once, for all units: a dedicated e2e account with a reset endpoint (a backend ask), or specs that clean up after themselves.
   This is the decision that determines whether the suite is still runnable in three months, so make it deliberately.
2. Walk the `test.fixme()` stubs. Each one is a semantic claim a human has now triaged — fill in the assertion with the *correct* expected value, or delete the stub
   if the behaviour itself is what needs fixing.
3. Rename `<unit>.draft.spec.ts` → `<unit>.spec.ts`.
4. Run the whole suite and fold it into whatever runs on commit.

**No browser session needed for any of this.** The inventory doc plus `npx playwright test` is the entire loop — Playwright verifies itself by running, which is
exactly what a doc pass cannot do.

---

## The units

**19 units, 53 views, 50 routes**, grouped by **entity lifecycle** — not by view and not by module. The rule is *if you'd have to open view B to verify view A,
they're one unit*.

Each unit has a ready-to-paste prompt file in [`units/`](units/), numbered `01`–`19`. That file **is** the unit definition — there is no table to consult and nothing
to fill in. Move a file to `units/_done/` once its docs have landed and you have read them, so the folder listing is the progress tracker.

Units 16–19 are **framework** units (`src/_common/modules/`): their findings are submodule issues, fixed by a commit in `vue_framework` followed by a pointer bump,
so they never share a fix batch with app-side findings. Their prompt files say so.

Route-level detail — guards, params, nav entries, orphan candidates and which unit owns each route — lives in
[`../../docs/views/_routes.md`](../../docs/views/_routes.md), which also carries the coverage tracker.

---

## Running one unit

1. Open the unit's file in [`units/`](units/) and paste the fenced block into a **fresh Sonnet 5 session at high effort**. Nothing to fill in.
2. Watch it. Stop it if it drifts out of scope — that is the whole reason to run these yourself.
3. Don't start another until it finishes. One browser.
4. **Read the three files it wrote, not just its report.** Spot-check two or three findings against the app. The early units are where you calibrate whether its
   severity judgement is sane, and both of the first two runs shipped a miscounted tally or an unobserved finding that only a human reading the file would catch.
5. Move the file to `units/_done/` and tick the unit in `docs/views/_routes.md`'s coverage tracker.
6. If the output shape is wrong, fix `PROMPT-TEMPLATE.md` before the next unit, not after the nineteenth.

For a mutation pass, paste the same block with `Pass:` changed to `mutation`. Each unit file says whether one applies.

**Unit 9 (`todo-lists`) is already done** — its inventory pass is in `docs/views/todo-lists/` and its file is in `units/_done/`. It was chosen first deliberately:
two views, a clean entity lifecycle, recently refactored, and small enough that a bad output contract cost one cheap run instead of a long one. Pick similarly small
units next (13 `leisure-projects`, 16 `reminders-user`, 1 `home`) before the big ones (7, 17, 15).

---

## Rounds: how a finding becomes a fix, and how a fix gets confirmed

A finding goes through three hands, and the point of the `Status:` / `Verify:` / `Root cause guess:` fields is that **no round has to re-drive the unit**.

**Round 1 — discovery.** The browser agent writes findings with `Status: open`.

**Triage (Opus, no browser).** Reads every unit's `findings.md` off disk and produces
`docs/views/_fix-queue.md`: the open findings **batched by root cause**, not one ticket per finding. This is the step that earns its keep — unit 9 and `_shell`
between them found seven unnamed icon-only buttons, which is one fix, not seven. Same for the `iconPicker` locale mirror, which is one edit resolving raw keys in at
least two dialogs. A per-finding queue would have a fixing agent open the same file seven times.

Each batch names: the root cause, the files, every finding id it closes, and whether it is app-side or
`[framework]` (submodule commit + pointer bump — never mix the two in one batch).

**Fix round.** A fresh session per batch, given the batch plus the specific findings' `Where` / `Expected` /
`Suggested fix`. It does **not** need the inventory or the usecase doc — that's the point of the finding format carrying `file:line` and a named expectation. On
success it sets those findings to `Status: fixed`.

**Retest round.** One browser agent, given **only the `Verify:` blocks of findings marked `fixed`** — across as many units as you like, since a verify block is
self-contained. It confirms or reopens each, appends a row to the unit's *Round history* table, and writes nothing else. This is minutes, not a re-crawl, and it is
exactly why `Verify:` is mandatory and separate from `Repro:`.

Re-run a full unit pass only when the code changed enough that the *inventory* is stale — new controls, new views, a redesign. A bug fix alone does not require it.

## Test data

**Built and working, as `POST /api/test/seed`** (not `/test/seed` — the API prefixes every route). The ask and the follow-up are in [
`backend/_done/B1-test-seed-endpoint.md`](backend/_done/B1-test-seed-endpoint.md). `global-setup.ts`
calls it once per run and fails the whole run if it can't reach it. Unit 9's draft spec, written before it existed, now executes.

**It only exists when the API points at a LOCAL database.** The endpoint is gated on the hosting environment *and* on the database host being local. The stock dev
config points at the shared remote database, so the route is not registered — and because the API applies an authorization `FallbackPolicy`, an unmatched path
answers **401**, not 404. A 401 from global setup therefore means "not enabled here", never "log in first".
`e2e/global-setup.ts` spells this out in its error message. Check the API's startup log, which prints one line either way.

The seed response (stable ids, counts, `seedDateUtc`) is written to `e2e/.state/seed.json` and exposed to specs as the `seed` fixture. Derive dates from
`seedDateUtc`, never `new Date()` — a run straddling midnight UTC would otherwise flake.

Adding it is the right call, and it is the decision that determines whether this suite is still runnable in three months. The alternative — every spec cleaning up
after itself — puts the burden on all 19 units, gets it wrong once, and then every later test runs against polluted state with no way to tell.

What it needs to be:

- **Dev/test environments only.** A route that truncates and reseeds the database must be unreachable in production — gate it on the hosting environment, not on a
  config flag someone can copy into the wrong
  `appsettings`. This is the part to get right first.
- **Synchronous and idempotent.** Returns only once the database is in the known state, and the same state every time.
- **Deterministic fixture data**, with stable ids the specs can reference.
- **Fast enough to run before every suite**, since `globalSetup` calls it on each run.

Both of the surfaces unit 9 found invisible are now seeded and confirmed rendering: **6** items carry a non-zero `suggestedTime` with matching history
(`counts.calibrationTodoListItems`), and **6** overdue items sit well past the renegotiation threshold of 3 — the banner renders with all three actions.

**Known fixture gaps** — ~~re-measured 2026-09-11~~, **closed 2026-09-13** except one. Filed as
[`B3`](backend/_done/B3-seed-fixture-coverage.md) (one ask, four surfaces; do not create data per test). All four
surfaces are seeded in `e2e-v3` and were re-driven in a browser; the struck items no longer reproduce:

- ~~**no day-planner templates**~~ — three now seed (one pinned). `/day-planner/templates` lists them, the detail view renders its tasks, `/split` compares two, and
  `templateDayPlanner.spec.ts` no longer carries the `test.skip(templateUrl === null)` guard;
- ~~**no activity-tracking entries**~~ — seven days across all three ledgers. Unit **05**'s dashboards render real sessions, and `pie-chart` returns 5 domains, so the
  canvas clause has something to read;
- ~~**no distinct tracking entries**~~ — desktop lists `1-6 of 6`, Android 5, and both *Mappings* tabs render their row, so unit **06**'s mapping workflow is
  documentable. Each Mappings tab opens with **Type = `Activity`** and therefore shows one row; the ignored mapping is under `Ignored`;
- ~~**no notifications**~~ — six seed across six kinds in both read states, so `/notifikacie` (half of unit **18**) lists rows and `All` vs `Unread` is distinguishable.

## What "done" looks like

- 53/53 views appear in some `docs/views/<unit>/inventory.md`, cross-checked against `_routes.md`
- every `opportunity` finding is either in `docs/opportunities.md` or explicitly dropped
- `docs/data-map.md` lists at least the unread fields per module
- the seed data is back where it started
- every `*.draft.spec.ts` is either promoted to `*.spec.ts` or deleted with a reason — none left drifting
- Playwright specs exist for the flows you actually care about regressing — not for all 53 views

---

## Decision log

Settled 2026-09-09/10 while setting this up. The **reasons** are the part that gets lost, so they are here rather than the decisions alone. Revisit any of these —
but knowing what it costs.

| Decision                                                                        | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|---------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Run unit passes yourself, in a fresh session — not via a subagent.**          | Artifacts are identical (the agent writes docs to disk either way) and cost is identical. The only difference is who can hit escape mid-crawl, and mid-crawl intervention has already caught two real problems.                                                                                                                                                                                                                                                          |
| **Sonnet 5, high effort, both passes.**                                         | Every failure so far has been a *reasoning* failure, not a clicking one — a miscounted tally, a source-read finding presented as observed, a confident wrong conclusion about a Playwright option. The crawl dominates cost; reasoning is the cheap part.                                                                                                                                                                                                                |
| **Two sessions per unit: inventory, then mutation.**                            | Order is forced (mutation needs the map). The split gives the destructive pass — the one that writes to the DB and must clean up — a fresh context. **Not** for seed-pristineness or scheduling; both were considered and don't hold.                                                                                                                                                                                                                                    |
| **The draft spec is written inside the inventory pass.**                        | The expensive part of a Playwright test is knowing which locator resolves and what to wait for. That is only knowable by driving the page. A spec written from reading `.vue` files is a set of guesses about the rendered DOM.                                                                                                                                                                                                                                          |
| **Structural assertions only; `test.fixme()` for semantic ones.**               | Structural claims are true by observation and need no triage. Semantic ones ("is this streak *right*?") would freeze today's bugs as expected behaviour.                                                                                                                                                                                                                                                                                                                 |
| **A unit too big for one session splits by view group, same pass, same files.** | Write-as-you-go makes the files append-safe. Splitting a unit by view for *verification* would break the unit definition; splitting only for *writing* does not.                                                                                                                                                                                                                                                                                                         |
| **No signed-out sweep.**                                                        | The guard is one default-deny branch in `src/router.ts:74-77`, with seven `public` routes. Sweeping 46 routes tests one `if` 46 times. The one real question — does the login redirect preserve the destination — moved into unit 15.                                                                                                                                                                                                                                    |
| **No Slovak locale sweep.**                                                     | The sweep runs in English, so SK-only defects won't surface. Accepted: the app is used daily in Slovak, so they get found in ordinary use. File them into the relevant unit's `findings.md` when spotted.                                                                                                                                                                                                                                                                |
| **Unit prompts are pre-generated files, not a table to fill in.**               | Generation was mechanical (Haiku, parallel, verbatim from the table); the judgement — specific intent sources, per-unit known-issues — was added afterwards in one pass by a session that had `_routes.md`, the shell findings and git history already in context. Nineteen agents would each have re-derived it.                                                                                                                                                        |
| **Findings carry `Status:` and `Verify:`.**                                     | So a retest round runs only the `Verify:` blocks of findings marked `fixed` — minutes, not a re-crawl. `Repro` demonstrates the bug; `Verify` proves it's gone. They are not the same field.                                                                                                                                                                                                                                                                             |
| **Triage batches by root cause, not one ticket per finding.**                   | Unit 9 and `_shell` between them found seven unnamed icon buttons. That's one fix. A per-finding queue makes a fixing session open the same files seven times and reach seven slightly different conclusions.                                                                                                                                                                                                                                                            |
| **App-side and `[framework]` findings never share a batch.**                    | `src/_common` is a submodule other apps depend on: its fixes are a commit in `vue_framework` plus a pointer bump, in that order. The "same" defect in both places is two batches.                                                                                                                                                                                                                                                                                        |
| **Phase 4 extracts per group, then reconciles once.**                           | The app's unit docs are ~100k tokens. One session could hold them but would miss the small "captured here, read nowhere" facts the map exists for. Extracts write a fixed-shape table so the reconcile reads ~20k tokens, not 100k. The framework units are mapped separately (no app data flows into them), and "what *should* notify" is a backend audit, not a frontend guess. (Settled 2026-10-01; this row used to read "No Phase 4 prompt yet".) |
| **`POST /test/seed` first, before further units.**                              | Blocked Phase 2, Phase 5 and X2. ✅ **Delivered** — see [`backend/_done/B1-test-seed-endpoint.md`](backend/_done/B1-test-seed-endpoint.md). All three are unblocked.                                                                                                                                                                                                                                                                                                     |
| **Drive the browser with `playwright-cli`, not the Chrome extension.**          | Snapshots cost a fraction of a screenshot and can be asserted on; `generate-locator` and the `### Ran Playwright code` echo make the crawl emit its own spec lines; `localstorage-list`, numbered `requests` and `response-body` answer template §5/§6 directly; `route`/`network-state-set` make error states reachable for the first time. Costs: the a11y tree is blind to canvas charts and to visual polish, which §2 and §4 of the template now handle explicitly. |

**Known blocked:** nothing structural. The remaining blockers are data and backend defects, not tooling — see *Before you start a unit*, above.
