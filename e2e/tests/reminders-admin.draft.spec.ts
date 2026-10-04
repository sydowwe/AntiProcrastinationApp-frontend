import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

// Structural-tier facts only, captured live via playwright-cli during the reminders-admin inventory pass
// (docs/views/_submodule/reminders-admin/). Semantic-tier claims and every logged bug/unverified finding are
// `test.fixme` stubs, per prompts/view-docs/PROMPT-TEMPLATE.md's "structural vs semantic" split.
//
// All five routes are Admin-only on the server (403 for the primary user), so every test drives
// `adminPage`. Read-only: nothing here pauses, resumes, cancels or bulk-acts on a reminder.
//
// Two id spaces for the same six rows: `seed.reminderDefinitions` is what these routes take;
// `seed.reminders` is the portal id the register's Subject cell *shows*.
//
// Rows are addressed by their subject ("Reminder #23001"), which since S22 is also what names every row
// action and select checkbox — so a role locator can now reach a single row's control directly.

const REGISTER = '/pripomienky/register'
const UPCOMING = '/pripomienky/nadchadzajuce'
const HISTORY = '/pripomienky/historia'
const OVERVIEW = '/pripomienky/prehlad'

function resultCount(page: Page) {
	// `d-sr-only` live region; filtered by text because the top bar also carries `status` elements.
	return page.getByRole('status').filter({ hasText: /results? found/ })
}

