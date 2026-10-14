# C2 · Rewards waiting for you — make an earned reward outlive its snackbar

- **Scope:** `todoList` (normal list) × `leisure` (via its `api/` + `dto/` only) × `home`
- **Backend:** likely. A to-do item carries no completion time and nothing records a reward being taken. See the escalation block.
- **Model / effort:** Opus 5.5, high. The failure mode is building a pile of unclaimed rewards, which is a guilt list with a nicer icon.
- **Research:** Milkman, Minson & Volpp (2014), *temptation bundling*, the basis of N5 (`prompts/_done/todo-motivation/N5-temptation-bundling.md`). The mechanism
  only works if the want-to is **tied** to the should-do. A reward the user forgets they earned does nothing for the next task.

---

```
N5 shipped temptation bundling: a normal to-do item can be paired with a leisure backlog activity,
and ticking the item off offers that activity as an earned reward. The offer is an 8-second
snackbar. If the user is mid-flow, looks away, or ticks the item off from somewhere that is not
TodoListView, the reward is gone — nothing anywhere remembers it was earned. Your job is to give an
earned reward a place to wait, without making it an obligation.

Line numbers below are as of commit 5e6c4ab7 (2026-09-27). Verify each before relying on it.

--- What exists today ---

  - TodoListItemEntity.pairedLeisureActivityId (dto/response/TodoListItemEntity.ts:25): the paired
    backlog activity's id. A backlog profile's id IS its activityId (useLeisurePairing.ts:17).
  - useLeisurePairing.ts: module-scoped fetch of all backlog profiles, pairingFor(activityId). This
    is the sanctioned cross-module path (leisure api/ + dto/ only). Reuse it.
  - The pairing chip on each row (NormalTodoListItem.vue:57-68): "Waiting for you when this is
    done: X" on an open item, "Earned: X" on a done one.
  - The offer: TodoListView.vue:464-487 handleIsDoneChange → offerPairedLeisure. The snackbar has a
    "Start" action → startPairedLeisure (:493-504), which opens the log-time controller prefilled
    with the backlog profile's durationMinutes. NOTHING records that the user took it, dismissed it,
    or never saw it.
  - Other places an item gets ticked off WITHOUT the offer: the home TodoListWidget
    (src/core/home/component/TodoListWidget.vue, NormalTodoListItem rendered via
    fetchDashboardTodoListItems — GET todo-list-item/dashboard-widget), and any done-toggle that is
    not handleIsDoneChange in TodoListView. Find them all before designing.
  - Daily recap (useDailyRecap.ts, DailyRecapCard.vue, GET todo-list-item/daily-recap): what was
    finished today, but DailyRecapItem carries only { name, timeLoggedSeconds } — no item id, no
    pairing (dto/response/DailyRecap.ts).
  - Items have NO completion timestamp. `isDone` is a boolean.

--- The design question to settle first ---

"Rewards waiting" can mean two different things. Decide which one you build and say why in your report:

  1. EARNED, NOT YET TAKEN — items the user finished whose paired reward they have not started. This
     is the real gap: the per-row chip already covers "on offer", but "earned" dies with the snackbar.
  2. ON OFFER — open items that carry a reward, as a motivator ("finish X → Y"). The row chip already
     shows this inside one list. A cross-list view of it is a nice-to-have, not the gap.

Recommended: build (1). Then decide:

  - WHAT COUNTS AS "TAKEN". Options: the user pressed Start (the only signal the client has today);
    the leisure activity appears in activity history after the item was finished; the user dismissed
    it. Pick the one that is honest with the data available, and say what it gets wrong.
  - WHEN AN EARNED REWARD EXPIRES. This is the most important decision in the task. An earned reward
    that waits forever turns into debt: "4 rewards you never took" reads as four more things the user
    failed to do. Strong default: an earned reward lives until the end of the user's day (their
    timezone — see useUserClock / isoDateInUserZone, NOT new Date()) and then quietly disappears, no
    "missed" state, no counter of expired ones. If you choose differently, justify it against this.
  - WHERE IT LIVES. Home is the always-open tab and a composition layer allowed to render todoList
    components (see CLAUDE.md, home is the documented exception). The to-do list view has the daily
    recap card, which is thematically the right neighbour. One surface, not both — pick it.
  - WHERE THE OFFER IS MISSING. Ticking an item off from the home widget currently offers nothing.
    Decide whether the home tick should offer too, and if so, share one implementation with
    TodoListView rather than copying offerPairedLeisure.

--- Presentation ---

Compact. A reward is a small pleasant thing, not a task: no checkbox, no count badge in the nav, no
"overdue" styling ever. One tap on it does exactly what the snackbar's Start does (reuse
startPairedLeisure's behaviour, including the duration prefill). Offer a way to let it go ("Not
today") that removes it without guilt copy. Strings in todoList's locale files (SK primary), next to
toDoList.pairing.*; match their register ("Done — now {name}", "Earned: {name}").

Cross-module: todoList may import leisure's api/ and dto/ only. home may render todoList
components. Nothing may reach into leisure's component/, composable/ or store/.

--- The honest frontend-only fallback ---

Without a completion time or a "taken" record from the server, what you can build client-side is
limited to "earned in this browser, this session" — and per CLAUDE.md, any per-user localStorage
must go through useUserScopedStorage (readUserScoped/writeUserScoped). Decide whether that fallback
is worth shipping at all: a reward that shows on the laptop but not the phone may be worse than
none. If you ship it, make the scoping and the end-of-day expiry explicit, and leave a TODO(Bn) at
the store.

--- Do NOT ---
  - add points, streaks or a "rewards collected" tally (prompts/_done/todo-motivation/README.md,
    "Deliberately excluded" — Deci, Koestner & Ryan 1999);
  - add pairing to routine items (out of scope; N5 was normal-list only);
  - start the leisure activity automatically — the user always chooses.

--- Verification ---

npm run type-check (baseline 0, check the exit code) and npm run lint (the no-raw-text rule covers
templates only; grep your .ts files for hardcoded strings yourself).
playwright-cli, -s=c2, state-load → reload → state-save:
  - Pair an item with a backlog activity, tick it off, ignore the snackbar. The reward is waiting on
    the surface you chose. Start it from there: the timer opens prefilled; the reward is gone.
  - Tick another off from the OTHER surface (home vs list). The behaviour matches whatever you
    decided about the missing offer.
  - "Not today" removes it with no follow-up message.
  - Untick the item: its reward disappears (it is no longer earned).
  - Sign in as secondaryUser in the same browser: none of the first account's rewards appear.
  - Expiry: prove it with a unit test on the pure function that decides it (clock injected), not by
    waiting for midnight.
Clean up, or reseed.

--- After the frontend work is done: write the backend ask, IF you found one ---

The likely asks, only those you actually hit:
  - a completion instant on the to-do item (or on the done-toggle), so "earned today" is answerable
    across devices — state it in the user's-timezone terms the recap already uses;
  - a way to record that an earned reward was taken or dismissed, if your "taken" rule needs one;
  - DailyRecapItem carrying the item id and pairedLeisureActivityId, if the recap is your surface.
Check the API first (AdhdTimeOrganizer — search for the dashboard-widget and daily-recap endpoints,
and for how the to-do item's done state is written). If the history-based "taken" rule works with
what exists, do not ask for a claim record.

Write it to prompts/captured-data/backend/Bn-<slug>.md per prompts/captured-data/backend/README.md.
```
