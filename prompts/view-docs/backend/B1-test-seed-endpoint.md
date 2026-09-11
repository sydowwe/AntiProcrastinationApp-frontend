# B1 — `POST /test/seed`: reset the database to a known fixture

> ✅ **DELIVERED** (verified 2026-09-10). Shipped as **`POST /api/test/seed`** — the prefixed form; the open
> question at the bottom of this file was answered that way, and the client posts there. Returns 200 with
> fixture `e2e-v1`. Gated on Development **and** a local database, so against the shared remote DB it is not
> registered and answers 401. Kept as the record of what was asked and why.
>
> **The two follow-ups noted here have been re-measured (2026-09-11) and split into their own files:**
>
> - the fixture gap grew from one surface to four — now [`B3`](B3-seed-fixture-coverage.md);
> - the "two profile grid endpoints answer 500" framing was wrong. It is **not** per-endpoint and **not**
>   limited to the profile grids: any grid 500s when `sortBy` names an unmapped key, including
>   `reminder-dashboard/my-upcoming`, which is not a grid route. One bug, now
>   [`B2`](B2-grid-500-on-unmapped-sortby.md). The `errorId`s quoted here (`73e7261d482b`, `a2c8d4d3b9cb`) are
>   stale; B2 carries fresh ones.

**Repo:** the .NET 10 / FastEndpoints backend, not this one.
**Blocks:** every Playwright spec in `e2e/`, and the mutation half of the view-documentation sweep.
**Effort:** medium. **Risk if done carelessly: high** — see *Gating*, which is the part to get right first.

## Why this exists

The frontend already calls this endpoint. `e2e/global-setup.ts` posts to `/test/seed` before any test runs and
throws if it cannot reach it:

```ts
const context = await request.newContext({ baseURL: API_URL, ignoreHTTPSErrors: true })
const response = await context.post('/test/seed')
if (!response.ok()) throw new Error(`Seed endpoint returned HTTP ${response.status()}: ...`)
```

It does not exist, so **`globalSetup` fails and no spec can execute** — not even one that never touches the
seeded data. A draft spec has already been written (`e2e/tests/todo-lists.draft.spec.ts`) and left unrun for
this reason.

The alternative — every spec cleaning up after itself — was considered and rejected: it spreads the burden
across ~19 test files, gets it wrong once, and then every later test runs against polluted state with no way to
tell which failure is real.

## Contract

```
POST /test/seed
```

- **No authentication.** `globalSetup` runs before any login, with no cookie. This is precisely why the gating
  below is non-negotiable.
- **`200 OK`** once the database is in the known state. A useful body is welcome but not required — if you
  return one, return the stable ids the specs will need (see *Fixture*), so the client can stop hardcoding.
- **Any non-2xx fails the whole test run** with the status and body surfaced, which is the desired behaviour.
- **Synchronous.** Do not return until the reset is complete. A 202-and-poll shape would require changing the
  client, and `globalSetup` has nowhere sensible to poll from.

**Resolve the path prefix.** Every other endpoint the app calls is under `/api/` (`/api/user/data`,
`/api/notification/mine`, `/api/todo-list/{id}`), but the client posts to `/test/seed` with no prefix. Decide
which is right for your routing. If it should be `/api/test/seed`, say so and I will change
`e2e/global-setup.ts` — do not add a compatibility route to accommodate a client mistake.

## Gating — do this first

An unauthenticated endpoint that truncates the database is the most dangerous thing in this document.

- **Gate on the hosting environment**, not on a config flag. `IWebHostEnvironment.IsDevelopment()` or an
  explicit environment allow-list — something that cannot be turned on by copying an `appsettings` block into
  the wrong environment.
- **Outside the allowed environments the route must not exist at all** — not registered, 404, not a 403. A 403
  confirms the endpoint is there.
- **Fail closed** if the environment cannot be determined.
- **Guard the connection string too, if that is cheap.** Refusing to run against a database whose name does not
  look like a test database is a second, independent seatbelt. Worth it here.

