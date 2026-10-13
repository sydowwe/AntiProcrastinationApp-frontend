import type { Page } from '@playwright/test'
import { apiUrl, expect, seedDateParam, test } from '../fixtures/auth'
import type { SeedResponse } from '../fixtures/auth'

/**
 * FO2 (`docs/feature-opportunities.md`): time logged from a to-do item ticks it off on the server, once. One
 * sitting is one repetition of a counted item and finishes a plain one, however short; time alone never finishes
 * a counted item. The client sends `countsAsRepetition` with the log (frontend `0317e802`) and the API ticks the
 * item before it answers (backend `882cdf5`); before that, one 25-minute sitting on a "4×" item finished all four.
 *
 * Every row here is made through the API, on an activity of its own, and deleted afterwards: deleting the activity
 * takes its items, history rows and planner blocks with it. An activity of its own also keeps the server's
 * "which block does this time belong to" rule away from the seed's blocks.
 *
 * The sittings are logged through the item's menu → Log time → Manual entry. Clicking the row body would do too,
 * but on a plain item that click also ticks the checkbox, which is not the path under test.
 *
 * Not covered here: **home's planner-block timer leaves a counted item alone.** That timer sends the item link
 * without the flag, so the block decides the item, and a sitting long enough to matter takes a real timer to run
 * out (or a faked browser clock, which would hand the server's durable timer session timestamps in the future).
 * The API's `HistoryTicksOffThePlanTests.RecapOnlyLink_LeavesACountedItemAlone` pins it instead.
 */

type Hm = { hours: number; minutes: number }

/** The browser's clock, which is what the log dialog stamps a sitting with — not the test runner's. */
async function browserNow(page: Page): Promise<{ isoDate: string; minutes: number }> {
	return page.evaluate(() => {
		const now = new Date()
		const pad = (n: number) => String(n).padStart(2, '0')
		return {
			isoDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
			minutes: now.getHours() * 60 + now.getMinutes(),
		}
	})
}

