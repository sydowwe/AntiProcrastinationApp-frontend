import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * leisure-bucket-anchors O1: `financialGoal` and `inspirationSource` on the bucket list, and the anchor
 * source flags (`hasBucketList`, `hasBacklog`, `backlogIsRepeatable`) on the memory anchors.
 *
 * Where each one shows:
 * - `financialGoal`: a table column, the edit form's number field, and the "Still to save" readout above the
 *   table (`SavingsGoalsReadout`, summed over every row under the filter).
 * - `inspirationSource`: a table column, the edit form's required text field, and the italic note on a ladder
 *   card.
 * - the source flags: the memory-anchor *Source* column's chip (`Bucket List` / `Backlog (one-time)` / a dash),
 *   and the timeline's per-year "where the memories came from" chips.
 *
 * The seed carries one bucket-list row (`Learn Bouldering`, goal 120, "A friend's climbing photos") with one
 * anchor on it, and a second anchor on an activity with no profile. That covers one flag combination, so the
 * rest, and the summed readout, are route-patched on the grid response, cloned from the server's own row so
 * the shape stays real. The fixture is only read; the edit form is opened and cancelled, never saved.
 *
 * Every view is loaded twice. A cold first load of a table view labels its columns in Slovak for an EN
 * account (the columns are built once at setup, before the signed-in locale lands), so header assertions
 * only hold from the second load on.
 */

type Row = Record<string, unknown> & { activity: Record<string, unknown> }
type Grid = { items: Row[]; itemsCount: number }

/** Replace every response from `endpoint`'s grid with `build(template)` rows, keeping the real envelope. */
async function patchGrid(page: Page, endpoint: string, build: (template: Row) => Row[]) {
	await page.route(`**/api/${endpoint}/grid`, async route => {
		try {
			const response = await route.fetch()
			const body = (await response.json()) as Grid
			const items = build(body.items[0])
			await route.fulfill({ response, json: { ...body, items, itemsCount: items.length } })
		} catch {
			// A request still in flight when the test ends fails here as the context closes; that is not a finding.
		}
	})
}

/** The Source column's clickable chip. Excludes the row's own Edit and Delete buttons, which are buttons too. */
const SOURCE_CHIP = '.v-chip[role="button"]'

async function open(page: Page, url: string, ready: string) {
	await page.goto(url)
	await page.getByText(ready).first().waitFor()
	await page.reload()
	await page.getByText(ready).first().waitFor()
}

function bucketRow(template: Row, id: number, name: string, extra: Record<string, unknown>): Row {
	return { ...template, id, activityId: id, activity: { ...template.activity, id, name }, ...extra }
}

function anchorRow(template: Row, id: number, name: string, month: number, extra: Record<string, unknown>): Row {
	return {
		...template,
		id,
		activityId: id,
		activity: { ...template.activity, id, name },
		anchorMonth: month,
		hasBacklog: false,
		backlogIsRepeatable: null,
		hasBucketList: false,
		...extra,
	}
}

