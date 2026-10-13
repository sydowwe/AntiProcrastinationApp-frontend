import type { Locator, Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'
import type { SeedResponse } from '../fixtures/auth'

/**
 * FO4 (`docs/feature-opportunities.md`): "Re-plan the rest of today" packs the blocks that slipped into the time
 * that is left, and one placement rule (`next-free-slot`) answers *Move later*, leisure *Plan it for later* and the
 * to-do → planner handoff. The rules are the API's (`AdhdTimeOrganizer.Planning/docs/domain-map.md`
 * § *Re-planning the rest of today*); this spec drives the screens that offer them.
 *
 * **The clock is the server's real one, in the user's zone.** "Missed" means the block's end has passed on that
 * clock, and the re-plan packs from that clock's now to bed time (23:59 for the fixture accounts, whose bed time
 * is the 00:00 default). `page.clock` moves only the browser, so every block here is built around the real minute
 * in the account's zone, and a test that has no room on either side of now skips with the reason rather than flaking
 * at the day's edge. That zone is not the seed's UTC once the app has run (see `userClock`).
 *
 * **Most of it runs as the secondary account.** Its today has no planner blocks, while the primary's holds the
 * fixture's missed 11:00 block (`16003`): every re-plan there would move it, and applying one would rewrite a row
 * other specs read. The last block needs the primary account, because only it has leisure profiles, and it only
 * reads the free time (nothing it does is applied).
 *
 * Every row is made through the API on an activity of its own and deleted afterwards; deleting the activity takes
 * its blocks with it, tomorrow's included.
 */

type Hm = { hours: number; minutes: number }

const LAST_MINUTE = 24 * 60 - 1

function hm(minutes: number): Hm {
	return { hours: Math.floor(minutes / 60), minutes: minutes % 60 }
}

function toMinutes({ hours, minutes }: Hm): number {
	return hours * 60 + minutes
}

/** `08:30`, as the planner prints it. */
function clock(minutes: number): string {
	const { hours, minutes: rest } = hm(minutes)
	return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function ceilTo(minutes: number, grid: number): number {
	return Math.ceil(minutes / grid) * grid
}

type UserClock = {
	/** `yyyy-MM-dd`, the user's today. */
	isoDate: string
	/** The user's tomorrow, `yyyy-MM-dd`. */
	tomorrowIsoDate: string
	/** Minutes past midnight in the user's zone. */
	minutes: number
}

async function serverTimeZone(page: Page): Promise<string> {
	const response = await page.request.get(`${apiUrl()}/api/user/data`)
	expect(response.ok()).toBe(true)
	return ((await response.json()) as { timezone: string }).timezone
}

/**
 * "Now" as the server judges it: the real clock, in the zone the account is set to.
 *
 * The seed creates the accounts on UTC. The app moves the server's copy to the browser's zone when it
 * hydrates (`syncBrowserTimeZone` in `main.ts`), and straight after a cold sign-in that write can still be in
 * flight: read too early, every block lands two hours off. So wait until the server holds the browser's zone,
 * loading the app first if this page has not yet.
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
	const isoDate = `${parts.year}-${parts.month}-${parts.day}`
	const tomorrow = new Date(`${isoDate}T00:00:00Z`)
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
	return {
		isoDate,
		tomorrowIsoDate: tomorrow.toISOString().slice(0, 10),
		minutes: Number(parts.hour) * 60 + Number(parts.minute),
	}
}

/** `/day-planner/13-10-2026` from `2026-10-13`. */
function dayPlannerPath(isoDate: string): string {
	const [year, month, day] = isoDate.split('-')
	return `/day-planner/${day}-${month}-${year}`
}

/** Skips the test unless now leaves room for what it builds: `before` minutes of past, `after` minutes of future. */
function needRoom(now: UserClock, before: number, after: number) {
	test.skip(now.minutes < before, `needs ${before} minutes of today behind now (${clock(now.minutes)})`)
	test.skip(now.minutes + after > LAST_MINUTE, `needs ${after} minutes of today ahead of now (${clock(now.minutes)})`)
}

type StoredBlock = {
	startTime: Hm
	endTime: Hm
	status: string
	skipReasonKey: string | null
	calendarId: number
	isBackground: boolean
	location: string | null
	notes: string | null
	activity: { id: number }
	importance: { id: number } | null
	skipReason: string | null
	actualStartTime: Hm | null
	actualEndTime: Hm | null
}

/** What a test made, so `afterEach` can take it away even when the test failed halfway. */
class Rows {
	private readonly activityIds: number[] = []
	private readonly listIds: number[] = []
	/** Unique per test, so a row a crashed run left behind cannot make a name locator ambiguous. */
	private readonly tag = Math.random().toString(36).slice(2, 7)

	constructor(
		private readonly page: Page,
		/** The account's own role to file activities under: the two fixture accounts have different ones. */
		private readonly roleName: string,
	) {}

	private async post(path: string, data: object): Promise<number> {
		const response = await this.page.request.post(`${apiUrl()}/api/${path}`, { data })
		expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
		return Number(await response.json())
	}

	async activity(label: string, { unavoidable = false } = {}): Promise<{ id: number; name: string }> {
		const roles = await this.page.request.get(`${apiUrl()}/api/activity-role/all-options`)
		expect(roles.ok()).toBe(true)
		const role = ((await roles.json()) as { id: number; text: string }[]).find(r => r.text === this.roleName)
		expect(role, `the account has no "${this.roleName}" role`).toBeDefined()
		const name = `E2E FO4 ${label} ${this.tag}`
		const id = await this.post('activity', { name, text: '', isUnavoidable: unavoidable, roleId: role!.id })
		this.activityIds.push(id)
		return { id, name }
	}

	async block(
		isoDate: string,
		activityId: number,
		start: number,
		end: number,
		{ importanceId = null as number | null } = {},
	): Promise<number> {
		return this.post('planner-task', {
			date: isoDate,
			startTime: hm(start),
			endTime: hm(end),
			isBackground: false,
			activityId,
			importanceId,
			status: 'notStarted',
		})
	}

	async list(): Promise<number> {
		const id = await this.post('todo-list', { name: `E2E FO4 ${this.tag}` })
		this.listIds.push(id)
		return id
	}

	async item(seed: SeedResponse, listId: number, activityId: number, suggestedMinutes: number): Promise<number> {
		return this.post('todo-list-item', {
			activityId,
			todoListId: listId,
			taskPriorityId: seed.taskPriorities['Today'],
			isDone: false,
			doneCount: null,
			totalCount: null,
			suggestedTime: hm(suggestedMinutes),
			steps: [],
		})
	}

	async cleanup() {
		for (const id of this.activityIds.splice(0)) await this.page.request.delete(`${apiUrl()}/api/activity/${id}`)
		for (const id of this.listIds.splice(0)) await this.page.request.delete(`${apiUrl()}/api/todo-list/${id}`)
	}
}

async function storedBlock(page: Page, id: number): Promise<StoredBlock> {
	const response = await page.request.get(`${apiUrl()}/api/planner-task/${id}`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as StoredBlock
}

/** The block as the day plan of `isoDate` lists it, or undefined when it is not on that day. */
async function blockOnDay(
	page: Page,
	isoDate: string,
	id: number,
): Promise<{ startTime: Hm; endTime: Hm } | undefined> {
	const response = await page.request.get(`${apiUrl()}/api/calendar/day-plan/${isoDate}`)
	expect(response.ok()).toBe(true)
	const { tasks } = (await response.json()) as { tasks: { id: number; startTime: Hm; endTime: Hm }[] }
	return tasks.find(task => task.id === id)
}

/** Moves a block through the API, the way another device would: a full PUT of what the server holds. */
async function moveBlock(page: Page, id: number, start: number, end: number) {
	const block = await storedBlock(page, id)
	const response = await page.request.put(`${apiUrl()}/api/planner-task/${id}`, {
		data: {
			startTime: hm(start),
			endTime: hm(end),
			calendarId: block.calendarId,
			isBackground: block.isBackground,
			location: block.location,
			notes: block.notes,
			activityId: block.activity.id,
			importanceId: block.importance?.id ?? null,
			status: block.status,
			todolistId: null,
			skipReason: block.skipReason,
			actualStartTime: block.actualStartTime,
			actualEndTime: block.actualEndTime,
		},
	})
	expect(response.ok(), `PUT planner-task/${id}: ${response.status()} ${await response.text()}`).toBe(true)
}

/** The account's "optional" importance row (the server's `OptionalMarkerValue`, 666), which every user is given. */
async function optionalImportanceId(page: Page): Promise<number> {
	const response = await page.request.get(`${apiUrl()}/api/task-importance`)
	expect(response.ok()).toBe(true)
	const optional = ((await response.json()) as { id: number; importance: number }[]).find(i => i.importance === 666)
	expect(optional, 'the account has no optional importance row').toBeDefined()
	return optional!.id
}

const BANNER_TEXT = "Some blocks didn't start on time"

function replanDialog(page: Page): Locator {
	return page.getByRole('dialog', { name: 'Re-plan the rest of today' })
}

/** One row of the dialog's *Moves* or *No room left today* list. */
function dialogRow(page: Page, activityName: string): Locator {
	return replanDialog(page).getByRole('listitem').filter({ hasText: activityName })
}

async function openDayView(page: Page, isoDate: string) {
	await page.goto(dayPlannerPath(isoDate))
	// The blocks arrive after the grid paints, and the banner is computed from them.
	await page.getByRole('group', { name: /^Time grid/ }).waitFor()
}

/** Opens the dialog from the day view's banner and waits until the preview it shows is the server's. */
async function openFromBanner(page: Page) {
	const preview = page.waitForResponse(r => r.url().endsWith('/replan') && r.request().method() === 'POST')
	await page.getByRole('button', { name: 'Re-plan the rest of today' }).click()
	expect((await preview).status()).toBe(200)
	await expect(replanDialog(page)).toBeVisible()
}

/** Clicks the dialog's apply and returns the apply's HTTP status. */
async function clickApply(page: Page): Promise<number> {
	const applied = page.waitForResponse(r => r.url().endsWith('/replan/apply') && r.request().method() === 'POST')
	await replanDialog(page).getByRole('button', { name: 'Re-plan', exact: true }).click()
	return (await applied).status()
}

/** The `left` of every segment in each of the dialog's two timelines (before, after), in percent. */
async function timelineLefts(page: Page): Promise<number[][]> {
	return page
		.locator('.replan-timelines .mini-timeline')
		.evaluateAll(timelines =>
			timelines.map(timeline =>
				[...timeline.querySelectorAll<HTMLElement>('.mini-timeline-segment')].map(s =>
					parseFloat(s.style.left),
				),
			),
		)
}

test.describe('Re-plan the rest of today (/day-planner/:date)', () => {
	let rows: Rows

	test.beforeEach(async ({ secondaryPage: page }) => {
		rows = new Rows(page, 'Consulting')
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	test('the banner appears only once a block has been missed', async ({ secondaryPage: page }) => {
		const now = await userClock(page)
		// Before the wake-up hour the grid draws nothing, so there would be no block to wait on.
		test.skip(now.minutes < 8 * 60 + 60, 'the upcoming block must land on the grid, which starts at 08:00')
		needRoom(now, 60, 50)

		const activity = await rows.activity('banner')
		await rows.block(now.isoDate, activity.id, now.minutes + 20, now.minutes + 50)
		await openDayView(page, now.isoDate)
		// The upcoming block is drawn, so the day has loaded: an upcoming block is not a slip.
		await expect(page.getByRole('button', { name: new RegExp(`^${activity.name}, `) })).toBeVisible()
		await expect(page.getByText(BANNER_TEXT)).toBeHidden()

		const missed = await rows.activity('missed')
		await rows.block(now.isoDate, missed.id, now.minutes - 60, now.minutes - 30)
		await openDayView(page, now.isoDate)
		await expect(page.getByText(BANNER_TEXT)).toBeVisible()
		await expect(page.getByRole('button', { name: 'Re-plan the rest of today' })).toBeVisible()
	})

	test('the preview shows the missed block moving into the time left, and applying stores it there', async ({
		secondaryPage: page,
	}) => {
		const now = await userClock(page)
		needRoom(now, 60, 40)
		const start = now.minutes - 60
		const activity = await rows.activity('apply')
		const blockId = await rows.block(now.isoDate, activity.id, start, start + 30)

		await openDayView(page, now.isoDate)
		await openFromBanner(page)

		// The text list: the block, why it moves, and from where to where.
		const row = dialogRow(page, activity.name)
		await expect(row).toContainText("didn't start")
		await expect(row).toContainText(clock(start))
		const slot = (await row.locator('strong').textContent())!.split('–')
		const previewStart = toMinutes({
			hours: Number(slot[0].split(':')[0]),
			minutes: Number(slot[0].split(':')[1]),
		})
		expect(previewStart).toBeGreaterThanOrEqual(now.minutes)

		// The before/after timelines draw the same block, further right after the move. They are decorative
		// (`aria-hidden`; the list above says the same in text), so they are read off the DOM.
		const [before, after] = await timelineLefts(page)
		expect(before).toHaveLength(1)
		expect(after).toHaveLength(1)
		expect(after[0]).toBeGreaterThan(before[0])

		expect(await clickApply(page)).toBe(200)
		await expect(replanDialog(page)).toBeHidden()
		await expect(page.getByText('The rest of today is re-planned.')).toBeVisible()

		const stored = await storedBlock(page, blockId)
		expect(toMinutes(stored.startTime)).toBe(previewStart)
		expect(toMinutes(stored.endTime)).toBe(previewStart + 30)
		expect(stored.status).toBe('NotStarted')
		// Nothing is missed any more, so the offer goes away.
		await expect(page.getByText(BANNER_TEXT)).toBeHidden()
	})

	test("what won't fit before bed time comes back to be decided: Tomorrow for a required block, Skip for an optional one", async ({
		secondaryPage: page,
	}) => {
		const now = await userClock(page)
		// Three missed half-hour blocks behind now; ahead, a fixed block leaves 49–59 minutes of free time
		// (it only shrinks while the test runs), which takes one of them and never two.
		needRoom(now, 100, 60)
		const fixedFrom = ceilTo(now.minutes, 10) + 50

		const fits = await rows.activity('fits')
		const required = await rows.activity('required')
		const optional = await rows.activity('optional')
		// An unavoidable activity's block holds its slot, even upcoming: the re-plan packs around it.
		const fixed = await rows.activity('fixed', { unavoidable: true })
		const fitsId = await rows.block(now.isoDate, fits.id, now.minutes - 100, now.minutes - 70)
		const requiredId = await rows.block(now.isoDate, required.id, now.minutes - 65, now.minutes - 35)
		const optionalId = await rows.block(now.isoDate, optional.id, now.minutes - 34, now.minutes - 4, {
			importanceId: await optionalImportanceId(page),
		})
		await rows.block(now.isoDate, fixed.id, fixedFrom, LAST_MINUTE)

		await openDayView(page, now.isoDate)
		await openFromBanner(page)

		await expect(dialogRow(page, fits.name)).toContainText("didn't start")
		const dialog = replanDialog(page)
		await expect(dialog.getByRole('heading', { name: 'No room left today' })).toBeVisible()
		// The required block defaults to tomorrow, the optional one (marked as such) to a skip.
		const requiredChoice = dialog.getByRole('group', { name: `What happens to ${required.name}` })
		await expect(requiredChoice.getByRole('button', { name: 'Tomorrow' })).toHaveAttribute('aria-pressed', 'true')
		await expect(dialogRow(page, optional.name)).toContainText('optional')
		const optionalChoice = dialog.getByRole('group', { name: `What happens to ${optional.name}` })
		await expect(optionalChoice.getByRole('button', { name: 'Skip' })).toHaveAttribute('aria-pressed', 'true')
		// The fixed block is neither moved nor offered.
		await expect(dialogRow(page, fixed.name)).toHaveCount(0)

		await requiredChoice.getByRole('button', { name: 'Tomorrow' }).click()
		expect(await clickApply(page)).toBe(200)
		await expect(dialog).toBeHidden()

		const moved = await storedBlock(page, fitsId)
		expect(toMinutes(moved.startTime)).toBeGreaterThanOrEqual(now.minutes)
		expect(toMinutes(moved.endTime)).toBeLessThanOrEqual(fixedFrom)

		// Tomorrow keeps the time of day.
		expect(await blockOnDay(page, now.isoDate, requiredId)).toBeUndefined()
		const tomorrow = await blockOnDay(page, now.tomorrowIsoDate, requiredId)
		expect(tomorrow, `the required block is not on ${now.tomorrowIsoDate}`).toBeDefined()
		expect(toMinutes(tomorrow!.startTime)).toBe(now.minutes - 65)
		expect(toMinutes(tomorrow!.endTime)).toBe(now.minutes - 35)

		// A skip is a cancel, for want of time.
		const skipped = await storedBlock(page, optionalId)
		expect(skipped.status).toBe('Cancelled')
		expect(skipped.skipReasonKey?.toLowerCase()).toBe('notime')
	})

	test('a preview the day has moved under is refused (409) and swapped for a fresh one', async ({
		secondaryPage: page,
	}) => {
		const now = await userClock(page)
		needRoom(now, 60, 40)
		const start = now.minutes - 60
		const activity = await rows.activity('stale')
		const blockId = await rows.block(now.isoDate, activity.id, start, start + 30)

		await openDayView(page, now.isoDate)
		await openFromBanner(page)
		const row = dialogRow(page, activity.name)
		await expect(row).toContainText(clock(start))

		// Another device moves the block between the preview and the apply. Still missed, at a new time.
		await moveBlock(page, blockId, start + 10, start + 40)

		expect(await clickApply(page)).toBe(409)
		const dialog = replanDialog(page)
		await expect(dialog.getByText('Your day changed since this preview, so here is a fresh one.')).toBeVisible()
		await expect(row).toContainText(clock(start + 10))
		// Nothing was written: the block is where the other device put it.
		const untouched = await storedBlock(page, blockId)
		expect(toMinutes(untouched.startTime)).toBe(start + 10)

		// The fresh preview applies.
		expect(await clickApply(page)).toBe(200)
		await expect(dialog).toBeHidden()
		expect(toMinutes((await storedBlock(page, blockId)).startTime)).toBeGreaterThanOrEqual(now.minutes)
	})
})

test.describe('Home offers the re-plan, and Move later finds free time (/)', () => {
	let rows: Rows

	test.beforeEach(async ({ secondaryPage: page }) => {
		rows = new Rows(page, 'Consulting')
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	async function openHome(page: Page, activityName: string) {
		await page.goto('/')
		// The plan arrives after the first paint.
		await page.locator('.planner-card').getByText(activityName).first().waitFor()
	}

	test("the now bar's missed mode and the planner card's header both offer it", async ({ secondaryPage: page }) => {
		const now = await userClock(page)
		needRoom(now, 60, 0)
		const activity = await rows.activity('home')
		await rows.block(now.isoDate, activity.id, now.minutes - 60, now.minutes - 30)

		await openHome(page, activity.name)
		const nowBar = page.locator('.nowbar--missed')
		const plannerCard = page.locator('.planner-card')

		for (const entry of [nowBar, plannerCard]) {
			await entry.getByRole('button', { name: 'Re-plan the rest of today' }).click()
			await expect(dialogRow(page, activity.name)).toContainText("didn't start")
			await replanDialog(page).getByRole('button', { name: 'Cancel' }).click()
			await expect(replanDialog(page)).toBeHidden()
		}
	})

	test('neither offers it while nothing has been missed', async ({ secondaryPage: page }) => {
		const now = await userClock(page)
		needRoom(now, 0, 60)
		const activity = await rows.activity('upcoming')
		await rows.block(now.isoDate, activity.id, now.minutes + 30, now.minutes + 60)

		await openHome(page, activity.name)
		await expect(page.getByRole('button', { name: 'Re-plan the rest of today' })).toHaveCount(0)
	})

	test('Move later lands a missed block after the next block, not on top of it', async ({ secondaryPage: page }) => {
		const now = await userClock(page)
		needRoom(now, 60, 100)
		const missed = await rows.activity('snoozed')
		const next = await rows.activity('next')
		const missedId = await rows.block(now.isoDate, missed.id, now.minutes - 60, now.minutes - 30)
		// Over now + 15, where the old plain shift would have put the snoozed block.
		await rows.block(now.isoDate, next.id, now.minutes + 10, now.minutes + 70)

		await openHome(page, missed.name)
		await page
			.locator('.planner-card')
			.getByRole('button', { name: `Actions for "${missed.name}"` })
			.click()
		const slotAsked = page.waitForResponse(r => r.url().includes('/next-free-slot'))
		const saved = page.waitForResponse(
			r => r.url().endsWith(`/api/planner-task/${missedId}`) && r.request().method() === 'PUT',
		)
		await page.getByText('+15m', { exact: true }).click()
		expect((await slotAsked).status()).toBe(200)
		expect((await saved).status()).toBe(200)

		const stored = await storedBlock(page, missedId)
		expect(toMinutes(stored.startTime)).toBe(now.minutes + 70)
		expect(toMinutes(stored.endTime)).toBe(now.minutes + 100)
	})
})

test.describe('Free time defaults for leisure and the to-do handoff (/leisure/pick, /todo-list/:id)', () => {
	let rows: Rows

	test.beforeEach(async ({ authenticatedPage: page }) => {
		rows = new Rows(page, 'Work')
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	/** The start a `next-free-slot` answer names, or null for none. */
	async function slotStart(response: import('@playwright/test').Response): Promise<number | null> {
		expect(response.status()).toBe(200)
		const { found, startTime } = (await response.json()) as { found: boolean; startTime: Hm | null }
		return found && startTime ? toMinutes(startTime) : null
	}

	test('leisure Plan it for later defaults after a block that covers its old guess', async ({
		authenticatedPage: page,
	}) => {
		await page.goto('/leisure/pick?minutes=60')
		// Three "Loading..." placeholders come first.
		const planLater = page.getByRole('button', { name: 'Plan for later' }).first()
		await planLater.waitFor()

		let now = await userClock(page)
		// The dialog's own guess is the next half hour at least 15 minutes out. Read the clock off a minute
		// that cannot roll it over before the dialog opens.
		if ((now.minutes + 15) % 30 === 0) {
			await expect.poll(async () => (await userClock(page)).minutes, { timeout: 65_000 }).not.toBe(now.minutes)
			now = await userClock(page)
		}
		const guess = ceilTo(now.minutes + 15, 30)
		// The slot is at most the hour asked for, and must fit after the block before midnight.
		test.skip(guess + 10 + 60 > LAST_MINUTE, `no room for an hour after ${clock(guess + 10)}`)

		const activity = await rows.activity('leisure')
		await rows.block(now.isoDate, activity.id, guess, guess + 10)

		const slotAsked = page.waitForResponse(r => r.url().includes('/next-free-slot'))
		await planLater.click()
		const slot = await slotStart(await slotAsked)
		expect(slot, 'the server found no free slot').not.toBeNull()
		expect(slot!).toBeGreaterThanOrEqual(guess + 10)

		const dialog = page.getByRole('dialog', { name: 'Plan for later' })
		await expect(dialog.getByRole('textbox', { name: 'Start' })).toHaveValue(clock(slot!))
		await dialog.getByRole('button', { name: 'Cancel' }).click()
	})

	test('the to-do handoff prefills its start after a block that covers now', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const now = await userClock(page)
		// The handoff searches from now rounded up to the start picker's 10-minute grid. A block from there for
		// 20 minutes covers that floor even if the minute rolls it on by one step before the dialog opens.
		const floor = ceilTo(now.minutes, 10)
		test.skip(floor + 20 + 30 > LAST_MINUTE, `no room for half an hour after ${clock(floor + 20)}`)

		const listId = await rows.list()
		const activity = await rows.activity('handoff')
		await rows.item(seed, listId, activity.id, 30)
		await rows.block(now.isoDate, activity.id, floor, floor + 20)

		await page.goto(`/todo-list/${listId}`)
		const menu = page.getByRole('button', { name: `More actions: ${activity.name}` })
		await menu.waitFor()
		await menu.click()
		const slotAsked = page.waitForResponse(r => r.url().includes('/next-free-slot'))
		await page.getByRole('button', { name: 'Add to planner' }).click()
		const slot = await slotStart(await slotAsked)
		expect(slot, 'the server found no free slot').not.toBeNull()
		expect(slot!).toBeGreaterThanOrEqual(floor + 20)

		// A closed "Add New Task" dialog can stay mounted beside the open one.
		const dialog = page.getByRole('dialog', { name: 'Add New Task' }).filter({ visible: true })
		// The picker rounds to its 10-minute grid; the block ends on it, so the slot does too.
		await expect(dialog.getByRole('textbox', { name: 'Start' })).toHaveValue(clock(ceilTo(slot!, 10)))
		await dialog.getByRole('button', { name: 'Cancel' }).click()
	})
})
