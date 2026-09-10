import { test } from '../fixtures/auth'

// Specs for the leisure-profile surfaces named in prompts/view-docs/E2E-SEED-WIRING.md's Task 3
// (`profiles.backlog` / `bucketList` / `project` / `memoryAnchor`). None of the four are written — driving
// each screen in the browser via `playwright-cli` before writing anything (as the task requires) found that
// every one of them is currently broken, not by a locator or seed problem.
//
// All four leisure list views — and `/activity-settings/activities` (see activity-lifecycle.spec.ts) — POST
// to a `.../grid` endpoint on load (`useFetchFilteredTable`/`useServerTable`, per CLAUDE.md's `_common/api/`
// section) to fetch their paginated rows, and every one of those calls fails, each with a different status:
//
// | View                       | Endpoint                                    | Status |
// | --------------------------- | -------------------------------------------- | ------ |
// | `/leisure/backlog`          | `POST /api/activity-backlog-profile/grid`   | 500 (opaque `errorId`, no detail) |
// | `/leisure/bucket-list`      | `POST /api/activity-bucket-list-profile/grid` | 500 (opaque `errorId`, no detail) |
// | `/leisure/projects`         | `POST /api/activity-project-profile/grid`   | 400 |
// | `/leisure/memory-anchors`   | `POST /api/memory-anchor/grid`              | 405 Method Not Allowed |
// | `/activity-settings/activities` | `POST /api/activity/grid`               | 405 Method Not Allowed |
//
// Five different grid endpoints, three different status codes, reproduced on fresh navigations (and a
// reload, for the activities one) — this reads as a systemic backend issue with the generic paginated-grid
// route family on whatever build the dev API is currently running, not five unrelated bugs and not anything
// the frontend or the seed can work around. Every one of these screens currently shows "0-0 of 0" /
// "you don't have any here yet" regardless of what the seed actually put in the database — confirmed
// separately that the data exists: `GET /api/activity-backlog-profile` (the non-paginated list endpoint)
// does return rows.
//
// Reported rather than worked around. No spec is written for any of the four profile surfaces until the
// grid endpoints work — there is nothing in the UI to assert against.

test.describe('Leisure profiles', () => {
	test.fixme(
		'backlog profile (profiles.backlog) is listed with its activity name and fields',
		// Blocked: POST /api/activity-backlog-profile/grid → 500. See file header.
		async () => {},
	)

	test.fixme(
		'bucket-list profile (profiles.bucketList) is listed, and its memory anchor closes the loop',
		// Blocked: POST /api/activity-bucket-list-profile/grid → 500. See file header. The
		// seed puts `profiles.memoryAnchor` on the bucket-list activity specifically so this can be
		// exercised once the grid works.
		async () => {},
	)

	test.fixme(
		'project profile (profiles.project) is listed with its activity name and fields',
		// Blocked: POST /api/activity-project-profile/grid → 400. See file header.
		async () => {},
	)

	test.fixme(
		'memory anchor (profiles.memoryAnchor) is listed and links back to the bucket-list activity',
		// Blocked: POST /api/memory-anchor/grid → 405. See file header.
		async () => {},
	)
})
