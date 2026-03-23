<template>
<VListItem
	ref="itemRef"
	:active="!toDoListItem.isDone"
	@click="itemClicked"
	:color="color"
	variant="tonal"
	rounded
	class="align-center listItem"
	:class="{
        'is-dragging': isDragging,
    }"
>
	<template v-slot:prepend>

		<VListItemAction start>
			<v-checkbox-btn v-if="!toDoListItem.isMultipleCount" v-model="toDoListItem.isDone" base-color="white" color="success"
			                @click.prevent :disabled="isInChangeOrderMode"
			                :style="isInChangeOrderMode ? 'color:white !important' : ''"></v-checkbox-btn>
			<div v-else class="d-flex flex-column ga-1 align-center justify-center">
				<VHover>
					<template v-slot:default="{ isHovering, props }">
						<VIconBtn v-bind="props" v-if="isHovering" icon="minus" color="white" variant="tonal" width="40" height="35" @click.stop="minusClicked">
							<VIcon size="22"></VIcon>
						</VIconBtn>
						<span v-else
						      v-bind="props" style="width: 40px" @click.stop="progressClicked">
                            <VProgressLinear
	                            color="neutral-400"
	                            :model-value="(toDoListItem.doneCount ?? 0) / (toDoListItem.totalCount ?? 1) * 100"
	                            height="35"
	                            bgOpacity="0.3"
	                            style="border: 1px solid #777; border-radius: 4px;"
                            >
                                <div class="d-flex align-center">
                                    <span v-if="!toDoListItem.isDone" class="text-white">{{ toDoListItem.doneCount ?? 0 }}</span>
                                    <VIcon v-if="toDoListItem.isDone" size="17" icon="check" color="success"></VIcon>
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
	>{{ dueDateChip.label }}</VChip>
	<span v-if="toDoListItem.note" class="text-caption text-medium-emphasis d-block mt-1">{{ toDoListItem.note }}</span>
	<template v-slot:append>
		<VIcon v-if="isSelected" icon="check-circle" color="#fff">
		</VIcon>

		<VTooltip v-if="itemStreak && itemStreak > 0 && !isInChangeOrderMode" location="top">
			<template v-slot:activator="{ props: tooltipProps }">
				<div v-bind="tooltipProps" class="d-flex align-center ga-1 mr-1" :class="gracePeriodActive ? 'text-warning' : 'text-white'">
					<VIcon :icon="getMilestoneIcon(itemStreak) ?? 'fire-flame-curved'" size="14"></VIcon>
					<span class="text-caption" style="line-height: 1">{{ itemStreak }}</span>
				</div>
			</template>
			<span>Streak: {{ itemStreak }} | Best: {{ itemBestStreak }}<span v-if="gracePeriodActive"> | Grace period active!</span></span>
		</VTooltip>

		<VIcon v-if="isInChangeOrderMode" class="drag-handle my-1" icon="bars" color="white" size="small" style="height: 40px"></VIcon>
		<v-menu v-else location="start" transition="slide-y-transition">
			<template v-slot:activator="{ props }">
				<VIconBtn icon="ellipsis-vertical" v-bind="props" class="my-1" color="white" variant="text" size="40" @click.stop=""></VIconBtn>
			</template>
			<VList>
				<VListItem class="px-3" v-for="(item, i) in actions" :key="i">
					<VBtn class="px-3" :color="item.color" :variant="item.variant" :append-icon="item.icon" width="100%" @click="item.action">
						{{ actionButtonText(item.name) }}
					</VBtn>
				</VListItem>
			</VList>
		</v-menu>

	</template>
</VListItem>

<!-- Hidden drag preview template -->
<DraggedItemPreview ref="dragPreviewRef" :toDoListItem :color/>
</template>

<script setup lang="ts" generic="TItem extends IBaseToDoListItem">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {Time} from '@/dtos/dto/Time.ts';
import {useI18n} from 'vue-i18n';
import {draggable} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {setCustomNativeDragPreview} from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import {pointerOutsideOfPreview} from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import DraggedItemPreview from '@/components/toDoList/dragAndDrop/DraggedItemPreview.vue';
import type {IBaseToDoListItem} from '@/dtos/response/interface/IBaseToDoListItem.ts';
import {MenuItem} from '@/dtos/dto/MenuAction.ts';

const i18n = useI18n();

const props = withDefaults(defineProps<{
	toDoListItem: TItem;
	color: string;
	isInChangeOrderMode?: boolean;
	listId: number;
	isDragging?: boolean;
	streakConfig?: { graceDays: number; periodLengthInDays: number };
}>(), {
	isInChangeOrderMode: false,
	isDragging: false,
	streakConfig: undefined,
});

const dueDateChip = computed(() => {
	const dueDate = (props.toDoListItem as any).dueDate as string | null | undefined;
	if (!dueDate) return null;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(dueDate + 'T00:00:00');
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	const isOverdue = due < today && !props.toDoListItem.isDone;
	const isToday = due.getTime() === today.getTime();
	const isTomorrow = due.getTime() === tomorrow.getTime();
	let label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : due.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
	const dueTime = (props.toDoListItem as any).dueTime as Time | null | undefined;
	if (dueTime) label += ' ' + Time.getString(dueTime);
	return {label, color: isOverdue ? 'error' : isToday ? 'warning' : undefined};
});

