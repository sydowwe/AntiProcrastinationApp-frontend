import type { Page } from '@playwright/test'
import { apiUrl, expect, seedDateParam, test, type SeedResponse } from '../fixtures/auth'

// C1 — what a day's and a period's skips have in common (`prompts/captured-data/C1-*.md`, the range
// half's contract in `backend/B1-*.md`). Two surfaces: the skip line in a past day's plan-vs-actual
// block, and at most two sentences under the calendar's trend line.
//
// Every row here is created through the app's own API on days the fixture leaves empty (it plans
// nothing before the seed date), and deleted afterwards. The range sentences are computed over the
// WHOLE month, so a row another spec left anywhere in it would move every number asserted below —
// `expectEmptyMonth` checks that first and says so, rather than letting it surface as a wrong count.
//
// Not `freshSeed`, which would be the obvious guard: the reseed truncates `RefreshTokens`, and an
// access token is only honoured while its session's refresh-token row is live — cached for 60 s
// (`SessionRevocationService.LiveVerdictTtl` in the API). So a page signed in before the reseed goes
// 401 within a minute, mid-test, and cannot refresh. Observed here on 2026-09-29.

type Status = 'notStarted' | 'cancelled'

/** `yyyy-MM-dd`, the `date` a create takes. UTC arithmetic from the seed date, never `new Date()`. */
function isoDate(seed: SeedResponse, dayOffset: number): string {
	const d = new Date(`${seed.seedDateUtc}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + dayOffset)
	return d.toISOString().slice(0, 10)
}

/**
 * Two days strictly before the user's today and in one calendar month, so the calendar's range (which
 * only counts days that are over) covers both. Seed −2 and −3, or −2 and −1 when −3 falls into the
 * previous month.
 */
function pastDaysInOneMonth(seed: SeedResponse): [number, number] {
	const month = (offset: number) => isoDate(seed, offset).slice(0, 7)
	return month(-3) === month(-2) ? [-2, -3] : [-2, -1]
}

/**
 * The precondition the range asserts rest on: nothing planned on any day of the month that is over,
 * which is what the fixture leaves there. Asked through the endpoint the sentences are built from.
 */
async function expectEmptyMonth(page: Page, seed: SeedResponse) {
	const [day] = pastDaysInOneMonth(seed)
	const [year, month] = isoDate(seed, day).split('-').map(Number) as [number, number]
	const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
	const prefix = `${year}-${String(month).padStart(2, '0')}`
	const response = await page.request.post(`${apiUrl()}/api/planner-task/skip-summary`, {
		data: { from: `${prefix}-01`, until: `${prefix}-${lastDay}` },
	})
	expect(response.ok(), `skip-summary: ${response.status()} ${await response.text()}`).toBe(true)
	const summary = (await response.json()) as { skippedCount: number; byStartHour: unknown[] }
	expect(
		summary,
		`${prefix} already holds planned tasks before this spec added any — another spec left rows behind`,
	).toMatchObject({ skippedCount: 0, byStartHour: [] })
}

class PlannerRows {
	private readonly ids: number[] = []

	constructor(
		private readonly page: Page,
		private readonly seed: SeedResponse,
	) {}

	async create(dayOffset: number, hour: number, activityId: number): Promise<number> {
		const response = await this.page.request.post(`${apiUrl()}/api/planner-task`, {
			data: {
				date: isoDate(this.seed, dayOffset),
				startTime: { hours: hour, minutes: 0 },
				endTime: { hours: hour, minutes: 45 },
				isBackground: false,
				activityId,
				status: 'notStarted' satisfies Status,
			},
		})
		expect(response.ok(), `create at ${hour}:00: ${response.status()} ${await response.text()}`).toBe(true)
		const id = Number(await response.json())
		this.ids.push(id)
		return id
	}

	/** The status PATCH the day planner and the home widget both use. At most one of the two reasons. */
	async skip(id: number, reason: { text?: string; key?: 'noTime' | 'notRelevant' | 'noEnergy' } = {}) {
		const response = await this.page.request.patch(`${apiUrl()}/api/planner-task/${id}/status`, {
			data: {
				status: 'cancelled' satisfies Status,
				skipReason: reason.text ?? null,
				skipReasonKey: reason.key ?? null,
			},
		})
		expect(response.ok(), `skip ${id}: ${response.status()} ${await response.text()}`).toBe(true)
	}

	async deleteAll() {
		for (const id of this.ids.splice(0)) await this.page.request.delete(`${apiUrl()}/api/planner-task/${id}`)
	}
}

test.describe('Skip line on a past day (/day-planner/:date)', () => {
	let rows: PlannerRows

	test.beforeEach(({ authenticatedPage, seed }) => {
		rows = new PlannerRows(authenticatedPage, seed)
	})

	test.afterEach(async () => {
		await rows.deleteAll()
	})

	test('a day with no skips adds nothing to the block', async ({ authenticatedPage, seed }) => {
		const [day] = pastDaysInOneMonth(seed)
		await rows.create(day, 9, seed.activities.bugFixing)

		await authenticatedPage.goto(`/day-planner/${seedDateParam(seed, day)}`)
		// The control: the block renders (the task never happened), so an absent skip line means
		// something — not merely that the block has not painted yet.
		const block = authenticatedPage.locator('.plan-vs-actual')
		await expect(block).toContainText('1 task never happened', { timeout: 15_000 })
		await expect(block).not.toContainText(/skipped/i)
	})

	test('counts skips and folds the reasons; restoring one updates the line', async ({ authenticatedPage, seed }) => {
		const [day] = pastDaysInOneMonth(seed)
		const byKey = await rows.create(day, 9, seed.activities.bugFixing)
		const bySlovakLabel = await rows.create(day, 10, seed.activities.featureDevelopment)
		const withoutReason = await rows.create(day, 11, seed.activities.learnBouldering)
		await rows.create(day, 13, seed.activities.codeReview)

		// One built-in reason reached three ways: as a key (the home widget), as the SK label (the server
		// stores it as the key), and below as lower-case text typed into the day planner (which the
		// server keeps as text and the client folds). One skip gives no reason at all.
		await rows.skip(byKey, { key: 'noTime' })
		await rows.skip(bySlovakLabel, { text: 'Nestihol som' })
		await rows.skip(withoutReason)

		const page = authenticatedPage
		await page.goto(`/day-planner/${seedDateParam(seed, day)}`)
		const skipLine = page.locator('.plan-vs-actual .skip-line')
		await expect(skipLine).toHaveText(/^3 tasks skipped:\s*Ran out of time \(2\)\s*·\s*1 without a reason$/, {
			timeout: 15_000,
		})

		// The fourth skip goes through the day planner's own dialog — the write path that clears a stale
		// key locally and sends free text.
		await page.locator('.task-block', { hasText: 'Code Review' }).click()
		await page.getByRole('button', { name: 'Change Status' }).click()
		await page.locator('.v-overlay-container .v-list').getByText('Cancelled', { exact: true }).click()
		const dialog = page.getByRole('dialog', { name: 'Skip task' })
		await dialog.getByRole('textbox').fill('ran out of time')
		await dialog.getByRole('button', { name: 'Skip', exact: true }).click()
		await expect(skipLine).toHaveText(/^4 tasks skipped:\s*Ran out of time \(3\)\s*·\s*1 without a reason$/)

		// Restore the one skipped without a reason: its part of the line goes, the rest stays. The view
		// sets the status before its PATCH resolves, so wait for the write before the reload below —
		// otherwise the reload can abort it and the server still says Cancelled.
		await page.locator('.task-block', { hasText: 'Learn Bouldering' }).click()
		await page.getByRole('button', { name: 'Change Status' }).click()
		const restored = page.waitForResponse(
			r => r.request().method() === 'PATCH' && r.url().endsWith(`/api/planner-task/${withoutReason}/status`),
		)
		await page.locator('.v-overlay-container .v-list').getByText('Not started', { exact: true }).click()
		expect((await restored).status()).toBe(204)
		await expect(skipLine).toHaveText(/^3 tasks skipped:\s*Ran out of time \(3\)$/)

		// And the server agrees: the same line after a full re-read.
		await page.reload()
		await expect(skipLine).toHaveText(/^3 tasks skipped:\s*Ran out of time \(3\)$/, { timeout: 15_000 })
	})
})

test.describe('Skip sentences under the calendar (/day-planner?month=)', () => {
	let rows: PlannerRows

	test.beforeEach(async ({ authenticatedPage, seed }) => {
		rows = new PlannerRows(authenticatedPage, seed)
		await expectEmptyMonth(authenticatedPage, seed)
	})

	test.afterEach(async () => {
		await rows.deleteAll()
	})

	const TOP_REASON = /Most common reason for skipping in this period/
	const LATE_SKIPS = /Of the tasks planned from/

	async function openMonth(page: Page, seed: SeedResponse, dayOffset: number) {
		await page.goto(`/day-planner?month=${isoDate(seed, dayOffset).slice(0, 7)}`)
		// The trend line shares the footer and appears for any month with a past task that was not
		// skipped (every test here leaves one), so it is the control that the footer has loaded before
		// anything is asserted absent.
		await expect(page.getByText(/^This period: planned/)).toBeVisible({ timeout: 15_000 })
	}

	test('below the floors, neither sentence is rendered — and a third skip brings the reason in', async ({
		authenticatedPage,
		seed,
	}) => {
		const [day] = pastDaysInOneMonth(seed)
		const first = await rows.create(day, 9, seed.activities.bugFixing)
		const second = await rows.create(day, 10, seed.activities.featureDevelopment)
		const third = await rows.create(day, 11, seed.activities.codeReview)
		await rows.skip(first, { key: 'noEnergy' })
		await rows.skip(second, { key: 'noEnergy' })

		await openMonth(authenticatedPage, seed, day)
		await expect(authenticatedPage.getByText(TOP_REASON)).toHaveCount(0)
		await expect(authenticatedPage.getByText(LATE_SKIPS)).toHaveCount(0)

		await rows.skip(third, { text: 'No energy for it' })
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByText(TOP_REASON)).toHaveText(
			'Most common reason for skipping in this period: No energy for it — 3 of 3 skips',
			{ timeout: 15_000 },
		)
		// Nothing is planned late, so the time-of-day sentence stays absent.
		await expect(authenticatedPage.getByText(LATE_SKIPS)).toHaveCount(0)
	})

	test('above the floors: the top reason and the late-in-the-day pattern', async ({ authenticatedPage, seed }) => {
		const [dayA, dayB] = pastDaysInOneMonth(seed)
		const activity = seed.activities.bugFixing

		// Five tasks before noon, none skipped — the base rate the evening is compared against.
		for (const hour of [8, 9, 10]) await rows.create(dayA, hour, activity)
		for (const hour of [11, 12]) await rows.create(dayB, hour, activity)

		// Six from 20:00 on, four skipped: three for the same reason, one without one.
		const late = [
			await rows.create(dayA, 20, activity),
			await rows.create(dayA, 21, activity),
			await rows.create(dayA, 22, activity),
			await rows.create(dayB, 20, activity),
			await rows.create(dayB, 21, activity),
			await rows.create(dayB, 22, activity),
		]
		await rows.skip(late[0]!, { key: 'noTime' })
		await rows.skip(late[3]!, { text: 'Ran out of time' })
		await rows.skip(late[1]!, { text: 'ran out of time' })
		await rows.skip(late[5]!)

		await openMonth(authenticatedPage, seed, dayA)
		await expect(authenticatedPage.getByText(TOP_REASON)).toHaveText(
			'Most common reason for skipping in this period: Ran out of time — 3 of 4 skips',
			{ timeout: 15_000 },
		)
		await expect(authenticatedPage.getByText(LATE_SKIPS)).toHaveText(
			'Of the tasks planned from 20:00 on, 4 of 6 were skipped; earlier in the day, 0 of 5',
		)
	})
})
