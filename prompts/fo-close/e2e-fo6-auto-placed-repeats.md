# e2e: FO6, recurring commitments put themselves on the plan

> Paste into a fresh session in this repo. Opus, medium effort. Run it **alone** (`prompts/fo-close/README.md`).
> **Needs the API restarted on backend `bd3faa9` or later** (the away-day withdrawal and the non-destructive
> conflict rule). Check first: mark tomorrow `SickDay` through the batch endpoint for a rule you just placed, and
> see whether tomorrow's occurrence goes. If it stays, the API is stale; stop and say so.

## Read first

- `CLAUDE.md` § *Writing e2e specs*, § *Mutating specs* and § *Browser verification*.
- `docs/feature-opportunities.md` § FO6, and the backend Planning `docs/summary.md` bullet on
  `GET /calendar/day-plan/{date}` writing. The rules: today and tomorrow only; a deleted or skipped occurrence never
  comes back; an away day is passed over, and a day marked away later loses its **untouched** occurrence; the
  user's conflict mode is never destructive here; editing the rule updates untouched occurrences.

## What to cover (new file `e2e/tests/repeating-auto-place.spec.ts`)

Create rules through the UI or the API on a fresh activity, and delete the rules and their occurrences at the end
(occurrences on today and tomorrow outlive the rule otherwise).

1. **The switch.** In `RepeatingTaskDialog`, "Put it on my plan automatically" on a daily rule; after saving, home
   and today's day view show the block, with the `repeat` mark in `PlannerTaskBlock`'s origin slot.
2. **Delete stays deleted.** Delete today's occurrence; reload home and the day view; it does not come back.
3. **Away tomorrow.** Mark tomorrow `SickDay` from the day dialog or the bulk bar: tomorrow's occurrence is gone.
   Mark it back: it does not return.
4. **Your block wins.** With the planner setting *Default conflict resolution* on *Overwrite*, put your own block
   over the rule's time on a day not yet decided (or create the rule after the block): after the read, your block is
   untouched and the occurrence is not on top of it.
5. **Editing the rule moves untouched occurrences**, and leaves one you moved.

## Before writing assertions

Drive `RepeatingTaskDialog` and the day view with `playwright-cli` (`-s=fo6`) and paste the locators it emits.

## Done when

Passes twice in a row; `npm run typecheck --prefix e2e` clean. Update the e2e line in
`docs/feature-opportunities-effort.md` and FO6's status. Commit with `git commit -m … -- <paths>`; do not push.
