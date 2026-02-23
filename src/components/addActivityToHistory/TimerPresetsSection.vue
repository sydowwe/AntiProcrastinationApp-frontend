<template>
<div class="d-flex flex-column ga-4">
	<div class="d-flex ga-3 align-center">
		<h3 class="text-h6">Timer Presets</h3>
		<VBtn variant="tonal" :color="editMode ? 'secondaryOutline' : 'default'" size="small" :prependIcon="editMode ? 'check' : 'pen-to-square'"
		      @click="toggleEditMode">
			{{ editMode ? 'Done' : 'Edit' }}
		</VBtn>
	</div>

	<!-- Quick Times Section -->
	<div class="d-flex flex-column ga-3">
		<div class="d-flex ga-2 align-center">
			<h4 class="text-subtitle-1">Quick Times</h4>
			<VIconBtn v-if="editMode" icon="plus" variant="tonal" color="success" size="28" @click="openCreateDialog()"
			          :disabled="!timeInputVisible">
				<VIcon size="18"></VIcon>
			</VIconBtn>
		</div>
		<div v-if="timeOnlyPresets.length > 0" class="d-flex flex-wrap ga-2">
			<VChip v-for="preset in timeOnlyPresets" :key="preset.id" @click="editMode ? openEditDialog(preset) : applyPreset(preset)"
			       variant="tonal" color="primaryOutline">
				{{ preset.durationFormatted }}
				<template #close>
					<VIcon v-if="editMode" icon="pen-to-square" size="16" class="mr-2"></VIcon>
				</template>
			</VChip>
		</div>
		<div v-else class="text-textMuted text-body-2">No presets yet</div>
	</div>

	<!-- Activity Presets Section -->
	<div class="d-flex flex-column ga-3">
		<div class="d-flex ga-2 align-center">
			<h4 class="text-subtitle-1">Activity Presets</h4>
			<VIconBtn v-if="editMode" icon="plus" variant="tonal" color="success" size="28" @click="openCreateDialog(true)"
			          :disabled="!timeInputVisible">
				<VIcon size="18"></VIcon>
			</VIconBtn>
		</div>
		<div v-if="activityPresets.length > 0" class="d-flex flex-wrap ga-2">
			<VChip v-for="preset in activityPresets" :key="preset.id" @click="editMode ? openEditDialog(preset, true) : applyPreset(preset)"
			       variant="tonal" color="secondaryOutline">
				{{ preset.durationFormatted }} · {{ preset.activity?.name }}
				<template #close>
					<VIcon v-if="editMode" icon="pen-to-square" size="16" class="mr-2"></VIcon>
				</template>
			</VChip>
		</div>
		<div v-else class="text-textMuted text-body-2">No presets yet</div>
	</div>
</div>

<TimerPresetDialog ref="presetDialog" @created="onPresetChanged" @updated="onPresetChanged" @deleted="onPresetChanged"></TimerPresetDialog>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {TimerPreset} from '@/dtos/response/activityRecording/TimerPreset.ts';
import {useTimerPresetCrud} from '@/api/ConcretesCrudComposable.ts';
import TimerPresetDialog from '@/components/dialogs/TimerPresetDialog.vue';

defineProps({
	timeInputVisible: {
		type: Boolean,
		required: true
	}
});

const {fetchAll} = useTimerPresetCrud();

const allPresets = ref<TimerPreset[]>([]);
const editMode = ref(false);
const presetDialog = ref<InstanceType<typeof TimerPresetDialog>>();

const timeOnlyPresets = computed(() => {
	return allPresets.value.filter(preset => !preset.isActivityPreset);
});

const activityPresets = computed(() => {
	return allPresets.value.filter(preset => preset.isActivityPreset);
});

onMounted(async function loadPresets() {
	await loadPresetsData();
});

async function loadPresetsData() {
	allPresets.value = await fetchAll();
	console.log(allPresets.value)
}

function applyPreset(preset: TimerPreset) {
	emit('applyPreset', preset);
}

function toggleEditMode() {
	editMode.value = !editMode.value;
}

function openCreateDialog(isActivityMode: boolean = false) {
	presetDialog.value?.openAddDialog(isActivityMode);
}

function openEditDialog(preset: TimerPreset, isActivityMode: boolean = false) {
	presetDialog.value?.openEditDialog(preset, isActivityMode);
}

async function onPresetChanged() {
	await loadPresetsData();
}

const emit = defineEmits<{
	(e: 'applyPreset', preset: TimerPreset): void;
}>();
</script>
