# B5 — ~~`GET /api/repeating-planner-task/suggestions` does not exist~~

> ⛔ **WITHDRAWN 2026-09-11, before it was ever sent. This was not a backend ask — it is a frontend bug.**
> Kept as a record so nobody re-files it, and because how it got written wrong is the more useful part.

**The route exists.** It just takes a different parameter than the client sends:

```csharp
// AdhdTimeOrganizer.Planning/application/endpoint/repeatingPlannerTask/query/
//   GetSuggestionsRepeatingPlannerTaskEndpoint.cs:26
Get("/repeating-planner-task/suggestions/{calendarId:long:required}");
```

Verified live, signed in as the seed's `primaryUser`:

| Request | Status |
| --- | --- |
| `GET /api/repeating-planner-task/suggestions/984` — `calendarId` as a path segment | **200** `[]` |
| `GET /api/repeating-planner-task/suggestions?date=2026-09-11` — what the client sends | **400** |

## What the client does wrong

`src/core/dayPlanner/api/repeatingPlannerTaskApi.ts`:

```ts
async function fetchSuggestionsForDate(date: string): Promise<SuggestionResponse[]> {
	const response = await API.get(`${url}/suggestions`, { params: { date } })
	return SuggestionResponse.listFromObjects(response.data)
}
```

It passes a **date as a query param**. The server wants a **`calendarId` in the path**. With no matching
sub-route, the request falls through to `GET /api/repeating-planner-task/{id}` and `"suggestions"` is rejected
as an id — which is why the response body is `{"errors":{"id":["Value [suggestions] is not valid"]}}` rather
than a 404.

The caller already has what it needs: `DayPlannerView.vue:246` calls
`fetchSuggestionsForDate(formatDateForApi(store.viewedDate))`, and the same view has already resolved the day's
calendar (`GET /api/calendar/by-date/{dd-MM-yyyy}` → `{ id: 984, … }`) before this fires. So the fix is to pass
that id, not to add a route.

Two smaller things in the same area, both app-side:

- the call fires **twice** per day view;
- `GET /api/task-planner-day-template/suggestions/{calendarId}` also exists and returns **200**, and the client
  **never calls it at all**. That is unused server capability rather than a defect — an `opportunity` finding
  for unit 07 or for `docs/data-map.md`, not a bug.

## How this got filed wrongly

Worth keeping, because it is the exact failure this prompt set keeps hitting. The 400 was reproduced
correctly, and several plausible alternative paths were probed (`/suggestion`, `/for-date`, `/all`,
`/suggestions/{date}`) — all failed, which *looked* like strong evidence that nothing was mounted under the
prefix. It was not: every probe kept the wrong **parameter shape**, so they all fell through to `{id}` the same
way, and `/suggestions/2026-09-11` returned 404 only because the route constraint is `:long`.

**Probing an endpoint from the outside cannot distinguish "no route" from "right route, wrong parameter".**
Swagger is not exposed on this API, so the check that would have caught it in seconds was reading the endpoint
class — which is what `CLAUDE.md` and the project memory both already say to do before writing any backend ask.
Five earlier escalation blocks in `prompts/_common/` produced zero real backend asks for the same reason.

**Do not write a backend ask from a status code alone.** Read the endpoint in
`C:\Users\jakub\RiderProjects\AdhdTimeOrganizer` first.
