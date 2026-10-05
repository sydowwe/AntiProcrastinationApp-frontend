import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the reminders-user inventory pass
// (docs/views/_submodule/reminders-user/). Semantic-tier claims and every logged bug/unverified finding are
// `test.fixme` stubs, per prompts/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// The route is the framework's Slovak path. `my-upcoming` returns the primary user's three
// explicit-recipient reminders (`seed.reminderDefinitions.callTheDentist / fileTaxReturn /
// payRentRecurring` — the REGISTER ids, not `seed.reminders`). Read-only: nothing here confirms a
// snooze or a dismiss.
//
// Row buttons used to share one accessible name (findings B1), which is why the older tests below address
// rows by position. Since O1 each row and its buttons carry the reminder's title (TITLES).

const MY_REMINDERS = '/pripomienky/moje'

// The primary user's three titles, which `PersonalReminderLabelResolver` serves as `displayLabel`. The seed
// response carries no titles, so these mirror `E2eFixtureSeeder.cs` in the API.
const TITLES = ['Call the dentist', 'File the tax return', 'Pay the rent'] as const

// `formatInstant`'s on-screen form, "06.10.2026 16:30:00", read back as a local instant. Both sides
// of every comparison go through it, so the browser's timezone cancels out.
function parseShown(text: string): Date {
	const match = /(\d{2})\.(\d{2})\.(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/.exec(text.trim())
	if (match === null) throw new Error(`Not a shown instant: "${text}"`)
	const [, day, month, year, hour, minute, second] = match.map(Number)
	return new Date(year, month - 1, day, hour, minute, second)
}

test.describe(`My reminders (${MY_REMINDERS})`, () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(MY_REMINDERS)
		await authenticatedPage.getByRole('heading', { name: 'My reminders', level: 1 }).waitFor()
		// Wait for the rows, not the heading: the grid paints before `my-upcoming` resolves.
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().waitFor()
	})

	test('renders the table with its column headers', async ({ authenticatedPage }) => {
		// "Kind" and "Next occurrence" carry a sort-priority badge in their accessible name ("Kind 2") — P2.
		for (const name of [/^Kind/, 'Owner module', 'Schedule type', /^Next occurrence/, 'Actions']) {
			await expect(authenticatedPage.getByRole('columnheader', { name })).toBeVisible()
		}
	})

	test('a bare URL is rewritten to the default page/sort state', async ({ authenticatedPage }) => {
		await expect(authenticatedPage).toHaveURL(/page=1&perPage=25&sortBy=nextOccurrenceAt:asc/)
	})

	test('clicking a sortable header writes the sort to the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('columnheader', { name: 'Owner module' }).click()
		await expect(authenticatedPage).toHaveURL(/sortBy=ownerModule:asc/)
	})

	test('the live region reports the result count', async ({ authenticatedPage }) => {
		// `d-sr-only`; filtered by text because the top bar's unread badge is also a `status` ("Badge").
		await expect(authenticatedPage.getByRole('status').filter({ hasText: /results? found/ })).toHaveText(
			/^\d+ results? found$/,
		)
	})

	test('"Reminder preferences" navigates to the reminder-preference screen', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('link', { name: 'Reminder preferences' }).click()
		await expect(authenticatedPage).toHaveURL(/\/nastavenia\/pripomienky$/)
	})

	test('the Filter dialog opens with its fields and Escape closes it', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Filter' })
		for (const name of ['Owner module', 'Kind', 'Next occurrence from', 'Next occurrence to']) {
			await expect(dialog.getByRole('textbox', { name })).toBeVisible()
		}
		await authenticatedPage.keyboard.press('Escape')
		await expect(dialog).toBeHidden()
	})

	test('a kind filter becomes a URL param and a chip, and survives a reload', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		await authenticatedPage.getByRole('textbox', { name: 'Kind' }).fill('PersonalReminder')
		await authenticatedPage.getByRole('button', { name: 'Confirm' }).click()
		await expect(authenticatedPage).toHaveURL(/kind=PersonalReminder/)
		await expect(authenticatedPage.getByText('Kind: PersonalReminder')).toBeVisible()
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByText('Kind: PersonalReminder')).toBeVisible()
	})

	// P4 / _fix-queue S29: the filtered-empty state is its own, and offers a way back.
	test('a filter matching nothing says so and clears back to the full list', async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${MY_REMINDERS}?kind=NoSuchKind`)
		await expect(authenticatedPage.getByText('Nothing matches the current filters.')).toBeVisible()
		await authenticatedPage.getByRole('button', { name: 'Clear filters' }).click()
		await expect(authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first()).toBeVisible()
		expect(new URL(authenticatedPage.url()).searchParams.get('kind')).toBeNull()
	})

	test('the Snooze dialog opens with four choices and Cancel closes it', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' })
		for (const name of [/^1 hour after it — /, /^The morning after \(9:00\) — /, /^A week after it — /, 'Custom time']) {
			await expect(dialog.getByRole('radio', { name })).toBeVisible()
		}
		await expect(dialog.getByRole('radio', { name: /^1 hour after it/ })).toBeChecked()
		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).toBeHidden()
	})

	// B2 / _fix-queue S28: every preset is counted from the occurrence, so none can bring it forward.
	test('no snooze preset resolves to an instant before the occurrence', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' })
		const occurrenceText = await dialog.getByText(/^\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{2}:\d{2}$/).first().innerText()
		const occurrence = parseShown(occurrenceText)
		for (const name of [/^1 hour after it — /, /^The morning after \(9:00\) — /, /^A week after it — /]) {
			const label = await dialog.locator('label').filter({ hasText: name }).innerText()
			const shown = parseShown(label.split(' — ')[1])
			expect(shown.getTime()).toBeGreaterThan(occurrence.getTime())
		}
	})

	// A2 (Dismiss half) / _fix-queue S30: an input-less confirmation closes on Escape.
	test('Escape closes the Dismiss dialog and returns focus to its row button', async ({ authenticatedPage }) => {
		const opener = authenticatedPage.getByRole('button', { name: /^Dismiss delivery of reminder/ }).first()
		await opener.focus()
		await authenticatedPage.keyboard.press('Enter')
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' })
		await expect(dialog).toBeVisible()
		await authenticatedPage.keyboard.press('Escape')
		await expect(dialog).toBeHidden()
		await expect(opener).toBeFocused()
	})

	// FW1 (owner decision 2026-09-23): Snooze carries a custom-time form, so it stays persistent.
	test('the Snooze dialog resists Escape', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' })
		await expect(dialog).toBeVisible()
		await authenticatedPage.keyboard.press('Escape')
		await expect(dialog).toBeVisible()
	})

	// P5 / _fix-queue S30: the rows are otherwise alike, so the confirmation names the occurrence.
	test('the Dismiss dialog names the occurrence it dismisses', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^Dismiss delivery of reminder/ }).first().click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' })
		await expect(dialog.getByText('Occurrence', { exact: true })).toBeVisible()
		await expect(dialog.getByText(/^\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{2}:\d{2}$/)).toBeVisible()
	})

	// B5 / _fix-queue S29: a failed load is a failure, with a way back, not an empty list.
	test('a failed load shows an error with a retry, not an empty table', async ({ authenticatedPage }) => {
		await authenticatedPage.route('**/reminder-dashboard/my-upcoming', route =>
			route.fulfill({ status: 500, contentType: 'application/json', body: '{"statusCode":500}' }),
		)
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByText('The list could not be loaded.').first()).toBeVisible()
		await expect(authenticatedPage.getByRole('status').filter({ hasText: 'The list could not be loaded.' })).toBeAttached()

		await authenticatedPage.unroute('**/reminder-dashboard/my-upcoming')
		await authenticatedPage.getByRole('button', { name: 'Try again' }).click()
		await expect(authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first()).toBeVisible()
	})

	test('choosing "Custom time" disables Snooze until an instant is set', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' })
		await dialog.getByRole('radio', { name: 'Custom time' }).click()
		await expect(dialog.getByRole('textbox', { name: 'Remind me on' })).toBeVisible()
		await expect(dialog.getByRole('button', { name: 'Snooze' })).toBeDisabled()
	})

	test('the Dismiss dialog opens and Cancel returns focus to its row button', async ({ authenticatedPage }) => {
		const opener = authenticatedPage.getByRole('button', { name: /^Dismiss delivery of reminder/ }).first()
		await opener.focus()
		await authenticatedPage.keyboard.press('Enter')
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' })
		await expect(dialog.getByText('This cannot be undone from here.', { exact: false })).toBeVisible()
		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).toBeHidden()
		await expect(opener).toBeFocused()
	})

	test('the page body does not scroll horizontally at 375 px', async ({ authenticatedPage }) => {
		await authenticatedPage.setViewportSize({ width: 375, height: 812 })
		const overflow = await authenticatedPage.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth,
		)
		expect(overflow).toBeLessThanOrEqual(0)
	})

	// --- Semantic tier and logged findings: stubs only ---

	// Scoping rule: the primary user sees exactly their three explicit-recipient reminders; the secondary
	// user sees only `secondaryPostParcel`. Needs a `myUpcomingReminders` count from the seed to assert.
	test.fixme('lists exactly the signed-in user’s own upcoming reminders', async () => {})

	// B1 (O1) — every row read "PersonalReminder | Portal"; `my-upcoming` now carries the owner's title.
	test('each row and its actions are named by the reminder\'s title', async ({ authenticatedPage }) => {
		const rows = authenticatedPage.locator('main tbody tr')
		await expect(rows).toHaveCount(TITLES.length)
		for (const title of TITLES) {
			await expect(rows.filter({ hasText: title })).toHaveCount(1)
			await expect(authenticatedPage.getByRole('button', { name: `Snooze reminder ${title}`, exact: true })).toHaveCount(1)
			await expect(
				authenticatedPage.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }),
			).toHaveCount(1)
		}
	})

	// B3 — a date-only "to" bound is sent as that day's local midnight, excluding the day itself.
	test.fixme('"Next occurrence to" includes reminders due on the chosen day', async () => {})

	// B1 (§S6) — the Dismiss confirmation names the reminder as well as the occurrence.
	test('the Dismiss dialog names the reminder it dismisses', async ({ authenticatedPage }) => {
		const title = TITLES[2]
		await authenticatedPage.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' })
		await expect(dialog.getByText('Reminder', { exact: true })).toBeVisible()
		await expect(dialog.getByText(title, { exact: true })).toBeVisible()
	})

	// B4 (§S6) — `my-upcoming` omitted intervalPreset, so the interval row's schedule cell read "—".
	// payRentRecurring is seeded `Monthly` (`E2eFixtureSeeder.cs`).
	test('the recurring-interval row states its interval', async ({ authenticatedPage }) => {
		const row = authenticatedPage.locator('main tbody tr').filter({ hasText: TITLES[2] })
		await expect(row).toContainText('Monthly')
	})

	// A1 — the first Snooze dialog of a page load drops focus to <body> on close (_fix-queue S13).
	test.fixme('closing the first Snooze dialog returns focus to its row button', async () => {})

	// U1 — `my-upcoming` does not exclude the caller's dismissed/snoozed occurrences, so the post-action
	// reload likely brings the row back. Needs a mutation-tier strategy (freshSeed) to test.
	test.fixme('a dismissed occurrence does not reappear after the list reloads', async () => {})
})
