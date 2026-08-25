# P2 · Make the planner store contract actually type-check

- **Scope:** `store/IBaseDayPlannerStore.ts`, both stores, `composable/usePlannerStoreCore.ts`, every `inject('plannerStore')` consumer
- **Backend:** no
- **Model / effort:** **Opus 5**, high effort — it is a generics-and-Pinia design problem, not a mechanical error sweep
- **Payoff:** 19 of the repo's 72 type errors are in this module, and roughly three quarters of them are this one contract

---

```
src/core/dayPlanner accounts for 19 of the repo's 72 type errors — the largest single cluster.
They are not 19 problems. Fix the root causes, in this order, and the count should drop to zero.

Get the current list first:  npm run type-check 2>&1 | grep "^src/core/dayPlanner"
(The baseline is 72 errors, ALL app-side in src/core; src/_common is clean and any new error there
is a regression, not noise.)

ROOT CAUSE 1 — the untyped provide/inject key (≈8 errors)
DayPlannerView and TemplateDayPlannerView both do `provide('plannerStore', store)` with a plain
string. Consumers do `inject<TStore>('plannerStore')!` where TStore is a component-level generic
parameter constrained by IBaseDayPlannerStore. Two failure modes follow:

  a) `store.$patch({ ... })` — TS2769, no overload matches. IBaseDayPlannerStore extends the bare
     StoreGeneric, so $patch's state parameter degrades to something the object literal cannot
     satisfy. Sites: component/DayPlanner.vue:88, component/template/TemplatePlannerHeader.vue
     (three), component/normal/GoogleCalendarSyncBtn.vue.
     Note these are all `computed({ get: () => store.x, set: v => store.$patch({ x: v }) })` — a
     writable-computed wrapper around a store field. Consider whether the wrapper is needed at all
     before you fix its typing; Pinia setup-store refs are directly writable.

  b) Passing that TStore into a helper typed on the concrete instantiation — TS2345, "TStore is not
     assignable to IBaseDayPlannerStore<IBasePlannerTask<IBasePlannerTaskRequest>, ...>". Sites:
     component/misc/PlannerTimeColumn.vue:64 and component/PlannerTasksColumn.vue:93, both handing
     the injected store to useCurrentTimeIndicator / a common helper.

  Also TS2322 at component/normal/PlannerTaskDialog.vue:5 and
  component/template/TemplatePlannerTaskDialog.vue:7 — the concrete store type is not assignable to
  IBaseDayPlannerStore at all. Read that as the real signal: the interface does not describe what
  the stores return. Reconcile them rather than casting.

  The fix direction: replace the string key with a typed InjectionKey exported from one place
  (DayPlannerTypes.ts is the natural home — it already holds PlacingItem / CreationPreviewType), and
  decide deliberately whether consumers stay generic. Most of them do not need to be: they read the
  common surface and nothing else. Collapsing per-component generic parameters onto one injected
  store type is likely to delete more errors than it creates. If a component genuinely needs both
  concrete stores, model that as a union, not as an unbounded generic.
  The two TS2344 errors ("does not satisfy the constraint abstract new (...args: any) => any") in
  the two task dialogs are vue-tsc choking on the generic component itself — they should disappear
  once the component stops being generic. If your approach keeps the generics, those two need their
  own answer.

ROOT CAUSE 2 — getPlannerTaskStatusIcon takes the wrong type (2 errors)
view/DayPlannerView.vue:65 and component/normal/PlannerTaskBlock.vue:52 pass a
ValueTitleDto<string> (an element of getEnumSelectOptions(PlannerTaskStatus, 'planner.status')) to
a helper declared to take a PlannerTaskStatus. Both call sites are `v-for="option in statusOptions"`.
Fix the signature or the call — whichever keeps dto/enum/PlannerTaskStatus.ts honest — and make both
sites consistent. While there: both sites also do `option.value as PlannerTaskStatus` when emitting.
If that cast is load-bearing, the select-option type should be ValueTitleDto<PlannerTaskStatus>.

ROOT CAUSE 3 — function refs typed too narrowly (4 errors)
view/TemplateListView.vue lines ~110, ~158, ~211 and
component/template/TemplatePlannerTaskBlock.vue:11 all declare `:ref="(el: HTMLElement) => ..."`.
Vue's VNodeRef passes `Element | ComponentPublicInstance | null`, so `(el: HTMLElement) => void` is
not assignable. Widen the parameter and narrow inside; do not cast the ref expression.

ROOT CAUSE 4 — pendingClipboard.sourceContext is missing from the core type (2 errors)
composable/useClipboardHandling.ts:35 reads `.sourceContext`, but usePlannerStoreCore.ts declares
pendingClipboard as `{ tasks: TTask[]; mode: 'cut' | 'duplicate' }` — no sourceContext. The field is
real: dayPlannerStore.startCut() sets it and IBaseDayPlannerStore already declares it. Add it to the
core ref's type (optional, as the interface has it) rather than casting at the read site. Extract the
clipboard shape into one exported type so core, interface and consumer cannot drift again.

LEFTOVER (1 error)
component/normal/CalendarDetailsDialog.vue:131 — 'isValid' is possibly 'undefined'. Ordinary
narrowing; do not silence it with `!`.

CONSTRAINTS
- No `any`, no `@ts-expect-error`, no `as unknown as`. If a cast is genuinely unavoidable, it gets a
  comment saying what invariant makes it safe.
- src/_common is a git submodule and must not be edited. If the real fix belongs in the framework
  (e.g. a store-typing helper), do the app-side fix that works today AND add an entry to
  migration-revision.md describing the gap and the upstream ask.
- Behaviour must not change. This is a typing fix; if you find yourself altering runtime logic to
  satisfy the compiler, stop and reconsider the type.

FINISH by reporting the before/after error count for src/core/dayPlanner specifically and for the
repo total. `npm run lint` must stay at 0 errors.
```
