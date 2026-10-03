# framework — data-map extract

> Extracted 2026-10-02 · commit `0e77f904` (framework `b1b82a1`, submodule tree clean) · units: 16 `reminders-user`, 17 `reminders-admin`, 18 `notifications`, 19 `scheduler` · modules: `_common/modules/reminders`, `_common/modules/notifications` (incl. `reminderPreference/`), `_common/modules/scheduler` · app glue: `src/app/notifications/{notificationTypeMeta,reminderLabels}.ts`, `public/notification-subject-routes.js`
> DTO files read: 35 (+ 12 enum files) · fields mapped: 174 · skipped by rule: ids, join-only FKs, transport wrappers (grid envelopes, `ValueTitleDto`, `unread-count`, the three `AttentionJobItem[]` list wrappers)

**This is a FRAMEWORK map.** A field is `spent` if the framework's own views read it. What this app does with it does not decide that.
Where the gap is only in this app's wiring, the row's note says so.

**How to read the columns.**
- *captured in*: for reminders and jobs this is nearly always **server**, because the owning module registers the row server-side and no
  framework screen creates or edits one. Those config fields are marked `spent` rather than `derived`, because they are registered input, not computed.
  `derived` is kept for values the server computes: next/last occurrence, counts, outcomes, flags.
- *type*: `T?` means nullable, written that way to keep the table pipes intact.
- **Filters** (the `*Filter` request DTOs) are listed as entities. Each of their fields round-trips through the URL and comes back as a chip in the
  same view, which makes them `echo` by definition.

## Summary
- **The admin reminder register drops most of what the server sends.** `POST /reminder-definition/grid` returns the full `ReminderDefinitionDto`.
  `ReminderDefinitionGridResponse` keeps 7 of its ~24 members and drops `dueAt`, `intervalPreset`, `cron`, `leadOffsets`, `payloadJson` and others.
  That drop is the whole cause of the "Schedule ⟳ —" and "Due {next nudge}" cells (unit 17 B1/B2). The fix needs no backend change.
- **The reverse problem on the personal list.** `MyRemindersView` reads `subjectType`, `subjectId`, `intervalPreset` and `cronExpression`, but
  `/my-upcoming` (`MyUpcomingReminderDto`) never sends them, so those reads are always null (unit 16 B1/B4). The one field it does send that
  nothing renders is `templateKey`.
- **The scheduler drops job policy everywhere.** `misfirePolicy`, `maxRetries`, `alertOnFailure`, `disallowConcurrent` and `timeZoneId` are sent on
  every job row and parsed by no DTO. `misfirePolicy` is the field that would explain unit 19 B6 (twelve one-shots overdue for 14 days).
- **The run-history grid drops 7 members the server already sends**: `scheduledFireTime`, `finishedAt`, `errorType`, `correlationId`,
  `replaysRunId`, `jobKeySnapshot` and `handlerKeySnapshot`. `handlerKeySnapshot` is also dropped on run detail, so no screen ever shows it.
- **Parsed but never read:** `UpcomingReminderGridResponse.templateKey`, `DispatchHistoryGridResponse.templateKeySnapshot`,
  `FailedDispatchItem.occurrenceInstant`, and `AttentionJobItem.description`/`status`/`lastOutcome`.
- **Only one framework DTO is read across a module boundary:** `NotificationResponse.subject`. It passes through the app's
  `notificationTypeMeta` + `public/notification-subject-routes.js` and lands in scheduler run detail, `core/todoList` and `core/dayPlanner`.
- **The preference DTOs are pure echo.** Quiet hours, the delivery matrix and kind mutes are each read only on the card that writes them, which
  is correct for settings.

## Entities

### Reminder definition (detail) — `_common/modules/reminders/dto/response/ReminderDefinitionResponse.ts` · request: none (registered server-side by the owning module; lifecycle via `ReminderKeyRequest`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `ownerModule` | `string` | server (owning module's registration) | detail → *Reminder key* card | spent | — |
| `subjectType` | `string` | server | detail → *Reminder key*; breadcrumb label | spent | — |
| `subjectId` | `number` (wire is a string, see DTO comment) | server | detail → *Subject ID* | spent | — |
| `kind` | `string` | server | detail → `h1` (the same "PersonalReminder" on every seeded row, unit 17 P3) | spent | — |
| `status` | `ReminderStatus` | server; changed by pause/resume/cancel | detail → status chip, header actions; `ReminderOccurrencePreview` (paused/cancelled branch) | spent | — |
| `nextOccurrenceAt` | `Date?` | server | detail → *Lifecycle* | derived · spent | yes |
| `lastOccurrenceAt` | `Date?` | server | detail → *Lifecycle* (only place) | derived · spent | yes |
| `completedAt` | `Date?` | server | detail → *Lifecycle* (only place) | derived · spent | yes |
| `scheduleType` | `ReminderScheduleType` | server | detail → *Schedule* card branch | spent | — |
| `dueAt` | `Date?` | server | detail → *Schedule* "Due …", *Due at* (only place, list views substitute `nextOccurrenceAt`) | spent | yes |
| `leadOffsetMinutes` | `number[]` (wire `leadOffsets[].offsetMinutes`) | server | detail → *Lead times* chips | spent | yes |
| `intervalPreset` | `IntervalPreset?` | server | detail → *Schedule* "Monthly" | spent | yes |
| `anchorDate` | `Date?` | server | detail → *Anchor date* | spent | yes |
| `cronExpression` | `string?` (wire `cron`) | server | detail → raw cron + `useCronDescription` sentence | spent | yes |
| `endDate` | `Date?` (wire `endsAt`) | server | detail → *End* | spent | yes |
| `recipientUserIds` | `number[]?` (wire `recipients[].userId`) | server | detail → *Recipients* `#id` chips | spent | — |
| `resolverKey` | `string?` (wire `recipientResolverKey`) | server | detail → *Recipients* resolver key | spent | — |
| `templateKey` | `string?` | server | detail → *Content* | spent | — |
| `notificationType` | `string?` | server | detail → *Content*, raw enum name (not run through `notificationTypeLabel`) | spent | — |
| `payload` | `unknown` (wire `payloadJson`, parsed) | server | detail → *Content* pretty JSON only. Its `title` ("Call the dentist") reaches no list (unit 17 O1) | spent | — |
| `digestKey` | `string?` | server | detail → *Content* (when set; none seeded) | spent | — |
| `preferredChannel` | `string?` (wire `channelHint`) | server | detail → *Content* (when set; none seeded) | spent | — |

