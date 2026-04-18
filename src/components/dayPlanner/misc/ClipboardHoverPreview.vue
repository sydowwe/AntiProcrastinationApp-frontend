<!-- ClipboardHoverPreview.vue -->
<template>
	<div
		v-for="(preview, index) in previews"
		:key="index"
		class="clipboard-preview"
		:class="{ conflict: preview.hasConflict }"
		:style="{ gridRow: `${preview.startRow} / span ${Math.max(1, preview.endRow - preview.startRow)}` }"
	/>
</template>

<script
	setup
	lang="ts"
>
	defineProps<{
		previews: Array<{ startRow: number; endRow: number; hasConflict: boolean }>
	}>()
</script>

<style scoped>
	.clipboard-preview {
		position: absolute;
		top: 2px;
		bottom: 1px;
		left: 2px;
		right: 2px;
		background: rgba(72, 199, 142, 0.25);
		border: 2px dashed #48c78e;
		border-radius: 6px;
		z-index: 5;
		pointer-events: none;
	}

	.clipboard-preview.conflict {
		background: rgba(244, 67, 54, 0.4);
		border-color: #f44336;
		animation: pulse 0.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.02);
		}
	}
</style>
