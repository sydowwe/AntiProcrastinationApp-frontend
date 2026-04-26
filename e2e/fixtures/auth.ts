import { test as base, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

export { expect }

const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/user.json')
const EMAIL = process.env.E2E_TEST_EMAIL ?? 'test@example.com'
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'testpass123'

export const test = base.extend<{ authenticatedPage: Page }>({
	authenticatedPage: async ({ browser }, use) => {
		const authDir = path.dirname(AUTH_FILE)
		if (!fs.existsSync(authDir)) {
			fs.mkdirSync(authDir, { recursive: true })
		}

		const isAuthSaved = fs.existsSync(AUTH_FILE)

		const context = await browser.newContext({
			storageState: isAuthSaved ? AUTH_FILE : undefined,
			ignoreHTTPSErrors: true,
		})
		const page = await context.newPage()

		if (!isAuthSaved) {
			await page.goto('/login')
			await page.getByLabel('Email').fill(EMAIL)
			await page.getByLabel('Password').fill(PASSWORD)
			await page.getByRole('button', { name: 'Log in' }).click()
			await expect(page).toHaveURL('/')
			await context.storageState({ path: AUTH_FILE })
		}

		await use(page)
		await context.close()
	},
})
