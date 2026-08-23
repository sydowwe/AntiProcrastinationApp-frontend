# Migration revisions — open framework gaps

Things this app still cannot do the framework way, because `src/_common` (the `vue_framework` submodule) lacks the capability — plus the loose ends the migration
left behind and never came back to.

**How to close one:** commit in the framework repo first, push, bump the pointer here, then delete the app-local file and repoint its importers. Never fork a
framework file into `src/` and leave it undocumented, and never leave uncommitted edits inside `src/_common` — they are invisible to `git status` at the app root
and vanish on the next pointer bump. See CLAUDE.md's `src/_common` section for the full rule.

**Housekeeping (2026-08-19):** the resolved entries §1–§13 and R1–R21 were removed from this file. They had grown to ~800 lines of narrative about work that is
done. What was worth keeping is below under **Lessons kept**; the durable coding rules moved into `CLAUDE.md`; the ledger at the bottom maps every old §/R number to
what it was, so commit messages that cite them still resolve. The full text of any entry is in `git log -p -- migration-revision.md`.

---

## Still open

### 1. `DateTimeHelper` formats every date in Slovak, whatever the user's locale

**Local file kept:** none. `localeTag()` in `src/i18n.ts`.

Still true as of 2026-08-19 — verified against `_common/utils/DateTimeHelper.ts`, which hardcodes dayjs's Slovak locale in ten places. Every formatter is affected —
`formatToDate`, `formatToTime`, `formatToDateWithDay`, `formatWeekLabel` and, despite the name that promises otherwise, `formatLocalized(date, format)`:

```ts
export function formatLocalized(date: Date, format: string) {
	return dayjs(date).locale('sk').format(format) // ← 'sk', always
}
```

Only `getTranslatedMonths(locale = 'sk')` takes a locale at all. So an `AvailableLocales.EN` or `.CZ` user reads Slovak month and weekday names everywhere the
framework formats a date, and `formatLocalized` cannot be the answer to "format this date in the user's language" that its name and signature suggest it is.

`NowBar.vue` was working around this with `locale.value === 'EN' ? 'en-GB' : 'sk-SK'` inlined in a computed — two locales hardcoded into a ternary, in a component,
in an enum of three. That is now `localeTag()` in `src/i18n.ts`, beside the `messages` map that already enumerates the app's locales, so adding a language is one
edit in one file. It is not a fork of anything: the framework exposes no locale→BCP 47 mapping to fork.

**Upstream ask:** make the dayjs locale follow the active i18n locale rather than a literal. The shape that costs call sites nothing is a module-level
`setDateLocale(code)` the framework's own locale switch calls, with the formatters reading it — every existing call site keeps its signature and starts being
correct. A per-call optional `locale` argument would work too but leaves ~20 call sites to update by hand. Either way the framework needs the app-code → dayjs-code
mapping (`SK`→`sk`, `EN`→`en-gb`, `CZ`→`cs`), at which point `localeTag()` should move up with it and this entry resolves.

Do not confuse this with the `User.timezone` contract (framework `docs/modules/user.md`). That one is settled and deliberately _not_ a display preference; this one
is about language, and it is a real gap.

### 2. None of this has ever been loaded in a browser

The single largest risk in the file. Every entry below shipped "correct by construction" and none was observed running. R10 is the argument for caring: the bug it
fixed — fourteen tables rendering zero rows — shipped precisely because nobody opened the page.

| What                                                                     | The page to open                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 14 tables rebound from `v-model="items"` to `:items` (R10)               | every activity/leisure/tracking table, plus the two settings views                 |
| 2 calendars, fetching moved into the view (R11)                          | `dayPlanner` planner calendar, `activityHistory` history calendar                  |
| pagination page numbers, registration e-mail capture, picker label (R13) | any paginated table; the registration form; any `DateTimePicker`                   |
| Slovak day abbreviations (R15)                                           | `dayPlanner` templates + repeating-task dialog, `todoList` routine form            |
| the user-zone clock (R16)                                                | `home` (NowBar countdowns), `dayPlanner` (today marker, current-time indicator)    |
| timezone kept in sync on hydration (R17)                                 | settings → appearance, after a hydration; needs a backend                          |
| hydration on login and on boot (R18)                                     | sign in on a fresh browser profile and check a delete confirms (`askBeforeDelete`) |
| registration terms/privacy links (R19)                                   | `/registration`                                                                    |
| `firstDayOfWeek` honoured (R20)                                          | both calendars, with the preference set to Sunday                                  |
| account deletion asks intent before identity (R21)                       | settings → security; the **cancel** path in particular has never been clicked      |

