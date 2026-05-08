import { expect, test } from '../fixtures/auth'
import type { Page } from '@playwright/test'

// Populated once from the template list on first run; reused across tests (workers: 1)
let templateUrl: string | null = null

async function resolveTemplateUrl(page: Page): Promise<string | null> {
	await page.goto('/day-planner/templates')
	const links = await page.locator('a[href]').all()
	for (const link of links) {
		const href = await link.getAttribute('href')
		if (href && /\/day-planner\/templates\/\d+$/.test(href)) {
			return href
		}
	}
	return null
}

test.describe('Template Day Planner', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		if (!templateUrl) {
			templateUrl = await resolveTemplateUrl(authenticatedPage)
		}
		test.skip(templateUrl === null, 'No templates found in seed data')
		await authenticatedPage.goto(templateUrl!)
		await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })
	})

	test.describe('rendering', () => {
		test('shows the calendar grid', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.locator('.calendar-grid')).toBeVisible()
		})

		test('shows the template details panel by default', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByText('Template details')).toBeVisible()
		})

		test('Add New Task button is visible', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('button', { name: 'Add New Task' })).toBeVisible()
		})
	})

	test.describe('template details panel', () => {
		test('closing the panel hides template details', async ({ authenticatedPage }) => {
			// The X button inside the panel closes it
			await authenticatedPage.getByRole('button', { name: /close|xmark/i }).first().click()
			await expect(authenticatedPage.getByText('Template details')).not.toBeVisible()
		})

		test('Edit details button restores the panel', async ({ authenticatedPage }) => {
			// Close the panel first
			await authenticatedPage.getByRole('button', { name: /close|xmark/i }).first().click()
			await expect(authenticatedPage.getByText('Template details')).not.toBeVisible()
			// Re-open via "Edit details"
			await authenticatedPage.getByRole('button', { name: 'Edit details' }).click()
			await expect(authenticatedPage.getByText('Template details')).toBeVisible()
		})
	})

	test.describe('task creation dialog', () => {
		test('Add New Task button opens the creation dialog', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add New Task' }).click()
			await expect(authenticatedPage.getByText('Add New Template Task')).toBeVisible()
		})

		test('creation dialog can be cancelled', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add New Task' }).click()
			await expect(authenticatedPage.getByText('Add New Template Task')).toBeVisible()
			await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.getByText('Add New Template Task')).not.toBeVisible()
		})
	})

	test.describe('task selection and deletion', () => {
		test('selecting a task shows the selection action bar', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await expect(authenticatedPage.getByRole('button', { name: /delete/i })).toBeVisible()
		})

		test('delete action shows a confirmation dialog', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			if ((await taskBlocks.count()) === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: /delete/i }).click()
			await expect(authenticatedPage.getByText('Delete confirmation')).toBeVisible()
		})

		test('cancelling the delete dialog keeps the task', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			const countBefore = await taskBlocks.count()
			if (countBefore === 0) test.skip()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: /delete/i }).click()
			await expect(authenticatedPage.getByText('Delete confirmation')).toBeVisible()
			await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(countBefore)
		})
	})
})
