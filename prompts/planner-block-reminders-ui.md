# Show a planner block's reminders, and mark the automatic ones (P1-03 follow-up)

> Paste into a fresh session in this repo. The backend is `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`;
> read its `AdhdTimeOrganizer.Planning/docs/summary.md` (§ reminders, audit N1) before touching the API.

## Why

Since P1-03 (backend `7ff859b`, frontend settings in the Reminders tab of the planner settings) the server
creates a reminder **by itself** for each new block that qualifies under the user's
`UserPlannerSettings.autoReminderMode` (`Off` / `ImportantOnly` / `All`). The user can see that setting, but
**never sees the reminders it makes**: this frontend has no client for the planner's `Reminder` entity at all — no
API, no DTO, no view (see the table at the bottom of `public/notification-subject-routes.js`). So a user cannot

- tell that a block has a reminder, let alone whether the planner made it or they did;
- delete the automatic one on one block they don't want reminded (the backend supports it, and a deleted
  automatic reminder is never re-created);
- edit its lead time (editing turns it into the user's own personal reminder — see below).

The only trace today is `MyRemindersView` (framework, `/pripomienky`), which lists `ReminderDefinition`s from
`my-upcoming` and labels the kind "Automatic block reminders" via `src/app/notifications/reminderLabels.ts`. That
is a different id space and not tied to the block.

## Backend facts (verified 2026-10-11)

| Route | Shape | Note |
|---|---|---|
| `GET /reminder/by-date/{date}` | `ReminderOnDateResponse[]` | the day's reminders in the user's zone; has `plannerTaskId` but **no `isAuto`** |
| `GET /reminder/{id}` | `ReminderResponse` | has `isAuto` |
| `POST /reminder` | `ReminderRequest` | create; `plannerTaskId` optional; omitted `leadOffsetsMinutes` → user's `reminderMinutesBefore` |
| `PUT /reminder/{id}` | `ReminderRequest` | **an automatic reminder that is edited becomes a personal one** (`IsAuto = false`, re-registered as `PersonalReminder`, automatic registration cancelled) |
| `DELETE /reminder/{id}` | — | an automatic reminder deleted here is never re-created by later moves or status changes |

- A task-linked reminder's `remindAt` is derived from the block's day + start time; the server rewrites it on
  every move. Never let the client compute or send a different instant for a task-linked one.
- Rules for automatic ones: created **only at block creation**, at most one per block, foreground +
  `NotStarted` + future only. A settings change never adds or removes one on an existing block.
- `ReminderOnDateResponse` needs `IsAuto` added (backend:
  `AdhdTimeOrganizer.Planning/application/dto/response/reminder/ReminderOnDateResponse.cs` and its projection in
  `GetByDateReminderEndpoint`). That is the one backend change; pin it with a row in
  `PlannedBlockAutoReminderTests`.

## What to build

1. **Planner reminder client** in `src/core/dayPlanner/`: `api/reminderApi.ts`, `dto/response/Reminder.ts` (and the
   on-date variant), `dto/request/ReminderRequest.ts`. Follow `todoListSettingsApi.ts` / `useEntityQuery` patterns.
2. **On the block** (`BasePlannerTaskDialog.vue` and/or the task details panel — pick where the user already edits
   a block): a "Reminders" section listing the block's reminders from the day's `by-date` call filtered by
   `plannerTaskId`, each with its lead ("10 min before"), an **Automatic** chip with a tooltip when `isAuto`
   ("Created by the planner. Edit it and it becomes your own."), a delete button, and an add button (POST with
   `plannerTaskId`, lead prefilled from `dayPlannerSettingsStore.reminderMinutesBefore`).
3. **On the day view** (optional, decide with the owner): a small bell icon on a block card that has any reminder,
   so it is visible without opening the block. One `by-date` call per loaded day, not one per block.
4. **Subject map**: once a reminder view exists, revisit the `reminder` kind row in
   `public/notification-subject-routes.js` — a standalone personal reminder could then deep-link somewhere.
5. Locales SK + EN under `planner.autoReminders.*` / a new `planner.reminders.*`.

## Traps

- **Two id spaces.** A portal `Reminder.id` (this work) is not a `ReminderDefinition.id` (`MyRemindersView`,
  `/pripomienky/register/:id`). Never link one to the other's view.
- **Editing changes the kind.** After a PUT the row is `isAuto: false`; re-read it rather than patching local state,
  or the chip stays on.
- **The in-tab nudge** (`useTaskReminders`, gated by `remindersEnabled`) is a different thing from these; don't
  merge them in the UI copy. The settings tab text already separates them.
- Vue templates: PascalCase component names, camelCase props; `function` declarations, not `const x = () =>`.

## Done when

A user opening a block sees its reminders, can tell an automatic one from their own, can delete it or edit it
(and then it is theirs), and can add one — with the backend `isAuto` on the by-date response pinned by a test.
