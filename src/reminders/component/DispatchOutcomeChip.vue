<template>
	<ChipWithIcon
		:icon="icon"
		:color="color"
		:size="size"
	>
		{{ $t(`reminderDashboard.outcome.${outcome}`) }}
	</ChipWithIcon>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { DispatchOutcome } from '@/core/reminders/dto/enum/DispatchOutcome.ts'

	const { outcome, size = 'small' } = defineProps<{ outcome: DispatchOutcome; size?: string }>()

	const icon = computed(() => {
		switch (outcome) {
			case DispatchOutcome.Sent:
				return 'circle-check'
			case DispatchOutcome.Skipped:
				return 'forward'
			case DispatchOutcome.Failed:
				return 'circle-exclamation'
			case DispatchOutcome.Reversal:
				return 'rotate-left'
			default:
				return 'circle'
		}
	})

	const color = computed(() => {
		switch (outcome) {
			case DispatchOutcome.Sent:
				return 'success'
			case DispatchOutcome.Skipped:
				return 'textMuted'
			case DispatchOutcome.Failed:
				return 'error'
			case DispatchOutcome.Reversal:
				return 'warning'
			default:
				return 'secondary'
		}
	})
</script>
