<template>
	<MyDialog v-model="dialogShown" :title="i18n.t('user.passwordChange')" @confirmed="save" :confirmButtonLabel="i18n.t('general.save')" :eager="true">
		<template v-slot:header>
			<div class="text-wrap">
				{{ i18n.t('toDoList.saveTask') }}
				<span class="text-purple-accent-4 font-weight-bold">{{ plannerTask?.activity?.name }}</span>
				{{ i18n.t('history.toHistory').toLowerCase() }}?
			</div>
		</template>
		<VForm @keyup.native.enter="save">
			<div class="d-flex flex-column flex-sm-row mb-4">
				<VLabel>{{ i18n.t('dateTime.date') }}</VLabel>
				<MyDatePicker v-model="dateTime" class="ml-2 flex-grow-1" :clearable="false"></MyDatePicker>
			</div>
			<div class="d-flex flex-column flex-sm-row mb-4">
				<VLabel>{{ i18n.t('dateTime.time') }}</VLabel>
				<TimePicker ref="timePicker" class="ml-2 flex-grow-1" :whatToShow="['hours','minutes']" @hoursChanged="(hour:number)=>dateTime.setHours(hour)"
				            @minutesChanged="(minute:number)=>dateTime.setMinutes(minute)"></TimePicker>
			</div>
			<div class="d-flex flex-column flex-sm-row mb-4">
				<VLabel>{{ i18n.t('dateTime.length') }}</VLabel>
				<TimePicker v-model="length" class="ml-2 flex-grow-1"></TimePicker>
			</div>
		</VForm>
	</MyDialog>
</template>
<script setup lang="ts">
import {ref, onMounted, watch} from 'vue';
import {importDefaults} from '@/compositions/Defaults';
import MyDatePicker from '@/components/general/dateTime/MyDatePicker.vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {TimePickerType} from '@/classes/types/RefTypeInterfaces';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {addActivityToHistory} from '@/compositions/SaveToHistoryComposition';
import {PlannerTask} from '@/classes/PlannerTask';

import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
const i18n = useI18n();
const {showErrorSnackbar, showSnackbar} = importDefaults();
const timePicker = ref<TimePickerType>({} as TimePickerType);
const props = defineProps({
	plannerTask: {
		type: Object as () => PlannerTask,
		required: true,
	},
	isRecursive: {
		type: Boolean,
		required: true,
	}
});
const dialogShown = defineModel<boolean>({required: true});
const dateTime = ref(new Date());
const length = ref(new TimeLengthObject());

onMounted(() => {
	timePicker.value.set(dateTime.value.getHours(), dateTime.value.getMinutes());
})
watch(dialogShown, (isShown) => {
	if (isShown) {
		if (!props.isRecursive) {
			dateTime.value = new Date();
			timePicker.value.set(dateTime.value.getHours(), dateTime.value.getMinutes());
		}
		length.value = new TimeLengthObject(Math.floor(props.plannerTask?.minuteLength / 60), props.plannerTask?.minuteLength % 60, 0);
	} else {
		if (props.isRecursive) {
			console.log('hhh')
			setTimeout(() => emit('openNext'), 200);
		}
	}
})

function save() {
	addActivityToHistory(dateTime.value, length.value, props.plannerTask?.activity.id).then(isSuccess => {
		if (isSuccess) {
			showSnackbar(`Saved done planner task ${props.plannerTask?.activity.name} to history`, {color: 'success'});
			dialogShown.value = false;
		} else {
			showErrorSnackbar(`Error saving planner task ${props.plannerTask?.activity.name} to history`);
		}
	});
}

const emit = defineEmits<{
	openNext: []
}>();
</script>
<style scoped>
</style>