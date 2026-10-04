import type { Page } from '@playwright/test'
import { apiUrl, expect, seedDateParam, test } from '../fixtures/auth'
import type { SeedResponse } from '../fixtures/auth'

/**
 * OP10 (`docs/opportunities.md`): a repeating task's rule as one line ("every Mon, Wed · until 30.11."),
 * in the settings table's *Schedule* column and as the caption under each planner suggestion.
 *
 * Two server-side facts ride along, because the line would lie without them:
 * - the suggestions endpoint bounds **every** recurrence type by the active window, not only DateRange.
 *   Before OP10 an ended weekly rule kept being suggested, captioned "… · until <yesterday>";
 * - the *Active* switch sends the whole rule to the full-replace PUT. It used to send `{ isActive }`
 *   alone, which the validator rejected for its missing activity and importance.
 *
 * The fixture seeds no repeating tasks, so every rule here is created through the API, marked by its
 * `notes`, and deleted before and after each test (CLAUDE.md, *Mutating specs* 1).
 */
test.describe.configure({ mode: 'serial' })

const MARKER = 'E2E OP10'
const RULE_URL = () => `${apiUrl()}/api/repeating-planner-task`

type Rule = {
	activityId: number
	recurrenceType: 'DayOfWeek' | 'DayOfMonth' | 'DateRange' | 'DayType'
	scheduledDays?: string[]
	scheduledDates?: number[]
	scheduledForDayTypes?: string[]
	activeFromDate?: string | null
	activeToDate?: string | null
}

