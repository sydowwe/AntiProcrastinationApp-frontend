# B3 — the `e2e-v1` fixture seeds no rows for four surfaces

> Measured 2026-09-11 against a local API + local Postgres, signed in as the seed's `primaryUser` (id 10001),
> fixture `e2e-v1`. Every endpoint below returned **200** — this is a data gap, not a defect.

**Repo:** the .NET 10 / FastEndpoints backend, not this one — a fixture extension to the seeder behind
[`B1`](B1-test-seed-endpoint.md)'s `POST /api/test/seed`.
**Blocks:** unit **08** (`planner-templates`) outright. Degrades units **05** (`tracking-dashboards`), **06**
(`tracking-settings`) and half of **18** (`notifications`).
**Effort:** small per surface. **Risk:** low.
**Read first:** the API repo's `docs/e2eTestSeed.md`, under *What belongs in the fixture* — it, not this file,
decides what may go in. Nothing below is a request for a parameterised seed endpoint.

## Why this exists

The sweep documents what a screen shows. A screen with no rows is documented as an empty state, in good faith,
by an agent that cannot tell "this fixture has no data" from "this feature is broken". That output then has to
be disproved by a human, which costs more than the fixture row would have.

`B1` already tracked the day-planner templates gap as a follow-up. Re-driving every route on 2026-09-11 found
three more surfaces in the same position, so they are collected here rather than filed one at a time.

## The four surfaces

### 1. Day-planner templates — blocking

```
GET /api/task-planner-day-template  =>  200  []
```

`/day-planner/templates` renders *"No templates yet / Create your first template"*. Unit 08 owns three views
and **two of them are unreachable without a template**:

- `/day-planner/templates/:templateId` — no id exists to navigate to
- `/day-planner/templates/split` — renders, but both selectors are empty ("Select a template")

`e2e/templateDayPlanner.spec.ts` skips all 10 of its tests on `test.skip(templateUrl === null)` for the same
reason.

**Needs:** at least two templates (two, so the split/compare view has something to compare), each with a
handful of template tasks across the day, and their ids echoed in the seed response under a `dayPlannerTemplates`
key so specs can stop hardcoding.

### 2. Activity-tracking entries — degrading

All five dashboard endpoints answer 200 with empty payloads:

```
POST /api/activity-tracking/web-extension/summary-cards  => 200  []
POST /api/activity-tracking/web-extension/pie-chart      => 200  {"domains":[],"totals":{"totalSeconds":0, …,"totalEntries":0}}
POST /api/activity-tracking/web-extension/timeline       => 200  {"primarySessions":[],"detailSessions":[],"backgroundSessions":[]}
```

All four of unit 05's dashboards (`/activity-tracking`, `/activity-tracking/unified`,
`/activity-tracking/desktop`, `/activity-tracking/android`) render their full control surface — range
selectors, chart-mode toggles, "Shape of the day" — over *"No activity recorded for this period"*, with every
metric at zero.

This one costs more than it looks: unit 05 is four **chart** views, and the sweep's canvas-chart clause has
the agent read a chart from its populating response. Here that response is empty, so there is nothing to read
and nothing to check the clause against.

**Needs:** browser, desktop and Android tracking entries across the seeded date range, ideally overlapping the
existing `activityHistoryEntries` so the unified dashboard has more than one source to split by.

### 3. Distinct tracking entries — degrading

```
/activity-tracking/desktop/settings/distinctEntries  →  "No data available"  ·  0-0 of 0
/activity-tracking/android/settings/distinctEntries  →  "No data available"  ·  0-0 of 0
```

Both of unit 06's views render their filter row and their whole action bar (`Clear`, `To activity`,
`To ignored`, `Save`) against an empty table, so the mapping workflow — which is the entire point of the view —
cannot be exercised or documented.

**Needs:** a handful of unmapped distinct entries per platform (process/product/window title for desktop, app
label/package name for Android), plus at least one existing mapping so the *Mappings* tab is non-empty.

### 4. Notifications — degrading

```
GET /api/notification/mine?limit=20   =>  200  (empty)
GET /api/notification/unread-count    =>  200  0
```

`/notifikacie` renders *"No notifications yet. When something happens, you'll find it here."* The sibling view
in the same unit, `/nastavenia/pripomienky`, is fully populated (10 rows), so only half of unit 18 is affected.

**Needs:** a few notifications of differing type and read state, so the `All / Unread` filter and the type
filter have something to discriminate.

## Where the data should come from — seed it, don't let specs create it

The local database is disposable, so "a spec could just create it" is a fair question. For these four surfaces
the answer is still **the fixture**, and the reason is what consumes them:

