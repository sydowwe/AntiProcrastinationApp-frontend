# B2 · Backend ask — the planner's two reminder fields duplicate the reminder-preference system

**Contract only.** No storage, entity, migration or endpoint-implementation decisions implied below — only which endpoint should own two fields, and what the
resulting semantics are.

## The problem

This app has **three** per-user preference endpoints, and none of them knows about the others:

| Endpoint                     | Frontend                                                                        | Fields                                                                          |
|------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| `PUT /user/preferences`      | `_common/modules/user/api/userApi.ts:11`                                        | `theme`, `locale`, `timezone`, + this app's `askBeforeDelete`, `firstDayOfWeek` |
| `PUT /reminder-preference/*` | `_common/modules/notifications/reminderPreference/api/ReminderPreferenceApi.ts` | quiet-hours window; per-`(ownerModule, kind)` `enabled` + `channel`             |
| `PUT planner/settings`       | `src/core/dayPlanner/api/plannerSettingsApi.ts:13`                              | nine planner fields, listed below                                               |

We have now written the ownership rule down (`../../../../CLAUDE.md` → "Where a preference lives") and applied it field by field to the nine planner fields. **Seven
are correctly placed.** Two are not, and they are not misplaced in the direction we expected — they do not belong on `/user/preferences` either:

- `remindersEnabled` (bool, default `true`)
- `reminderMinutesBefore` (int, default `10`, UI-clamped 1–60 in `DayPlannerSettingsView.vue:100-108`)

`remindersEnabled` is a per-user switch for "do planner task reminders fire at all". That is exactly what `ReminderKindPreference` already models — one row per
`(ownerModule, kind)` with an `enabled`
flag and an optional `channel` (`reminderPreference/dto/response/ReminderKindPreference.ts:5-11`), edited from `/nastavenia/pripomienky`. So a user today has **two**
independent places to turn planner reminders off, which disagree with each other, and neither UI mentions the other.

The user-visible consequences, both live today:

- Muting the planner's reminder kind on `/nastavenia/pripomienky` leaves `remindersEnabled` true on
  `planner/settings`, and vice versa. Whichever the dispatcher actually reads, one of the two switches is a placebo — and from the frontend we cannot tell which.
- Quiet hours (`QuietHoursWindow`, deferral past a do-not-disturb window) apply to reminder-preference reminders. Whether they apply to a planner task reminder
  scheduled `reminderMinutesBefore` ahead is undefined from this side.

## The business rules

Stated as the frontend currently assumes them. Correct any that are wrong — we will follow the server's answer.

1. **Is the planner's reminder a `(ownerModule, kind)` reminder at all?** I.e. does the dispatcher that sends planner task reminders consult
   `GET /reminder-preference`, or is `planner/settings`
   its only input? If it consults both, which wins?
2. **What is the planner's `ownerModule` / `kind` pair**, if it has one? The frontend needs the literal strings to label the row (`ReminderKindRow.vue:82-83` looks
   up
   `reminderPreference.ownerModule.<ownerModule>` and falls back to the raw string).
3. **Should `remindersEnabled` be retired in favour of that row?** Our rule says yes: notification delivery is owned by reminder preferences even when it concerns
   exactly one module, because quiet hours and channel choice are already modelled there and a module re-implementing them produces precisely the disagreement above.
   Confirm or correct.
4. **Does `reminderMinutesBefore` travel with it?** This is the part we are least sure of, and we would rather you decide than guess:
    - Lead time is not currently modelled anywhere in the reminder-preference contract — there is no per-kind offset field.
    - Splitting the pair would be worse than either whole: "reminders on/off" in one system and "how far ahead" in another is two round trips and two failure modes
      for one user intent.
    - We do **not** think it belongs on `/user/preferences`. A lead time is a property of a kind of reminder, not of the person; a todo due-date reminder would want
      its own value, not this one. So: should lead time become a per-kind attribute alongside `enabled`/`channel`, or stay on
      `planner/settings` as a planner-specific scheduling input that the reminder-preference system then filters? Either is workable client-side.
5. **Do quiet hours defer a planner task reminder?** If a task starts at 06:10 with a 10-minute lead and the user's quiet window is 22:00–06:00, is the reminder sent
   at 06:00, at 06:00 + deferral, or at 06:00 exactly as scheduled? `QuietHoursWindow.ts:1-3` says reminders inside the window are deferred and never dropped; we
   assume that holds here, but a task reminder deferred past the task is worse than useless.

## The remaining seven fields — for confirmation only, no change requested

Listed so you can flag it if any of these looks wrong from your side. Under the rule, all seven are module-owned and stay on `planner/settings`:

| Field                           | Why it stays                                                       |
|---------------------------------|--------------------------------------------------------------------|
| `detailsPanelExpandedByDefault` | planner UI state, no other consumer                                |
| `arrowKeyNavEnabled`            | keyboard nav in the planner grid only (`DayPlannerView.vue:315`)   |
| `predefinedSkipReasons`         | planner vocabulary; rendered by `SkipReasonForm.vue`               |
| `slotDurationMinutes`           | planner grid granularity                                           |
| `defaultApplyTemplateId`        | FK to a planner template — cannot live anywhere else by definition |
| `defaultConflictResolution`     | planner template-apply semantics                                   |
| `defaultApplyPreviewMode`       | planner template-apply semantics                                   |

## The shape the frontend needs

Nothing new if the answer to (3) is "keep as-is" — in that case we need only the answers to (1) and (5) so the two switches can be documented as meaning different
things, and we will add copy saying so.

