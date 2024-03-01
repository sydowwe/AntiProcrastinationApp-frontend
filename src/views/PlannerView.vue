<template>
  <VRow justify="center" class="mt-md-1">
    <VCol cols="12" lg="3" class="mt-2 pb-2 mt-md-0 pb-md-0">
      <VSelect
        label="Timespan"
        v-model="selectedTimeSpan"
        :items="nOHours"
        hideDetails
      ></VSelect>
    </VCol>
    <VCol cols="12" lg="3" class="mt-2 pb-2 mt-md-0 pb-md-0">
      <MyDatePicker ref="datePicker" :clearable="false"></MyDatePicker>
    </VCol>
    <VCol cols="12" lg="3" alignSelf="center">
      <VBtn @click="plannerDialog?.openCreate" color="success"
        >{{ $t("general.add") }}
      </VBtn>
    </VCol>
  </VRow>
  <div
    v-if="plannerTasks.length > 0"
    class="d-flex flex-column mt-5 mt-md-7 table"
  >
    <PlannerTaskItemVue
      :plannerTask="plannerTask"
      @delete="deleteTask"
      @edit="plannerDialog?.openEdit"
      @select="select"
      @unSelect="unSelect"
      v-for="plannerTask in plannerTasks"
    ></PlannerTaskItemVue>
  </div>
  <PlannerDialog
    ref="plannerDialog"
    @added="add"
    @edited="edit"
  ></PlannerDialog>
</template>

<script setup lang="ts">
import PlannerDialog from "../components/dialogs/PlannerDialog.vue";
import PlannerTaskItemVue from "../components/PlannerTaskItem.vue";
import { onMounted, ref } from "vue";
import {MyDatePickerType, PlannerDialogType} from "@/classes/types/RefTypeInterfaces";
import { PlannerTask, PlannerTaskRequest,PlannerTaskFilter } from "@/classes/PlannerTask";
import { importDefaults } from "@/compositions/Defaults";
import MyDatePicker from "@/components/MyDatePicker.vue";

const { i18n, showErrorSnackbar, showSnackbar } = importDefaults();

const plannerDialog = ref<PlannerDialogType>({} as PlannerDialogType);
const datePicker = ref<MyDatePickerType>({} as MyDatePickerType);
const nOHours = [6, 12, 24];
const selectedTimeSpan = ref(nOHours[0]);

const plannerTasks = ref([] as PlannerTask[]);

const url = "task-planner";
onMounted(()=>{
	getAllRecords();
})
const getAllRecords = () => {
	console.log(datePicker.value.getDateISO);
  window.axios.post(`${url}/get-all`,new PlannerTaskFilter(datePicker.value.getDateISO,selectedTimeSpan.value)).then((response) => {
    plannerTasks.value = PlannerTask.listFromObjects(response.data);
  });
};
const add = (plannerTask: PlannerTaskRequest) => {
  if (validatePlannerTask(plannerTask)) {
    window.axios.post(`${url}/add`, plannerTask).then((response) => {
      plannerTasks.value.push(PlannerTask.fromObject(response.data));
      plannerTasks.value.sort(PlannerTask.frontEndSortFunction());
      showSnackbar(i18n.t("successFeedback.added"), {
        timeout: 1500,
        color: "success",
      });
      plannerDialog.value.closeAndReset();
    });
  }
};

const edit = (id: number, plannerTask: PlannerTaskRequest) => {
  if (validatePlannerTask(plannerTask, id)) {
    window.axios.put(`${url}/${id}`, plannerTask).then((response) => {
      plannerTasks.value[
        plannerTasks.value.findIndex((item) => item.id === id)
      ] = PlannerTask.fromObject(response.data);
      plannerTasks.value.sort(PlannerTask.frontEndSortFunction());
      showSnackbar(i18n.t("successFeedback.edited"), {
        timeout: 1500,
        color: "success",
      });
    });
  }
};

function validatePlannerTask(
  plannerTaskRequest: PlannerTaskRequest,
  idToExclude: number | null = null
): boolean {
  console.log(plannerTaskRequest.minuteLength);
  if (
    !plannerTaskRequest.minuteLength ||
    plannerTaskRequest.minuteLength === 0
  ) {
    showErrorSnackbar(i18n.t("taskPlanner.chooseValidLength"));
    return false;
  }
  if (!plannerTaskRequest.name || plannerTaskRequest.name.trim() === "") {
    showErrorSnackbar(i18n.t("taskPlanner.enterTask"));
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
    ? plannerTasks.value.filter((item) => item.id === idToExclude)
    : plannerTasks.value;
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
    window.axios
      .post(`/${url}/batch-delete`, batchDeleteIds)
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
    window.axios
      .delete(`/${url}/${id}`)
      .then((response) => {
        console.log(response.data);
        plannerTasks.value = plannerTasks.value.filter(
          (item: PlannerTask) => item.id !== id
        );
      })
      .catch((error) => {
        console.error(error);
      });
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
  border: 1px solid white; //border-radius: 5px;
}

@media (min-width: 992px) {
  .table {
    font-size: x-large;
  }
}
</style>