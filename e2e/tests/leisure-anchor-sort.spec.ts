import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'
import { apiUrl } from '../fixtures/seed'

/**
 * Covers the gap the API flagged when it answered `B7` §4
 * (`prompts/view-docs/backend/_done/B7-grid-sort-key-audit.md`): `periodKey` expands server-side into
 * `anchor_year` then `anchor_month` via a `SelectMany` over the sort array, spliced at `periodKey`'s own
 * index so every other key keeps its position. Their integration tests pin `periodKey` only as the *sole*
 * sort key, in both directions — nothing asserts it behaves as a **secondary** key. The splice is right
 * by construction, which is exactly the kind of thing that breaks silently later.
 *
 * The fixture as seeded cannot test this: its two anchors have rating and period correlated (Aug/9,
 * Jul/7), so `rating desc` and `periodKey desc` return the same order and the assertion would pass
 * either way. Each test therefore rewrites the two ratings first, to make one key disagree with the
 * other. That is a mutation of fixture-pinned rows, so the block opts into `freshSeed` per CLAUDE.md's
 * *Mutating specs* — creating fresh anchors instead is not an option, because the API requires an
 * activity to already hold a Backlog or BucketList profile before it can be anchored.
 *
 * Sort is driven through the URL rather than by chained header clicks. `useTableUrlState` encodes
 * `key:order` joined by `,`, and the client sends whatever it parsed, so this exercises the same
 * client→server path a two-click combination would, without depending on how many clicks it takes to
 * cycle a header into `desc`.
 */
test.describe.configure({ mode: 'serial' })
test.use({ freshSeed: true })

test.describe('periodKey as a secondary sort key (/leisure/memory-anchors — table)', () => {
	const BOULDERING = 'Learn Bouldering' // seeded August, the later period
	const RETIRED = 'Retired Hobby' // seeded July, on the archived activity

	/**
	 * Rewrites a rating in place. `PUT` takes the whole `MemoryAnchorRequest`, so the current row is read
	 * first and only `rating` is overridden — anchor month/year are never hardcoded here.
	 */
	async function setRating(page: Page, anchorId: number, rating: number) {
		const current = await page.request.get(`${apiUrl()}/api/memory-anchor/${anchorId}`)
		expect(current.ok(), `could not read anchor ${anchorId}`).toBe(true)
		const { activityId, anchorMonth, anchorYear, highlightNote } = await current.json()

		const saved = await page.request.put(`${apiUrl()}/api/memory-anchor/${anchorId}`, {
			data: { activityId, anchorMonth, anchorYear, highlightNote, rating },
		})
		expect(saved.ok(), `could not set rating ${rating} on anchor ${anchorId}`).toBe(true)
	}

	async function orderedNames(page: Page) {
		const rows = page.locator('#app tbody tr')
		await expect(rows).toHaveCount(2)

		const texts = await rows.allTextContents()
		return texts.map(text => [BOULDERING, RETIRED].find(name => text.includes(name)) ?? text.slice(0, 30))
	}

	test('rating stays primary — periodKey does not override it', async ({ authenticatedPage, seed }) => {
		// Anti-correlate the two: the EARLIER period now holds the HIGHER rating.
		await setRating(authenticatedPage, seed.profiles.memoryAnchor, 3) // August
		await setRating(authenticatedPage, seed.profiles.memoryAnchorOnArchived, 9) // July

		await authenticatedPage.goto('/leisure/memory-anchors?view=table&sortBy=rating:desc,periodKey:desc')

		// July leads on its rating of 9. If `periodKey` were applied first, August would lead instead —
		// which is the regression this guards.
		expect(await orderedNames(authenticatedPage)).toEqual([RETIRED, BOULDERING])
	})

	test('periodKey breaks a rating tie, in both directions', async ({ authenticatedPage, seed }) => {
		// Equal ratings, so `rating` contributes no ordering at all and the result is `periodKey` alone
		// acting from second position.
		await setRating(authenticatedPage, seed.profiles.memoryAnchor, 7)
		await setRating(authenticatedPage, seed.profiles.memoryAnchorOnArchived, 7)

		await authenticatedPage.goto('/leisure/memory-anchors?view=table&sortBy=rating:desc,periodKey:desc')
		expect(await orderedNames(authenticatedPage)).toEqual([BOULDERING, RETIRED])

		await authenticatedPage.goto('/leisure/memory-anchors?view=table&sortBy=rating:desc,periodKey:asc')
		expect(await orderedNames(authenticatedPage)).toEqual([RETIRED, BOULDERING])
	})

	test('periodKey alone still orders by year then month, as the API already pins', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/leisure/memory-anchors?view=table&sortBy=periodKey:desc')
		expect(await orderedNames(authenticatedPage)).toEqual([BOULDERING, RETIRED])

		await authenticatedPage.goto('/leisure/memory-anchors?view=table&sortBy=periodKey:asc')
		expect(await orderedNames(authenticatedPage)).toEqual([RETIRED, BOULDERING])
	})
})
