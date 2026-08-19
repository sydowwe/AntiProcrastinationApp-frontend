# D1 backend ask — the leisure suggestion draw

The picker (`/leisure/pick`, `../../../../src/core/leisure/view/PickerView.vue`) is built and works today against the endpoints that already exist. It calls
`POST /activity-backlog-profile/filtered-table`,
`POST /activity-project-profile/filtered-table` and `POST /activity-bucket-list-profile/filtered-table`
with a page size of 200, then ranks the three pools together in the browser (`../../../../src/core/leisure/composable/leisureScoring.ts` — that file is the
written-down rule, and it is the spec for anything below).

Two things that rule needs cannot be done from here:

1. **Cross-source ranking does not belong on the client.** The 200-row ceiling is arbitrary, and the three tables have to be downloaded in full to rank three cards
   out of them.
2. **The draw has to remember what it already showed**, or the same three appear every visit. The client currently keeps that in `localStorage`
   (`../../../../src/core/leisure/composable/suggestionHistory.ts`), which means rerolling on a phone does not stop the laptop offering the same three.

So the ask is one read endpoint that returns the draw, and one write endpoint that records its outcome. Both bodies are camelCase, like the rest of the API.

---

## 1. `POST /leisure-suggestion`

Returns a **ranked** set of candidates drawn from the backlog, project and bucket-list profiles together. The ranking rule is the server's to choose; what the
frontend needs is a stable order and the facts below to render the "why" on each card.

### Request

```json
{
	"minutes": 45,
	"energy": "low",
	"people": 1,
	"maxCostTierId": 3,
	"locationTypeId": null,
	"seed": 1837465239,
	"count": 3
}
```

| field            | type         | null?    | meaning                                                      |
|------------------|--------------|----------|--------------------------------------------------------------|
| `minutes`        | int          | required | minutes the user has available                               |
| `energy`         | string       | required | `"low" \| "medium" \| "high"`                                |
| `people`         | int          | required | people available, including the user                         |
| `maxCostTierId`  | int          | nullable | highest acceptable `ActivityExpectedCostTier` id; null = any |
| `locationTypeId` | int          | nullable | required `ActivityLocationType` id; null = anywhere          |
| `seed`           | int (uint32) | required | the draw seed — see below                                    |
| `count`          | int          | required | how many to return; the frontend always sends 3              |

**`seed` must be honoured as an input, not ignored.** It lives in the page URL (`/leisure/pick?…&seed=`), and the contract the UI depends on is: *the same request
body, against unchanged data and unchanged suggestion history, returns the same items in the same order.* Reloading the page must not reshuffle the three cards the
user was deciding between. A different `seed` is what "something else" sends.

### Response

```json
{
	"items": [
		{
			"key": "backlog:12",
			"source": "backlog",
			"activityId": 12,
			"activity": { "id": 12, "name": "Evening walk", "categoryName": "Outdoors", "icon": "fas fa-shoe-prints", "color": "#4caf50" },
			"statedDurationMinutes": 45,
			"maxUsefulMinutes": 45,
			"energyLevel": "low",
			"energyIsDerived": false,
			"effortType": "physical",
			"minParticipants": 1,
			"readinessStatus": null,
			"comfortZoneStep": null,
			"requiresTravel": false,
			"contextLabel": "Outdoor"
		}
	],
	"poolCount": 41,
	"eligibleCount": 6
}
```

**Envelope**

| field           | type  | null?    | meaning                                                                        |
|-----------------|-------|----------|--------------------------------------------------------------------------------|
| `items`         | array | required | the ranked draw, at most `count`, best first. May be shorter, including empty. |
| `poolCount`     | int   | required | candidates considered before any constraint was applied                        |
| `eligibleCount` | int   | required | candidates that survived the constraints                                       |

The last two are not statistics — they are what the empty state says. `poolCount === 0` renders
"you have nothing filed yet, go add some"; `poolCount > 0` with an empty `items` renders "nothing matches, try loosening a constraint". Getting those two confused is
the difference between blaming the user and blaming the filter.

**Item**

