import { expect, test } from '../fixtures/auth'

// Structural-tier assertions only, captured during the todo-routine inventory pass
// (docs/views/todo-routine/*). Semantic-tier behaviour (streak numbers, which progress number is "correct",
// whether a confirmation dialog's copy is right, etc.) is stubbed as fixme — see
// docs/views/todo-routine/findings.md for what's already known to be missing, wrong, or unverified.

test.describe('RoutineToDoListView (/routine-todo-list)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/routine-todo-list')
		await authenticatedPage.getByRole('button', { name: 'Add' }).waitFor({ state: 'visible' })
	})

	test('shows the toolbar', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('link', { name: 'Settings', exact: true })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Add' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Reorder', exact: true })).toBeVisible()
	})

	test('Settings link navigates to /routine-settings', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Settings', exact: true }).click()
		await expect(authenticatedPage).toHaveURL(/\/routine-settings$/)
	})

	test('Add opens the create dialog', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Add' }).click()
		await expect(authenticatedPage.getByText('Add to routine to-do list')).toBeVisible()
	})

	test('create dialog can be cancelled', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Add' }).click()
		await expect(authenticatedPage.getByText('Add to routine to-do list')).toBeVisible()
		await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
		await expect(authenticatedPage.getByText('Add to routine to-do list')).not.toBeVisible()
	})

	test('Groups select lists the four seeded periods', async ({ authenticatedPage }) => {
		// The select's own chips overlap its click area once every group is selected (the seeded
		// default), so a pointer click can be intercepted by a chip. Opening via keyboard sidesteps
		// that entirely and is the more realistic interaction anyway.
		await authenticatedPage.getByLabel('Groups').focus()
		await authenticatedPage.keyboard.press('Enter')
		const listbox = authenticatedPage.getByRole('listbox')
		await expect(listbox.getByRole('option', { name: 'Daily' })).toBeVisible()
		await expect(listbox.getByRole('option', { name: 'Weekly' })).toBeVisible()
		await expect(listbox.getByRole('option', { name: 'Monthly' })).toBeVisible()
		await expect(listbox.getByRole('option', { name: 'Yearly' })).toBeVisible()
	})

	test('Reorder toggle swaps its label with the mode', async ({ authenticatedPage }) => {
		// B7, fixed: the button used to signal reorder mode by colour alone, keeping the name "Reorder"
		// in both states. It now says what clicking it will do. Same element throughout — only the
		// accessible name changes, which is why entering the mode makes the "Reorder" locator resolve
		// to nothing rather than to a second button.
		const enterReorder = authenticatedPage.getByRole('button', { name: 'Reorder', exact: true })
		await expect(enterReorder).toBeVisible()

		await enterReorder.click()
		const exitReorder = authenticatedPage.getByRole('button', { name: 'Finish reordering', exact: true })
		await expect(exitReorder).toBeVisible()
		await expect(enterReorder).toHaveCount(0)

		await exitReorder.click()
		await expect(enterReorder).toBeVisible()
	})

	test.fixme(
		'checking off an item toggles done without opening the log-time dialog',
		// B1, now FIXED and browser-verified (round 2b) — this stub is ready to be written, and the
		// assertion is the obvious one: click a single-count item's checkbox, expect it to toggle and
		// expect no dialog. Deliberately left unwritten here because it needs locators for a specific
		// seeded routine item, and a spec guessed from the .vue source is exactly what this suite is
		// meant not to contain. Write it while driving the page.
		async () => {},
	)

	test.fixme(
		'a group card shows exactly one progress summary',
		// B2, now FIXED and browser-verified (round 2b). Renamed: the two indicators no longer need to
		// agree, because RoutineGroupStats's "N / M" line is gone and BaseToDoList's "%" bar is the only
		// summary left. The assertion is therefore "no N/M line in the card header", which needs a
		// confirmed locator for that header — write it while driving the page.
		async () => {},
	)

	test.fixme(
		'the time-period field in the Add dialog is labelled "Time period", not a raw i18n key',
		// Logged as bug B3 — currently renders literally as "toDoList.timePeriod".
		async () => {},
	)

	test.fixme(
		'streak flame tooltip text is localized',
		// Logged as bug B6 — currently a hardcoded English literal regardless of account locale.
		async () => {},
	)

	test.fixme(
		'weekly review card appears on the first visit of a new week, once a routine has elapsed periods',
		// Logged as unverified U1 — needs seed data with totalPeriodsElapsed > 0 for at least one period.
		async () => {},
	)
})

test.describe('RoutineSettingsView (/routine-settings)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/routine-settings')
		await authenticatedPage.getByRole('button', { name: 'Add' }).waitFor({ state: 'visible' })
	})

	test('shows the time-period table with the seeded periods', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByText('Time Periods')).toBeVisible()
		await expect(authenticatedPage.getByRole('cell', { name: 'Daily' })).toBeVisible()
		await expect(authenticatedPage.getByRole('cell', { name: 'Weekly' })).toBeVisible()
		await expect(authenticatedPage.getByRole('cell', { name: 'Monthly' })).toBeVisible()
		await expect(authenticatedPage.getByRole('cell', { name: 'Yearly' })).toBeVisible()
	})

	test('Add opens the create dialog', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Add' }).click()
		await expect(authenticatedPage.getByText('Add time period')).toBeVisible()
	})

	test('create dialog can be cancelled', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Add' }).click()
		await expect(authenticatedPage.getByText('Add time period')).toBeVisible()
		await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
		await expect(authenticatedPage.getByText('Add time period')).not.toBeVisible()
	})

	test.fixme(
		'delete confirmation names the period being deleted, not its raw id',
		// Logged as bug B5 — currently reads "Are you sure you want to delete 4?".
		async () => {},
	)

	test.fixme(
		'every label on this page and its dialogs is localized',
		// Logged as bug B4 — the whole view and TimePeriodForm are hardcoded-English literals with no
		// $t() calls at all, so this needs a Slovak-locale run to actually catch it (no console warning
		// fires for a literal the way it does for an unresolved key).
		async () => {},
	)

	test.fixme(
		'personal-bests panel renders once a period has elapsed history',
		// Logged as unverified U2 — needs seed data with totalPeriodsElapsed > 0.
		async () => {},
	)
})
