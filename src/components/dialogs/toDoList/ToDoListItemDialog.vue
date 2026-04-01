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
			<VTextarea
				v-model="noteValue"
				:label="$t('toDoList.note')"
				density="compact"
				hideDetails
				:rows="2"
				autoGrow
				class="mt-3"
			/>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { VDateInput } from 'vuetify/labs/components'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import type { TaskPriority } from '@/dtos/response/activityPlanning/TaskPriority.ts'
	import type { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/dtos/request/todoList/ToDoListItemRequest.ts'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import { useTaskPriorityCrud } from '@/api/todoList/taskPriorityApi.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue'

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

	const priorityOptions = ref([] as TaskPriority[])

	const dialog = ref(false)
	const isEdit = ref(false)
	const toDoListItem = ref(new ToDoListItemRequest())
	const oldItem = ref<TodoListItemEntity | null>(null)

	const isRepeated = ref(false)
	const dueDateValue = ref<string | null>(null)
	const dueTimeEnabled = ref(false)
	const dueTimeValue = ref<Time>(new Time(9, 0))
	const noteValue = ref('')

	watch(dialog, newValue => {
		if (!newValue) {
			toDoListItem.value = new ToDoListItemRequest()
			setDefaultUrgency()
			dueDateValue.value = null
			dueTimeEnabled.value = false
			dueTimeValue.value = new Time(9, 0)
			noteValue.value = ''
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
		toDoListItem.value.note = noteValue.value || null

		if (isEdit.value) {
			emit('edit', oldItem.value?.id ?? 0, toDoListItem.value)
		} else {
			emit('add', toDoListItem.value)
		}
		close()
	}

	function setDefaultUrgency() {
		toDoListItem.value.taskPriorityId = priorityOptions.value.find(item => item.priority === 1)?.id
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		toDoListItem.value = new ToDoListItemRequest()
		setDefaultUrgency()
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
		noteValue.value = entityToEdit.note ?? ''
		dialog.value = true
	}
	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
