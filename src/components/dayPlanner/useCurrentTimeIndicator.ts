// composables/useCurrentTimeIndicator.ts
import {computed} from 'vue'
import {useCurrentTime} from '@/composables/general/useCurrentTime'
import {useDayPlanner} from './useDayPlanner.ts'
import {useMoment} from '@/scripts/momentHelper.ts';

export function useCurrentTimeIndicator() {
	const {formatToTime24H} = useMoment()
	const {currentTime} = useCurrentTime()
	const {viewStartDate, viewEndDate, timeToSlotIndex} = useDayPlanner()

	const isVisible = computed(() => {
		return currentTime.value >= viewStartDate.value && currentTime.value < viewEndDate.value
	})

	const gridRowStyle = computed(() => {
		if (!isVisible.value) return {}

		const slotIndex = timeToSlotIndex.value(formatToTime24H(currentTime.value))

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