# B4 · Backend ask — project the next N occurrences, instead of only the next one

> **ANSWERED AND SHIPPED (2026-08-28).** The endpoint exists. All six rules confirmed, with one
> correction and one contract clarification; see **The answers** at the bottom. The frontend has been
> updated to match — the degraded fallback is deleted and the panel now renders the real projection.
> The backend's implementation lives in its own `framework/` submodule and must be committed and
> pushed there before its gitlink, or the change does not travel.

**Contract only.** This asks for one read-only endpoint and for six business rules to be confirmed or
corrected. Whether the projection loops the existing calculator, memoizes, or is computed some other way
is the backend's decision, and nothing below should be read as prescribing one.

**Framework-shared.** `/reminder-definition/*` belongs to the shared reminder service, so this serves
every consumer, not just this app. It is **purely additive**: a new route, no change to any existing
response, and a consumer that never calls it is unaffected. Nothing breaks if it is absent — the client
already ships a degraded panel for exactly that case (see the last section).

## The problem

The reminder registry inspector (`ReminderDefinitionDetailView.vue`) is the screen where an admin checks
that a reminder is configured correctly **before** it fires. It could not answer the one question people
open it to ask: *so when does this actually fire?*

It rendered the raw configuration and a single `nextOccurrenceAt`:

- `RecurringCron` → the cron expression as a monospace string, verbatim. The admin either reads Quartz
  cron or does not.
- `RecurringInterval` → a preset name ("Týždenne") and an anchor, leaving them to work out where the end
  date truncates the series.
- `OneShot` → a due date plus lead-offset chips. With two offsets there are two distinct fire instants
  and exactly one was displayed.

Verifying a schedule therefore meant deploying and waiting. R12 has now built the panel — a list of the
next instants, each labelled — but the list itself cannot honestly be computed in the browser, so it is
built against the contract below and currently renders a degraded fallback.

**Why not client-side.** Not a style preference; three hard reasons:

1. Cron here is **Quartz syntax evaluated in UTC** (`CronEvaluator` over `Quartz.CronExpression` with
   `TimeZone = Utc`). Reimplementing that in the browser's timezone is a bug the day someone in another
   offset opens the page, and shipping a cron library to re-derive it is a second implementation of a
   thing the server already does.
2. The server already computes `nextOccurrenceAt`. A second implementation in the client is guaranteed
   to disagree with it eventually, and the client's version is the one on screen. A preview that is
   confidently wrong is worse than no preview, because the entire point is verification.
3. Two of the rules are **invisible to the client**: occurrences already in the dispatch log are skipped,
   and occurrences in the past are skipped. The client cannot see the dispatch log for a definition.

## The business rules

The client assumes each of these. Please confirm or correct — the frontend will follow the server's
answer, not the other way round. Several are stated confidently because the existing single-occurrence
calculator already behaves that way; the question in each case is whether that behaviour is intended to
carry over to a projection of N.

1. **`endDate` truncates the series, inclusively.** An occurrence strictly after the end is not returned,
   and the series is finite from that point. Confirm the boundary: is an occurrence falling exactly on
   the end date fired or not?

2. **Lead-time offsets are one-shot only.** For a `OneShot`, every occurrence *is* the deadline plus one
   lead offset, and offset `0` is the deadline itself — so a one-shot with no offsets has no occurrences
   at all. Recurring schedules carry no offsets however they were registered. This is why the contract
   below has no occurrence-vs-nudge discriminator: `leadOffsetMinutes` is the discriminator. **If lead
   offsets are ever extended to recurring schedules, this contract needs a third field** naming the
   occurrence a nudge belongs to, because "30 dní pred termínom" stops identifying a unique deadline.
   Please say whether that is on the horizon.

3. **Past and already-dispatched occurrences are excluded.** The projection starts at "now", not at the
   anchor, and skips instants already in the dispatch log. Confirm — and say whether a *pending but
   overdue* occurrence (one the scanner has not yet picked up) counts as future. The panel would rather
   show it than hide it, because an overdue reminder is exactly what an admin is looking for.

4. **A Paused reminder projects what it WOULD fire if resumed.** The panel wants the hypothetical series,
   and it labels it as hypothetical: it renders "Pripomienka je pozastavená, takže zatiaľ nespustí nič.
   Nižšie je to, čo by platilo po obnovení." above the list. Returning an empty list for Paused would
   make the panel useless on precisely the reminders someone is deciding whether to resume. Confirm this
   is acceptable; the single-occurrence calculator is already status-blind, so it may need no new rule.

