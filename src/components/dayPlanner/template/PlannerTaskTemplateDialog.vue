<template>
<MyDialog
	:title="!isEdit ? 'Add New Template Task' : 'Edit Template Task'"
	v-model="store.dialog"
	@confirmed="save"
	maxWidth="500px"
>
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<VRow>
			<VCol cols="12">
				<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="Planner task"></ActivitySelectOrQuickEditFormField>
			</VCol>

			<VCol cols="12">
				<TimeRangePicker v-model:start="data.startTime" v-model:end="data.endTime"></TimeRangePicker>
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
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import type {VForm} from 'vuetify/components';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts';

const {fetchAll} = useTaskUrgencyCrud()
const {requiredRule} = useGeneralRules()
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const priorityOptions = ref([] as TaskPriority[]);
const store = useTemplateDayPlannerStore()

const isEdit = computed(() => store.editedId !== undefined)

const data = ref<TemplatePlannerTaskRequest>(new TemplatePlannerTaskRequest())

onMounted(async () => {
	priorityOptions.value = await fetchAll();
	setDefaultUrgency();
})

function setDefaultUrgency() {
	data.value.priorityId = priorityOptions.value.find((item) => item.priority === 1)?.id ?? null;
}

watch(() => store.dialog, async (value) => {
	if (value) {
		await nextTick()
		if (store.editingTask) {
			data.value = {...store.editingTask}
			activityFormField.value?.setDefaultActivityId(store.editingTask.activityId)
		} else {
			// New mode: reset to defaults
			data.value = new TemplatePlannerTaskRequest()
			setDefaultUrgency()
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

	if (store.editedId) {
		emit('edit', store.editedId, data.value)
	} else {
		emit('create', data.value)
	}

	store.dialog = false
}

const emit = defineEmits<{
	(e: 'edit', id: number, task: TemplatePlannerTaskRequest): void
	(e: 'create', task: TemplatePlannerTaskRequest): void
}>()
</script>

<style scoped>

</style>