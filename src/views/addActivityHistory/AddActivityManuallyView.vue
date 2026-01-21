<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<div class="d-flex ga-5">
			<div class="bordered flex-grow-1">
				<VLabel>{{ i18n.t('dateTime.when') }}</VLabel>
				<DateTimePicker v-model="dateTime" :dateClearable="false"></DateTimePicker>
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
import {ref} from 'vue';
import {Time} from '@/utils/Time.ts';
import {useI18n} from 'vue-i18n';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {showErrorSnackbar} = useSnackbar();
const i18n = useI18n();

const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const formDisabled = ref(false);

const dateTime = ref<Date | null>(new Date());
const timeLength = ref(new Time());

function saveActivity() {
	if (activitySelectionForm.value?.validate()) {
		if (dateTime.value) {
			// if (dateTime.value <= new Date()) {
			if (timeLength.value.isNotZero()) {
				activitySelectionForm.value?.saveActivityToHistory(dateTime.value, timeLength.value);
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