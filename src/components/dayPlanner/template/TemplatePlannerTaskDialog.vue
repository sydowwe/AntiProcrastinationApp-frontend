<template>
	<BasePlannerTaskDialog
		ref="baseDialog"
		:title="
			store.isDuplicating ? 'Duplicate Template Task' : !isEdit ? 'Add New Template Task' : 'Edit Template Task'
		"
		:store
		:createEmptyRequest="() => TemplatePlannerTaskRequest.createEmpty()"
		:hideActivitySelector="!isEdit && pickerMode !== 'all'"
		@edit="(id, task) => emit('edit', id, task as TemplatePlannerTaskRequest)"
		@create="emit('create', $event as TemplatePlannerTaskRequest)"
	>
		<template #before-activity="{ data }">
			<PlannerActivitySourcePicker
				v-if="!isEdit"
				v-model:pickerMode="pickerMode"
				showRoutine
				class="mb-3"
				@selected="
					(actId: number, _todoItemId: number | undefined, suggestedTime: Time | undefined) =>
						onPickerSelected(actId, suggestedTime, data as TemplatePlannerTaskRequest)
				"
			/>
		</template>
	</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
	import { computed, inject, nextTick, ref, watch } from 'vue'
	import type { Ref } from 'vue'
	import BasePlannerTaskDialog from '@/components/dayPlanner/BasePlannerTaskDialog.vue'
	import PlannerActivitySourcePicker from '@/components/dayPlanner/PlannerActivitySourcePicker.vue'
	import { useTemplateDayPlannerStore } from '@/stores/dayPlanner/templateDayPlannerStore.ts'
	import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'

	const emit = defineEmits<{
		(e: 'edit', id: number, task: TemplatePlannerTaskRequest): void
		(e: 'create', task: TemplatePlannerTaskRequest): void
	}>()

	const store = useTemplateDayPlannerStore()
	const baseDialog = ref<InstanceType<typeof BasePlannerTaskDialog>>()
	const pickerMode = ref<'all' | 'routine'>('all')
	const selectedRoutineItem = inject<Ref<RoutineTodoListItemEntity | null>>('selectedRoutineItem')

	const isEdit = computed(() => store.editedId !== undefined)

	function onPickerSelected(activityId: number, suggestedTime: Time | undefined, data: TemplatePlannerTaskRequest) {
		baseDialog.value?.prefillActivity(activityId)
		if (suggestedTime !== undefined) {
			data.endTime = Time.fromMinutes(data.startTime.getInMinutes + suggestedTime.getInMinutes)
		}
	}

	watch(pickerMode, newMode => {
		if (newMode === 'all') {
			baseDialog.value?.resetActivityField()
		}
	})

	watch(
		() => store.dialog,
		async value => {
			if (value) {
				// Two nextTicks: first waits for BasePlannerTaskDialog's own nextTick init,
				// second ensures its data is fully set before we prefill.
				await nextTick()
				await nextTick()
				if (store.editedId === undefined && selectedRoutineItem?.value) {
					baseDialog.value?.prefillActivity(selectedRoutineItem.value.activity.id)
					if (selectedRoutineItem.value.suggestedTime && !store.creationPreview) {
						baseDialog.value?.applySuggestedTime(selectedRoutineItem.value.suggestedTime.getInMinutes)
					}
				}
			} else {
				pickerMode.value = 'all'
			}
		},
	)
</script>
