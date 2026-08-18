# B5 · Backend ask — per-user state that currently exists only in one browser

**Contract only.** Nothing below implies a table, a column, or where any of this is stored.

Two items, batched, from `P4`'s triage. The frontend work that could be done without you is already
done: every surviving key is now namespaced by account (`src/core/user/composable/useUserScopedStorage.ts`),
so two people sharing a browser no longer overwrite each other. That fixes the embarrassing half. It
does not make any of this follow a user to a second device, which is what this ask is for.

## The problem

Per-user state written to `localStorage` and nowhere else. A user who signs in on a laptop gets a
different app from the one on their desktop, and nothing tells them why.

Two items survived triage. The rest are listed at the bottom so you can see they were considered.

---

## 1. Pinned day-plan templates

**What it is.** `src/core/dayPlanner/view/TemplateListView.vue:341` — a set of
`TaskPlannerDayTemplate` ids the user has pinned to the top of the template list.

**What breaks today.** A user pins their three real templates on the laptop. On the desktop the list
is unsorted and nothing is pinned, so they pin them again; the two devices now disagree permanently,
and neither is wrong. The templates themselves are server-owned rows the user already sees on both
devices — only the user's judgement about *which of them matter* is stranded.

**Which system owns it,** per `P1`'s rule (CLAUDE.md, "Where a preference lives"): the module's own
settings, **not** `/user/preferences`. The value is a set of foreign keys to `dayPlanner` entities; a
pinned-template id cannot be meaningful to any other module, and rule 3 names exactly this case.

**The shape the frontend needs.** Pinned-ness as a property of the template as the caller sees it —
e.g. a boolean on `TaskPlannerDayTemplate` in whatever `fetchAll` already returns
(`src/core/dayPlanner/api/taskPlannerDayTemplateApi.ts`), plus a way to set it for one template. The
list view already reloads templates after every mutation, so it needs no separate read.

A separate "list of pinned ids" endpoint would also work but is worse for us: the view would have to
join it against the templates it just fetched, and a pinned id whose template was deleted becomes
our problem instead of yours.

Hot? No. One fetch per visit to the template list, and one write per pin click.

**What changes on the frontend.** `PINNED_KEY`, the `readUserScoped`/`writeUserScoped` pair around
it, and the `TODO(B5)` at that line all go. `pinnedTemplates` reads the flag off the template.

---

## 2. The weekly routine review dismissal

**What it is.** `src/core/todoList/store/routineReviewStore.ts` — the ISO date of the week-start for
which the user last dismissed the "fresh start" routine review card.

**What breaks today.** The user dismisses the card on Monday on their laptop. It is waiting for them
on the desktop, and again on their phone, in the same week — three dismissals for one decision. This
is the item where the local storage is most clearly just wrong: the thing being remembered is *"I
have already dealt with this week"*, which is a fact about the person and the week, not about a
browser.

**Which system owns it.** Rule 2 — it describes the person, and the "have I already been shown this"
shape is the same one `reminderPreference` already models for notifications. If you conclude it
belongs with reminder preferences rather than as a `todoList` setting, that is your call; the client
does not care which endpoint answers, only that the answer is the same on every device.

**The shape the frontend needs.** One nullable date (the week-start the user last dismissed), read
wherever the todo-list module already loads its per-user settings, and a write when the user
dismisses. The comparison against "the current week" is done client-side against the user's
`firstDayOfWeek` and must stay there — the client is the only side that knows which week the user is
currently looking at.

**One rule worth pinning down:** is a dismissal for the *week*, or until the routines change? Today
it is the week, purely because that was the easy thing to store. If the intent is "don't nag me until
something actually changes", the value should not be a date at all, and the client is guessing.

**What changes on the frontend.** `routineReviewStore.ts` stops being persisted and becomes a plain
read of the module's settings; its `persist` block and the `TODO(B5)` go with it.

---

## Considered and deliberately not asked for

- **The planner completion streak.** Already done — `plannerStreakStore` no longer exists;
  `src/core/dayPlanner/dto/response/PlannerStreak.ts` is server-computed via
  `prompts/home/backend/B1-planner-streak.md`. `P4`'s inventory was written before that landed and
  calls this the strongest case; it was, and it is closed. **No action.**
- **Leisure suggestion history** (`src/core/leisure/composable/suggestionHistory.ts`). Genuinely
  per-user and genuinely stranded per-device, but the ask already exists as
  `prompts/leisure/backend/D1-backend.md` and re-asking it here would cost a turn and return nothing.
  Only the account-scoping was applied. **Deferred to D1.**
- **Template card ordering** (`src/core/dayPlanner/composable/useTemplateCardDragAndDrop.ts`).
  Device-local on purpose: it is how cards are arranged on *this* screen, and a phone's order is not a
  laptop's. Unlike pinning, there is no user-visible loss when it differs per device.
- **Both onboarding hint dismissals** (`DesktopSettingsView.vue`, `AndroidSettingsView.vue`). The
  weakest case on the list. A hint reappearing once on a new device costs two seconds; that does not
  buy an endpoint. Stating that explicitly is the outcome.
- **`localStorage['theme']`** (`src/App.vue:56`). Not a source of truth — a deliberate cache of the
  server-side preference, seeded so the framework top bar does not override it on load.
- **`sessionStorage` state** (the planner clipboard in `dayPlannerStore.ts` /
  `templateDayPlannerStore.ts`, and `homeUiStore`). Per-tab by design and correct as-is. Note that
  `sessionStorage` survives a sign-out within the same tab, so a clipboard can outlive the session
  that filled it — that is `A1`'s territory, not yours.
