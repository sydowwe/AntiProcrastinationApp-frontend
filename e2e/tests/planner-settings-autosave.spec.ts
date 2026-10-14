import type { Page, Request } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * The planner settings page saves itself: a debounced watcher in `DayPlannerSettingsView.vue` PUTs every field
 * 500 ms after a change. Loading the page used to count as a change, because `loadSettings()` assigns every field
 * and flips `loaded` in the same tick, so every visit PUT back exactly what it had just read. That overwrote a
 * change made elsewhere since the page's GET with the page's copy. `saveSettings()` now sends nothing while the
 * fields match what was last loaded or saved.
 *
 * Runs as the secondary account, and puts its settings row back afterwards.
 */

const SETTINGS_URL = () => `${apiUrl()}/api/planner/settings`
/** The view's debounce, plus room for the PUT to leave. */
const SAVE_WINDOW_MS = 1_500

function settingsWrites(page: Page): Request[] {
	const writes: Request[] = []
	page.on('request', request => {
		if (request.method() === 'PUT' && new URL(request.url()).pathname.endsWith('/api/planner/settings')) {
			writes.push(request)
		}
	})
	return writes
}

async function storedSettings(page: Page): Promise<Record<string, unknown>> {
	const response = await page.request.get(SETTINGS_URL())
	expect(response.ok()).toBe(true)
	return (await response.json()) as Record<string, unknown>
}

async function openViewDefaults(page: Page) {
	const loaded = page.waitForResponse(
		response => response.request().method() === 'GET' && response.url().endsWith('/api/planner/settings'),
	)
	await page.goto('/day-planner/settings?tab=viewDefaults')
	await loaded
}

test.describe('Autosave (/day-planner/settings — View Defaults)', () => {
	let original: Record<string, unknown> | null = null

	test.beforeEach(async ({ secondaryPage: page }) => {
		original = await storedSettings(page)
	})

	test.afterEach(async ({ secondaryPage: page }) => {
		if (original) await page.request.put(SETTINGS_URL(), { data: original })
		original = null
	})

	test('opening the page writes nothing; a change writes once, with the change in it', async ({
		secondaryPage: page,
	}) => {
		const writes = settingsWrites(page)
		await openViewDefaults(page)
		const arrowKeys = page.getByRole('checkbox', { name: 'Arrow key date navigation' })
		await expect(arrowKeys).toBeChecked({ checked: original!.arrowKeyNavEnabled as boolean })

		// A save is the presence of a request, so its absence needs the debounce to have run out.
		await page.waitForTimeout(SAVE_WINDOW_MS)
		expect(writes, 'loading the page sent a PUT').toHaveLength(0)

		const saved = page.waitForResponse(
			response => response.request().method() === 'PUT' && response.url().endsWith('/api/planner/settings'),
		)
		await arrowKeys.click()
		expect((await saved).ok()).toBe(true)
		await page.waitForTimeout(SAVE_WINDOW_MS)
		expect(writes).toHaveLength(1)
		expect(writes[0].postDataJSON()).toMatchObject({ arrowKeyNavEnabled: !original!.arrowKeyNavEnabled })
		expect((await storedSettings(page)).arrowKeyNavEnabled).toBe(!original!.arrowKeyNavEnabled)
	})

	test('a change made elsewhere while the page is open is not overwritten by the visit', async ({
		secondaryPage: page,
	}) => {
		const writes = settingsWrites(page)
		await openViewDefaults(page)
		// Another tab, or another device, changes the row after this page read it.
		const elsewhere = { ...original!, slotDurationMinutes: original!.slotDurationMinutes === 15 ? 30 : 15 }
		const put = await page.request.put(SETTINGS_URL(), { data: elsewhere })
		expect(put.ok()).toBe(true)

		await page.waitForTimeout(SAVE_WINDOW_MS)
		expect(writes, 'the page wrote its stale copy back').toHaveLength(0)
		expect((await storedSettings(page)).slotDurationMinutes).toBe(elsewhere.slotDurationMinutes)
	})
})
