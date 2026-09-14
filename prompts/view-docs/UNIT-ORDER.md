# Unit running order — recommended sequence

> **Re-measured 2026-09-11.** Every unit's primary routes — all 53 — were driven signed in against a freshly
> reseeded local API (fixture `e2e-v1`) and checked for non-2xx responses, unresolved i18n keys, and whether
> the view *actually renders rows*. The blocker facts here are observed, not inferred from source.
> The authoritative blocker table lives in [`README.md`](README.md) § *Before you start a unit*; this file is
> only the **order**, and why it is that order.
>
> **What moved since 2026-09-10**, in both directions:
>
> | Unit | Was | Now | Why |
> | --- | --- | --- | --- |
> | **02** activity-settings | ⛔ Wave E (405) | ✅ **Wave C** | The `/grid` rename is **finished** server-side. Renders 10/16/19 rows across its three tabs |
> | **17** reminders-admin | Wave F (locale only) | ✅ **runnable** | Both gates closed. The 403 was correct — the routes are Admin-gated on purpose; fixture `e2e-v3` adds an `adminUser` that passes them ([`B4`](backend/_done/B4-reminders-admin-403.md)). **Sign in as `adminUser`, not `primaryUser`** |
> | **06, 18** | ✅ clean | ⚠️ **runnable, no data** | Their tables are empty — previously counted as clean because the requests returned 200 |
> | **05** tracking-dashboards | ✅ clean | ⚠️ **runnable, no data** | All four dashboards render over empty payloads |
> | **11** leisure-backlog-picker | raw key `enums.energyLevel.Low` | ✅ that key is **fixed** | Still blocked, but by the grid 500 only |
>
> **The three "opaque 500s" were one bug** ([`B2`](backend/_done/B2-grid-500-on-unmapped-sortby.md)), and the
> one fix **landed on 2026-09-13**, releasing units 11, 12, 16 and 13's table view together. The old "nested
> `sortBy`" theory is refuted twice over: the trigger was *unmappable*, and nested paths now resolve natively.
>
> **Updated later the same day, after two fixes landed:**
>
> | What | State |
> | --- | --- |
> | **Reminders EN locale** | ✅ **done and verified.** `reminders.en.ts` / `remindersDashboard.en.ts` exist, `EN.ts` spreads both, all five reminders views render English, and `reminders.scan` is gone from unit 19 too. **Wave F dissolves**: 17 → B4 only, 16 → Wave G only |
> | **Grid sort-key (B2)** | ✅ **deployed and verified 2026-09-13.** The remap was replaced by a real fix: unresolvable keys are a **400 naming the key**, and every key these views send now resolves. No frontend change needed. **Wave G dissolves** |
> | **`repeating-planner-task/suggestions`** | ⛔ **B5 withdrawn.** The route exists (`/suggestions/{calendarId}`); the client sends `?date=`. Frontend bug |
> | **Unit route paths** | ✅ fixed in `units/05`, `08`, `17`, `19` — they carried paths missing their `/activity-tracking`, `/day-planner`, `/pripomienky` and `/planovac` prefixes. All 53 now match the live router |

Unit **09** (`todo-lists`) is already done. Everything below assumes that.

**Legend:** ✅ renders real data · ⚠️ renders, but the fixture has no rows for it ([`B3`](backend/_done/B3-seed-fixture-coverage.md)) · ⛔ blocked.

> **⚠️ was stale as of 2026-09-11; re-measured 2026-09-13.** `B3` landed and seeds all four of its
> surfaces — day-planner templates, the three tracking ledgers with their pattern mappings, and the
> notification bell. Units **05**, **08** and **18** were re-driven in a browser and are **confirmed
> non-empty**, and so is **06** — `B3` is fully delivered and now lives in
> [`backend/_done/`](backend/_done/B3-seed-fixture-coverage.md). New response keys: `dayPlannerTemplates`,
> `trackingMappings`, `notifications`, plus nine new `counts` entries — all typed in `e2e/fixtures/seed.ts`.
>
> **The fixture is now `e2e-v3`, not `e2e-v2`** — it adds an `adminUser` (10003) and reminder rows on top
> of the above. ✅ **The suite runs against it** (bumped 2026-09-13 with the `B4` close-out; the new shape is
> typed in `e2e/fixtures/seed.ts` and `auth.ts` gained an `adminPage` fixture): **131 tests · 92 passed ·
> 36 skipped · 3 failed · 6.0m**. The three failures are pre-existing and were simply unreachable while global
> setup threw — two locator/behaviour issues in `home.draft.spec.ts`, and one stuck-loading-overlay defect in
> `templateDayPlanner.spec.ts`.

