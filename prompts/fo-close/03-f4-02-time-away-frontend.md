# F4-02 frontend: mark *Time away* once, see its name on its days, and list past stretches

> Paste into a fresh session in this repo. Opus, medium effort. **Starts only after prompt 02 is committed, its
> migration applied and the API restarted by the owner.** Check first: one request to the new list route must
> answer 200, not 404. If it 404s, stop and say the API needs restarting; do not mock the routes.

## Why

F4-02 (`docs/feature-discovery/F4-day-type-periods.md` § *F4-02* and § *Rollout → F4-02 → 3. Frontend*): today a
vacation is marked day by day, one visible month at a time, from the bulk bar, and the days stay nameless. The
owner chose the full stretch entity on 2026-10-12. Their answers to F4's open questions are in
`prompts/fo-close/02-f4-02-time-away-backend.md`; the one that shapes the UI is **Q8: the stretch's template is only
suggested first on its days, never applied by the stretch.**

## Read first

- Prompt 02's report (the commit message and its request/response shapes). If the backend session left notes in
  `docs/feature-opportunities.md` (wave A, step 4), read them too. **Read the shapes off the running API's swagger**
  (`https://localhost:8080/swagger`) rather than trusting any prompt, including this one.
- `CLAUDE.md` in this repo, especially the module rules, DTO rules (`fromJson`, `convertToEnum`), `useDialog`, and
  § *`src/_common` is a submodule*. The day-cell header lives in the framework.

## What to build

1. **API + DTOs** in `src/core/dayPlanner/` (`api/timeAwayApi.ts`, `dto/request/`, `dto/response/`), composed from
   `useEntityQuery` / `useEntityCommand`. `Kind` goes through `convertToEnum` with the existing `DayType` enum.
2. ***Mark time away* dialog** (`MyDialog` via `useDialog().openDialog`): name, kind (Vacation / Sick day), date range
   (`DateRangePicker`), optional template, optional location, optional notes. Opened from:
   - `BulkSelectActionBar.vue`, with the range prefilled from the selected days;
   - `CalendarDetailsDialog.vue`, with that one day prefilled.
   Overlap is a 400 from the server; show its message on the range field, not a generic snackbar.
3. **The stretch's name on its days.** A chip in the calendar day cell and in `DayDetailsPanel.vue`. The cell header
   is the framework's `CalendarDayCellHeader`: give it an optional, generic prop (the spec says `spanName`) and keep
   app domain out of `_common`. That is a framework change: follow `CLAUDE.md` § *`src/_common` is a submodule*
   (generic, defaults to today's behaviour, framework docs updated, **commit inside `src/_common` first, then the
   pointer**). Do not push either repo.
4. **A *Time away* list**, reached from the planner calendar (not from `/user/settings`: a stretch is data, not a
   preference). Past and upcoming stretches with dates and length; open one to edit (rename, resize) or delete.
   Deleting asks first through `useDeleteConfirmation` (`src/core/user/composable/`), the sanctioned delete path.
   **It must never become a counter**: no "12 sick days this year", no totals.
5. **Suggestions**: `TemplateSuggestionResponse.ts`'s pattern-type union gains `4`, and `DayTemplatePicker.vue`
   gets the sentence for it ("Planned for &lt;name&gt;").
6. **Locales**: SK (primary) and EN in `src/core/dayPlanner/_locales/dayPlanner.{sk,en}.ts`. Write the copy plainly
   and kindly: this is the user's holiday or illness, not a performance record.

## Verify in the browser

`playwright-cli` on `https://localhost:3000` (`CLAUDE.md` § *Browser verification*: `state-load` → `reload` →
`state-save`, every time; `-s=<name>` on every command). Mark a stretch across a month boundary from the bulk bar,
see its chip on both months, check that a template on it is suggested first on one of its days, resize it, delete
it, and confirm the days return to their natural type while a day you overrode by hand keeps its override.

## Rules that bite here

- `function` declarations; PascalCase components; camelCase props; `defineModel` for v-model; `VNumberInput` for
  numbers; `MyBtnToggle` with a `label` instead of a bare `VBtnToggle`.
- `npm run type-check` exits 0, `npm run lint` 0 errors, no raw template text.

## Done when

The four surfaces work against the real API. Update `docs/feature-opportunities.md` (wave A step 4 → built, with
the commits). The answers to F4's Q5–Q9 are already recorded in `docs/feature-discovery/F4-day-type-periods.md`.
Commit with `git commit -m … -- <paths>`; framework first if you touched it. Do not push.

## If the API is not enough

Finish the UI with whatever fallback is honest, then write the ask to `prompts/fo-close/backend/B2-<slug>.md`
(contract and reason only, no schema decisions) and report it. Do not write one for something swagger already shows.
