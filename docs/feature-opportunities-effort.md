# Feature opportunities: Opus effort per remaining step

> Written 2026-10-07 against `docs/feature-opportunities.md`. It assumes **every step runs on Opus 5.5**. It replaces
> the Sonnet entries in each FO's *Model / effort* line with an Opus effort level. If an FO's scope changes, update it
> here too.

## Closed (reviewed 2026-10-08)

Checked against each FO's *Backend logic needed* and *Frontend surface*, in both repos. No effort left to assign.
What remains is the owner's (migrations, restart) or a re-run.

| FO | Backend | Frontend | Left |
|---|---|---|---|
| FO1 | `ab5f0e7` | `ec4b7a30` | Nothing. Migration `20261006183310_RoutinePeriodCompletionIsExcused` was applied on 2026-10-11 (wave A's row in `feature-opportunities.md`). e2e: `routine-away-days.spec.ts`, 4/4 twice on 2026-10-12. |
| FO2 (closed 2026-10-12) | `9058535`, `882cdf5` | `4e16f51a`, `0317e802` | Nothing. The API was restarted on 2026-10-12. |
| FO6 (closed 2026-10-12) | `5c17788`, `bd3faa9` | `0e2c9bcf` | Nothing; the API was restarted on 2026-10-12. Lanes (two overlapping blocks side by side) are a separate, later item: `prompts/fo-close/04-planner-lanes.md`. |
| FO7 (re-closed 2026-10-12) | + `8a2e0e4` | — | Nothing. Migration `20261012161330_DropUserHasExtensionAccess` was applied on 2026-10-12. Pairing codes are **rejected**, no longer deferred. |
| FO3 phase 1 | `2748772` | `7557fe30` | Nothing. |
| FO3 phase 2 | `410dced` | `b929602b` | Nothing. Migration `20261007200704` is applied, and `todo-motivation.spec.ts` was re-run against the new route, 12/12 (`8b0595ad`). |
| FO7 | `bcf8671`, `dc5059c` (notification hub closed to tracker tokens) | `ba3e54ea` (`_common` → `a0d8095`) | See the 2026-10-12 row below: the column is dropped and pairing codes are rejected. |
| FO10 (closed 2026-10-12) | `3e8f0e7` | `8b0595ad` | Nothing. Migration `20261011212220_UserDefaultSleepWindow` is applied, and the settings card was browser-checked against the real API: future unmarked days move, past and custom days don't. |
| FO5 (closed 2026-10-12) | `8863158` (greeting), `1aa7f2b` + framework `5646e89` (back-off) | `874ee396` | Nothing. Migration `20261008080300_UserLastActiveAndWelcomeBack` is applied. No e2e spec; the card was checked in the browser on 2026-10-08. |
| FO4 (closed 2026-10-13) | `565f3e6` (xhigh agent) | `d0b24eda`, then the 2026-10-13 close-out (`prompts/fo-close/01-fo4-next-free-slot-callers.md`) | Nothing in FO4. Leisure *Plan it for later* and the to-do handoff now ask `next-free-slot` too, checked live on 2026-10-13. Leisure *Do it now* stays "now" on purpose: it records that the user started at this minute. N5's notification is audit N5's. |

## Built, not closed

None since 2026-10-13, when FO4 moved to the table above.

**Closed on 2026-10-12** (moved to the table above): FO2's counted-item rule, after the owner chose "the server owns
the step" with an explicit `countsAsRepetition` flag on the history creates. Only the to-do timer sends it, because
home's planner-block timer links its time for the recap and lets the block decide. FO6's two gaps: the conflict mode
is never destructive from a read, and a day marked away later loses its untouched occurrence. The planner-block →
to-do fan-out stays absolute: a linked block done means the item done, and the two-way sync and
`CompletionFanOutTests` depend on that.

FO1 has an e2e spec since 2026-10-12 (`routine-away-days.spec.ts`), and so does FO3 phase 1
(`todo-stuck-item-offer.spec.ts`). None of FO2, FO4, FO6 or FO7 has one yet. One prompt per spec is in
`prompts/fo-close/` (`e2e-*.md`); run them **one at a time** (that folder's README says why).

## Remaining steps

| FO | Step | Opus effort | Why |
|---|---|---|---|
| **FO8** | ~~F3-01 (to-dos)~~ built 2026-10-12 | **high** | It sets the shared rule (medians, sample thresholds, wording). The wording must describe the estimate, never the person. |
| | ~~F2-06 (routines), F2-07 (timers)~~ both committed, browser-checked and covered by e2e specs 2026-10-12 | **medium** | Both reuse the rule; the reads only add data. |
| **F4-02** | backend agent (`prompts/fo-close/02-…`), then a frontend session (`03-…`) | **high**, then medium | Owner chose the full `TimeAway` entity on 2026-10-12, with F4's recommended answers to Q6–Q9. A migration on the hot `calendar` table (nullable column, metadata-only) and a stamper whose un-stamp must restore exactly what it wrote. |
| **FO9** | backend agent | **xhigh** | Ingest must attribute idempotently, and it needs a policy for time counted twice by desktop and Android. A wrong rule is silent and permanent. |
| **FO11** | one session | **medium** | A SQL view edit plus one table that only adds data. |
| **FO12** | ~~F2-04 (ranker swap)~~ built 2026-10-12 (backend `c086af0`, frontend `15e4bb1e`) | **high** | It must compare the client's ranker against the server's, and the two may have drifted apart. They had: weather, and the client's party-size penalty. Both ported. |
| | ~~F3-06 (last-done seam)~~ built 2026-10-12 (backend `017595f`; frontend in the commit that carries this row) | **medium** | One keyed seam with three implementations. Done inline, not by a separate agent. |
| **FO13** | ~~one session~~ built 2026-10-12 (backend `e2364cd`, frontend `250bdd22`) | **medium** | The handler is small. The one real choice is where the handoff link lives: a nullable column on the project profile, FK declared host-side. |

**Wave F, closed (2026-10-12):**
- Migration `20261012091415_ProjectShoppingTodoListItemLink` is applied and the API was restarted.
- The three reworked picker specs pass (25 passed, 3 existing `fixme`s skipped).
- FO13's handoff → tick → *Ready to start* and FO12's "last time" line were checked in the browser.
- Real weather was not seen live, because the seed has no weather-dependent row. Stubbed-provider tests cover it.

## Rule of thumb

- **xhigh:** a bug would silently write wrong data (FO4, FO9).
- **high:** a migration or backfill on a table already in use, or a rule shared across modules.
- **medium:** reads that only add data, frontend work on existing components.
- **low:** a toggle-sized frontend change.
- **max:** nothing here needs it.
