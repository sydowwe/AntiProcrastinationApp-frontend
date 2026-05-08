<template>
	<BasePlannerTaskDialog
		ref="baseDialog"
		:title="
			store.isDuplicating ? 'Duplicate Template Task' : !isEdit ? 'Add New Template Task' : 'Edit Template Task'
		"
		:store
		:createEmptyRequest="() => new TemplatePlannerTaskRequest()"
		:hideActivitySelector="!isEdit && pickerMode !== 'all'"
		@edit="(id, task) => emit('edit', id, task as TemplatePlannerTaskRequest)"
		@create="emit('create', $event as TemplatePlannerTaskRequest)"
	>
		<template #before-activity>
			<PlannerActivitySourcePicker
				v-if="!isEdit"
				v-model:pickerMode="pickerMode"
				showRoutine
				class="mb-3"
				@selected="(activityId) => baseDialog?.prefillActivity(activityId)"
			/>
		</template>
	</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import BasePlannerTaskDialog from '@/components/dayPlanner/BasePlannerTaskDialog.vue'
	import PlannerActivitySourcePicker from '@/components/dayPlanner/PlannerActivitySourcePicker.vue'
	import { useTemplateDayPlannerStore } from '@/stores/dayPlanner/templateDayPlannerStore.ts'
	import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'

	const emit = defineEmits<{
		(e: 'edit', id: number, task: TemplatePlannerTaskRequest): void
		(e: 'create', task: TemplatePlannerTaskRequest): void
	}>()

	const store = useTemplateDayPlannerStore()
	const baseDialog = ref<InstanceType<typeof BasePlannerTaskDialog>>()
	const pickerMode = ref<'all' | 'routine'>('all')

	const isEdit = computed(() => store.editedId !== undefined)

	watch(pickerMode, newMode => {
		if (newMode === 'all') {
			baseDialog.value?.resetActivityField()
		}
	})

	watch(
		() => store.dialog,
		value => {
			if (!value) pickerMode.value = 'all'
		},
	)
</script>
