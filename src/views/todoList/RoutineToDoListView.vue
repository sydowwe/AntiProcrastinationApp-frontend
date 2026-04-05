<template>
	<div class="h-100 pb-4 pt-5 w-100 d-flex flex-column">
		<div
			class="mx-auto w-100 w-md-33 d-flex flex-column ga-3 pb-3 bg-background position-sticky px-3"
			style="top: 0; z-index: 1"
		>
			<div class="d-flex ga-3 align-center">
				<VBtn
					to="/routine-settings"
					prependIcon="gear"
					variant="tonal"
					color="secondaryOutline"
				>
					{{ $t('routineTodoList.settings') }}
				</VBtn>
				<VSelect
					:modelValue="visibleGroupIds"
					:items="groupSelectItems"
					:label="$t('routineTodoList.groups')"
					multiple
					chips
					density="compact"
					hideDetails
					@update:modelValue="onGroupSelectUpdate"
				></VSelect>
			</div>
			<div class="d-flex ga-3">
				<VBtn
					class="flex-grow-1"
					color="primary"
					prependIcon="plus"
					:disabled="isInChangeOrderMode"
					@click="toDoListDialog?.openCreate()"
				>
					{{ $t('toDoList.add') }}
				</VBtn>
				<VBtn
					:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
					:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
					appendIcon="arrows-up-down"
					@click="toggleChangeOrderMode"
				>
					{{ $t('routineTodoList.reorder') }}
				</VBtn>
			</div>
		</div>
		<VRow
			class="flex-grow-1 overflow-hidden ma-0"
			style="min-height: 0"
			justify="center"
		>
			<VCol
				v-for="group in visibleGroups"
				:key="group.timePeriod.id"
				class="pa-2 h-100"
				cols="12"
				:sm="visibleGroups.length >= 2 ? 6 : undefined"
				:md="visibleGroups.length >= 3 ? 4 : undefined"
				:lg="visibleGroups.length >= 4 ? 3 : undefined"
			>
				<VCard class="h-100 rounded-lg px-3 px-md-4 py-4 d-flex flex-column ga-3">
					<div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px">
						<div class="d-flex flex-column ga-1">
							<div
								v-if="group.timePeriod.streak > 0"
								class="d-flex align-center ga-1"
							>
								<VIcon
									icon="fire-flame-curved"
									size="15"
									:color="
										group.timePeriod.streak >= group.timePeriod.bestStreak ? 'warning' : undefined
									"
								></VIcon>
								<span class="text-body-2 font-weight-bold">{{ group.timePeriod.streak }}</span>
								<span class="text-caption opacity-60">/ {{ group.timePeriod.bestStreak }}</span>
							</div>
							<div class="d-flex align-center ga-2 flex-wrap">
								<span
									v-if="group.timePeriod.totalPeriodsElapsed > 0"
									class="text-caption font-weight-bold"
									:class="consistencyColor(group.timePeriod)"
								>
									{{ consistencyPct(group.timePeriod) }}%
								</span>
								<VChip
									v-if="isAtRisk(group)"
									color="warning"
									size="x-small"
									prependIcon="triangle-exclamation"
									class="text-black font-weight-bold"
								>
									{{ $t('routineTodoList.daysLeft', { days: daysUntilReset(group.timePeriod) }) }}
								</VChip>
							</div>
						</div>

						<div class="d-flex flex-column ga-1">
							<VSheet
								class="px-3 py-1 d-flex align-center ga-2"
								rounded
								:style="{ backgroundColor: getBgColor(group.timePeriod.color) }"
							>
								<VCardTitle class="px-0 py-0">{{ group.timePeriod.text }}</VCardTitle>
								<span class="text-caption text-white opacity-70">{{ group.timePeriod.lengthInDays }}d</span>
							</VSheet>
							<VProgressLinear
								:modelValue="groupProgressMap.get(group.timePeriod.id as number)?.done ?? 0"
								:max="groupProgressMap.get(group.timePeriod.id as number)?.total ?? 1"
								rounded="sm"
								height="14"
								color="secondary-accent"
							>
								<span
									class="position-absolute w-100 text-center font-weight-bold text-white"
									style="font-size: 10px"
								>
									{{ groupProgressMap.get(group.timePeriod.id as number)?.total
										? Math.round(((groupProgressMap.get(group.timePeriod.id as number)?.done ?? 0) / (groupProgressMap.get(group.timePeriod.id as number)?.total ?? 1)) * 100)
										: 0 }}%
								</span>
							</VProgressLinear>
						</div>

						<div class="d-flex justify-end">
							<VSwitch
								v-model="hideDoneGroupIds"
								:value="group.timePeriod.id"
								:label="$t('routineTodoList.hideDone')"
								density="compact"
								hideDetails
								color="secondary-accent"
								:disabled="isInChangeOrderMode"
							></VSwitch>
						</div>
					</div>

					<div
						class="flex-grow-1 overflow-y-auto"
						style="min-height: 0"
					>
						<ToDoList
							:kind="ToDoListKind.ROUTINE"
							:items="visibleItems(group)"
							:allItems="group.items"
							:isInChangeOrderMode="isInChangeOrderMode"
							:listId="group.timePeriod.id as number"
							:activityIds="group.items.map(item => item.activity.id)"
							:streakConfig="{
								graceDays: group.timePeriod.streakGraceDays,
								periodLengthInDays: group.timePeriod.lengthInDays,
							}"
							@itemsChanged="onItemsChanged"
							@editItem="toDoListDialog?.openEdit"
							@deletedItem="onDelete"
							@itemsReordered="
								(oldIndex, newIndex, request) =>
									handleOrderChange(oldIndex, newIndex, request, group.timePeriod.id as number)
							"
							@crossListDrop="handleCrossListDrop"
						></ToDoList>
					</div>
				</VCard>
			</VCol>
		</VRow>
	</div>
	<RoutineToDoListDialog
		ref="toDoListDialog"
		@add="add"
		@edit="edit"
	></RoutineToDoListDialog>