---

## The four rules this order follows

1. **Calibrate on something small first.** The prompt set changed substantially — `playwright-cli` replaced the Chrome extension, and §2 (visual sweep) and §4
   (canvas charts) are new and unproven. The first run is as much a test of the *prompt* as of the app. Spend a one-view unit finding out, not a five-view one.
2. **Never run a blocked unit.** A blocked unit still renders, so the agent documents an empty screen in good faith and files findings that are really one upstream
   bug. That output is worse than no output, because someone has to disprove it.
3. **Clean before data-less, small before large.** ⚠️ units are worth running — they just need the agent told that the emptiness is the fixture's, not the feature's.
4. **Group blocked units by what unblocks them**, so one fix releases a whole wave instead of one unit.

---

## Wave A — calibration (run this first)

| Unit           | Views | Why this one                                                                                                            |
|----------------|-------|-------------------------------------------------------------------------------------------------------------------------|
| ✅ **01** home | 1     | Clean: no 4xx/5xx, no raw keys, renders five populated widgets. One view, so a bad output contract costs one cheap run. |

**01 is still the right calibration unit, and it is still clean** — re-verified 2026-09-11: `/` renders the day-planner strip, routine tasks, upcoming tasks and
today's activity with real seeded data, and issues no failing request.

**01 is the right calibration unit for a reason beyond its size:** `HomeView` mounts `HistoryPieChart`, so it is the first unit to hit the template's **new
canvas-chart clause** (§4). If that guidance is going to be misread, this is where you want to find out — on one view, not on unit 05's four dashboards. Note that
05's charts are now **empty** (see Wave D), so 01 is also the *only* early chance to exercise §4 against a populated chart.

**After it finishes, before starting anything else:** read the three files it wrote and check two things the migration changed — did it read back exactly one
screenshot per view (§2), and did it document the pie chart from the populating response rather than reporting it empty (§4)? If either is wrong, fix
`PROMPT-TEMPLATE.md` now, not after the nineteenth unit.

### Paste this with `units/01-home.md`

`units/01-home.md` is already a complete prompt. Paste it into a fresh **Sonnet 5, high effort** session, and append the block below — it names the traps that are
specific to *this being the first run after the tooling migration*. Drop it for later units; by then the answers are in the docs.

```
This is the first unit to run after the browser tooling changed, so treat it as a calibration
run: if something in the prompt is unclear or wrong, say so in your final report — that
feedback is as valuable as the docs themselves.

Six traps to check for deliberately in this unit:

1. HomeView mounts HistoryPieChart. Charts here are echarts on <canvas>, so the accessibility
   snapshot shows an opaque node with NOTHING inside. Do not report the chart as empty on
   snapshot evidence. Read it from the response body of the request that populates it
   (`playwright-cli response-body <n>`), and say in the inventory which method you used.
2. Read back exactly ONE screenshot per view as a visual sweep (spacing, alignment, colour,
   overflow). The snapshot cannot see any of that. If the sweep finds nothing, say so
   explicitly rather than omitting it.
3. Home deliberately imports components from other modules (RoutineTodoListItem,
   NormalTodoListItem, HistoryPieChart, TrackTimeDialog). home.routes.ts documents this as an
   accepted exception — it is NOT a module-boundary violation. Do not file it.
4. Check for duplicate requests at boot. Home's widget fetches fire alongside the shell's, and
   `docs/views/_shell/inventory.md` already lists the shell's own. Only report what is Home's.
5. Anything you assert about "today" must come from `seed.seedDateUtc`, never from the local
   clock or `new Date()`. (On 2026-09-11 the two agreed; on 2026-09-10 they did not. Do not
   rely on them agreeing.)
6. `/` was driven on 2026-09-11 and came back clean: no 4xx/5xx and no unresolved i18n keys. If
   you see either, it is new since then and worth reporting as such.

For the draft spec: import { expect, test } from '../fixtures/auth', read ids off the `seed`
fixture rather than hardcoding them, and never call new Date().
```

