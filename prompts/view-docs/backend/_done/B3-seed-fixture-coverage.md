# B3 — the `e2e-v1` fixture seeds no rows for four surfaces

> Measured 2026-09-11 against a local API + local Postgres, signed in as the seed's `primaryUser` (id 10001),
> fixture `e2e-v1`. Every endpoint below returned **200** — this is a data gap, not a defect.

---

## STATUS 2026-09-13 — **delivered. All six criteria hold.**

Re-driven in a browser against a local API + local Postgres, signed in as `primaryUser`, after a cold
`POST /api/test/seed`. **All six of the "done" criteria below now hold.** The four surfaces are seeded and
the ask's premise — "a screen with no rows" — no longer reproduces anywhere.

> **Correction, same day.** An earlier pass of this block reported criterion 4 as failing, on the grounds
> that the Android *Mappings* tab rendered "No data available". That was a **bad measurement**: it was taken
> after the browser session's token had expired, on a page that had already been bounced toward `/login`.
> Re-driven on a live session the tab renders its row, and both "missing" ignored mappings were found by
> flipping one filter. Recorded rather than deleted because the failure mode is cheap to repeat — if a grid
> looks empty, assert the session before believing it.

**The fixture is now `e2e-v3`, not the `e2e-v1` this file was written against.** The surfaces below were
filled in `e2e-v2`; `v3` is a superset that adds an admin account and reminder rows. Read the title and the
header quote above as historical.

### What was verified, with the evidence

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Templates list / detail / split | ✅ three templates render — "Relaxed Weekend" (pinned), "Home Office", "Office Day". `/day-planner/templates/20001` renders **5 tasks · 5h 25m planned** on a 07:00–23:00 grid. `/split` takes Home Office left and Office Day right, from a selector listing all three |
| 2 | `templateDayPlanner.spec.ts` no longer skips | ✅ the `test.skip(templateUrl === null)` guard is gone; the spec drives `seed.dayPlannerTemplates.homeOffice` and asserts `counts.dayPlannerTemplates === 3`. **But see the blocker below — the spec cannot currently run** |
| 3 | Tracking dashboard populated | ✅ `/activity-tracking` renders a timeline of github.com / docs.microsoft.com sessions, no empty state. `web-extension/pie-chart` returns **5 domains, 150 entries, 4 965 total seconds** |
| 4 | Distinct entries + mappings, both platforms | ✅ desktop distinct entries `1-6 of 6`, Android 5 rows — both match `counts` exactly. Both *Mappings* tabs render their row (`rider64.exe → Desk Research`; `com.spotify.music → Read a Novel`), and **all four seeded mappings are reachable** — see the note below on the Type filter |
| 5 | Notifications | ✅ all six render, three marked unread, the `All`/`Unread` and type filters are present, and the nav badge reads "3 unread" |
| 6 | Ids and counts in the seed response | ✅ `dayPlannerTemplates`, `trackingMappings`, `notifications` and all nine new `counts` keys present |

### The Mappings tabs show one row each, and that is correct

Both grids default their **Type** filter to `Activity`, so each tab opens showing only the to-activity
mapping of its platform. The *ignored* halves are not missing — switch Type to `Ignored` and they are there:

```
android  filter.type="Ignored"  =>  200  itemsCount 1   21102: com.android.settings
desktop  filter.type="Ignored"  =>  200  itemsCount 1   21002: SteamLauncher.exe
```

So all four rows the seed promises (`androidToActivity` 21101, `androidIgnored` 21102, `desktopToActivity`
21001, `desktopIgnored` 21002) are present and reachable. The backend's note that "the Mappings tab is where
you'll see them" holds exactly.

Also correct, and not a gap: the ignored mappings have no rows in the *distinct-entries* grids
(`com.android.settings` is absent from the Android list). The seeder drops them the way the heartbeat would,
which is the intended behaviour, not a missing row.

### ~~Blocker on criterion 2 — the spec still cannot execute~~ — cleared 2026-09-13

The suite used to refuse to start: `EXPECTED_FIXTURE_VERSION` in `e2e/fixtures/seed.ts` read `e2e-v2` while the
API seeded `e2e-v3`, so `global-setup.ts` threw before the first spec. The guard was doing its job.

**The bump landed with the `B4` close-out** — `v3`'s new shape (`adminUser`, `reminders`,
`reminderDefinitions`, four new counts) is typed in `seed.ts` and `auth.ts` gained an `adminPage` fixture, so
it was not a one-character change. **Criterion 2 is now confirmed by a run**, not just in source: the whole
suite executes — `131 tests · 92 passed · 36 skipped · 3 failed · 6.0m`, global setup green against `e2e-v3`.

`templateDayPlanner.spec.ts` runs and passes except **one** test, and that one is not about seeding:
*"Add New Task button opens the creation dialog"* fails because a Vuetify loading overlay
(`role="status" aria-label="Loading…"` in `.v-overlay-container`) never goes away and intercepts the click for
the full timeout. That is the stuck-overlay bug recorded in `430e6f03`, on the same screen — an app defect, and
someone else's to own.