### Reminder definition (register row) — `…/reminders/dto/response/ReminderDefinitionGridResponse.ts` · request: none
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `ownerModule` | `string` | server | register → column; bulk bar row key + label | spent | — |
| `subjectType` | `string` | server | register → Subject cell `subjectType #subjectId` | spent | — |
| `subjectId` | `number` | server | register → Subject link text (the link targets the definition `id`) | spent | — |
| `kind` | `string` | server | register → column (raw code, unit 16/17 P3) | spent | — |
| `scheduleType` | `ReminderScheduleType` | server | register → `ReminderScheduleDisplay` | spent | — |
| `status` | `ReminderStatus` | server | register → chip, row actions, bulk eligibility | spent | — |
| `nextOccurrenceAt` | `Date?` | server | register → column, **and** passed as `dueAt` to `ReminderScheduleDisplay` (stands in for the dropped `dueAt`, unit 17 B2) | derived · spent | yes |

### Upcoming reminder row — `…/reminders/dto/response/UpcomingReminderGridResponse.ts` · request: none · two projections: admin `/upcoming` (full `ReminderDefinitionDto`) and personal `/my-upcoming` (`MyUpcomingReminderDto`, 6 keys)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `ownerModule` | `string` | server | Upcoming + My → column | spent | — |
| `subjectType` | `string?` | server (admin projection only) | Upcoming → Kind caption. My → read (`MyRemindersView.vue:90`) but **never sent**, so it is always null | spent | — |
| `subjectId` | `number?` | server (admin only) | as `subjectType` | spent | — |
| `kind` | `string` | server | Upcoming + My → column (raw); row action names | spent | — |
| `templateKey` | `string?` | server (both projections) | — (kept "so the row type describes the wire", per its comment) | unread | — |
| `status` | `ReminderStatus` | server (admin only) | Upcoming → chip. My: not sent, not read | spent | — |
| `scheduleType` | `ReminderScheduleType` | server | Upcoming + My → `ReminderScheduleDisplay` | spent | — |
| `intervalPreset` | `IntervalPreset?` | server (admin only) | Upcoming → "Monthly". My → read but never sent, so it renders "—" (unit 16 B4) | spent | yes |
| `cronExpression` | `string?` (wire `cron`) | server (admin only) | Upcoming → schedule cell. My → read, never sent | spent | yes |
| `hasLeadOffsets` | `boolean` (from `leadOffsets.length`) | server (admin only) | Upcoming → "With lead time" chip | derived · spent | yes |
| `nextOccurrenceAt` | `Date?` | server | Upcoming + My → column; `dueAt` stand-in; My → `canAct()` gate and the snooze dialog's *Occurrence* | derived · spent | yes |
| `recipientCount` | `number` (from `recipients.length`) | server (admin only) | Upcoming → *Recipients* chip | derived · spent | — |

### Occurrence preview — `…/reminders/dto/response/ReminderOccurrencePreviewResponse.ts` (+ `ReminderOccurrenceEntry`) · request: `?count=8`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `entries[].occursAt` | `Date` | server (occurrence calculator) | detail → *Upcoming occurrences* list | derived · spent | yes |
| `entries[].leadOffsetMinutes` | `number?` | server | detail → per-entry icon + "30 minutes before the deadline" label | derived · spent | yes |
| `hasMore` | `boolean` | server | detail → footer "series continues" vs "all remaining" | derived · spent | — |
| `emptyReason` | `OccurrencePreviewEmptyReason?` | server | detail → empty-state copy | derived · spent | — |

### Reminder dispatch (ledger row) — `…/reminders/dto/response/DispatchHistoryGridResponse.ts` · request: none (append-only, written by the scanner)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `reminderDefinitionId` | `number` | server | history → *Reminder ID* link `#23205` (displayed, so kept) | derived · spent | — |
| `occurrenceAt` | `Date` | server | history → "Occurrence: …" caption | derived · spent | yes |
| `dispatchedAt` | `Date` | server | history → *Dispatched* column, the only sort | derived · spent | yes |
| `outcome` | `DispatchOutcome` | server | history → outcome chip | derived · spent | — |
| `skipReason` | `SkipReason?` | server | history → caption via `reminderDashboard.skipReason.*`. The server also sends `QuietHours`/`AlreadyDispatched`, which the client enum lacks, so `QuietHours` renders as a raw key (unit 17 B5) | derived · spent | — |
| `failureDetail` | `string?` | server | history → "Cause: …" caption | derived · spent | — |
| `notificationTypeSnapshot` | `string?` | server | history → *Notification type* column, raw enum name | derived · spent | — |
| `templateKeySnapshot` | `string?` | server | — | derived · unread | — |
| `recipientIds` | `number[]` (parsed from `recipientsSnapshot`) | server | history → `RecipientChips` | derived · spent | — |
| `correlationId` | `string` | server | history → `title` on the failure caption only (hover-only, unreachable by keyboard) | derived · spent | — |
| `reversesDispatchId` | `number?` | server | history → "Corrects #n" chip (+ `isReversal` getter). No column shows dispatch ids (unit 17 P7) | derived · spent | — |

