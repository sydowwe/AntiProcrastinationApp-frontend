# View documentation & audit pass — one unit

Paste this whole file into a fresh session, with the **Unit** block below filled in from the table in
[`README.md`](README.md). `../../CLAUDE.md` auto-loads in this repo, so the conventions are already in context —
this prompt carries only what is specific to the pass.

---

## Unit

> **Fill these five lines before pasting. Everything else in this prompt is fixed.**

- **Unit name:** `{{UNIT_NAME}}`
- **Module:** `{{MODULE}}`
- **Pass:** `{{PASS}}` — either `inventory` (read-only) or `mutation` (exercises create/edit/delete)
- **Views & routes:**
  ```
  {{ROUTES}}
  ```
- **Intent sources:** `{{PROMPT_SOURCES}}`
  (the `prompts/_done/<module>/` files that describe what this unit was built to do)

---

## Your job

Open every view in this unit in the real browser, exercise it, and write three documents describing
**what it is for**, **what is actually on the screen right now**, and **every gap between the two**.

You are documenting and auditing. You are **not** fixing anything.

## Hard constraints

1. **Do not edit any source file.** No changes under `src/`, `prompts/`, or config, and **no changes to existing
   files in `e2e/`**. The only files you create or modify are the ones listed under *Deliverables*, plus
   screenshots. If you find a one-line fix that is obviously correct, write it in the findings file as a
   suggestion — do not apply it.
2. **You own the browser exclusively** for this session. Do not assume any tab state from earlier work: call
   `tabs_context_mcp` first, then create your own tab.
3. **Never trigger a native dialog** (`alert`/`confirm`/`prompt`). It freezes the extension. App dialogs
   (`MyDialog` / `DialogHost`) are fine and are part of what you must document — browser-native ones are not.
4. **Stop after 3 failed attempts** at the same interaction. Write what you know into the findings file with
   `status: blocked`, and end the session with a report. Do not keep retrying or wander into other modules.
5. **Stay inside your unit.** If a control navigates to a view outside this unit, record the destination and
   navigate back. Do not start documenting it.
6. **Report every claim with evidence.** A finding without a route, a selector, and either a screenshot, a
   console line or a request/response is not a finding — it is a guess, and guesses do not go in the file.

## Before you start

1. Confirm the dev server is up at `https://localhost:3000` (**this exact origin** — the session cookie is bound
   to it; 3001/3002 are signed out and every guarded route will bounce to `/login`).
2. Navigate to `/` and confirm you are signed in and the UI renders in **English**. If it renders Slovak, stop
   and report — the account preference is wrong and the whole pass depends on it (see README, *Prerequisites*).
3. Read the intent sources listed in the Unit block. These describe what was built and why. Treat them as
   **claims to verify, not facts** — they are prompts that were written before the code, and some describe
   behaviour that never shipped or has since regressed. Verifying them is a large part of this pass's value.
4. Read `docs/views/glossary.md`. It defines the app's overlapping nouns — activity, task, item, profile,
   template, anchor — and which of them are the same row seen from a different module. **Use its vocabulary
   verbatim in your documents.** Two units describing the same concept in different words is the drift this
   file exists to prevent, and its "everything is about an Activity" table will stop you filing "these two
   look like duplicates" about a to-do item and a planner task.
5. Read `docs/views/_shell/inventory.md`. The nav bar, sidebar, user menu, breadcrumbs, notification bell,
   dialog host and snackbars are documented there **once**. Do not re-describe them per view — reference them,
   and only note where this unit's views differ from the shell baseline.

## Procedure, per view

**Write as you go — do not save the writing for the end.** Finish a view, write that view's sections into the
three documents on disk, *then* move to the next view. Create each file with its heading block on the first
view and append to it after each subsequent one.

This is not a stylistic preference. A crawl of a multi-view unit runs long, and the end of a long context is
the least reliable place to be composing a detailed document from memory of what you saw an hour ago. Writing
incrementally means each section is written while the page is still fresh, and means a session that gets
blocked or truncated still leaves everything it had already established. Never hold observations "to write up
later".

Work through the views in the order listed in the Unit block. For each one:

### 1. Land on it
Navigate to the route. If it takes params, use a **real seeded id** discovered from the list view, and also try
one deliberately invalid value (`/999999`, a malformed date) to see how it fails. Record both.

