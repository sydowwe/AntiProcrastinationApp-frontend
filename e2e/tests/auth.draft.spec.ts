import { expect, test } from '../fixtures/auth'

// `POST /auth/login` is throttled per caller (see fixtures/auth.ts's comment on the throttle — a
// cooldown well over a minute after a handful of attempts). This file deliberately never submits real
// credentials through the login form: `authenticatedPage` reuses a cached storage state instead of a
// fresh sign-in, and every login-form test here either submits nothing (validation only) or checks
// pure navigation/guard behaviour that needs no successful auth. Do not add a real credentialed
// `fill` + submit here without re-reading that comment first.

test.describe('Auth — signed-out views (/login, /registration, /forgotten-password)', () => {
	test.describe('LoginView (/login)', () => {
		test('renders the login form', async ({ page }) => {
			await page.goto('/login')
			await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
			await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible()
			await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
		})

		test('submitting empty fields shows required-field validation, no network call', async ({ page }) => {
			await page.goto('/login')
			await page.getByRole('button', { name: 'Log in' }).click()
			await expect(page.getByText('Email is required')).toBeVisible()
		})

		test('"Forgot password?" navigates to /forgotten-password', async ({ page }) => {
			await page.goto('/login')
			await page.getByRole('link', { name: 'Forgot password?' }).click()
			await expect(page).toHaveURL(/\/forgotten-password$/)
		})

		test('"Register" navigates to /registration', async ({ page }) => {
			await page.goto('/login')
			await page.getByRole('link', { name: 'Register' }).click()
			await expect(page).toHaveURL(/\/registration$/)
		})

		test('password field toggles between masked and visible text', async ({ page }) => {
			await page.goto('/login')
			const passwordInput = page.getByRole('textbox', { name: 'Password' })
			await expect(passwordInput).toHaveAttribute('type', 'password')
			// A1 fixed: the toggle has its own accessible name instead of Vuetify's "Password appended action".
			await page.getByRole('button', { name: /show password/i }).click()
			await expect(passwordInput).toHaveAttribute('type', 'text')
		})

		// B1: fixed (F39 writes `?redirect=`, FW11 reads it; the write half is asserted under *Router guard
		// behaviour* below). The read half needs a real sign-in through this form, which this file must not
		// spend — see the throttle note at the top; it would be the run's fifth `/auth/login` hit inside a
		// minute. Verified by hand with playwright-cli on 2026-09-23 (deep link, `https://…` and `//…`).
		test.fixme(
			'signing in from a deep-link redirect returns you to that link, not home (findings.md B1)',
			async () => {},
		)

		// U4: cannot safely reproduce without risking a real lockout on a shared seeded account.
		test.fixme(
			'shows a specific message for "too many failed attempts" and "locked out" (findings.md U4)',
			async () => {},
		)
	})

	test.describe('RegistrationView (/registration)', () => {
		test('renders the registration form', async ({ page }) => {
			await page.goto('/registration')
			await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
			await expect(page.getByRole('textbox', { name: 'New password', exact: true })).toBeVisible()
			await expect(page.getByRole('textbox', { name: 'Confirm new password' })).toBeVisible()
			await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
		})

		test('submitting empty fields shows required-field and terms validation, no network call', async ({
			page,
		}) => {
			await page.goto('/registration')
			await page.getByRole('button', { name: 'Register' }).click()
			await expect(page.getByText('Email is required')).toBeVisible()
			await expect(page.getByText('Must accept before proceeding')).toBeVisible()
		})

		test('"Terms and conditions" and "Privacy Policy" resolve to real routes', async ({ page }) => {
			await page.goto('/registration')
			const termsLink = page.getByRole('link', { name: 'Terms and conditions' })
			const privacyLink = page.getByRole('link', { name: 'Privacy Policy' })
			await expect(termsLink).toHaveAttribute('href', '/legal/terms')
			await expect(privacyLink).toHaveAttribute('href', '/legal/privacy')
			const popup = page.waitForEvent('popup')
			await termsLink.click()
			await expect(await popup).toHaveURL(/\/legal\/terms$/)
		})

		// P1 / FW13: the legal links open a new tab, so the half-filled form is never unmounted.
		test('the form keeps typed values when a legal link is opened (findings.md P1)', async ({ page }) => {
			await page.goto('/registration')
			const email = page.getByRole('textbox', { name: 'Email' })
			await email.fill('someone@example.com')
			const popup = page.waitForEvent('popup')
			await page.getByRole('link', { name: 'Privacy Policy' }).click()
			await expect(await popup).toHaveURL(/\/legal\/privacy$/)
			await expect(page).toHaveURL(/\/registration$/)
			await expect(email).toHaveValue('someone@example.com')
		})

		// B2: the mismatch message is a raw, untranslated i18n key today.
		test.fixme(
			'shows a real localized message when the two password fields differ (findings.md B2)',
			async () => {},
		)

		// Registration completes now (O1 → X2, fixed — the empty reCAPTCHA token is sent as-is and the
		// server decides), and since FW14 the codes are shown after the QR rather than discarded. The
		// throwaway this creates is not a fixture row: it is unconfirmed, can sign in nowhere, and the next
		// run's seed wipes it. `/auth/register` has its own 5/min throttle bucket, separate from login's —
		// two hits per run (the account, then the duplicate). The settings-side enrolment is two-factor.spec.ts.
		test('completing registration with 2FA shows the QR with its key, then the issued recovery codes (findings.md U1 / _fix-queue.md FW14)', async ({
			page,
		}) => {
			const email = `e2e-registration-${Date.now()}@example.com`
			await page.goto('/registration')
			await page.getByRole('textbox', { name: 'Email' }).fill(email)
			// The policy is 2 lowercase, 2 uppercase, 3 digits and a special character — the seed's
			// `testpass123` does not pass it (see fixtures/seed.ts on `SeedUser.password`).
			await page.getByRole('textbox', { name: 'New password', exact: true }).fill('ThrowAway-Pass123!')
			await page.getByRole('textbox', { name: 'Confirm new password' }).fill('ThrowAway-Pass123!')
			await page.getByRole('checkbox', { name: 'Do you want to use google 2 factor authentication?' }).check()
			await page.getByRole('checkbox', { name: /I agree to the Terms and conditions/ }).check()

			const registered = page.waitForResponse(
				r => r.url().endsWith('/api/auth/register') && r.request().method() === 'POST',
			)
			await page.getByRole('button', { name: 'Register' }).click()
			const body = (await (await registered).json()) as {
				twoFactorEnabled: boolean
				sharedKey?: string
				recoveryCodes?: string[]
			}
			expect(body.twoFactorEnabled).toBe(true)

			// QR first — the authenticator has to be enrolled before the codes mean anything.
			const qrDialog = page.getByRole('dialog', { name: 'Two-factor authentication' })
			await expect(qrDialog).toBeVisible()
			await expect(qrDialog.getByRole('img', { name: 'QR code for 2FA' })).toBeVisible()
			const shownKey = (await qrDialog.getByTestId('shared-key').innerText()).replace(/\s+/g, '')
			expect(shownKey).toBe(body.sharedKey)
			await qrDialog.getByRole('button', { name: 'Done' }).click()

			// Then the codes, shown once, gated on the acknowledgement.
			const codesDialog = page.getByRole('dialog', { name: 'Recovery codes' })
			await expect(codesDialog).toBeVisible()
			await expect(codesDialog.locator('code')).toHaveCount(body.recoveryCodes!.length)
			const done = codesDialog.getByRole('button', { name: 'Done' })
			await expect(done).toBeDisabled()
			await codesDialog.getByRole('checkbox', { name: 'I have saved these codes somewhere safe' }).check()
			await done.click()

			// Then the sign-in form, with the address carried over (U5) and the resend offered — the
			// `registered` flag, not the remembered address, is what says the account is unconfirmed.
			await expect(page).toHaveURL(/\/login\?registered=1$/)
			await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(email)
			await expect(page.getByRole('button', { name: 'Resend confirmation email' })).toBeVisible()

			// A plain visit keeps the address (it outlives the page) but not the registration-only offer.
			await page.goto('/login')
			await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(email)
			await expect(page.getByRole('button', { name: 'Resend confirmation email' })).toHaveCount(0)

			// The same address again is a 409, worded as such — not the generic conflict sentence the
			// interceptor-then-catch pair used to leave on screen (FW13). Second `/auth/register` hit.
			await page.goto('/registration')
			await page.getByRole('textbox', { name: 'Email' }).fill(email)
			await page.getByRole('textbox', { name: 'New password', exact: true }).fill('ThrowAway-Pass123!')
			await page.getByRole('textbox', { name: 'Confirm new password' }).fill('ThrowAway-Pass123!')
			await page.getByRole('checkbox', { name: /I agree to the Terms and conditions/ }).check()
			const duplicate = page.waitForResponse(r => r.url().endsWith('/api/auth/register'))
			await page.getByRole('button', { name: 'Register' }).click()
			expect((await duplicate).status()).toBe(409)
			await expect(page.getByRole('status').filter({ hasText: 'An account with this email already exists' })).toBeVisible()
			await expect(page.getByText('changed by someone else')).toHaveCount(0)
		})
	})

	test.describe('ForgottenPasswordView (/forgotten-password)', () => {
		test('renders the forgotten-password form', async ({ page }) => {
			await page.goto('/forgotten-password')
			await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
			await expect(page.getByRole('button', { name: 'Reset password' })).toBeVisible()
		})

		test('submitting an empty field shows required-field validation, no network call', async ({ page }) => {
			await page.goto('/forgotten-password')
			await page.getByRole('button', { name: 'Reset password' }).click()
			await expect(page.getByText('Email is required')).toBeVisible()
		})

		// X1 / FW9. `/auth/forgotten-password` is `Throttle(3, 60)` per IP — this is the run's one hit.
		// The server answers 204 for any address (no enumeration oracle), so the seed's own is enough.
		test('a registered e-mail shows the non-committal "check your inbox" confirmation with a resend offer, which exits to /login (findings.md X1)', async ({
			page,
			seed,
		}) => {
			await page.goto('/forgotten-password')
			await page.getByRole('textbox', { name: 'Email' }).fill(seed.primaryUser.email)
			const sent = page.waitForResponse(r => r.url().endsWith('/api/auth/forgotten-password'))
			await page.getByRole('button', { name: 'Reset password' }).click()
			expect((await sent).status()).toBe(204)
			// The 204 is the same for an unknown or unconfirmed address, so the copy must not promise a
			// mail, and the unconfirmed case gets its way out.
			const dialog = page.getByRole('dialog', { name: 'Check your inbox' })
			await expect(dialog.getByText(`If an account with a confirmed address ${seed.primaryUser.email} exists`)).toBeVisible()
			await expect(dialog.getByRole('button', { name: 'Resend confirmation email' })).toBeVisible()
			await page.getByRole('button', { name: 'Go to login page' }).click()
			await expect(page).toHaveURL(/\/login$/)
		})
	})

	test.describe('ResetPasswordView (/reset-password)', () => {
		test('a link missing its userId or token says so and posts nothing (FW9)', async ({ page }) => {
			let posted = false
			page.on('request', r => {
				if (r.url().endsWith('/api/auth/reset-password')) posted = true
			})
			await page.goto('/reset-password')
			await expect(page.getByText('This password reset link is incomplete.', { exact: false })).toBeVisible()
			await expect(page.getByRole('link', { name: 'Go to login page' })).toBeVisible()
			expect(posted).toBe(false)
		})

		test('a bad token is refused by the server and the form stays on screen (FW9)', async ({ page, seed }) => {
			await page.goto(`/reset-password?userId=${seed.primaryUser.id}&token=garbage`)
			await page.getByRole('textbox', { name: 'New password', exact: true }).fill('ThrowAway-Pass123!')
			await page.getByRole('textbox', { name: 'Confirm new password' }).fill('ThrowAway-Pass123!')
			const reset = page.waitForResponse(r => r.url().endsWith('/api/auth/reset-password'))
			await page.getByRole('button', { name: 'Reset password' }).click()
			expect((await reset).status()).toBe(400)
			await expect(page.getByRole('status').filter({ hasText: 'Invalid token.' })).toBeVisible()
			await expect(page.getByRole('button', { name: 'Reset password' })).toBeVisible()
		})
	})

	test.describe('Router guard behaviour', () => {
		test('an unauthenticated deep link redirects to /login, carrying the destination (findings.md B1, write half — F39)', async ({
			page,
			seed,
		}) => {
			await page.goto(`/todo-list/${seed.todoLists.focus}`)
			await expect(page).toHaveURL(/\/login\?/)
			expect(new URL(page.url()).searchParams.get('redirect')).toBe(`/todo-list/${seed.todoLists.focus}`)
		})

		test('an authenticated visit to /login, /registration or /forgotten-password bounces to /', async ({
			authenticatedPage,
		}) => {
			await authenticatedPage.goto('/forgotten-password')
			await expect(authenticatedPage).toHaveURL(/\/$/)

			await authenticatedPage.goto('/login')
			await expect(authenticatedPage).toHaveURL(/\/$/)

			await authenticatedPage.goto('/registration')
			await expect(authenticatedPage).toHaveURL(/\/$/)
		})
	})
})

