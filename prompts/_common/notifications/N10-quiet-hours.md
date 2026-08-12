# N10 · Quiet hours: a confusing save flow over an unstated contract

- **Scope:** `src/_common/modules/notifications/reminderPreference/component/QuietHoursCard.vue`,
  `view/ReminderPreferencesView.vue`, `component/ReminderKindRow.vue`,
  `api/ReminderPreferenceApi.ts`, `src/_common/_locales/common.sk.ts`
- **Backend:** **yes** — the timezone of `startMinute`/`endMinute` is undefined. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** nothing (N9 touches the same screen but different files)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/reminderPreference/ in place. At the end, list the files under
src/_common you touched.

The reminder-preferences screen has one card that saves explicitly (quiet hours) and one that saves
on every keystroke (kinds), and the quiet-hours card's flow does not hold up.

1. Turning the switch off and pressing Save is a disguised delete.
   QuietHoursCard.vue:142-145 — save() checks `if (!enabled) { await clear(); return }`. So the
   "Uložiť" button, under some states, permanently clears the window; the destructive action already
   has its own clearly-labelled red button at line 76-85. Two paths to the same destructive result,
   one of them labelled "Save". Worse, the switch at line 17-23 has no v-model target on the server —
   flipping it off changes nothing until you also press one of two buttons, and there is no
   indication of that.
   Decide the model and make it one thing: either the switch saves immediately (matching
   ReminderKindRow, which persists on every change — ReminderKindRow.vue:32, 40) or the card is a
   form with explicit save. Do not keep both. Given the neighbouring card auto-saves, consistency
   argues for auto-save with an undo; if you choose the form model instead, justify it and add dirty
   tracking so leaving with unsaved changes is visible.

2. There is no dirty state and no refetch.
   save() emits `updated` with a locally-constructed QuietHoursWindow (line 152) and the view assigns
   it (ReminderPreferencesView.vue:72-74). Same for kinds (line 76-85). So the screen's state is what
   the client THINKS it sent, never what the server stored. If the server normalises, clamps, or
   rejects part of it, the UI silently disagrees until a reload. Either have the endpoints return the
   stored value and use that, or refetch. Prefer the former; if the endpoints return no content
   (ReminderPreferenceApi.ts:18-30 types all three as Promise<void>), that is a backend ask, not a
   reason to keep guessing.

3. The Save button's disabled logic reads the wrong condition.
   Line 91 — `:disabled="clearing || isZeroLength"`, and isZeroLength (line 138) is guarded on
   `enabled.value`. Trace the states: switch off + equal times -> isZeroLength is false -> Save is
   enabled -> save() calls clear(). It works, but only by a chain of coincidences across three
   expressions. After fixing (1) this should collapse into something you can read in one line.

4. The timezone is undefined and nobody has said so.
   QuietHoursWindow's own comment says "minutes-from-midnight (0..1439)" and never says WHOSE
   midnight. The client sends `startTime.getInMinutes` straight from a TimePicker (line 149-150),
   which is wall-clock local. The server defers reminders based on it. Whether the server interprets
   those minutes in UTC, in a stored user timezone, or in the server's own, changes the behaviour by
   hours — and DST makes it change twice a year for the same stored value. This is not answerable
   from the client. Do NOT guess and do NOT add a timezone field on your own initiative; do (5) and
   write the ask.

5. Say what you can say honestly. The card explains overnight windows
   (quietHours.overnightHint) but not the deferral semantics — the SK intro string at common.sk.ts:297
   says reminders are held and delivered after the window rather than dropped, which is genuinely
   useful and is buried in a subtitle. Surface the consequence at the point of decision: what the
   user is signing up for when they set 22:00 → 06:00, including how many pending reminders that
   currently implies if the data lets you say.

Also fix while you are in the file:
- The `channel` enum labels are duplicated in the locale file: `notifications.channel.{InApp,WebPush}`
  (common.sk.ts:285-288) and `reminderPreference.channel.{InApp,WebPush}` (line 317-320), identical
  values. ReminderKindRow.vue:77 uses the second. The first is part of the dead block N1 flagged and
  N12 may revive — do not delete it here, but add a comment on one pointing at the other so they do
  not drift.
- ReminderKindRow.vue:34-41: the VSwitch and the VSelect both call persist() on change, and the
  select is disabled while `!enabledLocal` (line 29). So enabling a kind and choosing a channel is
  two round-trips with a disabled control in between. Debounce or combine them.
- ReminderPreferencesView.vue:61-70 handles a failed load by leaving `preferences` at its empty
  constructed default (line 56) and showing the empty states — the same empty-success problem the
  bell has. Give it an error state with a retry.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural on /nastavenia/pripomienky:
- set a window, reload: it persists and reads back identically
- set an overnight window (22:00 → 06:00): the hint shows, it saves, it reads back
- set start == end: the error shows and saving is impossible by every path, including the switch
- clear: exactly one obvious way to do it, and it is labelled as destructive
- toggle a kind off and pick a channel: sensible request count, no disabled-control dance
- stop the backend and load the page: an error with a retry, not two empty cards

--- After the frontend work is done: write the backend ask, IF you found one ---

The timezone question (item 4) is a near-certain ask and it is a rules question, not a shape question.
Ask: in which timezone does the server interpret startMinute/endMinute; where does that timezone come
from (a user field? the request? the server's own?); what happens to a deferred reminder across a DST
transition; and what happens to reminders that pile up during a long window — all at once at 06:00,
or spread. State what the client does today (sends local wall-clock minutes with no timezone
whatsoever) so the answer can correct it.

Item 2 may produce a second, smaller ask: the three write endpoints return no content, so the client
cannot show server truth. Fold it into the same file — it is the same endpoint family.

Read prompts/_common/notifications/backend/README.md for the format and scope rules, including the
shared-endpoint rule — reminder-preference is framework surface serving more than one app, and
another app's quiet hours behave the same way. Write to
prompts/_common/notifications/backend/Bn-<slug>.md.
```
