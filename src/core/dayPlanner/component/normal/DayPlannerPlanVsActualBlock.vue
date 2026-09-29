<!--
	Plan vs. actual — the number the planning-fallacy research says actually corrects estimates:
	the person's own past drift, not a reminder to "add a buffer" (Buehler, Griffin & Ross, 1994).

	Descriptive only, on purpose. No colour that changes, no warning icon, no streak — this app is
	for people who procrastinate, and a scolding surface is a reason to close the tab. Withheld until
	the viewed day is materially over (usePlanVsActual), and rendered as nothing rather than a
	zeroed-out card when there is nothing to compare.

	The skip line (C1) is the other half of that drift: what was dropped from the plan, and why, in
	the user's own words. Same rules — a count and the reasons, never a verdict ("only", "again"),
	never a nudge to give a reason next time. Skipping without one is counted as such and left alone.
	It stands on its own: a day where everything was skipped has no drift to report but still shows it.
-->
<template>
	<div
		v-if="isDayMateriallyDone && (isShown || skipSummary.total > 0)"
		class="plan-vs-actual"
	>
		<template v-if="isShown">
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
		</template>
		<div
			v-if="skipSummary.total > 0"
			class="skip-line text-medium-emphasis"
		>
			<!-- With no reason given for any of them, the count is the whole answer — listing
			     "N without a reason" on its own would only restate it as a shortfall. -->
			<template v-if="skipSummary.groups.length === 0">{{ skippedTasksLabel }}</template>
			<i18n-t
				v-else
				keypath="planner.planVsActual.skipped.withReasons"
				tag="span"
				scope="global"
			>
				<template #tasks>{{ skippedTasksLabel }}</template>
				<template #reasons>
					<template
						v-for="(group, i) in skipSummary.groups"
						:key="i"
					>
						<!-- Spacing in CSS, not in the text node: the formatter trims " · " down to "·". -->
						<span
							v-if="i > 0"
							class="separator"
						>
							·
						</span>
						<!-- The user's own text, up to 500 characters: clipped here, whole in the tooltip. -->
						<i18n-t
							v-if="group.count > 1"
							keypath="planner.planVsActual.skipped.reasonWithCount"
							tag="span"
							scope="global"
						>
							<template #reason>
								<span
									class="reason"
									:title="groupLabel(group)"
								>
									{{ groupLabel(group) }}
								</span>
							</template>
							<template #count>{{ group.count }}</template>
						</i18n-t>
						<span
							v-else
							class="reason"
							:title="groupLabel(group)"
						>
							{{ groupLabel(group) }}
						</span>
					</template>
					<template v-if="skipSummary.withoutReasonCount > 0">
						<span class="separator">·</span>
						{{
							$t('planner.planVsActual.skipped.withoutReason', { count: skipSummary.withoutReasonCount })
						}}
					</template>
				</template>
			</i18n-t>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { usePlanVsActual } from '@/core/dayPlanner/composable/usePlanVsActual.ts'
	import { useSkipReasonSummary } from '@/core/dayPlanner/composable/useSkipReasonSummary.ts'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'

	const { t } = useI18n()
	const store = useDayPlannerStore()
	const {
		isShown,
		isDayMateriallyDone,
		plannedMinutes,
		actualMinutes,
		startedLateCount,
		ranLongerCount,
		neverHappenedCount,
		skippedTasks,
	} = usePlanVsActual(store)

	const { summary: skipSummary, groupLabel } = useSkipReasonSummary(() =>
		skippedTasks.value.map(task => ({ reason: task.skipReason, reasonKey: task.skipReasonKey, count: 1 })),
	)

	const skippedTasksLabel = computed(() =>
		t('planner.planVsActual.skipped.summary', { count: skipSummary.value.total }, skipSummary.value.total),
	)

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

	.drift-line,
	.skip-line {
		font-size: 0.75rem;
	}

	.skip-line {
		max-width: 32rem;
	}

	.separator {
		margin-inline: 0.3em;
	}

	.reason {
		display: inline-block;
		max-width: 14rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: bottom;
	}
</style>
