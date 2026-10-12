# history — data-map extract

> Extracted 2026-10-01 · commit `4d890646` **plus uncommitted working-tree changes** (the timer-session feature:
> `ActivityHistorySession`, `TimerSession*` enums, `ActivityHistorySessionRequest`, `timerSessionRequest.ts`,
> `pomodoroSessionLog.ts`, `timelineUnits.ts`, `HistorySessionGroup.vue` are untracked; `ActivityHistory.ts`,
> `runningTimerStore.ts`, `TimerView.vue`, `PomodoroTimerView.vue`, `HistoryRecordItem.vue`, `HistoryDetailView.vue`
> are modified). Everything below describes the working tree. · units: 04 `history-capture`, 03 `history-review` ·
> modules: `activityHistory`, `historyDashboard`
> DTO files read: 42 · fields mapped: 111 · skipped by rule: ids, join-only FKs, transport wrappers
> Also skipped: pure container fields (`items`, `windows`, `hours`, `cards`, `totals`, `topRoles`,
> `periodComparison`). Their element fields are mapped instead. `CalendarActivityDaySummary.hasRecord` is
> synthesized client-side, never parsed from JSON, so it is not mapped. Client-side getters (`averageTime`,
> `displaySummary`, `isWeekend`…) are reads, not fields.

## Summary
- **Which modes can set which field.** Only **pomodoro** sets `ActivityHistory.phase`, `ActivityHistorySession.plannedFocusPeriods` and `completedFocusPeriods`. Only **timer + pomodoro** produce a `session` and an `outcome`. Stopwatch, manual, and the dayPlanner/todoList log-time writes produce bare `startTimestamp`/`length`/`activity` rows. The `outcome` "procrastination signal" (`stoppedEarly`/`ranOutWhileAway`) therefore exists only for *routed* timer/pomodoro saves.
- **The embedded path drops all session data.** When a timer runs inside `TrackTimeDialog` (pinned activity, from dayPlanner/todoList/NowBar), `TimerView`/`PomodoroTimerView` emit a plain `done(start, length)` (`TimerView.vue:226-229`, `PomodoroTimerView.vue:280-282`). The embedder writes one row with no session, phase or outcome, and an embedded pomodoro's **rest time is not logged at all**.
- **The plan never reaches the server.** The countdown's `durationMs` and the pomodoro's `focusMs`/`shortRestMs`/`longRestMs` live only in the client running-timer session (`localStorage runningTimerSession::u<id>`, dropped after 12 h). The session request sends actual lengths plus `outcome`, and for a pomodoro the `plannedFocusPeriods` count. For a countdown stopped early, the planned length is unrecoverable, so there is no plan-vs-actual for history the way `PlannerTask` has it.
- **Sub-minute length is discarded when it is captured, not left unread later.** `sessionLengthFromMs` rounds to whole minutes, and `Time` carries no seconds. See *Contradictions*.
- **Derived but unread:** `HistorySummaryCard.averageSeconds` (also mis-assigned as the *baseline* average by the backend, per its DTO comment), `HistoryTimeOfDayHour.entries` and `CalendarActivityRoleSummary.roleId`. (`HistoryTimeOfDayResponse.daysInRange` is spent since OP21.) `ActivityHistoryResponse.EndTimestamp` is sent and dropped; the client recomputes it from start + length in two places.
- **Cross-module reads:** no other module reads history *data* through this module's API any more. `ActivityLoggedTimeAggregate` (activity-keyed estimate calibration) was deleted on 2026-10-12. To-do and routine items now get their logged time on their own responses (FO8: F3-01, F2-06), keyed on the item link the server reads. `home` reads the pie-chart response (widget) and the running-timer **store** directly (`NowBar.vue`). History's calendar reads dayPlanner-owned day fields (`dayType`, `wakeUpTime`, `bedTime`, `label`).
- **Time-bearing data sent to the server with no read path:** `ScheduleTimerAlarmsRequest` posts every pomodoro boundary (instant, phase, cycle/period indices) to the server, which is write-only by design. The backend notification audit should start there. It is the only time-bearing structure this group pushes server-side that is not a history row.

## Entities

