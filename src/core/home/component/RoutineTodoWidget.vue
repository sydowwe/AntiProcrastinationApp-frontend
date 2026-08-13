<template>
	<WidgetCard
		:title="$t('home.routineTodoList')"
		:openRoute="{ name: 'routineToDoList' }"
		:loading="loading"
		:refreshing="refreshing"
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
			<span class="text-caption text-medium-emphasis">
				{{ overallProgress.done }}/{{ overallProgress.total }}
			</span>
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
				<span
					v-if="notDueTodayCount(group) > 0"
					class="text-caption text-medium-emphasis"
				>
					{{ $t('home.notDueToday', { count: notDueTodayCount(group) }) }}
				</span>
			</div>
			<VList
				v-if="filteredItems(group).length > 0"
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
					@stepToggled="refreshNow"
					@edit="router.push({ name: 'routineToDoList' })"
					@delete="router.push({ name: 'routineToDoList' })"
					@addToPlanner="router.push({ name: 'taskPlanner' })"
				/>
			</VList>
		</div>
	</WidgetCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { storeToRefs } from 'pinia'
	import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
	import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
	import type { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
	import RoutineTodoListItem from '@/core/todoList/component/routine/RoutineTodoListItem.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { useHomeUiStore } from '@/core/home/store/homeUiStore.ts'
	import { todayDate, useDashboardRefresh } from '@/core/home/composable/useDashboardRefresh.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const router = useRouter()
	const { t } = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { fetchGroupedByTimePeriod, toggleIsDoneOrThrow } = useRoutineTodoListItemCrud()
	const { fetchAll: fetchAllPeriods } = useRoutineTimePeriodCrud()
	const { hideDoneRoutine: hideDone } = storeToRefs(useHomeUiStore())

	const groupedItems = ref<RoutineTodoListGroupedList[]>([])
	const timePeriods = ref<RoutineTimePeriodEntity[]>([])
	const loading = ref(true)
	const refreshing = ref(false)
	const loadingPeriods = ref(true)
	const error = ref(false)
	// Guards against an older load's response landing after a newer one — harmless before Retry
	// existed (only one load could ever be in flight), not harmless now that a load can overlap
	// the one it is retrying.
	let loadToken = 0

	// JS Date#getDay() is 0=Sun..6=Sat; DayOfWeek is a string enum with no numeric ordering of its own.
	const JS_DAY_TO_DAY_OF_WEEK = [
		DayOfWeek.Sunday,
		DayOfWeek.Monday,
		DayOfWeek.Tuesday,
		DayOfWeek.Wednesday,
		DayOfWeek.Thursday,
		DayOfWeek.Friday,
		DayOfWeek.Saturday,
	]
	// Both from the dashboard-wide date signal, not from a `new Date()` captured at setup. This is a
	// page people leave open overnight, and `isSuggestedForToday` below reads these on every render:
	// frozen, the widget spends all of the next day filtering for the previous one.
	const todayDayOfWeek = computed(() => JS_DAY_TO_DAY_OF_WEEK[todayDate.value.getDay()]!)
	const todayDayOfMonth = computed(() => todayDate.value.getDate())

	// Confirmed against RoutineTodoListItemEntity.ts and the edit form (RoutineToDoListForm.vue:34-46):
	// day-of-week and day-of-month are two separate, already-discriminated fields — `suggestedDays`
	// and `suggestedDayOfMonth` — not one overloaded value. The form itself switches which one it
	// shows based on `timePeriod.lengthInDays` (weekly: 1 < lengthInDays <= 14, monthly: > 14), so the
	// same threshold is used here to pick which field to read.
	function isSuggestedForToday(item: RoutineTodoListItemEntity): boolean {
		if (item.timePeriod.lengthInDays === 1) return true
		if (item.timePeriod.lengthInDays > 14) return item.suggestedDayOfMonth === todayDayOfMonth.value
		return item.suggestedDays.includes(todayDayOfWeek.value)
	}

	function todayItems(group: RoutineTodoListGroupedList): RoutineTodoListItemEntity[] {
		return group.items.filter(isSuggestedForToday)
	}

	function notDueTodayCount(group: RoutineTodoListGroupedList): number {
		return group.items.length - todayItems(group).length
	}

	const visibleGroups = computed(() =>
		groupedItems.value.filter(g => {
			if (g.timePeriod.isHidden || g.items.length === 0) return false
			const items = todayItems(g)
			// Keep the group visible (with a "+N not due today" note) instead of vanishing when
			// nothing in it happens to be due today.
			if (items.length === 0) return true
			return !hideDone.value || items.some(i => !i.isDone)
		}),
	)

	const overallProgress = computed(() =>
		groupedItems.value.reduce(
			(acc, g) => {
				if (g.timePeriod.isHidden) return acc
				const { done, total } = groupProgress(g)
				acc.done += done
				acc.total += total
				return acc
			},
			{ done: 0, total: 0 },
		),
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

	/**
	 * `background` is what a dashboard refresh uses: the groups stay on screen instead of collapsing
	 * to a spinner, and an existing error is left standing until the refetch actually succeeds.
	 */
	async function load({ background = false } = {}) {
		const token = ++loadToken
		if (background) refreshing.value = true
		else loading.value = true
		try {
			const result = await fetchGroupedByTimePeriod()
			if (token !== loadToken) return
			groupedItems.value = result
			error.value = false
		} catch {
			if (token !== loadToken) return
			error.value = true
		} finally {
			if (token === loadToken) {
				loading.value = false
				refreshing.value = false
			}
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

	// The streak counters in the header come from the periods call, and they move whenever an item
	// is ticked — so a refresh has to bring both back, not just the list.
	function refresh() {
		return Promise.all([load({ background: true }), loadPeriods()])
	}

	// Same reasoning as the plain todo list: these change only through user action, so returning to
	// the tab is the trigger that matters and a poll would be noise. Rollover is load-bearing here
	// because `isSuggestedForToday` is a per-day filter, so the visible set changes at midnight even
	// when the data does not. (Whether the server also resets `isDone` at a period boundary is not
	// established from this side — the only reset in the API is the manual `uncheckAll`.)
	// `refreshNow` rather than `refresh` for the in-widget reload after a step is ticked: going
	// through the coordinator stamps the freshness clock, so returning to the tab a minute later
	// does not refetch what was just fetched.
	const { refreshNow } = useDashboardRefresh('home:routineTodoList', {
		load: () => {
			void load()
			void loadPeriods()
		},
		refresh,
		hasError: () => error.value,
	})
</script>
