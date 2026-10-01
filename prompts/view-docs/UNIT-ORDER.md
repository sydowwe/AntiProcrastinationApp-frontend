# Running order — what's left, and how to run it

> **Rewritten 2026-10-01.** This file used to hold the *unit* running order: waves A–G, gated on backend
> blockers. That's finished. Units 01–15 all have inventory and mutation passes, fixes and retests (see
> `units/_done/`, `retest/_done/`), and nothing is blocked. The wave history lives in git
> (`git log -p -- prompts/view-docs/UNIT-ORDER.md`) if you need to know why a unit ran when it did.
>
> **This is the operator's guide for everything after the units:** the four framework units, the X4
> narrow-viewport pass, Phase 4 synthesis and Phase 5 spec promotion. Each step names its prompt file, the
> model and effort, whether it can run alongside other sessions, and what to check when it finishes.

## How the prompt files work

Each phase has a folder with a `TEMPLATE*.md` (the procedure, the part to edit if a phase needs correcting) and one
short file per group or unit (parameters and traps). **Paste the fenced block of the short file into a fresh
session.** The block tells the agent to read the template itself. When a run is done and you've read its output,
move its file to that folder's `_done/`, so the folder listing is the progress tracker.

| folder | what | one file per |
| --- | --- | --- |
| `units/_submodule/` | inventory + mutation passes for units 16–19 (the framework units), as before | unit |
| `x4/` | narrow viewport (390 × 844), read-only | group (+ `00-shell`, + `submodule`) |
| `phase4/` | data map and opportunities, no browser | group (+ `reconcile`, `submodule`, `backend-notification-audit`) |
| `phase5/` | promote draft specs to permanent | unit (+ `16-19-submodule`, `99-full-suite`) |

**App and framework are separate tracks.** The framework units (16 reminders-user, 17 reminders-admin, 18
notifications, 19 scheduler) don't read app data, so they get their own X4, Phase 4 and Phase 5 sessions. The
one link between the two tracks is the **backend notification audit**, which checks the app's time-bearing data
against what the backend actually notifies about. The frontend can't answer that, which is why it's a separate
step at the end.

**The groups** are the same for X4 and Phase 4 extraction, cut along shared components and data:

