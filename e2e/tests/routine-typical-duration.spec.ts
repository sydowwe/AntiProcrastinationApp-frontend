import type { Page } from '@playwright/test'
import { apiUrl, expect, test, type SeedResponse } from '../fixtures/auth'

/**
 * F2-06 (FO8): a routine row says how long the item usually takes, from the time logged against the item itself
 * (`RoutineTodoListItemEntity.typicalSeconds`). One sample is one cycle of the item's period with every sitting in
 * it summed, and below three timed cycles the row says nothing.
 *
 * Mutating, so nothing here touches a fixture row (CLAUDE.md, *Mutating specs* 1). Each test makes three fresh
 * activities and puts one routine item for each in the fixture's `Daily` period, whose 16 closed cycles are the
 * days before the seed day. Time is logged against each item on those days through the app's own API, then
 * everything is deleted again: history first, then the items, then the activities.
 *
 * Logging is not inert (FO2): each log publishes `ActivityTimeRecordedEvent` for its day. Fresh activities have
 * no planner blocks for it to complete, and the one item with an estimate never gets a day total that reaches
 * it, so no item is ticked off behind the test's back.
 */

const PLAIN = 'E2E typical plain'
const ESTIMATED = 'E2E typical estimated'
const THIN = 'E2E typical thin'

interface Created {
	activityIds: number[]
	itemIds: number[]
	historyIds: number[]
}

async function post(page: Page, path: string, data: unknown): Promise<number> {
	const response = await page.request.post(`${apiUrl()}/api/${path}`, { data })
	expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

/** 09:00 UTC, `daysBack` days before the seed day: inside one closed `Daily` cycle. */
function closedDay(seed: SeedResponse, daysBack: number, hour = 9): string {
	const d = new Date(`${seed.seedDateUtc}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() - daysBack)
	d.setUTCHours(hour)
	return d.toISOString()
}

/**
 * Minutes logged per closed day, newest first. 10 + 8 on one day is one 18-minute occurrence, so the median of
 * 18, 20 and 15 is 18. A per-sitting median would be 12.5.
 */
const THREE_DAYS: [daysBack: number, hour: number, minutes: number][] = [
	[1, 9, 10],
	[1, 15, 8],
	[2, 9, 20],
	[3, 9, 15],
]

/**
 * A median of 22, every day under the 30-minute estimate. Different from {@link THREE_DAYS} on purpose: two rows
 * with the same figure carry the same tooltip text, and a hidden tooltip stays in the DOM.
 */
const UNDER_ESTIMATE: typeof THREE_DAYS = [
	[1, 9, 20],
	[2, 9, 22],
	[3, 9, 25],
]

async function createFixtures(page: Page, seed: SeedResponse): Promise<Created> {
	const created: Created = { activityIds: [], itemIds: [], historyIds: [] }
	const role = await page.request.get(`${apiUrl()}/api/activity/${seed.activities.bugFixing}`)
	expect(role.ok()).toBe(true)
	const roleId = (await role.json()).role.id
	const dailyId = seed.routineTimePeriods['Daily']

	const plan: [name: string, estimateMinutes: number | null, logs: typeof THREE_DAYS][] = [
		[PLAIN, null, THREE_DAYS],
		// Above every day's total, or the completion fallback would tick the item.
		[ESTIMATED, 30, UNDER_ESTIMATE],
		[THIN, null, THREE_DAYS.slice(0, 3)],
	]

	for (const [name, estimate, logs] of plan) {
		const activityId = await post(page, 'activity', { name, text: '', isUnavoidable: false, roleId })
		created.activityIds.push(activityId)
		const itemId = await post(page, 'routine-todo-list', {
			activityId,
			timePeriodId: dailyId,
			isDone: false,
			suggestedTime: estimate === null ? null : { hours: 0, minutes: estimate },
			suggestedDays: [],
			suggestedDayOfMonth: null,
			steps: [],
		})
		created.itemIds.push(itemId)
		for (const [daysBack, hour, minutes] of logs) {
			created.historyIds.push(
				await post(page, 'activity-history', {
					activityId,
					startTimestamp: closedDay(seed, daysBack, hour),
					length: { hours: 0, minutes },
					todoListItemId: null,
					routineTodoListId: itemId,
				}),
			)
		}
	}
	return created
}

async function removeFixtures(page: Page, created: Created) {
	const paths = [
		...created.historyIds.map(id => `activity-history/${id}`),
		...created.itemIds.map(id => `routine-todo-list/${id}`),
		...created.activityIds.map(id => `activity/${id}`),
	]
	// Asserted, not fire-and-forget: a row left behind would sit in the fixture's Daily period for every later spec.
	for (const path of paths) {
		const response = await page.request.delete(`${apiUrl()}/api/${path}`)
		expect(response.ok(), `cleanup DELETE ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	}
}

/** The row for `name`. Two nested `.v-list-item`s match each row (the outer is the drag wrapper), hence `.first()`. */
function row(page: Page, name: string) {
	return page
		.locator('.v-list-item')
		.filter({ has: page.getByRole('checkbox', { name: `Mark done: ${name}`, exact: true }) })
		.first()
}

test.describe('Typical item length (/routine-todo-list — items built for the test)', () => {
	let created: Created = { activityIds: [], itemIds: [], historyIds: [] }

	test.beforeEach(async ({ authenticatedPage, seed }, testInfo) => {
		testInfo.setTimeout(60_000)
		created = await createFixtures(authenticatedPage, seed)
	})

	test.afterEach(async ({ authenticatedPage }) => {
		await removeFixtures(authenticatedPage, created)
		created = { activityIds: [], itemIds: [], historyIds: [] }
	})

	test('an item with no estimate gets its own "usually" chip, and says what it rests on', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/routine-todo-list')
		const chip = row(authenticatedPage, PLAIN).locator('.v-chip').filter({ hasText: 'usually' })
		await expect(chip).toHaveText('usually ~18m')

		// The tooltip is teleported outside `#app` and only exists after a hover.
		await chip.hover()
		await expect(
			authenticatedPage.getByText('Usually takes about 18m, going by the last 3 times it was timed'),
		).toBeVisible()
	})

	test('an item with an estimate shows the typical length beside it on the estimate chip', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/routine-todo-list')
		const estimated = row(authenticatedPage, ESTIMATED)
		// Not anchored at the start: the chip's template puts a space before the `~`.
		const estimateChip = estimated.locator('.v-chip').filter({ hasText: '~' })
		await expect(estimateChip).toHaveText(/~30m\s*\/\s*22m$/)
		await estimateChip.hover()
		await expect(
			authenticatedPage.getByText('Usually takes about 22m, going by the last 3 times it was timed'),
		).toBeVisible()
		await expect(estimated.locator('.v-chip').filter({ hasText: 'usually' })).toHaveCount(0)
	})

	test('below three timed days an item says nothing', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/routine-todo-list')
		// Wait on a row that does carry the figure, so the absence below is not just an unfinished load.
		await expect(row(authenticatedPage, PLAIN).locator('.v-chip').filter({ hasText: 'usually' })).toBeVisible()
		await expect(row(authenticatedPage, THIN).locator('.v-chip').filter({ hasText: 'usually' })).toHaveCount(0)
	})
})
