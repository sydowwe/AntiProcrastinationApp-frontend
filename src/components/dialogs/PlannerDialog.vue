<template>
<VDialog v-model="dialog" max-width="600" eager>
	<VCard>
		<VCardTitle class="headline">{{ i18n.t("planner.task") }}</VCardTitle>
		<VCardText class="d-flex flex-column">
			<TimePicker ref="timePicker"></TimePicker>
			<VCheckbox class="mx-auto mt-3 mb-2" v-model="isActivityFormHidden" :label="i18n.t('planner.quickCreatePlannerActivity')" density="comfortable" hideDetails></VCheckbox>
			<ActivitySelectionForm ref="activitySelectionForm" v-if="!isActivityFormHidden" class="mb-4" :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
			                       :activityId="plannerTask.activityId" @activityIdChanged="activityId => plannerTask.activityId = activityId"></ActivitySelectionForm>
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
		<VCardActions class="justify-center">
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
import {Activity, ActivityRequest} from '@/classes/Activity';

const {i18n,showErrorSnackbar} = importDefaults();
const {dialog, open, close} = useDialogComposition();
const timePicker = ref<TimePickerType>({} as TimePickerType);
const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const minuteIntervals = [10, 15, 30, 45, 60];

const plannerTask = ref(new PlannerTaskRequest());
const idToEdit = ref(0);
const isActivityFormHidden = ref(false);

const quickActivityName = ref("");
const quickActivityText = ref("");

async function save() {
	if(isActivityFormHidden.value){
		if(quickActivityName.value){
			plannerTask.value.activityId = await quickCreatePlannerActivity();
		}
		else{
			showErrorSnackbar(i18n.t("planner.pleaseEnterActivityName"));
			return;
		}
	}
	else if(!plannerTask.value.activityId){
		showErrorSnackbar(i18n.t("planner.pleaseSelectActivity"));
		return;
	}
	plannerTask.value.startTimestamp?.setHours(
		timePicker.value.getTimeObject.hours,
		timePicker.value.getTimeObject.minutes,
		0,
		0
	);
	console.log(plannerTask.value);
	if (idToEdit.value === 0) {
		emit("added", plannerTask.value);
	} else {
		emit("edited", idToEdit.value, plannerTask.value);
	}
}
async function quickCreatePlannerActivity() {
	const activityRequest = new ActivityRequest(quickActivityName.value,quickActivityText.value,false,false,1,null);
	return await axios.post('/activity/create', activityRequest).then((response) => {
		console.log(response);
		const activityResponse = Activity.fromObject(response.data);
		return activityResponse.id;
	});
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
