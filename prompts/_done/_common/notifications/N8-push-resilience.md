# N8 · Web Push dies silently and nothing notices

- **Scope:** `../../../../public/sw-push.js`, `src/_common/modules/notifications/composable/UsePushNotifications.ts`,
  `api/PushNotificationsApi.ts`, `src/_common/modules/user/component/settings/SecuritySection.vue`
- **Backend:** **yes** — re-registration semantics. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** N2 (moves `initPushSupport` behind auth)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. public/sw-push.js is app-owned and normal. At the end,
list the files under src/_common you touched.

Four defects in the Web Push path. The first is the one that matters.

1. No `pushsubscriptionchange` handler. THIS IS THE REAL BUG.
   public/sw-push.js registers exactly two listeners: 'push' (line 1) and 'notificationclick'
   (line 16). Browsers rotate push subscriptions on their own schedule — Chrome does it, and it also
   happens after certain permission/storage events. When it happens, the endpoint stored server-side
   becomes dead, the browser fires `pushsubscriptionchange` in the service worker, and nothing here
   listens. Push then stops working, permanently and silently, for a user whose settings UI still
   says it is enabled: SecuritySection.vue:35-42 renders the switch from `isSubscribed`, which
   UsePushNotifications.ts:93-94 computes from `registration.pushManager.getSubscription() !== null`
   — and after a rotation that returns the NEW subscription, so the switch reads "on" while the server
   holds the old dead endpoint.
   Add the handler. It must re-subscribe with the same VAPID key and register the new endpoint with
   the server, telling the server which endpoint it replaces so the dead one is not left behind. Note
   the constraint that makes this awkward and think it through: a service worker has no access to the
   app's axios instance, no i18n, and possibly no auth context — sw-push.js is plain ES5-style script
   loaded via workbox importScripts (vite.config.ts:108). Decide how it authenticates the
   re-registration call and say so in a comment. If it cannot authenticate at all, the fallback is to
   have the SW post a message to any open client and have the app do the call — implement that
   fallback honestly, and note in the ask that it does not cover the "no tab open" case.

2. `notificationclick` focuses the wrong tab.
   sw-push.js:19-30. `url` defaults to '/' and the match is `client.url.includes(url)` — with '/'
   that matches EVERY open tab of the app, so the first client in the list gets focused and the user
   is not navigated anywhere. Match properly: compare pathnames, prefer an exact match, fall back to
   an open client that you then navigate (`client.navigate(url)`) rather than merely focusing, and
   only openWindow when there is no client. Handle the `url` being a full URL vs a path — the server
   sends it and the current code does not care which.

3. Silent failures in the subscribe path. UsePushNotifications.ts:
   - line 34-37: a missing VITE_VAPID_PUBLIC_KEY console.errors and returns false. SecuritySection
     then shows a generic "could not enable" snackbar. A misconfigured deployment is
     indistinguishable from a user denying permission.
   - line 42-43: `permission !== 'granted'` returns false with no distinction between 'denied' just
     now and 'denied' permanently at the browser level. The locale file already has separate strings
     for exactly this — notifications.pushBlocked, notifications.permissionDenied,
     notifications.pushUnsupported at common.sk.ts:280-282 — and nothing uses them (N1 flags all
     twelve as dead).
   Make subscribe() return a discriminated result rather than a boolean, and have SecuritySection
   show the right message per case. Use the existing locale keys; that is what they were written for.
   Keep the signature change contained — SecuritySection is the only caller, but it is in the user
   module, so check for others before changing it.

4. Unsubscribe ordering. UsePushNotifications.ts:79-80 calls the server first, then
   `subscription.unsubscribe()`. If the browser call fails, the server believes the device is
   unsubscribed while the browser still holds a live subscription — the user keeps getting push with
   the switch off. Decide which failure is worse and order accordingly, then handle the other case
   explicitly rather than leaving it to luck. Write the reasoning in a comment; this is a genuine
   trade-off, not an oversight to silently flip.

While you are in here, check but do NOT fix without saying so: `subscribe()` re-registers the
endpoint with the server on every call even when `getSubscription()` already returned one
(line 45-59). That is probably correct — it is how a user who signed in on a second account re-binds
the device — but it is undocumented. Add the comment.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.
npx vite build — this one matters here, because sw-push.js is pulled in by workbox importScripts
(vite.config.ts:107-108) and a syntax error in it will not show up in type-check or lint. Confirm
dist/sw.js and dist/workbox-*.js are produced. A chunk-size warning over 500 kB is expected.

Behavioural, in Chrome DevTools > Application > Service Workers:
- enable push in settings; confirm POST /push-subscription fires with a real endpoint
- use the "Push" test field in DevTools to send a payload; the OS notification appears with the right
  title, body and icon
- click it with the app open in two tabs: the tab showing the target page is focused, or one tab is
  navigated to it — not "whichever tab was first"
- click it with no tab open: a window opens on the target
- force a subscription change (unsubscribe via the console while the SW is alive, or use the
  DevTools SW controls) and confirm the re-registration path runs
- with notifications blocked at the browser level, toggle the switch: the message says blocked, not a
  generic failure

--- After the frontend work is done: write the backend ask, IF you found one ---

Step 1 is very likely to produce one. The client needs to replace a rotated subscription, and
`POST /push-subscription` (PushNotificationsApi.ts:11-13) takes a payload with no notion of "this
replaces that". Describe the browser event and what the client can and cannot supply at that moment
— in particular whether it can authenticate from inside the service worker, which is the crux — and
let the backend choose between making the existing endpoint idempotent-by-endpoint, taking an old
endpoint to retire, or something else. Say explicitly what happens today: dead endpoints accumulate
server-side forever and the user silently stops receiving push.

Also worth asking if you hit it: the push payload contract. sw-push.js:4-11 reads title, body, icon
and url off `event.data.json()` with defaults for all four, which means nobody wrote down which are
guaranteed. If N5 landed, its deep-link question and this one may be the same ask — check
prompts/_common/notifications/backend/ before writing a second file.

Read prompts/_common/notifications/backend/README.md for the format and scope rules, including the
shared-endpoint rule. Write to prompts/_common/notifications/backend/Bn-<slug>.md.
```
