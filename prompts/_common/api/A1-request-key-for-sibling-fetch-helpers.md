# A1 — give the three sibling fetch helpers a `requestKey`, and retire the workarounds

Hand this to a fresh session. Browser + running backend required. `CLAUDE.md` auto-loads.
Windows — use the **PowerShell tool**, never Bash.

---

## Why this exists

`useFetchFiltered` held **one `AbortController` per composable instance** and called
`controller?.abort()` at the top of every call. That is right for latest-wins — a filter panel where a
slow earlier response must not land after a fast later one — and wrong for anything concurrent: N calls
from one instance cancel each other, all but the last reject with `CanceledError`, and a `Promise.all`
over them rejects as a whole.

It was fixed on 2026-09-11 by keying the cancellation (`{ requestKey }`), after that exact bug left
`/day-planner/templates` rendering **zero cards behind a permanent loading overlay** as soon as a second
template existed. Read `src/_common/api/useFetchFiltered.ts` first — the implementation is ~20 lines and
this task is "do that three more times, then delete what it makes unnecessary".

**`useFetchFilteredSorted`, `useFetchSorted` and `useFetchFilteredTable` still have the old shape.**
That is not theoretical debt. The codebase has worked around it **four times**, each time by hand, and
the fifth call site to forget will reproduce the template-list bug somewhere else.

## Scope

### Part 1 — the framework change (low risk, do it first)

Add the same optional `requestKey` to:

- `src/_common/api/useFetchFilteredSorted.ts`
- `src/_common/api/useFetchSorted.ts`
- `src/_common/api/useFetchFilteredTable.ts`

Copy the shape from `useFetchFiltered.ts` exactly, including:

- a module-level `Symbol` as the default key, so a caller passing `'default'` cannot collide with it
- `Map<string | number | symbol, AbortController>`
- cleanup in a `finally`, **guarded by an identity check** (`if (controllers.get(key) === controller)`)
  so a superseded call cannot strand its replacement and the map cannot grow one entry per key forever

**This part changes nobody's behaviour.** Omitting the key must reproduce today's semantics exactly.
That is the whole reason it is safe to land on its own, and it is what makes Part 2 optional per site.

Update `src/_common/docs/api.md` in the same commit — it currently carries a note saying these three
still hold a single controller and still need the workarounds. That note must go.

### Part 2 — retire the workarounds (one at a time, verify each)

Four sites pay for the old behaviour. Each is *documented in a comment naming the cause*, so grep for
`aborts its previous` to find them if the line numbers have drifted:

| Site | What it does today |
| --- | --- |
| `src/core/leisure/view/MemoryAnchorsView.vue:~127` | builds its **own** api-composable instance purely to get a second `AbortController` |
| `src/core/leisure/view/BucketListView.vue:~169` | same |
| `src/core/leisure/view/BacklogView.vue:~137` | same |
| `src/core/leisure/composable/useExperiencedProgress.ts:~15, ~69` | requires its `fetch` to come from a separate instance, **and** runs two calls sequentially instead of `Promise.all` |

There is also a **fifth, unfixed** instance worth closing while you are here:
`POST /api/activity/grid` fires twice on `/activity-settings/activities`, the first `ERR_ABORTED`
(via `src/core/activity/composable/useLookupTable.ts` → `useFetchFilteredTable`).
`prompts/view-docs/UNIT-ORDER.md` currently tells sweep agents to expect it and not file it. Once keyed,
the redundant request should disappear and that line in `UNIT-ORDER.md` should be updated.

Prefer a key per logical query — an entity id, a panel name, `'table'` vs `'count'` — over inventing one
shared string.

## Hard constraints

1. **Default-preserving.** A caller that passes no key must behave exactly as before. Framework rule, and
   the reason Part 1 is safe: other apps consume this submodule and must keep working untouched.
