<template>
	<ChipWithIcon
		:icon="icon"
		:color="color"
		:size="size"
	>
		{{ $t(`reminders.status.${status}`) }}
	</ChipWithIcon>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { ReminderStatus } from '@/core/reminders/dto/enum/ReminderStatus.ts'

	const { status, size = 'small' } = defineProps<{ status: ReminderStatus; size?: string }>()

	const icon = computed(() => {
		switch (status) {
			case ReminderStatus.Active:
				return 'circle-play'
			case ReminderStatus.Paused:
				return 'circle-pause'
			case ReminderStatus.Cancelled:
				return 'circle-xmark'
			case ReminderStatus.Completed:
				return 'circle-check'
			default:
				return 'circle'
		}
	})

	const color = computed(() => {
		switch (status) {
			case ReminderStatus.Active:
				return 'success'
			case ReminderStatus.Paused:
				return 'warning'
			case ReminderStatus.Cancelled:
				return 'textMuted'
			case ReminderStatus.Completed:
				return 'secondary'
			default:
				return 'secondary'
		}
	})
</script>
