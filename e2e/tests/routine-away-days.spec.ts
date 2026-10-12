import type { Page } from '@playwright/test'
import { apiUrl, expect, reseed, seedDateParam, test } from '../fixtures/auth'
import type { SeedResponse } from '../fixtures/auth'

/**
 * FO1 (`docs/feature-opportunities.md`): vacation and sick days stop breaking routines. A closed cycle
 * the user spent at least half away is excused after the fact: it reads as away on the heatmap, offers
 * no freeze, and the run carries across it. Home says so on an away day, and the Day Details dialog
 * says what picking one will do.
 *
 * The cycle excused here is **Weekly's**, not Daily's. Daily's one miss sits twelve cycles back (the
 * API's `docs/e2eTestSeed.md`, *e2e-v4*), and the group card's heatmap strip shows only the last nine
 * or so cycles. Weekly's unfrozen miss is third from the end, so it is on screen, and marking four of
 * its seven days also exercises the "at least half the days" rule rather than a one-day cycle. The
 * history dialog is an ECharts canvas with nothing to assert by role, so the on-screen half of these
 * checks is the card's strip.
 *
 * The routine tests run at 1440×900. At the suite's default 1280×720 the four group cards are too
 * short for their content: the to-do list's progress bar overlaps the heatmap strip, which leaves
 * three cells per card and no way to hover one. That is a layout defect of its own, not FO1's.
 */

type PeriodCompletion = {
	periodStart: string
	periodEnd: string
	completedCount: number
	totalCount: number
	isFrozen: boolean
	isExcused: boolean
}

type ServedPeriod = {
	id: number
	streak: number
	bestStreak: number
	freezesRemaining: number | null
	completionHistory: PeriodCompletion[]
}

/** The period as the routines screen gets it — the grouped read, which also runs the lazy reset. */
async function servedPeriod(page: Page, periodId: number): Promise<ServedPeriod> {
	const response = await page.request.get(`${apiUrl()}/api/routine-todo-list/grouped-by-time-period`)
	expect(response.ok()).toBe(true)
	const groups = (await response.json()) as { routineTimePeriod: ServedPeriod }[]
	const period = groups.find(g => g.routineTimePeriod.id === periodId)?.routineTimePeriod
	expect(period, `period ${periodId} is not in the grouped read`).toBeDefined()
	return period!
}

/** The most recent closed cycle that fell short and is not already covered. */
function latestMiss(period: ServedPeriod): PeriodCompletion {
	const miss = [...period.completionHistory]
		.reverse()
		.find(p => !p.isFrozen && !p.isExcused && p.completedCount < p.totalCount)
	expect(miss, 'the seed no longer leaves an unfrozen miss on Weekly').toBeDefined()
	return miss!
}

async function calendarIdOn(page: Page, isoDate: string): Promise<number> {
	const response = await page.request.get(`${apiUrl()}/api/calendar/day-plan/${isoDate}`)
	expect(response.ok()).toBe(true)
	const { calendar } = (await response.json()) as { calendar: { id: number } | null }
	expect(calendar, `the fixture has no calendar row on ${isoDate}`).not.toBeNull()
	return calendar!.id
}

async function setDayType(page: Page, calendarIds: number[], dayType: 'Vacation' | 'SickDay') {
	const response = await page.request.patch(`${apiUrl()}/api/calendar/day-type/batch`, {
		data: { calendarIds, dayType },
	})
	expect(response.ok(), `day-type batch: ${response.status()} ${await response.text()}`).toBe(true)
	expect(((await response.json()) as { succeededCount: number }).succeededCount).toBe(calendarIds.length)
}

/** Marks the first four of the cycle's seven days sick: more than half, so the cycle is excused. */
async function markCycleSick(page: Page, cycle: PeriodCompletion) {
	const start = new Date(`${cycle.periodStart.slice(0, 10)}T00:00:00Z`)
	const ids: number[] = []
	for (let offset = 0; offset < 4; offset++) {
		const day = new Date(start)
		day.setUTCDate(day.getUTCDate() + offset)
		ids.push(await calendarIdOn(page, day.toISOString().slice(0, 10)))
	}
	await setDayType(page, ids, 'SickDay')
}

async function openRoutines(page: Page) {
	await page.goto('/routine-todo-list')
	const card = weeklyCard(page)
	await card.waitFor()
	return card
}

function weeklyCard(page: Page) {
	return page.locator('.v-card').filter({ has: page.locator('.v-card-title', { hasText: /^Weekly$/ }) })
}

function heatmapCells(page: Page) {
	return weeklyCard(page).locator('.heatmap-grid .heatmap-cell')
}

/**
 * The number beside the flame in the card's stats; there is no accessible name on it. Each item shows
 * its own flame further down, so this is the first one: the stats sit above the list.
 */
function streakFigure(page: Page) {
	return weeklyCard(page).locator('.v-icon:has([data-icon="fire-flame-curved"]) + span').first()
}

