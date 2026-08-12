# R7 · The admin gate is written twice per view, in four views

- **Scope:** `src/_common/modules/reminders/view/{ReminderDefinitionsView,ReminderDefinitionDetailView,ReminderUpcomingView,ReminderDispatchHistoryView,ReminderOverviewView}.vue`, `reminders.routes.ts`
- **Backend:** —
- **Model / effort:** Sonnet 5, low
- **Depends on:** R5 (touches the same script blocks), R2 (touches the same template branches on two views)
- **Unblocks:** nothing

---

```
Five reminders views state the same authorization rule twice, and in this app one of the two statements
is unreachable. Reduce it to one statement — carefully, because this is framework code and the app it
currently runs in is not the only consumer it has to survive.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; do not fork into src/ and do not add a
migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end. Commit
and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the surrounding style
by hand.

--- What is there now ---

reminders.routes.ts declares `meta: { requiredRole: 'admin' }` on five of the six routes (everything
except `myReminders`, correctly).

And then four views ALSO wrap their entire template in `v-if="isAdmin"` with a hand-rolled fallback:

    ReminderDefinitionsView.vue:6 + 121-126
    ReminderUpcomingView.vue:6 + 171-176
    ReminderDispatchHistoryView.vue:6 + 151-156
    ReminderOverviewView.vue:6 + 153-158
    ReminderDefinitionDetailView.vue:6 + 262-267

each with:

    <VCard v-else class="pa-6 text-center">
        <p class="text-error">{{ $t('general.forbidden') }}</p>
    </VCard>

plus `const isAdmin = computed(() => auth.isAdminRole())` and a `useAuth()` import. ReminderOverviewView
goes further and guards its fetch on it too (line 178).

In THIS app that card is unreachable: src/core/user/authAdapter.ts returns a constant `true` for
isAdminRole (this app has no role model), so `requiredRole` is a no-op and `isAdmin` is always true. But
that is this app's adapter, not the framework's contract — another host app can and will return false.

So the question is not "is the card dead code". It is "which layer owns this rule".

--- Do this ---

1. **Decide, and write the decision down.** The route guard runs before the component mounts and can
   redirect; the in-view card renders a dead-end page the user must navigate away from themselves. The
   route meta is already there, already covers all five, and is the mechanism framework modules are
   expected to carry (CLAUDE.md: "requiredRole?: RequiredRole — carried by framework modules"). That
   argues for the guard being the single gate and the in-view check being redundant defence.

   Before you act on that, verify the guard actually enforces it: read src/router.ts and find where
   `requiredRole` is checked. **If nothing reads it, the in-view card is the ONLY real gate and deleting
   it removes the module's authorization entirely.** In that case stop, do not delete anything, and
   report what you found — that is a much bigger finding than this prompt, and it belongs to the router,
   not to reminders.

2. If the guard does enforce it: remove the duplicated `v-if="isAdmin"` wrapper, the fallback card, the
   `isAdmin` computed and the now-unused `useAuth` import from all five views. Leave a one-line comment
   at the top of reminders.routes.ts stating that authorization for this module lives in route meta and
   deliberately not in the components, so it stops being re-added.

3. Either way, fix ReminderOverviewView.vue:178 — `if (!isAdmin.value || loading.value) return` silently
   returns from `load()`, which means a non-admin (in a host app where that is possible) gets the blank
   page described in R2 rather than a refusal. If the gate moves to the route, that check simply goes.

4. Do not delete the `general.forbidden` locale key. Grep first — it is a framework-wide key and other
   modules likely use it.

--- The thing to be careful about ---

Deleting a security check because it is unreachable in the app you happen to be looking at is exactly the
kind of change that is correct four times and catastrophic the fifth. The whole justification here is
that a stricter check sits in front of it. If you cannot confirm that check exists and fires, do not make
this change — report instead. Nobody will mind a prompt that comes back with "the premise was wrong".

--- Verification ---

npm run type-check — baseline 72 errors, all app-side in src/core; any src/_common error is yours.
npm run lint stays at 0.

Then, since isAdminRole is constant true here, you cannot test the negative path through the UI directly.
Temporarily flip src/core/user/authAdapter.ts's isAdminRole to return false, confirm all five admin
routes refuse (redirect or refusal page — whichever the router guard does) while /pripomienky/moje still
works, then **revert the adapter**. Say in your final message that you did this and that you reverted it.

Confirm too that the five views still render normally with the adapter restored, and that the nav entries
in src/app/nav/navItems.ts:73-76 behave the same as before.
```
