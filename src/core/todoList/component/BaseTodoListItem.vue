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
					:aria-label="i18n.t('toDoList.markDone', { name: toDoListItem.activity.name })"
					:style="isInChangeOrderMode ? 'color:white !important' : ''"
					@click.prevent.stop="checkboxClicked"
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

			<!-- `min-width: 0` lets this column shrink below its content so the chip row wraps instead of
			     running past the card edge (a daily routine with all seven weekday chips at four columns). -->
			<div
				class="flex-fill"
				style="min-width: 0"
			>
				<div class="d-flex flex-wrap ga-1 align-center">
					<slot
						name="pre-chips"
						:isInChangeOrderMode
					/>
					<VTooltip
						v-if="toDoListItem.suggestedTime?.isNotZero()"
						:disabled="!actualTooltip"
						location="top"
					>
						<template #activator="{ props: tooltipProps }">
							<VChip
								v-bind="tooltipProps"
								size="x-small"
								variant="tonal"
								color="neutral-600"
								prependIcon="clock"
							>
								<!-- trim: `getNice` pads a missing part with a space, which read as "~ 10m". -->
								~{{ toDoListItem.suggestedTime!.getNice.trim() }}
								<template v-if="actualTime">&nbsp;/ {{ actualTime.getNice.trim() }}</template>
							</VChip>
						</template>
						<span v-if="actualTooltip">{{ actualTooltip }}</span>
					</VTooltip>
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
					size="small"
					style="height: 40px"
				></VIcon>
				<div
					v-else
					class="d-flex align-center ga-2"
				>
					<VIconBtn
						icon="stopwatch"
						color="white"
						variant="text"
						size="40"
						:title="i18n.t('toDoList.quickStartTimer')"
						:aria-label="i18n.t('toDoList.quickStartTimer')"
						@click.stop="quickStartTimer"
					/>
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
								:title="i18n.t('general.moreActions')"
								:aria-label="`${i18n.t('general.moreActions')}: ${toDoListItem.activity.name}`"
								@click.stop=""
							></VIconBtn>
						</template>
						<VList>
							<VListItem
								v-for="(item, i) in [...actions, ...additionalActions]"
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
			@stepToggled="emits('stepToggled', toDoListItem.id)"
		/>
		<!-- Full width under the row, like the steps: inside the title column it was squeezed between the
		     checkbox and the action buttons. -->
		<slot
			name="below"
			:isInChangeOrderMode
		/>
		<div
			v-if="itemProgress !== null"
			class="item-progress-track"
		>
			<div
				class="item-progress-fill"
				:style="{ width: `${itemProgress * 100}%`, background: accentColor ?? 'rgb(var(--v-theme-primary))' }"
			/>
		</div>
		<!-- Hidden drag preview template -->
		<DraggedItemPreview
			ref="dragPreviewRef"
			:toDoListItem
			:color="color ?? undefined"
		/>
	</VListItem>
</template>