### 2. Screenshot
Save to `docs/views/{{UNIT_NAME}}/screenshots/<route-slug>.png`. Screenshot every distinct state you reach:
default, empty (if you can get to it), each dialog, each tab. Name them `<route-slug>--<state>.png`.

### 3. Inventory every interactive element
Walk the page systematically — header, filter panel, table/grid, each row, footer, floating buttons, and every
dialog you can open. For each element record:

| field | notes |
| --- | --- |
| label | the visible text, or the icon name if icon-only |
| kind | button / link / input / select / checkbox / toggle / draggable / row action / keyboard shortcut |
| selector | what you actually used to reach it — prefer role+name, fall back to test id, then CSS |
| what it does | observed, not assumed. Click it and see. |
| destination | route it navigates to, or dialog it opens, or "in place" |

**Icon-only controls are the priority.** Any interactive element you cannot address by an accessible name is
simultaneously an a11y defect, a documentation hole and an untestable element. Log every one as an `a11y`
finding with its location, and note the selector you had to fall back to.

Also record **keyboard affordances** you can find: arrow-key navigation, Enter-to-submit, Escape-to-close,
focus traps in dialogs, and whether arrow keys are correctly ignored while a text input has focus.

### 4. Inventory every readable surface
Separately from actions, record everything the view *shows*:

- **tables** — column list, which are sortable, filterable, editable inline; server- or client-paged; default sort
- **charts / graphs** — type, axes, series, what drives the range
- **calendars / grids** — granularity, what a cell represents, what the range control does
- **counters, badges, chips, progress bars, streaks, totals** — what number, computed from what
- **empty / loading / error states** — the exact copy shown, and how you triggered it

For each surface note whether the value is **raw** (straight from the API) or **derived** (computed client-side),
and which request populates it. This is the input to `docs/data-map.md` later, so be precise about field names.

### 5. Record state and dependencies
- URL params and query params the view reads or writes, and whether they survive a reload and a back-navigation
- which store(s) it reads, and whether data arrives via `ensureLoaded()` or a view-level fetch
- any user preference it depends on (`askBeforeDelete`, `firstDayOfWeek`, timezone, theme)
- anything it reads from or writes to `localStorage`, and whether it goes through `useUserScopedStorage`

### 6. Capture console and network, per view
For every view, record:
- console **errors and warnings** (filter out framework noise, but keep anything naming app code)
- any **4xx / 5xx** response, with the endpoint and the status
- **duplicate requests** — the same endpoint fired more than once for a single navigation or interaction
- requests that fire **while signed out** or before data is needed

The duplicate-request check is cheap and has caught real bugs in this app before. Do not skip it.

### 7. Mutation pass only
If **Pass** is `mutation`, additionally exercise the full lifecycle for this unit's entity: create → verify it
appears → edit → verify → delete → verify it is gone. While doing so, check:
- does the create/edit form validate, and what does it say on invalid input
- does a delete confirm, and does the confirmation say what will be lost (cascades **must** confirm and **must**
  state how many children go with them, regardless of the `askBeforeDelete` preference)
- does a success/error snackbar fire, and does it say something useful
- do counters, badges and lists elsewhere in the unit update afterwards, or go stale
- **clean up after yourself**: delete everything you created, and restore anything you edited. Note in the
  findings file anything you could not clean up.

## Deliverables

Everything for this unit lives in **one folder**, `docs/views/{{UNIT_NAME}}/`. Create it if needed. Use the
exact section headings below so the files stay diffable across runs and across units.

```
docs/views/{{UNIT_NAME}}/
  usecase.md
  inventory.md
  findings.md
  screenshots/
```

### A. `docs/views/{{UNIT_NAME}}/usecase.md`

What the unit is **for**. Survives a redesign. Written from the code plus the intent sources.

```markdown
# {{UNIT_NAME}} — use cases

## What this unit is for
<2–4 sentences. The user-facing job it does, in plain language.>

## Where it sits
<How a user gets here, what they were doing before, what they do next. Which other modules it touches.>

## Views

### <ViewName> (`<route>`)
**Purpose:** <one line>
**Who opens it and why:** <the situation that brings someone here>

**What the user can do**
- <capability, in user language — "reschedule a task by dragging it", not "emits update:modelValue">

**What the user can see, and the question it answers**
- <surface> — answers "<the question>"

**Depends on:** <preferences, other modules' data, settings that change its behaviour>

## Entity lifecycle
<Where this unit's entity is created, how it is edited, what deleting it destroys, what it cascades to.>

## Data this unit captures but does not spend
<Fields written or stored here that no view reads back. One line each. This section feeds docs/data-map.md —
if there are none, say so explicitly rather than omitting the heading.>
```

