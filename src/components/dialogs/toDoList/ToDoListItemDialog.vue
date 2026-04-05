<template>
	<MyDialog
		v-model="dialog"
		eager
		:title="isEdit ? $t('general.edit') : $t('toDoList.addItemTitle')"
		:confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')"
		@confirmed="save"
	>
		<VForm
			ref="form"
			validateOn="submit"
			@keyup.enter="save"
			@submit="save"
		>
			<ActivitySelectOrQuickEditFormField
				ref="activityFormField"
				viewName="To-do list task"
				:isEdit
			></ActivitySelectOrQuickEditFormField>
			<TodoListRepeatCountFormField
				v-model="isRepeated"
				v-model:doneCount="toDoListItem.doneCount"
				v-model:totalCount="toDoListItem.totalCount"
				class="mt-3 mb-5"
				:isEdit
			></TodoListRepeatCountFormField>
			<VIdSelect
				v-model="toDoListItem.taskPriorityId"
				:label="$t('toDoList.priority')"
				:clearable="false"
				:items="priorityOptions"
				required
				:rules="[requiredRule]"
			></VIdSelect>
			<VDateInput
				v-model="dueDateValue"
				:label="$t('toDoList.dueDate')"
				clearable
				density="compact"
				hideDetails
				class="mt-3"
				prependIcon=""
				prependInnerIcon="calendar"
			/>
			<div
				v-if="dueDateValue"
				class="d-flex align-center ga-3 mt-2"
			>
				<VSwitch
					v-model="dueTimeEnabled"
					:label="$t('toDoList.specificTime')"
					density="compact"
					hideDetails
				/>
				<TimePicker
					v-if="dueTimeEnabled"
					v-model="dueTimeValue"
					:label="$t('toDoList.dueTime')"
					density="compact"
					class="flex-grow-1"
				/>
			</div>
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
				v-model="noteValue"
				:label="$t('toDoList.note')"
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
	import { Time } from '@/dtos/dto/Time.ts'
	import { VDateInput } from 'vuetify/labs/components'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import type { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/dtos/request/todoList/ToDoListItemRequest.ts'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import { useTaskPriorityCrud } from '@/api/todoList/taskPriorityApi.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue'
	import type { TaskImportance } from '@/dtos/response/activityPlanning/TaskImportance.ts'
	import { TodoListItemStepRequest } from '@/dtos/request/todoList/TodoListItemStepRequest.ts'

	const emit = defineEmits<{
		(e: 'add', toDoList: ToDoListItemRequest): void
		(e: 'edit', idToEdit: number, toDoListItem: ToDoListItemRequest): void
		(e: 'quickEditedActivity', id: number): void
		(e: 'changedUrgency', id: number, taskPriorityId?: number): void
	}>()
	const { requiredRule } = useGeneralRules()
	const form = ref<InstanceType<typeof VForm>>()
	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()

	const { fetchAll } = useTaskPriorityCrud()

	const priorityOptions = ref([] as TaskImportance[])

	const dialog = ref(false)
	const isEdit = ref(false)
	const toDoListItem = ref(new ToDoListItemRequest())
	const oldItem = ref<TodoListItemEntity | null>(null)

	interface DialogStep { name: string; order: number; note: string | null }
	const dialogSteps = ref<DialogStep[]>([])
	const newStepName = ref('')

	const isRepeated = ref(false)
	const dueDateValue = ref<string | null>(null)
	const dueTimeEnabled = ref(false)
	const dueTimeValue = ref<Time>(new Time(9, 0))
	const suggestedTimeEnabled = ref(false)
	const suggestedTimeValue = ref<Time>(new Time())
	const noteValue = ref('')

	watch(dialog, newValue => {
		if (!newValue) {
			toDoListItem.value = new ToDoListItemRequest()
			setDefaultUrgency()
			dueDateValue.value = null
			dueTimeEnabled.value = false
			dueTimeValue.value = new Time(9, 0)
			suggestedTimeEnabled.value = false
			suggestedTimeValue.value = new Time()
			noteValue.value = ''
			dialogSteps.value = []
			newStepName.value = ''
		}
	})

	watch(dueDateValue, newVal => {
		if (!newVal) dueTimeEnabled.value = false
	})

	onMounted(async () => {
		priorityOptions.value = await fetchAll()
		setDefaultUrgency()
	})

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) {
			return
		}

		const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus()
		if (!activityFormFieldResult) {
			return
		}
		toDoListItem.value.activityId = activityFormFieldResult.activityId

		if (!isRepeated.value) {
			toDoListItem.value.totalCount = null
			if (isEdit.value) {
				toDoListItem.value.doneCount = null
			}
		}

		toDoListItem.value.dueDate = dueDateValue.value || null
		toDoListItem.value.dueTime = dueDateValue.value && dueTimeEnabled.value ? dueTimeValue.value : null
		toDoListItem.value.suggestedTime = suggestedTimeEnabled.value ? suggestedTimeValue.value : null
		toDoListItem.value.note = noteValue.value || null
		toDoListItem.value.steps = dialogSteps.value.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))
		if (toDoListItem.value.steps.length > 0) toDoListItem.value.totalCount = null

		if (isEdit.value) {
			emit('edit', oldItem.value?.id ?? 0, toDoListItem.value)
		} else {
			emit('add', toDoListItem.value)
		}
		close()
	}

	function addDialogStep() {
		if (!newStepName.value.trim()) return
		dialogSteps.value.push({ name: newStepName.value.trim(), order: dialogSteps.value.length + 1, note: null })
		newStepName.value = ''
	}

	function setDefaultUrgency() {
		toDoListItem.value.taskPriorityId = priorityOptions.value.find(item => item.priority === 1)?.id
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		toDoListItem.value = new ToDoListItemRequest()
		setDefaultUrgency()
		suggestedTimeEnabled.value = false
		suggestedTimeValue.value = new Time()
		dialogSteps.value = []
		newStepName.value = ''
		isEdit.value = false
		oldItem.value = null
	}
	const openCreate = () => {
		isEdit.value = false
		dialog.value = true
		activityFormField.value?.reset()
	}

	const openEdit = (entityToEdit: TodoListItemEntity) => {
		isEdit.value = true
		oldItem.value = entityToEdit

		activityFormField.value?.onOpenEdit(entityToEdit.activity.id)
		toDoListItem.value = ToDoListItemRequest.fromEntity(entityToEdit)
		isRepeated.value = (entityToEdit.totalCount ?? 0) > 1
		dueDateValue.value = entityToEdit.dueDate ?? null
		dueTimeEnabled.value = !!entityToEdit.dueTime
		dueTimeValue.value = entityToEdit.dueTime ?? new Time(9, 0)
		suggestedTimeEnabled.value = !!entityToEdit.suggestedTime
		suggestedTimeValue.value = entityToEdit.suggestedTime ?? new Time()
		noteValue.value = entityToEdit.note ?? ''
		dialogSteps.value = entityToEdit.steps.map((s, i) => ({ name: s.name, order: i + 1, note: s.note }))
		dialog.value = true
	}
	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
