<template>
<div class="d-flex flex-column w-100">
	<VRow justify="center" class="flex-grow-0 mt-md-1">
		<VCol cols="12" lg="6" class="mt-2 mt-md-0 d-flex align-center ga-2">
			<VBtn @click="plannerDialog?.openCreate" color="success">
				{{ i18n.t("general.add") }}
			</VBtn>
			<DateTimePicker ref="dateTimePicker" :date-clearable="false"></DateTimePicker>
		</VCol>
		<VCol cols="12" lg="2" class="d-flex align-center ga-4 pl-1">
			<VSelect
				label="Timespan"
				v-model="selectedTimeSpan"
				:items="nOHours"
				suffix="H"
				:clearable="false"
				hideDetails
				style="max-width: 100px!important;"
			></VSelect>
			<VBtn @click="applyFilter" color="info">
				{{ i18n.t("general.filter") }}
			</VBtn>
		</VCol>
	</VRow>
	<div v-if="plannerTasks.length > 0" class="flex-fill mt-5 mt-md-7 overflow-y-scroll">
		<div
			class="d-flex flex-column table"
		>
			<PlannerTaskItem
				:plannerTask="plannerTask"
				@delete="deleteTask"
				@edit="plannerDialog?.openEdit"
				@select="select"
				@unSelect="unSelect"
				v-for="plannerTask in plannerTasks"
				@isDoneChanged="handleIsDoneChanged"
			></PlannerTaskItem>
		</div>
	</div>
</div>
<PlannerDialog
	ref="plannerDialog"
	@added="add"
	@edited="edit"
	@quickEditedActivity="quickEditedActivity"
></PlannerDialog>
<PlannerTaskDoneDialog :isRecursive="isDialogRecursive" :plannerTask="currentDoneItem" @openNext="recursiveDialogsToSaveToHistory"
                       v-model="itemDoneDialogShown"></PlannerTaskDoneDialog>
</template>

<script setup lang="ts">
import PlannerDialog from "../../components/dialogs/planner/PlannerDialog.vue";
import {onMounted, ref} from "vue";
import type {DateTimePickerType, PlannerDialogType} from "@/classes/types/RefTypeInterfaces.ts";
import {PlannerTask, PlannerTaskRequest, PlannerTaskFilter} from "@/classes/PlannerTask.ts";
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import PlannerTaskDoneDialog from '@/components/dialogs/planner/PlannerTaskDoneDialog.vue';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useTaskPlannerCrud, useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';
import {API} from '@/plugins/axiosConfig.ts';
import PlannerTaskItem from '@/components/PlannerTaskItem.vue';


const i18n = useI18n();
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();

const {createWithResponse, update, deleteEntity} = useTaskPlannerCrud()
const plannerDialog = ref<PlannerDialogType>({} as PlannerDialogType);
const dateTimePicker = ref<DateTimePickerType>({} as DateTimePickerType);
const nOHours = [24, 12, 6];
const selectedTimeSpan = ref(nOHours[0]);

const plannerTasks = ref([] as PlannerTask[]);

const url = "task-planner";
onMounted(() => {
	applyFilter();
})

const itemDoneDialogShown = ref(false);
const isDialogRecursive = ref(false);
const changedItems = ref([] as PlannerTask[]);
const currentDoneItem = ref({} as PlannerTask);

function recursiveDialogsToSaveToHistory() {
	if (changedItems.value.length > 0) {
		console.log(changedItems.value);
		isDialogRecursive.value = true;
		currentDoneItem.value = changedItems.value[0];
		itemDoneDialogShown.value = true;
		console.log(itemDoneDialogShown.value);
		changedItems.value.splice(0, 1);
	}
}

const handleIsDoneChanged = (plannerTask: PlannerTask) => {
	console.log(selectedItemsIds.value, plannerTask);
	const isBatchAction = selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(plannerTask.id);
	if (plannerTask.isDone) {
		if (isBatchAction) {
			changedItems.value = plannerTasks.value.filter((item: PlannerTask) => selectedItemsIds.value.includes(item.id));
			recursiveDialogsToSaveToHistory();
		} else {
			currentDoneItem.value = plannerTask;
			isDialogRecursive.value = false;
			itemDoneDialogShown.value = true;
		}
	}
	const changedItemsIds = isBatchAction ? selectedItemsIds.value.map((item: number) => ({id: item})) : [{id: plannerTask.id}];
	console.log(isBatchAction);
	console.log(changedItemsIds);
	API.patch(`/${url}/change-done`, changedItemsIds)
		.then((response) => {
			console.log(response);
			if (isBatchAction) {
				plannerTasks.value.forEach((item) => {
					if (selectedItemsIds.value.includes(item.id) && item.id !== plannerTask.id) {
						item.isDone = !item.isDone;
					}
				});
				selectedItemsIds.value = [];
			}
		})
		.catch((error) => {
			console.error(error);
		});
};

