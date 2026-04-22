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
			align="start"
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
				<VCard class="h-100 rounded-lg px-3 px-md-4 pt-4 pb-2 d-flex flex-column">
					<div
						v-if="group.timePeriod.nextResetAt"
						class="period-timeline"
					>
						<div class="d-flex justify-space-between align-center mb-1">
							<span class="text-caption font-weight-bold">
								{{ periodTimeLabel(group.timePeriod) }}
							</span>
							<span class="text-caption opacity-60">
								{{ formatResetDate(group.timePeriod) }}
							</span>
						</div>
						<div class="timeline-bar-row">
							<div
								v-for="(seg, i) in buildSegments(group.timePeriod)"
								:key="i"
								class="timeline-segment-wrap"
							>
								<div class="timeline-track">
									<div
										class="timeline-fill"
										:style="{ width: seg.fill + '%' }"
									/>
								</div>
								<span
									v-if="seg.showLabel"
									class="timeline-label text-caption"
								>
									{{ seg.label }}
								</span>
								<span
									v-else
									class="timeline-label"
									aria-hidden="true"
								/>
							</div>
						</div>
					</div>
					<div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px">
						<!-- Left: streak + consistency stats -->
						<div class="mb-1 d-flex flex-column ga-1">
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
								<VTooltip
									v-if="group.timePeriod.totalPeriodsElapsed > 0"
									:text="$t('routineTodoList.consistencyLegend')"
									location="bottom"
								>
									<template #activator="{ props: tooltipProps }">
										<span
											v-bind="tooltipProps"
											class="text-caption font-weight-bold"
											:class="consistencyColor(group.timePeriod)"
											style="cursor: default"
										>
											{{ consistencyPct(group.timePeriod) }}%
										</span>
									</template>
								</VTooltip>
								<VTooltip
									v-if="isAtRisk(group)"
									:text="
										group.timePeriod.nextResetAt
											? $t('routineTodoList.resetDate', {
													date: formatResetDate(group.timePeriod),
												})
											: ''
									"
									:disabled="!group.timePeriod.nextResetAt"
									location="bottom"
								>
									<template #activator="{ props: tooltipProps }">
										<VChip
											v-bind="tooltipProps"
											color="warning"
											size="x-small"
											prependIcon="triangle-exclamation"
											class="text-black font-weight-bold"
										>
											{{
												$t('routineTodoList.daysLeft', {
													days: daysUntilReset(group.timePeriod),
												})
											}}
										</VChip>
									</template>
								</VTooltip>
							</div>
						</div>

						<!-- Center: title only -->
						<VSheet
							class="px-3 d-flex align-center ga-2"
							rounded
							:style="{ backgroundColor: getBgColor(group.timePeriod.color) }"
							style="cursor: default"
						>
							<VCardTitle class="px-0 py-0">{{ group.timePeriod.text }}</VCardTitle>
							<VChip
								size="x-small"
								variant="tonal"
								color="white"
								class="font-weight-bold"
							>
								{{ group.timePeriod.lengthInDays }}d
							</VChip>
						</VSheet>

						<!-- Right: placeholder for grid alignment -->
						<div></div>
					</div>

					<div class="h-100">
						<div
							v-if="isAllDoneHidden(group)"
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
						<ToDoList
							v-else
							class="h-100"
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
							@batchDeletedItems="onBatchDelete"
							@itemsReordered="
								(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) =>
									handleOrderChange(oldIndex, newIndex, request, group.timePeriod.id as number)
							"
							@crossListDrop="handleCrossListDrop"
							@addToPlanner="openAddToPlanner"
						></ToDoList>
					</div>
					<div class="pl-2 pt-2 d-flex ga-3">
						<VSwitch
							v-model="hideDoneGroupIds"
							:value="group.timePeriod.id"
							:label="$t('routineTodoList.hideDone')"
							density="compact"
							hideDetails
							color="secondary-accent"
							:disabled="isInChangeOrderMode"
						></VSwitch>
						<RoutineGroupHeatmap
							:history="group.timePeriod.completionHistory"
							:lengthInDays="group.timePeriod.lengthInDays"
							clickable
							@click="openHistoryDialog(group.timePeriod)"
							class="flex-fill pa-1"
							style="border: 1px solid rgb(var(--v-border-color)); border-radius: 4px"
						/>
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
	<RoutineGroupHistoryDialog ref="historyDialog" />
	<PlannerTaskDialog
		showDatePicker
		@create="createPlannerTask"
	/>
	<RoutineConfetti
		v-if="showConfetti"
		:key="confettiKey"
	/>
