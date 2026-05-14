<template>
	<div
		v-if="timePeriod.nextResetAt"
		class="period-timeline"
	>
		<div class="d-flex justify-space-between align-center mb-1">
			<span class="text-caption font-weight-bold">{{ timeLabel }}</span>
			<span class="text-caption opacity-60">{{ resetDateLabel }}</span>
		</div>
		<div class="timeline-bar-row">
			<div
				v-for="(seg, i) in segments"
				:key="i"
				class="timeline-segment-wrap"
			>
				<div class="timeline-track">
					<div
						class="timeline-fill"
						:style="{ width: seg.fill + '%', backgroundColor: getBgColor(color) }"
					/>
				</div>
				<span
					v-if="seg.showLabel"
					class="timeline-label text-caption"
				>
					{{ seg.label }}
				</span>
				<span
					v-else
					class="timeline-label"
					aria-hidden="true"
				/>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import { useColor } from '@/utils/colorPalette.ts'

	const { timePeriod } = defineProps<{ timePeriod: RoutineTimePeriodEntity; color: string }>()

	const { getBgColor } = useColor()
	const { t } = useI18n()

	interface TimelineSegment {
		fill: number
		label: string
		showLabel: boolean
	}

	const resetDateLabel = computed(() => {
		if (!timePeriod.nextResetAt) return ''
		return new Date(timePeriod.nextResetAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
	})

	function roundHalf(value: number): number {
		return Math.round(value * 2) / 2
	}

	const timeLabel = computed(() => {
		if (!timePeriod.nextResetAt) return ''
		const msRemaining = new Date(timePeriod.nextResetAt).getTime() - Date.now()
		const daysRemaining = msRemaining / (1000 * 60 * 60 * 24)
		if (daysRemaining < 2)
			return t('routineTodoList.hoursLeft', { hours: roundHalf(msRemaining / (1000 * 60 * 60)) })
		if (daysRemaining < 30) return t('routineTodoList.daysLeft', { days: roundHalf(daysRemaining) })
		if (daysRemaining < 90) return t('routineTodoList.weeksLeft', { weeks: roundHalf(daysRemaining / 7) })
		return t('routineTodoList.monthsLeft', { months: roundHalf(daysRemaining / 30) })
	})

	function getSegmentMode(lengthInDays: number): 'day' | 'week' | 'month' {
		if (lengthInDays <= 14) return 'day'
		if (lengthInDays <= 90) return 'week'
		return 'month'
	}

	const segments = computed((): TimelineSegment[] => {
		if (!timePeriod.nextResetAt) return []
		const DAY_MS = 86_400_000
		const periodEnd = new Date(timePeriod.nextResetAt).getTime()
		const periodStart = periodEnd - timePeriod.lengthInDays * DAY_MS
		const now = Date.now()
		const mode = getSegmentMode(timePeriod.lengthInDays)
		const boundaries: number[] = []

		if (mode === 'day') {
			for (let i = 0; i <= timePeriod.lengthInDays; i++) {
				boundaries.push(periodStart + i * DAY_MS)
			}
		} else if (mode === 'week') {
			const n = Math.round(timePeriod.lengthInDays / 7)
			const segMs = (periodEnd - periodStart) / n
			for (let i = 0; i <= n; i++) boundaries.push(periodStart + i * segMs)
		} else {
			const n = Math.round(timePeriod.lengthInDays / 30)
			const segMs = (periodEnd - periodStart) / n
			for (let i = 0; i <= n; i++) boundaries.push(periodStart + i * segMs)
		}

		const total = boundaries.length - 1
		const skipEvery = mode === 'day' && total >= 10 ? 2 : 1

		return boundaries.slice(0, -1).map((slotStart, i) => {
			const slotEnd = boundaries[i + 1]
			const fill =
				slotEnd <= now
					? 100
					: slotStart >= now
						? 0
						: Math.round(((now - slotStart) / (slotEnd - slotStart)) * 100)

			const labelDate = new Date(slotStart)
			const label =
				mode === 'day'
					? labelDate.toLocaleDateString(undefined, { weekday: 'short' })
					: mode === 'week'
						? labelDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
						: labelDate.toLocaleDateString(undefined, { month: 'short' })

			return { fill, label, showLabel: skipEvery === 1 || i % skipEvery === 0 }
		})
	})
</script>
<style scoped>
	.period-timeline {
		width: 100%;
	}

	.timeline-bar-row {
		display: flex;
		gap: 2px;
		align-items: flex-start;
		width: 100%;
	}

	.timeline-segment-wrap {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	.timeline-track {
		height: 8px;
		border-radius: 4px;
		background: rgba(var(--v-theme-on-surface), 0.12);
		overflow: hidden;
	}

	.timeline-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.timeline-label {
		display: block;
		font-size: 9px;
		line-height: 1.3;
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.55;
		min-height: 1em;
	}
</style>
