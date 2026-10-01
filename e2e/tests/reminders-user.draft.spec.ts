import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the reminders-user inventory pass
// (docs/views/reminders-user/). Semantic-tier claims and every logged bug/unverified finding are
// `test.fixme` stubs, per prompts/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// The route is the framework's Slovak path. `my-upcoming` returns the primary user's three
// explicit-recipient reminders (`seed.reminderDefinitions.callTheDentist / fileTaxReturn /
// payRentRecurring` — the REGISTER ids, not `seed.reminders`). Read-only: nothing here confirms a
// snooze or a dismiss.
//
// Row buttons all share one accessible name (findings B1), so rows are addressed by position — a
// `.first()` / `.nth()` here is that finding's argument, not a style choice.

const MY_REMINDERS = '/pripomienky/moje'

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

	test('a filter matching nothing renders the empty row', async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${MY_REMINDERS}?kind=NoSuchKind`)
		await expect(authenticatedPage.getByRole('cell', { name: 'No data available' })).toBeVisible()
	})

	test('the Snooze dialog opens with four choices and Cancel closes it', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' })
		for (const name of [/^In 1 hour — /, /^Tomorrow morning \(9:00\) — /, /^In a week — /, 'Custom time']) {
			await expect(dialog.getByRole('radio', { name })).toBeVisible()
		}
		await expect(dialog.getByRole('radio', { name: /^In 1 hour/ })).toBeChecked()
		await dialog.getByRole('button', { name: 'Cancel' }).click()
		await expect(dialog).toBeHidden()
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

	// B1 — every row reads "PersonalReminder | Portal"; the personal projection carries no title.
	test.fixme('each row carries text that distinguishes it from the others', async () => {})

	// B2 — presets are relative to now, so the default "In 1 hour" lands before a future occurrence.
	test.fixme('no snooze preset resolves to an instant before the occurrence', async () => {})

	// B3 — a date-only "to" bound is sent as that day's local midnight, excluding the day itself.
	test.fixme('"Next occurrence to" includes reminders due on the chosen day', async () => {})

	// B4 — `my-upcoming` omits intervalPreset, so the interval row's schedule cell reads "—".
	test.fixme('the recurring-interval row states its interval', async () => {})

	// B5 — a failed load looks like an empty list and is announced as "0 results found".
	test.fixme('a failed load shows an error with a retry, not an empty table', async () => {})

	// A1 — the first Snooze dialog of a page load drops focus to <body> on close (_fix-queue S13).
	test.fixme('closing the first Snooze dialog returns focus to its row button', async () => {})

	// A2 — MyDialog defaults to persistent, so Escape leaves Snooze/Dismiss open.
	test.fixme('Escape closes the Snooze and Dismiss dialogs', async () => {})

	// U1 — `my-upcoming` does not exclude the caller's dismissed/snoozed occurrences, so the post-action
	// reload likely brings the row back. Needs a mutation-tier strategy (freshSeed) to test.
	test.fixme('a dismissed occurrence does not reappear after the list reloads', async () => {})
})