### 3. 33 app-side type errors, never triaged as a group

Measured 2026-08-24 with `npm run type-check` (= `vue-tsc --build --force`). All 33 are in `src/core`; `src/_common` is at **0** and has been since R13, so any new
`_common` error is a regression, not baseline noise.

The count has drifted downward as unrelated work touched files (72 → 65 → 64 → 53) and the figure quoted in `CLAUDE.md` has been stale every time anyone checked.
**Re-measure before quoting it.** The last step down was deliberate: P2 took `dayPlanner` from 20 to **0** by fixing the store contract rather than the 20 errors
(see the header comment on `IBaseDayPlannerStore`), which is the shape the remaining clusters probably have too.

Concentrations in what is left: `todoList` (~15, mostly one mismatched `toggleCompleted` signature threaded through
`TodoListView` → `RoutineGroupCard` / `NormalTodoListItem` / `TodoListWidget`), `activityTracking/view/DesktopSettingsView.vue` (6), and
`activityTracking/component/{stackedBars,timeline}` (4 — all the same `HTMLAttributes` spread). The rest is a long tail of 1–2 per file. Note the pattern: nearly
every cluster is one contract, not N bugs.

### 4. `activityHistory` and `activityTracking` still read the browser's clock

R16 migrated `core/home` and `core/dayPlanner` onto `useUserClock` and stopped there. These two modules were never audited, so they still call `getHours()` /
`getMinutes()` / `getDay()` on a bare `Date` — the browser's zone, not `User.timezone`. Same class of bug as the one R16 fixed on home; whether it _matters_ depends
on whether either module compares a client-derived day against a server-derived one, which is exactly what nobody has checked.

`dayPlannerStore.datetimeToSlotIndex` was left alone deliberately and stays that way: zero callers, and it takes a `Date` whose instant-vs-calendar-day nature is
undetermined. Resolve the ambiguity before giving it a caller, not after.

### 5. `dateTime` mirror — a fourth instance of the shallow-spread trap, mirrored not fixed

`activityTracking` U3 adopted `_common/component/dateTime/DateRangePicker.vue` (and through it `MonthYearPicker.vue`) for the dashboards' custom range. Both resolve
~24 keys under `dateTime` — `mode`, `range`, `duration`, `anchor`, `unit`, `quantity`, `fromStart`, `toEnd`, `daysPlural`, `weeksPlural`, `dateRangeExceedsLimit`,
`startDateBeforeEndDate` and the twelve month names — **none** of which this app had. `src/locales/common.{sk,en}.ts` owns the `dateTime` namespace and is spread after
the framework's, so its `dateTime` replaced the framework's wholesale: every one of those keys rendered as a raw `dateTime.mode` string in this app, and had done since
before U3 — nobody had mounted either component here.

