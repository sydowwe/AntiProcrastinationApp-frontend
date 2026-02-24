<template>
<div class="d-flex flex-column ga-3">
	<ActivitySelectionForm ref="activitySelectionForm" :formDisabled></ActivitySelectionForm>
	<div class="mx-auto d-flex ga-6">
		<DateTimePicker class="mb-auto" :label="$t('dateTime.when')" v-model="dateTime" :dateClearable="false"></DateTimePicker>

		<TimePicker icon="hourglass-end" :label="i18n.t('dateTime.length')" v-model="timeLength" minWidth="150px" maxWidth="150px"
		            hideDetails></TimePicker>
	</div>
</div>
</template>

<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import {ref} from 'vue';
import {Time} from '@/dtos/dto/Time.ts';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';

const props = defineProps<{
	formDisabled?: boolean;
}>();

const emit = defineEmits<{
	saved: [];
}>();

const {showErrorSnackbar} = useSnackbar();
const i18n = useI18n();

const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const dateTime = ref<Date | null>(new Date());
const timeLength = ref(new Time());

function saveActivity() {
	if (activitySelectionForm.value?.validate()) {
		if (dateTime.value) {
			if (timeLength.value.isNotZero()) {
				activitySelectionForm.value?.saveActivityToHistory(dateTime.value, timeLength.value);
				emit('saved');
			} else {
				showErrorSnackbar(i18n.t('history.lengthNotSet'));
			}
		} else {
			showErrorSnackbar(i18n.t('date.selectDatePlease'));
		}
	}
}

defineExpose({
	saveActivity
});
</script>

