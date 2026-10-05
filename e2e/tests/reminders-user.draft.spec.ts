import { expect, reseed, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the reminders-user inventory pass
// (docs/views/_submodule/reminders-user/). Semantic-tier claims and every logged bug/unverified finding are
// `test.fixme` stubs, per prompts/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// The route is the framework's Slovak path. `my-upcoming` returns the primary user's three
// explicit-recipient reminders (`seed.reminderDefinitions.callTheDentist / fileTaxReturn /
// payRentRecurring` — the REGISTER ids, not `seed.reminders`). The first block is read-only; the second
// (B6) confirms real snoozes and dismissals and reseeds around itself.
//
// Row buttons used to share one accessible name (findings B1), which is why the older tests below address
// rows by position. Since O1 each row and its buttons carry the reminder's title (TITLES).

const MY_REMINDERS = '/pripomienky/moje'

// The primary user's three titles, which `PersonalReminderLabelResolver` serves as `displayLabel`. The seed
// response carries no titles, so these mirror `E2eFixtureSeeder.cs` in the API.
const TITLES = ['Call the dentist', 'File the tax return', 'Pay the rent'] as const

// `formatInstant`'s on-screen form in the fixture accounts' EN locale, "10/06/2026 4:30:00 PM" (P6 / S11
// made it follow the locale; it was "06.10.2026 16:30:00" in every locale before). Read back as a local
// instant. Both sides of every comparison go through it, so the browser's timezone cancels out.
const SHOWN_INSTANT = /^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}:\d{2} [AP]M$/

