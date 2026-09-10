import { expect, test } from '../fixtures/auth'

// Phase 3's X2 cross-cutting check (see prompts/view-docs/README.md): sign in as the primary seeded
// account, dismiss something backed by `useUserScopedStorage`, then sign in as the secondary account and
// confirm it did not follow. `secondaryPage` is its own browser context (see fixtures/auth.ts), so this is
// a real two-account check, not two tabs sharing storage.
//
// `DismissibleMappingHint.vue` (src/core/activityTracking/component/settings/DismissibleMappingHint.vue)
// was picked as the exercise: it is the simplest `readUserScoped`/`writeUserScoped` consumer in the app —
// one boolean, one storage key, no other state to race against — and is reachable without any seed data of
// its own. Confirmed in the browser via `playwright-cli` before writing this: dismissing it and reloading
// keeps it dismissed for the same account.

const DESKTOP_MAPPINGS_URL = '/activity-tracking/desktop/settings/mappings'
const HINT_TEXT = /Use the filter fields to define a matching pattern/

test.describe('Per-account isolation (X2)', () => {
	test('dismissing the desktop-mappings hint as one account does not dismiss it for another', async ({
		authenticatedPage,
		secondaryPage,
	}) => {
		await authenticatedPage.goto(DESKTOP_MAPPINGS_URL)
		await expect(authenticatedPage.getByText(HINT_TEXT)).toBeVisible()
		await authenticatedPage.getByRole('button', { name: 'Close' }).click()
		await expect(authenticatedPage.getByText(HINT_TEXT)).not.toBeVisible()

		// Reload confirms it's actually persisted (localStorage), not just removed from the DOM for
		// this render.
		await authenticatedPage.reload()
		await expect(authenticatedPage.getByText(HINT_TEXT)).not.toBeVisible()

		// The isolation check itself: a different account, in its own browser context, sees the hint
		// fresh — the primary account's dismissal must not have followed via a shared (non-scoped) key.
		await secondaryPage.goto(DESKTOP_MAPPINGS_URL)
		await expect(secondaryPage.getByText(HINT_TEXT)).toBeVisible()
	})
})
