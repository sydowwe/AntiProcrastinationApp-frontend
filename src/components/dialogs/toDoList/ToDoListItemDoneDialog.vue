<template>
<MyDialog v-model="dialogShown" title="" @confirmed="save" :eager="true">
	<template v-slot:header>
		<div class="text-wrap">
			{{ i18n.t('toDoList.saveTask') }}
			<span class="text-purple-accent-4 font-weight-bold">{{ toDoListItem?.activity?.name }}</span>
			{{ i18n.t('history.toHistory').toLowerCase() }}?
		</div>
	</template>
	<VForm @keyup.native.enter="save" class="d-flex flex-column align-start ga-3">
		<DateTimePicker class="mb-auto" :label="$t('dateTime.when')" v-model="dateTime" :dateClearable="false"></DateTimePicker>

		<TimePickerTextField icon="hourglass-end" :label="i18n.t('dateTime.length')" v-model="length" minWidth="150px" maxWidth="150px"
		                     hideDetails></TimePickerTextField>
	</VForm>
</MyDialog>
</template>
<script setup lang="ts">
import {ref, watch} from 'vue';
import {Time} from '@/utils/Time.ts';

import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useActivityHistoryCrud} from '@/api/ConcretesCrudComposable.ts';
import type {IBaseToDoListItem} from '@/dtos/response/interface/IBaseToDoListItem.ts';
import TimePickerTextField from '@/components/general/dateTime/TimePickerTextField.vue';

const {create} = useActivityHistoryCrud()
const i18n = useI18n();
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();
const props = defineProps({
	toDoListItem: {
		type: Object as () => IBaseToDoListItem,
		required: true,
	},
	isRecursive: {
		type: Boolean,
		required: true,
	}
});
const dialogShown = defineModel<boolean>({required: true});
const dateTime = ref(new Date());
const length = ref(new Time());

watch(dialogShown, (isShown) => {
	if (isShown) {
		if (!props.isRecursive) {
			dateTime.value = new Date();
			console.log(dateTime.value)
		}
	} else {
		if (props.isRecursive) {
			setTimeout(() => emit('openNext'), 200);
		}
		length.value = new Time();
	}
})

async function save() {
	const request = await create(dateTime.value, length.value, props.toDoListItem?.activity.id)
	if (request) {
		showSuccessSnackbar(`Saved done to-do list task ${props.toDoListItem?.activity.name} to history`);
		dialogShown.value = false;
	} else {
		showErrorSnackbar(`Error saving to-do list task ${props.toDoListItem?.activity.name} to history`);
	}
}

watch(dateTime, (newVal) => {
	console.log(newVal)
})

const emit = defineEmits<{
	openNext: []
}>();
</script>
<style scoped>
</style>