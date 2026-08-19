# P4 · Seven pieces of per-user state that never leave the device

- **Scope:** audit across `../../../src/core`, then a decision recorded in `../../../src/core/user`
- **Backend:** yes, for whichever items survive the triage — you write the ask
- **Framework:** none
- **Model / effort:** Opus 5, high effort. The code is trivial; the triage is the work.
- **Depends on:** P1 (which system owns a preference). Related to A1, which deletes some of this on logout.

---

```
The app stores a surprising amount of per-user state in the browser and nowhere else. Each item was a
reasonable local decision; together they mean a user who signs in on their laptop gets a different
app than the one on their desktop, and nobody told them why.

THE INVENTORY — verify each before acting, line numbers drift:

    core/home/store/plannerStreakStore.ts:65          localStorage, un-namespaced by user.
        Its own header (line 7) says "There is no backend endpoint for this yet". A STREAK is the
        clearest case in the list: a number whose entire meaning is continuity over time, kept
        somewhere it cannot survive a new browser. `prompts/home/backend/README.md` already flags it,
        including that `revokeCompletedDay` is not a correct inverse of `registerCompletedDay`.
    core/todoList/store/routineReviewStore.ts:21      localStorage. Which week the fresh-start review
        was last dismissed for. Dismiss it on the laptop, it reappears on the desktop.
    core/dayPlanner/view/TemplateListView.vue:335     PINNED_KEY — pinned template ids.
    core/dayPlanner/composable/useTemplateCardDragAndDrop.ts:11,28   TEMPLATE_ORDER_KEY — manual
        template ordering per section. Both are curation the user performed on data the server owns.
    core/activityTracking/view/DesktopSettingsView.vue:86,90         HINT_KEY.
    core/activityTracking/view/AndroidSettingsView.vue:76,80         HINT_KEY (a second key).
        Dismissed onboarding hints.
    src/App.vue:56                                    localStorage 'theme', seeded to keep the
        framework's top bar from overriding the server preference. This one is a deliberate cache of
        a server value, not a local source of truth — do not "fix" it.

Run the grep yourself (`localStorage` under `src/core/`, plus `persist:` in every `store/`) and add
anything this list missed. Report the final inventory in your summary even for items you decide to
leave alone — the inventory is half the deliverable.

TRIAGE, ONE ITEM AT A TIME

For each, answer three questions in writing before touching code:

  1. Is it a PREFERENCE (the user chose it and expects it to follow them), a CACHE (the server is
     already the source of truth), or genuinely DEVICE-LOCAL (it describes this browser)?
  2. If it moved to the server, which system owns it — `/user/preferences` or the module's own
     settings endpoint? P1 wrote the rule; apply it, do not re-derive it.
  3. What breaks today because it is local? Answer with a user-visible consequence, not "it's
     inconsistent". If you cannot name one, the item stays where it is.

Expected outcomes, so you can calibrate — but verify rather than adopt these:
  - the streak is the strongest case for the server, and it is the one that is also currently WRONG
    on this device (the inverse-operation bug), so moving it fixes two things;
  - pinned templates and template order are per-user curation of server-owned rows, and belong with
    the templates rather than with user preferences;
  - the hint dismissals are the weakest case — a hint you already dismissed reappearing once on a new
    device costs the user two seconds. Moving them to the server is probably not worth an endpoint.
    Saying so explicitly is a valid outcome.

WHAT YOU CAN DO FROM THE FRONTEND RIGHT NOW

Nothing on this list can be moved to the server without a backend change, so do not fake it. What you
CAN do, and should:

  - Namespace every remaining localStorage key by user id, so at minimum the state does not bleed
    between two accounts on one browser. A1 covers clearing on logout; this covers the case where two
    users alternate. Add one small helper in `src/core/user/composable/` (a `userScopedKey(name)`)
    and route every surviving key through it. Handle the migration of existing un-namespaced keys —
    read the old key once, write the new one, delete the old. Losing a user's pinned templates to a
    key rename is a self-inflicted version of the bug you are fixing.
  - Where a piece of state is device-local ON PURPOSE, say so in a one-line comment at the
    declaration. Two of the files already do this well (`routineReviewStore.ts:6`,
    `plannerStreakStore.ts:7`); make the rest match.

THEN WRITE ONE BACKEND ASK, NOT SIX

Batch every item that survived triage into a single
`prompts/user/backend/B<n>-account-scoped-state.md`, per `prompts/user/backend/README.md`. One file,
one section per item, each with: what it is, what breaks today, the shape the frontend needs, and
which endpoint it should hang off. For the streak, the interesting part is not the endpoint — it is
the rules, and `prompts/home/backend/README.md` already lists the questions worth asking (does a
cancelled task break the day, does a day with no plan break the streak, are there grace days). Read
that file before writing yours so the two asks do not contradict each other.

Contract and business rules only. No tables, no columns, no migrations.

If triage kills everything — possible, if the streak ask turns out to be already covered by the home
series — write no backend file at all and say so. A duplicate ask wastes the backend agent's turn.

Run `npm run type-check` and `npm run lint`. Verify: log in as user A, pin a template, log out, log in
as user B, and confirm B sees no pinned templates and A's are still there when A returns.
```
