<template>
	<WidgetCard
		:title="$t('home.todoList')"
		:openRoute="{ name: 'toDoList' }"
		:loading="loading"
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
				@stepToggled="load"
				@edit="router.push({ name: 'toDoList' })"
				@delete="router.push({ name: 'toDoList' })"
				@addToPlanner="router.push({ name: 'taskPlanner' })"
			/>
		</VList>
	</WidgetCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { storeToRefs } from 'pinia'
	import { fetchDashboardTodoListItems, useTodoListItemCrud } from '@/core/todoList/api/todoListItemApi.ts'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import NormalTodoListItem from '@/core/todoList/component/normal/NormalTodoListItem.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { useHomeUiStore } from '@/core/home/store/homeUiStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const router = useRouter()
	const { t } = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { toggleIsDone } = useTodoListItemCrud(0)
	const { hideDoneTodoList: hideDone } = storeToRefs(useHomeUiStore())

	const items = ref<TodoListItemEntity[]>([])
	const loading = ref(true)
	const error = ref(false)
	// Guards against an older load's response landing after a newer one — harmless before Retry
	// existed (only one load could ever be in flight), not harmless now that a load can overlap
	// the one it is retrying.
	let loadToken = 0

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	function daysDiff(dueDate: string): number {
		const due = new Date(dueDate)
		due.setHours(0, 0, 0, 0)
		return Math.round((due.getTime() - today.getTime()) / 86_400_000)
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

	async function load() {
		const token = ++loadToken
		loading.value = true
		error.value = false
		try {
			const result = await fetchDashboardTodoListItems()
			if (token !== loadToken) return
			items.value = result
		} catch {
			if (token !== loadToken) return
			error.value = true
		} finally {
			if (token === loadToken) loading.value = false
		}
	}

	onMounted(load)
</script>
