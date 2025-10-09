// composables/useCurrentTimeIndicator.ts
import {computed} from 'vue'
import {useCurrentTime} from '@/composables/general/useCurrentTime'
import {useDayPlannerStore} from '@/stores/dayPlannerStore.ts'
import {useMoment} from '@/scripts/momentHelper.ts';

export function useCurrentTimeIndicator() {
	const {formatToTime24H} = useMoment()
	const {currentTime} = useCurrentTime()
	const store = useDayPlannerStore()

	const isVisible = computed(() => {
		return currentTime.value >= store.viewStartDate && currentTime.value < store.viewEndDate
	})

	const gridRowStyle = computed(() => {
		if (!isVisible.value) return {}

		const slotIndex = store.timeToSlotIndex(formatToTime24H(currentTime.value))

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