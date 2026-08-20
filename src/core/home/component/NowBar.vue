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

		<!--
			Two blocks, not one row of nine children: from `md` up they sit side by side and read as the
			single row this has always been, and below it they stack — the state on top, the actions
			under it at full width. A phone cannot show a date, an avatar, a headline, three buttons and
			a menu on one line, and shrinking them until it fits is how the headline ended up as an
			ellipsis next to three `size="large"` buttons.
		-->
		<div class="nowbar__inner px-4 py-3">
			<div class="nowbar__state">
				<div class="nowbar__date">
					<span class="nowbar__weekday">{{ weekdayLabel }}</span>
					<span class="nowbar__day">{{ dateLabel }}</span>
				</div>
				<VDivider
					vertical
					class="nowbar__divider"
				/>

				<template v-if="showError">
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
						<div class="d-flex align-center flex-wrap ga-2">
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
				</template>

				<!--
					The way back to a timer that is running somewhere else. Timing sessions survive
					navigation now, which is only half the fix: a session you cannot see is a session
					you forget to stop. This is the visible half — it sits on the one bar that is
					above the fold on the page the app opens with, and it is the only place outside
					the timer views themselves that says a session exists at all.
				-->
				<VChip
					v-if="timerKind"
					:color="timerChipColor"
					variant="tonal"
					size="small"
					link
					:prependIcon="timerIcon"
					:title="timerLabel"
					:aria-label="timerLabel"
					@click="openRunningTimer"
				>
					{{ timerClock }}
				</VChip>

				<!-- rendered as-is: a broken streak already arrives as 0 -->
				<VChip
					v-if="streak.currentStreak > 0"
					color="warning"
					variant="tonal"
					size="small"
					prependIcon="fas fa-fire"
					:title="streakLabel"
					:aria-label="streakLabel"
				>
					{{ streak.currentStreak }}
				</VChip>
			</div>

			<div
				v-if="showError || focusTask || !hasPlan"
				class="nowbar__actions"
			>
				<VBtn
					v-if="showError"
					class="nowbar__action"
					variant="tonal"
					color="primaryOutline"
					:size="buttonSize"
					prependIcon="fa-rotate-right"
					@click="reload"
				>
					{{ $t('home.retry') }}
				</VBtn>
				<template v-else-if="focusTask">
					<!-- one tap from "I see the task" to "I am working on it" -->
					<VBtn
						v-if="focusMode !== 'now'"
						class="nowbar__action"
						color="primary"
						:size="buttonSize"
						prependIcon="fa-play"
						:title="withShortcut($t('home.start'), HOME_SHORTCUT_KEYS.start)"
						@click="start(focusTask)"
					>
						{{ $t('home.start') }}
					</VBtn>
					<template v-else>
						<VBtn
							class="nowbar__action"
							color="successDark"
							:size="buttonSize"
							prependIcon="fa-check"
							:title="withShortcut($t('home.finish'), HOME_SHORTCUT_KEYS.finish)"
							@click="finishTask(focusTask)"
						>
							{{ $t('home.finish') }}
						</VBtn>
						<VBtn
							class="nowbar__action"
							variant="tonal"
							color="primaryOutline"
							:size="buttonSize"
							prependIcon="fa-stopwatch"
							:title="withShortcut($t('home.track'), HOME_SHORTCUT_KEYS.track)"
							@click="openTracker(focusTask)"
						>
							{{ $t('home.track') }}
						</VBtn>
					</template>

					<!-- everything else the task supports, identical to the planner rows' menu -->
					<TaskActionMenu
						:task="focusTask"
						:shortcutHint="withShortcut($t('home.moveLater'), HOME_SHORTCUT_KEYS.snooze)"
					/>
				</template>

				<VBtn
					v-else-if="!hasPlan"
					class="nowbar__action"
					color="primary"
					:size="buttonSize"
					prependIcon="fa-wand-magic-sparkles"
					:title="withShortcut($t('home.planToday'), HOME_SHORTCUT_KEYS.planner)"
					@click="openPlanner"
				>
					{{ $t('home.planToday') }}
				</VBtn>
			</div>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { useDisplay } from 'vuetify/framework'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { requestNotificationPermission } from '@/_common/utils/notifications.ts'
	import { useTodayPlan } from '@/core/home/composable/useTodayPlan.ts'
	import { userTimeZone } from '@/_common/composable/general/useUserClock.ts'
	import { useTaskTracker } from '@/core/home/composable/useTaskTracker.ts'
	import { HOME_SHORTCUT_KEYS, withShortcut } from '@/core/home/composable/useHomeShortcuts.ts'
	import TaskActionMenu from '@/core/home/component/TaskActionMenu.vue'
	// A store from another module, which the boundary rule normally forbids — home is the app's
	// composition layer and is allowed to be coupled to the modules it surfaces (see home.routes.ts).
	import { TIMER_ROUTE_NAME, useRunningTimerStore } from '@/core/activityHistory/store/runningTimerStore.ts'
	import { TIMER_KIND_LABEL_KEY } from '@/core/activityHistory/composable/useTimerSessionGuard.ts'
	import { localeTag } from '@/i18n.ts'

	const router = useRouter()
	const { t, locale } = useI18n()
	const { mdAndUp } = useDisplay()
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

	// Stacked and full width, the buttons no longer need the extra height to be easy to hit; `large`
	// on a phone just costs the two lines above them their room.
	const buttonSize = computed(() => (mdAndUp.value ? 'large' : 'default'))
	// One condition, read twice — the state block and the action block are separate elements now, and
	// both branch on it.
	const showError = computed(() => error.value && !focusTask.value)
	const streakLabel = computed(() => `${t('home.streaks')}: ${streak.value.currentStreak}`)

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

	// ---------------------------------------------------------------- running timer

	const timerStore = useRunningTimerStore()

	const TIMER_ICON: Record<string, string> = {
		stopwatch: 'fas fa-stopwatch',
		timer: 'fas fa-hourglass-half',
		pomodoro: 'fas fa-circle-dot',
	}

	const timerKind = computed(() => timerStore.activeKind)
	const timerIcon = computed(() => (timerKind.value ? TIMER_ICON[timerKind.value] : undefined))
	const timerChipColor = computed(() => {
		if (timerStore.isEnded) return 'success'
		return timerStore.isPaused ? 'textMuted' : 'primary'
	})

	/**
	 * A digit clock rather than `formatDuration`'s "1h 20m": this one is ticking, and a label that
	 * rounds away the seconds looks stuck.
	 */
	const timerClock = computed(() => {
		const total = Math.max(0, timerStore.displaySeconds)
		const hours = Math.floor(total / 3600)
		const minutes = Math.floor((total % 3600) / 60)
		const seconds = total % 60
		const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
		return hours > 0 ? `${hours}:${mmss}` : mmss
	})

	const timerLabel = computed(() => {
		const kind = timerKind.value
		if (kind === null) return ''
		const what = timerStore.activityName || t(TIMER_KIND_LABEL_KEY[kind])
		if (timerStore.isEnded) return t('home.timerFinished', { activity: what })
		return t(timerStore.isPaused ? 'home.timerPaused' : 'home.timerRunning', { activity: what })
	})

	function openRunningTimer() {
		const kind = timerKind.value
		if (kind === null) return
		router.push({ name: TIMER_ROUTE_NAME[kind] })
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

	/*
	 * Mobile first: state on one line-group, actions stacked under it at full width. The `md` block at
	 * the bottom of this file folds the two back into the single row the bar is on a desktop.
	 */
	.nowbar__inner {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.nowbar__state {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	/* Nothing to separate once the date is one compact line — it is only clutter at this width. */
	.nowbar__divider {
		display: none;
	}

	.nowbar__actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* Share the width evenly; the action menu keeps its intrinsic width beside them. */
	.nowbar__action {
		flex: 1 1 0;
		min-width: 0;
	}

	.nowbar__kicker {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.75;
	}

	/*
	 * One line on a phone — "Thursday 13 August" reads the same and costs a third of the height. The
	 * `md` block turns it back into the two-line date block that anchors the desktop bar.
	 */
	.nowbar__date {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 6px;
		/* Shrinkable, so on a narrow phone it folds back to two lines rather than squeezing the
		   headline next to it down to nothing. */
		flex-shrink: 1;
		line-height: 1.15;
	}

	.nowbar__weekday {
		font-size: 1.05rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.nowbar__day {
		font-size: 0.85rem;
		opacity: 0.65;
	}

	/*
	 * Wraps to two lines on a phone rather than ellipsising at ~10 characters. It is the task's name:
	 * the one thing on this bar that must be readable, and the widest thing on it.
	 */
	.nowbar__title {
		font-size: 1.1rem;
		font-weight: 700;
		line-height: 1.2;
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	@media (min-width: 960px) {
		.nowbar__inner {
			flex-direction: row;
			align-items: center;
			gap: 16px;
		}

		.nowbar__state {
			flex: 1 1 auto;
			gap: 16px;
		}

		.nowbar__actions {
			flex: 0 0 auto;
		}

		.nowbar__action {
			flex: 0 0 auto;
		}

		.nowbar__divider {
			display: block;
		}

		.nowbar__date {
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: flex-start;
			flex-shrink: 0;
		}

		.nowbar__weekday {
			font-size: 1.5rem;
		}

		.nowbar__day {
			font-size: 0.95rem;
		}

		.nowbar__title {
			font-size: 1.35rem;
			display: block;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
</style>
