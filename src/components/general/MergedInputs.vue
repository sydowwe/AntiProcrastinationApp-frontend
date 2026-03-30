<template>
	<div class="merged-input d-flex flex-1-1">
		<slot name="first"></slot>
		<slot name="second"></slot>
	</div>
</template>

<script setup lang="ts"></script>

<style scoped>
	.merged-input :deep(> :nth-child(1) .v-field) {
		border-bottom-right-radius: 0 !important;
		border-top-right-radius: 0 !important;
	}

	.merged-input :deep(> :nth-child(2) .v-field) {
		border-bottom-left-radius: 0 !important;
		border-top-left-radius: 0 !important;
	}
</style>
