<template>
	<div
		v-if="settingsStore.predefinedSkipReasons.length"
		class="d-flex flex-wrap ga-2 mt-2"
	>
		<VChip
			v-for="r in settingsStore.predefinedSkipReasons"
			:key="r"
			size="small"
			variant="tonal"
			color="secondaryOutline"
			@click="reason = r"
		>
			{{ r }}
		</VChip>
	</div>
	<VTextarea
		v-model="reason"
		label="Reason (optional)"
		rows="3"
		autoGrow
		hideDetails
		class="mt-2"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

	const dialogApi = useDialogApi<{ reason: string }>()

	const settingsStore = useDayPlannerSettingsStore()

	const reason = ref('')

	dialogApi.onConfirm(onConfirm)

	function onConfirm() {
		dialogApi.close({ reason: reason.value })
	}
</script>
