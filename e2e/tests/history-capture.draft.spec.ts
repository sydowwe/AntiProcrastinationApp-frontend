import { expect, test } from '../fixtures/auth'

// Structural tier only — facts true by observation, not values that need a human's judgement.
// See docs/views/history-capture/findings.md for the semantic/defect-tier gaps stubbed below (B1-B3, U1).

test.describe('History capture — the four record-activity views', () => {
	test('sidebar links reach all four routes', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/')
		await authenticatedPage.getByRole('option', { name: 'Record activity' }).click()
		await authenticatedPage.getByRole('link', { name: 'Manually' }).click()
		await expect(authenticatedPage).toHaveURL('/activity-history/manual')
		await authenticatedPage.getByRole('link', { name: 'Pomodoro timer' }).click()
		await expect(authenticatedPage).toHaveURL('/activity-history/pomodoro')
		await authenticatedPage.getByRole('link', { name: 'Stopwatch' }).click()
		await expect(authenticatedPage).toHaveURL('/activity-history/stopwatch')
		await authenticatedPage.getByRole('link', { name: 'Timer', exact: true }).click()
		await expect(authenticatedPage).toHaveURL('/activity-history/timer')
	})
})

test.describe('Stopwatch (/activity-history/stopwatch)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/stopwatch')
		await authenticatedPage.getByRole('button', { name: 'Start' }).waitFor({ state: 'visible' })
	})

	test('renders idle with Start enabled and Pause/Stop disabled', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('button', { name: 'Start' })).toBeEnabled()
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeDisabled()
		await expect(authenticatedPage.getByRole('button', { name: 'Stop' })).toBeDisabled()
	})

	test('start/pause/stop round trip, then Cancel on the save dialog discards without writing', async ({
		authenticatedPage,
	}) => {
		// The session has to be long enough to record. Since 2026-09-16 (`useSessionLength`), one that
		// rounds to zero minutes (under 30 s) is discarded before the save dialog opens, so a stopwatch
		// stopped straight away never reaches it. The store times everything by `Date.now()`, so the
		// page clock runs the session for two minutes without the test waiting them out.
		await authenticatedPage.clock.install()
		await authenticatedPage.reload()
		await authenticatedPage.getByRole('button', { name: 'Start' }).waitFor({ state: 'visible' })

		await authenticatedPage.getByRole('combobox', { name: '* Activity' }).click()
		await authenticatedPage.getByRole('option', { name: 'Bug Fixing' }).click()
		await authenticatedPage.getByRole('button', { name: 'Start' }).click()

		await expect(authenticatedPage.getByRole('button', { name: 'Start' })).toBeDisabled()
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeEnabled()
		await authenticatedPage.clock.fastForward('02:00')

		await authenticatedPage.getByRole('button', { name: 'Pause' }).click()
		await expect(authenticatedPage.getByRole('button', { name: 'Start' })).toBeEnabled()

		await authenticatedPage.getByRole('button', { name: 'Stop' }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Record new activity' })
		await expect(dialog).toBeVisible()
		await expect(dialog.getByText(/Confirm saving activity "Bug Fixing"/)).toBeVisible()

		// Escape must NOT close it — an `openDialog()` form keeps `MyDialog`'s persistent default (FW1).
		await authenticatedPage.keyboard.press('Escape')
		await expect(dialog).toBeVisible()

		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).toBeHidden()
		// Session cleared, Start idle again — the round trip left nothing running and wrote nothing.
		await expect(authenticatedPage.getByRole('button', { name: 'Start' })).toBeEnabled()
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeDisabled()
	})

	test('a session too short to record is discarded with a message, and no save dialog', async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.getByRole('combobox', { name: '* Activity' }).click()
		await authenticatedPage.getByRole('option', { name: 'Bug Fixing' }).click()
		await authenticatedPage.getByRole('button', { name: 'Start' }).click()
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeEnabled()

		await authenticatedPage.getByRole('button', { name: 'Stop' }).click()
		await expect(authenticatedPage.getByText('That session was too short to record — nothing was saved')).toBeVisible()
		await expect(authenticatedPage.getByRole('dialog', { name: 'Record new activity' })).toHaveCount(0)
		await expect(authenticatedPage.getByRole('button', { name: 'Start' })).toBeEnabled()
	})
})