| field                   | type    | null?    | notes                                                                                                                                                                                                                                                |
|-------------------------|---------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `key`                   | string  | required | `"<source>:<activityId>"`, e.g. `"bucketList:8"`. Identity across draws; it is what endpoint 2 sends back and what the UI keys cards on.                                                                                                             |
| `source`                | string  | required | `"backlog" \| "project" \| "bucketList"`                                                                                                                                                                                                             |
| `activityId`            | int     | required | the activity the profile belongs to; also what the planner task is created against                                                                                                                                                                   |
| `activity`              | object  | required | same shape as `ActivityInfo` on the existing profile responses — `id` (int), `name` (string), `categoryName` (string, nullable), `icon` (string, nullable), `color` (string, nullable)                                                               |
| `statedDurationMinutes` | int     | nullable | the duration the source actually records. Backlog only; null for the other two. Renders as "Takes 45 min" vs "Fits in 45 min".                                                                                                                       |
| `maxUsefulMinutes`      | int     | nullable | the longest this could usefully occupy — backlog duration, or a project's whole estimate in minutes. Null when the source records neither. Used only to size the planner slot the user books.                                                        |
| `energyLevel`           | string  | required | `"low" \| "medium" \| "high"`                                                                                                                                                                                                                        |
| `energyIsDerived`       | boolean | required | false when the source states it (backlog), true when it was inferred. The card labels a derived value as an estimate, so this must be honest.                                                                                                        |
| `effortType`            | string  | nullable | `"physical" \| "mental"`, or null                                                                                                                                                                                                                    |
| `minParticipants`       | int     | nullable | backlog only; null elsewhere                                                                                                                                                                                                                         |
| `readinessStatus`       | string  | nullable | project only: `"planning" \| "readyToStart"`. `"needsShopping"` must never appear in a draw.                                                                                                                                                         |
| `comfortZoneStep`       | int     | nullable | bucket list only, 1–5                                                                                                                                                                                                                                |
| `requiresTravel`        | boolean | required | bucket list only; false elsewhere                                                                                                                                                                                                                    |
| `contextLabel`          | string  | nullable | the one source-specific fact worth a line on the card: the backlog's location-type text, the bucket-list entry's experience-type text, the project's `projectArea`. Already resolved to display text — the frontend does not look up the lookup row. |

Nothing else is read. There is no score, rank or explanation field in this contract on purpose: the card explains itself from the facts above, so a scoring number
would be an unrenderable detail the frontend would have to be re-released to use.

## 2. `POST /leisure-suggestion/seen`

Records what happened to a draw, which is the input the next draw's staleness needs.

### Request

```json
{
	"keys": ["backlog:12", "project:5", "bucketList:8"],
	"outcome": "rejected"
}
```

| field     | type     | null?    | meaning                                                                                          |
|-----------|----------|----------|--------------------------------------------------------------------------------------------------|
| `keys`    | string[] | required | `key` values from a previous draw; 1–3 entries in practice                                       |
| `outcome` | string   | required | `"rejected"` (the user pressed "something else") or `"committed"` (the user planned one of them) |

Response: no body (204).

The frontend sends `"rejected"` for the whole outgoing set on a reroll, and `"committed"` for the single key the user planned. It deliberately does **not** send
anything when a draw is merely rendered — recording on render would mean reloading the page demoted the very cards on it, and the seeded URL would stop reproducing
its own draw.

---

## Not an ask, but please confirm it holds

The card's "do it now" / "plan for later" actions both create a planner task through the existing
`POST /planner-task`, with `activityId`, `startTime`, `endTime`, `date` (today), and — for "do it now" — `status: "inProgress"` with `actualStartTime`. This is the
same call
`../../../../src/core/dayPlanner/component/normal/PlannerTaskDialog.vue` makes when creating from outside the viewed day, so it should already work; the picker is
just a new caller. The one case worth checking is a day that has **never been planned** and therefore has no calendar row yet — that is a normal state for this
feature, since "I'm bored, give me something" is exactly what an unplanned day looks like, and it must not 404.

## If the ranked endpoint is not going to be built

The client-side draw stays, and it would still be materially better with two filter fields it does not have today. Both are additive to existing filter request DTOs:

- `ActivityProjectProfileFilter.maxEstimatedHours` (decimal, nullable) — without it, every project row is downloaded and sized locally.
- `ActivityBacklogProfileFilter.maxParticipants` semantics confirmed in writing. The field exists, but it is not clear whether it filters "profiles whose
  `maxParticipants` is at most X" or
  "profiles that can accommodate X people". The picker needs the second and, not knowing which it gets, currently sends neither participant field and filters locally
  instead.

Neither of these fixes the memory problem, which is the half of this ask that cannot be worked around from the frontend at all.
