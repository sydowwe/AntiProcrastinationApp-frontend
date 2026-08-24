<template>
	<ActionBar
		:isShown
		@cancel="emit('cancel')"
	>
		<VAutocomplete
			v-model="templateId"
			:items="activeTemplates"
			itemTitle="name"
			itemValue="id"
			:label="$t('planner.misc.selectTemplateLabel')"
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
			<!-- Not a boolean prop: `value` is this button's entry in the toggle group, and the group's
			     model `previewMode` is a boolean. The `value` shorthand would bind the string "" and
			     the toggle would never match, so the rule does not apply here. -->
			<!-- eslint-disable-next-line vue/prefer-true-attribute-shorthand -->
			<VBtn :value="true">{{ $t('planner.misc.previewLabel') }}</VBtn>
			<VBtn :value="false">{{ $t('planner.actions.apply') }}</VBtn>
		</VBtnToggle>
		<VSelect
			v-if="!previewMode"
			v-model="conflictResolution"
			:label="$t('planner.misc.conflictResolutionLabel')"
			:items="conflictResolutionOptions"
			density="compact"
			hideDetails
			minWidth="185"
		/>
	</ActionBar>
</template>

<script setup lang="ts">
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import ActionBar from '@/_common/component/ActionBar.vue'
	import { useActionBarFocusReturn } from '@/core/dayPlanner/composable/useActionBarFocusReturn.ts'

	const { isShown, activeTemplates } = defineProps<{
		isShown: boolean
		activeTemplates: TaskPlannerDayTemplate[]
	}>()

	const emit = defineEmits<{ cancel: [] }>()

	const templateId = defineModel<number | null>('templateId')
	const previewMode = defineModel<boolean>('previewMode')
	const conflictResolution = defineModel<ApplyTemplateConflictResolution>('conflictResolution')

	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')

	useActionBarFocusReturn(() => isShown)
</script>
