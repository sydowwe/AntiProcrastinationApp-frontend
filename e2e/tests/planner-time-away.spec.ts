import type { Page } from '@playwright/test'
import { apiUrl } from '../fixtures/seed'
import { expect, seedDateParam, test } from '../fixtures/auth'
import type { SeedResponse } from '../fixtures/seed'

/**
 * F4-02: named stretches of time away (backend `8e6ceac`). Marked from the list, they stamp their days
 * Vacation / SickDay, put their template first in the day's suggestions under the stretch's own name, and
 * give way to a day type the user set by hand — which survives the stretch's removal too.
 *
 * Every stretch is created by the test that needs it and removed after it, so the fixture is never left
 * holding one. The days sit eight weeks past the seed date, clear of every other spec's fixture days.
 */
const FIRST_DAY_OFFSET = 56

type CalendarJson = {
	id: number
	dayType: string
	label: string | null
	wakeUpTime: { hours: number; minutes: number }
	bedTime: { hours: number; minutes: number }
	weather: string | null
	notes: string | null
	location: string | null
	timeAwayName: string | null
}

/** `dd-MM-yyyy`, the planner route's form, as `MM/dd/yyyy`, the date field's form in the fixture's EN locale. */
function fieldDate(seed: SeedResponse, offset: number): string {
	const [dd, mm, yyyy] = seedDateParam(seed, offset).split('-')
	return `${mm}/${dd}/${yyyy}`
}

/** `dd-MM-yyyy` as the API's `yyyy-MM-dd`. */
function apiDate(seed: SeedResponse, offset: number): string {
	const [dd, mm, yyyy] = seedDateParam(seed, offset).split('-')
	return `${yyyy}-${mm}-${dd}`
}

async function readDay(page: Page, seed: SeedResponse, offset: number): Promise<CalendarJson> {
	const response = await page.request.get(`${apiUrl()}/api/calendar/by-date/${seedDateParam(seed, offset)}`)
	expect(response.ok(), await response.text()).toBeTruthy()
	return (await response.json()) as CalendarJson
}

async function writeDayType(page: Page, day: CalendarJson, dayType: string) {
	const { label, wakeUpTime, bedTime, weather, notes, location } = day
	const response = await page.request.put(`${apiUrl()}/api/calendar/${day.id}`, {
		data: { dayType, label, wakeUpTime, bedTime, weather, notes, location },
	})
	expect(response.ok(), await response.text()).toBeTruthy()
}

async function removeAllStretches(page: Page) {
	const response = await page.request.post(`${apiUrl()}/api/time-away/filter`, { data: {} })
	expect(response.ok(), await response.text()).toBeTruthy()
	for (const { id } of (await response.json()) as { id: number }[]) {
		const deleted = await page.request.delete(`${apiUrl()}/api/time-away/${id}`)
		expect(deleted.ok(), await deleted.text()).toBeTruthy()
	}
}

async function openList(page: Page) {
	await page.goto('/day-planner/time-away')
	await expect(page.getByRole('heading', { name: 'Time away', level: 1 })).toBeVisible()
}

/** Fills the dialog's name and both ends of the range; leaves the kind at its default, Vacation. */
async function fillStretch(page: Page, name: string, from: string, to: string) {
	const dialog = page.getByRole('dialog', { name: 'Mark time away' })
	await dialog.getByRole('textbox', { name: 'Name' }).fill(name)
	await dialog.getByRole('textbox', { name: 'Date from' }).fill(from)
	await dialog.getByRole('textbox', { name: 'Date from' }).press('Tab')
	await dialog.getByRole('textbox', { name: 'Date to' }).fill(to)
	await dialog.getByRole('textbox', { name: 'Date to' }).press('Tab')
	return dialog
}

