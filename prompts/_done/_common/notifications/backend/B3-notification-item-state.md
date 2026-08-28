# B3 · Backend ask — the item-state operations an inbox needs that a bell never did

## ANSWERED — 2026-08-26, and landed the same day

**Both items granted, both additive.** The settled contract:

- **`PATCH /notification/{id}/unread`** — mirrors the read route (no body, `204`, `404` when not the caller's, idempotent both ways). Clears `IsRead` **and** `ReadAt`.
  Read is state, not an audit fact: nothing consumes the stamp, and semantic trails live in the audit service, which is why `Notification` is `[NoAudit]` in the first
  place. The `{ "isRead": boolean }` body form was rejected for the reason the ask gave — a default that exists only to protect old callers is a trap for new ones.
- **`POST /notification/delete-batch`** — `{ ids }` → `{ deletedCount, skippedIds }`. Foreign and already-gone ids are **skipped, not 404s**, so a stale selection
  stays actionable. `400` on an empty list and on more than **500** ids (counted before de-duplication).
- **Dismiss is permanently a hard delete.** No dismissed-but-retained state exists or is planned — a tombstone of things the user asked to be rid of runs against the
  module's GDPR storage-limitation posture. The confirm dialog and the absent undo are the correct UI and are no longer provisional.

**Two corrections worth keeping.**

1. **This ask blamed the wrong column for the retention move.** The purge keys rule 1 on `IsRead` + `CreatedTimestamp`, not on `ReadAt` — so nulling the stamp is not
   what returns a row to the 365-day window; *flipping the flag* is, and it would do so whether the stamp were kept or not. There is no version of unread that avoids
   this. The move was then taken **deliberately**: marking something unread is a claim it is unfinished, which is exactly what rule 1 assumes to be false. Capped at
   365 days regardless, and now asserted in `NotificationItemStateTests` against the real purge handler.
2. **A dismissed notification cannot reappear** — every producer is one-shot per occurrence (dedupe ledger, fire-and-delete alarm, period marker). One exception,
   admin-only: `ScheduledJobOverdue` is re-raised by the overdue sweep while the job is *still* overdue, which is a live condition being re-reported rather than a
   resurrection. A *new occurrence* of a recurring thing is a new notification, and the inbox deliberately does not suppress one.

**Frontend work list: all five items done.** `NotificationRow`'s envelope is a real toggle (icon names the action, not the state); `useNotifications` gained
`markUnread`; `markUnreadUnavailable` was replaced by `markUnread` + `markUnreadError`; `dismissMany` collapsed from a `Promise.allSettled` fan-out to one request
that restores `skippedIds` and announces `deletedCount`; the confirm-dialog rationale is recorded as settled at the site.

**One deviation, deliberate:** `_silent` was **kept** on `deleteNotification` and set on the batch call. The work list suggested dropping it along with the fan-out it
was added for, but it has a second reason that survives — the interceptor is the single owner of error snackbars, so without it a failed single dismiss shows two
(the interceptor's *and* `notifications.dismissError`). Noted at the site so it does not read as an oversight.

---

## The original ask follows

**Contract only.** Nothing here prescribes storage, entities, EF configuration, migrations or indexes — the shape of the routes and the rules behind them are what the
frontend needs settled; how they are implemented is the backend agent's call.

One ask, four verbs, because they are one question: **what states can a notification be in, and which transitions is a user allowed to drive?** Splitting it per verb
would get each answered in isolation, and the interesting answers are the ones that relate them.

## Context: this ask is smaller than it was going to be

N6 expected to ask for delete. It already exists — `DELETE /notification/{id}`
(`framework/Sydowwe.Notifications/application/endpoint/notification/DeleteNotificationEndpoint.cs:14`), owner-scoped, `404` when the row is not the caller's, `204`
otherwise. The inbox calls it and per-row dismiss shipped working. This continues the pattern from N3: **three of the endpoints that set expected to request already
existed and had simply never been called.** So the two items below are what actually survived contact with the work, and item 1 is the only true blocker.

## The problem

**1. `read` is a one-way door, and the inbox has to render that as a dead control.**

`PATCH /notification/{id}/read` (`MarkReadNotificationEndpoint.cs:14`) sets `IsRead = true` and stamps `ReadAt`. There is no inverse — no `unread` route, and the
route takes no body, so there is nothing to pass `false` to. Confirmed by reading the endpoint directory, not swagger.

The user-visible consequence: a misclick is permanent. The inbox lists rows whose primary click action is "open", which also marks read — so brushing the wrong row
loses the one signal telling the user they still have to deal with it. The bell has the same problem and always has; the inbox makes it obvious because it is a screen
people *work* rather than glance at.

What the frontend does today, so you can correct the assumption rather than infer it: `NotificationRow.vue:70-79` renders one envelope button in two states and
**disables it once the row is read**, with `notifications.markUnreadUnavailable` ("Označiť ako neprečítané zatiaľ nie je možné") as its tooltip and accessible name.
The control is rendered-and-disabled rather than hidden, so the absence is legible instead of looking like the button moved. `TODO(B3)` sits on that block.

**2. Bulk dismiss is N requests, and the client is the only thing bounding N.**

There is no batch delete. `dismissMany` (`useNotifications.ts:298`) issues one `DELETE` per selected id through `Promise.allSettled`, suppresses the interceptor's
per-request snackbar (`_silent`, `NotificationApi.ts`) so N failures cannot become N snackbars, restores exactly the ids that failed, and raises one message. It works,
and a partial failure is handled honestly — but the request count is the size of the user's selection, and the only ceiling on that is that
`selectAllVisible` selects what has been *loaded*, not the whole history. A user who pages deep and then selects all can fire hundreds.

This is a real but non-blocking cost. Do not build it if the answer to the rules below is that selections are expected to stay small.

## The business rules

Every one of these is currently a client-side guess. The frontend will follow the server's answer.

1. **Is read one-way by design, or is unread merely unimplemented?** If the read stamp is meant as an audit fact ("this was surfaced to the user at `ReadAt`") then
   un-reading is genuinely wrong and the inbox should keep its disabled button — say so and this item closes as *won't fix*, which is a perfectly good answer. If it
   is just state, the inbox wants the inverse.
2. **If unread is allowed, what happens to `ReadAt`?** Nulled (the row becomes indistinguishable from never-read), or kept (it becomes "last read at", and unread is
   a separate flag)? This matters beyond bookkeeping: `PurgeExpiredNotificationHistoryJobHandler.cs:55-57` deletes **read** notifications at 90 days and everything at
   365. If un-reading nulls the stamp, a user can extend a row's retention from 90 days to 365 by clicking an envelope. That may be fine, but it should be a decision
   rather than a side effect.
3. **Does dismiss mean deleted or hidden?** The endpoint says deleted — `Remove` + `SaveChanges`, no soft-delete column, nothing on `Notification.cs` that could hold
   a dismissed state. The frontend has taken that literally: both dismiss paths confirm first (`notifications.dismissConfirmText` says "natrvalo sa odstráni …
   nie je možné vrátiť späť"), and there is no undo, because there is nothing to undo against. **Confirm that is intended.** If a dismissed-but-retained state is
   coming, say so now — the confirm dialog is the wrong UI for something recoverable, and we would drop it for an undo snackbar instead.
4. **Can the same underlying event re-create a notification the user dismissed?** A hard delete leaves no tombstone, so nothing server-side can suppress a re-raise.
   If a producer can re-fire for the same occurrence, a dismissed row can come back and will read as a bug in the inbox. If producers are one-shot per occurrence,
   there is no issue — but the client cannot tell which, and this is not visible from any DTO.
5. **Does retention make dismiss unnecessary?** No, and this is stated so it can be corrected rather than re-litigated: 90 days for read rows is far longer than the
   horizon on which someone wants a finished notification off their screen. Dismiss is a tidying action, not a storage one. Only mentioned because the retention job's
   existence has already been mistaken for one.
6. **Is a bulk delete worth it, or are selections expected to stay small?** See problem 2. If sizeable selections are expected, the frontend wants one call; if not,
   the current fan-out is fine and this closes.

## The shape the frontend needs

Both items are **additive** — new routes, no change to any existing response or request shape, so the other app on this framework submodule is unaffected and needs no
coordination. Neither `NotificationDto` nor `GET /notification/mine` changes. If either of you sees a reason that is wrong, say so; from the client side there is
nothing existing to break.

**1. An inverse for read** — only if rule 1 says un-reading is legitimate.

Whatever shape you prefer; from the client both are one call and the frontend has no preference worth overriding a server-side convention for:

- `PATCH /notification/{id}/unread`, mirroring the existing route exactly (no body, `204`, `404` when not the caller's), or
- a body on the existing route — `PATCH /notification/{id}/read` taking `{ "isRead": boolean }`. **This one is breaking** for the current no-body callers unless the
  field is optional and defaults to `true`, so the mirrored route is the safer of the two.

Consumed by `NotificationRow.vue`'s envelope button and a `markUnread(id)` in `useNotifications.ts` alongside the existing `markRead`. Not hot: one call per user
click, and the inbox is not a high-traffic screen.

**2. A batch delete** — only if rule 6 says it is worth it.

`POST /notification/delete-batch` taking `{ "ids": number[] }`, or `DELETE /notification?ids=1,2,3`. What the frontend needs from the **response**, more than the route
shape: **how many were actually deleted**, or which ids failed. `dismissMany` already reports a count to the user
(`notifications.dismissedAnnouncement`, into an `aria-live` region) and currently derives it from which promises rejected; with one call it needs the server to say.
Silently ignoring ids that are not the caller's (rather than 404-ing the whole batch) is the behaviour that makes a partially-stale selection recoverable — but that is
your call, and the client will render whatever it is told.

## What changes on the frontend once this lands

**If unread is granted:** `NotificationRow.vue:70-79` loses its `:disabled` and its `TODO(B3)`, and the two-state button becomes a real toggle; `useNotifications.ts`
gains a `markUnread` next to `markRead` with the same optimistic-update-and-revert shape; `notifications.markUnreadUnavailable` is deleted from
`_common/_locales/common.sk.ts` and replaced by a `markUnread` label. Small, contained, and the button already exists in both states — the disabled state was built to
be deleted.

**If unread is refused:** nothing changes, and the disabled control stops being a TODO and becomes the documented answer. Worth an explicit "no" so the next agent
reading that line does not re-file this.

**If batch delete is granted:** `dismissMany`'s `Promise.allSettled` fan-out, its per-id restore loop and the `_silent` flag on `deleteNotification` all collapse into
one request and one response — roughly 25 lines in `useNotifications.ts:298-323` become five. The per-row `dismiss` is unaffected either way.
