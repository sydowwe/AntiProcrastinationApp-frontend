<template>
	<MyDialog
		v-model="model"
		title="Skip task"
		confirmBtnText="Skip"
		confirmBtnColor="warning"
		@confirmed="handleConfirm"
	>
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
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import { useDayPlannerSettingsStore } from '@/stores/dayPlanner/dayPlannerSettingsStore.ts'

	const settingsStore = useDayPlannerSettingsStore()

	const emit = defineEmits<{
		skip: [reason: string]
	}>()

	const model = defineModel<boolean>({ default: false })

	const reason = ref('')

	watch(model, open => {
		if (open) reason.value = ''
	})

	function handleConfirm() {
		emit('skip', reason.value)
		model.value = false
	}
</script>
