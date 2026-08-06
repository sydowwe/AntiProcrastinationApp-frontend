// composables/useCurrentTimeIndicator.ts
import { computed } from 'vue'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { formatToTime24H } from '@/_common/utils/DateTimeHelper.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
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

		// Check if the viewed date is today
		const today = new Date()
		const isToday = viewedDate.toDateString() === today.toDateString()
		if (!isToday) return false

		// Check if current time is within the view range (handle midnight wrap)
		const currentTimeObj = Time.fromDate(currentTime.value)
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

		const slotIndex = store.timeToSlotIndex(new Time(currentTime.value.getHours(), currentTime.value.getMinutes()))

		const gridRow = slotIndex + 1
		return {
			gridRow: `${gridRow} / ${gridRow}`,
		}
	})

	const formattedTime = computed(() => formatToTime24H(currentTime.value))

	return {
		formattedTime,
		isVisible,
		gridRowStyle,
	}
}
