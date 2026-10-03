# leisure — data-map extract

> Extracted 2026-10-01 · commit `4d890646` · units: 11 `leisure-backlog-picker`, 12 `leisure-bucket-anchors`, 13 `leisure-projects` · modules: `leisure`
> DTO files read: 18 (6 response, 7 request incl. 4 filters, 5 enums) + `_common` `LookupResponse` · fields mapped: 40 · skipped by rule: ids, join-only FKs, transport wrappers
>
> Also skipped, on purpose:
> - **The four filter DTOs** (`ActivityBacklogProfileFilter`, `ActivityBucketListProfileFilter`, `ActivityProjectProfileFilter`, `MemoryAnchorFilter`) and `LookupFilter`. They are query criteria and are never stored. Every field is wired to a `FilterPanel` control, a filter chip and a URL key (`leisureFilterUrlState.ts`). There are no dead filter fields.
> - **`activityId` on all four profiles and on the anchor.** It is used only to join or navigate: `ExperiencedCell` deep link, the todoList pairing match, the planner commit, and the anchor filter chip's name lookup. Nothing displays it.
> - **The anchor-eligible endpoint's `SelectOption[]`** (`GET memory-anchor/anchor-eligible-activities`, B12). It is a transport wrapper. Its only consumer is `NewMemoryAnchorForm.vue:119`, which uses it as the activity picker on the unlocked create path.
> - **Request DTOs get no rows of their own.** Every request field in the four profile requests and `MemoryAnchorRequest` comes back in the matching response: a lookup `…Id` returns as the nested `{id, text}`. So there are no `write-only` fields in this group. Each entity table's *captured in* column names the form control that writes the field.

