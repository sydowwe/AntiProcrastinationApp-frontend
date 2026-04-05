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
			class="pb-2"
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

			<TodoListRepeatCountFormField
				v-model="isRepeated"
				v-model:doneCount="routineToDoListItem.doneCount"
				v-model:totalCount="routineToDoListItem.totalCount"
				class="mb-2"
				:isEdit
			></TodoListRepeatCountFormField>
			<VIdSelect
				v-model="routineToDoListItem.timePeriodId"
				class="pt-2 pb-3"
				:label="$t('toDoList.timePeriod')"
				:clearable="false"
				:items="timePeriodOptions"
				hideDetails
			></VIdSelect>
			<div class="d-flex align-center ga-3 mt-2">
				<VSwitch
					v-model="suggestedTimeEnabled"
					:label="$t('toDoList.suggestedTime')"
					density="compact"
					hideDetails
				/>
				<TimePicker
					v-if="suggestedTimeEnabled"
					v-model="suggestedTimeValue"
					:label="$t('toDoList.suggestedTime')"
					density="compact"
					class="flex-grow-1"
					viewMode="minute"
				/>
			</div>
			<VTextarea
				v-model="routineToDoListItem.note"
				label="Note"
				density="compact"
				hideDetails
				:rows="2"
				autoGrow
				class="mt-3"
			/>
			<div class="mt-3">
				<span class="text-caption text-medium-emphasis">{{ $t('toDoList.steps') }}</span>
				<div
					v-for="(step, i) in dialogSteps"
					:key="i"
					class="d-flex align-center ga-2 mt-1"
				>
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
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts'
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

	const emit = defineEmits<{
		edit: []
		add: []
		quickEditedActivity: []
	}>()

	const { fetchSelectOptions: fetchRoutineTimePeriodEntitySelectOptions } = useEntityQuery<RoutineTimePeriodEntity>({
		responseClass: RoutineTimePeriodEntity,
		entityName: 'routine-time-period',
	})

	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()
	const form = ref<InstanceType<typeof VForm>>()

	const routineToDoListItem = ref(new RoutineTodoListItemRequest())

	const dialog = ref(false)
	const isEdit = ref(false)
	const entityBeforeEdit = ref<RoutineTodoListItemEntity | null>(null)

	interface DialogStep { name: string; order: number; note: string | null }
	const dialogSteps = ref<DialogStep[]>([])
	const newStepName = ref('')

	const isRepeated = ref(false)
	const suggestedTimeEnabled = ref(false)
	const suggestedTimeValue = ref<Time>(new Time())
	const timePeriodOptions = ref<SelectOption[]>([])

	watch(dialog, newValue => {
		if (!newValue) {
			routineToDoListItem.value = new RoutineTodoListItemRequest()
			setDefaultTimePeriod()
			suggestedTimeEnabled.value = false
			suggestedTimeValue.value = new Time()
			dialogSteps.value = []
			newStepName.value = ''
		}
	})

	onMounted(async () => {
		timePeriodOptions.value = await fetchRoutineTimePeriodEntitySelectOptions()
		setDefaultTimePeriod()
	})

	const setDefaultTimePeriod = () => {
		routineToDoListItem.value.timePeriodId = timePeriodOptions.value[0]?.id
	}

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid.valid) {
			return
		}

		const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus()
		if (activityFormFieldResult) {
			routineToDoListItem.value.activityId = activityFormFieldResult.activityId
		}
		if (!isRepeated.value) {
			routineToDoListItem.value.totalCount = null
			if (isEdit.value) {
				routineToDoListItem.value.doneCount = null
			}
		}
		routineToDoListItem.value.suggestedTime = suggestedTimeEnabled.value ? suggestedTimeValue.value : null
		routineToDoListItem.value.steps = dialogSteps.value.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))
		if (routineToDoListItem.value.steps.length > 0) routineToDoListItem.value.totalCount = null
		if (isEdit.value) {
			emit('edit', entityBeforeEdit.value, routineToDoListItem.value)
		} else {
			emit('add', routineToDoListItem.value)
		}
		close()
	}

	function addDialogStep() {
		if (!newStepName.value.trim()) return
		dialogSteps.value.push({ name: newStepName.value.trim(), order: dialogSteps.value.length + 1, note: null })
		newStepName.value = ''
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		routineToDoListItem.value = new RoutineTodoListItemRequest()
		setDefaultTimePeriod()
		suggestedTimeEnabled.value = false
		suggestedTimeValue.value = new Time()
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
		routineToDoListItem.value = RoutineTodoListItemRequest.fromEntity(entityToEdit)
		isRepeated.value = entityToEdit.steps.length === 0 && (entityToEdit.totalCount ?? 0) > 1
		suggestedTimeEnabled.value = !!entityToEdit.suggestedTime
		suggestedTimeValue.value = entityToEdit.suggestedTime ?? new Time()
		dialogSteps.value = entityToEdit.steps.map((s, i) => ({ name: s.name, order: i + 1, note: s.note }))
		dialog.value = true
	}

	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
