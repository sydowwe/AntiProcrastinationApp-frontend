# N1 · Correctness sweep

- **Scope:** `src/_common/modules/notifications/composable/useNotifications.ts`,
  `component/NotificationBell.vue`, `dto/NotificationResponse.ts`, `src/_common/_locales/common.sk.ts`
- **Backend:** —
- **Model / effort:** Sonnet 5, medium
- **Depends on:** nothing
- **Unblocks:** everything — run this first

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. Do NOT fork files into src/, do NOT substitute a
migration-revision.md entry for a fix. The submodule commit is the owner's job — at the end, list
the files under src/_common you touched.

Fix six confirmed defects in the notifications module. They are small and independent; none of them
requires a design decision. Do not restructure anything — later prompts (N2 session lifecycle, N3
paging, N4 bell states) own the bigger changes and will conflict if you pre-empt them.

1. Failures render as empty successes.
   useNotifications.ts:19-28 — loadNotifications() catches and console.errors. The bell then shows
   the "Žiadne notifikácie" empty state, which is indistinguishable from a real empty inbox.
   Add an `error` ref to the composable's module state, set it on failure, clear it on success, and
   export it. Do NOT build the error UI — N4 owns the bell's states and will read this ref. Just make
   the failure observable instead of console-only.
   Same for markRead (line 44) and markAllRead: keep the optimistic revert, but surface the failure
   through useSnackbar's showErrorSnackbar rather than console.error alone. The user just clicked
   something; silence is wrong.

2. markRead's revert restores a guessed value, not the previous one.
   useNotifications.ts:49-54 sets `notification.isRead = true`, and on failure sets it to `false`.
   It already early-returns when isRead is true (line 46), so today that happens to be right — but it
   is right by coincidence, not construction. Capture the prior value before the optimistic write and
   restore that.

3. connect() lies to a concurrent second caller.
   useNotifications.ts:64 — `if (connection !== null) return`. `connection` is assigned synchronously
   at line 66, before `await connection.start()` at line 84, so a second caller arriving during the
   handshake returns immediately with isConnected still false and no notifications loaded. Hold the
   in-flight promise in a module-level variable and have concurrent callers await it, the way
   _common/utils/serviceWorker.ts:16-24 already does for registerServiceWorker(). Match that pattern
   — including its "allow a later retry instead of caching the failure permanently" behaviour.

4. NotificationResponse.fromJson ignores the DTO convention.
   dto/NotificationResponse.ts:13-15 positionally passes six raw json.* values. CLAUDE.md requires
   destructuring with defaults. A missing `body` currently becomes `undefined` rather than the ''
   the constructor default promises, which is what defect 5 renders. Rewrite fromJson with
   destructuring defaults matching the constructor defaults. Do not change the field list — N5 owns
   adding fields.

5. Body-less notifications render an empty second line.
   NotificationBell.vue:66-67 renders VListItemSubtitle unconditionally inside `lines="two"`, so a
   title-only notification (ScheduledJobFailed, for instance) reserves and shows a blank row. Render
   the subtitle only when body is non-empty, and set `lines` accordingly per item.

6. Twelve dead locale keys.
   _common/_locales/common.sk.ts:275-290 — settingsTitle, enablePush, pushEnabled, pushSubscribed,
   pushUnsubscribed, pushBlocked, pushUnsupported, permissionDenied, enableError, preferences,
   channel.{InApp,WebPush}, enableNotificationsInWindows. I grepped src/ for all of them: zero call
   sites. SecuritySection.vue uses user.pushNotifications* instead.
   DO NOT DELETE THEM YET. They are the intended vocabulary for the notification-settings screen that
   prompt N12 builds. Instead: verify the grep yourself (they are framework keys, so also check
   nothing else in src/_common references them), and add a single comment above the block in
   common.sk.ts recording that they are currently unreferenced and reserved for N12. If N12 has
   already landed when you run this, ignore this item entirely.

Also do NOT touch: the `unshift` ordering assumption in handleIncoming (N3 and N6 both need to decide
ordering against a real paging contract, and fixing it here in isolation would be a guess), the
connect/disconnect lifecycle (N2), or the snackbar on every incoming notification (N7).

--- Verification ---

npm run type-check — the honest baseline is 72 errors, ALL of them app-side in src/core. src/_common
is clean, so ANY error reported under src/_common is a regression you introduced, not baseline noise.
npm run lint — 0 errors.

Then in the browser, signed in: open the bell. Notifications list. Click an unread one — it greys and
persists across a reload. Stop the backend and reload: the bell must no longer claim the inbox is
empty (it will still look wrong until N4 — you are only checking the `error` ref flips, which you can
confirm from Vue devtools or a temporary log you then remove).
```