---

## Wave B — clean and small

| Unit                        | Views | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|-----------------------------|-------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ✅ **13** leisure-projects  | 1     | The smallest unit in the set, so a good second run after 01. **Board mode only** — `?view=table` 500s (Wave G). See the notes below for the two things to let it discover.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ✅ **10** todo-routine      | 2     | Renders real routines (Daily/Weekly/Monthly/Yearly with streaks). Has an existing `todo-routine.draft.spec.ts` with 6 passing / 5 `fixme` — the fixmes name real bugs (B3–B6: raw `toDoList.timePeriod`, hardcoded English streak tooltip, delete confirmation showing a raw id). Expect to confirm them, not rediscover them.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ✅ **06** tracking-settings | 2     | **Unblocked 2026-09-13.** Both *distinct entries* tables carry rows (desktop `1-6 of 6`, Android 5 — matching `counts.distinctDesktopEntries` / `distinctAndroidEntries`), and both *Mappings* tabs render, so the mapping *workflow* is documentable at last. **Brief the agent on one trap:** each Mappings tab opens with its **Type** filter on `Activity`, so it shows **one** row (`rider64.exe → Desk Research`; `com.spotify.music → Read a Novel`) though two mappings per platform are seeded. The other is under `Ignored` — `21102: com.android.settings`, `21002: SteamLauncher.exe`. That is a filter default, **not** an empty grid, and it has already been misread once. Ignored mappings having no *distinct-entry* rows is also correct, not a gap. |
| ⚠️ **18** notifications     | 2     | Split: `/nastavenia/pripomienky` renders 10 rows and is fully documentable; `/notifikacie` is empty ("No notifications yet"). Notably *not* affected by the reminders locale gap — the framework's `common.en.ts` does carry `notifications.*` and `reminderPreference.*`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Run 13 and 10 before 06 and 18.** Both of the latter need the agent warned about the empty fixture, and it is better to have calibrated the prompt on populated
screens first.

### What unit 13 should be left to discover

Two things it should find on its own rather than be told, because they are exactly what an inventory pass is for:

- the project card shows **"—" where the activity name belongs**. Confirmed still true on 2026-09-11: the grid row carries `activityId: 12009` and no name field at
  all, so `ActivityInfo.fromJson({})` yields an empty name. This is a **contract question**, now written up as [
  `B6`](backend/_done/B6-profile-grid-activity-name.md) — let the unit describe the symptom; B6 holds the decision.
- board mode requests **200 rows in one page and never pages**. Fine for a hobby list, and the cap is the server's, but it is a real ceiling and the view does not
  say so when it is hit.

---

## Wave C — clean and medium

| Unit                        | Views           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|-----------------------------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ✅ **02** activity-settings | 1 route, 3 tabs | **Newly unblocked** — was Wave E. All three tabs render real rows (10 activities / 16 roles / 19 categories). One quirk to expect and not file as a failure: `POST /api/activity/grid` fires **twice** on mount, the first `ERR_ABORTED`, the second 200. It is visible in the network panel only — since 2026-09-11 the interceptor no longer logs a deliberate cancellation, so the console stays clean. The redundant request is the single-controller behaviour of `useFetchFilteredTable`, the same wire that broke the template list; `useFetchFiltered` has been fixed and the siblings have not. |
| ✅ **03** history-review    | 3               | Renders. Charts throughout — the second real exercise of the §4 canvas clause, and with 05 now empty, one of only two. `/activity-history/detail` legitimately shows "No data for this period" for the seed date; the week view is populated.                                                                                                                                                                                                                                                                                                                                                            |
| ✅ **14** user-settings     | 4               | Renders. Includes `/legal/*`, which are trivial, so it is smaller than 4 views suggests. `/google-calendar/callback` with no `code` param redirects to `/user/settings` — that is correct behaviour, not a defect.                                                                                                                                                                                                                                                                                                                                                                                       |