test.describe('Away days excuse a routine cycle (/routine-todo-list, / and /day-planner/:date)', () => {
	// Steps 1–3 write calendar day types and re-walk a period's streak, all on fixture rows.
	test.describe.configure({ mode: 'serial' })
	test.use({ freshSeed: true, viewport: { width: 1440, height: 900 } })
	test.afterAll(async () => {
		await reseed()
	})

	test('marking a missed week sick afterwards shows it as away and offers no freeze', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const periodId = seed.routineTimePeriods.Weekly
		const before = await servedPeriod(page, periodId)
		const miss = latestMiss(before)

		// Before: the miss is a miss on screen. Its tooltip label is what identifies the same cell after.
		await openRoutines(page)
		// Older misses can be on screen too; the latest one is the last miss in the strip.
		const missCells = heatmapCells(page).and(page.locator('.cell-level-0'))
		const missesBefore = await missCells.count()
		expect(missesBefore, 'the miss must be inside the strip at this viewport').toBeGreaterThan(0)
		await missCells.last().hover()
		const missTooltip = page.getByRole('tooltip', { name: /· 0 of 1 done$/ })
		await expect(missTooltip).toBeVisible()
		const label = (await missTooltip.textContent())!.split(' · ')[0]

		await markCycleSick(page, miss)

		const after = await servedPeriod(page, periodId)
		expect(after.completionHistory.find(p => p.periodStart === miss.periodStart)).toMatchObject({
			isExcused: true,
			isFrozen: false,
		})
		// Excused, not frozen: carrying the run cost nothing from the budget.
		expect(after.freezesRemaining).toBe(before.freezesRemaining)

		await openRoutines(page)
		const awayCell = heatmapCells(page).and(page.locator('.cell-away'))
		await expect(awayCell).toHaveCount(1)
		await expect(missCells).toHaveCount(missesBefore - 1)
		await expect(awayCell.locator('[data-icon="umbrella-beach"]')).toBeVisible()
		// Neutral and dashed, never the miss's solid grey.
		await expect(awayCell).toHaveCSS('border-top-style', 'dashed')
		await awayCell.hover()
		await expect(page.getByRole('tooltip', { name: `${label} · away, doesn't count against you` })).toBeVisible()

		// No freeze on the card, and the server refuses one on the excused cycle.
		await expect(weeklyCard(page).getByRole('button', { name: 'Cover the miss' })).toHaveCount(0)
		const freeze = await page.request.post(`${apiUrl()}/api/routine-todo-list/time-period/${periodId}/streak-freeze`, {
			data: { periodStart: miss.periodStart },
		})
		expect(freeze.status()).toBe(400)
		expect(await freeze.text()).toContain('nothing to cover')
	})

	test('the run the missed week broke comes back', async ({ authenticatedPage: page, seed }) => {
		const periodId = seed.routineTimePeriods.Weekly
		const before = await servedPeriod(page, periodId)

		await openRoutines(page)
		await expect(streakFigure(page)).toHaveText(String(before.streak))

		await markCycleSick(page, latestMiss(before))

		const after = await servedPeriod(page, periodId)
		expect(after.streak).toBeGreaterThan(before.streak)

		await openRoutines(page)
		await expect(streakFigure(page)).toHaveText(String(after.streak))
	})

	test('home says the user is away today', async ({ authenticatedPage: page }) => {
		// "Today" is the day home asks for — the account's local date, which the seed's UTC date can miss
		// near midnight. Reading it off the widget's own request keeps the two from disagreeing.
		const dayPlan = page.waitForResponse('**/api/calendar/day-plan/**')
		await page.goto('/')
		const { calendar } = (await (await dayPlan).json()) as { calendar: { id: number; dayType: string } | null }
		expect(calendar, 'the fixture has no calendar row for today').not.toBeNull()
		expect(calendar!.dayType).not.toBe('Vacation')

		const awayLine = page.locator('.planner-card').getByText("You're away today.")
		await expect(page.locator('.planner-card')).toBeVisible()
		await expect(awayLine).toHaveCount(0)

		await setDayType(page, [calendar!.id], 'Vacation')

		const reloaded = page.waitForResponse('**/api/calendar/day-plan/**')
		await page.reload()
		await reloaded
		const bar = page.locator('.planner-card').getByRole('region', { name: 'About today' })
		await expect(bar.getByText('Vacation')).toBeVisible()
		await expect(bar.getByText(/^You're away today\. Routines stay quiet/)).toBeVisible()
	})
})

test.describe('Away-day hint in Day Details (/day-planner/:date)', () => {
	async function openDayDetails(page: Page, seed: SeedResponse) {
		const date = seedDateParam(seed, 1)
		// The Edit button is live before the view has stored the day's calendar row, and opening the
		// dialog then throws on `props.calendar!.dayIndex` (CalendarDetailsDialog.vue
		// `getNaturalDayType`) and leaves it dead for the life of the page. On a cold load the view
		// mounts twice, each instance fetching the day and its tasks, so no single request marks the
		// visible one as ready; waiting for the network to settle does. The race is not what is under
		// test here.
		await page.goto(`/day-planner/${date}`)
		await page.waitForLoadState('networkidle')
		await page.getByRole('button', { name: 'Edit', exact: true }).click()
		const dialog = page.getByRole('dialog', { name: 'Day Details' })
		await expect(dialog).toBeVisible()
		return dialog
	}

	test('picking Vacation or Sick day explains what it does to routines; other types say nothing', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const dialog = await openDayDetails(page, seed)
		const hint = dialog.getByText(
			"Routines stay quiet today, and a routine period you spend mostly away won't count against you.",
		)
		await expect(hint).toHaveCount(0)

		const dayType = dialog.locator('.v-select').filter({ hasText: 'Day Type' }).locator('.v-field__input')
		for (const [option, shown] of [
			['Vacation', true],
			['Special', false],
			['Sick day', true],
		] as const) {
			await dayType.click()
			await page.getByRole('option', { name: option }).click()
			await expect(hint).toHaveCount(shown ? 1 : 0)
		}

		// Nothing saved: the dialog is closed without confirming.
		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).toBeHidden()
	})
})
