# Todo list motivation prompts

Research-backed improvements to `src/core/todoList/`, one self-contained prompt per file. Each is written to be pasted into a fresh session in this repo —
`CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts (file paths, existing composables, the emit chain) rather than restating conventions.

Organising frame: Steel's 2007 *Psych Bulletin* meta-analysis, Temporal Motivation Theory — **Motivation = (Expectancy × Value) / (Impulsiveness × Delay)**. Most
todo apps only touch *Value*, the weakest lever. These mostly target *Delay* and *Expectancy*.

## Index

| #  | Prompt                                                     | Scope   | Backend | Model      | Effort   |
|----|------------------------------------------------------------|---------|---------|------------|----------|
| N1 | [Schedule-first ⭐](N1-schedule-first.md)                  | normal  | —       | **Opus 5** | high     |
| N2 | [Defuse the overdue guilt pile ⭐](N2-defuse-overdue.md)   | normal  | —       | **Opus 5** | high     |
| S1 | [Goal-gradient progress bars](S1-progress-bars.md)         | both    | —       | Sonnet 5   | low–med  |
| N3 | ["Today: pick 3" focus mode](N3-focus-mode.md)             | normal  | —       | Sonnet 5   | medium   |
| S2 | [One-tap "start 10 minutes"](S2-quick-start-timer.md)      | both    | —       | Sonnet 5   | medium   |
| R3 | [Reward rebalance](R3-reward-rebalance.md)                 | routine | —       | **Opus 5** | high     |
| R2 | [Fresh-start weekly review](R2-fresh-start-review.md)      | routine | —       | Sonnet 5   | med–high |
| S3 | [Estimate-vs-actual calibration](S3-estimate-vs-actual.md) | both    | likely  | Sonnet 5   | medium   |
| N4 | [Daily progress recap](N4-daily-recap.md)                  | normal  | likely  | Sonnet 5   | medium   |
| N5 | [Temptation bundling × leisure](N5-temptation-bundling.md) | normal  | yes     | **Opus 5** | high     |
| R1 | [Streak freeze](R1-streak-freeze.md)                       | routine | yes     | Sonnet 5   | medium   |

The normal list gets more prompts because it has more gaps: the routine list already has streaks, a heatmap, personal bests and confetti, while the normal list has
no motivational scaffolding at all.

## Backend-dependent prompts

Four prompts (**S3, N4, N5, R1**) need data the .NET side does not expose today. The .NET solution is not in this repo, so none of them can verify a contract from
here.

Each therefore ends with the same instruction: **do all the frontend work that stands on its own first, then write the backend ask** to
`prompts/todo-motivation/backend/<ID>-backend.md`.

That handoff file is **contract only** — the endpoint the frontend calls (method, route, request shape) and the DTO fields it consumes, with types and nullability,
in the JSON naming the frontend `fromJson` reads. Nothing else: no entities, no EF or migrations, no FK or cascade decisions, no business rules, no opinion on how a
value is computed or stored.

That boundary is deliberate. This repo cannot see the .NET solution, so anything past the contract would be a guess dressed as a spec, and a frontend agent's guess
about someone else's schema is worse than no input at all. The frontend knows exactly what it consumes — that part it can state with authority. Implementation is the
backend agent's call.

The point is that the frontend run produces the backend ask as an artifact, instead of halting and making you re-derive it later. Batch the four resulting files into
one backend session rather than opening four threads.

## How the model calls were made

**Opus 5, high effort** — N1, N2, N5, R3. What these share is that the *code* is small but the judgment is not: where to apply pressure in an existing UI, what tone
reads as supportive vs scolding in SK and EN, how to design across a module boundary under the
`api/`+`dto/`-only import rule. A cheaper model produces something that type-checks and misses the point. R3 is the clearest case — it's a classification task with
an implementation attached.

**Sonnet 5, medium effort** — S1, S2, S3, N3, N4, R1, R2. Well-bounded work against patterns that already exist in the file being edited (`useTodoListFilters.ts`
already does URL state; `BaseTodoListLogTimeController` already has a running-timer path). The backend-blocked ones (S3, N4, R1) are mostly investigate-and-report,
which doesn't need deep reasoning — just discipline about stopping instead of faking data.

**Nothing here is a Haiku job.** Every prompt touches a shared generic component or a user-facing motivational surface where a plausible-but-wrong result costs more
than the model savings.

Bump effort if a run comes back shallow — S2 and R2 are the likeliest to need it, since both depend on correctly finding existing machinery before writing anything.

## Suggested order

**N1 → N2 → S1 → N3 → S2**, then **R3 → R2**.

That front-loads the largest documented effects and everything needing zero backend work. **N4, N5, S3 and R1** all hit the .NET side. Each emits its own
`backend/<ID>-backend.md` as it finishes; run the four backend files as a single session once they exist.

## Deliberately excluded

- **Points, XP, badges, leaderboards** — Deci, Koestner & Ryan (1999): tangible extrinsic rewards undermine intrinsic motivation for activities of existing interest.
  Bad trade for an app meant to last years. See R3.
- **"Eat the frog"** — popular, thin evidence. Initiation ease matters more than ordering.
- **More categorisation** — categories, priorities, due states and three sort modes already exist. Organising is itself a documented procrastination behaviour.
