# F3. Cross-module joins

Read `prompts/feature-discovery/_RULES.md` first. Output: `docs/feature-discovery/F3-cross-module-joins.md`.

## The question

Each module holds part of the picture of a user's day, and no module sees the whole of it:

- **Planner:** what the user *meant* to do, and when.
- **To-dos and routines:** what they *committed* to, with estimates and due dates.
- **Activity history and timers:** what they *logged* doing, with sessions and outcomes.
- **Tracking (desktop, Android, web):** what they *actually* did on their devices.
- **Leisure:** what they do for rest and reward.

The most valuable insights for someone with ADHD sit **between** these: *meant vs did*, *estimated vs took*, *planned
focus vs tracked distraction*. Find the joins that would answer a question the user cares about, and that today no
endpoint can answer.

## Method

1. **Map the join keys that exist.** For each pair of modules, find what links their rows today. That may be a shared
   `activityId`, a date or time range, a foreign key such as `PlannerTask` → to-do item, or a mapping rule from tracking
   to an activity (`TrackerDesktopMapping` and the Android twin). Read the `*Configuration.cs` files. Produce a matrix:
   module × module → key (or "time overlap only", or "none").
2. **For each joinable pair, write the questions it could answer**, phrased as the user would ask them. For example:
   - "When I plan focus work in the morning, do I actually do it, or does tracking show YouTube?"
   - "Which of my to-dos always take twice as long as I estimate?"
   - "Do I skip routines on days the planner is overloaded?"
   - "Does leisure I logged on Saturday change how Monday goes?"
3. **Check whether any existing endpoint already answers each question**, fully or partly. Look in particular at the
   history dashboard (`historyDashboard`, `activityHistory`), the planner's `PlanVsActualTrendLine`, the daily recap,
   and the tracking unified views. Evidence in both repos.
4. **Keep the questions that need a new server-side query or aggregate.** For each one, state:
   - the join, as tables and keys, and whether it needs time-range overlap logic;
   - whether it should be computed on read, or precomputed by a job (data volume: tracking rows are high-frequency);
   - which existing view it extends, or whether it needs a new one.

## Be careful about

- **Join quality.** A join through "time overlap only" between a planned block and tracked activity is fuzzy. Say how
  fuzzy, and what the result means when the mapping from tracked apps to activities is incomplete (many tracked rows
  have no mapped activity).
- **Insight vs judgement.** "You planned 4h of focus and tracking shows 1h40m of it" can help or hurt. Note for each
  candidate how it should be framed so that it does not read as a verdict. F5 will weigh this.
- **Privacy across devices.** Tracking data is the most sensitive in the app. Flag any candidate that surfaces tracking
  data on a screen that did not show it before.

## Output

Follow `_RULES.md` § *Your output file*. Before *Candidates*, include the **join matrix** from step 1.
