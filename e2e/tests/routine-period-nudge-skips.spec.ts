import type { Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

/**
 * OP1 (`docs/opportunities.md`): the server's period update is a full replace, and the client never
 * sent `freezeBudget` or `reminderLeadDays`. So every save from `/routine-settings` (even a rename)
 * reset the budget to the server default of 2, capped the banked freezes to it, and switched the
 * nudge off. Nothing on screen showed it. These specs pin the round trip.
 *
 * Each test creates its own period through the API and deletes it afterwards, so the fixture's four
 * periods stay read-only (CLAUDE.md, *Mutating specs* 1). Name and length are both unique per
 * account, and the seed uses lengths 1, 7, 30 and 365, so the throwaway uses 23 days. That is
 * neither week-aligned nor a seed length.
 *
 * The one-day check reads the seeded *Daily* row and cancels, so it writes nothing.
 */
test.describe.configure({ mode: 'serial' })

const PERIOD_NAME = 'E2E OP1 period'
const RENAMED = 'E2E OP1 period renamed'
const PERIOD_URL = () => `${apiUrl()}/api/routine-time-period`

type StoredPeriod = {
	id: number
	text: string
	freezeBudget: number
	freezesRemaining: number
	reminderLeadDays: number | null
}

async function createPeriod(page: Page, overrides: Partial<{ freezeBudget: number; reminderLeadDays: number | null }>) {
	const response = await page.request.post(PERIOD_URL(), {
		data: {
			text: PERIOD_NAME,
			color: 'blue',
			lengthInDays: 23,
			isHidden: false,
			streakThreshold: 80,
			streakGraceDays: 0,
			resetAnchorDay: 0,
			historyDepth: 4,
			freezeBudget: 2,
			reminderLeadDays: null,
			...overrides,
		},
	})
	expect(response.ok(), `could not create the period: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

async function storedPeriod(page: Page, id: number): Promise<StoredPeriod> {
	const response = await page.request.get(`${PERIOD_URL()}/${id}`)
	expect(response.ok()).toBe(true)
	return (await response.json()) as StoredPeriod
}

/** Deletes any leftover from an earlier, aborted run, under either name, so the create cannot 409. */
async function removeThrowawayPeriods(page: Page) {
	const response = await page.request.get(PERIOD_URL())
	expect(response.ok()).toBe(true)
	const periods = (await response.json()) as StoredPeriod[]
	for (const { id, text } of periods) {
		if (text === PERIOD_NAME || text === RENAMED) await page.request.delete(`${PERIOD_URL()}/${id}`)
	}
}

async function openEditDialog(page: Page, rowText: string) {
	await page.goto('/routine-settings')
	const row = page.getByRole('row').filter({ hasText: rowText })
	await row.waitFor()
	await row.getByRole('button', { name: 'Edit' }).click()
	const dialog = page.getByRole('dialog', { name: 'Edit time period' })
	await expect(dialog).toBeVisible()
	return dialog
}

function waitForPeriodPut(page: Page, id: number) {
	return page.waitForRequest(
		request => request.method() === 'PUT' && request.url().endsWith(`/api/routine-time-period/${id}`),
	)
}

test.beforeEach(async ({ authenticatedPage }) => {
	await removeThrowawayPeriods(authenticatedPage)
})

test.afterEach(async ({ authenticatedPage }) => {
	await removeThrowawayPeriods(authenticatedPage)
})

test.describe('Nudge and skips survive an edit (/routine-settings)', () => {
	test('a rename keeps the skip budget, the banked skips and the nudge', async ({ authenticatedPage }) => {
		const id = await createPeriod(authenticatedPage, { freezeBudget: 3, reminderLeadDays: 4 })

		const dialog = await openEditDialog(authenticatedPage, PERIOD_NAME)
		// The form shows the stored values, not the defaults.
		await expect(dialog.getByRole('textbox', { name: 'Skips per month' })).toHaveValue('3')
		await expect(dialog.getByRole('textbox', { name: 'Nudge me before the reset' })).toHaveValue('4')

		const put = waitForPeriodPut(authenticatedPage, id)
		await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill(RENAMED)
		await dialog.getByRole('button', { name: 'Save' }).click()
		expect((await put).postDataJSON()).toMatchObject({ text: RENAMED, freezeBudget: 3, reminderLeadDays: 4 })
		await expect(dialog).toBeHidden()

		// Before OP1 this read 2 / 2 / null: the budget fell back to the server default, the banked skips
		// were capped to it, and the nudge was switched off.
		expect(await storedPeriod(authenticatedPage, id)).toMatchObject({
			text: RENAMED,
			freezeBudget: 3,
			freezesRemaining: 3,
			reminderLeadDays: 4,
		})

		const row = authenticatedPage.getByRole('row').filter({ hasText: RENAMED })
		await expect(row.getByRole('cell', { name: '4d' })).toBeVisible()
		// The table's key heuristic reads "budget" as money; the explicit slot must win over it.
		await expect(row).not.toContainText('€')
	})

	test('clearing the nudge sends null, and a budget of 0 is kept rather than defaulted', async ({
		authenticatedPage,
	}) => {
		const id = await createPeriod(authenticatedPage, { freezeBudget: 2, reminderLeadDays: 3 })

		const dialog = await openEditDialog(authenticatedPage, PERIOD_NAME)
		const put = waitForPeriodPut(authenticatedPage, id)
		await dialog.getByRole('textbox', { name: 'Nudge me before the reset' }).fill('')
		await dialog.getByRole('textbox', { name: 'Skips per month' }).fill('0')
		await dialog.getByRole('button', { name: 'Save' }).click()
		expect((await put).postDataJSON()).toMatchObject({ freezeBudget: 0, reminderLeadDays: null })
		await expect(dialog).toBeHidden()

		expect(await storedPeriod(authenticatedPage, id)).toMatchObject({
			freezeBudget: 0,
			freezesRemaining: 0,
			reminderLeadDays: null,
		})
	})

	test('shortening the period pulls the nudge inside it', async ({ authenticatedPage }) => {
		await createPeriod(authenticatedPage, { reminderLeadDays: 10 })

		const dialog = await openEditDialog(authenticatedPage, PERIOD_NAME)
		// The server needs the lead to be shorter than the period: a 3-day period allows at most 2.
		await dialog.getByRole('textbox', { name: 'Length in days' }).fill('3')
		await expect(dialog.getByRole('textbox', { name: 'Nudge me before the reset' })).toHaveValue('2')
		await dialog.getByRole('button', { name: /cancel/i }).click()
		await expect(dialog).toBeHidden()
	})

	test('a one-day period offers no nudge', async ({ authenticatedPage }) => {
		const dialog = await openEditDialog(authenticatedPage, 'Daily')
		await expect(dialog.getByRole('textbox', { name: 'Nudge me before the reset' })).toBeDisabled()
		await expect(dialog.getByText('A one-day period is too short for a nudge')).toBeVisible()
		await dialog.getByRole('button', { name: /cancel/i }).click()
		await expect(dialog).toBeHidden()
	})
})
