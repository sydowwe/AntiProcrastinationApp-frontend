import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'

interface StreakRecord {
	current: number
	best: number
	lastCompletedDate: string | null
}

const EMPTY_RECORD: Readonly<StreakRecord> = Object.freeze({ current: 0, best: 0, lastCompletedDate: null })

/**
 * Local-only streak of days where the whole plan was ticked off.
 *
 * There is no backend endpoint for this yet, so it lives in localStorage (not the app default
 * sessionStorage — a streak has to survive closing the browser). Replace with a server-side
 * counter once the API exposes one, otherwise the streak is per-device.
 *
 * localStorage is per-device, and a device can be shared, so the records are keyed by user id:
 * without that, two people signing in to the same browser feed one counter and each of them sees a
 * streak the other earned. The key `0` is the signed-out placeholder id from `new User()`.
 *
 * Per-user is as far as the client can get. The number itself still cannot be trusted — it only
 * counts days this browser had the app open, and `revokeCompletedDay` cannot tell "yesterday was
 * also complete" from "the streak started today". See prompts/home/backend/B1-planner-streak.md.
 *
 * The persistence key is versioned because the persisted shape changed with the per-user split. The
 * pre-split `plannerStreak` entry is deliberately not migrated: it is a single unattributed count,
 * and handing it to whoever signs in first is the same cross-user leak this change exists to close.
 */
export const usePlannerStreakStore = defineStore(
	'plannerStreak',
	() => {
		const byUser = ref<Record<string, StreakRecord>>({})
		const userStore = useUserStore()

		const userKey = computed(() => String(userStore.currentUser.id))
		const record = computed<Readonly<StreakRecord>>(() => byUser.value[userKey.value] ?? EMPTY_RECORD)

		/** The current user's record, created on first write so reads never allocate a slot. */
		function mutableRecord(): StreakRecord {
			return (byUser.value[userKey.value] ??= { ...EMPTY_RECORD })
		}

		/** Local (not UTC) yyyy-MM-dd — toISOString would roll the date over in the evening. */
		function toIsoDate(date: Date): string {
			const month = `${date.getMonth() + 1}`.padStart(2, '0')
			const day = `${date.getDate()}`.padStart(2, '0')
			return `${date.getFullYear()}-${month}-${day}`
		}

		function shiftDays(isoDate: string, days: number): string {
			const date = new Date(`${isoDate}T00:00:00`)
			date.setDate(date.getDate() + days)
			return toIsoDate(date)
		}

		const current = computed(() => record.value.current)
		const best = computed(() => record.value.best)
		const lastCompletedDate = computed(() => record.value.lastCompletedDate)

		/** The streak only counts while it is still alive — finished today or yesterday. */
		const isAlive = computed(() => {
			if (lastCompletedDate.value === null) return false
			const today = toIsoDate(new Date())
			return lastCompletedDate.value === today || lastCompletedDate.value === shiftDays(today, -1)
		})
		const displayedStreak = computed(() => (isAlive.value ? current.value : 0))
		const completedToday = computed(() => lastCompletedDate.value === toIsoDate(new Date()))

		function registerCompletedDay(date: Date = new Date()) {
			const isoDate = toIsoDate(date)
			const target = mutableRecord()
			if (target.lastCompletedDate === isoDate) return
			target.current = target.lastCompletedDate === shiftDays(isoDate, -1) ? target.current + 1 : 1
			target.lastCompletedDate = isoDate
			if (target.current > target.best) target.best = target.current
		}

		/** Undo the roll when the day stops being complete again (a task gets un-ticked). */
		function revokeCompletedDay(date: Date = new Date()) {
			// Checked against the read-only view first so a no-op revoke does not allocate a slot.
			if (record.value.lastCompletedDate !== toIsoDate(date)) return
			const target = mutableRecord()
			target.current = Math.max(target.current - 1, 0)
			target.lastCompletedDate = target.current === 0 ? null : shiftDays(target.lastCompletedDate!, -1)
		}

		return {
			byUser,
			current,
			best,
			lastCompletedDate,
			displayedStreak,
			completedToday,
			registerCompletedDay,
			revokeCompletedDay,
		}
	},
	{ persist: { storage: localStorage, key: 'plannerStreak.byUser' } },
)
