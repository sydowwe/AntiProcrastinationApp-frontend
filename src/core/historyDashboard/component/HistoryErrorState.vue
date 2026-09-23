<template>
	<!-- The failed-request sibling of HistoryEmptyState (F27). Same shape as the tracking dashboards'
	     panel error state, and deliberately no `periodLabel`: the period is what the empty state names
	     to prove nothing was lost, and a failed request has proved nothing about the period at all. -->
	<div class="history-error-state">
		<VIcon
			icon="fas fa-triangle-exclamation"
			size="48"
			class="text-disabled mb-2"
		/>
		<p class="text-body-2 text-medium-emphasis mb-3">{{ $t('activityTracking.common.loadFailed') }}</p>
		<VBtn
			size="small"
			variant="outlined"
			@click="emit('retry')"
		>
			{{ $t('activityTracking.common.retry') }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	const emit = defineEmits<{
		retry: []
	}>()
</script>

<style scoped>
	.history-error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 16px;
		text-align: center;
	}
</style>
