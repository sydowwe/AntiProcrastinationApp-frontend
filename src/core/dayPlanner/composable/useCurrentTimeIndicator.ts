// composables/useCurrentTimeIndicator.ts
import { computed } from 'vue'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
import type { IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'

export function useCurrentTimeIndicator<
	TTask extends IBasePlannerTask<TTaskRequest>,
	TTaskRequest extends IBasePlannerTaskRequest,
	TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>,
>(store: TStore) {
	const { currentTime } = useCurrentTime()

	const isVisible = computed(() => {
		// Only show in normal day planner (with viewedDate), not in template planner
		const hasViewedDate = 'viewedDate' in store
		if (!hasViewedDate) return false

		// Get viewedDate and ensure it's a Date object (it might be string from persistence)
		const viewedDateValue = (store as any).viewedDate
		const viewedDate = viewedDateValue instanceof Date ? viewedDateValue : new Date(viewedDateValue)

		// `viewedDate` is a calendar day, so it is read with its browser-local fields; the right-hand
		// side asks what day it is *now*, which is a question about the user's timezone.
		if (formatDateForApi(viewedDate) !== isoDateInUserZone()) return false

		// Check if current time is within the view range (handle midnight wrap)
		const currentTimeObj = timeInUserZone(currentTime.value)
		const currentMinutes = currentTimeObj.getInMinutes
		const startMinutes = store.viewStartTime.getInMinutes
		const endMinutes = store.viewEndTime.getInMinutes

		// If end < start, view wraps around midnight
		const withinRange =
			endMinutes >= startMinutes
				? currentMinutes >= startMinutes && currentMinutes <= endMinutes
				: currentMinutes >= startMinutes || currentMinutes <= endMinutes

		return withinRange
	})

	const gridRowStyle = computed(() => {
		if (!isVisible.value) return {}

		const slotIndex = store.timeToSlotIndex(timeInUserZone(currentTime.value))

		const gridRow = slotIndex + 1
		return {
			gridRow: `${gridRow} / ${gridRow}`,
		}
	})

	// Same zone as the line's position, or the label would name an hour the line is not drawn at.
	const formattedTime = computed(() => timeInUserZone(currentTime.value).getString())

	return {
		formattedTime,
		isVisible,
		gridRowStyle,
	}
}
