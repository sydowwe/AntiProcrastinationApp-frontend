<template>
<MyDialog v-model="dialog" :title="isEdit ? 'Edit time period' : 'Add time period'" :confirmBtnLabel="isEdit ? $t('general.save') : $t('general.create')"
          @confirmed="onConfirmed">
	<VForm ref="form" @submit.prevent="onConfirmed" class="d-flex flex-column ga-3 py-2">
		<VTextField label="Name" v-model="request.text" :rules="[requiredRule]"></VTextField>
		<VNumberInput label="Length in days" v-model="request.lengthInDays" :min="1" @update:modelValue="onLengthChanged"></VNumberInput>
		<ColorPicker label="Color" v-model="request.color"></ColorPicker>
		<VDivider></VDivider>
		<span class="text-caption text-medium-emphasis">Streak settings</span>
		<VNumberInput label="Streak threshold (%)" v-model="request.streakThreshold" :min="1" :max="100"
		              hint="Minimum % of items completed to count the period toward your streak" persistentHint></VNumberInput>
		<VNumberInput label="Grace days" v-model="request.streakGraceDays" :min="0"
		              hint="Days after the period ends before the streak resets" persistentHint></VNumberInput>
		<VSelect
			v-if="isWeekAligned"
			label="Reset anchor day"
			v-model="request.resetAnchorDay"
			:items="weekDayOptions"
			itemTitle="label"
			itemValue="value"
			hint="Week day to anchor resets to"
			persistentHint
		></VSelect>
		<VNumberInput
			v-else
			label="Reset anchor day of month"
			v-model="request.resetAnchorDay"
			:min="0"
			:max="30"
			hint="Day of month to align the start to (0 = rolling, no anchor)"
			persistentHint
		></VNumberInput>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import ColorPicker from '@/components/general/ColorPicker.vue';
import {computed, ref} from 'vue';
import {TimePeriodEntity} from '@/dtos/response/activityRecording/TimePeriodEntity.ts';
import {TimePeriodRequest} from '@/dtos/request/activityRecording/TimePeriodRequest.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useRoutineTimePeriodCrud} from '@/api/routineTodoList/timePeriodApi.ts';
import {VForm} from 'vuetify/components';

const weekDayOptions = [
	{label: 'Rolling (no anchor)', value: 0},
	{label: 'Monday', value: 1},
	{label: 'Tuesday', value: 2},
	{label: 'Wednesday', value: 3},
	{label: 'Thursday', value: 4},
	{label: 'Friday', value: 5},
	{label: 'Saturday', value: 6},
	{label: 'Sunday', value: 7},
];

const {createWithResponse, update} = useRoutineTimePeriodCrud();
const {requiredRule} = useGeneralRules();

const form = ref<InstanceType<typeof VForm>>();
const dialog = ref(false);
const request = ref(new TimePeriodRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);

const isWeekAligned = computed(() => {
	const d = request.value.lengthInDays;
	return d <= 7 || d % 7 === 0;
});

function onLengthChanged() {
	request.value.resetAnchorDay = 0;
}

const emit = defineEmits<{
	(e: 'created', newItem: TimePeriodEntity): void;
	(e: 'updated', updatedId: number, updatedItem: TimePeriodRequest): void;
}>();

function openAddDialog() {
	request.value = new TimePeriodRequest();
	isEdit.value = false;
	dialog.value = true;
}

function openEditDialog(entity: TimePeriodEntity) {
	idToEdit.value = entity.id;
	request.value = TimePeriodRequest.fromEntity(entity);
	isEdit.value = true;
	dialog.value = true;
}

async function onConfirmed() {
	const {valid} = await form.value!.validate();
	if (!valid) return;
	if (isEdit.value) {
		await update(idToEdit.value!, request.value);
		emit('updated', idToEdit.value!, request.value);
	} else {
		const created = await createWithResponse(request.value);
		emit('created', created);
	}
	dialog.value = false;
	form.value!.reset();
	request.value = new TimePeriodRequest();
	idToEdit.value = null;
	isEdit.value = false;
}

defineExpose({openAddDialog, openEditDialog});
</script>