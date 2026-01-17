<template>
<VListItem
	class="empty-item-placeholder" :class="isFirst ? 'empty-item-placeholder-top' : ''"
	variant="outlined" baseColor="primaryOutline"
>
	<template v-slot:prepend>
		<VListItemAction start>
			<VIcon icon="plus" size="20"/>
		</VListItemAction>
	</template>
	<VListItemTitle class="font-weight-medium">
		Drop here to add item
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
</style>