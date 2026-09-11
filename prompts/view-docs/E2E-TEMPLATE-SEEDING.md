# Unblock unit 08: create day-planner templates through the app's own API

> ## ⚠️ DONE AND SUPERSEDED — do not run this.
>
> Executed 2026-09-11. It worked: the ten skipped tests ran, and doing so surfaced the defect that
> `/day-planner/templates` renders no cards behind a permanent loading overlay once a second template
> exists (now fixed — `useFetchFiltered` aborted its own concurrent calls).
>
> **[`B3`](backend/B3-seed-fixture-coverage.md) then landed**, so the premise is gone: the `e2e-v2`
> fixture seeds three templates and the read-only views are driven from `seed.dayPlannerTemplates`.
> Creating more would put five templates on a screen the sweep documents by hand, which is the exact
> thing B3 argues against. The helper survives only as one self-cleaning write-path test
> (`withTemporaryTemplate` in `e2e/fixtures/dayPlannerTemplates.ts`).
>
> Everything below is kept for the reasoning — the endpoint shapes, the enum-vs-string traps, the
> cookie-auth note. The **instructions** are obsolete, and so are its baseline figures
> (`46 passed · 45 fixme`), which were already stale on the day it ran.

Hand this to a fresh session. **Sonnet 5, high effort.** Browser + running backend required.
`CLAUDE.md` auto-loads. Windows — use the **PowerShell tool**, never Bash.

---

## Why this exists

`POST /api/test/seed` (fixture `e2e-v1`) creates **no day-planner templates**. Consequences, all measured
2026-09-11:

- `/day-planner/templates` renders *"No templates yet / Create your first template"*.
- `/day-planner/templates/:templateId` is **unreachable** — there is no id to navigate to.
- `/day-planner/templates/split` renders, but both selectors are empty ("Select a template").
- `e2e/tests/templateDayPlanner.spec.ts` skips **all 10** of its tests on
  `test.skip(templateUrl === null, 'No templates found in seed data')`.
- Unit **08** of the view-documentation sweep cannot run (`prompts/view-docs/UNIT-ORDER.md`, Wave G).

The fixture gap is filed as [`backend/B3-seed-fixture-coverage.md`](backend/B3-seed-fixture-coverage.md), and
B3 covers **four** empty surfaces. **Three of them cannot be fixed from this repo** — the activity-tracking
ingest endpoints sit behind a policy requiring the `ActivityTracking` role, which
`ExtensionRoleClaimsProvider` grants **only to browser-extension tokens**, and notifications have no client
write path at all.

**Templates are the exception, and that is the whole point of this task.**
`CreateTaskPlannerDayTemplateEndpoint` is a plain `BaseCreateEndpoint` with a validator and **no extra
policy** — an ordinary authenticated POST. So the e2e suite can create its own templates today, with no
backend change and no waiting on B3.

This also follows the preference `CLAUDE.md` already states under *Mutating specs*: **create the row you are
about to use through the app's own API and leave the fixture read-only** — which covers the write path too,
something seeding never does.

## Hard constraints

1. **Do not change `src/`.** This is e2e work. If you think a `src/` change is needed, stop and say why.
2. **Do not ask the backend for anything.** The endpoints you need already exist; that is the premise.
3. **Do not weaken an assertion to make a test pass.** If a `templateDayPlanner.spec.ts` test fails against a
   real template, that is a **finding**, not something to edit around — convert it to `test.fixme` with a
   comment naming what you observed, exactly as `todo-motivation.spec.ts` does.
4. **Do not seed via direct DB access or a new backend route.** Through the app's HTTP API only.

## Before you start

- API on `https://localhost:8080` pointed at a **local** Postgres, dev server on `https://localhost:3000`
  (this exact origin). Both running.
- Reseed first: `npm test --prefix e2e -- tests/auth.spec.ts` runs global setup, or POST the seed endpoint
  directly. The response lands in `e2e/.state/seed.json`.
