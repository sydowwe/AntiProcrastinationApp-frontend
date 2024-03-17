<template>
  <div class="w-100 d-flex" :id="plannerTask.id.toString()">
    <div class="flex-shrink-1 borderWhite cell">{{ timeSpanText }}</div>
    <VSheet
      class="flex-grow-1 cell borderWhite task text-center"
      @click=""
      :color="plannerTask.color"
      >{{ plannerTask.activity.name }} - <i>{{plannerTask.activity.text}}</i>
    </VSheet>
    <div class="flex-shrink-1 borderWhite d-flex ga-1 pa-1">
        <VBtn
          class="px-0 h-100"
          v-for="(item, i) in actions"
          :key="i"
          :color="item.color"
          @click="item.action"
		  style="border-radius: 0;"
        >
          <VIcon
            size="22"
            :color="
              isSelected && item.icon === 'check-circle'
                ? 'deep-purple'
                : 'white'
            "
            :icon="item.icon"
          >
          </VIcon>
        </VBtn>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PlannerTask } from "@/classes/PlannerTask";
import { computed, ref } from "vue";
import { importDefaults } from "@/compositions/Defaults";

const { i18n } = importDefaults();

const props = defineProps({
  plannerTask: {
    type: PlannerTask,
    required: true,
  },
});
const isSelected = ref(false);

const timeSpanText = computed(() => {
  const timestamp = new Date(props.plannerTask?.startTimestamp);
  const startString = timeNice(timestamp);
  timestamp?.setMinutes(
    timestamp.getMinutes() + props.plannerTask?.minuteLength
  );
  return `${startString}-${timeNice(timestamp)}`;
});

function timePartNice(timePart: number) {
  return timePart.toString().padStart(2, "00");
}

function timeNice(timestamp: Date) {
  return `${timePartNice(timestamp.getHours())}:${timePartNice(
    timestamp.getMinutes()
  )}`;
}

const actions = [
  {
    name: "select",
    color: "amber",
    icon: "check-circle",
    action: toggleSelect,
  },
  { name: "edit", color: "blue", icon: "pen-to-square", action: edit },
  { name: "delete", color: "error", icon: "trash", action: del },
];
// function actionButtonText(name: string) {
//   return i18n.t(
//     isSelected.value && name === "select"
//       ? `general.un${name}`
//       : `general.${name}`
//   );
// }

function edit() {
  emits("edit", props.plannerTask);
  isSelected.value = false;
}

function del() {
  emits("delete", props.plannerTask.id);
  isSelected.value = false;
}

function toggleSelect() {
  isSelected.value = !isSelected.value;
  if (isSelected.value) {
    emits("select", props.plannerTask.id);
  } else {
    emits("unSelect", props.plannerTask.id);
  }
}

const emits = defineEmits<{
  (e: "edit", plannerTask: PlannerTask): void;
  (e: "delete", id: number): void;
  (e: "select", id: number): void;
  (e: "unSelect", id: number): void;
}>();
</script>
<style scoped>
.cell {
  padding: 2px 6px;
}

.borderWhite {
  border: 1px solid white;
}

.task {
  cursor: pointer;
  color: black;
  font-weight: 600;
}

@media (min-width: 992px) {
  .cell {
    padding: 5px 10px;
  }
}
</style>
