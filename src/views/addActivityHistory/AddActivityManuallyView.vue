<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<div class="d-flex ga-5">
			<div class="bordered flex-grow-1">
				<VLabel>{{ i18n.t('dateTime.when') }}</VLabel>
				<DateTimePicker ref="dateTimePicker" :date-clearable="false"></DateTimePicker>
			</div>
			<div class="bordered">
				<VLabel>{{ i18n.t('dateTime.length') }}</VLabel>
				<TimePicker v-model="timeLength"></TimePicker>
			</div>
		</div>
		<div class="mt-10 w-100 text-center">
			<VBtn @click="saveActivity()" color="primary">{{ i18n.t('history.addActivityToHistory') }}</VBtn>
		</div>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import type {ActivitySelectionFormType, DateTimePickerType} from '@/types/RefTypeInterfaces';
import {onMounted, ref} from 'vue';
import {Time} from '@/utils/TimeUtils';
import {useI18n} from 'vue-i18n';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {showErrorSnackbar} = useSnackbar();
const i18n = useI18n();

const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const formDisabled = ref(false);

const dateTimePicker = ref<DateTimePickerType>({} as DateTimePickerType);
const timeLength = ref(new Time());

onMounted(()=>{
	const now = new Date();
	dateTimePicker.value.setTime(now.getHours(), now.getMinutes())
})

function saveActivity() {
	if (activitySelectionForm.value.validate()) {
		if (dateTimePicker.value?.getDateTime) {
			// if (dateTimePicker.value?.getDateTime <= new Date()) {
			if (timeLength.value.isNotZero()) {
				activitySelectionForm.value.saveActivityToHistory(dateTimePicker.value?.getDateTime, timeLength.value);
			} else {
				showErrorSnackbar(i18n.t('history.lengthNotSet'));
			}
			// } else {
			// 	alert('Really wanna add activity in future');
			// }
		} else {
			showErrorSnackbar(i18n.t('date.selectDatePlease'));
		}
	}
}
</script>
<style scoped>
.bordered {
	border: 1px solid rgba(255, 255, 255, 0.6);
	border-radius: 5px;
	padding: 10px 20px;
}
</style>