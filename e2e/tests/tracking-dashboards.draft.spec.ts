import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the tracking-dashboards
// inventory pass (docs/views/tracking-dashboards/). Semantic-tier claims — anything asserting a
// VALUE or a RULE is correct, and every logged bug/a11y finding — are `test.fixme` stubs, per
// docs/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.

test.describe('Web-extension dashboard (/activity-tracking)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking')
		await authenticatedPage.getByRole('heading', { name: 'Activity Dashboard' }).waitFor({ state: 'visible' })
	})

	test('renders the timeline by default with Stacked bars / Timeline toggle', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('heading', { name: 'Activity Timeline' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Stacked bars' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Timeline' })).toBeVisible()
	})

	test('picking "Last 7 days" switches to range mode, forces stacked bars, and writes the URL', async ({
		authenticatedPage,
	}) => {
		// Scoped to `.v-chip`: the plain text "Last 7 days" also appears as the (unrelated) default
		// baseline combobox's current selection, and an unscoped getByText resolves both.
		await authenticatedPage.locator('.v-chip').filter({ hasText: 'Last 7 days' }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]date=\d{4}-\d{2}-\d{2}/)
		await expect(authenticatedPage).toHaveURL(/[?&]dateTo=\d{4}-\d{2}-\d{2}/)
		// Timeline becomes unavailable once a multi-day range is active.
		await expect(authenticatedPage.getByText('Showing stacked bars for the multi-day range')).toBeVisible()
	})

	test('selecting a Top Domains card writes ?selected= to the URL', async ({ authenticatedPage }) => {
		const firstCard = authenticatedPage.getByRole('button', { name: /^View details for/ }).first()
		const label = await firstCard.textContent()
		await firstCard.click()
		await expect(authenticatedPage).toHaveURL(/[?&]selected=/)
		expect(label).toBeTruthy()
	})

	test('URL-seeded date range survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking?date=2026-09-08&dateTo=2026-09-14&window=240')
		await authenticatedPage.getByText('08.09.2026').waitFor({ state: 'visible' })
		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/date=2026-09-08.*dateTo=2026-09-14/)
		await expect(authenticatedPage.getByText('08.09.2026')).toBeVisible()
	})

	test('an unreachable date renders the empty state, not an error', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking?date=2020-01-01')
		// The timeline says "...this period", the top-domains/pie-chart panels say "...this day" —
		// deliberately not asserting they match (see findings.md — wording is inconsistent), just that
		// the empty state renders rather than an error.
		await expect(authenticatedPage.getByText(/No activity recorded for this (period|day)/).first()).toBeVisible()
	})
})

test.describe('Unified dashboard (/activity-tracking/unified)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/unified')
		await authenticatedPage.getByRole('heading', { name: 'The Whole Day' }).waitFor({ state: 'visible' })
	})

	test('renders the three source chips (Browser, Desktop, Phone)', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByText('Browser', { exact: true })).toBeVisible()
		await expect(authenticatedPage.getByText('Desktop', { exact: true })).toBeVisible()
		await expect(authenticatedPage.getByText('Phone', { exact: true })).toBeVisible()
	})

	test('deselecting a source writes ?sources= and re-requests the merged panels', async ({ authenticatedPage }) => {
		const requestPromise = authenticatedPage.waitForRequest(/\/unified\/summary-cards/)
		// Scoped to `.v-chip`: an unscoped text match also resolves the sidebar's "Desktop settings" /
		// "Desktop tracking" nav links and clicks a navigation instead of the source chip.
		await authenticatedPage.locator('.v-chip').filter({ hasText: 'Desktop' }).click()
		await requestPromise
		await expect(authenticatedPage).toHaveURL(/[?&]sources=webExtension,android/)
	})
})

test.describe('Desktop dashboard (/activity-tracking/desktop)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/desktop')
		await authenticatedPage.getByRole('heading', { name: 'Desktop Activity' }).waitFor({ state: 'visible' })
	})

	test('shows "Top Processes" (not "Top Domains") and selecting one fires a process-details request', async ({
		authenticatedPage,
	}) => {
		await expect(authenticatedPage.getByRole('heading', { name: 'Top Processes' })).toBeVisible()
		const requestPromise = authenticatedPage.waitForRequest(/\/desktop\/process-details/)
		await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()
		await requestPromise
	})
})

