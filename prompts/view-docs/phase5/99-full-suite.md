# Phase 5 — full-suite run (last)

Run as **Opus 5, high effort, clean context.** Run **last**, after every other Phase 5 file is in `_done/`
(including `16-19-submodule`). Opus, because the failures left at this point are the order-dependent kind: they
pass alone and fail in the suite, and finding the test that leaks takes reasoning across files.

```
Every unit's Playwright specs have been promoted from draft, one unit per session, each run
alone. Nobody has yet run the whole suite as one, in order, against one seed. That's your job:
make the suite green as a whole, and stable across consecutive runs.

Read CLAUDE.md's "Writing e2e specs" and "Mutating specs" sections first. They're already in
your context. Also read prompts/view-docs/phase5/TEMPLATE.md §3 for the three kinds of failure
(locator drift / real regression / contamination) and how each is handled. The same rules
apply: edit only e2e/, never weaken an assertion, file real regressions as findings, don't
commit.

Steps:

1. Inventory. List e2e/tests/. There must be NO *.draft.spec.ts left. If one is, stop and name
   it, because its unit's Phase 5 session didn't finish. Run `npm run typecheck --prefix e2e`,
   which must report 0 errors.

2. Run the whole suite: `npm run test:e2e` from the repo root. Record passed / failed / fixme /
   skipped, the duration, and each failure's file and title.

3. For each failure, re-run its file alone. If it passes alone, it's contamination: find the
   earlier spec that leaves the state it trips on (files run alphabetically, workers: 1), and fix
   the WRITER, not the victim, per "Mutating specs". Remember that a 429 on /auth/login is the
   rate limit (5 per minute per IP), not a stuck form. If the suite's sign-ins bunch up, the
   answer is ordering or cached state, not a sleep.

4. Run the whole suite TWICE more, back to back. A test that passes on a fresh seed and fails on
   the second run is contamination too.

5. Report, in this order:
   - the three runs' numbers, and the duration of each;
   - every change you made, one line each, naming the writer you fixed;
   - every remaining fixme across the suite, grouped by finding id, with the finding's current
     Status. That's the list of known defects the suite is carrying;
   - findings you filed.

6. "Fold it into whatever runs on commit." NOTHING runs on commit in this repo today: there's no
   .github/workflows and no git hook. Don't install one. The suite needs a running API on a
   LOCAL Postgres (POST /api/test/seed only exists there) and the dev server on :3000, so a
   plain CI job or pre-commit hook can't run it. Write up the realistic options in your report,
   with the cost of each (for example: a manual `npm run test:e2e` before push, a pre-push hook
   that skips when the API is unreachable, a CI job with Postgres + API services), and recommend
   one. The operator decides.

End with only this:

    Phase 5: full suite
    Runs: <p/f/fixme/skip> · <p/f/fixme/skip> · <p/f/fixme/skip>   durations: <a> · <b> · <c>
    Contamination fixed: <n> (writers: <files>)
    Regressions filed: <ids, or none>
    Fixmes carried: <n> across <n> findings (open <n> · other <n>)
    Drafts left: 0
    On-commit recommendation: <one line>
```
