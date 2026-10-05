import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP20: the splits the tracking endpoints already sent.
 *
 * - The desktop details panel puts a split caption under each window title.
 * - The unified dashboard names the trackers behind each card and each bar (`sources`).
 *
 * Route-patched so the fixture stays read-only and each figure is exact. The desktop details and the
 * unified cards are replaced outright. The unified bars keep the real response, because the chart
 * lays its windows out against the picked day and synthetic windows would have to reproduce that,
 * and only their `sources` and two folded items are patched in.
 */

const TITLES = [
	// Every part present: fullscreen and sound are shares of the active part, not additions.
	{
		windowTitle: 'Movie.mkv',
		totalSeconds: 3600,
		activeSeconds: 3000,
		backgroundSeconds: 600,
		fullscreenSeconds: 2700,
		soundSeconds: 3000,
	},
	// A sub-minute part prints in seconds, not as "0m"; zero parts are left out.
	{
		windowTitle: 'Clip.mp4',
		totalSeconds: 1245,
		activeSeconds: 1245,
		backgroundSeconds: 0,
		fullscreenSeconds: 45,
		soundSeconds: 0,
	},
	// All foreground, nothing to split: no caption.
	{
		windowTitle: 'Notes.txt',
		totalSeconds: 900,
		activeSeconds: 900,
		backgroundSeconds: 0,
		fullscreenSeconds: 0,
		soundSeconds: 0,
	},
]

async function patchProcessDetails(page: Page) {
	await page.route('**/api/activity-tracking/desktop/process-details?*', route =>
		route.fulfill({
			json: {
				processName: new URL(route.request().url()).searchParams.get('processName'),
				productName: 'Patched Player',
				totalSeconds: 5745,
				activeSeconds: 5145,
				backgroundSeconds: 600,
				fullscreenSeconds: 2745,
				soundSeconds: 3000,
				monitorBreakdown: [],
				entries: 12,
				windowTitles: TITLES,
			},
		}),
	)
}

function windowTitleRow(page: Page, title: string) {
	return page.locator('.v-list-item').filter({ hasText: title })
}

test.describe('Window-title splits (/activity-tracking/desktop — process details)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await patchProcessDetails(page)
		await page.goto('/activity-tracking/desktop')
		await page.getByRole('heading', { name: 'Desktop Activity' }).waitFor()
		const details = page.waitForResponse('**/api/activity-tracking/desktop/process-details?*')
		await page.getByRole('button', { name: /^View details for/ }).first().click()
		await details
		await page.getByText('Window titles:').waitFor()
	})

	test('a title with background, fullscreen and sound time names every part', async ({ authenticatedPage: page }) => {
		await expect(windowTitleRow(page, 'Movie.mkv').getByTestId('window-title-split')).toHaveText(
			'50m active · 10m in background · 45m fullscreen · 50m with sound',
		)
	})

	test('a sub-minute part prints in seconds and zero parts are left out', async ({ authenticatedPage: page }) => {
		await expect(windowTitleRow(page, 'Clip.mp4').getByTestId('window-title-split')).toHaveText(
			'20m active · 45s fullscreen',
		)
	})

	test('an all-foreground title has no caption', async ({ authenticatedPage: page }) => {
		const row = windowTitleRow(page, 'Notes.txt')
		await expect(row).toContainText('15m')
		await expect(row.getByTestId('window-title-split')).toHaveCount(0)
	})
})

// `sources` arrives out of order on purpose: the client renders it in precedence order.
const CARDS = [
	{ label: 'Chrome', seconds: 1800, sources: ['android'] },
	{ label: 'Google Chrome', seconds: 1500, sources: ['desktop', 'webExtension'] },
	{ label: 'Unattributed', seconds: 1200, sources: [] },
]

async function patchUnifiedCards(page: Page) {
	await page.route('**/api/activity-tracking/unified/summary-cards', route =>
		route.fulfill({
			json: CARDS.map(card => ({
				label: card.label,
				active: { seconds: card.seconds, averageSeconds: card.seconds, percentChange: 0 },
				background: null,
				totalSeconds: card.seconds,
				isNew: false,
				sources: card.sources,
			})),
		}),
	)
}

/**
 * Keeps the real bars, gives every real item a deliberately unordered pair of sources, and adds two
 * items small enough to fold into the window's *Other* bar, each seen by a different tracker.
 */
