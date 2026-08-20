<template>
	<VChart
		autoresize
		:option="chartOption"
		class="chart"
		@click="handleChartClick"
	/>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import VChart from 'vue-echarts'
	import { use } from 'echarts/core'
	import { CanvasRenderer } from 'echarts/renderers'
	import { PieChart } from 'echarts/charts'
	import { LegendComponent, TooltipComponent } from 'echarts/components'
	import type { EChartsOption } from 'echarts'
	import type { HistoryPieChartItem } from '@/core/historyDashboard/dto/response/HistoryPieChartItem.ts'
	import {
		historyGroupKey,
		isSameHistoryGroup,
		type HistoryGroupKey,
	} from '@/core/historyDashboard/dto/HistoryGroupKey.ts'
	import { resolveHistoryGroupColor } from '@/core/historyDashboard/dto/historyGroupColor.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'

	const props = defineProps<{
		items: HistoryPieChartItem[]
		selectedGroup: HistoryGroupKey | null
		isNarrow?: boolean
	}>()

	const emit = defineEmits<{
		segmentClick: [group: HistoryGroupKey | null]
	}>()

	use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

	const chartOption = computed<EChartsOption>(() => {
		const data = props.items.map(item => ({
			name: item.name,
			value: item.totalSeconds,
			itemStyle: {
				color: resolveHistoryGroupColor(item),
			},
			selected: isSameHistoryGroup(props.selectedGroup, historyGroupKey(item)),
		}))

		return {
			tooltip: {
				trigger: 'item',
				formatter(params: any) {
					const name = params.name
					const seconds = params.value
					const percent = params.percent.toFixed(1)
					return `<strong>${name}</strong><br/>${fromSeconds(seconds)} (${percent}%)`
				},
			},
			legend: {
				orient: 'vertical',
				left: 0,
				right: '42%',
				top: 'center',
				borderColor: '#666',
				borderRadius: 5,
				borderWidth: 1,
				padding: 8,
				textStyle: {
					color: '#fff',
					fontSize: 12,
					fontWeight: 300,
				},
				formatter(name: string) {
					const item = props.items.find(i => i.name === name)
					const displayName = name.length > 25 ? name.substring(0, 25) + '...' : name
					if (item) {
						const total = props.items.reduce((sum, i) => sum + i.totalSeconds, 0)
						const pct = total > 0 ? ((item.totalSeconds / total) * 100).toFixed(1) : '0.0'
						return `${displayName} (${pct}%)`
					}
					return displayName
				},
			},
			series: [
				{
					type: 'pie',
					center: ['74%', '50%'],
					radius: ['35%', '75%'],
					avoidLabelOverlap: false,
					itemStyle: {
						borderColor: '#ccc',
						borderWidth: 2,
					},
					label: { show: false },
					emphasis: {
						scale: true,
						scaleSize: 10,
						label: { show: false },
					},
					select: {
						itemStyle: {
							shadowBlur: 10,
							shadowColor: 'rgba(0, 0, 0, 0.3)',
						},
					},
					selectedMode: 'single',
					data,
				},
			],
		}
	})

	function handleChartClick(params: any) {
		if (!params.data) return
		// Resolve through the index, not `params.data.name` — the echarts datum only carries the display
		// name, and the id is what identifies the group.
		const item = props.items[params.dataIndex]
		if (!item) return
		const clicked = historyGroupKey(item)
		emit('segmentClick', isSameHistoryGroup(props.selectedGroup, clicked) ? null : clicked)
	}
</script>

<style scoped>
	.chart {
		height: 250px;
	}
</style>