const itemStreak = computed(() => (props.toDoListItem as any).streak as number | undefined);
const itemBestStreak = computed(() => (props.toDoListItem as any).bestStreak as number | undefined);
const lastCompletedAt = computed(() => (props.toDoListItem as any).lastCompletedAt as string | null | undefined);

const gracePeriodActive = computed(() => {
	if (!props.streakConfig || !lastCompletedAt.value || !itemStreak.value) return false;
	const {graceDays, periodLengthInDays} = props.streakConfig;
	if (graceDays <= 0) return false;
	const lastDone = new Date(lastCompletedAt.value);
	const now = new Date();
	const daysSince = Math.floor((now.getTime() - lastDone.getTime()) / (1000 * 60 * 60 * 24));
	return daysSince >= periodLengthInDays && daysSince < periodLengthInDays + graceDays;
});

function getMilestoneIcon(streak: number): string | null {
	if (streak >= 365) return 'crown';
	if (streak >= 180) return 'gem';
	if (streak >= 90) return 'trophy';
	if (streak >= 30) return 'star';
	if (streak >= 7) return 'fire-flame-curved';
	return null;
}

const emits = defineEmits<{
	edit: [toDoListItem: TItem];
	delete: [id: number];
	select: [id: number];
	unSelect: [id: number];
	isDoneChanged: [toDoListItem: TItem];
}>();

const isSelected = ref(false);
const itemRef = ref<any>(null);
const dragPreviewRef = ref<InstanceType<typeof DraggedItemPreview> | null>(null);

let cleanup: (() => void) | null = null;

// Setup draggable functionality
onMounted(() => {
	setupDraggable();
});

onBeforeUnmount(() => {
	if (cleanup) {
		cleanup();
	}
});

watch(() => props.isInChangeOrderMode, (newValue) => {
	if (cleanup) {
		cleanup();
		cleanup = null;
	}

	if (newValue) {
		setupDraggable();
	}
});

const setupDraggable = () => {
	if (!props.isInChangeOrderMode) return;

	const element = itemRef.value?.$el || itemRef.value;
	if (!element) return;

	cleanup = draggable({
		element,
		getInitialData: () => ({
			type: 'todo-item',
			itemId: props.toDoListItem.id,
			activityId: props.toDoListItem.activity.id,
			listId: props.listId,
		}),
		onGenerateDragPreview: ({nativeSetDragImage}) => {
			const previewElement = dragPreviewRef.value?.$el;
			if (previewElement) {
				setCustomNativeDragPreview({
					nativeSetDragImage,
					getOffset: pointerOutsideOfPreview({
						x: '16px',
						y: '8px',
					}),
					render: ({container}) => {
						// Clone the preview element
						const clonedPreview = previewElement.cloneNode(true) as HTMLElement;
						clonedPreview.style.display = 'block';


						console.log(clonedPreview.style)
						console.log(container.style)
						container.appendChild(clonedPreview);

						return () => {
							container.removeChild(clonedPreview);
						};
					},
				});
			}
		},
	});
};

const actions = [
	new MenuItem('select', 'tonal', 'primaryOutline', 'check-circle', toggleSelect),
	new MenuItem('edit', 'outlined', 'primaryOutline', 'pen-to-square', edit),
	new MenuItem('delete', 'outlined', 'secondaryOutline', 'trash-can', del),
];

function itemClicked(event: Event) {
	if (props.isInChangeOrderMode) {
		event.preventDefault();
		return;
	}

	props.toDoListItem.isDone = !props.toDoListItem.isDone;
	emits('isDoneChanged', props.toDoListItem);
}


function minusClicked(event: Event) {
	if (props.isInChangeOrderMode) {
		event.preventDefault();
		return;
	}
	if (props.toDoListItem.doneCount === null || props.toDoListItem.doneCount <= 0) return;
	props.toDoListItem.doneCount--;
	if (props.toDoListItem.isDone) {
		props.toDoListItem.isDone = false;
		emits('isDoneChanged', props.toDoListItem);
	}
}

function progressClicked(event: Event) {
	if (props.isInChangeOrderMode) {
		event.preventDefault();
		return;
	}
	if (props.toDoListItem.doneCount === null || props.toDoListItem.totalCount === null) return;
	if (props.toDoListItem.doneCount >= props.toDoListItem.totalCount) return;
	props.toDoListItem.doneCount++;
	if (props.toDoListItem.doneCount >= props.toDoListItem.totalCount) {
		props.toDoListItem.isDone = true;
		emits('isDoneChanged', props.toDoListItem);
	}
}

watch(
	() => props.toDoListItem.isDone,
	() => {
		isSelected.value = false;
	}
);

function actionButtonText(name: string) {
	return i18n.t(isSelected.value && name === 'select' ? `general.un${name}` : `general.${name}`);
}

function edit() {
	if (props.isInChangeOrderMode) return;

	emits('edit', props.toDoListItem);
	isSelected.value = false;
}

function del() {
	if (props.isInChangeOrderMode) return;

	emits('delete', props.toDoListItem.id);
	isSelected.value = false;
}

function toggleSelect() {
	if (props.isInChangeOrderMode) return;

	isSelected.value = !isSelected.value;
	if (isSelected.value) {
		emits('select', props.toDoListItem.id);
	} else {
		emits('unSelect', props.toDoListItem.id);
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