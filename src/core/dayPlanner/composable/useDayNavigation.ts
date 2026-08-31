import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import router from '@/router.ts'
import { formatDateForApi, isSameDay, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
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

	function navigateToDate(date: Date | null) {
		store.viewedDate = date ?? new Date()
		router.replace({ params: { date: usStringToUrlString(formatDateForApi(store.viewedDate)) } })
	}

	function navigateDate(delta: number) {
		const date = new Date(store.viewedDate)
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

	watch(
		() => store.viewedDate,
		async () => {
			showFullScreenLoading()
			store.resetStore()
			const dateStr = usStringToUrlString(formatDateForApi(new Date(store.viewedDate)))
			const newCalendar = await fetchCalendarByDate(dateStr)
			calendar.value = newCalendar
			store.viewStartTime = newCalendar.wakeUpTime
			store.viewEndTime = newCalendar.bedTime
			await loadTasks()
			loadCompleteResolve?.()
			loadCompleteResolve = null
			hideFullScreenLoading()
		},
		{ deep: true },
	)

	return { navigateDate, navigateToDate, handleUndo }
}