</template>
<script setup lang="ts">
	import RoutineToDoListDialog from '../../components/dialogs/toDoList/RoutineToDoListDialog.vue'
	import ToDoList from '../../components/toDoList/ToDoList.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts'
	import type { RoutineTodoListGroupedList } from '@/dtos/response/todoList/RoutineTodoListGroupedList.ts'
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { useRoutineTimePeriodCrud } from '@/api/routineTodoList/timePeriodApi.ts'
	import { useRoutineTodoListItemCrud } from '@/api/routineTodoList/routineTodoListApi.ts'
	import { hasObjectChanged } from '@/utils/helperMethods.ts'
	import { useColor } from '@/utils/colorPalette.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'

	const route = useRoute()
	const router = useRouter()
	const { getBgColor } = useColor()
	const { fetchById, createWithResponse, update, deleteEntity, getAllGrouped, changeDisplayOrder } =
		useRoutineTodoListItemCrud()
	const { changeTimePeriodVisibility } = useRoutineTimePeriodCrud()

	const groupedItems = ref([] as RoutineTodoListGroupedList[])
	const toDoListDialog = ref<InstanceType<typeof RoutineToDoListDialog>>()
	const isInChangeOrderMode = ref(false)

	const hideDoneGroupIds = computed({
		get: (): number[] => {
			const val = route.query.hideDone
			if (!val) return []
			return (Array.isArray(val) ? val : [val]).map(Number)
		},
		set: (val: number[]) =>
			router.replace({ query: { ...route.query, hideDone: val.length ? val.map(String) : undefined } }),
	})

	const groupSelectItems = computed(() =>
		groupedItems.value.map(g => ({ title: g.timePeriod.text, value: g.timePeriod.id as number })),
	)

	const visibleGroupIds = computed(() =>
		groupedItems.value.filter(g => !g.timePeriod.isHidden).map(g => g.timePeriod.id as number),
	)

	const visibleGroups = computed(() => groupedItems.value.filter(g => !g.timePeriod.isHidden))

	async function onGroupSelectUpdate(newIds: number[]) {
		const currentIds = visibleGroupIds.value
		const toToggle = [
			...currentIds.filter(id => !newIds.includes(id)),
			...newIds.filter(id => !currentIds.includes(id)),
		]
		for (const id of toToggle) {
			await changeTimePeriodVisibility(id)
			const group = groupedItems.value.find(g => g.timePeriod.id === id)
			if (group) group.timePeriod.isHidden = !group.timePeriod.isHidden
		}
	}

	onMounted(() => {
		getAllRecords()
	})

	function toggleChangeOrderMode() {
		isInChangeOrderMode.value = !isInChangeOrderMode.value
	}

	function visibleItems(group: RoutineTodoListGroupedList) {
		if (!hideDoneGroupIds.value.includes(group.timePeriod.id as number)) return group.items
		return group.items.filter(item => !item.isDone)
	}

	function consistencyPct(timePeriod: RoutineTimePeriodEntity): number {
		if (!timePeriod.totalPeriodsElapsed) return 0
		return Math.round((timePeriod.totalPeriodsCompleted / timePeriod.totalPeriodsElapsed) * 100)
	}

	function consistencyColor(timePeriod: RoutineTimePeriodEntity): string {
		const pct = consistencyPct(timePeriod)
		if (pct >= 80) return 'text-success'
		if (pct >= 50) return 'text-warning'
		return 'text-error'
	}

	function daysUntilReset(timePeriod: RoutineTimePeriodEntity): number {
		if (!timePeriod.nextResetAt) return Infinity
		const ms = new Date(timePeriod.nextResetAt).getTime() - Date.now()
		return Math.ceil(ms / (1000 * 60 * 60 * 24))
	}

	function groupProgress(items: RoutineTodoListItemEntity[]) {
		const done = items.reduce((sum, item) => sum + (item.doneCount ?? (item.isDone ? 1 : 0)), 0)
		const total = items.reduce((sum, item) => sum + (item.totalCount ?? 1), 0)
		return { done, total }
	}

	const groupProgressMap = computed(() => {
		const map = new Map<number, { done: number; total: number }>()
		for (const group of groupedItems.value) {
			map.set(group.timePeriod.id as number, groupProgress(group.items))
		}
		return map
	})

	function isAtRisk(group: RoutineTodoListGroupedList): boolean {
		const days = daysUntilReset(group.timePeriod)
		if (days > 1 || days < 0) return false
		const { done, total } = groupProgress(group.items)
		const pct = total ? (done / total) * 100 : 0
		return pct < group.timePeriod.streakThreshold
	}

	async function handleOrderChange(
		oldIndex: number,
		newIndex: number,
		request: ChangeDisplayOrderRequest,
		timePeriodId: number,
	) {
		const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
		if (group) {
			const [movedItem] = group.items.splice(oldIndex, 1)
			if (movedItem) {
				group.items.splice(newIndex, 0, movedItem)
			}
			await changeDisplayOrder(request)
		}
	}

	async function handleCrossListDrop(sourceListId: number, targetListId: number, itemId: number, dropTarget: any) {
		const sourceGroup = groupedItems.value.find(g => g.timePeriod.id === sourceListId)
		const targetGroup = groupedItems.value.find(g => g.timePeriod.id === targetListId)

		if (!sourceGroup || !targetGroup) return

		const sourceIndex = sourceGroup.items.findIndex(item => item.id === itemId)
		const movedItem = sourceGroup.items[sourceIndex]

		if (!movedItem) return

		sourceGroup.items.splice(sourceIndex, 1)

		let targetIndex = 0
		if (dropTarget.data.type === 'drop-zone') {
			targetIndex = dropTarget.data.index
			if (dropTarget.data.position === 'bottom') {
				targetIndex += 1
			}
		}
		targetGroup.items.splice(targetIndex, 0, movedItem)

		const updateRequest = new RoutineTodoListItemRequest(
			movedItem.activity.id,
			targetListId,
			movedItem.doneCount,
			movedItem.totalCount,
			movedItem.isDone,
		)

		await update(itemId, updateRequest)

		const precedingItem = targetIndex > 0 ? targetGroup.items[targetIndex - 1] : null
		const followingItem = targetIndex < targetGroup.items.length - 1 ? targetGroup.items[targetIndex + 1] : null

		const orderRequest = new ChangeDisplayOrderRequest(itemId, precedingItem?.id ?? null, followingItem?.id ?? null)

		await changeDisplayOrder(orderRequest)
	}

	function getAllRecords() {
		getAllGrouped().then(response => {
			groupedItems.value = response
		})
	}

	async function add(request: RoutineTodoListItemRequest) {
		const response = await createWithResponse(request)
		const updatedList = groupedItems.value.find(group => group.timePeriod.id === response.timePeriod.id)?.items
		if (updatedList) {
			updatedList.push(response)
			updatedList.sort((a, b) => a.id - b.id)
		} else {
			console.error('not found group')
		}
	}

	async function edit(beforeEditEntity: RoutineTodoListItemEntity, toDoListItemRequest: RoutineTodoListItemRequest) {
		if (hasObjectChanged(RoutineTodoListItemRequest.fromEntity(beforeEditEntity), toDoListItemRequest)) {
			await update(beforeEditEntity.id, toDoListItemRequest)
		}
		const updatedItem = await fetchById(beforeEditEntity.id)
		const updatedList = groupedItems.value.find(group => group.timePeriod.id === updatedItem.timePeriod.id)?.items
		if (updatedList) {
			if (updatedItem.timePeriod.id === beforeEditEntity.timePeriod.id) {
				updatedList[updatedList.findIndex(item => item.id === updatedItem.id)] = updatedItem
			} else {
				const oldGroup = groupedItems.value.find(
					group => group.timePeriod.id === beforeEditEntity.timePeriod.id,
				)
				if (oldGroup) {
					oldGroup.items = oldGroup?.items.filter(item => item.id !== updatedItem.id)
				}
				updatedList.push(updatedItem)
			}
		} else {
			console.error('not found updated group list')
		}
	}

	function onDelete(id: number) {
		deleteEntity(id).then(() => {
			const group = groupedItems.value.find(group => group.items.some(item => item.id === id))
			if (group) {
				group.items = group.items.filter(item => item.id !== id)
			}
		})
	}

	async function onItemsChanged(changedItems: number[]) {
		for (const id of changedItems) {
			const updatedItem = await fetchById(id)
			const group = groupedItems.value.find(g => g.timePeriod.id === updatedItem.timePeriod.id)
			if (group) {
				const index = group.items.findIndex(item => item.id === id)
				if (index !== -1) {
					group.items[index] = updatedItem
				}
			}
		}
	}
</script>
