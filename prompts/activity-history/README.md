# Activity history prompts

Improvements to `src/core/activityHistory/` and `src/core/historyDashboard/`, one self-contained prompt per
file. Each is written to be pasted into a fresh session in this repo — `CLAUDE.md` auto-loads there, so the
prompts carry only task-specific facts (file paths, line numbers, the exact duplication) rather than
restating conventions.

The two modules are treated as one unit because they are one feature: `historyDashboard` has no routes, no
views and no locale file — it is a component and DTO library that `activityHistory`'s views consume. H4
makes that relationship explicit instead of leaving it as an undocumented boundary violation.

## Index

| #   | Prompt                                                          | Scope        | Backend | Model      | Effort   |
|-----|-----------------------------------------------------------------|--------------|---------|------------|----------|
| H1  | [Correctness sweep ⭐](H1-correctness-sweep.md)                  | both         | —       | Sonnet 5   | medium   |
| H2  | [Delete dead filter/alarm code](H2-delete-dead-code.md)          | activityHistory | —    | Sonnet 5   | low      |
| H3  | [Shared dashboard composable ⭐](H3-shared-dashboard-composable.md) | both      | —       | **Opus 5** | high     |
| H4  | [Chart module boundary](H4-module-boundary.md)                  | both         | —       | **Opus 5** | high     |
| H5  | [i18n pass](H5-i18n-pass.md)                                    | both         | —       | Sonnet 5   | med–high |
| H6  | [URL state + drill-through](H6-url-state-and-drilldown.md)      | activityHistory | —    | Sonnet 5   | medium   |
| H7  | [Empty states & first run](H7-empty-states.md)                  | both         | —       | Sonnet 5   | low–med  |
| H8  | [Export the visible history](H8-export.md)                      | both         | —       | Sonnet 5   | medium   |
| H9  | [Durable running timers ⭐](H9-durable-timers.md)                | activityHistory | —    | **Opus 5** | high     |
| H10 | [Insights](H10-insights.md)                                     | historyDashboard | yes  | **Opus 5** | high     |
| H11 | [Alarm with the tab closed](H11-timer-end-notifications.md)     | activityHistory | yes  | Sonnet 5   | med–high |

⭐ = largest payoff. **H9 is the single most valuable item here** — a running timer is currently destroyed by
any navigation or reload, silently, with the elapsed time unrecoverable. Everything else is polish by
comparison.

## Suggested order

**H1 → H2** (in parallel; they don't overlap) **→ H3 → H4 → H5**, then **H6 → H7 → H8** in any order.

**H9 is independent of all of it** — it touches the three timer views, which none of the other prompts go
near. Run it whenever, including first if you want the win early. Its only dependency is H1, which fixes
three real defects in those same files (items 5-7).

**H10 last.** It builds on the settled composable and locale files, and it is the only one whose value is
uncertain up front.

## Backend

Two contract asks are already written, because the gaps were identifiable from the frontend alone:

- [`backend/B1-group-ids.md`](backend/B1-group-ids.md) — dashboard group items are keyed by display name
  only. Names aren't unique, so two activities called "Reading" are one group to the UI, and rename reads as
  delete+create across periods. Asks for a `groupId` alongside the existing `name`.
- [`backend/B2-nullability-audit.md`](backend/B2-nullability-audit.md) — mostly a request for a written
  answer, not code. It documents the live crash where a null `wakeUpTime` blanks an entire calendar month,
  and asks for authoritative nullability across the dashboard responses. **Cheapest of the two; run it first.**

H10 emits its own `backend/H10-backend.md` as it finishes, and H11 emits `backend/H11-backend.md`. Batch
whatever exists into one backend session rather than opening a thread per file.

**H9 emitted nothing, deliberately.** It asked whether server-side timer sync was warranted and the answer was
no: the on-screen countdown has to be client-side either way, and the reconstruction is exact precisely because
it compares one device's clock against itself — a second authoritative device invents a clock-skew bug class
for a scenario (start on the phone, watch on the desktop) that barely happens. What H9 *did* leave standing is
that the alarm only rings if the tab is alive, which is a single-device failure and is what H11 is for. Reopen
sync only if it turns out someone genuinely bounces between devices on the same tracked task.

Every backend file is **contract only** — endpoint, method, route, request shape, and response fields with
types and nullability in the JSON casing the frontend `fromJson` reads. No entities, no EF or migrations, no
FK decisions, no opinion on how a value is computed. The .NET solution is not in this repo, so anything past
the contract would be a guess dressed as a spec.

## How the model calls were made

**Opus 5, high effort** — H3, H4, H9, H10. H3 and H4 are both "where does the seam go" problems where a wrong
answer gets torn out later. H9 is a data-loss fix across three different state machines and two embedding
contexts, where an implementation that drifts by seconds looks fine and is wrong. H10 is product design with
an implementation attached — the failure mode is shipping four more charts nobody reads.

**Sonnet 5** — H1, H2, H5, H6, H7, H8. Every defect in H1 is already located and diagnosed in the prompt;
H2 is mechanical deletion with a verification step; H5, H6 and H8 all follow a pattern that already exists
elsewhere in the repo. Bump H5 if the Slovak comes back stilted, and H7 if the empty-state copy reads as
scolding.

## Deliberately excluded

- **Merging HistorySummaryView and HistoryDetailView.** They answer different questions and will keep
  diverging. H3 deletes their duplication without merging them, which is the harder and correct version.
- **A server-side export endpoint.** The client already holds everything the export needs (H8).
- **Scores, streaks or badges on the history views.** Same reasoning the todo module used —
  Deci, Koestner & Ryan (1999), tangible extrinsic rewards undermine intrinsic motivation. See
  `prompts/todo-motivation/README.md`.
- **More chart types.** The module's problem is that it interprets nothing, not that it draws too little.
  That is H10's job, and H10 is capped at three insights.
