<template>
<div class="mx-auto d-flex ga-6">
	<VForm @keyup.native.enter="save" class="d-flex flex-column align-start ga-3">

		<DateTimePicker class="mb-auto" :label="$t('dateTime.when')" v-model="dateTime" :dateClearable="false"></DateTimePicker>

		<TimePickerTextField icon="hourglass-end" :label="i18n.t('dateTime.length')" v-model="timeLength" minWidth="150px" maxWidth="150px"
		                     hideDetails></TimePickerTextField>
	</VForm>

</div>
</template>

<script setup lang="ts">
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import TimePickerTextField from '@/components/general/dateTime/TimePickerTextField.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useI18n} from 'vue-i18n';
import {ref} from 'vue';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {Time} from '@/utils/Time.ts';
import {useActivityHistoryCrud} from '@/api/ConcretesCrudComposable.ts';

const {create} = useActivityHistoryCrud()

const {activityId, activityName} = defineProps<{
	activityId: number;
	activityName: string;
}>();

const emit = defineEmits<{
	saved: [];
}>();

const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();
const i18n = useI18n();

const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const dateTime = ref<Date | null>(new Date());
const timeLength = ref(new Time());

async function saveActivityToHistory(startTimestamp: Date, activityLength: Time) {
	const newId = await create(startTimestamp, activityLength, activityId);

	if (newId) {
		showSuccessSnackbar(`Added record of activity ${activityName} to history`);
		return newId;
	} else {
		showErrorSnackbar(`Error saving record of activity ${activityName} to history`);
		return null;
	}
}
</script>

<style scoped>

</style>