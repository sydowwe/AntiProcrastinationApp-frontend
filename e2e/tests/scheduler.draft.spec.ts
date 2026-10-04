import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the scheduler inventory pass
// (docs/views/_submodule/scheduler/). Semantic-tier claims and every logged bug/unverified finding are `test.fixme`
// stubs, per prompts/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// Scheduler jobs are NOT seed rows — the server's modules register them, so the fixture supplies no ids.
// Jobs are found by their stable job KEY instead (`Portal.SuggestionPatternRefresh`, a 10-second cron
// job every host registers), and run ids are read off the page. Paths are this app's Slovak overrides
// (`APP_SCHEDULER_PATHS` in src/router.ts). Read-only: nothing here triggers, pauses or replays a job.

const JOBS = '/planovac/ulohy'
const ATTENTION = '/planovac/pozornost'
const STABLE_JOB_KEY = 'Portal.SuggestionPatternRefresh'

test.describe(`Scheduled jobs list (${JOBS})`, () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(JOBS)
		await authenticatedPage.getByRole('heading', { name: 'Scheduled jobs', level: 1 }).waitFor()
	})

	test('renders the jobs grid with its column headers', async ({ authenticatedPage }) => {
		// "Job key" and "Next run" carry a sort-priority badge in their accessible name ("Job key 2") — P1.
		for (const name of [/^Job key/, 'Owner module', 'Handler key', 'Schedule', 'Status', 'Last run', /^Next run/]) {
			await expect(authenticatedPage.getByRole('columnheader', { name })).toBeVisible()
		}
	})

	test('clicking a sortable header writes the sort to the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('columnheader', { name: 'Status' }).click()
		await expect(authenticatedPage).toHaveURL(/sortBy=status:asc/)
	})

	test('"Overdue only" writes ?overdue=true and survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('checkbox', { name: 'Overdue only' }).click()
		await expect(authenticatedPage).toHaveURL(/overdue=true/)
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByRole('checkbox', { name: 'Overdue only' })).toBeChecked()
	})

	test('the Filter dialog opens and Escape closes it', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Filter' })
		await expect(dialog.getByRole('textbox', { name: 'Owner module' })).toBeVisible()
		await authenticatedPage.keyboard.press('Escape')
		await expect(dialog).toBeHidden()
	})

	test('an owner-module filter becomes a URL param and a chip', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.getByRole('textbox', { name: 'Owner module' }).fill('Portal')
		await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
		await expect(authenticatedPage).toHaveURL(/ownerModule=Portal/)
		await expect(authenticatedPage.getByText('Owner module: Portal')).toBeVisible()
	})

	test('"Needs attention" navigates to the health dashboard', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Needs attention' }).first().click()
		await expect(authenticatedPage).toHaveURL(new RegExp(`${ATTENTION}$`))
	})

	test.fixme('a bare URL stays bare — no jobKey tie-breaker is pushed on mount', async () => {
		// P1: BasicTable appends `jobKey` because defaultSortBy is `nextRunAt` only.
	})

	test.fixme('Next run and Actions columns are visible at 1440 px without horizontal scroll', async () => {
		// B1: table 1369 px in a 1094 px box.
	})

	test.fixme('a Removed job\'s disabled Trigger explains why, reachably', async () => {
		// B2: reason lives only on `title` of a pointer-events:none button; Removed has no reason at all.
	})

	test.fixme('Overdue only returns exactly the server\'s overdue jobs', async () => {
		// Semantic: overdue is a server rule with a grace margin. B6: 12 one-shots overdue for 14 days.
	})
})