2. **Two repos, two commits, in that order.** Commit inside `src/_common` first, then the app-side
   pointer bump. A pointer bump without the submodule commit is a broken checkout for everyone else.
   Do **not** push unless asked.
3. **Do not change the abort semantics themselves.** Superseding a request is correct and saves a round
   trip. This is about *scoping* the abort, not removing it.
4. **Do not "tidy" `useReminderTableErrors.ts` or `SchedulerJobsView.vue`.** Both mention cancellation,
   but they *handle* it deliberately — they classify a cancelled request so it does not surface as a
   table error. That is still correct after this change. Read them before touching them; they are not
   in the workaround table above for that reason.
5. **One workaround per commit in Part 2**, each verified in the browser. They are independent, and a
   regression in the leisure boards is much easier to attribute that way.

## Verification

This is the expensive half — four of these sites are screens, not units.

Drive them with `playwright-cli` per `CLAUDE.md` → *Browser verification*; prefer `find` over `snapshot`.
Sign in from the seed's `primaryUser`. For each site, before and after:

- `playwright-cli requests` — the superseded call should **stop appearing as `ERR_ABORTED`** where the
  two calls are genuinely independent, and should still abort where one really does supersede another
  (type into a filter, confirm the older request is still cancelled)
- `playwright-cli console error` — must stay empty. Note the interceptor no longer logs cancellations at
  all as of 2026-09-11, so a clean console does **not** by itself prove the abort is gone. Check
  `requests`, not the console.

| Site | Route |
| --- | --- |
| MemoryAnchorsView | `/leisure/anchors` |
| BucketListView | `/leisure/bucket-list` |
| BacklogView | `/leisure/backlog` |
| useExperiencedProgress | the progress readout on the backlog / bucket-list boards |
| useLookupTable | `/activity-settings/activities` |

> `/leisure/backlog` may still 500 on sort — that is [`B2`](../../view-docs/backend/B2-grid-500-on-unmapped-sortby.md),
> a backend issue, not yours. Check whether it has landed before treating an empty board as a regression.

Then:

- `npm run type-check` (`vue-tsc --build --force` — the `--force` matters) → **0**
- `npm run lint` → **0 errors**
- `npm test --prefix e2e` → the baseline is **63 passed · 34 skipped · 0 failed** against fixture
  `e2e-v2`, measured 2026-09-11. Re-measure on a clean tree before quoting it.

## Traps

- **A clean console proves nothing now.** The interceptor stopped logging deliberate cancellations, so
  the symptom that made this class visible is gone. `playwright-cli requests` is the instrument.
- **`useFetchFilteredTable` takes `FilteredTableConfig`, not `QueryConfig`**, and returns
  `{ items, itemsCount }`. Do not assume the three siblings are copy-paste identical to each other.
- **Removing a workaround is two edits, not one.** Deleting the second composable instance also means
  deleting the comment that explains why it existed — leaving it is worse than leaving the workaround,
  because the next reader will trust it.
- **`useExperiencedProgress` is the subtle one.** Its two calls are sequential *because* of this bug;
  making them concurrent changes timing that a visible readout depends on. Verify the fraction it renders
  is unchanged, not just that no error appears.
- **Do not add `requestKey` to `useEntityQuery`.** It already holds a separate controller per method
  (`fetchById`, `fetchAll`, …), which is the same idea expressed differently. Only the three listed
  helpers share one controller across every call.

## Report back with

1. Which of the four workarounds you retired, which you left, and why — leaving one is a legitimate
   outcome if its call site genuinely wants latest-wins.
2. The `requests` evidence per site, before and after.
3. Whether the `/activity-settings/activities` double-fire is gone, and the `UNIT-ORDER.md` line updated.
4. The full-suite figure before and after.
5. Anything you hit that suggests the keyed design is wrong for one of these helpers — it was designed
   against `useFetchFiltered`'s call sites only, and `useFetchFilteredTable`'s paginated shape is the
   most likely place for that to not fit.
