# U4 — One picture of the day, across all three trackers

**Contract only.** This states the endpoints the frontend calls and the response fields it consumes,
with types and nullability, in the JSON naming the frontend's `fromJson` reads. It says nothing about
entities, EF, migrations, indexes, or how any of it is computed or stored — this repo cannot see the
.NET solution, and a frontend guess about someone else's schema is worse than no input.

Read `backend/U3-backend.md` first. This document reuses its request base and its daily-window
semantics **verbatim** and does not restate them. Where the two could contradict each other, §7 says
so explicitly.

`backend/U5-backend.md` §2 deferred the shape of `focus-metrics` to this document. §6.6 settles it.

> **Status: implemented and answered.** All six routes landed with the §6 response fields; `sources`
> is required and non-empty on all of them, empty and unknown members both 400. The overlap rule is
> one implementation (`UnifiedMinuteMerger`): the three ledgers flatten onto a one-minute grid and
> each minute's sixty seconds are allocated in precedence order, foreground sources by rank first,
> then background-only ones. A source claims its **footprint** — wall clock observed — never its
> summed seconds, which is what makes §3.3's partial displacement work and what stops a desktop
> ledger with one foreground and three background processes from displacing itself when it is the
> only source selected. Every figure the client prints is read off one ledger rounded **once** with
> largest-remainder, so both §3.1 identities hold exactly rather than drifting on the busy days
> someone would actually check them.
>
> The four things §5 and §6 left to the implementer are answered inline below, and none of them moved
> the frontend: the client was already written against `label` as a single opaque identity string and
> never sums timeline sessions. §8's triplication proposal was **not** taken up and stays open — the
> only shape change was `BaseFocusMetricsEndpoint` becoming generic over its request so the merged
> route reuses the baseline arithmetic instead of a fourth transcription.
>
> Covered by `TrackingUnifiedDashboardTests` (12 tests), asserting on seconds rather than routes:
> both precedence levels, partial displacement, a deselected source giving the time back, the label
> join, device-change-is-not-a-switch, and non-overlapping lanes.

---

## 1. The change, in one line

The app has three dashboards, one per tracker, at `/activity-tracking`, `/activity-tracking/desktop`
and `/activity-tracking/android`. It has no view of a **day as it was actually lived**. A user who read
documentation in Chrome, wrote code in an IDE and then scrolled their phone has to open three pages
and add up by eye — and the sum is wrong, because the sources overlap in wall-clock time.

This adds a **fourth** dashboard at `/activity-tracking/unified`. The three existing ones stay exactly
as they are; nothing below changes any endpoint they call.

The frontend half is built and merged. It is wired against the shape below, so what lands here is the
data, not the screen.

## 2. Why this cannot be three requests merged in the browser

It was tried on paper and abandoned. Two reasons, and the second is the one that decides it:

1. **Cost.** Resolving overlap needs the raw intervals, so merging client-side means shipping three
   full timeline payloads to compute four summary numbers.
2. **The result depends on the question.** An hour in Chrome is attributed to the web extension while
   the desktop agent is also selected. Turn the extension off and that hour must come **back** to the
   desktop agent as `Google Chrome` — not vanish, and not stay credited to a source that is no longer
   on screen. A client filtering a pre-merged payload can only ever hide a lane. It cannot give the
   time back.

That is why `sources` (§4) is a **request field** and every change of it is a round trip.

## 3. The overlap rule — the hard part, stated as a requirement on the response

### 3.1 The invariants

These are what the client relies on. They are properties of the response, not instructions about how
to compute it.

- **Every returned interval is attributed to exactly one source.** Intervals attributed to different
  sources, within one request, are pairwise non-overlapping in wall-clock time.
- **The parts add up.** For a given request,
  `sum over selected sources of sources[].countedSeconds == pie-chart totals.totalSeconds`.
- **Each source can be checked against its own dashboard.** For each selected source,
  `countedSeconds + displacedSeconds` equals that source's own `pie-chart` `totals.totalSeconds` for
  the same span. This is the check a user will actually perform — the unified page prints
  `countedSeconds` and `displacedSeconds` side by side precisely so it can be performed — so if the
  two endpoints disagree, the page is visibly lying.
- **No two timeline sessions in different lanes overlap**, for the same reason: the three lanes are
  read top to bottom as one day, not as three transparencies laid over each other.

