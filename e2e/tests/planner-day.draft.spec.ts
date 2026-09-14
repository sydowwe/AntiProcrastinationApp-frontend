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

	// Finding B3: only `month`/`mode`/`templateId` round-trip. The Days-to-show filter and the
	// Range/Duration mode configuration are silently lost on reload.
	test.fixme('the "Days to show" filter survives a reload', async () => {})
	test.fixme('the Duration/Range mode configuration survives a reload', async () => {})

	// Finding B4: holiday names are untranslated Slovak regardless of the account's English locale.
	test.fixme('holiday names render in the account locale', async () => {})
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
	test('a valid task id redirects to the dated route and highlights the task', async ({ authenticatedPage, seed }) => {
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
	test.fixme('only the active tab\'s content is visible', async () => {})

	// Finding B6: the active tab is not reflected in the URL and does not survive a reload.
	test.fixme('the active tab survives a reload', async () => {})
})
