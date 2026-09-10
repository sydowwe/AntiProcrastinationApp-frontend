import { expect, test } from '../fixtures/auth'

// Specs for the activity-lifecycle surfaces named in prompts/view-docs/E2E-SEED-WIRING.md's Task 3
// (`activities.archived` / `notDeletable` / `deletable`). Driven in the browser via `playwright-cli`
// against the `e2e-v1` fixture before writing this — see the note below on what could not be covered.
//
// Direct API checks (via `page.evaluate(fetch(...))`, not inferred) confirmed the seed's three activities
// behave as named: `GET /api/activity/{id}` reports `archived` (12010, "Retired Hobby") as
// `canDelete: true, isArchived: true`; `notDeletable` (12011, "Write Blog Post") as `canDelete: false`;
// `deletable` (12012, "Unused Idea") as `canDelete: true`.
//
// Only the "archived is hidden from pickers" half is exercised here. The other half — "notDeletable
// reports canDelete: false, deletable is the contrast case" — was meant to be verified on
// `/activity-settings/activities`, but that view's data table is unusable: every load issues
// `POST /api/activity/grid`, which the backend answers with **405 Method Not Allowed** (reproduced twice,
// via a fresh navigation and a reload). The table therefore always shows "0-0 of 0", for every filter.
// This is a real, previously unknown defect blocking the whole Activities settings screen, not a seed or
// locator problem — reported rather than worked around. `GET /api/activity` (the list endpoint other
// pickers use) is also inconsistent with the single-entity fetch: it reports `canDelete: false` for the
// `deletable` activity (12012), contradicting `GET /api/activity/12012`'s `canDelete: true` — worth a look
// once the grid endpoint itself is fixed.

test.describe('Activity lifecycle', () => {
	test('an archived activity does not appear in the activity picker', async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`/todo-list/${seed.todoLists.focus}`)
		await authenticatedPage.getByRole('button', { name: 'Add' }).click()
		const activityField = authenticatedPage.getByRole('combobox', { name: '* Activity' })
		await activityField.click()
		// Non-archived activities that should still be selectable — confirms the dropdown has real
		// options rather than being empty for an unrelated reason.
		await expect(authenticatedPage.getByRole('option', { name: 'Write Blog Post' })).toBeVisible()
		// Typed, not just checked against the unfiltered initial list: the archived activity's name is
		// distinctive ("Retired Hobby"), so a search-as-you-type autocomplete narrows to it directly if
		// it's selectable at all. It isn't — the field offers to create a new activity with that name
		// instead, which is exactly what it does for a name matching nothing.
		await activityField.fill('Retired Hobby')
		await expect(authenticatedPage.getByText('No activity is called "Retired Hobby".')).toBeVisible()
		await expect(authenticatedPage.getByRole('option', { name: 'Retired Hobby' })).toHaveCount(0)
	})

	test.fixme(
		'Activities settings table lists activities with correct per-row delete affordance (notDeletable vs deletable)',
		// Blocked on a real defect, not a locator problem: `/activity-settings/activities`'s data table
		// always shows "0-0 of 0" because `POST /api/activity/grid` returns 405 Method Not Allowed.
		// Reported rather than worked around — see the file header comment.
		async () => {},
	)
})
