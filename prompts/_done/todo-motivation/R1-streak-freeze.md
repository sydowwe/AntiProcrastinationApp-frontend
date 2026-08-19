# R1 · Streak freeze / flexible streaks

- **Scope:** routine todo list
- **Backend:** yes — streak rules are server-side; expect a stop-and-report
- **Model / effort:** Sonnet 5, medium effort for the investigation and spec; escalate to Opus 5 once the backend lands and the heatmap's third state needs designing
- **Research:** goal flexibility / "emergency reserves" — Scott & Nowlis (2013); all-or-nothing goal collapse

---

```
Make routine streaks survive a single miss. All-or-nothing streaks collapse permanently on
the first break and take engagement with them; research on goal flexibility and "emergency
reserves" (Scott & Nowlis 2013) shows a small built-in allowance sustains long-run adherence
better than a rigid rule.

Current state: RoutineTodoListItemEntity
(src/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts) carries
`streak`, `bestStreak` and `lastCompletedAt`. Streak breakage is computed backend-side.
Display lives in component/routine/RoutineGroupStats.vue,
RoutineGroupHeatmap.vue and PersonalBestsPanel.vue.

Target behaviour: each routine gets a small budget of skips per period (e.g. 1 per month)
that preserve the streak. A frozen day renders as a distinct third state in the heatmap —
neither completed nor missed.

This requires backend support: the streak rule and the freeze budget are server-side
concerns. Read src/core/todoList/api/routineTodoListApi.ts to inventory what exists. Never
fake a freeze client-side; a streak that lies is worse than a strict one.

Once available: show "1 skip left this month" next to the streak, and let a missed day be
retroactively covered from the budget rather than requiring foresight.

FINALLY — since the streak rule lives server-side, do whatever frontend work stands on its
own first (the heatmap's third visual state, the skips-remaining display behind a
placeholder, DTO fields, locales) and then write the backend ask to
prompts/todo-motivation/backend/R1-backend.md.

CONTRACT ONLY. That file states just two things: the endpoint the frontend needs to spend a
freeze on a day (method, route, request shape), and the DTO fields it consumes — the
freeze budget on the routine item and the third day-state in the history the heatmap reads —
with types and nullability, in the JSON naming the frontend fromJson will read.

One line of intent is enough for context: a freeze preserves the streak across a missed day.
Do NOT specify entities, EF or migrations, how the streak is recalculated, when the budget
refills, what happens when it is exhausted, or whether a freeze counts toward completion
rate. Those are the backend agent's decisions. Write what the frontend consumes, nothing
about how it is produced.
```
