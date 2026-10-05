import { expect, test } from '../fixtures/auth'
import { apiUrl } from '../fixtures/seed'

/**
 * OP23: the "Experienced" chip opens the exact memory anchor, not just the list filtered by activity.
 * Read-only against the fixture — the dialog is opened and closed, never saved.
 */
test.describe('"Experienced" chip → memory anchor (/leisure/bucket-list → /leisure/memory-anchors)', () => {
	const BOULDERING = 'Learn Bouldering' // the seeded anchor's activity, on the bucket list

	test('opens the anchor in its edit form, and drops the one-shot param', async ({ authenticatedPage: page, seed }) => {
		await page.goto(`/leisure/bucket-list?activityName=${encodeURIComponent(BOULDERING)}`)

		await page.locator('#app').getByRole('button', { name: /Open the memory anchor/ }).first().click()

		const dialog = page.getByRole('dialog')
		await expect(dialog).toBeVisible()
		// Fields are values, not text. The rating is read from the API rather than hardcoded, because
		// `leisure-anchor-sort` rewrites it and does not reset afterwards.
		const anchor = await (await page.request.get(`${apiUrl()}/api/memory-anchor/${seed.profiles.memoryAnchor}`)).json()
		expect(anchor.activity.name).toBe(BOULDERING)
		await expect(dialog.getByRole('textbox', { name: 'Activity' })).toHaveValue(BOULDERING)
		await expect(dialog.getByRole('textbox', { name: 'Rating' })).toHaveValue(String(anchor.rating))

		// `anchorId` is consumed on read, so a reload does not reopen the dialog; `activityId` stays.
		await expect(page).toHaveURL(/\/leisure\/memory-anchors\?/)
		expect(page.url()).toContain('activityId=')
		await expect.poll(() => page.url()).not.toContain('anchorId=')
	})

	test('an unknown anchorId leaves the filtered list and opens nothing', async ({ authenticatedPage: page }) => {
		await page.goto('/leisure/memory-anchors?activityId=1&anchorId=999999999')

		await expect(page.locator('#app tbody')).toBeVisible()
		await expect(page.getByRole('dialog')).toHaveCount(0)
		await expect.poll(() => page.url()).not.toContain('anchorId=')
	})
})
