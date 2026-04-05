<template>
	<BasePlannerTaskDialog
		ref="baseDialog"
		:title="store.isDuplicating ? 'Duplicate Task' : !isEdit ? 'Add New Task' : 'Edit Task'"
		:store
		:createEmptyRequest="createEmptyRequest"
		:hideActivitySelector="!isEdit && pickerMode !== 'all'"
		@edit="(id, task) => emit('edit', id, task as PlannerTaskRequest)"
		@create="emit('create', $event as PlannerTaskRequest)"
	>
		<template #before-activity="{ data }">
			<PlannerActivitySourcePicker
				v-if="!isEdit"
				v-model:pickerMode="pickerMode"
				showTodo
				showRoutine
				class="mb-3"
				@selected="({ activityId, todoListItemId }) => onPickerSelected(activityId, todoListItemId, data as PlannerTaskRequest)"
			/>
		</template>
		<template #additional-fields="{ data }">
			<VSelect
				v-model="data.status"
				:items="statusOptions"
				itemTitle="title"
				itemValue="value"
				label="Status"
				class="pt-4"
			/>
		</template>
	</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
	import { computed, nextTick, ref, watch } from 'vue'
	import BasePlannerTaskDialog from '@/components/dayPlanner/BasePlannerTaskDialog.vue'
	import PlannerActivitySourcePicker from '@/components/dayPlanner/PlannerActivitySourcePicker.vue'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'

	const emit = defineEmits<{
		(e: 'edit', id: number, task: PlannerTaskRequest): void
		(e: 'create', task: PlannerTaskRequest): void
	}>()

	const store = useDayPlannerStore()
	const baseDialog = ref<InstanceType<typeof BasePlannerTaskDialog>>()
	const pickerMode = ref<'all' | 'todo' | 'routine'>('all')

	const isEdit = computed(() => store.editedId !== undefined)

	const statusOptions = getEnumSelectOptions(PlannerTaskStatus, 'planner.status')

	function createEmptyRequest(): PlannerTaskRequest {
		const req = new PlannerTaskRequest()
		if (store.pendingInitialTodoListItemId !== undefined) {
			req.todoListItemId = store.pendingInitialTodoListItemId
			store.$patch({ pendingInitialTodoListItemId: undefined })
		}
		return req
	}

	function onPickerSelected(activityId: number, todoListItemId: number | undefined, data: PlannerTaskRequest) {
		baseDialog.value?.prefillActivity(activityId)
		if (todoListItemId != null) {
			data.todoListItemId = todoListItemId
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
			if (!value) {
				pickerMode.value = 'all'
				return
			}
			if (store.editedId === undefined && store.pendingInitialActivityId !== undefined) {
				const activityId = store.pendingInitialActivityId
				store.$patch({ pendingInitialActivityId: undefined })
				await nextTick()
				baseDialog.value?.prefillActivity(activityId)
			}
		},
	)
</script>
