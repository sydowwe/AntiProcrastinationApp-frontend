# Phase 5 — promote one unit's specs (template)

You are promoting **one unit's** Playwright specs from draft to permanent. Your unit file (the file the operator
pasted, which pointed you here) names the unit, its draft spec, the other spec files that cover the same views,
and any unit-specific traps. This file is the procedure.

The draft was written during the unit's inventory pass, while its agent still knew which locators resolved. It
holds real **structural** assertions, plus `test.fixme()` stubs for every **semantic** claim that pass wasn't
allowed to judge. Since then every finding has been triaged, most have been fixed, and the fixes have been
retested. Your job is to turn the stubs into assertions of the **correct** behaviour, make the file follow the
suite's conventions, and rename it.

## Hard constraints

- **Edit only `e2e/`.** Never touch `src/` or `src/_common/`. If a spec shows the app is wrong, the spec
  records it (see §3) and the app stays as it is.
- **Never weaken an assertion to make it pass.** A test that goes green by asserting less than the finding says
  is worse than a `fixme`, because it freezes the bug as expected behaviour. CLAUDE.md, *Writing e2e specs*: a
  real defect gets `test.fixme` plus a comment naming the finding id and the root cause.
- **You are the only session running specs.** The suite is `workers: 1` against one seeded database, and
  `global-setup.ts` reseeds on every run. A second session running specs at the same time corrupts yours. If the
  operator hasn't confirmed that, ask before your first run.
- **Don't commit.** Leave the changes in the working tree for the operator.
- **This is a Windows machine.** Use the PowerShell tool for shell commands, never Bash.

**CLAUDE.md's *Writing e2e specs — the conventions `e2e/` already holds* section is the style guide.** It's
already in your context. Re-read it before step 4.

## Running specs

From the repo root:

```
npm test --prefix e2e -- tests/<file>.spec.ts            # one file
npm test --prefix e2e -- tests/<a>.spec.ts tests/<b>.spec.ts
npm test --prefix e2e -- tests/<file>.spec.ts -g "<test title>"   # one test
npm run typecheck --prefix e2e
```

Every run reseeds first (global setup), about 2 s warm or ~26 s against a freshly started API. So don't loop a
single test dozens of times: batch your edits, then run.

**The first navigation of a run can fail on a fresh browser's certificate check** (`README.md`, prerequisite 4).
If only the first test of a run fails, and on navigation, re-run once before diagnosing. **`/auth/login` allows 5
hits per minute per IP.** A spec that signs in cold and is re-run within a minute will 429.

## Procedure

### 1. Baseline

Read the unit's `docs/views/<unit>/inventory.md` (for what's on screen and which locators resolve) and its
`findings.md` (for each finding's current `Status:`). Then run the unit's draft **and** every related spec your
unit file lists, together. Record passed / failed / fixme per file. That's your "before".

### 2. Walk every `test.fixme`

For each stub (in the draft, and in the related specs your unit file lists), find what it's waiting on. Usually
the comment names a finding id, otherwise match its title against `findings.md`. Then:

| the finding is… | do this |
| --- | --- |
| `fixed` (and retested) | Write the real assertion of the **fixed** behaviour, using the finding's `Expected:` and `Verify:` as the spec. Remove the `fixme`. Run it. |
| `open` | Keep the `fixme`. Make sure its comment names the finding id **and** the root cause in one line, per CLAUDE.md. Leave the body in place if it's already the right assertion. |
| `wontfix` | The current behaviour is the accepted one. Either assert it, with a comment saying it's deliberate and naming the id, or delete the stub if nothing about it is worth guarding. |
| `stale` | The claim no longer applies. Delete the stub and say why in your report. |
| no finding at all | It's a semantic claim nobody triaged. Decide the expected behaviour from `usecase.md` and the intent sources the unit's inventory names. If you can decide it, assert it. If you can't, keep the `fixme` with a comment saying what's undecided. Don't guess. |

A stub waiting on **data** ("needs a seeded X") is often unblocked now, because the fixture is well past the
version the draft was written against. Check `e2e/fixtures/seed.ts` for the field before keeping it.

A stub waiting on a **mobile viewport** is unblocked if the unit's `inventory.md` has a *Narrow viewport* block
(from the X4 pass) that names the locator. Put mobile tests in their own `describe` with
`test.use({ viewport: { width: 390, height: 844 } })`.

### 3. Fix the failing non-`fixme` tests

For each failure, decide which of three it is, and don't blur them:

- **Locator drift.** The UI moved and the behaviour is still right. Fix the locator. If you need to look at the
  page, drive it with `playwright-cli` in your own session (`-s=p5-<unit>`), per CLAUDE.md's *Browser
  verification* section, and copy the locator from its `### Ran Playwright code` block. Close the session when
  you're done.
- **A real regression.** The behaviour is wrong. Turn the test into a `test.fixme` whose comment names a
  finding, and **file that finding**: append it to `docs/views/<unit>/findings.md` in `PROMPT-TEMPLATE.md` §C's
  format, with the next free id for its prefix, `Status: open`, and the spec's test title in **Evidence**. Update
  the file's Tally and add a Round history row (`**phase 5 spec promotion** — new: <ids>`).
- **Contamination.** It passes alone and fails in the batch, or the other way round. Another test's writes are
  leaking into it. Fix it per CLAUDE.md's *Mutating specs* (create your own row through the API, or
  `freshSeed` + serial).

### 4. Bring the file up to convention

Against CLAUDE.md's *Writing e2e specs*, check at least these:

- imports from `'../fixtures/auth'`, never `@playwright/test`
- ids read off `seed`, not literals; dates from `seed.seedDateUtc` via `seedDateParam`, never `new Date()`
- counts asserted against `seed.counts.*`
- waits on the element about to be asserted, not on navigation
- every mutating test either creates its own row through the API or sits in a `freshSeed` + `serial` block
  (and a block that changes an *account* ends with `test.afterAll(reseed)`)
- one `describe` per surface, with the route in its title

### 5. Merge or rename

- If no permanent spec covers these views, `git mv` the draft to `<unit>.spec.ts`.
- If one already exists (your unit file says so), **merge** the draft into it: keep one test per behaviour, keep
  the better-written of any duplicate, and delete the draft with `git rm`. **One spec file per view or surface.**
  Two files asserting the same thing drift apart.
- Rename nothing else, and don't split or merge spec files your unit file doesn't name.

### 6. Prove it

1. `npm run typecheck --prefix e2e`: 0 errors.
2. Run the unit's final spec file(s) together, **twice in a row**. The second run catches tests that only pass
   against a fresh seed, which is the most common way a mutating spec breaks the suite later.
3. Every test passes, or is a `fixme` with a finding id.

## When you are done

End with **only** this:

```
Phase 5: <unit>
Files: <final spec path(s)> · removed: <draft path, merged files>
Before: <passed> passed · <failed> failed · <fixme> fixme
After:  <passed> passed · 0 failed · <fixme> fixme   (run twice: both green / <what differed>)
Fixmes resolved: <n> asserted · <n> deleted (stale/wontfix) · <n> kept (open: <ids>)
New findings filed: <ids, or none>
Locators changed: <n>
Typecheck: 0 errors
Notes for the full-suite run: <anything order-dependent, slow, or rate-limited, or "none">
```
