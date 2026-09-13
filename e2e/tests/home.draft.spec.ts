import { expect, test } from '../fixtures/auth'

// Home has no route params — it is always `/`, and its content is "today" resolved in the account's
// own timezone rather than a value this suite controls. Assertions here are therefore structural
// (routes resolve, controls are named, a control does what its label says) rather than date-exact:
// asserting an exact date string would tie every run to `seedDateUtc` lining up with the real clock,
// which it does not (this pass caught a real one-day drift between the two while writing it).
const DATED_PLANNER_ROUTE = /\/day-planner\/\d{2}-\d{2}-\d{4}$/

test.describe('Home (/)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/')
		// The now bar is the first thing painted with real data; waiting on it avoids a race against
		// the six boot requests the way dayPlanner.spec.ts waits on `.task-block` rather than the grid.
		await authenticatedPage.locator('.nowbar').waitFor({ state: 'visible' })
	})

	test.describe('rendering', () => {
		test('shows the now bar and all five widgets', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.locator('.nowbar')).toBeVisible()
			await expect(authenticatedPage.getByText('Day planner', { exact: true })).toBeVisible()
			await expect(authenticatedPage.getByText('Routine tasks', { exact: true })).toBeVisible()
			await expect(authenticatedPage.getByText('Record activity', { exact: true })).toBeVisible()
			await expect(authenticatedPage.getByText("Today's activity", { exact: true })).toBeVisible()
			await expect(authenticatedPage.getByText('Upcoming tasks', { exact: true })).toBeVisible()
		})

		// Every icon-only control on this page must resolve an accessible name — the shell's own
		// hamburger (docs/views/_shell/inventory.md A2) is the counter-example this page does not
		// repeat. Checked structurally rather than one-by-one: getByRole('button') with no name filter
		// would still match an unnamed button, so an unnamed icon button fails this by matching nothing
		// when filtered by name and something when not, not by throwing — the count comparison below is
		// what actually catches it.
		test('every widget open-button is reachable by an accessible name', async ({ authenticatedPage }) => {
			const openButtons = authenticatedPage.getByRole('button', { name: /^Open: / })
			await expect(openButtons).toHaveCount(4)
		})
	})

	test.describe('widget navigation', () => {
		test('Day planner open button navigates to a dated planner route', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Open: Day planner' }).click()
			await expect(authenticatedPage).toHaveURL(DATED_PLANNER_ROUTE)
		})

		test('Routine tasks open button navigates to the routine list', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Open: Routine tasks' }).click()
			await expect(authenticatedPage).toHaveURL(/\/routine-todo-list$/)
		})

		test('Upcoming tasks open button navigates to the to-do list', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Open: Upcoming tasks' }).click()
			await expect(authenticatedPage).toHaveURL(/\/todo-list$/)
		})

		test("Today's activity open button navigates to the detail timeline for today", async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: "Open: Today's activity" }).click()
			await expect(authenticatedPage).toHaveURL(/\/activity-history\/detail\?date=\d{4}-\d{2}-\d{2}/)
		})

		test('Pomodoro quick-record button navigates to the pomodoro timer', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: /Pomodoro/ }).click()
			await expect(authenticatedPage).toHaveURL(/\/activity-history\/pomodoro$/)
		})

		test('a to-do row\'s "Add to planner" action navigates to a dated planner route', async ({ authenticatedPage }) => {
			// Locator chain observed live via playwright-cli: the row's own "More actions: {item}" menu
			// button, then the "Add to planner" item inside it. Falls back to the first to-do row rather
			// than a seeded id, since this widget shows whichever items are actually due/overdue today.
			await authenticatedPage.getByRole('button', { name: /^More actions: / }).first().click()
			await authenticatedPage.getByRole('button', { name: 'Add to planner' }).click()
			await expect(authenticatedPage).toHaveURL(DATED_PLANNER_ROUTE)
		})
	})

	test.describe('keyboard shortcuts', () => {
		test('P opens today\'s planner', async ({ authenticatedPage }) => {
			await authenticatedPage.keyboard.press('p')
			await expect(authenticatedPage).toHaveURL(DATED_PLANNER_ROUTE)
		})

		test('T opens the tracker for the focus task, Escape closes it', async ({ authenticatedPage }) => {
			// Only meaningful when a focus task exists — the seed account has a plan for today with
			// untouched tasks, so this holds under the current fixture. If the fixture ever ships a
			// day with no plan, this test's own failure is the signal to add a plan-less variant rather
			// than skip.
			await authenticatedPage.keyboard.press('t')
			const dialog = authenticatedPage.getByRole('dialog', { name: /^Log task: / })
			await expect(dialog).toBeVisible()
			await authenticatedPage.keyboard.press('Escape')
			await expect(dialog).not.toBeVisible()
		})
	})

	test.describe('hide/show done toggle', () => {
		test('toggling "Hide done" on the to-do widget flips its own label in place', async ({ authenticatedPage }) => {
			const toggle = authenticatedPage.getByRole('button', { name: /^(Show|Hide) done$/ }).nth(1)
			const initialLabel = await toggle.getAttribute('aria-label')
			await toggle.click()
			await expect(toggle).not.toHaveAttribute('aria-label', initialLabel ?? '')
		})

		// B3: the toggle does not persist across navigation at all — sessionStorage never receives a
		// `homeUi` key. Asserting the intended (persisted) behaviour here would be asserting a bug
		// fixed; stubbed until B3 is resolved.
		test.fixme(
			'the "Hide done" choice survives navigating away and back (B3)',
			async () => {},
		)
	})

	// Semantic tier — values and rules a human still has to confirm, or that this pass logged as a
	// defect. Never asserted directly; see docs/views/home/findings.md for the evidence behind each.
	test.fixme('now bar never shows "Done" on a day that has a real plan, including during the initial load (B2)', async () => {})
	test.fixme('RoutineTodoWidget\'s header controls stay reachable by pointer regardless of period count (B1)', async () => {})
	test.fixme('to-do row due-date chip text matches the real day offset (overdue/today/tomorrow/in N days)', async () => {})
	test.fixme('routine group "+N not due today" count matches the number of items isSuggestedForToday excludes', async () => {})
	test.fixme('activity history pie chart total matches the sum of today\'s tracked entries', async () => {})
	test.fixme('a widget shows its error state and Retry button on a forced request failure, not a false empty state (U1)', async () => {})
})
