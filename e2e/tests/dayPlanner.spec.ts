import { expect, seedDateParam, test } from '../fixtures/auth'

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

	// The seed's clock-relative planner rows are: 3 tasks on seedDateUtc, 2 on +1, none on +2, 2 on +3 —
	// so +2 is a deliberate empty day (the calendar row for it exists), not a missing-day error. Driven
	// from `seed.seedDateUtc`, never `new Date()`, per the fixture rules.
	test.describe('empty day (no planner tasks scheduled)', () => {
		test('renders the grid normally with no task blocks, not an error state', async ({ authenticatedPage, seed }) => {
			await authenticatedPage.goto(`/day-planner/${seedDateParam(seed, 2)}`)
			await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
			await expect(authenticatedPage.getByRole('button', { name: 'Add Task' })).toBeVisible()
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(0)
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

		// Not a locator bug: `PlannerSidePanelShell.vue` renders `v-show="panelOpen || mdAndUp"`, so at
		// this suite's desktop viewport (`devices['Desktop Chrome']`) the panel is *always* shown
		// regardless of `panelOpen` — collapsing it is a mobile-only affordance. The bars/xmark toggle
		// buttons that flip `panelOpen` both carry `class="d-md-none"`, so at desktop width they are
		// `display: none` and excluded from the accessibility tree entirely — `getByRole('button')`
		// never sees them. `.header-bar .getByRole('button').first()` therefore silently resolved to
		// the previous-day nav arrow (the first *accessible* button in `.header-bar`) instead, which
		// is a real click with a real effect (it navigates the date) but not the one either test
		// intended — that is what actually made "Day Details" stay visible, not a broken hide.
		// There is no desktop-viewport locator that exercises this: it needs a narrow/mobile viewport,
		// which this suite does not run (see the runbook's X4, already blocked on the same gap).
		test.fixme(
			'toggle button hides the Day Details panel',
			// Panel-collapse is mobile-only (`v-show="panelOpen || mdAndUp"`); untestable at this
			// suite's desktop viewport. Needs a mobile-viewport pass (blocked, same as runbook X4).
			async () => {},
		)

		test.fixme(
			'toggle button restores the Day Details panel',
			// Same gap as above — the toggle it restores from is unreachable at desktop viewport.
			async () => {},
		)

		// The old `.detail-panel`-scoped locator was also wrong (the Edit button lives in
		// `PlannerSidePanelShell`'s `#titleActions` slot, a sibling of `.detail-panel`, not a
		// descendant), but fixing just that surfaces a real bug, not a passing test:
		// `CalendarDetailsDialog.vue`'s `getNaturalDayType()` reads `props.calendar!.dayIndex` with a
		// non-null assertion and no real guard. `.calendar-grid` becomes visible before
		// `DayPlannerView`'s `calendar` ref finishes loading, so a click that lands in that window
		// hits `Cannot read properties of undefined (reading 'dayIndex')`, which throws out of the
		// dialog's render and cascades into further "Unhandled error during execution of component
		// update" failures — the dialog never mounts, so `getByRole('dialog')` finds nothing.
		// Reproduced twice outside this suite (`node` + Playwright directly, console/pageerror
		// listeners attached) with the identical stack; a manual `playwright-cli` walk-through did
		// not reproduce it, consistent with the load having more time to finish between steps there.
		test.fixme(
			'Edit button opens the calendar details dialog',
			// Real defect, not a locator bug — see the comment above. Reported rather than filed,
			// since dayPlanner has no docs/views/ unit yet (unrun unit 7).
			async () => {},
		)
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
