<template>
	<ActionBar :isShown @cancel="emit('cancel')">
		<VAutocomplete
			v-model="templateId"
			:items="activeTemplates"
			itemTitle="name"
			itemValue="id"
			label="Select template"
			density="compact"
			hideDetails
			minWidth="200"
		/>
		<VBtnToggle
			v-model="previewMode"
			mandatory
			density="compact"
			divided
			color="secondary"
		>
			<VBtn :value="true">Preview</VBtn>
			<VBtn :value="false">Apply</VBtn>
		</VBtnToggle>
		<VSelect
			v-if="!previewMode"
			v-model="conflictResolution"
			label="Conflict resolution"
			:items="conflictResolutionOptions"
			density="compact"
			hideDetails
			minWidth="185"
		/>
	</ActionBar>
</template>

<script setup lang="ts">
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import ActionBar from '@/components/general/ActionBar.vue'

	const { isShown, activeTemplates } = defineProps<{
		isShown: boolean
		activeTemplates: TaskPlannerDayTemplate[]
	}>()

	const emit = defineEmits<{ cancel: [] }>()

	const templateId = defineModel<number | null>('templateId')
	const previewMode = defineModel<boolean>('previewMode')
	const conflictResolution = defineModel<ApplyTemplateConflictResolution>('conflictResolution')

	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')
</script>
