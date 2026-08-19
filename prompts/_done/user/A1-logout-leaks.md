# A1 · Logging out leaves the previous user's data on the screen

- **Scope:** `../../../src/core/user`, `../../../src/App.vue` or `../../../src/router.ts`, every `store/` under `../../../src/core`
- **Backend:** none
- **Framework:** none — `logout()` is framework code, so this hooks it from the app side
- **Model / effort:** Sonnet 5, medium effort
- **Related:** P4 (the same keys, from the "should this be on the server" angle). Either order works.

---

```
`logout()` — `_common/modules/user/store/authStore.ts:35-38` — does exactly two things:

    currentUser.value = new User()
    isAuthenticated.value = false

Nothing else in the app is told. Every other Pinia store keeps its contents, and every localStorage
key survives. On a shared browser, the next person to sign in sees the previous user's state.

WHAT SURVIVES A LOGOUT TODAY — verify each, then extend the list:

    localStorage (survives the browser closing too)
        core/home/store/plannerStreakStore.ts:65        a streak belonging to the previous user
        core/todoList/store/routineReviewStore.ts:21    which week their review was dismissed for
        core/dayPlanner/view/TemplateListView.vue:335   PINNED_KEY — pinned template ids
        core/dayPlanner/composable/useTemplateCardDragAndDrop.ts:28  TEMPLATE_ORDER_KEY
        core/activityTracking/view/{Desktop,Android}SettingsView.vue  two HINT_KEYs
        src/App.vue:56                                  'theme'
    sessionStorage (survives a logout in the same tab, which is the case that matters)
        core/dayPlanner/store/{dayPlannerStore,templateDayPlannerStore,dayPlannerSettingsStore}.ts
        plus every other app store, since CLAUDE.md says sessionStorage is the Pinia default here

The planner stores are the sharp end: `dayPlannerStore` persists to sessionStorage, so signing out and
signing in as someone else in the same tab can render the previous user's plan until something
refetches. Confirm whether it actually does before writing that in your summary — `persist:
{ omit: ['tasks'] }` on `templateDayPlannerStore.ts:60` suggests someone already thought about this
for one store and not the others.

The ids are the reason this is not merely untidy: a stale store holding entity ids from user A, in a
session authenticated as user B, is a request waiting to be sent for a row B does not own. The server
will reject it — but the frontend should not be sending it.

WHAT TO DO

1. ONE PLACE THAT KNOWS HOW TO RESET THE APP.
   Add `src/core/user/composable/useSessionReset.ts` exporting `resetAppState()`, which clears every
   app-owned store and every app-owned storage key. Prefer Pinia's `$reset` where the store supports
   it; setup stores need an explicit reset function, so add one to the stores that lack it (that is a
   small, mechanical edit in each store's own module and is in scope).

   It must clear the framework's stores too where the app owns the data in them — but it MUST NOT
   reimplement `logout()`. Call the store's `logout()`, then reset everything else.

2. HOOK IT WITHOUT EDITING `_common`.
   `logout()` is called from the framework's `UserMenu`, from `SecuritySection` on e-mail change and
   account deletion (lines 148, 153), and from the app's auth adapter (`src/core/user/
   authAdapter.ts:22`). Only the last is yours.

   Do not chase the call sites. Watch the state instead: a `watch` on `useUserStore().isAuthenticated`
   transitioning true → false, registered once during app setup (`src/App.vue` already has two
   watchers of this kind and is the natural home). That catches every path including the interceptor's
   401 handling, which no call-site patch would.

   Route the adapter's `logout()` through the same helper so the two agree.

   Check the axios interceptor in `@/_common/axiosConfig.ts` first: if a 401 already forces a logout
   or a redirect, your watcher must not fight it, and you should confirm the ordering by hand.

3. DECIDE WHAT SURVIVES ON PURPOSE.
   Not everything should be cleared. `'theme'` is arguably a device preference and clearing it makes
   the login screen flash the wrong colour scheme; the framework's top bar reads that key directly
   (`App.vue:53-56` explains why it is seeded). Keep it, and comment why.

   For everything you keep, write the reason at the declaration. For everything you clear, no comment
   is needed — that is the default and should be.

4. STATE THE LIMIT HONESTLY.
   This does not make the app safe on a shared computer, and your summary should say so rather than
   implying it does. Anything already rendered stays in memory until navigation, `sessionStorage` is
   per-tab so a second tab is untouched, and the browser's back button can still show a cached view.
   Clearing state on logout is the floor, not the ceiling.

Run `npm run type-check` and `npm run lint`. Verify by hand, in one tab without closing it: sign in as
A, open the planner and pin a template, sign out, sign in as B. B must see none of A's state anywhere
— planner, pinned templates, streak, dismissed review. Then sign back in as A and confirm A's
server-side data returns intact; a reset that also deletes the user's real data is a worse bug than
the one you are fixing.
```
