import type { Page } from '@playwright/test'
import { apiUrl, expect, seedDateParam, test, type SeedResponse } from '../fixtures/auth'

// Specs for the todoList surfaces that had no seed data to render before `POST /api/test/seed` existed.
// Driven in the browser via `playwright-cli` against the `e2e-v1` fixture before writing any assertion
// here — see docs/views/todo-lists/findings.md's round 3 entry for what that walk-through found.
//
// The estimate chip and the header's estimate line are covered at the bottom of this file. Since F3-01 they
// read time logged against each item. The header needs five finished timed items, which the fixture lacks,
// so that block builds its own list.
//
// The "Focus" list is seed id 13001 (8 items), "Errands" is 13002 (7 items, including the 6 overdue ones).

test.describe('Overdue renegotiation banner (/todo-list/:id — "Errands")', () => {
	// The two reschedule tests below WRITE to the six fixture-pinned overdue rows — after either, the
	// banner is gone for every later test, this block's own first two included. Same trade as the
	// counter block: serial plus a reseed before each test.
	test.describe.configure({ mode: 'serial' })
	test.use({ freshSeed: true })

	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/13002')
		// The item fetch resolves after the initial paint — waiting on the banner's own text avoids
		// asserting against a page that hasn't finished loading yet (a real race: the very first
		// snapshot after navigation can land before `items.value` is populated).
		await authenticatedPage.getByText(/tasks have a date that has passed/).waitFor({ state: 'visible' })
	})

	test('shows the banner with the seeded overdue count and all three actions', async ({ authenticatedPage }) => {
		await expect(
			authenticatedPage.getByText("6 tasks have a date that has passed. Pick a new one when you're ready."),
		).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Today', exact: true })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'In a week' })).toBeVisible()
		await expect(authenticatedPage.getByRole('button', { name: 'Review one by one' })).toBeVisible()
	})

	test('"Review one by one" filters the list to overdue items via the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Review one by one' }).click()
		await expect(authenticatedPage).toHaveURL(/[?&]due=overdue/)
	})

	// Was a `fixme` for docs/views/todo-lists/findings.md B4: the API used to send `dueTime` as the
	// string `"17:00:00"`, `Time.fromJson` read it as 00:00, and the zeroed object shape it wrote back
	// 400'd every PUT in the batch. The API now sends `{ hours, minutes }` and `Time.fromJson` accepts
	// both shapes. The second half of each assertion — the time-of-day survives — is the half a fix
	// that only stopped the 400 would still fail: the seed's six overdue rows are all due at 17:00.
	//
	// The item fetch is what settles the list after the batch (`rescheduleOverdue` re-reads in
	// `finally`), so the banner disappearing is the signal that both the writes and the re-read are
	// done; the chip text is asserted after it.
	//
	// A date a week out renders as `DD.MM.` (the app's own short format), so that chip is derived from
	// the seed date rather than typed in.
	for (const [label, expectedSnackbar, chipFor] of [
		['Today', 'Moved 6 tasks to today', () => /^Today 17:00$/],
		[
			'In a week',
			'Moved 6 tasks to a week from today',
			(seed: SeedResponse) => {
				const [dd, mm] = seedDateParam(seed, 7).split('-')
				return new RegExp(`^${dd}\\.${mm}\\. 17:00$`)
			},
		],
	] as const) {
		test(`"${label}" reschedules every overdue item and keeps its time of day`, async ({
			authenticatedPage,
			seed,
		}) => {
			expect(seed.counts.overdueTodoListItems).toBe(6)
			await authenticatedPage.getByRole('button', { name: label, exact: true }).click()
			await expect(authenticatedPage.getByText(expectedSnackbar)).toBeVisible()
			await expect(authenticatedPage.getByText(/tasks have a date that has passed/)).toBeHidden()
			await expect(authenticatedPage.locator('#app').getByText(chipFor(seed))).toHaveCount(6)
		})
	}
})

