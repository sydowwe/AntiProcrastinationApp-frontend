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
			<VTextarea
				v-model="routineToDoListItem.note"
				label="Note"
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
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue'
	import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
	import { TimePeriodEntity } from '@/dtos/response/activityRecording/TimePeriodEntity.ts'

	const emit = defineEmits<{
		edit: []
		add: []
		quickEditedActivity: []
	}>()

	const { fetchSelectOptions: fetchTimePeriodEntitySelectOptions } = useEntityQuery<TimePeriodEntity>({
		responseClass: TimePeriodEntity,
		entityName: 'routine-time-period',
	})

	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()
	const form = ref<InstanceType<typeof VForm>>()

	const routineToDoListItem = ref(new RoutineTodoListItemRequest())

	const dialog = ref(false)
	const isEdit = ref(false)
	const entityBeforeEdit = ref<RoutineTodoListItemEntity | null>(null)

	const isRepeated = ref(false)
	const timePeriodOptions = ref<SelectOption[]>([])

	watch(dialog, newValue => {
		if (!newValue) {
			routineToDoListItem.value = new RoutineTodoListItemRequest()
			setDefaultTimePeriod()
		}
	})

	onMounted(async () => {
		timePeriodOptions.value = await fetchTimePeriodEntitySelectOptions()
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
		if (isEdit.value) {
			emit('edit', entityBeforeEdit.value, routineToDoListItem.value)
		} else {
			emit('add', routineToDoListItem.value)
		}
		close()
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		routineToDoListItem.value = new RoutineTodoListItemRequest()
		setDefaultTimePeriod()
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
		dialog.value = true
	}

	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
