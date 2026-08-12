# U5 · Measure fragmentation, not just volume

- **Scope:** all three dashboards
- **Backend:** likely — emits `backend/U5-backend.md` only if the metrics genuinely cannot be derived from data already served
- **Model / effort:** Opus 5, high effort — the metric choice and its framing are the deliverable; the code is small
- **Depends on:** R2

---

```
Everything src/core/activityTracking/ currently shows is a VOLUME measure: seconds per domain,
seconds per process, seconds per app, plus a percent change against a baseline. For an
anti-procrastination app that is the less interesting half. Four hours split across sixty
context-switches and four hours in three blocks are the same number on every chart in this module,
and they are completely different days.

Add fragmentation and focus measures. Suggested, but argue with them if the data says otherwise:

- CONTEXT SWITCHES: count of distinct session starts in the window. Already derivable — the timeline
  endpoints return sessions with `startedAt` / `endedAt` / `durationSeconds`
  (TimelineSessionDto and its desktop/android equivalents).
- LONGEST FOCUSED BLOCK: the longest run of contiguous sessions on one domain/process/app,
  tolerating short gaps. The tolerance is a judgment call — a 20-second glance at another window
  does not end a focus block, a five-minute one does. Pick a threshold, name it in the code, and
  make it visible rather than magic.
- FRAGMENTATION: switches per productive hour, or median session length. Median beats mean here —
  the distribution is heavily skewed by long idle-ish sessions.
- LONGEST UNTRACKED GAP: component/timeline/dto/Gap.ts and GapDisplay.ts already exist and
  timelineUtils.ts already computes gaps for rendering. Surfacing the largest one as a number is
  nearly free.

WORK FROM WHAT IS ALREADY SERVED FIRST. The timeline response carries per-session start/end times,
so switches, median session length, longest block and largest gap are all computable client-side
today, for all three sources, with no contract change. Do that before asking the backend for
anything. Only escalate a metric to the backend if it genuinely needs data the client does not have
— a baseline comparison for these metrics ("your switching is up 30% vs your last 7 days") is the
clear case, since the client only ever holds one window.

If you find nothing that needs the backend, do not write a backend file. Saying "this needed no
contract change" is a better outcome than manufacturing an ask.

PRESENTATION — this is where the prompt can go wrong. These numbers are unusually easy to turn into
a scold. The app is for people who procrastinate; "you switched tasks 87 times today" delivered as a
red stat is exactly the kind of feedback that makes someone close the tab and not come back.
- Neutral framing, descriptive not evaluative. Report the number, not a verdict on it.
- No scores, no grades, no letter ratings, no "productivity percentage". No red-for-bad colour
  coding. Nothing that ranks a day as a failure.
- The comparison that is actually useful is against the user's own recent self, not an ideal.
- Prefer showing the shape (a longest-block figure next to a switch count) over a single composite
  index, which hides the mechanism and invites gaming.
Put them where they read as context: alongside the existing summary cards, or as a compact strip
above them. Not a new full-width hero panel.

Strings in _locales/activityTracking.{sk,en}.ts, SK primary, Write/Edit only (diacritics — see the
encoding rule in the global CLAUDE.md).

If a backend ask survives, write it to `prompts/activity-tracking/backend/U5-backend.md`, contract
only: endpoint, request shape, response fields with types and nullability in the JSON naming your
`fromJson` reads. No entities, no migrations, no opinion on how a value is computed — including the
focus-gap threshold, which is a frontend display decision unless the backend is computing the metric.

Run `npm run type-check` and `npm run lint`.
```
