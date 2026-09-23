# Fix queue — log

> Audit trail split out of `_fix-queue.md` on 2026-09-15. Nothing here is open work — the queue is
> [`_fix-queue.md`](_fix-queue.md). Sections: the per-pass narrative (newest first), batch bodies moved
> here when their fix was verified, escalation bodies moved here when the backend answered and the
> frontend half landed, verification items that were settled, and the *Contradictions & re-grades* audit
> sections. Each triage pass appends to this file rather than to the queue.

## Pass history (newest first)

> **Sixteenth pass, 2026-09-21, commit `0a174507` + working tree — no unit absorbed; two landed backend
> asks and a source re-read of the fifteenth pass's headline batches.** No `findings.md` has changed
> since the fifteenth pass (checked by mtime: the newest is unit 13's, from before that pass wrote the
> queue), and units 16–19 have not run, so there was nothing new from a browser to triage. What had
> changed is on the other side of the wire. **`B18` landed** (`AdhdTimeOrganizer` `cd0a252`): every
> error body now carries `errorType`, and **its entire frontend half was unfiled** — `handleHttpCodes`
> still takes a bare `number`. That became two batches, split on rule 1: `FW24` (framework — read the
> type, word each 409 and 403, status-only as the fallback) and `F85` (app — narrow the two `_silent`
> call sites, blocked on the pointer bump). Writing them meant reading `B18`'s own *"what changes on
> the frontend"* list, and **two of its three bullets are wrong**: deleting `TimePeriodForm`'s inline
> 409 handling would undo `todo-routine/B11`'s dialog-stays-open fix, and `useDeleteConfirmation` never
> guessed about FK refusals because it is pre-flight and never sees a response (§121, §122). A third
> correction came out of the same read and is worse than the finding it corrects: escalation §7 says a
> 409 reads *"This record was changed by someone else"*, but that is only the `_silent` path — on the
> default path the interceptor prefers the server's `message`, so an ordinary 409 has been showing the
> API's raw English *"Unique constraint violation during Create"* in a Slovak UI (§120). **`B16`'s two
> halves are out of step:** the frontend half is in this repo's working tree, but `FoldedRow.cs` is
> still untracked in the API's, so §10's symptoms reproduce on any reachable server and a retest today
> would fail for the wrong reason (a *Needs verification* row now says so; the backend's one question
> back — does the client's local bucket merge or overwrite — is answered from the code: it **sums**).
> The rest of the pass was challenge rather than intake. `F73` and `F74` were re-read against the API
> source and **both got worse**: `F73`'s failure is not uniformly a 404, because authorization runs on
> the row the id *found* (`OwnsActivityAsync(…, entity.ActivityId)`), so a colliding id is a silent
> wrong-row write — re-graded `med` → `high` (§123); and `F74` cannot be fixed by renaming the path
> segment, because the two modes differ in verb *and* response shape (`PUT` → 204 no body, `POST` → 200
> with the new id), with a `Number('') === 0` trap waiting on the overwrite path (§124). `F76`, `F80`,
> `F81` and `F84` were confirmed as written; `F81` was also **bounded** — every static icon literal in
> `src/` was resolved against the three bundled FontAwesome packs, aliases included, and exactly two do
> not resolve: its `calendar-range` and `F46`'s `mdi-close` (§125). Two *Needs verification* rows
> settled from one file read each: `leisure-backlog-picker/U5` is **not a defect** (the picker's
> staleness record already goes through `readUserScoped`/`writeUserScoped`; round 2 filed it against a
> state of the file that had already been fixed), and `planner-templates/U3` is **confirmed** and
> already inside `F56` as control #4. Zero new escalations, and zero new findings — this is the first
> pass whose entire input was other people's landings.

> **Fifteenth pass, 2026-09-16, commit `0a174507` (clean tree) — the mutation rounds of units 7
> `planner-day`, 8 `planner-templates`, 11 `leisure-backlog-picker`, 12 `leisure-bucket-anchors` and 13
> `leisure-projects` absorbed, plus the retest notes in units 4 and 10. With this pass **all fifteen app
> units have been triaged through a mutation round**; the sweep's remaining units (16–19) are the
> framework submodule's and have not run.** Twenty-three new findings became eleven app batches
> (`F73`–`F83`), two framework batches (`FW22`, `FW23`) and **zero escalations** — the first pass since
> unit 3 to add none, and not for want of candidates: four findings were filed or guessed as server-side
> and three were disproved by reading the API this pass (§115, §116, §118), with the fourth (§117) a
> stale local backend build. The headline is a defect three units found independently and none of them
> recognised as one thing: `leisure-projects/X1`, `leisure-backlog-picker/X1` and
> `leisure-bucket-anchors/X4` are the same `get id() { return this.activityId }` in three DTOs whose
> `fromJson` never reads the server's `id` at all, so nine write call sites key the REST route by the
> wrong number and **every edit, delete and status change on three of the four leisure surfaces has been
> a silent 404** (`F73`). The second-biggest is `planner-day/X1`, filed as a missing backend route: the
> route exists, under a different verb and path, and the client has been calling a name that was
> replaced — the `F70` shape, with the *Clone* half broken too and never observed by anyone (`F74`).
> This pass also **had to correct the record rather than only extend it**: unit 11 rewrote its
> `findings.md` from scratch in round 2, dropped the round-1 round-history row, re-lettered every
> finding and lost two of them without a retest note, so four existing batches' `Closes:` lines pointed
> at the wrong defects until this pass tagged every reference with its round (§114). `F63`, `F64`,
> `FW20`, `F6` and `F49` all grew or were re-labelled because of it. Two things closed without a batch:
> §91 (the "400 with no snackbar" that three units observed three ways) settled in the mundane
> direction — unit 11's own round 2 saw the snackbar, so there is no framework intermittent, and what is
> real is the missing *field-level* error (`F77`); and `leisure-bucket-anchors/B1`'s five "silently
> ignored server-side" filters are all applied in the API source, against a build the unit had not
> restarted (§117). Two `unverified` rows were also filed that settle from a single file read rather
> than a browser, and are marked as such (`leisure-backlog-picker/U5`, `planner-templates/U3`). One
> observation about the unit prompts, not the app: of the five mutation rounds, the three that mutated
> *and restored by hand* (units 8, 12, 13) produced the pass's three blockers, and the two that did not
> mutate an existing row produced none — creating an entity exercises far less of the contract than
> editing one.

> **Fourteenth pass, 2026-09-15, commit `97f1e414` + working tree — the mutation rounds of units 4
> `history-capture`, 6 `tracking-settings` and 9 `todo-lists`, unit 10 `todo-routine`'s round 8, and
> unit 15 `auth`'s mutation round (rounds 2–3, committed in `04c405e9` and never triaged: the
> thirteenth pass was scoped to what was *uncommitted* that day and this had already been committed
> under it) absorbed.** Fourteen findings went in (2 · 4 · 6 · 0 · 2 new from units 4, 9, 6, 10, 15 —
> the renumberings `U1→B6`, `U1→X4`, `O1→X2`, `U1→B8` are not new and are not counted twice) and came
> out as **six app batches (`F67`–`F72`), two framework batches (`FW14`, `FW21`) and two escalations
> (§14, §15)**, with two existing batches grown (`F13` takes `X4` and `B7`; `F12` a round-2 note) and
> **two shrunk without the queue knowing**: `vue_framework` `6157283` (bump `04c405e9`) had already
> landed `FW9`'s token half and `FW13`'s fail-closed guard, both verified live by unit 15's round 3 —
> `auth/X1` and `X2` are `fixed`, and the bodies now say so at the top. Every finding was read against
> source, the API's included, and the seven new `blocker`s sorted into three real defects and four
> other things: `tracking-settings/X2`, `X3` and `B6` are one function (`useMappingSettings.saved()`
> sends three of the form's five facts — §102 catches the finding's own shortcut, which would silently
> re-activate every inactive rule on edit); `X4` is `F13`'s dead delete seen live, and its dialog
> *closing* is the browser confirmation the fifth pass's `BasicTable` fix never got; `todo-lists/X1` is
> §11 observed from its fourth surface, filed as `[framework]` with the fix §11 rejects (§99); and
> `auth/X1`/`X2` were fixed before the round that filed them was read. Three findings changed shape
> under source: `history-capture/B4` + `B5` are one gap on three views, with the stopwatch as the unfiled
> third (§106); `B6`'s 409 is the unique index, and that makes the form's missing reset a correctness
> bug rather than the taste §53 called it (§107); `todo-lists/B8`'s route was replaced on the server
> the day *before* the client line was written (§100). One re-graded down and deferred
> (`tracking-settings/B5`, `bug` → `opportunity` — the distinct-entries grid is the observation
> ledger by design, §103), one re-graded down and batched (`auth/B7`, `bug` → `polish` — the 401 is the
> `FallbackPolicy`'s, and the cost is one wasted request, §110). One backend defect found from the
> unit's evidence and the framework's source: `auth/B6`'s missing "email not confirmed" branch is not
> missing — Identity's `PreSignInCheck` returns `NotAllowed` before the flow's own check runs (§109,
> §14). Six verification rows closed: `tracking-settings/U1` (→ `X4`), `history-capture/U1` (→ `B6`),
> `auth/U1` (→ `B8`/`FW14`), `auth/U5` (resolved), and the two `todo-routine` *Awaiting retest* rows
> that had lagged the summary table for two passes. The 177 in the header is 163 + 14.
>
> **Environment note for the operator, from the four rounds.** Units 4 and 6 each reseeded at their
> end; unit 9 restored by hand (every created row deleted in-session) and signed in through the form
> after the reseeded token 401'd; unit 15 reseeded twice. The database is at `e2e-v4` with nothing
> known to be left behind — but unit 6 says in as many words that it *could not* delete through the UI
> (`X4`), so its cleanup rests on the reseed alone; if the next run finds a `vlc.exe` or `Duolingo`
> rule, that is residue, not seed. `e2e/.state/auth-10001.json` is stale again (three reseeds today).
> The unit files for 04, 06 and 09 are back in `units/` (moved out for their mutation runs, per the
> flow `04c405e9` used for 01/02/04) and unit 10's is in `_done/` — the folder listing no longer says
> which units are finished; the round-history tables do.

> **Thirteenth pass, 2026-09-15, commit `04c405e9` + working tree — units 11 `leisure-backlog-picker`
> and 12 `leisure-bucket-anchors` (inventory) and the mutation rounds of units 1 `home` and 2
> `activity-settings` absorbed.** Scoped by the operator to what is uncommitted; `F1`–`F57` /
> `FW1`–`FW18` stand as the twelfth pass left them except where a new finding folds in (`F6`, `F19`,
> `FW5`) or a mutation round rewrote one from the root (`F8`). Twenty-six findings went in (11 + 10 from
> the two inventories, 2 + 3 new from the two mutation rounds; the four tallies match their bodies)
> and came out as **nine app batches (`F58`–`F66`), two framework batches (`FW19`, `FW20`) and three
> escalations (§11–§13)** — the most escalations of any pass since unit 14, and every one of the three
> is a client/server contract gap that the browser could only see the edge of. Every finding was read
> against source, the API's included, and **five of the seven `blocker`s changed shape under it**:
> backlog `X1` is not a sort/filter interaction but a filter that has never existed on the wire, with
> its "working" evidence explained by an unrelated field (§89); bucket `X3` is not a route-ordering bug
> but a route that no file in the API declares (§92); backlog `X3`'s "no snackbar" half has no
> mechanism in source and is contradicted by unit 2 on the same path (§91, *Needs verification*);
> activity-settings `X1`'s "which side owns the colour format" is answered from the server's own
> `ColorPalette` constants and seeder — the validator is the stale side, the column is one character
> too short for `burgundy`, and `/todo-list`'s category form is broken by the same validator (§94,
> §11); and home `B2` is rewritten from the root by its own round 2 — a `loadToken` bump on the
> `0 → id` hydration orphans the day-plan fetch, permanently, and the loading branch round 1
> prescribed would hide nothing (§95). Two things the units did not file were found from source:
> `inspirationSource` renders **"—"** on `/leisure/bucket-list` for a seeded string, the second victim
> of the same substring heuristic unit 11 caught on `durationMinutes` (§96, `FW20`), and
> `ActivityProjectProfileRequest` is the fourth DTO with the `0` sentinel (`F63`). Four `unverified`
> rows closed: activity-settings `U1`/`U2` in a browser, home `U1` in a browser (folded into `F8`),
> bucket `U2` from source (§97). Two contradictions between units and this queue's own earlier passes:
> backlog `P1` claims to be the only leisure view passing `class` to `FilterPanel` — the grep still
> says four (§93, merged into `F6`); and unit 12's *"activityName confirmed working"* has no server
> field to have worked through (§90). The 163 in the header is 137 + 26.
>
> **Environment note for the operator, from the two mutation rounds.** Unit 1's round reseeded at its
> end (fixture `e2e-v4`, `seedDateUtc` 2026-09-15) — that invalidated `e2e/.state/auth-10001.json`,
> which is why it is absent now. Unit 2's round ran *after* that and **did not reseed**: it permanently
> deleted the seeded activity *"Unused Idea"* (id 12012) and says so in its operator note. **The
> database is one row short of `e2e-v4` right now; reseed before the next unit** and the next `npm test`
> in `e2e/` will do it anyway through `global-setup.ts`. `EXPECTED_FIXTURE_VERSION` on this side is
> already `e2e-v4` (`e2e/fixtures/seed.ts:207`), so nothing to bump.

> **Twelfth pass, 2026-09-15, commit `50bd6b0d` — unit 8 `planner-templates` absorbed.** The first
> pass after the queue/log split, and the first on a clean tree — every unit's docs are committed.
> Scoped by the operator to that unit; nothing outside the sections naming it was re-read, and
> `F1`–`F49` / `FW1`–`FW17` stand as the eleventh pass left them, with one fold: `F38` gains
> `planner-templates/P2` (`MiniTimeline.vue:50` was already in its file list from the eighth-pass
> grep — the unit observed the line the grep predicted). Fifteen findings (2 · 5 · 3 · 2 · 0 · 3 — the
> tally matches the body) became **eight app-side batches (`F50`–`F57`) and one framework batch
> (`FW18`)**, no escalation. Every finding was read against source, the API's included, and the
> unit's two blockers both changed shape under it. `X1` (the empty Compare dialog) is real and
> **twice** what was filed (§87): the dialog does two unkeyed `Promise.all` fan-outs from one api
> instance, `fetchById` ×2 then `fetchFiltered` ×2, and the finding's suggested fix closes the first
> and leaves the second — so `F50` says so in bold, and the helper-level cause splits out as `FW18`
> (`useEntityQuery` needs the `requestKey` `useFetchFiltered` got on 2026-09-11), which contradicts a
> standing framework prompt: `prompts/_common/api/A1:129-131` says in so many words *not* to add one
> (§85). `X2` (the mobile side panel) is real and **misread** (§86): the "collapsed pill" the unit
> tapped is the *open* panel squeezed to 400 × 16 px — the screenshots show the same element before and
> after a horizontal scroll — and the template planner has **no control that reopens it**; `A3`, which
> named that non-existent toggle, is re-identified as the shell's close X (or the header's undo) and
> closes in `F56` with four more unnamed controls found in the same files, three of them unfiled
> (both planners' undo buttons, whose badge count becomes their name; the day planner's mobile `bars`
> toggle, which unit 7 never resized to see). `B2` grew from one field to the whole form (§88): the
> backend's `TaskPlannerDayTemplateRequest.cs` makes the day type `required` and caps name/description/
> icon, the client declares it `?:` and validates nothing — and the "should it be optional?" question
> is answered from source as no (non-nullable, indexed, drives `/suggestions`), so it is `F53`, not an
> escalation. `B5` grew by a `sessionStorage` persist that keeps the stale name across a reload
> (`F55`). `U3` is settled from source and closes in `F56`; `U1`/`U2` wait for the mutation pass. The
> split-view orphan in `_routes.md:45,100` is resolved by the unit's inventory (`:26` — *Edit Side by
> Side*, `mdAndUp` only), which the operator should strike; the tracker row `:123` is still ☐. The 137
> above is 122 + 15.

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

## F10. No skip-to-content link

> ✅ **FIXED 2026-09-15.** `src/App.vue`: a `d-sr-only-focusable` anchor is the first child of `<VApp>`,
> `<VMain>` carries `id="main-content"` + `tabindex="-1"`, and the click is handled (`preventDefault` +
> `$el.focus()`) rather than left to the fragment, so the router never sees a `#main-content` hash
> navigation. Label `general.skipToContent` in `common.{sk,en}.ts`. Verified on a fresh load: the first
> Tab lands on a visible "Skip to main content" at (8, 8); Enter moves `document.activeElement` to
> `<main>` with the URL unchanged; the next Tab lands on a button inside main; blurred, the link is a
> 1×1 clipped box.

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

## F18. The mount-time combobox rebuild wrote back into the activities filter — ✅ fixed and verified 2026-09-15

- **Closed:** `activity-settings/B2`, `activity-settings/B3`. **`U4` retested and closed with it** — see
  below.
- **Root cause, as filed and confirmed in source before the edit.** `refreshActivityCombos()` *reassigns*
  `roleCombobox`/`categoryCombobox` from the filter, and two deep watchers wrote the combobox back *into*
  the filter (`roleIds = vals.filter(…).map(v => v.id)`, i.e. `[]` when empty). So every programmatic
  rebuild was also a write — and the rebuild runs in `onMounted`, when `roleOptions` is still `[]`
  because `activityOptionsStore` is `persist: false` and its fetch has not resolved.
  - **B2:** `?roleIds=11001` → `hydrateTabFromQuery` sets `[11001]` → the rebuild cannot resolve the id
    against empty options and `buildCombobox` drops it → watcher writes `roleIds = []` → the
    `activitiesFilter` deep watcher calls `syncUrl()`, which omits an empty list → **the param was gone
    before the first request**.
  - **B3:** on a bare load the constructor's `null` became `[]`, and `"roleIds":null` ≠ `"roleIds":[]`
    defeats `useLookupTable`'s JSON snapshot guard — a second `loadItems()` that aborted the table's own.
- **What changed.** The two combobox watchers are gone. `applyComboboxSelection()` plus
  `onRoleComboboxInput` / `onCategoryComboboxInput` are exported from the composable and bound to the two
  `VCombobox`es' `@update:modelValue` in `ActivitySettingsView.vue`. A component event fires for user
  input only, so `refreshActivityCombos()` is now a pure derivation — and says so in a comment naming
  both bugs, because the next person to add a write there will reintroduce them.
- **The empty case normalises to `null`**, not `[]`, so a cleared combobox returns the filter to its
  constructor shape. Note `B11` landed the same day and reads an empty list as "no opinion", so this is
  **not** about what gets filtered: it is about `useLookupTable`'s snapshot guard and the URL round trip
  (`activityFilterToParams` already used `?.length`, and `parseIdList` already returned `null` for empty,
  so `null` is the shape that round-trips).
- **Verified live**, signed in, against a backend carrying `B11` — which matters, because before `B11`
  the table could not show whether ids reached the server and the batch's own block said "check the
  request, not the table". Seed role `11001` = *Work*.

  | case | result |
  | --- | --- |
  | `?roleIds=11001` fresh `goto` | URL **keeps** the param, the *Work* chip renders, **and every row is a Work activity** |
  | same load, request body | `"roleIds":[11001]`, `"categoryIds":null` — one `POST /api/activity/grid` → 200, no abort |
  | bare load | exactly one grid `POST`, body `"useFilter":false,"filter":null` — the constructor shape untouched |
  | pick *Work* from the combobox | URL becomes `?roleIds=11001`, one new request, `"roleIds":[11001]` |
  | remove the chip | URL query **empty**, body back to `"useFilter":false,"filter":null` — i.e. `null`, not `[]` |
  | tab switch with filters set | `?roleIds=11001&name=Deep` → *Roles* → back: both params restored, chip and name draft rehydrated, no crosstalk |

- **`U4` — retested and closed.** Its row asked for the sequence three times, reading `itemsCount` off
  each response rather than trusting the rendered count. Three rounds, identical every time: typed
  *"Deep"* → `itemsCount: 1`; cleared → `itemsCount: 26`; two requests per round and no third. The
  *"0 of 0 on an unfiltered request"* the unit saw did not recur, which is consistent with the row's own
  reasoning — `F18` removed the only competing request this view fires. (Had it recurred, the row said to
  capture the response body, because the cause would then be somewhere this queue has not looked.)
- **The tab-switch guards were not touched**, per the batch's *Do not change*: the mirrored
  `watch(tab)` / `watch(activeTab)` early exits are untouched, and the round trip above is the check.
- `npm run type-check` (`--build --force`) clean, `npm run lint` clean.

## F20. No catch-all route — any unknown URL renders a blank main area

> ✅ **FIXED 2026-09-15.** `src/router.ts` ends with `{ path: '/:pathMatch(.*)*', name: 'notFound',
> component: NotFoundView }`, non-public. The view is the sanctioned fallback — `src/core/home/view/
> NotFoundView.vue` (the `PlannerTaskLinkView` shape: `VAlert` + *Back to home*), with
> `migration-revision.md` §14 holding the upstream ask and `_routes.md` gaining the 54th record. Strings
> `notFound.{title,text}` + `general.backHome` in `common.{sk,en}.ts`. Verified `/foo` and
> `/activity-settings/nonsense` render the page with zero `[Vue Router warn]`. One correction to the
> verify line: `/todo-list/abc` does **not** reach the catch-all — `/todo-list/:id` has no digit
> constraint, so it matches and `TodoListView`'s own "This list doesn't exist" state handles it, which is
> the right outcome.

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

## F35. `dateTime.secondsShort` renders raw on every running clock — the fourth leak of a mirror written per consumer, not per namespace

> ✅ **FIXED 2026-09-15 — the merge, not the patch.** `general`, `dateTime` and `controls` are merged at
> the bottom of `SK.ts` and `EN.ts` the way `user` always was. The mirrored blocks and their "mirrored
> from" comments are deleted from `common.{sk,en}.ts` (diffed mechanically against the framework files
> first); what stays there is this app's deliberate rewordings — SK `general.start` (*Začať*, a verb, vs
> the framework's noun), SK `switchToTimeRange`/`switchToDuration`, both `dateRangeExceedsLimit`s, EN
> `anchor`, `deleteConfirmationTitle`, `forbidden` — plus EN's identical `export` block removed. The stale
> "EN is partial / `EN.ts` does not spread `common`" sentences are corrected in `EN.ts`, `common.en.ts`,
> `migration-revision.md` §5 (now resolved, in the ledger) and CLAUDE.md's *Localization* bullets, which
> now say the merged namespaces need nothing and name the merge site. Verified through the running app's
> i18n: `dateTime.secondsShort` = `s`, `general.from`/`to` = *From*/*To* and *Od*/*Do* in both locales;
> the stopwatch shows `s`, the Summary picker in range mode labels its second field *To*; no `[intlify]`
> lines; `vue-tsc --build --force` exits 0.

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

## F33. Google Calendar connect never sends the OAuth `state` the server requires — the client half of `B1`

> ✅ **FIXED 2026-09-21**, in the same commit as the frontend half of `B14` (§9). `googleCalendarApi.ts`
> `connect(code, state)` posts `{ code, state }` — `_silent`, because the server's 400 `message` is not
> authored for the user and the interceptor was showing it *on top of* the view's own toast. The view
> reads both off `route.query` (either missing → the existing failure branch) and words the 400 by its
> `errorType`: `CookieMissing` / `BadRequest` → *"Connection attempt expired — start again"*
> (`googleCalendar.connectExpired`), `ExternalServiceError` → *"Google rejected the connection — try
> again"* (`connectRejected`), anything else → the generic `connectFailed`. The four values joined the
> framework's `ServerErrorType` (`_common` commit) so the branch compares constants, not literals.
> The optional `access_denied` branch **was** taken (owner's call, 2026-09-21): Google's Cancel shows
> `googleCalendar.connectCancelled` on a `warningDark` snackbar instead of the failure toast — now that
> the consent screen is reachable a Cancel will happen, and calling it a failure is misleading. `B2`'s
> timing question is untouched by it. Verified: `goto /google-calendar/callback?code=x&state=y` →
> `POST …/connect` body `{"code":"x","state":"y"}` → 400 — one toast in the snapshot the `goto` wrote,
> *"Failed to connect Google Calendar"* on the pre-`B14` build (no type), *"Connection attempt expired —
> start again"* on `1e0dc3b` (`errorType: CookieMissing`); `?error=access_denied` → the cancelled toast.
> The end-to-end success path needs the redirect URI registered in the Google console (§9).

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
- **What to change:** `connect(code, state)` posting `{ code, state }`; the view reads both off
  `route.query` and treats *either* missing as the existing failure branch. **Optional, same lines, not
  required by any finding:** branch on `route.query.error` first — `access_denied` is Google's own
  "Cancel" — and show a softer, distinct key (`googleCalendar.connectCancelled`, SK + EN) rather than the
  generic failure. That is the residual `B2` wanted; do it only if `B2` confirms, and say so in the
  commit. Do **not** mark the callback route `public` to survive a session that lapsed during the consent
  screen — a signed-out callback *should* bounce; whether the bounce preserves the destination is unit
  15's question, not this batch's.
- **Do not change:** the server's state check, and do not "fix" the 400 by making the client skip the
  state — that check is the CSRF protection on the whole flow.
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

> ✅ **FIXED 2026-09-21** — `'error'` → `'errorDark'` on `GoogleCalendarCard.vue`'s button, in the `F33`
> commit because the card was being rewritten for `B14`'s `configured` branch anyway (still not `FW8`,
> which is the framework repo). Source-read only: the Connected row needs the real OAuth round trip.

- **Scope:** app-side `src/core/googleCalendar/component/GoogleCalendarCard.vue:20`
- **Closes:** nothing filed — the unfiled app-side twin of `user-settings/P1`. The finding compared the
  two framework buttons against *"Edit"/"Connect" (both correctly `primary`, elevated)*, and it is right
  about the state it saw; the same button reads `:color="connected ? 'error' : 'primary'"`, so once the
  row is **Connected** it is exactly the defect `P1` describes, one card up. Not observable during the
  pass because `B1` keeps every account disconnected.
- **Root cause:** CLAUDE.md's colour-by-variant rule: `VBtn` defaults to `variant="elevated"`
  (`createAppVuetify.ts:25`), and elevated takes `errorDark`; `error` is the tonal/outlined token.
- **Do not change:** the chip on `:12` (`error`/`success` on a `VChip` — chips are not under the rule),
  and **do not batch this with `FW8`** — same defect class, different repo (rule 1; the `F4`/`FW2` split).
- **Verification:** Needs a Connected row; when it is reachable: both themes.

## F38. Leftover `console.log` in `TimerPresetsSection.vue` — and the lint rule that should have caught it is `off`

> ✅ **FIXED 2026-09-15.** `eslint.config.ts` flipped to `'no-console': ['error', { allow: ['error',
> 'warn'] }]`; the rule reported **exactly the three predicted lines** (`TimerPresetsSection.vue`,
> `MiniTimeline.vue`, `UseDragAndDropMonitor.ts`), all deleted by hand. `npm run lint` exits 0 with the
> rule on; the five framework lines are untouched (ESLint ignores `src/_common`, and they belong to
> `FW9`/`FW11`/`FW12`).

- **Scope:** app-side `src/core/activityHistory/component/TimerPresetsSection.vue:155`,
  `src/core/dayPlanner/component/template/MiniTimeline.vue:50`,
  `src/core/todoList/composable/dragAndDrop/UseDragAndDropMonitor.ts:24`, `eslint.config.ts:43`
- **Closes:** `history-capture/P1`, **`planner-templates/P2`** (twelfth pass — unit 8 filed
  `MiniTimeline.vue:50` on its own, observed as three `Proxy(Array)` lines per load of
  `/day-planner/templates`; it was already in this batch's file list from the eighth-pass grep, so the
  finding closes here rather than opening a second batch. Its `Verify:` block is the browser check for
  that line: zero `[LOG]` from `MiniTimeline.vue` on the template list.)
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

## F40. Logging out fires `GET /routine/settings` and logs a 401 — `resetAppState()` creates the store, and the plugin loads it

> ✅ **FIXED 2026-09-15.** `routineReviewStore.ensureLoaded()` returns early on `!useUserStore().isAuthenticated`
> and the chain has a `.catch(() => {})`, so the plugin's uncaught call never rejects and `isLoaded` stays
> `false` for a retry. `useSessionReset.ts`'s doc comment carries the rule for every future store in that
> list. Verified: *Log out* from `/` produces only `POST /auth/logout → 204` — no `routine/settings`, no
> console error; after signing back in, `/routine-todo-list` still fires `GET /routine/settings → 200`.

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

## F58. The EN `$vuetify` block is a hand copy of Vuetify's `en` export, minus two keys

> ✅ **FIXED 2026-09-15.** `common.en.ts` now has `import { en } from 'vuetify/locale'` and `$vuetify: en`;
> the 180-line copy is gone. Verified through the running app's i18n that `$vuetify.timePicker.notAllowed`
> and `$vuetify.command.search` resolve in EN, and typing letters into the masked *Length* field on
> `/activity-history/manual` (the same `TimePicker` as the Track Time dialog) logs no `[intlify]` warning.
> The SK side (`vuetifyLocale.sk.ts` → `import { sk }`) is still the framework's call, as this entry says.

- **Scope:** app-side `src/locales/common.en.ts:43-223`
- **Closes:** `home/A1` (+ the unfiled sibling key `command.search`)
- **Root cause:** `common.en.ts` carries a 180-line `$vuetify: { … }` object. Diffed this pass against
  `import { en } from 'vuetify/locale'` (the installed package, flattened): **124 keys upstream, 122 in
  the copy, zero differing values, zero extra keys** — it is byte-identical except for
  `timePicker.notAllowed` and `command.search`, which were added upstream after the copy was taken.
  `createAppVuetify.ts:78` routes Vuetify's own lookups through vue-i18n (`createVueI18nAdapter`), so a
  key the copy lacks is a console `[intlify] Not found '$vuetify.timePicker.notAllowed'` and a
  screen-reader announcement that never happens — exactly what the mutation pass saw typing a letter
  into `TrackTimeDialog`'s masked *Length* field. The SK side (`src/_common/_locales/vuetifyLocale.sk.ts`)
  is complete against `sk`; only EN drifted, because only EN is app-side.
- **Files:** `src/locales/common.en.ts` (the `$vuetify` key); `src/locales/EN.ts` only if the import
  is placed there instead
- **What to change:** Replace the object with `$vuetify: en` (or `{ ...en }` if any app override is ever
  wanted — none exists today). A locale that cannot drift is the fix; adding the two keys by hand is
  the same bug deferred to the next Vuetify bump. Consider the same for SK in the framework
  (`vuetifyLocale.sk.ts` → `import { sk } from 'vuetify/locale'`) — but that is a `vue_framework`
  change and **not this batch**; it is complete today, so nothing is broken there.
- **Do not change:** `httpErrors`, `validation`, `export` in the same file — those mirror the
  *framework's* Slovak `common`, not Vuetify, and are `F35`'s subject.
- **Verification:** `home/A1`'s `Verify:` block — the Track Time dialog, a letter into *Length*, no
  `[intlify]` warning. Then one `DataTable` footer and one `VDatePicker` in EN to confirm nothing else
  changed (nothing should — the values are identical).
- **Risk:** None beyond the import resolving — `vuetify/locale` is already imported by
  `createAppVuetify.ts`'s adapter path, so the package entry exists.

## F60. `MemoryAnchorFilter` sent `year`/`month`; the server reads `anchorYear`/`anchorMonth` — ✅ fixed and verified 2026-09-15

- **Closed:** the `year` and `month` cases of `leisure-bucket-anchors/B1`. The `minRating` case and
  everything on `/leisure/bucket-list` were §13, closed the same day by `B11` with no client change.
- **Root cause, as filed.** `MemoryAnchorFilterRequest` declares `AnchorMonth`/`AnchorYear` and
  `GridMemoryAnchorEndpoint.ApplyCustomFiltering` filters on them; the client's filter class named the
  two `year`/`month`, System.Text.Json dropped them, and the grid answered unfiltered with a 200. The
  client's **create** request, the response DTO and the `periodKey` sort expansion all already used
  `anchorYear`/`anchorMonth` — the filter was this module's own odd one out, which is why it was an app
  batch and not part of the escalation.
- **What changed.** `MemoryAnchorFilter.ts` — both constructor fields and `hasAny()`.
  `leisureFilterUrlState.ts` — `filterToParams` now maps `anchorYear → year` and `anchorMonth → month`;
  `paramsToFilter` was already positional and needed no edit. `MemoryAnchorsView.vue` — the two
  `draft.*` bindings, `:monthFilter`, `loadTimeline`'s strip object, the `timelineYear` getter/setter,
  and the two `chipFormatters` keys.
- **The URL keys stayed `year`/`month`**, so every existing bookmark still works. That asymmetry is now
  commented in both files rather than left to be rediscovered — `filterToParams` is the only place the
  two spellings meet.
- **`leisureFilterUrlState.test.ts` needed no change, and that is the point.** The batch predicted an
  edit at `:147`; there was none, because the test constructs `MemoryAnchorFilter` positionally and
  asserts on the **URL** keys. So the 9 green tests are a real pin on the half of this that had to not
  move. If that test had needed editing, the bookmark contract would have been broken.
- **Verified live** (signed in as the seed's primary user, backend carrying `B11`). Seed holds two
  anchors — July 2026 (7/10) and August 2026 (9/10, bucket list):

  | URL | data rows | |
  | --- | --- | --- |
  | *(none)* | 2 | baseline |
  | `?year=2025` | 0 | was 2 before the fix |
  | `?year=2026` | 2 | |
  | `?month=1` | 0 | was 2 before the fix |
  | `?month=7` | 1 | July row only |
  | `?minRating=8` | 1 | control — the `B11` half, no client change |
  | `?minRating=10` | 0 | control |
  | `?year=2026&month=7&minRating=5` | 1 | three chips render: *Year: 2026*, *Month: 7*, *Rating ≥ 5* |

  Watch the empty state when counting: it renders as a single `tbody tr`, so a naive row count reads
  `1` for "no matches". The request body confirms the wire half directly —
  `{"activityName":null,"anchorYear":2026,"anchorMonth":7,"minRating":5}`.
- **The Timeline step of the batch's verification could not be run, and not because of this change.**
  `?view=timeline` renders the empty state at any year: `loadTimeline` posts `itemsPerPage: 500` and the
  API answers `400 {"itemsPerPage":["Must not exceed 200."]}` — **`F61`, still open**, which the queue's
  ordering note already called out ("until they change neither the ladder nor the timeline renders
  anything, so nothing else on those two views can be verified"). What *was* confirmed on the timeline:
  its header reads *"Year: 2026"* from `?year=2026`, so `timelineYear` → `filter.anchorYear` → the URL
  codec round-trips, and the stripped request body carries `anchorYear: null, anchorMonth: null` — the
  rename reached `loadTimeline`'s `Object.assign` as required. **Re-run the twelve-month check when
  `F61` lands.**
- `npm run type-check` (`--build --force`) clean, `npm run lint` clean.

## F62. `NewMemoryAnchorForm`'s mount fetch has no `try/finally` — any failure is a permanent spinner

> ✅ **FIXED 2026-09-15.** `onMounted` now wraps the fetch in `try { … } catch { failed.value = true }
> finally { loading.value = false }`, and the template renders a distinct `error` alert (new locale key
> `leisure.errors.eligibleActivitiesLoadFailed`, SK + EN) instead of falling through to *"no eligible
> activities"* — both alerts keep the Backlog/Bucket-list links, per the original spec's "do not change"
> note. `vue-tsc --build --force` and `npm run lint` both clean. §12 landed the same day, so the failure
> branch is for real failures only now; verified live: opening *Add* on `/leisure/memory-anchors` against
> the restarted backend fetches and opens the Activity picker with no console error.

- **Scope:** app-side `src/core/leisure/component/memoryAnchor/NewMemoryAnchorForm.vue:105-118`,
  `src/core/leisure/_locales/leisure.{en,sk}.ts` (one new key each)
- **Closes:** the frontend half of `leisure-bucket-anchors/X3`. The endpoint itself is **§12**, resolved
  the same day — see *Closed escalations*.
- **Root cause:** `onMounted` awaited `fetchAnchorEligibleActivities()` and only then set
  `loading.value = false` (`:110-111`). A rejection skipped the second line: the Activity picker kept its
  spinner and its literal `0` (`F63`), and the designed fallback (`leisure.errors.noEligibleActivities`,
  gated on `!loading && length === 0`) could never render. Every call rejected before §12 landed, because
  the route the client called was not declared anywhere in the API — the 400 body (*"Value
  [anchor-eligible-activities] is not valid for a [Int64] property"*) was the `/{id}` route swallowing the
  path, not an ordering bug.
- **What changed:** `try { … } catch { failed.value = true } finally { loading.value = false }`, plus a
  `failed` ref. The template's `VAlert` branch is now `v-else-if="failed || (!loading &&
  eligibleActivities.length === 0)"`, switching `type` and message key on `failed` so a real failure never
  reads as "you have nothing to anchor" — both alerts share the same Backlog/Bucket-list links.
- **Do not change:** `memoryAnchorApi.ts:31-34` — the path is the contract §12's endpoint honours.
- **Verification:** `X3`'s `Verify:` block — open *Add* on `/leisure/memory-anchors`; with the endpoint
  live the Activity picker populates with no console error. The negative path (route the endpoint to a
  500/400 with `playwright-cli route`) shows the distinct error alert, not the empty-state one.
- **Risk:** None.

## F67. A session that rounds to zero minutes is handled three ways by three views — and none of them tells the user

> ✅ **FIXED AND VERIFIED LIVE 2026-09-15.** Option **(a)**, as settled by retired §15. New module composable
> `src/core/activityHistory/composable/useSessionLength.ts` owns both halves — `sessionLengthFromMs()` (half-up,
> so the cliff is 30 s on every view, built on `Time.fromMinutes` so 59m40s normalizes to 1h 0m instead of the
> 0h 60m `TimePrecise.toTimeLength` builds) and `discardIfTooShort()` (the `history.sessionTooShortToLog`
> snackbar, both locales). All three `finishSession()`s call it before the save dialog, and
> `TimerView.timePassed()` now takes the session's own milliseconds instead of subtracting one rounded `Time`
> from another.
>
> **A fourth zero-length path turned up while doing it, and is fixed too:** the pomodoro's *rest* record was
> guarded by `restElapsedMs > 0`, so a 20-second break rounded to `{0,0}` and posted — a 400 since §15 landed.
> It now rounds through the same helper and is skipped when it rounds to nothing, silently, because the user
> confirmed the focus record and not the break.
>
> **Two behaviour changes beyond the message**, both deliberate: the pomodoro used to *floor* (45 s → 0) and now
> rounds like the other two (45 s → 1m), which is what the verification block below demands of it; and the
> discard in the pomodoro and the stopwatch sits **before** the `activityId` embedder branch, as `TimerView`'s
> always has — `TrackTimeDialog` can no longer be handed a `{0,0}` to render as *"Task done for 00:00"* and post
> through its caller. The embed branch itself is untouched, as *Do not change* asks; it is simply unreachable
> with a zero now.
>
> **Verified in the browser** (signed in as the seed's primary user, EN): pomodoro Start→Stop in one tick → the
> snackbar, no dialog, and no `POST /api/activity-history`; stopwatch at ~10 s → the same; stopwatch at 45 s →
> *"done for 1m"* and a **201** on Confirm; timer (15 m set) stopped at ~0.3 s → the snackbar, and at 45 s →
> *"done for 1m"*. Console clean. `vue-tsc --build --force` and `npm run lint` both 0. The SK string was added
> in the same commit but only EN was seen on screen — the fixture account is `locale: 'EN'`.
>
> **One row written:** the 45-second stopwatch confirm above is a real 1-minute record on the seed account.
> Reseed when convenient — the same reseed clears the pre-existing `{0,0}` rows (`id 15503`).

- **Scope:** app-side `src/core/activityHistory/component/PomodoroTimerView.vue:255-281`,
  `src/core/activityHistory/view/TimerView.vue:204-224`, `src/core/activityHistory/view/StopWatchView.vue:172-201`,
  `src/core/activityHistory/_locales/activityHistory.{sk,en}.ts` — **and, as landed, the new
  `src/core/activityHistory/composable/useSessionLength.ts`, which is where "one policy in one place" ended up**
- **Closes:** `history-capture/B4`, `history-capture/B5`, and the **unfiled stopwatch twin** (below)
- **Root cause — confirmed in source, and it is one gap seen from three sides.** Every capture view ends
  in a `finishSession()` that turns elapsed time into a `Time` (whole minutes) and hands it to
  `SaveActivityBody`, and each one answers "what if that is zero?" differently:
  | view | how it rounds | under a minute |
  | --- | --- | --- |
  | Timer (`:216-219`) | `initialTime − remaining.toTimeLength` — `TimePrecise.toTimeLength` rounds seconds to the nearest minute, so a 10-minute timer stopped at 0:15 is `10 − 10 = 0`, at 0:45 it is `1` | `if (length.getInMinutes <= 0) { store.clearSession(); return }` — **discarded, nothing shown** (`B5`) |
  | Pomodoro (`:260`) | `Time.fromSeconds(floor(ms/1000))` — **floors**, so anything under 60 s is `0` | **no guard** → `SaveActivityBody` renders `activities.confirmSaveActivity` with `timeSpent.getNice`, which is `"" + ' ' + ""` for `{0,0}` (`Time.ts:40-42`) → *"done for ?"*; Confirm → `POST /api/activity-history` `{"length":{"hours":0,"minutes":0}}` → **201** (`B4`) |
  | Stopwatch (`:177`) | `TimePrecise.fromSeconds(...).toTimeLength` — rounds, so 0–29 s is `0`, 30–59 s is `1` | **no guard** — under 30 s it is `B4` exactly, one view over; source-certain, the unit did not stop a stopwatch that fast |
  The manual form, for contrast, refuses `!timeLength.isNotZero()` before it asks the server
  (`AddActivityManuallyForm.vue:70`). So the account could already hold zero-length rows from two of the
  four capture flows — and **as of 2026-09-15 the server takes them no longer: the validator is
  `Length.TotalSeconds > 0` (*"Length must be positive."*) on both `POST` and `PUT` (retired §15, body under
  *Closed escalations*). That moved the failure rather than fixing it** — an unguarded sub-minute session
  ended in a **400** after the user had been shown *"done for ?"* and pressed Confirm, instead of writing a
  row, which is why this batch was no less needed once the backend half landed. The unit's own root-cause
  line is right — *"nobody wrote down what should happen when a session ends before it produces a whole
  minute"* — and that is why this was one batch and not two: fixing Pomodoro to match Timer would have
  shipped a silent discard to a second view, and fixing Timer to match Pomodoro the malformed prompt.
- **Files:** the three `finishSession()`s above; `src/_common/dto/dto/Time.ts:40-42` was **not** in scope
  (below) and was not touched
- **What changed:** the same branch in all three views **before** `openDialog(SaveActivityBody)` — option
  **(a) discard with a message**: when the rounded length is zero, `store.clearSession()` and the
  `history.sessionTooShortToLog` snackbar (new key, both locales, worded as information rather than an error
  — the timer's *"please set a duration"* is not it). (a) matches `runningTimerStore.ts`'s own rule 2
  (*"never fabricate time the user did not spend"*), which the rejected **(b)** mildly broke for a 5-second
  session. Note the seconds were never on the wire either way: both `src/_common/dto/dto/Time.ts` and the
  server's `IntTime` are `{hours, minutes}`, so (b) was never "keep the seconds" — it was "round a 5-second
  session up to a whole minute". The rounding helpers (`toTimeLength` vs `Time.fromSeconds`) were unified in
  the same commit, so the 30-second cliff is the same on every view. The manual form's own guard is
  untouched — it is the fourth view already doing (a) without the message.
- **Do not change (honoured):** `Time.getNice` in `src/_common` — hardening it to say *"0m"* would have made
  the prompt *read* sensibly while the view still wrote a zero row, i.e. fixed the symptom the finding
  photographed and not the one it filed. It is a framework line with eleven consumers (grep `.getNice`), and
  the fix here makes it unreachable with a zero rather than teaching it to render one. Also `TimerView`'s
  `activityId` embedded path (`:220-224`) — an embedder gets the numbers and decides for itself; the guard
  sits in front of that branch (as it always did in this view), the branch itself is unchanged.
- **Verification:** `B4`'s `Verify:` block (Pomodoro: Start → Stop inside a second → **no** *"done for
  ?"* dialog, and no `POST` with `{0,0}`); `B5`'s (Timer: Start → Stop under a minute → the user is told;
  `requests` shows `timer-alarm/cancel` and nothing else); then the stopwatch at ~10 s, which must behave
  like (a) and not like the old Pomodoro; then a **45-second** timer and a **45-second** stopwatch, which
  both still save one minute. All five run and passed — see the block above. Both locales for the new key:
  EN seen live, SK by file. Reseed once to clear the **pre-existing** `{0,0}` rows (`id 15503`, seeded
  before the validator changed) and the one row this verification wrote.
- **Risk:** Low. Three small branches, and (a) was settled before the work started.

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

## FW14. Registration's 2FA recovery codes are received and discarded — the settings-side enrolment already shows them, one file over

> ✅ **Landed 2026-09-21** as prescribed below (`vue_framework` `22680c1`, bump `8075399d`):
> `utils/recoveryCodes.ts` lifted out of `SecuritySection`, `RegistrationView.open2FADialogs` opens the
> QR (with its `B22` key) then `RecoveryCodesBody` then `goToLogin()`, and both "nothing received" arms
> navigate. Verified live (throwaway with 2FA ticked → QR + key → five codes, *Done* gated → `/login`
> with the prefill) and `auth.draft.spec.ts:104` is promoted to a real test. `FW13`'s remaining half
> (the `catch` and `P1`'s links) is untouched.

- **Scope:** **[framework]** `src/_common/modules/user/view/RegistrationView.vue:118-129,149-158`, a new
  `src/_common/modules/user/utils/recoveryCodes.ts` (lifted from `SecuritySection.vue:261-267`),
  `src/_common/docs/modules/user.md` — submodule commit, then pointer bump
- **Closes:** `auth/B8` (round 1's `U1`, **now browser-observed** in round 3 — the number the ninth pass
  reserved for exactly this)
- **Root cause:** Confirmed by direct read, and the unit's evidence is the response body itself.
  `validateAndSendForm`'s success branch (`:149-158`) tests `response.data.recoveryCodes` for truthiness
  and then calls `open2FADialog(response.data.qrCode)` — the codes are the *condition* and never the
  *argument*. `open2FADialog` (`:118-129`) opens `QrCodeFor2FABody` with `{ qrCodeImage }` only, awaits
  *Done*, and `goToLogin()`s. `QrCodeFor2FABody.vue:15` declares one prop. The server sends
  `{ twoFactorEnabled, qrCode, recoveryCodes: [5 codes] }` (`TwoFactorAuthResponse.cs`,
  `BaseRegisterUserEndpoint.cs:86-113`; round 3 read them off `response-body`), and after *Done* they
  exist nowhere the user can reach — a brand-new account whose owner loses the authenticator has no way
  back in. The settings-side enrolment solved this in `prompts/_done/user/framework/F1-2fa-recovery-codes.md`:
  `SecuritySection.vue:196-197` → `normalizeRecoveryCodes(data)` → `openRecoveryCodesDialog(codes)` →
  `RecoveryCodesBody` (`:269-281`, `persistent: true`, `hasCloseBtn: false`, *Done* to dismiss). F1 landed
  for the regenerate path and missed this one.
- **Files:** `RegistrationView.vue:118-129,149-158`; `utils/recoveryCodes.ts` (new — `normalizeRecoveryCodes`
  moved out of `SecuritySection.vue:261-267` so both call sites share it; `SecuritySection` imports it);
  `docs/modules/user.md` (the registration flow's description gains the second dialog)
- **What to change:** After `open2FADialog(qrCode)` resolves and before `goToLogin()`:
  `await openDialog({ component: RecoveryCodesBody, componentProps: { codes: normalizeRecoveryCodes(response.data) }, dialogProps: { title: i18n.t('user.recoveryCodes'), confirmBtnLabel: i18n.t('general.done'), hasCloseBtn: false, persistent: true, isSmall: false } })`
  — the `SecuritySection` call, verbatim, so the two enrolment paths render the same body with the same
  copy/download affordance. Order: QR first (the authenticator must be enrolled before the codes mean
  anything), codes second, then login. Adjacent, same branch: the `noRecoveryCodesReceived` and
  `noQrCodeReceived` arms (`:154,:157`) show a snackbar and **never navigate** — the user is left on a
  submitted registration form with an account already created; end both with `goToLogin()`.
- **Do not change:** `QrCodeFor2FABody` (it is the QR dialog; two responsibilities in one body is how
  the codes got dropped); `SecuritySection`'s own flow beyond the import; the server. Do not batch with
  `FW13` — same file, different finding, different reason (`FW15`/`FW2` precedent); one submodule commit
  may carry both if it says so.
- **Verification:** `B8`'s `Verify:` block — register a throwaway with *use 2FA* ticked → QR dialog →
  *Done* → **a second dialog listing five codes** with the copy/download control `RecoveryCodesBody`
  already has → *Done* → `/login` with the prefill. Then `/user/settings` → enable 2FA on a throwaway →
  confirm the settings path is unchanged. **Reseed after** — two accounts are mutations. Promote
  `e2e/tests/auth.draft.spec.ts:104`.
- **Risk:** Low, two repos. Every app on the framework gains a second dialog on 2FA registration — the
  one the settings page already shows, so no app's user sees a shape they have not seen.

## FW25. Three hydrations per settings visit, each pushing the browser time zone — and one of them can race a step-up write into Identity's concurrency check

> ✅ **Landed 2026-09-21**, the same afternoon it was filed (`vue_framework` `22680c1`, bump `8075399d`).
> (1) `hydrateFromServer` shares one in-flight promise; (2) `timeZoneSync` remembers the last zone it
> pushed; (3) `UserSettingsView.onMounted`'s call is kept — with (1) it is free on a full load and on an
> SPA navigation it is the refresh the sessions list wants; (4) `VerifyUserForm` words only a 401.
> **Grown while verifying (4):** a wrong step-up password did not merely show the wrong sentence — it
> **signed the user out**. `/user/2fa/toggle` is not in `AUTH_ENDPOINTS`, so its 401 went through
> refresh-and-retry, the retry resent the same wrong password, and the retry's 401 is the interceptor's
> `logoutClient()` branch. Filed and fixed as `user-settings/B4`: `VerifyUserForm` posts with
> `{ _credentialCheck: true }`, and the interceptor hands a 401 without `X-Token-Expired` straight back
> to such a caller. Verification: `two-factor.spec.ts` test 1 — a wrong password → 401, *"Wrong
> password"*, dialog still open, still `/user/settings` — then the right one. And the batch's own
> verification line: with the spec's `networkidle` wait removed, test 1 passes (it failed on every run
> before) — one PUT per page load can still in principle overlap a very fast click, which is why the
> wait stays in the spec and the optional backend retry stays optional.

- **Scope:** **framework** — `src/_common/modules/user/store/authStore.ts:22-31` (`hydrateFromServer`),
  `src/_common/bootstrap/installFramework.ts:177`, `src/_common/modules/user/view/UserSettingsView.vue:47`,
  `src/_common/modules/user/utils/timeZoneSync.ts`. Submodule commit, then pointer bump. A backend half
  is optional and named below.
- **Closes:** `user-settings/B3` (new 2026-09-21, found by `two-factor.spec.ts`).
- **Root cause:** Confirmed by trace, deterministic on a freshly seeded account. `hydrateFromServer()`
  runs three times on the way to `/user/settings` after a form sign-in — `login()` (`authStore.ts:57`),
  the boot hook (`installFramework.ts:177`, on the full page load) and `UserSettingsView.onMounted`
  (`:47`) — and with `syncBrowserTimeZone: true` **each one** compares the server's zone with the
  browser's and `PUT /user/preferences` when they differ. The fixture accounts are seeded `UTC`
  (`E2eFixtureSeeder.cs:364`) and a real user's stored zone drifts too, so this is not a test artefact:
  the first PUT is aborted by the navigation, the other two land ~0.4 s apart. A `POST /user/2fa/toggle`
  sent while one is in flight loads the user row before the PUT saves, and its own `UpdateAsync` fails
  `IdentityResult` concurrency → **400 "Optimistic concurrency failure, object has been modified."** —
  which `VerifyUserForm.onConfirm`'s bare `catch` (`VerifyUserForm.vue:54-56`) words as *"Wrong
  password"* and clears the form, so the user retypes a password that was right. Every `VerifyUserPreProcessor` route
  is exposed the same way (password change, e-mail change, delete account, 2FA reset). Plain HTTP with no
  hydration in flight succeeds, which is what isolates it. Note for `FW24`: its claim that a concurrency
  failure *"cannot be produced today"* holds for the 409 path; this one is Identity's, on a 400.
- **What to change:** (1) `hydrateFromServer` de-duplicates — one in-flight promise shared by concurrent
  callers, the way the `ensureLoaded` convention already asks of stores. (2) The time-zone push happens
  **at most once per session**, not per hydration: remember the last pushed zone and skip when it matches
  (`timeZoneSync.ts` already reads the browser zone per call; it needs a "last pushed" beside it). (3)
  `UserSettingsView.onMounted`'s re-hydration is redundant with the boot hook on a full load and with
  `login()` on an SPA navigation — keep it only if something on the page needs fresher data than the
  store holds, and say what. Optional backend half: `BaseToggleTwoFactorAuthEndpoint` (and the other
  step-up routes) could retry once on `ConcurrencyFailure`, since the preference write does not touch
  what they change; not filed as a `B2x` — the client-side fix removes the writer. (4) Folded in, same
  module: `VerifyUserForm`'s `catch` should say *"Wrong password"* only for a **401** — anything else is
  not the user's password, and today it is reported as if it were.
- **Do not change:** `syncBrowserTimeZone` itself (`useUserClock`'s reason for existing) or the seed's
  `UTC`.
- **Verification:** `two-factor.spec.ts` test 1 **without** its `waitForLoadState('networkidle')` line —
  it is the reproducer, and passes only because of that wait today. Then the request log on
  `/user/settings` after a form sign-in from a browser in a non-UTC zone: one `GET /user/data` per
  navigation, one `PUT /user/preferences` per session.
- **Risk:** Low. Fewer writes; nothing user-visible changes except the race disappearing.

## F47. Selecting an app on `/activity-tracking/android` opens no detail — a local panel from the data on the page; a per-app session count is not on the wire

> ✅ **Landed 2026-09-21** (`c2075f61`) together with `B23`'s frontend half (§18) — the ask landed the
> same day the batch was written, so the panel was built once with both halves: the instant rows below
> (total, share, package; `pieChart.shareOfSpan` / `pieChart.packageName`) and, under a divider, the
> fetched figures. The *"do not add an Android `details` fetch"* line is therefore void, as its own last
> sentence anticipated. One deliberate deviation: the close button takes `pieChart.closeDetails` (*Close
> details* / *Zavrieť detaily*), the key `F46` prescribes, rather than a fourth hand-typed label — `F46`
> should retire `closeDomainDetails` onto it. The `summaryCardsData` baseline row was not added. Verified
> per the block below: card and slice both toggle, `?selected=Spotify` opens from the URL, the folded
> slice selects nothing. `tracking-dashboards.draft.spec.ts`'s `B2` fixme is a real test.

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
  the `AndroidSessionData` rows the endpoint already groups) and is now **written as `B23`** — escalation
  §18, `prompts/view-docs/backend/B23-android-per-app-detail-endpoint.md` — not batched here.
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
  `pieChart.packageName`. **The folded-tail row needs no local guard** — it used to: with `minPercent: 1`
  (`AndroidActivityDashboard.vue:170`) the endpoint folds the tail into one row, and until 2026-09-16 that
  row's `packageName`/`appLabel` were the literal `"Other"`, which `ActivityPieChart` did not recognise as
  its sentinel, so the slice was selectable and would have opened a panel titled *Other* with package
  *Other*. Backend `B16` landed (§10, closed — body in the log): all four pie endpoints now emit `_other`,
  which `ActivityPieChart:150` already refuses to select and `:62` already translates. Write
  `selectedDetails` against `props.apps` as above and nothing reaches it; do **not** add the skip that
  earlier revisions of this batch asked for.
- **Do not change:** the `summary-cards`/`pie-chart` request shapes; `ActivityPieChart.vue` (`F48`
  edits it — coordinate, do not both touch `:9-28`); the desktop pattern — do **not** add an Android
  `details` fetch against an endpoint that does not exist. Not `ActivityDomainCard`'s label (§80).
- **Verification:** `B2`'s `Verify:` block with the pass condition read as: *selecting an app changes
  the side panel to that app's own detail — its total time, share of the span, and package name — and
  the close button clears it and `?selected`*. Then: deselect by clicking the same card and by clicking
  the slice; reload with `?selected=Spotify` and confirm the panel opens from the URL (the model is
  URL-backed via `useActivityDashboard`'s `selectedItem`); select a card whose app is under the pie's
  threshold if the seed has one, and confirm the folded slice reads *Ostatné* and selects nothing.
  `tracking-dashboards.draft.spec.ts:126`
  is the `fixme` to fill in. SK as well as EN for the two new keys.
- **Risk:** Low. Additive branch; nothing selected renders exactly today's card. The only judgement
  call is whether a three-row panel is worth opening — it is, because the alternative is a card that
  says *"View details"* and a URL that says `?selected=` for a selection nothing displays.

## F61. Ladder and Timeline ask for 500 rows against a cap of 200 — and a failure renders as "empty"
> ✅ **FIXED 2026-09-21, in the same session as `F79`.** Both constants are 200 with the `ProjectsView`
> comment; both loaders gained a `catch` that sets a `failed` flag (a cancellation from the composable's
> own abort is excluded via `isRequestCanceled`) and the ladder/timeline render `LeisureEmptyState`'s error
> branch — *"Couldn't load this list. This doesn't mean it's empty."* + *Try again* — over the empty copy.
> The board got the same `catch` while its component was being taught the branch anyway; `ProjectsView`'s
> constant and comment are untouched. Verified live: `/grid` 200 on both surfaces, the seeded bucket-list
> row on rung 3, July (*Retired Hobby*) and August (*Learn Bouldering*) 2026 shaded and the other twenty
> months empty; `route … --status=500` on each grid rendered the error branch, `unroute` + *Try again*
> brought the rows back. `X1`, `X2` closed.


- **Scope:** app-side `src/core/leisure/view/BucketListView.vue:142,149-160`,
  `src/core/leisure/view/MemoryAnchorsView.vue:120,131-145`
- **Closes:** `leisure-bucket-anchors/X1`, `X2`
- **Root cause:** `BaseGridEndpoint.MaxItemsPerPage` is **200** and the base answers a 400 naming the
  field above it (`BaseGridEndpoint.cs:31,104-106`). `LADDER_PAGE_SIZE = 500` and
  `TIMELINE_PAGE_SIZE = 500` therefore fail on every load, and both loaders are `try … finally` with no
  `catch`: the rejection propagates to the console, `ladderItems`/`timelineItems` keep their initial
  `[]`, and the view's empty-state copy renders — *"You don't have any here yet"* over a table that
  showed rows a second earlier. `ProjectsView.vue:118-122` fixed the identical constant to 200 with a
  comment that names this exact failure; the grep this pass (`PAGE_SIZE =` under `src/core`) finds no
  third 500 — `useLeisurePicker.ts:48` is already 200.
- **What to change:** Both constants to 200, with `ProjectsView`'s comment. Then the half `ProjectsView`
  did not do: a `catch` that sets an error flag, and an error branch in each view distinct from the
  empty state — the README's *Class 1* note (*"give the table component an error state distinct from its
  empty state"*) is the same ask, and `F27` is the pattern (`useActivityDashboard`'s error/retry). A
  user with more than 200 bucket-list rows or anchors would then see a truncated ladder/timeline rather
  than a 400 — say so in a comment; paging the ladder is not this batch.
- **Do not change:** `ProjectsView.vue`; the server cap (it is documented and deliberate).
- **Verification:** `X1`'s and `X2`'s `Verify:` blocks — no 400, the seeded row on rung 3, July and
  August 2026 shaded. Then `playwright-cli route "**/api/activity-bucket-list-profile/grid" --status=500`
  and toggle to Ladder: the error branch, not the empty copy.
- **Risk:** Low. Two constants and two small template branches.

## F79. Filtering to zero shows the "you have none at all" onboarding copy, on every leisure surface
> ✅ **FIXED 2026-09-21, in the same session as `F61`.** One `LeisureEmptyState.vue` (icon, translated
> onboarding message, `filtered`, `failed`; emits `onAdd` / `onClearFilters` / `onRetry`) replaced the seven
> hand-copied blocks and their seven `.empty-state` style copies. Precedence is failed → filtered → empty:
> a failed fetch says nothing about what the filter would have matched. `filtered` is the view's
> `filter.hasAny()`, except on the timeline, where only `activityName` / `minRating` count — year and month
> are navigated client-side, so an empty chosen year is still the genuinely-empty case. *Clear filters*
> reassigns a fresh filter DTO, which is what `FilterPanel`'s own reset does. Three locale keys under
> `leisure.emptyStates` (`filtered`, `clearFilters`, `loadFailed`), SK and EN; *Try again* is
> `general.retry`. The trap in the risk line did not bite — no leisure `hasAny()` counts a default.
> Verified `?activityName=zzzz` on all seven surfaces (backlog, bucket-list table + ladder, anchors table +
> timeline, projects table + board): *"Nothing matches these filters."* + *Clear filters*, the click
> dropped the param and the backlog read *1-1 of 1*; signed in as `secondaryUser`, every surface still
> rendered its onboarding copy + *Add* — `leisure-projects/U1`'s unseen table `#noData` half included.


- **Scope:** app-side `src/core/leisure/component/project/{ProjectTable.vue:33-51,ProjectReadinessBoard.vue:7-24}`,
  and the same branch on `BacklogTable`, `BucketListTable`, `BucketListLadder`, `MemoryAnchorTable`,
  `MemoryAnchorTimeline`
- **Closes:** `leisure-projects/P3`
- **Root cause:** every empty state keys on `items.length === 0` alone. A filter that excludes the one
  seeded row produces the identical *"These are things you're building or making. You don't have any
  projects here yet."* plus a prominent *Add* CTA — which reads as "you have never created one" and
  nudges toward creating a duplicate rather than clearing the filter. The filter chips are visible in
  the toolbar above the copy at the same time, which is the tell.
- **What to change:** branch on `filter.value?.hasAny()` — **already implemented on every leisure filter
  DTO**, which is why this is cheap — and render a "no results for these filters" message with a *clear
  filters* action in place of the Add CTA. One locale key pair, reused by all six surfaces.
- **Do not scope this to the projects view.** All four leisure surfaces came out of one
  `L4-onboarding-empty-states.md` pass and share the shape; the finding says so and the source confirms
  it. A fix that teaches only the board leaves three tables lying. It also overlaps `F61`: the ladder and
  timeline render the *empty* state on a failed fetch, so after `F61` there are **three** states to tell
  apart — empty, filtered-to-zero, failed. Decide the copy for all three at once.
- **Verification:** `P3`'s `Verify:` block on the board and the table, then one filtered-to-zero load on
  each of the other four surfaces. Keep a genuinely empty account (or `secondaryUser`) in the same
  session to confirm the original copy still renders where it should.
- **Risk:** Low. The only trap is a filter DTO whose `hasAny()` counts a default the user did not set —
  check each before trusting it.

## F73. Three activity-keyed leisure profile DTOs drop the server's `id` — nine write call sites key the REST route by the wrong number
> ✅ **FIXED 2026-09-21.** Exactly as *What to change* says: `id` is the first constructor parameter on
> all three DTOs, destructured in `fromJson` with `id = 0` (the `MemoryAnchor` shape), the aliasing
> getter is gone, and the nine call sites pass `item.id` / `entityToEdit.id` — the three edit forms'
> `idToEdit` too, matching `MemoryAnchorForm`. `activityId` stays where it is the business key
> (`useLeisurePicker` candidate keys, `ExperiencedCell`, the request DTOs, the board's `pendingIds`).
> `vue-tsc --build --force` 0 errors, lint clean. Verified live on `/leisure/projects` against the seed:
> a status click sent `PUT /activity-project-profile/17201` → 200 and the card moved; the edit dialog
> saved → 200 and the table showed the new value after the grid refetch; *Delete* → `DELETE …/17201`
> → 204 and the board rendered the empty state after a reload (fixture reseeded afterwards). The
> backlog and bucket-list surfaces share the DTO shape and the same one-token call-site change, so they
> were not driven separately; `leisure-backlog-picker/U1` and `leisure-projects/U1` (the genuinely-empty
> states) are now unblocked. `F76` landed in the same session, as the batch required.

- **Scope:** app-side `src/core/leisure/dto/response/{ActivityProjectProfile,ActivityBacklogProfile,ActivityBucketListProfile}.ts`
  + nine call sites (`BacklogTable.vue:151`, `BacklogProfileForm.vue:48`, `BucketListTable.vue:133`,
  `BucketListProfileForm.vue:48`, `BucketListLadder.vue:214`, `ProjectTable.vue:108`,
  `ProjectProfileForm.vue:35`, `ProjectReadinessBoard.vue:231,242`)
- **Closes:** `leisure-projects/X1`, `leisure-backlog-picker/X1 (round 2)`, `leisure-bucket-anchors/X4`
  — three `blocker`s, three units, one cause. Also folds `leisure-projects/X1`'s own status-change half
  (the readiness board's one-click `update`, which is the entire point of `P1-readiness-board.md`).
- **Root cause:** all three DTOs declare `get id(): number { return this.activityId }` and **their
  `fromJson` never destructures `id` at all** — read this pass, all three files: the server's own primary
  key is dropped on the floor at parse time. Every write call site then passes `.activityId` explicitly
  (not even through the getter), and the REST routes are keyed by the profile row's id. Confirmed by
  three units independently and settled by direct request: `DELETE /api/activity-project-profile/12009`
  (activityId) → 404 vs. `/17202` (the row's id) → **204**; the same pair on bucket-list (`12009` → 404,
  `17102` → 204) and a `GET` pair on backlog (`12005` → 404, `17002` → 200). `MemoryAnchor` is the
  control: it carries a real `id`, `MemoryAnchorTable.vue:156` passes `item.id`, and its edit and delete
  both work.
- **Re-graded `med` → `high` by the sixteenth pass, which read the API rather than the units'
  observations.** The three grid responses project `Id = e.Id` **and** `ActivityId = e.ActivityId` as
  two distinct fields (`ActivityProjectProfileResponse.cs`, `ActivityBacklogProfileResponse.cs:93-94`,
  `ActivityBucketListProfileResponse.cs:48-49`), and every write route is the base `{id}` — including
  the readiness board's, which only re-routes the *suffix*
  (`PatchActivityProjectProfileStatusEndpoint.cs` → `/activity-project-profile/{id:long}/status`). The
  part no unit could see: **authorization runs on the row the id found**, not on the row the user meant
  — `AuthorizeAsync` is `ownership.OwnsActivityAsync(DbContext, User.GetId(), entity.ActivityId, ct)`
  on all three entities. So a 404 is the *benign* outcome, and it is only the outcome because profile
  ids and activity ids happen not to collide in the current fixture (profiles are seeded in the 17xxx
  band, activities in 12xxx). Where the numbers do meet — a long-lived account, or any future
  reseeding — the ownership check **passes** and the edit, delete or status change lands on a different
  profile of the same type belonging to the same user, with no error anywhere. That is a silent
  wrong-row write, which is why this stops being a `med`.
- **Not an escalation, and one finding says otherwise.** `leisure-backlog-picker/X1 (round 2)` calls this
  *"a contract question between the DTO and the API… flag to whoever owns the backend contract before
  picking a fix"*. It is not: the other two units answered it empirically (a direct request against the
  row's own id succeeds on both surfaces), so the server's keying is known and this is entirely app-side.
  Do not write a backend ask for it (*Contradictions* §115).
- **What to change:** add a real `id` to each of the three constructors and destructure it in `fromJson`
  (`id = 0`, first parameter, matching `MemoryAnchor`); **delete the getter**, which is what made the
  mistake invisible — with it gone, `item.id` is the row id everywhere and a call site that still means
  the activity has to say `activityId`. Then change the nine call sites to `item.id` /
  `entityToEdit.id`. All three `implements IIdResponse`, so a real field satisfies the interface the
  getter was faking.
- **Do not change:** the places where `activityId` is genuinely the business key — `ExperiencedCell`'s
  reverse lookup, `useLeisurePicker`'s candidate `key`, and the request DTOs' `activityId` field, which
  is the relationship the server stores. One activity has at most one profile; that model is correct and
  this batch is only about which number addresses the *row*.
- **Verification:** each finding's `Verify:` block — a status click moves the card and the column counts
  change; an edit closes and persists across a reload; a delete removes the row and a reload does not
  bring it back. Do all three surfaces, plus the ladder's own delete action
  (`BucketListLadder.vue:214`), which no unit exercised. Then re-run `e2e/tests/leisure-profiles.spec.ts`.
- **Risk:** Medium. Three DTOs and nine call sites in one commit — a half-migration leaves some surfaces
  404ing and some working, which is harder to reason about than the current uniform failure. Run
  `npm run type-check`; deleting the getter is what makes the compiler find anything missed.

## F76. `estimatedHours` 8.5 displays as "9" and **submits** as 9
> ✅ **FIXED 2026-09-21, in the same session as `F73`.** `:precision="null"` added beside `:step="0.5"`,
> copied from `UseTemplateActionBar.vue:33-34`; `componentDefaults` untouched. Verified: the edit dialog
> on the seeded project opened on **"8.5"** (was "9"), and typing `8.25` then *Save* sent
> `"estimatedHours":8.25` and the table cell read `8.25` after the refetch — step 3 of `B4`'s block, the
> one that distinguishes `null` from `1`. `FW22` (the framework twin in `TableCellEditor`) is untouched.

- **Scope:** app-side `src/core/leisure/component/project/NewProjectProfileForm.vue:35-39`
- **Closes:** `leisure-projects/B4`
- **Root cause:** `VNumberInput`'s `precision` prop defaults to `0`, independently of `step`. The field
  sets `:step="0.5"` (right, for the increment buttons) and no `:precision`, so Vuetify formats *and
  coerces* to whole numbers. Opening the edit dialog on the seeded `estimatedHours: 8.50` shows "9" in
  the raw `<input>`, and an untouched *Save* sends `"estimatedHours":9`. No user action on the field is
  required — opening and saving is enough.
- **The fix already exists in this repo.** `dayPlanner/component/normal/UseTemplateActionBar.vue:33-34`
  is `:step="0.5" :precision="null"` — copy that pair, do not invent a digit count. `:precision="1"`
  (the finding's suggestion) would silently truncate a value with two decimals; `null` disables the
  coercion, which is what a free-form hours field wants.
- **Land it with `F73`.** Today the corruption is masked: the `PUT` 404s before it can persist. The
  moment `F73` lands, every project edit dialog opened and saved rewrites the row. This is the one
  ordering constraint in the fifteenth pass that is not a convenience.
- **Do not change:** `componentDefaults`. A global `precision: null` would turn every integer field in
  the app into a decimal one (rule 4 territory, and the wrong default for counts).
- **Verification:** `B4`'s `Verify:` block, all three steps — including step 3, a value with two decimal
  digits, which is what distinguishes `null` from `1`.
- **Risk:** None app-side. The framework twin is `FW22`.

## F63. Four leisure request DTOs default their lookup ids to `0` — the pickers show "0", the required rule passes, and the server is asked to create with `activityId: 0`
> ✅ **FIXED 2026-09-21, in the same session as `F77` (its ordering constraint — `F63` first).** All
> eight fields are `number | null = null` in constructor and `fromJson` on the four DTOs;
> `MemoryAnchorForm` passes `presetActivityId` through instead of `?? 0`. Every consumer already typed
> the id as nullable (`ActivityAutocompleteWithCreate`'s model is `number | null`) — `vue-tsc --build
> --force` 0 errors, lint clean, the leisure unit tests unchanged. Verified live on `/leisure/backlog`:
> the fresh *Add* dialog renders Location / Weather / Cost empty, not "0"; *Create* untouched shows
> *This field is required* under Activity and (after `F77`) the three selects, and the request log
> holds no `POST /activity-backlog-profile`. `requiredRule` untouched.

- **Scope:** app-side `src/core/leisure/dto/request/{ActivityBacklogProfileRequest,ActivityBucketListProfileRequest,MemoryAnchorRequest,ActivityProjectProfileRequest}.ts`
  + the four `New*Form.vue` components that bind them
- **Closes:** `leisure-backlog-picker/X3` (the `0`-default half; the "no snackbar" half is under *Needs
  verification* — §91), `leisure-bucket-anchors/B2` (+ the unfiled fourth DTO,
  `ActivityProjectProfileRequest.ts:7`, found by grep: `public \w+Id: number = 0` hits eight fields in
  four files, all in this module — `MergeActivitiesRequest.survivorId` is the only other and is set
  before use)
- **Root cause:** `ActivityBacklogProfileRequest.ts:6-13` defaults `activityId`, `locationTypeId`,
  `weatherDependencyId`, `expectedCostTierId` to `0`; `ActivityBucketListProfileRequest.ts:3-4`
  `activityId`, `experienceTypeId`; `MemoryAnchorRequest.ts:15` and `ActivityProjectProfileRequest.ts:7`
  `activityId`. Vuetify's select/autocomplete cannot resolve `0` against any option, so it renders the
  raw value as text — both units photographed the literal **"0"**. `requiredRule`
  (`RulesComposition.ts:22-26`) rejects `null`/`undefined`/`''`/`[]` and nothing else, so `0` validates,
  the form submits, and the server answers 400 `"Activity not found."` — for backlog, with the dialog
  still open and nothing visibly changed. The same module already does this right for
  `financialGoal: number | null = null`.
- **What to change:** Type the eight fields `number | null` with default `null`, in constructor and
  `fromJson`. The forms' `v-model`s then carry `null` until a pick is made; `requiredRule` blocks the
  submit with `validation.required`; `hasObjectChanged`-style dirty checks, if any, see a real change.
  Check every place that reads these fields as `number` (`BacklogProfileForm.vue:24-37` passes the edit
  entity's ids — fine; `useAnchorCapture`'s `lockActivity` path sets a real id — fine) and run
  `npm run type-check`.
- **Do not change:** `requiredRule` — `0` is a legitimate value for a count field elsewhere; the rule is
  right, the defaults are wrong.
- **Verification:** `X3`'s `Verify:` step 3 and `B2`'s `Verify:` — a fresh *Add* dialog shows
  placeholders, not "0"; *Create* with nothing selected fires **no request** and shows the required
  message. Do the projects form too.
- **Risk:** Low-medium — eight fields, four forms, one type-check.

## F77. Leisure create forms send what the server will reject, and the server's own per-field message never reaches the field
> ✅ **FIXED 2026-09-21, in the same session as `F63`.** The *Risk* check was done first: every field
> made required here is non-nullable or `NotEmpty()` in the API's `Create*Validator` — backlog
> Location/Weather/Cost (ownership-checked `long`s), bucket-list Experience type + Inspiration source,
> anchor Highlight, and project Project area (`ProjectArea` is `NotEmpty()` too, so the projects form got
> the same treatment). The `catch` half is a small leisure composable, `useServerFieldErrors(fields)`,
> over `extractServerFieldError`: each `New*Form` binds `serverErrors.<field>` to `errorMessages`,
> clears them before `validate()` (a stale one would fail it — `TimePeriodForm`'s lesson) and on any
> model edit, and exposes `applyServerError`; each wrapper form's `onConfirm` catches the write and
> routes it there, dialog open. The interceptor snackbar is untouched. The anchor form's **locked**
> read-only Activity field takes the message too — that is the "I did this" path, where "must have a
> Backlog or BucketList profile" would otherwise have nowhere to land. Verified live: untouched
> backlog *Create* → four required messages, no `POST`; untouched anchor *Create* → required under
> Activity and Highlight; then the seeded *Read a Novel* (already profiled) with all lookups filled →
> `POST /activity-backlog-profile` 400 and *"Activity already has a backlog profile."* rendered under
> the Activity field with the dialog still open.

- **Scope:** app-side `src/core/leisure/component/backlog/{NewBacklogProfileForm,BacklogProfileForm}.vue`,
  `component/memoryAnchor/{NewMemoryAnchorForm,MemoryAnchorForm}.vue`,
  `component/bucketList/{NewBucketListProfileForm,BucketListProfileForm}.vue`
- **Closes:** `leisure-backlog-picker/B3 (round 2)`, `B4 (round 2)`, and the feedback half of
  `leisure-bucket-anchors/B2` — the half `F63` explicitly left open
- **Root cause:** two gaps that compound. (1) Only *Activity* carries `:rules="[requiredRule]"` (via
  `ActivityAutocompleteWithCreate`); Location, Weather, Cost and the anchor's Highlight carry none, so
  `form.validate()` passes on an empty form. (2) Neither `onConfirm` catches the write, so the server's
  400 — whose body names the field exactly (`{"errors":{"highlightNote":["'highlight Note' must not be
  empty."]}}`, `{"activityId":["Activity not found."]}`) — is handled only by the interceptor's generic
  snackbar. `src/_common/axiosConfig.ts` already exports `extractServerFieldError()` built for
  FastEndpoints' `{errors: {propertyName: [...]}}` shape and nothing here calls it.
- **Round 2 settled the "silent 400" question that was in *Needs verification* (§91), and the answer is
  the less alarming one.** `leisure-backlog-picker/B3` states plainly that *"a snackbar reading 'One or
  more errors occurred!' appears and disappears within a few seconds"* — so the interceptor **does**
  fire and there is no intermittent in the framework. What round 2 confirmed by querying every
  `[role=alert]` in the form (all four empty) is that there is no **field-level** error, which is this
  batch. Round 1's `X3` observation of no snackbar at all was wrong. §91 is settled and moves to the log.
- **What to change:** add `:rules="[requiredRule]"` to Location / Weather / Cost on the backlog form and
  to the Highlight textarea on the anchor form (check the bucket-list form's Inspiration source in the
  same pass — the server rejects it empty too, per round 2's 400 body). Then wrap each `onConfirm`'s
  `create`/`update` in `try/catch` and route the caught error through `extractServerFieldError` onto the
  matching field, leaving the dialog open.
- **After `F63`, not before.** `requiredRule` cannot fire while the models default to `0` — it accepts
  `0` and always will (`F63`'s *Do not change*). Landing this first adds rules that validate a sentinel.
- **Do not change:** the interceptor's generic snackbar. Its wording is `FW19`, a different batch in a
  different repo; a field-level message is the fix here whatever the snackbar says.
- **Verification:** `B3`'s and `B4`'s `Verify:` blocks — submit each form untouched and confirm a visible
  required message under the specific field and **no** network request. Then force a server-side-only
  rejection (a name the server refuses but the client rules allow) and confirm the message lands on the
  field rather than only in the snackbar.
- **Risk:** Low-medium. Adding required rules to fields that were effectively optional client-side can
  block a submit that used to succeed — confirm against each endpoint's validator that all four are
  genuinely `required` server-side before making them required here.

## F16. The settings header row clips its labels at 1440 px — ✅ fixed 2026-09-21 with §19's frontend half

> Ran **before** `F13` after all: §19's coverage toggle made the row overflow outright (the *Mappings* tab
> was pushed out of view at 1440), so the wrap could not wait. If `F13` later hides or repoints the bar on the
> Mappings tab, the wrap is still right — it only decides what happens when the row does not fit. Verified at
> 1440×900 on both platforms: title and tabs on the first line, the filter bar on its own line below, every
> label readable. `tracking-settings/B4` closed.

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

## F43. `/day-planner/:date` with a malformed or unprovisioned date — two unguarded calendar fetches
> ✅ **FIXED 2026-09-22.** All three parts as written, with one correction to the batch's premise: the
> "redirect branch that already exists for the empty param" never worked — `/day-planner/:date` requires
> the segment, and a param change on the same route **reuses** `DayPlannerView` rather than remounting
> it, so its `router.replace` + `return` left nothing loading. (a) The mount now validates the param
> strictly through the framework's `parseDateFromApi` (no new `dayjs` import), rewrites the URL to the
> user's today in place and carries on loading today — no request for the bad segment. (b) The mount's
> calendar fetch is `.catch`ed inside the `Promise.all`; on a miss the store is reset and an inline
> `VAlert` (*Day not available* / *Deň nie je dostupný*, the date, *Back to today*) replaces
> `DayPlannerHeader`. The missing day lives in `useDayNavigation` as `missingDate`, never in
> `store.viewedDate` (assigning it would re-fetch the same 404), so day stepping counts from it and the
> side panel's title reads it. (c) The watcher's fetch is caught: with a loaded day to return to it
> `navigateToDate`s back to it; with none it shows the alert; `hideFullScreenLoading()` and the undo
> handshake's resolve moved into a `finally`. **Grown on the way:** the redirect shifted the mount's
> `loadTasks` into overlap with the watcher's, and the shared `useFetchFiltered` controller aborted one
> — a `CanceledError` in the console. `loadTasks` now returns on `isRequestCanceled`, the
> `TemplateDayPlannerView` pattern; the race was latent on valid URLs too. Verified live:
> `not-a-date` and `2026-09-11` → `/day-planner/22-09-2026`, no `by-date/not-a-date` request, console
> clean; `31-12-2025` → the alert, console shows the interceptor's two lines and no unhandled-hook error;
> *Back to today* → `22-09-2026`; ArrowLeft from `01-01-2026` → the 404, then back on `01-01-2026` with
> URL and header agreeing. `planner-day/B5` (date half) closed.

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

## F55. An unknown template id keeps the previous template's name — the `F43` shape on the template side, plus a persisted store
> ✅ **FIXED 2026-09-22, after `F43` and copying its treatment.** `loadTemplateDetails` catches the fetch
> (not `_silent`), sets `currentTemplate` to `null`, calls `store.resetStore()` and emits `notFound(id)`
> (`null` on success); `TemplateDayPlannerView` holds `notFoundId` and swaps `TemplatePlannerHeader` for
> the same `VAlert` shape as `F43` — *Template not found* / *Šablóna sa nenašla*, naming the id, *Back to
> templates* as a route-name link. The dead `throw` is gone. Two small additions: *Update details* is
> disabled while no template is loaded (it would `PUT` the missing id), and a persisted `templateName`
> belonging to a **different** id is cleared before the fetch, so the previous template's name no longer
> flashes while the request is in flight. Nothing reads the route, so the split-view mount is unaffected;
> the store's persistence is untouched. Verified live: `20001` (*Home Office*) then `999999` → the alert,
> no title; reload → still the alert, `sessionStorage` `templateDayPlanner` shows `currentTemplateId: null`,
> `templateName: ""`; a fresh tab on `999999` → the alert; `20001` → *Home Office* again. Console: the
> interceptor's two lines only, no unhandled-hook error. `planner-templates/B5` closed.

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplatePlannerPanel.vue`,
  `src/core/dayPlanner/store/templateDayPlannerStore.ts`; `src/core/dayPlanner/view/TemplateDayPlannerView.vue`
  for the not-found state
- **Closes:** `planner-templates/B5`
- **Root cause:** Confirmed. `TemplatePlannerPanel.vue:47-56` `loadTemplateDetails()` is `const
  template = await fetchById(templateId)` followed by the four store writes, with no `catch`, and it is
  called from `onMounted` (`:40-42`) and from the `templateId` watcher (`:66-71`) — the same
  two-call-site shape as `F43`'s `DayPlannerView.vue:211` + `useDayNavigation.ts:71-84`. On a 404 the
  interceptor toasts, the promise rejects at the hook boundary (Vue's *"Unhandled error during
  execution of mounted hook"*), and the store's `currentTemplateId`/`templateName` keep whatever they
  held. **The twist the finding half-saw:** `useTemplateDayPlannerStore` persists both fields to
  `sessionStorage` (`templateDayPlannerStore.ts:80`, `persist: { omit: ['tasks'], storage:
  sessionStorage }`), so the stale name also survives a reload of the bad URL and a fresh tab opened
  from it — the header reads *Home Office* for `999999` until the session ends. The `if (!template)
  throw Error(…)` on `:50` is dead: `fetchById` rejects on a 404, it never resolves `undefined`.
- **Files:** `TemplatePlannerPanel.vue:40-42,47-56,66-71`; `templateDayPlannerStore.ts:58-62`
  (`resetStore` — already clears both fields, unused on this path); `TemplateDayPlannerView.vue:30`
  (the header's fallback is `planner.template.dayTemplateFallback`, which never renders today because
  the stale name wins)
- **What to change:** Wrap the fetch in `try/catch` at `loadTemplateDetails` (not `_silent` — the
  interceptor's toast is the right first signal, as `F43` says); on failure call `store.resetStore()`
  so the name, id and tasks clear together, and render a not-found state in the header slot — an
  inline `VAlert` naming the id with a *Back to templates* action, the same shape `F43`(b) asks for
  on the date view and `PlannerTaskLinkView` already has for a missing task. Agree the treatment with
  `F43` rather than inventing a second one. Delete the dead `throw` on `:50`. In the split view the
  panel gets its id from a select, so the path is unreachable there — but the same component is
  mounted, so nothing in the fix may assume the route.
- **Do not change:** the store's persistence — per-tab planner state is deliberate (its own comment);
  `F54` is what stops a bogus id reaching this path from the split view's URL.
- **Verification:** `B5`'s `Verify:` block, then **reload** `/day-planner/templates/999999` and open it
  in a second tab — header must not read a real template's name either time;
  `playwright-cli sessionstorage-list` shows `templateName: ""`. Console shows the interceptor's line
  and no Vue unhandled-hook error. Then `/day-planner/templates/20001` → *Home Office* again.
- **Risk:** Low — a `catch` and a state the view never had.

## F12. The Mappings table body has zero height — the row exists, inside a 0 px scroll box
> ✅ **FIXED 2026-09-22**, as written. `flex-fill` on both `*MappingsTable.vue` roots, and
> `class="flex-1-1" style="min-height: 0"` on the `BasicTable`. The Android `VCardText` also got
> `flex-fill`, for parity with desktop (the *Risk* line is right that it was not the cause). Verified on
> both platforms: `.v-table__wrapper` is 494 px, `elementFromPoint` at the edit button's centre resolves
> to the button, and a normal click on *edit* lands on `distinctEntries` with the form filled.
> **Not checked:** the 25+-row case (the body scrolling inside the card) and the `Tab` walk from the
> filter row. `tracking-settings/X1` closed.

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
- **Round 2 (fourteenth pass) — re-confirmed on a seeded and a freshly created row, and a keyboard path
  works.** The unit found that `el.focus()` on the row's `edit`/`delete` button followed by a real Enter
  activates it (four times, both actions, both platforms) and reads that as *"consistent with a
  stacking/paint bug"*. It is consistent with **this** batch's cause and not with that one: `focus()`
  scrolls the focused element into view *inside its nearest scrollable ancestor* — the 0 px
  `.v-table__wrapper` — and Enter dispatches a click on the focused element without hit-testing, so both
  halves skip exactly the coordinate test that the pointer fails. A paint-order bug would not respond to
  `focus()` at all. Nothing changes in *What to change*; the amendment is recorded so the next reader does
  not reopen the framework hypothesis (§101).
- **Verification:** `tracking-settings/X1`'s `Verify:` block on both routes — the row paints in a screenshot,
  and a **normal, non-forced** click on its `edit` button navigates to the `distinctEntries` tab with the
  form populated. Add: `document.elementFromPoint()` at the button's rect centre resolves to the button.
  Add: `Tab` from the filter row reaches the row's buttons (the unit only tried a programmatic `focus()`).
- **Risk:** None beyond layout. The unit's own remark that the Android `VCardText` lacks the app's `flex-fill`
  class is a red herring — Vuetify's `.v-card-text` is `flex: 1 1 auto` by default (`VCard.css:249-250`), so
  both views' card bodies already fill; the omission is one level lower.

## F13. Mappings tab: no filter control reaches the grid, and the delete button reaches nothing
> ✅ **FIXED 2026-09-22**, after `F12` and `F72`, along the recommended path, with two departures.
> The view passes its pattern `filter` down as a prop. Its Filter handler now reloads whichever tab is
> mounted, so it calls both refs in turn; the batch's `??` would have worked too, since `load()`
> returns a promise. The table builds the grid filter from that pattern plus its own controls. It copies
> the picked activity only for type *Activity* and `isIgnored` only for *Ignored*, because a hidden
> control would otherwise empty the other list. A narrow `watch` on type/isActive/isIgnored/activityId
> resets to page 1, or reloads if it is already there. `@onDelete` calls `deleteEntity` and then
> re-`load()`s. There is no `_silent` 409 branch as in `RoutineSettingsView`: mappings are leaves, and the
> interceptor's message is enough. **Departure 1 (`B7`):** neither single column is always filled, so
> both response DTOs gained a `patternLabel` getter (the first non-null pattern) and the tag passes
> `deleteConfirmationColumn="patternLabel"`. **Departure 2:** the Mappings tab link now carries the
> pattern query too, so the one shared search does not drop out of the URL on a tab switch.
> **Unfiled, fixed in passing:** both `Tracker*MappingResponse.fromJson` called
> `ActivityFilterFormResponse.fromJson(json.activity)` unguarded. The API sends `Activity = null` for an
> ignored rule, so that call threw and any grid page containing an ignored rule failed to parse. Verified on
> desktop: the pattern (Filter and Enter), the Activity picker (`activityId: 12023`) and the type
> (`"type":"Ignored"`) each reach the grid request body, and the row count changes. The dialog reads
> *"Are you sure you want to delete f72-ignored.exe?"*, Confirm sends `DELETE …/21003` → 204, and the
> row is gone after the refetch. On Android only the layout and row rendering were checked; the dialog
> label there resolves through `packageName` when `appLabel` is null. `tracking-settings/B1`, `X4` and
> `B7` closed.

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`,
  `src/core/activityTracking/view/AndroidSettingsView.vue`, and the two `*MappingsTable.vue` components
- **Closes:** `tracking-settings/B1`, **`X4`** (fourteenth pass — the dead delete, now **observed** on both
  platforms through `F12`'s keyboard path: Confirm closes the dialog, no request fires, the row stays),
  **`B7`** (the confirmation names the raw id — `"Are you sure you want to delete 21003?"` — because neither
  table passes `deleteConfirmationColumn`; one attribute on the same `<BasicTable>` tag this batch edits,
  the `activity-settings/B8`/`F19` shape). `U1` is confirmed by `X4` and closed (see the log).
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
  already confirmed by the time `onDelete` fires, and retired Escalation §2 (log, *Closed escalations*) records that this bypass of the app's
  cascade rule is a framework question, not one to paper over per call site. ~~**Expect the dialog to stay
  open after the row is gone**~~ — that framework defect was fixed in `vue_framework` `98b92d0` (log,
  *Closed verification items*), and `X4` confirms it from this side: Confirm closes the dialog on both
  platforms today, with a dead handler behind it. **Same tag, one more attribute:**
  `deleteConfirmationColumn="processName"` on the desktop table and `"appLabel"` on the Android one
  (`BasicTable.vue:208` resolves it through `getNestedValue`, so a dotted path works if a target label is
  wanted instead), so the dialog names the rule and not its id (`B7`). A rule whose only pattern is a
  product name or window title would read blank — pick the column per platform that the seeder and the
  form both always fill, or compose a label in a computed and expose it as a hidden column.
- **Do not change:** `BasicTable`'s `hasDelete = true` default — removing the button instead of wiring it
  would close `U1` by deletion, and the usecase names delete as this view's purpose. Do not fix `B7` in
  `BasicTable` — the raw-id fallback when no column is passed is a per-call-site omission (two tables
  here, two in `F19`), not a framework default worth changing under rule 4.
- **Verification:** `tracking-settings/B1`'s `Verify:` block on both routes — a `POST
  …/tracker-desktop-mapping-by-pattern/grid` (android equivalent) fires with the updated filter and the count
  changes. Add the third path explicitly: pick an Activity in the picker and confirm the request body carries
  its id; type a process name and click Filter on the *Mappings* tab and confirm the body carries the
  pattern. Then `X4`'s `Verify:` block — Confirm fires `DELETE …/tracker-desktop-mapping-by-pattern/{id}`
  → 2xx and the row is gone after the re-fetch — and `B7`'s: the dialog names the pattern. **Create the
  row you delete through the API first** (CLAUDE.md *Mutating specs* rule 1): the seeded mappings are
  what unit 6's inventory describes, and `F72`'s create path is the other thing this session can prove.
- **Risk:** Medium — this is the view's only search and its only delete, and the filter object is shared
  with the create form (`useMappingSettings.ts:33,40`), so a pattern typed to search the Mappings tab is
  also the pattern the next *Save* would write. That is the existing distinct-entries behaviour and is
  arguably the feature; just do not "fix" it in this batch.

## F15. Distinct-entries filter, page and sort are not in the URL
> ✅ **FIXED 2026-09-22, in two halves.** **Distinct-entries half:** `useCoverageUrlState` grew into
> `useDistinctEntriesUrlState`, which carries the whole filter through the handler shape. Trap 1 was
> avoided by having no watcher: the view writes the query in the same handler that applies the filter.
> Page/perPage/sortBy go through the framework's `useTableUrlState` inside the two tables.
> **Mappings half, landed with `F13`:** the tab's own controls (`type`, `isActive`, `isIgnored`,
> `activityId`) and its page/perPage/sortBy go through `useTableUrlState`'s filter overload.
> `mappingsControlsToParams` / `applyMappingsControlsParams` write `''` for a default, so an untouched
> tab keeps a bare URL. `withTableParams` carries the four control keys across the pattern bar's writes.
> Trap 2 is closed by `defaultSortBy` already holding `BasicTable`'s first column (`isActive`), so its
> mount-time push finds the key and writes nothing. Verified: a bare Mappings URL stays bare on load;
> `type=Ignored` and `activityId=` are written on change and survive a reload; and a Mappings-tab
> `edit()` hands the pattern to `distinctEntries` intact
> (`?processName=f72-inactive.exe&processNameMatchType=Exact`). `tracking-settings/B3` closed.

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

## F72. `useMappingSettings.saved()` sends three of the form's five facts — *To ignored* never reaches the wire, `isActive` is never sent, nothing validates, and the view's own `catch` overwrites the server's message
> ✅ **FIXED 2026-09-22.** `saved()` branches on `mode`. *To ignored* sends `isIgnored: true` with the
> three ids `null`. *To activity* sends the activity id **alone**. **The decision the batch asked for:**
> `formData`'s role and category only narrow the picker, and sending them beside the activity was a second
> target that the server's exactly-one rule refuses. So the server's role/category target is deliberately
> **not** reachable from this form, which always needs an activity. Both request DTOs default
> `isActive = true`, and `edit()` copies the row's own value. A successful save also clears `editedId`:
> left set, a later *Save* would re-write the row from a fresh request and reset its `isActive`, which is
> the same trap by another road. Validation: `updatePattern` treats a blank field as no pattern; with none,
> `saved()` returns before the request, and `patternError` marks the filter bar's pattern fields (the first
> one shows the message, `activityTracking.settings.patternRequired`, SK + EN). The two action bars are
> now a `VForm`, so *Save* runs `ActivitySelectionForm`'s `requiredRule` and marks a missing activity.
> **Catch:** the interceptor path. There is no `_silent`, and `failedToSaveMapping` shows only when a
> request got no response and was not cancelled. Verified on desktop: *Clear* → *Save* sends no request
> and marks 4 fields. *To ignored* → 201, with a body of `"isActive":true,"isIgnored":true` and null
> ids. Editing an API-created inactive rule sends `PUT …/21004` → 200 with `"isActive":false`. A duplicate
> pattern → 409 shows **one** snackbar: the interceptor's typed *"A record with this value already
> exists."* The planned mocked 400 was replaced by this real 409 (the `route` mock hung the CLI
> session). Android shares `useMappingSettings` but was not driven. Both test rules are deleted.
> `tracking-settings/X2`, `X3` and `B6` closed.

- **Scope:** app-side `src/core/activityTracking/composable/useMappingSettings.ts:39-54`,
  `src/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingRequest.ts:12-13`,
  `…/android/settings/TrackerAndroidMappingRequest.ts:10-11`, `DesktopSettingsView.vue`'s and
  `AndroidSettingsView.vue`'s `edit()`, the two `*DistinctEntriesActions.vue` bars
- **Closes:** `tracking-settings/X2`, `X3`, `B6`
- **Root cause — three defects in one function, confirmed against both sides' source:**
  1. **`X2` — mode never reaches the request.** `saved()` (`:39-43`) copies `activityId`/`roleId`/
     `categoryId` from `formData` and never reads `mode`; `request.isIgnored` is never written anywhere in
     the file, so it stays the constructor's `null`. The server's `AddMappingTargetRules()` requires
     exactly one target (`IsIgnored = true`, or `ActivityId`, or `RoleId`/`CategoryId`) and answers the
     400 the unit quoted. *To ignored* has never worked from the UI, on either platform. `edit()` on an
     ignored row (`else { mode.value = 'toIgnored' }`) lands in the same dead path.
  2. **`X3` — `isActive` is never sent, and it is `required` on update.** Both request classes declare
     `isActive?: boolean` with no default and no writer; `JSON.stringify` drops the key.
     `CreateTrackerDesktopMappingRequest.cs` defaults `IsActive = true`, so create works;
     `UpdateTrackerDesktopMappingRequest.cs` is `required bool IsActive` (since `ae70138`, 2026-08-12,
     CQ-10) and its `UpdateEntity` is a **full replace** — its own remark says so. Every edit-save on
     either platform is the serializer 400 the unit quoted. **The finding's suggested shortcut is
     wrong:** *"always send the current toggle state (defaulting `true` for a new row)"* would re-activate
     every inactive rule the moment it is edited, because there is no toggle — `O1` is that there is no
     control for `isActive` anywhere. `edit()` must copy the row's `isActive` (the grid response carries
     it, `TrackerDesktopMappingResponse.ts:13`) into the request, and a new row sends `true`.
  3. **`B6` — no validation, and the wrong snackbar.** Nothing gates *Save*: the pattern group has no
     rule and `ActivitySelectionForm`'s `requiredRule` (`:123`) is never run through a `VForm.validate()`
     before `saved()` is called, so an empty form reaches the server. The server answers a **specific**
     400 (`patterns`, `target`) — and the interceptor snackbars it (generic today, `FW19`) — and then the
     `catch` at `:51-53` calls `showErrorSnackbar(t('activityTracking.settings.failedToSaveMapping'))`,
     which `showSnackbar` renders **in place of** the first. So the user sees the generic string for an
     empty form, for `X2`, for `X3` and for a real failure alike, and `FW19` on its own would not help
     this call site: the second snackbar wins (§105).
- **Files:** `useMappingSettings.ts:39-54`; the two request DTOs (`isActive: boolean = true` — a
  default, not optional); the two views' `edit()` (copy `item.isActive` and, for an ignored row, set
  `request.isIgnored = true` or let `saved()` derive it from `mode`); the two action bars (wrap the
  pattern fields + `ActivitySelectionForm` in one `VForm`, or validate before calling `saved`)
- **What to change:** In `saved()`: branch on `mode.value` — `'toIgnored'` → `isIgnored = true`,
  `activityId`/`roleId`/`categoryId` = `null`; `'toActivity'` → `isIgnored = null` and the three ids as
  today. Send `isActive` always: the edited row's value on update, `true` on create. Validate first —
  at least one pattern, and in `toActivity` mode an activity (or a role/category, if the server's
  `RoleId`/`CategoryId` target is meant to be reachable from this form — today the picker cascades but
  the form never submits without an activity; decide and say so) — and return before the request with
  the fields marked. Then the `catch`: drop the generic snackbar and let the interceptor speak (it
  already does for every non-`_silent` 400), **or** pass `_silent: true` on the two calls and show
  `error.response?.data?.errors` field-by-field yourself — one or the other, never both. If you take
  the field-by-field path, key it on the presence of `errors`, not on `status === 400`: since
  2026-09-21 (`B18` follow-up) a pattern the account already maps answers **409**
  `errorType: "DbUniqueViolationError"` with `errors["Patterns"]` naming the clash, and that belongs
  under the pattern field too. Keep
  `failedToSaveMapping` for the `status === undefined` network case only, the `LoginView` shape.
- **Do not change:** the server's "exactly one target" rule or the PUT-replace semantics — both are
  documented and deliberate; the `mode` ref and the template that already switches on it (correct);
  `filter`'s double duty as the search pattern (`F15`'s *Do not change*).
- **Verification:** `X2`'s block on both platforms — *To ignored* + *Save* → the body carries
  `"isIgnored":true` and no ids, 201, the rule appears under the Mappings tab's *Ignored* type. `X3`'s —
  edit the seeded `rider64.exe` rule (through `F12`'s keyboard path until `F12` lands), change the
  activity, *Save* → `PUT` body carries `"isActive":true` **and the row's own value** (edit a rule whose
  `isActive` is `false` — create one through the API — and confirm it stays `false`), 2xx, the change
  survives a reload. `B6`'s — *Clear* → *Save*: **no request**, the pattern group and the activity field
  show their messages; then force a server 400 (`route --status=400 --body=…`) and read **one** snackbar
  with the server's text. Reseed after; every created rule is otherwise undeletable until `F13`.
- **Risk:** Medium — this is the view's only write path, on two platforms, and it changes what an
  *edit* sends for every rule. The `isActive` copy is the line to get right; the `X3` shortcut is the
  trap.

## F8. A sign-in race orphans the day-plan fetch — the home page lands on "No plan for today" (or spins forever) and nothing re-fetches
> ✅ **FIXED 2026-09-22.** This takes the batch's first shape. The watcher returns on `previousId === 0`, and
> `id === previousId` and the `→ 0` sign-out path are unchanged. The retry gate is also loosened: it
> re-fetches when `loadPromise !== null` rather than `planDate !== null`. So if an A → B account switch
> lands on a fetch still in flight, that fetch is re-issued rather than orphaned, and `resetTodayPlan()` keeps
> setting `loading` as before. Round 1's half: `FocusMode` gains `'noPlan'`. `focusMode` falls through to it
> when `hasPlan` is false, so a plan-less day is no longer `'allDone'`. `focusIcon` gives it
> `fa-calendar-plus`. `NowBar` destructures `loading` and shows a spinner in place of the state block,
> hides the action block while loading, and renders no kicker on `'noPlan'`, because the headline already
> says it. **Verified live:** 3 of 3 sign-out/sign-in cycles on the primary account showed the plan with
> no reload, with one day-plan request per sign-in. The race was also forced with `run-code` routes
> (`user/data` +600 ms, day-plan +2000 ms, delayed with `page.waitForTimeout`; a `setTimeout` inside the
> handler hangs the CLI session). The plan applied. With the early return temporarily removed, the same
> setup issued a **second** day-plan request, which proves the watcher fired mid-flight and that the
> loosened gate recovers it on its own. Variant (3): day-plan `--status=500` before sign-in → both
> widgets show *"Couldn't load today's plan"* + *Retry*, with no spinner. **Round 1's block, driven
> 2026-09-23 by mocking `day-plan` with `run-code` instead of signing in to the secondary account**, to stay
> under the 5/min login throttle. It is the same client path:
> - `hasPlan: false`, no tasks → `nowbar--noPlan`, *"No plan for today"* + *Plan today* with **no** *DONE*,
>   and the planner card reads the same.
> - Every task `Completed` → `nowbar--allDone`, *"DONE · You're done for today!"*.
>
> `home/B2` closed, `home/U1` settled.

- **Scope:** app-side `src/core/home/composable/useTodayPlan.ts`, `src/core/home/component/NowBar.vue`
- **Closes:** `home/B2` (round 2). **Settles `home/U1`** — the mutation pass forced a 500 on
  `calendar/day-plan/**` on a plain reload and both widgets rendered `home.loadFailedPlan` with a working
  *Retry*; H6's error UI is correct, and the only way it is unreachable is this race (see the log).
- **Rewritten in the thirteenth pass.** Round 1 saw a transient pair and this batch prescribed a loading
  branch. Round 2 reproduced the pair on **3 of 4 fresh sign-ins**, waited 3 s, and it did not clear —
  it is a permanent state that only a reload fixes, and the reload "fixes" it by winning the same race
  the other way (§95). Round 1's fix is kept below as the smaller half; applied alone it changes nothing
  the mutation pass observed.
- **Root cause (source-verified this pass, `useTodayPlan.ts`):** `fetchPlan()` (`:397-404`) captures
  `token = ++loadToken` and applies its response only `if (token === loadToken)`. `resetTodayPlan()`
  (`:466-478`) does `loadToken++` and sets `loading = true`. `wireLifecycle`'s user-id watcher
  (`:512-521`) calls `resetTodayPlan()` on **every** change of `userStore.currentUser.id` — including the
  `0 → <id>` hydration that happens once `GET /user/data` resolves after a fresh sign-in, which is not a
  user change. On sign-in `user/data` and `day-plan` fire together; when `user/data` wins (140 ms vs
  524 ms in the reproducing run) the watcher bumps the token mid-flight, the day-plan response is
  discarded, and the retry gate `if (hadPlan && id !== 0)` (`:516-519`) is `false` because `hadPlan`
  reads `planDate`, which the discarded response never set. Three visible outcomes: (1) `hasPlan: false`
  on a day with a plan, in both widgets, permanently; (2) NowBar additionally shows `'allDone'` beside
  it, because `focusMode` (`:163-166`) is computed from `tasks` alone and never branches on `loading` —
  round 1's finding; (3) if the discarded fetch *failed*, `load()`'s `finally` has already set
  `loading = false` and the reset flips it back to `true` with nothing left to clear it —
  `DayPlannerWidget` spins forever and never reaches the error branch (round 2's third variant).
- **Files:** `useTodayPlan.ts:512-521` (the watcher), `:466-478` (`resetTodayPlan`), `:163-166`
  (`focusMode`); `NowBar.vue` (destructure list + template `v-if`)
- **What to change:** In the watcher, treat `previousId === 0` as hydration, not a user change: nothing
  belonging to another account can be loaded while the id is `0`, because the reset already ran when it
  *became* `0` — so `if (previousId === 0) return` before the reset (keep `id === previousId` and the
  `→ 0` sign-out path exactly as they are). If a stricter shape is preferred, keep the reset and drop the
  `hadPlan` gate — re-call `ensureLoaded()` unconditionally when `id !== 0` — but then `resetTodayPlan()`
  must stop setting `loading = true` on its own (let `load()` own it, which it already does at `:425`),
  or variant (3) survives. Then round 1's half: add `loading` to `NowBar`'s destructure with a loading
  branch matching `DayPlannerWidget.vue:88-92`, and make `focusMode` consult `hasPlan` before falling
  through to `'allDone'`.
- **Do not change:** `fetchPlan`'s stale-response guard (`:404`) — it is correct and is what makes the
  midnight watcher (`:504-508`) safe; the sign-out path (`id → 0`), which is H2's isolation and was
  re-verified clean this pass against the secondary account; `DayPlannerWidget`'s own loading guard.
- **Verification:** `home/B2`'s **round-2** `Verify:` block — sign out and in up to four times on the
  seeded primary account and read the plan without a reload, then `response-body` on the day-plan
  request to confirm a `hasPlan: true` response was *applied*, not discarded. Then the third variant:
  `playwright-cli route "**/api/calendar/day-plan/**" --status=500` **before** signing in, sign in, and
  confirm the widgets reach the error/Retry state rather than a spinner. Then round 1's block: a
  genuinely plan-less day (the secondary account) reads *"No plan for today"* with no *DONE* beside it,
  and a day with every task done still reads *DONE*.
- **Risk:** Medium. The watcher is the app's only sign-out reset for this module; the `previousId === 0`
  early-return must not swallow the `→ 0` transition (it does not — `previousId` is the old value — but
  write the test as two sign-ins with different accounts in one tab, which is `account-isolation.spec.ts`'s
  shape). `loading` ownership is shared between `load()`, `refresh()` and `resetTodayPlan()`; moving it
  changes three call sites.

## F59. A skipped task renders as done — `isFinished` is the wrong predicate for the row's visual and ARIA state
> ✅ **FIXED 2026-09-22.** The row branches on status through two local predicates, `isDone` (`Completed`)
> and `isSkipped` (`Cancelled`). `isFinished` and its timing consumers are untouched. A skipped row gets
> `row--skipped`: muted to the same 0.6 but **not** struck, because the strike-through is what says done.
> Its checkbox is `check--skipped` (dashed ring, `fa-rotate-left`), `aria-pressed="false"`, and is labelled
> `home.restoreTask` (*"Restore skipped "{task}""*). It also gets a *Skipped* chip,
> `home.skippedBecause` / `home.skipped` (SK + EN). **The decision:** the click restores, so
> `toggleTaskStatus` now reopens any `isFinished` task to `NotStarted`, and only an open task is ticked
> to `Completed`. **Verified live** on `Code Review` (16003): *Skip → Ran out of time* gave
> `row row--skipped`, `pressed=false`, and the restore label. Clicking it sent
> `{"status":"notStarted",…}` → 204, and the row returned to its seeded missed state. **Backend gap found
> while verifying — escalated as §21 / `B26`, landed and verified end to end 2026-09-23 (the chip now reads
> *"Skipped: Ran out of time"*); the text below is how it stood on 2026-09-22:** the PATCH body carries `"skipReason":"Ran out of time"`, but
> `PatchPlannerTaskStatusRequest.cs` has no `SkipReason` member, so the server drops it. The refetched
> plan returns the task `Cancelled` with `skipReason: null`, and the chip therefore always falls back to
> the bare *Skipped*. It will show the reason with no frontend change once the API accepts and persists
> the field. **NowBar with a cancelled focus task, looked at 2026-09-23.** I skipped the seeded *Feature
> Development* while it was NowBar's *UP NEXT* focus. The bar moved straight on to the next open task
> (*Grocery Shopping*) and did not show the skipped one as done or current. The task was restored after.
> `home/B4` closed.

- **Scope:** app-side `src/core/home/component/DayPlannerWidget.vue`, `src/core/home/composable/useTodayPlan.ts`
- **Closes:** `home/B4`
- **Root cause (source-verified):** `isFinished(task)` (`useTodayPlan.ts:125-127`) is
  `Completed || Cancelled` — correct for "no countdown, no alert", which is what it was written for.
  `DayPlannerWidget.vue` reuses it for three things it does not mean: the row class
  (`'row--done': isFinished(task)`, `:172`), the checkbox fill (`'check--on'`, `:182`) and
  `aria-pressed` (`:184`) — while the label stays `home.markDone` (`:183`). So a `Cancelled` row is
  indistinguishable from a `Completed` one, its `skipReason` (which the PATCH did send —
  `useTodayPlan.ts:302-308`) renders nowhere, and the checkbox's accessible state claims *done*. Worse,
  `toggleTaskStatus` (`:268-273`) tests `status === Completed` only, so clicking the checkbox on a
  cancelled row sends it to **`Completed`**, not back to `NotStarted` — the finding's *Verify* step 3.
- **Files:** `DayPlannerWidget.vue:172,182-185` (+ its `.row--done`/`.check--on` styles `:377-381`,
  `:458`); `useTodayPlan.ts:268-273` (`toggleTaskStatus`)
- **What to change:** Branch the row on `task.status` rather than `isFinished`: `Completed` keeps the
  check; `Cancelled` gets its own muted/struck treatment plus a small *Skipped* chip carrying
  `skipReason` (the `home.skipReason.*` keys already exist — `useTodayPlan.ts:32`), `aria-pressed="false"`
  and a label that says what the click will do. Decide what that click *does* — restoring `NotStarted`
  is the sensible reading of "un-skip" — and encode it in `toggleTaskStatus` (or hide the checkbox on a
  cancelled row and put the restore in `TaskActionMenu`, which already owns Skip). Whichever, the label
  and the action must agree.
- **Do not change:** `isFinished` itself or its other consumers (`isActive`, the alert scheduler) — it is
  right where it is used for timing.
- **Verification:** `home/B4`'s `Verify:` block — skip via `TaskActionMenu`, read the row's class and
  the checkbox's `aria-pressed`/name, then click it and read the `PATCH …/status` body. NowBar's own
  rendering of a cancelled focus task is worth one look in the same session; `focusMode` derives from
  `isActive`, so it should already be right.
- **Risk:** Low. One widget, one composable function; the SK copy for the chip needs the locale.

## F70. *Move to list* has 404'd since the day it was written — the client calls a route the server replaced the day before
> ✅ **FIXED AND VERIFIED 2026-09-22** (`1bb9ae06`). The one line as written:
> ``API.patch(`${url}/${id}/move`, { destinationListId })``. Verified live on the seed: *Move to list*
> from *Focus* → `PATCH /todo-list-item/14015/move` → 204, and the item is in *Errands* under the same
> id after a reload. **Spec added** to `todo-lists.spec.ts` (*Move to list*). It creates its own item
> through the API so the fixture stays read-only, asserts `secondaryWork`'s list id as the destination
> → 404 with the item unmoved, then moves the item through the dialog and reads *Errands* back. It
> passes. **One thing the batch did not say:** an item's activity is unique per list, so moving an
> item whose activity the destination already holds is a **409**, not a 204. The spec's first draft
> used `codeReview` and hit exactly that, so it now uses the fixture's unreferenced `deletable`. That
> is correct server behaviour, not a defect. The close-then-call shape (`F53`(c)) is named in the
> commit and left alone, as the batch said. `todo-lists/B8` closed.

- **Scope:** app-side `src/core/todoList/api/todoListItemApi.ts:104-112`
- **Closes:** `todo-lists/B8`
- **Root cause:** Confirmed on both sides, with dates. The client sends
  ``API.patch(`${url}/move/${id}/${destinationListId}`)`` with no body (`:106`). The server's only move
  route is `Patch("/todo-list-item/{id:long:required}/move")` taking `MoveToListTodoListItemRequest
  { required long DestinationListId }` in the body (`MoveTodoListItemEndpoint.cs:22`,
  `MoveToListTodoListItemRequest.cs`), with an IDOR guard that answers **404** for a destination the
  caller cannot see — and `/move/14105/13002` matches nothing at all, which is the 404 the unit saw. The
  unit's guess (*"a frontend call that was never updated after a backend routing change"*) has the order
  backwards: the server moved to `/{id}/move` + body on **2026-05-15** (`0517bb3`, which deleted the old
  `MoveToListTodoListItemEndpoint`), and the client's line was written on **2026-05-16** (`1a2e0284`) —
  against the endpoint that had been deleted the day before. Four months, no caller ever succeeded, and
  no spec covers it (`todo-lists.spec.ts` has no move test) — §100.
- **What to change:** ``API.patch(`${url}/${id}/move`, { destinationListId })``. One line. While there:
  the dialog closes before the call (`TodoListView.vue:197-200`), so a real 404 — a list the user cannot
  see — loses the pick; that is the close-then-call shape `F53`(c) flagged and `todo-routine/B11` fixed
  for time periods, not this batch's to redesign, but say in the commit that the pattern is known.
- **Do not change:** the server route or the guard's 404 — a stranger's list id staying unconfirmable is
  the point of it.
- **Verification:** `B8`'s `Verify:` block — pick a destination, Confirm → `PATCH …/todo-list-item/14105/move`
  → 204, the item leaves *Focus* and appears in *Errands* under the same id after a reload. Then
  `secondaryUser`'s list id as the destination (read it off `seed.json`) → 404, item unmoved. Add the
  move to `todo-lists.spec.ts` — a route contract with no test is how this stayed broken. Reseed after.
- **Risk:** None.

## F74. `quickEdit` calls a route that was renamed out from under it — four dialogs, two modes, silent
> ✅ **FIXED 2026-09-22** (`eb13eb1a`), verified live in three of the four dialogs.
>
> **What changed:**
> - `quickEdit` is now `PUT …/quick-edit` → `Promise<void>`, and a new `clone` is `POST …/clone` →
>   `Promise<number>`. Both still invalidate the option cache, and the `'' → 0` trap is gone with the
>   old mapper.
> - `useQuickCreateActivity.quickEditActivity` dispatches on the mode and resolves to the id the task
>   should point at.
> - `QuickEditMode`'s comment now says the values are a client-side discriminator.
>
> **Decided against the batch's lean** on edit 3. A failed rename keeps the dialog open, with
> everything typed and a specific snackbar (`activities.quickEditFailed`), rather than letting the task
> PUT run. The task save's own success snackbar (`planner.feedback.taskUpdated`) replaces the error in
> the single snackbar slot, so a partial save would read as a full one. The message names the way out:
> turn quick edit off to save the rest. **Grown by one file:** `RoutineToDoListForm.onConfirm` was the
> only one of the four callers that went on and closed on an `undefined` result, saving the old
> activity. It now returns like the other three.
>
> **Verified live:**
> - **Planner Edit Task:** overwrite `PUT /activity/12003/quick-edit` → 204, then the task PUT.
>   **Clone** `POST /activity/12003/clone` → 200 `12103`, and the task now carries `activity.id 12103`
>   — the first clone this app has ever made. A clashing name → 409, the dialog stays open with the
>   input kept, and no task write. Quick edit off → the task saves alone.
> - **To-do item:** overwrite → 204, and the name persisted.
> - **Routine item:** 409 → stays open with the snackbar, then 204, persisted after a reload.
> - **Repeating-task dialog: not driven.** The seed has no repeating task for the primary user. Its
>   call site is unchanged and already returns on `undefined`.
>
> **The toggle-off half does not reproduce.** With quick edit off, the Name field is not rendered at
> all. The dialog shows the `* Activity` picker instead, so there is no live-looking field to swallow
> input. What `X1` saw is text typed *before* switching off, discarded with the field. No edit made.
>
> **Two follow-ups, unfiled:**
> - After a successful rename the routine list shows the old activity name until a reload.
>   `TodoListView` has `quickEditedActivity` for this; `RoutineToDoListView` has no equivalent.
> - `onOpenEdit` overwrites the quick-edit fields when its `fetchById` resolves, so anything typed
>   before the fetch returns is lost.
>
> Fixture rows were restored by hand rather than by reseeding, because other units were live on the
> same database. `planner-day/X1` closed.

- **Scope:** app-side `src/core/activity/api/activityApi.ts:34-42` (`quickEdit`),
  `src/core/activity/dto/enum/QuickEditMode.ts`, `src/core/activity/component/ActivitySelectOrQuickEditFormField.vue:123-141`
- **Closes:** `planner-day/X1` — both halves
- **Root cause:** `quickEdit` builds `API.patch(`/activity/${id}/${mode}`)` with `mode` being the literal
  `'Overwrite'` or `'Clone'`, and `QuickEditMode.ts:5-7` documents those values as *"the PascalCase path
  segment of `PATCH /activity/{id}/{mode}`, so they are a wire contract — do not recase them."* Read
  against the API this pass, that comment is **false and is itself the bug**: the server has
  `Put("/activity/{id:long:required}/quick-edit")` (`QuickEditActivityEndpoint.cs:19`) and
  `Post("/activity/{id:long:required}/clone")` (`CloneActivityEndpoint.cs`). There is no `PATCH` on
  either, and no PascalCase segment anywhere — `SetArchivedActivityEndpoint.cs:17-19` even carries the
  note explaining the split (*"the overwrite half is `PUT /activity/{id}/quick-edit`"*). So **both**
  modes 404. Only *Overwrite* was observed, because it is the default; **the *Clone* half has never
  been exercised by anyone** and is the same 404 with a different verb.
  The request body is not implicated: the client's `QuickEditActivityRequest` (`name`, `text`,
  `categoryId`) matches the server record exactly.
  The second half is the swallow: `execAndReturnStatus` awaits `quickEditActivity` with no `try/catch`,
  so the rejection propagates to `BasePlannerTaskDialog.save()` and takes the **whole** form save with
  it — the time, status, importance and location the user also changed in that dialog session are
  discarded with no snackbar, no inline error and nothing on screen but a dialog that will not close.
- **This is not a backend gap, and the finding says it is.** `planner-day/X1`'s root-cause guess reads
  *"very likely the same class of gap as the other backend-route findings already filed in
  `prompts/view-docs/backend/`"* and its suggested fix opens with *"Backend: register (or fix the
  method/route on) the activity-overwrite endpoint."* Both routes exist and are tested server-side; the
  client is calling names that were replaced. This is the `F70` shape exactly (*Contradictions* §116).
- **Blast radius is four dialogs in two modules, not one view.** `ActivitySelectOrQuickEditFormField` is
  mounted by `BasePlannerTaskDialog.vue`, `settings/RepeatingTaskDialog.vue`,
  `todoList/component/normal/ToDoListItemDialog.vue` and
  `todoList/component/routine/dialog/RoutineToDoListForm.vue`. Renaming an activity from **any** of them
  has been a silent no-op.
- **What to change:** three edits, in this order.
  1. `activityApi.ts` — dispatch on the mode instead of interpolating it: `PUT /${url}/${id}/quick-edit`
     for overwrite, `POST /${url}/${id}/clone` for clone. Keep the option-cache invalidation. Note the
     two return shapes differ — `quick-edit` is `204` with no body, `clone` is `200` carrying
     `clonedEntity.Id` (both confirmed against the endpoints this pass) — and
     `execAndReturnStatus:127-131` already branches on exactly that (`if (cloneId && mode === CLONE)`),
     so it needs no change once the verbs are right. **One trap while you are in there:** the current
     mapper is `response.data != null ? Number(response.data) : null`, and axios gives `data === ''`
     for a 204 — `'' != null` is `true`, so the overwrite path will return **`0`**, not `null`, the
     moment it starts succeeding. Harmless today only because the call site gates on the mode; make the
     two functions return what they mean (`Promise<void>` and `Promise<number>`) rather than one
     nullable number.
  2. `QuickEditMode.ts` — rewrite the comment. The values are a **client-side discriminator now**, not a
     wire contract; leaving that paragraph in place is how the next person re-introduces this.
  3. `execAndReturnStatus` — `try/catch` around the `quickEditActivity` call: show
     `showErrorSnackbar`, keep the dialog open, and **do not let a failed rename discard the rest of the
     form**. Decide once whether the task PUT still runs when the rename fails (it should — the two are
     independent writes and the user changed both).
- **The toggle-off half is a separate edit in the same file.** With *Quick edit activity* **off**,
  `isActivityFormHidden` is false, `execAndReturnStatus` returns the selected activity, and the typed
  Name is written nowhere — no error, no warning, the field just looks editable and is not. Either
  disable it in that state or render it read-only. The finding is right that this half is purely
  frontend and survives the route fix.
- **Do not change:** `QuickEditActivityRequest` (it matches), and the overwrite-vs-clone *semantics* —
  only the transport is wrong.
- **Verification:** `X1`'s `Verify:` block, run **four** times: `/day-planner/:date`'s Edit Task, the
  repeating-task dialog, a to-do item and a routine item. In each, rename with the toggle on and confirm
  the new name appears everywhere the activity is referenced; then pick *Clone* and confirm a **new**
  activity is created and the task points at it (nobody has ever seen this path work). Then repeat with
  the toggle off and confirm the Name field cannot silently swallow input.
- **Risk:** Medium. This turns four dead write paths live at once, so the first real `quick-edit` and the
  first real `clone` in this app's history happen in the verification session — budget for finding a
  second defect behind the first.

## F41. `DayPlannerSettingsView`'s tabs stack — `d-flex` on a `VTabsWindowItem` defeats `v-show`
> ✅ **FIXED 2026-09-22.** As written: the two window items keep only `pt-3` (plus `h-100` on
> *Repeating*), and `d-flex flex-column ga-4` / `max-width: 480px` moved onto an inner `<div>` around
> `RepeatingTasksTab` and `SkipReasonsTab`, with a comment on why a window item carries no display
> utility. *This note is transcribed from the summary row the fixing session marked; its body was moved
> here on 2026-09-23 with `F44`'s close, and the browser check was not re-run then.* `planner-day/B1`
> closed.

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
> ✅ **FIXED 2026-09-22.** The recommended shape: a `?tab=` query, absent for `repeating`, through the new
> `src/core/dayPlanner/composable/useQueryParamRef.ts` — one ref mirrored into one param, validated on
> read (a bogus `?tab=` is scrubbed and lands on the default), written with `router.replace`, and writes
> from one tick merged into a single navigation. That composable is the codec `F54` then copied.
> *Transcribed from the summary row; body moved here 2026-09-23 with `F44`'s close.* `planner-day/B6`
> closed.

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

## F54. Template list sort and the split view's picks are not in the URL — the `F42` shape, two more views
> ✅ **FIXED 2026-09-22, after `F42` and copying its codec.** `?sort=` on the list, `?left=`/`?right=` on
> the split view, both through `useQueryParamRef`. The split ids are read with `immediate: false` and
> hydrated only after the template options load; an id not in the options, or the right side repeating
> the left's, is scrubbed from the URL and never reaches the grid. *Transcribed from the summary row;
> body moved here 2026-09-23 with `F44`'s close.* `planner-templates/B4` closed.

- **Scope:** app-side `src/core/dayPlanner/view/TemplateListView.vue`,
  `src/core/dayPlanner/view/TemplateSplitView.vue`
- **Closes:** `planner-templates/B4`
- **Root cause:** Confirmed. `TemplateListView.vue:228` `const sortBy = ref<SortOption>('mostUsed')`
  and `TemplateSplitView.vue:103-104` `leftTemplateId`/`rightTemplateId` are plain refs; nothing
  reads or writes `route.query`. CLAUDE.md's *URL State* rule names sort and selection outright, and
  the module already holds the codec (`useCalendarUrlState.ts` — absent-when-default,
  `router.replace`), which `F42` is about to reuse for `/day-planner/settings`. The split view's case
  is the sharper one: it is reachable only from a button (`TemplateListView.vue:47`), and a reload
  after picking both sides returns two empty selects — the unit observed it.
- **Files:** `TemplateListView.vue:228-232` (+ the `VSelect` that binds it);
  `TemplateSplitView.vue:103-104,114-…` (`onMounted` loads the options; the two ids should be read
  from the query after that and validated against them)
- **What to change:** Copy `F42`'s shape once it has settled (query vs. route param — `F42` recommends
  a `?` query, absent for the default): `?sort=alphabetical` on the list (absent for `mostUsed`),
  `?left=20001&right=20002` on the split view, written with `router.replace` from a watcher and read
  once on setup. Validate: an unknown sort value falls back to `mostUsed`; an id not in
  `templateOptions` (or equal to the other side) is dropped, not sent to the grid — the split view
  mounts `TemplateDayPlannerView` per side and a bogus id would otherwise reach `F55`'s 404 path
  twice. Prefer one small composable in `dayPlanner/composable/` shared by the three views over three
  inline watchers.
- **Do not change:** the sort *options* or the pinned/active/inactive sectioning — only where the
  choice lives.
- **Verification:** `B4`'s `Verify:` block — the two repros, then reload, then open the URL fresh in a
  new session (`playwright-cli open <url>` after `state-load`). Add: `?sort=zzz` → *Most used*, clean
  console; `?left=999999` → the select stays empty, no `GET …/999999`.
- **Risk:** None. Query-only, so `_routes.md` and `F14`'s nav matching are untouched.

## FW16. `CalendarGrid`'s "Days to show" and `DateRangePicker`'s mode/range configuration are private — expose them as optional models
> ✅ **FIXED 2026-09-23**, shipped with `F44` in one pointer bump. Shape: `DateRangePicker` gains
> `v-model:mode` (was a one-way prop; the re-seeding `watch` on it is gone because `defineModel` does the
> same) and one optional `v-model:rangeConfig` of `DateRangeConfig` —
> `{ rangeStart, rangeEnd, anchor, anchorDate, unit, quantity }`, one object rather than two per mode.
> It seeds the internal refs when set before mount, is re-applied when replaced later, and is written
> back on every toolbar edit and once at setup, so a bound consumer always holds the full shape; our own
> echo compares equal (by day) and stops. `CalendarGrid`'s `dateRangeMode` prop became a model and
> `dayVisibility` a model, and both plus `rangeConfig` are forwarded to the picker. The three types live
> in the new `src/_common/dto/DateRangeConfig.ts`; `docs/components.md` documents all of it, including
> that the picker does **not** clamp a restored `quantity` to `maxDays` (a consumer validates on the way
> in, as `F44` does). Verified: `/activity-history/calendar`, which binds nothing, still filters to
> *Weekend* and switches to *Duration* with no URL writes and a clean console; `ActivityRangePicker`'s
> static `mode="range"` typechecks unchanged (not driven in the browser). The *Risk* line's worry — a
> consumer mutating `:mode` from outside — is covered: `defineModel` re-syncs its local copy from the
> prop. `planner-day/B3` (framework half) closed.

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

## F44. Calendar "Days to show" and Range/Duration configuration in the URL — the app half
> ✅ **FIXED 2026-09-23, after `FW16`, in its pointer-bump commit.** `PlannerCalendarView` owns
> `dateRangeMode` / `dayVisibility` / `rangeConfig` and binds them as `FW16`'s models;
> `useCalendarUrlState` hydrates them **at setup**, so the grid mounts already configured. The codec is
> as written — `days=workdays|weekend`; `range=duration&anchor=end&from=…&unit=day&qty=N`;
> `range=range&from=…&to=…`; `month` only in month mode — each absent at its default, with one
> deliberate exception: a Duration's `from` is always written, because a bare "today" read back tomorrow
> is a different range. Decoding falls back field by field (strict `parseDateFromApi`, quantity clamped to
> the unit's cap of 31 days / 4 weeks, a Range needs two real, ordered dates ≤ 31 days apart or it is
> month mode), and the URL is rewritten to what is shown. **One deviation from the prompt:** the old
> `syncMonthToUrl` (push) and `syncModeToUrl` (replace) are replaced by **one writer** that rebuilds
> every owned key after the flush — a mode switch moves the toolbar models and the emitted range in the
> same tick, and two writers each spreading `currentRoute.query` is the `F1` race. It pushes only when
> `month` changed, so Back still walks months and nothing else. The `isApplyingUrlState` guard is kept
> but no longer load-bearing — the no-op check (owned keys equal → no navigation) is what stops a
> hydration echo. Verified live: the duration URL restores *Duration / To end / 10-14 / Days / 10* with
> *Workdays* columns; editing the quantity and unit writes `qty=3&unit=day`; switching to *Month* drops
> every range key by `replace`; *All week* leaves a bare `/day-planner`; the arrow pushes `month=2026-10`;
> a Range with *Weekend* survives a reload; `from=2026-02-31&qty=99&unit=zzz` → today / weeks / 4 and the
> URL rewritten; a reversed Range → month, clean URL; console clean throughout. The two `fixme`s at
> `planner-day.draft.spec.ts:44-45` are real tests now, plus a third for the bare URL and the bad-input
> rewrite — the file's *Planner calendar* block passes 8/8. **Found, not fixed (predates this batch):**
> Back after the arrow moves the URL to the previous month but the grid stays where it was —
> `PlannerCalendarView` reads the query only on mount and the route reuses the component, so no
> history entry the month codec pushes has ever been honoured by the grid. P7's "back/forward still
> walks months" only ever held for the URL; filed as `F86` rather than folded in, and fixed the same day
> (entry below). `planner-day/B3` (app half) closed.

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

## F86. Back/Forward on `/day-planner` moves the URL but not the grid
> ✅ **FIXED 2026-09-23**, filed and fixed the same day. Two causes, and the second one hid behind the
> first.
>
> **(1) The read side, as written.** `useCalendarUrlState` watches the route and, when a
> `plannerCalendar` query's owned keys differ from what current state would write (an outside
> navigation — our own write always matches, so it is a no-op), re-applies all of them: `days`, the
> Range/Duration config, `mode` (+ `templateId`/`preview` in apply-template mode; the selection is
> cleared unless the restored mode is bulk select), and the month. The month goes through the
> `applyMonth` callback `hydrateFromUrl` already received, **after a `nextTick`**, so the picker has
> switched to month mode before the range reaches it (in any other mode it coerces the range instead of
> reading its month). `lastRange` is set straight away, so a sync scheduled by the ref writes rebuilds the
> restored month, not the old one, and cannot push a stray entry.
>
> **(2) Grown on the way — a spurious snackbar ate the navigation.** With (1) in, Back worked and
> Forward failed about half the time. vue-router logged `NAVIGATION_ABORTED … via a navigation guard` and
> called `history.go(-1)` to revert. No app guard returns `false`, but **every Vuetify overlay registers
> one** (`useBackButton`): while an overlay is active, Back/Forward closes it and aborts. The overlay
> was a *Failed to load the calendar* snackbar that came up on **every deep link to a month**: the grid
> first emits the current month, the URL month supersedes it, `useFetchFiltered` aborts the first
> request, and `refresh()`'s `catch` toasted the cancellation. It now returns on `isRequestCanceled` or
> on a stale `refreshRequestId` (the `TemplateDayPlannerView` / `F43` pattern). That was a user-visible
> defect in its own right (a red toast on every `?month=` link), not only a test flake.
>
> **Verified:** in-page `history.back()`/`forward()` ×3 → grid and URL agree every step, `history.length`
> constant; no active overlay after the arrow; console clean. Two new tests beside the arrow test in
> `planner-day.draft.spec.ts` — Back/Forward walks the grid (asserts the picker's month and the first
> rendered day, not only the URL), and Back restores the *Days to show* of the entry it lands on. The
> whole file passes 18/18 (3 older `fixme`s skipped).
>
> **(3) Fixed the same day at the owner's request, unfiled — the framework half of (2).** Even a
> *genuine* toast swallowed one Back press while visible, because `VSnackbar` inherits `closeOnBack`
> (default `true`). The framework's `feedback/Snackbar.vue` — the only snackbar in the app — now sets
> `:closeOnBack="false"`, with a comment and a line in `docs/components.md`; dialogs keep the default,
> which is right for them. **This is a behaviour change for every app on the framework**, not an
> additive option: deliberate, since trapping Back behind a toast is never what a consumer wants.
> Verified on Vuetify 3.12.4 (`closeOnBack` is not in `VSnackbar`'s omitted overlay props): in-app push
> to `/day-planner/31-12-2025` → the *not found* toast visible → `history.back()` lands on
> `/day-planner?month=2026-10`, no navigation failure, and the toast stays up to time out. Rides in the
> same submodule commit as `FW16`.

- **Scope:** app-side `src/core/dayPlanner/composable/useCalendarUrlState.ts`,
  `src/core/dayPlanner/view/PlannerCalendarView.vue`
- **Closes:** nothing filed — found 2026-09-23 verifying `F44`. P7's own check (*"back/forward still walks
  months"*) is the expectation, and `F44`'s *Verification* repeated it.
- **Root cause:** Observed, and source-certain. The codec **pushes** a history entry whenever `month`
  changes (deliberately — so Back walks months), but `PlannerCalendarView` reads the query only in
  `onMounted` / at setup, and a query-only navigation on `plannerCalendar` **reuses** the component
  (`App.vue`'s `<RouterView>` has no `:key`), so nothing re-reads it. Repro: `/day-planner` → the
  next-month arrow → `?month=2026-10`, grid on October → Back → URL bare (September), grid still on
  October. Predates `F44`: the old `syncMonthToUrl` pushed the same way and the view had no route
  watcher either, so no entry the codec has ever pushed was honoured by the grid.
- **What to change:** In `useCalendarUrlState`, watch `router.currentRoute.value.query` and re-apply
  every owned key when it differs from what the last own write produced — not only `month`: a
  `replace` rewrites the *current* entry, so the entry Back lands on carries the toolbar and mode state
  as they were when it was left (`days`, `range`/`from`/…, `mode`). Month goes through the same
  `applyMonth` path `hydrateFromUrl` uses (only in month mode); the toolbar refs are plain assignments now
  that `FW16` made them models. Guard with the existing no-op check so the re-apply does not write back.
- **Do not change:** push-for-month / replace-for-the-rest; that split is what makes Back mean "previous
  month" and is correct. Only the read side is missing.
- **Verification:** the repro above lands on September after Back and October again after Forward, with
  URL and grid agreeing; a Back across a *Workdays* toggle made before the month change restores the
  column set of that entry; no extra history entries appear (`history.length` unchanged by Back). Add a
  test to `planner-day.draft.spec.ts` beside the next-month-arrow one.
- **Risk:** Low — one watcher, but it is the first read-after-mount this view has, so check the
  `mode=applyTemplate` entry's `templateId` re-applies without re-running the settings defaults.

## F46. The pie-chart detail panel's close button was hand-rolled three times and drifted — wrong icon set on web, no name on desktop, a domain-only label on unified
> ✅ **FIXED 2026-09-23, first of the unit-5 pair, before `F48`.** The first shape: one key. All three
> buttons take `pieChart.closeDetails` (*Close details* / *Zavrieť detaily*) — the key `F47`'s Android
> panel already minted on 2026-09-21, so no new string, and `closeDomainDetails` is **retired** from both
> locales (no consumer left). `ActivityDetailsPanel.vue` gets `icon="fas fa-xmark"` and its `:aria-label`
> becomes `:ariaLabel`, so all four close buttons now bind the same camelCase form;
> `DesktopProcessDetailsPanel.vue` gains the name it never had. `DetailsPanelCloseBtn.vue` was **not**
> extracted — the key closes both findings, and the four copies differ in `size` (`small` vs `x-small`) and
> `density` for layout reasons, so a shared component would need those as props anyway.
> `tracking-dashboards.draft.spec.ts`: the `B1` and `A2` `fixme`s are un-`fixme`d with the new name, and
> **both pass** (`B1` asserts the `svg` is visible). Live on the seed: `/activity-tracking/unified`
> selecting an item gives `Close details` with a rendered glyph; console carries no *"Could not find one or
> more icon(s)"* (0 errors). SK verified by source only.

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

## F48. The Android dashboard renders two controls for an Active/Background split its source does not have — a no-op metric radio on the pie, and a legend for a lane that is always empty
> ✅ **FIXED 2026-09-23, after `F46`, both halves in one commit.** **Pie:** `ActivityPieChart` takes
> `showViewMode?: boolean` (default `true`, via destructure default, so its `props.` reads became the
> destructured names) and `v-if`s the `VRadioGroup`; `AndroidPieChartSection` passes `false` and keeps
> `viewMode` bound at `'total'` for the required model. **Timeline:** derived, as recommended — the
> *Background* legend entry renders only when `detailSessions` or `backgroundSessions` is non-empty
> (`hasSecondaryLanes`); no new prop, and `AndroidActivityDashboard.vue` is untouched. **The *Single /
> Split* toggle stays**: it splits the *time axis* at the midpoint (`TimelineGrid.vue` `splitPoint`), not
> the lanes, so it still means something with one lane. Live on the seed: `/activity-tracking/android`
> — 0 `active` radios, legend reads *Active* only; `/activity-tracking` — radios `total,active,background`.
> The Android spec's scoping workaround is dropped: it now asserts no *Background* anywhere in `#app`
> and no *Active* radio, and passes. Whole `tracking-dashboards.draft.spec.ts`: 12/13 — the one failure,
> *URL-seeded date range survives a reload* (`:40`), waits on `08.09.2026` while the EN account renders
> `09/08/2026`; a stale SK-format literal from before the default-locale flip, **not this batch**. Fixed
> the same day as a follow-up: the literal was the smaller half — the date is an `<input>` *value*, which
> `getByText` never matches in any format — so the test now asserts `toHaveValue` on the *Date from* /
> *Date to* textboxes (and checks *Date to*, which it did not before). 13/13. Not re-checked: *Active*
> re-slicing the web pie (code path untouched).

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

## FW9. The forgotten-password flow cannot complete at either step — the request omits `recaptchaToken`, and the reset link points at a view that does not exist

> ✅ **FIXED 2026-09-23.** `vue_framework` `0d83a88`, bump `b7423bc2` (the token half was `6157283` on
> 2026-09-15). New `ResetPasswordView` at `/reset-password` (`resetPassword`, `public` + badge): reads
> `userId`/`token`, `MyNewPasswordInput isNew`, `executeRecaptcha('reset_password')`, `POST
> /auth/reset-password`; success and invalid-link states both end in *Go to login page*. Three new keys
> in both locales (`setNewPassword`, `passwordResetSuccess`, `resetLinkInvalid`). `ForgottenPasswordView`'s
> `catch` is only `handleHttpCodes(0)` on no response (404 branch, literal and `console.log` gone), and its
> sent dialog gains a *Go to login page* confirm. `docs/modules/user.md` says six views and documents the
> `BuildResetLink` override; `_routes.md` has the record; `SIGNED_OUT_ONLY_ROUTES` untouched.
> **Verified** with playwright-cli and the draft spec (5 passed): `/reset-password` bare → invalid-link
> state, no request; `?userId=10001&token=garbage` + a valid password → `400`, snackbar **"Invalid token."**
> (Identity's wording — not *"Invalid or expired reset token"* as the body guessed), form still up; forgotten
> password aborted → *unknown error*, no `TypeError`; real submit → `204`, dialog, *Go to login* → `/login`.
> The `X1` fixme is promoted, plus two reset-view cases. **Not verified:** a full round trip with a real
> mailed token (no sender configured). The optional `passwordResetEmailSent` rewording was not done — it
> is a copy decision.

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

> ✅ **FIXED 2026-09-23.** `vue_framework` `8dbb5ff`, bump `7a612d7f` (which carries `F39`). New
> `utils/postLoginRedirect.ts#resolvePostLoginTarget(route)` returns `route.query.redirect` when it is a
> string starting with `/` and not `//` or `/\`, else `'/'`; used at all three success paths (password,
> Google, 2FA). `console.log(valid)` gone; the `'No user!!!'` snackbar is `handleHttpCodes(0)`.
> `docs/modules/user.md` documents the contract. **Verified** with playwright-cli after a form sign-in:
> signed out, `/todo-list/13001` → `/login?redirect=/todo-list/13001` → sign in → `/todo-list/13001`;
> `?redirect=https%3A%2F%2Fexample.com` and `?redirect=%2F%2Fexample.com` both → `/`. **Not verified:**
> the Google and 2FA paths (source read only — same helper, one token each); `P3`'s console check was not
> run separately (the line is deleted). The draft spec's read-half `fixme` stays: promoting it costs a
> `/auth/login` hit in a file that must not spend one (the note beside it says so).

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

## F39. The auth guard's redirect drops the destination — the write half of `auth/B1`

> ✅ **FIXED 2026-09-23** in `7a612d7f`, the same commit as `FW11`'s pointer bump. `src/router.ts`'s guard
> returns `{ name: 'login', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } }`;
> `_routes.md`'s guard legend says so. **Verified** end to end with `FW11` (see its note). The draft spec's
> guard test now asserts the `redirect` query (it asserted a bare `/login` before, and would have failed).

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

## FW8. Six elevated buttons in the framework's user module use the tonal/outlined colour tokens — and the pairing rule is written only in this app's CLAUDE.md

> ✅ **FIXED 2026-09-23**, folded into `FW12`'s framework commit `549ae02` (bump `a0f116a9`), as the
> queue's order allowed. Six tokens changed as written (`warning` → `warningDark` once, `error` →
> `errorDark` five times), and the pairing sentence sits under `SETUP.md`'s colour-names paragraph.
> **Verified** on `/user/settings` in both themes by computed style: *Change password* `bg-warningDark`
> `rgb(202,138,4)`, *Delete account* and each *Revoke* `bg-errorDark` `rgb(185,28,28)`, white text, the
> same in light and dark. **Observed, not filed:** white on `#CA8A04` is about 2.9:1, under the 4.5:1 AA
> threshold for button text. That is the theme's hex, not this batch's pairing; worth a look if the
> palette is revisited.

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

## FW12. Both confirm-e-mail views' error states are a lone button — and the sibling the unit held up as the model is no better

> ✅ **FIXED 2026-09-23.** `vue_framework` `549ae02` (with `FW8`), bump `a0f116a9`. Both error branches
> show their sentence persistently plus a *Go to login page* button (`{ name: 'login' }`); a link missing
> its params renders the error state **without posting**; `color="main"` → `primary` on both success
> buttons; both `console.log`s gone; each `catch` calls `hideFullScreenLoading()` itself.
>
> **This batch's *Do not change* was wrong, and verifying it turned up two unfiled defects, fixed in the
> same commit.** (1) The body kept `API.post('/auth' + fullPath)` as "the contract". It is not: the
> endpoint (`BaseConfirmEmailEndpoint.cs`) binds `ConfirmEmailRequest { userId, token }` from a **JSON
> body**, and `/confirm-email?userId=10001&token=bad` answered **415** even with both params present. So
> **every** confirmation link, valid or not, has always failed. It now posts the body, and a bad token
> gets the server's `400`. (2) The server has **one** resend route, `POST /auth/resend-confirmation-email
> { email }` (checked against the running API's swagger). The client called two routes that do not exist:
> this view's `/resend-confirmation-email/{userId}`, which answered 401 even with the real id `10001`, and
> `ResendConfirmationEmail.vue`'s `/resend-confirmation-email-by-email/{email}`. So resend has never
> worked from either place. `ResendConfirmationEmail` now posts `{ email }` → `204`, and its failure uses
> the new `errorResendingConfirmationEmail` key instead of `general.error`. `ConfirmEmailView` **drops
> Resend**, which departs from *What to change*: its link carries no address to resend to. A new
> `confirmEmailSignInToResend` line sends the user to sign in, where the "email not confirmed" branch
> offers the resend with the address in hand.
>
> **Verified** with playwright-cli and the draft spec: bare `/confirm-email` → sentence, hint, *Go to
> login*, no *Resend*, no request; `?userId=10001&token=bad` → body `{ userId: 10001, token: 'bad' }` → 400,
> sentence; bare `/confirm-email-change` → sentence and button; the login page's resend panel after a fresh
> registration → `POST /auth/resend-confirmation-email` 204. **Not verified:** a successful confirmation
> with a real token (the `color="main"` fix is a source read, as the body anticipated), and
> `ConfirmEmailChangeView`'s `/user/change-email/confirm` payload beyond "the route exists in swagger".

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
- **Fourteenth pass — unit 15's round 2 re-drove `B4` and now agrees with this batch:** the
  *"persistent explanation"* on `ConfirmEmailChangeView` was the snackbar mid-fade
  (`confirm-email-change--mutation-recheck.png` shows the steady state: one button), both views are
  bare, and `B5`'s `/resend-confirmation-email/undefined` request was observed on the wire — it answers
  **401** (the API's `FallbackPolicy` on an unmatched `{id:long}` route, not an auth decision) and drags
  a `/auth/refresh` behind it (`FW21`). The `userId` guard below removes that trigger. One more detail from
  the same round, adjacent and folded: a no-params visit posts `API.post('/auth' + fullPath)` with **no
  body**, which the server answers **415**, not 404 — so the initial-confirm `catch` sees a media-type
  error for a missing token. Guard it the same way: no `userId`/`token` in the query → render the error
  state without posting at all (the shape `FW9`'s reset view takes for a bad link).
- **Why `U6` is not a defect:** the unit reasoned that `showFullScreenLoading()` on mount with no
  `hideFullScreenLoading()` in either `catch`, and an interceptor that hides only on success, should
  strand the spinner on any error — and then honestly reported that three live attempts never showed
  one (four, after round 2 — and the unit still lists `U6` as open; it has not read §64). The missing piece is `SnackbarComposable.ts:43-46`: `showSnackbar` calls
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

## FW21. The interceptor's `AUTH_ENDPOINTS` allowlist names the signed-in auth routes and none of the signed-out ones

> ✅ **FIXED 2026-09-23.** `vue_framework` `2351ce7`, bump `a0f116a9`. **Extended the list** (the body's
> first option) rather than matching the `/auth/` prefix it preferred. The running API's swagger has
> **signed-in** routes under that prefix, `/auth/logout-all` and `/auth/login/2fa/setup`, so the body's
> check ("is any `/auth/*` route ever called signed in?") answers yes on the server side. A prefix match
> would log out, rather than refresh, the first caller of either one with an expired token. Added:
> `register`, `forgotten-password`, `reset-password`, `confirm-email`, `resend-confirmation-email` (the
> real route, which carries no id — see `FW12`), and `login/google`, which was missing too. The match
> strips the query first. **Verified:** 9 new unit cases in `axiosConfig.test.ts`: seven signed-out URLs
> do not refresh, and the two signed-in prefix routes still do (13/13 pass). In the browser, a mocked
> `401` on `/auth/forgotten-password` produced no `/auth/refresh` in `requests`, and the real resend's
> 401 before its route fix produced none either. **Not verified separately:** the expired-token refresh on
> a normal route. The unit tests cover it, and every signed-in e2e run in this session exercised it.

- **Scope:** **[framework]** `src/_common/axiosConfig.ts:63-65` — submodule commit, then pointer bump
- **Closes:** `auth/B7` — **re-graded `bug` → `polish`** (§110)
- **Root cause:** Confirmed. `AUTH_ENDPOINTS = ['/auth/refresh', '/auth/login/2fa', '/auth/login',
  '/auth/microsoft-sign-in', '/auth/logout']` and `isAuthEndpoint()` is `url === path ||
  url.endsWith(path)`, so a 401 from `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email`
  or `/auth/resend-confirmation-email/{id}` takes the refresh-and-retry branch (`:180-199`) while no
  session exists: `POST /auth/refresh` → 401 → `logoutClient()`, which returns at its first line because
  `auth.isAuthenticated` is already `false` (`:171-172`) → the original rejection. The unit observed the
  pair on `B5`'s `/resend-confirmation-email/undefined`. **Why that 401 exists at all:** `undefined` does
  not match `{id:long}`, the route is unmatched, and the API's authorization `FallbackPolicy` answers
  unmatched paths with 401 (README, *Test data*) — it is not the endpoint saying anything. `FW12`'s
  `userId` guard removes the only observed trigger; the allowlist gap remains for any future 401 from a
  signed-out route, and the cost of it is one wasted request and one console line. No user-visible
  effect, hence `polish`. `FW9`'s *Do not change* on this list stands for the two endpoints it names
  (neither answers 401); this batch is the class, not those two.
- **What to change:** Either extend the list with the four signed-out paths (matching
  `/auth/resend-confirmation-email` by prefix, since it carries an id), or replace the `endsWith` test
  with "starts with `/auth/`" and keep the list as documentation of which ones exist. The second is
  smaller and cannot drift again; check that no `/auth/*` route is ever called **signed in** with an
  expectation of refresh — `/auth/logout` is in the list already, so the answer is no.
- **Do not change:** the refresh branch itself, or `logoutClient()`'s signed-out early return — that
  return is what makes this harmless.
- **Verification:** `B7`'s `Verify:` block after `FW12` has landed needs a different trigger (the
  `undefined` path is gone): `playwright-cli route "**/api/auth/forgotten-password" --status=401`, submit
  the form signed out, and confirm `requests` shows **no** `/auth/refresh`. Then sign in and confirm an
  expired-token refresh on a normal route still works — `CLAUDE.md`'s 401-burst paragraph is the check.
- **Risk:** None to behaviour; two repos. An app whose signed-out endpoints live under a different prefix
  gains nothing and loses nothing.

## FW13. `RegistrationView` fails closed on an empty reCAPTCHA token — the one thing making local registration impossible — and its `catch` overwrites the server's message

> ✅ **FIXED 2026-09-23.** The guard half landed 2026-09-15 (`6157283`, bump `04c405e9`, note below); the
> rest is `vue_framework` `37773f3`, bump `4f7391cb`. The register request is `_silent`, and the `catch`
> words everything once: `409` → new `authorization.emailAlreadyRegistered` (both locales); otherwise the
> first `generalErrors` entry; otherwise `handleHttpCodes(status ?? 0)`. Both legal `RouterLink`s have
> `target="_blank" rel="noopener"`. **Verified** with playwright-cli: a throwaway registration → `200` →
> `/login` with the address prefilled and the resend panel; the same address again → `409`. A
> MutationObserver on the snackbar recorded exactly **one** message, the new sentence, and no *"changed by
> someone else"*. *Terms and conditions* opened `/legal/terms` as a second tab, and the form kept the
> address. Draft spec: `P1`'s fixme promoted; the registration case gains the duplicate submit; the
> legal-link case follows the popup. `auth.draft` + `auth` specs: **28 passed, 4 fixme**. The throwaway
> accounts are wiped by the next seed (the spec run reseeded after the manual pass). **Not verified:**
> the real-verifier `403` wording (it needs a deployment with a real reCAPTCHA key).

> ✅ **Half landed, 2026-09-15 — the guard.** `vue_framework` `6157283` (bump `04c405e9`) deleted the
> `if (!recaptchaToken) { … return }` block; `RegistrationView.vue:138` now assigns the token as-is, with
> a comment saying why. Unit 15's round 2 had escalated `O1` to **`X2`** (`blocker`) on the same
> mechanism this batch described — the server accepts the empty token, the client refused to send it —
> and round 3 verified the fix: `POST /auth/register` → 200 through the real form, a throwaway account
> created, `/login` reached with the prefill (`U5` resolved as "working as coded"), and the 2FA dialog
> reached for the first time (`B8` → `FW14`). **What is still open:** the `catch` at `:163-166`
> (`handleHttpCodes(error.response?.status)` — the round-3 duplicate submit **did** answer 409, so the
> *"changed by someone else"* string is now one click away for anyone who registers twice), and `P1`'s
> two `target="_blank"`s (`:41,46` — unchanged in the commit). The `UseRecaptchaHandler.ts` doc sentence
> landed too (`docs/composables.md`). Read the body from *Adjacent, source-certain* on.

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

## F1. The view-mode toggle loses `view=table` to a URL-write race
> ✅ **FIXED 2026-09-23.** Both halves, app-side only; `useTableUrlState.ts` and `BasicTable.vue` untouched.
> **Half 1:** `projectFilterUrlState()` passes `defaultSortBy: [new VSortItem('activity.name', 'asc')]`,
> so from a clean URL `BasicTable`'s mount watcher finds its key and pushes nothing. **Half 2 needed a
> different shape than the body suggests, and the first attempt failed verification:** re-checking on
> `route.query.view` never fires. When both replaces start in the same tick, Vue Router **cancels** the
> earlier one (ours), so `view` never lands in the route and never changes. `ProjectsView` now
> re-checks on `[viewMode, route.fullPath]`, so after every navigation that *settles*. It re-writes by
> spreading the query as it is then, so it cannot cancel the other writer's keys. Two guards: a path
> check (`route.path !== ownPath`) stops it stamping `view` onto the next page during unmount, and a
> missing `view` counts as `board`, so board mode writes nothing extra.
> **Verified** in a dedicated `playwright-cli` session (form sign-in, not a shared state file; another
> session was live): clean `/leisure/projects` → one *Table* click → `?view=table`, and a reload stays on
> Table. **Case 2**, from `?sortBy=estimatedHours:desc`, is the one half 1 cannot cover:
> `BasicTable` still appends `activity.name:asc`. With only half 1 it reproduced the bug (`view`
> absent after the click). With half 2 it gives
> `?sortBy=estimatedHours:desc,activity.name:asc&page=1&perPage=25&view=table` and survives a reload.
> A column-header sort write keeps `view=table`, Board → Table round trips write each mode, and
> navigating to `/` leaves a bare `/`. Console: 0 errors. `npm run type-check` exit 0; eslint on the two
> files clean.
> **Not verified:** a sort by `activity.name` against the API, beyond the page loading its rows
> (the *Risk* line's 500 concern). The other three leisure views keep their two-writer shape, per
> *Do not change*. `F2` shares this file and is still open. It will delete `loadBoard`, and the
> view-mode watchers here should survive that.

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

<!-- The trivial sweep, 2026-09-23: F9, F17, F21, F22, F26, F28, F32, F80, F81, F82, F83 — one session.
     Browser-verified in a dedicated `playwright-cli` session (`-s=trivial`, form sign-in; the shared
     `e2e/.state/auth-10001.json` was dead, and the session was revoked twice more mid-pass by work
     elsewhere, so each re-entry was a fresh form sign-in). `npm run type-check` exit 0, `npm run lint`
     exit 0 after the code edits. -->

## F9. `homeUiStore` never persists, and CLAUDE.md asserts the opposite of what the plugin does
> ✅ **FIXED 2026-09-23.** `homeUiStore` now passes `{ persist: { storage: sessionStorage } }` as the third
> `defineStore` argument, matching `dayPlannerStore`. Its doc comment now says the plugin is opt-in and that
> this argument is what makes it persist. CLAUDE.md was corrected in **both** places that made the claim.
> One is the Tech Stack *State* bullet, which the body did not name. The other is the `_common/bootstrap/`
> Persistence item, which now says outright that a store with no `persist` key does not persist, and names
> this batch as the second bug that claim caused.
> **Verified:** toggling *Show done* on `/` puts `{"hideDoneTodoList":false,"hideDoneRoutine":true}` in
> `sessionStorage.homeUi`, and the toggle survives `/todo-list` and back. The toggle was restored afterwards.

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

## F17. CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means
> ✅ **FIXED 2026-09-23.** The sentence now reads *"Every **preference** settings page must be reachable
> from `/user/settings`"*. It names the two entity-management families that are excluded
> (`/activity-settings/*`, `/activity-tracking/{desktop,android}/settings/*`) and points to
> `src/core/user/moduleSettingsLinks.ts` as owner of the list and the rule. It also names `/routine-settings`
> as that file's deliberate borderline case. The file lists it for its streak preferences, so it must not be
> read as an exclusion. The body cites the file under `component/settings/`, but it lives at
> `src/core/user/moduleSettingsLinks.ts`. Docs only; nothing to verify in the browser.

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

## F21. Categories table's "Role" column is a comma-joined aggregate presented as a single value
> ✅ **FIXED 2026-09-23.** The header is the new key `activities.rolesInUse`, "Roles in use" / "Použité roly".
> The column key stays `role` (the server remaps it to `RoleSortKey`), and a comment in
> `ActivityCategoryTable.vue` says why. No chips.
> **Verified:** `/activity-settings/categories` reads "Roles in use". Header clicks cycle
> `sortBy` through `role` asc → desc → none with no error, and the rows reorder. On the 3-row seed, desc and
> none happen to return the same order, because the key is a joined string. That is not a click-handler fault.

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
> ✅ **FIXED 2026-09-23 — and the body's fix alone caused a regression.** As written, `flex-wrap` on the
> filter row plus `min-width: 200px` on both comboboxes fixed the labels. But the extra width came out of
> `VTabs`, which then clipped its own *Categories* tab to "CATE(" behind a scroll arrow. The screenshot
> caught it; the a11y tree would not have. `VTabs` now carries `flex-0-0` too, so the filter group wraps
> instead of the tabs shrinking.
> **Verified by screenshot** at 1440×900 after the tabs fix: all three tabs, *Roles* and *Categories* are
> legible, and the Active/Archived/All toggle drops to a second line. 1920×1080 was checked before the tabs
> fix, with the labels legible.

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

## F26. The period-total banner is a `flex: 1 1` item — it has no size to wrap on
> ✅ **FIXED 2026-09-23.** `.myAlert { flex: 0 0 auto }` in `HistoryPeriodBanner.vue`, with a comment
> explaining the zero-basis mechanism. The inline `max-width: fit-content` is removed.
> **Verified by screenshot** at 1440×900 and 1920: the seeded week renders *"Period total: 26h 23m vs
> previous: 0m no baseline"* in full on one line. That is the no-baseline branch. The seed had no range with
> a baseline to render the percentage chip, so the wider variant is covered only by the mechanism, not a
> screenshot.

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

## F28. `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer
> ✅ **FIXED 2026-09-23.** `HistoryDetailView` calls `useSetBreadcrumbExtra()` and sets
> `[{ title: t('history.detail.title') }]` from a `watch(..., { immediate: true })` on the translated string,
> so it follows a locale switch. There is no date segment; that part was optional.
> **Verified:** `/activity-history/detail?date=2026-09-23` → *Home › Summary › History Detail*. On
> `/activity-history` → *Home › Summary*. Detail → calendar icon → *Home › Calendar*, with the extra crumb gone.

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

## F32. `/activity-history/calendar` has no `<h1>`, unlike its two siblings
> ✅ **FIXED 2026-09-23.** `HistoryCalendarView` is wrapped in a `px-2 pt-6 w-100 h-100 d-flex flex-column`
> root. It has a header row with a `chart-line` icon button to Summary (tooltip `history.calendar.openSummary`)
> and `<h1 class="text-h4">` (`history.calendar.title`, "History Calendar" / "Kalendár histórie").
> `CalendarGrid` gets `flex-fill` + `min-height: 0`.
> **Verified by screenshot** at 1440×900: the `h1` sits above the Mode/Month/Year row, and the grid scrolls
> inside its card. The holiday footer stays on screen, with no page-level scroll. The icon button navigates
> to `/activity-history`.

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

## F80. The board card's metadata line runs two fields together
> ✅ **FIXED 2026-09-23.** `ProjectReadinessBoard.vue` builds the line in a `metaLine(item)` function: an
> array of the present parts joined with `' · '`. That replaces the two conditional templates.
> **Verified:** the seeded card reads *"Intermediate · Woodworking · 8.5h"*. No card with only one of the
> optional fields exists in the seed, so the single-field case is covered by the join, not observed.

- **Scope:** app-side `src/core/leisure/component/project/ProjectReadinessBoard.vue:86-98`
- **Closes:** `leisure-projects/P2`
- **Root cause:** two adjacent `<template v-if>` blocks each lead with the literal `· ` (space *after*,
  none before) and sit with no whitespace between them in the source, so the second separator has no
  leading space: *"Intermediate · Woodworking· 8.5h"*. Reproduced on the seeded row and on a row created
  in the pass, so it is not data-shaped.
- **What to change:** build the line as an array of the present parts and `join(' · ')`, rather than two
  independent conditional templates each guessing at its own separator. That is also the only form that
  stays right when a third optional field is added.
- **Verification:** `P2`'s `Verify:` block, on a card with **both** optional fields and on a card with
  only one — the second is where a naive `' · '` prefix leaves a leading separator.
- **Risk:** None.

## F81. The recurrence tab strip asks for an icon this app does not bundle
> ✅ **FIXED 2026-09-23.** `RecurrenceType.ts` returns `arrows-left-right-to-line` for `DateRange`, which
> resolves in `fas` (checked against the pack). The body's suggestions were `calendar-days` / `calendar-week`,
> but those are already the `DayOfMonth` and `DayOfWeek` icons in the same strip, so either would have
> duplicated a sibling.
> **Verified:** all four recurrence tabs render an icon, and the console shows 0 errors (no
> `Could not find one or more icon(s)`). The dialog was cancelled.

- **Scope:** app-side — the recurrence-type tab strip in the New/Edit Repeating Task dialog
  (`/day-planner/settings` → Repeating Tasks → Add)
- **Closes:** `planner-day/P1`
- **Root cause:** the *Date range* tab references `calendar-range`, which is **not** in the three free
  FontAwesome packs this app bundles. Pinned down this pass rather than guessed: the name is absent
  from `fas`, `far` *and* `fab`, aliases (the ligature list on each definition) included — it is a
  Pro-only icon. The one literal is `RecurrenceType.ts:15` (`return 'calendar-range'`), not the
  template. The tab renders with no icon, misaligned against its three siblings which all have one, and
  the console logs `Could not find one or more icon(s) {prefix: fas, iconName: calendar-range}` on
  every dialog open.
- **It is not the tip of an iceberg, and that was worth checking.** Every static icon literal in
  `src/` (204 in `.vue`, 79 in `.ts`, `_common` included) was resolved against the three packs this
  pass. **Exactly two do not resolve:** this one and `F46`'s `mdi-close`. Nothing else to sweep up, and
  no case for a registry or a lint rule off the back of it.
- **What to change:** swap to a bundled icon. `calendar-days` is the closest fit for a range;
  `calendar-week` also resolves. `_common/utils/fontAwesomeIcons.ts` registers the packs wholesale
  rather than listing names, so it cannot be consulted for what exists — resolve a candidate against
  the pack instead (`node -e "const {fas}=require('@fortawesome/free-solid-svg-icons'); …"`), or just
  reuse a name already rendering elsewhere in this app.
- **Verification:** `P1`'s `Verify:` block — the icon renders and the console logs nothing.
- **Risk:** None.

## F82. *Importance* is required in the repeating-task dialog, unmarked, and optional in the plain one
> ✅ **FIXED 2026-09-23 — decided for the asterisk.** The server's `RepeatingPlannerTaskValidator` has
> `RuleFor(x => x.ImportanceId)` as `NotNull().GreaterThan(0)`. Its integration test
> (`RepeatingPlannerTaskValidationTests.cs`) says it is required here and merely optional on the other two
> task shapes. The dialog is right to demand it; it was only unmarked. New key `planner.importanceRequired`
> ("* Importance" / "* Dôležitosť"), following `activities.nameRequired`'s convention of an asterisk inside
> the string. The plain task dialog is unchanged.
> **Verified:** the label reads *"* Importance"* before any submit.

- **Scope:** app-side `src/core/dayPlanner/component/settings/RepeatingTaskDialog.vue` (the Importance
  select and its validator)
- **Closes:** `planner-day/P2`
- **Root cause:** submitting with Importance unset fails with *"This field is required"* under the field,
  but the label reads plain *"Importance"* while `* Name` and `* Activity` in the same dialog carry the
  app's asterisk convention. The user gets no upfront cue, and *Location*, *Notes* and *Is background*
  sit unmarked beside it looking identical.
- **Decide before editing.** The same field is genuinely optional in the plain Add/Edit Task dialog, so
  one of the two dialogs is wrong. Marking it is the one-line fix; relaxing the validator is the other,
  and is the right one if a repeating task has no more reason to demand an importance than a single task
  does. Check the server's `RepeatingPlannerTask` contract before choosing — if `Importance` is
  non-nullable there, the answer is the asterisk.
- **Verification:** `P2`'s `Verify:` block — the cue is present before the first submit attempt. If the
  validator is relaxed instead, confirm a repeating task created with no importance round-trips and
  renders sensibly on the day grid.
- **Risk:** None either way; the risk is shipping the wrong one of the two.

## F83. The template header counts foreground tasks only and does not say so
> ✅ **FIXED 2026-09-23.** `taskStats` also returns `backgroundCount`. `statsLine` gains a `{background}`
> slot in every plural form. It is filled with `" " + planner.template.statsBackground` ("(+{count}
> background)" / "(+{count} na pozadí)") when the count is non-zero, and is empty otherwise.
> Planned/free arithmetic is untouched.
> **Verified** on template 20001 against a task created and deleted through the app's own
> `useTemplatePlannerTaskCrud` (id 20113, `isBackground: true`). Before: *"5 tasks · 5h 25m planned ·
> 10h 35m free"*. With it: *"5 tasks (+1 background) · 5h 25m planned · 10h 35m free"*. After the delete,
> back to the original. The fixture is unchanged.

- **Scope:** app-side `src/core/dayPlanner/view/TemplateDayPlannerView.vue` (`taskStats`)
- **Closes:** `planner-templates/P3` — round 1's `U1`, now **settled**: round 2 created the first
  `isBackground: true` template task the fixture has ever had and confirmed the exclusion works exactly
  as the code reads. This is a labelling gap, not a computation bug, and it is re-graded to `polish`
  accordingly (the unit did this itself).
- **Root cause:** `taskStats` filters `nonBgTasks` for all three figures. Excluding background time from
  *planned* / *free* is correct — a background task does not block time. Excluding it from the plain
  **count** is what leaves a reader with two blocks on screen and *"1 task · 1h planned · 15h free"* in
  the header.
- **What to change:** mention the background count when it is non-zero — *"1 task (+1 background) · 1h
  planned · 15h free"*. One template string and one locale key pair; leave the planned/free arithmetic
  alone.
- **Verification:** `P3`'s `Verify:` block. Note it needs a background task to exist — none is seeded, so
  create one through the API (CLAUDE.md *Mutating specs* rule 1) or repeat round 2's hand-made one and
  clean up after.
- **Risk:** None.

## F2. Every board-mode filter change fires two competing grid requests through one `AbortController`
> ✅ **FIXED 2026-09-23** (`273d327b`, after `F1`'s `576df526` in the same file). This is the
> recommended shape: **one fetch**. The board renders `useServerTable`'s own `items`/`loading`. A
> `viewMode` watcher (`immediate`) sets `itemsPerPage = BOARD_PAGE_SIZE`, `page = 1` and calls `load()` on
> entering board mode. On entering table mode it restores the table's parked page size, and the table
> then loads itself through `BasicTable`'s `onLoadItems`. `loadBoard`, `boardItems` and `boardLoading`
> are deleted. The board's error state is now a `fetch` wrapper that clears `failed` plus an `onError`
> that sets it unless `isRequestCanceled`, both on `useServerTable`'s existing options. No framework
> change. A `perPage=200` in the URL is treated as the board's, so it never becomes the table's size. The
> `BOARD_PAGE_SIZE` comment is kept, with the >200 truncation noted in the code as *Risk* asked.
> **Reproduced first** on `576df526`: one board filter change gave two grid POSTs, one of them
> `net::ERR_ABORTED`.
> **Verified** in a dedicated `playwright-cli` session (`-s=f2`, form sign-in):
> - A clean board load sends one POST, `itemsPerPage: 200`.
> - A board filter change (*Activity* = "Book") sends **exactly one** POST, carrying 200 and the filter.
> - Switch to Table sends one POST, `itemsPerPage: 25`, and the URL goes back to `perPage=25` with
>   `view=table` kept (F1 holds).
> - A column sort and a table-mode filter change each send one POST.
> - Back to Board sends one POST at 200.
> - From `?view=table&perPage=10`, Board → Table restores `perPage=10`.
> - **0 `ERR_ABORTED`** across the whole run.
> - `route … --status=500` renders *"Couldn't load this list"*, and *Try again* recovers with one 200.
> - `npm run type-check` exit 0, eslint on the file clean.
> **Not verified:** paging across real pages. The seed has one project, so the "one request per page
> change" half of the check could only be shown through sort and filter, which take the same path
> (`onLoadItems` → coalesced `load()`). The >25 under-render the finding inferred was never observable on
> this seed, before or after.

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

## F5. Non-active readiness-status buttons on the board are effectively invisible
> ✅ **FIXED 2026-09-23** (`cfe9e5be`). Inactive status buttons are now `variant="outlined"`
> `color="neutral-600"`. That token is theme-aware: `#4B5563` in light, `#9CA3AF` in dark. The active
> button is unchanged (`elevated` in its `STATUS_META` colour, which *Do not change* protects), and
> filled-vs-outlined is the state cue.
> **The first pick, `textMuted`, failed measurement.** The light theme's app background is `#CCCCCC`,
> not white, because the card is transparent over `.v-application`. On it, `#6B7280` computes to
> **3.0:1**, right at the threshold. `secondaryOutline` was ruled out without measuring: it would read
> as a pale Planning, since Planning's active colour is `secondary`.
> **Verified** at 1440×900 with a dedicated `playwright-cli` session (`-s=f5`). Contrast was computed
> in-page from the glyph's computed colour against the first opaque ancestor background: **light
> 4.71:1** (`rgb(75,85,99)` on `rgb(204,204,204)`), **dark 7.38:1** (`rgb(156,163,175)` on
> `rgb(18,18,18)`), both against 1.4.11's 3:1. Element screenshots in both themes show all three
> buttons, with the active one clearly filled. The theme was switched with the app's own toggle and
> switched back to light afterwards. Typecheck exit 0, eslint clean.
> **Not verified:** clicking an inactive button to move a card. The status-change logic is untouched,
> and it would mutate the seed's only project.

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
> ✅ **FIXED 2026-09-23** (`be6aef84`). The attribute was deleted from all four call sites
> (`ProjectsView`, `BacklogView`, `BucketListView`, `MemoryAnchorsView`). `FilterPanel.vue` is untouched,
> and it is still multi-root (`<div>` + `<Teleport>`). The grep's other `flex-1-1` hits are on
> single-root elements and were left alone.
> **Reproduction trap, worth knowing:** the framework's `warnHandler` (`installFramework.ts:71`) logs Vue
> warnings at **info**, so `playwright-cli console warning` reports *0* while the warning is firing.
> Read `console info` or plain `console` instead.
> **Verified** with a dedicated `playwright-cli` session (`-s=f6`). All four views were measured before
> and after, at 1440×900 and 390×844, on the panel's root `flex-fill` box (x, width, height) and on the
> count of *"Extraneous non-props attributes"* in the console:
> - **Before:** 4–5 warnings on every view.
> - **After:** 0 warnings on every view, and the geometry is **pixel-identical** on all eight
>   view×width pairs. So `flex-fill` alone was doing the work, and the batch's stop condition (a
>   layout change means fixing the framework) never triggered.
> - Typecheck exit 0, eslint clean on `src/core/leisure/view/`.
> **Not verified:** nothing outstanding. No screenshots were taken, because the measured boxes
> matched exactly.

- **Scope:** app-side — the four leisure views, **not** `src/_common/component/FilterPanel.vue`
- **Closes:** `leisure-projects/P1`, **`leisure-backlog-picker/P1`** (thirteenth pass — the same
  warning, observed on `/leisure/backlog`; the finding's *"BacklogView is the only leisure view that
  passes a `class`"* is wrong, the grep below still returns four — §93)
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
> ✅ **FIXED 2026-09-23** (`e3271007`). This is the batch's second option: the period chips get their
> own scroller, and the counter and both buttons stay anchored. The change is in
> `RoutineTodoWidget.vue` only (the body's *Files* allows the chip row). `WidgetCard.vue`, the 64 px
> header and `TodoListWidget` are untouched.
> The scroller is a `div.routine-periods` with `role="region"`, `tabindex="0"` and
> `aria-label="home.streaks"`, an existing key. A scroller with nothing focusable inside cannot
> otherwise be scrolled from the keyboard. Above `md` it has `flex: 1000 1 0; min-width: 0`, and a
> first-child `margin-left: auto` keeps the chips beside the buttons when there is room.
> **Two things the body did not know:**
> 1. **The title was squeezed too.** Before the fix, `.widget-card__title` was 0 px wide at 1440 and
>    22 px at 1920, because it has `min-width: 0` and gave up its width before the buttons started
>    overflowing. This was measured by stashing the change.
> 2. **A shrink-based scroller is not enough.** The first version (`flex: 0 1000 auto`) still took
>    0.4 px from the title (124.0 px box, 124.4 px text), and that ellipsized it to "Routine tas…".
>    Flex shrinks every item in proportion. Only the zero-basis/grow shape leaves nothing to shrink.
>    That shape is scoped to `md` and up, because below `md` the chips' own width is what wraps them
>    onto their own row. Unscoped, it held them to 81 px on one line at 390.
> **Verified** with a dedicated `playwright-cli` session (`-s=f7`), measuring all four widget headers at
> 1280/1440/1920/2560/960/390:
> - The routine header's `scrollWidth === clientWidth` at every width (was 766/548 at 1440 and 766/468
>   at 1280).
> - Both routine buttons are within the header's right edge (1440: 1356/1404 vs 1420, was 1574/1622).
> - Every header is 64 px and level with its row. At 390 the routine header wraps as before (142 px,
>   chips on a 326 px row).
> - The title box is 124.42 px, equal to its text, with no truncation at 960/1440/1920.
> - At 2560 the chips fit and sit right-aligned (first chip 216 px in).
> - The hide-done toggle flipped true → false → true by plain `playwright-cli click`, left as found.
> - *Open* navigated to `/routine-todo-list`.
> - The chip region takes focus, and ArrowRight scrolls it.
> - A 1440 element screenshot looks right. Console 0 errors, typecheck exit 0, eslint clean.
> **Not verified:** an account with more or fewer periods than the seed's four. The shape is
> count-independent by construction, and that is the claim, not a measurement.

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

## F14. Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path
> ✅ **FIXED 2026-09-23.** Two repos, in order: `vue_framework` `a29135a`, then the app `baf167ac`,
> which carries the pointer bump.
> **The data fix as written:** the three nav entries use the family paths
> (`/activity-tracking/{desktop,android}/settings`, `/activity-settings`). Two redirect routes send the
> tracking parents to `…/distinctEntries`. `useBreadcrumbs.ts` and `matchesPath` are untouched, as *Do
> not change* asks. `useSetBreadcrumbExtra` was not added, since it is optional.
> **The framework half the body did not foresee.** The body's sidebar claim rests on
> `SidebarNavItem.vue:52`, but that only decides **top-level** items. Children of a group are decided by
> `SidebarNavGroup.isChildActive`. It suppressed a child whenever *any* sibling prefix-matched the
> route, without comparing lengths. The measurement, with the data fix applied:
> - Every crumb was already right.
> - `/activity-settings/*` highlighted correctly (a top-level item).
> - The tracking-settings tabs highlighted **nothing**, `distinctEntries` included, which the literal
>   path used to highlight through the exact match. So the data fix alone was a regression on that tab.
>
> The fix makes a sibling suppress only when it is **longer** (longest prefix wins, `useBreadcrumbs`'
> rule). It is generic and default-preserving: it changes only the cases where nothing was
> highlighted. Documented in `src/_common/docs/composables.md` → *Active state and breadcrumbs:
> longest prefix wins*, in the same framework commit. That differs from the matcher change *Do not
> change* forbids: it is the group's sibling rule, not `matchesPath`, and it needs no
> `MenuItem.routeName` design.
> **Verified** with a dedicated `playwright-cli` session (`-s=f14`) at 1440×900, reading the rendered
> `.v-breadcrumbs` and every `.v-list-item--active` in the drawer:
> - **All tracking-settings tabs** (the family path, `distinctEntries`, `mappings`, a bogus value, desktop
>   and android): crumb *Home › Desktop settings* / *Android settings*, highlight *Web tracking ›
>   Desktop settings* / *Android settings*.
> - **`/activity-settings`, `/roles`, `/categories`:** *Home › Activity settings*, and *Activity settings*
>   highlighted.
> - **Unchanged elsewhere:** the three dashboards, `/day-planner`, `/day-planner/settings`, and the
>   `/activity-history` summary, calendar and detail pages.
> - **Also fixed:** `/day-planner/templates/14001` now highlights *Day planner - template*. With the
>   framework half stashed it measured **empty** (the same stash run also showed the Mappings tab empty).
> - Console 0 errors, typecheck exit 0, eslint clean on both app files.
> `_routes.md` updated: 56 records, the two new redirect rows, nav columns, the *Structural notes*
> redirect line, and the tracker (unit 6 → 4, total 55).
> **Found, not fixed (pre-existing, not caused by this):** `/activity-history/manual` highlights both
> *History › Summary* and *Record activity › Manually*. Summary's `/activity-history` prefix-matches it
> from a **different** group, and the sibling rule cannot see across groups. That needs a tree-wide
> longest match in the framework. It is left for a batch of its own.
> **Not verified:** a signed-out visit to a family path (it redirects before the auth guard's
> `?redirect=`, a standard vue-router redirect).

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

## F19. Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it
> ✅ **FIXED 2026-09-23** (`9e93fda5`; the CLAUDE.md importers row is in the working tree). Done as the
> body prescribes, both halves asymmetric, as the server is:
> - **DTOs:** `Role`/`Category` parse `usageCount = 0`, `canDelete = true`.
> - **Roles:** a custom `#actions` slot. A disabled trash button, inside the wrapper `VTooltip`, with an
>   `aria-label` naming **which** refusal applies: a new `roleDeleteBlockedSystem` key for `systemKey`
>   roles and `roleDeleteBlockedInUse` with the count for in-use roles.
>   `activities.archive.deleteBlocked` was **not** reused, because it tells the user to archive, and
>   roles have no archive. An allowed delete gets an unconditional `useDialog().confirm()`, not
>   `useDeleteConfirmation`, as *Do not change* says.
> - **Categories:** delete is never disabled. `shouldConfirm({ cascades: usageCount > 0 })`, with the
>   count in the dialog's `detail`: *"Activities in this category: {count}. They are kept, but lose
>   their category."*
> - **Plurals:** the copy follows the app's existing "Label: {count}." convention (`deleteCascade`,
>   `templateDelete.cascade`), which sidesteps SK plural forms. There are no `pluralRules` in the app.
> - **`@onDelete`** was removed from both `BasicTable`s, so the raw-id dialog (`B8`) is gone.
> - **`ActivityTable`'s trash** gained `:aria-label` (`A1`) before the slot was copied.
> - **409 race fallback:** left to the interceptor. `FW24`'s parser exists, and no private one was
>   built.
>
> **Verified** with a dedicated `playwright-cli` session (`-s=f19`). The mutations were run on throwaway
> rows created through the API (role `11105`, category `11602`, activity `12103` in it), never on
> fixture rows.
> - **Roles tab:** all three system roles are disabled with *"The app itself uses this role…"*. Work,
>   Health & Fitness and Hobbies & Leisure are disabled with *"Activities with this role: 10 / 12 / 6…"*.
>   Only the unused throwaway is enabled. Hovering a disabled one shows exactly **one** tooltip.
>   Deleting the throwaway gives a dialog naming it (*"…delete F19-tmp role?"*, not an id). It
>   **closes** after Confirm, the API answers `DELETE /activity-role/11105` **204**, and the row is gone.
> - **Categories tab:** every trash button is enabled, `title="Delete"`.
>   - *Errands:* the dialog reads *"…Activities in this category: 10. They are kept, but lose their
>     category."* Cancel closes it with **no** DELETE sent.
>   - *The throwaway:* the dialog shows count 1. Confirm → closes → **204** → row gone. `GET
>     /activity/12103` → 200 with `category: null` and role *Work* intact, which is the SetNull path end
>     to end.
> - **Activities tab (A1):** trash buttons carry an `aria-label` and no `title`. Hovering one shows a
>   single tooltip. `getByRole('button', { name: 'Delete' })` resolved on the throwaway row, and deleting
>   it through the UI was the cleanup: all three throwaways answer 404 afterwards.
> - Typecheck exit 0, eslint clean on `src/core/activity/`.
>
> **Not verified:** the SK copy on screen (the account is EN; SK strings reviewed in source only). The
> 409 race path (an activity gaining the role between grid load and delete). The category delete under
> `askBeforeDelete: false` with `usageCount 0`, which deletes without a dialog by the composable's rule;
> the seed account has the preference on. *The "BasicTable dialog suspected of never closing" row the
> body cites was not found under Needs verification* (already gone). The new dialogs were measured
> closing either way.

- **Scope:** app-side `src/core/activity/dto/response/Role.ts`, `Category.ts`,
  `src/core/activity/component/activityRole/ActivityRoleTable.vue`,
  `activityCategory/ActivityCategoryTable.vue`, `ActivityTable.vue:121-137`; plus one row in CLAUDE.md's
  *sanctioned cross-module imports* table
- **Closes:** `activity-settings/B7`, `activity-settings/A1`, **`activity-settings/B8`** (thirteenth
  pass — the generic dialog reads *"Are you sure you want to delete 4?"* because neither table passes
  `deleteConfirmationColumn`; this batch replaces that dialog with `useDialog().confirm()`, so the raw
  id goes with it. **If a fixing session keeps `BasicTable`'s built-in dialog for either table**, the
  one-attribute alternative is `deleteConfirmationColumn="name"` — do one or the other, not neither).
  **`U2` is now browser-confirmed** (mutation round 2): Delete → Confirm on the *Planner task* system
  role → `409`, row kept, message hidden behind the generic string — which is `FW19`.
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
       generic `BasicTable` dialog cannot express (retired Escalation §2, in the log, is the same gap seen from
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
- **Since 2026-09-21 the role 409 can be told apart at last, and this batch does not depend on it.**
  `B18` put `errorType` on the wire, and `DELETE /api/activity-role/{id}` is the pair the backend built
  it for: a system role answers `Conflict` (the server's own message, meant to be shown), an in-use role
  answers `DbForeignKeyError`. This batch's `canDelete` gate is pre-flight and still the right shape —
  the 409 is only the race fallback. If `FW24` has landed by the time this is fixed, that fallback can
  name which of the two happened; if not, leave it generic and do not build a private parser for it.
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

## F23. Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens
> ✅ **FIXED 2026-09-23**, docs only, uncommitted with the rest of the queue's docs. Nothing in `src/`.
> Checked against the current text first: CLAUDE.md had since grown the *"a state file is single-use"*
> paragraph (the same rotation, one session loading an unsaved file twice), but none of this batch's four
> points had landed.
> - **`prompts/view-docs/README.md` → *Parallelism*:** the sentence that told every parallel agent to
>   `state-load` the shared file is replaced by three separate questions:
>   - *Which browser?* `-s=<unit-name>` on every command, unconditionally.
>   - *Which sign-in?* One signed-in state per concurrent session. Load the file into one session only;
>     the rest use the form, under the 5/min login limit.
>   - *Am I the only mutating session?* A vanished row means suspect a reseed first.
> - **`PROMPT-TEMPLATE.md`:** hard constraint 2 makes `-s=<unit-name>` mandatory on every command,
>   including `close`, names the three questions, and says to use the form if another agent may hold the
>   state file. The cleanup bullet gains the reverse hazard: a row you created vanishing mid-pass → suspect
>   another agent's reseed.
> - **CLAUDE.md:** the 401-burst paragraph gains *"a 401 on `POST /api/auth/refresh` itself is not that
>   burst"*. A *Name your session* paragraph follows the examples. The examples themselves were left
>   without `-s=` and the paragraph says so: adding it to about fifteen command lines would bury the
>   sequence they teach.
>
> **Verified:** read-through only, as the batch specifies. The proof is the next parallel run keeping
> every session. Today's own sessions (`-s=f1` … `-s=f19`, form sign-in because a `trivial` session was
> live) ran alongside another agent without a single lost session. That is consistent, but not a test.

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

## FW24. `B18` landed and nothing on this side reads it — four different 409s still share one sentence, and today that sentence is the server's English DB prose

> ✅ **FIXED 2026-09-23 — verified live; the code itself had landed two days earlier without the queue
> knowing.** Items 1–5 below shipped as `vue_framework` `4ab7e61` on 2026-09-21 (the same commit as
> `FW19`'s message precedence, as the ordering note asked), and reached the app with the pointer bump in
> `adaae452` (B19's frontend half), which never mentioned it. `8512d67` / `60a3930` later extended the
> same resolver for B21/B25 (the lockout countdown, the 2FA 401s). What was left was the verification,
> run 2026-09-23 through the real `API` instance on `:3000` against the live API, reading the rendered
> snackbar:
>
> | case | `errorType` | snackbar |
> | --- | --- | --- |
> | `DELETE /activity-role/4` (system) | `Conflict` | the server's own sentence (*"This is a system role … You can rename it instead."*) |
> | `DELETE /activity-role/11001` (9 activities) | `DbForeignKeyError` | *"This record cannot be removed because other records still refer to it. Remove or move them first."* |
> | duplicate routine time period *Daily*/1 | `DbUniqueViolationError` | *"A record with this value already exists. Choose another."* — the raw *"Unique constraint violation during Create"* no longer reaches the screen |
> | duplicate desktop mapping `SteamLauncher.exe` | `DbUniqueViolationError` + `errors.patterns` | **failed at first** — see below; after the fix, *"You already have a mapping for ProcessName 'SteamLauncher.exe'."* |
> | `GET /activity/999999999` | *(absent)* | *"The requested item was not found."* — fallback unchanged |
> | `handleHttpCodes(409)`, `(409, 'SomethingNew')` | — | the old refresh sentence, both — an absent or unknown type is indistinguishable from before |
>
> **The one verification that failed, and the fix (`vue_framework` `bc96068`).** The desktop-mapping pair
> exists precisely to check that the typed wording does not swallow a per-field map — and it did: the
> endpoint's authored `errors.patterns` sentence was replaced by the generic unique-violation one. Read
> against the API: the CRUD bases forward a DB `Result` through an unkeyed `AddError` (→ `generalErrors`),
> and only endpoint code keys an entry (`MappingPatternUniquenessExtensions` adds a `ValidationFailure`
> on `"Patterns"`). So a **keyed** entry is never persistence prose, and the distinction needs no
> word-matching. `extractTypedErrorDetails` now also returns `fieldMessage` — the first entry under any
> key but `generalErrors` — and the three DB-derived types show it when present. Docs in `composables.md`
> and `api.md`. Typecheck 0; no rows created (four time periods before and after, both role deletes
> refused by the server).
>
> **Left as it is, worth knowing:** the in-use role delete's server sentence is authored and better than
> ours (*"9 activities are still filed under this role … Move them to another role first."*), but it is
> in `generalErrors`, so the client cannot tell it from DB prose and shows the generic FK sentence. That
> is the contract as designed (the framework comment says an endpoint with something better to say
> should send `Conflict` — or, now, key it to a field); it is a one-line backend change if anyone wants
> the count on screen, not a frontend defect. `DbConcurrencyError` stays wired and untested — still no
> request DTO carries a row version. `F85` is now unblocked.

- **Scope:** **framework** — `src/_common/composable/general/ErrorHandlingFunctions.ts` (the whole file
  is 45 lines and switches on one `number`), `src/_common/axiosConfig.ts:220-250` (the interceptor's own
  status switch), `src/_common/i18n/` locale keys under `httpErrors.*`, and
  `src/_common/docs/composables.md`. Submodule commit **then** pointer bump — never one commit.
- **Closes:** escalation §7's frontend half. No unit finding is filed against it, because no unit could
  see it: the distinction did not exist on the wire until 2026-09-21.
- **Root cause:** the API now sends `errorType` on every error body it authors — the `ResultErrorType`
  member name as a plain PascalCase string (`DbUniqueViolationError`, `DbForeignKeyError`,
  `DbConcurrencyError`, `Conflict`; on 403 `EmailNotConfirmed`, `UserLockedOut`). Landed as
  `AdhdTimeOrganizer` `cd0a252`, purely additive: the field is **absent**, not null, when the server has
  nothing better than the status. Nothing on this side reads it. `handleHttpCodes(statusCode: number)`
  takes only a number — it cannot read it without a signature change — and the interceptor's `case
  Conflict` is `showErrorSnackbar(serverMessage ?? t('httpErrors.conflict'))`.
- **The user-facing symptom is not the one escalation §7 describes, and this is the more embarrassing
  version.** §7 says a unique-index 409 tells the user *"This record was changed by someone else.
  Refresh the page and try again."* That is true only of the `handleHttpCodes` path (a call site that
  opted out with `_silent` and then routed the status back through it). On the **default** path the
  interceptor prefers `serverMessage`, and for a DB-derived 409 that is the API's internal prose —
  *"Unique constraint violation during Create"* — shown verbatim, in English, in a Slovak UI. Wrong
  sentence either way; unlocalized developer text on the path that fires most often.
- **What to change:**
  1. Give `handleHttpCodes` an optional second parameter (`errorType?: string`) and a per-type branch
     under `409` and `403`. **Optional, with the current sentence as the fallback** — every other app on
     this framework, and every older API, must keep working untouched (CLAUDE.md's rule 2 for framework
     edits). Add an `extractServerErrorType(error)` helper beside `extractServerMessage` in
     `axiosConfig.ts`, in the same shape (typeof-guarded, `undefined` when absent).
  2. Four new `httpErrors.*` keys with the wordings the backend spelled out: unique → *pick another
     value*; FK → *remove or move what still depends on this first*; concurrency → today's refresh
     sentence; business `Conflict` → **show the server's own message**, which is authored for the user.
     SK primary, EN alongside.
  3. In the interceptor's 409 branch, prefer the typed wording over `serverMessage` for the three
     DB-derived types and keep `serverMessage` for `Conflict`. That is the one behaviour change to state
     plainly in the commit message: today's raw *"Unique constraint violation during Create"* stops
     reaching users.
  4. `403`: branch `EmailNotConfirmed` / `UserLockedOut` behind the same fallback. `auth/B6` was solved
     another way and this does not reopen it — it stops the *next* consumer having to.
  5. Update `src/_common/docs/composables.md` in the same commit (rule 3).
- **Do not change:** the status codes anything maps to; `extractServerMessage`'s precedence — that is
  **`FW19`**, a different cause (a 400's `errors` map never being reached) that happens to live in the
  same two files. Keep them as two batches and land them in one framework commit; do not fold `FW19`'s
  reordering into this one and call it done. Do not touch the app-side call sites — that is `F85`, after
  the pointer bump.
- **Verification:** two live 409s, both named by the backend as the clean pair:
  `DELETE /api/activity-role/{id}` on a **system** role → `errorType: "Conflict"`, and on a role that
  still has activities → `errorType: "DbForeignKeyError"`. Same status, same endpoint, two different
  sentences on screen. Then a duplicate routine time period (`DbUniqueViolationError`), a duplicate
  desktop mapping pattern (`POST …/tracker-desktop-mapping-by-pattern` — also `DbUniqueViolationError`,
  but **with** an `errors["Patterns"]` map; the backend's 2026-09-21 follow-up named it as the second
  concrete pair, and it checks that the typed wording does not swallow a per-field map when one is
  present), and one request against an endpoint that sends no `errorType` at all (any `Send.NotFoundAsync` 404) to confirm the
  fallback. `DbConcurrencyError` **cannot be produced today** — no request DTO carries a row version, so
  no endpoint can detect a stale write; wire the branch, do not try to test it.
- **Risk:** Medium, and entirely in the other direction from usual: this ships to every app on
  `vue_framework`, and an app whose API does not send `errorType` must see no change at all. The
  fallback is the whole safety property — write the branch so an absent field is indistinguishable from
  today.

## FW19. `extractServerMessage` prefers the generic `message` over the specific `errors` — every validation snackbar in the app reads "One or more errors occurred!"

> ✅ **FIXED 2026-09-23 — verified live; the code had landed 2026-09-21 unrecorded.** The order swap
> shipped in `vue_framework` `4ab7e61`, the same commit as `FW24` (as the ordering note asked), and reached
> the app with the pointer bump in `adaae452`. `extractServerMessage` now reads the `errors` map first,
> then `detail`, then `message`. Verified through the real `API` instance on `:3000`, reading the
> rendered snackbar:
>
> - `PUT /activity-role/11001` with `color: "not-a-colour"` → 400, snackbar *"Color must be a palette
>   name: cyan, gold, …"* (the `errors.color` entry). The row was untouched: the validator refuses before
>   any write.
> - `POST /routine-time-period` with `lengthInDays: 0` → 400, snackbar *"'length In Days' must be between
>   1 and 365. You entered 0."*, the first of two map entries.
> - `DELETE /activity-role/4` (system role) → 409, snackbar is the `errors.generalErrors` sentence
>   (*"This is a system role … You can rename it instead."*). This is `B9`'s second verification case,
>   run during `FW24`'s pass.
>
> In none of the three did *"One or more errors occurred!"* reach the screen. **Not verified live:** the
> 500-with-`errorId` case. No request produces one on demand. Checked in source instead: the 500 branch
> still requires `extractServerErrorId` before it quotes the body, and a 500 body carries no `errors` map,
> so the swap cannot change what it reads.

- **Scope:** **[framework]** `src/_common/axiosConfig.ts:86-101` — submodule commit, then pointer bump
- **Closes:** `activity-settings/B9`
- **Root cause (source-verified):** `extractServerMessage` returns on the first non-empty of `data`
  (string) → `detail` → **`message`** → `errors[first list][0]`. FastEndpoints' validation shape is
  `{ statusCode, message: "One or more errors occurred!", errors: { field: ["…"] } }` — `message` is
  always present and always generic, so the `errors` branch is unreachable against this API. The
  mutation pass read two real messages the user never saw: `errors.color` → *"Color must be a valid hex
  color code…"* (§11) and, on the system-role delete, `errors.generalErrors` → *"This is a system role
  the app files quick-created activities under, so it cannot be deleted. You can rename it instead."*
  The same function feeds `useRequestState.run`'s `error.value` (`useRequestState.ts:47-48`), so every
  composable's error string is generic too. `todo-routine/B9`'s per-call-site `_silent` workaround exists
  partly because of this.
- **Files:** `src/_common/axiosConfig.ts:86-101`; `src/_common/docs/api.md` if it documents the
  extraction order
- **What to change:** Try `errors` **before** `message`: if `errors` yields a string, return it;
  otherwise `detail`, then `message`. Keep the 500 branch's `errorId` handling as is — it reads
  `message` deliberately (`:239-249`) and a 500 body has no `errors`. Consider a field-aware variant
  (`"<field>: <text>"`) only if another app wants it; this batch is the order swap.
- **Do not change:** `handleHttpCodes` (`ErrorHandlingFunctions.ts`) — it never reads the body and
  is not this bug; escalation §7's "carry the error *type*" ask is the separate improvement.
- **Verification:** `B9`'s `Verify:` block — trigger the role-colour 400 (until §11 lands it is one
  click away) and the system-role 409; both snackbars show the specific text. Then a 500 with an
  `errorId` still shows the id.
- **Risk:** Low, but framework-wide: every app on a backend whose `errors` map holds technical strings
  will now surface them. On this backend they are authored prose; say so in the commit.

## F85. The two `_silent` 409 workarounds can read the type now — but `B18`'s own note about deleting them is wrong

> ✅ **FIXED 2026-09-23 — verified live; the code had landed 2026-09-21 unrecorded**, in `adaae452`
> (B19's frontend half), the same commit that bumped the pointer past `FW24`. Both conditions are
> exactly what *What to change* asks for: `TimePeriodForm.onConfirm` words a 409 inline only when
> `errorType === ServerErrorType.DbUniqueViolationError`, and `RoutineSettingsView.onDelete` calls
> `showDeleteBlocked` only on `ServerErrorType.DbForeignKeyError`. Anything else goes to
> `handleHttpCodes(status, errorType)`. Both still pass `_silent`, and `useDeleteConfirmation` was not
> touched. Verified on `/routine-settings` with `playwright-cli`:
>
> - **Name clash.** Opened *Add time period* and filled *F85 race* / 14 days. Then, from outside the
>   dialog, created a period *F85 race* / 21 days through the API, so the form's name/length checks,
>   which work off the list loaded with the page, could not see it. *Create* → `POST` 409 → the dialog
>   **stayed open** with the typed values and the inline *"Another period already uses this name or this
>   length — both must be unique."* No snackbar.
> - **Length clash.** In the same dialog, changed to *F85 other* / 21 days → `POST` 409 → same result.
> - **Blocked delete.** *Delete* on *Daily*, then *Confirm* → `DELETE /routine-time-period/5` 409 →
>   `GET …/grouped-by-time-period` → snackbar *"Can't delete "Daily" — 5 routines are still assigned to
>   it. Move or delete them first."* The row stayed.
> - The race row (id 24) was deleted afterwards. The account is back to its four fixture periods.
>
> **Two notes on the batch's own wording.** (1) Its verification says *"a message naming the right
> field"*. The message names **both** fields, and it cannot do better: the 409 body is
> `errors.generalErrors: ["Unique constraint violation during Create"]` with no keyed entry, so nothing
> says which index refused. The pre-flight rules already give the field-specific message for every case
> except a race. (2) It says *"the remove-these-first dialog, not a snackbar"*. `todo-routine/B9`'s fix
> was always a **snackbar** with the count (`deleteBlocked`). The requirement that mattered is that the
> specific sentence shows instead of the generic 409 one, and it does. **Not producible live:** the
> fall-through (a 409 of another type at either site). No endpoint here sends one. It is one `else`
> branch, read in source.

- **Scope:** app-side `src/core/todoList/component/routine/dialog/TimePeriodForm.vue:160-175`,
  `src/core/todoList/view/RoutineSettingsView.vue:175-191`
- **Closes:** escalation §7's app half. The two findings behind those call sites (`todo-routine/B9`,
  `B11`) are already `fixed`; this is their follow-on, not a reopening.
- ~~**Blocked on `FW24`**~~ — **unblocked 2026-09-23**: `FW24` is in the pointer and verified live.
  `extractServerErrorType(error)` gives the condition; `ServerErrorType.*` gives the constants to compare
  against. Note for `TimePeriodForm`: a duplicate time period's body carries **no** field-keyed entry
  (`errors.generalErrors: ["Unique constraint violation during Create"]`), so which field clashed is
  still the form's to work out, as it is today.
- **Root cause:** both sites opted out of the interceptor (`_silent: true`) and worded the 409
  themselves, because a status code was the only thing either could see. With `errorType` on the wire
  they can tell *which* 409 they got, which is the one thing both comments say they cannot.
- **`B18`'s "what changes on the frontend" list is wrong twice, and a fixing session following it would
  regress two things.** Read against the source this pass:
  - *"Delete the two `_silent` + call-site wordings."* **No.** `TimePeriodForm.onConfirm` sets
    `conflictError` and **returns without closing the dialog**, so the user keeps everything they typed
    and sees the message against the form. An interceptor snackbar cannot do that, and the dialog
    closing before the message arrives is the exact defect `todo-routine/B11` fixed. Keep `_silent`,
    keep the inline error; what changes is only the **condition** — `errorType ===
    'DbUniqueViolationError'` rather than `status === 409`, so a concurrency 409 stops being worded as
    a name collision.
  - *"`useDeleteConfirmation` can stop guessing about FK refusals it cannot see."* **It never guessed.**
    `src/core/user/composable/useDeleteConfirmation.ts` is 45 lines of pre-flight policy
    (`resolveDelete({cascades, undoable})`); it runs *before* the request and never sees a response, so
    there is nothing in it to change. The post-hoc FK handling lives at the call sites —
    `RoutineSettingsView.showDeleteBlocked` is the one that exists.
- **What to change:** in `RoutineSettingsView.onDelete`, branch `showDeleteBlocked` on `errorType ===
  'DbForeignKeyError'` instead of bare `status === 409`, and let anything else fall through to
  `handleHttpCodes` (which by then words the rest correctly). In `TimePeriodForm.onConfirm`, the same
  narrowing for `DbUniqueViolationError`. Both are one condition each.
- **Also worth a line, not a batch:** `F19` gives the roles table a pre-flight `canDelete` gate, so its
  409 becomes a race fallback only — but the pair the backend built this field for is exactly that
  endpoint (system role → `Conflict`, in-use role → `DbForeignKeyError`). If `F19` lands **after**
  `FW24`, its fallback can say which one happened instead of showing the generic sentence; if it lands
  before, nothing is lost. Do not hold either for the other.
- **Verification:** duplicate an existing routine time period's name and its `lengthInDays` in two
  separate attempts — the dialog stays open both times with a message naming the right field. Then
  delete a time period that still has routines: the *"remove these first"* dialog, not a snackbar.
- **Risk:** None beyond the sequencing. If it lands before the pointer bump, `errorType` is `undefined`
  and both conditions are false, so both sites silently stop handling the 409 they handle today — which
  is why this is blocked rather than merely ordered.

## FW18. `useEntityQuery.fetchById` cancels a sibling id — the 2026-09-11 `useFetchFiltered` bug, one helper over

> ✅ **FIXED 2026-09-23** (`vue_framework` `a939450`, bump `027a8ec0`). Landed **before** `F50`, so
> `F50` never carried the interim workaround and `A1`'s workaround table did not grow. As written:
> `fetchById(id, requestConfig?, options?)` and `fetchByField(…, requestConfig?, options?)` take
> `EntityQueryOptions` = `{ requestKey?: string | number }`. There is one `Map` of controllers per method,
> a module-level `Symbol` default key and identity-guarded cleanup in `finally`, through one private
> `runKeyed` helper both methods share. The default is **not** the id, as the body requires.
> `fetchAll` / `fetchSelectOptions` are unchanged. `docs/api.md` documents the option and amends the
> `useFetchFiltered` sibling note. The pointer-bump commit rewrites `A1`'s trap and the CLAUDE.md
> `useEntityQuery` bullet.
> **Verified:** new `src/_common/api/useEntityQuery.test.ts` (4 tests, passing). Distinct keys → both
> resolve. No key → the second `fetchById` cancels the first even for another id. Same key → only that
> key's previous call is cancelled. `fetchByField` is keyed on its own controllers. App-level: `F50`'s
> `requests` check, below. `vue-tsc --build --force` exit 0, `npm run lint` clean. The `src/` sweep
> for concurrent `fetchById`/`fetchByField` found only the dialog (`TodoListView.vue:332` was checked, and
> it is a single call in a `.then`, not a fan-out).
> **Not verified:** that the map is empty after both settle. That is not observable without exposing
> internals, and a test for it would pass even without the cleanup (aborting a settled controller is a
> no-op), so none was written. The cleanup is the line-for-line `useFetchFiltered` shape.

- **Scope:** **[framework]** `src/_common/api/useEntityQuery.ts`, `src/_common/docs/api.md`
  (submodule commit + pointer bump); app-side in the pointer-bump commit: `prompts/_common/api/A1-request-key-for-sibling-fetch-helpers.md:129-131`
  and CLAUDE.md's `_common/api/` bullet
- **Closes:** the framework half of `planner-templates/X1` (`F50` is the app half; `X1` itself closes
  when the dialog renders, which `F50` achieves without this)
- **Root cause:** `useEntityQuery.ts:29-42` — one `AbortController` per **method**, `fetchById` calls
  `fetchByIdController?.abort()` before every request regardless of the id. That is right for a detail
  view switching ids (latest wins) and wrong for two ids fetched concurrently from one instance: the
  first rejects with `CanceledError`, and `Promise.all` over the pair rejects — exactly the shape
  `useFetchFiltered` had until 2026-09-11 and now documents in its own `requestKey` doc-comment
  (`useFetchFiltered.ts:15-40`, which even uses "a fan-out over ids" as its example). **Two documents
  say this helper does not have the problem, and both are wrong** (*Contradictions* §85):
  `prompts/_common/api/A1:129-131` — *"Do not add `requestKey` to `useEntityQuery`. It already holds
  a separate controller per method … which is the same idea expressed differently"* — conflates
  per-method with per-call, and CLAUDE.md's `_common/api/` bullet lists the three filtered helpers as
  the ones that "still hold a single controller per instance" and omits this one. The unit's finding
  cites *"CLAUDE.md's own documented gotcha"* for `useEntityQuery`; CLAUDE.md documents no such thing,
  which is how a component written after the `useFetchFiltered` fix reintroduced the bug — the author
  was told this helper was safe.
- **Files:** `useEntityQuery.ts:29-42` (`fetchById`; `fetchByField` `:44-59` is the same shape and
  should take the same option — `fetchAll`/`fetchSelectOptions` take no id and are genuinely
  latest-wins), `src/_common/docs/api.md`; `A1:129-131`; CLAUDE.md `_common/api/` bullet
- **What to change:** **Additive, default-preserving — not a semantics change (rule 4 does not bite).**
  Copy `useFetchFiltered.ts:13,47,54-58,71-76` — a module-level `Symbol` default key, a `Map<key,
  AbortController>`, an optional third argument `{ requestKey }` on `fetchById` (and `fetchByField`),
  identity-guarded cleanup in `finally`. Omitting the key must reproduce today's abort-previous
  behaviour exactly, so every existing caller is untouched. **Do not key by `id` by default** — it
  looks like the obvious fix, but a detail view that switches ids fast today gets the stale response
  cancelled for free, and keyed-by-id it would get both responses in arrival order; that is a
  behaviour change every app would inherit, and it is what rule 4 exists for. Then: update
  `src/_common/docs/api.md` in the same submodule commit; in the pointer-bump commit, rewrite
  `A1:129-131` to say `useEntityQuery`'s per-method controllers are *latest-wins per method* and
  `fetchById`/`fetchByField` now take `requestKey` like the others, and add `useEntityQuery` to the
  CLAUDE.md bullet's list of helpers that abort their previous call. `F50`'s workaround comes out in
  the same pointer-bump commit.
- **Do not change:** the abort itself (`A1` constraint 3 — scope it, do not remove it);
  `useRequestState.run`'s cancellation re-throw (`:45`) — it is what lets a keyed caller tell a
  cancel from a failure, and `isRequestCanceled()` depends on it.
- **Verification:** unit-level in the framework: two `fetchById`s with distinct keys from one instance
  both resolve; two with the same key (or no key) — the first rejects with a cancel; the map is empty
  after both settle. App-level: `F50`'s `requests` check after the pointer bump, with the workaround
  removed. Grep `src/` for other `Promise.all([…fetchById` / `fetchByField` — this pass found only the
  dialog, but the check is cheap and it is the class, not the instance, that ships.
- **Risk:** Low — opt-in, and `useFetchFiltered` has carried the identical shape since 2026-09-11 with
  no regression. It does ship to every app on the framework; the `Symbol` default is what makes that
  safe.

## F50. The Compare Templates dialog is empty every time — two unkeyed fan-outs, and the finding's fix closes one

> ✅ **FIXED 2026-09-23** (`2bf99399`, after `FW18`'s bump `027a8ec0`, so with no interim workaround).
> All three edits: **(a)** both `fetchFiltered`s pass `{ requestKey: t.id }`. **(b)** both `fetchById`s
> pass `{ requestKey: id }` (the post-`FW18` form). **(c)** `:hasConfirmBtn="false"` (`B3`). The optional
> guard was taken too: `sides` resets to the empty pair on every open, the content renders only
> `v-else-if` both templates are loaded, and a `catch` stops the error escaping the watcher (the
> interceptor still toasts). A failed load now shows nothing rather than a nameless template with
> *0 tasks*.
> **Verified live** (`playwright-cli`, `/day-planner/templates`, *Home Office* vs *Office Day*): both
> panels show name, day-type chip, tags, `7:00 - 23:00 · 5 tasks` / `6:30 - 22:30 · 4 tasks` and a
> populated timeline. `requests` shows exactly two `GET /task-planner-day-template/{20001,20002}` and
> two `POST /template-planner-task/filter`, all 200, none `ERR_ABORTED`. Only *Cancel* renders. Cancel,
> then reopen with the same two ids: the same four requests, all 200, both panels populated.
> `console error` is empty.
> **Not verified:** the failure path (the empty dialog plus toast on a real 4xx/5xx). It was not
> provoked, and it is read from code only.

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplateComparisonDialog.vue`
- **Closes:** `planner-templates/X1`; folds **`planner-templates/B3`** (same file, one attribute — see
  below)
- **Root cause:** Confirmed in source. `TemplateComparisonDialog.vue:107-108` destructures one
  `useTaskPlannerDayTemplateTaskCrud()` and one `useTemplatePlannerTaskCrud()`, and the `watch(dialog)`
  at `:116-132` does two fan-outs from them: `:120` `Promise.all([fetchById(ids[0]), fetchById(ids[1])])`
  and `:121-124` `Promise.all([fetchFiltered(…t1…), fetchFiltered(…t2…)])`. Both helpers abort their
  own previous call — `useEntityQuery.ts:35` unconditionally (`fetchByIdController?.abort()`, one
  controller per *method*, so a second id cancels the first), and `useFetchFiltered.ts:54-56` per
  `requestKey`, defaulting to one shared key when none is passed — so in each pair the first promise
  rejects with `CanceledError`, `Promise.all` rejects, `run()` re-throws cancellations by design
  (`useRequestState.ts:45`), and the `try … finally` at `:119-131` never reaches `sides.value = …`.
  The two-null default renders the `:00 - :00 · 0 tasks` the unit photographed. **The finding sees
  only the first pair.** Its suggested fix — key or split the two `fetchById`s — makes `:120` resolve
  and moves the identical failure to `:122`; the dialog stays empty and the console shows the same
  error one line down. `TemplateListView.vue:315-326`, in this module, already documents and uses the
  `requestKey: t.id` form for exactly this fan-out.
- **`B3`, same file:** `:6` passes `:showConfirmBtn="false"`; `MyDialog`'s prop is `hasConfirmBtn`
  (`MyDialog.vue:94,110`), so the attribute lands in `$attrs` and a live *Confirm* renders that emits
  `confirmed` to nobody. The other seven call sites in `src/` spell it correctly — one typo, not a
  class.
- **Files:** `TemplateComparisonDialog.vue:6` (`B3`), `:107-108`, `:116-132`
- **What to change:** Three edits. **(a)** `:121-124` — pass `{ requestKey: t1.id }` / `{ requestKey:
  t2.id }` as the third argument, the form `TemplateListView.vue:326` uses; the keyed API exists today.
  **(b)** `:120` — until `FW18` lands, either `await` the two `fetchById`s sequentially (one extra
  round trip inside a dialog that already shows a spinner) or take a second
  `useTaskPlannerDayTemplateTaskCrud()` instance for the right-hand side **with a comment naming the
  cause** in the `aborts its previous` wording `prompts/_common/api/A1` greps for, so that batch's
  Part 2 finds and retires it. After `FW18`: `fetchById(id, undefined, { requestKey: id })` and delete
  the workaround in the pointer-bump commit. **(c)** `:6` — `:hasConfirmBtn="false"`. Consider a
  `catch` that shows the interceptor's toast *and* keeps `sides` on the two-null default behind a
  `v-if="side.template"` guard, so a real failure reads as "nothing loaded" rather than as a template
  with no name and no tasks — the current empty-state markup is what made this look like data.
- **Do not change:** `useEntityQuery.ts` (that is `FW18`, a `vue_framework` commit); the
  `TemplatePlannerTaskFilter` window (`t.defaultWakeUpTime … defaultBedTime`) — the list view uses the
  same bounds.
- **Verification:** `X1`'s `Verify:` block — both panels show name, icon, chips and a populated
  timeline; **`playwright-cli requests` shows two `GET /task-planner-day-template/{id}` and two `POST
  /template-planner-task/filter`, none `ERR_ABORTED`** (a clean console proves nothing here —
  cancellations are not logged, `A1`'s *Traps*). Then `B3`'s: only *Cancel* renders. Open → Cancel →
  reopen with the *same* two ids, since the watcher refetches on every open.
- **Risk:** None beyond the dialog. If (b) takes the second-instance route, `A1`'s workaround table
  grows by one row until `FW18` retires it — say so in the commit.

## F52. Template card title row — the name never truncates, so the switch label and the chip pay for it

> ✅ **FIXED 2026-09-23.** The prescribed half landed **unannounced in `fcd8050d`** (the `F42` commit —
> its message does not mention it): `min-width: 0` on the left group, `text-truncate` + `:title` on the
> name, `flex-shrink-0` on the right group, `white-space: nowrap` on the switch label. Verified that half
> first and it met the pass condition (label on one line, *Weekend*/*Workday* whole on all three cards) —
> but the name was left **~44 px of a 368 px row**, `Re…` / `Ho…` / `Off…`. So the batch's optional step
> was taken too (uncommitted at time of writing): the switch lost its visible label and is named by
> `aria-label` = `planner.a11y.templateActive` (*"Active: {name}"* / *"Aktívna: {name}"* — state is the
> switch's own `checked`, so the name does not branch on it); `planner.template.activeLabel` /
> `inactiveLabel` had no other consumer and are deleted; the `.active-switch` nowrap rule went with them.
> **Verified live** at 1440×900: name width 95/98/94 px, *Office Day* whole, the others ellipsised with a
> `title`; chips unclipped; every title row a single 64 px line; the switch resolves as `checkbox
> "Active: Home Office" [checked]`. A 40-character name created through *Add Template* truncates at
> 144 of 392 px with the chip whole. `DayTypeChip` untouched.

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplateCard.vue`
- **Closes:** `planner-templates/B1`
- **Root cause:** Confirmed in source. `VCardTitle` (`:8`) is `d-flex justify-space-between
  align-center`; the left group (`:9-25`, checkbox + icon + `<span>{{ template.name }}</span>`) has no
  `min-width: 0` and no `text-truncate`, so it keeps its intrinsic width, and the right group
  (`:26-51`, `DayTypeChip` + `VSwitch` with an inline `label` + pin `VIconBtn`) absorbs the shortfall:
  the switch's label box collapses to ~20 px with `white-space: normal` (one letter per line) and the
  chip clips with `text-overflow: clip`. Vuetify's `VCardTitle` sets `white-space: nowrap` and
  `overflow: hidden` on itself, which is why the row clips rather than wraps. Three cards, three
  column widths — the unit measured it on all three.
- **Files:** `TemplateCard.vue:8-51`
- **What to change:** Make the *name* the flexible part: `min-width: 0` + `text-truncate` on the name
  span (with `:title="template.name"` so the full name is recoverable), and `flex-shrink-0` on the
  right-hand group so its three controls keep their intrinsic width. Then decide whether the switch
  needs a visible label at all — the row is already the busiest in the card, and `F56` is about to
  give the pin a name; a switch named by `aria-label` with the state shown by its own thumb is the
  usual Vuetify shape. If the label stays, `white-space: nowrap` on it as well. Do **not** solve it by
  fixing the card grid's column width — the chip count and the name length are both data-driven.
- **Do not change:** `DayTypeChip` — it is shared with the comparison dialog and the day view; the clip
  is the row's fault, not the chip's.
- **Verification:** `B1`'s `Verify:` block at 1440×900 — *Active*/*Inactive* on one line, *Weekend* and
  *Workday* whole (or an ellipsis + tooltip). Add a template with a 40-character name through *Add
  Template* (`F53` makes that path safe) and confirm the *name* is what truncates.
- **Risk:** None — one row's CSS.

## F53. The template form mirrors none of the API's contract — a required enum is optional, and nothing else is checked either

> ✅ **FIXED 2026-09-23.** All of (a)–(c) landed **unannounced in `fcd8050d`** (the `F42` commit).
> **(a)** `suggestedForDayType: DayType = DayType.Workday`. **(b)** `requiredRule` on the name and the
> day-type select, both `hideDetails="auto"`; the length limits are a native `maxlength` (100 name,
> 500 description) rather than a rule — the framework's `RulesComposition` has no length rule, and a
> cap cannot be failed, so it is the smaller honest mirror. The icon's 50 is not mirrored: it comes from
> `IconPicker`'s list, never typed. It also fixed a second, unfiled cause of "validates nothing":
> `validateAndGetData()` tested `await form.validate()` for truthiness, and that resolves to an object —
> it reads `.valid` now. **(c)** taken: `TemplateDetailsForm` saves inside `onConfirm` under
> `setLoading`, closing only on success. This session added the missing `catch` (uncommitted at time of
> writing) — without it the rejection escaped `DialogEntryRenderer.onConfirmed` to Vue's error handler,
> a third console error; the leisure forms' `catch` is the precedent.
> **Verified live:** a blank *Add Template* shows *Workday*; an empty *Create* shows *This field is
> required* under the name, the dialog stays open and **no POST fires**; 120 typed characters land as
> 100; a 40-character create → one `POST` 201 → `/day-planner/templates/20004`. With the `PUT` routed to
> a 400 (`playwright-cli route`), *Update* leaves the dialog open with the edited name, spinner cleared,
> and the console shows only the network line and the interceptor's own log. The server's *real* 400
> body was not provoked — the client no longer lets one through.

- **Scope:** app-side `src/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts`,
  `src/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue`
- **Closes:** `planner-templates/B2`
- **Root cause:** Confirmed on both sides. The client DTO declares `suggestedForDayType?: DayType`
  (`TaskPlannerDayTemplateRequest.ts:14`) with no default, so a blank *Add Template* serialises without
  the key; the server's `TaskPlannerDayTemplateRequest.cs:29` is `public required DayType
  SuggestedForDayType`, and `System.Text.Json` rejects the body before validation runs — the
  `serializerErrors` 400 the unit quoted, surfaced by the interceptor as the server's generic title.
  **Wider than the finding:** the form (`TaskPlannerDayTemplateDetailsForm.vue:6-79`) declares no
  `:rules` on any field, so `validateAndGetData()`'s `form.validate()` (`:143`) is always `true`;
  `Name` is `[Required][StringLength(100)]`, `Description` `[StringLength(500)]`, `Icon`
  `[StringLength(50)]` on the server (`:11-19`), and an empty name or a 101-character one takes the
  same route — dialog closed, input gone, generic snackbar. *Duplicate* and *Edit* hide all of it
  because `fromEntity` copies a valid enum in. **Not a backend ask:** the column is non-nullable and
  indexed (`Initial.Designer.cs:1669,1701`), `/suggestions` matches on it, and every server-side
  fixture sets it — the field is required by design, and the client is the side that disagrees.
- **Files:** `TaskPlannerDayTemplateRequest.ts:14` (and `:8-19` generally),
  `TaskPlannerDayTemplateDetailsForm.vue:6-11` (name), `:30-36` (description), `:38-43` (day type),
  `:67-72` (icon)
- **What to change:** **(a)** `suggestedForDayType: DayType = DayType.Workday` (or whichever the owner
  wants as the blank-form default — the seed's three templates are two `Workday`, one `Weekend`), so
  the type stops lying and a blank form is a valid body. **(b)** Rules that mirror the contract:
  required + `maxLength(100)` on the name, `maxLength(500)` on the description, `maxLength(50)` on the
  icon, required on the day-type select — through `RulesComposition.ts` so the messages are the
  app's, not hand-written. `hideDetails` on every field means the messages need somewhere to render;
  drop it on the fields that gain a rule, or use `hideDetails="auto"`. **(c)** Optional but worth the
  look: the dialog closes on `dialogApi.close({ request })` (`TemplateDetailsForm.vue:32`) and the
  caller then calls the API (`TemplateListView.vue:337-352,371-402`), so *any* server rejection —
  a future 409 on a duplicate name, say — still costs the user their input. Moving `create`/`update`
  inside the dialog's `onConfirm` under `dialogApi.setLoading()` keeps the dialog open on failure.
  Check how the app's other `openDialog` consumers do it before diverging; if they all close-then-call,
  this is a pattern decision, not this batch's.
- **Do not change:** the server DTO; the `Time` defaults (`07:00`/`23:00`) — those already work.
- **Verification:** `B2`'s `Verify:` block — *Add Template*, name only, *Create*: **either** the select
  blocks with a required message and the dialog stays open, **or** the template is created with the
  default and the app lands on `/day-planner/templates/<newId>`; no 400, no *"One or more errors
  occurred!"*. Then an empty name → blocked in the dialog, not a 400. Confirm the list count went
  from 3 to 4 and reseed.
- **Risk:** Low. A default day type means a user who ignores the field gets `Workday` silently — the
  select shows it, and that is the trade the unit's own *Expected* offers.

## F57. The Scheduled Days picker is clipped to Mon–Fri in the 400 px template panel

> ✅ **FIXED 2026-09-23**, **unannounced in `fcd8050d`** (the `F42` commit). A `wrapping-day-picker`
> class on the `<DayOfWeekPicker>` tag, and a scoped rule — not the bare `flex-wrap` the batch named:
> the `VBtnToggle` has a fixed height its buttons fill, so a wrapped second row squeezed both rows into
> one row's height; the rule sets `height: auto` on the group and `min-height: 36px` on each button.
> **Deviation from "Do not change … the dialog branch":** the same class applies there, on purpose —
> beside the icon field, Sunday was clipped off the dialog's edge at 1440 px too.
> **Verified live:** `/day-planner/templates/<id>` panel (400 px) — all seven buttons on one row inside
> the card, *Sun* toggles active. *Edit Details* from the list — Mon–Fri on row one, Sat/Sun on row two,
> 36 px apart, no overlap, all inside the dialog; looks clean with `divided`. `DayOfWeekPicker.vue`
> untouched.

- **Scope:** app-side `src/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue`
- **Closes:** `planner-templates/P1`
- **Root cause:** Confirmed. `:77` renders the framework's `DayOfWeekPicker` — a `VBtnToggle` of
  seven `size="small"` buttons with `divided`, `display: inline-flex`, no wrap — inside a `div` in a
  `flex-column` group (`:63-66`, the non-dialog branch of `:65`). Seven small buttons plus dividers need more
  than the ~360 px the panel leaves after padding, and `VCard`'s `overflow: hidden` clips the rest.
  In the dialog (`isDialog`, `flex-md-row`) the same picker has the dialog's width and is fine — the
  400 px panel is the only place it renders narrow.
- **Files:** `TaskPlannerDayTemplateDetailsForm.vue:73-78` (the label + picker block); reference —
  `src/_common/component/inputs/DayOfWeekPicker.vue` (single root, so a class on the tag lands on the
  `VBtnToggle`)
- **What to change:** App-side, one class: `class="flex-wrap"` on the `<DayOfWeekPicker>` tag lets the
  toggle break onto a second row at this width (`divided`'s inner borders look odd across a wrap —
  drop `divided` via the picker if it becomes a prop, or accept it). Alternatively `density="compact"`
  / `size="x-small"` if the picker grows those props — but that is a `vue_framework` change for a
  400 px panel this app chose, and `F6`'s reasoning applies: the smaller, app-side edit first. If the
  owner would rather widen the panel, `F51` is the batch that touches the shell's width and this
  should ride with it.
- **Do not change:** `DayOfWeekPicker.vue` (framework) in this batch; the dialog branch.
- **Verification:** `P1`'s `Verify:` block on `/day-planner/templates/20001` — all seven day buttons
  visible and togglable; then *Edit Details* from the list to confirm the dialog's row is unchanged.
- **Risk:** None.

## F64. The picker treats an empty weather match set as "nothing fits" — the server's contract says it means "no opinion"

> ✅ **FIXED 2026-09-23**, in two halves. The second needed a backend change (API `e50bd3c`).
>
> **Exclusion half (as the body prescribes).** `fetchTodayFit` collapses an empty set to `null` at
> the boundary. The `leisureWeatherApi.ts` comment now describes the live endpoint (`P2`).
>
> **Badge half (`B1` round 2, pass condition 2; only the summary row claimed it).** Reading the API
> source showed it was worse than the finding guessed. `WeatherFitRule.MatchingCodes` puts `none`
> into **every** non-empty set on purpose, so on any day with a weather location every *None* row
> got *"Good weather for this today"* plus `WEATHER_MATCH_BONUS`. The client saw only ids. Option (b)
> was chosen: the backlog row now carries `weatherDependencyCode`, the server's effective code
> (`WeatherDependencyCodes.Effective`: the stored code, else a guess from the label, else `null`), on
> grid, GetById and GetAll. The client added a `WeatherDependencyCode` enum and
> `ActivityBacklogProfile.realWeatherDependencyId`, which is `null` for `none`, `null` or an unknown
> code. The picker's `CandidateFacts.weatherDependencyId` and `BacklogTable`'s badge read it, so
> `isEligible`, the bonus and both badges needed no change: they already skip `null`. The same edit
> closes an unfiled twin: a row with an unrecognised label used to be *excluded* on any day with
> weather, although the server's contract calls it "no opinion". The fit endpoint itself is unchanged.
>
> **Verified:** live on `/leisure/pick` at 60 min / *Just me*, *Read a Novel* renders against the
> real `200 []`. With the fit routed to `[5]` (its own *None* id, the server's real non-empty shape),
> the wire carries `"weatherDependencyCode":"none"` and the card renders with **no** weather chip.
> Earlier the same input badged it. `/leisure/backlog` under the same route shows no *Good for today*
> chip. There are no console errors. New unit test: `activityBacklogProfileWeatherCode.test.ts`
> (52/52 leisure tests pass). The e2e spec has both halves as passing tests (the round-1 `X2` fixme
> is now a real test, plus *a "None" weather dependency is never badged*). Type-check (exit 0), e2e
> typecheck and lint are clean.
>
> **Not verified:** a *real* dependency (sunny/dry/snow) still badging and excluding end to end. The
> seed has no such backlog row, and adding one is a seed change. That path is covered only by the
> unit test (`realWeatherDependencyId` passes the id through for `sunny`/`dry`/`snow`) and by the
> untouched `isEligible` tests. Not verified either: an account with a real weather location. Every
> non-empty set was routed.
>
> **Unrelated failure seen in the same run:** `Backlog › delete confirmation … does not close on
> Escape` now fails. FW1 step 1 (`8739d08f`, landed by another session during this one) made
> confirmations close on Escape, and the spec still asserts they do not. That belongs to FW1's owner.

- **Scope:** app-side `src/core/leisure/composable/useLeisurePicker.ts:250`,
  `src/core/leisure/api/leisureWeatherApi.ts:3-9` (comment)
- **Closes:** `leisure-backlog-picker/X2`, `P2`
- **Root cause:** `GET /leisure-weather-fit` answers `200 { matchingWeatherDependencyIds: [] }` for an
  account with no weather location — and its endpoint's own doc comment (`GetLeisureWeatherFitEndpoint.cs`)
  spells out the client's obligation: *"The client reads an empty set and a failed call identically
  ('no weather opinion'): nothing ranks up, no badge renders, nothing is excluded."* `useWeatherFit.ts`
  says the same in its header. `useLeisurePicker.ts:250` then does
  `weatherMatchIds: weatherFit.value?.matchingWeatherDependencyIds ?? null` — `[]` is not nullish, so
  `isEligible`'s backlog branch (`leisureScoring.ts:246-253`) sees a non-null list that contains no id and
  excludes **every** backlog entry with any `weatherDependencyId`, including the seed's one row whose
  dependency is the *"None"* lookup. `/leisure/pick`'s default landing state shows no backlog card at
  any time budget. `leisureWeatherApi.ts:3-9` meanwhile still says the endpoint is *"Not implemented
  server-side yet… Every call fails today"* — `P2`.
- **What to change:** Collapse the empty set to `null` **once**, at the boundary — in `fetchTodayFit`
  (return `null` when the array is empty) or in `WeatherFit.fromJson` — so every consumer, not just the
  picker, gets the contract (`fitsToday` already returns `false` for `null`, so the badge is unchanged).
  Rewrite the `leisureWeatherApi.ts` comment to describe the live endpoint and the empty-means-no-opinion
  rule.
- **Do not change:** `isEligible` — with a non-empty list it is correct, and a real mismatch must still
  exclude (`X2`'s *Verify* step 4).
- **Verification:** `X2`'s `Verify:` block — the seeded *Read a Novel* (45 min, 1 person) appears at
  ≥ 60 min / *Just me*; then `playwright-cli route "**/api/leisure-weather-fit"` fulfilled with an id
  that is *not* the row's dependency, and confirm it is excluded.
- **Risk:** None beyond deciding where the collapse lives; put it at the boundary so `O1`'s later
  `maxParticipants` work does not have to remember it.

## F27. History dashboards have no error state — three fetch owners null or keep their data on failure, and every panel says "No data for this period"

> ✅ **FIXED 2026-09-23** (`f42b3b3a`). The tracking shape, as prescribed. `useHistoryDashboard` holds
> one error flag per panel. Each fetcher resets its flag, and sets it in `catch` unless the error is a
> cancellation (`isRequestCanceled`). `checkFirstRunIfEmpty` returns early when any panel failed, so a
> failed round never asks the first-run question and cannot answer it `false`. The seven dashboard
> reads are `_silent`. `getSummarySummaryCards` takes a `silent` flag that defaults to `true`, and
> `getHasAnyHistoryEver` passes `false`, so the existence check still toasts. The summary cards, the pie
> section and both views' `StackedBarsChart` bind `:error`/`@retry`. `HistoryInsightsColumn` forwards
> both flags and two retries.
> **Decision (a), `_silent`:** adopted. The home widget's `getDetailPieChart` inherits it, and that is
> right: `ActivityHistoryWidget` has its own error state. The export's two uncapped reads inherit it
> too, and `useCsvExport` toasts its own `historyDashboard.export.error`.
> **Error component:** a sibling `HistoryErrorState.vue`, not an `error` variant of `HistoryEmptyState`.
> It has no `periodLabel`, because a failure has proved nothing about the period. The copy reuses
> `activityTracking.common.loadFailed`/`retry`, the same cross-module reuse the no-data string already
> makes.
> **Decision (b), calendar:** the error renders above `CalendarGrid` (the grid is untouched). `days` is
> cleared to `[]`, and a `lastRange` ref feeds Retry. The `getHasAnyHistoryEver` await after it now has
> its own `catch` too. It was a second unhandled-rejection path the batch did not name. The timeline
> clears `historyList` and shows the same state. **Not made `_silent`:** `/activity-history/filter`,
> because the detail export reads it and must toast, and `dashboard/calendar`, to match. Both still show
> the interceptor snackbar alongside their panel's state. Make the calendar silent if one surface is
> wanted there. **`HistoryInsights` needed no change:** it is `v-if="lines.length > 0"` over data that
> is `null` on failure, so it already hides.
> **Verified live** (`playwright-cli`, one session, 1440 × 900):
> - **`detail/pie-chart` → 500:** the pie panel shows *Failed to load* + *Retry*, with no snackbar and no
>   "No data". After `unroute` → *Retry*: **one** `pie-chart` request, 200, and the panel populates.
> - **`/activity-history/filter` → 500, then *Previous day* (22 → 21 Sep):** the timeline shows the error
>   state and none of the 22nd's rows. `console error` has no unhandled rejection. Retry recovers.
> - **`dashboard/calendar` → 500, then *Previous month*:** the error sits above an empty grid, with no
>   stale rows and no unhandled rejection. Retry refetches the same range; August 2026 is truly empty,
>   so it then reads `noActivityInRange`.
> - **`dashboard/summary/**` → 500 on a fresh load:** three panel error states, **no** first-run block
>   and no existence-check request. The insights card hides.
> - **Nothing routed, `date=2026-09-07`:** both panels read *No data for this period · 07.09.2026*.
> - `tracking-dashboards/U1`'s retest ran in the same session, as the queue asked (log → *Closed
>   verification items*).
> - Type-check exit 0; ESLint and Prettier are clean on every touched file.
>
> **Found during verification and fixed under this batch** (not filed separately):
> 1. **`/activity-history/detail` fired every request twice on load.** The default `timeTo` was 23:59.
>    `TimeRangePicker` opens in duration mode, whose minutes input has `:max="55"`, so 15 h 59 m clamps
>    to 15 h 55 m and it wrote `end = 23:55` back on mount. The view's watcher then refetched
>    everything. With `timeTo=23:55` in the URL there was one round. The default is now **00:00**
>    (in `f42b3b3a`). The API's `DateAndTimeRangeDto.ToDateTimeRange` reads the window half-open and
>    rolls an end at or before `from` onto the next day, so 08:00–00:00 is exactly the rest of the
>    day; 23:59 dropped the last minute. Same totals on 22 Sep (7 h 45 m, 7 entries), one round of 4
>    requests. **Left for `vue_framework`:** the `max="55"` cap itself. Any 56–59-minute duration is
>    unrepresentable in that input. That is the same family as the `TimePicker` minute-60 note under
>    `F36`.
> 2. **A single-day empty stacked-bars block was labelled "1 Jan"** (`8c809cf2`).
>    `StackedBarsGrid.formatWindowLabel` labels a full-day empty block with its date. On a single day
>    that block's start is one of `StackedBarsChart.processSmallWindows`' synthetic slot Dates, built on
>    `new Date(0)`, so it printed 1 January 1970. The date label is now multi-day only. A single day
>    shows its range (`08:00 - 23:55`). Multi-day charts still show real dates (`31 Aug`, `7 Sep`).
>    The shared chart lives in `activityTracking`, so the tracking dashboards get the same fix.
>    **Not fixed:** a slot ending at midnight gets a `slotEnd` *before* its `slotStart` (`endMin` wraps
>    to 0 on the same epoch day), so its duration is negative. Nothing visible was traced to it.
> 3. **The first-run block never rendered on Summary or Detail** (`4efbb0c9`). This was found while
>    settling `history-review/U1`, and it predates this batch. See that item's log entry.
>
> **Observed, not filed:** on Summary, `range=Month&date=2020-01-01` is answered with windows from
> **1 Dec 2019** to 2 Jan 2020, so the wire's `date` is the *end* of a trailing month. The empty states
> label the period *01.01.2020*, and `periodLabel`'s comment says it shows "the start date always". The
> label is not false, but the comment's premise is. Worth a line in the H7 comment, or a range label.

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

## F51. The template planner's side panel at `<md` is the open panel, squeezed and off-screen — and nothing reopens it

> ✅ **FIXED 2026-09-23.** All three prescribed parts landed **unannounced in `fcd8050d`**. That is
> the `F42` commit, and its message does not mention them (the `F52` precedent above). This close-out
> verified them. One gap it found is fixed in `bd16953c`.
> **(a)** `PlannerSidePanelShell.vue` applies the caller's `width` only at `mdAndUp`, and below `md` it
> uses `width: 100%; flex: 0 0 auto` with no `minWidth`. The same commit fixed two things the batch did
> not name:
> - The card's `d-flex` class is `!important` and beat `v-show`'s inline `display: none`, so the
>   close X below `md` hid nothing. `display: flex` now lives in the bound style.
> - `flexShrink: 0` at `mdAndUp`: the grid's basis is its max-content width, so the panel shrank to its
>   280 px `minWidth` on every desktop.
>
> **(b)** `TemplatePlannerHeader.vue` has the `d-md-none` `bars` toggle on `v-model:panelOpen`, named
> `planner.a11y.openPanel`/`closePanel` by state. That is the `F56` decision, and no key was minted.
> **(c)** `DayPlannerView.vue` took `flex-column flex-md-row` plus `min-width: 0` on the grid. The batch
> said to look before changing it; it was changed first and looked at here (below).
> **Gap, fixed in `bd16953c`:** on an unknown template id, the `F55` not-found `VAlert` replaces
> `TemplatePlannerHeader` (`v-else`), and the toggle goes with it. So below `md` a panel closed there
> stayed closed until a reload. That is this batch's defect on the `F55` path. The alert's `#append`
> now carries the same toggle. Verified on `/day-planner/templates/99999` at 390: the X closes the
> panel, the toggle reopens it, and at 1024 the toggle is hidden.
> **Verified live** (`playwright-cli`):
> - **`/day-planner/templates/20001` at 390 × 844:** the panel is 374 px wide at `left: 8`, fully on
>   screen, 829 px tall, and shows *Template Name*. X → `display: none`; the toggle's name flips to
>   *Open panel* → tap → back. Toggle → toggle works too. `scrollX` 0 and `scrollWidth` 390 throughout.
>   Screenshot looked at.
> - **`/day-planner/2026-09-23` at 390:** the same box (374 px, on screen). It is 259 px tall because its
>   content is short, not squeezed. Close and reopen work, no sideways scroll, screenshot looked at.
>   This is the first time unit 7's mobile layout has been seen.
> - **Both at 1024:** the panel is 380 / 400 px beside the grid, `scrollWidth` 1024, toggles hidden.
>
> **Not a defect, noted:** the first attempt at 390 met a `404` on template 20001 and an API that
> refused connections for a few seconds (another session's reseed). A retry was clean. It is recorded
> only because it briefly looked like the toggle was missing, and that is how the gap above was found.

- **Scope:** app-side `src/core/dayPlanner/component/PlannerSidePanelShell.vue`,
  `src/core/dayPlanner/view/TemplateDayPlannerView.vue`,
  `src/core/dayPlanner/component/template/TemplatePlannerHeader.vue`
- **Closes:** `planner-templates/X2` (+ corrects the inventory's `:162` "mobile panel-open toggle (the
  collapsed pill)" row — see *Contradictions* §86)
- **Root cause:** Two halves, and the finding describes the first through a misreading. **(1) Layout.**
  `PlannerSidePanelShell.vue:7` sets `width` as an inline style (`400px` from
  `TemplateDayPlannerView.vue:9`, `380px` by default) with `minWidth: '280px'` and no breakpoint
  override, while `TemplateDayPlannerView.vue:3` switches the container to `flex-column` below `md`
  and keeps `h-100`. So at 390 px the card is 400 px wide in a 390 px column — the page scrolls
  sideways, which is the `left: -166` and the second screenshot — and, as a column item with no
  `flex-shrink: 0` or minimum height beside a `flex-fill` grid, it is squeezed to its 16 px
  `VCardTitle` sliver. `panelOpen` starts `true` (`useRoutinePlacement.ts:28`), so **the "collapsed
  pill" the unit tapped *is* the open panel** — the two mobile screenshots show the same element
  before and after a horizontal scroll, not a closed and an opened state. **(2) No reopen.** The only
  writer of `panelOpen = true` in the template planner is its initial value: the shell's X sets it
  `false` (`:22`), `TemplatePlannerHeader.vue` has no toggle, and `v-show="panelOpen || mdAndUp"`
  (`:4`) then hides the panel until a reload. The day planner has the control the template planner
  lacks — `DayPlannerHeader.vue:7-14`, a `d-md-none` `bars` `VIconBtn` (itself unnamed; `F56`). The
  unit's *Expected* (*"the way it does on `DayPlannerSidePanel`'s default 380px"*) is unobserved: unit
  7 never resized, and `DayPlannerView.vue:3` has **no** `flex-column`, so at 390 px the day view is a
  380 px panel *beside* the grid — a different failure, not a working reference.
- **Files:** `PlannerSidePanelShell.vue:3-8` (width/height at `<md`), `:16-23` (close X);
  `TemplateDayPlannerView.vue:3,9`; `TemplatePlannerHeader.vue:3-8` (where the toggle goes);
  reference — `DayPlannerHeader.vue:7-14`, `DayPlannerView.vue:3`
- **What to change:** **(a)** In the shell, apply the caller's `width` only at `mdAndUp` (the composable
  is already there, `:85`) and go full-width below it — `width: '100%'`, drop the `minWidth` — and
  give the card `flex: 0 0 auto` (or a `min-height: fit-content`) so a column parent cannot squeeze it.
  Whether the mobile panel is an in-flow block above the grid or an overlay (`VNavigationDrawer
  temporary`, or a `VBottomSheet`) is a design choice; in-flow is the smaller change and matches the
  `flex-column` the view already opts into. **(b)** Add the reopen control to
  `TemplatePlannerHeader.vue` — the same `d-md-none` `bars` button `DayPlannerHeader.vue:7-14` renders,
  bound to the view's `panelOpen` (it is not in the header's props today; pass it as a model the way
  `DayPlannerHeader` takes `v-model:panelOpen`). Name it in the same edit — `F56` lists it. **(c)** Look
  at `DayPlannerView.vue:3` while there: it should probably take the same `flex-column flex-md-row`
  the template view has, but that is unit 7's screen and unobserved — verify before changing, and file
  what is seen rather than fixing blind.
- **Do not change:** the `mdAndUp` breakpoint (the shell's own comment says why it is not the caller's);
  `useRoutinePlacement.ts` — `panelOpen` living there is fine, it just needs a second writer.
- **Verification:** `X2`'s `Verify:` block at 390×844 on `/day-planner/templates/20001`: the panel's
  bounding box is ≤ viewport width, fully on-screen, tall enough to show *Template Name*; **plus:** tap
  X → panel gone, tap the new toggle → panel back, no reload; `window.scrollX` stays 0 throughout. Then
  the same three checks on `/day-planner/<today>` — the shell is shared, and that view's `bars` toggle
  already exists, so a fix that works only under `flex-column` shows up there.
- **Risk:** Medium — it is the chrome of both planners at every width below 960 px, and the day view's
  mobile layout has never been looked at. Screenshot both views at 390 and at 1024 (just above `md`)
  before and after.

## F37. Preset chips define `#close` without `closable` — a live "Close" button that hides the chip, and in edit mode it *is* the pencil

> ✅ **FIXED 2026-09-23.** Both `#close` templates in `TimerPresetsSection.vue` are gone. The pencil
> moved to a `v-if="editMode"` `#append` slot with the sized `VIcon` (`size="16"`), which is the Risk
> note's fallback: the `appendIcon` prop would have rendered it a step larger. The `pr-4` hack is gone,
> and both `VChip`s carry `role="button"`. `history-capture.draft.spec.ts`'s two
> `locator('span').filter({ hasText: '15m' })` calls are now `getByRole('button', { name: '15m', exact: true })`.
> **Verified live on `/activity-history/timer`:** `.v-chip__close` count is 0 both outside and inside
> edit mode. Outside edit mode, Tab from *Edit* lands on the `15m` chip (`role=button`). In edit mode,
> clicking the **pencil** on *15m* opens *Edit timer preset* with `00:15` loaded, and the chip stays in
> the row. The same check passes on an activity-preset chip. The seed has none, so a throwaway
> *25m · Code Review* was created through `+`, then deleted through the dialog's *Delete* → *Confirm*.
> Screenshot: the pencils are 16 px with even spacing. Console clean. The Timer block of
> `history-capture.draft.spec.ts` passes (4 passed, 1 skipped as before). `type-check` exit 0, lint
> clean. **Not done:** the adjacent `TimerPresetDialog.vue:129` unconditional `confirm()`, which skips
> `useDeleteConfirmation`. It is out of scope per the body and is still unfiled.

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
  preference-ownership table lists five delete sites and this is a sixth. Unit 4's mutation pass did
  **not** exercise it — it skipped `B3`'s surface as unchanged — so it stays source-only; `F69` is the
  same class in `todoList`, observed, and fixes its site the way this one should be fixed when touched.)
  Do not add a `closable` prop with a handler — that keeps the button and
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

## F31. Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas, and `isNarrow` is a dead prop

> ✅ **FIXED 2026-09-23.** `HistoryPieChart.vue` measures its own width (`useElementSize` on a wrapper)
> and lays the chart out in pixels. There are two layouts. **Side:** the legend sits left of the donut,
> sized to its widest entry and capped at 280 px and at the space the donut leaves, and the pair is
> centred in the canvas. **Stacked** (`isNarrow`, or less than about 364 px): a one-column legend under
> the donut, the chart's height grows to fit it, and the donut's radius shrinks on a very narrow canvas.
> Past the rows that fit, both layouts switch to a `scroll` legend with a pager. Legend names are
> truncated by **pixels** (`format.truncateText` from `echarts/core`), and the `(n %)` suffix is never
> cut. `isNarrow` is now read. The colour half was taken too: the legend text, pager and border read the
> Vuetify theme's `on-surface` / `neutral-500` instead of `#fff` / `#666`. `HistoryPieChartSection`'s
> chart column got `min-width: 0`.
> **Three ECharts behaviours found on the way.** Each one looked like a bug in the fix, so they are
> worth knowing next time:
> 1. The legend `formatter` runs outside the `computed`, so a width it reads is not tracked. The first
>    render truncated every name to `''` at width 0 and never re-ran. The width is now captured inside
>    `chartOption`.
> 2. A vertical legend with a `width` and no `height` wraps into columns.
> 3. A `plain` legend counts its padding inside `height`, while a `scroll` legend adds it outside.
>    Getting this wrong clips a partial row, or pushes the pager off the canvas.
>
> **Verified by screenshot** with `playwright-cli`:
> - Summary (`groupBy=ACTIVITY` week, 8 groups) at 1440 (312 px canvas → stacked, 7 rows + pager) and
>   at 1920 (552 px → side, all 8 rows).
> - `groupBy=CATEGORY` at 1920.
> - A mocked 12-group body with 50-character names at 1440 and 1920: pixel-truncated, percentages
>   whole, no partial rows, pager visible.
> - Detail on `2026-09-23` at 1440 (209 px → stacked) and at 1024 (744 px → side, no gap).
> - The home widget (`isNarrow` → stacked).
> - A selected slice survives a stacked → side resize: slice pulled out, details card unchanged.
>
> The finding's own `?date=2026-09-09` URL is empty in the current seed, so the Detail check used the
> seed date. `type-check` exit 0, lint clean.
>
> **Not verified:**
> - **The dark theme.** The seed account's theme is explicitly light, and toggling it in the UI writes
>   the preference back to the server. The colours are read from the theme in source only.
> - The home widget body is a fixed 216 px band with its own scrollbar, so the stacked legend sits
>   below the fold there. The old 250 px chart already scrolled in that band, and the batch prescribed
>   the stacked layout for `isNarrow`.
>
> **Seen, not filed:** the details card's `VCardTitle` clips a long group name with no ellipsis.
> `StackedBarsChart.vue:479`'s `#fff` legend label (unit 5's, named in the body) is untouched.

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

## F36. Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take a time-of-day default

> ✅ **FIXED 2026-09-24.** All eight tags now pass `allowedMinutesSelected="1"`, exactly as written.
> The source still matched the body: eight tags, none passing the prop. `HistorySummaryView.vue:67`'s
> `"30"` is a time-of-day picker and was left alone. The dead `variant`/`minWidth`/`maxWidth` attributes
> were left too, which the body allowed. `type-check` exit 0, lint clean.
>
> **Verified live** with `playwright-cli`, typing `0007` and reading the field back after Tab:
> - `/timer` Length: `00:00 → 00:07`.
> - All three Pomodoro cards: `00:25` / `00:05` / `00:15 → 00:07`.
> - `/manual` Length: `00:00 → 00:07`.
> - The quick-time preset editor (the pencil on *15m*): `00:15 → 00:07`, then Cancel.
> - The history-record edit dialog (Detail → record menu → *Edit*): `00:30 → 00:07`, then Cancel.
> - *Short Sprint* in the Pomodoro presets dialog loads Short break as `00:03`, and a typed `0003`
>   stays `00:03`. Not saved.
> - A 7-minute countdown sent `POST timer-alarm/schedule` with `boundaryAt` exactly 7 minutes after the
>   click (`22:24:20.131Z → 22:31:20.155Z`; the body's field is `boundaryAt`, not `endsAt`). Stop sent
>   `cancel`, and the session was discarded as under a minute: Detail's total stayed 30m.
>
> **Not verified live:** the menu half ("every minute selectable"). Vuetify's minute clock renders only
> its 12 labelled positions, with no disabled marker either way, so it cannot tell `1` from `5`. The menu
> reads the same `interval` computed as the mask (`TimePicker.vue:90-91`), so this rests on source.
>
> On `/manual`, the *when* field's time of day (the framework `DateTimePicker`) still snaps `0007 → 00:05`.
> That is a time of day, where the default is right, and it is out of scope.
>
> **Found while verifying and fixed the same day, unfiled (no batch number):**
> - The Pomodoro presets dialog's per-card edit and delete `VIconBtn`s (`PomodoroPresetsDialog.vue`) had
>   no accessible name. They are now `Edit: {preset}` / `Delete: {preset}`.
> - The timeline record's `ellipsis-vertical` menu button (`HistoryRecordItem.vue`) had none either. It
>   is now `More actions: {activity}`.
>
> Both use `F65`'s row-scoped shape and reuse `general.edit` / `general.delete` / `general.moreActions`.
> Verified live:
> - With edit mode on, the presets dialog has 0 nameless buttons.
> - `getByRole('button', { name: 'Edit: Short Sprint' })` opens *Edit Pomodoro Preset*.
> - `More actions: Desk Research` opens the Edit/Delete menu.

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

## Closed escalations

> Escalation bodies moved out of the queue once the backend answered **and** the frontend half (if any)
> landed. The queue keeps a one-line tombstone under the original § number, because the numbers are
> cross-referenced from the verification rows and from *Contradictions*.

### §1 — ✅ RESOLVED 2026-09-21 (backend `B15` landed as Option A, API `830cad6`; no frontend half). Notification titles and bodies now follow the account's locale

~~Notification titles and bodies ignore the account locale — `_shell/B1`.~~ Filed from inference on an
empty seed, confirmed on real data 2026-09-13 once `e2e-v2` seeded six notifications: signed in as
`primaryUser` (`locale: EN`), `/notifikacie` and the bell rendered every title and body in Slovak —
*"Blíži sa termín"*, *"Pripomienky"*, *"Obdobie sa čoskoro končí"*, *"Sústredenie skončilo"* — while the
chrome around them was English. The client renders `title`/`body` as opaque strings, so no `src/` change
could fix it; the ask (`prompts/view-docs/backend/_done/B15-notification-text-ignores-account-locale.md`)
offered server-side localization at dispatch (A) or key + params for the client to resolve (B).

**Landed as A, and rule 2 came out better than asked.** A notification row stores only its type and
payload; the text is composed against `User.locale` on **every read and every send**. So push and e-mail
carry the locale the account had at dispatch, but the bell re-renders every row — old ones included — in
the locale the account has *now*, which is the Option-B benefit with no contract change. User-authored
payload content (a reminder's own title, an activity name, the Test message) stays verbatim; only the
vocabulary around it is localized. CZ accounts read Slovak, deliberately and pinned by a test. Quotation
marks follow the language („…“ / “…”) and Slovak counts decline their noun.

**Verified 2026-09-21** through `playwright-cli` on a fresh seed as `primaryUser`: all six fixture rows
English in the bell; a fresh `POST /notification/test?type=ScheduledJobFailed` arrived live over SignalR
as *Scheduled job “purge-expired-run-logs” failed and needs attention.*; `PUT /user/preferences
{locale: 'SK'}` re-rendered the same rows as *Naplánovaná úloha „purge-expired-run-logs“ zlyhala a
vyžaduje pozornosť.* and switching back restored the English. No e2e spec matched a Slovak notification
string, so `e2e/` needed nothing; `notificationTypeMeta.ts` and `NotificationResponse` are untouched.
`_shell/B1` is closed in `docs/views/_shell/inventory.md`.

### §2 — ✅ RESOLVED 2026-09-13 (unit 10, round 4 — API source read). Deleting a routine time period does not cascade; the delete is refused

~~Does deleting a routine time period cascade, and to what?~~ `RoutineTimePeriodConfiguration.cs:78-81`
is `DeleteBehavior.Restrict` on `RoutineTodoListColl`; only `RoutinePeriodCompletion` cascades (its own
history rows, nothing user-authored). The FK violation maps to a **409** (`DatabaseExceptionUtils.cs:26`
→ `EndpointHelper.cs:14`), pinned by `TodoListDeleteBehaviorTests.DeleteRoutineTimePeriod_WithItems_Returns409`.
So CLAUDE.md's cascade rule does not apply and `BasicTable`'s inability to state a child count is moot
*here* (the bypass of `useDeleteConfirmation` is still real, still framework, still a `FW` decision
for a table whose delete *does* cascade — none found yet). What it left behind is the **message**: that
409 rendered as *"changed by someone else — refresh"*, filed and fixed as `todo-routine/B9`, since
verified (round 7, 2026-09-14 — see *Closed verification items*).

### §3 — ✅ RE-SCOPED 2026-09-13, then ANSWERED 2026-09-15. A done-toggle's irreversible streak advance was a bounded design question, not a defect

~~A done-toggle advances `streak`/`lastCompletedAt` irreversibly, with no undo path.~~ Read
against `RoutineResetService.UpdateItemStreak`: the increment is **once per cycle**, guarded by
`AlreadyCountedThisCycle` and pinned by two tests, so repeated clicking cannot compound; `LastCompletedAt`
moving is deliberate; the period-level streak is evaluated at reset from live state, so un-ticking
before rollover costs nothing there. The irreversible part is exactly **+1 on one item, once**. Whether
un-ticking inside the same cycle should give it back was
`prompts/view-docs/backend/_done/B9-routine-untick-streak-decision.md` (a decision, not a defect — not to
be confused with finding `B9`). The client cannot act on it either way: streak fields are server-owned.

**✅ ANSWERED 2026-09-15 — option 2, shipped (API `4ab3710`):** an un-tick inside the open cycle walks
`streak` back and restores `bestStreak`; after the cycle closes it changes nothing. Client needs nothing;
the Meditation fixture drift is cleared by a reseed.

### §4 — ✅ RESOLVED 2026-09-13. The `activity` contract is settled — nested `role`/`category`, and the client half shipped as `F3`

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

### §5 — ✅ CLOSED 2026-09-15. The grid sort-key class is fully sealed: `B7` answered the unknown keys (2026-09-13), `B20` answered the non-scalar ones (2026-09-15); no frontend half remained

`prompts/view-docs/backend/_done/B7-grid-sort-key-audit.md` +
`prompts/view-docs/backend/_implemented/B20-grid-500-on-sort-by-non-scalar-member.md`.

**`B7` (2026-09-13).** §1 was fixed **by shape rather than by a remap** — `activity.name` resolves natively
on all four profile grids, so the *Activity* header click on `memory-anchor/grid` no longer 500s, and the
`activity.name → activityName` remaps were **deleted** (safe: bookmarked `?sortBy=activity.name:asc` URLs
carry the key that now resolves natively). Three client-side items fell out of it:

- ✅ **FIXED 2026-09-13 — `BacklogTable.vue:11`.** Now `deleteConfirmationColumn="activity.name"`. This
  needed a **framework** change to work at all: `BasicTable.vue:211` indexed the row flat, so it resolves
  through `getNestedValue` now. Dotless keys are unaffected. See `F3`.
- ✅ **Already satisfied — error handling distinguishes `400` from `500`.**
  `ErrorHandlingFunctions.ts:11` has had its own `case 400` all along, separate from `case 500`, so an
  unresolvable sort key (`InvalidSortKeyException` → `InvalidSortKeyMiddleware`) surfaces a snackbar rather
  than the old false empty state. **No change was needed**; verified by reading the switch, not in a
  browser.
- ⏳ → ✅ **The latent lookup-column trap, which became `B20`.** Probed against the running API 2026-09-13
  on `activity-backlog-profile/grid`: `zzzNotAColumn` → **400** naming the key; **`locationType` → 500**
  (`errorId be94ee6d327f`, re-probed after the `B2` deploy as `13ae656a28ee`); **`activity` → 500**
  (`28962860a3af`); `locationType.text` and `activity.name` → **200**; `energyDemandId` (present on every
  row, not sortable) → **400**. So `B2` *was* fixed for the class it names — this was a **second, distinct
  unhandled 500**, covering keys that resolve to a **non-scalar member**, which is precisely what a real
  `TableColumn('locationType', …, sortable)` emits. Filed as `B20` on the invitation in `B2`'s own
  close-out (*"If you see `errorId` in a body, that is still an unhandled 500 and a different bug — report
  it."*).

**`B20` (✅ landed 2026-09-15).** Fixed in the shared layer, same place as `B2` —
`InvalidSortKeyException` / the sorting helpers in `Sydowwe.Framework`, so all five profile grids, the
three reminder reads (`reminder-dashboard/my-upcoming`, `/upcoming`, `reminder-definition/grid`) and the
tracking distinct/mapping tables inherit it. The rule: a sort key resolving to a non-scalar member — a
nested response object, a value-object record (`IntTime`/`TimeDto`), a collection — is refused exactly like
an unknown key. *Orderable* means primitives, `string`, enums, the date/time family, `Guid`, `decimal`, and
nullable versions of those. The body is the existing validation shape with **no `errorId`**, and the
message names the leaves:

```json
{ "statusCode": 400, "message": "One or more errors occurred!",
  "errors": { "sortBy": ["Sort key 'locationType' is not sortable; sort by one of its members instead: 'locationType.id', 'locationType.text'."] } }
```

Re-measured on `activity-backlog-profile/grid`: `locationType` and `activity` → **400** (hinting
`locationType.text` / `activity.name`), `locationType.text` and `activity.name` → **200**, `zzzNotAColumn`
and `energyDemandId` → **400** as before. Covered by a new theory in `SortKeyRejectionTests` next to the
`zzzNotAColumn` one; full grid/sort/reminder suite 315 passed, 0 failed.

**Frontend half: none, and that is why this is closed.** No client column emits a non-scalar sort key
today. Two things it leaves behind, both carried forward rather than tracked here:

1. The convention stands — **a sortable `TableColumn` over a lookup must emit the `.text` leaf**, not the
   object. What changed is the cost of getting it wrong: a visible 400 the interceptor snackbars, not a
   500 behind an empty table. So it is a reminder, not a trap.
2. `F27`/`F61`'s error-state work is still worth doing but is **no longer load-bearing for this case** —
   there is now no known grid request that produces an `errorId`. One that does is a new bug, reported
   the same way.

Two smaller notes for whoever writes the specs: `activity` is **nullable** on the two tracker mapping
grids, so an `activity.text` sort puts those rows nulls-last ascending / nulls-first descending — correct,
not a bug. And the API flagged an **honest test gap**: its integration tests pin `periodKey` only as the
sole sort key, so the multi-key splice (`[{rating,desc},{periodKey,desc}]` must order by rating first) is
right by construction but unasserted. `B7` §4's two-click combinations are the cheapest place to catch a
regression, which makes this an **e2e ask on our side**, not a backend one.

### §6 + §13 — ✅ RESOLVED 2026-09-15 (backend landed; no frontend half). Five grid filters: the client sent 27 field names the server never declared

**One defect class on five endpoints**, escalated twice from two different passes before anyone saw it
was the same thing: §6 was the activities grid (`activity-settings/B1`), §13 the four leisure profile
grids (`leisure-backlog-picker/X1` `blocker`, `leisure-bucket-anchors/B1`). Both were written up as one
ask, `prompts/view-docs/backend/_implemented/B11-grid-filter-field-names-never-matched.md`, which holds
the full contract table and the answer; what follows is the trail.

**The ask, as it stood in the queue.** `IFilterRequest` is an empty marker and `BaseGridEndpoint` applies
nothing generic (`BaseGridEndpoint.cs:124-125` → `ApplyCustomFiltering` only), so each grid read a handful
of named members off its own filter record — and **System.Text.Json drops unknown members silently**. A
request carrying a field the record did not declare was answered with the **unfiltered grid and a 200**.
Client sent 27 filter fields across the five grids; the server read 8 of them.

| grid | never applied |
| --- | --- |
| `activity/grid` | `roleIds[]`, `categoryIds[]` (server declared singular `RoleId`/`CategoryId`) |
| `activity-backlog-profile/grid` | 9 of 11 |
| `activity-bucket-list-profile/grid` | 4 of 6 |
| `memory-anchor/grid` | all 4 (two of them the client's own naming slip → `F60`) |
| `activity-project-profile/grid` | 3 of 5 |

Two consequences worth keeping: **`activityName` filtered on none of the four leisure grids** — every
*Activity* chip, every `?activityName=` bookmark and `MemoryAnchorTable.vue:125`'s source-chip navigation
had always returned everything — and **the activities grid had never filtered by role or category**
(`git log -S roleIds` bottoms out at `540f9529`, 2026-08-07, with the list shape already in place; no
commit on either side ever carried the other's name).

**Why both units misdiagnosed it from the browser.** A 200 with rows looks like success. Unit 11 saw a
filter "work on two requests and fail on one" and blamed a sort/filter interaction (§89); unit 12 saw
five fields "ignored" and one, `activityName`, "working" (§90) — a claim with no mechanism, withdrawn.
This is the reusable lesson: **a filter that returns rows is not evidence the filter was read.** Compare
the count against an unfiltered request, or read the record.

**The answer, 2026-09-15.** All 27 names adopted as written — id lists and enum lists as any-of
`Contains`, `activityName` as a case-insensitive `ILIKE` contains on `Activity.Name` (with `%`/`_`
escaped), the ranges as inclusive comparisons, `null` (and whitespace-only strings) as "no opinion".
Four details beyond the ask:

- **An empty list means "no opinion", not "match nothing"** — `roleIds: []` returns what omitting it
  returns, pinned by a test. So the combobox clearing its last chip is safe, and `F18`'s
  normalise-`[]`-to-`null` half is now tidiness rather than correctness.
- **`maxParticipants` drops rows whose own `maxParticipants` is `null`** (an unbounded entry never fits
  under a cap). Offered as reversible; kept, because it matches the picker's question.
- **`categoryIds` never matches an activity with no category; `effortTypes` never matches a backlog
  entry with no effort type.** Both are the obvious reading — not bugs to file.
- **The existing scalars are kept** (`roleId`, `energyLevel`, `comfortZoneStep`, …) and still
  exact-match. Nothing on this side sends them and nothing should start — **the lists are the contract.**

**The test that closes the class.** `GridFilterFieldNameTests`, one case per grid plus the empty-list
pin, each posting every field under its **camelCase wire name as a raw JSON property** — so the test
cannot pass by agreeing with the server's PascalCase member — with a matching row and a decoy, asserting
the decoy is dropped. No assertion is on the status code, because the status code was never the symptom.
This is the same shape `B2`/`B7` used for sort keys, and the reason adding a member to one of the five
records now means adding a case there.

**The frontend half: none, verified by inspection.** All five filter classes already carried exactly
these names; `hasAny()`, the chips and the URL codecs were already correct. The alternative the queue
rejected — hiding the inputs the server did not read — would have been a product regression for a
contract gap. One thing checked rather than assumed: our enums declare **camelCase values**
(`EnergyLevel.High = 'high'`), so the payload is `["high"]`, not the reply's `["High"]`;
`JsonStringEnumConverter` binds either, but that is the one seam where a future naming-policy tightening
on either side would fail silently in exactly the "200 with the wrong rows" way this escalation was about.

**What it unblocks, and what it does not.** `leisure-backlog-picker/X1` and `leisure-bucket-anchors/B1`
(its `minRating` and comfort-zone cases) are unblocked, as is `activity-settings/B1` — role and category
chips now filter. **`F18` and `F60` still land app-side**, unchanged: the server reads
`anchorYear`/`anchorMonth` and grew no alias for `year`/`month`, so `F60` is still the client's own slip.
Both batches' verification blocks said "check the request, not the table"; they can now check the table.

### §7 — ✅ RESOLVED 2026-09-23 (backend `B18` landed 2026-09-21, API `cd0a252` + the same-day follow-up; frontend half `FW24` + `F85`, both verified live 2026-09-23). A 409 or 403 is worded by its cause, not its status

**Closure.** Both frontend halves had landed on 2026-09-21 (`vue_framework` `4ab7e61`, app `adaae452`)
without the queue knowing. They were verified on 2026-09-23 and one gap was fixed: a field-keyed
`errors` entry now wins over the typed DB-409 wording (`vue_framework` `bc96068`). The batch bodies above
have the verification tables. What the user sees now: a unique clash says *pick another value*, an FK
refusal says *remove or move the dependents first*, a business `Conflict` shows the server's authored
sentence, and the raw English *"Unique constraint violation during Create"* no longer reaches the screen
on any path. The two routine-settings call sites keep their inline/contextual handling, narrowed to the
one type each can word. The prompt file stays in `backend/_done/B18-…`.

**The body as it stood in the queue:**

7. ✅ **THE ASK LANDED 2026-09-21** (`AdhdTimeOrganizer` `cd0a252`; the prompt file moved to
   `backend/_done/` and carries the full response).

   What shipped, in one line: **every error body the API authors now carries `errorType`**, the
   `ResultErrorType` member name as a plain PascalCase string, **absent** (not null) when the server
   has nothing better than the status; FluentValidation 400s carry none and keep their `errors` map.
   The values to branch on are `DbUniqueViolationError` / `DbForeignKeyError` / `DbConcurrencyError` /
   `Conflict` on 409, and `EmailNotConfirmed` / `UserLockedOut` on 403. `DbConcurrencyError` is
   unreachable today — no request DTO carries a row version — so wire it and do not expect to see it.
   The backend also named the test pair: `DELETE /api/activity-role/{id}` answers `Conflict` for a
   system role and `DbForeignKeyError` for a role that still has activities. **Two of the three
   frontend consequences it lists are wrong** — see `F85`, which corrects them rather than repeating
   them.

   **Follow-up 2026-09-21 (same day, appended to the prompt file):** the "every error body" claim was
   not quite true at landing — eleven hand-written endpoints still picked their 409 with a bare
   `EndpointHelper.ToStatusCode(...)` and dropped the type. Those are converted and a source-scan test
   (`ErrorStatusBypassGuardTests`) fails the API build on any new one. **Nothing in the contract
   changed** and nothing new opens on this side; it only widens the routes `FW24` can rely on: the two
   `…-mapping-by-pattern` creates/updates (duplicate pattern → `DbUniqueViolationError` **with**
   `errors["Patterns"]` naming the clash — relevant to `F72`'s field-by-field branch), the three tracker
   heartbeat/sync posts, `PATCH /activity/{id}/archived`, `POST /activity/merge`, every to-do step and
   toggle-done write, `PATCH /planner-task/{id}/status` and `POST /planner-task/apply-template`. The
   follow-up repeats the two wrong frontend consequences (*delete the `_silent` wordings*,
   *`useDeleteConfirmation` can stop guessing*); `F85` still stands as the correction. `FW24` gains the
   duplicate mapping pattern as a second verification pair.

   **The record below is what was asked and why; it is kept as the evidence trail, but note one thing
   it gets wrong about this side.** It says the client "is told *This record was changed by someone
   else*". That is only the `_silent` + `handleHttpCodes` path. The default path is the interceptor,
   which prefers the server's `message` — so an ordinary 409 has been showing the API's raw English
   *"Unique constraint violation during Create"* in a Slovak UI (`FW24`, *Contradictions* §120).

   **Client side closed 2026-09-14; the ask itself stays open, and is smaller than written.** Two corrections
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

### §8 — ✅ RESOLVED 2026-09-21 (backend `B19` decided and landed, API `dev` @ `fee54a1`; frontend half landed the same day). Public-holiday names now resolve through a stable key; no country preference

**The ask, as it stood in the queue** — `history-review/B4`, then `planner-day/B4` from the other consumer
(tenth pass), both re-graded `bug` → `polish` (*Contradictions* §30 / §74). Read at the source:
`CalendarDayFactory.cs:37` wrote `HolidayName = HolidayCalendar.ForDate(date, countryCode)` when a
`Calendar` row was created, and `HolidayCalendar.cs:31-56` is a **Slovak** table of native names with a
Czech sibling and `DefaultCountryCode = "SK"`. So the string was the holiday's *proper name*, not app text
resolved in the wrong locale — which is why it was never batched with §1 — and the finding's other pass
condition (*"omitted for accounts outside Slovakia"*) had nothing to read, because `User` carries no
country. Written up as `B19` as a **design decision with two independent halves**: (1) a country
preference on `/user/preferences`, read at row creation or — better — at read time; (2) a stable key per
holiday resolved client-side through vue-i18n, the same "send a key" shape §1 offered for notifications.
The client's stated preference was 1 = yes, 2 = no.

**The answer, 2026-09-21 — the opposite of the client's preference, and the right call.** Half 1: **no**.
The app has no other country and no country preference; that is the decision, not a gap. Half 2: **yes**.
Every calendar-day response (`POST /calendar/filter`, the by-date and by-id reads, the History calendar
endpoint) now carries `holidayKey: string | null` next to the unchanged `holidayName`; both null on an
ordinary day, always written together from one table entry. The key set is 15 values — Slovak public
holidays — fixed and never renamed (rows persist them), so the client hard-codes the table. The migration
backfilled the key onto existing rows, so the seed needed no re-run. The full key → SK → EN table is in
`prompts/view-docs/backend/_done/B19-holiday-names-country-and-locale-decision.md`.

**The frontend half, the same day.** Framework (`src/_common` `b5478e8`): `ICalendar.holidayKey`; a new
`composable/general/useHolidayLabel.ts` whose `holidayLabel(day)` looks up `calendar.holidays.<KEY>` behind a
`te()` guard and falls back to `holidayName` for an unknown key *or* a key-less response, so an older server
keeps rendering; `CalendarGrid`'s holiday chips go through it, which covers the planner and History
calendars at once since they share the grid. App side: `Calendar.ts` and `CalendarActivityDaySummary.ts`
(incl. its `placeholder()`) carry the key; `DayDetailsPanel.vue`'s holiday card resolves it; the 15-key
table sits in `src/locales/common.{sk,en}.ts` under `calendar.holidays`. Because the app's SK `common` now
contributes to `calendar` for the first time, **`calendar` joined the deep-merge in `SK.ts` and `EN.ts`**
rather than shadowing the framework's day names — the same route `httpErrors` took for `B18` earlier the
same day, and `common.en.ts`'s header no longer lists `calendar` among the wholesale replacements. No
preferences work, no `userAugmentation.ts` change.

**Verified live.** `planner-day.draft.spec.ts`'s B4 `fixme` is now a real test: `/day-planner?month=2026-09`
as the EN fixture account renders *Constitution Day* and *Our Lady of Sorrows* and zero occurrences of the
Slovak string. It passed against the running API on first run, which is also the proof the backfill
reached the seed rows. SK output is unchanged by construction — the SK table is the exact strings the
backend already sent. `history-review/B4` and `planner-day/B4` are closed in full.

### §9 — ✅ RESOLVED 2026-09-21 (backend `B14` landed, API `1e0dc3b` + framework `23e13fe`; frontend half the same day). The Google Calendar OAuth flow is completable once the redirect URI is registered in the Google console

**The ask, as it stood in the queue** — `user-settings/B1`, read to three server-side stops in the
order a user hits them: (1) `ClientId` empty and `GET …/auth-url` handing out a `client_id=` URL as a
200; (2) the redirect URI a literal `http://localhost:5173/…` while the app is `https://localhost:3000`;
(3) the `google-oauth-state` cookie scoped to `/user/google-calendar` while the route is
`/api/user/google-calendar/connect`, so a real browser never sent it and every connect was the *"state
is missing"* 400 — invisible to the API's own suite, which wrote the `Cookie` header by hand. Filed as
`B14` (`prompts/view-docs/backend/_done/B14-google-calendar-oauth-cannot-complete.md`, with the
response appended).

**The answer, 2026-09-21 — all three, plus a contract the client can branch on.** `GET …/status` gains
`configured` (`false` → no OAuth client in this deployment; `connected` is then always `false`).
`GET …/auth-url` answers **503 `ServiceNotConfigured`** instead of a 200 when unconfigured — a new
framework `errorType`, never hit if the client branches on `configured` first. On the 200 path the
`redirect_uri` is derived from the page URL + `/google-calendar/callback`. `POST …/connect` takes
`{ code, state }`, `state` required; the cookie is scoped so the browser sends it; the three
hand-rolled 400s carry `errorType` — `CookieMissing` (expired / consumed / cross-site), `BadRequest`
(cookie arrived with another flow's state), `ExternalServiceError` (Google refused the exchange). The
cookie is consumed on the first connect, so a replay is `CookieMissing` — never retry a 204. Disconnect
and `POST /calendar/{id}/sync-to-google` unchanged. Remaining: registering the dev redirect URI in the
Google console is an ops step, not code.

**The frontend half, the same day.** Framework (`src/_common`): `ServerErrorType` gains the four values
above, declared but deliberately not worded — their sentence depends on the flow (`docs/composables.md`).
App: `googleCalendarApi.getStatus()` returns `{ configured, connected }` (both defaulting `false`, so an
older server renders as *not available* rather than handing the user a broken URL); `connect(code,
state)` is `F33`; `GoogleCalendarCard` holds the status as one optional object — no chip until it
answers, *"Not available here"* (`googleCalendar.notAvailable`, `textMuted`) with **no button** when
`configured` is false, the old Connected / Not connected pair otherwise; `dayPlanner`'s
`GoogleCalendarSyncBtn` reads the same status and stays hidden when unconfigured. Verified twice the
same day: against the pre-`B14` build the card read *Not available here* with no button (the missing
`configured` defaults to `false`); after restarting the API on `1e0dc3b`, `GET …/status` →
`{"configured":true,"connected":false}` (the dev box holds a client id in user-secrets), the card reads
**Not connected** + *Connect*, `?code=x&state=y` → `POST …/connect` 400 `CookieMissing` → *"Connection
attempt expired — start again"*, `?error=access_denied` → *"Google Calendar connection cancelled"*, and
*Connect* → `GET …/auth-url` 200 → Google's **`redirect_uri_mismatch`** page for
`https://localhost:3000/google-calendar/callback` — i.e. the right URI, not yet registered in the
console. That registration is the one remaining step before the consent round trip and the sync leg
can be run; `user-settings/usecase.md` records them as `unverified` until then.

### §10 — ✅ RESOLVED 2026-09-16 (backend `B16` landed on its working tree, verified and extended 2026-09-21, **not yet committed there**; frontend half in this tree the same day). Two sentinels for one folded-tail row

**The ask, as it stood in the queue** — source-certain, unobserved on the seed; found in the eleventh pass
reading `tracking-dashboards/B2`'s data path. The four pie endpoints (`WebExtension`/`Desktop`/`Android`/
`UnifiedPieChartEndpoint.cs`) folded the sub-`minPercent` tail into a row named the literal `"Other"`;
the three per-source stacked-bars endpoints folded theirs into `"_other"`. The client recognised only the
second (`ActivityPieChart.vue`, `StackedBarsChart.vue:440`, `StackedBarsTooltip.vue:43`): translated it
(`activityTracking.common.other`, *Ostatné*), coloured it neutrally, refused to select it. Every dashboard
sends `minPercent: 1`, so whenever anything fell under 1 % of the span the pie's tail was (a) an
untranslated English legend entry in Slovak, (b) a selectable slice — `?selected=Other`, a desktop
`process-details?processName=Other` request, after `F47` an Android panel titled *Other* — and (c) on
`/activity-tracking`, which also buckets locally at 3 % into `_other`, a **second** "Other" legend entry
whenever the server's bucket summed to ≥ 3 %. Written up as `prompts/view-docs/backend/B16-…` on
2026-09-15 with three rules: a folded row is a sentinel, not a name; one sentinel across every endpoint
that folds; the folded row is never drill-downable. Contract only — which constant, and where, was theirs.

**What the backend did (2026-09-16, verified 2026-09-21).** One constant, `FoldedRow.Sentinel = "_other"`
in `AdhdTimeOrganizer.Tracking/domain/helper/FoldedRow.cs`; all seven folding endpoints reference it, and a
grep of the Tracking slice finds no other `"Other"`/`"_other"` literal outside that file and doc comments.
The four pie endpoints emit it in the same identity fields that carried `"Other"` — `packageName`/
`appLabel`, `processName`/`productName`, `domain`, `label`; `UnifiedPieChartEndpoint`'s private
`OtherLabel = "Other"` is gone. Nothing else moved: seconds, percentages, ordering, the totals row. The
three stacked-bars endpoints are wire-identical, now sourced from the constant. Unified stacked-bars has no
`minSeconds` and never folds — not on the list, not a gap. Pinned by two theories in
`TrackingDashboardParityTests`, both asserting the literal string rather than importing the constant so
they pin the wire, not the server's own name for it: `PieChart_FoldsTheTailUnderTheSameSentinelOnEverySource`
(four pie routes, `minPercent: 5`) and — added 2026-09-21 when the verification pass noticed the bars had
been rerouted through the constant with nothing asserting them — `StackedBars_FoldTheTailUnderTheSameSentinelOnEverySource`
(three stacked-bars routes, `minSeconds: 100`). 15 passed, 0 failed. **All of it is still on the API's
working tree**: `FoldedRow.cs` untracked, seven endpoints modified, no commit — see §126 and the
*Needs verification* row in the queue. Until it is committed, any reachable server still sends `"Other"`.

**What the frontend did (2026-09-16, same tree, uncommitted).** `F47`'s local guard on the `"Other"` row —
the one shim `B16` named — was never written; `F47`'s body now says so explicitly. Instead
`OTHER_DOMAIN = '_other'` was exported from `component/pieChart/PieSegment.ts` with a doc comment naming it
a sentinel, and replaced the eight scattered `'_other'` literals in `ActivityPieChart.vue`,
`ActivityPieChartSection.vue` and `UnifiedPieChartSection.vue`. The one behaviour the rename could surface
differently — the backend's single question back, *"does the client's local 3 % bucket merge or overwrite
the server's row now that both use the same key?"* — was closed in code: both locally-bucketing sections
(the queue's §10 named only the web one; `UnifiedPieChartSection` buckets the same way and was the second)
now read `d.domain !== OTHER_DOMAIN && percent >= threshold`, so the server's folded row goes into the single
`otherSeconds` accumulator unconditionally and exactly one `OTHER_DOMAIN` segment is pushed. **It sums.** A
server row above the local threshold used to survive as its own segment beside the local bucket — that is
(c), now impossible. Answered in the `B16` file's *FRONTEND ANSWER*; no test needed on this side, the
fold is a `computed` over props.

**What it did not do.** Two fold thresholds for one concept (server `minPercent: 1`, client 3 %) are
unchanged and now commented in both sections; that is `tracking-dashboards` deferred item (2), not a
defect. The backend's out-of-scope flag on `AdhdTimeOrganizer.History/…/HistoryPieChartBuilder.cs` — *"has
its own `"Other"` literals, probably the identical bug"* — was **stale**: `:20` is
`public const string OtherName = "_other";` and has been. Their offer to do the History side as a follow-up
needs no answer but "nothing to do". What *is* wrong there is the History **client**: the history dashboard
mounts its own `historyDashboard/component/pieChart/HistoryPieChart.vue`, not `ActivityPieChart.vue`, and it
renders the sentinel raw — `_other` in the legend, slice selectable. Filed as `F84`, app-side, no backend
half, never blocked by §10.

**What it unblocks, and what it does not.** Nothing was queued behind §10: `F47` and `F48` were written to
land either way, `F84` is independent, and the client guard is a no-op against the old wire value so this
side commits safely in either order. The one thing still owed is a **look** — the queue's *Closed without a
browser* row: a seed app under 1 % of the span, or one fulfilled `route` body, should paint a grey
*Ostatné* slice that clicks to nothing, and on `/activity-tracking` and `/unified` exactly **one** such
legend entry. That look is worthless until the API side is committed and running; folded into the
mutation pass, not its own row. Number retired, not reused.

### §11 — ✅ RESOLVED 2026-09-16 (backend landed; frontend half landed the same day). The colour validator demanded hex, and the palette — on both sides, including the server's own seeder — is names

**The ask, as it stood in the queue** — `activity-settings/X1` + `todo-lists/X1` (both `blocker`, observed
four times: Create and a no-change Edit of the seeded *Health & Fitness* role, plus three submits of
`/todo-list`'s *New category* dialog). `NameTextColorIconValidator.cs:16-20` was
`.Matches("^#(?:[0-9a-fA-F]{3}){1,2}$")`, dating from 2026-05-16 (`a51309e`), while `ColorPicker.vue:31`
writes `COLOR_PALETTE`'s `name` and the server's own `ColorPalette.cs` and `E2eFixtureSeeder.cs:409-417`
both write the same 29 names. Three validators derive from it, so six routes were closed. Written up as
`prompts/view-docs/backend/B10-color-validator-rejects-palette-names.md`; the body now lives in
`prompts/view-docs/backend/_implemented/`.

**The answer, 2026-09-16.** The regex is gone. A shared `MustBePaletteColor()` rule accepts exactly the 29
`ColorPalette` names, **exact and case-sensitive, lower-case** — `"blue"` passes, `"Blue"` is a 400 — and
carries `NotEmpty()`, so `color` stays required on all three entities. `EntityFieldLengths.Color` went
`7 → 20` with a migration widening all five colour columns, and a test asserts every palette name fits the
column. `"default"` is **refused**, which is the preference the ask stated. Error shape unchanged: 400,
`errors.color[]`, message naming the accepted set verbatim — `FW19` can render it as-is. Pinned by
`NameTextColorIconValidationTests` (40 cases, green), including that a rejected update leaves the stored
colour untouched.

Answers to the ask's four business rules, as shipped: (1) palette name, confirmed — no client change to
`ColorPicker` or `colorPalette.ts`; (2) every name round-trips, `"burgundy"` included; (3) `"default"`
refused; (4) `color` required on all three (the DB columns are `NOT NULL`, so making it optional would be a
migration, not a validator tweak — say the word if that is ever wanted).

**The frontend half, landed 2026-09-16.** Rule (3) and (4) together mean a user who never touches the
picker must still send a palette name, and `ColorPicker`'s `required` prop only **hides the "none" swatch**
— nothing in it writes a colour unprompted (its own comment says so). So `required` alone would have
swapped one 400 for another. Both halves shipped:

- `required` on the three pickers — `ActivityRoleForm.vue:16-20`, `ActivityCategoryForm.vue:16-20`,
  `TodoListCategoryForm.vue:18-21`. The time-period form already had it.
- The three request DTOs seed a real palette name instead of `null`: `color: string = 'blue'` on
  `RoleRequest`, `CategoryRequest` and `TodoListCategoryRequest`, with `?? 'blue'` on the two `fromEntity`
  helpers and on `TodoListCategoryForm`'s edit-path constructor (the response DTOs still type `color` as
  nullable). `'blue'` is what `TimePeriodRequest:10` already used — this makes four call sites agree
  rather than inventing a default.
- `useTodoListCategories.ts`'s `request.color ??= 'default'` is **deleted**. That line was the source of
  the `"color":"default"` submit unit 9 recorded, and `"default"` is now explicitly refused.
  `TodoListCategoryPanel.vue:85`'s `cat.color !== 'default'` render guard is left alone — it still covers
  rows written before this landed.

`npm run type-check` and `npm run lint` both clean.

**Verified live, 2026-09-16** (`playwright-cli`, form sign-in as `primaryUser`, local API on `:8080`):
no-change Edit of *Health & Fitness* → `PUT /api/activity-role/11002` **200** (was the 400 the unit
filed); *Add* with the picker untouched → `POST /api/activity-role` **201**, and the *Blue* swatch renders
`[checked]` with **no "None" swatch** in both the role dialog and `/todo-list`'s *New category* dialog.
Both test rows deleted afterwards; the seed is as it was.

**One transient the verification hit, since resolved.** The `burgundy` create (8 chars, the only palette
name over 7) came back `400 {"errors":{"generalErrors":["Data too long during Create"]}}` — the generic,
field-less 22001 the answer itself predicted, which is exactly why the column was widened rather than the
regex merely relaxed. **The owner confirmed the same day that the migration is applied and `Color` is
`character varying(20)` in the database**, so the 22:09 failure was against an API process predating the
migrate, not a gap in the ask. Left recorded because the failure mode is worth recognising: a colour that
passes the validator and then dies with **no `color` key and no field name** means the column, not the
rule. `burgundy` through the UI is the one-swatch check that distinguishes them. **Re-run against the restarted
API the same day and now green:** `POST /api/activity-role` with `{"color":"burgundy"}` → **201**, and the
follow-up grid response carries `"color":"burgundy"` back whole, all eight characters, no truncation. Rule
(2) is verified end to end; the other 28 names are ≤ 7 characters and were never at risk.

**What it unblocks.** `activity-settings/X1` and `todo-lists/X1` are closed. The unit 2 and unit 9
**mutation passes** can now create a role, a category and a to-do-list category through the UI.

**Still open, filed elsewhere — not part of this closure.** Three things the backend flagged in the same
answer, none of them app-side today:

- The palette rule covers only the three `NameTextColorIconValidator` subclasses. `TaskPriorityRequest`
  and `RoutineTimePeriodRequest` have no colour rule at all and `TaskImportanceRequest` has only
  `NotEmpty` + max-length, so those three still accept a hex string or `"default"` and store it. That is
  `todo-routine/B11`'s observation, now confirmed from the other side. Worth asking for the rule to be
  extended in one pass; until then a renderer can be handed a value it cannot resolve.
- The history pie chart's synthetic `_other` roll-up still carries `color: "#999"`
  (`HistoryPieChartBuilder.OtherColor`) while every real slice carries a palette name, so that one
  response field is a union. **No client change is needed either way**: `historyGroupColor.ts` routes a
  `groupId === null` row through `getDomainColor(name)`, which already special-cases `_other` to grey, and
  the server's value is not read on that path.
- **Adjacent, found while checking the above, and worth its own entry:** `resolveHistoryGroupColor`
  returns `item.color` *raw* as a CSS colour (`historyGroupColor.ts:46`). Now that the server's real
  slices carry palette **names**, that is a name landing in a `backgroundColor`. `blue`, `teal`, `indigo`
  and `violet` happen to be CSS named colours and will render — but as CSS's hue, not the palette's, and
  in one shade for both themes; `emerald`, `zinc`, `slate`, `burgundy`, `ocean`, `grape` and the rest are
  not CSS colours at all and resolve to nothing. This predates `B10` and is not caused by it; it needs a
  `COLOR_PALETTE` name → `{bg, text}` lookup on the way out, keyed on theme, and it touches
  `HistoryPieChart`, `HistorySummaryCard` and `useHistoryDashboard`. Not fixed here — it changes rendered
  chart colours and belongs to the `historyDashboard` unit, not to this validator's frontend half.

### §12 — ✅ RESOLVED 2026-09-15 (backend landed; frontend half shipped as `F62`). `GET /memory-anchor/anchor-eligible-activities` does not exist

**The ask, as it stood in the queue** — `leisure-bucket-anchors/X3` (`blocker`). No endpoint file under
`endpoint/memoryAnchor/` declared the route (`GetById`, `GetSelectOptions`, `Grid`, `Create`, `Update`,
`Delete`, `BatchDelete` was the whole list), and the 400 body (*"Value [anchor-eligible-activities] is not
valid for a [Int64] property"*) was `GetByIdMemoryAnchorEndpoint` catching the path — what absence looks
like from outside, not the route-ordering shadow the unit first guessed. `prompts/_done/leisure/backend/B1-backend.md:5`
had asserted the route *"already knows which activities qualify"*; it never landed. Written up as
`prompts/view-docs/backend/B12-anchor-eligible-activities-endpoint-missing.md`.

**The answer, 2026-09-15.** `GetAnchorEligibleActivitiesEndpoint` shipped on `AdhdTimeOrganizer` `dev`,
pinned by `AnchorEligibleActivitiesTests` (6 tests, green). Contract, as shipped:
`GET /memory-anchor/anchor-eligible-activities` → 200 `SelectOption[]` (`{ id, text }`, `text` = activity
name), same shape as every `/all-options` route — `SelectOption.listFromObjects` parses it unchanged, and
an empty list is a valid answer. Eligible = the caller's own, non-archived, and carrying a backlog profile
(repeatable **or** one-time) or a bucket-list profile; ordered by name then id.

Two corrections against what `B1-backend.md` had assumed:

- **Repeatable backlog activities are included**, not excluded. The rule matches `POST /memory-anchor`'s
  own validator exactly, so the picker lists precisely what *Create* will accept — narrower would hide
  activities the "I did this" path can already anchor, wider would fail on submit with nothing the user
  could fix. The backlog grid's "done" column is unaffected either way; that rule lives in the grid
  projection, not here.
- **`B1-backend.md:63`'s open question is answered "stays listed".** An anchor is "this was memorable in
  month X", not a completion flag — the only ceiling is the existing two-anchors-per-activity-per-month
  rule, enforced at `Create` (400 on `anchorMonth`, third anchor same month). The picker does not try to
  predict that; it can't know which month the user is about to pick.

**The frontend half — `F62`, landed the same day.** `fetchAnchorEligibleActivities` /
`NewMemoryAnchorForm.vue` needed no change to the request; `F62`'s `try/finally` (plus a distinct failure
alert, not the "no eligible activities" one) was the missing piece and lands regardless of this endpoint.
Verified live against the restarted local backend: opening *Add* on `/leisure/memory-anchors` fetches and
populates the Activity picker with no console error.

**What it unblocks.** `leisure-bucket-anchors/X3` is closed in full. `leisure-bucket-anchors/U1` (the
locked "I did this" path) is untouched — it never called this endpoint.

### §14 — ✅ RESOLVED 2026-09-15 (backend landed, frontend corrected). An unconfirmed account's correct password was answered `401 "Invalid email or password"`, never the `403 "Email not confirmed"`

**The ask, as it stood in the queue** — `auth/B6` (`bug`, observed twice on two throwaway accounts in unit
15's round 2). The unit's guess (*"the server no longer signals it"*) was half right: the server **had**
the branch and never reached it. Read at the source that pass:
`framework/Sydowwe.Framework/application/service/auth/PasswordSignInFlow.cs:105-106` returned
`EmailNotConfirmed` (→ 403, `:47`) with the comment *"checked after password verification so the answer
can't be used to probe which addresses are registered"* — but it sat **after**
`signInManager.CheckPasswordSignInAsync(user, password, true)` (`:83`), and the host registers
`options.SignIn.RequireConfirmedEmail = true` (`IdentityServiceExtensions.cs:121`). ASP.NET Identity's
`CheckPasswordSignInAsync` runs `PreSignInCheck` → `CanSignInAsync` **before** it verifies the password,
and with that option set an unconfirmed user gets `SignInResult.NotAllowed` back — which is
`!result.Succeeded`, so `:95-101` answered *"Invalid email or password"* and the flow's own check at `:105`
was dead code for every deployment that sets the option. Two consequences: `LoginView.vue`'s dedicated
branch (the `emailConfirmationNeeded` snackbar and the resend panel) was unreachable, and the password was
never checked — so the lockout counter did not move either. Written up as
`prompts/view-docs/backend/B13-unconfirmed-login-answers-401-not-403.md`; a `Sydowwe.Framework` file, so
the fix ships to every API on that framework.

**The answer, 2026-09-15.** Taken — and taken the enumeration-safe way the ask asked for, not the one-line
`IsNotAllowed` mapping it rejected. `PasswordSignInFlow.RunAsync` now calls `userManager.CheckPasswordAsync`
directly instead of `SignInManager.CheckPasswordSignInAsync`, so the order is lockout →
password (wrong → `AccessFailedAsync`, then re-check lockout, then 401) → `EmailConfirmed` (403) → 2FA →
session. All four business rules in the ask were confirmed as written, with no corrections:

| situation | status | message |
| --- | --- | --- |
| unknown e-mail, or wrong password (confirmed or not) | 401 | *Invalid email or password* |
| locked out | 403 | *Too many failed login attempts. Try again in {m}m {s}s* |
| right password, unconfirmed | **403** | *Email not confirmed* — newly reachable |
| right password, 2FA on | 200 + 2FA pending token | — |

Response **shape** is unchanged. Two integration tests pin it (right password → 403 + message; wrong
password → 401 and `AccessFailedCount == 1` on the row), and the old test that asserted the buggy 401 is
gone. Verified here against the backend source, not just the reply: `PasswordSignInFlow.cs:82-114` for the
order, `:46-47` for both 403s, `:152` for the lockout text.

**The frontend half — the queue was wrong that there was none.** Both the ask and §14 said *"Nothing on
this side changes; the client branch is already right."* It was not. `LoginView.vue`'s 403 arm matched
lockout with `generalErrors.includes('User locked out for')` — array-element **equality** against a string
the server never sends (the real text is interpolated, `"Too many failed login attempts. Try again in {m}m
{s}s"`), and the only substring match for it sat in the **401** arm, which lockout has never used. So the
lockout branch was dead at both statuses. That was already known and dismissed as harmless in the `auth/U4`
verification row — correctly, as far as it went: the lockout text is not equal to `'Email not confirmed'`
either, so it fell through to the generic `generalErrors[0]` arm and showed the server's own unlocalized
English. What made it worth fixing now is that **both** outcomes are 403, so the two are separated by
message alone and a branch that never fires is one edit away from being a branch that fires on the wrong
thing — a locked-out user offered the resend-confirmation panel.

- **Fixed 2026-09-15** in `src/_common/modules/user/view/LoginView.vue` (framework submodule; generic —
  it keys off the framework backend's own messages, no app strings). The `Too many failed login attempts`
  substring match is hoisted **above** both status arms, so it wins whatever status carries it (older
  framework versions answered 401 for lockout), and `'Email not confirmed'` is only reached once lockout is
  ruled out. `vue-tsc --build --force` clean.
- **Needs the two-commit dance:** commit inside `src/_common`, then the pointer bump in the app.
- **`auth/U4`'s "dead code, harmless" note is now stale** — the dead line is gone, and the lockout snackbar
  reaches the intended branch instead of the `!handled` fallback. The user-visible text is the same
  (server-only English countdown), so the row's ceiling observation still stands.

**What it unblocks.** The `emailConfirmationNeeded` snackbar and resend panel are drivable end-to-end for
the first time (register, don't confirm, sign in with the right password). `auth/U2` (the 2FA login dialog)
loses its §14 gate: confirm a throwaway and the flow reaches the 2FA gate and returns the pending token —
route (b) in that row is now open, and only the seed ask (route (a)) remains optional. `auth/U4` loses its
§14 caveat too: wrong passwords against an unconfirmed account now feed lockout like any other, so a
throwaway can be locked out on purpose without confirming it first — five wrong passwords, and the fifth
returns the lockout 403, not a 401. `FW9` is untouched and still open: the *Forgot password?* click is no
longer the natural next move for an unconfirmed user, but its reset mail still points at a route that does
not exist.

### §15 — ✅ RESOLVED 2026-09-15 (backend landed; no frontend half, and it settles `F67`'s open decision). `POST /api/activity-history` accepted a zero-length row

**The ask, as it stood in the queue** — found reading `history-capture/B4`'s request in the fourteenth pass.
`ActivityHistoryValidator` was `RuleFor(x => x.Length).Must(x => x.TotalSeconds >= 0)` (*"Length must be
non-negative"*), and unit 4's round-2 body `{"length":{"hours":0,"minutes":0}}`, posted from the Pomodoro
view, came back **201** (`id 15503`). A history record of nothing is not information on any read path — the
dashboards sum it, the timeline draws a zero-width block, the calibration average divides by it. `F67` is the
client half (three capture views, three different answers to "what if the session rounds to zero?"), but a
validator stopping at `>= 0` lets the **next** client write the row again: the desktop tracker's attribution
sink, a future import, a script. **The ask:** `> 0`, a message the interceptor can show, one integration
test — plus an open question about the minimum unit (sub-minute rows, or a minute floor). Written up as
`prompts/view-docs/backend/B17-activity-history-accepts-zero-length.md`; graded small, not blocking.

**The answer, 2026-09-15.** Taken as written. `ActivityHistoryValidator.cs` is now `Length.TotalSeconds > 0`
with *"Length must be positive."*, and **`POST` and `PUT api/activity-history` share the validator**, so an
edit cannot shrink an existing recording to nothing either — a hole the ask did not think to ask about.
Response **shape** unchanged; the rejection answers the existing 400 keyed on `length`
(`{"errors":{"length":["Length must be positive."]}}`), so the interceptor's per-field rendering works as-is.

**The open question dissolved instead of being decided.** The server's `IntTime` is `{hours, minutes}` too —
whole minutes on the wire and in the column, with a seconds constructor that truncates. So the server cannot
carry a sub-minute row any more than `src/_common/dto/dto/Time.ts` can express one (verified here: `hours`
and `minutes`, nothing finer, and `Time.fromSeconds` floors), and `> 0` **is** the one-minute floor. The two
options the ask offered were the same rule written twice.

Two tests pin it (`ActivityHistoryWriteRuleTests`): `{0,0}` → 400 on `length` with zero rows written, and
`{0,1}` → 201 with `EndTimestamp == Start + 1 min` — the second so the floor cannot drift *above* a minute
later. The old suite pinned the opposite on purpose (*"a zero-length recording is legitimate — time-of-day
credits its start hour"*); that rationale was a **consumer's** (the chart counts entries), nothing in the
solution writes a zero row, and the attribution sink already filters `TotalSeconds > 0` — so the test was
deleted as inverted, not kept.

**No frontend half — but it settles `F67`'s only judgement call.** `F67`'s (a) *discard with a message* vs.
(b) *`Math.ceil` to a one-minute floor* is decided as **(a)**, and the reply is explicit that the 400 must
not become the UX: a 30-second stopwatch session rounds to `{0,0}` and now **bounces** where it used to write
a row, which is a snackbar-shaped failure at the wrong end of the flow. The client guard still belongs before
`openDialog(SaveActivityBody)` in all three views; the server is the backstop. `F67` never waited on this and
still does not.

**The seed.** `id 15503` and any other `{0,0}` rows predate this and are the seed's — unreachable from any
client now. Reseed after `F67`'s verification as already planned.

### §16 — ✅ RESOLVED 2026-09-21 (backend `B21` landed in `Sydowwe.Framework`, on the API's working tree at time of writing; frontend half the same day). The lockout 403 carries the instant the lock lifts

**The ask, as it stood in the queue** — `auth/U4`, promoted from *Needs verification* the same morning,
where the source read had named the ceiling: *"the countdown is server-only, so that is the ceiling without
a contract change."* `PasswordSignInFlow.cs:165-172` answered a locked-out sign-in with 403,
`errorType: UserLockedOut` (since `B18`) and one interpolated English string in `generalErrors` — *"Too
many failed login attempts. Try again in {m}m {s}s"* — and the deadline was on the wire nowhere else. So
the client shipped both bad options at once: `LoginView.vue:180-185` substring-matched the sentence and
showed it verbatim in a Slovak UI, and the typed branch `FW24` had added (`httpErrors.forbiddenLockedOut`)
was localised but could only say *"try again later"*, because saying how much later meant parsing prose
the `B18` contract forbids reading. Filed as `B21`
(`prompts/view-docs/backend/_done/B21-lockout-403-carries-no-machine-readable-retry-time.md`, response
appended): one field, `lockoutEndUtc`, on that body only.

**The answer, 2026-09-21 — exactly the shape asked for, with one correction.** `lockoutEndUtc` is on the
lockout 403 body: ISO-8601, UTC, `Z` suffix, seven fractional digits (`new Date()` parses it; do not regex
the digit count), Identity's `LockoutEnd` verbatim. **Absent, not null**, on every other response —
the `EmailNotConfirmed` 403 and the 401 included — so a pre-`B21` server is indistinguishable from an
absent field and the old wording is the compatibility path. Status stays 403, type stays `UserLockedOut`,
the English sentence stays in `generalErrors` for older clients, no `Retry-After` header. Carried by both
transports of `PasswordSignInFlow`: `POST /api/auth/login` and `POST /api/auth/extension/login`. **The
correction:** the 2FA and Google paths do *not* reuse that flow — `POST /api/auth/login/2fa` (and
`/2fa/extension`) has its own lockout branch answering **401** `UserLockedOut` with *"Account is temporarily
locked…"* and no instant, so a user who trips lockout on TOTP codes gets the type without the field and
the absent-field wording is the right rendering there; Google sign-in never meets password lockout at all.
Pinned by `AuthSecurityTests.Login_LockedOut_Returns403_WithLockoutEndUtc` (five failures → 403, type,
sentence still present, field present, ends in `Z`, lands in `(now, now+5m]`) and the `EmailNotConfirmed`
sibling asserting the field absent. Also noted: it is the **5th** wrong password that answers the lockout
403, not a 6th attempt.

**The frontend half, the same day — all in the framework (`src/_common`).** `ErrorHandlingFunctions.ts`:
a `TypedErrorDetails` interface (`{ lockoutEndUtc?: string }`, every field optional, `{}` is the older-API
shape) as a fourth parameter of `resolveTypedHttpErrorMessage` and a third of `handleHttpCodes`; the
`UserLockedOut` arm computes whole minutes to the instant — `Math.ceil`, floored at **1** so a client clock
running ahead cannot read *0 min* — and returns `httpErrors.forbiddenLockedOutUntil` (*"Príliš veľa
neúspešných pokusov o prihlásenie. Skúste to znovu o {minutes} min."* / *"… Try again in {minutes}
min."*), or the unchanged `forbiddenLockedOut` when the field is absent or does not parse.
`axiosConfig.ts`: `extractTypedErrorDetails(error)` beside `extractServerErrorType`, and the interceptor
passes it through. `LoginView.vue:173-185`: the substring match and its seven-line justification are
deleted, **but not replaced by nothing** — the branch is now `extractServerErrorType(error) ===
ServerErrorType.UserLockedOut` → `handled = true`, because the snackbar is one slot where the last call
wins and the view's `!handled` fallback shows `generalErrors[0]`: deleting the branch outright would have
let the raw English sentence overwrite the interceptor's localised one a tick later. The two locale keys
are the framework's; `httpErrors` is deep-merged in `EN.ts` (since `B18`) and SK takes the framework's
namespace whole, so nothing app-side. `docs/{composables,api}.md` updated in the same framework commit.

**Verified live, both halves.** *Fallback:* registered a throwaway through `POST /api/auth/register`,
failed its password five times through the API (the 5th answered `403 UserLockedOut`, still without the
field: the running API process had been built two minutes before `TypedErrorResponse.cs` was saved), then
submitted the same account through `/login` in `playwright-cli` — after waiting out the login throttle
(5/min per IP; the five API calls had spent it and the first browser submit was a 429). The snackbar read
the localised *"Too many failed sign-in attempts. Try again later."*, request `POST /api/auth/login → 403`;
before this change the same submit showed the server's English *"Too many failed login attempts. Try again
in 4m 59s"*. *With the field:* restarted the API on the `B21` source, registered a second throwaway, failed
it **four** times through the API and made the browser's submit the 5th — which keeps the five inside one
throttle window and makes the browser's own request the one that trips the lock. Its body:
`{"statusCode":403,…,"errorType":"UserLockedOut","lockoutEndUtc":"2026-09-21T09:12:12.1729619Z"}`; the
snackbar read *"Too many failed sign-in attempts. Try again in 5 min."* Both throwaways are cleared by the
next reseed.

### §17 — ✅ RESOLVED 2026-09-21 (backend `B22` landed as option (b): framework `6ade033`, host `74318d1`; frontend half and the spec the same day). The 2FA login dialog has a spec, and the QR has its key beside it

**The ask, as it stood in the queue** — `auth/U2`, promoted from *Needs verification* the same morning.
`LoginVerifyQrCode.vue` had never been driven by a spec and unit 15's three rounds could not reach it by
hand: a spec needs a confirmed 2FA-enabled account *and* that account's TOTP secret, and the enrolment
response (`TwoFactorAuthResponse { twoFactorEnabled, qrCode, recoveryCodes }`) carried the secret only as a
base64 PNG of the `otpauth://` URI. Behind the spec's gap sat a user-facing one: an authenticator on the same
device as the screen (a desktop password manager, the app on the one phone) cannot scan it, and there was no
*"enter this key manually"* fallback. Filed as `B22`
(`prompts/view-docs/backend/_done/B22-2fa-login-dialog-unreachable-by-a-spec.md`, response appended) with
two shapes — (b) the key as a string beside the QR, preferred; (a) a seeded `twoFactorUser`.

**The answer, 2026-09-21 — (b), no fixture change, `EXPECTED_FIXTURE_VERSION` stays `e2e-v4`.**
`sharedKey` on `TwoFactorAuthResponse`: the base32 key exactly as Identity stores it (`A–Z2–7`, no padding,
the QR's `secret=`), present whenever `qrCode` is, on every route that returns the record — `/user/2fa/toggle`
(on, first-time and the existing-key re-render), `/user/2fa/reset`, `/auth/login/2fa/setup`, and registration
with 2FA ticked. Not test-only, not environment-gated. Pinned server-side by
`AuthFunctionalTests.SetupTwoFactorForLogin_WithPendingCookie_ProvisionsAuthenticator`, which now computes a
TOTP from the string alone and finishes the login (`auth/login/2fa` → 204). One caution in the reply that the
spec had to honour: **the validate step is single-use per password step** — a wrong code consumes the pending
token, so the wrong-code and right-code assertions each need their own password sign-in.

**The frontend half, the same day — all in the framework (`src/_common`).** `QrCodeFor2FABody.vue` takes an
optional `sharedKey` and renders it under the image in groups of four with a copy button, labelled
`user.enterKeyManually` (*"Nedá sa naskenovať? Zadajte do overovacej aplikácie tento kľúč:"* / *"Can't scan?
Enter this key in your authenticator app instead:"*), plus `user.sharedKeyCopy/Copied/CopyFailed`; optional
so a backend without the field still gets the QR alone. `RegistrationView` passes the key through.
**Found while wiring it, and fixed in the same commit — the body was unreachable from the settings path:**
`SecuritySection.onToggleTwoFactorAuth` showed the recovery codes on enable and *never the QR*, so a user
who enabled 2FA in settings had no way to pair an authenticator except *Show 2FA QR code* — which posts
`/user/2fa/reset`, mints a **new** key and a **new** set of recovery codes, and the handler for *that*
(`onShow2FAQrCode`) discarded the codes it was sent (the `F1` bug, in a third place: the codes the user had
just been told to save were silently invalidated). Both handlers now go through one `showTwoFactorSetup`:
the QR with its key first (titled `user.enablingTwoFactorAuth` on enable — a key that existed and was used
nowhere — or `user.show2FAQrCode` on reset), then the recovery codes when the response carries any.
`docs/modules/user.md` gained a section on it. Not touched: `FW14` (registration still discards its codes —
its own batch), and the *Show 2FA QR code* label, which still reads as a look when it is a reset; noted, not
re-worded.

**The spec — `e2e/tests/two-factor.spec.ts`, a `serial` block under `freshSeed`, `otplib@13` added to `e2e/`.**
On `secondaryUser` (the primary signs in everywhere, the admin is the one `Admin`). Test 1 is
`user-settings/U1`'s enrolment half through the screen: the switch (a `checkbox` role, not `switch`) →
*Identity verification* → password → `POST /api/user/2fa/toggle` read off the wire (`sharedKey` matches
`/^[A-Z2-7]+$/`) → the *Enabling 2FA* dialog with the QR `img` and the key whose text, spaces stripped,
equals the response's → *Done* → *Recovery codes* with as many `<code>`s as the response, *Done* disabled
until the acknowledgement is ticked → the switch checked. Test 2 is `auth/U2`: enrol through the API on
`secondaryPage.request`, then in a signed-out context sign in by form → `dialog "Two-factor authentication"`
→ a wrong code (computed to differ from the live one) → `POST /api/auth/login/2fa` **401** → *Wrong code*
inline, dialog still open, still `/login` → Escape leaves it open (`FW1`'s `persistent` default, pinned as
today's behaviour, not as a fix) → a second form sign-in → `otplib.generate({ secret })` → **204** (NoContent,
not 200) → `/` with the dashboard. A `test.fixme` for the `?redirect=` line names `FW11`. `afterAll` reseeds
so the account leaves the block with 2FA off. Both pass (12 s). **Why its own file:** the block was first
written into `auth.spec.ts`, where it passed alone and failed in the full run — `POST /auth/login` is 5
hits/min per client IP, the run opens with two cold sign-ins, `auth.spec.ts` spends two, and the block's
second was the sixth: a 429 that renders as a stuck `/login` (the trace: `auth/login 200 → login/2fa 401 →
auth/login 429`). `two-factor.spec.ts` sorts after every other sign-in in the suite; a re-run inside a
minute of the last still trips it, and that is documented in CLAUDE.md rather than worked around.

**Re-run against a restarted API, the same afternoon — two more things, one of them a defect.** The block's
test budget is 60 s (`test.describe.configure({ timeout })`): `freshSeed`'s reseed counts against it, and
on the freshly started API it measured 24–26 s per call against ~1.5 s warm, so the default 30 s died at a
random later click with *"Target page … has been closed"*. And test 1 then failed deterministically with
`POST /user/2fa/toggle` → **400 "Optimistic concurrency failure"**: three `hydrateFromServer()` calls on the
way to `/user/settings` (sign-in, boot hook, `UserSettingsView.onMounted`) each pushed the browser time zone
over the seed's `UTC`, and a `PUT /user/preferences` still saving when the toggle loaded the user row tripped
Identity's stamp — which `VerifyUserForm` then reported as *"Wrong password"*. Filed as `user-settings/B3`
→ `FW25`; the spec waits for `networkidle` before enrolling and says so, and that wait is the line to delete
to reproduce it.

**Follow-up, later the same day — the four gaps the landing left were closed in one framework commit:**
`FW25` (with `user-settings/B4`, the sign-out on a wrong step-up password, found while verifying it),
`FW14`, the wrong-code dead end below (the dialog now closes on a refusal with
`authorization.codeRejectedSignInAgain` — the single-use token is the framework's own contract, so the
client does not need the message it is not sent), and the *Show 2FA QR code* button, which now reads
*Reset authenticator app*. `auth.draft.spec.ts:104` is a real registration test. Item (1) below is
therefore historical.

**Two things seen on the way, neither filed as a batch.** (1) After a wrong code the dialog says *Wrong code*
and refocuses the input, but the token is already spent, so every retry from that dialog is a 401
*"Invalid or expired authentication session"* rendered as the same *Wrong code* — the server distinguishes
them (`Unauthorized` vs `InvalidTwoFactorAuthToken`), the client does not, and the only way on is *Cancel*
and the password again. A one-branch client change on `LoginVerifyQrCode`'s catch; recorded here rather than
queued because `FW1`/`FW11` are already open on that file and it belongs in whichever lands first. (2)
`user-settings.draft.spec.ts:49` (*Change password* dialog) fails on a strict-mode violation — `name:
'Password'` substring-matches all three fields; pre-existing, not touched.

### §18 — ✅ RESOLVED 2026-09-21 (backend `B23` landed as asked, API `c00e64d`; frontend half the same afternoon, `c2075f61`, with `F47` folded in). The Android dashboard's "View details for {app}" now opens a real detail

**The ask, as it stood in the queue** — `tracking-dashboards/B2` as narrowed by §79, promoted from *Deferred
to opportunities* item (1) on 2026-09-21 at the owner's request. Not a defect: `F47` was to ship a local
panel (total, share, package) from `props.apps` and said itself not to fetch against an endpoint that did
not exist. But every summary card was named *"View details for {app}"* (`ActivityDomainCard.vue:8`) for a
click that could show nothing more, because no Android response carried a per-app session count, first/last
use or session length — `seconds == totalSeconds` by construction (`AndroidPieChartEndpoint.cs:57-58`),
`totalSessions` span-wide. The rows existed (`AndroidSessionData`: `DeviceId`, `PackageName`,
`SessionStartUtc`, `SessionEndUtc`, `DurationSeconds`). Ask: `GET /activity-tracking/android/app-details`
with desktop's query parameters and window semantics (`ToDailyWindows().Restrict()` on `SessionStartUtc`),
404 on no rows, no invented Active/Background split (`F48`). File:
`prompts/view-docs/backend/_done/B23-android-per-app-detail-endpoint.md` (reply appended).

**The answer, 2026-09-21 — shipped exactly as asked.** `AndroidAppDetailsEndpoint`
(`AdhdTimeOrganizer.Tracking/application/endpoint/android/query/`), pinned by
`TrackingDetailsEndpointsTests` beside its two siblings. Desktop's query contract with `packageName` in place
of `processName`, same base validator (to > from, ≤ 31 days, window pair both-or-neither, 0–1439). Envelope
read on `SessionStartUtc ∈ [from, to)`, then the daily-window mask in the user's zone — a session counts
whole by where it starts, no clipping. `appLabel` is the first non-empty label, falling back to the package;
`lastUseUtc` is the latest session *end*; `meanSessionSeconds` rounds down; `devices` ordered by
`totalSeconds` desc with the raw `deviceId` (nothing friendlier is on the sync payload); `days` kept — one
entry per local calendar day with rows, `YYYY-MM-DD`, no entries for empty days. 404 problem+json *"App not
found."* on no rows after the mask, on `_other` (short-circuited before any query), and on another user's
package (rows are user-scoped). No `activeSeconds`/`backgroundSeconds`. Nothing on the other five Android
responses changed.

**The frontend half, the same afternoon.** `F47` had not landed either, so the panel was built once with both
halves: `getAndroidAppDetails` + `AndroidAppDetailsResponse` (the two `*Utc` fields parsed, `days[].date`
kept as a string), `AndroidAppDetailsPanel.vue` — total / share of period / package instantly from the pie
row, then sessions, average and longest session, first/last use, devices when more than one, days when
more than one with a *+ N more* — and the watcher in `AndroidPieChartSection.vue` keyed on package +
envelope with an `AbortController`. A 404 is worded as *"No sessions of this app in the selected period"*
with no retry and no snackbar (the read is `_silent`); other failures get the section's load-failed +
retry. The close button takes `pieChart.closeDetails`, the key `F46` prescribes. Verified live on the seed:
one `GET …/app-details` per selection, 200, `?selected=Spotify` opens the panel from the URL, a span change
clears the selection (existing dashboard behaviour, same as desktop), *Close details* clears the URL, console
clean. `tracking-dashboards.draft.spec.ts`'s `B2` fixme is a real test.

**One thing seen on the way, not filed.** The API on `:8080` had been started before the endpoint's commit,
so the first live call was a routing 404 with `content-length: 0` — indistinguishable from the endpoint's
own 404 to the panel, which correctly showed the soft sentence. Told apart by the missing problem+json body;
worth remembering the next time a freshly landed ask answers 404.

### §19 — ✅ RESOLVED 2026-09-21 (backend `B24` landed as asked, on the API's `dev` working tree at the time of writing; frontend half the same evening, with `F16` folded in). Both distinct-entries grids now say which rule already covers each tuple

**The ask, as it stood in the queue** — `tracking-settings/B5`, re-graded `opportunity` in §103, promoted
from *Deferred to opportunities* on 2026-09-21 at the owner's request. The ledger is the raw observation
record by design (the heartbeat stores a to-activity match *and* attributes it,
`DesktopActivityHeartbeatEndpoint.cs:87-113`; only `IsIgnored` drops), so the row reappearing after a rule
is created is not a defect — but nothing told the user which rows still needed a decision, and the client
could not join the two grids: the match is first-match-wins in specificity order over pattern match types,
active rules only, and the distinct row's `id` is `Min(e.Id)` of the ledger. Ask:
`coveredBy: { mappingId, target, targetName } | null` per row on both `/grid`s and a
`coverage: All | Uncovered | Covered` filter, default `All`, under `B11`'s conventions, not sortable
(`B20`). One thing found while writing it: `AndroidSyncEndpoint.cs` never reads
`TrackerAndroidMappingByPattern` — Android rules were CRUD-only and applied to nothing — put to the backend
as a question (not yet vs. by design). File:
`prompts/view-docs/backend/_done/B24-distinct-entries-say-which-rule-already-covers-them.md` (reply
appended).

**The answer, 2026-09-21 — shipped exactly as asked.** `coveredBy` on every row of both grids, resolved by
the server's own matcher (the heartbeat and the grid call the same class, so the chip cannot disagree with
attribution): `null` when no *active* rule matches; otherwise `{ mappingId, target, targetName }` with
`target` one of `Activity | RoleOrCategory | Ignored` and `targetName` the activity name, the role and/or
category joined with ` · `, or **`null` for `Ignored`** — written, not omitted, so nullable not optional.
Inactive rule → uncovered (the visible half of `tracking-settings/O1`); ignore rule → covered, and those
rows drain over retention. `coverage` on both filter records: absent/`null`/`All` = the full record as
before; `Uncovered` / `Covered` materialise the whole sorted distinct set, resolve, filter, then page — so
`itemsCount` is **exact** in every mode and sort order is unchanged. Undefined value → 400. Not sortable
(computed after the query; the framework's nested-object 400). `GridFilterFieldNameTests` pins the
camelCase spelling on both grids. **Android answered:** the sync does not apply rules at ingest today and
nothing records whether that is "not yet" or "by design", so the Android grid ships the same field and
filter, meaning "an active rule exists that would match this pair", resolved through `AndroidMappingRuleSet`
— the class the sync will use if it ever applies rules, so nothing on the wire changes if it does.

**The frontend half, the same evening.** `dto/enum/MappingCoverage.ts` (`MappingCoverage`,
`MappingCoverageTarget`), `dto/response/MappingCoverageResponse.ts` (`fromJsonOrNull`), `coveredBy` on both
`Tracker*DistinctEntriesResponse`, `coverage: MappingCoverage | null = null` on both
`*DistinctEntriesFilterRequest` (the mappings filters inherit it; the API skips unknown members, checked).
`component/settings/MappingCoverageChip.vue` — a tonal chip with the target name (or *Ignored* with an
eye-slash) whose `to` is `…/settings/mappings?mappingId=N`; muted italic *Undecided* for `null`.
`MappingCoverageToggle.vue` — All / Undecided / Covered, `All` modelled as `null`, applies on click (unlike
the text fields, which wait for *Filter*). *Rule* column on both tables, `isSortable: false`.
`composable/useCoverageUrlState.ts` — `?coverage=` read on setup and written by the **same handler that
reloads**, no watcher, which is how `F15`'s two-writer trap is sidestepped: `edit()` still mutates the
filter and pushes in one tick, and nothing else writes the URL. The tab links carry the query so switching
tabs and back keeps the view; *Clear* keeps it too (it is the view, not the rule pattern); `edit()` pushes
the distinct-entries route with the coverage and without `mappingId`. The grid reloads after *Save* so the
new rule's chips appear at once. **Default stays `All`**, decided here rather than in the ask: `edit()`
lands on this tab with the rule's pattern pre-filled, and `Uncovered` would hide the very rows that rule
catches; `Uncovered` is one click and bookmarkable. Framework: `DataTable` gained a generic
`highlightedId?: string | number | null` (tints the matching row `bg-primary-container`, off by default),
forwarded by `BasicTable`, documented in `components.md`; both mappings tables pass `route.query.mappingId`
through it. There is no `id` filter and no GET-by-id on the mappings grid, so the deep link can only tint a
rule that is on the loaded page — fine at today's rule counts, an ask if lists grow past a page.

**Verified live on both platforms** against the seed: the two `rider64.exe` rows read *Desk Research* and
the other four *Undecided*; *Undecided* → `?coverage=Uncovered`, 1-4 of 4, and a cold load of that URL
restores the toggle; *Covered* → 1-2 of 2; *All* clears the query. Chip → `mappings?mappingId=21001` with
that row tinted; edit from it → `distinctEntries` with `rider64.exe` / Exact prefilled. Android: Spotify
reads *Read a Novel*, *Undecided* lists the other four, chip → `mappingId=21101`, row tinted. Five new
tests in `tracking-settings.draft.spec.ts` (the *Rule column and coverage filter* describe) pass; the
draft's other nine still fail on its own `beforeEach` (`getByRole('heading', …)` — `VCardTitle` renders a
`div`), which fails identically with the view change stashed and is that spec's, not this batch's. `B5`
and `B4` closed in `findings.md`; `usecase.md`'s *"not-yet-considered"* sentence rewritten to say what the
list is and where the not-yet-considered view lives.

**Two things fixed on the way.** `F16` (below, in *Closed batches*) — the toggle pushed the *Mappings* tab
out of the 1440 header outright, so the wrap could not wait for `F13`. And `DismissibleMappingHint` gained
`flex-grow-0`: Vuetify's `.v-alert { flex: 1 1 }` had been swallowing the table's height in the views'
flex column — visible in the docs' own screenshot, never filed.

### §20 — ✅ RESOLVED 2026-09-21 (backend `B25` landed in `Sydowwe.Framework` and the API, on their working trees at time of writing; frontend half the same day, in `vue_framework`). The 2FA login's 401 names its cause, and the lockout row carries the instant

**The ask, as it stood in the queue** — `B21`'s response had named and declined it (*"a separate small
ask"*), filed 2026-09-21 at the owner's request so the lockout contract closed on both flows, low priority.
With one correction to that response, read from the source: `BaseValidateTwoFactorAuthForLoginEndpoint.cs:46-51`
did `AddError` + `Send.ErrorsAsync(401)` and never stamped `result.ErrorType`, so the 401 carried **no
`errorType` at all** — not `UserLockedOut` — for any of its three causes (expired/consumed session, locked
out, wrong code), and `LoginVerifyQrCode.vue` rendered all three as the code being refused. Ask: (1) the
type on all three 401s, (2) `lockoutEndUtc` beside it on the lockout row, (3) a decision on whether the code
that *trips* the lock answers `UserLockedOut` or `InvalidTwoFactorAuthToken`. File:
`prompts/view-docs/backend/_done/B25-2fa-login-lockout-carries-no-type-and-no-instant.md` (reply appended).

**The answer, 2026-09-21 — all three, and the correction confirmed live.** Status stays 401 everywhere;
the body now carries `Unauthorized` (pending cookie/token missing, malformed, expired, consumed, user gone),
`UserLockedOut` + `lockoutEndUtc` (locked already, *or by this very code* — the decision is **yes**:
`IsLockedOutAsync` is re-read after `AccessFailedAsync`, as `PasswordSignInFlow` and Identity's own
`PasswordSignInAsync` do), or `InvalidTwoFactorAuthToken` (wrong, below the threshold). `/auth/login/2fa/setup`
got the same `Unauthorized` on both of its 401s, so one *session expired* arm covers the whole 2FA login
surface. The mechanism was fixed at the root rather than at the site: FastEndpoints' `Send.ErrorsAsync(int)`
has no slot for the type, so it had to be stamped on `HttpContext.Items` on a separate line — which is how
it was forgotten and why `B18`'s bare-`ToStatusCode` scan never saw it. Now a typed
`Send.ErrorsAsync(errorType, status, [lockoutEnd])` overload does both in one call, the stamp-only helpers
are `internal`, and a Roslyn guard (`ErrorStatusBypassGuardTests.NoFailedResultBranch_SendsErrorsWithoutTheType`)
walks every `if (x.Failed)` branch in production code and fails on any untyped send — 18 sites migrated,
one of which the first regex had missed. Pinned by four `TwoFa_Extension_*` tests in `AuthSecurityTests`
(already locked; wrong code that trips the lock; wrong code below it, type present and instant absent;
replayed token now asserts `Unauthorized`), 550 green on the touched surfaces.

**Wider than the ask.** The same migration typed every auth 4xx that used to be a bare status — recaptcha
failures (`RecaptchaTokenInvalid` / `RecaptchaWrongAction`), a taken registration address (`Conflict`, so
the sign-up form is never offered *"pick another value"*), Identity policy refusals (`IdentityError`), 2FA
provisioning with no e-mail (`MissingArgument`), an expired Google code (`Unauthorized`) — additively, no
status changed. The one status change: `/activity/{id}/clone`, `PUT …/quick-edit` and `PATCH …/archived` had
drifted from the CRUD bases and answered a DB refusal with a bare 400; they now map to 409 with the DB type
(`DbUniqueViolationError` on a duplicate name) like `POST /activity` does, so `B18`'s *"pick another name"*
wording applies with no special case. Recorded in the queue as *not filed*: the new auth types are each a
wording decision for their own view and none was asked for here; the activity status change needs nothing
client-side (no call site special-cased those 400s).

**The frontend half, same day — all in the `vue_framework` submodule.** `ServerErrorType` declares
`Unauthorized` and `InvalidTwoFactorAuthToken`; `resolveTypedHttpErrorMessage` gains a **401 arm for
`UserLockedOut` only**, sharing the 403's `lockedOutMessage(details)` so the countdown is the same
`httpErrors.forbiddenLockedOutUntil` from `lockoutEndUtc` on both flows. `LoginVerifyQrCode.vue`'s `catch`
branches on `extractServerErrorType(error)`: `UserLockedOut` → `handleHttpCodes(401, type,
extractTypedErrorDetails(error))`; `InvalidTwoFactorAuthToken` → the existing
`authorization.codeRejectedSignInAgain`; `Unauthorized` and the no-type body of an older server → the new
`authorization.sessionExpiredSignInAgain` (SK + EN). The dialog closes on every branch as before — the
pending token is single-use, so a retype could only be refused again. One deliberate deviation from the
response's *"arms for both `UserLockedOut` and `Unauthorized`"*: the resolver is the status-by-cause map the
interceptor and `handleHttpCodes` share, and on a 401 the generic `Unauthorized` says nothing the status does
not, so its sentence stays the dialog's `default` arm rather than becoming a framework-wide 401 wording.
Moot for the interceptor either way — an auth endpoint's 401 rejects before its snackbar branch, which is
why the dialog owns the message. Framework docs (`composables.md`, `api.md`) and the three stale *"the 2FA
branch has no instant"* comments (`common.{sk,en}.ts`, `axiosConfig.ts`) updated in the same submodule
commit. `vue-tsc --build --force` 0, eslint 0.

**The wrong-code row is pinned; the lockout row is not.** `auth/U2`'s `two-factor.spec.ts` (`otplib`)
already submits a bad code and asserts *"The code was not accepted…"* — that is the `InvalidTwoFactorAuthToken`
row, and it passes against the `B25` API (restarted on `1d20f55` the same evening; the process on `:8080`
had been started four hours before the commit). The lockout row needs a 2FA account failing five codes
across five password sign-ins under the 5/min login throttle — the same spec is where it gets pinned when
that is worth a minute of throttle, and the response says the same.

### §21 — ✅ RESOLVED 2026-09-23 (backend `B26` landed on the API's `dev` tree 2026-09-22, uncommitted there at the time; no frontend half). A planner task's `skipReason` is now written by the status PATCH

~~A planner task's `skipReason` is readable and never writable.~~ This was found while verifying `F59`
(`home/B4`, `dfd64a6a`). The home widget's Skip sent `PATCH /planner-task/{id}/status` with
`"skipReason":"Ran out of time"`. The answer was 204, and the next day-plan read returned the task
`Cancelled` with `skipReason: null`. Seen live on seeded task 16003, 2026-09-22.

**Root cause, from the API source:** no request DTO in `AdhdTimeOrganizer.Planning` declared
`SkipReason`, and only tests and the seeder wrote the column. The ask
(`prompts/view-docs/backend/_done/B26-planner-task-skip-reason-never-written.md`, which now carries the
full response) covered three things:
- the PATCH field;
- clearing the reason on leaving `Cancelled`;
- the full PUT staying a non-writer.

**What landed:**
- Free text, trimmed, blank stored as null, capped at 500 characters.
- A reason is stored only on a transition to `Cancelled`, and cleared on any other status.
- A non-blank reason with any other status is a 400; null or blank is fine with every status.
- The PUT never writes the reason, and clears it when its status leaves `Cancelled`.
- **The one deviation from the ask:** that clearing lives in `UpdateEntity` rather than `ApplyStatus`,
  because routing the PUT through `ApplyStatus` would also have cleared the actual times.

**Verified end to end 2026-09-23** once the API was restarted. The `:8080` process on 2026-09-22 predated
the 20:57 edit, which is why the first check still read null. The checks were run on a throwaway task
for today (16008, created through `POST /api/planner-task` and deleted after):
- **Home, skip.** The chip reads *"Skipped: Ran out of time"*, and the day-plan read returns
  `Cancelled / "Ran out of time"`.
- **Home, Restore.** The next read returns `NotStarted / null`.
- **Day planner, skip.** It returns `Cancelled / "Meeting ran long"`, and that survives a reload.
- **Not driven:** rule 3's 400s and the PUT paths, which the client never triggers. The backend's
  integration tests cover them (99 green).

**Found on the way, fixed without being filed:** the day planner's bulk Skip (`DayPlannerView.vue`
`handleSkip`) called the generic `patch()`. That is `PatchPlannerTaskSpanEndpoint`, which maps
start/end only, so a skip there saved neither the status nor the reason. It now calls `patchStatus`
(`d5e57027`).

### §22 — ✅ RESOLVED 2026-09-24 (template suggestions ignored what the user set on the template — `B27`)

Written and landed the same day. The backend did all five parts in the shape asked. The ask and its
response are in `prompts/view-docs/backend/_done/B27-template-suggestions-ignore-what-the-user-set.md`.

**What the backend changed:**
- An active template is now suggested from its own `ScheduledDays` (new pattern type `2`) or
  `SuggestedForDayType` (type `3`), ranked after the history entries (types `0`/`1`).
- One entry per template, and active templates only.
- `PatternLabel` stays the invariant enum name.
- Another account's `calendarId` → 404, now pinned by a test.

**Frontend half, the same day:**
- `planner.templateSuggestions.scheduledFor` / `.suggestedFor` in both locales. EN: *"Scheduled for
  {label}s"* / *"Suggested for {label}s"*. SK: *"Naplánované: {label}"* / *"Určené pre: {label}"*,
  keeping the colon form that needs no inflection.
- `DayTemplatePicker.vue` maps types 2/3 like 0/1 and picks the sentence by type. The `N×` count is
  shown only for history entries.
- The DTO's `patternType` widened to `0 | 1 | 2 | 3`, with a doc comment.
- The client dedupe and `isActive` filter were **kept** as guards against an older API build. The
  response calls them optional, and only part 5 is said to be pinned by a test.

**Verified live, no mocking, on the e2e seed:**
- `/suggestions/997` (Thursday, Workday) → *Office Day* (type 2, Thursday) and *Home Office* (type 3,
  Workday), each once.
- Replayed 8 times, sequential and concurrent: the same answer every time.
- The planner reads *"Office Day · Scheduled for Thursdays"* and *"Home Office · Suggested for
  Workdays"*, SK *"Naplánované: Štvrtok"* / *"Určené pre: Pracovný deň"*, with no count on either.
- *Office Day* switched off in `/day-planner/templates` → gone from the suggestions after a reload.
  Switched back on → restored (fixture unchanged).
- Console clean. `type-check` exit 0, lint clean.

**Not verified:** a history entry (types 0/1) against the live API. The seed has no calendar with the
same template applied twice on one weekday, so the history ranking and the *"Used on …s · N×"* row were
seen only with the earlier mocked bodies.

**The original §22 paragraph**, as it stood in the queue:

This came out of fixing the template picker's route (log → *Closed verification items*, the unit-7 item).
Once the client called the real `…/suggestions/{calendarId}`, the answer turned out to be empty on the
seed, and structurally empty for any new account. The endpoint reads only a history view: templates
applied at least twice on that weekday or day type. It never reads the template's own `ScheduledDays` or
`SuggestedForDayType`. The repeating-task sibling already returns user-set suggestions before history
ones; this ask is that shape. Three smaller rules ride along (one entry per template, active only, a
stable `PatternLabel`), plus a test-only ownership item.

## Closed verification items

### `B16` two-halves sequencing note — ✅ SETTLED 2026-09-21, the same day it was written: both halves are committed

> Moved out of the queue whole. The note below was true at the sixteenth pass's read of the API working
> tree; by the evening `FoldedRow.cs` and the seven endpoints were committed there as `5e70367` (*Fold the
> sub-threshold tail under one `_other` sentinel on every tracking pie, matching the bars*), and this
> repo's four files as `448931a5`. The §10 tombstone's *"landed the same day"* wording is therefore
> accurate again, the *"guard is a no-op while the server still sends `"Other"`"* caveat no longer
> applies, and a §10 retest on a current build sees `_other` on all four pie endpoints. Nothing to do.
#### As written — `B16`'s frontend half is in this tree, and its backend half is **not committed** in the API's

Escalation §10 is tombstoned as *"backend landed `B16` … frontend half landed the same day"*, and the
frontend half is real — `OTHER_DOMAIN` in `PieSegment.ts` plus the merge guard in
`ActivityPieChartSection.vue` and `UnifiedPieChartSection.vue`, all four files uncommitted in this repo.
The other side is less finished than that wording implies.

| what | state on 2026-09-21 | what settles it |
| --- | --- | --- |
| `FoldedRow.cs` (`Sentinel = "_other"`) and the seven endpoints that now reference it | **untracked / modified in the API working tree** — `git status` in `AdhdTimeOrganizer` shows `?? …/domain/helper/FoldedRow.cs` and seven `M` endpoint files; no commit carries them. The backend re-verified the change later on 2026-09-21 and added a second parity theory (`StackedBars_FoldTheTailUnderTheSameSentinelOnEverySource`, 15/15 green) — **and said "still on dev, uncommitted" again** | Commit them there, then re-drive one pie dashboard. Until then the four pie endpoints still send the literal `"Other"` on any server you can actually reach, so the legend shows an untranslated *Other* and §10's (a) and (b) both still reproduce |
| the double-fold collision — *"please confirm the merge path sums rather than overwrites"*, the one question the backend asked back | **answered from the code, no browser needed: it sums.** Both sections accumulate into a single `otherSeconds` and push one segment (`ActivityPieChartSection.vue:126-146`, `UnifiedPieChartSection.vue:243-253`); the new guard (`d.domain !== OTHER_DOMAIN && percent >= threshold`) sends the server's folded row into that accumulator unconditionally, so a server row above the local 3 % threshold merges instead of surviving as a second identical legend entry | ✅ Replied 2026-09-21 — *FRONTEND ANSWER* appended to `_done/B16-…`, together with "nothing to do" on their History follow-up offer (`F84` is the client, the builder was already `_other`). No test needed |
| two fold thresholds for one concept (server `minPercent: 1`, client 3 %) | unchanged, and now commented in both sections | Deliberately deferred — it is `tracking-dashboards` deferred item (2), not a defect |

Not a finding against either repo, and **not** a reason to revert anything here: the guard is a no-op
while the server still sends `"Other"`, so this side is safe to commit in either order. It is a
sequencing note, and the reason a retest of §10 done today would fail for the wrong reason.

### §91 — ✅ SETTLED 2026-09-16 (fifteenth pass), in the mundane direction: the snackbar fires

> Moved out of the queue whole. The open question was whether a 400 from the leisure create forms was
> reaching the user at all, because three units had reported three different things about the same
> interceptor path. Unit 11's round 2 answers it in its own `B3`: *"a snackbar reading 'One or more
> errors occurred!' appears and disappears within a few seconds with no way to tell which field was the
> problem."* So round 1's `X3` poll (1.8 s, six DOM samples, no `.v-snackbar`) was simply wrong — most
> likely a `find` scoped to the dialog, which is the first of the two explanations the item itself
> offered — and **there is no intermittent in the framework**, which was the alarming branch. The source
> reading recorded below was right the whole way through.
>
> What round 2 *did* newly confirm is a different claim, and it is real: querying every `[role=alert]`
> in the form after a rejected submit returned four empty strings, on **both** the backlog and the
> bucket-list forms. That is the absence of a **field-level** error, not of a snackbar, and it is now
> `F77` together with the missing `required` rules that let the submit happen. The generic wording of
> the snackbar itself stays `FW19`.
>
> The original item, verbatim:

`leisure-backlog-picker/X3` polled the DOM for 1.8 s after *Create* (six samples) and saw **no
`.v-snackbar`**; `leisure-bucket-anchors/B2` on the same shape of 400 says *"a snackbar may have fired
and auto-dismissed before capture — not independently confirmed"*; `activity-settings/X1` on a 400 from
the same `useEntityCommand.create` path **saw** the snackbar (the generic string `FW19` is about). Read
this pass: `axiosConfig.ts:221-228` calls `showErrorSnackbar` for every non-`_silent` 400,
`activityBacklogProfileApi.ts` sets no `disableErrorHandling`, `useRequestState.ts:31` therefore passes
no `_silent`, and `SnackbarComposable.ts`'s `showSnackbar` has no dedupe, no suppression and a 3 000 ms
timeout — so a 1.8 s poll starting after the click should have caught it. There is no path in source by
which this request stays silent. Either the observation is wrong (the poll's selector, or the snackbar
rendered behind the dialog's scrim and the agent was reading a `find` that scopes to the dialog) or there
is a real intermittent in the framework, which would be a much bigger finding than `X3`.

### `leisure-bucket-anchors/U1` — ✅ closed by the unit-12 mutation round, 2026-09-16 (fifteenth pass)

> **`U1`** — the locked *"I did this"* capture flow, never exercised because the seed had no
> not-yet-anchored bucket-list row. Round 2 created one (`Build a Bookshelf`) specifically to reach it
> and drove the whole path: the capture dialog opened with the activity **locked as read-only text**
> rather than a picker, Month/Year defaulted to the current month, Rating defaulted to 5, and saving
> fired `POST /api/memory-anchor` → 201. The row flipped from *I did this* to *Experienced*, the
> progress bar moved 1→2 of 2, and the anchor appeared on `/leisure/memory-anchors` with a working
> *Bucket List* source chip pointing back. No defect. The queue's own note that this path short-circuits
> the missing-endpoint problem (`lockActivity` returns before `onMounted`'s fetch) held exactly as
> written — which is why it was testable while §12 was still open.
>
> Round 2 then deleted that anchor as cleanup and got `U2`'s answer for free: the source row reverted to
> *I did this* and the progress bar to 1 of 2, confirming live what the thirteenth pass had already
> settled from source (`IsAnchored` is computed in SQL at read time, so it cannot go stale). One thing
> worth keeping: this is a **link revert, not a cascade** — deleting an anchor destroys no other row —
> so the plain *"Are you sure you want to delete {name}?"* wording is adequate here and correctly does
> **not** trigger `useDeleteConfirmation`'s cascade branch.

### Awaiting retest — code-fixed, never seen in a browser. ✅ Every row closed; moved out of the queue 2026-09-15

> Not a fix batch and not a defect list: these needed one browser session running the named `Verify:` blocks.
> Rewritten in the fifth pass against `todo-routine`'s round 5 (2026-09-13, live, fresh `e2e-v3` seed), then
> finished off by rounds 6–8. Unit 10's round 8 (2026-09-15) re-confirmed both views against round 6/7's
> recorded numbers with no drift; the unit's own tally reads *"every finding this unit ever filed is now
> `fixed and verified`"*. Kept here verbatim as the record.

| finding | what landed | round-5 outcome |
| --- | --- | --- |
| `todo-routine/A1` | counter carries `:title`/`:aria-label` on both branches; native `<button>` (`todo-lists/B6`) | ✅ **verified.** Real `mousemove` → 1 s dwell → `elementFromPoint` → `mousedown`/`mouseup` on both controls: *Increase 0 of 2* hit its `<button class="counter-increment">` and produced 1/2 (`PATCH …/toggle-is-done {forceValue:true}` → 204, no dialog); *Decrease 1 of 2* resolved to the decrease button on two separate items. The "mouse can decrement but never increment" hypothesis is dead against this build |
| `todo-routine/B3` | `RoutineToDoListForm.vue:28` → `routineTodoList.timePeriod` | ✅ **verified** — label *Time period*, console clean across the open |
| `todo-routine/B4` | `/routine-settings` + `TimePeriodForm` localized; `useAnchorDayOptions()`; `Intl.PluralRules` ordinal | ✅ **verified in SK** — *Časové úseky*, *PRIDAŤ*, all headers, *Pondelok* in the anchor column; ordinal `1` → "1." (SK) and `1`/`21` → "1st"/"21st" (EN). **One header stayed English — "Color" — and that is `F25`**, a different cause (empty title, not a literal) |
| `todo-routine/B6` | `routineTodoList.streakTooltip` / `.gracePeriodActive` | ✅ **verified in SK** — *"Séria: 12 · najdlhšia: 30"* read off the teleported tooltip. Undo-tooltip half not re-hovered; its label is the same computed `A3` verified |
| `todo-routine/A3` | `TodoListUndoBtn.vue:12` `:aria-label="label"` | ✅ **verified** — `aria-label: "Nothing to undo"` on the disabled button; enabled-state wording not exercised |
| `todo-routine/P1` | fixed `:width`/`maxWidth` replaced by a `minWidth` floor | ✅ **SK verified (round 7, 2026-09-14)** — *Celkový počet* in full, label `scrollWidth 101 === clientWidth 101` in a 377 px field. Both locales closed |
| `todo-routine/A2` | `BaseTodoListItemSteps.vue:11-13` `:title`/`:aria-label`/`:aria-expanded` | ✅ **verified (round 7)** on a temporary two-step Daily item: `Hide: Steps` / `aria-expanded=true` → click → `Show: Steps` / `false`, step list gone. Item deleted afterwards |
| `todo-routine/B9` | `RoutineSettingsView.vue:163-201` — `_silent` 409 → `deleteBlocked` / `deleteBlockedUnknownCount`, count fetched only in the failure path, row kept | ✅ **verified (round 7, 2026-09-14, exclusive account)** exactly as the runbook prescribed: 11-day period + one item → Confirm → `DELETE …/17` **409**, snackbar *"Can't delete "RT eleven" — 1 routine is still assigned to it. Move or delete it first."*, row kept, count fetched in the failure path. Item removed → Confirm → **204**, row gone. Throwaway rows cleaned up. **And the dialog check it was merged with came back positive — see the `BasicTable` entry below** |
| *(unfiled)* | `TodoListStepsFormField.vue`'s four step controls now named, position-qualified | ✅ **swept (round 7)** — Add dialog with two steps: *Move step 1 up/down*, *Delete step 1*, *Move step 2 up/down*, *Delete step 2*, *Add step*; **0 unnamed** buttons in the dialog |
| `todo-lists/B3` | ✅ **fixed for real 2026-09-13** — it was *not* fixed silently: the round-2 edit moved the emit above the multi-count branch, so a row-body click on a counted item still stepped the counter *and* opened the dialog | closed; `Status:` line corrected; spec pins it |
| ~~`todo-routine/B10` (`F24`)~~, ~~*(unfiled — `F25`)*~~ | both verified 2026-09-14 (`todo-routine/B10`'s own entry: SK forms on every card, the heatmap tooltip, the history dialog, the freeze chip, then EN without a reload; `F25` in *Closed batches*) — these two rows had lagged the summary table by two passes | ✅ moved here (fourteenth pass) |

### Seed-data gaps — the three routine rows, ✅ all closed by `B8` + rounds 6/7

> Moved out of the queue 2026-09-15 with the *Awaiting retest* table. The queue keeps the one row that is
> still open (desktop mappings past one page, for `F12`'s second verification step).

| what was seeded | unblocked |
| --- | --- |
| ~~≥1 routine time period with `totalPeriodsElapsed > 0` and non-empty `completionHistory`~~ — **`B8` done, `e2e-v4`** | ~~`todo-routine/U1`, `U2`~~ ✅ both verified live, round 6 |
| ~~≥1 routine item with `streak >= 30` (ideally 90/180/365 too)~~ — **`B8` done, `e2e-v4`** (45 / 120 / 200 / 400) | ~~`todo-routine/U2` (milestone icons)~~ ✅ all five icons verified live, round 6 |
| ~~≥1 **routine** item with steps~~ — **moot**: `todo-routine/A2` was verified in round 7 (2026-09-14) on a temporary two-step Daily item created and deleted in-session, and the `TodoListStepsFormField` sweep ran on the same dialog | ~~`todo-routine/A2`~~ ✅ both closed, round 7 |

### `todo-lists/U1` and `home/U1` — ✅ closed, moved off *Carried forward* 2026-09-15

- **`todo-lists/U1`** — re-graded 2026-09-13 to *settled, superseded by `B4`/`FW3`*, both of which are
  closed; the whole banner flow is pinned by four tests in `todo-motivation.spec.ts`.
- **`home/U1`** — settled by the unit-1 mutation round (2026-09-15): a forced 500 on
  `calendar/day-plan/**` rendered the error/Retry state in both widgets and Retry re-fired; the case
  where it is unreachable is the sign-in race, folded into `F8`.

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

### `activity-settings/U1` and `U2` — ✅ closed by the unit-2 mutation round, 2026-09-15 (thirteenth pass)

Moved from the queue's *Needs verification* verbatim, with the round-2 outcome on top of each.

| finding | what settles it | note | round-2 outcome |
| --- | --- | --- | --- |
| `U1` — the *"no archived activities"* empty-state copy | one look at `/activity-settings/activities?archived=archived` signed in as the **`secondaryUser`** (the `secondaryPage` fixture), if that account seeds no archived activity — check `e2e/.state/seed.json` first rather than assuming | Seed-data shape, not a defect. If the second account also has one, it needs a throwaway account or a `test.fixme` naming this row | ✅ **verified, no defect** — the round un-archived the seed's only archived activity to empty the view, read `activities.archive.noneArchived` (*"Nothing has been archived yet."*) with no create button (`TableEmptyState`'s `v-if="!isFiltered"`), then re-archived it (`screenshots/activities--archived-empty-mutation.png`). A cheaper route than the secondary account, and it restored the seed |
| `U2` — what a Delete on a system/referenced role or category does server-side | **settled from the API source this pass**, no browser needed: a role → **409** with a user-readable message on both the `systemKey` and in-use paths (`DeleteActivityRoleEndpoint.cs:42-62`); a category → **204**, and every activity under it has its `categoryId` set to `null` (`DeleteActivityCategoryEndpoint.cs` is a bare `BaseDeleteEndpoint`, FK `SetNull` at `ActivityConfiguration.cs:42`). Neither path deletes an activity or its history | `F19` is built on this answer. The unit's caution about the seed's system roles was well placed for the wrong reason — a role delete could never have destroyed them; a *category* delete on the seed would have silently unfiled ten activities | ✅ **browser-confirmed for the role half** — Delete → Confirm on *Planner task* → `DELETE /api/activity-role/4` **409**, row kept, server message *"This is a system role the app files quick-created activities under, so it cannot be deleted. You can rename it instead."* — **not shown**; the snackbar read the generic string, which is the new `B9` → `FW19`. The category half was not clicked (it would have unfiled ten activities on a seed the round chose not to reset) and stands on the source read |

### `home/U1` — ✅ closed by the unit-1 mutation round, 2026-09-15 (thirteenth pass)

> **`home/U1`** — widget error/retry states never seen against a real failure. Force a 500 on one of the six
> widget endpoints (`playwright-cli route`) and confirm only that widget shows its error/Retry state, the
> other five are unaffected, and Retry re-fires.

✅ **Verified, no defect in the error UI.** `playwright-cli route` on `calendar/day-plan/**` → 500 on a plain
reload: both `NowBar` and `DayPlannerWidget` rendered `home.loadFailedPlan`/`home.noCalendar` with a working
*Retry* (`DayPlannerWidget.vue:94-112`), and Retry re-fired the request and rendered the plan once the mock was
removed. H6's fix is real. **The same 500 forced *during* a fresh sign-in** produced a spinner that never
resolved — that is not the error UI's gap, it is the third variant of the sign-in race and lives in `F8`
(`resetTodayPlan()` sets `loading = true` after `load()`'s `finally` has cleared it). The other five widgets
were not individually forced; the finding is folded into `B2` by the unit and this log agrees.

### `leisure-bucket-anchors/U2` — ✅ settled from source, 2026-09-15 (thirteenth pass)

> **`U2`** — Effect of deleting a memory anchor on its source profile's `isAnchored` flag not verified. A
> mutation-pass session should delete the anchor for *"Learn Bouldering"* and confirm whether the
> bucket-list row's Experienced chip reverts to *"I did this"* or stays stuck showing *"Experienced"* with a
> dangling `memoryAnchorId`.

`IsAnchored` and `MemoryAnchorId` are **not stored on the profile**. `GridActivityBucketListProfileEndpoint.cs`
overrides the projection so both are computed in SQL from the anchors table at read time — its own comment at
`:24-25`: *"Overridden so IsAnchored / MemoryAnchorId are computed in SQL rather than overlaid afterwards"* —
and the `IsAnchored` filter is `anchors.Any(m => m.ActivityId == p.ActivityId)` (`:50-55`); the backlog grid
does the same (`GridActivityBacklogProfileEndpoint.cs:53-60`). A deleted anchor therefore cannot leave a
dangling flag: the next grid read simply does not find it. There is no defect to observe; the mutation pass
may still click it, and the chip will read *I did this* again.

### `tracking-settings/U1` — ✅ confirmed by the unit-6 mutation round as `X4`, 2026-09-15 (fourteenth pass)

The source-only prediction (no `@onDelete` on either `<BasicTable>`, so `BasicTable`'s `emit('onDelete')`
fires into nothing) was reached through `F12`'s `focus()` + Enter path and observed on both platforms:
Confirm closes the dialog, `playwright-cli requests` shows no `DELETE`, no snackbar, the row stays. The
unit renumbered it `X4` (`blocker`) and marked `U1` `stale`; `F13` closes it. Moved here as written in the
third pass:

| finding | what settles it | note |
| --- | --- | --- |
| `tracking-settings/U1` — the mapping delete button reaches nothing | run its *What would verify it* after `F12` **and** `F13` land: a `DELETE …/tracker-desktop-mapping-by-pattern/{id}` fires and the row is gone after reload | Kept `unverified` per rule 5, but it is source-certain (`DesktopMappingsTable.vue:36` declares only `edit`; `BasicTable`'s `hasDelete` default renders the button anyway). `F13` wires it; the retest also answers the dialog question above |

And the *"dialog question above"* — the fifth pass's "`BasicTable`'s delete-confirm dialog never closes"
item, fixed in `vue_framework` `98b92d0` without a browser — is answered by the same observation: the
dialog **closes** on Confirm today, on two tables whose handler is dead. First browser confirmation of
that fix from the app side.

### `history-capture/U1` — ✅ reproduced by the unit-4 mutation round as `B6`, 2026-09-15 (fourteenth pass)

Both halves settled. The double-submit half exactly as the eighth pass read it — `dblclick` fires two
`POST /api/activity-history`, and the second is a **409** from the server's unique index
`(UserId, ActivityId, StartTimestamp)`, which the unit guessed and this pass confirmed at
`ActivityHistoryConfiguration.cs`. The reset half — which §53 called unsourced — is settled by the same
index: `dateTime` is set once at mount and never advances, so *any* second submit of the form after a
success is the same 409, rendered as *"error saving"*. `F68` is the batch. Moved here as the eighth pass
wrote it:

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — manual entry form: no in-flight guard, no reset after save | **The double-submit half is source-certain** and stays out of a batch only by rule 5: `AddActivityManuallyView.vue:36-38`'s `handleSave` is `await formRef.value?.saveActivity()` with no re-entry flag, `AddActivityManuallyForm.vue:63-82` sets nothing while `await saveActivityToHistory(…)` → `create(…)` is pending, and the button at `View.vue:17-23` has no `:loading`/`:disabled`. Two clicks before the first `POST /api/activity-history` resolves are two `create` calls; there is no other code path. The unit's own *What would verify it* is right and belongs to the **mutation pass**: fill a real activity and a non-zero length, click *Record activity to history* twice inside the round trip, count the `POST`s in `playwright-cli requests`, then reseed. **If confirmed, a low-effort app batch next run** (`F39`): a `saving` ref in the view that gates `handleSave` and binds `:loading` on the button — the same shape as `TimerPresetDialog`'s confirm | **The reset half is not sourced.** *"Either the form clears … or the button disables"* — the second clause is plain user sense; the first is taste. No intent source (`prompts/_done/activity-history/`, `prompts/_done/activity/A6-selection-form-api.md`) says what the form should do after a save, and a user logging several spans of one activity plausibly wants the activity and date kept and only the length cleared. If the batch adds a reset, decide *what* resets from that use, not from the timer views' Stop → clear pattern, which is a different flow (a session ends; a form does not). Re-graded in place: the finding stays `unverified` as filed, but its two halves have different standing (§53) |

(The "`F39`" the eighth pass reserved was taken by `auth/B1`'s write half in the ninth; the batch is `F68`.)

### `auth/U1` and `auth/U5` — ✅ closed by the unit-15 mutation round, 2026-09-15 (fourteenth pass)

`U1` is **observed**: round 3 registered a throwaway with 2FA ticked, read five `recoveryCodes` off the
`POST /auth/register` response body, and the dialog showed the QR and a *Done* button only
(`registration--2fa-qr-dialog-no-recovery-codes.png`). The unit renumbered it `B8`; the batch is
`FW14`, with the six-line fix the ninth pass wrote in this row. `U5` is **resolved, no defect**: after
the same registration, `/login` rendered the prefilled e-mail, the autofocused password field and the
*Resend confirmation email* panel — all three claims of `LoginView.vue:134-138`
(`login--redirected-from-registration.png`). Both rows moved here as the ninth pass wrote them:

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — registration's 2FA recovery codes are received and discarded | **Source-certain; observable after `FW13`.** `RegistrationView.vue:152-161` tests `response.data.recoveryCodes` for truthiness and then opens `QrCodeFor2FABody` with `qrCodeImage` only; the component declares exactly one prop (`QrCodeFor2FABody.vue:15-17`). The server does send them: `TwoFactorAuthResponse.cs:7-9` is `{ twoFactorEnabled, qrCode, recoveryCodes }` and `BaseRegisterUserEndpoint.cs:86-113` returns it. **And the fix already exists one file over:** `SecuritySection.vue:196-197,269-281` shows codes once after a settings-side enrolment through `RecoveryCodesBody` (`prompts/_done/user/framework/F1-…` landed for that path and missed this one). The check, after `FW13`: register a throwaway address with *use 2FA* ticked → QR dialog → *Done* → **no** recovery codes anywhere; reseed | Rule 5 keeps it out of a batch until seen; when it is, it is **`FW14`**: after `open2FADialog` resolves, `await openDialog({ component: RecoveryCodesBody, componentProps: { codes: normalizeRecoveryCodes(response.data) }, dialogProps: { title: t('user.recoveryCodes'), confirmBtnLabel: t('general.done'), hasCloseBtn: false, persistent: true, isSmall: false } })` before `goToLogin()` — six lines, the same call `SecuritySection` makes, with `normalizeRecoveryCodes` lifted into `utils/`. The user-facing stake is the finding's own sentence: a brand-new account whose owner loses the authenticator has no way back in |
| `U5` — "redirected from registration" login prefill | **Unblocked by `FW13`** — its verification block *is* this check (a completed registration lands on `/login` with the e-mail prefilled and the resend panel shown). Mechanism read: `RegistrationView.vue:151` sets `userStore.currentUser.email`, `LoginView.vue:134-138` reads `userStore.userName` on mount. One caveat the unit did not name: `userName` is persisted (`authStore.ts:79`, `localStorage`), so the prefill also fires for anyone who was signed in on this browser before and signed out — `logout()` resets `currentUser` to `new User()` (`:63-66`), so after a *clean* logout it is empty, but a session that expired (the interceptor's `logoutClient` → `auth.logout()`) goes through the same reset. Fine as far as read; worth one look that the resend panel does not show for an already-confirmed returning user | Closes with `FW13`'s retest |

The `U5` caveat (a returning, already-confirmed user seeing the resend panel) was not looked at by the
round and stays a one-look item — recorded here, not re-listed in the queue.

### `auth/U6` — the unit still lists it open; the queue settled it in the ninth pass (§64)

Not a change of state, a note so nobody reopens it: unit 15's round 2 made a fourth attempt, saw no stuck
spinner, and kept `U6` `unverified` because it had not read §64. Its one new fact — a no-params visit's
`POST /auth/confirm-email` answers **415**, not a network error, because `API.post('/auth' + fullPath)`
sends no body — is adjacent to `FW12` and is folded there (guard the missing query before posting).

### `todo-routine/B10` (`F24`) and the `F25` header — ✅ verified 2026-09-14; the *Awaiting retest* rows lagged two passes

Both were ✅ in the summary table since the sixth pass's follow-up and in *Closed batches* below; the two
⏳ rows under *Awaiting retest* were never struck. `todo-routine/B10`'s own entry records the browser
pass (SK forms on every card, the heatmap tooltip, the history dialog, the freeze chip, then EN without a
reload — and two side fixes: a doubled full stop in the SK freeze tooltip, and the history dialog's
heatmap, which had never rendered), and `F25`'s *Farba* header is in its closed body. Unit 10's round 8
(2026-09-15) re-confirmed both views against the round-6/7 numbers with no drift. The table in the queue
now reads all-closed; it goes to this section next pass.

### `tracking-dashboards/U1` — ✅ closed 2026-09-23 in `F27`'s verification session, as the queue asked

Loading and error states on the tracking dashboards, never exercised before. **Everything the queue
predicted held, and nothing new was filed.**
- **`/activity-tracking` with `web-extension/pie-chart` → 500:** the pie card shows the icon, *Failed
  to load* and *Retry*. `summary-cards`, `stacked-bars`, `focus-metrics` and `timeline` all return 200,
  and there is **no snackbar**. After `unroute` → *Retry*, `requests` shows exactly **one** more
  `pie-chart` (200), nothing else refetches, and the panel populates.
- **Loading half:** `route` with a 6 s delayed `continue` (via `run-code`, because `route` has no delay
  flag; `page.waitForTimeout`, since `setTimeout` is not defined in that sandbox). The pie card renders
  its two `VSkeletonLoader`s while the rest of the page has loaded.
- **`/activity-tracking/unified` with all five panel endpoints → 500 and `sources` left alone:** the
  *Sources* chips survive with their totals (*Browser 1h 22m*, *Desktop 1h 6m*, *Phone 1h 48m*), the
  `ActivitySourceFilter.vue` comment's claim, now seen. Four *Failed to load*, **zero** "No data", no
  snackbar. Four, not five, because stacked bars and the timeline share one slot behind the view
  toggle. All five bind `:error` (`UnifiedActivityDashboard.vue:19-96`).
- The queue body's *"route … `/unified`"* is `/activity-tracking/unified`. `/unified` fires no
  dashboard requests at all.

### `history-review/U1` — ✅ closed 2026-09-23 after `F27`, and it found a real defect: the first-run block could never render on Summary or Detail

Run after `F27`, as the row required, so "empty" and "failed" are distinguishable on screen.
- **Empty, Summary:** `/activity-history?date=2020-01-01&range=Month` → pie and cards read *No data for
  this period · 01.01.2020*, with no error and no first-run block. The row expected **three**
  `HistoryEmptyState`s. The third panel, stacked bars, has no `HistoryEmptyState` and renders its hatched
  *NO ACTIVITY* block instead, because the endpoint returns every window with empty `items`. That is
  the chart's idle-block design, not a gap. (On the `Month` semantics that block's label exposed, see
  `F27`'s *Observed, not filed*.)
- **Empty, Calendar:** September 2020 via the *Year* select → *No activity recorded in the visible
  range.* above 30 *Not recorded* cells. That is `fillMissingDays`' placeholder path, exactly as the row
  predicted. The existence check fires once and, for an account with history, correctly shows no
  first-run.
- **First-run:** `adminUser` (10003, zero history, as the queue's rule-1 note says). The calendar showed
  *No activity recorded yet* + *Log manually* / *Start a timer*. **Summary and Detail did not. They showed
  empty panels.** Cause: `useHistoryDashboard.checkFirstRunIfEmpty` treated `stackedBarsWindows.length > 0`
  as evidence of history. Both stacked-bars endpoints tile the whole range and return every window, empty
  ones included, so every account resolved to `true`, the existence check never fired, and the block
  never rendered. It predates `F27` (the old `isEmpty` had the same term). It is the trap
  `useActivityDashboard.isRoundEmpty`'s comment already documents on the tracking side. **Fixed in
  `4efbb0c9`:** the test is now `stackedBarsWindows.some(w => w.items.length > 0)`. Re-verified both
  ways:
  - `adminUser` → both dashboards show the first-run block.
  - `test@example.com` → `detail?date=2026-09-07` shows three *No data* (timeline view), January 2020
    shows two, and neither shows a first-run block. `date=2026-09-22` shows its totals.
  - Type-check exit 0.

### ⚠️ Found while triaging unit 4: `TimePicker` snaps `:58` / `:59` to minute **60** at any interval above 1 — framework, source-certain, unobserved

> ✅ **CONFIRMED AND FIXED 2026-09-24** (`vue_framework` `ecf06b7`, with a pointer bump in the app). No
> batch number was used; `FW10`, which was held for this, is retired unused.
>
> **Confirmed live, and worse than predicted:**
> - A plain `TimePicker` (the to-do item's due time) showed `09:58` → **`09:60`** and `23:59` →
>   **`23:60`**.
> - `DateTimePicker` (the *when* field on `/activity-history/manual`) never showed `:60`, because it
>   combines the `Time` into a `Date`, and `setHours(23, 60)` carries. That carry moved the **date**: a
>   typed `23:58` on 24 Sep became **25 Sep** at 00:00, with nothing on screen to say so.
>
> **The fix:** `TimePicker` rounds within the whole day (`snapToInterval`, used by both write paths), so
> the carry goes into the hour. It is capped at the interval's last slot (23:55 at `'5'`), the cap the
> arrow buttons already used.
>
> **Verified live:**
> - Due time: `09:58 → 10:00`, `23:59 → 23:55`, `09:57 → 09:55`, `14:32 → 14:30`.
> - *When*: `08:58 → 09:00`, `23:58 → 23:55`, and the date stays 24 Sep.
> - Console clean. `type-check` exit 0, lint clean.
>
> **Also in the framework commit:** `docs/components.md` states the carry, the cap, and that a duration
> field should pass `'1'`. That answers one of the two framework questions below: the `'5'` default
> stays, because it suits a time of day. The other question, whether a snap should ever be silent, was
> **decided 2026-09-24** by the owner: a time-of-day `TimePicker` keeps rounding silently (`09:07` →
> `09:05`, no message), because the field shows the rounded value on blur and the clock menu greys out
> the disallowed minutes. Recorded in the framework's `docs/components.md` `TimePicker.vue` paragraph.

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
reads `00:60`, this is a **framework batch** (`FW10` next run): clamp in `roundToNearestInterval`
(`Math.min(60 - interval, …)` is wrong for `59` → it should carry into the hour, so probably
`Time.fromMinutes(h * 60 + rounded)` at both call sites instead). **While that batch is open, the two
framework questions `F36` declined to answer belong in it:** whether `'5'` is the right *default* for a
component that serves both times-of-day and durations, and whether a snap should ever be silent (helper
text, or a `snapped` emit). Both are decisions for `vue_framework`, not this app.

### ⚠️ Found while triaging unit 7: the template picker calls `/suggestions?date=` against a `/{calendarId}` route — the withdrawn `B5` bug on the sibling endpoint, hidden by mount order

> ✅ **CONFIRMED AND FIXED 2026-09-24.** No batch number was used; `F45`, which was held for this, is
> retired unused.
>
> **Confirmed live first, exactly as predicted,** on `/day-planner/24-09-2026`. The first load made no
> suggestions call. *Routine* → *Details* sent `GET …/suggestions?date=2026-09-24` → **400**, and
> *Suggested for you* never rendered.
>
> **Fixed:**
> - `fetchSuggestions(calendarId)` calls `GET …/suggestions/{calendarId}` with `_silent`.
> - `DayTemplatePicker` loads the template list on its own in `onMounted`.
> - Suggestions come from a `watch(() => calendar?.id, …, { immediate: true })` with `.catch(() => [])`,
>   and a stale response for a previous calendar is dropped.
>
> Together these cover the row's fix shape and its *Consider* line.
>
> **Verified live:**
> - The first load now asks: `/suggestions/997` → 200. It asks again after *Routine* → *Details*, also
>   200. Neither path gives a 400.
> - The seed's suggestion view is empty (0 items; it is refreshed by a host job), so a mocked suggestion
>   built from a real template was used for the section. It rendered *"Relaxed Weekend · Used on
>   Thursdays · 4×"*, and clicking it selected the template in the picker.
> - A mocked 500 on suggestions: no snackbar, and the picker still lists all three templates.
> - Console clean. `type-check` exit 0, lint clean.
>
> **Follow-ups, all settled 2026-09-24** (the day after, same commit series):
> - **`useTemplateSuggestion.ts` deleted.** It was dead by design: commit `76156248` replaced it with
>   this endpoint, and nothing had imported it since. It scored on the template's own `ScheduledDays` /
>   `SuggestedForDayType`, which the server's history-only view never reads. That signal is now asked
>   for server-side as **§22 / `B27`**.
> - **The suggestion row is a button.** It has `role="button"`, `tabindex="0"`, Enter/Space, and
>   `aria-pressed` for the selected template, plus a focus ring. Found on the way and fixed with it:
>   - the pattern label rendered raw English (SK read *"Použité v Thursday"*), and is now translated
>     through `calendar.*` / `planner.dayType.*`, with SK reworded to *"Zvyčajne: {label}"*;
>   - a template matching both weekday and day type rendered twice with one `v-for` key, and is now
>     deduped;
>   - inactive templates were suggested, and are now dropped.
>
>   Verified with a mocked 4-entry body: 2 rows, Enter selects and previews, and the SK and EN wording
>   is right.
> - **The ownership note was wrong as a leak.** `Calendar` is `BaseEntityWithUser`, so the per-user
>   global query filter applies, and `FindAsync` honours it: another account's id → 404. What is true is
>   that nothing pins it, and it rests on `UserScoping:Enabled`. `B27` part 5 asks for the test.

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

85. **A standing framework prompt and CLAUDE.md both say `useEntityQuery` is safe from the
    cancel-your-sibling bug, and `planner-templates/X1` is the counter-example.**
    `prompts/_common/api/A1-request-key-for-sibling-fetch-helpers.md:129-131`: *"Do not add
    `requestKey` to `useEntityQuery`. It already holds a separate controller per method (`fetchById`,
    `fetchAll`, …), which is the same idea expressed differently. Only the three listed helpers share
    one controller across every call."* Per-method is not per-call: `useEntityQuery.ts:34-37` aborts
    the previous `fetchById` whatever its id, so `Promise.all([fetchById(a), fetchById(b)])` from one
    instance rejects every time — which is what `TemplateComparisonDialog.vue:120` does and what the
    unit photographed. CLAUDE.md's `_common/api/` bullet has the same gap by omission: it names
    `useFetchFilteredSorted`, `useFetchSorted` and `useFetchFilteredTable` as the helpers that "still
    hold a single controller per instance" and does not mention this one. The finding itself cites
    *"CLAUDE.md's own documented gotcha"* for `useEntityQuery` — there is no such sentence; the unit
    inferred the mechanism correctly and attributed the documentation wrongly. Net: the dialog's
    author was told, in writing, that the helper they reached for was the safe one. `FW18` adds the
    key (opt-in, `Symbol` default, the `useFetchFiltered` shape) and rewrites both sentences; `F50`
    fixes the dialog without waiting for it.

86. **`X2`'s "opened panel" and `A3`'s "panel-open toggle (the collapsed pill)" are the same
    element, and it is the open panel — no such toggle exists in the template planner.** Source:
    `panelOpen` starts `true` (`useRoutinePlacement.ts:28`); the only writer of `false` is the shell's
    X (`PlannerSidePanelShell.vue:22`); nothing in `TemplateDayPlannerView.vue` or
    `TemplatePlannerHeader.vue` writes `true`; the reopen control the unit describes exists only in
    the *day* planner's header (`DayPlannerHeader.vue:7-14`, `d-md-none` `bars`). The two mobile
    screenshots agree with the source and not with the captions: `day-planner-templates-id--mobile.png`
    shows a thin grey card strip at the top — the 400 px-wide `VCard` squeezed to its 16 px title by
    the `flex-column` + `h-100` parent — and `…--mobile-panel-open2.png` shows the **same page scrolled
    ~170 px to the right** (the X now visible, the 5M/10M/15M toggle and *Home* location chip in
    frame, *Home Office* cut to *ks*), which is what a 400 px child does to a 390 px viewport. So the
    inventory's `:162` row (*"opens the panel at `<md` widths"*) and `:207-211` (*"Panel-closed state
    renders correctly … Opening the panel produces a sliver"*) describe one state twice, and the
    real defect is worse than filed: the panel is broken on **arrival**, and once the X is tapped it
    cannot come back without a reload. Two consequences. `A3` stays `a11y` but names the wrong control
    — the unnamed `nth(4)` button it `eval`'d is the shell's close X or the header's undo, both of
    which are unnamed in source and both of which `F56` names. And `X2`'s *Expected* — *"the way it
    does on `DayPlannerSidePanel`'s default 380px"* — is unobserved: unit 7 never resized (the
    Phase 3 X4 pass is still pending), and `DayPlannerView.vue:3` has no `flex-column`, so at 390 px
    the day view is a 380 px panel *beside* the grid, a different failure and not a working
    reference. `F51`'s verification drives both routes at 390 for that reason.

87. **`X1`'s suggested fix closes half the bug and the finding does not know it.** The root-cause
    guess is exactly right about `:120` (two `fetchById`s, one controller). It does not look at
    `:121-124`, which is `Promise.all([fetchFiltered(…t1…), fetchFiltered(…t2…)])` from one
    `useTemplatePlannerTaskCrud()` with **no `requestKey`** — `useFetchFiltered.ts:54-56` then keys
    both under the shared `Symbol` and the first cancels, the same `CanceledError` one line down.
    Keying or splitting only the `fetchById` pair moves the rejection from `:120` to `:122`; the
    `try … finally` still never reaches `sides.value`, and the dialog stays on its two-null default.
    `TemplateListView.vue:315-326`, in the same module, uses `requestKey: t.id` for exactly this
    fan-out with a comment saying why — the dialog was written without reading it. `F50` names both
    lines and the verification counts requests, because a clean console proves nothing here (`A1`'s
    *Traps*; cancellations are not logged).

88. **`B2` is a client/server contract disagreement, and the contract is the server's.** The unit
    filed one field; the source has the whole form. Client: `TaskPlannerDayTemplateRequest.ts:14`
    `suggestedForDayType?: DayType`, no default; `TaskPlannerDayTemplateDetailsForm.vue:6-79` declares
    no `:rules` on any field, so `validateAndGetData()`'s `form.validate()` (`:143`) is always true.
    Server (`AdhdTimeOrganizer.Planning/…/TaskPlannerDayTemplateRequest.cs`): `Name`
    `[Required][StringLength(100)]`, `Description` `[StringLength(500)]`, `Icon` `[StringLength(50)]`,
    `SuggestedForDayType` `public required DayType` — the `required` modifier is why the failure is a
    `serializerErrors` 400 rather than a validation 400, and why it reads as the server's generic
    title. The one question that could have been an escalation — should *Suggested for day type* be
    optional? — is answered without a running server: the column is `int` non-nullable and indexed
    (`Initial.Designer.cs:1669,1701`), `/suggestions` matches templates on it, and every server-side
    fixture and integration test sets it. Required by design; the client is the side that disagrees.
    `F53` mirrors the contract and stops there; the dialog-closes-before-the-call shape
    (`TemplateDetailsForm.vue:32` → `TemplateListView.vue:352`) is noted as a pattern decision, not
    batched.

89. **`leisure-backlog-picker/X1`'s evidence is misread, and its root-cause guess points at the wrong
    layer.** The finding rests on a discrepancy: two count-only requests returned `itemsCount: 0` for a
    nonsense `activityName` and the main table request returned the row, so the name filter "works on
    two of three requests" and the sort on `activity.name` must be breaking the third. Source, both
    sides: the server's `ActivityBacklogProfileFilterRequest` has **no `ActivityName` member** — it
    reads `EnergyLevel`, `EffortType`, `IsRepeatable`, `IsAnchored` and nothing else
    (`GridActivityBacklogProfileEndpoint.cs:41-60`; `BaseGridEndpoint.cs:124-125` applies nothing
    generic) — so the name filter has never worked on *any* request. The two count-only requests were
    zero because `useExperiencedProgress` is wired with `scopeFilter: copy => { copy.isRepeatable = false }`
    (`BacklogView.vue:150`) and the seed's one backlog row is `IsRepeatable = true`
    (`E2eFixtureSeeder.cs:734`): the denominator over one-time entries is 0 on this account whatever
    the name says. The unit tested one server-read field (`isRepeatable`), saw it work, and generalised
    to "filters work, except this one". The sort has nothing to do with it. Re-scoped from a
    sort/filter-interaction ask to the four-grid contract gap in **§13**; severity stays `blocker`
    (the filter chip and the URL both claim a narrowing that never happens). The inventory's
    *"activity-name filter survives a reload"* describes the URL codec only.

90. **`leisure-bucket-anchors/B1` says `activityName` and `isAnchored` "both confirmed working" and
    five numeric fields are "silently ignored" — the server has no `ActivityName` on either grid, and
    two of the five are the client's own naming slip.** `ActivityBucketListProfileFilterRequest` is
    `RequiresTravel`, `ComfortZoneStep` (exact match), `IsAnchored`; `MemoryAnchorFilterRequest` is
    `AnchorMonth`, `AnchorYear`, `ActivityId`. So: `isAnchored` works (correct); `activityName` cannot
    have — with one seeded row and no recorded input, the "confirmed" is unexplained and is contradicted
    by source; `minComfortZoneStep`/`maxComfortZoneStep` are a range the server's scalar never sees;
    `minRating` has no counterpart at all; and `year`/`month` are read by the server under the names
    `anchorYear`/`anchorMonth` — which the client's **own create request** already uses
    (`{"anchorMonth":9,"anchorYear":2026,…}` in `B2`'s evidence). That pair is an app batch (`F60`);
    the other three cases are §13. The finding's root-cause guess (*"not wired into the where clause"*)
    is right for `minRating` and wrong in kind for the rest — the clause exists, the names do not meet.

91. **Three units, one interceptor path, three observations.** `leisure-backlog-picker/X3`: a 400 on
    `POST /activity-backlog-profile`, DOM polled six times over 1.8 s, **no `.v-snackbar`**.
    `leisure-bucket-anchors/B2`: a 400 on `POST /memory-anchor`, *"a snackbar may have fired and
    auto-dismissed before capture — not independently confirmed"*. `activity-settings/X1`: a 400 on
    `POST /activity-role`, snackbar **seen** (*"One or more errors occurred!"*). All three go
    `useEntityCommand.create` → `useRequestState.run` → the interceptor's `case BadRequest:
    showErrorSnackbar(…)` (`axiosConfig.ts:227-228`); none passes `_silent`
    (`activityBacklogProfileApi.ts` sets no `disableErrorHandling`; `useRequestState.ts:31`);
    `showSnackbar` has no dedupe and a 3 000 ms timeout. Source offers **no** path by which the
    backlog request stays silent. `X3`'s guess (*"the interceptor's call is not reaching the DOM for
    this specific path"*) names the mystery without a mechanism. Not batched — `F63` takes the `0`
    half; the snackbar half is a *Needs verification* item with an exact probe, because if it is real
    it is a framework intermittent and far bigger than one form.

92. **`leisure-bucket-anchors/X3`'s "route registered after `/{id}`" is wrong — the route does not
    exist.** The `endpoint/memoryAnchor/` directory holds `GetById`, `GetSelectOptions`, `Grid`,
    `Create`, `Update`, `Delete`, `BatchDelete`; the string `anchor-eligible` occurs in **no `.cs` file
    in the API**. The 400 body (*"Value [anchor-eligible-activities] is not valid for a [Int64]
    property"*) is `GetByIdMemoryAnchorEndpoint` binding the path segment, which is what a missing
    sibling route looks like from a browser. `prompts/_done/leisure/backend/B1-backend.md:5` told the
    frontend the route *"already knows which activities qualify"* and `B1-close-the-loop.md:14` built
    on that; it never landed. Same lesson as the withdrawn `B5`: a 4xx from outside cannot tell "no
    route" from "wrong parameter". Escalation §12; the frontend half (`F62`) is unchanged by the
    correction.

93. **`leisure-backlog-picker/P1` says `BacklogView` is *"the only leisure view (confirmed by grep
    across `src/core/`) that passes a `class` to `<FilterPanel>`"* — the grep this pass returns four.**
    `ProjectsView.vue:27`, `MemoryAnchorsView.vue:27`, `BucketListView.vue:27`, `BacklogView.vue:7`,
    all `class="flex-1-1"`, exactly as `F6` has listed since the eighth pass. The unit's grep must have
    matched the opening tag's line only (`<FilterPanel` is on its own line in all four; the `class`
    is two lines down). Merged into `F6` as a duplicate; `F6`'s verification already says to check all
    four views because the warning is per call site.

94. **`activity-settings/X1` asks which side owns the colour format; the server's own code answers
    it.** `framework/Sydowwe.Framework/domain/enum/ColorPalette.cs` declares the palette as
    **names** (`Crimson = "crimson"` … `Slate = "slate"`, the same 29 the client's `COLOR_PALETTE`
    emits), `E2eFixtureSeeder.cs:409-417` writes `ColorPalette.Blue`/`Emerald`/`Violet`/`Sky`/`Yellow`
    into the very roles and categories the unit edited, and the validator that refuses them
    (`NameTextColorIconValidator.cs:16-20`, hex regex) predates the palette on both sides —
    `git log -S 'valid hex color'` bottoms out at `a51309e` (2026-05-16); the client's `colorPalette.ts`
    first appears 2026-06-22. So the finding's *"write-path regression"* reading is right and its
    *"needs a decision on which side"* is answered: the validator is stale. Two consequences the unit
    could not see: the column is `character varying(7)` (`EntityFieldLengths.Color = 7`) and
    `burgundy` is eight characters, so relaxing the regex alone still refuses one swatch; and
    `TodoListCategoryValidator` derives from the same base, so `/todo-list`'s category create/edit
    (`TodoListCategoryForm.vue:18`, same `ColorPicker`) is broken by construction — unit 9's inventory
    `:28` records that path as *not separately tested*. Escalation §11; no client batch.

95. **`home/B2` round 1 and this queue's `F8` prescribed a loading branch; round 2 shows the state is
    not transient.** Round 1 saw the *DONE* / *No plan for today* pair "briefly on every load" and
    `F8` said add `loading` to `NowBar` and gate `focusMode` on `hasPlan`. Round 2 reproduced it on 3
    of 4 fresh sign-ins, waited 3 s, and it stayed — in **both** widgets, including `DayPlannerWidget`,
    which round 1 credited with guarding correctly. Source agrees with round 2: the user-id watcher
    (`useTodayPlan.ts:512-521`) calls `resetTodayPlan()` on the `0 → id` hydration, which bumps
    `loadToken` (`:467`) while the day-plan fetch is in flight; `fetchPlan` discards the response
    (`:404`); the retry gate `hadPlan && id !== 0` (`:516-519`) is false because `hadPlan` reads a
    `planDate` the discarded response never set. A loading branch hides nothing here — `loading` is
    already `false` (the `load()` `finally` ran) and the data is simply absent. And round 2's third
    variant is the inverse: a *failed* fetch's `finally` clears `loading`, then the reset sets it
    `true` (`:473`) with nothing left to clear it — a permanent spinner that never reaches the error
    branch `U1` verified. `F8` is rewritten from the root with round 1's half kept as the smaller
    part; effort `low-med` → `med`. Round 1's "narrow but real window" was honest — the window is the
    difference between two unrelated requests' response times, and it has no reason to be narrow.

96. **`leisure-backlog-picker/B1`'s heuristic has a second victim on the neighbouring unit's screen,
    and neither unit saw it.** `isPercentKey` matches `ratio` as a raw substring; `durationMinutes`
    (the finding) is one hit. Tested against all 105 `TableColumn` keys in this app this pass:
    `inspirationSource` (`BucketListTable.vue:112`) is the other — `inspi**ratio**n` — and
    `BucketListTable.vue` slots five columns (`:19-43`) but not that one, so `formatPercent` gets a
    string and returns `"—"` (`useTableFormatters.ts:41`). The seed's *Learn Bouldering* carries
    `InspirationSource = "A friend's climbing photos"` (`E2eFixtureSeeder.cs:745`). Unit 12's inventory
    lists *Inspiration* as a rendered column (`:44`) and its `O1` says the field renders *"as a plain
    column"*; it has never rendered. The framework's own `JobRunHistory.vue:90,99` slots exactly
    `durationSeconds` (`ratio`) and `errorSummary` (`sum` → currency) — the trap was hit inside
    `vue_framework` and worked around per column rather than fixed. `FW20` names both app columns and
    both framework slots; the `O1` note is corrected in *Deferred to opportunities*.

97. **`leisure-bucket-anchors/U2` (does deleting an anchor leave `isAnchored` dangling?) has a source
    answer: it cannot.** The flag is not a column. Both profile grids compute `IsAnchored` /
    `MemoryAnchorId` in SQL from the anchors table at read time (`GridActivityBucketListProfileEndpoint.cs:24-25,50-55`,
    `GridActivityBacklogProfileEndpoint.cs:53-60`). Settled; moved to *Closed verification items*.

98. **`leisure-bucket-anchors/A1` is two findings with two owners, and only one of them is a missing
    name.** Its evidence lists `title="edit"` / `title="delete"` with `aria-label: null` on the row
    actions, and `title="Table"` / `"Ladder"` / `"Add"` on the header controls. The first is
    `DataTable.vue:83` binding `action.name` (the slug) instead of `action.text` — `FW5`, seen from
    two more tables, and the unit's own root-cause guess says as much. The second is a localized
    `title` with no `aria-label` — a real accessible name, the weakest kind, and the finding's
    expectation is *"consistent with this app's own pattern"* rather than a failure to name. That half
    is re-graded `a11y` → `polish` and batched as `F65`; the unit's suggestion to add `aria-label`
    beside `title` is what `F65` does. The lower-case/sentence-case inconsistency it notes rides along
    with `FW5` (the slug is what is lower-case).

99. **`todo-lists/X1` files the colour 400 as `[framework]` and proposes the fix §11 rejects.** The unit
    saw `ColorPicker` emit `"blue"` and the validator demand hex, and concluded the picker is wrong —
    *"either `ColorPicker` needs to emit the theme-appropriate hex value … or every caller needs to
    translate"*. The thirteenth pass had already answered which side is stale from the server's own
    code (§94): `ColorPalette.cs` declares the names, the e2e seeder writes them, and the routine-period
    form ships `"color":"blue"` and gets 201 (`todo-routine/B11`, verified 2026-09-14). The regex lives
    in one validator base three DTOs share, and it predates the palette on both sides. `X1` is the
    fourth surface of §11 (roles, categories, and now to-do categories observed; §11 predicted this one
    by construction) and is merged there, `blocker` kept. The two things the observation adds — the
    dialog closes before the 400, and `"default"` is what the default swatch sends — are app-side notes
    for after the validator lands.

100. **`todo-lists/B8` — "a frontend call that was never updated after a backend routing change" has the
    order backwards, and the gap is four months wide.** The server replaced `MoveToListTodoListItemEndpoint`
    (`/move/{id}/{dest}`) with `MoveTodoListItemEndpoint` (`/{id}/move` + `{ destinationListId }`) on
    **2026-05-15** (`0517bb3`); the client's `moveToList` was written on **2026-05-16** (`1a2e0284`)
    against the shape deleted the day before, and `git log -S` finds no later edit on either side. So
    it was not updated-then-broken, it was born broken — and no spec covers the move
    (`todo-lists.spec.ts` has none), which is why nothing caught it. `F70`'s verification adds one.

101. **`tracking-settings/X1`'s round-2 amendment reads a working `focus()` + Enter path as "consistent
    with a stacking/paint bug".** It is consistent with `F12`'s cause and not with that one: `focus()`
    scrolls the element into view within its nearest scrollable ancestor — the 0 px `.v-table__wrapper`
    the third pass identified — and a keyboard Enter dispatches the click on the focused element with
    no coordinate hit-test, so both halves bypass exactly the check the pointer fails. A paint-order
    defect would leave `focus()` with nothing to scroll and the pointer still blocked. Nothing in `F12`
    changes; the amendment is annotated in its body so the framework hypothesis is not reopened.

102. **`tracking-settings/X3`'s suggested fix would silently re-activate every inactive rule on
    edit.** The finding's shortcut — *"always send the current toggle state (defaulting `true` for a
    new row)"* — assumes a toggle that does not exist (`O1` is that there is none) and misses that
    `UpdateTrackerDesktopMappingRequest.UpdateEntity` is a **full replace** by its own remark: a body
    saying `isActive: true` for a rule that was `false` flips it. `edit()` must copy the row's own
    `isActive` from the grid response (`TrackerDesktopMappingResponse.ts:13`) into the request; `F72`
    says so, and its verification edits a rule that is `false` and checks it stays `false`.

103. **`tracking-settings/B5`'s expectation is the unit's own usecase, and the ledger it calls a gap is
    the design.** *"Browse the distinct, not-yet-considered … combinations"* was written by the same
    unit in round 1; no intent source says the list is an inbox. `FetchTableDistinctDesktopEntry.cs`
    groups the raw `DesktopActivityEntry` rows with no join to mappings, and
    `DesktopActivityHeartbeatEndpoint.cs:89-104` keeps *recording* an entry that matches a to-activity
    rule (it attributes and stores; only an ignored match is skipped) — so a mapped `vlc.exe` keeps
    appearing because the ledger is what was observed, not what is undecided. `B3`'s seed note says the
    same from the other side ("the seeder drops [ignored ones] the way the heartbeat would"). The
    product gap is real (nothing marks a tuple that already has a rule) and has a backend half; `bug`
    → `opportunity`, deferred.

104. **`tracking-settings/B7`'s "likely a `BasicTable`-level default shared by every other table" is a
    per-call-site omission.** `BasicTable.vue:208` names the row by `deleteConfirmationColumn` when one
    is passed and falls back to `item.id` when none is — the two mappings tables pass none, exactly as
    the two `activity-settings` tables did not (`B8`, folded into `F19` in the thirteenth pass).
    Of the eleven `<BasicTable>` consumers in `src/core`, five pass it (`BacklogTable`,
    `BucketListTable`, `MemoryAnchorTable`, `ProjectTable`, `RoutineSettingsView`), two are `F19`'s and
    two are these; the remaining two are worth one grep before `F13` ships. Folded into `F13` (same tag);
    not a framework batch — rule 4 is for defaults worth changing, and "the id when you gave me
    nothing" is the honest fallback.

105. **`tracking-settings/B6`'s generic snackbar is the view's own, not the interceptor's — and `FW19`
    alone would not surface the message here.** The unit reads *"the UI discards both messages and
    shows only the generic 'Failed to save mapping'"* as one snackbar. It is two: the mapping API goes
    through `useEntityCommand` with no `_silent` (`desktopActivityTrackingApi.ts:100`), so the
    interceptor snackbars the server's 400 (generic today, specific after `FW19`), and then
    `useMappingSettings.ts:51-53`'s `catch` calls `showErrorSnackbar(t('…failedToSaveMapping'))`, which
    `showSnackbar` renders **in place of** the first. After `FW19` the user would see the specific text
    for a tenth of a second and then the generic one. `F72` removes the second snackbar (or silences the
    first and reads `errors` itself — one or the other).

106. **`history-capture/B4` and `B5` are one gap on three views, and the unfiled third is the worst
    documented.** The unit filed Pomodoro (writes `{0,0}` behind *"done for ?"*) and Timer (discards
    silently) as two bugs with *"the same root shape"*. The stopwatch (`StopWatchView.vue:177`) is
    Pomodoro's case under 30 s: `TimePrecise.toTimeLength` **rounds** seconds to the minute where
    `Time.fromSeconds` **floors** them, so a 10-second stopwatch reaches the same unguarded
    `SaveActivityBody` with `{0,0}`. And `B5`'s threshold is not "under a minute": the timer computes
    `initialTime − remaining.toTimeLength`, so a 45-second stop *saves one minute* and a 15-second stop
    is discarded. Three views, two rounding helpers, three policies — one batch (`F67`) with a
    decision, not two fixes.

107. **`history-capture/B6`'s 409 is the unique index — and that settles §53's "reset half is taste"
    the other way.** The unit could not confirm the mechanism (*"same-`activityId`+`startTimestamp`
    uniqueness is the likely shape, not verified"*); `ActivityHistoryConfiguration.cs` has
    `HasIndex(UserId, ActivityId, StartTimestamp).IsUnique()`, and `DatabaseExceptionUtils` maps the
    violation to 409. The consequence the finding did not draw: the form's `dateTime` is set once at
    mount (`AddActivityManuallyForm.vue:53`) and nothing resets it, so **every** second submit of an
    unchanged form after a success is the same 409, shown as *"error saving"*. The eighth pass called
    the reset unsourced (§53); it is now a correctness requirement — *when* must advance — with only
    *which other fields* left to taste. `F68`.

108. **Unit 15's `X1` and `X2` were fixed before the round that filed them was read, and the queue's
    two batches did not know.** `vue_framework` `6157283` / bump `04c405e9` (2026-09-15) landed
    `ForgottenPasswordView`'s token and deleted `RegistrationView`'s fail-closed guard; unit 15's round 3
    verified both in a browser and its docs were committed *in the same commit*. The thirteenth pass,
    run the same day, was scoped by the operator to the uncommitted tree and left `FW9`/`FW13` as the
    ninth pass wrote them. Both bodies now carry a ✅ header naming what landed and what is left
    (`FW9`: the `/reset-password` view and `B3`'s catch; `FW13`: the catch and `P1`'s links). Lesson
    for the runbook: "scoped to the working tree" needs a `git log` over `docs/views/` since the last
    pass, or a committed round is invisible.

109. **`auth/B6` — the server does not "no longer signal" an unconfirmed address; it has the branch and
    never reaches it.** `PasswordSignInFlow.cs:105-106` returns `EmailNotConfirmed` → 403, deliberately
    *after* the password check. But it calls `CheckPasswordSignInAsync` first (`:83`), and the host sets
    `RequireConfirmedEmail = true` (`IdentityServiceExtensions.cs:121`), so Identity's `PreSignInCheck`
    answers `NotAllowed` before verifying the password — `!result.Succeeded` → *"Invalid email or
    password"* (`:95-101`). The flow's own check is dead code on every deployment that sets the option,
    the client's 403 branch (`LoginView.vue:185-193`) is unreachable, and lockout never counts an
    unconfirmed user's failed attempts. A framework-repo (`Sydowwe.Framework`) fix — escalation §14 —
    and it gates `U2` and `U4`'s throwaway route.

110. **`auth/B7`'s 401 is the API's `FallbackPolicy`, not the endpoint, and the cost is one wasted
    request.** `/auth/resend-confirmation-email/undefined` matches no route (`undefined` is not a
    `long`), and the README's *Test data* note explains what an unmatched path answers: 401. The
    interceptor then refreshes, gets 401, calls `logoutClient()`, which returns at
    `!auth.isAuthenticated` (`axiosConfig.ts:171-172`). The allowlist gap is real and is `FW21`; the
    severity is not `bug` — nothing the user sees changes — and `FW12`'s `userId` guard removes the
    only trigger observed. `FW9`'s *Do not change* on `AUTH_ENDPOINTS` stands for the two endpoints it
    names; `FW21` is the class. `bug` → `polish`.

111. **`auth/U6` is open in the unit and settled in the queue, and both are right about what they saw.**
    §64 settled it from `SnackbarComposable.ts:43-46` in the ninth pass; unit 15's round 2 tried twice
    more, saw nothing, and kept it `unverified` because the unit does not read the queue. Not a
    contradiction of fact; recorded so the fifth attempt is not made. The round's 415 detail is folded
    into `FW12`.

112. **`todo-lists/B7` — the item delete is not one of P3's five sites, and that is why it reads the
    preference the way it does (not at all).** `P3-delete-confirmation-granularity.md` lists five sites
    by file and line; `useUndoableListCrud.deleteItem` is not among them because it was already an
    undo-only path through `useTodoListUndo` when P3 ran. P3's own rule covers it (*"a leaf that is
    undoable honors the preference"*) and `useDeleteConfirmation.resolveDelete` encodes it — so with
    `askBeforeDelete` on, this is the one delete in the app that ignores the user. The routine list
    shares the composable and has the same gap unfiled (unit 10's seven rounds deleted periods, never
    items). `F69`; CLAUDE.md's "five sites" row needs its count fixed once for `F19` and this together.

113. **`todo-lists/A3` stops one level short.** The item's `VCheckboxBtn` (`BaseTodoListItem.vue:19`)
    has no name — and neither does each step's (`BaseTodoListItemSteps.vue:39`), the same markup the
    round did not expand. Both in `F71`; the drag preview's copy is `disabled` and decorative.

114. **`leisure-backlog-picker` renumbered its own finding ids between rounds, and four batches were
    pointing at the wrong defects because of it.** This is the loudest thing in the fifteenth pass and
    it is a documentation failure, not an app one. Round 2 did not append to `findings.md` the way every
    other unit did — it **rewrote the file**, deleted the round-1 row from the round-history table
    (leaving *"1 | 2026-09-15 | `f457aa0c` | initial mutation pass"* as the only round, which is not
    what happened), and re-lettered every finding. The mapping, established by diffing the file against
    `9407b8f5^`:

    | round 1 | round 2 | consequence for the queue |
    | --- | --- | --- |
    | `X2` (weather exclusion) | `B1` | `F64`'s `Closes:` said `X2` |
    | `X3` (silent invalid submit) | split into `B2` (the `0`s) + `B3` (the silence) | `F63` said `X3`; the split is an improvement |
    | `B1` (duration as a percentage) | `B5` | `FW20` said `B1` — which now means something else entirely |
    | `P1` (dead `flex-1-1` on `FilterPanel`) | *(gone)* | `F6` said `P1`; the new `P1` is multi-sort (`FW23`) |
    | `X1` (`activityName` filter ignored) | *(gone, no retest note)* | the queue's §13 notes said its *Verify* block was newly runnable |
    | `P2` (stale API doc comment) | *(gone)* | still open inside `F64` |

    The worst of these is `P1` → `P1`: the id survived and changed meaning, so a `Closes:` line naming
    it reads as correct and is not. Every reference to this unit in the queue is now tagged `(round 1)`
    or `(round 2)`, and there is a warning at the top of the queue. **No other unit did this** — units
    7, 8, 12 and 13 all appended and kept their ids stable, which is why the same triage worked on them
    without any of this. The two dropped findings go to *Needs verification* as a record gap rather than
    as defects; round-1 `X1` is almost certainly resolved by `B11` (the sibling grid endpoints do apply
    `ActivityName`, read this pass) and round-1 `P2` is still open inside `F64`.

115. **Three units found one defect and all three called it something else — and one of them wanted to
    escalate it.** `leisure-projects/X1`, `leisure-backlog-picker/X1 (round 2)` and
    `leisure-bucket-anchors/X4` are the same three lines of code. Read this pass, all three response
    DTOs (`ActivityProjectProfile`, `ActivityBacklogProfile`, `ActivityBucketListProfile`) declare
    `get id(): number { return this.activityId }` and **none of their `fromJson` methods destructures
    `id` at all** — the server's primary key is dropped at parse time, which is why the getter looked
    like a reasonable stand-in. `MemoryAnchor`, in the same directory, carries a real `id` and works.
    The three units disagreed about the fix in a way worth recording:
    - `leisure-projects/X1` got it right and even predicted the other two (*"likely worth fixing once
      across all four leisure profile DTOs… rather than patching this table in isolation"*), but says
      `fromJson` *"doesn't destructure it, so it's silently dropped"* — correct.
    - `leisure-backlog-picker/X1 (round 2)` says the opposite of the source — *"`fromJson` reads the
      server's own row id… but the DTO's `id` getter discards it"* — and concludes it is *"a contract
      question between the DTO and the API, not purely a frontend typo — flag to whoever owns the
      backend contract before picking a fix."* It is not a contract question: its two sibling units had
      already issued a direct `DELETE` against the row's own id and got **204**, on two different
      surfaces. Had this unit been triaged alone, it would have produced a backend prompt file for a
      settled question.
    - `leisure-bucket-anchors/X4` got both the cause and the blast radius right by grep (it names the
      three sibling call sites) and correctly ruled out a general CRUD problem by showing memory
      anchors' edit and delete working in the same session.
    One batch, `F73`, nine call sites. The lesson for the runbook is narrow and worth having: **a
    finding that says "flag to the backend" is worth a grep before it is worth a prompt file** — the
    evidence that settles it may already be in a sibling unit's findings.

116. **`planner-day/X1`'s "unregistered backend route" is a client calling a name that was replaced —
    the `F70` shape, and the *Clone* half is broken too.** The finding reads
    `PATCH /api/activity/{id}/Overwrite` → 404 and concludes *"very likely the same class of gap as the
    other backend-route findings already filed in `prompts/view-docs/backend/`"*, with a suggested fix
    opening *"Backend: register (or fix the method/route on) the activity-overwrite endpoint."* Read
    against the API this pass: the endpoint exists as `Put("/activity/{id:long:required}/quick-edit")`
    (`QuickEditActivityEndpoint.cs:19`), its sibling as `Post("/activity/{id:long:required}/clone")`,
    and `SetArchivedActivityEndpoint.cs:17-19` even carries a comment explaining the split. The client's
    `QuickEditActivityRequest` matches the server record field for field, so only the verb and the path
    are wrong.

    Two things the finding could not see. First, **`QuickEditMode.ts:5-7` is the bug's own
    documentation**: *"The values are the PascalCase path segment of `PATCH /activity/{id}/{mode}`, so
    they are a wire contract — do not recase them."* That comment is false and actively defends the
    defect against anyone who notices the casing. Second, **the *Clone* mode is equally dead and has
    never been observed by anyone** — it is the non-default option in the same select, and no unit in
    the sweep picked it. Third, the blast radius: `ActivitySelectOrQuickEditFormField` is mounted by
    four dialogs across `dayPlanner` **and** `todoList`, so renaming an activity has been a silent
    no-op everywhere in the app, not on one screen. `F74`.

117. **`leisure-bucket-anchors/B1`'s five "silently ignored server-side" filters are all applied in the
    API source — the unit was driving a backend it had not restarted.** The finding is careful and its
    request/response captures are exact, which is what makes it instructive. Read this pass:
    `GridActivityBucketListProfileEndpoint.ApplyCustomFiltering` has explicit branches for
    `MinComfortZoneStep` and `MaxComfortZoneStep`; `GridMemoryAnchorEndpoint` has them for `MinRating`,
    `AnchorMonth` and `AnchorYear`. Three things line up to explain every case:
    - the `year`/`month` half is **`F60`**, not a server gap — the client sent `year`/`month` while the
      server reads `anchorYear`/`anchorMonth`, and the filter DTO's own comment says so in as many
      words (*"The client sent `year` / `month` until F60 renamed them to these — the server side of
      that agreement is to keep them, not to alias the old pair"*). `F60` shipped and was verified.
    - `minRating` and `minComfortZoneStep` were always spelled right on both sides, so the only
      explanation left is the build: `B11` landed 2026-09-15 and round 2 ran the same day.
    - the unit's **own round 3** (2026-09-16) says it verified `X3` *"against the restarted local
      backend"* — i.e. it did not restart until the day after the observations in question.
    Re-graded from `bug` to not-a-defect pending one retest, which is in *Needs verification*. The
    operational note this leaves behind is worth more than the finding: **a "the server ignores this"
    observation is only as good as the build under it**, and this repo's units have now hit that twice
    (§13's original filing was the other). Restarting the API before a mutation round is cheaper than
    a triage pass reading four endpoint files.

118. **`planner-day/B8`'s stale counters are not a cache — the server computes them live, so the
    finding is asking the wrong question.** It concludes *"Backend-side — `Calendar.totalTasks`/
    `completedTasks` read as a denormalized counter on the `Calendar` row… incremented on `POST` but not
    decremented on `DELETE`"*, and recommends batching it into a backend session. There is no counter
    to decrement: `CalendarResponse.cs:62-63` projects `TotalTasks = c.Tasks.Count()` and
    `CompletedTasks = c.Tasks.Count(t => t.Status == PlannerTaskStatus.Completed)`, and `Calendar.cs:50-51`
    are computed properties over the same navigation. So the post-reload response reading
    `{"totalTasks":3,"completedTasks":1}` means the server still had three tasks when it answered — and
    the question becomes *"did the delete happen?"* rather than *"is the cache stale?"*. Two candidates
    the finding's own evidence does not separate: the `DELETE` did not succeed while the grid dropped
    the row optimistically, or the grid's task source is narrower than `Calendar.Tasks`. Moved to
    *Needs verification* with a settling step, **not** to *Escalations*. Had it gone to a backend prompt
    as filed, the ask would have been to fix a counter that does not exist.

119. **The pass's own shape says something about the unit prompts.** Five mutation rounds, three
    blockers, and all three came from the rounds that **edited or deleted an existing row** and restored
    it by hand (units 8, 12, 13). The rounds that created an entity and stopped found validation and
    labelling gaps but no blocker. That is `F73` and `F74`'s whole story — both are write paths against
    an *existing* entity, which a create-only pass cannot reach. Worth carrying into units 16–19: a
    mutation round that does not edit and delete something pre-existing has exercised the cheaper half
    of the contract. It is also why `F73` and `F74` sat undetected through fourteen triage passes.

120. **Escalation §7 describes the wrong sentence, and the real one is worse.** §7 (and `B18` after it,
    which was written from §7) says the client is told *"This record was changed by someone else.
    Refresh the page and try again."* for every 409, citing `ErrorHandlingFunctions.ts:23-25`. That
    citation is correct and the conclusion is not, because **`handleHttpCodes` is not the path most
    409s take**. It is only reached from a call site that opted out with `_silent: true` and then
    routed the status back through it — two sites in the whole app. Every other 409 goes through the
    interceptor, and `axiosConfig.ts`'s `case HttpStatusCode.Conflict` is
    `showErrorSnackbar(serverMessage ?? t('httpErrors.conflict'))` — `serverMessage` first. For a
    DB-derived 409 that message is the API's internal prose (*"Unique constraint violation during
    Create"*), so what users have actually been shown is untranslated English developer text, in a
    Slovak UI, on the commoner path. Both wordings are wrong; the one nobody had noticed is the one
    that fires more often. Recorded in `FW24` and in §7's own paragraph, which now carries the
    correction above the original text rather than replacing it.

121. **`B18`'s "delete the two `_silent` + call-site wordings" would regress `todo-routine/B11`.** The
    backend's response, and the ask this repo wrote before it, both list *"the two `_silent` + call-site
    wordings in `todoList` can be deleted"* as a frontend consequence. Read at the source:
    `TimePeriodForm.onConfirm` catches the 409, sets `conflictError`, and **returns without calling
    `dialogApi.close()`** — the dialog stays open with everything the user typed and the message renders
    against the form. An interceptor snackbar cannot do either, and the dialog closing before the
    message arrived is precisely the defect `B11` fixed (`e39c01c1`). So `F85` keeps both `_silent`
    call sites and changes only their **condition**, from `status === 409` to the specific `errorType`.
    The bullet is a reasonable thing for the backend to have assumed — the ask it was answering said the
    client "worked around it twice" without saying what the workaround bought.

122. **`useDeleteConfirmation` was never guessing about FK refusals, so there is nothing in it to
    change.** Same list, third bullet: *"`useDeleteConfirmation` can stop guessing about FK refusals it
    cannot see."* The composable (`src/core/user/composable/useDeleteConfirmation.ts`, 45 lines) is
    entirely pre-flight: `resolveDelete({cascades, undoable})` decides whether to **ask** before the
    request is made, and it never touches a response. The post-hoc FK handling lives at the call site
    that has it — `RoutineSettingsView.showDeleteBlocked`. Dropped from `F85`'s change list. Worth
    stating because the composable is one of three sanctioned cross-module imports in CLAUDE.md, so a
    fixing session widening it on this advice would be changing a shared contract for nothing.

123. **`F73` re-graded `med` → `high`: a 404 is the lucky outcome, not the defect.** All three units and
    the fifteenth pass described the symptom as *"every write silently 404s"*, which the direct-request
    evidence supports. Reading the API this pass adds the part none of them could see:
    `AuthorizeAsync` on all three profile entities is
    `ownership.OwnsActivityAsync(DbContext, User.GetId(), entity.ActivityId, ct)` — it authorizes **the
    row the id found**, not the row the user meant. The three grid responses project `Id` and
    `ActivityId` as separate fields, and every write route is the base `{id}` (the readiness board's
    patch only re-routes the suffix). So the 404 depends entirely on profile ids and activity ids not
    colliding, which is true of the current fixture by accident of banding (17xxx vs 12xxx) and is not
    a property of anything. Where they do meet, the ownership check passes and the edit, delete or
    status change lands on a **different profile of the same type on the same account**, silently.
    Effort stays `med`; severity does not.

124. **`F74` cannot be fixed by renaming the path segment, which is what the batch's own title
    suggests.** Confirmed at the endpoints: `QuickEditActivityEndpoint.cs:19` is
    `Put("/activity/{id:long:required}/quick-edit")` answering **204 with no body**, and
    `CloneActivityEndpoint.cs` is `Post("/activity/{id:long:required}/clone")` answering **200 carrying
    `clonedEntity.Id`**. The client has one function interpolating a mode into `API.patch`, so the two
    modes have to become two functions — different verb, different path, different response. The
    latent second bug: the current mapper is `response.data != null ? Number(response.data) : null`,
    and axios hands back `data === ''` for a 204, so `'' != null` is true and the overwrite path will
    return **`0`** the moment it starts working. Harmless today only because the call site gates on the
    mode (`if (cloneId && mode === CLONE)`). Added to the batch.

125. **`F81`'s missing icon is real, Pro-only, and — checked rather than assumed — the only one of its
    kind in the app bar `mdi-close`.** `calendar-range` is absent from `free-solid`, `free-regular` and
    `free-brands`, including each definition's ligature aliases, so it cannot resolve at runtime; the
    literal is in `RecurrenceType.ts:15`, not a template, which is why a `.vue`-only grep would miss it.
    The question the batch left open — *"worth one grep for other `calendar-range` references"* — is
    answered wider than asked: every static icon literal in `src/` (204 in `.vue`, 79 in `.ts`,
    `_common` included) was resolved against the three packs, and **exactly two do not resolve**: this
    one and the `mdi-close` already filed as `F46`. No registry, no lint rule, no sweep batch — two
    one-line edits that already have homes. The dynamic bindings (`:icon="item.icon"` and friends) are
    out of reach of this check by construction; they render whatever the data carries, which is the
    `iconPicker`'s problem, not this one.

126. **`B16` is landed on this side and uncommitted on the other, and §10 reads as if both are done.**
    The tombstone says *"backend landed `B16` … frontend half landed the same day"*. The frontend half
    is genuinely in this tree (four files, uncommitted). In `AdhdTimeOrganizer`, `FoldedRow.cs` is
    **untracked** and the seven endpoints that reference it are **modified**, with no commit carrying
    them — which the backend's own response admits in passing (*"landed on dev (uncommitted working
    tree as of now)"*) and which the tombstone flattened into "landed". Consequence for anyone
    retesting: the four pie endpoints still send the literal `"Other"` on any reachable server, so
    §10's untranslated-legend and selectable-slice symptoms both reproduce, and a retest today would
    fail for a reason that is not this app's. The client guard is a no-op against the old wire value,
    so nothing here needs reverting or reordering. While confirming it, the one question the backend
    asked back — *"confirm the merge path sums rather than overwrites"* — is answerable from the code
    without a browser: both locally-bucketing sections accumulate into a single `otherSeconds` and push
    one segment, so a server-folded row above the local 3 % threshold **merges**. `F84` was
    re-confirmed on the same trip: `HistoryPieChartBuilder.cs:20` is already `OtherName = "_other"`, so
    the backend's offer to do the History side as a follow-up needs no answer but "nothing to do".

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
| `planner-templates/X1` | `blocker`, one fan-out, app-shaped fix | `blocker`, **two** fan-outs (`F50`); helper-level cause split out as **`FW18`** | Contradictions 85, 87; rule 1 |
| `planner-templates/B3` | own `bug` | folded into **`F50`** — same file, one attribute | `FW11`/`FW13` precedent for a same-file fold; still a `bug` |
| `planner-templates/X2` | `blocker`, "opened panel unusable", day planner as the working reference | `blocker`, **re-described** (`F51`): the *open* panel squeezed and off-screen, **no reopen control**; the day-planner reference withdrawn as unobserved | Contradiction 86 |
| `planner-templates/A3` | `a11y`, "mobile panel-open toggle" | `a11y`, **re-identified** — the shell's close X (or the header undo); the toggle it names does not exist; closes in `F56` | Contradiction 86 |
| `planner-templates/U3` | `unverified` (source read only) | ✅ **settled from source**, closes in **`F56`** | a `VBtn` with only `icon` has no name; a browser would return the same empty triple the unit already got for `A1` |
| *(unfiled — both planners' undo buttons; day planner's mobile `bars` toggle)* | — | **app batch `F56`**, source-certain | found reading `A3`'s files; the badge count becomes the undo button's name; unit 7 never resized |
| `planner-templates/P2` | own `polish` | merged into **`F38`** | `MiniTimeline.vue:50` has been in `F38`'s file list since the eighth pass; the unit observed what the grep predicted |
| `planner-templates/B2` | `bug`, one field | `bug`, **whole form** (`F53`) — name/description/icon caps too; the backend's `required` confirmed from source, **no escalation** | Contradiction 88 |
| `planner-templates/B5` | `bug`, navigation only | `bug`, **also survives a reload** (`F55`) — the store persists `templateName`; dead `throw` on `:50` noted | Source; the `F43` shape on the template side |
| `planner-templates/B1`, `B4`, `A1`, `A2`, `P1` | as filed | stand as filed — `F52`, `F54`, `F56`, `F56`, `F57` | each re-verified in source; `A2`'s pointer intercept is observed (Playwright's own log) and not re-derived |
| `planner-templates/U1`, `U2` | `unverified` | stand — **mutation pass** settles both; `U1` is a seed-shape gap to be filled through the app's API, not a seed ask | Rule 5; CLAUDE.md *Mutating specs* rule 1 |
| `leisure-backlog-picker/X1` | `blocker`, backend ask "sort breaks the name filter" | `blocker`, **re-scoped**: the name filter has never existed on the wire on any of the four leisure grids — escalation **§13**; the count-only "evidence" explained by `scopeFilter` `isRepeatable: false` against a repeatable seed row | Contradiction 89 |
| `leisure-backlog-picker/X2` | `blocker` | `blocker`, app batch **`F64`**; the server's own doc comment states the contract the client breaks | source, both sides |
| `leisure-backlog-picker/X3` | `blocker`, two compounding bugs | **split**: the `0`-default half → **`F63`** (`bug`, four DTOs not one); the "no snackbar" half → *Needs verification* — no mechanism in source, contradicted by unit 2 | Contradiction 91; rule 5 |
| `leisure-backlog-picker/B1` | `bug` **[framework]**, one column | `bug` **[framework]** `FW20`, **two** app columns (+ two framework slots that already dodge it); the second (`inspirationSource` → "—") unfiled by unit 12 | Contradiction 96 |
| `leisure-backlog-picker/P1` | own `polish`, "the only leisure view" | **merged into `F6`** — the eighth pass listed all four call sites; the unit's grep missed three | Contradiction 93 |
| `leisure-backlog-picker/P2` | own `polish` | folded into **`F64`** — the comment is in the file `F64` edits | same-file fold, `F50`/`B3` precedent |
| `leisure-backlog-picker/O1` | `opportunity` | stands, deferred; the filter half is moot until §13 (the server reads neither field), the ranking half is the real opportunity | Rule 6 |
| `leisure-backlog-picker/U1`–`U4` | `unverified` | stand; each has a `playwright-cli route` or seed probe named | Rule 5 |
| `leisure-bucket-anchors/X1`, `X2` | two `blocker`s | one app batch **`F61`**, `blocker` — one cause, two constants; grown by the empty-on-failure half `ProjectsView` also lacks | Rule 3 |
| `leisure-bucket-anchors/X3` | `blocker`, "route ordering" | `blocker`, **split**: the route does not exist → escalation **§12**; the `try/finally` → **`F62`** | Contradiction 92; rule 2 |
| `leisure-bucket-anchors/B1` | `bug`, five fields "ignored server-side", `activityName` "working" | **split**: `year`/`month` are the client's own naming slip → **`F60`**; `minRating` and the comfort-zone range → **§13**; the `activityName` "working" withdrawn as unexplained | Contradiction 90 |
| `leisure-bucket-anchors/B2` | `bug`, two DTOs | `bug`, **`F63`** — four DTOs, with `X3`'s half and one unfiled | grep `public \w+Id: number = 0` |
| `leisure-bucket-anchors/A1` | `a11y`, "several controls" | **split**: row actions → **`FW5`** (grown, the slug); header/timeline controls → **`F65`**, re-graded **`a11y` → `polish`** (a `title` is a name) | Contradiction 98 |
| `leisure-bucket-anchors/P1` | `polish` | stands, **`F66`** | — |
| `leisure-bucket-anchors/O1` | `opportunity`, "rendered as plain columns" | stands, deferred, **corrected**: `inspirationSource` renders "—" today (`FW20`) | Contradiction 96 |
| `leisure-bucket-anchors/U1` | `unverified` | stands — the unit's mutation pass, through the API; testable today (does not touch §12's route) | Rule 5 |
| `leisure-bucket-anchors/U2` | `unverified` | ✅ **settled from source** — the flag is computed, not stored | Contradiction 97 |
| `home/B2` (round 2) | `bug`, `F8` "loading branch" | `bug`, **`F8` rewritten** from the root — the `loadToken` race; effort `low-med` → `med` | Contradiction 95 |
| `home/B4` | `bug` | stands, **`F59`** — source-verified (`isFinished` reused for row state; `toggleTaskStatus` tests `Completed` only) | — |
| `home/A1` | `a11y`, "confirm whether Vuetify ships the key / fix the merge" | stands as `a11y`, **`F58`** — settled from a diff: the EN block is a byte-identical copy of `vuetify/locale`'s `en` minus two keys | node diff this pass |
| `home/U1` | `unverified` | ✅ **verified in a browser** (round 2), folded into `F8` | Closed verification items |
| `home/B1`, `B3` | as filed | stand — `F7`, `F9`; round 2 re-confirmed both unchanged | — |
| `activity-settings/X1` | `blocker`, "needs a decision on which side" | `blocker`, **escalation §11** — the decision is answered from the server's own `ColorPalette` and seeder; grown by the `varchar(7)` column and the `/todo-list` category form | Contradiction 94; rule 2 |
| `activity-settings/B8` | own `bug` | folded into **`F19`** — the generic dialog it describes is the one `F19` removes; the one-attribute alternative named in case it is kept | Rule 3 |
| `activity-settings/B9` | `bug` **[framework]** | stands, **`FW19`** — source-verified check order at `axiosConfig.ts:91-97` | — |
| `activity-settings/U1`, `U2` | `unverified` | ✅ **closed in a browser** (round 2) | Closed verification items |
| `activity-settings/B1`–`B7`, `A1`, `P1`, `P2` | as filed | stand — round 2 re-confirmed all open against `e2e-v4` | — |
| *(unfiled — `ActivityProjectProfileRequest.activityId = 0`)* | — | **`F63`**, source-certain | grep |
| *(unfiled — `inspirationSource` renders "—")* | — | **`FW20`**, source-certain, seed says the row has text | Contradiction 96 |
| *(unfiled — `$vuetify.command.search` missing in EN)* | — | **`F58`**, from the diff | — |
| *(unfiled — `/todo-list` category create/edit fails the same colour rule)* | — | **§11**, by construction (shared validator, same `ColorPicker`) | Contradiction 94 |
| `history-capture/B4` + `B5` | two `bug`s, "same root shape" | one app batch **`F67`**, `bug`, with the **stopwatch** as an unfiled third view and a decision named | Contradiction 106; rule 3 |
| `history-capture/B6` (was `U1`) | `unverified`, two halves of different standing (§53) | `bug`, **`F68`** — double-submit observed; the reset half is now a correctness requirement (the 409 index) | Contradiction 107 |
| `history-capture/B1`, `B2` | open | stand, **re-confirmed live** in round 2 (`F35`, `F36`) | — |
| `history-capture/B3`, `P1` | open | stand, not re-walked (no code change) — `F37`, `F38` | — |
| `todo-lists/X1` | `blocker` **[framework]**, `ColorPicker` → hex | `blocker`, **merged into §11** — the server's validator is the stale side; the suggested fix is the one §11 rejects | Contradiction 99 |
| `todo-lists/B7` | `bug` | stands, **`F69`** — the sixth delete site, never in P3's five; routine twin unfiled | Contradiction 112 |
| `todo-lists/B8` | `bug`, "never updated after a routing change" | stands, **`F70`** — born broken on 2026-05-16, one day after the server moved the route | Contradiction 100 |
| `todo-lists/A3` | `a11y`, one checkbox | `a11y`, **`F71`** — plus the step checkboxes | Contradiction 113 |
| `tracking-settings/X1` (round 2) | `blocker`, amendment reads a keyboard path as "stacking/paint" | `blocker`, stands as `F12`; the amendment is annotated as consistent with the scroll-box cause | Contradiction 101 |
| `tracking-settings/X2`, `X3`, `B6` | three findings (two `blocker`, one `bug`) | one app batch **`F72`**, `blocker` — one function; `X3`'s suggested shortcut rejected | Contradictions 102, 105; rule 3 |
| `tracking-settings/X4` (was `U1`) | `blocker` | folded into **`F13`** — the dead delete that batch already wires, now observed; `U1` closed | — |
| `tracking-settings/B7` | `bug`, "likely a `BasicTable` default" | `bug`, folded into **`F13`** — one `deleteConfirmationColumn` attribute per table | Contradiction 104 |
| `tracking-settings/B5` | `bug` | **`opportunity`**, deferred — the ledger is by design; the marker is a product question with a backend half | Contradiction 103 |
| `tracking-settings/B1`–`B4`, `P1`, `O1` | as filed | stand — `F13`, `F14`, `F15`, `F16`, `F17`, deferred; round 2 re-confirmed `B1` on both platforms | — |
| `auth/X1` (was round 1's `X1`) | `blocker`, open in `FW9` | ✅ **fixed** — `vue_framework` `6157283`, verified round 3; `FW9` keeps its other two thirds | Contradiction 108 |
| `auth/X2` (was `O1`, re-graded `bug` in the ninth pass) | `blocker` (unit's round 2) | ✅ **fixed** — same commit, verified round 3; `FW13` keeps the catch and `P1`'s links | Contradiction 108 |
| `auth/B6` | `bug`, "backend no longer signals it" | `bug`, **escalation §14** — the branch exists and is dead under `RequireConfirmedEmail`; a `Sydowwe.Framework` fix | Contradiction 109; rule 2 |
| `auth/B7` | `bug` | **`polish`**, **`FW21`** — the 401 is the `FallbackPolicy`'s; one wasted request | Contradiction 110 |
| `auth/B8` (was `U1`) | `unverified`, `FW14`-if-confirmed | `bug`, **`FW14`** — observed in round 3 | — |
| `auth/B4` | `bug`, sibling is the model (round 1) | `bug`, both views bare — **the unit now agrees** with `FW12` (round 2 re-drove it) | — |
| `auth/B5` | `bug` | stands in `FW12`; the `/undefined` request now observed, and it is `FW21`'s trigger | — |
| `auth/U5` | `unverified` | ✅ **resolved, no defect** — all three claims seen live after a real registration | Closed verification items |
| `auth/U2`, `U3`, `U4` | `unverified` | stand; `U2` and `U4` now gated by §14 as well | — |
| `auth/U6` | `unverified` (unit, round 2) | stays **dropped** (§64); the 415 detail folded into `FW12` | Contradiction 111 |
| `auth/B1`, `B2`, `B3`, `A1`, `P1`, `P2`, `P3` | as filed | stand — re-verified live or by source in round 2 (`F39`/`FW11`, `FW7`, `FW9`, `FW7`, `FW13`, `F40`, `FW11`) | — |
| `todo-routine` round 8 | — | no new findings; every entry `fixed and verified`; two stale ⏳ rows in *Awaiting retest* struck | — |
| `leisure-projects/X1` + `leisure-backlog-picker/X1 (r2)` + `leisure-bucket-anchors/X4` | three `blocker`s, three units, three root-cause readings | merged into **one batch** (`F73`); severity stands at `blocker` | Contradiction 115 — one `id` getter in three DTOs, nine call sites |
| `leisure-backlog-picker/X1 (r2)` | `blocker`, *"a contract question… flag to whoever owns the backend contract"* | `blocker`, **app-side, no escalation** | Its two sibling units already proved the server's keying with a direct request (204/200 on the row's own id) |
| `planner-day/X1` | `blocker`, *"Backend: register… the activity-overwrite endpoint"* | `blocker`, **app-side** (`F74`); grew to include the never-observed *Clone* half and three more dialogs | Contradiction 116 — the route exists as `PUT …/quick-edit`; the client calls a replaced name |
| `planner-day/B8` | `bug`, *"confirmed stale server-side"*, batch into a backend session | **premise disproved**; moved to *Needs verification*, not *Escalations* | Contradiction 118 — `TotalTasks` is `c.Tasks.Count()`, a live aggregate, not a counter |
| `leisure-bucket-anchors/B1` | `bug`, five filters ignored server-side | **not a defect pending retest** — all five applied in the API source | Contradiction 117 — pre-`B11` local build; the `year`/`month` half is `F60`, already shipped |
| `leisure-projects/A4` + `planner-templates/A4` | two `a11y` findings, two units | merged into **`F78`**; both stand at `a11y` | Identical edit (`role`+`tabindex`+keydown+`aria-label`); the *pattern* is what needs deciding once, with `F29`/`FW6` |
| `leisure-backlog-picker/A1 (r2)` | `a11y`, own finding | folded into **`F49`** | Same `VChip`-renders-no-role cause as the four chip groups already in that batch |
| `leisure-backlog-picker/B5 (r2)` + `leisure-bucket-anchors/B3` | one `[framework]` `bug` + one previously-unfiled column | both into **`FW20`**; `B3` is the worse half | `inspirationSource` is not mis-formatted, it is **deleted** — proved from inside the running component |
| `leisure-backlog-picker/P1 (r2)` | `polish`, *"worth checking against the other leisure tables before filing"* | `polish`, **own framework batch** (`FW23`), decision-first | Rule 4 — `VDataTable`'s multi-sort default ships to every app on the framework |
| `leisure-projects/B4` | `bug`, *"add `:precision="1"`"* | `bug` stands (`F76`); **suggested fix rejected** — `:precision="null"`, per `UseTemplateActionBar.vue:33-34` | `1` silently truncates two-decimal input; the repo already has the right pattern |
| *(unfiled)* `TableCellEditor`'s `DECIMAL` branch | — | new **framework** batch (`FW22`), source-certain, **no consumer in this app** | Rule 1 split from `F76`; found while sizing it |
| `leisure-backlog-picker/B3 (r2)`, `B4 (r2)` + `leisure-bucket-anchors/B2` (feedback half) | three `bug`s across two units | merged into **`F77`**; settles §91 | One cause: no `required` rule and no `catch`, so a per-field 400 dies in the interceptor |
| `planner-templates/P3` | round 1's `U1` (`unverified`) | `polish` (`F83`) — the unit re-graded it itself and was right | Round 2 built the first `isBackground` task the fixture ever had; the exclusion is correct, the label is not |
| `planner-templates/B2` | `bug`, day-type gap | `bug`, **broadened and now source-corroborated**; `F53` unchanged | Round 2 read the form end to end: zero `:rules` on any of five fields — the batch already said so |
| `leisure-backlog-picker/U5` and `planner-templates/U3` | `unverified` | `unverified`, but **settle from one file read**, not a browser | Flagged in *Needs verification* so neither costs a session |
| `leisure-backlog-picker/O2` | `opportunity` | stands, with a note: it is a latent **correctness** risk, not unspent data | Re-graded to `bug` only if a display-name collision is ever observed |
| `history-capture/B4`, `B5` | `bug`, open | ✅ **fixed and verified 2026-09-15** (`F67`) — closed by the retest note, not by this pass | The unit's own round note; `B4`'s server half is retired §15 |
| *(sixteenth pass, 2026-09-21 — everything below is from landings and source re-reads, not from a unit)* | | | |
| `leisure-projects/X1`, `leisure-backlog-picker/X1 (r2)`, `leisure-bucket-anchors/X4` (`F73`) | `blocker` ×3 → batch `med` | batch severity **`med` → `high`** (effort still `med`) | §123 — authorization runs on the row the id *found*, so a colliding id is a silent wrong-row write, not a 404 |
| `planner-day/X1` (`F74`) | `blocker`, "rename the path segment" | `blocker` stands, **fix reshaped**: two verbs, two response shapes, two functions; `Number('') === 0` trap added | §124 — read at `QuickEditActivityEndpoint.cs:19` and `CloneActivityEndpoint.cs` |
| `planner-day/P1` (`F81`) | `polish`, "this app does not bundle it" | `polish` stands, **proved and bounded** — Pro-only, and the app-wide sweep finds exactly two unresolvable literals | §125 — the batch's own open grep, answered wider than asked |
| *(unfiled — `F84`)* | app batch off §10's closure | stands, **re-confirmed in the API** (`HistoryPieChartBuilder.cs:20`) | §126 — the backend's follow-up offer needs no answer |
| escalation §7 / `B18` | open ask, "client side closed" | **ask landed** (API `cd0a252`); frontend half filed as **`FW24`** (framework) + **`F85`** (app) | Rule 1 split; §120–§122 correct three claims in the ask's own frontend list |
| `leisure-backlog-picker/U5` | `unverified`, "settles from one file read" | ✅ **closed — not a defect**; the key is already user-scoped | Round 2 filed it against a state of the file that `P4` had already fixed |
| `planner-templates/U3` | `unverified`, "settles from one file read" | ✅ **closed — confirmed**; absorbed by `F56` as control #4, no new batch | `TemplateSplitView.vue:5-11` has no name source at all; a browser could only re-observe the markup |
| `todo-routine` seed-drift note (Meditation streak 6, not 5) | standing caveat for later passes | **retired** — a reseed restores 5 and an un-tick now walks the streak back | Answered by `B9` (API `4ab3710`), option 2; client needs nothing |

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

`history-capture` (fourteenth pass, mutation round) — all three new findings read against source and
the API's (`ActivityHistoryValidator`, `ActivityHistoryConfiguration`'s index). `B4` and `B5` stand and
merge; `B6` stands and both its halves are now sourced. What the unit got right is the **entity
lifecycle discipline** the pass exists for: it created rows, read their ids off the response body,
photographed the malformed prompt, counted requests, and reseeded. What it got wrong is **extent**,
again, the same way as in round 1 (§48–§53): two views where there are three, "under a minute" where
the cliff is thirty seconds on one view and rounds on another, a 409 whose consequence for the
*single*-click case it did not draw out. Two things it did not do and said so: `B3` and `P1` were not
re-walked (no code change — correct call), so `F37`'s prediction that edit mode's pencil hides the chip
is still unobserved, and `TimerPresetDialog`'s unconditional confirm (`F37`'s adjacent, "let the
mutation pass file it") was not exercised either. Its tally (0 · 6 · 0 · 1 · 0 · 0 = 7) matches its body.

`todo-lists` (fourteenth pass, round 6 — the unit's first real mutation pass, five rounds after its
inventory) — all four new findings read against source, and the API's for two (`MoveTodoListItemEndpoint`
and its request; the validator base behind `X1`). `X1` merges into §11; `B7`, `B8`, `A3` stand and grow
by one twin each. What the unit got right is **the evidence on every line**: three request bodies with
their 400s for `X1`, the preference checkbox's state in the same snapshot as the missing dialog for `B7`,
the console stack through `TodoListView.vue:197-200` for `B8`, an `eval` triple for `A3` — and a
lifecycle that left nothing behind without a reseed. What it got wrong is **ownership**, twice: `X1`
filed against the framework picker when the server's own constants use the names it emits (§99), and
`B8`'s history read in the wrong direction (§100). And what it did not know is what the queue had
already written: §11 named this exact form as broken by construction two passes earlier, and `B7`'s
composable was outside P3's list from the start. Its round history is now the longest in the sweep (six
rounds plus 1a/2a) and still reconciles — the tally line's "4 open items: X1, B7, B8, A3" matches the
body exactly.

`tracking-settings` (fourteenth pass, mutation round) — all seven new findings read against source and
the API's (both mapping request DTOs and their validators, the heartbeat, the distinct-entries grid).
`X2`, `X3`, `B6` merge; `X4` and `B7` fold into `F13`; `B5` falls to `opportunity`; `X1`'s amendment is
annotated. What the unit got right is **reaching the unreachable**: it found the `focus()` + Enter path
past `F12`'s blocker on its own, used it to drive edit and delete on both platforms, and thereby turned
`U1` into an observation and found `X3` — a defect no inventory pass could have seen. What it got wrong
is the mechanism beneath two of its own observations (§101, §105) and the fix for one (§102 — the
shortcut that would re-activate rules), and one expectation it wrote itself in round 1 and then held the
app to (§103). Its tally (4 · 7 · 0 · 1 · 1 · 0 = 13) matches its body with `U1` correctly marked stale
and uncounted. One thing for whoever runs `F72`: every rule this round created is still in the database
only if the reseed did not run — the unit says it did.

`auth` (fourteenth pass, rounds 2–3, from `04c405e9`) — the two new findings and every re-verification
read against source, and the framework repo's for `B6` (`PasswordSignInFlow.cs`,
`IdentityServiceExtensions.cs`). `B6` becomes §14; `B7` falls to `polish` and becomes `FW21`; `B8` becomes
`FW14`; `X1`/`X2` were fixed before this pass read them. What the unit got right is **closing its own
loop**: round 2 escalated `O1` to a blocker with the direct-API experiment that proved the server accepts
the empty token, the fix landed the same day, and round 3 re-ran exactly the two blockers and the
`unverified` rows they unblocked — the retest model the runbook describes, done by the unit itself. And
it corrected its own round-1 error on `B4` unprompted (§60 had said the same; the unit reached it
independently). What it got wrong is the layer beneath the screen, as ever: a 401 it read as the
endpoint's answer (§110), a branch it read as removed (§109), and a spinner it kept chasing after the
queue had settled it (§111). Its tally (2 · 8 · 1 · 3 · 0 · 5 = 19) matches its body, with `O1`/`U1`
kept as pointers and not double-counted.

`todo-routine` (fourteenth pass, round 8) — nothing to challenge: a re-run of the unit prompt that read
its own instruction ("mostly verification, not discovery") and diffed two screens against round 6/7's
numbers. Exact match, console clean, no new findings. The only queue effect is two stale ⏳ rows struck.

**Sixteenth pass (2026-09-21).** No unit ran, so the sample was chosen rather than given: the batches a
fixing session would pick up first, plus everything the two landings touched. `F76` and `F80` were
re-read and stand exactly as written — `NewProjectProfileForm.vue:34-39` is `:step="0.5"` with no
`:precision`, and `ProjectReadinessBoard.vue:86-88`'s two adjacent `<template v-if>`s do produce
"Woodworking· 8.5h", which is Vue's `whitespace: 'condense'` behaving correctly (the gap between a
`}}` and an element condenses to a space; the gap between two elements with a newline is removed, and
that second one is the `·` with nothing in front of it). `FW19` re-read and unchanged:
`extractServerMessage` still returns `detail`, then `message`, then `errors`, so the specific text is
still last. The rest of the queue was not re-challenged this pass — 100+ batches over sixteen passes,
and the input that would justify it is a unit round, not another read of the same files.

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

**Twelfth pass (unit 8) — coverage tracker note.** The first pass on a clean tree: `docs/views/planner-templates/`
and its draft spec were committed at `9e36b92f` and the unit file is in `units/_done/`. Two rows in
`_routes.md` are now stale and the operator should edit them (this pass touches only the queue and the
log): the tracker row (`:123`) is still **☐**, and `/day-planner/templates/split` (`:45`, `:100`) still
carries the orphan ⚠️ although the inventory resolves it — the *Edit Side by Side* button on
`/day-planner/templates` (`inventory.md:26`, `TemplateListView.vue:47`) navigates there, so the fix
`P1-split-view-dead.md` asked for has landed. One wrinkle worth carrying into the manifest's note: the
button renders at `mdAndUp` only, so the split view has **no mobile entry point** — deliberate for a
drag-and-drop editor, and not a finding. The three template route rows (`:44-46`) are otherwise accurate;
nothing in `F50`–`F57` adds, removes or redirects a route. The unit's tally (2 · 5 · 3 · 2 · 0 · 3 = 15)
matches its body, and its `U` numbering runs `U1`, `U3`, `U2` in file order — harmless, noted so nobody
hunts for a missing one. Its inventory rows `:162` and `:207-211` describe the mobile panel wrongly
(§86) and should be corrected when the unit's mutation pass appends to the file.

**Thirteenth pass (units 11, 12; mutation rounds 1, 2) — coverage tracker note.** Nothing in this pass
is committed: `docs/views/leisure-backlog-picker/`, `docs/views/leisure-bucket-anchors/`, both draft
specs and the two mutation-round `findings.md` edits are untracked or modified, and the unit prompt
files for 11 and 12 are still in `units/` (modified, not moved to `_done/`) — the operator's call, once
the docs are read. `_routes.md`'s coverage tracker is now stale for more rows than it is right for:
**2, 4, 5, 6, 7, 8, 11, 12, 13, 15 all have an inventory on disk and are ☐** (`:117-130`); only 1, 3, 9,
10, 14 are ticked. The four route rows for units 11 and 12 (`:51-54`) are accurate — nothing in `F58`–`F66`
adds, removes or redirects a route. Both tallies match their bodies (11: 3 · 1 · 0 · 2 · 1 · 4 = 11; 12:
3 · 2 · 1 · 1 · 1 · 2 = 10). Two inventory corrections for the units' mutation passes to carry: unit
12's `inventory.md:44` lists *Inspiration source* as a rendered column — it renders "—" (§96); unit 11's
"activity-name filter survives a reload" describes the URL codec, not the table (§89). Unit 2's
round-2 header tally reads *"unverified 2 (U1/U2 resolved this round, U3/U4 remain open)"* and its
body agrees; unit 1's reads `unverified 0` and its `U1` section is gone from the body, folded into
`B2` — consistent, noted so nobody hunts for it.

**Fourteenth-pass addendum:** the working tree holds the unit-4, 6 and 9 mutation-round docs and unit
10's round 8 (nine modified files, fifteen new screenshots) plus `units/10-todo-routine.md` staged into
`_done/`; `units/04-*`, `06-*` and `09-*` are back in `units/` after their rounds, the way `04c405e9`
moved 01/02/04 out for theirs — so **the `units/` listing no longer tracks completion**; the
round-history tables do, and every unit but 16–19 now has at least an inventory. `_routes.md`'s tracker
(`:117-134`) still has 4, 6 and 15 as ☐ although each has had two rounds. No route changed in this pass;
`F70` corrects an API path, not a route. Three of the four rounds reseeded (4, 6, 15 — twice) and one
restored by hand (9); `e2e/.state/auth-10001.json` is stale. The one operator action this pass asks for:
**run a `git log --since` over `docs/views/` before the next scoped triage** — the auth round sat
committed for a full pass because "the working tree" was the scope (§108).

## F29. Stacked-bar columns are bare `div`s — no name, no role, no `tabindex`, no key handler; and on Detail they show a pointer and do nothing
> ✅ **FIXED 2026-09-22, with `F30`, `F49` and `F78` — the clickable-`div` convention is settled here:**
> `role="button"` + `tabindex="0"` + one `@keydown.enter.space.prevent` line to the click's handler, an
> `aria-label` that opens with the verb the click performs, `:focus-visible` outline in `secondary`. The
> chart got an `interactive` prop (`StackedBarsChart` → `StackedBarsGrid` → `StackedBarColumn`), passed by
> the five consumers that bind `@activityClick`; `HistoryDetailView` does not, so its bars are `role="img"`
> with `cursor: auto` — the affordance lie is gone from that side too. The label is
> `activityTracking.stackedBars.barLabel` (`{name}, {duration}, {window}`; name via `common.other` for
> the bucket, duration `fromSeconds(active + background)` — the tooltip's headline, window from a new
> `formatWindowA11yLabel` in the grid that keeps the date where the x-axis splits it into the group row);
> interactive bars wrap it in `statColumn.viewDetails`, so the bar and the domain card on one dashboard
> read as the same kind of control. Verified live on `/activity-history` (button, Tab reaches, Enter →
> Detail with `date=2026-09-15`), `/activity-history/detail` (`img`, no pointer),
> `/activity-tracking/unified` (Enter → `?selected=Spotify`), SK label. 84 bars on a seven-day range
> stayed a readable snapshot. Tooltip and hit-testing untouched.

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
> ✅ **FIXED 2026-09-22, with `F29`.** The history string is *"Highlight {name} in the chart"* /
> *"Zvýrazniť {name} v grafe"* (key name kept); the card carries `:aria-pressed="selected"` and
> `@keydown.enter.space.prevent` to the same emit. `activityTracking.statColumn.viewDetails` and
> `ActivityDomainCard` untouched, as the eleventh pass decided. Verified live on
> `/activity-history/detail`: label, `aria-pressed` false → Enter → true → Enter → false, both locales.

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

## F49. Date-preset and source-filter chips are focusable `span`s with no role and no state — and every other chip-as-toggle in the app is the same class
> ✅ **FIXED 2026-09-22, with `F29`.** Attributes only, at the call sites, never in `componentDefaults`:
> `ActivityRangePicker` — `role="radiogroup"` + `activityTracking.range.presetsLabel` on the group,
> `role="radio"` + `:ariaChecked` per chip; `ActivitySourceFilter` — `role="button"` + `:ariaPressed`;
> `TodoListFilters` — `role="group"` labelled `toDoList.priority` + `checkbox`/`aria-checked`,
> `radiogroup` labelled the new `toDoList.dueFilterLabel` + `radio`/`aria-checked`, *Clear filters*
> `role="button"`; `RepeatingTaskDialog` — all three chip sets (`:112`, `:141`, `:200` are the same shape)
> `role="button"` + `:ariaPressed`, inline `cursor: pointer` dropped; `BasePlannerTaskDialog` — the wrapper
> is `role="radiogroup"` labelled the new `planner.dialog.durationPresetsLabel`, chips `role="radio"` +
> `:ariaChecked`. Second tier in the same commit: `role="button"` on the six action chips
> (`OverdueTasksBanner`, `SkipReasonForm`, `NowBar`, `ExperiencedCell`, `MemoryAnchorTable` ×2). Arrow-key
> movement inside the radiogroups is **not** wired — Tab reaches every chip and Enter/Space are Vuetify's;
> a partial radiogroup, by design, not a regression. Verified live: unified dashboard (*Today* radio checked,
> *Desktop* `aria-pressed` true → false → true), `/todo-list/13001` (checkbox *This week* + radio *Today*
> checked, URL `?priorities=6&due=today`), the repeating-task dialog (*Tue* pressed, day-type chips
> pressed false, cursor still `pointer`), the template task dialog (*1h* checked of nine).

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

## F78. Two more primary click targets built as bare `div`s
> ✅ **FIXED 2026-09-22, with `F29` — same convention.** `ProjectReadinessBoard`'s card:
> `role="button"` + `tabindex="0"` + `aria-label` `leisure.readinessBoard.editCard` (*"Edit {name}"*) +
> `@keydown.enter.space.self.prevent="onEdit(item)"` — `.self` is what keeps Enter on a nested status or
> *Delete* button from bubbling into a second dialog — plus a `:focus-visible` ring. `BackgroundTaskBlock`:
> `role="button"`, `tabindex="0"`, `aria-pressed`, the composed sentence moved from the sr-only span into
> `aria-label` (children are presentational under the role anyway), `aria-keyshortcuts`, and the foreground
> block's key map via `useTaskBlockKeyboard` (store injected through `PLANNER_STORE_KEY`), with the
> foreground block's focus ring and `selected` border. Verified live on a background task created through
> `POST /template-planner-task` and deleted after: Tab from the last foreground block lands on it, Enter
> → `aria-pressed="true"` + *1 selected*, Escape → cleared with focus kept, E → the edit dialog; mouse
> click on it then on a foreground task → 2 selected. On the board: Enter on the focused card opens the
> profile form; Enter on its nested *Delete* opens only the delete confirmation. Console clean.

- **Scope:** app-side `src/core/leisure/component/project/ProjectReadinessBoard.vue:64-71` (the card's
  `@click="onEdit(item)"`) and the `.background-task-block` in the template day-planner grid
  (`src/core/dayPlanner/`, rendered on `/day-planner/templates/:templateId` and both split panels)
- **Closes:** `leisure-projects/A4`, `planner-templates/A4`
- **Root cause:** one class, two components: an element whose *only* job is to be clicked is a `<div>`
  with a handler and `cursor: pointer`. `{"tag":"DIV","tabindex":null,"role":null}` on both. The
  template block is the worse of the two because the surrounding grid is done right — foreground tasks
  are real `<button>`s with composed `aria-label`s — so the gap is visible as an inconsistency: Tab from
  a foreground task jumps past the background block to the toolbar's *Delete*, contradicting the grid's
  own on-screen help text (*"Tab moves between tasks"*), and Escape cannot clear its selection because
  Escape's handler needs focus inside the grid, which an element with no `tabindex` can never hold. It
  already renders a visually-hidden *"Background activity: Feature Development, 19:30 to 20:30"* that
  names nothing, because the element it would name has no role.
- **Why one batch and not two:** the edit is identical (`role="button"` + `tabindex="0"` +
  Enter/Space keydown + a composed `aria-label`) and the two findings describe it in the same words. The
  value of batching is that the *pattern* gets decided once.
- **It must agree with `F29` and `FW6`, which are the same class in two other places.** `F29` is the
  stacked-bar columns (`activityTracking`), `FW6` is `CalendarGrid`'s day cells (framework). These stay
  separate batches — `FW6` by rule 1, `F29` because it also carries a pointer-cursor-that-does-nothing
  half that is unique to it — but whichever of the three ships first fixes the verb and the keydown
  shape, and the other two copy it rather than re-deciding. Four different answers to "what is a
  clickable div called" is the outcome to avoid.
- **Do not change:** the nested controls. The board card's status buttons and *Delete* are already real,
  named `<button>`s and already `@click.stop` — only the keyboard-activation path on the card itself is
  missing, and adding it must not make Enter on a nested button fire both.
- **Verification:** both findings' `Verify:` blocks. For the template block specifically, run all three
  of its consequences: Tab reaches it in grid order, Enter/Space selects it, and Escape clears the
  selection — the finding proved each one separately and each is a different mechanism.
- **Risk:** Low. Watch the multi-select interaction the finding documented as *working* (clicking a
  second task adds rather than replaces, "2 selected", and a multi-delete confirms "delete 2 selected
  tasks?") — that must survive.

## F4. The table's "Messy" column renders a bare icon with no text alternative

> ✅ **FIXED 2026-09-22, with `F56`, `F65` and `F71` — the naming convention for this class is settled
> here, in two halves.** **(a)** An *interactive* icon-only control gets a bound, localized
> `:aria-label`; an existing `:title` stays as the sighted user's tooltip, and a row-scoped control
> appends the row (`"Delete: Learn Bouldering"`), which is the shape `TodoListCard` and
> `TodoListCategoryPanel` already use. **(b)** A *non-interactive* glyph that carries meaning gets a
> `d-sr-only` sibling, **not** an `aria-label` — because Vuetify's `VIcon` renders `aria-hidden="true"`
> whenever it has no click handler (`VIcon.js:72-73`), so this batch as originally written would have
> produced markup no screen reader ever sees. That is the one correction to the plan below, and the
> comment recording it sits at `ProjectTable.vue`'s `#item.isMessy` template.
>
> The keys are `leisure.a11y.messy` / `notMessy` (*Špinavé* / *Nie je špinavé*), not `general.yes`/`no`:
> the column's own meaning reads better, and it sidesteps the eighth-pass note entirely. That note is
> also **stale** — `F35`'s deep-merge landed, so `general.yes`/`general.no` do resolve today; nothing
> needed adding to `src/locales/common.{sk,en}.ts`. The board card's `broom` icon
> (`ProjectReadinessBoard.vue`, listed under `F65`) got the same `d-sr-only` treatment for the same
> reason. Verified live on `/leisure/projects?view=table` and `?view=board`: the Messy cell and the card
> both read *"Messy"* in the accessibility snapshot.

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

## F56. Seven icon-only controls in `dayPlanner` have no accessible name — and the compare checkbox is under the card's icon

> ✅ **FIXED 2026-09-22, with `F4`.** All seven named from a new `planner.a11y.*` block, one string per
> concept rather than per screen: `pinTemplate`/`unpinTemplate` (branched on `isPinned`, both carrying
> the template name), `compareTemplate` (*Select {name} for comparison*), `openPanel`/`closePanel`
> (shared by `PlannerSidePanelShell`'s close X and `DayPlannerHeader`'s mobile `bars` toggle, which
> branches on `panelOpen`), `backToTemplates`, and `undo`/`undoCount`. Both headers compute an
> `undoLabel` that folds the count into the name (*Undo (2)*) so the badge stops being the name; the
> `VTooltip` stays untouched as the description.
>
> **Control #2's second half is fixed at the cause, not by spacing.** The template `VIcon` beside the
> checkbox is decorative, and it was overlapping the checkbox's ripple box and swallowing the click, so
> it now carries `style="pointer-events: none"` (with `flex-shrink-0 me-1` on the checkbox as well).
> Verified live: `getByRole('checkbox', { name: 'Select Home Office for comparison' }).click()` lands
> directly, the box reads `[checked]`, and the console is clean — `A2`'s pass condition. Pin/unpin,
> *Back to templates* (`/day-planner/templates/split`) and *Undo* all resolve by name, and the two
> `d-md-none` controls resolve at 390 px. **Not exercised:** the `undoCount` branch — it needs a planner
> mutation, and the seed was left unwritten.

- **Scope:** app-side `src/core/dayPlanner/` — five files
- **Closes:** `planner-templates/A1`, `A2`, `A3` (re-identified, §86), `U3` (settled from source);
  three unfiled twins found reading the same files
- **Root cause:** Confirmed per control, from source (the unit `eval`'d two of them, the rest are the
  same markup):

  | # | control | file | observed? |
  | --- | --- | --- | --- |
  | 1 | card pin — `VIconBtn icon="thumbtack"`, no label | `TemplateCard.vue:43-50` | yes (`A1`) |
  | 2 | compare checkbox — `VCheckbox`, no `label`/`aria-label`; **and** its hit-box sits under the template `VIcon` beside it | `TemplateCard.vue:10-23` | yes (`A2`, Playwright's intercept log) |
  | 3 | side panel close — `VIconBtn icon="xmark"`, `d-md-none` | `PlannerSidePanelShell.vue:16-23` | the unit's `nth(4)` is this or #5 — the "open toggle" it named does not exist (§86) |
  | 4 | split view back — `VBtn icon="arrow-left"`, no text | `TemplateSplitView.vue:5-11` | source only (`U3`) — a `VBtn` with only `icon` has no name; nothing to observe |
  | 5 | template planner undo — `VBtn` wrapping a `VIcon` + `VBadge :content="stackSize"` inside a `VTooltip` | `TemplatePlannerHeader.vue:35-60` | unfiled — the tooltip sets `aria-describedby`, not a name; with a non-empty stack the badge's number *is* the name |
  | 6 | day planner undo — identical markup | `DayPlannerHeader.vue:64-85` | unfiled, unit 7's screen |
  | 7 | day planner mobile panel toggle — `VIconBtn icon="bars"`, `d-md-none` | `DayPlannerHeader.vue:7-14` | unfiled — unit 7 never resized; `F51` adds its template-side twin |

  App-side throughout — none of these is a framework component's own markup, so this does not touch
  `FW2` (rule 1). The same class as `F4`, `F19`'s trash button and `F46`: this module's turn.
- **Files:** the seven rows above; `src/core/dayPlanner/_locales/dayPlanner.{sk,en}.ts` for the keys
- **What to change:** A bound, localized `aria-label` on each: pin → *Pin template* / *Unpin template*
  by `isPinned`; checkbox → *Select {name} for comparison* (`:label` would also fix #2's second half by
  giving the control a real box — or keep it label-less and give the `VCheckbox` `me-1` +
  `flex-shrink-0` so the icon stops overlapping its input; either way `A2`'s pass condition is a
  *direct* click landing); close → *Close panel*; back → *Back to templates*; undo → *Undo* with the
  count folded in (*Undo (2)*) so the badge stops being the name; `bars` → *Open panel* / *Close
  panel* by `panelOpen`. Share keys between #5/#6 and #3/#7/`F51`'s new toggle — one string each.
- **Do not change:** the `VTooltip` on the undo buttons (it stays as the description); `FW2`'s files.
- **Verification:** `A1`/`A2`/`A3`'s `Verify:` blocks — each control addressable by
  `getByRole('button', { name })` (checkbox: `getByRole('checkbox', { name })`), and `A2`'s direct
  click succeeds with no intercept in Playwright's log. #7 and #3 need 390 px; #6 needs
  `/day-planner/<today>`. Confirm the names change with the locale.
- **Risk:** None — attributes only. The draft spec's positional locators (`nth(3)`, `nth(4)`) will
  keep working and should be replaced by the names in the same commit.

## F65. Leisure's icon-only controls carry a localized `:title` and no `aria-label`

> ✅ **FIXED 2026-09-22, with `F4`.** `:aria-label` beside every `:title`, same key, `:title` kept.
> Two places carry more than the bare key, both for the same reason — a bare key would *remove*
> information the name already had: the year menu is *"Pick a year: 2026"* (its visible text is the
> year), and the source/experienced chips plus the two row-scoped delete buttons append the row
> (*"Open where this came from: Bucket List"*, *"Delete: Learn Bouldering"*), per `F4`'s convention (a).
> `ProjectReadinessBoard.vue:96`'s `broom` icon is the one entry here that is *not* a control: it took
> the `d-sr-only` treatment under convention (b), since an `aria-label` on a click-less `VIcon` is
> inert. Verified live on all three view-mode toggles, the timeline's three year controls, the anchors
> table's chips, the ladder's delete and the board's card.

- **Scope:** app-side `src/core/leisure/view/{BucketListView,MemoryAnchorsView,ProjectsView}.vue:14,20`
  (view-mode toggles), `component/memoryAnchor/MemoryAnchorTimeline.vue:32,42,67` (previous / choose /
  next year), `MemoryAnchorTable.vue:40,50` and `ExperiencedCell.vue:10` (source/anchor chips),
  `BucketListLadder.vue:128` and `ProjectReadinessBoard.vue:80,96` (delete, messy)
- **Closes:** `leisure-bucket-anchors/A1` (app half) — **re-graded `a11y` → `polish`** (§98): a
  `title` *is* an accessible name, just the weakest one, and the finding's expectation is this app's
  own convention rather than a failure. The `title="edit"` half of the same finding is `FW5`.
- **What to change:** `:aria-label` beside each `:title`, same key. Do not drop `:title` — it is the
  sighted user's tooltip.
- **Verification:** `A1`'s `Verify:` block on the toggles and the timeline buttons — `aria-label`
  non-null and localized.
- **Risk:** None.

## F71. The to-do item's done checkbox has no accessible name — nor do the step checkboxes under it

> ✅ **FIXED 2026-09-22, with `F4`.** `toDoList.markDone` / `markStepDone` minted in this module rather
> than imported from `home`, bound as `:aria-label` on both `VCheckboxBtn`s. Vuetify's
> `filterInputAttrs` routes the attribute to the `<input>`, so it is the control's own name and not the
> wrapper's. **One correction to the plan below:** the step field is `step.name`, not `step.text`.
> Verified live on `/todo-list/13001` — six item checkboxes and three step checkboxes resolve by
> `getByRole('checkbox', { name })`, including the `[checked]` one. `DraggedItemPreview.vue:15`'s
> decorative copy was left alone, as written.

- **Scope:** app-side `src/core/todoList/component/BaseTodoListItem.vue:19-28`,
  `src/core/todoList/component/BaseTodoListItemSteps.vue:39-47`, `src/core/todoList/_locales/toDoList.{sk,en}.ts`
- **Closes:** `todo-lists/A3` (+ the **unfiled** step checkboxes — same markup one level down, found
  reading the file; `DraggedItemPreview.vue:15`'s copy is `disabled` and decorative, leave it)
- **Root cause:** Confirmed. `VCheckboxBtn` at `:19` carries `v-model`, colours, `:disabled` and
  `@click.prevent.stop`, and no `label`, `aria-label` or `aria-labelledby`; the activity name beside it
  is a sibling `div`, not a label. Same for each step's `VCheckboxBtn` (`Steps.vue:39`). Every other
  per-item control in this component was named in rounds 2–5 (`A1`, `A2`, `B6`); this is the last one,
  and it is the one a keyboard user reaches first. `BaseTodoListItem` is the routine list's base too, so
  the fix lands on both views.
- **What to change:** `:aria-label="t('toDoList.markDone', { name: toDoListItem.activity.name })"` on
  the item checkbox and `t('toDoList.markStepDone', { name: step.text })` on each step's — new keys in
  `toDoList.{sk,en}.ts` (`home.markDone` exists with the same shape, `home.en.ts:15`, but it is another
  module's key; mint the pair here rather than import across the boundary). `aria-checked` is
  Vuetify's; nothing else.
- **Do not change:** the `@click.prevent.stop` handlers (`B3`'s fix); `DayPlannerWidget`'s checkbox
  (`F59`'s, already labelled).
- **Verification:** `A3`'s `Verify:` block — `getByRole('checkbox', { name: /Bug Fixing/ })` resolves on
  `/todo-list/13001`; then expand an item with steps and `getByRole('checkbox', { name: /<step text>/ })`;
  then `/routine-todo-list` once. Both locales.
- **Risk:** None — attributes only.

## FW2. Six framework icon-only controls have no accessible name

> ✅ **FIXED 2026-09-23**, in one `vue_framework` commit with `FW5`/`FW6`/`FW7`/`FW15` (`5397675`, bump
> `a7dbfda0`). As written: `AppTopBar.vue`'s sidebar toggle, `FilterPanel.vue`'s close button, and both
> chevrons on `MonthYearPicker.vue` and `MyDateInput.vue` each gain a `title`/`aria-label` bound to a new
> localized key — `general.toggleNavigation`, `general.close` (already existed), `dateTime.previousMonth`
> / `dateTime.nextMonth`, `dateTime.previousDay` / `dateTime.nextDay`. All four new keys added to both
> `src/_common/_locales/common.{sk,en}.ts`; `src/_common/docs/components.md` updated for `MyDateInput`
> and `MonthYearPicker`. `MyDateInput`'s binding-order fix (`FW15`) shipped in the same file, same commit.
> `planner-day.draft.spec.ts`'s three `getByRole('button').nth(5)` positional fallbacks were replaced
> with `getByRole('button', { name: 'Next month' })`. **Verified:** `vue-tsc --build --force` 0 errors,
> `npm run lint` 0 errors, `npx vite build` succeeds, `e2e` `npm run typecheck` 0 errors. **Not verified
> live in a browser** — no playwright-cli session was driven this pass; the harness's own checks (type,
> lint, build) are what stand behind this note.

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

## FW5. `DataTable`'s default row actions render the internal slug as their `title`, not the localized label

> ✅ **FIXED 2026-09-23**, same commit as `FW2`/`FW6`/`FW7`/`FW15` (`5397675`, bump `a7dbfda0`). As
> written: `DataTable.vue`'s default action `VIconBtn` now binds `:title="action.text"` and adds
> `:aria-label="action.text"` — the widening this entry already flagged as worth doing, taken. `docs/components.md`
> notes the bound field. **Verified** by typecheck/lint/build only; not re-driven live.

- **Scope:** **[framework]** `src/_common/component/dataTable/DataTable.vue:83` — submodule commit, then
  pointer bump
- **Closes:** `activity-settings/B4`, **`leisure-bucket-anchors/A1`** (framework half — the unit's
  `eval` read `title="edit"` / `title="delete"`, `aria-label: null` on both leisure tables' row actions;
  that is this slug, seen from two more tables. The "add `aria-label`" widening this batch already
  mentions below is now worth doing in the same line — three units have asked for it.)
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
  (`RoutineSettingsView.vue`, a `BasicTable` with default actions and `@onDelete`) or `/leisure/bucket-list`
  / `/leisure/memory-anchors` (both on default actions, per `A1`'s evidence). Both locales, per step 3 of
  the block. `A1`'s pass condition adds a non-null `aria-label` — only if the widening is taken.
- **Risk:** None. One field name, and the correct value is already what the sibling renders.

## FW6. `CalendarGrid`'s day cells are click-only `div`s — no accessible name, role, `tabindex` or key handler

> ✅ **FIXED 2026-09-23**, same commit as `FW2`/`FW5`/`FW7`/`FW15` (`5397675`, bump `a7dbfda0`). As
> written: non-empty `.day-cell`s gain `role="button"`, `tabindex="0"`, an `@keydown.enter.space.prevent`
> handler calling the same `handleDayClick`, and an `aria-label` from a new `dayCellLabel(dayData)`
> helper — `t('calendar.dayCellLabel', { weekday, date })` where `weekday` comes from `allDays` and
> `date` is formatted via `Intl.DateTimeFormat(locale.value, …)`, not `formatToDateWithDay`. Padding
> cells get none of the above and their `@click` is now conditional on `dayData`. A `:focus-visible`
> outline was added, distinct from `.selected`'s. New `calendar.dayCellLabel` key (`{weekday}, {date}`)
> added to `src/_common/_locales/common.{sk,en}.ts`. **App-side mirror:** `SK.ts`/`EN.ts` already
> deep-merge `calendar` per-key (`{ ...common.calendar, ...appCommon.calendar }`, added 2026-09-21 for
> `holidays`), so the framework's new key passes through automatically; `src/locales/common.en.ts`'s
> `calendar` block still fully duplicates the framework's day-name keys for wording reasons, so the new
> key was mirrored there too for consistency, but `src/locales/common.sk.ts`'s `calendar` (holidays
> only) needed no change — the shallow-spread warning this entry raises no longer applies to `calendar`,
> only to `general`/`dateTime`, which are unaffected by this batch. `docs/components.md` updated.
> **Verified** by typecheck/lint/build only; not re-driven live in a browser.

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

> ✅ **FIXED 2026-09-23**, same commit as `FW2`/`FW5`/`FW6`/`FW15` (`5397675`, bump `a7dbfda0`). As
> written: `MyPasswordInput.vue` drops `appendInnerIcon`/`@click:appendInner` for a `#append-inner`
> `VIconBtn` (`variant="plain"`, `size="small"`, `density="compact"`) with `title`/`aria-label` bound to
> `user.showPassword` / `user.hidePassword`. `MyVerifyPasswordInput.vue` and `MyNewPasswordInput.vue`
> both wrap `MyPasswordInput` and needed no direct change. `user.passwordsDontMatch` (the adjacent,
> source-certain finding) added to both `user.{sk,en}.ts`, alongside the two new toggle keys. The
> `user.password`/`user.confirmPassword` dead-key drift the finding also noted was left alone — it is
> genuinely unreachable (both consumers pass `isNew`) and touching it was out of scope for this pass.
> `docs/modules/user.md` gained a short section on the toggle so `appendInnerIcon` is not reintroduced.
> **Not verified live** — the harness's classifier blocks `fill` on password fields, and the draft-spec
> `fixme`s the finding named (`A1`, `U4`, plus the two signed-out cases on `/login`/`/registration`) were
> not promoted this pass; `vue-tsc --build --force`, `npm run lint` and `npx vite build` are what stand
> behind this note. The field-height check across both densities was also not done in a browser.

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

## FW15. `MyDateInput` binds `$attrs` first, so every caller's `label` (and `hideDetails`) is discarded

> ✅ **FIXED 2026-09-23**, same commit as `FW2`/`FW5`/`FW6`/`FW7` (`5397675`, bump `a7dbfda0`). As
> written: `v-bind="$attrs"` moved to be the last binding on `MyDateInput`'s `VDateInput`, after
> `:label`, `hideDetails` and `style`, so a caller's values now win. `e2e/tests/history-review.draft.spec.ts:28`
> updated from `getByRole('textbox', { name: 'Date' })` to `{ name: 'From' }` in the pointer-bump commit,
> as required. **Not verified live** — no playwright-cli session was driven to confirm *Copy Day*'s field
> now reads "Source date" or that the History summary's custom-range pair reads "From"/"To"; `vue-tsc
> --build --force`, `npm run lint`, `npx vite build` and `e2e`'s `npm run typecheck` all pass.

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

## FW4. `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so

> ✅ **FIXED 2026-09-23** (`vue_framework` `b4eb068` with `FW17`/`FW22`, bump `3067d954`). Docs only, as
> the body requires: `components.md` → *Data tables* gains a *Layout* subsection. It covers the
> fill-parent contract (`height="0"` + `flex-fill`), the symptom (rows in the a11y tree but not on
> screen), the shape to copy (`class="flex-1-1" style="min-height: 0"`, from `ActivityTable.vue`), and
> the warning not to "fix" it by removing `height="0"`. Default unchanged; the optional dev-mode warn
> was not filed. The same commit drops the section's stale note that `TableCellEditor` uses
> `type="number"`: it has rendered a `VNumberInput` for a while.
> **Verified:** read-through only, which is all the body asks for.

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

## FW17. `ActionBar` is centred on the viewport, not the content box — *Delete* is un-clickable under the nav drawer

> ✅ **FIXED 2026-09-23** (`vue_framework` `b4eb068` with `FW4`/`FW22`, bump `3067d954`). Implemented as
> the body specifies: `left: calc(50% + (var(--v-layout-left, 0px) - var(--v-layout-right, 0px)) / 2)`.
> `translateX(-50%)`, both transition rules, `z-index` and the mobile block are unchanged, and a comment in
> the CSS says why. `components.md`'s `ActionBar` entry documents the content-box centring, the
> right-drawer direction and the `0px` fallback. The commit message says the same.
> **Verified:** the two `test.fixme('…', async () => {})` stubs in `e2e/tests/dayPlanner.spec.ts` had
> **empty bodies**, so un-`fixme`ing meant writing them. *"delete action shows a confirmation dialog"*
> clicks Delete in the bar and expects the dialog. *"cancelling the delete dialog keeps the task"* cancels
> inside the dialog and asserts both base-day task blocks remain. Neither confirms: the seed account's
> `askBeforeDelete` is `true` by the API's default (`BaseUser.cs:18`), so no fixture row is touched. The
> 22-line defect comment above the describe is replaced by a short history plus the "visibility is not
> occlusion" caveat, which is worth keeping. At the suite's 1280×720 with the drawer expanded: 19 passed,
> 3 skipped (the unrelated day-details `fixme`s), both new specs green. The Playwright click is itself
> the occlusion check: it fails on an intercepting element, which is how the defect was first caught.
> **Not verified:** the rail-collapsed state by eye, and the `elementFromPoint` probe the body suggests.
> `vue-tsc --build --force` exit 0, `npm run lint` clean, e2e `tsc` clean.

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

## FW22. `TableCellEditor`'s `DECIMAL` cell rounds to whole numbers

> ✅ **FIXED 2026-09-23** (`vue_framework` `b4eb068` with `FW4`/`FW17`, bump `3067d954`). Exactly the
> body's change: `:precision="cellType === TableCellType.DECIMAL ? null : 0"` beside the `step`
> expression. `components.md`'s `TableCellEditor` entry says what each type does. The commit message
> flags the one real risk: an app already using `DECIMAL` was getting integers until now.
> **Verified:** source and typecheck only. As the body says, `TableCellType.DECIMAL` has no consumer
> in this app, and the framework has no fixture harness to host a throwaway decimal column. It rests on
> `F76`, where the identical `:precision="null"` on a `VNumberInput` was verified live (8.5 and 8.25
> round-trip).

- **Scope:** **framework** `src/_common/component/dataTable/inlineEditTable/TableCellEditor.vue:19`
  (submodule commit + pointer bump)
- **Closes:** *(unfiled)* — found this pass while sizing `F76`. The framework twin of
  `leisure-projects/B4`, split by rule 1.
- **Root cause:** the numeric branch is `:step="cellType === TableCellType.DECIMAL ? 0.1 : 1"` with no
  `:precision`, so Vuetify's default `precision: 0` coerces every value to an integer. A cell declared
  `TableCellType.DECIMAL` therefore cannot hold a decimal — the type is decorative.
- **What to change:** `:precision="cellType === TableCellType.DECIMAL ? null : 0"`, matching the shape
  of the `step` expression beside it. Update `src/_common/docs/components.md` in the same commit (rule 3
  of the submodule contract).
- **Honest scope:** `TableCellType.DECIMAL` has **no consumer in this app** — the only two matches for it
  in `src/` are the enum declaration and this line. So this is source-certain and unobserved, it fixes
  nothing visible here, and its verification has to be a throwaway decimal column in the framework's own
  fixtures rather than a screen in this app. It ships because another app on the framework may already
  be using it, and because the `F76` fix would otherwise be app-side folklore.
- **Risk:** Low, and it is the reason to ship it deliberately rather than folding it into `F76`: any app
  currently using `DECIMAL` is getting integers today and may be relying on that rounding.

## F69. Deleting a to-do item never confirms, whatever `askBeforeDelete` says — the item delete was never one of P3's five sites

> ✅ **FIXED AND VERIFIED 2026-09-23** (`723c48ec`). The fix sits in the composable, as the body allows, since
> `useUndoableListCrud` is `todoList`'s own and the `core/user` import is the sanctioned exception.
> `deleteItem()` asks `shouldConfirm({ cascades: false, undoable: true })` and confirms through
> `useDialog().confirm()` in `TodoListsView`'s shape: title `toDoList.deleteItemConfirm` (*"Delete item?"* /
> *"Vymazať položku?"*), the item's label as text, and a red *Delete*. The undo entry is kept either way.
> `cascades: false` is confirmed against the API: steps are `OwnsMany(…).ToJson()`
> (`TodoListEntityConfigurationExtensions.cs`), and the planner-task and history FKs are `SET NULL`
> (`PlannerTaskConfiguration.cs`, `ActivityHistoryConfiguration.cs`). A code comment says so.
> **One thing the body did not say:** the item is re-located *after* the dialog, because the list can
> resync or reorder while the dialog is open, and the neighbours captured for the undo must be the
> current ones. CLAUDE.md's `useDeleteConfirmation` row now counts **seven** sites and names this one.
> The "all five sites" wording in the same cell is now "every site".
> **Verified live** (`playwright-cli`, form sign-in, throwaway items created through the API and deleted
> by the checks themselves, so the fixture is unchanged). `/todo-list/13003`, preference **on**: dialog;
> Cancel → no `DELETE`, item stays; Delete → `DELETE /todo-list-item/14103` 204 + *Undo* button.
> Preference **off**: no dialog, `…/14104` 204, *Undo*. `/routine-todo-list`, off: no dialog,
> `DELETE /routine-todo-list/19008` 204, *Undo*. On: dialog; Cancel → no `DELETE`; Delete → `…/19009`
> 204, *Undo*. The preference was toggled through `/user/settings` and left **on**, the seed default.
> No console errors. `vue-tsc --build --force` exit 0; eslint clean on the changed files.
> **Not verified:** the SK dialog by eye (the key exists in both locales). **Not touched:**
> `TimerPresetDialog.vue:129`, the same class of bug the other way round (it confirms unconditionally),
> named in `F37`'s *Do not change* note and still unfiled. `todo-lists/B7` closed, with its routine twin.

- **Scope:** app-side `src/core/todoList/composable/useUndoableListCrud.ts:110-125`, its two consumers
  (`TodoListView.vue`, `RoutineToDoListView.vue`), and one row in CLAUDE.md's *sanctioned cross-module
  imports* table
- **Closes:** `todo-lists/B7` (+ the **unfiled routine twin** — `RoutineToDoListView` drives the same
  composable, so its item delete has the same gap; unit 10 ran seven rounds and never filed it because
  its deletes were of periods, not items)
- **Root cause:** Confirmed. `deleteItem()` is `await api.deleteEntity(id)` then `pushDeleteUndo(…)`,
  with no `shouldConfirm` anywhere in the file (grep: `useDeleteConfirmation` has six importers in
  `src/core`, none in `todoList/composable/useUndoableListCrud.ts`). `prompts/_done/user/P3-delete-confirmation-granularity.md`
  listed **five** delete sites, and the item delete was not among them — it was already an undo-only path
  through `useTodoListUndo` before P3 ran, so P3 never touched it. But P3's own rule covers it exactly:
  *"a delete that is a LEAF and is UNDOABLE honors the preference, and when the preference says 'don't
  ask', shows an undo affordance instead of a dialog"* — and `useDeleteConfirmation.resolveDelete()`
  encodes that (`askBeforeDelete` → `'confirm'` before it ever looks at `undoable`). With the preference
  **on** (the seed's default, the unit's screenshot), the item delete is the one site in the app that
  ignores it; with it off, the undo it already shows is the correct answer. So this is not "add a dialog"
  — it is "route the sixth site through the composable that already decides".
- **Files:** `useUndoableListCrud.ts:110` (or the two call sites, if the composable is to stay
  preference-free — it is `todoList`'s own, so importing `core/user`'s composable there is the sanctioned
  exception, same as `TodoListsView.vue:186`); `CLAUDE.md` — the `useDeleteConfirmation` row says "the
  five delete sites in `todoList`, `dayPlanner`, `historyDashboard`"; `F19` adds `activity`, this adds a
  sixth `todoList` site; rewrite the count once, not twice.
- **What to change:** Before `api.deleteEntity(id)`: `if (shouldConfirm({ cascades: false, undoable:
  true })) { const ok = await confirm({ title: …, text: t('toDoList.deleteItemConfirm', { name }) }); if
  (!ok) return }` — `useDialog().confirm()`, the shape `TodoListsView.vue:186-190` already uses for the
  list delete. `cascades: false` is right (items have no children; steps are a JSON column, not rows —
  confirm against `TodoListItemConfiguration.cs` before asserting it in a comment). Keep the undo entry
  either way — P3's *undoable* branch is what makes the "don't ask" case safe.
- **Do not change:** `useDeleteConfirmation` itself; the list and category sites (correct); the undo stack.
  Do not read `askBeforeDelete` directly — CLAUDE.md names that as the bug.
- **Verification:** `B7`'s `Verify:` block with the preference **on**: ⋮ → *Delete* → a dialog; Cancel →
  no `DELETE`, item still there; Confirm → `DELETE …/todo-list-item/{id}` 204 and the undo button. Then
  the preference **off**: no dialog, immediate delete, undo button — unchanged from today. Then
  `/routine-todo-list`, same two checks (create a throwaway routine item through the API first). Both
  locales for the new key.
- **Risk:** Low. One branch in a composable two views share — that is the point, and the risk: test both.

<!-- F66, F68, F75, F84 — one session, one commit (`d08a6e90`), 2026-09-23. Browser-verified in a dedicated
     `playwright-cli` session (`-s=f4`, form sign-in — other sessions were live). Mid-pass, another session
     reseeded the fixture and restarted the API. That caused one 404 (`Activity not found`, F68's first
     attempt) and a burst of `ERR_CONNECTION_REFUSED` (F75's first read); both checks were re-run once the
     API was back, and neither was a finding. `npm run type-check` exit 0, `npm run lint` exit 0. -->

## F66. `boolChip` reuses the true icon for the false state on four of five chips

> ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90`). The body's "fix", not its "patch": `boolChip`'s
> `falseIcon` is now **required**, with a comment naming this batch. The four sites that used the default
> now pass `circle-xmark` (*experienced*, bucket list and backlog), `plane-slash` (*travel*) and `soap`
> (*messy*). FontAwesome has no slashed broom, so *messy*'s opposite is a clean one rather than a
> struck-through one. All three icons were resolved against `free-solid` before use (the `F81` trap).
> **Verified live** by reading each chip's leading `<svg>` class, with the filter set through the URL:
> `/leisure/bucket-list` ✗ → `fa-plane-slash` / `fa-circle-xmark`, ✓ → `fa-plane` / `fa-circle-check`;
> `/leisure/backlog` ✗ → `fa-star` (unchanged, `isRepeatable`) / `fa-circle-xmark`; `/leisure/projects`
> ✗ → `fa-soap`. No console errors (no `Could not find one or more icon(s)`).

- **Scope:** app-side `src/core/leisure/composable/useLeisureFilterChips.ts:19`;
  `BacklogView.vue:192`, `BucketListView.vue:218-219`, `ProjectsView.vue:163`
- **Closes:** `leisure-bucket-anchors/P1`
- **Root cause:** `boolChip(labelKey, trueIcon, falseIcon = trueIcon)` — the default was presumably a
  convenience, and every call site but `isRepeatable` (`rotate`/`star`) took it. The label already
  flips `✓`/`✗`; the icon does not.
- **What to change:** Either pass a false icon at the four sites (`circle-xmark` for *experienced*,
  a slashed variant for *travel*/*messy*), or drop the default and make the parameter required so the
  next chip cannot forget. The second is the fix; the first is the patch.
- **Verification:** `P1`'s `Verify:` block on `/leisure/bucket-list`, then the same chip on
  `/leisure/backlog` and `/leisure/projects`.
- **Risk:** None.

## F68. The manual-entry form fires one `POST` per click and never resets — the second click, and every re-submit after a success, is a `409`

> ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90`). `AddActivityManuallyView` gates `handleSave` on a
> `saving` ref (early return, `try/finally`) and binds it to the button's `:loading`. The reset lives
> inside `saveActivity()` (`resetAfterSave()`), so the view needs no `@saved` binding. **Chosen:**
> `dateTime + timeLength`, not `new Date()`, for back-to-back logging, and the code comment says why.
> The length is cleared and the activity kept, as the body asks.
> **One thing the body did not say:** `saveActivity()` emitted `saved` and returned `true` even when
> `saveActivityToHistory` returned `null` (a failed save). It now returns `false` without resetting or
> emitting, so a failed save keeps the form as the user left it. Observed incidentally: the reseed 404
> above left the form untouched.
> **Verified live** on `/activity-history/manual` (Grocery Shopping, 30 min): `dblclick` on *Record
> activity to history* → **one** `POST /api/activity-history` 201; the form then read "when" 21:30,
> length 00:00, activity kept. A second *Record* at 15 min → a second 201, `startTimestamp` 19:30:00Z
> against the first's 18:59:54Z, not a 409. No console errors.
> **Side effect, not a defect:** `DateTimePicker` re-emits at whole-minute precision, so the advanced
> start is rounded (18:59:54.770 + 30 min went out as 19:30:00.000). The next span can therefore overlap
> the previous one by under a minute. That is harmless to the unique index, which keys on the start.
> **Not done:** the body's "Reseed after", because other sessions were running specs against the
> fixture. The two *Grocery Shopping* records written by the check were gone by the time cleanup was
> tried later that day: another session's reseed had removed them. `/activity-history/filter` for
> 2026-09-23 returned only the seed's *Desk Research* row.

- **Scope:** app-side `src/core/activityHistory/view/AddActivityManuallyView.vue:17-23,36-38`,
  `src/core/activityHistory/component/AddActivityManuallyForm.vue:53-82`
- **Closes:** `history-capture/B6` (round 1's `U1`, now observed — and the queue's §53 split of it, both
  halves, is settled below)
- **Root cause — confirmed, and the reset half is no longer taste.** `handleSave()` is
  `await formRef.value?.saveActivity()` with no re-entry flag; `saveActivity()` sets nothing while
  `await saveActivityToHistory(…)` is pending; the button has no `:loading`/`:disabled`. Two clicks inside
  the round trip are two `create` calls with the **same** `activityId` and `startTimestamp`, and the
  server's unique index `(UserId, ActivityId, StartTimestamp)` (`ActivityHistoryConfiguration.cs`) turns
  the second into a **409** — the mechanism the unit guessed and could not verify; confirmed at the
  source. What the finding did not draw out: `dateTime` is set once at mount (`Form.vue:53`, `new Date()`)
  and nothing resets it after a success, so a user who records a span and clicks *Record* again —
  the same activity, the same "when" — gets the same 409, surfaced as `history.errorSavingToHistory`
  (*"error saving"*) for a save that is not an error but a duplicate. That is why the reset half moves
  from "unsourced" (§53) to required: without it the form's second use is always a failure. Which fields
  reset is still the judgement §53 named — a user logging several spans of one activity plausibly wants
  the activity kept — but *"when"* must advance (to now, or to the end of the span just saved), or the
  index refuses.
- **Files:** `AddActivityManuallyView.vue` (a `saving` ref, `:loading="saving"` on the button, `@saved`
  bound); `AddActivityManuallyForm.vue` (a `reset()` in `defineExpose`, or reset inside `saveActivity()`
  after `emit('saved')`)
- **What to change:** Gate `handleSave` on a `saving` ref set around the `await` (the
  `TimerPresetDialog` confirm shape), bind it to the button's `loading`. Then the reset: on `saved`, set
  `dateTime` to `new Date()` (or to `dateTime + timeLength`, which is the more useful default for
  back-to-back logging — pick one and say why in the code) and clear `timeLength`; keep the activity
  selection. The success snackbar (`history.addedToHistory`) already fires; nothing else is needed to
  "make it obvious the save happened".
- **Do not change:** the server's index — a duplicate `(activity, start)` *is* a duplicate; the 409 is
  right. Not `useSaveActivityToHistory` — its snackbar pair is shared with the three timer views.
- **Verification:** `B6`'s `Verify:` block — `dblclick` on *Record activity to history* produces **one**
  `POST /api/activity-history` (`playwright-cli requests`), no 409, no console `AxiosError`; then a
  single save followed by a second *Record* → a second 201 with a different `startTimestamp`, not a 409.
  Reseed after.
- **Risk:** None.

## F75. `viewEndDate` never rolls an overnight view onto the next day, so plan-vs-actual reports a verdict all day

> ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90`; the second half of the verification was finished the same
> day, see *Completed* below). Exactly
> the body's change: a branch between the `>= 24` case and the `else` that reuses `core.isOverMidnight`,
> adds one day and sets the raw hours. The code comment names the two dialects. `dateTimeFromSlotIndex`
> is untouched, as the body warns. The *Risk* grep: `viewEndDate`'s **only** consumer is
> `usePlanVsActual.ts:37` (plus its interface declaration), so nothing else changed meaning.
> **Verified live** by reading the Pinia store (`$pinia._s.get('dayPlanner')`) at 21:01 local on
> `/day-planner/23-09-2026`: `viewStartDate` Wed 23 08:00, `viewEndDate` **Thu 24 00:00**,
> `isOverMidnight` true, and no plan-vs-actual line on screen. `22-09-2026` and `21-09-2026` resolve to
> Wed 23 00:00 and Tue 22 00:00, each the following midnight.
> **Completed:** the first pass could not see the line *appear*, because the seed has no tasks on past
> days, and it never exercised an 08:00–23:00 day. Both were done in a second `playwright-cli` session
> (`-s=f75`), with the clock driven by Playwright's `page.clock` through `run-code` and nothing written
> to the fixture. On `/day-planner/23-09-2026` (the seed's 08:00 → 00:00 day: one in-progress and one
> not-started task):
> - **23:55:** `viewEndDate` Thu 24 00:00, no line. The pre-fix code would have shown it here.
> - **00:05** (`clock.fastForward`, no reload, so the app's own 60 s tick picked it up): *"Planned 2h ·
>   logged 0m"* and *"2 tasks never happened"*. The counts match the day.
> - **08:00–23:00:** the store's `viewEndTime` was set to 23:00 in-page (not persisted). `isOverMidnight`
>   was false and `viewEndDate` Wed 23 23:00. At **22:31** there was no line; at **23:11** the same two
>   lines appeared. The branch that already worked is unchanged.
>
> The three console errors in that session were SignalR *"Server timeout elapsed"* disconnects, one per
> clock jump. That is the fake clock tripping the hub's keep-alive, not the app.
> A trap for the next verifier: `/day-planner/:date` takes `DD-MM-YYYY`. An ISO date silently
> redirects to today, which reads as "the fix did not change past days".

- **Scope:** app-side `src/core/dayPlanner/store/dayPlannerStore.ts:157-170` (`viewEndDate`)
- **Closes:** `planner-day/B7`
- **Root cause:** `viewEndDate`'s only next-day branch is `endHour >= 24`; the `else` sets
  `date.setHours(endHour, …)` on **today**. The seed's `bedTime` is `{hours: 0, minutes: 0}` — an 08:00
  → 00:00 day, i.e. midnight *at the end* — so `viewEndDate` resolves to today at 00:00:00, an instant
  that is in the past from 00:00:01 onward. `usePlanVsActual.ts:36`'s
  `isDayMateriallyDone = currentTime >= store.viewEndDate` is therefore true all day, and
  `prompts/_done/day-planner/F2-plan-vs-actual.md`'s own rule — *"Do not compute a drift verdict at
  10:00 for a day that ends at 23:00"* — never holds. Observed at 19:54 on a day with a task two minutes
  from starting: *"Planned 3h · logged 0m · 3 tasks never happened"*.
- **The module already knows the answer, one file over.** `usePlannerStoreCore.ts:99` is
  `isOverMidnight = viewStartTime.hours > viewEndTime.hours` — which is exactly true for 08:00/00:00.
  `viewEndDate` is the one place that asks a different question.
- **What to change:** in `viewEndDate`, treat `endHour < viewStartTime.hours` the same as `endHour >= 24`
  — roll the date forward one day, then set the hours. Reuse `core.isOverMidnight` rather than
  re-deriving the comparison.
- **Check the sibling while there:** `dateTimeFromSlotIndex` (same file, immediately below) uses the same
  `hours >= 24` convention, and it is *correct* there — `slotIndexToTime` emits hours past 24 for an
  overnight grid. The asymmetry is the trap: the grid's own math speaks the ≥24 dialect while
  `viewEndTime.hours` comes from `bedTime` raw. Do not "fix" the slot version to match.
- **Do not change:** `neverHappenedCount`'s `status !== Completed` test. It is a safe simplification
  *once* the gate is honest, which is the finding's own reading.
- **Verification:** `B7`'s `Verify:` block — load today's plan mid-afternoon on an 08:00–00:00 day and
  confirm the plan-vs-actual line is **absent**; then confirm it appears with correct counts once past
  the end time. A day configured with an end hour later than its start (e.g. 08:00–23:00) must be
  unaffected — that is the regression to watch, since it is the branch that works today.
- **Risk:** Low, but it changes what a *correct* day does too: anything else reading `viewEndDate` (the
  grid's own extent, `slotIndexToTime` consumers) now gets tomorrow's midnight for an overnight view.
  That is the intended meaning; grep the store's consumers before assuming nothing else depended on the
  bug.

## F84. The history dashboard's pie renders the folded-tail sentinel raw — `_other` in the legend, and the slice selects

> ✅ **FIXED AND VERIFIED 2026-09-23** (`d08a6e90`). The body's two decisions went as follows.
> **Constant:** neither option as written. `HistoryGroupKey.ts`, the DTO file that already documents the
> roll-up, now exports `HISTORY_OTHER_GROUP_NAME` and a predicate `isHistoryOtherRollup(item)`
> (`groupId === null && name === '_other'`). `useHistoryInsights.ts` drops its private
> `OTHER_GROUP_NAME` and calls the predicate. Its suppression logic is unchanged; the explanatory comment
> moved to the call site. There is one copy of the literal in the module now, not a fourth.
> **Locale key:** `history.summary.otherGroup` (*Ostatné* / *Other*), in `activityHistory`'s locale
> files, which own the `history` namespace (`historyDashboard` has none).
> **Deviation from "used at `:41`":** the echarts datum keeps the **raw** name. The legend is keyed by
> it, and translating it there would merge the roll-up with a real activity named *Other*/*Ostatné*.
> Only what the user reads is translated: the legend `formatter` and the tooltip, which now resolves
> through `dataIndex`. `handleChartClick` returns early on the predicate.
> **`HistorySummaryCard.vue` untouched, checked as the body asked.** `HistorySummaryCardsBuilder.cs` is
> top-N with no roll-up; `OtherName` appears only in `HistoryPieChartBuilder.cs`.
> **Verified live** on `/activity-history` with a `route`-fulfilled body carrying an `_other` row **and**
> an id-less `Uncategorized` row. The legend reads *Other (19.3%)* and the tooltip *Other*, and the
> slice is grey (`hsl(0, 0%, 62%)`). Clicking `_other` with nothing selected selected nothing; clicking
> it with *Feature Development* selected left that selection in place. `Uncategorized` and a real
> activity both still select. No console errors.
> **Not verified:** the SK wording by eye (the key exists in both locales); the summary-card highlight
> directly (it follows the same `selectedGroup` that did not change). The body's verification route,
> `/activity-history/dashboard`, does not exist. The dashboard is `/activity-history`.

- **Scope:** app-side `src/core/historyDashboard/component/pieChart/HistoryPieChart.vue` (+ one locale key
  if `activityTracking.common.other` is not reused — decide which, see below)
- **Closes:** *(unfiled)*. Fell out of §10's closure, from the opposite side: the backend's `B16` answer
  flagged `AdhdTimeOrganizer.History/application/dashboard/HistoryPieChartBuilder.cs` as out of scope and
  "probably the identical bug". **It is not — that flag is stale.** `HistoryPieChartBuilder.cs:20` is
  already `public const string OtherName = "_other"`, and has been; the History slice never had the
  literal `"Other"` the Tracking pies did. The server side needs nothing. **Re-read in the API repo on
  2026-09-21 and unchanged**, so the backend's *"say so and I'll do the History side as a follow-up"*
  can be answered with "nothing to do" — this batch is the whole fix. What is wrong is the *client*:
  the two modules' pies were written independently and only `activityTracking`'s learned the sentinel.
- **Root cause — a branch that exists in one pie and not the other.** `ActivityPieChart.vue` translates
  `OTHER_DOMAIN` on the way into the chart (`:62`), maps it back for the tooltip and the legend formatter
  (`:96`, `:144`) and returns early rather than emitting a selection (`:150`). `HistoryPieChart.vue` has
  none of the four: `:41` sets `name: item.name` verbatim, the legend `formatter` (`:75-81`) truncates and
  percent-suffixes that same raw string, and `handleChartClick` (`:113-121`) resolves the datum by index
  and emits `historyGroupKey(item)` for *any* slice. So the folded row shows as a literal `_other` in
  **both** locales and is a selectable group — it cross-highlights the summary cards and the stacked bars
  through `isSameHistoryGroup`, which matches it by name because its `groupId` is null.
  `HistoryGroupKey.ts:7-8` already names this row ("the pie chart's `_other` roll-up") as one of the two
  synthetic, id-less rows, so the DTO layer knew about it and the render layer did not.
- **Adjacent, already handled — do not "fix" it twice.** The **colour** is fine:
  `historyGroupColor.ts:47` routes a `groupId === null` row through `getDomainColor(name)`, which
  special-cases `_other` to grey, so the slice already paints neutrally (this is the same conclusion §11's
  body reached from the colour side). And `useHistoryInsights.ts:80` already has its own `OTHER_GROUP_NAME
  = '_other'` constant and suppresses insights derived from the roll-up — a third copy of the literal,
  which is the argument for a shared constant rather than a fourth.
- **What to change:** give `HistoryPieChart` the same three touch points `ActivityPieChart` has — a
  display-name helper used at `:41` and inside the legend `formatter`, and an early return in
  `handleChartClick` when the resolved item is the roll-up. Branch on `item.groupId === null &&
  item.name === <sentinel>`, **not on the name alone** — `HistoryGroupKey.ts:10-11` is explicit that a
  user may name a real activity `_other` and that row carries an id. Two things to decide, both small:
  (1) **which constant** — `historyDashboard` should not import `activityTracking`'s `OTHER_DOMAIN`
  (cross-module, and neither is an `api/`/`dto/` export), so either lift one shared constant somewhere
  both may import or reuse `useHistoryInsights.ts`'s `OTHER_GROUP_NAME` by exporting it; the latter is one
  line and keeps the module self-contained. (2) **which locale key** — `activityTracking.common.other` is
  the existing wording (*Ostatné*) but lives in another module's namespace; a `history.*` key with the
  same two words is the boundary-respecting answer and costs two lines in `sk`/`en`.
- **Do not change:** `HistoryPieChartBuilder.cs` or anything else server-side — the wire value is already
  correct. Not `historyGroupColor.ts` (the grey works). Not `useHistoryInsights.ts`'s suppression logic.
  Not `HistorySummaryCard.vue:21` unless the roll-up actually appears there — the summary-card endpoint is
  a different builder and this pass did not check whether it folds at all; look before adding a branch.
- **Verification:** `/activity-history/dashboard` on a `groupBy` and range where the seed has a group
  under the builder's 1 % threshold (`HistoryPieChartBuilder`'s constant), or one fulfilled `route` body
  carrying a `{"groupId": null, "name": "_other"}` row. Pass: the legend entry reads *Ostatné* (and its
  English wording in EN), the slice is grey, and clicking it changes neither the selection nor the
  summary-card highlight. Re-check that clicking a **real** grey/colourless slice still selects — the
  guard must key on the id-plus-name pair, not on the colour or on `groupId === null` alone, or
  `Uncategorized` stops selecting with it.
- **Risk:** Low, one component. The only trap is the over-broad guard above: `Uncategorized` shares the
  null `groupId` and *is* a real, selectable bucket.

## FW1. `MyDialog` is `persistent` by default, so Escape closes nothing

> ✅ **FIXED 2026-09-23 — step 1 of 2** (`vue_framework` `90b80e6`, bump `8739d08f`).
> **Decision (owner, 2026-09-23):** neither of the body's two options as written. What `persistent` protects
> is **input**, not destructiveness. Escape on a yes/no confirmation is "no", the safe answer even for a
> delete, so a confirmation has nothing to guard. A half-filled form does.
> **Step 1, landed:** `MyDialog`'s default is unchanged. `useDialog().confirm()` now passes
> `persistent: false` (a `persistent` option restores the old behaviour for a confirmation that must be
> answered explicitly), and ten input-less dialogs opt out:
> - framework: `BasicTable` and `TableGrid` delete confirms, `CancelReminderDialog`,
>   `BulkCancelReminderDialog`, `ReplayConfirmDialog`, and `SessionsSection`'s log-out-all confirm;
> - app: `DayPlanner` and `RepeatingTasksTab` delete confirms, the view-only `TemplateComparisonDialog`,
>   and `PomodoroPresetsDialog` (its editing happens in a nested form dialog).
>
> Kept persistent on purpose: every `openDialog()` body (usually a form), `SnoozeDialog`, `ErrorDialog`,
> `TrackTimeDialog`'s result state, `RecoveryCodesBody`. `components.md` now says what `persistent` is for;
> `composables.md` documents `confirm()`'s new default.
> **Step 2, deferred:** flip the default once every dialog goes through the central dialog opener the
> owner plans, with a dirty-check "discard changes?" guard on forms instead of blanket persistence.
> **This body's "a destructive confirm must still resist Escape" is superseded** by the decision above.
> **Verified live and in specs:** the `/leisure/backlog` delete confirm closes on Escape and *Read a
> Novel* stays (`leisure-backlog-picker.draft.spec.ts`, which used to pin the opposite, now asserts
> this). The planner's task form survives Escape, and its delete confirm closes on Escape and keeps the
> task (`dayPlanner.spec.ts`, two new tests). The 2FA code dialog and the stopwatch save form still
> resist Escape (`two-factor.spec.ts`, `history-capture.draft.spec.ts`; their comments now cite FW1 as
> decided). `vue-tsc --build --force` exit 0, lint clean.
> **Commit oddity:** the backlog spec's FW1/FW20 hunks landed inside `3187c36f` (F64) through a
> shared-index collision between two sessions, and F64's own hunks followed in `a9d43af8`.

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

## FW20. `useTableFormatters`' substring heuristics misclassify columns — `durationMinutes` is a percentage, `inspirationSource` is a dash

> ✅ **FIXED 2026-09-23** (`vue_framework` `e6f4b68`, bump `8739d08f`).
> **Decision (owner, 2026-09-23):** both halves of the body's choice. Keys are matched by whole words (split
> on camelCase, `.`, `_`, `-`; a keyword also matches its plural; the boolean rule reads the first word
> only), **and** `TableColumn` gains an optional fifth argument `format: TableCellFormat` (`'raw' | 'date'
> | 'dateTime' | 'boolean' | 'currency' | 'percent'`) that replaces the guess for its column.
> `DataTable` resolves hint-then-guess once per header set. `detectCellFormat` and the `is*Key` matchers
> are module-level exports now; the composable still returns them.
> **Behaviour change for other apps, stated in the commit:** all-lower-case compounds (`subtotal`,
> `birthdate`) and `updatedAt` (only ever matched through "upDATEd") no longer auto-format; give them a
> `format`. `vatRate`, `totalPrice` and `isActive` are unchanged.
> **Verified:** `useTableFormatters.test.ts`, 28 cases, including the body's non-matches plus
> `durationSeconds`, `errorSummary`, `isolation` and `feedback`. Live: `/leisure/backlog` *Duration (min)*
> reads **45**, and `/leisure/bucket-list` *Inspiration* shows *"A friend's climbing photos"*. The backlog's
> auto-formatted yes/no columns (`isRepeatable`, `isAnchored`) still render icons. The spec's `B1`
> `fixme` is now a passing test. **Correction to the body:** `RoutineSettingsView`'s `isHidden` does
> not rely on auto-format; it is slotted as a switch (`:52`). `JobRunHistory`'s two workaround slots
> still win and were left in place. SK locale not checked (the change is key-based, not text-based).

- **Scope:** **[framework]** `src/_common/composable/table/useTableFormatters.ts:4-33` — submodule
  commit, then pointer bump. **Decision first** (word-boundary/segment matching vs. opt-in auto-format).
- **Closes:** `leisure-backlog-picker/B1` (+ one unfiled: the *Inspiration source* column on
  `/leisure/bucket-list` renders **"—"** for the seeded row whose value is *"A friend's climbing
  photos"* — §96)
- **Root cause (source-verified):** `isPercentKey` is `['percent','rate','vat','ratio','discount'].some(kw => lower.includes(kw))`
  (`:6,30-33`); `isCurrencyKey`, `isDateKey`, `isBooleanKey` are the same shape. `DataTable.vue:33-61`
  applies them to every column without a consumer slot. Tested against all **105** `TableColumn` keys in
  this app this pass: `durationMinutes` → `ratio` → `formatPercent(45)` = *"45.00 %"* (the finding);
  `inspirationSource` → `ratio` → `formatPercent("A friend's…")` = *"—"* (`:41`, non-number → dash), no
  slot in `BucketListTable.vue` (`:19-43` slot five other columns); `expectedCostTier` → `cost`, shielded
  by a slot. The framework's **own** `JobRunHistory.vue:90,99` slots exactly `durationSeconds` (`ratio`)
  and `errorSummary` (`sum`) — the trap was hit inside the framework and worked around rather than
  fixed. Unit 12 listed *Inspiration source* as a rendered column and did not notice its content was a
  dash; the seed says the row has text.
- **What to change:** Match on camelCase segments / word boundaries (`durationMinutes` → `duration`,
  `minutes`; `inspirationSource` → `inspiration`, `source`), or make auto-format opt-in per column
  (`TableColumn` gains a `format` hint, default `raw`). The first keeps zero-config and is a smaller
  diff; the second is honest. Either way, add a unit test that feeds every keyword-containing
  non-match (`duration`, `elevated`, `candidate`, `update`, `assumption`) and asserts `raw`.
- **Do not change:** the app's tables — no per-table slots as a workaround (see the ordering note
  above), and no rename of `durationMinutes` (it is the wire field).
- **Verification:** `B1`'s `Verify:` block (*"45"*, no percent) **and** `/leisure/bucket-list`'s
  *Inspiration source* showing the seeded text; then every `DataTable` consumer in this app that relies
  on auto-format — the tracker mapping tables (`isActive`/`isIgnored` booleans), `RoutineSettingsView`
  (`isHidden`), `ActivityTable` (`isUnavoidable`) — still renders its icons; and the framework's
  `JobRunHistory` unchanged. Both locales.
- **Risk:** Medium, framework-wide: loosening the match can un-format a column that another app named
  `vatRate`; tightening it to segments keeps those. Prefer segments.

## FW23. A second column-header click adds a sort key instead of replacing it

> ✅ **CLOSED 2026-09-23 — no change needed.** **Decision (owner, 2026-09-23): (b)**, keep multi-sort and
> show the affordance. `DataTable.vue:14` passes `multiSort` explicitly, so multi-sort was already a
> choice. **The affordance already exists.** On `/leisure/backlog`, one unmodified click on *Duration
> (min)* after the default *Activity* sort gives `sortBy=activity.name:asc,durationMinutes:asc`, and **both**
> headers carry Vuetify's numbered badge: *Activity ↑ 1*, *Duration (min) ↑ 2* (DOM and screenshot, a
> 20 px chip on a 12 % grey ground). Clicking the same header again cycles asc → desc → removed, so the
> second key can be taken off. `VDataTableHeaders.js:186-190` draws a badge on every sorted column when
> `multiSort` is on, and nothing in `DataTable` or any consumer overrides the header cells. The finding's
> "no numbered sort badges beyond the primary key's own chip" does not reproduce; it was probably read
> before the second key had applied.
> **Not built, offered as new scope:** a header tooltip spelling out the click cycle, if discoverability
> is still wanted.

- **Scope:** **framework** — `BasicTable`/`DataTable`'s `VDataTable` configuration
  (`src/_common/component/dataTable/`). Submodule commit + pointer bump.
- **Closes:** `leisure-backlog-picker/P1 (round 2)`
- **Root cause:** one unmodified click on a second header turned `sortBy=activity.name:asc` into
  `sortBy=activity.name:asc,durationMinutes:asc` — Vuetify's multi-sort behaviour, inherited by every
  table in the app. The server accepts it; it is simply not what the click looked like it was asking
  for, and there is no affordance anywhere (no shift-click hint, no numbered sort badges beyond the
  primary key's own "Activity 1" chip) telling the user a second sort is being layered.
- **Its own batch by rule 4.** Whatever is decided here applies to every table in every app on the
  framework, not just the four leisure ones — that needs a decision, not a patch.
- **The decision, stated plainly:** either (a) make single-sort the default and let a table opt into
  multi-sort, which matches what every table in this app looks like it does and is the finding's first
  pass condition; or (b) keep multi-sort and render the affordance — numbered badges on every active key,
  extending the chip the primary key already has. (a) is a behaviour change for other apps; (b) is more
  work and leaves a URL that grows on every click. Neither is obviously right, which is why this is
  filed as a decision.
- **What to check before deciding:** `useTableUrlState`'s `sortBy` codec already round-trips a
  comma-joined list, so (a) does not simplify the URL format — and some consumer may be reading a
  multi-key sort deliberately. Grep the framework and this app for a table passing more than one
  default sort item.
- **Verification:** `P1`'s `Verify:` block on `/leisure/backlog`, then the same two clicks on a
  `DataTable` and a `BasicTable` elsewhere in the app, and on the framework's own `JobRunHistory`.
- **Risk:** Medium for a trivial-looking change — it ships to every app on the framework and changes a
  gesture users have already learned, in whichever direction it goes.
