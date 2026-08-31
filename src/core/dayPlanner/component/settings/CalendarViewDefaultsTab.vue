<template>
	<VCard
		variant="outlined"
		color="secondaryOutline"
		class="pa-4 d-flex flex-column ga-4"
		style="max-width: 480px"
	>
		<VIdAutocomplete
			v-model="settingsStore.defaultApplyTemplateId"
			:items="activeTemplates"
			:label="$t('planner.settings.defaultTemplateLabel')"
			clearable
			hideDetails
		/>
		<VSelect
			v-model="settingsStore.defaultConflictResolution"
			:items="conflictResolutionOptions"
			:label="$t('planner.settings.defaultConflictResolutionLabel')"
			hideDetails
		/>
		<VSwitch
			v-model="settingsStore.defaultApplyPreviewMode"
			:label="$t('planner.settings.defaultPreviewModeLabel')"
			color="successDark"
			hideDetails
		/>
	</VCard>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'

	const settingsStore = useDayPlannerSettingsStore()
	const { fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')
	const activeTemplates = ref<TaskPlannerDayTemplate[]>([])

	onMounted(async () => {
		activeTemplates.value = (await fetchAllTemplates()).filter(t => t.isActive)
	})
</script>
