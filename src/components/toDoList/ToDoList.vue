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
				@click="uncheckAll"
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

				<ToDoListItem
					:toDoListItem="item"
					:color="item instanceof TodoListItemEntity ? item.taskPriority.color : null"
					:kind
					:isInChangeOrderMode="isInChangeOrderMode"
					:listId="listId"
					:isDragging="dragState.draggedIndex === index"
					:streakConfig="streakConfig"
					@delete="deleteItem"
					@edit="(entityToEdit: TEntity) => editItem(entityToEdit as TEntity)"
					@select="select"
					@unSelect="unSelect"
					@isDoneChanged="handleIsDoneChanged"
					@stepToggled="emit('itemsChanged', [item.id])"
					@addToPlanner="(item: TEntity) => emit('addToPlanner', item)"
				/>

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

		<ToDoListItemDoneDialog
			v-model="itemDoneDialogShown"
			:toDoListItem="currentDoneItem"
			:isRecursive="isDialogRecursive"
			@openNext="recursiveDialogsToSaveToHistory"
		/>

		<VDialog
			v-model="batchDeleteConfirmDialog"
			maxWidth="360"
		>
			<VCard>
				<VCardText class="pt-4">
					{{ $t('toDoList.confirmBatchDelete', { count: pendingBatchDeleteIds.length }) }}
				</VCardText>
				<VCardActions class="justify-end ga-2 pb-3 px-4">
					<VBtn
						variant="text"
						@click="batchDeleteConfirmDialog = false"
					>
						{{ $t('general.cancel') }}
					</VBtn>
					<VBtn
						color="error"
						@click="confirmBatchDelete"
					>
						{{ $t('general.delete') }}
					</VBtn>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<script setup lang="ts" generic="TEntity extends IBaseToDoListItem">
	import ToDoListItem from './ToDoListItem.vue'
	import ToDoListItemDoneDialog from '@/components/dialogs/toDoList/ToDoListItemDoneDialog.vue'
	import { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import { computed, onMounted, ref, toRef } from 'vue'
	import { API } from '@/plugins/axiosConfig.ts'
	import TodoListItemDragAndDropPlaceholder from '@/components/toDoList/dragAndDrop/TodoListItemDragAndDropPlaceholder.vue'
	import TodoListEmptyDropZone from '@/components/toDoList/dragAndDrop/TodoListEmptyDropZone.vue'
	import { useTodoListDragAndDrop } from '@/composables/useTodoListDragAndDrop.ts'
	import { useAutoAnimate } from '@formkit/auto-animate/vue'
	import SubtleCard from '@/components/general/feedback/SubtleCard.vue'
	import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'
	import { Time } from '@/dtos/dto/Time.ts'

	const {
		kind = ToDoListKind.NORMAL,
		items,
		isInChangeOrderMode,
		listId,
		activityIds,
		streakConfig,
		allItems,
	} = defineProps<{
		kind?: number
		items: TEntity[]
		isInChangeOrderMode: boolean
		listId: number
		activityIds: number[]
		streakConfig?: { graceDays: number; periodLengthInDays: number }
		allItems?: TEntity[]
	}>()

	const emit = defineEmits<{
		(e: 'itemsChanged', changedItems: number[]): void
		(e: 'editItem', entityToEdit: TEntity): void
		(e: 'deletedItem', id: number): void
		(e: 'batchDeletedItems', ids: number[]): void
		(e: 'itemsReordered', oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest): void
		(e: 'crossListDrop', sourceListId: number, targetListId: number, itemId: number, dropTarget: any): void
		(e: 'addToPlanner', item: TEntity): void
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

	// Other methods not drag and drop
	const selectedItemsIds = ref([] as number[])
	const editItem = (entityToEdit: TEntity) => {
		emit('editItem', entityToEdit)
	}
	const url = kind === ToDoListKind.ROUTINE ? 'routine-todo-list' : 'todo-list-item'

	const itemDoneDialogShown = ref(false)
	const isDialogRecursive = ref(false)
	const changedItems = ref([] as TEntity[])
	const currentDoneItem = ref({} as TEntity)

	function recursiveDialogsToSaveToHistory() {
		if (changedItems.value.length > 0) {
			isDialogRecursive.value = true
			currentDoneItem.value = changedItems.value[0]
			itemDoneDialogShown.value = true
			changedItems.value.splice(0, 1)
		}
	}

	function handleIsDoneChanged(toDoListItem: TEntity, forceValue?: boolean) {
		const isBatchAction = selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(toDoListItem.id)
		if (toDoListItem.isDone) {
			if (isBatchAction) {
				changedItems.value = items.filter((item: TEntity) => selectedItemsIds.value.includes(item.id))
				recursiveDialogsToSaveToHistory()
			} else {
				currentDoneItem.value = toDoListItem
				isDialogRecursive.value = false
				itemDoneDialogShown.value = true
			}
		}
		const request = { ids: isBatchAction ? selectedItemsIds : [toDoListItem.id], forceValue }
		API.patch(`/${url}/toggle-is-done`, request)
			.then(() => {
				if (isBatchAction) {
					emit('itemsChanged', selectedItemsIds.value)
					selectedItemsIds.value = []
				} else {
					emit('itemsChanged', [toDoListItem.id])
				}
			})
			.catch(error => {
				console.error(error)
			})
	}

	const batchDeleteConfirmDialog = ref(false)
	const pendingBatchDeleteIds = ref<number[]>([])

	const deleteItem = (id: number) => {
		if (selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(id)) {
			pendingBatchDeleteIds.value = [...selectedItemsIds.value]
			batchDeleteConfirmDialog.value = true
		} else {
			emit('deletedItem', id)
		}
	}

	function confirmBatchDelete() {
		batchDeleteConfirmDialog.value = false
		emit('batchDeletedItems', pendingBatchDeleteIds.value)
		selectedItemsIds.value = []
		pendingBatchDeleteIds.value = []
	}

	const select = (id: number) => {
		if (!selectedItemsIds.value.includes(id)) {
			selectedItemsIds.value.push(id)
		}
	}

	const unSelect = (id: number) => {
		selectedItemsIds.value = selectedItemsIds.value.filter(item => item !== id)
	}

	function uncheckAll() {
		const doneIds = items.filter(item => item.isDone).map(item => item.id)
		if (doneIds.length === 0) return
		API.patch(`/${url}/toggle-is-done`, { ids: doneIds }).then(() => {
			emit('itemsChanged', doneIds)
		})
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
