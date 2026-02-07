<template>
	<div class="pie-chart-container">
		<VChart
			ref="chartRef"
			:option="chartOption"
			:autoresize="true"
			class="chart"
			@click="handleChartClick"
		/>

		<VRadioGroup
			:modelValue="viewMode"
			inline
			hideDetails
			class="mt-4 d-flex justify-center"
			@update:modelValue="emit('update:viewMode', $event)"
		>
			<VRadio label="Total" value="total" />
			<VRadio label="Active" value="active" />
			<VRadio label="Background" value="background" />
		</VRadioGroup>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'
import { formatDuration } from '@/utils/formatDuration'

// Register ECharts components
use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

interface PieSegment {
	domain: string
	seconds: number
	percent: number
	color: string
}

const props = defineProps<{
	domains: PieSegment[]
	viewMode: 'total' | 'active' | 'background'
	selectedDomain: string | null
}>()

const emit = defineEmits<{
	(e: 'update:viewMode', value: 'total' | 'active' | 'background'): void
	(e: 'segmentClick', domain: string | null): void
}>()

const chartOption = computed<EChartsOption>(() => {
	const data = props.domains.map((segment) => ({
		name: segment.domain === '_other' ? 'Other' : segment.domain,
		value: segment.seconds,
		itemStyle: {
			color: segment.color,
		},
		// Select state
		selected: props.selectedDomain === segment.domain,
	}))

	return {
		tooltip: {
			trigger: 'item',
			formatter: (params: any) => {
				const domain = params.name
				const seconds = params.value
				const percent = params.percent.toFixed(1)
				return `<strong>${domain}</strong><br/>
						${formatDuration(seconds)} (${percent}%)`
			},
		},
		series: [
			{
				type: 'pie',
				radius: ['40%', '70%'],
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 4,
					borderColor: '#fff',
					borderWidth: 2,
				},
				label: {
					show: false,
				},
				emphasis: {
					scale: true,
					scaleSize: 10,
					label: {
						show: false,
					},
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

	const clickedDomain = props.domains.find(
		(d) => (d.domain === '_other' ? 'Other' : d.domain) === params.data.name
	)

	if (!clickedDomain) return

	// Ignore clicks on "Other" segment
	if (clickedDomain.domain === '_other') {
		return
	}

	// Toggle selection
	if (props.selectedDomain === clickedDomain.domain) {
		emit('segmentClick', null)
	} else {
		emit('segmentClick', clickedDomain.domain)
	}
}
</script>

<style scoped>
.pie-chart-container {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.chart {
	width: 100%;
	height: 400px;
}
</style>
