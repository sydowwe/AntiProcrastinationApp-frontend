<template>
	<MyDialog
		v-model="dialog"
		:title="title"
		:hasConfirmBtn="false"
		closeBtnText="Close"
		maxWidth="750"
	>
		<div
			v-if="timePeriod"
			style="height: 220px"
		>
			<VChart
				:option="option"
				autoresize
			/>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import VChart from 'vue-echarts'
	import { use } from 'echarts/core'
	import { HeatmapChart } from 'echarts/charts'
	import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
	import { CanvasRenderer } from 'echarts/renderers'
	import { computed, ref } from 'vue'
	import type {
		PeriodCompletion,
		RoutineTimePeriodEntity,
	} from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'

	use([HeatmapChart, CalendarComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

	const dialog = ref(false)
	const timePeriod = ref<RoutineTimePeriodEntity | null>(null)

	const title = computed(() => {
		if (!timePeriod.value) return ''
		const name = timePeriod.value.text ?? 'History'
		const days = timePeriod.value.lengthInDays
		return `${name} · ${days}-day periods`
	})

	// Build a map from ISO date string → ratio so we can look up period info per day
	const periodByDay = computed(() => {
		const map = new Map<string, PeriodCompletion>()
		for (const p of timePeriod.value?.completionHistory ?? []) {
			const end = new Date(p.periodEnd)
			const cur = new Date(p.periodStart)
			while (cur < end) {
				map.set(toDateStr(cur), p)
				cur.setDate(cur.getDate() + 1)
			}
		}
		return map
	})

	const expandedDays = computed<[string, number][]>(() => {
		return Array.from(periodByDay.value.entries()).map(([dateStr, p]) => {
			const ratio = p.totalCount === 0 ? 0 : p.completedCount / p.totalCount
			return [dateStr, ratio]
		})
	})

	const calendarRange = computed<[string, string] | null>(() => {
		const history = timePeriod.value?.completionHistory
		if (!history?.length) return null
		const oldest = history[0].periodStart.slice(0, 10)
		const newest = history[history.length - 1].periodEnd.slice(0, 10)
		return [oldest, newest]
	})

	function getThemeColor(varName: string): string {
		const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
		// Vuetify theme vars are space-separated R G B
		if (raw && raw.includes(' ')) {
			return `rgb(${raw})`
		}
		return raw || '#888888'
	}

	const option = computed(() => {
		if (!calendarRange.value) return {}

		const successColor = getThemeColor('--v-theme-success')
		const neutralColor = getThemeColor('--v-theme-neutral-700')

		return {
			tooltip: {
				formatter: function (params: any) {
					const dateStr: string = params.data[0]
					const p = periodByDay.value.get(dateStr)
					if (!p) return dateStr
					const range = `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
					if (p.totalCount === 0) return range
					const ratio = p.completedCount / p.totalCount
					if (ratio >= 1) return `${range}<br/>Completed`
					if (p.completedCount > 0) return `${range}<br/>${p.completedCount} / ${p.totalCount} done`
					return `${range}<br/>Not done`
				},
			},
			visualMap: {
				show: false,
				min: 0,
				max: 1,
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

	function open(tp: RoutineTimePeriodEntity) {
		timePeriod.value = tp
		dialog.value = true
	}

	defineExpose({ open })
</script>
