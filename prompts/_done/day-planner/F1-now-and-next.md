# F1 · "Now / next" — make the plan answer the only question that matters

- **Scope:** `component/normal/DayPlannerHeader.vue`, one new composable, optionally `../../../src/core/home`
- **Backend:** no — everything needed is already in `store.tasks`
- **Model / effort:** **Opus 5**, high effort — small code, and the entire value is in restraint
- **Research:** Gollwitzer (1999), implementation intentions — specifying *when/where/what* roughly doubles follow-through (meta-analysis d ≈ 0.65). The gain comes
  from cueing on time, not from having a plan.

---

```
The day planner shows a whole day at once. What it never says is: what am I supposed to be doing
right now, and what is next. A plan you have to re-read and re-decide is a plan that costs
willpower every time you look at it — the implementation-intentions literature (Gollwitzer 1999,
meta-analytic d ≈ 0.65) is specifically about removing that re-decision by cueing on the clock.

Build a compact now/next indicator in src/core/dayPlanner/component/normal/DayPlannerHeader.vue.

WHAT ALREADY EXISTS — use it, do not rebuild it
- src/core/dayPlanner/composable/useCurrentTimeIndicator.ts already ticks (via _common's
  useCurrentTime), already knows whether the viewed date is today, and already maps a Time to a grid
  row. It draws the now-line. It does not know anything about tasks.
- store.tasks holds every PlannerTask for the day with startTime / endTime / status / isBackground /
  activity.name. dto/enum/PlannerTaskStatus.ts has the statuses; getPlannerTaskStatusIcon exists.
- _common/utils/formatDuration.ts has fromMinutes for the countdown text.

WHAT TO BUILD
A composable next to useCurrentTimeIndicator that derives, from store.tasks and the current time:
the task in progress now, and the next one to start with the minutes until it. Then a small
header surface that shows them.

THE JUDGEMENT CALLS — these are the point of the prompt
- Background tasks (isBackground) span the day by design. They are context, not "what I'm doing".
  Decide how they participate and say why.
- Overlapping tasks are possible in this grid. Decide which one is "now" (importance? start time?)
  and be consistent.
- A task whose window has passed but whose status is still NotStarted is not "now" and is not
  "next" — it is overdue. There is already an OverdueTasksBanner in this module; do NOT duplicate
  its job here. Read component/normal/OverdueTasksBanner.vue first and stay out of its lane.
- When the viewed date is not today, the whole surface is meaningless. Render nothing — not an
  empty state, not "no current task". useCurrentTimeIndicator's isVisible already encodes this
  check; reuse it rather than writing a second one.
- Same for a day with nothing scheduled: render nothing.

TONE AND RESTRAINT
Factual and quiet. "Teraz: Deep work · 23 min left · Next: Lunch in 40 min" — one line, no urgency
styling, no countdown that turns red, no nagging. This app is for people who procrastinate; a
timer that visibly menaces them is a reason to close the tab. If you find yourself adding a second
row or a progress ring, you have overshot.

Do not add a notification. src/core/dayPlanner/composable/useTaskReminders.ts already owns
time-based alerting and is wired to the user's reminder settings — this is a passive display only.

STRINGS go through vue-i18n into _locales/dayPlanner.{sk,en}.ts under the existing `planner`
namespace (SK is primary, EN the fallback). The "in N minutes" text needs Slovak plural forms
(1 / 2–4 / 5+), so use vue-i18n pluralization, not an interpolated number in one fixed form.

OPTIONAL, ONLY IF THE ABOVE IS CLEAN: the same composable would drive a widget on src/core/home/.
Look at what is already on that view before adding to it, and skip it if it would crowd the page.

Run `npm run type-check` (baseline 72 errors, all app-side in src/core — do not add to it, nothing
new in src/_common, which is a git submodule and must not be edited) and `npm run lint` (0 errors).
```
