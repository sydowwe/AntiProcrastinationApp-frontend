import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

// Draft from the unit-18 inventory pass (docs/views/_submodule/notifications/). Structural assertions only;
// every value/rule claim is a `test.fixme` naming its finding id in docs/views/_submodule/notifications/findings.md.
//
// Framework unit: every view here is src/_common/modules/notifications/.
//
// Read-only by construction. Nothing below marks, un-marks, dismisses or toggles a preference —
// dismiss dialogs are opened and cancelled, and the spec asserts no DELETE left the page.

/**
 * The "Unread" toggle is named "Unread, <count>" while it carries a badge and plain "Unread" without
 * one (A1, fixed in S12). Scoped to the read-status group, because the rows' "Mark notification …
 * as unread" buttons start differently and do not match `^Unread`.
 */
function unreadToggle(page: Page) {
	return page.getByRole('group', { name: 'Filter by read status' }).getByRole('button', { name: /^Unread/ })
}

async function openInbox(page: Page, query = '') {
	await page.goto(`/notifikacie${query}`)
	// Wait on the list, not the heading: the rows arrive after the first paint. "That's everything"
	// only renders once rows are on screen and the last page is short, which the seed guarantees.
	await page.getByText("That's everything").waitFor({ timeout: 15_000 })
}

