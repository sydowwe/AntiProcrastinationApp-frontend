import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP17: a category's list count and the category chip on a list card.
 *
 * Route-patched: the seed account has no categories and the running API may predate `listCount`, so the
 * category and list responses (`POST /todo-list-category/filter-sort`, `POST /todo-list/filter-sort`) are
 * replaced wholesale and the fixture stays read-only. The patched list response ignores the request's
 * category filter, which is the point of the "filtered" tests: the cards still carry a category, so the
 * chip is hidden by the page's filter state alone, not because the server sent none.
 *
 * The last block is the one real-data check: `/routine-todo-list` is not patched, and each row's accent
 * bar must take its period's colour.
 */
const OTHER_ID = -1

const CATEGORIES = [
	{ id: 9001, name: 'Work', icon: 'briefcase', color: 'blue', listCount: 2 },
	{ id: 9002, name: 'Garden', icon: 'leaf', color: 'green', listCount: 0 },
	{ id: OTHER_ID, name: 'Other', icon: null, color: null, listCount: 3 },
]

const WORK = CATEGORIES[0]

const LISTS = [
	{ id: 9101, name: 'Quarterly report', icon: 'file', text: 'Numbers for Q3', category: WORK, itemCount: 4, completedCount: 1 },
	{ id: 9102, name: 'Hiring plan', icon: 'user', text: null, category: WORK, itemCount: 2, completedCount: 0 },
	{ id: 9103, name: 'Loose ends', icon: 'list', text: 'Nothing filed', category: null, itemCount: 1, completedCount: 0 },
]

async function patchCategoriesAndLists(page: Page) {
	await page.route('**/api/todo-list-category/filter-sort', route => route.fulfill({ json: CATEGORIES }))
	await page.route('**/api/todo-list/filter-sort', route => route.fulfill({ json: LISTS }))
}

async function openLists(page: Page) {
	await page.goto('/todo-list')
	await expect(page.getByRole('button', { name: 'New list' })).toBeVisible()
	await expect(listCard(page, 'Quarterly report')).toBeVisible()
}

function categoryRow(page: Page, name: string): Locator {
	return page.locator('.cat-item').filter({ hasText: name })
}

function listCard(page: Page, name: string): Locator {
	return page.locator('.list-card').filter({ hasText: name })
}

function categoryChip(card: Locator): Locator {
	return card.locator('.v-chip[title^="Category:"]')
}

test.describe('Category list count (/todo-list — categories panel)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await patchCategoriesAndLists(page)
		await openLists(page)
	})

	test('the panel badge reads the count for a used category, an empty one and "Other"', async ({
		authenticatedPage: page,
	}) => {
		await expect(categoryRow(page, 'Work').locator('.cat-item__count')).toHaveText('2')
		// Zero is a count, not an absent one: the badge is hidden only for `null`.
		await expect(categoryRow(page, 'Garden').locator('.cat-item__count')).toHaveText('0')
		await expect(categoryRow(page, 'Other').locator('.cat-item__count')).toHaveText('3')
		// "All" has no count.
		await expect(categoryRow(page, 'All').locator('.cat-item__count')).toHaveCount(0)
	})

	test('deleting a used category says how many lists it keeps', async ({ authenticatedPage: page }) => {
		await page.getByRole('button', { name: 'Delete: Work' }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Delete category?')).toBeVisible()
		await expect(dialog.getByText('Lists in this category: 2. They are kept')).toBeVisible()

		// Cancel: the category is a fixture-adjacent row and the patched list must stay as it is.
		await dialog.getByRole('button', { name: /cancel/i }).click()
		await expect(dialog).not.toBeVisible()
	})

	test('deleting an empty category shows no list-count line', async ({ authenticatedPage: page }) => {
		await page.getByRole('button', { name: 'Delete: Garden' }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Delete category?')).toBeVisible()
		await expect(dialog.getByText('Lists in this category')).toHaveCount(0)

		await dialog.getByRole('button', { name: /cancel/i }).click()
		await expect(dialog).not.toBeVisible()
	})
})

