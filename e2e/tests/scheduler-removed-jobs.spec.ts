import type { Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * Scheduler O2 + B6 (`docs/views/_submodule/scheduler/findings.md`): the jobs list hides `Removed` jobs by default,
 * an *Include removed* switch brings them back, and an explicit `status=Removed` still lists them.
 *
 * The seed writes no `Removed` job (it leaves the scheduler schema alone), so each test makes its own: it
 * schedules a real timer alarm through the app's API and cancels it, which is the path that retires the alarm's
 * one-shot job to `Removed`. The row it leaves is a Removed registry row, which is the end state a cancelled
 * alarm has anyway — nothing a later spec reads.
 *
 * Not covered here: a one-shot retiring itself after it *fires*. That needs a real fire, which would send the
 * primary user a notification and skew the notification specs; `SchedulerSpentOneShotTests` pins it server-side.
 */
test.describe.configure({ mode: 'serial' })

const JOBS = '/planovac/ulohy'
const ALARM_HANDLER = 'History.TimerBoundaryAlarm'

async function activeAlarmJobKeys(page: Page): Promise<string[]> {
	const response = await page.request.post(`${apiUrl()}/api/scheduler-dashboard/jobs-overview`, {
		data: {
			page: 1,
			itemsPerPage: 200,
			sortBy: [],
			useFilter: true,
			filter: { handlerKey: ALARM_HANDLER, status: 'Active' },
		},
	})
	expect(response.ok()).toBe(true)
	const body = (await response.json()) as { items: { jobKey: string }[] }
	return body.items.map(item => item.jobKey)
}

/** Schedules one alarm half an hour out, cancels it, and returns the job key it left behind as Removed. */
async function cancelledAlarmJobKey(page: Page): Promise<string> {
	const before = new Set(await activeAlarmJobKeys(page))
	const sessionId = crypto.randomUUID()

	const scheduled = await page.request.post(`${apiUrl()}/api/activity-history/timer-alarm/schedule`, {
		data: {
			sessionId,
			url: '/activity-history/pomodoro',
			boundaries: [{ boundaryAt: new Date(Date.now() + 30 * 60_000).toISOString(), phase: 'Focus' }],
		},
	})
	expect(scheduled.ok()).toBe(true)

	const created = (await activeAlarmJobKeys(page)).filter(key => !before.has(key))
	expect(created, 'scheduling one boundary registers exactly one job').toHaveLength(1)

	const cancelled = await page.request.post(`${apiUrl()}/api/activity-history/timer-alarm/cancel`, {
		data: { sessionId },
	})
	expect(cancelled.ok()).toBe(true)

	return created[0]
}

/** Navigates and waits for the grid's own fetch, so a "not there" assertion is not read off an unloaded table. */
async function gotoJobs(page: Page, query: string) {
	await Promise.all([
		page.waitForResponse(response => response.url().includes('/scheduler-dashboard/jobs-overview') && response.ok()),
		page.goto(`${JOBS}${query}`),
	])
}

test.describe(`Removed jobs in the jobs list (${JOBS})`, () => {
	test('a cancelled alarm is hidden by default and comes back with Include removed', async ({ authenticatedPage: page }) => {
		const jobKey = await cancelledAlarmJobKey(page)

		await gotoJobs(page, `?handlerKey=${ALARM_HANDLER}`)
		await expect(page.getByRole('link', { name: jobKey, exact: true })).toHaveCount(0)

		const includeRemoved = page.getByRole('checkbox', { name: 'Include removed' })
		await expect(includeRemoved).not.toBeChecked()

		await Promise.all([
			page.waitForResponse(response => response.url().includes('/scheduler-dashboard/jobs-overview') && response.ok()),
			includeRemoved.check(),
		])
		await expect(page).toHaveURL(/[?&]removed=true/)
		const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: jobKey, exact: true }) })
		await expect(row.getByText('Removed', { exact: true })).toBeVisible()

		await page.reload()
		await expect(page.getByRole('link', { name: jobKey, exact: true })).toBeVisible()
		await expect(page.getByRole('checkbox', { name: 'Include removed' })).toBeChecked()
	})

	test('status=Removed lists Removed jobs, and the switch is disabled while it is set', async ({ authenticatedPage: page }) => {
		const jobKey = await cancelledAlarmJobKey(page)

		await gotoJobs(page, `?handlerKey=${ALARM_HANDLER}&status=Removed`)

		await expect(page.getByRole('link', { name: jobKey, exact: true })).toBeVisible()
		await expect(page.getByRole('checkbox', { name: 'Include removed' })).toBeDisabled()
		await expect(page).not.toHaveURL(/removed=true/)
	})

	test('a bare jobs list stays bare and shows no Removed row', async ({ authenticatedPage: page }) => {
		await cancelledAlarmJobKey(page)

		await gotoJobs(page, '')

		expect(new URL(page.url()).search).toBe('')
		await expect(page.getByRole('row').filter({ hasText: /^.*\bRemoved\b.*$/ })).toHaveCount(0)
	})
})
