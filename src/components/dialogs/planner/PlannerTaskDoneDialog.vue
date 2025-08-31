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
				<VDateInput v-model="dateTime" class="ml-2 flex-grow-1" :display-format="formatToDate" :clearable="false"></VDateInput>
			</div>
			<div class="d-flex flex-column flex-sm-row mb-4">
				<VLabel>{{ i18n.t('dateTime.time') }}</VLabel>
				<TimePicker class="ml-2 flex-grow-1" :whatToShow="['hours','minutes']" @hoursChanged="(hour:number)=>dateTime.setHours(hour)"
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
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {TimeObject} from '@/classes/TimeUtils';
import {addActivityToHistory} from '@/composables/SaveToHistoryComposition';
import {PlannerTask} from '@/classes/PlannerTask';

import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useMoment} from '@/scripts/momentHelper.ts';

const {formatToDate} = useMoment()
const i18n = useI18n();
const {showErrorSnackbar, showSnackbar} = useSnackbar();
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
const time = ref(new TimeObject());
const length = ref(new TimeObject());

onMounted(() => {
	time.value.hours = dateTime.value.getHours();
	time.value.minutes = dateTime.value.getMinutes();
})
watch(dialogShown, (isShown) => {
	if (isShown) {
		if (!props.isRecursive) {
			dateTime.value = new Date();
			time.value.hours = dateTime.value.getHours();
			time.value.minutes = dateTime.value.getMinutes();
		}
		length.value = new TimeObject(Math.floor(props.plannerTask?.minuteLength / 60), props.plannerTask?.minuteLength % 60);
	} else {
		if (props.isRecursive) {
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