### ActivityHistory (history record) — `src/core/activityHistory/dto/response/ActivityHistory.ts` · request: `ActivityHistoryRequest.ts`, `ActivityHistorySessionRequest.ts` (`records[]`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `startTimestamp` | `Date` | Stopwatch/Timer/Pomodoro → Start instant (pomodoro: each phase's real start, from `segments`); Manual → "When" date+time; `EditActivityHistoryForm`; dayPlanner `DayPlannerLogTimeController.vue`, todoList `BaseTodoListLogTimeController.vue` | Detail → timeline start/end label (`HistoryRecordItem.vue:156-160`), session ordering (`timelineUnits.ts`), CSV export start/end (`HistoryDetailView.vue:396-401`) | spent | yes |
| `length` | `Time` (h+m only) | Stopwatch/Timer/Pomodoro → elapsed, rounded to whole minutes (`useSessionLength.ts:27`, `timerSessionRequest.ts:50`); Manual → "Length" field; Edit form; dayPlanner/todoList log-time | Detail → timeline duration chip + colour band (`HistoryRecordItem.vue:157-169`), focus total (`HistorySessionGroup.vue`), export duration columns; server aggregates for every dashboard | spent | yes |
| `activity` | `Activity` (nested) | all four capture views → `ActivitySelectionForm`; pomodoro break rows → rest activity | Detail → timeline title, role chip, category, `activity.text` shown as "notes" (`HistoryRecordItem.vue:37-80`); export | spent | — |
| `phase` | `TimerSessionPhase \| null` | **Pomodoro only** → derived from the segment log at save (`timerSessionRequest.ts:51`) | Detail → row note (`HistoryRecordItem.vue:146`), focus-only total (`HistorySessionGroup.vue:120`), export "phase" column | spent | yes |
| `session` | `ActivityHistorySession \| null` | **Timer + Pomodoro only**, routed views only (`POST /activity-history/session`) | Detail → timeline folds pomodoro rows into one unit (`timelineUnits.ts:409-435`) | spent | — |

### ActivityHistorySession (timer session) — `src/core/activityHistory/dto/response/ActivityHistorySession.ts` · request: `ActivityHistorySessionRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `id` | `number` | server (kept: displayed and decides grouping) | Detail → timeline grouping key (`timelineUnits.ts:419`), export "session" column (`HistoryDetailView.vue:424`) | spent | — |
| `kind` | `TimerSessionKind` | Timer / Pomodoro view (which one saved) | Detail → fold only pomodoro (`timelineUnits.ts:415`), countdown row note (`HistoryRecordItem.vue:147`) | spent | — |
| `outcome` | `TimerSessionOutcome` | running-timer store at end (`runningTimerStore.ts:681-682, 839-842`) — `ranOutWhileAway` pomodoro only | Detail → countdown row note, pomodoro session header (`HistorySessionGroup.vue:139-144`), export "outcome" | spent | — |
| `plannedFocusPeriods` | `number \| null` | **Pomodoro only** → setup panel periods × cycles | Detail → "n of m" pomodoro header (`HistorySessionGroup.vue:139-144`) | spent | — |
| `completedFocusPeriods` | `number \| null` | **Pomodoro only** → segment log (`pomodoroSessionLog.ts:73`) | Detail → same header | spent | — |

### ~~ActivityLoggedTimeAggregate~~: deleted 2026-10-12 (FO8)
It summed an activity's whole history per sitting, and the client divided that by a per-item estimate (F3 *Out of scope* #2). Its last reader, the routine list, moved to the item-keyed `RoutineTodoListItemEntity.typicalSeconds` in F2-06. The server route `POST /activity-history/aggregate-by-activity` has no client caller now.

### TimerPreset (Quick Time / Activity Preset) — `src/core/activityHistory/dto/response/TimerPreset.ts` · request: `TimerPresetRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `duration` | `number` (min) | Timer → `TimerPresetDialog` | Timer → chip label + applies the countdown length (`TimerView.vue:263`); **Manual → applies Length** (`AddActivityManuallyForm.vue:103`) | spent | yes |
| `activity` | `Activity \| null` | Timer → `TimerPresetDialog` | Timer → splits Quick Time vs Activity Preset rows, chip label, preselects activity (`TimerPresetsSection.vue:95,147-151`, `TimerView.vue:264-265`); Manual → preselects activity (`AddActivityManuallyForm.vue:104`) | spent | — |

