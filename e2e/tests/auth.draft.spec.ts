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
			// Fragile-by-necessity: the toggle's only accessible name is the Vuetify default fallback
			// "Password appended action" — see findings.md A1. Once A1 is fixed this should become
			// getByRole('button', { name: /show password/i }).
			await page.getByRole('button', { name: 'Password appended action' }).click()
			await expect(passwordInput).toHaveAttribute('type', 'text')
		})

		// B1: the router guard's redirect and both of LoginView's success handlers discard the
		// originally-requested deep link. Fixme rather than asserting today's broken behaviour.
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
			await termsLink.click()
			await expect(page).toHaveURL(/\/legal\/terms$/)
		})

		// P1: legal links open in the same tab, so the whole form is lost on back-navigation.
		test.fixme(
			'the form retains typed values after visiting a legal link and navigating back (findings.md P1)',
			async () => {},
		)

		// B2: the mismatch message is a raw, untranslated i18n key today.
		test.fixme(
			'shows a real localized message when the two password fields differ (findings.md B2)',
			async () => {},
		)

		// Registration completes now (O1 → X2, fixed — the empty reCAPTCHA token is sent as-is and the
		// server decides), but the codes are still discarded: `open2FADialog` opens the QR body only and never
		// `RecoveryCodesBody` (_fix-queue.md FW14). This stays a fixme until FW14 lands; the settings-side
		// enrolment, which does show them, is covered by two-factor.spec.ts. Note the QR dialog
		// on this path now also renders the manual-entry key (B22) — assert on `getByTestId('shared-key')`
		// when promoting.
		test.fixme(
			'completing registration with 2FA shows the QR with its key, then the issued recovery codes (findings.md U1 / _fix-queue.md FW14)',
			async () => {},
		)
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

		// X1: the request never includes `recaptchaToken`, so no input can ever succeed today.
		test.fixme(
			'a valid registered e-mail shows the "password reset e-mail sent" confirmation (findings.md X1)',
			async () => {},
		)
	})

	test.describe('Router guard behaviour', () => {
		test('an unauthenticated deep link redirects to /login', async ({ page, seed }) => {
			await page.goto(`/todo-list/${seed.todoLists.focus}`)
			await expect(page).toHaveURL(/\/login$/)
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
	test('ConfirmEmailView without a token shows the resend option', async ({ page }) => {
		await page.goto('/confirm-email')
		await expect(page.getByRole('button', { name: 'Resend confirmation email' })).toBeVisible()
	})

	// B4: the error state today shows no explanatory text alongside the Resend button.
	test.fixme(
		'ConfirmEmailView shows an explanation of the failure, not just the Resend button (findings.md B4)',
		async () => {},
	)

	test('ConfirmEmailChangeView without a token shows an error and a way back to login', async ({ page }) => {
		await page.goto('/confirm-email-change')
		await expect(page.getByRole('button', { name: 'Go to login page' })).toBeVisible()
	})

	// U6: source reading suggests the full-screen spinner may never hide on this path; not confirmed live.
	test.fixme(
		'the full-screen loading spinner never gets stuck after a confirm-email failure (findings.md U6)',
		async () => {},
	)
})
