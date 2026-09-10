# Finish the e2e wiring now that `POST /api/test/seed` exists

Hand this to a fresh session. **Sonnet 5, high effort.** It needs a browser for the second half.

Context: the backend's e2e seed endpoint has landed and the client side is wired up but not green. This
finishes it. `CLAUDE.md` auto-loads. Windows — use the **PowerShell tool**, never Bash.

---

## Environment

- Dev server `https://localhost:3000` (this exact origin — the session cookie is bound to it).
- API `https://localhost:8080`. **It must point at a LOCAL Postgres** or the seed route is not registered.
  When the gate is closed, the API's authorization `FallbackPolicy` answers **401** on unmatched paths, so a
  401 from global setup means "not enabled here", never "log in first". `e2e/global-setup.ts` explains this in
  its error message. Confirmed working at the time of writing: `POST /api/test/seed` → 200.
- Backend reference for the fixture: `docs/e2eTestSeed.md` in the API repo.

## What is already done — do not redo

| File | State |
| --- | --- |
| `e2e/playwright.config.ts` | `API_URL` → `https://localhost:8080`; `webServer.ignoreHTTPSErrors: true`. **Verified** — the readiness probe passes instead of stalling to timeout. |
| `e2e/global-setup.ts` | Posts `/api/test/seed`, clears `.state/`, writes the response to `.state/seed.json`, and gives a dedicated 401 diagnostic. **Verified** — seeds successfully. |
| `e2e/fixtures/seed.ts` | *(new)* Typed `SeedResponse`, `readSeed()`, `seedDateParam(seed, offset)` → `dd-MM-yyyy`. |
| `e2e/fixtures/auth.ts` | Fixtures `seed`, `authenticatedPage`, `secondaryPage`. Credentials come from the seed response. Auth storage state lives in `.state/auth-<userId>.json`. |
| `e2e/.gitignore` | *(new)* `.state/`, `playwright/`, `test-results/`, `playwright-report/`. |
| `e2e/tests/todo-lists.spec.ts` | Renamed from `.draft.spec.ts`. **Not yet green** — see below. |

**Why auth state moved into `.state/`:** the seed wipes every account, so a storage state cached from a
previous run points at a dead user id and every guarded route silently bounces to `/login`. `globalSetup`
clears `.state/` right after seeding, so the cache can never outlive the reset that invalidates it. Keep that
property.

## Task 1 — the login-locale problem, and the decision already made

The last run failed in the auth fixture: `getByLabel('Email')` found nothing.

**Root cause:** the login screen always renders in **Slovak**, whatever the account's locale. `src/i18n.ts`
sets `locale: 'SK'`, and the user's preference is only applied *after* a successful sign-in (`LoginView.vue`
sets `i18n.locale` from the response; `App.vue:82` from `currentUser.locale`). Seeding the account as `EN` does
not help, because nothing has signed in yet.

**The owner's decision: change the app's default locale to English.** Do it in this order — the flip alone is
not safe.

1. **Mirror the `authorization` namespace into English first.** It exists *only* in
   `src/_common/_locales/common.sk.ts` — **lines 486–547, 49 keys** — and is absent from both
   `src/_common/_locales/common.en.ts` and `src/locales/common.en.ts`. Since `fallbackLocale` is already `EN`,
   flipping the default without this gives **no fallback at all**: the login, registration, forgotten-password
   and both confirm-email screens would render raw keys (`authorization.email`, `authorization.logIn`, …).
   Mirror it into **`src/locales/common.en.ts`** (the app-side mirror), which is the remedy `CLAUDE.md`
   prescribes for this exact class — it has happened three times before (`validation`, `general.undoSuccess`,
   `calendar`; R5/R6/R11 in `migration-revision.md`). Do **not** edit the submodule for this.
2. **Then** set `locale: 'EN'` in `src/i18n.ts`.
3. **Then** walk the five signed-out screens in the browser and confirm no raw keys and no
   `[intlify] Not found` console warnings. That check is the point of the exercise; do not skip it.

Two things to be aware of and to state in your report:
- This changes what a real **signed-out** user sees — the auth screens become English by default. Signed-in
  users are unaffected, since their preference still wins. `CLAUDE.md` says "SK is primary, EN is the
  fallback", so this diverges from a documented convention deliberately. If the mirror turns out to be more
  than a mechanical translation, stop and ask rather than inventing product copy.
- `e2e/fixtures/auth.ts` currently uses **structural** locators for the login form
  (`form input[type="text"]`, `input[type="password"]`, `button[type="submit"]`) rather than labels. **Keep
  them.** They are locale-independent and cost nothing; the locale flip is wanted for its own sake, not as the
  fix for this fixture. Do not convert them back to `getByLabel`.

## Task 2 — get `todo-lists.spec.ts` green

Run **one test first**, not the file:

```
npx playwright test tests/todo-lists.spec.ts -g "shows the categories panel" --reporter=list
```

