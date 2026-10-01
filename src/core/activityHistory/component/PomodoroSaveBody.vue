<!--
	The pomodoro's save prompt: the same sentence every capture view asks, plus one quiet line on how
	far the plan got. Descriptive, never a verdict — no colour, no "failed". It matters most for a
	session that ran out while the app was closed, where it is the only thing explaining why a
	two-hour plan is offering one focus period.
-->
<template>
	<div class="d-flex flex-column ga-2 text-center">
		<span>{{ $t('activities.confirmSaveActivity', { activity, timeSpent: timeSpent.getNice }) }}</span>
		<span
			v-if="summary"
			class="text-body-2 text-medium-emphasis"
		>
			{{
				$t(
					`history.pomodoro.outcome.${summary.outcome}`,
					{ done: summary.focusPeriodsCompleted, total: summary.focusPeriodsPlanned },
					summary.focusPeriodsPlanned,
				)
			}}
		</span>
	</div>
</template>

<script setup lang="ts">
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import type { PomodoroOutcomeSummary } from '@/core/activityHistory/store/pomodoroSessionLog.ts'

	defineProps<{
		activity: string
		timeSpent: Time
		/** Null for a session stored before the segment log existed, which cannot say how far it got. */
		summary: PomodoroOutcomeSummary | null
	}>()
</script>
