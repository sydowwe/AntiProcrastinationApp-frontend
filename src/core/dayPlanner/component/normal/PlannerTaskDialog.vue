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
					(actId: number, todoItemId?: number, suggestedTime?: Time) =>
						onPickerSelected(actId, todoItemId, suggestedTime, data as PlannerTaskRequest)
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
	import BasePlannerTaskDialog from '@/core/dayPlanner/component/BasePlannerTaskDialog.vue'
	import PlannerActivitySourcePicker from '@/core/dayPlanner/component/PlannerActivitySourcePicker.vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { formatDateForApi, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'

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
			// `by-date` takes a DD-MM-YYYY path segment; the raw Date used to be stringified into the
			// URL, so this lookup failed on every create made from outside the planner (e.g. the to-do
			// list) and rejected unobserved.
			fetchByDate(usStringToUrlString(formatDateForApi(selectedDate.value))).catch(() => {
				// A day that has never been planned has no calendar row yet — not an error here.
			})
			request.date = new Date(selectedDate.value)
		}
		emit('create', request)
	}

	function onPickerSelected(
		activityId: number,
		todoListItemId: number | undefined,
		suggestedTime: Time | undefined,
		data: PlannerTaskRequest,
	) {
		baseDialog.value?.prefillActivity(activityId)
		if (todoListItemId != null) {
			data.todoListItemId = todoListItemId
		}
		if (suggestedTime != null) {
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