### Reminder overview — `…/reminders/dto/response/ReminderOverviewResponse.ts` (+ `OverviewGroupCount`, `RecentDispatchRollup`, `FailedDispatchItem`) · request: none
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `upcomingByOwnerModule[].key/count` | `string`, `number` | server | overview → *Upcoming by module* card + drill-down link | derived · spent | — |
| `upcomingByKind[].key/count` | `string`, `number` | server | overview → *Upcoming by kind* card + drill-down | derived · spent | — |
| `upcomingNext7Days` | `number` | server | overview → due-soon card | derived · spent | — |
| `upcomingWindowDays` | `number` | server | overview → card label and the drill-down's `to=` date | derived · spent | yes |
| `upcomingTotal` | `number` | server | overview → "of N upcoming" | derived · spent | — |
| `pausedCount` | `number` | server | overview → *Paused* card | derived · spent | — |
| `cancelledCount` | `number` | server | overview → *Cancelled* card | derived · spent | — |
| `recentDispatch.{sent,skipped,failed,reversed}` | `number` ×4 | server | overview → outcome chips (+ `total` getter) | derived · spent | — |
| `recentWindowDays` | `number` | server | overview → rollup label and the drill-down's `from=` | derived · spent | yes |
| `failedNeedingAttention` | `number` | server | overview → failure card count | derived · spent | — |
| `failures[].reminderDefinitionId` | `number` | server | `OverviewFailureList` → drill-down `?reminderId=` | derived · spent | — |
| `failures[].ownerModule` | `string` | server | `OverviewFailureList` row | derived · spent | — |
| `failures[].kind` | `string` | server | `OverviewFailureList` row | derived · spent | — |
| `failures[].occurrenceInstant` | `Date` | server | — (the row shows `dispatchedAt` only, so *which* occurrence failed is not said) | derived · unread | yes |
| `failures[].dispatchedAt` | `Date` | server | `OverviewFailureList` row | derived · spent | yes |
| `failures[].detail` | `string?` | server | `OverviewFailureList` row | derived · spent | — |

### Bulk lifecycle — response `…/reminders/dto/response/BulkLifecycleOutcomeResponse.ts` · request: `BatchLifecycleRequest.ts` + `ReminderKeyRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `key` (`ownerModule, subjectType, subjectId, kind`) | `ReminderKeyRequest` | register row → bulk selection | `bulkActionOutcomes.ts` → matched back to its row and labelled in `BulkActionResultDialog` | derived · spent | — |
| `outcome` | `BulkLifecycleOutcome` | server | result dialog grouping (Applied / NoChange / Failed) | derived · spent | — |
| `reason` | `BulkLifecycleReason?` | server | result dialog `reasonLabel` | derived · spent | — |
| `message` | `string?` | server | `BulkActionOutcomeList` row text | derived · spent | — |
| `BatchLifecycleRequest.action` | `'Pause' \| 'Resume' \| 'Cancel'` | register → bulk bar button | — (a command verb; what comes back is `outcome`) | write-only | — |
| `BatchLifecycleRequest.keys` | `ReminderKeyRequest[]` | register → row selection | echoed back as `key` above | echo | — |

### Occurrence action (snooze / dismiss) — request: `…/reminders/dto/request/SnoozeOccurrenceRequest.ts`, `DismissOccurrenceRequest.ts` · response: none (204)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `reminderId` | `number` | My → row | — Server binds `reminderDefinitionId`, so the request **404s every time** (unit 16 X1) | write-only | — |
| `occurrenceInstant` | `Date` | My → row's `nextOccurrenceAt` | — Server binds `occurrenceAt` (X1) | write-only | yes |
| `snoozeUntil` | `Date` | My → `SnoozeDialog` preset / custom date+time | — No response carries it, and `my-upcoming` does not reflect it (unit 16 B6, O1) | write-only | yes |

### Reminder list filters — request: `ReminderDefinitionFilter.ts`, `UpcomingReminderFilter.ts`, `MyReminderFilter.ts`, `DispatchHistoryFilter.ts` (URL codec `reminderFilterParams.ts`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `ownerModule` | `string?` | register / upcoming / my / history → Filter dialog (free text, exact match) | same view → chip + URL `module=` | echo | — |
| `subjectType` | `string?` | register / upcoming → Filter. My: URL `subject=` only, no control | chip + URL | echo | — |
| `kind` | `string?` | register / upcoming / my → Filter (free text) | chip + URL | echo | — |
| `status` | `ReminderStatus?` | register / upcoming → Filter select. My: URL only | chip + URL | echo | — |
| `scheduleType` | `ReminderScheduleType?` | register / upcoming / my → Filter select | chip + URL | echo | — |
| `nextOccurrenceFrom` | `Date?` | register / upcoming / my → date input | chip + URL `from=` | echo | yes |
| `nextOccurrenceTo` | `Date?` | as above; sent as local midnight at the **start** of the day (unit 16 B3 / 17 B4) | chip + URL `to=` | echo | yes |
| `recipientUserId` | `number?` | upcoming → Filter (number) | chip + URL | echo | — |
| `reminderDefinitionId` | `number?` | history → Filter; deep links from Upcoming rows / overview failures | chip "Reminder ID: #n" + URL `reminderId=` | echo | — |
| `outcome` | `DispatchOutcome?` | history → Filter; overview chips | chip + URL | echo | — |
| `effectiveFailuresOnly` | `boolean?` | history → checkbox; overview *View in dispatch history* | chip + URL `needsAttention=` | echo | — |
| `dispatchedFrom` | `Date?` | history → date; overview chips | chip + URL | echo | yes |
| `dispatchedTo` | `Date?` | history → date | chip + URL | echo | yes |

### Notification — `_common/modules/notifications/dto/NotificationResponse.ts` · request: none (raised server-side; read state via `PATCH …/read|unread`, `POST read-all`; dismiss = `DELETE`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `type` | `string` | server (producer module) | bell + inbox → icon/colour (`notificationIcon`), type filter, clustering (`clusterNotifications`), click-through (`notificationRoute`); app `src/app/notifications/notificationTypeMeta.ts` | derived · spent | — |
| `title` | `string` | server (rendered in the account locale) | bell, inbox row, snackbar, dismiss dialog | derived · spent | — |
| `body` | `string` | server | bell, inbox row | derived · spent | — |
| `createdAt` | `string` (ISO) | server | inbox → day groups (`groupNotificationsByDay`), row time, cluster order; bell time | derived · spent | yes |
| `isRead` | `boolean` | server; toggled by mark read/unread, row click, read-all | bell + inbox → dot/tint, Unread filter, unread count bookkeeping (`useNotifications`) | spent | — |
| `originallyDueAt` | `string?` (absent when punctual) | server (quiet-hours deferral >30 min) | inbox row + bell → "Originally due …". Never observed populated (unit 18 U2) | derived · spent | yes |
| `subject` | `{kind, id}?` | server (`RenderSubject`) | **only** through the host's resolver. App `notificationTypeMeta.ts` → `globalThis.resolveNotificationSubjectPath` (`public/notification-subject-routes.js`). The framework never reads it directly | derived · spent | — |