**Answered — held exactly, with one documented rounding seam.** Ownership of a contested minute is a
*share* (the sixty seconds split by precedence), but the timeline and the focus stream need a strict
partition, because a share cannot satisfy "no two lanes overlap". Those two therefore assign each
minute whole, to the largest shareholder. The consequence is frontend-visible and accepted: **a lane's
session seconds can differ by a second or two from the same source's chip figure.** The client never
sums timeline sessions and never prints the two side by side, so nothing on screen contradicts
itself — but do not "fix" one to match the other, because they are answering different questions.

The two arithmetic identities above are unaffected: they are read off the share ledger, rounded once
with largest-remainder rather than per item.

### 3.2 Which source wins — two levels, in this order

**Level 1 — foreground beats background.** An interval one source reports as *active* outranks an
interval another source reports as *background*, whatever their source rank. Android reports no
background time at all (`AndroidWindowApp` / `AndroidAppSummaryDto` carry a single `seconds`, and the
android dashboard hardcodes `backgroundSeconds: 0`), so all android time is in the active class.

**Level 2 — within one activity class, the more specific source wins:**

```
webExtension  >  desktop  >  android
```

- **Web extension over desktop** is the substantive half. They overlap constantly and predictably: an
  hour in Chrome is logged by the desktop agent as one `chrome.exe` process and by the extension as a
  set of domains. Keeping the process and dropping the domains discards the only information the
  overlap contains.
- **Desktop over android** is a tie-break, not a claim that one tracker is more truthful. They are
  different machines and rarely collide.

**Level 1 exists because level 2 alone gets a real case wrong.** A browser left open on a second
monitor while the user is on their phone is desktop *background* against android *foreground*; ranking
alone would credit the desktop and quietly delete the phone time. Ordering the two levels this way is
the whole reason the rule is worth writing down.

### 3.3 Partial overlap splits, it does not annihilate

Where a losing interval is only **partly** covered by a winning one, the uncovered part stays with the
loser and only the covered part is displaced. A three-hour desktop session that loses five minutes to
the extension keeps two hours fifty-five.

The consequence is worth stating outright because the tempting shortcut gets it wrong: **do not
suppress the desktop's browser process wholesale while the extension is selected.** Browser time the
extension could not see — a PDF viewer, a `chrome://` page, a window open before the extension started
— is genuine desktop time and must survive as `Google Chrome`. A merged day that shows both
`github.com` and `Google Chrome` is correct; one that shows no browser at all for an hour the user
spent in a browser is not.

**Answered — and the sub-minute question it raises was answered honestly.** A source that loses part of
a minute gives up that share of **every item it saw in that minute, proportionally**. Neither per-minute
ledger records where inside the minute each item sat, so charging the loss to the item most likely to
be the duplicate — the browser process, say — would be a guess presented as a fact. Spreading it is the
only claim the data supports.

### 3.4 A deselected source takes no part

A source that is not in the request's `sources` contributes nothing and displaces nothing:
`countedSeconds` and `displacedSeconds` are both `0` for it, and it is absent from every item's
`sources` array. It still appears in the `/sources` response with a truthful `hasData` (§6.1), which
is how the filter can tell the user there is phone data they are not looking at.

### 3.5 What the UI does with this, so you know what the fields are for

The unified page renders a chip per source carrying `countedSeconds`, and below them a line reading
*"1 h 12 min was recorded by two sources at once and is counted once"*, followed by one line per
displaced source naming who took the time, followed by a plain-language statement of §3.2. Without
`displacedSeconds` and `displacedTo` a merged total is unfalsifiable: a user seeing less time than the
three dashboards add up to cannot tell whether their Chrome hour was attributed to the extension,
halved, or dropped. Those two fields are the difference between a number and a claim.

## 4. Request

```
POST /activity-tracking/unified/{sources|summary-cards|pie-chart|stacked-bars|timeline|focus-metrics}
```

Every one binds the **same base as every other dashboard endpoint** — `dateFrom`, `dateTo`, `from`,
`to`, with the per-day time-of-day window semantics of `U3-backend.md` §2, the past-midnight rule
included and `to == from` meaning 24 hours per day. Nothing about the span is new here.

One added field, on all six:

| Field     | Type       | Null? | Meaning                                                       |
| --------- | ---------- | ----- | ------------------------------------------------------------- |
| `sources` | `string[]` | no    | non-empty; each one of `webExtension`, `desktop`, `android` |

An empty `sources` should **400** rather than defaulting to all three — it asks for a picture of
nothing, and the client never sends one (its filter refuses to turn off the last source). Unknown
members should 400 rather than being ignored, so a typo in a shared link fails loudly.

