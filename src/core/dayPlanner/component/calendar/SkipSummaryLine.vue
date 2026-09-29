<!--
	The range half of C1: at most two sentences about what the displayed period's skips have in common.
	Sits under PlanVsActualTrendLine with the same restraint — no chips, no icon, no colour, no trend
	arrow, no percentage — and, like it, renders as nothing rather than as a zeroed line.

	Each sentence has a floor (utils/skipRangeInsights.ts) and is simply absent below it. A bare "you
	skipped 12 things" is deliberately not one of them: it implies nothing to change, and it is the
	sentence that reads as a verdict. What is left is a pattern the user would not have counted
	themselves — the reason they keep giving, or the hour their plan stops holding.

	Reasons are folded by the same rule as the single-day line (utils/skipReasonGroups.ts), on top of the
	server's exact-text groups.
-->
<template>
	<div
		v-if="topReason || latePattern"
		class="skip-summary-line text-medium-emphasis"
	>
		<i18n-t
			v-if="topReason"
			keypath="planner.planVsActual.trend.topSkipReason"
			tag="div"
			scope="global"
		>
			<template #reason>
				<span
					class="reason"
					:title="groupLabel(topReason)"
				>
					{{ groupLabel(topReason) }}
				</span>
			</template>
			<template #count>{{ topReason.count }}</template>
			<template #total>{{ reasonSummary.total }}</template>
		</i18n-t>
		<div v-if="latePattern">
			{{
				$t('planner.planVsActual.trend.lateSkips', {
					time: `${String(latePattern.fromHour).padStart(2, '0')}:00`,
					skipped: latePattern.lateSkipped,
					planned: latePattern.latePlanned,
					earlySkipped: latePattern.earlySkipped,
					earlyPlanned: latePattern.earlyPlanned,
				})
			}}
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { SkipSummary } from '@/core/dayPlanner/dto/response/SkipSummary.ts'
	import { useSkipReasonSummary } from '@/core/dayPlanner/composable/useSkipReasonSummary.ts'
	import { lateSkipPattern, topSkipReason } from '@/core/dayPlanner/utils/skipRangeInsights.ts'

	const { summary } = defineProps<{
		summary: SkipSummary
	}>()

	const { summary: reasonSummary, groupLabel } = useSkipReasonSummary(() => summary.reasons)

	const topReason = computed(() => (summary.skippedCount > 0 ? topSkipReason(reasonSummary.value) : null))
	const latePattern = computed(() => (summary.skippedCount > 0 ? lateSkipPattern(summary.byStartHour) : null))
</script>

<style scoped>
	.skip-summary-line {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		font-size: 0.75rem;
		text-align: center;
	}

	.reason {
		display: inline-block;
		max-width: 16rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: bottom;
	}
</style>