test.describe('Multi-count item counter (/todo-list/:id — "Focus")', () => {
	// This block WRITES to a fixture-pinned row: the counter on `todoListItems.multiCountPartial` steps
	// and, since B5, every step is persisted. `freshSeed` re-runs the reset before each test in scope so
	// each one still starts at 2 of 5. Pairs with `mode: 'serial'`, and is only safe because
	// `playwright.config.ts` sets `workers: 1` (the endpoint truncates the whole database). Costs
	// ~1.5–2.0 s per test in this block.
	//
	// The cheaper answer — create the row through the app's own API and leave the fixture alone —
	// does not apply here: the point is the seeded mid-progress state, 2 of 5 rather than 0 of N.
	test.describe.configure({ mode: 'serial' })
	test.use({ freshSeed: true })

	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/todo-list/13001')
		// "Deep Clean Kitchen" (the activity name) also appears in an off-screen, always-mounted picker
		// elsewhere on this view, and its note text is mirrored into a Vuetify tooltip's own overlay
		// content — both make a bare `getByText` resolve to more than one element. `#app` plus `.first()`
		// picks the real on-page row (the tooltip clone lives outside `#app`, in a teleported overlay).
		await authenticatedPage.locator('#app').getByText('One room at a time.').first().waitFor({ state: 'visible' })
	})

	// The counter is two always-present buttons, named by state ("Increase: 2 of 5" / "Decrease: 2 of
	// 5"). It used to be a hover swap — the bar under the mouse was replaced by a minus button as soon
	// as the pointer dwelt, so a real mouse could only ever decrement, and neither action was reachable
	// by keyboard (docs/views/_fix-queue.md, "counter hit-testing"). `hover()` before `click()` is the
	// dwelling mouse; a synthetic click alone landed before Vue swapped the branch and hid the bug.
	function counterButton(page: Page, name: RegExp) {
		return page.locator('#app').getByRole('button', { name })
	}

	test('the bar increments after a dwelling hover, without opening the log-time dialog', async ({
		authenticatedPage,
	}) => {
		const increase = counterButton(authenticatedPage, /^Increase: 2 of 5$/)
		await increase.hover()
		await authenticatedPage.waitForTimeout(500)
		await increase.click()
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Log time manually' })).toBeHidden()
	})

	// Every step is persisted (`toggle-is-done` with `forceValue` is ±1 for a counted item) — before,
	// only the step that flipped `isDone` was, so 2 → 3 → 4 read back as 2 on the next visit.
	test('an increment survives a reload', async ({ authenticatedPage, seed }) => {
		// The count updates optimistically, so the visible 3 says nothing about the write — wait for the
		// per-item re-read that follows the PATCH, or the reload races the request it is meant to check.
		const resynced = authenticatedPage.waitForResponse(
			response =>
				response.url().endsWith(`/todo-list-item/${seed.todoListItems.multiCountPartial}`) &&
				response.request().method() === 'GET',
		)
		await counterButton(authenticatedPage, /^Increase: 2 of 5$/).click()
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
		await resynced
		await authenticatedPage.reload()
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
	})

	test('the minus button decrements', async ({ authenticatedPage }) => {
		await counterButton(authenticatedPage, /^Decrease: 2 of 5$/).click()
		await expect(counterButton(authenticatedPage, /^Increase: 1 of 5$/)).toBeVisible()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Log time manually' })).toBeHidden()
	})

	test('both counter buttons are reachable and operable by keyboard', async ({ authenticatedPage }) => {
		await counterButton(authenticatedPage, /^Increase: 2 of 5$/).focus()
		await authenticatedPage.keyboard.press('Enter')
		await expect(counterButton(authenticatedPage, /^Increase: 3 of 5$/)).toBeVisible()
		await counterButton(authenticatedPage, /^Decrease: 3 of 5$/).focus()
		await authenticatedPage.keyboard.press('Space')
		await expect(counterButton(authenticatedPage, /^Increase: 2 of 5$/)).toBeVisible()
	})

	// Was the B3 `fixme`: the row body of a counted item used to step the counter AND open the dialog.
	// The row body is now only the log-time gesture, as it is for every other row.
	test('clicking the row body opens the log-time dialog and leaves the counter alone', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.locator('#app').getByText('One room at a time.').first().click()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Log time manually' })).toBeVisible()
		await expect(counterButton(authenticatedPage, /^Increase: 2 of 5$/)).toBeVisible()
	})
})

// F3-01 replaced the activity-keyed calibration on this view: the figures are now read off time logged
// against each ITEM (`GET /todo-list-item/estimate-fit`), not off the activity's whole history. The fixture
// does link history to the "Focus" items (14001–14006), but every one of them is open, so no group can form,
// and the header needs five finished items. So these tests build their own:
// a fresh list (CLAUDE.md, *Mutating specs* 1) whose items reuse the "Focus" list's activities — the unique
// index is per list — with 30-minute estimates and 45 minutes logged against each through the app's own API.
// Every row created is deleted afterwards, history first, because deleting the list only unlinks it.
interface FitFixture {
	listId: number
	historyIds: number[]
}

const FIT_LIST = 'E2E estimate fit'

