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

const data = ref<TTaskRequest>(props.store.editingTask as TTaskRequest)

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
		if (props.store.editingTask) {
			data.value = {...props.store.editingTask as TTaskRequest}
			if (props.store.editedId) {
				activityFormField.value?.onOpenEdit(props.store.editingTask.activityId!)
			} else {
				setDefaultImportance()
			}
		}
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
