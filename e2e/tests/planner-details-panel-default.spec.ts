import type { Page } from '@playwright/test'
import { expect, seedDateParam, test } from '../fixtures/auth'

/**
 * OP2: "Show details panel by default" (`detailsPanelExpandedByDefault`) decides whether the day view's
 * side panel starts open. Before OP2 a wide planner showed the panel whatever the setting said.
 *
 * Route-patched: the `GET planner/settings` response carries the flag, so the saved settings row (which
 * the settings specs and every other planner spec read) is never written. Only GETs are patched.
 */
const WIDE = { width: 1600, height: 900 }
const NARROW = { width: 700, height: 900 }

async function setDefault(page: Page, expanded: boolean) {
	await page.route('**/api/planner/settings', async route => {
		if (route.request().method() !== 'GET') return route.continue()
		const response = await route.fetch()
		const body = await response.json()
		await route.fulfill({ response, json: { ...body, detailsPanelExpandedByDefault: expanded } })
	})
}

/**
 * The panel's own title block (heading, close button, Details/Routine toggle). The panel is `v-show`n, so a
 * closed panel keeps it in the DOM but hidden. Scoped to the card title because a compact day header carries
 * a "Panel section" toggle of its own, and a bare role locator would match that one.
 */
function panelBody(page: Page) {
	return page.locator('.v-card-title').filter({ has: page.getByRole('group', { name: 'Panel section' }) })
}

/** The day header's menu button; its name flips with the panel state. */
function headerToggle(page: Page, name: 'Open panel' | 'Close panel') {
	return page.locator('.header-bar').getByRole('button', { name })
}

async function waitForDay(page: Page) {
	await expect(page.locator('.header-bar')).toBeVisible({ timeout: 15_000 })
	await expect(page.locator('.task-block').first()).toBeVisible({ timeout: 15_000 })
}

async function openDay(page: Page, dateParam: string) {
	await page.goto(`/day-planner/${dateParam}`)
	await waitForDay(page)
}

test.describe('Details panel default on the day view (/day-planner/:date)', () => {
	test.describe('setting off, wide screen', () => {
		test.beforeEach(async ({ authenticatedPage: page }) => {
			await page.setViewportSize(WIDE)
			await setDefault(page, false)
		})

		test('starts closed after a full load and after a full reload', async ({ authenticatedPage: page, seed }) => {
			await openDay(page, seedDateParam(seed))
			await expect(panelBody(page)).toBeHidden()
			await expect(headerToggle(page, 'Open panel')).toBeVisible()

			// The settings arrive after mount on a reload too, so the watcher has to apply them again.
			await page.reload()
			await waitForDay(page)
			await expect(panelBody(page)).toBeHidden()
			await expect(headerToggle(page, 'Open panel')).toBeVisible()
		})

		test('starts closed after in-app navigation from the month view', async ({ authenticatedPage: page }) => {
			await page.goto('/day-planner')
			await page.locator('.day-cell[role="button"]').first().click()
			await expect(page).toHaveURL(/\/day-planner\/[^/]+$/)
			await expect(page.locator('.header-bar')).toBeVisible({ timeout: 15_000 })
			await expect(panelBody(page)).toBeHidden()
			await expect(headerToggle(page, 'Open panel')).toBeVisible()
		})

		test('the header menu button opens the panel and the close button closes it', async ({
			authenticatedPage: page,
			seed,
		}) => {
			await openDay(page, seedDateParam(seed))
			await expect(panelBody(page)).toBeHidden()

			await headerToggle(page, 'Open panel').click()
			await expect(panelBody(page)).toBeVisible()
			await expect(headerToggle(page, 'Close panel')).toBeVisible()

			// The panel's own X, not the header's.
			await panelBody(page).getByRole('button', { name: 'Close panel' }).click()
			await expect(panelBody(page)).toBeHidden()
			await expect(headerToggle(page, 'Open panel')).toBeVisible()
		})
	})

	test('setting on: a wide screen starts with the panel open', async ({ authenticatedPage: page, seed }) => {
		await page.setViewportSize(WIDE)
		await setDefault(page, true)
		await openDay(page, seedDateParam(seed))

		await expect(panelBody(page)).toBeVisible()
		await expect(headerToggle(page, 'Close panel')).toBeVisible()
	})

	for (const expanded of [false, true]) {
		test(`setting ${expanded ? 'on' : 'off'}: a narrow screen starts with the panel closed`, async ({
			authenticatedPage: page,
			seed,
		}) => {
			await page.setViewportSize(NARROW)
			await setDefault(page, expanded)
			await openDay(page, seedDateParam(seed))

			await expect(panelBody(page)).toBeHidden()
			await expect(headerToggle(page, 'Open panel')).toBeVisible()
		})
	}
})
