import { computed } from 'vue'
import { Time } from '@/_common/dto/dto/Time.ts'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'

/**
 * The wall clock this app runs on: the user's configured timezone, not the browser's.
 *
 * The two are the same for most people — `User.timezone` is seeded from
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` at sign-in — but it is an editable setting
 * (user settings → appearance) and it travels with the account, not the device. The server already
 * decides the day boundary in it (`PlannerStreakResponse.Today` / `.Timezone`, see
 * `prompts/home/backend/B1-planner-streak.md`); before this module the client disagreed, deriving
 * both the date and the current minute from whatever zone the browser happened to be in.
 *
 * The failure that motivated it is not the date drifting on its own — it is the date and the clock
 * drifting *apart*. Fixing only the date would have been worse than fixing neither: home would fetch
 * one day's plan and lay it against another day's clock, so "what should I be doing now" would be
 * answered off a plan that is not today's. Everything that reads a wall-clock field therefore comes
 * through here.
 *
 * Instants are not affected and need no conversion: a `Date` is a moment in time, and
 * `useCurrentTime`'s clock is as correct in one zone as another. Only the *reading* of a wall-clock
 * field off that instant — which hour is it, which calendar day is it — is zone-dependent.
 */

/** Resolved once: the browser's own zone, used only when the configured one is unusable. */
const BROWSER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

// `Intl.DateTimeFormat` construction is expensive relative to how often the home page reads the
// clock (every minute, from several computeds), and the zone almost never changes.
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
	let formatter = formatters.get(timeZone)
	if (formatter === undefined) {
		formatter = new Intl.DateTimeFormat('en-US', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			// Not `hour12: false`, which some engines render as 24:xx at midnight.
			hourCycle: 'h23',
		})
		formatters.set(timeZone, formatter)
	}
	return formatter
}

/** An unknown or malformed IANA name throws on construction; a wrong clock is worse than a fallback. */
function isSupportedTimeZone(timeZone: string): boolean {
	if (!timeZone) return false
	try {
		new Intl.DateTimeFormat('en-US', { timeZone })
		return true
	} catch {
		return false
	}
}

/**
 * The zone every wall-clock read on the home page resolves against. Reactive: changing it in user
 * settings re-derives the date signal and every countdown without a reload.
 */
export const userTimeZone = computed<string>(() => {
	const configured = useUserStore().currentUser.timezone
	return isSupportedTimeZone(configured) ? configured : BROWSER_TIME_ZONE
})

interface ZonedParts {
	year: number
	month: number
	day: number
	hour: number
	minute: number
}

function partsInUserZone(instant: Date): ZonedParts {
	const parts = formatterFor(userTimeZone.value).formatToParts(instant)
	function read(type: Intl.DateTimeFormatPartTypes): number {
		return Number(parts.find(part => part.type === type)?.value ?? 0)
	}
	return { year: read('year'), month: read('month'), day: read('day'), hour: read('hour'), minute: read('minute') }
}

/** Local `YYYY-MM-DD` in the user's zone — the same day the server means by "today". */
export function isoDateInUserZone(instant: Date = new Date()): string {
	const { year, month, day } = partsInUserZone(instant)
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Minutes since midnight in the user's zone. This is what task start/end times are compared against. */
export function minutesOfDayInUserZone(instant: Date = new Date()): number {
	const { hour, minute } = partsInUserZone(instant)
	return hour * 60 + minute
}

/**
 * The current wall-clock time in the user's zone.
 *
 * Replaces `Time.fromDate`, which reads `getHours()`/`getMinutes()` — browser-zone fields. Those are
 * written to the server as a task's actual start and end time, so in a mismatched zone the app was
 * recording work at hours it did not happen.
 */
export function timeInUserZone(instant: Date = new Date()): Time {
	const { hour, minute } = partsInUserZone(instant)
	return new Time(hour, minute)
}
