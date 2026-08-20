<template>
	<div class="history-empty-state">
		<VIcon
			:icon="icon"
			size="64"
			class="text-disabled mb-4"
		/>
		<p class="text-body-1 text-medium-emphasis mb-0">{{ message }}</p>
		<p
			v-if="periodLabel"
			class="text-caption text-disabled mt-1 mb-0"
		>
			{{ periodLabel }}
		</p>
	</div>
</template>

<script setup lang="ts">
	defineProps<{
		icon: string
		message: string
		/** Formatted date or date range the empty result was fetched for — see H7: distinguishes
		 * "no data in this window" from a lost-data impression. */
		periodLabel?: string
	}>()
</script>

<style scoped>
	.history-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 16px;
		text-align: center;
	}
</style>
