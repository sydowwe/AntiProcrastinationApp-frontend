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

	test('invalid id shows an empty state instead of crashing the page', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/999999')
		await expect(authenticatedPage.getByText(/no tasks/i)).toBeVisible()
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

	test.fixme(
		'per-item calibration chip and header calibration line render correctly once >=5 comparable items exist',
		// Semantic + needs specific seed data (see findings B3/O1) — not reachable with the default seed.
		async () => {},
	)

	test.fixme(
		'the invalid-id case should not produce an unhandled console exception',
		// Logged as bug B1 in todo-lists.findings.md — asserting "no console error" would currently fail.
		async () => {},
	)

	test.fixme(
		'"Clear filters" resets hideDone and sort in addition to priority/due filters',
		// Logged as polish P1 — currently false, so this is a fixme rather than a real assertion.
		async () => {},
	)
})
