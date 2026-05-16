<template>
	<MyDialog
		v-model="dialog"
		:title="editedId ? 'Edit Repeating Task' : 'New Repeating Task'"
		:isSmall="false"
		@confirmed="save"
		@closed="reset"
	>
		<VForm
			ref="form"
			validateOn="submit"
			class="d-flex flex-column ga-4 pt-2"
		>
			<!-- Activity -->
			<VCard
				class="pa-4"
				color="background"
				rounded="lg"
			>
				<ActivitySelectOrQuickEditFormField
					ref="activityFormField"
					viewName="Planner task"
					:isEdit="!!editedId"
				/>
			</VCard>

			<!-- Time range -->
			<TimeRangePicker
				class="mx-auto"
				v-model:start="data.startTime"
				v-model:end="data.endTime"
			/>

			<div class="d-flex justify-space-between">
				<!-- Background toggle -->
				<VSwitch
					v-model="data.isBackground"
					label="Is background"
					color="primary"
					hideDetails
				/>

				<VSwitch
					v-if="editedId"
					v-model="data.isActive"
					label="Active"
					color="success"
					hideDetails
				/>
			</div>

			<!-- Location -->
			<VTextField
				v-model="data.location"
				label="Location"
				prependInnerIcon="location-dot"
				hideDetails
			/>

			<!-- Importance -->
			<VIdSelect
				v-model="data.importanceId"
				:label="$t('planner.importance')"
				:items="importanceOptions"
				:prependInnerIcon="currentImportance?.icon"
				:clearable="false"
				required
				:rules="[requiredRule]"
			/>

			<!-- Notes -->
			<VTextarea
				v-model="data.notes"
				label="Notes"
				prependInnerIcon="note-sticky"
				rows="2"
				autoGrow
				hideDetails
			/>

			<VDivider />

			<!-- Recurrence type -->
			<div>
				<div class="text-caption text-medium-emphasis mb-2 text-uppercase font-weight-bold">Recurrence</div>
				<VBtnToggle
					v-model="data.recurrenceType"
					mandatory
					color="primary"
					density="compact"
					rounded
					class="w-100 flex-wrap"
				>
					<VBtn
						v-for="type in recurrenceTypes"
						:key="type.value"
						:value="type.value"
						:prependIcon="type.icon"
						class="flex-grow-1"
					>
						{{ type.label }}
					</VBtn>
				</VBtnToggle>
			</div>

			<!-- DayOfWeek detail -->
			<div v-if="data.recurrenceType === RecurrenceType.DayOfWeek">
				<div class="text-caption text-medium-emphasis mb-2">Days of week</div>
				<div class="d-flex flex-wrap ga-2">
					<VChip
						v-for="day in dayOfWeekOptions"
						:key="day.value"
						:color="data.scheduledDays.includes(day.value) ? 'primary' : undefined"
						:variant="data.scheduledDays.includes(day.value) ? 'elevated' : 'outlined'"
						style="cursor: pointer"
						@click="toggleDay(day.value)"
					>
						{{ day.label }}
					</VChip>
				</div>
				<div
					v-if="showRecurrenceError && recurrenceError"
					class="text-error text-caption mt-2"
				>
					{{ recurrenceError }}
				</div>
				<ActiveWindowPicker
					v-model:hasWindow="hasActiveWindow"
					v-model:from="fromDate"
					v-model:to="toDate"
					:showError="showRecurrenceError"
				/>
			</div>

			<!-- DayOfMonth detail -->
			<div v-else-if="data.recurrenceType === RecurrenceType.DayOfMonth">
				<div class="text-caption text-medium-emphasis mb-2">Days of month</div>
				<div class="d-flex flex-wrap ga-1">
					<VChip
						v-for="d in 31"
						:key="d"
						size="small"
						:color="data.scheduledDates.includes(d) ? 'primary' : undefined"
						:variant="data.scheduledDates.includes(d) ? 'elevated' : 'outlined'"
						style="cursor: pointer"
						@click="toggleDate(d)"
					>
						{{ d }}
					</VChip>
				</div>
				<div
					v-if="showRecurrenceError && recurrenceError"
					class="text-error text-caption mt-2"
				>
					{{ recurrenceError }}
				</div>
				<ActiveWindowPicker
					v-model:hasWindow="hasActiveWindow"
					v-model:from="fromDate"
					v-model:to="toDate"
					:showError="showRecurrenceError"
				/>
			</div>

			<!-- DateRange detail -->
			<div v-else-if="data.recurrenceType === RecurrenceType.DateRange">
				<div class="text-caption text-medium-emphasis mb-2">Active date range</div>
				<div class="d-flex ga-3 flex-wrap">
					<VDateInput
						v-model="fromDate"
						label="From"
						clearable
						density="comfortable"
						:hideDetails="!(showRecurrenceError && recurrenceError)"
						:errorMessages="
							showRecurrenceError && recurrenceError && !fromDate ? recurrenceError : undefined
						"
						style="min-width: 190px"
					/>
					<VDateInput
						v-model="toDate"
						label="To"
						clearable
						density="comfortable"
						:hideDetails="!(showRecurrenceError && recurrenceError)"
						:errorMessages="showRecurrenceError && recurrenceError && !toDate ? recurrenceError : undefined"
						style="min-width: 190px"
					/>
				</div>
			</div>

			<!-- DayType detail -->
			<div v-else-if="data.recurrenceType === RecurrenceType.DayType">
				<div class="text-caption text-medium-emphasis mb-2">Day types</div>
				<div class="d-flex flex-wrap ga-2">
					<VChip
						v-for="type in dayTypeOptions"
						:key="type"
						:prependIcon="getDayTypeIcon(type)"
						:color="data.scheduledForDayTypes.includes(type) ? getDayTypeColor(type) : undefined"
						:variant="data.scheduledForDayTypes.includes(type) ? 'elevated' : 'outlined'"
						style="cursor: pointer"
						@click="toggleDayType(type)"
					>
						{{ type }}
					</VChip>
				</div>
				<div
					v-if="showRecurrenceError && recurrenceError"
					class="text-error text-caption mt-2"
				>
					{{ recurrenceError }}
				</div>
			</div>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import ActiveWindowPicker from '@/components/dayPlanner/settings/ActiveWindowPicker.vue'
	import type { VForm } from 'vuetify/components'
	import { VDateInput } from 'vuetify/labs/components'
	import { getRecurrenceTypeIcon, RecurrenceType } from '@/dtos/enum/RecurrenceType.ts'
	import type { DayOfWeek } from '@/dtos/enum/DayOfWeek.ts'
	import { dayOfWeekOptions } from '@/dtos/enum/DayOfWeek.ts'
	import type { DayType } from '@/dtos/enum/DayType.ts'
	import { dayTypeOptions, getDayTypeColor, getDayTypeIcon } from '@/dtos/enum/DayType.ts'
	import { RepeatingPlannerTaskRequest } from '@/dtos/request/activityPlanning/RepeatingPlannerTaskRequest.ts'
	import type { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'
	import { useTaskImportanceCrud } from '@/api/taskPlanner/taskImportanceApi.ts'
	import type { TaskImportance } from '@/dtos/response/activityPlanning/TaskImportance.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'

	const emit = defineEmits<{
		create: [req: RepeatingPlannerTaskRequest]
		edit: [id: number, req: RepeatingPlannerTaskRequest]
	}>()

	const { fetchAll: fetchImportanceOptions } = useTaskImportanceCrud()
	const { requiredRule } = useGeneralRules()

	const dialog = ref(false)
	const editedId = ref<number | undefined>()
	const form = ref<InstanceType<typeof VForm>>()
	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()
	const importanceOptions = ref<TaskImportance[]>([])
	const currentImportance = computed(() => importanceOptions.value.find(i => i.id === data.value.importanceId))
	const showRecurrenceError = ref(false)
	const hasActiveWindow = ref(false)

	const recurrenceError = computed<string | null>(() => {
		switch (data.value.recurrenceType) {
			case RecurrenceType.DayOfWeek:
				if (data.value.scheduledDays.length === 0) return 'Select at least one day'
				if (hasActiveWindow.value && (!fromDate.value || !toDate.value))
					return 'Both dates required for active window'
				return null
			case RecurrenceType.DayOfMonth:
				if (data.value.scheduledDates.length === 0) return 'Select at least one day of month'
				if (hasActiveWindow.value && (!fromDate.value || !toDate.value))
					return 'Both dates required for active window'
				return null
			case RecurrenceType.DateRange:
				if (!fromDate.value && !toDate.value) return 'Both dates are required'
				if (!fromDate.value) return 'Start date is required'
				if (!toDate.value) return 'End date is required'
				return null
			case RecurrenceType.DayType:
				return data.value.scheduledForDayTypes.length === 0 ? 'Select at least one day type' : null
		}
	})

	onMounted(async () => {
		importanceOptions.value = await fetchImportanceOptions()
	})

	const recurrenceTypes = Object.values(RecurrenceType).map(v => ({
		value: v,
		label: v.replace(/([A-Z])/g, ' $1').trim(),
		icon: getRecurrenceTypeIcon(v),
	}))

	function createEmpty(): RepeatingPlannerTaskRequest {
		return new RepeatingPlannerTaskRequest()
	}

	const data = ref<RepeatingPlannerTaskRequest>(createEmpty())

	const fromDate = ref<Date | null>(null)
	const toDate = ref<Date | null>(null)

	function openAddDialog() {
		editedId.value = undefined
		data.value = createEmpty()
		data.value.importanceId = importanceOptions.value.find(i => i.importance === 400)?.id ?? null
		fromDate.value = null
		toDate.value = null
		hasActiveWindow.value = false
		dialog.value = true
	}

	function openEditDialog(task: RepeatingPlannerTask) {
		editedId.value = task.id
		data.value = RepeatingPlannerTaskRequest.fromEntity(task)
		fromDate.value = task.activeFromDate ? new Date(task.activeFromDate) : null
		toDate.value = task.activeToDate ? new Date(task.activeToDate) : null
		hasActiveWindow.value =
			(task.recurrenceType === RecurrenceType.DayOfWeek || task.recurrenceType === RecurrenceType.DayOfMonth) &&
			!!(task.activeFromDate || task.activeToDate)
		activityFormField.value?.onOpenEdit(task.activity.id)
		dialog.value = true
	}

	function reset() {
		editedId.value = undefined
		data.value = createEmpty()
		fromDate.value = null
		toDate.value = null
		hasActiveWindow.value = false
		showRecurrenceError.value = false
	}

	function toggleDay(day: DayOfWeek) {
		const idx = data.value.scheduledDays.indexOf(day)
		if (idx >= 0) {
			data.value.scheduledDays.splice(idx, 1)
		} else {
			data.value.scheduledDays.push(day)
			showRecurrenceError.value = false
		}
	}

	function toggleDate(d: number) {
		const idx = data.value.scheduledDates.indexOf(d)
		if (idx >= 0) {
			data.value.scheduledDates.splice(idx, 1)
		} else {
			data.value.scheduledDates.push(d)
			showRecurrenceError.value = false
		}
	}

	function toggleDayType(type: DayType) {
		const idx = data.value.scheduledForDayTypes.indexOf(type)
		if (idx >= 0) {
			data.value.scheduledForDayTypes.splice(idx, 1)
		} else {
			data.value.scheduledForDayTypes.push(type)
			showRecurrenceError.value = false
		}
	}

	async function save() {
		const isValid = await form.value?.validate()
		showRecurrenceError.value = true
		if (!isValid?.valid || recurrenceError.value) return

		const activityResult = await activityFormField.value?.execAndReturnStatus()
		if (!activityResult) return

		data.value.activityId = activityResult.activityId

		const writeWindow =
			data.value.recurrenceType === RecurrenceType.DateRange ||
			((data.value.recurrenceType === RecurrenceType.DayOfWeek ||
				data.value.recurrenceType === RecurrenceType.DayOfMonth) &&
				hasActiveWindow.value)
		data.value.activeFromDate = writeWindow ? (fromDate.value?.toISOString().split('T')[0] ?? null) : null
		data.value.activeToDate = writeWindow ? (toDate.value?.toISOString().split('T')[0] ?? null) : null

		const req = { ...data.value }
		if (editedId.value !== undefined) {
			emit('edit', editedId.value, req)
		} else {
			emit('create', req)
		}
		dialog.value = false
	}

	defineExpose({ openAddDialog, openEditDialog })
</script>
