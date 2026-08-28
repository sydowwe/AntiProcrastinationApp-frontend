# N3 · Cap the notification list, and stop deriving the badge from it

- **Scope:** `src/_common/modules/notifications/api/NotificationApi.ts`,
  `composable/useNotifications.ts`, `component/NotificationBell.vue`
- **Backend:** **yes** — paging, a server unread count, and a bulk mark-read. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** N2 (rewrites the same composable's lifecycle)
- **Unblocks:** N6 (the full page needs paging)

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. Do NOT fork files into src/. At the end, list the files
under src/_common you touched.

Three defects that are load-bearing on each other. Read all three before changing anything, because
fixing the first in isolation breaks the second.

1. The fetch is unbounded.
   NotificationApi.ts:6 — API.get<any[]>('/notification/mine'). No limit, no page, no since. It
   returns every notification the account has ever received, into a VList with maxHeight="60vh"
   (NotificationBell.vue:45). Nothing archives or prunes. On a fresh account this is invisible; after
   a year of RoutinePeriodEndingSoon it is a several-hundred-item payload fetched on every connect
   and every reconnect.

2. The unread badge is derived from whatever happens to be loaded.
   useNotifications.ts:13 — unreadCount = notifications.filter(n => !n.isRead).length. This is
   correct today ONLY BECAUSE the fetch is unbounded. The moment you cap the fetch, the badge starts
   under-counting, silently. Neither fact is written down anywhere.

3. "Mark all read" is N parallel requests.
   useNotifications.ts:58-61 — Promise.all(unread.map(n => markRead(n.id))), each hitting
   PATCH /notification/{id}/read. One click with 200 unread is 200 requests. There is no bulk
   endpoint.

Do this, in this order:

1. FIRST, find out what the server actually supports. Before writing any client code, check whether
   /notification/mine already accepts paging parameters and whether any bulk or count endpoint
   exists. The FE has no contract doc for this endpoint. Do not assume it does not — try it. What you
   find determines which branch below you take, and it is the single most useful thing you can put in
   the backend ask if it turns out it does not.

2. If the server supports paging (or you can make the client's request degrade safely): add an
   explicit page/limit to fetchMyNotifications, load a first page for the bell, and add a
   `loadMore()` to the composable. Keep the bell's list capped at one page — the bell is a peek, not
   an inbox. N6 builds the full inbox on top of loadMore().

3. If it does not: cap on the client and be honest about it. Slice to a fixed limit for display,
   keep the full array for the count, and leave a `// TODO(Bn):` at the fetch. Do NOT pretend the
   client-side slice is paging by naming it that way.

4. Decouple the badge from the list, whichever branch you took. The count must come from a source
   that does not depend on how many items are currently in memory. If the server can give it, take
   it and keep it fresh on hub events (increment on an unread incoming, decrement on markRead, refetch
   on reconnect). If it cannot, the count is only correct while the list is complete — in that case
   leave unreadCount as-is, and add a comment at useNotifications.ts:13 stating explicitly that it
   depends on the fetch being unbounded, so the next person capping the fetch sees the coupling. Then
   put it in the backend ask. Do not ship a badge that is quietly wrong.

5. Make markAllRead one operation from the user's point of view. If a bulk endpoint exists, use it.
   If not, keep the fan-out but stop it being unbounded: batch it, and make the optimistic update and
   the revert operate on the whole set rather than per item — today a partial failure leaves the list
   in a mixed state with N snackbars. One request's worth of feedback for one click.

6. Ordering. handleIncoming (useNotifications.ts:33-38) unshifts, assuming the server returns
   newest-first. Once there is paging, that assumption becomes load-bearing on the sort order of the
   page. Confirm the actual order from the response and either sort explicitly client-side by
   createdAt desc, or document the server's guarantee in a comment. Do not leave it implicit.

Do not build the full notifications page here (N6), do not change the bell's loading/error rendering
(N4), and do not add a notification type filter (N12).

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural: seed or observe an account with more notifications than one page. The bell shows the
capped list, the badge matches the true unread total (or is documented as not doing so, per step 4),
"mark all read" clears the badge and issues one request — or a bounded batch — not one per item, and
a reconnect does not double the list.

--- After the frontend work is done: write the backend ask, IF you found one ---

This prompt is the most likely of the set to need one, and step 1 makes you the person who knows
exactly what is missing. If /notification/mine has no paging, or there is no unread-count endpoint,
or there is no bulk mark-read, write ONE ask covering all three — they are the same conversation and
splitting them wastes the backend agent's turn.

Make it a contract-and-rules ask, not an API sketch. The interesting questions are the rules, not the
field names: is there a retention or archival policy at all (if the server prunes, the client may not
need paging); does an unread count include notifications the user cannot currently see; what does
"mark all read" mean if a new one arrives mid-request. Include the actual payload size and item count
you measured — that is what tells the backend agent whether this is worth doing.

Read prompts/_common/notifications/backend/README.md for the format and scope rules, including the
extra rule about shared-endpoint changes: /notification/mine is framework surface serving more than
one app, so say whether what you are asking for is additive or breaking. Write to
prompts/_common/notifications/backend/Bn-<slug>.md.
```
