import type { Locator, Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * activity-settings O1 (`docs/opportunities.md`): the Role and Category tables show each row's icon.
 * Before, the server sent `icon` and the tables dropped it.
 *
 * Seed rows: the three primary roles carry `fas fa-briefcase` / `fa-heart-pulse` / `fa-guitar`
 * (`E2eFixtureSeeder`), so the icon column is asserted against them as seeded. The three primary
 * categories carry **no** icon, so they are the real no-icon rows for the Category table. What the seed
 * has neither of, a category with an icon and a role without one, each test creates through the app's own
 * API under a unique name and deletes afterwards (CLAUDE.md, *Mutating specs* 1), asserting the delete.
 *
 * Header text: on a cold first load of a table view the column headers can render in Slovak for the
 * English-locale account; a reload shows English. Each test waits on the row, which is locale-independent,
 * and reloads before it reads a header.
 */
test.describe.configure({ mode: 'serial' })

const MARK = 'e2e-as-o1'
const ROLE_NO_ICON = `${MARK}-role-no-icon`
const CATEGORY_WITH_ICON = `${MARK}-category-icon`

type Named = { id: number; name: string }

async function removeOwn(page: Page, entity: 'activity-role' | 'activity-category', name: string): Promise<number> {
	const response = await page.request.get(`${apiUrl()}/api/${entity}`)
	expect(response.ok(), `GET ${entity}: ${response.status()}`).toBe(true)
	const mine = ((await response.json()) as Named[]).filter(row => row.name === name)
	for (const { id } of mine) {
		const deleted = await page.request.delete(`${apiUrl()}/api/${entity}/${id}`)
		expect(deleted.ok(), `DELETE ${entity}/${id}: ${deleted.status()}`).toBe(true)
	}
	return mine.length
}

async function create(page: Page, entity: 'activity-role' | 'activity-category', data: object) {
	const response = await page.request.post(`${apiUrl()}/api/${entity}`, { data })
	expect(response.ok(), `could not create ${entity}: ${response.status()} ${await response.text()}`).toBe(true)
}

/** The `d` of the glyph's path: what tells one FontAwesome SVG icon from another. */
async function glyphPath(cell: Locator): Promise<string> {
	const d = await cell.locator('svg path').first().getAttribute('d')
	expect(d, 'the icon cell has an svg with no path').toBeTruthy()
	return d as string
}

/** Opens a tab filtered to one name, reloaded so the headers are in English (see the header note above). */
async function openFiltered(page: Page, tab: 'roles' | 'categories', name: string) {
	await page.goto(`/activity-settings/${tab}?name=${encodeURIComponent(name)}`)
	await page.reload()
	await expect(page.getByRole('columnheader', { name: 'Icon' })).toBeVisible()
	const row = page.getByRole('row').filter({ hasText: name })
	await expect(row).toHaveCount(1)
	return row
}

test.beforeEach(async ({ authenticatedPage }) => {
	await removeOwn(authenticatedPage, 'activity-role', ROLE_NO_ICON)
	await removeOwn(authenticatedPage, 'activity-category', CATEGORY_WITH_ICON)
})

test.afterEach(async ({ authenticatedPage }) => {
	// Each delete is asserted inside `removeOwn` (it fails the test on a non-2xx).
	await removeOwn(authenticatedPage, 'activity-role', ROLE_NO_ICON)
	await removeOwn(authenticatedPage, 'activity-category', CATEGORY_WITH_ICON)
})

test.describe('Role icons (/activity-settings/roles — activity-settings O1)', () => {
	test('each seeded role shows its own icon in the Icon column', async ({ authenticatedPage: page }) => {
		// The app's icon set is FontAwesome SVG (`vuetify/iconsets/fa-svg`), so there is no `fa-briefcase`
		// class to look for: the icon is an `<svg role="img">` whose path is the glyph. Three different
		// seeded icons must therefore draw three different paths.
		const paths: string[] = []
		for (const name of ['Work', 'Health & Fitness', 'Hobbies & Leisure']) {
			const row = await openFiltered(page, 'roles', name)
			const cell = row.getByRole('cell').nth(2)
			await expect(cell.locator('svg'), `${name}: icon`).toBeVisible()
			await expect(cell).not.toHaveText('—')
			paths.push(await glyphPath(cell))
		}
		expect(new Set(paths).size, 'each role should draw its own glyph').toBe(3)
	})

	test('a role with no icon renders a dash and no icon element', async ({ authenticatedPage: page }) => {
		await create(page, 'activity-role', { name: ROLE_NO_ICON, text: null, color: 'blue', icon: null })

		const row = await openFiltered(page, 'roles', ROLE_NO_ICON)
		const cell = row.getByRole('cell').nth(2)
		await expect(cell).toHaveText('—')
		await expect(cell.locator('i, svg')).toHaveCount(0)
		// The neighbouring colour cell still renders: no broken cell shifted the row.
		await expect(row.getByRole('cell')).toHaveCount(await page.getByRole('columnheader').count())
	})
})

test.describe('Category icons (/activity-settings/categories — activity-settings O1)', () => {
	test('a category with an icon shows it', async ({ authenticatedPage: page }) => {
		await create(page, 'activity-category', {
			name: CATEGORY_WITH_ICON,
			text: null,
			color: 'blue',
			icon: 'fas fa-bolt',
		})

		const row = await openFiltered(page, 'categories', CATEGORY_WITH_ICON)
		const nameIndex = await page.getByRole('columnheader', { name: 'Name' }).evaluate(th => {
			return Array.from(th.parentElement?.children ?? []).indexOf(th)
		})
		const iconIndex = nameIndex + 2
		const cell = row.getByRole('cell').nth(iconIndex)
		await expect(cell.locator('svg')).toBeVisible()
		await glyphPath(cell)
	})

	test('the seeded categories carry no icon and render a dash, not an empty or broken cell', async ({
		authenticatedPage: page,
	}) => {
		for (const name of ['Deep Work', 'Quick Tasks', 'Errands']) {
			const row = await openFiltered(page, 'categories', name)
			const nameIndex = await page.getByRole('columnheader', { name: 'Name' }).evaluate(th => {
				return Array.from(th.parentElement?.children ?? []).indexOf(th)
			})
			const cell = row.getByRole('cell').nth(nameIndex + 2)
			await expect(cell, name).toHaveText('—')
			await expect(cell.locator('i, svg')).toHaveCount(0)
		}
	})
})
