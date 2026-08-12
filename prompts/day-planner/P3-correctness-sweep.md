# P3 · Correctness sweep — timezone, stuck loader, silent failures

- **Scope:** `dto/response/Calendar.ts`, `view/PlannerCalendarView.vue`, `view/DayPlannerView.vue`, `dto/response/PlannerTask.ts`
- **Backend:** no
- **Model / effort:** Sonnet 5, medium effort — each defect is small and independently verifiable
- **Note:** these are separate defects deliberately batched; they share no code, so a partial result is still useful

---

```
Four confirmed defects in src/core/dayPlanner. They are independent — fix all four, and if one
turns out to be intentional, say so and leave it rather than forcing a change.

1. Calendar.isToday is computed in UTC
src/core/dayPlanner/dto/response/Calendar.ts:
    get isToday() { return this.date === new Date().toISOString().slice(0, 10) }
`date` is a local calendar date (DateOnly from the backend), but toISOString() converts to UTC
first. This app's primary locale is Slovak — UTC+1 in winter, UTC+2 in summer — so between local
midnight and 01:00 or 02:00, isToday marks YESTERDAY as today and today as not-today. The "today"
highlight in the calendar grid is silently wrong every night.

Compare local calendar dates instead. src/_common/utils/DateTimeHelper.ts already has the helpers
(formatDateForApi, isSameDay, …) — use one rather than hand-rolling. Then grep the module for other
uses of toISOString().slice(0, 10) or getTimezoneOffset and fix the same mistake wherever it repeats.
Verify by temporarily setting the OS or browser timezone forward and reloading the calendar view.

2. PlannerCalendarView leaks the full-screen loader
view/PlannerCalendarView.vue:113 destructures only `showFullScreenLoading` and calls it at line 165
in onMounted. There is no hideFullScreenLoading anywhere in the file. It currently clears only
because src/_common/composable/general/LoadingComposable.ts exposes axiosSuccessLoadingHide and the
axios interceptor hides the overlay on the next successful response. So the overlay stays up
indefinitely if the awaited work throws, or if fetchAllTemplates resolves from cache without a
successful request landing.

Make the lifetime explicit: wrap the onMounted body so the loader is hidden in a finally. Do the
same audit for view/TemplateDayPlannerView.vue:236 (`if (!isSplitView) showFullScreenLoading()` —
also never paired) and for view/DayPlannerView.vue:368 inside applyTemplate, which shows the loader
and only hides it on the unrelated date-change watcher path. DayPlannerView's date watcher
(524/534) is the one correct example in the module — match it.

3. Failed status patches revert the task but tell the user nothing
view/DayPlannerView.vue handleStatusChange and handleChangeStatusOnSelected both do:
    await patchStatus(id, req).catch(() => { task.status = previousStatus })
The rollback is right; the silence is not. The block visibly snaps back to its old status with no
explanation. Surface a failure — useSnackbar()'s showErrorSnackbar, or let the axios interceptor's
own error snackbar through instead of swallowing it (check whether patchStatus passes _silent).
In the batched case, report how many of N failed rather than one snackbar per rejection.

Same pattern in handleSkip and handleReschedule: both fire Promise.all over per-task requests, and
handleReschedule then unconditionally removes every selected task from store.tasks and shows
"Tasks rescheduled" — even if some updates rejected, in which case the tasks vanish from the current
day while still living on the server under the old calendar. Use Promise.allSettled, keep the failed
ids in place, and report the partial outcome honestly.

4. PlannerTask.listFromJsonList breaks the DTO convention
CLAUDE.md requires response DTOs to expose `static fromJson` plus `static listFromObjects`. Every
other response DTO in this module follows it (RepeatingPlannerTask, SuggestionResponse,
TaskImportance, TemplateSuggestionResponse). PlannerTask.ts:90 calls it `listFromJsonList`. Rename
it and update every call site. Low value on its own — do it last, and only if the rename is clean.

Strings you add must go through vue-i18n into
src/core/dayPlanner/_locales/dayPlanner.{sk,en}.ts (SK is primary, EN is the fallback). If P4
(localization) has already run, follow the key structure it established rather than inventing one.

Run `npm run type-check` (baseline 72, all app-side in src/core — do not add to it, and nothing new
in src/_common) and `npm run lint` (0 errors).
```
