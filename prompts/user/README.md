# User module prompts

Improvements to `src/core/user/`, one self-contained prompt per file. Each is written to be pasted
into a fresh session in this repo — `CLAUDE.md` auto-loads there, so the prompts carry only
task-specific facts (file paths, line numbers, the actual code) rather than restating conventions.

Three series. **U** is health: seven files, ~250 lines, and one of them ships a live bug that skips
delete confirmations. **P** is the preference surface, which barely exists. **A** is account
lifecycle — what happens at logout and at deletion.

## The premise

`src/core/user/` is the smallest module in `src/core/` and the only one with no `_locales/`, no
`api/` and no `composable/`. That is by design: the alignment migration moved the auth views, the
store and the user APIs into `_common/modules/user/` (`migration-revision.md` R4), leaving this
module as glue — an auth adapter, a DTO augmentation, a settings wrapper and three settings cards.

The glue turned out to be where the defects are. Because the module is a thin layer over a framework
module, nobody owns the seam: the framework assumes the host app hydrates the user, the app assumes
the framework does, and nothing does. Two of the three cards contain placeholder content that ships.
The app's own strings live inside the submodule. The one app preference that exists is read five times
and set once; the other one cannot be set at all.

**Nothing in this series edits `src/_common`.** Every finding that lands there goes to
`framework/` as an ask plus a `migration-revision.md` entry — see the note below.

## Index

| #  | Prompt                                                             | Kind        | Backend | Framework | Model      | Effort   |
|----|--------------------------------------------------------------------|-------------|---------|-----------|------------|----------|
| U1 | [Hydrate before anything reads ⭐](U1-hydrate-before-read.md)       | health      | —       | writes F3 | **Opus 5** | high     |
| U2 | [Give the module a shape](U2-module-shape-and-locales.md)          | health      | —       | —         | Sonnet 5   | medium   |
| U3 | [Export util + double snackbars](U3-export-and-snackbars.md)       | health      | maybe   | —         | Sonnet 5   | low      |
| U4 | [The About card's placeholders](U4-about-honesty.md)               | health      | —       | —         | Sonnet 5   | low      |
| U5 | [Legal pages, with real copy](U5-legal-pages.md)                   | health      | —       | —         | **Opus 5** | med–high |
| P1 | [Two settings systems ⭐](P1-two-settings-systems.md)               | preferences | likely  | —         | **Opus 5** | high     |
| P2 | [`firstDayOfWeek` has no control](P2-first-day-of-week.md)         | preferences | likely  | writes F  | Sonnet 5   | medium   |
| P3 | [Delete confirmation granularity](P3-delete-confirmation-granularity.md) | preferences | likely | —    | **Opus 5** | high     |
| P4 | [State that never leaves the device](P4-device-local-state.md)     | preferences | yes     | —         | **Opus 5** | high     |
| A1 | [Logout leaks the previous user](A1-logout-leaks.md)               | account     | —       | —         | Sonnet 5   | medium   |
| A2 | [Deletion is a cliff](A2-deletion-cliff.md)                        | account     | likely  | writes F  | Sonnet 5   | medium   |

Plus two framework asks that no prompt will reach, written up front:
[F1 — 2FA recovery codes are discarded ⭐](framework/F1-2fa-recovery-codes.md) and
[F2 — the timezone setting does nothing](framework/F2-timezone-preference.md).
[F3 — signing in does not fetch the user](framework/F3-hydrate-on-login.md) was written by U1, as
planned.

## The state of things

Every item is verified and located, not suspected.

**The live bug (U1).** `hydrateFromServer()` is called from exactly one place in the app —
`_common/modules/user/view/UserSettingsView.vue:40`, in a view's `onMounted`. `login()` does not
hydrate. `askBeforeDelete` is an augmented field, so it is absent from `new User()` entirely, and
all five read sites are written as `if (!currentUser.askBeforeDelete) → delete immediately`
(`TodoListsView.vue:315`, `useTodoListCategories.ts:66`, `TemplateListView.vue:507`,
`DayPlanner.vue:92`, `HistoryTimeline.vue:170`). A user who has just signed in on a new device gets
no delete confirmation anywhere until they happen to open settings. The store persists to
localStorage, which is why it goes quiet afterwards and why nobody has noticed.

**The rest of it.**

- `AboutSection.vue:18-19` links to `/legal/terms` and `/legal/privacy`. Neither route exists, and
  both are plain `<a href>` in an SPA — a full reload into a 404.
- `AboutSection.vue:28` falls back to app version `'0.0.0'`, and hardcodes the support address.
- `DataExportSection.vue:29-45` hand-rolls a blob download that `_common/utils/fileDownload.ts`
  already does correctly, and discards whatever filename the server sent.
- `PreferencesSection.vue:33` calls `handleHttpCodes` on top of the interceptor's own error snackbar
   — `App.vue:77` documents that the interceptor already covers it.
- The app's own settings strings live in the **submodule's** locale file
  (`_common/modules/user/_locales/user.sk.ts:120-145`), and the shallow spread at `SK.ts:38` means
  the app cannot simply add its own `user` namespace without deleting ~140 framework keys.
- `firstDayOfWeek` is declared, typed and localized, and no control anywhere sets it. Its one live
  consumer writes `?? 1`, contradicting its own non-optional `0 | 1` type. The comment claiming it
  "feeds the planner calendar" is false — `CalendarGrid.vue` is hardcoded to ISO weeks.
- The app has **two** per-user preference systems: `/user/preferences` (3 framework fields + 2 app
  fields) and the day planner's own settings endpoint (9 fields, its own store, its own settings
  page at `DayPlannerSettingsView.vue`). Neither knows the other exists.
