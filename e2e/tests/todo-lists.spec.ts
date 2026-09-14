import { expect, test } from '../fixtures/auth'

// Structural-tier assertions only, captured during the todo-lists inventory pass (docs/views/todo-lists.*).
// Semantic-tier behaviour (calibration numbers, calibration ratio wording, which items are "overdue",
// whether a confirmation dialog's copy is correct, etc.) is stubbed as fixme — see
// docs/views/todo-lists.findings.md for what's already known to be missing or unverified.

test.describe('TodoListsView (/todo-list)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list')
		// The "NEW LIST" button is the most stable always-present landmark on this view.
		await authenticatedPage.getByRole('button', { name: 'New list' }).waitFor({ state: 'visible' })
	})

	test('shows the categories panel and the list panel', async ({ authenticatedPage }) => {
		// Scoped to the panel's own heading (`span.text-h6`), not `getByText('Categories', { exact: true })`:
		// that also matches the mobile "Categories" drawer-toggle button's `v-btn__content` span, which
		// carries the same exact text and is present (if CSS-hidden) in the DOM at desktop viewport too.
		await expect(authenticatedPage.locator('span.text-h6', { hasText: 'Categories' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'New list' })).toBeVisible()
	})

	test('New list button opens the create dialog', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'New list' }).click()
		await expect(authenticatedPage.getByRole('dialog')).toBeVisible()
		// getByLabel('Name') resolves to both the input and Vuetify's default-`clearable` "Clear Name"
		// icon button, which also carries an `aria-label` containing "Name" — strict mode fails on two
		// matches. Scope to the textbox role.
		await expect(authenticatedPage.getByRole('textbox', { name: 'Name' })).toBeVisible()
	})

	test('create dialog can be cancelled', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'New list' }).click()
		await expect(authenticatedPage.getByRole('dialog')).toBeVisible()
		await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
		await expect(authenticatedPage.getByRole('dialog')).not.toBeVisible()
	})

	test('list search filters the list panel and survives a reload', async ({ authenticatedPage }) => {
		// Search box has no accessible name of its own beyond the Vuetify "Search" label; scope to the
		// list panel's search (not the category panel's) by taking the second "Search" textbox.
		const searchBoxes = authenticatedPage.getByRole('textbox', { name: 'Search' })
		await searchBoxes.nth(1).fill('zzz-no-such-list-zzz')
		// Debounced 300ms in useTodoListFilters-equivalent for lists (TodoListsView's own debounce).
		await authenticatedPage.waitForTimeout(500)
		await expect(authenticatedPage.getByText(/no lists/i)).toBeVisible()
	})

	test('empty list renders "No tasks" rather than a loading or error state', async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`/todo-list/${seed.todoLists.empty}`)
		await expect(authenticatedPage.getByText('No tasks')).toBeVisible()
	})

	test.fixme(
		'per-list progress bar reflects the correct done/total count',
		// Semantic: requires knowing the seed's actual item counts per list.
		async () => {},
	)

	test.fixme(
		'deleting a non-empty list states how many items will be deleted, and cascades really delete them',
		// Semantic + mutating: belongs to the mutation pass.
		async () => {},
	)
})

