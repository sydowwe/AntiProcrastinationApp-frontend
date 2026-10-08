import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP19: each session row on /user/settings carries its sign-in as an absolute date and time, a
 * "Remembered" chip marks a stay-logged-in session, and the Appearance card's "Last login" row renders
 * from `lastLoginAt`.
 *
 * Route-patched on both wires: the API this suite runs against may predate the change (it needs the
 * `RefreshTokenSessionStartedAt` migration and a restart), so neither `GET /user/sessions` nor
 * `GET /user/data` is trusted for the new fields. Patching also keeps the fixture read-only; no session
 * is revoked or created.
 *
 * Instants relative to "now" (last used, last login) are derived in the page from its own clock, so the
 * relative wording does not drift with the machine's date. The sign-in is a fixed instant far in the
 * past, which is the point: it must not read as "x weeks ago". The expected date and time are computed
 * in the page too (en-US, whitespace normalised) rather than typed, because the rendered form follows
 * the browser's time zone.
 */
const SIGNED_IN_AT = '2026-03-09T09:15:00Z'

const CURRENT_IP = '203.0.113.10'
const REMEMBERED_IP = '203.0.113.20'
const PLAIN_IP = '203.0.113.30'

interface Offsets {
	currentUsedMinAgo: number
	otherUsedMinAgo: number
	lastLoginMinAgo: number | null
}

async function isoAgo(page: Page, minutes: number) {
	// +10 s so "5 minutes ago" stays 5 for the whole run instead of ticking over to "6".
	return page.evaluate(m => new Date(Date.now() - m * 60_000 - 10_000).toISOString(), minutes)
}

async function patchWires(page: Page, { currentUsedMinAgo, otherUsedMinAgo, lastLoginMinAgo }: Offsets) {
	const currentUsed = await isoAgo(page, currentUsedMinAgo)
	const otherUsed = await isoAgo(page, otherUsedMinAgo)
	const lastLogin = lastLoginMinAgo == null ? null : await isoAgo(page, lastLoginMinAgo)

	await page.route('**/api/user/sessions', async route => {
		if (route.request().method() !== 'GET') return route.fallback()
		await route.fulfill({
			json: [
				{
					id: 'e2e-session-current',
					device: 'Desktop',
					browser: 'Chrome',
					ip: CURRENT_IP,
					lastUsedAt: currentUsed,
					createdAt: SIGNED_IN_AT,
					stayLoggedIn: false,
					isCurrent: true,
				},
				{
					id: 'e2e-session-remembered',
					device: 'Phone',
					browser: 'Firefox',
					ip: REMEMBERED_IP,
					lastUsedAt: otherUsed,
					createdAt: SIGNED_IN_AT,
					stayLoggedIn: true,
					isCurrent: false,
				},
				{
					id: 'e2e-session-plain',
					device: 'Tablet',
					browser: 'Safari',
					ip: PLAIN_IP,
					lastUsedAt: otherUsed,
					createdAt: SIGNED_IN_AT,
					stayLoggedIn: false,
					isCurrent: false,
				},
			],
		})
	})

	await page.route('**/api/user/data', async route => {
		if (route.request().method() !== 'GET') return route.fallback()
		const response = await route.fetch()
		const body = (await response.json()) as Record<string, unknown>
		if (lastLogin == null) delete body.lastLoginAt
		else body.lastLoginAt = lastLogin
		await route.fulfill({ response, json: body })
	})
}

async function openSettings(page: Page, offsets: Offsets) {
	await patchWires(page, offsets)
	// Settle the patched /user/data call before the test body can end, or its route callback outlives the page.
	const userData = page.waitForResponse(r => r.url().endsWith('/api/user/data') && r.request().method() === 'GET')
	await page.goto('/user/settings')
	await userData
	await page.getByRole('heading', { name: 'Active sessions' }).waitFor({ state: 'visible' })
}

function sessionRow(page: Page, ip: string): Locator {
	return page.locator('.v-list-item').filter({ hasText: ip })
}

/** What the row should say for the sign-in, in en-US, computed from the browser's own zone. */
async function expectedSignIn(page: Page) {
	return page.evaluate(iso => {
		const d = new Date(iso)
		const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
		const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
		return `${date} ${time}`.replace(/\s+/g, ' ')
	}, SIGNED_IN_AT)
}

function normalised(text: string | null) {
	return (text ?? '').replace(/\s+/g, ' ').trim()
}

