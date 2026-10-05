# todo — data-map extract

> Extracted 2026-10-01 · commit `4d890646` (working tree dirty — uncommitted edits in `todoList/` and `home/` were read as they stand) · units: 09 `todo-lists`, 10 `todo-routine`, 01 `home` · modules: `todoList` (owner), `home` (reader only)
> DTO files read: 24 in `src/core/todoList/dto/` (+4 cross-module, read only to name what `home`/`todoList` consume: `dayPlanner` `DayPlan`, `PlannerStreak`, `PlannerTask`; `activityHistory` `ActivityLoggedTimeAggregate`) · fields mapped: 64 · skipped by rule: ids, join-only FKs, transport wrappers
>
> Also skipped: the nested `activity` payload's own fields (they belong to the `activity` group; one `activity` row stands for the whole object here); the filter request DTOs `TodoListFilter` / `TodoListCategoryFilter` (query parameters, not stored data); `ChangeDisplayOrderRequest` (ids only); `ToDoListKind` (client enum); the client getters `isMultipleCount` and `supportsFreeze` (computed from fields that are mapped).
>
> **"Phantom"** in a note means the client DTO declares a key the backend type does not have, so the value is always the default. Three fields are phantoms. None is classified `spent`, even where code reads it, because the read never sees a value.

## Summary

