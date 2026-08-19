# U1 · The user is read before it is ever loaded ⭐

- **Scope:** `../../../src/core/user`, `../../../src/router.ts`, five delete call sites across four modules
- **Backend:** none
- **Framework:** yes — you will write `framework/F3-hydrate-on-login.md` at the end
- **Model / effort:** Opus 5, high effort
- **Run this first.** U2–U5 and the whole P series assume the preferences actually arrive.

---

```
This is a live bug with a destructive consequence, not a cleanup. Read the whole prompt before
editing anything.

THE DEFECT

`hydrateFromServer()` — the only thing that ever fetches the signed-in user's preferences — is
called from exactly one place in the entire app:

    src/_common/modules/user/view/UserSettingsView.vue:40
        onMounted(() => userStore.hydrateFromServer())

`userStore.login(email)` (LoginVerifyQrCode.vue:63, LoginView.vue:154,190) sets `isAuthenticated`
and the e-mail, and nothing else. So between logging in and visiting /user/settings, the store holds
`new User()` — constructor defaults for theme/locale/timezone, and for the two augmented fields
(`src/core/user/dto/userAugmentation.ts`) literally nothing, because interface merging declares a
type and cannot create a value.

`askBeforeDelete` is therefore `undefined`, and every read site is written as a negation:

    src/core/todoList/view/TodoListsView.vue:315
    src/core/todoList/composable/useTodoListCategories.ts:66
    src/core/dayPlanner/view/TemplateListView.vue:507
    src/core/dayPlanner/component/DayPlanner.vue:92
    src/core/historyDashboard/component/HistoryTimeline.vue:170

        if (!userStore.currentUser.askBeforeDelete) {
            await deleteConfirmed()      // deletes immediately, no dialog
        } else {
            deleteDialog.value = true
        }

`!undefined` is true. A user who has just signed in on a new device, or in a new browser profile, or
after `logout()` (which resets to `new User()`), gets NO delete confirmation anywhere in the app —
lists, categories, plan templates, planner entries, history entries. The preference reads as "don't
ask" precisely when the app knows least about the user.

The store persists to localStorage, so once someone opens settings the value sticks on that device
and the bug goes quiet. That is why it has survived.

Note: the comment at `userAugmentation.ts:5` says "six call sites". Grep finds five reads plus the
settings switch. Confirm the count yourself and correct the comment to whatever is true.

THE CONSTRAINT

The store, the login views and `UserSettingsView` are all in `src/_common`, which must not be edited
(see CLAUDE.md). Fix this from the app side. Do not fork the store.

WHAT TO DO

1. HYDRATE FROM THE APP'S OWN BOOTSTRAP.
   `src/router.ts` is app-owned and already has the guard that knows whether the user is signed in:

       router.beforeEach(to => {
           ...
           if (to.meta.public === true) return true
           const auth = useAuth()
           if (!auth.isAuthenticated) return { name: 'login' }

   Add `src/core/user/composable/useUserHydration.ts` exporting an idempotent
   `ensureUserHydrated(): Promise<void>` that calls `useUserStore().hydrateFromServer()` at most once
   per authenticated session. It must:
     - hold a module-scope in-flight promise so concurrent navigations share one request, never two;
     - reset that flag when `isAuthenticated` goes false, so the next user on the device re-fetches;
     - never reject into the guard — a failed hydrate must not strand the user on a blank screen.
       Swallow it (the axios interceptor already shows the snackbar) and allow a retry on the next
       navigation rather than latching "hydrated" on a failure.

   Make the guard `async` and `await ensureUserHydrated()` after the `isAuthenticated` check. Watch
   the ordering against `hideFullScreenLoading()` at the top of the guard — do not reintroduce a
   stranded overlay. If awaiting inside the guard visibly delays the first paint, hydrate without
   awaiting and instead make step 2 safe against a not-yet-arrived value; say in your summary which
   you chose and why.

   `UserSettingsView`'s own `onMounted` hydrate stays (it is framework code); your call must be cheap
   enough that the duplicate does not matter, or must dedupe it. It will not — different mounts — so
   just confirm the settings page still shows fresh values.

2. MAKE THE READ SITES SAFE ANYWAY.
   Hydration timing must not be the only thing standing between a user and an unconfirmed delete.
   Add to `src/core/user/composable/useUserPreferences.ts` a composable returning the app's
   preferences with explicit, SAFE defaults — `askBeforeDelete` defaults to **true**, not false, so
   an absent value asks rather than deletes. Repoint all five call sites to it. The negation pattern
   goes away with them: read `if (askBeforeDelete.value) { open dialog } else { delete }`.

   Do the same for `firstDayOfWeek` (default 1 / Monday) while you are here — it has the mirror-image
   problem, see `useRoutineWeeklyReview.ts:17`, which already writes `?? 1` and thereby contradicts
   its own non-optional `0 | 1` declaration.

3. FIX THE TYPES SO THEY STOP LYING.
   `userAugmentation.ts` declares both fields as non-optional on `User`. They are absent on a fresh
   `new User()`, so that declaration is false and it is what let the five call sites be written the
   unsafe way. Make them optional (`askBeforeDelete?: boolean`, `firstDayOfWeek?: 0 | 1`) on the
   RESPONSE side, so TypeScript forces every consumer through the defaulted composable from step 2.
   The request side is already optional and stays that way. Update the file's header comment: it
   currently claims `firstDayOfWeek` "feeds the planner calendar", which is false — the planner
   calendar is `_common/component/calendar/CalendarGrid.vue` and it is hardcoded to ISO weeks via
   `getISOWeekStart` (lines 208, 225, 267). The only live consumer is `useRoutineWeeklyReview.ts`.

VERIFY

Run `npm run type-check` (baseline is 72 app-side errors — do not exceed it) and `npm run lint`
(must stay at 0 errors).

Then verify by hand, because this is exactly the class of bug that ships when nobody opens the page:
  - clear localStorage, log in, go straight to a todo list and delete it → the confirm dialog MUST
    appear;
  - turn the preference off in settings, delete something → no dialog;
  - log out and back in as the same user → the preference survives, still no dialog;
  - throttle the network and navigate → no stranded loading overlay, no double /user/data request.

THEN WRITE THE FRAMEWORK ASK

The app-side guard is a workaround: hydration belongs in the framework's own login path, next to
`login()`, so every consuming app gets it. Write `prompts/user/framework/F3-hydrate-on-login.md`
following the format in `prompts/user/framework/README.md`, and add the matching entry under
"Still open" in `migration-revision.md`. State the user-visible consequence (unconfirmed deletes),
name the local file you kept, and say what gets deleted once the framework lands it.
```
