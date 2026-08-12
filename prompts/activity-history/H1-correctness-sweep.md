# H1 · Correctness sweep (activityHistory + historyDashboard)

- **Scope:** both modules
- **Backend:** none
- **Model / effort:** Sonnet 5, medium — every item is located and diagnosed below; the work is applying fixes carefully, not finding them.
- **Depends on:** nothing
- **Unblocks:** everything (do this first)

---

```
Fix the following confirmed defects in src/core/activityHistory/ and src/core/historyDashboard/.
Each is a real bug with a located cause. Do NOT restructure anything — H2 deletes dead code and
H3 extracts the shared composable; overlapping with them here creates conflicts.

--- 1. A null wake-up time blanks the whole calendar month (highest impact) ---

src/_common/dto/dto/Time.ts:17 — `static fromJson(object: any) { const { hours = 0, minutes = 0 } = object }`
destructures its argument, so `Time.fromJson(null)` throws TypeError.

src/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts:37-38 calls
`Time.fromJson(json.wakeUpTime)` and `Time.fromJson(json.bedTime)` unguarded, and types both fields
as non-null `Time`. A day with no sleep record sends null, fromJson throws, and
HistoryCalendarView.vue:107 swallows it with `catch { days.value = [] }` — the user sees an empty
calendar with no error at all.

Fix: type both as `Time | null`, build them as `json.wakeUpTime ? Time.fromJson(json.wakeUpTime) : null`.
Then fix the template at HistoryCalendarView.vue:13-24, which guards with
`wakeUpTime || bedTime` and then calls `.getString()` on BOTH — so one-of-two-present still throws.
Render each independently (a dash or nothing for the missing side).

Do not touch src/_common — it is a git submodule. The guard belongs in the app-side DTO.

--- 2. Silent-failure catches ---

- HistoryCalendarView.vue:107 `catch { days.value = [] }` — an empty month is indistinguishable from
  a failed request. Let the axios interceptor surface the error (drop the catch, keep the finally) and
  keep `days` at its previous value, or render an explicit error state.
- HistoryTimeline.vue:151 `.catch(error => { console.log(error) })` — same problem, plus it logs to
  console in production. Remove it.
- The three `fetch*` functions in HistorySummaryView.vue (lines 240-286) and the three in
  HistoryDetailView.vue (lines 230-274) use `try/finally` with no `catch`: on rejection the loading
  flag clears but the previous period's data stays on screen, silently mislabelled as the new period.
  Null the corresponding `*Data` ref on failure.

--- 3. HistoryTimeline calls axios directly from a component ---

HistoryTimeline.vue:97+147 does `API.post('/activity-history/filter', request)` inline. Move it to a
named function in src/core/historyDashboard/api/historyDashboardApi.ts (alongside the other six),
returning `ActivityHistory.listFromObjects(data)`. The component also has no loading state — it
renders an empty VRow while fetching. Add a `loading` ref and a VSkeletonLoader or spinner.

--- 4. Hardcoded colours that break the light theme ---

- HistorySummaryCard.vue:28 — `style="background-color: rgb(55, 55, 55)"` on the VCardText.
- HistoryRecordItem.vue:86 — `color="white"` on the overflow VIconBtn.
Replace both with theme tokens (`color="surface-light"`, or
`rgba(var(--v-theme-on-surface), 0.05)`). Verify in both themes.

--- 5. Timer stop() receives undefined for a required boolean ---

TimerControls.vue declares `stop: []` (no payload). TimerView.vue:209 and PomodoroTimerView.vue:498
both declare `async function stop(automatic: boolean)` and bind `@stop="stop"` directly, so a manual
stop passes `undefined` into a parameter typed as required `boolean`. Give it a default
(`automatic = false`) at both call sites. Check whether this removes entries from the `npm run type-check`
baseline (72 errors, CLAUDE.md) and note the new number if so.

--- 6. Pomodoro: "Defaults" doesn't restore the defaults ---

PomodoroTimerView.vue:274-276 initialises longRestInitialTime to `new Time(0, 15)`, but
`resetPickersToDefault()` (line 566) sets it to `new Time(0, 10)`. Make them agree — define the three
defaults once as module-level constants and use them in both places.

--- 7. Pomodoro: finishing a session discards the user's configuration ---

`resetTimer()` (line 547) resets `numberOfCycles` to 2 and `numberOfFocusPeriodsInCycle` to 4, wiping
whatever the user chose or loaded from a preset. Reset only the progress counters
(currentCycle, currentFocusPeriod, isFocus, the elapsed accumulators, the timestamp refs); leave the
configuration and the three duration pickers alone.

--- 8. Small ones ---

- HistoryTimeline.vue:178 — `if (!deleteTargetId.value) return` treats id 0 as absent. Use `== null`.
- HistoryCalendarView.vue:66 — the "No activity" block is `v-else-if` on the roles-list `v-if`, so a day
  with logged seconds but no role breakdown renders an empty cell. Make the condition independent.
- HistoryCalendarView.vue:89 — the local `formatDuration` duplicates `fromSeconds` from
  `@/_common/utils/formatDuration.ts`. Delete it and import.
- HistoryDateRangeSelector.vue:68 — a stray `console.log(todayStr)`. Delete it. The variable is also
  misnamed (`todayStr` holds `dateFrom`, not today) — rename it.
- HistoryDateRangeSelector.vue:86 — `watch([selectedRangeType, dateFrom], ..., { deep: true })`; `deep`
  on a Date ref does nothing useful. Drop it.

Leave the hardcoded English alone — H5 localizes both modules and doing it here would collide.

Verify: load /activity-history, /activity-history/detail, /activity-history/calendar in both light and
dark theme; run the pomodoro through one full cycle. Run `npm run type-check` and `npm run lint`.
```