/** `08:30`, as the planner prints it. */
function clock({ hours, minutes }: Hm): string {
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** `0830`, as the time picker's `##:##` mask takes it. */
function hhmm(time: Hm): string {
	return clock(time).replace(':', '')
}

function plus({ hours, minutes }: Hm, add: number): Hm {
	const total = hours * 60 + minutes + add
	return { hours: Math.floor(total / 60), minutes: total % 60 }
}

/** What a test made, so `afterEach` can take it away even when the test failed halfway. */
class Rows {
	private readonly activityIds: number[] = []
	private readonly listIds: number[] = []
	/** Unique per test, so a row a crashed run left behind cannot make a name locator ambiguous. */
	private readonly tag = Math.random().toString(36).slice(2, 7)

	constructor(private readonly page: Page) {}

	private async post(path: string, data: object): Promise<number> {
		const response = await this.page.request.post(`${apiUrl()}/api/${path}`, { data })
		expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
		return Number(await response.json())
	}

	async list(): Promise<number> {
		const id = await this.post('todo-list', { name: `E2E FO2 ${this.tag}` })
		this.listIds.push(id)
		return id
	}

	async activity(label: string): Promise<{ id: number; name: string }> {
		const roles = await this.page.request.get(`${apiUrl()}/api/activity-role/all-options`)
		expect(roles.ok()).toBe(true)
		const work = ((await roles.json()) as { id: number; text: string }[]).find(r => r.text === 'Work')
		expect(work, 'the fixture has no "Work" role').toBeDefined()
		const name = `E2E FO2 ${label} ${this.tag}`
		const id = await this.post('activity', { name, text: '', isUnavoidable: false, roleId: work!.id })
		this.activityIds.push(id)
		return { id, name }
	}

	async item(
		seed: SeedResponse,
		listId: number,
		activityId: number,
		shape: { totalCount: number | null; suggestedTime: Hm },
	): Promise<number> {
		return this.post('todo-list-item', {
			activityId,
			todoListId: listId,
			taskPriorityId: seed.taskPriorities['Today'],
			isDone: false,
			doneCount: shape.totalCount === null ? null : 0,
			totalCount: shape.totalCount,
			suggestedTime: shape.suggestedTime,
			steps: [],
		})
	}

	async block(isoDate: string, activityId: number, startTime: Hm, endTime: Hm): Promise<number> {
		return this.post('planner-task', {
			date: isoDate,
			startTime,
			endTime,
			isBackground: false,
			activityId,
			status: 'notStarted',
		})
	}

	async cleanup() {
		for (const id of this.activityIds.splice(0)) await this.page.request.delete(`${apiUrl()}/api/activity/${id}`)
		for (const id of this.listIds.splice(0)) await this.page.request.delete(`${apiUrl()}/api/todo-list/${id}`)
	}
}

async function itemState(page: Page, itemId: number): Promise<{ isDone: boolean; doneCount: number | null }> {
	const response = await page.request.get(`${apiUrl()}/api/todo-list-item/${itemId}`)
	expect(response.ok()).toBe(true)
	const { isDone, doneCount } = (await response.json()) as { isDone: boolean; doneCount: number | null }
	return { isDone, doneCount }
}

async function openList(page: Page, listId: number, activityName: string) {
	await page.goto(`/todo-list/${listId}`)
	// The items arrive after the first paint; the menu button is what the next step clicks.
	await page.getByRole('button', { name: `More actions: ${activityName}` }).waitFor()
}

/**
 * One sitting, through the item's own log-time dialog. Length is prefilled with the item's suggested time; the
 * start time defaults to 00:00, and sittings of one activity need distinct starts (the history table is unique
 * on user + activity + start, so a second 00:00 answers 409).
 */
async function logSitting(page: Page, activityName: string, sitting: { start: Hm; length?: Hm }) {
	await page.getByRole('button', { name: `More actions: ${activityName}` }).click()
	// `exact`: after the first sitting the undo button is "Undo: Log time …".
	await page.getByRole('button', { name: 'Log time', exact: true }).click()
	await page.getByRole('button', { name: 'Manual entry' }).click()
	const dialog = page.getByRole('dialog', { name: 'Log time manually' })
	await dialog.getByRole('textbox', { name: 'Start time' }).fill(hhmm(sitting.start))
	if (sitting.length) await dialog.getByRole('textbox', { name: 'Length' }).fill(hhmm(sitting.length))

	const saved = page.waitForResponse(
		r => r.url().endsWith('/api/activity-history') && r.request().method() === 'POST',
	)
	await dialog.getByRole('button', { name: 'Confirm' }).click()
	const response = await saved
	expect(response.status(), await response.text()).toBe(201)
	expect(response.request().postDataJSON()).toMatchObject({ countsAsRepetition: true })
	await expect(dialog).toBeHidden()
}

test.describe('Logged time ticks the item, once a sitting (/todo-list/:id)', () => {
	let rows: Rows

	test.beforeEach(async ({ authenticatedPage: page }) => {
		rows = new Rows(page)
		// Every sitting below sits in today's first hour, on the browser's clock. Before 01:00 some of it would
		// lie in the future.
		test.skip((await browserNow(page)).minutes < 60, 'before 01:00 the sittings would end after now')
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	test('a "4×" item takes four sittings, and the first one does not finish it', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const listId = await rows.list()
		const activity = await rows.activity('4x')
		const itemId = await rows.item(seed, listId, activity.id, {
			totalCount: 4,
			suggestedTime: { hours: 0, minutes: 25 },
		})

		await openList(page, listId, activity.name)
		await expect(page.getByRole('button', { name: 'Increase: 0 of 4' })).toBeVisible()

		// The full suggested time, prefilled: the sitting that used to jump the counter straight to 4 of 4.
		await logSitting(page, activity.name, { start: { hours: 0, minutes: 0 } })
		await expect(page.getByRole('button', { name: 'Increase: 1 of 4' })).toBeEnabled()
		expect(await itemState(page, itemId)).toEqual({ isDone: false, doneCount: 1 })

		// Short ones count the same: logging it from the item is what says it happened.
		for (const [index, minutes] of [30, 40].entries()) {
			await logSitting(page, activity.name, { start: { hours: 0, minutes }, length: { hours: 0, minutes: 5 } })
			await expect(page.getByRole('button', { name: `Increase: ${index + 2} of 4` })).toBeEnabled()
		}
		expect(await itemState(page, itemId)).toEqual({ isDone: false, doneCount: 3 })

		await logSitting(page, activity.name, { start: { hours: 0, minutes: 50 }, length: { hours: 0, minutes: 5 } })
		await expect(page.getByRole('button', { name: 'Increase: 4 of 4' })).toBeDisabled()
		expect(await itemState(page, itemId)).toEqual({ isDone: true, doneCount: 4 })
	})

	test('a plain item is finished by one short sitting', async ({ authenticatedPage: page, seed }) => {
		const listId = await rows.list()
		const activity = await rows.activity('plain')
		// Well short of the estimate, so it is the sitting that finishes it, not the time-threshold fallback.
		const itemId = await rows.item(seed, listId, activity.id, {
			totalCount: null,
			suggestedTime: { hours: 1, minutes: 0 },
		})

		await openList(page, listId, activity.name)
		const checkbox = page.getByRole('checkbox', { name: `Mark done: ${activity.name}` })
		await expect(checkbox).not.toBeChecked()

		await logSitting(page, activity.name, { start: { hours: 0, minutes: 0 }, length: { hours: 0, minutes: 5 } })
		await expect(checkbox).toBeChecked()
		expect((await itemState(page, itemId)).isDone).toBe(true)
	})
})

test.describe('A sitting logged from the item completes its planned block (/todo-list/:id, / and /day-planner/:date)', () => {
	let rows: Rows

	test.beforeEach(async ({ authenticatedPage: page }) => {
		rows = new Rows(page)
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	test('the block reads Completed on home and in the day planner', async ({ authenticatedPage: page, seed }) => {
		const now = await browserNow(page)
		// The dialog stamps the sitting with the browser's date, and home and the planner show the seed's day.
		test.skip(now.isoDate !== seed.seedDateUtc, `the seed's day (${seed.seedDateUtc}) is no longer today`)

		const dayPlan = await page.request.get(`${apiUrl()}/api/calendar/day-plan/${seed.seedDateUtc}`)
		expect(dayPlan.ok()).toBe(true)
		const { calendar } = (await dayPlan.json()) as { calendar: { wakeUpTime: Hm | null } | null }
		expect(calendar, `the fixture has no calendar row on ${seed.seedDateUtc}`).not.toBeNull()
		// The planner grid starts at the day's wake-up time and draws nothing before it, so that is where the block
		// goes. Thirty minutes, not five: a block shorter than one grid slot gets no rows and is never drawn.
		const start = calendar!.wakeUpTime ?? { hours: 8, minutes: 0 }
		const end = plus(start, 30)
		test.skip(
			now.minutes < end.hours * 60 + end.minutes,
			`the block (${clock(start)}–${clock(end)}) has not ended yet on the browser's clock`,
		)

		const listId = await rows.list()
		const activity = await rows.activity('planned')
		const itemId = await rows.item(seed, listId, activity.id, {
			totalCount: null,
			suggestedTime: { hours: 0, minutes: 30 },
		})
		await rows.block(seed.seedDateUtc, activity.id, start, end)

		await openList(page, listId, activity.name)
		// Length is the suggested 30 minutes, prefilled: exactly as long as the block.
		await logSitting(page, activity.name, { start })
		await expect(page.getByRole('checkbox', { name: `Mark done: ${activity.name}` })).toBeChecked()
		expect((await itemState(page, itemId)).isDone).toBe(true)

		await page.goto('/')
		const homeCheck = page.locator('.planner-card').getByRole('button', { name: `Mark "${activity.name}" as done` })
		await expect(homeCheck).toHaveAttribute('aria-pressed', 'true')

		await page.goto(`/day-planner/${seedDateParam(seed)}`)
		// The block's accessible name carries its status; the chip that shows it is outside the a11y tree.
		await expect(
			page.getByRole('button', {
				name: new RegExp(`^${activity.name}, ${clock(start)} to ${clock(end)}, status: Completed`),
			}),
		).toBeVisible()
	})
})
