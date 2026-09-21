<template>
	<div class="empty-state">
		<VIcon
			:icon="failed ? 'triangle-exclamation' : filtered ? 'filter-circle-xmark' : icon"
			size="40"
			class="mb-3"
			style="opacity: 0.3"
		/>
		<template v-if="failed">
			<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.loadFailed') }}</p>
			<VBtn
				color="primaryOutline"
				variant="tonal"
				prependIcon="rotate-right"
				@click="emit('onRetry')"
			>
				{{ $t('general.retry') }}
			</VBtn>
		</template>
		<template v-else-if="filtered">
			<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.filtered') }}</p>
			<VBtn
				color="primaryOutline"
				variant="tonal"
				prependIcon="filter-circle-xmark"
				@click="emit('onClearFilters')"
			>
				{{ $t('leisure.emptyStates.clearFilters') }}
			</VBtn>
		</template>
		<template v-else>
			<p class="text-subtitle-2 font-weight-medium mb-3">{{ message }}</p>
			<VBtn
				color="success"
				variant="tonal"
				prependIcon="plus"
				@click="emit('onAdd')"
			>
				{{ $t('general.add') }}
			</VBtn>
		</template>
	</div>
</template>

<script setup lang="ts">
	// The one empty state for every leisure surface, with the three cases it has to tell apart (F61,
	// F79): a *failed* load must not read as "you have none", and a filter that matches nothing must
	// not nudge the user toward creating a duplicate — it offers to clear the filter instead. Only the
	// genuinely-empty branch shows the onboarding copy and the Add CTA. `failed` wins over `filtered`
	// because a failed fetch says nothing about what the filter would have matched.
	const {
		icon,
		message,
		filtered = false,
		failed = false,
	} = defineProps<{
		icon: string
		/** The already-translated onboarding copy for the genuinely-empty case. */
		message: string
		filtered?: boolean
		failed?: boolean
	}>()
	const emit = defineEmits<{ onAdd: []; onClearFilters: []; onRetry: [] }>()
</script>

<style scoped>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		text-align: center;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}
</style>
