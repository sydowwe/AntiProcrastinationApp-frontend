import { apiUrl, expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the tracking-settings
// inventory pass (docs/views/tracking-settings/). Semantic-tier claims — anything asserting a
// VALUE or a RULE is correct, and every logged bug/unverified finding — are `test.fixme` stubs,
// per docs/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.

test.describe('Desktop tracking settings (/activity-tracking/desktop/settings/:tableView)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await authenticatedPage.getByRole('heading', { name: 'Distinct Process Entries' }).waitFor({ state: 'visible' })
	})

	test('renders the distinct entries table with its three columns', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Process Name' })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: /Product Name/ })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Window Title' })).toBeVisible()
	})

	test('Mappings tab navigates via a real route change, Distinct entries tab navigates back', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Mappings' }).click()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/desktop\/settings\/mappings$/)

		await authenticatedPage.getByRole('link', { name: 'Distinct entries' }).click()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/desktop\/settings\/distinctEntries$/)
	})

	test('browser back/forward between tabs keeps the URL and rendered tab in sync (R4 route-param fix)', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.getByRole('link', { name: 'Mappings' }).click()
		await expect(authenticatedPage).toHaveURL(/\/mappings$/)

		await authenticatedPage.goBack()
		await expect(authenticatedPage).toHaveURL(/\/distinctEntries$/)
		await expect(authenticatedPage.getByRole('link', { name: 'Distinct entries' })).toBeVisible()

		await authenticatedPage.goForward()
		await expect(authenticatedPage).toHaveURL(/\/mappings$/)
	})

	test('an unrecognised :tableView value falls back to the distinct entries table, not an error', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/not-a-real-tab')
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Process Name' })).toBeVisible()
	})

	test('Enter in the Process Name field submits the filter, same as clicking Filter', async ({ authenticatedPage }) => {
		const processName = authenticatedPage.getByRole('textbox', { name: 'Process Name' })
		await processName.fill('rider')
		await processName.press('Enter')
		// Both seeded rider64.exe rows match; the other four seeded desktop entries don't.
		await expect(authenticatedPage.getByRole('cell', { name: 'rider64.exe' })).toHaveCount(2)
	})

	test('the dismissible hint alert stays dismissed after a reload (useUserScopedStorage)', async ({ authenticatedPage }) => {
		const hint = authenticatedPage.getByText('Use the filter fields to define a matching pattern')
		await expect(hint).toBeVisible()
		await authenticatedPage.getByRole('button', { name: 'Close' }).click()
		await expect(hint).not.toBeVisible()

		await authenticatedPage.reload()
		await authenticatedPage.getByRole('heading', { name: 'Distinct Process Entries' }).waitFor({ state: 'visible' })
		await expect(hint).not.toBeVisible()
	})

	test('"Create new activity" opens a dialog that Cancel closes without navigating away', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Create new activity' }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Create new activity' })
		await expect(dialog).toBeVisible()

		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).not.toBeVisible()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/desktop\/settings\/distinctEntries$/)
	})
})

test.describe('Android tracking settings (/activity-tracking/android/settings/:tableView)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/android/settings/distinctEntries')
		await authenticatedPage.getByRole('heading', { name: 'Distinct App Entries' }).waitFor({ state: 'visible' })
	})

	test('renders the distinct entries table with its two columns (no Window Title — apps have none)', async ({
		authenticatedPage,
	}) => {
		await expect(authenticatedPage.getByRole('columnheader', { name: /App Label/ })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Package Name' })).toBeVisible()
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Window Title' })).toHaveCount(0)
	})

	test('Mappings tab navigates via a real route change', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Mappings' }).click()
		await expect(authenticatedPage).toHaveURL(/\/activity-tracking\/android\/settings\/mappings$/)
	})
})