| group | units | why together |
| --- | --- | --- |
| `todo` | 09 todo-lists, 10 todo-routine, 01 home | home mounts the todo item rows |
| `planner` | 07 planner-day, 08 planner-templates, 02 activity-settings | templates mount the same DayPlanner; activity is the planner's main entity |
| `history` | 04 history-capture, 03 history-review | one entity, captured and then reviewed |
| `tracking` | 05 tracking-dashboards, 06 tracking-settings | one module (77 DTOs, which is why it isn't merged with history) |
| `leisure` | 11, 12, 13 | one module, one shared profile shape |
| `account` | 14 user-settings, 15 auth, `_shell` | the account layer and the frame around every view |

Phase 5 is **per unit**, not per group, because each draft spec is its own file and none of them cross modules.

---

## The plan at a glance

Two tracks run side by side. **Track A never opens a browser or writes to the database**, so it can run whenever
you like, including in parallel with anything on track B. **Track B** is serial: one browser or spec session at a
time.

```
TRACK A (no browser, parallel-safe)          TRACK B (browser / specs, one at a time)
───────────────────────────────────          ──────────────────────────────────────────
                                             B1  finish units 16–19 (units/_submodule/)
A1  phase4 a–f extracts (6, any order)       B2  x4/00-shell → x4/a…f (app)
A2  phase4/reconcile        (after A1)       B3  triage → fix → retest the X4 findings (app)
A3  phase4/submodule        (after B1)       B4  phase5 01–15 (app)
A4  phase4/backend-notification-audit        B5  framework: x4/submodule → triage/fix/retest
        (after A2 + A3)                          → phase5/16-19-submodule
                                             B6  phase5/99-full-suite   (last of all)
```

Start **A1 now**. It doesn't depend on anything you're still doing.

---

## Track A: Phase 4 synthesis (no browser)

| step | file | model · effort | parallel? | needs |
| --- | --- | --- | --- | --- |
| A1 | `phase4/a-todo.md` … `f-account.md` | **Sonnet 5 · high** | yes: all six at once, and alongside anything | nothing |
| A2 | `phase4/reconcile.md` | **Opus 5 · high** | yes | all six `docs/data-map/<group>.md` |
| A3 | `phase4/submodule.md` | **Sonnet 5 · high** | yes | units 16–19's docs (B1) |
| A4 | `phase4/backend-notification-audit.md` | **Opus 5 · high** | yes | A2 **and** A3 |

**Why this split:** the app's unit docs total about 390 KB (~100k tokens). One session could hold them, but the
job is noticing small things ("captured here, read nowhere") across all of it, and that degrades well before the
context fills. Each extract reads one group (~25k tokens) and writes a fixed-shape table. The reconcile reads
only the six tables. The framework is small and self-contained, so it does both steps in one session.

**After each A1 extract, check:**
- the report's `?` count. A handful is fine. Dozens means it gave up on the code search, so re-run it;
- one `unread` row, picked at random: grep the field in `src/` yourself. A wrong `unread` becomes a bogus
  feature proposal later, so this is the error that matters;
- that *Contradictions* isn't empty for `todo`: todo-lists' usecase doc is known to have corrected itself once.

**After A2:** read `docs/opportunities.md`'s *Top picks* and the *Corrections* section of `docs/data-map.md`. If
the corrections are large, one extract was sloppy. Re-run that group and then A2, rather than patching by hand.

**After A4:** the audit writes **no** backend asks (you write those when you pick a candidate up). Read its
*Coverage gaps* first. A kind the backend emits but the app has no metadata for is a concrete bug, not a feature
idea, and belongs in `_fix-queue.md`.

---

## Track B: browser and spec work (one at a time)

### B1: finish units 16–19

As before: `units/_submodule/`, **Sonnet 5 · high**, an inventory session and then a mutation session per unit (17
and 19 are read-only), sign in as `adminUser` for 17. Then triage, fixes (**`[framework]` batches only**: a
commit in `src/_common` first, then the pointer bump), and retests.

### B2: X4 narrow viewport, app

| order | file | model · effort | note |
| --- | --- | --- | --- |
| 1 | `x4/00-shell.md` | **Sonnet 5 · high** | **first**: later groups skip shell defects on its word |
| 2–7 | `x4/a-todo.md`, `b-planner.md`, `c-history.md`, `d-tracking.md`, `e-leisure.md`, `f-account.md` | **Sonnet 5 · high** | any order; `b-planner` is the biggest and may need two sessions (its file says how) |

**Run them one after another, not in parallel,** even though they're read-only. Two reasons. Each session
signs in, and parallel sessions each need their own state file under a 5-per-minute login limit. And a
`[framework]` defect (the table, the dialog) is filed once and later groups *append* to it. That dedupe only works
if the earlier group's file is already on disk.

**After each group, check:**
- the report's `Viewport verified` line says `innerWidth 390`. Anything else and the whole run described the
  desktop, so discard it;
- the new findings' ids continue each file's numbering, and the Tally line adds up;
- for `b-planner`: the Day Details toggle's locator is in `planner-day/inventory.md`'s *Narrow viewport* block.
  Phase 5 unit 07 depends on it.

### B3: close the X4 findings

X4 findings land in each unit's own `findings.md`, so the existing loop applies unchanged:
1. **Triage**: `TRIAGE-PROMPT.md`, **Opus 5 · high**, no browser. Tell it this round is the X4 findings (`(390 px)`
   in the title).
2. **Fixes**: one session per batch, as before.
3. **Retest**: `RETEST-PROMPT.md`, **Sonnet 5 · medium**. The `retest/` files are per unit and hand-made, so ask a
   session to write new ones for the units with fixed X4 findings, following `retest/_done/08-planner-day.md`'s
   shape. Each X4 `Verify:` starts with the resize, so it runs as-is.

**Do B3 before B4.** Phase 5 asserts the *correct* behaviour of fixed findings. Promote specs before the X4 fixes
land and they'll assert either the bug or a `fixme` you then revisit.

### B4: Phase 5, app units

| order | file | model · effort | note |
| --- | --- | --- | --- |
| any | `phase5/01` … `06`, `09`, `10`, `14` | **Sonnet 5 · high** | independent |
| after X4 `b-planner` | `phase5/07-planner-day.md` | Sonnet 5 · high | enables the mobile fixmes |
| any | `phase5/08-planner-templates.md` | Sonnet 5 · high | merges `templateDayPlanner.spec.ts` |
| 11 → 12 → 13 | `phase5/11`, `12`, `13` | Sonnet 5 · high | **13 last**: it dissolves `leisure-profiles.spec.ts` into 11's and 12's specs |
| any | `phase5/15-auth.md` | Sonnet 5 · high | slow on purpose: waits 60 s between runs (login rate limit) |

**Strictly one at a time.** Every run reseeds the one database, so a second session running specs pulls the data
out from under the first.

**Merges this phase does** (decided here, so each session doesn't have to):

| unit | draft + existing spec | becomes |
| --- | --- | --- |
| 02 | draft + `activity-lifecycle.spec.ts` (its table fixme only) | `activity-settings.spec.ts`; `activity-lifecycle.spec.ts` keeps its picker test |
| 07 | draft + `dayPlanner.spec.ts` | `planner-day.spec.ts`; `planner-skip-insights.spec.ts` stays separate |
| 08 | draft + `templateDayPlanner.spec.ts` | `planner-templates.spec.ts` |
| 12 | draft + `leisure-anchor-sort.spec.ts` | `leisure-bucket-anchors.spec.ts` |
| 13 | draft + `leisure-profiles.spec.ts` (split across 11/12/13) | `leisure-projects.spec.ts` |
| 15 | draft + `auth.spec.ts` | `auth.spec.ts`; **`two-factor.spec.ts` stays separate** (rate limit) |
| 09 | no draft | `todo-lists.spec.ts` + `todo-motivation.spec.ts` get the fixme walk only |

If you'd rather keep one of those files separate, edit the unit's file before you paste it.

**After each unit, check:**
- the report's `After:` line has **0 failed**, and says both runs were green;
- skim the diff for weakened assertions: an `expect` that got looser, a count replaced by `> 0`, a removed
  check. That's the one failure the report can't show you;
- any `New findings filed` go into the next triage.

### B5: framework track

After B1 is done: `x4/submodule.md` (Sonnet 5 · high), then triage, fixes and retests for its findings, then
`phase5/16-19-submodule.md` (Sonnet 5 · high). Same checks as B2 and B4.

### B6: the whole suite

`phase5/99-full-suite.md`, **Opus 5 · high**, **last of everything**: after every other `phase5/` file is in
`_done/`. It runs the suite three times, fixes the specs that break each other, and *recommends* (without
installing anything) what should run on commit. Nothing does today: there's no CI workflow and no git hook.

---

## What can run at the same time

| | Track A session | X4 session | Phase 5 session | unit mutation pass | fix session |
| --- | --- | --- | --- | --- | --- |
| **Track A session** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **X4 session** | ✅ | ❌ run serially (above) | ⚠️ its sign-in may be killed by a reseed | ⚠️ same | ✅ |
| **Phase 5 session** | ✅ | ⚠️ | ❌ | ❌ both reseed | ⚠️ only if the fix doesn't touch that unit |

A Phase 5 run and a unit mutation pass both **reseed the database**, which wipes every account's sessions.
Anything else that is signed in at that moment gets signed out.

## Models, summarised

| work | model | effort |
| --- | --- | --- |
| Phase 4 extracts, `phase4/submodule` | Sonnet 5 | high |
| Phase 4 reconcile, backend notification audit | **Opus 5** | high |
| X4 (all groups) | Sonnet 5 | high |
| Phase 5 per unit, `16-19-submodule` | Sonnet 5 | high |
| Phase 5 full suite | **Opus 5** | high |
| Triage | Opus 5 | high |
| Retest | Sonnet 5 | medium |

Opus goes where the job is judgement across many inputs (merging maps, ranking what should notify, untangling
order-dependent failures). Sonnet goes where the job is careful, bounded work on one group or unit.

## Done means

- `x4/`, `phase4/`, `phase5/` and `units/_submodule/` hold nothing but their `TEMPLATE*.md` and `_done/`;
- `docs/data-map.md`, `docs/opportunities.md`, `docs/data-map/framework.md` and `docs/notification-audit.md`
  exist;
- `e2e/tests/` has no `*.draft.spec.ts`, and three consecutive full-suite runs are green;
- every remaining `test.fixme` names an `open` finding.