async function postId(page: Page, path: string, data: unknown): Promise<number> {
	const response = await page.request.post(`${apiUrl()}/api/${path}`, { data })
	expect(response.ok(), `POST ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	return Number(await response.json())
}

/**
 * Five finished items at 1.5× their estimate, and one open item with 50 minutes logged against a 1-hour estimate.
 *
 * Two things here exist because logging time is not inert (FO2). Each log publishes `ActivityTimeRecordedEvent`
 * for its day, which completes a planner block on that day for the activity, or else the linked item once the
 * total reaches its estimate. So the logs go 60 days back, where the fixture has no blocks for these activities
 * to complete. Logged on the seed day, they marked the fixture's own blocks done. And the open item's estimate
 * stays above its logged time, or the fallback finishes it.
 */
async function createFitFixture(page: Page, seed: SeedResponse): Promise<FitFixture> {
	const focus = await page.request.get(`${apiUrl()}/api/todo-list-item`, { params: { todoListId: 13001 } })
	expect(focus.ok()).toBe(true)
	const sources = (await focus.json()) as { activity: { id: number }; taskPriority: { id: number } }[]
	expect(sources.length).toBeGreaterThanOrEqual(6)

	const fixture: FitFixture = { listId: await postId(page, 'todo-list', { name: FIT_LIST }), historyIds: [] }
	const logDay = new Date(`${seed.seedDateUtc}T09:00:00Z`)
	logDay.setUTCDate(logDay.getUTCDate() - 60)
	const startTimestamp = logDay.toISOString()

	for (const [index, source] of sources.slice(0, 6).entries()) {
		const isOpen = index === 5
		const itemId = await postId(page, 'todo-list-item', {
			activityId: source.activity.id,
			taskPriorityId: source.taskPriority.id,
			todoListId: fixture.listId,
			suggestedTime: isOpen ? { hours: 1, minutes: 0 } : { hours: 0, minutes: 30 },
		})
		fixture.historyIds.push(
			await postId(page, 'activity-history', {
				activityId: source.activity.id,
				startTimestamp,
				length: { hours: 0, minutes: isOpen ? 50 : 45 },
				todoListItemId: itemId,
			}),
		)
		if (!isOpen) {
			const done = await page.request.patch(`${apiUrl()}/api/todo-list-item/toggle-is-done`, {
				data: { ids: [itemId], forceValue: true },
			})
			expect(done.ok(), `toggle ${itemId}: ${done.status()}`).toBe(true)
		}
	}
	return fixture
}

async function removeFitFixture(page: Page, fixture: FitFixture) {
	const paths = [
		...fixture.historyIds.map(id => `activity-history/${id}`),
		...(fixture.listId ? [`todo-list/${fixture.listId}`] : []),
	]
	for (const path of paths) {
		const response = await page.request.delete(`${apiUrl()}/api/${path}`)
		expect(response.ok(), `cleanup DELETE ${path}: ${response.status()} ${await response.text()}`).toBe(true)
	}
}

test.describe('Estimate fit (/todo-list/:id — a list built for the test)', () => {
	let fixture: FitFixture = { listId: 0, historyIds: [] }

	test.beforeEach(async ({ authenticatedPage, seed }, testInfo) => {
		testInfo.setTimeout(60_000)
		fixture = await createFitFixture(authenticatedPage, seed)
		await authenticatedPage.goto(`/todo-list/${fixture.listId}`)
		await authenticatedPage.locator('#app').getByText(FIT_LIST).first().waitFor({ state: 'visible' })
	})

	test.afterEach(async ({ authenticatedPage }) => {
		await removeFitFixture(authenticatedPage, fixture)
		fixture = { listId: 0, historyIds: [] }
	})

	test('the header describes the estimate once five finished items were timed', async ({ authenticatedPage }) => {
		// Median of five 45m ÷ 30m ratios. The open item is not a sample: its figure is not final.
		await expect(
			authenticatedPage.getByText('Tasks on this list took about 1.5× the estimate (5 tasks)'),
		).toBeVisible()
	})

	test('an open item shows the time logged against it so far, and says so on hover', async ({
		authenticatedPage,
	}) => {
		// The estimate chip opens with `~`; a row also carries other chips. Two nested `.v-list-item`s
		// match each row (the outer is the drag wrapper), hence `.first()`.
		const openRow = authenticatedPage
			.locator('.v-list-item')
			.filter({ has: authenticatedPage.locator('.v-chip', { hasText: '50m' }) })
			.first()
		const chip = openRow.locator('.v-chip').filter({ hasText: '~' })
		await expect(chip).toContainText('1h')
		await expect(chip).toContainText('50m')

		// The tooltip is teleported outside `#app` and only exists after a hover.
		await chip.hover()
		await expect(authenticatedPage.getByText('50m logged on this task so far')).toBeVisible()
	})
})
