// Two-factor authentication, end to end: enrolment on `/user/settings` and the code dialog on `/login`.
//
// Its own file, and not `auth.spec.ts`, because of `POST /auth/login`'s throttle — 5 hits per minute per
// client IP, hits not failures (see fixtures/auth.ts). A run opens with two cold sign-ins and `auth.spec.ts`
// spends two more within the same minute; the two below made a sixth, which is a 429 that renders as a stuck
// `/login`. Alphabetical order puts this file after every other sign-in in the suite. Do not fold it back.
import { generate } from 'otplib'
import type { Page } from '@playwright/test'
import { apiUrl, expect, reseed, test, type SeedResponse } from '../fixtures/auth'

/** What `/user/2fa/toggle` and `/user/2fa/reset` answer with (`TwoFactorAuthResponse` in the API). */
interface TwoFactorAuthResponse {
	twoFactorEnabled: boolean
	qrCode?: string
	/** The base32 authenticator key the QR encodes — what `otplib` generates codes from. Sent whenever `qrCode` is (B22). */
	sharedKey?: string
	recoveryCodes?: string[]
}

/** Uppercase base32, no padding — the form Identity stores the authenticator key in and `otplib` reads. */
const BASE32_KEY = /^[A-Z2-7]+$/

/**
 * Enables 2FA on `secondaryUser` through the app's own API and returns the response.
 *
 * `api` must carry that account's cookies — `secondaryPage.request` does (see
 * `fixtures/dayPlannerTemplates.ts` on why a page's request context reaches `:8080` signed in). The
 * identity gate wants only the password while 2FA is still off.
 */
async function enableTwoFactorViaApi(api: Page['request'], seed: SeedResponse): Promise<TwoFactorAuthResponse> {
	const response = await api.post(`${apiUrl()}/api/user/2fa/toggle`, {
		data: { password: seed.secondaryUser.password },
	})
	if (!response.ok()) {
		throw new Error(`POST /api/user/2fa/toggle returned HTTP ${response.status()}: ${await response.text()}`)
	}
	return (await response.json()) as TwoFactorAuthResponse
}

/** Signs in through the form and returns the 2FA dialog, which a 2FA-enabled account gets instead of `/`. */
async function signInToCodeDialog(page: Page, seed: SeedResponse) {
	await page.goto('/login')
	await page.getByRole('textbox', { name: 'Email' }).fill(seed.secondaryUser.email)
	await page.getByRole('textbox', { name: 'Password' }).fill(seed.secondaryUser.password)
	await page.getByRole('button', { name: 'Log in' }).click()

	const dialog = page.getByRole('dialog', { name: 'Two-factor authentication' })
	await expect(dialog).toBeVisible()
	return dialog
}

/** A six-digit code that is NOT the one the authenticator would produce right now. */
async function wrongCodeFor(sharedKey: string): Promise<string> {
	const valid = await generate({ secret: sharedKey })
	return valid === '000000' ? '111111' : '000000'
}

