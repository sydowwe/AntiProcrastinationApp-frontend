# P1 · Projects: surface the blocker, not the status

- **Scope:** projects
- **Backend:** likely — a status-only update route
- **Model / effort:** Sonnet 5, medium–high effort
- **Research:** Gollwitzer (1999) on implementation intentions — a stalled project resumes when the next physical action is named, not when the project is re-prioritised. `ReadinessStatus.NeedsShopping` is a named blocker the app currently renders as a word in a cell.

---

```
ActivityProjectProfile carries readinessStatus (Planning / NeedsShopping / ReadyToStart),
materialsNeeded: string[], requiredTools: string[], difficultyLevel, estimatedHours, projectArea
and isMessy. component/project/ProjectTable.vue renders the status as translated text in a column
and never renders materialsNeeded or requiredTools at all — they are editable in the form (via
component/project/StringListEditor.vue) and then invisible forever.

That is backwards. A hobby project stalls for one of a very small number of reasons, and this
schema already records which one. Make the app say it.

1. GROUP BY READINESS on /leisure/projects — a board with three columns, one per ReadinessStatus,
   toggled against the existing table with the mode in a URL query param (CLAUDE.md requires
   bookmarkable view state). ReadyToStart first: those are the projects the user could pick up
   today, and they should be the ones they see first, not sorted alphabetically among the rest.

2. MOVING A CARD BETWEEN COLUMNS sets readinessStatus. That is the whole editing interaction —
   most status changes are one field, and today they require opening a dialog with nine fields in
   it. If drag-and-drop is not cleanly available, a small status control on the card is fine; the
   point is one gesture, not a dialog.

3. SHOW THE BLOCKER ON THE CARD. A NeedsShopping project should show what is missing —
   materialsNeeded and requiredTools are right there, unrendered. That turns "this project is
   blocked" into "this project needs two specific things", which is a to-do, not a mood. If those
   arrays are long, show the first few and a count.

4. WHILE YOU ARE HERE: consider whether a NeedsShopping project's materials list should be able to
   hand off to the todo list (src/core/todoList/ — via its api/ or dto/ ONLY, never its
   component/, composable/ or store/, per CLAUDE.md). That is the highest-value version of this
   feature: the shopping list stops living in a hobby-tracker field and becomes a task the user
   will actually see. Evaluate it, and if the todo list's api/ makes it straightforward, build it.
   If it needs anything the todo item API does not expose, skip it and note why rather than
   half-building it.

Vuetify props before utility classes before custom CSS; v-auto-animate for card movement rather
than hand-written transitions. Match the existing colour semantics — ProjectTable already uses
warningDark for isMessy.

STEP 1: read api/activityProjectProfileApi.ts. It exposes create/update/deleteEntity but the
update path sends a full ActivityProjectProfileRequest, so a drag between columns would round-trip
the entire profile to change one enum. Check whether useEntityCommand's `patch` is wired for this
entity and whether the backend has a route for it. If a status-only update is not available, build
the board against the shape you want (using the full update as a fallback so the feature works
today) and write the backend ask to prompts/leisure/backend/P1-backend.md.

CONTRACT ONLY: the endpoint the frontend calls (method, route, request body) and what it returns,
with types and nullability, in the JSON naming the frontend fromJson reads. Do NOT specify
entities, EF or migrations, concurrency handling, or validation rules. If a suitable route already
exists, do not create the file; say so.

Strings in _locales/leisure.{sk,en}.ts, SK primary. `npm run type-check` (baseline 72, do not add)
and `npm run lint` (0 errors).
```
