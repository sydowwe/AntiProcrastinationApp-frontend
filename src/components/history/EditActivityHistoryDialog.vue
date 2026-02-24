<template>
<MyDialog
	v-model="dialogOpen"
	title="Edit Activity History"
	@confirmed="save"
	:confirmBtnDisabled="!isValid"
>
	<div class="d-flex flex-column ga-4 pa-4">
		<DateTimePicker :label="$t('dateTime.when')" v-model="editStartTimestamp" :dateClearable="false"/>
		<TimePicker icon="hourglass-end" :label="$t('dateTime.length')" v-model="editLength" minWidth="150px" maxWidth="150px" hideDetails/>
		<ActivitySelectionForm v-model:activityId="editActivityId" isInDialog :showFromToDoListField="false"/>
	</div>
</MyDialog>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts';
import {Time} from '@/dtos/dto/Time.ts';
import {useActivityHistoryCrud} from '@/api/ConcretesCrudComposable.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {ActivityHistoryRequest} from '@/dtos/request/activityHistory/ActivityHistoryRequest.ts';

const {update} = useActivityHistoryCrud();
const {showSuccessSnackbar, showErrorSnackbar} = useSnackbar();

const emit = defineEmits<{ saved: [] }>();

const dialogOpen = ref(false);
const editId = ref<number | null>(null);
const editStartTimestamp = ref<Date | null>(new Date());
const editLength = ref(new Time());
const editActivityId = ref<number | null>(null);

const isValid = computed(() => editStartTimestamp.value && editActivityId.value && editLength.value.isNotZero());

function open(record: ActivityHistory) {
	editId.value = record.id;
	editStartTimestamp.value = new Date(record.startTimestamp);
	editLength.value = new Time(record.length.hours, record.length.minutes);
	editActivityId.value = record.activity.id;
	dialogOpen.value = true;
}

async function save() {
	if (!editId.value || !editStartTimestamp.value || !editActivityId.value) return;
	try {
		await update(editId.value, new ActivityHistoryRequest(
			editStartTimestamp.value,
			editLength.value,
			editActivityId.value,
		));
		showSuccessSnackbar('Activity history updated');
		dialogOpen.value = false;
		emit('saved');
	} catch {
		showErrorSnackbar('Failed to update activity history');
	}
}

defineExpose({open});
</script>
