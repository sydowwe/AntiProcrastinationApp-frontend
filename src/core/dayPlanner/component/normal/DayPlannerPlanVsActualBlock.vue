<!--
	Plan vs. actual — the number the planning-fallacy research says actually corrects estimates:
	the person's own past drift, not a reminder to "add a buffer" (Buehler, Griffin & Ross, 1994).

	Descriptive only, on purpose. No colour that changes, no warning icon, no streak — this app is
	for people who procrastinate, and a scolding surface is a reason to close the tab. Withheld until
	the viewed day is materially over (usePlanVsActual), and rendered as nothing rather than a
	zeroed-out card when there is nothing to compare.
-->
<template>
	<div
		v-if="isShown"
		class="plan-vs-actual"
	>
		<div class="summary-line">
			{{
				$t('planner.planVsActual.summary', {
					planned: fromMinutes(plannedMinutes),
					actual: fromMinutes(actualMinutes),
				})
			}}
		</div>
		<div
			v-if="driftLine"
			class="drift-line text-medium-emphasis"
		>
			{{ driftLine }}
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { usePlanVsActual } from '@/core/dayPlanner/composable/usePlanVsActual.ts'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'

	const { t } = useI18n()
	const store = useDayPlannerStore()
	const { isShown, plannedMinutes, actualMinutes, startedLateCount, ranLongerCount, neverHappenedCount } =
		usePlanVsActual(store)

	const driftLine = computed(() =>
		[
			startedLateCount.value > 0
				? t('planner.planVsActual.startedLate', { count: startedLateCount.value }, startedLateCount.value)
				: '',
			ranLongerCount.value > 0
				? t('planner.planVsActual.ranLonger', { count: ranLongerCount.value }, ranLongerCount.value)
				: '',
			neverHappenedCount.value > 0
				? t('planner.planVsActual.neverHappened', { count: neverHappenedCount.value }, neverHappenedCount.value)
				: '',
		]
			.filter(Boolean)
			.join(' · '),
	)
</script>

<style scoped>
	.plan-vs-actual {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.summary-line {
		font-size: 0.8125rem;
		color: rgba(var(--v-theme-on-surface), 0.7);
	}

	.drift-line {
		font-size: 0.75rem;
	}
</style>
