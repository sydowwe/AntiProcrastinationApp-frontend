# Fix queue

> Built 2026-09-14 · commit `6aac48bb` (working tree carries the untracked `docs/views/auth/`,
> `docs/views/history-capture/`, `docs/views/history-review/`, `docs/views/user-settings/`,
> `docs/views/planner-day/`, `docs/views/tracking-dashboards/` and their six draft specs) · units
> triaged: `_shell`, `home` (1), `todo-lists` (9), `todo-routine` (10), `leisure-projects` (13),
> `tracking-settings` (6), `activity-settings` (2), `history-review` (3), `user-settings` (14),
> `history-capture` (4), `auth` (15), `planner-day` (7), `tracking-dashboards` (5) · findings
> considered: 122 · batches: 63

> **Eleventh pass, 2026-09-14, commit `6aac48bb` — unit 5 `tracking-dashboards` absorbed.** Scoped by
> the operator to that unit; nothing outside the sections naming it was re-read, and `F1`–`F44` /
> `FW1`–`FW17` stand as the tenth pass left them, with two touch-ups where earlier batches had
> pre-judged this module: **`F30`'s `activityTracking` half is withdrawn** (§80 — the *"View details
> for X"* label is honest on three of the four dashboards, which open a detail panel, and
> `ActivityDomainCard.vue:10-11` has had Enter/Space handlers since 2026-08-20; the one dashboard where
> the label lies is Android, and `F47` makes it true rather than renaming it), and `F29`'s *"unit 5 has
> not run"* note is closed out. Five findings (0 · 2 · 2 · 0 · 0 · 1 — the unit's tally matches its
> body) became **four app-side batches (`F46`–`F49`)**, no framework batch, and one escalation (§10)
> found from source, not from the unit. `F45` stays reserved for the template-picker item. Every
> finding was read against source — the API's too, which is where `B2` narrowed (§79): the Android
> pie row is `Seconds == TotalSeconds` by construction and carries no per-app session count, so the
> finding's pass condition (*"active seconds and session count"*) is not on the wire and the batch
> is a local detail panel from what *is*. Two things the unit stood next to and did not file are
> batched with the evidence labelled (`F48`): the Total/Active/Background radio on the Android pie is
> a no-op (`pieSegments` reads only `totalSeconds`; source-certain), and the Android timeline renders
> an Active/Background legend for a source that passes `backgroundSessions: []` (observed — the
> unit's own draft spec comments on it at `:103-105`). `B1` and `A2` are one batch (`F46`): the same
> close button hand-rolled three times, wrong icon set on one, no name on another. `A1` grew by three
> call sites in `todoList` (`F49`). `U1`'s premise — *"no network fault injection available via
> `playwright-cli`"* — is wrong (§82): `route --status=500` exists, `F27`'s verification already uses
> it, and this module is the pattern `F27` copies, so the two retests share a session. The 122 above
> is 117 + 5.

> **Tenth pass, 2026-09-14, commit `6aac48bb` — unit 7 `planner-day` absorbed.** Scoped by the
> operator to that unit; nothing outside the sections naming it was re-read, and `F1`–`F40` /
> `FW1`–`FW13` stand as the ninth pass left them, with two touch-ups: `FW2` **grows by four
> controls** (the finding it absorbs, plus three more in the two files this pass had open), and
> *Escalations* §8 gains the second observation of the holiday strip. Seven findings (0 · 6 · 1 · 0 · 0 · 0
> — the unit's tally matches its body) became **four app-side batches (`F41`–`F44`) and three
> framework batches (`FW15`–`FW17`)**, no new escalation. `FW14` stays reserved for `auth/U1`, `FW10`
> for the `TimePicker` minute-60 item. Every finding was read against source — the API's too, for
> `B5`'s date contract and the calendar seeder's span — and three of the six `bug`s were filed against
> the wrong layer (*Contradictions* §70–§76): `A1`'s arrows are not in `CalendarGrid` but three
> components down in `MonthYearPicker`; `B3`'s "extend `useCalendarUrlState`" cannot be done app-side
> because the state it would encode lives in two framework components' private `ref`s, so it splits by
> rule 1 (`FW16` exposes, `F44` encodes); and half of `B5` is not a defect — `PlannerTaskLinkView`
> catches, and the console line the unit read as an uncaught exception is the interceptor's own
> `console.error`, logged by design for every failed request. `B2` grew from one dialog to **three
> labelled call sites**, two of them the History summary's *From*/*To* pair, which unit 3 recorded as
> `textbox "Date"` and its draft spec now pins as expected (§71). `B4` is the sixth pass's
> `history-review/B4` seen from the other consumer — merged into §8, `bug` → `polish` for the reason
> §30 already gave. **One framework defect the unit was briefed on, re-confirmed live, and did not file
> is batched anyway** (`FW17`): the selection `ActionBar` is centred on the viewport, not the content
> box, so *Delete* sits under the nav drawer at 1280×720 — two specs in `dayPlanner.spec.ts` have been
> `fixme`d on it since before the sweep and no queue has carried it. The 117 above is 110 + 7.

> **Ninth pass, 2026-09-14, commit `6aac48bb` — unit 15 `auth` absorbed.** Scoped by the operator to
> that unit; nothing outside the sections naming it was re-read, and `F1`–`F38` / `FW1`–`FW8` stand as
> the eighth pass left them, with three touch-ups where unit 15 landed on text that anticipated it
> (`FW7` closes two more findings, `FW8`'s pre-emption is confirmed, `F38`'s "for unit 15 to file"
> bullet now points at the batches that take those lines). Seventeen findings (1 · 5 · 1 · 3 · 1 · 6 —
> the unit's tally matches its body) became **two app-side batches (`F39`, `F40`) and four framework
> batches (`FW9`, `FW11`–`FW13`)**, no escalation. `FW9` reuses the number the fifth pass reserved
> for the `BasicTable` dialog, which was fixed straight into `vue_framework` without ever becoming a
> batch; `FW10` stays reserved for the `TimePicker` minute-60 item. Every finding was read against
> source — the API's too, which is where the unit's blocker doubled (*Contradictions* §58): the
> forgotten-password request omits `recaptchaToken` **and the reset link it would trigger points at a
> `/reset-password` route that exists in no repo on this side** — so `X1`'s one-line fix moves the
> failure from the first step to a blank page at the second. Two of the unit's mechanisms were wrong
> one layer down (§62, §64): `P2`'s 401 is not an un-aborted request but `resetAppState()` *creating*
> `routineReviewStore` on logout, which the Pinia plugin answers by calling `ensureLoaded()`; and `U6`'s
> "stuck spinner" cannot happen because `showSnackbar` hides the loader by default — settled, no defect.
> `O1` is **re-graded `opportunity` → `bug`** (§63): the API registers an always-pass reCAPTCHA
> locally and its own doc comment assumes the client sends an empty token, so Registration's
> fail-closed guard is the only thing making local registration impossible — and it is why `U1`, `U5`
> and half of `U2` could not be exercised. `B2` and `A1` are `FW7`'s adjacent and its finding
> respectively, now observed (§65). `B3` drops to `polish` (§59): the interceptor already covers every
> status it says is silent; what is left is the network case and a dead 404 branch. `FW8`'s
> pre-emption worked — the unit read the note and did not re-file the three buttons (§66). The 110
> above is 93 + 17.

> **Eighth pass, 2026-09-14, commit `c4b984ca` — unit 4 `history-capture` absorbed.** Scoped by the
> operator to that unit; nothing outside the sections naming it was re-read, and `F1`–`F34` /
> `FW1`–`FW8` stand as the seventh pass left them — with one exception, a one-bullet warning added to
> `F4`, whose suggested keys this pass found do not exist (§55). Five findings (0 · 3 · 0 · 1 · 0 · 1 —
> the unit's tally matches its body) became **four app-side batches (`F35`–`F38`)**, no framework batch
> and no escalation. Every finding was read against source, and each of the three `bug`s grew (*Contradictions*
> §48–§56): `B1`'s missing key is one of **three** the same per-consumer mirror leaks — `general.from` /
> `general.to` render raw on every `TimeRangePicker` in the app one toggle-click away, and the mirror
> has now failed four times, so `F35` recommends the deep-merge `SK.ts` already uses for `user` instead
> of a fifth patch; `B2`'s three call sites are **eight `<TimePicker>` tags in six files**, and the
> server's own default preset (*Short Sprint*, 3-minute rest) is a value the client's preset editor
> cannot re-enter; `B3`'s phantom close button is worse **inside** edit mode than outside it — Vuetify's
> close handler `stopPropagation`s, so clicking the pencil hides the chip and never opens the editor
> (source-certain, unobserved). `P1`'s claim that the Pomodoro view logs too is wrong (only `TimerView`
> mounts the component), and its fix grows to the lint rule that should have caught it: `no-console` is
> configured `off` *with* an allow-list. `U1` stays `unverified` — its double-submit half is
> source-certain, its reset half is unsourced. One framework defect found in passing and **not** batched
> (rule 5): `TimePicker` snaps `:58`/`:59` to minute **60** at any interval above 1 — under *Needs
> verification*, `FW10`-if-confirmed. The unit's inventory cites two finding ids (`A1`, `B4`) that its
> `findings.md` does not contain (§49). The 93 above is 88 + 5.

> **Seventh pass, 2026-09-14, commit `5e42b813` — unit 14 `user-settings` absorbed.** Scoped by the
> operator to that unit; nothing outside the sections naming it was re-read, and `F1`–`F32` /
> `FW1`–`FW6` stand as the sixth pass left them. Nine findings (0 · 2 · 1 · 1 · 0 · 5 — the unit's tally
> matches its body) became **two app-side batches (`F33`, `F34`) and two framework batches (`FW7`,
> `FW8`)**, plus one three-part escalation (§9). Every finding was read against source this pass —
> the API's too, which is where the unit's one `bug` turned out to be three server-side gaps *and* a
> client-side one it said did not exist (*Contradictions* §39): the connect leg never sends the OAuth
> `state` the validator requires, the state cookie is set on a path the `/api`-prefixed route can never
> match, and the dev `RedirectUri` points at port 5173. The other `bug` (`B2`) is **re-graded
> `unverified`**: the "silent" callback view has had the error branch since it was written
> (`GoogleCalendarCallbackView.vue:20-23`), and the evidence is a negative `find` at an unmeasured delay
> against a 3-second toast (§38). Three of the five `unverified` items are settled from source without a
> browser (§42–§44): the delete-account flow *does* have the intent step the unit thought was missing,
> the password-mismatch message is a locale key **nobody defined** (raw `user.passwordsDontMatch`, folded
> into `FW7`), and the language switch rides the same watcher the unit verified live for the theme.
> `P1` grew from two buttons to six in the same framework module (three of them on unit 15's signed-out
> views, pre-empted) plus one app-side twin the unit compared against and called correct (§41). The 88
> above is 79 + 9.

> **Sixth pass, 2026-09-14, commit `adc9c67f` — unit 3 `history-review` absorbed.** Scoped by the
> operator to that unit; nothing outside the sections naming it was re-read, and `F1`–`F25` / `FW1`–`FW5`
> stand as the fifth pass left them. Eleven findings (0 · 4 · 2 · 3 · 0 · 2 — the unit's tally matches its
> body) became **seven app-side batches (`F26`–`F32`) and one framework batch (`FW6`)**, plus one
> escalation (§8) that is a design decision rather than a defect. Every finding was checked against source
> this pass — the API's too, which is what settled `B4` — and four root-cause guesses were overturned
> (*Contradictions* §27–§34): the clipped banner is Vuetify's `flex: 1 1` basis, not `flex-shrink`; the
> "in-hole" legend is a left-anchored box overlapping a 300 px canvas; the holiday names are a country
> table's proper nouns, not a localization gap; and the error-vs-empty gap is **wider** than filed — two
> more fetch owners have no `catch` at all and leave the *previous* period's rows on screen. The pattern
> `F27` needs is already built one module over (`useActivityDashboard`), and `StackedBarsChart` already
> takes the `error` prop the history views never pass. Two things changed outside the unit: **`F24` and
> `F25` are applied in the working tree** (uncommitted — `useRoutineDateFormat.ts` is untracked, zero
> `toLocaleDateString(undefined` calls remain outside it, and the Color header resolves
> `routineTodoList.timePeriods.color`), so both move to *Awaiting retest*; and the `FW6` name the fifth
> pass reserved for the unobserved `BasicTable` dialog defect is **taken by `A2`** — that item is now
> `FW7`-if-confirmed (→ `FW9` after the seventh pass took `FW7`/`FW8`). The 79 above is 68 + 11.
>
> ~~⚠️ **Unit 14 `user-settings` is also on disk and is NOT triaged here**~~ — **superseded by the seventh
> pass above.** (Kept for the audit trail: the operator scoped the sixth run to `history-review`; unit 14
> waited one run, the way `activity-settings` waited through the third.)

> **Fifth pass, 2026-09-14, commit `df2b163d` — unit 10 `todo-routine` re-absorbed after its round 5.**
> Scoped by the operator to that unit; nothing outside the sections naming it was re-read, and the fourth
> pass's `F18`–`F23` / `FW5` stand as written. Two passes ran **concurrently on this file** — the fourth
> pass was still writing its batch bodies when this one started (its summary was on disk, its bodies were
> not), so this pass waited for the file to go quiet before editing. That is the same collision class round 5
> reports for the browser and the seeded account, and it is why `F23` grows below rather than getting a
> sibling. What changed for `todo-routine`: round 5's live re-verification closed **B3, B4, B6, A1, A3** in a
> browser (B4 and B6 in Slovak, as required), corroborated the counter hit-test fix with a real mouse, and
> surfaced **one new open finding, `B10`** — the countdown timeline formats dates through the *browser's*
> locale, not the account's — which on a source read is **eight call sites in five files, not two in one**
> (*Contradictions* §21). Round 4's API source read had already settled both `todo-routine` escalations (§2,
> §3) and filed-and-fixed **`B9`**, which round 5 then could not verify in three attempts, blocked by a
> concurrent session reseeding the shared account. Net: **two new app batches** (`F24` for `B10`, `F25` for
> the `/routine-settings` "Color" header B4's retest turned up), **`F23` grown** by the two runbook rules round
> 5 paid for, one new escalation (§7, the unique-index 409), one new source-certain item under *Needs
> verification* (the create-path 409 that `B9`'s fix does not reach), and the *Awaiting retest* table rewritten
> — five of its eight rows are closed. The 68 above is 66 + `B9` + `B10`.

> **Fourth pass, 2026-09-14, commit `df2b163d` — unit 2 `activity-settings` absorbed.** Fourteen findings
> (the fifteenth, `B6`, was already borrowed into `F14` last pass — the header below says "sixteen", which
> was a miscount: the unit's tally is 7 · 1 · 2 · 1 · 4 = 15). They became **six new app-side batches
> (`F18`–`F23`, two of them docs-only) and one framework one-liner (`FW5`)**, plus one escalation (§6).
> Every finding was checked against source this pass — **including the API's**, since it is on this
> machine — and that overturned more than any previous pass (*Contradictions* §14–§20): the "backend
> ignores `roleIds`" finding is a field that has never existed on the wire, the unit's own fix for the
> Roles/Categories delete gap would have disabled every button, and the invalid-tab blank page is an
> app-wide missing catch-all that unit 2 merely walked into first. Nothing above `F18` was re-read this
> pass; the notes below still describe `F1`–`F17` and `FW1`–`FW4` as of the third pass.

> **Third pass, 2026-09-13, commit `df2b163d` — unit 6 `tracking-settings` absorbed.** Seven findings
> (1 blocker, 4 bugs, 1 polish, 1 opportunity, 1 unverified) became **six new app-side batches (`F12`–`F17`)
> and one docs-only framework batch (`FW4`)**; the previous header read 44 findings · 14 batches at
> `430e6f03`. Every one
> was checked against source this pass, and two root-cause guesses were overturned (*Contradictions*
> §9–§10) — the blocker in particular is a one-line layout omission, not the framework paint bug the unit
> suspected. Nothing above `F12` was re-read this pass; the notes below still describe `F1`–`F11` and
> `FW1`–`FW3` as of `430e6f03`.
>
> ~~⚠️ **Unit 2 `activity-settings` is also on disk and is NOT triaged here**~~ — **superseded by the fourth
> pass above.** (Kept for the audit trail: the operator scoped the third run to `tracking-settings`. One
> of its findings, `activity-settings/B6`, is the same defect as `tracking-settings/B2` and was pulled into
> `F14` under the duplicate rule; the rest waited for this run.)

> **This run supersedes the queue built earlier on 2026-09-13.** Two things changed since it:
>
> 1. **Unit 13 `leisure-projects` landed** — 8 findings, 7 of them open, and they are the bulk of the new work.
> 2. **That run's `F4`–`F7` were applied** (the four `todo-routine` app batches). Verified in source this pass:
>    `TodoListItemCounter.vue` carries `:title`/`:aria-label` on both branches, `TodoListStepsFormField.vue`
>    names all four step controls, `RoutineToDoListForm.vue:28` resolves `routineTodoList.timePeriod`,
>    `RoutineTodoListItem.vue` resolves `routineTodoList.streakTooltip`/`.gracePeriodActive`, and
>    `BaseToDoList.vue:43` is `$t('toDoList.duplicateInList')`. They are **no longer batches** — they are
>    retest items, listed under *Needs verification → Awaiting retest*.
>
> **Batches are renumbered from scratch.** The old `F1`/`F2`/`F3` (home) are this run's `F7`/`F8`/`F9`; old
> `F8`/`F9` (shell) are `F10`/`F11`; old `FW1`/`FW2`/`FW3` are `FW1`/`FW2`/`FW3` with `FW2` **grown** to two
> controls. Everything carried forward was re-read against current source this pass, not copied on trust —
> the six one-line checks are named in each batch.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F1 | View-mode toggle loses `view=table` to a URL-write race | app | `leisure-projects/B1` | med |
| F2 | Board mode fires two grid requests through one `AbortController` | app | `leisure-projects/B2` | med |
| F3 | ✅ **FIXED 2026-09-13** — `ActivityInfo` reads `icon`/`color` flat; the API nests them under `activity.category` / `activity.role` | app + framework | `leisure-projects/B3` | low |
| F4 | Table's "Messy" icon column has no text alternative | app | `leisure-projects/A2` | low |
| F5 | Inactive readiness-status buttons are invisible (non-text contrast) | app | `leisure-projects/A3` | low |
| F6 | Dead `class="flex-1-1"` on four `FilterPanel` call sites logs a warning per render | app | `leisure-projects/P1` | low |
| F7 | `RoutineTodoWidget`'s header controls are clipped off-screen | app | `home/B1` | low-med |
| F8 | NowBar shows a contradictory "DONE" / "No plan for today" pair while loading | app | `home/B2` | low-med |
| F9 | `homeUiStore` never persists, and CLAUDE.md says the opposite of what the plugin does | app + docs | `home/B3` | low |
| F10 | No skip-to-content link | app | `_shell/A3` | low |
| F11 | ✅ **FIXED 2026-09-13** — Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list` | app | `_shell/P1` | low |
| F12 | Mappings table body has zero height — the row exists but is inside a 0 px scroll box | app | `tracking-settings/X1` | low |
| F13 | Mappings tab: no filter control reaches the grid, and the delete button reaches nothing | app | `tracking-settings/B1` (+ wires `U1`) | med |
| F14 | Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path | app | `tracking-settings/B2`, `activity-settings/B6` | low |
| F15 | Distinct-entries filter, page and sort are not in the URL | app | `tracking-settings/B3` | med |
| F16 | Settings header row clips its labels at 1440 px | app | `tracking-settings/B4` | low |
| F17 | CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means | docs only | `tracking-settings/P1` | trivial |
| F18 | The mount-time combobox rebuild writes back into the activities filter — wiping URL ids and double-firing the grid | app | `activity-settings/B2`, `B3` (+ retests `U4`) | med |
| F19 | Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it | app | `activity-settings/B7`, `A1` (+ answers `U2`) | med |
| F20 | No catch-all route — any unknown URL renders a blank main area | app | `activity-settings/B5` | low |
| F21 | Categories table's "Role" column is a comma-joined aggregate presented as a single value | app | `activity-settings/P1` | low |
| F22 | Activities filter bar clips the "Categories" label | app | `activity-settings/P2` | low |
| F23 | Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens (**grown**: nor the unnamed `default` browser session, nor a mid-pass reseed) | docs only | `activity-settings/U3` (+ `todo-routine` round-5 environment note) | trivial |
| F24 | ✅ **FIXED 2026-09-14, verified in SK + no-reload EN switch** (uncommitted) — Routine components format dates through the browser's locale, not the account's — 8 `toLocaleDateString(undefined, …)` calls in 5 files | app | `todo-routine/B10` | low |
| F25 | ✅ **FIXED 2026-09-14, verified** (*Farba* in SK, *Color* in EN; uncommitted) — `/routine-settings` "Color" column header is the capitalized raw key — the title is `''` and the framework fills it in | app | *(unfiled — `todo-routine/B4`'s round-5 verification note)* | trivial |
| F26 | Period-total banner is a `flex: 1 1` (basis `0%`) item — it never has a size to wrap on, so it is squeezed to ~62 px instead of dropping to a new line | app | `history-review/B1` | trivial |
| F27 | History dashboards have no error state: three fetch owners null or **keep** their data on failure and every panel renders "No data for this period" — the pattern is already built in `useActivityDashboard` | app | `history-review/B2` | med |
| F28 | `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer | app | `history-review/B3` | trivial |
| F29 | Stacked-bar columns are bare `div`s: no name, no role, no `tabindex`, no key handler — and on Detail they show a pointer cursor and do nothing | app (`activityTracking/component/stackedBars/`, shared per `migration-revision.md` §7) | `history-review/A1` | low-med |
| F30 | Summary cards are named "View details for X" and toggle a highlight; the history card does not activate from the keyboard (**`activityTracking` half withdrawn** — §80: its cards open a detail panel and already have key handlers) | app | `history-review/P1` | low |
| F31 | Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas; `isNarrow` is a dead prop | app | `history-review/P2` | low-med |
| F32 | `/activity-history/calendar` has no `<h1>`, unlike its two siblings | app | `history-review/P3` | trivial |
| F33 | Google Calendar connect never sends the OAuth `state` the server's validator requires — the client half of `B1`, unobservable only because the server half breaks the flow one step earlier | app | `user-settings/B1` (client half; server half is §9) | low |
| F34 | Google Calendar card's "Disconnect" is `error` on an elevated button — the app-side twin of `P1`, on the very row the unit compared against | app | *(unfiled twin of `user-settings/P1`)* | trivial |
| F35 | `dateTime.secondsShort` renders raw on every running clock — and `general.from`/`general.to` on every `TimeRangePicker` in range mode: the app-side `common` mirror is written per consumer, has leaked four times, and should become the deep-merge `SK.ts` already does for `user` | app (`src/locales/`) + CLAUDE.md | `history-capture/B1` (+ two unfiled twins) | low (decision: merge vs. patch) |
| F36 | Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take the framework's time-of-day default; the server's own *Short Sprint* preset (3-minute rest) cannot be re-entered through the client | app | `history-capture/B2` | low |
| F37 | Preset chips define `#close` without `closable`, so Vuetify renders a live, always-present "Close" button that hides the chip client-side — and in edit mode the pencil *is* that button, so clicking it never opens the editor | app | `history-capture/B3` (+ unfiled inventory `A1`) | low |
| F38 | Leftover `console.log` in `TimerPresetsSection.vue` — and two more app-side; `no-console` is configured `off` with an allow-list, which is why lint did not catch any of them | app + `eslint.config.ts` | `history-capture/P1` | trivial |
| F39 | The auth guard's redirect drops the destination — `router.ts:98` returns `{ name: 'login' }` with no `redirect` query, while the interceptor's own forced-logout path already writes one | app (`src/router.ts`) | `auth/B1` (write half; the read half is `FW11`) | trivial |
| F40 | Logging out fires `GET /routine/settings` and logs a 401 — `resetAppState()` *creates* `routineReviewStore`, the Pinia plugin calls `ensureLoaded()` on creation, and the load has no signed-out guard and no `catch` | app (`src/core/todoList/store/routineReviewStore.ts`) | `auth/P2` | low |
| F41 | `DayPlannerSettingsView`'s tabs stack — `d-flex` on two `VTabsWindowItem`s is `display: flex !important`, which beats the inline `display: none` Vuetify's `v-show` sets on an inactive item | app | `planner-day/B1` | trivial |
| F42 | `/day-planner/settings` active tab is not in the URL — a `?tab=` query, absent for the default, through the module's own `useCalendarUrlState` pattern | app | `planner-day/B6` | trivial |
| F43 | `/day-planner/:date` with a malformed or unprovisioned date: two unguarded calendar fetches (`onMounted`'s `Promise.all`, and `useDayNavigation`'s `viewedDate` watcher) leave a blank header, an unhandled rejection and — on the second — a header for the *previous* day under the new URL | app | `planner-day/B5` (date half; the task half is settled, no defect) | low |
| F44 | Calendar "Days to show" and the Range/Duration configuration do not round-trip in the URL — the app half: extend `useCalendarUrlState` once `FW16` exposes the state | app (**after `FW16`**) | `planner-day/B3` (app half) | med |
| F46 | The pie-chart detail panel's close button was hand-rolled three times and drifted: `mdi-close` in a FontAwesome-only app on the web panel (blank square + console error), no accessible name at all on the desktop panel, and a "Close domain details" label on the unified panel whose items are domains, products *and* apps — one shared key, one identical button | app (`src/core/activityTracking/component/`) | `tracking-dashboards/B1`, `A2` | trivial |
| F47 | Selecting an app on `/activity-tracking/android` opens no detail — the side panel has no branch on `selectedAppLabel`; the card's accessible name promises *"View details for Spotify"*. A local panel from the data on the page (label, package, total time, share of the span, the summary card's baseline stat); a per-app session count is **not on the wire** (§79) | app | `tracking-dashboards/B2` (narrowed) | low |
| F48 | The Android dashboard renders two controls for an Active/Background split its source does not have: the pie's Total/Active/Background radio is a **no-op** (`pieSegments` reads only `totalSeconds`; the DTO has no split), and the timeline's Active/Background legend labels a lane that is always empty | app | *(unfiled — source-certain + `tracking-dashboards.draft.spec.ts:103-105`'s own observation)* | low |
| F49 | Date-preset chips and source-filter chips are focusable `span`s with no role and no state — Vuetify 3.12's `VChip` adds `tabindex`/keydown when clickable and nothing else; the same state-bearing class sits on `todoList`'s two filter groups and `dayPlanner`'s day-of-week and duration chips (15 chip-controls app-wide, 6 of them toggles/selects) | app (`activityTracking`, `todoList`, `dayPlanner`) | `tracking-dashboards/A1` (+ unfiled twins in `TodoListFilters.vue`, `RepeatingTaskDialog.vue`, `BasePlannerTaskDialog.vue`) | low-med |
| FW1 | `MyDialog` is `persistent` by default, so Escape closes nothing | **framework** | `_shell/A1` | med (decision first) |
| FW2 | **Six** framework icon-only controls have no accessible name (**grown**: `MonthYearPicker`'s prev/next month, `MyDateInput`'s prev/next day) | **framework** | `_shell/A2`, `leisure-projects/A1`, **`planner-day/A1`** (+ two unfiled in `MyDateInput`) | low |
| FW3 | ✅ **CLOSED 2026-09-13** — `Time.fromJson` cannot parse the backend's string shape (the API had already switched to `{hours, minutes}` on 2026-09-11; `fromJson` now accepts both) | **framework** | `todo-lists/B4` | med |
| FW4 | `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so | **framework** (docs only) | *(none — prevents the next `F12`)* | low |
| FW5 | `DataTable`'s default row actions render the internal slug as their `title`, not the localized label | **framework** | `activity-settings/B4` | trivial |
| FW6 | `CalendarGrid`'s day cells are click-only `div`s with no accessible name, role, `tabindex` or key handler — two consumers (history calendar, day-planner calendar) | **framework** | `history-review/A2` | low |
| FW7 | Every password field's visibility toggle is named "{label} appended action" — Vuetify's `InputIcon` fallback, one component (`MyPasswordInput.vue`); and the mismatch message `user.passwordsDontMatch` is a key no locale file defines | **framework** | `user-settings/A1`, **`auth/A1`**, **`auth/B2`** (+ answers the message half of `user-settings/U4`) | low |
| FW8 | Six elevated buttons in the framework's user module use the tonal/outlined colour tokens (`error`/`warning`), and the pairing rule is written only in this app's CLAUDE.md | **framework** | `user-settings/P1` (+ the three on unit 15's signed-out views — pre-empted, and the unit did not re-file them) | trivial |
| FW9 | The forgotten-password flow cannot complete at either step: the request omits the `required` `recaptchaToken` (400 today), and the link the server would mail points at `/reset-password`, **a route and view that exist in no repo on this side** — plus a dead 404 branch the server never takes, a hardcoded snackbar and a `TypeError` on network failure | **framework** (new view + route) | `auth/X1`, `auth/B3` | med |
| FW11 | Post-login redirect, read half: `LoginView`'s two success handlers and `LoginVerifyQrCode` hardcode `router.push('/')`, so the `?redirect=` the interceptor already writes (and `F39` will) is never honoured — with an open-redirect guard; folds `P3`'s `console.log(valid)` and the `'No user!!!'` literal, same file | **framework** | `auth/B1` (read half), `auth/P3` | low |
| FW12 | Both confirm-e-mail views' error states are a lone button with no persistent explanation — the sibling the unit held up as the model has none either (its "body text" is the snackbar); `ConfirmEmailView` also snackbars the literal `Error`, posts to `/resend-confirmation-email/undefined` when the link has no `userId`, and both success buttons are `color="main"`, a token the theme does not define | **framework** | `auth/B4`, `auth/B5` (+ settles `U6`: no defect) | low |
| FW13 | `RegistrationView` fails closed on an empty reCAPTCHA token while the API's local always-pass service assumes the client fails open — the one thing making local registration impossible; its `catch` also overwrites the server's `409 "User already exists"` with *"changed by someone else"*; folds `P1`'s legal links (`target="_blank"`), same file | **framework** | `auth/O1` (re-graded `bug`), `auth/P1` (+ unblocks `U1`, `U5`, half of `U2`) | low |
| FW15 | `MyDateInput` binds `v-bind="$attrs"` *before* its own `:label` and bare `hideDetails`, so every caller's `label` (and `hideDetails="false"`) is silently discarded — three call sites pass one, and the History summary's *From*/*To* pair both read "Date" | **framework** | `planner-day/B2` (+ the unfiled *From*/*To* twin `history-review/inventory.md:20` recorded as fact) | trivial |
| FW16 | `CalendarGrid`'s "Days to show" and `DateRangePicker`'s mode + Range/Duration configuration are private `ref`s no consumer can read or set — expose them as optional models (defaulting to today's behaviour) so an app can round-trip them | **framework** (additive API) | `planner-day/B3` (framework half; `F44` is the app half) | med |
| FW17 | `ActionBar` is `position: fixed; left: 50%` — centred on the **viewport** while `.v-main` is inset by the nav drawer, so the bar's left end slides under the drawer and *Delete* is un-clickable at 1280×720; two `dayPlanner.spec.ts` specs have been `fixme`d on it since before the sweep | **framework** | *(unfiled — unit 7's brief item 2, re-confirmed in its inventory `:144`; `e2e/tests/dayPlanner.spec.ts:203-224`)* | low |

48 app-side (`F9`, `F17`, `F19`, `F23` and `F35` include CLAUDE.md or runbook edits; `F17` and `F23` are
nothing else; `F24`/`F25` are fixed and verified; `F45` is a reserved number, not a batch) · 15 framework
(`FW10` and `FW14` are reserved numbers, not batches — see *Needs verification*) · 10 escalations (6 open:
§1, §6, §7, §8, §9, §10 — §2 and §3 were settled by `todo-routine`'s round-4 API read and are struck
below). Unit 4 added no framework batch and no escalation; unit 15 added four framework batches and no
escalation — every one of its defects is in `src/_common/modules/user/` or `src/router.ts`, which is
what a unit made of framework views looks like. Unit 7 added three framework batches and no escalation,
and split one finding across the boundary (`FW16`/`F44`) — a planner view built on `CalendarGrid`,
`DateRangePicker`, `MonthYearPicker`, `MyDateInput` and `ActionBar` is five framework components deep,
and four of its seven findings landed there. Unit 5 added no framework batch — its four dashboards are
built from this module's own components on top of Vuetify and ECharts, and the one Vuetify-default gap
(`F49`) is fixed at the call sites, not in `componentDefaults` (rule 4, see the batch) — and one
escalation that the unit did not file and could not have seen on the seed (§10).

**Order among the unit-5 batches.** `F46` first and alone — it is a two-file, three-attribute change
and it decides the **one locale key** every detail-panel close button will share, which `F47`'s new
Android panel then reuses rather than minting a fourth. `F48` before `F47`, or in the same commit:
both edit `AndroidPieChartSection.vue`, and `F48` changes what the pie section *shows* (no radio) while
`F47` changes what it shows *when something is selected* — landing `F47` first means writing a detail
panel beside a radio that is about to disappear. `F48`'s timeline half is a separate file and a
separate prop and can ship on its own day. `F49` is independent of everything and is the one that
should **not** be scoped to this module: its `todoList` and `dayPlanner` call sites are the same edit,
and a fixing session that names the range-picker chips `radio` and leaves the priority chips and the
repeating-task day toggles as bare `span`s has fixed the symptom the unit saw and not the class. None
of the four needs a seed change; `F46` and
`F48` need the SK locale as well as EN. **Run `U1`'s retest in `F27`'s verification session** — `F27`
copies this module's error pattern, and `U1` is the record that nobody has watched that pattern fail
in a browser yet; `playwright-cli route "**/api/activity-tracking/web-extension/pie-chart" --status=500`
settles both in one reload (*Needs verification*).

**Order among the unit-7 batches.** `F41` and `F42` are one file (`DayPlannerSettingsView.vue`), both
trivial, independent of everything; ship them in one commit if convenient, but `F41` alone is a
one-line hotfix and should not wait on `F42`'s design (query vs. route param). `F43` is independent and
needs no browser beyond three URLs. **`FW16` before `F44`, and `F44` rides in the pointer-bump commit** —
the same shape as `FW11`/`F39`: a codec for state the grid does not expose changes nothing visible.
`FW15` and `FW2` edit the same file (`MyDateInput.vue`) — one `vue_framework` commit may carry both if
its message says so, but they close different findings for different reasons (a label bound in the
wrong order vs. no label at all) and stay two batches. `FW15` **breaks one draft assertion** on purpose
(`history-review.draft.spec.ts:28` pins the defect) — fix the spec in the pointer-bump commit. `FW17` is
independent of everything, CSS only, and is the one that un-`fixme`s two existing specs; run
`dayPlanner.spec.ts` after the pointer bump rather than driving it by hand.

**Order among the unit-15 batches.** `FW9` first and alone — it is the sweep's only open `blocker`, it
adds a route table entry and a view, and until it lands no other auth batch's verification can
include the forgotten-password path. **Read the whole batch before editing `ForgottenPasswordView`**:
the token fix the finding asks for is one line, and applied on its own it moves the failure from a 400
on the first screen to `F20`'s blank page on the second. `FW11` and `F39` are two halves of one
behaviour (`auth/B1`) split by rule 1: `FW11` (framework, the read side) works today with the
interceptor's existing `?redirect=` write and ships first; `F39` (app, one line) rides in the
pointer-bump commit, because a guard that writes `redirect` into a login view that ignores it changes
nothing visible. `FW12` edits the same two lines `FW8` recolours (`ConfirmEmailView.vue:21`,
`ConfirmEmailChangeView.vue:20`) — land `FW8` first or fold it into `FW12`'s commit, never the reverse.
`FW13` **before the unit's mutation pass**: that pass has to submit the registration form, and today it
cannot, locally, for the reason `FW13` removes; it also makes `U1` and `U5` observable, so the retest
that follows `FW13` should run their *What would settle it* rows in the same session. `F40` is
independent of everything and needs no browser beyond a logout with the console open. `FW7`, which now
closes two of this unit's findings too, has not moved — but its verification block gains `/login` and
`/registration` as places to look.

**Order among the unit-4 batches.** `F35` first, and decide its shape before touching a locale file:
if the deep-merge is chosen, the `secondsShort` line is never written and `F4`'s `general.yes`/`general.no`
become real keys for free (§55); if the patch is chosen, `F4` must add its own two lines. `F36` and `F37`
touch different files and are independent; `F37` before the unit's **mutation pass** runs, because that
pass will exercise edit mode and file the pencil-hides-the-chip defect a second time otherwise. `F38` is
independent of everything and is the cheapest item in this queue — but turn the lint rule on *first*,
then fix what it reports, so the count is measured rather than trusted. None of the four needs the
Slovak locale to verify; `F35` needs both.

**`F36` does not change the framework default (rule 4).** The batch sets `allowedMinutesSelected="1"` at
this module's duration fields and stops. Whether `TimePicker`'s default of `'5'` is right for a
component used for both times-of-day and durations, and whether a snap should ever be silent, is a
`vue_framework` decision — raised under *Needs verification* alongside the minute-60 overflow this pass
found in the same function, because that one needs ten seconds in a browser before it is a batch.

**Order among the unit-14 batches.** `F33` is the only one whose *verification* is blocked — the
end-to-end pass needs all three parts of §9 on the server — but its *change* is not: the request body
can be asserted today (see the batch). Do it before §9 lands, or the first real OAuth round trip after
the server fix will fail on the client and get filed as a fourth backend bug. `FW7` and `FW8` touch
the same module and can ship in one `vue_framework` commit if the message says so; `FW7` is the one
that needs a look at every sign-in form in every app, `FW8` is six colour tokens. `F34` is one token,
independent of everything, and must **not** be folded into `FW8` (rule 1 — the same split as `F4`/`FW2`).

**Order among the unit-3 batches.** `F27` first if any of the others is going to be verified in the same
browser session — it is the only one that changes what a *failed* request looks like, and `history-review/U1`
(the empty-state check) is only meaningful once "empty" and "failed" are distinguishable on screen. `F29`
before `F30`: both decide what an interactive chart element is *called*, and the two should agree on a
verb ("Highlight", "Filter to", "Open the day") before either ships. `F26`, `F28`, `F32` are one-line edits,
independent of everything. `F31` is independent but touches the same `HistoryPieChart.vue` a light-theme
fix would (see its *Adjacent*), so do the two together or not at all. `FW6` is a separate repo and needs
an app-side locale mirror in the pointer-bump commit — see the batch.

**`F29` edits unit 5's module.** `StackedBarColumn.vue` lives in `activityTracking/component/stackedBars/`,
which `migration-revision.md` §7 documents as shared presentation owned by a feature module (the two
`activityHistory` views import it across the module boundary, and that is the recorded gap, not a new one).
~~Unit 5 has not run; when it does, its inventory will describe the post-`F29` bars.~~ **Unit 5 has run
(eleventh pass), at `6aac48bb`, before `F29`.** Its inventory lists the stacked bars as a readable
surface (`tracking-dashboards/inventory.md:40`) and its four *Keyboard* sections name the chips, cards,
session bars and close buttons — never the bar columns — so it did not re-file `history-review/A1` from
the tracking side, and `F29`'s `/activity-tracking` verification step stands as the check that the
tracking dashboards' own click semantics survive. The inventory describes the pre-`F29` bars; say so in
the commit so nobody reads that line as a regression.

**`F24` and `F25` are independent of everything, and of each other** — different files, different causes,
both in `src/core/todoList/`. `F24` needs the SK locale to verify; `F25` does not. **Both are now applied
in the working tree** (sixth pass) and sit in *Awaiting retest*; the note about the uncommitted `todoList`
files is moot — they are all uncommitted together now.

**Order among the unit-2 batches.** `F19` before `FW5` is *verified* — once the Roles/Categories tables
have their own `#actions` slot they no longer render `DataTable`'s default buttons, so `FW5` has to be
checked on a table that still does (`/routine-settings`). `F18` first if `U4` is to be retested
meaningfully, since it removes the competing request that is the only candidate explanation. `F20`,
`F21`, `F22`, `F23` are independent of everything.

**Order within the new batches matters.** `F12` first — until the row paints, `F13`'s delete wiring and
`U1` cannot be verified. Then `F13` before `F15` and `F16`: `F13` decides what the top filter bar does on
the Mappings tab (and whether it is even shown there), which changes what `F15` has to sync to the URL and
what `F16` has to lay out. `F14` and `F17` are independent.

**`F4` and `FW2` are the same defect class deliberately split** (batching rule 1): an unnamed icon control in
`src/core/leisure/` and two in `src/_common/`. The framework pair ships as a `vue_framework` commit plus a
pointer bump; the app one does not. Do not let a fixing session merge them.

---

## F1. The view-mode toggle loses `view=table` to a URL-write race

- **Scope:** app-side `src/core/leisure/view/ProjectsView.vue`, `src/core/leisure/composable/leisureFilterUrlState.ts`
- **Closes:** `leisure-projects/B1`
- **Root cause:** Two independent writers of `router.replace({ query })`, each spreading a `route.query`
  snapshot that Vue Router only refreshes once a navigation *resolves*. Confirmed in source this pass:
  `ProjectsView.vue:146` is `watch(viewMode, value => router.replace({ query: { ...route.query, view: value } }))`;
  `useTableUrlState.ts:106-107`'s `syncToUrl()` opens with `const query = { ...route.query }` and is watched on
  `[page, itemsPerPage, sortBy]` (`:138`). Switching to Table mounts `ProjectTable`/`BasicTable` for the first
  time, and `BasicTable.vue:191-202` is an `immediate: true` watcher that **pushes a default sort item into the
  shared `sortBy` ref** when the first column key isn't already there. So one click produces two replaces in the
  same tick, and whichever resolves second overwrites the other's key. `view` is the one that loses, because
  `syncToUrl` writes `page`/`perPage`/`sortBy` and knows nothing about `view`.
- **Why it is intermittent, exactly:** once `sortBy` is already in the URL, `BasicTable`'s watcher finds a match
  and pushes nothing, so there is only one writer and the click works. That is the finding's own evidence
  (case 2), and it is also the fix.
- **Files:** `src/core/leisure/view/ProjectsView.vue:125,146`; `src/core/leisure/composable/leisureFilterUrlState.ts:86-105`
  (`projectFilterUrlState`); reference only — `src/_common/composable/table/useTableUrlState.ts:106-141`,
  `src/_common/component/dataTable/BasicTable.vue:191-202`
- **What to change:** Remove the second writer rather than trying to order the two. `useTableUrlState` already
  accepts `defaultSortBy` (`:15,:81`) and nothing passes it — give `projectFilterUrlState()` a
  `defaultSortBy: [new VSortItem('activity.name', 'asc')]` matching `ProjectTable`'s first column, so
  `BasicTable`'s mount-time watcher finds its key present and pushes nothing. Then make the `view` write
  resilient on its own terms: after the replace resolves, assert `route.query.view === viewMode.value` and
  re-write if not (or read `viewMode` from the route as the single source of truth instead of holding a
  separate `ref`). **Both halves** — the first kills the reproducible case, the second stops any future third
  writer silently reintroducing it.
- **Do not change:** `useTableUrlState.ts` or `BasicTable.vue`. A shared query-merge queue in the framework is
  the "proper" fix and it is a framework batch with its own risk to every table in every app — not a side
  effect of closing one view's finding. Also do not change the other three leisure views in this batch; they
  have the same two-writer shape (`BucketListView`, `MemoryAnchorsView` each hold their own
  `watch(viewMode, …)`) but no finding, and units 11/12 have not run yet.
- **Verification:** `leisure-projects/B1`'s `Verify:` block verbatim — from a **query-string-free** load, one
  click on "Table" must put `view=table` in the URL immediately, and a reload must stay on Table. Re-run it
  twice: once from `/leisure/projects` clean, once from a URL that already carries `sortBy`.
- **Risk:** Low-medium. `defaultSortBy` means every load now carries `sortBy=activity.name:asc` in the query
  once anything syncs — harmless, but it also means the *board* default URL advertises a table sort. More
  importantly, `activity.name` is the exact key that used to 500 this grid (see *Contradictions* §2): if the
  API's sort-key remap were ever rolled back, defaulting to it would break the table on first load rather than
  on first header click. **Measured 2026-09-13: it answers 200**, and the risk has shrunk — the key resolves
  **natively** off the nested `ActivityResponse` now, not through a remap that could be rolled back, so it is
  only as fragile as the row shape itself. Re-confirm before shipping anyway.

## F2. Every board-mode filter change fires two competing grid requests through one `AbortController`

- **Scope:** app-side `src/core/leisure/view/ProjectsView.vue`
- **Closes:** `leisure-projects/B2`
- **Root cause:** `ProjectsView` drives **one** `fetchFilteredTable` instance from **two** places. Confirmed in
  source: `useActivityProjectProfileCrud()` is destructured once (`:103`) and handed to `useServerTable`
  (`:109`) *and* called directly by `loadBoard()` (`:139`). `useServerTable.ts:107-116` watches `filter`
  unconditionally — it cannot know its table is unmounted — so a board-mode filter change fires the table's
  25-row fetch alongside `ProjectsView.vue:147-153`'s own 200-row `loadBoard()`. `useFetchFilteredTable.ts:29-37`
  holds **one** `AbortController` per instance and aborts the previous call on every new one, so the two race.
- **The consequence is worse than a wasted round trip**, and this is the part to fix for, not the count:
  `useFetchFilteredTable.ts:47-55` swallows the cancellation and **resolves the aborted call with `latest`** —
  the *other* call's result. With more than 25 matching projects, a board-mode filter change can therefore
  resolve `boardItems` with the table's 25-row page and silently under-render the board. Not reproducible on
  the current seed (one row), inferred from the code path; the finding says so too.
- **The finding's own suggested fix does not satisfy its own pass condition.** Giving the board a second
  `useActivityProjectProfileCrud()` instance separates the controllers — the correctness bug goes — but leaves
  **two** requests, and `Verify:` step 3 demands exactly one. Pick a shape that gives one fetch:
- **Files:** `src/core/leisure/view/ProjectsView.vue:103-153`; reference only —
  `src/_common/composable/table/useServerTable.ts:107-116`, `src/_common/api/useFetchFilteredTable.ts:29-58`
- **What to change:** Recommended — **collapse the two fetches into one.** Board and table want the same
  filtered rows at different page sizes, so drive the board off `useServerTable`'s own `items` and set
  `itemsPerPage` to `BOARD_PAGE_SIZE` while `viewMode === 'board'` (back to 25 on switching to table). That
  deletes `loadBoard`, `boardItems` and `boardLoading`, leaves one writer of one request, and keeps the page
  size bookmarkable in the URL where it already is. Keep `BOARD_PAGE_SIZE = 200` and the comment at `:113-122`
  explaining why it is 200 and not 500 — that constraint is the server's validator and is still live.
  Acceptable alternative if the single-instance shape turns out to fight the table's paging: a second
  `useFetchFilteredTable` instance for the board **plus** gating `useServerTable`'s load on
  `viewMode === 'table'`, and amend the finding's pass condition to say why two instances were needed.
- **Do not change:** `useServerTable`'s unconditional filter watcher or `useFetchFilteredTable`'s cancellation
  fallback. Both are framework, both are load-bearing for every other table, and the "suppress the fetch when
  the consuming table is unmounted" idea needs a framework-level answer (a `enabled` option), not a patch
  here — see *Escalations* §4 for whether that is worth raising upstream.
- **Verification:** `leisure-projects/B2`'s `Verify:` block — one filter change in board mode, exactly one
  `POST /api/activity-project-profile/grid`, carrying the board's page size. Then switch to Table and confirm
  paging still works and still fires one request per page change. Check `playwright-cli requests` for
  `net::ERR_ABORTED` entries — there should be none.
- **Risk:** Medium. Touching the page-size ref changes what lands in the URL for every user of this view, and
  the board's "fetch everything" assumption only holds under the 200 cap. If a user's project count ever
  exceeds 200 the board silently truncates either way — out of scope here, worth a note in the code.

## F3. `ActivityInfo` reads `icon`/`color` flat; the API nests them under `activity.role`

> ## ✅ FIXED 2026-09-13 — and the contract it was hedging against is now settled
>
> `B6`/`B7` came back **nested, confirmed**, so the hedge below is resolved rather than permanent. Three
> corrections to what this entry assumed, all now reflected in the code:
>
> 1. **The fallback needed `category`, which this entry never mentions.** `category` takes precedence over
>    `role` and is **nullable**. The shipped rule is the server's own:
>    `icon ?? category?.icon ?? role?.icon`, same for `color`.
> 2. **`categoryName` was a false alarm.** This entry warns it "has never been checked" and would fail the
>    same way. It does not bite: its only reader is `SuggestionCard.vue:19-20`, which renders
>    `/leisure/suggestion/draw` — the one endpoint that **still sends the flat shape**. No grid-path code
>    reads it. (The "Woodworking" on the project card is `item.projectArea`, an unrelated field.) It is
>    derived anyway, via `categoryName ?? category?.name`, so both shapes parse.
> 3. **The adjacent `BacklogTable` item needed a framework change, not just a prop edit.**
>    `deleteConfirmationColumn="activity.name"` would have kept rendering *"delete **undefined**"*, because
>    `BasicTable.vue:211` indexed the row flat. It now resolves through `getNestedValue`, so dotted keys work
>    and dotless keys behave exactly as before. **That edit is in the `src/_common` submodule and needs its
>    own commit before the pointer bump.**
>
> 4. **Three sibling tables had the same defect in a quieter form and are fixed with it.** `BucketListTable`,
>    `MemoryAnchorTable` and `ProjectTable` set no `deleteConfirmationColumn` at all, so their dialogs read
>    *"delete **13004**"* — an id. `/leisure/projects` was inconsistent with itself, since the board view
>    (`ProjectReadinessBoard.vue:227`) already built the name by hand. All three now pass `activity.name`.
>
> **Files changed:** `src/core/leisure/dto/response/ActivityInfo.ts` (flat-first, nested fallback — parses
> both shapes), and `deleteConfirmationColumn="activity.name"` on all four leisure tables —
> `component/backlog/BacklogTable.vue`, `component/bucketList/BucketListTable.vue`,
> `component/memoryAnchor/MemoryAnchorTable.vue`, `component/project/ProjectTable.vue` — plus
> `src/_common/component/dataTable/BasicTable.vue` + `src/_common/docs/components.md`.
>
> **Checked and needing no change** (recorded so nobody re-derives it): the four lookup columns already parse
> via `LookupResponse.fromJson(locationType)`; `MemoryAnchor.fromJson` already reads
> `hasBacklog`/`backlogIsRepeatable`/`hasBucketList` with the correct `null` handling; all four tables already
> key their Activity column `TableColumn('activity.name', …)`, which is exactly the key that now resolves
> natively; and the `activityName` in `leisureFilterUrlState.ts` and the `*Filter` DTOs is a **filter** field,
> untouched by the deletion of the `sortBy` remap.
>
> **Verified 2026-09-13, in a browser, against the running API** (fixture `e2e-v2`):
>
> - All four profile grids return **200** with `sortBy: activity.name`, each carrying a nested `activity`
>   with `role` and a **null** `category` on the seeded rows, and **no flat `activityName`**.
> - `/leisure/projects` renders **"Build a Bookshelf"** with a **`fa-guitar` icon** — board and table. The
>   icon was absent before this fix.
> - The delete dialog reads **"Are you sure you want to delete Build a Bookshelf?"**, not the old id.
> - `/leisure/memory-anchors` renders the **archived** activity ("Retired Hobby") with its name and icon,
>   confirming the anchor-keeps-the-row rule.
> - Pinned by `src/core/leisure/dto/activityInfoNestedShape.test.ts` (5 tests, both wire shapes, null
>   category, archived row, empty object) and `e2e/tests/leisure-anchor-sort.spec.ts` (3 tests).
> - `npm run type-check` (`--build --force`) 0 errors; `npm run lint` 0 errors; `e2e` `npm run typecheck` 0.
>
> ⚠️ **One part of the original L3 feature still does not work, and it is NOT this DTO.** The icon renders
> but is **untinted**. `role.color` is the raw string `"violet"`, which `ActivityNameCell.vue:6` hands to
> `VIcon`'s `color` prop; Vuetify emits `class="text-violet"`, which is not a defined theme class, so the
> computed colour stays the default `rgba(17,24,39,0.87)`. The value arrives correctly — this is a
> **rendering** gap, not a parsing one, and it needs a decision about whether arbitrary DB colours are
> allowed to reach a Vuetify `color` prop at all (inline `style` would be the usual answer). Filed here
> rather than fixed, because it is a different defect from F3 with a different owner.

- **Scope:** app-side `src/core/leisure/dto/response/ActivityInfo.ts`
- **Closes:** `leisure-projects/B3`
- **Root cause:** `ActivityInfo.fromJson` (`:10-13`) destructures `{ id, name, categoryName, icon, color }`
  straight off the row's `activity` object. The live `activity-project-profile/grid` response carries
  `activity.role.icon` / `activity.role.color` (`"fas fa-guitar"` / `"violet"` for the seeded project) and has
  no flat `icon`/`color` at all, so both resolve to `null` and `ActivityNameCell.vue:4`'s `v-if="activity.icon"`
  never fires. The feature L3 was built for renders nothing, silently, with no error anywhere.
- **This is one edit that lights up five views, not one.** `ActivityNameCell` is mounted by `ProjectTable`,
  `ProjectReadinessBoard`, `BucketListTable`, `BucketListLadder`, `BacklogTable`, `MemoryAnchorTable` and
  `MemoryAnchorTimeline` — all four leisure entities. `SuggestionCard.vue:6,11` on `/leisure/pick` reads the
  same fields with a `?? meta` fallback, so it is *currently rendering a generic placeholder icon and looking
  fine*; check it after the fix rather than assuming it is unaffected.
- **Files:** `src/core/leisure/dto/response/ActivityInfo.ts:10-13`
- **What to change:** Read the nested shape with the flat one as a fallback —
  `object.icon ?? object.role?.icon ?? null`, same for `color` — so the DTO survives whichever shape the server
  settles on (see *Escalations* §4; the contract is genuinely unsettled and the fallback is cheap insurance).
  While in the file, confirm against a live response body which of the five fields actually arrive:
  `name` demonstrably does now, `icon`/`color` demonstrably do not, and **`categoryName` has never been
  checked** — it is read the same flat way and would fail the same way.
- **Adjacent, source-verified, not filed by any unit — fix it here if the fixing session is willing:**
  `BacklogTable.vue:11` passes `deleteConfirmationColumn="activityName"`, but `ActivityBacklogProfile` has no
  such property (it holds `activity: ActivityInfo`), and `BasicTable.vue:211` does a **flat** lookup. So
  `/leisure/backlog`'s delete dialog reads "Are you sure you want to delete **undefined**?". Same root cause as
  this batch — client written against a flat shape the API nests. It belongs to unit 11, which has not run, so
  it carries no finding id and no browser evidence; see *Contradictions* §8.
- **Do not change:** `ActivityNameCell.vue`. Its `v-if` is correct — it is being handed nulls.
- **Verification:** `leisure-projects/B3`'s `Verify:` block — the "Build a Bookshelf" card and row render a
  guitar icon tinted violet. Then check the other three leisure views render icons too (they use the same DTO)
  and that `/leisure/pick` still renders *something* rather than regressing to a blank.
- **Risk:** Low. Worst case an icon string arrives in a shape FontAwesome doesn't recognise and renders a
  missing-glyph box — visible immediately, not silent.

## F4. The table's "Messy" column renders a bare icon with no text alternative

- **Scope:** app-side `src/core/leisure/component/project/ProjectTable.vue`
- **Closes:** `leisure-projects/A2`
- **Root cause:** `ProjectTable.vue:25-31`'s `#item.isMessy` template renders a bare `VIcon` (`check` /
  `minus`) with a colour and nothing else — confirmed by source read this pass. The cell's whole meaning is
  carried by glyph and colour, so the accessibility tree shows an empty cell and a colour-blind or
  screen-reader user gets nothing.
- **Files:** `src/core/leisure/component/project/ProjectTable.vue:25-31`
- **What to change:** Give the icon a localized `aria-label` reflecting the boolean (`general.yes`/`general.no`,
  or better, the column's own meaning — "Messy" / "Not messy"). Check first whether this app already has a
  convention for boolean icon columns and follow it rather than inventing a second one; if there is none, this
  is the place it gets set, so leave a one-line comment saying so.
- **⚠️ Eighth-pass note: `general.yes` / `general.no` do not exist in this app.** They are two of the 26
  `general.*` keys the framework's `common` defines and the app's wholesale-replacing `general` does not
  (`F35`, *Contradictions* §55). Written as above, this batch would render `general.yes` raw in both
  locales. Either land `F35`'s deep-merge first (then they resolve), or add both keys to
  `src/locales/common.{sk,en}.ts` in this batch — do not assume they are there because the framework has them.
- **Do not change:** the icon/colour choice itself, and do **not** batch this with `FW2` — that is the same
  class of defect in the submodule (rule 1).
- **Verification:** `leisure-projects/A2`'s `Verify:` block — the Messy cell exposes a text alternative in the
  accessibility snapshot. Confirm it is localized (changes with the locale), not hardcoded English.
- **Risk:** None.

## F5. Non-active readiness-status buttons on the board are effectively invisible

- **Scope:** app-side `src/core/leisure/component/project/ProjectReadinessBoard.vue`
- **Closes:** `leisure-projects/A3`
- **Root cause:** `ProjectReadinessBoard.vue:130-146` colours every non-active status button `grey-lighten-2`
  with `variant="tonal"` — and `tonal` at that colour computes to `background-color: rgba(0,0,0,0)`, so there
  is no tint at all and a near-white glyph sits on a white card. Confirmed in source and by the finding's
  computed-style dump. These are the control the board exists to operate (one click moves a project between
  columns), so the two you *aren't* on are the two you can't see.
- **Not a naming gap.** The buttons already carry `:title="$t('enums.readinessStatus.' + s)"` (`:138`), so
  they have accessible names — this is WCAG 1.4.11 non-text contrast only, which is why it is its own batch and
  not part of `F4`.
- **Files:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:133-134` (the `:color`/`:variant`
  pair)
- **What to change:** Pick an inactive treatment with real contrast — a darker neutral from the theme's
  `neutral-*` scale, or `secondaryOutline` with `variant="outlined"` so the glyph gets a border to sit
  against. Whatever is chosen, the active state must still read as clearly the active one; that contrast is
  the control's only state indicator.
- **Do not change:** `STATUS_META`'s active colours (`successDark`/`warningDark`/…) — they are the
  variant-to-colour pairing CLAUDE.md prescribes for `elevated`, and they are correct.
- **Verification:** `leisure-projects/A3`'s `Verify:` block, which is a visual check — take the screenshot,
  don't rely on the accessibility snapshot, which is blind to this by construction. Check in **both** themes:
  `grey-lighten-2` on a dark card is a different failure, and the finding only measured light.
- **Risk:** Low, visual only. The board is the default view mode for this route, so it is the first thing seen.

## F6. A dead `class="flex-1-1"` on four `FilterPanel` call sites logs a Vue warning on every render

- **Scope:** app-side — the four leisure views, **not** `src/_common/component/FilterPanel.vue`
- **Closes:** `leisure-projects/P1`
- **Root cause:** `FilterPanel.vue`'s template is multi-root (a `<div>` plus a sibling `<Teleport>`,
  `:1-82`), so Vue cannot auto-inherit attributes and logs *"Extraneous non-props attributes (class) were
  passed to component…"* for every call site that passes one. Four do — `ProjectsView.vue:27`,
  `BacklogView.vue:7`, `BucketListView.vue:27`, `MemoryAnchorsView.vue:27` — all passing the same
  `class="flex-1-1"`. It was never doing anything: the panel's own root `<div>` already declares `flex-fill`
  (`FilterPanel.vue:2`). The framework's own `FilterPanel` call sites (the four reminders views) pass no class
  and log nothing.
- **App-side or framework? App-side, deliberately.** The finding's root-cause guess calls this "same shape as
  A1", and that is wrong (see *Contradictions* §5) — a missing label and a broken attr inheritance have nothing
  in common. Making `FilterPanel` single-root would also close it, but that is a submodule commit plus a
  pointer bump to delete four characters of dead markup in this repo, and it changes the DOM shape for every
  app on the framework. Removing the dead class is strictly smaller and strictly safer.
- **Files:** `src/core/leisure/view/ProjectsView.vue:27`, `BacklogView.vue:7`, `BucketListView.vue:27`,
  `MemoryAnchorsView.vue:27`
- **What to change:** Delete the `class="flex-1-1"` attribute from all four. Check the panel still fills its
  row afterwards at desktop and mobile width — `flex-fill` and `flex-1-1` are not identical, and if the layout
  *does* change, that is the signal to fix the framework instead and this batch should stop and say so rather
  than re-adding the class.
- **Do not change:** `src/_common/component/FilterPanel.vue`.
- **Verification:** `leisure-projects/P1`'s `Verify:` block on `/leisure/projects`, then repeat the console
  check on the other three leisure views — the warning is per call site, so a fix verified on one view proves
  nothing about the others.
- **Risk:** Low, but it is a layout attribute on four screens. Look at each one.

## F7. `RoutineTodoWidget`'s header controls are clipped off-screen at a common desktop width

- **Scope:** app-side `src/core/home/component/WidgetCard.vue`
- **Closes:** `home/B1`
- **Re-verified unchanged this pass:** `WidgetCard.vue:150-151` is still `flex-wrap: nowrap` above `md`, and
  `.widget-card` is still `overflow: hidden` (`:130`).
- **Root cause:** `RoutineTodoWidget`'s header holds a title, four period-streak chips
  (Daily/Weekly/Monthly/Yearly), a done/total counter and two action buttons — wider than any other widget's
  header — so at 1440×900 it overflows by ~205px (`scrollWidth: 753` vs `clientWidth: 548`) and the two action
  buttons land 100-140px past the visible edge. They stay in the DOM and the tab order (so `find` and keyboard
  users still reach them) but are invisible and unclickable by mouse.
- **Files:** `src/core/home/component/WidgetCard.vue:142-153`; the chip row itself lives in
  `RoutineTodoWidget`'s template (in scope to reflow, not to move)
- **What to change:** Either let the chip row wrap onto its own line below the title (matching what already
  happens below `md`), or give the chip row its own `overflow-x: auto` scroller that does **not** also capture
  the two action buttons — those must stay anchored and visible regardless of how many time periods an account
  has. Do not fix by widening the card or scaling the chips: the chip count is data-driven and any
  width-tuned fix reproduces at some N.
- **Do not change:** `TodoListWidget`'s header or the shared 64px `min-height` — both are fine at every width
  tested, and the "every `WidgetCard` header lines up" invariant is deliberate (see the comment above the rule).
- **Verification:** `home/B1`'s `Verify:` block — at 1440×900 both the hide/show-done toggle and the
  open-full-view button must have `getBoundingClientRect().right` ≤ the header's own, and both clickable by
  `playwright-cli click` with no forced/JS fallback. Confirm the period chips are not clipped either.
- **Risk:** Low, one component's CSS. Re-check the header still lines up with the other three widgets.

## F8. NowBar shows a contradictory "DONE" / "No plan for today" pair while the plan is still loading

- **Scope:** app-side `src/core/home/component/NowBar.vue`, `src/core/home/composable/useTodayPlan.ts`
- **Closes:** `home/B2`
- **Re-verified unchanged this pass:** `NowBar.vue` contains **zero** occurrences of `loading` — neither in the
  `useTodayPlan()` destructure nor anywhere in the template.
- **Root cause:** Two compounding gaps. (1) `NowBar` never branches on `loading`, unlike its sibling
  `DayPlannerWidget`, which guards on it before rendering plan-derived content (`DayPlannerWidget.vue:88-92`).
  (2) `focusMode` (`useTodayPlan.ts:163-166`) is computed purely from `tasks`, independent of `hasPlan`, so
  while the `calendar/day-plan` request is in flight `tasks` is `[]` → `focusMode` is `'allDone'` ("DONE")
  while `hasPlan` is still `false` ("No plan for today"). The pair renders briefly on every load — and
  **permanently** on a genuinely plan-less day.
- **Files:** `src/core/home/component/NowBar.vue` (destructure list + template `v-if`),
  `src/core/home/composable/useTodayPlan.ts:163-166`
- **What to change:** Both halves. Add `loading` to the destructure and a loading branch matching
  `DayPlannerWidget`'s spinner; separately make `focusMode` (or the kicker binding) consult `hasPlan` before
  falling through to `'allDone'`. The loading guard alone hides the transient case and leaves the steady-state
  contradiction.
- **Do not change:** `DayPlannerWidget`'s own loading guard — it is correct and is the pattern to copy.
- **Verification:** `home/B2`'s `Verify:` block — throttle the network (or delay the day-plan endpoint) and
  load `/` on an account with a real plan: the now bar shows a loading state and never "No plan for
  today"/"DONE" for a day that has a plan. Then confirm a genuinely plan-less day still reads sensibly.
- **Risk:** Low. Confirm the `hasPlan` guard doesn't suppress the legitimate `'allDone'` state for a day that
  has a plan with every task done — that state must still render.

## F9. `homeUiStore` never persists, and CLAUDE.md asserts the opposite of what the plugin does

- **Scope:** app-side `src/core/home/store/homeUiStore.ts` + docs-only `CLAUDE.md`
- **Closes:** `home/B3`
- **Re-verified unchanged this pass:** `homeUiStore.ts:9` is still `defineStore('homeUi', () => {` with no
  third argument, and the file contains no `persist` key.
- **Root cause:** `pinia-plugin-persistedstate`'s default export (`createPersistedState()`, called with no
  arguments in `createAppPinia.ts:11`) resolves `persist = auto` through `options.auto ?? false` → **`false`**.
  The plugin is registered **opt-in**: a store persists only if it declares `persist: true` or an options
  object. `homeUiStore` declares neither, so the toggle resets on navigate-away-and-back and
  `sessionstorage-get homeUi` never finds a key. CLAUDE.md's `_common/bootstrap/` section states the opposite
  ("every store persists to sessionStorage unless it declares `persist: false`"), and `homeUiStore` was
  written straight against that wrong claim. Every other store in the app already declares `persist`
  explicitly, several with a comment noting the real behaviour — `homeUiStore` is the one that didn't, not the
  first of a pattern.
- **Files:** `src/core/home/store/homeUiStore.ts:9-14`; `CLAUDE.md`'s "`_common/bootstrap/`" Persistence bullet
- **What to change:** Add `{ persist: { storage: sessionStorage } }` as the third `defineStore` argument,
  matching `dayPlannerStore.ts:281`. In the same batch, correct CLAUDE.md to say the plugin is opt-in.
- **Do not change:** the other six stores — they already declare `persist` correctly.
- **Verification:** `home/B3`'s `Verify:` block — toggle "Hide done", confirm `sessionstorage-get homeUi`
  returns a blob containing `"hideDoneTodoList":false`, and that `/todo-list` and back preserves it.
- **Risk:** None for the store. The CLAUDE.md edit is documentation-only — but it is the second time this
  claim has cost a bug, so make the correction unambiguous rather than hedged.

## F10. No skip-to-content link

- **Scope:** app-side `src/App.vue` — not the framework
- **Closes:** `_shell/A3`
- **Re-verified unchanged this pass:** `src/App.vue` has zero matches for `skip`.
- **Root cause:** No skip link exists; the first Tab stop from a fresh load is the framework's sidebar toggle.
  To be first in the tab order the link must precede `<Navbar>` in DOM order, which is `App.vue` — and
  `<VMain>` (the `<main>` landmark it targets) is already there too, so no submodule change is needed.
- **Files:** `src/App.vue` — insert before `<Navbar>`, target `<VMain>` (give it an `id`)
- **What to change:** A visually-hidden-until-focused anchor as the first child of `<VApp>`. Label from
  `src/locales/common.{sk,en}.ts` — app-wide string, no module owns it.
- **Verification:** `_shell/A3`'s `Verify:` block — first Tab stop is a visible "skip to main content" link,
  activating it moves focus into the main region, and it is invisible when unfocused.
- **Risk:** None.

## F11. Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list`

> ✅ **FIXED 2026-09-13.** `TodoListView.vue` watches `listEntity` and calls `setBreadcrumbExtra([{ title:
> name }])` (or `[]` while unresolved / not found). Verified on `/todo-list/13001`, `/todo-list/999999`, and
> navigating back to `/todo-list`. `_shell/P1` status line updated.

- **Scope:** app-side `src/core/todoList/view/TodoListView.vue` — not the framework
- **Closes:** `_shell/P1`
- **Re-verified unchanged this pass:** `TodoListView.vue` has zero matches for `useSetBreadcrumbExtra`.
- **Root cause:** `useBreadcrumbs()` builds the trail from the nav tree, which has no entry for
  `/todo-list/:id`, so the param route inherits its parent's crumbs verbatim. The framework already supports
  per-route extra segments — `_common/composable/general/useBreadcrumbs.ts` exports `useSetBreadcrumbExtra()`
  for exactly this — so no submodule change is needed.
- **Files:** `src/core/todoList/view/TodoListView.vue`; reference only,
  `src/_common/composable/general/useBreadcrumbs.ts:76-92`
- **What to change:** Call `useSetBreadcrumbExtra()` and push the fetched list's name once it resolves. Handle
  the two states the view already models — before the fetch resolves, and the `loadFailed` not-found state
  (from the fixed `todo-lists/B1`) — neither should leak a raw id or an empty crumb.
- **Do not change:** `useBreadcrumbs.ts`. A second, `meta`-based mechanism alongside the extras mechanism gives
  the framework two ways to do one thing.
- **Verification:** `_shell/P1`'s `Verify:` block, plus `/todo-list/999999`, which must not render a crumb for
  a list that doesn't exist.
- **Risk:** Low. `extraSegmentSlots` is module-level state; confirm the crumb clears on navigating away.

## F12. The Mappings table body has zero height — the row exists, inside a 0 px scroll box

- **Scope:** app-side `src/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsTable.vue`,
  `src/core/activityTracking/component/android/androidSettings/AndroidMappingsTable.vue`
- **Closes:** `tracking-settings/X1`
- **Root cause — settled from source, and it is not what the finding guessed.** `DataTable.vue:7` renders
  `VDataTableServer` with **`height="0"`** plus `class="flex-fill"`, `fixedHeader` and `fixedFooter`. Vuetify
  turns that `height` into `style="height: 0"` on `.v-table__wrapper` (`VTable.js:53-57`), and the wrapper
  is `flex: 1 1 auto; overflow: auto` inside a `.v-table` that is `display: flex; flex-direction: column`
  (`VTable.css:57-63,108-112`). That is the fill-the-parent-and-scroll trick: the body has **exactly as much
  height as the `.v-table` receives from its own flex parent, and not one pixel of its own.** It works
  everywhere else in the app because every other consumer sits in a definite-height flex chain
  (`RoutineSettingsView.vue:2` is `h-100 d-flex flex-column`; `ActivityTable.vue:42-43` gives `BasicTable`
  `class="flex-1-1" style="min-height: 0"`; `DesktopDistinctEntriesTable.vue:2` — the sibling tab that
  renders fine — has `flex-fill` on its root).
  `DesktopMappingsTable.vue:2` and `AndroidMappingsTable.vue:2` are the two consumers that do not: their root
  is `d-flex flex-column ga-2` with **no `flex-fill`**, so the root's height is its content height,
  `BasicTable.vue:2`'s `h-100` resolves against an auto-height parent (i.e. to `auto`), the `.v-table` gets
  zero slack, and the wrapper stays at `height: 0` — header and row are laid out inside it and clipped.
- **Why the evidence looks the way it does.** The finding read *"not clipped, since the row's own
  `getBoundingClientRect` still returns plausible coordinates"* and concluded paint order. That inference is
  backwards: `getBoundingClientRect` reports layout position and **ignores ancestor clipping**, which is
  precisely why `document.elementFromPoint` at that rect returns the ancestor (`v-card-text`, or the filter's
  `v-col` when the scroll box has been nudged by a focus) — the button is there in layout and absent from
  hit-testing. Playwright's actionability wait failing on *"receives pointer events"* is the same fact.
- **Files:** `DesktopMappingsTable.vue:2,7`; `AndroidMappingsTable.vue:2,7`. Reference only —
  `src/_common/component/dataTable/DataTable.vue:6-7`, `BasicTable.vue:2`, and the working sibling
  `DesktopDistinctEntriesTable.vue:2,9-10`.
- **What to change:** Add `flex-fill` to both roots so they mirror `DesktopDistinctEntriesTable.vue:2`, and
  give the `<BasicTable>` the same `class="flex-1-1" style="min-height: 0"` that `ActivityTable.vue:42-43`
  already uses — the second half is what lets the table shrink below its filter-row sibling instead of
  overflowing the card. Two attributes, two files. **Then check the case the trick exists for:** with 25+
  rows (change the page size or seed more), the body must scroll *inside* the card with a sticky header,
  not push the footer off the card.
- **Do not change:** `DataTable.vue`'s `height="0"` or `BasicTable.vue`'s `h-100`. They are the deliberate
  fill-parent contract that seventeen other tables rely on; making the body self-sizing would silently
  remove sticky headers app-wide. What *is* wrong at the framework level is that the contract is
  **undocumented** — that is `FW4`, and it is a docs commit, not a code change.
- **Verification:** `tracking-settings/X1`'s `Verify:` block on both routes — the row paints in a screenshot,
  and a **normal, non-forced** click on its `edit` button navigates to the `distinctEntries` tab with the
  form populated. Add: `document.elementFromPoint()` at the button's rect centre resolves to the button.
- **Risk:** None beyond layout. The unit's own remark that the Android `VCardText` lacks the app's `flex-fill`
  class is a red herring — Vuetify's `.v-card-text` is `flex: 1 1 auto` by default (`VCard.css:249-250`), so
  both views' card bodies already fill; the omission is one level lower.

## F13. Mappings tab: no filter control reaches the grid, and the delete button reaches nothing

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`,
  `src/core/activityTracking/view/AndroidSettingsView.vue`, and the two `*MappingsTable.vue` components
- **Closes:** `tracking-settings/B1`. **Also wires `tracking-settings/U1`** (see below), which stays listed
  under *Needs verification* until `F12` makes its button clickable.
- **Root cause — three dead paths, not the two the finding names.** Confirmed in source:
  1. `DesktopSettingsView.vue:32-35` renders `DesktopEntriesFilterBar` unconditionally and its `@filter`
     handler is `distinctEntriesTable?.load()`. On the Mappings tab that ref is `null` (the component is
     `v-if`'d out), so Filter and Enter are silent no-ops. Same at `AndroidSettingsView.vue:32-35`.
  2. `DesktopMappingsTable.vue` holds its own `mappingFilter` (`:59`) and `formData` (`:60`), and nothing
     watches either — `load()` is reached only via `defineExpose` and `BasicTable`'s `@onLoadItems`, which
     fires on page/sort changes. So Is active / Type / Ignored changes never fetch.
  3. **The one the finding missed, and the reason its suggested fix would not pass its own `Verify:`.** Even
     with a watcher, the Activity picker would filter nothing: `formData.activityId` is **never copied** into
     `mappingFilter.activityId` (`load()` at `:62-69` sends `mappingFilter.value` as-is), and the pattern
     fields on `mappingFilter` (inherited from `DesktopDistinctEntriesFilterRequest`) are **never bound** —
     the top bar edits the *view's* `filter` ref, a different object. Repointing `@filter` at
     `mappingsTable.load()` alone would fetch with an empty pattern every time.
     (`roleId`/`categoryId` are commented out of `TrackerDesktopMappingsFilter.ts:17-18`; that is fine —
     `ActivitySelectionForm`'s Role/Category selects cascade the Activity picker's options rather than
     filtering the grid, so they are not dead, just not wire fields.)
- **Files:** `DesktopSettingsView.vue:32-35,48-52`; `AndroidSettingsView.vue:32-35,48-52`;
  `DesktopMappingsTable.vue:1-19,59-79`; `AndroidMappingsTable.vue:1-19,57-77`
- **What to change:** Pick one owner for the pattern filter on the Mappings tab and wire it through.
  Recommended: the view passes its `filter` down to the mappings table as a prop (exactly as it already does
  to `DesktopDistinctEntriesTable` at `:44`), the table builds its request by merging that pattern into
  `mappingFilter` and copying `formData.activityId` into `mappingFilter.activityId`, and `load()` is
  triggered by (a) the view's `@filter` → `distinctEntriesTable?.load() ?? mappingsTable?.load()` and (b)
  a `watch` on the mapping-only fields (`type`, `isActive`, `isIgnored`) and on `formData.activityId`.
  Do **not** deep-watch the whole `mappingFilter` — the pattern text fields would then fire a grid request
  per keystroke, which is exactly why the distinct-entries side uses an explicit Filter button.
  **Same edit, same file, wire the delete:** add `@onDelete` on both `<BasicTable>`s (they declare only
  `edit` today — `DesktopMappingsTable.vue:36`), call `deleteEntity` (already exported by
  `useTrackerDesktopMappingCrud`, `desktopActivityTrackingApi.ts:100,111`) and re-`load()`, the way the
  other eight `@onDelete` consumers do (`RoutineSettingsView.vue:163-179` is the model, including its
  409 handling). Do **not** add a second confirmation through `useDeleteConfirmation` — `BasicTable` has
  already confirmed by the time `onDelete` fires, and Escalation §2 records that this bypass of the app's
  cascade rule is a framework question, not one to paper over per call site. **Expect the dialog to stay
  open after the row is gone** — see *Needs verification*, "the `BasicTable` delete dialog never closes":
  that is a framework defect this batch will be the first to observe, not something to work around here.
- **Do not change:** `BasicTable`'s `hasDelete = true` default — removing the button instead of wiring it
  would close `U1` by deletion, and the usecase names delete as this view's purpose.
- **Verification:** `tracking-settings/B1`'s `Verify:` block on both routes — a `POST
  …/tracker-desktop-mapping-by-pattern/grid` (android equivalent) fires with the updated filter and the count
  changes. Add the third path explicitly: pick an Activity in the picker and confirm the request body carries
  its id; type a process name and click Filter on the *Mappings* tab and confirm the body carries the
  pattern. Then run `U1`'s *What would verify it* step.
- **Risk:** Medium — this is the view's only search and its only delete, and the filter object is shared
  with the create form (`useMappingSettings.ts:33,40`), so a pattern typed to search the Mappings tab is
  also the pattern the next *Save* would write. That is the existing distinct-entries behaviour and is
  arguably the feature; just do not "fix" it in this batch.

## F14. Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path

- **Scope:** app-side `src/app/nav/navItems.ts`, `src/core/activityTracking/activityTracking.routes.ts` —
  **not** the framework's `useBreadcrumbs.ts` / `navTypes.ts`
- **Closes:** `tracking-settings/B2`, `activity-settings/B6` (borrowed — see the header note)
- **Root cause:** Both units guessed it and both were right: `matchesPath()` (`navTypes.ts:41-44`) is
  `path === to || path.startsWith(to + '/')`, and `findTrail()` (`useBreadcrumbs.ts:16-39`) keeps the
  longest match. The sidebar registers `desktopSettings` as the **literal `distinctEntries` tab path**
  (`navItems.ts:25,28`) and `activitySettings` as `/activity-settings/activities`. So
  `/activity-tracking/desktop/settings/mappings` matches nothing under `settings/` and falls to the longer
  of the two remaining prefixes — `/activity-tracking/desktop`, i.e. *"Desktop tracking"*, a sibling
  screen. `/activity-settings/roles` has no shorter prefix in the tree at all, hence *"Home"* alone. One
  mechanism, two symptoms, two units. **Not filed but source-certain:** `SidebarNavItem.vue:52` uses the
  same `matchesPath`, so on the Mappings tab the sidebar highlights *Desktop tracking* and on `/roles` it
  highlights nothing. Listed under *Needs verification*.
- **Files:** `src/app/nav/navItems.ts:25,28` (and the `activitySettings` entry);
  `src/core/activityTracking/activityTracking.routes.ts:27-31,37-41`
- **What to change:** Point the three nav entries at the **family path** — `/activity-tracking/desktop/settings`,
  `/activity-tracking/android/settings`, `/activity-settings` — and add redirect routes for the two tracking
  parents to `…/distinctEntries` (`/activity-settings` already redirects to `activities`,
  `_routes.md:25`). Prefix matching then resolves every tab value, valid or not, to the right crumb *and* the
  right sidebar item; the sidebar link still lands on the same first tab via the redirect. Optionally append
  the tab as an extra crumb with `useSetBreadcrumbExtra()` (the `F11` mechanism) — not required by either
  finding's `Expected`.
- **Do not change:** the framework matcher. Name-based resolution (the `activity-settings` unit's option 2)
  is a framework batch with its own risk to every app's sidebar and needs a `MenuItem.routeName` design; the
  data fix above closes both findings without it. Also do not register the other tabs as extra nav entries —
  `MenuItem` has no `hidden` flag (`navTypes.ts:10-16`), so they would appear in the sidebar.
- **Verification:** Both `Verify:` blocks — *"Desktop settings"* / *"Android settings"* on the Mappings tabs
  and on a bogus tab value; *"Home › Activity settings"* on `/activity-settings/roles` and `/categories`.
  Add: the sidebar highlights the settings entry, not the dashboard, on every tab.
- **Risk:** Low. The redirect adds two route records to `_routes.md`'s 53 — update the manifest.

## F15. Distinct-entries filter, page and sort are not in the URL

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`, `AndroidSettingsView.vue`,
  `src/core/activityTracking/composable/useMappingSettings.ts`, the two `*DistinctEntriesTable.vue`
- **Closes:** `tracking-settings/B3`
- **Root cause:** `useMappingSettings.ts:33` holds `filter` as a bare `ref`, and each table holds `page`,
  `itemsPerPage`, `sortBy` as bare refs (`DesktopDistinctEntriesTable.vue:56-59`). CLAUDE.md's *URL State*
  rule names all four. The finding filed only the filter; paging and sort are the same rule and the same
  edit, so they are in scope here rather than a later ticket.
- **Files:** as above; reference — `src/_common/composable/table/useTableUrlState.ts` (the framework's
  page/perPage/sortBy sync; `leisureFilterUrlState.ts` is the app's worked example of a filter on top of it)
- **What to change:** Sync the four through `useTableUrlState` plus a filter serializer, the way
  `core/leisure/composable/leisureFilterUrlState.ts` does. **Two traps, both already paid for once:**
  1. `edit()` (`DesktopSettingsView.vue:89-107`) mutates `filter` *and* calls `router.push(...)` in the same
     tick. A URL-sync watcher will `router.replace` against a stale `route.query` snapshot at the same
     moment — the exact two-writer race that is `F1`. Fold the query into the single `router.push` inside
     `edit()`, or suspend the sync while it runs.
  2. `useTableUrlState` and `BasicTable`'s mount-time `sortBy` push (`BasicTable.vue:192-203`) interact —
     see `F1`'s `defaultSortBy` note. The distinct-entries table uses `DataTable` directly, so it is
     unaffected; the mappings table (`F13`) uses `BasicTable` and is.
  Do the Mappings tab's `mappingFilter` in the same pass **only after `F13`**, when it actually filters.
- **Do not change:** `filter`'s double duty as the create form's pattern (`useMappingSettings.ts:40`). That
  means the in-progress rule pattern lands in the URL; it is bookmarkable state by CLAUDE.md's definition
  and harmless.
- **Verification:** `tracking-settings/B3`'s `Verify:` block, then reload with `page=2`/a sort in the query
  and confirm both survive. Re-run `edit()` from the Mappings tab and confirm the query is intact afterwards.
- **Risk:** Medium — the same class of race as `F1`; test the edit hand-off specifically.

## F16. The settings header row clips its labels at 1440 px

- **Scope:** app-side `DesktopSettingsView.vue:7-36`, `AndroidSettingsView.vue:7-36`
- **Closes:** `tracking-settings/B4`
- **Root cause:** The header `<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">` holds the title, the
  two-button `VBtnToggle` and the whole filter bar with no `flex-wrap`; the bar's own root only stacks below
  `md` (`DesktopEntriesFilterBar.vue:2`, `flex-column flex-md-row`). At 1440 px everything is a row and
  every child shrinks: the screenshot on disk reads *MAPPI*, *P…*, *Co…*, *W…* — confirmed from
  `desktop-settings-mappings--default.png` this pass, no browser needed.
- **Files:** as above
- **What to change:** Let the header wrap (`flex-wrap`) so the filter bar drops to its own line when it does
  not fit, and give the `VBtnToggle` `flex-shrink: 0` so tab labels never truncate. **Run after `F13`** — if
  that batch hides or repoints the bar on the Mappings tab, the row to lay out is different.
- **Do not change:** the filter bar's `flex-md-row` breakpoint — it is right for mobile and is not the
  problem.
- **Verification:** `tracking-settings/B4`'s `Verify:` block at 1440×900 on all four routes; re-check 1920
  still renders single-line, and 390 still stacks.
- **Risk:** None beyond layout.

## F17. CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means

- **Scope:** **docs only** — `CLAUDE.md`, the *Where a preference lives* section's second consequence
- **Closes:** `tracking-settings/P1`
- **Root cause:** The sentence *"Every settings page must be reachable from `/user/settings`"* is read
  literally by every unit agent (unit 10 raised it for `/routine-settings`, unit 6 for these two), while
  `moduleSettingsLinks.ts:10-14` records the actual rule — **preference** pages yes, **entity-management**
  pages no — and lists these exact routes as the excluded example. The two documents agree; only CLAUDE.md
  fails to say so where it is read.
- **What to change:** Qualify the sentence to *"every **preference** settings page"* and cross-reference the
  `moduleSettingsLinks.ts` comment as the owner of the list. One sentence. Nothing in `src/` moves.
- **Do not change:** `moduleSettingsLinks.ts` — adding the tracking routes there is the outcome the file's
  own comment argues against, and no finding asked for it.
- **Verification:** N/A — read-through. The next unit that inherits the "check `/user/settings`" brief
  should stop filing it.
- **Risk:** None.

## F18. The mount-time combobox rebuild writes back into the activities filter

- **Scope:** app-side `src/core/activity/composable/useActivityFilterDrafts.ts` (and the two `VCombobox`
  bindings in `src/core/activity/view/ActivitySettingsView.vue:28-51`)
- **Closes:** `activity-settings/B2`, `activity-settings/B3`. **Retests `U4`** — see *Needs verification*.
- **Root cause — one mechanism, two symptoms, and the unit's guess was right on both.** Confirmed in
  source: `refreshActivityCombos()` (`useActivityFilterDrafts.ts:65-76`) *reassigns* `roleCombobox` and
  `categoryCombobox` from the filter, and the two deep watchers at `:189-209` write the combobox back
  *into* the filter — `roleIds = vals.filter(…).map(v => v.id)`, which is `[]` when the combobox is
  empty. So every programmatic rebuild is also a write, and the rebuild runs in `onMounted` (`:103-107`),
  when `roleOptions` is still `[]` because `activityOptionsStore` is `persist: false` and its fetch has
  not resolved (`activityOptionsStore.ts:320`).
  - **B2:** with `?roleIds=11001`, `hydrateTabFromQuery` sets `[11001]`; the rebuild finds no option to
    match (`buildCombobox` drops unmatched ids, `activitySettingsUrlParams.ts:99-102`), assigns `[]`,
    the watcher writes `roleIds = []`, and the `activitiesFilter` deep watcher (`:167-173`) calls
    `syncUrl()`, which omits an empty list — the param is gone before the first request. When the
    options land, `watch([roleOptions, categoryOptions])` rebuilds from the already-wiped filter.
  - **B3:** on a bare load the constructor default is `roleIds = null` (`ActivityFilter.ts:8`); the
    same write turns it into `[]`. `useLookupTable.ts:41-52` guards its deep filter watch with a JSON
    snapshot **for exactly this case** — its comment names "a combobox watcher re-deriving ids/name from
    the same filter" — but `"roleIds":null` ≠ `"roleIds":[]`, so it fires `loadItems()` a second time,
    aborting the `BasicTable` mount's request. The Roles/Categories tabs have no combobox and fire once,
    which is the finding's own control.
- **Files:** `useActivityFilterDrafts.ts:65-76,103-113,189-209`; `ActivitySettingsView.vue:28-51`;
  reference only — `useLookupTable.ts:34-52`, `activitySettingsUrlParams.ts:93-105`,
  `activityOptionsStore.ts:164-169,320`
- **What to change:** Separate "the user edited the combobox" from "the code rebuilt the combobox" —
  today both go through one deep watcher. Recommended: delete the two combobox watchers and move the
  filter write into `@update:modelValue` handlers on the two `VCombobox`es (a function each,
  `onRoleComboboxInput(vals)` / `onCategoryComboboxInput(vals)`, exported from the composable). A
  component event fires for user input only, so `refreshActivityCombos()` becomes a pure derivation and
  both symptoms go. In the same handlers, **normalise the empty case to `null`** (`ids.length ? ids :
  null`) so clearing every chip returns the filter to its constructor shape and `useLookupTable`'s
  snapshot sees no change. If the watcher shape must stay, a guard flag only works with
  `{ flush: 'sync' }` on both watchers — the default pre-flush runs after a synchronous
  `syncing = false` has already been reset — so say which in the commit.
  **Do not** fix B2 by skipping the rebuild while the options are empty: a user with zero categories
  would then never get their chips built, and it leaves the writer in place for the next caller.
- **Do not change:** `useLookupTable`'s snapshot guard to treat `null` and `[]` as equal — that would
  mask the writer rather than remove it, and the guard's comment would become a second wrong claim about
  what the combobox does. Also leave the `watch(tab)` / `watch(activeTab)` mirrored early-exits alone;
  the composable's header comment explains why they are load-bearing and this batch does not touch
  tab switching.
- **Verification:** `B2`'s `Verify:` block — `?roleIds=11001` survives a fresh `goto` **and** the outgoing
  `POST /api/activity/grid` body carries `"roleIds":[11001]` (the rows will still not filter until
  Escalation §6 lands; check the request, not the table). `B3`'s block — exactly one grid `POST` per
  load, no `ERR_ABORTED`. Add: pick a role from the combobox, remove the chip, and confirm the request
  body reads `"roleIds":null` (not `[]`) and the URL has no `roleIds`. Then re-drive `U4`'s sequence
  (type a name, clear it) three times.
- **Risk:** Low-medium. The watcher graph in this composable has a warning comment for a reason; the
  change is confined to the two combobox edges, but run the tab-switch-with-filters-set case the comment
  describes before and after.

## F19. Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it

- **Scope:** app-side `src/core/activity/dto/response/Role.ts`, `Category.ts`,
  `src/core/activity/component/activityRole/ActivityRoleTable.vue`,
  `activityCategory/ActivityCategoryTable.vue`, `ActivityTable.vue:121-137`; plus one row in CLAUDE.md's
  *sanctioned cross-module imports* table
- **Closes:** `activity-settings/B7`, `activity-settings/A1`. **Answers `U2`** from source (below) — the
  browser step it asks for is optional.
- **Root cause — and two things the finding's suggested fix gets wrong.** `ActivityRoleTable.vue:2-15`
  and `ActivityCategoryTable.vue:2-15` use `BasicTable`'s default actions with `@onDelete`, so every row
  offers an always-enabled delete behind the generic *"Are you sure you want to delete X?"*. The finding
  proposes copying `ActivityTable.vue`'s `:disabled="!item.canDelete"` slot. That would fail twice:
  1. **The DTOs drop the field.** The wire carries `canDelete`/`usageCount` on both grids
     (`GridActivityRoleEndpoint.cs:41-44`, `ActivityCategoryGridResponse.cs:66-67` — and the finding's
     own evidence shows them), but `Role.fromJson` (`Role.ts:20`) and `Category.fromJson`
     (`Category.ts:14`) destructure neither. `item.canDelete` is `undefined`, `!undefined` is `true`, and
     **every** delete button would disable.
  2. **The two tables must not behave the same, because the server does not.** Read at the source:
     - **Roles:** `DeleteActivityRoleEndpoint.cs:42-62` refuses with **409** on both a `systemKey` and
       an in-use role, with a user-readable message — `Activity.RoleId` is `NOT NULL` and the FK is
       `Cascade` (`ActivityConfiguration.cs:34`), so refusing is the only non-destructive answer.
       `canDelete: false` is enforced. Mirror `ActivityTable`'s disabled button + tooltip here.
     - **Categories:** `DeleteActivityCategoryEndpoint.cs` is a bare `BaseDeleteEndpoint`; the FK is
       `SetNull` (`ActivityConfiguration.cs:42`), and `ActivityCategoryResponse.cs:26-31` says so in as
       many words: *"⚠ This one is advisory, not a prediction of a 409 … deleting a used category is not
       destructive — it blanks the classification … the field exists so the settings grid can say
       **what** a delete will reclassify before it happens."* Disabling it would block an operation the
       server deliberately allows. The correct shape is CLAUDE.md's cascade rule: a delete that takes
       other rows' state with it **always confirms and says how many** — `usageCount` activities will
       lose their category. That is `useDeleteConfirmation`'s `cascades: true` branch, which the
       generic `BasicTable` dialog cannot express (Escalation §2 is the same gap seen from
       `/routine-settings`).
- **Why `A1` is in this batch and not its own.** `ActivityTable.vue:122-131`'s trash `VIconBtn` has no
  `title`/`aria-label` (confirmed: Edit at `:99` and Archive at `:110` carry `:title`, the trash does
  not); its `VTooltip` hangs off the wrapping `<span>` because a disabled `VBtn` takes no pointer
  events. This batch tells a fixing session to copy that slot into two more tables — fix the template
  **first**, or the defect ships three times. Use **`:aria-label`**, not `:title`: the wrapper's
  `VTooltip` is already the visual tooltip, and a native `title` on the button would render a second
  one on hover (the finding's suggested `:title` fix would produce that). Same conditional text as the
  tooltip: `item.canDelete ? t('general.delete') : t('activities.archive.deleteBlocked')`.
- **Files:** `Role.ts:4-22`, `Category.ts:3-16` (add `usageCount = 0`, `canDelete = true` to the
  constructor and `fromJson`, defaults chosen so a non-grid read — the nested `role` on an
  `ActivityResponse`, which the API documents as carrying meaningless zeros — stays harmless);
  `ActivityRoleTable.vue` and `ActivityCategoryTable.vue` (custom `#actions` slot, `confirm()` from
  `useDialog` the way `ActivityTable.vue:296-313` does, then `useLookupTable`'s `onDelete`);
  `ActivityTable.vue:122` (the `aria-label`); `CLAUDE.md` — add `activity` to the `useDeleteConfirmation`
  importers row, since the table says "the five delete sites" and this makes a sixth. Locale keys for
  the category cascade copy go in `activity.{sk,en}.ts` (*"N activities will lose this category"*, with
  the count); the role tooltip can reuse `activities.archive.deleteBlocked` or get a role-specific key —
  check the SK reads naturally for a role before reusing.
- **Do not change:** the server. The asymmetry is designed and documented; do not file a "make
  categories 409 too" ask off this batch. Do not route the role delete through
  `useDeleteConfirmation` — `canDelete: true` means nothing references it, which is
  `ActivityTable`'s own reasoning at `:291-295`. Do not keep `@onDelete` on `BasicTable` alongside the
  custom slot; with `showActions` and a slot the default buttons are gone and the emit is dead.
- **Verification:** `B7`'s `Verify:` block on both tabs — the three system roles and every in-use row
  render a disabled Delete with a tooltip. Then the category half, which `B7` does not cover: click
  Delete on *"Errands"* (in use), and the dialog must name the count before Confirm; **cancel it** on the
  seed. To see the 204 + reclassify path end to end, create a throwaway category and activity through
  the API first (the mutating-spec rule). `A1`'s block — `getByRole('button', { name: 'Delete' })`
  resolves on the activities table, and hovering shows **one** tooltip. Then confirm the delete dialog
  on these two tables **closes** after Confirm — they are now on `useDialog().confirm()` and no longer on
  `BasicTable`'s built-in dialog, which is the one suspected of never closing (see *Needs
  verification*).
- **Risk:** Medium. Widening `Role`/`Category` touches every consumer of those DTOs (the option
  store, the forms, the nested `role`/`category` on `Activity`) — the additions are optional-with-default
  so nothing should notice, but run `npm run type-check`. The category cascade copy is a user-facing
  number; get the plural right in SK.

## F20. No catch-all route — any unknown URL renders a blank main area

- **Scope:** app-side `src/router.ts` (the route array's last entry) plus one small view and two locale
  keys in `src/locales/common.{sk,en}.ts` — **not** `activity.routes.ts`
- **Closes:** `activity-settings/B5`
- **Root cause — app-wide, not activity-settings.** `activity.routes.ts:10`'s
  `:tab(activities|roles|categories)` regex is correct and rejects `/activity-settings/nonsense`; what
  is missing is anything to catch the rejection. `src/` contains **no** `pathMatch`, no not-found route
  and no catch-all of any kind (grep across `src/**/*.{ts,vue}` this pass), so `/foo`, `/todo-list/abc`
  and every other unmatched path do exactly what the finding describes — sidebar and top bar render,
  `<RouterView>` renders nothing, and the console warns. Unit 2 is simply the first unit whose route
  has a constrained param, so it is the first to have typed a wrong one.
- **The 23 repeated empty-path warnings** are consistent with the ~two dozen `:to` links in the shell
  (`SidebarNavItem.vue:10,27`, `SidebarNavGroup.vue:35,60`, `UserMenu.vue:26-41`, `AppTopBar.vue:18`)
  each resolving via `useLink` against a current route that has no match; not verified further, and not
  worth it — once the current route *is* matched, the condition that produces them is gone. Confirm by
  console after the fix rather than by root-causing it first.
- **Files:** `src/router.ts` (append `{ path: '/:pathMatch(.*)*', name: 'notFound', component:
  NotFoundView }` **after** every spread — order is what makes it a fallback); the view itself.
  `TodoListView.vue:18-19` and `PlannerTaskLinkView.vue:8-9` are the app's existing not-found
  treatments (a `VEmptyState` with a localized title/text and a way home) — copy that shape.
- **What to change:** One global not-found route rendering a localized empty state with a link to
  `{ name: 'home' }`. Leave it **non-public**: a signed-out visitor on an unknown path should still go to
  `/login`, and the guard's `SIGNED_OUT_ONLY_ROUTES` bounce back to `/` afterwards is fine. Where the
  view lives is a judgement call CLAUDE.md's framework rule answers — a not-found page is generic enough
  that another app would want it as written, so `src/_common/component/` (submodule commit + pointer
  bump) is the "right" home; if the fixing session does not want a two-repo change, `src/core/home/view/
  NotFoundView.vue` with a `migration-revision.md` entry is the sanctioned fallback. The **route
  registration is app-side either way**, which is why this is an app batch.
- **Do not change:** the activity route's regex, or widen it to `:tab(…)?` with a `beforeEnter` — the
  finding's suggested fix. That closes one family and leaves every other unmatched path blank; and a
  *missing* tab already redirects (`activity.routes.ts:5-8`), so the only case it would add is
  "invalid tab → activities", which is arguably wrong (a bad URL should say so, not silently land
  somewhere else). `B5`'s pass condition accepts either; the global page satisfies it.
- **Verification:** `B5`'s `Verify:` block, then `/foo` and `/todo-list/abc` — all three render the
  not-found state, the console logs **no** `[Vue Router warn]`, and the sidebar highlights nothing.
  Signed out, `/foo` still lands on `/login`.
- **Risk:** Low. A catch-all declared *before* a real route would shadow it — it must be last, and
  `_routes.md` gains one record (54, or 56 after `F14`'s two redirects).

## F21. Categories table's "Role" column is a comma-joined aggregate presented as a single value

- **Scope:** app-side `src/core/activity/component/activityCategory/ActivityCategoryTable.vue:59`,
  `src/core/activity/_locales/activity.{sk,en}.ts`
- **Closes:** `activity-settings/P1`
- **Root cause:** By design on the server and merely mislabelled on the client.
  `ActivityCategoryGridResponse.cs:14-36` documents `Role` as *"every distinct role worn by the
  activities in this category, alphabetical and comma-joined"* — a category has no role of its own — and
  the grid sorts the column through a `RoleSortKey` proxy (`:46-47`, mapped from the incoming `role`
  key). The client header is `t('activities.role')`, the same singular label the Activities tab uses
  for a real FK. `Category.ts:10` already types it `role: string | null`; `CategoryRequest.ts` correctly
  has no role field. Severity `polish` stands — nothing is wrong, the header lies.
- **Files:** `ActivityCategoryTable.vue:59`; `activity.sk.ts` / `activity.en.ts` (one new key)
- **What to change:** A header that says what it is — *"Used under"* / *"Roles in use"* — as a new
  locale key; **keep the column key `role`**, because that is the sort key the server remaps. Rendering
  the string as chips (split on `", "`) is optional and cheap; do it only if the row height stays
  single-line at the seed's widest value (*"Health & Fitness, Hobbies & Leisure, Work"*).
- **Do not change:** `Category.ts` or the DTO shape, and do not add a `roleId` to `CategoryRequest` —
  the server has no such column and the unit's inference about the glossary is a doc question, not a
  code one.
- **Verification:** `P1`'s `Verify:` block; sort by the column once in each direction and confirm it
  still orders (the key must not have changed).
- **Risk:** None.

## F22. Activities filter bar clips the "Categories" label

- **Scope:** app-side `src/core/activity/view/ActivitySettingsView.vue:12-67`
- **Closes:** `activity-settings/P2`
- **Root cause:** The filter row `<div class="d-flex ga-2 ml-14 flex-1-1">` holds five controls (two
  text fields, two chip comboboxes, a three-button toggle) with no `flex-wrap` and no `min-width` on any
  of them, so at the captured width every child shrinks evenly and the longest label loses. Same class
  as `F16` (a flex row with shrinkable children in `tracking-settings`) — a different file with a
  different set of children, so a different edit, and kept separate for that reason; if both land in one
  session, use the same treatment.
- **Files:** `ActivitySettingsView.vue:12` (the row) and `:28-51` (the two comboboxes)
- **What to change:** A `min-width` on the two comboboxes (they also grow chips, so they are the ones
  that need room) and `flex-wrap` on the row so the toggle drops to a second line before anything
  truncates. Check 1440 and 1920 — the finding measured 1920 and it clipped there, so 1440 is worse.
- **Do not change:** `VBtnToggle`'s `flex-0-0` — it is already the one child that must not shrink.
- **Verification:** `P2`'s `Verify:` block at 1920 and 1440; a screenshot, since the a11y tree cannot
  see truncation.
- **Risk:** None beyond layout.

## F23. Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens

- **Scope:** **docs only** — `prompts/view-docs/README.md` *Parallelism* paragraph, and CLAUDE.md's
  *Browser verification — Signing in* section
- **Closes:** `activity-settings/U3` (re-graded — see *Contradictions* §19)
- **Root cause:** The runbook says *"If you do parallelise inventory passes, give each agent its own
  session name and have it `state-load` the auth file"*. Under the API that is wrong on its face:
  `JwtService.cs:38` calls `RotateRefreshTokenAsync` on **every** refresh, and
  `RefreshTokenService.cs:35` tolerates a stale concurrent refresh for a **5-second** grace window only.
  Two sessions loaded from one `auth-10001.json` hold one refresh token; the first to hit the ~15-minute
  access-token expiry rotates it, and the second, refreshing minutes later, gets `POST /api/auth/refresh`
  → **401** and a real sign-out — which is precisely the sequence `U3` recorded, on a pass its own
  operator note says ran alongside two other units. The unit's hypothesis (b) is the mechanism; (a),
  plain TTL expiry, cannot produce a 401 on `/refresh` for a token that had just been used successfully.
- **What to change:** Replace the sentence with the rule: **one signed-in state per concurrent
  session.** Either sign each session in separately (each gets its own refresh token) or `state-load`
  the file into **one** session only. Add one line to CLAUDE.md's 401-burst paragraph: *"a 401 on
  `/api/auth/refresh` itself is not the expected burst — it means the refresh token was rotated away,
  usually by a second session sharing the same state file."* Nothing in `src/` changes.
- **Do not change:** the API's rotation or grace window. Rotation is the correct security posture and
  5 s is generous for the SPA's own concurrent-refresh race, which is what it is for.
- **Verification:** Read-through. The next parallel run should not lose a session.
- **Risk:** None.
- **Grown in the fifth pass — two more rules from `todo-routine`'s round-5 environment note, same
  paragraph, same edit.** That round ran alongside at least two other agents (`playwright-cli list` showed
  `trkset` and `activity-settings` sessions) and paid for it three ways, each a different mechanism from
  the refresh-token one above:
  1. **The unnamed `default` browser session is shared by every agent that omits `-s=`.** Round 5 saw
     navigations to `/routine-todo-list` land on `/todo-list/13001`, two dialogs open with no action of its
     own, and two `todo-lists` fixture items (14015, 14013) toggled by clicks that were meant for another
     tab — all genuinely two agents driving one browser. Switching to `-s=todo-routine` stopped it at once.
     The runbook's *"give each agent its own session name"* is conditional on *"if you do parallelise"*, and
     `PROMPT-TEMPLATE.md` never mentions `-s=` at all (grep confirms) — so the unit agent cannot know to.
     **Make it unconditional in the template:** every `playwright-cli` command in a unit pass carries
     `-s=<unit-name>`. CLAUDE.md's *Browser verification* examples should carry it too, since agents copy
     them verbatim.
  2. **`POST /api/test/seed` is a live hazard mid-pass, not a start/end-of-pass operation.** A reseed
     wipes every account; round 5's three `B9` attempts each lost a period it had just created — the third
     time on a plain reload — and its two accidental mutations were reset before it could revert them
     itself. The template's *"reseed at the end"* advice (`PROMPT-TEMPLATE.md:172`) needs the other half:
     **never reseed while another unit may be running**, and a mutation pass that sees a row it created
     vanish should suspect a reseed before suspecting the app.
  3. **The runbook already forbids concurrent mutation passes** (*Parallelism: inventory passes can,
     mutation passes cannot*), and round 5 was a mutating retest running concurrently anyway. That is an
     operator error the runbook cannot prevent, but it can make cheaper to notice: state in the template
     that `state-load`, `-s=`, and "am I the only mutating session" are three separate questions.
  The `-s=` half is the one that changes agent behaviour; the other two are one sentence each.

## F24. Routine components format dates through the browser's locale, not the account's

> ✅ **FIXED 2026-09-14.** `composable/useRoutineDateFormat.ts` (`shortDate` / `shortWeekday` / `shortMonth` /
> `periodLabel`, all through `localeTag(locale.value)`) replaces all eight call sites; the three private
> `formatDate` helpers are gone. Verified per the block below in SK (`po ut st št pi so ne`, `1. 9. | 8. 9. …`,
> `sep okt … aug`, reset date `15. 9.`, heatmap tooltip `7. 9. · všetko hotové`, freeze chip `obnoví sa 1. 10.`,
> history-dialog tooltip `25. 5. – 1. 6. · všetko hotové`) and the no-reload EN switch (`Mon | Tue | …`).
> Two things the verification turned up and fixed with it, both in this module: the SK
> `freeze.remainingTooltipWithReset` template ended in `{date}.` and rendered `1. 10..`; and **the history
> dialog's calendar heatmap had never rendered at all** — ECharts threw *"Heatmap must use with visualMap"*
> because R1's frozen series was not bound to one, and `getThemeColor` only wrapped `rgb()` around values with
> a space while Vuetify writes `5,150,105`, so the cells would have been black anyway. `RoutineGroupHistoryBody.vue`
> now carries a second fixed-colour visual map and a channel-triplet check. Not filed by any unit (nobody could
> have hovered a cell that was not there); recorded on `todo-routine/B10`'s status line.

- **Scope:** app-side `src/core/todoList/` — five files, eight call sites, one helper
- **Closes:** `todo-routine/B10`
- **Root cause:** `toLocaleDateString(undefined, …)` resolves the **browser's** `Intl` locale, and the
  account's language is a vue-i18n setting the browser knows nothing about. The finding names two call
  sites in one file; a grep for `toLocaleDateString(undefined` across `src/` finds **eight, in five files,
  all in this module's routine components** — the same defect written five times, each with its own private
  formatter:
  - `component/routine/RoutinePeriodTimeline.vue:56` (`resetDateLabel`) and `:118-121` (the per-segment
    `label` — weekday / month+day / month, by segment mode) — the finding's two
  - `component/routine/RoutineGroupHeatmap.vue:120` — heatmap cell tooltip date
  - `component/routine/dialog/RoutineGroupHistoryBody.vue:163` — history dialog period labels
  - `component/routine/RoutineStreakFreeze.vue:69-72` — the `date` interpolated into
    `routineTodoList.freeze.remainingTooltipWithReset`
  - `composable/useStreakFreeze.ts:87-89` — `formatDate()`, a **module-level** function with no `useI18n`
    in scope, feeding `formatPeriodLabel`
  The app already has the correct pattern in three places, none of them in this module: `localeTag()` from
  `@/i18n.ts` maps the i18n locale to a BCP-47 tag, and `NowBar.vue:261` (`dateLocale = computed(() =>
  localeTag(locale.value))`), `LegalDocument.vue:68` and this module's own `useAnchorDayOptions.ts:50` (the
  round-3 `Intl.PluralRules` fix) all pass it explicitly. Round 3 localized the *strings* on these screens
  (B4/B6) by grepping for literals, which is exactly why this survived: `toLocaleDateString` produces real
  text in every locale, so there is no raw key and no literal to find.
- **Files:** the five above; reference — `src/i18n.ts:35` (`localeTag`),
  `src/core/todoList/composable/useAnchorDayOptions.ts:35,50`
- **What to change:** One small composable in `src/core/todoList/composable/` — say
  `useRoutineDateFormat()` returning `shortDate(date)` (month+day), `shortWeekday(date)` and
  `shortMonth(date)`, each `computed`-aware of `locale` via `localeTag(locale.value)` — and replace all eight
  call sites with it. The `useStreakFreeze.ts` site is the one that needs care: `formatDate` is called from
  inside the composable's returned `formatPeriodLabel`, so either `useStreakFreeze()` calls
  `useRoutineDateFormat()` itself (it already runs in setup scope) or `formatPeriodLabel` takes the
  formatter as a parameter. Do the `RoutinePeriodTimeline` `segments` computed last and make sure it still
  re-evaluates on a locale switch — it depends on `timePeriod` only today, and a `t()`-free computed will
  not re-run when `locale` changes unless it reads `locale.value` (through the helper) inside its body.
- **Do not use `formatLocalized` from `_common/utils/DateTimeHelper.ts`**, which the finding offers as an
  alternative. Despite its name it is `dayjs(date).locale('sk').format(format)` — **hardcoded Slovak**, as is
  every other formatter in that file (`:73-107`). In EN it would render Slovak abbreviations, i.e. the
  mirror image of this bug. That is a framework gap (a helper called *localized* that is not) worth a
  `migration-revision.md` line, not a fix in this batch — see *Contradictions* §22.
- **Do not change:** `RoutinePeriodTimeline.vue:68-71`'s `timeLabel` — it already goes through `t()` and
  is the correctly-localized half the finding contrasts against. Also not in scope:
  `activityTracking/component/stackedBars/StackedBarsGrid.vue:460` (`toLocaleString('en', …)`, hardcoded
  English — same class, different module, unit 5 has not run) and the four `toLocaleTimeString([], …)`
  calls in `activityTracking/component/timeline/` (locale-neutral `HH:MM`; fine).
- **Verification:** `todo-routine/B10`'s `Verify:` block — account set to Slovak, `/routine-todo-list`,
  Weekly card reads `po ut st št pi so ne`-style weekdays and Monthly/Yearly cards Slovak month forms, and
  the Daily card's top-right reset date follows. Then, still in SK: hover a heatmap cell, open a group's
  history dialog, and hover the freeze budget chip — the three sites the finding did not name. Switch back
  to EN **without reloading** and confirm every one of them re-renders in English (the `computed`
  dependency check above).
- **Risk:** Low. Pure formatting; no request shape changes. The one behavioural difference a user could
  notice is that the timeline's labels now follow the *account* language rather than the *OS* language,
  which is what every other string on the card already does.

## F25. `/routine-settings` "Color" column header is the capitalized raw key

> ✅ **FIXED 2026-09-14.** `RoutineSettingsView.vue:103` → `t('routineTodoList.timePeriods.color')`. Verified:
> second header reads *Farba* in SK and *Color* in EN, console clean.

- **Scope:** app-side `src/core/todoList/view/RoutineSettingsView.vue:103`
- **Closes:** nothing filed — `todo-routine/B4`'s round-5 verification note records it as *"noted here
  rather than filed"*. Given a batch because it is the last unlocalized string on a screen whose
  finding is otherwise closed, and it is one token.
- **Root cause:** `new TableColumn('color', '', false)` — an intentionally empty title, on the theory that
  a swatch column needs no header. The framework does not honour that: `TableHeaderComposable.ts:28` is
  `title: col.text !== '' ? col.text : capitalizeString(col.key)`, so `''` becomes **"Color"** in every
  locale. Round 5 saw it as the one English header on an otherwise Slovak table. The app's own convention is
  the opposite of the empty string: `ActivityCategoryTable.vue:62` and `ActivityRoleTable.vue:61` both
  title their swatch column `t('activities.color')`. And the key already exists —
  `routineTodoList.timePeriods.color` (`todoList.en.ts:192`, SK mirror) is what `TimePeriodForm`'s Color
  field uses.
- **What to change:** `new TableColumn('color', t('routineTodoList.timePeriods.color'), false)`. The
  `columns` computed already tracks the locale (the comment above it at `:100-101` says why), so nothing
  else moves.
- **Do not change:** `TableHeaderComposable.ts`'s fallback. Whether `''` should mean "no header" is a
  framework decision (rule 4) with one call site asking for it, and the app convention says the header
  should exist anyway.
- **Verification:** `/routine-settings` in SK — second column header reads *Farba*; in EN, *Color*. Console
  clean.
- **Risk:** None.

## F26. The period-total banner is a `flex: 1 1` item — it has no size to wrap on

- **Scope:** app-side `src/core/historyDashboard/component/summaryCards/HistoryPeriodBanner.vue`
- **Closes:** `history-review/B1`
- **Root cause — not the one the finding names, and its suggested fix would not work.** Vuetify's own
  stylesheet sets `.v-alert { display: grid; flex: 1 1; }` (`VAlert.css:1-3`), and the two-value shorthand
  is `flex: 1 1 0%` — a **zero flex-basis**. So inside `HistorySummaryCards.vue:4`'s
  `d-flex ga-4 align-center mb-4 flex-wrap` row the banner's *hypothetical* main size is 0 px: the row's
  wrap test sums title + 170 px + 100 px + three gaps + **0** and finds it fits, so `flex-wrap` never
  fires. The alert then *grows* into whatever is left over, capped by the inline `max-width: fit-content`
  (`HistoryPeriodBanner.vue:10`). In the Summary view's `lg="6"` column (`HistorySummaryView.vue:81-85`,
  ~560 px at 1440 wide) the leftover after *"Top Activities"* and the two selects is about 60 px — which
  is the 62 px the finding measured. Nothing is *shrinking*; the finding's `flex-shrink: 0` would leave
  the basis at 0 and change nothing.
- **Files:** `HistoryPeriodBanner.vue:10` (the inline style) and `:69-73` (the `.myAlert` block)
- **What to change:** Give `.myAlert` `flex: 0 0 auto` (basis `auto` is the whole fix — the item's
  hypothetical size becomes its content width, the row wraps it to its own line when it does not fit, and
  it never grows). Drop the inline `max-width: fit-content`, which was compensating for the grow half of
  the same shorthand. Keep it a flex item; do not `position` it or move it out of the row — the row's
  `flex-wrap` is the behaviour the finding asks for.
- **Do not change:** `HistorySummaryCards.vue:4`'s row. Its `flex-wrap` is correct and the two selects'
  `min-width`/`max-width` are what keep *them* legible. Also not the `VAlert` `density`/`variant` — the
  alert is the right size once it is allowed to be its own size.
- **Verification:** `history-review/B1`'s `Verify:` block at ≥ 1440 px — the banner reads *"Period total:
  19h 7m vs previous: 7h 16m +163.1%"* in full, on one line or on its own line below the selects. Then
  `?range=threeDays` or any range with no baseline (`percentChange === null`), so the *"no baseline"*
  caption branch is exercised at its shorter width; and 1920 wide, where the banner should sit inline.
- **Risk:** None. One element's flex shorthand.

## F27. History dashboards have no error state — three fetch owners null or keep their data on failure, and every panel says "No data for this period"

- **Scope:** app-side — `src/core/activityHistory/composable/useHistoryDashboard.ts`,
  `src/core/historyDashboard/component/HistoryTimeline.vue`,
  `src/core/activityHistory/view/HistoryCalendarView.vue`, and the panel components that render the
  empty state (`HistorySummaryCards.vue`, `HistoryPieChartSection.vue`, `HistoryInsights.vue`) plus the
  two views' `<StackedBarsChart>` bindings
- **Closes:** `history-review/B2`
- **Root cause — confirmed, and wider than filed.** Three different failure behaviours, none of them an
  error state:
  1. **The composable nulls and forgets.** `useHistoryDashboard.ts:135-182` — each of the four fetchers is
     `try { data = await … } catch { data = null } finally { loading = false }`. Its own comment (`:132-134`)
     says the null is deliberate so a stale chart never reads as a true one, and that *"the axios
     interceptor still raises the error snackbar"*. Both true; but `null` is also what an empty response
     *looks like* to every consumer — `HistorySummaryCards.vue:49` (`!data || data.cards.length === 0`),
     `HistoryPieChartSection.vue:14`, and `HistorySummaryView.vue:44-55` / `HistoryDetailView.vue:91-100`
     pass `StackedBarsChart` `:windows`/`:loading` and **no `:error`**, so the chart's own `windows.length
     === 0` branch (`StackedBarsChart.vue:60-69`) renders the no-data copy. A snackbar that disappears
     versus a panel that stays on screen saying *"No data for this period · 09.09.2026"* — the panel wins.
  2. **The timeline keeps the previous day.** `HistoryTimeline.vue:156-164` is `try { historyList = await
     … } finally { loading = false }` — **no `catch`**. A failed `detail/timeline` request leaves the
     *previous* date's records under the new date's `periodLabel` (`:14`), which is precisely the
     stale-reads-as-true case the composable's comment was written to prevent, and the rejection escapes
     the `watch` at `:166-169` as an unhandled one.
  3. **The calendar view renders a blank grid.** `HistoryCalendarView.vue:54-69` is the same
     `try/finally` with no `catch`. On a failed month change `days` keeps the previous month's rows;
     `CalendarGrid.calendarWeeks` (`:209-266`) looks each week up by date, finds nothing in the new range,
     pushes no weeks — and `allDaysEmpty` (`:52`) is `false` because the *old* rows have data, so the
     empty state does not render either. Blank card, no message, unhandled rejection from the
     `dateRangeChange` emit's watcher.
  Cases 2 and 3 are **source-certain and unobserved** — the unit mocked only `detail/pie-chart`. They are
  in this batch because they are the same concern in the same view family with the same fix, not because
  a browser has seen them; the verification step below is what makes them observed.
- **The pattern is already written, one module over — copy it, do not design a new one.**
  `useActivityDashboard.ts:306-316` holds one `ref(false)` error flag per panel; each fetcher resets it,
  sets it in `catch` (skipping `axios.isCancel`, `:109-110`), and requests carry `_silent: true` so the
  interceptor's snackbar is suppressed and the failure surfaces **only** as the panel's retry state
  (`:306-307`); the empty-state test at `:483-496` is guarded on `!…Error` for every panel. The four
  tracking dashboards then bind `:error`/`@retry` on every panel (`ActivityDashboard.vue:21-87`), and
  `StackedBarsChart.vue:41-57` **already renders that state** — icon, `activityTracking.common.loadFailed`,
  a Retry button emitting `retry`. `useHistoryDashboard`'s docstring (`:80-82`) says it was *"shaped after
  `activityTracking`'s `useActivityDashboard`"*; the error half is the part that was not carried over.
- **Files:** `useHistoryDashboard.ts:101-105` (add the four flags beside the loading ones), `:135-182`
  (set/reset), `:207-211` (exclude errored panels from `isEmpty` — a failed round must not trigger the
  first-run check, and must never resolve `hasAnyHistoryEver` to `false`), `:251-277` (export);
  `historyDashboardApi.ts:28-103` (`_silent: true` on the seven dashboard reads — **not** on
  `getHasAnyHistoryEver`, which has its own `catch`); `HistorySummaryCards.vue:47-53` and
  `HistoryPieChartSection.vue:14-20` (an `error?: boolean` prop and a `retry` emit, rendering the same
  shape as `ActivityPieChartSection.vue:24` — `HistoryEmptyState` can take an `error` variant, or a
  sibling `HistoryErrorState`, whichever keeps the H7 `periodLabel` off the error copy); `HistoryTimeline.vue:156-164`
  and `HistoryCalendarView.vue:54-69` (add the `catch`, an `error` ref, and the state); the two views'
  `<StackedBarsChart>` (`:error="stackedBarsError" @retry="fetchStackedBars"`) and `HistoryInsights`
  (which reads `pieChartData`/`timeOfDayData` and should hide, not say "no data", when either errored).
- **What to change:** Exactly the tracking shape, in the history composable and the two view-local
  fetchers. **Two decisions to make once, not per panel:** (a) `_silent` — adopt it, so a failed round
  is one retry state per panel and not four snackbars plus four panels; (b) the Calendar view's error
  state has to render *outside* `CalendarGrid` (the grid has no error slot and is framework) — the
  `HistoryEmptyState` slot above it at `:8-13` is the place, with `days` cleared to `[]` on failure so the
  grid is honestly empty rather than blank-with-stale-rows. Retry for the calendar re-fires
  `fetchCalendarActivity` with the last range — hold the range in a ref; `CalendarGrid` only emits it
  on change.
- **Do not change:** `StackedBarsChart.vue` — it already has the state. `HistoryEmptyState`'s existing
  callers' copy (`activityTracking.common.noDataForPeriod`) — cross-module locale reuse that the H5
  comment records as deliberate; the *error* copy can reuse `activityTracking.common.loadFailed`/`retry`
  the same way or get `historyDashboard.*` keys, but do not fork the no-data string. `checkFirstRunIfEmpty`'s
  own `catch` (`:217-225`) — it is already right.
- **Verification:** `history-review/B2`'s `Verify:` block (`playwright-cli route
  "**/api/activity-history/dashboard/detail/pie-chart" --status=500`, reload `/activity-history/detail`) —
  the pie panel shows a state visibly distinct from *"No data for this period"*, with a working Retry
  (`unroute`, click, the panel populates). Then the two cases the unit did not mock: route
  `**/dashboard/detail/timeline` → 500 and **change the date** — the timeline must not show the previous
  day's records; route `**/dashboard/calendar` → 500 and **change the month** — the calendar must show an
  error state, not a blank grid, and `playwright-cli console error` must carry **no** unhandled
  rejection. Then the summary: route `**/dashboard/summary/*` → 500 on a fresh load and confirm the
  first-run block does **not** appear (the `isEmpty` guard). Finally, with nothing routed, the seed's
  empty day (`date=2026-09-07`) must still read *"No data for this period"* — the fix must not turn empty
  into error.
- **Risk:** Medium — it touches every panel on three views and changes what a failure looks like for all
  of them. `_silent` removes a snackbar users may be used to; that is the tracking dashboards' existing
  behaviour and the consistent choice. The `isEmpty` guard is the subtle part: get it wrong in the other
  direction and a genuinely-new user with one failed panel never sees the onboarding block.

## F28. `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer

- **Scope:** app-side `src/core/activityHistory/view/HistoryDetailView.vue` — not the framework
- **Closes:** `history-review/B3` (re-graded to `polish` — *Contradictions* §29)
- **Root cause:** Confirmed, and the finding's own reading is exact. `navItems.ts:12-17` registers the
  History group with two children, `to: '/activity-history'` (Summary) and `/activity-history/calendar`;
  `findTrail()` (`useBreadcrumbs.ts:16-39`) keeps the longest `matchesPath` hit and
  `'/activity-history/detail'.startsWith('/activity-history' + '/')` is true, so Detail inherits Summary's
  crumb. Same class as `_shell/P1` (`/todo-list/:id` inheriting `/todo-list`), same fix — `F11` —
  which is now the fourth consumer of `useSetBreadcrumbExtra()` in this tree (`TodoListView.vue:224`
  and three framework detail views). Not `F14`'s class: that was a nav `to` naming one *tab* of a family;
  this route is a drill-down with no nav entry at all, by design (`_routes.md`, orphan table, resolved by
  unit 3).
- **Files:** `HistoryDetailView.vue` (script setup — one `useSetBreadcrumbExtra()` call, one `watch`)
- **What to change:** `setBreadcrumbExtra([{ title: t('history.detail.title') }])` on setup — the key
  already exists (`activityHistory.en.ts:28`, *"History Detail"*). Optionally append the viewed date; if
  so, format it through `localeTag(locale.value)` (`src/i18n.ts:35`, the `F24` rule) — **not**
  `formatToDate` from `DateTimeHelper.ts`, which is hardcoded `sk` (*Contradictions* §22) and is already
  what `periodLabel` uses on this view (in scope to leave, out of scope to copy). Watch `date` so the
  segment follows the picker. The `onBeforeUnmount` cleanup is the composable's; nothing to add.
- **Do not change:** `navItems.ts` — registering `/activity-history/detail` would put a landing-page
  entry in the sidebar for a page that is never a landing destination. Not `useBreadcrumbs.ts` (`F11`'s
  *Do not change*, same reason). Not the sidebar highlight: `SidebarNavItem.vue:52` will keep lighting
  *Summary* on Detail through the same `matchesPath`, and for a drill-down that is the right answer.
- **Verification:** `history-review/B3`'s `Verify:` block — `/activity-history/detail?date=2026-09-09`
  reads *"Home › Summary › History Detail"* (or with the date); `/activity-history` itself still reads
  *"Home › Summary"*; navigate Detail → Calendar via the icon button and confirm the extra crumb is gone.
- **Risk:** None. `extraSegmentSlots` is module-level state; the unmount hook clears it — `F11` proved
  that on the same mechanism.

## F29. Stacked-bar columns are bare `div`s — no name, no role, no `tabindex`, no key handler; and on Detail they show a pointer and do nothing

- **Scope:** app-side `src/core/activityTracking/component/stackedBars/StackedBarColumn.vue`,
  `StackedBarsGrid.vue`, `StackedBarsChart.vue` — **unit 5's module**, shared with `activityHistory` per
  `migration-revision.md` §7 (see the note under the summary table)
- **Closes:** `history-review/A1`
- **Root cause:** Confirmed. `StackedBarColumn.vue:2-8` is `<div class="bar-column" … @click>` with two
  coloured child `div`s and nothing else; `.bar-column { cursor: pointer }` (`:77-81`). No `role`, no
  `tabindex`, no `aria-label`, no `title`, no `@keydown`. The hover tooltip (`StackedBarsGrid.vue:89-90`
  → `StackedBarsTooltip`) is the only place the bar's name and duration are ever spelled out, and it is
  mouse-only. So the finding's *"Tab to or inspect"* repro is half impossible — Tab cannot reach a
  `div` — and the gap is wider than naming: the Summary view's primary drill-down is unreachable without a
  mouse.
- **The two consumers disagree about what a bar *is*, and the fix has to know.** `HistorySummaryView.vue:54`
  binds `@activityClick="handleActivityClick"` (drill into Detail); `HistoryDetailView.vue:91-100` binds
  **no** click handler at all, and the four tracking dashboards have their own semantics. A blanket
  `role="button"` would name a control on Detail that does nothing — the same affordance lie `F30` is
  about, from the other side. Today Detail's bars already lie a little (`cursor: pointer`, no action);
  fix that here rather than leave it.
- **Files:** `StackedBarColumn.vue:2-8` (the element), `:30-43` (props/emits), `:76-81` (cursor);
  `StackedBarsGrid.vue:78-93` (the mount — it has `formatWindowLabel(window)` at `:112` and is the only
  layer that knows the window's time range); `StackedBarsChart.vue:99-121` (an `interactive?: boolean`
  prop, or derive it — the component cannot see whether the parent bound `@activityClick`, so a prop it
  is); the two history views and four tracking dashboards (pass it where a handler is bound).
- **What to change:** On `StackedBarColumn`: an `:aria-label` built from the domain name (the `_other`
  bucket via `activityTracking.common.other`), the duration (`fromSeconds(data.activeSeconds)` — the
  tooltip's own wording, `StackedBarsTooltip.vue`), and the window label the grid passes down;
  `role="button"`, `tabindex="0"` and `@keydown.enter.space.prevent` **only when `interactive`**, else
  `role="img"` (a named graphic, not a control) and `cursor: default`. Localize the label pattern —
  one key in `activityTracking.{sk,en}.ts`, since the component is that module's. Keyboard focus needs
  a visible ring (`:focus-visible` outline on `.bar-column`); the grid is a positioned CSS grid, so check
  the ring is not clipped by a neighbouring column's `z-index: 5`.
- **Do not change:** `StackedBarsGrid`'s tooltip or hit-testing — the mouse path works and unit 3 drilled
  through it. Do not move the component into `historyDashboard` or `_common` in this batch;
  `migration-revision.md` §7 already records that decision and its reasons. Do not touch
  `StackedBarsGrid.vue:460`'s `toLocaleString('en', …)` (`F24`'s *Do not change* named it — unit 5's).
- **Verification:** `history-review/A1`'s `Verify:` block on `/activity-history` — a bar exposes a
  localized name in the snapshot (`getByRole('button', { name: /…/ })` resolves), **Tab reaches it**,
  Enter drills into Detail with the same `date`/`groupBy` as a click. Then `/activity-history/detail`:
  the bars are `img`, not `button`, and the cursor is no longer a pointer. Then one tracking dashboard
  (`/activity-tracking`) to confirm its own click semantics are intact and its bars are named. SK as
  well as EN for the label.
- **Risk:** Low-medium. Six dashboards render this component; the change is additive markup plus a
  prop with a `false` default, so an unmodified consumer gets named, non-interactive bars — which is
  the honest state for a chart nobody bound a handler on. The bar count is data-driven (25–42 on the
  seed), so check the snapshot stays readable rather than becoming 42 long labels.

## F30. Summary cards are named "View details for X" and toggle a highlight — and the same cloned label sits on `activityTracking`'s domain card

- **Scope:** app-side `src/core/historyDashboard/_locales/historyDashboard.{sk,en}.ts`; adjacent —
  `historyDashboard/component/summaryCards/HistorySummaryCard.vue`. ~~`activityTracking.{sk,en}.ts`,
  `ActivityDomainCard.vue`~~ — **withdrawn, eleventh pass (§80).**
- **Closes:** `history-review/P1`. ~~**Also closes, unfiled:** the identical mismatch on
  `ActivityDomainCard.vue:7-9` — `activityTracking.statColumn.viewDetails` (*"View details for
  {domain}"*), whose click is `emit('click', domain)` → `domainClick` → `selectedDomain`
  (`ActivitySummaryCards.vue:72-73,135-136`): the same select-toggle.~~ **Wrong, and unit 5 is the
  witness.** On the tracking dashboards `selectedItem` is *also* the pie section's model, and three of
  the four pie sections answer it with a detail panel: web switches `ActivityDetailsPanel` to `domain`
  mode (`ActivityPieChartSection.vue:59-66,161`), unified renders `selectedDetails`
  (`UnifiedPieChartSection.vue:66-116`), desktop fetches `process-details`
  (`DesktopPieChartSection.vue:169-188`) — all three observed by unit 5
  (`tracking-dashboards/inventory.md:29,147,153`). *"View details for X"* is the truth there. The one
  dashboard where it is a lie is Android, and that is `tracking-dashboards/B2` → **`F47`**, which makes
  the label true instead of renaming it. The history card was built from the tracking one
  (`HistorySummaryCards.vue:116`'s own comment: *"Reused from activityTracking"*), and the label came
  with it — but the *behaviour* did not, which is the whole defect: the label is only wrong on the copy.
- **Root cause:** Confirmed. `HistorySummaryCard.vue:8` binds
  `:aria-label="$t('historyDashboard.summaryCards.viewDetails', { name })"` on a card whose only effect
  is `emit('click', historyGroupKey(card))` → `handleGroupSelect` → `selectedGroup` toggles
  (`useHistoryDashboard.ts:242-244`) and the pie chart highlights the slice. The label describes an
  action that does not exist. Severity `polish` stands.
- **Adjacent, source-certain, unobserved — fix while in the file:** ~~both cards are~~ **the history
  card is** `role="button" tabindex="0"` with `@click` and **no key handler**, and `VCard` adds none
  (`VCard.js` has no `keydown`/`onKeydown`; it renders a `div` with `onClick` and `tabindex`). So it is
  focusable, announced as a button, and inert on Enter/Space. Add `@keydown.enter.space.prevent` to the
  same emit. **The tracking card already has both** — `ActivityDomainCard.vue:10-11`
  (`@keydown.enter` / `@keydown.space.prevent`), since `5165e2ed` (2026-08-20), before this batch was
  written; the sixth pass read `VCard.js` and not the card (§80). Copy those two lines rather than
  designing new ones. Not filed by the unit (it clicked); flagged here because `F29` is settling the
  same question for the bars and the two should land as one convention.
- **Files:** `historyDashboard.en.ts:20` / `.sk.ts:20`; `HistorySummaryCard.vue:2-10`.
  ~~`activityTracking.en.ts:101` / `.sk.ts:101`; `ActivityDomainCard.vue:7-9`~~ — do not touch;
  `activityTracking.statColumn.viewDetails` stays *"View details for {domain}"* because that is what
  the click does on every dashboard once `F47` lands
- **What to change:** Rename ~~the two strings~~ **the history string** to what the click does —
  *"Highlight {name} in the chart"* / *"Zvýrazniť {name} v grafe"* (or *"Filter to"*, but pick the
  same verb `F29` uses for its drill-down so the two kinds of chart control read as two kinds). Keep
  the key name; only the value changes. Since the card is a toggle, `aria-pressed="selected"` is the
  honest extra and costs one attribute — and it is the same attribute `F49` adds to the source-filter
  chips, so the two batches should agree on it.
- **Do not change:** the behaviour. The finding's alternative — make the card actually open details — is a
  feature, and the pie-chart cross-highlight is the designed interaction (`HistoryPieChartSection.vue`
  renders the details panel for the selected group; that *is* the detail).
- **Verification:** `history-review/P1`'s `Verify:` block — the accessible name describes the highlight;
  Enter on a focused card highlights the slice (and again un-highlights); `aria-pressed` follows
  `selected`. ~~Repeat on `/activity-tracking`'s domain cards.~~ On `/activity-tracking` confirm the
  label still reads *"View details for …"* and that Enter opens the domain panel — the control it
  should be left alone. Both locales.
- **Risk:** None. One string and one key handler.

## F31. Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas, and `isNarrow` is a dead prop

- **Scope:** app-side `src/core/historyDashboard/component/pieChart/HistoryPieChart.vue`
- **Closes:** `history-review/P2`
- **Root cause — not "in-hole", and the suggested fix does not apply.** The legend is not inside the
  donut; it is an ECharts legend boxed to the **left 58 %** of the canvas (`HistoryPieChart.vue:59-63`:
  `orient: 'vertical', left: 0, right: '42%'`) while the pie is centred at **74 %** with an outer
  radius of 75 % (`:87-88`). On a wide canvas the pie's left edge lands at ~57 % and the two just clear.
  But `HistoryPieChartSection.vue:23-34` puts the chart in a `flex-fill` **beside a 200–250 px details
  card**, inside the Summary view's `lg="6"` column — so at 1440 the canvas is roughly 300 px wide, the
  legend box ends at ~175 px and the pie starts at ~130 px. ECharts does not clip legend text to the box
  (the `formatter` at `:73-82` truncates at 25 *characters*, which is a width the layout never measured),
  so the entry runs into the slices. Same geometry on Detail's `HistoryInsightsColumn direction="row"`.
  `isNarrow?: boolean` (`:30`) is declared, passed by `home`'s `ActivityHistoryWidget.vue:26`, and **read
  nowhere** — it is the hook this fix was supposed to hang on.
- **Files:** `HistoryPieChart.vue:27-31` (props), `:59-88` (legend and series geometry)
- **What to change:** Make the layout answer to the width. Either honour `isNarrow` (and have
  `HistoryPieChartSection` derive it from its own measured width — `useResizeObserver` is already in use
  in `HistorySummaryCards.vue:137`) or measure inside the chart component; below the threshold, put the
  legend `orient: 'horizontal'` at `bottom` and centre the pie at `['50%', '45%']`. Above it, keep the
  side layout but truncate by **pixels** — ECharts 5's `legend.textStyle.width` + `overflow:
  'truncate'` — instead of by character count, and let the pie `center` follow the legend's actual
  width rather than a constant 74 %.
- **Adjacent, source-certain, unobserved:** `textStyle.color: '#fff'` (`:69`) and `borderColor: '#666'`
  (`:64`) are hardcoded — dark-theme values on a chart that renders in both themes
  (`createAppVuetify.ts:74` defaults to dark, which is why the sweep never saw white-on-white). Read
  `useTheme().current.value.colors['on-surface']` instead. Same hardcode in
  `StackedBarsChart.vue:479` (`.legend-label { color: #fff }`) — unit 5's, out of scope, noted so a
  fixing session that opens both does not fix one.
- **Do not change:** the `avoidLabelOverlap: false` / `label.show: false` series settings — slice labels
  are off by design and the tooltip carries them. Not the 25-item cap on the request
  (`HistorySummaryView.vue:231`) — fewer entries would dodge the symptom without fixing the layout.
- **Verification:** `history-review/P2`'s `Verify:` block on `/activity-history/detail?date=2026-09-09`
  (two groups) — a **screenshot**, since the a11y tree cannot see a canvas: legend text fully clear of
  the slices. Then `/activity-history` with `?groupBy=activity` and the week range (more entries, longer
  names), at 1440 and 1920; and the home widget, which passes `isNarrow` and should get the stacked
  layout. Both themes if the colour half is taken.
- **Risk:** Low-medium. A width-driven layout switch is a second render on resize; ECharts `autoresize`
  is already on (`:4`), so the cost is the option recompute. Check the selection highlight
  (`selectedMode: 'single'`) survives a layout switch mid-selection.

## F32. `/activity-history/calendar` has no `<h1>`, unlike its two siblings

- **Scope:** app-side `src/core/activityHistory/view/HistoryCalendarView.vue`,
  `src/core/activityHistory/_locales/activityHistory.{sk,en}.ts`
- **Closes:** `history-review/P3`
- **Root cause:** Confirmed. The view's template (`:1-26`) is a fragment of `HistoryFirstRunState` /
  `HistoryEmptyState` / `CalendarGrid` with no header row; `HistorySummaryView.vue:19` and
  `HistoryDetailView.vue:33` both render `<h1 class="text-h4">` inside a `d-flex align-center ga-6
  flex-wrap` header, each with an icon button linking to the sibling view. `history.calendar.*`
  (`activityHistory.en.ts:32-37`) has no `title` key to render even if the markup were there.
- **Files:** `HistoryCalendarView.vue:1-2`; `activityHistory.en.ts:32` / `.sk.ts` (one key,
  `history.calendar.title`)
- **What to change:** The siblings' header row, minus the controls the calendar does not have: an
  icon button to Summary (`chart-line`, the reverse of the siblings' `calendar-days` button — reuse
  `history.detail.openSummary`'s shape, new key `history.calendar.openSummary`) and
  `<h1 class="text-h4">{{ $t('history.calendar.title') }}</h1>`. Wrap the fragment in a root
  `d-flex flex-column` so the header sits above the grid and `CalendarGrid`'s `height: 100%` chain
  (`CalendarGrid.vue:287-292`) still resolves — check the grid still fills to the footer after the header
  is added; the siblings use `flex-fill` + `min-height: 0` on the body for this.
- **Do not change:** `CalendarGrid`'s own `VCardTitle` toolbar — it is the date-range control, not a page
  heading, and it is framework.
- **Verification:** `history-review/P3`'s `Verify:` block — `document.querySelector('h1')` resolves on
  `/activity-history/calendar` above the Mode/Month/Year row; the grid still scrolls inside the card at
  900 px tall rather than pushing the holiday footer off-screen.
- **Risk:** None beyond layout — but it is the `F12` class of layout (a definite-height flex chain), so
  look at the result rather than trusting the a11y tree.

## F33. Google Calendar connect never sends the OAuth `state` the server requires — the client half of `B1`

- **Scope:** app-side `src/core/googleCalendar/api/googleCalendarApi.ts`,
  `src/core/googleCalendar/view/GoogleCalendarCallbackView.vue`, `src/core/googleCalendar/_locales/googleCalendar.{sk,en}.ts`
- **Closes:** `user-settings/B1` — the **client half**. The server half is *Escalations* §9 and closes
  nothing in `src/`. Also touches the exact lines `B2` lives on: if `B2` confirms (it is re-graded
  `unverified`, *Needs verification*), its fix lands here and nowhere else.
- **Root cause — the finding's *"none on the frontend"* is wrong.** Read at the API source this pass:
  `ConnectGoogleCalendarRequest` is `record (string Code, string State)`, `ConnectGoogleCalendarValidator`
  has `RuleFor(x => x.State).NotEmpty().MaximumLength(128)`, and `ConnectGoogleCalendarEndpoint.HandleAsync`
  compares `req.State` with the `google-oauth-state` cookie and answers a 400 on any mismatch **before
  Google is called**. The client: `googleCalendarApi.ts:14-16` posts `{ code }` — no `state` — and
  `GoogleCalendarCallbackView.vue:19` reads only `route.query.code`, although Google's redirect carries
  `state=` because the auth-url endpoint put it there (`GoogleCalendarService.cs:54`). So on the day §9
  lands and a user reaches the callback with a real code, the connect POST is a **validator 400** and
  the view's `catch` (`:28-30`) shows *"Failed to connect Google Calendar"* — the same toast as a real
  failure. Unobservable today only because `B1` breaks the flow one step earlier, which is how it
  survived: the unit could not get past Google's error page to see it.
- **Files:** `googleCalendarApi.ts:14-16`; `GoogleCalendarCallbackView.vue:18-32`; both locale files if the
  optional branch below is taken. Reference only —
  `AdhdTimeOrganizer/application/endpoint/user/command/googleCalendar/ConnectGoogleCalendarEndpoint.cs`,
  `application/validator/ConnectGoogleCalendarValidator.cs`.
- **What to change:** `connect(code, state)` posting `{ code, state }`; the view reads both off
  `route.query` and treats *either* missing as the existing failure branch. **Optional, same lines, not
  required by any finding:** branch on `route.query.error` first — `access_denied` is Google's own
  "Cancel" — and show a softer, distinct key (`googleCalendar.connectCancelled`, SK + EN) rather than the
  generic failure. That is the residual `B2` wanted; do it only if `B2` confirms, and say so in the
  commit. Do **not** mark the callback route `public` to survive a session that lapsed during the consent
  screen — a signed-out callback *should* bounce; whether the bounce preserves the destination is unit
  15's question, not this batch's.
- **Do not change:** the server's state check, and do not "fix" the 400 by making the client skip the
  state — that check is the CSRF protection on the whole flow. Not `GoogleCalendarCard.vue` (that is
  `F34`).
- **Verification:** Two halves, and only the first is runnable today. **Now:** `playwright-cli goto
  /google-calendar/callback?code=x&state=y`, then `playwright-cli requests` → the `POST
  /api/user/google-calendar/connect` body must be `{"code":"x","state":"y"}`; the server answers 400
  (cookie mismatch — expected) and the failure toast must be on screen (which is also `B2`'s check, so
  read the snapshot the `goto` itself wrote rather than a later `find` — see §38). **After §9 (all three
  parts):** `B1`'s `Verify:` block end to end — Google's real consent screen, back to
  `/google-calendar/callback?code=…&state=…`, `POST …/connect` → 204, *"Google Calendar connected
  successfully"*, the row reads **Connected**, and a reload keeps it (`GET …/status`). Then Disconnect.
- **Risk:** None — the request is already failing, and it cannot fail worse.

## F34. The Google Calendar card's "Disconnect" is `error` on an elevated button — the app-side twin of `P1`

- **Scope:** app-side `src/core/googleCalendar/component/GoogleCalendarCard.vue:20`
- **Closes:** nothing filed — the unfiled app-side twin of `user-settings/P1`. The finding compared the
  two framework buttons against *"Edit"/"Connect" (both correctly `primary`, elevated)*, and it is right
  about the state it saw; the same button reads `:color="connected ? 'error' : 'primary'"`, so once the
  row is **Connected** it is exactly the defect `P1` describes, one card up. Not observable during the
  pass because `B1` keeps every account disconnected.
- **Root cause:** CLAUDE.md's colour-by-variant rule: `VBtn` defaults to `variant="elevated"`
  (`createAppVuetify.ts:25`), and elevated takes `errorDark`; `error` is the tonal/outlined token.
- **Files:** `GoogleCalendarCard.vue:20`
- **What to change:** `'error'` → `'errorDark'`. One token.
- **Do not change:** the chip on `:12` (`error`/`success` on a `VChip` — chips are not under the rule),
  and **do not batch this with `FW8`** — same defect class, different repo (rule 1; the `F4`/`FW2` split).
- **Verification:** Needs a Connected row, so blocked on §9 + `F33` like everything else on that card;
  until then a one-line source read is the whole check. When it is reachable: both themes.
- **Risk:** None.

## F35. `dateTime.secondsShort` renders raw on every running clock — the fourth leak of a mirror written per consumer, not per namespace

- **Scope:** app-side `src/locales/common.sk.ts`, `src/locales/common.en.ts`, `src/locales/SK.ts`,
  `src/locales/EN.ts` + docs-only `CLAUDE.md` (the *Localization* bullet on mirroring)
- **Closes:** `history-capture/B1`, plus two **unfiled, source-certain** twins — `general.from` and
  `general.to`, which `TimeRangePicker.vue:9,59` resolves in *range* mode and no app locale file defines
- **Root cause — confirmed, and wider than the finding.** The finding is exactly right about the
  mechanism: `SK.ts:21-27` spreads the framework's `common` first and `appCommon` after, the spread is
  shallow, so the app's `dateTime` replaces the framework's wholesale, and `TimeDisplay.vue:38` resolves
  a key the app's copy never carried. `secondsShort` has been in the framework's SK file since
  `3976e81` (2026-06-24); the app's mirror block was written on 2026-09-09 (`f6af3c35`) and picked
  `hoursShort`/`minutesShort` without it. **Why it was missed is written in the file:** the SK comment at
  `common.sk.ts:149-154` says *"every key below is one the framework's own `DateRangePicker` /
  `MonthYearPicker` resolve"* — the mirror was built by reading two consumers, not by diffing the
  namespace, and `TimeDisplay` was not one of the two. That is the same way R5, R6 and R11 happened.
  Diffed mechanically this pass (a throwaway script over the four files, deleted): in **both** locales
  the app's `dateTime` lacks exactly one framework key (`secondsShort`), `controls` and `app` lack none,
  and **`general` lacks 26** — `total, print, addNew, formErrors, saveAll, discard, yes, no, active,
  inactive, from, to, of, back, prev, next, image, imageRequired, imageTooLarge, address, city, street,
  houseNumber, postalCode, descriptiveNumber, orientationNumber`. Of those, two are resolved by a
  framework component **this app mounts**: `TimeRangePicker` labels its start field `general.from`
  (when no `label` prop is passed) and its end field `general.to` whenever `mode === 'range'` — a state
  one click on the toggle button reaches and `localStorage['timeRangePickerMode']` then persists across
  reloads. Eight consumers (`HistorySummaryView`, `HistoryDetailView`, `ActivityDashboardHeader`, and
  five in `dayPlanner`). Unit 3 saw the toggle (`history-review/inventory.md:24`, *"Switch to time
  range"*) and did not click it. The other 24 are resolved only by framework components this app does
  not mount (`MyPdfViewer`, `LookupDialog`, `TableGrid`, `TableCellEditor`, the two address fields) —
  today. `general.yes`/`general.no` are the pair `F4` intends to use.
- **Files:** `src/locales/common.en.ts:339-392` (`dateTime`), `:290-338` (`general`);
  `src/locales/common.sk.ts:128-185`, and its `general` block; `src/locales/SK.ts:35-58`;
  `src/locales/EN.ts:26-45`. Reference only — `src/_common/_locales/common.{sk,en}.ts`,
  `src/_common/component/dateTime/TimeDisplay.vue:36-38`, `TimeRangePicker.vue:9,59`.
- **What to change — recommended: stop mirroring and merge.** `SK.ts:57` already does
  `user: { ...frameworkUser.user, ...appUser.user }` for the one namespace two files contribute to, with a
  comment explaining exactly why. `general`, `dateTime` and `controls` are the same situation — two files
  contribute, the app must win collisions, and the framework's keys must survive — and they get a shallow
  spread instead. Do the same merge for those three in both `SK.ts` and `EN.ts` (`general: {
  ...common.general, ...appCommon.general }`, etc.), and then **delete the mirrored blocks and their
  "mirrored from" comments** from both app files (the app's deliberate divergences — the two
  `dateRangeExceedsLimit` wordings, `anchor` — stay because the app is spread second). Exclude
  `navigation`: the framework's copy is another app's HR tree and the merge would only add dead keys.
  Then rewrite CLAUDE.md's *Localization* consequence bullet — it currently tells the reader to *"mirror
  the key … by hand"*, which is the instruction that has now produced R5, R6, R11 and this — to say the
  merged namespaces need nothing and to name the merge site. **Fallback if the merge is declined:** the
  finding's own one-line fix (`secondsShort: \`s\`` next to `minutesShort` in both files) **plus**
  `general.from` / `general.to` in both files (SK: *Od* / *Do*), plus a vitest next to
  `src/locales/slovakPlurals.test.ts` asserting that for each of `general`, `dateTime`, `controls` every
  leaf key in the framework file exists in the app file — so the fifth leak fails `npm test` instead of
  rendering. One of the two; not neither.
- **Do not change:** `src/_common/_locales/*` — the framework's files are complete; the gap is
  entirely app-side. Do not add `secondsShort` to `activityHistory.{sk,en}.ts` or any module locale: it
  is a `common` key resolved by a framework component. Do not "fix" `EN.ts:18-23`'s comment in passing
  without checking it — it says the framework's `common.en.ts` is *partial* (*"only `notifications.*` and
  `reminderPreference.*`"*), which stopped being true at `e04dad2` (2026-09-11, *"complete the English
  mirror"*); the diff above shows the framework's EN `dateTime`/`general` are now as full as SK's. Same
  for CLAUDE.md's *"`EN.ts` does not spread the framework's Slovak-only `common` at all"* — it does, at
  `EN.ts:27`. Both are stale sentences to correct in the same commit, not reasons to hedge the merge.
- **Verification:** `history-capture/B1`'s `Verify:` block verbatim on all three clock views, in **both**
  locales (`s` in each; the finding's screenshot `stopwatch--default.png` is the before). Then the
  twins: on `/activity-history` (Summary) click *Switch to time range* and read the second field's label —
  *To* / *Do*, not `general.to`; reload and confirm it stays (the mode persists). `playwright-cli console`
  must show zero `[intlify] Not found` lines on all four screens. If the merge was chosen, run
  `npm run type-check` — the merged objects change the inferred locale type, and any consumer typed
  against the old shape shows up there.
- **Risk:** Low for the patch. Low-medium for the merge: it changes which strings win for keys **both**
  files define — but the app is spread second, so every string this app renders today is unchanged, and
  the only new strings are ones that currently render as raw keys. The one thing to look at is the
  `vuetifyLocale` spread in `SK.ts:36` — unrelated, but it is the same file and the same shape.

## F36. Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take a time-of-day default

- **Scope:** app-side `src/core/activityHistory/` only — **not** `src/_common/component/dateTime/TimePicker.vue`
- **Closes:** `history-capture/B2`
- **Root cause:** Confirmed in source. `TimePicker.vue:69` defaults `allowedMinutesSelected = '5'`, and
  both write paths snap: the mask watcher (`:114-129`) rounds typed minutes through
  `roundToNearestInterval` (`DateTimeHelper.ts:166-168`, `Math.round(m / i) * i`), and the `timeString`
  setter (`:97-101`) rounds again for the menu. The finding's evidence is exact (`0007` → `00:05`, `0001`
  → `00:00`), and the app already states the convention the finding is asking for:
  `SuggestedTimeFormField.vue:15` passes `allowedMinutesSelected="1"` for a typed duration, while
  `TaskPlannerDayTemplateDetailsForm.vue:18,25` passes `"10"` and `QuietHoursCard.vue:43,55` `"5"` for
  times of day. **This module never passes it.** The finding counts three call sites; the module has
  **eight tags in six files**, every one a duration, every one at the default: `TimerView.vue:14`
  (Length), `PomodoroDurationCard.vue:15` (mounted three times by `PomodoroSetupPanel.vue:21-31` — the
  three fields the finding saw), `AddActivityManuallyForm.vue:16` (Length), `EditActivityHistoryForm.vue:8`
  (Length, on the history record edit dialog — unit 3's screen), `TimerPresetDialog.vue:15` (Duration),
  `PomodoroPresetFormDialog.vue:75,84,93` (Focus / Short break / Long break).
- **The preset editors are the reason this is a `bug` and not `polish`.** The API's per-user default
  seeder ships *Short Sprint* with `ShortBreakDuration = 3` (`PomodoroTimerPresetSeeder.cs:46-50`) — a
  value that every account has from day one and that `PomodoroPresetFormDialog` cannot re-enter: the
  field displays `00:03` (reads are not rounded), but the menu's `allowedMinutes` (`TimePicker.vue:91`)
  greys out 3, a typed `0003` becomes `00:05`, and the arrow buttons step 3 → 8 / 3 → 0. Touch that
  field once and the preset can never go back to what the server gave it.
- **Files:** the eight tags above.
- **What to change:** Add `allowedMinutesSelected="1"` to all eight. That is the whole change. Do it as
  one commit so the module has one rule (durations are minute-exact), and say so in the message. Two
  things to leave alone while there, both dead attributes that land on `TimePicker`'s root `div` and do
  nothing: `variant="outlined"` on `TimerPresetDialog.vue:20` and `PomodoroPresetFormDialog.vue:79,88,97`
  (`TimePicker` has no `variant` prop — `VMaskInput` takes the app default), and `minWidth`/`maxWidth` on
  `EditActivityHistoryForm.vue:12-13` (not props either; `width` is). Deleting them is harmless and
  optional; adding them as real props is a different batch.
- **Do not change:** `TimePicker.vue`'s default, `roundToNearestInterval`, or the snap itself — a
  framework-wide default is its own batch (rule 4) and the component has time-of-day consumers for
  which `'5'` is right. Do not touch the duration fields in other modules that have the same gap —
  `LogTimeBody.vue:10` (dayPlanner, unit 7 not run) and the framework's `LogTimeForm.vue:15` — they are
  the same one-attribute edit, but they belong to units that have not filed them, and the second is a
  submodule commit. Do not add a "rounded to" helper text: at `'1'` there is nothing to explain.
- **Verification:** `history-capture/B2`'s `Verify:` block, first pass condition (the field **keeps**
  `00:07`) on `/activity-history/timer`, all three Pomodoro cards and `/activity-history/manual`; then the
  three the finding did not list — open *Short Sprint* in the Pomodoro presets dialog, type `0003` into
  Short break, read `00:03`; open a quick-time preset in edit mode on `/timer` (after `F37`, or via the
  chip label), same check; open a history record's edit dialog on `/activity-history` and type an odd
  length. Then the menu: click the Length field, confirm every minute is selectable. Then Start a
  7-minute countdown and confirm `POST timer-alarm/schedule` carries an `endsAt` 7 minutes out, not 5.
- **Risk:** Low. The only behavioural change is that the arrow buttons now step by one minute instead
  of five on these fields — fine for a duration, and none of the eight passes `showArrows` anyway.

## F37. Preset chips define `#close` without `closable` — a live "Close" button that hides the chip, and in edit mode it *is* the pencil

- **Scope:** app-side `src/core/activityHistory/component/TimerPresetsSection.vue`
- **Closes:** `history-capture/B3`, and the chip-role observation the unit's inventory attributes to a
  finding `A1` that was never filed (`inventory.md:79`, *"no accessible role/name — see finding A1"*;
  *Contradictions* §49)
- **Root cause:** Confirmed against Vuetify 3's source, and the finding's guess is right:
  `VChip.js:179` is `hasClose = !!(slots.close || props.closable)`, so **defining the slot is what
  renders the button** — `<button class="v-chip__close" aria-label="Close">` (`:274-279`), always, with
  `closeProps.onClick` (`:136-141`) doing `preventDefault()`, **`stopPropagation()`**, `isActive = false`,
  `emit('click:close')`. `TimerPresetsSection.vue:44-51,93-100` puts a `v-if="editMode"` pencil *inside*
  that slot, so outside edit mode the button is empty and still focusable (the finding's observation),
  and clicking it flips the chip's private `isActive` — client-side only, no listener on `click:close`,
  back on reload (also the finding's observation). **What the finding did not see, because the pass did
  not click the pencil:** inside edit mode the pencil sits inside the same button, so a click on the one
  affordance that says "edit" is swallowed by `stopPropagation` before the chip's own
  `@click="openEditDialog(preset)"` (`:41,:90`) can run — the chip disappears and no dialog opens. The
  editor is reachable only by clicking the chip's *label*, which is what the `pr-4` padding hack on
  `:38` is compensating for. Source-certain; one outcome.
- **Files:** `TimerPresetsSection.vue:35-52` (quick-time chips), `:85-101` (activity chips)
- **What to change:** Delete both `#close` templates and move the pencil to the chip's **append** side:
  `:appendIcon="editMode ? 'pen-to-square' : undefined"` on each `VChip`. That renders no close button
  in either mode, the pencil becomes part of the chip's own click target, `openEditDialog` handles the
  click as already written, and the `:class="{ 'pr-4': editMode }"` on `:38` can go (the activity chips
  never had it — the two rows will finally match). Deletion stays where it is, behind the edit dialog's
  *Delete* button (`TimerPresetDialog.vue:38,126-133`) — do **not** take the finding's second option
  ("clicking it actually deletes the preset"): a bare × on a chip with no confirmation is the exact
  affordance the app already decided against by putting delete in a dialog. **While in the file:** the
  chips are clickable `span`s with `tabindex="0"` and Enter/Space handling (Vuetify supplies both,
  `VChip.js:169-174,195-197`) but **no `role`**, which is the inventory's unfiled `A1` and why its
  locator is `.locator('span').filter({ hasText })`. Add `role="button"` to both `VChip`s — one attribute,
  same tags, and it makes the draft spec's chip locators `getByRole('button', { name: '15m' })`. That is
  the whole a11y change; the chip text is already the accessible name.
- **Do not change:** `TimerPresetDialog.vue` — its delete path is fine for this batch. (Adjacent, not
  filed, not for this batch: `:129` confirms through `useDialog().confirm()` unconditionally rather than
  `useDeleteConfirmation`, so a user with `askBeforeDelete = false` is still asked — CLAUDE.md's
  preference-ownership table lists five delete sites and this is a sixth. Unit 4's mutation pass will
  exercise it; let it file it.) Do not add a `closable` prop with a handler — that keeps the button and
  its "Close" name for a control that does not close anything.
- **Verification:** `history-capture/B3`'s `Verify:` block, first pass condition: outside edit mode,
  `document.querySelectorAll('.v-chip__close').length === 0` on `/activity-history/timer`, and Tab from
  the *Edit* button lands on the first chip, not on a nameless button inside it. Then the half the pass
  never ran: click *Edit*, click the **pencil** on the *15m* chip — the preset dialog opens with *15m*
  loaded and the chip is still in the row. Then `find` the chips as `button "15m"` (role check). Repeat
  the pencil click on an activity-preset chip (create one through the `+` first if the seed has none —
  `inventory.md:93` says it does not).
- **Risk:** Low. `appendIcon` renders a `VIcon` with `end: true` and **no size** (`VChip.js:253-256`),
  where the close slot forced `x-small` (`:283-291`) and the pencil forced `size="16"` — so the icon
  will come out a step larger than today. Check it visually once; if it matters, use the `#append` slot
  with the sized `VIcon` instead of the prop — same fix, no close button either way.

## F38. Leftover `console.log` in `TimerPresetsSection.vue` — and the lint rule that should have caught it is `off`

- **Scope:** app-side `src/core/activityHistory/component/TimerPresetsSection.vue:155`,
  `src/core/dayPlanner/component/template/MiniTimeline.vue:50`,
  `src/core/todoList/composable/dragAndDrop/UseDragAndDropMonitor.ts:24`, `eslint.config.ts:43`
- **Closes:** `history-capture/P1`
- **Root cause:** The line the finding names (`loadPresetsData()`, `console.log(allPresets.value)` right
  after the `fetchAll()`) — confirmed. The reason it survived is `eslint.config.ts:43`:
  `'no-console': ['off', { allow: ['error', 'warn'] }]` — the rule is **off**, with an allow-list that is
  only meaningful when it is on, i.e. someone configured the intent and not the severity. A grep for
  `console.log(` across `src/` finds **three** app-side leftovers (the two others: `MiniTimeline.vue:50`
  logs `tasks` on every render of the template planner's mini timeline; `UseDragAndDropMonitor.ts:24`
  logs `'Global drag start:'` + payload on every drag) and five in the framework's `user` module
  (`LoginView.vue:142` `console.log(valid)`; `ForgottenPasswordView.vue:73`, `ConfirmEmailView.vue:57,71`,
  `ConfirmEmailChangeView.vue:58` — `console.log(error)` in `catch` blocks, which the allow-list would
  want as `console.error`). One correction to the finding: **only `TimerView` mounts
  `TimerPresetsSection`** (`TimerView.vue:42`); the Pomodoro view mounts `PomodoroSetupPanel` and
  `PomodoroPresetsDialog`, neither of which imports it. The finding's own evidence names only `/timer`;
  the *"both mount this component"* sentence is unobserved and wrong (§48).
- **Files:** the four above.
- **What to change:** Flip `eslint.config.ts:43` to `'no-console': ['error', { allow: ['error', 'warn'] }]`,
  run `npm run lint`, and delete what it reports — expected: the three app-side lines, nothing else.
  (`npm run lint` runs `--fix`, but `no-console` has no fixer, so the deletions are by hand.) If the
  count differs from three, the difference is the finding, not the rule.
- **Do not change:** the five framework lines — ESLint ignores `src/_common` by config, so the rule will
  not report them, and they are `vue_framework` commits. **Unit 15 has now run** (ninth pass) and they
  are taken: `LoginView.vue:142` by `FW11` (filed as `auth/P3`), `ForgottenPasswordView.vue:73` by
  `FW9`, `ConfirmEmailView.vue:57,71` and `ConfirmEmailChangeView.vue:58` by `FW12` — the last four
  disappear with the `catch` blocks they sit in rather than becoming `console.error`, because each of
  those views already shows a snackbar in the same branch. Pre-empted here so the fixing session does
  not chase them into the submodule.
- **Verification:** `history-capture/P1`'s `Verify:` block on `/activity-history/timer` — zero `[LOG]`
  lines from `TimerPresetsSection.vue`. Then `npm run lint` exits 0 with the rule on. The two other
  deletions are verified by the lint run, not a browser.
- **Risk:** None to runtime. The lint change is app-wide and the CLAUDE.md *Lint* line says the baseline
  is 0 errors with two known warnings — re-measure after the flip and correct that sentence if the
  warning count moves.

## F39. The auth guard's redirect drops the destination — the write half of `auth/B1`

- **Scope:** app-side `src/router.ts:98`, plus one record in `docs/views/_routes.md`'s guard notes
- **Closes:** `auth/B1` — **write half only.** The read half is `FW11` (framework, rule 1). Neither
  half is visible without the other, which is why the finding's own root-cause guess ("two independent
  gaps that happen to compound … fixing only one side is not enough") is right and is the reason for
  the two batches rather than an argument against them.
- **Root cause:** `router.beforeEach` at `src/router.ts:97-98` is `if (!auth.isAuthenticated) return
  { name: 'login' }` — no `query`. Confirmed by direct read. The framework's interceptor already does
  it the other way: `_common/axiosConfig.ts:175` pushes `{ name: 'login', query: { redirect:
  _router!.currentRoute.value.fullPath } }` on a forced logout, so the **`redirect` query contract
  already exists in the framework** and this guard is the one writer that ignores it. The finding's
  live evidence — `goto /todo-list/13001` while signed out lands on `/login` with **no query string**,
  and signing in lands on `/` — is exactly what this line produces. The runbook's decision log put
  this precise question ("does the login redirect preserve the destination") into unit 15 in place of
  a signed-out sweep, so the expectation is sourced, not taste.
- **Files:** `src/router.ts:98`
- **What to change:** `return { name: 'login', query: to.fullPath === '/' ? undefined : { redirect:
  to.fullPath } }` — skip the param for the home route so a plain bounce keeps a clean `/login` URL.
  `to.fullPath` carries the query and hash, so `/day-planner/11-09-2026?tab=x` survives whole. Nothing
  else: the `SIGNED_OUT_ONLY_ROUTES` branch above it (`:91-93`) is unrelated and must keep sending an
  *authenticated* visitor to `home`, redirect or not. Update `_routes.md:11`'s guard sentence to say
  the redirect carries `?redirect=<fullPath>`.
- **Do not change:** `_common/axiosConfig.ts:175` (already correct, framework). Do not read the query
  back here — `router.ts` has no business knowing how `LoginView` consumes it; that is `FW11`. Do not
  add the param to the `hasRequiredRole` bounce at `:102` (that user *is* signed in; there is nothing
  to return to).
- **Verification:** `B1`'s `Verify:` block, but only after `FW11` is in the pointer: signed out,
  `goto /todo-list/13001` → the URL bar reads `/login?redirect=%2Ftodo-list%2F13001`; sign in; the
  URL bar reads `/todo-list/13001`. Before `FW11` lands the observable is only the first half (the
  query is present), which is worth asserting on its own so the two halves can be retested
  independently. The draft spec's `test.fixme` at `e2e/tests/auth.draft.spec.ts:50` is this
  behaviour — promote it once both halves are in.
- **Risk:** None. One query param on a route the framework already writes the same param to.

## F40. Logging out fires `GET /routine/settings` and logs a 401 — `resetAppState()` creates the store, and the plugin loads it

- **Scope:** app-side `src/core/todoList/store/routineReviewStore.ts:33-44`, and one sentence in
  `src/core/user/composable/useSessionReset.ts`'s doc comment
- **Closes:** `auth/P2`
- **Root cause — not the one filed.** The finding says an in-flight request survives the logout
  because `ensureLoaded`'s `inFlight` promise has no cancellation, and proposes an `AbortController`.
  Traced this pass: on the Home dashboard **nothing creates `routineReviewStore`** — its only
  consumers are `useRoutineWeeklyReview.ts:15` (mounted by `RoutineToDoListView`, not by any `home`
  component; grep of `src/core/home/` finds no import) and `useSessionReset.ts:42`. So the store does
  not exist until *Log out*: `useLogout.ts:11-13` awaits `POST /auth/logout`, calls `auth.logout()`,
  `App.vue:104-109`'s watcher sees `isAuthenticated` fall and calls `resetAppState()`, whose line 42 is
  `useRoutineReviewStore().resetStore()` — and **that `useRoutineReviewStore()` call is the store's
  first creation**, which is exactly the moment `createAppPinia.ts:13-14` calls `ensureLoaded()`.
  `ensureLoaded` (`:33-44`) has no signed-out guard, so `fetchSettings()` fires **after** the server
  has cleared the session, answers 401, the interceptor's refresh attempt fails or is skipped (the
  route is already `login`), and `console.error('ERROR: ', error)` prints. Then `resetStore()` runs on
  a store that has just started loading. That is why the unit saw it "twice, deterministically" on a
  logout it thought was merely "prompt": it is not a race, it happens on every logout from any page
  that never visited `/routine-todo-list`. Two more things in the same eleven lines, both CLAUDE.md's
  own `ensureLoaded` contract: the method **rejects** (no `catch`, and the plugin's call is "neither
  awaited nor caught"), so besides the interceptor's line there is an unhandled rejection; and it has
  no `isAuthenticated` guard, which the same CLAUDE.md paragraph names as the `activityOptionsStore`
  pattern ("the load itself no-ops while signed out, so booting on the login screen fires no request").
  Severity `polish` stands — no snackbar (401 is silent by design) and no user-visible state — but
  the fix is smaller and different from the one proposed.
- **Files:** `routineReviewStore.ts:33-44`; `useSessionReset.ts:10-36` (doc comment)
- **What to change:** In `ensureLoaded`: `if (isLoaded.value || !useUserStore().isAuthenticated)
  return` as the first line, and `.catch(() => {})` (or a caught `try/await`) so the promise the plugin
  fires never rejects — `isLoaded` stays `false` on failure so the next call retries, which is the
  behaviour `RoutineToDoListView.vue:199`'s `onMounted` call already relies on. Add one line to
  `useSessionReset.ts`'s comment: *calling `useXStore()` here creates the store if nothing has yet, and
  a store with `ensureLoaded()` loads on creation — so every store reset here must no-op its load while
  signed out.* That sentence is the real fix; the guard is its first application.
- **Do not change:** `resetAppState()`'s list (the other four stores expose no `ensureLoaded`, checked
  by grep — the sentence above is what keeps that true). Do not add an `AbortController` — there is
  no in-flight request to abort, and `resetStore()` already clears `inFlight`. Do not touch
  `RoutineToDoListView.vue:199`'s `onMounted` call in this batch: it violates CLAUDE.md's "components
  must not call it in `onMounted`" rule, but it is also what reloads the dismissal after a second
  sign-in (the store's watcher resets and does not reload — CLAUDE.md says so), so removing it needs
  the reload half added to the watcher first. Adjacent, out of scope, noted.
- **Verification:** `P2`'s `Verify:` block: sign in, land on `/`, open the user menu, *Log out*, read
  the console — no `401` on `/routine/settings`, no `AxiosError`. Then the positive check the finding
  did not write: `/routine-todo-list` still shows (or hides) the weekly review card correctly after a
  fresh sign-in, i.e. the guard did not swallow the signed-in load.
- **Risk:** None. The guard is the same shape as the store one module over.

## F41. `DayPlannerSettingsView`'s tabs stack — `d-flex` on a `VTabsWindowItem` defeats `v-show`

- **Scope:** app-side `src/core/dayPlanner/view/DayPlannerSettingsView.vue:31-36,52-58`
- **Closes:** `planner-day/B1`
- **Root cause:** Confirmed at source, and the finding's mechanism is exactly right. Vuetify's
  `VWindowItem` hides an inactive item with **`v-show`** (`VWindowItem.js:112-115` —
  `withDirectives(…, [[vShow, groupItem.isSelected.value]])`), which is an inline, non-`!important`
  `display: none`. The two items at `:33` and `:54` carry `d-flex`, and every Vuetify display utility
  is `display: flex !important` (`vuetify.css`, `.d-flex`). A stylesheet `!important` beats an inline
  normal declaration regardless of order, so those two items never hide; the three items with only
  `pt-3` do. The class lists the unit read off the DOM (`flex-fill d-flex flex-column ga-4 pt-3` and
  `pt-3 d-flex flex-column ga-4` on the stuck items, `pt-3` on the hidden ones) are the whole proof.
  **Only instance in the app**: a multiline grep for a display utility on `<VWindowItem`/`<VTabsWindowItem`
  hits these two lines and nothing else — `ActivitySettingsView.vue:90-105` uses `flex-fill` only
  (`flex: 1 1 auto`, not a `display` rule), and the framework's `TabsLayout.vue:19-22` passes no class.
- **Files:** `DayPlannerSettingsView.vue:33`, `:54` (and `:55`'s `style="max-width: 480px"`, which
  moves with the classes)
- **What to change:** The finding's suggested fix, verbatim: keep `pt-3` on the `VTabsWindowItem` and
  move `d-flex flex-column ga-4` (and `flex-fill` / `max-width`) onto an inner `<div>` wrapping
  `<RepeatingTasksTab />` and `<SkipReasonsTab />`. Check `RepeatingTasksTab` still fills the window
  height (it is a table — `F12`/`FW4`'s definite-height chain — so the inner wrapper needs `h-100` or
  `flex-fill` on a parent that is itself a flex column; the `VTabsWindowItem` is not one once `d-flex`
  leaves it, so the wrapper is `class="h-100 d-flex flex-column ga-4"`).
- **Do not change:** the `VTabsWindow`'s own `flex-fill` at `:29` (that is on the window, which is
  never hidden); nothing in the tab components. Not the URL state (`F42`).
- **Verification:** `B1`'s `Verify:` block — click all five tabs, one panel visible at each. Then the
  DOM check the unit used: `document.querySelectorAll('.v-window-item')` → exactly one with non-zero
  `offsetHeight`. Then confirm the Repeating Tasks table still renders rows and scrolls internally
  (the `F12` failure mode — rows present in the tree, body 0 px — is what a wrong wrapper produces).
- **Risk:** None beyond the table-height chain above.

## F42. `/day-planner/settings` active tab is not in the URL

- **Scope:** app-side `src/core/dayPlanner/view/DayPlannerSettingsView.vue:80` (`activeTab`)
- **Closes:** `planner-day/B6`
- **Root cause:** `const activeTab = ref('repeating')` with nothing reading or writing the route.
  CLAUDE.md's *URL State* rule names tabs explicitly. The module's other view already has the pattern
  (`useCalendarUrlState.ts`: absent-when-default, `router.replace`), and the app's other settings
  views use a route param instead (`/activity-settings/:tab(activities|roles|categories)` with a
  redirect from the bare path; `/activity-tracking/*/settings/:tableView`).
- **What to change:** Either shape satisfies the pass condition; **recommended: a `?tab=` query**,
  absent for `repeating`, written with `router.replace` from a `watch(activeTab)` and read once on
  setup (validate against the five values, fall back to `repeating`). It adds no route record, so
  `_routes.md`'s count and `F14`'s nav matching are untouched — the sidebar `to` is `/day-planner/settings`
  (`navItems.ts:56`) and a query does not affect `matchesPath`. The route-param shape is the sibling
  convention and is fine too, but it adds a redirect record and a manifest edit; pick it only if the
  owner wants the three settings pages uniform.
- **Do not change:** the settings load in `onMounted` (`:82-84`) — `loadSettings` is not the
  `ensureLoaded` convention, but that is a store-shape question, not this finding. Not `F41`'s classes.
- **Verification:** `B6`'s `Verify:` block — select *Skip Reasons*, reload, still on it; the URL shows
  `?tab=skipReasons`; the default tab produces a clean `/day-planner/settings`. Plus: a bogus
  `?tab=zzz` lands on *Repeating Tasks* with no console error.
- **Risk:** None.

## F43. `/day-planner/:date` with a malformed or unprovisioned date — two unguarded calendar fetches

- **Scope:** app-side `src/core/dayPlanner/view/DayPlannerView.vue:202-217`,
  `src/core/dayPlanner/composable/useDayNavigation.ts:71-84`; optionally
  `src/core/dayPlanner/dayPlanner.routes.ts:29`
- **Closes:** `planner-day/B5` — **the date half only.** The task half is settled as no defect
  (*Contradictions* §70; *Needs verification* below).
- **Root cause:** Two sites, one shape. (1) `DayPlannerView.vue:211` — `await Promise.all([
  fetchCalendarByDate(dateParam), fetchAllTemplates()])` inside an `async onMounted` with no `catch`,
  so a rejected calendar fetch is an unhandled rejection at the hook boundary (Vue logs it), `calendar`
  stays `undefined`, and `DayPlannerHeader` (`v-if="calendar"`, `:3`) never renders — the blank header
  the unit saw. The finding's *"no visible error message"* is a missed toast, not a missing one: the
  interceptor's 400 branch (`axiosConfig.ts:227-229`) shows the server's own text for ~3 s — the API
  strict-parses the segment (`GetByDateCalendarEndpoint.cs:19-24`, `DateOnly.TryParseExact(value,
  "dd-MM-yyyy")` → `"Date must be in dd-MM-yyyy format."`). What persists is the blank header, and that
  is the defect. (2) **Unobserved, source-certain:** `useDayNavigation.ts:71-84` — the `viewedDate`
  watcher calls `store.resetStore()` *then* `await fetchCalendarByDate(dateStr)` with no `catch`. On a
  404 the tasks are already gone, `calendar.value` keeps the **previous** day's object, and the URL has
  already moved (`navigateToDate`, `:31`) — a header for one day under another day's URL. The 404 is
  reachable without a malformed URL: `CalendarSeeder.cs:29-31` seeds this year and next, and
  `CalendarProvisioner` creates rows only on a **write** (`CreatePlannerTaskEndpoint`,
  `UpdatePlannerTaskEndpoint`, `ApplyTemplate…`), so `GET /calendar/by-date/31-12-2025` is a 404 for
  every seeded account and ArrowLeft from `01-01-2026` hits it. (The full-screen loader does not stick —
  `showSnackbar` hides it, §64 — so the visible symptom is only the wrong header.)
- **Files:** `DayPlannerView.vue:202-217` (mount), `useDayNavigation.ts:71-84` (watcher);
  `dayPlanner.routes.ts:29` if the param is constrained
- **What to change:** Three parts. **(a) Malformed param:** treat it like the missing one — the branch at
  `:203-209` already redirects an absent `:date` to the user's today; extend its condition to a strict
  `dayjs(dateParam, 'DD-MM-YYYY', true).isValid()` failure, so `/day-planner/not-a-date` and
  `/day-planner/2026-09-11` (ISO — the trap `UNIT-ORDER.md` briefed the unit on) both land on today with
  a clean URL and **no request**. Alternatively constrain the route, `':date(\\d{2}-\\d{2}-\\d{4})'`, and
  let `F20`'s catch-all take the rest — but until `F20` lands an unmatched URL is a blank main area, so
  the in-view redirect is the safer first step. **(b) Valid-but-unprovisioned date:** wrap the calendar
  fetch at both sites in `try/catch` (`_silent` is *not* wanted — the interceptor's 404 toast is the
  right first signal) and render a state: an inline `VAlert` in the header slot naming the date with a
  *Back to today* action, the way `PlannerTaskLinkView` does for a missing task. **(c) The watcher:** on
  failure, restore `store.viewedDate` to the calendar still in `calendar.value` (which also puts the URL
  back through `navigateToDate`), so header, grid and URL agree again; and `hideFullScreenLoading()` in a
  `finally` rather than trusting the snackbar to do it.
- **Do not change:** the interceptor (its `console.error` is by design — §70), `PlannerTaskLinkView`
  (already correct), the `by-date` contract (`dd-MM-yyyy` is deliberate; the ISO form is the `day-plan`
  endpoint's, `calendarApi.ts:38`).
- **Verification:** `B5`'s date-case `Verify:` block: `/day-planner/not-a-date` → lands on today, no
  request to `by-date/not-a-date`, console clean. Add: `/day-planner/2026-09-11` (ISO) → today, not a
  400 and not a neighbouring day; `/day-planner/31-12-2025` → the alert, header not blank, console
  shows the interceptor's line and **no** Vue "Unhandled error during execution of mounted hook";
  then from `/day-planner/01-01-2026` press ArrowLeft → alert or a revert to `01-01-2026`, and the URL
  agrees with the header either way.
- **Risk:** Low. The redirect branch already exists for the empty param; the `catch` adds a state the
  view never had.

## F44. Calendar "Days to show" and Range/Duration configuration in the URL — the app half

- **Scope:** app-side `src/core/dayPlanner/composable/useCalendarUrlState.ts`,
  `src/core/dayPlanner/view/PlannerCalendarView.vue:2-11,180-183,231-233`. **Blocked on `FW16`.**
- **Closes:** `planner-day/B3` (app half)
- **Root cause:** The finding's guess is right about the codec and wrong about the fix being local.
  `useCalendarUrlState.ts` models `month`, `mode`, `templateId`, `preview` and nothing else, and
  `syncMonthToUrl` (`:52-63`) reduces whatever range the grid emits to `monthKeyFromDate(range.start)`
  — so in Duration mode anchored on today the URL is bare (the key equals the current month), and on
  reload `hydrateFromUrl` applies a *month* range. But the state that would need encoding is not the
  app's to read: `dayVisibility` is a private `ref` in `CalendarGrid.vue:167`, and the picker's
  `selectedMode` / `durationAnchor` / `durationAnchorDate` / `durationUnit` / `durationQuantity` /
  `rangeStart` / `rangeEnd` are private in `DateRangePicker.vue:130-152`. The only exposed handle is
  `CalendarGrid`'s `dateRange` (`:283`), and pushing an arbitrary range into it while the picker is in
  month mode is coerced back to a month by `DateRangePicker.vue:269-274`. P7 anticipated exactly this
  (*"if it cannot accept an initial range, do the app-side workaround AND record the gap"*) and the
  session that ran it did neither for these two fields — `migration-revision.md` has no entry. The
  expectation is sourced: P7 names *"the displayed month/date range"*, and CLAUDE.md's *URL State* rule
  names filters, which is what *Days to show* is.
- **Files:** `useCalendarUrlState.ts` (codec + watchers), `PlannerCalendarView.vue` (bind the new models)
- **What to change:** Once `FW16` lands, bind `v-model:dayVisibility` and the picker-config model on
  `<CalendarGrid>` and extend the codec with the same *absent-when-default* rule: `days=workdays|weekend`;
  for Duration, `range=duration&anchor=start|end&from=YYYY-MM-DD&unit=day|week&qty=N` (`from` is the
  anchor date whichever end it anchors; `formatDateForApi` / `parseDateFromApi` in `DateTimeHelper.ts`
  are the existing pair, and the latter is strict — a hand-edited `from=2026-02-31` yields `null`, not a
  rolled-over date);
  for Range, `from`/`to`. `month` stays as it is and is written **only** in month mode — the current
  `syncMonthToUrl` on a Duration range is the wrong-month bug above. Keep `router.replace` for these
  (they are view configuration, not navigation) and the `isApplyingUrlState` guard around hydration.
- **Do not change:** `mode`/`templateId`/`preview`, which round-trip today and are pinned by
  `planner-day.draft.spec.ts:20-33`; `selectedDayIds` (excluded by P7, deliberately). Not the History
  calendar (`HistoryCalendarView.vue`) — unit 3 recorded the same gap there and did not file it
  (`history-review/inventory.md:100-104`, *"the intent sources (H6) never asked for it here"*); once
  `FW16` exists that view can adopt the same codec in a later batch if wanted.
- **Verification:** `B3`'s `Verify:` block, both halves — *Workdays* survives a reload; a Duration
  configuration with a non-default anchor/unit/quantity is restored *and* the URL carries it. Add: the
  default state produces a clean `/day-planner`; back/forward still walks months (P7's own check);
  `planner-day.draft.spec.ts:44-45` are the two `fixme`s to fill in.
- **Risk:** Low once `FW16` exists; nothing to do before it.

## F46. The pie-chart detail panel's close button was hand-rolled three times and drifted — wrong icon set on web, no name on desktop, a domain-only label on unified

- **Scope:** app-side `src/core/activityTracking/component/pieChart/ActivityDetailsPanel.vue`,
  `component/desktop/DesktopProcessDetailsPanel.vue`, `component/unified/UnifiedPieChartSection.vue`,
  `_locales/activityTracking.{sk,en}.ts`
- **Closes:** `tracking-dashboards/B1`, `tracking-dashboards/A2`
- **Root cause — confirmed, and the unit's own guess for both is exact.** Three panels, three copies of
  the same six-line `VBtn`, each missing a different thing:
  | panel | icon | name | observed |
  | --- | --- | --- | --- |
  | web — `ActivityDetailsPanel.vue:5-13` | `icon="mdi-close"` (`:7`) — a Material Design name in a FontAwesome-only app (CLAUDE.md *ICONS*) | `:aria-label="$t('activityTracking.pieChart.closeDomainDetails')"` (`:11`) ✓ | blank square, console *"Could not find one or more icon(s) {prefix: fas, iconName: mdi-close}"* (`B1`, DOM + console + source) |
  | desktop — `DesktopProcessDetailsPanel.vue:5-11` | `icon="fas fa-xmark"` ✓ | **none** — no `aria-label`, no `title`, no text | `{"hasBtn":true,"ariaLabel":null}` (`A2`, eval + screenshot) |
  | unified — `UnifiedPieChartSection.vue:69-75` | `icon="fas fa-xmark"` ✓ | `:ariaLabel="$t('activityTracking.pieChart.closeDomainDetails')"` ✓ | not opened by the unit; source-read only — and the label is the wrong noun: this panel's items are domains, desktop products *and* Android apps (`UnifiedActivityItem.label`), so *"Close domain details"* on *"Visual Studio Code"* is a smaller version of the same drift |
  The FontAwesome plugin cannot resolve `mdi-*` and renders an empty `<i class="v-icon">` — the button
  keeps its 28 px hit area and its name, so it is operable blind and by screen reader and invisible to
  everyone else. `grep -r 'mdi-' src/core src/_common` finds **no other consumer**; `B1` is the only
  one in the tree.
- **Files:** `ActivityDetailsPanel.vue:7,11`; `DesktopProcessDetailsPanel.vue:5-11`;
  `UnifiedPieChartSection.vue:70`; `activityTracking.en.ts:89` / `.sk.ts:89`
- **What to change:** One key, one button. Add `activityTracking.pieChart.closeDetails` — *"Close
  details"* / *"Zavrieť detaily"* — and use it on all three (and on `F47`'s fourth). Retire
  `closeDomainDetails` in the same commit, or keep it as the web panel's more specific label and add
  `closeProcessDetails` for desktop (*"Close process details"* / *"Zavrieť detaily procesu"*) — either
  is fine; **what is not fine is a fourth hand-typed variant**. Then `icon="fas fa-xmark"` on
  `ActivityDetailsPanel.vue:7`. While in the three files: the web panel binds `:aria-label`, the
  unified one `:ariaLabel` — pick the camelCase form (CLAUDE.md *Props*) for all three so the next
  grep finds them together. Consider extracting the button as `DetailsPanelCloseBtn.vue` in
  `component/pieChart/` — it is exactly the "diverged for no reason" component the unit's `R2` premise
  describes and three copies is already one too many — but a shared key alone closes both findings.
- **Do not change:** `ActivityPieChart.vue` or any pie-section layout; `DesktopPieChartSection.vue`'s
  `detailsLoading` skeleton (it is the reason the desktop panel's close button appears a beat later
  than the others — by design, it waits for `process-details`). Do not "fix" the web panel by copying
  the desktop one — that trades a missing glyph for a missing name.
- **Verification:** `B1`'s `Verify:` block — `/activity-tracking`, click a *View details for …* card,
  the top-right of the panel shows an X glyph and `playwright-cli console error` carries no *"Could not
  find one or more icon(s)"*. `A2`'s `Verify:` block — `/activity-tracking/desktop`, click a *View
  details for …* card, `getByRole('button', { name: /Close .*details/ })` resolves inside the panel.
  Then `/activity-tracking/unified`, select *Visual Studio Code* and read the close button's name.
  **The draft spec pins the old key**: `tracking-dashboards.draft.spec.ts:119`
  (`getByRole('button', { name: 'Close domain details' })`, inside the `B1` `fixme`) — update the
  locator to whatever this batch chooses when un-`fixme`-ing it. SK as well as EN.
- **Risk:** None. Two attributes, one key; every consumer is in this module.

## F47. Selecting an app on `/activity-tracking/android` opens no detail — a local panel from the data on the page; a per-app session count is not on the wire

- **Scope:** app-side `src/core/activityTracking/component/android/AndroidPieChartSection.vue`,
  `view/AndroidActivityDashboard.vue`, `_locales/activityTracking.{sk,en}.ts`
- **Closes:** `tracking-dashboards/B2` — **narrowed** (*Contradictions* §79). The finding's pass
  condition (*"at minimum its active seconds and session count"*) is amended below; the defect stands.
- **Root cause — confirmed, and the unit's guess is right about the mechanism and wrong about the
  data.** `AndroidPieChartSection.vue:57-78` renders one `VCard` with the span's `totals` and has **no
  branch on `selectedAppLabel`** — the model is written (`:110,129-131`), drives the pie's
  `selectedDomain` (`:52`), and is read by nothing else. Compare `ActivityPieChartSection.vue:145-161`
  (`selectedDomainDetails` computed → `ActivityDetailsPanel` in `domain` mode) and
  `UnifiedPieChartSection.vue:252-254,66-116` (`selectedDetails` → inline panel). Selecting an app
  therefore fires no request (unit: `requests` showed none), changes no panel (unit: two screenshots,
  same three numbers), and leaves `ActivitySummaryCards`' card announcing *"View details for Spotify"*
  (`ActivityDomainCard.vue:8`) for a click that shows none — the one dashboard where that label is a
  lie (§80).
  **What the unit thought was available is not.** `AndroidAppPieData` is `{packageName, appLabel,
  seconds, totalSeconds}` (`AndroidAppPieData.ts`), and the server sets **`Seconds == TotalSeconds` by
  construction** (`AndroidPieChartEndpoint.cs:57-58` — both are `g.Sum(x => x.DurationSeconds)`); there
  is no active/background split and no per-app session count anywhere in the Android responses.
  `AndroidAppSummaryDto.stat` is an `ActivityStat` (`seconds`, `averageSeconds`, `percentChange`) —
  the baseline comparison the card already shows, not a session count. `AndroidPieTotals.totalSessions`
  is span-wide. So the *"session count"* half of the pass condition is a **backend ask** (the Android
  sibling of desktop's `process-details` — sessions per app, first/last use, mean session length, from
  the `AndroidSessionData` rows the endpoint already groups) and is recorded under *Deferred to
  opportunities*, not batched here.
- **Files:** `AndroidPieChartSection.vue:57-78` (the panel), `:95-102` (props), `:110` (model);
  `AndroidActivityDashboard.vue:81-91` (the mount — `summaryCardsData` is in scope at `:61` and can be
  passed down); `activityTracking.{sk,en}.ts` `pieChart` block
- **What to change:** A `selectedDetails` computed over `props.apps` (`find(a => a.appLabel ===
  selectedAppLabel)`) and a `v-if="selectedDetails"` branch in the side card, mirroring the unified
  panel's shape (`UnifiedPieChartSection.vue:66-116`): header = `appLabel` + `F46`'s close button
  (emit → `selectedAppLabel = null`); rows = *Total* (`totalSeconds`), *Share of {span}*
  (`totalSeconds / totals.totalSeconds`, the number the legend already prints), *Package* (`packageName`,
  monospace caption — it is the identity the settings mapping table keys on, and the only place a user
  could otherwise learn it is `/activity-tracking/android/settings`). Optionally, pass the matching
  `SummaryCardsData` in and add *vs. baseline* from `stat.percentChange` — the card shows it, the
  panel may repeat it; do not fetch anything new. Two keys: `pieChart.shareOfSpan` and
  `pieChart.packageName`. **Guard the server's *Other* row:** with `minPercent: 1`
  (`AndroidActivityDashboard.vue:170`) the endpoint folds the tail into a row whose `packageName` and
  `appLabel` are the literal `"Other"` (`AndroidPieChartEndpoint.cs:79-80`), which `ActivityPieChart`
  does **not** treat as its `_other` sentinel (`:150`) — so that slice is selectable today and would
  open a panel titled *Other* with package *Other*. Skip it in `onSegmentClick` (or map it to `_other`
  when building `pieSegments`, which also gets it translated); the full contract problem is §10.
- **Do not change:** the `summary-cards`/`pie-chart` request shapes; `ActivityPieChart.vue` (`F48`
  edits it — coordinate, do not both touch `:9-28`); the desktop pattern — do **not** add an Android
  `details` fetch against an endpoint that does not exist. Not `ActivityDomainCard`'s label (§80).
- **Verification:** `B2`'s `Verify:` block with the pass condition read as: *selecting an app changes
  the side panel to that app's own detail — its total time, share of the span, and package name — and
  the close button clears it and `?selected`*. Then: deselect by clicking the same card and by clicking
  the slice; reload with `?selected=Spotify` and confirm the panel opens from the URL (the model is
  URL-backed via `useActivityDashboard`'s `selectedItem`); select a card whose app is under the pie's
  threshold if the seed has one, and confirm nothing selects *Other*. `tracking-dashboards.draft.spec.ts:126`
  is the `fixme` to fill in. SK as well as EN for the two new keys.
- **Risk:** Low. Additive branch; nothing selected renders exactly today's card. The only judgement
  call is whether a three-row panel is worth opening — it is, because the alternative is a card that
  says *"View details"* and a URL that says `?selected=` for a selection nothing displays.

## F48. The Android dashboard renders two controls for an Active/Background split its source does not have — a no-op metric radio on the pie, and a legend for a lane that is always empty

- **Scope:** app-side `src/core/activityTracking/component/pieChart/ActivityPieChart.vue`,
  `component/android/AndroidPieChartSection.vue`, `component/timeline/ActivityTimeline.vue`,
  `view/AndroidActivityDashboard.vue`
- **Closes:** *(unfiled)*. Two observations the unit made and did not file as findings — the inventory
  lists *Total / Active / Background* as a shared control whose effect is *"changes which metric the pie
  chart slices represent"* (`tracking-dashboards/inventory.md:31`) and does not mark it as differing on
  Android (`:185-188`); the draft spec's own comment records that *"the Activity Timeline's own
  Active/Background legend (shared markup with the other dashboards) renders the word 'Background'
  unconditionally"* on `/activity-tracking/android` (`tracking-dashboards.draft.spec.ts:103-105`), and
  scopes its assertion around it. The legend half is **observed** (that comment is the observation);
  the radio half is **source-certain, unobserved** — nobody clicked *Active* on the Android pie.
  Batched rather than parked under rule 5 on the `F27`/`F43` precedent: same file as `F47`, same
  cause, and the fix is a prop with a default that changes nothing for the other three dashboards.
- **Root cause — confirmed from source.** The Android dashboard is the web dashboard's component tree
  with Android fetchers plugged in, and two of those components carry a two-metric assumption:
  1. **`ActivityPieChart.vue:9-28`** renders the `VRadioGroup` (*Total / Active / Background*)
     unconditionally, bound to a `viewMode` model every section owns. Web and desktop and unified read
     it in `pieSegments` (`ActivityPieChartSection.vue:104-110`, `DesktopPieChartSection.vue:152-158`,
     `UnifiedPieChartSection.vue:214-219`). **Android does not** — `AndroidPieChartSection.vue:114-127`
     maps `seconds: a.totalSeconds` with no reference to `viewMode` — and could not: the DTO has no
     `activeSeconds`/`backgroundSeconds` (`AndroidAppPieData.ts`), and the server's two fields are
     identical (§79). Clicking *Active* or *Background* on that view re-renders the same pie.
  2. **`ActivityTimeline.vue:30-39`** renders the *Active / Background* legend whenever `laneLabels`
     is absent, i.e. on every per-source dashboard. Android passes `detailSessions: []` and
     `backgroundSessions: []` with the comment *"Android reports a single lane — it has no detail or
     background sessions"* (`AndroidActivityDashboard.vue:186-191`), so the legend's second entry
     describes a hatched style that never appears on that view. `toStackedBarsWindow` (`:136-147`)
     hardcodes `backgroundSeconds: 0` for the same reason, and the summary cards already handle it
     correctly (`ActivityDomainCard.vue:33-65` hides a column whose stat is null — the unit noted this
     as the *right* behaviour, `inventory.md:193`).
- **Files:** `ActivityPieChart.vue:9-28` (the radio; wrap in `v-if`), `:44-53` (a prop);
  `AndroidPieChartSection.vue:49-54` (pass it), `:112` (`viewMode` can stay, always `'total'`);
  `ActivityTimeline.vue:30-39` (the legend), `:148-165` (props); `AndroidActivityDashboard.vue:30-41`
  (pass it)
- **What to change:** On `ActivityPieChart`, a `showViewMode?: boolean` prop defaulting to `true` (or
  `metrics?: ('total'|'active'|'background')[]` if a two-option radio is ever wanted — not now), and
  `v-if` on the `VRadioGroup`; Android passes `false`. On `ActivityTimeline`, either derive it — hide
  the *Background* legend entry when `backgroundSessions.length === 0 && detailSessions.length === 0`
  — or take an explicit `singleLane?: boolean`; **derive it**, because a web day with no background
  sessions also does not need a legend entry for a style not on screen, and the derivation has no
  false positives (the entry is decorative when the lane is empty either way). Check the *Single /
  Split* toggle (`ActivityTimeline.vue:43-62`) on Android while there: with one lane, *Split* has
  nothing to split — if it renders an empty second row, hide it under the same condition.
- **Do not change:** `AndroidPieTotals`/`AndroidAppPieData` — do not invent an `activeSeconds` that
  copies `totalSeconds` to make the radio "work"; the honest state is no radio. Not the unified
  timeline's `laneLabels` branch (`:13-29`). Not `viewMode`'s model contract on the other three
  sections.
- **Verification:** `/activity-tracking/android` — no *Total / Active / Background* radio in the
  snapshot, the legend beside *Activity Timeline* shows *Active* only (or nothing), the pie renders
  the same slices as before. `/activity-tracking`, `/desktop`, `/unified` — radio present, three
  options, *Active* still re-slices the pie; legend unchanged. `tracking-dashboards.draft.spec.ts:101-107`
  (*"Top Apps cards with no Background row"*) keeps passing and can drop its scoping workaround once
  the legend word is gone. SK as well as EN is not needed — no new strings.
- **Risk:** None for the other dashboards (defaults preserve today's render). The one thing to get
  right is the `viewMode` model on Android: leave it bound and `'total'` so `ActivityPieChart`'s
  `required: true` model is satisfied.

## F49. Date-preset and source-filter chips are focusable `span`s with no role and no state — and every other chip-as-toggle in the app is the same class

- **Scope:** app-side `src/core/activityTracking/component/ActivityRangePicker.vue`,
  `component/unified/ActivitySourceFilter.vue`, `src/core/todoList/component/TodoListFilters.vue`,
  `src/core/dayPlanner/component/settings/RepeatingTaskDialog.vue`,
  `src/core/dayPlanner/component/BasePlannerTaskDialog.vue`
- **Closes:** `tracking-dashboards/A1` (+ the unfiled twins in `todoList` and `dayPlanner` below)
- **Root cause — confirmed, and it is Vuetify's default, as the unit guessed.** Vuetify **3.12.4**'s
  `VChip.js` renders the chip as `props.tag` (`span`) with `tabindex: isClickable ? 0 : undefined`
  (`:195`) and an `onKeydown` (`:197`) — and **no `role`, no `aria-pressed`, no `aria-checked`**; the
  only ARIA it writes is `aria-label` on its *close* button (`:134`). `VChipGroup` adds none either.
  So a chip in a group is keyboard-reachable and Enter/Space-activatable but announced as plain text:
  no group membership, no selectedness, no affordance. The unit's two eval dumps (`{"tag":"SPAN",
  "role":null,"tabindex":"0","ariaLabel":null}`; `{"role":null,"tabindex":"0","ariaPressed":null}`)
  are exactly what that code produces. A tag-level census of `src/` (every `<VChip` whose own
  attributes carry `@click`, `link` or `to`) finds **15 chips used as controls**, in seven files. They
  fall into two tiers, and only the first is this finding's defect — a control whose *state* is
  invisible:
  | file | shape | what it is |
  | --- | --- | --- |
  | `ActivityRangePicker.vue:7-29` | `VChipGroup mandatory` + 5 `VChip :value` | single-select, exactly one on — a **radiogroup** |
  | `ActivitySourceFilter.vue:31-48` | bare `VChip @click` × 3, on/off via `variant`/`color` | independent toggles — **button + `aria-pressed`** |
  | `TodoListFilters.vue:6-21` | `VChipGroup multiple` + `VChip filter` per priority | multi-select — **checkbox** group (or button + `aria-pressed`) |
  | `TodoListFilters.vue:22-44` | `VChipGroup` (non-mandatory) + 2 `VChip filter` | single-select, may be none — **radio** with a clearable state, or two `aria-pressed` buttons |
  | `RepeatingTaskDialog.vue:112-121,141,200` | bare `VChip @click="toggleDay"` × 7, on/off via `color`/`variant`, `style="cursor: pointer"` | seven independent toggles — **button + `aria-pressed`**; the unit-7 pass did not file it |
  | `BasePlannerTaskDialog.vue:24-33` | bare `VChip @click="setDuration"` × N, on via `color` | single-select — **radio + `aria-checked`**; unit 7 did not file it |
  The second tier is **action chips** — a click that does something, with the chip's own text as its
  name: `TodoListFilters.vue:45-54` (*Clear filters*), `OverdueTasksBanner.vue:12-20`,
  `SkipReasonForm.vue:6-15`, `NowBar.vue:116-127` and the three `leisure` chips
  (`ExperiencedCell.vue:3-14`, `MemoryAnchorTable.vue:35,45`) — the last four already carry `link` and
  a `:title`/`:aria-label`. They lack only `role="button"`; they have no state to expose and are not
  what `A1` is about. `TimerPresetsSection.vue:35,85` is **`F37`'s** and is not touched here.
  `SkipReasonsTab.vue:6` is `closable` only — its close is Vuetify's real `<button aria-label>` and
  needs nothing. Unit 9 (`todo-lists`) did not file its three; its inventory pass predated the a11y
  evidence discipline the later units have. Same defect, same fix, one batch — the `F35`/`F24` shape,
  not a per-module one. Every remaining `VChip` in `src/` is a label (status, count, colour swatch);
  `ChipWithIcon.vue` in `_common` is the same and is not touched.
- **Files:** `ActivityRangePicker.vue:7-29`; `ActivitySourceFilter.vue:31-48`;
  `TodoListFilters.vue:6-54`; `RepeatingTaskDialog.vue:112-121` (and its two siblings at `:141`,
  `:200` if they are the same shape — read them; only `:112` was read this pass);
  `BasePlannerTaskDialog.vue:24-33`. Second tier, optional in the same commit: the six action chips
  above get `role="button"` and nothing else
- **What to change:** At the call sites, through attrs (Vuetify passes unknown attrs to the root
  `span`): `role="radiogroup"` + `:ariaLabel` on the range `VChipGroup`, `role="radio"` +
  `:ariaChecked="activePreset === option.value"` on each preset chip; `role="button"` +
  `:ariaPressed="isSelected(option.value)"` on each source chip (the text already names it — *"Browser
  1h 22m"* — no `aria-label` needed, but `aria-pressed` is what `F30` also adds to the history cards,
  so use the same attribute); on `TodoListFilters`, `role="group"` + label on the priority group,
  `role="checkbox"` + `:ariaChecked` on its chips, `role="radio"`/`aria-checked` on the two due chips,
  `role="button"` on *Clear filters*; on the two planner dialogs, `role="button"` +
  `:ariaPressed="data.scheduledDays.includes(day.value)"` on the day chips and `role="radio"` +
  `:ariaChecked="currentDurationMinutes === d"` on the duration chips (drop the inline
  `style="cursor: pointer"` at `RepeatingTaskDialog.vue:117` — Vuetify's `v-chip--link` class already
  sets it once the chip is clickable). **Rule 4 — do not do this in `componentDefaults`**: a global
  `VChip: { role: 'button' }` would name every status chip in every app a control it is not, and the
  right role differs per group (radio vs checkbox vs button), which no default can express.
- **Do not change:** `VChipGroup`'s `mandatory`/`selectedClass` behaviour; the range picker's
  `isCustomPinned` logic (`:91-92`); the source filter's *last-one-stays* rule (`:195-205`) — a
  pressed chip that refuses to un-press is fine if its tooltip says why, and it does. Not `_common`:
  the framework has no chip *group* (grep: `CalendarGrid.vue:96`, `NotificationsView.vue:15`,
  `SessionsSection.vue:23`, `OverviewGroupCard.vue:40`, `BulkActionOutcomeList.vue:13`,
  `ReminderKindRow.vue:6` are all labels) — if one appears later it is its own `FW` batch.
- **Verification:** `A1`'s `Verify:` block — the *Today* chip exposes `role="radio"` +
  `aria-checked="true"`; the *Browser* chip on `/unified` exposes `role="button"` +
  `aria-pressed="true"`, and after clicking *Desktop* off, that one reads `false`. Then
  `/todo-list/13002`: `getByRole('checkbox', { name: <priority> })` and `getByRole('radio', { name:
  'Today' })` resolve, and `Clear filters` is a `button`. Then `/day-planner/settings` → *Repeating*
  → open a task: the seven day chips are `button`s with `aria-pressed`; and any planner task dialog:
  the duration chips are `radio`s with one `aria-checked`. Tab order unchanged; Enter/Space still
  toggle (that part is Vuetify's and already works). `tracking-dashboards.draft.spec.ts:134` is the
  `fixme`; `todo-lists.draft.spec.ts` and `planner-day.draft.spec.ts` have none for this and could
  each gain one structural assertion.
- **Risk:** None to behaviour — attributes only. One thing to watch: `role="radio"` on a `span` whose
  Vuetify keydown handles Enter/Space but **not arrow keys** is a partial radiogroup (ARIA expects
  arrows to move selection). Acceptable here — Tab reaches each chip — but say so in the commit so
  nobody files it as a regression.

---

## FW1. `MyDialog` is `persistent` by default, so Escape closes nothing

- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue` — submodule commit in `vue_framework`,
  then a pointer bump in this repo, in that order
- **Closes:** `_shell/A1`
- **Re-verified unchanged this pass:** `MyDialog.vue:86` still defaults `persistent = true`; `onEscKey()`
  (`:136`) is still the only Escape handler.
- **Its own batch, and it needs a decision before a patch** (rule 4): flipping the default changes dismissal
  semantics for every dialog in every app on the framework, including destructive confirms. The two options —
  flip the default and have guarding dialogs opt **in**, versus keep the default and have harmless call sites
  opt **out** — are not equivalent in risk.
- **Files:** `src/_common/component/dialog/MyDialog.vue:86,136`; `src/_common/docs/components.md` in the same
  commit
- **What to change:** Whichever the decision is, plus the framework docs, plus a default that keeps existing
  apps working if it goes the opt-in way.
- **Verification:** `_shell/A1`'s `Verify:` block, **both halves** — a fix that makes every dialog escapable is
  a regression, not a fix. A destructive confirm must still resist Escape.
- **Risk:** Highest in this queue. Ships to every app on `vue_framework`, and the failure mode of getting it
  wrong (a half-filled form dismissed by a stray Escape) is data loss.

## FW2. Six framework icon-only controls have no accessible name

- **Scope:** **[framework]** `src/_common/nav/AppTopBar.vue`, `src/_common/component/FilterPanel.vue`,
  `src/_common/component/dateTime/MonthYearPicker.vue`, `src/_common/component/dateTime/MyDateInput.vue`
  — one submodule commit, then a pointer bump
- **Closes:** `_shell/A2`, `leisure-projects/A1`, **`planner-day/A1`** (+ two unfiled twins in `MyDateInput`)
- **Grown twice.** Unit 13 found the second one; unit 7 found the third and fourth, and this pass found
  the fifth and sixth in the file `FW15` had open. All six are a `VIconBtn` shipped with no
  `title`/`aria-label`, all in `src/_common`, all fixed by the same edit in the same commit — one batch.
  Re-verified by direct read: `AppTopBar.vue:11` (`icon="bars"`) has no label of any kind, contrasting
  with the theme toggle at `:44` which does carry `:title`; `FilterPanel.vue:49-55` (`icon="close"`)
  likewise. **`planner-day/A1` names the wrong file** (*Contradictions* §72): the month arrows are not in
  `CalendarGrid.vue` — that file has no `VIconBtn` at all — but in `MonthYearPicker.vue:3-8` and `:29-34`
  (`fa-chevron-left`/`-right`, `shiftMonth(±1)`), three components down (`CalendarGrid` →
  `DateRangePicker` → `MonthYearPicker`). The unit's `{"text":"","aria":null,"title":null}` eval is the
  evidence and stands; the fix just lands one file over. Every `MonthYearPicker` consumer gets it — both
  calendars, `ActivityRangePicker` (unit 5). And `MyDateInput.vue:3-9` / `:18-24` are the same two
  chevrons stepping a **day** (`prevDay`/`nextDay`), unnamed, shown by default (`dateShowArrows = true`)
  on `HistoryDetailView` and the History summary's range selector.
- **Files:** `AppTopBar.vue:9-16`, `FilterPanel.vue:49-55`, `MonthYearPicker.vue:3-8,29-34`,
  `MyDateInput.vue:3-9,18-24`
- **What to change:** A localized `aria-label` (and optionally `title`) on each, using the framework's own
  locale namespaces — `general.close` already exists there for the panel; the four chevrons need four
  new keys (previous/next month, previous/next day) under `dateTime`, next to the picker vocabulary
  `migration-revision.md:89-96` already mirrors. **Check the app-side mirror**: this app's `general` *and*
  `dateTime` namespaces replace the framework's wholesale, so any key the framework resolves must also
  exist in `src/locales/common.{sk,en}.ts` or it renders raw here (CLAUDE.md R5/R6/R11 — six instances so
  far; `F35` is the decision on whether that mirror becomes a deep-merge). Update
  `src/_common/docs/components.md` in the same commit.
- **Do not change:** anything under `src/core/` — in particular not `leisure-projects/A2`'s Messy icon (`F4`),
  which is the same class of defect on the app side and must ship separately. Not `MyDateInput`'s
  binding order — that is `FW15`, a different defect in the same file; one commit may carry both if it
  says so.
- **Verification:** `_shell/A2`'s, `leisure-projects/A1`'s and `planner-day/A1`'s `Verify:` blocks — each
  control exposes a localized accessible name, the sidebar toggle still toggles, the filter panel still
  closes, the month arrows still write `?month=` on `/day-planner` (the unit's own observation,
  `planner-day/inventory.md:20`), and `planner-day.draft.spec.ts:35-40` can drop its positional
  fallback for `getByRole('button', { name: 'Next month' })`. Confirm the names follow the locale rather
  than being hardcoded English, **in SK as well as EN**, since that is where the missing-mirror failure
  shows — and specifically that none reads raw `dateTime.<key>`.
- **Risk:** Low, but still two repos, two commits — submodule commit before the pointer bump, and the
  `dateTime` mirror in the bump.

## FW3. `Time.fromJson` cannot parse the backend's string shape

> ✅ **CLOSED 2026-09-13.** "Re-verified unchanged and still live" was true of the file and false of the
> defect: the API switched `dueTime` to `{hours, minutes}` on 2026-09-11 (backend `6395cee`), and the wire
> now reads `"dueTime":{"hours":17,"minutes":0}`. `Time.fromJson` was still made to delegate to
> `Time.fromString()` for a string argument — generic, default-preserving, documented in `baseDtos.md` —
> so the framework DTO reads either shape. Verified end to end: 6× `PUT` → 200, snackbar, 17:00 preserved
> after reload. Both `todo-motivation.spec.ts` `fixme`s are real tests now. `todo-lists/B4` closed.

- **Scope:** **[framework]** `src/_common/dto/dto/Time.ts` — submodule commit, then pointer bump
- **Closes:** `todo-lists/B4`
- **Re-verified unchanged and still live this pass:** `Time.fromJson` still reads
  `const { hours = 0, minutes = 0 } = object`.
- **Root cause:** The backend serializes a due time as the **string** `"HH:MM:SS"`, so every item with a real
  due time silently parses as `00:00` on read, and any subsequent `update()`/`updateWithResponse()`
  round-trips that zeroed value back out as `{"hours":0,"minutes":0}`, which the backend rejects with a 400
  (*"Cannot get the value of a token type 'StartObject' as a string."*). Not scoped to the overdue-renegotiation
  banner — it breaks **any** update path that serializes a `dueTime` through `ToDoListItemRequest.fromEntity`.
  `Time.fromString()` (same file, `:50-58`) already parses the string shape correctly; `fromJson` just doesn't
  call it.
- **Files:** `src/_common/dto/dto/Time.ts:17-20`
- **What to change:** Have `fromJson` delegate to `fromString` when its argument is a string.
- **Verification:** `todo-lists/B4`'s `Verify:` block — on `/todo-list/13002` ("Errands") click "Today" on the
  overdue banner: all 6 `PUT`s return 2xx, the "Moved 6 tasks…" snackbar appears, and each item's
  **time-of-day is preserved**, not zeroed. The second half matters: a fix that only stops the 400 would still
  be silently losing every due time on read.
- **Risk:** Medium. This DTO is read on every to-do item with a due time across the whole app. Test both
  directions.

## FW4. `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so

- **Scope:** **[framework]**, **docs only** — `src/_common/docs/components.md`, the *Data tables* section;
  optionally a one-line comment above `DataTable.vue:7`. Submodule commit, then pointer bump.
- **Closes:** nothing filed. It exists so the *next* `F12` does not happen: `tracking-settings/X1` cost a
  blocker grade, three screenshots, an `elementFromPoint` investigation and a wrong framework hypothesis,
  all for a missing `flex-fill`.
- **Root cause:** `DataTable.vue:7` renders `VDataTableServer` with `height="0"` — the fill-parent trick
  described under `F12` — and `BasicTable.vue:2` wraps it in `h-100`. That is a **contract on the
  consumer**: the table must sit in a flex column whose height is definite all the way up, or its body is
  0 px tall and its rows are laid out but invisible and un-clickable. `components.md:204-258` documents
  props, slots, emits and formatters and says nothing about layout. Seventeen consumers got it right by
  copying a sibling; the two that did not are the only ones that broke.
- **What to change:** One paragraph in `components.md` under *Data tables*: the table fills its parent and
  scrolls internally (that is why headers are sticky), the parent chain must therefore be definite-height
  flex columns, `flex-fill` on the wrapper plus `class="flex-1-1" style="min-height: 0"` on the table is
  the shape to copy (`ActivityTable.vue:42-43`), and the symptom of getting it wrong is "the row is in the
  a11y tree but not on screen". **Do not change the default** — a self-sizing body would drop sticky
  headers app-wide, and per batching rule 4 that is a decision, not a docs fix. If the maintainer wants a
  guard, a dev-mode `console.warn` when the wrapper measures 0 px after mount is the shape; file it as a
  separate ask.
- **Verification:** Read-through; the sentence names the symptom a future unit agent will see.
- **Risk:** None — docs only. Two repos, two commits, in order.

## FW5. `DataTable`'s default row actions render the internal slug as their `title`, not the localized label

- **Scope:** **[framework]** `src/_common/component/dataTable/DataTable.vue:83` — submodule commit, then
  pointer bump
- **Closes:** `activity-settings/B4`
- **Root cause:** Confirmed by direct read. `TableAction` is `(name, text, color, variant, icon,
  onClick)` (`TableAction.ts:1-10`); `BasicTable.vue:175,177` constructs the defaults as
  `new TableAction('edit', t('general.edit'), …)` / `('delete', t('general.delete'), …)`; and
  `DataTable.vue:83` binds `:title="action.name"` — the slug. **Its sibling already has it right:**
  `TableGrid.vue:130` binds `:title="action.text"`. Every app on the framework that uses `BasicTable`'s
  default actions ships `title="edit"` / `title="delete"` on every row, in every locale.
- **Not merged into `FW2`, deliberately.** `FW2` is two controls with *no* label; this is a control
  with the *wrong field* bound. Different cause, different fix, though nothing stops one submodule commit
  carrying both — say so in the commit message if it does.
- **Files:** `src/_common/component/dataTable/DataTable.vue:83`; `src/_common/docs/components.md` only
  if it documents the `title` (it need not gain a sentence for a one-character field name)
- **What to change:** `:title="action.text"`. Consider adding `:aria-label="action.text"` in the same
  line — `title` alone is an accessible name of last resort — but that is a small widening, not this
  finding.
- **Do not change:** `TableAction`'s field order or `BasicTable`'s constructors; `name` is the
  discriminator `TableGrid.vue:131` switches on (`action.name === 'edit'`).
- **Verification:** `B4`'s `Verify:` block — **but not on `/activity-settings/roles` once `F19` has
  landed**, because that table will no longer render the default actions. Use `/routine-settings`
  (`RoutineSettingsView.vue`, a `BasicTable` with default actions and `@onDelete`) or run this before
  `F19`. Both locales, per step 3 of the block.
- **Risk:** None. One field name, and the correct value is already what the sibling renders.

## FW6. `CalendarGrid`'s day cells are click-only `div`s — no accessible name, role, `tabindex` or key handler

- **Scope:** **[framework]** `src/_common/component/calendar/CalendarGrid.vue` — submodule commit in
  `vue_framework`, then a pointer bump in this repo; **the pointer-bump commit must also carry an
  app-side locale mirror** (below)
- **Closes:** `history-review/A2`. **Pre-empted** the same finding from unit 7 (`planner-day`) —
  `PlannerCalendarView.vue:2-53` mounts the same component with the same `@dayClick`, and the unit's
  inventory locates day cells by `getByText('14.09....')` (`planner-day/inventory.md:24-27`) without
  filing the missing role; the pre-emption held, as `FW8`'s did (§66). Verify on `/day-planner` too.
- **Root cause:** Confirmed, and the finding's framework guess was right — the click target is the
  grid's own markup, not the app's slot. `CalendarGrid.vue:64-76` renders each cell as `<div
  class="day-cell" … @click="handleDayClick(dayData)">` and the app's `#day-cell-content` slot (`:81-84`)
  sits *inside* it. No `role`, `tabindex`, `aria-label`, `title` or `@keydown` on the cell; the
  `.empty` cells (`:70`, padding cells for days outside the range) carry the same `@click` and are
  no-op'd in `handleDayClick` (`:268-271`). `CalendarDayCellHeader` renders the visible day number, so
  the snapshot shows digits with no relationship to the clickable wrapper — which is why the unit had to
  click a neighbouring ref and sometimes hit the wrong day.
- **Files:** `CalendarGrid.vue:64-76` (the cell), `:268-271` (the handler); `src/_common/docs/components.md`
  (the `CalendarGrid` entry) in the same commit
- **What to change:** On non-empty cells: `role="button"`, `tabindex="0"`, `@keydown.enter.space.prevent`
  to the same `handleDayClick`, and an `:aria-label` naming the date — the finding's *"View history for
  September 10, 2026"* is app wording; the framework's generic form is the date plus the weekday
  (`allDays` at `:175-188` already has the localized weekday names; the date must be formatted through
  the i18n locale, **not** `formatToDateWithDay` from `DateTimeHelper.ts`, which is hardcoded `sk`
  (*Contradictions* §22) and would announce Slovak dates in EN). The label key goes in the framework's
  `calendar` namespace next to `calendar.daysToShow`. **`.empty` cells get none of it** — no role, no
  tabindex, and `cursor: default` is already there (`:406-409`); make the `@click` conditional too so a
  padding cell is not a focus stop. A `:focus-visible` outline on `.day-cell` — the existing `.selected`
  outline (`:379-383`) is the shape to mirror, not reuse, since selected and focused are different states.
- **⚠️ The locale mirror is not optional.** This app's `src/locales/common.{sk,en}.ts` declares its own
  `calendar` namespace (`common.en.ts:431`, with the comment at `:429` saying it is *"consumed by
  `_common/component/calendar/CalendarGrid.vue`"*), and the aggregator spread is shallow — the app's
  `calendar` **replaces** the framework's wholesale (CLAUDE.md *Localization*; R11 was exactly this
  namespace). Any key `CalendarGrid` resolves that is not mirrored renders raw here. Add the new key to
  both app files in the pointer-bump commit, and say so in its message.
- **Do not change:** the `#day-cell-content` slot contract or the `dayClick` payload — `HistoryCalendarView`
  and `PlannerCalendarView` both cast it. Not `CalendarDayCellHeader` — the visible day number is fine;
  the name belongs on the control. Do not batch with `F29`/`F30` (rule 1 — those are app-side).
- **Verification:** `history-review/A2`'s `Verify:` block on `/activity-history/calendar` — a day cell
  resolves by `getByRole('button', { name: /10/ })` (or whatever the label pattern is), Tab reaches it,
  Enter navigates to `/activity-history/detail?date=2026-09-10` exactly as a click does; padding cells
  are not focus stops. Then `/day-planner` for the second consumer. **Both locales**, and specifically
  check the name is not raw `calendar.<key>` in either — that is the mirror check.
- **Risk:** Low, but two repos and one locale trap. Every app on the framework that renders
  `CalendarGrid` gains focusable cells — a month is 28–42 new tab stops, which is correct for a control
  grid but is a change a keyboard user of another app will notice.

## FW7. Every password field's visibility toggle is named "{label} appended action" — one component, and one locale key nobody defined

- **Scope:** **[framework]** `src/_common/modules/user/component/MyPasswordInput.vue`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts`, `src/_common/docs/modules/user.md` — submodule
  commit in `vue_framework`, then a pointer bump. **No app-side locale mirror is needed** (below).
- **Closes:** `user-settings/A1`, **`auth/A1`** (the same toggle on `/login` and `/registration` —
  "Password appended action", "New password appended action", "Confirm new password appended action",
  observed in the snapshot), and **`auth/B2`** (the raw `user.passwordsDontMatch` the adjacent below
  predicted, now **observed** on `/registration` — screenshot `registration--password-mismatch.png`
  and the `[intlify] Not found 'user.passwordsDontMatch' key in 'EN'` console line). **Also answers the
  message half of `user-settings/U4`** (adjacent, below), which stays listed under *Needs
  verification* for its on-screen half. Ninth pass: both auth findings repeat the seventh pass's
  wrong mechanism ("no `aria-label` binding exists on the `appendInnerIcon`") — the paragraph below
  already corrects it; their suggested `:aria-label` on the icon prop would not take effect.
- **Root cause — one file, not three call sites.** All three fields in the dialog (and every other
  password field in the module — `MyVerifyPasswordInput.vue:2`, both halves of
  `MyNewPasswordInput.vue:2,9`, so sign-in, registration, the verify dialog and the e-mail change too)
  render through `MyPasswordInput.vue`, whose `:appendInnerIcon` + `@click:appendInner` (`:7,:10`) is
  the Vuetify mechanism that generates the name. Vuetify 3.12.4 `components/VInput/InputIcon.js:30`:
  `label = listener && localeKey ? t('$vuetify.input.appendAction', props.label ?? '') : undefined`,
  and `locale/en.js:76` is `appendAction: '{0} appended action'`. That is the whole of it: the field's
  own label, run through a slot-position template. The finding's guess ("no `aria-label` passed at the
  call site") is right in effect and misses that no prop *can* override it — the only knob is the
  global `$vuetify.input.appendAction` string, which would still have to say "appended action" for every
  clearable/appended field in every app. **Naming only, and reachability must survive the fix:**
  `VIcon.js:72-74` gives the generated icon `role="button"`, `tabindex="0"` and `InputIcon`'s own
  Enter/Space handler, so today's toggle is keyboard-operable with a bad name. A bare `<VIcon @click>`
  in the slot keeps role and tabindex but **loses the keydown handler**; a button does not.
- **Files:** `MyPasswordInput.vue:7,10`; `user.{sk,en}.ts` (two new keys, plus the missing one);
  `docs/modules/user.md`
- **What to change:** Replace the two icon props with a `#append-inner` slot holding a `VIconBtn`
  (the framework's own alias, `createAppVuetify.ts:13`) — `:icon="showPassword ? 'eye-slash' : 'eye'"`,
  `variant="plain"`, `size="small"`, `density="compact"`, `@click="showPassword = !showPassword"`, and
  `:aria-label` / `:title` bound to `$t(showPassword ? 'user.hidePassword' : 'user.showPassword')`. A
  toggle whose *label* changes must not also carry `aria-pressed` (that is two state channels for one
  fact; pick the label). Keys go in the **framework's** `user` namespace, and unlike `general`/`calendar`
  this app **merges** `user` per key rather than replacing it (`SK.ts:57`, `EN.ts:44` —
  `{ ...frameworkUser.user, ...appUser.user }`), so nothing needs mirroring into `src/core/user/_locales/`;
  just confirm `appUser.user` does not already declare the same key names, because the app wins a
  collision. Watch the field height: Vuetify's append-inner slot is sized for an icon, and a default
  `VBtn` is taller than the `comfortable` field — `size="small"` + `variant="plain"` fits, check in both
  densities before committing.
- **Adjacent, source-certain, same module, same commit — the mismatch message is a raw key.**
  `MyNewPasswordInput.vue:36` resolves `i18n.t('user.passwordsDontMatch')`; grep across every
  `_locales/*.ts` in `src/` (framework `common.{sk,en}`, framework `user.{sk,en}`, app `user.{sk,en}`,
  `common.{sk,en}`) finds **only the usage**. vue-i18n renders the key path when both the locale and the
  fallback miss, so `U4`'s "mismatched new/confirm" validation line reads `user.passwordsDontMatch` on
  screen, in both languages, on the change-password dialog *and* on registration (unit 15). Add the key
  to both framework `user` files. Not filed by the unit (it could not type into the field); folded here
  rather than given a batch because it is two lines in the file this batch already edits, and `U4`'s
  retest is where it gets seen. **Ninth pass: unit 15 typed into the field and saw it** (`auth/B2`),
  so this is no longer source-only. One footnote from the same read, not batched: `MyNewPasswordInput.vue:4,11`
  resolve `user.password` / `user.confirmPassword` when `isNew` is false; `user.sk.ts:85` defines
  `confirmPassword`, `user.en.ts` does not, and neither file defines `user.password`. Dead today —
  both consumers (`RegistrationView.vue:27`, `ChangePasswordForm.vue:11`) pass `isNew` — so it is a
  drift to close while in the file, not a defect to verify.
- **Do not change:** `$vuetify.input.appendAction` in `vuetifyLocale.sk.ts` / `common.en.ts` — that is
  the fallback for every *other* appended action and "appended action" is the right generic name for a
  slot Vuetify knows nothing about. Not `MyNewPasswordInput`'s rule logic. Do not batch with `FW2`
  (control with *no* name) — the finding itself argued for the split, and it is right: different
  mechanism, and `FW2` is two hand-written buttons while this is a Vuetify-generated one.
- **Verification:** `A1`'s `Verify:` block — open *Change password*, each of the three toggles has the
  accessible name *Show password*, and after activation *Hide password* with the field's `type` flipped
  to `text`; **Tab reaches each toggle and Enter/Space flips it** (the reachability the fix must not
  lose); both locales (`Zobraziť heslo` / `Skryť heslo`, or whatever the SK file says — no raw key). Then
  `U4`'s half: type `a` in *New password* and `b` in *Confirm new password* — the line under the confirm
  field reads a sentence, not `user.passwordsDontMatch`. The harness's classifier blocked the agent's
  `fill` on a password field; a Playwright spec is code, not the agent, so promote the draft spec's `A1`
  and `U4` `fixme`s and let the suite do the typing (nothing is submitted; a mismatch sends no request).
  **Ninth pass — two signed-out places to look too:** `/login`'s toggle and `/registration`'s two
  (`auth/A1`'s snapshot names), and the mismatch line on `/registration` (`auth/B2`, screenshot
  `registration--password-mismatch.png`); `e2e/tests/auth.draft.spec.ts:97` is the `fixme` for the
  latter and needs no sign-in, so it is the cheapest assertion this batch has.
- **Risk:** Low-medium for a one-file change: every sign-in and registration form in every app on the
  framework changes its toggle's markup from a Vuetify-managed `<i>` to a `VBtn`. Look at `/login` and
  `/registration` after the pointer bump, in both densities and both themes.

## FW8. Six elevated buttons in the framework's user module use the tonal/outlined colour tokens — and the pairing rule is written only in this app's CLAUDE.md

- **Scope:** **[framework]** `src/_common/modules/user/component/settings/SecuritySection.vue`,
  `SessionsSection.vue`, `view/ConfirmEmailView.vue`, `view/ConfirmEmailChangeView.vue`,
  `component/ResendConfirmationEmail.vue`, plus one paragraph in `src/_common/SETUP.md` — submodule
  commit, then pointer bump
- **Closes:** `user-settings/P1`. **Pre-empted** the same finding from unit 15 (`auth`) on its three
  signed-out views — and it worked: unit 15 ran on 2026-09-14, its inventory recorded the buttons, and
  its `findings.md` does not file them (ninth pass, *Contradictions* §66). `FW12` edits two of the same
  lines (`ConfirmEmailView.vue:21`, `ConfirmEmailChangeView.vue:20`); land this first or fold it in.
- **Root cause:** Confirmed by direct read, and wider than filed. The finding names two —
  `SecuritySection.vue:62` (`color="warning"`) and `:68` (`color="error"`), both with `VBtn`'s
  framework default `variant="elevated"` (`createAppVuetify.ts:25`). A grep of the module finds four
  more of the same shape: `SessionsSection.vue:40` (per-row *Revoke*, `error`), `ConfirmEmailView.vue:21`,
  `ConfirmEmailChangeView.vue:20`, `ResendConfirmationEmail.vue:5` (all `error`). The author knew the
  rule: `SessionsSection.vue:63-64` pairs `error` with `variant="tonal"` correctly, and the
  delete-account confirm on `SecuritySection.vue:184` passes `confirmBtnColor: 'errorDark'`. Six
  buttons drifted, not a convention that was never adopted.
- **Whose rule is it?** The tokens are the framework's (`bootstrap/theme.ts:23-26` defines `errorDark`
  / `warningDark` / `successDark` next to `error` / `warning`), the elevated default is the framework's,
  and framework components already use the Dark tokens (`reminders`, `notifications`, `MyCard`,
  `SnackbarComposable.ts:30,38`). The *pairing* — elevated takes the Dark token, tonal/outlined the plain
  one — is written in this app's CLAUDE.md and AGENTS.md and nowhere in `src/_common`: `SETUP.md:289-290`
  says keep the colour *names* and stops there. So the batch is six tokens **and one sentence** next
  to that paragraph, so the next framework module has the rule where its buttons are. Not a default
  change — rule 4 does not bite; nothing about `componentDefaults` moves.
- **Files:** `SecuritySection.vue:62,68`; `SessionsSection.vue:40`; `ConfirmEmailView.vue:21`;
  `ConfirmEmailChangeView.vue:20`; `ResendConfirmationEmail.vue:5`; `SETUP.md:289`
- **What to change:** `warning` → `warningDark` (one), `error` → `errorDark` (five). The SETUP.md
  sentence: *elevated → `primary`/`secondary`/`errorDark`/`successDark`/`warningDark`; tonal or outlined
  → `primaryOutline`/`secondaryOutline`/`error`/`success`/`warning`* — CLAUDE.md's own two lines, moved
  to where the components live.
- **Do not change:** `SecuritySection.vue:49` (`color="info"` — Vuetify's stock token; the theme
  declares no `infoDark`, so there is nothing to pair it with; out of scope and worth a separate
  question of whether `info` belongs in the palette at all). Not the `VChip`s or the `MyDialog`
  `confirmBtnColor="error"` on `SessionsSection.vue:74` — that prop's variant is `MyDialog`'s business.
  Not `GoogleCalendarCard.vue` (`F34`, rule 1).
- **Verification:** `P1`'s `Verify:` block on `/user/settings` in both themes — *Change password* in
  `warningDark`, *Delete account* and each *Revoke* in `errorDark`, all legible. The three signed-out
  views are unit 15's to inventory; a one-line source read is enough here, and its agent should not
  file them again.
- **Risk:** Visual only, two repos. `warningDark` (`#CA8A04`) is darker and less saturated than the
  unit's screenshot shows for `warning` — that is the point, but look at it in dark theme where the
  card is `surface`.

## FW9. The forgotten-password flow cannot complete at either step — the request omits `recaptchaToken`, and the reset link points at a view that does not exist

- **Scope:** **[framework]** `src/_common/modules/user/view/ForgottenPasswordView.vue`, a **new**
  `src/_common/modules/user/view/ResetPasswordView.vue`, `src/_common/modules/user/user.routes.ts`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts`, `src/_common/docs/modules/user.md:8` —
  submodule commit, then pointer bump. App side, in the bump commit: `docs/views/_routes.md` gains one
  record (`/reset-password`), and `src/router.ts`'s `SIGNED_OUT_ONLY_ROUTES` deliberately does **not**
  (below). *The number:* `FW9` was reserved by the fifth and sixth passes for the `BasicTable` dialog
  defect; that was fixed straight into `vue_framework` (`98b92d0`, bump `126d2968`) and never became a
  batch, so the number is free. `FW10` stays reserved for the `TimePicker` minute-60 item.
- **Closes:** `auth/X1` (`blocker`, stands), `auth/B3` (re-graded `bug` → `polish`, §59).
- **Root cause — two gaps, and the unit could only see the first.** Read against the API this pass
  (`framework/Sydowwe.Framework/application/endpoint/user/command/auth/BaseForgotPasswordEndpoint.cs`,
  `BaseResetPasswordEndpoint.cs`, the two request records, `AdhdTimeOrganizer/.../ForgotPasswordEndpoint.cs`
  which is a bare subclass, `Properties/launchSettings.json:23`):
  1. **The token.** `ForgottenPasswordView.vue:65` posts `{ email }`; `ForgotPasswordRequest.cs:6` is
     `public required string RecaptchaToken`, so System.Text.Json refuses the body before the endpoint
     runs — the exact serializer 400 the unit captured. The endpoint then verifies the token with action
     **`forgot_password`** (`:53`), not `'forgotten-password'` as the finding guessed, and Google's
     `siteverify` compares the action string exactly (`GoogleRecaptchaService.cs:36`). Locally the
     verifier is `LocalAlwaysPassRecaptchaService` (§63), so an empty token passes here.
  2. **The route.** On success the endpoint mails `BuildResetLink` = `{PAGE_URL}/reset-password?userId={id}&token={escaped}`
     (`:45-49`; `PAGE_URL` is `https://localhost:3000` in dev) and exposes `POST /auth/reset-password`
     taking `{ userId: long, token, newPassword, recaptchaToken }` with action **`reset_password`**
     (`BaseResetPasswordEndpoint.cs:31,39`). **`grep -ri reset-password src/` finds only the two locale
     strings for the button label.** `userRoutes` (`user.routes.ts:14-45`) has five records and none is
     `/reset-password`; `docs/modules/user.md:8` documents exactly five. So a user who receives the mail
     clicks into `F20`'s blank main area, and the flow the view promises ("follow the instructions in
     the email") has never been completable in this app. This is the larger half of the blocker and the
     reason `X1`'s one-line fix must not ship alone.
  3. **The error handling the unit filed as `B3`, seen whole.** `BaseForgotPasswordEndpoint.cs:15-18,54-68`
     answers **204 on every path** — unknown address, unconfirmed address, *and* a failed reCAPTCHA —
     by design, to avoid an enumeration oracle. So the view's `if (error.response.status === 404)`
     (`:70`) is a branch the server never takes, `showErrorSnackbar('Email not found')` (`:71`) is a
     hardcoded English literal on a dead path (a localized `authorization.emailNotFound` exists and is
     also unneeded), and the finding's headline — *"everything else is silently logged"* — is wrong:
     the interceptor (`axiosConfig.ts:220-265`) snackbars every status that has a response, which is
     why the unit saw *"One or more errors occurred!"* for the 400. What is real is narrower: when
     there is **no response** (server down, CORS, abort), `error.response` is `undefined`, `:70` throws
     `TypeError` inside the `catch`, the `.finally` still hides the spinner, and the user gets nothing
     — the interceptor's `status !== undefined` guard (`:221`) skips it too. `LoginView.vue:196-205`
     already solved this case (`handleHttpCodes(status ?? 0)` → `httpErrors.unknown`). Plus
     `console.log('Error', …)` at `:73`, which `F38` pre-empted for this batch.
- **Files:** `ForgottenPasswordView.vue:51-80`; new `ResetPasswordView.vue`; `user.routes.ts:45`;
  `user.{sk,en}.ts` (`authorization` block — this is the file that **wins** the `authorization`
  namespace: `SK.ts:48` / `EN.ts:38` spread `frameworkUser` after the framework `common`, whose own
  `authorization` block at `common.en.ts:475` loses wholesale, so keys added there would never render);
  `docs/modules/user.md:8`
- **What to change:**
  - `ForgottenPasswordView`: import `useRecaptcha`, `recaptchaToken = await executeRecaptcha('forgot_password')`
    (action name from the endpoint, above), post `{ email, recaptchaToken }`. Replace the `catch` body
    with the `LoginView` shape: `const status = error.response?.status; if (status === undefined)
    handleHttpCodes(0)` — and nothing else, because every other status already has an interceptor
    snackbar and a second one would replace it. Delete the 404 branch and the `console.log`. Optional,
    same file: the success `MyDialog` has `hasCloseBtn=false`, `hasConfirmBtn=false` and `MyDialog`'s
    `persistent` default (`FW1`), so it can only be left by navigating — a *Go to login* confirm button
    (`authorization.goToLogin` exists) costs one prop. Consider wording `passwordResetEmailSent` so it
    does not promise a mail the server may have declined to send ("If an account with that address
    exists, …") — the server's enumeration guard makes the current sentence a small lie for unknown
    addresses; a copy decision, flagged not prescribed.
  - `ResetPasswordView.vue` (new): reads `route.query.userId` (→ `Number`) and `route.query.token`
    (vue-router has already URL-decoded it; do not decode again); one `VForm` with `MyNewPasswordInput
    isNew` (which brings the strength rules and, after `FW7`, the mismatch message); on submit
    `executeRecaptcha('reset_password')` then `POST /auth/reset-password` `{ userId, token, newPassword,
    recaptchaToken }`; on 204 show a success state with *Go to login* (`{ name: 'login' }`) — the server
    has revoked every session (`BaseResetPasswordEndpoint.cs:65-67`), so there is nothing to sign in
    with automatically. Failures are 400 with `errors.generalErrors` (`"Recaptcha verification failed."`,
    `"Invalid or expired reset token"`, or Identity's password-rule descriptions) — the interceptor's
    `BadRequest` arm already shows `serverMessage`, which resolves to the first of those, so the view
    only needs the `status === undefined` fallback. If `userId` or `token` is missing from the URL,
    render the same "link is invalid" state without posting. Two new keys, both files: a title
    (`authorization.setNewPassword`) and the success line (`authorization.passwordResetSuccess`);
    `authorization.resetPassword` already exists for the button.
  - `user.routes.ts`: add `{ path: '/reset-password', name: 'resetPassword', component:
    ResetPasswordView, meta: { public: true, showRecaptchaBadge: true } }`. The path is the server's
    (`BuildResetLink` is `virtual` and a host may override it — say so in `docs/modules/user.md`, which
    also changes "five signed-out views" to six).
- **Do not change:** `src/router.ts`'s `SIGNED_OUT_ONLY_ROUTES` — `/reset-password` processes a
  token out of an e-mailed link, exactly the case the comment at `:74-77` gives for keeping the two
  confirm-e-mail routes out of the set, so a signed-in user clicking the mail must still reach the
  form. Not the interceptor's `AUTH_ENDPOINTS` list (`axiosConfig.ts:63`): neither endpoint answers
  401, so neither needs the no-refresh treatment. Not `authorization.emailNotFound` — leave the key,
  just stop using it. Not the server: the 204-on-everything contract is right and is documented as
  deliberate.
- **Verification:** `X1`'s `Verify:` block — seeded `test@example.com`, *Reset password*, `POST
  /api/auth/forgotten-password` → **204** (the finding says "2xx"; it is 204), the *Password reset
  email has been sent* dialog opens, no error snackbar. **Mind the throttle:** the endpoint is
  `Throttle(3, 60)` per client IP (`:36`), so a fourth submit inside a minute is a 429 and the
  interceptor's default arm shows *unknown error* — that is correct behaviour, not a regression. Then
  the second step, which needs no inbox: `goto /reset-password?userId=10001&token=garbage`, fill a
  valid new password twice, submit → `POST /api/auth/reset-password` → 400, snackbar *"Invalid or
  expired reset token"* (Identity's description for a bad token), the form still on screen. Then
  `goto /reset-password` with no query → the invalid-link state, no request. `B3`'s network case:
  `playwright-cli route "**/api/auth/forgotten-password"` aborted → *unknown error* snackbar, no
  `TypeError` in the console. Promote the draft spec's `fixme` at `e2e/tests/auth.draft.spec.ts:121`.
  A full round trip with a real mail is a manual check against a configured sender and is not
  required to close either finding.
- **Risk:** Medium, two repos, and additive: every app on the framework gains a route it did not have,
  on a path its server may or may not mail (the `BuildResetLink` override). An app whose host mails a
  different path gets an unreachable-but-harmless view; an app whose host mails **this** path gets a
  flow that works for the first time. The badge meta and the `public` flag match the other five, so
  the app-side guard needs nothing.

## FW11. Post-login redirect, read half — the three success handlers hardcode `/`

- **Scope:** **[framework]** `src/_common/modules/user/view/LoginView.vue:156,217`,
  `src/_common/modules/user/component/LoginVerifyQrCode.vue:64`, a new
  `src/_common/modules/user/utils/postLoginRedirect.ts`, `src/_common/docs/modules/user.md:43-44` —
  submodule commit, then pointer bump (which carries `F39`)
- **Closes:** `auth/B1` (read half — `F39` is the write half, rule 1), **`auth/P3`** (same file,
  below).
- **Root cause:** Confirmed by direct read. All three sign-in success paths end in a literal
  `router.push('/')`: the password path (`LoginView.vue:155-156`), the Google path
  (`handleGoogleLogin`, `:214-218`) and the 2FA path (`LoginVerifyQrCode.vue:63-64`, a child of
  `LoginView` so `useRoute()` sees the same `/login?redirect=…`). The framework has been *writing*
  `redirect` since the interceptor's forced-logout path existed (`axiosConfig.ts:175`), so a user
  whose session expired mid-task is already sent to `/login?redirect=/where/they/were` today — and
  then to `/`. `F39` adds the guard as a second writer; this batch is the only reader either of them
  will ever have.
- **Files:** the two views above; `utils/postLoginRedirect.ts` (new); `docs/modules/user.md:43-44`
- **What to change:** One helper, used three times: `resolvePostLoginTarget(route): RouteLocationRaw`
  — takes `route.query.redirect`, accepts it only when it is a string that starts with `/` and not
  `//` (a protocol-relative URL is the open-redirect the finding warns about; `\` should fail the same
  test, since some browsers normalise it to `/`), and returns `'/'` otherwise. `router.push(
  resolvePostLoginTarget(route))` at all three sites; `LoginView` needs a `useRoute()` import,
  `LoginVerifyQrCode` too. Note in `docs/modules/user.md` that the `redirect` query is the module's
  contract, who writes it, and that it is path-only by design. **Folded in, same file:** delete
  `LoginView.vue:142`'s `console.log(valid)` (`auth/P3`, `F38`'s pre-empt) and replace the hardcoded
  `showErrorSnackbar('No user!!!')` at `:159` — a 200 with an empty body — with `handleHttpCodes(0)`;
  the `console.error` beside it can stay. Both are two-line deletions in a function this batch is
  already editing.
- **Do not change:** `'/'` as the fallback — `{ name: 'home' }` would assume every host app names its
  root route `home`, which this module does not otherwise require. Not the `SIGNED_OUT_ONLY_ROUTES`
  guard app-side: an authenticated visitor to `/login?redirect=x` is bounced to `home` and loses `x`,
  and that is fine — they are signed in already. Not `RegistrationView.goToLogin()` (`:106-108`): it
  pushes `{ name: 'login' }` with no redirect, correctly, because a new account has nowhere to return
  to. Not `axiosConfig.ts:175`.
- **Verification:** `B1`'s `Verify:` block end to end once `F39` is in the pointer; before that, the
  interceptor's path proves the read half alone — `goto /login?redirect=%2Ftodo-list%2F13001`, sign
  in, land on `/todo-list/13001`. The open-redirect guard: `goto
  /login?redirect=https%3A%2F%2Fexample.com` and `?redirect=%2F%2Fexample.com` both land on `/`.
  `P3`: no bare `true`/`false` line in the console on submit. The 2FA path stays `unverified` (`U2`)
  — its line is a one-token change and reads the same helper, so a source read is enough for it.
- **Risk:** Low, two repos. Every sign-in form in every app changes where it lands *only* when a
  `redirect` query is present, and the interceptor is the only writer in any app today.

## FW12. Both confirm-e-mail views' error states are a lone button — and the sibling the unit held up as the model is no better

- **Scope:** **[framework]** `src/_common/modules/user/view/ConfirmEmailView.vue`,
  `src/_common/modules/user/view/ConfirmEmailChangeView.vue`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts` — submodule commit, then pointer bump. Same
  lines as `FW8` (`ConfirmEmailView.vue:21`, `ConfirmEmailChangeView.vue:20`); land after it or fold.
- **Closes:** `auth/B4`, `auth/B5`. **Settles `auth/U6`** — no defect (below).
- **Root cause, and a correction.** `B4`'s premise is that `ConfirmEmailChangeView`'s error state
  shows *"a persistent localized explanation plus a 'Go to login page' recovery button"* and its
  sibling only the resend button. Read both templates and both screenshots this pass:
  `ConfirmEmailChangeView.vue:15-25`'s error branch is **one `VBtn`** (*Go to login page*) and no text;
  `ConfirmEmailView.vue:15-26`'s is one `VBtn` (*Resend confirmation email*) and a commented-out
  `<span>{{ i18n.t('') }}</span>` with an empty key. The "persistent body text" visible in
  `confirm-email-change--no-token-error.png` is the **error snackbar**, still on screen when that
  screenshot was taken; `confirm-email--no-token-error.png` was taken after its snackbar had gone.
  So the defect is real and **both** views have it: after three seconds each shows a button under a
  blank page with no sentence saying what went wrong. Severity `bug` stands; the fix covers two views,
  not one. Three more things in the same forty lines, all source-certain: `ConfirmEmailView.vue:69`
  snackbars the literal `Error` (`B5`, observed) — and `SnackbarComposable.ts:28`'s
  `customMessage || 'Error'` is the same literal one level down, so an empty string would render it
  too; the resend at `:64` interpolates `router.currentRoute.value.query['userId']` unguarded, so with
  no query it posts to `/auth/resend-confirmation-email/undefined` (which is how `B5`'s repro produced
  its failure); and both success buttons are `color="main"` (`ConfirmEmailView.vue:9`,
  `ConfirmEmailChangeView.vue:9`) — `bootstrap/theme.ts` defines no `main`, so Vuetify emits
  `bg-main`, no such class exists, and the *Go to login* button after a **successful** confirmation
  renders with no fill. Unobserved (success needs a real token), one outcome. Both `console.log(error)`
  lines (`:57,71`, `:58`) are `F38`'s pre-empt.
- **Why `U6` is not a defect:** the unit reasoned that `showFullScreenLoading()` on mount with no
  `hideFullScreenLoading()` in either `catch`, and an interceptor that hides only on success, should
  strand the spinner on any error — and then honestly reported that three live attempts never showed
  one. The missing piece is `SnackbarComposable.ts:43-46`: `showSnackbar` calls
  `hideFullScreenLoading()` unless `dontHideFullScreenLoading` is set, and both views'
  `catch` blocks call `showErrorSnackbar` first. The spinner is hidden by the snackbar, on every
  error, by design. Dropped; the unit's "inconclusive, not negative" was the right thing to write.
- **Files:** `ConfirmEmailView.vue:2-28,54-73`; `ConfirmEmailChangeView.vue:2-26,55-59`;
  `user.{sk,en}.ts` (`authorization` block)
- **What to change:** In both error branches, a persistent line above the button(s) reusing the key
  each view already snackbars — `authorization.errorConfirmingEmail` / `authorization.errorConfirmingEmailChange`
  — then a *Go to login page* button on `ConfirmEmailView` too (`authorization.goToLogin`, `{ name:
  'login' }` rather than the literal `'/login'` at `:10,:21` of the sibling). On `ConfirmEmailView`,
  render *Resend confirmation email* only when `route.query.userId` is present — a link with no id has
  nothing to resend to — and replace `showErrorSnackbar('Error')` with a real key
  (`authorization.errorResendingConfirmationEmail`, new, both files). `color="main"` → `color="primary"`
  on both success buttons. Drop the two `console.log`s. Explicit `hideFullScreenLoading()` in each
  `catch` is optional — the snackbar does it — but writing it makes the view stop depending on a side
  effect of another composable, which is worth the one line.
- **Do not change:** `SnackbarComposable.ts:28`'s `|| 'Error'` fallback — a framework-wide default for
  callers that pass nothing, and the right fix there is a localized key in a batch of its own if it
  ever shows; here the caller stops passing a literal, which is the actual bug. Not the button colours
  `FW8` owns (`error` → `errorDark`) — if this batch lands first, leave `color="error"` and let `FW8`
  do it; if `FW8` lands first, do not undo it. Not the route-matching `API.post('/auth' + fullPath)`
  at `ConfirmEmailView.vue:50` — it forwards the mailed query string to the server as-is, which is the
  contract (`UserEmailSenderService.cs:52` builds `/confirm-email?userId=…&token=…`).
- **Verification:** `B4`'s and `B5`'s `Verify:` blocks: `/confirm-email` with no query → after the
  snackbar has gone, a sentence *and* a *Go to login page* button are on screen, **no** *Resend*
  button (no `userId`); `/confirm-email?userId=10001` with a bad token → sentence, *Resend*, *Go to
  login*; click *Resend* → `POST /api/auth/resend-confirmation-email/10001` (a real id, not
  `undefined`), and on failure a full sentence, not `Error`. `/confirm-email-change` with no query →
  sentence plus button. The `color="main"` fix has no local repro (needs a valid token) — a source
  read of the two lines is the check. Both locales.
- **Risk:** Low, two repos, visual. Every app on the framework gains a sentence and a button on two
  views most users see once.

## FW13. `RegistrationView` fails closed on an empty reCAPTCHA token — the one thing making local registration impossible — and its `catch` overwrites the server's message

- **Scope:** **[framework]** `src/_common/modules/user/view/RegistrationView.vue:41,46,131-170`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts`, `src/_common/composable/UseRecaptchaHandler.ts`
  (doc comment only) — submodule commit, then pointer bump
- **Closes:** `auth/O1` (**re-graded `opportunity` → `bug`**, §63), **`auth/P1`** (same file, below).
  **Unblocks** `auth/U1`, `auth/U5` and the enrollment half of `auth/U2` — see *Needs verification*.
- **Root cause:** The unit filed the Login/Registration disagreement as a policy question with two
  defensible answers. It is not, once the server is read. `AdhdTimeOrganizer/Program.cs:240-248`
  registers `LocalAlwaysPassRecaptchaService` whenever the test-seed gate is open — i.e. on exactly the
  machines this sweep runs on — and that class's own doc comment (`infrastructure/testSupport/LocalAlwaysPassRecaptchaService.cs:11-16`)
  states the assumption: *"A local developer has no v3 key pair, so the client sends an empty token
  and login fails …"*. `UseRecaptchaHandler.ts:63-77` says the same from this side: *"This is not a
  bypass. The token is verified server-side; an empty one fails there exactly as a forged one would."*
  Both sides have decided the server is the authority. `LoginView.vue:145` follows that decision;
  `RegistrationView.vue:136-140` does not — `if (!recaptchaToken) { showErrorSnackbar(…); return }`
  refuses to post, so on a machine where the server would accept the registration, the client
  declines it. That is the whole of why unit 15 could not complete a registration, could not reach
  the 2FA-enrolment branch (`U1`), could not see the login prefill (`U5`), and why unit 14 could not
  enrol 2FA either. Not a preference: a client-side check that contradicts the server's documented
  contract, with a measurable cost (three unverifiable findings across two units). Hence `bug`.

  **Adjacent, source-certain, same function:** the `catch` at `:166-169` is `handleHttpCodes(error.response?.status)`.
  The interceptor has already fired for that status *with the server's message* — `axiosConfig.ts:236-238`
  shows `serverMessage ?? httpErrors.conflict` for a 409 — and `handleHttpCodes` then calls
  `showErrorSnackbar` again with the status-only text, which `showSnackbar` (`SnackbarComposable.ts:47-55`)
  replaces the first with. So a duplicate address, which the server answers `409 "User already exists
  with this email."` (`BaseRegisterUserEndpoint.cs:74-80`), is shown to the user as *"This record was
  changed by someone else. Refresh the page and try again."* (`common.en.ts:15`); and a real reCAPTCHA
  failure, `403 "Recaptcha failed."` (`:66-72`), as *"You don't have permission to perform this
  action."*. Unobserved — no registration has been submitted locally — but there is no other path
  through those lines.
- **Files:** `RegistrationView.vue:41,46` (links), `:131-170` (submit); `user.{sk,en}.ts`;
  `UseRecaptchaHandler.ts:63-77` (add one sentence: callers must not gate on an empty token)
- **What to change:** Delete `:136-140` and assign the token unconditionally, as `LoginView` does.
  Replace the `catch` with `LoginView.vue:163-207`'s shape, or the smaller version it reduces to
  here: `_silent: true` on the request; `const status = error.response?.status; const generalErrors =
  error.response?.data?.errors?.generalErrors ?? []`; `409` → `showErrorSnackbar(t('authorization.emailAlreadyRegistered'))`
  (new key, both files — the server's English is not for the user); otherwise `generalErrors[0] ??
  handleHttpCodes(status ?? 0)`. Keep `hideFullScreenLoading()` where it is. **Folded in, same file:**
  `auth/P1` — add `target="_blank" rel="noopener"` to the two `RouterLink`s at `:41,46`; vue-router's
  click guard skips SPA navigation for a `_blank` target, so the legal page opens in a new tab and the
  half-filled form is untouched (the finding's own fix, confirmed against `RouterLink`'s `guardEvent`).
  The `authorization.recaptchaFailed` key stays — `LoginView` may want it for the server's 400 one day.
- **Do not change:** `UseRecaptchaHandler.ts`'s behaviour (resolve-to-empty is the documented,
  deliberate fix — 2026-09-13). Not the server. Not `open2FADialog` / the `recoveryCodes` handling at
  `:152-161` — that is `U1`, source-certain but rule 5 keeps it out until `FW13` makes it observable
  (the shape is written under *Needs verification*, six lines reusing `SecuritySection.vue:269-281`).
  Not the app-side `googleCalendar` or `user` glue.
- **Verification:** `O1`'s evidence, inverted: on the seeded local API, fill `/registration` with a
  throwaway address, both passwords, tick terms, submit → `POST /api/auth/register` **fires** (today it
  does not) and returns 200 → `/login` with the e-mail prefilled and the resend panel shown — which is
  `U5`'s verify block for free. Then submit again with the **same** address → 409 → snackbar
  *"An account with this e-mail already exists"* (or whatever the key says), **not** *"changed by
  someone else"*. `P1`: type an e-mail, click *Terms and conditions* → a new tab; the registration
  tab's field still holds the value. Reseed afterwards (`POST /api/test/seed`) — a new account is a
  mutation. Promote the draft spec's `fixme` at `e2e/tests/auth.draft.spec.ts:91` (`P1`); the one at
  `:104` (`U1`) becomes runnable here but is `FW14`'s to promote, and `:97` (`B2`) is `FW7`'s.
- **Risk:** Low, two repos, and it is a *loosening* on the client only: on any deployment with the real
  verifier, an empty token is still refused — by the server, with a 403 this batch now words
  correctly. The `_blank` links are a behaviour change for every app's registration page; a host that
  wants same-tab legal pages has no override, which is acceptable for two links whose whole problem
  was being same-tab.

## FW15. `MyDateInput` binds `$attrs` first, so every caller's `label` (and `hideDetails`) is discarded

- **Scope:** **[framework]** `src/_common/component/dateTime/MyDateInput.vue:10-16` — submodule commit,
  then pointer bump; **the pointer-bump commit must also fix one draft assertion** (below)
- **Closes:** `planner-day/B2`, and the unfiled twin unit 3 recorded as fact
  (`history-review/inventory.md:20`, `textbox "Date"` on the summary's *From* field)
- **Root cause:** Confirmed by direct read, and the finding's mechanism is exactly right. The component
  is `inheritAttrs: false` and spreads `v-bind="$attrs"` at `:11`, **then** binds `:label="$t('dateTime.date')"`
  at `:13` and a bare `hideDetails` at `:14`. Vue 3 merges bindings in template order, later wins, so a
  caller's `label` in `$attrs` is overridden by the generic one every time — and a caller's
  `:hideDetails="false"` likewise, which is the gap `HistoryDateRangeSelector.vue:31-32` already works
  around with a comment (*"MyDateInput hardcodes `hideDetails`, so the message cannot live under the
  field itself without a framework change"*). **Three call sites pass a label the user never sees**,
  not one: `CopyDayForm.vue:5` (*"Source date"* → "Date", the finding), and
  `HistoryDateRangeSelector.vue:17,25` (*"From"* / *"To"* → both "Date" — in custom-range mode two
  identically-named date fields side by side). `HistoryDetailView.vue:57` passes `dateTime.date` and
  is unaffected by accident. The same order also makes the component's `style` at `:15` win over
  `PlannerTaskDialog.vue:26`'s 200 px — style objects merge later-wins per key — so that dialog's
  width override is dead too; adjacent, unobserved, same one-line fix.
- **Files:** `MyDateInput.vue:10-16`; `src/_common/docs/components.md` if it documents the props
- **What to change:** Move `v-bind="$attrs"` to be the **last** binding on `<VDateInput>` — the
  finding's first option — so the explicit `:label`, `hideDetails` and `style` become defaults a
  caller can override. That is the whole fix and it is generic. Do **not** take the finding's second
  option (a `label` prop defaulting to `$t(…)`) unless the pass-through of `hideDetails` is also made
  a prop — half a fix leaves the comment at `HistoryDateRangeSelector.vue:31` true.
- **Do not change:** the chevrons (`FW2`); `dateShowArrows` / `density` props; the 150 px width as a
  default.
- **Verification:** `B2`'s `Verify:` block — the Copy Day dialog's field reads *"Source date"*; then
  `/activity-history` with *Range length* = *Custom range*: the two fields read *From* and *To*. Then
  **fix `e2e/tests/history-review.draft.spec.ts:28`** in the pointer-bump commit — it asserts
  `getByRole('textbox', { name: 'Date' })` on the summary header, which is the defect pinned as expected
  behaviour and will fail correctly the moment this lands; it should read `{ name: 'From' }`. Both
  locales.
- **Risk:** Low. Every `MyDateInput` in every app on the framework starts honouring attrs it silently
  dropped — a consumer that passed a `label` and then relied on "Date" rendering is not a real case.

## FW16. `CalendarGrid`'s "Days to show" and `DateRangePicker`'s mode/range configuration are private — expose them as optional models

- **Scope:** **[framework]** `src/_common/component/calendar/CalendarGrid.vue:21-30,166-167`,
  `src/_common/component/dateTime/DateRangePicker.vue:109-152` — submodule commit, then pointer bump
  (the bump carries `F44`)
- **Closes:** `planner-day/B3` (framework half)
- **Root cause:** The finding's expectation is sourced (P7, CLAUDE.md *URL State*) and its suggested
  fix is impossible where it points: `dayVisibility` is `ref<DayVisibility>('all')` at
  `CalendarGrid.vue:167`, bound to the toolbar `VSelect` and read by `visibleDayHeaders` — not a prop,
  not a model, not in `defineExpose` (`:283` exposes `dateRange` only). `DateRangePicker` takes `mode`
  as a one-way **prop** (`:111`, watched into a private `selectedMode` at `:130-137`) and holds the
  Duration fields (`:149-152`) and Range fields (`:140-141`) privately; only the *resolved*
  `{ start, end }` comes out as the model, and pushing a range back in is coerced to the current mode
  (`:261-275`). `CalendarGrid` passes `:mode="dateRangeMode"` (`:18`) and exposes nothing of the picker.
  So no consumer can round-trip what the toolbar shows — and both consumers noticed: unit 7 filed it,
  unit 3 recorded the identical gap on `/activity-history/calendar` and declined to file
  (`history-review/inventory.md:100-104`).
- **Not a default change (rule 4 does not apply)** — this is an additive API; every existing consumer
  keeps today's behaviour when it binds nothing. It is still its own batch because it is a framework
  API decision, and the shape is the fixer's call within these constraints:
- **What to change:** (1) `CalendarGrid`: `dayVisibility` becomes `defineModel<'all' | 'workdays' |
  'weekend'>('dayVisibility', { default: 'all' })`. (2) `DateRangePicker`: `mode` becomes a model
  (`defineModel<'range' | 'month' | 'duration'>('mode', { default: 'month' })` — a plain `:mode` prop
  keeps working, so `ActivityRangePicker.vue:32` and `CalendarGrid.vue:16-20` are untouched) and the
  configuration becomes one optional model, e.g. `v-model:rangeConfig` of
  `{ anchor, anchorDate, unit, quantity, rangeStart, rangeEnd }` (or two, split by mode — either is
  fine; one object is fewer bindings to forward). (3) `CalendarGrid` forwards both through to the picker
  (`v-model:dateRangeMode` replacing the prop, `v-model:rangeConfig`). Keep the internal `ref`s as the
  fallback when nothing is bound. Document all three in `src/_common/docs/components.md` in the same
  commit — the `CalendarGrid` entry is the one `FW6` also edits.
- **Do not change:** the `dateRangeChange` emit or `dateRange` expose — `PlannerCalendarView.vue:233`
  writes the latter during hydration and `F44` keeps doing so for month mode. Not the month/year
  sub-model (`MonthYearPicker` already has `v-model:month`/`v-model:year`; the month is covered by the
  existing `?month=` codec). Not the cell markup (`FW6`) or the arrows (`FW2`) — three batches touch
  this file family; sequence them or fold them into one submodule commit that names all three.
- **Verification:** No user-visible change on its own. In the pointer-bump commit `F44` binds the
  models; its verification is the observable one. Framework-side: `HistoryCalendarView` and
  `ActivityRangePicker` render and behave exactly as before with nothing bound — `Days to show` still
  filters columns, `Mode` still switches, the 31-day cap (`maxDays`) still validates.
- **Risk:** Medium only in surface — three components' props change shape (prop → model is
  backward-compatible in Vue 3.4+ `defineModel`, but a consumer in another app that *mutates* the
  `mode` prop from outside and expects the watcher at `:132-137` to re-seed the private ref should be
  checked). Two repos, two commits.

## FW17. `ActionBar` is centred on the viewport, not the content box — *Delete* is un-clickable under the nav drawer

- **Scope:** **[framework]** `src/_common/component/ActionBar.vue:35-41,52-59` — submodule commit, then
  pointer bump; CSS only
- **Closes:** nothing filed — and that is the point. The defect was **known before the sweep**
  (`e2e/tests/dayPlanner.spec.ts:203-224`, a 22-line comment on two `test.fixme`d specs that click
  *Delete*), was handed to unit 7 as brief item 2 (*"OPEN, NOT FIXED … needs the owner's call"*), was
  **re-confirmed live** by the unit (`planner-day/inventory.md:144`, *"re-confirmed visually at this
  viewport width — not re-filed as a new finding"*), and appears in no queue. A finding that three
  documents agree on and none owns is the thing a triage exists to catch. Evidence is observed, twice;
  it is batched.
- **Root cause:** Confirmed by direct read. `.action-bar` is `position: fixed; bottom: 20px; left: 50%;
  transform: translateX(-50%); z-index: 50` (`ActionBar.vue:36-41`). `left: 50%` on a fixed element is
  50 % of the **viewport**; Vuetify insets `.v-main` by the drawer's width through
  `padding-left: var(--v-layout-left)` (`VMain.css:5`), so the bar sits ~144 px left of the content's
  centre with the drawer expanded, and its leftmost action — the planner's *Delete* — ends under the
  drawer, whose inline `z-index` is `1000 + …` from the layout composable (`composables/layout.js:7,200-209`)
  and outranks `50`. Pointer events go to the drawer.
  Five consumers, all in `dayPlanner` (`SelectionActionBar`, `BulkSelectActionBar`,
  `ApplyTemplateActionBar`, `UseTemplateActionBar`, `DayPlanner.vue`); any other app on the framework
  with a permanent drawer has the same offset. Playwright's `toBeVisible()` passes on the occluded button
  (layout, not occlusion), which is why the presence specs pass and only the two click specs fail — the
  spec comment says so, and it is worth keeping.
- **What to change:** Centre on the content box without JavaScript: Vuetify writes
  `--v-layout-left` / `--v-layout-right` onto `.v-layout` (`composables/layout.js:144-145`), and the bar
  is a descendant, so `left: calc(50% + (var(--v-layout-left, 0px) - var(--v-layout-right, 0px)) / 2)`
  keeps `translateX(-50%)` and the two transition rules (`:52-59`) untouched and follows the rail
  toggle for free. The fallbacks keep the current behaviour in an app with no `.v-layout` ancestor
  (rule: default to today when nothing is registered). Alternatively raise `z-index` above the drawer
  — **rejected**: it would draw the bar over the drawer instead of beside the content, and the drawer's
  own overlay is deliberately higher than page chrome.
- **Do not change:** the mobile `@media (max-width: 600px)` block (the drawer is temporary there and
  `--v-layout-left` is `0px`); not `useActionBarFocusReturn` / `migration-revision.md` §11 — that is
  the bar's *focus* ask, a separate framework item.
- **Verification:** Un-`fixme` the two click specs in `e2e/tests/dayPlanner.spec.ts` and run them at
  the suite's 1280×720; then by eye on `/day-planner/<today>` with the sidebar expanded **and** rail:
  the bar is centred in the white area both times and every action is clickable. `_shell`'s rail
  toggle is the control to flip. `playwright-cli` can prove occlusion the way the spec cannot:
  `document.elementFromPoint(x, y)` at the *Delete* button's centre must be the button, not
  `.v-navigation-drawer`.
- **Risk:** Low — one `left` declaration — but it ships to every app on the framework that mounts an
  `ActionBar`, and an app whose `.v-layout` has a *right* drawer moves the bar the other way, which is
  correct and worth saying in the commit message.

---

## Escalations (backend / outside this repo)

1. **Notification titles and bodies ignore the account locale** — `_shell/B1`. Still open, and **now
   confirmed on real data (2026-09-13)**. ~~Not re-testable on the current seed (zero notifications).~~ That
   was true of `e2e-v1`; the fixture now seeds six notifications across six kinds, and signed in as
   `primaryUser` — whose `locale` is **`EN`** — `/notifikacie` renders every title and body in **Slovak**:
   *"Blíži sa termín"*, *"Pripomienky"*, *"Obdobie sa čoskoro končí"*, *"Sústredenie skončilo"*. Only the
   fixture's own *"Testovacia notifikácia"* carries an English body, and its title is Slovak too.
   So this escalation rests on observed behaviour for the first time, not inference. Text is localized
   server-side at dispatch, so no `src/` change can fix it. The ask: resolve notification text
   against the recipient's locale preference at dispatch, or send a key + params and let the client resolve it.

2. **✅ RESOLVED 2026-09-13 (unit 10, round 4 — API source read) — it does not cascade; the delete is
   refused.** ~~Does deleting a routine time period cascade, and to what?~~ `RoutineTimePeriodConfiguration.cs:78-81`
   is `DeleteBehavior.Restrict` on `RoutineTodoListColl`; only `RoutinePeriodCompletion` cascades (its own
   history rows, nothing user-authored). The FK violation maps to a **409** (`DatabaseExceptionUtils.cs:26`
   → `EndpointHelper.cs:14`), pinned by `TodoListDeleteBehaviorTests.DeleteRoutineTimePeriod_WithItems_Returns409`.
   So CLAUDE.md's cascade rule does not apply and `BasicTable`'s inability to state a child count is moot
   *here* (the bypass of `useDeleteConfirmation` is still real, still framework, still a `FW` decision
   for a table whose delete *does* cascade — none found yet). What it left behind is the **message**: that
   409 rendered as *"changed by someone else — refresh"*, filed and fixed as `todo-routine/B9`, which is
   the one `todo-routine` item still awaiting a browser (*Needs verification*).

3. **✅ RE-SCOPED 2026-09-13 (same round) — a bounded design question, now a written ask, blocking
   nothing.** ~~A done-toggle advances `streak`/`lastCompletedAt` irreversibly, with no undo path.~~ Read
   against `RoutineResetService.UpdateItemStreak`: the increment is **once per cycle**, guarded by
   `AlreadyCountedThisCycle` and pinned by two tests, so repeated clicking cannot compound; `LastCompletedAt`
   moving is deliberate; the period-level streak is evaluated at reset from live state, so un-ticking
   before rollover costs nothing there. The irreversible part is exactly **+1 on one item, once**. Whether
   un-ticking inside the same cycle should give it back is
   `prompts/view-docs/backend/B9-routine-untick-streak-decision.md` (a decision, not a defect — not to be
   confused with finding `B9`). The client cannot act on it either way: streak fields are server-owned.

4. **✅ RESOLVED 2026-09-13 — the `activity` contract is settled; what remains is a client-side parse bug.**
   `prompts/view-docs/backend/_done/B6-profile-grid-activity-name.md` (now in `_done/`) carries the full
   answer. All three questions this entry raised are closed:
   - `activity.role.icon` / `activity.role.color` **is** the intended home — nested, not flattened. `category`
     is the same shape and is **nullable**. So **`F3`'s fallback is the permanent fix, not a shim**, and its
     direction is the server's own: `category?.icon ?? role.icon`, `category?.color ?? role.color`.
   - **All four grids agree.** Every one derives from `WithActivityResponse` and carries a full
     `ActivityResponse`, on both `…/grid` and `…/{id}`.
   - **`activity` does *not* carry `categoryName`.** Use `activity.category?.name ?? null`. The flat
     `{id, name, categoryName, icon, color}` shape still exists, but only on `/leisure/suggestion/draw`
     (`/leisure/pick`) — two different shapes under the same key, by route.

   **The client half is now fixed too (2026-09-13) — see `F3`.** `ActivityInfo.fromJson` reads the flat
   fields first and falls back to `category ?? role`, so it parses the grid shape and the draw shape with one
   code path. Still true and still worth heeding: `usageCount`, `canDelete` and `isOnTodoList` are
   structurally present on the nested activity but **left at their defaults** — do not read them off these
   rows.

   One behavioural consequence worth not designing against: an **archived** activity removes the row entirely
   from the three `Activity*Profile` grids (count included), while `memory-anchor` deliberately keeps its row
   and name. There is no such thing as a row with a blank or missing `activity`; treat one as a bug.

5. **✅ RESOLVED 2026-09-13 — `B7` answered in full; it leaves three client-side items, all in `src/`.**
   `prompts/view-docs/backend/_done/B7-grid-sort-key-audit.md`. §1 was fixed **by shape rather than by a
   remap** — `activity.name` resolves natively on all four profile grids, so the *Activity* header click on
   `memory-anchor/grid` no longer 500s, and the `activity.name → activityName` remaps were **deleted**
   (safe: bookmarked `?sortBy=activity.name:asc` URLs carry the key that now resolves natively). What lands
   on this side:
   - ✅ **FIXED 2026-09-13 — `BacklogTable.vue:11`.** Now `deleteConfirmationColumn="activity.name"`. This
     needed a **framework** change to work at all: `BasicTable.vue:211` indexed the row flat, so it resolves
     through `getNestedValue` now. Dotless keys are unaffected. See `F3`.
   - ✅ **Already satisfied — error handling distinguishes `400` from `500`.**
     `ErrorHandlingFunctions.ts:11` has had its own `case 400` all along, separate from `case 500`, so an
     unresolvable sort key (`InvalidSortKeyException` → `InvalidSortKeyMiddleware`) surfaces a snackbar rather
     than the old false empty state. **No change was needed**; verified by reading the switch, not in a
     browser.
   - ⏳ **Latent, no action taken: if a lookup column is ever made sortable, send `locationType.text`, not
     `locationType`.** None is currently sortable, so nothing to change today — this is a trap for the next
     person who makes one sortable.

     ⚠️ **And it is a worse trap than the API's reply implies.** Probed against the running API
     2026-09-13 on `activity-backlog-profile/grid`: `zzzNotAColumn` → **400** naming the key;
     **`locationType` → 500** (`errorId be94ee6d327f`); `locationType.text` → **200**. So the
     "unresolvable keys are 400 now" fix covers *unrecognised* keys only, **not keys that resolve to a
     non-scalar member** — which is precisely what a real column definition would emit. That case is still
     an opaque 500 behind a false empty state.

     **Re-probed and confirmed at the B2 close-out (2026-09-13, after the deploy):** `locationType` →
     **500** `errorId 13ae656a28ee`, `activity` → **500** `errorId 28962860a3af`, while `locationType.text`
     and `activity.name` → **200** and `energyDemandId` (a field present in every row but not sortable) →
     **400**. So this is not "B2's class is narrower than reported" — B2 *is* fixed for the class it names.
     This is a **second, distinct unhandled 500**, and B2's close-out reply names it in advance: *"If you see
     `errorId` in a body, that is still an unhandled 500 and is a different bug — report it."* Still not
     filed as a new ask here (the close-out runbook reserves that for the surface owner), but it is now an
     invited one, and this paragraph is the evidence to paste into it.

   Two smaller notes for whoever writes the specs: `activity` is **nullable** on the two tracker mapping
   grids, so an `activity.text` sort puts those rows nulls-last ascending / nulls-first descending — correct,
   not a bug. And the API flagged an **honest test gap**: its integration tests pin `periodKey` only as the
   sole sort key, so the multi-key splice (`[{rating,desc},{periodKey,desc}]` must order by rating first) is
   right by construction but unasserted. B7 §4's two-click combinations are the cheapest place to catch a
   regression, which makes this an **e2e ask on our side**, not a backend one.

6. **The activities grid filter's id fields have never matched between client and server** —
   `activity-settings/B1`. **Not** "the backend ignores `roleIds`/`categoryIds`", which is how the
   finding reads: those fields do not exist on the wire. Read at the source this pass:
   `ActivityFilterRequest.cs:27-28` declares **`RoleId: long?`** and **`CategoryId: long?`** —
   singular scalars — and `GridActivityEndpoint.cs:129-133` filters on them with `==`. The client has
   sent **`roleIds: number[]`** / **`categoryIds: number[]`** since at least the August module
   restructure (`git log -S roleIds` bottoms out at `540f9529`, 2026-08-07, with the list shape already
   in place), and no commit on either side has ever carried the other's name. System.Text.Json drops
   unknown members silently, so every id-filtered request has always returned the unfiltered list with
   a 200 and nothing anywhere said so. `A1-correctness-sweep.md` item 5 fixed the *binding* (the
   combobox now reaches the request body — the finding confirms that) and verified the request, never
   the rows.

   **This is a contract decision, not a one-side fix**, and the client cannot make it alone without a
   UI regression: the filter is a multi-select combobox with chips, and the URL state already carries
   comma-joined lists (`activitySettingsUrlParams.ts:67,69`), so narrowing the client to one id means
   changing the control, the param names and the bookmarks. **The ask:** add `RoleIds: long[]?` and
   `CategoryIds: long[]?` to `ActivityFilterRequest` and filter with `Contains` — two `Where` clauses,
   with the singular fields kept (or dropped, nothing on this side sends them). Then an integration test
   that pins the filter *field names*, since the failure mode here is a silent 200 and no test on either
   side could have caught it. Until it lands, `F18` should still be applied — it fixes what the client
   *sends*; this is about what the server *reads*.

7. **Client side closed 2026-09-14; the ask itself stays open, and is smaller than written.** Two corrections
   from the API source: `Text` is unique per account as well (`RoutineTimePeriodConfiguration.cs:13`), and
   **the bare 409 is a pinned contract** — `RoutineTimePeriodUniqueIndexTests` asserts `Conflict` for both
   indexes, so the first ask below (validate → 400) means changing that contract and those tests, which is a
   backend decision, not a client one. The client no longer needs it: `TimePeriodForm` validates name and
   length against the account's list before submitting (`e39c01c1`) and words the race-only 409 correctly
   (`todo-routine/B11`). What is still worth asking for is only the **second** bullet — the error *type* in
   the 409 body — and it is now a nicety for the framework interceptor, blocking nothing.

   **A time period's `lengthInDays` is unique per account, and the API says so as a bare 409 from the
   database index** — `todo-routine` round 5, found in passing while setting up `B9`'s retest. Confirmed
   at the source this pass: `RoutineTimePeriodConfiguration.cs:79` is
   `HasIndex(t => new { t.UserId, t.LengthInDays }).IsUnique()`, so a second 7-day or 30-day period is
   refused — round 5 hit it twice, body *"Unique constraint violation during Create"*, status 409. The
   client cannot tell that 409 from the concurrency one or from `B9`'s referential one:
   `ErrorHandlingFunctions.ts:23-25` switches on status alone and the body is never read, so the user is
   told *"This record was changed by someone else. Refresh the page and try again."* — and `TimePeriodForm`
   has already closed (`openAddDialog` awaits `openDialog` *then* calls `createWithResponse`,
   `RoutineSettingsView.vue:134-143`), so the typed form is gone with it. Two asks, in order of value:
   - **Validate it, don't let the index throw.** The endpoint already returns a 400 naming the field for
     other rule violations (`{"timePeriodId":["Time period not found."]}` is what round 5 saw on the item
     create), so a `lengthInDays` uniqueness check in the validator would surface as a normal field error
     the form can render inline, with the dialog still open. That is the same shape the create validator
     uses today, and it makes the client fix trivial.
   - **Carry the error *type* in the 409 body**, which is `B9`'s own "worth raising upstream" note: the
     server distinguishes `DbConcurrencyError` from `DbForeignKeyError` from `DbUniqueViolationError`
     (`DatabaseExceptionUtils.cs:16,25,27`) and flattens all three to a status code at the boundary. With the type on the wire, the framework's
     interceptor could word each correctly once, and `B9`'s per-call-site `_silent` pattern would not need
     copying to every endpoint that can answer 409 for a non-concurrency reason. This one is a framework
     change on the client side too (`ErrorHandlingFunctions.ts`), so it is a two-repo ask.
   The client-side half — what to do at this call site until either lands — is under *Needs verification*
   below, because the message on screen has not actually been observed; only the 409 has.

8. **Public-holiday names are a country table's proper nouns, stored as strings at row creation — there is
   no locale to key on, and no country preference to omit them by** — `history-review/B4`, re-graded
   `bug` → `polish` (*Contradictions* §30). Read at the source this pass: `CalendarDayFactory.cs:37` writes
   `HolidayName = HolidayCalendar.ForDate(date, countryCode)` when a `Calendar` row is created (seeder or
   lazy provisioner — both go through it), and `HolidayCalendar.cs:31-56` is a **Slovak** table of native
   names (`"Deň Ústavy Slovenskej republiky"`, `"Sedembolestná Panna Mária"`), with a Czech sibling
   (`:58-81`) and `DefaultCountryCode = "SK"` — *"the only country this app has ever seeded"* (`:11-12`).
   The column is `string?`, max 200 (`CalendarConfiguration.cs:20`); the History endpoint projects it
   as-is (`CalendarActivityEndpoint.cs:95`). So this is **not** the shell's `B1` shape (app text
   resolved in the wrong locale at dispatch) and should not be batched with it: the string is the
   holiday's *name*, in the language of the country whose holiday it is, and there is no English
   variant anywhere to have chosen instead. An EN-locale user in Slovakia arguably *should* see
   "Sedembolestná Panna Mária" — that is what the day is called. The finding's other pass condition
   (*"omitted for accounts outside Slovakia"*) has nothing to read: `User` carries no country, and
   `HolidayCalendar` is only ever called with the default.

   **The ask, if one is wanted, is a design decision with two halves and the client cannot take either
   alone:**
   - **A country preference** (`/user/preferences` — it describes the person, CLAUDE.md's ownership
     table) that `CalendarDayFactory` reads instead of the constant. Without it the "outside Slovakia"
     branch cannot exist. Note the re-materialisation problem: rows are created once, so a country
     change would need a backfill or the holiday column would need to become a *lookup* at read time
     (`HolidayCalendar.ForDate` is cheap and pure, so that is viable).
   - **If localized names are wanted at all**, store a stable key per holiday (`SK_CONSTITUTION_DAY`) and
     let each client resolve it through vue-i18n — the same *"send a key + params"* shape §1 asks for
     notifications. Native-name rendering is a defensible default and costs nothing; it just has to be a
     decision rather than an accident of `DefaultCountryCode`.
   Not blocking any unit. `CalendarGrid.vue:104` renders whatever arrives and needs no change either way.

   **Seen a second time from the other consumer (tenth pass) — `planner-day/B4`, merged here.** Unit 7
   read the same two strings off `POST /api/calendar/filter` on `/day-planner` (*"Deň Ústavy Slovenskej
   republiky"* on 2026-09-01, *"Sedembolestná Panna Mária"* on 2026-09-15) and filed them as `bug` with
   the same guess unit 3 made — *"batch with shell B1 in a backend localization session"*. Same
   re-grade, same reason: `bug` → `polish` (§30), not batched with §1, because the string is a proper
   noun with no locale to key on, not app text resolved in the wrong locale. Nothing new for the ask;
   the second observation just confirms both consumers render the column as-is. The finding's
   suggested fix (*"return a stable holiday key the frontend can map through vue-i18n"*) is the second
   bullet above, already written. `planner-day.draft.spec.ts:48` is a `fixme` on this and should stay
   one until the decision is taken — it is not a regression test for a defect, it is a placeholder for
   a policy.

9. **The Google Calendar OAuth flow cannot complete against this API, for three separate server-side
   reasons — and only the first is the one the unit saw** — `user-settings/B1`. The unit's evidence is
   exact (`GET …/auth-url` → 200, then Google's *"Missing required parameter: client_id"*) and its guess
   (*"a missing OAuth client ID in this dev environment"*) is right, but it is the first of three, and
   fixing it alone moves the failure one step later. Read at the source this pass, in the order a user
   would hit them:

   1. **The client id is empty, and the endpoint knows it and returns 200 anyway.**
      `AdhdTimeOrganizer/appsettings.json:19-23` is `"GoogleCalendar": { "ClientId": "", "ClientSecret": "",
      "RedirectUri": "http://localhost:5173/google-calendar/callback" }`; `appsettings.Development.json`
      carries no `GoogleCalendar` key (searched every `appsettings*.json`), so unless user-secrets fill it
      in — and the observed URL says they do not — `GoogleCalendarService.GetAuthUrl` (`:40-54`) builds
      `?client_id=&redirect_uri=…` from `Uri.EscapeDataString("")` and `GetGoogleCalendarAuthUrlEndpoint`
      sends it as a 200. **Two asks:** configure the id/secret for the dev environment (they have to be
      registered in the Google console against the redirect URI below, so this is not a one-line edit);
      and **refuse to hand out a URL that cannot work** — when `ClientId` is empty, answer a
      `503`/`notConfigured` (or expose `configured: false` on `GET …/status`) so the client can render
      *"not available here"* and hide *Connect*, instead of shipping the user to Google's error page. Note
      the adjacent trap: if the key were *absent* rather than empty, `Uri.EscapeDataString(null!)` throws
      and this is a 500 with an `errorId` — the empty string is what makes it a silent 200.
   2. **The redirect URI points at port 5173 over `http`.** The dev server is `https://localhost:3000`
      (`.env.development` `VITE_APP_URL`; CLAUDE.md's *Browser verification*), so once step 1 is
      configured Google will send the user, code in hand, to a port nothing listens on. It must match
      `VITE_APP_URL` + `/google-calendar/callback` **and** be registered in the console — Google rejects
      an unregistered `redirect_uri` with its own error page, which would read as a fourth bug.
   3. **The state cookie is set on a path the connect route can never match.** `GetGoogleCalendarAuthUrlEndpoint`
      appends `google-oauth-state` with `Path = "/user/google-calendar"` (`Secure`, `HttpOnly`,
      `SameSite=Strict`, 10 min), and `ConnectGoogleCalendarEndpoint` deletes it with the same path — but
      `Program.cs:622` sets `config.Endpoints.RoutePrefix = "api"`, so the browser's request is
      `POST /api/user/google-calendar/connect`, and a cookie scoped to `/user/google-calendar` is **not
      sent** to a path that does not start with it. `hasStateCookie` is therefore always `false` from a
      real browser and every connect is the *"OAuth state is missing or does not match"* 400. The API's
      own suite passes because `GoogleCalendarConnectionTests.cs:88-96` writes the `Cookie` header **by
      hand** — it never exercises path matching. Ask: `Path = "/api/user/google-calendar"` (derived from
      the prefix, not a second literal), and one test that round-trips through a `CookieContainer` so the
      path is actually matched. One more thing to confirm while there: `SameSite=Strict` is fine in dev
      (`localhost:3000` → `localhost:8080` is one site; ports do not count) — in production the app and
      API origins must share a registrable domain or the cookie will not ride the POST at all.

   **Order matters:** 1 makes *Connect* reach Google; 2 makes Google come back; 3 makes the return leg
   pass the state check; and **`F33` on this side must land before 3 can be verified**, because the
   client currently omits `state` from the body entirely. None of this blocks a unit — the
   `GoogleCalendarCallbackView` success path and the whole `googleCalendar` module's sync leg
   (`POST /calendar/{id}/sync-to-google`) stay unverifiable until all four land, which the unit's
   `usecase.md` already records. **Do not write a backend prompt file for this** (the implementer does —
   the convention is in `prompts/_done/user/backend/README.md`, and the finished asks sit in
   `prompts/view-docs/backend/_done/`); this paragraph is the evidence to paste into it.

10. **The four pie-chart endpoints emit their tail bucket as a literal `"Other"` row; the four
    stacked-bars endpoints emit `"_other"` — and the client only understands the second.**
    Source-certain, **unobserved** (found reading `B2`'s data path in the eleventh pass; the unit did
    not file it and the seed may have no sub-1 % slice to show it). `WebExtensionPieChartEndpoint.cs:88`
    (`Domain = "Other"`), `DesktopPieChartEndpoint.cs:81-82` (`ProcessName`/`ProductName = "Other"`),
    `AndroidPieChartEndpoint.cs:79-80` (`PackageName`/`AppLabel = "Other"`),
    `UnifiedPieChartEndpoint.cs:21` (`OtherLabel = "Other"`) — versus `WebExtensionStackedBarsEndpoint.cs:81`,
    `DesktopStackedBarsEndpoint.cs:77-78`, `AndroidStackedBarsEndpoint.cs:113-114`, all `"_other"`.
    Every dashboard sends `minPercent: 1` (`ActivityDashboard.vue:149`, `DesktopActivityDashboard.vue:180`,
    `AndroidActivityDashboard.vue:170`), so the row is produced whenever anything falls under 1 %.
    On the client, `ActivityPieChart.vue:62,96,144,150` recognises **only `_other`** — translates it
    (`activityTracking.common.other`), and refuses to select it. The literal `"Other"` is therefore
    (a) an untranslated English legend entry in SK, (b) a selectable slice — `?selected=Other`, a
    desktop `process-details?processName=Other` request, and after `F47` an Android panel titled
    *Other* — and (c) on the web dashboard, where `ActivityPieChartSection.vue:119-140` *also* buckets
    below 3 % client-side into `_other`, potentially **two "Other" legend entries** when the server's
    bucket sums to ≥ 3 %. The ask: emit `_other` from the pie endpoints as the stacked-bars ones already
    do (one constant, four files), so the sentinel is one contract. The client-side alternative — stop
    sending `minPercent` and bucket locally on all four sections the way the web one does — is more
    code for the same result and leaves the server's `MinPercent` branch dead; not recommended, but
    it is app-side if the backend declines. **What would settle whether it is live today:** `playwright-cli
    route "**/api/activity-tracking/android/pie-chart"` with a fulfilled body carrying one `"Other"` row,
    then read the legend and click the slice — or a seed app under 1 % of the span. Until then, `F47`
    guards the row locally (its *What to change*), which is a shim to remove when this lands.

## Needs verification (unverified findings, and what would settle each)

### Awaiting retest — code-fixed this cycle, never seen in a browser

Not a fix batch and not a defect list: these need one browser session running the named `Verify:` blocks.
**Rewritten in the fifth pass against `todo-routine`'s round 5** (2026-09-13, live, fresh `e2e-v3` seed):
five of the eight rows are closed, and what is left is two half-checks and one finding that has never
been seen in either direction.

| finding | what landed | round-5 outcome |
| --- | --- | --- |
| `todo-routine/A1` | counter carries `:title`/`:aria-label` on both branches; native `<button>` (`todo-lists/B6`) | ✅ **verified.** Real `mousemove` → 1 s dwell → `elementFromPoint` → `mousedown`/`mouseup` on both controls: *Increase 0 of 2* hit its `<button class="counter-increment">` and produced 1/2 (`PATCH …/toggle-is-done {forceValue:true}` → 204, no dialog); *Decrease 1 of 2* resolved to the decrease button on two separate items. The "mouse can decrement but never increment" hypothesis is dead against this build |
| `todo-routine/B3` | `RoutineToDoListForm.vue:28` → `routineTodoList.timePeriod` | ✅ **verified** — label *Time period*, console clean across the open |
| `todo-routine/B4` | `/routine-settings` + `TimePeriodForm` localized; `useAnchorDayOptions()`; `Intl.PluralRules` ordinal | ✅ **verified in SK** — *Časové úseky*, *PRIDAŤ*, all headers, *Pondelok* in the anchor column; ordinal `1` → "1." (SK) and `1`/`21` → "1st"/"21st" (EN). **One header stayed English — "Color" — and that is `F25`**, a different cause (empty title, not a literal) |
| `todo-routine/B6` | `routineTodoList.streakTooltip` / `.gracePeriodActive` | ✅ **verified in SK** — *"Séria: 12 · najdlhšia: 30"* read off the teleported tooltip. Undo-tooltip half not re-hovered; its label is the same computed `A3` verified |
| `todo-routine/A3` | `TodoListUndoBtn.vue:12` `:aria-label="label"` | ✅ **verified** — `aria-label: "Nothing to undo"` on the disabled button; enabled-state wording not exercised |
| `todo-routine/P1` | fixed `:width`/`maxWidth` replaced by a `minWidth` floor | ✅ **SK verified (round 7, 2026-09-14)** — *Celkový počet* in full, label `scrollWidth 101 === clientWidth 101` in a 377 px field. Both locales closed |
| `todo-routine/A2` | `BaseTodoListItemSteps.vue:11-13` `:title`/`:aria-label`/`:aria-expanded` | ✅ **verified (round 7)** on a temporary two-step Daily item: `Hide: Steps` / `aria-expanded=true` → click → `Show: Steps` / `false`, step list gone. Item deleted afterwards |
| `todo-routine/B9` | `RoutineSettingsView.vue:163-201` — `_silent` 409 → `deleteBlocked` / `deleteBlockedUnknownCount`, count fetched only in the failure path, row kept | ✅ **verified (round 7, 2026-09-14, exclusive account)** exactly as the runbook here prescribes: 11-day period + one item → Confirm → `DELETE …/17` **409**, snackbar *"Can't delete "RT eleven" — 1 routine is still assigned to it. Move or delete it first."*, row kept, count fetched in the failure path. Item removed → Confirm → **204**, row gone. Throwaway rows cleaned up. **And the dialog check it was merged with came back positive — see the section below** |
| *(unfiled)* | `TodoListStepsFormField.vue`'s four step controls now named, position-qualified | ✅ **swept (round 7)** — Add dialog with two steps: *Move step 1 up/down*, *Delete step 1*, *Move step 2 up/down*, *Delete step 2*, *Add step*; **0 unnamed** buttons in the dialog |
| `todo-lists/B3` | ✅ **fixed for real 2026-09-13** — it was *not* fixed silently: the round-2 edit moved the emit above the multi-count branch, so a row-body click on a counted item still stepped the counter *and* opened the dialog | closed; `Status:` line corrected; spec pins it |
| `todo-routine/B10` (`F24`) | **applied in the working tree, uncommitted** (sixth pass, source-verified): `composable/useRoutineDateFormat.ts` is untracked and imported by all five files; `grep toLocaleDateString(undefined` across `src/core/todoList/` hits only the helper itself | ⏳ **not seen in a browser.** Run `F24`'s *Verification* verbatim — SK weekday/month forms on all three cards, the heatmap tooltip, the history dialog, the freeze chip, then EN **without reloading**. The finding's `Status:` still reads `open`; set it on pass |
| *(unfiled — `F25`)* | **applied, uncommitted**: `RoutineSettingsView.vue:103` is `new TableColumn('color', t('routineTodoList.timePeriods.color'), false)` | ⏳ one look at `/routine-settings` in SK — header reads *Farba* |

### ⚠️ Found in the fifth pass: the create/edit path on `/routine-settings` has the 409 defect `B9` fixed for delete

> ✅ **CONFIRMED AND FIXED 2026-09-14 — filed as `todo-routine/B11`.** Observed live first (a duplicate
> 7-day period → `POST` 409), then fixed the way the first bullet below proposes: the request now runs inside
> `TimePeriodForm`'s confirm through a `submit` prop the view supplies, `_silent`, with the 409 rendered as an
> inline error on the length field (`routineTodoList.timePeriods.lengthTaken`) and the dialog still open;
> every other status goes through `handleHttpCodes`. The client-side pre-check (second bullet) was **not**
> added — §7's first ask is still open and the 409 path now behaves like the 400 would. `todo-routine/P2`
> (weekday chips clipping at 1440 px) was fixed the same day — `flex-wrap` + `min-width: 0` on the shared
> `BaseTodoListItem` row; see its finding for the height trade-off. One new thing the setup surfaced, filed on
> `B11` as an aside rather than fixed: leaving the colour picker on *None* gets a **400** (`color` is required
> on the wire, optional on the client), which still closes the dialog with the generic snackbar.

Source-certain, **UI unobserved** — round 5 recorded the API's 409 twice (*"Unique constraint violation
during Create"*, on a 7-day and a 30-day period) but not what the snackbar said, so this stays out of a fix
batch under rule 5. The code path has one outcome, though: `openAddDialog` / `openEditDialog`
(`RoutineSettingsView.vue:133-161`) call `createWithResponse` / `update` with **no `_silent`**, the
interceptor maps every 409 to `httpErrors.conflict` (`ErrorHandlingFunctions.ts:23-25`, status only, body
ignored), and the dialog has already closed (`TimePeriodForm.vue:108-111` does `dialogApi.close(...)` on
confirm and the view awaits the request *after* that). So a user who adds a second 30-day period sees
*"This record was changed by someone else. Refresh the page and try again."* and their form is gone. Same
root cause as `B9`, one function up in the same file — `B9`'s fix is call-site-scoped and this is the
adjacent call site it did not reach.

**What would settle it:** one attempt to create a 7-day period on the seeded account; read the snackbar
(no cleanup needed — it fails). **If confirmed, it is a low-effort app batch next run**, and two things about
its shape are worth deciding from here rather than in that session:

- The message is easy — the `_silent` + `status === 409` branch `B9` already wrote, with a new
  `routineTodoList.timePeriods.lengthTaken` key ("A period of {n} days already exists"). But the **form
  should survive the failure**, and that means moving the request *inside* the dialog's confirm: `useDialogApi`
  has `onConfirm(handler)` + `setLoading()` for exactly this (CLAUDE.md, `useDialog`), and `TimePeriodForm`
  already registers `onConfirm` — it just closes immediately instead of awaiting. Same shape for edit.
- A client-side pre-check against `timePeriods` *is* possible here — the view holds the whole list
  (`fetchAll()`, `:114`), not a page — and it would be a reasonable inline hint. But it is not the fix: the
  rule is the server's, and a pre-check that passes still has to handle the 409 for the race it cannot
  see. Handle the 409 first; add the hint only if §7's first ask (a 400 naming `lengthInDays`) is declined.

### ⚠️ Found while triaging unit 6: `BasicTable`'s delete-confirm dialog never closes after Confirm — probably app-wide

> ✅ **CONFIRMED 2026-09-14 (`todo-routine` round 7, on `/routine-settings`) — this is now `FW6`.** Observed on
> **both** outcomes of a `BasicTable` delete: after Confirm on a period that still had a routine (`DELETE` →
> 409, B9's snackbar shown) the *Delete confirmation* dialog stayed on screen behind the toast with **Confirm
> disabled**; after Confirm on the emptied period (`DELETE` → 204, row gone) the dialog **also** stayed open,
> Confirm disabled, until Cancel. Exactly the source read below predicted — `confirmDelete()` never sets
> `deleteDialog = false` and no consumer can. Framework batch, `vue_framework` commit + pointer bump; the
> design choice (close immediately vs. let the parent close after its async `onDelete`) is still the one to
> make, and `RoutineSettingsView`'s async `onDelete` — which awaits a second fetch before its snackbar on the
> failure path — argues for the second. ~~Not fixed in this round: it is a submodule change and was not in scope.~~
>
> ✅ **FIXED 2026-09-14 — `vue_framework` `98b92d0`, pointer bump `126d2968`.** Decision: **close on
> Confirm.** An emit cannot be awaited, and the "parent closes it" shape needs a callback in the `onDelete`
> signature across eight consumers for a dialog that has nothing to show while it waits — every consumer
> already gives its own feedback (row removal, snackbar, or B9's "kept the row and said why"). `deleteLoading`
> and its watcher are gone from both tables; `TableGrid.requestDelete` also resolves dotted
> `deleteConfirmationColumn` keys now (the F3 fix had reached `BasicTable` only). `docs/components.md` updated.
> Verified on `/routine-settings`: Confirm → dialog closes at once → `DELETE` 204 → row gone.

Source-only, unobserved, and **not filed by any unit** — flagged here because it is the highest-leverage
one-minute check in this queue. `BasicTable.vue:218-224`'s `confirmDelete()` sets `deleteLoading = true`
(which disables the Confirm button), emits `onDelete`, clears `itemToDelete` — and **never sets
`deleteDialog = false`**. `MyDialog` does not close itself on `confirmed` either (`MyDialog.vue:66,118-121`
— only the Cancel button and a non-persistent Escape touch the model), and `deleteDialog` is private to
`BasicTable`, so none of the eight `@onDelete` consumers can close it (`RoutineSettingsView.vue:163-179`,
`LookupEditTable.vue:110-120`, the four leisure tables, the two activity tables — read all eight). `TableGrid.vue:426-432`
is the same shape, and it also still does the flat `deleteConfirmationColumn` lookup that `F3` fixed in
`BasicTable` only (`:421`). Submodule history (`git log -S` on `deleteDialog.value = false`) shows the close
was never there.

If this is right, every confirmed delete through a framework table leaves the dialog open with a disabled
Confirm button until the user finds Cancel. **Nobody in this sweep has yet confirmed a `BasicTable` delete
in a browser**: unit 10 cancelled (`todo-routine/B5` "Clicked CANCEL (not Confirm)"), unit 13 did not
delete, unit 2 opened the dialogs and cancelled (`activity-settings/B7`, "deliberately did **not** click
Delete"), unit 6 could not reach the button (`X1`). That is how a defect this visible survives four units.

**Fourth-pass note:** `F19` moves the Roles and Categories tables off `BasicTable`'s built-in dialog onto
`useDialog().confirm()`, so they will stop being evidence either way — the remaining default-action
consumers are `RoutineSettingsView`, `LookupEditTable` and the four leisure tables (the latter now
`deleteConfirmationColumn`-correct after `F3`). The one-minute check below is unchanged.

**Fifth-pass note: still unobserved after `todo-routine`'s round 5, which is the round that should have
settled it.** `B9`'s retest *is* this check — a Confirm on `/routine-settings` — and all three attempts
were lost before reaching the trash icon (see the `B9` row above). So the count is now **five units** and
one retest round without a confirmed `BasicTable` delete. The two checks share a setup; **run them as one**:
the throwaway period `B9` needs is the row this needs, and the `B9` verify block already ends with "the
period is still listed afterwards", which is a stronger reading of the same screen. One more wrinkle for
the `B9` half specifically: `onDelete` there is `async` and awaits the delete *and* a `fetchGroupedByTimePeriod`
before the snackbar, while `confirmDelete` has already emitted and cleared `itemToDelete` — so if the dialog
does stay open, it will be open with a disabled Confirm *behind* the `B9` error snackbar, and a tester reading
only the snackbar will pass `B9` and miss this. Look at the dialog, not the toast.

**What would settle it:** on `/routine-settings`, create a throwaway time period through the app's own API
(the mutating-spec rule; `lengthInDays` not in {1, 7, 30, 365} — §7), click its trash icon, click **Confirm**,
and read whether the dialog is still on screen once the row is gone. If it is, this is a **framework batch**
(~~`FW9` next run~~ — it was confirmed and fixed directly, see the box above, so it never took a number;
`FW9` was reused by the ninth pass): either `confirmDelete`
closes the dialog immediately, or the emit carries a way for the parent to close it after the async delete
resolves — the existing `deleteLoading` flag suggests the second was the intent and was never finished.
That is a design decision for `vue_framework`, not a per-consumer workaround; do not add
`:key` remounts or a `v-if` toggle around `<BasicTable>` in `F13` to hide it.

### `activity-settings` — four `unverified`, of which two are settled from source

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — the *"no archived activities"* empty-state copy | one look at `/activity-settings/activities?archived=archived` signed in as the **`secondaryUser`** (the `secondaryPage` fixture), if that account seeds no archived activity — check `e2e/.state/seed.json` first rather than assuming | Seed-data shape, not a defect. If the second account also has one, it needs a throwaway account or a `test.fixme` naming this row |
| `U2` — what a Delete on a system/referenced role or category does server-side | **settled from the API source this pass**, no browser needed: a role → **409** with a user-readable message on both the `systemKey` and in-use paths (`DeleteActivityRoleEndpoint.cs:42-62`); a category → **204**, and every activity under it has its `categoryId` set to `null` (`DeleteActivityCategoryEndpoint.cs` is a bare `BaseDeleteEndpoint`, FK `SetNull` at `ActivityConfiguration.cs:42`). Neither path deletes an activity or its history | `F19` is built on this answer. The unit's caution about the seed's system roles was well placed for the wrong reason — a role delete could never have destroyed them; a *category* delete on the seed would have silently unfiled ten activities |
| `U3` — repeated 401 → `/refresh` 401 → sign-out | **re-graded** to a runbook error, mechanism source-verified (token rotation, 5 s grace) — see `F23` and *Contradictions* §19 | Not an app defect and not retestable as one; the fix is the paragraph, and the proof is the next parallel run keeping both sessions |
| `U4` — one *"0 of 0"* on an unfiltered request | retest after **`F18`**: reload, type a name, clear it, three times, and read `itemsCount` off the response body each time | `F18` removes the only competing request this view fires, which is the only candidate mechanism the finding names. Checked `useFetchFilteredTable.ts:47-55` this pass: an aborted call defers to `latest`, so the simple "stale response overwrote the fresh one" story does not hold as written — if it recurs *after* `F18`, capture the response body, because the cause is then somewhere this queue has not looked |

### `tracking-settings` — two items that `F12`/`F13`/`F14` will surface, not close

| finding | what settles it | note |
| --- | --- | --- |
| `tracking-settings/U1` — the mapping delete button reaches nothing | run its *What would verify it* after `F12` **and** `F13` land: a `DELETE …/tracker-desktop-mapping-by-pattern/{id}` fires and the row is gone after reload | Kept `unverified` per rule 5, but it is source-certain (`DesktopMappingsTable.vue:36` declares only `edit`; `BasicTable`'s `hasDelete` default renders the button anyway). `F13` wires it; the retest also answers the dialog question above |
| *(unfiled)* sidebar highlights *Desktop tracking* on the Mappings tab, nothing on `/activity-settings/roles` | one look at the sidebar on each route, before and after `F14` | `SidebarNavItem.vue:52` uses the same `matchesPath` as the breadcrumb, so `F14`'s data fix closes both; it must be *checked*, not assumed, because the `VBtn :to` in the header toggle is a second active-state mechanism on the same screen |

### `history-review` — two `unverified`, both seed-shape gaps with a cheaper route than a seed change

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — Calendar's and Summary's empty / first-run branches never seen on screen | **Empty:** no seed change needed. `HistoryCalendarView.vue:71-78`'s own comment says calendar rows exist only for the current and next year, and `fillMissingDays` pads a past-year range with placeholders — so `/activity-history/calendar` navigated to any 2020 month must render `history.calendar.noActivityInRange` above a grid of *"Not recorded"* cells, and `/activity-history?date=2020-01-01&range=month` must render the three `HistoryEmptyState`s with `periodLabel` *01.01.2020*. **First-run:** needs an account with **zero** history rows anywhere — `getHasAnyHistoryEver()` is a global check. Read `e2e/.state/seed.json` for whether `secondaryUser` (10002) seeds history; if it does not, the `secondaryPage` fixture is the one-minute route, else a throwaway account | Seed-data shape, not a defect. **Run after `F27`** — until then an empty state and a failed request look the same, and a 2020 range is exactly where a backend edge case would show up as "empty" |
| `U2` — the null-`wakeUpTime` path (`CalendarActivityDaySummary.ts:37-38`) never exercised live | **No seed row needed:** `playwright-cli route "**/api/activity-history/dashboard/calendar"` with a fulfilled body copied from a real response and one day's `wakeUpTime`/`bedTime` set to `null` (the CLI's `route` takes a body as well as a status — check `playwright-cli route --help` for the flag name rather than trusting this row). Pass: that cell renders without its sleep line and the rest of the month still paints | Source-only today; the fix it would confirm (`H1`, `Time | null` with independent rendering) is in the DTO and the cell component. If the mocked body is a chore, a one-line ask on the seed — one day with no sleep record — is the alternative, and it is the *only* seed ask this unit produced |

**Source-certain, unobserved, and carried inside batches rather than listed as findings** (each named in
its batch's *Adjacent* / *Root cause*, with a verification step): the timeline and calendar views keeping
the *previous* period's rows on a failed fetch, with an unhandled rejection (`F27`, cases 2 and 3); the
summary/domain cards being `role="button"` with no key handler (`F30`); Detail's bars showing a pointer
with no click consumer (`F29`); `HistoryPieChart`'s hardcoded dark-theme legend colours (`F31`); and
`isNarrow` being a dead prop (`F31`). None of them needs a browser to be *believed* — the code paths
have one outcome — but each batch's verification is where they get *seen*, and a fixing session that
finds one of them does not reproduce should stop and say so rather than fix it anyway.

### `user-settings` — one re-graded `bug` and five `unverified`, of which three are settled from source

The unit's five `U` items share one cause that is not the app's: the harness's own safety classifier
blocked a `fill` on a password field, a `select` on the language combobox and (twice) a click on *Delete
account*. That is a **tooling** limit, not evidence about the app, and it does not carry over to a
Playwright spec — a spec is code, not the agent — so the cheapest settle for four of the six rows below
is to promote the matching `test.fixme` in `e2e/tests/user-settings.draft.spec.ts` rather than to
re-drive the screen by hand.

| finding | what settles it | note |
| --- | --- | --- |
| `B2` — callback view "silent" on a missing `code` / `error=access_denied` — **re-graded `bug` → `unverified`** (§38) | `expect(page.getByText('Failed to connect Google Calendar')).toBeVisible()` immediately after `page.goto('/google-calendar/callback?error=access_denied')` — Playwright polls from the moment `goto` resolves, which is before the app has booted, so a 3-second toast cannot be missed. With `playwright-cli`, read the snapshot file the `goto` itself wrote, not a later `find` | `GoogleCalendarCallbackView.vue:20-23` **has** the branch: `if (!code) { showErrorSnackbar(t('googleCalendar.connectFailed')); router.replace(…) }`. The toast is module-level state (`SnackbarComposable.ts:16-22`), mounted once in `App.vue:19`, `timeout` 3000, and error toasts are **not closable**. Nothing on the settings mount touches it (grep: zero snackbar calls in the user module's setup paths). The unit's negative evidence is a `find` run as a separate CLI process after a `goto` — an unmeasured delay against a 3 s window. If it *still* does not show, the cause is somewhere this pass has not looked and it is a real bug; file the mechanism, not the symptom. Either way the residual — a distinct message for Google's *Cancel* — is the optional branch in `F33` |
| `U1` — 2FA enrollment | **Half is runnable now, non-destructively:** the switch's `@click` is `preventDefault`ed and opens `VerifyUserForm` posting to `/user/2fa/toggle` (`SecuritySection.vue:170-173`, `VerifyUserForm.vue:49-52`); Cancel closes it, the switch stays off, no request fires. The other half — the real enrollment, which also shows recovery codes **once** (`:195-197`) — needs a throwaway account: the seed has none, and `secondaryUser` is shared with `account-isolation.spec.ts` | Stays `unverified` for the enrollment; the dialog half is a one-minute check that says whether the control is wired at all |
| `U2` — Revoke / *Log out of all other devices* | One form sign-in in a **second** CLI session (`playwright-cli -s=revoke-target open …/login`, creds from `seed.json`) creates the target; that is *one* sign-in, not the repeated burst the rate limit in `e2e/fixtures/auth.ts` guards against. Revoke it from the first session; expect the row gone and *"Session revoked"*; the second session's next request is a 401 that does not refresh. No reseed needed | **Adjacent, not filed:** the per-row *Revoke* is a direct call with **no confirmation** (`SessionsSection.vue:118-129`), while *Log out of all other devices* confirms through `MyDialog` (`:70-77`). Reversible (the device signs in again), so at most `polish` — decide when the control is exercised, not here. Its button is also one of `FW8`'s six |
| `U3` — delete-account dialog copy | **Settled from source; one look remains.** `SecuritySection.vue:179-188`: `confirm({ title: 'Delete account', text: deleteAccountWarning ?? user.deleteAccountWarning, confirmBtnLabel: 'Delete account', confirmBtnColor: 'errorDark' })` **then** `openVerifyDialog('/user/delete-account')`. This app passes `deleteAccountWarning` = `user.dangerZone.deleteWarning` (`UserSettingsView.vue:11`, text at `user.en.ts:40` — the itemised sentence). The finding's cited source, `prompts/_done/user/A2-deletion-cliff.md`, describes the flow **before** that step was added (the view's own comment at `:6-9` names it "F6 / R21"). The look: click *Delete account* → the intent dialog with that text → **Cancel**; no request fires until the *second* dialog's Confirm | The classifier blocks the agent's click, not the app; a human does this in ten seconds. **Correct the draft spec's `fixme` text** (*"source suggests it currently only verifies identity"*) when promoting — it encodes the stale description |
| `U4` — mismatched new/confirm password | **Mechanism settled; the message is broken.** `MyNewPasswordInput.vue:34-37` appends `doPasswordsMatch(v) \|\| t('user.passwordsDontMatch')` to the confirm field's rules, so the line appears inline as you type; and `ChangePasswordForm.vue:50-51` runs `form.validate()` on Confirm and returns without a request when invalid. But the key is defined **nowhere** (`FW7`, adjacent), so what the line says today is `user.passwordsDontMatch`. Settle by promoting the `fixme`: fill `a` / `b`, expect a sentence under the confirm field, click Confirm, expect **no** `POST /user/change-password` | The spec's *"does not enable Confirm"* is not how the form works — Confirm stays enabled and the handler bails; assert on the absent request, not a disabled button. Latent and not filed: the confirm rule does not re-run when the *first* field changes afterwards (no watcher), but `form.validate()` on Confirm catches it, so no wrong password can be submitted |
| `U5` — language switch | **Mechanism settled.** `onLocaleChange` → `userStore.setPreferences({ locale })` → `await updatePreferences` + `Object.assign(currentUser, partial)` (`authStore.ts:33-36`) → `App.vue`'s deep watcher on `currentUser` → `i18n.locale.value = currentUser.locale` (`App.vue:94`). That is the **same watcher and the same store method** the unit verified live for the theme toggle (theme applies at `:88-93`, four lines above); only the final assignment is untested. Settle on `secondaryUser`, or on the primary account and reseed afterwards — the seed restores `locale: "EN"` (README *Prerequisites* §3) | The sweep-wide "must stay English" concern is real but cheap to honour: `POST /api/test/seed` is the revert |

### `history-capture` — one `unverified`, half of it source-certain

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — manual entry form: no in-flight guard, no reset after save | **The double-submit half is source-certain** and stays out of a batch only by rule 5: `AddActivityManuallyView.vue:36-38`'s `handleSave` is `await formRef.value?.saveActivity()` with no re-entry flag, `AddActivityManuallyForm.vue:63-82` sets nothing while `await saveActivityToHistory(…)` → `create(…)` is pending, and the button at `View.vue:17-23` has no `:loading`/`:disabled`. Two clicks before the first `POST /api/activity-history` resolves are two `create` calls; there is no other code path. The unit's own *What would verify it* is right and belongs to the **mutation pass**: fill a real activity and a non-zero length, click *Record activity to history* twice inside the round trip, count the `POST`s in `playwright-cli requests`, then reseed. **If confirmed, a low-effort app batch next run** (`F39`): a `saving` ref in the view that gates `handleSave` and binds `:loading` on the button — the same shape as `TimerPresetDialog`'s confirm | **The reset half is not sourced.** *"Either the form clears … or the button disables"* — the second clause is plain user sense; the first is taste. No intent source (`prompts/_done/activity-history/`, `prompts/_done/activity/A6-selection-form-api.md`) says what the form should do after a save, and a user logging several spans of one activity plausibly wants the activity and date kept and only the length cleared. If the batch adds a reset, decide *what* resets from that use, not from the timer views' Stop → clear pattern, which is a different flow (a session ends; a form does not). Re-graded in place: the finding stays `unverified` as filed, but its two halves have different standing (§53) |

### `auth` — six `unverified`: one settled as no defect, one source-certain, two unblocked by `FW13`, one environment, one seed

The unit's six `U` items have three different causes, and only one of them is a data gap. Two are
the client-side reCAPTCHA guard `FW13` removes (`U1`, `U5`); one is a code path whose outcome is
fixed by reading it (`U6`); one is the dev environment's missing site key (`U3`); one was a deliberate
choice not to lock out a shared account (`U4`); and one is the seed (`U2`).

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — registration's 2FA recovery codes are received and discarded | **Source-certain; observable after `FW13`.** `RegistrationView.vue:152-161` tests `response.data.recoveryCodes` for truthiness and then opens `QrCodeFor2FABody` with `qrCodeImage` only; the component declares exactly one prop (`QrCodeFor2FABody.vue:15-17`). The server does send them: `TwoFactorAuthResponse.cs:7-9` is `{ twoFactorEnabled, qrCode, recoveryCodes }` and `BaseRegisterUserEndpoint.cs:86-113` returns it. **And the fix already exists one file over:** `SecuritySection.vue:196-197,269-281` shows codes once after a settings-side enrolment through `RecoveryCodesBody` (`prompts/_done/user/framework/F1-…` landed for that path and missed this one). The check, after `FW13`: register a throwaway address with *use 2FA* ticked → QR dialog → *Done* → **no** recovery codes anywhere; reseed | Rule 5 keeps it out of a batch until seen; when it is, it is **`FW14`**: after `open2FADialog` resolves, `await openDialog({ component: RecoveryCodesBody, componentProps: { codes: normalizeRecoveryCodes(response.data) }, dialogProps: { title: t('user.recoveryCodes'), confirmBtnLabel: t('general.done'), hasCloseBtn: false, persistent: true, isSmall: false } })` before `goToLogin()` — six lines, the same call `SecuritySection` makes, with `normalizeRecoveryCodes` lifted into `utils/`. The user-facing stake is the finding's own sentence: a brand-new account whose owner loses the authenticator has no way back in |
| `U2` — the 2FA login dialog (`LoginVerifyQrCode`) never exercised | **Seed gap, and the seed alone is not enough.** Driving the OTP needs an account with 2FA enabled *and a known TOTP secret* the spec can compute codes from — a seeded flag without the secret only reaches the dialog, not through it. Two routes: (a) an `e2e-v5` account (`twoFactorUser`, 10004) whose secret the seed response returns, so a spec can `otplib`-generate the code; (b) after `FW13`, enrol a throwaway account by hand through registration and read the secret off the QR (`otpauth://` URI) — one-off, not a spec. The dialog's *structure* (title, `VOtpInput`, wrong-code line, Escape behaviour under `FW1`'s `persistent` default) is reachable with (b) in a minute | Route (a) is a one-paragraph seed ask if the operator wants a spec; it belongs in `B3`'s family (`prompts/view-docs/backend/_done/B3-seed-fixture-coverage.md`), not a new file. Note the `LoginVerifyQrCode` redirect line is `FW11`'s and reads the same helper — a source read covers that half |
| `U3` — reCAPTCHA badge show/hide never observable | **Environment**, not the app: `VITE_RECAPTCHA_SITE_KEY` is empty in `.env.development`, so `recaptcha-v3`'s `load()` is never called and `.grecaptcha-badge` never exists (`UseRecaptchaHandler.ts:79-88` returns `''` before loading). **One latent thing from the read, for when a key exists:** nothing calls `loadRecaptcha()` on mount — the script loads lazily inside the first `executeRecaptcha()` — so on `/login` the badge appears only *after* the first submit, and `router.afterEach` (`router.ts:107-112`) has no badge to show until the next navigation. Google's terms want the badge (or its alternative text) visible wherever v3 runs; check it when a key is configured, not before | Not a defect anyone can see today; not a batch |
| `U4` — "too many attempts" / "locked out" branches | **Settled from the API source; the numbers the unit wanted are:** `IdentityServiceExtensions.cs:128-129` — **5** failed attempts, **5-minute** lockout; the message is `"Too many failed login attempts. Try again in {m}m {s}s"` (`PasswordSignInFlow.cs:85-93`), sent on the lockout path, and `"Invalid email or password"` for every other miss including unknown addresses (`:73-77,95-101`, enumeration-safe). So `LoginView.vue:174-176`'s substring match will show the server's countdown, in English, in both locales — the countdown is server-only, so that is the ceiling without a contract change. **Dead code, harmless:** `:186` is `generalErrors.includes('User locked out for')`, an *exact-element* `Array.includes` against a string the server never sends; it never matches and the `!handled` fallback at `:201-202` shows `generalErrors[0]` anyway — the same text. A disposable account is still the right way to *see* it: six wrong passwords, read the snackbar, wait five minutes | The unit's caution (do not lock out the shared `test@example.com`) was correct — a lockout would have cost every concurrent unit five minutes. Reseeding clears `LockoutEnd` (the seed recreates the account) if it ever happens by accident |
| `U5` — "redirected from registration" login prefill | **Unblocked by `FW13`** — its verification block *is* this check (a completed registration lands on `/login` with the e-mail prefilled and the resend panel shown). Mechanism read: `RegistrationView.vue:151` sets `userStore.currentUser.email`, `LoginView.vue:134-138` reads `userStore.userName` on mount. One caveat the unit did not name: `userName` is persisted (`authStore.ts:79`, `localStorage`), so the prefill also fires for anyone who was signed in on this browser before and signed out — `logout()` resets `currentUser` to `new User()` (`:63-66`), so after a *clean* logout it is empty, but a session that expired (the interceptor's `logoutClient` → `auth.logout()`) goes through the same reset. Fine as far as read; worth one look that the resend panel does not show for an already-confirmed returning user | Closes with `FW13`'s retest |
| `U6` — a stuck full-screen spinner on both confirm views | ✅ **Settled from source — not a defect, dropped.** `SnackbarComposable.ts:43-46`: `showSnackbar` calls `hideFullScreenLoading()` unless `dontHideFullScreenLoading` is passed, and both views' `catch` blocks call `showErrorSnackbar` (`ConfirmEmailView.vue:55`, `ConfirmEmailChangeView.vue:56`). The spinner is hidden by the snackbar on every error path. The unit's three negative attempts were right and its "inconclusive" was honest; the mechanism it was missing is one composable over. `FW12` adds the explicit hide anyway so the view stops relying on it | §64 |

### ⚠️ Found while triaging unit 4: `TimePicker` snaps `:58` / `:59` to minute **60** at any interval above 1 — framework, source-certain, unobserved

Not filed by any unit; found while reading `B2`'s mechanism. `roundToNearestInterval(58, 5)` is
`Math.round(11.6) * 5 = 60` (`DateTimeHelper.ts:166-168` — no clamp), and both of `TimePicker.vue`'s
write paths feed the result straight into a `Time`: the mask watcher builds `"HH:60"` (`:122-123`) and
the `timeString` setter does `new Time(h, 60)` (`:99-100`). `Time` has no validation (`Time.ts:3-7`),
so the model becomes `{ hours: h, minutes: 60 }`, `getString()` renders **`00:60`**, and the
`time` watcher writes it back into the field (`:132-141`), where the mask watcher's `minutes < 60`
guard (`:121`) then resets `inputValue` to the same `"00:60"` — a stable, visible, invalid state. On the
wire it is `{ hours: 0, minutes: 60 }`, which the API may or may not normalise. Every interval above 1
has the case (`'5'`: 58–59; `'10'`: 55–59; `'30'`: 45–59 all round to 60), so `F36`'s `'1'` makes it unreachable on
unit 4's eight fields and on nothing else — `LogTimeBody`, `ToDoListItemDialog`, `PlanLaterDialog`,
`DateTimePicker`, `QuietHoursCard`, `TaskPlannerDayTemplateDetailsForm`, `LogTimeForm` and both halves
of `TimeRangePicker` keep it.

**What would settle it:** ten seconds on `/activity-history/timer` **before** `F36` lands (or on
`/todo-list` item dialog's due time after it): type `0058` into a `TimePicker` field and read it. If it
reads `00:60`, this is a **framework batch** (`FW10` next run — ~~`FW9` is reserved for the `BasicTable`
dialog check above~~ the `BasicTable` dialog was fixed without a batch and `FW9` went to unit 15's
forgotten-password blocker in the ninth pass; `FW10` is still held for this): clamp in `roundToNearestInterval` (`Math.min(60 - interval, …)` is wrong for
`59` → it should carry into the hour, so probably `Time.fromMinutes(h * 60 + rounded)` at both call
sites instead). Same repro as `B2`'s, one different digit — worth folding into the unit's mutation-pass
brief so it costs nothing extra. **While that batch is open, the two framework questions `F36` declined
to answer belong in it:** whether `'5'` is the right *default* for a component that serves both
times-of-day and durations, and whether a snap should ever be silent (helper text, or a `snapped`
emit). Both are decisions for `vue_framework`, not this app.

### The multi-count counter is probably unreachable by a real mouse — and the last queue's "contradiction" resolves

> ✅ **CONFIRMED AND FIXED 2026-09-13** — filed as `todo-lists/B6`. `hover` → 600 ms → `click` on the 2/5 bar
> hit `button "Znížiť: 2 z 5"` and produced **1/5**, exactly as hypothesised. `TodoListItemCounter.vue` is now
> two always-present buttons (a native `<button>` around the bar, a small minus below it), both
> keyboard-operable — which also discharges the `todo-routine/A1` caveat below, since the routine list renders
> the same component. Retesting it surfaced a second defect, `todo-lists/B5`: counter steps were never
> persisted unless they flipped `isDone` (the API's `toggle-is-done` + `forceValue` is a ±1 step for counted
> items; the client only sent the last one). Also fixed.
>
> **Independently corroborated from `/routine-todo-list` in `todo-routine`'s round 5**, with the synthetic-event
> artefact this section worried about explicitly ruled out: a real `mousemove`, a 1 s dwell, an
> `elementFromPoint` read, then `mousedown`/`mouseup` — not `.click()` — landed on `Increase: 0 of 2` and
> produced 1/2, and on `Decrease: 1 of 2` resolved to the decrease button on two separate items. Screenshot:
> `todo-routine/screenshots/routine-todo-list--round5-counter-hittest.png`. **This section is closed**; it
> stays for the audit trail.

The last run filed this as an unresolvable contradiction: `TodoListItemCounter.vue`'s `VHover` renders the
decrement button under `isHovering` and the increment target under `v-else`, so a mouse must already be
hovering to click — yet `todo-lists/U2`'s round-3 retest recorded a `playwright-cli` click **incrementing** a
fresh 2/5 item. **Those two facts do agree**, and the explanation is the tool: Playwright synthesises
mousemove/mousedown/click in one burst, and Vue's re-render is asynchronous, so the `v-else` branch is still
mounted when the click lands. A human mouse dwells, the swap happens, and the click hits the minus button.
**Working hypothesis: a mouse user can decrement but never increment.** Re-graded from "needs a browser check
to resolve a contradiction" to "needs a browser check to confirm a probable `bug`" — one minute of work:
hover the counter, wait 500ms, then click, and read which of `minus`/`increment` fired.

Two things follow if it confirms, neither covered by any batch above:

- the fix is a hit-target change (one control with two zones, or a modifier-click), not a label change;
- the round-3 a11y fix put `:aria-label="increaseLabel"` on a `VProgressLinear`, i.e. a `progressbar` that is
  **not keyboard-focusable and is not a button**. Naming it satisfies the automated sweep while leaving the
  increment action unreachable by keyboard as well as by mouse. Check `Tab` reaches it before declaring
  `todo-routine/A1` verified.

### ✅ SETTLED 2026-09-13 — the grid sort-key fix is deployed, and units 11, 12 and 16 are off the blocked list

Probed directly against the running API (signed in as the seed's `primaryUser`, fixture `e2e-v3`).
`POST /api/activity-backlog-profile/grid` with `sortBy: [{"key":"activity.name","isDesc":false}]` → **200 with
rows**, and so does every other key these views send: `activity.name` on all three profile grids (plus
`activity.role.name` and `activity.category.name`), `periodKey` **and** `activity.name` on `memory-anchor/grid`,
`nextOccurrence` and `nextOccurrenceAt` on `reminder-dashboard/my-upcoming`. Unrecognised keys are now a
**400 naming the key**, not a 500.

The fix shipped is **not** the remap the old notes describe — that was replaced. `prompts/view-docs/README.md`
Class 1, its blocker table, `UNIT-ORDER.md` Wave G and the `B2` ask itself have all been rewritten to match,
and `B2` has moved to `prompts/view-docs/backend/_done/`.

**Two app-side items fall out of it,** neither blocking any unit:

| item | what | where |
| --- | --- | --- |
| `nextOccurrence` → `nextOccurrenceAt` | `/pripomienky/moje` sorts by the compatibility alias. The API accepts it on all three reminder reads *so the three stop disagreeing*, and asks us to migrate so it can be dropped. `/pripomienky/register` already sends the correct key | reminders module, framework — `_common/modules/reminders` |
| table error state ≠ empty state | The table renders its empty state for a **failed** request, so a 400 and a genuinely empty list are indistinguishable on screen. This is what turned one backend bug into three separately-filed tickets. `ErrorHandlingFunctions.ts` already snackbars a 400 (see §5 above) — what is missing is the state *in the table* | `_common/component/dataTable` |

#### ⚠️ Found while probing that endpoint: `/pripomienky/moje` parses a row shape the server does not send

Not filed as an ask, and **not** part of B2 — but unit 16 was blocked until today, so nobody has driven this
screen with rows in it, and whoever runs 16 will hit it in the first minute. Measured 2026-09-13,
`POST /api/reminder-dashboard/my-upcoming`, `useFilter: false` — the row carries exactly:

```
ownerModule, kind, templateKey, scheduleType, nextOccurrenceAt, id
```

`UpcomingReminderGridResponse.fromJson` (`src/_common/modules/reminders/dto/response/`) reads
**`json.nextOccurrence`**, which is not there, so the *Next occurrence* column and each row's `:dueAt` are
`null` on every row. It also reads `subjectType`, `subjectId`, `status`, `intervalPreset`, `cronExpression`,
`hasLeadOffsets` and `recipientCount` — none of which this projection sends — while ignoring the
`templateKey` it does send. Whether the right fix is a wider projection server-side or a narrower personal-view
DTO client-side is a contract question for unit 16 to raise, **not** a rename to apply blind. Note it is the
same field the B2 close-out asks us to migrate in `sortBy` (`nextOccurrence` → `nextOccurrenceAt`); the two are
one change, and doing the `sortBy` half alone fixes nothing visible.

This is in the **framework submodule** (`src/_common`), so it is a two-repo commit — see CLAUDE.md.

### Seed-data gaps — one ask, two findings

**The routine half is done on the API side — `B8` closed 2026-09-14, moved to
`prompts/view-docs/backend/_done/B8-routine-streak-history-seed.md`.** It was already covered by the API's
`e2e-v4` work (uncommitted on `dev` on top of `7f9f9e5` when the ask was written; `B8` measured against
`e2e-v3`, which is why source showed nothing). Every "Done when" item is met, plus the catch-up trap:
`E2eFixtureSeeder.AddRoutinePeriodHistory()` seeds 16 `RoutinePeriodCompletion` rows on Weekly
(pattern `xf.xxxx.xx.xx.xx` newest-first — met / missed / **frozen**, streak 1, best 4) and 16 on Daily (one
4-of-5 miss eleven cycles back; streak 11, best 30); `totalPeriodsElapsed` / `totalPeriodsCompleted` are now
**derived** from those rows by `RoutineTimePeriodResponse.From`, so the client's `mockHistory()` fallback cannot
fire for them, and Monthly / Yearly stay bare on purpose so the empty state is still reachable. Four new daily
items cover the remaining milestone tiers (`milestone30` Drink water 45 — the one daily item left un-ticked;
`milestone90` Journal 120; `milestone180` Make the bed 200; `milestone365` Brush teeth 400). Freeze budgets and
`lastResetAt` are pre-stamped so the first grouped read writes nothing. Typed in `e2e/fixtures/seed.ts`
(`EXPECTED_FIXTURE_VERSION = 'e2e-v4'`, the four `SeedRoutineKey`s, `counts.routinePeriodCompletions` /
`.frozenRoutinePeriodCompletions`), pinned by three tests in `TestSeedEndpointTests.cs`. Two caveats from the
seeder: Weekly has one freeze fewer than budget if the seeded freeze falls in the current calendar month, and a
spec that straddles midnight UTC with a milestone item un-ticked will see the lapse zero its streak.

**And the browser pass is done too** (`todo-routine` round 6, 2026-09-14, against a freshly v4-seeded
database): all seven surfaces render and match the seeded rows — review card with both eligible periods,
heatmaps with met / missed / frozen, 94 % and 69 % consistency with computed trends, personal bests 30/11 and
4/1, freeze chips 2 and 1, and all five milestone icons on one screen. **`U1` and `U2` are closed.** The one
thing the wider board surfaced is a polish finding, `todo-routine/P2` (weekday chips overflow the Daily column
at 1440 px now that it holds five items) — not queued here yet; it is a one-component `flex-wrap` and can ride
along with the next `todoList` batch.

| what to seed | unblocks |
| --- | --- |
| ~~≥1 routine time period with `totalPeriodsElapsed > 0` and non-empty `completionHistory`~~ — **`B8` done, `e2e-v4`** | ~~`todo-routine/U1`, `U2`~~ ✅ both verified live, round 6 |
| ~~≥1 routine item with `streak >= 30` (ideally 90/180/365 too)~~ — **`B8` done, `e2e-v4`** (45 / 120 / 200 / 400) | ~~`todo-routine/U2` (milestone icons)~~ ✅ all five icons verified live, round 6 |
| ≥1 **routine** item with steps (the `todo-lists` fixture has them; the routine groups do not — round 5: "Take Medication, Weekly Review, Pay Rent have no steps") | `todo-routine/A2`'s live check and the unfiled `TodoListStepsFormField` sweep, both read-only today. Low priority — a temporary item does the same job; worth one line on `B8` if it is reopened anyway |
| enough desktop mappings to exceed one page (>25, or a smaller page size in the spec) | `F12`'s second verification step — that the Mappings body *scrolls inside the card* rather than merely paints. Two seeded mappings (one `Activity`, one `Ignored`) can prove the row paints; they cannot prove the fill-parent contract still holds. Low priority: `ActivityTable` already exercises the same path with 10 rows |

Also worth naming for unit 13's own sake: the projects seed holds **one** row, which is why `F2`'s
under-rendering consequence could not be observed and why the board's grouping was only seen with one
occupied column. Two or three projects across all three readiness statuses would make that view actually
testable.

### `planner-day` — no `unverified` filed; three items settled or found from source

The unit filed zero `unverified` findings — the first in the sweep to do so — and its six `bug`s all
carry a screenshot, a DOM read or a response body. What this section holds for it is what the source
read added:

- **`B5`'s task half is settled — no defect, dropped from the open count** (*Contradictions* §70).
  `PlannerTaskLinkView.vue:66-88` wraps both reads in `try/catch` and its own comment says the
  interceptor *"has already surfaced the failure"*. The `AxiosError` the unit saw in the console is
  `axiosConfig.ts:212-214` — `console.error('ERROR: ', error)` for every non-cancelled failure, by
  design — not an unhandled rejection. Its pass condition (*"the console shows no uncaught exception"*)
  is unattainable without changing the interceptor, and there is nothing to catch. The date half is
  real and is `F43`; note that the same interceptor line will still print there after the fix — the
  thing to assert absent is Vue's *"Unhandled error during execution of mounted hook"*, not the
  interceptor's.
- **`useDayNavigation.ts:71-84` — the second unguarded calendar fetch, source-certain, unobserved.**
  Folded into `F43` rather than listed as a separate finding (the `F27` precedent: same shape, same
  batch). What would settle it: from `/day-planner/01-01-2026`, ArrowLeft with the console open —
  expected today: `GET /calendar/by-date/31-12-2025` → 404, the tasks vanish, the header still reads
  `01.01.` (through `formatToDateWithDay`, whose weekday is hardcoded `sk` — §22, not this unit's) and
  the URL says `31-12-2025`. Ten seconds, no seed change: the seeder covers this
  year and next only (`CalendarSeeder.cs:29-31`), and `CalendarProvisioner` creates rows on writes, not
  reads.
- **`UNIT-ORDER.md`'s ISO-URL claim no longer describes the code.** The brief (*"An ISO URL 400s the
  calendar fetch and the view silently falls back to a neighbouring day's calendar"*, measured
  2026-09-11) cannot happen on the current tree: `by-date` strict-parses `dd-MM-yyyy` and 400s
  (`GetByDateCalendarEndpoint.cs:19-24`), the 400 rejects the `Promise.all` before `store.viewedDate` is
  assigned (`DayPlannerView.vue:211-214`), so an ISO URL produces `B5`'s blank header, not a neighbouring
  day. The unit was briefed to verify before filing and correctly filed only what it saw
  (`not-a-date`). `F43`'s verification includes the ISO form so the brief's row can be struck.
- **`MyDateInput`'s `style` override** (`FW15`'s adjacent): `PlannerTaskDialog.vue:26` asks for 200 px
  and gets the component's 150 px. Same one-line fix; one look at the Add Task dialog's date field
  width after `FW15` settles it. Not a finding on its own.

### ⚠️ Found while triaging unit 7: the template picker calls `/suggestions?date=` against a `/{calendarId}` route — the withdrawn `B5` bug on the sibling endpoint, hidden by mount order

**Source-certain, unobserved — `F45`-if-confirmed (rule 5).** `taskPlannerDayTemplateApi.ts:38-41` is
``API.get(`${url}/suggestions`, { params: { date } })``; the only route is
`Get("/task-planner-day-template/suggestions/{calendarId:long:required}")`
(`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs:22`), so the request falls through to the framework's
generic `GET /{id}` with `"suggestions"` as the id — the exact mechanism `repeatingPlannerTaskApi.ts:25-32`
now documents for its own fixed twin. The unit's brief presented this endpoint as an *opportunity*
(*"the client never calls it at all"*); the client has called it since the picker was written.

**Why no unit has seen the 400:** `DayTemplatePicker.vue:212-221` fires the call in `onMounted`, reading
`calendar?.date` **once**. The picker sits in `DayDetailsPanel` → `DayPlannerSidePanel`, which is
rendered on the day view's first paint — before `DayPlannerView.vue:211`'s `Promise.all` has resolved the
calendar — so `calendar` is `undefined` at mount, the guard takes the `Promise.resolve([])` branch, and
there is no watcher to try again. Net effect today: **the picker's *Suggested for you* section
(`DayTemplatePicker.vue:13-55`) is fed only by this call and therefore never renders on a normal load** —
which is presumably why the brief believed the endpoint uncalled. (`composable/useTemplateSuggestion.ts`,
the client-side scorer, has no importer anywhere in `src/` — dead code, noted, not batched.)

**When it does fire:** `DayPlannerSidePanel.vue:11` is `v-if="activePanel === 'details'"`, so switching
*Routine* → *Day Details* **remounts** the panel with the calendar now loaded — and the request goes out,
400s, rejects the picker's `Promise.all`, and `templates.value` is never assigned: the picker shows **no
templates at all** on the second visit to the tab. Same for a day view opened with the details panel
collapsed by setting (`detailsPanelExpandedByDefault` off) and expanded later. The unit's draft spec
switches *to* Routine (`planner-day.draft.spec.ts:80`) and never back, which is why its network section
lists only the two 4xx it went looking for.

**What would settle it:** ten seconds — `/day-planner/<today>` with the console open, click *Routine*,
click *Day Details*: expect `GET /api/task-planner-day-template/suggestions?date=…` → **400**, the
interceptor's toast, and an empty template picker. **Fix shape when confirmed** (two lines plus a
guard): ``API.get(`${url}/suggestions/${calendarId}`)`` taking `calendar.id`, and `.catch(() => [])` on
the suggestions leg of the picker's `Promise.all` — the same isolation `DayPlannerView.vue:244-252` added
for the repeating-task twin, so a suggestion outage never costs the template list again. Consider a
`watch(() => calendar?.id)` so the first load fetches too, or the endpoint stays uncalled on the path
every user takes. Not batched with `F43`/`F44` (different cause); would be its own trivial app batch.

### `tracking-dashboards` — one `unverified`, and its premise is wrong in the useful direction

- **`U1` — loading and error states never exercised.** Stands as `unverified`, but not for the reason
  given. The finding says *"no network fault injection available via `playwright-cli`"*; the CLI has
  `route <glob> --status=<n>` / `--body=…` and `unroute` (`~/.claude/skills/playwright-cli/SKILL.md:150-154`),
  the README's decision log names it as the thing that *"makes error states reachable for the first
  time"*, and `history-review/B2` was observed with exactly that command — so nothing about this item
  needs a new tool or a seed change. What would settle it, in one session with `F27`'s verification
  (the two are the same pattern; `F27` copies this module's): `playwright-cli route
  "**/api/activity-tracking/web-extension/pie-chart" --status=500`, reload `/activity-tracking` —
  expected today: the pie section shows the icon + *"Failed to load"* + *Retry* (`ActivityPieChartSection.vue:14-33`)
  while the other three panels populate, and **no snackbar** (`_silent: true` on every dashboard read,
  `activityTrackingApi.ts` and siblings); `unroute`, click *Retry* — expected: **one** `pie-chart` request,
  no other panel refetches. Then the loading half: `route` the same endpoint with a delayed fulfil, or
  `network-state-set` throttling, and snapshot — expected: `VSkeletonLoader type="image, list-item@3"`
  + `type="card"` in the pie card (`:3-12`). Repeat once on `/unified`, whose *Sources* chips are the
  one panel designed to survive a failed round (`ActivitySourceFilter.vue:24-29`) — that comment has
  never been tested either. If any panel shows its *empty* state on a 500 instead of its error state,
  that is `F27`'s class on this side and a new finding.
- **The pie endpoints' `"Other"` row — source-certain, unobserved, backend-shaped (§10).** Settled by
  one fulfilled `route` body or a seed app under 1 % of the span; `F47` guards it locally meanwhile.

### Carried forward, unchanged

- ~~**`todo-lists/U1`**~~ — ✅ re-graded 2026-09-13 to *settled, superseded by B4/FW3*, both of which are
  closed; the whole banner flow is pinned by four tests in `todo-motivation.spec.ts`.
- **`home/U1`** — widget error/retry states never seen against a real failure. Force a 500 on one of the six
  widget endpoints (`playwright-cli route`) and confirm only that widget shows its error/Retry state, the
  other five are unaffected, and Retry re-fires.
- **`_shell/U1`** — snackbar stacking. Trigger two snackbar-worthy actions in quick succession.
- **`_shell/U2`** — fullscreen-loading strand. Navigate away *during* a slow request under throttling.

## Deferred to opportunities

**`leisure-projects/O1` — the first genuinely open `opportunity` finding of the sweep.** Every
`activity-project-profile/grid` row carries `activity.isOnTodoList` and nothing in `src/` reads it; combined
with the `materialsNeeded` already rendered on `NeedsShopping` cards, it is the raw material for the
shopping-list-to-todo handoff `P1-readiness-board.md` asked this module's author to either build or decline in
writing. Neither happened. Two separable pieces of work, and only the second is an opportunity:

- **the written decline is a small docs chore, not a feature** — `migration-revision.md` has no entry, which
  is the gap `P1` point 4 was trying to prevent. Someone should write the paragraph regardless of whether the
  feature is ever built.
- **the feature itself** goes to `docs/opportunities.md` at Phase 4, where it can be weighed against the
  cross-module map rather than decided from inside one view. Note the constraint when it is: writing through
  `core/todoList`'s `api/`/`dto/` only, per CLAUDE.md's cross-module rule.

**`tracking-settings/O1` — a mapping's `isActive` is filterable, displayed, and editable nowhere.** Both
mapping request DTOs carry it, both grids show it as a column and offer it as a filter, and neither the
create form nor `edit()` binds a control to it — so a rule can only be disabled by deleting it. Goes to
`docs/opportunities.md` at Phase 4. Two notes for when it is weighed: (1) the cheapest shape is an inline
toggle on the `isActive` column, which is a `BasicTable` `#item.isActive` slot plus a `patch` — the
`useEntityCommand` base already has `batchedToggle` for exactly this; (2) it is worth nothing until `F12`
lands, because the column it would live in is currently invisible.

**`activity-settings/O1` — role and category icons are picked in the forms, sent by the API, rendered in
the activity picker, and shown in neither settings table.** Confirmed from the column lists
(`ActivityRoleTable.vue:58-62`, `ActivityCategoryTable.vue:58-63` — Name/Text/Color, no icon) and the
wire (`GridActivityRoleEndpoint.cs` projects `Icon`). Goes to `docs/opportunities.md` at Phase 4 as a
small one. One note for when it is weighed: the cheapest shape is folding the icon into the existing
`#item.color` swatch cell (a `VIcon` inside the `VSheet`) rather than a fifth column, which keeps the
row width — and it is the same cell `F21` may already be touching on the categories table, so the two
could ship together if `F21` lands first.

`todo-lists/O1` remains `resolved` (round 4). **`history-review` filed no `opportunity` finding** — its
tally line says `opportunity 0` and the body agrees. Two things it *could* have filed as one, recorded here
so Phase 4 does not have to rediscover them: `HistoryPieChart.vue`'s `isNarrow` prop is the unfinished
half of a responsive layout (`F31` takes it), and the Detail view's bars have no click consumer at all
(`F29` names it) — a drill-*through* from a day's window to the timeline filtered to that window would be
the natural use, and the `activityClick` payload already carries the window. Neither is an opportunity
finding by the template's definition; both are noted.

**`user-settings` filed no `opportunity` finding** either (tally `opportunity 0`, body agrees). One thing
worth a line for Phase 4 so it is not rediscovered: `GET /user/google-calendar/status` returns only
`{ connected }`, and the card renders *Connect* unconditionally — once §9's second ask lands (a
`configured` flag or a `503` from `auth-url`), the card can hide or disable the row on deployments with no
Google client, which is every deployment today. Not an opportunity by the template's definition; a
follow-on to §9.

**`history-capture` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). One thing for
Phase 4 so it is not rediscovered: `TimerPresetsSection` is mounted by `TimerView` only
(`TimerView.vue:42`), while the Pomodoro view has its own preset surface (`PomodoroPresetsDialog`) and
the Stopwatch and Manual views have none — so "quick times" exist for exactly one of the four capture
flows, and the *activity* presets (duration + activity) are the raw material for a one-tap "record 30 min
of X" on the Manual view that does not exist. Not an opportunity by the template's definition; noted.

**`auth` filed one `opportunity` finding, `O1`, and it is re-graded `bug` (`FW13`, §63)** — the
"policy question" it poses was answered on the server before the unit ran, so nothing is deferred.
Two things for Phase 4 so they are not rediscovered: the forgotten-password success copy promises a
mail the server may deliberately not have sent (enumeration guard, `FW9` flags the wording as a copy
decision); and the whole signed-out surface is framework-owned, so any "what should sign-in do next"
idea — remembering the last-used e-mail without persisting the whole `User`, a *resend confirmation*
link on the forgotten-password page for unconfirmed accounts (the server answers 204 for those too,
so the user is told a reset mail went out and nothing arrives) — is a `vue_framework` opportunity,
not this app's. Neither is an opportunity by the template's definition; both are noted.

**`planner-day` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). The one its
brief handed it — *"`GET /task-planner-day-template/suggestions/{calendarId}` exists, returns 200, and
the client never calls it at all"* — is **not an opportunity, it is a defect**, and the brief's premise
is wrong in an instructive way: the client *does* call it (`DayTemplatePicker.vue:216` →
`taskPlannerDayTemplateApi.ts:38-41`), with `?date=` against a route that takes `/{calendarId}` — the
withdrawn `B5` bug, byte for byte, on the sibling endpoint — and the call is guarded out at runtime by a
mount-order accident, which is why nobody has seen the 400. Under *Needs verification*, `F45`-if-confirmed.
Nothing for Phase 4 from this unit.

**`tracking-dashboards` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). Two things
for Phase 4 so they are not rediscovered, both fallen out of `B2`'s narrowing (§79): **(1) an Android
per-app detail endpoint** — the sibling of desktop's `GET /activity-tracking/desktop/process-details`
— is the only way *"View details for Spotify"* ever shows more than total time, share and package
name. The rows exist (`AndroidSessionData`: `SessionStartUtc`, `DurationSeconds`, per package), so
session count, first/last use and mean session length are one `GroupBy` away server-side; the client
half is `DesktopPieChartSection.vue:169-188`'s watcher, copied. Not a defect — the web dashboard's
detail is also local-only — but it is the feature the label promises. **(2) The pie sections' *Other*
bucket is computed in two places at two thresholds** (server at `minPercent: 1`, web client at 3 %,
the other three clients not at all) — once §10 settles the sentinel, one threshold in one place is the
tidy-up, and it is where a *"show the tail"* affordance (expand *Other* into its members) would live.
Neither is an opportunity by the template's definition; both are noted.

No other open opportunity findings exist across the thirteen units triaged.

## Contradictions & re-grades

Everything below was checked against the **current working-tree source** this pass, by reading the file named.

### Contradictions

1. **`prompts/view-docs/backend/B6` is stale for `/leisure/projects`.** Its screenshot block shows the project
   card rendering `—` where the activity name belongs, and its point 5 asks the server to say whether it chose
   a flat `activityName` or a nested `activity`. Unit 13's evidence answers it: the name renders, and the
   response body carries a nested `activity` object (with `role` inside it). **Closed 2026-09-13** — the ask
   was updated in place and moved to `prompts/view-docs/backend/_done/B6-profile-grid-activity-name.md`, with
   the stale screenshot block struck. All three previously-open parts are answered; see *Escalations* §4 for
   the client-side parse bug it left behind.

2. **`prompts/view-docs/README.md`'s Class-1 blocker table is stale for unit 13, and probably for 11/12/16.**
   It lists `/leisure/projects?view=table` as a 500 on `sortBy: activity.name`; unit 13 rendered the table with
   exactly that sort in the URL. Strongly indicated, not proven — the one confirming request is in *Needs
   verification*. This is the single highest-leverage check in this queue: it gates three units.

3. **`leisure-projects/B2`'s suggested fix would not pass `leisure-projects/B2`'s own `Verify:` block.** A
   second `useFetchFilteredTable` instance separates the `AbortController`s (closing the correctness half) but
   still leaves two requests per filter change, and the pass condition says "exactly one". Re-graded: the
   *finding* stands as filed, the *suggested fix* does not. `F2` names a shape that satisfies both halves.

4. **`leisure-projects/A3` is a contrast defect, not a naming one** — the buttons already carry
   `:title="$t('enums.readinessStatus.…')"` at `ProjectReadinessBoard.vue:138`. Severity `a11y` is right
   (WCAG 1.4.11), but it does **not** share a root cause with `A1`/`A2` and must not be batched with them.
   Split into `F5`.

5. **`leisure-projects/P1`'s root-cause guess is wrong.** It says "same shape as A1 — a `_common` component
   issue", and A1 is a missing `aria-label`. P1 is broken attribute inheritance from a multi-root template,
   which is unrelated, and its cheapest correct fix is **app-side** (delete four dead attributes), not a
   submodule commit. Re-graded from an implied framework batch to `F6`, app-side. The finding itself stands.

6. **The counter hit-testing "contradiction" was not a contradiction** — see *Needs verification*. Re-graded
   from "two pieces of evidence disagree" to "one probable bug plus a Playwright artifact", with a one-minute
   confirmation. This also puts a caveat on `todo-routine/A1`'s retest.

7. ~~**`todo-lists/B3`'s `Status:` still reads `open` while the code is fixed**~~ — **this contradiction was
   itself wrong** (resolved 2026-09-13). The counter's own buttons did bypass `itemClicked`, but
   `itemClicked()` emitted *before* its `isMultipleCount` branch and then called `progressClicked()`, so a
   click on the row body of a counted item did both — which is B3's own repro. Three runs read the comment
   and not the control flow. Fixed for real (row body = log time only; counter = its own buttons only),
   `Status:` corrected, spec pins it.

8. **Unfiled, source-verified, belongs to a unit that hasn't run:** `BacklogTable.vue:11` passes
   `deleteConfirmationColumn="activityName"`, but `ActivityBacklogProfile` exposes `activity: ActivityInfo`
   and no flat `activityName`, and `BasicTable.vue:211` does a flat property lookup. So `/leisure/backlog`'s
   delete confirmation should read *"Are you sure you want to delete undefined?"*. This is the **third** call
   site to hit `BasicTable`'s `item.id`/missing-column fallback (after `RoutineSettingsView`, fixed, and
   `ProjectTable`, which passes no column at all and therefore shows a bare id). `todo-routine/B5`'s "Not
   changed, deliberately" note called that framework default "a poor framework-wide default" and left it;
   with three call sites it is now worth a framework batch of its own — it needs `getNestedValue` support as
   well as a better fallback. **Not batched here**: no unit owns it yet, no browser evidence exists, and unit
   11 runs next. `F3` names the one-line half a fixing session can take safely.

9. **`tracking-settings/X1`'s root-cause guess is wrong in kind, and its inference from the evidence is
   backwards.** The finding says *"more likely a stacking/paint-order issue than a clip, since the row's own
   `getBoundingClientRect` still returns plausible coordinates"* and floats a framework-wide `BasicTable`
   defect. `getBoundingClientRect` reports layout, not visibility — a clipped element keeps its rect, which
   is exactly why `elementFromPoint` at that rect finds the ancestor. The actual cause is `DataTable.vue:7`'s
   `height="0"` fill-parent contract meeting the only two consumers whose root lacks `flex-fill`
   (`DesktopMappingsTable.vue:2`, `AndroidMappingsTable.vue:2`; the working sibling
   `DesktopDistinctEntriesTable.vue:2` has it). **Severity stays `blocker`** — the view's core action is
   unreachable — but the batch is app-side and two attributes long (`F12`), and the framework half is a
   documentation gap (`FW4`), not a code defect. The finding's supporting remark that the Android
   `VCardText` lacks `flex-fill` is also a non-issue: Vuetify's `.v-card-text` is `flex: 1 1 auto` already.

10. **`tracking-settings/B1`'s suggested fix would not pass `tracking-settings/B1`'s own `Verify:` block.**
    Both suggested shapes (a Filter button calling `mappingsTable.load()`, or a deep `watch(mappingFilter)`)
    would fire a request — and the pass condition is *"with the updated filter"*, which neither delivers:
    `formData.activityId` is never copied into `mappingFilter.activityId`, and the pattern text lives on the
    view's `filter` object, not on `mappingFilter` (`DesktopMappingsTable.vue:59-69`). Three dead paths, not
    two. The finding stands; `F13` names the shape that satisfies the pass condition. Same pattern as
    Contradiction 3 — the unit agents are reliably right about *what* is broken and reliably one step short
    on *why*.

11. **`tracking-settings/B2` and `activity-settings/B6` are one defect** (`matchesPath` prefix-matching
    against a nav `to` that names a single tab), reported from two units as two different symptoms — a
    *wrong* crumb on one, a *missing* crumb on the other. Both root-cause guesses were correct. Merged into
    `F14` even though `activity-settings` is otherwise untriaged this run, per the duplicate rule; the
    `activity-settings` unit's option 1 ("register all three tab paths in `navItems.ts`") is not available —
    `MenuItem` has no `hidden` flag, so extra entries would render in the sidebar — and its option 2 is a
    framework batch. `F14`'s family-path-plus-redirect shape is the third option neither unit named.

12. **`tracking-settings/P1` is a finding about CLAUDE.md, not about the app, and the finding says so
    itself.** It reads the two documents together and concludes they agree. Kept as `polish` and given a
    docs-only batch (`F17`) rather than dropped, because the same sentence has now cost two units a
    check (`_routes.md`'s orphan table sent unit 10 after `/routine-settings` for the same reason) and
    will cost every remaining unit with a "settings" route the same detour.

13. **The `BasicTable` delete dialog** — see *Needs verification*. Not a contradiction between units; a
    contradiction between what eight call sites assume (`onDelete` → the dialog goes away) and what the
    component does (nothing). Unobserved because no unit has confirmed a delete. Raised here because it
    would change how `F13` is verified, and it is the kind of thing this document exists to notice.

14. **`activity-settings/B1` names the wrong defect.** *"The server ignores `roleIds`/`categoryIds`"*
    implies fields that exist and are unread. They do not exist: `ActivityFilterRequest.cs:27-28` has
    `RoleId`/`CategoryId`, singular, and always has. The finding's evidence is exactly right (id filter →
    unfiltered 200, name filter → works) and its root-cause guess is right in effect and wrong in kind —
    which matters, because "unread field" invites a one-line server fix and "different contract" is a
    decision about a multi-select UI. Escalation §6 carries the corrected ask. Severity `bug` stands.
    **Also a contradiction with the `A1` prompt's own close-out**, which marked item 5 fixed: the client
    half was, the feature never was.

15. **`B2` and `B3` are one defect**, and the unit half-knew it (`B3`: *"same mechanism as B2"*). Merged
    into `F18`. What the unit could not see: `useLookupTable.ts:38-52` already carries a guard written
    against precisely this writer, and its comment describes the combobox watcher by name. The guard
    compares JSON and `null` ≠ `[]`. So this is the second time the write-back has been noticed and the
    first time it is being removed rather than filtered.

16. **`B7`'s suggested fix would have disabled every delete button on both tables, and is wrong for
    categories even once that is fixed.** (a) `Role.fromJson`/`Category.fromJson` never read
    `canDelete` — `!item.canDelete` is `!undefined`. (b) `ActivityCategoryResponse.cs:26-31` documents
    category `canDelete` as *advisory* over a `SetNull` FK, existing so the grid can *say what a delete
    reclassifies*; the role endpoint enforces its flag with a 409, the category endpoint does not exist
    as a guard at all. Copying the Activities table's disabled-button pattern onto categories blocks a
    designed operation. `F19` gates roles and cascade-confirms categories. **Severity stays `bug`** but
    the category half is the graver one: today, one click plus a generic *"Are you sure?"* silently
    unfiles every activity in a category — on the seed, *"Errands"* would take ten — which is the case
    CLAUDE.md's cascade rule was written for. The unit graded the two tables as one symptom; they are
    one missing parse and two different consequences.

17. **`B5` is filed against the wrong scope.** The finding's suggested fix (widen `:tab(…)?` with a
    `beforeEnter`) treats it as an activity-settings route problem. `src/` has no catch-all route
    anywhere, so `/foo` renders the same blank pane. Re-scoped to an app-wide batch (`F20`); the
    per-family fix is rejected in the batch's *Do not change*. Severity `bug` stands — a blank page with
    no message is a bug wherever it is.

18. **`U2` is not unverified — it is answerable without a browser**, and was answered this pass from
    `DeleteActivityRoleEndpoint.cs`, `DeleteActivityCategoryEndpoint.cs` and
    `ActivityConfiguration.cs:34,42`. Re-graded to *settled from source*; the browser step is optional
    and `F19`'s verification covers it. The unit's refusal to click Delete on a system role was the
    right call for a unit agent, and the answer (409, nothing lost) shows the risk was on the other
    tab all along.

19. **`U3` is not an app defect and not unverified — it is a runbook error with a source-verified
    mechanism.** The finding's own hypothesis (b) is exactly what `JwtService.cs:38` +
    `RefreshTokenService.cs:35` do; hypothesis (a) cannot produce a 401 on `/refresh`. Re-graded from
    `unverified` to a docs-only batch (`F23`) — batching rule 5 keeps unverified *defects* out of fix
    batches, and this is a wrong sentence in `README.md` that has already cost one unit its session.
    The parallelism paragraph it corrects was written before the seed endpoint existed and has been
    wrong since the API started rotating.

20. **`A1`'s suggested fix (`:title` on the trash button) would produce two tooltips**, because the
    `VTooltip` on the wrapping `<span>` (`ActivityTable.vue:132-136`) already provides the visible one.
    Finding stands as `a11y`; the remedy is `aria-label`. Folded into `F19` rather than its own batch
    because `F19` copies that exact slot into two more tables — see `F19`'s "why `A1` is in this batch".

21. **`todo-routine/B10` is four times the size the finding says.** It names two call sites in
    `RoutinePeriodTimeline.vue`; a grep for `toLocaleDateString(undefined` finds **eight in five files**,
    all routine components in the same module (`RoutineGroupHeatmap.vue:120`,
    `RoutineGroupHistoryBody.vue:163`, `RoutineStreakFreeze.vue:69`, `useStreakFreeze.ts:88` on top of
    the two). Same cause, same fix, one batch (`F24`). The finding's severity (`bug`) and expectation
    (CLAUDE.md *Localization*) both stand. Worth saying why round 3 missed it while fixing B4/B6 on the
    same screens: that pass hunted string **literals**, and this class produces real text in every locale
    — there is nothing to grep for except the API call itself. The next localization sweep should grep
    `toLocale*(undefined` and `toLocale*([]` as well as `\$t(`.

22. **`B10`'s suggested fallback — `formatLocalized` from `_common/utils/DateTimeHelper.ts` — would
    invert the bug, not fix it.** The finding offers it "if it covers this shape". It is
    `dayjs(date).locale('sk').format(format)` (`DateTimeHelper.ts:102-103`), and every other formatter in
    that file is the same hardcoded `'sk'` (`:73-107`). A helper named *localized* that always speaks
    Slovak is a framework gap in its own right — one that would bite any consumer app running in EN —
    but it is unfiled, unobserved in a browser, and out of this pass's scope. Recorded here so `F24`'s
    fixing session does not reach for it, and so a `migration-revision.md` line gets written by whoever
    next touches that helper.

23. **`B4`'s round-5 verification note buries a finding it declined to file.** *"One column header is
    still English — Color … noted here rather than filed."* Re-graded from an aside to a `polish` batch
    (`F25`): it is the last unlocalized string on a screen whose finding is marked *fixed and verified*,
    the fix is one argument, and the locale key already exists. A verified-fixed status line that carries
    a known residual is how the residual gets lost — better a trivial batch than a footnote.

24. **`B9`'s fix is narrower than `B9`'s own root cause.** The finding correctly diagnoses *"409 has
    exactly one message across the whole app, and it is written for the optimistic-concurrency case"*,
    then fixes exactly one call site — the delete. The **create and edit** paths in the same file hit the
    same mapping for a different 409 (`UserId + LengthInDays` unique index, round 5, twice), with the
    added cost that the dialog has already closed. Not a contradiction in the finding, a contradiction
    between its stated cause and its applied scope. The finding stands; the adjacent call site is under
    *Needs verification* (rule 5 — the API 409 was observed, the on-screen message was not) with its batch
    shape pre-written, and the systemic answer is *Escalations* §7.

25. **`todo-routine` round 5 ran a mutating retest concurrently with other units, against the runbook's
    own rule, and the runbook could not have warned the agent.** *Parallelism* says mutation passes are
    serial; the round's environment note lists a `trkset` and an `activity-settings` session alongside it,
    three `B9` attempts lost to reseeds, and two `todo-lists` fixture rows toggled by clicks meant for
    another tab. The unit agent's diagnosis was right and its remedy (`-s=todo-routine`) worked — but
    `PROMPT-TEMPLATE.md` never mentions `-s=`, so the next agent starts on the shared `default` browser
    too. That is the fourth pass's `F23` (a *different* sharing mechanism — the refresh-token file), grown
    rather than duplicated. **This pass hit the same class on `_fix-queue.md` itself**: the fourth pass was
    writing its batch bodies when this one read the file, and the first edit failed on a stale read. Two
    triage passes on one file is the same operator error as two mutation passes on one account.

26. **The fourth pass's `F23` and the third pass's *Awaiting retest* caveat on `A1` are both overtaken
    by round 5's evidence and are corrected in place, not contradicted.** The `A1` row read *"the
    reachability question got worse, not better"* — written before `todo-lists/B6` made the bar a native
    `<button>` and before round 5 drove it with a real mouse; it now reads *verified*. `F23`'s own claim
    (rotation → 401 on `/refresh`) is untouched; round 5 saw a different symptom (a period vanishing on
    reload) with a different cause (reseed), which is why it is an addition to `F23` and not a counter-example.

27. **`history-review/B1`'s root cause is wrong in kind, and its suggested fix would not work.** The
    finding says the alert is *"allowed to shrink below its intrinsic content width"* and proposes
    `flex-shrink: 0`. Vuetify's `.v-alert` is `flex: 1 1` (`VAlert.css:3`) — basis **`0%`** — so the
    item has no intrinsic size in the wrap calculation to begin with; it *grows* into the ~60 px left
    over and is capped there by the inline `max-width: fit-content`. `flex-shrink: 0` leaves the basis
    at zero and the banner at 62 px. The evidence (an element screenshot, a measured rect, the full text
    in the a11y tree) is exactly right; the fix is `flex-basis: auto` (`F26`). Severity `bug` stands —
    the information is rendered and unreadable, which the finding correctly calls worse than absent.

28. **`B2` is confirmed, cites the wrong precedent, and is narrower than the code.** Its *Expected*
    points at the framework table's error-vs-empty gap (the *Needs verification* item under the B2
    settlement). The nearer precedent is one module over: `useActivityDashboard.ts:306-316` already
    holds per-panel error flags with `_silent` requests and an `!…Error`-guarded empty test, and
    `StackedBarsChart.vue:41-57` already renders a retry state on an `error` prop that
    `HistorySummaryView.vue:44-55` and `HistoryDetailView.vue:91-100` simply never pass.
    `useHistoryDashboard`'s docstring says it was *"shaped after"* that composable — the error half was
    left behind. And the finding's root-cause guess (*"fetchers null the data ref on any rejection"*)
    is true of the composable only: `HistoryTimeline.vue:156-164` and `HistoryCalendarView.vue:54-69`
    have **no `catch`** and keep the previous period's rows under the new period's heading — the exact
    failure mode the composable's own comment (`:132-134`) exists to prevent — with an unhandled
    rejection out of a watcher. Three behaviours, one batch (`F27`). Severity `bug` stands; if anything
    the timeline case is the graver one.

29. **`B3` is re-graded `bug` → `polish`, for consistency, not because it is wrong.** The evidence is a
    direct `textContent` read and the mechanism is exactly as the finding describes (`matchesPath`
    prefix, `findTrail` longest-match, no nav entry for a drill-down). But `_shell/P1` — the same class
    (`/todo-list/:id` inheriting `/todo-list`'s crumb), the same mechanism, the same fix (`F11`) — was
    graded `polish` and closed as one. Two units grading one defect two ways is the drift this section
    exists to catch; the lower grade is the one with the precedent. `F28`.

30. **`B4` is not a localization gap and must not be batched with `_shell/B1`.** The finding's guess —
    *"content resolved/stored server-side rather than through vue-i18n against the request's locale"* —
    is right that the string is stored, and wrong about what it is. `HolidayCalendar.cs:31-56` is a
    per-**country** table of native holiday names, written once into `Calendar.HolidayName` by
    `CalendarDayFactory.cs:37` with `DefaultCountryCode = "SK"`; there is no locale dimension, no key,
    and no English name that was passed over. *"Sedembolestná Panna Mária"* is the holiday's name the way
    *"Thanksgiving"* is — the shell's `B1` is app-authored text (*"Blíži sa termín"*) rendered in the
    wrong language, which is a different fact. The other pass condition (omit for non-Slovak accounts)
    cannot be met by either repo alone: `User` has no country. Re-graded `bug` → `polish` and moved to
    *Escalations* §8 as a two-part design decision (country preference; key-based names if localized
    names are wanted at all). The unit's instinct to escalate rather than fix client-side was right.

31. **`A1`'s suggested fix would name a control that does nothing on half its consumers, and its repro
    step cannot be executed.** *"Tab to or inspect a stacked-bar column"* — Tab cannot reach a `div`, so
    the gap is reachability as well as naming (`StackedBarColumn.vue:2-8` has no `tabindex` either).
    And *"add an `aria-label` per bar segment … this also fixes the equivalent gap wherever else the
    component is mounted"* assumes every mount is interactive: `HistoryDetailView.vue:91-100` binds no
    `@activityClick`, so its bars are `cursor: pointer` decorations, and a `button` role there is the
    `P1` affordance lie in reverse. `F29` adds an `interactive` prop and names the bars as `img` where
    nothing listens. Severity `a11y` stands; the batch is wider than the finding.

32. **`A2`'s root-cause guess is confirmed, and its "check whether `dayPlanner` flagged this" is
    answered: it could not have.** The click target is `CalendarGrid.vue:64-76`'s own `div`, not the
    `#day-cell-content` slot the app fills, so the batch is framework (`FW6`). `PlannerCalendarView.vue:2`
    mounts the same component with the same emit — but unit 7 has not run, so there is nothing to batch
    with yet; `FW6` closes unit 7's future finding in advance. One trap the finding could not see from
    the browser: the framework's `calendar` locale namespace is **replaced wholesale** by this app's
    (`common.en.ts:429-431`, R11), so the new label key must be mirrored app-side in the pointer-bump
    commit or it renders raw exactly where it was meant to help.

33. **`P1` has an unfiled twin, and both cards have a second, worse a11y gap.**
    `ActivityDomainCard.vue:7-9` carries `activityTracking.statColumn.viewDetails` (*"View details for
    {domain}"*) over the identical select-toggle (`ActivitySummaryCards.vue:72-73,135-136`); the history
    card was built from it (`HistorySummaryCards.vue:116`'s comment). One cause, two locale files, one
    batch (`F30`), unit 5 unrun. The second gap: both are `role="button" tabindex="0"` with only
    `@click`, and `VCard` binds no key handler (`VCard.js` — no `keydown`), so a keyboard user reaches a
    "button" that does nothing on Enter. Source-certain, unobserved (the unit clicked); folded into
    `F30` as adjacent rather than filed, because `F29` is settling the same convention for the bars in
    the same session.

34. **`P2` describes the wrong geometry, so its suggested fix has nothing to cap.** *"Legend text inside a
    donut chart's centre"* — the legend is an ECharts legend boxed to the left 58 % of the canvas
    (`HistoryPieChart.vue:59-63`), and the pie is centred at 74 % (`:87`); on the ~300 px canvas the
    Summary's `lg="6"` column leaves beside the details card, the two overlap by ~45 px and ECharts does
    not clip legend text to its box. *"Cap the in-hole legend to the hole's diameter"* would cap nothing.
    The evidence (the screenshot) is exactly right — text does run into the slices — and the finding's
    fallback (*"switch to an external legend … once entry count/name length exceeds a threshold"*) is
    close: the threshold is canvas **width**, and the dead `isNarrow` prop (`:30`, passed by `home`,
    read nowhere) was already the hook for it. `F31`. Severity `polish` stands.

35. **The unit's tally line matches its body** — `0 · 4 · 2 · 3 · 0 · 2 = 11`, verified by count. After
    this pass's re-grades it reads `0 · 2 · 2 · 5 · 0 · 2`: `B3` and `B4` moved to `polish`. The third
    unit in the sweep whose count needed no correction (after `tracking-settings` and `activity-settings`).

36. **`F24` and `F25` were applied between the fifth pass and this one, and the queue did not know.**
    Found from `git status`, not from any finding: `useRoutineDateFormat.ts` untracked, five routine
    files modified, zero `toLocaleDateString(undefined` outside the helper, `RoutineSettingsView.vue:103`
    localized. Same situation as the second pass's old `F4`–`F7` — batches become retest rows, not
    deleted. `todo-routine/B10`'s `Status:` still reads `open`; the retest sets it.

37. **Not a contradiction, recorded so nobody files it as one:** `HistorySummaryCards.vue` reads
    `activityTracking.dashboard.comparedTo`, `activityTracking.baseline.*` and
    `activityTracking.common.noDataForPeriod` — one module's component resolving another module's locale
    keys. The H5 comment at `:116` calls it deliberate reuse, and locale keys cross no import boundary
    CLAUDE.md names. `F27` and `F30` add strings near those; they should follow the existing choice
    (reuse `activityTracking.common.*` for the error copy) rather than fork it.

38. **`user-settings/B2`'s root cause is the opposite of the code, and its evidence cannot distinguish
    "silent" from "already gone".** The finding: *"a guard/`onMounted` check that redirects on any
    non-success shape without ever branching into a 'tell the user' path"*. `GoogleCalendarCallbackView.vue:18-32`
    is fourteen lines and the first thing it does on a missing `code` is `showErrorSnackbar(t('googleCalendar.connectFailed'))`,
    *then* `router.replace`. The snackbar is app-level state rendered once in `App.vue:19`, so the
    navigation does not unmount it; it is an **error** toast, so it is not closable and lasts exactly
    3 000 ms (`SnackbarComposable.ts:19,31`). The evidence is *"no error snackbar text found via `find`"*
    — a second CLI process, after a `goto` that itself waits for load and then for the app to boot,
    mount, toast and redirect. Nothing in the finding says how long that took, and the finding's own
    *"immediately show `Page URL: …/user/settings`"* is consistent with the toast having fired. Re-graded
    `bug` → **`unverified`** with a settle that cannot be late (a Playwright `toBeVisible` polling from
    `goto`). If it confirms anyway, the mechanism is not in this view. The one thing the finding is right
    to want — Google's `access_denied` deserving a different sentence from a network failure — is taste
    against the template's own bar ("plain user sense" is satisfied by *any* message), so it is the
    optional branch of `F33`, not a finding of its own.

39. **`B1`'s "none on the frontend" is wrong, and its one backend cause is three.** The client half:
    `googleCalendarApi.ts:15` posts `{ code }` while `ConnectGoogleCalendarRequest` is `(Code, State)` with
    `State` `NotEmpty()` — a validator 400 on every real callback, forever, independent of any
    configuration. `F33`. The server half is three gaps in sequence (§9): the empty `ClientId` the unit
    saw; a `RedirectUri` on port **5173** over `http` that would send a correctly-issued code to a
    port nothing listens on; and a state cookie scoped to `/user/google-calendar` under a `RoutePrefix`
    of `api`, which a browser will never send back — invisible to the API's own tests because they set
    the `Cookie` header by hand (`GoogleCalendarConnectionTests.cs:95`). The unit's instinct to
    escalate rather than patch was right; what it could not see from Google's error page is that the
    flow would fail three more times after that page was fixed. Severity `bug` stands; it is now one
    app batch and one three-part escalation.

40. **`A1` is one component, not three call sites, and the mechanism is Vuetify's, not a missing
    prop.** Every password field in the framework's user module — the three in the dialog, sign-in,
    registration, the verify dialog, the e-mail change — is `MyPasswordInput.vue`, whose
    `:appendInnerIcon` + `@click:appendInner` (`:7,:10`) is what makes Vuetify 3.12.4 generate
    `t('$vuetify.input.appendAction', label)` (`InputIcon.js:30`, `locale/en.js:76`). No prop overrides
    that; only the slot does. The finding's *"worth its own framework batch rather than folding into
    A2's"* is right for a sharper reason than it gives — `FW2` is two hand-written `VIconBtn`s with no
    name, this is a Vuetify-managed icon with a templated one — and it also has a **reachability
    invariant to keep**: the generated icon is already `role="button"`, `tabindex="0"` and Enter/Space
    operable (`VIcon.js:72-74`), so a slot replacement that drops the keydown handler would trade a bad
    name for an unreachable control. `FW7`. One trap the finding could not see: the fix's strings go in
    the framework's `user` namespace, which this app **merges** per key (`SK.ts:57`, `EN.ts:44`) — no
    mirror needed, unlike `FW2`'s `general` and `FW6`'s `calendar`. Severity `a11y` stands.

41. **`P1` counted two buttons; the module has six, and the row the unit called correct has the
    seventh.** `SecuritySection.vue:62,68` as filed; plus `SessionsSection.vue:40` (every *Revoke*),
    `ConfirmEmailView.vue:21`, `ConfirmEmailChangeView.vue:20`, `ResendConfirmationEmail.vue:5` — the
    last three on unit 15's signed-out views, which has not run; `FW8` pre-empts it. And
    `GoogleCalendarCard.vue:20` is `:color="connected ? 'error' : 'primary'"` — the *"Connect (correctly
    `primary`)"* the finding compared against is the same button in its other state, and it is the same
    defect app-side (`F34`, split by rule 1). Also worth saying plainly: the rule the finding cites is
    written in **this app's** CLAUDE.md and AGENTS.md and in no framework file — `SETUP.md:289` names the
    tokens and stops — which is a fair explanation for how a framework module drifted from it, and why
    `FW8` carries a doc sentence. Severity `polish` stands.

42. **`U3`'s premise is stale — the "are you sure, here is what you'll lose" step it says is missing is
    there.** The finding read `prompts/_done/user/A2-deletion-cliff.md` (*"source, not observed live"*),
    which describes `deleteAccount()` → `openVerifyDialog` with no intent step. `SecuritySection.vue:179-188`
    now runs `confirm()` with a warning first — the host app supplies the text through the
    `deleteAccountWarning` prop, and this app does (`UserSettingsView.vue:11` → `user.dangerZone.deleteWarning`,
    the itemised paragraph at `user.en.ts:40`); the view's own comment (`:6-9`) says it duplicates the
    Danger-zone card on purpose because *"the card can be scrolled past and the dialog cannot"*. So the
    prompt file is the pre-fix description, and the unit's draft spec `fixme` encodes it. Settled from
    source; one Cancel-only look remains, and it is a human's, not the classifier's.

43. **`U4` would have shown a raw key, and the spec's pass condition is not how the form works.**
    `user.passwordsDontMatch` (`MyNewPasswordInput.vue:36`) is defined in none of the eight locale files
    that could carry it — grep finds the usage and nothing else — so the mismatch line the unit wanted
    to observe reads `user.passwordsDontMatch` in both languages, on this dialog and on registration.
    Folded into `FW7` as adjacent (two lines, same module, same retest). And *"does not enable Confirm"*:
    the button is never disabled; `ChangePasswordForm.vue:50-51` validates on Confirm and returns.
    Assert on the absent `POST`, not on a disabled button.

44. **`U5` is the theme toggle's code path with one more line.** `setPreferences` (`authStore.ts:33-36`)
    is the method the unit exercised live for `theme`; the locale rides the same `Object.assign` and the
    same deep `currentUser` watcher in `App.vue`, which applies theme at `:88-93` and locale at `:94`.
    The unit's *"needs a session where that classifier is deliberately allowed"* is one route; the other
    is that the seed restores `locale: "EN"`, so the "must stay English" concern is a reseed, not a
    reason to leave it unverified.

45. **The unit's tally line matches its body** — `0 · 2 · 1 · 1 · 0 · 5 = 9`, verified by count. After
    this pass's re-grade it reads `0 · 1 · 1 · 1 · 0 · 6`: `B2` moved to `unverified`. The fourth unit
    whose count needed no correction.

46. **Not a contradiction, recorded so nobody files it as one:** the `/user/settings` page carries two
    delete-related surfaces — the framework's *Delete account* button in the Security card and this
    app's *Danger zone* card at the bottom, which is informational (what is destroyed, the export
    nudge, and `user.dangerZone.whereToDelete` pointing back up to the Security card). The unit's
    inventory lists both correctly; they are one flow with the explanation split from the trigger by
    design, not a duplicate control.

47. **Concurrent write, again.** A `todo-routine` fixing session was writing `B11`/`P2` closures into
    this file while this pass ran (the hunk under *Found in the fifth pass*, not authored here). Same
    collision class as the fourth/fifth passes; every edit in this pass anchors on text no other
    section contains, and none of the `todo-routine` sections were touched. If the two commits race,
    the `todo-routine` one wins on its own sections and this one on `F33`/`F34`/`FW7`/`FW8`/§9/§38–§47.

48. **`history-capture/P1` says the Pomodoro view logs too; it cannot.** *"both mount this component
    while idle"* — `TimerPresetsSection` has exactly one importer, `TimerView.vue:42,65`.
    `PomodoroTimerView.vue` mounts `PomodoroSetupPanel` (`:20`) and `PomodoroPresetsDialog` (`:63`), and
    neither imports it. The finding's own *Evidence* line names only `/activity-history/timer`, so the
    Pomodoro sentence is an inference presented as an observation. Severity `polish` stands; the batch
    (`F38`) grows the other way — to the two other app-side `console.log`s and the `no-console` rule
    that is configured `off` with an allow-list.

49. **The unit's `inventory.md` cites two finding ids its `findings.md` does not contain.**
    `inventory.md:79-80` says *"see finding A1"* for the chips' missing role/name and the phantom
    close button; `inventory.md:116` says *"see finding B4"* for the `console.log`. The findings file
    has no `A1` and no `B4` — its tally is `a11y 0`, and the console line is `P1`. So either the
    findings were renumbered after the inventory was written and the cross-references were not, or an
    `A1` was drafted and dropped. The observation behind `A1` is real (a clickable `VChip` is a
    `span[tabindex=0]` with Enter/Space handling and **no `role`** — `VChip.js:169-174,195-197`) and it
    is folded into `F37` as a one-attribute adjacent, since the fix touches the same two tags. The
    inventory's two references should be corrected to `F37` / `P1` when the unit's docs are committed —
    they are untracked (§57).

50. **`B1`'s mechanism is right and its extent is wrong by two keys — and the mechanism is the
    finding.** The one-line fix is correct as far as it goes. But the SK mirror's own comment
    (`common.sk.ts:149-154`) says how the block was built — by reading what `DateRangePicker` and
    `MonthYearPicker` resolve — and that method is why `TimeDisplay`'s key was missed and why
    `TimeRangePicker`'s `general.from` / `general.to` (`:9,59`, range mode) are missing too: the
    diff this pass ran shows `general` short by **26** framework keys in both locales, `dateTime` by
    one, `controls` and `app` by none. Two of the 26 are reachable in this app today (one click on a
    toggle that persists to `localStorage`); two more are the keys `F4` plans to use. Four leaks
    (R5, R6, R11, `B1`) from one method is a method problem. `F35` recommends replacing the mirror
    with the namespace merge `SK.ts:57` already uses for `user`, and carries the finding's one-liner
    as the fallback. Severity `bug` stands.

51. **`B2` is eight tags in six files, not three call sites — and the server's own default data
    proves the finding's premise.** The finding names `TimerView`, `PomodoroDurationCard` and
    `AddActivityManuallyForm`; the module also has `EditActivityHistoryForm.vue:8`,
    `TimerPresetDialog.vue:15` and `PomodoroPresetFormDialog.vue:75,84,93`, none passing
    `allowedMinutesSelected`. The finding's inference from the seeded *Short Sprint* (*"the data model
    has no 5-minute floor"*) is confirmed at the source — `PomodoroTimerPresetSeeder.cs:46-50`,
    `ShortBreakDuration = 3`, per-user default — and it is stronger than the finding used it: the
    preset **editor** it did not list is the one place the 3 can be destroyed and never re-entered.
    The convention the fix needs is already in the app (`SuggestedTimeFormField.vue:15` passes `"1"`
    for a typed duration), so this is not a framework-default decision — that is left to the
    `FW10` question under *Needs verification*. Severity `bug` stands.

52. **`B3` undersells itself: the close button is worst in the mode it was built for.** The finding
    tests the button outside edit mode (blank, focusable, hides the chip) and describes edit mode as
    the place *"the intended pencil icon shows inside it"*. It does — inside a `<button>` whose
    Vuetify handler `stopPropagation()`s (`VChip.js:136-141`), so clicking the pencil hides the chip
    and the chip's `@click="openEditDialog"` never runs. The unit's inventory (`:82`) recorded edit
    mode as *"turns each chip's close icon into a pencil"* and did not click one. Source-certain; the
    batch's verification runs it. The finding's suggested fix has two options and the second
    (*"bind `closable` explicitly and give it the edit-mode click handler"*) is rejected — it keeps a
    control named "Close" that opens an editor; `appendIcon` removes the button in both modes.
    Severity `bug` stands.

53. **`U1` is two claims with different standing, filed as one.** *"Not disabled during the save"*
    — source-certain: no flag, no `:loading`, no guard, one code path (`AddActivityManuallyView.vue:36-38`,
    `AddActivityManuallyForm.vue:63-82`). *"Not reset afterward"* — true as a description of the code
    (no `@saved` listener), but the *expectation* that it should reset points at *"the other three
    views' Stop → confirm → session-cleared pattern"*, which is a session ending, not a form
    submitting; no intent source in `prompts/_done/activity-history/` says what the form does after a
    save. Kept `unverified` as filed (rule 5 — the mutation pass is where the two `POST`s get counted),
    with the split written into its *Needs verification* row so the eventual batch guards the submit
    and *decides* the reset rather than inheriting it.

54. **The unit's tally line matches its body** — `0 · 3 · 0 · 1 · 0 · 1 = 5`, verified by count.
    Nothing re-graded, nothing merged, nothing dropped; the fifth unit whose count needed no
    correction. The draft spec's four `test.fixme` stubs map one-to-one onto `B1`–`B3` and `U1`, and
    each stub's comment restates the finding accurately.

55. **Cross-batch: `F4`'s suggested keys do not exist in this app.** `F4` (third pass, unit 13) says
    *"a localized `aria-label` … (`general.yes`/`general.no`, …)"*. Both are among the 26 `general.*`
    keys the app's wholesale-replacing namespace lacks (§50), so the batch as written would render a
    raw key in both locales — the R5/R6/R11 pattern, pre-empted this time. A one-bullet warning is
    added to `F4` in place; `F35`'s merge makes the keys real, its fallback patch does not.

56. **Two stale sentences about `EN.ts`, one in CLAUDE.md.** CLAUDE.md's *Localization* bullet says
    *"`EN.ts` does not spread the framework's Slovak-only `common` at all"*, and `EN.ts:18-23` says the
    framework's `common.en.ts` is *partial* (*"only `notifications.*` and `reminderPreference.*`"*). Both
    predate `e04dad2` (framework, 2026-09-11, *"complete the English mirror of the framework `common`
    bundle"*): `EN.ts:27` spreads `common.en.ts`, and this pass's diff shows its `general`, `dateTime`
    and `controls` are as complete as SK's. Neither sentence changes what `F35` has to do — the app's
    namespaces still replace the framework's wholesale in both locales — but both will mislead the
    next person who reads them before a mirror, so `F35` corrects them in the same commit.

57. **Concurrent write, a third time — and the unit's documents are untracked.** This pass's first
    edit reported the file modified on disk between the read and the write; the diff against `HEAD`
    shows only the seventh pass's own uncommitted hunks plus this pass's, so nothing was lost, but the
    seventh pass's *"commit them with this queue"* (its addendum under *Coverage tracker note*) has not
    happened: `docs/views/history-review/`, `docs/views/user-settings/`, `docs/views/history-capture/`
    and their three draft specs are all still `??` at `c4b984ca`, and `units/04-history-capture.md` is
    still in `units/`, not `units/_done/`. Every edit in this pass anchors on text no other section
    contains.

58. **`X1` is half of the blocker, and the half it names is the smaller one.** The finding is exact
    about what it saw — the serializer 400 naming `recaptchaToken`, reproduced for a real and a fake
    address — and its fix (send the token) is necessary. But the API read shows where the flow goes
    *after* that 400 is gone: `BaseForgotPasswordEndpoint.BuildResetLink` mails
    `{PAGE_URL}/reset-password?userId=…&token=…` and `BaseResetPasswordEndpoint` listens on
    `POST /auth/reset-password`, while `userRoutes` has five records, `docs/modules/user.md:8` says
    five, and a grep of `src/` for `reset-password` finds two button-label strings. **There has never
    been a reset-password view in this app.** The one-line fix moves the user from a 400 on the form
    to `F20`'s blank page on the mailed link. Also corrected: the action name is `forgot_password`
    (the finding guessed `'forgotten-password'`; Google compares it exactly), and the success status
    is 204, not "2xx". Severity `blocker` stands and the batch (`FW9`) is a view, not a line.

59. **`B3`'s headline is wrong and its residue is real — re-graded `bug` → `polish`, folded into
    `FW9`.** *"Everything else is silently logged"*: no — `axiosConfig.ts:220-265` snackbars every
    status that arrives with a response, which is the *"One or more errors occurred!"* the unit itself
    saw for the 400. And the branch the finding wants kept as "the special case" — 404 → *Email not
    found* — is a status the server **never returns** (`BaseForgotPasswordEndpoint.cs:15-18,63-68`:
    204 for unknown, unconfirmed and reCAPTCHA-failed alike, to avoid an enumeration oracle), with a
    hardcoded English literal on it. What survives is the case the finding marked "not independently
    reproduced": no response at all → `error.response.status` throws `TypeError` inside the `catch`,
    the `.finally` hides the spinner, nothing is shown. Real, rare, and already solved three files
    over (`LoginView.vue:196-205`). The finding's suggested fix (`extractServerMessage(error) ??
    httpErrors.unexpected` on every status) is rejected — it would put a second snackbar over the
    interceptor's on every failure.

60. **`B4`'s premise — that `ConfirmEmailChangeView` is the model — is wrong; both views have the
    defect.** The finding's evidence is two screenshots, and it reads the sibling's as having
    *"persistent body text"*. The template (`ConfirmEmailChangeView.vue:15-25`) has one `VBtn` and
    no text in its error branch; the red bar in `confirm-email-change--no-token-error.png` is the
    **snackbar**, captured inside its three seconds, while `confirm-email--no-token-error.png` was
    captured after its own had gone. Same defect, both views, the fix doubles (`FW12`). Severity
    `bug` stands. Three adjacent, source-certain items in the same forty lines went into the batch:
    the unguarded `query['userId']` that produces `/resend-confirmation-email/undefined` (the real
    mechanism behind `B5`'s repro), `color="main"` on both success buttons (no such theme token), and
    `SnackbarComposable.ts:28`'s own `|| 'Error'` fallback as the literal one level below `B5`'s.

61. **`B1` is one behaviour in two repos, and the framework already half-implements it.** The finding
    lists `router.ts:98` (app) and three framework handlers as one fix. Rule 1 splits them (`F39`,
    `FW11`) — and the split is not bureaucratic: `axiosConfig.ts:175` has been writing
    `?redirect=<fullPath>` on forced logout since before this sweep, so the *contract* is the
    framework's and the app's guard is merely a second writer. The read half (`FW11`) is therefore
    useful on its own (it fixes the expired-session case today); the write half (`F39`) is not
    (a query no view reads). Ship in that order. The finding's open-redirect caveat is adopted as a
    helper with a path-only rule; its suggested `(route.query.redirect as string) || '/'` would
    accept `https://…` and `//…`.

62. **`P2`'s mechanism is wrong; the symptom, severity and file are right.** *"A request already in
    flight simply completes after the token is gone"* — but on the Home dashboard **nothing creates
    `routineReviewStore`** (its only consumers are `useRoutineWeeklyReview.ts`, which `home/` never
    imports, and `useSessionReset.ts`). The store is born at logout: `App.vue:104-109` →
    `resetAppState()` → `useRoutineReviewStore()` **first call** → `createAppPinia.ts:13-14` calls
    `ensureLoaded()` → `GET /routine/settings` fires *after* `POST /auth/logout` → 401. Not a race
    with a slow request; a deterministic consequence of "creating a store loads it", which is why
    the unit saw it twice for two. The suggested `AbortController` is rejected — there is no
    in-flight request to abort. The fix is the guard CLAUDE.md already names for
    `activityOptionsStore` plus a `catch`, since the method also violates the "non-rejecting" half
    of the `ensureLoaded` contract (`F40`). Severity `polish` stands.

63. **`O1` is re-graded `opportunity` → `bug`.** The finding frames Login's fail-open and
    Registration's fail-closed as *"neither behaviour is wrong on its own"*. The server disagrees:
    `Program.cs:240-248` swaps in `LocalAlwaysPassRecaptchaService` when the seed gate is open, and
    that class's doc (`:11-16`) is written on the assumption that *"the client sends an empty
    token"*; `UseRecaptchaHandler.ts:74-77` makes the same commitment from this side (*"the server
    as the only authority on whether a token is acceptable"*). Registration's `if (!recaptchaToken)
    return` is the one place the client overrules that — and its cost is measurable: `U1`, `U5` and
    unit 14's 2FA enrolment (`user-settings/U1`) are all "could not exercise" because of those five
    lines. A `bug` with a two-unit footprint, not a design choice to weigh at Phase 4 (`FW13`). The
    same read found the adjacent `catch` that turns `409 "User already exists with this email."`
    into *"changed by someone else"* — source-certain, unobservable until the guard is gone.

64. **`U6` is settled as no defect.** The unit's inference chain was right up to its last link:
    `showFullScreenLoading()` on mount, no hide in `catch`, interceptor hides only on success. It
    stopped one composable short — `SnackbarComposable.ts:43-46` hides the loader as the first thing
    `showSnackbar` does, and both `catch` blocks call `showErrorSnackbar`. Three live attempts that
    never showed a spinner were not inconclusive; they were the behaviour. Dropped from the count of
    open items; `FW12` adds the explicit hide so the next reader does not have to find this.

65. **`B2` and `A1` are duplicates of `FW7`, and they upgrade its evidence.** `A1` is `user-settings/A1`
    seen on the two signed-out forms (same component, same Vuetify-generated name, same wrong
    root-cause guess about a missing `aria-label` that the seventh pass already corrected). `B2` is
    `FW7`'s adjacent — the raw `user.passwordsDontMatch` the seventh pass predicted from source and
    could not type to see — now observed with a screenshot and the intlify console line. Merged into
    `FW7`'s *Closes*; no new batch. The unit's cross-reference to `ChangePasswordForm` is right and
    already in `FW7`.

66. **`FW8`'s pre-emption worked — first time in the sweep.** The seventh pass grew `user-settings/P1`
    from two buttons to six, three of them on unit 15's views, and wrote *"its agent should not file
    them again."* Unit 15's inventory records the buttons and its `findings.md` has no colour-token
    finding. A pre-empt that saves a unit a finding is the queue doing its job; recorded so the
    pattern is kept.

67. **`U4` is settled from the API without a lockout.** Threshold **5**, duration **5 minutes**
    (`IdentityServiceExtensions.cs:128-129`), message `"Too many failed login attempts. Try again in
    {m}m {s}s"` (`PasswordSignInFlow.cs:92`). One dead line found on the way: `LoginView.vue:186`'s
    `generalErrors.includes('User locked out for')` is an exact-element match against text the server
    never sends — harmless, because the `!handled` fallback shows `generalErrors[0]`, which is the
    same text. The unit's refusal to lock out the shared seeded account was the right call.

68. **The unit's tally line matches its body** — `1 · 5 · 1 · 3 · 1 · 6 = 17`, verified by count.
    Two findings merged as duplicates (`A1`, `B2` → `FW7`), one dropped as no defect (`U6`), one
    severity raised (`O1`), one lowered (`B3`), two folded into same-file batches (`P1` → `FW13`,
    `P3` → `FW11`). The draft spec's eight `test.fixme` stubs map onto `B1`, `U4`, `P1`, `B2`, `U1`,
    `X1`, `B4` and `B5` (`auth.draft.spec.ts:50,56,91,97,104,121,155,166`), and each comment restates
    its finding — including `U1`'s, which names `O1` as the reason it could not run.

69. **Four unit directories are now untracked, and one unit file has moved without a commit.** At
    `6aac48bb`, `git status` shows `docs/views/auth/`, `docs/views/history-capture/`,
    `docs/views/history-review/`, `docs/views/user-settings/` and their four draft specs as `??`;
    `prompts/view-docs/units/{03,14,15}-*.md` are `D` with their `_done/` copies `??`; and the
    tracker row `_routes.md:130` for unit 15 is **☐**. The seventh and eighth passes asked for this
    to be committed with the queue; it has now been asked three times. Every edit in this pass
    anchors on text no other section contains, as before.

70. **Half of `B5` is not a defect, and the other half's "no visible error" is a missed toast.**
    The task case: `PlannerTaskLinkView.vue:66-88` wraps both reads in `try/catch`, sets `failed`,
    and its comment says the interceptor has already surfaced the failure. There is no unhandled
    rejection; the `AxiosError` line the unit read is `axiosConfig.ts:212-214`'s
    `console.error('ERROR: ', error)`, printed for every non-cancelled failure on purpose. The pass
    condition *"no uncaught exception"* would require silencing the interceptor — rejected. The date
    case stands: `DayPlannerView.vue:211`'s `Promise.all` has no `catch`, so the 400 is a genuine
    unhandled rejection at the `onMounted` boundary and the header goes blank. But the interceptor's
    400 branch (`:227-229`) shows the server's own *"Date must be in dd-MM-yyyy format."* for three
    seconds — the §38 pattern; the persistent blank header is the defect, not the absence of a
    message. The finding's `Where` (`:132`) is the composable destructure; the await is `:211`. A
    second site with the same shape found on the read (`useDayNavigation.ts:71-84`) and folded into
    `F43`. Severity `bug` stands for the date half; the task half is dropped from the open count.

71. **`B2` is three labelled call sites, not one — and unit 3 recorded the defect as the truth.**
    `CopyDayForm.vue:5` is the one the unit saw. `HistoryDateRangeSelector.vue:17,25` pass *From* and
    *To*; both render "Date", and in custom-range mode they sit side by side under the same name.
    `history-review/inventory.md:20` lists the summary's field as `textbox "Date"` without comment, and
    `history-review.draft.spec.ts:28` asserts `getByRole('textbox', { name: 'Date' })` — a defect pinned
    as expected behaviour, which `FW15`'s pointer bump must correct or the fix fails its own suite. The
    same binding order swallows `hideDetails` (the comment at `:31-32` already knows) and `style`
    (`PlannerTaskDialog.vue:26`). The finding's first suggested fix is adopted; its second is rejected
    unless widened. Severity `bug` stands.

72. **`A1` names the wrong file.** `CalendarGrid.vue` has no `VIconBtn`; the arrows are
    `MonthYearPicker.vue:3-8,29-34`, reached through `DateRangePicker`. The unit's evidence (an eval on
    the two rendered buttons) is unaffected — it measured the DOM, not the file. Merged into `FW2` on
    its own root-cause guess (*"same class as shell A2"*); not `FW6`, which is the same *file the unit
    named* but a different defect. Two more unnamed chevrons in `MyDateInput.vue` (prev/next day) found
    in the file `FW15` had open — same batch, unfiled.

73. **`B3`'s suggested fix cannot be done where it points, and P7 predicted this.** *"Extend
    `useCalendarUrlState.ts` to also encode the days-to-show filter and … Anchor/Date-from/Unit/Quantity"*
    — none of that state is readable from the app: `CalendarGrid.vue:167` and
    `DateRangePicker.vue:130-152` hold it in private `ref`s, and the one exposed handle (`dateRange`)
    is coerced back to a month by `DateRangePicker.vue:269-274`. P7 wrote *"if it cannot accept an
    initial range, do the app-side workaround AND record the gap in migration-revision.md"*; the
    session that ran P7 did neither for these fields, and `migration-revision.md` §5's later note
    (*"the framework grid holds no state to widen"*) is true of the month and false of these two.
    Split by rule 1: `FW16` (expose) → `F44` (encode). Severity `bug` stands — P7 and CLAUDE.md both
    source the expectation. Unit 3 recorded the identical gap on the History calendar and declined to
    file it (`history-review/inventory.md:100-104`); that view is not batched, and `FW16` makes it
    possible if someone wants it.

74. **`B4` is `history-review/B4` from the other consumer.** Same two strings, same endpoint family,
    same wrong batching instinct (*"batch with shell B1"*), same re-grade for the same reason (§30):
    `bug` → `polish`, merged into *Escalations* §8, no new entry. The sixth pass's API read
    (`HolidayCalendar.cs:31-56`, `CalendarDayFactory.cs:37`) answers this finding without re-reading
    anything.

75. **A known, live framework defect the unit was told about, re-confirmed, and did not file — batched
    from the brief and the spec.** The `ActionBar` occlusion (`FW17`) is documented in
    `e2e/tests/dayPlanner.spec.ts:203-224`, in `units/_done/07-planner-day.md` item 2, and in
    `planner-day/inventory.md:144` (*"re-confirmed visually"*). Three documents, two observations,
    zero owners. The brief said *"do not re-derive"*, and the unit read that as *"do not file"*; the
    queue is where it should have landed either way. Evidence is observed; it is a batch, not a
    *Needs verification* row.

76. **The brief's "opportunity" is a defect, and its premise is inverted.** *"`GET
    /task-planner-day-template/suggestions/{calendarId}` exists, returns 200, and the client never
    calls it at all"* — `taskPlannerDayTemplateApi.ts:38-41` calls it, with `?date=` against a
    `/{calendarId}` path, the exact bug of the withdrawn `B5`; it is invisible only because
    `DayTemplatePicker.vue:212-221` reads `calendar?.date` once at a mount that precedes the calendar.
    Under *Needs verification* as `F45`-if-confirmed with the ten-second repro (Routine → Day Details)
    and the fix shape; not batched, per rule 5, because no one has seen the 400.

77. **The unit's inventory cross-references are off by one throughout.** `inventory.md:20` says *"see
    A1"* (right), but `:42` *"see B3"* is the holiday strip (findings `B4`), `:56` *"see B2"* is the
    range state (`B3`), `:66` *"see B1"* is the date label (`B2`), `:119,151,177,184` *"see B4"* is
    the AxiosError (`B5`), and `:189,216-217` *"see B5"* is the tab state (`B6`). Consistent with `B1`
    (the stacking tabs) having been inserted at the top of `findings.md` after the inventory was
    written. Same class as §49; nothing to fix in the queue, but a reader of the inventory should add
    one to every `B` it cites. The tally line (0·6·1·0·0·0 = 7) matches the body. The draft spec's
    six `fixme`s map onto `B3` (×2), `B4`, `B5` (date half only — correctly), `B1` and `B6`
    (`planner-day.draft.spec.ts:44,45,48,87,134,137`); `B2` and `A1` have structural tests that
    encode the defect (`:35-40`'s positional fallback for the unnamed arrow) rather than a `fixme`,
    which is the right call for an a11y name — the locator improves when the fix lands.

78. **`docs/views/planner-day/` and `e2e/tests/planner-day.draft.spec.ts` are untracked; the unit
    file's move is staged; the tracker row is ☐.** `git status` at `6aac48bb`: `docs/views/planner-day/`
    `??`, `planner-day.draft.spec.ts` `??`, `units/07-planner-day.md → units/_done/07-planner-day.md`
    staged as `R`, `_routes.md:122` **☐**. Fifth unit in this state (with 2, 4, 13, 15). `_routes.md:102`'s
    open question for this unit — whether `/day-planner/settings` is reachable from `/user/settings` —
    is answered: `moduleSettingsLinks.ts:24` links it by route name and the settings view links back
    (`DayPlannerSettingsView.vue:8-13`); the row can be struck the way unit 3's was. Every edit in this
    pass anchors on text no other section contains, as before.

79. **`B2`'s pass condition asks for data the Android contract does not carry.** *"At minimum its
    active seconds and session count, matching what `AndroidAppSummaryDto` already carries
    client-side"* — `AndroidAppSummaryDto.stat` is `{seconds, averageSeconds, percentChange}`
    (`ActivityStat.ts`), a baseline comparison, not a session count; `AndroidAppPieData` is
    `{packageName, appLabel, seconds, totalSeconds}` and the server writes the same `Sum` into both
    (`AndroidPieChartEndpoint.cs:57-58`), so there is no *active* seconds distinct from total either.
    `AndroidPieTotals.totalSessions` is span-wide (`:49`). The defect is exactly as observed — no
    branch on the selection, no request, no panel change — and the mechanism guess (*"copied the
    simpler pattern and never wired the selection branch"*) is right; the *fix* the finding suggests
    (*"mirroring `selectedDomainDetails`"*) is right in shape and can only show what is on the page.
    `F47` is that, narrowed; the session-count half is under *Deferred to opportunities* as the Android
    `process-details` sibling. Severity `bug` stands: a card that says *View details* and a URL that
    says `?selected=` for a selection nothing displays is a defect at any data width.

80. **`F30` (sixth pass) pre-judged this module's domain card and got it wrong twice; unit 5 is the
    witness.** `F30` said `ActivityDomainCard`'s *"View details for {domain}"* is *"the same
    select-toggle"* as the history card's and that *"both cards … [have] no key handler"*. Unit 5
    observed the opposite of the first (`inventory.md:29,147,153` — on web the click *"opens the
    detail panel"*, on desktop it fires `process-details` and opens one, on unified `selectedDetails`
    renders), and the source refutes the second: `ActivityDomainCard.vue:10-11` has carried
    `@keydown.enter` / `@keydown.space.prevent` since `5165e2ed` (2026-08-20). The sixth pass read
    `VCard.js` for what the *wrapper* adds and did not read the card. The label is a lie on **one**
    dashboard — Android — and that is `B2`/`F47`, which makes it true. `F30`'s `activityTracking`
    scope, files, locale edit and verification step are struck; its history half stands unchanged.
    The lesson is the one every pass records for units, now recorded for a pass: an "unfiled twin"
    inferred from a copied component is a guess until the copy's *behaviour* is read, not its markup.

81. **The Android dashboard carries a two-metric assumption its source cannot satisfy — two controls,
    neither filed, one of them observed in the unit's own spec.** The inventory records *Total /
    Active / Background* as a shared control that *"changes which metric the pie chart slices
    represent"* (`:31`) and lists nothing differing on Android (`:185-188`); `AndroidPieChartSection.vue:114-127`
    never reads `viewMode`, so on that view it changes nothing. The draft spec's comment at `:103-105`
    *observes* the timeline legend's *Background* entry on Android and scopes an assertion around it
    rather than filing it — the same "worked around, not filed" shape as unit 7's positional arrow
    locator (§77). Both are `F48`. The unit's own reading of the summary cards (*"the card layout
    correctly omits the column rather than showing a fake `0m`"*, `:193`) is the standard the pie
    radio and the legend fail.

82. **`U1`'s reason for being unverified is false, and the fix is one command the sweep already
    uses.** *"No network fault injection available via `playwright-cli`"* — `route --status=500`
    exists (`SKILL.md:150`), the README's decision log names it, and unit 3 filed `history-review/B2`
    with it three passes ago. `U1` stays `unverified` (nobody ran it), but its *What would verify it*
    is rewritten under *Needs verification* to the command, and merged with `F27`'s verification
    session because `F27` copies the very pattern `U1` says has never been watched failing. Not a
    seed gap, not a tooling gap — an unread reference.

83. **`A1`'s extent is app-wide, and the unit's root-cause guess is exactly right.** *"Likely
    Vuetify's `VChip`/`VChipGroup` default rendering … worth checking whether other usages have the
    same gap"* — `VChip.js:195-197` (3.12.4) writes `tabindex` and a keydown and no ARIA; a tag-level
    census of `src/` finds 15 chip-controls in seven files, six of them state-bearing
    (`TodoListFilters.vue` ×2 groups, `RepeatingTaskDialog.vue` ×3 sites, `BasePlannerTaskDialog.vue`)
    that units 9 and 7 walked past. None in `_common` — the framework's chips are all labels — so
    `F49` is app-side and does not trip rule 1, and it is not a `componentDefaults` change (rule 4)
    because the right role differs per site. The first draft of `F49` in this pass claimed *"every
    other `VChip` in `src/` is a label"*; that was wrong by fourteen and was corrected before the
    batch was finished — recorded here because the correction is the census the batch now carries.

84. **`docs/views/tracking-dashboards/` and `e2e/tests/tracking-dashboards.draft.spec.ts` are
    untracked; the unit-file move is staged; the tracker row is ☐.** `git status` at `6aac48bb`:
    `docs/views/tracking-dashboards/` `??`, the spec `??`, `units/05-tracking-dashboards.md →
    units/_done/05-tracking-dashboards.md` staged as `R`, `_routes.md:120` **☐**. Sixth unit in this
    state. The unit's tally line (0 · 2 · 2 · 0 · 0 · 1 = 5) matches its body; its inventory
    cross-references (`:32` → B1, `:148` → A2, `:188` → B2, `:71,128,170,210` → A1) are **all correct** —
    the first unit since 3 whose references need no off-by-one note (§49, §77). Its draft spec maps
    `fixme`s to `B1`, `B2`, `A1`, `A2` (`:114,126,134,142`) one-to-one. Every edit in this pass anchors
    on text no other section contains, as before.

### Re-grades

| finding | was | now | why |
| --- | --- | --- | --- |
| `leisure-projects/A3` | `a11y`, implied batch with A1/A2 | `a11y`, **own batch** (`F5`) | Contradiction 4 — contrast, not naming |
| `leisure-projects/P1` | `polish`, framework-shaped guess | `polish`, **app-side** (`F6`) | Contradiction 5 |
| `leisure-projects/A1` | own framework finding | merged into **`FW2`** with `_shell/A2` | Same cause, same repo, one commit |
| *(counter hit-testing)* | unresolved contradiction | ✅ confirmed `bug`, **fixed 2026-09-13** as `todo-lists/B6` | Contradiction 6 |
| `todo-lists/U1` | unverified | ✅ **settled 2026-09-13**, superseded by `B4`/`FW3` (closed) | Its own round-3 note settles it; the failure was `FW3` |
| `todo-routine/A1` | code-fixed, awaiting retest | code-fixed, **keyboard reach now real** — the bar is a native `<button>` (`todo-lists/B6`) | The label used to land on a non-focusable `progressbar` |
| `tracking-settings/X1` | `blocker`, framework-shaped guess | `blocker`, **app-side** (`F12`) + docs-only framework note (`FW4`) | Contradiction 9 — a missing `flex-fill`, not a paint bug |
| `tracking-settings/B1` | `bug`, two dead paths | `bug`, **three** dead paths; suggested fix rejected (`F13`) | Contradiction 10 |
| `tracking-settings/B2` + `activity-settings/B6` | two findings, two units | merged into **`F14`** | Contradiction 11 — one matcher, one nav `to` shape |
| `tracking-settings/B3` | `bug`, filter only | `bug`, **filter + page + sort** (`F15`) | Same CLAUDE.md rule names all of them; one edit |
| `tracking-settings/P1` | `polish`, "flag either way" | `polish`, **docs-only batch** (`F17`) | Contradiction 12 |
| `tracking-settings/U1` | `unverified` | `unverified`, **source-certain**, wired by `F13`, retested after `F12` | Rule 5 keeps it out of the batch; the code path has no other possible outcome |
| `activity-settings/B1` | `bug`, "backend ignores the fields" | `bug`, **escalation §6** — a contract that never matched | Contradiction 14 |
| `activity-settings/B2` + `B3` | two findings | merged into **`F18`** | Contradiction 15 — one writer, two symptoms |
| `activity-settings/B7` | `bug`, one fix for both tables | `bug`, **two behaviours in one batch** (`F19`); suggested fix rejected | Contradiction 16 — DTO gap + advisory vs enforced |
| `activity-settings/A1` | `a11y`, own fix | `a11y`, folded into **`F19`**; `:title` → `aria-label` | Contradiction 20 |
| `activity-settings/B5` | `bug`, activity-settings scope | `bug`, **app-wide** (`F20`) | Contradiction 17 |
| `activity-settings/U2` | `unverified` | **settled from source**, answered inside `F19` | Contradiction 18 |
| `activity-settings/U3` | `unverified` | **docs-only batch** (`F23`), mechanism source-verified | Contradiction 19 |
| `activity-settings/U4` | `unverified` | `unverified`, retest **after `F18`** | The finding's own candidate cause is what `F18` removes |
| `todo-routine/A1`, `B3`, `B4`, `B6`, `A3` | code-fixed, awaiting retest | ✅ **verified in a browser** (round 5; B4/B6 in SK) | Rows closed in *Awaiting retest* |
| `todo-routine/B10` | `bug`, 2 call sites / 1 file | `bug`, **8 call sites / 5 files** (`F24`) | Contradiction 21 |
| *(unfiled — `B4` round-5 note)* | aside inside a verified finding | `polish`, **own trivial batch** (`F25`) | Contradiction 23 |
| `todo-routine/B9` | code-fixed, listed nowhere in this queue | code-fixed, **awaiting retest**, never observed either way; its create/edit sibling is source-certain under *Needs verification* | Contradiction 24; the retest is merged with the `BasicTable` dialog check |
| `todo-routine/P1` | awaiting retest, both locales | **EN verified**, SK half outstanding | Round 5 was re-scoped mid-check |
| `todo-routine/A2` | awaiting retest | still source-only — no stepped routine item in the seed | Seed-data table gains a row |
| `todo-routine/U1`, `U2` | `unverified`, seed gap | ✅ **verified live and closed** (round 6, `e2e-v4`) | 2026-09-14: the API had already seeded real period history + four milestone items; `B8` moved to `_done`; all seven surfaces driven and cross-checked against the rows. New polish `P2` (chip overflow) |
| *Escalations* §2 | open backend question | ✅ **resolved** — `Restrict` → 409, no cascade | Round 4 API read; the message half became `B9` |
| *Escalations* §3 | open data-integrity escalation | **re-scoped** to a bounded design question, backend ask `B9-routine-untick-streak-decision.md` | Round 4: once-per-cycle guard, tested; +1 is the whole cost |
| *(counter hit-testing)* | ✅ fixed | ✅ fixed **and corroborated with a real mouse from the routine list** | Section closed |
| `history-review/B1` | `bug`, `flex-shrink` cause, `flex-shrink: 0` fix | `bug`, **`flex-basis: 0%` cause**, suggested fix rejected (`F26`) | Contradiction 27 |
| `history-review/B2` | `bug`, composable nulls data | `bug`, **three fetch owners, two with no `catch`** (`F27`) | Contradiction 28 |
| `history-review/B3` | `bug` | **`polish`** (`F28`) | Contradiction 29 — `_shell/P1` precedent |
| `history-review/B4` | `bug`, "batch with `_shell/B1`" | **`polish`**, **escalation §8**, not batched with §1 | Contradiction 30 |
| `history-review/A1` | `a11y`, naming only | `a11y`, **naming + reachability + an `interactive` flag** (`F29`) | Contradiction 31 |
| `history-review/A2` | `a11y`, framework guess | `a11y`, **framework confirmed** (`FW6`) + app-side locale mirror | Contradiction 32 |
| `history-review/P1` | `polish`, one label | `polish`, **two labels + keyboard activation** (`F30`) | Contradiction 33 |
| `history-review/P2` | `polish`, "in-hole legend" | `polish`, **width-driven layout; `isNarrow` dead prop** (`F31`) | Contradiction 34 |
| `history-review/P3` | `polish` | `polish`, stands (`F32`) | — |
| `history-review/U1` | `unverified`, "future pass with a 2020 range" | `unverified`, **runnable today with no seed change**, after `F27` | Its own repro is enough; the calendar's past-year padding is documented in the view |
| `history-review/U2` | `unverified`, "seed row needed" | `unverified`, **route-mockable** | A fulfilled route body replaces the seed ask |
| `todo-routine/B10` (`F24`), *(unfiled)* `F25` | open batches | ✅ **applied in the working tree**, awaiting retest | Contradiction 36 |
| `user-settings/B1` | `bug`, "none on the frontend", one backend cause | `bug`, **app batch `F33` + three-part escalation §9** | Contradiction 39 |
| `user-settings/B2` | `bug`, "no else branch" | **`unverified`** — the branch exists; evidence is a late `find` against a 3 s toast | Contradiction 38 |
| `user-settings/A1` | `a11y`, three call sites, "no aria-label passed" | `a11y`, **one component, Vuetify-generated name** (`FW7`); reachability invariant added | Contradiction 40 |
| `user-settings/P1` | `polish`, two buttons | `polish`, **six framework buttons** (`FW8`, pre-empting unit 15) **+ one app-side twin** (`F34`) | Contradiction 41 |
| `user-settings/U3` | `unverified`, "no intent step" | `unverified`, **premise settled from source** — the step exists; one Cancel-only look remains | Contradiction 42 |
| `user-settings/U4` | `unverified`, blocked by the classifier | `unverified`, **mechanism settled; message is a raw key** → `FW7` adjacent; spec pass condition corrected | Contradiction 43 |
| `user-settings/U5` | `unverified`, blocked by the classifier | `unverified`, **mechanism shared with the verified theme path**; reseed is the revert | Contradiction 44 |
| `user-settings/U1`, `U2` | `unverified`, shared-account risk | `unverified`, stand — with a non-mutating half (`U1`) and a one-sign-in route (`U2`) named | — |
| *(unfiled — `GoogleCalendarCard.vue:20`)* | called correct by `P1` | `polish`, **own trivial app batch** (`F34`) | Contradiction 41, rule 1 |
| `history-capture/B1` | `bug`, one missing key, one-line fix | `bug`, **one of three live leaks (+24 latent) from a per-consumer mirror**; fix is the namespace merge, one-liner kept as fallback (`F35`) | Contradiction 50 |
| `history-capture/B2` | `bug`, 3 call sites | `bug`, **8 tags / 6 files**, incl. the preset editors; framework default explicitly *not* changed | Contradiction 51, rule 4 |
| `history-capture/B3` | `bug`, phantom button outside edit mode | `bug`, **and the pencil hides the chip inside edit mode**; second suggested-fix option rejected; unfiled chip-role observation folded in (`F37`) | Contradictions 49, 52 |
| `history-capture/P1` | `polish`, two views | `polish`, **one view**, three app-side sites + the `no-console` rule (`F38`) | Contradiction 48 |
| `history-capture/U1` | `unverified`, one expectation | `unverified`, **split**: double-submit source-certain, reset unsourced | Contradiction 53 |
| *(unfiled — `TimePicker` minute 60)* | — | **framework, source-certain, unobserved** — *Needs verification*, `FW10`-if-confirmed | Rule 5; found reading `B2` |
| *`F4` (unit 13)* | batch as written | batch **annotated** — its keys do not exist app-side | Contradiction 55 |
| `auth/X1` | `blocker`, one missing field, one-line fix | `blocker`, **missing field + missing `/reset-password` view and route**; action name and status corrected (`FW9`) | Contradiction 58 |
| `auth/B3` | `bug`, "everything but 404 is silent" | **`polish`**, network case only; dead 404 branch removed; suggested fix rejected; folded into `FW9` | Contradiction 59 |
| `auth/B1` | `bug`, one fix across four files | `bug`, **split app/framework** (`F39` write, `FW11` read); open-redirect rule tightened | Contradiction 61, rule 1 |
| `auth/B2` | `bug`, own finding | merged into **`FW7`** (its adjacent, now observed) | Contradiction 65 |
| `auth/B4` | `bug`, sibling is the model | `bug`, **both views** (`FW12`); three source-certain adjacents folded | Contradiction 60 |
| `auth/B5` | `bug` | `bug`, stands; the `undefined` id behind its repro added (`FW12`) | Contradiction 60 |
| `auth/A1` | `a11y`, "no `aria-label` binding" | merged into **`FW7`** (`user-settings/A1`, same component) | Contradiction 65 |
| `auth/P1` | `polish`, own fix | `polish`, **folded into `FW13`** (same file, two attributes) | Same-file fold, as `F37`/`F19` |
| `auth/P2` | `polish`, un-aborted in-flight request | `polish`, **store created on logout by `resetAppState()`**; `AbortController` rejected (`F40`) | Contradiction 62 |
| `auth/P3` | `polish`, own fix | `polish`, **folded into `FW11`** (same function) with the `'No user!!!'` literal | Same-file fold |
| `auth/O1` | `opportunity`, "neither is wrong" | **`bug`** — contradicts the server's documented local contract; blocks two units' checks (`FW13`) | Contradiction 63 |
| `auth/U1` | `unverified`, source read only | `unverified`, **source-certain**, observable after `FW13`; `FW14`-if-confirmed with the fix shape written | Rule 5; the API sends the codes |
| `auth/U2` | `unverified`, seed gap | `unverified`, **seed gap needs the TOTP secret too**, or a hand enrolment after `FW13` | — |
| `auth/U3` | `unverified`, env gap | `unverified`, stands; lazy `load()` badge note added | — |
| `auth/U4` | `unverified`, deliberate | `unverified`, **numbers and message settled from the API**; one dead match line noted | Contradiction 67 |
| `auth/U5` | `unverified`, blocked by `O1` | `unverified`, **unblocked by `FW13`** — its retest is `FW13`'s verify block | — |
| `auth/U6` | `unverified`, plausible stuck spinner | ✅ **settled — no defect, dropped** | Contradiction 64 |
| `planner-day/B1` | `bug` | `bug`, stands; mechanism confirmed against Vuetify's `VWindowItem` and `.d-flex` (`F41`) | — |
| `planner-day/B2` | `bug`, one dialog, "every consumer" | `bug`, **three labelled call sites** incl. History's *From*/*To*; `hideDetails`/`style` folded; one draft assertion to correct (`FW15`) | Contradiction 71 |
| `planner-day/B3` | `bug`, app-side codec extension | `bug`, **split app/framework** (`FW16` expose → `F44` encode); suggested fix impossible where it points | Contradiction 73, rule 1 |
| `planner-day/B4` | `bug`, "batch with shell B1" | **`polish`**, merged into *Escalations* §8 — duplicate of `history-review/B4` | Contradiction 74, §30 |
| `planner-day/B5` | `bug`, two cases, one cause | `bug`, **date half only** (`F43`, + a second unguarded site); **task half settled, no defect** | Contradiction 70 |
| `planner-day/B6` | `bug` | `bug`, stands (`F42`); query shape recommended over the sibling route-param shape | — |
| `planner-day/A1` | `a11y`, `CalendarGrid.vue` | `a11y`, **`MonthYearPicker.vue`**, merged into **`FW2`** (+ two unfiled `MyDateInput` twins) | Contradiction 72 |
| *(unfiled — `ActionBar` occlusion)* | brief item 2, "not re-filed" | **framework batch `FW17`** — observed twice, documented three times, owned nowhere | Contradiction 75 |
| *(unfiled — template `/suggestions?date=`)* | brief's "opportunity" | **source-certain defect**, *Needs verification*, `F45`-if-confirmed | Contradiction 76, rule 5 |
| `tracking-dashboards/B1` + `A2` | two findings, two panels | merged into **`F46`** — one hand-rolled button, three copies, one shared key | Same cause (the unit's own `A2` guess says so); unified's label folded |
| `tracking-dashboards/B2` | `bug`, pass condition "active seconds and session count" | `bug`, **narrowed** (`F47`) — local panel from what is on the wire; session count → *Deferred* as a backend sibling of `process-details` | Contradiction 79 |
| *(unfiled — Android metric radio + timeline legend)* | inventory `:31`, spec comment `:103-105` | **app batch `F48`** — legend half observed, radio half source-certain | Contradiction 81; `F27`/`F43` precedent for batching a same-file adjacent |
| `tracking-dashboards/A1` | `a11y`, two components, "check other usages" | `a11y`, **six state-bearing chip sites in three modules** + six action chips (`F49`) | Contradiction 83; rule 4 keeps it out of `componentDefaults` |
| `tracking-dashboards/U1` | `unverified`, "no fault injection available" | `unverified`, **`route --status=500` settles it**; merged with `F27`'s verification session | Contradiction 82 |
| *`F30` (unit 3)* | app batch, two modules | app batch, **`activityTracking` half withdrawn** — label honest on 3 of 4 dashboards, key handlers present since 2026-08-20 | Contradiction 80 |
| *`F29` (unit 3)* | "unit 5 has not run" | note closed — unit 5 ran pre-`F29`, did not re-file the bars | — |
| *(unfiled — pie endpoints' literal `"Other"`)* | — | **escalation §10**, source-certain, unobserved; `F47` guards it locally | Rule 2; found reading `B2` |

### Findings this triage did not challenge further

`leisure-projects/B1`, `B2`, `B3`, `A2` — each re-verified directly against source this pass (see the batches)
and they stand as filed, with `B2`'s *fix* amended per Contradiction 3. `home/B1`, `B2`, `B3` — re-verified by
targeted source check (`flex-wrap: nowrap` at `WidgetCard.vue:151`; zero `loading` in `NowBar.vue`; no third
`defineStore` argument in `homeUiStore.ts`), unchanged. `_shell/A1`, `A2`, `A3`, `P1`, `B1` — re-verified
(`persistent = true` at `MyDialog.vue:86`; no label on `AppTopBar.vue:11`; zero `skip` in `App.vue`; no
`useSetBreadcrumbExtra` in `TodoListView.vue`), unchanged. `todo-lists/B4` — re-verified against `Time.ts`,
unchanged.

`tracking-settings/B4` — stands as filed; the truncation is visible in the unit's own 1440×900 screenshot
read from disk this pass, and the header `div` at `DesktopSettingsView.vue:7` has no wrap. `B3` — stands;
`useMappingSettings.ts:33` is a bare `ref`. `O1` — stands; grep confirms no template binds `isActive`
outside the two filter rows. The unit's tally line (1·4·0·1·1·1) matches its body — the first unit in the
sweep whose count needed no correction.

`activity-settings/B4` — stands as filed, one-line read (`DataTable.vue:83`), and the finding's root-cause
guess and suggested fix are both exactly right; `FW5`. `P1` — stands, and the server's own doc comment
confirms the aggregate is by design; `F21`. `P2` — stands on the unit's screenshot; the row at
`ActivitySettingsView.vue:12` has no wrap and its children no `min-width`; `F22`. `O1` — stands. `U1` —
stands as a seed-shape gap. The unit's tally line (0·7·1·2·1·4 = 15) matches its body; the previous
queue's "sixteen" was this document's error, not the unit's.

`todo-routine` (fifth pass) — `B10` stands as filed, grown (Contradiction 21); its evidence is a
screenshot on disk (`routine-todo-list--round5-sk-default.png`) plus a source read that this pass repeated.
`B9` stands — `RoutineSettingsView.vue:163-201` matches its "Fix applied" paragraph line for line, and the
locale keys (`deleteBlocked` with SK plurals, `deleteBlockedUnknownCount`) are present in both files; the
finding's own honesty about being unobserved in either direction is the reason it is not called *fixed*
here. `B1`, `B2`, `B5`, `B7`, `B8` — verified in round 2b, unchanged, not re-read. The unit's round-5
tally paragraph matches its body: five closures, one new finding, one blocked retest, and the counter
question closed. Its round-history table is the most complete in the sweep — five rounds, each with the
commit or working-tree state it ran against — and is the reason this pass could be done from disk.

`history-review` (sixth pass) — every one of its eleven findings was read against source, and the API's
where the client could not answer (`B4`). Nothing was dropped and nothing merged: the unit's eleven are
eleven distinct concerns, which is itself unusual (unit 2 and unit 6 each shipped a pair that was one
defect). What the unit got right without exception is the **evidence** — an element screenshot with a
measured rect (`B1`), a mocked 500 with the console line (`B2`), a `textContent` read (`B3`), a screenshot
of the strip plus a source read confirming the client renders the string as-is (`B4`), snapshot excerpts
with ref ranges and counts (`A1`, `A2`), a `className` before/after (`P1`), `!!document.querySelector('h1')`
(`P3`). What it got wrong, four times out of eleven, is the **mechanism** one layer below what it could
see — a Vuetify stylesheet rule, an ECharts layout box, a C# country table, a `try/finally` in a
component it did not mock. That is the same ratio as every earlier unit, and the same lesson: the
`Root cause guess` field is a guess, and the batch is where it gets checked. `P3` stands exactly as
filed; `U1` and `U2` stand as `unverified` with cheaper routes to settle them than the unit proposed.

`user-settings` (seventh pass) — all nine findings read against source, and the API's for `B1` (the
endpoint, the service, the validator, the config files and the integration test). Nothing was dropped
and nothing merged. `A1` and `P1` stand as filed and grew; `B1` stands and split; `B2` fell to
`unverified`; `U1` and `U2` stand as filed, `U3`/`U4`/`U5` stand as `unverified` with their mechanisms
settled. What the unit got right is the **evidence discipline** under an unusual constraint — five of
nine findings are honest "could not exercise" records where an earlier unit would have guessed, and the
one `bug` it did observe (`B1`) has the request number, the status and Google's exact error text. What
it got wrong, twice, is the same thing every unit gets wrong: the mechanism one layer down (`B2`'s
"no else branch" is the else branch; `A1`'s "no aria-label passed" is an aria-label Vuetify passes).
And what it could not have got right from a browser is the part this pass exists for: that the OAuth
flow it saw fail once would fail three more times behind that page, one of them in this repo. Its
mutation-pass discipline — every toggle reverted, nothing hard-to-reverse touched on a shared account —
is the model for units 15 and 17.

`history-capture` (eighth pass) — all five findings read against source; Vuetify's `VChip.js` for `B3`,
the framework's four locale files (diffed mechanically) for `B1`, and the API's per-user seeder for
`B2`'s *Short Sprint* premise. Nothing dropped, nothing merged, nothing re-graded in severity; every
`bug` grew. What the unit got right is **mechanism as well as evidence**, which is rarer than it sounds:
`B1` names the exact spread order and the exact comment that explains the omission; `B2` names the
default, the prop, the rounding helper and a seed row that contradicts the widget; `B3` names the slot,
proves the missing request with `requests` and the non-persistence with a reload, and its root-cause
guess (*"the `#close` slot … without the `closable` prop"*) is Vuetify's own `hasClose` line. Three
correct mechanisms out of three is a first in the sweep. What it got wrong is **extent**, every time:
one key where there are three, three call sites where there are eight, one mode where the other is
worse, two views where there is one. And what it left inconsistent is its own cross-referencing —
two finding ids in the inventory that the findings file does not have (§49). Its draft spec is the
cleanest structural tier so far: every `fixme` comment restates its finding accurately, including
`U1`'s honesty about why it was not run.

`auth` (ninth pass) — all seventeen findings read against source, and the API's for six of them
(`X1`, `B3`, `O1`, `U1`, `U4`, and the registration `catch` found on the way). `X1` stands as filed
and doubled; `B1`, `B4`, `B5`, `P1` stand as filed; `P2` stands with a different mechanism; `B2` and
`A1` stand and are duplicates; `P3` stands and is folded; `O1` rises, `B3` falls, `U6` is dropped.
What the unit got right is **every observation**: each `bug` has a request number or a screenshot,
the network body for the 400 is quoted verbatim, the redirect test was run from a cleared session,
the resend error was clicked, the deep-link redirect was actually driven rather than read. What it
got wrong is what every unit gets wrong — the layer beneath the screen: a snackbar read as body text
(`B4`), an interceptor it did not read (`B3`), a store lifecycle it could not see from a network
panel (`P2`), a composable one file over (`U6`), and a server contract it could not have known
without the repo (`X1`'s second half, `O1`'s re-grade). Its refusal to lock out the shared account
(`U4`) and its choice to leave `U6` "inconclusive, not negative" rather than pick a side are the two
best judgement calls in the sweep so far. This is the first unit whose findings are **entirely**
framework-side or in `src/router.ts` — a signed-out surface that is `_common`'s by construction —
save one: `F40` lands in `src/core/todoList/store/`, and it is not an auth-view defect at all but a
store-lifecycle bug that only a logout can surface, which is why no other unit found it.

`planner-day` (tenth pass) — all seven findings read against source, and the API's for two (`B5`'s
`by-date` parser and the calendar seeder's span; `B4` was already answered by the sixth pass's read).
`B1` and `B6` stand exactly as filed — `B1`'s root-cause guess is the first in the sweep to name a
Vuetify stylesheet rule *and* be right about it (unit 3's `B1` guessed `flex-shrink` and was wrong,
§27). `B2` stands and grew; `B3` stands and split; `B5` stands by half; `B4`
falls and merges; `A1` moves one file and merges. What the unit got right is **evidence that can be
re-run**: a `querySelectorAll('.v-window-item')` census with class lists (`B1`), a response body with
the field named (`B4`), an `aria`/`title`/`textContent` eval (`A1`), a reload-and-`find` for each URL
claim (`B3`, `B6`), and — for the first time in the sweep — **zero `unverified`**: everything it could
not exercise it left out rather than guessed at. What it got wrong is the usual layer beneath the
screen (`A1`'s file, `B3`'s ownership of the state, `B5`'s interceptor line) — and one thing no earlier
unit got wrong, which is **not filing what it was told about**: the `ActionBar` occlusion it re-confirmed
(`FW17`) and the template-suggestion route its brief mislabelled as an opportunity (`F45`-if-confirmed)
both reached the queue from the brief and the source, not from `findings.md`. A unit brief that says
*"do not re-derive"* should say *"file it with a one-line pointer"* — that is a `PROMPT-TEMPLATE.md`
edit, flagged for the operator. Its inventory is the most complete control map in the sweep (five
`ActionBar` variants, the keyboard contract, the mid-session token refresh recorded as expected) and its
cross-references are all off by one (§77).

`tracking-dashboards` (eleventh pass) — all five findings read against source, and the API's for
`B2` (the Android pie endpoint and its two DTOs) and, on the way, all eight pie/stacked-bars
endpoints for the `"Other"` sentinel (§10). `B1` and `A2` stand exactly as filed and merge; `A1`
stands and grows; `B2` stands and narrows; `U1` stands with its premise replaced. Nothing dropped,
nothing re-graded in severity. What the unit got right is **the mechanism, three times out of
three** — `B1`'s wrong icon set, `A2`'s missing attribute, `A1`'s Vuetify default are each the exact
line — and it is the first unit whose inventory cross-references are all correct. What it got wrong
is the data one layer down (`B2` assumed a session count the wire does not carry) and the tool one
file over (`U1` assumed a command that exists does not). And what it did that no unit should: it
*noticed* two defects and routed around them instead of filing — the metric radio listed as shared
without a note that it does nothing here, and the legend's *Background* word worked around in the
spec's own comment (§81). Same class as unit 7's positional locator (§77) and its unfiled brief items
(§75, §76); the `PROMPT-TEMPLATE.md` edit the tenth pass flagged — *"a workaround in the spec is a
finding"* — has now been earned twice. The unit is also the first read-only one whose findings are
**entirely app-side**: four dashboards of this module's own components on Vuetify and ECharts, and
the one framework-owned surface they share (`StackedBarColumn`, `F29`) was already in the queue
from the other consumer.

### Coverage tracker note

`docs/views/_routes.md`'s coverage tracker still shows **units 13 `leisure-projects`, 6 `tracking-settings`
and 2 `activity-settings` as ☐** despite their documents being on disk. Units 1, 9, 10 — and, as of the
sixth pass, **3 and 14** — are ticked; these three need the same. `units/06-*.md`, `units/02-*.md`,
`units/10-*.md`, `units/03-*.md` and `units/14-*.md` are in `units/_done/` (the last two untracked);
`units/13-*.md` still is not. Unit 3 also **resolved the `/activity-history/detail` orphan** in
`_routes.md`'s table (struck, with the two entry points named) — the first of the four orphan candidates
to be closed. Not a code defect — flagged for whoever next touches that file, since the tracker's whole
purpose is to prove nothing was skipped. `F14`'s two redirect routes and `F20`'s catch-all will change
`_routes.md`'s record count from 53 to 56 when they land.

**Seventh-pass addendum:** `docs/views/user-settings/` and `e2e/tests/user-settings.draft.spec.ts` are
**still untracked** at `5e42b813` (`git status`), although unit 14 is ticked in the tracker and its unit
file is in `units/_done/`. Commit them with this queue, or the tracker claims a unit whose documents are
not in the repository. The `_routes.md` orphan table gains nothing from unit 14 — `/google-calendar/callback`
is recorded at `_routes.md:59` with entry *"external (Google OAuth redirect)"*, not as an orphan
candidate, and the unit's evidence matches (it is reached only by Google's redirect, and today not even
by that — §9).

**Eighth-pass addendum:** unit 4 `history-capture` is in the same state unit 14 was one pass ago, and
worse by one step — `docs/views/history-capture/` and `e2e/tests/history-capture.draft.spec.ts` are
untracked, its row in the tracker (`_routes.md:119`) is still **☐**, and `units/04-history-capture.md`
has **not** been moved to `units/_done/` (it is the only finished unit whose file is still in `units/`).
Three things to do together when committing this queue: `git add` the three untracked doc directories
and three specs the seventh-pass addendum already asked for (still `??` at `c4b984ca`), tick unit 4, and
move its unit file. `_routes.md:106`'s note that `PomodoroTimerView` is routed from `component/` rather
than `view/` is confirmed by the file list (`src/core/activityHistory/component/PomodoroTimerView.vue`)
and is still *"structure oddity; not necessarily a defect"* — the unit did not file it and this pass
does not batch it; a fixing session in `F36` or `F37` is in the directory and could move it in one
`git mv` plus the route import, if the owner wants the oddity gone.

**Ninth-pass addendum:** unit 15 `auth` joins the untracked pile — `docs/views/auth/` (three docs,
thirteen screenshots) and `e2e/tests/auth.draft.spec.ts` are `??`, its row (`_routes.md:130`) is
**☐**, and `units/15-auth.md` shows as `D` with `units/_done/15-auth.md` as `??` — the move happened,
the commit did not. The working tree also carries the uncommitted eighth-pass state of this file,
`_routes.md` and `UNIT-ORDER.md`, plus three stray files at the root (`counter-check.png`,
`temp3.txt`, `temp_snap2.txt`) that belong to no unit and should not ride along. Two `_routes.md`
changes fall out of this pass when their batches land: **`FW9` adds a sixth `userRoutes` record**
(`/reset-password`, `resetPassword`, `ResetPasswordView`, public + recaptcha, entry *external
(e-mail link)*, unit 15) — 53 → 54, or 57 with `F14`'s two redirects and `F20`'s catch-all — and
`F39` changes the guard sentence at `:11` to say the bounce carries `?redirect=<fullPath>`. The five
existing auth rows (`:67-71`) are accurate as written; the `/login` row's *"redirect target of the
auth guard"* stays true and gains the query.

**Tenth-pass addendum:** unit 7 `planner-day` — `docs/views/planner-day/` (three docs, screenshots)
and `e2e/tests/planner-day.draft.spec.ts` are `??`, its row (`_routes.md:122`) is **☐**, and the
unit-file move is **staged** (`R units/07-planner-day.md → units/_done/07-planner-day.md`) but not
committed — one step further along than unit 15's. `_routes.md:102` (the `/day-planner/settings`
*ModuleSettingsSection* check) is answered by the unit and by `moduleSettingsLinks.ts:24`; strike it
as unit 3's row was. The four planner-day route rows (`:40-43`) are accurate as written. `F42`, if it
takes the query shape recommended, changes nothing in the manifest; if the owner picks the route-param
shape it adds a redirect record (`/day-planner/settings` → `…/repeating`) and the count moves again.
`F43`'s optional param constraint (`:date(\d{2}-\d{2}-\d{4})`) would change the `:41` row's path
column and should be recorded if taken. The `UNIT-ORDER.md` brief rows for unit 7 (*"Brief unit 07 on
these two"*) are both now historical — item 1's ISO-URL behaviour no longer describes the code
(*Needs verification*), item 2's suggestions bug is fixed in source and its "opportunity" is a defect
(§76); strike both when that file is next touched.

**Eleventh-pass addendum:** unit 5 `tracking-dashboards` — `docs/views/tracking-dashboards/` (three
docs, screenshots) and `e2e/tests/tracking-dashboards.draft.spec.ts` are `??`, its row
(`_routes.md:120`) is **☐**, and the unit-file move is **staged, not committed**
(`R units/05-tracking-dashboards.md → units/_done/05-tracking-dashboards.md`) — the same state as unit
7's. The four dashboard route rows (`_routes.md:34-37`) are accurate as written; nothing in `F46`–`F49`
adds, removes or redirects a route, so the manifest count is unchanged by this pass. `UNIT-ORDER.md:160`'s
row for unit 5 (*"Unblocked 2026-09-13 … `pie-chart` returns 5 domains, 150 entries"*) is now
historical and its `{hours,minutes}` request-shape note is confirmed by the unit; the *"Read-only — no
mutation pass needed"* clause still holds — none of the four batches needs one to verify. **This is the
file's eleventh in-place pass and it is ~410 KB**; the operator has said the shape will be reworked in
a separate session — the audit-trail sections (the pass blockquotes, *Contradictions*, *Re-grades*,
these addenda) are the bulk and are what a per-pass log file should take, leaving the summary table,
open batches, escalations and *Needs verification* here.
