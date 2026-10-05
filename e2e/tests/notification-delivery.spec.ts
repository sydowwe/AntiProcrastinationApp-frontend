import type { Page } from '@playwright/test'
import { apiUrl, expect, reseed, test } from '../fixtures/auth'

// notifications/B4 + P5 — §S3 and §S4 in prompts/view-docs/units/_submodule/_fix-queue.md. Both are server rules,
// so the assertions are on what the API did (rows, status codes) as well as on what the settings screen says.
//
// §S3: the dispatcher counted a stored preference for every channel, never asking whether the deployment can
//      deliver on it. Push is default-on and unconfigured here, so muting In-app still wrote the history row while the
//      screen said "not even in the notification list".
// §S4: `Test` is a dev/QA probe. It is offered, and raisable, to administrators only.
//
// The `Test` kind is used because it is the one an account can raise on demand; only `adminUser` can.

const PREFERENCES = '/nastavenia/pripomienky'

/** The API is its own origin (the Vite server does not proxy it); the auth cookie is shared across ports on localhost. */
function api(path: string): string {
	return `${apiUrl()}/api${path}`
}

function testInApp(page: Page) {
	return page.getByRole('checkbox', { name: /Test.*In-app|In-app.*Test/ })
}

async function unreadCount(page: Page): Promise<number> {
	const response = await page.request.get(api('/notification/unread-count'))
	expect(response.status()).toBe(200)
	return (await response.json()).count
}

async function newestNotificationId(page: Page): Promise<number | null> {
	const response = await page.request.get(api('/notification/mine?limit=1'))
	expect(response.status()).toBe(200)
	const rows = await response.json()
	return rows[0]?.id ?? null
}

async function webPushConfigured(page: Page): Promise<boolean> {
	const response = await page.request.get(api('/notification-preference/channels'))
	const channels: { channel: string; configured: boolean }[] = await response.json()
	return channels.find(c => c.channel === 'WebPush')?.configured ?? false
}

test.describe(`Test kind is admin-only (${PREFERENCES}) — §S4 / P5`, () => {
	test('an ordinary account is not offered a Test row, but still gets the rest of the matrix', async ({ authenticatedPage: page }) => {
		await page.goto(PREFERENCES)
		await expect(page.getByRole('rowheader', { name: 'Personal reminder', exact: true })).toBeVisible({ timeout: 15_000 })
		await expect(page.getByRole('rowheader', { name: 'Test', exact: true })).toHaveCount(0)
		await expect(testInApp(page)).toHaveCount(0)
	})

	test('an administrator is still offered it', async ({ adminPage: page }) => {
		await page.goto(PREFERENCES)
		await expect(page.getByRole('rowheader', { name: 'Test', exact: true })).toBeVisible({ timeout: 15_000 })
		await expect(testInApp(page)).toHaveCount(1)
	})

	test('the server refuses an ordinary account a Test preference and a Test notification', async ({ authenticatedPage: page }) => {
		const write = await page.request.put(api('/notification-preference'), {
			data: { type: 'Test', channel: 'InApp', enabled: false },
		})
		expect(write.status()).toBe(400)

		const before = await unreadCount(page)
		const raise = await page.request.post(api('/notification/test'))
		expect(raise.status()).toBe(403)
		expect(await unreadCount(page)).toBe(before)
	})
})

test.describe(`A muted type does not reach the inbox — §S3 / B4`, () => {
	// The mutation is a real preference write on the admin account, and the probe raises real rows.
	test.describe.configure({ mode: 'serial', timeout: 60_000 })
	test.use({ freshSeed: true })

	test.afterAll(async () => {
		test.setTimeout(60_000)
		await reseed()
	})

	test('unticking In-app, with Push and E-mail unconfigured, silences the type end to end', async ({ adminPage: page }) => {
		test.skip(await webPushConfigured(page), 'Web Push is configured here, so In-app off is not "silenced" — the premise is gone.')

		await page.goto(PREFERENCES)
		const box = testInApp(page)
		await expect(box).toBeChecked({ timeout: 15_000 })

		const muted = page.waitForResponse(r => r.url().includes('/api/notification-preference') && r.request().method() === 'PUT')
		await box.click()
		expect((await muted).status()).toBe(204)
		await expect(box).not.toBeChecked()
		// The screen's promise, which the server now keeps.
		await expect(page.getByText(/not even in the notification list/)).toBeVisible()

		const unreadBefore = await unreadCount(page)
		const newestBefore = await newestNotificationId(page)
		const raised = await page.request.post(api('/notification/test'))
		expect(raised.status()).toBe(204)

		expect(await unreadCount(page)).toBe(unreadBefore)
		expect(await newestNotificationId(page)).toBe(newestBefore)

		// And it is not reachable from the inbox either.
		await page.goto('/notifikacie?type=Test')
		await expect(page.getByRole('main').getByText('Test notification')).toHaveCount(0)
	})

	test('control: with In-app left on, the same probe does land', async ({ adminPage: page }) => {
		const unreadBefore = await unreadCount(page)
		const raised = await page.request.post(api('/notification/test'))
		expect(raised.status()).toBe(204)
		expect(await unreadCount(page)).toBe(unreadBefore + 1)
	})

	test('re-ticking In-app after muting it makes the type reach the inbox again', async ({ adminPage: page }) => {
		test.skip(await webPushConfigured(page), 'Web Push is configured here.')

		await page.goto(PREFERENCES)
		const box = testInApp(page)
		await expect(box).toBeChecked({ timeout: 15_000 })

		const off = page.waitForResponse(r => r.url().includes('/api/notification-preference') && r.request().method() === 'PUT')
		await box.click()
		expect((await off).status()).toBe(204)

		const on = page.waitForResponse(r => r.url().includes('/api/notification-preference') && r.request().method() === 'PUT')
		await box.click()
		expect((await on).status()).toBe(204)

		const unreadBefore = await unreadCount(page)
		expect((await page.request.post(api('/notification/test'))).status()).toBe(204)
		expect(await unreadCount(page)).toBe(unreadBefore + 1)
	})
})
