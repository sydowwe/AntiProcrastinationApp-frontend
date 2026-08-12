<template>
	<div class="home py-4 w-100 d-flex flex-column">
		<!-- what to do right now, above everything else -->
		<NowBar class="mx-2 mb-2 flex-shrink-0" />
		<div class="home__region home__region--main">
			<VRow
				class="ma-0 h-100"
				align="stretch"
			>
				<VCol
					cols="12"
					md="6"
					class="home__col"
				>
					<DayPlannerWidget class="h-100" />
				</VCol>
				<VCol
					cols="12"
					md="6"
					class="home__col"
				>
					<RoutineTodoWidget class="h-100" />
				</VCol>
			</VRow>
		</div>
		<div class="home__region home__region--band">
			<VRow
				class="ma-0 h-100"
				align="stretch"
			>
				<VCol
					cols="12"
					md="3"
					class="home__col"
				>
					<QuickRecordWidget class="h-100" />
				</VCol>
				<VCol
					cols="12"
					md="4"
					class="home__col"
				>
					<ActivityHistoryWidget class="h-100" />
				</VCol>
				<VCol
					cols="12"
					md="5"
					class="home__col"
				>
					<TodoListWidget class="h-100" />
				</VCol>
			</VRow>
		</div>

		<!--
			One timer for the page. "Track this task" is offered by the now bar and by every planner
			row through the shared TaskActionMenu; they all drive this instance via `useTaskTracker`,
			so the action does not belong to whichever widget happens to host a dialog.
		-->
		<TrackTimeDialog
			v-if="trackedTask"
			v-model="isOpen"
			:activityId="trackedTask.activity.id"
			:activityName="trackedTask.activity.name"
			initialMethod="timer"
			:initialLength="remainingLength(trackedTask)"
			@started="handleTrackingStarted"
			@done="notifyTrackingSessionFinished"
		/>
	</div>
</template>

<script setup lang="ts">
	import TrackTimeDialog from '@/core/activityHistory/component/TrackTimeDialog.vue'
	import { useTaskTracker } from '@/core/home/composable/useTaskTracker.ts'
	// A finished timer changes the plan AND the history pie, which lives in another widget. One
	// signal, both subscribers — see useDashboardRefresh.
	import { notifyTrackingSessionFinished } from '@/core/home/composable/useDashboardRefresh.ts'
	import { useHomeShortcuts } from '@/core/home/composable/useHomeShortcuts.ts'
	import NowBar from '@/core/home/component/NowBar.vue'
	import DayPlannerWidget from '@/core/home/component/DayPlannerWidget.vue'
	import RoutineTodoWidget from '@/core/home/component/RoutineTodoWidget.vue'
	import ActivityHistoryWidget from '@/core/home/component/ActivityHistoryWidget.vue'
	import QuickRecordWidget from '@/core/home/component/QuickRecordWidget.vue'
	import TodoListWidget from '@/core/home/component/TodoListWidget.vue'

	const { isOpen, trackedTask, remainingLength, handleTrackingStarted } = useTaskTracker()

	// Bound here rather than in a widget, for the same reason the dialog is mounted here: the
	// shortcuts act on the focus task, which the bar and the planner both render, and the view is the
	// one thing on this page guaranteed to exist exactly once.
	useHomeShortcuts()
</script>

<style scoped>
	/*
	 * Mobile first, and that is the point: below `md` this is an ordinary stacked page. The column
	 * takes its content height, the app container (App.vue's VContainer, `overflow-y: auto`) scrolls
	 * it, and every widget is full width. `align-self` opts out of that container's stretch, so the
	 * column may grow past the viewport instead of overflowing a box pinned to it.
	 */
	.home {
		align-self: flex-start;
		min-height: 100%;
	}

	/*
	 * From `md` up — Vuetify's own breakpoint, the one the `md` column props switch on — the dashboard
	 * becomes the whole-page, no-scroll layout: everything visible at once, nothing to scroll to. That
	 * is a desktop affordance and it does not survive being made narrow, which is why none of the
	 * rules below reach a phone.
	 *
	 * The band scales with the screen, but in `vh` rather than `%`: a percentage basis needs a
	 * definite height on every ancestor up to VMain and silently falls back to content sizing when it
	 * does not get one, which is what clipped these widgets. `vh` is always definite. The clamp keeps
	 * the band usable on a laptop and stops it eating the page on a tall monitor, and `0 1` still lets
	 * it shrink — the widgets inside are built to shrink with it.
	 *
	 * `height: 100%` on the columns is load-bearing for the same reason: without it the cards' own
	 * `h-100` has no definite parent height to resolve against and falls back to content height,
	 * overflowing the band. Below `md` that fallback is precisely what we want — the card grows and
	 * the page scrolls — so the rule is scoped here rather than deleted.
	 */
	@media (min-width: 960px) {
		.home {
			align-self: stretch;
			height: 100%;
		}

		.home__region--main {
			flex: 1 1 0;
			min-height: 0;
			overflow: hidden;
		}

		.home__region--band {
			flex: 0 1 clamp(240px, 33vh, 420px);
			min-height: 0;
			overflow: hidden;
		}

		.home__col {
			min-height: 0;
			height: 100%;
		}
	}
</style>
