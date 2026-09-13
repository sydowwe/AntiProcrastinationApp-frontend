import { expect, test } from '../fixtures/auth'

// Structural tier only — facts true by observation, not values that need a human's judgement.
// See docs/views/leisure-projects/findings.md for the semantic-tier gaps stubbed below (B1-B3).

test.describe('Leisure projects (/leisure/projects)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/projects')
		// The board's own fetch resolves after the initial paint — wait for the seeded project's card
		// (not just the column headers, which render before data arrives) before asserting anything.
		await authenticatedPage.getByText('Build a Bookshelf').waitFor({ state: 'visible' })
	})

	test.describe('rendering', () => {
		test('renders the readiness board with its three columns by default', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('button', { name: 'Board' })).toBeVisible()
			await expect(authenticatedPage.getByText('Ready to start')).toBeVisible()
			await expect(authenticatedPage.getByText('Needs shopping')).toBeVisible()
			await expect(authenticatedPage.getByText('Planning')).toBeVisible()
		})

		test('switching to Table renders a grid with the expected columns', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Table' }).click()
			const headerRow = authenticatedPage.getByRole('row').first()
			await expect(headerRow.getByRole('columnheader', { name: /Activity/ })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Difficulty' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Readiness' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Area' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Est. hours' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Messy' })).toBeVisible()
		})

		test('table Activity column is sortable and writes sortBy to the URL', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Table' }).click()
			await authenticatedPage.getByRole('columnheader', { name: /Activity/ }).click()
			await expect(authenticatedPage).toHaveURL(/sortBy=activity\.name:(asc|desc)/)
		})
	})

	test.describe('filter panel', () => {
		test('opens on Filter, closes on Escape', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
			await expect(authenticatedPage.getByRole('dialog', { name: 'Filter' })).toBeVisible()
			await authenticatedPage.keyboard.press('Escape')
			await expect(authenticatedPage.getByRole('dialog', { name: 'Filter' })).toBeHidden()
		})

		test('a confirmed filter survives a reload', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
			// The dropdown's own input intercepts pointer events on a direct click — click the field
			// wrapper instead, same as the manual pass that first found this locator.
			await authenticatedPage.getByText('ReadinessReadiness').click()
			await authenticatedPage.getByRole('option', { name: 'Needs shopping' }).click()
			await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
			await expect(authenticatedPage).toHaveURL(/readinessStatuses=needsShopping/)

			await authenticatedPage.reload()
			await expect(authenticatedPage.getByText('Readiness (1)')).toBeVisible()
			await expect(authenticatedPage).toHaveURL(/readinessStatuses=needsShopping/)
		})

		test('filtering to zero matches renders the onboarding empty state', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
			await authenticatedPage.getByRole('textbox', { name: 'Area' }).fill('zzz-no-such-area')
			await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
			await expect(
				authenticatedPage.getByText("These are things you're building or making. You don't have any projects here yet."),
			).toBeVisible()
		})
	})

	test.describe('dialogs', () => {
		test('Add opens the create dialog; Cancel closes it without creating', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add' }).click()
			await expect(authenticatedPage.getByRole('dialog', { name: 'Projects' })).toBeVisible()
			await authenticatedPage.getByRole('button', { name: 'Cancel' }).click()
			await expect(authenticatedPage.getByRole('dialog', { name: 'Projects' })).toBeHidden()
		})

		test('card delete opens a confirmation naming the project, Cancel dismisses it', async ({ authenticatedPage }) => {
			await authenticatedPage.getByTitle('Delete').click()
			const confirmDialog = authenticatedPage.getByRole('dialog', { name: 'Delete confirmation' })
			await expect(confirmDialog).toBeVisible()
			await expect(confirmDialog.getByText('Build a Bookshelf')).toBeVisible()
			await confirmDialog.getByRole('button', { name: 'Cancel' }).click()
			await expect(confirmDialog).toBeHidden()
			// Cleanup check, not an assertion of anything semantic: the card must still be there.
			await expect(authenticatedPage.getByText('Build a Bookshelf')).toBeVisible()
		})
	})

	// Semantic tier — logged as bugs in docs/views/leisure-projects/findings.md. Do not assert; a human
	// triages these first.

	// findings.md B1 — clicking Table from a fresh (query-string-free) load does not reliably write
	// `view=table` to the URL, so a reload can silently fall back to Board.
	test.fixme('Table view mode survives a reload', async () => {})

	// findings.md B2 — a board-mode filter change fires two competing grid requests (itemsPerPage 200
	// and 25) sharing one AbortController; only one should ever fire.
	test.fixme('exactly one grid request fires per board-mode filter change', async () => {})

	// findings.md B3 — the API nests activity icon/colour under `activity.role`, but `ActivityInfo`
	// reads them flat, so the icon L3 built never renders on the card or table row.
	test.fixme('project card/row renders the activity icon tinted with its role colour', async () => {})
})