## Summary
- **No field in the group is `echo` or `write-only`, and there are only two `unread` fields.** Both are `memoryAnchorId`, on the backlog profile and on the bucket-list profile. They are server-derived, parsed, and read by nothing. The "Experienced" chip deep-links by `activityId` instead (O2's fix). Every other `unread` claim in the three usecases has since been built out: `maxParticipants` (backlog O1), `financialGoal` and `inspirationSource` (bucket O1).
- **This is the most heavily spent vocabulary in the app.** `/leisure/pick` (`leisureScoring.ts` via `useLeisurePicker.ts`) uses 14 profile fields to decide what to suggest, even where it displays nothing. Some fields count as `spent` only because of that ranking: `effortType` (variety bonus, and never displayed outside the form; `BacklogTable` has a dead `#item.effortType` slot with no column), `requiresTravel` (travel time floor), `difficultyLevel` and `comfortZoneStep` (proxy energy), `weatherDependencyCode` (weather exclusion and bonus), and `estimatedHours` (planner slot length).
- **Strongest cross-module read: todoList reads the backlog profile.** It uses `activity.name`, `durationMinutes` and `activityId` for temptation bundling: pairing options, the item chip, the earned-rewards strip, and the reward timer's length prefill. `home/TodoListWidget.vue` passes the DTO through. **The reverse read does not exist:** nothing in `src/core/leisure` reads `pairedLeisureActivityId` or any todo-item state.
- **Leisure writes into two other modules but reads little from them.** It writes into dayPlanner (`PlannerTaskRequest` from the picker commit) and todoList (a `ToDoListItemRequest` with steps from the project shopping handoff). Its only read from them is todoList/task-priority select options inside `ShoppingToTodoDialog`.
- **What the server sends and the client drops:** nested `activity` extras (`text`, `isUnavoidable`, `isArchived`, the role and category ids/names, plus `isOnTodoList`/`usageCount`/`canDelete`, which stay at their defaults on these routes), and the flat lookup `…Id` duplicates. **The flat `activityName` the group file expects is gone** (see Contradictions). A whole endpoint, `/leisure/suggestion/draw`, has no client caller.
- **Only 4 time-bearing DTO fields:** `durationMinutes`, `estimatedHours`, `anchorMonth`, `anchorYear`. The picker's `suggestionHistory` keeps a client-only, per-device, time-bearing record (see the note under Entities). It is the only "when was this last offered" data in the module, and moving it server-side is the open `D1` ask.

## Entities

### ActivityInfo (nested `activity` on all four leisure rows) — `src/core/leisure/dto/response/ActivityInfo.ts` · request: none (owned by `activity`)
The grids send a full `ActivityResponse` under `activity`. `fromJson` keeps four display fields and builds `categoryName`/`icon`/`color` with a category-then-role fallback. This is the shared base of all four profile/anchor rows, mapped once here.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | activity module (`/activity-settings`; `QuickCreateActivityDialog` inline from every leisure create form) | every leisure table/board/ladder/timeline via `ActivityNameCell.vue`; `SuggestionCard.vue` title; delete confirmations (`deleteConfirmationColumn="activity.name"`); `PlanLaterDialog`; picker commit snackbar; `ShoppingToTodoDialog` title and note; **todoList**: `composable/useLeisurePairing.ts`, `component/normal/NormalTodoListItem.vue`, `component/normal/EarnedRewardsStrip.vue`, `component/BaseTodoListLogTimeController.vue` | spent | — |
| `categoryName` | `string \| null` | activity module (category assignment) | `/leisure/pick` → `SuggestionCard.vue:19` subtitle only. Grid rows take it from `activity.category?.name` | spent | — |
| `icon` | `string \| null` | activity module (category or role icon) | `ActivityNameCell.vue` (all leisure lists); `SuggestionCard.vue` avatar | spent | — |
| `color` | `string \| null` | activity module (category or role colour) | `ActivityNameCell.vue`; `SuggestionCard.vue` avatar | spent | — |

### Backlog profile — `src/core/leisure/dto/response/ActivityBacklogProfile.ts` · request: `ActivityBacklogProfileRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `locationType` | `LookupResponse` (`{id,text}`) | BacklogView → create/edit dialog → Location select (`locationTypeId`) | BacklogTable → Location column; picker → `contextLabel` reason chip on `SuggestionCard` (`useLeisurePicker.ts:77`) | spent | — |
| `weatherDependency` | `LookupResponse` | dialog → Weather select (`weatherDependencyId`) | BacklogTable → Weather column (text). `.id` goes through `realWeatherDependencyId` into the "good today" chip (`BacklogTable.vue:114`) and into the picker's `isEligible` exclusion, `WEATHER_MATCH_BONUS` and weather reason (`leisureScoring.ts:262,329`; `SuggestionCard.vue:183`) | spent | — |
| `weatherDependencyCode` | `WeatherDependencyCode \| null` | server (`WeatherDependencyCodes.Effective` of the lookup row) | `realWeatherDependencyId` getter, which gates every weather consumer above (a `none` or unrecognised row gives `null`) | derived · spent | — |
| `energyLevel` | `EnergyLevel` | dialog → Energy select | BacklogTable → Energy column; picker `energyFit` (`leisureScoring.ts:304`) and `SuggestionCard` energy reason ("stated") | spent | — |
| `effortType` | `EffortType \| null` | dialog → Effort select | **Not displayed anywhere outside the form.** `BacklogTable.vue` has an `#item.effortType` slot but no matching column. Picker: `EFFORT_VARIETY_BONUS` (`leisureScoring.ts:339`); written to `suggestionHistory.lastCommittedEffort` on commit (`useLeisureCommitment.ts:92`) | spent (decides only) | — |
| `minParticipants` | `number` | dialog → Min people | BacklogTable → People column (`formatParticipants`); picker `isEligible` hard exclusion (`leisureScoring.ts:257`) | spent | — |
| `maxParticipants` | `number \| null` | dialog → Max people | BacklogTable → People column; picker `PARTY_TOO_BIG_PENALTY` (`leisureScoring.ts:336`) | spent | — |
| `expectedCostTier` | `LookupResponse` | dialog → Cost select (`expectedCostTierId`) | BacklogTable → Cost column. The picker's cost constraint is pushed down through the filter (`costTierIdsUpTo`) and does not read the row | spent | — |
| `durationMinutes` | `number` | dialog → Duration (default 60) | BacklogTable → Duration column; picker `isEligible`, `durationFit`, `slotMinutesFor` (planner slot length), duration reason; **todoList** `useLeisurePairing.ts` option label, `EarnedRewardsStrip.vue:106` label, `BaseTodoListLogTimeController.vue:58` timer length prefill | spent | yes |
| `isRepeatable` | `boolean` | dialog → Repeatable checkbox | BacklogTable → Repeatable icon column; `ExperiencedCell` `eligible` (only one-time rows get "I did this"); the experienced-progress denominator through filter requests | spent | — |
| `isAnchored` | `boolean \| null` | server (a memory anchor exists and `!isRepeatable`) | BacklogTable → Experienced column (`ExperiencedCell`) and row opacity; progress bar ("N of M one-time things experienced") via filtered count requests (`useExperiencedProgress`) | derived · spent | — |
| `memoryAnchorId` | `number \| null` | server (latest anchor by year/month/id) | — (grep: no read outside the DTO; `ExperiencedCell` deep-links by `activityId`) | derived · unread | — |

### Bucket-list profile — `src/core/leisure/dto/response/ActivityBucketListProfile.ts` · request: `ActivityBucketListProfileRequest.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `experienceType` | `LookupResponse` | BucketListView → create/edit dialog → Experience type (`experienceTypeId`) | BucketListTable → Experience type column; `BucketListLadder` card caption; picker `contextLabel` reason (`useLeisurePicker.ts:119`) | spent | — |
| `comfortZoneStep` | `number` (1–5) | dialog → `ComfortZoneStepper` | BucketListTable → coloured `n/5` chip; ladder rung grouping and "next rung" nudge (`BucketListLadder.vue`); picker `comfortStepAsEnergy` proxy, `COMFORT_STEP_WEIGHT`, comfort-step reason | spent | — |
| `requiresTravel` | `boolean` | dialog → Requires travel checkbox | BucketListTable → plane/house icon; picker `isEligible` travel floor (`BUCKET_LIST_TRAVEL_MIN_MINUTES`, `leisureScoring.ts:278`) | spent | — |
| `financialGoal` | `number \| null` | dialog → Financial goal | BucketListTable → Financial goal column; `SavingsGoalsReadout` "Still to save / lived of total" (`useSavingsGoals.ts`, summed over up to 200 rows) | spent | — |
| `inspirationSource` | `string` | dialog → Inspiration text | BucketListTable → Inspiration column; `BucketListLadder` card note (truncated, full text in `title`) | spent | — |
| `isAnchored` | `boolean \| null` | server (an anchor exists for the activity) | table Experienced column and opacity; ladder sort-to-bottom and nudge selection; progress bar; savings "lived" split | derived · spent | — |
| `memoryAnchorId` | `number \| null` | server | — (no read) | derived · unread | — |

### Project profile — `src/core/leisure/dto/response/ActivityProjectProfile.ts` · request: `ActivityProjectProfileRequest.ts`
`ActivityProjectProfileRequest.fromProfile` round-trips every field on each board status click. That is a request builder, not a read.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `difficultyLevel` | `DifficultyLevel` | ProjectsView → create/edit dialog → Difficulty | ProjectTable column; board card `metaLine`; picker `difficultyAsEnergy` proxy energy and its "derived" reason | spent | — |
| `projectArea` | `string` | dialog → Area | ProjectTable column; board `metaLine`; picker `contextLabel` reason | spent | — |
| `estimatedHours` | `number` | dialog → Est. hours (`VNumberInput`) | ProjectTable column; board `metaLine`; picker `maxUsefulMinutes` → `slotMinutesFor`, which sets the booked planner task length (`useLeisurePicker.ts:87`). Deliberately not an eligibility gate | spent | yes |
| `isMessy` | `boolean` | dialog → Messy checkbox | ProjectTable icon + sr-only text; board broom icon. Display only, no logic reads it | spent | — |
| `materialsNeeded` | `string[]` | dialog → `VCombobox` chips | board `NeedsShopping` blocker line (first 3, "+N more"); `ShoppingToTodoDialog` → becomes todo **steps** (written into todoList) | spent | — |
| `requiredTools` | `string[]` | dialog → `VCombobox` chips | same as `materialsNeeded` | spent | — |
| `readinessStatus` | `ReadinessStatus` | dialog → Readiness select; board one-click status buttons | board column grouping and counts; ProjectTable column; gates the "Add to to-do list" button (NeedsShopping only); picker excludes `NeedsShopping` server-side (`useLeisurePicker.ts:202`) and in `isEligible`, plus `READINESS_WEIGHT` | spent | — |

### Memory anchor — `src/core/leisure/dto/response/MemoryAnchor.ts` · request: `MemoryAnchorRequest.ts`
Own endpoint family `memory-anchor/*` (grid, CRUD, plus B12's `anchor-eligible-activities` for the unlocked picker). It is created from MemoryAnchorsView "Add" (unlocked) or from "I did this" on backlog/bucket rows (`useAnchorCapture`, activity locked). `periodKey` is a client getter (`year*100+month`) and is used as the table's sort column key.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `anchorMonth` | `number` | `MemoryAnchorForm` → Month (prefilled with the current month in the user's zone) | MemoryAnchorTable → Month column (`formatPeriod`, `Intl` long month); timeline month grouping, year-strip cells, month filter | spent | yes |
| `anchorYear` | `number` | form → Year | MemoryAnchorTable Month column; timeline year navigator, year picker list and per-year counts (`MemoryAnchorTimeline.vue:239,260,280`) | spent | yes |
| `highlightNote` | `string` | form → Highlight textarea | MemoryAnchorTable → Highlight column; timeline month rows show the full text | spent | — |
| `rating` | `number` (1–10) | form → Rating | MemoryAnchorTable coloured `n/10` chip; timeline swatch intensity, month "best" shading, in-month sort (`MemoryAnchorTimeline.vue:267,294-310`) | spent | — |
| `hasBacklog` | `boolean` | server (the activity has a backlog profile) | MemoryAnchorTable Source chip; timeline per-anchor chip and per-year source breakdown (`MemoryAnchorTimeline.vue:333`) | derived · spent | — |
| `backlogIsRepeatable` | `boolean \| null` | server | same as `hasBacklog` (`=== false` test) | derived · spent | — |
| `hasBucketList` | `boolean` | server | same (Source chip, which deep-links to the bucket list by `activityName`; timeline breakdown) | derived · spent | — |

### Leisure lookup row (location type, weather dependency, experience type, cost tier) — `src/_common/dto/response/general/LookupResponse.ts` · request: `src/core/leisure/dto/request/LookupRequest.ts`
Four endpoints: `activity-location-type`, `activity-weather-dependency`, `activity-experience-type`, `activity-expected-cost-tier`. **No client surface captures them.** `activityLookupApi.ts` exposes `create`/`update`/`patch`/`deleteEntity`, but every consumer uses `fetchAll` only, `LookupRequest` is never constructed, and no `LookupEditTable` is mounted for them. The rows come from the server or seed.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `text` | `string` | server/seed only (no client capture surface) | backlog and bucket-list form selects; Backlog/BucketList filter selects; picker "More constraints" selects; profile table columns (via the nested copy) | spent | — |
| `sortOrder` | `string` (server: `int`) | server/seed only | `costTierIdsUpTo` (`useLeisurePicker.ts:130`) turns "spend at most X" into the set of acceptable cost-tier ids. It compares `String()`s, so `10` sorts before `2`; the server type is `int` (see Contradictions) | spent (decides only) | — |

### Weather fit — `src/core/leisure/dto/response/WeatherFit.ts` · request: none (`GET /leisure-weather-fit`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `matchingWeatherDependencyIds` | `number[]` | server (today's weather × the user's location setting) | BacklogTable "good today" chip (`fitsToday`); picker `isEligible` exclusion, bonus and weather reason. An empty list is collapsed to `null` at the API boundary (`leisureWeatherApi.ts`) | derived · spent | — |

> **Not a DTO, so not counted: the picker's `suggestionHistory`** (`composable/suggestionHistory.ts`, user-scoped `localStorage` key `leisure.picker.history`). `suggestedAt: Record<candidateKey, ISO instant>` (**time-bearing**, pruned after 90 days) is written on reroll and on commit. `lastCommittedEffort` is written on commit. Both are read only by the picker's ranking (`stalenessScore`, effort variety). The record is per-device. Moving it server-side is the open ask in `prompts/leisure/backend/D1-backend.md`.

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `ActivityBacklogProfile.activity.name` | leisure (name owned by activity) | todoList → `composable/useLeisurePairing.ts`, `component/normal/NormalTodoListItem.vue:64-68`, `component/normal/EarnedRewardsStrip.vue:104`, `component/BaseTodoListLogTimeController.vue:58-61` | temptation-bundling pairing select options, the paired-reward chip on a to-do item, the earned-reward strip label, and the reward timer's activity |
| `ActivityBacklogProfile.durationMinutes` | leisure | todoList → `composable/useLeisurePairing.ts` (option label), `component/normal/EarnedRewardsStrip.vue:106` (label), `component/BaseTodoListLogTimeController.vue:63` (timer length prefill) | so a paired reward is offered and started with the length the user filed |
| `ActivityBacklogProfile.activityId` (join) | leisure | todoList → `composable/useLeisurePairing.ts` `pairingFor()` / option value | matches `TodoListItemEntity.pairedLeisureActivityId` to a backlog row (join only) |
| `ActivityBacklogProfile` (whole DTO, type import) | leisure | home → `component/TodoListWidget.vue:86,182` | passes the paired profile from the strip to `openLeisureReward` |
| `Activity.name`, `role.icon/color`, `category.name/icon/color` | activity | leisure → `component/ActivityNameCell.vue`, `component/picker/SuggestionCard.vue` (through `ActivityInfo.fromJson`) | activity identity on every leisure list and suggestion card |
| todo list names, task-priority names (`SelectOption`) | todoList | leisure → `component/project/ShoppingToTodoDialog.vue:75-76,104` (`todoListApi`/`taskPriorityApi` `fetchSelectOptions`) | target list and priority for the shopping-list handoff, plus the success snackbar's list name |
| `TodoListItemEntity.pairedLeisureActivityId` | todoList | **none in leisure** (grep `paired` under `src/core/leisure`: no match) | leisure never reads back which backlog items are paired as rewards. The pairing is visible only on the todo side |

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `ActivityBacklogProfile` | `ActivityBacklogProfileResponse` (`AdhdTimeOrganizer.ActivityProfiles/application/dto/response/`) | `locationTypeId`, `weatherDependencyId`, `expectedCostTierId` (flat duplicates of the nested `{id,text}`); `activity.text`, `activity.isUnavoidable`, `activity.isArchived`, `activity.role.{id,name,text}`, `activity.category.{id,text}`; `activity.isOnTodoList`/`usageCount`/`canDelete` (always at their defaults on this route) | **No flat `activityName` any more**: the backend docblock (lines 17-22) records its removal, and B6's close-out says "gone, with no alias". Server `IsAnchored` is a non-null `bool`, so the client's `null` = "API does not carry it yet" branch is now unreachable |
| `ActivityBucketListProfile` | `ActivityBucketListProfileResponse` | `experienceTypeId`; same `activity.*` extras | same `IsAnchored` note |
| `ActivityProjectProfile` | `ActivityProjectProfileResponse` | `activity.*` extras only | `isOnTodoList` is structurally present but not set by any profile projection. It cannot back the O1 "already on a list" guard (see Contradictions) |
| `MemoryAnchor` | `MemoryAnchorResponse` | `activity.*` extras only | `memory-anchor/{id}` leaves `hasBucketList`/`hasBacklog`/`backlogIsRepeatable` at their defaults by design (B6). Only the grid fills them |
| `LookupResponse` (`_common`) | `LookupResponse<TEntity>` (framework) | none | `SortOrder` is `int` server-side, `string` client-side. The nested lookups on profile rows are `SelectOptionResponse` (`{id,text}`, no `sortOrder`), so the client's nested `sortOrder` is always `undefined`, and nothing reads it |
| `WeatherFit` | `LeisureWeatherFitResponse` | none | — |
| *(no client DTO)* | `LeisureSuggestionDrawResponse` (`DrawLeisureSuggestionEndpoint.cs`, item `activity: ActivityInfoResponse`) | the whole response | **The endpoint has no client caller.** `/leisure/pick` ranks client-side over the three grids. `ActivityInfo.fromJson`'s flat branch is exercised only by `activityInfoNestedShape.test.ts` |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| O1 | leisure-backlog-picker | fixed and verified (2026-09-25) | `maxParticipants` captured on every backlog entry and spent nowhere | `ActivityBacklogProfile.maxParticipants` |
| O2 | leisure-backlog-picker | fixed and verified (2026-09-24), by `activityId`, not by `memoryAnchorId` | the "open anchor" link navigates by activity name, not the id it already has | `ActivityBacklogProfile.memoryAnchorId` (still unread), `ActivityBacklogProfile.activityId`, `MemoryAnchorFilter.activityId` |
| O1 | leisure-bucket-anchors | built and verified (2026-09-24) | `financialGoal`, `inspirationSource` and the anchor's source flags are captured but never spent | `ActivityBucketListProfile.financialGoal`, `ActivityBucketListProfile.inspirationSource`, `MemoryAnchor.hasBacklog`, `MemoryAnchor.backlogIsRepeatable`, `MemoryAnchor.hasBucketList` |
| O1 | leisure-projects | fixed and verified (2026-09-25) | `activity.isOnTodoList` rides on every response unread; P1's shopping-list-to-todo handoff never built | `ActivityInfo` (`isOnTodoList`, not parsed), `ActivityProjectProfile.materialsNeeded`, `ActivityProjectProfile.requiredTools`, `ActivityProjectProfile.readinessStatus` |

## Contradictions
1. **Group file vs. code: the flat `activityName`.** The group file says B7 records that "the API also sends a flat `activityName` which the client never reads", and asks for that row to be confirmed. **It cannot be confirmed: the member no longer exists.** `ActivityBacklogProfileResponse.cs:17-22` documents its removal, none of the four responses declares an `ActivityName`, and B6's 2026-09-13 close-out (item 1) says "The flat `activityName` is gone, with no alias", which B7 §2's close-out repeats. The "server sends, client drops" row for the backlog grid is now the nested `activity.*` extras and the flat lookup `…Id`s, not `activityName`.
2. **backlog-picker usecase, "captures but does not spend": `maxParticipants`.** It is now spent: `BacklogTable.vue` People column (`formatParticipants`) and `leisureScoring.ts:336` `PARTY_TOO_BIG_PENALTY`. O1 is closed.
3. **backlog-picker usecase: `memoryAnchorId` / "`ExperiencedCell` navigates by `activityName`".** Half stale. `ExperiencedCell.vue` `openAnchor()` now pushes `query: { activityId }`. The other half still holds: `memoryAnchorId` is read nowhere.
4. **backlog-picker inventory, BacklogView table surface.** It lists the columns as "Activity, Location, Weather, Energy, Cost, Duration (min), Repeatable activity, Experienced". The code also has a **People** column (`BacklogTable.vue` `minParticipants`, added by O1). It has **no Effort column**, even though an `#item.effortType` slot is defined, so `effortType` is never displayed outside the edit form.
5. **bucket-anchors usecase: `financialGoal` and `inspirationSource` are unspent, and Inspiration renders "—".** Both are now spent: `SavingsGoalsReadout`/`useSavingsGoals.ts`, the `BucketListLadder.vue` inspiration line, and the table column (B3 is fixed).
6. **bucket-anchors usecase: the anchor's `hasBacklog`/`backlogIsRepeatable`/`hasBucketList` "only purpose … choosing which source chip to render".** They now also drive the timeline's per-year source breakdown (`MemoryAnchorTimeline.vue:332-333`).
7. **projects usecase and findings O1: `activity.isOnTodoList` looks like purpose-built groundwork, and the handoff should be "guarded by `isOnTodoList`".** The field is never populated on these rows. `ActivityResponse.Projection` and all four profile projections omit it, so it is always `false`; `ActivityInfo.ts:22` and B6 both say not to read it there. The shipped handoff relies on the server's `(UserId, ActivityId, TodoListId)` unique index and a 409 instead (`ShoppingToTodoDialog.vue:134-150`).
8. **projects usecase: "Nothing else in the app links into this view; it is not referenced from the picker".** That holds for navigation only. The picker fetches project profiles as a suggestion source (`useLeisurePicker.ts:220`) and reads `difficultyLevel`, `projectArea`, `estimatedHours` and `readinessStatus`.
9. **Glossary, Leisure vocabulary: "Each has `activityId` as its identity — `get id() { return this.activityId }`".** Stale. All three profile DTOs now carry the row's own `id` (`ActivityProjectProfile.ts:9-11` explains why the getter was removed). The same stale claim survives in the docblock of `src/core/todoList/composable/useLeisurePairing.ts`: "A backlog profile's `id` **is** its `activityId`". That code reads `activityId`, so it still behaves correctly.
10. **Glossary: the backlog profile has `isOneTime`, and `MemoryAnchor` carries `backlogIsOneTime`.** Both names are gone. The fields are `isRepeatable` and `backlogIsRepeatable` (`ActivityBacklogProfileRequest.ts:21-26`, `MemoryAnchor.ts:14-19`).
11. **`ActivityInfo.ts:15` and B6 item 4: `/leisure/suggestion/draw` is what `/leisure/pick` uses.** The server endpoint exists (`DrawLeisureSuggestionEndpoint.cs`), but the client never calls it. The picker ranks client-side (`useLeisurePicker.ts:218-224`, `leisureScoring.ts`).
12. **Type mismatch (code vs. server, not a doc): `LookupResponse.sortOrder`.** It is typed `string` client-side and `int` server-side (`framework/.../LookupResponse.cs:640`). `costTierIdsUpTo` sorts with `String(a).localeCompare(String(b))`, which orders `10` before `2` once a user has ten or more cost tiers.

## Unsettled
None.
