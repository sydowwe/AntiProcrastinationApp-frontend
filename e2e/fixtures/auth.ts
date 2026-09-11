import { test as base, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { readSeed, reseed, type SeedResponse, type SeedUser } from './seed'

export { expect }
export { seedDateParam } from './seed'
export type { SeedResponse } from './seed'

/**
 * Auth state lives under `.state/`, which `global-setup.ts` clears before every run. That matters:
 * `POST /api/test/seed` wipes every account, so a storage state cached from a previous run points at
 * a user id that no longer exists and every guarded route would bounce to /login.
 */
const AUTH_DIR = path.resolve(__dirname, '../.state')

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

		await expect(page).toHaveURL('/')
		await context.storageState({ path: authFile })
	}

	return page
}

type Fixtures = {
	/** Signed in as the seed's primary user. */
	authenticatedPage: Page
	/** Signed in as the seed's secondary user, in its own browser context — for isolation checks. */
	secondaryPage: Page
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
		await page.context().close()
	},

	secondaryPage: async ({ seed, browser }, use) => {
		const page = await signedInPage(browser, seed.secondaryUser)
		await use(page)
		await page.context().close()
	},
})
