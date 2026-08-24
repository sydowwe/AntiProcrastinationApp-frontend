<!--
	One quiet line: what is running now, and what starts next.

	The restraint is the feature. No colour that changes, no ring that fills, no countdown that turns
	red, no second row — this app is for people who procrastinate, and a header that visibly menaces
	them is a reason to close the tab. It is also not a live region: announcing a new countdown to a
	screen reader every sixty seconds is the same nagging by another channel. The text is in the DOM
	and is read on demand, like the rest of the header.

	Alerting is `useTaskReminders`, which is wired to the user's reminder settings. Overdue tasks are
	`OverdueTasksBanner`. Neither is duplicated here.
-->
<template>
	<div
		v-if="isShown"
		class="now-next"
		:title="fullLine"
	>
		<span
			v-if="nowLine"
			class="text-high-emphasis"
		>
			{{ nowLine }}
		</span>
		<span v-if="nowLine && nextLine">·</span>
		<span
			v-if="nextLine"
			class="text-medium-emphasis"
		>
			{{ nextLine }}
		</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { usePlannerNowNext } from '@/core/dayPlanner/composable/usePlannerNowNext.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'

	const { t } = useI18n()
	const store = useDayPlannerStore()
	const { isShown, nowTask, minutesLeft, nextTask, minutesUntilNext } = usePlannerNowNext(store)

	/**
	 * Under an hour the count is spelled out, because Slovak declines it three ways (1 / 2–4 / 5+) and
	 * a single interpolated form reads as broken. An hour or more it becomes `1h 30m`, which is unit
	 * symbols and declines not at all — and is shorter, which matters on one line in a header.
	 */
	const HOUR = 60

	// Both keys written out in full rather than built from a suffix — a `planner.nowNext.${key}`
	// template hides these six strings from the grep that finds every other key in this module.
	function timeLeftLabel(minutes: number): string {
		return minutes < HOUR
			? t('planner.nowNext.minutesLeft', { count: minutes }, minutes)
			: t('planner.nowNext.timeLeft', { duration: fromMinutes(minutes) })
	}

	function startsInLabel(minutes: number): string {
		return minutes < HOUR
			? t('planner.nowNext.inMinutes', { count: minutes }, minutes)
			: t('planner.nowNext.inTime', { duration: fromMinutes(minutes) })
	}

	const nowLine = computed(() => {
		const task = nowTask.value
		if (task === null) return ''
		const label = t('planner.nowNext.now', { name: task.activity.name })
		// Null while a ticked-in-progress task is past its slot: no countdown at all is more honest
		// than a negative one, and quieter than an "overrun" badge.
		return minutesLeft.value === null ? label : `${label} · ${timeLeftLabel(minutesLeft.value)}`
	})

	const nextLine = computed(() => {
		const task = nextTask.value
		if (task === null || minutesUntilNext.value === null) return ''
		const label = t('planner.nowNext.next', { name: task.activity.name })
		return `${label} ${startsInLabel(minutesUntilNext.value)}`
	})

	/** The whole line again, for when the header is too narrow to show it and it ellipsises. */
	const fullLine = computed(() => [nowLine.value, nextLine.value].filter(Boolean).join(' · '))
</script>

<style scoped>
	.now-next {
		display: flex;
		align-items: baseline;
		gap: 6px;
		max-width: 100%;
		font-size: 0.8125rem;
		line-height: 1.2;
		/* One line, always: the header has no room for a second, and wrapping would make the surface
		   the loudest thing in it. */
		white-space: nowrap;
		overflow: hidden;
	}

	.now-next > span {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
