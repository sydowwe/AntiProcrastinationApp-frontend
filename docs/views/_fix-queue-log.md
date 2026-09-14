# Fix queue — log

> Audit trail split out of `_fix-queue.md` on 2026-09-15. Nothing here is open work — the queue is
> [`_fix-queue.md`](_fix-queue.md). Sections: the per-pass narrative (newest first), batch bodies moved
> here when their fix was verified, verification items that were settled, and the *Contradictions &
> re-grades* audit sections. Each triage pass appends to this file rather than to the queue.

## Pass history (newest first)

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

## Closed batches

> Bodies moved out of the queue once fixed and verified. The summary table in `_fix-queue.md` keeps their
> row (marked ✅) so batch numbers stay traceable.

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

## Closed verification items

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
