<template>
<div class="pie-chart-container">
	<VChart
		ref="chartRef"
		:option="chartOption"
		class="chart"
		@click="handleChartClick"
	/>

	<VRadioGroup
		v-model="viewMode"
		inline
		density="comfortable"
		hideDetails
		color="primaryOutline"
	>
		<VRadio label="Total" value="total"/>
		<VRadio label="Active" value="active"/>
		<VRadio label="Background" value="background"/>
	</VRadioGroup>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import VChart from 'vue-echarts'
import {use} from 'echarts/core'
import {CanvasRenderer} from 'echarts/renderers'
import {PieChart} from 'echarts/charts'
import {LegendComponent, TooltipComponent} from 'echarts/components'
import type {EChartsOption} from 'echarts'
import {formatDuration} from '@/utils/formatDuration'
import {PieSegment} from './PieSegment.ts'

// Register ECharts components
use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

const props = defineProps<{
	domains: PieSegment[]
	selectedDomain: string | null
}>()

const viewMode = defineModel<'total' | 'active' | 'background'>({required: true})

const emit = defineEmits<{
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
				return `<strong>${domain}</strong><br/>${formatDuration(seconds)} (${percent}%)`
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
				color: '#fff',  // Bright white text for accessibility
				fontSize: 12,
				fontWeight: 300
			},
			formatter: (name: string) => {
				const segment = props.domains.find(d =>
					(d.domain === '_other' ? 'Other' : d.domain) === name
				)
				if (segment) {
					const displayName = name.length > 25 ? name.substring(0, 25) + '...' : name
					return `${displayName} (${segment.percent.toFixed(1)}%)`
				}
				return name.length > 25 ? name.substring(0, 25) + '...' : name
			},
		},
		series: [
			{
				type: 'pie',
				center: ['115%', '42%'],  // Move pie to the right to make room for legend
				width: 300,
				height: 300,
				radius: ['35%', '75%'],
				avoidLabelOverlap: false,
				itemStyle: {
					borderColor: '#ccc',
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
	height: 250px;
	width: 470px; /* Increased width to accommodate legend on left */
}
</style>
