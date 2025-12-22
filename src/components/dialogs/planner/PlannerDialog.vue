<template>
<MyDialog v-model="dialog" :title="i18n.t('planner.task')" @closed="closeAndReset" @confirmed="save" :eager="true">
	<div class="d-flex flex-column">
		<TimePicker label="Kedy" v-model="time"></TimePicker>
		<VCheckbox class="mx-auto mt-3 mb-2" v-model="isActivityFormHidden"
		           :label="isEdit ? i18n.t('planner.quickEditPlannerActivity'): i18n.t('planner.quickCreatePlannerActivity')"
		           density="comfortable" hideDetails></VCheckbox>
		<ActivitySelectionForm ref="activitySelectionForm" v-show="!isActivityFormHidden" class="mb-4" :showFromToDoListField="false"
		                       :formDisabled="false" :isInDialog="true" :activityId="plannerTask.activityId"
		                       :selectOptionsSource="ActivityOptionsSource.ALL"
		                       @activityIdChanged="activityId => plannerTask.activityId = activityId"></ActivitySelectionForm>
		<div v-show="isActivityFormHidden">
			<VTextField label="name" v-model="activityFormFieldData.name"></VTextField>
			<VTextField label="text" v-model="activityFormFieldData.text"></VTextField>
		</div>
		<VSelect class="mb-4" label="Length in minutes" v-model="plannerTask.minuteLength" :items="minuteIntervals"
		         hideDetails></VSelect>
		<VColorPicker v-model="plannerTask.color" class="mx-auto" hideInputs></VColorPicker>
	</div>
</MyDialog>
</template>
<script setup lang="ts">
import TimePicker from "@/components/general/dateTime/TimePicker.vue";
import type {ActivitySelectionFormType} from "@/types/RefTypeInterfaces";
import {ref, watch} from "vue";
import {PlannerTask} from "@/dtos/response/activityPlanning/PlannerTask.ts";
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useQuickCreateActivity} from '@/composables/quickCreateActivityComposition';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';
import {ActivityOptionsSource} from '@/dtos/enum/ActivityOptionsSource.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';


const {
	isActivityFormHidden,
	activityFormFieldData,
	quickCreateActivity,
	quickEditActivity
} = useQuickCreateActivity('Planner task');


const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const minuteIntervals = [10, 15, 30, 45, 60];

const dialog = ref(false);
const plannerTask = ref(new PlannerTaskRequest());
const idToEdit = ref(0);
const isEdit = ref(false);
const time = ref(new TimePrecise())

watch(dialog, (newValue) => {
	if (!newValue) {
		closeAndReset();
	}
});

//TODO osetrit ak sa nezmeni meno alebo text aby sa nerobil quickedit activity ale len casu
async function save() {
	if (isActivityFormHidden.value) {
		if (activityFormFieldData.value.name) {
			if (isEdit.value && plannerTask.value.activityId) {
				if (await quickEditActivity(plannerTask.value.activityId, 'Clone')) {
					emit('quickEditedActivity', idToEdit.value, activityFormFieldData.value.name, activityFormFieldData.value.text);
				}
			} else {
				plannerTask.value.activityId = await quickCreateActivity();
			}
		} else {
			showErrorSnackbar(i18n.t("planner.pleaseEnterActivityName"));
			return;
		}
	} else if (!plannerTask.value.activityId) {
		showErrorSnackbar(i18n.t("planner.pleaseSelectActivity"));
		return;
	}
	plannerTask.value.startTime?.setHours(
		time.value.hours,
		time.value.minutes,
		0,
		1
	);
	if (idToEdit.value === 0) {
		emit("added", plannerTask.value);
	} else {
		emit("edited", idToEdit.value, plannerTask.value);
	}
}

function openEdit(plannerTaskEntity: PlannerTask) {
	isEdit.value = true;
	isActivityFormHidden.value = true;
	time.value.hours = plannerTaskEntity.startTimestamp.getHours();
	time.value.minutes = plannerTaskEntity.startTimestamp.getMinutes();

	quickActivityName.value = plannerTaskEntity.activity.name;
	quickActivityText.value = plannerTaskEntity.activity.text;
	idToEdit.value = plannerTaskEntity.id;
	plannerTask.value = PlannerTaskRequest.fromEntity(plannerTaskEntity);
	open();
}

function openCreate() {
	isEdit.value = false;
	isActivityFormHidden.value = false;
	open();
}

function closeAndReset() {
	close();
	time.value = new TimePrecise();
	plannerTask.value = new PlannerTaskRequest();
}

const emit = defineEmits<{
	'added': [plannerTask: PlannerTaskRequest];
	'edited': [idToEdit: number, plannerTask: PlannerTaskRequest];
	'quickEditedActivity': [id: number, name: string, text: string | null]
}>();
defineExpose({openCreate, openEdit, closeAndReset});
</script>
