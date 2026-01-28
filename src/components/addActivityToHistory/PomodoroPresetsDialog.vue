<template>
<MyDialog v-model="dialog" :title="$t('pomodoroTimer.presets')" :hasConfirmBtn="false" :closeBtnText="$t('general.close')" :isSmall="false">
	<div class="d-flex justify-end mb-3">
		<VBtn :variant="editMode ? 'tonal' : 'text'" :color="editMode ? 'primary' : 'default'" size="small" @click="toggleEditMode">
			{{ editMode ? 'Done' : 'Edit' }}
		</VBtn>
	</div>

	<div v-if="presets.length > 0" class="d-flex flex-column ga-3">
		<VCard
			v-for="preset in presets"
			:key="preset.id"
			variant="outlined"
			class="pa-4"
			:class="{'cursor-pointer': !editMode}"
			@click="!editMode && selectPreset(preset)"
			hover
		>
			<VCardTitle class="text-h6 pb-2 d-flex justify-space-between align-center">
				<span>{{ preset.name }}</span>
				<div v-if="editMode" class="d-flex ga-2">
					<VIconBtn icon="fa:pen-to-square" size="small" variant="text" @click.stop="openEditDialog(preset)"></VIconBtn>
					<VIconBtn icon="fa:trash" size="small" variant="text" color="error" @click.stop="deletePreset(preset)"></VIconBtn>
				</div>
			</VCardTitle>
			<VCardText class="pa-0">
				<div class="d-flex flex-column ga-1">
					<div class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.focusTime') }}:</span>
						<span class="font-weight-medium">{{ preset.focusDurationFormatted }}</span>
					</div>
					<div class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.shortRestTime') }}:</span>
						<span class="font-weight-medium">{{ preset.shortBreakDurationFormatted }}</span>
					</div>
					<div class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.longRestTime') }}:</span>
						<span class="font-weight-medium">{{ preset.longBreakDurationFormatted }}</span>
					</div>
					<div class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}:</span>
						<span class="font-weight-medium">{{ preset.focusPeriodInCycleCount }}</span>
					</div>
					<div class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.numberOfCycles') }}:</span>
						<span class="font-weight-medium">{{ preset.numberOfCycles }}</span>
					</div>
					<div v-if="preset.focusActivity" class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.focusActivity') }}:</span>
						<span class="font-weight-medium">{{ preset.focusActivity.name }}</span>
					</div>
					<div v-if="preset.restActivity" class="d-flex justify-space-between">
						<span class="text-medium-emphasis">{{ $t('pomodoroTimer.restActivity') }}:</span>
						<span class="font-weight-medium">{{ preset.restActivity.name }}</span>
					</div>
				</div>
			</VCardText>
		</VCard>
	</div>
	<div v-else class="text-center text-textMuted">
		No presets yet
	</div>

	<template #rightButton>
		<VBtn color="primary" @click="openCreateDialog">
			{{ $t('general.create') }}
		</VBtn>
	</template>
</MyDialog>

<PomodoroPresetFormDialog ref="formDialog" @created="onPresetChanged" @updated="onPresetChanged" @deleted="onPresetChanged"></PomodoroPresetFormDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import PomodoroPresetFormDialog from '@/components/addActivityToHistory/PomodoroPresetFormDialog.vue';
import {onMounted, ref} from 'vue';
import {Time} from '@/utils/Time.ts';
import {PomodoroTimerPreset} from '@/dtos/response/PomodoroTimerPreset.ts';
import {usePomodoroTimerPresetCrud} from '@/composables/ConcretesCrudComposable.ts';

const {fetchAll, deleteEntity} = usePomodoroTimerPresetCrud();

const dialog = ref(false);
const editMode = ref(false);
const presets = ref<PomodoroTimerPreset[]>([]);
const formDialog = ref<InstanceType<typeof PomodoroPresetFormDialog>>();

onMounted(async function loadPresets() {
	await loadPresetsData();
});

async function loadPresetsData() {
	presets.value = await fetchAll();
}

function open() {
	dialog.value = true;
}

function toggleEditMode() {
	editMode.value = !editMode.value;
}

function openCreateDialog() {
	formDialog.value?.openAddDialog();
}

function openEditDialog(preset: PomodoroTimerPreset) {
	formDialog.value?.openEditDialog(preset);
}

async function deletePreset(preset: PomodoroTimerPreset) {
	const confirmed = confirm(`Are you sure you want to delete preset "${preset.name}"?`);
	if (!confirmed) return;

	await deleteEntity(preset.id);
	await loadPresetsData();
}

async function onPresetChanged() {
	await loadPresetsData();
}

function selectPreset(preset: PomodoroTimerPreset) {
	emit('select', {
		focusTime: Time.fromMinutes(preset.focusDuration),
		shortRestTime: Time.fromMinutes(preset.shortBreakDuration),
		longRestTime: Time.fromMinutes(preset.longBreakDuration),
		numberOfFocusPeriodsInCycle: preset.focusPeriodInCycleCount,
		numberOfCycles: preset.numberOfCycles,
		focusActivityId: preset.focusActivity?.id ?? null,
		restActivityId: preset.restActivity?.id ?? null
	});
	dialog.value = false;
}

const emit = defineEmits<{
	select: [preset: {
		focusTime: Time;
		shortRestTime: Time;
		longRestTime: Time;
		numberOfFocusPeriodsInCycle: number;
		numberOfCycles: number;
		focusActivityId: number | null;
		restActivityId: number | null;
	}];
}>();

defineExpose({open});
</script>

<style scoped>
.cursor-pointer {
	cursor: pointer;
}
</style>
