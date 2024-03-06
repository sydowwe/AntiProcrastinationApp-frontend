<template>
  <VDialog v-model="dialog" max-width="600" eager>
    <VCard>
      <VCardTitle class="headline">{{ i18n.t("planner.task") }}</VCardTitle>
      <VCardText class="d-flex flex-column">
        <TimePicker ref="timePicker" class="mb-4"></TimePicker>
        <VTextField label="name" v-model="plannerTask.name"></VTextField>
        <VTextField label="text" v-model="plannerTask.text"></VTextField>
        <VSelect
          class="mb-4"
          label="Length in minutes"
          v-model="plannerTask.minuteLength"
          :items="minuteIntervals"
          hideDetails
        ></VSelect>
        <VColorPicker
          class="mx-auto"
          v-model="plannerTask.color"
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
import { TimePickerType } from "@/classes/types/RefTypeInterfaces";
import { ref } from "vue";
import { importDefaults } from "@/compositions/Defaults";
import { useDialogComposition } from "@/compositions/DialogComposition";
import { PlannerTask, PlannerTaskRequest } from "@/classes/PlannerTask";

const { i18n } = importDefaults();
const { dialog, open, close } = useDialogComposition();
const timePicker = ref<TimePickerType>({} as TimePickerType);
const minuteIntervals = [10, 15, 30, 45, 60];

const plannerTask = ref(new PlannerTaskRequest());
const idToEdit = ref(0);

function save() {
  plannerTask.value.startTimestamp?.setHours(
    timePicker.value.getTimeObject.hours,
    timePicker.value.getTimeObject.minutes,
    0,
    0
  );
	console.log(plannerTask.value.startTimestamp);
  if (idToEdit.value === 0) {
    emit("added", plannerTask.value);
  } else {
    emit("edited", idToEdit.value, plannerTask.value);
  }
}

function openEdit(_plannerTask: PlannerTask) {
	  console.log(_plannerTask);
  timePicker.value.set(
    _plannerTask.startTimestamp.getHours(),
    _plannerTask.startTimestamp.getMinutes()
  );
  idToEdit.value = _plannerTask.id;
  plannerTask.value = PlannerTaskRequest.fromEntity(_plannerTask);
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
defineExpose({ openCreate, openEdit, closeAndReset });
</script>
