# Closing the feature opportunities: the prompts left after 2026-10-12

Written 2026-10-12, after the session that closed FO2, FO6 and FO7 inline (backend `882cdf5`, `bd3faa9`,
`8a2e0e4`; frontend `0317e802`). Source of truth for what each FO is: `docs/feature-opportunities.md`. Effort
rationale: `docs/feature-opportunities-effort.md`.

Each prompt is self-contained: paste one into a fresh session in this repo. They are split by what a session can
finish without waiting on anything, so that each one starts with only the context it needs.

## Order and dependencies

| # | Prompt | Repo | Model / effort | Waits on |
|---|---|---|---|---|
| 01 | [`01-fo4-next-free-slot-callers.md`](01-fo4-next-free-slot-callers.md) | frontend | Opus, medium | nothing |
| 02 | [`02-f4-02-time-away-backend.md`](02-f4-02-time-away-backend.md) | backend | Opus, **high** | FO6 committed (`bd3faa9`, done). No other session adding a migration at the same time |
| 03 | [`03-f4-02-time-away-frontend.md`](03-f4-02-time-away-frontend.md) | frontend | Opus, medium | 02 committed, its migration applied and the API restarted by the owner |
| 04 | [`04-planner-lanes.md`](04-planner-lanes.md) | frontend (+ possibly backend) | Opus, high | nothing. Owner decided on 2026-10-12 that it comes "later", so run it when wanted |
| e1 | [`e2e-fo1-away-days.md`](e2e-fo1-away-days.md) | e2e | Opus, medium | nothing |
| e2 | [`e2e-fo2-time-ticks-the-plan.md`](e2e-fo2-time-ticks-the-plan.md) | e2e | Opus, medium | API restarted on `882cdf5` or later |
| e4 | [`e2e-fo4-replan-today.md`](e2e-fo4-replan-today.md) | e2e | Opus, medium | 01 committed (its last block covers 01's two callers) |
| e6 | [`e2e-fo6-auto-placed-repeats.md`](e2e-fo6-auto-placed-repeats.md) | e2e | Opus, medium | API restarted on `bd3faa9` or later |
| e7 | [`e2e-fo7-trackers-card.md`](e2e-fo7-trackers-card.md) | e2e | Opus, medium | nothing (the column drop is invisible to clients) |

## Running the e2e prompts: one at a time, never in parallel

Five separate sessions keep each context small, but **they must run one after another**, not as parallel
subagents. They share one API, one seed database and one IP:

- `freshSeed` (and every `global-setup`) truncates the database under every other session.
- `POST /auth/login` is limited to **5 hits per minute per IP**, so a second cold sign-in burst 429s.
- A saved storage state is single-use once its token has expired. Two sessions loading one file revoke the
  account's sessions everywhere (`CLAUDE.md`, *a state file is single-use*).

Parallel runs would fail in ways that look like flaky tests. Writing the specs could be split up, but each spec is
written by driving the screen first, so in practice it is one session per spec, in sequence. Recommended order:
e1, e7, e6, e2, e4, so the ones with no pending work go first.

## Owner-only steps these prompts will hit

- **Migrations and API restarts are the owner's** (memory `project_api_migrations_manual.md`). A prompt that adds
  a migration writes it, reports its name, and stops. A prompt that needs new server behaviour checks the running
  API first (swagger, or one request) and stops with a clear message if it is stale.
- Committing never means pushing.

## Still open after all of these

- **FO8**: in early November, re-check the thresholds (5 to-dos / 3 routine occurrences / 5 sessions), the 90-day
  windows and F2-07's 70% share against real data. This cannot be done earlier, so it is not a prompt here.
- **F4 open question 4** (holiday weekdays in suggestion ranking and streaks) is not part of F4-02 and stays open.
