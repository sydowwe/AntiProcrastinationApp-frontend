# D2 · Make `weatherDependency` mean something

- **Scope:** backlog + the D1 picker
- **Backend:** yes — the app has no weather source
- **Model / effort:** Sonnet 5, medium effort — small surface, but the contract needs care
- **Order:** after D1, which is where the payoff lands

---

```
Every backlog entry carries a weatherDependency lookup (activity-weather-dependency: sunny, snow,
dry, none — see _locales/leisure.{sk,en}.ts enums.weatherDependency). The user fills it in on every
single entry, and the app does exactly one thing with it: offers it as a filter value. Nothing ever
tells the user it is sunny and here are the four things you saved for a sunny day.

Make the field earn itself.

1. A weather-aware suggestion signal. In the D1 picker, an activity whose weatherDependency
   matches today's actual conditions should rank up; one that needs snow in July should not
   surface at all. If D1 is not built yet, this prompt is still worth doing at a smaller scale:
   a "good for today" indicator on the backlog table.

2. Degrade honestly. Weather can be unavailable — no permission, no location, service down. When
   it is, the feature must vanish silently rather than showing a wrong or empty forecast, and the
   picker must rank exactly as it does today. Never block a suggestion on a weather call.

3. Do not over-build it. No forecast panel, no hourly chart, no weather page. This is one signal
   feeding one ranking plus a small badge. The leisure module is not a weather app.

THE APP HAS NO WEATHER DATA AND NO USER LOCATION. Check before assuming: grep for any existing
location/coordinates field on the user (src/core/user/dto/userAugmentation.ts holds this app's
preference fields, and src/_common/modules/user/ holds the framework User DTO). If there is none,
this needs both a location preference and a weather source.

Do not call a third-party weather API directly from the browser. src/_common/axiosConfig.ts's API
instance is the only HTTP path this app uses, an external call would need a key the frontend
cannot hold safely, and a strict-CSP or offline context would break it. The server proxies it.

So: build what stands on its own (the ranking hook, the badge, the graceful-absence path, the
locales), then write the backend ask to prompts/leisure/backend/D2-backend.md.

CONTRACT ONLY: the endpoint the frontend calls (method, route, request shape) and the fields it
reads back, with types and nullability, in the JSON naming the frontend fromJson reads. The
frontend needs a condition it can compare against the activity-weather-dependency lookup values —
say which lookup values it must map onto, and state whether it needs today only or a short
forecast. Do NOT specify which weather provider to use, how to cache it, how often to refresh it,
or how location is stored — those are the backend agent's decisions. If a location preference is
also needed, state it as a field the frontend reads and writes, nothing more.

Strings in _locales/leisure.{sk,en}.ts, SK primary. `npm run type-check` (baseline 72, do not add)
and `npm run lint` (0 errors).
```
