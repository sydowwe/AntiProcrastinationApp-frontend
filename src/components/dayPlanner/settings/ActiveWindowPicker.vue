<template>
	<div class="mt-3">
		<VSwitch
			v-model="hasWindow"
			label="Limit to date range"
			color="primary"
			density="compact"
			hideDetails
		/>
		<VExpandTransition>
			<div
				v-if="hasWindow"
				class="d-flex ga-3 flex-wrap mt-3"
			>
				<VDateInput
					v-model="from"
					label="From"
					clearable
					density="comfortable"
					:hideDetails="!(showError && windowError)"
					:errorMessages="showError && windowError && !from ? windowError : undefined"
					style="min-width: 190px"
				/>
				<VDateInput
					v-model="to"
					label="To"
					clearable
					density="comfortable"
					:hideDetails="!(showError && windowError)"
					:errorMessages="showError && windowError && !to ? windowError : undefined"
					style="min-width: 190px"
				/>
			</div>
		</VExpandTransition>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { VDateInput } from 'vuetify/labs/components'

	const { showError = false } = defineProps<{ showError?: boolean }>()

	const hasWindow = defineModel<boolean>('hasWindow', { required: true })
	const from = defineModel<Date | null>('from', { required: true })
	const to = defineModel<Date | null>('to', { required: true })

	const windowError = computed<string | null>(() => {
		if (!hasWindow.value) return null
		if (!from.value && !to.value) return 'Both dates are required'
		if (!from.value) return 'Start date is required'
		if (!to.value) return 'End date is required'
		return null
	})
</script>