test.describe('Notification inbox (/notifikacie)', () => {
	test('renders the heading, the filter toolbar and the list', async ({ authenticatedPage: page }) => {
		await openInbox(page)
		await expect(page.getByRole('heading', { name: 'Notifications', level: 2 })).toBeVisible()
		const readGroup = page.getByRole('group', { name: 'Filter by read status' })
		await expect(readGroup.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
		await expect(unreadToggle(page)).toHaveAttribute('aria-pressed', 'false')
		await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible()
		await expect(page.getByRole('group', { name: 'Today' }).or(page.getByRole('group', { name: 'Yesterday' })).first()).toBeVisible()
	})

	test('the Unread filter is written to the URL and survives a reload', async ({ authenticatedPage: page }) => {
		await openInbox(page)
		await unreadToggle(page).click()
		await expect(page).toHaveURL(/[?&]read=unread\b/)
		await page.reload()
		await expect(unreadToggle(page)).toHaveAttribute('aria-pressed', 'true')
		await expect(page).toHaveURL(/[?&]read=unread\b/)
	})

	test('an unknown type shows the filtered-empty state, and Clear filter restores the bare URL', async ({
		authenticatedPage: page,
	}) => {
		await page.goto('/notifikacie?type=Bogus')
		// The seed's history fits on one page, so there is nothing older to load and the copy must not
		// suggest it (P2, fixed in S16).
		await expect(page.getByText('None of your notifications match this filter.')).toBeVisible({ timeout: 15_000 })
		await expect(page.getByRole('button', { name: 'Load older' })).toHaveCount(0)
		// Two "Clear filter" buttons exist in this state (toolbar + empty state); either clears both filters.
		await page.getByRole('main').getByRole('button', { name: 'Clear filter' }).last().click()
		await expect(page).toHaveURL(/\/notifikacie$/)
		await expect(page.getByText("That's everything")).toBeVisible()
	})

	test('Select mode puts a named checkbox on every row and shows the selection bar once one is ticked', async ({
		authenticatedPage: page,
	}) => {
		await openInbox(page)
		await page.getByRole('button', { name: 'Select', exact: true }).click()
		const boxes = page.getByRole('checkbox', { name: /^Select notification / })
		await expect(boxes.first()).toBeVisible()
		await boxes.first().click()
		await expect(page.getByText('Selected: 1')).toBeVisible()
		await page.getByRole('button', { name: 'Cancel selection' }).click()
		await expect(page.getByText(/^Selected: /)).toHaveCount(0)
	})

	test('the dismiss confirmation opens, and Escape closes it without deleting anything', async ({
		authenticatedPage: page,
	}) => {
		const deletes: string[] = []
		page.on('request', r => {
			if (r.method() === 'DELETE' || r.url().includes('/notification/delete-batch')) deletes.push(r.url())
		})
		await openInbox(page)
		await page.getByRole('button', { name: /^Dismiss notification / }).first().click()
		const dialog = page.getByRole('dialog', { name: 'Dismiss notification?' })
		await expect(dialog).toBeVisible()
		await expect(dialog).toContainText('cannot be undone')
		await page.keyboard.press('Escape')
		await expect(dialog).toHaveCount(0)
		expect(deletes).toEqual([])
	})

	test('B1: with the hub negotiate failing, the list still loads over REST', async ({ authenticatedPage: page }) => {
		await page.route('**/hubs/notifications/negotiate*', route => route.fulfill({ status: 503, body: '' }))
		await openInbox(page)
		await expect(page.getByText('No notifications yet', { exact: false })).toHaveCount(0)
		// Never connected, so the state is "Connecting...", not a reconnect.
		await expect(page.getByText('Connecting...')).toBeVisible()
	})
	test.fixme('B2: day headers older than yesterday are formatted in the account locale (EN: "September 28, 2026")', async () => {
		// formatLocalized pins dayjs to 'sk'.
	})
	test('A1: the Unread toggle is named with its count, not "Badge"', async ({ authenticatedPage: page }) => {
		await openInbox(page)
		await expect(unreadToggle(page)).toHaveCount(1)
		await expect(unreadToggle(page)).toHaveAccessibleName(/^Unread, \d+$/)
		await expect(page.getByRole('status', { name: 'Badge' })).toHaveCount(0)
	})
	test.fixme('A2: closing the dismiss confirmation returns focus to the trash button', async () => {
		// activeElement is <body> after both Cancel and Escape.
	})
	test('A3: each row read-toggle names its notification', async ({ authenticatedPage: page }) => {
		await openInbox(page)
		const main = page.getByRole('main')
		await expect(main.getByRole('button', { name: /^Mark notification .+ as (un)?read$/ }).first()).toBeVisible()
		// The bare name is left only on the bulk bar, which is not on screen outside select mode.
		await expect(main.getByRole('button', { name: 'Mark as read', exact: true })).toHaveCount(0)
		await expect(main.getByRole('button', { name: 'Mark as unread', exact: true })).toHaveCount(0)
	})
	test.fixme('P1: the breadcrumb reads "Home › Notifications", not "Home"', async () => {})
	test.fixme('the unread chip equals seed.counts.unreadNotifications on a fresh seed', async () => {
		// Semantic: the live account also collects TimerBoundary / RoutinePeriodEnded rows raised by
		// other specs and by the backend's own routine job, so the figure is only stable right after a seed.
	})
	test.fixme('U1: Load older pages by beforeId and filtering never refetches page 1', async () => {
		// Needs a fixture account with ≥ 21 notifications.
	})
})

test.describe('Reminder preferences (/nastavenia/pripomienky)', () => {
	test('renders the three cards and the delivery matrix headers', async ({ authenticatedPage: page }) => {
		await page.goto('/nastavenia/pripomienky')
		await expect(page.getByRole('heading', { name: 'Notifications & reminders', level: 2 })).toBeVisible()
		await expect(page.getByText('Quiet hours', { exact: true })).toBeVisible({ timeout: 15_000 })
		await expect(page.getByText('Reminder types', { exact: true })).toBeVisible()
		await expect(page.getByText('Notification delivery', { exact: true })).toBeVisible()
		await expect(page.getByRole('checkbox', { name: 'Enable quiet hours' })).toBeVisible()
		for (const header of ['Alert type', 'In-app', 'Push', 'E-mail']) {
			await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
		}
	})

	test('each card has its own error state with a retry when its read fails', async ({ authenticatedPage: page }) => {
		for (const path of ['**/api/reminder-preference', '**/api/notification-quiet-hours', '**/api/notification-preference/mine']) {
			await page.route(path, route => route.fulfill({ status: 500, body: '{}' }))
		}
		await page.goto('/nastavenia/pripomienky')
		await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(3, { timeout: 15_000 })
		await expect(page.getByText("Failed to load quiet hours. This doesn't mean you have none set.")).toBeVisible()
	})

	// B3 / §S2 — the card listed only stored rows, and nothing wrote one, so it was permanently the empty state.
	// The server now declares the kinds it can raise, so a fresh account is offered the switch, on, with no write.
	// Read-only; the toggling itself is `reminder-kind-catalog.spec.ts`.
	test('B3: the Reminder types card offers the personal reminder kind, switched on, with no prior write', async ({
		authenticatedPage: page,
	}) => {
		await page.goto('/nastavenia/pripomienky')
		const card = page.locator('.v-card').filter({ has: page.getByText('Reminder types', { exact: true }) })
		await expect(card.getByRole('checkbox', { name: 'Personal reminders' })).toBeChecked({ timeout: 15_000 })
		await expect(card.getByText('Delivered')).toBeVisible()
		await expect(card.getByText('There are no reminder types to set up yet.')).toHaveCount(0)
	})
	test.fixme('A4: card text and icons meet contrast', async () => {
		// Fixed in S14 (surface cards; measured by hand, see _fix-queue-log.md). No computed-colour assertion written yet.
	})
	test('A5: every delivery-matrix checkbox has an accessible name (row + column)', async ({ authenticatedPage: page }) => {
		await page.goto('/nastavenia/pripomienky')
		await expect(
			page.getByRole('checkbox', { name: /Personal reminder.*In-app|In-app.*Personal reminder/ }),
		).toHaveCount(1, { timeout: 15_000 })
	})
	test.fixme('P5: no developer "Test" row in the delivery matrix', async () => {})
})
