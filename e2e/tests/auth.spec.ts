import { expect, test } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL ?? 'test@example.com'
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'testpass123'

test.describe('Authentication', () => {
	test('user can log in and reach the home dashboard', async ({ page }) => {
		await page.goto('/login')

		await page.getByLabel('Email').fill(EMAIL)
		await page.getByLabel('Password').fill(PASSWORD)
		await page.getByRole('button', { name: 'Log in' }).click()

		await expect(page).toHaveURL('/')

		// Dashboard widgets should all be visible after a successful login
		await expect(page.getByText('Day planner')).toBeVisible()
		await expect(page.getByText('Upcoming tasks')).toBeVisible()
		await expect(page.getByText("Today's activity")).toBeVisible()
	})

	test('invalid credentials show an error and stay on /login', async ({ page }) => {
		await page.goto('/login')

		await page.getByLabel('Email').fill('wrong@example.com')
		await page.getByLabel('Password').fill('wrongpassword')
		await page.getByRole('button', { name: 'Log in' }).click()

		await expect(page).toHaveURL('/login')
		await expect(page.getByText('Wrong email or password')).toBeVisible()
	})
})
