<template>
<VDialog v-model="dialog" max-width="600" eager>
	<VCard>
		<VCardTitle class="headline pt-4">{{ i18n.t("planner.task") }}</VCardTitle>
		<VCardText class="d-flex flex-column">
			<TimePicker ref="timePicker"></TimePicker>
			<VCheckbox class="mx-auto mt-3 mb-2" v-model="isActivityFormHidden" :label="i18n.t('planner.quickCreatePlannerActivity')"
			           density="comfortable" hideDetails></VCheckbox>
			<ActivitySelectionForm ref="activitySelectionForm" v-if="!isActivityFormHidden" class="mb-4" :showFromToDoListField="false"
			                       :formDisabled="false" :isInDialog="true"
			                       :activityId="plannerTask.activityId"
			                       @activityIdChanged="activityId => plannerTask.activityId = activityId"></ActivitySelectionForm>
			<template v-else>
				<VTextField label="name" v-model="quickActivityName"></VTextField>
				<VTextField label="text" v-model="quickActivityText"></VTextField>
			</template>
			<VSelect
				class="mb-4"
				label="Length in minutes"
				v-model="plannerTask.minuteLength"
				:items="minuteIntervals"
				hideDetails
			></VSelect>
			<VColorPicker
				v-model="plannerTask.color"
				class="mx-auto"
				hideInputs
			></VColorPicker>
		</VCardText>
		<VCardActions class="justify-center pb-4">
			<VBtn variant="elevated" color="red" @click="close"
			>{{ i18n.t("general.cancel") }}
			</VBtn>
			<VBtn variant="elevated" color="green" @click="save"
			>{{ i18n.t("general.save") }}
			</VBtn>
		</VCardActions>
	</VCard>
</VDialog>
</template>
<script setup lang="ts">
import TimePicker from "@/components/TimePicker.vue";
import {ActivitySelectionFormType, TimePickerType} from "@/classes/types/RefTypeInterfaces";
import {ref} from "vue";
import {importDefaults} from "@/compositions/Defaults";
import {useDialogComposition} from "@/compositions/DialogComposition";
import {PlannerTask, PlannerTaskRequest} from "@/classes/PlannerTask";
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useQuickCreateActivity} from '@/compositions/quickCreateActivityComposition';

const {isActivityFormHidden, quickActivityName, quickActivityText, quickCreateActivity} = useQuickCreateActivity('TaskPlanner');
const {i18n, showErrorSnackbar} = importDefaults();
const {dialog, open, close} = useDialogComposition();
const timePicker = ref<TimePickerType>({} as TimePickerType);
const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const minuteIntervals = [10, 15, 30, 45, 60];

const plannerTask = ref(new PlannerTaskRequest());
const idToEdit = ref(0);


async function save() {
	if (isActivityFormHidden.value) {
		if (quickActivityName.value) {
			plannerTask.value.activityId = await quickCreateActivity();
		} else {
			showErrorSnackbar(i18n.t("planner.pleaseEnterActivityName"));
			return;
		}
	} else if (!plannerTask.value.activityId) {
		showErrorSnackbar(i18n.t("planner.pleaseSelectActivity"));
		return;
	}
	plannerTask.value.startTimestamp?.setHours(
		timePicker.value.getTimeObject.hours,
		timePicker.value.getTimeObject.minutes,
		0,
		1
	);
	console.log(plannerTask.value);
	if (idToEdit.value === 0) {
		emit("added", plannerTask.value);
	} else {
		emit("edited", idToEdit.value, plannerTask.value);
	}
}


function openEdit(plannerTaskEntity: PlannerTask) {
	console.log(plannerTaskEntity);
	activitySelectionForm.value.setSelectedActivityId(plannerTaskEntity.activity.id);
	timePicker.value.set(
		plannerTaskEntity.startTimestamp.getHours(),
		plannerTaskEntity.startTimestamp.getMinutes()
	);
	idToEdit.value = plannerTaskEntity.id;
	plannerTask.value = PlannerTaskRequest.fromEntity(plannerTaskEntity);
	open();
}

function openCreate() {
	open();
}

function closeAndReset() {
	timePicker.value.reset();
	idToEdit.value = 0;
	plannerTask.value = new PlannerTaskRequest();
	close();
}

const emit = defineEmits<{
	(e: "added", plannerTask: PlannerTaskRequest): void;
	(e: "edited", idToEdit: number, plannerTask: PlannerTaskRequest): void;
}>();
defineExpose({openCreate, openEdit, closeAndReset});
</script>
