<template>
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
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'

	const { activeTemplates } = defineProps<{
		activeTemplates: TaskPlannerDayTemplate[]
	}>()

	const dialogApi = useDialogApi<{ templateId: number; conflictResolution: ApplyTemplateConflictResolution }>()

	const selectedTemplateId = ref<number | null>(null)
	const conflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')

	dialogApi.setDialogProps({ confirmBtnDisabled: true })

	watch(selectedTemplateId, value => {
		dialogApi.setDialogProps({ confirmBtnDisabled: !value })
	})

	dialogApi.onConfirm(onConfirm)

	function onConfirm() {
		if (!selectedTemplateId.value) return
		dialogApi.close({ templateId: selectedTemplateId.value, conflictResolution: conflictResolution.value })
	}
</script>
