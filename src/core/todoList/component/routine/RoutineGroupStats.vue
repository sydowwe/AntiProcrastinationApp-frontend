<template>
	<div
		class="mt-2 mb-1"
		style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px"
	>
		<!-- Left: accumulated run + consistency + trend -->
		<div class="mb-1 d-flex flex-column ga-1">
			<VTooltip
				v-if="timePeriod.streak > 0"
				:text="
					$t('routineTodoList.currentRunTooltip', {
						run: runLabel(timePeriod.streak, timePeriod.lengthInDays),
						best: countLabel(timePeriod.bestStreak, timePeriod.lengthInDays),
					})
				"
				location="bottom"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="d-flex align-center ga-1"
						style="cursor: default"
					>
						<VIcon
							icon="fire-flame-curved"
							size="15"
							:color="timePeriod.streak >= timePeriod.bestStreak ? 'warning' : undefined"
						/>
						<span class="text-body-2 font-weight-bold">{{ timePeriod.streak }}</span>
					</div>
				</template>
			</VTooltip>
			<div class="d-flex align-center ga-2 flex-wrap">
				<VTooltip
					v-if="timePeriod.totalPeriodsElapsed > 0"
					:text="$t('routineTodoList.consistencyLegend')"
					location="bottom"
				>
					<template #activator="{ props: tooltipProps }">
						<span
							v-bind="tooltipProps"
							class="text-caption font-weight-bold"
							:class="consistencyColor"
							style="cursor: default"
						>
							{{ consistencyPct }}%
						</span>
					</template>
				</VTooltip>
				<VTooltip
					v-if="trend"
					:text="$t('routineTodoList.trendTooltip', { recent: trend.recent, earlier: trend.earlier })"
					location="bottom"
				>
					<template #activator="{ props: tooltipProps }">
						<span
							v-bind="tooltipProps"
							class="text-caption d-flex align-center ga-1 text-medium-emphasis"
							style="cursor: default"
						>
							<VIcon
								:icon="trend.icon"
								size="12"
							/>
							{{ $t(trend.labelKey) }}
						</span>
					</template>
				</VTooltip>
			</div>
		</div>

		<!-- Center: title -->
		<VSheet
			class="px-3 d-flex align-center ga-2"
			rounded
			:color="getBgColor(timePeriod.color)"
			style="cursor: default"
		>
			<VCardTitle class="px-0 py-0">{{ timePeriod.text }}</VCardTitle>
			<VChip
				size="x-small"
				variant="tonal"
				color="white"
				class="font-weight-bold"
			>
				{{ timePeriod.lengthInDays }}d
			</VChip>
		</VSheet>

		<!-- Right: progress summary -->
		<div
			v-if="groupProgress.total > 0"
			class="d-flex flex-column align-end ga-1"
		>
			<span class="text-caption text-medium-emphasis">
				{{ $t('routineTodoList.progressCount', { done: groupProgress.done, total: groupProgress.total }) }}
			</span>
			<VProgressLinear
				:modelValue="(groupProgress.done / groupProgress.total) * 100"
				color="secondary"
				height="3"
				rounded
				style="min-width: 60px"
			/>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import { useRoutineRunLabel } from '@/core/todoList/composable/useRoutineRunLabel.ts'
	import type {
		PeriodCompletion,
		RoutineTimePeriodEntity,
	} from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'

	const { timePeriod, items } = defineProps<{
		timePeriod: RoutineTimePeriodEntity
		items: RoutineTodoListItemEntity[]
	}>()

	const { getBgColor } = useColor()
	const { runLabel, countLabel } = useRoutineRunLabel()

	const groupProgress = computed(() => ({
		done: items.filter(item => item.isDone).length,
		total: items.length,
	}))

	const consistencyPct = computed(() => {
		if (!timePeriod.totalPeriodsElapsed) return 0
		return Math.round((timePeriod.totalPeriodsCompleted / timePeriod.totalPeriodsElapsed) * 100)
	})

	// Informational only: high consistency is highlighted, low consistency is stated without a verdict colour.
	const consistencyColor = computed(() => (consistencyPct.value >= 80 ? 'text-success' : 'text-medium-emphasis'))

	function completionRate(periods: PeriodCompletion[]): number | null {
		const scheduled = periods.filter(p => p.totalCount > 0)
		if (scheduled.length === 0) return null
		const sum = scheduled.reduce((total, p) => total + p.completedCount / p.totalCount, 0)
		return Math.round((sum / scheduled.length) * 100)
	}

	// "You're doing this more often than before" — a competence signal from the history the heatmap already shows.
	const trend = computed(() => {
		const history = timePeriod.completionHistory
		if (history.length < 6) return null
		const half = Math.floor(history.length / 2)
		const earlier = completionRate(history.slice(0, half))
		const recent = completionRate(history.slice(half))
		if (earlier === null || recent === null) return null
		const delta = recent - earlier
		if (delta >= 10) return { labelKey: 'routineTodoList.trendUp', icon: 'arrow-trend-up', recent, earlier }
		if (delta <= -10) return { labelKey: 'routineTodoList.trendDown', icon: 'arrow-trend-down', recent, earlier }
		return { labelKey: 'routineTodoList.trendSteady', icon: 'arrow-right-long', recent, earlier }
	})
</script>
