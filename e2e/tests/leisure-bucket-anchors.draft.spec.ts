import { expect, test } from '../fixtures/auth'

/**
 * Structural coverage for `/leisure/bucket-list` and `/leisure/memory-anchors`, written from a live crawl
 * via `playwright-cli` for `docs/views/leisure-bucket-anchors/` (inventory pass).
 *
 * Both grids now answer 200 (see `leisure-profiles.spec.ts`'s file header — fixed server-side 2026-09-13),
 * so the table mode of both views is drivable and asserted for real here. The **ladder** and **timeline**
 * view modes are not: both always fail with a 400 (`itemsPerPage: 500` exceeds the server's documented cap
 * of 200 — the exact bug `ProjectsView.vue`'s `BOARD_PAGE_SIZE` comment already describes fixing once in
 * this module) and render a false "empty" state regardless of real data. See
 * `docs/views/leisure-bucket-anchors/findings.md` X1/X2. Those two, plus the broken "Add" (unlocked) memory
 * anchor flow (X3), the ignored numeric/date filters (B1) and the `activityId: 0` validation gap (B2), are
 * `test.fixme` stubs below rather than real assertions.
 */

test.describe('Bucket list (/leisure/bucket-list — table)', () => {
	test('renders the seeded profile with its columns', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/bucket-list')
		await authenticatedPage.getByText('Learn Bouldering').waitFor()

		const headerRow = authenticatedPage.locator('#app thead tr')
		for (const column of ['Activity', 'Experienced', 'Experience type', 'Comfort zone step', 'Requires travel']) {
			await expect(headerRow.getByText(column, { exact: true })).toBeVisible()
		}

		const row = authenticatedPage.locator('#app tbody tr', { hasText: 'Learn Bouldering' })
		await expect(row.getByText('Experienced', { exact: true })).toBeVisible()
	})

	test('Table/Ladder toggle writes `view` to the URL and survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/bucket-list')
		await authenticatedPage.getByTitle('Ladder').click()
		await expect(authenticatedPage).toHaveURL(/[?&]view=ladder\b/)

		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/[?&]view=ladder\b/)
		// Not asserting ladder content here — that is the X1 fixme below.

		await authenticatedPage.getByTitle('Table').click()
		await expect(authenticatedPage).toHaveURL(/[?&]view=table\b/)
	})

	test('a bucket-list filter field writes its value to the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/bucket-list')
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.getByRole('textbox', { name: 'Activity' }).fill('Bouldering')
		await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()

		await expect(authenticatedPage).toHaveURL(/activityName=Bouldering/)
		await expect(authenticatedPage.getByText('Activity: Bouldering')).toBeVisible()
	})

	test('delete asks for confirmation naming the activity, and Cancel does not delete', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/leisure/bucket-list')
		const row = authenticatedPage.locator('#app tbody tr', { hasText: 'Learn Bouldering' })
		await row.getByTitle('delete').click()

		const dialog = authenticatedPage.getByRole('dialog', { name: 'Delete confirmation' })
		await expect(dialog.getByText('Are you sure you want to delete Learn Bouldering?')).toBeVisible()
		await dialog.getByRole('button', { name: 'Cancel' }).click()

		await expect(authenticatedPage.locator('#app tbody tr')).toHaveCount(1)
	})
})

