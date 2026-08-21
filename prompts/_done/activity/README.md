# Activity prompts

Improvements to `../../../src/core/activity`, one self-contained prompt per file. Each is written to be pasted into a fresh session in this repo —
`../../../CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts (file paths, line numbers, the exact defect) rather than restating conventions.

This module is the app's spine and it shows: `ActivitySelectionForm.vue` has **10 consumers** in
`activityHistory` and `activityTracking`, `ActivitySelectOrQuickEditFormField.vue` has **4** in
`todoList` and `dayPlanner`, and three more files in `leisure` pull its select options. Nothing else in
`../../../src/core` is reused like this. Several prompts therefore edit files outside `../../../src/core/activity` — each says which, up front.

## Index

| #   | Prompt                                                        | Reaches outside the module       | Backend | Model      | Effort   |
|-----|---------------------------------------------------------------|----------------------------------|---------|------------|----------|
| A1  | [Correctness sweep ⭐](A1-correctness-sweep.md)               | no                               | —       | Sonnet 5   | medium   |
| A2  | [Delete dead code](A2-delete-dead-code.md)                    | no                               | maybe   | Sonnet 5   | low      |
| A3  | [One lookup table instead of three](A3-lookup-table-dedup.md) | no                               | —       | Sonnet 5   | medium   |
| A4  | [i18n pass](A4-i18n-pass.md)                                  | no                               | —       | Sonnet 5   | med–high |
| A5  | [URL state + filter behaviour](A5-url-state-and-filtering.md) | no                               | —       | Sonnet 5   | medium   |
| A6  | [Reshape the selection-form API ⭐](A6-selection-form-api.md) | **yes — 10 files, 2 modules**    | —       | **Opus 5** | high     |
| A7  | [Select-options cache ⭐](A7-select-options-cache.md)         | yes — leisure ×3                 | maybe   | **Opus 5** | high     |
| A8  | [Quick-create role lookup](A8-quick-create-role-lookup.md)    | yes — todoList ×2, dayPlanner ×2 | **yes** | Sonnet 5   | medium   |
| A9  | [Archive + merge duplicates](A9-archive-and-merge.md)         | no                               | **yes** | **Opus 5** | high     |
| A10 | [Picker UX](A10-picker-ux.md)                                 | no                               | —       | Sonnet 5   | medium   |

⭐ = largest payoff. **A1 is the one to run no matter what** — it fixes six live defects, two of which (the role/category filter that silently matches nothing, and
options that never cascade outside filter mode) are features the user believes they have and do not.

## Suggested order

**A1 ∥ A2** (parallel, no overlapping lines) **→ A3 → A4 ∥ A5.**

Then **A6**, on its own, with nothing else in flight — it touches 10 files across two other modules and a merge conflict there is expensive to untangle.

Then **A7 → A10**, and **A8** whenever (it is nearly self-contained).

**A9 last.** It depends on A3 and A7, it is the only one that cannot go live without server work, and it is the only one whose value is worth re-deciding once the
rest has landed — a picker that is fast (A7), ordered by recency (A10) and no longer manufacturing silent duplicates is a meaningfully different starting point for
the "do we need archiving?" question.

## Backend

**There are no pre-written backend files here, by design.** The agent doing the frontend writes the contract ask, as its last step, from what it actually built. A
contract written in advance describes fields nobody ended up reading; one written afterwards describes the request the client actually makes.

Three prompts are expected to emit one into `backend`:

- **A8** — always. A system-role key so quick-create stops resolving its role by English display name.
- **A9** — always, and it is the substantial one: archive semantics, merge semantics, and the reference rules that only the backend knows.
- **A7** — only if the nullability of `{source}/form-select-options` is still ambiguous after building the cache. **A2** likewise, only if the backend rejects an
  `icon` field on the role/category requests.

Every emitted file must be **contract only** — endpoint, method, route, request shape, and response fields with types and nullability in the JSON casing the frontend
`fromJson` reads. No entities, no EF or migrations, no FK decisions, no opinion on how a value is computed or stored. The .NET solution is not in this repo, so
anything past the contract is a guess dressed as a spec. Business *rules* are in scope and belong in the file (A9 in particular is mostly rules); business
*implementation* is not.

Batch whatever exists into one backend session rather than opening a thread per file.
`../activity-history/backend` has two worked examples of the format — B1 for a field ask, B2 for a "we need an authoritative answer" ask.

## How the model calls were made

**Opus 5, high effort** — A6, A7, A9. A6 and A7 are both "where does the seam go" problems whose wrong answer gets torn out later, and both fail in ways the type
checker cannot see: A6 because template-ref property access is not type-checked, A7 because a missed cache invalidation shows up as stale data three interactions
later, not as an error. A9 is product design with an irreversible operation attached.

**Sonnet 5** — A1, A2, A3, A4, A5, A8, A10. Every defect in A1 is already located and diagnosed in the prompt; A2 is mechanical deletion with a verification step per
item; A3's seam is stated; A4, A5 and A10 follow patterns that already exist elsewhere in the repo. Bump A4 if the Slovak comes back stilted, and A10 if the
empty-state copy reads as instructional.

## Deliberately excluded

- **Merging `activity` and `activityHistory`.** They are one feature to a user and two correctly separated modules in the code: one owns the taxonomy, one owns the
  records. A6 sharpens that line by moving `saveActivityToHistory` out of the activity module, which is the correct version of the urge to merge them.
- **Duplicate prevention at quick-create time.** Quick-create exists so the user does not have to stop and think; a "similar activity exists" interstitial converts a
  two-second action into a decision. A9 cleans up after the fact instead, where the user has the context to judge. Reasoning in A9.
- **A server-side "last used" field for picker ordering.** Recency is a per-device UI preference, not domain data. A10 keeps it in localStorage and falls back to
  alphabetical when it is missing.
- **Favourites, pinning, and fuzzy search on the picker.** Recency covers the same need without asking the user to curate anything, and Vuetify's substring filter is
  adequate at this list size.
- **Archiving roles and categories.** The same argument applies, but they number in the tens rather than the hundreds.
- **Any ranking of activities by "productivity" or virtue.** Out of bounds for this module, for the same reason the todo module ruled it out — Deci, Koestner & Ryan
  (1999), tangible extrinsic rewards undermine intrinsic motivation. See `prompts/todo-motivation/README.md`.
