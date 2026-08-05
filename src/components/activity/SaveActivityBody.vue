<template>
	<span class="text-center">
		{{ $t('activities.confirmSaveActivity', { activity, timeSpent: timeSpent.getNice }) }}
	</span>
</template>

<script setup lang="ts">
	import type { Time } from '@/_common/dto/dto/Time.ts'

	defineProps<{
		activity: string
		timeSpent: Time
	}>()
</script>
