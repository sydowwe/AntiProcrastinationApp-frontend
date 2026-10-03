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
// Row action buttons all share one accessible name (findings A1), so rows are addressed through
// `getByRole('row', { name: /Reminder #…/ })` — that scoping is the finding's argument, not a style choice.

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
		// The chip's remove button is named just "Close" (A3), so assert on the chip's text instead.
		await expect(adminPage.locator('main .v-chip').filter({ hasText: /^Paused$/ }).first()).toBeVisible()
		await adminPage.reload()
		await expect(adminPage).toHaveURL(/status=Paused/)
		await expect(resultCount(adminPage)).toHaveText(/results? found/)
	})

	test('ticking a row shows the bulk bar, and Unselect hides it', async ({ adminPage, seed }) => {
		// Row checkboxes have no accessible name (A2); scoped through the row instead.
		await adminPage
			.getByRole('row', { name: new RegExp(`Reminder #${seed.reminders.callTheDentist}`) })
			.getByRole('checkbox')
			.click()
		const bar = adminPage.getByRole('group', { name: 'Actions for the selected reminders' })
		await expect(bar.getByRole('button', { name: 'Pause 1 reminder' })).toBeVisible()
		await bar.getByRole('button', { name: 'Unselect' }).click()
		await expect(bar).toBeHidden()
	})

	// B1 — the grid response carries intervalPreset/cron, but the DTO drops them.
	test.fixme('the recurring-interval row states its interval', async () => {})

	// B2 — "Due …" renders nextOccurrenceAt (the lead-time nudge), not dueAt.
	test.fixme('a one-shot row\'s "Due" matches the detail page\'s Due at', async () => {})

	// A1 — every row's action buttons share one name built from `kind`.
	test.fixme('each row action has a distinct accessible name', async () => {})

	// A2 — the select column's checkboxes are unnamed (BasicTable, framework-wide).
	test.fixme('row checkboxes are named after their row', async () => {})

	// A3 — FilterPanel chip remove buttons are all named "Close".
	test.fixme('a filter chip\'s remove button names the filter it removes', async () => {})

	// P1 — BasicTable pushes an ownerModule tie-breaker the default sort does not declare.
	test.fixme('a fresh load shows no sort rank on a column the user never sorted', async () => {})
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

	// X1 — the page's flex column shrinks every card below its content; values are clipped at 1440×900.
	test.fixme('no detail card is clipped at 1440×900', async () => {})

	// B3 — the view prepends a register crumb the host's nav already supplies.
	test.fixme('the breadcrumb names the register exactly once', async () => {})

	// P2 — the 404 is stated by the page and again by the interceptor's snackbar.
	test.fixme('a not-found id shows no error snackbar', async () => {})

	// P3 — the h1 is the kind, identical for every seeded reminder.
	test.fixme('two different reminders have different headings', async () => {})

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

	// B2 — same "Due = nextOccurrenceAt" stand-in as the register.
	test.fixme('a one-shot row\'s "Due" is its dueAt', async () => {})

	// B4 — the "to" bound is sent as the start of the named day, excluding it.
	test.fixme('"Next occurrence to" includes reminders on the chosen day', async () => {})

	// A1 — "Show dispatch history of reminder PersonalReminder" on every row.
	test.fixme('each row\'s history button has a distinct accessible name', async () => {})

	// A4 — the open menu joins the button's name; items are listitems.
	test.fixme('Export formats are menu items reachable by role', async () => {})

	// P4 — a reminder whose only offset is 0 still gets "With lead time".
	test.fixme('"With lead time" appears only for negative offsets', async () => {})

	// P5 — no link from a row to its detail.
	test.fixme('a row links to its reminder detail', async () => {})
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

	// B4 — `?to=` excludes the day it names (the two 25.09 dispatches drop out of `to=2026-09-25`).
	test.fixme('"Dispatched to" includes dispatches on the chosen day', async () => {})

	// B5 — `reminderDashboard.skipReason.QuietHours` renders raw.
	test.fixme('no raw i18n key renders in the Outcome column', async () => {})

	// B6 — the read-only notice is crushed to 16 px by the flex column.
	test.fixme('the read-only notice is fully visible above the table', async () => {})

	// P6 — an empty, unnamed trailing column.
	test.fixme('the ledger has no empty trailing column', async () => {})

	// P7 — "Corrects #23501" names a dispatch id no column shows.
	test.fixme('a correction identifies the record it corrects', async () => {})
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

// `YYYY-MM-DD` of seedDateUtc + offset. Not `seedDateParam`: that returns the planner's `DD-MM-YYYY`,
// while the reminders filter codec reads ISO dates.
function isoSeedDate(seedDateUtc: string, dayOffset: number): string {
	const date = new Date(`${seedDateUtc}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + dayOffset)
	return date.toISOString().slice(0, 10)
}
