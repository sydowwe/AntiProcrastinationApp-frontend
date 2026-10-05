import type { Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * OP22 (`docs/opportunities.md`): a mapping rule aimed at a role or category, rather than an activity or
 * *ignored*. This client never creates one, but the server accepts it, and before OP22 such a rule
 * rendered with a blank target and reopened in *To ignored* — so saving a pattern edit silently turned it
 * into an ignore rule.
 *
 * The fixture seeds no such rule, so each test creates its own through the API, under a pattern no seeded
 * entry matches, and deletes it afterwards (CLAUDE.md, *Mutating specs* 1). Runs against the real
 * responses, so it needs an API that projects `roleName` / `categoryName`.
 */
test.describe.configure({ mode: 'serial' })

const DESKTOP_URL = () => `${apiUrl()}/api/activity-tracking/desktop/settings/tracker-desktop-mapping-by-pattern`
const ANDROID_URL = () => `${apiUrl()}/api/activity-tracking/android/settings/tracker-android-mapping-by-pattern`
const DESKTOP_PROCESS = 'e2e-op22-target.exe'
const ANDROID_PACKAGE = 'com.e2e.op22.target'

type Named = { id: number; name: string }
type StoredMapping = {
	id: number
	isIgnored: boolean | null
	activity: unknown
	roleId: number | null
	categoryId: number | null
	roleName: string | null
	categoryName: string | null
}

async function firstOf(page: Page, entity: 'activity-role' | 'activity-category'): Promise<Named> {
	const response = await page.request.get(`${apiUrl()}/api/${entity}`)
	expect(response.ok(), `GET ${entity}: ${response.status()}`).toBe(true)
	const rows = (await response.json()) as Named[]
	expect(rows.length, `the seed account has no ${entity}`).toBeGreaterThan(0)
	return rows[0]
}

async function create(page: Page, url: string, data: object): Promise<number> {
	const response = await page.request.post(url, { data: { isActive: true, ...data } })
	expect(response.ok(), `could not create the rule: ${response.status()} ${await response.text()}`).toBe(true)
	const body = await response.json()
	return typeof body === 'number' ? body : Number(body.id)
}

async function findByPattern(page: Page, url: string, filter: object): Promise<StoredMapping[]> {
	const response = await page.request.post(`${url}/grid`, {
		data: { page: 1, itemsPerPage: 50, sortBy: [], useFilter: true, filter },
	})
	expect(response.ok(), `grid: ${response.status()} ${await response.text()}`).toBe(true)
	return ((await response.json()) as { items: StoredMapping[] }).items
}

async function removeOwnRules(page: Page) {
	for (const { id } of await findByPattern(page, DESKTOP_URL(), {
		processName: DESKTOP_PROCESS,
		processNameMatchType: 'Exact',
	})) {
		await page.request.delete(`${DESKTOP_URL()}/${id}`)
	}
	for (const { id } of await findByPattern(page, ANDROID_URL(), {
		packageName: ANDROID_PACKAGE,
		packageNameMatchType: 'Exact',
	})) {
		await page.request.delete(`${ANDROID_URL()}/${id}`)
	}
}

/** Rules a test aimed at a real, uncovered entry — no marker pattern to find them by, so they are tracked. */
const trackedDesktopIds: number[] = []

test.beforeEach(async ({ authenticatedPage }) => removeOwnRules(authenticatedPage))
test.afterEach(async ({ authenticatedPage }) => {
	await removeOwnRules(authenticatedPage)
	for (const id of trackedDesktopIds.splice(0)) await authenticatedPage.request.delete(`${DESKTOP_URL()}/${id}`)
})

/**
 * The distinct-entries *Rule* chip opens the Mappings tab on the type that lists its rule. The tab opens on
 * *Activity* by default, so before this an ignored or a role/category rule was not on the page its chip
 * linked to. The Activity chip's link is unchanged and covered in `tracking-settings.draft.spec.ts`.
 */
/**
 * Aims a new rule at the first uncovered desktop entry and opens the distinct-entries row it now covers.
 * Not the fixture's own ignore rule: its pattern matches no recorded entry, so it has no chip to click.
 */
async function coverAnUncoveredEntry(page: Page, target: object): Promise<{ id: number; processName: string }> {
	const uncovered = await page.request.post(`${apiUrl()}/api/activity-tracking/desktop/grid`, {
		data: { page: 1, itemsPerPage: 1, sortBy: [], useFilter: true, filter: { coverage: 'Uncovered' } },
	})
	expect(uncovered.ok(), `distinct grid: ${uncovered.status()}`).toBe(true)
	const [entry] = ((await uncovered.json()) as { items: { processName: string }[] }).items
	expect(entry, 'the fixture has no uncovered desktop entry to aim a rule at').toBeTruthy()

	const id = await create(page, DESKTOP_URL(), {
		processName: entry.processName,
		processNameMatchType: 'Exact',
		...target,
	})
	trackedDesktopIds.push(id)
	await page.goto(
		`/activity-tracking/desktop/settings/distinctEntries?processName=${encodeURIComponent(entry.processName)}&processNameMatchType=Exact`,
	)
	return { id, processName: entry.processName }
}

test.describe('Rule chip opens its rule (/activity-tracking/desktop/settings/distinctEntries — OP22)', () => {
	test('an Ignored chip opens the Mappings tab on Type: Ignored, with the rule listed', async ({
		authenticatedPage: page,
	}) => {
		const { id, processName } = await coverAnUncoveredEntry(page, { isIgnored: true })

		const row = page.getByRole('row').filter({ hasText: processName }).first()
		await row.getByRole('link', { name: 'Ignored' }).click()
		await expect(page).toHaveURL(new RegExp(`/desktop/settings/mappings\\?mappingId=${id}&type=Ignored$`))
		await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('Ignored')
		await expect(page.getByRole('row').filter({ hasText: processName }).first()).toBeVisible()
	})

	test('a role/category chip opens the Mappings tab on Type: All, with the rule listed', async ({
		authenticatedPage: page,
	}) => {
		const category = await firstOf(page, 'activity-category')
		const { id, processName } = await coverAnUncoveredEntry(page, { categoryId: category.id })
		const entry = { processName }

		const row = page.getByRole('row').filter({ hasText: entry.processName }).first()
		await row.getByRole('link', { name: category.name }).click()
		await expect(page).toHaveURL(new RegExp(`/desktop/settings/mappings\\?mappingId=${id}&type=All$`))
		await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('All')
		await expect(
			page
				.getByRole('row')
				.filter({ hasText: entry.processName })
				.getByRole('cell', { name: `Category: ${category.name}`, exact: true }),
		).toBeVisible()
	})
})

test.describe('Role/category target (/activity-tracking/desktop/settings/:tableView — OP22)', () => {
	test('the Mappings tab names the target, and an edit saved on Keep keeps it', async ({
		authenticatedPage: page,
	}) => {
		const role = await firstOf(page, 'activity-role')
		const category = await firstOf(page, 'activity-category')
		const id = await create(page, DESKTOP_URL(), {
			processName: DESKTOP_PROCESS,
			processNameMatchType: 'Exact',
			roleId: role.id,
			categoryId: category.id,
		})

		await page.goto(
			`/activity-tracking/desktop/settings/mappings?processName=${DESKTOP_PROCESS}&processNameMatchType=Exact&type=Role`,
		)
		// The *Type* filter defaults to Activity, which is why such a rule was unreachable before OP22.
		await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('Role')
		const label = `Role: ${role.name} · Category: ${category.name}`
		const row = page.getByRole('row').filter({ hasText: DESKTOP_PROCESS })
		await expect(page.getByRole('columnheader', { name: 'Map to' })).toBeVisible()
		await expect(row.getByRole('cell', { name: label })).toBeVisible()

		await row.getByRole('button', { name: 'Edit' }).click()
		await expect(page).toHaveURL(/\/desktop\/settings\/distinctEntries\?/)
		const target = page.getByRole('group', { name: 'Map to' })
		await expect(target.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')
		await expect(page.getByText('This rule maps to a role or category.')).toBeVisible()

		const put = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${id}`))
		await page.getByRole('button', { name: 'Save' }).click()
		const response = await put
		expect(response.status()).toBe(200)
		expect(response.request().postDataJSON()).toMatchObject({
			isIgnored: null,
			activityId: null,
			roleId: role.id,
			categoryId: category.id,
		})

		const [stored] = await findByPattern(page, DESKTOP_URL(), {
			processName: DESKTOP_PROCESS,
			processNameMatchType: 'Exact',
		})
		expect(stored).toMatchObject({ id, isIgnored: null, activity: null, roleId: role.id, categoryId: category.id })
		// The edit is over: the form is back to its two modes.
		await expect(target.getByRole('button', { name: label })).toHaveCount(0)
	})
})

test.describe('Role/category target (/activity-tracking/android/settings/:tableView — OP22)', () => {
	test('a category-only rule shows its target, and To ignored converts it deliberately', async ({
		authenticatedPage: page,
	}) => {
		const category = await firstOf(page, 'activity-category')
		const id = await create(page, ANDROID_URL(), {
			packageName: ANDROID_PACKAGE,
			packageNameMatchType: 'Exact',
			categoryId: category.id,
		})

		await page.goto(
			`/activity-tracking/android/settings/mappings?packageName=${ANDROID_PACKAGE}&packageNameMatchType=Exact&type=Category`,
		)
		const label = `Category: ${category.name}`
		const row = page.getByRole('row').filter({ hasText: ANDROID_PACKAGE })
		await expect(row.getByRole('cell', { name: label, exact: true })).toBeVisible()

		await row.getByRole('button', { name: 'Edit' }).click()
		const target = page.getByRole('group', { name: 'Map to' })
		await expect(target.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')

		await target.getByRole('button', { name: 'To ignored' }).click()
		await expect(page.getByText('This rule maps to a role or category.')).toHaveCount(0)
		const put = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${id}`))
		await page.getByRole('button', { name: 'Save' }).click()
		expect((await put).status()).toBe(200)

		const [stored] = await findByPattern(page, ANDROID_URL(), {
			packageName: ANDROID_PACKAGE,
			packageNameMatchType: 'Exact',
		})
		expect(stored).toMatchObject({ id, isIgnored: true, roleId: null, categoryId: null, categoryName: null })
	})
})