- **Expect the first page load in a fresh browser to fail with `net::ERR_CERT_VERIFIER_CHANGED` and reload
  past it.** It can also make the two sign-in tests in `auth.spec.ts` fail spuriously — see
  `README.md` prerequisite 4 before you investigate either as a real defect.
- The e2e project is **its own npm project**: run from `e2e/` — `npm test`, `npm run typecheck`.

## What is already verified — do not re-derive

### The two endpoints

```
POST /api/task-planner-day-template      → creates the template
POST /api/template-planner-task          → adds one task to it
```

Client-side equivalents, if you want the existing request shapes:
`src/core/dayPlanner/api/taskPlannerDayTemplateApi.ts` and `templatePlannerTaskApi.ts`.

### Request shapes, from the API source

`TaskPlannerDayTemplateRequest` — only **three** fields are required:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string ≤100 | ✅ | |
| `isActive` | bool | ✅ | |
| `suggestedForDayType` | `DayType` | ✅ | wire value is the C# member name — `"Workday"` / `"Weekend"`, as seen on `GET /api/calendar/by-date/{dd-MM-yyyy}` |
| `description` | string ≤500 | — | |
| `icon` | string ≤50 | — | |
| `defaultWakeUpTime` / `defaultBedTime` | `TimeDto` | — | `{ "hours": 7, "minutes": 30 }` |
| `scheduledDays` | `DayOfWeek[]` | — | defaults `[]`; C# `DayOfWeek` names |
| `suggestedLocation` | `Location?` enum | — | **an enum, not a free string** — unlike `location` on a task. Omit it unless you confirm the members |
| `tags` | string[] | — | defaults `[]` |

`TemplatePlannerTaskRequest` (= `BasePlannerTaskRequest` + `templateId`):

| Field | Type | Required |
| --- | --- | --- |
| `templateId` | long | ✅ |
| `activityId` | long | ✅ |
| `startTime` / `endTime` | `TimeDto` | ✅ |
| `isBackground` | bool | ✅ |
| `location` | string ≤200 | — (a **string** here) |
| `notes` | string ≤1000 | — |
| `importanceId` | long | — |

Activity ids come off the `seed` fixture (`seed.activities.bugFixing` = 12001, etc.) — **read them, don't
hardcode**.

### Auth works from an API request context

Auth is **httpOnly cookies** on domain `localhost` (`auth-token` at path `/`, plus `refresh-token` and
`session-hash`). Cookies ignore the port, so a context built from the stored state reaches `:8080`:

```ts
const ctx = await request.newContext({
  baseURL: apiUrl(),                       // from fixtures/seed.ts
  storageState: '.state/auth-10001.json',  // written by fixtures/auth.ts
  ignoreHTTPSErrors: true,                 // self-signed dev cert — without this every call dies
})
```

There is no bearer token to extract. Do **not** re-implement sign-in; reuse what `fixtures/auth.ts` produces.

## The task

Make `/day-planner/templates` have templates, from the e2e suite, and get
`templateDayPlanner.spec.ts` actually executing.

**Create at least two templates** — two, not one, because `/day-planner/templates/split` compares a left and a
right and cannot be exercised with one. Give each a few template tasks across the day so the calendar grid has
something to render.

### Decisions to make deliberately — these are the real work

1. **Where the helper lives, and how a spec gets at it.** `e2e/fixtures/` is the home. Options include a
   plain exported async function, or a new Playwright fixture alongside `authenticatedPage` / `seed`.
   Whichever you pick, say why in a comment. Note the existing fixtures are the precedent for how ordering is
   expressed (`authenticatedPage` depends on `seed`, which is what makes the reset happen first).

