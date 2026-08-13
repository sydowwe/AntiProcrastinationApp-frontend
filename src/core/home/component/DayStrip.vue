<!--
	The whole day as one bar: every task in its slot, the part already spent greyed out, a marker at
	now. Reads the plan straight from `useTodayPlan` rather than taking props — it is a second view of
	the same shared state, not a reusable chart.
-->
<template>
	<div>
		<!--
			`aria-hidden` rather than an ARIA widget pattern: the bar is a decoration built from
			positioned divs, every task in it is listed below with its times, and there is no role
			that describes "proportional coloured segments" without inventing one. The label row under
			it stays readable — "2h left of plan" is the part worth announcing.
		-->
		<div
			class="daystrip"
			aria-hidden="true"
		>
			<div
				class="daystrip__elapsed"
				:style="{ width: elapsedWidth }"
			/>
			<div
				v-for="task in sortedTasks"
				:key="task.id"
				class="daystrip__seg"
				:class="{ 'daystrip__seg--done': isFinished(task) }"
				:style="{
					left: stripLeft(task),
					width: stripWidth(task),
					background: taskColor(task),
				}"
				:title="`${task.startTime.getString()} ${task.activity.name}`"
			/>
			<div
				v-if="nowInsideDay"
				class="daystrip__now"
				:style="{ left: nowLeft }"
			/>
		</div>
		<div class="d-flex justify-space-between mt-1">
			<span class="text-caption text-medium-emphasis">{{ dayStartLabel }}</span>
			<span class="text-caption font-weight-medium">{{ remainingLabel }}</span>
			<span class="text-caption text-medium-emphasis">{{ dayEndLabel }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useTodayPlan } from '@/core/home/composable/useTodayPlan.ts'

	const { t } = useI18n()
	const { nowMinutes, sortedTasks, isFinished, taskColor, minutesLabel } = useTodayPlan()

	const dayStart = computed(() =>
		sortedTasks.value.length === 0 ? 0 : Math.floor(sortedTasks.value[0]!.startTime.getInMinutes / 60) * 60,
	)
	const dayEnd = computed(() => {
		const latest = Math.max(...sortedTasks.value.map(task => task.endTime.getInMinutes))
		return Math.min(Math.ceil(latest / 60) * 60, 24 * 60)
	})
	const daySpan = computed(() => Math.max(dayEnd.value - dayStart.value, 1))
	const dayStartLabel = computed(() => Time.fromMinutes(dayStart.value).getString())
	const dayEndLabel = computed(() => Time.fromMinutes(dayEnd.value).getString())
	const nowInsideDay = computed(() => nowMinutes.value >= dayStart.value && nowMinutes.value <= dayEnd.value)
	const nowLeft = computed(() => percent(nowMinutes.value - dayStart.value))
	const elapsedWidth = computed(() =>
		percent(Math.min(Math.max(nowMinutes.value - dayStart.value, 0), daySpan.value)),
	)
	// Time blindness: say how much of the plan is left, do not make it be inferred from the clock.
	const remainingLabel = computed(() => {
		const left = dayEnd.value - nowMinutes.value
		return left <= 0 ? t('home.planOver') : t('home.leftOfPlan', { time: minutesLabel(left) })
	})

	function percent(minutes: number): string {
		return `${(minutes / daySpan.value) * 100}%`
	}

	function stripLeft(task: PlannerTask): string {
		return percent(task.startTime.getInMinutes - dayStart.value)
	}

	function stripWidth(task: PlannerTask): string {
		return `max(3px, ${percent(task.endTime.getInMinutes - task.startTime.getInMinutes)})`
	}
</script>

<style scoped>
	.daystrip {
		position: relative;
		height: 14px;
		border-radius: 7px;
		background: rgba(var(--v-theme-on-surface), 0.07);
		overflow: hidden;
	}

	.daystrip__elapsed {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		background: rgba(var(--v-theme-on-surface), 0.14);
	}

	.daystrip__seg {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 7px;
		opacity: 0.85;
	}

	.daystrip__seg--done {
		opacity: 0.3;
	}

	.daystrip__now {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		background: rgb(var(--v-theme-error));
		box-shadow: 0 0 6px 1px rgb(var(--v-theme-error));
	}
</style>
