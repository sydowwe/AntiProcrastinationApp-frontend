<template>
<VAlert
	class="myAlert"
	icon="circle-exclamation"
	iconSize="24px"
	v-if="comparison"
	:type="alertType"
	variant="tonal"
	density="compact"
	style="max-width: fit-content"
>
	<div class="d-flex align-center ga-1">
		<span class="text-high-emphasis font-weight-medium">
			Period total:
		</span>
		<span>{{ formatDuration(comparison.currentPeriodTotalSeconds) }}</span>
		<span class="ml-2 text-medium-emphasis">vs previous:</span>
		<span class="mr-2">{{ formatDuration(comparison.previousPeriodTotalSeconds) }}</span>
		<VChip
			v-if="comparison.percentChange !== null"
			size="small"
			:color="chipColor"
			variant="flat"
		>
			{{ changeText }}
		</VChip>
	</div>
</VAlert>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {HistoryPeriodComparison} from '@/dtos/response/historyDashboard/HistoryPeriodComparison.ts'
import {formatDuration} from '@/utils/formatDuration.ts'

const props = defineProps<{
	comparison: HistoryPeriodComparison | null
}>()

const alertType = computed(() => {
	if (!props.comparison?.percentChange) return 'info'
	return props.comparison.percentChange > 0 ? 'success' : 'warning'
})

const chipColor = computed(() => {
	if (!props.comparison?.percentChange) return 'grey'
	return props.comparison.percentChange > 0 ? 'success' : 'error'
})

const changeText = computed(() => {
	if (!props.comparison?.percentChange) return '0%'
	const sign = props.comparison.percentChange > 0 ? '+' : ''
	return `${sign}${props.comparison.percentChange}%`
})
</script>

<style scoped>
.myAlert:deep(.v-alert__prepend) {
	margin-inline-end: 8px !important;
}
</style>