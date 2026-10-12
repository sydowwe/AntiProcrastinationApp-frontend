# FO4 close-out: leisure *Plan it for later* and the to-do → planner handoff ask the server for a free slot

> Paste into a fresh session in this repo. Frontend only; the route exists and is live. Opus, medium effort.

## Why

FO4 (`docs/feature-opportunities.md` § FO4) built one placement rule on the server, `DayPacking`, behind three
routes. The spec promised that rule to **three modules**: home's *Move later*, leisure, and the to-do handoff. Only
home uses it today (`useTodayPlan.ts`, `snoozeTask` → `fetchNextFreeSlot`). The other two still guess a time on
the client, so they can propose a slot that is already taken. `docs/feature-opportunities-effort.md` keeps FO4 open
for exactly this.

## The route (verified live 2026-10-11)

`GET calendar/day-plan/{yyyy-MM-dd}/next-free-slot?minutes=&notBeforeMinute=&excludeTaskId=`, client
`fetchNextFreeSlot(date, minutes, options)` in `src/core/dayPlanner/api/dayReplanApi.ts`, response `NextFreeSlot`
(`src/core/dayPlanner/dto/response/NextFreeSlot.ts`).

- On today it searches from **now**; `notBeforeMinute` (minutes past midnight, user's clock) pushes the search later.
- No room is a **200 with `found: false`**, never a 404. A past day is a 400.
- Background blocks neither move nor hold time; the window ends at the day's bed time (23:59 when bed time is midnight).
- Read `AdhdTimeOrganizer.Planning/docs/domain-map.md` § *Re-planning the rest of today* in the backend
  (`C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`) only if the result surprises you. Do not edit the backend.

## What to build

1. **Leisure, *Plan it for later*.** `src/core/leisure/component/picker/PlanLaterDialog.vue` starts the time
   picker at "the next half hour, 15 minutes out", computed locally (`initialMinutes`). Start it at the server's
   next free slot for `slotMinutes` on the user's today instead (`isoDateInUserZone()` from
   `@/_common/composable/general/useUserClock.ts`).
   - Call it `_silent`. On failure, or `found: false`, keep today's local guess and say nothing. The picker
     already lets the user choose, so the server's slot is only a better default, not a gate.
   - While the request is in flight the picker must not jump under the user's finger: keep the local guess, and
     replace it only if the user has not touched the picker yet.
   - Leisure may import `@/core/dayPlanner/api/dayReplanApi.ts` and its DTO. That is the allowed `api/` + `dto/`
     crossing (`CLAUDE.md`, cross-module rule), the same one `useLeisureCommitment.ts` already makes.
2. **To-do / routine → planner handoff.** `TodoListView.vue` and `RoutineToDoListView.vue` call
   `dayPlannerStore.openCreateDialogWithActivity(activityId, itemId, mode, suggestedTime)`. `PlannerTaskDialog.vue`
   then builds the request with the default start (`PlannerTaskRequest.createEmpty()`) and sets the end to start +
   the item's suggested time (`createEmptyRequest`, `onPickerSelected`). When the dialog was opened by this handoff
   and its date is the user's today, prefill **start and end** from `next-free-slot` for that duration (at least
   10 minutes, the dialog's existing floor).
   - Same failure rule as above: silent, keep the current default.
   - When the dialog shows a date picker (opened from outside the planner, `showDatePicker`) and the user moves
     the date to a later day, ask again for that day, but only while the time fields are still the prefilled ones.
     A past day must not be asked (400).
   - Do not touch the create path for a block the user draws on the grid; it already has a time.
3. **Leisure *Do it now* stays "now", on purpose.** It records that the user started at this minute
   (`InProgress`, `actualStartTime`), so moving it to a free slot would make the record false. Say so in a comment
   in `useLeisureCommitment.ts` beside `isStartingNow`, naming FO4, so nobody "fixes" it later.
4. **Tests.** Unit-test whatever pure helper you extract (for example "prefill from a `NextFreeSlot`, or keep the
   default"). There is no spec for these two surfaces yet; `prompts/fo-close/e2e-fo4-replan-today.md` covers them
   after this lands, so do not write one here.

## Verify in the browser

`playwright-cli` on `https://localhost:3000`, signed in from a storage state (`CLAUDE.md` § *Browser verification*;
`state-load` → `reload` → `state-save`, every time). Seed a block that covers the next half hour (through the app,
not the database), then:

- open the leisure picker and *Plan it for later*: the default start is after that block;
- open the planner from a to-do item that has a suggested time: the dialog's start is after that block, and the
  end is start + the suggested time.

Check `playwright-cli requests` for one `next-free-slot` call per open, and `console error` for nothing new.

## Rules that bite here

- `function` declarations, not `const x = () =>`. PascalCase components, camelCase props in templates.
- No raw user-facing strings (`npm run lint` fails on template text; grep `.ts` and `<script>` by hand). This work
  should add no strings at all.
- `npm run type-check` (= `vue-tsc --build --force`) must exit 0, and `npm run lint` must stay at 0 errors.

## Done when

Both surfaces default to the server's slot, fall back silently, and the *Do it now* comment is in. Then:

1. Update `docs/feature-opportunities.md` § FO4: replace the *Not done* line's two callers with a dated
   *Built* note (keep N5's notification, which is still not built), and add a *Closed (date)* line at the top of
   § FO4 like FO1's.
2. Move FO4's row in `docs/feature-opportunities-effort.md` from *Built, not closed* to *Closed*.
3. Commit with `git commit -m … -- <paths>` in one command (other sessions share the index). Do not push.

## If the route is not enough

If `next-free-slot` is missing something you need (it has no way to say "from this time on a future day", for
example), finish the frontend with the fallback first. Then write the ask to
`prompts/fo-close/backend/B1-<slug>.md`: the contract you need and why, no storage or schema decisions. Report it.
Do not write one for anything you can already read off the route.