test.describe(`Reminder register (${REGISTER})`, () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto(REGISTER)
		await adminPage.getByRole('heading', { name: 'Reminder register', level: 1 }).waitFor()
		await resultCount(adminPage).filter({ hasText: /^[1-9]/ }).waitFor()
	})

	test('renders the table with its column headers', async ({ adminPage }) => {
		// "Owner module" and "Next occurrence" carry a sort-priority badge in their name ("Owner module 2") — P1.
		for (const name of [/^Owner module/, 'Subject', 'Kind', 'Schedule type', 'Status', /^Next occurrence/, 'Actions']) {
			await expect(adminPage.getByRole('columnheader', { name })).toBeVisible()
		}
	})

	test('lists every seeded definition', async ({ adminPage, seed }) => {
		await expect(resultCount(adminPage)).toHaveText(`${seed.counts.reminderDefinitions} results found`)
	})

	test('a bare URL is rewritten to the default page/sort state', async ({ adminPage }) => {
		await expect(adminPage).toHaveURL(/page=1&perPage=25&sortBy=nextOccurrenceAt:asc/)
	})

	test('clicking a sortable header writes the sort to the URL', async ({ adminPage }) => {
		await adminPage.getByRole('columnheader', { name: 'Status' }).click()
		await expect(adminPage).toHaveURL(/sortBy=status:asc/)
	})

	test('the Subject link shows the portal id and opens the definition', async ({ adminPage, seed }) => {
		await adminPage.getByRole('link', { name: `Reminder #${seed.reminders.callTheDentist}` }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${REGISTER}/${seed.reminderDefinitions.callTheDentist}$`))
	})

	test('the Filter dialog opens with its fields and Close closes it', async ({ adminPage }) => {
		await adminPage.getByRole('button', { name: 'Filter' }).click()
		const dialog = adminPage.getByRole('dialog', { name: 'Filter' })
		for (const name of ['Owner module', 'Subject type', 'Kind', 'Next occurrence from', 'Next occurrence to']) {
			await expect(dialog.getByRole('textbox', { name })).toBeVisible()
		}
		await dialog.getByRole('button', { name: 'Close' }).click()
		await expect(dialog).toBeHidden()
	})

	test('a status filter in the URL becomes a chip and survives a reload', async ({ adminPage }) => {
		await adminPage.goto(`${REGISTER}?status=Paused`)
		// Assert on the chip's text; its remove button is covered by the A3 test below.
		await expect(adminPage.locator('main .v-chip').filter({ hasText: /^Paused$/ }).first()).toBeVisible()
		await adminPage.reload()
		await expect(adminPage).toHaveURL(/status=Paused/)
		await expect(resultCount(adminPage)).toHaveText(/results? found/)
	})

	test('ticking a row shows the bulk bar, and Unselect hides it', async ({ adminPage, seed }) => {
		await adminPage.getByRole('checkbox', { name: `Select Reminder #${seed.reminders.callTheDentist}` }).click()
		const bar = adminPage.getByRole('group', { name: 'Actions for the selected reminders' })
		await expect(bar.getByRole('button', { name: 'Pause 1 reminder' })).toBeVisible()
		await bar.getByRole('button', { name: 'Unselect' }).click()
		await expect(bar).toBeHidden()
	})

	// B1 (S19) — the DTO used to drop intervalPreset/cron, so this row read "—".
	test('the recurring-interval row states its interval', async ({ adminPage, seed }) => {
		await expect(dataRow(adminPage, seed.reminders.payRentRecurring)).toContainText('Monthly')
	})

	// B2 (S19) — "Due …" used to render nextOccurrenceAt, the lead-time nudge.
	test('a one-shot row\'s "Due" matches the detail page\'s Due at', async ({ adminPage, seed }) => {
		const dueAt = await detailDueAt(adminPage, seed.reminderDefinitions.callTheDentist)
		await adminPage.goto(REGISTER)
		await expect(dataRow(adminPage, seed.reminders.callTheDentist)).toContainText(`Due ${dueAt}`)
	})

	// A1 (S22) — names were built from `kind`, identical on every row.
	test('each row action has a distinct accessible name', async ({ adminPage, seed }) => {
		const names = await accessibleNames(adminPage.getByRole('button', { name: /^Pause reminder for / }))
		expect(names.length).toBeGreaterThan(1)
		expect(new Set(names).size).toBe(names.length)
		expect(names).toContain(`Pause reminder for Reminder #${seed.reminders.callTheDentist}`)
	})

	// A2 (S25) — the select column's checkboxes were unnamed (BasicTable, framework-wide).
	test('row checkboxes are named after their row', async ({ adminPage, seed }) => {
		await expect(adminPage.getByRole('checkbox', { name: 'Select all rows' })).toBeVisible()
		await expect(
			adminPage.getByRole('checkbox', { name: `Select Reminder #${seed.reminders.callTheDentist}`, exact: true }),
		).toHaveCount(1)
	})

	// A3 (S26) — FilterPanel chip remove buttons were all named "Close".
	test('a filter chip\'s remove button names the filter it removes', async ({ adminPage }) => {
		await adminPage.goto(`${REGISTER}?status=Paused`)
		await expect(adminPage.getByRole('button', { name: 'Remove filter: Paused' })).toBeVisible()
	})

	// P1 (fixed by S23) — the default sort now declares BasicTable's ownerModule tie-breaker, so a bare URL is not
	// rewritten on mount. The "Owner module 2" rank badge stays: it describes the declared sort (log, Contradiction 5).
	test.fixme('a bare URL stays bare — the default sort is not rewritten on mount', async () => {})
})

