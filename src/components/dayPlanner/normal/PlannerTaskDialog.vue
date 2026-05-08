<template>
	<BasePlannerTaskDialog
		ref="baseDialog"
		:title="store.isDuplicating ? 'Duplicate Task' : !isEdit ? 'Add New Task' : 'Edit Task'"
		:store
		:createEmptyRequest="createEmptyRequest"
		:hideActivitySelector="!isEdit && pickerMode !== 'all'"
		:suggestedDurationMinutes
		@edit="(id: number, task: PlannerTaskRequest) => emit('edit', id, task)"
		@create="handleCreate"
	>
		<template
			v-if="showDatePicker && !isEdit"
			#before-time
		>
			<MyDateInput
				v-model="selectedDate"
				:dateShowArrows="false"
				class="mx-auto mb-2 pt-2"
				style="min-width: 200px; max-width: 200px"
			/>
		</template>
		<template #before-activity="{ data }">
			<PlannerActivitySourcePicker
				v-if="!isEdit"
				v-model:pickerMode="pickerMode"
				showTodo
				showRoutine
				:initialActivityId="initialPickerActivityId"
				@selected="
					(actId: number, todoItemId?: number) =>
						onPickerSelected(actId, todoItemId, data as PlannerTaskRequest)
				"
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
	import MyDateInput from '@/components/general/dateTime/MyDateInput.vue'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'

	const { showDatePicker = false } = defineProps<{
		showDatePicker?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'edit', id: number, task: PlannerTaskRequest): void
		(e: 'create', task: PlannerTaskRequest): void
	}>()

	const { fetchByDate } = useCalendarQuery()
	const store = useDayPlannerStore()
	const baseDialog = ref<InstanceType<typeof BasePlannerTaskDialog>>()
	const pickerMode = ref<'all' | 'todo' | 'routine'>('all')
	const selectedDate = ref(new Date())
	const initialPickerActivityId = ref<number | undefined>(undefined)

	const isEdit = computed(() => store.editedId !== undefined)
	const suggestedDurationMinutes = computed(() =>
		store.pendingSuggestedDuration ? Math.max(10, store.pendingSuggestedDuration.getInMinutes) : undefined,
	)

	const statusOptions = getEnumSelectOptions(PlannerTaskStatus, 'planner.status')

	function createEmptyRequest(suggestedDurationMinutes?: number): PlannerTaskRequest {
		const req = PlannerTaskRequest.createEmpty()
		if (store.pendingInitialTodoListItemId !== undefined) {
			req.todoListItemId = store.pendingInitialTodoListItemId
			store.$patch({ pendingInitialTodoListItemId: undefined })
		}
		if (suggestedDurationMinutes !== undefined) {
			req.endTime = Time.fromMinutes(req.startTime.getInMinutes + suggestedDurationMinutes)
		}
		return req
	}

	function handleCreate(request: PlannerTaskRequest) {
		if (showDatePicker) {
			fetchByDate(selectedDate.value)
			request.date = new Date(selectedDate.value)
		}
		emit('create', request)
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
				selectedDate.value = new Date()
				initialPickerActivityId.value = undefined
				store.$patch({ pendingSuggestedDuration: undefined })
				return
			}
			if (store.editedId === undefined && store.pendingInitialActivityId !== undefined) {
				const activityId = store.pendingInitialActivityId
				const initialPickerMode = store.pendingPickerMode
				store.$patch({ pendingInitialActivityId: undefined, pendingPickerMode: undefined })
				if (initialPickerMode) {
					pickerMode.value = initialPickerMode
				}
				if (initialPickerMode === 'routine' || initialPickerMode === 'todo') {
					initialPickerActivityId.value = activityId
				} else {
					await nextTick()
					baseDialog.value?.prefillActivity(activityId)
				}
			}
		},
	)
</script>
