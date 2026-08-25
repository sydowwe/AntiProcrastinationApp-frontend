# Day planner prompts

Improvements to `../../../src/core/dayPlanner`, one self-contained prompt per file. Each is written to be pasted into a fresh session in this repo —
`../../../CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts (file paths, line numbers, the existing composables) rather than restating
conventions.

Correctness first, then hygiene, then a short feature tail. Every defect below was confirmed by reading the code, not inferred.

## Index

| #  | Prompt                                                   | Kind       | Backend | Model      | Effort   |
|----|----------------------------------------------------------|------------|---------|------------|----------|
| P1 | [Split view never loads tasks ⭐](P1-split-view-dead.md) | bug        | —       | **Opus 5** | high     |
| P2 | [Store type contract ⭐](P2-store-type-contract.md)      | bug / debt | —       | **Opus 5** | high     |
| P3 | [Correctness sweep](P3-correctness-sweep.md)             | bug        | —       | Sonnet 5   | medium   |
| P4 | [Localization](P4-localization.md)                       | debt       | —       | Sonnet 5   | med–high |
| P5 | [Calendar request storm](P5-calendar-request-storm.md)   | perf / bug | yes     | Sonnet 5   | medium   |
| P6 | [Planner shell dedup](P6-planner-shell-dedup.md)         | debt       | —       | **Opus 5** | high     |
| P7 | [Calendar URL state](P7-calendar-url-state.md)           | debt       | —       | Sonnet 5   | low–med  |
| P8 | [Accessibility](P8-accessibility.md)                     | debt       | —       | **Opus 5** | high     |
| F1 | [Now / next indicator](F1-now-and-next.md)               | feature    | —       | **Opus 5** | high     |
| F2 | [Plan vs. actual](F2-plan-vs-actual.md)                  | feature    | likely  | Sonnet 5   | medium   |

## The confirmed defects

Each of these was verified against the source, with the file and line noted in the relevant prompt.

- **`/day-planner/templates/split` is inert.** `TemplateSplitView` passes `:templateId` down;
  `TemplateDayPlannerView` never declares that prop and reads `route.params.templateId` instead, which does not exist on the split route. `loadTasks()` returns early
  in both panels. (P1)
- **A watcher that can never fire.** `watch(() => templateId, …)` on a computed ref watches the ref object, whose identity is constant. Switching templates leaves
  the old tasks on screen. (P1)
- **Duplicated global key handling.** `usePlannerKeyboard` binds `document` `keydown` per planner instance; the split view mounts two. Currently masked by the split
  view being inert. (P1)
- **`Calendar.isToday` compares a local date against a UTC one** — wrong for the first one or two hours of every Slovak day. (P3)
- **Full-screen loader with no matching hide** in three views; it only clears via the axios success interceptor, so a throw leaves it up forever. (P3)
- **`Promise.allSettled` results discarded** in `executeCopyDay` and `executeBulkDayTypeChange`, which then show an unconditional success snackbar.
  `handleReschedule` removes tasks from the view whether or not the update succeeded. (P3, P5)
- **One request per day, uncancelled**, in the calendar cell-content watcher — up to 31 concurrent and racing on fast month navigation. Bulk copy is *tasks × days*
  POSTs. (P5)

## Debt, measured

- **19 of the repo's 72 type errors are in this module** — the largest single cluster, and roughly three quarters of them trace to one root cause:
  `IBaseDayPlannerStore` is not actually satisfied by either store, and `provide('plannerStore', …)` uses an untyped string key. (P2)
- **`_locales/dayPlanner.{sk,en}.ts` is 25 lines.** Five files in the module call `t()`; 17 `.vue`
  files contain no `t()` at all. In a Slovak-primary app, the planner UI is English. Several strings are `${n} day(s)` template literals — Slovak has three plural
  forms. (P4)
- **One accessibility attribute in ~40 components** (`:tabindex="0"`). No role, no aria-label, no aria-selected anywhere. Pointer handling is fine; the semantic
  layer does not exist. (P8)
- **No URL state on the calendar view**, contrary to CLAUDE.md. Three mutually exclusive mode booleans hand-clear each other where one enum would do. (P7)

## Backend-dependent prompts

Two prompts (**P5**, **F2**) need something the .NET side does not expose. The solution is not in this repo, so neither can verify a contract from here.

Both therefore end with the same instruction: do all the frontend work that stands on its own first, then write the backend ask to `/backend/<ID>-backend.md`.

That handoff file is **contract only** — the endpoint the frontend calls (method, route, request shape) and the DTO fields it consumes, with types and nullability,
in the JSON naming the frontend's
`fromJson` reads. Nothing else: no entities, no EF or migrations, no transactional boundaries, no opinion on how a value is computed or stored.

That boundary is deliberate, and it is the same one `prompts/todo-motivation/` uses. This repo cannot see the .NET solution, so anything past the contract would be a
guess dressed as a spec. The frontend knows exactly what it consumes — that part it can state with authority.

Batch the resulting files into one backend session rather than opening two threads.

## Suggested order

**P1 → P2 → P3**, then **P4 → P5 → P7**, then **P6 → P8**, then **F1 → F2**.

The ordering is not arbitrary:

- **P1 before P8**, because P8 builds on however P1 scopes the keyboard listener.
- **P2 before P6**, because refactoring components whose store type does not check is guesswork.
- **P4 before P6**, so the dedup moves already-keyed strings instead of English literals.
- **P1 before P6**, because P1 changes how `TemplateDayPlannerView` receives its template id.
- **F1 and F2 last** — both add user-facing strings, and both are more pleasant to write once P4 has established the key structure.

## How the model calls were made

**Opus 5, high effort** — P1, P2, P6, P8, F1. These share a shape: the code is small, the judgement is not. P2 is a generics-and-Pinia design problem where the cheap
fix (`as any`) is available and wrong. P6 requires telling real duplication from two views that merely look alike — the failure mode is merging them behind a `mode`
prop. P8 has no off-the-shelf ARIA pattern for a custom time grid, and a confidently wrong `role` is worse than none. F1 is three lines of logic wrapped in a dozen
restraint decisions.

**Sonnet 5, medium effort** — P3, P4, P5, P7, F2. Bounded work against patterns already present in the files being edited. P4 is large but mechanical once the key
structure is set; its only real judgement is the Slovak plural forms. P5 and F2 are partly investigate-and-report, which needs discipline about stopping rather than
depth.

**Nothing here is a Haiku job.** Every prompt either touches a shared generic component, changes a type contract three files depend on, or writes user-facing Slovak.

Bump effort if a run comes back shallow — P2 and P6 are the likeliest, since both depend on correctly reading existing structure before changing anything.

## Deliberately excluded

- **A day-level over-capacity warning** — already exists. `DayPlannerProgressBlock.vue` renders planned / free / "over capacity" minutes today.
- **Merging `DayPlannerView` and `TemplateDayPlannerView`** — they share a shell, not a purpose.
  `component/DayPlanner.vue` is already the correct seam. P6 says this explicitly so a run does not wander into it.
- **Reworking drag/resize** — `usePlannerPointerInteractions.ts` is the module's most intricate file, it uses pointer events correctly (so touch already works), and
  there is no reported defect in it. Rewriting it on aesthetic grounds would be the highest-risk, lowest-return change available.
- **Notifications for the now/next surface** — `useTaskReminders.ts` already owns time-based alerting and is wired to the user's reminder settings.