test.describe('Bucket list: financial goal and inspiration (/leisure/bucket-list)', () => {
	test('the seeded row shows its goal and inspiration in their columns', async ({ authenticatedPage: page }) => {
		await open(page, '/leisure/bucket-list', 'Learn Bouldering')

		const headerRow = page.locator('#app thead tr')
		await expect(headerRow.getByText('Financial goal', { exact: true })).toBeVisible()
		await expect(headerRow.getByText('Inspiration', { exact: true })).toBeVisible()

		const row = page.locator('#app tbody tr', { hasText: 'Learn Bouldering' })
		await expect(row.getByRole('cell', { name: '120', exact: true })).toBeVisible()
		await expect(row.getByRole('cell', { name: "A friend's climbing photos" })).toBeVisible()
	})

	test('the edit form carries both values, and Cancel leaves them alone', async ({ authenticatedPage: page }) => {
		await open(page, '/leisure/bucket-list', 'Learn Bouldering')
		await page.locator('#app tbody tr', { hasText: 'Learn Bouldering' }).getByRole('button', { name: 'Edit' }).click()

		const dialog = page.getByRole('dialog')
		// The activity is locked on edit: a disabled combobox showing its name, not a textbox.
		await expect(dialog.getByRole('combobox', { name: 'Activity' })).toBeDisabled()
		await expect(dialog.getByText('Learn Bouldering')).toBeVisible()
		await expect(dialog.getByRole('textbox', { name: 'Inspiration' })).toHaveValue("A friend's climbing photos")
		// A VNumberInput, which exposes a plain textbox holding the number.
		await expect(dialog.getByRole('textbox', { name: 'Financial goal' })).toHaveValue('120')

		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).toBeHidden()
		await expect(page.locator('#app tbody tr', { hasText: 'Learn Bouldering' })).toHaveCount(1)
	})

	test('the savings readout splits the seeded goal into lived and still to save', async ({
		authenticatedPage: page,
	}) => {
		// The seeded anchor makes `Learn Bouldering` experienced, so its whole 120 is lived and nothing is left.
		await open(page, '/leisure/bucket-list', 'Learn Bouldering')
		await expect(page.getByText('Still to save: 0')).toBeVisible()
		await expect(page.getByText('120 of 120 in goals already lived')).toBeVisible()
	})

	test('the readout sums every positive goal, and counts only experienced ones as lived', async ({
		authenticatedPage: page,
	}) => {
		await patchGrid(page, 'activity-bucket-list-profile', template => [
			bucketRow(template, 9201, 'Ahead goal', { financialGoal: 1240.5, isAnchored: false }),
			bucketRow(template, 9202, 'Lived goal', { financialGoal: 300, isAnchored: true }),
			bucketRow(template, 9203, 'No goal', { financialGoal: null, isAnchored: false }),
			bucketRow(template, 9204, 'Zero goal', { financialGoal: 0, isAnchored: false }),
		])
		await open(page, '/leisure/bucket-list', 'Ahead goal')

		// 1 240.5 + 300 = 1 540.5 in total; a missing or zero goal is "no goal" and adds to neither side.
		await expect(page.getByText('Still to save: 1,240.5')).toBeVisible()
		await expect(page.getByText('300 of 1,540.5 in goals already lived')).toBeVisible()
	})

	test('no row carries a goal: the readout is not shown at all', async ({ authenticatedPage: page }) => {
		await patchGrid(page, 'activity-bucket-list-profile', template => [
			bucketRow(template, 9201, 'Goalless one', { financialGoal: null, isAnchored: false }),
			bucketRow(template, 9202, 'Goalless two', { financialGoal: null, isAnchored: false }),
		])
		await open(page, '/leisure/bucket-list', 'Goalless one')

		await expect(page.getByText(/Still to save/)).toHaveCount(0)
	})

	test('a ladder card shows its inspiration note, and omits it when there is none', async ({
		authenticatedPage: page,
	}) => {
		await patchGrid(page, 'activity-bucket-list-profile', template => [
			bucketRow(template, 9201, 'Inspired card', { comfortZoneStep: 2, inspirationSource: 'A podcast episode' }),
			bucketRow(template, 9202, 'Plain card', { comfortZoneStep: 2, inspirationSource: '' }),
		])
		await open(page, '/leisure/bucket-list?view=ladder', 'Inspired card')

		const inspired = page.locator('#app .rung-card', { hasText: 'Inspired card' })
		await expect(inspired.getByText('A podcast episode')).toBeVisible()
		await expect(inspired).toHaveAttribute('class', /rung-card/)
		await expect(page.locator('#app .rung-card', { hasText: 'Plain card' }).getByText('Inspiration')).toHaveCount(0)
	})
})

