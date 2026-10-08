<template>
	<div
		v-if="items.length > 0"
		class="legend d-flex flex-wrap ga-2"
	>
		<div
			v-for="item in items"
			:key="item.key"
			class="legend-item d-flex align-center ga-1"
		>
			<div
				class="legend-color"
				:style="{ backgroundColor: item.color }"
			/>
			<span class="legend-label">{{ item.label }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	const { items } = defineProps<{
		items: { key: string; label: string; color: string }[]
	}>()
</script>

<style scoped>
	.legend {
		font-size: 12px;
	}

	.legend-item {
		padding: 2px 6px;
		border-radius: 4px;
		background-color: rgba(255, 255, 255, 0.05);
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.legend-label {
		font-size: 11px;
		color: #fff;
		white-space: nowrap;
	}
</style>