**The documentation sweep's inventory pass is read-only by design.** An agent opens the screen and writes down
what is on it. If the rows exist only because some spec created them, the screen is empty when anyone opens it
by hand — which is the exact failure this ask exists to remove. The sweep, not the spec suite, is the primary
consumer here.

Two supporting reasons: the inventory docs record what is on screen, so it has to be the *same* every time; and
with `workers: 1` and one reset per run, anything a spec creates **persists** into every later spec, while
fixture rows are the one stable thing.

This does not contradict the rule in the frontend's `CLAUDE.md` that a mutating spec should create its own row
through the app's own API. That rule is about not corrupting shared fixture rows when you are testing a
*write*. It is not a reason to leave a screen empty. The clean split:

> **The fixture answers "what does this screen look like with data".
> A spec answers "what happens when I change it."**

All four surfaces here are the first question.

### Which of the four a client could seed for itself — only one

Checked against the API source, because "could a spec just create it?" has a different answer per surface and
only one of the four is actually reachable from a browser session:

| Surface | Reachable from a normal web session? | Why |
| --- | --- | --- |
| **1. Day-planner templates** | ✅ **yes** | `CreateTaskPlannerDayTemplateEndpoint` is a plain `BaseCreateEndpoint` with a validator and **no extra policy** — an ordinary authenticated `POST /api/task-planner-day-template` |
| **2. Tracking entries** | ❌ **no** | the three ingest endpoints sit behind `PortalAuthorizationPolicies.ActivityTracking`, which does `RequireRole(ExtensionRoleClaimsProvider.ExtensionRole)` — and that `"ActivityTracking"` role is granted **only to tokens minted for a browser extension** |
| **3. Distinct tracking entries** | ❌ **no** | derived from surface 2 |
| **4. Notifications** | ❌ **no** | backend-produced; no client write path at all |

So **surface 1 is the one the e2e suite could cover itself**, and it is also the one that blocks a unit
outright. The other three have to come from the fixture — there is no client-side route to them.

**Surface 1 is being handled frontend-side** by
[`../E2E-TEMPLATE-SEEDING.md`](../E2E-TEMPLATE-SEEDING.md), so **you may deprioritise it** relative to 2–4.
It is not withdrawn: seeding templates in the fixture would still be worth having, because a spec that creates
its own templates covers the *write* path but leaves the read-only views depending on that spec having run.
Treat surface 1 as "nice to have"; **2, 3 and 4 are the ones only you can do.**

Worth correcting a caveat an earlier draft of this file had backwards: the blocker is **not**
`[AllowExtensionClients]`. That attribute *lifts* a deny-by-default for extension tokens, and its handler says
so explicitly — *"Not an extension client (web client) - always allow."* The blocker is the **role
requirement** in the policy, which a web session does not carry.

### One request about *how* the tracking rows are created

For surfaces 2 and 3, please seed them **through the ingest path** rather than inserting the derived rows
directly — call whatever the heartbeat handlers call, or have the seeder POST to the endpoints itself:

| Source | Endpoint |
| --- | --- |
| Browser | `POST /api/activity-tracking/web-extension/heartbeat` |
| Desktop | `POST /api/activity-tracking/desktop/heartbeat` (via `ActivityTrackingDesktopGroup`) |
| Android | `POST /api/activity-tracking/android/sync` |

Two reasons. The distinct-entries and mapping tables behind surface 3 are **derived** from the tracking rows,
so driving the pipeline populates them the way production does and avoids inventing a combination the pipeline
could never produce. And it means the fixture exercises the ingest path, which nothing else currently covers.

## What "done" looks like

For each surface, signed in as `primaryUser`:

1. `/day-planner/templates` lists at least two templates; clicking one reaches
   `/day-planner/templates/:templateId` and it renders tasks; `/day-planner/templates/split` can select a
   different template on each side.
2. `npm test --prefix e2e -- templateDayPlanner.spec.ts` no longer skips on `templateUrl === null`.
3. `/activity-tracking` shows a non-zero session count and a populated timeline; the `pie-chart` response
   carries at least one entry in `domains`.
4. `/activity-tracking/desktop/settings/distinctEntries` lists unmapped entries and its *Mappings* tab is
   non-empty; same for `/android/`.
5. `/notifikacie` lists notifications, and the `Unread` filter returns a strictly smaller set than `All`.
6. Any new stable ids appear in the `POST /api/test/seed` response body alongside the existing
   `activities` / `todoLists` / `profiles` keys, and new row counts appear under `counts` — the specs read ids
   off the response rather than hardcoding them.

## Not part of this ask

- **A parameterised or per-test seed.** One fixture, reset as a whole; `docs/e2eTestSeed.md` explains why.
- **Anything about the reminders register being empty.** Those endpoints return **403**, not an empty 200 —
  that is [`B4`](B4-reminders-admin-403.md), a different problem with a different cause.
