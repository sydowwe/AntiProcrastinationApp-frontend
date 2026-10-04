import type { Locator, Page } from '@playwright/test'
import { apiUrl, expect, test, type SeedResponse } from '../fixtures/auth'

/**
 * OP3 (`docs/opportunities.md`): the server stores a list's description as `text` (the shared
 * `NameTextIconRequest`), and the client sent and read it as `description`, so it was dropped both
 * ways with nothing on screen to say so. A step's `note` was rendered but had no input. These specs pin
 * both round trips.
 *
 * Each test creates its own list through the API and deletes it afterwards, by name, so the fixture's
 * lists stay read-only (CLAUDE.md, *Mutating specs* 1). The list delete cascades to its items. The item
 * borrows a seed activity, and nothing here writes to it.
 */
test.describe.configure({ mode: 'serial' })

const LIST_NAME = 'E2E OP3 list'
const LIST_URL = () => `${apiUrl()}/api/todo-list`
const ITEM_URL = () => `${apiUrl()}/api/todo-list-item`

type StoredList = { id: number; name: string; text: string | null }
type StoredStep = { name: string; order: number; note: string | null }

async function createList(page: Page, text: string | null) {
	const response = await page.request.post(LIST_URL(), { data: { name: LIST_NAME, text } })
	expect(response.ok(), `could not create the list: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

async function storedList(page: Page, id: number): Promise<StoredList> {
	const response = await page.request.get(`${LIST_URL()}/${id}`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as StoredList
}

async function createItemWithSteps(page: Page, seed: SeedResponse, listId: number, steps: StoredStep[]) {
	const response = await page.request.post(ITEM_URL(), {
		data: {
			todoListId: listId,
			activityId: seed.activities.groceryShopping,
			taskPriorityId: Object.values(seed.taskPriorities)[0],
			steps,
		},
	})
	expect(response.ok(), `could not create the item: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

async function storedSteps(page: Page, itemId: number): Promise<StoredStep[]> {
	const response = await page.request.get(`${ITEM_URL()}/${itemId}`)
	expect(response.ok()).toBe(true)
	const { steps } = (await response.json()) as { steps: StoredStep[] }
	return [...steps].sort((a, b) => a.order - b.order)
}

/** Deletes any leftover from an earlier, aborted run, so the create cannot 409 on the unique name. */
async function removeThrowawayLists(page: Page) {
	const response = await page.request.get(`${LIST_URL()}/all-options`)
	expect(response.ok()).toBe(true)
	const options = (await response.json()) as { id: number; text: string }[]
	for (const { id, text } of options) {
		if (text === LIST_NAME) await page.request.delete(`${LIST_URL()}/${id}`)
	}
}

/**
 * `TodoListCard` has no role of its own; the card is the innermost `.v-card` carrying the list's name
 * (the panel around the cards is a `.v-card` too, and comes first in DOM order).
 */
function listCard(page: Page) {
	return page.locator('.v-card').filter({ hasText: LIST_NAME }).last()
}

/**
 * A step's note toggle. `exact`, because the open note field's Vuetify clear icon is a `button` named
 * "Clear Note for step N" and a substring match resolves to both.
 */
function noteToggle(dialog: Locator, position: number) {
	return dialog.getByRole('button', { name: `Note for step ${position}`, exact: true })
}

/** Resolves on the PUT's *response*, so an API read after it sees the write. */
function waitForPut(page: Page, path: string) {
	return page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(path))
}

/** The throwaway list holds one item, so its row's *More actions* button is the only one on the page. */
async function openItemEditDialog(page: Page) {
	await page.getByRole('button', { name: /^More actions:/ }).click()
	await page.getByRole('button', { name: 'Edit', exact: true }).click()
	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	return dialog
}

test.beforeEach(async ({ authenticatedPage }) => {
	await removeThrowawayLists(authenticatedPage)
})

test.afterEach(async ({ authenticatedPage }) => {
	await removeThrowawayLists(authenticatedPage)
})

test.describe('List description (/todo-list)', () => {
	test('a description typed into the create dialog is stored as `text` and shown on the card', async ({
		authenticatedPage: page,
	}) => {
		await page.goto('/todo-list')
		await page.getByRole('button', { name: 'New list' }).click()
		const dialog = page.getByRole('dialog')
		await dialog.getByRole('textbox', { name: 'Name' }).fill(LIST_NAME)
		await dialog.getByRole('textbox', { name: 'Description' }).fill('What this list is for')

		const post = page.waitForRequest(r => r.method() === 'POST' && r.url().endsWith('/api/todo-list'))
		await dialog.getByRole('button', { name: 'Add', exact: true }).click()
		expect((await post).postDataJSON()).toMatchObject({ name: LIST_NAME, text: 'What this list is for' })

		// The card is re-read from the server after the create, so this is the stored value.
		await expect(listCard(page)).toContainText('What this list is for')
	})

	test('the edit dialog opens with the stored description, and an edit survives a reload', async ({
		authenticatedPage: page,
	}) => {
		const id = await createList(page, 'Before')

		await page.goto('/todo-list')
		await page.getByRole('button', { name: `Edit: ${LIST_NAME}` }).click()
		const description = page.getByRole('dialog').getByRole('textbox', { name: 'Description' })
		await expect(description).toHaveValue('Before')

		await description.fill('After')
		// The response, not the request: the GET below must not race the write.
		const put = waitForPut(page, `/api/todo-list/${id}`)
		await page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true }).click()
		expect((await put).request().postDataJSON()).toMatchObject({ text: 'After' })

		expect((await storedList(page, id)).text).toBe('After')
		await page.reload()
		await expect(listCard(page)).toContainText('After')
	})

	test('the description box stops at the server limit of 1000 characters', async ({ authenticatedPage: page }) => {
		await page.goto('/todo-list')
		await page.getByRole('button', { name: 'New list' }).click()
		const description = page.getByRole('dialog').getByRole('textbox', { name: 'Description' })
		await description.fill('x'.repeat(1005))
		await expect(description).toHaveValue('x'.repeat(1000))
	})
})