2. **Idempotency and the reset boundary.** `POST /api/test/seed` is a **full truncate-and-rebuild of every
   account**, and `global-setup.ts` calls it once per run. So templates you create are wiped by any later
   reseed — including a `test.use({ freshSeed: true })` block in another file. Decide where creation hooks in
   so it survives that, and write down the rule. Getting this wrong is the failure mode that matters: it shows
   up as an unrelated spec skipping again, hours later.

3. **Whether creation is idempotent or additive.** `workers: 1` and one reset per run means a naive
   "create two templates" in a `beforeAll` accumulates across runs *if* no reseed happened in between. Decide
   whether to look for existing ones first, or to rely on the reset, and be explicit about which.

4. **What `templateDayPlanner.spec.ts` should now do.** Its `resolveTemplateUrl` + `test.skip` exists purely
   because no template existed. Replace the skip with the real thing — but **keep a clear failure** if
   creation did not happen, rather than silently skipping again. A spec that skips when it should fail is how
   this gap stayed invisible.

### Then verify it end to end

- All 10 tests in `templateDayPlanner.spec.ts` **execute**. Passing is the goal; a genuine defect becomes a
  `test.fixme` with a comment (constraint 3), not a softened assertion.
- `/day-planner/templates` lists your templates in the browser.
- `/day-planner/templates/:templateId` renders the calendar grid with the tasks you added.
- `/day-planner/templates/split` can select a **different** template on each side.
- `npm run typecheck` in `e2e/` exits 0.
- The whole suite still passes: `npm test --prefix e2e`. The baseline before you start is
  **46 passed · 45 fixme · 0 failed** — re-measure it yourself first, since that figure is from 2026-09-10.
  `todo-lists.spec.ts` has one **known flake under load** documented at its line ~135; if that is your only
  failure, say so rather than chasing it.

Drive the browser checks with `playwright-cli` per `CLAUDE.md` → *Browser verification*. Prefer `find` over
`snapshot`.

## Traps

- **`suggestedLocation` is an enum (`Location?`), while a task's `location` is a free string.** Same word, two
  types, one object apart. Omit the enum unless you have read its members.
- **Enum wire values are C# member names** (`"Workday"`, not `"workday"`) — see `CLAUDE.md`'s
  `convertToEnum` note for why this bites in both directions.
- **Never `new Date()`.** Derive any date from `seed.seedDateUtc`, via `seedDateParam(seed, offset)` for the
  `dd-MM-yyyy` planner form. The `/day-planner/:date` route takes **`dd-MM-yyyy`, not ISO** — an ISO date
  400s the calendar fetch and the view then silently shows a *neighbouring* day.
- **Read ids off the `seed` fixture.** Some older specs navigate to a literal `/todo-list/13002`; that is the
  old style, not the target.
- **Do not add a `dayPlannerTemplates` key to `fixtures/seed.ts`'s `SeedResponse`.** That interface describes
  what the **API** returns. If B3 is ever delivered, the key appears there and `EXPECTED_FIXTURE_VERSION` gets
  bumped; your created ids are a different thing and belong wherever your helper returns them.

## When B3 lands, this gets deleted

If the backend later adds templates to the fixture, this helper becomes redundant for unit 08 — but **not
worthless**: it exercises the template **write** path, which seeding never does. Say in your final report
which of the two you think should survive, and why. Do not pre-emptively delete anything.

## Report back with

1. Where the helper lives and how a spec consumes it — plus the ordering rule you settled on for decision 2,
   stated plainly enough that the next person does not have to re-derive it.
2. The `templateDayPlanner.spec.ts` result: how many of the 10 pass, and for any that do not, whether it is a
   real defect (with the `test.fixme` comment you wrote) or something about your setup.
3. The full-suite figure before and after.
4. Anything you found about the template views that belongs in unit 08's eventual `findings.md` — you are the
   first session to see these screens with data in them, so note what you saw even though writing that file is
   **not** your job.
5. Whether `suggestedLocation`, `scheduledDays` or `tags` turned out to matter for the views to render
   properly — B3 will need to know if the fixture ever seeds these for real.