**Repo:** the .NET 10 / FastEndpoints backend, not this one — a fixture extension to the seeder behind
[`B1`](B1-test-seed-endpoint.md)'s `POST /api/test/seed`. **Blocks:** unit **08** (`planner-templates`) outright. Degrades units **05**
(`tracking-dashboards`), **06**
(`tracking-settings`) and half of **18** (`notifications`). **Effort:** small per surface. **Risk:** low. **Read first:** the API repo's `docs/e2eTestSeed.md`, under
*What belongs in the fixture* — it, not this file, decides what may go in. Nothing below is a request for a parameterised seed endpoint.

## Why this exists

The sweep documents what a screen shows. A screen with no rows is documented as an empty state, in good faith, by an agent that cannot tell "this fixture has no
data" from "this feature is broken". That output then has to be disproved by a human, which costs more than the fixture row would have.

`B1` already tracked the day-planner templates gap as a follow-up. Re-driving every route on 2026-09-11 found three more surfaces in the same position, so they are
collected here rather than filed one at a time.

## The four surfaces

> **Superseded 2026-09-13 — all four are seeded now.** The empty responses and empty-state screenshots below
> are the 2026-09-11 `e2e-v1` measurement and no longer reproduce; they are kept because they are what was
> asked for. The only part still live is the **Android mappings** gap under surface 3 — see the status block
> at the top of this file. Do not re-verify the rest.

### 1. Day-planner templates — blocking

```
GET /api/task-planner-day-template  =>  200  []
```

`/day-planner/templates` renders *"No templates yet / Create your first template"*. Unit 08 owns three views and **two of them are unreachable without a template**:

- `/day-planner/templates/:templateId` — no id exists to navigate to
- `/day-planner/templates/split` — renders, but both selectors are empty ("Select a template")

`e2e/templateDayPlanner.spec.ts` skips all 10 of its tests on `test.skip(templateUrl === null)` for the same reason.

**Needs:** at least two templates (two, so the split/compare view has something to compare), each with a handful of template tasks across the day, and their ids
echoed in the seed response under a `dayPlannerTemplates`
key so specs can stop hardcoding.

### 2. Activity-tracking entries — degrading

All five dashboard endpoints answer 200 with empty payloads:

```
POST /api/activity-tracking/web-extension/summary-cards  => 200  []
POST /api/activity-tracking/web-extension/pie-chart      => 200  {"domains":[],"totals":{"totalSeconds":0, …,"totalEntries":0}}
POST /api/activity-tracking/web-extension/timeline       => 200  {"primarySessions":[],"detailSessions":[],"backgroundSessions":[]}
```

All four of unit 05's dashboards (`/activity-tracking`, `/activity-tracking/unified`,
`/activity-tracking/desktop`, `/activity-tracking/android`) render their full control surface — range selectors, chart-mode toggles, "Shape of the day" — over *"No
activity recorded for this period"*, with every metric at zero.

This one costs more than it looks: unit 05 is four **chart** views, and the sweep's canvas-chart clause has the agent read a chart from its populating response. Here
that response is empty, so there is nothing to read and nothing to check the clause against.

**Needs:** browser, desktop and Android tracking entries across the seeded date range, ideally overlapping the existing `activityHistoryEntries` so the unified
dashboard has more than one source to split by.

### 3. Distinct tracking entries — degrading

```
/activity-tracking/desktop/settings/distinctEntries  →  "No data available"  ·  0-0 of 0
/activity-tracking/android/settings/distinctEntries  →  "No data available"  ·  0-0 of 0
```

Both of unit 06's views render their filter row and their whole action bar (`Clear`, `To activity`,
`To ignored`, `Save`) against an empty table, so the mapping workflow — which is the entire point of the view — cannot be exercised or documented.

**Needs:** a handful of unmapped distinct entries per platform (process/product/window title for desktop, app label/package name for Android), plus at least one
existing mapping so the *Mappings* tab is non-empty.

### 4. Notifications — degrading

```
GET /api/notification/mine?limit=20   =>  200  (empty)
GET /api/notification/unread-count    =>  200  0
```

`/notifikacie` renders *"No notifications yet. When something happens, you'll find it here."* The sibling view in the same unit, `/nastavenia/pripomienky`, is fully
populated (10 rows), so only half of unit 18 is affected.

**Needs:** a few notifications of differing type and read state, so the `All / Unread` filter and the type filter have something to discriminate.

## Where the data should come from — seed it, don't let specs create it

The local database is disposable, so "a spec could just create it" is a fair question. For these four surfaces the answer is still **the fixture**, and the reason is
what consumes them:

**The documentation sweep's inventory pass is read-only by design.** An agent opens the screen and writes down what is on it. If the rows exist only because some
spec created them, the screen is empty when anyone opens it by hand — which is the exact failure this ask exists to remove. The sweep, not the spec suite, is the
primary consumer here.

Two supporting reasons: the inventory docs record what is on screen, so it has to be the *same* every time; and with `workers: 1` and one reset per run, anything a
spec creates **persists** into every later spec, while fixture rows are the one stable thing.

