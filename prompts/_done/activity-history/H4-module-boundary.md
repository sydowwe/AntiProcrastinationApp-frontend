# H4 · Fix the chart-component module boundary

- **Scope:** activityHistory, historyDashboard, activityTracking (imports only)
- **Backend:** none
- **Model / effort:** Opus 5, high effort — this is an architecture call under a hard constraint (the framework is a submodule this agent cannot edit). The output is partly a decision document, and a wrong one costs a later revert.
- **Depends on:** H3 (the composable settles which module owns what)
- **Unblocks:** nothing; do it before H5 so the localized strings land in their final home

---

```
src/core/activityHistory/ imports another module's component/ directory in several places, which
CLAUDE.md forbids — cross-module imports are allowed only via `api/` or `dto/`.

The actual violations:

  HistorySummaryView.vue and HistoryDetailView.vue import
    @/core/activityTracking/component/stackedBars/StackedBarsChart.vue
    @/core/activityTracking/component/stackedBars/dto/StackedBarsInput.ts
    @/core/activityTracking/component/summaryCards/BaselineOption.ts
    @/core/historyDashboard/component/... (five components)

  src/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue also imports
    @/core/activityTracking/component/summaryCards/BaselineOption.ts

So StackedBarsChart, StackedBarsInput and BaselineOption are consumed by three modules while living
inside one of them. That is the shared-component case CLAUDE.md names explicitly: "If two modules
need to share a component, it belongs in the framework — raise it rather than cross-importing."

HARD CONSTRAINT: src/_common is a git submodule. You must not create, edit or delete a single file
under it. Edits there are silently lost on the next pointer bump and ESLint/Prettier will not warn
you. So you cannot complete the move — you prepare it.

Do this:

1. Write the migration-revision.md entry (follow the format of the existing numbered entries in that
   file). It must state: the gap (three shared presentational units owned by a feature module), the
   exact files, their consumers, the proposed framework paths, and the fact that the app is holding
   them locally until the pointer bump. Number it after the current highest entry.

2. Decide and record ONE of these, with your reasoning, in that entry:
   (a) all three move to the framework, or
   (b) BaselineOption — a two-field value class plus a four-value enum — moves, while StackedBarsChart
       is large and app-specific enough that it should instead be owned by exactly one app module.
   If you pick (b), name that owner. Note that historyDashboard is the natural candidate: it has no
   routes, no views and no locale file today — it is already a component library that activityHistory
   consumes. If you land on that, say so plainly and record historyDashboard's role in the entry, so
   the next reader does not re-litigate it.

3. Apply whatever consolidation is legal today (moving files between src/core modules is legal;
   touching _common is not). At minimum, every import of these three symbols should resolve to a
   single owning module, not two.

4. If the conclusion is that historyDashboard is a deliberate component-library module for
   activityHistory, then its `component/` imports from activityHistory are a documented exception
   rather than a violation — write that into the same migration-revision entry, and note it in the
   module list at the top of CLAUDE.md so the rule and the reality stop contradicting each other.

Do NOT: fork a copy of any _common file into src/, rewrite StackedBarsChart's internals, change any
rendering, or "fix" this by adding barrel index.ts re-exports that launder the illegal path.

Verify: `npm run type-check`, `npm run lint`, and `git status` showing src/_common clean. Load all
three activityTracking dashboards plus the two history dashboards — this touches importers in both.
```