The client always sends `sources` in the order above, de-duplicated, whether the selection was built
by clicking or parsed from `?sources=desktop,android`. Treat it as a set regardless.

Per-endpoint additions, identical to their per-source equivalents:

| Endpoint         | Extra fields                                                                    |
| ---------------- | ------------------------------------------------------------------------------- |
| `sources`        | —                                                                               |
| `summary-cards`  | `baseline: string` (the `U3-backend.md` §5 enum), `topN: int?` (client sends 4) |
| `pie-chart`      | `minPercent: number?` (client sends 1)                                          |
| `stacked-bars`   | `windowMinutes: int` — the `U3-backend.md` §3 tiling rule verbatim              |
| `timeline`       | —                                                                               |
| `focus-metrics`  | `baseline: string?`, `focusGapSeconds: int` (client sends 120) — see §5         |

The 366-day span cap applies here too, and the client clamps a URL-seeded span to it before sending.

## 5. `label` — one identity string, and the join it asks for

**This is the second-largest ask in the document and the one with a visible failure mode.**

The three per-source contracts each carry *two* strings per item: an identifier (`domain` /
`processName` / `packageName`) and a display name (`domain` / `productName` / `appLabel`). The three
dashboards feed the **identifier** to the colour hash and show the **display name**. That is fine
while a screen shows one source.

Merged it is not. `slack.exe` and `com.Slack` hash to different hues, so one application arrives on
one page under one name in two colours, and the pie legend, the bar segments and the timeline swatches
each disagree with the others.

**The unified contract therefore carries exactly one identity string per item, `label`.** The client
displays it, keys selection on it, and derives its colour from it — one field, one call site
(`unifiedItemColor` in `composable/useActivitySources.ts`), so no surface can quietly re-pick.

What that asks of you: **the same application must arrive under the same `label` whichever source saw
it.** Only the server holds the mapping tables, so this is not a join the client can do.

**Where you cannot join two sources' items, give them different labels.** Two entries and two colours
is the correct outcome, not a failure — `youtube.com` in a browser and `YouTube` on a phone genuinely
may not be joinable, and inventing an identity the data does not support would be worse than showing
two. The requirement is only that the join is never *accidentally* missed for items you do have a
mapping for.

**Answered.** Desktop joins android on the **display name, case-insensitively** — `slack.exe`'s product
name against `com.slack`'s app label — with the highest-precedence spelling winning, so the label a
merged item wears is the desktop's. Web-extension domains join nothing: `github.com` and
`Google Chrome` stay two items, which is this section's own reasoning applied rather than an omission.

One thing the implementer got right that this document did not think to warn about: the join was
deliberately **not** routed through the pattern-mapping tables (`TrackerDesktopMapping` /
`TrackerAndroidMapping`). Those map an entry to an **Activity**, so joining through them would have
labelled Chrome "Deep work" — a category, not an application, and the wrong axis for this view
entirely. Worth remembering if anyone later proposes the mapping tables as a "better" join.

## 6. Responses

Only fields the client reads are listed. Anything else is ignored. All numeric fields are non-null
unless marked.

### 6.1 `sources` → array

Expected to contain **all three** sources on every response, selected or not.

| Field              | Type      | Null? | Meaning                                                                 |
| ------------------ | --------- | ----- | ----------------------------------------------------------------------- |
| `source`           | `string`  | no    | `webExtension` / `desktop` / `android`                                  |
| `hasData`          | `bool`    | absent → `false` | the source recorded **anything at all** in the span, *before* de-overlapping and *regardless of selection* |
| `countedSeconds`   | `number`  | absent → `0` | attributed to this source after the rule; `0` for a deselected source |
| `displacedSeconds` | `number`  | absent → `0` | recorded by this source, credited to another; `0` for a deselected source |
| `displacedTo`      | `string`  | **yes** — `null` when `displacedSeconds` is 0 | which source took them |

`hasData` is deliberately independent of selection and of displacement: a source whose every second
was displaced still has data, and that is a real finding the filter should not present as "not
connected".

If more than one source displaced time to more than one target, `displacedTo` names the one that took
the most — the client renders a single line per source. Splitting it further is not wanted.

### 6.2 `summary-cards` → array

`U3-backend.md` §4 applies unchanged, including the answered `baseline` semantics (per-day average
scaled by span length) and `isNew`. Two differences from the per-source shape:

