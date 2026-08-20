<template>
	<div
		class="history-first-run d-flex flex-column align-center justify-center text-center ga-4"
		:class="{ 'pa-8': !compact, 'pa-4': compact }"
	>
		<VIcon
			icon="fas fa-clock-rotate-left"
			:size="compact ? 40 : 72"
			class="text-disabled"
		/>
		<div>
			<p
				class="mb-1"
				:class="compact ? 'text-subtitle-1' : 'text-h6'"
			>
				{{ $t('historyDashboard.emptyState.firstRunTitle') }}
			</p>
			<p class="text-body-2 text-medium-emphasis mb-0">{{ $t('historyDashboard.emptyState.firstRunMessage') }}</p>
		</div>
		<div class="d-flex ga-3 flex-wrap justify-center">
			<VBtn
				color="primary"
				prependIcon="fas fa-pen"
				:to="{ name: 'activityHistoryManual' }"
			>
				{{ $t('historyDashboard.emptyState.logManually') }}
			</VBtn>
			<VBtn
				variant="outlined"
				color="secondaryOutline"
				prependIcon="fas fa-stopwatch"
				:to="{ name: 'timer' }"
			>
				{{ $t('historyDashboard.emptyState.startTimer') }}
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	const { compact = false } = defineProps<{
		/** Smaller icon/heading and tighter padding — for the calendar view's inline banner. */
		compact?: boolean
	}>()
</script>
