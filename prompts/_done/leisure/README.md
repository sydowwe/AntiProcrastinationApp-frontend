# Leisure module prompts

Improvements to `../../../src/core/leisure`, one self-contained prompt per file. Each is written to be pasted into a fresh session in this repo —
`../../../CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts (file paths, line numbers, existing composables, the exact DTO fields) rather
than restating conventions.

Same format and same backend convention as [`../todo-motivation`](../todo-motivation/README.md).

## The diagnosis

The leisure module is four disconnected CRUD tables over a schema that is much better than the UI on top of it. `ActivityBacklogProfile` alone records energy, effort
type, duration, location, weather dependency, cost tier and party size — the exact vocabulary needed to answer *"I have 45 minutes, low energy, indoors — what should
I do?"* — and the only thing the app does with any of it is offer it as a filter. `MemoryAnchor` already carries `hasBucketList` and `backlogIsOneTime`, so the
backend plainly models an anchor as the *completion* of a one-time experience, and the frontend does nothing with that at all.

So the feature prompts are mostly about **spending data the module already collects**, not about collecting more.

Underneath that there is a structural debt: `_common/composable/table/useServerTable.ts` does everything all four tables hand-roll — URL state, page-reset on filter
change, single-fetch coalescing — and **nothing in `../../../src` uses it yet**. The module also has no URL state anywhere, which `../../../CLAUDE.md` explicitly
requires.

## Index

| #  | Prompt                                                                    | Scope          | Backend | Model      | Effort   |
|----|---------------------------------------------------------------------------|----------------|---------|------------|----------|
| L1 | [Adopt `useServerTable`](L1-server-table-adoption.md)                     | module         | —       | Sonnet 5   | high     |
| L2 | [Correctness & type-safety pass](L2-correctness-pass.md)                  | module         | —       | Sonnet 5   | medium   |
| L3 | [Collapse duplicated filter inputs](L3-shared-inputs.md)                  | module         | —       | Sonnet 5   | low–med  |
| L4 | [Cold start: empty states & inline create](L4-onboarding-empty-states.md) | module         | maybe   | Sonnet 5   | medium   |
| D1 | ["What should I do right now?" ⭐](D1-what-should-i-do.md)                | new view       | yes     | **Opus 5** | high     |
| B1 | [Close the loop: bucket list → anchor ⭐](B1-close-the-loop.md)           | bucket/anchor  | likely  | **Opus 5** | high     |
| M1 | [Memory anchors as a timeline ⭐](M1-memory-timeline.md)                  | anchors        | likely  | **Opus 5** | high     |
| P1 | [Projects: surface the blocker](P1-readiness-board.md)                    | projects       | likely  | Sonnet 5   | med–high |
| B2 | [The comfort-zone ladder](B2-comfort-zone-ladder.md)                      | bucket list    | —       | Sonnet 5   | medium   |
| D2 | [Make `weatherDependency` mean something](D2-weather-aware.md)            | backlog/picker | yes     | Sonnet 5   | medium   |

## Confirmed defects, for the record

These are not speculative; each was verified while writing the set, and **L2** fixes all of them.

- **Rating scale is unreachable above 5.** `NewMemoryAnchorForm.vue` takes 1–10, `MemoryAnchorTable.vue` renders `/10` with thresholds at 8 and 5, but
  `MemoryAnchorsView.vue:37` filters `min:1 max:5`.
- **Three cross-module import violations.** `NewBacklogProfileForm.vue:89`, `NewBucketListProfileForm.vue:47` and `NewProjectProfileForm.vue:67` all import
  `@/core/activity/composable/UseActivitySelectOptions.ts` — `../../../CLAUDE.md` allows cross-module imports only via another module's `api/` or `dto/`.
- **`item as unknown as Record<string, LookupResponse>`** in `BacklogTable.vue:75`, plus eight `as number | null` template casts across the four views.
- **`useEntityCommand<LookupResponse, any, any>`** in `activityLookupApi.ts:12`.
- **`MemoryAnchorTable.vue:83`** does an `items.find()` by id to format a row the slot already holds, and ignores the DTO's own `periodKey` getter.
- **Minor, latent:** `leisure.{sk,en}.ts` owns a bare top-level `enums` namespace. Nothing else defines one today, but the aggregator spread in `SK.ts` is shallow,
  so the first other module to add `enums` silently replaces it wholesale.

## Backend-dependent prompts

**D1, D2, B1, M1, P1** (and possibly **L4**) need things the .NET side may not expose. The solution is not in this repo, so none of them can verify a contract from
here. Each therefore ends with the same instruction: **do all the frontend work that stands on its own first, then write the backend ask** to
`prompts/leisure/backend/<ID>-backend.md`.

That handoff file is **contract only** — the endpoint the frontend calls (method, route, request shape) and the DTO fields it consumes, with types and nullability,
in the JSON naming the frontend `fromJson` reads. Nothing else: no entities, no EF or migrations, no FK or cascade decisions, no business rules, no opinion on how a
value is computed or stored. The frontend knows exactly what it consumes and can state that with authority; anything past it would be a guess dressed as a spec.

Several may turn out to need nothing — `MemoryAnchorFilter` already has `year`, and `useEntityCommand` already exposes `patch`. Each prompt says explicitly: if the
existing API suffices, **do not create the file**, say so instead. Batch whatever files do appear into one backend session rather than opening five threads.

## How the model calls were made

**Opus 5, high effort** — D1, B1, M1. Each is a design problem with a small implementation attached, and the failure mode is a plausible screen that misses the
point: D1's whole deliverable is showing *three* suggestions instead of forty (Iyengar & Lepper) and committing the user to one; B1 has to get "done" semantics right
across two surfaces the backend already relates; M1 must look right when the user has three anchors, which is the state most sessions will be in for a year. A
cheaper model ships a filtered list, a checkbox and a full-year grid respectively — all type-clean, all wrong.

**Sonnet 5** — everything else. L1 is high effort despite being mechanical, because it moves filter ownership across the view/table boundary in four places
simultaneously and is the first adopter of a framework composable nothing else uses; get it wrong once and it is wrong four times. L2, L3 and L4 are bounded work
against located, verified defects. B2, D2 and P1 are small surfaces built on patterns already present in the file being edited.

**Nothing here is a Haiku job.** Every prompt either touches a shared framework composable or writes user-facing SK/EN copy where the register matters.

## Suggested order

**L1 → L2 → L3** first: every feature prompt edits files L1 rewrites, and doing the refactor afterwards means doing it four more times. L1 also delivers URL state,
which four of the feature prompts then depend on for view-mode toggles.

Then **D1 → B1 → M1**, the three ⭐ prompts, in that order — D1 is the module's missing purpose, B1 is its missing spine, M1 is its missing payoff. **L4, P1, B2**
are independent and can go any time after L1. **D2 is last**; it is the only prompt whose value depends entirely on another (D1) already existing.

## Considered, not written up

- **Anchor capture nudge** — prompting to create a memory anchor when a one-time activity is marked done in `activityHistory`. Genuinely good, but it depends on
  `activityHistory` internals this pass did not read, and a prompt written on an unverified assumption about another module is exactly what the rest of this set
  avoids. Worth writing after a read of that module.
- **A tabbed `/leisure` shell** — deliberately rejected. The four routes and their four sidebar entries stay as they are.
- **More filter fields.** The module's problem is not that it filters too little.
