import type { APIResponse, Page } from '@playwright/test'
import { apiUrl, expect, test, type SeedResponse } from '../fixtures/auth'

/**
 * FO3 phase 1 (`docs/feature-opportunities.md`): a to-do item that keeps slipping in the planner is offered
 * a smaller first step, never a count. The server derives `planHelp` from the item's linked planner blocks;
 * this pins that the list renders the offer, that its options do what they say, and that "Not now" holds.
 *
 * Everything is created through the app's own API and deleted afterwards (CLAUDE.md, *Mutating specs* 1):
 * a throwaway list holding one item, and one planner block linked to it that is carried over three times.
 * The block starts tomorrow and only ever moves forward, so no past day gains a row.
 * `planner-skip-insights.spec.ts` asserts the past month is empty, and this spec must not break that.
 * The planner block is deleted explicitly, because deleting the item only nulls the block's link.
 */
test.describe.configure({ mode: 'serial' })

const LIST_NAME = 'E2E FO3 stuck list'
const LIST_URL = () => `${apiUrl()}/api/todo-list`
const ITEM_URL = () => `${apiUrl()}/api/todo-list-item`
const TASK_URL = () => `${apiUrl()}/api/planner-task`

/** `yyyy-MM-dd` from the seed date. UTC arithmetic, never `new Date()`. */
function isoDate(seed: SeedResponse, dayOffset: number): string {
	const d = new Date(`${seed.seedDateUtc}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + dayOffset)
	return d.toISOString().slice(0, 10)
}

async function created(response: APIResponse, what: string) {
	expect(response.ok(), `could not create ${what}: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

const plannerTaskIds: number[] = []

/** A list with one item whose one planner block has been carried over three times: stuck, kind `smallerStep`. */
async function createStuckItem(page: Page, seed: SeedResponse) {
	const listId = await created(await page.request.post(LIST_URL(), { data: { name: LIST_NAME } }), 'the list')
	const itemId = await created(
		await page.request.post(ITEM_URL(), {
			data: {
				todoListId: listId,
				activityId: seed.activities.groceryShopping,
				taskPriorityId: Object.values(seed.taskPriorities)[0],
			},
		}),
		'the item',
	)
	const taskId = await created(
		await page.request.post(TASK_URL(), {
			data: {
				date: isoDate(seed, 1),
				startTime: { hours: 10, minutes: 0 },
				endTime: { hours: 10, minutes: 30 },
				isBackground: false,
				activityId: seed.activities.groceryShopping,
				status: 'notStarted',
				todolistId: itemId,
			},
		}),
		'the planner block',
	)
	plannerTaskIds.push(taskId)

	for (const offset of [2, 3, 4]) {
		const carry = await page.request.post(`${TASK_URL()}/${taskId}/carry-over`, {
			data: { date: isoDate(seed, offset) },
		})
		expect(carry.ok(), `carry-over to +${offset}: ${carry.status()} ${await carry.text()}`).toBe(true)
	}
	return { listId, itemId }
}

async function removeThrowaways(page: Page) {
	for (const id of plannerTaskIds.splice(0)) await page.request.delete(`${TASK_URL()}/${id}`)
	const response = await page.request.get(`${LIST_URL()}/all-options`)
	expect(response.ok()).toBe(true)
	for (const { id, text } of (await response.json()) as { id: number; text: string }[]) {
		if (text === LIST_NAME) await page.request.delete(`${LIST_URL()}/${id}`)
	}
}

function offer(page: Page) {
	return page.getByRole('group', { name: 'Help getting started' })
}

test.beforeEach(async ({ authenticatedPage }) => {
	await removeThrowaways(authenticatedPage)
})

test.afterEach(async ({ authenticatedPage }) => {
	await removeThrowaways(authenticatedPage)
})

test.describe('Stuck item offer (/todo-list/:id)', () => {
	test('a task carried over three times is offered a smaller step first, with no count anywhere', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const { listId, itemId } = await createStuckItem(page, seed)

		const read = await page.request.get(`${ITEM_URL()}/${itemId}`)
		expect(((await read.json()) as { planHelp: string | null }).planHelp).toBe('smallerStep')

		await page.goto(`/todo-list/${listId}`)
		await expect(offer(page)).toBeVisible()
		await expect(offer(page)).toContainText('A smaller first step might make it easier.')
		// The kind decides the lead option; all four are on offer. Button 0 is the "Not now" close icon.
		await expect(offer(page).getByRole('button').nth(1)).toHaveText('Split into steps')
		await expect(offer(page).getByRole('button', { name: 'Start 10 min' })).toBeVisible()
		await expect(offer(page).getByRole('button', { name: 'Pair a reward' })).toBeVisible()
		await expect(offer(page).getByRole('button', { name: 'Let it go' })).toBeVisible()
		// Never the score: the item slipped three times, and neither that number nor a "times" may show.
		// ("10" in "Start 10 min" is the timer's length, not a count.)
		await expect(offer(page)).not.toContainText(/\b3\b|times|again/i)
	})

	test('"Split into steps" opens the edit dialog with the cursor in "Add step"', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const { listId } = await createStuckItem(page, seed)
		await page.goto(`/todo-list/${listId}`)

		await offer(page).getByRole('button', { name: 'Split into steps' }).click()
		const dialog = page.getByRole('dialog')
		await expect(dialog).toBeVisible()
		await expect(dialog.getByRole('textbox', { name: 'Add step' })).toBeFocused()
	})

	test('"Not now" puts the offer away, and it stays away after a reload', async ({ authenticatedPage: page, seed }) => {
		const { listId } = await createStuckItem(page, seed)
		await page.goto(`/todo-list/${listId}`)

		await offer(page).getByRole('button', { name: 'Not now' }).click()
		await expect(offer(page)).toHaveCount(0)

		// Wait on the item read itself: before it lands there is no row, so "no offer" would pass vacuously.
		const itemsRead = page.waitForResponse(r => r.url().includes('/api/todo-list-item?todoListId='))
		await page.reload()
		expect(((await (await itemsRead).json()) as { planHelp: string | null }[])[0]?.planHelp).toBe('smallerStep')
		await expect(page.getByRole('button', { name: /^More actions:/ })).toBeVisible()
		await expect(offer(page)).toHaveCount(0)
	})
})
