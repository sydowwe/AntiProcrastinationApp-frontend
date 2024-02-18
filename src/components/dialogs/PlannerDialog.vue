<template>
  <VDialog v-model="dialog" max-width="600">
    <VCard>
      <VCardTitle class="headline">{{ i18n.t("planner.task") }}</VCardTitle>
      <VCardText class="d-flex flex-column">
        <TimePicker ref="timePicker" class="mb-4"></TimePicker>
        <VTextField v-model="plannerTask.task"></VTextField>
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
const minuteIntervals = [60, 45, 30, 15, 10];

const plannerTask = ref(new PlannerTaskRequest());
const idToEdit = ref(0);

function save() {
  console.log(timePicker.value.time);
  plannerTask.value.startTimestamp?.setHours(timePicker.value.time.hours);
  plannerTask.value.startTimestamp?.setMinutes(timePicker.value.time.minutes);
  if (idToEdit.value === 0){
	  emit('added',plannerTask.value);
  }else {
	  emit('edited', idToEdit.value, plannerTask.value);
  }
  idToEdit.value = 0;
  plannerTask.value = new PlannerTaskRequest();
  close();
}
function openEdit(_plannerTask: PlannerTask) {
  idToEdit.value = _plannerTask.id;
  plannerTask.value = PlannerTaskRequest.fromEntity(_plannerTask);
}
const emit = defineEmits<{
  (e: "added", plannerTask: PlannerTaskRequest): void;
  (e: "edited", idToEdit: number, plannerTask: PlannerTaskRequest): void;
}>();
defineExpose({ open, openEdit });
</script>
