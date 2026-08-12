# R3 · Rebalance rewards toward informational feedback

- **Scope:** routine todo list
- **Backend:** none — frontend only
- **Model / effort:** Opus 5, high effort — this is a classification-and-taste task, not an implementation task. The work is deciding what counts as controlling feedback and rewriting tone in two languages; a weaker model will just delete the confetti and call it done.
- **Research:** Deci, Koestner & Ryan (1999) meta-analysis, 128 experiments — tangible extrinsic rewards undermine intrinsic motivation; SDT's informational vs controlling distinction

---

```
Audit and rebalance the routine list's reward design. Deci, Koestner & Ryan's 1999
meta-analysis (128 experiments) found tangible extrinsic rewards reliably undermine
intrinsic motivation for activities people had some existing interest in. Self-determination
theory distinguishes INFORMATIONAL feedback (signals competence, supports autonomy) from
CONTROLLING feedback (points, pressure, loss framing) — the latter degrades over time,
which matters for an app meant to be used for years.

Review these, in src/core/todoList/component/routine/:
  RoutineConfetti.vue, PersonalBestsPanel.vue, RoutineGroupStats.vue, RoutineGroupHeatmap.vue

For each, classify the feedback as informational or controlling, then:
1. Keep and strengthen informational signals — completion rate over time, "you're doing this
   more often than last month", the heatmap's honest density.
2. Soften controlling ones. Specifically, check whether RoutineConfetti fires on every single
   completion; per-completion celebration habituates into meaninglessness within weeks.
   Reserve it for genuinely rare events (new personal best, a milestone), not routine ticks.
3. Reframe streak display away from loss framing ("don't break your 12-day streak") toward
   accumulated-competence framing ("12 days"). Same number, different psychological contract.
4. Add no points, XP, levels, badges or leaderboards.

Report your classification before changing anything, then apply. Frontend-only; touch no
API or DTO. Strings in _locales/todoList.{sk,en}.ts.
```