</template>
<script setup lang="ts">
	import RoutineToDoListDialog from '../../components/dialogs/toDoList/RoutineToDoListDialog.vue'
	import ToDoList from '../../components/toDoList/ToDoList.vue'
	import RoutineConfetti from '@/components/toDoList/RoutineConfetti.vue'
	import RoutineGroupHeatmap from '@/components/toDoList/RoutineGroupHeatmap.vue'
	import RoutineGroupHistoryDialog from '@/components/toDoList/RoutineGroupHistoryDialog.vue'
	import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { useRoutineTimePeriodCrud } from '@/api/routineTodoList/timePeriodApi.ts'
	import { useRoutineTodoListItemCrud } from '@/api/routineTodoList/routineTodoListApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useColor } from '@/utils/colorPalette.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import type { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import type { RoutineTodoListGroupedList } from '@/dtos/response/todoList/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'

	const route = useRoute()
	const router = useRouter()
	const { t } = useI18n()
	const { getBgColor } = useColor()
	const { fetchById, createWithResponse, update, deleteEntity, getAllGrouped, changeDisplayOrder } =
		useRoutineTodoListItemCrud()
	const { changeTimePeriodVisibility } = useRoutineTimePeriodCrud()
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const { fetchByDate } = useCalendarQuery()
	const { formatToUsString, usStringToUrlString } = useDateTime()
	const { showSuccessSnackbar } = useSnackbar()
	const plannerStore = useDayPlannerStore()

	const groupedItems = ref([] as RoutineTodoListGroupedList[])
	const toDoListDialog = ref<InstanceType<typeof RoutineToDoListDialog>>()
	const historyDialog = ref<InstanceType<typeof RoutineGroupHistoryDialog>>()
	const isInChangeOrderMode = ref(false)

	const showConfetti = ref(false)
	const confettiKey = ref(0)
	const celebratedGroupIds = new Set<number>()

	function triggerConfetti() {
		confettiKey.value++
		showConfetti.value = true
		setTimeout(() => {
			showConfetti.value = false
		}, 2500)
	}

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

	function openHistoryDialog(timePeriod: RoutineTimePeriodEntity) {
		historyDialog.value?.open(timePeriod)
	}

	function isAllDoneHidden(group: RoutineTodoListGroupedList): boolean {
		return (
			hideDoneGroupIds.value.includes(group.timePeriod.id as number) &&
			group.items.length > 0 &&
			group.items.every(item => item.isDone)
		)
	}

	function formatResetDate(timePeriod: RoutineTimePeriodEntity): string {
		if (!timePeriod.nextResetAt) return ''
		return new Date(timePeriod.nextResetAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
	}

	function visibleItems(group: RoutineTodoListGroupedList): RoutineTodoListItemEntity[] {
		if (hideDoneGroupIds.value.includes(group.timePeriod.id as number)) {
			return group.items.filter(item => !item.isDone)
		}
		return [...group.items]
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

	function roundHalf(value: number): number {
		return Math.round(value * 2) / 2
	}

	function periodTimeLabel(timePeriod: RoutineTimePeriodEntity): string {
		if (!timePeriod.nextResetAt) return ''
		const msRemaining = new Date(timePeriod.nextResetAt).getTime() - Date.now()
		const daysRemaining = msRemaining / (1000 * 60 * 60 * 24)
		if (daysRemaining < 2) {
			return t('routineTodoList.hoursLeft', { hours: roundHalf(msRemaining / (1000 * 60 * 60)) })
		}
		if (daysRemaining < 30) {
			return t('routineTodoList.daysLeft', { days: roundHalf(daysRemaining) })
		}
		if (daysRemaining < 90) {
			return t('routineTodoList.weeksLeft', { weeks: roundHalf(daysRemaining / 7) })
		}
		return t('routineTodoList.monthsLeft', { months: roundHalf(daysRemaining / 30) })
	}

	interface TimelineSegment {
		fill: number
		label: string
		showLabel: boolean
	}

	function getSegmentMode(lengthInDays: number): 'day' | 'week' | 'month' {
		if (lengthInDays <= 14) return 'day'
		if (lengthInDays <= 90) return 'week'
		return 'month'
	}

	function buildSegments(timePeriod: RoutineTimePeriodEntity): TimelineSegment[] {
		if (!timePeriod.nextResetAt) return []
		const DAY_MS = 86_400_000
		const periodEnd = new Date(timePeriod.nextResetAt).getTime()
		const periodStart = periodEnd - timePeriod.lengthInDays * DAY_MS
		const now = Date.now()
		const mode = getSegmentMode(timePeriod.lengthInDays)

		const boundaries: number[] = []

		if (mode === 'day') {
			for (let i = 0; i <= timePeriod.lengthInDays; i++) {
				boundaries.push(periodStart + i * DAY_MS)
			}
		} else if (mode === 'week') {
			// divide into n equal segments where n ≈ lengthInDays / 7
			const n = Math.round(timePeriod.lengthInDays / 7)
			const segMs = (periodEnd - periodStart) / n
			for (let i = 0; i <= n; i++) {
				boundaries.push(periodStart + i * segMs)
			}
		} else {
			// divide into n equal segments where n ≈ lengthInDays / 30
			const n = Math.round(timePeriod.lengthInDays / 30)
			const segMs = (periodEnd - periodStart) / n
			for (let i = 0; i <= n; i++) {
				boundaries.push(periodStart + i * segMs)
			}
		}

		const total = boundaries.length - 1
		const skipEvery = mode === 'day' && total >= 10 ? 2 : 1

		return boundaries.slice(0, -1).map((slotStart, i) => {
			const slotEnd = boundaries[i + 1]
			const fill =
				slotEnd <= now
					? 100
					: slotStart >= now
						? 0
						: Math.round(((now - slotStart) / (slotEnd - slotStart)) * 100)

			const labelDate = new Date(slotStart)
			const label =
				mode === 'day'
					? labelDate.toLocaleDateString(undefined, { weekday: 'short' })
					: mode === 'week'
						? labelDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
						: labelDate.toLocaleDateString(undefined, { month: 'short' })

			return { fill, label, showLabel: skipEvery === 1 || i % skipEvery === 0 }
		})
	}

	function groupProgress(items: RoutineTodoListItemEntity[]) {
		const done = items.reduce((sum, item) => sum + (item.doneCount ?? (item.isDone ? 1 : 0)), 0)
		const total = items.reduce((sum, item) => sum + (item.totalCount ?? 1), 0)
		return { done, total }
	}

	function isAtRisk(group: RoutineTodoListGroupedList): boolean {
		if (group.timePeriod.lengthInDays === 1) return false
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
		}
	}

	async function edit(beforeEditEntity: RoutineTodoListItemEntity, toDoListItemRequest: RoutineTodoListItemRequest) {
		await update(beforeEditEntity.id, toDoListItemRequest)
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
					oldGroup.items = oldGroup.items.filter(item => item.id !== updatedItem.id)
				}
				updatedList.push(updatedItem)
			}
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

	async function onBatchDelete(ids: number[]) {
		await Promise.all(ids.map(id => deleteEntity(id)))
		for (const group of groupedItems.value) {
			group.items = group.items.filter(item => !ids.includes(item.id))
		}
	}

	function openAddToPlanner(item: RoutineTodoListItemEntity) {
		plannerStore.openCreateDialogWithActivity(item.activity.id)
	}

	async function createPlannerTask(request: PlannerTaskRequest) {
		if (request.date) {
			const dateStr = usStringToUrlString(formatToUsString(request.date))
			const calendar = await fetchByDate(dateStr)
			request.calendarId = calendar.id
		}
		request.date = null
		await createPlannerTaskWithResponse(request)
		showSuccessSnackbar(t('successFeedback.added'))
	}

	async function onItemsChanged(changedItems: number[]) {
		for (const id of changedItems) {
			const updatedItem = await fetchById(id)
			const group = groupedItems.value.find(g => g.timePeriod.id === updatedItem.timePeriod.id)
			if (group) {
				const index = group.items.findIndex(item => item.id === id)
				if (index !== -1) {
					group.items[index] = updatedItem
					const groupId = group.timePeriod.id as number
					if (
						group.items.length > 0 &&
						group.items.every(item => item.isDone) &&
						!celebratedGroupIds.has(groupId)
					) {
						celebratedGroupIds.add(groupId)
						triggerConfetti()
					}
				}
			}
		}
	}
</script>

<style scoped>
	.period-timeline {
		width: 100%;
	}

	.timeline-bar-row {
		display: flex;
		gap: 2px;
		align-items: flex-start;
		width: 100%;
	}

	.timeline-segment-wrap {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	.timeline-track {
		height: 8px;
		border-radius: 4px;
		background: rgba(var(--v-theme-on-surface), 0.12);
		overflow: hidden;
	}

	.timeline-fill {
		height: 100%;
		background: rgb(var(--v-theme-secondary));
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.timeline-label {
		display: block;
		font-size: 9px;
		line-height: 1.3;
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.55;
		min-height: 1em;
	}
</style>
