<!--
	Every action a planner task supports, in one menu, so that what you can do to a task no longer
	depends on which widget you happened to open it from. Before this, "give it longer" existed only
	in the planner's focus block and "move later" / "skip" only in the now bar's menu.

	Which items show is a function of the task's own state, never of the caller — a caller that could
	choose would let the two menus drift apart again.
-->
<template>
	<VMenu
		v-if="!isFinished(task)"
		location="bottom end"
	>
		<template #activator="{ props: menuProps }">
			<!-- Named after the task it acts on: several of these are on screen at once, and
				 "button, button, button" down a list tells a screen-reader user nothing. -->
			<VIconBtn
				v-bind="menuProps"
				icon="fa-ellipsis-vertical"
				variant="text"
				:size
				:title="buttonTitle"
				:aria-label="actionsLabel"
				@click.stop
			/>
		</template>
		<VList density="compact">
			<VListItem
				v-if="!isRunning(task)"
				prependIcon="fa-play"
				:title="$t('home.start')"
				@click="startTask(task)"
			/>
			<VListItem
				prependIcon="fa-check"
				:title="$t('home.finish')"
				@click="finishTask(task)"
			/>
			<VListItem
				prependIcon="fa-stopwatch"
				:title="$t('home.track')"
				@click="openTracker(task)"
			/>

			<template v-if="isRunning(task)">
				<VDivider class="my-1" />
				<VListSubheader>{{ $t('home.giveLonger') }}</VListSubheader>
				<VListItem
					v-for="minutes in EXTEND_OPTIONS"
					:key="`extend-${minutes}`"
					:title="`+${minutesLabel(minutes)}`"
					prependIcon="fa-hourglass-half"
					@click="extendTask(task, minutes)"
				/>
			</template>

			<VDivider class="my-1" />
			<VListSubheader>{{ $t('home.moveLater') }}</VListSubheader>
			<VListItem
				v-for="minutes in SNOOZE_OPTIONS"
				:key="`snooze-${minutes}`"
				:title="`+${minutesLabel(minutes)}`"
				prependIcon="fa-clock-rotate-left"
				@click="snoozeTask(task, minutes)"
			/>

			<VDivider class="my-1" />
			<VListSubheader>{{ $t('home.skip') }}</VListSubheader>
			<VListItem
				v-for="reason in SKIP_REASONS"
				:key="reason"
				:title="$t(`home.skipReason.${reason}`)"
				prependIcon="fa-forward"
				@click="skipTask(task, $t(`home.skipReason.${reason}`))"
			/>
		</VList>
	</VMenu>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	// Imported directly rather than via `useTodayPlan()`: this renders once per task row, and each
	// `useTodayPlan()` call registers a `useDashboardRefresh` consumer that resets the entry's
	// staleness clock. See the note above `nowMinutes` in useTodayPlan.ts.
	import {
		EXTEND_OPTIONS,
		extendTask,
		finishTask,
		isFinished,
		isRunning,
		minutesLabel,
		SKIP_REASONS,
		skipTask,
		SNOOZE_OPTIONS,
		snoozeTask,
		startTask,
	} from '@/core/home/composable/useTodayPlan.ts'
	import { openTracker } from '@/core/home/composable/useTaskTracker.ts'

	const {
		task,
		size = 'default',
		shortcutHint,
	} = defineProps<{
		task: PlannerTask
		size?: 'x-small' | 'small' | 'default'
		/**
		 * Appended to the button's tooltip, never to its accessible name, and never to the items.
		 * The home page's keyboard shortcuts act on the focus task only, so the one caller that
		 * renders this menu for the focus task is the one caller that may advertise them — which
		 * items the menu shows still depends on the task alone.
		 */
		shortcutHint?: string
	}>()

	const { t } = useI18n()

	const actionsLabel = computed(() => t('home.taskActions', { task: task.activity.name }))
	const buttonTitle = computed(() => (shortcutHint ? `${actionsLabel.value} — ${shortcutHint}` : actionsLabel.value))
</script>
