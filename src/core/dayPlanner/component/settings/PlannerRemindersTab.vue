<template>
	<VCard
		variant="outlined"
		color="secondaryOutline"
		class="pa-4 d-flex flex-column ga-4"
		style="max-width: 480px"
	>
		<VSwitch
			v-model="settingsStore.remindersEnabled"
			:label="$t('planner.nudges.enable')"
			color="successDark"
			hideDetails
		/>
		<div class="d-flex align-center ga-4">
			<span
				class="text-body-2"
				:class="{ 'text-disabled': !leadInUse }"
			>
				{{ $t('planner.nudges.leadLabel') }}
			</span>
			<!-- The lead is also what every automatic reminder is created with (P1-03), so it stays
			     editable while either of its two users is on. -->
			<VNumberInput
				v-model="settingsStore.reminderMinutesBefore"
				:min="1"
				:max="60"
				:suffix="$t('planner.nudges.minutesSuffix')"
				:disabled="!leadInUse"
				hideDetails
				style="width: 160px"
				density="comfortable"
			/>
		</div>
		<!-- B2: this switch is NOT a kill switch for reminders, and used to read like one. It
		     drives the in-tab nudge in `useTaskReminders` and — server-side — only prefills the
		     default lead time when a task-linked reminder is created without one. The single
		     switch that stops a reminder from being delivered is the ("Portal",
		     "PersonalReminder") row on the reminder preferences page, linked below by route
		     name. See `prompts/user/backend/B2-preference-ownership.md`. -->
		<p class="text-body-2 text-medium-emphasis">
			{{ $t('planner.nudges.explainer') }}
		</p>

		<VDivider />

		<!-- P1-03: unlike the switch above, this one creates real reminders — delivered with the app
		     closed, at the lead time above, under their own kind ("PlannedBlockStarting") so they can
		     be muted on the reminder preferences page without muting the ones the user wrote. -->
		<div class="d-flex flex-column ga-2">
			<span class="text-subtitle-2">{{ $t('planner.autoReminders.title') }}</span>
			<VSelect
				v-model="settingsStore.autoReminderMode"
				:items="modeOptions"
				:label="$t('planner.autoReminders.modeLabel')"
				hideDetails
				density="comfortable"
			/>
			<VSelect
				v-if="settingsStore.autoReminderMode === AutoReminderMode.ImportantOnly"
				v-model="settingsStore.autoReminderMinImportance"
				:items="importanceOptions"
				:label="$t('planner.autoReminders.minImportanceLabel')"
				:hint="$t('planner.autoReminders.minImportanceHint')"
				persistentHint
				density="comfortable"
			/>
			<p class="text-body-2 text-medium-emphasis">
				{{ $t('planner.autoReminders.explainer') }}
			</p>
		</div>

		<p class="text-body-2 text-medium-emphasis">
			{{ $t('planner.nudges.realRemindersHint') }}
			<RouterLink :to="{ name: 'reminderPreferences' }">
				{{ $t('planner.nudges.reminderPreferencesLink') }}
			</RouterLink>
		</p>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useTaskImportanceCrud } from '@/core/dayPlanner/api/taskImportanceApi.ts'
	import { AutoReminderMode } from '@/core/dayPlanner/dto/enum/AutoReminderMode.ts'
	import type { TaskImportance } from '@/core/dayPlanner/dto/response/TaskImportance.ts'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'

	const settingsStore = useDayPlannerSettingsStore()
	const { fetchAll } = useTaskImportanceCrud()

	const modeOptions = getEnumSelectOptions(AutoReminderMode, 'planner.autoReminders.mode')
	const importances = ref<TaskImportance[]>([])

	const leadInUse = computed(
		() => settingsStore.remindersEnabled || settingsStore.autoReminderMode !== AutoReminderMode.Off,
	)

	// The setting stores an importance *value*, not a level id (deleting a level never orphans it): the
	// chosen level and every level ranked above it qualify. The Optional level never does, so it is not
	// offered.
	const importanceOptions = computed(() =>
		importances.value
			.filter(level => !level.isOptionalMarker)
			.sort((a, b) => b.importance - a.importance)
			.map(level => ({ value: level.importance, title: level.text })),
	)

	onMounted(async () => {
		importances.value = await fetchAll()
	})
</script>
