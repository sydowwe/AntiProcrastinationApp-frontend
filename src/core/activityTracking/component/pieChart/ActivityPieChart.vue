<template>
	<div
		ref="container"
		class="pie-chart-container"
	>
		<VChart
			autoresize
			:option="chartOption"
			class="chart"
			:style="{ height: `${stacked ? STACKED_HEIGHT : SIDE_HEIGHT}px` }"
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
	import { computed, useTemplateRef } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useTheme } from 'vuetify'
	import { useElementSize } from '@vueuse/core'
	import VChart from 'vue-echarts'
	import { use } from 'echarts/core'
	import { CanvasRenderer } from 'echarts/renderers'
	import { PieChart } from 'echarts/charts'
	import { LegendComponent, TooltipComponent } from 'echarts/components'
	import type { EChartsOption } from 'echarts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { OTHER_DOMAIN, type PieSegment } from './PieSegment.ts'
	import { distinctLabels } from '@/core/activityTracking/dto/DashboardItem.ts'

	const {
		domains,
		selectedDomain,
		showViewMode = true,
		foldedCount = 0,
	} = defineProps<{
		domains: PieSegment[]
		/** A segment's `key`, as is the `segmentClick` payload. */
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

	// The layout follows the measured width (F94). The canvas was a fixed 470 px with the donut at
	// `115%` of its 300 px box, so on a 342 px phone card half the donut was cut off. Side by side the
	// donut sits a fixed distance from the right edge, which is exactly the old 115% at 470 px; below
	// SIDE_MIN_WIDTH there is no room for a legend beside it, so the legend goes under the donut.
	const SIDE_HEIGHT = 250
	// The donut's bottom at its emphasis scale (120 + 95 + 10), plus the one-row paged legend.
	const STACKED_HEIGHT = 265
	const SIDE_MIN_WIDTH = 440
	const PIE_BOX = 300
	// From the right edge to the donut's centre: 470 − 115% × PIE_BOX.
	const SIDE_CENTER_FROM_RIGHT = 125

	const container = useTemplateRef<HTMLElement>('container')
	const { width } = useElementSize(container)
	const stacked = computed(() => width.value < SIDE_MIN_WIDTH)

	// Both branches set the same keys: vue-echarts merges each option into the last, so a key only one
	// branch set would survive a switch between them.
	const layout = computed(() =>
		stacked.value
			? {
					legend: { orient: 'horizontal' as const, left: 'center', top: 'auto', bottom: 0 },
					series: { center: ['50%', 120], width: '100%', height: '100%', radius: [40, 95] },
				}
			: {
					legend: { orient: 'vertical' as const, left: 0, top: 'center', bottom: 'auto' },
					series: {
						center: [width.value - SIDE_CENTER_FROM_RIGHT, '42%'],
						width: PIE_BOX,
						height: PIE_BOX,
						radius: ['35%', '75%'],
					},
				},
	)

	// ECharts identifies a pie item — and its legend entry — by `name`, so `name` carries the key and
	// every visible string is looked up from it. Naming items by label merged two processes that share
	// a product name into one legend entry and made a click on either select the first.
	const segmentsByKey = computed(() => new Map(domains.map(segment => [segment.key, segment])))
	const labelsByKey = computed(() => distinctLabels(domains.filter(segment => segment.key !== OTHER_DOMAIN)))

	function displayName(key: string): string {
		if (key === OTHER_DOMAIN) return t('activityTracking.common.other')
		return labelsByKey.value.get(key) ?? segmentsByKey.value.get(key)?.label ?? key
	}

	const chartOption = computed<EChartsOption>(() => {
		const data = domains.map(segment => ({
			name: segment.key,
			value: segment.seconds,
			itemStyle: {
				color: segment.color,
			},
			// Select state
			selected: selectedDomain === segment.key,
		}))

		return {
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					const seconds = params.value
					const percent = params.percent.toFixed(1)
					return `<strong>${displayName(params.name)}</strong><br/>${fromSeconds(seconds)} (${percent}%)`
				},
			},
			legend: {
				// Paged, because an expanded tail can hold more rows than the 250 px canvas fits.
				type: 'scroll',
				pageIconColor: onSurface.value,
				pageIconInactiveColor: '#888',
				pageTextStyle: { color: onSurface.value },
				...layout.value.legend,
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
				formatter: (key: string) => {
					const segment = segmentsByKey.value.get(key)
					const name = displayName(key)
					// A disambiguated name ends in the very part that tells it apart — "(chrome.exe)" — so
					// the shared label is what gets shortened, never the key.
					const isDisambiguated = segment !== undefined && name !== segment.label && key !== OTHER_DOMAIN
					const suffix = isDisambiguated ? ` (${key})` : ''
					const base = isDisambiguated ? segment.label : name
					const limit = Math.max(8, 25 - suffix.length)
					const truncated = (base.length > limit ? base.substring(0, limit) + '...' : base) + suffix
					return segment ? `${truncated} (${segment.percent.toFixed(1)}%)` : truncated
				},
			},
			series: [
				{
					type: 'pie',
					...layout.value.series,
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

		const clicked = segmentsByKey.value.get(params.data.name)

		if (!clicked) return

		// "Other" is not selectable — clicking it expands it into its members instead.
		if (clicked.key === OTHER_DOMAIN) {
			showTail.value = true
			return
		}

		// Toggle selection
		if (selectedDomain === clicked.key) {
			emit('segmentClick', null)
		} else {
			emit('segmentClick', clicked.key)
		}
	}
</script>

<style scoped>
	/* 470 px where it fits (room for the legend left of the donut), the card's width where it does not. */
	.pie-chart-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 470px;
		max-width: 100%;
	}

	.chart {
		width: 100%;
	}
</style>
