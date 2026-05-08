import { expect, test } from '../fixtures/auth'

function dateToUrlParam(date: Date): string {
	const dd = String(date.getDate()).padStart(2, '0')
	const mm = String(date.getMonth() + 1).padStart(2, '0')
	const yyyy = date.getFullYear()
	return `${dd}-${mm}-${yyyy}`
}

const today = new Date()
const todayParam = dateToUrlParam(today)

function relativeDay(delta: number): string {
	const d = new Date(today)
	d.setDate(d.getDate() + delta)
	return dateToUrlParam(d)
}

test.describe('Day Planner', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`/day-planner/${todayParam}`)
		await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
	})

	test.describe('rendering', () => {
		test('shows the calendar grid', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.locator('.calendar-grid')).toBeVisible()
		})

		test('Add Task button is visible', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('button', { name: 'Add Task' })).toBeVisible()
		})
	})

	test.describe('keyboard date navigation', () => {
		test('ArrowLeft navigates to previous day', async ({ authenticatedPage }) => {
			await authenticatedPage.keyboard.press('ArrowLeft')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${relativeDay(-1)}$`))
		})

		test('ArrowRight navigates to next day', async ({ authenticatedPage }) => {
			await authenticatedPage.keyboard.press('ArrowRight')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${relativeDay(1)}$`))
		})

		test('navigating back then forward returns to today', async ({ authenticatedPage }) => {
			await authenticatedPage.keyboard.press('ArrowLeft')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${relativeDay(-1)}$`))
			// Wait for the grid to reload before pressing the next key
			await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
			await authenticatedPage.keyboard.press('ArrowRight')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${todayParam}$`))
		})

		test('arrow keys do not navigate when a text input is focused', async ({ authenticatedPage }) => {
			// The handleArrowKey guard ignores events from INPUT/TEXTAREA/contentEditable.
			// Find any input on the page (e.g. the time range picker in the header) and focus it.
			await authenticatedPage.locator('input').first().focus()
			await authenticatedPage.keyboard.press('ArrowLeft')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${todayParam}$`))
		})
	})

	test.describe('task creation dialog', () => {
		test('Add Task button opens the creation dialog', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add Task' }).click()
			await expect(authenticatedPage.getByText('Add New Task')).toBeVisible()
		})

		test('creation dialog can be cancelled', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add Task' }).click()
			await expect(authenticatedPage.getByText('Add New Task')).toBeVisible()
			await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.getByText('Add New Task')).not.toBeVisible()
		})
	})

	test.describe('day details panel', () => {
		test('shows Day Details panel by default', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByText('Day Details')).toBeVisible()
		})

		test('toggle button hides the Day Details panel', async ({ authenticatedPage }) => {
			// First button in .header-bar is the bars/expand toggle
			await authenticatedPage.locator('.header-bar').getByRole('button').first().click()
			await expect(authenticatedPage.getByText('Day Details')).not.toBeVisible()
		})

		test('toggle button restores the Day Details panel', async ({ authenticatedPage }) => {
			const toggle = authenticatedPage.locator('.header-bar').getByRole('button').first()
			await toggle.click()
			await expect(authenticatedPage.getByText('Day Details')).not.toBeVisible()
			await toggle.click()
			await expect(authenticatedPage.getByText('Day Details')).toBeVisible()
		})

		test('Edit button opens the calendar details dialog', async ({ authenticatedPage }) => {
			await authenticatedPage.locator('.detail-panel').getByRole('button', { name: 'Edit' }).click()
			await expect(authenticatedPage.getByRole('dialog')).toBeVisible()
		})
	})

	test.describe('selection action bar — DayPlannerView actions', () => {
		test('Change Status button is visible when a task is selected', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Change Status' })).toBeVisible()
		})

		test('Change Status button opens a status menu', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: 'Change Status' }).click()
			await expect(authenticatedPage.locator('.v-list')).toBeVisible()
		})

		test('Reschedule button is visible when a task is selected', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Reschedule' })).toBeVisible()
		})

		test('Reschedule button opens the Reschedule tasks dialog', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: 'Reschedule' }).click()
			await expect(authenticatedPage.getByText('Reschedule tasks')).toBeVisible()
		})

		test('cancelling the Reschedule dialog closes it without rescheduling', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: 'Reschedule' }).click()
			await expect(authenticatedPage.getByText('Reschedule tasks')).toBeVisible()
			await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.getByText('Reschedule tasks')).not.toBeVisible()
		})

		test('Log time button is visible when exactly one task is selected', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Log time' })).toBeVisible()
		})
	})

	test.describe('task selection and deletion', () => {
		test('selecting a task shows the selection action bar', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			const count = await taskBlocks.count()
			if (count === 0) test.skip()

			await taskBlocks.first().click()
			// Action bar appears with at least a Delete button
			await expect(authenticatedPage.getByRole('button', { name: /delete/i })).toBeVisible()
		})

		test('delete action shows a confirmation dialog', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			const count = await taskBlocks.count()
			if (count === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: /delete/i }).click()
			await expect(authenticatedPage.getByText('Delete confirmation')).toBeVisible()
		})

		test('cancelling the delete dialog keeps the task', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			const countBefore = await taskBlocks.count()
			if (countBefore === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: /delete/i }).click()
			await expect(authenticatedPage.getByText('Delete confirmation')).toBeVisible()
			// Close without confirming
			await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(countBefore)
		})
	})
})
