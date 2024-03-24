<template>
<VDialog v-model="dialogShown" max-width="600" eager persistent>
	<VCard class="px-6 py-4 text-center">
		<VCardTitle class="pa-0 text-wrap">
			{{ i18n.t('toDoList.saveTask') }}
			<span class="text-purple-accent-4 font-weight-bold">{{ toDoListItem?.activity?.name }}</span>
			{{ i18n.t('history.toHistory').toLowerCase() }}?
		</VCardTitle>
		<VCardText class="px-0 pb-0">
			<VForm @keyup.native.enter="save">
				<div class="d-flex flex-column flex-sm-row mb-4">
					<VLabel>{{ i18n.t('dateTime.date') }}</VLabel>
					<MyDatePicker v-model="dateTime" class="ml-2 flex-grow-1" :clearable="false"></MyDatePicker>
				</div>
				<div class="d-flex flex-column flex-sm-row mb-4">
					<VLabel>{{ i18n.t('dateTime.time') }}</VLabel>
					<TimePicker ref="timePicker" class="ml-2 flex-grow-1" @hoursChanged="handleHoursChanged"
					            @minutesChanged="handleMinutesChanged"></TimePicker>
				</div>
				<div class="d-flex flex-column flex-sm-row mb-4">
					<VLabel>{{ i18n.t('dateTime.length') }}</VLabel>
					<TimeLengthPicker v-model="length" class="ml-2 flex-grow-1"></TimeLengthPicker>
				</div>
			</VForm>
		</VCardText>
		<VCardActions class="justify-end px-0">
			<VBtn color="red" @click="close">{{ i18n.t('general.cancel') }}</VBtn>
			<VBtn color="green" @click="save">{{ i18n.t('general.save') }}</VBtn>
		</VCardActions>
	</VCard>
</VDialog>
</template>
<script setup lang="ts">
import {ref, watch, defineProps, onMounted} from 'vue';
import {importDefaults} from '@/compositions/Defaults';
import MyDatePicker from '@/components/MyDatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import TimeLengthPicker from '@/components/TimeLengthPicker.vue';
import {TimePickerType} from '@/classes/types/RefTypeInterfaces';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {BaseToDoListItemEntity} from '@/classes/ToDoListItem';
import {addActivityToHistory} from '@/compositions/SaveToHistoryComposition';

const {i18n, showErrorSnackbar, showSnackbar} = importDefaults();
const timePicker = ref<TimePickerType>({} as TimePickerType);
const props = defineProps({
	toDoListItem: {
		type: Object as () => BaseToDoListItemEntity,
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

function handleHoursChanged(hour: number) {
	dateTime.value.setHours(hour);
}
function handleMinutesChanged(minute: number) {
	dateTime.value.setMinutes(minute);
}

function save() {
	addActivityToHistory(dateTime.value, length.value, props.toDoListItem?.activity.id).then(isSuccess => {
		if (isSuccess) {
			showSnackbar(`Saved done to-do list task ${props.toDoListItem?.activity.name} to history`, {color: 'success'});
			close();
		} else {
			showErrorSnackbar(`Error saving to-do list task ${props.toDoListItem?.activity.name} to history`);
		}
	});
}
function close() {
	if (props.isRecursive) {
		setTimeout(()=>emit('openNext'),200);
	}
	dialogShown.value = false;
}

const emit = defineEmits<{
	openNext: []
}>();
</script>
<style scoped>
</style>