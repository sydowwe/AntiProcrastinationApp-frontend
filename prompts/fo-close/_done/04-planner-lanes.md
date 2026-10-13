# Planner lanes: up to two foreground and two background blocks side by side

> Paste into a fresh session in this repo. Opus, high effort. Frontend first; a server-side rule is a decision to
> ask the owner about, not a default (see step 5). Run it whenever the owner wants it: on 2026-10-12 they decided
> FO6 closes without it ("safe twin now, lanes later").

## Why

The owner's idea (2026-10-12, while closing FO6): "overlap is better, so the user can see both and decide which to
delete … maybe I should allow 2 foreground items plus 2 background ones." Today an overlap is either refused or
invisible:

- **The server allows any overlap.** There is no overlap rule in `PlannerTaskValidator` or anywhere else in
  Planning; only template apply and FO6's materialiser resolve conflicts, through `PlannerTemplateApplier`.
- **The day grid refuses it while you edit and hides it otherwise.** `usePlannerPointerInteractions.ts`
  (`checkTaskConflictByRow`) blocks a drag, a resize, a drawn block and a clipboard placement that would overlap a
  foreground block; `usePlannerKeyboard.ts` does the same for arrow moves. But the create/edit dialog does not
  check, and neither does any write that does not go through the grid (a PUT from another surface, for one). An
  overlapping block that does get saved is drawn **on top of** the other one: foreground blocks get
  the full column width (`BaseTaskBlock.vue`, shifted 36 px when `isDuringBackgroundTask`), and every background
  block draws in the same 36 px strip (`BackgroundTaskBlock.vue`). `useDayPlannerCommon.checkConflict` exists and
  is called by nothing.

(Verified on 2026-10-12 against frontend `0317e802`. Re-check before relying on it.)

## What to build

1. **Lane assignment**, a pure function with unit tests: given the day's blocks, give each foreground block lane 0
   or 1 and each background block lane 0 or 1, by start time, so overlapping blocks never share a lane. Blocks
   that do not overlap anything keep the full width. Where it lives: beside the grid-position code
   (`setGridPositionFromSpan` / `initializeTaskGridPositions` in `useDayPlannerCommon.ts`), shared by the day
   planner and the template planner (`usePlannerStoreCore`).
2. **Rendering**: a foreground block in a two-lane stretch takes half the column; background strips become two
   narrower strips (or one strip split, whichever stays readable at phone width; check at 360 px). Keyboard focus
   order and `aria` labels must still read in time order.
3. **The conflict checks become "at most two"**, not "none": drag, resize, draw, clipboard placement and arrow
   moves allow a placement that leaves at most two foreground blocks (and at most two background blocks)
   overlapping at any minute, and refuse a third with the existing feedback strings (`planner.feedback.*`).
   Replace the dead `checkConflict` rather than adding a fourth copy of the overlap test.
4. **The dialog** (`PlannerTaskDialog.vue` / `BasePlannerTaskDialog`): warn, and do not save, when a save would
   make a third overlapping block. Show which blocks it collides with.
5. **Server rule, ask first.** Whether the API should refuse a third overlap (and how that interacts with template
   apply, copy-to-days, the re-plan apply and FO6's materialiser) is the owner's call. Ask with `AskUserQuestion`
   before touching the backend. Without a server rule, a third overlap can still arrive from another path, so the
   renderer must not break on it: draw lanes 0 and 1, and mark the extra block as clashing instead of hiding it.
6. **Other readers of "the current block"**: home's now bar (`usePlannerNowNext.ts`), `useWrapUpBlock.ts`, the
   overdue banner and the MiniTimeline. Each assumes at most one foreground block at a time. Decide per reader
   (for example, the now bar shows the one that started first and says "and 1 more"), and test it.
7. **FO6, afterwards.** With lanes in place, FO6's materialiser could place an occurrence *overlapping* a user's
   block instead of skipping or carving it (the owner's first instinct). That is a backend change to
   `RepeatingTaskMaterialiser.NonDestructive` in the backend repo, and a product decision. Raise it with the owner
   at the end; do not do it unasked.

## Verify

Unit tests for the lane function and the "at most two" check. In the browser (`playwright-cli`, `CLAUDE.md`
§ *Browser verification*): two overlapping blocks side by side; a third refused by drag and by the dialog; two
background blocks side by side; phone width; home's now bar during an overlap. One screenshot is justified here
(layout is the question); keep it to the overlap view.

## Done when

Type-check exits 0, lint is clean, and the existing planner specs (`dayPlanner.spec.ts`,
`templateDayPlanner.spec.ts`, `planner-*.spec.ts`) still pass, run one at a time (see `prompts/fo-close/README.md`
on why e2e runs are sequential). Note the lanes in `docs/feature-opportunities.md` under FO6. Commit with
`git commit -m … -- <paths>`; do not push.
