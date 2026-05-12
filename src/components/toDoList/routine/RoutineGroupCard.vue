<template>
	<VCard class="h-100 rounded-lg px-3 px-md-4 pt-4 pb-2 d-flex flex-column">
		<RoutinePeriodTimeline :timePeriod="group.timePeriod" />
		<RoutineGroupStats
			:timePeriod="group.timePeriod"
			:items="group.items"
		/>
		<div class="h-100">
			<div
				v-if="isAllDoneHidden"
				class="d-flex flex-column align-center justify-center h-100 ga-2 text-medium-emphasis py-6"
			>
				<VIcon
					icon="circle-check"
					size="36"
					color="success"
					opacity="0.6"
				/>
				<span class="text-body-2">{{ $t('routineTodoList.allDone') }}</span>
			</div>
			<BaseToDoList
				v-else
				class="h-100"
				:kind="ToDoListKind.ROUTINE"
				:items="visibleItems"
				:allItems="group.items"
				:isInChangeOrderMode
				:listId="group.timePeriod.id"
				:activityIds="group.items.map(item => item.activity.id)"
				@itemsReordered="(oldIndex, newIndex, request) => emit('itemsReordered', oldIndex, newIndex, request)"
				@crossListDrop="(sourceId, targetId, itemId, dropTarget) => emit('crossListDrop', sourceId, targetId, itemId, dropTarget)"
			>
				<template #default="{ item, isDragging }">
					<RoutineTodoListItem
						:toDoListItem="item as RoutineTodoListItemEntity"
						:isInChangeOrderMode
						:listId="group.timePeriod.id"
						:isDragging
						:streakConfig="{
							graceDays: group.timePeriod.streakGraceDays,
							periodLengthInDays: group.timePeriod.lengthInDays,
						}"
						@delete="id => emit('delete', id)"
						@edit="item => emit('edit', item)"
						@isDoneChanged="(id, val) => emit('isDoneChanged', id, val)"
						@stepToggled="ids => emit('stepToggled', ids)"
						@addToPlanner="item => emit('addToPlanner', item)"
						@logTime="item => emit('logTime', item, false)"
						@itemClicked="item => emit('logTime', item, true)"
					/>
				</template>
			</BaseToDoList>
		</div>
		<div class="pl-2 pt-2 d-flex ga-3">
			<VSwitch
				v-model="hideDone"
				:label="$t('routineTodoList.hideDone')"
				density="compact"
				hideDetails
				color="secondary-accent"
				:disabled="isInChangeOrderMode"
			/>
			<RoutineGroupHeatmap
				:history="group.timePeriod.completionHistory"
				:lengthInDays="group.timePeriod.lengthInDays"
				clickable
				class="flex-fill pa-1"
				style="border: 1px solid rgb(var(--v-border-color)); border-radius: 4px"
				@click="emit('openHistory', group.timePeriod)"
			/>
		</div>
	</VCard>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import type { RoutineTodoListGroupedList } from '@/dtos/response/todoList/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import BaseToDoList from '@/components/toDoList/BaseToDoList.vue'
	import RoutineTodoListItem from '@/components/toDoList/routine/RoutineTodoListItem.vue'
	import RoutineGroupHeatmap from '@/components/toDoList/routine/RoutineGroupHeatmap.vue'
	import RoutinePeriodTimeline from '@/components/toDoList/routine/RoutinePeriodTimeline.vue'
	import RoutineGroupStats from '@/components/toDoList/routine/RoutineGroupStats.vue'

	const { group, isInChangeOrderMode } = defineProps<{
		group: RoutineTodoListGroupedList
		isInChangeOrderMode: boolean
	}>()

	const hideDone = defineModel<boolean>('hideDone', { default: false })

	const emit = defineEmits<{
		logTime: [item: RoutineTodoListItemEntity, isManual: boolean]
		addToPlanner: [item: RoutineTodoListItemEntity]
		delete: [id: number]
		edit: [item: RoutineTodoListItemEntity]
		isDoneChanged: [id: number, forceValue: boolean]
		stepToggled: [changedItems: number[]]
		itemsReordered: [oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest]
		crossListDrop: [sourceListId: number, targetListId: number, itemId: number, dropTarget: any]
		openHistory: [timePeriod: RoutineTimePeriodEntity]
	}>()

	const isAllDoneHidden = computed(
		() => hideDone.value && group.items.length > 0 && group.items.every(item => item.isDone),
	)

	const visibleItems = computed(() => (hideDone.value ? group.items.filter(item => !item.isDone) : [...group.items]))
</script>
