import { test as base, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { readSeed, type SeedResponse, type SeedUser } from './seed'

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

		// Structural locators, not labels. The login screen always renders in SLOVAK regardless of the
		// account's locale: `src/i18n.ts` sets `locale: 'SK'` and the user's preference is only applied
		// after a successful sign-in (LoginView sets `i18n.locale` from the response; App.vue from
		// `currentUser.locale`). So there is no point at which an English label exists to match here.
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

export const test = base.extend<Fixtures>({
	seed: async ({}, use) => {
		await use(readSeed())
	},

	authenticatedPage: async ({ browser }, use) => {
		const page = await signedInPage(browser, readSeed().primaryUser)
		await use(page)
		await page.context().close()
	},

	secondaryPage: async ({ browser }, use) => {
		const page = await signedInPage(browser, readSeed().secondaryUser)
		await use(page)
		await page.context().close()
	},
})
