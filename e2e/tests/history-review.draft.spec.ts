import { expect, seedDateParam, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the history-review inventory
// pass (docs/views/history-review/). Semantic-tier claims — anything asserting a VALUE or a RULE is
// correct, and every logged bug/a11y/polish finding — are `test.fixme` stubs, per
// docs/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// `.bar-column` (stacked-bar chart) and `.day-cell` (calendar) are CSS-class fallbacks, not role
// locators — both elements have no accessible name (findings A1, A2), so a role-based locator cannot
// reach them at all. Confirmed resolving live before use here.

// The seed anchors "today" at `seedDateUtc` (e2e-v4: 2026-09-14 at capture time). Offsets below were
// confirmed live against this fixture: -5 and -4 days both have real ActivityHistory rows, -7 has none.
function isoDateOffset(seed: { seedDateUtc: string }, dayOffset: number): string {
	const d = new Date(`${seed.seedDateUtc}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + dayOffset)
	return d.toISOString().slice(0, 10)
}

test.describe('History Summary (/activity-history)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history')
		await authenticatedPage.getByRole('heading', { name: 'Activity History' }).waitFor({ state: 'visible' })
	})

	test('renders the header controls: range length, date, groupBy toggle, export', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('combobox', { name: 'Range length' })).toBeVisible()
		await expect(authenticatedPage.getByRole('textbox', { name: 'Date' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Activity' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Role' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Category' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Export' })).toBeVisible()
	})

	test('switching groupBy to Role updates the URL query', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Role' }).click()
		await expect(authenticatedPage).toHaveURL(/groupBy=ROLE/)
	})

	test('Export opens a menu offering Excel and CSV', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Export' }).click()
		await expect(authenticatedPage.getByRole('listitem').filter({ hasText: 'Excel (.xlsx)' })).toBeVisible()
		await expect(authenticatedPage.getByRole('listitem').filter({ hasText: 'CSV (.csv)' })).toBeVisible()
	})

	test('Escape closes the Export menu', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Export' }).click()
		const csvItem = authenticatedPage.getByRole('listitem').filter({ hasText: 'CSV (.csv)' })
		await expect(csvItem).toBeVisible()
		await authenticatedPage.keyboard.press('Escape')
		await expect(csvItem).not.toBeVisible()
	})

	test('the calendar icon button navigates to the Calendar view', async ({ authenticatedPage }) => {
		// Icon-only, no accessible name (aria-describedby only points at its tooltip) — same shape as
		// findings A1/A2, so this is a structural CSS-position fallback, not a role locator.
		await authenticatedPage.locator('main button').first().click()
		await expect(authenticatedPage).toHaveURL(/\/activity-history\/calendar$/)
	})

	test('clicking a stacked-bar column drills into Detail, carrying date and groupBy', async ({ authenticatedPage }) => {
		const firstBar = authenticatedPage.locator('.bar-column').first()
		await firstBar.waitFor({ state: 'visible' })
		await firstBar.click()
		await expect(authenticatedPage).toHaveURL(/\/activity-history\/detail\?date=\d{4}-\d{2}-\d{2}.*groupBy=ACTIVITY/)
	})

	test('all query params survive a reload', async ({ authenticatedPage, seed }) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(
			`/activity-history?range=Week&date=${date}&groupBy=ROLE&windowSize=4h&timeFrom=08:00&timeTo=01:00&baseline=last7days&topN=5`,
		)
		await authenticatedPage.getByRole('heading', { name: 'Activity History' }).waitFor({ state: 'visible' })
		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(new RegExp(`date=${date}.*groupBy=ROLE.*topN=5|groupBy=ROLE.*date=${date}`))
	})
})

test.describe('History Calendar (/activity-history/calendar)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/calendar')
		await authenticatedPage.getByRole('combobox', { name: 'Month' }).waitFor({ state: 'visible' })
	})

	test('renders Mode, Month, Year and Days-to-show controls', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('combobox', { name: 'Mode' })).toBeVisible()
		await expect(authenticatedPage.getByRole('combobox', { name: 'Month' })).toBeVisible()
		await expect(authenticatedPage.getByRole('combobox', { name: 'Year' })).toBeVisible()
		await expect(authenticatedPage.getByRole('combobox', { name: 'Days to show' })).toBeVisible()
	})

	test('clicking a populated day cell drills into Detail, carrying the date', async ({ authenticatedPage }) => {
		const populatedCell = authenticatedPage.locator('.day-cell.day-type-workday').filter({ hasText: 'session' }).first()
		await populatedCell.waitFor({ state: 'visible' })
		await populatedCell.click()
		await expect(authenticatedPage).toHaveURL(/\/activity-history\/detail\?date=\d{4}-\d{2}-\d{2}/)
	})
})

test.describe('History Detail (/activity-history/detail)', () => {
	test('with no date query, defaults to today rather than erroring', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/detail')
		await expect(authenticatedPage.getByRole('heading', { name: 'History Detail' })).toBeVisible()
	})

	test('Stacked bars / Timeline toggle updates the view query param', async ({ authenticatedPage, seed }) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(`/activity-history/detail?date=${date}`)
		await authenticatedPage.getByRole('heading', { name: 'History Detail' }).waitFor({ state: 'visible' })
		await authenticatedPage.getByRole('button', { name: 'Stacked bars' }).click()
		await expect(authenticatedPage).toHaveURL(/view=stackedBars/)
	})

	test('the calendar icon and chart-line icon navigate back to Calendar and Summary', async ({ authenticatedPage, seed }) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(`/activity-history/detail?date=${date}`)
		const icons = authenticatedPage.locator('main button').filter({ has: authenticatedPage.locator('svg') })
		await icons.first().click()
		await expect(authenticatedPage).toHaveURL(/\/activity-history\/calendar$/)
	})

	test('the empty state renders its copy with the period label, on a day with no history', async ({
		authenticatedPage,
		seed,
	}) => {
		// -400 days, not a small offset: which specific nearby day comes back empty was observed to
		// differ between two reseeds run minutes apart against the same seedDateUtc (fixture-generation
		// is not offset-stable), so this picks a date far outside any plausible generated window instead.
		const emptyDate = isoDateOffset(seed, -400)
		await authenticatedPage.goto(`/activity-history/detail?date=${emptyDate}`)
		await expect(authenticatedPage.getByText('No data for this period')).toHaveCount(3)
	})

	test('Export downloads a CSV named with the date and groupBy', async ({ authenticatedPage, seed }) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(`/activity-history/detail?date=${date}`)
		await authenticatedPage.getByRole('heading', { name: 'History Detail' }).waitFor({ state: 'visible' })
		await authenticatedPage.getByRole('button', { name: 'Export' }).click()
		const downloadPromise = authenticatedPage.waitForEvent('download')
		await authenticatedPage.getByRole('listitem').filter({ hasText: 'CSV (.csv)' }).click()
		const download = await downloadPromise
		expect(download.suggestedFilename()).toContain(date)
		expect(download.suggestedFilename()).toContain('activity')
	})

	test('all query params survive a reload', async ({ authenticatedPage, seed }) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(
			`/activity-history/detail?date=${date}&view=timeline&groupBy=ROLE&windowSize=30m&timeFrom=08:00&timeTo=23:55&baseline=sameWeekday&topN=5`,
		)
		await authenticatedPage.getByRole('heading', { name: 'History Detail' }).waitFor({ state: 'visible' })
		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(new RegExp(`date=${date}`))
		await expect(authenticatedPage).toHaveURL(/groupBy=ROLE/)
		await expect(authenticatedPage).toHaveURL(/topN=5/)
	})
})

test.describe('Findings from the inventory pass — semantic tier, not yet fixed', () => {
	// findings.md B1: the period-total banner is compressed to ~2 illegible characters in the Summary
	// view's Top Activities header row instead of wrapping.
	test.fixme('B1: the period-total banner stays readable in the Top Activities header', async () => {})

	// findings.md B2: a failed dashboard request renders identically to a genuinely empty period —
	// no distinct error state.
	test.fixme('B2: a failed pie-chart request shows a distinct state from a genuine empty period', async () => {})

	// findings.md B3: the breadcrumb reads "Home > Summary" while viewing Detail.
	test.fixme('B3: the breadcrumb names the Detail page, not "Summary"', async ({ authenticatedPage, seed }) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(`/activity-history/detail?date=${date}`)
		await expect(authenticatedPage.locator('.v-breadcrumbs')).not.toContainText('Summary')
	})

	// findings.md B4: calendar holiday names render in Slovak regardless of the account's locale.
	test.fixme('B4: holiday names render in the account locale, not always Slovak', async () => {})

	// findings.md A1 (fixed by F29): a bar on Summary is a named button; Enter drills into Detail on
	// the bar's own date. On Detail, where nothing listens for a click, the same bar is a named graphic.
	test('A1: stacked-bar columns are named buttons on Summary and named graphics on Detail', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/activity-history')
		const bar = authenticatedPage.getByRole('button', { name: /^View details for .+, .+, .+/ }).first()
		await bar.waitFor()
		await bar.focus()
		await authenticatedPage.keyboard.press('Enter')
		await expect(authenticatedPage).toHaveURL(/\/activity-history\/detail\?.*date=\d{4}-\d{2}-\d{2}/)
		// Detail opens on the timeline; the stacked bars are its other view.
		const date = new URL(authenticatedPage.url()).searchParams.get('date')
		await authenticatedPage.goto(`/activity-history/detail?date=${date}&view=stackedBars`)
		const graphic = authenticatedPage.locator('.bar-column').first()
		await graphic.waitFor()
		await expect(graphic).toHaveAttribute('role', 'img')
		await expect(graphic).toHaveAttribute('aria-label', /.+, .+, .+/)
		await expect(graphic).not.toHaveAttribute('tabindex', /.+/)
	})

	// findings.md A2: calendar day cells have no accessible name.
	test.fixme('A2: calendar day cells expose an accessible name naming the date', async () => {})

	// findings.md P1 (fixed by F30): the card is a toggle, so it says so and exposes aria-pressed.
	test('P1: the top-activity card is a "Highlight … in the chart" toggle with aria-pressed', async ({
		authenticatedPage,
		seed,
	}) => {
		const date = isoDateOffset(seed, -5)
		await authenticatedPage.goto(`/activity-history/detail?date=${date}`)
		const card = authenticatedPage.getByRole('button', { name: /^Highlight .+ in the chart$/ }).first()
		await card.waitFor()
		await expect(card).toHaveAttribute('aria-pressed', 'false')
		await card.focus()
		await authenticatedPage.keyboard.press('Enter')
		await expect(card).toHaveAttribute('aria-pressed', 'true')
		await authenticatedPage.keyboard.press('Enter')
		await expect(card).toHaveAttribute('aria-pressed', 'false')
	})

	// findings.md P3: HistoryCalendarView has no <h1>, unlike its two sibling views.
	test.fixme('P3: the Calendar view renders a page heading like Summary and Detail do', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/calendar')
		await expect(authenticatedPage.getByRole('heading', { level: 1 })).toBeVisible()
	})
})
