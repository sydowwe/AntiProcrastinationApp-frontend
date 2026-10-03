import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'
import { apiUrl } from '../fixtures/seed'

/**
 * OP4 (`docs/opportunities.md`): `User.weatherLocation` was stored, accepted and returned by the API
 * and had no client writer, so the leisure weather fit (`GET /leisure-weather-fit`) always answered
 * "no signal". These specs cover the writer (`/user/settings` → Preferences) and the picker's
 * "set your town" hint.
 *
 * Every test writes the primary user's `weatherLocation`, a fixture account field, so each one
 * clears it through the API afterwards instead of opting into `freshSeed` — the clear is one PUT
 * and leaves every other fixture row alone. Server state is read back through `GET /user/data`
 * rather than the field: the user store persists in localStorage and assigns optimistically, so a
 * reload alone would show a value the server dropped (see `useUserPreferences.ts`, B3).
 */
test.describe.configure({ mode: 'serial' })

const FIELD_LABEL = 'Your town, for the weather'
const HINT_TEXT = 'Some of your activities depend on the weather'
const HINT_STORAGE_PREFIX = 'leisure.weatherLocationHintDismissed'

async function setWeatherLocation(page: Page, weatherLocation: string) {
	const saved = await page.request.put(`${apiUrl()}/api/user/preferences`, { data: { weatherLocation } })
	expect(saved.ok(), `could not set weatherLocation to "${weatherLocation}"`).toBe(true)
}

async function storedWeatherLocation(page: Page): Promise<string | null> {
	const response = await page.request.get(`${apiUrl()}/api/user/data`)
	expect(response.ok()).toBe(true)
	return ((await response.json()) as { weatherLocation: string | null }).weatherLocation
}

test.afterEach(async ({ authenticatedPage }) => {
	await setWeatherLocation(authenticatedPage, '')
	// The fixture writes the context's storage state back after each test, localStorage included, so a
	// dismissal left here would hide the hint from every later run on this machine.
	await authenticatedPage.evaluate(prefix => {
		for (const key of Object.keys(localStorage)) {
			if (key.startsWith(prefix)) localStorage.removeItem(key)
		}
	}, HINT_STORAGE_PREFIX)
})

test.describe('Weather location preference (/user/settings — Preferences)', () => {
	test('a typed town saves on blur, trimmed, and is read back after a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/user/settings')
		const field = authenticatedPage.getByRole('textbox', { name: FIELD_LABEL })
		await expect(field).toHaveValue('')

		const put = authenticatedPage.waitForRequest(
			request => request.method() === 'PUT' && request.url().endsWith('/api/user/preferences'),
		)
		await field.fill('  Košice, Slovakia  ')
		await field.press('Tab')
		// Only this key: a partial update that also sent the others would overwrite them with defaults.
		expect((await put).postDataJSON()).toEqual({ weatherLocation: 'Košice, Slovakia' })
		await expect(authenticatedPage.getByText('Preference saved')).toBeVisible()

		expect(await storedWeatherLocation(authenticatedPage)).toBe('Košice, Slovakia')
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByRole('textbox', { name: FIELD_LABEL })).toHaveValue('Košice, Slovakia')
	})

	test('Enter saves once, not again on the blur that follows', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/user/settings')
		const field = authenticatedPage.getByRole('textbox', { name: FIELD_LABEL })

		const puts: string[] = []
		authenticatedPage.on('request', request => {
			if (request.method() === 'PUT' && request.url().endsWith('/api/user/preferences')) {
				puts.push(request.postData() ?? '')
			}
		})
		await field.fill('Bratislava')
		await field.press('Enter')
		await expect(authenticatedPage.getByText('Preference saved')).toBeVisible()
		await field.press('Tab')

		expect(await storedWeatherLocation(authenticatedPage)).toBe('Bratislava')
		expect(puts).toHaveLength(1)
	})

	test('emptying the field clears the server value', async ({ authenticatedPage }) => {
		await setWeatherLocation(authenticatedPage, 'Košice')
		await authenticatedPage.goto('/user/settings')
		const field = authenticatedPage.getByRole('textbox', { name: FIELD_LABEL })
		await expect(field).toHaveValue('Košice')

		await field.fill('')
		await field.press('Tab')
		await expect(authenticatedPage.getByText('Preference saved')).toBeVisible()

		// `''` on the request is the server's clear; it stores `null`.
		expect(await storedWeatherLocation(authenticatedPage)).toBeNull()
	})

	test('the input cannot exceed the server limit of 120 characters', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/user/settings')
		await expect(authenticatedPage.getByRole('textbox', { name: FIELD_LABEL })).toHaveAttribute('maxlength', '120')
	})
})

test.describe('"Set your town" hint (/leisure/pick)', () => {
	/**
	 * The seeded backlog row (Read a Novel) is filed under *None*, which takes no part in weather
	 * matching, so the hint correctly stays hidden on the bare fixture. Rewriting that row's code to a
	 * real dependency on the wire is the smallest change that makes the location matter — the same
	 * technique `leisure-backlog-picker.draft.spec.ts` uses for the weather fit itself.
	 */
	async function makeBacklogWeatherDependent(page: Page) {
		await page.route('**/api/activity-backlog-profile/grid', async route => {
			const response = await route.fetch()
			const body = (await response.json()) as { items: { weatherDependencyCode: string | null }[] }
			for (const item of body.items) item.weatherDependencyCode = 'sunny'
			await route.fulfill({ response, json: body })
		})
	}

	async function openPicker(page: Page) {
		const hydrated = page.waitForResponse('**/api/user/data')
		await page.goto('/leisure/pick')
		await hydrated
		await page.getByText('Read a Novel').waitFor()
	}

	test('hidden when no activity depends on the weather', async ({ authenticatedPage }) => {
		await openPicker(authenticatedPage)
		await expect(authenticatedPage.getByText(HINT_TEXT)).toHaveCount(0)
	})

	test('shown with no location set, and links to the settings page', async ({ authenticatedPage }) => {
		await makeBacklogWeatherDependent(authenticatedPage)
		await openPicker(authenticatedPage)
		await expect(authenticatedPage.getByText(HINT_TEXT)).toBeVisible()

		await authenticatedPage.getByRole('link', { name: 'Set your town' }).click()
		await expect(authenticatedPage).toHaveURL(/\/user\/settings$/)
	})

	test('hidden once a location is set', async ({ authenticatedPage }) => {
		await setWeatherLocation(authenticatedPage, 'Košice')
		await makeBacklogWeatherDependent(authenticatedPage)
		await openPicker(authenticatedPage)
		await expect(authenticatedPage.getByText(HINT_TEXT)).toHaveCount(0)
	})

	test('stays dismissed across a reload', async ({ authenticatedPage }) => {
		await makeBacklogWeatherDependent(authenticatedPage)
		await openPicker(authenticatedPage)
		const hint = authenticatedPage.getByRole('alert').filter({ hasText: HINT_TEXT })
		await hint.getByRole('button', { name: 'Close' }).click()
		await expect(authenticatedPage.getByText(HINT_TEXT)).toHaveCount(0)

		await openPicker(authenticatedPage)
		await expect(authenticatedPage.getByText(HINT_TEXT)).toHaveCount(0)
	})
})
