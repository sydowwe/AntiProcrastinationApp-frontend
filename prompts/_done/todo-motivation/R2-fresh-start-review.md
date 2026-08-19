# R2 · Fresh-start weekly review

- **Scope:** routine todo list
- **Backend:** none — frontend only
- **Model / effort:** Sonnet 5, medium–high effort — several moving parts (week boundaries, the user's firstDayOfWeek preference, reusing TimePeriodForm) but no ambiguity in any of them
- **Research:** Dai, Milkman & Riis (2014, *Management Science*) — the fresh start effect

---

```
Add a weekly review ritual to the routine todo list, timed to temporal landmarks. Dai,
Milkman & Riis (2014, Management Science) — the "fresh start effect" — found aspirational
behaviour spikes at boundaries like Mondays and month starts, so anchor the review there
rather than on an arbitrary cadence.

Build it in src/core/todoList/view/RoutineToDoListView.vue (check
view/RoutineSettingsView.vue too): on the first visit of a new week, show a review card
summarizing last week per routine — completed vs expected — with one action per routine:
keep, reduce frequency, or pause.

Key design constraint: the point is DOWNWARD renegotiation. An over-ambitious routine that
is failed weekly is worse than a smaller one that is kept — make "reduce" as easy and
un-shameful as "keep". Frequency lives on RoutineTimePeriodEntity
(dto/response/routine/), edited via component/routine/dialog/TimePeriodForm.vue — reuse
that form, do not duplicate the editing logic.

Use the user's firstDayOfWeek preference (userStore.currentUser.askBeforeDelete /
firstDayOfWeek are merged in via src/core/user/dto/userAugmentation.ts) rather than assuming
Monday. Date helpers are loose functions in @/_common/utils/DateTimeHelper.ts (getISOWeek*,
formatLocalized) — there is no useDateTime() facade.

Dismissible, once per week, never blocking. Strings in _locales/todoList.{sk,en}.ts.
```
