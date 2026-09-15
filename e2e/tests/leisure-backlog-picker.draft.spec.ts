import { expect, test } from '../fixtures/auth'

// Structural tier only, from a live crawl of /leisure/backlog and /leisure/pick (inventory pass,
// docs/views/leisure-backlog-picker/). Semantic assertions (ranking, scoring, the three blocker
// findings X1/X2/X3, the percent-format bug B1) are left as named fixme stubs — see findings.md for
// the full repro/verify steps. Do not un-skip and assert around any of them without re-reading the
// finding first; several look like a bug in the code they'd be pinned to, not in the app.

test.describe('Backlog (/leisure/backlog)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/backlog')
		await authenticatedPage.getByRole('columnheader', { name: /^Activity/ }).waitFor({ state: 'visible' })
	})

	test('loads the table with its column headers', async ({ authenticatedPage }) => {
		const headers = [
			/^Activity/,
			'Location',
			'Weather',
			'Energy',
			'Cost',
			'Duration (min)',
			'Repeatable activity',
			'Experienced',
		]
		for (const name of headers) {
			await expect(authenticatedPage.getByRole('columnheader', { name })).toBeVisible()
		}
	})

	test('Activity column is sortable, Location is not', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('columnheader', { name: /^Activity/ }).click()
		await expect(authenticatedPage).toHaveURL(/sortBy=activity\.name:desc/)

		const urlBeforeLocationClick = authenticatedPage.url()
		await authenticatedPage.getByRole('columnheader', { name: 'Location' }).click()
		await expect(authenticatedPage).toHaveURL(urlBeforeLocationClick)
	})

	test('Filter panel opens, Escape closes it', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		const panel = authenticatedPage.getByRole('dialog', { name: 'Filter' })
		await expect(panel).toBeVisible()

		await authenticatedPage.keyboard.press('Escape')
		await expect(panel).not.toBeVisible()
	})

	test('activity-name filter chip and URL param survive a reload', async ({ authenticatedPage }) => {
		// Deliberately NOT an assertion that the table narrows to matching rows — see X1: it doesn't,
		// on the main table request, when a sort key is also active (the default state). This only
		// checks the URL/chip plumbing, which does work.
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.getByRole('textbox', { name: 'Activity' }).fill('novel')
		await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
		await expect(authenticatedPage).toHaveURL(/activityName=novel/)
		await expect(authenticatedPage.getByText('Activity: novel')).toBeVisible()

		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/activityName=novel/)
		await expect(authenticatedPage.getByText('Activity: novel')).toBeVisible()
	})

	test.fixme(
		'an activity-name filter matching nothing narrows the table to the empty state',
		// X1: confirmed broken. The main table request (itemsPerPage:25, sortBy naming the joined
		// activity.name column) ignores `filter.activityName` entirely and returns every row, while the
		// view's two count-only requests (itemsPerPage:1, sortBy:[]) correctly filter to zero under the
		// identical filter object. A backend defect, not a locator problem — see findings.md X1.
		async () => {},
	)

	test('delete confirmation names the activity and does not close on Escape', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Delete' }).click()
		const confirmDialog = authenticatedPage.getByRole('dialog', { name: 'Delete confirmation' })
		await expect(confirmDialog.getByText('Are you sure you want to delete Read a Novel?')).toBeVisible()

		// Framework default (persistent=true) — see docs/views/_shell/inventory.md finding A1. This is
		// documenting the current behaviour, not endorsing it.
		await authenticatedPage.keyboard.press('Escape')
		await expect(confirmDialog).toBeVisible()

		await authenticatedPage.getByRole('button', { name: 'Cancel' }).click()
		await expect(confirmDialog).not.toBeVisible()
	})

	test.fixme(
		'Duration (min) column shows plain minutes, not a percentage',
		// B1: 'durationMinutes'.toLowerCase() contains 'ratio' as a substring, which
		// useTableFormatters.ts's keyword heuristic matches to the percent formatter. Renders "45.00 %"
		// instead of "45". See findings.md B1.
		async () => {},
	)

	test.fixme(
		'submitting the create form with no activity selected shows a visible error',
		// X3: the Activity/Location/Weather/Cost fields default to the numeric id 0 (not null), which
		// (a) displays as the literal text "0" instead of a placeholder, and (b) passes requiredRule
		// (which only rejects null/undefined/empty). The request reaches the server, gets a 400, and
		// NO snackbar or field error ever appears (confirmed via a 1.8s DOM poll) — a fully silent
		// failure. See findings.md X3.
		async () => {},
	)
})

