<!--
	"Time's up — wrap up or extend?" (P1-04), in the day view: today only, for a started block still running at
	least the server's grace past its planned end. Where a `PlannedBlockOverrun` notification lands, and the same
	question for anyone who never saw it. One block at a time, the one furthest over; acting on it, or dismissing
	it, lets the next one through. Extending moves the end, so the banner comes back if that runs out too — as the
	server's nudge does. "Done" is one tap only within the hour; after that it hands over to the log-time dialog.
-->
<template>
	<SubtleCard
		v-if="overrun"
		color="warning"
		icon="fa-stopwatch"
		closable
		class="mx-4 mt-2"
		@close="dismiss"
	>
		<div class="d-flex align-center flex-wrap ga-3">
			<p class="text-body-2 ma-0 flex-grow-1">
				{{ $t('planner.overrun.text', { name: overrun.task.activity.name, duration: overDuration }) }}
			</p>
			<div class="d-flex ga-2">
				<VBtn
					v-if="extendBy > 0"
					variant="tonal"
					color="warning"
					prependIcon="fa-clock-rotate-left"
					:loading="extending"
					:disabled="completing"
					@click="extend(overrun.task, EXTEND_MINUTES)"
				>
					{{ $t('planner.overrun.extend', { minutes: extendBy }) }}
				</VBtn>
				<VBtn
					color="successDark"
					prependIcon="fa-check"
					:loading="completing"
					:disabled="extending"
					@click="done"
				>
					{{ isFresh ? $t('planner.overrun.done') : $t('planner.overrun.doneEllipsis') }}
				</VBtn>
			</div>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
	import { isoDateInUserZone, minutesOfDayInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useWrapUpBlock } from '@/core/dayPlanner/composable/useWrapUpBlock.ts'
	import { overrunMinutes } from '@/core/dayPlanner/utils/overrunBlocks.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

	const emit = defineEmits<{ logTime: [taskId: number] }>()
	/** The notification's "extend" and backend P2-03's push action: a quarter of an hour. */
	const EXTEND_MINUTES = 15
	const HOUR = 60
	/**
	 * How long past its end "Done" may still record the block as ending *now*. Within the hour, the user is most
	 * likely still at it or only just stopped. Past it, "now" is a guess that writes hours of time nobody spent
	 * into plan-vs-actual, so "Done…" opens the log-time dialog instead, pre-filled with the same values to fix.
	 */
	const DONE_NOW_MAX_OVERRUN_MINUTES = 60

	const { t } = useI18n()
	const store = useDayPlannerStore()
	const { currentTime } = useCurrentTime()
	const { completeNow, extend, extendableMinutes, completing, extending } = useWrapUpBlock()

	// Keyed by the planned end too, so dismissing one overrun does not hide the next one after an extension.
	const dismissed = ref(new Set<string>())

	function dismissKey(task: PlannerTask): string {
		return `${task.id}:${task.endTime.getInMinutes}`
	}

	// Same "is this today" reading as `ReplanTodayBanner`, for the same reason: `viewedDate` comes back from
	// sessionStorage as an ISO string after a reload.
	const isToday = computed(
		() => formatDateForApi(new Date(store.viewedDate)) === isoDateInUserZone(currentTime.value),
	)

	const overrun = computed<{ task: PlannerTask; minutes: number } | null>(() => {
		if (!isToday.value) return null
		const now = minutesOfDayInUserZone(currentTime.value)
		let worst: { task: PlannerTask; minutes: number } | null = null
		for (const candidate of store.tasks as PlannerTask[]) {
			if (dismissed.value.has(dismissKey(candidate))) continue
			const minutes = overrunMinutes(candidate, now)
			if (minutes !== null && (worst === null || minutes > worst.minutes)) worst = { task: candidate, minutes }
		}
		return worst
	})

	const overDuration = computed(() => {
		const minutes = overrun.value?.minutes ?? 0
		return minutes < HOUR ? t('planner.overrun.minutes', { count: minutes }) : fromMinutes(minutes)
	})

	const extendBy = computed(() => (overrun.value ? extendableMinutes(overrun.value.task, EXTEND_MINUTES) : 0))

	const isFresh = computed(() => (overrun.value?.minutes ?? 0) <= DONE_NOW_MAX_OVERRUN_MINUTES)

	function done() {
		if (!overrun.value) return
		if (isFresh.value) void completeNow(overrun.value.task)
		else emit('logTime', overrun.value.task.id)
	}

	function dismiss() {
		if (!overrun.value) return
		dismissed.value = new Set([...dismissed.value, dismissKey(overrun.value.task)])
	}
</script>
