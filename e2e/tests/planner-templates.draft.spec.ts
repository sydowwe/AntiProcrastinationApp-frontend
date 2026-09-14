import { expect, test } from '../fixtures/auth'

/**
 * Structural coverage for the two views in the `planner-templates` unit that
 * `templateDayPlanner.spec.ts` does not already cover: the list
 * (`/day-planner/templates`) and the split editor (`/day-planner/templates/split`).
 *
 * Written from `docs/views/planner-templates/inventory.md` and `findings.md` (2026-09-14,
 * commit `6aac48bb`). Several assertions below are deliberately `test.fixme` because the
 * behaviour they'd assert is a *known, filed defect* — asserting it would either pin a bug as
 * spec or need constant babysitting until the fix lands. See the finding id in each comment.
 */
test.describe('Day Templates (/day-planner/templates)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner/templates')
		await authenticatedPage.getByText('Pinned').waitFor({ state: 'visible' })
	})

	test.describe('rendering', () => {
		test('renders the three fixture templates as cards', async ({ authenticatedPage, seed }) => {
			await expect(authenticatedPage.locator('.template-card')).toHaveCount(3)
			await expect(authenticatedPage.getByText('Home Office')).toBeVisible()
			await expect(authenticatedPage.getByText('Office Day')).toBeVisible()
			await expect(authenticatedPage.getByText('Relaxed Weekend')).toBeVisible()
			// The fixture's ids are what the list navigates to (see the navigation test below) —
			// asserted indirectly there rather than read off the DOM here.
			expect(new Set(Object.keys(seed.dayPlannerTemplates))).toEqual(new Set(['homeOffice', 'officeDay', 'pinned']))
		})

		test('shows a "Pinned" heading above the pinned template', async ({ authenticatedPage }) => {
			// Not a strict DOM-order assertion (Playwright has no clean way to express "heading, then
			// this card, before the next heading") — just that both render, which is what a `fixme`
			// investigating actual document order would build on.
			await expect(authenticatedPage.getByText('Pinned', { exact: true })).toBeVisible()
			await expect(authenticatedPage.locator('.template-card', { hasText: 'Relaxed Weekend' })).toBeVisible()
		})

		test('the sort control offers Most Used, Recently Used and Alphabetical', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('combobox').filter({ hasText: 'Most Used' }).click()
			await expect(authenticatedPage.getByRole('option', { name: 'Most Used' })).toBeVisible()
			await expect(authenticatedPage.getByRole('option', { name: 'Recently Used' })).toBeVisible()
			await expect(authenticatedPage.getByRole('option', { name: 'Alphabetical' })).toBeVisible()
		})
	})

	test.describe('navigation', () => {
		test('clicking a template card navigates to its detail route', async ({ authenticatedPage, seed }) => {
			await authenticatedPage.getByText('Home Office').click()
			await expect(authenticatedPage).toHaveURL(
				new RegExp(`/day-planner/templates/${seed.dayPlannerTemplates.homeOffice}$`),
			)
		})

		test('"Edit Side by Side" navigates to the split view', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Edit Side by Side' }).click()
			await expect(authenticatedPage).toHaveURL(/\/day-planner\/templates\/split$/)
		})

		test('"Use Today" navigates to the day planner with the template id as a query param', async ({
			authenticatedPage,
			seed,
		}) => {
			// Scoped by the pinned template's own name, since "Use Today" is not unique across the
			// page and "Pinned"'s ancestor is not a tight enough boundary (it resolved all 3 cards).
			const pinnedCard = authenticatedPage.locator('.template-card', { hasText: 'Relaxed Weekend' })
			await pinnedCard.getByRole('button', { name: 'Use Today' }).click()
			await expect(authenticatedPage).toHaveURL(
				new RegExp(`applyTemplateId=${seed.dayPlannerTemplates.pinned}`),
			)
		})
	})

	test.describe('delete confirmation', () => {
		test('cascade delete confirmation names the template and its task count', async ({ authenticatedPage }) => {
			// Read-only: opens and cancels. Never confirms — these are fixture-pinned rows.
			const officeDayCard = authenticatedPage.locator('.template-card', { hasText: 'Office Day' })
			await officeDayCard.getByRole('button', { name: 'Delete' }).click()
			await expect(authenticatedPage.getByText('Delete template?')).toBeVisible()
			await expect(authenticatedPage.getByText('"Office Day" cannot be restored.')).toBeVisible()
			await expect(authenticatedPage.getByText(/Tasks in this template: 4/)).toBeVisible()
			await authenticatedPage.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
			await expect(authenticatedPage.getByText('Delete template?')).toBeHidden()
		})
	})

	test.describe('known defects — filed, not asserted', () => {
		// B1: TemplateCard.vue:26-51 — the Active/Inactive switch label wraps one character per line
		// and the day-type chip is hard-clipped, at ordinary desktop width (1440px). Visual; not
		// meaningfully assertable without a layout-measuring helper this suite doesn't have.
		test.fixme('the Active/Inactive switch label does not wrap character-by-character', async () => {})

		// B2: TaskPlannerDayTemplateDetailsForm.vue:38-43 — "Suggested for Day Type" has no required
		// rule, so "Add Template" can be submitted without it, closes the dialog anyway, then fails
		// server-side with a raw error string and the typed input lost.
		test.fixme('creating a template without a day type either blocks submission or succeeds', async () => {})

		// X1: TemplateComparisonDialog.vue:120 — the two `fetchById` calls in one `Promise.all` cancel
		// each other (same AbortController-per-composable-instance issue CLAUDE.md documents for
		// `useEntityQuery`), so the dialog renders two empty panels every time, deterministically.
		test.fixme('the Compare Templates dialog shows both selected templates populated', async () => {})

		// B3: TemplateComparisonDialog.vue:6 passes `showConfirmBtn` (not a real MyDialog prop; the
		// real one is `hasConfirmBtn`), so a dead "Confirm" button renders on a dialog that should only
		// have "Cancel".
		test.fixme('the Compare Templates dialog has no Confirm button', async () => {})

		// B4: sort choice is plain component state, not a query param — CLAUDE.md's URL-state rule.
		test.fixme('the selected sort order survives a reload', async () => {})

		// A1/A2: the pin-toggle icon button and the compare-mode selection checkbox have no accessible
		// name (and the checkbox's hit area is blocked by the card's own icon) — both need a real
		// locator once fixed, not the positional ones this pass had to fall back to.
		test.fixme('the pin toggle and compare-mode checkbox are addressable by accessible name', async () => {})
	})
})

