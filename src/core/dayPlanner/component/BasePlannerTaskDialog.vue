<template>
	<MyDialog
		v-model="dialogVisible"
		:title="title"
		maxWidth="650px"
		@confirmed="save"
	>
		<VForm
			ref="form"
			validateOn="submit"
			class="d-flex flex-column"
			@keyup.enter="save"
			@submit="save"
		>
			<slot name="before-time" />

			<TimeRangePicker
				class="mx-auto my-3"
				:start="data.startTime"
				v-model:end="data.endTime"
				@update:start="onStartTimeChange"
			></TimeRangePicker>
			<div class="mx-auto d-flex flex-wrap ga-1 mb-2">
				<VChip
					v-for="d in DURATION_CHIPS"
					:key="d"
					size="small"
					:color="currentDurationMinutes === d ? 'primaryOutline' : undefined"
					variant="tonal"
					@click="setDuration(d)"
				>
					{{ formatDurationChip(d) }}
				</VChip>
			</div>

			<VCard
				class="pa-4"
				color="background"
				rounded="lg"
				style="margin: 0 -4px"
			>
				<slot
					name="before-activity"
					:data="data"
				/>
				<ActivitySelectOrQuickEditFormField
					v-show="!hideActivitySelector"
					ref="activityFormField"
					:systemRole="SystemActivityRole.PLANNER_TASK"
					:isEdit
				></ActivitySelectOrQuickEditFormField>
			</VCard>

			<div class="d-flex ga-4 ga-md-8">
				<VIdSelect
					v-model="data.importanceId"
					class="pt-8 pb-2"
					:label="$t('planner.importance')"
					:clearable="false"
					:items="importanceOptions"
					:prependInnerIcon="currentImportance?.icon"
					hideDetails
				></VIdSelect>
				<VSwitch
					class="text-no-wrap"
					v-model="data.isBackground"
					:label="$t('planner.settings.isBackgroundLabel')"
					color="primary"
					hideDetails
				/>
			</div>

			<VTextField
				v-model="data.location"
				:label="$t('planner.settings.locationLabel')"
				prependInnerIcon="location-dot"
				clearable
				hideDetails
				class="pb-2"
			/>
			<slot
				name="additional-fields"
				:data="data"
			></slot>

			<VTextarea
				v-model="data.notes"
				:label="$t('planner.settings.notesLabel')"
				prependInnerIcon="note-sticky"
				rows="3"
				autoGrow
				hideDetails
			></VTextarea>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts" generic="TTaskRequest extends IBasePlannerTaskRequest">
	import { computed, nextTick, onMounted, ref, watch } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import ActivitySelectOrQuickEditFormField from '@/core/activity/component/ActivitySelectOrQuickEditFormField.vue'
	import { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'
	import type { VForm } from 'vuetify/components'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useTaskImportanceCrud } from '@/core/dayPlanner/api/taskImportanceApi.ts'
	import type { TaskImportance } from '@/core/dayPlanner/dto/response/TaskImportance.ts'
	import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
	import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import type { PlannerTaskDialogApi } from '@/core/dayPlanner/component/DayPlannerTypes.ts'

	const props = defineProps<{
		title: string
		store: AnyDayPlannerStore
		createEmptyRequest: (suggestedDurationMinutes?: number) => TTaskRequest
		hideActivitySelector?: boolean
		suggestedDurationMinutes?: number
	}>()

	const emit = defineEmits<{
		(e: 'edit', id: number, task: TTaskRequest): void
		(e: 'create', task: TTaskRequest): void
	}>()

	const { fetchAll } = useTaskImportanceCrud()
	const form = ref<InstanceType<typeof VForm>>()
	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()

	const importanceOptions = ref([] as TaskImportance[])
	const currentImportance = computed(() => importanceOptions.value.find(i => i.id === data.value.importanceId))

	const dialogVisible = computed({
		get: () => props.store.dialog,
		set: value => (props.store.dialog = value),
	})

	const isEdit = computed(() => props.store.editedId !== undefined && !props.store.isDuplicating)

	const data = ref<TTaskRequest>(props.createEmptyRequest())

	onMounted(async () => {
		importanceOptions.value = await fetchAll()
		setDefaultImportance()
	})

	function setDefaultImportance() {
		data.value.importanceId = importanceOptions.value.find(item => item.importance === 400)?.id ?? null
	}

	watch(
		() => props.store.dialog,
		async value => {
			if (value) {
				await nextTick()

				if (props.store.editedId) {
					// Edit mode: load task data from store
					const task = props.store.tasks.find(t => t.id === props.store.editedId)
					if (task) {
						// Use toRequest() method if available, otherwise manually map fields
						if ('toRequest' in task && typeof task.toRequest === 'function') {
							data.value = task.toRequest() as TTaskRequest
						} else {
							data.value = {
								...props.createEmptyRequest(),
								activityId: task.activity.id,
								startTime: task.startTime,
								endTime: task.endTime,
								isBackground: task.isBackground,
								location: task.location,
								notes: task.notes,
								importanceId: task.importance?.id ?? null,
								color: task.color,
							} as TTaskRequest
						}
						activityFormField.value?.onOpenEdit(task.activity.id)
					}
				} else {
					// Create mode: use empty request with optional time from creationPreview
					data.value = props.createEmptyRequest(props.suggestedDurationMinutes)

					if (props.store.creationPreview) {
						data.value.startTime = props.store.slotIndexToTime(props.store.creationPreview.startRow - 1)
						data.value.endTime = props.store.slotIndexToTime(props.store.creationPreview.endRow)
					}

					setDefaultImportance()
				}
			} else {
				// Clear creation preview when dialog closes
				props.store.creationPreview = undefined
			}
		},
	)

	const DURATION_CHIPS = [10, 15, 20, 30, 45, 60, 90, 120, 180]

	const currentDurationMinutes = computed(() => {
		if (!data.value.startTime || !data.value.endTime) return 0
		let diff = Time.fromJson(data.value.endTime).getInMinutes - Time.fromJson(data.value.startTime).getInMinutes
		if (diff < 0) diff += 24 * 60
		return diff
	})

	function onStartTimeChange(newStart: Time) {
		let duration = Time.fromJson(data.value.endTime).getInMinutes - Time.fromJson(data.value.startTime).getInMinutes
		if (duration < 0) duration += 24 * 60
		data.value.startTime = newStart
		data.value.endTime = Time.fromMinutes((newStart.getInMinutes + duration) % (24 * 60))
	}

	function setDuration(minutes: number) {
		if (!data.value.startTime) return
		data.value.endTime = Time.fromMinutes((Time.fromJson(data.value.startTime).getInMinutes + minutes) % (24 * 60))
	}

	function formatDurationChip(minutes: number): string {
		if (minutes < 60) return `${minutes}m`
		const h = minutes / 60
		return Number.isInteger(h) ? `${h}h` : `${Math.floor(h)}½h`
	}

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) {
			return
		}

		const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus()
		if (!activityFormFieldResult) {
			return
		}

		data.value.activityId = activityFormFieldResult.activityId

		if (props.store.editedId && !props.store.isDuplicating) {
			emit('edit', props.store.editedId, data.value)
		} else {
			emit('create', data.value)
		}

		props.store.isDuplicating = false
		props.store.dialog = false
	}

	defineExpose<PlannerTaskDialogApi>({
		prefillActivity: (activityId: number) => activityFormField.value?.onOpenEdit(activityId),
		resetActivityField: () => activityFormField.value?.reset(),
		applySuggestedTime: (durationMinutes: number) => setDuration(durationMinutes),
	})
</script>
