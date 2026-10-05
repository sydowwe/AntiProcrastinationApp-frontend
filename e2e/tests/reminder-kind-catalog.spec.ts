import type { Page } from '@playwright/test'
import { expect, reseed, test } from '../fixtures/auth'

// notifications/B3, §S2 — the Reminder types card on /nastavenia/pripomienky.
//
// It used to list only kinds the user had already stored a row for, and nothing in the UI created one, so it
// could never mute anything. The server now returns a catalog (`kinds`, every kind the deployment can raise with
// its effective `enabled`), and the card renders that.
//
// These write the primary user's real preference, so the block reseeds before each test and once after the last
// (the convention for any spec that mutates a fixture account). The read-only half, "a fresh account is offered
// the switch, on", lives in `notifications.draft.spec.ts`.

const PREFERENCES = '/nastavenia/pripomienky'
const KIND_ENDPOINT = '**/api/reminder-preference/kind'

test.describe(`Reminder types — muting a kind (${PREFERENCES})`, () => {
	test.describe.configure({ mode: 'serial', timeout: 60_000 })
	test.use({ freshSeed: true })

	test.afterAll(async () => {
		test.setTimeout(60_000)
		await reseed()
	})

	function card(page: Page) {
		return page.locator('.v-card').filter({ has: page.getByText('Reminder types', { exact: true }) })
	}

	function kindSwitch(page: Page) {
		return card(page).getByRole('checkbox', { name: 'Personal reminders' })
	}

	test.beforeEach(async ({ authenticatedPage: page }) => {
		await page.goto(PREFERENCES)
		await expect(kindSwitch(page)).toBeChecked({ timeout: 15_000 })
	})

	test('switching the kind off sends the opt-out, says so, and survives a reload', async ({ authenticatedPage: page }) => {
		const request = page.waitForRequest(r => r.url().includes('/api/reminder-preference/kind') && r.method() === 'PUT')
		await kindSwitch(page).click()

		expect((await request).postDataJSON()).toEqual({ ownerModule: 'Portal', kind: 'PersonalReminder', enabled: false })
		await expect(card(page).getByText('Muted')).toBeVisible()
		await expect(page.getByText('Preference was saved')).toBeVisible()

		await page.reload()
		await expect(kindSwitch(page)).not.toBeChecked({ timeout: 15_000 })
		await expect(card(page).getByText('Muted')).toBeVisible()
	})

	test('switching it back on is stored as an explicit opt-in', async ({ authenticatedPage: page }) => {
		// Wait for the first write to be answered, not for the hint: "Muted" flips optimistically, so clicking
		// again on it races the first PUT against the second and the server keeps whichever lands last.
		const muted = page.waitForResponse(r => r.url().includes('/api/reminder-preference/kind') && r.request().method() === 'PUT')
		await kindSwitch(page).click()
		expect((await muted).status()).toBe(204)
		await expect(card(page).getByText('Muted')).toBeVisible()

		const unmuted = page.waitForResponse(r => r.url().includes('/api/reminder-preference/kind') && r.request().method() === 'PUT')
		await kindSwitch(page).click()
		const answered = await unmuted
		expect(answered.request().postDataJSON()).toMatchObject({ kind: 'PersonalReminder', enabled: true })
		// Reload only once the server has answered: the GET after it would otherwise race the write.
		expect(answered.status()).toBe(204)

		await page.reload()
		await expect(kindSwitch(page)).toBeChecked({ timeout: 15_000 })
		await expect(card(page).getByText('Delivered')).toBeVisible()
	})

	// The card's own revert path: the toggle is optimistic, and a failed write must put the switch back so the
	// screen keeps matching the server.
	test('a failed write puts the switch back on', async ({ authenticatedPage: page }) => {
		await page.route(KIND_ENDPOINT, route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))

		await kindSwitch(page).click()

		await expect(kindSwitch(page)).toBeChecked()
		await expect(card(page).getByText('Delivered')).toBeVisible()
		await page.unroute(KIND_ENDPOINT)
	})

	// The catalog is a union: a server that returns no `kinds` must not blank the card.
	test('a server without the catalog still shows the rows it stored', async ({ authenticatedPage: page }) => {
		await page.route('**/api/reminder-preference', route =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ kindPreferences: [{ ownerModule: 'Portal', kind: 'PersonalReminder', enabled: false }] }),
			}),
		)

		await page.reload()

		await expect(kindSwitch(page)).not.toBeChecked({ timeout: 15_000 })
		await page.unroute('**/api/reminder-preference')
	})
})
