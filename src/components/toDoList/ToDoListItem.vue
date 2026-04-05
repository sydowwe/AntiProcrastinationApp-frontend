<template>
	<VListItem
		ref="itemRef"
		:active="!toDoListItem.isDone"
		:color="color"
		variant="tonal"
		rounded
		class="align-center listItem"
		:class="{
			'is-dragging': isDragging,
			'is-overdue': isOverdue,
		}"
		@click="itemClicked"
	>
		<template #prepend>
			<VListItemAction start>
				<v-checkbox-btn
					v-if="!toDoListItem.isMultipleCount"
					v-model="isDone"
					baseColor="white"
					color="success"
					:disabled="isInChangeOrderMode"
					:style="isInChangeOrderMode ? 'color:white !important' : ''"
					@click.prevent
				></v-checkbox-btn>
				<div
					v-else
					class="d-flex flex-column ga-1 align-center justify-center"
				>
					<VHover>
						<template #default="{ isHovering, props: vHoverProps }">
							<VIconBtn
								v-if="isHovering"
								v-bind="vHoverProps"
								icon="minus"
								color="white"
								variant="tonal"
								width="40"
								height="35"
								@click.stop="minusClicked"
							>
								<VIcon size="22"></VIcon>
							</VIconBtn>
							<span
								v-else
								v-bind="vHoverProps"
								style="width: 40px"
								@click.stop="progressClicked"
							>
								<VProgressLinear
									color="neutral-400"
									:modelValue="((doneCount ?? 0) / (toDoListItem.totalCount ?? 1)) * 100"
									height="35"
									bgOpacity="0.3"
									style="border: 1px solid #777; border-radius: 4px"
								>
									<div class="d-flex align-center">
										<span
											v-if="!isDone"
											class="text-white"
										>
											{{ doneCount ?? 0 }}
										</span>
										<VIcon
											v-if="isDone"
											size="17"
											icon="check"
											color="success"
										></VIcon>
										<span class="text-white">/{{ toDoListItem.totalCount }}</span>
									</div>
								</VProgressLinear>
							</span>
						</template>
					</VHover>
				</div>
			</VListItemAction>
		</template>
		<VListItemTitle class="text-white">{{ toDoListItem.activity.name }}</VListItemTitle>
		<VListItemSubtitle class="text-white">{{ toDoListItem.activity.text }}</VListItemSubtitle>
		<VChip
			v-if="dueDateChip"
			:color="dueDateChip.color"
			size="x-small"
			variant="tonal"
			density="compact"
			prependIcon="calendar"
			class="mt-1"
		>
			{{ dueDateChip.label }}
		</VChip>
		<VChip
			v-if="toDoListItem.suggestedTime"
			size="x-small"
			variant="tonal"
			density="compact"
			prependIcon="hourglass-half"
			class="mt-1 ml-1"
		>
			{{ toDoListItem.suggestedTime.getNice }}
		</VChip>
		<span
			v-if="toDoListItem.note"
			class="text-caption text-medium-emphasis d-block mt-1"
			style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
		>
			{{ toDoListItem.note }}
		</span>
		<TodoListItemSteps
			v-if="localSteps.length > 0"
			:steps="localSteps"
			:itemId="toDoListItem.id"
			:kind
			:disabled="isInChangeOrderMode"
			class="mt-2"
			@stepToggled="onStepToggled"
		/>
		<template #append>
			<VIcon
				v-if="isSelected"
				icon="check-circle"
				color="#fff"
			></VIcon>

			<VTooltip
				v-if="itemStreak && itemStreak > 0 && !isInChangeOrderMode"
				location="top"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="d-flex align-center ga-1 mr-1"
						:class="gracePeriodActive ? 'text-warning' : 'text-white'"
					>
						<VIcon
							:icon="getMilestoneIcon(itemStreak) ?? 'fire-flame-curved'"
							size="14"
						></VIcon>
						<span
							class="text-caption"
							style="line-height: 1"
						>
							{{ itemStreak }}
						</span>
					</div>
				</template>
				<span>
					Streak: {{ itemStreak }} | Best: {{ itemBestStreak }}
					<span v-if="gracePeriodActive">| Grace period active!</span>
				</span>
			</VTooltip>

			<VIcon
				v-if="isInChangeOrderMode"
				class="drag-handle my-1"
				icon="bars"
				color="white"
				size="small"
				style="height: 40px"
			></VIcon>
			<v-menu
				v-else
				location="start"
				transition="slide-y-transition"
			>
				<template #activator="{ props: menuProps }">
					<VIconBtn
						icon="ellipsis-vertical"
						v-bind="menuProps"
						class="my-1"
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
			</v-menu>
		</template>
	</VListItem>

	<!-- Hidden drag preview template -->
	<DraggedItemPreview
		ref="dragPreviewRef"
		:toDoListItem
		:color
	/>
