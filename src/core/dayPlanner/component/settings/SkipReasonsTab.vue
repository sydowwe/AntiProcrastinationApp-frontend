<template>
	<div
		v-if="settingsStore.predefinedSkipReasons.length"
		class="d-flex flex-wrap ga-2"
	>
		<VChip
			v-for="(reason, i) in settingsStore.predefinedSkipReasons"
			:key="reason"
			variant="tonal"
			color="secondaryOutline"
			closable
			@click:close="settingsStore.predefinedSkipReasons.splice(i, 1)"
		>
			{{ reason }}
		</VChip>
	</div>
	<p
		v-else
		class="text-body-2 text-disabled"
	>
		{{ $t('planner.settings.noSkipReasons') }}
	</p>
	<div class="d-flex ga-2 align-center">
		<VTextField
			v-model="newSkipReason"
			:label="$t('planner.settings.newReasonLabel')"
			hideDetails
			style="max-width: 300px"
			@keydown.enter="addSkipReason"
		/>
		<VBtn
			color="primary"
			:disabled="!newSkipReason.trim() || settingsStore.predefinedSkipReasons.includes(newSkipReason.trim())"
			@click="addSkipReason"
		>
			{{ $t('general.add') }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'

	const settingsStore = useDayPlannerSettingsStore()
	const newSkipReason = ref('')

	function addSkipReason() {
		const trimmed = newSkipReason.value.trim()
		if (!trimmed || settingsStore.predefinedSkipReasons.includes(trimmed)) return
		settingsStore.predefinedSkipReasons.push(trimmed)
		newSkipReason.value = ''
	}
</script>