test.describe('Timer (/activity-history/timer)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/timer')
		await authenticatedPage.getByRole('textbox', { name: 'Length' }).waitFor({ state: 'visible' })
	})

	test('a Quick Time chip applies its duration to the Length field', async ({ authenticatedPage }) => {
		await authenticatedPage.locator('span').filter({ hasText: '15m' }).click()
		await expect(authenticatedPage.getByRole('textbox', { name: 'Length' })).toHaveValue('00:15')
	})

	test('starting while another kind is running prompts to replace it, and Cancel keeps the original', async ({
		authenticatedPage,
	}) => {
		// Start a stopwatch session first.
		await authenticatedPage.goto('/activity-history/stopwatch')
		await authenticatedPage.getByRole('combobox', { name: '* Activity' }).click()
		await authenticatedPage.getByRole('option', { name: 'Bug Fixing' }).click()
		await authenticatedPage.getByRole('button', { name: 'Start' }).click()
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeEnabled()

		// Now try to start a countdown.
		await authenticatedPage.goto('/activity-history/timer')
		await authenticatedPage.locator('span').filter({ hasText: '15m' }).click()
		await authenticatedPage.getByRole('combobox', { name: '* Activity' }).click()
		await authenticatedPage.getByRole('option', { name: 'Code Review' }).click()
		await authenticatedPage.getByRole('button', { name: 'Start' }).click()

		const guard = authenticatedPage.getByRole('dialog', { name: 'Another timer is running' })
		await expect(guard).toBeVisible()
		await expect(guard.getByText(/Stopwatch is running for "Bug Fixing"/)).toBeVisible()
		await guard.getByRole('button', { name: 'Cancel' }).click()
		await expect(guard).toBeHidden()

		// The timer view is still idle (no countdown started), and the stopwatch is still the live session.
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeDisabled()
		await authenticatedPage.goto('/activity-history/stopwatch')
		await expect(authenticatedPage.getByRole('button', { name: 'Pause' })).toBeEnabled()

		// Clean up: stop, so no session is left running at the end of the test. The session is seconds
		// long, so Stop discards it outright (no save dialog since `useSessionLength`, 2026-09-16).
		await authenticatedPage.getByRole('button', { name: 'Stop' }).click()
		await expect(authenticatedPage.getByRole('button', { name: 'Start' })).toBeEnabled()
	})
})

test.describe('Pomodoro timer (/activity-history/pomodoro)', () => {
	test('renders the setup panel with focus/rest activity sections', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/pomodoro')
		await expect(authenticatedPage.getByText('Pomodoro Timer', { exact: true })).toBeVisible()
		await expect(authenticatedPage.getByRole('heading', { name: 'Focus activity' })).toBeVisible()
		await expect(authenticatedPage.getByRole('heading', { name: 'Rest activity (Optional)' })).toBeVisible()
	})

	test('Presets opens a card list; Close dismisses it', async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/pomodoro')
		await authenticatedPage.getByRole('button', { name: 'Presets' }).click()
		const dialog = authenticatedPage.getByRole('dialog')
		await expect(dialog.getByText('Classic Pomodoro')).toBeVisible()
		await dialog.getByRole('button', { name: 'Close' }).click()
		await expect(dialog).toBeHidden()
	})
})

test.describe('Manual entry (/activity-history/manual)', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/activity-history/manual')
		await authenticatedPage.getByRole('button', { name: 'Record activity to history' }).waitFor({ state: 'visible' })
	})

	test('submitting with no activity selected shows an inline required error and writes nothing', async ({
		authenticatedPage,
	}) => {
		const before = authenticatedPage.waitForResponse('**/api/activity-history', { timeout: 2000 }).catch(() => null)
		await authenticatedPage.getByRole('button', { name: 'Record activity to history' }).click()
		await expect(authenticatedPage.getByText('This field is required')).toBeVisible()
		await expect(authenticatedPage).toHaveURL('/activity-history/manual')
		expect(await before).toBeNull()
	})
})

// Semantic/defect tier — logged in docs/views/history-capture/findings.md. Do not assert; a human triages these
// first (B1-B3 are confirmed defects; U1 is unverified — reproducing it means a real write).

// findings.md B1 — TimeDisplay's seconds label renders the raw key `dateTime.secondsShort` instead of "s" on
// all three live views, because the app-side EN/SK `common.ts` mirrors of the framework's `dateTime` block omit
// just that one key.
test.fixme('the seconds label on a running stopwatch/timer/pomodoro reads "s", not a raw i18n key', () => {})

// findings.md B2 — TimePicker.vue's default 5-minute `allowedMinutesSelected` silently rounds a typed duration
// (e.g. "0007" -> "00:05") with no feedback, on Timer's Length field, Pomodoro's three duration fields, and
// Manual's Length field.
test.fixme('typing a duration not on a 5-minute boundary is not silently rounded away without feedback', () => {})

// findings.md B3 — every Quick Time / Activity Preset chip on /activity-history/timer carries an always-present,
// focusable "Close" button that is blank outside edit mode and, when clicked, hides the chip client-side only
// (no request fires; it reappears on reload) rather than doing nothing or actually deleting the preset.
test.fixme('a preset chip\'s close control does nothing when not in edit mode, or actually deletes the preset', () => {})

// findings.md U1 — AddActivityManuallyView has no @saved handler and AddActivityManuallyForm.saveActivity() has
// no in-flight guard, so double-clicking Record before the success snackbar appears may submit the same span
// twice. Not reproduced in the inventory pass (would require a real, uncleaned write).
test.fixme('double-clicking Record activity to history before the snackbar appears does not create two rows', () => {})
