<template>
<!-- Floating Selection Action Bar -->
<Transition name="slide-up">
	<VSheet
		v-if="isShown"
		class="action-bar d-flex align-center ga-2 ga-md-3 px-3 py-2"
		elevation="8"
	>
		<slot></slot>

		<VBtn
			variant="tonal"
			color="secondaryOutline"
			@click="emit('cancel')"
		>
			Cancel
		</VBtn>
	</VSheet>
</Transition>
</template>

<script setup lang="ts">
const {isShown} = defineProps<{
	isShown: boolean
}>()

const emit = defineEmits<{
	cancel: []
}>()
</script>

<style scoped>
/* Selection Action Bar */
.action-bar {
	position: sticky;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 50;
	background: rgb(var(--v-theme-surface));
	border: 1px solid rgba(var(--v-theme-on-surface), 0.33);
	border-radius: 6px;
	min-width: min-content;
	text-wrap: nowrap;
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}

.slide-up-enter-from {
	opacity: 0;
	transform: translateX(-50%) translateY(20px);
}

.slide-up-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(20px);
}

/* Responsive adjustments */
@media (max-width: 600px) {
	/* Mobile-friendly floating action bar */
	.action-bar {
		bottom: 10px;
		max-width: 98%;
		padding: 10px 8px !important;
	}

	/* Make buttons even smaller on mobile */
	.action-bar :deep(.v-btn) {
		font-size: 0.75rem;
		min-width: auto;
		padding: 0 8px;
		height: 28px;
	}
}
</style>
