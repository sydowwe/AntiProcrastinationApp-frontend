import { expect, test } from '../fixtures/auth'

// Specs for the todoList surfaces that had no seed data to render before `POST /api/test/seed` existed.
// Driven in the browser via `playwright-cli` against the `e2e-v1` fixture before writing any assertion
// here — see docs/views/todo-lists/findings.md's round 3 entry for what that walk-through found.
//
// The estimate-vs-actual chip and the header calibration ratio were unwritable under `e2e-v1`:
// `GET /api/todo-list-item` returned no `suggestedTime` field at all, so there was nothing to assert
// against (findings.md O1/U3, round 3). **`e2e-v2` delivers it** — re-confirmed 2026-09-12 by reading the
// response body, not just the UI — and both surfaces are covered at the bottom of this file.
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
	// This block WRITES to a fixture-pinned row: the counter on `todoListItems.multiCountPartial` goes
	// 2 → 3 and stays there. `freshSeed` re-runs the reset before each test in scope so the next one
	// still starts at 2 of 5 — including the sibling `fixme` below, which asserts on the same click and
	// would otherwise open on a counter this test already advanced. Pairs with `mode: 'serial'`, and is
	// only safe because `playwright.config.ts` sets `workers: 1` (the endpoint truncates the whole
	// database). Costs ~1.5–2.0 s per test in this block.
	//
	// The cheaper answer — create the row through the app's own API and leave the fixture alone —
	// does not apply here: the point is the seeded mid-progress state, 2 of 5 rather than 0 of N.
	test.describe.configure({ mode: 'serial' })
	test.use({ freshSeed: true })

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

// Settles findings.md O1 and U3, both of which were open only because `e2e-v1` shipped no estimates.
// Every number below is the fixture's, read off `GET /api/todo-list-item?todoListId=13001`:
//
//   `withEstimate`         id 14002, "Feature Development", estimate 2h,  history average 2h 26m
//   `withEstimateAndSteps` id 14001, "Bug Fixing",          estimate 45m, history average 1h 1m
//
// The chip renders BOTH sides ("~2h / 2h 26m") — the estimate alone is not calibration. It renders the
// estimate on its own when the activity has no history, which is why the assertions below name the
// average explicitly rather than matching on "~".
test.describe('Estimate-vs-actual calibration (/todo-list/:id — "Focus")', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/13001')
		await authenticatedPage.locator('#app').getByText('Feature Development').first().waitFor({ state: 'visible' })
	})

	/**
	 * The estimate chip of the row for `title`.
	 *
	 * Two things need narrowing, and both cost a failure to find out: two nested `.v-list-item`s match
	 * each row (the outer is the drag/selection wrapper), and a row carries a SECOND `.v-chip` — the
	 * due-date one ("Tomorrow"). The estimate chip is the one that opens with `~`.
	 */
	function estimateChip(page: import('@playwright/test').Page, title: string) {
		return page
			.locator('.v-list-item')
			.filter({ hasText: title })
			.first()
			.locator('.v-chip')
			.filter({ hasText: '~' })
	}

	test('an item with an estimate shows its estimate and its actual average side by side', async ({
		authenticatedPage,
	}) => {
		await expect(estimateChip(authenticatedPage, 'Feature Development')).toContainText('2h 26m')
		await expect(estimateChip(authenticatedPage, 'Bug Fixing')).toContainText('1h 1m')
	})

	test('hovering the chip explains the average in words', async ({ authenticatedPage }) => {
		// The wording is the product decision this surface exists for — neutral, never scolding
		// (`toDoList.calibration.usuallyTooltip`). It lives in a Vuetify tooltip, so it is only in the
		// DOM after a hover, and it is teleported OUTSIDE `#app`.
		await estimateChip(authenticatedPage, 'Feature Development').hover()
		await expect(authenticatedPage.getByText('You usually spend 2h 26m on this')).toBeVisible()
	})

	test('the header states the calibration ratio once enough items are comparable', async ({
		authenticatedPage,
		seed,
	}) => {
		// Gated on MIN_COMPARABLE_ITEMS = 5 in useEstimateCalibration.ts; the seed reports 6, so this
		// clears the threshold by exactly one. If the fixture ever drops below 6 the line disappears
		// entirely rather than showing a different number — assert the seed's own count so that failure
		// says which of the two happened.
		expect(seed.counts.calibrationTodoListItems).toBeGreaterThanOrEqual(5)
		await expect(authenticatedPage.getByText(/Your estimates run about [\d.]+x actual time/)).toBeVisible()
	})
})