| Field          | Type            | Null?                                          |
| -------------- | --------------- | ---------------------------------------------- |
| `label`        | `string`        | no — replaces `domain`/`productName`/`appLabel` |
| `active`       | `ActivityStat`  | **yes** — `null` renders as no activity        |
| `background`   | `ActivityStat`  | **yes** — always `null` for an item only android saw |
| `totalSeconds` | `number`        | no                                             |
| `isNew`        | `bool`          | absent → `false`                               |
| `sources`      | `string[]`      | absent → `[]` — which trackers contributed     |

`ActivityStat` is unchanged: `seconds` (non-null), `averageSeconds` (nullable), `percentChange`
(nullable).

### 6.3 `pie-chart` → object

```
{ "items": [...], "totals": {...} }
```

`items[]`: `label: string`, `activeSeconds`, `backgroundSeconds`, `totalSeconds`, `entries: int`,
`sources: string[]` (never empty for a returned item).

`totals` — **non-null and present even when `items` is empty**; the client reads it unconditionally:
`totalSeconds`, `activeSeconds`, `backgroundSeconds`, `totalItems: int`, `totalSessions: int`.

`totalItems` and `totalSessions` are **distinct counts over the whole span**, not sums of per-day
counts — the same requirement `U3-backend.md` §4 put on `totalDomains` and friends, and the same
failure mode: invisible on one day, sevenfold on a week. `totalSessions` counts a session split by the
overlap rule once.

**Answered.** `totalSessions` counts ledger sessions that survived the merge — an android session as
stored, and elsewhere a run of adjacent same-label minutes — so a session the rule split still counts
once, as asked.

### 6.4 `stacked-bars` → array of windows

`windowStart` / `windowEnd` (ISO-8601, non-null, `windowStart` unique across the response) and
`items` (absent → `[]`). The `U3-backend.md` §3 tiling rule applies verbatim, including truncation at
each day's `to`, because the chart rendering this is the same component and it generates its own empty
slots on that alignment. Windows with no activity may be omitted.

Item fields: `label`, `activeSeconds`, `backgroundSeconds`, `sources: string[]`.

**Items are merged by `label` within a window**, across sources — one entry per label per window, with
the seconds summed. A per-`(label, source)` split would draw the same application twice in one column
in the same colour, and the stacked bars have no room to explain why. The source dimension is carried
by the timeline's lanes and the filter's own totals, which is where it can be read.

### 6.5 `timeline` → object

```
{ "webExtensionSessions": [...], "desktopSessions": [...], "androidSessions": [...] }
```

Each key absent → `[]`. One array per source, because the merged timeline's lanes **are** the three
trackers — not the active/detail/background split the per-source timelines use. They render top to
bottom in the §3.2 precedence order, so the resolution reads down the chart.

Session fields: `id: int`, `label: string`, `startedAt`, `endedAt` (ISO-8601, non-null),
`durationSeconds: number`, `totalSeconds: number`, `url: string?`.

Note `label`, not `domain` — the frontend maps these itself rather than reusing the per-source
`fromJson`.

**Single day only.** `dateFrom == dateTo` always; reject a span with `400`, exactly as the per-source
timeline does per `U3-backend.md` §4. A merged month of sessions is even less legible than one
source's, and the client falls back to the stacked bars over a range through the same code path. If
range support is cheap it is still not wanted.

**`id` should be unique across the whole response, not merely within a lane.** Nothing in the current
client breaks on a collision — the three lanes are separate `v-for`s — but it is free insurance
against the day someone merges them, and a duplicate id there would silently drop a session.

**Answered — lanes are a strict partition, see §3.1.** Sessions here are built by assigning each
contested minute whole to its largest shareholder rather than by splitting it, because "no two lanes
overlap" cannot survive a shared minute. That is what makes a lane's seconds diverge slightly from the
same source's `countedSeconds`, and it is deliberate.

### 6.6 `focus-metrics` → object

**`U5-backend.md` settles the shape; nothing about it changes here.** Same response object
(`sessionCount`, `daysWithActivity`, `switchCount`, `medianSessionSeconds`, `longestGapSeconds`,
`longestBlock`, `baseline`), same nullability, same rule that `baseline` carries comparable averages
and never a `percentChange`, same `focusGapSeconds` travelling in the request. `longestBlock.label` is
the unified `label` of §5.

`U5-backend.md` §2 asked that this not be settled twice. It is settled here as **a fifth route beside
the three, not a replacement**: `POST /activity-tracking/unified/focus-metrics`. The three per-source
routes stay, because the three per-source dashboards stay.

Two definitions the merge makes ambiguous, which only this document can pin down:

