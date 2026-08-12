# H3 · Give home a real module structure

- **Scope:** `src/HomeView.vue` → `src/core/home/view/`, new `src/core/home/home.routes.ts`, `src/router.ts`
- **Backend:** none
- **Model / effort:** Sonnet 5, low–medium — mechanical, but touches the router, so verify every entry point.
- **Depends on:** nothing (do it before H4/H9 to avoid moving files twice)
- **Unblocks:** nothing hard, but keeps later prompts from editing a file at the wrong path

---

```
`home` is the only module in this app that does not follow the module-first layout described in
CLAUDE.md. Its view lives at src/HomeView.vue (repo root of src/) and it has no route table —
src/router.ts imports the view directly at line 2 and declares the route inline at line 43-44.
Every other module owns a `<module>.routes.ts` that router.ts spreads.

Do this:

1. Move src/HomeView.vue → src/core/home/view/HomeView.vue. Its six imports are already absolute
   `@/core/home/component/...` paths, so they need no change.

2. Create src/core/home/home.routes.ts exporting `homeRoutes`, matching the shape and conventions of
   the sibling tables — read src/core/todoList/todoList.routes.ts and
   src/core/dayPlanner/dayPlanner.routes.ts first and copy their style (lazy vs. eager import, meta
   keys, naming). Preserve the existing route exactly: path, `name: 'home'`, and whatever meta
   router.ts:40-45 currently sets. Do not add `public: true` or change the auth posture.

3. In src/router.ts, delete the `import HomeView` line and the inline route object, import
   `homeRoutes` and spread it in the same position in the array — the home route must stay first if
   it currently is, since a catch-all or a redirect may depend on ordering. Read the surrounding
   entries before moving anything.

4. Grep for any other reference to '@/HomeView.vue' or 'HomeView' across src/ (nav items, tests,
   redirects) and repoint it.

Do NOT restructure the widgets, extract anything, or add api/ dto/ directories that have no
contents. The module legitimately has no DTOs of its own — it composes other modules' data. This
prompt is only about the view and the route table.

Note on module boundaries: home imports components from other modules
(RoutineTodoListItem, NormalTodoListItem, HistoryPieChart, TrackTimeDialog). That is a deliberate,
accepted exception — home is the app's composition layer and is allowed to be coupled to the modules
it surfaces. Do not "fix" it, do not move those components into src/_common (a cross-project
submodule, the wrong home for app-specific components), and do not raise it as a finding.
Add a short comment at the top of src/core/home/home.routes.ts stating this, so the next reader does
not re-litigate it.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors), npx vite build must still bundle.
Then: navigate to / and confirm the dashboard renders, and confirm any nav item pointing at the home
route still resolves.
```
