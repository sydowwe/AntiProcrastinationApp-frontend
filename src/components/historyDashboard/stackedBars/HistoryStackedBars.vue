<template>
<VCard class="pa-4 h-100 d-flex flex-column">
	<template v-if="loading">
		<VSkeletonLoader type="image" height="300"/>
	</template>
	<template v-else-if="!data || data.windows.length === 0">
		<div class="d-flex flex-column align-center justify-center pa-8">
			<VIcon icon="fas fa-chart-bar" size="64" class="text-disabled mb-4"/>
			<p class="text-body-1 text-medium-emphasis">No data for this period</p>
		</div>
	</template>
	<template v-else>
		<VChart ref="chartRef" :option="chartOption" class="chart flex-fill" autoresize/>
	</template>
</VCard>
</template>

<script setup lang="ts">
import {computed, ref, useTemplateRef, onMounted, onBeforeUnmount} from 'vue'
import VChart from 'vue-echarts'
import {use} from 'echarts/core'
import {CanvasRenderer} from 'echarts/renderers'
import {BarChart} from 'echarts/charts'
import {GridComponent, LegendComponent, TooltipComponent} from 'echarts/components'
import type {EChartsOption} from 'echarts'
import type {HistoryStackedBarsResponse, HistoryGranularity} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import {getDomainColor} from '@/utils/domainColor.ts'
import {formatDuration} from '@/utils/formatDuration.ts'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps<{
	data: HistoryStackedBarsResponse | null
	loading?: boolean
}>()

const chartRef = useTemplateRef<InstanceType<typeof VChart>>('chartRef')
const chartHeight = ref(300)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
	resizeObserver = new ResizeObserver(entries => {
		for (const entry of entries) {
			chartHeight.value = entry.contentRect.height
		}
	})
	if (chartRef.value?.$el) {
		resizeObserver.observe(chartRef.value.$el)
	}
})

onBeforeUnmount(() => {
	resizeObserver?.disconnect()
})

const ySplitNumber = computed(() => Math.max(2, Math.floor(chartHeight.value / 60)))

function formatWindowLabel(windowStart: string, granularity: HistoryGranularity): string {
	const date = new Date(windowStart)
	switch (granularity) {
		case 'HOURLY':
			return `${date.getHours()}:00`
		case 'DAILY':
			return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
		case 'WEEKLY': {
			const weekStart = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
			return `W ${weekStart}`
		}
	}
}

function resolveColor(name: string, color: string | null): string {
	return color ?? getDomainColor(name)
}

const chartOption = computed<EChartsOption>(() => {
	if (!props.data || props.data.windows.length === 0) return {}

	const {granularity, windows} = props.data

	const categories = windows.map(w => formatWindowLabel(w.windowStart, granularity))

	// Collect all unique group names across windows
	const groupNames = new Set<string>()
	for (const w of windows) {
		for (const item of w.items) {
			groupNames.add(item.name)
		}
	}

	// Build a color map from the first occurrence
	const colorMap = new Map<string, string>()
	for (const w of windows) {
		for (const item of w.items) {
			if (!colorMap.has(item.name)) {
				colorMap.set(item.name, resolveColor(item.name, item.color))
			}
		}
	}

	// Build series data for each group
	const series = Array.from(groupNames).map(name => ({
		name,
		type: 'bar' as const,
		stack: 'total',
		emphasis: {focus: 'series' as const},
		itemStyle: {
			color: colorMap.get(name),
		},
		data: windows.map(w => {
			const item = w.items.find(i => i.name === name)
			return item ? Math.round(item.totalSeconds / 60) : 0
		}),
	}))

	return {
		tooltip: {
			trigger: 'axis',
			axisPointer: {type: 'shadow'},
			formatter(params: any) {
				if (!Array.isArray(params)) return ''
				const header = params[0]?.axisValueLabel ?? ''
				const lines = params
					.filter((p: any) => p.value > 0)
					.map((p: any) => {
						const marker = p.marker
						const seconds = p.value * 60
						return `${marker} ${p.seriesName}: ${formatDuration(seconds)}`
					})
				return `<strong>${header}</strong><br/>${lines.join('<br/>')}`
			},
		},
		legend: {
			type: 'scroll',
			bottom: 0,
			textStyle: {color: '#ccc'},
		},
		grid: {
			left: 50,
			right: 20,
			top: 20,
			bottom: 50,
			containLabel: false,
		},
		xAxis: {
			type: 'category',
			data: categories,
			axisLabel: {
				rotate: granularity === 'DAILY' && windows.length > 14 ? 45 : 0,
				color: '#ccc',
			},
		},
		yAxis: {
			type: 'value',
			name: 'Minutes',
			nameTextStyle: {color: '#ccc'},
			splitNumber: ySplitNumber.value,
			axisLabel: {color: '#ccc'},
		},
		series,
	}
})
</script>

<style scoped>
.chart {
	min-height: 200px;
	width: 100%;
}
</style>