- **A switch is a change of `label` in the merged, de-overlapped, primary stream, in time order,
  regardless of which source each side came from.** Putting the laptop down and picking up the phone
  *is* a switch — that is the fragmentation the merged view exists to show, and it is precisely what
  no per-source dashboard can see.
- **Consecutive sessions on the same `label` from *different* sources are NOT a switch.** Moving from
  Slack on the desktop to Slack on the phone is a device change, not a change of what is being
  attended to, and counting it would make the merged switch count read as worse attention than the
  reality.

By the same reading, `longestBlock` may span sources: a run on one `label` continues across a device
change, subject to the same `focusGapSeconds` tolerance.

`U5-backend.md` §4's range rule still holds — every measure is computed over the union of the per-day
windows, never across the night between them.

## 7. Where this could contradict `U3-backend.md`, and does not

Checked deliberately, since the two hit the same surface:

| Question                     | Answer here                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| Request base                 | Identical. §2 of that document, unchanged, `sources` added.            |
| `windowMinutes` + tiling     | Identical. Same client component renders both.                          |
| Timeline over a range        | Identical: rejected with 400; the client never sends one.               |
| 366-day cap                  | Identical.                                                             |
| `baseline` over a span       | Identical — the answered option 1, per-day average scaled by span length. |
| Details endpoints            | **Not extended.** The merged pie's details panel is served entirely from `pie-chart`'s own item fields; no unified counterpart to `domain-details` / `process-details` is asked for. |

## 8. The triplication — a proposal, with the frontend's reasoning

`U3-backend.md` §6 raised this and deferred it here on the grounds that U4 would have an opinion. It
does, and the opinion is now backed by having built the thing that pays for the divergence.

**The state of it.** Three request families (`PieChartRequest` / `DesktopPieChartRequest` /
`AndroidPieChartRequest`, and the same again for summary-cards, stacked-bars and timeline) are
**structurally identical** — they differ in nothing but their class name; all three already extend one
`ActivityRangeRequest` on the client. Three response families differ in exactly two things: one label
field (`domain` / `productName` / `appLabel`) and android's missing `backgroundSeconds`.

**Why the frontend can speak to this with authority.** It is the component adapting all three. Every
per-source dashboard already normalises its responses into one shared view-model before rendering —
`SummaryCardsData`, `StackedBarsInputWindow`, `TimelineSessionDto`, `PieSegment` — because the four
chart components are source-agnostic and always were. The divergence is carried entirely in mapping
functions that exist only to delete it. `FocusMetricsRequest` is already **one class for all three
sources** and has caused no trouble, which is the existence proof.

**The proposal.** One route per dashboard with the source as a parameter, and a single item shape
carrying `key` (the stable identifier: domain / processName / packageName) plus `label` (the display
name: domain / productName / appLabel). Android returns `backgroundSeconds: 0` rather than omitting
it, so the shape is uniform.

**What it costs and what it buys.** Roughly 40 DTO files in `src/core/activityTracking/dto/` collapse.
More usefully, the drift stops: the three families have already diverged once (android's missing
`backgroundSeconds` is the scar) and nothing prevents the next one.

**Two honest caveats:**

1. The unified endpoints in this document do **not** depend on it. They are specified against their
   own shape and can ship first. If the collapse happens later, the unified routes become the
   `source: "all"` case of the same family rather than a separate one, and the client's mapping layer
   absorbs that.
2. The unified contract's `label` (§5) is deliberately **not** the `key`/`label` pair proposed here.
   Merged, one identity string is the point — a `key` that differs per source is exactly the thing
   that puts one application on screen in two colours. Both can be true: per-source responses carry
   the pair, the unified response carries the joined single string.

**This is a proposal with a reason, not a requirement. The decision is yours.** Nothing in this run
deleted any of the existing DTO files.

**Still open.** The unified routes shipped without it, as caveat 1 anticipated. The only shape change
made alongside them was `BaseFocusMetricsEndpoint` becoming generic over its request, so the merged
route reuses the baseline arithmetic rather than transcribing it a fourth time; the three per-source
endpoints changed signature only. If the collapse is ever taken up, the ~40 client DTO files are still
there to collapse with it and the unified routes become the `source: "all"` case of the same family.

## 9. Suggested order, if it helps

`sources` and `pie-chart` alone make the page useful — the filter, the overlap note and the "where did
the day go" answer all come from those two. `summary-cards` and `stacked-bars` next. `timeline` and
`focus-metrics` last; both degrade gracefully, and the client already renders a per-panel failure
state rather than breaking the page, so a partial rollout is visible but not broken.
