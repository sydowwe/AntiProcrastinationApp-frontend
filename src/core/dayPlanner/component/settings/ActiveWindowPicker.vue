<template>
	<div class="mt-3">
		<VSwitch
			v-model="hasWindow"
			:label="$t('planner.settings.limitToDateRange')"
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
					:label="$t('planner.settings.fromLabel')"
					clearable
					density="comfortable"
					:hideDetails="!(showError && windowError)"
					:errorMessages="showError && windowError && !from ? windowError : undefined"
					style="min-width: 190px"
				/>
				<VDateInput
					v-model="to"
					:label="$t('planner.settings.toLabel')"
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
	import { useI18n } from 'vue-i18n'

	const { showError = false } = defineProps<{ showError?: boolean }>()

	const hasWindow = defineModel<boolean>('hasWindow', { required: true })
	const from = defineModel<Date | null>('from', { required: true })
	const to = defineModel<Date | null>('to', { required: true })

	const { t } = useI18n()

	const windowError = computed<string | null>(() => {
		if (!hasWindow.value) return null
		if (!from.value && !to.value) return t('planner.settings.bothDatesRequired')
		if (!from.value) return t('planner.settings.startDateRequired')
		if (!to.value) return t('planner.settings.endDateRequired')
		return null
	})
</script>
