<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<VRow class="mt-5" align="center" justify="center">
			<VCol class="bordered bordered-left" cols="12" md="7">
				<VLabel>{{ i18n.t('dateTime.when') }}</VLabel>
				<DateTimePicker ref="dateTimePicker"></DateTimePicker>
			</VCol>
			<VCol class="bordered bordered-right" cols="12" md="5">
				<VLabel>{{ i18n.t('dateTime.length') }}</VLabel>
				<TimeLengthPicker v-model="timeLength"></TimeLengthPicker>
			</VCol>
			<VCol cols="auto">
				<VBtn @click="saveActivity()" color="success">{{ i18n.t('history.addActivityToHistory') }}</VBtn>
			</VCol>
		</VRow>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
//TODO
import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue';
import TimeLengthPicker from '../../components/TimeLengthPicker.vue';
import DateTimePicker from '../../components/DateTimePicker.vue';
import {ActivitySelectionFormType, DateTimePickerType} from '@/classes/types/RefTypeInterfaces';
import {ref} from 'vue';
import {importDefaults} from '@/compositions/Defaults';
import {TimeLengthObject} from '@/classes/TimeUtils';

import {useI18n} from 'vue-i18n';
import {ActivityOptionsSource} from '@/classes/AcitivityOptionsSource';
const i18n = useI18n();
const {showErrorSnackbar} = importDefaults();

const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const dateTimePicker = ref<DateTimePickerType>({} as DateTimePickerType);
const formDisabled = ref(false);
const timeLength = ref(new TimeLengthObject());

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
	border: 1px solid white;
	border-collapse: collapse;
	padding: 10px 20px;
}

.bordered-left {
	border-radius: 5px 0 0 5px;
}

.bordered-right {
	border-radius: 0 5px 5px 0;
}
</style>