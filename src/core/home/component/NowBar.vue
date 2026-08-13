<!--
	NowBar owns the focus task. That is the decision behind this file and DayPlannerWidget, and it was
	made because the two used to render the focus task twice, ~200px apart, with a duplicated
	countdown, two mode-icon switches that disagreed, and two different sets of available actions.

	Why this side owns it: the now bar is above the fold and full width, and answering "what do I do
	right now" is the whole reason the home page opens with it. The planner card is the list view of
	the same day — a list, a day strip, and per-row actions. So:

	  - the focus task, its countdown, its progress and its actions live here, and only here;
	  - DayPlannerWidget renders no focus block at all;
	  - `extendTask`, which used to be reachable only from the planner, is in the shared
	    TaskActionMenu, as are snooze and skip, which used to be reachable only from here.

	The derivations both sides need (`focusIcon`, `focusCountdown`) sit in useTodayPlan.ts so there is
	exactly one definition of each.
-->
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

			<template v-if="error && !focusTask">
				<VIcon
					icon="fa-triangle-exclamation"
					color="error"
					size="20"
				/>
				<div
					class="flex-grow-1 nowbar__title"
					style="min-width: 0"
				>
					{{ $t('home.loadFailedPlan') }}
				</div>
				<VBtn
					variant="tonal"
					color="primaryOutline"
					size="large"
					prependIcon="fa-rotate-right"
					@click="reload"
				>
					{{ $t('home.retry') }}
				</VBtn>
			</template>
			<template v-else>
				<VAvatar
					:color="accentColor"
					variant="tonal"
					rounded="lg"
					size="44"
				>
					<VIcon
						:icon="focusIcon"
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
							v-if="focusCountdown"
							class="text-caption font-weight-bold"
						>
							· {{ focusCountdown }}
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
					<div
						v-if="focusTask"
						class="text-caption text-medium-emphasis"
					>
						{{ focusTask.startTime.getString() }} – {{ focusTask.endTime.getString() }} ·
						{{ durationLabel(focusTask) }}
					</div>
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
							@click="finishTask(focusTask)"
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

					<!-- everything else the task supports, identical to the planner rows' menu -->
					<TaskActionMenu :task="focusTask" />
				</template>

				<VBtn
					v-else-if="!hasPlan"
					color="primary"
					size="large"
					prependIcon="fa-wand-magic-sparkles"
					@click="openPlanner"
				>
					{{ $t('home.planToday') }}
				</VBtn>
			</template>

			<!-- rendered as-is: a broken streak already arrives as 0 -->
			<VChip
				v-if="streak.currentStreak > 0"
				color="warning"
				variant="tonal"
				size="small"
				prependIcon="fas fa-fire"
			>
				{{ streak.currentStreak }}
			</VChip>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { requestNotificationPermission } from '@/_common/utils/notifications.ts'
	import { useTodayPlan } from '@/core/home/composable/useTodayPlan.ts'
	import { userTimeZone } from '@/_common/composable/general/useUserClock.ts'
	import { useTaskTracker } from '@/core/home/composable/useTaskTracker.ts'
	import TaskActionMenu from '@/core/home/component/TaskActionMenu.vue'
	import { localeTag } from '@/i18n.ts'

	const router = useRouter()
	const { t, locale } = useI18n()
	const {
		now,
		hasPlan,
		focusTask,
		focusMode,
		focusIcon,
		focusCountdown,
		overrunMinutes,
		activeProgress,
		todayUrlDate,
		streak,
		error,
		taskColor,
		minutesLabel,
		durationLabel,
		startTask,
		finishTask,
		reload,
	} = useTodayPlan()
	const { openTracker } = useTaskTracker()

	const dateLocale = computed(() => localeTag(locale.value))
	// `timeZone` matters here for the same reason it does everywhere else on this page: the headline
	// date must name the day the rest of the bar is describing, not the day the browser is having.
	const weekdayLabel = computed(() =>
		now.value.toLocaleDateString(dateLocale.value, { weekday: 'long', timeZone: userTimeZone.value }),
	)
	const dateLabel = computed(() =>
		now.value.toLocaleDateString(dateLocale.value, {
			day: 'numeric',
			month: 'long',
			timeZone: userTimeZone.value,
		}),
	)

	const accentColor = computed(() =>
		focusMode.value === 'missed' ? 'error' : focusMode.value === 'allDone' ? 'success' : 'primary',
	)
	const headline = computed(() => {
		if (focusTask.value) return focusTask.value.activity.name
		// `hasPlan`, not the calendar: a seeded-but-untouched day has a calendar and no plan, and
		// would otherwise be congratulated for finishing a day it never started.
		return hasPlan.value ? t('home.allDoneLong') : t('home.noPlanToday')
	})

	// Browsers only grant the permission from a gesture, and only the first ask can be granted — a
	// repeat request after a decision is a no-op. Guard it anyway so the code does what it says.
	let permissionAsked = false

	async function start(task: PlannerTask) {
		if (!permissionAsked) {
			permissionAsked = true
			void requestNotificationPermission()
		}
		await startTask(task)
	}

	function openPlanner() {
		router.push({ name: 'dayPlanner', params: { date: todayUrlDate.value } })
	}
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
