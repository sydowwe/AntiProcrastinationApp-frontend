<template>
	<MyDialog
		v-model="dialogVisible"
		:title="title"
		maxWidth="600px"
		@confirmed="save"
	>
		<VForm
			ref="form"
			validateOn="submit"
			class="d-flex flex-column"
			@keyup.enter="save"
			@submit="save"
		>
			<TimeRangePicker
				v-model:start="data.startTime"
				v-model:end="data.endTime"
				class="mx-auto pt-2 pb-6"
			></TimeRangePicker>

			<VCard
				class="pa-4"
				color="background"
				rounded="lg"
				style="margin: 0 -4px"
			>
				<ActivitySelectOrQuickEditFormField
					ref="activityFormField"
					viewName="Planner task"
					:isEdit
				></ActivitySelectOrQuickEditFormField>
			</VCard>

			<VIdSelect
				v-model="data.importanceId"
				class="pt-8 pb-2"
				:label="$t('planner.importance')"
				:clearable="false"
				:items="importanceOptions"
				required
				:rules="[requiredRule]"
			></VIdSelect>

			<VTextField
				v-model="data.location"
				label="Location"
				prependIcon="map-marker"
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
				label="Notes"
				rows="3"
				autoGrow
				hideDetails
			></VTextarea>

			<div class="d-flex justify-space-between mt-3">
				<VSwitch
					v-model="data.isBackground"
					label="Is background"
					color="primary"
					hideDetails
				/>

				<VSwitch
					v-model="data.isOptional"
					label="Is optional"
					color="primary"
					hideDetails
				/>
			</div>
		</VForm>
	</MyDialog>
</template>

<script
	setup
	lang="ts"
	generic="
		TTask extends IBasePlannerTask<TTaskRequest>,
		TTaskRequest extends IBasePlannerTaskRequest,
		TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>
	"
>
	import { computed, nextTick, onMounted, ref, watch } from 'vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue'
	import type { VForm } from 'vuetify/components'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useTaskImportanceCrud } from '@/api/taskPlanner/taskImportanceApi.ts'
	import type { TaskImportance } from '@/dtos/response/activityPlanning/TaskImportance.ts'
	import type { IBasePlannerTask } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'

	const props = defineProps<{
		title: string
		store: TStore
		createEmptyRequest: () => TTaskRequest
	}>()

	const emit = defineEmits<{
		(e: 'edit', id: number, task: TTaskRequest): void
		(e: 'create', task: TTaskRequest): void
	}>()

	const { fetchAll } = useTaskImportanceCrud()
	const { requiredRule } = useGeneralRules()
	const form = ref<InstanceType<typeof VForm>>()
	const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>()

	const importanceOptions = ref([] as TaskImportance[])

	const dialogVisible = computed({
		get: () => props.store.dialog,
		set: value => props.store.$patch({ dialog: value }),
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
					data.value = props.createEmptyRequest()

					if (props.store.creationPreview) {
						data.value.startTime = props.store.slotIndexToTime(props.store.creationPreview.startRow - 1)
						data.value.endTime = props.store.slotIndexToTime(props.store.creationPreview.endRow)
					}

					setDefaultImportance()
				}
			} else {
				// Clear creation preview when dialog closes
				props.store.$patch({ creationPreview: undefined })
			}
		},
	)

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

		props.store.$patch({ isDuplicating: false, dialog: false })
	}
</script>
