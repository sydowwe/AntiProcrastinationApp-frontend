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
    <VCol cols="12" lg="3" alignSelf="center">
      <VBtn @click="plannerDialog.openCreate" color="success"
        >{{ $t("general.add") }}
      </VBtn>
    </VCol>
  </VRow>
  <div class="d-flex flex-column mt-5 mt-md-7 table">
    <PlannerTaskItemVue
      :plannerTask="plannerTask"
      @delete="deleteTask"
      @edit="plannerDialog.openEdit"
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
import { ref } from "vue";
import { PlannerDialogType } from "@/classes/types/RefTypeInterfaces";
import { PlannerTask, PlannerTaskRequest } from "@/classes/PlannerTask";
import { importDefaults } from "@/compositions/Defaults";
const { i18n, showErrorSnackbar, showSnackbar } = importDefaults();

const plannerDialog = ref<PlannerDialogType>({} as PlannerDialogType);
const nOHours = [6, 12, 24];
const selectedTimeSpan = ref(nOHours[0]);

const plannerTasks = ref([
  new PlannerTask(1, new Date(), 30, "test", "blue"),
] as PlannerTask[]);

const url = "taskPlanner";
const getAllRecords = () => {
  window.axios.post(`${url}/get-all`).then((response) => {
    console.log(response);
    plannerTasks.value = PlannerTask.listFromObjects(response.data);
  });
};
getAllRecords();
const add = (plannerTask: PlannerTaskRequest) => {
  window.axios.post(`${url}/add`, plannerTask).then((response) => {
    plannerTasks.value.push(PlannerTask.fromObject(response.data));
    plannerTasks.value.sort(PlannerTask.frontEndSortFunction());
    showSnackbar(i18n.t("successFeedback.added"), {
      timeout: 1500,
      color: "success",
    });
  });
};

const edit = (id: number, plannerTask: PlannerTaskRequest) => {
  window.axios.put(`${url}/${id}`, plannerTask).then((response) => {
    console.log(response.data);
    //TODO
    showSnackbar(i18n.t("successFeedback.edited"), {
      timeout: 1500,
      color: "success",
    });
  });
};

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
  border: 1px solid white;
}

@media (min-width: 992px) {
  .table {
    font-size: x-large;
  }
}
</style>