Then the whole file. Its assertions were written during a browser pass against the *old* seed, so some may now
be wrong — six overdue items and six calibration items did not exist before, and both change what a list
renders. When a test fails, decide which it is:

- **locator wrong** → fix the locator
- **behaviour genuinely wrong** → file it in `docs/views/todo-lists/findings.md` in that file's existing
  format (`Status:` / `Verify:` fields are mandatory — read a neighbouring entry first) and downgrade the
  assertion to `test.fixme()`

Do not delete a failing assertion without deciding which of the two it is.

## Task 3 — specs for the surfaces that could never render before

Each of these was fully implemented but had no data behind it. Now it does. Written from the seed's own ids and
counts, never `new Date()` and never hardcoded ids where the fixture supplies them.

**Drive each screen in the browser before writing its assertions.** None of these have ever been observed, so
there are no known-good locators for any of them — this is the whole reason this task needs a browser and not
just the source.

| Surface | Seed handle | Notes |
| --- | --- | --- |
| Estimate-vs-actual chip | `todoListItems.withEstimate`, `withEstimateAndSteps` | 6 items carry a non-zero `suggestedTime`; each activity has 3 history rows straddling the estimate |
| Header calibration ratio | `counts.calibrationTodoListItems` (6) | Gated on **`MIN_COMPARABLE_ITEMS = 5`** (`src/core/todoList/composable/useEstimateCalibration.ts:14`). Completing one leaves exactly 5 — at the threshold, no margin |
| Overdue renegotiation banner | `counts.overdueTodoListItems` (6) | **`RENEGOTIATE_THRESHOLD = 3`** (`src/core/todoList/composable/useOverdueRenegotiation.ts:13`) — six is comfortably over. Cover "Today", "In a week" and "Review one by one" |
| Multi-count counter mid-progress | `todoListItems.multiCountPartial` | 2 of 5, not done. **Also settles finding U2** (a click on a 0/2 counter did nothing) — if the click works here, say so in `findings.md` |
| Planner empty state | `seedDateParam(seed, 2)` | 3 tasks on `seedDateUtc`, 2 on +1, **none on +2**, 2 on +3. The calendar row for +2 exists — this is a real empty state, not a missing-day error |
| Empty to-do list | `todoLists.empty` | Deliberately has no items |
| Activity lifecycle | `activities.archived` / `notDeletable` / `deletable` | Archived is hidden from pickers but still named on rows referencing it; `notDeletable` should report `canDelete: false`; `deletable` is the contrast case |
| Leisure profiles | `profiles.backlog` / `bucketList` / `project` / `memoryAnchor` | The anchor is on the bucket-list activity, so "close the loop" is exercised |
| Per-account isolation | `secondaryPage` fixture | Sign in as primary, pin/dismiss something, then as secondary; confirm nothing followed. This is the Phase 3 **X2** check — see `prompts/view-docs/README.md` |

**EN strings already confirmed**, for assertions (`src/core/todoList/_locales/todoList.en.ts`):

- `` `{count} tasks have a date that has passed. Pick a new one when you're ready.` ``
- `` `Today` `` / `` `In a week` `` / `` `Review one by one` ``
- `` `Moved {count} tasks to today` `` / `` `Moved {count} tasks to a week from today` ``
- `` `You usually spend {time} on this` ``
- `` `Your estimates run about {ratio}x actual time` ``
- `` `You can only focus on {limit} tasks at once — unmark one first` `` (settles the focus-cap `fixme`)

## Rules

- **Do not call `/api/test/seed` per test.** It is a full reset (~1.5–2 s) and wipes every account including
  the root admin. One call in `globalSetup`, as designed. It is idempotent.
- **`testpass123` does not satisfy the app's own registration policy** (10 chars, uppercase, digit,
  non-alphanumeric). The seeder writes the hash directly, so sign-in works — but that account cannot be
  recreated through the sign-up form. No spec may try to register it.
- **Derive dates from `seed.seedDateUtc`** via `seedDateParam()`, never `new Date()`. A run straddling midnight
  UTC would otherwise flake.
- **If a spec needs data the fixture lacks, do not create it per-test.** Note it for the report — the fixture
  gets extended instead. Per-test creation is the polluted-state problem the seed endpoint replaced.
- Keep the structural/semantic split: assert what is true by observation; `test.fixme()` anything whose
  *correctness* a human still has to judge.

## Report back with

1. Whether the whole of `todo-lists.spec.ts` passes, and any assertion you converted to `fixme` with the reason.
2. Whether the `authorization` EN mirror was mechanical, and whether the five signed-out screens are clean of
   raw keys after the locale flip.
3. Whether six overdue items trips the renegotiation banner in practice (the threshold is 3, so it should).
4. Anything the fixture is missing for the specs you wrote.
5. Any new findings filed, by unit and id.
