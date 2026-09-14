import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the activity-settings
// inventory pass (docs/views/activity-settings/). Semantic-tier claims — anything asserting a
// VALUE or a RULE is correct, and every logged bug/unverified finding — are `test.fixme` stubs,
// per docs/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// Note for whoever triages `docs/views/activity-settings/findings.md`: `e2e/tests/activity-lifecycle.spec.ts`
// carries a `test.fixme` blocked on `POST /api/activity/grid` returning 405. That endpoint now returns 200
// with real data (confirmed repeatedly during this pass) — the 405 is stale, not a defect to re-diagnose.
// This file does not touch that existing spec (out of scope per the inventory-pass constraints), but the
// fixme there looks safe to un-block in a follow-up.

test.describe('Activity settings (/activity-settings/:tab)', () => {
	test('/activity-settings with no tab redirects to the activities tab', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-settings')
		await expect(authenticatedPage).toHaveURL(/\/activity-settings\/activities$/)
	})

	test.describe('Activities tab', () => {
		test.beforeEach(async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-settings/activities')
			await authenticatedPage.getByRole('columnheader', { name: 'Name' }).waitFor({ state: 'visible' })
		})

		test('renders the activities table with its columns', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Name' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Role' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Category' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Text' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Unavoidable' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Records' })).toBeVisible()
		})

		test('the Name filter debounces into the URL query', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('textbox', { name: 'Name' }).fill('read')
			await expect(authenticatedPage).toHaveURL(/[?&]name=read/)
		})

		test('the archived-view toggle updates the URL query and survives a reload', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Archived' }).click()
			await expect(authenticatedPage).toHaveURL(/[?&]archived=archived/)

			await authenticatedPage.reload()
			await expect(authenticatedPage.getByRole('button', { name: 'Archived' })).toHaveClass(/v-btn--active/)
			await expect(authenticatedPage).toHaveURL(/[?&]archived=archived/)
		})

		test('switching to another tab drops this tab\'s filter from the URL, switching back restores it in-memory', async ({
			authenticatedPage,
		}) => {
			await authenticatedPage.getByRole('textbox', { name: 'Name' }).fill('read')
			await expect(authenticatedPage).toHaveURL(/[?&]name=read/)

			await authenticatedPage.getByRole('tab', { name: 'Roles' }).click()
			await expect(authenticatedPage).toHaveURL(/\/activity-settings\/roles$/)

			await authenticatedPage.getByRole('tab', { name: 'Activities' }).click()
			await expect(authenticatedPage).toHaveURL(/[?&]name=read/)
			await expect(authenticatedPage.getByRole('textbox', { name: 'Name' })).toHaveValue('read')
		})

		test('"Add" opens the create-activity dialog, Cancel closes it without navigating away', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add' }).click()
			const dialog = authenticatedPage.getByRole('dialog', { name: 'Create new activity' })
			await expect(dialog).toBeVisible()
			await expect(dialog.getByRole('combobox', { name: 'Role' })).toBeVisible()
			await expect(dialog.getByRole('combobox', { name: 'Category' })).toBeVisible()

			await dialog.getByRole('button', { name: 'Cancel' }).click()
			await expect(dialog).not.toBeVisible()
			await expect(authenticatedPage).toHaveURL(/\/activity-settings\/activities/)
		})

		test('selecting two rows shows the Merge action; Unselect clears the selection', async ({ authenticatedPage }) => {
			const checkboxes = authenticatedPage.getByRole('row').getByRole('checkbox')
			await checkboxes.nth(1).check()
			await checkboxes.nth(2).check()
			const mergeButton = authenticatedPage.getByRole('button', { name: 'Merge' })
			await expect(mergeButton).toBeEnabled()

			await authenticatedPage.getByRole('button', { name: 'Unselect' }).click()
			await expect(mergeButton).not.toBeVisible()
		})

		test('opening the merge dialog shows a survivor choice and a confirmation warning; Cancel makes no change', async ({
			authenticatedPage,
		}) => {
			const checkboxes = authenticatedPage.getByRole('row').getByRole('checkbox')
			await checkboxes.nth(1).check()
			await checkboxes.nth(2).check()
			await authenticatedPage.getByRole('button', { name: 'Merge' }).click()

			const dialog = authenticatedPage.getByRole('dialog', { name: 'Merge activities' })
			await expect(dialog).toBeVisible()
			await expect(dialog.getByRole('radio').first()).toBeVisible()
			await expect(dialog.getByText('This cannot be undone.')).toBeVisible()

			await dialog.getByRole('button', { name: 'Cancel' }).click()
			await expect(dialog).not.toBeVisible()
		})
	})

	test.describe('Roles tab', () => {
		test.beforeEach(async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-settings/roles')
			await authenticatedPage.getByRole('columnheader', { name: 'Name' }).waitFor({ state: 'visible' })
		})

		test('renders the roles table with its columns', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Name' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Text' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Color' })).toBeVisible()
		})

		test('has its own filter state, independent of the Categories tab', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('textbox', { name: 'Name' }).fill('Work')
			await expect(authenticatedPage).toHaveURL(/[?&]name=Work/)

			await authenticatedPage.getByRole('tab', { name: 'Categories' }).click()
			await expect(authenticatedPage.getByRole('textbox', { name: 'Name' })).toHaveValue('')
		})
	})

	test.describe('Categories tab', () => {
		test.beforeEach(async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-settings/categories')
			await authenticatedPage.getByRole('columnheader', { name: 'Name' }).waitFor({ state: 'visible' })
		})

		test('renders the categories table with its columns', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Role' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Name' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Text' })).toBeVisible()
			await expect(authenticatedPage.getByRole('columnheader', { name: 'Color' })).toBeVisible()
		})
	})

	// --- Semantic tier: values and rules a human still has to confirm. Every one of these traces to a
	// logged finding in docs/views/activity-settings/findings.md — do not turn these into real assertions
	// without re-reading that finding first, since several assert the CURRENTLY-BROKEN behavior would be
	// wrong to encode as "expected".

	test.fixme(
		'picking a role from the Roles filter combobox narrows the activities table to that role (findings.md B1 — currently a no-op server-side)',
		async () => {},
	)

	test.fixme(
		'picking a category from the Categories filter combobox narrows the activities table (findings.md B1 — currently a no-op server-side)',
		async () => {},
	)

	test.fixme(
		'a roleIds/categoryIds query param survives a fresh navigation, same as name/text (findings.md B2 — currently dropped on load)',
		async () => {},
	)

	test.fixme(
		'only one POST /api/activity/grid fires per load of the Activities tab (findings.md B3 — currently fires twice, one aborted)',
		async () => {},
	)

	test.fixme(
		'an invalid :tab value redirects to the activities tab instead of rendering blank (findings.md B5)',
		async () => {},
	)

	test.fixme(
		'the breadcrumb reads "Home › Activity settings" on the Roles and Categories tabs, matching Activities (findings.md B6 — currently shows only "Home")',
		async () => {},
	)

	test.fixme(
		'the Delete button on the Activities table exposes an accessible name in both enabled and disabled states (findings.md A1)',
		async () => {},
	)

	test.fixme(
		'a deletable activity (seed.activities.deletable) has an enabled Delete button; a referenced one (seed.activities.notDeletable) has it disabled with an explanatory tooltip',
		async () => {},
	)

	test.fixme(
		'archiving an activity dims its row, shows the archive icon, and removes it from every picker; unarchiving reverses all three',
		async () => {},
	)

	test.fixme(
		'merging two activities repoints their history/records to the survivor and removes the others, per the confirmation dialog\'s stated count',
		async () => {},
	)

	test.fixme(
		'a system role\'s (or any canDelete:false role\'s) Delete button is disabled on the Roles tab, same as Activities (findings.md B7 — currently always enabled)',
		async () => {},
	)

	test.fixme(
		'an in-use category\'s (canDelete:false) Delete button is disabled on the Categories tab, same as Activities (findings.md B7 — currently always enabled)',
		async () => {},
	)
})
