import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP5: the day's own context (label, holiday, unusual day type, location, weather, notes) on home's
 * planner widget, read off the day-plan response the widget already fetches.
 *
 * Route-patched rather than written through the API: the seed's calendar row for "today" is whatever
 * date the real clock resolves to in the account's zone (see the note at the top of
 * `home.draft.spec.ts`), and the fixture leaves its context fields empty. Patching the one response on
 * the wire keeps the fixture read-only and lets each test pick the exact day it is about.
 */
type CalendarPatch = Record<string, unknown>

const ORDINARY_TUESDAY: CalendarPatch = {
	dayIndex: 2,
	dayType: 'Workday',
	label: null,
	holidayKey: null,
	holidayName: null,
	location: null,
	weather: null,
	notes: null,
}

async function patchToday(page: Page, calendar: CalendarPatch, { unplanned = false } = {}) {
	await page.route('**/api/calendar/day-plan/**', async route => {
		const response = await route.fetch()
		const body = (await response.json()) as { calendar: CalendarPatch | null; tasks: unknown[]; hasPlan: boolean }
		// The bar has nothing to show without a row; the fixture seeds whole years, so this only
		// guards against a run whose "today" falls outside them.
		body.calendar = { ...(body.calendar ?? {}), ...ORDINARY_TUESDAY, ...calendar }
		if (unplanned) {
			body.tasks = []
			body.hasPlan = false
		}
		await route.fulfill({ response, json: body })
	})
}

async function openHome(page: Page) {
	const dayPlan = page.waitForResponse('**/api/calendar/day-plan/**')
	await page.goto('/')
	await dayPlan
}

function plannerCard(page: Page) {
	return page.locator('.planner-card')
}

function dayContext(page: Page) {
	return plannerCard(page).getByRole('region', { name: 'About today' })
}

test.describe('Day context on the planner widget (/ — "About today")', () => {
	test('shows the label, an unusual day type, the location, the weather and the note', async ({ authenticatedPage: page }) => {
		const note = 'Pack charger and passport.\nTrain leaves 14:20.\nA third line the widget clamps away.'
		await patchToday(page, {
			label: 'Travel day',
			dayType: 'Vacation',
			location: 'Travel',
			weather: 'Rain, 12°C',
			notes: note,
		})
		await openHome(page)

		const bar = dayContext(page)
		await expect(bar).toBeVisible()
		await expect(bar.getByText('Travel day')).toBeVisible()
		await expect(bar.getByText('Vacation')).toBeVisible()
		await expect(bar.getByText('Travel', { exact: true })).toBeVisible()
		await expect(bar.getByText('Rain, 12°C')).toBeVisible()
		// Clamped on screen, whole in the tooltip.
		await expect(bar.locator('[title]').filter({ hasText: 'Pack charger' })).toHaveAttribute('title', note)
		await expect(bar.locator('.notes')).toHaveCSS('-webkit-line-clamp', '2')
	})

	test('a holiday on an unplanned day shows its translated name, not a second "Holiday" chip', async ({
		authenticatedPage: page,
	}) => {
		await patchToday(
			page,
			{ dayType: 'Holiday', holidayKey: 'GOOD_FRIDAY', holidayName: 'Veľký piatok' },
			{ unplanned: true },
		)
		await openHome(page)

		// Outside the widget's `hasPlan` branches: it sits above the "Plan today" empty state.
		await expect(plannerCard(page).getByRole('button', { name: 'Plan today' })).toBeVisible()
		const bar = dayContext(page)
		await expect(bar.getByText('Good Friday')).toBeVisible()
		await expect(bar.getByText('Veľký piatok')).toHaveCount(0)
		await expect(bar.getByText('Holiday', { exact: true })).toHaveCount(0)
	})

	test('an ordinary workday renders no bar', async ({ authenticatedPage: page }) => {
		await patchToday(page, {}, { unplanned: true })
		await openHome(page)

		// Wait on the widget's settled state before asserting an absence, or this passes during the spinner.
		await expect(plannerCard(page).getByRole('button', { name: 'Plan today' })).toBeVisible()
		await expect(dayContext(page)).toHaveCount(0)
	})

	test('a workday falling on a weekend is unusual, so its type shows', async ({ authenticatedPage: page }) => {
		await patchToday(page, { dayIndex: 6, dayType: 'Workday' }, { unplanned: true })
		await openHome(page)

		await expect(dayContext(page).getByText('Workday')).toBeVisible()
	})
})
