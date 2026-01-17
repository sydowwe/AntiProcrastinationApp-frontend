<template>
<VCard
	ref="rootRef"
	class="empty-drop-zone d-flex align-center justify-center"
	:class="{
		'is-drag-over': isDraggedOver,
		'is-invalid-drop': isInvalidDrop
	}"
	variant="outlined"
	:color="isInvalidDrop ? 'error' : 'primary'"
>
	<VCardText class="text-center">
		<VIcon
			:icon="isInvalidDrop ? 'ban' : 'plus-circle'"
			size="25"
			:color="isInvalidDrop ? 'error' : 'primary'"
			class="mb-1"
		/>
		<div
			:class="isInvalidDrop ? 'text-error' : 'text-primary'"
			class="font-weight-medium"
		>{{ isInvalidDrop ? 'Activity already exists' : 'Drop items here' }}
		</div>
	</VCardText>
</VCard>
</template>

<script setup lang="ts">
import {ref} from 'vue';

defineProps({
	isDraggedOver: {
		type: Boolean,
		default: false,
	},
	isInvalidDrop: {
		type: Boolean,
		default: false,
	},
});

const rootRef = ref<any>(null);

defineExpose({
	rootRef,
});
</script>

<style scoped>
.empty-drop-zone {
	margin: 0 10px;
	min-height: 120px;
	pointer-events: auto;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 2px dashed rgba(var(--v-theme-primary), 0.3) !important;
	background: rgba(var(--v-theme-primary), 0.02);
}

.empty-drop-zone.is-drag-over {
	background: rgba(var(--v-theme-primary), 0.08) !important;
	border-color: rgb(var(--v-theme-primary)) !important;
	transform: scale(1.01);
	box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2),
	inset 0 0 24px rgba(var(--v-theme-primary), 0.1);
}

.empty-drop-zone.is-invalid-drop {
	background: rgba(var(--v-theme-error), 0.08) !important;
	border: 2px dashed rgba(var(--v-theme-error), 0.5) !important;
	transform: scale(1.01);
	box-shadow: 0 4px 16px rgba(var(--v-theme-error), 0.2),
	inset 0 0 24px rgba(var(--v-theme-error), 0.1);
	cursor: not-allowed;
}
</style>
