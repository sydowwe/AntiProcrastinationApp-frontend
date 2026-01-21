<template>
<MyDialog
	:title="title"
	v-model="store.dialog"
	@confirmed="save"
	maxWidth="600px"
>
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit" class="d-flex flex-column">
		<TimeRangePicker class="mx-auto pt-2 pb-6" v-model:start="data.startTime" v-model:end="data.endTime"></TimeRangePicker>

		<VCard class="pa-4" color="background" rounded="lg" style="margin: 0 -4px">
			<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="Planner task" :isEdit></ActivitySelectOrQuickEditFormField>
		</VCard>

		<VIdSelect
			class="pt-8 pb-2"
			:label="$t('planner.importance')"
			v-model="data.importanceId"
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
		<slot name="additional-fields" :data="data"></slot>

		<VTextarea label="Notes" v-model="data.notes" rows="3" auto-grow hideDetails></VTextarea>

		<div class="d-flex justify-space-between mt-3">
			<VSwitch
				label="Is background"
				color="primary"
				v-model="data.isBackground"
				hideDetails
			/>

			<VSwitch
				label="Is optional"
				color="primary"
				v-model="data.isOptional"
				hideDetails
			/>
		</div>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import type {VForm} from 'vuetify/components';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useTaskImportanceCrud} from '@/composables/ConcretesCrudComposable.ts';
import type {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';

const props = defineProps<{
	title: string
	store: TStore
	createEmptyRequest: () => TTaskRequest
}>()

const emit = defineEmits<{
	(e: 'edit', id: number, task: TTaskRequest): void
	(e: 'create', task: TTaskRequest): void
}>()

const {fetchAll} = useTaskImportanceCrud()
const {requiredRule} = useGeneralRules()
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const importanceOptions = ref([] as TaskImportance[]);

const isEdit = computed(() => props.store.editedId !== undefined)

const data = ref<TTaskRequest>(props.createEmptyRequest())

onMounted(async () => {
	importanceOptions.value = await fetchAll();
	setDefaultImportance();
})

function setDefaultImportance() {
	data.value.importanceId = importanceOptions.value.find((item) => item.importance === 400)?.id ?? null;
}

watch(() => props.store.dialog, async (value) => {
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
						color: task.color
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
		props.store.creationPreview = undefined
	}
})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid?.valid) {
		return;
	}

	const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus();
	if (!activityFormFieldResult) {
		return;
	}

	data.value.activityId = activityFormFieldResult.activityId

	if (props.store.editedId) {
		emit('edit', props.store.editedId, data.value)
	} else {
		emit('create', data.value)
	}

	props.store.dialog = false
}
</script>
