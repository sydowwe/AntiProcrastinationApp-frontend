# N9 · The reminder-kind labels are another app's domain, hardcoded in the framework

- **Scope:** `src/_common/_locales/common.sk.ts`,
  `src/_common/modules/notifications/reminderPreference/component/ReminderKindRow.vue`,
  `src/_common/bootstrap/installFramework.ts`, new app-side registration file,
  `src/_common/SETUP.md`
- **Backend:** —
- **Model / effort:** Sonnet 5, low–medium
- **Depends on:** nothing
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/ in place. At the end, list the files under src/_common you touched.

The framework locale file ships another application's domain vocabulary:

  src/_common/_locales/common.sk.ts:321-328
    ownerModule: { EmployeeModule: `Zamestnanci`, AttendanceModule: `Dochádzka`,
                   InventoryModule: `Sklad` },
    kindName:    { ProbationEnding: `Koniec skúšobnej doby` },

This app has no employees, no attendance and no inventory. Those labels come from the HR product the
framework was extracted from — the same one whose enum is named in the comment at
src/app/notifications/notificationTypeMeta.ts:4.

The consequence is visible in the UI. ReminderKindRow.vue:81-88 looks up
`reminderPreference.ownerModule.${preference.ownerModule}` and falls back to the raw identifier when
the key is missing. So on the reminder-preferences screen (/nastavenia/pripomienky), this app renders
raw server enum names — `RoutineModule`, or whatever the backend emits — in a settings page users are
supposed to read and act on. The fallback is doing its job; the problem is that it is the only thing
happening.

This is the same problem `notificationTypeMeta` already solved correctly. Read
modules/notifications/utils/notificationTypeMeta.ts and the comment at lines 9-13: the module owns the
lookup functions and the fallback, and the APP registers the map through installFramework, because
the values a backend emits are app-owned. Labels for `(ownerModule, kind)` are exactly the same kind
of thing.

Do this:

1. Add the seam. A registration function next to the existing one — the module owns
   `reminderKindLabel(kind)` / `reminderOwnerModuleLabel(module)` and the raw-identifier fallback;
   the app registers its map. Wire it through installFramework as an optional option, matching how
   notificationTypeMeta is threaded (installFramework.ts:15-17, 34, 46, 57).
   The registered values must be i18n keys or resolve through i18n — NOT literal strings. These are
   user-facing labels in an app with two locales, and baking literals into a TS map would make them
   untranslatable. Decide the shape (a map of identifier -> i18n key, most likely) and say why in a
   comment.

2. Move ReminderKindRow onto it. Replace the two computed lookups at lines 81-88. Keep the
   raw-identifier fallback exactly as it is — a newly added server-side kind must never render blank.
   The `i18n.te()` existence check may become the seam's job rather than the component's; put it
   wherever it is not duplicated.

3. Delete the foreign labels from common.sk.ts and register this app's real ones. To find them, look
   at what the backend actually returns from GET /reminder-preference — do not guess from module
   names in src/core/. If the list is empty on your account (the screen's empty state at
   ReminderKindList.vue:17-26 says "you have not customised any kind yet", so an untouched account
   shows nothing), find the kinds another way: check what the notification types in
   src/app/notifications/notificationTypeMeta.ts imply, and register those. If you genuinely cannot
   determine the set, register nothing, leave the fallback to do its job, and SAY SO in your final
   report — an empty correct map beats a map of invented identifiers.

4. Put the app-side map where this app's other registrations live: src/app/notifications/ already
   holds notificationTypeMeta.ts and is exactly the right neighbour. Add the locale strings to
   src/locales/common.sk.ts (the APP's file, not the framework's) with matching EN in
   common.en.ts — this app does have an EN file, unlike the framework. See N11 for that larger gap;
   do not try to fix it here.

5. Update SETUP.md's registration list (§5 and the table around line 326) and _common/README.md's
   list of install hooks, both of which enumerate the seams.

Do NOT: change the reminderPreference DTOs, change what the server is asked for, or touch
QuietHoursCard (N10 owns it).

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural: open /nastavenia/pripomienky. Any kind the server returns renders a human label if it is
registered, and its raw identifier if it is not — never blank, never a Slovak HR term. Switch the
locale and the labels follow, which is the check that step 1's "keys not literals" rule was actually
honoured. Grep src/_common for the three deleted keys to confirm nothing else referenced them.
```
