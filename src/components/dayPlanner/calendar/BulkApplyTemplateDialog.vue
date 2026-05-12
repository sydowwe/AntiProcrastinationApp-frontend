<template>
	<MyDialog
		v-model="dialog"
		:title="`Apply Template to ${selectedCount} day(s)`"
		:confirmBtnDisabled="!selectedTemplateId"
		confirmBtnLabel="Apply"
		@confirmed="handleConfirm"
	>
		<div class="d-flex flex-column ga-4 pt-2">
			<VSelect
				v-model="selectedTemplateId"
				label="Template"
				:items="activeTemplates"
				itemValue="id"
				itemTitle="name"
				hideDetails
			/>
			<VSelect
				v-model="conflictResolution"
				label="Conflict resolution"
				:items="conflictResolutionOptions"
				hideDetails
			/>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'

	defineProps<{
		selectedCount: number
		activeTemplates: TaskPlannerDayTemplate[]
	}>()

	const emit = defineEmits<{
		apply: [templateId: number, conflictResolution: ApplyTemplateConflictResolution]
	}>()

	const dialog = defineModel<boolean>({ required: true })

	const selectedTemplateId = ref<number | null>(null)
	const conflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')

	function handleConfirm() {
		if (!selectedTemplateId.value) return
		emit('apply', selectedTemplateId.value, conflictResolution.value)
	}
</script>
