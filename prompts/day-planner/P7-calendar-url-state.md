# P7 · Put the calendar view's state in the URL

- **Scope:** `view/PlannerCalendarView.vue`, `composable/useCalendarModes.ts`
- **Backend:** no
- **Model / effort:** Sonnet 5, low–medium effort — well-bounded, one file plus one composable
- **Why:** CLAUDE.md requires filterable/bookmarkable state in query params. This view has none.

---

```
src/core/dayPlanner/view/PlannerCalendarView.vue holds all of its state in plain refs. Reload
/day-planner and you are thrown back to the current month with every mode cleared. CLAUDE.md
requires filterable/bookmarkable state — month, mode, selection — to live in vue-router query params.

WHAT MUST ROUND-TRIP
- The displayed month/date range. It currently arrives only via CalendarGrid's @dateRangeChange into
  a local `dateRange` ref, so the grid is the source of truth and nothing outside it knows the month.
  Decide the direction explicitly: the URL should drive CalendarGrid's initial range, and
  @dateRangeChange should write back. Note CalendarGrid lives in src/_common (submodule, must not be
  edited) — if it cannot accept an initial range, do the app-side workaround AND record the gap in
  migration-revision.md with the upstream ask.
- The active mode. src/core/dayPlanner/composable/useCalendarModes.ts holds three mutually exclusive
  booleans (isBulkSelectMode / isEditDetailsMode / isApplyTemplateMode) whose three toggle functions
  each manually clear the other two. That is a single enum wearing three hats — model it as one
  `mode: 'none' | 'bulkSelect' | 'editDetails' | 'applyTemplate'`, which makes both the mutual
  exclusion and the URL encoding fall out for free. The toggles' extra side effects (clearing
  selectedDayIds, resetting applyTemplateId / applyPreviewMode) must be preserved exactly — read
  them carefully, they are not symmetric between the three.
- applyTemplateId and applyPreviewMode when apply-template mode is active.

WHAT MUST NOT
- selectedDayIds. Calendar ids are only meaningful against a loaded range, and a shared link with
  stale ids is worse than an empty selection. Say so in your summary rather than shipping it silently.

ENCODING RULES
Absent, not empty: default values (mode none, previewMode true, no template) must produce no query
param at all. Use router.replace for state changes so the browser back button still walks days and
months rather than mode toggles.

INTERACTION WITH SETTINGS — read this before writing
onMounted currently seeds applyTemplateId / applyConflictResolution / applyPreviewMode from
useDayPlannerSettingsStore's defaults, AFTER an await. A URL param must win over the stored default,
and the async ordering makes that easy to get wrong — a settings load that resolves late will
clobber a param that was applied early. Handle it deliberately and verify with a hard reload on a
URL that sets a non-default template.

Any new user-facing string goes through vue-i18n into _locales/dayPlanner.{sk,en}.ts (SK primary).

VERIFY: hard-reload /day-planner with each mode in the URL and confirm the view comes back in that
mode on that month; confirm back/forward still navigates months; confirm the default state produces
a clean /day-planner with no query string.

Run `npm run type-check` (baseline 72, all app-side in src/core) and `npm run lint` (0 errors).
```
