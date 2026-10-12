# F4-02 backend: a named stretch of time away ("Barcelona, 12–20 Aug"), the `TimeAway` entity

> Paste into a fresh session. The work is in the **backend** repo, `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`.
> Opus, **high** effort. Do not run this beside another session that adds a migration (see *Migration* below).

## Before the first edit

This repo's `CLAUDE.md` § *Working in the backend repo from here* applies. Do all of it:

1. Read the backend's `CLAUDE.md`, then `docs/claude/slices.md`, `persistence.md`, `endpoints.md`, `testing.md`.
2. Read the **whole** `AdhdTimeOrganizer.Planning/docs/summary.md` and its `domain-map.md`, the whole
   `AdhdTimeOrganizer.Core/docs/summary.md`, and `AdhdTimeOrganizer.Core/application/seam/README.md`.
3. Read the backend memory index,
   `C:\Users\jakub\.claude\projects\C--Users-jakub-RiderProjects-AdhdTimeOrganizer\memory\MEMORY.md`, and open
   `dotnet-ef-while-rider-holds-bin.md`, `migration-captures-other-sessions-entities.md`,
   `artifacts-cli-held-by-another-session.md` and `planner-clock-injection.md`.
4. Never `dotnet build` or `dotnet test`. Use `./scripts/test.ps1` from the repo root.

## The design is done. Read it, do not redo it

`docs/feature-discovery/F4-day-type-periods.md` in **this** (frontend) repo is the spec:
§ *Proposed model* (entity, cardinality, ownership, labels, deleting a stretch), § *Server logic* items 1, 3 and 6,
and § *Rollout → F4-02*. It was written against backend `0409fa0` on 2026-10-04, so **re-open every file and line it
cites before relying on it**. Prompt sets here have run stale before (frontend memory
`project_prompt_set_claims_run_stale.md`).

What has landed since, and changes nothing in the design:

- F4-01 is built (FO1): `DayType.IsAway()`, `CalendarDayTypesChangedEvent`, Routines' retroactive excusal handler,
  and the away-day suggestion ranking.
- FO6 (`bd3faa9`): Planning's `AwayDayOccurrenceWithdrawalHandler` also takes `CalendarDayTypesChangedEvent` and
  removes untouched auto-placed occurrences from days that became away. Your stamper publishes that event, so a
  stretch both excuses routine cycles and clears auto-placed blocks for free.

## The owner's answers (2026-10-12): build option C

| F4 open question | Answer |
|---|---|
| 5. Is a named stretch wanted? | **Yes, the full entity (option C).** |
| 6. Entity name | **`TimeAway`** (UI: *Time away*). |
| 7. Deleting a stretch | **Cycles it excused stay excused.** Un-stamp the days; never re-score routine history. |
| 8. Template on creation | **Float it only**: the stretch's template is the first suggestion on its days (pattern type 4). Do **not** apply it to the days in v1, not even behind an opt-in flag. |
| 9. Convert existing labels | **No.** No conversion script. |
| 4. Holiday weekdays | Still open, and **not part of this work**. |
| 10. Item streaks while away | Already answered in F4-01: held. |

## Scope

1. **Migration, additive.** Table `planning.time_away` (`TimeAway : BaseEntityWithUser`, fields as in the spec:
   `Name`, `Kind` restricted to `Vacation`/`SickDay`, `StartDate`/`EndDate` inclusive, optional `TemplateId` →
   `TaskPlannerDayTemplate` `SET NULL`, optional `Location`, optional `Notes`; index `(user_id, start_date)`).
   `calendar.time_away_id bigint NULL`, FK `SET NULL`, indexed. Pin the FK constraint name with
   `HasConstraintName`, as the slice does for its cross-slice FK. A nullable column without a default is
   metadata-only in Postgres, even on the hot `calendar` table.
2. **`TimeAwayStamper`**, the single implementation behind create, resize and delete, in the
   `PlannerTemplateApplier` style (stages, never saves). It provisions missing days in bulk through
   `CalendarDayFactory`, not `EnsureForDateAsync` per date (that commits each time). It stamps `TimeAwayId` and sets
   `DayType = Kind` only where the day's type is natural or already `Kind`, and `Location` only where it is null.
   Un-stamping restores exactly what it wrote, keyed on `TimeAwayId` plus equality with `Kind`/`Location`. A
   stretch and its stamp are **one transaction**.
3. **Endpoints**: create, update (resize/rename), delete, get-by-id, and a list for a date range. Check
   `framework/Sydowwe.Framework/application/endpoint/base/` before writing a custom one. Rules: no overlap with the
   user's other stretches (400); `StartDate ≤ EndDate`; length ≤ `PlannerBatchLimits`' cap; `Kind` validator;
   `TemplateId` ownership checked like `DefaultApplyTemplateId`. Report per day where the batch endpoints do.
4. **The event.** After the commit, publish `CalendarDayTypesChangedEvent` with every date whose `DayType` actually
   moved. Both existing handlers then run.
5. **Suggestions.** Template pattern type 4 ("planned for &lt;name&gt;") ranks first on a day inside a stretch with a
   `TemplateId`, in `GetSuggestionsTaskPlannerDayTemplateEndpoint`. Its response union gains `4`.
6. **Day reads.** The calendar day responses the client reads (find them; the spec names `CalendarResponse` and a
   day summary) gain `TimeAwayId` and `TimeAwayName`, additive.
7. **GDPR.** Add `TimeAway` to the user data export and deletion. `UserDataExportAndDeletionTests` fails until you
   do; that is the test working. Add the table to `ModuleSchemaTests`' `planning` list.
8. **Fix the stale `Calendar.cs` label comment and the dev seeder's HomeOffice/Office labels** (spec, *What happens
   to the existing free-text labels*) if they are still there.

## Tests (rows, not routes: backend `CLAUDE.md` § *Silent failures*)

At least: create stamps every day and provisions missing ones; an override of another kind and a non-null location
survive the stamp; overlap is a 400 and writes nothing; resize un-stamps the days that leave and stamps the ones that
join; delete restores natural types and keeps a user's override; delete leaves excused routine cycles excused; a
stretch over today and tomorrow removes an untouched auto-placed occurrence (FO6's handler, reached through your
event); type-4 suggestion ranks first inside a stretch with a template; another user's `TemplateId` is a 404/400;
the export carries the stretch. Use `TimeProvider` where "today" matters (memory `planner-clock-injection.md`).

## Migration

Follow `dotnet-ef-while-rider-holds-bin.md` exactly (environment variables, never `--no-build`). Before
`migrations add`, run `git status` and look for another session's uncommitted entity; after it, read the generated
`Up()` and strip anything that is not yours (`migration-captures-other-sessions-entities.md`). **Do not apply the
migration and do not restart the API**: both are the owner's (Rider's debugger).

## Done when

Tests green through `./scripts/test.ps1` (the new class plus `UserDataExportAndDeletionTests`, `ModuleSchemaTests`,
`RoutineAwayExcusalFlowTests`, `RepeatingTaskMaterialisationTests`, `SeamWiringTests`). Update the Planning
`docs/summary.md` and `domain-map.md` (new entity, the stamper, the event publisher list, type 4). Commit in the
backend with `git commit -m … -- <paths>`; do not push. Report the migration's name so the owner can apply it, and
the exact request/response shapes for prompt 03. Then mark F4-02's backend half built in
`docs/feature-opportunities.md` (wave A, step 4) in this repo.