test.describe('Time away (/day-planner/time-away)', () => {
	test.describe.configure({ mode: 'serial' })

	let restoreDay: { day: CalendarJson; dayType: string } | null = null

	test.beforeEach(async ({ authenticatedPage: page }) => {
		await removeAllStretches(page)
	})

	test.afterEach(async ({ authenticatedPage: page }) => {
		await removeAllStretches(page)
		if (restoreDay) await writeDayType(page, restoreDay.day, restoreDay.dayType)
		restoreDay = null
	})

	test('a stretch marked from the list names its days and leads their suggestions', async ({
		authenticatedPage: page,
		seed,
	}) => {
		await openList(page)
		await expect(page.getByText('Nothing marked yet.')).toBeVisible()

		await page.getByRole('button', { name: 'Mark time away' }).click()
		const dialog = await fillStretch(
			page,
			'Lisbon',
			fieldDate(seed, FIRST_DAY_OFFSET),
			fieldDate(seed, FIRST_DAY_OFFSET + 2),
		)
		await dialog.locator('.v-field').filter({ hasText: 'Day template (optional)' }).click()
		await page.getByRole('option', { name: 'Relaxed Weekend' }).click()
		await dialog.getByRole('button', { name: 'Save' }).click()

		await expect(page.getByText('"Lisbon" is marked.')).toBeVisible()
		await expect(dialog).toBeHidden()
		await expect(page.getByRole('heading', { name: 'Now and coming up' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Lisbon', level: 3 })).toBeVisible()
		await expect(page.getByText('3 days')).toBeVisible()
		// A record, not a score: nothing on the page adds stretches up.
		await expect(page.getByText(/total|in total|this year/i)).toHaveCount(0)

		await page.goto(`/day-planner/${seedDateParam(seed, FIRST_DAY_OFFSET + 1)}`)
		await expect(page.getByRole('link', { name: 'Part of "Lisbon"' })).toBeVisible({ timeout: 15_000 })
		const firstSuggestion = page.locator('.suggestion-item').first()
		await expect(firstSuggestion).toContainText('Relaxed Weekend')
		await expect(firstSuggestion.getByText('Planned for Lisbon')).toBeVisible()

		const day = await readDay(page, seed, FIRST_DAY_OFFSET + 1)
		expect(day.dayType).toBe('Vacation')
		expect(day.timeAwayName).toBe('Lisbon')
	})

	test('an overlap is shown on the dates and keeps the dialog open', async ({ authenticatedPage: page, seed }) => {
		const created = await page.request.post(`${apiUrl()}/api/time-away`, {
			data: {
				name: 'Lisbon',
				kind: 'Vacation',
				startDate: apiDate(seed, FIRST_DAY_OFFSET),
				endDate: apiDate(seed, FIRST_DAY_OFFSET + 2),
			},
		})
		expect(created.status(), await created.text()).toBe(201)

		await openList(page)
		await page.getByRole('button', { name: 'Mark time away' }).click()
		const dialog = await fillStretch(
			page,
			'Flu',
			fieldDate(seed, FIRST_DAY_OFFSET + 2),
			fieldDate(seed, FIRST_DAY_OFFSET + 4),
		)
		await dialog.getByRole('button', { name: 'Sick day' }).click()
		await dialog.getByRole('button', { name: 'Save' }).click()

		await expect(dialog.getByRole('alert').filter({ hasText: 'Lisbon' })).toBeVisible()
		await expect(dialog).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Flu', level: 3 })).toHaveCount(0)
	})

	test('a day typed by hand keeps its type through the stretch and after it is removed', async ({
		authenticatedPage: page,
		seed,
	}) => {
		const handTyped = await readDay(page, seed, FIRST_DAY_OFFSET)
		restoreDay = { day: handTyped, dayType: handTyped.dayType }
		await writeDayType(page, handTyped, 'Special')

		await openList(page)
		await page.getByRole('button', { name: 'Mark time away' }).click()
		const dialog = await fillStretch(
			page,
			'Lisbon',
			fieldDate(seed, FIRST_DAY_OFFSET),
			fieldDate(seed, FIRST_DAY_OFFSET + 1),
		)
		await dialog.getByRole('button', { name: 'Save' }).click()
		await expect(page.getByText('"Lisbon" is marked. 1 day kept its own day type.')).toBeVisible()

		expect((await readDay(page, seed, FIRST_DAY_OFFSET)).dayType).toBe('Special')
		expect((await readDay(page, seed, FIRST_DAY_OFFSET + 1)).dayType).toBe('Vacation')

		await page.getByRole('button', { name: 'Remove Lisbon' }).click()
		// The seed account asks before deleting, and removing a stretch cascades to nothing, so its preference decides.
		await page.getByRole('dialog', { name: 'Remove "Lisbon"?' }).getByRole('button', { name: 'Remove' }).click()
		await expect(page.getByText('"Lisbon" is removed.')).toBeVisible()
		await expect(page.getByText('Nothing marked yet.')).toBeVisible()

		const kept = await readDay(page, seed, FIRST_DAY_OFFSET)
		expect(kept.dayType).toBe('Special')
		expect(kept.timeAwayName).toBeNull()
		const released = await readDay(page, seed, FIRST_DAY_OFFSET + 1)
		expect(released.dayType).not.toBe('Vacation')
		expect(released.timeAwayName).toBeNull()
	})
})
