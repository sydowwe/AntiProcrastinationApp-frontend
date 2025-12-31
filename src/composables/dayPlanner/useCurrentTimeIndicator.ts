// composables/useCurrentTimeIndicator.ts
import {computed} from 'vue'
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts'
import {useMoment} from '@/scripts/momentHelper.ts';
import {Time} from '@/utils/Time.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';

export function useCurrentTimeIndicator<TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>>(store: TStore) {
	const {formatToTime24H} = useMoment()
	const {currentTime} = useCurrentTime()

	const isVisible = computed(() => {
		return currentTime.value.toDateString() === currentTime.value.toDateString()
			&& Time.fromDate(currentTime.value) >= store.viewStartTime && Time.fromDate(currentTime.value) <= store.viewEndTime
	})

	const gridRowStyle = computed(() => {
		if (!isVisible.value) return {}

		const slotIndex = store.timeToSlotIndex(new Time(currentTime.value.getHours(), currentTime.value.getMinutes()))

		const gridRow = slotIndex + 1
		return {
			gridRow: `${gridRow} / ${gridRow}`
		}
	})

	const formattedTime = computed(() => formatToTime24H(currentTime.value))

	return {
		formattedTime,
		isVisible,
		gridRowStyle,
	}
}