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
				:systemRole="SystemActivityRole.TODO_LIST_TASK"
				:isEdit
			></ActivitySelectOrQuickEditFormField>
			<BaseTodoListRepeatCountFormField
				v-model="isRepeated"
				v-model:doneCount="toDoListItem.doneCount"
				v-model:totalCount="toDoListItem.totalCount"
				class="mt-3 mb-5"
				:isEdit
			></BaseTodoListRepeatCountFormField>
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
					color="primary-accent"
					@update:modelValue="dueTimeTouched = true"
				/>
				<TimePicker
					v-if="dueTimeEnabled"
					v-model="dueTimeValue"
					:label="$t('toDoList.dueTime')"
					density="compact"
					class="flex-grow-1"
				/>
			</div>
			<!-- A date alone is a deadline; the pairing with a time is what the research calls an
				 implementation intention. Say it once, quietly, instead of forcing the field. -->
			<div
				v-if="dueDateValue && !dueTimeEnabled"
				class="text-caption text-medium-emphasis mt-1"
			>
				{{ $t('toDoList.dueTimeHint') }}
			</div>
			<SuggestedTimeFormField
				class="mt-2"
				v-model="suggestedTime"
			/>
			<!-- Temptation bundling. Offered, never required — an empty leisure backlog just means an
				 empty select, and the hint says what the pairing is for rather than nagging for one. -->
			<VIdSelect
				v-model="toDoListItem.pairedLeisureActivityId"
				class="mt-3"
				:label="$t('toDoList.pairing.label')"
				:items="pairingOptions"
				:hint="$t('toDoList.pairing.hint')"
				persistentHint
				:noDataText="$t('toDoList.pairing.empty')"
			></VIdSelect>
			<VTextarea
				v-model="noteValue"
				:label="$t('toDoList.note')"
				density="compact"
				hideDetails
				:rows="2"
				autoGrow
				class="mt-3"
			/>
			<TodoListStepsFormField
				class="mt-3"
				v-model="dialogSteps"
			/>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatDateForApi, roundToNearestInterval } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone, minutesOfDayInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { VDateInput } from 'vuetify/labs/components'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { useTaskPriorityCrud } from '@/core/todoList/api/taskPriorityApi.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { VForm } from 'vuetify/components'
	import ActivitySelectOrQuickEditFormField from '@/core/activity/component/ActivitySelectOrQuickEditFormField.vue'
	import { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'
	import type { TaskPriority } from '@/core/todoList/dto/response/TaskPriority.ts'
	import { TodoListItemStepRequest } from '@/core/todoList/dto/request/TodoListItemStepRequest.ts'
	import BaseTodoListRepeatCountFormField from '@/core/todoList/component/BaseTodoListRepeatCountFormField.vue'
	import SuggestedTimeFormField from '@/core/todoList/component/SuggestedTimeFormField.vue'
	import TodoListStepsFormField from '@/core/todoList/component/TodoListStepsFormField.vue'
	import { useLeisurePairing } from '@/core/todoList/composable/useLeisurePairing.ts'

	const emit = defineEmits<{
		(e: 'add', toDoList: ToDoListItemRequest): void
		(e: 'edit', idToEdit: number, toDoListItem: ToDoListItemRequest): void
		(e: 'quickEditedActivity', id: number): void
		(e: 'changedPriority', id: number, taskPriorityId?: number): void
	}>()
	const { requiredRule } = useGeneralRules()
	const form = ref<InstanceType<typeof VForm>>()
	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()

	const { fetchAll } = useTaskPriorityCrud()
	const { ensureLoaded: ensureLeisurePairingLoaded, pairingOptions } = useLeisurePairing()

	const priorityOptions = ref([] as TaskPriority[])

	const dialog = ref(false)
	const isEdit = ref(false)
	const toDoListItem = ref(new ToDoListItemRequest())
	const oldItem = ref<TodoListItemEntity | null>(null)

	const dialogSteps = ref<TodoListItemStepRequest[]>([])

	const isRepeated = ref(false)
	// VDateInput's model is a Date, not a string — the entity's `dueDate` is a `YYYY-MM-DD` string,
	// so both directions are converted explicitly. Handing the raw Date to the API would send a UTC
	// instant and land the task on the previous day for anyone east of Greenwich.
	const dueDateValue = ref<Date | null>(null)
	const dueTimeEnabled = ref(false)
	const dueTimeTouched = ref(false)
	const dueTimeValue = ref<Time>(defaultDueTime())
	const suggestedTime = ref<Time | null>(null)
	const noteValue = ref('')

	watch(dialog, newValue => {
		if (!newValue) {
			toDoListItem.value = new ToDoListItemRequest()
			setDefaultPriority()
			dueDateValue.value = null
			dueTimeEnabled.value = false
			dueTimeTouched.value = false
			dueTimeValue.value = defaultDueTime()
			suggestedTime.value = null
			noteValue.value = ''
			dialogSteps.value = []
		}
	})

	// Schedule-first: on a new task, picking a day arms the time as well, so "Tuesday 09:00" is what
	// falls out by default instead of a bare deadline. It stays a suggestion — once the user has
	// touched the switch themselves, their choice is never overridden.
	watch(dueDateValue, (newVal, oldVal) => {
		if (!newVal) {
			dueTimeEnabled.value = false
			return
		}
		if (isEdit.value || dueTimeTouched.value) return
		if (!oldVal) dueTimeValue.value = defaultDueTime(newVal)
		dueTimeEnabled.value = true
	})

	/** 09:00 by default, but never a time that has already passed when the due date is today. */
	function defaultDueTime(date?: Date | null): Time {
		const morning = new Time(9, 0)
		// `date` is a calendar day out of the picker (browser-local fields ARE the value, so read it
		// with `formatDateForApi`); "today" is an instant question, so it resolves in the user's zone.
		if (!date || formatDateForApi(date) !== isoDateInUserZone()) return morning
		// `now` is an instant: the suggested time is one the user silently accepts and we then persist,
		// so it has to be the hour on the user's clock, not the browser's.
		const nextQuarter = Time.fromMinutes(roundToNearestInterval(minutesOfDayInUserZone() + 15, 15))
		return nextQuarter.getInMinutes > morning.getInMinutes && nextQuarter.hours < 24 ? nextQuarter : morning
	}

	onMounted(async () => {
		void ensureLeisurePairingLoaded()
		priorityOptions.value = await fetchAll()
		setDefaultPriority()
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

		toDoListItem.value.dueDate = dueDateValue.value ? formatDateForApi(dueDateValue.value) : null
		toDoListItem.value.dueTime = dueDateValue.value && dueTimeEnabled.value ? dueTimeValue.value : null
		toDoListItem.value.suggestedTime = suggestedTime.value
		// Clearing the select can hand back `undefined`; the entity side is `null`, and
		// `hasObjectChanged` in the view compares the two shapes directly.
		toDoListItem.value.pairedLeisureActivityId = toDoListItem.value.pairedLeisureActivityId ?? null
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

	function setDefaultPriority() {
		toDoListItem.value.taskPriorityId = priorityOptions.value.find(item => item.priority === 1)?.id
	}

	const close = () => {
		dialog.value = false

		activityFormField.value?.reset()
		toDoListItem.value = new ToDoListItemRequest()
		setDefaultPriority()
		suggestedTime.value = null
		dialogSteps.value = []
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
		dueDateValue.value = entityToEdit.dueDate ? new Date(entityToEdit.dueDate + 'T00:00:00') : null
		dueTimeEnabled.value = !!entityToEdit.dueTime
		dueTimeTouched.value = false
		dueTimeValue.value = entityToEdit.dueTime ?? defaultDueTime(dueDateValue.value)
		suggestedTime.value = entityToEdit.suggestedTime ?? null
		noteValue.value = entityToEdit.note ?? ''
		dialogSteps.value = entityToEdit.steps.map((s, i) => new TodoListItemStepRequest(s.name, i + 1, s.note))
		dialog.value = true
	}
	defineExpose({
		openCreate,
		openEdit,
		close,
	})
</script>