// Runs on `secondaryUser` because `primaryUser` signs in everywhere (enabling 2FA on it would gate every
// spec's `authenticatedPage`) and `adminUser` is the only account with the `Admin` role. The enrolment
// is a real, persisted security-state change on that account, so the block reseeds before each test and
// once more after the last one — the cached storage state survives a reseed, so `secondaryPage` keeps
// working for the specs after this file.
//
// The code the spec types comes from `otplib` over the `sharedKey` the enrolment response returns next to
// its QR (B22 — until then the secret only ever left the server as a PNG, which is why this dialog had no
// automated coverage: `docs/views/_fix-queue.md` auth/U2).
test.describe('Two-factor authentication (/user/settings enrolment → /login code dialog)', () => {
	// The budget covers fixtures too, and each test here pays for a reseed (plus a cold sign-in for the
	// first) before its first assertion. Warm, that is ~1.5 s; against an API that has just started it
	// measured 24 s (2026-09-21), and the default 30 s then dies at a random later click with "Target page
	// … has been closed" — which reads as the app, not the clock.
	test.describe.configure({ mode: 'serial', timeout: 60_000 })
	test.use({ freshSeed: true })

	test.afterAll(async () => {
		// Leave `secondaryUser` the way the fixture describes it: 2FA off, so a later cold sign-in of
		// that account (if its cached state is ever lost) does not land in the code dialog. The hook
		// has its own budget, not the describe's — same cold-API reseed, same reason for 60 s.
		test.setTimeout(60_000)
		await reseed()
	})

	test('enabling 2FA in settings shows the QR with its manual-entry key, then the recovery codes (user-settings/U1)', async ({
		secondaryPage,
		seed,
	}) => {
		await secondaryPage.goto('/user/settings')
		// Let the hydration write land first. The fixture accounts are seeded in UTC and this browser is
		// not, so with `syncBrowserTimeZone` the first `hydrateFromServer()` pushes a `PUT /user/preferences`;
		// a PUT still saving when the toggle below loads the user row makes the toggle's own save fail
		// Identity's concurrency check (400 "Optimistic concurrency failure"). Before FW25 the page fired
		// three such PUTs and this test failed on every run without the wait; with one, it passes without
		// it too — the wait stays so the spec does not depend on winning a race (user-settings/B3).
		await secondaryPage.waitForLoadState('networkidle')

		// `VSwitch` renders a checkbox, not a `switch` role.
		const twoFactorSwitch = secondaryPage.getByRole('checkbox', { name: 'Use two-factor authentication' })
		await expect(twoFactorSwitch).not.toBeChecked()
		await twoFactorSwitch.click()

		// The switch's click is preventDefault-ed: nothing changes until the identity check passes.
		const verify = secondaryPage.getByRole('dialog', { name: 'Identity verification' })
		await expect(verify).toBeVisible()
		await expect(twoFactorSwitch).not.toBeChecked()

		// A wrong password is the server's answer (401), not a lapsed session: the dialog says so and
		// stays, and the user stays signed in. Before `_credentialCheck` the interceptor refreshed,
		// resent the same wrong password and signed the user out on the retry's 401.
		const refused = secondaryPage.waitForResponse(
			r => r.url().endsWith('/api/user/2fa/toggle') && r.request().method() === 'POST',
		)
		await verify.getByRole('textbox', { name: 'Password' }).fill('not-the-password-1')
		await verify.getByRole('button', { name: 'Confirm' }).click()
		expect((await refused).status()).toBe(401)
		await expect(secondaryPage.getByText('Wrong password')).toBeVisible()
		await expect(verify).toBeVisible()
		await expect(secondaryPage).toHaveURL(/\/user\/settings$/)

		await verify.getByRole('textbox', { name: 'Password' }).fill(seed.secondaryUser.password)

		const toggleResponse = secondaryPage.waitForResponse(
			r => r.url().endsWith('/api/user/2fa/toggle') && r.request().method() === 'POST',
		)
		await verify.getByRole('button', { name: 'Confirm' }).click()
		const enrolment = (await (await toggleResponse).json()) as TwoFactorAuthResponse

		// The contract B22 landed: the key is a string next to the picture, present whenever the picture is.
		expect(enrolment.twoFactorEnabled).toBe(true)
		expect(enrolment.qrCode).toBeTruthy()
		expect(enrolment.sharedKey).toMatch(BASE32_KEY)
		expect(enrolment.recoveryCodes?.length).toBeGreaterThan(0)

		// First dialog: the QR to scan, and under it the same key for an authenticator that cannot scan.
		const qrDialog = secondaryPage.getByRole('dialog', { name: 'Enabling 2FA' })
		await expect(qrDialog).toBeVisible()
		await expect(qrDialog.getByRole('img', { name: 'QR code for 2FA' })).toBeVisible()
		await expect(qrDialog.getByText("Can't scan? Enter this key in your authenticator app instead:")).toBeVisible()
		// Rendered in groups of four for typing; the value underneath is the raw key.
		const shownKey = (await qrDialog.getByTestId('shared-key').innerText()).replace(/\s+/g, '')
		expect(shownKey).toBe(enrolment.sharedKey)
		await qrDialog.getByRole('button', { name: 'Done' }).click()
		await expect(qrDialog).toBeHidden()

		// Second dialog: the recovery codes, shown once, and not dismissable until acknowledged.
		const codesDialog = secondaryPage.getByRole('dialog', { name: 'Recovery codes' })
		await expect(codesDialog).toBeVisible()
		await expect(codesDialog.locator('code')).toHaveCount(enrolment.recoveryCodes!.length)
		const done = codesDialog.getByRole('button', { name: 'Done' })
		await expect(done).toBeDisabled()
		await codesDialog.getByRole('checkbox', { name: 'I have saved these codes somewhere safe' }).check()
		await expect(done).toBeEnabled()
		await done.click()
		await expect(codesDialog).toBeHidden()

		await expect(twoFactorSwitch).toBeChecked()
	})

	test('after the password, a 2FA-enabled account gets the code dialog: a wrong code sends you back to the form, the right one signs in (auth/U2)', async ({
		page,
		secondaryPage,
		seed,
	}) => {
		// `freshSeed` put the account back to 2FA-off; enrol it again, through the API this time — the
		// screen was covered above, and what is under test here is the sign-in side.
		const { sharedKey } = await enableTwoFactorViaApi(secondaryPage.request, seed)
		expect(sharedKey).toMatch(BASE32_KEY)

		// --- a wrong code ---
		let dialog = await signInToCodeDialog(page, seed)
		await expect(page).toHaveURL('/login')

		// Escape does not dismiss it: `MyDialog` is `persistent` by default (FW1 — undecided, so this
		// pins today's default rather than a fix). Cancel is the way out.
		await page.keyboard.press('Escape')
		await expect(dialog).toBeVisible()

		const rejected = page.waitForResponse(
			r => r.url().endsWith('/api/auth/login/2fa') && r.request().method() === 'POST',
		)
		await dialog.locator('.v-otp-input input').first().pressSequentially(await wrongCodeFor(sharedKey!))
		expect((await rejected).status()).toBe(401)
		// The pending token is single-use, so the dialog does not invite a retry it knows will fail: it
		// closes, says so, and the form is there again with the e-mail kept.
		await expect(page.getByText('The code was not accepted. Sign in again to try a new one.')).toBeVisible()
		await expect(dialog).toBeHidden()
		await expect(page).toHaveURL('/login')
		await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(seed.secondaryUser.email)

		// --- the right code ---
		// A second password step, since the first one's token was spent by the wrong code.
		dialog = await signInToCodeDialog(page, seed)

		const accepted = page.waitForResponse(
			r => r.url().endsWith('/api/auth/login/2fa') && r.request().method() === 'POST',
		)
		await dialog.locator('.v-otp-input input').first().pressSequentially(await generate({ secret: sharedKey! }))
		// `NoContent`, not 200 — the session is set as cookies, the body is empty.
		expect((await accepted).status()).toBe(204)
		await expect(page).toHaveURL('/')
		await expect(page.getByRole('main').getByText('Day planner', { exact: true })).toBeVisible()
	})

	// FW11: `LoginVerifyQrCode.submit()` ends in a literal `router.push('/')`, same as the password
	// and Google paths, so a `?redirect=` query is dropped on this path too. Fixme rather than pinning
	// today's `/`.
	test.fixme(
		'signing in through the code dialog from a deep-link redirect returns you to that link, not home (_fix-queue.md FW11)',
		async () => {},
	)
})
