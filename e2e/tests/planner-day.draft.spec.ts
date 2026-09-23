import { expect, seedDateParam, test } from '../fixtures/auth'

// Structural-tier coverage from the planner-day inventory pass (docs/views/planner-day/). Semantic
// claims — computed numbers, whether a bug is fixed — are `test.fixme` stubs; see
// docs/views/planner-day/findings.md for the defects they point at.

test.describe('Planner calendar (/day-planner)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner')
		await authenticatedPage.getByRole('button', { name: 'Select Days' }).waitFor({ state: 'visible' })
	})

	test('renders the month grid', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('combobox', { name: 'Mode' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Select Days' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Edit Details' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Apply Template' })).toBeVisible()
	})

	test('Select Days puts mode=bulkSelect in the URL and it survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Select Days' }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]mode=bulkSelect/)
		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/[?&]mode=bulkSelect/)
		await expect(authenticatedPage.getByText(/day(s)? selected/)).toBeVisible()
	})

	test('Cancel in the bulk-select bar clears mode from the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Select Days' }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]mode=bulkSelect/)
		await authenticatedPage.getByRole('button', { name: 'Cancel' }).click()
		await expect(authenticatedPage).not.toHaveURL(/mode=/)
	})

	test('the next-month arrow advances the month query param', async ({ authenticatedPage }) => {
		// Icon-only, no accessible name (finding A1) — falls back to position within the header row.
		const nextMonthButton = authenticatedPage.getByRole('button').nth(5)
		await nextMonthButton.click()
		await expect(authenticatedPage).toHaveURL(/[?&]month=\d{4}-\d{2}/)
	})

	// F86: the route reuses the view on a query-only navigation, so Back used to move the URL and not
	// the grid. Asserted on the picker's month and the first rendered day, not only on the URL.
	test('Back and Forward walk the grid through months, not only the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner?month=2026-10')
		const toolbar = authenticatedPage.locator('#app .v-card-title')
		await expect(toolbar.getByText('October')).toBeVisible()
		await authenticatedPage.getByRole('button').nth(5).click()
		await expect(authenticatedPage).toHaveURL(/[?&]month=2026-11/)
		await expect(toolbar.getByText('November')).toBeVisible()

		await authenticatedPage.goBack()
		await expect(authenticatedPage).toHaveURL(/[?&]month=2026-10/)
		await expect(toolbar.getByText('October')).toBeVisible()
		await expect(authenticatedPage.locator('#app .day-cell:not(.empty)').first()).toContainText('01.10.')

		await authenticatedPage.goForward()
		await expect(authenticatedPage).toHaveURL(/[?&]month=2026-11/)
		await expect(toolbar.getByText('November')).toBeVisible()
	})

	test('Back restores the Days-to-show filter of the entry it lands on', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner?month=2026-10&days=workdays')
		await expect(authenticatedPage.locator('#app .day-header')).toHaveCount(5)
		await authenticatedPage.getByRole('button').nth(5).click()
		await expect(authenticatedPage).toHaveURL(/[?&]month=2026-11/)
		const app = authenticatedPage.locator('#app')
		await app.locator('.v-select__selection-text', { hasText: 'Workdays' }).click()
		await authenticatedPage.getByRole('option', { name: /All week/ }).click()
		await expect(authenticatedPage.locator('#app .day-header')).toHaveCount(7)

		await authenticatedPage.goBack()
		await expect(authenticatedPage).toHaveURL(/[?&]days=workdays/)
		await expect(authenticatedPage.locator('#app .day-header')).toHaveCount(5)
	})

	// Finding B3, closed by FW16 + F44: the grid toolbar round-trips through the URL, every param absent
	// while it holds its default. Vuetify's selection text covers a select's input, so a select opens by
	// clicking its visible value rather than the combobox role.
	test('the "Days to show" filter survives a reload', async ({ authenticatedPage }) => {
		const app = authenticatedPage.locator('#app')
		await app.locator('.v-select__selection-text', { hasText: 'All week' }).click()
		await authenticatedPage.getByRole('option', { name: /Workdays/ }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]days=workdays/)
		await authenticatedPage.reload()
		await expect(app.locator('.day-header')).toHaveText(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
	})

	test('the Duration/Range mode configuration survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner?range=duration&anchor=end&from=2026-10-14&unit=day&qty=10')
		await authenticatedPage.getByRole('textbox', { name: 'Quantity' }).waitFor({ state: 'visible' })
		await authenticatedPage.getByRole('textbox', { name: 'Quantity' }).fill('5')
		await expect(authenticatedPage).toHaveURL(/[?&]qty=5/)
		await authenticatedPage.reload()
		const toolbar = authenticatedPage.locator('#app .v-card-title')
		await expect(toolbar.getByText('To end')).toBeVisible()
		await expect(toolbar.getByText('Days', { exact: true })).toBeVisible()
		await expect(authenticatedPage.getByRole('textbox', { name: 'Quantity' })).toHaveValue('5')
		await expect(authenticatedPage.getByRole('textbox', { name: 'Date to' })).toHaveValue('10/14/2026')
	})

	test('the default toolbar leaves a bare URL, and a bad duration is rewritten to what is shown', async ({
		authenticatedPage,
	}) => {
		await expect(authenticatedPage).toHaveURL(/\/day-planner$/)
		await authenticatedPage.goto('/day-planner?range=duration&from=2026-02-31&qty=99&unit=zzz')
		await expect(authenticatedPage.getByRole('textbox', { name: 'Quantity' })).toHaveValue('4')
		await expect(authenticatedPage).not.toHaveURL(/2026-02-31|qty=99|unit=zzz/)
	})

	// Finding B4, closed by backend/B19: the server sends a stable `holidayKey` next to the native
	// `holidayName`, and the client resolves the key through `calendar.holidays.*`. The fixture
	// account is `locale: 'EN'`, so the two September holidays must render in English. September
	// is a fixed calendar month, not seed-relative — holidays do not move with `seedDateUtc`.
	test('holiday names render in the account locale', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner?month=2026-09')
		const app = authenticatedPage.locator('#app')
		await expect(app.getByText(/Constitution Day/)).toBeVisible()
		await expect(app.getByText(/Our Lady of Sorrows/)).toBeVisible()
		await expect(app.getByText(/Deň Ústavy Slovenskej republiky/)).toHaveCount(0)
	})
})

