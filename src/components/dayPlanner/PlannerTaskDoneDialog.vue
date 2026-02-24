<template>
<MyDialog v-model="dialogShown" title="Task done" @confirmed="save" :confirmButtonLabel="i18n.t('general.save')" :eager="true">
	<template v-slot:header>
		<div class="text-wrap">
			{{ i18n.t('toDoList.saveTask') }}
			<span class="text-purple-accent-4 font-weight-bold">{{ plannerTask?.activity?.name }}</span>
			{{ i18n.t('history.toHistory').toLowerCase() }}?
		</div>
	</template>
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<div class="d-flex flex-column flex-sm-row mb-4">
			<VLabel>{{ i18n.t('dateTime.date') }}</VLabel>
			<VDateInput v-model="dateTime" class="ml-2 flex-grow-1" :displayFormat="formatToDateTs" :clearable="false"></VDateInput>
		</div>
		<div class="d-flex flex-column flex-sm-row mb-4">
			<VLabel>{{ i18n.t('dateTime.time') }}</VLabel>
			<TimePicker v-model="startTime" class="ml-2 flex-grow-1" allowedMinutesSelected="10"></TimePicker>
		</div>
		<div class="d-flex flex-column flex-sm-row mb-4">
			<VLabel>{{ i18n.t('dateTime.length') }}</VLabel>
			<TimePicker v-model="length" class="ml-2 flex-grow-1"></TimePicker>
		</div>
	</VForm>
</MyDialog>
</template>
<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {Time} from '@/dtos/dto/Time.ts';
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';

import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useMoment} from '@/utils/momentHelper.ts';
import {useActivityHistoryCrud} from '@/api/ConcretesCrudComposable.ts';
import type {VForm} from 'vuetify/components';

const {create} = useActivityHistoryCrud()
const {formatToDate} = useMoment()
const formatToDateTs = formatToDate as (date: unknown) => string
const i18n = useI18n();
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();

const props = defineProps<{
	plannerTask: PlannerTask,
	isRecursive: boolean
}>();

const emit = defineEmits<{
	openNext: []
}>();

const dialogShown = defineModel<boolean>({required: true});
const form = ref<InstanceType<typeof VForm>>();
const dateTime = ref(new Date());
const startTime = ref(new Time());
const length = ref(new Time());

function calculateMinuteLength(): number {
	const startMinutes = props.plannerTask.startTime.getInMinutes;
	const endMinutes = props.plannerTask.endTime.getInMinutes;

	if (endMinutes >= startMinutes) {
		return endMinutes - startMinutes;
	} else {
		// Task crosses midnight
		return (24 * 60 - startMinutes) + endMinutes;
	}
}

onMounted(() => {
	const now = new Date();
	startTime.value = Time.fromDate(now);
	const minuteLength = calculateMinuteLength();
	length.value = new Time(Math.floor(minuteLength / 60), minuteLength % 60);
})

watch(dialogShown, (isShown) => {
	if (isShown) {
		if (!props.isRecursive) {
			dateTime.value = new Date();
			startTime.value = Time.fromDate(new Date());
		}
		const minuteLength = calculateMinuteLength();
		length.value = new Time(Math.floor(minuteLength / 60), minuteLength % 60);
	} else {
		if (props.isRecursive) {
			setTimeout(() => emit('openNext'), 200);
		}
	}
})

async function save() {
	const isValid = await form.value?.validate();
	if (!isValid?.valid) {
		return;
	}

	// Set the time on the date from the startTime
	dateTime.value.setHours(startTime.value.hours);
	dateTime.value.setMinutes(startTime.value.minutes);

	const request = await create(dateTime.value, length.value, props.plannerTask.activity.id)
	if (request) {
		showSuccessSnackbar(`Saved done planner task ${props.plannerTask.activity.name} to history`);
		dialogShown.value = false;
	} else {
		showErrorSnackbar(`Error saving planner task ${props.plannerTask.activity.name} to history`);
	}
}
</script>
<style scoped>
</style>