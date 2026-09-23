# B27 · Backend ask — template suggestions ignore what the user set on the template

**Contract and business rules only.** One endpoint, `GET /task-planner-day-template/suggestions/{calendarId}`.
Nothing here asks for a storage, view or index decision. Where the rule lives is yours.

> Written 2026-09-24 while fixing the client half, which was calling this endpoint on a route it does not
> have (`docs/views/_fix-queue-log.md` → *Closed verification items*, the unit-7 template-picker item).
> The client now calls the real route, on first load too, so this endpoint's answer is what the *Suggested
> for you* section shows. **Today that answer is empty for almost everyone.** That is the headline below.
> Parts 2–4 are smaller and the client already works around them. Part 5 asks for a test, not a code
> change.
>
> ✅ **LANDED 2026-09-24. All five parts done, in the shape asked** (the backend's response is at the
> bottom). Pattern types `2` (Scheduled days) and `3` (Suggested-for day type) are new; the route and
> the response shape are unchanged.
>
> **Frontend half done the same day:** the two new sentences, the label mapping extended to types 2 and
> 3, and no `N×` count on them. Verified against the live API with **no mocking**:
> - `/suggestions/997` → *Office Day* (type 2, Thursday) and *Home Office* (type 3, Workday). The
>   answer was identical over 8 replays, sequential and concurrent.
> - The planner reads *"Scheduled for Thursdays"* / *"Suggested for Workdays"* in EN, and
>   *"Naplánované: Štvrtok"* / *"Určené pre: Pracovný deň"* in SK.
> - Switching *Office Day* off in the template list removed it from the suggestions after a reload.
>   Switching it back on restored it.
> - Part 5 (the ownership 404) is pinned by the backend's test, and the client needed no change.

---

## 1. The problem: a template's own *Scheduled days* and *Suggested for day type* never produce a suggestion

The endpoint reads only `planning.mv_template_suggestion_pattern`, and that view is built only from
**history**: a template becomes a suggestion for a weekday or a day type once `calendar.applied_template_id`
has pointed at it **at least twice** on that weekday or day type (`HAVING COUNT(*) >= 2`).

Two fields the user fills in on every template are never consulted:

- `TaskPlannerDayTemplate.ScheduledDays`: the form labels it *Scheduled days*, and the entity comment says
  *"Days of the week this template is intended for"*.
- `TaskPlannerDayTemplate.SuggestedForDayType`: `required`, and the form's day-type select. The name says
  what it is for.

So a new account, or any freshly made template, gets **no suggestions at all**. That lasts until the user
has applied the same template by hand twice on the same weekday, and even then it appears only after the
host-side refresh job has run. The template they created *"for weekdays"* and tagged *Workday* is never
offered on a workday. The e2e seed shows it: `GET …/suggestions/997` (a Thursday Workday, with templates
tagged for it) → `200 []`.

**Precedent in the same module:** `GetSuggestionsRepeatingPlannerTaskEndpoint` already does exactly
this for repeating tasks. Its step 1 is *"User-set suggestions"*: active recurrences matched against their
own `ScheduledDays` / `ScheduledForDayTypes`. The history patterns come after. The template endpoint has
only the second half.