test.describe(`Reminder detail (${REGISTER}/:id)`, () => {
	test('renders its six sections for a real definition id', async ({ adminPage, seed }) => {
		await adminPage.goto(`${REGISTER}/${seed.reminderDefinitions.callTheDentist}`)
		for (const name of ['Reminder key', 'Lifecycle', 'Schedule', 'Upcoming occurrences', 'Recipients', 'Content']) {
			await expect(adminPage.getByRole('heading', { name, level: 2 })).toBeVisible()
		}
		await expect(adminPage.getByRole('button', { name: 'Pause' })).toBeVisible()
		await expect(adminPage.getByRole('button', { name: 'Cancel' })).toBeVisible()
	})

	test('a cancelled reminder offers no lifecycle actions', async ({ adminPage, seed }) => {
		await adminPage.goto(`${REGISTER}/${seed.reminderDefinitions.cancelled}`)
		await expect(adminPage.getByText('This reminder is cancelled and will never fire again.')).toBeVisible()
		await expect(adminPage.getByRole('button', { name: 'Pause' })).toHaveCount(0)
		await expect(adminPage.getByRole('button', { name: 'Resume' })).toHaveCount(0)
	})

	test('a paused reminder offers Resume and says what would apply', async ({ adminPage, seed }) => {
		await adminPage.goto(`${REGISTER}/${seed.reminderDefinitions.paused}`)
		await expect(adminPage.getByRole('button', { name: 'Resume' })).toBeVisible()
		await expect(adminPage.getByText(/This reminder is paused, so it will not fire for now/)).toBeVisible()
	})

	test('an unknown id renders the not-found card', async ({ adminPage }) => {
		await adminPage.goto(`${REGISTER}/999999`)
		await expect(adminPage.getByText('This reminder does not exist or has been removed.')).toBeVisible()
	})

	test('a portal id is not a definition id and renders not-found', async ({ adminPage, seed }) => {
		await adminPage.goto(`${REGISTER}/${seed.reminders.callTheDentist}`)
		await expect(adminPage.getByText('This reminder does not exist or has been removed.')).toBeVisible()
	})

	test('Back to list returns to the register', async ({ adminPage, seed }) => {
		await adminPage.goto(`${REGISTER}/${seed.reminderDefinitions.callTheDentist}`)
		await adminPage.getByRole('link', { name: 'Back to list' }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${REGISTER}(\\?|$)`))
	})

	// X1 — the page's flex column shrank every card below its content; values were clipped at 1440×900.
	// The recurring definition is the tallest page, so it is the one that overflows the viewport.
	test('no detail card is clipped at 1440×900', async ({ adminPage, seed }) => {
		await adminPage.goto(`${REGISTER}/${seed.reminderDefinitions.payRentRecurring}`)
		await adminPage.getByRole('heading', { name: 'Content', level: 2 }).waitFor()
		const clipped = await adminPage
			.locator('#main-content .v-card')
			.evaluateAll(cards => cards.filter(card => card.scrollHeight > card.clientHeight + 1).length)
		expect(clipped).toBe(0)
	})

	// B3 — the view prepends a register crumb the host's nav already supplies.
	test.fixme('the breadcrumb names the register exactly once', async () => {})

	// P2 — the 404 is stated by the page and again by the interceptor's snackbar.
	test.fixme('a not-found id shows no error snackbar', async () => {})

	// P3 (S22) — the h1 was the kind, identical for every seeded reminder.
	test('two different reminders have different headings', async ({ adminPage, seed }) => {
		for (const key of ['callTheDentist', 'fileTaxReturn'] as const) {
			await adminPage.goto(`${REGISTER}/${seed.reminderDefinitions[key]}`)
			await expect(adminPage.getByRole('heading', { level: 1 })).toHaveText(`Reminder #${seed.reminders[key]}`)
		}
	})

	// Semantic: the occurrence preview's instants and labels are server-computed business rules.
	test.fixme('the occurrence preview lists the nudge and the deadline for callTheDentist', async () => {})
})

