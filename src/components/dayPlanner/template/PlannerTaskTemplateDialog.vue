<template>
<MyDialog
	:title="!isEdit ? 'Add New Template Task' : 'Edit Template Task'"
	v-model="dialog"
	@confirmed="save"
	maxWidth="500px"
>
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<VRow>
			<VCol cols="12">
				<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="Planner task" :isEdit></ActivitySelectOrQuickEditFormField>
			</VCol>

			<VCol cols="12">
				<TimeRangePicker v-model:start="start" v-model:end="end"></TimeRangePicker>
			</VCol>

			<VCol cols="12">
				<VIdSelect
					:label="$t('toDoList.urgency')"
					v-model="data.priorityId"
					:clearable="false"
					:items="priorityOptions"
					required
					:rules="[requiredRule]"
				></VIdSelect>
			</VCol>
			<VCol cols="12" sm="6">
				<VSwitch
					label="Is background"
					color="primary"
					v-model="data.isBackground"
					hideDetails
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is optional"
					color="primary"
					v-model="data.isOptional"
					hideDetails
				/>
			</VCol>

			<VCol cols="12">
				<VTextarea v-model="data.notes" rows="3" auto-grow></VTextarea>
			</VCol>
		</VRow>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import type {VForm} from 'vuetify/components';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {Time} from '@/utils/TimeUtils.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';

const {fetchAll} = useTaskUrgencyCrud()
const {requiredRule} = useGeneralRules()
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const props = defineProps<{
	editingTask: TemplatePlannerTaskRequest
	dialog: boolean
	isEdit: boolean
	editedId?: string
}>()

const priorityOptions = ref([] as TaskPriority[]);

const dialog = defineModel<boolean>('dialog')

const data = ref<TemplatePlannerTaskRequest>(new TemplatePlannerTaskRequest())
const start = ref<Time>(new Time(0, 0))
const end = ref<Time>(new Time(0, 0))

onMounted(async () => {
	priorityOptions.value = await fetchAll();
	setDefaultUrgency();
})

function setDefaultUrgency() {
	data.value.priorityId = priorityOptions.value.find((item) => item.priority === 1)?.id ?? null;
}

watch(() => props.dialog, (value) => {
	if (value) {
		if (props.isEdit && props.editingTask) {
			// Edit mode: populate from props
			data.value = {...props.editingTask}

			if (props.editingTask.startTime) {
				const [hours, minutes] = props.editingTask.startTime.split(':').map(Number)
				start.value = new Time(hours, minutes)
			}

			if (props.editingTask.endTime) {
				const [hours, minutes] = props.editingTask.endTime.split(':').map(Number)
				end.value = new Time(hours, minutes)
			}
		} else {
			// New mode: reset to defaults
			data.value = new TemplatePlannerTaskRequest()
			setDefaultUrgency()
			start.value = new Time(0, 0)
			end.value = new Time(0, 0)
		}
	}
})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid) {
		return;
	}

	const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus();
	if (!activityFormFieldResult) {
		return;
	}

	data.value.activityId = activityFormFieldResult.activityId
	data.value.startTime = `${start.value.hours.toString().padStart(2, '0')}:${start.value.minutes.toString().padStart(2, '0')}:00`
	data.value.endTime = `${end.value.hours.toString().padStart(2, '0')}:${end.value.minutes.toString().padStart(2, '0')}:00`

	if (props.editedId) {
		emit('edit', props.editedId, data.value)
	} else {
		emit('create', data.value)
	}

	dialog.value = false
}

const emit = defineEmits<{
	(e: 'edit', id: number, task: TemplatePlannerTaskRequest): void
	(e: 'create', task: TemplatePlannerTaskRequest): void
}>()
</script>

<style scoped>

</style>