test.describe('Category chip on the list card (/todo-list)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await patchCategoriesAndLists(page)
		await openLists(page)
	})

	test('under "All" a card shows its category under the description; an uncategorised card shows none', async ({
		authenticatedPage: page,
	}) => {
		const report = listCard(page, 'Quarterly report')
		const chip = categoryChip(report)
		await expect(chip).toHaveCount(1)
		await expect(chip).toHaveText('Work')
		await expect(chip).toHaveAttribute('title', 'Category: Work')
		// Below the description in the DOM, in the same text column.
		const descriptionBox = await report.getByText('Numbers for Q3').boundingBox()
		const chipBox = await chip.boundingBox()
		expect(descriptionBox).not.toBeNull()
		expect(chipBox).not.toBeNull()
		expect(chipBox!.y).toBeGreaterThan(descriptionBox!.y)

		// A card with no description still shows it.
		await expect(categoryChip(listCard(page, 'Hiring plan'))).toHaveText('Work')
		await expect(categoryChip(listCard(page, 'Loose ends'))).toHaveCount(0)
	})

	test('filtered to one category, no card shows the chip', async ({ authenticatedPage: page }) => {
		await categoryRow(page, 'Work').click()
		// The cards re-render from the (unchanged) patched response; wait on the page having settled.
		await expect(categoryRow(page, 'Work')).toHaveClass(/cat-item--active/)
		await expect(listCard(page, 'Quarterly report')).toBeVisible()

		await expect(page.locator('.list-card .v-chip[title^="Category:"]')).toHaveCount(0)
	})

	test('filtered to "Other", no card shows the chip either', async ({ authenticatedPage: page }) => {
		await categoryRow(page, 'Other').click()
		await expect(categoryRow(page, 'Other')).toHaveClass(/cat-item--active/)
		await expect(listCard(page, 'Quarterly report')).toBeVisible()

		await expect(page.locator('.list-card .v-chip[title^="Category:"]')).toHaveCount(0)
	})

	test('going back to "All" brings the chips back', async ({ authenticatedPage: page }) => {
		await categoryRow(page, 'Work').click()
		await expect(categoryRow(page, 'Work')).toHaveClass(/cat-item--active/)
		await expect(page.locator('.list-card .v-chip[title^="Category:"]')).toHaveCount(0)

		await categoryRow(page, 'All').click()
		await expect(categoryRow(page, 'All')).toHaveClass(/cat-item--active/)
		await expect(page.locator('.list-card .v-chip[title^="Category:"]')).toHaveCount(2)
	})
})

test.describe('Routine row accent bar (/routine-todo-list, real data)', () => {
	test("each row's accent bar takes its period's colour, and a period with none gets no bar", async ({
		authenticatedPage: page,
	}) => {
		const grouped = page.waitForResponse(
			r => r.url().includes('/api/routine-todo-list/grouped-by-time-period') && r.request().method() === 'GET',
		)
		await page.goto('/routine-todo-list')
		const groups = (await (await grouped).json()) as {
			routineTimePeriod: { id: number; text: string; color?: string | null }
			items: { id: number; isDone: boolean; activity: { name: string } }[]
		}[]

		const withItems = groups.filter(g => g.items.length > 0)
		expect(withItems.length).toBeGreaterThan(0)
		// The response lands before the rows paint; counting rows first would skip every one of them.
		await expect(page.locator('.listItem').first()).toBeVisible()

		// background of the accent bar per period colour, read off the rendered rows.
		const barByColour = new Map<string, string>()
		let rowsChecked = 0
		for (const group of withItems) {
			const colour = group.routineTimePeriod.color || ''
			for (const item of group.items) {
				const name = item.activity.name
				// A done row can be hidden by the group's "Hide done" switch, so only rendered rows count.
				const rows = page.locator('.listItem').filter({ hasText: name })
				if ((await rows.count()) === 0) continue
				const bar = rows.first().locator('.priority-accent')
				if (colour === '') {
					await expect(bar).toHaveCount(0)
				} else {
					await expect(bar).toHaveCount(1)
					const background = await bar.evaluate(el => getComputedStyle(el).backgroundColor)
					expect(background).not.toBe('rgba(0, 0, 0, 0)')
					const seen = barByColour.get(colour)
					if (seen !== undefined) expect(background).toBe(seen)
					barByColour.set(colour, background)
				}
				rowsChecked++
			}
		}
		expect(rowsChecked).toBeGreaterThan(0)

		// Two periods wearing different colours wear different bars.
		const distinctColours = new Set(barByColour.keys())
		expect(distinctColours.size).toBeGreaterThan(1)
		expect(new Set(barByColour.values()).size).toBe(distinctColours.size)
	})
})