### Quiet-hours window — `…/notifications/dto/QuietHoursWindow.ts` · request: `SetQuietHoursRequest.ts` (PUT), `DELETE` to clear
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `startMinute` | `number` (0..1439) | preferences → *Quiet hours* From picker | same card only (read-back after PUT, active-now line). The inbox never reads the window | echo | yes |
| `endMinute` | `number` | preferences → To picker | same card only | echo | yes |
| `timeZone` | `string` (IANA) | server (from `User.Timezone`, not in the PUT) | same card → zone for the active-now / "delivered at 06:00" preview **and** the mismatch warning (`QuietHoursCard.vue:244`) | derived · spent | yes |

### Notification delivery preference (matrix cell) — `…/notifications/dto/NotificationPreferenceItem.ts` · request: `UpdateNotificationPreferenceRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `type` | `string` | server catalog (row key) | preferences → matrix row label (`notificationTypeLabel` + app meta icon) | echo | — |
| `channel` | `string` (narrowed on write) | server catalog (column key) | preferences → matrix column | echo | — |
| `enabled` | `boolean` (effective state) | preferences → matrix checkbox | same matrix only (+ "No channel — nothing reaches you" hint via `notificationPreferenceMatrix.ts`) | echo | — |

### Channel availability — `…/notifications/dto/NotificationChannelState.ts` · request: none
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `channel` | `string` | server (deployment config) | preferences → "Not set up on this server: …" alert, column disable | derived · spent | — |
| `configured` | `boolean` | server (VAPID / SMTP present) | same | derived · spent | — |

### Reminder-kind preference — `…/notifications/reminderPreference/dto/response/ReminderKindPreference.ts` (+ `ReminderPreferenceResponse.ts`) · request: `…/request/UpsertReminderKindRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `ownerModule` | `string` | — **no UI creates a row** (unit 18 B3). Only an existing row's switch writes it | `ReminderKindRow` → chip via `reminderOwnerModuleLabel` (app map registered, empty; framework key `Portal → App`) | echo | — |
| `kind` | `string` | as above | `ReminderKindRow` → title via `reminderKindLabel` | echo | — |
| `enabled` | `boolean` | `ReminderKindRow` switch | same row → "Delivered" / "Muted" | echo | — |

### Scheduled job — `_common/modules/scheduler/dto/response/ScheduledJobGridResponse.ts` and `ScheduledJobResponse.ts` (same 15 fields) · request: none (registered by server modules; pause/resume/trigger-now take `{jobKey}`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `jobKey` | `string` | server | jobs → key link; detail → `h1`, copy; `JobActionButtons` | spent | — |
| `description` | `string?` | server | jobs → caption under key; detail → *Description* | spent | — |
| `ownerModule` | `string` | server | jobs → column; detail | spent | — |
| `handlerKey` | `string` | server | jobs → column; detail | spent | — |
| `status` | `JobStatus` | server; pause/resume | jobs → chip, action set; detail → chip, gates Trigger/Replay (`JobRunHistory` prop) | spent | — |
| `scheduleType` | `ScheduleType` | server | jobs + detail → `ScheduleDisplay` | spent | — |
| `cronExpression` | `string?` (wire `cron`) | server | jobs + detail → `<code>` | spent | yes |
| `intervalValue` | `number?` (wire `intervalCount`) | server | jobs + detail → "every 5 minutes" | spent | yes |
| `intervalUnit` | `IntervalUnit?` (wire `intervalPreset`) | server | as above | spent | yes |
| `runAt` | `Date?` (wire `runAtUtc`) | server | jobs + detail → "once at …" | spent | yes |
| `lastRunAt` | `Date?` | server | jobs → *Last run* relative; detail | derived · spent | yes |
| `lastOutcome` | `RunOutcome?` | server | jobs → outcome chip; detail | derived · spent | — |
| `nextRunAt` | `Date?` | server | jobs → *Next run* (default sort); detail | derived · spent | yes |
| `isOrphaned` | `boolean` | server (boot-time handler resolution) | jobs → chip; detail → alert; gates Trigger/Replay | derived · spent | — |
| `isOverdue` | `boolean` | server (60 s grace) | jobs → *Overdue* chip; detail → *Overdue state* | derived · spent | yes |

### Attention job item — `…/scheduler/dto/response/AttentionJobItem.ts` · request: none
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `jobKey` | `string` | server | needs-attention → row link | spent | — |
| `description` | `string?` | server | — (`AttentionJobList.vue` shows key, module, detail, times) | unread | — |
| `ownerModule` | `string` | server | needs-attention → row | spent | — |
| `status` | `JobStatus` | server | — | unread | — |
| `lastRunAt` | `Date?` | server | needs-attention → row time (failed list) | derived · spent | yes |
| `lastOutcome` | `RunOutcome?` | server | — (no outcome chip on the attention rows) | derived · unread | — |
| `nextRunAt` | `Date?` | server | needs-attention → "Next run …" (overdue list) | derived · spent | yes |
| `detail` | `string?` | server (prose: "Overdue by 14 d 22 h; …") | needs-attention → reason line, verbatim | derived · spent | — |

### Scheduler health — `…/scheduler/dto/response/SchedulerNeedsAttentionResponse.ts` (+ `RecentOutcomeRollup`) · request: none
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `activeCount` | `number` | server | needs-attention → *Active* card + drill-down | derived · spent | — |
| `pausedCount` | `number` | server | *Paused* card | derived · spent | — |
| `removedCount` | `number` | server | *Removed* card | derived · spent | — |
| `recentOutcomes.{succeeded,failed,skipped,vetoed,misfired,reversed,total}` | `number` ×7 | server (sparse buckets, flattened) | rollup chips (Misfired/Reversed only when > 0). Crushed to 32 px (unit 19 B5) | derived · spent | — |
| `windowHours` | `number` (wire `recentWindowHours`) | server | rollup heading "last 24 h" | derived · spent | yes |

### Job run (run-history row) — `…/scheduler/dto/response/ScheduledJobRunGridResponse.ts` · request: `ScheduledJobRunFilter.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `startedAt` | `Date` | server | job detail → run history start link (relative time); `usePollForRun` | derived · spent | yes |
| `durationSeconds` | `number` (from `durationMs`) | server | run history → *Duration* | derived · spent | yes |
| `outcome` | `RunOutcome` | server | run history → chip | derived · spent | — |
| `triggerSource` | `TriggerSource` | server | run history → chip | derived · spent | — |
| `errorSummary` | `string?` (wire `errorMessage`) | server | run history → *Error* | derived · spent | — |