test.describe('Session sign-in time and Remembered chip (/user/settings — "Active sessions")', () => {
	test('each row reads "<ip> · Signed in: <date and time> · Last used: <relative>", the sign-in being absolute', async ({
		authenticatedPage: page,
	}) => {
		await openSettings(page, { currentUsedMinAgo: 5, otherUsedMinAgo: 70, lastLoginMinAgo: 130 })

		const row = sessionRow(page, REMEMBERED_IP)
		await expect(row).toBeVisible()

		const signedIn = await expectedSignIn(page)
		await expect(row).toContainText(`${REMEMBERED_IP} · Signed in: ${signedIn} · Last used:`)

		// Absolute, not "3 weeks ago": the instant is months back, so a relative form would say so.
		const text = normalised(await row.textContent())
		const signedInPart = text.slice(text.indexOf('Signed in:'), text.indexOf('· Last used'))
		expect(signedInPart).not.toMatch(/ago/)
		expect(signedInPart).toMatch(/\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}/)

		// The two clocks on one row are different instants, in different forms.
		await expect(sessionRow(page, CURRENT_IP)).toContainText(`${CURRENT_IP} · Signed in: ${signedIn} · Last used: 5 minutes ago`)
		await expect(row).toContainText('Last used: an hour ago') // 70 min, inside dayjs's 45-89 min band
	})

	test('a stay-logged-in session gets a "Remembered" chip with a tooltip; the others do not', async ({ authenticatedPage: page }) => {
		await openSettings(page, { currentUsedMinAgo: 5, otherUsedMinAgo: 90, lastLoginMinAgo: 130 })

		const remembered = sessionRow(page, REMEMBERED_IP)
		await expect(remembered.getByText('Remembered', { exact: true })).toBeVisible()
		// Not the current device, so no "This device" chip beside it.
		await expect(remembered.getByText('This device', { exact: true })).toHaveCount(0)

		await expect(sessionRow(page, PLAIN_IP).getByText('Remembered', { exact: true })).toHaveCount(0)

		await remembered.getByText('Remembered', { exact: true }).hover()
		await expect(page.getByRole('tooltip')).toContainText('"Stay logged in" was ticked')
		await expect(page.getByRole('tooltip')).toContainText('30 days from its last use')
	})

	test('"This device" and "Remembered" sit together on a current session that is also remembered', async ({
		authenticatedPage: page,
	}) => {
		await page.route('**/api/user/sessions', async route => {
			if (route.request().method() !== 'GET') return route.fallback()
			await route.fulfill({
				json: [
					{
						id: 'e2e-session-current',
						device: 'Desktop',
						browser: 'Chrome',
						ip: CURRENT_IP,
						lastUsedAt: await isoAgo(page, 1),
						createdAt: SIGNED_IN_AT,
						stayLoggedIn: true,
						isCurrent: true,
					},
				],
			})
		})
		await page.goto('/user/settings')
		await page.getByRole('heading', { name: 'Active sessions' }).waitFor({ state: 'visible' })

		const row = sessionRow(page, CURRENT_IP)
		await expect(row.getByText('This device', { exact: true })).toBeVisible()
		await expect(row.getByText('Remembered', { exact: true })).toBeVisible()
	})

	test('a session without createdAt shows no "Signed in" part', async ({ authenticatedPage: page }) => {
		await page.route('**/api/user/sessions', async route => {
			if (route.request().method() !== 'GET') return route.fallback()
			await route.fulfill({
				json: [
					{
						id: 'e2e-session-old-api',
						device: 'Desktop',
						browser: 'Chrome',
						ip: CURRENT_IP,
						lastUsedAt: await isoAgo(page, 5),
						stayLoggedIn: false,
						isCurrent: true,
					},
				],
			})
		})
		await page.goto('/user/settings')
		await page.getByRole('heading', { name: 'Active sessions' }).waitFor({ state: 'visible' })

		const row = sessionRow(page, CURRENT_IP)
		await expect(row).toContainText(`${CURRENT_IP} · Last used: 5 minutes ago`)
		await expect(row).not.toContainText('Signed in')
	})
})

test.describe('Last login row (/user/settings — "Account info")', () => {
	test('renders from lastLoginAt as a relative time', async ({ authenticatedPage: page }) => {
		await openSettings(page, { currentUsedMinAgo: 5, otherUsedMinAgo: 90, lastLoginMinAgo: 130 })

		const label = page.getByText('Last login', { exact: true })
		await expect(label).toBeVisible()
		await expect(label.locator('..')).toContainText('2 hours ago')
	})

	test('is absent when lastLoginAt is missing', async ({ authenticatedPage: page }) => {
		await openSettings(page, { currentUsedMinAgo: 5, otherUsedMinAgo: 90, lastLoginMinAgo: null })

		// Wait on the neighbouring row so the absence is asserted on a rendered card, not an unloaded one.
		await expect(page.getByText('Member since', { exact: true })).toBeVisible()
		await expect(page.getByText('Last login', { exact: true })).toHaveCount(0)
	})
})