</template>

<script setup lang="ts" generic="TItem extends IBaseToDoListItem">
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useI18n } from 'vue-i18n'
	import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
	import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
	import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
	import DraggedItemPreview from '@/components/toDoList/dragAndDrop/DraggedItemPreview.vue'
	import type { IBaseToDoListItem } from '@/dtos/response/interface/IBaseToDoListItem.ts'
	import { MenuItem } from '@/dtos/dto/MenuAction.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import type { TodoListItemStepEntity } from '@/dtos/response/todoList/TodoListItemStepEntity.ts'
	import TodoListItemSteps from '@/components/toDoList/TodoListItemSteps.vue'

	const {
		toDoListItem,
		color,
		kind,
		isInChangeOrderMode = false,
		listId,
		isDragging = false,
		streakConfig,
	} = defineProps<{
		toDoListItem: TItem
		color: string
		kind: ToDoListKind
		isInChangeOrderMode?: boolean
		listId: number
		isDragging?: boolean
		streakConfig?: { graceDays: number; periodLengthInDays: number }
	}>()

	const emits = defineEmits<{
		edit: [toDoListItem: TItem]
		delete: [id: number]
		select: [id: number]
		unSelect: [id: number]
		isDoneChanged: [toDoListItem: TItem]
		addToPlanner: [toDoListItem: TItem]
	}>()

	const i18n = useI18n()

	const isSelected = ref(false)
	const isDone = ref(toDoListItem.isDone)
	const doneCount = ref<number | null>(toDoListItem.doneCount)
	const localSteps = ref<TodoListItemStepEntity[]>([...toDoListItem.steps])

	watch(
		() => toDoListItem.isDone,
		val => {
			isDone.value = val
			isSelected.value = false
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

	function onStepToggled(_stepId: number, allDone: boolean, updatedSteps: TodoListItemStepEntity[]) {
		localSteps.value = updatedSteps
		const isRepeat = toDoListItem.isMultipleCount

		if (allDone) {
			if (isRepeat) {
				localSteps.value = localSteps.value.map(s => ({ ...s, isDone: false }))
				doneCount.value = (doneCount.value ?? 0) + 1
				if (doneCount.value >= (toDoListItem.totalCount ?? 1)) isDone.value = true
			} else {
				isDone.value = true
			}
			emitChanged()
		} else {
			if (isDone.value) {
				isDone.value = false
				emitChanged()
			}
			doneCount.value = localSteps.value.filter(s => s.isDone).length
		}
	}

	const dueDateChip = computed(() => {
		const dueDate = (toDoListItem as any).dueDate as string | null | undefined
		if (!dueDate) return null
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const due = new Date(dueDate + 'T00:00:00')
		const tomorrow = new Date(today)
		tomorrow.setDate(today.getDate() + 1)
		const isOverdue = due < today && !toDoListItem.isDone
		const isToday = due.getTime() === today.getTime()
		const isTomorrow = due.getTime() === tomorrow.getTime()
		let label = isToday
			? 'Today'
			: isTomorrow
				? 'Tomorrow'
				: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
		const dueTime = (toDoListItem as any).dueTime as Time | null | undefined
		if (dueTime) label += ' ' + Time.getString(dueTime)
		return { label, color: isOverdue ? 'error' : isToday ? 'warning' : undefined }
	})

	const isOverdue = computed(() => {
		const dueDate = (toDoListItem as any).dueDate as string | null | undefined
		if (!dueDate || toDoListItem.isDone) return false
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		return new Date(dueDate + 'T00:00:00') < today
	})

	const itemStreak = computed(() => (toDoListItem as any).streak as number | undefined)
	const itemBestStreak = computed(() => (toDoListItem as any).bestStreak as number | undefined)
	const lastCompletedAt = computed(() => (toDoListItem as any).lastCompletedAt as string | null | undefined)

	const gracePeriodActive = computed(() => {
		if (!streakConfig || !lastCompletedAt.value || !itemStreak.value) return false
		const { graceDays, periodLengthInDays } = streakConfig
		if (graceDays <= 0) return false
		const lastDone = new Date(lastCompletedAt.value)
		const now = new Date()
		const daysSince = Math.floor((now.getTime() - lastDone.getTime()) / (1000 * 60 * 60 * 24))
		return daysSince >= periodLengthInDays && daysSince < periodLengthInDays + graceDays
	})

	function getMilestoneIcon(streak: number): string | null {
		if (streak >= 365) return 'crown'
		if (streak >= 180) return 'gem'
		if (streak >= 90) return 'trophy'
		if (streak >= 30) return 'star'
		if (streak >= 7) return 'fire-flame-curved'
		return null
	}

	const itemRef = ref<any>(null)
	const dragPreviewRef = ref<InstanceType<typeof DraggedItemPreview> | null>(null)

	let cleanup: (() => void) | null = null

	// Setup draggable functionality
	onMounted(() => {
		setupDraggable()
	})

	onBeforeUnmount(() => {
		if (cleanup) {
			cleanup()
		}
	})

	watch(
		() => isInChangeOrderMode,
		newValue => {
			if (cleanup) {
				cleanup()
				cleanup = null
			}

			if (newValue) {
				setupDraggable()
			}
		},
	)

	const setupDraggable = () => {
		if (!isInChangeOrderMode) return

		const element = itemRef.value?.$el || itemRef.value
		if (!element) return

		cleanup = draggable({
			element,
			getInitialData: () => ({
				type: 'todo-item',
				itemId: toDoListItem.id,
				activityId: toDoListItem.activity.id,
				listId: listId,
			}),
			onGenerateDragPreview: ({ nativeSetDragImage }) => {
				const previewElement = dragPreviewRef.value?.$el
				if (previewElement) {
					setCustomNativeDragPreview({
						nativeSetDragImage,
						getOffset: pointerOutsideOfPreview({
							x: '16px',
							y: '8px',
						}),
						render: ({ container }) => {
							// Clone the preview element
							const clonedPreview = previewElement.cloneNode(true) as HTMLElement
							clonedPreview.style.display = 'block'

							console.log(clonedPreview.style)
							console.log(container.style)
							container.appendChild(clonedPreview)

							return () => {
								container.removeChild(clonedPreview)
							}
						},
					})
				}
			},
		})
	}

	const actions = [
		new MenuItem('select', 'tonal', 'primaryOutline', 'check-circle', toggleSelect),
		new MenuItem('edit', 'outlined', 'primaryOutline', 'pen-to-square', edit),
		new MenuItem('addToPlanner', 'outlined', 'primaryOutline', 'calendar-plus', addToPlanner),
		new MenuItem('delete', 'outlined', 'secondaryOutline', 'trash-can', del),
	]

	function emitChanged() {
		emits('isDoneChanged', { ...toDoListItem, isDone: isDone.value, doneCount: doneCount.value } as TItem)
	}

	function itemClicked(event: Event) {
		if (isInChangeOrderMode) {
			event.preventDefault()
			return
		}

		isDone.value = !isDone.value
		if (isDone.value && localSteps.value.some(s => !s.isDone)) {
			localSteps.value = localSteps.value.map(s => ({ ...s, isDone: true }))
			doneCount.value = localSteps.value.length
		}
		emitChanged()
	}

	function minusClicked(event: Event) {
		if (isInChangeOrderMode) {
			event.preventDefault()
			return
		}
		if (doneCount.value === null || doneCount.value <= 0) return
		doneCount.value--
		if (isDone.value) {
			isDone.value = false
			emitChanged()
		}
	}

	function progressClicked(event: Event) {
		if (isInChangeOrderMode) {
			event.preventDefault()
			return
		}
		if (doneCount.value === null || toDoListItem.totalCount === null) return
		if (doneCount.value >= toDoListItem.totalCount) return
		doneCount.value++
		if (doneCount.value >= toDoListItem.totalCount) {
			isDone.value = true
			emitChanged()
		}
	}

	function actionButtonText(name: string) {
		return i18n.t(isSelected.value && name === 'select' ? `general.un${name}` : `general.${name}`)
	}

	function edit() {
		if (isInChangeOrderMode) return

		emits('edit', toDoListItem)
		isSelected.value = false
	}

	function del() {
		if (isInChangeOrderMode) return

		emits('delete', toDoListItem.id)
		isSelected.value = false
	}

	function addToPlanner() {
		emits('addToPlanner', toDoListItem)
	}

	function toggleSelect() {
		if (isInChangeOrderMode) return

		isSelected.value = !isSelected.value
		if (isSelected.value) {
			emits('select', toDoListItem.id)
		} else {
			emits('unSelect', toDoListItem.id)
		}
	}
</script>

<style scoped>
	.listItem {
		border: 2px solid black !important;
		border-radius: 5px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		backdrop-filter: blur(4px);
		background: rgba(var(--v-theme-surface), 0.8);
	}

	.listItem:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.listItem:has(.drag-handle) {
		cursor: grab;
	}

	.listItem:has(.drag-handle):active {
		cursor: grabbing;
	}

	.listItem.is-overdue {
		border-color: rgb(var(--v-theme-error)) !important;
	}

	.is-dragging {
		opacity: 0.4;
		z-index: 1;
		border-color: rgba(var(--v-theme-primary), 0.5) !important;
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