test.describe(`Job detail (${JOBS}/:id)`, () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${JOBS}?ownerModule=Portal`)
		await authenticatedPage.getByRole('link', { name: STABLE_JOB_KEY }).click()
		await authenticatedPage.getByRole('heading', { name: STABLE_JOB_KEY, level: 1 }).waitFor()
	})

	test('renders the job info card and the run-history toolbar', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('heading', { name: 'Job info' })).toBeVisible()
		await expect(authenticatedPage.getByRole('heading', { name: 'Run history' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Trigger now' })).toBeVisible()
	})

	test('Back to list returns to the jobs list', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Back to list' }).click()
		await expect(authenticatedPage).toHaveURL(new RegExp(`${JOBS}(\\?|$)`))
	})

	test('the replay dialog focuses its acknowledgement, gates confirm, and closes on Escape', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage
			.getByRole('button', { name: /^Replay the run started at/ })
			.first()
			.click()
		const confirm = authenticatedPage.getByRole('button', { name: 'Replay run' })
		await expect(confirm).toBeDisabled()
		await expect(authenticatedPage.getByRole('checkbox', { name: /repeat real side effects/ })).toBeFocused()
		await authenticatedPage.keyboard.press('Escape')
		await expect(confirm).toBeHidden()
	})

	test('an unknown job id renders "Job not found"', async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${JOBS}/999999`)
		await expect(authenticatedPage.getByText('Job not found')).toBeVisible()
	})

	test('a malformed job id falls through to the app\'s not-found page', async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${JOBS}/abc`)
		await expect(authenticatedPage.getByText('Page not found')).toBeVisible()
	})

	test('the run-history grid shows its rows (non-zero scroll box)', async ({ authenticatedPage }) => {
		// X1: `.v-table__wrapper` was 0 px high at every viewport — rows in the a11y tree, none on screen.
		const wrapper = authenticatedPage.locator('#main-content .v-table__wrapper')
		const firstRow = wrapper.locator('tbody tr').first()
		await firstRow.waitFor()
		expect(await wrapper.evaluate(el => el.clientHeight)).toBeGreaterThan(0)
		await expect(firstRow).toBeInViewport()
	})

	test.fixme('the breadcrumb names "Scheduled jobs" once', async () => {
		// B3: nav crumb + the view's own jobsCrumb.
	})

	test.fixme('run-history start-time links have distinct names', async () => {
		// A1: named "now" / "2 minutes ago".
	})

	test.fixme('a 404 shows the alert without a duplicate snackbar', async () => {
		// P3: interceptor snackbar on top of the not-found alert.
	})
})

test.describe('Run detail (/planovac/behy/:id)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${JOBS}?ownerModule=Portal`)
		await authenticatedPage.getByRole('link', { name: STABLE_JOB_KEY }).click()
		// Read the href rather than clicking: see X1.
		const href = await authenticatedPage.locator('a[href^="/planovac/behy/"]').first().getAttribute('href')
		expect(href).not.toBeNull()
		await authenticatedPage.goto(href!)
		await authenticatedPage.getByRole('heading', { name: /^Run #\d+$/, level: 1 }).waitFor()
	})

	test('renders the detail, payload and lineage cards', async ({ authenticatedPage }) => {
		for (const name of ['Run detail', 'Payload snapshot', 'Replay lineage']) {
			await expect(authenticatedPage.getByRole('heading', { name, level: 2 })).toBeVisible()
		}
	})

	test('the job-key link goes to the job', async ({ authenticatedPage }) => {
		// Scoped to #main-content: the breadcrumb carries a link with the same name.
		await authenticatedPage.locator('#main-content').getByRole('link', { name: STABLE_JOB_KEY }).click()
		await expect(authenticatedPage.getByRole('heading', { name: STABLE_JOB_KEY, level: 1 })).toBeVisible()
	})

	test('an unknown run id renders "Run not found"', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/planovac/behy/999999')
		await expect(authenticatedPage.getByText('Run not found')).toBeVisible()
	})

	test.fixme('not-found after in-app navigation drops the previous run\'s breadcrumb', async () => {
		// B4: setBreadcrumbExtra only runs on success.
	})

	test.fixme('the three copy buttons have distinct names', async () => {
		// A2: all three are "Copy to clipboard".
	})

	test.fixme('automatic retries are not labelled as replays', async () => {
		// P4: semantic — needs a run with Retry children (seed has no scheduler data).
	})
})

test.describe(`Needs attention (${ATTENTION})`, () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(ATTENTION)
		await authenticatedPage.getByRole('heading', { name: 'Needs attention', level: 1 }).waitFor()
	})

	test('renders the three status count cards and the three attention lists', async ({ authenticatedPage }) => {
		for (const name of [/^Active \d+$/, /^Paused \d+$/, /^Removed \d+$/]) {
			await expect(authenticatedPage.getByRole('link', { name })).toBeVisible()
		}
		for (const text of ['Failed', 'Overdue / stuck', 'Orphaned']) {
			await expect(authenticatedPage.getByText(text, { exact: true })).toBeVisible()
		}
	})

	test('a status count card links to the filtered jobs list', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: /^Removed \d+$/ }).click()
		await expect(authenticatedPage).toHaveURL(/status=Removed/)
	})

	test('Back to jobs returns to the list', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Back to jobs' }).click()
		await expect(authenticatedPage).toHaveURL(new RegExp(`${JOBS}(\\?|$)`))
	})

	test('the run-outcome rollup card is not crushed by the lists below it', async ({ authenticatedPage }) => {
		// B5: every child of the page column could shrink, and this `overflow: hidden` card was the
		// one that gave way — 32 of its 104 px when the lists are long.
		const card = authenticatedPage
			.locator('#main-content .v-card')
			.filter({ has: authenticatedPage.getByRole('heading', { name: /^Run outcomes over the last/ }) })
		await card.waitFor()
		const { clientHeight, scrollHeight } = await card.evaluate(el => ({
			clientHeight: el.clientHeight,
			scrollHeight: el.scrollHeight,
		}))
		expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1)
	})

	test.fixme('counts on each card match the jobs list it links to', async () => {
		// Semantic (verified by hand 2026-09-30: Removed 42 → 42 rows, overdue 12 → 12 rows).
	})

	test.fixme('polling pauses while the tab is hidden', async () => {
		// U2: not observable headless.
	})
})
