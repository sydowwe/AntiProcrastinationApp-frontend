<template>
	<VCard style="display: flex; flex-direction: column; overflow: hidden; height: 100%">
		<VCardTitle class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
			<span class="text-h6">{{ $t('home.routineTodoList') }}</span>
			<div class="d-flex align-center ga-2">
				<VSheet
					v-for="period in timePeriods"
					:key="period.id"
					rounded="lg"
					class="px-4 py-2 d-flex align-center ga-2"
					color="neutral-100"
				>
					<span class="text-caption font-weight-medium">{{ period.text }}</span>
					<VIcon
						icon="fas fa-fire"
						color="warning"
						size="12"
					/>
					<span class="text-caption font-weight-bold">{{ period.streak }}</span>
					<VIcon
						icon="fas fa-trophy"
						color="amber"
						size="12"
					/>
					<span class="text-caption text-medium-emphasis">{{ period.bestStreak }}</span>
				</VSheet>
			</div>
			<div class="d-flex align-center ga-1">
				<VIconBtn
					:icon="hideDone ? 'fa-eye' : 'fa-eye-slash'"
					variant="text"
					size="small"
					:title="hideDone ? $t('home.showDone') : $t('home.hideDone')"
					@click="hideDone = !hideDone"
				/>
				<VIconBtn
					icon="fa-up-right-from-square"
					variant="text"
					size="small"
					@click="router.push({ name: 'routineToDoList' })"
				/>
			</div>
		</VCardTitle>
		<VDivider />
		<VCardText style="flex: 1; display: flex; flex-direction: column; min-height: 0">
			<div
				v-if="loading"
				class="d-flex justify-center align-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>
			<div
				v-else-if="visibleGroups.length === 0"
				class="text-center text-medium-emphasis py-4"
			>
				{{ $t('routineTodoList.allDone') }}
			</div>
			<div
				v-else
				style="flex: 1; display: flex; flex-direction: column; min-height: 0"
			>
				<div style="flex: 1; overflow-y: auto; min-height: 0">
					<div
						v-for="group in visibleGroups"
						:key="group.timePeriod.id"
						class="mb-4"
					>
						<div class="d-flex align-center ga-2 mb-1">
							<VChip
								:color="group.timePeriod.color || 'primary'"
								size="small"
								variant="tonal"
							>
								{{ group.timePeriod.text }}
							</VChip>
							<VProgressLinear
								:modelValue="groupProgress(group).done"
								:max="groupProgress(group).total || 1"
								color="secondary"
								rounded="sm"
								height="10"
								class="flex-grow-1"
							/>
							<span class="text-caption text-medium-emphasis">
								{{ groupProgress(group).done }}/{{ groupProgress(group).total }}
							</span>
						</div>
						<VList
							density="compact"
							class="pa-0"
						>
							<RoutineTodoListItem
								v-for="item in filteredItems(group)"
								:key="item.id"
								:toDoListItem="item"
								:kind="ToDoListKind.ROUTINE"
								:listId="0"
								:streakConfig="{
									graceDays: item.timePeriod.streakGraceDays,
									periodLengthInDays: item.timePeriod.lengthInDays,
								}"
								class="my-2"
								@isDoneChanged="handleIsDoneChanged"
								@stepToggled="load"
								@edit="router.push({ name: 'routineToDoList' })"
								@delete="router.push({ name: 'routineToDoList' })"
								@addToPlanner="router.push({ name: 'taskPlanner' })"
							/>
						</VList>
					</div>
				</div>
			</div>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useRoutineTodoListItemCrud } from '@/api/routineTodoList/routineTodoListApi.ts'
	import { useRoutineTimePeriodCrud } from '@/api/routineTodoList/timePeriodApi.ts'
	import type { RoutineTodoListGroupedList } from '@/dtos/response/todoList/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import RoutineTodoListItem from '@/components/toDoList/routine/RoutineTodoListItem.vue'

	const router = useRouter()
	const { getAllGrouped } = useRoutineTodoListItemCrud()
	const { fetchAll: fetchAllPeriods } = useRoutineTimePeriodCrud()

	const groupedItems = ref<RoutineTodoListGroupedList[]>([])
	const timePeriods = ref<RoutineTimePeriodEntity[]>([])
	const loading = ref(true)
	const loadingPeriods = ref(true)
	const hideDone = ref(true)

	const todayDayOfWeek = (() => {
		const d = new Date().getDay()
		return d === 0 ? 7 : d // ISO: Mon=1 … Sun=7
	})()
	const todayDayOfMonth = new Date().getDate()

	function isSuggestedForToday(item: RoutineTodoListItemEntity): boolean {
		if (item.timePeriod.lengthInDays === 1) return true
		if (item.suggestedDay === null) return false
		return item.suggestedDay <= 7 ? item.suggestedDay === todayDayOfWeek : item.suggestedDay === todayDayOfMonth
	}

	function todayItems(group: RoutineTodoListGroupedList): RoutineTodoListItemEntity[] {
		return group.items.filter(isSuggestedForToday)
	}

	const visibleGroups = computed(() =>
		groupedItems.value.filter(g => {
			if (g.timePeriod.isHidden) return false
			const items = todayItems(g)
			if (items.length === 0) return false
			return !hideDone.value || items.some(i => !i.isDone)
		}),
	)

	function groupProgress(group: RoutineTodoListGroupedList) {
		const items = todayItems(group)
		const done = items.reduce((sum, item) => sum + (item.doneCount ?? (item.isDone ? 1 : 0)), 0)
		const total = items.reduce((sum, item) => sum + (item.totalCount ?? 1), 0)
		return { done, total }
	}

	function filteredItems(group: RoutineTodoListGroupedList): RoutineTodoListItemEntity[] {
		const items = todayItems(group)
		return hideDone.value ? items.filter(i => !i.isDone) : items
	}

	function handleIsDoneChanged(item: RoutineTodoListItemEntity, forceValue?: boolean) {
		const sourceItem = groupedItems.value.flatMap(g => g.items).find(i => i.id === item.id)
		if (sourceItem) {
			sourceItem.isDone = item.isDone
			sourceItem.doneCount = item.doneCount
		}
		API.patch('/routine-todo-list/toggle-is-done', { ids: [item.id], forceValue }).catch(() => load())
	}

	async function load() {
		loading.value = true
		try {
			groupedItems.value = await getAllGrouped()
		} finally {
			loading.value = false
		}
	}

	async function loadPeriods() {
		loadingPeriods.value = true
		try {
			timePeriods.value = await fetchAllPeriods()
		} finally {
			loadingPeriods.value = false
		}
	}

	onMounted(() => {
		load()
		loadPeriods()
	})
</script>
