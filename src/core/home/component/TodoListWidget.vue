<template>
	<WidgetCard
		:title="$t('home.todoList')"
		:openRoute="{ name: 'toDoList' }"
		:loading="loading"
		:refreshing="refreshing"
		:error="error"
		:errorText="$t('home.loadFailedTodos')"
		:empty="visibleItems.length === 0"
		:emptyText="$t('home.noUpcomingTasks')"
		@retry="load"
	>
		<template #headerActions>
			<span class="text-caption text-medium-emphasis">{{ doneCount }}/{{ items.length }}</span>
			<VIconBtn
				:icon="hideDone ? 'fa-eye' : 'fa-eye-slash'"
				variant="text"
				size="small"
				:title="hideDone ? $t('home.showDone') : $t('home.hideDone')"
				@click="hideDone = !hideDone"
			/>
		</template>

		<VList
			density="compact"
			class="pa-0"
		>
			<NormalTodoListItem
				v-for="item in visibleItems"
				:key="item.id"
				:toDoListItem="item"
				:kind="ToDoListKind.NORMAL"
				:listId="0"
				class="my-2"
				@isDoneChanged="handleIsDoneChanged"
				@stepToggled="refreshNow"
				@edit="router.push({ name: 'toDoList' })"
				@delete="router.push({ name: 'toDoList' })"
				@addToPlanner="router.push({ name: 'taskPlanner' })"
			/>
		</VList>
	</WidgetCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { storeToRefs } from 'pinia'
	import { fetchDashboardTodoListItems, useTodoListItemCrud } from '@/core/todoList/api/todoListItemApi.ts'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import NormalTodoListItem from '@/core/todoList/component/normal/NormalTodoListItem.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { useHomeUiStore } from '@/core/home/store/homeUiStore.ts'
	import { todayDate, useDashboardRefresh } from '@/core/home/composable/useDashboardRefresh.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const router = useRouter()
	const { t } = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { toggleIsDone } = useTodoListItemCrud(0)
	const { hideDoneTodoList: hideDone } = storeToRefs(useHomeUiStore())

	const items = ref<TodoListItemEntity[]>([])
	const loading = ref(true)
	const refreshing = ref(false)
	const error = ref(false)
	// Guards against an older load's response landing after a newer one — harmless before Retry
	// existed (only one load could ever be in flight), not harmless now that a load can overlap
	// the one it is retrying.
	let loadToken = 0

	// From the dashboard-wide date signal, not a `new Date()` captured at setup: this list sorts by
	// how far away the due date is, and on a tab left open overnight a frozen "today" quietly
	// re-labels everything by one day.
	function daysDiff(dueDate: string): number {
		const due = new Date(dueDate)
		due.setHours(0, 0, 0, 0)
		return Math.round((due.getTime() - todayDate.value.getTime()) / 86_400_000)
	}

	const sortedItems = computed(() =>
		[...items.value].sort((a, b) => {
			if (a.dueDate === null && b.dueDate === null) return 0
			if (a.dueDate === null) return 1
			if (b.dueDate === null) return -1
			return daysDiff(a.dueDate) - daysDiff(b.dueDate)
		}),
	)

	const visibleItems = computed(() => (hideDone.value ? sortedItems.value.filter(i => !i.isDone) : sortedItems.value))
	const doneCount = computed(() => items.value.filter(i => i.isDone).length)

	// `NormalTodoListItem` emits the item's id, not the entity — BaseTodoListItem.vue:289.
	function handleIsDoneChanged(id: number, forceValue?: boolean) {
		const item = items.value.find(i => i.id === id)
		if (!item) return
		const previousIsDone = item.isDone
		item.isDone = forceValue ?? !previousIsDone
		toggleIsDone(id, forceValue).catch(() => {
			item.isDone = previousIsDone
			showErrorSnackbar(t('home.toggleTaskFailed', { task: item.activity.name }))
		})
	}

	/**
	 * `background` is what a dashboard refresh uses: the list stays on screen instead of collapsing
	 * to a spinner, and an existing error is left standing until the refetch actually succeeds.
	 */
	async function load({ background = false } = {}) {
		const token = ++loadToken
		if (background) refreshing.value = true
		else loading.value = true
		try {
			const result = await fetchDashboardTodoListItems()
			if (token !== loadToken) return
			items.value = result
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

	function refresh() {
		return load({ background: true })
	}

	// These items only change through somebody doing something — here, in the todo view, or on
	// another device. Coming back to the tab is when that becomes worth checking; a poll would only
	// add requests to a page nobody is looking at. Due dates are date-scoped, so rollover matters.
	// `refreshNow` rather than `refresh` for the in-widget reload after a step is ticked: going
	// through the coordinator stamps the freshness clock, so returning to the tab a minute later
	// does not refetch what was just fetched.
	const { refreshNow } = useDashboardRefresh('home:todoList', {
		load,
		refresh,
		hasError: () => error.value,
	})
</script>
