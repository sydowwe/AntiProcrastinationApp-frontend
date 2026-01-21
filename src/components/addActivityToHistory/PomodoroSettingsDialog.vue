<template>
	<MyDialog v-model="dialog" :title="$t('pomodoroTimer.settings')" :confirmBtnLabel="$t('general.save')" @confirmed="onConfirmed">
		<VForm ref="form" @submit.prevent="onConfirmed" class="d-flex flex-column ga-4">
			<div class="d-flex flex-column ga-2">
				<VLabel>{{ $t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}</VLabel>
				<VNumberInput
					v-model="localSettings.numberOfFocusPeriodsInCycle"
					:min="2"
					:max="6"
					controlVariant="split"
					hideDetails
				></VNumberInput>
			</div>

			<div class="d-flex flex-column ga-2">
				<VLabel>{{ $t('pomodoroTimer.numberOfCycles') }}</VLabel>
				<VNumberInput
					v-model="localSettings.numberOfCycles"
					:min="1"
					:max="6"
					controlVariant="split"
					hideDetails
				></VNumberInput>
			</div>

			<VCheckbox
				v-model="localSettings.autoStartBreaks"
				:label="$t('pomodoroTimer.autoStartBreaks')"
				hideDetails
			></VCheckbox>

			<VCheckbox
				v-model="localSettings.autoStartFocus"
				:label="$t('pomodoroTimer.autoStartFocus')"
				hideDetails
			></VCheckbox>

			<VCheckbox
				v-model="localSettings.soundEnabled"
				:label="$t('pomodoroTimer.soundEnabled')"
				hideDetails
			></VCheckbox>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {ref} from 'vue';
import {VForm} from 'vuetify/components';

interface PomodoroSettings {
	numberOfFocusPeriodsInCycle: number;
	numberOfCycles: number;
	autoStartBreaks: boolean;
	autoStartFocus: boolean;
	soundEnabled: boolean;
}

const form = ref<InstanceType<typeof VForm>>();
const dialog = ref(false);
const localSettings = ref<PomodoroSettings>({
	numberOfFocusPeriodsInCycle: 4,
	numberOfCycles: 2,
	autoStartBreaks: false,
	autoStartFocus: false,
	soundEnabled: true
});

function open(currentSettings: PomodoroSettings) {
	localSettings.value = {...currentSettings};
	dialog.value = true;
}

async function onConfirmed() {
	const {valid} = await form.value!.validate();
	if (!valid) return;

	emit('save', localSettings.value);
	dialog.value = false;
}

const emit = defineEmits<{
	save: [settings: PomodoroSettings];
}>();

defineExpose({open});
</script>

<style scoped>
</style>
