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

## Closed verification items

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
