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
// **This header has now been wrong twice, in opposite directions.** Both versions are summarised because the
// pattern is the point: an inference written down as a measurement misdirects the next reader for a week.
//
//   1. It first claimed all five were one systemic backend failure. That was wrong — they were three causes.
//   2. It then claimed three causes, including a "half-finished `/grid` rename" on the server. **That is now
//      wrong too**, partly because the server has since changed and partly because two of the three causes
//      turned out to be the same bug.
//
// Re-measured 2026-09-11 (see prompts/view-docs/README.md § *Before you start a unit*):
//
// | View                            | Endpoint                                      | Now  | Cause |
// | ------------------------------- | --------------------------------------------- | ---- | ----- |
// | `/leisure/projects` (board)     | `POST /api/activity-project-profile/grid`     | 200  | **fixed** — `BOARD_PAGE_SIZE` 500 → 200, the server's cap. Renders |
// | `/activity-settings/activities` | `POST /api/activity/grid`                     | 200  | **fixed server-side** — the rename is complete. Renders 10 rows |
// | `/leisure/memory-anchors`       | `POST /api/memory-anchor/grid`                | 500  | **backend** — sorts by `periodKey`, an unmapped key (B2) |
// | `/leisure/backlog`              | `POST /api/activity-backlog-profile/grid`     | 500  | **backend** — sorts by `activity.name`, an unmapped key (B2) |
// | `/leisure/bucket-list`          | `POST /api/activity-bucket-list-profile/grid` | 500  | **backend** — same as above (B2) |
//
// **The `/grid` rename is finished.** `/api/activity/grid` and `/api/memory-anchor/grid` both answer 200, and
// `POST /{entity}/filtered-table` now returns 405 on all five entities — the mirror image of the old symptom.
// Do not add per-call-site `path` overrides; there is nothing left to work around.
//
// The three remaining 500s are **one** bug, not three: a grid throws whenever `sortBy` names a key it cannot
// map to a column. `sortBy: []` returns 200 on every one of these endpoints. A dot is not required — a
// dot-free non-column key fails identically, so it is not about nested paths. Filed once as
// prompts/view-docs/backend/B2-grid-500-on-unmapped-sortby.md, which also covers the client-side half (three
// of these views send keys the server does not have).
//
// The failure renders as an **empty state**, not an error, so `/leisure/backlog` says "You don't have any here
// yet" while the fixture does contain `profiles.backlog`. Never take an empty leisure table at face value here
// without checking the network log.
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
