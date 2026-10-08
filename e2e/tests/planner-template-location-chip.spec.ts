import type { Page } from '@playwright/test'
import { expect, seedDateParam, test } from '../fixtures/auth'

/**
 * OP18: a template whose Suggested location is the day's own gets a "Today: <location>" chip, on its
 * "Suggested for you" row and on its option in the "Choose template" list.
 *
 * Route-patched: no seeded day has a location, and writing one would change a fixture row every later
 * spec reads. The day's `by-date` response is the only thing patched. The fixture's templates carry the
 * locations (Home Office: Home, Relaxed Weekend: Home, Office Day: Office) and the server's own
 * suggestions for the seed date (a Monday) are Home Office ("Scheduled for Mondays") and Office Day
 * ("Suggested for Workdays"), so Relaxed Weekend is the location-only match.
 */
const CHIP = 'Today: Home'

async function patchLocation(page: Page, dateParam: string, location: string | null) {
	await page.route(`**/api/calendar/by-date/${dateParam}`, async route => {
		const response = await route.fetch()
		const body = await response.json()
		await route.fulfill({ response, json: { ...body, location } })
	})
}

async function openDay(page: Page, dateParam: string) {
	await page.goto(`/day-planner/${dateParam}`)
	await expect(page.getByText('Suggested for you')).toBeVisible({ timeout: 15_000 })
}

/** The suggestion rows, in order. Each is a `role="button"` carrying `aria-pressed`. */
function suggestionRows(page: Page) {
	return page.locator('.suggestion-item')
}

function suggestionRow(page: Page, name: string) {
	return suggestionRows(page).filter({ hasText: name })
}

async function openTemplateList(page: Page) {
	await page.locator('.v-field').filter({ hasText: 'Choose template' }).first().click()
	await expect(page.getByRole('option', { name: 'Home Office' })).toBeVisible()
}

test.describe('Location chip on the day template picker (/day-planner/:date)', () => {
	test('the matching templates carry "Today: Home" on the suggestion row and the list option', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const dateParam = seedDateParam(seed)
		await patchLocation(page, dateParam, 'Home')
		await openDay(page, dateParam)

		// A server suggestion whose template location matches.
		const homeOffice = suggestionRow(page, 'Home Office')
		await expect(homeOffice).toHaveCount(1)
		await expect(homeOffice.getByText(CHIP)).toBeVisible()
		await expect(homeOffice.getByText('Scheduled for Mondays')).toBeVisible()

		// A server suggestion whose template is elsewhere: its pattern chip, no location chip.
		const officeDay = suggestionRow(page, 'Office Day')
		await expect(officeDay).toHaveCount(1)
		await expect(officeDay.getByText('Suggested for Workdays')).toBeVisible()
		await expect(officeDay.getByText('Today:')).toHaveCount(0)

		await openTemplateList(page)
		const options = page.getByRole('option')
		await expect(options.filter({ hasText: 'Home Office' }).getByText(CHIP)).toBeVisible()
		await expect(options.filter({ hasText: 'Relaxed Weekend' }).getByText(CHIP)).toBeVisible()
		await expect(options.filter({ hasText: 'Office Day' })).toBeVisible()
		await expect(options.filter({ hasText: 'Office Day' }).getByText('Today:')).toHaveCount(0)
	})

	test('a location-only match is added at the end of Suggested, with no pattern chip', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const dateParam = seedDateParam(seed)
		await patchLocation(page, dateParam, 'Home')
		await openDay(page, dateParam)

		const rows = suggestionRows(page)
		await expect(rows).toHaveCount(3)
		// The server's two come first, in its order; the location match follows them.
		await expect(rows.nth(0)).toContainText('Home Office')
		await expect(rows.nth(1)).toContainText('Office Day')
		const last = rows.nth(2)
		await expect(last).toContainText('Relaxed Weekend')
		await expect(last.getByText(CHIP)).toBeVisible()
		await expect(last.getByText(/Scheduled for|Suggested for|Used on/)).toHaveCount(0)
	})

	test('a day at a location no template suggests adds no chip and no row', async ({ authenticatedPage: page, seed }) => {
		const dateParam = seedDateParam(seed)
		await patchLocation(page, dateParam, 'Travel')
		await openDay(page, dateParam)

		await expect(suggestionRows(page)).toHaveCount(2)
		await expect(suggestionRow(page, 'Relaxed Weekend')).toHaveCount(0)
		await expect(page.getByText('Today:')).toHaveCount(0)

		await openTemplateList(page)
		await expect(page.getByRole('option', { name: 'Relaxed Weekend' })).toBeVisible()
		await expect(page.getByText('Today:')).toHaveCount(0)
	})

	test('a day with no location shows no chips and only the server\'s suggestions', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const dateParam = seedDateParam(seed)
		await patchLocation(page, dateParam, null)
		await openDay(page, dateParam)

		await expect(suggestionRows(page)).toHaveCount(2)
		await expect(suggestionRow(page, 'Relaxed Weekend')).toHaveCount(0)

		await openTemplateList(page)
		await expect(page.getByRole('option', { name: 'Relaxed Weekend' })).toBeVisible()
		await expect(page.getByText('Today:')).toHaveCount(0)
	})
})