- Seven pieces of per-user state live only in the browser — the planner streak, the routine-review
  dismissal, pinned templates, template ordering, two hint dismissals, the theme cache — none of them
  namespaced by user, none cleared on logout.
- `logout()` resets the user store and nothing else.

## Suggested order

**U1 first, alone.** Everything else in the series assumes preferences actually arrive, and P3 in
particular is unimplementable before it — you would be tuning a preference that is not being read.

Then **U2 → (U3 ∥ U4) → U5** for the rest of health. U2 creates the locale files and the section
shell that U3, U4, U5 and A2 all build on. U4 and U5 both edit `AboutSection.vue`; run U4 first or
accept the conflict.

Then **P1**, which decides where preferences live, before **P2 ∥ P3 ∥ P4** — all three add or move
preferences and need P1's rule to know which system owns them.

**A1 and A2 are independent** of the P series and of each other, and can run any time after U2. A1
overlaps P4's inventory; whichever runs second should read the other's summary rather than re-deriving
the list.

## Backend and framework asks

Neither is pre-written, with two deliberate exceptions.

**Backend** follows the standing convention: `backend/` starts empty, `backend/README.md` holds the
format and the scope rules, and the agent implementing a frontend prompt writes the ask after doing
everything that stands on its own. The .NET solution is not in this repo, so anything past the
contract is a guess dressed as a spec.

**Framework** is different, and the reasoning is in `framework/README.md`: `src/_common` *is* checked
out here, so a gap can be verified with file and line numbers exactly like an app-side one. The split
is about who will encounter it. F3 (hydration belongs on the login path) is left to U1's implementer
because U1 walks straight into it; P2 and A2 likewise each write one. **F1 and F2 are pre-written
because no prompt in this series touches the code they concern** — if they are not written here they
are never written.

F1 is the most severe finding in the review and it is not in `src/core/` at all: pressing "new
recovery codes" invalidates the user's existing 2FA recovery codes and then silently discards the new
ones (`SecuritySection.vue:190-196`, `// TODO: display recovery codes to user`). The button looks
like it failed. The user is one lost authenticator away from being locked out.

Every framework ask also needs a bullet under **"Still open"** in `migration-revision.md`. The ask
file is the detail; that index is what the next session actually reads.

## How the model calls were made

**Opus 5, high effort** — U1, P1, P3, P4. All four share a property: the code is small and the
judgment is load-bearing. U1 changes the router guard and five destructive code paths at once, and
the failure mode is either a stranded loading overlay or a delete that still does not confirm. P1 is
a module-boundary decision that CLAUDE.md's cross-module import rule can make illegal if read
carelessly. P3 is choosing what a confirmation dialog is *for*, and its default is the difference
between an annoyance and data loss. P4 is a triage where the wrong answer is "move everything to the
server", which buys six endpoints nobody needed.

**Opus 5, medium–high** — U5, for one reason: it has to produce real Slovak legal prose and an
honest survey of what this app collects, and window-title capture makes a hand-waved privacy policy a
genuine liability rather than a cosmetic one.

**Sonnet 5, low–medium** — U2, U3, U4, P2, A1, A2. Located defects, mechanical moves, or work against
a pattern that already exists in the repo (`downloadBlob` for U3, `AppearanceSection`'s toggle for
P2, `App.vue`'s existing watchers for A1). U3 and U4 are genuinely low: two small files each.

**Nothing here is a Haiku job.** U2 and U5 need real Slovak, and every other prompt touches either a
destructive path, a shared component, or a surface where a plausible-but-wrong result is expensive to
detect.

Bump effort if a run comes back shallow — U2 and A1 are the likeliest, since both depend on reading
existing behaviour correctly before writing anything (U2's locale merge, A1's persist configuration
across six stores).

## Deliberately excluded

- **Anything that edits `src/_common`.** Non-negotiable; see the top of `framework/README.md`.
- **Framework cosmetics.** The three framework settings sections duplicate the same `VCard` shell,
  and `AppearanceSection` (74, 84, 92) and `SessionsSection` (112, 125, 139) both double up the error
  snackbar the axios interceptor already shows. Both are real, neither is worth a framework turn.
- **A local `SettingsSection` upstreamed to the framework.** U2 creates one for this app's three
  cards. Proposing the framework adopt it would cost more backlog than three lines of markup cost the
  app.
- **A configurable work-day window.** `DayPlannerWidget.vue:386-392` derives the day strip's start and
  end from the earliest and latest task, which is a reasonable answer for a day that has tasks and no
  answer at all for an empty one. A `dayStart` / `dayEnd` preference is a plausible improvement, but
  it belongs to a `home` or `dayPlanner` prompt with the widget in front of it, not to a settings
  page. Revisit if P1's boundary rule makes it obviously cross-cutting.
- **Roles and permissions.** `src/core/user/authAdapter.ts:33-41` returns constant `true` from all
  three role getters, deliberately and with a comment explaining why. This is a single-user app.
  Leave it.
- **Touching the auth views.** Login, registration, forgotten password and both e-mail confirmations
  are framework-owned and were reviewed only for gaps that reach this module. If they need work, that
  is a framework series, not this one.
