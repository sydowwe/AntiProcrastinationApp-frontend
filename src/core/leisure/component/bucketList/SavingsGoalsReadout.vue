<template>
	<div
		v-if="visible"
		class="d-flex align-center ga-3"
	>
		<!-- Same geometry as ExperiencedProgress directly above it, so the two bars line up. -->
		<VProgressLinear
			v-if="showLived"
			:modelValue="percent"
			color="successDark"
			height="6"
			rounded
			style="max-width: 160px"
		/>
		<span class="d-flex align-center ga-1 text-caption text-medium-emphasis">
			<VIcon
				icon="piggy-bank"
				size="12"
			/>
			{{ $t('leisure.savings.remaining', { remaining: format(summary.remaining) }) }}
		</span>
		<span
			v-if="showLived"
			class="text-caption text-medium-emphasis"
		>
			{{ $t('leisure.savings.lived', { lived: format(summary.lived), total: format(summary.total) }) }}
		</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { SavingsGoalSummary } from '@/core/leisure/composable/useSavingsGoals.ts'

	const { summary, visible, showLived } = defineProps<{
		summary: SavingsGoalSummary
		visible: boolean
		showLived: boolean
	}>()

	const { locale } = useI18n()

	// `financialGoal` carries no currency on the wire, so the readout does not invent one.
	const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }))
	const percent = computed(() => (summary.total > 0 ? (summary.lived / summary.total) * 100 : 0))

	function format(value: number): string {
		return numberFormat.value.format(value)
	}
</script>
