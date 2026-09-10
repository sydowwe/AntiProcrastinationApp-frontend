import { expect, test } from '../fixtures/auth'

// Specs for the todoList surfaces that had no seed data to render before `POST /api/test/seed` existed
// (see prompts/view-docs/E2E-SEED-WIRING.md, Task 3). Driven in the browser via `playwright-cli` against
// the `e2e-v1` fixture before writing any assertion here — see docs/views/todo-lists/findings.md's round 3
// entry for what that walk-through found.
//
// Two of the five surfaces this file was meant to cover are NOT here:
//
// - The estimate-vs-actual chip and the header calibration ratio (seed handles
//   `todoListItems.withEstimate` / `withEstimateAndSteps`, ids 14002/14001) are not written. The seed names
//   both items for this and reports `counts.calibrationTodoListItems: 6`, but `GET /api/todo-list-item`
//   returns no `suggestedTime` field at all for either — confirmed via a direct `fetch` in the browser, not
//   just a UI read. There is nothing to assert against; see findings.md O1/U3's round-3 update. The fixture
//   needs to actually deliver this before a spec can be written.
//
// The "Focus" list is seed id 13001 (8 items), "Errands" is 13002 (7 items, including the 6 overdue ones).

test.describe('Overdue renegotiation banner (/todo-list/:id — "Errands")', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/13002')
		// The item fetch resolves after the initial paint — waiting on the banner's own text avoids
		// asserting against a page that hasn't finished loading yet (a real race: the very first
		// snapshot after navigation can land before `items.value` is populated).
		await authenticatedPage.getByText(/tasks have a date that has passed/).waitFor({ state: 'visible' })
	})

	test('shows the banner with the seeded overdue count and all three actions', async ({ authenticatedPage }) => {
		await expect(
			authenticatedPage.getByText("6 tasks have a date that has passed. Pick a new one when you're ready."),
		).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Today', exact: true })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'In a week' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Review one by one' })).toBeVisible()
	})

	test('"Review one by one" filters the list to overdue items via the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Review one by one' }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]due=overdue/)
	})

	// Not a locator bug and not something this spec can respond to by picking a different assertion:
	// clicking "Today" reliably 400s every `PUT /api/todo-list-item/{id}` in the batch. Filed as
	// docs/views/todo-lists/findings.md B4 — `Time.fromJson` (src/_common/dto/dto/Time.ts) destructures
	// `{ hours, minutes }` out of what the backend actually sends as a string (`"17:00:00"`), so it
	// silently zeroes every due time on read, then round-trips the zeroed object shape back out on write,
	// which the backend rejects. Confirmed via `playwright-cli request-body`/`response-body` on the failing
	// PUT. "In a week" shares the same code path (`rescheduleOverdue`) and would fail identically.
	test.fixme(
		'"Today" reschedules every overdue item to today and shows the moved-count snackbar',
		// Real defect (B4), not a locator problem — see the comment above.
		async () => {},
	)

	test.fixme(
		'"In a week" reschedules every overdue item to a week from today',
		// Same root cause as the "Today" case above (B4) — untested for the same reason.
		async () => {},
	)
})

test.describe('Multi-count item counter (/todo-list/:id — "Focus")', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/13001')
		// "Deep Clean Kitchen" (the activity name) also appears in an off-screen, always-mounted picker
		// elsewhere on this view, and its note text is mirrored into a Vuetify tooltip's own overlay
		// content — both make a bare `getByText` resolve to more than one element. `#app` plus `.first()`
		// picks the real on-page row (the tooltip clone lives outside `#app`, in a teleported overlay).
		await authenticatedPage.locator('#app').getByText('One room at a time.').first().waitFor({ state: 'visible' })
	})

	// This settles docs/views/todo-lists/findings.md's U2 — the click is not dead, it does increment —
	// but the same click also opens the log-time dialog, which is filed as B3. Asserting only the
	// increment here (structural, true by observation); the dialog also opening is the bug, not the
	// expected behaviour, so it is not asserted as a pass condition.
	test('clicking a mid-progress counter increments it', async ({ authenticatedPage }) => {
		const row = authenticatedPage
			.locator('#app')
			.getByText('One room at a time.')
			.first()
			.locator('..')
			.locator('..')
		await expect(row.getByText('2', { exact: true })).toBeVisible()
		await row.click()
		await expect(row.getByText('3', { exact: true })).toBeVisible()
	})

	test.fixme(
		'clicking the counter does not also open the log-time dialog',
		// Real defect — docs/views/todo-lists/findings.md B3. Reported rather than asserted as passing.
		async () => {},
	)
})
