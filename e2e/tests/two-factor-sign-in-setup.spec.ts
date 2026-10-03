// Forced 2FA setup at sign-in (opportunities OP12): the server says the password is right and 2FA is
// required, but the account has no authenticator yet (`requiresTwoFactorSetup`). The client must enrol it
// through `POST /auth/login/2fa/setup` — QR, recovery codes — and only then ask for the code.
//
// Its own file for the same reason `two-factor.spec.ts` is: `POST /auth/login` is throttled at 5 hits per
// minute per IP, and this spends one more.
//
// No fixture account is in that state (2FA on, no authenticator key), and the seed is not to be reshaped
// for one test. So the account is enrolled for real through the API, and two answers are rewritten on the
// way to the page: the password step's body gains `requiresTwoFactorSetup: true`, and the setup call is
// answered with the enrolment we already hold. Everything the server decides — the partial-auth cookie,
// the code, the session — is still the real server's: the final `POST /auth/login/2fa` is not touched.
import { generate } from 'otplib'
import type { Page } from '@playwright/test'
import { apiUrl, expect, reseed, test, type SeedResponse } from '../fixtures/auth'

interface TwoFactorAuthResponse {
	twoFactorEnabled: boolean
	qrCode?: string
	sharedKey?: string
	recoveryCodes?: string[]
}

async function enableTwoFactorViaApi(api: Page['request'], seed: SeedResponse): Promise<TwoFactorAuthResponse> {
	const response = await api.post(`${apiUrl()}/api/user/2fa/toggle`, {
		data: { password: seed.secondaryUser.password },
	})
	if (!response.ok()) {
		throw new Error(`POST /api/user/2fa/toggle returned HTTP ${response.status()}: ${await response.text()}`)
	}
	return (await response.json()) as TwoFactorAuthResponse
}

test.describe('Forced 2FA setup at sign-in (/login → enrol → code dialog)', () => {
	test.describe.configure({ mode: 'serial', timeout: 60_000 })
	test.use({ freshSeed: true })

	test.afterAll(async () => {
		test.setTimeout(60_000)
		await reseed()
	})

	test('a password sign-in that requires 2FA setup shows the QR, then the recovery codes, then the code dialog, and signs in', async ({
		page,
		secondaryPage,
		seed,
	}) => {
		const enrolment = await enableTwoFactorViaApi(secondaryPage.request, seed)
		expect(enrolment.sharedKey).toBeTruthy()
		expect(enrolment.recoveryCodes?.length).toBeGreaterThan(0)

		await page.route('**/api/auth/login', async route => {
			const response = await route.fetch()
			const body = (await response.json()) as { requiresTwoFactor: boolean }
			// The real answer for a 2FA account is `requiresTwoFactor: true`; only the setup flag is ours.
			expect(body.requiresTwoFactor).toBe(true)
			await route.fulfill({ response, json: { ...body, requiresTwoFactorSetup: true } })
		})
		let setupCalls = 0
		await page.route('**/api/auth/login/2fa/setup', async route => {
			setupCalls++
			await route.fulfill({ json: enrolment })
		})

		await page.goto('/login')
		await page.getByRole('textbox', { name: 'Email' }).fill(seed.secondaryUser.email)
		await page.getByRole('textbox', { name: 'Password' }).fill(seed.secondaryUser.password)
		await page.getByRole('button', { name: 'Log in' }).click()

		// The QR first — before this, the client went straight to a code dialog the user had nothing to
		// read a code from.
		const qrDialog = page.getByRole('dialog', { name: 'Set up two-factor authentication to continue' })
		await expect(qrDialog).toBeVisible()
		expect(setupCalls).toBe(1)
		await expect(qrDialog.getByRole('img', { name: 'QR code for 2FA' })).toBeVisible()
		const shownKey = (await qrDialog.getByTestId('shared-key').innerText()).replace(/\s+/g, '')
		expect(shownKey).toBe(enrolment.sharedKey)
		// `exact`: unanchored, this name also matches the QR dialog's "Set up two-factor authentication …".
		const codeDialog = page.getByRole('dialog', { name: 'Two-factor authentication', exact: true })
		await expect(codeDialog).toBeHidden()
		await qrDialog.getByRole('button', { name: 'Done' }).click()

		const codesDialog = page.getByRole('dialog', { name: 'Recovery codes' })
		await expect(codesDialog).toBeVisible()
		await expect(codesDialog.locator('code')).toHaveCount(enrolment.recoveryCodes!.length)
		await codesDialog.getByRole('checkbox', { name: 'I have saved these codes somewhere safe' }).check()
		await codesDialog.getByRole('button', { name: 'Done' }).click()

		// Then the code, against the real server, with the real pending cookie from the password step.
		await expect(codeDialog).toBeVisible()
		const accepted = page.waitForResponse(
			r => r.url().endsWith('/api/auth/login/2fa') && r.request().method() === 'POST',
		)
		await codeDialog.locator('.v-otp-input input').first().pressSequentially(await generate({ secret: enrolment.sharedKey! }))
		expect((await accepted).status()).toBe(204)
		await expect(page).toHaveURL('/')
		expect(await page.evaluate(() => localStorage.getItem('auth.lastUsedEmail'))).toBe(seed.secondaryUser.email)
	})
})
