# N7 · Stop snackbarring every notification, and collapse the repeats

- **Scope:** `src/_common/modules/notifications/composable/useNotifications.ts`,
  `component/NotificationBell.vue`, `src/_common/_locales/common.sk.ts`
- **Backend:** possibly — whether digests are already grouped server-side. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** N2 (lifecycle), N5 (resolved route, for the snackbar action)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. At the end, list the files under src/_common you
touched.

Every notification that arrives over the hub pops a snackbar. Unconditionally.

  useNotifications.ts:40-41
    const message = notification.body ? `${notification.title} — ${notification.body}` : notification.title
    showSnackbar(message, { color: 'primary' })

There is no throttle, no coalescing, no severity distinction, and no check of context. Concretely:

- A `ReminderDigest` fan-out, or a batch of `RoutinePeriodEndingSoon` at a period boundary, produces
  one snackbar per item. The snackbar host renders one at a time, so they queue and the user watches
  a slideshow — or, worse, they replace each other and only the last is ever seen.
- A snackbar fires while the bell dropdown is already open, showing the same item the user is
  looking at.
- A snackbar fires while the user is already on the page the notification links to.
- `ScheduledJobFailed` and `PersonalReminder` get identical treatment. The typeMeta map already
  records a colour per type (src/app/notifications/notificationTypeMeta.ts) and the snackbar ignores
  it, hardcoding `color: 'primary'`.
- Title and body are concatenated with an em dash into one line, so a long body truncates the title.

Also, the same repetition problem exists in the list itself: five RoutinePeriodEndingSoon rows in a
row are five near-identical entries in a 60vh dropdown.

Do this:

1. Decide when a snackbar is warranted, and write the rule down as a comment before you implement
   it. My starting position, which you should push back on if the code says otherwise:
   - never when the bell menu is open (the user is already looking)
   - never when the current route is the notification's resolved target (N5's resolver gives you
     this; compare against router.currentRoute)
   - never for a burst — see 2
   - always for high-severity types
   Severity is not currently a field. Derive it from the registered typeMeta colour ('error' /
   'warning' vs the rest) rather than inventing a parallel map — the app already expresses this
   opinion there. If that turns out to be too coarse, say so and propose the field in the escalation
   block rather than adding a second app-registered map.

2. Coalesce bursts. Buffer arrivals over a short window (a second or two) and emit at most one
   snackbar per window. When the window caught more than one, show a count instead of a message —
   "3 nové notifikácie" — with a plural-correct SK string. NOTE: Slovak has three plural categories
   and this repo configures a custom pluralRules for exactly that (src/i18n.ts:9-14). Write the
   message with `one | few | many` forms; a two-form message will render "5 notifikácie".

3. Make the snackbar actionable. A snackbar that says something happened and then vanishes is worse
   than the bell badge, which persists. Give it an action that opens the target (N5's resolver) or
   the bell. Check useSnackbar's config shape in
   _common/composable/general/SnackbarComposable.ts before assuming it supports an action — if it
   does not, do NOT extend the snackbar system as a side effect of this prompt; note it and fall back
   to a non-actionable snackbar with the correct colour.

4. Group in the list. Consecutive unread notifications of the same type within the same day collapse
   into one row: the type's icon, a count, the most recent title, expandable to the individual items.
   Constraints: the collapsed row must count correctly toward unreadCount; expanding must not mark
   anything read; a group of one must render exactly as a plain row does today (no visual special
   case for the common path). Use v-auto-animate for the expand — it is registered globally and
   CLAUDE.md asks for it over custom transitions.

5. Do not throttle the LIST update. Only the snackbar is throttled. An arriving notification must
   still land in `notifications` and bump the badge immediately.

Do not: change the bell's loading/error states (N4), add paging (N3), or build the full page (N6). If
N6 has landed, the grouping from step 4 should be shared with it rather than written twice — put it
in a composable or a component both surfaces use.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural — you will need to trigger several notifications quickly. The `Test` type exists in
src/app/notifications/notificationTypeMeta.ts:22, which suggests there is a way to fire one; find it,
and if there is not, drive `handleIncoming` directly from the console.
- fire five at once: ONE snackbar, with a correct Slovak plural count, and five items in the bell
- fire one with the bell menu open: no snackbar, item appears in the list
- fire one whose target is the current route: no snackbar
- fire a ScheduledJobFailed: snackbar in the error colour, not primary
- fire five of one type: one collapsed row in the list, badge counts five, expanding shows five

--- After the frontend work is done: write the backend ask, IF you found one ---

Two candidates, only if you actually hit them:

The digest question. `ReminderDigest` exists as a type (src/app/notifications/notificationTypeMeta.ts:11),
which implies the server ALREADY has a notion of collapsing several reminders into one. If it does,
step 4's client-side grouping may be duplicating server work, or worse, grouping things the server
deliberately kept separate. Ask what a digest contains and when the server chooses to send one
instead of N notifications — the answer might delete step 4 entirely, which is a good outcome.

Severity. If step 1's colour-derived severity proved too coarse, ask for severity as a first-class
field on the notification, and say what the client currently guesses and where it guesses wrong.

Read prompts/_common/notifications/backend/README.md for the format and scope rules. Write to
prompts/_common/notifications/backend/Bn-<slug>.md.
```
