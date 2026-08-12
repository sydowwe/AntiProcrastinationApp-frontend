# H10 · Responsive layout, keyboard, accessibility

- **Scope:** `src/core/home/view/HomeView.vue` (post-H3), all widgets
- **Backend:** none
- **Model / effort:** Opus 5, high — the layout has load-bearing flex/height reasoning that must be preserved, not replaced.
- **Depends on:** H3 (path), H4 (shell), H9 (changes what is in each region)
- **Unblocks:** nothing

---

```
--- 1. The bottom band is unusable on a phone ---

HomeView.vue's bottom band gives its three cards `cols="3"`, `cols="4"`, `cols="5"` with NO breakpoint
props, while the top row correctly uses `cols="12" md="6"`. So on a 390px-wide phone the quick-record
card is ~90px wide holding a stacked button with two lines of text plus three tonal buttons side by
side, and the activity pie chart gets ~130px.

The band's height is `flex: 0 1 clamp(240px, 33vh, 420px)` — on a phone in landscape, 33vh is under
200px for three cards that each need a header plus content.

Fix the breakpoints: full width stacked on xs/sm, the 3/4/5 split from md up. Then reconsider the
band height on small screens — a fixed-height band inside a viewport-height column stops making
sense once the page needs to scroll. On mobile, letting the page scroll normally is correct;
the whole-page no-scroll layout is a desktop affordance.

IMPORTANT: read the two long comments at HomeView.vue:26-32 and 38-39 before touching anything. They
record why the band uses `vh` rather than `%` (a percentage basis needs a definite height on every
ancestor up to VMain and silently falls back to content sizing) and why the VCols carry
`height: 100%`. That reasoning is correct and hard-won — do not delete those comments and do not
"simplify" the rules they explain. If your responsive changes make part of the reasoning obsolete,
update the comment to say what replaced it.

Also check NowBar at narrow widths: it is a single `d-flex ga-4` row (line 15) holding the date
block, a divider, an avatar, the headline, up to three buttons and a menu. Nothing wraps and
`.nowbar__title` is `white-space: nowrap` with ellipsis (line 320), so on a phone the headline
collapses to almost nothing while the buttons keep their `size="large"`. It needs a genuinely
different arrangement below md, not just smaller buttons.

--- 2. Keyboard: the whole dashboard is mouse-only ---

This is the page an ADHD-audience app opens on, and the single most valuable interaction — "I am
starting the thing I am supposed to be doing" — takes a mouse trip to a button. Add shortcuts for
the focus task's primary actions:

  start / finish the focus task, track time on it, snooze, open today's planner

Bind them on the home view, not on `document` from inside a widget. Note the precedent and the
hazard: src/core/dayPlanner has a `usePlannerKeyboard` that binds document-level keydown per
instance — read it, reuse it if it fits, and do not repeat its per-instance binding mistake here.
Check @/_common/utils/keyboardUtils.ts first; if it already provides the binding primitive, use it.

Shortcuts must not fire while focus is in an input, and there must be a way to discover them —
at minimum, put the key in the button's `title`/tooltip. A hidden shortcut is a shortcut nobody uses.

--- 3. Accessibility ---

- `<button class="check">` (DayPlannerWidget, the tick control at lines ~160 and in each row) has no
  accessible name and no pressed state. It needs `aria-label` naming the task and
  `aria-pressed` reflecting done-ness.
- `.daystrip` is a purely visual timeline built from positioned divs with `title` attributes
  (DayPlannerWidget.vue:100-124). Screen readers get nothing usable. Either mark it
  `aria-hidden="true"` — legitimate, since the same information is in the list below it — or give it
  a proper role and label. Prefer aria-hidden; do not invent an ARIA widget pattern for a decoration.
- The `VIconBtn`s use `title` for their tooltip in some places (TodoListWidget.vue:10) and nothing at
  all in others (the `fa-up-right-from-square` buttons in all four widgets, which are named only by
  their icon). Every icon-only button needs an accessible name; H4's shell should render it once for
  the open-in-new button rather than each widget doing it.
- The colour-coded states — `.row--missed` (error tint), `.row--done` (opacity 0.45 + line-through),
  the `focus--missed` border — carry meaning by colour. Line-through is fine; the tint is not. Check
  contrast of `.focus__kicker` at `opacity`-reduced sizes and of `.gap` at `opacity: 0.35` against
  both themes; several of these will fail WCAG AA at their small sizes.
- Verify the whole page is reachable by Tab in a sensible order and that focus is visible on the
  custom `.check` buttons, which have their own styling and may have lost the outline.

--- Constraints ---

- Vuetify props and utility classes before custom CSS, per CLAUDE.md; the existing scoped CSS is
  there because no prop covers it, so extend in the same style rather than converting it.
- Do not change data, requests, or business logic anywhere in this prompt.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then: devtools device toolbar at 390×844
and 844×390 — every widget usable, nothing clipped, no horizontal scroll; Tab through the whole page
with the mouse untouched and reach every action; run an axe/Lighthouse accessibility pass and report
what remains.
```