test.describe('Findings from the inventory pass — semantic tier, not yet fixed', () => {
	// docs/views/tracking-settings/findings.md X1: the mapping row (and its edit/delete buttons) is
	// present in the DOM but nothing is painted at its coordinates, and a real click cannot reach it.
	test.fixme(
		'X1: the Mappings tab row is visible and its edit button is clickable',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings')
			await authenticatedPage.getByRole('button', { name: 'edit' }).click()
			await expect(authenticatedPage).toHaveURL(/\/distinctEntries$/)
		},
	)

	// findings.md B1: none of the Mappings tab's filter controls (top pattern bar, or Is
	// active/Type/Role/Category/Activity below) trigger a re-fetch.
	test.fixme(
		'B1: changing the Type filter on the Mappings tab re-fetches the grid',
		async ({ authenticatedPage }) => {
			await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings')
			const requestPromise = authenticatedPage.waitForRequest(/tracker-desktop-mapping-by-pattern\/grid/)
			await authenticatedPage.getByLabel('Type').click()
			await authenticatedPage.getByRole('option', { name: 'Ignored' }).click()
			await requestPromise
		},
	)

	// findings.md B2: the breadcrumb on the Mappings tab reads the sibling dashboard's label
	// ("Desktop tracking") instead of this route's own ("Desktop settings").
	test.fixme('B2: breadcrumb on the Mappings tab reads "Desktop settings", not "Desktop tracking"', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings')
		await expect(authenticatedPage.locator('.v-breadcrumbs')).toContainText('Desktop settings')
	})

	// findings.md B3: the distinct-entries filter is plain component state, not a URL query param,
	// so it does not survive a reload (CLAUDE.md's "URL State" rule).
	test.fixme('B3: the Process Name filter survives a page reload via a URL query param', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await authenticatedPage.getByRole('textbox', { name: 'Process Name' }).fill('chrome')
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByRole('textbox', { name: 'Process Name' })).toHaveValue('chrome')
	})

	// findings.md U1: DesktopMappingsTable/AndroidMappingsTable never listen for BasicTable's
	// @onDelete, so confirming a delete may be a silent no-op. Blocked on X1 until the button can be
	// reached with a real click.
	test.fixme('U1: deleting a mapping actually removes it (blocked on X1)', async () => {})
})

// F12's second verification step (docs/views/_fix-queue.md, *Seed-data gaps*): two seeded mappings prove
// a row paints, not that the Mappings body scrolls inside the card. The rows are created through the
// app's own API and deleted afterwards, so the fixture stays read-only (CLAUDE.md, *Mutating specs* 1).
test.describe('Mappings body scrolls inside the card (/activity-tracking/desktop/settings/mappings — F12)', () => {
	const MAPPING_URL = `${apiUrl()}/api/activity-tracking/desktop/settings/tracker-desktop-mapping-by-pattern`
	const CREATED = 30

	test('more rows than fit: the table wrapper scrolls, the page does not', async ({ authenticatedPage, seed }) => {
		const ids: number[] = []
		try {
			for (let i = 0; i < CREATED; i++) {
				// Activity-targeted, not ignored: the tab's type control defaults to *Activity*, so an
				// ignored rule would be filtered out of the very list this is trying to fill.
				const created = await authenticatedPage.request.post(MAPPING_URL, {
					data: {
						processName: `e2e-scroll-${String(i).padStart(2, '0')}.exe`,
						processNameMatchType: 'Exact',
						isActive: true,
						activityId: seed.activities.bugFixing,
					},
				})
				expect(created.ok(), `could not create mapping ${i}`).toBe(true)
				ids.push(Number(await created.json()))
			}

			// A page big enough to hold every row, so the overflow is the table's and not the pager's.
			await authenticatedPage.goto('/activity-tracking/desktop/settings/mappings?perPage=50')
			const rows = authenticatedPage.locator('#app tbody tr')
			// Plus the seed's one activity rule (`desktopToActivity`); its ignored rule is under the other type.
			await expect(rows).toHaveCount(CREATED + 1)

			const wrapper = authenticatedPage.locator('#app .v-table__wrapper')
			const box = await wrapper.evaluate(el => ({
				scrollHeight: el.scrollHeight,
				clientHeight: el.clientHeight,
				bottom: el.getBoundingClientRect().bottom,
			}))
			expect(box.scrollHeight).toBeGreaterThan(box.clientHeight)
			// The fill-parent contract: the wrapper ends inside the viewport rather than growing the page.
			expect(box.bottom).toBeLessThanOrEqual(authenticatedPage.viewportSize()!.height)
			expect(
				await authenticatedPage.evaluate(
					() => document.scrollingElement!.scrollHeight <= document.scrollingElement!.clientHeight,
				),
			).toBe(true)

			// And it really scrolls: the last row is off-screen until the wrapper moves, then reachable.
			await expect(rows.last()).not.toBeInViewport()
			await wrapper.evaluate(el => el.scrollTo(0, el.scrollHeight))
			await expect(rows.last()).toBeInViewport()
		} finally {
			for (const id of ids) await authenticatedPage.request.delete(`${MAPPING_URL}/${id}`)
		}
	})
})

