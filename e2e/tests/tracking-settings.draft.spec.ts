import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the tracking-settings
// inventory pass (docs/views/tracking-settings/). Semantic-tier claims — anything asserting a
// VALUE or a RULE is correct, and every logged bug/unverified finding — are `test.fixme` stubs,
// per docs/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.

test.describe('Desktop tracking settings (/activity-tracking/desktop/settings/:tableView)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await authenticatedPage.getByRole('heading', { name: 'Distinct Process Entries' }).waitFor({ state: 'visible' })
	})

	test('renders the distinct entries table with its three columns', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Process Name' })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: /Product Name/ })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Window Title' })).toBeVisible()
	})

	test('Mappings tab navigates via a real route change, Distinct entries tab navigates back', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Mappings' }).click()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/desktop\/settings\/mappings$/)

		await authenticatedPage.getByRole('link', { name: 'Distinct entries' }).click()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/desktop\/settings\/distinctEntries$/)
	})

	test('browser back/forward between tabs keeps the URL and rendered tab in sync (R4 route-param fix)', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.getByRole('link', { name: 'Mappings' }).click()
		await expect(authenticatedPage).toHaveURL(/\/mappings$/)

		await authenticatedPage.goBack()
		await expect(authenticatedPage).toHaveURL(/\/distinctEntries$/)
		await expect(authenticatedPage.getByRole('link', { name: 'Distinct entries' })).toBeVisible()

		await authenticatedPage.goForward()
		await expect(authenticatedPage).toHaveURL(/\/mappings$/)
	})

	test('an unrecognised :tableView value falls back to the distinct entries table, not an error', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/not-a-real-tab')
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Process Name' })).toBeVisible()
	})

	test('Enter in the Process Name field submits the filter, same as clicking Filter', async ({ authenticatedPage }) => {
		const processName = authenticatedPage.getByRole('textbox', { name: 'Process Name' })
		await processName.fill('rider')
		await processName.press('Enter')
		// Both seeded rider64.exe rows match; the other four seeded desktop entries don't.
		await expect(authenticatedPage.getByRole('cell', { name: 'rider64.exe' })).toHaveCount(2)
	})

	test('the dismissible hint alert stays dismissed after a reload (useUserScopedStorage)', async ({ authenticatedPage }) => {
		const hint = authenticatedPage.getByText('Use the filter fields to define a matching pattern')
		await expect(hint).toBeVisible()
		await authenticatedPage.getByRole('button', { name: 'Close' }).click()
		await expect(hint).not.toBeVisible()

		await authenticatedPage.reload()
		await authenticatedPage.getByRole('heading', { name: 'Distinct Process Entries' }).waitFor({ state: 'visible' })
		await expect(hint).not.toBeVisible()
	})

	test('"Create new activity" opens a dialog that Cancel closes without navigating away', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Create new activity' }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Create new activity' })
		await expect(dialog).toBeVisible()

		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).not.toBeVisible()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/desktop\/settings\/distinctEntries$/)
	})
})

test.describe('Android tracking settings (/activity-tracking/android/settings/:tableView)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/android/settings/distinctEntries')
		await authenticatedPage.getByRole('heading', { name: 'Distinct App Entries' }).waitFor({ state: 'visible' })
	})

	test('renders the distinct entries table with its two columns (no Window Title — apps have none)', async ({
		authenticatedPage,
	}) => {
		await expect(authenticatedPage.getByRole('columnheader', { name: /App Label/ })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Package Name' })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Window Title' })).toHaveCount(0)
	})

	test('Mappings tab navigates via a real route change', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Mappings' }).click()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/android\/settings\/mappings$/)
	})
})

test.describe('Findings from the inventory pass — semantic tier, not yet fixed', () => {
	// docs/views/tracking-settings/findings.md X1: the mapping row (and its edit/delete buttons) is
	// present in the DOM but nothing is painted at its coordinates, and a real click cannot reach it.
	test.fixme(
		'X1: the Mappings tab row is visible and its edit button is clickable',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings')
			await authenticatedPage.getByRole('button', { name: 'edit' }).click()
			await expect(authenticatedPage).toHaveURL(/\/distinctEntries$/)
		},
	)

	// findings.md B1: none of the Mappings tab's filter controls (top pattern bar, or Is
	// active/Type/Role/Category/Activity below) trigger a re-fetch.
	test.fixme(
		'B1: changing the Type filter on the Mappings tab re-fetches the grid',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings')
			const requestPromise = authenticatedPage.waitForRequest(/tracker-desktop-mapping-by-pattern\/grid/)
			await authenticatedPage.getByLabel('Type').click()
			await authenticatedPage.getByRole('option', { name: 'Ignored' }).click()
			await requestPromise
		},
	)

	// findings.md B2: the breadcrumb on the Mappings tab reads the sibling dashboard's label
	// ("Desktop tracking") instead of this route's own ("Desktop settings").
	test.fixme('B2: breadcrumb on the Mappings tab reads "Desktop settings", not "Desktop tracking"', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings')
		await expect(authenticatedPage.locator('.v-breadcrumbs')).toContainText('Desktop settings')
	})

	// findings.md B3: the distinct-entries filter is plain component state, not a URL query param,
	// so it does not survive a reload (CLAUDE.md's "URL State" rule).
	test.fixme('B3: the Process Name filter survives a page reload via a URL query param', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await authenticatedPage.getByRole('textbox', { name: 'Process Name' }).fill('chrome')
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByRole('textbox', { name: 'Process Name' })).toHaveValue('chrome')
	})

	// findings.md U1: DesktopMappingsTable/AndroidMappingsTable never listen for BasicTable's
	// @onDelete, so confirming a delete may be a silent no-op. Blocked on X1 until the button can be
	// reached with a real click.
	test.fixme('U1: deleting a mapping actually removes it (blocked on X1)', async () => {})
})
