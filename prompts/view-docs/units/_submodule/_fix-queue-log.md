# Fix queue — log (`_submodule` units 16–19)

> Audit trail for [`_fix-queue.md`](_fix-queue.md) beside this file. Nothing here is open work.
> Created on the fourth pass. Passes 1–3 kept their notes inline in the queue, and those notes were moved here
> verbatim (*Passes 1–3* below).

## Pass history (newest first)

> **Fourth pass, 2026-10-01, commit `0e77f904` (framework `b1b82a1`) — unit 16 `reminders-user` absorbed (inventory
> + mutation).** 21 entries considered (X1, B1–B6, A1–A4, P1–P7, O1, U2, U3), all `[framework]`. Four new batches:
> S28 (X1 + B2), S29 (B5 + P4), S30 (A2's Dismiss half + P5 + P7) and S31 (A3, rule 4). Six findings were folded into
> existing batches by cause: B3 → S20, A4 → S26 and P2 → S23 (the three the third pass pre-listed), plus A1 → S13,
> P1 → S17 and P6 → S11. S13, S17 and S11 were widened in place, and S13 and S17 changed their titles. Two new
> escalations: §S6 (B1, B4) and §S7 (B6, plus B2's server half). P3 is parked under §S2 as a client half that needs the
> kind catalog. U3 went to *Needs verification* and O1 to *Deferred*. U2 was not queued, because the unit settled it
> itself (`stale`). §S5 stays unused, because the third pass reserved it conditionally. The queue/log split from
> `TRIAGE-PROMPT.md` was applied on this pass: the queue's *Re-grades & notes* section and its post-summary note on
> `scheduler/P2` moved here, the queue's header now points here, and S7's "leave `MyRemindersView` to unit 16's
> triage" was answered in place. Totals: 83 findings considered, 31 framework batches, 0 app-side, 6 escalations.

> **Third pass, 2026-10-01 — unit 17 `reminders-admin` absorbed (inventory).** 22 findings: 10 new batches
> (S18–S27), and S5 and S7 widened. Details in *Passes 1–3* below.

> **Second pass, 2026-10-01 — unit 18 `notifications` absorbed (inventory + mutation).** 19 findings: S10–S17, and
> §S2–§S4 escalated. `scheduler/P2` was moved into S11. Details below.

> **First pass, 2026-09-30 — unit 19 `scheduler`.** S1–S9 and §S1. Details below.

## Closed batches

_None yet._

## Closed verification items

_None yet._

## Contradictions & re-grades

### Contradictions

Numbered from 1 here. Passes 1–3 recorded theirs inline, and those are kept verbatim under *Passes 1–3*.

1. **`reminders-user/A2` vs the app queue's FW1 decision.** The finding expects both the Snooze and the Dismiss dialog
   to close on Escape, and suggests `:persistent="false"` on both. FW1 (owner decision 2026-09-23,
   `docs/views/_fix-queue-log.md` → *Closed batches* → FW1) names `SnoozeDialog` among the dialogs "kept persistent on
   purpose", because it carries a custom-time form. The Dismiss dialog is an input-less confirmation, exactly the
   kind FW1 opted out. Step 1 missed it because it is template-declared in `MyRemindersView`, not one of the ten sites
   it listed. Resolution: the Dismiss half goes to S30, and the Snooze half is dropped. The unit's phase-5 spec should
   assert that Snooze *resists* Escape.
2. **`reminders-user/A1` vs S13's framing.** S13 (from `notifications/A2`) blamed `DialogHost` entries and offered
   "capture `document.activeElement` at `openDialog()`" as its first option. `SnoozeDialog` is not a `useDialog()`
   dialog. It is a template `v-if` that mounts already open (`MyRemindersView.vue:152-158`), so that option would close
   `notifications/A2` and leave `reminders-user/A1` open. S13 now requires the fix inside `MyDialog`.
3. **S22's identity helper cannot reach `/pripomienky/moje`.** S22 names a reminder `{subjectType} #{subjectId}`, and
   the personal `my-upcoming` row carries neither field. So `reminders-user/B1` does not fold into S22. It is §S6. S22's
   *Do not change* now says so, so that a fixing session does not widen it.
4. **Stale comments in framework source**, found by unit 16. None gets a batch of its own. `MyRemindersView.vue:296`:
   "MyDialog already restores focus to whatever opened it" is false until S13 lands.
   `useReminderTableErrors.ts`: "Giving these five tables a proper error state is R2's job", but R2 never took it
   (S29). `UpcomingReminderGridResponse.ts` header: `MyRemindersView` "renders none of" the omitted fields "except
   `cronExpression`", but it renders `intervalPreset` too (§S6's client half corrects it). The module README's
   "Slovak-only" claim, already noted on the third pass, is stale again (`reminders-user` *Intent sources*).

### Re-grades

Fourth pass (unit 16 `reminders-user`):

- **`B4` bug → polish**, escalated in §S6. The finding's own *Expected* is the column's "one-off or repeating?"
  question, and the row's repeat icon already answers it. What is missing is *how often*: real, but polish.
- **`A2` a11y → split; Snooze half dropped** (Contradiction 1). The Dismiss half keeps its severity, in S30.
- **`X1` blocker, kept.** It is the best-evidenced finding in the unit: observed 404s with the request bodies, a 204
  with the server's keys from the same page, and confirmed in source on this pass (client `.ts` vs server `.cs`).
- **`B2` bug, kept, and batched with `X1` despite a different cause.** It is a shipping constraint, not a cause match:
  X1 alone makes the harmful default reachable (rule 3's spirit, one fixing session; S28 *Risk* states the order).
- **`B1` bug and `B6` bug, kept**, escalated as §S6 and §S7. Both are contract gaps the client cannot close.
- **`P3` polish, not batched.** It is parked under §S2: the selects and the labels need the kind catalog, and the
  interim (dropping the two filters) is an owner call.
- **`B5` + `P4` merged into S29.** They are the same `#no-data` slot. B5's "all four tables share it" is source-only
  (the same helper at four `onError` sites, confirmed by grep). S29's verification adds one admin-table check rather
  than asserting it.
- **Merged into existing batches as cross-unit duplicates (6):** `B3` → S20, `A4` → S26, `P2` → S23, `A1` → S13,
  `P1` → S17, `P6` → S11. Each was checked against the batch's root cause, not just its symptom.
- **`U2`, not queued.** The unit marked it `stale` in its own round 2 (all paths work as coded except P7's copy, which
  is S30).
- **`U3`, kept unverified.** The browser and the account share a zone, so the pass could not tell them apart.
- **`O1` → Deferred**, noted as §S7's client half.

### Passes 1–3 (moved verbatim from the queue's *Re-grades & notes* on the fourth pass)

The note that sat under the queue's Summary table until the fourth pass:

> `scheduler/P2` was *not batched* on the first pass, deferred to the app queue's *Contradictions* §22. It is now in
> **S11**. §22 is a note, not a queued fix ("unfiled, unobserved in a browser"), so deferring to it parked the
> defect nowhere. `notifications/B2` is the first observed instance. See *Re-grades & notes*.

#### First pass, 2026-09-30 — unit 19 `scheduler`

- `B6` (bug) → **escalation §S1**. The cause is server-side, and the client reports the state correctly. Severity is
  unchanged.
- `P2` (polish) → **not batched**. It duplicates app-queue §22 (`DateTimeHelper` hardcoded `sk`). *(Reversed in the
  second pass: now in S11.)*
- Pairs batched together because one fixing session edits the same block: `B1`+`P1` (jobs-grid setup), `B3`+`B4`
  (breadcrumb ownership), `A1`+`A2` (naming), and `P4`+`P5`+`P6` (run-detail cards). `X1` and `B5` are **not**
  merged, even though both are flex-height bugs. They are different containers with different fixes, and S1 must not
  change `SchedulerDetailPage` in a way that affects S2's page.
- Contradiction with the unit prompt: it said to expect the code to lag `prompts/_common/scheduler/` ("a gap here is
  usually *not built yet*"). S1, S3, S4, S5, S6, S7 and S8 have all landed (`git -C src/_common log --
  modules/scheduler`), and every listed claim checked live holds (table in `docs/views/_submodule/scheduler/findings.md`). That
  prompt set is effectively done and could move to `_done/`. That is the owner's call, not this queue's.
- Not filed, observed in passing (framework-wide, outside this unit): `ExportMenu`'s open menu joins the activator's
  accessible name (`button "Export Excel (.xlsx) CSV (.csv)"`), and every `FilterPanel` chip's remove button is named
  just "Close". Whichever unit meets them next can file them.

#### Second pass, 2026-10-01 — unit 18 `notifications` absorbed (inventory round 1 + mutation round 2)

- 19 findings, all `[framework]`: 14 batched into S10–S17, 3 escalated (§S2–§S4), 2 to *Needs verification*. None
  dropped and none merged across units, except `scheduler/P2`, which joins `notifications/B2` in S11.
- **Re-grade of this queue's own first-pass call:** `scheduler/P2` "not batched" → **batched in S11**. The first pass
  deferred it to the app queue's §22. §22 is a *Contradictions* note that explicitly left the defect "unfiled,
  unobserved in a browser", so deferring to it parked the fix nowhere. With a second, independently observed consumer
  (`notifications/B2`), rule 4 applies: a framework-wide default gets its own batch.
- `notifications/B3` (bug) → **escalation §S2**. The card cannot be fixed without a server catalog. Its client half is
  described in §S2, to be appended as a batch when the catalog lands. Severity unchanged.
- `notifications/B4` (bug) → **escalation §S3**. The cause is the dispatcher's `activeIds`. The client caption states
  the documented intent. Severity unchanged.
- `notifications/P5` (polish) → **escalation §S4**. It is a catalog decision, and a client filter is the documented
  wrong answer.
- `notifications/P4` looked app-side in its finding ("the label keys are app-side, `src/app/notifications/`"). They
  are not: the four labels in question are the framework's `notifications.type.*` (`src/_common/_locales/common.en.ts:
  386-392`). The app's `notificationTypeMeta.ts` registers a label only for `RoutineSuggestedToday`. So P4 is
  framework, batched in S16, and no app-side batch results.
- Kept as separate batches despite touching the same module: S12 (names) vs S16 (copy). One is a11y attributes and the
  other is visible wording with product choices in it (P4, P6). S13 and S15 are their own batches under rule 4:
  `MyDialog` and `SnackbarComposable` defaults reach every app.
- **Contradiction (resolved in the unit docs):** `docs/views/_submodule/notifications/usecase.md` said the dispatcher "defers every
  notification (not just reminders)" inside quiet hours, and that turning off every deliverable channel removes a type
  from the inbox. Round 2 disproved both (P6, B4). The usecase was corrected in the same pass.
- **Contradiction, cross-repo, not queued:** the API repo's `docs/e2eTestSeed.md` still warns that "the bell's text is
  Slovak regardless of the account's locale". Round 1 settled that it is not (`_shell` B1, closed 2026-09-21 after
  backend `B15`). It is a stale doc in another repo, so fix it there when next touched.
- **Downstream app string to recheck after §S2/§S3 (second pass):** `dayPlanner.en.ts:27` sends users to reminder preferences to
  turn reminders off "entirely". Today neither the kinds card (§S2) nor the matrix (§S3, the row still lands) can
  fully do that on this deployment. If either escalation resolves as "keep behaviour", that string needs an app batch.

#### Third pass, 2026-10-01 — unit 17 `reminders-admin` absorbed (inventory)

- 22 findings, all `[framework]`: 18 fix findings in 10 new batches (S18–S27) and 2 existing ones (S5, S7), 2 to
  *Needs verification*, 1 to *Deferred*. None dropped. No severities changed.
- **Merged into existing batches, by cause:** `reminders-admin/B3` → **S5**. It is the same assumption with the same
  comment, and it tips S5 toward the shell-level de-dup. `reminders-admin/P2` → **S7**, the same missing `_silent`. Both
  batches were widened in place rather than duplicated. Their titles changed, their numbers did not.
- **Related but kept separate:** S18 (reminders flex-shrink) vs S2 (scheduler flex-shrink), and S23 (reminders
  tie-breaker) vs S3 (2) (scheduler tie-breaker). Each pair has one cause but different files, and S2/S3 already carry
  scheduler-only work. A fixing session can take a pair together.
- **Rule 4 splits:** S25 (`BasicTable` select column), S26 (`FilterPanel` chip close label) and S27 (`ExportMenu`)
  each change a component every app renders. S26 and S27 file the two items the first pass noted as "observed in
  passing … whichever unit meets them next can file them".
- **Contradiction with an intent source (resolved by observation):** R1 bug 5 and the register's `TODO(Bn)` say the
  grid endpoint does not return `cronExpression`/`intervalPreset`, and the fix was parked on a backend ask that was
  never written. The live response carries `intervalPreset`, `cron` (not `cronExpression`) and `dueAt`, so S19 is
  client-only. The README's "the module is Slovak-only, do not add an EN locale" is also stale: both `.en.ts` files
  exist and render. Neither needs a batch. Both are notes for whoever next reads `prompts/_done/_common/reminders/`.
- **Contradiction between units (not yet absorbed):** unit 16's `reminders-user/B3` (date "to" bound), `A4` (chip
  "Close") and `P2` (sort tie-breaker) are the same defects as `reminders-admin/B4`, `A3` and `P1`. They are listed in
  S20, S26 and S23 as cross-unit duplicates so unit 16's triage closes them there. `reminders-user/B4`
  (interval row "—" on `/pripomienky/moje`) looks like `reminders-admin/B1` but is **not** the same cause: the
  personal `my-upcoming` projection genuinely omits `intervalPreset` (per the DTO header), so it stays a backend
  question for unit 16's triage.
- **Observed, not filed (unit's findings file, *Observed, not filed*):** a `RecurringInterval` reminder's local time
  moves with DST, because the series is a UTC instant (#23003: 10:00 in October, 9:00 November–March). This is a
  server rule in `Sydowwe.Reminders`. If the product wants wall-clock recurrence, it becomes an escalation (§S5) at
  that point. No client change either way.
- **Concurrency note:** the unit's draft spec was run once (global setup reseeds). Unit 16's files were last written
  minutes before, and no other `playwright-cli` session was live at the time.
