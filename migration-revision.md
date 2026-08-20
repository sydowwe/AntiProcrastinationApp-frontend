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

### 3. 64 app-side type errors, never triaged as a group

Measured 2026-08-19 with `npm run type-check` (= `vue-tsc --build --force`). All 64 are in `src/core`; `src/_common` is at **0** and has been since R13, so any new
`_common` error is a regression, not baseline noise.

The count has drifted downward as unrelated work touched files (72 → 65 → 64) and the figure quoted in `CLAUDE.md` has been stale more than once. **Re-measure before
quoting it.** Concentrations, if someone wants to start: `activityTracking/view/DesktopSettingsView.vue` (6), then `todoList/component/routine/RoutineGroupCard.vue`,
`activity/component/NewActivityForm.vue`, `dayPlanner/view/TemplateListView.vue`, `dayPlanner/component/template/TemplatePlannerHeader.vue` (3 each). The rest is a
long tail of 1–2 per file across `todoList` and `dayPlanner`.

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
