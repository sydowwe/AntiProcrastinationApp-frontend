import type { Page } from '@playwright/test'
import { expect, seedDateParam, test, type SeedResponse } from '../fixtures/auth'

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
	// The two reschedule tests below WRITE to the six fixture-pinned overdue rows — after either, the
	// banner is gone for every later test, this block's own first two included. Same trade as the
	// counter block: serial plus a reseed before each test.
	test.describe.configure({ mode: 'serial' })
	test.use({ freshSeed: true })

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

	// Was a `fixme` for docs/views/todo-lists/findings.md B4: the API used to send `dueTime` as the
	// string `"17:00:00"`, `Time.fromJson` read it as 00:00, and the zeroed object shape it wrote back
	// 400'd every PUT in the batch. The API now sends `{ hours, minutes }` and `Time.fromJson` accepts
	// both shapes. The second half of each assertion — the time-of-day survives — is the half a fix
	// that only stopped the 400 would still fail: the seed's six overdue rows are all due at 17:00.
	//
	// The item fetch is what settles the list after the batch (`rescheduleOverdue` re-reads in
	// `finally`), so the banner disappearing is the signal that both the writes and the re-read are
	// done; the chip text is asserted after it.
	//
	// A date a week out renders as `DD.MM.` (the app's own short format), so that chip is derived from
	// the seed date rather than typed in.
	for (const [label, expectedSnackbar, chipFor] of [
		['Today', 'Moved 6 tasks to today', () => /^Today 17:00$/],
		[
			'In a week',
			'Moved 6 tasks to a week from today',
			(seed: SeedResponse) => {
				const [dd, mm] = seedDateParam(seed, 7).split('-')
				return new RegExp(`^${dd}\\.${mm}\\. 17:00$`)
			},
		],
	] as const) {
		test(`"${label}" reschedules every overdue item and keeps its time of day`, async ({
			authenticatedPage,
			seed,
		}) => {
			expect(seed.counts.overdueTodoListItems).toBe(6)
			await authenticatedPage.getByRole('button', { name: label, exact: true }).click()
			await expect(authenticatedPage.getByText(expectedSnackbar)).toBeVisible()
			await expect(authenticatedPage.getByText(/tasks have a date that has passed/)).toBeHidden()
			await expect(authenticatedPage.locator('#app').getByText(chipFor(seed))).toHaveCount(6)
		})
	}
})

test.describe('Multi-count item counter (/todo-list/:id — "Focus")', () => {
	// This block WRITES to a fixture-pinned row: the counter on `todoListItems.multiCountPartial` steps
	// and, since B5, every step is persisted. `freshSeed` re-runs the reset before each test in scope so
	// each one still starts at 2 of 5. Pairs with `mode: 'serial'`, and is only safe because
	// `playwright.config.ts` sets `workers: 1` (the endpoint truncates the whole database). Costs
	// ~1.5–2.0 s per test in this block.
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

	// The counter is two always-present buttons, named by state ("Increase: 2 of 5" / "Decrease: 2 of
	// 5"). It used to be a hover swap — the bar under the mouse was replaced by a minus button as soon
	// as the pointer dwelt, so a real mouse could only ever decrement, and neither action was reachable
	// by keyboard (docs/views/_fix-queue.md, "counter hit-testing"). `hover()` before `click()` is the
	// dwelling mouse; a synthetic click alone landed before Vue swapped the branch and hid the bug.
	function counterButton(page: Page, name: RegExp) {
		return page.locator('#app').getByRole('button', { name })
	}

	test('the bar increments after a dwelling hover, without opening the log-time dialog', async ({
		authenticatedPage,
	}) => {
		const increase = counterButton(authenticatedPage, /^Increase: 2 of 5$/)
		await increase.hover()
		await authenticatedPage.waitForTimeout(500)
		await increase.click()
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Log time manually' })).toBeHidden()
	})

	// Every step is persisted (`toggle-is-done` with `forceValue` is ±1 for a counted item) — before,
	// only the step that flipped `isDone` was, so 2 → 3 → 4 read back as 2 on the next visit.
	test('an increment survives a reload', async ({ authenticatedPage, seed }) => {
		// The count updates optimistically, so the visible 3 says nothing about the write — wait for the
		// per-item re-read that follows the PATCH, or the reload races the request it is meant to check.
		const resynced = authenticatedPage.waitForResponse(
			response =>
				response.url().endsWith(`/todo-list-item/${seed.todoListItems.multiCountPartial}`) &&
				response.request().method() === 'GET',
		)
		await counterButton(authenticatedPage, /^Increase: 2 of 5$/).click()
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
		await resynced
		await authenticatedPage.reload()
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
	})

	test('the minus button decrements', async ({ authenticatedPage }) => {
		await counterButton(authenticatedPage, /^Decrease: 2 of 5$/).click()
		await expect(counterButton(authenticatedPage, /^Increase: 1 of 5$/)).toBeVisible()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Log time manually' })).toBeHidden()
	})

	test('both counter buttons are reachable and operable by keyboard', async ({ authenticatedPage }) => {
		await counterButton(authenticatedPage, /^Increase: 2 of 5$/).focus()
		await authenticatedPage.keyboard.press('Enter')
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
		await counterButton(authenticatedPage, /^Decrease: 3 of 5$/).focus()
		await authenticatedPage.keyboard.press('Space')
		await expect(counterButton(authenticatedPage, /^Increase: 2 of 5$/)).toBeVisible()
	})

	// Was the B3 `fixme`: the row body of a counted item used to step the counter AND open the dialog.
	// The row body is now only the log-time gesture, as it is for every other row.
	test('clicking the row body opens the log-time dialog and leaves the counter alone', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.locator('#app').getByText('One room at a time.').first().click()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Log time manually' })).toBeVisible()
		await expect(counterButton(authenticatedPage, /^Increase: 2 of 5$/)).toBeVisible()
	})
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