test.describe(`Upcoming reminders (${UPCOMING})`, () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto(UPCOMING)
		await adminPage.getByRole('heading', { name: 'Upcoming reminders', level: 1 }).waitFor()
		await resultCount(adminPage).filter({ hasText: /^[1-9]/ }).waitFor()
	})

	test('renders the table with its column headers', async ({ adminPage }) => {
		for (const name of [/^Kind/, 'Owner module', 'Schedule type', 'Status', 'Recipients', /^Next occurrence/, 'Actions']) {
			await expect(adminPage.getByRole('columnheader', { name })).toBeVisible()
		}
	})

	test('lists every active reminder', async ({ adminPage, seed }) => {
		await expect(resultCount(adminPage)).toHaveText(`${seed.counts.upcomingReminders} results found`)
	})

	test('"Reminders overview" and "Dispatch history" navigate within the module', async ({ adminPage }) => {
		// Scoped to #main-content: the sidebar has its own "Dispatch history" link.
		const main = adminPage.locator('#main-content')
		await main.getByRole('link', { name: 'Reminders overview' }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${OVERVIEW}$`))
		await adminPage.goBack()
		await main.getByRole('link', { name: 'Dispatch history' }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${HISTORY}$`))
	})

	test('a row\'s history button deep-links the history to that definition', async ({ adminPage, seed }) => {
		await adminPage
			.getByRole('row', { name: new RegExp(`Reminder #${seed.reminders.callTheDentist}`) })
			.getByRole('button')
			.click()
		await expect(adminPage).toHaveURL(new RegExp(`${HISTORY}\\?reminderId=${seed.reminderDefinitions.callTheDentist}`))
		await expect(adminPage.getByText(`Reminder ID: #${seed.reminderDefinitions.callTheDentist}`)).toBeVisible()
	})

	test('Export opens its two formats', async ({ adminPage }) => {
		await adminPage.getByRole('button', { name: 'Export' }).click()
		// Items have no role of their own (A4) — text is the only locator that resolves.
		await expect(adminPage.getByText('Excel (.xlsx)')).toBeVisible()
		await expect(adminPage.getByText('CSV (.csv)')).toBeVisible()
	})

	test('a "to" date in the URL becomes a chip', async ({ adminPage, seed }) => {
		await adminPage.goto(`${UPCOMING}?to=${isoSeedDate(seed.seedDateUtc, 7)}`)
		await expect(adminPage.getByText(/^Next occurrence to: /)).toBeVisible()
	})

	// B2 (S19) — same "Due = nextOccurrenceAt" stand-in as the register had.
	test('a one-shot row\'s "Due" is its dueAt', async ({ adminPage, seed }) => {
		const dueAt = await detailDueAt(adminPage, seed.reminderDefinitions.callTheDentist)
		await adminPage.goto(UPCOMING)
		await expect(dataRow(adminPage, seed.reminders.callTheDentist)).toContainText(`Due ${dueAt}`)
	})

	// B4 (S20) — the "to" bound used to be sent as the start of the named day, excluding it.
	test('"Next occurrence to" includes reminders on the chosen day', async ({ adminPage, seed }) => {
		// The day is read off the row itself, so the test holds whatever the seed's clock-relative dates are.
		const nextCell = await dataRow(adminPage, seed.reminders.callTheDentist).getByRole('cell').nth(5).innerText()
		const [, dd, mm, yyyy] = /(\d{2})\.(\d{2})\.(\d{4})/.exec(nextCell)!
		await adminPage.goto(`${UPCOMING}?to=${yyyy}-${mm}-${dd}`)
		await expect(dataRow(adminPage, seed.reminders.callTheDentist)).toBeVisible()
		// P8 (S20): the chip echoes a day, not a midnight instant.
		await expect(adminPage.getByText(`Next occurrence to: ${dd}.${mm}.${yyyy}`, { exact: true })).toBeVisible()
	})

	// A1 (S22) — "Show dispatch history of reminder PersonalReminder" was on every row.
	test('each row\'s history button has a distinct accessible name', async ({ adminPage, seed }) => {
		const names = await accessibleNames(adminPage.getByRole('button', { name: /^Show dispatch history of reminder for / }))
		expect(names).toHaveLength(seed.counts.upcomingReminders)
		expect(new Set(names).size).toBe(names.length)
	})

	// A4 — the open menu joins the button's name; items are listitems.
	test.fixme('Export formats are menu items reachable by role', async () => {})

	// P4 (S19) — a reminder whose only offset is 0 (the deadline itself) used to get "With lead time".
	test('"With lead time" appears only for negative offsets', async ({ adminPage, seed }) => {
		await expect(dataRow(adminPage, seed.reminders.callTheDentist)).toContainText('With lead time')
		await expect(dataRow(adminPage, seed.reminders.fileTaxReturn)).not.toContainText('With lead time')
	})

	// P5 (S22) — there was no link from a row to its detail.
	test('a row links to its reminder detail', async ({ adminPage, seed }) => {
		await adminPage.getByRole('link', { name: `Reminder #${seed.reminders.callTheDentist}` }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${REGISTER}/${seed.reminderDefinitions.callTheDentist}$`))
	})
})

test.describe(`Dispatch history (${HISTORY})`, () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto(HISTORY)
		await adminPage.getByRole('heading', { name: 'Dispatch history', level: 1 }).waitFor()
		await resultCount(adminPage).filter({ hasText: /^[1-9]/ }).waitFor()
	})

	test('renders the ledger with its column headers', async ({ adminPage }) => {
		for (const name of [/^Dispatched/, 'Reminder ID', 'Outcome', 'Notification type', 'Recipients']) {
			await expect(adminPage.getByRole('columnheader', { name })).toBeVisible()
		}
	})

	test('lists every seeded dispatch', async ({ adminPage, seed }) => {
		await expect(resultCount(adminPage)).toHaveText(`${seed.counts.reminderDispatches} results found`)
	})

	test('a bare URL is not rewritten (the default sort is the first column)', async ({ adminPage }) => {
		await expect(adminPage).toHaveURL(new RegExp(`${HISTORY}$`))
	})

	test('a reminder id link opens that definition', async ({ adminPage, seed }) => {
		await adminPage.getByRole('link', { name: `#${seed.reminderDefinitions.cancelled}` }).first().click()
		await expect(adminPage).toHaveURL(new RegExp(`${REGISTER}/${seed.reminderDefinitions.cancelled}$`))
	})

	test('?reminderId= pre-filters and shows its chip', async ({ adminPage, seed }) => {
		await adminPage.goto(`${HISTORY}?reminderId=${seed.reminderDefinitions.cancelled}`)
		await expect(adminPage.getByText(`Reminder ID: #${seed.reminderDefinitions.cancelled}`)).toBeVisible()
	})

	test('a filter matching nothing renders the empty row', async ({ adminPage, seed }) => {
		await adminPage.goto(`${HISTORY}?reminderId=${seed.reminderDefinitions.callTheDentist}`)
		await expect(adminPage.getByRole('cell', { name: 'No data available' })).toBeVisible()
	})

	test('Back to upcoming navigates to the upcoming list', async ({ adminPage }) => {
		await adminPage.getByRole('link', { name: 'Back to upcoming' }).click()
		await expect(adminPage).toHaveURL(new RegExp(UPCOMING))
	})

	// B4 (S20) — `?to=` used to exclude the day it names.
	test('"Dispatched to" includes dispatches on the chosen day', async ({ adminPage }) => {
		const firstRow = adminPage.locator('main tbody tr').first()
		const dispatched = await firstRow.getByRole('cell').first().innerText()
		const [day, dd, mm, yyyy] = /(\d{2})\.(\d{2})\.(\d{4})/.exec(dispatched)!
		await adminPage.goto(`${HISTORY}?from=${yyyy}-${mm}-${dd}&to=${yyyy}-${mm}-${dd}`)
		await expect(adminPage.locator('main tbody tr').filter({ hasText: day }).first()).toBeVisible()
		await expect(adminPage.getByText(`Dispatched to: ${day}`, { exact: true })).toBeVisible()
	})

	// B5 (S21) — `reminderDashboard.skipReason.QuietHours` rendered raw.
	test('no raw i18n key renders in the Outcome column', async ({ adminPage }) => {
		await expect(adminPage.locator('main tbody').getByText('Quiet hours')).toBeVisible()
		await expect(adminPage.locator('main')).not.toContainText('reminderDashboard.')
	})

	// B6 — the read-only notice was crushed to 16 px by the flex column. VAlert's own `flex: 1 1 0%`
	// is why `flex-shrink-0` alone did not fix it.
	test('the read-only notice is fully visible above the table', async ({ adminPage }) => {
		const notice = adminPage.locator('#main-content .v-alert').first()
		await expect(notice).toBeVisible()
		const { clientHeight, scrollHeight } = await notice.evaluate(el => ({
			clientHeight: el.clientHeight,
			scrollHeight: el.scrollHeight,
		}))
		expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1)
	})

	// P6 (S24) — there was an empty, unnamed trailing column.
	test('the ledger has no empty trailing column', async ({ adminPage }) => {
		await expect(adminPage.locator('main thead th')).toHaveCount(5)
	})

	// P7 (S24) — "Corrects #23501" named a dispatch id no column shows. Both ends are now named by time.
	test('a correction identifies the record it corrects', async ({ adminPage }) => {
		const main = adminPage.locator('main')
		await expect(main.getByText(/^Corrects the \d{2}\.\d{2}\.\d{4} .+ record$/)).toBeVisible()
		await expect(main.getByText(/^Corrected by the \d{2}\.\d{2}\.\d{4} .+ record$/)).toBeVisible()
		await expect(main).not.toContainText(/Corrects #\d/)
	})
})

