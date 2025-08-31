<template>
<div class="w-100 d-flex" :id="plannerTask.id.toString()">
	<div class="flex-shrink-1 bg-secondary borderWhite2 cell timeCell">{{ timeSpanText }}</div>
	<VSheet
		class="flex-grow-1 cell borderWhite2 task text-center"
		@click="isDoneChanged"
		:color="plannerTask.color"
	>{{ plannerTask.isDone }} {{ plannerTask.activity.name }} - <i>{{ plannerTask.activity.text }}</i><span v-if="plannerTask.isDone"
	                                                                                                        class="text-green-accent-4 fa-pull-right position-sticky">done</span>
	</VSheet>
	<div class="flex-shrink-1 borderWhite2 bg-secondary d-flex">
		<VBtn
			class="h-100"
			v-for="(item, i) in actions"
			:key="i"
			:color="item.color"
			@click="item.action"
			rounded="0"
			variant="flat"
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
import {PlannerTask} from "@/classes/PlannerTask";
import {computed, ref, watch} from "vue";
import {useMoment} from '@/scripts/momentHelper.ts';

const {formatToTime24H} = useMoment();
const props = defineProps({
	plannerTask: {
		type: PlannerTask,
		required: true,
	},
});
const isSelected = ref(false);

const timeSpanText = computed(() => {
	const timestamp = new Date(props.plannerTask?.startTimestamp);
	const startString = formatToTime24H(timestamp);
	timestamp?.setMinutes(
		timestamp.getMinutes() + props.plannerTask?.minuteLength
	);
	return `${startString} - ${formatToTime24H(timestamp)}`;
});

watch(() => props.plannerTask?.isDone, () => {
	isSelected.value = false;
})

const actions = [
	{
		name: "select",
		color: "amber",
		icon: "check-circle",
		action: toggleSelect,
	},
	{name: "edit", color: "blue", icon: "pen-to-square", action: edit},
	{name: "delete", color: "error", icon: "trash", action: del},
];
function edit() {
	emits("edit", props.plannerTask);
	isSelected.value = false;
}

function isDoneChanged() {
	props.plannerTask.isDone = !props.plannerTask.isDone;
	emits('isDoneChanged', props.plannerTask);
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
	'edit': [plannerTask: PlannerTask];
	'delete': [id: number];
	'select': [id: number];
	'unSelect': [id: number];
	'isDoneChanged': [plannerTask: PlannerTask]
}>();
</script>
<style scoped>
.cell {
	padding: 2px 6px;
}
.timeCell{
	width: 7em;
	text-align: center;
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
