# P8 · Make the planner grid usable without a mouse

- **Scope:** `component/BaseTaskBlock.vue`, `component/PlannerTasksColumn.vue`, `component/misc/SelectionActionBar.vue`, `composable/usePlannerKeyboard.ts`
- **Backend:** no
- **Model / effort:** **Opus 5**, high effort — the grid is a custom widget with no off-the-shelf ARIA pattern; getting it wrong is worse than leaving it
- **Run it:** after P1, which changes how the keyboard composable scopes itself

---

```
The whole of src/core/dayPlanner contains exactly one accessibility attribute: `:tabindex="0"` on
component/BaseTaskBlock.vue:15. No role, no aria-label, no aria-selected, anywhere in ~40 components.
The planner is a custom grid built from divs with pointerdown handlers, and to a screen reader it is
an unlabelled pile of focusable boxes.

Pointer handling itself is fine — the module uses pointerdown/pointermove throughout, so touch works.
This is about the semantic and keyboard layer only.

WHAT TO ADD

1. Task blocks (component/BaseTaskBlock.vue, and the two that build on it:
   component/normal/PlannerTaskBlock.vue and component/template/TemplatePlannerTaskBlock.vue).
   Each block needs an accessible name that a screen reader can actually use — activity name, time
   range, and status — not just the visible truncated text. Multi-select is a real state here
   (store.selectedTaskIds) and must be exposed, as must the background-task and conflict states that
   are currently colour-only. Note that colour-only status signalling appears in several places in
   this module; where you find it on a block, pair it with text or an attribute.

2. The grid container (component/PlannerTasksColumn.vue). Give the time grid a role that describes
   what it is, and make the time axis (component/misc/PlannerTimeColumn.vue) available as the
   positional context rather than decorative text.

3. Keyboard reachability. Today a task can be focused but the interactions are all pointer-driven or
   bound to a document-level listener in composable/usePlannerKeyboard.ts that ignores which element
   has focus. Focused-block keyboard equivalents are needed for at minimum: select/deselect, open
   edit, and delete. Arrow-key move already exists in usePlannerKeyboard — make it discoverable from
   a focused block rather than only as a hidden global.

4. Focus management on the surfaces that steal it: the action bars
   (component/misc/SelectionActionBar.vue, and the calendar bars under component/calendar/) appear on
   selection and vanish on clear. Focus must not be dropped into nowhere when a bar disappears.

CONSTRAINTS AND CAUTIONS
- Do not bolt on ARIA you have not reasoned about. A wrong role is worse than no role: if you cannot
  justify a grid/listbox/application pattern for this widget, use a simpler correct one and say why
  in your summary. State which pattern you chose and what you rejected.
- Every aria-label and every visually-hidden string is user-facing and goes through vue-i18n into
  _locales/dayPlanner.{sk,en}.ts (SK is primary). Do not hardcode English labels — that is the exact
  debt P4 exists to clear.
- The document-level keydown listener is being reworked by P1 (it double-fires in the split view).
  Build on P1's scoping rather than adding a second global listener. If P1 has not run, do not
  introduce a new document listener at all.
- src/_common is a git submodule and must not be edited. If a framework component blocks you, do the
  app-side fix and add the gap to migration-revision.md.
- No visual regression. This layer should be invisible to sighted mouse users.

VERIFY by actually keyboard-driving /day-planner/:date with the mouse untouched: tab to a block,
select it, open its dialog, close it, move it, delete it. Then check the accessible names with the
browser's accessibility inspector — not by reading your own markup. Report anything you could not
make reachable rather than claiming full coverage.

Run `npm run type-check` (baseline 72, all app-side in src/core) and `npm run lint` (0 errors).
```
