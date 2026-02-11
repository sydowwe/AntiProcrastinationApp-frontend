<template>
<MyDialog v-model="dialog" :title="isEdit ? 'Edit Pomodoro Preset' : 'Add Pomodoro Preset'"
          :confirmBtnLabel="isEdit ? $t('general.update') : $t('general.create')"
          @confirmed="onConfirmed">
	<VForm ref="form" @submit.prevent="onConfirmed" class="d-flex flex-column ga-6">
		<VBtnToggle
			v-model="activeTab"
			color="primaryOutline"
			variant="tonal"
			density="comfortable"
			divided
			mandatory
		>
			<VBtn value="basic" class="flex-1-1 text-none">
				<VIcon icon="fa-solid fa-clock" size="small" class="mr-2"></VIcon>
				Basic
			</VBtn>
			<VBtn value="focus" class="flex-1-1 text-none">
				<VIcon icon="fa-solid fa-brain" size="small" class="mr-2"></VIcon>
				With Focus Activity
			</VBtn>
			<VBtn value="both" class="flex-1-1 text-none">
				<VIcon icon="fa-solid fa-list-check" size="small" class="mr-2"></VIcon>
				With Both Activities
			</VBtn>
		</VBtnToggle>

		<VTextField
			label="Preset Name"
			v-model="request.name"
			:rules="[requiredRule]"
			hideDetails
		></VTextField>

		<VDivider></VDivider>

		<div style="margin-top: -8px">
			<div class="text-subtitle-2 text-medium-emphasis mb-3">
				<VIcon icon="fa-solid fa-stopwatch" size="small" class="mr-2"></VIcon>
				Timer Durations
			</div>
			<div class="d-flex flex-column flex-sm-row ga-3">
				<TimePicker label="Focus" v-model="focusDuration" viewMode="minute" variant="outlined" color="primary" density="comfortable"
				            class="flex-sm-1-1"></TimePicker>
				<TimePicker label="Short Break" v-model="shortBreakDuration" viewMode="minute" variant="outlined" color="success"
				            density="comfortable" class="flex-sm-1-1"></TimePicker>
				<TimePicker label="Long Break" v-model="longBreakDuration" viewMode="minute" variant="outlined" color="info"
				            density="comfortable" class="flex-sm-1-1"></TimePicker>
			</div>
		</div>

		<VDivider></VDivider>

		<div style="margin-top: -8px">
			<div class="text-subtitle-2 text-medium-emphasis mb-4">
				<VIcon icon="fa-solid fa-rotate" size="small" class="mr-2"></VIcon>
				Cycle Settings
			</div>
			<div class="d-flex flex-column flex-sm-row ga-4">
				<VSelect
					label="Focus Periods per Cycle"
					class="flex-sm-1-1"
					v-model="request.focusPeriodInCycleCount"
					:items="[2,3,4,5,6]"
					:rules="[requiredRule]"
					hideDetails
					density="comfortable"
				></VSelect>
				<VSelect
					label="Number of Cycles"
					class="flex-sm-1-1"
					v-model="request.numberOfCycles"
					:items="[1,2,3,4,5,6]"
					:rules="[requiredRule]"
					hideDetails
					density="comfortable"
				></VSelect>
			</div>
		</div>

		<VDivider v-if="activeTab !== 'basic'"></VDivider>

		<VIdAutocomplete
			v-if="activeTab === 'focus' || activeTab === 'both'"
			label="Focus Activity"
			v-model="request.focusActivityId"
			:items="activityOptions"
			:rules="[requiredRule]"
			hideDetails
		></VIdAutocomplete>

		<VIdAutocomplete
			v-if="activeTab === 'both'"
			label="Rest Activity"
			v-model="request.restActivityId"
			:items="activityOptions"
			:rules="[requiredRule]"
			hideDetails
		></VIdAutocomplete>
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
import {useActivityCrud, usePomodoroTimerPresetCrud} from '@/composables/ConcretesCrudComposable.ts';
import {VForm} from 'vuetify/components';
import TimePicker from '@/components/general/dateTime/TimePickerTextField.vue';
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
