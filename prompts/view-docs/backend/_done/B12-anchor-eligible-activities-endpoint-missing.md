# B12 · Backend ask — `GET /memory-anchor/anchor-eligible-activities` does not exist

**Contract only.** How eligibility is computed is the backend's; this ask restates the contract
`B1-backend.md` assumed was already live, and the one question it left open.

> **Blocker** — `leisure-bucket-anchors/X3`. Written 2026-09-15 from `docs/views/_fix-queue.md` escalation
> §12. Source read in `AdhdTimeOrganizer` 2026-09-15.

---

## The problem

`prompts/_done/leisure/backend/B1-backend.md:5` states that `GET /memory-anchor/anchor-eligible-activities`
*"already knows which activities qualify"*. It never landed:

- No endpoint file under `AdhdTimeOrganizer.ActivityProfiles/application/endpoint/memoryAnchor/` declares
  it — the set is `GetById`, `GetSelectOptions`, `Grid`, `Create`, `Update`, `Delete`, `BatchDelete`.
- The string `anchor-eligible` appears in **no `.cs` file** in the solution.
- The observed response is a 400 — *"Value [anchor-eligible-activities] is not valid for a [Int64] property"*
  — which is `GetByIdMemoryAnchorEndpoint` catching the path as `/{id}`. The unit's guess (a route-ordering
  shadow) was wrong; this is what absence looks like from outside.

The client has called it since the leisure module shipped: `memoryAnchorApi.ts:31-34`
(`fetchAnchorEligibleActivities`), consumed by `NewMemoryAnchorForm.vue:110` on mount.

**What the user sees today:** the unlocked *Add* on `/leisure/memory-anchors` opens a form whose activity
picker spins forever — the mount fetch has no `try/finally` (app-side `F62`, landing regardless). Nothing can
be created from that path. The locked *"I did this"* path from the bucket list / backlog does **not** call this
endpoint and works.

## The business rules

The definition `B1-backend.md` gave, restated so it can be confirmed or corrected:

1. **Scope:** the caller's own activities, archived excluded.
2. **Eligible** = has a **one-time backlog profile** (`!IsRepeatable`) **or** a **bucket-list profile**.
3. **Open question `B1-backend.md:63` deliberately left to you:** does an activity that already has a memory
   anchor stay listed? The client's *"I did this"* flow suggests **no** — one anchor per experience — but
   the form does not enforce it and the `Create` validator is the place that would. Say which, and if "no",
   whether a second create is refused (and with what) or the picker simply omits it.
4. **Ordering:** by name is fine; the picker is a `VIdAutocomplete` and sorts nothing itself.

## The shape the frontend needs

`GET /memory-anchor/anchor-eligible-activities` → `SelectOption[]`, i.e. `[{ id: number, text: string }]`,
the same shape `GetSelectOptions` already returns. `SelectOption.listFromObjects` is the parser. An empty list
is a valid answer (the form has a "no eligible activities" fallback that `F62` makes reachable).

Called once per form open; not hot.

## What changes on the frontend once this lands

Nothing new — the call and the consumer already exist. `F62` (a `try/finally` and an honest failure message)
lands app-side either way, and its "failed" branch is currently what every user sees; once this endpoint
exists, that branch is for real failures only. `leisure-bucket-anchors/U1` (the locked path) is unaffected.
