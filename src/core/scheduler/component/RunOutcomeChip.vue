<template>
	<ChipWithIcon
		v-if="outcome"
		:icon="icon"
		:color="color"
		:size="size"
	>
		{{ $t(`scheduler.runOutcome.${outcome}`) }}
	</ChipWithIcon>
	<span
		v-else
		class="text-medium-emphasis"
	>
		—
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { RunOutcome } from '@/core/scheduler/dto/enum/RunOutcome.ts'

	const { outcome, size = 'small' } = defineProps<{ outcome: RunOutcome | null; size?: string }>()

	const icon = computed(() => {
		switch (outcome) {
			case RunOutcome.Succeeded:
				return 'circle-check'
			case RunOutcome.Failed:
				return 'circle-exclamation'
			case RunOutcome.Skipped:
				return 'forward'
			case RunOutcome.Vetoed:
				return 'ban'
			default:
				return 'circle'
		}
	})

	const color = computed(() => {
		switch (outcome) {
			case RunOutcome.Succeeded:
				return 'success'
			case RunOutcome.Failed:
				return 'error'
			case RunOutcome.Skipped:
				return 'textMuted'
			case RunOutcome.Vetoed:
				return 'warning'
			default:
				return 'secondary'
		}
	})
</script>
