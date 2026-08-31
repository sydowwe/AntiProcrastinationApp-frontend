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
				:class="{ 'text-disabled': !settingsStore.remindersEnabled }"
			>
				{{ $t('planner.nudges.leadLabel') }}
			</span>
			<VNumberInput
				v-model="settingsStore.reminderMinutesBefore"
				:min="1"
				:max="60"
				:suffix="$t('planner.nudges.minutesSuffix')"
				:disabled="!settingsStore.remindersEnabled"
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
		<p class="text-body-2 text-medium-emphasis">
			{{ $t('planner.nudges.realRemindersHint') }}
			<RouterLink :to="{ name: 'reminderPreferences' }">
				{{ $t('planner.nudges.reminderPreferencesLink') }}
			</RouterLink>
		</p>
	</VCard>
</template>

<script setup lang="ts">
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'

	const settingsStore = useDayPlannerSettingsStore()
</script>
