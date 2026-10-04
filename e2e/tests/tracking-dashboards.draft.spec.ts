import { expect, seedDateParam, test } from '../fixtures/auth'

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
		// The dates are input values, not text — `getByText` never matches them. The fixture accounts are
		// `locale: 'EN'`, so the picker renders MM/DD/YYYY.
		const dateFrom = authenticatedPage.getByRole('textbox', { name: 'Date from' })
		const dateTo = authenticatedPage.getByRole('textbox', { name: 'Date to' })
		await expect(dateFrom).toHaveValue('09/08/2026')
		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/date=2026-09-08.*dateTo=2026-09-14/)
		await expect(dateFrom).toHaveValue('09/08/2026')
		await expect(dateTo).toHaveValue('09/14/2026')
	})

	test('an unreachable date renders the empty state, not an error', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking?date=2020-01-01')
		// The timeline says "...this period", the top-domains/pie-chart panels say "...this day" —
		// deliberately not asserting they match (see findings.md — wording is inconsistent), just that
		// the empty state renders rather than an error.
		await expect(authenticatedPage.getByText(/No activity recorded for this (period|day)/).first()).toBeVisible()
	})
})

// OP16. The fixture tracks one URL per domain, so ranking, "show more" and the active/background caption
// need more pages than it has. `domain-details` is served by a route mock and the pie stays real.
test.describe('Web dashboard, which pages took the time (/activity-tracking — OP16)', () => {
	// Seven pages, longest first as the server ranks them, plus 15 minutes the pages do not cover.
	const PAGES = Array.from({ length: 7 }, (_, i) => ({
		url: `https://example.org/page-${i}`,
		path: `/page-${i}`,
		totalSeconds: (7 - i) * 600,
		activeSeconds: i === 0 ? 3900 : (7 - i) * 600,
		backgroundSeconds: i === 0 ? 300 : 0,
	}))
	const PAGES_SECONDS = PAGES.reduce((sum, p) => sum + p.totalSeconds, 0)

	test.beforeEach(async ({ authenticatedPage, seed }) => {
		await authenticatedPage.route('**/api/activity-tracking/web-extension/domain-details?*', route => {
			const domain = new URL(route.request().url()).searchParams.get('domain')
			return route.fulfill({
				json: {
					domain,
					totalSeconds: PAGES_SECONDS + 900,
					activeSeconds: PAGES_SECONDS,
					backgroundSeconds: 900,
					entries: 40,
					pages: PAGES,
				},
			})
		})
		await authenticatedPage.goto(`/activity-tracking?date=${seedDateParam(seed)}`)
		await authenticatedPage.getByRole('heading', { name: 'Activity Dashboard' }).waitFor({ state: 'visible' })
	})

	test('the day total counts entries, not the visits the server never sends', async ({ authenticatedPage }) => {
		const panel = authenticatedPage.locator('#app')
		await expect(panel.getByText('Entries:')).toBeVisible()
		await expect(panel.getByText('Visits:')).toHaveCount(0)
	})

	test('selecting a domain asks for that domain inside the dashboard\'s window', async ({ authenticatedPage }) => {
		const requestPromise = authenticatedPage.waitForRequest(/\/web-extension\/domain-details/)
		await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()

		const params = new URL((await requestPromise).url()).searchParams
		expect(params.get('domain')).toBe(new URL(authenticatedPage.url()).searchParams.get('selected'))
		expect(params.get('from')).toBeTruthy()
		expect(params.get('to')).toBeTruthy()
		expect(params.get('windowStartMinutes')).toMatch(/^\d+$/)
		expect(params.get('windowEndMinutes')).toMatch(/^\d+$/)
	})

	test('the pages are listed longest first with their time, five at a time', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()

		const pages = authenticatedPage.getByTestId('domain-details-pages').getByRole('link')
		await expect(pages).toHaveCount(5)
		await expect(pages.first()).toHaveAttribute('href', 'https://example.org/page-0')
		await expect(pages.first()).toContainText('/page-0')
		await expect(pages.first()).toContainText('in background')
		await expect(pages.nth(4)).toContainText('/page-4')

		await authenticatedPage.getByRole('button', { name: '+ 2 more' }).click()
		await expect(pages).toHaveCount(7)
		await expect(pages.last()).toContainText('/page-6')
	})

	test('time tracked without a URL is shown as the remainder', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()
		await authenticatedPage.getByTestId('domain-details-pages').waitFor({ state: 'visible' })

		const remainder = authenticatedPage.locator('#app').getByText('Without a page address:')
		await expect(remainder).toBeVisible()
		await expect(remainder.locator('..')).toContainText('15m')
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

// OP11. The fixture has no two processes sharing a product name, and desktop rows can only be posted
// with an extension-role token, so the collision is served by route mocks. The mocks carry the
// server's real shape — `key`/`label` beside `processName`/`productName` (`IDashboardItem`).
test.describe('Desktop dashboard, two processes under one product name (/activity-tracking/desktop)', () => {
	const PRODUCT = 'Microsoft Teams'
	const PROCESSES = [
		{ processName: 'Teams.exe', seconds: 1800 },
		{ processName: 'ms-teams.exe', seconds: 1200 },
	]

	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.route('**/api/activity-tracking/desktop/summary-cards', route =>
			route.fulfill({
				json: PROCESSES.map(p => ({
					processName: p.processName,
					productName: PRODUCT,
					key: p.processName,
					label: PRODUCT,
					active: { seconds: p.seconds, averageSeconds: p.seconds, percentChange: 0 },
					background: null,
					isNew: false,
				})),
			}),
		)
		await authenticatedPage.route('**/api/activity-tracking/desktop/pie-chart', route =>
			route.fulfill({
				json: {
					processes: PROCESSES.map(p => ({
						processName: p.processName,
						productName: PRODUCT,
						key: p.processName,
						label: PRODUCT,
						activeSeconds: p.seconds,
						backgroundSeconds: 0,
						totalSeconds: p.seconds,
						entries: 10,
					})),
					totals: {
						totalSeconds: 3000,
						activeSeconds: 3000,
						backgroundSeconds: 0,
						totalProcesses: 2,
						totalWindowTitles: 0,
						totalEntries: 20,
					},
				},
			}),
		)
		// Echoes the process it was asked for, so the panel shows which one the click resolved to.
		await authenticatedPage.route('**/api/activity-tracking/desktop/process-details?*', route => {
			const processName = new URL(route.request().url()).searchParams.get('processName')
			return route.fulfill({
				json: {
					processName,
					productName: PRODUCT,
					totalSeconds: 1200,
					activeSeconds: 1200,
					backgroundSeconds: 0,
					fullscreenSeconds: 0,
					soundSeconds: 0,
					monitorBreakdown: [],
					entries: 10,
					windowTitles: [],
				},
			})
		})
		await authenticatedPage.goto('/activity-tracking/desktop')
		await authenticatedPage.getByRole('heading', { name: 'Desktop Activity' }).waitFor({ state: 'visible' })
	})

	test('each process gets its own card, named by its process', async ({ authenticatedPage }) => {
		for (const { processName } of PROCESSES) {
			await expect(
				authenticatedPage.getByRole('button', { name: `View details for ${PRODUCT} (${processName})` }),
			).toBeVisible()
		}
	})

	test('selecting the second one selects and opens that process, not the first', async ({ authenticatedPage }) => {
		const requestPromise = authenticatedPage.waitForRequest(/\/desktop\/process-details/)
		await authenticatedPage.getByRole('button', { name: `View details for ${PRODUCT} (ms-teams.exe)` }).click()

		const request = await requestPromise
		expect(new URL(request.url()).searchParams.get('processName')).toBe('ms-teams.exe')
		await expect(authenticatedPage).toHaveURL(/[?&]selected=ms-teams\.exe(&|$)/)
		await expect(authenticatedPage.getByTestId('process-details-process-name')).toHaveText('ms-teams.exe')
	})
})

