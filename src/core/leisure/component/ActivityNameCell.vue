<template>
	<span class="d-flex align-center ga-2">
		<VIcon
			v-if="activity.icon"
			:icon="activity.icon"
			:color="activity.color ?? undefined"
			size="16"
		/>
		<span>{{ activity.name || '—' }}</span>
	</span>
</template>

<script setup lang="ts">
	import type { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'

	defineProps<{ activity: ActivityInfo }>()
</script>
