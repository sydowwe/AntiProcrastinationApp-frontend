import type { Locator, Page, Request } from '@playwright/test'
import { apiUrl, expect, seedDateParam, test } from '../fixtures/auth'
import type { SeedResponse } from '../fixtures/auth'

/**
 * Planner lanes (`docs/feature-opportunities.md`, FO6 → "Planner lanes"): up to two blocks of one kind may
 * share a minute and are drawn side by side; a third is refused by the grid, by the task dialog and by the
 * server's single-task writes (409 `Conflict`), and one that still arrives through a bulk path is drawn as a
 * clash rather than hidden. The rule is `src/core/dayPlanner/utils/plannerLanes.ts` here and
 * `PlannerTaskLaneRule` in the API.
 *
 * **It runs as the secondary account**, whose planner is empty: the day view tests use days 20 and 21 after the
 * seed date (asserted empty before anything is made), and the home tests use the account's real today. Every
 * row is made through the API on an activity of its own and deleted afterwards; deleting the activity takes its
 * blocks with it, copies included.
 *
 * **Home's clock is the real one.** The now bar is "now" on the browser's clock and the server judges the
 * extension on its own, so the home blocks are built around the real minute in the account's zone, as in
 * `planner-replan-today.spec.ts`; `page.clock` would move only the browser, and the server would then answer
 * about a different minute. A test without room on either side of now skips with the reason.
 */

type Hm = { hours: number; minutes: number }

const LAST_MINUTE = 24 * 60 - 1
/** The days the grid tests build on: no fixture row is on either (asserted in `beforeEach`). */
const LANE_DAY = 20
const SOURCE_DAY = 21

function hm(minutes: number): Hm {
	return { hours: Math.floor(minutes / 60), minutes: minutes % 60 }
}

function toMinutes({ hours, minutes }: Hm): number {
	return hours * 60 + minutes
}

function at(hhmm: string): number {
	const [hours, minutes] = hhmm.split(':').map(Number)
	return hours * 60 + minutes
}