test.describe('Android dashboard (/activity-tracking/android)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/android')
		await authenticatedPage.getByRole('heading', { name: 'Android Activity' }).waitFor({ state: 'visible' })
	})

	test('shows "Top Apps" cards with no Background row', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('heading', { name: 'Top Apps' })).toBeVisible()
		const firstCard = authenticatedPage.getByRole('button', { name: /^View details for/ }).first()
		await firstCard.waitFor({ state: 'visible' })
		// F48: no Background anywhere — not on the cards, not in the timeline legend (Android reports
		// one lane), and no Total/Active/Background radio on the pie (the DTO has no split).
		await expect(authenticatedPage.locator('#app').getByText('Background', { exact: true })).toHaveCount(0)
		await expect(authenticatedPage.getByRole('radio', { name: 'Active' })).toHaveCount(0)
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

		const closeButton = authenticatedPage.getByRole('button', { name: 'Close details' })
		await expect(closeButton).toBeVisible()
		// Scoped to #app: the panel title is the same text as the card and the pie legend.
		await expect(authenticatedPage.locator('#app').getByText('Share of period:')).toBeVisible()
		await expect(authenticatedPage.getByTestId('app-details-sessions')).toHaveText(/^\d+$/)
		expect(detailRequests).toHaveLength(1)

		// OP11: the selection is the package name the details were fetched by, not the printed label —
		// two apps can share a label, never a package.
		const packageName = new URL(detailRequests[0]!).searchParams.get('packageName')
		expect(packageName).toBeTruthy()
		expect(packageName).not.toBe(appLabel)
		expect(new URL(authenticatedPage.url()).searchParams.get('selected')).toBe(packageName)

		await closeButton.click()
		await expect(authenticatedPage).not.toHaveURL(/[?&]selected=/)
		await expect(authenticatedPage.locator('#app').getByText('Share of period:')).toHaveCount(0)
	})
})

test.describe('Findings from the inventory pass — semantic tier, not yet fixed', () => {
	// docs/views/tracking-dashboards/findings.md B1 (fixed by F46): the web panel's close button used
	// icon="mdi-close" in a FontAwesome-only app and rendered no glyph.
	test(
		'B1: the domain-detail close button on /activity-tracking renders a visible icon',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking')
			await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()
			const closeButton = authenticatedPage.getByRole('button', { name: 'Close details' })
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

	// findings.md A2 (fixed by F46): DesktopProcessDetailsPanel.vue's close VBtn had no aria-label/title.
	test(
		'A2: the process-detail close button on /activity-tracking/desktop has an accessible name',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking/desktop')
			await authenticatedPage.getByRole('button', { name: /^View details for/ }).first().click()
			await expect(authenticatedPage.getByRole('button', { name: 'Close details' })).toBeVisible()
		},
	)
})