function parseShown(text: string): Date {
	const match = /(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2}) ([AP]M)/.exec(text.trim())
	if (match === null) throw new Error(`Not a shown instant: "${text}"`)
	const [month, day, year, hour12, minute, second] = match.slice(1, 7).map(Number)
	const hour = (hour12 % 12) + (match[7] === 'PM' ? 12 : 0)
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
		for (const name of [/^Kind/, 'Schedule type', /^Next occurrence/, 'Actions']) {
			await expect(authenticatedPage.getByRole('columnheader', { name })).toBeVisible()
		}
		// P3 — the owner module read the same on every row, so the personal view no longer has the column.
		await expect(authenticatedPage.getByRole('columnheader', { name: 'Owner module' })).toHaveCount(0)
	})

	// P2 / _fix-queue S23: the default sort is declared with its tie-breaker, so state equals default and
	// a bare URL is left alone.
	test('a bare URL stays bare', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first()).toBeVisible()
		expect(new URL(authenticatedPage.url()).search).toBe('')
	})

	test('clicking a sortable header writes the sort to the URL', async ({ authenticatedPage }) => {
		await authenticatedPage.getByRole('columnheader', { name: /^Next occurrence/ }).click()
		await expect(authenticatedPage).toHaveURL(/sortBy=nextOccurrenceAt:desc/)
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
		for (const name of ['Next occurrence from', 'Next occurrence to']) {
			await expect(dialog.getByRole('textbox', { name })).toBeVisible()
		}
		// P3 — the two exact-match code fields are gone until a kind catalog exists (§S2).
		for (const name of ['Owner module', 'Kind']) {
			await expect(dialog.getByRole('textbox', { name, exact: true })).toHaveCount(0)
		}
		await authenticatedPage.keyboard.press('Escape')
		await expect(dialog).toBeHidden()
	})

	// P3 — the cells used to read the codes `PersonalReminder` / `Portal`.
	test('the kind cell shows a label, not the server code', async ({ authenticatedPage }) => {
		const tbody = authenticatedPage.locator('main tbody')
		await expect(tbody.getByText('Personal reminders').first()).toBeVisible()
		await expect(tbody).not.toContainText('PersonalReminder')
		await expect(tbody).not.toContainText('Portal')
	})

	// P3 — an old bookmark's `?kind=` would otherwise narrow the list with no chip to clear it. The param
	// itself stays in the address bar until the first table change rewrites the query (useTableUrlState
	// syncs on change only), so the test asserts that nothing is applied rather than that the URL is clean.
	test('a kind param from an old link is ignored', async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${MY_REMINDERS}?kind=NoSuchKind&module=NoSuchModule`)
		await expect(authenticatedPage.locator('main tbody tr')).toHaveCount(TITLES.length)
		await expect(authenticatedPage.locator('main .v-chip').filter({ hasText: /Kind|Owner module/ })).toHaveCount(0)
	})

	// P4 / _fix-queue S29: the filtered-empty state is its own, and offers a way back. A `to` bound long
	// before the seed date matches nothing, whatever the seed's relative dates are.
	test('a filter matching nothing says so and clears back to the full list', async ({ authenticatedPage }) => {
		await authenticatedPage.goto(`${MY_REMINDERS}?to=2000-01-01`)
		await expect(authenticatedPage.getByText('Nothing matches the current filters.')).toBeVisible()
		await authenticatedPage.getByRole('button', { name: 'Clear filters' }).click()
		await expect(authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first()).toBeVisible()
		expect(new URL(authenticatedPage.url()).searchParams.get('to')).toBeNull()
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
		const occurrenceText = await dialog.getByText(SHOWN_INSTANT).first().innerText()
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
		await expect(dialog.getByText(SHOWN_INSTANT)).toBeVisible()
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
		// `exact`: since A3 the time half is named "Remind me on — Time".
		await expect(dialog.getByRole('textbox', { name: 'Remind me on', exact: true })).toBeVisible()
		await expect(dialog.getByRole('button', { name: 'Snooze' })).toBeDisabled()
	})

	test('the Dismiss dialog opens and Cancel returns focus to its row button', async ({ authenticatedPage }) => {
		const opener = authenticatedPage.getByRole('button', { name: /^Dismiss delivery of reminder/ }).first()
		await opener.focus()
		await authenticatedPage.keyboard.press('Enter')
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' })
		// O1 — the copy used to say "This cannot be undone from here."; Undo now exists on the row.
		await expect(dialog.getByText('You can undo this from the list until the occurrence is due.', { exact: false })).toBeVisible()
		await expect(dialog.getByText('cannot be undone', { exact: false })).toHaveCount(0)
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

	// B1 (O1) — every row read "PersonalReminder | Portal"; `my-upcoming` now carries the owner's title (and
	// P3 labels the kind).
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

})

// B6 / O1 (§S7) — a snoozed or dismissed row used to come back from the reload unchanged, offering both actions
// again. `my-upcoming` now reports the caller's own action and the row carries it as a chip. These confirm real
// actions on fixture rows, so the block reseeds before each test and once after the last.
test.describe(`My reminders — acted-on rows (${MY_REMINDERS})`, () => {
	test.describe.configure({ mode: 'serial', timeout: 60_000 })
	test.use({ freshSeed: true })

	test.afterAll(async () => {
		test.setTimeout(60_000)
		await reseed()
	})

	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto(MY_REMINDERS)
		await authenticatedPage.getByRole('button', { name: /^Snooze reminder/ }).first().waitFor()
	})

	test('a dismissed row says so, offers no action, and stays that way after a reload', async ({ authenticatedPage }) => {
		const title = TITLES[0]
		const row = authenticatedPage.locator('main tbody tr').filter({ hasText: title })
		await authenticatedPage.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' }).getByRole('button', { name: 'Dismiss delivery' }).click()

		for (const pass of ['after the action', 'after a reload']) {
			if (pass === 'after a reload') await authenticatedPage.reload()
			await expect(row, pass).toContainText('Dismissed')
			await expect(row.getByRole('button', { name: /^(Snooze|Dismiss)/ }), pass).toHaveCount(0)
		}
		await expect(authenticatedPage.locator('main tbody tr')).toHaveCount(TITLES.length)
	})

	test('a snoozed row says until when, keeps its actions, and stays that way after a reload', async ({ authenticatedPage }) => {
		const title = TITLES[1]
		const row = authenticatedPage.locator('main tbody tr').filter({ hasText: title })
		await authenticatedPage.getByRole('button', { name: `Snooze reminder ${title}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' }).getByRole('button', { name: 'Snooze' }).click()

		for (const pass of ['after the action', 'after a reload']) {
			if (pass === 'after a reload') await authenticatedPage.reload()
			await expect(row, pass).toContainText('Snoozed until')
			await expect(row.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }), pass).toBeEnabled()
		}
	})

	// O1 (Undo) — the chip said what the user did, but nothing took it back. Undo appends a reversal on the
	// server, so the occurrence is delivered as if the user had never acted.
	const undoName = (title: string) => `Undo your snooze or dismissal of reminder ${title}`

	test('an untouched row offers no Undo', async ({ authenticatedPage }) => {
		await expect(authenticatedPage.getByRole('button', { name: /^Undo/ })).toHaveCount(0)
	})

	test('Undo on a dismissed row restores its actions, sends one undo, and survives a reload', async ({ authenticatedPage }) => {
		const title = TITLES[0]
		const row = authenticatedPage.locator('main tbody tr').filter({ hasText: title })
		await authenticatedPage.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' }).getByRole('button', { name: 'Dismiss delivery' }).click()
		await expect(row).toContainText('Dismissed')

		const request = authenticatedPage.waitForRequest(r => r.url().includes('/reminder-dashboard/undo') && r.method() === 'POST')
		await row.getByRole('button', { name: undoName(title), exact: true }).click()

		const body = (await request).postDataJSON()
		expect(Object.keys(body).sort()).toEqual(['occurrenceAt', 'reminderDefinitionId'])
		await expect(authenticatedPage.getByText('Restored — this occurrence will be delivered as planned.')).toBeVisible()

		for (const pass of ['after the undo', 'after a reload']) {
			if (pass === 'after a reload') await authenticatedPage.reload()
			await expect(row, pass).not.toContainText('Dismissed')
			await expect(row.getByRole('button', { name: `Snooze reminder ${title}`, exact: true }), pass).toBeEnabled()
			await expect(row.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }), pass).toBeEnabled()
			await expect(row.getByRole('button', { name: /^Undo/ }), pass).toHaveCount(0)
		}
	})

	test('Undo on a snoozed row clears the chip and stays cleared after a reload', async ({ authenticatedPage }) => {
		const title = TITLES[1]
		const row = authenticatedPage.locator('main tbody tr').filter({ hasText: title })
		await authenticatedPage.getByRole('button', { name: `Snooze reminder ${title}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' }).getByRole('button', { name: 'Snooze' }).click()
		await expect(row).toContainText('Snoozed until')

		await row.getByRole('button', { name: undoName(title), exact: true }).click()

		for (const pass of ['after the undo', 'after a reload']) {
			if (pass === 'after a reload') await authenticatedPage.reload()
			await expect(row, pass).not.toContainText('Snoozed until')
			await expect(row.getByRole('button', { name: /^Undo/ }), pass).toHaveCount(0)
		}
	})

	test('Undo is on the acted row only, and a keyboard user can reach it', async ({ authenticatedPage }) => {
		const title = TITLES[2]
		await authenticatedPage.getByRole('button', { name: `Dismiss delivery of reminder ${title}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' }).getByRole('button', { name: 'Dismiss delivery' }).click()

		const undo = authenticatedPage.getByRole('button', { name: /^Undo/ })
		await expect(undo).toHaveCount(1)
		await expect(undo).toHaveAccessibleName(undoName(title))
		await undo.focus()
		await expect(undo).toBeFocused()
	})

	// O1 (filter) — "show me what I snoozed". It is computed in SQL, so the pager's total counts the filtered set.
	test('?action=Snoozed lists only the snoozed rows, shows a chip, and clears back to the full list', async ({ authenticatedPage }) => {
		const snoozed = TITLES[1]
		await authenticatedPage.getByRole('button', { name: `Snooze reminder ${snoozed}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' }).getByRole('button', { name: 'Snooze' }).click()
		await expect(authenticatedPage.locator('main tbody tr').filter({ hasText: snoozed })).toContainText('Snoozed until')

		await authenticatedPage.goto(`${MY_REMINDERS}?action=Snoozed`)
		const rows = authenticatedPage.locator('main tbody tr')
		await expect(rows).toHaveCount(1)
		await expect(rows.first()).toContainText(snoozed)
		await expect(authenticatedPage.locator('main .v-chip').filter({ hasText: 'My action: Snoozed' })).toBeVisible()
		await expect(authenticatedPage.getByRole('status').filter({ hasText: /results? found/ })).toHaveText('1 result found')

		await authenticatedPage.getByRole('button', { name: /^Remove filter/ }).click()
		await expect(rows).toHaveCount(TITLES.length)
		expect(new URL(authenticatedPage.url()).searchParams.get('action')).toBeFalsy()
	})

	test('?action=Dismissed matches the dismissed row and not the snoozed one', async ({ authenticatedPage }) => {
		const dismissed = TITLES[0]
		const snoozed = TITLES[1]
		await authenticatedPage.getByRole('button', { name: `Dismiss delivery of reminder ${dismissed}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Dismiss reminder' }).getByRole('button', { name: 'Dismiss delivery' }).click()
		await expect(authenticatedPage.locator('main tbody tr').filter({ hasText: dismissed })).toContainText('Dismissed')
		await authenticatedPage.getByRole('button', { name: `Snooze reminder ${snoozed}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' }).getByRole('button', { name: 'Snooze' }).click()
		await expect(authenticatedPage.locator('main tbody tr').filter({ hasText: snoozed })).toContainText('Snoozed until')

		await authenticatedPage.goto(`${MY_REMINDERS}?action=Dismissed`)

		const rows = authenticatedPage.locator('main tbody tr')
		await expect(rows).toHaveCount(1)
		await expect(rows.first()).toContainText(dismissed)
	})

	test('the Filter dialog offers My action, and choosing Snoozed narrows the list', async ({ authenticatedPage }) => {
		const snoozed = TITLES[1]
		await authenticatedPage.getByRole('button', { name: `Snooze reminder ${snoozed}`, exact: true }).click()
		await authenticatedPage.getByRole('dialog', { name: 'Snooze reminder' }).getByRole('button', { name: 'Snooze' }).click()
		await expect(authenticatedPage.locator('main tbody tr').filter({ hasText: snoozed })).toContainText('Snoozed until')

		await authenticatedPage.getByRole('button', { name: 'Filter' }).click()
		const dialog = authenticatedPage.getByRole('dialog', { name: 'Filter' })
		// A VSelect is opened through its wrapper, not by role (a `data-no-activator` div eats the click).
		await dialog.locator('.v-field').filter({ hasText: 'My action' }).click()
		await authenticatedPage.getByRole('option', { name: 'Snoozed' }).click()
		await dialog.getByRole('button', { name: /^(Confirm|Apply)/ }).click()

		await expect(authenticatedPage).toHaveURL(/action=Snoozed/)
		await expect(authenticatedPage.locator('main tbody tr')).toHaveCount(1)
	})
})
