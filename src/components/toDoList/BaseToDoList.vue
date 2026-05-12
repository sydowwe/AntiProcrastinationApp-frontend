<template>
	<div
		ref="autoParent"
		class="todo-list"
		:class="{ 'list-invalid-drop-target': isDraggingDuplicateActivity }"
	>
		<div class="d-flex align-center ga-2 mt-2">
			<span
				v-if="estimatedTimeRemaining"
				class="text-caption text-medium-emphasis text-no-wrap"
			>
				~{{ estimatedTimeRemaining.getNice }}
			</span>
			<VProgressLinear
				:modelValue="progress.done"
				:max="progress.total"
				rounded="sm"
				height="17"
				color="primary"
				class="flex-grow-1"
			>
				<span class="position-absolute w-100 text-center text-caption font-weight-bold text-white">
					{{ progress.total ? Math.round((progress.done / progress.total) * 100) : 0 }}%
				</span>
			</VProgressLinear>
			<VIconBtn
				v-if="progress.done > 0"
				icon="fa-rotate-left"
				variant="text"
				density="compact"
				color="textMuted"
				size="small"
				:title="$t('toDoList.uncheckAll')"
				@click="handleUncheckAll"
			/>
		</div>

		<SubtleCard
			v-if="isDraggingDuplicateActivity"
			class="duplicate-warning-banner"
			color="error"
			icon="ban"
			title="Task already present in this list"
			titleCentered
		/>

		<div
			class="flex-fill overflow-y-auto d-flex flex-column ga-2"
			style="height: 0"
		>
			<div
				v-for="(item, index) in sortedItems"
				:key="`${item.id}`"
				class="todo-item-container"
				:data-index="index"
			>
				<!-- Drop zone above item (invisible overlay) - only when dragging -->
				<div
					v-if="isInChangeOrderMode && isDragging && index === 0"
					:ref="el => setDropZoneRef(el as HTMLElement, index, 'top')"
					class="drop-zone-overlay drop-zone-overlay--top"
				/>

				<TodoListItemDragAndDropPlaceholder
					v-if="isInChangeOrderMode && dropIndicators[`0-top`] && index === 0"
					isFirst
				></TodoListItemDragAndDropPlaceholder>
				<TodoListItemDragAndDropPlaceholder
					v-if="isInChangeOrderMode && invalidDropIndicators[`0-top`] && index === 0"
					isFirst
					isInvalid
				></TodoListItemDragAndDropPlaceholder>

				<slot
					:item="item"
					:isDragging="dragState.draggedIndex === index"
				></slot>

				<!-- Drop zone below item (invisible overlay) - only when dragging -->
				<div
					v-if="isInChangeOrderMode && isDragging"
					:ref="el => setDropZoneRef(el as HTMLElement, index, 'bottom')"
					class="drop-zone-overlay"
					:class="{ 'drop-zone-overlay--bottom': index === items.length - 1 }"
				/>

				<TodoListItemDragAndDropPlaceholder
					v-if="isInChangeOrderMode && dropIndicators[`${index}-bottom`]"
				></TodoListItemDragAndDropPlaceholder>
				<TodoListItemDragAndDropPlaceholder
					v-if="isInChangeOrderMode && invalidDropIndicators[`${index}-bottom`]"
					isInvalid
				></TodoListItemDragAndDropPlaceholder>
			</div>

			<!-- Empty state drop zone when list is empty -->
			<TodoListEmptyDropZone
				v-if="items.length === 0 && isInChangeOrderMode"
				ref="emptyDropZoneRef"
				:isDraggedOver="dragState.isEmptyZoneDraggedOver"
				:isInvalidDrop="dragState.isEmptyZoneInvalidDrop"
			/>
			<div
				v-if="items.length === 0 && !isInChangeOrderMode"
				class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis ga-3"
			>
				<VIcon
					icon="list-check"
					size="40"
					opacity="0.4"
				/>
				<span class="text-body-2">No tasks</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" generic="TEntity extends IBaseToDoListItem">
	import { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { computed, onMounted, ref, toRef } from 'vue'
	import TodoListItemDragAndDropPlaceholder from '@/components/toDoList/dragAndDrop/TodoListItemDragAndDropPlaceholder.vue'
	import TodoListEmptyDropZone from '@/components/toDoList/dragAndDrop/TodoListEmptyDropZone.vue'
	import { useTodoListDragAndDrop } from '@/composables/useTodoListDragAndDrop.ts'
	import { useAutoAnimate } from '@formkit/auto-animate/vue'
	import SubtleCard from '@/components/general/feedback/SubtleCard.vue'
	import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'
	import { Time } from '@/dtos/dto/Time.ts'

	const { items, isInChangeOrderMode, listId, activityIds, allItems } = defineProps<{
		items: TEntity[]
		isInChangeOrderMode: boolean
		listId: number
		activityIds: number[]
		allItems?: TEntity[]
	}>()

	const emit = defineEmits<{
		(e: 'itemsReordered', oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest): void
		(e: 'crossListDrop', sourceListId: number, targetListId: number, itemId: number, dropTarget: any): void
		(e: 'uncheckAll', doneIds: number[]): void
	}>()

	// Auto-animate controller
	const [autoParent] = useAutoAnimate({ duration: 300, easing: 'ease-in-out' })

	// Drag and drop state - declare ref before using in composable
	const emptyDropZoneRef = ref<any>(null)

	function handleSameListDrop(
		sourceIndex: number,
		targetIndex: number,
		itemId: number,
		dropType: 'drop-zone' | 'empty-zone',
		position?: 'top' | 'bottom',
	) {
		if (dropType === 'drop-zone' && position) {
			let finalIndex = targetIndex

			if (position === 'bottom') {
				finalIndex = targetIndex + 1
			}

			// Adjust for moving within the same list
			if (sourceIndex < finalIndex) {
				finalIndex -= 1
			}

			if (sourceIndex !== finalIndex && sourceIndex >= 0 && finalIndex >= 0 && finalIndex <= items.length) {
				const precedingItem = finalIndex > 0 ? items[finalIndex - 1] : null
				const followingItem = finalIndex < items.length ? items[finalIndex] : null

				const request = new ChangeDisplayOrderRequest(
					itemId,
					precedingItem?.id ?? null,
					followingItem?.id ?? null,
				)

				emit('itemsReordered', sourceIndex, finalIndex, request)
			}
		} else if (dropType === 'empty-zone') {
			const followingItem = items.length > 1 ? items[0] : null

			const request = new ChangeDisplayOrderRequest(itemId, null, followingItem?.id ?? null)

			emit('itemsReordered', sourceIndex, 0, request)
		}
	}

	function handleCrossListDrop(sourceListId: number, targetListId: number, itemId: number, dropTarget: any) {
		emit('crossListDrop', sourceListId, targetListId, itemId, dropTarget)
	}

	const {
		isDragging,
		isDraggingDuplicateActivity,
		dragState,
		dropIndicators,
		invalidDropIndicators,
		setDropZoneRef,
		setupDragAndDrop,
	} = useTodoListDragAndDrop({
		items: toRef(() => items),
		listId: toRef(() => listId),
		activityIds: toRef(() => activityIds),
		isInChangeOrderMode: toRef(() => isInChangeOrderMode),
		emptyDropZoneRef,
		onSameListDrop: handleSameListDrop,
		onCrossListDrop: handleCrossListDrop,
	})

	// Setup drag and drop monitoring
	onMounted(() => {
		setupDragAndDrop()
	})

	const sortedItems = computed(() => {
		if (isInChangeOrderMode) return items
		return [...items.filter(item => !item.isDone), ...items.filter(item => item.isDone)]
	})

	const progress = computed(() => {
		const source = allItems ?? items
		const done = source.reduce((sum, item) => sum + (item.doneCount ?? (item.isDone ? 1 : 0)), 0)
		const total = source.reduce((sum, item) => sum + (item.totalCount ?? 1), 0)
		return { done, total }
	})

	const estimatedTimeRemaining = computed(() => {
		const source = allItems ?? items
		const totalMinutes = source
			.filter(item => !item.isDone)
			.reduce((sum, item) => sum + (item.suggestedTime?.getInMinutes ?? 0), 0)
		if (totalMinutes === 0) return null
		return Time.fromMinutes(totalMinutes)
	})

	function handleUncheckAll() {
		emit(
			'uncheckAll',
			items.filter(item => item.isDone).map(item => item.id),
		)
	}
</script>

<style scoped>
	.todo-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0;
		min-height: 200px;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.todo-list.list-invalid-drop-target {
		opacity: 0.6;
		pointer-events: none;
	}

	.duplicate-warning-banner {
		animation: slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1001;
	}

	@keyframes slideInDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.todo-item-container {
		position: relative;
	}

	.drop-zone-overlay {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 1000;
		background: transparent;
		pointer-events: auto;
	}

	@keyframes fadeInScale {
		0% {
			opacity: 0;
			transform: scale(0.95);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
