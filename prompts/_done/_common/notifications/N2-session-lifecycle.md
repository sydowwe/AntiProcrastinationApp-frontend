# N2 · Bind the hub and the module state to the session, not to a component

- **Scope:** `src/_common/modules/notifications/composable/useNotifications.ts`,
  `composable/UsePushNotifications.ts`, `component/NotificationBell.vue`, `../../../../src/App.vue`; read-only on `src/_common/modules/user/store/authStore.ts`
- **Backend:** possibly — hub auth failure mode; see the escalation block
- **Model / effort:** Opus 5, high
- **Depends on:** N1 (touches the same functions)
- **Unblocks:** N3, N4, N6

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. Do NOT fork files into src/, do NOT substitute a
migration-revision.md entry for a fix. At the end, list the files under src/_common you touched.

The notifications module's real-time state is owned by the wrong thing. Three consequences, all
live:

(a) The hub connects while signed out.
    NotificationBell is mounted unconditionally in App.vue:5 (inside Navbar's #actions slot), and it
    calls connect() from onMounted — NotificationBell.vue:107. So on /prihlasenie and every other
    public route, a SignalR handshake goes to {VITE_API_URL}/hubs/notifications with no auth cookie,
    fails, and logs "Notification hub connection failed:". Every page load, for every signed-out
    visitor. Confirm this yourself first: open the login page with the console open.

(b) The state survives a user switch.
    useNotifications.ts:9-11 holds notifications / isConnected / isLoading as module-level refs —
    one instance for the life of the tab. authStore.logout() (modules/user/store/authStore.ts:35-38)
    resets currentUser and isAuthenticated and nothing else. disconnect() does clear the list
    (useNotifications.ts:104) but it only runs from the bell's onUnmounted, and the bell never
    unmounts because it lives in App.vue. Sign out, sign in as a different user without a hard
    reload: the previous user's notifications are still on screen, and the hub is still holding the
    previous session's connection.
    usePushNotifications has the same shape — isSupported / isSubscribed / permission at
    UsePushNotifications.ts:13-15, module-level, never reset.

(c) Reconnection gives up permanently and silently.
    useNotifications.ts:70 uses withAutomaticReconnect() with no argument. The default policy retries
    at 0s, 2s, 10s, 30s and then stops forever. A laptop that sleeps for a minute comes back to a
    permanently dead bell for the rest of the session. onclose sets isConnected = false
    (line 79-81); isConnected is exported and read by nobody.

Do this:

1. Give the composable a real lifecycle. Add an exported `reset()` that stops the connection, clears
   notifications, clears the error ref from N1, and returns every module-level ref to its initial
   value — everything that would be wrong for a different user. disconnect() should become a thin
   wrapper over it, or reset() should call disconnect(); pick one and make the other not duplicate
   the teardown.

2. Drive connect/disconnect off authentication, not off component mount. Read
   useUserStore().isAuthenticated and watch it: true -> connect(), false -> reset(). Put that watcher
   somewhere it lives for the life of the app and cannot die with a component — a module-level
   `startNotificationSession(userStore)` called once from installFramework, or a watcher created
   inside the composable's module scope, are both defensible; choose and say why in a comment.
   NOTE the trap this is guarding against: there is an identical bug in this app's src/core/home/
   composable/useTodayPlan.ts, where a `wired` boolean guard creates a watcher inside whichever
   component called first, so the watcher dies with that component while the guard stays true. Do not
   reproduce that shape.
   Remove onMounted(connect) / onUnmounted(disconnect) from NotificationBell.vue:107-108 once the
   session owns it. The bell becomes a pure view over the composable.

3. Hide the bell when signed out. Even with the hub correctly idle, a bell with a permanently empty
   dropdown on the login page is noise. Guard it in App.vue on userStore.isAuthenticated.

4. Reconnect properly. Pass an explicit IRetryPolicy to withAutomaticReconnect that keeps retrying
   with a bounded backoff (cap the interval; do not cap the attempt count) instead of surrendering
   after ~30s. Also register connection.onreconnecting to set isConnected = false, so a consumer can
   tell "reconnecting" from "connected". Keep the existing onreconnected -> loadNotifications()
   refresh: a reconnect means missed pushes. Do not build the reconnecting UI — N4 owns that and will
   read isConnected.

5. Reset push state on sign-out too. isSubscribed and permission are properties of the browser+user
   pair, not the browser alone. App.vue:34-37 also calls initPushSupport() at setup, before anyone is
   authenticated — it registers the service worker and probes the existing subscription for a visitor
   who may never sign in. Move that behind authentication as well. Be careful: registerServiceWorker
   is also what makes _common/utils/notifications.ts showNotification() work, so check whether any
   signed-out surface depends on the SW being registered early before you move it. If one does, say
   so and split the SW registration from the subscription probe rather than moving both.

Constraints:
- Do not introduce a Pinia store for this. The module-level-refs decision is deliberate and
  documented in docs/modules/notifications.md; the defect is the missing lifecycle, not the storage.
- Do not add polling as a hub fallback here. If you think it is needed, note it — N3 is where a
  fetch-based path already exists to hang it off.
- The framework serves other apps. Anything you add to installFramework must be optional and must
  not change behaviour for an app that does not opt in.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core. Any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural, all four in the browser with the console open:
1. Load /prihlasenie signed out. No hub handshake in the network tab, no "Notification hub connection
   failed" in the console, no bell in the top bar.
2. Sign in. The hub connects once, notifications load once.
3. Sign out, then sign in as a different user WITHOUT reloading. The bell is empty at sign-out and
   shows only the second user's notifications after.
4. With the app open and signed in, stop the backend for two minutes, then start it. The bell
   reconnects on its own and reloads the list. This is the one that fails today.

--- After the frontend work is done: write the backend ask, IF you found one ---

While doing (1) you will see exactly how the hub rejects an unauthenticated handshake. If it does
something other than fail cleanly — hangs, retries server-side, returns a 200 and then closes, or
logs noisily server-side per attempt — that is worth a backend ask, because the client can only stop
attempting; it cannot make a bad rejection cheap. Likewise if the hub does NOT reject an
unauthenticated connection at all, that is a security finding and must be written up.

Only write it if you actually observed something. Read prompts/_common/notifications/backend/README.md
for the format and scope rules, and write to prompts/_common/notifications/backend/Bn-<slug>.md. Note
the extra rule there about shared-endpoint changes: this hub is framework surface used by more than
one app.
```
