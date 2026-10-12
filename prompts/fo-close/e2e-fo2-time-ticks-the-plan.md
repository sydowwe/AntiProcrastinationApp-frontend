# e2e: FO2, time logged anywhere ticks off the plan, and one sitting is one repetition

> Paste into a fresh session in this repo. Opus, medium effort. Run it **alone** (`prompts/fo-close/README.md`).
> **Needs the API restarted on backend `882cdf5` or later.** Check first: `POST /api/activity-history` with
> `countsAsRepetition: true` and no item link must answer **400**. If it answers 201, the API is stale; stop and
> say so.

## Read first

- `CLAUDE.md` § *Writing e2e specs*, § *Mutating specs* and § *Browser verification*.
- `docs/feature-opportunities.md` § FO2, and the two FO2 commits: backend `882cdf5` (the handler and the
  `countsAsRepetition` flag) and frontend `0317e802` (the to-do timer sends the flag and stops toggling). The rule:
  a sitting logged **from the item** ticks it once (one repetition of a counted item, done for a plain one, however
  short); home's planner-block timer sends the link **without** the flag, so its block decides the item; time alone
  never finishes a counted item.

## What to cover (new file `e2e/tests/todo-log-time-ticks.spec.ts`)

Create every row you mutate through the API (`request` context on the same storage state), leave the fixture
read-only, and delete what you made at the end.

1. **A "4×" item takes four sittings.** A to-do with `totalCount: 4` and a suggested time. Log time from its row
   through the log-time dialog (the manual path is faster than running a timer). The counter reads 1 of 4 and the
   item is not done. Log three more; it is done after the fourth, not before.
2. **A plain item is finished by one short sitting.** A plain to-do; log 5 minutes from its row; it is done.
3. **A logged sitting completes the planned block.** A planner block today on the same activity as a plain item,
   as long as the logged time; after logging from the item, the block reads *Completed* on home and in the day
   planner. (The block-time window must lie in the past on the seed's day; derive it from `seedDateUtc` and skip
   with a reason when the real clock makes that impossible, rather than flaking.)
4. **Home's planner-block timer does not tick a counted item.** Only if it can be driven without waiting out a real
   timer. If not, leave it to the backend test (`HistoryTicksOffThePlanTests.RecapOnlyLink_LeavesACountedItemAlone`)
   and say so in a comment.

## Before writing assertions

Drive the log-time dialog with `playwright-cli` (`-s=fo2`) and paste the locators it emits. The dialog is a
`VIdSelect`/time picker: see `CLAUDE.md` on clicking a `VSelect` by its label wrapper.

## Done when

Passes twice in a row; `npm run typecheck --prefix e2e` clean. Update the e2e line in
`docs/feature-opportunities-effort.md` and FO2's status. Commit with `git commit -m … -- <paths>`; do not push.
