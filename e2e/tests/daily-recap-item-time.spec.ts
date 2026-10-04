import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP13: the daily recap lists each finished item with its own logged time, not only the day's total.
 *
 * Route-patched rather than seeded: the recap is whatever the account completed *today*, and the
 * fixture's completions are pinned to the seed date. Patching the one response keeps the fixture
 * read-only and pins exact per-item seconds.
 */
type RecapItemPatch = { name: string; timeLoggedSeconds: number }

async function patchRecap(page: Page, items: RecapItemPatch[]) {
	await page.route('**/api/todo-list-item/daily-recap**', route =>
		route.fulfill({
			json: {
				items: items.map((item, index) => ({
					...item,
					itemId: 900_000 + index,
					pairedLeisureActivityId: null,
					completedTimestamp: new Date(Date.UTC(2026, 0, 1, 8, index)).toISOString(),
					rewardTaken: false,
				})),
				totalTimeLoggedSeconds: items.reduce((sum, item) => sum + item.timeLoggedSeconds, 0),
			},
		}),
	)
}

function recapRows(page: Page) {
	return page.getByTestId('daily-recap-items').getByRole('listitem')
}

test.describe('Daily recap per-item time (/todo-list/:id — recap card)', () => {
	test('each row carries its own time; an item with none shows only its name', async ({
		authenticatedPage: page,
		seed,
	}) => {
		await patchRecap(page, [
			{ name: 'Write report', timeLoggedSeconds: 5400 },
			{ name: 'Email landlord', timeLoggedSeconds: 0 },
			{ name: 'Quick fix', timeLoggedSeconds: 40 },
		])
		await page.goto(`/todo-list/${seed.todoLists.focus}`)
		await recapRows(page).first().waitFor()

		await expect(page.getByText('3 things finished today — 1h 30m logged')).toBeVisible()
		await expect(recapRows(page)).toHaveText(['Write report 1h 30m', 'Email landlord', 'Quick fix 40s'])
	})

	test('past five rows, the rest fold behind "+ N more"', async ({ authenticatedPage: page, seed }) => {
		await patchRecap(
			page,
			Array.from({ length: 7 }, (_, index) => ({ name: `Item ${index + 1}`, timeLoggedSeconds: 600 })),
		)
		await page.goto(`/todo-list/${seed.todoLists.focus}`)
		await recapRows(page).first().waitFor()

		await expect(recapRows(page)).toHaveCount(5)
		const toggle = page.getByRole('button', { name: '+ 2 more' })
		await expect(toggle).toHaveAttribute('aria-expanded', 'false')

		await toggle.click()
		await expect(recapRows(page)).toHaveCount(7)
		await expect(recapRows(page).last()).toHaveText('Item 7 10m')

		await page.getByRole('button', { name: 'Show less' }).click()
		await expect(recapRows(page)).toHaveCount(5)
	})
})
