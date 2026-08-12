# N12 · Build the notification-settings screen the locale keys were written for — or delete them

- **Scope:** `src/_common/modules/notifications/` (new settings component + api + dto),
  `reminderPreference/view/ReminderPreferencesView.vue`, `src/_common/_locales/common.sk.ts`,
  `src/app/notifications/notificationTypeMeta.ts`
- **Backend:** **yes** — there is no per-type preference endpoint. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** N9 (the label seam this reuses), N5 (widened typeMeta)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. At the end, list the files under src/_common you
touched.

Twelve locale keys describe a screen that does not exist. common.sk.ts:275-290:

  settingsTitle, enablePush, pushEnabled, pushSubscribed, pushUnsubscribed, pushBlocked,
  pushUnsupported, permissionDenied, enableError, preferences, channel.{InApp,WebPush},
  enableNotificationsInWindows

I grepped src/ for every one: zero call sites. The push toggle that DOES exist
(SecuritySection.vue:34-42) uses `user.pushNotifications*` instead — a different set, in the user
module, because whoever built it did not find these. The module doc records the situation as an open
question: docs/modules/notifications.md:85 says "decide: build the settings screen or remove the dead
surface."

Decide it. Read this whole prompt before choosing, because the answer depends on step 1.

1. Establish whether per-TYPE preferences are even a coherent idea here. There are two axes in this
   system and they are not the same:
   - reminder KINDS, keyed by (ownerModule, kind), settable per user via
     PUT /reminder-preference/kind — the screen at /nastavenia/pripomienky
   - notification TYPES, the strings in src/app/notifications/notificationTypeMeta.ts
     (DeadlineApproaching, RoutinePeriodEndingSoon, ScheduledJobFailed, …) which come from a backend
     enum and drive only icons and routing
   Find out how they relate. Does a reminder kind produce a notification of a known type? Is the
   ownerModule/kind pair derivable from the type or vice versa? If they turn out to be the same axis
   under two names, the right outcome of this prompt is DELETING the dead keys and extending the
   existing reminder-preferences screen — not building a second settings surface that competes with
   it. That is a perfectly good result; report it and stop after step 4.

2. If they are genuinely distinct axes, build the screen. Requirements:
   - It belongs on the existing /nastavenia/pripomienky page as a third card, not a new route. The
     page is already titled "Predvoľby pripomienok" and a user looking for "which notifications do I
     get" will go there. Adding a second settings route for the adjacent question is how settings
     screens rot.
   - One row per registered notification type, sourced from the registered typeMeta map (the module
     already has the registry — utils/notificationTypeMeta.ts). Render the type's own icon and
     colour, which the map already carries; that is a free consistency win with the bell.
   - Labels come through N9's label seam, not from literals and not from the raw enum string. If N9
     has not landed, do that part of N9 first — do not build a third lookup mechanism.
   - Per row: on/off, and channel (in-app / push) if the backend supports the distinction.
   - The push master toggle. `enablePush` / `pushBlocked` / `pushUnsupported` / `permissionDenied`
     exist for exactly this, and there is already a working implementation of the flow in
     SecuritySection.vue:109-120 using usePushNotifications. Do NOT duplicate it. Either move it here
     and leave the security screen linking across, or leave it there and link from here — pick one,
     and say why. Two toggles for the same browser permission in two settings screens is worse than
     either.

3. Types with no rows. The map is app-registered and a type the server emits may be absent from it
   (the fallback at utils/notificationTypeMeta.ts:21 is a plain bell). A settings screen that lists
   only registered types silently hides the rest. Decide whether the row list comes from the client
   registry or from the server, and if it is the client registry, say in the UI that it is not
   exhaustive — or ask the server for the list, which is the better answer and belongs in the ask.

4. If you concluded in step 1 that the screen should not exist: delete all twelve keys from
   common.sk.ts (verify the grep yourself across src/, including src/_common), remove the stale
   "decide" bullet from docs/modules/notifications.md:85 — coordinate with N13 which rewrites that
   file — and record in your report what the reminder-preferences screen already covers that made the
   second screen redundant.

Styling: the two existing cards (QuietHoursCard, ReminderKindList) establish the visual language for
this page — VCard elevation="2" color="secondary", VCardItem with a prepend icon, title, wrapped
subtitle. Match it. Check the vuetify MCP for any component API you are unsure of.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

If you built the screen: toggling a type persists across a reload; a type toggled off stops producing
a bell entry (verify against a real notification, not a mock); the push master toggle reflects and
changes the actual browser permission; nothing in the security settings screen contradicts it.
If you deleted the keys: grep proves nothing referenced them, and both locales still load.

--- After the frontend work is done: write the backend ask, IF you found one ---

If you built the screen, you needed an endpoint that does not exist — there is no per-type preference
API (api/NotificationApi.ts has only fetchMyNotifications and markNotificationRead).

Lead the ask with step 1's finding, because that is the decision the backend has to make and the
frontend cannot: are reminder kinds and notification types one registry or two? If they are one, the
ask is "expose the existing reminder-preference registry keyed by type as well" and is small. If they
are two, describe the second registry the screen needs, and ask for the authoritative LIST of types
(step 3) — a settings screen built from a client-side map is guessing at its own row set.

Do NOT write this ask if you concluded in step 1 that the screen should not exist. An ask for an
endpoint nobody will call is worse than no ask.

Read prompts/_common/notifications/backend/README.md for the format and scope rules, including the
shared-endpoint rule. Write to prompts/_common/notifications/backend/Bn-<slug>.md.
```
