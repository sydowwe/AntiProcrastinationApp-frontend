# X4 — narrow-viewport pass (template)

You are running **one group** of the X4 cross-cutting check: every view in your group, at phone width. Your group
file (the file the operator pasted, which pointed you here) names the units, views, routes, account and
group-specific traps. This file is the procedure.

**Every one of these views already has a desktop inventory and a findings file.** You don't re-document the
view. You document **what changes, and what breaks, below Vuetify's `md` breakpoint (960 px)**. Anything that is
equally wrong at desktop width is already filed, or out of scope for you.

## Hard constraints

- **Read-only.** Open dialogs and menus to look at them, then cancel. Never submit, save, delete, toggle a
  checkbox, start a timer or drag anything. **No reseed.** If a view can only be judged with a mutation, write it
  as a `U` (unverified) finding saying what you would need to do.
- **Don't fix anything.** Don't edit `src/`, `src/_common/` or any spec.
- **Write only** the unit docs your group file names (see *Deliverables*), plus screenshots in each unit's
  `docs/views/<unit>/screenshots/`.
- **This is a Windows machine.** Use the PowerShell tool for shell commands, never Bash.
- **Your own browser session:** every `playwright-cli` command carries `-s=x4-<group>`. Run
  `playwright-cli -s=x4-<group> close` when you finish.

## Setup

Follow CLAUDE.md's *Browser verification* section to sign in, with the account your group file names. Load the
state file into **your session only**, and save it back straight after the `reload`. A state file loaded twice
unsaved signs the account out everywhere.

Then set the viewport **before** doing anything else, and prove it took:

```
playwright-cli -s=x4-<group> resize 390 844
playwright-cli -s=x4-<group> reload
playwright-cli -s=x4-<group> eval "[innerWidth, innerHeight, matchMedia('(max-width: 959.98px)').matches]"
```

Expect `[390, 844, true]`. If it isn't, stop and report. Everything you'd write afterwards would describe the
desktop layout.

Re-check `innerWidth` after any `open`, `goto` to a new origin, or `state-load`, because a fresh page can reset it.

## Procedure, per view

Do the views in the order your group file lists them.

### 1. Land and look

Navigate, wait for the view's data to render (`find` its first data row or heading; don't trust the first
snapshot), then take **one** screenshot and **read it back**. That is the visual sweep: layout, clipping,
overlap, text that wraps into nonsense, controls pushed off-screen. A snapshot can't see any of it. If the sweep
finds nothing, say so in the view's block rather than leaving it out.

### 2. Measure horizontal overflow

Run this once per view, and again inside any dialog you open:

```
playwright-cli -s=x4-<group> eval "(() => { const w = innerWidth; const out = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > w + 1 && getComputedStyle(e).position !== 'fixed'; }).filter(e => !e.parentElement || e.parentElement.getBoundingClientRect().right <= w + 1).slice(0, 15).map(e => (e.className && typeof e.className === 'string' ? e.tagName.toLowerCase() + '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : e.tagName.toLowerCase()) + ' → ' + Math.round(e.getBoundingClientRect().right)); return { docScroll: document.documentElement.scrollWidth, innerWidth: w, offenders: out }; })()"
```

`docScroll > innerWidth` means the **page** scrolls sideways, which is always a finding. Offenders inside a
container that scrolls horizontally on purpose (a data table, a calendar strip, a chip row with
`overflow-x: auto`) are fine. Check the container's `overflow-x` before filing one.

### 3. Walk the controls

Go through the view's **Actions** table in its `inventory.md`. For each control, check that it is still:

- **present.** A control missing at mobile width is a finding unless something replaced it (an overflow menu, a
  bottom sheet). If something did, record the replacement.
- **reachable:** on screen or scrollable to, not under the app bar, a sticky footer, the `ActionBar` or the
  navigation drawer. Use `find` for the control, then `eval` its `getBoundingClientRect()` if in doubt.
- **usable without hover.** A phone has no hover. Search the view's components for `v-hover`, `@mouseenter`,
  `isHovering` and `:hover` rules that change `opacity`/`display`/`visibility`. An action revealed only on hover
  is unreachable on a phone.
- **big enough to tap:** at least 24×24 CSS px (WCAG 2.5.8), or 24 px of spacing around it. Measure icon-only
  buttons with `eval` on their bounding box. File one finding per control *type* (all row action icons), not
  one per row.

### 4. Open the view's dialogs and menus

Open each dialog listed under *Dialogs opened from here* in `inventory.md`, and the main overflow menu. For each,
check:

- It fits: full-screen, or within 390 px with no sideways scroll (re-run step 2 inside it).
- Its action buttons (Save, Cancel) are visible without scrolling, or reachable by scrolling **inside** the
  dialog.
