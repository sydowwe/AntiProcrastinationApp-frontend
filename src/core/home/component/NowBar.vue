<template>
	<VCard
		class="nowbar"
		:class="`nowbar--${focusMode}`"
		:style="focusTask ? { '--task-color': taskColor(focusTask) } : undefined"
	>
		<VProgressLinear
			v-if="focusMode === 'now'"
			:modelValue="activeProgress"
			:color="overrunMinutes > 0 ? 'error' : 'var(--task-color)'"
			height="4"
			class="nowbar__progress"
		/>

		<div class="d-flex align-center ga-4 px-4 py-3">
			<div class="nowbar__date">
				<span class="nowbar__weekday">{{ weekdayLabel }}</span>
				<span class="nowbar__day">{{ dateLabel }}</span>
			</div>
			<VDivider vertical />

			<VAvatar
				:color="accentColor"
				variant="tonal"
				rounded="lg"
				size="44"
			>
				<VIcon
					:icon="modeIcon"
					size="20"
				/>
			</VAvatar>

			<div
				class="flex-grow-1"
				style="min-width: 0"
			>
				<div class="d-flex align-center ga-2">
					<span class="nowbar__kicker">{{ $t(`home.${focusMode}`) }}</span>
					<span
						v-if="countdown"
						class="text-caption font-weight-bold"
					>
						· {{ countdown }}
					</span>
					<VChip
						v-if="overrunMinutes > 0"
						color="error"
						variant="flat"
						size="x-small"
						prependIcon="fa-hourglass-end"
					>
						{{ $t('home.overrunBy', { time: minutesLabel(overrunMinutes) }) }}
					</VChip>
				</div>
				<div class="nowbar__title">{{ headline }}</div>
			</div>

			<template v-if="focusTask">
				<!-- one tap from "I see the task" to "I am working on it" -->
				<VBtn
					v-if="focusMode !== 'now'"
					color="primary"
					size="large"
					prependIcon="fa-play"
					@click="start(focusTask)"
				>
					{{ $t('home.start') }}
				</VBtn>
				<template v-else>
					<VBtn
						color="successDark"
						size="large"
						prependIcon="fa-check"
						@click="finish(focusTask)"
					>
						{{ $t('home.finish') }}
					</VBtn>
					<VBtn
						variant="tonal"
						color="primaryOutline"
						size="large"
						prependIcon="fa-stopwatch"
						@click="openTracker(focusTask)"
					>
						{{ $t('home.track') }}
					</VBtn>
				</template>

				<VMenu location="bottom end">
					<template #activator="{ props: menuProps }">
						<VIconBtn
							v-bind="menuProps"
							icon="fa-ellipsis-vertical"
							variant="text"
						/>
					</template>
					<VList density="compact">
						<VListSubheader>{{ $t('home.moveLater') }}</VListSubheader>
						<VListItem
							v-for="minutes in snoozeOptions"
							:key="minutes"
							:title="`+${minutesLabel(minutes)}`"
							prependIcon="fa-clock-rotate-left"
							@click="snoozeTask(focusTask, minutes)"
						/>
						<VDivider class="my-1" />
						<VListSubheader>{{ $t('home.skip') }}</VListSubheader>
						<VListItem
							v-for="reason in skipReasons"
							:key="reason"
							:title="$t(`home.skipReason.${reason}`)"
							prependIcon="fa-forward"
							@click="skipTask(focusTask, $t(`home.skipReason.${reason}`))"
						/>
					</VList>
				</VMenu>
			</template>

			<VBtn
				v-else-if="!calendar"
				color="primary"
				size="large"
				prependIcon="fa-wand-magic-sparkles"
				@click="openPlanner"
			>
				{{ $t('home.planToday') }}
			</VBtn>

			<VChip
				v-if="streakStore.displayedStreak > 0"
				color="warning"
				variant="tonal"
				size="small"
				prependIcon="fas fa-fire"
			>
				{{ streakStore.displayedStreak }}
			</VChip>
		</div>

		<TrackTimeDialog
			v-if="trackedTask"
			v-model="trackerOpen"
			:activityId="trackedTask.activity.id"
			:activityName="trackedTask.activity.name"
			initialMethod="timer"
			:initialLength="remainingLength(trackedTask)"
			@started="handleTrackingStarted"
			@done="reload"
		/>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import TrackTimeDialog from '@/core/activityHistory/component/TrackTimeDialog.vue'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { requestNotificationPermission } from '@/_common/utils/notifications.ts'
	import { useTodayPlan } from '@/core/home/composable/useTodayPlan.ts'

	const router = useRouter()
	const { t, locale } = useI18n()
	const {
		now,
		calendar,
		focusTask,
		focusMode,
		activeTask,
		nextTask,
		lastMissedTask,
		activeProgress,
		overrunMinutes,
		nowMinutes,
		todayUrlDate,
		streakStore,
		taskColor,
		minutesLabel,
		startTask,
		finishTask,
		skipTask,
		snoozeTask,
		ensureLoaded,
		reload,
	} = useTodayPlan()

	const snoozeOptions = [15, 30, 60]
	const skipReasons = ['noTime', 'notRelevant', 'noEnergy'] as const

	const trackerOpen = ref(false)
	const trackedTask = ref<PlannerTask | null>(null)
	const { markInProgress } = useTaskPlannerCrud()

	const dateLocale = computed(() => (locale.value === 'EN' ? 'en-GB' : 'sk-SK'))
	const weekdayLabel = computed(() => now.value.toLocaleDateString(dateLocale.value, { weekday: 'long' }))
	const dateLabel = computed(() => now.value.toLocaleDateString(dateLocale.value, { day: 'numeric', month: 'long' }))

	const accentColor = computed(() =>
		focusMode.value === 'missed' ? 'error' : focusMode.value === 'allDone' ? 'success' : 'primary',
	)
	const modeIcon = computed(() => {
		switch (focusMode.value) {
			case 'now':
				return 'fa-play'
			case 'upNext':
				return 'fa-forward'
			case 'missed':
				return 'fa-triangle-exclamation'
			default:
				return 'fa-champagne-glasses'
		}
	})
	const headline = computed(() => {
		if (focusTask.value) return focusTask.value.activity.name
		return calendar.value ? t('home.allDoneLong') : t('home.noCalendar')
	})
	const countdown = computed(() => {
		if (activeTask.value) {
			return overrunMinutes.value > 0
				? ''
				: t('home.endsIn', { time: minutesLabel(activeTask.value.endTime.getInMinutes - nowMinutes.value) })
		}
		if (nextTask.value) {
			return t('home.startsIn', { time: minutesLabel(nextTask.value.startTime.getInMinutes - nowMinutes.value) })
		}
		if (lastMissedTask.value) {
			return t('home.wasDue', {
				time: minutesLabel(nowMinutes.value - lastMissedTask.value.endTime.getInMinutes),
			})
		}
		return ''
	})

	function remainingLength(task: PlannerTask): Time {
		const remaining = task.endTime.getInMinutes - nowMinutes.value
		return Time.fromMinutes(remaining > 0 ? remaining : task.endTime.getInMinutes - task.startTime.getInMinutes)
	}

	async function start(task: PlannerTask) {
		// Browsers only grant the permission from a gesture, so ask on the first deliberate start.
		void requestNotificationPermission()
		await startTask(task)
	}

	async function finish(task: PlannerTask) {
		await finishTask(task)
	}

	function handleTrackingStarted(actualStartTime: Time) {
		if (trackedTask.value) {
			void markInProgress(trackedTask.value.id, actualStartTime)
		}
	}

	function openTracker(task: PlannerTask) {
		trackedTask.value = task
		trackerOpen.value = true
	}

	function openPlanner() {
		router.push({ name: 'dayPlanner', params: { date: todayUrlDate } })
	}

	onMounted(ensureLoaded)
</script>

<style scoped>
	.nowbar {
		position: relative;
		overflow: hidden;
	}

	.nowbar--missed {
		background: rgba(var(--v-theme-error), 0.07);
	}

	.nowbar__progress {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
	}

	.nowbar__kicker {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.75;
	}

	.nowbar__date {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		flex-shrink: 0;
		line-height: 1.15;
	}

	.nowbar__weekday {
		font-size: 1.5rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.nowbar__day {
		font-size: 0.95rem;
		opacity: 0.65;
	}

	.nowbar__title {
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
