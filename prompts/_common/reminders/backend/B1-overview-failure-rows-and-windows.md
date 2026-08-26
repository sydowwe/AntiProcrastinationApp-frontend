# B1 · Backend ask — the overview's failure rows, and the two windows it counts over

**Contract only.** This asks for response fields and the rules behind them. Whether they come from the
existing aggregate query, a second query, a projection or a cache is the backend's call, and nothing
below should be read as prescribing storage, entities or indexes.

**Framework-shared.** `/reminder-dashboard/overview` is part of the shared `Sydowwe.Reminders` service,
not an AntiProcrastinationApp endpoint, so anything added here is added for every consumer. Both requests
below are **additive**: no existing field changes name, type or nullability, and a consumer that ignores
the new fields keeps working exactly as it does today.

## The problem

Two separate things, both on `GetReminderOverviewEndpoint` / `ReminderOverviewResponse`.

**1. The failure card has a number and nothing to click.** `ReminderOverviewResponse.FailedNeedingAttention`
is an `int`. The overview's whole reason to exist is answering "is the reminder system healthy right
now", and the one genuinely actionable item on it — a dispatch that failed and has not been corrected —
arrives as a bare count. An admin who sees `7` learns that something is wrong and nothing about what.

The client currently renders that count and a link into the dispatch history filtered to `Failed`
(`OverviewFailureList.vue`). That is an honest fallback, not a good answer: the history is the whole
append-only ledger ordered by dispatch time, so the seven rows that need attention are mixed in with
every failure that was already reversed, and the admin re-does server-side work by eye.

Worth stating plainly, because it shaped this ask: until this session the **frontend DTO did not match
this endpoint at all**. It read `dueSoonCount`, `dueSoonDays`, `recentOutcomes`, `failures` and a `label`
per group — none of which the endpoint has ever sent. Every one of those resolved to its `?? fallback`,
so a healthy response rendered as zeros, blank rollup labels and a permanent "no dispatches last week".
That is fixed client-side (`ReminderOverviewResponse.ts` now mirrors the C# record field for field) and
is **not** something the backend should change to accommodate. It is mentioned only so the phrase
"the failure list" in earlier prompts is not mistaken for something the server once returned.

**2. Two windows are hardcoded server-side and invisible to the client.** In
`GetReminderOverviewEndpoint.HandleAsync`:

- `var next7Days = now.AddDays(7)` bounds `UpcomingNext7Days`
- `var recentSince = now.AddDays(-7)` bounds `RecentDispatch`

Neither number is on the wire. The client has to label both — "Splatné do 7 dní" and "Výsledky odoslaní
za posledný týždeň" — and today it does so from a mirrored constant (`OVERVIEW_WINDOW_DAYS = 7` in
`ReminderOverviewResponse.ts`) that no response can confirm or contradict. The field name
`UpcomingNext7Days` bakes the number into the contract, so the two cannot drift silently *without also
renaming a field* — but the recent-dispatch window has no such protection, and a change to either would
leave the UI confidently mislabelling counts.

## The business rules

Please confirm or correct each of these — the client currently assumes them, and several look like
incidental consequences of the query rather than decisions.

1. **`FailedNeedingAttention` is unbounded and all-time.** It counts every `Failed` row with no reversal
   pointing at it, with no date filter — unlike `RecentDispatch`, which is windowed. Is that intended?
   A count that only ever grows is a strange health signal; if the intent was "failures that still need
   a human", is there a point at which one stops needing attention?
2. **"Needs attention" means "no reversal row references it".** A `Skipped` row never needs attention,
   and a `Failed` row that was retried and later succeeded still counts unless a reversal row was
   written. Is a successful retry expected to write a reversal, or can a `Failed` row be permanently
   stuck in this count despite the reminder having gone out?
3. **`UpcomingNext7Days` has no lower bound.** It counts pending occurrences at or before `now + 7d`,
   including ones already in the past. Is an overdue pending occurrence meant to be in the "due soon"
   number, or is that a gap where an "overdue" count should be?
4. **Both windows are 7 days and are not client-selectable.** Is that a deliberate product decision, or
   just the current default? The client is not asking to choose them — only to be told what they are.

## The shape the frontend needs

**(a) The failure rows behind the count.** An additive array alongside the existing count — the count
stays authoritative and stays the headline, and the array is a sample the card renders under it:

| Field                  | Type            | Null? | Why / who renders it                                                      |
| ---------------------- | --------------- | ----- | ------------------------------------------------------------------------- |
| `id`                   | long            | no    | Row key; the dispatch record's own id.                                     |
| `reminderDefinitionId` | long            | no    | The row links to the dispatch history filtered to this definition.         |
| `ownerModule`          | string          | no    | Right-hand caption on each row — tells the admin whose problem it is.      |
| `kind`                 | string          | no    | The row's primary label.                                                   |
| `occurrenceInstant`    | DateTimeOffset  | no    | Which occurrence failed, as distinct from when the attempt ran.            |
| `dispatchedAt`         | DateTimeOffset  | no    | Rendered as the row's timestamp.                                           |
| `detail`               | string?         | **yes** | The error summary; the card shows it as the row's error line when present. |

`OverviewFailureList.vue` already renders exactly this shape and is wired to it today — the array is
simply always empty, so the rows never appear. Field names above are the ones the client already parses.

**Please cap it server-side, and say what the cap is.** A bad night must not put a thousand rows in a
roll-up response. The client caps its own rendering at 8 regardless, and shows "showing N of M" against
the authoritative count — so a server cap smaller than the total is fine and expected, as long as the
count keeps reporting the true total. Ordering most-recent-first is what the card assumes.

If returning rows here is the wrong shape — because it makes a roll-up endpoint pay for a projection —
say so, and the alternative that works just as well is a **filter value on the dispatch history**:
something like `EffectiveFailuresOnly: bool` on `ReminderDispatchHistoryFilterRequest`, so the existing
"view all failures" link can land on precisely the rows the count counted. Either satisfies this ask;
the second may be the cheaper one, and it is more useful elsewhere.

**(b) The two windows, as returned values.** Two additive ints:

| Field                 | Type | Why                                                                            |
| --------------------- | ---- | ------------------------------------------------------------------------------ |
| `upcomingWindowDays`  | int  | Labels the due-soon card (`"Splatné do {n} dní"`, a pluralized SK string).      |
| `recentWindowDays`    | int  | Labels the recent-outcomes card, currently the hardcoded "za posledný týždeň".  |

`dueSoonDays` was the name an earlier client guessed at; `upcomingWindowDays` is suggested only because
it matches `UpcomingNext7Days`. The name does not matter — being on the wire does. Neither field is hot:
this endpoint is a manual admin page load plus a five-minute poll.

## What changes on the frontend once this lands

- `OVERVIEW_WINDOW_DAYS` and both its `TODO(B1)` blocks in
  `src/_common/modules/reminders/dto/response/ReminderOverviewResponse.ts` are deleted; the view reads
  the windows off the response instead of a mirrored constant, and the drill-down that filters the
  upcoming list to that window becomes exactly the window the card counted.
- The `TODO(B1)` on `FailedDispatchItem` goes away and `ReminderOverviewResponse.failures` stops
  defaulting to `[]`.
- `OverviewFailureList.vue` needs **no change at all** for (a) — the row rendering, the 8-row cap and
  the "showing N of M" line are already written against this shape and are dormant only because the
  array is empty.
- If (a) is answered with the `EffectiveFailuresOnly` filter instead, the change is one extra param in
  `dispatchHistoryFilterToParams` and the "view all failures" link in `ReminderOverviewView.vue`.
