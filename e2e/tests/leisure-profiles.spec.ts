import { test } from '../fixtures/auth'

// Specs for the leisure-profile surfaces named in prompts/view-docs/E2E-SEED-WIRING.md's Task 3
// (`profiles.backlog` / `bucketList` / `project` / `memoryAnchor`). None of the four are written — driving
// each screen in the browser via `playwright-cli` before writing anything (as the task requires) found that
// every one of them is currently broken, not by a locator or seed problem.
//
// All four leisure list views — and `/activity-settings/activities` (see activity-lifecycle.spec.ts) — POST
// to a `.../grid` endpoint on load (`useFetchFilteredTable`/`useServerTable`, per CLAUDE.md's `_common/api/`
// section) to fetch their paginated rows.
//
// **This header used to claim all five were one systemic backend failure. That was wrong**, and it is
// recorded here because it misdirected the next reader for a week. Diffing the client's paths against the
// running server's swagger and reading each response body gave three unrelated causes:
//
// | View                        | Endpoint                                      | Was  | Cause |
// | --------------------------- | --------------------------------------------- | ---- | ----- |
// | `/leisure/projects`         | `POST /api/activity-project-profile/grid`     | 400  | **frontend, FIXED** — `BOARD_PAGE_SIZE` was 500, the server caps `itemsPerPage` at 200 |
// | `/activity-settings/activities` | `POST /api/activity/grid`                 | 405  | **backend** — no such route; server still serves `/api/activity/filtered-table` |
// | `/leisure/memory-anchors`   | `POST /api/memory-anchor/grid`                | 405  | **backend** — same; server still serves `/api/memory-anchor/filtered-table` |
// | `/leisure/backlog`          | `POST /api/activity-backlog-profile/grid`     | 500  | **backend** — opaque `errorId 73e7261d482b` |
// | `/leisure/bucket-list`      | `POST /api/activity-bucket-list-profile/grid` | 500  | **backend** — opaque `errorId a2c8d4d3b9cb` |
//
// The two 405s are not a defect in this client: `vue_framework@52ba6a0` deliberately renamed the paged-filter
// convention from `/{entity}/filtered-table` to `/{entity}/grid` to follow a server-side rename, and the
// server applied it to the three profile entities but not to `activity` or `memory-anchor`. It is a
// half-finished rename, so the fix is to finish it server-side, NOT to add per-call-site `path` overrides
// that re-fork the convention that commit just unified.
//
// A 405 rather than a 404 because `POST /api/memory-anchor/grid` falls through to `/api/memory-anchor/{id}`
// with `id="grid"`, which allows only GET/DELETE/PUT.
//
// Still no spec for the three blocked surfaces — there is nothing in the UI to assert against. The projects
// surface now works and is deliberately left to unit 13's inventory pass, which writes
// `13-leisure-projects.draft.spec.ts` from a live crawl; a second spec written blind from here would only
// collide with it.

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
		// No longer blocked — the grid answers 200 and the board renders `profiles.project` under
		// "Needs shopping". Left unwritten on purpose: unit 13's inventory pass writes this surface's
		// spec from a live crawl (see the file header).
		//
		// One thing that pass should find rather than be told: the card shows "—" where the activity
		// name belongs, because the grid response carries no `activity` object at all — only
		// `activityId`. `ActivityInfo.fromJson({})` then yields an empty name. Whether the server should
		// embed it or the client should resolve it from `/api/activity/all-options` is a contract
		// question, not a locator one.
		async () => {},
	)

	test.fixme(
		'memory anchor (profiles.memoryAnchor) is listed and links back to the bucket-list activity',
		// Blocked: POST /api/memory-anchor/grid → 405, the half-finished server-side rename. See header.
		async () => {},
	)
})
