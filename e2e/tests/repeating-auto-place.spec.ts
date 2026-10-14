import type { Locator, Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * FO6 (`docs/feature-opportunities.md`): a repeating rule with "Put it on my plan automatically" places its own
 * block on today's and tomorrow's plan. The server side is `RepeatingTaskMaterialiser` (Planning), and these are the
 * rules it keeps, one `describe` each:
 * - the switch in `RepeatingTaskDialog` is what opts a rule in, and the block it places carries the `repeat` mark;
 * - a deleted occurrence never comes back (the rule's `MaterialisedThrough` watermark);
 * - a day marked away loses its **untouched** occurrence, and un-marking it brings nothing back;
 * - a read never deletes or carves the user's blocks. Since the planner lanes (backend `848877a`) an occurrence goes
 *   *beside* a block whenever that leaves at most two, in every conflict mode; only a would-be third falls back to the
 *   user's mode, with `Overwrite` read as `Ignore` and `MergeOverwrite` as `MergeIgnore`;
 * - editing the rule moves its untouched occurrences and leaves alone one the user moved.
 *
 * **It runs as the secondary account**, whose planner is empty (asserted in `beforeEach`), on the account's **real**
 * today and tomorrow: the materialiser works off the server's clock in the user's zone, so `page.clock` cannot stand in.
 * A run within a few minutes of midnight skips rather than straddle two "todays". Every rule and block is made on an
 * activity of its own and deleted with it afterwards: deleting the activity takes its rules and their occurrences
 * along, while deleting only the rule would leave today's and tomorrow's blocks behind.
 */

type Hm = { hours: number; minutes: number }
type Task = {
	id: number
	startTime: Hm
	endTime: Hm
	sourceRepeatingTaskId: number | null
	activity: { id: number } | null
}
type DayPlan = { calendar: { id: number; dayType: string } | null; tasks: Task[] }
type ConflictResolution = 'Ignore' | 'Overwrite' | 'MergeIgnore' | 'MergeOverwrite'

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
/** The day view's labels for the day types a test may need to restore through the Day Details dialog. */
const DAY_TYPE_LABEL: Record<string, string> = {
	Workday: 'Workday',
	Weekend: 'Weekend',
	Holiday: 'Holiday',
	Special: 'Special',
}

function hm(hhmm: string): Hm {
	const [hours, minutes] = hhmm.split(':').map(Number)
	return { hours, minutes }
}

function clock({ hours, minutes }: Hm): string {
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** `2026-10-14` → `14-10-2026`, the day view's route parameter. */
function routeDate(isoDate: string): string {
	const [year, month, day] = isoDate.split('-')
	return `${day}-${month}-${year}`
}

function addDays(isoDate: string, days: number): string {
	const date = new Date(`${isoDate}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + days)
	return date.toISOString().slice(0, 10)
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
		const name = `E2E FO6 ${label} ${this.tag}`
		const id = await this.post('activity', { name, text: '', isUnavoidable: false, roleId: role!.id })
		this.activityIds.push(id)
		return { id, name }
	}

	async block(isoDate: string, activityId: number, start: string, end: string): Promise<number> {
		return this.post('planner-task', {
			date: isoDate,
			startTime: hm(start),
			endTime: hm(end),
			isBackground: false,
			activityId,
			importanceId: null,
			location: null,
			notes: null,
			status: 'NotStarted',
		})
	}

	/** A daily rule that places itself. Creating it runs the materialiser for today and tomorrow straight away. */
	async rule(activityId: number, start: string, end: string): Promise<number> {
		return this.post('repeating-planner-task', {
			activityId,
			startTime: hm(start),
			endTime: hm(end),
			isBackground: false,
			location: null,
			notes: null,
			importanceId: await anyImportanceId(this.page),
			isActive: true,
			recurrenceType: 'DayOfWeek',
			scheduledDays: EVERY_DAY,
			scheduledDates: [],
			scheduledForDayTypes: [],
			activeFromDate: null,
			activeToDate: null,
			autoPlace: true,
		})
	}

	async cleanup() {
		for (const id of this.activityIds.splice(0)) await this.page.request.delete(`${apiUrl()}/api/activity/${id}`)
	}
}

async function anyImportanceId(page: Page): Promise<number> {
	const response = await page.request.get(`${apiUrl()}/api/task-importance`)
	expect(response.ok()).toBe(true)
	const importances = (await response.json()) as { id: number }[]
	expect(importances.length, 'the secondary account has no task importance to attach').toBeGreaterThan(0)
	return importances[0].id
}

/** The day as home reads it. The read is itself what places a due occurrence, as on the real screen. */
async function dayPlan(page: Page, isoDate: string): Promise<DayPlan> {
	const response = await page.request.get(`${apiUrl()}/api/calendar/day-plan/${isoDate}`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as DayPlan
}

/** `[start, end]` of every block of `activityId` on the day, as `HH:MM` pairs. */
async function spansOf(page: Page, isoDate: string, activityId: number): Promise<string[][]> {
	return (await dayPlan(page, isoDate)).tasks
		.filter(task => task.activity?.id === activityId)
		.map(task => [clock(task.startTime), clock(task.endTime)])
}

async function occurrencesOf(page: Page, isoDate: string, ruleId: number): Promise<Task[]> {
	return (await dayPlan(page, isoDate)).tasks.filter(task => task.sourceRepeatingTaskId === ruleId)
}

async function serverTimeZone(page: Page): Promise<string> {
	const response = await page.request.get(`${apiUrl()}/api/user/data`)
	expect(response.ok()).toBe(true)
	return ((await response.json()) as { timezone: string }).timezone
}

/**
 * Today in the account's zone, as the materialiser judges it. The app moves the server's copy of the zone to the
 * browser's on hydration, so that is waited for first (the same as `planner-lanes.spec.ts`).
 */
async function userToday(page: Page): Promise<{ isoDate: string; minutes: number }> {
	await page.goto('/')
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

async function openDay(page: Page, isoDate: string) {
	await page.goto(`/day-planner/${routeDate(isoDate)}`)
	await page.getByRole('group', { name: /^Time grid/ }).waitFor()
}

/** A day-view block by its accessible name, which starts with the activity and its times. */
function blockNamed(page: Page, name: string, start?: string, end?: string): Locator {
	const times = start && end ? `, ${start} to ${end}` : ','
	return page.getByRole('button', { name: new RegExp(`^${escapeRegex(name)}${times}`) })
}

async function plannerSettings(page: Page): Promise<Record<string, unknown>> {
	const response = await page.request.get(`${apiUrl()}/api/planner/settings`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as Record<string, unknown>
}

async function putPlannerSettings(page: Page, settings: Record<string, unknown>) {
	const response = await page.request.put(`${apiUrl()}/api/planner/settings`, { data: settings })
	expect(response.ok(), `PUT planner/settings: ${response.status()} ${await response.text()}`).toBe(true)
}

async function setDayType(page: Page, calendarId: number, dayType: string) {
	const response = await page.request.patch(`${apiUrl()}/api/calendar/day-type/batch`, {
		data: { calendarIds: [calendarId], dayType },
	})
	expect(response.ok(), `day-type batch: ${response.status()} ${await response.text()}`).toBe(true)
}

/** The From/To pair of `TimeRangePicker`, switched out of its duration mode if it opened in it. */
async function setRuleSpan(dialog: Locator, from: string, to: string) {
	// In duration mode a new start keeps the old *end*, so the span silently wraps past midnight and the server
	// refuses it ("StartTime must be before EndTime"). The range mode sets both ends as typed.
	const toRange = dialog.getByRole('button', { name: 'Switch to time range' })
	if (await toRange.isVisible()) await toRange.click()
	const toField = dialog.getByRole('textbox', { name: 'To' })
	await toField.fill(to)
	await toField.press('Tab')
	const fromField = dialog.getByRole('textbox', { name: 'From' })
	await fromField.fill(from)
	await fromField.press('Tab')
}

test.describe('Repeating tasks that put themselves on the plan (FO6)', () => {
	let rows: Rows
	let today: string
	let tomorrow: string

	test.beforeEach(async ({ secondaryPage: page }) => {
		rows = new Rows(page)
		const now = await userToday(page)
		test.skip(
			now.minutes > 24 * 60 - 15,
			`too close to midnight for "today" to hold for the test (${now.minutes} min)`,
		)
		today = now.isoDate
		tomorrow = addDays(today, 1)
		for (const day of [today, tomorrow]) {
			expect((await dayPlan(page, day)).tasks, `the secondary account's ${day} is not empty`).toHaveLength(0)
		}
	})

	test.afterEach(async () => {
		await rows.cleanup()
	})

	test.describe('The switch (/day-planner/settings — Repeating Tasks)', () => {
		test('a daily rule saved with the switch on is on today and tomorrow, with the repeat mark', async ({
			secondaryPage: page,
		}) => {
			const activity = await rows.activity('Switch')

			const list = page.waitForResponse(
				response =>
					response.request().method() === 'GET' && /\/api\/repeating-planner-task$/.test(response.url()),
			)
			await page.goto('/day-planner/settings')
			await list
			await page.getByRole('button', { name: 'Add' }).click()
			const dialog = page.getByRole('dialog', { name: 'New Repeating Task' })

			await dialog.getByRole('combobox', { name: '* Activity' }).fill(activity.name)
			await page.getByRole('option', { name: activity.name }).click()
			await setRuleSpan(dialog, '18:00', '18:30')
			await dialog.locator('.v-select').filter({ hasText: 'Importance' }).locator('.v-field__input').click()
			// Scoped to the select's list: the sidebar's items are options too.
			await page.getByRole('listbox', { name: '* Importance' }).getByRole('option').first().click()
			for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
				await dialog.getByRole('button', { name: day, exact: true }).click()
			}
			const autoPlace = dialog.getByRole('checkbox', { name: 'Put it on my plan automatically' })
			await expect(autoPlace).not.toBeChecked()
			await autoPlace.check()

			const created = page.waitForResponse(
				response =>
					response.request().method() === 'POST' && /\/api\/repeating-planner-task$/.test(response.url()),
			)
			await dialog.getByRole('button', { name: 'Confirm' }).click()
			const response = await created
			expect(response.status(), await response.text()).toBe(201)
			expect(response.request().postDataJSON()).toMatchObject({ autoPlace: true, scheduledDays: EVERY_DAY })
			const ruleId = Number(await response.json())

			for (const day of [today, tomorrow]) {
				const occurrences = await occurrencesOf(page, day, ruleId)
				expect(
					occurrences.map(t => [clock(t.startTime), clock(t.endTime)]),
					`occurrences on ${day}`,
				).toEqual([['18:00', '18:30']])
			}

			await page.goto('/')
			await expect(page.locator('.planner-card').getByText(activity.name, { exact: true })).toBeVisible()

			await openDay(page, today)
			const block = blockNamed(page, activity.name, '18:00', '18:30')
			await expect(block).toHaveAccessibleName(/placed by a repeating task/)
			const mark = block.locator('.from-template-mark')
			await expect(mark.locator('svg[data-icon="repeat"]')).toBeAttached()
			await mark.hover()
			await expect(page.getByText('Repeating task — it put itself on the plan')).toBeVisible()
		})
	})

	test.describe('Delete stays deleted (/day-planner/:date, /)', () => {
		test('an occurrence deleted from the day view does not come back on the next reads', async ({
			secondaryPage: page,
		}) => {
			const activity = await rows.activity('Deleted')
			const ruleId = await rows.rule(activity.id, '18:00', '18:30')
			const [occurrence] = await occurrencesOf(page, today, ruleId)
			expect(occurrence, 'the rule placed nothing on today').toBeDefined()

			await openDay(page, today)
			await blockNamed(page, activity.name, '18:00', '18:30').click()
			await page.getByRole('button', { name: 'Delete', exact: true }).click()
			const deleted = page.waitForResponse(
				response =>
					response.request().method() === 'DELETE' &&
					response.url().endsWith(`/api/planner-task/${occurrence.id}`),
			)
			await page
				.getByRole('dialog', { name: 'Delete confirmation' })
				.getByRole('button', { name: 'Confirm' })
				.click()
			expect((await deleted).status()).toBe(204)

			// Each of these reads runs the materialiser for today and tomorrow. Today is decided, so none re-places it.
			await openDay(page, today)
			await expect(blockNamed(page, activity.name)).toHaveCount(0)

			const homePlan = page.waitForResponse('**/api/calendar/day-plan/**')
			await page.goto('/')
			await homePlan
			await expect(page.locator('.planner-card')).toBeVisible()
			await expect(page.locator('.planner-card').getByText(activity.name, { exact: true })).toHaveCount(0)

			expect(await occurrencesOf(page, today, ruleId)).toHaveLength(0)
			// Only the deleted one is gone.
			expect(await occurrencesOf(page, tomorrow, ruleId)).toHaveLength(1)
		})
	})

	test.describe('Away tomorrow (/day-planner/:date — Day Details)', () => {
		let calendarId: number | null = null
		let originalDayType: string | null = null

		test.afterEach(async ({ secondaryPage: page }) => {
			if (calendarId != null && originalDayType != null) await setDayType(page, calendarId, originalDayType)
			calendarId = null
			originalDayType = null
		})

		async function pickDayType(page: Page, label: string) {
			await page.getByRole('button', { name: 'Edit', exact: true }).click()
			const dialog = page.getByRole('dialog', { name: 'Day Details' })
			await dialog.locator('.v-select').filter({ hasText: 'Day Type' }).locator('.v-field__input').click()
			await page.getByRole('option', { name: label, exact: true }).click()
			const saved = page.waitForResponse(
				response =>
					response.request().method() === 'PUT' && response.url().endsWith(`/api/calendar/${calendarId}`),
			)
			await dialog.getByRole('button', { name: 'Confirm' }).click()
			expect((await saved).ok()).toBe(true)
		}

		test('marking tomorrow a sick day removes its occurrence, and marking it back does not return it', async ({
			secondaryPage: page,
		}) => {
			const activity = await rows.activity('Away')
			const ruleId = await rows.rule(activity.id, '18:00', '18:30')
			const plan = await dayPlan(page, tomorrow)
			expect(plan.calendar, 'tomorrow has no calendar row').not.toBeNull()
			test.skip(!(plan.calendar!.dayType in DAY_TYPE_LABEL), `tomorrow is already ${plan.calendar!.dayType}`)
			calendarId = plan.calendar!.id
			originalDayType = plan.calendar!.dayType
			expect(await occurrencesOf(page, tomorrow, ruleId)).toHaveLength(1)

			await openDay(page, tomorrow)
			await expect(blockNamed(page, activity.name, '18:00', '18:30')).toBeVisible()
			await pickDayType(page, 'Sick day')

			// `AwayDayOccurrenceWithdrawalHandler` takes the untouched occurrence with the day-type change.
			await openDay(page, tomorrow)
			await expect(blockNamed(page, activity.name)).toHaveCount(0)
			expect(await occurrencesOf(page, tomorrow, ruleId)).toHaveLength(0)

			// The day stays decided, so a workday again brings nothing back.
			await pickDayType(page, DAY_TYPE_LABEL[originalDayType])
			await openDay(page, tomorrow)
			await expect(blockNamed(page, activity.name)).toHaveCount(0)
			expect(await occurrencesOf(page, tomorrow, ruleId)).toHaveLength(0)
			// Today was never away, and keeps its own.
			expect(await occurrencesOf(page, today, ruleId)).toHaveLength(1)
		})
	})

	test.describe('Your block wins (/day-planner/:date, planner setting "Default conflict resolution")', () => {
		let originalSettings: Record<string, unknown> | null = null

		async function useConflictResolution(page: Page, mode: ConflictResolution) {
			originalSettings ??= await plannerSettings(page)
			await putPlannerSettings(page, { ...originalSettings, defaultConflictResolution: mode })
		}

		test.afterEach(async ({ secondaryPage: page }) => {
			if (originalSettings) await putPlannerSettings(page, originalSettings)
			originalSettings = null
		})

		test('under Overwrite, the occurrence goes beside your block, and your block keeps its time', async ({
			secondaryPage: page,
		}) => {
			await useConflictResolution(page, 'Overwrite')
			const mine = await rows.activity('Mine')
			await rows.block(tomorrow, mine.id, '18:00', '19:00')
			const rule = await rows.activity('Beside')
			await rows.rule(rule.id, '18:00', '18:30')

			expect(await spansOf(page, tomorrow, mine.id)).toEqual([['18:00', '19:00']])
			expect(await spansOf(page, tomorrow, rule.id)).toEqual([['18:00', '18:30']])

			await openDay(page, tomorrow)
			await expect(blockNamed(page, rule.name, '18:00', '18:30')).toHaveAccessibleName(
				new RegExp(`side by side with ${escapeRegex(mine.name)}`),
			)
			await expect(blockNamed(page, mine.name, '18:00', '19:00')).toBeVisible()
			await expect(page.locator('.lane-clash')).toHaveCount(0)
		})

		test('under Overwrite, an occurrence that would be a third is skipped, and your two blocks are untouched', async ({
			secondaryPage: page,
		}) => {
			await useConflictResolution(page, 'Overwrite')
			const first = await rows.activity('First')
			const second = await rows.activity('Second')
			await rows.block(tomorrow, first.id, '18:00', '19:00')
			await rows.block(tomorrow, second.id, '18:00', '19:00')
			const rule = await rows.activity('Third')
			await rows.rule(rule.id, '18:00', '18:30')

			// A template apply under Overwrite would have deleted both; a read reads it as Ignore.
			expect(await spansOf(page, tomorrow, first.id)).toEqual([['18:00', '19:00']])
			expect(await spansOf(page, tomorrow, second.id)).toEqual([['18:00', '19:00']])
			expect(await spansOf(page, tomorrow, rule.id)).toEqual([])
			// The rule did run: today had room.
			expect(await spansOf(page, today, rule.id)).toEqual([['18:00', '18:30']])

			await openDay(page, tomorrow)
			await expect(blockNamed(page, first.name, '18:00', '19:00')).toHaveAccessibleName(
				new RegExp(`side by side with ${escapeRegex(second.name)}`),
			)
			await expect(blockNamed(page, rule.name)).toHaveCount(0)
			await expect(page.locator('.lane-clash')).toHaveCount(0)
		})

		test('under Merge overwrite, the occurrence is cut to the minutes with a free lane, and yours are not', async ({
			secondaryPage: page,
		}) => {
			await useConflictResolution(page, 'MergeOverwrite')
			const first = await rows.activity('First')
			const second = await rows.activity('Second')
			await rows.block(tomorrow, first.id, '18:00', '18:30')
			await rows.block(tomorrow, second.id, '18:00', '18:30')
			const rule = await rows.activity('Merged')
			await rows.rule(rule.id, '18:00', '19:00')

			expect(await spansOf(page, tomorrow, first.id)).toEqual([['18:00', '18:30']])
			expect(await spansOf(page, tomorrow, second.id)).toEqual([['18:00', '18:30']])
			expect(await spansOf(page, tomorrow, rule.id)).toEqual([['18:30', '19:00']])

			await openDay(page, tomorrow)
			await expect(blockNamed(page, rule.name, '18:30', '19:00')).toBeVisible()
			await expect(page.locator('.lane-clash')).toHaveCount(0)
		})
	})

	test.describe('Editing the rule (/day-planner/settings — Repeating Tasks)', () => {
		test('moves its untouched occurrence to the new time and leaves the one you moved', async ({
			secondaryPage: page,
		}) => {
			const activity = await rows.activity('Edited')
			const ruleId = await rows.rule(activity.id, '18:00', '18:30')
			const [moved] = await occurrencesOf(page, today, ruleId)
			const [untouched] = await occurrencesOf(page, tomorrow, ruleId)
			expect(moved && untouched, 'the rule did not place on both days').toBeTruthy()

			// The span PATCH is the request a drag on the day grid sends.
			const move = await page.request.patch(`${apiUrl()}/api/planner-task/${moved.id}`, {
				data: { startTime: hm('20:00'), endTime: hm('20:30') },
			})
			expect(move.ok(), `moving today's occurrence: ${move.status()}`).toBe(true)

			const list = page.waitForResponse(
				response =>
					response.request().method() === 'GET' && /\/api\/repeating-planner-task$/.test(response.url()),
			)
			await page.goto('/day-planner/settings')
			await list
			await page.getByRole('row').filter({ hasText: activity.name }).getByRole('button', { name: 'Edit' }).click()
			const dialog = page.getByRole('dialog', { name: 'Edit Repeating Task' })
			// The rule's activity is prefilled. It used to open empty, and Confirm stopped on "This field is required".
			await expect(dialog.getByRole('textbox', { name: '* Name' })).toHaveValue(activity.name)
			await expect(dialog.getByRole('checkbox', { name: 'Put it on my plan automatically' })).toBeChecked()
			await setRuleSpan(dialog, '19:00', '19:30')

			const saved = page.waitForResponse(
				response =>
					response.request().method() === 'PUT' &&
					response.url().endsWith(`/api/repeating-planner-task/${ruleId}`),
			)
			await dialog.getByRole('button', { name: 'Confirm' }).click()
			expect((await saved).ok()).toBe(true)

			const [tomorrows] = await occurrencesOf(page, tomorrow, ruleId)
			expect(tomorrows.id, 'the untouched occurrence was replaced, not moved').toBe(untouched.id)
			expect([clock(tomorrows.startTime), clock(tomorrows.endTime)]).toEqual(['19:00', '19:30'])
			const [todays] = await occurrencesOf(page, today, ruleId)
			expect([clock(todays.startTime), clock(todays.endTime)]).toEqual(['20:00', '20:30'])

			await openDay(page, tomorrow)
			await expect(blockNamed(page, activity.name, '19:00', '19:30')).toBeVisible()
			await openDay(page, today)
			await expect(blockNamed(page, activity.name, '20:00', '20:30')).toBeVisible()
		})
	})
})