### PomodoroTimerPreset — `src/core/activityHistory/dto/response/PomodoroTimerPreset.ts` · request: `PomodoroTimerPresetRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | Pomodoro → `PomodoroPresetFormDialog` | Pomodoro → presets dialog card (`PomodoroPresetsDialog.vue:44`), setup-panel chip (`PomodoroSetupPanel.vue:34`), delete confirm | spent | — |
| `focusDuration` | `number` (min) | same form | presets card; applied to setup (`PomodoroTimerView.vue:350`) | spent | yes |
| `shortBreakDuration` | `number` (min) | same form | presets card; applied (`:351`) | spent | yes |
| `longBreakDuration` | `number` (min) | same form | presets card; applied (`:352`) | spent | yes |
| `focusPeriodInCycleCount` | `number` | same form | presets card, chip summary; applied (`:353`) | spent | yes |
| `numberOfCycles` | `number` | same form | presets card, chip summary; applied (`:354`) | spent | yes |
| `focusActivity` | `Activity \| null` | same form | presets card name; preselects focus activity (`:355-356`); form's preset-type radio | spent | — |
| `restActivity` | `Activity \| null` | same form | presets card name; preselects rest activity (`:358-359`) | spent | — |

### Running timer session (client-only data source) — `src/core/activityHistory/store/runningTimerStore.ts` · persisted: `localStorage runningTimerSession::u<accountId>` via `writeUserScoped` (`:875`), restored on load (`:849`), **dropped if older than 12 h** (`STALE_AFTER_MS`, `:237, :827`)
Never sent as a whole. "Read in" says where each field ends up. A field marked *never sent* is lost when the session is cleared.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `kind` | `'stopwatch'\|'timer'\|'pomodoro'` | which view pressed Start | `home/component/NowBar.vue:338` (link back), replace-guard dialog (`useTimerSessionGuard.ts`) → `session.kind` on save | spent | — |
| `startedAtEpoch` | `number` (epoch ms) | Start press | → `ActivityHistory.startTimestamp`; staleness check | spent | yes |
| `pinnedActivityId` | `number \| null` | embedder (`TrackTimeDialog`) | decides session adoption (`sessionFor()`) and the embedded `done` path | spent | — |
| `activityName` | `string` | frozen at Start | `home/component/NowBar.vue:361`, save dialog, guard dialog | spent | — |
| `paused` | `boolean` | Pause/Resume | `home/component/NowBar.vue:342,363`; view controls | spent | — |
| `ended` | `boolean` | Stop / clock ran out | `home/component/NowBar.vue:341,362`; guard dialog wording (`useTimerSessionGuard.ts:40`) | spent | — |
| `outcome` | `TimerOutcome \| null` | end of session (null for stopwatch) | → `ActivityHistorySession.outcome`; `PomodoroSaveBody.vue:16` | spent | — |
| `alarmSessionId` | `string` (uuid) | minted at Start | → `ScheduleTimerAlarmsRequest.sessionId`, cancel call. Server never returns it | write-only | — |
| `scheduledAlarms` | `number[]` (epoch ms) | last posted boundary set | decides whether a reload re-posts alarms (memo) | spent | yes |
| `runningSince` | `number \| null` | stopwatch Start/Resume | live clock, `NowBar` `displaySeconds` | spent | yes |
| `accumulatedMs` | `number` | stopwatch Pause | live clock → `length` at save | spent | yes |
| `durationMs` | `number` | Timer → Length field / Quick Time | ring progress, `NowBar` remaining, alarm boundary. **Never sent**: only the actual length is saved | spent | yes |
| `endsAt` | `number \| null` | timer/pomodoro Start/Resume | live clock, `NowBar`, alarm `boundaryAt` | spent | yes |
| `pausedRemainingMs` | `number \| null` | timer/pomodoro Pause | resume, `NowBar` | spent | yes |
| `focusMs` | `number` | Pomodoro → Focus field / preset | phase clock, alarm boundaries. **Never sent** | spent | yes |
| `shortRestMs` | `number` | Pomodoro → Short rest field / preset | same. **Never sent** | spent | yes |
| `longRestMs` | `number` | Pomodoro → Long rest field / preset | same. **Never sent** | spent | yes |
| `focusPeriodsPerCycle` | `number` | Pomodoro → periods select / preset | phase advance, alarm `phaseTotal`; → `plannedFocusPeriods` (as product) | spent | yes |
| `totalCycles` | `number` | Pomodoro → cycles select / preset | phase advance, alarm `cycleTotal`; → `plannedFocusPeriods` | spent | yes |
| `currentCycle` | `number` | store (advance) | phase title/notification text (`:504,551`), alarm `cycleIndex` | spent | — |
| `currentFocusPeriod` | `number` | store (advance) | notification text (`:508`), alarm `phaseIndex` | spent | — |
| `isFocus` | `boolean` | store (advance) | ring colour/title via `pomodoroPhaseOf` | spent | — |
| `focusElapsedMs` | `number` | store tick | save dialog focus time; legacy fallback save (`PomodoroTimerView.vue:327`) | spent | yes |
| `restElapsedMs` | `number` | store tick | legacy fallback rest-row save (`PomodoroTimerView.vue:335`) | spent | yes |
| `segments` | `PomodoroSegment[]` | store, each phase stretch | → session `records[]` start/length/phase and `completedFocusPeriods` (`pomodoroSessionLog.ts`) | spent | yes |
| `phaseStartedAt` | `number \| null` | store | segment start, live clock | spent | yes |
| `restActivityName` | `string` | Pomodoro → rest activity | fallback rest-row save, phase title | spent | — |