test.describe('Step note (/todo-list/:id — item dialog)', () => {
	test('a step with a note opens with it, a note can be added, and a blank one is sent as null', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const listId = await createList(page, null)
		const itemId = await createItemWithSteps(page, seed, listId, [
			{ name: 'Buy milk', order: 1, note: 'Oat, 2 litres' },
			{ name: 'Buy bread', order: 2, note: null },
			{ name: 'Buy eggs', order: 3, note: null },
		])

		await page.goto(`/todo-list/${listId}`)
		// The stored note is rendered under its step.
		await expect(page.getByText('Oat, 2 litres')).toBeVisible()

		const dialog = await openItemEditDialog(page)

		// Step 1 has a note, so its field is already open and its toggle reads pressed. Step 2 has none.
		await expect(dialog.getByRole('textbox', { name: 'Note for step 1' })).toHaveValue('Oat, 2 litres')
		await expect(noteToggle(dialog, 1)).toHaveAttribute('aria-pressed', 'true')
		await expect(dialog.getByRole('textbox', { name: 'Note for step 2' })).toHaveCount(0)
		await expect(noteToggle(dialog, 2)).toHaveAttribute('aria-pressed', 'false')

		// Write a note on step 2. Open step 3's field and leave it blank.
		await noteToggle(dialog, 2).click()
		await expect(dialog.getByRole('textbox', { name: 'Note for step 2' })).toBeFocused()
		await dialog.getByRole('textbox', { name: 'Note for step 2' }).fill('Sourdough')
		await noteToggle(dialog, 3).click()
		await expect(dialog.getByRole('textbox', { name: 'Note for step 3' })).toBeVisible()

		const put = waitForPut(page, `/api/todo-list-item/${itemId}`)
		await dialog.getByRole('button', { name: 'Edit', exact: true }).click()
		const sent = (await put).request().postDataJSON() as { steps: StoredStep[] }
		expect(sent.steps.map(s => s.note)).toEqual(['Oat, 2 litres', 'Sourdough', null])

		expect((await storedSteps(page, itemId)).map(s => s.note)).toEqual(['Oat, 2 litres', 'Sourdough', null])
		await expect(page.getByText('Sourdough')).toBeVisible()
	})

	test('toggling an open note off drops it', async ({ authenticatedPage: page, seed }) => {
		const listId = await createList(page, null)
		const itemId = await createItemWithSteps(page, seed, listId, [
			{ name: 'Buy milk', order: 1, note: 'Oat, 2 litres' },
		])

		await page.goto(`/todo-list/${listId}`)
		await page.getByText('Oat, 2 litres').waitFor()
		const dialog = await openItemEditDialog(page)

		await noteToggle(dialog, 1).click()
		await expect(dialog.getByRole('textbox', { name: 'Note for step 1' })).toHaveCount(0)

		const put = waitForPut(page, `/api/todo-list-item/${itemId}`)
		await dialog.getByRole('button', { name: 'Edit', exact: true }).click()
		expect((await put).ok()).toBe(true)

		expect((await storedSteps(page, itemId))[0]!.note).toBeNull()
	})
})