### B. `docs/views/{{UNIT_NAME}}/inventory.md`

What is **actually on screen right now**. Falsifiable by looking. Written from the browser, not from the code.

```markdown
# {{UNIT_NAME}} — inventory

> Captured <date> · locale EN · account `<email>` · commit `<short sha>`

## Views

### <ViewName> (`<route>`)
![<state>](screenshots/<file>.png)

**Route:** `<path>` · params: `<name: type, how resolved>` · guard: `<public | auth | admin>`
**Reached from:** <nav entry / link from view X / not linked from anywhere>

**Actions**
| label | kind | selector | does | destination |
| --- | --- | --- | --- | --- |

**Readable surfaces**
| surface | kind | contents | raw/derived | populated by |
| --- | --- | --- | --- | --- |

**States**
- empty: <copy, how triggered, or "not reachable with current seed">
- loading: <what shows>
- error: <what shows, how triggered>

**URL & persisted state**
- <param/query/localStorage key — behaviour on reload and on back>

**Dialogs opened from here**
- <dialog name> — <fields, buttons, what confirming does>

**Keyboard**
- <shortcut — effect, and whether it is suppressed while typing>

**Console & network**
- errors/warnings: <list, or "none">
- non-2xx: <endpoint — status, or "none">
- duplicate requests: <endpoint × N, or "none">

## Transitions out of this unit
| from | control | goes to |
| --- | --- | --- |
```

### C. `docs/views/{{UNIT_NAME}}/findings.md`

Every gap. One entry per finding, most severe first.

This file is **not** a one-shot report — it is the unit's living defect record. It gets read by a fixing agent,
then re-read by a retest pass that confirms fixes **without re-driving the whole unit**. Two fields exist for
those two readers, and both are mandatory:

- **`Status:`** — always `open` when you write it. Later rounds change it to `fixed`, `wontfix` or `stale`.
- **`Verify:`** — the shortest sequence that proves the finding is gone, ending in an observable pass
  condition. This is **not** the same as `Repro`: `Repro` demonstrates the bug, `Verify` is a check a later
  agent can run in under a minute without knowing anything else about this unit. Write it so it stands alone —
  full route, exact control, exact expected observation. "Console shows no AxiosError and the page renders a
  'list not found' message" is a verify condition. "Check it works" is not.

```markdown
# {{UNIT_NAME}} — findings

> Pass: {{PASS}} · captured <date> · commit `<short sha>`

**Tally:** blocker <n> · bug <n> · a11y <n> · polish <n> · opportunity <n> · unverified <n>

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | <date> | `<sha>` | initial {{PASS}} pass |

---

### <ID>. <one-line claim>
- **Status:** open
- **Severity:** blocker | bug | a11y | polish | opportunity | unverified
- **Where:** `<route>` → `<selector or file:line>`
- **Expected:** <what should happen, and where that expectation comes from — intent source, CLAUDE.md rule,
  or plain user sense. Name the source.>
- **Actual:** <what happened>
- **Evidence:** <screenshot path · console line · request + status>
- **Repro:** <numbered steps from a fresh load>
- **Verify:** <numbered steps + the observable condition that means it is fixed>
- **Root cause guess:** <optional — name it if several findings share one, e.g. "same missing `iconPicker`
  locale mirror as B2"; the triage step batches fixes by root cause, so say it when you see it>
- **Suggested fix:** <optional, one or two lines. Do not apply it.>
```

**Severity meanings — use them strictly:**

- `blocker` — the view is unusable, throws, or loses data
- `bug` — behaviour contradicts a stated intent, a CLAUDE.md rule, or plain sense
- `a11y` — unnameable control, missing label, focus trap, keyboard dead end
- `polish` — wording, alignment, inconsistency with sibling views
- `opportunity` — works as built, but the data or the UI is obviously underspent. **These become future feature
  prompts, so be concrete about what exists and what it could feed.**
- `unverified` — an intent-source claim you could not test with the current seed data. Say what data you'd need.

Do not inflate severity. A findings file with three real `bug` entries is worth more than one with thirty
`polish` entries, and the triage cost is paid by a human.

**The ID prefix must match the severity**, and the tally must be arithmetic on the entries below it:

| severity | prefix |
| --- | --- |
| blocker | `X` |
| bug | `B` |
| a11y | `A` |
| polish | `P` |
| opportunity | `O` |
| unverified | `U` |