### Timer alarm schedule — request only: `src/core/activityHistory/dto/request/ScheduleTimerAlarmsRequest.ts` (`POST /activity-history/timer-alarm/schedule`)
No response DTO and no status endpoint, by design (DTO header comment).

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `boundaries[].boundaryAt` | `string` (ISO UTC) | store: computed from `endsAt` / phase lengths | server only (push trigger) | write-only | yes |
| `boundaries[].phase` | `TimerBoundaryPhase` | store (`Plain` for countdown) | server only (push wording) | write-only | yes |
| `boundaries[].phaseIndex` | `number \| null` | store | server only | write-only | yes |
| `boundaries[].phaseTotal` | `number \| null` | store | server only | write-only | yes |
| `boundaries[].cycleIndex` | `number \| null` | store | server only | write-only | yes |
| `boundaries[].cycleTotal` | `number \| null` | store | server only | write-only | yes |
| `url` | `string \| null` | store (route of the owning view) | server only (`notificationclick` target) | write-only | — |

### CalendarActivityDaySummary (history calendar day) — `src/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts` · request: `CalendarActivityRequest.ts`
`dayType`, `label`, `wakeUpTime` and `bedTime` are **dayPlanner's** calendar-row data, projected into this response. They are `derived` here because nothing in this group writes them.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `date` | `string` | server | Calendar → cell header (framework `CalendarDayCellHeader.vue:11`), drill-down query (`HistoryCalendarView.vue:157`), `isToday` | derived · spent | yes |
| `dayType` | `DayType` | server (dayPlanner calendar row) | Calendar → cell border/icon chip (`_common/component/calendar/CalendarDayCellHeader.vue:5,15-20`) | derived · spent | yes |
| `dayIndex` | `number` | server | Calendar → column placement (`_common/component/calendar/CalendarGrid.vue:254`), `isWeekend` filter | derived · spent | — |
| `label` | `string \| null` | server (dayPlanner calendar row) | Calendar → header label (`CalendarDayCellHeader.vue:24-27`) | derived · spent | — |
| `holidayKey` | `string \| null` | server | Calendar → holiday name via `useHolidayLabel()` | derived · spent | yes |
| `holidayName` | `string \| null` | server | Calendar → holiday highlight class + label fallback (`CalendarDayCellHeader.vue:4,31`) | derived · spent | — |
| `wakeUpTime` | `Time` | server (dayPlanner calendar row) | Calendar → bed row (`HistoryDayCellContent.vue:13`) | derived · spent | yes |
| `bedTime` | `Time` | server (dayPlanner calendar row) | Calendar → bed row (`HistoryDayCellContent.vue:13`) | derived · spent | yes |
| `totalSeconds` | `number` | server | Calendar → total chip, empty-state decision (`HistoryDayCellContent.vue:18-26,70`; `HistoryCalendarView.vue:85`) | derived · spent | yes |
| `sessionCount` | `number` | server | Calendar → "n sessions" chip (`HistoryDayCellContent.vue:32`) | derived · spent | — |