test.describe('TodoListView (/todo-list/:id)', () => {
	async function gotoFirstList(authenticatedPage: import('@playwright/test').Page) {
		await authenticatedPage.goto('/todo-list')
		await authenticatedPage.getByRole('button', { name: 'New list' }).waitFor({ state: 'visible' })
		// TodoListCard has no accessible role of its own; its container is the first clickable card
		// under the list panel. Fall back to a broad locator and click the first match.
		const firstCard = authenticatedPage.locator('.v-card').filter({ hasText: /done/i }).first()
		await firstCard.click()
		await authenticatedPage.waitForURL(/\/todo-list\/\d+$/)
	}

	test.beforeEach(async ({ authenticatedPage }) => {
		await gotoFirstList(authenticatedPage)
	})

	test('shows the item list toolbar', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('button', { name: 'ADD' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: /CHANGE ORDER/i })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: /FOCUS/i })).toBeVisible()
	})

	test('ADD opens the item creation dialog', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'ADD' }).click()
		await expect(authenticatedPage.getByText('Add to to-do list')).toBeVisible()
	})

	test('item creation dialog can be cancelled', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'ADD' }).click()
		await expect(authenticatedPage.getByText('Add to to-do list')).toBeVisible()
		await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
		await expect(authenticatedPage.getByText('Add to to-do list')).not.toBeVisible()
	})

	test('FOCUS toggles focus mode in the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /FOCUS/i }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]focusMode=true/)
		await authenticatedPage.getByRole('button', { name: /FOCUS/i }).click()
		await expect(authenticatedPage).not.toHaveURL(/focusMode=true/)
	})

	test('Hide done toggles the hideDone query param and survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.getByLabel('Hide done').click()
		await expect(authenticatedPage).toHaveURL(/[?&]hideDone=true/)
		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/[?&]hideDone=true/)
		await expect(authenticatedPage.getByLabel('Hide done')).toBeChecked()
	})

	test('sort cycle button changes label across custom / priority / due date', async ({ authenticatedPage }) => {
		const sortButton = authenticatedPage.getByRole('button', { name: /CUSTOM ORDER|BY PRIORITY|BY DUE DATE/i })
		await expect(sortButton).toHaveText(/CUSTOM ORDER/i)
		await sortButton.click()
		await expect(authenticatedPage).toHaveURL(/[?&]sort=priority/)
		await sortButton.click()
		await expect(authenticatedPage).toHaveURL(/[?&]sort=dueDate/)
		await sortButton.click()
		await expect(authenticatedPage).not.toHaveURL(/sort=/)
	})

	test('CHANGE ORDER is disabled while a non-custom sort is active', async ({ authenticatedPage }) => {
		const sortButton = authenticatedPage.getByRole('button', { name: /CUSTOM ORDER|BY PRIORITY|BY DUE DATE/i })
		await sortButton.click() // -> priority
		await expect(authenticatedPage.getByRole('button', { name: /CHANGE ORDER/i })).toBeDisabled()
		await sortButton.click()
		await sortButton.click() // back to custom
		await expect(authenticatedPage.getByRole('button', { name: /CHANGE ORDER/i })).toBeEnabled()
	})

	// KNOWN FLAKE (2026-09-11): this is the one test in the suite that has failed under load. It failed
	// once in a full run that took 7.2 min against the usual 4.5 (a browser session was competing for the
	// machine) and passed standalone immediately after, in 13.4 s. Both buttons are plain role+name
	// locators on a list that is already rendered, so the likely cause is the reorder toggle's re-render
	// losing the click under contention rather than anything in this spec. If you see it red once, re-run
	// it alone before investigating; if it fails alone, that is new and worth chasing.
	test('CHANGE ORDER mode can be entered and exited without reordering', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'CHANGE ORDER' }).click()
		await expect(authenticatedPage.getByRole('button', { name: /FINISH REORDERING/i })).toBeVisible()
		await authenticatedPage.getByRole('button', { name: /FINISH REORDERING/i }).click()
		await expect(authenticatedPage.getByRole('button', { name: 'CHANGE ORDER' })).toBeVisible()
	})

	// This asserted `getByText(/no tasks/i)` until 2026-09-11, which was the PRE-FIX behaviour: showing a
	// missing list as the same generic empty state a legitimately empty list gets was the bug itself
	// (finding B1 in docs/views/todo-lists/findings.md). B1's fix deliberately replaced that copy with an
	// explicit not-found alert, so the old assertion could only ever go red once the fix landed. Asserting
	// the not-found state is the point — "does not crash" is the weaker half.
	test('invalid id shows an explicit not-found state, not the empty-list copy', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/999999')

		const notFound = authenticatedPage.getByRole('alert')
		await expect(notFound).toContainText("This list doesn't exist")
		await expect(notFound.getByRole('link', { name: 'To the lists' })).toHaveAttribute('href', '/todo-list')

		// The distinction B1 is about: a missing list must NOT read as an empty one.
		await expect(authenticatedPage.getByText(/no tasks/i)).toHaveCount(0)
	})

	test.fixme(
		'focus star cap: a 4th focus attempt shows "unmark one first" and does not add a 4th item',
		// Semantic: exact wording + count-based rule, and depends on there being >=4 items in the seed list.
		async () => {},
	)

	test.fixme(
		'"Not scheduled" chip opens the day-planner dialog prefilled with the correct activity',
		// Semantic: depends on cross-module (dayPlanner) prefill correctness.
		async () => {},
	)

	// The per-item calibration chip and the header calibration line used to be a fixme here, on the
	// grounds that the seed could not reach the >=5 comparable items the ratio is gated on. `e2e-v2`
	// ships 6 and the estimates now come back on the wire, so both are written for real — in
	// todo-motivation.spec.ts, with the rest of the motivation surfaces rather than duplicated here.

	// Was a fixme on the grounds that "asserting no console error would currently fail". Half of that is
	// still true and always will be, so the assertion is scoped to the half that is actionable.
	//
	// What B1 actually fixed is the UNHANDLED rejection: the mount load is now caught, so Vue no longer
	// logs "Unhandled error during execution of mounted hook at <TodoListView>" and nothing reaches
	// `pageerror`. What remains on an invalid id is two lines that are not this view's to remove — the
	// browser's own `Failed to load resource: 404`, and the axios interceptor's deliberate app-wide
	// `console.error('ERROR: ', error)` at `_common/axiosConfig.ts:118`, which logs EVERY error response,
	// handled or not. Silencing that is a framework-wide logging decision, so asserting a clean console
	// here would be asserting something this view cannot deliver.
	test('invalid id does not produce an unhandled exception', async ({ authenticatedPage }) => {
		const unhandled: string[] = []
		// Attached before navigating, so anything the beforeEach load produced is excluded by construction.
		authenticatedPage.on('pageerror', error => unhandled.push(`pageerror: ${error.message}`))
		authenticatedPage.on('console', message => {
			if (message.type() === 'error' && /unhandled|mounted hook/i.test(message.text())) {
				unhandled.push(message.text())
			}
		})

		await authenticatedPage.goto('/todo-list/999999')
		// Wait on the rendered outcome, not the navigation: the rejection would land after first paint.
		await expect(authenticatedPage.getByRole('alert')).toContainText("This list doesn't exist")

		expect(unhandled).toEqual([])
	})

	// P1's fix (docs/views/todo-lists/findings.md) broadened the reset to `hideDone` and left `sort` out
	// on purpose — it reorders rather than hides, and its own button always names the mode. So the
	// assertion is: the chip appears for hideDone alone, and one click clears hideDone and due together.
	test('"Clear filters" resets hideDone together with the due filter, and leaves sort alone', async ({
		authenticatedPage,
	}) => {
		const clearChip = authenticatedPage.locator('#app').getByText('Clear filters')
		await expect(clearChip).toBeHidden()
		await authenticatedPage.getByLabel('Hide done').click()
		await expect(authenticatedPage).toHaveURL(/[?&]hideDone=true/)
		await expect(clearChip).toBeVisible()
		await authenticatedPage.locator('#app').getByText('Past due', { exact: true }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]due=overdue/)
		const sortButton = authenticatedPage.getByRole('button', { name: /CUSTOM ORDER|BY PRIORITY|BY DUE DATE/i })
		await sortButton.click()
		await expect(authenticatedPage).toHaveURL(/[?&]sort=priority/)

		await clearChip.click()
		await expect(authenticatedPage).not.toHaveURL(/hideDone=|due=/)
		await expect(authenticatedPage).toHaveURL(/[?&]sort=priority/)
		await expect(authenticatedPage.getByLabel('Hide done')).not.toBeChecked()
		await expect(clearChip).toBeHidden()
	})
})
