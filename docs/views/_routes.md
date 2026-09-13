# Route manifest

> Compiled 2026-09-09 from the route tables at commit `acd7db0d`. Nav column cross-checked against the
> rendered sidebar and user menu captured in [`_shell.md`](_shell.md).

**53 route records** (52 views + 1 redirect) composed in `src/router.ts`. This file is the manifest the view
documentation pass is measured against: every route below must appear in some `docs/views/*.inventory.md`.

## Legend

- **Guard** — `public` = `meta.public`, reachable signed out · `auth` = default, signed-in only ·
  `admin` = `meta.requiredRole: 'admin'`, which **this app always waves through** (its auth adapter answers
  `true` to every role getter — see `src/core/user/authAdapter.ts`), so admin routes are reachable by anyone
- **Nav** — `sidebar` (with its path in the tree) · `user menu` · `link` (reached only from another view) ·
  `—` (no in-app entry point found)
- **Unit** — the documentation unit that owns it, per `prompts/view-docs/README.md`

---

## App modules (`src/core/`)

| Route | Name | View | Guard | Nav | Unit |
| --- | --- | --- | --- | --- | --- |
| `/` | `home` | `HomeView` | auth | sidebar › Home | 1 `home` |
| `/activity-settings` | — | *redirect → `/activity-settings/activities`* | auth | — | 2 `activity-settings` |
| `/activity-settings/:tab(activities\|roles\|categories)` | `activitySettings` | `ActivitySettingsView` | auth | sidebar › Activity settings (**`activities` tab only**) | 2 `activity-settings` |
| `/activity-history` | `activityHistory` | `HistorySummaryView` | auth | sidebar › History › Summary | 3 `history-review` |
| `/activity-history/calendar` | `activityHistoryCalendar` | `HistoryCalendarView` | auth | sidebar › History › Calendar | 3 `history-review` |
| `/activity-history/detail` | `activityHistoryDetail` | `HistoryDetailView` | auth | **—** ⚠️ | 3 `history-review` |
| `/activity-history/stopwatch` | `stopwatch` | `StopWatchView` | auth | sidebar › Record activity › Stopwatch | 4 `history-capture` |
| `/activity-history/timer` | `timer` | `TimerView` | auth | sidebar › Record activity › Timer | 4 `history-capture` |
| `/activity-history/pomodoro` | `pomodoroTimer` | `PomodoroTimerView` ⚠️ | auth | sidebar › Record activity › Pomodoro timer | 4 `history-capture` |
| `/activity-history/manual` | `activityHistoryManual` | `AddActivityManuallyView` | auth | sidebar › Record activity › Manually | 4 `history-capture` |
| `/activity-tracking` | `activityTracking` | `ActivityDashboard` | auth | sidebar › Web tracking › Web tracking | 5 `tracking-dashboards` |
| `/activity-tracking/unified` | `unifiedActivityDashboard` | `UnifiedActivityDashboard` | auth | sidebar › Web tracking › All sources | 5 `tracking-dashboards` |
| `/activity-tracking/desktop` | `desktopActivityDashboard` | `DesktopActivityDashboard` | auth | sidebar › Web tracking › Desktop tracking | 5 `tracking-dashboards` |
| `/activity-tracking/android` | `androidActivityDashboard` | `AndroidActivityDashboard` | auth | sidebar › Web tracking › Android tracking | 5 `tracking-dashboards` |
| `/activity-tracking/desktop/settings/:tableView` | `desktopSettings` | `DesktopSettingsView` | auth | sidebar › Web tracking › Desktop settings (`distinctEntries`) | 6 `tracking-settings` |
| `/activity-tracking/android/settings/:tableView` | `androidSettings` | `AndroidSettingsView` | auth | sidebar › Web tracking › Android settings (`distinctEntries`) | 6 `tracking-settings` |
| `/day-planner` | `plannerCalendar` | `PlannerCalendarView` | auth | sidebar › Task planner › Day planner | 7 `planner-day` |
| `/day-planner/:date` | `dayPlanner` | `DayPlannerView` | auth | link (from the calendar) | 7 `planner-day` |
| `/day-planner/task/:id(\d+)` | `dayPlannerTask` | `PlannerTaskLinkView` | auth | link (deep link — resolves a task id to its dated planner URL) | 7 `planner-day` |
| `/day-planner/settings` | `dayPlannerSettings` | `DayPlannerSettingsView` | auth | sidebar › Task planner › Planner settings | 7 `planner-day` |
| `/day-planner/templates` | `dayPlannerTemplateList` | `TemplateListView` | auth | sidebar › Task planner › Day planner - template | 8 `planner-templates` |
| `/day-planner/templates/split` | `dayPlannerTemplateSplit` | `TemplateSplitView` | auth | **—** ⚠️ | 8 `planner-templates` |
| `/day-planner/templates/:templateId` | `dayPlannerTemplate` | `TemplateDayPlannerView` | auth | link (from the template list) | 8 `planner-templates` |
| `/todo-list` | `toDoList` | `TodoListsView` | auth | sidebar › To-do list › To-do list | 9 `todo-lists` |
| `/todo-list/:id` | `toDoListDetail` | `TodoListView` | auth | link (from the list) | 9 `todo-lists` |
| `/routine-todo-list` | `routineToDoList` | `RoutineToDoListView` | auth | sidebar › To-do list › Routine | 10 `todo-routine` |
| `/routine-settings` | `routineSettings` | `RoutineSettingsView` | auth | **—** ⚠️ | 10 `todo-routine` |
| `/leisure/pick` | `leisurePicker` | `PickerView` | auth | sidebar › Leisure › What should I do? | 11 `leisure-backlog-picker` |
| `/leisure/backlog` | `leisureBacklog` | `BacklogView` | auth | sidebar › Leisure › Backlog | 11 `leisure-backlog-picker` |
| `/leisure/bucket-list` | `leisureBucketList` | `BucketListView` | auth | sidebar › Leisure › Bucket list | 12 `leisure-bucket-anchors` |
| `/leisure/memory-anchors` | `leisureMemoryAnchors` | `MemoryAnchorsView` | auth | sidebar › Leisure › Memory anchors | 12 `leisure-bucket-anchors` |
| `/leisure/projects` | `leisureProjects` | `ProjectsView` | auth | sidebar › Leisure › Projects | 13 `leisure-projects` |
| `/user/settings` | `userSettings` | `UserSettingsView` (app wrapper) | auth | user menu › User settings | 14 `user-settings` |
| `/legal/terms` | `legalTerms` | `TermsView` | **public** | link (registration checkbox, by route *name*) | 14 `user-settings` |
| `/legal/privacy` | `legalPrivacy` | `PrivacyPolicyView` | **public** | link (registration checkbox, by route *name*) | 14 `user-settings` |
| `/google-calendar/callback` | `googleCalendarCallback` | `GoogleCalendarCallbackView` | auth | external (Google OAuth redirect) | 14 `user-settings` |