### CalendarActivityRoleSummary (`topRoles[]`) — `src/core/historyDashboard/dto/response/CalendarActivityRoleSummary.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `roleId` | `number` | server | — (the `v-for` key is `roleName`, `HistoryDayCellContent.vue:44`) | derived · unread | — |
| `roleName` | `string` | server | Calendar → role row (`HistoryDayCellContent.vue:50`) | derived · spent | — |
| `color` | `string \| null` | server | Calendar → role dot (`:48`) | derived · spent | — |
| `totalSeconds` | `number` | server | Calendar → role duration (`:51`) | derived · spent | yes |

### HistoryWindow (stacked-bar window) — `src/core/historyDashboard/dto/response/HistoryWindow.ts` · request: `HistorySummaryStackedBarsRequest.ts`, `DetailStackedBarsRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `windowStart` | `string` (ISO UTC) | server | Summary/Detail → bar position (`useHistoryDashboard.ts:129`), drill-down date (`HistorySummaryView.vue:401`), Detail window clamp (`HistoryDetailView.vue:309-310`), chart clock bounds | derived · spent | yes |
| `windowEnd` | `string` (ISO UTC) | server | same mapping (`useHistoryDashboard.ts:130`), Summary clock bound (`HistorySummaryView.vue:389`), Detail drill range (`HistoryDetailView.vue:462`) | derived · spent | yes |

### HistoryGroupItem (stacked-bar segment) — `src/core/historyDashboard/dto/response/HistoryGroupItem.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `groupId` | `number \| null` | server | colour fallback (`historyGroupColor.ts`), cross-highlight | derived · spent | — |
| `name` | `string` | server | segment label (`activityTracking/component/stackedBars/StackedBarColumn.vue` via `useHistoryDashboard.ts`) | derived · spent | — |
| `totalSeconds` | `number` | server | segment height → `activeSeconds` (`useHistoryDashboard.ts:133`) | derived · spent | yes |
| `color` | `string \| null` | server | segment colour (`useHistoryDashboard.ts:135`) | derived · spent | — |

### HistoryPieChartItem — `src/core/historyDashboard/dto/response/HistoryPieChartItem.ts` · request: `HistorySummaryPieChartRequest.ts`, `DetailPieChartRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `groupId` | `number \| null` | server | colour, cross-highlight, `_other` detection (`HistoryGroupKey.ts`), export join (`useHistoryExport.ts:119`); `home/component/ActivityHistoryWidget.vue` (via `HistoryPieChart`) | derived · spent | — |
| `name` | `string` | server | slice/legend (`HistoryPieChart.vue:103`), insights group name, export; `home` widget | derived · spent | — |
| `totalSeconds` | `number` | server | slice size + % (`HistoryPieChart.vue:99-102,203`), selected-group panel, insights, export; `home` widget | derived · spent | yes |
| `color` | `string \| null` | server | slice colour (`HistoryPieChart.vue:205`); `home` widget | derived · spent | — |
| `entries` | `number` | server | selected-group entries (`HistoryPieChartSection.vue:71`), insights per-group pace (`useHistoryInsights.ts`), export "entries" column | derived · spent | — |

### HistoryPieTotals — `src/core/historyDashboard/dto/response/HistoryPieTotals.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `totalSeconds` | `number` | server | Period Totals card (`HistoryPieChartSection.vue:80`), insights; `home/component/ActivityHistoryWidget.vue:56` "Total tracked" | derived · spent | yes |
| `totalEntries` | `number` | server | Period Totals card (`HistoryPieChartSection.vue:87`), session-length insight | derived · spent | — |
| `uniqueGroups` | `number` | server | Period Totals card (`HistoryPieChartSection.vue:93`) | derived · spent | — |

