import { expect, test } from '../fixtures/auth'
import { withTemporaryTemplate, writePathTemplate } from '../fixtures/dayPlannerTemplates'

/**
 * These tests used to resolve a template id by scraping `/day-planner/templates` for a link and
 * `test.skip(...)` when there was none — which was always, because the `e2e-v1` fixture created no
 * templates. All ten skipped, silently, for as long as the file existed.
 *
 * `e2e-v2` seeds three (`seed.dayPlannerTemplates`), so the read-only views are driven from those:
 * ids come off the fixture, nothing here creates a row it then leaves behind. The one exception is the
 * write-path block at the bottom, which cleans up after itself.
 *
 * Several assertions were originally written against a screen nobody had seen with data in it and were
 * simply wrong about the UI. Those are corrected to what the screen does, with the reason recorded.
 */
test.describe('Template Day Planner (/day-planner/templates/:templateId)', () => {
	test.beforeEach(async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto(`/day-planner/templates/${seed.dayPlannerTemplates.homeOffice}`)
		await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })

		// Wait for the BLOCKS, not just the grid. The grid paints first and the task fetch resolves
		// after it, so a `.count()` taken here otherwise reads 0 and a click lands on a block that is
		// still being laid out ("element is not stable"). `toHaveCount` retries, which is the point —
		// `count()` does not. This is the race the whole file's flakiness came down to.
		await expect(authenticatedPage.locator('.task-block')).toHaveCount(5, { timeout: 15_000 })
	})

	test.describe('rendering', () => {
		test('shows the calendar grid', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.locator('.calendar-grid')).toBeVisible()
		})

		test('shows the template details panel by default', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByText('Template details')).toBeVisible()
		})

		test('Add New Task button is visible', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('button', { name: 'Add New Task' })).toBeVisible()
		})

		test('renders every task the fixture gives this template', async ({ authenticatedPage }) => {
			// "Home Office" is the 5-task template. Note a foreground task is a `.task-block` while a
			// background one is a `.background-task-block` in its own lane — none of the twelve seeded
			// tasks is a background task, which the write-path spec at the bottom covers instead.
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(5)
			await expect(authenticatedPage.locator('.background-task-block')).toHaveCount(0)
		})

		test('a task block carries the activity, times and location it was seeded with', async ({
			authenticatedPage,
		}) => {
			const bugFixing = authenticatedPage.locator('.task-block', { hasText: 'Bug Fixing' })
			await expect(bugFixing).toContainText('09:00 - 10:30')
			await expect(authenticatedPage.locator('.task-block', { hasText: 'Morning Exercise' })).toContainText(
				'07:30 - 08:10',
			)
		})
	})

	test.describe('template details panel', () => {
		// This block used to be two tests: "closing the panel hides template details" (clicking the first
		// button matching /close|xmark/) and "Edit details button restores the panel". Neither premise is
		// real at the desktop viewport the suite runs at:
		//
		//  - the panel's xmark is `class="d-md-none"` in `PlannerSidePanelShell.vue`, and the panel itself
		//    is `v-show="panelOpen || mdAndUp"` — so on md and up there is no close control AND closing it
		//    would not hide it anyway. The panel is permanent by design at this width.
		//  - there is no "Edit details" button. The panel's action is labelled "Update details".
		//  - worse, /close|xmark/ silently matched something else entirely: the aria-label of the remove
		//    button on each *tag chip* in the details form is "Close", and every seeded template has tags.
		//
		// Both are pinned here as the behaviour that actually exists.
		test('the panel is permanent at desktop width — its close control is mobile-only', async ({
			authenticatedPage,
		}) => {
			await expect(authenticatedPage.getByText('Template details')).toBeVisible()
			await expect(authenticatedPage.locator('.v-card-title button.d-md-none')).toBeHidden()
		})

		test('the panel exposes the details form and its "Update details" action', async ({
			authenticatedPage,
		}) => {
			await expect(authenticatedPage.getByRole('button', { name: 'Update details' })).toBeVisible()
			// `exact: true` matters: getByRole's name match is a case-insensitive SUBSTRING by default, so
			// a bare 'Details' also matches the 'Update details' button above and is a strict violation.
			await expect(authenticatedPage.getByRole('button', { name: 'Details', exact: true })).toBeVisible()
			await expect(authenticatedPage.getByRole('button', { name: 'Routine', exact: true })).toBeVisible()
		})
	})

	test.describe('task creation dialog', () => {
		test('Add New Task button opens the creation dialog', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add New Task' }).click()
			await expect(authenticatedPage.getByText('Add New Template Task')).toBeVisible()
		})

		test('creation dialog can be cancelled', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Add New Task' }).click()
			await expect(authenticatedPage.getByText('Add New Template Task')).toBeVisible()
			await authenticatedPage.getByRole('button', { name: /cancel/i }).click()
			await expect(authenticatedPage.getByText('Add New Template Task')).not.toBeVisible()
		})
	})

	// These used to guard on `if (count === 0) test.skip()`. The fixture always has tasks now, so the
	// guard is gone: no tasks is a real failure. Nothing here commits a delete — see the note on the
	// cancel test for why that matters.
	test.describe('task selection and deletion', () => {
		test('selecting a task shows the selection action bar', async ({ authenticatedPage }) => {
			await authenticatedPage.locator('.task-block').first().click()
			await expect(authenticatedPage.getByRole('button', { name: /delete/i })).toBeVisible()
		})

		test('delete action shows a confirmation dialog', async ({ authenticatedPage }) => {
			await authenticatedPage.locator('.task-block').first().click()
			await authenticatedPage.getByRole('button', { name: /delete/i }).click()
			await expect(authenticatedPage.getByText('Delete confirmation')).toBeVisible()
		})

		// Cancelling, never confirming: a committed delete would take a fixture-pinned template task away
		// from every later spec and from anyone who opens the screen afterwards. The delete that really
		// goes through is the write-path one at the bottom, on a row this spec created.
		test('cancelling the delete dialog keeps the task', async ({ authenticatedPage }) => {
			const taskBlocks = authenticatedPage.locator('.task-block')
			const countBefore = await taskBlocks.count()

			await taskBlocks.first().click()
			await authenticatedPage.getByRole('button', { name: /delete/i }).click()

			// Scope the Cancel to the dialog. Once a task is selected there are two visible Cancels — the
			// selection action bar has one too — and a bare role+name locator is a strict-mode violation.
			const dialog = authenticatedPage.getByLabel('Delete confirmation')
			await expect(dialog).toBeVisible()
			await dialog.getByRole('button', { name: 'Cancel' }).click()

			await expect(taskBlocks).toHaveCount(countBefore)
		})
	})
})

