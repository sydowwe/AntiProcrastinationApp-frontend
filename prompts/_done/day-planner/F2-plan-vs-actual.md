# F2 · Plan vs. actual — close the feedback loop on the planning fallacy

- **Scope:** `component/normal/DayPlannerProgressBlock.vue` or a sibling, `view/DayPlannerView.vue`
- **Backend:** likely, for the cross-day trend only — expect a stop-and-report; the single-day view needs nothing
- **Model / effort:** Sonnet 5, medium effort — the data is already loaded; the work is deciding what to show and what to withhold
- **Research:** Buehler, Griffin & Ross (1994) — people underestimate their own task durations even when they know they always have. The correction that works is being shown *their own* past error, not being told to add a buffer.

---

```
Every PlannerTask in this module already carries actualStartTime and actualEndTime alongside
startTime/endTime. component/normal/DayPlannerLogTimeController.vue fills them in on completion, and
component/normal/PlannerTaskBlock.vue renders them per block. Nothing anywhere aggregates them.

So the app collects exactly the data that corrects the planning fallacy and never shows it back.
Buehler, Griffin & Ross (1994): people underestimate their own task durations persistently, and
generic advice to "add a buffer" does not fix it — being shown their own past estimation error does.

BUILD, for the viewed day: how the day was planned versus how it actually went. Planned minutes
versus actual minutes, and where the drift came from — started later than planned, ran longer, or
never happened at all.

WHAT ALREADY EXISTS — read these before writing, and do not duplicate them
- component/normal/DayPlannerProgressBlock.vue already shows completed/total, a completion-rate bar,
  and planned / free / over-capacity minutes for the day. This is the natural home, or a sibling
  immediately next to it. It is NOT a new panel elsewhere.
- The task-stats computation is duplicated between that component and view/TemplateDayPlannerView.vue
  (taskStats). If you add a third copy of the same minutes arithmetic, you have done it wrong —
  extract one shared helper.
- _common/utils/formatDuration.ts (fromMinutes, fromSecondsDetailed) for all duration text.
- Time.getInMinutes, and note the midnight-wrap idiom used throughout this module:
  `end > start ? end - start : end + 1440 - start`. Get this right for tasks crossing midnight.

DEFINE THE EDGE CASES DELIBERATELY — the numbers are worthless if these are sloppy
- A task with status Completed but no actualStartTime/actualEndTime (completed without logging time).
- Cancelled tasks — they have a skipReason. Skipped time is not overrun time and must not be
  averaged into drift; decide whether it is shown separately or not at all.
- Background tasks (isBackground) overlap everything by design. Excluding them is almost certainly
  right — DayPlannerProgressBlock and TemplateDayPlannerView both already filter them out. Match that.
- A day that is still in progress. Do not compute a drift verdict at 10:00 for a day that ends at
  23:00. Either restrict to finished tasks or show nothing until the day is materially done.

TONE — this is the part that decides whether the feature helps or hurts
Descriptive, never evaluative. "Planned 6h 30m · logged 7h 45m" is useful. "You went 19% over
again" is a scolding, and the whole point of the research is that people already know they are bad
at this — what they lack is the number, not the reminder that they failed. No red, no warning
icons, no streak of bad days. On a day with nothing to compare, render nothing rather than a
zeroed-out card.

STRINGS through vue-i18n into _locales/dayPlanner.{sk,en}.ts under the existing `planner` namespace,
SK primary. Anything with a count needs Slovak plural forms via vue-i18n pluralization.

FINALLY — the cross-day trend
The genuinely valuable version of this is "your tasks typically run ~20% longer than you plan",
which needs many days, not one. The single-day view above needs no backend at all; the trend does.
Build the single-day view completely first. Then, only if the trend data is not reachable from
existing endpoints — check src/core/historyDashboard/api/ and src/core/activityHistory/api/ before
concluding that, and do NOT fetch every day of history and aggregate client-side — write the backend
ask to prompts/day-planner/backend/F2-backend.md.

CONTRACT ONLY in that file: the endpoint the frontend calls (method, route, request shape) and the
DTO fields it consumes, with types and nullability, in the JSON naming the frontend's fromJson will
read. Nothing about entities, EF, migrations, storage, or how the aggregate is computed — those are
the backend agent's decisions. If no backend change was needed, do not create the file; say so.

Run `npm run type-check` (baseline 72, all app-side in src/core — src/_common is a git submodule and
must not be edited) and `npm run lint` (0 errors).
```