### HistorySummaryCard (Top Activities card) — `src/core/historyDashboard/dto/response/HistorySummaryCard.ts` · request: `HistorySummarySummaryCardsRequest.ts`, `DetailSummaryCardsRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `groupId` | `number \| null` | server | card key + cross-highlight (`HistorySummaryCards.vue:75`), export join | derived · spent | — |
| `name` | `string` | server | card title (`HistorySummaryCard.vue:23`) | derived · spent | — |
| `color` | `string \| null` | server | card colour bar (`HistorySummaryCard.vue:86`) | derived · spent | — |
| `totalSeconds` | `number` | server | card total (`HistorySummaryCard.vue:87`); `cards.length` decides first-run (`historyDashboardApi.ts:382`) | derived · spent | yes |
| `averageSeconds` | `number` | server (backend assigns the *baseline* daily average, DTO comment B2) | — no read outside the DTO | derived · unread | yes |
| `percentChange` | `number \| null` | server | card ▲/▼ chip (`HistorySummaryCard.vue:48,90-99`), export "change vs baseline" column | derived · spent | — |
| `isNew` | `boolean` | server | card "NEW" chip (`HistorySummaryCard.vue:39`) | derived · spent | — |

### HistoryPeriodComparison — `src/core/historyDashboard/dto/response/HistoryPeriodComparison.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `previousPeriodTotalSeconds` | `number` | server | period banner (`HistoryPeriodBanner.vue:17`) | derived · spent | yes |
| `currentPeriodTotalSeconds` | `number` | server | period banner (`HistoryPeriodBanner.vue:15`) | derived · spent | yes |
| `percentChange` | `number \| null` | server | banner chip + colour (`HistoryPeriodBanner.vue:19,49-64`) | derived · spent | — |

### HistoryTimeOfDayHour — `src/core/historyDashboard/dto/response/HistoryTimeOfDayHour.ts` · request: `HistorySummaryTimeOfDayRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `hour` | `number` (0–23) | server | time-of-day insight band start (`useHistoryInsights.ts` `findConcentrationBand`) | derived · spent | yes |
| `totalSeconds` | `number` | server | time-of-day insight (band sums, threshold) | derived · spent | yes |
| `entries` | `number` | server | — (`useHistoryInsights` reads only `hour`/`totalSeconds` off hours; OP21 counts days from `days`, because `entries` counts records and cannot tell three days from twelve) | derived · unread | — |

### HistoryTimeOfDayResponse — `src/core/historyDashboard/dto/response/HistoryTimeOfDayResponse.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `daysInRange` | `number` | server | the "of 30 days" in the time-of-day insight (`useHistoryInsights.ts` `countBandDays`, OP21) | derived · spent | yes |
| `daysWithActivity` | `number` | server | time-of-day insight threshold (`MIN_DAYS_WITH_ACTIVITY`) | derived · spent | — |
| `days` | `HistoryTimeOfDayDay[] \| null` | server (OP21) | the "on 12" in the time-of-day insight; `null` from an older API, which falls back to the share-only sentence | derived · spent | yes |

### HistoryTimeOfDayDay — `src/core/historyDashboard/dto/response/HistoryTimeOfDayDay.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `date` | `string` (`YYYY-MM-DD`, user's clock) | server | `countBandDays`: one night per date, a post-midnight hour stepped back a day | derived · spent | yes |
| `hourMask` | `number` (bit `h` = hour `h` touched) | server | `countBandDays`: intersected with the band's hours | derived · spent | yes |

