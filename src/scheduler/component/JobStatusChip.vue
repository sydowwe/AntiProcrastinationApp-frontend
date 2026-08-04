<template>
	<ChipWithIcon
		:icon="icon"
		:color="color"
		:size="size"
	>
		{{ $t(`scheduler.jobStatus.${status}`) }}
	</ChipWithIcon>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { JobStatus } from '@/core/scheduler/dto/enum/JobStatus.ts'

	const { status, size = 'small' } = defineProps<{ status: JobStatus; size?: string }>()

	const icon = computed(() => {
		switch (status) {
			case JobStatus.Active:
				return 'circle-play'
			case JobStatus.Paused:
				return 'circle-pause'
			case JobStatus.Removed:
				return 'circle-xmark'
			default:
				return 'circle'
		}
	})

	const color = computed(() => {
		switch (status) {
			case JobStatus.Active:
				return 'success'
			case JobStatus.Paused:
				return 'warning'
			case JobStatus.Removed:
				return 'textMuted'
			default:
				return 'secondary'
		}
	})
</script>