type StoredRule = {
	id: number
	notes: string | null
	isActive: boolean
	activeFromDate: string | null
	activeToDate: string | null
	importance: { id: number } | null
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** `yyyy-MM-dd`, offset from the seed date, the shape the API takes for `activeFromDate` / `activeToDate`. */
function seedIsoDate(seed: SeedResponse, dayOffset = 0): string {
	const [dd, mm, yyyy] = seedDateParam(seed, dayOffset).split('-')
	return `${yyyy}-${mm}-${dd}`
}

function seedYear(seed: SeedResponse): number {
	return Number(seed.seedDateUtc.slice(0, 4))
}

/**
 * The caption's date: `DD.MM.`, plus the year only when it is not the current one. "Current" is the
 * browser's year in the app; the seed year stands in for it here, so a run is only wrong on a seed
 * taken on 31 Dec and run on 1 Jan.
 */
function captionDate(seed: SeedResponse, iso: string): string {
	const [yyyy, mm, dd] = iso.split('-')
	return Number(yyyy) === seedYear(seed) ? `${dd}.${mm}.` : `${dd}.${mm}.${yyyy}`
}

function weekdayOf(seed: SeedResponse, dayOffset: number) {
	const day = new Date(`${seedIsoDate(seed, dayOffset)}T00:00:00Z`).getUTCDay()
	return { name: WEEKDAY_NAMES[day], short: WEEKDAY_SHORT[day] }
}

async function createRule(page: Page, rule: Rule): Promise<number> {
	const response = await page.request.post(RULE_URL(), {
		data: {
			startTime: { hours: 18, minutes: 0 },
			endTime: { hours: 18, minutes: 30 },
			isBackground: false,
			location: null,
			notes: MARKER,
			// Required by the validator, on create and on the full-replace update alike.
			importanceId: await anyImportanceId(page),
			isActive: true,
			scheduledDays: [],
			scheduledDates: [],
			scheduledForDayTypes: [],
			activeFromDate: null,
			activeToDate: null,
			...rule,
		},
	})
	expect(response.ok(), `could not create the rule: ${response.status()} ${await response.text()}`).toBe(true)
	const body = await response.json()
	return typeof body === 'number' ? body : Number(body.id)
}

async function storedRule(page: Page, id: number): Promise<StoredRule> {
	const response = await page.request.get(`${RULE_URL()}/${id}`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as StoredRule
}

async function removeMarkedRules(page: Page) {
	const response = await page.request.get(RULE_URL())
	expect(response.ok()).toBe(true)
	for (const { id, notes } of (await response.json()) as StoredRule[]) {
		if (notes === MARKER) await page.request.delete(`${RULE_URL()}/${id}`)
	}
}

async function anyImportanceId(page: Page): Promise<number> {
	const response = await page.request.get(`${apiUrl()}/api/task-importance`)
	expect(response.ok()).toBe(true)
	const importances = (await response.json()) as { id: number }[]
	expect(importances.length, 'the seed account has no task importance to attach').toBeGreaterThan(0)
	return importances[0].id
}

async function openRepeatingTab(page: Page) {
	const list = page.waitForResponse(
		response => response.request().method() === 'GET' && /\/api\/repeating-planner-task$/.test(response.url()),
	)
	await page.goto('/day-planner/settings')
	await list
}

test.beforeEach(async ({ authenticatedPage }) => {
	await removeMarkedRules(authenticatedPage)
})

test.afterEach(async ({ authenticatedPage }) => {
	await removeMarkedRules(authenticatedPage)
})

test.describe('Schedule column (/day-planner/settings — Repeating Tasks)', () => {
	test('each recurrence type reads as one line, with its window', async ({ authenticatedPage: page, seed }) => {
		const year = seedYear(seed)
		const { activities } = seed
		await createRule(page, {
			activityId: activities.bugFixing,
			recurrenceType: 'DayOfWeek',
			// Out of order on purpose: the line lists days Monday first.
			scheduledDays: ['Wednesday', 'Monday'],
			activeToDate: `${year}-11-30`,
		})
		await createRule(page, {
			activityId: activities.featureDevelopment,
			recurrenceType: 'DayOfWeek',
			scheduledDays: ['Sunday', 'Saturday'],
		})
		await createRule(page, {
			activityId: activities.readANovel,
			recurrenceType: 'DayOfWeek',
			scheduledDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
			activeFromDate: '2099-03-01',
		})
		await createRule(page, {
			activityId: activities.codeReview,
			recurrenceType: 'DayOfMonth',
			scheduledDates: [15, 4],
		})
		await createRule(page, {
			activityId: activities.groceryShopping,
			recurrenceType: 'DayType',
			scheduledForDayTypes: ['Weekend', 'Workday'],
		})
		await createRule(page, {
			activityId: activities.mealPreparation,
			recurrenceType: 'DateRange',
			activeFromDate: `${year}-10-01`,
			activeToDate: '2099-01-15',
		})

		await openRepeatingTab(page)
		for (const line of [
			'every Mon, Wed · until 30.11.',
			'on weekends',
			'on weekdays · from 01.03.2099',
			'days 4, 15 of each month',
			'on Workday, Weekend days',
			// The year shows only when it is not the current one.
			'01.10. – 15.01.2099',
		]) {
			await expect(page.getByRole('cell', { name: line, exact: true })).toBeVisible()
		}
	})

	test('the Active switch sends the whole rule, and a paused rule is dimmed but its switch is not', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const year = seedYear(seed)
		const importanceId = await anyImportanceId(page)
		const id = await createRule(page, {
			activityId: seed.activities.buildABookshelf,
			recurrenceType: 'DayOfWeek',
			scheduledDays: ['Tuesday'],
			activeFromDate: `${year}-01-01`,
			activeToDate: '2099-12-31',
		})

		await openRepeatingTab(page)
		const schedule = page.getByRole('cell', { name: 'every Tue · 01.01. – 31.12.2099', exact: true })
		await expect(schedule).toBeVisible()
		const row = page.getByRole('row').filter({ has: schedule })
		const toggle = row.locator('input[type="checkbox"]')
		await expect(toggle).toBeChecked()
		await expect(schedule.locator('span')).not.toHaveCSS('opacity', '0.5')

		const put = page.waitForResponse(
			response => response.request().method() === 'PUT' && response.url().endsWith(`/api/repeating-planner-task/${id}`),
		)
		await toggle.click()
		const response = await put
		// Before OP10 the body was `{ isActive: false }` alone, and the server answered 400.
		expect(response.ok(), `PUT failed: ${response.status()}`).toBe(true)
		expect(response.request().postDataJSON()).toMatchObject({
			activityId: seed.activities.buildABookshelf,
			importanceId,
			isActive: false,
			recurrenceType: 'DayOfWeek',
			scheduledDays: ['Tuesday'],
			activeFromDate: `${year}-01-01`,
			activeToDate: '2099-12-31',
		})

		expect(await storedRule(page, id)).toMatchObject({
			isActive: false,
			activeFromDate: `${year}-01-01`,
			activeToDate: '2099-12-31',
			importance: { id: importanceId },
		})

		await expect(toggle).not.toBeChecked()
		await expect(schedule.locator('span')).toHaveCSS('opacity', '0.5')
		// The switch is how a paused rule comes back, so it stays at full strength.
		await expect(row.locator('.v-switch')).toHaveCSS('opacity', '1')

		await toggle.click()
		await expect(toggle).toBeChecked()
		await expect(schedule.locator('span')).not.toHaveCSS('opacity', '0.5')
		expect((await storedRule(page, id)).isActive).toBe(true)
	})
})

test.describe('Suggestion captions (/day-planner/:date — Suggestions)', () => {
	/**
	 * Seed + 2 has a calendar row and no planner tasks, so no activity is "already on the day" and every
	 * matching rule is suggested.
	 */
	const DAY_OFFSET = 2

	test('a matching rule says why it is suggested; an ended or future window is not suggested', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const day = weekdayOf(seed, DAY_OFFSET)
		const until = seedIsoDate(seed, DAY_OFFSET + 30)
		const matching = await createRule(page, {
			activityId: seed.activities.bugFixing,
			recurrenceType: 'DayOfWeek',
			scheduledDays: [day.name],
			activeToDate: until,
		})
		const ended = await createRule(page, {
			activityId: seed.activities.featureDevelopment,
			recurrenceType: 'DayOfWeek',
			scheduledDays: [day.name],
			activeToDate: seedIsoDate(seed, DAY_OFFSET - 1),
		})
		const future = await createRule(page, {
			activityId: seed.activities.codeReview,
			recurrenceType: 'DayOfWeek',
			scheduledDays: [day.name],
			activeFromDate: seedIsoDate(seed, DAY_OFFSET + 1),
		})

		const suggestions = page.waitForResponse('**/api/repeating-planner-task/suggestions/**')
		await page.goto(`/day-planner/${seedDateParam(seed, DAY_OFFSET)}`)
		const body = (await (await suggestions).json()) as { repeatingPlannerTaskId: number | null }[]
		const suggestedIds = body.map(s => s.repeatingPlannerTaskId)
		expect(suggestedIds).toContain(matching)
		await expect(page.getByText(`every ${day.short} · until ${captionDate(seed, until)}`, { exact: true })).toBeVisible()

		// The window bounds a weekly rule too. Before OP10 both of these were suggested, and the ended one
		// was captioned "… · until <yesterday>". A failure here on a fresh checkout means the running API
		// predates the fix: it is a query change, so a restart picks it up.
		expect(suggestedIds).not.toContain(ended)
		expect(suggestedIds).not.toContain(future)
	})

	test('a pattern suggestion names its weekday and how often it was seen', async ({ authenticatedPage: page, seed }) => {
		const day = weekdayOf(seed, DAY_OFFSET)
		// The pattern views are refreshed by a host job, so whether the seed account has a pattern for this
		// weekday is not a fixture fact. One is appended on the wire, built off a real rule's activity.
		await createRule(page, {
			activityId: seed.activities.bugFixing,
			recurrenceType: 'DayOfWeek',
			scheduledDays: [day.name],
		})
		await page.route('**/api/repeating-planner-task/suggestions/**', async route => {
			const response = await route.fetch()
			const body = (await response.json()) as Record<string, unknown>[]
			const userSet = body.find(s => s.repeatingPlannerTaskId != null)
			if (userSet) {
				body.push({
					...userSet,
					repeatingPlannerTaskId: null,
					importance: null,
					startTime: { hours: 6, minutes: 15 },
					endTime: { hours: 6, minutes: 45 },
					notes: null,
					activeFromDate: null,
					activeToDate: null,
					sourceType: 'PlannedPattern',
					occurrenceCount: 4,
				})
			}
			await route.fulfill({ response, json: body })
		})

		await page.goto(`/day-planner/${seedDateParam(seed, DAY_OFFSET)}`)
		// The user-set rule has no window, so its caption is the weekday alone.
		await expect(page.getByText(`every ${day.short}`, { exact: true })).toBeVisible()
		// The count used to sit on the time line; it now follows the rule.
		await expect(page.getByText(`every ${day.short} · seen 4×`, { exact: true })).toBeVisible()
		await expect(page.getByText('06:15 – 06:45', { exact: true })).toBeVisible()
	})
})