### Dashboard query parameters — request only: `ActivityDateRangeRequest.ts` + `historySummary/*`, `DetailTimelineRequest.ts` + `historyDetail/*`, `CalendarActivityRequest.ts`
These are filters, not stored data. `echo`: set by a control and shown back by the same control (URL-synced on Summary/Detail). They are listed so the reconcile pass does not mistake them for missing entity fields.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `date` | `string` | Summary/Detail → Date field, ‹/› arrows (URL `date`) | the same control | echo | yes |
| `endDate` | `string?` | Summary → custom range picker (URL `endDate`) | same control | echo | yes |
| `rangeType` | `ActivityDateRangeTypeEnum` | Summary → "Range length" (URL `range`) | same control; Window options | echo | yes |
| `groupBy` | `HistoryGroupBy` | Summary/Detail → Activity/Role/Category toggle (URL `groupBy`) | same control | echo | — |
| `windowMinutes` | `number` | Summary/Detail → "Window" select (URL `windowSize`) | same control | echo | yes |
| `windowStartTime` / `from` | `Time` | Summary "Day from" / Detail `TimeRangePicker` (URL `timeFrom`) | same control | echo | yes |
| `windowEndTime` / `to` | `Time` | same (URL `timeTo`) | same control | echo | yes |
| `baseline` | `BaselineType` | "Compared to" select (URL `baseline`) | same control | echo | yes |
| `topN` | `number` | "Show" select (URL `topN`) | same control | echo | — |
| `maxItems` | `number` | code constant (20 views, 10 home widget, `EXPORT_GROUP_LIMIT` export) | — | write-only | — |
| `CalendarActivityRequest.startDate`/`endDate` | `string` | Calendar → month/year/range navigation (not URL-synced) | `CalendarGrid` controls | echo | yes |
| `CalendarActivityRequest.topN` | `number` | code constant `3` (`HistoryCalendarView.vue:103`) | — | write-only | — |

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `HistoryPieChartItem.{groupId,name,totalSeconds,color}`, `HistoryPieTotals.totalSeconds` | historyDashboard | home → `component/ActivityHistoryWidget.vue` (through `historyDashboard/component/pieChart/HistoryPieChart.vue`, the sanctioned library) | today's history pie + "Total tracked" on the dashboard |
| running-timer session (`kind`, `activityName`, `paused`, `ended`, live remaining/elapsed) | activityHistory (store) | home → `component/NowBar.vue:251,330-363` (imports `activityHistory/store/runningTimerStore.ts` directly; also `App.vue:53,61`) | "Timer running for X — open it" chip with live countdown |
| `HistoryWindow` + `HistoryGroupItem` (mapped to `StackedBarsInputWindow`) | historyDashboard | activityTracking → `component/stackedBars/StackedBarsChart.vue` / `StackedBarColumn.vue`, imported by `activityHistory/view/HistorySummaryView.vue:142` and `HistoryDetailView.vue` | history's stacked-bar chart is rendered by the tracking module's component |
| `CalendarActivityDaySummary.dayType`, `.label`, `.wakeUpTime`, `.bedTime` | dayPlanner (calendar row; server-projected) | historyDashboard → `component/HistoryDayCellContent.vue:13`; `_common/component/calendar/CalendarDayCellHeader.vue` | sleep row and day-type marking on the history calendar |
| `ActivityHistory.activity` (`name`, `role.*`, `category.*`, `text`) | activity | activityHistory → `component/HistoryRecordItem.vue:37-80`, `view/HistoryDetailView.vue:411-419` (export) | timeline card title, role chip, category line, description shown as "notes" |

Reverse direction, writes into this group's entity: dayPlanner `component/normal/DayPlannerLogTimeController.vue:27` and todoList `component/BaseTodoListLogTimeController.vue:27` create `ActivityHistory` rows (plain rows: no session, phase or outcome). todoList `composable/useTodoListUndo.ts:6` deletes them.

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `ActivityHistory` | `ActivityHistoryResponse` (`AdhdTimeOrganizer.History/application/dto/response/ActivityHistoryResponse.cs`) | `EndTimestamp` | Client recomputes it as start + length in `HistoryRecordItem.vue:171-174` and `HistoryDetailView.vue:400-401`. Nested `Activity.IsArchived` is sent here too; whether `Activity.fromJson` keeps it belongs to the activity group |
| `ActivityHistorySession` | `ActivityHistorySessionResponse` | none | |
| `TimerPreset` | `TimerPresetResponse` (Core) | none | |
| `PomodoroTimerPreset` | `PomodoroTimerPresetResponse` (Core) | none | |
| `CalendarActivityDaySummary` | `CalendarActivityDaySummary` (History) | none | |
| `CalendarActivityRoleSummary` | `CalendarTopRoleItem` | none | |
| `HistoryWindow` | `HistoryWindow` | none | |
| `HistoryGroupItem` | `HistoryGroupItem` | none | |
| `HistoryPieChartItem` | `HistoryPieChartItem` | none | |
| `HistoryPieTotals` | `HistoryPieTotals` | none | |
| `HistorySummaryCard` | `HistorySummaryCard` | none | kept but unread: `AverageSeconds` |
| `HistoryPeriodComparison` | `HistoryPeriodComparison` | none | |
| `HistoryTimeOfDayHour` | `HistoryTimeOfDayHour` | none | kept but unread: `Entries` |
| `HistoryTimeOfDayResponse` | `HistoryTimeOfDayResponse` | none | |
| `HistoryTimeOfDayDay` | `HistoryTimeOfDayDay` | none | added by OP21 |
| `HistoryStackedBarsResponse` / `HistoryPieChartResponse` / `HistorySummaryCardsResponse` | same names | none | wrappers |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| — | — | — | Neither `history-capture/findings.md` nor `history-review/findings.md` contains any `Severity: opportunity` entry | — |

