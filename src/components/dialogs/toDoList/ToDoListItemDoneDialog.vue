<template>
<MyDialog v-model="dialogShown" title="" @confirmed="save" :eager="true">
	<template v-slot:header>
		<div class="text-wrap">
			{{ i18n.t('toDoList.saveTask') }}
			<span class="text-purple-accent-4 font-weight-bold">{{ toDoListItem?.activity?.name }}</span>
			{{ i18n.t('history.toHistory').toLowerCase() }}?
		</div>
	</template>
	<VForm @keyup.native.enter="save">
		<div class="d-flex flex-column flex-sm-row mb-4">-->
			<VLabel>{{ i18n.t('dateTime.date') }}</VLabel>
			<DateTimePicker v-model="dateTime" class="ml-2 flex-grow-1" :date-clearable="false"></DateTimePicker>
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
import type {BaseToDoListItemEntity} from '@/classes/ToDoListItem';
import {addActivityToHistory} from '@/composables/SaveToHistoryComposition';

import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const i18n = useI18n();
const {showErrorSnackbar, showSnackbar} = useSnackbar();
// const timePicker = ref<TimePickerType>({} as TimePickerType);
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
const length = ref(new TimeObject());

onMounted(() => {
	// timePicker.value.set(dateTime.value.getHours(), dateTime.value.getMinutes());
})
watch(dialogShown, (isShown) => {
	if (isShown) {
		if (!props.isRecursive) {
			dateTime.value = new Date();
			// timePicker.value.set(dateTime.value.getHours(), dateTime.value.getMinutes());
		}
	} else {
		if (props.isRecursive) {
			setTimeout(() => emit('openNext'), 200);
		}
		length.value = new TimeObject();
	}
})

function save() {
	addActivityToHistory(dateTime.value, length.value, props.toDoListItem?.activity.id).then(isSuccess => {
		if (isSuccess) {
			showSnackbar(`Saved done to-do list task ${props.toDoListItem?.activity.name} to history`, {color: 'success'});
			dialogShown.value = false;
		} else {
			showErrorSnackbar(`Error saving to-do list task ${props.toDoListItem?.activity.name} to history`);
		}
	});
}

const emit = defineEmits<{
	openNext: []
}>();
</script>
<style scoped>
</style>