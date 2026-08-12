<template>
	<WidgetCard
		:title="$t('home.routineTodoList')"
		:openRoute="{ name: 'routineToDoList' }"
		:loading="loading"
		:error="error"
		:errorText="$t('home.loadFailedRoutineTodos')"
		:empty="visibleGroups.length === 0"
		:emptyText="$t('routineTodoList.allDone')"
		@retry="load"
	>
		<template #headerActions>
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
			<VIconBtn
				:icon="hideDone ? 'fa-eye' : 'fa-eye-slash'"
				variant="text"
				size="small"
				:title="hideDone ? $t('home.showDone') : $t('home.hideDone')"
				@click="hideDone = !hideDone"
			/>
		</template>

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
	</WidgetCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
	import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
	import type { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import RoutineTodoListItem from '@/core/todoList/component/routine/RoutineTodoListItem.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const router = useRouter()
	const { t } = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { fetchGroupedByTimePeriod, toggleIsDoneOrThrow } = useRoutineTodoListItemCrud()
	const { fetchAll: fetchAllPeriods } = useRoutineTimePeriodCrud()

	const groupedItems = ref<RoutineTodoListGroupedList[]>([])
	const timePeriods = ref<RoutineTimePeriodEntity[]>([])
	const loading = ref(true)
	const loadingPeriods = ref(true)
	const error = ref(false)
	const hideDone = ref(true)
	// Guards against an older load's response landing after a newer one — harmless before Retry
	// existed (only one load could ever be in flight), not harmless now that a load can overlap
	// the one it is retrying.
	let loadToken = 0

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

	// `RoutineTodoListItem` emits the item's id, not the entity — BaseTodoListItem.vue:289.
	function handleIsDoneChanged(id: number, forceValue?: boolean) {
		const sourceItem = groupedItems.value.flatMap(g => g.items).find(i => i.id === id)
		if (!sourceItem) return
		const previousIsDone = sourceItem.isDone
		sourceItem.isDone = forceValue ?? !previousIsDone
		toggleIsDoneOrThrow(id, forceValue).catch(() => {
			sourceItem.isDone = previousIsDone
			showErrorSnackbar(t('home.toggleTaskFailed', { task: sourceItem.activity.name }))
		})
	}

	async function load() {
		const token = ++loadToken
		loading.value = true
		error.value = false
		try {
			const result = await fetchGroupedByTimePeriod()
			if (token !== loadToken) return
			groupedItems.value = result
		} catch {
			if (token !== loadToken) return
			error.value = true
		} finally {
			if (token === loadToken) loading.value = false
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