## Contradictions
1. **history-capture `usecase.md`, "`ActivityHistory.length`'s sub-minute precision" (captured but not spent).** The precision is not captured at all. It is discarded before the request: `sessionLengthFromMs` rounds to whole minutes (`src/core/activityHistory/composable/useSessionLength.ts:27`), pomodoro rows are built with `Time.fromMinutes` (`store/timerSessionRequest.ts:50`), and `Time` holds hours and minutes only (`src/_common/dto/dto/Time.ts:13-14`). Readers do read seconds when they exist (export `durationSeconds`, `HistoryDetailView.vue:405`), but they always get a multiple of 60.
2. **history-capture `usecase.md`, "Pomodoro's per-activity split… nothing shows the two as a linked pair".** In the working tree, the rows are linked by `ActivityHistory.session` and folded into one unit on the Detail timeline (`historyDashboard/composable/timelineUnits.ts:409-435`, `component/HistorySessionGroup.vue`). The doc predates the uncommitted session work. Still true for the embedded `TrackTimeDialog` path, which logs focus time only (`PomodoroTimerView.vue:280-282`).
3. **history-capture `usecase.md`, "`endedAutomatically`… thrown away at save time".** That boolean is gone. It was replaced by `outcome` (`store/runningTimerStore.ts:94-108`), which is sent (`timerSessionRequest.ts:37,67`) and spent (`HistoryRecordItem.vue:147`, `HistorySessionGroup.vue:139-144`, `HistoryDetailView.vue:431-432`). It is still thrown away on the embedded path and for sessions stored before `outcome` existed (`TimerView.vue:241`, `PomodoroTimerView.vue:323-335`).
4. **history-capture `usecase.md`, Entity lifecycle: "All four views write through the same POST… producing one `ActivityHistory` row: `activityId`, `startTimestamp`, `length`".** Timer and Pomodoro now write `POST /activity-history/session`, carrying `phase`, `kind`, `outcome` and the focus-period counts (`api/activityHistoryApi.ts:42-51`, `TimerView.vue:239-240`, `PomodoroTimerView.vue:313`). Only Stopwatch and Manual still use the single-row POST.
5. **history-review `usecase.md`, "Data this unit captures but does not spend: None found. Every response field this unit fetches is rendered".** Four fetched fields are unread: `HistorySummaryCard.averageSeconds` (no read outside the DTO; the card renders `totalSeconds`, `HistorySummaryCard.vue:87`), `CalendarActivityRoleSummary.roleId` (key is `roleName`, `HistoryDayCellContent.vue:44`), `HistoryTimeOfDayHour.entries` and `HistoryTimeOfDayResponse.daysInRange` (`useHistoryInsights.ts`, unused by design). `ActivityHistoryResponse.EndTimestamp` is also sent and dropped by `ActivityHistory.fromJson`.
6. **history-review `usecase.md` / `inventory.md`: the timeline shows "any notes" / a "category/note line".** `ActivityHistory` has no note field. The text shown is the activity's description, `record.activity.text` (`HistoryRecordItem.vue:74-80`), and the export's "notes" column is the same field (`HistoryDetailView.vue:418-419`). Every record of one activity shows the same "note".
7. **history-capture `inventory.md:199` says "not re-logged as a new finding, see O1".** `history-capture/findings.md` has no `O1` and no opportunity entries at all, so the reference dangles.

## Unsettled
None.
