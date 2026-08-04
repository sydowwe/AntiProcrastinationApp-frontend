<template>
	<ChipWithIcon
		:icon="icon"
		:color="color"
		:size="size"
	>
		{{ $t(`scheduler.triggerSource.${source}`) }}
	</ChipWithIcon>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { TriggerSource } from '@/core/scheduler/dto/enum/TriggerSource.ts'

	const { source, size = 'small' } = defineProps<{ source: TriggerSource; size?: string }>()

	const icon = computed(() => {
		switch (source) {
			case TriggerSource.Scheduled:
				return 'clock'
			case TriggerSource.Manual:
				return 'hand-pointer'
			case TriggerSource.Replay:
				return 'rotate-right'
			default:
				return 'circle'
		}
	})

	const color = computed(() => {
		switch (source) {
			case TriggerSource.Scheduled:
				return 'secondaryOutline'
			case TriggerSource.Manual:
				return 'primaryOutline'
			case TriggerSource.Replay:
				return 'warning'
			default:
				return 'secondary'
		}
	})
</script>