test.describe('Memory anchors: source flags (/leisure/memory-anchors)', () => {
	test('the seeded anchors: a bucket-list source chip, and a dash where no profile is left', async ({
		authenticatedPage: page,
	}) => {
		await open(page, '/leisure/memory-anchors', 'Learn Bouldering')

		const bouldering = page.locator('#app tbody tr', { hasText: 'Learn Bouldering' })
		await expect(bouldering.getByRole('button', { name: /Bucket List/ })).toBeVisible()

		// `Retired Hobby` has no backlog or bucket-list profile, so neither flag is set.
		const retired = page.locator('#app tbody tr', { hasText: 'Retired Hobby' })
		await expect(retired.locator(SOURCE_CHIP)).toHaveCount(0)
		await expect(retired.getByText('—', { exact: true })).toBeVisible()
	})

	test('each flag combination picks its own chip', async ({ authenticatedPage: page }) => {
		await patchGrid(page, 'memory-anchor', template => [
			anchorRow(template, 9301, 'Both sources', 1, { hasBucketList: true, hasBacklog: true, backlogIsRepeatable: false }),
			anchorRow(template, 9302, 'One-time backlog', 2, { hasBacklog: true, backlogIsRepeatable: false }),
			anchorRow(template, 9303, 'Repeatable backlog', 3, { hasBacklog: true, backlogIsRepeatable: true }),
			anchorRow(template, 9304, 'Gone profile', 4, {}),
		])
		await open(page, '/leisure/memory-anchors', 'Both sources')
		const row = (name: string) => page.locator('#app tbody tr', { hasText: name })

		// The bucket list wins when both exist, and the row gets one chip, not two.
		await expect(row('Both sources').getByRole('button', { name: /Bucket List/ })).toBeVisible()
		await expect(row('Both sources').locator(SOURCE_CHIP)).toHaveCount(1)

		await expect(row('One-time backlog').getByRole('button', { name: /Backlog \(one-time\)/ })).toBeVisible()

		// A repeatable backlog entry is never closed by being anchored, so it is not a source.
		await expect(row('Repeatable backlog').locator(SOURCE_CHIP)).toHaveCount(0)
		await expect(row('Repeatable backlog').getByText('—', { exact: true })).toBeVisible()
		await expect(row('Gone profile').locator(SOURCE_CHIP)).toHaveCount(0)
	})

	test('the one-time backlog chip opens the backlog filtered to that activity', async ({
		authenticatedPage: page,
	}) => {
		await patchGrid(page, 'memory-anchor', template => [
			anchorRow(template, 9302, 'One-time backlog', 2, { hasBacklog: true, backlogIsRepeatable: false }),
		])
		await open(page, '/leisure/memory-anchors', 'One-time backlog')
		await page.getByRole('button', { name: /Backlog \(one-time\)/ }).click()

		await expect(page).toHaveURL(/\/leisure\/backlog\?activityName=One-time\+backlog/)
	})

	test('the timeline tallies the year by source, leaving the unsourced anchors out', async ({
		authenticatedPage: page,
	}) => {
		await patchGrid(page, 'memory-anchor', template => [
			anchorRow(template, 9301, 'Bucket one', 1, { hasBucketList: true }),
			anchorRow(template, 9302, 'Bucket two', 2, { hasBucketList: true }),
			anchorRow(template, 9303, 'Backlog one', 3, { hasBacklog: true, backlogIsRepeatable: false }),
			anchorRow(template, 9304, 'Repeatable', 4, { hasBacklog: true, backlogIsRepeatable: true }),
		])
		await open(page, '/leisure/memory-anchors?view=timeline', 'Memories: 4')

		const breakdown = page.getByRole('group', { name: "Where this year's memories came from" })
		await expect(breakdown.getByText('Bucket List: 2')).toBeVisible()
		await expect(breakdown.getByText('Backlog (one-time): 1')).toBeVisible()
		await expect(breakdown.getByText(/Repeatable/)).toHaveCount(0)
	})
})
