import { expect, seedDateParam, test } from '../fixtures/auth'

// Every date here comes from `seed.seedDateUtc` via `seedDateParam`, never `new Date()` — the rule
// this file used to state in a comment while a module-level `const today = new Date()` did the
// opposite. Two reasons it matters, beyond the midnight-straddle flake the rule exists for: the
// seed's planner rows are clock-relative to the seed date, so the base day is the only one that
// holds three task blocks; and the old helper formatted in LOCAL time while `seedDateParam` formats
// in UTC, so the two disagreed for part of every day west of UTC.
//
// The route carries the date explicitly, so the arrow-key specs work from any base day.

/**
 * Foreground task blocks visible on the base day. The seed puts THREE planner tasks on `seedDateUtc`,
 * but the grid only draws the calendar's waking window (08:00 → bedtime for the seeded calendar) and
 * "Morning Exercise" starts at 07:30, above the top of the column. Two is what the screen shows.
 *
 * This is asserted rather than guarded around. The nine specs below used to open with
 * `if ((await taskBlocks.count()) === 0) test.skip()`, which turned a real defect into a green run:
 * `loadTasks` was rejecting on a malformed suggestions request and rendering NO tasks on any day, so
 * all nine skipped themselves silently and the empty-day spec above passed vacuously. A count this
 * file depends on belongs in an assertion, where a regression is a failure.
 */
const VISIBLE_BASE_DAY_TASKS = 2

test.describe('Day Planner', () => {
	test.beforeEach(async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`/day-planner/${seedDateParam(seed)}`)
		await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
		// Wait for the BLOCKS, not just the grid: the grid paints first and the task fetch resolves
		// after it, so a `count()` taken here reads 0 and a click lands on a block still being laid
		// out. `toHaveCount` retries, which is the point — `count()` does not. Same race, and same
		// remedy, as the one documented in templateDayPlanner.spec.ts.
		await expect(authenticatedPage.locator('.task-block')).toHaveCount(VISIBLE_BASE_DAY_TASKS, {
			timeout: 15_000,
		})
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
	// so +2 is a deliberate empty day (the calendar row for it exists), not a missing-day error.
	test.describe('empty day (no planner tasks scheduled)', () => {
		test('renders the grid normally with no task blocks, not an error state', async ({ authenticatedPage, seed }) => {
			// Prove the negative is meaningful FIRST. `toHaveCount(0)` on +2 passes just as happily when
			// nothing renders on any day — which is exactly what was happening while the suggestions
			// request 400'd and took `store.tasks` down with it. The base day is the control.
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(VISIBLE_BASE_DAY_TASKS)

			await authenticatedPage.goto(`/day-planner/${seedDateParam(seed, 2)}`)
			await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
			await expect(authenticatedPage.getByRole('button', { name: 'Add Task' })).toBeVisible()
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(0)
		})
	})

	test.describe('keyboard date navigation', () => {
		test('ArrowLeft navigates to previous day', async ({ authenticatedPage, seed }) => {
			await authenticatedPage.keyboard.press('ArrowLeft')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${seedDateParam(seed, -1)}$`))
		})

		test('ArrowRight navigates to next day', async ({ authenticatedPage, seed }) => {
			await authenticatedPage.keyboard.press('ArrowRight')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${seedDateParam(seed, 1)}$`))
		})

		test('navigating back then forward returns to the starting day', async ({ authenticatedPage, seed }) => {
			await authenticatedPage.keyboard.press('ArrowLeft')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${seedDateParam(seed, -1)}$`))
			// Wait for the grid to reload before pressing the next key
			await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
			await authenticatedPage.keyboard.press('ArrowRight')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${seedDateParam(seed)}$`))
		})

		test('arrow keys do not navigate when a text input is focused', async ({ authenticatedPage, seed }) => {
			// The handleArrowKey guard ignores events from INPUT/TEXTAREA/contentEditable.
			// Find any input on the page (e.g. the time range picker in the header) and focus it.
			await authenticatedPage.locator('input').first().focus()
			await authenticatedPage.keyboard.press('ArrowLeft')
			await expect(authenticatedPage).toHaveURL(new RegExp(`/day-planner/${seedDateParam(seed)}$`))
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
			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Change Status' })).toBeVisible()
		})

		test('Change Status button opens a status menu', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: 'Change Status' }).click()
			// Scoped to the overlay container: the navigation sidebar is a `.v-list` too, so a bare
			// `.v-list` is a strict-mode violation rather than the menu this asserts on.
			await expect(authenticatedPage.locator('.v-overlay-container .v-list')).toBeVisible()
		})

		test('Reschedule button is visible when a task is selected', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Reschedule' })).toBeVisible()
		})

		test('Reschedule button opens the Reschedule tasks dialog', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: 'Reschedule' }).click()
			await expect(authenticatedPage.getByText('Reschedule tasks')).toBeVisible()
		})

		test('cancelling the Reschedule dialog closes it without rescheduling', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: 'Reschedule' }).click()
			await expect(authenticatedPage.getByText('Reschedule tasks')).toBeVisible()
			// Scoped to the dialog. The selection action bar has its own CANCEL — the one that clears the
			// selection — so an unscoped /cancel/i matches two buttons that do opposite things.
			await authenticatedPage.getByRole('dialog').getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.getByText('Reschedule tasks')).not.toBeVisible()
		})

		test('Log time button is visible when exactly one task is selected', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Log time' })).toBeVisible()
		})
	})

	// DELETE IS UNREACHABLE AT THIS SUITE'S VIEWPORT, AND THAT IS A REAL DEFECT — NOT A LOCATOR BUG.
	// `_common/component/ActionBar.vue` positions the floating selection bar with
	// `position: fixed; left: 50%; transform: translateX(-50%)`, which centres it on the VIEWPORT while
	// Vuetify insets the content with `padding-left: 288px` on `.v-main` for the expanded nav drawer.
	// The bar therefore sits ~144px left of the content it belongs to, and its leftmost action —
	// Delete — slides under the drawer, which intercepts the pointer events (the drawer outranks the
	// bar's `z-index: 50`). Playwright reports it as `<div class="v-navigation-drawer__content"> from
	// <header> subtree intercepts pointer events`, and the failure screenshot shows the bar starting at
	// EDIT with DELETE clipped off.
	//
	// It is user-facing: at 1280x720 with the sidebar open, a selected planner task cannot be deleted
	// from the action bar at all. It reproduces on every view that mounts the shared ActionBar, so the
	// fix belongs in the framework submodule (centre on the content box, not the viewport) and is left
	// for the owner to direct rather than improvised here.
	//
	// These were previously `if (count === 0) test.skip()` — they never ran, so this never surfaced.
	// `fixme` rather than a weakened locator, per the suite's own rule.
	//
	// Note the asymmetry below: the bar's presence still asserts and passes, because Playwright's
	// visibility check is about layout, not occlusion — a button covered by the drawer is still
	// "visible". Only the two specs that CLICK Delete fail. That gap is worth knowing about: a
	// visibility assertion cannot catch this class of defect.
	test.describe('task selection and deletion', () => {
		test('selecting a task shows the selection action bar', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			await taskBlocks.first().click()
			// Action bar appears with at least a Delete button
			await expect(authenticatedPage.getByRole('button', { name: /delete/i })).toBeVisible()
		})

		test.fixme('delete action shows a confirmation dialog', async () => {})

		test.fixme('cancelling the delete dialog keeps the task', async () => {})
	})
})
