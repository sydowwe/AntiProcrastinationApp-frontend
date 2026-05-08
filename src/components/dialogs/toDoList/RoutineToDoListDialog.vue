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

			<div class="d-flex flex-column ga-6">
				<TodoListRepeatCountFormField
					class="mt-2"
					v-model="isRepeated"
					v-model:doneCount="request.doneCount"
					v-model:totalCount="request.totalCount"
					:isEdit
				></TodoListRepeatCountFormField>
				<VIdSelect
					v-model="request.timePeriodId"
					:label="$t('toDoList.timePeriod')"
					:clearable="false"
					:items="timePeriodOptions"
					hideDetails
				></VIdSelect>
				<div class="d-flex align-center">
					<VSwitch
						class="ml-2"
						v-model="suggestedTimeEnabled"
						:label="$t('toDoList.suggestedTime')"
						color="primaryOutline"
						hideDetails
						minWidth="200px"
					/>
					<TimePicker
						v-if="suggestedTimeEnabled"
						v-model="suggestedTimeValue"
						:label="$t('toDoList.suggestedTime')"
						viewMode="minute"
						hideDetails
						width="150px"
						allowedMinutesSelected="1"
					/>
				</div>
				<div
					v-if="request.timePeriodId"
					class="d-flex align-center"
				>
					<VSwitch
						class="ml-2"
						v-model="suggestedDayEnabled"
						label="Suggested day"
						color="primaryOutline"
						hideDetails
						minWidth="200px"
					/>
					<VSelect
						v-if="suggestedDayEnabled"
						v-model="suggestedDayValue"
						label="Suggested day"
						:items="weekDayOptions"
						itemTitle="label"
						itemValue="value"
						hideDetails
						maxWidth="150px"
					></VSelect>
				</div>
				<VTextarea
					v-model="request.note"
					label="Note"
					density="compact"
					hideDetails
					:rows="2"
					autoGrow
				/>
				<div>
					<span class="text-medium-emphasis">{{ $t('toDoList.steps') }}</span>
					<div
						v-for="(step, i) in dialogSteps"
						:key="i"
						class="d-flex align-center ga-1 mt-1"
					>
						<div class="d-flex flex-column">
							<VIconBtn
								icon="chevron-up"
								variant="text"
								size="x-small"
								:disabled="i === 0"
								@click="moveStep(i, -1)"
							/>
							<VIconBtn
								icon="chevron-down"
								variant="text"
								size="x-small"
								:disabled="i === dialogSteps.length - 1"
								@click="moveStep(i, 1)"
							/>
						</div>
						<VTextField
							v-model="step.name"
							density="compact"
							hideDetails
							class="flex-grow-1"
						/>
						<VIconBtn
							icon="trash-can"
							color="error"
							variant="text"
							size="small"
							@click="dialogSteps.splice(i, 1)"
						/>
					</div>
					<div class="d-flex ga-2 mt-2">
						<VTextField
							v-model="newStepName"
							:label="$t('toDoList.addStep')"
							density="compact"
							hideDetails
							class="flex-grow-1"
							@keyup.enter.stop="addDialogStep"
						/>
						<VIconBtn
							icon="plus"
							variant="tonal"
							color="primaryOutline"
							@click="addDialogStep"
						/>
					</div>
				</div>
			</div>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue'
	import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
	import { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { TodoListItemStepRequest } from '@/dtos/request/todoList/TodoListItemStepRequest.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'

	const emit = defineEmits<{
		edit: [entity: RoutineTodoListItemEntity, request: RoutineTodoListItemRequest]
		add: [request: RoutineTodoListItemRequest]
		quickEditedActivity: []
	}>()

	const { fetchSelectOptions: fetchRoutineTimePeriodEntitySelectOptions } = useEntityQuery<RoutineTimePeriodEntity>({
		responseClass: RoutineTimePeriodEntity,
		entityName: 'routine-time-period',
	})

	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()
	const form = ref<InstanceType<typeof VForm>>()

	const request = ref(new RoutineTodoListItemRequest())

	const dialog = ref(false)
	const isEdit = ref(false)
	const entityBeforeEdit = ref<RoutineTodoListItemEntity | null>(null)

	interface DialogStep {
		name: string
		order: number
		note: string | null
	}
	const dialogSteps = ref<DialogStep[]>([])
	const newStepName = ref('')

	const weekDayOptions = [
		{ label: 'Monday', value: 1 },
		{ label: 'Tuesday', value: 2 },
		{ label: 'Wednesday', value: 3 },
		{ label: 'Thursday', value: 4 },
		{ label: 'Friday', value: 5 },
		{ label: 'Saturday', value: 6 },
		{ label: 'Sunday', value: 7 },
	]

	const isRepeated = ref(false)
	const suggestedTimeEnabled = ref(false)
	const suggestedTimeValue = ref<Time>(new Time())
	const suggestedDayEnabled = ref(false)
	const suggestedDayValue = ref(1)
	const timePeriodOptions = ref<SelectOption[]>([])

	watch(dialog, newValue => {
		if (!newValue) {
			request.value = new RoutineTodoListItemRequest()
			setDefaultTimePeriod()
			suggestedTimeEnabled.value = false
			suggestedTimeValue.value = new Time()
			suggestedDayEnabled.value = false
			suggestedDayValue.value = 1
			dialogSteps.value = []
			newStepName.value = ''
		}
	})

	onMounted(async () => {
		timePeriodOptions.value = await fetchRoutineTimePeriodEntitySelectOptions()
		setDefaultTimePeriod()
	})

	const setDefaultTimePeriod = () => {
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
		request.value.suggestedTime = suggestedTimeEnabled.value ? suggestedTimeValue.value : null
		request.value.suggestedDay = suggestedDayEnabled.value ? suggestedDayValue.value : null
		request.value.steps = dialogSteps.value.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))
		if (isEdit.value) {
			emit('edit', entityBeforeEdit.value, request.value)
		} else {
			emit('add', request.value)
		}
		close()
	}

	function addDialogStep() {
		if (!newStepName.value.trim()) return
		dialogSteps.value.push({ name: newStepName.value.trim(), order: dialogSteps.value.length + 1, note: null })
		newStepName.value = ''
	}

	function moveStep(index: number, direction: -1 | 1) {
		const newIndex = index + direction
		if (newIndex < 0 || newIndex >= dialogSteps.value.length) return
		const temp = dialogSteps.value[index]
		dialogSteps.value[index] = dialogSteps.value[newIndex]!
		dialogSteps.value[newIndex] = temp!
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		request.value = new RoutineTodoListItemRequest()
		setDefaultTimePeriod()
		suggestedTimeEnabled.value = false
		suggestedTimeValue.value = new Time()
		suggestedDayEnabled.value = false
		suggestedDayValue.value = 1
		dialogSteps.value = []
		newStepName.value = ''
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
		suggestedTimeEnabled.value = !!entityToEdit.suggestedTime
		suggestedTimeValue.value = entityToEdit.suggestedTime ?? new Time()
		suggestedDayEnabled.value = !!entityToEdit.suggestedDay
		suggestedDayValue.value = entityToEdit.suggestedDay ?? 1
		dialogSteps.value = entityToEdit.steps.map((s, i) => ({ name: s.name, order: i + 1, note: s.note }))
		dialog.value = true
	}

	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
