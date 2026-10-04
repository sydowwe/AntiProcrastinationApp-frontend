import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP14: a summary card's "+40%" says what it is 40% of — "usually 25m" under the percentage.
 *
 * Route-patched rather than seeded: the seed has no history before its own week, so every history card
 * reads NEW against any baseline, and the tracking baseline is whatever the clock-relative rows add up to.
 * Patching the one response pins exact figures.
 *
 * Both endpoints send `averageSeconds` already scaled to the selected span (the history one since OP14,
 * when it stopped sending the bare daily mean), so the client prints it as is.
 */
type Stat = { seconds: number; averageSeconds: number | null; percentChange: number | null }

function desktopItem(key: string, label: string, isNew: boolean, active: Stat, background: Stat | null = null) {
	return { key, label, processName: key, productName: label, isNew, active, background }
}

async function patchDesktopCards(page: Page, items: unknown[]) {
	await page.route('**/api/activity-tracking/desktop/summary-cards', route => route.fulfill({ json: items }))
}

function historyCard(groupId: number, name: string, totalSeconds: number, averageSeconds: number, percentChange: number | null, isNew = false) {
	return { groupId, name, color: null, totalSeconds, averageSeconds, percentChange, isNew }
}

async function patchHistoryCards(page: Page, cards: unknown[]) {
	await page.route('**/api/activity-history/dashboard/summary/summary-cards', async route => {
		const response = await route.fetch()
		const body = (await response.json()) as Record<string, unknown>
		await route.fulfill({ response, json: { ...body, cards } })
	})
}

test.describe('Summary card baseline (/activity-tracking/desktop — summary cards)', () => {
	test('each stat column names the base its percentage is taken against', async ({ authenticatedPage: page }) => {
		await patchDesktopCards(page, [
			desktopItem(
				'rider64.exe',
				'Rider Baseline',
				false,
				{ seconds: 2100, averageSeconds: 1500, percentChange: 40 },
				{ seconds: 600, averageSeconds: 45, percentChange: 1233.3 },
			),
			desktopItem('fresh.exe', 'Fresh App', true, { seconds: 900, averageSeconds: null, percentChange: null }),
		])
		await page.goto('/activity-tracking/desktop')

		const rider = page.getByRole('button', { name: 'View details for Rider Baseline' })
		await expect(rider.getByText('▲ 40%')).toBeVisible()
		await expect(rider.getByText('usually 25m', { exact: true })).toBeVisible()
		// A sub-minute base prints in seconds; `fromSeconds` alone would floor it to "0m".
		await expect(rider.getByText('usually 45s', { exact: true })).toBeVisible()

		const fresh = page.getByRole('button', { name: 'View details for Fresh App' })
		await expect(fresh.getByText('NEW', { exact: true })).toBeVisible()
		await expect(fresh.getByText(/usually/)).toHaveCount(0)
	})
})

test.describe('Summary card baseline (/activity-history — Top Activities cards)', () => {
	test('a compared card shows its base; a new or base-less one does not', async ({ authenticatedPage: page }) => {
		await patchHistoryCards(page, [
			historyCard(901, 'Baseline Reading', 4 * 3600, 2 * 3600 + 30 * 60, 60),
			historyCard(902, 'Brand New Hobby', 3600, 0, null, true),
			historyCard(903, 'Zero Base Chore', 1800, 0, null),
		])
		await page.goto('/activity-history')

		const reading = page.getByRole('button', { name: 'Highlight Baseline Reading in the chart' })
		await expect(reading.getByText('▲ 60%')).toBeVisible()
		await expect(reading.getByText('usually 2h 30m', { exact: true })).toBeVisible()

		const fresh = page.getByRole('button', { name: 'Highlight Brand New Hobby in the chart' })
		await expect(fresh.getByText('NEW', { exact: true })).toBeVisible()
		await expect(fresh.getByText(/usually/)).toHaveCount(0)

		const zero = page.getByRole('button', { name: 'Highlight Zero Base Chore in the chart' })
		await expect(zero.getByText('-', { exact: true })).toBeVisible()
		await expect(zero.getByText(/usually/)).toHaveCount(0)
	})
})
