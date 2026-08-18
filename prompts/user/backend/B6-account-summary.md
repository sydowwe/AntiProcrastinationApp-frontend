# B6 · Backend ask — a cold-path account-deletion summary

**Contract only.** Nothing below implies a table, a query, or where it runs.

## The problem

`DangerZoneSection.vue` (`src/core/user/component/settings/DangerZoneSection.vue`) is the app's own
warning in front of the framework's delete-account flow (`SecuritySection.vue:67-72`), added by
`prompts/user/A2-deletion-cliff.md` because that flow verifies identity but never states what is
about to be destroyed. Today the card names the categories of data that go with the account —
activity history and tracked time, day plans and templates, to-do lists, leisure items, the Google
Calendar link — as nouns, not numbers.

"You will lose 1,240 tracked sessions and 8 months of history" is a categorically better warning than
a list of nouns, but no endpoint on the client today returns those counts in one cheap call. Producing
them client-side would mean firing a request per module (`activityHistory`, `activityTracking`,
`dayPlanner`, `todoList`, `leisure`, `googleCalendar`) just in case a user opens a card almost nobody
opens — a real cost for a rare read, so the client does not do that today.

## The business rules

- Which counts are worth showing? Candidates, in rough order of how much they'd change the user's
  mind: tracked-time entries, the date range they span, day-plan/template count, to-do items across
  all lists, leisure items (bucket-list/project/memory entries combined or split — your call).
- Is an approximate count acceptable (e.g. a fast `COUNT(*)` per table) or does it need to match what
  the export would produce exactly? The card is a warning, not a receipt, so approximate is fine from
  the frontend's side — say if that changes what you'd build.

## The shape the frontend needs

A single response with named counts, e.g. `{ trackedSessionCount, trackedTimeSpanDays,
dayPlanCount, todoItemCount, leisureItemCount, googleCalendarLinked }` — exact field set is yours;
the frontend will render whichever fields the response has and fall back to the current noun-only
text for any it lacks. This is explicitly **cold path**: requested once, when the user opens (or
scrolls to) the danger-zone card, not on every settings-page load. Latency does not matter here —
correctness and staying cheap on the server do.

## What changes on the frontend once this lands

`DangerZoneSection.vue` fetches the summary lazily (behind a disclosure or on mount of that one
card, not bundled into the settings page's existing requests) and renders counts alongside the
existing noun list instead of the noun list alone.