---

## Wave D — clean and large

Leave these until the prompt has settled on Waves A–C.

| Unit                          | Views | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|-------------------------------|-------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ✅ **04** history-capture     | 4     | Four capture modes (stopwatch/timer/pomodoro/manual) that mostly share a shell. **One raw key**: `dateTime.secondsShort` on `/activity-history/stopwatch`. App-side, new since 2026-09-10, and not the reminders cause.                                                                                                                                                                                                                                                                                                              |
| ✅ **19** scheduler           | 4     | Renders 10 real jobs, a 25-row run history, and a populated "needs attention" view. Clean apart from one raw key, `reminders.scan`, on `/planovac/ulohy` — same root cause as Wave F. One finding, not a blocker. Worth noting for contrast with unit 17: the scheduler's admin routes are **not** 403.                                                                                                                                                                                                                              |
| ✅ **07** planner-day         | 4     | Renders correctly, and is the biggest crawl here. README flags it as a candidate for splitting across two sessions by view group, same pass, same files. **Two things to brief the agent on** — see below.                                                                                                                                                                                                                                                                                                                           |
| ✅ **15** auth                | 5     | All five views render in English with no raw keys. **Runs signed out**, so the `state-load` shortcut does not apply — sign in/out through the form. This is also the unit that owns the "does the login redirect preserve the intended destination" question.                                                                                                                                                                                                                                                                        |
| ✅ **05** tracking-dashboards | 4     | Read-only — no mutation pass needed. **Unblocked 2026-09-13**: ~~all four dashboards are empty~~ no longer holds. Seven days of all three ledgers are seeded, `/activity-tracking` renders real sessions on its timeline, and `web-extension/pie-chart` returns **5 domains, 150 entries, 4 965 total seconds** — so the canvas clause has a populating response to read against. Note the request shape if you probe it by hand: it needs `from`/`to` as `{hours,minutes}` objects plus `minPercent`, not just `dateFrom`/`dateTo`. |

### Brief unit 07 on these two

1. **The `:date` route param is `dd-MM-yyyy`, not ISO.** `/day-planner/11-09-2026` is correct and renders
   "1/3 tasks · 33%" against calendar 984. An ISO URL (`/day-planner/2026-09-11`) 400s the calendar fetch and the view silently falls back to a **neighbouring
   day's** calendar — plausible-looking, wrong data. That is a genuine robustness finding for this unit, but **verify the format before filing it**; it is very easy
   to mistake your own bad URL for an app defect. (It was, once, during this re-measurement.)
2. **`GET /api/repeating-planner-task/suggestions?date=…` fires twice per day view and both 400.** The route **does** exist — as
   `GET /repeating-planner-task/suggestions/{calendarId:long}`, which returns 200. The client sends a date query param instead of the calendar id it has already
   resolved, so the request falls through to `/{id}`. **Frontend bug, not a backend ask** — see
   `B5`, withdrawn and deleted. The duplicate call is app-side too. Neither blocks the unit; the day view is otherwise correct. There is also an `opportunity` here:
   `GET /task-planner-day-template/suggestions/{calendarId}` exists, returns 200, and the client never calls it at all.

---

## Wave E — dissolved

Unit **02** is unblocked and has moved to Wave C; unit **13** moved to Wave B in the previous round. **Nothing is waiting on the `/grid` rename — it is complete.**
`/api/activity/grid` and `/api/memory-anchor/grid` both answer 200, and `POST /{entity}/filtered-table` now returns 405 on all five entities. This heading is kept
only so a reader following an older link does not conclude the wave was lost.

---

## Wave F — ✅ the reminders EN locale gate is gone

> **Resolved 2026-09-11 and verified in the browser.** `reminders.en.ts` and `remindersDashboard.en.ts` now
> exist alongside the `.sk` files and `EN.ts` spreads both. All five reminders views render English with
> **zero** raw keys, and `reminders.scan` is gone from `/planovac/ulohy` (unit 19) as well. Fixed the right
> way — a framework commit, not an app-side `common.en.ts` mirror. Remember the pointer bump if it has not
> landed.

