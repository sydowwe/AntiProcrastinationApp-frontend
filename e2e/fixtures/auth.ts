import { test as base, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { readSeed, reseed, type SeedResponse, type SeedUser } from './seed'

export { expect }
export { apiUrl, reseed, seedDateParam } from './seed'
export type { SeedResponse } from './seed'

/**
 * Auth state lives under `.state/`, which `global-setup.ts` clears before every run. That matters:
 * `POST /api/test/seed` wipes every account, so a storage state cached from a previous run points at
 * a user id that no longer exists and every guarded route would bounce to /login.
 */
const AUTH_DIR = path.resolve(__dirname, '../.state')

/**
 * `POST /auth/login` is throttled per caller: a few sign-ins in quick succession start failing with
 * *"You are requesting this endpoint too frequently!"*, and the cooldown is well over a minute.
 * (Observed 2026-09-13 while probing by hand. One attempt in that window came back as a plain
 * `401 Invalid email or password` on credentials that had just worked — so a single bad-credential
 * failure is not proof the credential is bad.)
 *
 * That is why the storage state above is cached rather than re-driven: a run does at most one cold
 * sign-in per account, and `adminPage` (added with `e2e-v3`) makes that three rather than two. If a run
 * ever fails at `toHaveURL('/')` on the *last* of them with the login form still on screen, check the
 * response before hunting locators — it is the throttle, not the credential.
 */

function authFileFor(user: SeedUser): string {
	return path.join(AUTH_DIR, `auth-${user.id}.json`)
}

async function signedInPage(browser: import('@playwright/test').Browser, user: SeedUser): Promise<Page> {
	const authFile = authFileFor(user)
	fs.mkdirSync(AUTH_DIR, { recursive: true })

	const context = await browser.newContext({
		storageState: fs.existsSync(authFile) ? authFile : undefined,
		ignoreHTTPSErrors: true,
	})
	const page = await context.newPage()

	if (!fs.existsSync(authFile)) {
		await page.goto('/login')

		// Structural locators, not labels — deliberately, but no longer for the reason this comment used
		// to give. `src/i18n.ts` now sets `locale: 'EN'` (flipped 2026-09-10 so the signed-out screens are
		// English), so `/login` DOES render English labels and `getByLabel('Email')` would in fact resolve.
		// These stay structural because they are locale-independent and cost nothing: the default locale
		// is an app-wide decision that has already been reversed once, and a sign-in helper every spec
		// depends on should not be the thing that breaks when it changes again.
		const form = page.locator('form')
		await form.locator('input[type="text"]').first().fill(user.email)
		await form.locator('input[type="password"]').first().fill(user.password)
		await form.locator('button[type="submit"]').click()

		// Generous on purpose. This is the one COLD sign-in of the run: `global-setup.ts` has just
		// cleared `.state/`, so there is no cached session, and Vite is compiling the login and
		// dashboard routes on demand. At the default 5 s this fails intermittently on the very first
		// test of a run — and it fails inside a fixture, so it surfaces as an unrelated spec going red
		// with a `toHaveURL` error that has nothing to do with that spec.
		await expect(page).toHaveURL('/', { timeout: 20_000 })
		await context.storageState({ path: authFile })
	}

	return page
}

/**
 * Write the context's storage state back over the cached file before closing it.
 *
 * The API rotates the refresh token on every `POST /auth/refresh`, and a rotated token presented
 * again more than 5 s later is the reuse-attack signature: the server revokes **every** session for
 * that account (`RefreshTokenService.ValidateRefreshTokenAsync`). The access token in the cached
 * state lives ~15 min, so in a run longer than that the first spec to refresh silently invalidated
 * the file for every spec after it — each new context loaded the old token, tripped the attack
 * check, and bounced to /login with nothing pointing here. Saving after every test keeps the file
 * holding whatever token the last context ended with.
 */
async function releasePage(page: Page, user: SeedUser): Promise<void> {
	const context = page.context()
	try {
		await context.storageState({ path: authFileFor(user) })
	} catch {
		// A crashed page cannot serialise its state; the next test falls back to the file as it was.
	}
	await context.close()
}

type Fixtures = {
	/** Signed in as the seed's primary user. */
	authenticatedPage: Page
	/** Signed in as the seed's secondary user, in its own browser context — for isolation checks. */
	secondaryPage: Page
	/**
	 * Signed in as the seed's `adminUser` (id 10003), in its own browser context — the only account the
	 * reminders module's admin routes accept. Everything under `/pripomienky` except the user's own
	 * screens answers **403** on `authenticatedPage`, by design.
	 *
	 * It has no fixture data of its own, so assert on rows it can *see* (the register rolls up every
	 * user's reminders, unscoped) and never on rows it owns.
	 */
	adminPage: Page
	/** The `POST /api/test/seed` response: stable ids, counts and `seedDateUtc`. */
	seed: SeedResponse
}

type Options = {
	/**
	 * Re-run `POST /api/test/seed` before **each** test in scope, instead of reading the state global
	 * setup left. Off by default; opt a describe block in with `test.use({ freshSeed: true })`.
	 *
	 * For specs that mutate rows the fixture pins and other specs read — the counter on
	 * `todoListItems.multiCountPartial` is the example: assert on it once and it is no longer at 2 of 5
	 * for anyone, this spec's own re-run included. Pair it with
	 * `test.describe.configure({ mode: 'serial' })`.
	 *
	 * It costs a truncate-and-rebuild (~1.5–2.0 s) per test, so it is the second choice. The first is
	 * to create whatever you are about to mutate through the app's own API and leave the fixture rows
	 * read-only — that covers the write path too, which this does not.
	 *
	 * **This is only safe because `playwright.config.ts` sets `workers: 1`.** The endpoint truncates and
	 * rebuilds the WHOLE database, every account included — so with two workers, one test reseeding
	 * mid-flight would pull the rows out from under whatever the other is asserting, at a random point,
	 * with no error that points here. If you ever raise the worker count, this option has to go behind a
	 * lock or be removed; it is not a "probably fine" the way most order-dependence is.
	 */
	freshSeed: boolean
}

export const test = base.extend<Fixtures & Options>({
	freshSeed: [false, { option: true }],

	// Every other fixture reaches the seed through this one, so making it the place the reset happens
	// is also what orders it: `authenticatedPage` depends on `seed`, so the database is already back in
	// the fixture state by the time the sign-in runs.
	seed: async ({ freshSeed }, use) => {
		await use(freshSeed ? await reseed() : readSeed())
	},

	authenticatedPage: async ({ seed, browser }, use) => {
		const page = await signedInPage(browser, seed.primaryUser)
		await use(page)
		await releasePage(page, seed.primaryUser)
	},

	secondaryPage: async ({ seed, browser }, use) => {
		const page = await signedInPage(browser, seed.secondaryUser)
		await use(page)
		await releasePage(page, seed.secondaryUser)
	},

	// The credential comes off the seed response like the other two, not from `.env.test` — the account
	// is part of the fixture, so the fixture is what says what it is.
	adminPage: async ({ seed, browser }, use) => {
		const page = await signedInPage(browser, seed.adminUser)
		await use(page)
		await releasePage(page, seed.adminUser)
	},
})