5. **Cancelled / Completed project nothing.** Terminal. The client recognises this from the reminder's
   own status and **does not issue the request at all**, so the `Terminal` empty reason exists only to
   keep the server authoritative if it disagrees.

6. **The projection is the reminder's schedule, irrespective of recipient.** It does **not** subtract
   per-recipient dismissals or snoozes. The registry is an admin view of the definition, and a reminder
   reaching 8 of 10 recipients still fires; per-recipient state belongs to the dashboard views, not here.
   Confirm — if you disagree, the panel needs a label saying whose view it is showing.

## The shape the frontend needs

`GET /reminder-definition/{id}/occurrences?count=N`

```jsonc
{
  "entries": [
    { "occursAt": "2026-09-05T23:18:15Z", "leadOffsetMinutes": -20160 },
    { "occursAt": "2026-09-17T23:18:15Z", "leadOffsetMinutes": -2880 }
  ],
  "hasMore": false,
  "emptyReason": null
}
```

| Field | Type | Null? | Why, and what renders it |
| --- | --- | --- | --- |
| `entries[].occursAt` | instant | never | The fire instant, ascending. Rendered as the row's timestamp in `ReminderOccurrencePreview.vue`. |
| `entries[].leadOffsetMinutes` | int | nullable | Non-null ⇒ this fire is a lead-time nudge; the client labels it with the offset strings it already has (`useReminderFormat.formatLeadOffset`, which renders `-20160` as "14 dní pred termínom"). Null ⇒ the schedule firing, labelled "Výskyt". **This is deliberately the only discriminator** — see rule 2. |
| `hasMore` | bool | never | The series continues past the returned window. Drives one of two footer sentences: "séria pokračuje ďalej" vs "Toto sú všetky zostávajúce výskyty." The panel cannot otherwise distinguish a finite series from a truncated one, and that distinction is half of what verification means. |
| `emptyReason` | string enum | non-null exactly when `entries` is empty | `Exhausted` \| `ScheduleInvalid` \| `Terminal`. An empty list is never self-explanatory: "nothing left to fire" and "this schedule cannot be evaluated" look identical on screen and mean opposite things. Treated as an **open, additive** code set client-side (same convention as `BulkLifecycleOutcome`'s reason codes) — an unknown code degrades to a generic sentence rather than crashing. |

Three more contract points:

- **`count`.** The client currently asks for **8** (`OCCURRENCE_PREVIEW_COUNT`,
  `ReminderDefinitionApi.ts:41`) — enough to recognise a weekly or monthly rhythm, small enough to be a
  handful of steps. **Is the count the client's to choose?** If you would rather fix it server-side, say
  so and the client will drop the parameter and read whatever comes back; if it stays client-chosen,
  please state the cap and what happens above it (clamp or 400 — the batch endpoint chose 400, and
  consistency is worth more than either choice).
- **Cost.** This is a computation, not a lookup: cron projection is an iterative probe, and the existing
  calculator already guards with a `MaxProbe` ceiling. **Is it cheap enough to call on every detail-view
  load?** One call per page view, one reminder at a time, no list view ever calls it (R12 explicitly
  keeps previews off the list views). If 8 steps of cron probing is not something you want on an
  uncached page load, say so and the client will put the panel behind a button.
- **404 is currently ambiguous.** The client treats 404 as "endpoint not deployed" and degrades. Once
  this ships, please 404 only for an unknown reminder id, and the client will separate the two.

### Related, and the case that motivated the `ScheduleInvalid` code

Reminder id 5 in the seeded data (`Registratura / DisposalCheck / DisposalDue`) stores the cron
`0 8 1 * *`. That is **five fields**, and this service's evaluator is Quartz, which requires six or
seven — so the expression is invalid and the reminder can never fire. It is Paused with a null
`nextOccurrenceAt`, and it is almost certainly the same reminder behind the `FormatException` reported in
B3. Nothing on screen said why, which is what `emptyReason: ScheduleInvalid` is for.

This is worth a look independently of this endpoint: it suggests something is authoring 5-field Unix cron
against a 6-field Quartz evaluator. **Is registration validating `Cron` with `ICronEvaluator.IsValid` at
the point of registration?** Rejecting it there is much better than storing a reminder that silently
never fires. (The client deliberately does **not** guess at validity: its cron-to-Slovak translator
declines every expression it cannot prove, including this one, and shows the raw string instead.)

## The answers

All six rules **confirmed**. Two things changed, and both are now reflected in the client:

1. **`endDate` truncates inclusively.** An occurrence falling exactly on `EndsAt` fires; only one
   strictly after it is dropped. Already the calculator's behaviour (`occ > ends`), now carried into the
   projection and pinned by a test.
2. **Lead offsets are one-shot only — with one correction.** *Offset `0` comes back as
   `leadOffsetMinutes: null`, not `0`.* A zero offset **is** the schedule firing, so the server
   normalises it away and the panel labels it "Výskyt"; non-null means strictly a nudge ahead of a
   deadline. Consequence: a one-shot registered with **no** offsets has no occurrences, and that is
   reported as **`ScheduleInvalid`, not `Exhausted`** — the second change. Recurring schedules carry no
   offsets however registered (the registry drops them on any non-one-shot type), and extending offsets
   to recurring schedules is **not** on the horizon; if it ever happens the contract gets the third
   field described in rule 2 above.
3. **Past and dispatched are excluded, and pending-but-overdue counts as future** — you get it. The
   floor is `NextOccurrenceAt` when that is already past, otherwise now. This is the same floor the
   scanner projects from, so the preview and the next scan agree on what is still owed; a plain "now"
   floor would have hidden exactly the reminder an admin opens the inspector to find.
4. **Paused projects the hypothetical series.** No new rule needed — the calculator is status-blind and
   the endpoint deliberately does not special-case Paused.
5. **Cancelled / Completed project nothing**, `emptyReason: Terminal`, decided in the endpoint as a
   lifecycle question rather than schedule math. The client not issuing the request stays correct.
6. **Recipient-blind.** No snooze or dismissal subtraction; per-recipient state stays on the dashboard
   views. No label needed.

Contract points:

- **`count` stays the client's choice.** Default 8 if omitted, cap 50, above the cap is a **400** —
  matching the batch endpoint, for the reason given: a truncation the client cannot detect is the
  dangerous failure. The client keeps sending 8.
- **Cost: call it on every detail-view load.** One row read, one dispatch-log read, N+1 calculator
  probes. No button needed, so the panel keeps loading on mount.
- **404 now means an unknown reminder id and nothing else.** Empty and invalid are 200s with a reason.
- **`emptyReason` is `Exhausted | ScheduleInvalid | Terminal`**, open and additive as assumed.

Implementation note from the backend: `ReminderOccurrenceCalculator` now has `ComputeNextOccurrence` and
`Project` reading one private generator, so the single occurrence a scan advances to is *by
construction* the first one this panel shows. One deliberate difference: `ComputeNextOccurrence` still
throws on an invalid stored cron (the registry's resume guard depends on that) while `Project` reports
it as `ScheduleInvalid`.

### The reminder-5 cron, resolved

Registration **was** already validating with `ICronEvaluator.IsValid`
(`ReminderRegistryService.ValidateSchedule`), and resume guards again. The 5-field expression got in
because seeders write entities directly and bypass the registry — `DevReminderSeeder` hard-coded
`"0 8 1 * *"`. Fixed to `"0 0 8 1 * ?"`, with a comment naming seeders as the one unguarded path. That
is almost certainly the B3 `FormatException` too. `ScheduleInvalid` still earns its place for rows
written by migration or direct SQL, and is covered by a test seeding that exact expression.

## What changed on the frontend when this landed

Done, in `src/_common` (uncommitted at the time of writing):

- `ReminderDefinitionApi.ts` — `fetchOccurrencePreview` dropped the 404/501 `catch` branch and narrowed
  to `Promise<ReminderOccurrencePreviewResponse>`; the `isAxiosError` import went with it. The
  `TODO(Bn)` is replaced by the confirmed cap/cost/404 rules.
- `ReminderOccurrencePreview.vue` — the `'unavailable'` state, the branch that set it and the whole
  fallback block (`nextOccurrenceAt` + configured schedule) are deleted, along with the now-unused
  `InfoRow` / `ReminderScheduleDisplay` imports and the `.reminder-info-grid` style. `ready`, `failed`,
  terminal, paused and empty are unchanged.
- `ReminderOccurrencePreviewResponse.ts` — `TODO(Bn)` gone; the entry doc now states that the deadline
  arrives as `null` rather than `0`, and that the first entry is `nextOccurrenceAt` by construction.
- `OccurrencePreviewEmptyReason.ts` — a one-shot with no offsets moved from `Exhausted` to
  `ScheduleInvalid`; `Exhausted` notes the inclusive end-date boundary.
- `reminders.sk.ts` — `occurrences.unavailable` and `occurrences.configuredSchedule` deleted, their only
  call sites being the fallback block.

The panel, the plural forms and the cron translator needed no change — they were written against this
contract.
