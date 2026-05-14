<template>
	<MyDialog
		v-model="dialog"
		:title="isEdit ? $t('general.edit') : $t('general.add') + ' to routine to-do list'"
		:confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')"
		eager
		@confirmed="save"
		@closed="close"
	>
		<VForm
			ref="form"
			class="pb-4"
			validateOn="submit"
			@keyup.enter="save"
			@submit="save"
		>
			<ActivitySelectOrQuickEditFormField
				ref="activityFormField"
				viewName="Routine task"
				:isEdit
				:oldActivityId="entityBeforeEdit?.activity.id"
				:oldActivityName="entityBeforeEdit?.activity.name"
				:oldActivityText="entityBeforeEdit?.activity.name"
				:oldActivityCategoryId="entityBeforeEdit?.activity.category?.id"
			></ActivitySelectOrQuickEditFormField>

			<div class="d-flex flex-column ga-4">
				<BaseTodoListRepeatCountFormField
					class="mt-2"
					v-model="isRepeated"
					v-model:doneCount="request.doneCount"
					v-model:totalCount="request.totalCount"
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
					v-if="timePeriod?.lengthInDays > 1 && timePeriod?.lengthInDays <= 14"
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
					hideDetails
					:rows="2"
					autoGrow
				/>
				<TodoListStepsFormField v-model="dialogSteps" />
			</div>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
	import { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import { TodoListItemStepRequest } from '@/dtos/request/todoList/TodoListItemStepRequest.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import BaseTodoListRepeatCountFormField from '@/components/toDoList/BaseTodoListRepeatCountFormField.vue'
	import DayOfWeekPicker from '@/components/general/inputs/DayOfWeekPicker.vue'
	import SuggestedTimeFormField from '@/components/toDoList/SuggestedTimeFormField.vue'
	import TodoListStepsFormField from '@/components/toDoList/TodoListStepsFormField.vue'
	import type { Time } from '@/dtos/dto/Time.ts'

	const emit = defineEmits<{
		edit: [entity: RoutineTodoListItemEntity, request: RoutineTodoListItemRequest]
		add: [request: RoutineTodoListItemRequest]
		quickEditedActivity: []
	}>()

	const { fetchAll: fetchTimePeriodOptions } = useEntityQuery<RoutineTimePeriodEntity>({
		responseClass: RoutineTimePeriodEntity,
		entityName: 'routine-time-period',
	})

	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()
	const form = ref<InstanceType<typeof VForm>>()

	const request = ref(new RoutineTodoListItemRequest())

	const dialog = ref(false)
	const isEdit = ref(false)
	const entityBeforeEdit = ref<RoutineTodoListItemEntity | null>(null)

	const dialogSteps = ref<TodoListItemStepRequest[]>([])

	const isRepeated = ref(false)
	const suggestedTime = ref<Time | null>(null)
	const timePeriodOptions = ref<RoutineTimePeriodEntity[]>([])
	const timePeriod = computed(() => timePeriodOptions.value.find(item => item.id === request.value.timePeriodId))

	watch(timePeriod, (newPeriod, oldPeriod) => {
		if (!oldPeriod || !newPeriod) return
		if (oldPeriod.lengthInDays <= 14 && newPeriod.lengthInDays > 14) {
			request.value.suggestedDays = []
		} else if (oldPeriod.lengthInDays > 14 && newPeriod.lengthInDays <= 14) {
			request.value.suggestedDayOfMonth = null
		}
	})

	watch(dialog, newValue => {
		if (!newValue) {
			request.value = new RoutineTodoListItemRequest()
			setDefaultTimePeriod()
			suggestedTime.value = null
			dialogSteps.value = []
		}
	})

	onMounted(async () => {
		timePeriodOptions.value = await fetchTimePeriodOptions()
		setDefaultTimePeriod()
	})

	function setDefaultTimePeriod() {
		request.value.timePeriodId = timePeriodOptions.value[0]?.id
	}

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) {
			return
		}

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
		if (isEdit.value && entityBeforeEdit.value) {
			emit('edit', entityBeforeEdit.value, request.value)
		} else {
			emit('add', request.value)
		}
		close()
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		request.value = new RoutineTodoListItemRequest()
		setDefaultTimePeriod()
		suggestedTime.value = null
		dialogSteps.value = []
		entityBeforeEdit.value = null
	}

	const openCreate = () => {
		isEdit.value = false
		dialog.value = true
		activityFormField.value?.reset()
	}

	const openEdit = (entityToEdit: RoutineTodoListItemEntity) => {
		isEdit.value = true
		entityBeforeEdit.value = entityToEdit

		activityFormField.value?.onOpenEdit(entityBeforeEdit.value.activity.id)
		request.value = RoutineTodoListItemRequest.fromEntity(entityToEdit)
		isRepeated.value = (entityToEdit.totalCount ?? 0) > 1
		suggestedTime.value = entityToEdit.suggestedTime ?? null
		dialogSteps.value = entityToEdit.steps.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))
		dialog.value = true
	}

	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