That left each of these two units with exactly one remaining gate, and they were different gates. **Both have since closed**, so neither is held:

| Unit                      | Views | Now blocked by                                                                                                                                                                |
|---------------------------|-------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ✅ **17** reminders-admin | 5     | **nothing.** Its last gate, [`B4`](backend/_done/B4-reminders-admin-403.md), closed 2026-09-13 — run it signed in as the seed's `adminUser` (10003) and all five views render |
| ✅ **16** reminders-user  | 1     | **nothing.** Its last gate, [`B2`](backend/_done/B2-grid-500-on-unmapped-sortby.md), closed 2026-09-13 — `/pripomienky/moje` returns 200 with rows                            |

**17's gate is the one that did not exist a day ago.** All four of its data routes answer **403** with an empty body for the seeded account, while the user-scoped
`my-upcoming` and *every* scheduler admin route answer 200 on the same cookie. The app has no role model (`authAdapter` returns constant `true`), so the client
cannot gate this itself. B4 asks the backend whether these routes should require an admin role here at all.

Units 16 and 17 are **framework** units regardless: their findings are submodule issues and never share a fix batch with app-side findings.

---

## Wave G — after the backend asks — ✅ **dissolved 2026-09-13**

> ✅ **B2 is answered and deployed, and it releases this whole wave.** The remap described in the previous
> version of this note was replaced: unresolvable keys are now a **400 naming the key**, *and* every key these
> units' views already send resolves (`activity.name` natively, `periodKey` as a server-expanded composite,
> `nextOccurrence` as an alias). **No frontend change is needed.** Verified by probing all six endpoints —
> see [`B2`](backend/_done/B2-grid-500-on-unmapped-sortby.md)'s close-out block for the measurements.
>
> **Run 11, 12 and 16 like any unblocked unit.** The one thing to brief an agent on: the table component still
> renders its **empty state for a failed request**, so an empty leisure or reminders table is not evidence of
> emptiness — check the network log.

