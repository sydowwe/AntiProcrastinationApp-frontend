import { ref } from 'vue'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { readUserScoped, userScopedKey, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

/** `{ [itemId]: 'YYYY-MM-DD' }` under the user-scoped key — the day each item's offer was put away. */
const STORAGE_NAME = 'dismissedPlanHelp'

/**
 * How long an offer stays away once dismissed or acted on. A week: long enough not to nag, short enough that
 * an item still stuck afterwards is offered help again, rather than never.
 */
const QUIET_DAYS = 7

const MS_PER_DAY = 86_400_000

type DismissedOn = Record<string, string>

// Shared by every list row and the home widget, so dismissing on one surface hides the offer on the other.
// Loaded lazily and per account: a module-scope read would run before the user store is hydrated.
const dismissed = ref<DismissedOn>({})
let loadedForKey: string | null = null

function daysBetween(fromIsoDate: string, toIsoDate: string): number {
	return Math.round((Date.parse(toIsoDate) - Date.parse(fromIsoDate)) / MS_PER_DAY)
}

function ensureLoaded() {
	const key = userScopedKey(STORAGE_NAME)
	if (loadedForKey === key) return
	loadedForKey = key
	try {
		const parsed = JSON.parse(readUserScoped(STORAGE_NAME) ?? '{}')
		dismissed.value = parsed && typeof parsed === 'object' ? (parsed as DismissedOn) : {}
	} catch {
		dismissed.value = {}
	}
}

/**
 * FO3: puts a stuck item's offer away for a week, on this device. The server cannot record it without a
 * migration, and the offer is a suggestion rather than a setting, so device-local is enough. Per account,
 * through `useUserScopedStorage`, like every other per-user `localStorage` key.
 */
export function usePlanHelpDismissal() {
	ensureLoaded()

	function isPlanHelpDismissed(itemId: number): boolean {
		const on = dismissed.value[itemId]
		return on !== undefined && daysBetween(on, isoDateInUserZone()) < QUIET_DAYS
	}

	function dismissPlanHelp(itemId: number) {
		const today = isoDateInUserZone()
		// Expired entries are pruned on every write, so the key does not grow with every item ever offered.
		const next: DismissedOn = Object.fromEntries(
			Object.entries(dismissed.value).filter(([, on]) => daysBetween(on, today) < QUIET_DAYS),
		)
		next[itemId] = today
		dismissed.value = next
		writeUserScoped(STORAGE_NAME, JSON.stringify(next))
	}

	return { isPlanHelpDismissed, dismissPlanHelp }
}
