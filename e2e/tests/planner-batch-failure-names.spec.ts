import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP9: a partial day-type batch names the failed dates, grouped by reason, and keeps those days selected
 * so the retry is one pick away.
 *
 * Route-patched on both counts. The seed has no failing batch, and the real call would write day types
 * onto fixture rows (the grid shows the real current week, whose rows other specs read). The
 * `PATCH calendar/day-type/batch` request is therefore answered here and never reaches the server: every
 * requested weekend day fails with `DayTypeNotAllowed`, every other day succeeds. Which ids are weekend
 * days is read off the `calendar/filter` response the grid itself fetched.
 */
type BatchBody = { calendarIds: number[]; dayType: string }
type FilterDay = { id: number; dayIndex: number }

/** Counts the batch calls and answers them. Weekend ids are filled in once the grid has loaded. */
async function patchDayTypeBatch(page: Page) {
	const weekendIds = new Set<number>()
	const requests: BatchBody[] = []

	page.on('response', async response => {
		if (!/\/api\/calendar\/filter$/.test(response.url()) || response.request().method() !== 'POST') return
		const days = (await response.json().catch(() => [])) as FilterDay[]
		for (const day of days) if (day.dayIndex === 6 || day.dayIndex === 7) weekendIds.add(day.id)
	})

	await page.route('**/api/calendar/day-type/batch', async route => {
		const body = route.request().postDataJSON() as BatchBody
		requests.push(body)
		const results = body.calendarIds.map(calendarId => {
			const failed = weekendIds.has(calendarId)
			return { calendarId, succeeded: !failed, failureReason: failed ? 'DayTypeNotAllowed' : null }
		})
		await route.fulfill({
			json: { results, succeededCount: results.filter(r => r.succeeded).length },
		})
	})

	return { weekendIds, requests }
}

async function enterBulkMode(page: Page) {
	await page.goto('/day-planner')
	await expect(page.locator('.day-cell[role="button"]').first()).toBeVisible({ timeout: 15_000 })
	await page.getByRole('button', { name: 'Select Days' }).click()
	await expect(page.getByRole('button', { name: 'Select All' })).toBeVisible()
}

async function pickDayType(page: Page, dayType: string) {
	// The select is a VSelect: click its field, not the combobox role (a `data-no-activator` div sits on top).
	await page.locator('.v-field').filter({ hasText: 'Change day type' }).click()
	await page.getByRole('option', { name: dayType, exact: true }).click()
}

function snackbar(page: Page) {
	return page.getByText(/Day type updated/)
}

test.describe('Named failures on the bulk day-type change (/day-planner)', () => {
	test('a week marked Workday names the weekend days, grouped by reason, and keeps them selected', async ({
		authenticatedPage: page,
	}) => {
		const { weekendIds } = await patchDayTypeBatch(page)
		await enterBulkMode(page)

		const weekendCells = page.locator('.day-cell.weekend[role="button"]')
		const weekendCount = await weekendCells.count()
		expect(weekendCount).toBeGreaterThan(0)

		await page.getByRole('button', { name: 'Select All' }).click()
		await pickDayType(page, 'Workday')

		const message = snackbar(page)
		await expect(message).toBeVisible()
		const dayCount = await page.locator('.day-cell[role="button"]').count()
		await expect(message).toContainText(`Day type updated — ${dayCount - weekendCount}/${dayCount} days succeeded, ${weekendCount} failed.`)
		// One group: the first dates (day-of-week, DD.MM.) in order, "+N more" past five, a colon, then the reason.
		const named = Math.min(weekendCount, 5)
		const more = weekendCount > named ? `\\+${weekendCount - named} more` : ''
		await expect(message).toContainText(
			new RegExp(`(\\p{L}{2} \\d{2}\\.\\d{2}\\.(, )?){${named}}${more}: a weekend day cannot be a workday`, 'u'),
		)
		await expect(message).toContainText('The failed days are still selected.')

		// Only the failed days stay selected: the grid marks them, and the bar counts them.
		expect(weekendIds.size).toBe(weekendCount)
		await expect(page.locator('.day-cell.selected')).toHaveCount(weekendCount)
		await expect(page.locator('.day-cell.selected.weekend')).toHaveCount(weekendCount)
		await expect(page.getByText(`${weekendCount} days selected`)).toBeVisible()
		// Bulk mode stays open.
		await expect(page.getByRole('button', { name: 'Select All' })).toBeVisible()
	})

	test('picking the same type again retries the failed days with another request', async ({
		authenticatedPage: page,
	}) => {
		const { requests } = await patchDayTypeBatch(page)
		await enterBulkMode(page)
		const weekendCount = await page.locator('.day-cell.weekend[role="button"]').count()

		await page.getByRole('button', { name: 'Select All' }).click()
		await pickDayType(page, 'Workday')
		await expect(page.locator('.day-cell.selected')).toHaveCount(weekendCount)
		expect(requests).toHaveLength(1)

		// The bar's select used to keep showing the last pick, so the same value emitted nothing.
		await pickDayType(page, 'Workday')
		await expect.poll(() => requests.length).toBe(2)
		expect(requests[1].dayType).toMatch(/workday/i)
		// The retry carries only the days that failed, and they fail again.
		expect(requests[1].calendarIds).toHaveLength(weekendCount)
		// Toasts queue behind the first, which stays up for 10 s, so the retry's own message arrives late.
		await expect(page.getByText(`Day type updated — 0/${weekendCount} days succeeded`)).toBeVisible({ timeout: 15_000 })
		await expect(page.locator('.day-cell.selected')).toHaveCount(weekendCount)
	})

	test('a clean batch says so and closes bulk mode', async ({ authenticatedPage: page }) => {
		const { requests } = await patchDayTypeBatch(page)
		await enterBulkMode(page)

		await page.locator('.day-cell:not(.weekend)[role="button"]').first().click()
		await expect(page.getByText('1 day selected')).toBeVisible()
		await pickDayType(page, 'Workday')

		await expect(page.getByText('Day type updated for 1 day')).toBeVisible()
		expect(requests).toHaveLength(1)
		await expect(page.getByRole('button', { name: 'Select All' })).toBeHidden()
		await expect(page.locator('.day-cell.selected')).toHaveCount(0)
	})
})