(`jobId` is parsed and read nowhere, since the grid already has the job as a prop. It is skipped by the join-only rule. The whole grid renders 0 px tall today, unit 19 X1.)

### Job run (detail) — `…/scheduler/dto/response/ScheduledJobRunResponse.ts` · request: none (replay = `POST …/replay`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `jobKey` | `string` (wire `jobKeySnapshot`) | server | run detail → job key link, copy; `ReplayConfirmDialog` | derived · spent | — |
| `jobStatus` | `JobStatus` (today's, not the snapshot) | server | run detail → gates Replay (`canReplayJob`) + its `title` | derived · spent | — |
| `isJobOrphaned` | `boolean` | server | run detail → gates Replay | derived · spent | — |
| `outcome` | `RunOutcome` | server | run detail → header + info chip | derived · spent | — |
| `scheduledFireTime` | `Date?` | server | run detail → *Due at* (null = off-schedule) | derived · spent | yes |
| `startedAt` | `Date` | server | run detail → *Started at* | derived · spent | yes |
| `finishedAt` | `Date?` | server | run detail → *Finished at* | derived · spent | yes |
| `durationSeconds` | `number` | server | run detail → *Duration* | derived · spent | yes |
| `triggerSource` | `TriggerSource` | server | run detail → header chip | derived · spent | — |
| `correlationId` | `string` | server | run detail → monospace + copy; replay poll | derived · spent | — |
| `errorType` | `string?` | server | run detail → error alert | derived · spent | — |
| `errorMessage` | `string?` | server | run detail → error alert (CRLFs as blank lines, unit 19 P6) | derived · spent | — |
| `payloadSnapshot` | `string?` (wire `payloadSnapshotJson`) | server | run detail → pretty-printed `<pre>` + line count | derived · spent | — |
| `replayedFromRunId` | `number?` (wire `replaysRunId`) | server | run detail → "Replay of run #n" link (displayed, so kept) | derived · spent | — |
| `replayedByRunIds` | `number[]` | server | run detail → "Replays of this run" links, ids only. Automatic retries show here as replays (unit 19 P4) | derived · spent | — |

### Scheduler filters — request: `…/scheduler/dto/request/ScheduledJobFilter.ts`, `ScheduledJobRunFilter.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `ownerModule` | `string?` | jobs → Filter | chip + URL | echo | — |
| `handlerKey` | `string?` | jobs → Filter | chip + URL | echo | — |
| `status` | `JobStatus?` | jobs → Filter; needs-attention count cards | chip + URL | echo | — |
| `scheduleType` | `ScheduleType?` | jobs → Filter | chip + URL | echo | — |
| `lastOutcome` | `RunOutcome?` | jobs → Filter | chip + URL | echo | — |
| `nextRunFrom` | `Date?` | jobs → Filter date | chip + URL | echo | yes |
| `nextRunTo` | `Date?` | jobs → Filter date | chip + URL | echo | yes |
| `onlyOverdue` | `boolean?` | jobs → *Overdue only* switch; needs-attention *View all* | chip + URL `overdue=` | echo | — |
| run `outcome` | `RunOutcome?` | job detail → run Filter | chip + URL | echo | — |
| run `triggerSource` | `TriggerSource?` | job detail → run Filter | chip + URL | echo | — |
| run `startedFrom` | `Date?` | job detail → run Filter | chip + URL | echo | yes |
| run `startedTo` | `Date?` | job detail → run Filter | chip + URL | echo | yes |
| run `correlationId` | `string?` | programmatic only: `usePollForRun` after trigger/replay | — (finds the new run, never shown as a filter) | write-only | — |
| run `replaysRunId` | `number?` | **never set by any caller** | — | write-only | — |

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `NotificationResponse.subject` | `_common/modules/notifications` | app → `src/app/notifications/notificationTypeMeta.ts` → `public/notification-subject-routes.js`; destinations: `_common/modules/scheduler` (`scheduledJobRun` → `/planovac/behy/:id`), `core/dayPlanner` (`plannerTask` → `/day-planner/task/:id` redirect), `core/todoList` (`routinePeriod` → `/routine-todo-list?focus=<id>`) | click-through from bell / inbox / push to the entity a notification is about |
| `NotificationResponse.type` | `_common/modules/notifications` | app → `src/app/notifications/notificationTypeMeta.ts` | icon, colour, label override (`RoutineSuggestedToday`), constant fallback route per type |
| `ReminderKindPreference.ownerModule` / `.kind` | `_common/modules/notifications/reminderPreference` | app → `src/app/notifications/reminderLabels.ts` (registered, deliberately empty) | human labels for the kind-mute rows (falls through to the framework's `Portal`/`PersonalReminder` keys) |

No `src/core` module imports a DTO from any of the three framework modules. `App.vue` mounts `NotificationBell` and calls
`startNotificationSession`. `core/dayPlanner/…/PlannerRemindersTab.vue` links to the preferences page by route name only, which is not a field read.

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `ReminderDefinitionGridResponse` | `ReminderDefinitionDto` (`ReminderDefinitionGridEndpoint`) | `templateKey`, `payloadJson`, `notificationType`, `dueAt`, `intervalPreset`, `cron`, `anchorDate`, `endsAt`, `recipientMode`, `recipientResolverKey`, `recipients`, `leadOffsets`, `lastOccurrenceAt`, `completedAt`, `digestKey`, `channelHint`, `isActive` | 17 of 24. Root cause of unit 17 B1 (Schedule "—") and B2 ("Due" shows the next nudge); `payloadJson.title` is O1's label |
| `UpcomingReminderGridResponse` (admin `/upcoming`) | `ReminderDefinitionDto` (`GetUpcomingRemindersEndpoint`) | `payloadJson`, `notificationType`, `dueAt`, `anchorDate`, `endsAt`, `recipientMode`, `recipientResolverKey`, `lastOccurrenceAt`, `completedAt`, `digestKey`, `channelHint`, `isActive`; `leadOffsets` and `recipients` collapsed to a flag and a count | `dueAt` dropped, so "Due" shows `nextOccurrenceAt` (unit 17 B2) |
| `UpcomingReminderGridResponse` (personal `/my-upcoming`) | `MyUpcomingReminderDto` | none | The reverse problem: the client reads `subjectType`, `subjectId`, `intervalPreset` and `cron`, which this projection never sends. Fixing it means widening the projection server-side (unit 16 B1/B4) |
| `ReminderDefinitionResponse` | `ReminderDefinitionDto` (`GetReminderByIdEndpoint`) | `recipientMode` (re-derived from `resolverKey`), `isActive` (duplicates `status`), `recipients[].id`, `leadOffsets[].id` | harmless |
| `ScheduledJobGridResponse` | `ScheduledJobDto` (`GetScheduledJobsOverviewEndpoint`) | `timeZoneId`, `misfirePolicy`, `disallowConcurrent`, `maxRetries`, `alertOnFailure`, `isActive` | present in the CSV export only. `misfirePolicy` bears on unit 19 B6 |
| `ScheduledJobResponse` | `ScheduledJobDto` (`GetByIdScheduledJobEndpoint`) | same six | the detail's *Job info* card would be their natural home |
| `AttentionJobItem` | `AttentionJobDto : ScheduledJobDto` | `handlerKey`, `scheduleType`, `cron`, `intervalPreset`, `intervalCount`, `runAtUtc`, `timeZoneId`, `misfirePolicy`, `disallowConcurrent`, `maxRetries`, `alertOnFailure`, `isActive`, `isOrphaned`, `isOverdue` | the full job row is sent, and the client keeps 9 members |
| `ScheduledJobRunGridResponse` | `ScheduledJobRunDto` (`GetJobRunHistoryEndpoint`) | `jobKeySnapshot`, `handlerKeySnapshot`, `scheduledFireTime`, `finishedAt`, `errorType`, `correlationId`, `replaysRunId` | lateness (`scheduledFireTime` vs `startedAt`) and the replay/retry link are available per row but unmapped |
| `ScheduledJobRunResponse` | `ScheduledJobRunDetailDto` | `handlerKeySnapshot` | the only place a run's historical handler could be shown |
| `DispatchHistoryGridResponse`, `ReminderOverviewResponse`, `ReminderOccurrencePreviewResponse`, `BulkLifecycleOutcomeResponse`, `NotificationResponse`, `QuietHoursWindow`, `NotificationPreferenceItem`, `NotificationChannelState`, `ReminderPreferenceResponse`/`ReminderKindPreference`, `SchedulerNeedsAttentionResponse` | `ReminderDispatchDto`, `ReminderOverviewResponse`, `ReminderOccurrencePreviewResponse`, `ReminderLifecycleOutcomeDto`, `NotificationDto`, `NotificationQuietHoursDto`, `NotificationPreferenceItem`, `NotificationChannelAvailabilityItem`, `MyReminderPreferencesResponse`/`ReminderKindPreferenceDto`, `SchedulerHealthDto` | none | fully mapped. Several were renamed into agreement in 2026-09, per their DTO comments |

Not located: 0.

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| O1 | reminders-user | open | The list cannot show that an occurrence is already snoozed or dismissed. A *Snoozed until …* / *Dismissed* chip, a *Snoozed* filter, and a home for a future *Undo* | `SnoozeOccurrenceRequest.snoozeUntil` (write-only), `UpcomingReminderGridResponse.templateKey` (unread); server-only `ReminderOccurrenceAction` |
| O1 | reminders-admin | open | Reminders are named by type and id everywhere, while the row already carries a human title. Proposes a per-`(ownerModule, kind)` label resolver hook, or a server-side `displayLabel` | `ReminderDefinitionResponse.payload` (spent raw only), `ReminderDefinitionGridResponse` (drops `payloadJson`), `…subjectType` / `…subjectId` / `…kind` |
| O1 | scheduler | open | *Trigger now* runs a job with one click while *Replay* needs an acknowledged warning. Proposes a light confirm on Trigger | `ScheduledJob.status`, `ScheduledJob.isOrphaned` (no unspent data) |
| O2 | scheduler | open | The jobs list is 58 % spent one-shot alarms by default. Proposes defaulting to non-`Removed` and grouping per-instance one-shots by handler | `ScheduledJob.status`, `.scheduleType`, `.handlerKey`, `.nextRunAt`; filter `status` |

Unit 18 (`notifications`) files no opportunities (tally `opportunity 0`).

## Contradictions
1. **Quiet-hours `timeZone` is spent beyond the warning.** `notifications/usecase.md` (*captures but does not spend*) says it is "shown only as a
   mismatch warning". In code, `QuietHoursCard.vue:244` uses it as the zone for the active-now / "delivered today at 06:00" preview as well
   as the warning. The doc is right that the inbox never uses it.
2. **`handlerKeySnapshot` is not read on run detail.** `scheduler/usecase.md` lists `handlerKeySnapshot, correlationId, scheduledFireTime` as unread
   on run-history rows and "read only on run detail". The last two are read there. `handlerKeySnapshot` is not:
   `ScheduledJobRunResponse.fromJson` (`…/scheduler/dto/response/ScheduledJobRunResponse.ts`) never maps it, so no screen shows it.

**Missed by the docs (not disagreements, under-counts):**
- `reminders-admin/usecase.md` lists 8 members dropped from the register rows. The real number is 17; see *Server sends, client drops*.
  The Upcoming list it gives (5) is also short by 7.
- `scheduler/usecase.md` names neither the 7 run-history members the grid DTO drops (it says "unread", but they are not even parsed), nor the
  three parsed-but-unread `AttentionJobItem` fields (`description`, `status`, `lastOutcome`).
- No unit doc mentions `DispatchHistoryGridResponse.templateKeySnapshot`, `FailedDispatchItem.occurrenceInstant` or the never-set
  `ScheduledJobRunFilter.replaysRunId`.

## Unsettled
None. Every field was settled by a direct read of its view, component or composable.

## App wiring

**Notification kinds the app registers** (`src/app/notifications/notificationTypeMeta.ts`, 11 entries). Click-through first tries `subject`
through `public/notification-subject-routes.js`, then the type's constant route.

| type | icon / colour | subject kinds it carries → route | fallback / constant route |
| --- | --- | --- | --- |
| `DeadlineApproaching` | triangle-exclamation / warning | none, permanently (cross-module) | `myReminders` → `/pripomienky/moje` |
| `PersonalReminder` | bell / primary | `plannerTask` → `/day-planner/task/:id` → `/day-planner/<date>?focus=<id>`; `reminder` → **unmapped** (Planning `Reminder` id; this app has no view for it) | `myReminders` |
| `ReminderDigest` | layer-group / primary | none, permanently (N occurrences) | `myReminders` |
| `RoutinePeriodEndingSoon` | hourglass-half / warning | `routinePeriod` → `/routine-todo-list?focus=<id>` | `routineToDoList` |
| `RoutinePeriodEnded` | flag-checkered / success | `routinePeriod` → same | `routineToDoList` |
| `RoutineStreakGraceExpiring` | fire / warning | `routinePeriod` → same | `routineToDoList` |
| `RoutineSuggestedToday` | calendar-check / secondary · app label `routineTodoList.suggestedTodayNotificationType` | `routinePeriod` only when every named item shares one | `routineToDoList` |
| `ScheduledJobFailed` | circle-exclamation / error | `scheduledJobRun` → `/planovac/behy/:id` | **none**. A failure with no run row (handler not found) leads nowhere |
| `ScheduledJobOverdue` | clock / warning | none (no run row by definition) | **none**. Unrouted |
| `TimerBoundary` | hourglass-end / primary | none in-app (`RenderSubject` → null). The push document's `url` reaches only the service worker | **none**, deliberately ("landing nowhere beats the wrong timer") |
| `Test` | flask / textMuted | none | none |

Labels: the framework locale `notifications.type.*` covers 10 of these. `RoutineSuggestedToday` is labelled app-side. The delivery matrix on
this deployment lists exactly these 11 types (server catalog order), so every type this backend emits for this app is registered.

**Reminder labels the app registers** (`src/app/notifications/reminderLabels.ts`): none, `ownerModule: {}` and `kind: {}`, deliberately. The only
pair the backend registers for this app is `("Portal", "PersonalReminder")`, which the framework's own `reminderPreference.ownerModule.Portal`
("App") and `kindName.PersonalReminder` ("Personal reminders") resolve. Any other pair would render as its raw identifier. These labels are used
**only** by the reminder-kind card in `/nastavenia/pripomienky`. The reminders screens (units 16/17) print `kind` / `ownerModule` raw and never
call `reminderKindLabel` (unit 16/17 P3).

**Kinds the framework's DTOs can carry that the app registers no metadata for.** These are the backend's
`Sydowwe.Framework.Contracts.notification.NotificationType` members that are absent from the map:
- `StockLow`, `UpcomingHrEvents`, `LeavePending`, `WorkLogComplianceBreach`, `LeaveApproved`, `LeaveRejected`, `WorkLogApproved`,
  `WorkLogRejected`, `RegistratoryDisposalDue` (9). These are the other apps' business kinds, appended to the shared enum. If one ever arrived
  here it would **render generically**: grey `bell` icon, the raw enum name as its label (no `notifications.type.*` key exists), no
  click-through, and **absent from the inbox's type filter**, because the filter lists only registered types. None is emitted by this backend
  for this app, and none appears in the delivery matrix.
- Subject kinds: `reminder` (falls back to the type route, see above) and `inventoryItem` (another app's) have no destination.
- Not a notification type, but the same append-only-vocabulary gap in a framework enum: `DispatchHistoryGridResponse.skipReason`. The server's
  `SkipReason` has `AlreadyDispatched` and `QuietHours`, which the client enum lacks, so a `QuietHours` row **renders a raw i18n key** (unit 17
  B5, already filed).

## Opportunities (framework)

### FOP1. Clicking a "job overdue" or "job failed" notification opens the scheduler's *Needs attention* page [app wiring]
- **Source:** from data-map (App wiring: `ScheduledJobOverdue` unrouted, `ScheduledJobFailed` without a subject leads nowhere)
- **Data it spends:** `NotificationResponse.type`, `NotificationResponse.subject` (absent case); the existing `schedulerNeedsAttention` route / `/planovac/ulohy?overdue=true`
- **Where it would surface:** bell + `/notifikacie` row click, push click (via the type route)
- **Needs backend:** no
- **Size:** S. Two `route` entries in `src/app/notifications/notificationTypeMeta.ts` (constant for Overdue, fallback for Failed).
- **Value:** the operator's situation in unit 19 is "is anything broken right now". Today the one notification that says something *is* broken is a dead click.

### FOP2. Show the real schedule on the register and the personal list [framework]
- **Source:** from data-map (register drops 17 members); unit 17 B1/B2, unit 16 B4 are the defect face of it
- **Data it spends:** `ReminderDefinitionDto.dueAt`, `.intervalPreset`, `.cron`, `.leadOffsets` (already on the register's wire); `UpcomingReminderGridResponse.intervalPreset` / `.cronExpression` (personal)
- **Where it would surface:** `/pripomienky/register` Schedule column; `/pripomienky/moje` schedule cell
- **Needs backend:** no for the register (map what `ReminderDefinitionGridResponse.fromJson` drops). Yes for the personal list: widen `MyUpcomingReminderDto` with `intervalPreset`, `cron`, `dueAt`
- **Size:** S. One `fromJson` and the existing `ReminderScheduleDisplay` props; the personal half waits on the backend
- **Value:** answers "how often / when is this one due?" (unit 17 register), and "is this a one-off or does it repeat?" (unit 16) without opening the detail.

### FOP3. Name reminders by what they are about, not "PersonalReminder #23001" [framework]
- **Source:** reminders-admin O1; reminders-user B1 (same gap on the personal list)
- **Data it spends:** `ReminderDefinitionResponse.payload` (`title`), `payloadJson` on register/upcoming wire (dropped), `kind`, `ownerModule`
- **Where it would surface:** register Subject, Upcoming Kind cell, detail `h1`, overview failure rows, dispatch history, `/pripomienky/moje` rows
- **Needs backend:** yes. A host-registered label resolver per `(ownerModule, kind)` works for the admin lists, which carry the payload. The personal projection carries no payload, so it needs a server-side `displayLabel` (or payload) on `MyUpcomingReminderDto`
- **Size:** M. A new framework seam modelled on `notificationTypeMeta` / `reminderLabels`, plus a PII decision per host
- **Value:** with six reminders of one kind, neither the admin nor the recipient can tell which row is which (unit 17 O1, unit 16 B1).

### FOP4. Explain a job's retry and misfire behaviour on its detail page [framework]
- **Source:** from data-map (server sends, client drops on `ScheduledJobGridResponse` / `ScheduledJobResponse`); unit 19 usecase
- **Data it spends:** `ScheduledJobDto.misfirePolicy`, `.maxRetries`, `.alertOnFailure`, `.disallowConcurrent`, `.timeZoneId`
- **Where it would surface:** `/planovac/ulohy/:id` *Job info* card
- **Needs backend:** no
- **Size:** S. Five `fromJson` members and five `InfoRow`s with an enum label map for `MisfirePolicy`
- **Value:** an operator looking at a one-shot that is 14 days overdue (unit 19 B6) can see whether the job was registered to catch up or to skip. A failed job shows whether it retries and whether anyone gets alerted.

### FOP5. Humanise reminder vocabularies using seams the framework already has [framework]
- **Source:** from data-map (`notificationType` / `notificationTypeSnapshot` raw; `kind` / `ownerModule` raw while `reminderKindLabel` exists); unit 16/17 P3
- **Data it spends:** `ReminderDefinitionResponse.notificationType`, `DispatchHistoryGridResponse.notificationTypeSnapshot`, `*.kind`, `*.ownerModule`
- **Where it would surface:** reminders detail *Content*, dispatch history *Notification type* column, every reminders list's Kind / Owner module cells
- **Needs backend:** no
- **Size:** S. Call `notificationTypeLabel` / `notificationIcon` and `reminderKindLabel` / `reminderOwnerModuleLabel`. Open design point: reminders would then import a `notifications` util, and whether framework module→module imports are allowed is undecided
- **Value:** replaces raw codes ("PersonalReminder", "Portal") with the same words the bell and the preferences page already use, so one event has one name across the app.

### FOP6. Show what each replay or retry of a run did, not just its id [framework]
- **Source:** from data-map (`ScheduledJobRunFilter.replaysRunId` is never set; `ScheduledJobRunResponse.replayedByRunIds` is ids only); relates to unit 19 P4
- **Data it spends:** `ScheduledJobRunFilter.replaysRunId` (existing server filter), `ScheduledJobRunGridResponse.outcome` / `.triggerSource` / `.startedAt`
- **Where it would surface:** `/planovac/behy/:id` *Replay lineage*
- **Needs backend:** no. One `run-history` call filtered by `replaysRunId`, which removes the N+1 the DTO comment cites as the reason for bare ids
- **Size:** S
- **Value:** the lineage card would show each re-run's outcome and whether it was an *automatic retry* or a *replay*, the confusion P4 records.

### FOP7. Show lateness, error type and correlation id in the run-history grid [framework]
- **Source:** from data-map (`ScheduledJobRunDto` sends `scheduledFireTime`, `finishedAt`, `errorType`, `correlationId`; grid DTO drops them)
- **Data it spends:** `ScheduledJobRunDto.scheduledFireTime`, `.finishedAt`, `.errorType`, `.correlationId`
- **Where it would surface:** `/planovac/ulohy/:id` run history (once X1 makes the grid visible)
- **Needs backend:** no
- **Size:** S
- **Value:** answers "was it on time?" and "what kind of failure?" across a run log of 58 000 rows, without opening each run.

### FOP8. Show the last outcome and description on the *Needs attention* rows [framework]
- **Source:** from data-map (`AttentionJobItem.description`, `.status`, `.lastOutcome` parsed, never read; `FailedDispatchItem.occurrenceInstant` likewise on the reminders overview)
- **Data it spends:** `AttentionJobItem.lastOutcome`, `.description`, `.status`; `FailedDispatchItem.occurrenceInstant`
- **Where it would surface:** `/planovac/pozornost` attention rows; `/pripomienky/prehlad` failure rows ("for the occurrence of …")
- **Needs backend:** no
- **Size:** S. Already parsed, so this is template work only
- **Value:** small. The second-monitor dashboards say what a job is for and which occurrence a reminder failure was for, without a drill-down.

### FOP9. Mark snoozed and dismissed occurrences on *My reminders* [framework]
- **Source:** reminders-user O1 (and the natural fix for its B6)
- **Data it spends:** server-side `ReminderOccurrenceAction` (`SnoozeUntil`, dismiss marker) via `SnoozeOccurrenceRequest.snoozeUntil`; `UpcomingReminderGridResponse.nextOccurrenceAt`
- **Where it would surface:** `/pripomienky/moje` row chip + a *Snoozed* filter
- **Needs backend:** yes. Project the caller's occurrence action into `MyUpcomingReminderDto`. It also depends on X1 (wrong request keys) being fixed first, or there is nothing to show
- **Size:** M
- **Value:** someone who snoozed a reminder can see it worked. Today the row stays unchanged and can be dismissed twice (unit 16 B6).

### FOP10. Give timer notifications a destination in the inbox, as their push already has [framework]
- **Source:** from data-map (`notifications/usecase.md` *captures but does not spend*: `TimerBoundary` push `url`); App wiring (`TimerBoundary` unrouted)
- **Data it spends:** the push document's `url` (`TimerBoundaryPayload.Url`), which is absent from `NotificationDto` / `NotificationResponse`
- **Where it would surface:** bell + `/notifikacie` row click for `TimerBoundary`
- **Needs backend:** yes. Carry `url` (or a `timer` subject kind) on `NotificationDto`, and let the framework honour a server-supplied path the way `resolveNotificationTargetUrl` already does for push
- **Size:** M
- **Value:** the type a user receives most often (every pomodoro boundary) is the one that leads nowhere in-app, while the same event's push opens the right timer.

### FOP11. Tell the user how many notifications quiet hours are holding [framework]
- **Source:** from data-map (`notifications/usecase.md` last bullet; noted, not asked, in N10)
- **Data it spends:** none client-side yet. `QuietHoursWindow` (`startMinute`, `endMinute`, `timeZone`) frames it
- **Where it would surface:** `/nastavenia/pripomienky` quiet-hours card
- **Needs backend:** yes. A held-count on `GET /notification-quiet-hours`
- **Size:** M
- **Value:** low. It would answer "is anything waiting for me?" during a window, and soften the P6 surprise that the bell keeps filling inside quiet hours.
