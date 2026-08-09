import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Local-only streak of days where the whole plan was ticked off.
 *
 * There is no backend endpoint for this yet, so it lives in localStorage (not the app default
 * sessionStorage — a streak has to survive closing the browser). Replace with a server-side
 * counter once the API exposes one, otherwise the streak is per-device.
 */
export const usePlannerStreakStore = defineStore(
	'plannerStreak',
	() => {
		const current = ref(0)
		const best = ref(0)
		const lastCompletedDate = ref<string | null>(null)

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
			if (lastCompletedDate.value === isoDate) return
			current.value = lastCompletedDate.value === shiftDays(isoDate, -1) ? current.value + 1 : 1
			lastCompletedDate.value = isoDate
			if (current.value > best.value) best.value = current.value
		}

		/** Undo the roll when the day stops being complete again (a task gets un-ticked). */
		function revokeCompletedDay(date: Date = new Date()) {
			if (lastCompletedDate.value !== toIsoDate(date)) return
			current.value = Math.max(current.value - 1, 0)
			lastCompletedDate.value = current.value === 0 ? null : shiftDays(lastCompletedDate.value, -1)
		}

		return {
			current,
			best,
			lastCompletedDate,
			displayedStreak,
			completedToday,
			registerCompletedDay,
			revokeCompletedDay,
		}
	},
	{ persist: { storage: localStorage } },
)
