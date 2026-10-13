import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'
import { apiUrl } from '../fixtures/seed'

/**
 * P2-01: the morning briefing, one `MorningBriefing` notification at the day's wake-up plus an offset,
 * in place of several separate morning pings. These specs cover its two preferences on
 * `/user/settings` → Preferences (`MorningBriefingField.vue`) and its row on the notification settings
 * screen. The notification itself is sent by a server job at wake-up and is not driven from here.
 *
 * Every test may write the primary user's `morningBriefingEnabled` / `morningBriefingOffsetMinutes`,
 * fixture account fields, so each one puts the server defaults back through the API afterwards instead
 * of opting into `freshSeed`, the same trade `weather-location.spec.ts` makes. Server state is read back
 * through `GET /user/data`, not the field: the user store persists in localStorage and assigns
 * optimistically, so a reload alone would show a value the server dropped.
 */
test.describe.configure({ mode: 'serial' })

const SWITCH_LABEL = 'Morning briefing'
const OFFSET_LABEL = 'Send it'

type Briefing = { morningBriefingEnabled: boolean; morningBriefingOffsetMinutes: number }

async function setBriefing(page: Page, briefing: Briefing) {
	const saved = await page.request.put(`${apiUrl()}/api/user/preferences`, { data: briefing })
	expect(
		saved.ok(),
		`could not set the briefing to ${JSON.stringify(briefing)}: ${saved.status()} ${await saved.text()}`,
	).toBe(true)
}

async function storedBriefing(page: Page): Promise<Briefing> {
	const response = await page.request.get(`${apiUrl()}/api/user/data`)
	expect(response.ok()).toBe(true)
	const { morningBriefingEnabled, morningBriefingOffsetMinutes } = (await response.json()) as Briefing
	return { morningBriefingEnabled, morningBriefingOffsetMinutes }
}

function preferencesPut(page: Page) {
	return page.waitForRequest(request => request.method() === 'PUT' && request.url().endsWith('/api/user/preferences'))
}

// A `VSelect` cannot be opened by its combobox role: a `data-no-activator` div inside the field takes the
// pointer events (CLAUDE.md, "Opening a VIdSelect"). The field input underneath it can be clicked.
function offsetSelect(page: Page) {
	return page.locator('.v-select').filter({ hasText: OFFSET_LABEL })
}

async function openSettings(page: Page) {
	await page.goto('/user/settings')
	await page.getByRole('checkbox', { name: SWITCH_LABEL }).waitFor()
	// Let the hydration write land. The seed puts the accounts on UTC and this browser is not, so the first
	// `hydrateFromServer()` after a seed PUTs the browser's zone; any other user write still in flight with
	// it (a save below, or the reset in `afterEach`) fails Identity's concurrency check with a 400
	// "Optimistic concurrency failure". Same wait, same reason, as `two-factor.spec.ts`.
	await page.waitForLoadState('networkidle')
}

test.afterEach(async ({ authenticatedPage }) => {
	await setBriefing(authenticatedPage, { morningBriefingEnabled: true, morningBriefingOffsetMinutes: 0 })
})

test.describe('Morning briefing preference (/user/settings — Preferences)', () => {
	test('is on and sent at wake-up by default', async ({ authenticatedPage }) => {
		await openSettings(authenticatedPage)

		await expect(authenticatedPage.getByRole('checkbox', { name: SWITCH_LABEL })).toBeChecked()
		await expect(offsetSelect(authenticatedPage)).toContainText('At wake-up')
	})

	test('a picked offset saves alone and is read back after a reload', async ({ authenticatedPage }) => {
		await openSettings(authenticatedPage)

		await offsetSelect(authenticatedPage).locator('.v-field__input').click()
		// Filtered, because the page's other selects keep their options in the DOM too.
		const options = authenticatedPage.getByRole('option').filter({ hasText: 'wake-up' })
		await expect(options).toHaveText([
			'At wake-up',
			'15 min after wake-up',
			'30 min after wake-up',
			'60 min after wake-up',
			'90 min after wake-up',
			'120 min after wake-up',
			'180 min after wake-up',
		])

		const put = preferencesPut(authenticatedPage)
		await authenticatedPage.getByRole('option', { name: '30 min after wake-up' }).click()
		// Only this key: the server leaves an unsent field unchanged, and sending both would re-save the switch.
		expect((await put).postDataJSON()).toEqual({ morningBriefingOffsetMinutes: 30 })
		await expect(authenticatedPage.getByText('Preference saved')).toBeVisible()

		expect(await storedBriefing(authenticatedPage)).toEqual({
			morningBriefingEnabled: true,
			morningBriefingOffsetMinutes: 30,
		})
		await openSettings(authenticatedPage)
		await expect(offsetSelect(authenticatedPage)).toContainText('30 min after wake-up')
	})

	test('turning it off saves, hides the offset, and keeps the offset for later', async ({ authenticatedPage }) => {
		await setBriefing(authenticatedPage, { morningBriefingEnabled: true, morningBriefingOffsetMinutes: 60 })
		await openSettings(authenticatedPage)
		const toggle = authenticatedPage.getByRole('checkbox', { name: SWITCH_LABEL })

		const put = preferencesPut(authenticatedPage)
		await toggle.click()
		expect((await put).postDataJSON()).toEqual({ morningBriefingEnabled: false })
		await expect(authenticatedPage.getByText('Preference saved')).toBeVisible()
		await expect(offsetSelect(authenticatedPage)).toHaveCount(0)

		expect(await storedBriefing(authenticatedPage)).toEqual({
			morningBriefingEnabled: false,
			morningBriefingOffsetMinutes: 60,
		})
		await openSettings(authenticatedPage)
		await expect(toggle).not.toBeChecked()

		// Back on: the offset chosen before is still there, because turning it off never sent it. Awaited to
		// the response, so this save is not still in flight against the reset in `afterEach`.
		const putBack = authenticatedPage.waitForResponse(
			response => response.request().method() === 'PUT' && response.url().endsWith('/api/user/preferences'),
		)
		await toggle.click()
		expect((await putBack).ok()).toBe(true)
		await expect(offsetSelect(authenticatedPage)).toContainText('60 min after wake-up')
	})
})

test.describe('Morning briefing on the notification settings screen (/nastavenia/pripomienky)', () => {
	test('has its own labelled row, and the routine reminder it replaces keeps its row', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto('/nastavenia/pripomienky')
		// The hydration write again (see `openSettings`): the reset in `afterEach` must not race it.
		await authenticatedPage.waitForLoadState('networkidle')

		// The label comes from `notificationTypeMeta.ts`; an unregistered type would show its raw enum name.
		await expect(authenticatedPage.getByRole('rowheader', { name: 'Morning briefing', exact: true })).toBeVisible()
		await expect(authenticatedPage.getByRole('rowheader', { name: 'MorningBriefing' })).toHaveCount(0)
		// Turning the briefing off brings the routine digest back, so its row must stay reachable.
		await expect(authenticatedPage.getByRole('rowheader', { name: 'Routine suggested for today' })).toBeVisible()
	})
})
