<template>
	<div ref="container">
		<VChart
			autoresize
			:option="chartOption"
			:style="{ height: `${chartHeight}px` }"
			@click="handleChartClick"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, useTemplateRef } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useTheme } from 'vuetify'
	import { useElementSize } from '@vueuse/core'
	import VChart from 'vue-echarts'
	import { format, use } from 'echarts/core'
	import { CanvasRenderer } from 'echarts/renderers'
	import { PieChart } from 'echarts/charts'
	import { LegendComponent, TooltipComponent } from 'echarts/components'
	import type { EChartsOption } from 'echarts'
	import type { HistoryPieChartItem } from '@/core/historyDashboard/dto/response/HistoryPieChartItem.ts'
	import {
		historyGroupKey,
		isHistoryOtherRollup,
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

	const { t } = useI18n()
	const theme = useTheme()

	// The layout is computed in pixels from the measured width (F31). A percentage layout only fits
	// a wide canvas, and the Summary and Detail sections give this chart about 300 px beside the
	// details card, so the legend ran into the slices. Below the side layout's minimum the legend
	// goes under the donut, one entry per row, and pages past STACKED_MAX_ROWS.
	const SIDE_HEIGHT = 250
	const SIDE_OUTER_RADIUS_RATIO = 0.75
	const EMPHASIS_SCALE = 10
	const GAP = 16
	const MIN_SIDE_LEGEND_WIDTH = 140
	const MAX_SIDE_LEGEND_WIDTH = 280
	const STACKED_MAX_OUTER_RADIUS = 80
	const STACKED_INNER_RADIUS_RATIO = 0.475
	const STACKED_MAX_LEGEND_WIDTH = 360
	// Rows the stacked legend may take before it pages; a paged legend shows one fewer, for the pager.
	const STACKED_MAX_ROWS = 7
	// ECharts' default legend itemHeight (14) + itemGap (10).
	const LEGEND_ROW = 24
	const LEGEND_PAGER = 28
	// Legend padding (2 × 8) + border (2 × 1).
	const LEGEND_BOX = 18
	// LEGEND_BOX + the item's icon (25) and its gap to the text (5).
	const LEGEND_CHROME = LEGEND_BOX + 30
	const LEGEND_FONT = '300 12px sans-serif'

	const container = useTemplateRef<HTMLElement>('container')
	const { width } = useElementSize(container)

	// The space the donut needs at its emphasis scale; the radius is relative to half the shorter side.
	const pieBox = computed(
		() => 2 * ((SIDE_OUTER_RADIUS_RATIO * Math.min(width.value, SIDE_HEIGHT)) / 2 + EMPHASIS_SCALE),
	)

	const stacked = computed(() => props.isNarrow || width.value < pieBox.value + GAP + MIN_SIDE_LEGEND_WIDTH)

	// A legend given a width but no height wraps into columns, so both layouts set the height: one row
	// per entry up to `maxRows`, and a scroll legend with a pager past that. The two legend types read
	// `height` differently — a plain legend counts its padding and border inside it, a scroll legend
	// adds them outside — so `optionHeight` is what to pass and `boxHeight` is what ends up on screen.
	function legendColumn(maxRows: number) {
		const paged = props.items.length > maxRows
		const rows = paged ? maxRows - 1 : props.items.length
		const contentHeight = rows * LEGEND_ROW - 10 + (paged ? LEGEND_PAGER : 0)
		return {
			paged,
			boxHeight: contentHeight + LEGEND_BOX,
			optionHeight: paged ? contentHeight : contentHeight + LEGEND_BOX,
		}
	}

	// Keyed by the raw wire name, which is what echarts hands the legend formatter.
	const legendEntries = computed(() => {
		const total = props.items.reduce((sum, i) => sum + i.totalSeconds, 0)
		return new Map(
			props.items.map(item => {
				const pct = total > 0 ? ((item.totalSeconds / total) * 100).toFixed(1) : '0.0'
				return [item.name, { name: displayName(item), suffix: ` (${pct}%)` }]
			}),
		)
	})

	const widestLegendText = computed(() =>
		Math.max(
			0,
			...[...legendEntries.value.values()].map(e => format.getTextRect(e.name + e.suffix, LEGEND_FONT).width),
		),
	)

	const sideLayout = computed(() => {
		// No wider than the widest entry, so a short legend does not leave a gap before the donut. The
		// slack covers `truncateText`, which takes a pixel off the room it is given.
		const legendWidth = Math.min(
			width.value - pieBox.value - GAP,
			MAX_SIDE_LEGEND_WIDTH,
			Math.ceil(widestLegendText.value) + LEGEND_CHROME + 4,
		)
		const offset = Math.max(0, (width.value - legendWidth - GAP - pieBox.value) / 2)
		// The rows that fit in the canvas with a margin above and below the legend box.
		const column = legendColumn(Math.floor((SIDE_HEIGHT - GAP - LEGEND_BOX + 10) / LEGEND_ROW))
		return {
			legendLeft: offset,
			legendWidth,
			legendHeight: column.optionHeight,
			paged: column.paged,
			pieCenterX: offset + legendWidth + GAP + pieBox.value / 2,
		}
	})

	const stackedLayout = computed(() => {
		const column = legendColumn(STACKED_MAX_ROWS)
		// Shrinks on a canvas too narrow for the full donut at its emphasis scale.
		const outerRadius = Math.max(30, Math.min(STACKED_MAX_OUTER_RADIUS, width.value / 2 - EMPHASIS_SCALE - 4))
		const pieCenterY = outerRadius + EMPHASIS_SCALE + 10
		const legendTop = pieCenterY + outerRadius + EMPHASIS_SCALE + 10
		return {
			outerRadius,
			innerRadius: outerRadius * STACKED_INNER_RADIUS_RATIO,
			pieCenterY,
			legendTop,
			legendWidth: Math.min(width.value - GAP, STACKED_MAX_LEGEND_WIDTH),
			legendHeight: column.optionHeight,
			paged: column.paged,
			// A little air under the legend box.
			height: legendTop + column.boxHeight + 4,
		}
	})

	const chartHeight = computed(() => (stacked.value ? stackedLayout.value.height : SIDE_HEIGHT))

	const legendTextWidth = computed(
		() => (stacked.value ? stackedLayout.value.legendWidth : sideLayout.value.legendWidth) - LEGEND_CHROME,
	)

	// The name is truncated by pixels, not characters, and the percentage is never cut. `textWidth` is
	// passed in rather than read here: echarts calls the formatter outside `chartOption`'s computed, so a
	// read in here would not make the option re-render when the measured width settles.
	function legendLabel(name: string, suffix: string, textWidth: number): string {
		const room = textWidth - format.getTextRect(suffix, LEGEND_FONT).width
		return format.truncateText(name, Math.max(room, 0), LEGEND_FONT, '…') + suffix
	}

	// The echarts datum keeps the raw wire name as its identity (the legend is keyed by it); only what
	// the user reads is translated.
	function displayName(item: HistoryPieChartItem): string {
		return isHistoryOtherRollup(item) ? t('history.summary.otherGroup') : item.name
	}

	const colors = computed(() => theme.current.value.colors)

	// Stacked: a column under the donut. Side: a box left of it, sized to the space the donut leaves,
	// with the pair centred in the canvas.
	const legendPosition = computed(() =>
		stacked.value
			? {
					type: stackedLayout.value.paged ? ('scroll' as const) : ('plain' as const),
					orient: 'vertical' as const,
					left: 'center',
					top: stackedLayout.value.legendTop,
					width: stackedLayout.value.legendWidth,
					height: stackedLayout.value.legendHeight,
				}
			: {
					type: sideLayout.value.paged ? ('scroll' as const) : ('plain' as const),
					orient: 'vertical' as const,
					left: sideLayout.value.legendLeft,
					top: 'center',
					width: sideLayout.value.legendWidth,
					height: sideLayout.value.legendHeight,
				},
	)

	const chartOption = computed<EChartsOption>(() => {
		const textWidth = legendTextWidth.value
		const entries = legendEntries.value
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
					const item = props.items[params.dataIndex]
					const name = item ? displayName(item) : params.name
					const seconds = params.value
					const percent = params.percent.toFixed(1)
					return `<strong>${name}</strong><br/>${fromSeconds(seconds)} (${percent}%)`
				},
			},
			legend: {
				...legendPosition.value,
				borderColor: colors.value['neutral-500'],
				borderRadius: 5,
				borderWidth: 1,
				padding: 8,
				textStyle: {
					color: colors.value['on-surface'],
					fontSize: 12,
					fontWeight: 300,
				},
				pageTextStyle: { color: colors.value['on-surface'] },
				formatter(name: string) {
					const entry = entries.get(name)
					return entry ? legendLabel(entry.name, entry.suffix, textWidth) : legendLabel(name, '', textWidth)
				},
			},
			series: [
				{
					type: 'pie',
					center: stacked.value
						? ['50%', stackedLayout.value.pieCenterY]
						: [sideLayout.value.pieCenterX, '50%'],
					radius: stacked.value
						? [stackedLayout.value.innerRadius, stackedLayout.value.outerRadius]
						: ['35%', `${SIDE_OUTER_RADIUS_RATIO * 100}%`],
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
		// The roll-up stands for many groups at once, so it is not a selectable group (F84).
		if (!item || isHistoryOtherRollup(item)) return
		const clicked = historyGroupKey(item)
		emit('segmentClick', isSameHistoryGroup(props.selectedGroup, clicked) ? null : clicked)
	}
</script>