async function patchUnifiedBars(page: Page) {
	await page.route('**/api/activity-tracking/unified/stacked-bars', async route => {
		const response = await route.fetch()
		const windows = (await response.json()) as { items: Record<string, unknown>[] }[]
		const busy = windows.find(w => w.items.length > 0)
		for (const window of windows) {
			for (const item of window.items) item.sources = ['android', 'webExtension']
		}
		busy?.items.push(
			{ label: 'Tiny phone thing', activeSeconds: 20, backgroundSeconds: 0, sources: ['android'] },
			{ label: 'Tiny desktop thing', activeSeconds: 20, backgroundSeconds: 0, sources: ['desktop'] },
		)
		await route.fulfill({ response, json: windows })
	})
}

test.describe('Recorded-by sources (/activity-tracking/unified)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await patchUnifiedCards(page)
		await patchUnifiedBars(page)
		await page.goto('/activity-tracking/unified')
		await page.getByRole('heading', { name: 'The Whole Day' }).waitFor()
	})

	// The bars handler awaits the real response, and a card test can finish while that is still in
	// flight, which fails the teardown with "route.fetch: Target page … has been closed".
	test.afterEach(async ({ authenticatedPage: page }) => {
		await page.unrouteAll({ behavior: 'ignoreErrors' })
	})

	test('each card shows its trackers as icons, a tooltip and in its accessible name', async ({
		authenticatedPage: page,
	}) => {
		const phoneCard = page.getByRole('button', { name: 'View details for Chrome, recorded by Phone', exact: true })
		await expect(phoneCard).toBeVisible()
		await expect(phoneCard.getByTestId('summary-card-sources').locator('.v-icon')).toHaveCount(1)

		const desktopCard = page.getByRole('button', {
			name: 'View details for Google Chrome, recorded by Browser, Desktop',
			exact: true,
		})
		await expect(desktopCard.getByTestId('summary-card-sources').locator('.v-icon')).toHaveCount(2)

		await desktopCard.getByTestId('summary-card-sources').hover()
		await expect(page.getByRole('tooltip').filter({ hasText: 'Recorded by: Browser, Desktop' })).toBeVisible()
	})

	test('a card with no sources gets no icons and no suffix', async ({ authenticatedPage: page }) => {
		const card = page.getByRole('button', { name: 'View details for Unattributed', exact: true })
		await expect(card).toBeVisible()
		await expect(card.getByTestId('summary-card-sources')).toHaveCount(0)
	})

	test('a bar names its trackers in its tooltip and its accessible name', async ({ authenticatedPage: page }) => {
		await page.getByRole('button', { name: 'Stacked bars' }).click()
		const bar = page
			.getByRole('button', { name: /^View details for (?!Other,).*, recorded by Browser, Phone$/ })
			.first()
		await expect(bar).toBeVisible()

		await bar.hover()
		const tooltip = page.getByTestId('stacked-bars-tooltip-sources')
		await expect(tooltip).toContainText('Recorded by:')
		await expect(tooltip).toContainText('Browser, Phone')
	})

	test('the folded Other bar names every tracker it folded', async ({ authenticatedPage: page }) => {
		await page.getByRole('button', { name: 'Stacked bars' }).click()
		// The union of the two patched items, in precedence order although Phone was pushed first. A real
		// item that folds with them (patched to Browser + Phone) adds Browser in front.
		await expect(
			page.getByRole('button', { name: /^View details for Other, .*, recorded by (Browser, )?Desktop, Phone$/ }).first(),
		).toBeVisible()
	})
})

test.describe('Per-source dashboards stay unchanged (/activity-tracking/desktop)', () => {
	test('no card or bar says "recorded by"', async ({ authenticatedPage: page }) => {
		await page.goto('/activity-tracking/desktop')
		await page.getByRole('heading', { name: 'Desktop Activity' }).waitFor()
		await page.getByRole('button', { name: 'Stacked bars' }).click()

		const controls = page.getByRole('button', { name: /^View details for/ })
		await expect(controls.first()).toBeVisible()
		await expect(page.getByRole('button', { name: /recorded by/ })).toHaveCount(0)
		await expect(page.getByTestId('summary-card-sources')).toHaveCount(0)
	})
})
