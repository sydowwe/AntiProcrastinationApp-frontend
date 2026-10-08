import type { Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * tracking-settings O1 (`docs/opportunities.md`): a mapping's `isActive` is a switch on both Mappings tables,
 * so a rule can be paused without being deleted.
 *
 * There is no patch route, so the switch PUTs the whole row back with only `isActive` changed. That is the
 * OP10 lesson: the repeating-task table's Active switch once sent a partial body the validator rejected. So
 * these specs check three things, not one: the body carries every other field of the rule unchanged
 * (including its role/category target, which a dropped field would clear), the server accepts it (200), and
 * the stored row — read back through the grid and after a reload — has the new state with the rest intact.
 *
 * MUTATES, so (CLAUDE.md, *Mutating specs* 1) each test creates its own rule through the app's API under a
 * pattern no seeded entry matches and deletes it afterwards, asserting the delete. The seed's own rules are
 * never toggled.
 *
 * Header text: on a cold first load of a table view the column headers can render in Slovak for the
 * English-locale account; a reload shows English. The switch's accessible name is an `aria-label` from the
 * same locale, so each test reloads before it looks for it.
 */
test.describe.configure({ mode: 'serial' })

type StoredMapping = Record<string, unknown> & { id: number; isActive: boolean }
type Named = { id: number; name: string }

interface Side {
	label: string
	apiPath: string
	view: string
	/** What the switch is named after: `patternLabel` (process name / app label). */
	patternLabel: string
	/** The query that narrows the table to this one rule. */
	query: string
	/** The grid filter that finds this one rule. */
	gridFilter: object
	/** The fields the rule is created with, apart from `isActive` and the target. */
	fields: Record<string, unknown>
}

const DESKTOP: Side = {
	label: 'desktop',
	apiPath: 'activity-tracking/desktop/settings/tracker-desktop-mapping-by-pattern',
	view: '/activity-tracking/desktop/settings/mappings',
	patternLabel: 'e2e-o1-toggle.exe',
	query: 'processName=e2e-o1-toggle.exe&processNameMatchType=Exact&type=Role',
	gridFilter: { processName: 'e2e-o1-toggle.exe', processNameMatchType: 'Exact' },
	fields: {
		processName: 'e2e-o1-toggle.exe',
		processNameMatchType: 'Exact',
		windowTitle: 'e2e-o1 window',
		windowTitleMatchType: 'Contains',
	},
}

const ANDROID: Side = {
	label: 'android',
	apiPath: 'activity-tracking/android/settings/tracker-android-mapping-by-pattern',
	view: '/activity-tracking/android/settings/mappings',
	// `patternLabel` prefers the app label over the package name.
	patternLabel: 'E2E O1 Toggle App',
	query: 'packageName=com.e2e.o1.toggle&packageNameMatchType=Exact&type=Role',
	gridFilter: { packageName: 'com.e2e.o1.toggle', packageNameMatchType: 'Exact' },
	fields: {
		appLabel: 'E2E O1 Toggle App',
		appLabelMatchType: 'Exact',
		packageName: 'com.e2e.o1.toggle',
		packageNameMatchType: 'Exact',
	},
}

async function firstOf(page: Page, entity: 'activity-role' | 'activity-category'): Promise<Named> {
	const response = await page.request.get(`${apiUrl()}/api/${entity}`)
	expect(response.ok(), `GET ${entity}: ${response.status()}`).toBe(true)
	const rows = (await response.json()) as Named[]
	expect(rows.length, `the seed account has no ${entity}`).toBeGreaterThan(0)
	return rows[0]
}

async function findRules(page: Page, side: Side): Promise<StoredMapping[]> {
	const response = await page.request.post(`${apiUrl()}/api/${side.apiPath}/grid`, {
		data: { page: 1, itemsPerPage: 50, sortBy: [], useFilter: true, filter: side.gridFilter },
	})
	expect(response.ok(), `grid: ${response.status()} ${await response.text()}`).toBe(true)
	return ((await response.json()) as { items: StoredMapping[] }).items
}

async function removeRules(page: Page, side: Side) {
	for (const { id } of await findRules(page, side)) {
		const deleted = await page.request.delete(`${apiUrl()}/api/${side.apiPath}/${id}`)
		expect(deleted.ok(), `DELETE rule ${id}: ${deleted.status()}`).toBe(true)
	}
	expect(await findRules(page, side), 'the test rule survived its delete').toHaveLength(0)
}

async function createRule(page: Page, side: Side, target: object): Promise<number> {
	const response = await page.request.post(`${apiUrl()}/api/${side.apiPath}`, {
		data: { isActive: true, ...side.fields, ...target },
	})
	expect(response.ok(), `could not create the rule: ${response.status()} ${await response.text()}`).toBe(true)
	const body = await response.json()
	return typeof body === 'number' ? body : Number(body.id)
}

for (const side of [DESKTOP, ANDROID]) {
	test.describe(`Mapping Active switch (${side.view} — tracking-settings O1)`, () => {
		test.beforeEach(async ({ authenticatedPage }) => removeRules(authenticatedPage, side))
		test.afterEach(async ({ authenticatedPage }) => removeRules(authenticatedPage, side))

		test(`flipping the ${side.label} switch PUTs the whole rule, the server accepts it, and the state survives a reload`, async ({
			authenticatedPage: page,
		}) => {
			const role = await firstOf(page, 'activity-role')
			const category = await firstOf(page, 'activity-category')
			const id = await createRule(page, side, { roleId: role.id, categoryId: category.id })

			await page.goto(`${side.view}?${side.query}`)
			await page.reload()
			const toggle = page.getByRole('switch', { name: `Rule active: ${side.patternLabel}` })
			await expect(toggle).toBeChecked()

			// Off.
			const putOff = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${id}`))
			await toggle.click()
			const responseOff = await putOff
			expect(responseOff.status(), await responseOff.text()).toBe(200)
			// Full replace: the rule's patterns, match types and role/category target all ride along.
			expect(responseOff.request().postDataJSON()).toMatchObject({
				...side.fields,
				isActive: false,
				isIgnored: null,
				activityId: null,
				roleId: role.id,
				categoryId: category.id,
			})
			await expect(toggle).not.toBeChecked()

			const [storedOff] = await findRules(page, side)
			expect(storedOff).toMatchObject({
				id,
				...side.fields,
				isActive: false,
				isIgnored: null,
				roleId: role.id,
				categoryId: category.id,
			})

			await page.reload()
			await expect(page.getByRole('switch', { name: `Rule active: ${side.patternLabel}` })).not.toBeChecked()

			// And back on: the switch is a two-way control, not a one-shot disable.
			const putOn = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${id}`))
			await page.getByRole('switch', { name: `Rule active: ${side.patternLabel}` }).click()
			const responseOn = await putOn
			expect(responseOn.status(), await responseOn.text()).toBe(200)
			expect(responseOn.request().postDataJSON()).toMatchObject({ ...side.fields, isActive: true })

			await page.reload()
			await expect(page.getByRole('switch', { name: `Rule active: ${side.patternLabel}` })).toBeChecked()
			const [storedOn] = await findRules(page, side)
			expect(storedOn).toMatchObject({ id, isActive: true, roleId: role.id, categoryId: category.id })
		})
	})
}
