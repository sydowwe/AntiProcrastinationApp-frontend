<template>
<div class="drag-preview-template" v-show="false">
	<VListItem
		:active="!toDoListItem.isDone"
		:color="color"
		class="align-center listItem drag-preview-item"
		style="width: 400px;"
		rounded
	>
		<template v-slot:prepend>
			<VListItemAction start>
				<v-checkbox-btn v-if="!toDoListItem.isMultipleCount" v-model="toDoListItem.isDone" base-color="white" color="success" disabled></v-checkbox-btn>
				<div v-else class="d-flex flex-column ga-1 align-center justify-center">
					<VProgressLinear
						color="neutral-400"
						:model-value="(toDoListItem.doneCount ?? 1) / (toDoListItem.totalCount ?? 1) * 100"
						height="35"
						bgOpacity="0.3"
						style="border: 1px solid #777; border-radius: 4px; width: 40px;"
					>
						<div class="d-flex align-center">
							<span v-if="!toDoListItem.isDone && toDoListItem.doneCount !== null" class="text-white">{{ toDoListItem.doneCount }}</span>
							<VIcon v-if="toDoListItem.isDone" size="17" icon="check" color="success"></VIcon>
							<span class="text-white">/{{ toDoListItem.totalCount }}</span>
						</div>
					</VProgressLinear>
				</div>
			</VListItemAction>
		</template>
		<VListItemTitle class="text-white">{{ toDoListItem.activity.name }}</VListItemTitle>
		<VListItemSubtitle class="text-white">{{ toDoListItem.activity.text }}</VListItemSubtitle>
	</VListItem>
</div>
</template>

<script setup lang="ts">
import {type BaseToDoListItemEntity} from '@/dtos/response/base/BaseToDoListItemEntity.ts';

defineProps({
	toDoListItem: {
		type: Object as () => BaseToDoListItemEntity,
		required: true,
	},
	color: {
		type: String,
		required: true,
	},
});
</script>

<style scoped>
.listItem {
	border: 2px solid black !important;
	border-radius: 8px;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: default;
	background: rgba(var(--v-theme-surface), 0.8);
}

.drag-preview-template {
	position: static;
	pointer-events: none;
}

.drag-preview-item {
	border: 2px solid rgb(var(--v-theme-primary)) !important;
	border-radius: 5px;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
	transform: rotate(7deg);
}
</style>