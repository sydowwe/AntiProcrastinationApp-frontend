import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/auth'

// Draft from the unit-18 inventory pass (docs/views/notifications/). Structural assertions only;
// every value/rule claim is a `test.fixme` naming its finding id in docs/views/notifications/findings.md.
//
// Framework unit: every view here is src/_common/modules/notifications/.
//
// Read-only by construction. Nothing below marks, un-marks, dismisses or toggles a preference —
// dismiss dialogs are opened and cancelled, and the spec asserts no DELETE left the page.

/**
 * The "Unread" toggle's accessible name is "Unread Badge" (A1): the inline VBadge carries Vuetify's
 * `aria-label="Badge"`, and `name: 'Unread'` also matches every row's "Mark as unread". Reach it by
 * its value attribute until A1 is fixed — this fallback is the argument for fixing the name.
 */
function unreadToggle(page: Page) {
	return page.locator('main button[value="unread"]')
}

async function openInbox(page: Page, query = '') {
	await page.goto(`/notifikacie${query}`)
	// Wait on the list, not the heading: the heading paints before the hub handshake resolves, and
	// until it does the card shows the first-run empty state (B1). "That's everything" only renders
	// once rows are on screen and the last page is short, which the seed guarantees.
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
		await expect(page.getByText('None of the loaded notifications match this filter.', { exact: false })).toBeVisible({
			timeout: 15_000,
		})
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

	test.fixme('B1: with the hub negotiate failing, the list still loads over REST (never "No notifications yet")', async () => {
		// route **/hubs/notifications/negotiate* → 503, reload; today no GET /notification/mine is ever sent.
	})
	test.fixme('B2: day headers older than yesterday are formatted in the account locale (EN: "September 28, 2026")', async () => {
		// formatLocalized pins dayjs to 'sk'.
	})
	test.fixme('A1: the Unread toggle is named with its count, not "Badge"', async () => {})
	test.fixme('A2: closing the dismiss confirmation returns focus to the trash button', async () => {
		// activeElement is <body> after both Cancel and Escape.
	})
	test.fixme('A3: each row read-toggle names its notification ("Mark as read <title>")', async () => {})
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

	test.fixme('B3: the Reminder types card lists the available kinds (at least PersonalReminder) with no prior write', async () => {})
	test.fixme('A4: card text and icons on the secondary background meet contrast', async () => {})
	test.fixme('A5: every delivery-matrix checkbox has an accessible name (row + column)', async () => {
		// Today the only generated locator is an id: locator('#input-v-22').
	})
	test.fixme('P5: no developer "Test" row in the delivery matrix', async () => {})
})