test.describe('Compare & Edit Templates (/day-planner/templates/split)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/day-planner/templates/split')
	})

	test.describe('rendering', () => {
		test('both panels start empty with a "Select a template" placeholder', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByText('Select a template')).toHaveCount(2)
		})

		test('the Left/Right Template selects list all three fixture templates', async ({ authenticatedPage }) => {
			// `getByRole('combobox', {name: 'Left Template'})` resolves but its click is intercepted by
			// a sibling `div[data-no-activator]` Vuetify renders over the field — clicking the visible
			// label text (which reads "Left TemplateLeft Template": floating label + empty value, both
			// matched) opens the menu the way a real user's click on the field does.
			await authenticatedPage.getByText('Left TemplateLeft Template').click()
			await expect(authenticatedPage.getByRole('option', { name: 'Home Office' })).toBeVisible()
			await expect(authenticatedPage.getByRole('option', { name: 'Office Day' })).toBeVisible()
			await expect(authenticatedPage.getByRole('option', { name: 'Relaxed Weekend' })).toBeVisible()
		})
	})

	test.describe('loading a template into a panel', () => {
		test('picking a template on the left loads its grid and does not touch the right panel', async ({
			authenticatedPage,
		}) => {
			// See the comment above on the field-click interception.
			await authenticatedPage.getByText('Left TemplateLeft Template').click()
			await authenticatedPage.getByRole('option', { name: 'Home Office' }).click()
			await expect(authenticatedPage.getByText('Home Office').first()).toBeVisible()
			// Right panel is untouched — still the empty placeholder.
			await expect(authenticatedPage.getByText('Select a template')).toHaveCount(1)
		})
	})

	test.describe('navigation', () => {
		test('the back arrow returns to the template list', async ({ authenticatedPage }) => {
			// Fragile fallback: TemplateSplitView.vue's back button (`icon="arrow-left"`) has no text
			// and no `aria-label`, so it is unnameable — the same class of gap as A1/A3 in
			// findings.md. Worth an `aria-label` once that's fixed; until then this is the only way in.
			await authenticatedPage.locator('button:has(svg[data-icon="arrow-left"])').click()
			await expect(authenticatedPage).toHaveURL(/\/day-planner\/templates$/)
		})
	})

	test.describe('known defects — filed, not asserted', () => {
		// P1-class keyboard-scoping regression check for the split view specifically: P1's fix (per
		// the intent sources) scoped `usePlannerKeyboard` so a shortcut in one panel doesn't affect
		// the other. Confirmed by hand in this pass (pressing "e" after selecting a task in the left
		// panel opened exactly one edit dialog) — worth a real assertion once a reliable way to select
		// a specific panel's task by locator is established; not written here to avoid a flaky
		// keyboard-timing test on a first pass.
		test.fixme('a keyboard shortcut in one panel does not affect the other panel', async () => {})

		// B4: left/right template selection is not a query param — reload loses both selections.
		test.fixme('the selected left/right templates survive a reload', async () => {})

		// U2: cross-template drag-and-drop was not exercised with an actual pointer drag in the
		// inventory pass — this stub is the place to write that once a reliable drag helper exists.
		test.fixme('dragging a task from one panel to the other moves it', async () => {})
	})
})
