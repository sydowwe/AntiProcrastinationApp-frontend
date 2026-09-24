import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import router from '@/router.ts'
import {
	formatDateForApi,
	isSameDay,
	parseDateFromApi,
	urlStringToUTCDate,
	usStringToUrlString,
} from '@/_common/utils/DateTimeHelper.ts'
import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import type { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
import type { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'

/**
 * Date navigation for the normal planner: arrow-key/button day stepping, the route-param sync that
 * goes with it, and the reload the store's `viewedDate` watch triggers on every step. `handleUndo`
 * lives here too because undoing onto a different day has to wait for that same reload — the
 * `loadCompleteResolve` handshake is how it knows the new day's tasks are in before replaying the undo.
 */
export function useDayNavigation(
	store: ReturnType<typeof useDayPlannerStore>,
	settingsStore: ReturnType<typeof useDayPlannerSettingsStore>,
	calendar: Ref<Calendar | undefined>,
	loadTasks: () => Promise<void>,
	fetchCalendarByDate: (date: string) => Promise<Calendar>,
) {
	const undoStack = useUndoStack()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()

	let loadCompleteResolve: (() => void) | null = null

	/**
	 * The `dd-MM-yyyy` of a day the URL points at but which has no calendar row (F43). Calendars are
	 * provisioned only by a write, so any unwritten day outside the seeded years is a 404 — not a
	 * malformed link. While set, the view shows a not-found state instead of the header, and day
	 * stepping counts from this day rather than from the last one that loaded.
	 */
	const missingDate = ref<string | null>(null)

	function navigateToDate(date: Date | null) {
		store.viewedDate = date ?? new Date()
		router.replace({ params: { date: usStringToUrlString(formatDateForApi(store.viewedDate)) } })
	}

	function navigateDate(delta: number) {
		const date = new Date(missingDate.value ? urlStringToUTCDate(missingDate.value) : store.viewedDate)
		date.setDate(date.getDate() + delta)
		navigateToDate(date)
	}

	async function handleUndo() {
		const nextDate = undoStack.nextUndoDate
		if (nextDate && !isSameDay(nextDate.value, store.viewedDate)) {
			const loadDone = new Promise<void>(resolve => {
				loadCompleteResolve = resolve
			})
			navigateToDate(nextDate.value)
			await loadDone
		}
		await undoStack.undo()
	}

	function handleArrowKey(e: KeyboardEvent) {
		if (!settingsStore.arrowKeyNavEnabled) return
		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
		if (e.key === 'ArrowLeft') navigateDate(-1)
		else if (e.key === 'ArrowRight') navigateDate(1)
	}

	onMounted(() => document.addEventListener('keydown', handleArrowKey))
	onUnmounted(() => document.removeEventListener('keydown', handleArrowKey))

	// Arrow keys pressed in quick succession start a load per day, overlapping. Only the newest may act
	// on its outcome — write the calendar, resolve the undo handshake, hide the overlay. An older one
	// settling first used to uncover the grid mid-load; and since the calendar query aborts its own
	// previous call, the older one always *fails* — which the catch below read as a missing day, and
	// `recoverFromMissingDay` navigated back to the last day that loaded.
	let latestLoadToken = 0

	watch(
		() => store.viewedDate,
		async () => {
			const token = ++latestLoadToken
			// The calendar, then its tasks — the overlay must cover both (FW26).
			showFullScreenLoading({ manualHide: true })
			try {
				store.resetStore()
				const dateStr = usStringToUrlString(formatDateForApi(new Date(store.viewedDate)))
				let newCalendar: Calendar
				try {
					newCalendar = await fetchCalendarByDate(dateStr)
				} catch {
					if (token !== latestLoadToken) return
					// Not `_silent`: the interceptor's toast is the first signal. This only decides what
					// stays on screen.
					recoverFromMissingDay(dateStr)
					return
				}
				if (token !== latestLoadToken) return
				missingDate.value = null
				calendar.value = newCalendar
				store.viewStartTime = newCalendar.wakeUpTime
				store.viewEndTime = newCalendar.bedTime
				await loadTasks()
			} finally {
				if (token === latestLoadToken) {
					loadCompleteResolve?.()
					loadCompleteResolve = null
					// Not left to the error snackbar, which happens to hide it today.
					hideFullScreenLoading()
				}
			}
		},
		{ deep: true },
	)

	/**
	 * The URL has already moved (`navigateToDate`) when the fetch fails, and `calendar` still holds
	 * the previous day — which used to leave that day's header under the new day's URL. Step back to
	 * the day that loaded, so header, grid and URL agree again; with nothing to step back to (the
	 * page was opened on a missing day), show the not-found state for this one.
	 */
	function recoverFromMissingDay(dateStr: string) {
		const previous = calendar.value && parseDateFromApi(calendar.value.date.slice(0, 10))
		if (previous && !isSameDay(previous, store.viewedDate)) {
			navigateToDate(previous)
			return
		}
		calendar.value = undefined
		missingDate.value = dateStr
	}

	return { navigateDate, navigateToDate, handleUndo, missingDate }
}