<script setup lang="ts" generic="TItem extends IBaseToDoListItem">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import DraggedItemPreview from '@/core/todoList/component/dragAndDrop/DraggedItemPreview.vue'
	import type { IBaseToDoListItem } from '@/core/todoList/dto/response/interface/IBaseToDoListItem.ts'
	import { MenuItem } from '@/_common/dto/dto/MenuAction.ts'
	import type { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import type { TodoListItemStepEntity } from '@/core/todoList/dto/response/TodoListItemStepEntity.ts'
	import BaseTodoListItemSteps from '@/core/todoList/component/BaseTodoListItemSteps.vue'
	import TodoListItemCounter from '@/core/todoList/component/TodoListItemCounter.vue'
	import { useTodoItemDraggable } from '@/core/todoList/composable/dragAndDrop/useTodoItemDraggable.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const {
		toDoListItem,
		color = null,
		kind,
		isInChangeOrderMode = false,
		listId,
		isDragging = false,
		additionalActions = [],
		actualTime = null,
		actualTooltip = null,
	} = defineProps<{
		toDoListItem: TItem
		color?: string | null
		kind: ToDoListKind
		isInChangeOrderMode?: boolean
		listId: number
		isDragging?: boolean
		additionalActions?: MenuItem[]
		/**
		 * Shown after the estimate on its chip ("~30m / 45m"). What it means is the wrapper's call: time logged
		 * against a to-do item, or the activity's usual sitting for a routine item until F2-06.
		 */
		actualTime?: Time | null
		/** The estimate chip's tooltip, saying what `actualTime` is. No tooltip without it. */
		actualTooltip?: string | null
	}>()

	const emits = defineEmits<{
		edit: [toDoListItem: TItem]
		delete: [id: number]
		isDoneChanged: [id: number, forceValue?: boolean]
		stepToggled: [id: number]
		addToPlanner: [toDoListItem: TItem]
		logTime: [toDoListItem: TItem]
		quickStartTimer: [toDoListItem: TItem]
		itemClicked: [toDoListItem: TItem]
	}>()

	const i18n = useI18n()
	const { getBgColor } = useColor()

	const accentColor = computed(() => (color ? getBgColor(color) : undefined))

	const itemProgress = computed(() => {
		if (toDoListItem.isMultipleCount && toDoListItem.totalCount) {
			return doneCount.value !== null ? Math.min(doneCount.value / toDoListItem.totalCount, 1) : null
		}
		if (localSteps.value.length > 0) {
			return localSteps.value.filter(step => step.isDone).length / localSteps.value.length
		}
		return null
	})

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

	function toggleDone() {
		const oldIsDone = isDone.value
		isDone.value = !isDone.value
		if (oldIsDone !== isDone.value) {
			emitChanged()
		}
	}

	// The checkbox is `@click.prevent`, which cancels the native toggle — so its `v-model` never fires and
	// this is the only thing that flips `isDone` for a checkbox click. It must therefore keep doing the
	// toggle; all it must *not* do is report an `itemClicked`, which every view wires to the manual
	// log-time dialog. Hence a handler of its own rather than letting the click bubble to `itemClicked`.
	function checkboxClicked() {
		if (isInChangeOrderMode) return
		toggleDone()
	}

	function itemClicked(event: Event) {
		if (isInChangeOrderMode) {
			event.preventDefault()
			return
		}

		// `itemClicked` means "the user clicked the row body", which is the gesture the views treat as
		// "log time against this task". The counter has buttons of its own for its two steps, so a
		// counted item's row body does *not* also step the counter — that pairing is what popped the
		// log-time dialog over every increment (the multi-count twin of the checkbox bug above).
		emits('itemClicked', { ...toDoListItem, isDone: isDone.value, doneCount: doneCount.value } as TItem)

		if (toDoListItem.isMultipleCount) return

		toggleDone()
	}

	// For a counted item the server's `toggle-is-done` with a `forceValue` is one step of the counter
	// (`true` = +1, `false` = −1, clamped and flipping `isDone` at the ends), so every step is reported,
	// not only the one that flips `isDone` — reporting only the flip left every intermediate count
	// local and lost on the next reload. The local change is the optimistic half; the view's resync
	// after the call brings back whatever the server settled on.
	function minusClicked() {
		if (isInChangeOrderMode) return
		if (doneCount.value === null || doneCount.value <= 0) return
		doneCount.value--
		isDone.value = false
		emitChanged(false)
	}

	function progressClicked() {
		if (isInChangeOrderMode) return
		if (doneCount.value === null || toDoListItem.totalCount === null) return
		if (doneCount.value >= toDoListItem.totalCount) return
		doneCount.value++
		if (doneCount.value >= toDoListItem.totalCount) {
			isDone.value = true
		}
		emitChanged(true)
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

	function quickStartTimer() {
		emits('quickStartTimer', toDoListItem)
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

	/* A touch screen has no hover, so reorder mode would show nothing to drag (as in TodoListCategoryPanel). */
	@media (hover: none) {
		.drag-handle {
			opacity: 1;
		}
	}

	.item-progress-track {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		background: rgba(255, 255, 255, 0.08);
	}

	.item-progress-fill {
		height: 100%;
		transition: width 0.2s ease;
	}
</style>