test.describe('Auth — e-mail confirmation views (no real token available)', () => {
	// B4 / B5 / FW12. No Resend on this view any more: the server resends by address and the link carries
	// only a user id — LoginView's "email not confirmed" branch offers it instead.
	test('ConfirmEmailView without a token explains the failure and offers login, posting nothing (findings.md B4)', async ({
		page,
	}) => {
		let posted = false
		page.on('request', r => {
			if (r.url().includes('/api/auth/')) posted = true
		})
		await page.goto('/confirm-email')
		await expect(page.getByText('There was an error confirming your email, please try again')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Go to login page' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Resend confirmation email' })).toHaveCount(0)
		expect(posted).toBe(false)
	})

	test('ConfirmEmailView posts userId and token as a JSON body — a bad token is a 400, not a 415 (FW12)', async ({
		page,
		seed,
	}) => {
		const confirm = page.waitForRequest(r => r.url().endsWith('/api/auth/confirm-email'))
		await page.goto(`/confirm-email?userId=${seed.primaryUser.id}&token=bad`)
		const request = await confirm
		expect(request.postDataJSON()).toEqual({ userId: seed.primaryUser.id, token: 'bad' })
		expect((await request.response())!.status()).toBe(400)
		await expect(page.locator('#app').getByText('There was an error confirming your email, please try again').first()).toBeVisible()
	})

	test('ConfirmEmailChangeView without a token explains the failure and offers login (findings.md B4)', async ({
		page,
	}) => {
		await page.goto('/confirm-email-change')
		await expect(page.getByText('There was an error confirming your email change, please try again')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Go to login page' })).toBeVisible()
	})

	// U6: source reading suggests the full-screen spinner may never hide on this path; not confirmed live.
	test.fixme(
		'the full-screen loading spinner never gets stuck after a confirm-email failure (findings.md U6)',
		async () => {},
	)
})
