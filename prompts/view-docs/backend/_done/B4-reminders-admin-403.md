# B4 — every reminders-admin endpoint answers 403 for the seeded account

## ✅ Answered and delivered — 2026-09-13

**The answer was "yes, these five routes should require Admin here."** The policy is deliberate and recent:
the backend's `ReminderCrudAuthMatrixTests` records that these routes used to sit at `GetUserRole()`, that this
contradicted the module's own `summary.md`, and that they were moved to `GetAdminRole()` on purpose. They roll
up **every** user's reminders with no user scoping at all — `ApplyUserScoping` is a deliberate no-op on them —
so the role gate is the only boundary in front of them. The **fixture** was what was wrong, not the policy.

The scheduler contrast measured below is real but does not generalise: `scheduler-dashboard` genuinely is open
to any signed-in user in this host, and `reminder-dashboard/my-upcoming` answering 200 is the design — it is
the self-service sibling and it scopes by caller.

**What landed:** fixture `e2e-v3`, with a third account and reminder rows (there were none before, so items
2–4 of *What "done" looks like* would have returned an empty 200 even with the role):

```
"adminUser":           { "id": 10003, "email": "admin@example.com", "password": "testpass123", "locale": "EN" }
"reminders":           { "callTheDentist": 23001, "fileTaxReturn": 23002, "payRentRecurring": 23003,
                         "paused": 23004, "cancelled": 23005, "secondaryPostParcel": 23101 }
"reminderDefinitions": { each is its portal id + 200 — 23201, 23202, 23203, 23204, 23205, 23301 }
counts: reminderDefinitions 6 · upcomingReminders 4 · reminderDispatches 7 · reminderFailuresNeedingAttention 1
```

`adminUser` is deliberately **not** `primaryUser` promoted: if the account nearly every spec signs in as were
an admin, no spec could tell an admin gate that still works from one silently removed. It carries the per-user
defaults and **no fixture data of its own** — point no content assertion at it.

**Verified 2026-09-13** against a local API + local Postgres, fixture `e2e-v3`, by direct request and then in
the browser on `https://localhost:3000`:

| Route | `primaryUser` | `adminUser` |
| --- | --- | --- |
| `POST /api/reminder-definition/grid` (`sortBy: []`) | **403** | **200**, 6 items |
| `GET /api/reminder-definition/23201` | **403** | **200**, the `Call the dentist` definition |
| `POST /api/reminder-dashboard/upcoming` | **403** | **200**, 4 items |
| `POST /api/reminder-dashboard/dispatch-history` | **403** | **200**, 7 items |
| `GET /api/reminder-dashboard/overview` | **403** | **200**, `upcomingTotal 4 · upcomingNext7Days 3 · pausedCount 1 · cancelledCount 1 · failedNeedingAttention 1` |
| `POST /api/reminder-dashboard/my-upcoming` | **200** (unchanged) | — |

All five views render as `adminUser`: `/pripomienky/register` lists **6 rows**, `/register/23201` renders the
detail (payload `{"title": "Call the dentist", …}`), `/nadchadzajuce` **4 rows**, `/historia` **7 rows**,
`/prehlad` shows *Due within 7 days 3 of 4 upcoming · Paused 1 · Cancelled 1*. **Unit 17 is unblocked** — it
must be run signed in as `adminUser`.

**Two things to carry forward:**

- **`/api/reminder-definition/{id}` takes a `reminderDefinitions` id, not a `reminders` one.** Confirmed:
  `GET /api/reminder-definition/23001` **404s**. The 200-apart numbering is what makes the wrong id fail loudly
  instead of returning someone else's row. The register's *Subject* cell shows the portal id (`Reminder #23004`)
  while its link targets the definition id (`/register/23204`) — that is correct, not a mismatch.
- **The client role model stays as it is.** `src/core/user/authAdapter.ts` returning constant `true` is right;
  `GET /api/user/data` still returns no `roles` field, so the client has nothing to route on. The server is the
  authorization check. Making the client gate on a role would need a backend change — ask, do not infer.

**Client-side follow-up, landed with this:** `EXPECTED_FIXTURE_VERSION` in `e2e/fixtures/seed.ts` is bumped to
`e2e-v3` (global setup fails loudly until it is), `SeedResponse` types `adminUser` / `reminders` /
`reminderDefinitions` / the four new counts, and `e2e/fixtures/auth.ts` exposes an `adminPage` fixture that
reads the credential off the seed response. `primaryUser` stays the plain-user context.

---

> Measured 2026-09-11 against a local API + local Postgres, signed in as the seed's `primaryUser` (id 10001),
> fixture `e2e-v1`. **The original ask follows, unedited.**

