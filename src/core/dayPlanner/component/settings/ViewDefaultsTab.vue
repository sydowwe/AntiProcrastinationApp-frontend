<template>
	<VCard
		variant="outlined"
		color="secondaryOutline"
		class="pa-4 d-flex flex-column ga-2"
		style="max-width: 480px"
	>
		<VSwitch
			v-model="settingsStore.detailsPanelExpandedByDefault"
			:label="$t('planner.settings.detailsPanelDefault')"
			color="successDark"
			hideDetails
		/>
		<VSwitch
			v-model="settingsStore.arrowKeyNavEnabled"
			:label="$t('planner.settings.arrowKeyNav')"
			color="successDark"
			hideDetails
		/>
		<div class="d-flex align-center ga-3 pt-1">
			<span class="text-body-2">{{ $t('planner.settings.slotSize') }}</span>
			<VBtnToggle
				v-model="settingsStore.slotDurationMinutes"
				mandatory
				color="primary"
				density="compact"
			>
				<VBtn :value="5">{{ $t('planner.settings.minutesValue', { n: 5 }) }}</VBtn>
				<VBtn :value="10">{{ $t('planner.settings.minutesValue', { n: 10 }) }}</VBtn>
				<VBtn :value="15">{{ $t('planner.settings.minutesValue', { n: 15 }) }}</VBtn>
				<VBtn :value="30">{{ $t('planner.settings.minutesValue', { n: 30 }) }}</VBtn>
			</VBtnToggle>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'

	const settingsStore = useDayPlannerSettingsStore()
</script>
