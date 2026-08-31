<template>
	<VRow v-if="direction === 'row'">
		<VCol
			cols="12"
			lg="6"
			class="pr-lg-8 pb-3"
		>
			<HistorySummaryCards
				:data="summaryCardsData"
				:groupBy
				:selectedGroup
				:selectedBaseline
				:topN
				:loading="summaryLoading"
				:periodLabel
				@update:selectedBaseline="emit('update:selectedBaseline', $event)"
				@update:topN="emit('update:topN', $event)"
				@groupClick="emit('groupClick', $event)"
			/>
		</VCol>
		<VCol
			cols="12"
			lg="6"
			class="pb-3"
		>
			<HistoryPieChartSection
				v-model:selectedGroup="selectedGroup"
				:data="pieChartData"
				:loading="pieLoading"
				:periodLabel
			/>
		</VCol>
	</VRow>
	<template v-else>
		<HistoryPieChartSection
			v-model:selectedGroup="selectedGroup"
			:data="pieChartData"
			:loading="pieLoading"
			:periodLabel
		/>
		<HistorySummaryCards
			:data="summaryCardsData"
			:groupBy
			:selectedGroup
			:selectedBaseline
			:topN
			:loading="summaryLoading"
			:periodLabel
			@update:selectedBaseline="emit('update:selectedBaseline', $event)"
			@update:topN="emit('update:topN', $event)"
			@groupClick="emit('groupClick', $event)"
		/>
	</template>
</template>

<script setup lang="ts">
	import type { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
	import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
	import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
	import type { HistorySummaryCardsResponse } from '@/core/historyDashboard/dto/response/HistorySummaryCardsResponse.ts'
	import type { HistoryGroupKey } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'
	import HistorySummaryCards from '@/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue'
	import HistoryPieChartSection from '@/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue'

	defineProps<{
		/** `row` places the two panels side by side in a `VRow` (stacked-bars layout); `column` renders
		 * them bare, for a parent that already supplies its own flex column (timeline layout). */
		direction: 'row' | 'column'
		summaryCardsData: HistorySummaryCardsResponse | null
		pieChartData: HistoryPieChartResponse | null
		groupBy: HistoryGroupBy
		selectedBaseline: BaselineType
		topN: number
		summaryLoading?: boolean
		pieLoading?: boolean
		/** Formatted date/range the empty states should name — see H7. */
		periodLabel?: string
	}>()

	const emit = defineEmits<{
		'update:selectedBaseline': [value: BaselineType]
		'update:topN': [value: number]
		groupClick: [group: HistoryGroupKey]
	}>()

	const selectedGroup = defineModel<HistoryGroupKey | null>('selectedGroup', { default: null })
</script>