Please state in your reply exactly what the gate is, so it can be reviewed on its own.

## Behaviour

- **Idempotent and deterministic.** Calling it twice leaves the same state as calling it once — same rows, same
  ids, same values. Specs will assert against those ids.
- **Stable ids.** Not "whatever the identity column produced this time". If that means resetting sequences or
  seeding explicit ids, do that.
- **Fast enough to run before every suite.** It is on the critical path of every local test run.
- **Scoped.** Reset what the tests touch; do not reset schema-migration state or anything operational.
- **Fixed clock-relative dates.** Dates must be computed relative to "now" at seed time (yesterday, next
  Tuesday), not hardcoded calendar dates that silently go stale.

## Fixture — what the data must contain

Beyond a generally representative dataset, these are **specific gaps found while documenting the app**, where a
feature is fully implemented and simply never renders because no data exercises it. Each one is currently
invisible to both a human reviewer and an automated test.

1. **The e2e user account itself.** `e2e/fixtures/auth.ts` logs in with `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`
   (`test@example.com` / `testpass123` in `.env.test`). That account must exist, be confirmed, and be able to
   sign in immediately after seeding.
   **Its locale must be `EN`.** The account's persisted locale drives the whole UI (`App.vue` sets
   `i18n.locale` from `currentUser.locale`), and the documentation sweep and every spec's label-based locator
   assume English. A Slovak-defaulting test user breaks both.
2. **A second, separate account with its own data.** Needed to test per-account isolation — several stores
   namespace `localStorage` by account id, and the check is "sign in as A, then as B, confirm A's pinned
   templates and dismissed hints did not follow".
3. **≥5 to-do items with a non-zero `suggestedTime`, *and* matching `ActivityHistory` entries for the same
   activity.** The estimate-vs-actual calibration (per-item "usually Nm" chip, plus a header ratio line gated
   on ≥5 comparable items) is fully built and its endpoint returns 200 — but no seed item has a
   `suggestedTime`, so neither surface has ever rendered.
4. **At least one overdue, not-done to-do item**, enough of them to cross the overdue-renegotiation threshold.
   The banner and its "reschedule all" / "review one by one" actions currently never appear.
5. **A to-do item with `totalCount > 1`** and partial progress, for the multi-count counter.
6. **Planner data spanning a known date range**, including a day with tasks and a day without, so both the
   populated and empty states of `/day-planner/:date` are reachable.
7. **At least one activity that is archived**, and one with `canDelete: false` because something references it
   — both lifecycle states are currently untestable.
8. **Leisure profiles across all three kinds** (backlog, bucket-list, project) on distinct activities, plus at
   least one memory anchor linked to a one-time bucket-list entry, so the "close the loop" relationship is
   exercised.

If any of these is expensive, say which and why rather than silently omitting it — an unexercised feature is
the thing this list exists to prevent.

## Non-goals

- Not a general-purpose data factory or a per-test fixture API. One endpoint, one known state.
- Not a production data tool.
- Do not add per-entity test endpoints alongside it.

## Verification

1. With the app running in development: `curl -k -X POST https://localhost:8080/test/seed` returns 200.
2. Call it twice; the second call returns 200 and leaves identical ids and values.
3. Sign in at `https://localhost:3000` as the e2e account and confirm the UI is in **English**.
4. From `e2e/`, `npx playwright test tests/todo-lists.draft.spec.ts` gets past global setup and executes.
5. Confirm the four previously-invisible surfaces now render: the estimate-vs-actual chip, the header ratio
   line, the overdue banner, and a partially-complete multi-count item.
6. Deploy-shaped check: with the environment set to production, confirm the route is **absent**, not forbidden.

## Reply with

- The exact gating mechanism.
- The final path (`/test/seed` or `/api/test/seed`) — I will change the client if needed.
- The stable ids the fixture guarantees, so specs can reference them instead of discovering them.
- Anything in the fixture list you did not build, and why.