test.describe('Template list (/day-planner/templates)', () => {
	// REGRESSION TEST. This screen was unreachable with two or more templates: `loadTemplates()` fans the
	// mini-timeline previews out over `Promise.all`, and `useFetchFiltered` held ONE AbortController per
	// composable instance, aborting the previous in-flight call on every call. So all but the last
	// preview were cancelled, the `Promise.all` rejected with `CanceledError`, `hideFullScreenLoading()`
	// never ran, and the page sat behind the fullscreen loading overlay with zero cards.
	//
	// Fixed by making cancellation per `requestKey` (`_common/api/useFetchFiltered.ts`) and having the
	// view key each call by template id. Invisible with 0 or 1 template — which is why the `e2e-v1`
	// fixture hid it — so this only means anything now that the fixture seeds three.
	test('lists every seeded template instead of the empty state', async ({ authenticatedPage, seed }) => {
		await authenticatedPage.goto('/day-planner/templates')

		// This screen is four round trips — one GET for the templates, then one filter POST per template
		// for the mini-timelines — and the cards render only once all of them settle. The generous
		// timeout is on the first card for that reason; the other two render in the same tick.
		await expect(authenticatedPage.getByText('Home Office')).toBeVisible({ timeout: 15_000 })
		await expect(authenticatedPage.getByText('Office Day')).toBeVisible()
		await expect(authenticatedPage.getByText('Relaxed Weekend')).toBeVisible()
		await expect(authenticatedPage.getByText('Create your first template')).toHaveCount(0)

		// The overlay clearing is the actual regression — assert it is gone, not merely that text exists.
		await expect(authenticatedPage.getByRole('status', { name: /loading/i })).toHaveCount(0)

		expect(seed.counts.dayPlannerTemplates).toBe(3)
	})

	// `isPinned` is deliberately absent from the create/update request body (only `PATCH /:id/pinned`
	// sets it), so a spec cannot produce a pinned template for itself. This section is reachable only
	// because the fixture pins one.
	test('the pinned section renders the pinned template', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner/templates')
		// Four round trips before the cards appear — same reason as the test above.
		await expect(authenticatedPage.getByText('Relaxed Weekend')).toBeVisible({ timeout: 15_000 })
		await expect(authenticatedPage.getByText('Pinned')).toBeVisible()
	})
})

