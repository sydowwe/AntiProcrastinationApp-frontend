<template>
<VListItem
	class="empty-item-placeholder"
	:class="{
		'empty-item-placeholder-top': isFirst,
		'empty-item-placeholder-invalid': isInvalid
	}"
	variant="outlined"
	:baseColor="isInvalid ? 'error' : 'primaryOutline'"
>
	<template v-slot:prepend>
		<VListItemAction start>
			<VIcon
				:icon="isInvalid ? 'ban' : 'plus'"
				size="20"
			/>
		</VListItemAction>
	</template>
	<VListItemTitle class="font-weight-medium">
		{{ isInvalid ? 'Activity already exists' : 'Drop here to add item' }}
	</VListItemTitle>
</VListItem>
</template>

<script setup lang="ts">
defineProps({
	isFirst: {
		type: Boolean,
		default: false,
	},
	isLast: {
		type: Boolean,
		default: false,
	},
	isInvalid: {
		type: Boolean,
		default: false,
	},
})
</script>

<style scoped>
.empty-item-placeholder {
	margin-top: 10px;
	margin-bottom: -10px;
	border: 2px dashed rgba(var(--v-theme-primary), 0.5) !important;
	border-radius: 8px !important;
	background: rgba(var(--v-theme-primary), 0.05) !important;
	backdrop-filter: blur(4px);
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	min-height: 50px;
}

.empty-item-placeholder.empty-item-placeholder-top {
	margin-top: -10px;
	margin-bottom: 10px;
}

.empty-item-placeholder:hover {
	background: rgba(var(--v-theme-primary), 0.08) !important;
	border-color: rgb(var(--v-theme-primary)) !important;
	transform: scale(1.02);
	box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
}

.empty-item-placeholder-invalid {
	border: 2px dashed rgba(var(--v-theme-error), 0.5) !important;
	background: rgba(var(--v-theme-error), 0.05) !important;
	cursor: not-allowed;
}

.empty-item-placeholder-invalid:hover {
	background: rgba(var(--v-theme-error), 0.08) !important;
	border-color: rgb(var(--v-theme-error)) !important;
	box-shadow: 0 4px 12px rgba(var(--v-theme-error), 0.2);
}
</style>