test.describe(`Reminders overview (${OVERVIEW})`, () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto(OVERVIEW)
		await adminPage.getByRole('heading', { name: 'Failures needing attention', level: 2 }).waitFor()
	})

	test('renders its sections', async ({ adminPage }) => {
		for (const name of [/^Dispatch outcomes over the last/, 'Upcoming by module', 'Upcoming by kind', 'Failures needing attention']) {
			await expect(adminPage.getByRole('heading', { name, level: 2 })).toBeVisible()
		}
		await expect(adminPage.getByRole('button', { name: 'Refresh' })).toBeVisible()
	})

	test('the paused and cancelled cards link to the filtered register', async ({ adminPage }) => {
		await expect(adminPage.getByRole('link', { name: /^Paused \d+/ })).toHaveAttribute('href', `${REGISTER}?status=Paused`)
		await expect(adminPage.getByRole('link', { name: /^Cancelled \d+/ })).toHaveAttribute('href', `${REGISTER}?status=Cancelled`)
	})

	test('the failure card links to the uncorrected failures', async ({ adminPage }) => {
		await adminPage.getByRole('link', { name: 'Show all uncorrected failures in the dispatch history' }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${HISTORY}\\?needsAttention=true`))
		await expect(adminPage.getByText('Uncorrected failures only')).toBeVisible()
	})

	test('a module rollup row links to the filtered upcoming list', async ({ adminPage }) => {
		await adminPage.getByRole('link', { name: /Show upcoming reminders for module Portal/ }).click()
		await expect(adminPage).toHaveURL(new RegExp(`${UPCOMING}\\?module=Portal`))
	})

	// Semantic: each drill-down lands on the number that was clicked (observed true for all eleven on 2026-10-01).
	test.fixme('every drill-down lands on the count it was clicked from', async () => {})

	// Semantic: the headline failure count equals seed.counts.reminderFailuresNeedingAttention.
	test.fixme('the failure count matches the seed', async () => {})

	// P2 — a failed refresh is stated on the page and again by a snackbar.
	test.fixme('a failed refresh shows no error snackbar', async () => {})

	// U1 — 5-minute poll, hidden-tab pause, ticking freshness label.
	test.fixme('the overview polls while visible and pauses while hidden', async () => {})

	// U2 — the failure card's cap and "N of M" line.
	test.fixme('the failure card caps its rows and states the true total', async () => {})
})

// The data row whose subject is the given portal id. Exact-number match, so #23001 cannot hit #230011.
function dataRow(page: Page, reminderId: number) {
	return page.getByRole('row', { name: new RegExp(`Reminder #${reminderId}(?!\\d)`) })
}

// The detail page's "Due at" value, as the lists format it — the oracle for the lists' "Due …" text.
async function detailDueAt(page: Page, definitionId: number): Promise<string> {
	await page.goto(`${REGISTER}/${definitionId}`)
	const value = page.getByText('Due at', { exact: true }).locator('xpath=following-sibling::*[1]')
	await expect(value).toHaveText(/\d{2}\.\d{2}\.\d{4}/)
	return (await value.innerText()).trim()
}

function accessibleNames(buttons: ReturnType<Page['getByRole']>): Promise<string[]> {
	return buttons.evaluateAll(els => els.map(el => el.getAttribute('aria-label') ?? ''))
}

// `YYYY-MM-DD` of seedDateUtc + offset. Not `seedDateParam`: that returns the planner's `DD-MM-YYYY`,
// while the reminders filter codec reads ISO dates.
function isoSeedDate(seedDateUtc: string, dayOffset: number): string {
	const date = new Date(`${seedDateUtc}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + dayOffset)
	return date.toISOString().slice(0, 10)
}
