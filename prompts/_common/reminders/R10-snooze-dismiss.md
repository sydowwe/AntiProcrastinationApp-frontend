# R10 · Snooze and dismiss — the only two things a normal user can do here

- **Scope:** `src/_common/modules/reminders/component/SnoozeDialog.vue`, `view/MyRemindersView.vue`
- **Backend:** possibly — see the escalation block at the end
- **Model / effort:** Sonnet 5, medium
- **Depends on:** R1 (bug 4 touches the same reactive-clock question), R5 (rewrites MyRemindersView's script)
- **Unblocks:** nothing

---

```
/pripomienky/moje is the only route in this module a non-admin ever sees, and snooze and dismiss are the
only two actions it offers. They mostly work. This prompt is about the edges, which is most of what a
user actually experiences on a page they visit twice a month.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; do not fork into src/ and do not add a
migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end. Commit
and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the surrounding style
by hand (tabs, single quotes, no semicolons, defineModel for two-way binding, destructure defaults for
props, never withDefaults). Verify Vuetify props with the `vuetify` MCP.

--- What is there ---

MyRemindersView.vue:244-315 opens one of two dialogs, calls dismissOccurrence / snoozeOccurrence
(ReminderDashboardApi.ts:114-124, both `_silent: true` so the view owns the messaging), optimistically
drops the row, and maps 404 → "no longer available to you" / 400 → "occurrence is in the past" / anything
else → generic error (handleActionError, lines 296-315). That structure is good. Keep it.

--- The problems ---

**1. There is no undo, and the action is silently irreversible from this screen.** Dismiss says "this
occurrence will not be delivered to you"; the row then disappears and there is no way back. The request
DTOs document both actions as append-only and per-recipient
(DismissOccurrenceRequest.ts:2-4, SnoozeOccurrenceRequest.ts:2-4) — append-only means a later record
supersedes an earlier one, which is exactly the shape that makes undo possible in principle. But no
un-dismiss endpoint exists in the api file.

Do NOT invent one. Do the honest thing: make the action's finality clear before it happens rather than
faking a way back after. The dismiss dialog already explains the scope well
(remindersDashboard.sk.ts:48); check it also makes clear this cannot be undone from here. Then write the
ask (see the last section) — an undo window on a per-recipient, append-only suppression is a reasonable
thing for this service to support, and you will have the concrete case for it.

**2. The optimistic row-drop yanks the dialog out from under itself.** `dropActiveRow()` (lines 254-257)
filters the row out of `items`; `activeOccurrence` is computed from `itemsById` (line 201-203); and the
SnoozeDialog is rendered under `v-if="activeOccurrence"` (line 130). So on success the dialog's data
vanishes before `snoozeDialog.value = false` runs on the next line — it unmounts instantly rather than
closing. Order the success path so the dialog closes first, then the row leaves (ideally with the
`v-auto-animate` directive this repo uses for list transitions, if BasicTable's rows can take it).

**3. `dropActiveRow` corrupts the pager.** It decrements `itemsLength` (line 256) but never refetches, so
after three dismisses on a 25-row page the table shows 22 rows, claims 22 fewer total, and page 2 is now
offset by three — rows the user has never seen have silently shifted. Optimism is right for the row;
lying about the total is not. Either refetch quietly after the action settles, or stop adjusting
`itemsLength`. Say which you chose and why.

**4. The snooze presets are opinionated and half of them are undocumented.** SnoozeDialog.vue:94-107:
"in 1 hour" (now + 1h), "tomorrow" (next day at 09:00 local, hardcoded), "next week" (now + exactly 7×24h,
so it lands at the current time of day seven days out, NOT at 09:00 like "tomorrow"). Two of the three
are relative-to-now and one is anchored to a workday morning; the inconsistency is invisible in the UI
until the reminder arrives at 23:47.

The dialog does show the resolved instant in an alert (lines 51-58) — which is the saving grace and must
stay. Make the presets internally consistent, and show the resolved time on the radio options themselves
rather than only after selection, so the choice is informed. If "tomorrow morning" should follow the
user's own preference rather than a hardcoded 9, note that `src/core/user/dto/userAugmentation.ts` shows
how this app extends user preferences — but do NOT add a preference field from inside the framework
module; raise it instead.

**5. Duplicated reset logic.** `watch(open, …)` resets choice and customInstant on open (lines 127-133)
and `onClosed` resets the same two on close (lines 140-143). One of these is enough; keep the open-time
reset, since it is the one that guarantees a clean dialog regardless of how the last one ended.

**6. `now` is frozen at open, `isValid` is not.** Line 91 captures `now` when the dialog opens and the
presets compute from it (correct and deliberate — the presets should not drift while the user reads), but
`isValid` (line 125) compares against a live `Date.now()`. Leave a dialog open for two hours and the
"in 1 hour" preset silently becomes a past instant; `isValid` will catch it, so the button disables — but
with no explanation, because the "must be in the future" warning at line 59-66 only renders for the custom
choice. Make the failure legible: if the presets have gone stale, re-anchor them (a dialog reopening its
own clock is fine) or say why the button is disabled.

**7. `canAct` and the 400 path.** MyRemindersView.vue:206-209 guards the buttons against a passed
occurrence using a non-reactive `Date.now()`. R1 fixes that with a reactive clock; if R1 has not run,
fix it here and note the overlap. The 400 handler (line 306-310) then becomes the genuine race case it
was meant to be, rather than the common case.

--- Out of scope ---

- The admin lifecycle actions (pause/resume/cancel in ReminderActionButtons) — different audience,
  different semantics.
- Bulk snooze/dismiss (R11 covers bulk, and covers it for the admin actions).
- The reminder-preference screen the view links to at line 16; that lives in the notifications module.

--- Verification ---

npm run type-check — baseline 72 errors, all app-side in src/core; any src/_common error is yours.
npm run lint stays at 0.

Then on /pripomienky/moje, with a reminder you are a recipient of:
  - Snooze one: the dialog closes cleanly (no flicker/instant unmount), the row leaves smoothly, the
    snackbar names the resolved time, and the pager total is not lying — reload and compare.
  - Each preset shows its resolved instant before you commit, and the three are consistent with each
    other.
  - Open the snooze dialog, wait past the "in 1 hour" mark (or set the clock forward), and confirm the
    dialog explains itself rather than just disabling its button.
  - Dismiss one: the copy makes the finality clear before you click.
  - Force a 404 and a 400 (block the request / act on a stale row from a second tab): both still produce
    their specific message, and the list ends up reflecting reality.

--- After the frontend work is done: write the backend ask, IF you found one ---

Problem 1 is the one you cannot solve in the client. The api file exposes dismiss and snooze and nothing
that reverses either, while both DTOs describe an append-only, per-recipient model in which a superseding
record is the natural mechanism. If, having done the work, you still think an undo (or an
"undismiss"/"unsnooze") is the right call, write it up.

Finish and verify the frontend work first. Then read prompts/_common/reminders/backend/README.md for the format and
scope rules — this is the FRAMEWORK's shared reminder service, say so, and say whether the change is
additive. Write it to prompts/_common/reminders/backend/Bn-<slug>.md.

Make the ask about the rules, not the endpoint shape: how long an undo window is defensible, whether
undoing a dismiss re-arms an occurrence whose instant has since passed, and what happens to an undo that
arrives after the dispatch scanner has already skipped the occurrence. Those answers determine whether the
button is worth building at all.

If you conclude the current one-way behaviour is correct for this service, write nothing and say so.
```
