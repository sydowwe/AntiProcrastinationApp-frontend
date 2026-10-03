# F4. Day-type periods: a design pass

Read `prompts/feature-discovery/_RULES.md` first. Output: `docs/feature-discovery/F4-day-type-periods.md`.

This pass is different from F1–F3. It does not sweep for candidates. It works through **one** idea the owner already
has, and produces a design that F5 can rank against the others.

## The idea (the owner's brainstorm, 2026-04-02)

Today a day's type is free text, a label on the calendar day (check the current shape: `Calendar.label` /
`Calendar.dayType` in `docs/data-map/planner.md` and the backend `.Planning` entity). The owner wants it to become a
**foreign key to a lookup / period entity** instead, so that:

- days can be grouped into named **periods**: "Barcelona vacation", "sick leave", "skiing trip";
- a **workday variant** ("HomeOffice", "Office") can **suggest a day template**;
- there can be a **history view**: all vacation days, all sick days;
- **recurring** labels (an annual skiing trip) can link to a template for that label.

`prompts/captured-data/README.md` deferred it: "a larger modelling decision, not spending captured data, and it deserves
its own design pass". This is that pass.

## Work through

1. **Current state, with evidence.** How labels, `dayType`, `holidayName`, `location` and `appliedTemplateId` work
   today, in both repos. Note how `TaskPlannerDayTemplate.suggestedLocation` (B27, OP18) and C3
   (template-by-location) already approach template suggestion. This design must fit with them, not compete.
2. **Two concepts, or one?** A *day type* (Office / HomeOffice / Weekend, recurring and categorical) and a *period* (a
   named, dated span such as a vacation) are different things that the brainstorm merges. Decide whether they should be
   one entity or two, and argue it.
3. **Model.** Entities, relations, cardinality, and ownership (per user). What happens to existing free-text labels:
   migrate them, keep them alongside, or leave them as they are? Deletion: what happens to the days when a period is
   deleted?
4. **Rules and logic the server would own.** Template suggestion by day type; a period assigned to a date range in one
   operation; overlap rules between periods; how a period interacts with routines (does a vacation pause routine
   periods and protect streaks? Check how `freezeBudget` and the streak logic work today) and with notifications (does
   a vacation imply quiet days?).
5. **What it unlocks**, as concrete user-facing features. Rank them, and say which need the full model and which a
   lighter version could deliver.
6. **A lighter alternative.** Is there a smaller change that captures most of the value? For example, day type as an enum
   or a lookup table, with periods postponed. Compare honestly.
7. **Migration and rollout.** The order of backend, migration and frontend changes. Remember that migrations are applied
   by hand and the API runs under the owner's debugger.

## Output

Not the standard candidate list. Write these sections: *Current state*, *Day type vs period*, *Proposed model*, *Server
logic*, *What it unlocks*, *Lighter alternative*, *Rollout*, *Open questions for the owner*. Finish with **one candidate
block** in the `_RULES.md` format (`F4-01`, or `F4-01` and `F4-02` if you recommend splitting it), so F5 can rank it
alongside the others.
