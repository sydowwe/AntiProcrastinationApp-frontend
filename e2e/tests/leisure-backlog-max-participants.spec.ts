import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * leisure-backlog-picker O1: a backlog row's `maxParticipants` is shown (the *People* column on
 * `/leisure/backlog`) and read by the picker (`/leisure/pick`).
 *
 * **It does not exclude.** `leisureScoring.ts` keeps `maxParticipants` out of `isEligible` on purpose: more
 * people around than the activity takes is "doable, but leaves someone out", so it costs
 * `PARTY_TOO_BIG_PENALTY` (-2) in `scoreCandidate`. Only `minParticipants` is a hard constraint. The
 * ranking test below therefore pins a *demotion* out of the top three, not a filter, and the real-data
 * test pins that the seeded one-person row stays on screen for two people.
 *
 * The seed has one backlog row (`Read a Novel`, min 1, max 1), so the ranges and the ranking are
 * route-patched on the backlog grid response, cloned from the server's own row so the shape stays real.
 * The fixture is never written.
 *
 * The ranking test fixes `seed=4` because the draw adds a deterministic per-(key, seed) jitter worth up to
 * 3 points, which is more than the 2-point penalty. For that seed and these four keys the jitter alone
 * leaves `Pick A` in the top three, and the penalty alone pushes it to last. If the scoring constants or
 * the jitter hash change, this seed must be re-found — the failure will say which side broke.
 */

type GridRow = Record<string, unknown> & { activityId: number; activity: Record<string, unknown> }

/** Replace the backlog grid's rows with `build(template)` per spec, keeping the real envelope and row shape. */
async function patchBacklogGrid(
	page: Page,
	specs: { id: number; name: string; min: number; max: number | null }[],
) {
	await page.route('**/api/activity-backlog-profile/grid', async route => {
		try {
			const response = await route.fetch()
			const body = (await response.json()) as { items: GridRow[]; itemsCount: number }
			const template = body.items[0]
			const items = specs.map(({ id, name, min, max }) => ({
				...template,
				id,
				activityId: id,
				activity: { ...template.activity, id, name },
				minParticipants: min,
				maxParticipants: max,
				durationMinutes: 30,
				isRepeatable: true,
				isAnchored: null,
				memoryAnchorId: null,
			}))
			await route.fulfill({ response, json: { ...body, items, itemsCount: items.length } })
		} catch {
			// A request still in flight when the test ends fails here as the context closes; that is not a finding.
		}
	})
}

/** The picker remembers what it has shown; a second load in one test must not inherit the first's. */
async function forgetSuggestionHistory(page: Page) {
	await page.evaluate(() => {
		for (const key of Object.keys(localStorage)) {
			if (key.includes('leisure.picker.history')) localStorage.removeItem(key)
		}
	})
}

async function openPicker(page: Page, query: string) {
	const grid = page.waitForResponse('**/api/activity-backlog-profile/grid')
	await page.goto(`/leisure/pick?${query}`)
	await grid
	await page.getByRole('button', { name: 'Something else' }).waitFor({ state: 'visible' })
}

test.describe('Backlog People column (/leisure/backlog)', () => {
	test('the seeded row shows its single participant count', async ({ authenticatedPage: page }) => {
		await page.goto('/leisure/backlog')
		await page.getByText('Read a Novel').waitFor()
		// A cold first load of this view labels its columns in Slovak ("Ľudia") for an EN account: the table
		// builds `columns` once at setup with `t()`, before the signed-in locale lands, and never re-reads
		// it. A reload is the first load that is not cold. `leisure-backlog-picker.draft.spec.ts`'s header
		// test ("loads the table with its column headers") fails the same way on a cold run.
		await page.reload()
		await expect(page.getByRole('columnheader', { name: 'People' })).toBeVisible()

		// min 1 and max 1 collapse to "1", not "1–1".
		const row = page.getByRole('row', { name: /Read a Novel/ })
		await expect(row.getByRole('cell', { name: '1', exact: true })).toBeVisible()
	})

	test('a range, an open end and an exact count each read their own way', async ({ authenticatedPage: page }) => {
		await patchBacklogGrid(page, [
			{ id: 9101, name: 'Range row', min: 2, max: 4 },
			{ id: 9102, name: 'Open row', min: 1, max: null },
			{ id: 9103, name: 'Exact row', min: 3, max: 3 },
		])
		await page.goto('/leisure/backlog')

		await expect(page.getByRole('row', { name: /Range row/ }).getByRole('cell', { name: '2–4', exact: true })).toBeVisible()
		await expect(page.getByRole('row', { name: /Open row/ }).getByRole('cell', { name: '1+', exact: true })).toBeVisible()
		await expect(page.getByRole('row', { name: /Exact row/ }).getByRole('cell', { name: '3', exact: true })).toBeVisible()
	})
})

test.describe('Picker and maxParticipants (/leisure/pick)', () => {
	test('a one-person-only row is demoted, not dropped, when two people are around', async ({
		authenticatedPage: page,
	}) => {
		// Real data: the seed's only backlog row has max 1. Penalised at people=2, but it is the only
		// candidate, so it must still be offered — proof that `maxParticipants` is not an exclusion.
		// 60 minutes, not 30: the seeded row states 45, and a stated duration over the budget IS a hard exclusion.
		await openPicker(page, 'minutes=60&energy=low&people=2&seed=4')
		await expect(page.getByText('Read a Novel')).toBeVisible()
	})

	test('past the cap a candidate drops out of the top three; at the cap it stays', async ({
		authenticatedPage: page,
	}) => {
		await patchBacklogGrid(page, [
			{ id: 9101, name: 'Pick A', min: 1, max: 1 }, // below two people: penalised
			{ id: 9102, name: 'Pick B', min: 1, max: 2 }, // exactly two people: not penalised
			{ id: 9103, name: 'Pick C', min: 1, max: null },
			{ id: 9104, name: 'Pick D', min: 1, max: null },
		])
		const cards = page.locator('#app').getByText(/^Pick [A-D]$/)

		// Two people: A is last on score, so three cards remain and A is not one of them.
		await openPicker(page, 'minutes=30&energy=low&people=2&seed=4')
		await expect(cards).toHaveCount(3)
		await expect(page.getByText('Pick A', { exact: true })).toHaveCount(0)
		await expect(page.getByText('Pick B', { exact: true })).toBeVisible()

		// One person, same seed, same four rows: the penalty is gone and the jitter lets A back in.
		await forgetSuggestionHistory(page)
		await openPicker(page, 'minutes=30&energy=low&people=1&seed=4')
		await expect(cards).toHaveCount(3)
		await expect(page.getByText('Pick A', { exact: true })).toBeVisible()
	})
})
