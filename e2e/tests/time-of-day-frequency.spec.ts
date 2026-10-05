import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP21: the time-of-day insight says how *often* its band was used, not only how much time it holds:
 * "Between 09:00 and 11:00 you logged 2h — 50% of the period — on 3 of 7 days."
 *
 * The "3" comes from `days`, one hour mask per day of the range, which the API has sent since OP21. The
 * "7" is `daysInRange`. The first test runs against the real API and the seed, so it pins that the field
 * arrives and the sentence is wired to it. The rest are route-patched, because the seed's band does not
 * cross midnight and every seed day sends `days`.
 */

const TIME_OF_DAY = '**/api/activity-history/dashboard/summary/time-of-day'

type DayMask = { date: string; hourMask: number }

function mask(...hours: number[]): number {
	return hours.reduce((m, hour) => m | (1 << hour), 0)
}

function timeOfDayBody(secondsByHour: Record<number, number>, daysInRange: number, days: DayMask[] | undefined) {
	return {
		hours: Array.from({ length: 24 }, (_, hour) => ({
			hour,
			totalSeconds: secondsByHour[hour] ?? 0,
			entries: secondsByHour[hour] ? 1 : 0,
		})),
		daysInRange,
		daysWithActivity: 5,
		...(days ? { days } : {}),
	}
}

async function patchTimeOfDay(page: Page, body: unknown) {
	await page.route(TIME_OF_DAY, route => route.fulfill({ json: body }))
}

function insight(page: Page) {
	return page.locator('#app p').filter({ hasText: /^Between/ })
}

// 3600 s in each of 09, 10 and 11, then 600 s in each of 14…19: half the period is 09–11 (hours 9 and 10).
const MORNING = { 9: 3600, 10: 3600, 11: 3600, 14: 600, 15: 600, 16: 600, 17: 600, 18: 600, 19: 600 }

// 3600 s in each of 22, 23, 00 and 01, then 2000 s in each of 08…13: half the period needs the four hours
// 22–02, across midnight.
const NIGHT = { 22: 3600, 23: 3600, 0: 3600, 1: 3600, 8: 2000, 9: 2000, 10: 2000, 11: 2000, 12: 2000, 13: 2000 }

test.describe('Time-of-day frequency (/activity-history — Insights)', () => {
	test('the real response carries days, and the sentence counts them out of the range', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const responsePromise = page.waitForResponse(r => r.url().includes('/summary/time-of-day'))
		await page.goto(`/activity-history?range=Week&date=${seed.seedDateUtc.slice(0, 10)}`)
		const body = (await (await responsePromise).json()) as { daysInRange: number; days: DayMask[] }

		// The contract the client counts on: one entry per day, in date order, none of them empty.
		expect(Array.isArray(body.days)).toBe(true)
		expect(body.days.length).toBeGreaterThan(0)
		expect(body.days.length).toBeLessThanOrEqual(body.daysInRange)
		const dates = body.days.map(d => d.date)
		expect(dates).toEqual([...new Set(dates)].sort())
		for (const day of body.days) expect(day.hourMask).toBeGreaterThan(0)

		await expect(insight(page)).toHaveText(new RegExp(`— on \\d+ of ${body.daysInRange} days\\.$`))
		const used = Number((await insight(page).textContent())!.match(/on (\d+) of/)![1])
		expect(used).toBeGreaterThan(0)
		expect(used).toBeLessThanOrEqual(body.days.length)
	})

	test('counts the days that touched the band, not the days with any activity', async ({
		authenticatedPage: page,
	}) => {
		await patchTimeOfDay(
			page,
			timeOfDayBody(MORNING, 7, [
				{ date: '2026-09-29', hourMask: mask(9, 10) },
				{ date: '2026-09-30', hourMask: mask(14) },
				{ date: '2026-10-01', hourMask: mask(10) },
				// 08 and 11 sit on either side of the band without touching it.
				{ date: '2026-10-02', hourMask: mask(8, 11, 15) },
				{ date: '2026-10-03', hourMask: mask(9) },
			]),
		)
		await page.goto('/activity-history')

		await expect(insight(page)).toHaveText(
			'Between 09:00 and 11:00 you logged 2h — 50% of the period — on 3 of 7 days.',
		)
		await expect(insight(page).locator('strong').filter({ hasText: /^3$/ })).toBeVisible()
	})

	test('a band across midnight counts each night once', async ({ authenticatedPage: page }) => {
		await patchTimeOfDay(
			page,
			timeOfDayBody(NIGHT, 7, [
				// 22:30 on the 1st to 00:30 on the 2nd is one night. The 2nd's 23:00 is a night of its own.
				{ date: '2026-10-01', hourMask: mask(22, 23) },
				{ date: '2026-10-02', hourMask: mask(0, 23) },
				// Only an after-midnight hour: the night of the 3rd.
				{ date: '2026-10-04', hourMask: mask(1) },
			]),
		)
		await page.goto('/activity-history')

		await expect(insight(page)).toHaveText(
			'Between 22:00 and 02:00 you logged 4h — 55% of the period — on 3 of 7 days.',
		)
	})

	test('an API without days keeps the share-only sentence', async ({ authenticatedPage: page }) => {
		await patchTimeOfDay(page, timeOfDayBody(MORNING, 7, undefined))
		await page.goto('/activity-history')

		await expect(insight(page)).toHaveText('Between 09:00 and 11:00 you logged 2h — 50% of the period.')
	})
})