If `remindersEnabled` moves: the frontend needs the `(ownerModule, kind)` pair from (2) as literal strings, and `GET /reminder-preference` to return the row (or its
absence to mean enabled, as
`ReminderKindPreference.fromJson` already assumes with `json.enabled ?? true`). If lead time moves with it, it needs a nullable integer-minutes field on the same row
and on
`UpsertReminderKindRequest`, with null meaning "the kind's default".

## What changes on the frontend once this lands

If the pair moves: the "Reminders" tab of `DayPlannerSettingsView.vue:77-117` is deleted outright (a
`VSwitch`, a `VNumberInput` and their labels), `remindersEnabled` / `reminderMinutesBefore` drop off
`UserPlannerSettingsRequest`, `UserPlannerSettings`, `dayPlannerSettingsStore` and the debounced save-watcher's dependency list, and `DayPlannerView.vue:183-184`
watches the reminder-preference source instead. The planner settings page loses a tab; the reminder preferences page gains a row it was always meant to have. Nine
fields become seven, and the answer to "where do I turn planner reminders off" stops depending on which page the user found first.

If it does not move, nothing changes structurally and we add copy to both pages naming the other.

---

## ANSWERED — 2026-08-18. Nothing moves; the copy was the bug.

The premise of the ask was wrong in the frontend's favour: the two switches never overlapped, so neither is a placebo. Verbatim answers, condensed:

1. **Does the dispatcher consult `/reminder-preference` or `planner/settings`?** `/reminder-preference`
   only. `ReminderScanJobHandler` is the single dispatch engine and its only preference read is the
   `ReminderKindPreference` opt-out. It never touches `UserPlannerSettings`.
2. **The pair is `ownerModule = "Portal"`, `kind = "PersonalReminder"`.** The kind covers *every*
   personal reminder, standalone and task-linked alike — deliberately, so detaching a reminder does not change its key. Label it "personal reminders", never "planner
   reminders". `GET /reminder-preference`
   returns only rows that exist, so `json.enabled ?? true` is right and the row is absent for anyone who has never toggled it.
3. **Retire `remindersEnabled`?** No. It was never delivery. `RemindersEnabled` + `ReminderMinutesBefore`
   are read in exactly one place — `ReminderRegistrationService.ApplyUserDefaultsAsync`, on create/update of a reminder that omitted `leadOffsetsMinutes` and is
   attached to a planner task. So
   `remindersEnabled: false` **suppresses the prefill, never the reminder**: the reminder still fires, at the task's start instant instead of ahead of it. Pinned by
   a test. Retiring it would delete the only per-user lead-time default; folding it into the `("Portal", "PersonalReminder")` row would silently apply it to
   standalone reminders too.
4. **Does lead time travel?** No, and it must not become a per-kind attribute: it is already modelled one level down, per reminder, as `Reminder.leadOffsetsMinutes`
   (offsets ≤ 0; `[-10, 0]` = ten minutes before, then again at the time). `planner/settings` supplies only the default for the omitted case. A per-kind field would
   be a third place expressing the same value, and less expressive than the existing one. Do **not** add it to `UpsertReminderKindRequest`.
5. **Quiet hours.** The window is half-open `[start, end)`, so the 06:10 example is outside a 22:00–06:00 window and dispatches normally. Generally: an occurrence is
   deferred only if *every* recipient is inside their window (one recipient for a personal reminder), nothing is written, and `NextOccurrenceAt`
   stays put — so it fires within one scan tick (5 min) of the window ending. Never dropped. In-app delivery goes out immediately regardless; only push and e-mail
   are deferred.

Also confirmed: **there are no automatic planner-task reminders.** A `Reminder` row exists only because the user created one via `POST /reminder`; creating a planner
task never creates one. Worth stating on our side that this frontend has no `POST /reminder` call site inside `core/dayPlanner` at all — the only thing a planner
user experiences from these two fields today is `useTaskReminders`, the client-side in-tab nudge. The prefill path is reachable only from the framework's generic
reminders UI.

The remaining seven fields: confirmed module-owned, nothing else in the solution reads them.

### What we changed (this commit)

No DTO, store field, endpoint or tab was removed — nine fields stay nine. Copy only:

- `DayPlannerSettingsView.vue`'s reminders tab is now **"In-app nudges" / "Upozornenia v aplikácii"**, with the switch reading "nudge me before a task starts", the
  number input labelled as a lead time, an explainer that the nudge needs the planner open, and a `RouterLink` (route name `reminderPreferences`, no import) to the
  page that owns actual delivery.
- Strings added under `planner.nudges.*` in `dayPlanner.{sk,en}.ts`.
- `reminderPreference.ownerModule.Portal` (`Aplikácia`) and `reminderPreference.kindName.PersonalReminder`
  (`Osobné pripomienky`) added to the framework locale, so `ReminderKindRow.vue` stops falling back to the raw identifiers. SK only — the framework ships no EN
  `common`.
- The `TODO(B2)` in `dayPlannerSettingsStore.ts` replaced with the answer.

### Left open — raised separately

Three things the answer surfaced that are not this ask: quiet hours evaluated in the deployment timezone rather than the user's, reminders held all night and
delivered stale after the window ends, and
`ChannelHint` being stored but not enforced while the UI presents it as a choice. See
`prompts/_common/notifications/backend/B1-quiet-hours-fidelity.md`.

The optional collapse of the two planner fields into one nullable `defaultReminderLeadMinutes` (null = no prefill) was offered and is **not** taken up for now — it
is a request/response shape change for a pair whose copy now explains itself, and the frontend gains nothing from it today.
