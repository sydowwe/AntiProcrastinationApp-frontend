import { expect, test } from '../fixtures/auth'

// The orphan surfaces of the scheduler views — scheduler U3 (docs/views/_submodule/scheduler/findings.md).
// None of them had ever rendered: a running host has a handler for every job its registrars wrote, so
// `isOrphaned` was false on every row. Since `e2e-v5` the seed upserts one job whose handler key resolves to
// nothing (`E2e.OrphanedFixtureJob`) and one past run of it; their ids are resolved per database and read
// off `seed.scheduler`, never hardcoded. Read-only: every control asserted here is one the page disables.

const JOBS = '/planovac/ulohy'
const RUNS = '/planovac/behy'
const ATTENTION = '/planovac/pozornost'
const ORPHANED_JOB_KEY = 'E2e.OrphanedFixtureJob'
const ORPHANED_HANDLER_KEY = 'E2e.RemovedHandler'
const CANNOT_TRIGGER = 'An orphaned job cannot be triggered — it has no handler code.'
const CANNOT_REPLAY = 'This run cannot be replayed — its job no longer has registered handler code.'

test.describe(`Orphaned job in the jobs grid (${JOBS})`, () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		// Owner-module filter, because a null nextRunAt sorts the row off the first page.
		await authenticatedPage.goto(`${JOBS}?ownerModule=E2eFixture`)
		await authenticatedPage.getByRole('link', { name: ORPHANED_JOB_KEY }).waitFor()
	})

	test('the row carries the Orphaned chip', async ({ authenticatedPage }) => {
		const row = authenticatedPage.getByRole('row').filter({ has: authenticatedPage.getByRole('link', { name: ORPHANED_JOB_KEY }) })
		await expect(row.getByText('Orphaned', { exact: true })).toBeVisible()
	})

	test('the row Trigger is disabled and describes why', async ({ authenticatedPage }) => {
		const trigger = authenticatedPage.getByRole('button', { name: `Trigger job ${ORPHANED_JOB_KEY} now` })
		await expect(trigger).toBeDisabled()
		await expect(trigger).toHaveAccessibleDescription(CANNOT_TRIGGER)
	})
})

test.describe(`Orphaned job detail (${JOBS}/:id)`, () => {
	test.beforeEach(async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`${JOBS}/${seed.scheduler.orphanedJob}`)
		await authenticatedPage.getByRole('heading', { name: ORPHANED_JOB_KEY, level: 1 }).waitFor()
	})

	test('shows the orphan alert beside the chip', async ({ authenticatedPage }) => {
		const main = authenticatedPage.locator('#main-content')
		await expect(main.getByText('Orphaned job', { exact: true })).toBeVisible()
		await expect(main.getByText(/its handler code no longer exists/)).toBeVisible()
		await expect(main.getByText('Orphaned', { exact: true })).toBeVisible()
	})

	test('Trigger now is disabled, with the reason as visible text', async ({ authenticatedPage }) => {
		const trigger = authenticatedPage.getByRole('button', { name: 'Trigger now' })
		await expect(trigger).toBeDisabled()
		await expect(authenticatedPage.getByText(CANNOT_TRIGGER)).toBeVisible()
		await expect(trigger).toHaveAccessibleDescription(CANNOT_TRIGGER)
	})

	test('the run-history Replay is disabled for the orphan\'s run', async ({ authenticatedPage }) => {
		const replay = authenticatedPage.getByRole('button', { name: /^Replay the run started at/ }).first()
		await expect(replay).toBeDisabled()
		await expect(replay).toHaveAccessibleDescription(CANNOT_REPLAY)
	})
})

test.describe(`Run of an orphaned job (${RUNS}/:id)`, () => {
	test.beforeEach(async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`${RUNS}/${seed.scheduler.orphanedJobRun}`)
		await authenticatedPage.getByRole('heading', { name: `Run #${seed.scheduler.orphanedJobRun}`, level: 1 }).waitFor()
	})

	test('Replay run is disabled, with the orphan reason as visible text', async ({ authenticatedPage }) => {
		const replay = authenticatedPage.getByRole('button', { name: 'Replay run' })
		await expect(replay).toBeDisabled()
		await expect(authenticatedPage.getByText(CANNOT_REPLAY)).toBeVisible()
		await expect(replay).toHaveAccessibleDescription(CANNOT_REPLAY)
	})
})

test.describe(`Orphaned attention list (${ATTENTION})`, () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(ATTENTION)
		await authenticatedPage.getByRole('heading', { name: 'Needs attention', level: 1 }).waitFor()
	})

	test('lists the orphan, naming the handler key that stopped resolving', async ({ authenticatedPage }) => {
		const link = authenticatedPage.getByRole('link', { name: ORPHANED_JOB_KEY })
		await expect(link).toHaveCount(1)
		await expect(authenticatedPage.getByText(new RegExp(ORPHANED_HANDLER_KEY.replace('.', '\\.')))).toBeVisible()
	})

	test('the orphan link opens its job', async ({ authenticatedPage, seed }) => {
		await authenticatedPage.getByRole('link', { name: ORPHANED_JOB_KEY }).click()
		await expect(authenticatedPage).toHaveURL(new RegExp(`${JOBS}/${seed.scheduler.orphanedJob}$`))
	})
})
