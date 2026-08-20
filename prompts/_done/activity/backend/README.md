# Backend asks — activity module

**This directory starts empty on purpose.**

Nothing here is written up front. Each frontend prompt that might need server work ends with an
escalation block telling the implementing agent to write its ask *after* the frontend is built and its
fallback is shipped. The agent that hit the wall knows exactly which field was missing and which
nullability was wrong; that ask is sharper than one written from a cold read, and pre-writing
duplicates work the agent does anyway.

Expected to appear here:

| From | When | Subject |
|------|------|---------|
| [A8](../A8-quick-create-role-lookup.md) | always | a stable system key on activity roles, so quick-create stops resolving its role by English display name |
| [A9](../A9-archive-and-merge.md) | ✍️ **written, blocking** — [`A9-backend.md`](A9-backend.md) | archive semantics, merge semantics, and the reference rules only the backend knows. The frontend is built and every part of it is dead until these routes answer — unlike A8 there is no fallback |
| [A7](../A7-select-options-cache.md) | ✅ **answered** — [`A7-backend.md`](A7-backend.md) | `roleOption` nullability on `{source}/form-select-options`. All non-null, no backend change needed. Surfaced two frontend bugs: a wrong route in `ActivityOptionsSource` (fixed) and the always-empty priority/period dropdowns (open) |
| [A2](../A2-delete-dead-code.md) | only if the backend rejects the field | `icon` on the role/category create/update requests |

Name emitted files `A<n>-backend.md`, matching `prompts/activity-history/backend/H9-backend.md`.

## Scope rules

**Contract and business rules only.**

In scope:

- endpoint, method, route
- request shape
- response fields with types and **nullability**, in the JSON casing the frontend `fromJson` reads
- error responses and status codes for the failure cases the UI has to handle
- **business rules** — what a flag means to every other query, what counts as a reference, whether an
  operation is atomic, what happens in the collision cases. These are the substance of an ask like
  A9's and cannot be inferred from the frontend.
- what the frontend does with each field, so the backend can push back on anything costing more than
  it is worth

Out of scope — the .NET solution is not in this repo, so anything past the contract is a guess dressed
as a spec:

- entities, EF configuration, migrations, indexes
- FK and cascade decisions
- soft-delete-vs-flag, or any other storage opinion
- how a value is computed, cached or seeded

## Before writing one

State the problem and its live consequence before the ask. An ask that opens with the requested field
gives the backend agent no way to propose a better shape.

**Do not write an ask that confirms something already discoverable.** If the answer is in a sample
response, a 400 body, or five minutes with the running API, get it that way — a file here costs a whole
backend session's turn.

Batch whatever ends up here into one backend session rather than opening a thread per file.