**Where this came from on the client:** `src/core/dayPlanner/composable/useTemplateSuggestion.ts` scored
templates client-side on exactly these fields, and commit `76156248` (2026-05-11, *"added template
suggestions on backend"*) replaced it with this endpoint without carrying the fields across. The file had
no importer since then and was deleted on 2026-09-24. Its weights are below for reference only. The rules
in this ask are what matters, not these numbers.

| signal | old client weight |
| --- | --- |
| `SuggestedForDayType == calendar.DayType` | 4 |
| `ScheduledDays` contains the calendar's weekday | 3 |
| `SuggestedLocation == calendar.Location` (both set) | 2 |
| `LastUsedAt` within 14 days | 1 |
| `UsageCount > 5` | 0.5 |

### The rules

1. **An active template whose `ScheduledDays` contains the calendar's weekday is a suggestion.**
2. **An active template whose `SuggestedForDayType` equals the calendar's `DayType` is a suggestion.**
3. **History still ranks first.** A template the user has actually applied on this weekday or day type is
   stronger evidence than one they merely tagged. Order history-backed entries first (as today, by
   `OccurrenceCount` descending), then metadata-only entries. Within the metadata-only ones, a template
   matching **both** rules comes before a template matching one.
4. **Say which kind each entry is.** The client renders a history entry as *"Used on Thursdays · 4×"*.
   A metadata-only entry has no count and needs different words (*"Scheduled for Thursdays"*). Two new
   `PatternType` values are the smallest change that tells them apart: `2` = matched `ScheduledDays`, and
   `3` = matched `SuggestedForDayType`. `PatternLabel` carries the weekday or day-type name as it does
   today, and `OccurrenceCount` is `0`. A different shape is fine if you prefer one; say which in the
   response and the client follows.
5. **Location is optional and out of scope** unless it is free. `calendar.Location` is usually null.

**Frontend half:** small. Two locale strings for pattern types 2 and 3, and the label mapping the client
already does for 0 and 1. It is not written yet, because the shape is yours to settle.

## 2. One entry per template

A template applied twice on Thursdays that were also Workdays comes back **twice**: once as pattern type
`0` and once as type `1`. The client renders one row per template (and keys the list by template id), so
it now keeps the first. **Rule:** at most one entry per template, carrying its strongest pattern, which is
the first by rule 3's order. With part 1, the same applies across history and metadata: a template both
applied and tagged for Thursdays is one entry, the history one.

## 3. Only active templates

The view is not filtered by `IsActive`, so a template the user switched off is still suggested. The
client now drops inactive templates. **Rule:** skip `IsActive == false`, as the repeating-task sibling
already does (`.Where(t => t.UserId == userId && t.IsActive)`).

## 4. `PatternLabel` stays a stable enum name, not display text

The client translates it: `"Thursday"` → `calendar.thursday`, and `"Workday"` → `planner.dayType.Workday`.
The endpoint's `Summary` calls it *"e.g., "Monday" or "Workday""*, which is right. **Please keep it the
invariant `DayOfWeek` / `DayType` member name.** Don't localize it or reword it server-side, or the
client's mapping falls back to showing the raw string. Nothing to change today. This is a note so it does
not drift.

## 5. Ownership: pin it with a test (no code change expected)

Both suggestion endpoints load the calendar with `dbContext.Set<Calendar>().FindAsync([calendarId], ct)`
and do not compare `calendar.UserId` with the caller. Read in isolation, that looks like one account
steering its suggestions with another account's calendar date and day type.

**It is not a leak today.** `Calendar : BaseEntityWithUser` gets the per-user global query filter, and
`FindAsync` applies global filters, so another account's id comes back null and the endpoint answers 404.
But the protection rests entirely on `UserScoping:Enabled` (`Program.cs:220-221`, overridable per
deployment), and **no test pins it for these two routes**. `PlanningCrudAuthMatrixTests` does not mention
them, and `TaskPlannerDayTemplateSuggestionsTests` seeds one user only.

**Ask:** one test per endpoint. A calendar owned by user B, requested by user A → **404**, not 200 and
not suggestions. If you would rather make the check explicit in the handler as well, that is your call.
The ask is only that the behaviour is pinned.

---

## Done when

- A template whose `ScheduledDays` includes the day's weekday, or whose `SuggestedForDayType` matches the
  day's type, is suggested with **no history at all**, ranked after history-backed suggestions, and
  distinguishable from them in the response.
- No template appears twice in one response.
- An inactive template is never suggested.
- A test shows another account's `calendarId` answers 404 on both suggestion endpoints.

## How the client will verify

`/day-planner/<a Thursday>` on the e2e seed with no mocking: *Suggested for you* shows the seeded
templates tagged for Thursday or Workday, with the new *"Scheduled for …"* wording, and no row twice.
Switch a template off in `/day-planner/templates` and reload: it is gone from the list.

---

## Backend response (2026-09-24, verbatim)

> **B27 · Backend response: template suggestions**
>
> Endpoint: `GET /task-planner-day-template/suggestions/{calendarId}`. The route and the response shape
> are unchanged. `PatternType` has two new values.
>
> **What changed**
>
> 1. Suggestions no longer need history. An active template is now suggested when its `ScheduledDays`
>    contains the calendar's weekday, or when its `SuggestedForDayType` equals the calendar's `DayType`.
>    On the e2e seed, `…/suggestions/997` should now return the templates tagged for Thursday or Workday
>    instead of `[]`.
> 2. One entry per template. The client-side "keep the first" dedup can stay, but it will never fire.
> 3. Active templates only. `IsActive == false` is never suggested, whether it comes from history or from
>    its settings. The client-side filter can stay as a safeguard or be removed.
> 4. `PatternLabel` is still the invariant enum member name ("Thursday", "Workday"). It is never localized
>    server-side.
> 5. Ownership: another account's `calendarId` returns 404 on both suggestion endpoints. This is now
>    pinned by a test. The client doesn't need to change anything.
>
> **`PatternType` values**
>
> | PatternType | Source | PatternLabel | OccurrenceCount | Suggested wording |
> | --- | --- | --- | --- | --- |
> | 0 | history: applied on this weekday | DayOfWeek name, e.g. "Thursday" | ≥ 2 | Used on Thursdays · 4× |
> | 1 | history: applied on this day type | DayType name, e.g. "Workday" | ≥ 2 | Used on Workdays · 3× (existing) |
> | 2 (new) | template's `ScheduledDays` contains this weekday | DayOfWeek name | 0 | Scheduled for Thursdays |
> | 3 (new) | template's `SuggestedForDayType` matches this day | DayType name | 0 | Suggested for Workdays |
>
> Types 2 and 3 map their labels exactly like 0 and 1 already do: "Thursday" → `calendar.thursday`,
> "Workday" → `planner.dayType.Workday`. Only the surrounding sentence differs, so you need two new locale
> strings.
>
> **Order of the array** (render it as given, don't re-sort)
>
> 1. History entries (types 0 and 1), sorted by `OccurrenceCount` descending. When a template has equal
>    counts for both, the entry you get is type 0.
> 2. Entries from template settings (types 2 and 3):
>    - A template matching both weekday and day type comes first and is reported as type 2, because the
>      weekday is the more specific match. The client never sees a "both" type.
>    - Ties are broken by template `UsageCount` descending, then by template id.
>
> A template that has history and matching settings appears once, as its history entry.
>
> **Frontend to-do**
>
> - Add locale strings for pattern types 2 and 3 (e.g. "Scheduled for {day}", "Suggested for {dayType}").
> - Extend the pattern-type → wording switch to cover 2 / 3. Don't render the `· N×` count for them,
>   since it is always 0.
> - Optional: remove the client-side inactive filter and dedup. Both are now guaranteed by the backend.
>
> **How to verify**
>
> On `/day-planner/<a Thursday>` with the e2e seed and no mocking, *Suggested for you* shows the templates
> tagged for Thursday or Workday with the new wording, and no row appears twice. Switch one of them off in
> `/day-planner/templates` and reload: it disappears from the list.