Mirrored by hand into `src/locales/common.{sk,en}.ts` (EN needs it independently: `EN.ts` does not spread the framework's Slovak-only `common` at all). Two knowing
divergences from the framework text: `dateRangeExceedsLimit` drops the hardcoded "31 dní" because `maxDays` is a prop and this module passes 366.

**The real fix is not a mirror.** Six namespaces collide between `common.sk.ts` and `_common/_locales/common.sk.ts`, and every framework component adopted from now on
pays this tax again. The options are a deep merge in `SK.ts`/`EN.ts` (the `user` namespace already does exactly this, explicitly, at the bottom of `SK.ts`), or moving
this app's colliding keys out of the framework-owned namespaces. Either is a contained change to two files and would close this permanently; it was out of scope for U3
and is not urgent, but it is now the fourth time this has cost someone an afternoon.

### 6. Orphaned enum locale blocks in `leisure`

`BacklogFilterPanel.vue` and `dto/enum/{LocationType,WeatherDependency,ExpectedCostTier}.ts` are gone, but the `enums.{locationType,weatherDependency,
expectedCostTier}` blocks in `_locales/leisure.{sk,en}.ts` (around lines 142/147/162) went with neither. Zero references anywhere in `src/` — verified 2026-08-19.
Cosmetic; delete them next time the file is open. Note that the _column-header_ keys of the same names (lines 8/9/14) are live and must stay — the lookup tables that
replaced the enums kept the names.

### 7. `StackedBarsChart` and `BaselineOption` are shared presentation owned by a feature module

**Local files kept:** `src/core/activityTracking/component/stackedBars/**` (6 files: `StackedBarsChart.vue`, `StackedBarsGrid.vue`, `StackedBarColumn.vue`,
`StackedBarsTooltip.vue`, `stackedBarsUtils.ts`, and `dto/{BarGridSpan,ColumnData,GridConfig,GuideLine,ProcessedWindow,TooltipData}.ts`),
`src/core/activityTracking/dto/StackedBarsInput.ts`, `src/core/activityTracking/dto/enum/BaselineOption.ts`.

**The gap.** Two presentational units live inside `activityTracking` while three modules consume them:

| Unit                                          | Consumers                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `StackedBarsChart.vue` + `StackedBarsInput.ts` | `activityTracking` (4 dashboards + `useActivityDashboard.ts`), `activityHistory` (`HistorySummaryView.vue`, `HistoryDetailView.vue`, `useHistoryDashboard.ts`) |
| `BaselineOption.ts` (`BaselineType` + `BaselineOption`) | `activityTracking` (6 request DTOs, `useActivityDashboard.ts`, `ActivitySummaryCards.vue`), `historyDashboard` (2 request DTOs, `HistorySummaryCards.vue`), `activityHistory` (2 views + `useHistoryDashboard.ts`) |

Neither names an app entity. `StackedBarsInputWindow` is `{windowStart, windowEnd, items: {name, activeSeconds, backgroundSeconds, color?, url?}[]}` — a chart
contract, not a tracker contract; the four `toStackedBarsWindow` adapters in `activityTracking/view/` are exactly the seam that proves it. `BaselineOption` is a
two-field value class over a four-value enum (`last7days` / `last30days` / `sameWeekday` / `allTime`) — a generic "compare this period against" vocabulary.

**Decision: option (a) — both belong in the framework.** Proposed paths: `_common/component/chart/StackedBars*` (+ `_common/dto/dto/chart/StackedBarsInput.ts`) and
`_common/dto/enum/BaselineOption.ts`. The prompt's option (b) — hand `StackedBarsChart` to one app module instead — was considered and rejected on the evidence
above: the chart is large (1,074 lines across the grid/column/tooltip split) but it is not app-specific, and size is not what the ownership rule is about. Nothing in
it would have to be deleted by a second app to reuse it.

**Why nothing moved today.** `src/_common` is a submodule this work could not touch, so both stay app-side until the pointer bump. The interim owner of the
`stackedBars` tree stays `activityTracking`: it is where the code originated and where 5 of the 8 consuming files live, so relocating it to `historyDashboard` would
create five new boundary crossings to remove three — and would be undone at the pointer bump anyway. `BaselineOption` is already single-owner and already reached
through a legal `dto/` path from all three modules (R5 moved it out of `component/summaryCards/`); it needs no interim action at all.

**What did land.** `StackedBarsInput.ts` moved from `component/stackedBars/dto/` to `activityTracking/dto/`. It is the chart's public prop contract, so every
cross-module consumer of the *type* was previously forced through a `component/` path — illegal by construction even though the file is a pure DTO. After the move,
the only remaining illegal import of this pair is the `.vue` component itself, from two `activityHistory` views. Seven importers repointed; `StackedBarsChart.vue`'s
relative `./dto/StackedBarsInput` became an `@/` path while it was open.

**When the pointer bumps:** move the six `stackedBars` files and `StackedBarsInput.ts` to `_common`, move `BaselineOption.ts`, repoint the 11 importers, and delete
this entry. `BaselineOption`'s display strings are built at the call site (`useActivityDashboard.ts` via `t('activityTracking.baseline.*')`), so the framework file
carries no locale keys and the shallow-spread trap in §5 does not apply.

### 7a. `historyDashboard` is a component library for `activityHistory` — a documented exception, not a violation

`historyDashboard` has no routes, no views and no locale file. It is `api/` + `dto/` + `component/`, and every one of its components is mounted by another module.
That is deliberate: it is the presentation layer for `activityHistory`'s two dashboard views, split out so the views stay readable. Recorded here so the next reader
does not re-litigate it.

The consequence for CLAUDE.md's "never reach into another module's `component/`" rule, stated exactly:

- **`historyDashboard/component/**` is importable by other `core` modules.** Today that is `activityHistory` (5 components across the two views) and `home`
  (`HistoryPieChart.vue` in `ActivityHistoryWidget.vue`). This is the sanctioned direction — a library exists to be consumed.
- **`historyDashboard` may import back into `activityHistory/component/`.** Today that is `HistoryTimeline.vue` → `EditActivityHistoryForm.vue`,
  `HistoryRecordItem.vue`. This is the narrower carve-out: the pair `activityHistory` + `historyDashboard` is one boundary unit, not two peers. Do not extend it to
  a third module — `historyDashboard` importing any other module's `component/` is a real violation.
- Everything else is unchanged. `historyDashboard`'s reads of `activityHistory/{api,dto}/` were always legal and stay legal.

This does **not** dissolve the rule for the `stackedBars` case in §7: `activityTracking` is a peer feature module with its own routes and views, so
`activityHistory` importing its `component/` is still the framework gap described above.

### 8. `useTimerNotifications` is a generic alarm owned by `activity`

**Local file kept:** `src/core/activity/composable/useTimerNotifications.ts`.

**The gap.** It is a beeping alarm and a tab-title animation: an `AudioContext` playing four tones on a loop, `document.title` alternating between two strings, and a
`visibilitychange` listener that silences both when the user comes back to the tab. Nothing in it names an activity, a history record, a route or a locale key — the
caller passes the two strings in. It is the "yes, put it in `_common`" case from CLAUDE.md almost word for word, and a second app wanting a timer would copy it
verbatim.

It sits in `core/activity/composable/`, so every consumer is a cross-module composable import — which the boundary rule forbids. Consumers today, all in
`activityHistory`: `store/runningTimerStore.ts`. (H9 moved the alarm out of `TimerView.vue` and `PomodoroTimerView.vue` and into the store, so the count went from
two to one — the coupling narrowed rather than spread, but it did not go away.)

**When the pointer bumps:** move it to `_common/composable/general/useTimerNotifications.ts` and repoint the one importer. It imports nothing but `vue`, so the move
is a file rename plus one import line; note that `_common/composable/general/` imports nothing from `modules/`, and this file would not change that. Then delete this
entry.

---

### 9. `showNotification` takes no options, so a caller cannot set a notification `tag`

**Local file kept:** the `showTimerAlarmNotification` half of `src/core/activityHistory/store/timerAlarmSchedule.ts`.
Added by H11.

> **Resolved half, kept as a lesson.** This entry originally had a second gap above this one: the reminders module can
> pause, resume and cancel a definition but binds nothing that *creates* one, so H11's first cut put a guessed
> `RegisterTimerAlarmRequest` and two `reminder-definition` routes app-side pending an answer. The answer was that a
> client may **not** register a reminder definition — `POST /reminder-definition/register` is Admin/Root ad-hoc ops
> surface — and that the reminders module has no per-reminder trigger at all: everything fires from one sweep whose
> default five-minute cadence is its firing-precision floor, which is fine for "probation ends in 30 days" and useless
> for a pomodoro. So there was never a framework gap here, only a wrong guess about which module owned the problem. The
> timer alarms are now `activity-history` routes carrying a timer-domain fact, and belong app-side permanently rather
> than pending a pointer bump. The DTO comment in `ScheduleTimerAlarmsRequest.ts` records why. **The lesson:** a doc
> comment naming an endpoint (`ReminderKeyRequest` says the key goes to "the pause / resume / cancel **(and register)**
> endpoints") is evidence that the endpoint exists, not that this app's users may call it.

**The gap.** `_common/utils/notifications.ts` exposes `showNotification(title, message)` and hard-codes `{ body: message }`. H11 needs a
`tag`: the tab's own alarm and the scheduled push for the same boundary are shown with the same tag so the platform
collapses them into one notification instead of ringing twice (the reasoning is in `timerAlarmSchedule.ts`). That forced a
near-copy of the function — permission check, registration lookup, one different line.

It is small, generic and obviously right: `showNotification(title, message, options?: NotificationOptions)`, spread
after `{ body }`, defaulting to today's behaviour when omitted. It is the "yes, put it in `_common`" case with nothing to
weigh. It was **not** done in H11 for a mechanical reason worth recording: the submodule working tree was already carrying
an unrelated uncommitted change (`modules/user/api/userApi.ts`), and CLAUDE.md's submodule workflow requires committing
inside `src/_common` before bumping the pointer — which would have swept somebody else's work-in-progress into an
`activityHistory` commit.

**When the pointer next bumps from a clean submodule tree:** add the parameter, update `_common/docs/utils.md`, and delete
`showTimerAlarmNotification`; its three call sites in `runningTimerStore.ts` become `showNotification(title, body, { tag:
alarmTag(at) })`. `alarmTag` stays app-side — it is the coordination point with this app's own push payload.

---

### 10. `getEnumSelectOptions` throws away the enum type, so every consumer casts its own `option.value`

**Local file kept:** `usePlannerTaskStatusOptions()` in `src/core/dayPlanner/dto/enum/PlannerTaskStatus.ts`. Added by P2.

**The gap.** `_common/composable/general/EnumComposable.ts` declares:

```ts
export function getEnumSelectOptions<T extends Record<string, string>>(enumObject: T, prefix: string): ValueTitleDto<string>[]
```

Every option is built from `Object.values(enumObject)`, so the values are exactly `T[keyof T]` — but the return type
widens them to `string`. The result is that a consumer holding `ValueTitleDto<string>[]` cannot pass `option.value` to
anything that takes the enum, and casts at each site instead. In `dayPlanner` that had already gone wrong: two of the
three `PlannerTaskStatus` sites wrote `option.value as PlannerTaskStatus` in the click handler, and both passed the whole
**option object** to `getPlannerTaskStatusIcon(status: PlannerTaskStatus)` one line above it — a `switch` over an object
falls through to `undefined`, so the status menus have been rendering with no icons. The cast at one site did not stop the
mistake at its neighbour; a truthful return type would have.

**The upstream ask:** `ValueTitleDto<T[keyof T]>[]`. That is a pure signature change — the runtime is already correct, and
every existing caller either ignores the parameter or currently casts it back, so nothing that compiles today stops
compiling.

**App-side today:** one documented cast, in one place, behind `usePlannerTaskStatusOptions()`. The three call sites
(`PlannerTaskBlock`, `DayPlannerView`, `PlannerTaskDialog`) now hold `ValueTitleDto<PlannerTaskStatus>[]` and cast
nothing. **When the framework signature lands:** delete the cast from the helper body — the helper itself is still worth
keeping, since it also pins the `'planner.status'` locale prefix in one place.

---

## Lessons kept

Five things the resolved entries taught that are not obvious from the code, and that cost real time to relearn.

- **A framework component's props are not the local one's props.** The deleted local `BasicTable` took `items`/`loading` as `defineModel`; the framework's takes them
  as plain required props. `v-model="items"` therefore sent `modelValue`, which lands in attrs, and the required `items` prop was **never passed** — so `TItem`
  widened to its constraint and cascaded ~27 type errors, and the tables rendered no rows at runtime. When adopting a framework component, diff the prop contract
  before assuming the call sites carry over. (R7 → R10.)
- **`ref<T>(…)` types as `Ref<UnwrapRef<T>>`, and the escape hatch matters.** Casting to `as { value: T }` silences the assignment errors and quietly destroys the
  ref-ness that vue-tsc's template unwrapping keys off, so every consumer of a slot carrying that ref errors once per field. Cast to `as Ref<T>` instead — equally
  dishonest about `UnwrapRef`, but it preserves what the template checker needs. This bit twice: `FilterPanel`'s `draft` (53 errors) and `TableGrid`'s `snapshots`
  (5). (R12, R13.)
- **Framework strings under a colliding namespace never reach i18n.** `src/locales/{SK,EN}.ts` spread shallowly, so this app's `common`, `general`, `validation` and
  three others _replace_ the framework's wholesale. Adopting framework code that resolves `t('general.something')` means mirroring that key into
  `src/locales/common.{sk,en}.ts` by hand, or users see the raw key. Caught **four** times (`validation`, `general.undoSuccess`, `calendar`, and now the whole
  `dateTime` picker vocabulary) and it will happen again. (R5, R6, R11, U3.)
- **Grep with word boundaries before declaring a symbol dead — or live.** Two files in the leftovers audit were about to be promoted into the framework on the
  strength of substring matches (`ExperienceType` matching `useActivityExperienceTypeApi`; `DateOnly` matching a trailing comment). Both were unreferenced. (R14.)
- **An entry's stated diagnosis can be wrong in a way that makes it look unfixable.** §5 recorded "the framework exposes only `dateRange`, widen the expose" — but
  the framework grid holds _no_ state to widen; it is presentational by design and the fix was app-side with no submodule bump at all. When an ask has sat unmoved
  for a while, re-read the framework source before re-filing it. (R11.)

---

## Resolved — ledger

Removed from this file 2026-08-19. Full text: `git log -p -- migration-revision.md`.

| Was                   | What                                                                                       | Closed by                       |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| §1, §4                | `useUndoStack` (`UndoEntry.date`), `useAutoScroll` (runaway scroll)                        | R6 — framework `93f20ea`        |
| §2                    | `EnumComposable` — `convertToEnum` / `getEnumKeyByValue`                                   | R8 (they were in `enumHelpers`) |
| §3                    | `RulesComposition` — `phoneNumberRule`                                                     | R5 (last call site had gone)    |
| §5                    | `CalendarGrid` — the ask was misdiagnosed; fixed app-side                                  | R11                             |
| §6                    | the `dataTable` family — `BasicTable` / `DataTable` / `MyTableFooter`                      | R7, then R10                    |
| §7                    | `FilterPanel` mistypes its `#fields` slot prop (53 errors)                                 | R12 — framework `010c981`       |
| §8                    | `TrackTimeDialog` shared between `dayPlanner` and `home`                                   | R9 — moved to `activityHistory` |
| §9, §11, §12          | `INameResponse` chain, `DayOfWeekPicker`, `hasObjectChanged`                               | R15                             |
| §10                   | `IMyResponse` — a marker constraining nothing                                              | dropped, not upstreamed         |
| §13 _(the first one)_ | the wall clock is the user's timezone and the framework could not say so                   | R16 — `useUserClock`, `b64390f` |
| R1                    | `core/scheduler` → `_common/modules/scheduler`                                             | done 2026-08-07                 |
| R2                    | `SETUP.md` never mentioned the notifications dev service worker (+ the lodash 4.18.0 pin)  | R13                             |
| R3                    | `useDialog` + `DialogHost` upstreamed; the framework's dead dialog system deleted          | done 2026-08-07                 |
| R4                    | `core/user` → `_common/modules/user` (36 of 39 files)                                      | done 2026-08-07                 |
| R13                   | the framework's last 26 type errors → 0, incl. three live runtime bugs                     | framework `bc36ba5`             |
| R14                   | the `src/` leftovers audit — dead code deleted, app-domain code moved into modules         | done 2026-08-10                 |
| R17                   | `User.timezone` kept equal to the browser's zone; the contract written into framework docs | done 2026-08-18                 |
| R18                   | hydration moved onto the login path and onto boot (`hydrateOnBoot`)                        | done 2026-08-18                 |
| R19                   | registration terms/privacy linked through app-registered routes (`legalRoutes`)            | done 2026-08-18                 |
| R20                   | `CalendarGrid` honours `firstDayOfWeek`                                                    | done 2026-08-18                 |
| R21                   | account deletion asks for intent before identity                                           | done 2026-08-18                 |

Two numbering notes for anyone reading old commit messages: **§13 was used twice** — for the wall-clock gap (closed by R16) and for the dayjs-locale gap, which is
now open item 1 above. And R15's submodule commit, recorded as "blocked, written but uncommitted", did land: `git submodule status` is clean at `3e640d1`.
