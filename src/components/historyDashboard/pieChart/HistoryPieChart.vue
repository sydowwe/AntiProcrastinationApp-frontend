<template>
<VChart
	:option="chartOption"
	class="chart"
	@click="handleChartClick"
/>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import VChart from 'vue-echarts'
import {use} from 'echarts/core'
import {CanvasRenderer} from 'echarts/renderers'
import {PieChart} from 'echarts/charts'
import {LegendComponent, TooltipComponent} from 'echarts/components'
import type {EChartsOption} from 'echarts'
import type {HistoryPieChartItem} from '@/dtos/response/historyDashboard/HistoryPieChartItem.ts'
import {getDomainColor} from '@/utils/domainColor.ts'
import {formatDuration} from '@/utils/formatDuration.ts'

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

const props = defineProps<{
	items: HistoryPieChartItem[]
	selectedGroup: string | null
}>()

const emit = defineEmits<{
	segmentClick: [name: string | null]
}>()

function resolveColor(name: string, color: string | null): string {
	return color ?? getDomainColor(name)
}

const chartOption = computed<EChartsOption>(() => {
	const data = props.items.map(item => ({
		name: item.name,
		value: item.totalSeconds,
		itemStyle: {
			color: resolveColor(item.name, item.color),
		},
		selected: props.selectedGroup === item.name,
	}))

	return {
		tooltip: {
			trigger: 'item',
			formatter(params: any) {
				const name = params.name
				const seconds = params.value
				const percent = params.percent.toFixed(1)
				return `<strong>${name}</strong><br/>${formatDuration(seconds)} (${percent}%)`
			},
		},
		legend: {
			orient: 'vertical',
			left: 0,
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
				center: ['115%', '42%'],
				width: 470,
				height: 300,
				radius: ['35%', '75%'],
				avoidLabelOverlap: false,
				itemStyle: {
					borderColor: '#ccc',
					borderWidth: 2,
				},
				label: {show: false},
				emphasis: {
					scale: true,
					scaleSize: 10,
					label: {show: false},
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
	const clickedName = params.data.name as string
	if (props.selectedGroup === clickedName) {
		emit('segmentClick', null)
	} else {
		emit('segmentClick', clickedName)
	}
}
</script>

<style scoped>
.chart {
	height: 250px;
}
</style>
