import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP8: the focus strip says *when* the longest unbroken block happened, not only how long it was.
 *
 * Route-patched rather than seeded: the block is derived from whatever tracking rows fall in the
 * picked range, and patching the one response lets each test pin exact instants.
 *
 * The times are server instants, read in the account's zone (`timeInUserZone`). This app syncs the
 * account's zone to the browser's on every hydration (`syncBrowserTimeZone` in `main.ts`), so the two
 * are the same zone and the expected strings are computed in the page. Do NOT pin the zone with a
 * CDP `Emulation.setTimezoneOverride`: the sync then writes that zone onto the seed account.
 */
type BlockPatch = { label: string; startedAt?: string | null; endedAt?: string | null; seconds: number }

async function patchFocusMetrics(page: Page, longestBlock: BlockPatch, daysWithActivity: number) {
	await page.route('**/api/activity-tracking/desktop/focus-metrics', async route => {
		const response = await route.fetch()
		const body = (await response.json()) as Record<string, unknown>
		await route.fulfill({ response, json: { ...body, sessionCount: 4, daysWithActivity, longestBlock } })
	})
}

async function openDesktopDashboard(page: Page) {
	const metrics = page.waitForResponse('**/api/activity-tracking/desktop/focus-metrics')
	await page.goto('/activity-tracking/desktop')
	await metrics
}

/** The strip's rendering of an instant, computed independently in the page's zone. */
async function shown(page: Page, iso: string, withDay = false): Promise<{ day: string; time: string }> {
	return page.evaluate(
		([value, day]) => {
			const instant = new Date(value)
			return {
				day: day
					? new Intl.DateTimeFormat('EN', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(instant)
					: '',
				time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
					instant,
				),
			}
		},
		[iso, withDay] as const,
	)
}

function longestBlockStat(page: Page) {
	return page.locator('.focus-stat').filter({ hasText: 'Longest unbroken block' })
}

const START = '2026-09-28T09:10:00Z'
const END = '2026-09-28T10:50:00Z'

test.describe('Longest focus block times (/activity-tracking/desktop — "Shape of the day")', () => {
	test('one active day: the clock times, under the label', async ({ authenticatedPage: page }) => {
		await patchFocusMetrics(page, { label: 'Deep Work App', startedAt: START, endedAt: END, seconds: 6000 }, 1)
		await openDesktopDashboard(page)

		const [start, end] = [await shown(page, START), await shown(page, END)]
		const stat = longestBlockStat(page)
		await expect(stat.getByText('1h 40m')).toBeVisible()
		await expect(stat.getByText('Deep Work App')).toBeVisible()
		await expect(stat.getByText(`${start.time}–${end.time}`, { exact: true })).toBeVisible()
	})

	test('several active days: the weekday and date go in front', async ({ authenticatedPage: page }) => {
		await patchFocusMetrics(page, { label: 'Deep Work App', startedAt: START, endedAt: END, seconds: 6000 }, 5)
		await openDesktopDashboard(page)

		const [start, end] = [await shown(page, START, true), await shown(page, END)]
		await expect(longestBlockStat(page).getByText(`${start.day}, ${start.time}–${end.time}`, { exact: true })).toBeVisible()
	})

	// Omitted (an older API) and `null` are separate paths: `new Date(null)` is the epoch, a valid date
	// that once rendered as "09:00–09:00" in a UTC+9 browser.
	for (const [name, times] of [
		['omitted', {}],
		['null', { startedAt: null, endedAt: null }],
	] as const) {
		test(`a block whose times are ${name} keeps its label and shows no time line`, async ({
			authenticatedPage: page,
		}) => {
			await patchFocusMetrics(page, { label: 'Deep Work App', seconds: 6000, ...times }, 1)
			await openDesktopDashboard(page)

			const stat = longestBlockStat(page)
			await expect(stat.getByText('Deep Work App')).toBeVisible()
			await expect(stat.getByText(/\d{2}:\d{2}/)).toHaveCount(0)
		})
	}
})
