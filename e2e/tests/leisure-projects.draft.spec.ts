import type { Page } from '@playwright/test'
import { apiUrl, expect, test } from '../fixtures/auth'

// Structural tier only — facts true by observation, not values that need a human's judgement.
// See docs/views/leisure-projects/findings.md for the semantic-tier gaps stubbed below (B1-B3).

test.describe('Leisure projects (/leisure/projects)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/leisure/projects')
		// The board's own fetch resolves after the initial paint — wait for the seeded project's card
		// (not just the column headers, which render before data arrives) before asserting anything.
		await authenticatedPage.getByText('Build a Bookshelf').waitFor({ state: 'visible' })
	})

	test.describe('rendering', () => {
		test('renders the readiness board with its three columns by default', async ({ authenticatedPage }) => {
			await expect(authenticatedPage.getByRole('button', { name: 'Board' })).toBeVisible()
			await expect(authenticatedPage.getByText('Ready to start')).toBeVisible()
			await expect(authenticatedPage.getByText('Needs shopping')).toBeVisible()
			await expect(authenticatedPage.getByText('Planning')).toBeVisible()
		})

		test('switching to Table renders a grid with the expected columns', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Table' }).click()
			const headerRow = authenticatedPage.getByRole('row').first()
			await expect(headerRow.getByRole('columnheader', { name: /Activity/ })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Difficulty' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Readiness' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Area' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Est. hours' })).toBeVisible()
			await expect(headerRow.getByRole('columnheader', { name: 'Messy' })).toBeVisible()
		})

		test('table Activity column is sortable and writes sortBy to the URL', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Table' }).click()
			await authenticatedPage.getByRole('columnheader', { name: /Activity/ }).click()
			await expect(authenticatedPage).toHaveURL(/sortBy=activity\.name:(asc|desc)/)
		})
	})

	test.describe('filter panel', () => {
		test('opens on Filter, closes on Escape', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
			await expect(authenticatedPage.getByRole('dialog', { name: 'Filter' })).toBeVisible()
			await authenticatedPage.keyboard.press('Escape')
			await expect(authenticatedPage.getByRole('dialog', { name: 'Filter' })).toBeHidden()
		})

		test('a confirmed filter survives a reload', async ({ authenticatedPage }) => {
			await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
			// The dropdown's own input intercepts pointer events on a direct click — click the field
			// wrapper instead, same as the manual pass that first found this locator.
			await authenticatedPage.getByText('ReadinessReadiness').click()
			await authenticatedPage.getByRole('option', { name: 'Needs shopping' }).click()
			await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
			await expect(authenticatedPage).toHaveURL(/readinessStatuses=needsShopping/)

			await authenticatedPage.reload()
			await expect(authenticatedPage.getByText('Readiness (1)')).toBeVisible()
			await expect(authenticatedPage).toHaveURL(/readinessStatuses=needsShopping/)
		})

		// Filtered-to-zero reads differently from "you have none" since F79 — not the onboarding copy.
		test('filtering to zero matches offers to clear the filters, not the onboarding empty state', async ({
			authenticatedPage,
		}) => {
			await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
			await authenticatedPage.getByRole('textbox', { name: 'Area' }).fill('zzz-no-such-area')
			await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
			await expect(authenticatedPage.getByText('Nothing matches these filters.')).toBeVisible()
			await expect(
				authenticatedPage.getByText("These are things you're building or making. You don't have any projects here yet."),
			).toBeHidden()

			await authenticatedPage.getByRole('button', { name: 'Clear filters' }).click()
			await expect(authenticatedPage.getByText('Nothing matches these filters.')).toBeHidden()
		})
	})

	test.describe('dialogs', () => {
		test('Add opens the create dialog; Cancel closes it without creating', async ({ authenticatedPage }) => {
			// `exact` — each row's "Add to to-do list: …" button also contains "Add".
			await authenticatedPage.getByRole('button', { name: 'Add', exact: true }).click()
			await expect(authenticatedPage.getByRole('dialog', { name: 'Projects' })).toBeVisible()
			await authenticatedPage.getByRole('button', { name: 'Cancel' }).click()
			await expect(authenticatedPage.getByRole('dialog', { name: 'Projects' })).toBeHidden()
		})

		test('card delete opens a confirmation naming the project, Cancel dismisses it', async ({ authenticatedPage }) => {
			await authenticatedPage.getByTitle('Delete').click()
			const confirmDialog = authenticatedPage.getByRole('dialog', { name: 'Delete confirmation' })
			await expect(confirmDialog).toBeVisible()
			await expect(confirmDialog.getByText('Build a Bookshelf')).toBeVisible()
			await confirmDialog.getByRole('button', { name: 'Cancel' }).click()
			await expect(confirmDialog).toBeHidden()
			// Cleanup check, not an assertion of anything semantic: the card must still be there.
			await expect(authenticatedPage.getByText('Build a Bookshelf')).toBeVisible()
		})
	})

	// The seed holds one project, so the board's grouping was only ever seen with one occupied column
	// (docs/views/_fix-queue.md, *Seed-data gaps*). One project per status is created through the API —
	// each on its own throwaway activity, since an activity holds at most one project profile — and
	// removed afterwards, so the fixture stays read-only (CLAUDE.md, *Mutating specs* 1).
	test.describe('board grouping across all three readiness statuses', () => {
		const STATUSES = [
			{ value: 'readyToStart', label: 'Ready to start' },
			{ value: 'needsShopping', label: 'Needs shopping' },
			{ value: 'planning', label: 'Planning' },
		] as const

		type Created = { activityId: number; profileId: number; name: string; label: string }

		async function createProjects(page: Page, roleId: number): Promise<Created[]> {
			const created: Created[] = []
			for (const { value, label } of STATUSES) {
				const name = `E2E ${label} project`
				const activity = await page.request.post(`${apiUrl()}/api/activity`, {
					data: { name, text: '', isUnavoidable: false, roleId },
				})
				expect(activity.ok(), `could not create activity "${name}": ${activity.status()} ${await activity.text()}`).toBe(
					true,
				)
				const activityId = Number(await activity.json())
				// Pushed before the profile, so a failed profile still leaves the activity to clean up.
				created.push({ activityId, profileId: 0, name, label })

				const profile = await page.request.post(`${apiUrl()}/api/activity-project-profile`, {
					data: {
						activityId,
						difficultyLevel: 'beginner',
						projectArea: 'E2E',
						estimatedHours: 2,
						isMessy: false,
						materialsNeeded: value === 'needsShopping' ? ['Screws'] : [],
						requiredTools: [],
						readinessStatus: value,
					},
				})
				expect(profile.ok(), `could not create the ${value} project: ${profile.status()} ${await profile.text()}`).toBe(
					true,
				)
				created[created.length - 1].profileId = Number(await profile.json())
			}
			return created
		}

		async function removeProjects(page: Page, created: Created[]) {
			for (const { profileId, activityId } of created) {
				if (profileId) await page.request.delete(`${apiUrl()}/api/activity-project-profile/${profileId}`)
				await page.request.delete(`${apiUrl()}/api/activity/${activityId}`)
			}
		}

		// By the column's own header, exactly — a `hasText` on the column would also match any card whose
		// name contains the label, and these cards are named after their status.
		function column(page: Page, label: string) {
			return page.locator('#app .readiness-column', { has: page.getByText(label, { exact: true }) })
		}

		test('each card lands in its own status column, and the table lists them all', async ({
			authenticatedPage,
			seed,
		}) => {
			const seeded = await authenticatedPage.request.get(`${apiUrl()}/api/activity/${seed.activities.buildABookshelf}`)
			expect(seeded.ok()).toBe(true)
			// The response nests the role (`ActivityResponse.Role`); the request takes its id flat.
			const roleId: number = (await seeded.json()).role.id

			let created: Created[] = []
			try {
				created = await createProjects(authenticatedPage, roleId)
				await authenticatedPage.reload()

				for (const { name, label } of created) {
					await expect(
						column(authenticatedPage, label).getByRole('button', { name: `Edit ${name}` }),
					).toBeVisible()
					for (const other of STATUSES.filter(s => s.label !== label)) {
						await expect(
							column(authenticatedPage, other.label).getByRole('button', { name: `Edit ${name}` }),
						).toHaveCount(0)
					}
				}
				// No column falls back to its empty placeholder once every status is occupied.
				await expect(authenticatedPage.locator('#app .readiness-empty')).toHaveCount(0)

				await authenticatedPage.getByRole('button', { name: 'Table' }).click()
				await expect(authenticatedPage.locator('#app tbody tr')).toHaveCount(created.length + 1)
				for (const { name } of created) {
					await expect(authenticatedPage.locator('#app tbody').getByText(name)).toBeVisible()
				}
			} finally {
				await removeProjects(authenticatedPage, created)
			}
		})

		test('a status button moves the card to that column', async ({ authenticatedPage, seed }) => {
			const seeded = await authenticatedPage.request.get(`${apiUrl()}/api/activity/${seed.activities.buildABookshelf}`)
			const roleId: number = (await seeded.json()).role.id

			let created: Created[] = []
			try {
				created = await createProjects(authenticatedPage, roleId)
				await authenticatedPage.reload()

				const ready = created[0]
				const card = authenticatedPage.getByRole('button', { name: `Edit ${ready.name}` })
				await expect(
					column(authenticatedPage, 'Ready to start').getByRole('button', { name: `Edit ${ready.name}` }),
				).toBeVisible()

				await card.getByTitle('Planning').click()
				await expect(
					column(authenticatedPage, 'Planning').getByRole('button', { name: `Edit ${ready.name}` }),
				).toBeVisible()
				await expect(
					column(authenticatedPage, 'Ready to start').getByRole('button', { name: `Edit ${ready.name}` }),
				).toHaveCount(0)
			} finally {
				await removeProjects(authenticatedPage, created)
			}
		})
	})

	// Semantic tier — logged as bugs in docs/views/leisure-projects/findings.md. Do not assert; a human
	// triages these first.

	// findings.md B1 — clicking Table from a fresh (query-string-free) load does not reliably write
	// `view=table` to the URL, so a reload can silently fall back to Board.
	test.fixme('Table view mode survives a reload', async () => {})

	// findings.md B2 — a board-mode filter change fires two competing grid requests (itemsPerPage 200
	// and 25) sharing one AbortController; only one should ever fire.
	test.fixme('exactly one grid request fires per board-mode filter change', async () => {})

	// findings.md B3 — the API nests activity icon/colour under `activity.role`, but `ActivityInfo`
	// reads them flat, so the icon L3 built never renders on the card or table row.
	test.fixme('project card/row renders the activity icon tinted with its role colour', async () => {})
})
