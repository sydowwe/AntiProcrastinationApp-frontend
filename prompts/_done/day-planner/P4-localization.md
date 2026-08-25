# P4 · Localize the module (it is ~95% hardcoded English)

- **Scope:** every `.vue` in `../../../src/core/dayPlanner`, plus `_locales/dayPlanner.{sk,en}.ts`
- **Backend:** no
- **Model / effort:** Sonnet 5, medium–high effort — mechanically simple, large in surface, and the SK wording is a judgement call
- **Run it:** after P1–P3, before P6 (the dedup prompt moves markup between files; localizing first means moving already-keyed strings)

---

```
src/core/dayPlanner is a Slovak-primary module with an English UI. Its locale files
(_locales/dayPlanner.{sk,en}.ts) are 25 lines and cover five keys' worth of the module; exactly five
files in the whole module call t(). Everything else is a hardcoded English literal. CLAUDE.md
requires all user-facing strings to go through vue-i18n.

SCOPE: every user-visible string in src/core/dayPlanner. Find them, don't guess —
    grep -rn ">[A-Z]" --include=*.vue src/core/dayPlanner
misses plenty, so also sweep: label=, title=, placeholder=, hint=, every showSuccessSnackbar /
showErrorSnackbar argument, and every openDialog({ dialogProps: { title, confirmBtnLabel } }).
17 .vue files contain no t() call at all — start from that list.

REPRESENTATIVE SITES (not exhaustive)
- view/DayPlannerView.vue: "Change Status", "Reschedule", "Log time", "Split", dialog titles
  "Skip task" / "Reschedule tasks", confirm labels "Skip" / "Reschedule", and the snackbars
  "Task skipped" / "Tasks skipped" / "Tasks rescheduled".
- view/PlannerCalendarView.vue: toolbar "Select Days" / "Edit Details" / "Apply Template",
  "Select a template first", "Template applied", "Failed to apply template", "Failed to copy tasks".
- view/TemplateDayPlannerView.vue: "Template details", "Routine Tasks", "Details", "Routine",
  "Day Template", and the stat line "{n} tasks · {x} planned · {y} free".
- view/TemplateSplitView.vue: "Compare & Edit Templates", "Left Template", "Right Template",
  "Select a template".
- component/normal/DayPlannerProgressBlock.vue: "tasks", "planned", "free", "over capacity".

PLURALS AND INTERPOLATION ARE THE REAL WORK
Several strings are template literals with a count baked in:
    `Apply Template to ${n} day(s)`
    `Copy tasks to ${n} day(s)`
    `Template applied to ${n} day(s)`
    `Day type updated for ${n} day(s)`
    `Applied to ${x}/${y} days — ${z} failed`
    "Task skipped" vs "Tasks skipped"
The "(s)" hack does not survive translation, and Slovak has three plural forms (1 / 2–4 / 5+), not
two. Use vue-i18n pluralization (`t('key', n)` with `deň | dni | dní`-style branches) for every one
of these, including the SK forms. Do not settle for a single form with an interpolated number.

KEY STRUCTURE
Everything lives under the existing `planner` namespace in _locales/dayPlanner.{sk,en}.ts — do NOT
add a second top-level namespace. The aggregator spread in src/locales/{SK,EN}.ts is SHALLOW, so a
colliding top-level namespace replaces the other wholesale; read the comment at the top of SK.ts
before touching it. Group by surface (planner.calendar.*, planner.template.*, planner.actions.*,
planner.snackbar.*) and keep the existing planner.status.* / planner.templateSuggestions.* keys
exactly where they are — they are already referenced.

SK IS PRIMARY. Write real Slovak, matching the register already in the file ("Rýchle vytvorenie
aktivity v plánovači", "Dôležitosť"). EN is the fallback and should read as the current English does.
Both files must have identical key sets — a key present in one and missing from the other is a bug.

DO NOT
- Do not localize console messages, dev comments, enum member names, or i18n keys themselves.
- Do not touch src/_common (git submodule, must not be edited).
- Do not change any behaviour. If you find a string that is wrong or a plural that reveals a logic
  bug, note it in your summary; fix it only if the fix is one line.

VERIFY by switching the app language both ways and walking all six routes: /day-planner,
/day-planner/settings, /day-planner/:date, /day-planner/templates, /day-planner/templates/split,
/day-planner/templates/:templateId. Trigger the snackbars and dialogs, not just the static labels.
Report any string you could not reach.

Run `npm run type-check` (baseline 72, all app-side in src/core) and `npm run lint` (0 errors).
```
