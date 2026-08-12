# R3 · Slovak plurals are hardcoded to the 5+ form ("1 dní pred termínom")

- **Scope:** `src/_common/modules/reminders/_locales/{reminders,remindersDashboard}.sk.ts`, `composable/useReminderFormat.ts`
- **Backend:** —
- **Model / effort:** Sonnet 5, low
- **Depends on:** nothing
- **Unblocks:** nothing

---

```
A small, fully-specified localization bug. The infrastructure to fix it already exists and is already
used elsewhere in this repo — the reminders locale simply never adopted it.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place — do not fork anything into src/, and do not add
a migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end.
Commit and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the
surrounding style by hand (tabs, single quotes, no semicolons, backtick-quoted message strings as the
locale files already use).

--- The bug ---

_locales/reminders.sk.ts:51-59 defines the lead-offset units as single, invariant strings:

    leadOffset: {
        atDeadline: `presne v termíne`,
        before: `{n} {unit} pred termínom`,
        after: `{n} {unit} po termíne`,
        unit: { day: `dní`, hour: `hodín`, minute: `minút` },
    }

Those are the 5+ (genitive plural) forms. useReminderFormat.ts:18-38 interpolates them for any n, so:

    -1440  → "1 dní pred termínom"     should be "1 deň pred termínom"
    -4320  → "3 dní pred termínom"     should be "3 dni pred termínom"
    -43200 → "30 dní pred termínom"    correct, by accident
    -60    → "1 hodín pred termínom"   should be "1 hodinu"
    -180   → "3 hodín pred termínom"   should be "3 hodiny"
    -1     → "1 minút pred termínom"   should be "1 minútu"

This renders on ReminderDefinitionDetailView (the lead-offset chips, line 111-119) for every one-shot
reminder that nudges before its deadline — which is the common case.

The same bug, second instance: _locales/remindersDashboard.sk.ts:75

    dueSoon: `Splatné do {days} dní`

renders "Splatné do 1 dní" whenever ReminderOverviewResponse.dueSoonDays is 1 (its own fromJson defaults
it to 7, but the server chooses it, and the frontend must not assume). ReminderOverviewView.vue:53-55
renders it.

--- What already exists ---

src/i18n.ts:9-14 registers a three-category Slovak plural rule (1 | 2–4 | 0 and 5+) on the SK locale.
src/core/todoList/_locales/todoList.sk.ts:37-38 and :49-52 use it correctly and carry a comment
explaining the form order — read one of them before you write yours; match that convention, including
the explanatory comment.

Note the mechanics: the rule only applies to messages resolved WITH a count argument, i.e.
`t(key, n, { named })`, not plain `t(key, { named })`. useReminderFormat currently calls the plain form
(lines 36-37), so changing the locale strings alone will do nothing — both sides have to change.

--- Do this ---

1. Restructure the lead-offset messages so the unit and its number agree. The current shape —
   interpolating a `{unit}` noun into a separate `{n} {unit} …` frame — cannot express Slovak agreement,
   because the correct string depends on both the unit AND the count together, and the accusative
   ("1 hodinu pred termínom") differs from the nominative you would get from a standalone unit label.
   Prefer one pluralized message per unit per direction over trying to keep the two-part frame. Get the
   Slovak right rather than the structure minimal — check each of the three forms for all three units in
   both directions, and against `atDeadline`, which stays as it is.

2. Update useReminderFormat.formatLeadOffset to call the plural form of `t` with the count. Its current
   branching (line 24-33: `% 1440` → days, `% 60` → hours, else minutes) is sound and should survive; it
   is only the message selection that changes. Keep the function's signature and its doc comment intact —
   ReminderDefinitionDetailView.vue:118 is the only caller, but it is framework API.

3. Fix `dueSoon` the same way, and update ReminderOverviewView.vue:54 to pass the count so the rule fires.

4. Read the rest of both locale files for the same latent bug before you finish. `corrects: 'Opravuje
   #{id}'` and similar are fine (no count); anything that interpolates a number into a noun phrase is
   not. Fix what you find, list it in your final message.

--- Do not ---

- Add an .en.ts. This module is Slovak-only BY DESIGN — the framework's own `common` locale is SK-only
  and EN.ts deliberately spreads nothing for reminders. This prompt is about Slovak being wrong in
  Slovak.
- Touch src/i18n.ts. The rule there is correct and shared.
- Change formatInstant or formatPayload.

--- Verification ---

npm run type-check — baseline 72 errors, all in src/core; any src/_common error is yours. npm run lint
stays at 0.

Then check the rendered strings. The fastest honest check is the detail view of a one-shot reminder with
several lead offsets (/pripomienky/register → open one → the "Predstihy" chips). If your data has no
reminder with a 1-day or 1-hour offset, temporarily hardcode `leadOffsetMinutes` in the component to
[-1, -3, -60, -180, -1440, -4320, -43200, 0] and read all eight chips, then revert. Confirm:
  -1440 → "1 deň pred termínom", -4320 → "3 dni…", -43200 → "30 dní…", 0 → "presne v termíne".
Then the overview headline card with dueSoonDays 1, 3 and 7.

State in your final message which forms you verified by eye, and which you could not because the data
did not exist.
```
