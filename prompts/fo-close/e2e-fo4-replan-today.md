# e2e: FO4, re-plan the rest of today, and the free-slot callers

> Paste into a fresh session in this repo. Opus, medium effort. Run it **alone** (`prompts/fo-close/README.md`).
> Run it after `01-fo4-next-free-slot-callers.md` is committed: its last block covers that prompt's two callers.

## Read first

- `CLAUDE.md` § *Writing e2e specs*, § *Mutating specs* and § *Browser verification*.
- `docs/feature-opportunities.md` § FO4 (what moves, what holds, the 409 rules, the *Tomorrow* / *Skip* choice),
  and the backend's `AdhdTimeOrganizer.Planning/docs/domain-map.md` § *Re-planning the rest of today*.

## The clock problem, first

"Missed" is judged on the **server's real clock** in the user's zone (the seed users are on UTC); Playwright's
`page.clock` moves only the browser. So build every block relative to the real current UTC minute, not to
`seedDateUtc`, and `test.skip` with a reason when the window is impossible (for example in the first 40 minutes
after UTC midnight, when there is no "earlier today" to have missed). Never let it flake at the day's edge.

## What to cover (new file `e2e/tests/planner-replan-today.spec.ts`)

Create the blocks through the API on a fresh activity, and delete them at the end.

1. **The banner appears only when something is missed.** A `NotStarted` block that ended 30 minutes ago:
   `ReplanTodayBanner` shows on today's day view. With no missed block, it does not.
2. **Preview and apply.** Open the re-plan: the before/after `MiniTimeline` and the text list show the block moving
   into the time left; apply; the stored block now starts after now (read it back through the API).
3. **What won't fit.** Two missed blocks that cannot both fit before bed time: one comes back under *No room left
   today* with *Tomorrow* preselected (an optional-importance one with *Skip*). Choosing *Tomorrow* moves it to
   tomorrow at the same time of day.
4. **A stale preview is a 409, handled.** Change the day (move a block through the API) between preview and apply:
   the dialog swaps in a fresh preview rather than writing.
5. **The other entry points.** The now bar's missed mode and the planner widget header both offer the re-plan when
   a block is missed.
6. **Home's *Move later*** lands the block at the server's next free slot, after an existing block, not on top of it.
7. **Prompt 01's callers.** Leisure *Plan it for later* defaults its time after an existing block, and the to-do →
   planner handoff prefills its start after an existing block.

## Before writing assertions

Drive each surface with `playwright-cli` (`-s=fo4`) and paste the locators it emits.

## Done when

Passes twice in a row; `npm run typecheck --prefix e2e` clean. Update the e2e line in
`docs/feature-opportunities-effort.md` and FO4's status. Commit with `git commit -m … -- <paths>`; do not push.
