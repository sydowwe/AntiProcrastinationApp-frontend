import type { Page } from '@playwright/test'
import { expect, seedDateParam, test } from '../fixtures/auth'

/**
 * OP15: which template a task or a day came from.
 *
 * Route-patched rather than applied for real. The seed's planner tasks were written straight into the
 * database, not through an apply, so none carries a `sourceTemplateTaskId`, and no seeded day is stamped
 * with a template. Applying one would write to fixture rows every later spec reads. The apply payload is
 * still checked against the real screen, with the request aborted before it reaches the server.
 */
const HOME_OFFICE_NAME = 'Home Office'

type TaskJson = { startTime: { hours: number }; sourceTemplateTaskId: number | null }

/** Gives the first task the grid can show (it draws from 08:00) a template origin, and leaves the rest alone. */
async function markFirstVisibleTask(page: Page) {
	await page.route('**/api/planner-task/filter', async route => {
		const response = await route.fetch()
		const body = (await response.json()) as TaskJson[]
		const first = Array.isArray(body) ? body.find(t => t.startTime.hours >= 8) : undefined
		if (first) first.sourceTemplateTaskId = 999_001
		await route.fulfill({ response, json: body })
	})
}

async function stampDay(page: Page, dateParam: string, templateId: number) {
	await page.route(`**/api/calendar/by-date/${dateParam}`, async route => {
		const response = await route.fetch()
		const body = await response.json()
		await route.fulfill({
			response,
			json: { ...body, appliedTemplateId: templateId, appliedTemplateName: HOME_OFFICE_NAME },
		})
	})
}

async function openDay(page: Page, dateParam: string) {
	await page.goto(`/day-planner/${dateParam}`)
	await expect(page.locator('.task-block').first()).toBeVisible({ timeout: 15_000 })
}

test.describe('Template origin on the day view (/day-planner/:date)', () => {
	test('a task applied from a template carries the mark and says so; a hand-added one does not', async ({
		authenticatedPage: page,
		seed,
	}) => {
		await markFirstVisibleTask(page)
		await openDay(page, seedDateParam(seed))

		const blocks = page.locator('.base-task-block[aria-label]')
		const marked = blocks.filter({ has: page.locator('.from-template-mark') })
		await expect(marked).toHaveCount(1)
		await expect(marked).toHaveAttribute('aria-label', /from a day template/)

		const unmarked = blocks.filter({ hasNot: page.locator('.from-template-mark') })
		await expect(unmarked.first()).toBeVisible()
		await expect(unmarked.first()).not.toHaveAttribute('aria-label', /from a day template/)

		await marked.locator('.from-template-mark').hover()
		await expect(page.getByText('From a day template')).toBeVisible()
	})

	test('the "Using:" line links to the applied template', async ({ authenticatedPage: page, seed }) => {
		const dateParam = seedDateParam(seed)
		await stampDay(page, dateParam, seed.dayPlannerTemplates.homeOffice)
		await openDay(page, dateParam)

		const link = page.getByRole('link', { name: HOME_OFFICE_NAME })
		await expect(link).toHaveAttribute('href', `/day-planner/templates/${seed.dayPlannerTemplates.homeOffice}`)
		await link.click()
		await expect(page).toHaveURL(new RegExp(`/day-planner/templates/${seed.dayPlannerTemplates.homeOffice}$`))
	})

	test('applying a previewed template sends each line\'s template line id', async ({ authenticatedPage: page, seed }) => {
		await openDay(page, seedDateParam(seed))

		let body: { tasksFromTemplate: { sourceTemplateTaskId: number | null }[] } | null = null
		await page.route('**/api/calendar/apply-planner-template', async route => {
			body = route.request().postDataJSON()
			await route.abort() // nothing reaches the fixture
		})

		await page.getByRole('button', { name: new RegExp(HOME_OFFICE_NAME) }).first().click()
		await page.getByRole('button', { name: 'Preview Template' }).click()
		await expect(page.locator('.templatePreview').first()).toBeVisible()
		// The overlay is the template already; the mark is for committed tasks only.
		await expect(page.locator('.templatePreview .from-template-mark')).toHaveCount(0)

		await page.getByRole('button', { name: 'Apply', exact: true }).click()
		await expect.poll(() => body).not.toBeNull()

		const ids = body!.tasksFromTemplate.map(t => t.sourceTemplateTaskId)
		expect(ids.length).toBeGreaterThan(0)
		expect(ids.every(id => typeof id === 'number' && id > 0)).toBe(true)
		expect(new Set(ids).size).toBe(ids.length)
	})
})

test.describe('Template origin on the month view (/day-planner)', () => {
	test('a stamped day links to its template without opening the day', async ({ authenticatedPage: page, seed }) => {
		// The month view opens on the real current month and has no URL state, so the first day of whatever
		// month it asks for is stamped, rather than a fixed date.
		await page.route('**/api/calendar/filter', async route => {
			const response = await route.fetch()
			const days = (await response.json()) as { appliedTemplateId: number | null; appliedTemplateName: string | null }[]
			if (days.length) {
				days[0].appliedTemplateId = seed.dayPlannerTemplates.homeOffice
				days[0].appliedTemplateName = HOME_OFFICE_NAME
			}
			await route.fulfill({ response, json: days })
		})
		await page.goto('/day-planner')

		const link = page.locator('a.template-link')
		await expect(link).toHaveCount(1, { timeout: 15_000 })
		await expect(link).toHaveText(HOME_OFFICE_NAME)
		// Pointer-only: the cell is itself a button, so the link stays out of the tab order.
		await expect(link).toHaveAttribute('tabindex', '-1')

		await link.click()
		await expect(page).toHaveURL(new RegExp(`/day-planner/templates/${seed.dayPlannerTemplates.homeOffice}$`))
	})
})