| Unit                             | Views | Blocked on                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|----------------------------------|-------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ✅ **11** leisure-backlog-picker | 2     | **nothing.** ~~`/leisure/backlog` sorts by `activity.name` and 500s into a false empty state~~ — 200 with rows since 2026-09-13. Its sibling `/leisure/pick` is **clean**, and the old `enums.energyLevel.Low` raw key no longer reproduces                                                                                                                                                                                                                                                                                                       |
| ✅ **12** leisure-bucket-anchors | 2     | **nothing.** Both views return 200 as sent. [`B7` §1](backend/_done/B7-grid-sort-key-audit.md) is closed — `activity.name` resolves natively on all four profile grids *and* on `memory-anchor/grid` — and so are [`B6`](backend/_done/B6-profile-grid-activity-name.md) and [`B2`](backend/_done/B2-grid-500-on-unmapped-sortby.md)                                                                                                                                                                                                              |
| ✅ **16** reminders-user         | 1     | **nothing.** `/pripomienky/moje` returns 200; its `nextOccurrence` key is an accepted alias. One app-side tidy-up: migrate it to `nextOccurrenceAt` so the backend can drop the alias                                                                                                                                                                                                                                                                                                                                                             |
| ✅ **08** planner-templates      | 3     | **Unblocked 2026-09-11** — `B3` landed and the fixture now seeds three templates (`seed.dayPlannerTemplates`: `homeOffice` 5 tasks, `officeDay` 4, `pinned` 3, the last one pinned so the list's pinned section renders). All three views carry real data. Two things to know before running it: the list view's "no cards behind a permanent loading overlay" bug is **fixed**, and `templateDayPlanner.spec.ts` now runs 16 tests with none skipped, so its assertions are a description of these screens you can read instead of rediscovering |

**One backend fix (B2) released three of these four**, plus unit 13's table view. That was the single highest- value item in the set and is why it was filed once
rather than three times.

One caveat still to carry forward, in its new form: a sort key the server cannot resolve is now a **400**
rather than a 500 — better, but still a hard failure. A **new** sortable column must emit the name of a member of the **projected response DTO**, not a field of the
entity, and not every field visible in a row qualifies. Probe the endpoint once before shipping the header; the 400 names the offending key.

**The one live case that caveat had is closed.** [`B7`](backend/_done/B7-grid-sort-key-audit.md) — which reads every column definition in the app against every grid
response — found `memory-anchor/grid` emitting
`activity.name` from a second sortable column that the old remap missed. Replacing the remap closed it:
that endpoint answers 200 on both its keys. B7 also settles B6 from the client's side — the four profile DTOs parse a **nested** `activity` object, which is
precisely what makes `activity.name` resolve, and the flat
`activityName` the API also returns is never read.

---

## After the units

- **X4 (narrow viewport)** — unblocked (`playwright-cli resize 390 844` verified moving `innerWidth`
  1440 → 390). Run it once across every unit's primary view **after Phase 1**, not per unit. It also releases at least two `dayPlanner.spec.ts` fixmes waiting on a
  mobile viewport.
- **X2 (account isolation)** — already done and regression-covered by `e2e/tests/account-isolation.spec.ts`. Extend that spec rather than running a manual pass.
- **Mutation passes** — same units, `Pass: mutation`, and now unblocked by the seed. Read-only units (`05` tracking-dashboards, `03` history-review, `17`
  reminders-admin, `19` scheduler) do not need one.
- **Triage** every 4–5 units, per README. Do not save it for the end; it is what stops the same root cause being filed nineteen times.

---

## Summary

| Wave | Units                 | Gate                                                                                                                  |
|------|-----------------------|-----------------------------------------------------------------------------------------------------------------------|
| A    | 01                    | none — start here                                                                                                     |
| B    | 13, 10, 06 ⚠️, 18 ⚠️  | none                                                                                                                  |
| C    | 02, 03, 14            | none                                                                                                                  |
| D    | 04, 19, 07, 15, 05 ⚠️ | none                                                                                                                  |
| E    | —                     | dissolved; the `/grid` rename is complete                                                                             |
| F    | —                     | dissolved; the reminders EN locale gate is **resolved**. 17 → B4, 16 → Wave G                                         |
| G    | **17** only           | B4. **B2 landed 2026-09-13 and released 11, 12 and 16** — they are runnable now. 08 left this wave earlier, see below |

> **Re-count needed after B3 (2026-09-11).** The figures in this section predate it. `B3` has landed:
> the fixture is `e2e-v2` and seeds all four of its surfaces, so **08 is unblocked outright** and
> **05, 06 and 18 are no longer empty** — which also retires the "brief the agent that emptiness is a
> fixture gap" caveat for those three. Nothing below has been re-measured against the new fixture, so
> treat the counts as a floor, not a fact, and re-drive a unit before trusting its row.

**Thirteen of the eighteen remaining units are runnable right now** — up from eleven, because unit 02 is unblocked and units 05, 06 and 18 are
runnable-with-empty-data rather than clean. Four of those thirteen (05, 06, 18, and partly 13) need the agent briefed that a fixture gap, not a defect, is what it is
looking at.

**That became sixteen on 2026-09-13**, when the grid sort-key fix deployed and was verified — it needed no frontend change. **And then eighteen, later the same
day**, when B4 was answered: 08's fixture ask had already landed, and 17's 403 turned out to be correct behaviour against a fixture with no admin account. **No unit
is blocked.**

Of what was five, none is left: [`B2`](backend/_done/B2-grid-500-on-unmapped-sortby.md) is **closed**, the fixture ask ([
`B3`](backend/_done/B3-seed-fixture-coverage.md)) is landed-pending-recount, and the authorization question ([`B4`](backend/_done/B4-reminders-admin-403.md)) is
**answered** — the gate stays, the fixture grew an `adminUser`. The reminders EN locale decision is **done**.
[`B6`](backend/_done/B6-profile-grid-activity-name.md) is **answered and shipped** (2026-09-13, option A — a nested full `ActivityResponse` on all four profile
grids); it blocked nothing, but it leaves a client-side parse follow-up recorded in the ask;
`B5` was **withdrawn and deleted** — it turned out to be a frontend bug, not a backend ask.