## Framework modules (`src/_common/modules/`)

Findings against these are **submodule** issues — fixes are commits in `vue_framework` plus a pointer bump.

| Route | Name | View | Guard | Nav | Unit |
| --- | --- | --- | --- | --- | --- |
| `/login` | `login` | `LoginView` | **public** + recaptcha | redirect target of the auth guard | 15 `auth` |
| `/registration` | `registration` | `RegistrationView` | **public** + recaptcha | link (from login) | 15 `auth` |
| `/forgotten-password` | `forgottenPassword` | `ForgottenPasswordView` | **public** + recaptcha | link (from login) | 15 `auth` |
| `/confirm-email` | `confirmEmail` | `ConfirmEmailView` | **public** + recaptcha | external (e-mail link) | 15 `auth` |
| `/confirm-email-change` | `confirmEmailChange` | `ConfirmEmailChangeView` | **public** + recaptcha | external (e-mail link) | 15 `auth` |
| `/pripomienky/moje` | `myReminders` | `MyRemindersView` | auth | user menu › My reminders (**deliberately not in the sidebar** — `navItems.ts:74`) | 16 `reminders-user` |
| `/pripomienky/register` | `reminderDefinitions` | `ReminderDefinitionsView` | admin | sidebar › Reminders › Reminder register | 17 `reminders-admin` |
| `/pripomienky/register/:id(\d+)` | `reminderDefinitionDetail` | `ReminderDefinitionDetailView` | admin | link (from the register) | 17 `reminders-admin` |
| `/pripomienky/nadchadzajuce` | `reminderUpcoming` | `ReminderUpcomingView` | admin | sidebar › Reminders › Upcoming | 17 `reminders-admin` |
| `/pripomienky/historia` | `reminderDispatchHistory` | `ReminderDispatchHistoryView` | admin | sidebar › Reminders › Dispatch history | 17 `reminders-admin` |
| `/pripomienky/prehlad` | `reminderOverview` | `ReminderOverviewView` | admin | sidebar › Reminders › Overview | 17 `reminders-admin` |
| `/notifikacie` | `notifications` | `NotificationsView` | auth | user menu › Notifications; bell › "See all" | 18 `notifications` |
| `/nastavenia/pripomienky` | `reminderPreferences` | `ReminderPreferencesView` | auth | user menu › Notifications & reminders | 18 `notifications` |
| `/planovac/ulohy` | `schedulerJobs` | `SchedulerJobsView` | admin | sidebar › Job scheduler › Scheduled jobs | 19 `scheduler` |
| `/planovac/ulohy/:id(\d+)` | `schedulerJobDetail` | `SchedulerJobDetailView` | admin | link (from the jobs table) | 19 `scheduler` |
| `/planovac/behy/:id(\d+)` | `schedulerRunDetail` | `SchedulerRunDetailView` | admin | link (from a job's runs) | 19 `scheduler` |
| `/planovac/pozornost` | `schedulerNeedsAttention` | `SchedulerNeedsAttentionView` | admin | sidebar › Job scheduler › Needs attention | 19 `scheduler` |

> Scheduler paths are this app's Slovak overrides, declared in `src/router.ts` (`APP_SCHEDULER_PATHS`). The
> route **names** are the module's contract and never change — `navItems.ts` and the breadcrumb fixes resolve
> them by name, so renaming a route here breaks those links while changing a path does not.

---

## ⚠️ Orphan candidates — no nav entry, and not a param/detail route

These four are reachable only by typing the URL, as far as the route tables and the rendered nav show. Each is
either dead, or reachable from a control inside another view that this pass has not documented yet. **The unit
that owns each one must resolve which**, and record the answer in its inventory.

| Route | View | Note |
| --- | --- | --- |
| `/activity-history/detail` | `HistoryDetailView` | Sits between Summary and Calendar in the module but is linked from neither in the nav. Likely a drill-down target — `prompts/_done/activity-history/H6-url-state-and-drilldown.md` is about exactly this, so unit 3 should check whether the drill-down actually links here. |
| `/day-planner/templates/split` | `TemplateSplitView` | `prompts/_done/day-planner/P1-split-view-dead.md` is literally titled "split view dead". Unit 8 must confirm whether that prompt's fix landed or the view is still unreachable. |
| `/routine-settings` | `RoutineSettingsView` | Every other settings page is linked from `/user/settings` via `ModuleSettingsSection`. Unit 10 should check it is listed there — CLAUDE.md requires *every* settings page to be reachable from `/user/settings`. |
| `/day-planner/settings` | `DayPlannerSettingsView` | Has a sidebar entry, so not an orphan — but same `ModuleSettingsSection` check applies. |

## Structural notes

- **`PomodoroTimerView` is routed from `component/`, not `view/`** (`src/core/activityHistory/component/PomodoroTimerView.vue`). Every other routed component lives in a `view/` directory. Structure oddity; not necessarily a defect.
- **The framework's `TermsAndConditionsView.vue` is not routed by this app.** Expected orphan: the app routes its own `TermsView` because the framework's copy is placeholder text baked into the template rather than locale-driven. Documented in `src/core/user/user.routes.ts`. Do not re-report it.
- **`/day-planner/:date` vs `/day-planner/templates`** — declared with `:date` first, but vue-router ranks static segments above params, so `/day-planner/templates` still wins. Not a bug; noted because the declaration order invites the opposite conclusion.
- **`meta.requiredRole: 'admin'` is a no-op *client-side*.** Ten routes carry it (all of `reminders-admin` and `scheduler`). This app has no role model, so the guard always passes and the views mount for any signed-in user — it exists so the framework modules stay unmodified. **The server is not a no-op, and the two disagree:** the five `reminders-admin` routes really do require Admin (confirmed 2026-09-13, `B4`), so an ordinary account mounts the view and then gets 403 on its data; the five `scheduler` routes are open to any signed-in user in this host. `GET /api/user/data` returns no `roles` field, so the client has nothing to route on — do not "fix" the adapter by guessing.
- **`/activity-settings` is the only redirect** in the table.

## Coverage tracker

| Unit | Routes | Inventory written? |
| --- | --- | --- |
| 1 `home` | 1 | ☑ |
| 2 `activity-settings` | 2 (incl. redirect; 3 tab values) | ☐ |
| 3 `history-review` | 3 | ☐ |
| 4 `history-capture` | 4 | ☐ |
| 5 `tracking-dashboards` | 4 | ☐ |
| 6 `tracking-settings` | 2 | ☐ |
| 7 `planner-day` | 4 | ☐ |
| 8 `planner-templates` | 3 | ☐ |
| 9 `todo-lists` | 2 | ☑ |
| 10 `todo-routine` | 2 | ☑ |
| 11 `leisure-backlog-picker` | 2 | ☐ |
| 12 `leisure-bucket-anchors` | 2 | ☐ |
| 13 `leisure-projects` | 1 | ☐ |
| 14 `user-settings` | 4 | ☐ |
| 15 `auth` | 5 | ☐ |
| 16 `reminders-user` | 1 | ☐ |
| 17 `reminders-admin` | 5 | ☐ |
| 18 `notifications` | 2 | ☐ |
| 19 `scheduler` | 4 | ☐ |
| **Total** | **53** | |