test.describe('Template split view (/day-planner/templates/split)', () => {
	test('a different template can be selected on each side', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner/templates/split')

		// `.split-panel` is the stable hook (TemplateSplitView.vue); the selects are `VIdSelect`s whose
		// input is intercepted by `.v-field__input`, so click the field rather than the input.
		const panels = authenticatedPage.locator('.split-panel')

		// Scope each option to its own listbox. A bare `getByRole('option', ...)` is a strict-mode
		// violation whenever the left menu has not finished animating out by the time the right one
		// opens — both listboxes are then in the DOM, each carrying all three template names. That is a
		// race, so it passes alone and fails under load.
		await panels.nth(0).locator('.v-field__input').first().click()
		await authenticatedPage
			.getByRole('listbox', { name: 'Left Template' })
			.getByRole('option', { name: 'Home Office' })
			.click()

		await panels.nth(1).locator('.v-field__input').first().click()
		await authenticatedPage
			.getByRole('listbox', { name: 'Right Template' })
			.getByRole('option', { name: 'Office Day' })
			.click()

		await expect(panels.nth(0)).toContainText('Home Office')
		await expect(panels.nth(1)).toContainText('Office Day')
		await expect(authenticatedPage.getByText('Select a template')).toHaveCount(0)
	})
})

/**
 * The write path, which seeding by definition never covers: `POST /api/task-planner-day-template`,
 * `POST /api/template-planner-task` and `DELETE /api/task-planner-day-template/:id`.
 *
 * This is the only place in the file that creates a row, and `withTemporaryTemplate` deletes it in a
 * `finally` so a failing assertion still leaves the fixture at its three templates.
 */
test.describe('Template write path', () => {
	test('a created template renders its tasks, and deleting it removes it from the list', async ({
		authenticatedPage,
		seed,
	}) => {
		const { template, tasks } = writePathTemplate(seed)

		await withTemporaryTemplate(authenticatedPage.request, template, tasks, async templateId => {
			await authenticatedPage.goto(`/day-planner/templates/${templateId}`)
			await authenticatedPage.locator('.calendar-grid').waitFor({ state: 'visible' })

			// One foreground and one background task — the background lane is not otherwise reachable,
			// since none of the twelve seeded template tasks sets `isBackground`.
			await expect(authenticatedPage.locator('.task-block')).toHaveCount(1, { timeout: 15_000 })
			await expect(authenticatedPage.locator('.background-task-block')).toHaveCount(1)
			await expect(authenticatedPage.locator('.task-block', { hasText: 'Bug Fixing' })).toContainText(
				'09:00 - 11:00',
			)

			await authenticatedPage.goto('/day-planner/templates')
			await expect(authenticatedPage.getByText(template.name)).toBeVisible({ timeout: 15_000 })
		})

		await authenticatedPage.goto('/day-planner/templates')
		// Order matters: wait for the list to have RENDERED before asserting the deleted one is absent.
		// `toHaveCount(0)` is satisfied by a page that has not painted its cards yet, so asserting it
		// first would pass whether or not the delete worked.
		await expect(authenticatedPage.getByText('Home Office')).toBeVisible({ timeout: 15_000 })
		await expect(authenticatedPage.getByText(template.name)).toHaveCount(0)
	})
})
