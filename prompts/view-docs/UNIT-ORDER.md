# Unit running order — recommended sequence

> Written 2026-09-10, after driving **every unit's primary routes** signed in and checking each for non-2xx
> responses and unresolved i18n keys. The blocker facts here are observed, not inferred from source.
> The authoritative blocker table lives in [`README.md`](README.md) § *Before you start a unit*; this file is
> only the **order**, and why it is that order.

Unit **09** (`todo-lists`) is already done. Everything below assumes that.

---

## The four rules this order follows

1. **Calibrate on something small first.** The prompt set just changed substantially — `playwright-cli`
   replaced the Chrome extension, and §2 (visual sweep) and §4 (canvas charts) are new and unproven. The first
   run is as much a test of the *prompt* as of the app. Spend a one-view unit finding out, not a five-view one.
2. **Never run a blocked unit.** A blocked unit still renders, so the agent documents an empty screen in good
   faith and files findings that are really one upstream bug. That output is worse than no output, because
   someone has to disprove it.
3. **Clean before blocked, small before large.** The README's own advice, minus the units that turned out to
   be broken.
4. **Group blocked units by what unblocks them**, so one fix releases a whole wave instead of one unit.

---

## Wave A — calibration (run this first)

| Unit | Views | Why this one |
| --- | --- | --- |
| **01** home | 1 | Clean: no 4xx/5xx, no raw keys. One view, so a bad output contract costs one cheap run. |

**01 is the right calibration unit for a reason beyond its size:** `HomeView` mounts `HistoryPieChart`, so it
is the first unit to hit the template's **new canvas-chart clause** (§4). If that guidance is going to be
misread, this is where you want to find out — on one view, not on unit 05's four dashboards.

**After it finishes, before starting anything else:** read the three files it wrote and check two things the
migration changed — did it read back exactly one screenshot per view (§2), and did it document the pie chart
from the populating response rather than reporting it empty (§4)? If either is wrong, fix
`PROMPT-TEMPLATE.md` now, not after the nineteenth unit.

### Paste this with `units/01-home.md`

`units/01-home.md` is already a complete prompt. Paste it into a fresh **Sonnet 5, high effort** session, and
append the block below — it names the traps that are specific to *this being the first run after the tooling
migration*. Drop it for later units; by then the answers are in the docs.

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
5. `seed.seedDateUtc` may be a day behind your local date — it was 2026-09-10 while the local
   clock read 2026-09-11. Anything you assert about "today" must come from seedDateUtc, never
   from the local clock or `new Date()`. If a widget's dates look off by one, check this before
   filing it.
6. `/` was driven on 2026-09-10 and came back clean: no 4xx/5xx and no unresolved i18n keys. If
   you see either, it is new since then and worth reporting as such.

