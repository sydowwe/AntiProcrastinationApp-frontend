# N13 · The module map documents code that no longer exists

- **Scope:** `src/_common/docs/modules/notifications.md`
- **Backend:** —
- **Model / effort:** Sonnet 5, low
- **Depends on:** nothing — but this is the LAST prompt to run; every other one changes what it documents
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/docs/modules/notifications.md in place. At the end, confirm that is the only file you
touched.

Run this LAST. Every other prompt in prompts/_common/notifications/ changes something this file
describes; regenerating it before they land guarantees doing it twice. Check which of N1–N12 have
landed (git log on src/_common/modules/notifications/) before you start, and document the code as it
IS, not as any prompt said it would be.

docs/modules/notifications.md is dated "2026-06-23 at commit 33ec20a; updated 2026-08-07" and has
drifted. The ones I confirmed by reading the code:

- Line 45 lists `updateNotificationPreference` as a function of api/NotificationApi.ts with a
  "⚠️ unused" marker and a `PUT /notification-preference` route. That function does not exist. The
  file has exactly two exports: fetchMyNotifications and markNotificationRead.
- Line 54 documents `NotificationPreferencePayload` as an interface in api/NotificationApi.ts. Gone.
- Line 53 documents a `NotificationChannel` type alias in dto/NotificationResponse.ts. Gone.
- Line 52 says NotificationResponse has `fromJson` + `listFromJsonList`. The method is
  `listFromObjects`. It also says the DTO "does not extend IdResponse" — it implements IIdResponse,
  which is a different and more useful fact.
- Line 79 lists `PUT /notification-preference` under "assumed backend endpoints" as a dead export.
  With the export gone, the entry is doubly stale.
- Line 86 lists as an open issue: "Relative timestamp formatting is hardcoded to `sk` and doesn't
  refresh while the menu is open (see review findings #1, #3)." Both are fixed —
  NotificationBell.vue:115-124 recomputes off useCurrentTime and reads locale.value. There is even a
  comment explaining it. The doc is telling readers a solved problem is open.
- Line 27-29 gives QuietHoursCard the props `modelValue: QuietHoursWindow | null` and emits
  "save/clear"; the real signature is a `window` prop and an `updated` emit (QuietHoursCard.vue:114,
  116). ReminderKindList is documented as `kinds` / "changed"; it is `preferences` / `updated`.
  ReminderKindRow likewise.

Do this:

1. Verify every row of every table against the code, not just the ones above. I read the module once;
   treat my list as a starting point and a calibration of how stale the file is, not as exhaustive.
   The tables to check are Routes & Views, Components (props and emits especially — three of four
   were wrong), Composables, API composables & endpoints, DTOs, Depends on, and Assumed backend
   endpoints.

2. Fix the "Open questions / TODOs" section, which is where a stale doc does the most damage. Remove
   what is fixed. For what remains, say what is actually still open as of the code in front of you —
   which after N1–N12 may be very little, or may be a set of pending backend asks. If
   prompts/_common/notifications/backend/ has files in it, reference them by filename: a reader
   wanting to know why the client works around something should find the ask from here.

3. Update the header line: regenerate the date and the commit, following the format already there.

4. Fill in "Changed since last map" (line 89-90), which currently says "_First map — no prior
   version._" and is now wrong twice over. Summarise what changed, briefly — this is what makes the
   next regeneration cheap.

5. Check the sibling docs for the same drift where they touch this module, and fix only the
   notification-related lines: docs/utils.md:85-87 (the notificationTypeMeta relocation note),
   docs/composables.md:89 (the same for the two composables), README.md:53 and SETUP.md §5 / the hook
   table at line 326 (setNotificationTypeMeta's shape — N5 and N9 both change what is registrable).
   Do not audit those files generally; they are outside this prompt.

Do not change any code. If you find a discrepancy where the CODE is wrong and the doc is right, do
not fix the code — note it in your final report. The doc follows the code, always: CLAUDE.md is
explicit that when a doc and src/_common disagree, the code wins.

--- Verification ---

There is nothing to type-check. Instead, verify by reading: for every claim in the file, open the
file it describes and confirm it. State in your final report how many rows you corrected and how many
you confirmed unchanged — a regeneration that reports only corrections has not been checked.

npm run lint anyway (0 errors), to catch nothing having been touched by accident.
```
