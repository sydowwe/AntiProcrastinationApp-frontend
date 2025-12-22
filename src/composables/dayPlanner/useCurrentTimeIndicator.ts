// composables/useCurrentTimeIndicator.ts
import {computed} from 'vue'
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts'
import {useMoment} from '@/scripts/momentHelper.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {Time} from '@/utils/Time.ts';

export function useCurrentTimeIndicator() {
	const {formatToTime24H} = useMoment()
	const {currentTime} = useCurrentTime()
	const store = useDayPlannerStore()

	const isVisible = computed(() => {
		return currentTime.value >= store.viewStartDate && currentTime.value < store.viewEndDate
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