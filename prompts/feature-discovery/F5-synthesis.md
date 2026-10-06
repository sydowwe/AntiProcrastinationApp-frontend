# F5. Synthesis: rank the candidates

Read `prompts/feature-discovery/_RULES.md` first. Run this **after** all of these exist:
`docs/feature-discovery/F1-journey-gaps.md`, `F2-half-built-backend.md`, `F3-cross-module-joins.md`,
`F4-day-type-periods.md`. If one is missing, stop and say which.

Output: **`docs/feature-opportunities.md`**. It sits next to `docs/opportunities.md`, which covers frontend-only and
DTO-field work. This file covers features that need backend logic.

## Steps

0. **Check the inputs are current.** Each input's header names the backend and frontend commits it was swept or last
   rechecked at. Run `git log --oneline <that commit>..HEAD` in **both** repos (backend:
   `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`). If either repo has commits since then that touch the files an
   input cites, re-open those claims first. Cover the *Out of scope* lists too, not only the candidates: F1's bugs were
   all fixed while F1 still listed them as open. Record each change in place as a dated `Fixed since` / `Built since`
   note, the way F1–F4 already do. Do not silently drop it. All four were rechecked against backend `0409fa0` on
   2026-10-06.
1. **Merge.** Collect every candidate from F1–F4. Merge duplicates: F1 often finds the user's moment and F3 the join
   behind it, or F2 finds the half-built piece that serves an F1 gap. Keep the source ids (`from F1-03 + F2-05`).
2. **Re-check dedupe** against the `_RULES.md` list, and against `docs/opportunities.md` **as it is now**. The owner is
   implementing it in parallel, so some OPs may have landed. Check `git log --oneline -30` in both repos.
3. **Spot-check evidence.** For every candidate you rank in the top 8, re-open the one or two `file:line` claims it rests
   on, in both repos. Drop or downgrade any that do not hold, and say so in *Rejected*.
4. **Score each merged candidate** on:
   - **User value** for an ADHD user, against `_RULES.md` § *Who the user is*. Penalise guilt piles, nags and forms.
   - **Data readiness:** does it run on data already collected, or does it need new daily input?
   - **Backend cost** and **frontend cost**: S / M / L.
   - **Risk:** does it change the meaning of existing data, a migration on a hot table, or tracking-privacy exposure?
   - **Unlocks:** does it enable other candidates? (A period entity or a plan-vs-actual query might feed several.)
5. **Order them**, and group them into **build waves**: features that share a backend change go in the same wave.

## Output format

```
# Feature opportunities: needs backend logic

> Synthesised <date> · frontend <commit> · backend <commit> (dirty?) · inputs: docs/feature-discovery/F1–F4

## Top picks
<numbered, one or two sentences each: what the user gets, and why it ranks here>

## Build waves
<wave → candidates → the shared backend change → suggested order inside the wave>

### FO1. <title>
- **Source:** F1-03 + F2-05
- (the `_RULES.md` candidate fields, merged and tightened)
- **Score:** value H/M/L · data ready yes/partly/no · backend S/M/L · frontend S/M/L · risk H/M/L
- **Implementation split:** one session for both repos, or a separate backend agent, and why. Use one session for
  additive contract changes, and a separate backend agent when there is real domain logic, jobs or a migration on an
  existing table.
- **Model / effort** for the implementing session.

## Rejected
<merged from F1–F4's Rejected lists, plus anything you dropped. One line each, with the reason.>

## Out of scope, but noticed
<merged frontend-only items and bugs from F1–F4, deduped against docs/opportunities.md>
```

Keep it readable: a short list of strong candidates, not a dump of everything F1–F4 found. Anything that did not make the
cut goes in *Rejected* with its reason.

Do not delete `docs/feature-discovery/`. It is the evidence F5 rests on.