/** `08:30`, as the planner prints it. */
function clock(minutes: number): string {
	const { hours, minutes: rest } = hm(minutes)
	return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** `2026-11-02` for the API, from the same `seedDateParam` the routes use. */
function seedIsoDate(seed: SeedResponse, offset: number): string {
	const [day, month, year] = seedDateParam(seed, offset).split('-')
	return `${year}-${month}-${day}`
}

/** What a test made, so `afterEach` can take it away even when the test failed halfway. */
class Rows {
	private readonly activityIds: number[] = []
	/** Unique per test, so a row a crashed run left behind cannot make a name locator ambiguous. */
	private readonly tag = Math.random().toString(36).slice(2, 7)

	constructor(private readonly page: Page) {}

	private async post(path: string, data: object): Promise<number> {
		const response = await this.page.request.post(`${apiUrl()}/api/${path}`, { data })
		expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
		return Number(await response.json())
	}

	/** An activity under the secondary account's own role. */
	async activity(label: string): Promise<{ id: number; name: string }> {
		const roles = await this.page.request.get(`${apiUrl()}/api/activity-role/all-options`)
		expect(roles.ok()).toBe(true)
		const role = ((await roles.json()) as { id: number; text: string }[]).find(r => r.text === 'Consulting')
		expect(role, 'the secondary account has no "Consulting" role').toBeDefined()
		const name = `E2E Lanes ${label} ${this.tag}`
		const id = await this.post('activity', { name, text: '', isUnavoidable: false, roleId: role!.id })
		this.activityIds.push(id)
		return { id, name }
	}

	async block(isoDate: string, activityId: number, start: number, end: number, isBackground = false) {
		return this.post('planner-task', {
			date: isoDate,
			startTime: hm(start),
			endTime: hm(end),
			isBackground,
			activityId,
			importanceId: null,
			location: null,
			notes: null,
			status: 'NotStarted',
		})
	}

	async cleanup() {
		for (const id of this.activityIds.splice(0)) await this.page.request.delete(`${apiUrl()}/api/activity/${id}`)
	}
}

type DayPlan = { calendar: { id: number } | null; tasks: { id: number; startTime: Hm; endTime: Hm }[] }

async function dayPlan(page: Page, isoDate: string): Promise<DayPlan> {
	const response = await page.request.get(`${apiUrl()}/api/calendar/day-plan/${isoDate}`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as DayPlan
}

async function storedSpan(page: Page, id: number): Promise<{ start: number; end: number }> {
	const response = await page.request.get(`${apiUrl()}/api/planner-task/${id}`)
	expect(response.ok()).toBe(true)
	const { startTime, endTime } = (await response.json()) as { startTime: Hm; endTime: Hm }
	return { start: toMinutes(startTime), end: toMinutes(endTime) }
}

/**
 * Every create, update or span patch the page sends for a planner task, so a test can say none was sent.
 * Only those three routes: the day's loads include POSTs of their own (filters, summaries).
 */
function plannerWrites(page: Page): Request[] {
	const writes: Request[] = []
	page.on('request', request => {
		const path = new URL(request.url()).pathname
		if (/\/api\/planner-task(\/\d+)?$/.test(path) && ['POST', 'PUT', 'PATCH'].includes(request.method())) {
			writes.push(request)
		}
	})
	return writes
}

/** A day-view block by its accessible name, which starts with the activity and its times. */
function blockNamed(page: Page, name: string, start: number, end: number): Locator {
	return page.getByRole('button', { name: new RegExp(`^${escapeRegex(name)}, ${clock(start)} to ${clock(end)}`) })
}

function backgroundNamed(page: Page, name: string): Locator {
	return page.getByRole('button', { name: new RegExp(`^Background activity: ${escapeRegex(name)}, `) })
}

function blockById(page: Page, id: number): Locator {
	return page.locator(`[data-task-id="${id}"]`)
}

/** The box once a lane change's transition has finished: two reads in a row agree. */
async function settledBox(locator: Locator) {
	let previous = await locator.boundingBox()
	await expect
		.poll(async () => {
			const current = await locator.boundingBox()
			const settled = JSON.stringify(current) === JSON.stringify(previous)
			previous = current
			return settled
		})
		.toBe(true)
	return previous!
}

/** Drags a block by its middle (its top and bottom edges are resize handles) `dy` pixels down. */
async function dragBy(page: Page, block: Locator, dy: number) {
	const box = await settledBox(block)
	const x = box.x + box.width / 2
	const y = box.y + box.height / 2
	await page.mouse.move(x, y)
	await page.mouse.down()
	for (let step = 1; step <= 10; step++) await page.mouse.move(x, y + (dy * step) / 10)
	await page.mouse.up()
}

async function openDay(page: Page, seed: SeedResponse, offset: number) {
	await page.goto(`/day-planner/${seedDateParam(seed, offset)}`)
	await page.getByRole('group', { name: /^Time grid/ }).waitFor()
}

test.describe('Planner lanes on the day grid (/day-planner/:date)', () => {
	let rows: Rows
	let isoDate: string
	/** Two foreground blocks and two background ones, each pair overlapping. */
	let a: { id: number; name: string; blockId: number }
	let b: { id: number; name: string; blockId: number }
	let x: { id: number; name: string; blockId: number }
	let y: { id: number; name: string; blockId: number }

	test.beforeEach(async ({ secondaryPage: page, seed }) => {
		// The grid is 08:00 to midnight; this keeps 10:00 to 13:00 on screen at once for the drags.
		await page.setViewportSize({ width: 1440, height: 900 })
		rows = new Rows(page)
		isoDate = seedIsoDate(seed, LANE_DAY)
		expect((await dayPlan(page, isoDate)).tasks, `day +${LANE_DAY} is not empty`).toHaveLength(0)

		async function make(label: string, start: string, end: string, isBackground = false) {
			const activity = await rows.activity(label)
			return { ...activity, blockId: await rows.block(isoDate, activity.id, at(start), at(end), isBackground) }
		}
		a = await make('A', '10:00', '11:30')
		b = await make('B', '10:30', '12:00')
		x = await make('X', '10:00', '12:00', true)
		y = await make('Y', '11:00', '13:00', true)
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	test('two overlapping blocks sit side by side, each named beside the other', async ({ secondaryPage: page, seed }) => {
		await openDay(page, seed, LANE_DAY)
		const blockA = blockNamed(page, a.name, at('10:00'), at('11:30'))
		const blockB = blockNamed(page, b.name, at('10:30'), at('12:00'))
		await expect(blockA).toHaveAccessibleName(new RegExp(`side by side with ${escapeRegex(b.name)}`))
		await expect(blockB).toHaveAccessibleName(new RegExp(`side by side with ${escapeRegex(a.name)}`))

		// Left half and right half of the same column: A ends before B begins, and they are the same width.
		const boxA = await settledBox(blockA)
		const boxB = await settledBox(blockB)
		expect(boxA.x + boxA.width).toBeLessThanOrEqual(boxB.x)
		expect(Math.abs(boxA.width - boxB.width)).toBeLessThanOrEqual(1)
		// Neither is clipped to nothing, nor drawn as a clash.
		expect(boxA.width).toBeGreaterThan(100)
		await expect(page.locator('.lane-clash')).toHaveCount(0)
	})

	test('two background blocks render as two strips, side by side and clear of the foreground', async ({
		secondaryPage: page,
		seed,
	}) => {
		await openDay(page, seed, LANE_DAY)
		const stripX = backgroundNamed(page, x.name)
		const stripY = backgroundNamed(page, y.name)
		await expect(stripX).toHaveAccessibleName(new RegExp(`side by side with ${escapeRegex(y.name)}`))
		await expect(stripY).toHaveAccessibleName(new RegExp(`side by side with ${escapeRegex(x.name)}`))

		const boxX = await settledBox(stripX)
		const boxY = await settledBox(stripY)
		// Two narrow strips (28 px each, `NARROW_BACKGROUND_STRIP_PX`), X left of Y with no overlap.
		expect(Math.round(boxX.width)).toBe(28)
		expect(Math.round(boxY.width)).toBe(28)
		expect(boxX.x + boxX.width).toBeLessThanOrEqual(boxY.x + 0.5)
		// The foreground block beside them starts past both.
		const boxA = await settledBox(blockNamed(page, a.name, at('10:00'), at('11:30')))
		expect(boxA.x).toBeGreaterThanOrEqual(boxY.x + boxY.width - 0.5)
	})

	test('a drag that would make a third is refused, and a drag beside only one block saves', async ({
		secondaryPage: page,
		seed,
	}) => {
		const c = await rows.activity('C')
		const cId = await rows.block(isoDate, c.id, at('12:00'), at('12:30'))
		const writes = plannerWrites(page)
		await openDay(page, seed, LANE_DAY)
		const blockA = blockNamed(page, a.name, at('10:00'), at('11:30'))
		await blockNamed(page, c.name, at('12:00'), at('12:30')).waitFor()
		await blockById(page, b.blockId).evaluate(element => element.scrollIntoView({ block: 'center' }))

		const boxA = await settledBox(blockA)
		const pxPerMinute = boxA.height / 90
		const blockC = blockById(page, cId)
		async function topOfC() {
			return (await settledBox(blockC)).y
		}

		// 11:00 is inside both A and B: a third.
		await dragBy(page, blockC, boxA.y + 60 * pxPerMinute - (await topOfC()))
		await expect(page.getByText('Two tasks are already planned at that time')).toBeVisible()
		await expect(blockNamed(page, c.name, at('12:00'), at('12:30'))).toBeVisible()
		expect(writes, 'the refused drag sent a write').toHaveLength(0)
		expect(await storedSpan(page, cId)).toEqual({ start: at('12:00'), end: at('12:30') })

		// 11:30 is past A's end and inside B: two side by side.
		const saved = page.waitForResponse(
			response => response.url().endsWith(`/api/planner-task/${cId}`) && response.request().method() === 'PATCH',
		)
		await dragBy(page, blockC, boxA.y + 90 * pxPerMinute - (await topOfC()))
		expect((await saved).status()).toBe(204)
		await expect(blockNamed(page, c.name, at('11:30'), at('12:00'))).toHaveAccessibleName(
			new RegExp(`side by side with ${escapeRegex(b.name)}`),
		)
		expect(await storedSpan(page, cId)).toEqual({ start: at('11:30'), end: at('12:00') })
	})

	test('the task dialog names the two blocks a third would sit beside, refuses Confirm, and clears at a free time', async ({
		secondaryPage: page,
		seed,
	}) => {
		const writes = plannerWrites(page)
		await openDay(page, seed, LANE_DAY)
		await blockNamed(page, b.name, at('10:30'), at('12:00')).waitFor()
		await page.getByRole('button', { name: 'Add Task' }).click()
		const dialog = page.getByRole('dialog', { name: 'Add New Task' })
		const start = dialog.getByRole('textbox', { name: 'Start' })
		// The dialog's other alerts are the fields' (empty) validation messages.
		const warning = dialog.getByRole('alert').filter({ hasText: 'already planned for part of this time' })

		// The new block keeps the dialog's default hour, so 11:00 runs to 12:00: beside A and B both.
		await start.fill('11:00')
		await start.press('Tab')
		await expect(warning).toContainText('Two tasks are already planned for part of this time')
		await expect(warning.getByRole('listitem')).toHaveText([`${a.name} · 10:00 – 11:30`, `${b.name} · 10:30 – 12:00`])

		await dialog.getByRole('button', { name: 'Confirm' }).click()
		// A refusal is the absence of a request, so give one the time it would take to leave.
		await page.waitForTimeout(1_000)
		await expect(dialog).toBeVisible()
		expect(writes, 'Confirm sent a write past the warning').toHaveLength(0)

		await start.fill('15:00')
		await start.press('Tab')
		await expect(warning).toHaveCount(0)
	})

	test('the dialog warns about background blocks against background blocks only', async ({
		secondaryPage: page,
		seed,
	}) => {
		await openDay(page, seed, LANE_DAY)
		await backgroundNamed(page, y.name).waitFor()
		await page.getByRole('button', { name: 'Add Task' }).click()
		const dialog = page.getByRole('dialog', { name: 'Add New Task' })
		const start = dialog.getByRole('textbox', { name: 'Start' })
		const warning = dialog.getByRole('alert').filter({ hasText: 'already planned for part of this time' })

		// 13:00 to 14:00 meets nothing of either kind (Y ends at 13:00, and ends are exclusive).
		await start.fill('13:00')
		await start.press('Tab')
		await dialog.getByRole('checkbox', { name: 'Is background' }).check()
		await expect(warning).toHaveCount(0)

		// 11:00 to 12:00 is inside X and Y, and inside A and B too: the background list names only X and Y.
		await start.fill('11:00')
		await start.press('Tab')
		await expect(warning).toContainText('Two background activities are already planned for part of this time')
		await expect(warning.getByRole('listitem')).toHaveText([`${x.name} · 10:00 – 12:00`, `${y.name} · 11:00 – 13:00`])

		await start.fill('15:00')
		await start.press('Tab')
		await expect(warning).toHaveCount(0)
		await dialog.getByRole('button', { name: 'Cancel' }).click()
	})

	test('a third block arriving through copy-to-days is drawn as a clash, not hidden', async ({
		secondaryPage: page,
		seed,
	}) => {
		// The bulk paths are not lane-checked (`PlannerTaskLaneRule`): a copied day lands whatever it holds.
		const sourceIso = seedIsoDate(seed, SOURCE_DAY)
		expect((await dayPlan(page, sourceIso)).tasks, `day +${SOURCE_DAY} is not empty`).toHaveLength(0)
		const copied = await rows.activity('Copied')
		await rows.block(sourceIso, copied.id, at('11:00'), at('11:20'))
		const source = (await dayPlan(page, sourceIso)).calendar
		const target = (await dayPlan(page, isoDate)).calendar
		expect(source && target, 'a lane day has no calendar row').toBeTruthy()
		const copy = await page.request.post(`${apiUrl()}/api/planner-task/copy-to-days`, {
			data: { sourceCalendarId: source!.id, targetCalendarIds: [target!.id] },
		})
		expect(copy.ok(), `copy-to-days: ${copy.status()} ${await copy.text()}`).toBe(true)

		await openDay(page, seed, LANE_DAY)
		// Third in time order at 11:00, so it is the one with no lane left.
		const third = blockNamed(page, copied.name, at('11:00'), at('11:20'))
		await expect(third).toHaveAccessibleName(
			new RegExp(`clashes: a third task at the same time as ${escapeRegex(a.name)}, ${escapeRegex(b.name)}`),
		)
		await expect(third).toHaveClass(/\blane-clash\b/)
		await expect(page.locator('.lane-clash')).toHaveCount(1)
		// All three stay on screen.
		const blockA = blockNamed(page, a.name, at('10:00'), at('11:30'))
		const blockB = blockNamed(page, b.name, at('10:30'), at('12:00'))
		for (const block of [third, blockA, blockB]) {
			await expect(block).toBeVisible()
			expect((await settledBox(block)).width).toBeGreaterThan(50)
		}
	})
})

// --- home -------------------------------------------------------------------------------------------

type UserClock = { isoDate: string; minutes: number }

async function serverTimeZone(page: Page): Promise<string> {
	const response = await page.request.get(`${apiUrl()}/api/user/data`)
	expect(response.ok()).toBe(true)
	return ((await response.json()) as { timezone: string }).timezone
}

/**
 * "Now" as the server judges it: the real clock, in the account's zone. The app moves the server's copy of
 * the zone to the browser's on hydration, so wait for that before reading (see `planner-replan-today.spec.ts`).
 */
async function userClock(page: Page): Promise<UserClock> {
	if (page.url() === 'about:blank') await page.goto('/')
	const timezone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
	await expect
		.poll(() => serverTimeZone(page), { message: `the server never took the browser's zone (${timezone})` })
		.toBe(timezone)
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-GB', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		})
			.formatToParts(new Date())
			.map(part => [part.type, part.value]),
	)
	return {
		isoDate: `${parts.year}-${parts.month}-${parts.day}`,
		minutes: Number(parts.hour) * 60 + Number(parts.minute),
	}
}

test.describe('Home with two blocks at once (/)', () => {
	let rows: Rows
	let now: UserClock
	let first: { id: number; name: string; blockId: number }
	let second: { id: number; name: string; blockId: number }

	test.beforeEach(async ({ secondaryPage: page }) => {
		rows = new Rows(page)
		now = await userClock(page)
		test.skip(now.minutes < 30, `needs 30 minutes of today behind now (${clock(now.minutes)})`)
		test.skip(now.minutes + 90 > LAST_MINUTE, `needs 90 minutes of today ahead of now (${clock(now.minutes)})`)
		expect((await dayPlan(page, now.isoDate)).tasks, "the secondary account's today is not empty").toHaveLength(0)

		async function make(label: string, start: number, end: number) {
			const activity = await rows.activity(label)
			return { ...activity, blockId: await rows.block(now.isoDate, activity.id, start, end) }
		}
		// Both under way, side by side; the first started first, so it is the focus task.
		first = await make('First', now.minutes - 30, now.minutes + 30)
		second = await make('Second', now.minutes - 20, now.minutes + 60)
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	async function openHome(page: Page) {
		await page.goto('/')
		await page.locator('.nowbar--now').getByText(first.name).waitFor()
	}

	/** The now bar's task menu, and its "Give it longer" steps (the items between that heading and the next). */
	async function openExtendSteps(page: Page): Promise<{ menu: Locator; steps: string[] }> {
		await page
			.locator('.nowbar')
			.getByRole('button', { name: `Actions for "${first.name}"` })
			.click()
		const menu = page.locator('.v-overlay-container .v-list').last()
		await menu.getByText('Move later').waitFor()
		const texts = (await menu.locator('.v-list-subheader, .v-list-item').allInnerTexts()).map(text => text.trim())
		const from = texts.indexOf('Give it longer')
		return { menu, steps: from === -1 ? [] : texts.slice(from + 1, texts.indexOf('Move later')) }
	}

	test('the now bar names the block that started first and counts the other', async ({ secondaryPage: page }) => {
		await openHome(page)
		const bar = page.locator('.nowbar--now')
		await expect(bar).toContainText('and 1 more')
		await expect(bar.getByText(`Also now: ${second.name}`)).toBeAttached()
		await expect(bar.locator('.nowbar__title')).toHaveText(first.name)
	})

	test('Give it longer stops short of a third block, and the capped step saves', async ({ secondaryPage: page }) => {
		// From ten minutes after the first block ends, the second one and this one would make it a third.
		await rows.block(now.isoDate, (await rows.activity('Next')).id, now.minutes + 40, now.minutes + 90)
		await openHome(page)

		const { menu, steps } = await openExtendSteps(page)
		expect(steps, 'the extension steps on offer').toEqual(['+10m'])
		const saved = page.waitForResponse(
			response =>
				response.url().endsWith(`/api/planner-task/${first.blockId}`) && response.request().method() === 'PUT',
		)
		await menu.getByText('+10m', { exact: true }).click()
		expect((await saved).status()).toBe(200)
		expect(await storedSpan(page, first.blockId)).toEqual({ start: now.minutes - 30, end: now.minutes + 40 })

		// Now flush against both: nothing left to offer.
		await page.keyboard.press('Escape')
		expect((await openExtendSteps(page)).steps).toEqual([])
	})

	test('an extension the server refuses (409) says why, once, and keeps the old end', async ({
		secondaryPage: page,
	}) => {
		await openHome(page)
		const { menu, steps } = await openExtendSteps(page)
		expect(steps).toEqual(['+15m', '+30m'])

		// Another device fills the stretch after the first block beside the second one, behind this page's back.
		await rows.block(now.isoDate, (await rows.activity('Elsewhere')).id, now.minutes + 30, now.minutes + 40)
		const refused = page.waitForResponse(
			response =>
				response.url().endsWith(`/api/planner-task/${first.blockId}`) && response.request().method() === 'PUT',
		)
		// "+15m" is a step of both sections; "Give it longer" comes first.
		await menu.getByText('+15m', { exact: true }).first().click()
		expect((await refused).status()).toBe(409)

		await expect(page.getByText(`Two tasks are already planned then, so "${first.name}" was not extended`)).toBeVisible()
		// One toast: neither the generic one nor the interceptor's quote of the server.
		await expect(page.getByText(`Could not extend "${first.name}"`)).toHaveCount(0)
		await expect(page.getByText('a third cannot be placed beside them')).toHaveCount(0)
		await expect(page.locator('.nowbar--now')).toContainText(`${clock(now.minutes - 30)} – ${clock(now.minutes + 30)}`)
		expect(await storedSpan(page, first.blockId)).toEqual({ start: now.minutes - 30, end: now.minutes + 30 })
	})
})
