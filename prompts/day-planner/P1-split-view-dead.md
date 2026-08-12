# P1 · The split view never loads tasks

- **Scope:** `view/TemplateSplitView.vue`, `view/TemplateDayPlannerView.vue`, `composable/usePlannerKeyboard.ts`
- **Backend:** no
- **Model / effort:** **Opus 5**, high effort — three defects that interact; fixing the first the obvious way makes the third worse
- **Why first:** `/day-planner/templates/split` is a whole route that does nothing today. Every other prompt in this set edits around it.

---

```
Three confirmed defects in the day-planner template split view. Fix all three together — they
interact, and fixing the first in isolation makes the third worse.

DEFECT 1 — the split view is inert
src/core/dayPlanner/view/TemplateSplitView.vue renders two TemplateDayPlannerView instances and
passes each one :templateId (leftTemplateId / rightTemplateId) plus storeId="main"/"secondary".

But TemplateDayPlannerView declares ONLY:
    const { storeId = 'main', isSplitView = false } = defineProps<{ storeId?: ...; isSplitView?: boolean }>()
and derives its id from the route instead:
    const templateId = computed(() => (route.params.templateId ? parseInt(...) : null))

The split route is /day-planner/templates/split — it has no :templateId param. So templateId is
null in both panels, loadTasks() hits `if (templateId.value == null) return` and exits, and the
split view renders two empty grids forever. The :templateId the parent passes lands in $attrs and
is never read.

Fix: make templateId an actual optional prop that falls back to the route param, so the standalone
route (/day-planner/templates/:templateId) and the split route both work off one source of truth.
Everything downstream that reads templateId — TemplatePlannerPanel's :templateId, applyContext's
req.templateId = templateId.value! — must follow the same source.

DEFECT 2 — the reload watcher can never fire
Same file, near the bottom:
    watch(() => templateId, async () => { store.resetStore(); await loadTasks() })

templateId is a computed ref. The getter returns the ref OBJECT, whose identity never changes, so
this watcher fires exactly never. Switching templates in either split-view dropdown, or navigating
between /day-planner/templates/:templateId URLs, leaves the previous template's tasks on screen.
Watch the value, not the ref. Also check the sibling watcher on [viewStartTime, viewEndTime] —
loadTasks() writes store.tasks and calls initializeTaskGridPositions(); confirm your fix does not
create a reload loop when both watchers fire from one template switch.

DEFECT 3 — duplicated global key handling, which defect 1 was hiding
src/core/dayPlanner/composable/usePlannerKeyboard.ts registers `document.addEventListener('keydown')`
in onMounted. It is called once per DayPlanner instance. In the split view that is TWO listeners,
both live at once. Once panels actually load tasks (defect 1), every ArrowUp moves the selection in
BOTH templates, "n" opens two create dialogs, and Ctrl+Z pops one shared useUndoStack twice.

The composable is written against a single implicit "the planner has focus". Give it an explicit
notion of which planner instance is active and have the handler no-op when it is not — e.g. scope
the listener to the panel's root element, or gate on a focus/hover-derived active-store id that
TemplateSplitView owns. Pick one approach and say which in your summary. The standalone day and
template routes have exactly one instance and must behave identically to today.

Note the same class of problem in the arrow-key day navigation in view/DayPlannerView.vue
(handleArrowKey, also a bare document listener) — it guards INPUT/TEXTAREA/contentEditable but not
"a dialog is open". Fix it only if your approach makes it free; otherwise leave it and mention it.

VERIFY by actually driving the app, not by reading:
- /day-planner/templates/split loads tasks in both panels, and changing either dropdown swaps that
  panel's tasks and leaves the other panel untouched.
- Arrow keys and "n" affect only the panel you are interacting with.
- /day-planner/templates/:templateId still behaves exactly as before, including navigating from one
  template to another without a full page reload.

Run `npm run type-check` (baseline 72 errors, all app-side in src/core — do not add to it, and do
not introduce any error in src/_common) and `npm run lint` (must stay at 0 errors).
```
