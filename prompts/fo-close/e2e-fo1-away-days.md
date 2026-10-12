# e2e: FO1, vacation and sick days stop breaking routines

> Paste into a fresh session in this repo. Opus, medium effort. Run it **alone**: no other e2e or `playwright-cli`
> session at the same time (`prompts/fo-close/README.md`, *one at a time*).

## Read first

- `CLAUDE.md` § *Writing e2e specs* and § *Mutating specs*, and § *Browser verification*. Every rule there applies:
  import from `../fixtures/auth`, read ids off `seed`, derive dates from `seed.seedDateUtc`, `test.fixme` plus a
  finding id for a real defect, never a weakened assertion.
- `docs/feature-opportunities.md` § FO1 for what was built.
- The API's `docs/e2eTestSeed.md` (`C:\Users\jakub\RiderProjects\AdhdTimeOrganizer\docs\`), § *The routine period
  history `e2e-v4` added*: 16 closed cycles each on the Daily and Weekly periods, one frozen.

## What to cover (new file `e2e/tests/routine-away-days.spec.ts`)

1. **Marking a closed cycle's days away excuses it, after the fact.** Mark the days of one missed, closed Daily
   cycle as `SickDay` through `PATCH /api/calendar/day-type/batch` (a `request` context on the same storage state),
   then open the routine's history. The cell reads as away (umbrella icon, neutral colour, never the miss colour) in
   `RoutineGroupHeatmap.vue` / `RoutineGroupHistoryBody.vue`, and offers **no freeze** (`useStreakFreeze.ts`).
2. **The streak comes back.** If that cycle broke the period streak, the streak shown afterwards is higher. Assert
   against what the API reports for the period, not a number you counted.
3. **Away today, on home.** Mark the seed's today as `Vacation`; `DayContextBar.vue` says the user is away today.
4. **The hint in the day dialog.** `CalendarDetailsDialog.vue` shows the one-line "Vacation and sick days pause your
   routines" hint (wording from the locale file, matched by role/text in EN).

Steps 1–3 write to fixture rows (calendar days, completions). Put them in a `describe` with
`test.describe.configure({ mode: 'serial' })` and `test.use({ freshSeed: true })`, and add
`test.afterAll(reseed)` so later specs meet the fixture as documented.

## Before writing assertions

Drive each surface with `playwright-cli` first (`-s=fo1`, storage state, `state-save` after every `reload`), and
paste locators from its `### Ran Playwright code` block. Use `find` rather than `snapshot`.

## Done when

`npm test --prefix e2e -- routine-away-days` passes twice in a row, and `npm run typecheck --prefix e2e` is clean.
Update `docs/feature-opportunities-effort.md` (the line "None of FO1, FO2, FO4, FO6 or FO7 has an e2e spec") and
FO1's status in `docs/feature-opportunities.md`. Commit with `git commit -m … -- <paths>`; do not push.