For the draft spec: import { expect, test } from '../fixtures/auth', read ids off the `seed`
fixture rather than hardcoding them, and never call new Date().
```

---

## Wave B — clean and small

All verified clean. Any order; listed smallest-risk first.

| Unit | Views | Notes |
| --- | --- | --- |
| **10** todo-routine | 2 | Has an existing `todo-routine.draft.spec.ts` with 6 passing / 5 `fixme` — the fixmes name real bugs (B3–B6: raw `toDoList.timePeriod`, hardcoded English streak tooltip, delete confirmation showing a raw id). Expect to confirm them, not rediscover them. |
| **06** tracking-settings | 2 | Clean. |
| **18** notifications | 2 | Clean — and notably *not* affected by the reminders locale gap, because the framework's `common.en.ts` does carry `notifications.*` and `reminderPreference.*`. |

---

## Wave C — clean and medium

| Unit | Views | Notes |
| --- | --- | --- |
| **03** history-review | 3 | Clean. Charts throughout — the second real exercise of the §4 canvas clause. |
| **14** user-settings | 4 | Clean. Includes `/legal/*`, which are trivial, so it is smaller than 4 views suggests. |

---

## Wave D — clean and large

Leave these until the prompt has settled on Waves A–C.

| Unit | Views | Notes |
| --- | --- | --- |
| **05** tracking-dashboards | 4 | Clean. Read-only — no mutation pass needed. |
| **04** history-capture | 4 | Clean. Four capture modes (stopwatch/timer/pomodoro/manual) that mostly share a shell. |
| **19** scheduler | 4 | Clean apart from one raw key, `reminders.scan`, on `/planovac/ulohy` — same root cause as Wave F. One finding, not a blocker. |
| **07** planner-day | 4 | Clean, but the biggest crawl here. README flags it as a candidate for splitting across two sessions by view group, same pass, same files. |
| **15** auth | 5 | Clean. **Runs signed out**, so the `state-load` shortcut does not apply — sign in/out through the form. This is also the unit that owns the "does the login redirect preserve the intended destination" question. |

---

## Wave E — after the three frontend grid fixes

One-line changes; see README's blocker table for the exact cause of each.

| Unit | Views | Released by |
| --- | --- | --- |
| **13** leisure-projects | 1 | `BOARD_PAGE_SIZE` 500 → 200 in `ProjectsView.vue` |
| **02** activity-settings | 1 route, 3 tabs | `activity` grid path → `/api/activity/filtered-table` |

**13 is the smallest unit in the whole set and is one line away from runnable** — worth doing the fix just to
get it out of the way. Note that the README's original "pick 13 next" advice was written before anyone drove
it; it renders `0-0 of 0` today.

---

## Wave F — after the reminders EN locale files exist

| Unit | Views | Released by |
| --- | --- | --- |
| **16** reminders-user | 1 | EN locale files **and** the `my-upcoming` 500 (Wave G) — this one needs both |
| **17** reminders-admin | 5 | EN locale files alone |

`src/_common/modules/reminders/_locales/` ships `reminders.sk.ts` and `remindersDashboard.sk.ts` with **no
`.en` counterparts**, so `EN.ts` spreads neither and both views render raw keys throughout. This is a
regression from the default-locale flip, not a pre-existing gap.

**Where the fix lives is a decision, not a mechanical step.** Per CLAUDE.md's framework decision tree these are
the framework module's own strings with no app domain in them, so the correct home is a submodule commit
adding the two `.en` files, then a pointer bump — *not* the app-side `common.en.ts` mirror, which is the remedy
for namespace **collisions** (R5/R6/R11) and this is not one. Decide before writing anything.

Units 16 and 17 are **framework** units regardless: their findings are submodule issues and never share a fix
batch with app-side findings.

---

## Wave G — after the backend asks

| Unit | Views | Blocked on |
| --- | --- | --- |
| **12** leisure-bucket-anchors | 2 | `activity-bucket-list-profile/grid` → 500 (`a2c8d4d3b9cb`); its other view also needs the Wave-E `memory-anchor` path fix |
| **11** leisure-backlog-picker | 2 | `activity-backlog-profile/grid` → 500 (`73e7261d482b`). Also shows one raw key, `enums.energyLevel.Low` — app-side, unrelated to Wave F |
| **08** planner-templates | 3 | The seed creates **no day-planner templates**. Needs a fixture extension in the API repo — do not create one per test |

Three backend asks total: two opaque 500s and one fixture extension. Worth filing together.

---

## After the units

- **X4 (narrow viewport)** — now unblocked (`playwright-cli resize 390 844` verified moving `innerWidth`
  1440 → 390). Run it once across every unit's primary view **after Phase 1**, not per unit. It also releases
  at least two `dayPlanner.spec.ts` fixmes waiting on a mobile viewport.
- **X2 (account isolation)** — already done and regression-covered by `e2e/tests/account-isolation.spec.ts`.
  Extend that spec rather than running a manual pass.
- **Mutation passes** — same units, `Pass: mutation`, and now unblocked by the seed. Read-only units
  (`05` tracking-dashboards, `03` history-review, `17` reminders-admin, `19` scheduler) do not need one.
- **Triage** every 4–5 units, per README. Do not save it for the end; it is what stops the same root cause
  being filed nineteen times.

---

## Summary

| Wave | Units | Gate |
| --- | --- | --- |
| A | 01 | none — start here |
| B | 10, 06, 18 | none |
| C | 03, 14 | none |
| D | 05, 04, 19, 07, 15 | none |
| E | 13, 02 | 2 frontend one-liners |
| F | 17 (16 also needs G) | reminders EN locale — framework decision first |
| G | 12, 11, 08 | 2 backend 500s + 1 fixture extension |

**Ten of the eighteen remaining units are runnable right now**, with no fix of any kind.