**Repo:** the .NET 10 / FastEndpoints backend, not this one.
**Blocks:** unit **17** (`reminders-admin`) — all five of its views.
**Effort:** small, once the question below is answered. **Risk:** medium — it is an authorization decision, so
answer it deliberately rather than by relaxing a policy.

## What was measured

Four endpoints, all **403**, empty body, no `WWW-Authenticate` header — a policy denial, not a missing route
and not an expired session (`GET /api/user/data` returns 200 on the same cookie, in the same tab, moments
before and after):

| View | Endpoint | Status |
| --- | --- | --- |
| `/pripomienky/register` | `POST /api/reminder-definition/grid` | **403** |
| `/pripomienky/register/:id` | `GET /api/reminder-definition/1` | **403** |
| `/pripomienky/nadchadzajuce` | `POST /api/reminder-dashboard/upcoming` | **403** |
| `/pripomienky/historia` | `POST /api/reminder-dashboard/dispatch-history` | **403** |
| `/pripomienky/prehlad` | `GET /api/reminder-dashboard/overview` | **403** |

Each view renders its chrome and then its error or empty state — `/pripomienky/register/:id` shows a load
error, `/pripomienky/prehlad` shows `reminderDashboard.overview.loadError`.

Two contrasts that locate it:

- **`reminder-dashboard/my-upcoming` is not 403.** It is the user-scoped sibling and it answers **200** for
  the same account (it 500s only on a bad `sortBy` — see [`B2`](B2-grid-500-on-unmapped-sortby.md)). So the
  denial is specific to the admin-scoped reminder routes, not to the reminders module.
- **The scheduler's admin routes are not 403.** `POST /api/scheduler-dashboard/jobs-overview`,
  `GET /api/scheduler-dashboard/health` and `POST /api/scheduler-dashboard/run-history` all return **200** for
  the same account, and `/planovac/ulohy` renders 10 real jobs. Unit 19 is the structurally identical
  framework admin surface and it is fully reachable. Whatever policy the reminders routes carry, the scheduler
  routes do not.

The seeded account carries no role that the client can see: `GET /api/user/data` returns
`{id, email, twoFactorEnabled, createdAt, theme, locale, timezone, askBeforeDelete, firstDayOfWeek, weatherLocation}`
and no roles or claims field at all.

## Why the client does not stop this first

This is worth stating because it looks like a frontend bug and is not. Per this repo's `CLAUDE.md`, the app has
**no role model**: `src/core/user/authAdapter.ts` returns constant `true` for `isHrRole` / `isAdminRole` /
`isRootAdmin`, precisely so the framework's reminders and scheduler modules can be routed unmodified. So
`requiredRole: 'admin'` route meta always passes, the view mounts, and the server's answer is the first real
authorization check in the chain. Making the client guess would mean inventing a role model this app does not
have.

## The question

**Should these five routes require an admin role in this deployment at all?** The answer decides the fix, and
it is yours, not the frontend's:

- **Yes, they should.** Then the fixture needs an account that satisfies the policy — either by granting the
  existing `primaryUser` the role, or by adding a third seeded account (say `adminUser`) alongside
  `primaryUser` and `secondaryUser`, echoed in the seed response the same way. Say which, so
  `e2e/fixtures/auth.ts` can add the matching context.
- **No — this is a single-user app and the reminders register is an ordinary screen.** Then the reminders
  routes are simply inconsistent with the scheduler's, and the policy should come off them to match.

Please do not answer it by disabling authorization globally in Development. The sweep needs the deployed
behaviour documented, and a policy that exists only in production is one nobody tests.

## What "done" looks like

Signed in as whichever account the answer nominates:

1. `POST /api/reminder-definition/grid` with `sortBy: []` returns **200** with a body, not 403.
2. `/pripomienky/register` lists reminder definitions rather than *"No data available"*.
3. `/pripomienky/register/:id` for an id from that list renders the detail view instead of its load-error
   state.
4. `/pripomienky/nadchadzajuce`, `/pripomienky/historia` and `/pripomienky/prehlad` all render data.
5. If a new account was added, it appears in the `POST /api/test/seed` response next to `primaryUser` /
   `secondaryUser`, with its password echoed the same way.

## This is now unit 17's only gate

When this was written, unit 17 needed **two** things: the 403, and a locale fix — all five views rendered raw
i18n keys because `src/_common/modules/reminders/_locales/` shipped Slovak-only files while the app defaults to
English.

**The locale half landed on 2026-09-11 and is verified**: `reminders.en.ts` and `remindersDashboard.en.ts`
now exist, and the views render *"Reminder register / Owner module / Subject / Kind / Schedule type / Status /
Next occurrence"* in English. So the 403 is the only thing left — this ask alone unblocks the unit.