- **The list description is lost in both directions.** `TodoListRequest` sends `description` and the server binds `Text`. `TodoListResponse` sends `text` and `fromJson` reads `description`. The *Description* textarea in `TodoListForm` therefore saves nothing, and `TodoListCard` never renders a description. No unit doc noticed.
- **The routine-period "ending soon" nudge exists server-side but can't be reached from the client.** `RoutineTimePeriodResponse` sends `reminderLeadDays` ("days before the reset to nudge about unfinished items; null = no nudge") and `lastResetAt`. The client drops both. `TimePeriodRequest` sends neither `reminderLeadDays` nor `freezeBudget`, so every save from `/routine-settings` writes `reminderLeadDays = null` and resets `freezeBudget` to the server default. It is the strongest time-bearing gap in the group, and a reminder-audit candidate.
- **`unread` / `echo`:** `DailyRecapItem.timeLoggedSeconds` (per-item logged time; only the total is shown), `RoutineTimePeriod.historyDepth` (form-only on the client; the server uses it to trim `completionHistory`), and `TodoList.category` (only the edit form's prefill reads it; the card never shows which category a list is in). The two phantoms are `TodoListCategory.listCount` (never sent, so the count badge and the delete-confirm detail never render) and `RoutineTodoListItem.color` (hard-coded `null` in `fromJson`).
- **Step `note` is shown but nothing captures it.** `BaseTodoListItemSteps` renders `step.note`, and the edit path round-trips it, but `TodoListStepsFormField` has no note input.
- **The unit docs under-report how much is spent.** `suggestedTime` is shown on every row that has an estimate (`~30m` chip), summed into the list's `~time left`, and handed to the planner. A waiting-reward surface now exists for `pairedLeisureActivityId` (`EarnedRewardsStrip` on home). `suggestedDays` / `suggestedDayOfMonth` decide the "Today" marker and home's per-day filter.
- **Cross-module:** `home` is the heaviest reader. It renders `todoList`'s own row components, so every row-level field is also spent on `/`. From `dayPlanner` it reads 12 `PlannerTask` members plus the streak, and fetches `DayPlan.calendar`, stores it and never reads it. `dayPlanner` reads `todoList` back through `PlannerActivitySourcePicker` and `RoutineSidePanel`. `todoList` reads `activityHistory`'s aggregate (calibration) and `leisure`'s backlog profiles (pairing).

## Entities

### To-do list — `src/core/todoList/dto/response/TodoListEntity.ts` · request: `TodoListRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `/todo-list` → `TodoListForm` Name | `TodoListCard` title; `TodoListTitleBar` + breadcrumb on `/todo-list/:id`; delete confirm (`TodoListsView.vue:290`); `dayPlanner/component/PlannerActivitySourcePicker.vue` (list filter, row subtitle) | spent | — |
| `icon` | `string \| null` | `TodoListForm` → `IconPicker` | `TodoListCard`; `TodoListTitleBar` | spent | — |
| `description` | `string \| null` | `TodoListForm` → Description textarea | `TodoListCard.vue:28` reads it, but the value is always `null`. **Phantom**: the server sends the value as `text`, which `fromJson` drops, and binds the request's `Text`, never `description`. Nothing the user types is stored | write-only | — |
| `category` | `TodoListCategoryEntity \| null` | `TodoListForm` → Category select (sent as `categoryId`) | `TodoListForm.vue:62` (edit prefill); `TodoListCard` chip while the filter is "All" (OP17). Category filtering is server-side, by `categoryId` in the filter request | spent | — |
| `itemCount` | `number \| null` | server (one grouped count per page) | `TodoListCard` "`x / y` done" + progress bar; `TodoListsView.vue:286` decides cascade-confirm and states the count | derived · spent | — |
| `completedCount` | `number \| null` | server | `TodoListCard` "`x / y` done" + percentage | derived · spent | — |

### To-do list category — `src/core/todoList/dto/response/TodoListCategoryEntity.ts` · request: `TodoListCategoryRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `/todo-list` → `TodoListCategoryForm` Name | `TodoListCategoryPanel` rows; delete confirm (`useTodoListCategories.ts:78`) | spent | — |
| `icon` | `string \| null` | `TodoListCategoryForm` → `IconPicker` | `TodoListCategoryPanel.vue:89` | spent | — |
| `color` | `string \| null` | `TodoListCategoryForm` → colour swatches | `TodoListCategoryPanel.vue:85,97` (row background) | spent | — |
| `listCount` | `number \| null` | — | `TodoListCategoryPanel.vue:102` (count badge), `useTodoListCategories.ts:75` (delete-confirm detail). ~~**Phantom**~~: sent since OP17 (`TodoListCategoryResponse.ListCount`, also on the "Other" row; null on the copy nested in a list) | read | — |

### Task priority — `src/core/todoList/dto/response/TaskPriority.ts` · request: none (seeded lookup; `useTaskPriorityCrud` exposes `create`/`update` but no view calls them)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `text` | `string` | server seed | `TodoListFilters` priority chips; `ToDoListItemDialog` select; `leisure/component/project/ShoppingToTodoDialog.vue` and `activity/composable/useActivitySelectionFormState.ts` via `fetchSelectOptions`; `dayPlanner/component/PlannerActivitySourcePicker.vue` priority filter | derived · spent | — |
| `color` | `string` | server seed | `NormalTodoListItem` → `BaseTodoListItem` left accent bar + per-item progress fill (also on home's to-do widget) | derived · spent | — |
| `priority` | `number` | server seed | `useTodoListFilters.ts:69` (chip order), `TodoListItemEntity.frontEndSortFunction` / `sort=priority` | derived · spent | — |

### To-do item and routine item, shared fields — `TodoListItemEntity.ts` + `routine/RoutineTodoListItemEntity.ts` (both implement `interface/IBaseToDoListItem.ts`) · request: `BaseToDoListItemRequest.ts` via `ToDoListItemRequest.ts` / `RoutineTodoListItemRequest.ts`
Both kinds render through `BaseTodoListItem.vue` and share `useUndoableListCrud`. Rows below apply to both. Routine-only and normal-only fields follow in their own tables.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `activity` | `Activity` (nested) | `ToDoListItemDialog` / `RoutineToDoListForm` → Activity select (sent as `activityId`); `ShoppingToTodoDialog` (leisure) | row title on both screens and both home widgets; `dayPlanner/component/PlannerActivitySourcePicker.vue` (picker labels); `home/component/{TodoListWidget,RoutineTodoWidget}.vue` (error snackbars) | spent | — |
| `isDone` | `boolean` | checkbox / counter / last step / log-time / edit dialog; `toggle-is-done`; also flipped server-side when a linked planner task completes | strikethrough + progress everywhere; `useTodoListFilters` hideDone/overdue; `useEarnedRewardTracking` (transition earns a reward); home widgets' `done/total` + hide-done | spent | — |
| `doneCount` | `number \| null` | `TodoListItemCounter` +/− (per step, `forceValue`) | `TodoListItemCounter`, `BaseTodoListItem` progress bar, `BaseToDoList` unit-weighted bar; `home/component/RoutineTodoWidget.vue:825` group progress | spent | — |
| `totalCount` | `number \| null` | dialog "Is repeated" → `BaseTodoListRepeatCountFormField` | counter, progress, `isMultipleCount`; `home/component/RoutineTodoWidget.vue:826`; `dayPlanner/component/template/RoutineSidePanel.vue:62-65,150-152,187` ("in plan / total") | spent | — |
| `note` | `string \| null` | dialog Note field; `ShoppingToTodoDialog` (fixed handoff text) | inline under the title on every row, with a tooltip (`BaseTodoListItem.vue`, the `v-if="toDoListItem.note"` block), so also on home's to-do and routine widgets | spent | — |
| `suggestedTime` | `Time \| null` | dialog "Suggested duration" → `SuggestedTimeFormField` | `~Nm` chip on every row with a non-zero estimate (`BaseTodoListItem.vue:52`); `BaseToDoList.vue:240` "~time left"; calibration ratio (`TodoListView.vue:307`, `RoutineToDoListView.vue:249`); quick-start timer prefill (`TodoListView.vue:408`, `RoutineToDoListView.vue:269`); planner handoff (`TodoListView.vue:381`, `RoutineToDoListView.vue:259` → `dayPlanner/component/normal/PlannerTaskDialog.vue:131` sets `endTime`); `dayPlanner/component/PlannerActivitySourcePicker.vue:310` (routine items only, not normal ones); `dayPlanner/component/template/{RoutineSidePanel.vue:87-94,TemplatePlannerTaskDialog.vue:80}` | spent | yes |
| `steps` | `TodoListItemStepEntity[]` | dialog → `TodoListStepsFormField` | `BaseTodoListItemSteps` (expanded list, `x/y`); `BaseTodoListItem` progress bar | spent | — |

### To-do item, normal-only fields — `src/core/todoList/dto/response/TodoListItemEntity.ts` · request: `ToDoListItemRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `taskPriority` | `TaskPriority` | dialog Priority select (sent as `taskPriorityId`); `change-priority` PATCH | accent colour, priority filter + sort (`useTodoListFilters.ts:63-84`); `dayPlanner/component/PlannerActivitySourcePicker.vue:180` filter | spent | — |
| `dueDate` | `string \| null` (`YYYY-MM-DD`) | dialog Due date; overdue renegotiation (`useOverdueRenegotiation.ts:54`); adopted from a planner slot (`TodoListView.vue:466`) | due chip (`NormalTodoListItem` `dueDateChip`); `?due=overdue\|today` filter + `sort=dueDate`; overdue banner (`useOverdueRenegotiation.ts:34`); "no time slot" nudge + "Not scheduled" chip (`useUnscheduledNudge.ts:19`); `home/component/TodoListWidget.vue:517-520` (sort by days until due) | spent | yes |
| `dueTime` | `Time \| null` | dialog "Specific time" (defaults 09:00); adopted from planner `startTime` (`TodoListView.vue:467`) | appended to the due chip label (`NormalTodoListItem`) | spent | yes |
| `pairedLeisureActivityId` | `number \| null` | dialog "Reward when done" select (options from `leisure` backlog) | gift chip on the row (`NormalTodoListItem`), so also on home; completion snackbar (`TodoListView.vue:488`); `useEarnedRewardTracking.ts:141` → `earnedRewardsStore` → `EarnedRewardsStrip` on `home/component/TodoListWidget.vue:31` | spent | — |

### Routine item, routine-only fields — `src/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts` · request: `RoutineTodoListItemRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `timePeriod` | `RoutineTimePeriodEntity` (nested; sent as `timePeriodId`) | `RoutineToDoListForm` period select | grouping is by the *group's* period, but the item's own is read for `isRoutineSuggestedOn` (`lengthInDays`), streak config (`RoutineGroupCard.vue:51`, `home/component/RoutineTodoWidget.vue:730-731`), the cross-group move in `useRoutineItemActions`; `dayPlanner/component/PlannerActivitySourcePicker.vue:185` period filter. The nested period lacks `nextResetAt` / `completionHistory` / totals server-side (projection note in `RoutineToDoListResponse.cs`) | spent | yes |
| `streak` | `number` | server | flame + milestone icon (`RoutineTodoListItem.vue`); `useRoutineCelebration`; `dayPlanner/component/template/RoutineSidePanel.vue:76-84` | derived · spent | — |
| `bestStreak` | `number` | server | streak tooltip (`RoutineTodoListItem.vue:45`); personal-best confetti (`useRoutineCelebration.ts:31`) | derived · spent | — |
| `lastCompletedAt` | `string \| null` | server | `RoutineTodoListItem.vue:139-145` decides the grace-period warning colour. The server type is non-nullable `DateTime`, so a never-completed item arrives as `0001-01-01`, not `null` | derived · spent | yes |
| `suggestedDays` | `DayOfWeek[]` | `RoutineToDoListForm` weekday picker (periods ≤ 14 days) | weekday chips (`RoutineTodoListItem.vue`); `isRoutineSuggestedOn` → "Today" marker (`RoutineGroupCard.vue:138`) and `home/component/RoutineTodoWidget.vue:161` (shows only today's items, "+N not due today") | spent | yes |
| `suggestedDayOfMonth` | `number \| null` | `RoutineToDoListForm` day-of-month (periods > 14 days) | day-of-month chip; same `isRoutineSuggestedOn` decisions as above | spent | yes |
| `color` | `string \| null` | — | `RoutineTodoListItem.vue` passes it as the row accent. Since OP17 `fromJson` copies `timePeriod.color` (the server sends no such member) | derived · spent | — |

### Step — `src/core/todoList/dto/response/TodoListItemStepEntity.ts` · request: `TodoListItemStepRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `TodoListStepsFormField` text inputs; `ShoppingToTodoDialog` (shopping list → steps) | `BaseTodoListItemSteps` | spent | — |
| `isDone` | `boolean` | step checkbox → `PATCH …/steps/{id}/toggle` (not in the request DTO) | `BaseTodoListItemSteps` strikethrough + `x/y`; item progress bar | spent | — |
| `order` | `number` | `TodoListStepsFormField` up/down arrows (sent as the index, `fromEntity`) | only `TodoListItemStepEntity.listFromObjects`' sort, which fixes display order. That is a DTO-internal use, but it does decide what the user sees | spent | — |
| `note` | `string \| null` | **no control**: `TodoListStepsFormField` has no note input. Only round-tripped by `fromEntity`, so a note can come only from another client or the seed | `BaseTodoListItemSteps.vue:57-60` | spent | — |

### Routine time period — `src/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts` · request: `TimePeriodRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `text` | `string \| null` | `/routine-settings` → `TimePeriodForm` Name | group card titles; settings table; `home/component/RoutineTodoWidget.vue:658,698` (streak chips, group chip); `dayPlanner/component/template/RoutineSidePanel.vue:125` | spent | — |
| `color` | `string \| undefined` | `TimePeriodForm` swatches | group cards; settings table; `home/component/RoutineTodoWidget.vue:694` | spent | — |
| `lengthInDays` | `number` | `TimePeriodForm` Length (days) | timeline, heatmap, run labels, `isRoutineSuggestedOn` (daily / weekly / monthly rule), `RoutineToDoListForm` field switch, personal bests, grace calc; `home/component/RoutineTodoWidget.vue:731` | spent | yes |
| `isHidden` | `boolean` | settings-table switch (`toggle-is-hidden`); also mutated locally by the Groups selector (not persisted) | `useRoutineGroups` visibility; `RoutineToDoListView.vue:217`; `home/component/RoutineTodoWidget.vue:174,186`; `dayPlanner/component/template/RoutineSidePanel.vue:124,196` | spent | — |
| `streakThreshold` | `number` | `TimePeriodForm` Streak threshold (%) | settings table; `useStreakFreeze.ts:35,51` decides which elapsed period counts as missed (offers the freeze) | spent | — |
| `streakGraceDays` | `number` | `TimePeriodForm` Grace days | settings table; grace-period warning on items (`RoutineGroupCard.vue:51`, `home/component/RoutineTodoWidget.vue:730`) | spent | yes |
| `resetAnchorDay` | `number` | `TimePeriodForm` Reset anchor (weekday / day of month) | settings table only (`RoutineSettingsView.vue:49-50`); server uses it for `nextResetAt` | spent | yes |
| `historyDepth` | `number` | `TimePeriodForm` History depth | `TimePeriodForm` only. Also the cap in `RoutineTimePeriodEntity.mockHistory` (DTO-internal, and effectively dead: see the note below). The server trims `completionHistory` to it, so its effect is visible only as the heatmap's length | echo | yes |
| `streak` | `number` | server | `RoutineGroupStats`, `PersonalBestsPanel`; `home/component/RoutineTodoWidget.vue:664` | derived · spent | — |
| `bestStreak` | `number` | server | `RoutineGroupStats.vue:13,27`, `PersonalBestsPanel.vue:28-48`; `home/component/RoutineTodoWidget.vue:670` | derived · spent | — |
| `totalPeriodsCompleted` | `number` | server | consistency % (`RoutineGroupStats.vue:121`, `PersonalBestsPanel.vue:133`); weekly review fallback (`RoutineWeeklyReviewCard.vue:111`) | derived · spent | — |
| `totalPeriodsElapsed` | `number` | server | gates the review card, personal bests and consistency (`useRoutineGroups.ts:53`, `PersonalBestsPanel.vue:126`) | derived · spent | — |
| `nextResetAt` | `string \| null` | server | `RoutinePeriodTimeline` ("16h left · Thu", ticks) | derived · spent | yes |
| `completionHistory[].periodStart` | `string` | server | heatmap cells + history dialog; freeze target (`useStreakFreeze`, sent back on `streak-freeze`) | derived · spent | yes |
| `completionHistory[].periodEnd` | `string` | server | heatmap + history dialog tooltips; `useStreakFreeze` | derived · spent | yes |
| `completionHistory[].completedCount` | `number` | server | heatmap intensity, trend arrow (`RoutineGroupStats`), weekly review, missed-period test | derived · spent | — |
| `completionHistory[].totalCount` | `number` | server | same as `completedCount` | derived · spent | — |
| `completionHistory[].isFrozen` | `boolean` | server (set by the streak-freeze command) | heatmap third state (`RoutineGroupHeatmap`, `RoutineGroupHistoryBody`); `useStreakFreeze` | derived · spent | — |
| `freezesRemaining` | `number \| null` | server (spent via `POST …/streak-freeze`) | "N skips left" chip, `supportsFreeze` gate (`RoutineStreakFreeze.vue:62`, `useStreakFreeze.ts:44,59`) | derived · spent | — |
| `freezeBudget` | `number \| null` | **not capturable**: the server's `RoutineTimePeriodRequest` accepts it, but `TimePeriodRequest` does not send it (see *Server sends, client drops*) | freeze tooltip (`RoutineStreakFreeze.vue:70,74`) | derived · spent | — |
| `freezeBudgetResetsAt` | `string \| null` | server | freeze tooltip "refills <date>" (`RoutineStreakFreeze.vue:68-71`) | derived · spent | yes |

Note on `completionHistory`: when the server sends an empty history, `fromJson` substitutes `mockHistory(totalPeriodsElapsed, …)`, a fabricated heatmap. The server now computes `TotalPeriodsElapsed = history.Count`, so an empty history always comes with `0` and the mock returns `[]`. The fallback is effectively dead, but if the two ever disagree again the client will show invented completions.

### Daily recap — `src/core/todoList/dto/response/DailyRecap.ts` · request: none (`GET todo-list-item/daily-recap?date=`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `items[].name` | `string` | server (the activity's name) | `DailyRecapCard` item list (`/todo-list/:id`); `EarnedRewardsStrip` "earned for <task>" (`home/component/TodoListWidget.vue`) | derived · spent | — |
| `items[].timeLoggedSeconds` | `number` | server (seconds recorded against this item today) | nothing. `DailyRecapCard` shows only the total and the names | derived · unread | yes |
| `items[].itemId` | `number` | server | keys an earned reward (`earnedRewards.ts:76`) and decides resolved / waiting | derived · spent | — |
| `items[].pairedLeisureActivityId` | `number \| null` | server (copy of the item's pairing) | `earnedRewards.ts:75` decides which items earned a reward → `EarnedRewardsStrip` | derived · spent | — |
| `items[].completedTimestamp` | `Date` | server | `earnedRewards.ts` (`earnedAt`): "still waiting today" test and oldest-first order | derived · spent | yes |
| `items[].rewardTaken` | `boolean` | server (derived from history) | `earnedRewards.ts:75` hides taken rewards | derived · spent | — |
| `totalTimeLoggedSeconds` | `number` | server | `DailyRecapCard` "— Nm logged" | derived · spent | yes |

### User routine settings — `src/core/todoList/dto/response/UserRoutineSettings.ts` · request: `UserRoutineSettingsRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `routineReviewDismissedForWeekStart` | `string \| null` (`YYYY-MM-DD`) | `RoutineWeeklyReviewCard` Keep / Reduce / Pause / close → `routineReviewStore.dismissForWeek` | `useRoutineWeeklyReview.ts` `isNewWeek` decides whether the fresh-start card shows | spent | yes |

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `TodoListItemEntity` (every row field: `note`, `suggestedTime`, `dueDate`/`dueTime`, `taskPriority.color`, `pairedLeisureActivityId`, `steps`, `doneCount`/`totalCount`, `isDone`) | todoList | home → `component/TodoListWidget.vue` (renders `todoList`'s `NormalTodoListItem`) | the upcoming to-do list on `/`. Its own logic reads `dueDate` (sort), `isDone` (done/total, hide done, optimistic tick), `isMultipleCount`, `activity.name` |
| `RoutineTodoListItemEntity.suggestedDays`, `.suggestedDayOfMonth`, `.timePeriod.lengthInDays` | todoList | home → `component/RoutineTodoWidget.vue:161` (via `routineSuggestedDay.ts`) | shows only today's routine items, plus "+N not due today" |
| `RoutineTodoListItemEntity.doneCount`, `.totalCount`, `.isDone`, `.timePeriod.{streakGraceDays,lengthInDays}` | todoList | home → `component/RoutineTodoWidget.vue:730-731,825-826` | per-group and overall progress; grace warning |
| `RoutineTimePeriodEntity.{text,color,isHidden,streak,bestStreak}` | todoList | home → `component/RoutineTodoWidget.vue:658-698,174` | streak chips in the header; group chips; hidden groups skipped |
| `DailyRecap.items[]` (`itemId`, `name`, `pairedLeisureActivityId`, `completedTimestamp`, `rewardTaken`) | todoList | home → `component/TodoListWidget.vue` → `todoList/component/normal/EarnedRewardsStrip.vue` | waiting earned rewards on `/` |
| `TodoListEntity.name`, `TaskPriority.{id,text}`, `TodoListItemEntity.{activity,taskPriority.id}` | todoList | dayPlanner → `component/PlannerActivitySourcePicker.vue:180,197-216` | picking a to-do item to link to a planner task (list labels, priority filter) |
| `RoutineTodoListItemEntity.{suggestedTime,timePeriod.id}` | todoList | dayPlanner → `component/PlannerActivitySourcePicker.vue:185,310` | routine filter; `suggestedTime` sets the new task's length. For normal to-do items the picker does **not** pass `suggestedTime` |
| `TodoListItemEntity.suggestedTime`, `RoutineTodoListItemEntity.suggestedTime` | todoList | dayPlanner → `component/normal/PlannerTaskDialog.vue:131` (handed over by `TodoListView.vue:381` / `RoutineToDoListView.vue:259` through the planner store) | prefills the planner task's `endTime` |
| `RoutineTodoListItemEntity.{streak,suggestedTime,totalCount}`, `RoutineTimePeriodEntity.{text,id,isHidden}` | todoList | dayPlanner → `component/template/RoutineSidePanel.vue:62-197`; `component/template/TemplatePlannerTaskDialog.vue:80` | routine side panel in the template editor ("in plan / total", streak, duration); template task length |
| `ActivityLoggedTimeAggregate.{activityId,totalSeconds,entryCount,averageTime}` | activityHistory | todoList → `composable/useEstimateCalibration.ts` (via `activityHistory/api/activityHistoryApi.ts` `fetchActivityLoggedTimeAggregate`) → `BaseTodoListItem.vue`, `TodoListView.vue`, `RoutineToDoListView.vue` | estimate-vs-actual: per-row "/ usually Nm" suffix + tooltip; header "your estimates run about Nx" (≥ 5 comparable items) |
| `ActivityBacklogProfile.{activityId,activity.name,durationMinutes}` | leisure | todoList → `composable/useLeisurePairing.ts`, `component/normal/EarnedRewardsStrip.vue`, `component/normal/NormalTodoListItem.vue` | reward-pairing options, the row's gift chip, the waiting-reward label with its duration, the reward timer's prefill |
| `DayPlan.{tasks,hasPlan,streak}` | dayPlanner | home → `composable/useTodayPlan.ts:435-445` (fetched through **activityHistory**'s `api/calendarApi.ts` `fetchDayPlan`) | the now bar, the planner widget, the day strip, "No plan for today" |
| `DayPlan.calendar`, `DayPlan.date` | dayPlanner | home → `composable/useTodayPlan.ts:437` stores `calendar` and returns it; no widget destructures it. `date` is never read | nothing |
| `PlannerTask.{startTime,endTime,status,isBackground,color,activity.name,activity.category.{color,icon,name},skipReason,skipReasonKey}` | dayPlanner | home → `composable/useTodayPlan.ts`, `component/{NowBar,DayPlannerWidget,DayStrip,TaskActionMenu}.vue` | focus task, countdowns, missed / overrun, progress ring, strip segments, category chip, skipped-because text, transition notifications (`useTodayPlan.ts:396-419`) |
| `PlannerTask.actualStartTime` | dayPlanner | home → `composable/useTodayPlan.ts:299,320` | sent back unchanged when finishing a task (plan vs actual) — not displayed |
| `PlannerTask.todoListItemId` | dayPlanner | home → `composable/linkedTodoItemSync.ts` via `useTodayPlan.ts:277` | decides whether a status change ticks the linked to-do item, which in turn refreshes the to-do widget and the rewards |
| `PlannerTask.{location,notes,importance,actualEndTime,isFromTemplate,sourceTemplateTaskId,isDone,calendarId}` | dayPlanner | home → none (only round-tripped by `PlannerTaskRequest.fromEntity` on snooze / extend) | nothing on `/` |
| `PlannerStreak.{currentStreak,bestStreak}` | dayPlanner | home → `component/NowBar.vue:150-158,300`, `component/DayPlannerWidget.vue:40-47` | flame chip, best-streak title |
| `PlannerStreak.{today,timezone}` | dayPlanner | home → `composable/useTodayPlan.ts:385-392` | `console.warn` tripwire only, not displayed |
| `PlannerStreak.isTodayComplete` | dayPlanner | home → none | nothing (the class doc says to read it rather than compare counts; no one does) |
| `HistoryPieChartResponse.{items,totals.totalSeconds}` | activityHistory (historyDashboard library) | home → `component/ActivityHistoryWidget.vue:23,56` (+ `historyDashboard/component/pieChart/HistoryPieChart.vue`) | today's per-activity pie and "Total tracked" |
| `runningTimerStore.{activeKind,isEnded,isPaused,displaySeconds,activityName}` (store, not a DTO) | activityHistory | home → `component/NowBar.vue:338-363` | running-timer chip |

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `TodoListEntity` | `TodoListResponse` (`AdhdTimeOrganizer.TodoLists/…/TodoListResponse.cs`, base `NameTextIconResponse`) | `text` | `text` is the list description. The client reads `description`, which the server never sends, and `TodoListRequest` sends `description` where the server binds `Text` (`TodoListRequest.cs`). Lost both ways |
| `TodoListCategoryEntity` | `TodoListCategoryResponse` (base `NameTextColorIconResponse`) | `text` | Nothing on the client writes `text` either, so it is always null in practice. ~~The reverse gap: the client's `listCount` has no server member (phantom)~~ Closed by OP17 |
| `TaskPriority` | `TaskPriorityResponse` | none | — |
| `TodoListItemEntity` | `TodoListItemResponse` (base `BaseTodoListResponse`) | `displayOrder` | Items arrive already in `DisplayOrder` order, so dropping it is harmless today. The nested `activity` (`ActivityResponse`) belongs to the activity group |
| `TodoListItemStepEntity` | `TodoListStepResponse` | none | the server's step `Id` is a `Guid`; the client types it `number` (an id, out of scope here) |
| `RoutineTodoListItemEntity` | `RoutineTodoListResponse` (`AdhdTimeOrganizer.Routines/…/RoutineToDoListResponse.cs`) | `displayOrder` | `LastCompletedAt` is non-nullable `DateTime` on the server, so the client's `?? null` never applies. The nested `routineTimePeriod` deliberately omits `nextResetAt` / `completionHistory` / totals |
| `RoutineTimePeriodEntity` | `RoutineTimePeriodResponse` | `lastResetAt`, `reminderLeadDays` | Both time-bearing. `reminderLeadDays` = "days before the reset to nudge about unfinished items; null = no nudge": a server-side routine reminder the client can neither show nor set. Request side: `TimePeriodRequest` omits `reminderLeadDays` and `freezeBudget`, both on the server's `RoutineTimePeriodRequest` with `init` defaults, so every create / edit from `/routine-settings` writes `reminderLeadDays = null` and `freezeBudget = DefaultFreezeBudget` (and clamps `freezesRemaining` to it) |
| `RoutineTodoListGroupedList` | `RoutineTodoListGroupedResponse` | none | — |
| `DailyRecap` / `DailyRecapItem` | `TodoListItemDailyRecapResponse` / `DailyRecapItem` | none | kept but unread: `timeLoggedSeconds` |
| `UserRoutineSettings` | `UserRoutineSettingsResponse` | none | — |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| O1 | todo-lists | resolved (round 4, 2026-09-12) | Estimate-vs-actual calibration is fully built but had no seed data to show it. The `e2e-v2` fixture now delivers it, and the chip and header ratio have passing specs | `TodoListItem.suggestedTime`, `ActivityLoggedTimeAggregate.{totalSeconds,entryCount}` |

`todo-routine` and `home` have no `opportunity` findings (tally: 0 in both).

## Contradictions
1. **`todo-lists/usecase.md` § *Data this unit captures but does not spend*, on `suggestedTime`** says it is "not otherwise displayed as a discrete field anywhere in this unit's own views". In code, every row with a non-zero estimate shows a `~Nm` chip whether or not history exists (`BaseTodoListItem.vue:52`; `averageActual` only adds the "/ usually" suffix and tooltip). It is also summed into the list header's `~time left` (`BaseToDoList.vue:9-12,236-240`). The field is spent on the row itself.
2. **`todo-lists/usecase.md`, same section, on `pairedLeisureActivityId`**: "no view in this unit that lists 'items with a pending reward' as its own surface". That is true for `/todo-list/:id`, but the surface now exists: `EarnedRewardsStrip` (a todoList component) lists today's earned, still-waiting rewards with the task that earned each. It is mounted on home's to-do widget (`home/component/TodoListWidget.vue:31`), fed by `DailyRecap` through `earnedRewardsStore`. The gap the usecase describes is closed outside the unit.
3. **`todo-routine/usecase.md` § *Data this unit captures but does not spend*, on `suggestedDays` / `suggestedDayOfMonth`**: "nothing schedules or reminds against them within this unit". They do decide things on the client: `RoutineGroupCard.vue:138` shows a "Today" marker through `isRoutineSuggestedOn`, and `home/component/RoutineTodoWidget.vue:161` filters the dashboard to today's items through the same rule. The "nothing reminds" half still holds client-side; whether the backend reminds is for the backend audit.
4. **`home/usecase.md` § *Data this unit captures but does not spend*: "None. Every value `home` reads is either rendered directly or feeds a derived display value."** `useTodayPlan.ts:437` stores `DayPlan.calendar` and no consumer reads it. `PlannerStreak.isTodayComplete` and `DayPlan.date` are parsed and never read, and `PlannerStreak.today` / `.timezone` feed only a `console.warn` (`useTodayPlan.ts:385-392`). None of this is captured *by* home, so the claim's letter holds, but its "every value home reads" wording does not.
5. **`todo-lists/inventory.md`, *Dialogs opened from here* → `TodoListForm`**: "Confirmed working end-to-end this pass: create, rename, and prefilled reopen on edit all succeed". The Description field in that same dialog never persists. The client sends `description`, and the server's `TodoListRequest` binds `Text` (`AdhdTimeOrganizer.TodoLists/application/dto/request/TodoListRequest.cs`). The response sends `text`, which `TodoListEntity.fromJson` drops. The inventory doesn't claim description worked, but its "end-to-end" check missed that it can't.

Not a contradiction, but it settles an open question: `todo-routine/usecase.md` couldn't observe `historyDepth`'s effect. The client reads it only in `TimePeriodForm` (echo). The server trims `completionHistory` to it before sending (`RoutineTimePeriodResponse.From`: "already trimmed to `HistoryDepth` by the caller"), so its effect is the heatmap's length.

## Unsettled
None.
