# C4 · Routine suggested-day nudges — spend `suggestedDays` / `suggestedDayOfMonth`

- **Scope:** `todoList` (routine list) + the notifications registration in `src/app/notifications/`, with `home` already a consumer
- **Backend:** yes, for the push half. A new notification type is a producer change. The in-app half needs none.
- **Model / effort:** Sonnet 5, medium–high. Three pieces in three places, and the reminder-preference ownership rule in `CLAUDE.md` decides one of them.

---

```
A routine item can say which day it is meant for: "gym — Tuesday, Thursday" on a weekly routine,
"pay rent — the 3rd" on a monthly one. The user sets that on every weekly/monthly item. Today it
does two things: a small chip on the row, and a filter on the home widget. It never nudges. On
Tuesday, the routine list looks exactly like it does on Monday, and no notification says
"Tuesday's gym is today".

Line numbers below are as of commit 5e6c4ab7 (2026-09-27). Verify each before relying on it.

--- What exists today ---

The data:
  - RoutineTodoListItemEntity.suggestedDays (DayOfWeek[]) and .suggestedDayOfMonth (number | null)
    — dto/response/routine/RoutineTodoListItemEntity.ts. Set in
    component/routine/dialog/RoutineToDoListForm.vue:39-49, which shows one or the other depending
    on the item's timePeriod.lengthInDays.
  - The rule for which field applies lives in ONE place, in the wrong module:
    src/core/home/component/RoutineTodoWidget.vue:173-182, isSuggestedForToday():
      lengthInDays === 1  → every day
      lengthInDays > 14   → suggestedDayOfMonth === today's day of month
      otherwise           → suggestedDays includes today's weekday
    It reads "today" from the dashboard's todayDate signal (useDashboardRefresh), not new Date(),
    because the tab is left open overnight. Read the comment at :167-169.

The surfaces:
  - Home: filters each routine group to today's items, "+N not due today" for the rest.
  - Routine list (view/RoutineToDoListView.vue, item component/routine/RoutineTodoListItem.vue:54-69):
    chips only. No emphasis on today's items, no ordering by it.

Notifications:
  - Three routine types exist, all PERIOD-level: RoutinePeriodEndingSoon, RoutinePeriodEnded,
    RoutineStreakGraceExpiring (src/app/notifications/notificationTypeMeta.ts:51-67). Producer:
    AdhdTimeOrganizer.Routines/application/service/RoutinePeriodNotificationService.cs in the API
    (C:\Users\jakub\RiderProjects\AdhdTimeOrganizer, read-only for you).
  - Their subject is { kind: 'routinePeriod', id } → /routine-todo-list?focus=<periodId>
    (public/notification-subject-routes.js:55, RoutineToDoListView.vue:203-227). There is no
    per-item subject kind.
  - An unregistered notification type still renders, as a grey bell with no filter row — the
    TimerBoundary comment (notificationTypeMeta.ts:84-99) explains why that went unnoticed for
    months. A new type must be registered here.

--- What to build ---

A. MOVE THE RULE (no backend). isSuggestedForToday belongs to todoList, next to the entity: a pure
   function taking the item and a date (today's weekday and day-of-month resolved in the user's
   timezone by the caller). RoutineTodoWidget imports it from todoList (home rendering todoList is
   the documented exception). Unit-test it, including a monthly item on a 31st in a 30-day month —
   decide what "the 31st" means in September and write it down; do not silently skip the month.

B. IN-APP NUDGE (no backend). On the routine list, make today's suggested, not-yet-done items
   noticeable: a quiet "Today" marker, or sorting today's first within the group — pick one, not both,
   and keep the drag-to-reorder mode working (reorder is custom order; an automatic sort must not
   fight it — see how the normal list makes reorder mutually exclusive with non-custom sorts).
   "Today" must roll over at the user's midnight while the page is open.

C. PUSH NUDGE (backend). A once-a-day notification listing the routine items suggested for today
   that are not done yet. Settle these BEFORE writing the ask, and put the answers in it as rules:
     - Daily routines are excluded — they are suggested every day by definition; a daily push about
       them is noise.
     - One digest per user per day, not one push per item.
     - Nothing is sent if nothing qualifies.
     - When in the day, in the user's timezone. Is there an existing per-user "morning" time
       anywhere (planner settings' default wake time is a candidate — check)? Prefer that to a new
       setting.
     - Whether a suggested day that passed undone ("Tuesday's gym, still open on Wednesday") is
       mentioned the next day, or never. Recommendation: never — the period-level EndingSoon already
       covers "you are running out of time", and a daily reminder of yesterday is a guilt feed.
   Muting and channel choice: per CLAUDE.md "Where a preference lives", anything about whether/how a
   notification reaches the user belongs to reminder preferences, keyed (ownerModule, kind). Do NOT
   add a toggle to routine settings. Check how the existing three routine types appear in the
   reminder-preference list (src/_common/modules/notifications/reminderPreference/) and make the new
   one appear the same way.
   Frontend half, once the type exists: an entry in notificationTypeMeta.ts (icon, colour, route);
   reminderLabels for its kind if the list needs one. Deep link: the period subject is fine if the
   digest spans one period; if it spans several, land on the plain route. Do NOT invent a
   per-item subject kind client-side — the kind vocabulary is the server's (append-only; unknown
   kinds fall back to the type route).

--- Do NOT ---
  - add reminders to the normal (non-routine) to-do list — different feature;
  - touch streak or completion logic;
  - use new Date() for "today" anywhere in this — use the user clock (useUserClock /
    isoDateInUserZone, or the home dashboard's todayDate where you are inside home).

--- Verification ---

npm run type-check (baseline 0; check the exit code), npm run lint, and the unit tests for A.
playwright-cli -s=c4 (state-load → reload → state-save):
  - A weekly item suggested for today's weekday is marked on /routine-todo-list; one suggested for
    another day is not; a done one is not.
  - Home still shows exactly what it showed before A (same items, same "+N not due today").
  - Switch the account timezone to one where it is already tomorrow: the marker follows the
    account's day, not the browser's.
Once the backend lands: trigger the digest (ask the backend how to run the job on demand, or read
the scheduler admin screen — schedulerRoutes are routed in this app), confirm one notification, the
right items, the right click-through, and that muting its kind in reminder preferences stops it.

--- After the frontend work is done: write the backend ask ---

For C only. Contract + rules: the new NotificationType member name and its payload fields (what the
notification text needs — item names, count, period ids), its subject (kind + id, or none), the
reminder-preference (ownerModule, kind) it registers under, and the rules settled above. Check
RoutineResetService in the API for the existing daily routine sweep before asking for a new one —
the ask states WHEN and WHAT, the backend decides where it runs. Remember the scheduler's cron is
Quartz (6–7 fields, seconds first, evaluated in UTC); do not write a 5-field cron into the ask, and
better, do not write a cron at all.
Write it to prompts/captured-data/backend/Bn-<slug>.md per prompts/captured-data/backend/README.md.
```
