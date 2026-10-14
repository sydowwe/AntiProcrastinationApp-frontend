# C1 · Why I skip things — spend the skip reason

- **Scope:** `dayPlanner` (the day's plan-vs-actual block and the calendar's trend line), with `home` as the second writer of the data
- **Backend:** likely. Nothing returns skipped tasks over a date range today. See the escalation block.
- **Model / effort:** Opus 5.5, high. The code is small. The judgment is whether a sentence about the user's skips reads as a pattern worth knowing or as a
  list of their excuses.
- **Research:** Buehler, Griffin & Ross (1994), the same source `DayPlannerPlanVsActualBlock.vue` already cites: people correct their plans from seeing their own
  past drift, not from being told to add a buffer. A skip *reason* is the half of that drift the app currently throws away.

---

```
Every time a user skips a planned task, the app asks them why — and then shows that answer exactly
once, on the one task, and never again. The reason is stored (B26, landed 2026-09-22) but nothing
aggregates it. Your job is to turn "you skipped 7 things this month" into the one pattern the user
would not have noticed on their own, without turning it into a list of their failures.

Line numbers below are as of commit 5e6c4ab7 (2026-09-27). Verify each claim before building on it —
docs in this repo have gone stale before.

--- What exists today ---

WRITING the reason (two writers, two vocabularies):
  - Home: TaskActionMenu.vue:72-74 offers three built-in reasons, keys home.skipReason.{noTime,
    notRelevant,noEnergy} in src/core/home/_locales/home.{sk,en}.ts, and sends the TRANSLATED TEXT
    ("Ran out of time"), not the key.
  - Day planner: SkipReasonForm.vue — a free-text VTextarea, with the user's own
    predefinedSkipReasons (planner settings, dayPlannerSettingsStore.ts:26) offered as one-tap chips
    that fill it. DayPlannerView.vue:454 handleSkip sends it through plannerTaskApi's patchStatus.
  - Both go to PATCH /api/planner-task/{id}/status with { status: 'cancelled', skipReason }.
    Server rules (prompts/view-docs/backend/_done/B26-*.md, "Backend response"): free text, trimmed,
    blank → null, ≤ 500 chars, only ever on a Cancelled task, cleared when the task leaves Cancelled.
    Not validated against any vocabulary. Keys for the built-ins were explicitly left as "a
    separate ask".

READING it:
  - PlannerTask.skipReason (dto/response/PlannerTask.ts:28), per task, from
    GET /api/calendar/day-plan/{date}.
  - Shown on the home widget only (DayPlannerWidget.vue:246-250, "Skipped: <reason>").
  - The day planner's own plan-vs-actual block (component/normal/DayPlannerPlanVsActualBlock.vue)
    and the calendar's trend line (component/calendar/PlanVsActualTrendLine.vue) say nothing about
    skips at all. The trend endpoint, POST planner-task/plan-vs-actual-trend
    (PlanVsActualTrend.ts), EXCLUDES Cancelled tasks from taskCount entirely (:39) — a skipped task
    is invisible to it by design.

So three facts shape this task:
  1. The data is free text. The same reason arrives as "Ran out of time" and "Nestihol som"
     depending on the locale at skip time, and as "tired", "Tired", "too tired" from the textarea.
  2. A reason can be null (the user skipped without saying why). That is a real answer, not missing
     data — do not hide it and do not nag about it.
  3. The single-day view already has every skipped task of that day in its store. A range does not.

--- What to build ---

Read DayPlannerPlanVsActualBlock.vue and PlanVsActualTrendLine.vue in full first, including their
header comments. They set the tone rules this feature must inherit: descriptive only, no colour that
changes with the value, no warning icon, no percentage that can't be honestly computed, rendered as
NOTHING rather than as a zeroed card. The skip surface lives beside them, not as a new section.

A. SINGLE DAY — buildable now, no backend.
   Once the viewed day is materially over (the same condition usePlanVsActual already uses — reuse
   it, do not write a second one), the block may add one line about that day's skips: how many, and
   the reasons if any were given. Everything is in the day planner store already.

B. RANGE — the part worth building, and the part that likely needs the backend.
   On the calendar, beside the trend line, at most ONE or TWO sentences over the visible range.
   Candidates, pick by what the data honestly supports:
     - the most common reason, with its count, once it has recurred (e.g. 3+ times)
     - a pattern in WHEN skips happen (time of day of the planned slot, weekday) — a user who skips
       most things planned after 20:00 learns something about their planning, not their character
     - a pattern in WHAT gets skipped (the same activity skipped repeatedly)
   Each needs a minimum-data threshold below which it is not shown at all — not shown with a hedge.
   Say in your report which candidates you rejected and why; that list is part of the deliverable.

   Do NOT compute a range client-side by fetching day-plan once per day of the month. That is 30+
   requests to answer one question, and it is exactly the approximation the backend README forbids.

C. GROUPING free text.
   Decide how reasons are grouped for counting, and write the decision down in a code comment:
     - exact match after trim + case-fold is the floor;
     - the three home built-ins are known strings in both locales, so they can be recognised and
       merged across SK/EN — or, better, see the escalation block about sending keys;
     - do NOT attempt fuzzy matching of user free text ("tired" vs "too tired"). A wrong merge puts
       words in the user's mouth.

--- Tone — non-negotiable ---

This app's users open it to face their own data, and many are here because they feel bad about how
they spend time. So:
  - State the pattern, not the verdict. "Most skips this month: No energy for it (5)" — not "You
    skipped 5 tasks because you were lazy", not "only", not "again".
  - No scoring, no trend arrow on skips, no red. A skip is a legitimate decision (renegotiating a
    plan is the healthy response to an unrealistic one — see prompts/_done/todo-motivation/
    N2-defuse-overdue.md for the same stance on overdue items).
  - Actionable if possible: the time-of-day pattern implies "plan less late in the day"; a bare count
    implies nothing. Prefer the sentence that implies a change to the plan.
  - SK is primary. Plurals through vue-i18n's pluralization (the existing
    planner.planVsActual.* keys show the pattern), numbers and names interpolated, never
    concatenated.

--- Do NOT ---
  - add a skip-reason settings screen, a "why do you skip?" prompt, or a required reason field;
  - add a chart — one or two sentences only;
  - add an LLM call or anything "AI summary";
  - change what the home widget or the skip dialog SEND (unless you take the key route in the ask,
    and then only after the backend has answered).

--- Verification ---

npm run type-check (baseline 0 — any error is a regression; check the exit code) and npm run lint.
Then with playwright-cli (-s=c1, state-load e2e/.state/auth-10001.json, reload, state-save back):
  - Skip three tasks on a past day with the same reason, one with none. The day block shows the line;
    the counts match what you did. Restore one: the line updates after the refetch.
  - A day with no skips shows nothing new — no empty line, no "0 skipped".
  - Switch the account to SK: the sentence is Slovak, and a reason entered in EN is still shown
    as entered (it is the user's text).
  - For B, below threshold → nothing rendered.
Clean up every task you touched, or reseed.

--- After the frontend work is done: write the backend ask, IF you found one ---

The likely one is a range aggregate for skipped tasks. Before writing it, read the trend endpoint in
the API (search AdhdTimeOrganizer.Planning for plan-vs-actual-trend) and decide whether the ask is
"extend that response" or "a sibling endpoint" — say which you prefer and why, but the shape is the
backend's call.

What the frontend needs, roughly: over a from/until range (same filter as PlanVsActualTrendFilter,
same "only days strictly before the user's today" rule), the skipped tasks grouped by reason
(null as its own group), with counts, and whatever per-task attributes your chosen patterns need
(planned start time, activity id). State nullability. State the minimum you actually render.

Second question worth putting in the same ask: whether the three built-in reasons should be sent
and stored as stable keys, with free text only for the user's own. B26 left this open ("Keys would be
a separate ask"). Without it, grouping across a locale switch is a string-matching hack. If you ask,
state the rule for existing rows that already hold translated text.

Write it to prompts/captured-data/backend/Bn-<slug>.md per prompts/captured-data/backend/README.md.
If the existing API already answers the range question, do not write an ask — say so instead.
```