This does not contradict the rule in the frontend's `CLAUDE.md` that a mutating spec should create its own row through the app's own API. That rule is about not
corrupting shared fixture rows when you are testing a *write*. It is not a reason to leave a screen empty. The clean split:

> **The fixture answers "what does this screen look like with data".
> A spec answers "what happens when I change it."**

All four surfaces here are the first question.

### Which of the four a client could seed for itself — only one

Checked against the API source, because "could a spec just create it?" has a different answer per surface and only one of the four is actually reachable from a
browser session:

| Surface                          | Reachable from a normal web session? | Why                                                                                                                                                                                                                                                         |
|----------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Day-planner templates**     | ✅ **yes**                           | `CreateTaskPlannerDayTemplateEndpoint` is a plain `BaseCreateEndpoint` with a validator and **no extra policy** — an ordinary authenticated `POST /api/task-planner-day-template`                                                                           |
| **2. Tracking entries**          | ❌ **no**                            | the three ingest endpoints sit behind `PortalAuthorizationPolicies.ActivityTracking`, which does `RequireRole(ExtensionRoleClaimsProvider.ExtensionRole)` — and that `"ActivityTracking"` role is granted **only to tokens minted for a browser extension** |
| **3. Distinct tracking entries** | ❌ **no**                            | derived from surface 2                                                                                                                                                                                                                                      |
| **4. Notifications**             | ❌ **no**                            | backend-produced; no client write path at all                                                                                                                                                                                                               |

So **surface 1 is the one the e2e suite could cover itself**, and it is also the one that blocks a unit outright. The other three have to come from the fixture —
there is no client-side route to them.

**Surface 1 was being handled frontend-side** by a stopgap prompt that created templates through the app's own API, so **you may deprioritise it** relative to 2–4. It
is not withdrawn: seeding templates in the fixture would still be worth having, because a spec that creates its own templates covers the *write* path but leaves the
read-only views depending on that spec having run. Treat surface 1 as "nice to have"; **2, 3 and 4 are the ones only you can do.**

> **Settled since.** The fixture seeds three templates (`seed.dayPlannerTemplates`), so the read-only views are driven from those and the stopgap is gone — its
> prompt was deleted on 2026-09-13 and what survives is `withTemporaryTemplate` in `e2e/fixtures/dayPlannerTemplates.ts`, one self-cleaning write-path test.

Worth correcting a caveat an earlier draft of this file had backwards: the blocker is **not**
`[AllowExtensionClients]`. That attribute *lifts* a deny-by-default for extension tokens, and its handler says so explicitly — *"Not an extension client (web
client) - always allow."* The blocker is the **role requirement** in the policy, which a web session does not carry.

### One request about *how* the tracking rows are created

For surfaces 2 and 3, please seed them **through the ingest path** rather than inserting the derived rows directly — call whatever the heartbeat handlers call, or
have the seeder POST to the endpoints itself:

| Source  | Endpoint                                                                             |
|---------|--------------------------------------------------------------------------------------|
| Browser | `POST /api/activity-tracking/web-extension/heartbeat`                                |
| Desktop | `POST /api/activity-tracking/desktop/heartbeat` (via `ActivityTrackingDesktopGroup`) |
| Android | `POST /api/activity-tracking/android/sync`                                           |

Two reasons. The distinct-entries and mapping tables behind surface 3 are **derived** from the tracking rows, so driving the pipeline populates them the way
production does and avoids inventing a combination the pipeline could never produce. And it means the fixture exercises the ingest path, which nothing else currently
covers.

## What "done" looks like

For each surface, signed in as `primaryUser`:

1. `/day-planner/templates` lists at least two templates; clicking one reaches
   `/day-planner/templates/:templateId` and it renders tasks; `/day-planner/templates/split` can select a different template on each side.
2. `npm test --prefix e2e -- templateDayPlanner.spec.ts` no longer skips on `templateUrl === null`.
3. `/activity-tracking` shows a non-zero session count and a populated timeline; the `pie-chart` response carries at least one entry in `domains`.
4. `/activity-tracking/desktop/settings/distinctEntries` lists unmapped entries and its *Mappings* tab is non-empty; same for `/android/`.
5. `/notifikacie` lists notifications, and the `Unread` filter returns a strictly smaller set than `All`.
6. Any new stable ids appear in the `POST /api/test/seed` response body alongside the existing
   `activities` / `todoLists` / `profiles` keys, and new row counts appear under `counts` — the specs read ids off the response rather than hardcoding them.

## Not part of this ask

- **A parameterised or per-test seed.** One fixture, reset as a whole; `docs/e2eTestSeed.md` explains why.
- **Anything about the reminders register being empty.** Those endpoints returned **403**, not an empty 200 — that is [`B4`](B4-reminders-admin-403.md), a
  different problem with a different cause. Closed 2026-09-13; `e2e-v3` seeds six reminders **and** an `adminUser` that can see them, so the register is no longer
  empty for anyone.
