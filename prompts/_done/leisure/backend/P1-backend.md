# P1 backend ask — status-only patch for `ActivityProjectProfile`

The readiness board (`../../../../src/core/leisure/component/project/ProjectReadinessBoard.vue`) changes exactly one field — `readinessStatus` — when a card's status
control is clicked. Today the frontend has no status-only route for this entity, so it falls back to `PUT /activity-project-profile/{id}` with the full existing
profile (all fields unchanged except `readinessStatus`). That works, but round-trips eight fields to change one enum on every click.

`../../../../src/core/dayPlanner/api/plannerTaskApi.ts` already has this exact shape for `PlannerTask` —
`PATCH /planner-task/{id}/status` — so this ask mirrors it.

## Endpoint

`PATCH /activity-project-profile/{id}/status`

- `{id}`: the `activityId` path segment, same as the existing `PUT /activity-project-profile/{id}`.
- Request body:
  ```json
  { "readinessStatus": "readyToStart" }
  ```
  `readinessStatus`: string, required, one of `"planning" | "needsShopping" | "readyToStart"` (the same enum values `ActivityProjectProfileRequest.readinessStatus`
  already sends today).
- Response: no body (204), matching `patchStatus` in `plannerTaskApi.ts`.

Once this exists, the frontend swap is: add a `patchStatus(id, readinessStatus)` call to
`activityProjectProfileApi.ts` and call it from `ProjectReadinessBoard.vue`'s `onStatusChange`
instead of `ActivityProjectProfileRequest.fromProfile(item, status)` + `update(...)`.
