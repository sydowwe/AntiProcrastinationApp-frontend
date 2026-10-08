import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

/**
 * OP7: "streak kept today" on the flame. Both flame chips on home (NowBar and the planner widget's
 * header) fill in with a check only when `streak.todayOutcome` is `Complete`, and share one accessible
 * name and tooltip per outcome: "Streaks: N · <kept today | finish today's plan to keep it | nothing
 * today can break it> · Best: M".
 *
 * Route-patched rather than earned: the seed account's streak is 0, so no chip renders for it at all,
 * and building a real run would write fixture rows every later spec reads. Only the `streak` object of
 * the day-plan response is patched, spread over the server's own so `today` and `timezone` stay real
 * (`assertServerDateAgrees` compares them with the browser's day).
 */
type StreakPatch = Record<string, unknown>

const CURRENT = 4
const BEST = 9

const KEPT = `Streaks: ${CURRENT} · kept today · Best: ${BEST}`
const AT_STAKE = `Streaks: ${CURRENT} · finish today's plan to keep it · Best: ${BEST}`
const SAFE = `Streaks: ${CURRENT} · nothing today can break it · Best: ${BEST}`

async function patchStreak(page: Page, patch: StreakPatch, { dropOutcome = false } = {}) {
	await page.route('**/api/calendar/day-plan/**', async route => {
		const response = await route.fetch()
		const body = (await response.json()) as { streak?: StreakPatch | null }
		const streak: StreakPatch = { ...(body.streak ?? {}), currentStreak: CURRENT, bestStreak: BEST, ...patch }
		if (dropOutcome) delete streak.todayOutcome
		await route.fulfill({ response, json: { ...body, streak } })
	})
}

async function openHome(page: Page) {
	const dayPlan = page.waitForResponse('**/api/calendar/day-plan/**')
	await page.goto('/')
	await dayPlan
}

/** Both chips carry the same `aria-label`: the NowBar's and the planner widget header's. */
function chips(page: Page, label: string): Locator {
	return page.locator(`.v-chip[aria-label="${label}"]`)
}

async function expectKept(page: Page, label: string) {
	const both = chips(page, label)
	await expect(both).toHaveCount(2)
	for (const chip of await both.all()) {
		await expect(chip).toHaveAttribute('title', label)
		await expect(chip).toHaveClass(/v-chip--variant-flat/)
		await expect(chip).not.toHaveClass(/v-chip--variant-tonal/)
		await expect(chip.locator('.v-chip__append .fa-check')).toHaveCount(1)
		await expect(chip).toContainText(String(CURRENT))
	}
}

async function expectNotKept(page: Page, label: string) {
	const both = chips(page, label)
	await expect(both).toHaveCount(2)
	for (const chip of await both.all()) {
		await expect(chip).toHaveAttribute('title', label)
		await expect(chip).toHaveClass(/v-chip--variant-tonal/)
		await expect(chip).not.toHaveClass(/v-chip--variant-flat/)
		await expect(chip.locator('.v-chip__append')).toHaveCount(0)
		await expect(chip).toContainText(String(CURRENT))
	}
}

test.describe('Streak kept today on the flame chips (/)', () => {
	test('Complete: both chips are filled, carry a check, and say "kept today"', async ({ authenticatedPage: page }) => {
		await patchStreak(page, { todayOutcome: 'Complete', isTodayComplete: true })
		await openHome(page)

		await expectKept(page, KEPT)
		// The other two readings are not on screen.
		await expect(chips(page, AT_STAKE)).toHaveCount(0)
		await expect(chips(page, SAFE)).toHaveCount(0)
	})

	test('Incomplete: both chips stay tonal, with no check, and say the plan is still to finish', async ({
		authenticatedPage: page,
	}) => {
		await patchStreak(page, { todayOutcome: 'Incomplete', isTodayComplete: false })
		await openHome(page)

		await expectNotKept(page, AT_STAKE)
		await expect(chips(page, KEPT)).toHaveCount(0)
		await expect(chips(page, SAFE)).toHaveCount(0)
	})

	test('Empty: both chips stay tonal, with no check, and say nothing today can break the run', async ({
		authenticatedPage: page,
	}) => {
		await patchStreak(page, { todayOutcome: 'Empty', isTodayComplete: false })
		await openHome(page)

		await expectNotKept(page, SAFE)
		await expect(chips(page, KEPT)).toHaveCount(0)
		await expect(chips(page, AT_STAKE)).toHaveCount(0)
	})

	test('a response without todayOutcome falls back to kept or safe, never to "at stake"', async ({
		authenticatedPage: page,
	}) => {
		// An API that predates the field still sends `isTodayComplete`.
		await patchStreak(page, { isTodayComplete: true }, { dropOutcome: true })
		await openHome(page)
		await expectKept(page, KEPT)
		await expect(chips(page, AT_STAKE)).toHaveCount(0)

		await page.unrouteAll({ behavior: 'wait' })
		await patchStreak(page, { isTodayComplete: false }, { dropOutcome: true })
		await openHome(page)
		await expectNotKept(page, SAFE)
		await expect(chips(page, AT_STAKE)).toHaveCount(0)
	})

	test('a streak of 0 renders no chip, whatever the outcome', async ({ authenticatedPage: page }) => {
		await patchStreak(page, { currentStreak: 0, todayOutcome: 'Complete', isTodayComplete: true })
		await openHome(page)

		// Wait on the page having settled before asserting an absence.
		await expect(page.locator('.planner-card')).toBeVisible()
		await expect(page.locator('.v-chip[aria-label^="Streaks:"]')).toHaveCount(0)
	})
})
