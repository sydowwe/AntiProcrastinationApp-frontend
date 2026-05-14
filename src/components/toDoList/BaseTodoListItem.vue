<template>
	<VListItem
		ref="itemRef"
		rounded
		class="align-center listItem"
		:class="{
			'is-dragging': isDragging,
			'is-done': isDone,
		}"
		@click="itemClicked"
	>
		<div
			v-if="accentColor"
			class="priority-accent"
			:style="{ background: accentColor }"
		/>
		<div class="w-100 d-flex align-center ga-2">
			<div class="pr-1">
				<VCheckboxBtn
					v-if="!toDoListItem.isMultipleCount"
					v-model="isDone"
					class="pl-2"
					baseColor="white"
					color="success"
					:disabled="isInChangeOrderMode"
					:style="isInChangeOrderMode ? 'color:white !important' : ''"
					@click.prevent
				/>
				<TodoListItemCounter
					v-else
					:doneCount
					:totalCount="toDoListItem.totalCount"
					:isDone
					@minus="minusClicked"
					@increment="progressClicked"
				/>
			</div>

			<div class="flex-fill">
				<div class="d-flex ga-1 align-center">
					<slot
						name="pre-chips"
						:isInChangeOrderMode
					/>
					<VChip
						v-if="toDoListItem.suggestedTime?.isNotZero()"
						size="x-small"
						variant="tonal"
						color="neutral-600"
						prependIcon="clock"
					>
						~{{ toDoListItem.suggestedTime!.getNice }}
					</VChip>
					<slot name="post-chips" />
					<VListItemTitle
						class="text-white"
						:class="{ 'text-decoration-line-through': isDone }"
					>
						{{ toDoListItem.activity.name }}
					</VListItemTitle>
				</div>
				<VListItemSubtitle class="text-white">{{ toDoListItem.activity.text }}</VListItemSubtitle>
				<VTooltip
					v-if="toDoListItem.note"
					:text="toDoListItem.note"
					location="bottom"
					maxWidth="300"
				>
					<template #activator="{ props: tooltipProps }">
						<span
							v-bind="tooltipProps"
							class="text-caption text-medium-emphasis d-block mt-1"
							style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default"
						>
							{{ toDoListItem.note }}
						</span>
					</template>
				</VTooltip>
			</div>
			<div>
				<VIcon
					v-if="isInChangeOrderMode"
					class="drag-handle my-1 mr-3"
					icon="bars"
					color="white"
					size="small"
					style="height: 40px"
				></VIcon>
				<div
					v-else
					class="d-flex align-center ga-2"
				>
					<VMenu
						location="start"
						transition="slide-y-transition"
					>
						<template #activator="{ props: menuProps }">
							<VIconBtn
								icon="ellipsis-vertical"
								v-bind="menuProps"
								class="mr-1"
								color="white"
								variant="text"
								size="40"
								@click.stop=""
							></VIconBtn>
						</template>
						<VList>
							<VListItem
								v-for="(item, i) in actions"
								:key="i"
								class="px-3"
							>
								<VBtn
									class="px-3"
									:color="item.color"
									:variant="item.variant"
									:appendIcon="item.icon"
									width="100%"
									@click="item.action"
								>
									{{ actionButtonText(item.name) }}
								</VBtn>
							</VListItem>
						</VList>
					</VMenu>
				</div>
			</div>
		</div>
		<BaseTodoListItemSteps
			v-if="localSteps.length > 0"
			class="mt-2"
			:steps="localSteps"
			:itemId="toDoListItem.id"
			:kind
			:isDone
			:disabled="isInChangeOrderMode"
			@mousedown.stop
			@stepToggled="emits('stepToggled')"
		/>
		<!-- Hidden drag preview template -->
		<DraggedItemPreview
			ref="dragPreviewRef"
			:toDoListItem
			:color
		/>
	</VListItem>
</template>

