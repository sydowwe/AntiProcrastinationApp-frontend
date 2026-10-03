# F1. User-journey gaps

Read `prompts/feature-discovery/_RULES.md` first. Output: `docs/feature-discovery/F1-journey-gaps.md`.

## The question

Walk through a week of an ADHD user's life with this app, and find the moments where the user needs help and **no module
gives it**. Then keep only the gaps whose fix needs backend logic.

## Method

1. **Build the journey from the app's own purpose, not from its screens.** Read every
   `docs/views/<unit>/usecase.md` (skip `_submodule/` unless it is relevant) and `docs/views/glossary.md`. Then write out
   the journey as stages. Use these as a starting skeleton, and add, split or rename stages where the app's own use cases
   suggest it:
   - **Capture:** an intention appears ("I should…") and has to land somewhere before it is forgotten.
   - **Plan:** the day or week is shaped, and tasks get a time, a list or a routine.
   - **Start:** the planned moment arrives. This is where procrastination actually happens.
   - **Stuck / drifting:** the user is avoiding the task, distracted (tracking sees this), or the plan has silently gone
     stale.
   - **Recover:** the day went off plan. What now: re-plan, shrink, skip, move?
   - **Close the day:** what got done, and what carries over.
   - **Review the week:** patterns, and whether the plan, the estimates and the routines fit reality.
   - **Rest / reward:** leisure and the bucket list, and whether time off is earned or guilty.
   - **Long gaps:** the user stops opening the app for a week. What happens when they come back?
2. **For each stage, list what the app does today.** Name the module, view and endpoint, with evidence. Then ask what a
   user at that moment would still need. Be concrete: "nothing notices that the 10:00 task was never started, and at
   11:30 the plan still shows it at 10:00" is a gap; "better motivation" is not.
3. **Check each gap against the code in both repos.** Confirm it is not already handled somewhere you did not look
   (`home` widgets, NowBar, reminders and the scheduler jobs listed in `docs/notification-audit.md`).
4. **Keep only the gaps whose fix needs backend logic** (see `_RULES.md`). Put the rest in *Out of scope, but noticed*.
   They are still useful.

## Pay particular attention to

- **The Start and Stuck stages.** That is the app's whole reason to exist, and the data-map method could not see it,
  because a missed start leaves **no** data behind.
- **Long gaps and returning.** A user who comes back after a week faces a wall of overdue items. Does anything on the
  server help them triage or reset, or does the client just show everything?
- **Estimates vs reality across modules.** The planner, to-dos and timers each hold planned and actual time. Does
  anything feed the actuals back into the next plan?

## Output

Follow `_RULES.md` § *Your output file*. Before *Candidates*, add a **Journey table**: one row per stage, with the columns
*What the app does today* (with evidence), *Gap*, and *Candidate id* (or "none" / "frontend-only").