- Nothing inside is clipped or overlapped, date and time pickers in particular.
- The on-screen keyboard: you can't show one, but a dialog whose Save button sits at the very bottom of an
  844 px-tall dialog will be hidden behind the keyboard. Note it as `U` if the layout makes that likely.

Then cancel. Don't submit.

### 5. Mobile-only behaviour

Search the view's components for Vuetify display breakpoints: `useDisplay`, `mobile`, `smAndDown`, `mdAndUp`,
`xs`, and `v-show`/`v-if` bound to them. Everything they hide at desktop width is visible now and has **never
been documented**. Inventory it: what appears, its locator, what it does. Some existing specs are waiting on
exactly these locators (`dayPlanner.spec.ts` has two `fixme`s for a mobile-only Day Details toggle).

If a component switches layout at a breakpoint other than `md`, say at `sm` (600 px), take one extra screenshot at
`resize 768 1024` for that view, read it back, then resize back to 390 × 844 and re-check `innerWidth`.

### 6. Console

`playwright-cli -s=x4-<group> console error` and `console info` (Vue warnings log at **info** level here, not
warning) after each view. A warning or error that appears only at this width is a finding. Don't re-report ones
the unit's `inventory.md` already lists.

## Deliverables

### A. Append to each unit's `inventory.md`

At the end of each view's section (before the next `### <ViewName>`), add:

```markdown
**Narrow viewport (390 × 844)** · checked <date> · commit `<short sha>`
![mobile](screenshots/<view>--mobile.png)
- layout: <what reflows, stacks, collapses or moves>
- mobile-only controls: <label — locator — does>, or "none"
- replaced controls: <desktop control → its mobile replacement>, or "none"
- overflow: <none | offenders, with the container>
- visual sweep: <what the read-back screenshot showed, or "nothing wrong">
```

Keep it short. The desktop section above it already describes the view.

### B. Append to each unit's `findings.md`

New findings go **below the existing ones**, in the format `PROMPT-TEMPLATE.md` §C defines (read that section).
Two differences:

- **Ids continue the file's numbering.** Find the highest existing number for each prefix (`B`, `A`, `P`, `U`…)
  and go on from there. Never reuse an id, not even one of a closed finding.
- **Every x4 finding says so:** title ends with ` (390 px)`, **Where** starts with `@390×844 ·`, and **Verify**
  starts with `playwright-cli resize 390 844` followed by a reload.

**File a shared-component defect once, in the unit that owns the component**, and list every affected view in
its **Where**. Your group file says who owns what. If it's a framework component (`src/_common/…`), tag the
title **[framework]** and file it in the first unit that shows it. Triage batches by root cause, and five copies
of one finding only make it re-derive that.

**Groups run one after another, so an earlier group may already have filed it.** Before filing any **[framework]**
finding, or a finding about a component another module owns, search every `docs/views/*/findings.md` and
`docs/views/_shell/inventory.md` for `(390 px)` entries naming the same component. If one exists, don't file a
copy. Add your views to its **Where** line instead, and say so in your final report.

**Don't re-file desktop defects.** Before filing, check whether the unit's `findings.md` already has it, at any
status. If a desktop finding is `fixed` but reproduces at mobile width only, that's a new finding. Name the
old id in **Root cause guess**.

Then:
- **Update the Tally line** so it's the arithmetic on every entry in the file. Count, don't add.
- **Append a Round history row:**
  `| <n> | <date> | \`<sha>\` | **x4 narrow viewport (390×844)** — <k> views checked; new: <ids, or "none">. |`

`_shell` is the exception: it has no `findings.md`. Its findings go under `## Findings` in
`docs/views/_shell/inventory.md`, in the same format.

## Severity at mobile width

Use `PROMPT-TEMPLATE.md`'s severities strictly. For this pass:

- `blocker`: the view's main task can't be done on a phone (the primary action is unreachable, or the page
  scrolls sideways so badly the content can't be read).
- `bug`: a control is unreachable or hidden behind something, a hover-only action, a dialog whose Save can't
  be reached.
- `a11y`: tap targets under 24 px, focus lost when a drawer or dialog opens.
- `polish`: awkward but usable: excess whitespace, wrapping titles, cramped chips.

Don't file "this would be nicer as a mobile-specific design". That's an opportunity at most, and only if it's
concrete.

## When you are done

End with **only** this:

```
X4: <group>
Viewport verified: 390×844 (innerWidth <n>)
Views checked: <n>/<n>   (list any you could not reach, and why)
Files touched: <paths>
Screenshots: <n>
New findings: <n> (blocker <n> · bug <n> · a11y <n> · polish <n> · opportunity <n> · unverified <n>)
Shared-component findings: <id in unit → views affected>, or none
Mobile-only controls documented: <n>   (name any that an existing fixme is waiting on)
Top findings:
1. <unit> <id> — <claim>
(up to 5)
```