<script setup lang="ts" generic="TItem extends IBaseToDoListItem">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useColor } from '@/utils/colorPalette.ts'
	import DraggedItemPreview from '@/components/toDoList/dragAndDrop/DraggedItemPreview.vue'
	import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'
	import { MenuItem } from '@/dtos/dto/MenuAction.ts'
	import type { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import type { TodoListItemStepEntity } from '@/dtos/response/todoList/TodoListItemStepEntity.ts'
	import BaseTodoListItemSteps from '@/components/toDoList/BaseTodoListItemSteps.vue'
	import TodoListItemCounter from '@/components/toDoList/TodoListItemCounter.vue'
	import { useTodoItemDraggable } from '@/composables/todoListDragAndDrop/useTodoItemDraggable.ts'

	const {
		toDoListItem,
		color = null,
		kind,
		isInChangeOrderMode = false,
		listId,
		isDragging = false,
	} = defineProps<{
		toDoListItem: TItem
		color?: string | null
		kind: ToDoListKind
		isInChangeOrderMode?: boolean
		listId: number
		isDragging?: boolean
	}>()

	const emits = defineEmits<{
		edit: [toDoListItem: TItem]
		delete: [id: number]
		isDoneChanged: [id: number, forceValue?: boolean]
		stepToggled: []
		addToPlanner: [toDoListItem: TItem]
		logTime: [toDoListItem: TItem]
		itemClicked: [toDoListItem: TItem]
	}>()

	const i18n = useI18n()
	const { getBgColor } = useColor()

	const accentColor = computed(() => (color ? getBgColor(color) : undefined))

	const isDone = ref(toDoListItem.isDone)
	const doneCount = ref<number | null>(toDoListItem.doneCount)
	const localSteps = ref<TodoListItemStepEntity[]>([...toDoListItem.steps])

	watch(
		() => toDoListItem.isDone,
		val => {
			isDone.value = val
		},
	)
	watch(
		() => toDoListItem.doneCount,
		val => {
			doneCount.value = val
		},
	)
	watch(
		() => toDoListItem.steps,
		val => {
			localSteps.value = [...val]
		},
		{ deep: true },
	)

	const itemRef = ref<any>(null)
	const dragPreviewRef = ref<InstanceType<typeof DraggedItemPreview> | null>(null)

	useTodoItemDraggable({
		elementRef: itemRef,
		previewRef: dragPreviewRef,
		isInChangeOrderMode: () => isInChangeOrderMode,
		getData: () => ({
			itemId: toDoListItem.id,
			activityId: toDoListItem.activity.id,
			listId,
		}),
	})

	const actions = [
		new MenuItem('logTime', 'outlined', 'primaryOutline', 'clock', logTime),
		new MenuItem('addToPlanner', 'outlined', 'primaryOutline', 'calendar-plus', addToPlanner),
		new MenuItem('edit', 'outlined', 'secondaryOutline', 'pen-to-square', edit),
		new MenuItem('delete', 'tonal', 'secondaryOutline', 'trash-can', del),
	]

	function emitChanged(forceValue?: boolean) {
		emits('isDoneChanged', toDoListItem.id, forceValue)
	}

	function itemClicked(event: Event) {
		if (isInChangeOrderMode) {
			event.preventDefault()
			return
		}

		if (toDoListItem.isMultipleCount) {
			progressClicked()
			return
		}

		emits('itemClicked', { ...toDoListItem, isDone: isDone.value, doneCount: doneCount.value } as TItem)

		const oldIsDone = isDone.value
		isDone.value = !isDone.value
		if (oldIsDone !== isDone.value) {
			emitChanged()
		}
	}

	function minusClicked() {
		if (isInChangeOrderMode) return
		if (doneCount.value === null || doneCount.value <= 0) return
		doneCount.value--
		const oldIsDone = isDone.value
		if (isDone.value) {
			isDone.value = false
		}
		if (oldIsDone !== isDone.value) {
			emitChanged(false)
		}
	}

	function progressClicked() {
		if (isInChangeOrderMode) return
		emits('itemClicked', { ...toDoListItem, isDone: isDone.value, doneCount: doneCount.value } as TItem)
		if (doneCount.value === null || toDoListItem.totalCount === null) return
		if (doneCount.value >= toDoListItem.totalCount) return
		doneCount.value++
		const oldIsDone = isDone.value
		if (doneCount.value >= toDoListItem.totalCount) {
			isDone.value = true
		}
		if (oldIsDone !== isDone.value) {
			emitChanged()
		}
	}

	function actionButtonText(name: string) {
		return i18n.t(`general.${name}`)
	}

	function edit() {
		if (isInChangeOrderMode) return
		emits('edit', toDoListItem)
	}

	function del() {
		if (isInChangeOrderMode) return
		emits('delete', toDoListItem.id)
	}

	function addToPlanner() {
		emits('addToPlanner', toDoListItem)
	}

	function logTime() {
		emits('logTime', toDoListItem)
	}
</script>

<style scoped>
	.listItem {
		position: relative;
		border: 1px solid rgba(128, 128, 128, 0.18);
		border-radius: 5px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		background: rgba(255, 255, 255, 0.06);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
		padding: 10px 0;
		overflow: hidden;
	}

	.listItem.is-done {
		opacity: 0.55;
	}

	.priority-accent {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
	}

	.listItem:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
	}

	.listItem:has(.drag-handle) {
		cursor: grab;
	}

	.listItem:has(.drag-handle):active {
		cursor: grabbing;
	}

	.is-dragging {
		opacity: 0.4;
		z-index: 1;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.drag-handle {
		cursor: grab;
		opacity: 0;
		transition: all 0.2s ease;
	}

	.drag-handle:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.listItem:hover .drag-handle {
		opacity: 1;
		transform: scale(1.1);
	}
</style>