test.describe('Day planner (/day-planner/:date)', () => {
	test.beforeEach(async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`/day-planner/${seedDateParam(seed)}`)
		await authenticatedPage.getByRole('button', { name: 'Add Task' }).waitFor({ state: 'visible' })
	})

	test('renders the time grid and Add Task control', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('button', { name: 'Add Task' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Details' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Routine' })).toBeVisible()
	})

	test('selecting a task shows the selection action bar with a live keyboard-help paragraph', async ({
		authenticatedPage,
	}) => {
		const taskBlocks = authenticatedPage.locator('.task-block')
		await taskBlocks.first().click()
		await expect(authenticatedPage.getByText(/\d+ selected/)).toBeVisible()
		await expect(authenticatedPage.getByText(/Escape clears the selection/)).toBeVisible()
	})

	test('Escape clears the selection when focus is on the selected task', async ({ authenticatedPage }) => {
		const taskBlocks = authenticatedPage.locator('.task-block')
		await taskBlocks.first().click()
		await expect(authenticatedPage.getByText(/\d+ selected/)).toBeVisible()
		await authenticatedPage.keyboard.press('Escape')
		await expect(authenticatedPage.getByText(/\d+ selected/)).not.toBeVisible()
	})

	test('Routine tab switches the side panel away from Day Details', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Routine' }).click()
		await expect(authenticatedPage.getByText('Routine Tasks')).toBeVisible()
	})

	// Finding B5: an invalid `:date` param silently blanks the header row with no user-visible message,
	// only an uncaught console AxiosError. Not asserted here since there is nothing to assert on yet.
	test.fixme('an invalid date param shows a visible error instead of a blank header', async () => {})
})

test.describe('Task deep link (/day-planner/task/:id)', () => {
	test('a valid task id redirects to the dated route and highlights the task', async ({
		authenticatedPage,
		seed,
	}) => {
		// The seed exposes a plannerTasks COUNT (`seed.counts.plannerTasks`) but no per-task id map, so the
		// id is read off the DOM rather than guessed — `BaseTaskBlock.vue` renders `data-task-id`.
		await authenticatedPage.goto(`/day-planner/${seedDateParam(seed)}`)
		const firstTask = authenticatedPage.locator('.task-block').first()
		await firstTask.waitFor({ state: 'visible' })
		const taskId = await firstTask.getAttribute('data-task-id')
		expect(taskId).toBeTruthy()

		await authenticatedPage.goto(`/day-planner/task/${taskId}`, { waitUntil: 'commit' })
		await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${seedDateParam(seed)}`))
	})

	test('an invalid task id shows "Task not found" with a working link back to the calendar', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/day-planner/task/999999')
		await expect(authenticatedPage.getByText('Task not found')).toBeVisible()
		await authenticatedPage.getByRole('link', { name: 'Open the calendar' }).click()
		await expect(authenticatedPage).toHaveURL(/\/day-planner$/)
	})
})

test.describe('Planner settings (/day-planner/settings)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner/settings')
		await authenticatedPage.getByRole('tab', { name: 'Repeating Tasks' }).waitFor({ state: 'visible' })
	})

	test('renders all five tabs', async ({ authenticatedPage }) => {
		for (const name of ['Repeating Tasks', 'In-app nudges', 'View Defaults', 'Skip Reasons', 'Calendar View']) {
			await expect(authenticatedPage.getByRole('tab', { name })).toBeVisible()
		}
	})

	test('clicking a tab marks it selected', async ({ authenticatedPage }) => {
		const skipReasonsTab = authenticatedPage.getByRole('tab', { name: 'Skip Reasons' })
		await skipReasonsTab.click()
		await expect(skipReasonsTab).toHaveAttribute('aria-selected', 'true')
	})

	// Finding B1: switching tabs does not hide the previous tab's content — by the last tab, two other
	// tabs' panels are still stacked above the real one. This is the semantic claim a fix must satisfy.
	test.fixme("only the active tab's content is visible", async () => {})

	// Finding B6: the active tab is not reflected in the URL and does not survive a reload.
	test.fixme('the active tab survives a reload', async () => {})
})