function applyFilter() {
	console.log(dateTimePicker.value.getDateTime?.toISOString(), selectedTimeSpan.value);
	API.post(`/${url}/apply-filter`, new PlannerTaskFilter(dateTimePicker.value.getDateTime?.toISOString() ?? null, selectedTimeSpan.value))
		.then((response) => {
			console.log(response.data);
			plannerTasks.value = PlannerTask.listFromObjects(response.data);
		}).catch(error => {
		console.log(error)
	});
}

const add = (plannerTask: PlannerTaskRequest) => {
	if (validatePlannerTask(plannerTask)) {
		createWithResponse(plannerTask).then((response) => {
			plannerTasks.value.push(response);
			plannerTasks.value.sort(PlannerTask.frontEndSortFunction());
			showSuccessSnackbar(i18n.t("successFeedback.added"));
			plannerDialog.value.closeAndReset();
		})
	}
};

function quickEditedActivity(id: number, name: string, text: string | null) {
	const editedActivity = plannerTasks.value[plannerTasks.value.findIndex(item => item.id === id)];
	if (editedActivity) {
		editedActivity.activity.name = name;
		editedActivity.activity.text = text;
	}
}

const edit = (id: number, plannerTask: PlannerTaskRequest) => {
	const beforeEditEntity = plannerTasks.value.find(item => item.id === id);
	if (beforeEditEntity
		&& (beforeEditEntity.activity.id !== plannerTask.activityId || beforeEditEntity.startTimestamp !== plannerTask.startTimestamp || beforeEditEntity.minuteLength !== plannerTask.minuteLength || beforeEditEntity.color !== plannerTask.color)
		&& validatePlannerTask(plannerTask, id)
	) {
		update(id, plannerTask).then((response) => {
			plannerTasks.value[plannerTasks.value.findIndex((item) => item.id === id)] = response;
			plannerTasks.value.sort(PlannerTask.frontEndSortFunction());
			showSuccessSnackbar(i18n.t("successFeedback.edited"))
			plannerDialog.value.closeAndReset();
		})
	}
};

//TODO presunut do dialogu
function validatePlannerTask(
	plannerTaskRequest: PlannerTaskRequest,
	idToExclude: number | null = null
): boolean {
	if (
		!plannerTaskRequest.minuteLength ||
		plannerTaskRequest.minuteLength === 0
	) {
		showErrorSnackbar(i18n.t("taskPlanner.chooseValidLength"));
		return false;
	}
	if (!checkNoTimeOverlap(plannerTaskRequest, idToExclude)) {
		showErrorSnackbar(i18n.t("taskPlanner.taskForThatPeriodAlreadyExists"));
		return false;
	}
	return true;
}

function checkNoTimeOverlap(
	plannerTaskRequest: PlannerTaskRequest,
	idToExclude: number | null = null
): boolean {
	const filteredArray = idToExclude
		? plannerTasks.value.filter((item) => item.id !== idToExclude)
		: plannerTasks.value;
	console.log(idToExclude)
	console.log(filteredArray);
	return filteredArray.every((plannerTask: PlannerTask) => {
		const existingTaskEndTimestamp = new Date(plannerTask.startTimestamp);
		existingTaskEndTimestamp.setMinutes(
			existingTaskEndTimestamp.getMinutes() + plannerTask.minuteLength,
			0,
			0
		);
		const newTaskEndTimestamp = new Date(plannerTaskRequest.startTimestamp);
		newTaskEndTimestamp.setMinutes(
			newTaskEndTimestamp.getMinutes() + (plannerTaskRequest.minuteLength ?? 0),
			0,
			0
		);
		return (
			newTaskEndTimestamp.valueOf() <= plannerTask.startTimestamp.valueOf() ||
			existingTaskEndTimestamp.valueOf() <=
			plannerTaskRequest.startTimestamp.valueOf()
		);
	});
}

function deleteTask(id: number) {
	if (selectedItemsIds.value.length > 1) {
		const batchDeleteIds = selectedItemsIds.value.map((item: number) => ({
			id: item,
		}));
		API.post(`/${url}/batch-delete`, batchDeleteIds)
			.then((response) => {
				console.log(response.data);
				if (response.data.status === "success") {
					plannerTasks.value = plannerTasks.value.filter(
						(item: PlannerTask) => !selectedItemsIds.value.includes(item.id)
					);
					selectedItemsIds.value = [];
				}
			})
			.catch((error) => {
				console.error(error);
			});
	} else {
		deleteEntity(id).then((response) => {
			plannerTasks.value = plannerTasks.value.filter(
				(item: PlannerTask) => item.id !== id
			);
		})
	}
}

const selectedItemsIds = ref([] as number[]);

function select(id: number) {
	if (!selectedItemsIds.value.includes(id)) {
		selectedItemsIds.value.push(id);
	}
}

function unSelect(id: number) {
	selectedItemsIds.value = selectedItemsIds.value.filter((item) => item != id);
}
</script>

<style scoped>
.table {
	border-collapse: collapse;
	user-select: none;
	border: 1px solid white;
	border-radius: 5px;
}

@media (min-width: 992px) {
	.table {
		font-size: x-large;
	}
}
</style>