test.describe('Android dashboard (/activity-tracking/android)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/android')
		await authenticatedPage.getByRole('heading', { name: 'Android Activity' }).waitFor({ state: 'visible' })
	})

	test('shows "Top Apps" cards with no Background row', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('heading', { name: 'Top Apps' })).toBeVisible()
		// Scoped to the first Top Apps card specifically — the Activity Timeline's own Active/Background
		// legend (shared markup with the other dashboards) renders the word "Background" unconditionally
		// even though Android sessions never populate that lane.
		const firstCard = authenticatedPage.getByRole('button', { name: /^View details for/ }).first()
		await expect(firstCard.getByText('Background', { exact: true })).toHaveCount(0)
	})

	// findings.md B2 (F47 + backend B23): selecting an app opens that app's own detail — the instant rows
	// from the pie data, then exactly one GET …/app-details for the fetched figures.
	test('selecting a Top Apps card shows that app\'s own detail with a session count', async ({
		authenticatedPage,
	}) => {
		const detailRequests: string[] = []
		authenticatedPage.on('request', request => {
			if (request.url().includes('/activity-tracking/android/app-details')) detailRequests.push(request.url())
		})

		const firstCard = authenticatedPage.getByRole('button', { name: /^View details for/ }).first()
		await firstCard.waitFor({ state: 'visible' })
		const appLabel = (await firstCard.getAttribute('aria-label'))!.replace(/^View details for /, '')
		await firstCard.click()

		await expect(authenticatedPage).toHaveURL(new RegExp(`[?&]selected=${encodeURIComponent(appLabel)}`))
		const closeButton = authenticatedPage.getByRole('button', { name: 'Close details' })
		await expect(closeButton).toBeVisible()
		// Scoped to #app: the panel title is the same text as the card and the pie legend.
		await expect(authenticatedPage.locator('#app').getByText('Share of period:')).toBeVisible()
		await expect(authenticatedPage.getByTestId('app-details-sessions')).toHaveText(/^\d+$/)
		expect(detailRequests).toHaveLength(1)

		await closeButton.click()
		await expect(authenticatedPage).not.toHaveURL(/[?&]selected=/)
		await expect(authenticatedPage.locator('#app').getByText('Share of period:')).toHaveCount(0)
	})
})

test.describe('Findings from the inventory pass — semantic tier, not yet fixed', () => {
	// docs/views/tracking-dashboards/findings.md B1: ActivityDetailsPanel.vue uses icon="mdi-close" in a
	// FontAwesome-only app, so the close button on the web dashboard's domain-detail panel renders no icon.
	test.fixme(
		'B1: the domain-detail close button on /activity-tracking renders a visible icon',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking')
			await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()
			const closeButton = authenticatedPage.getByRole('button', { name: 'Close domain details' })
			await expect(closeButton.locator('svg')).toBeVisible()
		},
	)

	// findings.md A1 (fixed by F49): the date presets are a radiogroup, the source chips are toggle
	// buttons with aria-pressed.
	test('A1: the "Today" date-preset chip is a checked radio and the source chips are pressed buttons', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/activity-tracking/unified')
		const presets = authenticatedPage.getByRole('radiogroup', { name: 'Date range' })
		await expect(presets.getByRole('radio', { name: 'Today' })).toHaveAttribute('aria-checked', 'true')
		await expect(presets.getByRole('radio', { name: 'Last 7 days' })).toHaveAttribute('aria-checked', 'false')
		const desktop = authenticatedPage.getByRole('button', { name: /^Desktop/ })
		await expect(desktop).toHaveAttribute('aria-pressed', 'true')
		await desktop.click()
		await expect(desktop).toHaveAttribute('aria-pressed', 'false')
		await desktop.click()
		await expect(desktop).toHaveAttribute('aria-pressed', 'true')
	})

	// findings.md A2: DesktopProcessDetailsPanel.vue's close VBtn has icon="fas fa-xmark" (renders fine)
	// but no aria-label/title — an unnameable icon-only control.
	test.fixme(
		'A2: the process-detail close button on /activity-tracking/desktop has an accessible name',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking/desktop')
			await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()
			await expect(authenticatedPage.getByRole('button', { name: /close/i })).toBeVisible()
		},
	)
})
