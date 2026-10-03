// The extended `test` still exposes the plain `page` fixture, which the sign-in tests below use — they
// have to start signed out. `authenticatedPage` is only needed by the redirect-guard block at the end.
import { expect, test } from '../fixtures/auth'

// Credentials come off the seed response, never from `.env.test` or a literal here. The seed endpoint
// creates the account it describes and echoes the password back for exactly this reason — a second
// copy in the environment is free to drift from the seeder, and this file held one until 2026-09-10.
test.describe('Authentication', () => {
	test('user can log in and reach the home dashboard', async ({ page, seed }) => {
		await page.goto('/login')

		await page.getByRole('textbox', { name: 'Email' }).fill(seed.primaryUser.email)
		await page.getByRole('textbox', { name: 'Password' }).fill(seed.primaryUser.password)
		await page.getByRole('button', { name: 'Log in' }).click()

		await expect(page).toHaveURL('/')

		// Dashboard widgets should all be visible after a successful login. Scoped to `main`: a bare
		// `getByText('Day planner')` also matches the sidebar nav item and the "Day planner - template"
		// nav item, both outside the dashboard content — strict mode fails on the ambiguity.
		await expect(page.getByRole('main').getByText('Day planner', { exact: true })).toBeVisible()
		await expect(page.getByText('Upcoming tasks')).toBeVisible()
		await expect(page.getByText("Today's activity")).toBeVisible()

		// The next visit's prefill. Written from the typed address: `LoginResponse` carries no e-mail, and
		// reading one off it left this unset after every password sign-in (data-map U2, OP12).
		expect(await page.evaluate(() => localStorage.getItem('auth.lastUsedEmail'))).toBe(seed.primaryUser.email)
	})

	test('invalid credentials show an error and stay on /login', async ({ page }) => {
		await page.goto('/login')

		await page.getByRole('textbox', { name: 'Email' }).fill('wrong@example.com')
		await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword')
		await page.getByRole('button', { name: 'Log in' }).click()

		await expect(page).toHaveURL('/login')
		await expect(page.getByText('Wrong email or password')).toBeVisible()
	})
})

// Regression cover for `SIGNED_OUT_ONLY_ROUTES` in `src/router.ts`. Before that guard, `meta.public`
// was doing double duty — it answers "reachable while signed out", which is not the same question as
// "should be seen while signed in" — so a signed-in user opening /login got the sign-in form rendered
// inside a fully signed-in shell: top bar with the account chip, sidebar, every `/api/*` call at 200.
// It reads as "the session didn't restore" when the session is in fact fine.
//
// Both halves matter. A fix that redirects off *every* public route is a regression, not a fix, which
// is what the second block pins down.
test.describe('Public-route redirect guard', () => {
	for (const path of ['/login', '/registration', '/forgotten-password']) {
		test(`${path} redirects a signed-in user to the dashboard`, async ({ authenticatedPage }) => {
			await authenticatedPage.goto(path)

			await expect(authenticatedPage).toHaveURL('/')
		})
	}

	// `/legal/*` has to stay readable while signed in, and the confirm-e-mail routes process a token out
	// of an e-mailed link — bouncing those would break confirming an e-mail change from the very session
	// that requested it. `/confirm-email` is asserted without a token on purpose: the guard must not care.
	for (const path of ['/legal/terms', '/legal/privacy', '/confirm-email']) {
		test(`${path} stays reachable while signed in`, async ({ authenticatedPage }) => {
			await authenticatedPage.goto(path)

			await expect(authenticatedPage).toHaveURL(path)
		})
	}
})
