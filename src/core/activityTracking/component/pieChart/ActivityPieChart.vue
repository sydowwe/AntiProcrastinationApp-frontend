<template>
	<div class="pie-chart-container">
		<VChart
			:option="chartOption"
			class="chart"
			@click="handleChartClick"
		/>

		<VBtn
			v-if="showTail || foldedCount > 0"
			:prependIcon="showTail ? 'fas fa-compress' : 'fas fa-expand'"
			size="small"
			variant="text"
			@click="showTail = !showTail"
		>
			{{
				showTail
					? $t('activityTracking.pieChart.groupTail')
					: $t('activityTracking.pieChart.showTail', { count: foldedCount })
			}}
		</VBtn>

		<VRadioGroup
			v-if="showViewMode"
			v-model="viewMode"
			inline
			density="comfortable"
			hideDetails
			color="primaryOutline"
		>
			<VRadio
				:label="$t('activityTracking.viewMode.total')"
				value="total"
			/>
			<VRadio
				:label="$t('activityTracking.viewMode.active')"
				value="active"
			/>
			<VRadio
				:label="$t('activityTracking.viewMode.background')"
				value="background"
			/>
		</VRadioGroup>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useTheme } from 'vuetify'
	import VChart from 'vue-echarts'
	import { use } from 'echarts/core'
	import { CanvasRenderer } from 'echarts/renderers'
	import { PieChart } from 'echarts/charts'
	import { LegendComponent, TooltipComponent } from 'echarts/components'
	import type { EChartsOption } from 'echarts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { OTHER_DOMAIN, type PieSegment } from './PieSegment.ts'

	const {
		domains,
		selectedDomain,
		showViewMode = true,
		foldedCount = 0,
	} = defineProps<{
		domains: PieSegment[]
		selectedDomain: string | null
		// Off for a source with no Active/Background split (Android) — the radio would re-render the
		// same pie whichever metric is picked.
		showViewMode?: boolean
		/** How many rows the section folded into "Other" (`foldPieTail`) — offers to expand them. */
		foldedCount?: number
	}>()

	const emit = defineEmits<{
		(e: 'segmentClick', domain: string | null): void
	}>()

	const viewMode = defineModel<'total' | 'active' | 'background'>({ required: true })
	/** The tail is expanded: the section folds nothing, and the button offers to group it again. */
	const showTail = defineModel<boolean>('showTail', { default: false })

	const { t } = useI18n()
	const theme = useTheme()
	const onSurface = computed(() => theme.current.value.colors['on-surface'])

	// Register ECharts components
	use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

	const chartOption = computed<EChartsOption>(() => {
		const data = domains.map(segment => ({
			name: segment.domain === OTHER_DOMAIN ? t('activityTracking.common.other') : segment.domain,
			value: segment.seconds,
			itemStyle: {
				color: segment.color,
			},
			// Select state
			selected: selectedDomain === segment.domain,
		}))

		return {
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					const domain = params.name
					const seconds = params.value
					const percent = params.percent.toFixed(1)
					return `<strong>${domain}</strong><br/>${fromSeconds(seconds)} (${percent}%)`
				},
			},
			legend: {
				// Paged, because an expanded tail can hold more rows than the 250 px canvas fits.
				type: 'scroll',
				pageIconColor: onSurface.value,
				pageIconInactiveColor: '#888',
				pageTextStyle: { color: onSurface.value },
				orient: 'vertical',
				left: 0,
				top: 'center',
				borderColor: '#666',
				borderRadius: 5,
				borderWidth: 1,
				padding: 8,
				textStyle: {
					// From the theme — a fixed white was unreadable on the light theme's surface.
					color: onSurface.value,
					fontSize: 12,
					fontWeight: 300,
				},
				formatter: (name: string) => {
					const segment = domains.find(
						d => (d.domain === OTHER_DOMAIN ? t('activityTracking.common.other') : d.domain) === name,
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
					center: ['115%', '42%'], // Move pie to the right to make room for legend
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

		const clickedDomain = domains.find(
			d => (d.domain === OTHER_DOMAIN ? t('activityTracking.common.other') : d.domain) === params.data.name,
		)

		if (!clickedDomain) return

		// "Other" is not selectable — clicking it expands it into its members instead.
		if (clickedDomain.domain === OTHER_DOMAIN) {
			showTail.value = true
			return
		}

		// Toggle selection
		if (selectedDomain === clickedDomain.domain) {
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
