<template>
	<div>
		<div class="d-flex justify-center ga-2 mb-3">
			<VBtn
				variant="tonal"
				prependIcon="sliders"
				color="secondaryOutline"
				@click="emit('openPresets')"
			>
				{{ i18n.t('controls.presets') }}
			</VBtn>
			<VBtn
				variant="tonal"
				prependIcon="clock-rotate-left"
				@click="emit('resetToDefault')"
			>
				{{ i18n.t('history.pomodoro.defaults') }}
			</VBtn>
		</div>
		<div class="d-flex flex-wrap justify-center ga-3">
			<PomodoroDurationCard
				v-model="focusTime"
				color="blue"
				:label="i18n.t('pomodoroTimer.focus')"
			></PomodoroDurationCard>
			<PomodoroDurationCard
				v-model="shortRestTime"
				color="yellow-lighten-2"
				:label="i18n.t('pomodoroTimer.shortRest')"
			></PomodoroDurationCard>
			<PomodoroDurationCard
				v-model="longRestTime"
				color="deep-purple-lighten-1"
				:label="i18n.t('pomodoroTimer.longRest')"
			></PomodoroDurationCard>
		</div>
		<SubtleCard
			color="primary-accent"
			borderOpacity="high"
			class="mt-3 d-flex flex-column flex-md-row justify-center ga-2 ga-md-3 pa-2 mx-auto"
			style="max-width: fit-content !important"
		>
			<div class="d-flex ga-3 align-center">
				<h4>{{ i18n.t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}</h4>
				<VSelect
					v-model="numberOfFocusPeriodsInCycle"
					class="flex-0-1"
					:items="[2, 3, 4, 5, 6]"
					hideDetails
					:clearable="false"
				></VSelect>
			</div>
			<div class="d-flex ga-3 justify-end align-center">
				<h4>{{ i18n.t('pomodoroTimer.numberOfCycles') }}</h4>
				<VSelect
					v-model="numberOfCycles"
					class="flex-0-1"
					:items="[1, 2, 3, 4, 5, 6]"
					hideDetails
					:clearable="false"
				></VSelect>
			</div>
		</SubtleCard>
	</div>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import PomodoroDurationCard from '@/core/activityHistory/component/PomodoroDurationCard.vue'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const emit = defineEmits<{
		openPresets: []
		resetToDefault: []
	}>()
	const focusTime = defineModel<Time>('focusTime', { required: true })
	const shortRestTime = defineModel<Time>('shortRestTime', { required: true })
	const longRestTime = defineModel<Time>('longRestTime', { required: true })
	const numberOfCycles = defineModel<number>('numberOfCycles', { required: true })
	const numberOfFocusPeriodsInCycle = defineModel<number>('numberOfFocusPeriodsInCycle', { required: true })

	const i18n = useI18n()
</script>