// findings.md B5 → backend B24 (landed 2026-09-21): every distinct row says which active rule covers it.
// The seed's activity rule is Exact on rider64.exe (two window titles → two rows); the other four
// desktop tuples have no rule. Android's rule is Exact on com.spotify.music.
test.describe('Rule column and coverage filter (/activity-tracking/{desktop,android}/settings/distinctEntries — B24)', () => {
	test('desktop: covered rows carry a chip naming the rule’s activity, the rest read Undecided', async ({
		authenticatedPage,
		seed,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Rule' })).toBeVisible()
		await expect(authenticatedPage.getByRole('link', { name: 'Desk Research' })).toHaveCount(2)
		await expect(authenticatedPage.getByRole('cell', { name: 'Undecided' })).toHaveCount(
			seed.counts.distinctDesktopEntries - 2,
		)
	})

	test('desktop: Undecided narrows to the uncovered tuples, writes ?coverage=Uncovered, and survives a reload', async ({
		authenticatedPage,
		seed,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await authenticatedPage.getByRole('link', { name: 'Desk Research' }).first().waitFor()
		await authenticatedPage.getByRole('button', { name: 'Undecided' }).click()
		await expect(authenticatedPage).toHaveURL(/\?coverage=Uncovered$/)
		await expect(authenticatedPage.getByRole('link', { name: 'Desk Research' })).toHaveCount(0)
		await expect(authenticatedPage.getByRole('cell', { name: 'rider64.exe' })).toHaveCount(0)
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByRole('cell', { name: 'Undecided' })).toHaveCount(
			seed.counts.distinctDesktopEntries - 2,
		)
		await expect(authenticatedPage.getByRole('cell', { name: 'rider64.exe' })).toHaveCount(0)
	})

	test('desktop: Covered lists only the two rider64.exe rows, and All clears the query', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries?coverage=Covered')
		await expect(authenticatedPage.getByRole('cell', { name: 'rider64.exe' })).toHaveCount(2)
		await expect(authenticatedPage.getByRole('cell', { name: 'Undecided' })).toHaveCount(0)
		await authenticatedPage.getByRole('button', { name: 'All', exact: true }).click()
		await expect(authenticatedPage).toHaveURL(/\/distinctEntries$/)
	})

	test('desktop: the chip deep-links to the Mappings tab with the rule id in the query', async ({
		authenticatedPage,
		seed,
	}) => {
		await authenticatedPage.goto('/activity-tracking/desktop/settings/distinctEntries')
		await authenticatedPage.getByRole('link', { name: 'Desk Research' }).first().click()
		await expect(authenticatedPage).toHaveURL(
			new RegExp(`/desktop/settings/mappings\\?mappingId=${seed.trackingMappings.desktopToActivity}$`),
		)
	})

	test('android: Spotify carries the rule chip; Undecided lists the other four apps', async ({
		authenticatedPage,
		seed,
	}) => {
		await authenticatedPage.goto('/activity-tracking/android/settings/distinctEntries')
		await expect(authenticatedPage.getByRole('link', { name: 'Read a Novel' })).toHaveCount(1)
		await authenticatedPage.getByRole('button', { name: 'Undecided' }).click()
		await expect(authenticatedPage).toHaveURL(/\?coverage=Uncovered$/)
		await expect(authenticatedPage.getByRole('cell', { name: 'Undecided' })).toHaveCount(
			seed.counts.distinctAndroidEntries - 1,
		)
		await expect(authenticatedPage.getByRole('cell', { name: 'Spotify' })).toHaveCount(0)
	})
})
