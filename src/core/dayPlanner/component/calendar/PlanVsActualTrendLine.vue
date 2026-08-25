<!--
	The cross-day half of F2: how the displayed range was planned versus how it was logged.

	Same restraint as the single-day block (DayPlannerPlanVsActualBlock) and deliberately not the
	same shape as CalendarStatsBar directly above it: no chips, no icon, no colour that changes with
	the value. The stats bar grades the month — this line only reports it. The research this comes
	from (Buehler, Griffin & Ross, 1994) says people already know they underestimate; what corrects
	the estimate is seeing their own number, and what wastes it is dressing that number as a verdict.

	No percentage. `plannedMinutes` covers every eligible task while `actualMinutes` covers only the
	measured ones, so a ratio between them understates the person's pace whenever anything was
	abandoned — see PlanVsActualTrend and the follow-up ask in the backend contract.
-->
<template>
	<div
		v-if="trend.taskCount > 0"
		class="trend-line text-medium-emphasis"
	>
		<span>
			{{
				$t('planner.planVsActual.trend.summary', {
					planned: fromMinutes(trend.plannedMinutes),
					actual: fromMinutes(trend.actualMinutes),
				})
			}}
		</span>
		<span v-if="driftLine">· {{ driftLine }}</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'
	import type { PlanVsActualTrend } from '@/core/dayPlanner/dto/response/PlanVsActualTrend.ts'

	const { trend } = defineProps<{
		trend: PlanVsActualTrend
	}>()

	const { t } = useI18n()

	// startedLate/ranLonger are counted over the measured tasks only, so they are phrased "of the N
	// logged" rather than as a share of the range — reading them against taskCount is the mistake the
	// contract calls out.
	const driftLine = computed(() =>
		[
			trend.startedLateCount > 0
				? t('planner.planVsActual.trend.startedLate', { count: trend.startedLateCount }, trend.startedLateCount)
				: '',
			trend.ranLongerCount > 0
				? t('planner.planVsActual.trend.ranLonger', { count: trend.ranLongerCount }, trend.ranLongerCount)
				: '',
			trend.neverHappenedCount > 0
				? t(
						'planner.planVsActual.trend.neverHappened',
						{ count: trend.neverHappenedCount },
						trend.neverHappenedCount,
					)
				: '',
		]
			.filter(Boolean)
			.join(' · '),
	)
</script>

<style scoped>
	.trend-line {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		justify-content: center;
		font-size: 0.75rem;
	}
</style>