test.describe('Picker ("What should I do?", /leisure/pick)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/pick')
		await authenticatedPage.getByRole('button', { name: '1 h' }).waitFor({ state: 'visible' })
	})

	test('seeds minutes/energy/people/seed into the URL on bare load', async ({ authenticatedPage }) => {
		await expect(authenticatedPage).toHaveURL(/minutes=60/)
		await expect(authenticatedPage).toHaveURL(/energy=medium/)
		await expect(authenticatedPage).toHaveURL(/people=1/)
		await expect(authenticatedPage).toHaveURL(/seed=\d+/)
	})

	test('constraint changes update the URL and survive a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: '2 h' }).click()
		await expect(authenticatedPage).toHaveURL(/minutes=120/)

		await authenticatedPage.reload()
		await expect(authenticatedPage).toHaveURL(/minutes=120/)
		// VBtnToggle marks the active choice with a class, not aria-pressed.
		await expect(authenticatedPage.getByRole('button', { name: '2 h' })).toHaveClass(/v-btn--active/)
	})

	test('"Something else" changes the seed without changing other constraints', async ({ authenticatedPage }) => {
		// At the default 60 min this account shows ZERO suggestions (see X2 — the weather-signal bug
		// excludes the only backlog entry at every time budget), and "Something else" only renders
		// inside the suggestions branch of the template, not the empty state. 2 h surfaces a bucket-list
		// card, which is unaffected by X2, so the button exists to click.
		await authenticatedPage.getByRole('button', { name: '2 h' }).click()
		await authenticatedPage.getByRole('button', { name: 'Something else' }).waitFor({ state: 'visible' })

		const before = new URL(authenticatedPage.url())
		await authenticatedPage.getByRole('button', { name: 'Something else' }).click()
		// The reroll writes the new seed via an async `router.replace` (usePickerUrlState's `watch`),
		// so the URL does not necessarily carry it the instant `click()` resolves.
		await authenticatedPage.waitForURL(url => url.searchParams.get('seed') !== before.searchParams.get('seed'))
		const after = new URL(authenticatedPage.url())

		expect(after.searchParams.get('seed')).not.toEqual(before.searchParams.get('seed'))
		expect(after.searchParams.get('minutes')).toEqual(before.searchParams.get('minutes'))
	})

	test('"Browse everything" navigates to the backlog', async ({ authenticatedPage }) => {
		// Reachable regardless of pool state: it is also the nothingFits empty state's "Fill the
		// backlog" link when no cards are showing, and a footer link when they are.
		const browseLink = authenticatedPage.getByRole('link', { name: /Browse everything|Fill the backlog/ })
		await browseLink.click()
		await expect(authenticatedPage).toHaveURL(/\/leisure\/backlog/)
	})

	test('"More constraints" reveals secondary fields with placeholder text, not a raw value', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.getByRole('button', { name: 'More constraints' }).click()
		await expect(authenticatedPage.getByRole('combobox', { name: 'Spend at most' })).toHaveAttribute(
			'placeholder',
			'Anything',
		)
		await expect(authenticatedPage.getByRole('combobox', { name: 'Location' })).toHaveAttribute(
			'placeholder',
			'Anything',
		)
	})

	test.fixme(
		'a suggestion from the backlog appears when constraints are satisfied',
		// X2: the picker excludes EVERY backlog entry with any stated weatherDependency (including
		// the "None" lookup row) whenever GET /leisure-weather-fit returns an empty
		// matchingWeatherDependencyIds array, because useLeisurePicker.ts's `?? null` fallback does not
		// treat an empty array the same as "no signal" — contradicting leisureScoring.ts's own stated
		// rule. Confirmed: the seeded backlog entry never surfaces at any time budget from 15 min to
		// 4 h. See findings.md X2.
		async () => {},
	)

	test.fixme(
		'ranking, staleness and the three empty states',
		// Semantic: the ordering rule (leisureScoring.ts), the "nothingFiled" vs "nothingFits" vs
		// "failed" distinction (only "nothingFits" was reachable with the current seed — see findings.md
		// U1), and the loading skeleton (U2) all need a human to confirm the *value*, not just the
		// shape.
		async () => {},
	)
})
