<template>
<MyDialog v-model="dialog" :title="isEdit ? 'Edit Pomodoro Preset' : 'Add Pomodoro Preset'"
          :confirmBtnLabel="isEdit ? $t('general.update') : $t('general.create')"
          @confirmed="onConfirmed" :isSmall="false">
	<VForm ref="form" @submit.prevent="onConfirmed" class="d-flex flex-column ga-3">
		<VTextField label="Name" v-model="request.name" :rules="[requiredRule]"></VTextField>

		<VTabs v-model="activeTab" color="primary" align-tabs="center">
			<VTab value="basic">Basic</VTab>
			<VTab value="focus">With Focus Activity</VTab>
			<VTab value="both">With Both Activities</VTab>
		</VTabs>

		<VWindow v-model="activeTab">
			<!-- Basic Tab -->
			<VWindowItem value="basic">
				<div class="d-flex flex-column ga-3 mt-3">
					<TimePicker label="Focus Duration" v-model="focusDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<TimePicker label="Short Break Duration" v-model="shortBreakDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<TimePicker label="Long Break Duration" v-model="longBreakDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<VSelect label="Focus Periods per Cycle" v-model="request.focusPeriodInCycleCount" :items="[2,3,4,5,6]" :rules="[requiredRule]"></VSelect>
					<VSelect label="Number of Cycles" v-model="request.numberOfCycles" :items="[1,2,3,4,5,6]" :rules="[requiredRule]"></VSelect>
				</div>
			</VWindowItem>

			<!-- Focus Activity Tab -->
			<VWindowItem value="focus">
				<div class="d-flex flex-column ga-3 mt-3">
					<TimePicker label="Focus Duration" v-model="focusDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<TimePicker label="Short Break Duration" v-model="shortBreakDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<TimePicker label="Long Break Duration" v-model="longBreakDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<VSelect label="Focus Periods per Cycle" v-model="request.focusPeriodInCycleCount" :items="[2,3,4,5,6]" :rules="[requiredRule]"></VSelect>
					<VSelect label="Number of Cycles" v-model="request.numberOfCycles" :items="[1,2,3,4,5,6]" :rules="[requiredRule]"></VSelect>
					<VIdAutocomplete label="Focus Activity" v-model="request.focusActivityId" :items="activityOptions" :rules="[requiredRule]"></VIdAutocomplete>
				</div>
			</VWindowItem>

			<!-- Both Activities Tab -->
			<VWindowItem value="both">
				<div class="d-flex flex-column ga-3 mt-3">
					<TimePicker label="Focus Duration" v-model="focusDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<TimePicker label="Short Break Duration" v-model="shortBreakDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<TimePicker label="Long Break Duration" v-model="longBreakDuration" viewMode="minute" variant="outlined" color="primary"></TimePicker>
					<VSelect label="Focus Periods per Cycle" v-model="request.focusPeriodInCycleCount" :items="[2,3,4,5,6]" :rules="[requiredRule]"></VSelect>
					<VSelect label="Number of Cycles" v-model="request.numberOfCycles" :items="[1,2,3,4,5,6]" :rules="[requiredRule]"></VSelect>
					<VIdAutocomplete label="Focus Activity" v-model="request.focusActivityId" :items="activityOptions" :rules="[requiredRule]"></VIdAutocomplete>
					<VIdAutocomplete label="Rest Activity" v-model="request.restActivityId" :items="activityOptions" :rules="[requiredRule]"></VIdAutocomplete>
				</div>
			</VWindowItem>
		</VWindow>
	</VForm>

	<template #centerButton v-if="isEdit">
		<VBtn color="error" variant="outlined" @click="onDelete">
			{{ $t('general.delete') }}
		</VBtn>
	</template>
</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {computed, onMounted, ref} from 'vue';
import {PomodoroTimerPreset} from '@/dtos/response/PomodoroTimerPreset.ts';
import {PomodoroTimerPresetRequest} from '@/dtos/request/PomodoroTimerPresetRequest.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {usePomodoroTimerPresetCrud, useActivityCrud} from '@/composables/ConcretesCrudComposable.ts';
import {VForm} from 'vuetify/components';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {Time} from '@/utils/Time.ts';
import {SelectOption} from '@/dtos/response/SelectOption.ts';

const {create, update, deleteEntity} = usePomodoroTimerPresetCrud();
const {fetchSelectOptions} = useActivityCrud();
const {requiredRule} = useGeneralRules();

const form = ref<InstanceType<typeof VForm>>();
const dialog = ref(false);
const request = ref(new PomodoroTimerPresetRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);
const activityOptions = ref<SelectOption[]>([]);
const activeTab = ref<'basic' | 'focus' | 'both'>('basic');

const focusDuration = computed({
	get: () => Time.fromMinutes(request.value.focusDuration),
	set: (value: Time) => {
		request.value.focusDuration = value.getInMinutes;
	}
});

const shortBreakDuration = computed({
	get: () => Time.fromMinutes(request.value.shortBreakDuration),
	set: (value: Time) => {
		request.value.shortBreakDuration = value.getInMinutes;
	}
});

const longBreakDuration = computed({
	get: () => Time.fromMinutes(request.value.longBreakDuration),
	set: (value: Time) => {
		request.value.longBreakDuration = value.getInMinutes;
	}
});

onMounted(async function loadActivityOptions() {
	activityOptions.value = await fetchSelectOptions();
});

function openAddDialog() {
	request.value = new PomodoroTimerPresetRequest();
	request.value.name = 'Pomodoro Preset';
	activeTab.value = 'basic';
	isEdit.value = false;
	dialog.value = true;
}

function openEditDialog(preset: PomodoroTimerPreset) {
	idToEdit.value = preset.id;
	request.value = PomodoroTimerPresetRequest.fromEntity(preset);

	// Determine which tab to show based on preset type
	if (preset.hasFocusActivity && preset.hasRestActivity) {
		activeTab.value = 'both';
	} else if (preset.hasFocusActivity) {
		activeTab.value = 'focus';
	} else {
		activeTab.value = 'basic';
	}

	isEdit.value = true;
	dialog.value = true;
}

async function onConfirmed() {
	const {valid} = await form.value!.validate();
	if (!valid) return;

	// Clear activity IDs based on selected tab
	if (activeTab.value === 'basic') {
		request.value.focusActivityId = null;
		request.value.restActivityId = null;
	} else if (activeTab.value === 'focus') {
		request.value.restActivityId = null;
	}

	if (isEdit.value) {
		await update(idToEdit.value!, request.value);
		emit('updated');
	} else {
		await create(request.value);
		emit('created');
	}

	dialog.value = false;
	form.value!.reset();
	request.value = new PomodoroTimerPresetRequest();
	idToEdit.value = null;
	isEdit.value = false;
	activeTab.value = 'basic';
}

async function onDelete() {
	if (!idToEdit.value) return;

	const confirmed = confirm('Are you sure you want to delete this preset?');
	if (!confirmed) return;

	await deleteEntity(idToEdit.value);
	emit('deleted');

	dialog.value = false;
	form.value!.reset();
	request.value = new PomodoroTimerPresetRequest();
	idToEdit.value = null;
	isEdit.value = false;
	activeTab.value = 'basic';
}

const emit = defineEmits<{
	(e: 'created'): void;
	(e: 'updated'): void;
	(e: 'deleted'): void;
}>();

defineExpose({openAddDialog, openEditDialog});
</script>
