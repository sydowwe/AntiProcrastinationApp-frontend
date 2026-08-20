<template>
	<VAlert
		v-if="comparison"
		class="myAlert"
		icon="circle-exclamation"
		iconSize="24px"
		:type="alertType"
		variant="tonal"
		density="compact"
		style="max-width: fit-content"
	>
		<div class="d-flex align-center ga-1">
			<span class="text-high-emphasis font-weight-medium">Period total:</span>
			<span>{{ fromSeconds(comparison.currentPeriodTotalSeconds) }}</span>
			<span class="ml-2 text-medium-emphasis">vs previous:</span>
			<span class="mr-2">{{ fromSeconds(comparison.previousPeriodTotalSeconds) }}</span>
			<VChip
				v-if="comparison.percentChange !== null"
				size="small"
				:color="chipColor"
				variant="flat"
			>
				{{ changeText }}
			</VChip>
			<span
				v-else
				class="text-caption text-disabled"
			>
				no baseline
			</span>
		</div>
	</VAlert>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { HistoryPeriodComparison } from '@/core/historyDashboard/dto/response/HistoryPeriodComparison.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'

	const props = defineProps<{
		comparison: HistoryPeriodComparison | null
	}>()

	// B2: `percentChange` is genuinely nullable — null means the previous period total was 0, i.e. there
	// is no baseline to compare against. That is a different fact from "changed by 0%", so it must not
	// collapse into one: the falsy checks these three used to make read a real 0% as "no data" and,
	// worse, rendered a missing baseline as a neutral 0% badge.
	const percentChange = computed(() => props.comparison?.percentChange ?? null)

	const alertType = computed(() => {
		if (percentChange.value === null || percentChange.value === 0) return 'info'
		return percentChange.value > 0 ? 'success' : 'warning'
	})

	const chipColor = computed(() => {
		if (percentChange.value === null || percentChange.value === 0) return 'grey'
		return percentChange.value > 0 ? 'success' : 'error'
	})

	const changeText = computed(() => {
		if (percentChange.value === null) return ''
		const sign = percentChange.value > 0 ? '+' : ''
		return `${sign}${percentChange.value}%`
	})
</script>

<style scoped>
	.myAlert:deep(.v-alert__prepend) {
		margin-inline-end: 8px !important;
	}
</style>
