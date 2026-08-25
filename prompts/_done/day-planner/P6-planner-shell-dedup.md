# P6 · Collapse the duplicated planner shell

- **Scope:** `view/DayPlannerView.vue`, `view/TemplateDayPlannerView.vue`, `component/normal/DayPlannerSidePanel.vue`, `component/template/RoutineSidePanel.vue`
- **Backend:** no
- **Model / effort:** **Opus 5**, high effort — the two views look similar and are not; the judgement is which similarities are real
- **Run it:** after P1 (which changes how TemplateDayPlannerView gets its id) and P4 (so you move keyed strings, not literals)

---

```
src/core/dayPlanner/view/DayPlannerView.vue (542 lines) and view/TemplateDayPlannerView.vue (260)
carry a byte-identical block of side-panel plumbing, and the panel chrome around it is duplicated
in markup rather than shared.

THE IDENTICAL PART — copied verbatim in both files:
    const activePanel = ref<'details' | 'routine'>('details')
    const panelOpen = ref(true)
    const selectedRoutineItem = ref<RoutineTodoListItemEntity | null>(null)
    provide('selectedRoutineItem', selectedRoutineItem)
    watch(activePanel, panel => { if (panel !== 'routine') selectedRoutineItem.value = null })
    watch(selectedRoutineItem, item => {
        store.placingItem = item ? { name: item.activity.name, icon: 'rotate' } : null
    })
    watch(() => store.placingItem, item => { if (!item) selectedRoutineItem.value = null })

Three watchers forming a two-way sync between selectedRoutineItem and store.placingItem, duplicated.
This belongs in one composable in src/core/dayPlanner/composable/ (useRoutinePlacement, or similar)
taking the store and owning the panel state, the provide, and the sync.

While extracting, look hard at that sync: two watchers write to each other's source. Confirm it
cannot oscillate, and if the guard is load-bearing, say so in a comment — right now it is implicit.

THE SIMILAR-BUT-NOT-IDENTICAL PART — the panel chrome
DayPlannerView delegates to component/normal/DayPlannerSidePanel.vue. TemplateDayPlannerView inlines
its own VCard with the same shape: a title row with a mobile close VIconBtn, a details/routine
VBtnToggle, then `<XPanel v-if="activePanel === 'details'" />` / `<RoutineSidePanel v-else />`.
Same structure, different content, one has a component and one does not.

Extract the chrome — width, mobile show/hide, title row, toggle — into one component that takes the
two panel bodies as slots. DayPlannerSidePanel then becomes a caller of it, not a competitor to it.

WHAT IS NOT SHARED, AND MUST NOT BE FORCED TOGETHER
Do not try to unify the two views wholesale. They genuinely differ: DayPlannerView owns a Calendar,
template preview, status changes, skip/reschedule, log-time and suggestions; TemplateDayPlannerView
owns a template id and split-view dual-store handling. component/DayPlanner.vue is already the
shared grid and it is the right seam. Adding a `mode: 'day' | 'template'` prop to a merged view
would be a step backwards — do not.

CROSS-MODULE RULE: both views import RoutineTodoListItemEntity from
@/core/todoList/dto/response/routine/ — that is legal (another module's dto/ is an allowed import).
Whatever you extract stays inside src/core/dayPlanner/. If you conclude a piece belongs to the
framework, do NOT put it in src/_common (git submodule, must not be edited) — add an entry to
migration-revision.md with the gap and the upstream ask, and keep the app-side version.

CONSTRAINT: behaviour identical afterwards. Same panel default state, same mobile breakpoint
behaviour (TemplateDayPlannerView uses useDisplay's mdAndUp — check whether DayPlannerSidePanel uses
the same breakpoint, and if they differ, that is a bug to surface, not to silently unify).

VERIFY by driving both /day-planner/:date and /day-planner/templates/:templateId: toggle each panel,
pick a routine item and confirm it becomes the placing item on the grid, cancel placement and
confirm the panel selection clears, then resize to mobile and confirm the close button still works.

Report the net line count change. Run `npm run type-check` (baseline 72, all app-side in src/core)
and `npm run lint` (0 errors).
```
