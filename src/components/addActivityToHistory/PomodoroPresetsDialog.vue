<template>
	<MyDialog v-model="dialog" :title="$t('pomodoroTimer.presets')" :hasConfirmBtn="false" :closeBtnText="$t('general.close')">
		<div class="d-flex flex-column ga-3">
			<VCard
				v-for="preset in presets"
				:key="preset.name"
				variant="outlined"
				class="pa-4 cursor-pointer"
				@click="selectPreset(preset)"
				hover
			>
				<VCardTitle class="text-h6 pb-2">{{ preset.name }}</VCardTitle>
				<VCardText class="pa-0">
					<div class="d-flex flex-column ga-1">
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.focusTime') }}:</span>
							<span class="font-weight-medium">{{ preset.focusTime.getNice }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.shortRestTime') }}:</span>
							<span class="font-weight-medium">{{ preset.shortRestTime.getNice }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.longRestTime') }}:</span>
							<span class="font-weight-medium">{{ preset.longRestTime.getNice }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}:</span>
							<span class="font-weight-medium">{{ preset.numberOfFocusPeriodsInCycle }}</span>
						</div>
					</div>
				</VCardText>
			</VCard>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {ref} from 'vue';
import {Time} from '@/utils/Time.ts';

interface PomodoroPreset {
	name: string;
	focusTime: Time;
	shortRestTime: Time;
	longRestTime: Time;
	numberOfFocusPeriodsInCycle: number;
}

const dialog = ref(false);

const presets = ref<PomodoroPreset[]>([
	{
		name: 'Classic Pomodoro',
		focusTime: new Time(0, 25),
		shortRestTime: new Time(0, 5),
		longRestTime: new Time(0, 15),
		numberOfFocusPeriodsInCycle: 4
	},
	{
		name: 'Short Sessions',
		focusTime: new Time(0, 15),
		shortRestTime: new Time(0, 3),
		longRestTime: new Time(0, 10),
		numberOfFocusPeriodsInCycle: 3
	},
	{
		name: 'Long Deep Work',
		focusTime: new Time(0, 50),
		shortRestTime: new Time(0, 10),
		longRestTime: new Time(0, 30),
		numberOfFocusPeriodsInCycle: 3
	},
	{
		name: 'Quick Bursts',
		focusTime: new Time(0, 10),
		shortRestTime: new Time(0, 2),
		longRestTime: new Time(0, 5),
		numberOfFocusPeriodsInCycle: 5
	},
	{
		name: 'Study Session',
		focusTime: new Time(0, 30),
		shortRestTime: new Time(0, 5),
		longRestTime: new Time(0, 20),
		numberOfFocusPeriodsInCycle: 4
	}
]);

function open() {
	dialog.value = true;
}

function selectPreset(preset: PomodoroPreset) {
	emit('select', preset);
	dialog.value = false;
}

const emit = defineEmits<{
	select: [preset: PomodoroPreset];
}>();

defineExpose({open});
</script>

<style scoped>
.cursor-pointer {
	cursor: pointer;
}
</style>
