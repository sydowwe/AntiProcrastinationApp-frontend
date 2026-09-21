# B23 · Backend ask — an Android per-app detail read, the sibling of desktop's `process-details`

**Contract only.** One query endpoint over rows the Android dashboard already aggregates. Which of the figures
below are computed in SQL and which in memory is the backend's call; the shape and the rules are what the
client needs settled.

> Written 2026-09-21 from `docs/views/_fix-queue.md` → `F47` (*"a per-app session count is not on the wire … a
> backend ask, recorded under Deferred to opportunities"*) and *Deferred to opportunities* →
> `tracking-dashboards` item (1). Source: `tracking-dashboards/B2`, narrowed by *Contradictions* §79. **Not a
> defect and blocking nothing** — `F47` ships a local panel from the data already on the page. This is the
> feature the card's label promises and the local panel cannot deliver. Read `F47` and `F48` first; both say
> what the Android responses do *not* contain, and this ask must not contradict them.

---

## The problem

On `/activity-tracking/android`, every summary card is named *"View details for {app}"*
(`ActivityDomainCard.vue:8`) and selecting an app writes `?selected=` — but nothing on the wire can answer
that promise beyond what the pie already shows. `AndroidAppPieData` is `{ packageName, appLabel, seconds,
totalSeconds }` with `seconds == totalSeconds` by construction (`AndroidPieChartEndpoint.cs:57-58`, both
`g.Sum(x => x.DurationSeconds)`); `AndroidPieTotals.totalSessions` is span-wide; `AndroidAppSummaryDto.stat`
is the baseline comparison (`seconds`, `averageSeconds`, `percentChange`). There is **no per-app session
count, no first/last use, no session length and no per-device split anywhere in the Android responses.**

The desktop dashboard has exactly this read: `GET /activity-tracking/desktop/process-details`
(`DesktopProcessDetailsEndpoint.cs`) takes `processName`, `from`, `to` and the optional daily window
(`windowStartMinutes`/`windowEndMinutes`), restricts to the days' time-of-day window the pie was drawn with,
and returns totals plus two breakdowns (window titles, monitors). `DesktopPieChartSection.vue:169-188`
fetches it on selection. The Android section has no such watcher because there is nothing to call.

The rows exist. `AndroidSessionData` (`domain/model/entity/AndroidSessionData.cs`) is one row per session:
`DeviceId`, `PackageName`, `AppLabel`, `SessionStartUtc`, `SessionEndUtc`, `DurationSeconds` — so session
count, first/last use, mean and longest session, and a per-device split are one `GroupBy` over what
`AndroidPieChartEndpoint` already reads.

`F47` closes the *"opens no detail"* half locally: a panel with total, share of span and package name, from
`props.apps`. It says in so many words *"do **not** add an Android `details` fetch against an endpoint that
does not exist"*. This ask is that endpoint; once it exists, the panel grows the rows below.

## The business rules

1. **Mirror desktop's window semantics exactly.** Desktop restricts by `WindowStart` inside
   `[from, to)` and then by the daily time-of-day window through `ToDailyWindows(...).Restrict(...)`. Do the same
   keyed on `SessionStartUtc`, in the user's time zone (`IUserTimeZoneResolver`), so the panel explains the
   slice it was opened from rather than over-counting the nights the pie excluded. A session that *starts*
   inside the window counts whole; one that starts outside does not count at all — the same rule as desktop's
   entries, stated so the backend can correct it if session rows deserve clipping instead.
2. **404 when no rows match**, as desktop does (`"Process not found."`), so a stale `?selected=` on reload
   is a soft failure the panel can word, not an empty 200 it has to interpret.
3. **The folded-tail sentinel is not an app.** After `B16` the pie sends `packageName: "_other"` for the
   folded row; the client already refuses to select it (`ActivityPieChart.vue:150`) and will never ask.
   If it is asked anyway, 404 is the right answer — do not resolve it to anything.
4. **No Active/Background split.** `F48` established the Android source has none; the response must not
   invent `activeSeconds`/`backgroundSeconds` the way `DesktopProcessDetailsResponse` has them. Total is
   total.
5. **Devices are identities, not labels.** `DeviceId` is whatever the sync client sends. The client will
   render it verbatim; if there is a friendlier name on the sync payload, say so, otherwise the id is fine.

## The shape the frontend needs

`GET /activity-tracking/android/app-details?packageName=&from=&to=&windowStartMinutes=&windowEndMinutes=`
— same query parameters as desktop's, `packageName` in place of `processName`.

```json
{
  "packageName": "com.spotify.music",
  "appLabel": "Spotify",
  "totalSeconds": 5430,
  "sessions": 17,
  "firstUseUtc": "2026-09-14T06:12:40Z",
  "lastUseUtc": "2026-09-20T22:48:03Z",
  "meanSessionSeconds": 319,
  "longestSessionSeconds": 1810,
  "devices": [
    { "deviceId": "pixel-8-…", "totalSeconds": 5100, "sessions": 15 },
    { "deviceId": "tab-s9-…",  "totalSeconds": 330,  "sessions": 2 }
  ],
  "days": [
    { "date": "2026-09-14", "totalSeconds": 900, "sessions": 3 }
  ]
}
```

- `totalSeconds`, `sessions`, `firstUseUtc`, `lastUseUtc`, `meanSessionSeconds`, `longestSessionSeconds` —
  the header rows of the panel (`AndroidPieChartSection.vue`, the `selectedDetails` branch `F47` adds).
  `appLabel` is the first non-empty label among the rows, as desktop does for `productName`.
- `devices` — ordered by `totalSeconds` desc; the Android analogue of desktop's `monitorBreakdown`. One
  entry is the common case and the panel hides the list then.
- `days` — one entry per day **with rows** in the span, in the user's time zone, ordered by date; the
  analogue of desktop's `windowTitles` list. Optional: if it is the part that makes this expensive, drop it
  and say so — the panel renders without it.
- Not hot: one request per selection, a handful per session; the desktop twin has the same profile.

Nothing on the existing `pie-chart`, `summary-cards`, `stacked-bars`, `timeline` or `focus-metrics`
responses changes.

## What changes on the frontend once this lands

- `src/core/activityTracking/api/androidActivityTrackingApi.ts` gains `getAndroidAppDetails(...)` mirroring
  `getDesktopProcessDetails` (`desktopActivityTrackingApi.ts:75-91`), and a new
  `dto/response/android/AndroidAppDetailsResponse.ts` with `fromJson`.
- `AndroidPieChartSection.vue` gains the watcher `DesktopPieChartSection.vue:169-188` already has: on
  selection, fetch and render the six header figures plus the two lists **under** `F47`'s instant rows
  (total, share, package) — the local rows stay so the panel is never blank while the request is in flight,
  and the fetch is `_silent` like every other dashboard read, with the section's error/retry state on failure.
- `ActivityDomainCard`'s *"View details for Spotify"* stops being the one place in the app where that label
  is a lie (§80).
- `docs/views/_fix-queue.md` *Deferred to opportunities* → `tracking-dashboards` (1) closes;
  `tracking-dashboards.draft.spec.ts:126`'s `fixme` gains a second assertion — that selecting fires exactly
  one `GET …/app-details` and the panel shows a session count.

BACKEND RESPONSE (2026-09-21):

B23 — shipped. AndroidAppDetailsEndpoint (AdhdTimeOrganizer.Tracking/application/endpoint/android/query/),
pinned by TrackingDetailsEndpointsTests alongside its two siblings. Nothing on pie-chart, summary-cards,
stacked-bars, timeline or focus-metrics changed. API commit c00e64d.

Route

GET /api/activity-tracking/android/app-details
    ?packageName=com.spotify.music
    &from=2026-09-14T07:00:00Z
    &to=2026-09-20T15:00:00Z
    &windowStartMinutes=540      (optional, pair)
    &windowEndMinutes=1020       (optional, pair)

Identical query contract to desktop/process-details with packageName in place of processName. Same base
validator: to > from, span ≤ 31 days, window bounds 0–1439, both-or-neither on the window pair → 400
otherwise. packageName empty or > 255 chars → 400.

Response — exactly the shape you asked for

{
  "packageName": "com.spotify.music",
  "appLabel": "Spotify",
  "totalSeconds": 5430,
  "sessions": 17,
  "firstUseUtc": "2026-09-14T06:12:40Z",
  "lastUseUtc": "2026-09-20T22:48:03Z",
  "meanSessionSeconds": 319,
  "longestSessionSeconds": 1810,
  "devices": [
    { "deviceId": "pixel-8-…", "totalSeconds": 5100, "sessions": 15 },
    { "deviceId": "tab-s9-…",  "totalSeconds": 330,  "sessions": 2 }
  ],
  "days": [
    { "date": "2026-09-14", "totalSeconds": 900, "sessions": 3 }
  ]
}

Field notes:
- totalSeconds, meanSessionSeconds, longestSessionSeconds, and the per-entry totalSeconds are long on the wire
  (same as AndroidAppPieData.seconds); sessions counts are int.
- appLabel — first non-empty label among the rows, falling back to packageName (desktop's productName rule).
- firstUseUtc — earliest SessionStartUtc. lastUseUtc — latest SessionEndUtc, i.e. the last instant the app was
  in use, not the last session's start.
- meanSessionSeconds — totalSeconds / sessions, rounded down.
- devices — ordered totalSeconds desc. deviceId is the raw identity from the sync payload; there is no
  friendlier name on the wire (AndroidSyncRequest carries only deviceId), so render it verbatim as planned.
- days — kept, it was free. One entry per calendar day with rows, on the user's clock (a 00:30 Bratislava
  session is that local day, not the UTC day before), ordered by date (YYYY-MM-DD). Days inside the span with
  no rows have no entry.
- No activeSeconds / backgroundSeconds — consistent with F48.

Rules, as implemented

1. Window semantics mirror desktop exactly. Envelope read on SessionStartUtc ∈ [from, to), then restricted to
   the daily windows in the user's zone. A session counts whole by where it starts; one starting outside a
   window is dropped entirely. No clipping. Without the window pair the envelope is continuous (over-counts
   the nights, same as desktop).
2. 404 with "App not found." (problem+json, same shape as desktop's "Process not found.") when no rows match
   after the mask. A stale ?selected= on reload is a soft 404, not an empty 200.
3. packageName=_other → 404, short-circuited before any query. Never resolved to the folded rows.
4. Cross-user: package names are guessable, so rows are scoped by user id; an app only another user has is
   a 404.

FRONTEND HALF (2026-09-21):

Landed in `c2075f61`, with `F47` folded in — it had not landed either, so the panel was built once with both
halves.

- `api/androidActivityTrackingApi.ts` → `getAndroidAppDetails(packageName, from, to, dailyWindow?, signal?)`,
  `_silent`; `dto/response/android/AndroidAppDetailsResponse.ts` parses the two `*Utc` strings, keeps
  `days[].date` as the plain `YYYY-MM-DD`.
- `component/android/AndroidAppDetailsPanel.vue`: total / share of period / package instantly from the pie
  row, then sessions, average and longest session, first/last use, devices when > 1, days when > 1 with a
  *+ N more*. `AndroidPieChartSection.vue` owns the watcher (package + envelope, `AbortController`); a 404
  is worded *"No sessions of this app in the selected period"* with no retry, other failures get retry.
- The window pair is sent as the app already holds it — `windowEndMinutes=0` for the 07:00–00:00 default —
  and the server's over-midnight rule reads it correctly (verified: 200, one session on the seed day).
- `tracking-dashboards.draft.spec.ts` asserts one `GET …/app-details` per selection and a visible session
  count; `_fix-queue.md` §18 and `F47` are closed, bodies in the log.
- Seen on the way: the API on :8080 predated the commit, so the first call was a routing 404 with
  `content-length: 0` — the panel showed the soft sentence, which was right for the wrong reason. The
  endpoint's own 404 carries a problem+json body; that is how to tell them apart.
