<template>
	<VForm
		ref="form"
		class="pb-4"
		validateOn="submit"
		@submit.prevent="onConfirm"
	>
		<ActivitySelectOrQuickEditFormField
			ref="activityFormField"
			v-model:loading="loadingActivityField"
			:systemRole="SystemActivityRole.ROUTINE_TASK"
			:oldActivityId="entityToEdit?.activity.id"
			:oldActivityName="entityToEdit?.activity.name"
			:oldActivityText="entityToEdit?.activity.name"
			:oldActivityCategoryId="entityToEdit?.activity.category?.id"
		></ActivitySelectOrQuickEditFormField>

		<div class="d-flex flex-column ga-4">
			<BaseTodoListRepeatCountFormField
				v-model="isRepeated"
				v-model:doneCount="request.doneCount"
				v-model:totalCount="request.totalCount"
				class="mt-2"
				:isEdit
			></BaseTodoListRepeatCountFormField>
			<VIdSelect
				v-model="request.timePeriodId"
				:label="$t('toDoList.timePeriod')"
				:clearable="false"
				:items="timePeriodOptions"
				hideDetails
			></VIdSelect>
			<SuggestedTimeFormField v-model="suggestedTime" />
			<div
				v-if="(timePeriod?.lengthInDays ?? 0) > 1 && (timePeriod?.lengthInDays ?? 0) <= 14"
				class="mb-2"
			>
				<label class="text-caption text-medium-emphasis mb-1 d-block">Suggested days</label>
				<DayOfWeekPicker v-model="request.suggestedDays" />
			</div>
			<VNumberInput
				v-else-if="(timePeriod?.lengthInDays ?? 0) > 14"
				v-model="request.suggestedDayOfMonth"
				label="Suggested day of month"
				:min="1"
				:max="31"
				hideDetails
			/>
			<VTextarea
				v-model="request.note"
				label="Note"
				density="compact"
				:rows="2"
				hideDetails
				autoGrow
			/>
			<TodoListStepsFormField v-model="dialogSteps" />
		</div>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/core/activity/component/ActivitySelectOrQuickEditFormField.vue'
	import { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'
	import BaseTodoListRepeatCountFormField from '@/core/todoList/component/BaseTodoListRepeatCountFormField.vue'
	import DayOfWeekPicker from '@/_common/component/inputs/DayOfWeekPicker.vue'
	import SuggestedTimeFormField from '@/core/todoList/component/SuggestedTimeFormField.vue'
	import TodoListStepsFormField from '@/core/todoList/component/TodoListStepsFormField.vue'
	import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { RoutineTodoListItemRequest } from '@/core/todoList/dto/request/RoutineTodoListItemRequest.ts'
	import { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import { TodoListItemStepRequest } from '@/core/todoList/dto/request/TodoListItemStepRequest.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const { entityToEdit = null } = defineProps<{
		entityToEdit?: RoutineTodoListItemEntity | null
	}>()

	const dialogApi = useDialogApi<{
		entity: RoutineTodoListItemEntity | null
		request: RoutineTodoListItemRequest
	}>()

	const { fetchAll: fetchTimePeriodOptions } = useEntityQuery<RoutineTimePeriodEntity>({
		responseClass: RoutineTimePeriodEntity,
		entityName: 'routine-time-period',
	})

	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()
	const form = ref<InstanceType<typeof VForm>>()

	const request = ref(new RoutineTodoListItemRequest())
	const dialogSteps = ref<TodoListItemStepRequest[]>([])
	const isRepeated = ref(false)
	const suggestedTime = ref<Time | null>(null)
	const loadingTimePeriods = ref(false)
	const loadingActivityField = ref(false)
	const timePeriodOptions = ref<RoutineTimePeriodEntity[]>([])

	const isEdit = computed(() => entityToEdit !== null)
	const timePeriod = computed(() => timePeriodOptions.value.find(item => item.id === request.value.timePeriodId))

	dialogApi.onConfirm(onConfirm)

	watch(
		() => loadingTimePeriods.value || loadingActivityField.value,
		loading => dialogApi.setLoading(loading),
	)

	watch(timePeriod, (newPeriod, oldPeriod) => {
		if (!oldPeriod || !newPeriod) return
		if (oldPeriod.lengthInDays <= 14 && newPeriod.lengthInDays > 14) {
			request.value.suggestedDays = []
		} else if (oldPeriod.lengthInDays > 14 && newPeriod.lengthInDays <= 14) {
			request.value.suggestedDayOfMonth = null
		}
	})

	onMounted(async () => {
		loadingTimePeriods.value = true
		timePeriodOptions.value = await fetchTimePeriodOptions()

		if (entityToEdit) {
			activityFormField.value?.onOpenEdit(entityToEdit.activity.id)
			request.value = RoutineTodoListItemRequest.fromEntity(entityToEdit)
			isRepeated.value = (entityToEdit.totalCount ?? 0) > 1
			suggestedTime.value = entityToEdit.suggestedTime ?? null
			dialogSteps.value = entityToEdit.steps.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))
		} else {
			request.value.timePeriodId = timePeriodOptions.value[0]?.id
		}

		loadingTimePeriods.value = false
	})

	async function onConfirm() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) return

		const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus()
		if (activityFormFieldResult) {
			request.value.activityId = activityFormFieldResult.activityId
		}
		if (!isRepeated.value) {
			request.value.totalCount = null
			if (isEdit.value) {
				request.value.doneCount = null
			}
		}
		request.value.suggestedTime = suggestedTime.value
		request.value.steps = dialogSteps.value.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))

		dialogApi.close({ entity: entityToEdit, request: request.value })
	}
</script>
