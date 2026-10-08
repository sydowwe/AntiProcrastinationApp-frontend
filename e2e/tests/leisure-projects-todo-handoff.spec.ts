import type { Locator, Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * leisure-projects O1: "Add to to-do list" on a Needs-shopping card hands the project to a to-do list as
 * one item for its own activity, with the shopping list (materials, then tools) as its steps and
 * `Shopping for <project>` as its note.
 *
 * Nothing in the client knows whether the activity is already on a list: `isOnTodoList` is never populated
 * on a grid row. The guard is the server's `(UserId, ActivityId, TodoListId)` unique index. It answers 409
 * `DbUniqueViolationError`, and the dialog turns that into an inline error under the list field, keeps
 * itself open, and writes nothing. It is per list, so a different list still accepts the same project.
 *
 * Mutating, so nothing here touches the fixture. Each test creates its own activity, project profile and
 * to-do lists through the app's own API (CLAUDE.md, *Mutating specs* 1) and removes them afterwards,
 * lists first because they take their items with them.
 */

const PROJECT = 'E2E handoff project'
const LIST_A = 'E2E handoff list A'
const LIST_B = 'E2E handoff list B'
const MATERIALS = ['E2E Screws', 'E2E Wood glue']
const TOOLS = ['E2E Drill', 'E2E Wood glue'] // the glue repeats on purpose: one step, not two

interface Created {
	activityId: number
	profileId: number
	listIds: number[]
}

async function post(page: Page, path: string, data: unknown): Promise<number> {
	const response = await page.request.post(`${apiUrl()}/api/${path}`, { data })
	expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

/** A Needs-shopping project with a shopping list, and the two empty lists to hand it to. */
async function createFixtures(page: Page, roleId: number, materials = MATERIALS, tools = TOOLS): Promise<Created> {
	const created: Created = { activityId: 0, profileId: 0, listIds: [] }
	created.activityId = await post(page, 'activity', { name: PROJECT, text: '', isUnavoidable: false, roleId })
	created.profileId = await post(page, 'activity-project-profile', {
		activityId: created.activityId,
		difficultyLevel: 'beginner',
		projectArea: 'E2E',
		estimatedHours: 2,
		isMessy: false,
		materialsNeeded: materials,
		requiredTools: tools,
		readinessStatus: 'needsShopping',
	})
	for (const name of [LIST_A, LIST_B]) created.listIds.push(await post(page, 'todo-list', { name }))
	return created
}

async function removeFixtures(page: Page, created: Created) {
	const paths = [
		...created.listIds.map(id => `todo-list/${id}`),
		...(created.profileId ? [`activity-project-profile/${created.profileId}`] : []),
		...(created.activityId ? [`activity/${created.activityId}`] : []),
	]
	// Asserted, not fire-and-forget: a failed delete leaves a row every later run and spec would see.
	for (const path of paths) {
		const response = await page.request.delete(`${apiUrl()}/api/${path}`)
		expect(response.ok(), `cleanup DELETE ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	}
}

interface ListItem {
	activity: { id: number }
	note: string | null
	steps: { name: string }[]
	taskPriority: { id: number }
}

async function itemsOn(page: Page, listId: number): Promise<ListItem[]> {
	const response = await page.request.get(`${apiUrl()}/api/todo-list-item`, { params: { todoListId: listId } })
	expect(response.ok()).toBe(true)
	return (await response.json()) as ListItem[]
}

async function roleIdOf(page: Page, activityId: number): Promise<number> {
	const response = await page.request.get(`${apiUrl()}/api/activity/${activityId}`)
	expect(response.ok()).toBe(true)
	return (await response.json()).role.id
}

async function openBoard(page: Page) {
	await page.goto('/leisure/projects')
	await page.getByRole('button', { name: `Edit ${PROJECT}` }).waitFor()
}

async function openHandoff(page: Page): Promise<Locator> {
	await page.getByRole('button', { name: `Add to to-do list: ${PROJECT}` }).click()
	const dialog = page.getByRole('dialog', { name: `Add to to-do list: ${PROJECT}` })
	await expect(dialog).toBeVisible()
	return dialog
}

/** Open a select by its field wrapper (a role click is intercepted by the field's `data-no-activator` div). */
async function choose(page: Page, dialog: Locator, label: string, option?: string) {
	await dialog.locator('.v-select', { hasText: label }).locator('.v-field__input').click()
	// Scoped to the open listbox: the sidebar's nav entries are `role="option"` too.
	const options = page.getByRole('listbox').getByRole('option')
	await (option ? options.filter({ hasText: option }) : options).first().click()
}

test.describe('Shopping list to to-do handoff (/leisure/projects)', () => {
	let created: Created = { activityId: 0, profileId: 0, listIds: [] }

	test.beforeEach(({}, testInfo) => {
		testInfo.setTimeout(60_000)
	})

	test.afterEach(async ({ authenticatedPage }) => {
		await removeFixtures(authenticatedPage, created)
		created = { activityId: 0, profileId: 0, listIds: [] }
	})

	test('creates one item for the project with its shopping list as steps', async ({
		authenticatedPage: page,
		seed,
	}) => {
		created = await createFixtures(page, await roleIdOf(page, seed.activities.buildABookshelf))
		await openBoard(page)

		const dialog = await openHandoff(page)
		// The preview is the steps the item will get: materials first, then tools, a repeat counted once.
		await expect(dialog.getByText('Steps (3)')).toBeVisible()
		await expect(dialog.getByRole('listitem')).toHaveText(['E2E Screws', 'E2E Wood glue', 'E2E Drill'])

		await choose(page, dialog, 'To-do list', LIST_A)
		await choose(page, dialog, 'Priority')
		await dialog.getByRole('button', { name: 'Add', exact: true }).click()

		await expect(page.getByText(`Added to ${LIST_A}`)).toBeVisible()
		await expect(dialog).toBeHidden()

		const [item, ...rest] = await itemsOn(page, created.listIds[0])
		expect(rest).toHaveLength(0)
		expect(item.activity.id).toBe(created.activityId)
		expect(item.note).toBe(`Shopping for ${PROJECT}`)
		expect(item.steps.map(step => step.name)).toEqual(['E2E Screws', 'E2E Wood glue', 'E2E Drill'])
		// The other list is untouched.
		expect(await itemsOn(page, created.listIds[1])).toHaveLength(0)
		// And the project stays where it was: the handoff is not a status change.
		await expect(
			page.locator('#app .readiness-column', { has: page.getByText('Needs shopping', { exact: true }) }).getByRole('button', {
				name: `Edit ${PROJECT}`,
			}),
		).toBeVisible()
	})

	test('a second handoff to the same list is refused inline, and a different list still takes it', async ({
		authenticatedPage: page,
		seed,
	}) => {
		created = await createFixtures(page, await roleIdOf(page, seed.activities.buildABookshelf))
		await openBoard(page)

		let dialog = await openHandoff(page)
		await choose(page, dialog, 'To-do list', LIST_A)
		await choose(page, dialog, 'Priority')
		await dialog.getByRole('button', { name: 'Add', exact: true }).click()
		await expect(page.getByText(`Added to ${LIST_A}`)).toBeVisible()
		await expect(dialog).toBeHidden()

		// Same project, same list: the unique index says no (409), and the dialog says why under the field.
		dialog = await openHandoff(page)
		await choose(page, dialog, 'To-do list', LIST_A)
		await choose(page, dialog, 'Priority')
		await dialog.getByRole('button', { name: 'Add', exact: true }).click()

		await expect(dialog.getByText(`${PROJECT} is already on that list`)).toBeVisible()
		await expect(dialog).toBeVisible()
		expect(await itemsOn(page, created.listIds[0])).toHaveLength(1)

		// The error belongs to the list choice: changing the list clears it, and the guard is per list.
		await choose(page, dialog, 'To-do list', LIST_B)
		await expect(dialog.getByText(`${PROJECT} is already on that list`)).toHaveCount(0)
		await dialog.getByRole('button', { name: 'Add', exact: true }).click()

		await expect(page.getByText(`Added to ${LIST_B}`)).toBeVisible()
		await expect(dialog).toBeHidden()
		expect(await itemsOn(page, created.listIds[0])).toHaveLength(1)
		expect(await itemsOn(page, created.listIds[1])).toHaveLength(1)
	})

	test('a project with nothing to buy offers no handoff', async ({ authenticatedPage: page, seed }) => {
		created = await createFixtures(page, await roleIdOf(page, seed.activities.buildABookshelf), [], [])
		await openBoard(page)

		await expect(page.getByRole('button', { name: `Add to to-do list: ${PROJECT}` })).toHaveCount(0)
	})
})
