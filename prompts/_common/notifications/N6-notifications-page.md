# N6 · A real notifications inbox, not just a dropdown

- **Scope:** new `src/_common/modules/notifications/view/NotificationsView.vue` (+ any components it
  needs), `notifications.routes.ts`, `composable/useNotifications.ts`,
  `component/NotificationBell.vue`, `src/_common/_locales/common.sk.ts`,
  `src/app/nav/navItems.ts` or `_common/nav/UserMenu.vue`
- **Backend:** **yes** — dismiss/delete has no endpoint. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** N3 (paging), N5 (route resolution), N4 (state patterns to reuse)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Add files under
src/_common/modules/notifications/ in place. At the end, list the files under src/_common you
touched or added.

The bell dropdown is the ONLY notification surface. It is a VMenu capped at maxWidth 400 and
maxHeight 60vh (NotificationBell.vue:5, 45). There is no way to look back at what you dismissed, no
filter, no search, no way to delete anything, and after N3 caps the fetch there is no way to reach
older items at all. The module's one route today is the reminder-preferences page
(notifications.routes.ts:6-12) — the notifications themselves have no screen.

Build one.

1. The view. `NotificationsView.vue` under modules/notifications/view/. Add it to the exported
   notificationsRoutes table — do not self-register, follow the comment at notifications.routes.ts:4.
   Match the existing route's path convention (the module's routes are Slovak paths, and the app
   spreads them in src/router.ts). Reachable from: a "see all" footer row in the bell dropdown, and
   the user menu — _common/nav/UserMenu.vue:36 already links reminderPreferences, so that is the
   established place for a framework module's screen; put it next to that rather than inventing a
   nav slot.

2. What it shows, in priority order. Do not build all of these if the effort runs long — the first
   three are the point of the screen and the rest are polish:
   - the full list, paged, using the loadMore() N3 added; infinite scroll or an explicit button,
     your call, but the page must not refetch everything on every interaction
   - unread / all filter, and a type filter driven by the registered notificationTypeMeta keys
   - grouping by day with sticky-ish date headers — "Dnes", "Včera", then dates. There is a
     formatLocalized in _common/utils/DateTimeHelper.ts; use it rather than adding date formatting.
   - per-item actions: mark read, mark UNREAD (the bell has no way to undo a misclick today), and
     dismiss
   - bulk select + bulk mark-read / dismiss
   - click-through using N5's resolver, same behaviour as the bell

3. URL state. CLAUDE.md requires filterable state to live in query params. Filter, type and the
   unread toggle go in the URL. There is a useTableUrlState in _common/composable/table/ — read it
   before hand-rolling; if it fits, use it, and if it does not, say why in a comment.

4. Share the state, do not fork it. The page and the bell must show the same thing. Both read the
   same module-level refs from useNotifications — an item marked read on the page must grey out in
   the bell without a refetch. Resist adding a second store. If the page's needs (paging cursor,
   filters) do not fit the singleton, add them to the composable rather than beside it. N2 gave the
   composable a reset(); anything you add must be reset there too or you reintroduce the user-switch
   bug.

5. Dismiss. There is no delete endpoint — the API layer has exactly fetchMyNotifications and
   markNotificationRead (api/NotificationApi.ts). Check whether one exists undocumented before
   assuming. If it does not: build the UI, leave dismiss disabled or hidden behind the honest reason,
   put a `// TODO(Bn):` at the site, and write the backend ask. Do NOT implement dismiss as a
   client-side filtered-out list — it would come back on every reload and reads as a bug.

6. Empty states, three of them, all distinct: no notifications at all (a first-run message, not an
   error), no notifications matching the current filter (with a clear-filter action), and a failed
   load (retry). N4 established the vocabulary for the bell; reuse the same shapes so the two
   surfaces read as one feature.

7. Locale. New strings go in _common/_locales/common.sk.ts under `notifications.*`, next to the
   existing block at line 271. SK is primary. Note that the framework ships NO English file at all —
   N11 owns that gap; do not solve it here, just do not make it worse by adding strings in the wrong
   place.

Styling: Vuetify props and utility classes first, per CLAUDE.md. Check the vuetify MCP for the
current API of anything you have not used recently (VInfiniteScroll in particular). Split the view
into components rather than growing one 400-line SFC — CLAUDE.md asks for this explicitly.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural:
- the page loads, pages to older items, and does not refetch page 1 when you filter
- reload with filters applied: the filters survive, because they are in the URL
- mark an item read on the page, open the bell: it is read there too, with no network request
- mark unread, and it comes back
- sign out and in as another user: the page is empty for the new user (this is N2's reset doing its
  job — if it is not, N2 regressed and you should say so rather than patching around it)
- a screen reader can reach every per-item action; the list is keyboard navigable

--- After the frontend work is done: write the backend ask, IF you found one ---

Dismiss/delete is the likely one, and possibly mark-as-unread if PATCH /notification/{id}/read has no
inverse. Write ONE ask covering the item-state operations the inbox needs, not one per verb.

The rules matter more than the shape: does dismissing mean deleted or hidden; does a dismissed
notification come back if the same underlying event re-fires; is there a retention policy that makes
dismiss unnecessary; can a notification be marked unread at all or is read one-way by design. State
what the page does today in each case so the backend can correct the assumption.

Read prompts/_common/notifications/backend/README.md for the format and scope rules, including the
extra rule about shared endpoints — this is framework surface serving more than one app. Write to
prompts/_common/notifications/backend/Bn-<slug>.md.
```
