# D2 backend ask — a weather signal the picker can actually use

The frontend side of D2 is built and degrades correctly today: `../../../../src/core/leisure/api/leisureWeatherApi.ts`
calls an endpoint that does not exist yet, catches the failure, and every caller (`../../../../src/core/leisure/composable/leisureScoring.ts`'s ranking, the "good
for today" badge in
`BacklogTable.vue`, the matching reason on `SuggestionCard.vue`) treats a `null` result as "no weather opinion" — nothing ranks up, nothing is excluded, no badge
renders. That path is already covered by
`leisureScoring.test.ts`. This file is what turns it on.

## Why the response is a list of lookup ids, not a condition string

`ActivityBacklogProfile.weatherDependency` is a `LookupResponse` — a user-editable row (`id`, `text`,
`sortOrder`) from the `activity-weather-dependency` lookup table, not a fixed enum. The frontend has
`enums.weatherDependency.{sunny,snow,dry,none}` locale keys, but nothing on the wire ties a specific lookup row to one of those keys — matching by `text` would break
the moment a user renames a row, or runs the app in the other locale. So rather than asking the frontend to resolve "sunny" into an id itself, the endpoint should
hand back the resolved set: which of the user's own
`activity-weather-dependency` rows fit today's actual conditions. The frontend does nothing more than
`matchingWeatherDependencyIds.includes(row.id)`.

How the condition is determined (weather provider, caching, refresh interval) and how the row-to-condition mapping is decided (a `code` column on the lookup table, a
name-based heuristic, whatever) are entirely the backend's call. Not part of this ask.

---

## 1. `GET /leisure-weather-fit`

### Request

No body. No query params — location is resolved server-side (see §2).

### Response

```json
{
	"matchingWeatherDependencyIds": [3, 7]
}
```

| field                          | type  | null?    | meaning                                                                                                                                                                         |
|--------------------------------|-------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `matchingWeatherDependencyIds` | int[] | required | ids of the user's `activity-weather-dependency` rows that fit today. Always include the id of a "none / any weather" row if the user has one — it fits every day by definition. |

When the signal cannot be produced — no location set, no provider data, anything else — return either a 204 with no body, or 200 with
`matchingWeatherDependencyIds: []`. The frontend cannot tell these two apart today (empty array and "unavailable" both read as null and are handled identically — see
`fetchTodayFit` in `leisureWeatherApi.ts`), so pick whichever is simpler on your side; there is no need to add a separate `available` flag unless you want one for
your own logging.

The frontend never retries and never blocks a suggestion on this call — a slow or failing response must not delay the picker's first draw.

## 2. A location preference, read and written like any other

`../../../../src/core/user/dto/userAugmentation.ts` already merges two app preferences onto the framework `User` /
`UserPreferencesRequest` this way — `firstDayOfWeek` and `askBeforeDelete`, both round-tripped through
`useUserStore().setPreferences({...})`. This needs one more field on the same DTOs, e.g.:

```json
{ "weatherLocation": "Bratislava, SK" }
```

| field             | type   | null?    | meaning                                                                |
|-------------------|--------|----------|------------------------------------------------------------------------|
| `weatherLocation` | string | nullable | free text the user typed; `null` = not set, no weather signal possible |

Free text rather than lat/lng is a deliberate ask: it keeps geocoding, storage shape and provider choice entirely on your side, and the frontend needs nothing beyond
a field it can read and write. No UI reads or writes this field yet — this ask is the contract only, so the picker has something to build a settings input against
once it exists. `null` should behave exactly like "no signal" in §1: no crash, no error snackbar, just an absent recommendation.

---

## Not an ask

Nothing about the `activity-weather-dependency` lookup table itself needs to change — `LookupResponse`
(`id`, `text`, `sortOrder`) already carries everything `BacklogProfileForm.vue`'s select needs, and §1 above is deliberately designed so the frontend never has to
reason about lookup rows beyond comparing ids.
