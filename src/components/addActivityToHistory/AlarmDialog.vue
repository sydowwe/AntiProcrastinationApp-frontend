<template>
<MyDialog v-model="dialog" :title="isEdit ? $t('general.edit') : $t('general.add')"
          :confirmBtnLabel="isEdit ? $t('general.save') : $t('general.create')"
          @confirmed="onConfirmed">
	<VForm ref="form" @submit.prevent="onConfirmed" class="d-flex flex-column ga-3">
		<VDateInput
			:label="$t('dateTime.date')"
			v-model="dateModel"
			:rules="[requiredRule]"
		></VDateInput>

		<TimePicker
			:label="$t('dateTime.time')"
			v-model="timeModel"
			viewMode="minute"
			allowedMinutesSelected="5"
		></TimePicker>

		<ActivitySelectionForm
			v-model:activityId="request.activityId"
			:isInDialog="true"
			:showFromToDoListField="false"
		></ActivitySelectionForm>

		<VCheckbox
			:label="$t('alarm.isActive')"
			v-model="request.isActive"
			hideDetails
		></VCheckbox>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {computed, ref} from 'vue';
import {Alarm} from '@/dtos/response/Alarm.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {AlarmRequest} from '@/dtos/request/AlarmRequest.ts';
import {VForm} from 'vuetify/components';
import TimePicker from '@/components/general/dateTime/TimePickerTextField.vue';
import {Time} from '@/utils/Time.ts';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';

const {requiredRule} = useGeneralRules()

const form = ref<InstanceType<typeof VForm>>();
const dialog = ref(false);
const request = ref(new AlarmRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);

// Computed properties for date and time
const dateModel = computed({
	get() {
		return request.value.startTimestamp;
	},
	set(newDate: Date) {
		// Preserve the time when date changes
		const currentTime = Time.fromDate(request.value.startTimestamp);
		const updatedDate = new Date(newDate);
		updatedDate.setHours(currentTime.hours, currentTime.minutes, 0, 0);
		request.value.startTimestamp = updatedDate;
	}
});

const timeModel = computed({
	get() {
		return Time.fromDate(request.value.startTimestamp);
	},
	set(newTime: Time) {
		const updatedDate = new Date(request.value.startTimestamp);
		updatedDate.setHours(newTime.hours, newTime.minutes, 0, 0);
		request.value.startTimestamp = updatedDate;
	}
});

function openCreate() {
	request.value = new AlarmRequest();
	isEdit.value = false;
	dialog.value = true;
}

function openEdit(alarm: Alarm) {
	request.value = AlarmRequest.fromEntity(alarm);
	idToEdit.value = alarm.id;
	isEdit.value = true;
	dialog.value = true;
}

async function onConfirmed() {
	const {valid} = await form.value!.validate();
	if (!valid) return;

	if (isEdit.value) {
		emit('edit', idToEdit.value!, request.value);
	} else {
		emit('add', request.value);
	}

	dialog.value = false;
	form.value!.reset();
	request.value = new AlarmRequest();
	idToEdit.value = null;
	isEdit.value = false;
}

const emit = defineEmits<{
	(e: 'add', newAlarm: AlarmRequest): void;
	(e: 'edit', id: number, updatedAlarm: AlarmRequest): void;
}>()

defineExpose({openCreate, openEdit})
</script>

<style scoped>

</style>
