<template>
	<div
		v-if="timePeriod"
		style="height: 220px"
	>
		<VChart
			:option
			autoresize
		/>
	</div>
</template>

<script setup lang="ts">
	import VChart from 'vue-echarts'
	import { use } from 'echarts/core'
	import { HeatmapChart } from 'echarts/charts'
	import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
	import { CanvasRenderer } from 'echarts/renderers'
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type {
		PeriodCompletion,
		RoutineTimePeriodEntity,
	} from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

	const { timePeriod } = defineProps<{
		timePeriod: RoutineTimePeriodEntity
	}>()

	use([HeatmapChart, CalendarComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

	const { t } = useI18n()

	const periodByDay = computed(() => {
		const map = new Map<string, PeriodCompletion>()
		for (const p of timePeriod.completionHistory ?? []) {
			const end = new Date(p.periodEnd)
			const cur = new Date(p.periodStart)
			while (cur < end) {
				map.set(toDateStr(cur), p)
				cur.setDate(cur.getDate() + 1)
			}
		}
		return map
	})

	// Frozen days are a third state, not a ratio — they get their own series so the visual map can't
	// paint them as a shade of "done".
	const expandedDays = computed<[string, number][]>(() =>
		Array.from(periodByDay.value.entries())
			.filter(([, p]) => !p.isFrozen)
			.map(([dateStr, p]) => [dateStr, p.totalCount === 0 ? 0 : p.completedCount / p.totalCount]),
	)

	const frozenDays = computed<[string, number][]>(() =>
		Array.from(periodByDay.value.entries())
			.filter(([, p]) => p.isFrozen)
			.map(([dateStr]) => [dateStr, 1]),
	)

	const calendarRange = computed<[string, string] | null>(() => {
		const history = timePeriod.completionHistory
		if (!history?.length) return null
		const oldest = history[0].periodStart.slice(0, 10)
		const newest = history[history.length - 1].periodEnd.slice(0, 10)
		return [oldest, newest]
	})

	function getThemeColor(varName: string): string {
		const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
		if (raw && raw.includes(' ')) {
			return `rgb(${raw})`
		}
		return raw || '#888888'
	}

	const option = computed(() => {
		if (!calendarRange.value) return {}

		const successColor = getThemeColor('--v-theme-success')
		const neutralColor = getThemeColor('--v-theme-neutral-700')
		const infoColor = getThemeColor('--v-theme-info')

		return {
			tooltip: {
				formatter: function (params: any) {
					const dateStr: string = params.data[0]
					const p = periodByDay.value.get(dateStr)
					if (!p) return dateStr
					const label = `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
					if (p.isFrozen) return t('routineTodoList.heatmapFrozen', { label })
					if (p.totalCount === 0) return t('routineTodoList.heatmapNothingScheduled', { label })
					if (p.completedCount / p.totalCount >= 1) return t('routineTodoList.heatmapAllDone', { label })
					return t('routineTodoList.heatmapPartial', {
						label,
						done: p.completedCount,
						total: p.totalCount,
					})
				},
			},
			visualMap: {
				show: false,
				min: 0,
				max: 1,
				// Series 0 only — the frozen series carries its own fixed colour.
				seriesIndex: 0,
				inRange: {
					color: [neutralColor, successColor],
				},
			},
			calendar: {
				top: 30,
				left: 40,
				right: 20,
				bottom: 10,
				range: calendarRange.value,
				cellSize: ['auto', 16],
				itemStyle: {
					borderWidth: 2,
					borderColor: 'transparent',
				},
				dayLabel: {
					nameMap: 'en',
					color: '#888',
					firstDay: 1,
				},
				monthLabel: {
					color: '#aaa',
				},
				yearLabel: {
					show: false,
				},
			},
			series: [
				{
					type: 'heatmap',
					coordinateSystem: 'calendar',
					data: expandedDays.value,
				},
				{
					type: 'heatmap',
					coordinateSystem: 'calendar',
					data: frozenDays.value,
					itemStyle: {
						color: infoColor,
						opacity: 0.45,
						borderWidth: 1.5,
						borderColor: infoColor,
					},
				},
			],
		}
	})

	function toDateStr(d: Date): string {
		const y = d.getFullYear()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${y}-${m}-${day}`
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
	}
</script>
