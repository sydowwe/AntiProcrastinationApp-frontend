import type { Page } from '@playwright/test'
import { apiUrl, expect, test, type SeedResponse } from '../fixtures/auth'

/**
 * F2-07 (FO8): the timer setups offer "Try 10m", a focus length that usually works for the chosen activity, from
 * how its recent timer sessions ended (`GET /activity-history/session/fit`). The chip shows only when the offer is
 * shorter than what is set, or when nothing is set, and one tap sets the length.
 *
 * Mutating, so nothing here touches a fixture row (CLAUDE.md, *Mutating specs* 1). Each test makes two fresh
 * activities. One gets F2-07's moment through `POST /activity-history/session`: five countdowns set to 25 minutes
 * and stopped around minute 12, and one that ran its 25. The other gets no sessions. All of it is deleted again
 * afterwards, the rows first (a session goes with its last row), then the activities.
 *
 * The sessions sit on the days before the seed day. Logging publishes `ActivityTimeRecordedEvent` for each of them
 * (FO2), and a fresh activity has no planner block or item there to complete.
 */

const FITTED = 'E2E focus fit'
const UNTIMED = 'E2E focus untimed'

interface Created {
	activityIds: number[]
	historyIds: number[]
}

async function post(page: Page, path: string, data: unknown): Promise<unknown> {
	const response = await page.request.post(`${apiUrl()}/api/${path}`, { data })
	expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	return response.json()
}

/** 13:00 UTC, `daysBack` days before the seed day. */
function pastDay(seed: SeedResponse, daysBack: number): string {
	const d = new Date(`${seed.seedDateUtc}T13:00:00Z`)
	d.setUTCDate(d.getUTCDate() - daysBack)
	return d.toISOString()
}

/** Minutes each countdown ran and how it ended. 70% of them reach 10 minutes; only one reaches 15. */
const RUNS: [minutes: number, outcome: 'StoppedEarly' | 'Completed'][] = [
	[12, 'StoppedEarly'],
	[12, 'StoppedEarly'],
	[13, 'StoppedEarly'],
	[11, 'StoppedEarly'],
	[12, 'StoppedEarly'],
	[25, 'Completed'],
]

async function createFixtures(page: Page, seed: SeedResponse): Promise<Created> {
	const created: Created = { activityIds: [], historyIds: [] }
	const role = await page.request.get(`${apiUrl()}/api/activity/${seed.activities.bugFixing}`)
	expect(role.ok()).toBe(true)
	const roleId = (await role.json()).role.id

	for (const name of [FITTED, UNTIMED]) {
		created.activityIds.push(Number(await post(page, 'activity', { name, text: '', isUnavoidable: false, roleId })))
	}

	for (const [index, [minutes, outcome]] of RUNS.entries()) {
		const session = (await post(page, 'activity-history/session', {
			kind: 'Timer',
			outcome,
			plannedFocusPeriods: null,
			completedFocusPeriods: null,
			plannedLength: { hours: 0, minutes: 25 },
			records: [
				{
					activityId: created.activityIds[0],
					startTimestamp: pastDay(seed, index + 1),
					length: { hours: 0, minutes },
					phase: null,
				},
			],
			todoListItemId: null,
			routineTodoListId: null,
		})) as { recordIds: number[] }
		created.historyIds.push(...session.recordIds)
	}
	return created
}

async function removeFixtures(page: Page, created: Created) {
	const paths = [
		...created.historyIds.map(id => `activity-history/${id}`),
		...created.activityIds.map(id => `activity/${id}`),
	]
	for (const path of paths) {
		const response = await page.request.delete(`${apiUrl()}/api/${path}`)
		expect(response.ok(), `cleanup DELETE ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	}
}

/**
 * Picks the activity in the setup's required activity field. `exact`: the Pomodoro view also has an optional rest
 * "Activity" field.
 */
async function chooseActivity(page: Page, name: string) {
	await page.getByRole('combobox', { name: '* Activity', exact: true }).fill(name)
	await page.getByRole('option', { name, exact: true }).click()
}

test.describe('Focus length offer (/activity-history/timer, /activity-history/pomodoro — activities built for the test)', () => {
	let created: Created = { activityIds: [], historyIds: [] }

	test.beforeEach(async ({ authenticatedPage, seed }, testInfo) => {
		testInfo.setTimeout(60_000)
		created = await createFixtures(authenticatedPage, seed)
	})

	test.afterEach(async ({ authenticatedPage }) => {
		await removeFixtures(authenticatedPage, created)
		created = { activityIds: [], historyIds: [] }
	})

	test('the countdown offers the length usually reached, and one tap sets it', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/timer')
		await chooseActivity(authenticatedPage, FITTED)

		const chip = authenticatedPage.getByRole('button', { name: 'Try 10m' })
		await chip.hover()
		await expect(
			authenticatedPage.getByText("That's the length that usually works for this, going by its recent timers"),
		).toBeVisible()

		await chip.click()
		await expect(authenticatedPage.getByRole('textbox', { name: 'Length' })).toHaveValue('00:10')
		// 10m is now what is set, so there is nothing shorter left to offer.
		await expect(chip).toHaveCount(0)
	})

	test('the Pomodoro offer sets the focus length only', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/pomodoro')
		await chooseActivity(authenticatedPage, FITTED)

		// The duration cards are a label beside an unnamed time field.
		const card = (label: string) =>
			authenticatedPage.locator('#app').getByText(label, { exact: true }).locator('xpath=..').getByRole('textbox')
		await expect(card('Focus')).toHaveValue('00:25')

		await authenticatedPage.getByRole('button', { name: 'Try 10m' }).click()
		await expect(card('Focus')).toHaveValue('00:10')
		await expect(card('Short rest')).toHaveValue('00:05')
		await expect(card('Long rest')).toHaveValue('00:15')
	})

	test('an activity with no timer sessions offers nothing', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/timer')
		const fit = authenticatedPage.waitForResponse(
			response => response.url().includes('/session/fit') && response.request().method() === 'GET',
		)
		await chooseActivity(authenticatedPage, UNTIMED)
		// The read has answered, so the absence below is the answer and not an unfinished load.
		expect((await fit).ok()).toBe(true)
		await expect(authenticatedPage.getByRole('button', { name: /^Try / })).toHaveCount(0)
	})
})