A finding you downgrade to `unverified` gets renumbered to a `U` id — do not leave it wearing a `B`. Before you
write the tally line, count the entries by severity and check the numbers add up to the number of entries. (The
first run of this template shipped a findings file claiming `bug 3` with only two bugs, because a downgraded
`B3` was counted in both buckets.)

**Every finding must be observed in the browser.** Source code is corroboration for something you saw — it is
not a substitute for seeing it. If you find a defect by reading code and did not reproduce it in the UI, you
may still report it, but you must say so explicitly in the **Evidence** line ("source read only, not reproduced
in this pass") and drop the severity to `unverified`. A `Repro` block listing steps you did not actually
execute is the single easiest way to put a false finding in front of a human, and it costs them more to
disprove than it cost you to write.

### D. `e2e/tests/{{UNIT_NAME}}.draft.spec.ts` — **inventory pass only**

**Skip this entirely if Pass is `mutation`.** Lifecycle tests need a test-data strategy that is decided once
across all units, not improvised per unit.

You have just paid the expensive part of writing a Playwright test: you know which locator actually resolves and
what you have to wait for. Capture that now, while it is hot — but capture **only what cannot be wrong**.

**Write real assertions for the structural tier only.** These are facts about the app's shape, true by
observation, and no amount of triage changes them:

- the route loads and renders its primary surface
- a table's column headers, and which are sortable
- navigation: this control goes to that route
- a dialog opens, and Escape / Cancel closes it
- keyboard affordances (arrow-key nav, and that it is suppressed while an input has focus)
- URL/query state survives a reload and a back-navigation
- the empty state renders its copy when the list is empty

**Write `test.fixme()` stubs — named, with a one-line comment, body empty — for the semantic tier.** These
assert that a *value* or a *rule* is correct, which is exactly what a human still has to confirm:

- computed numbers (streaks, totals, plan-vs-actual, progress)
- what a confirmation dialog says, and whether it should appear at all
- ordering, ranking, filtering and suggestion logic
- anything you logged as a `bug` or `unverified` finding — **stub it, never assert it**

Follow the existing conventions exactly: import `{ expect, test }` from `../fixtures/auth`, use the
`authenticatedPage` fixture, and match the style of `e2e/tests/dayPlanner.spec.ts`. Prefer role+name locators;
where you had to fall back to a fragile selector, say so in a comment — that comment is the argument for adding
an `aria-label` later.

Then **run only your own file, once**:

```
npx playwright test tests/{{UNIT_NAME}}.draft.spec.ts
```
(from the `e2e/` directory). Do not run the whole suite. If a test you wrote fails, that is information: either
your locator is wrong (fix it) or you found a real defect (log it as a finding and downgrade the assertion to a
`fixme`). Report the pass/fail count. Leave the file named `.draft.spec.ts` — a human promotes it after triage.

**Two known facts about running it, so you do not re-diagnose them:**

- `webServer.ignoreHTTPSErrors: true` is already set in `e2e/playwright.config.ts`. Without it the readiness
  probe cannot see the self-signed-cert dev server and every run stalls to timeout. If you hit that symptom
  anyway, report it — do not "fix" the config.
- `e2e/global-setup.ts` calls `POST /test/seed` before any test. **If that endpoint does not exist on the
  backend, every run fails at global setup, before your spec is reached.** That is an environment gap, not a
  defect in your spec. If it happens: report it plainly, leave the spec file in place unrun, and do **not**
  edit `global-setup.ts` or the config to work around it. Say "spec written, not run — `/test/seed` missing".

## When you are done

End your session with **only** this, and nothing else — no restatement of the docs, no summary of the app:

```
Unit: {{UNIT_NAME}} · pass {{PASS}}
Files: <the doc paths, plus screenshot count, plus the draft spec if you wrote one>
Views covered: <n>/<n>   (list any you could not reach, and why)
Tally: blocker <n> · bug <n> · a11y <n> · polish <n> · opportunity <n> · unverified <n>
Draft spec: <n> passing · <n> fixme stubs   (or "n/a — mutation pass")
Top findings:
1. <id> — <one-line claim>
2. ...
(up to 5)
Cleanup: <mutation pass only — what you created and removed, and anything left behind>
Blocked on: <anything that stopped you, or "nothing">
```

The full detail lives in the files. Whoever reads this next reads the files; your report is only the index.
