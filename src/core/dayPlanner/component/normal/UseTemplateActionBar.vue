<template>
	<ActionBar
		class="py-3"
		:isShown="store.isTemplateInPreview"
		@cancel="store.cancelTemplatePreview"
	>
		<template v-if="store.selectedTaskIds.size > 0">
			<span
				class="text-textMuted font-weight-medium selection-count"
				style="font-size: 1rem; line-height: 1.2rem"
			>
				{{
					$t('planner.misc.selectedCount', { count: store.selectedTaskIds.size }, store.selectedTaskIds.size)
				}}
			</span>
			<VBtn
				variant="outlined"
				color="error"
				@click="store.openDeleteDialog"
			>
				{{ $t('general.delete') }}
			</VBtn>
		</template>
		<template v-else>
			<span class="text-textMuted d-flex align-center ga-1">
				{{ store.templateInPreview!.name }}
			</span>
			<VNumberInput
				v-model="templateStartOffset"
				:label="$t('planner.misc.offsetHoursLabel')"
				:min="-10"
				:max="10"
				:step="0.5"
				:precision="null"
				minWidth="150px"
				maxWidth="150px"
				density="compact"
				controlVariant="split"
				decimalSeparator="."
				hideDetails
			></VNumberInput>
		</template>

		<VSelect
			v-model="conflictResolution"
			:label="$t('planner.misc.conflictResolutionLabel')"
			:items="conflictResolutionOptions"
			minWidth="200"
			density="compact"
			hideDetails
		></VSelect>

		<!-- Delete button -->
		<VBtn
			variant="tonal"
			color="success"
			@click="emit('applyTemplate', conflictResolution, templateStartOffset)"
		>
			{{ $t('planner.actions.apply') }}
		</VBtn>
	</ActionBar>
</template>

<script setup lang="ts">
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import ActionBar from '@/_common/component/ActionBar.vue'
	import { ref, watch } from 'vue'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'

	const emit = defineEmits<{
		applyTemplate: [conflictResolution: ApplyTemplateConflictResolution, hourOffset: number]
	}>()

	const store = useDayPlannerStore()

	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')
	const conflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const templateStartOffset = ref<number>(0)

	watch(templateStartOffset, newVal => {
		if (newVal !== null && newVal !== undefined) {
			store.offsetTasksFromTemplate(newVal)
		}
	})
</script>

<style scoped></style>