test.describe('Memory anchors (/leisure/memory-anchors — table)', () => {
	test('renders both seeded anchors with their columns', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/memory-anchors')
		await authenticatedPage.getByText('Learn Bouldering').waitFor()

		const headerRow = authenticatedPage.locator('#app thead tr')
		for (const column of ['Month', 'Activity', 'Rating', 'Source', 'Highlight']) {
			await expect(headerRow.getByText(column, { exact: true })).toBeVisible()
		}

		await expect(authenticatedPage.locator('#app tbody tr')).toHaveCount(2)
	})

	test('the bucket-list source chip navigates back to the filtered bucket list, and the reverse chip returns', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/leisure/memory-anchors')
		await authenticatedPage.getByText('Bucket List', { exact: true }).click()

		await expect(authenticatedPage).toHaveURL(/\/leisure\/bucket-list\?activityName=Learn\+Bouldering/)
		await authenticatedPage.locator('#app tbody tr', { hasText: 'Learn Bouldering' }).waitFor()

		await authenticatedPage.locator('#app tbody tr').getByText('Experienced', { exact: true }).click()
		// By id, not name — leisure-backlog-picker O2. The chip names the activity back from the loaded rows.
		await expect(authenticatedPage).toHaveURL(/\/leisure\/memory-anchors\?activityId=\d+/)
		await expect(authenticatedPage.getByText('Activity: Learn Bouldering')).toBeVisible()
	})

	test('Table/Timeline toggle writes `view` to the URL and survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/memory-anchors')
		await authenticatedPage.getByTitle('Timeline').click()
		await expect(authenticatedPage).toHaveURL(/[?&]view=timeline\b/)

		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/[?&]view=timeline\b/)
		// Not asserting timeline content here — that is the X2 fixme below.
	})

	test('the Rating filter accepts values above 5 (L2\'s fix), writing the value to the URL', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/leisure/memory-anchors')
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.getByRole('textbox', { name: 'Rating' }).fill('9')
		await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()

		// Structural only: the field accepts and round-trips 9. Whether the result set is actually
		// narrowed is the B1 fixme below — confirmed broken in this pass.
		await expect(authenticatedPage).toHaveURL(/minRating=9/)
	})

	test('delete asks for confirmation naming the activity, and Cancel does not delete', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/leisure/memory-anchors')
		const row = authenticatedPage.locator('#app tbody tr', { hasText: 'Retired Hobby' })
		await row.getByTitle('delete').click()

		const dialog = authenticatedPage.getByRole('dialog', { name: 'Delete confirmation' })
		await expect(dialog.getByText('Are you sure you want to delete Retired Hobby?')).toBeVisible()
		await dialog.getByRole('button', { name: 'Cancel' }).click()

		await expect(authenticatedPage.locator('#app tbody tr')).toHaveCount(2)
	})
})

test.describe('Known-broken surfaces (see findings.md)', () => {
	test.fixme(
		'ladder view (/leisure/bucket-list?view=ladder) shows the seeded row grouped under its comfort-zone rung',
		// X1: itemsPerPage 500 > server cap 200 → 400 → ladder always renders the empty state.
		async () => {},
	)

	test.fixme(
		'timeline view (/leisure/memory-anchors?view=timeline) shows both seeded anchors on the year strip',
		// X2: same 400 as X1, TIMELINE_PAGE_SIZE.
		async () => {},
	)

	test.fixme(
		'"Add" on memory anchors (unlocked) lists eligible activities and can create an anchor',
		// X3: GET /api/memory-anchor/anchor-eligible-activities → 400; NewMemoryAnchorForm's onMounted has
		// no try/catch, so `loading` never clears and the Activity field is stuck on a spinner over "0".
		async () => {},
	)

	test.fixme(
		'bucket-list minComfortZoneStep/maxComfortZoneStep actually narrow the result set',
		// B1: filter is sent correctly (confirmed in request body) but the server ignores it.
		async () => {},
	)

	test.fixme(
		'memory-anchors year/month/minRating filters actually narrow the result set',
		// B1: same as above, three more fields on the other grid endpoint.
		async () => {},
	)

	test.fixme(
		'a fresh "Add" dialog does not let Create submit with the untouched activityId:0 default',
		// B2: ActivityBucketListProfileRequest.experienceTypeId / MemoryAnchorRequest.activityId default to
		// 0, not null; requiredRule treats 0 as valid, so Create fires a request the backend then rejects.
		async () => {},
	)
})
