<template>
	<WidgetCard
		:title="$t('home.todoList')"
		:openRoute="{ name: 'toDoList' }"
		:loading="loading"
		:empty="visibleItems.length === 0"
		:emptyText="$t('home.noUpcomingTasks')"
	>
		<template #headerActions>
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
	import { API } from '@/_common/axiosConfig.ts'
	import { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import NormalTodoListItem from '@/core/todoList/component/normal/NormalTodoListItem.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'

	const router = useRouter()

	const items = ref<TodoListItemEntity[]>([])
	const loading = ref(true)
	const hideDone = ref(true)

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

	function handleIsDoneChanged(item: TodoListItemEntity, forceValue?: boolean) {
		const request = { ids: [item.id], forceValue }
		API.patch('todo-list-item/toggle-is-done', request).catch(() => load())
	}

	async function load() {
		loading.value = true
		try {
			const response = await API.get('todo-list-item/dashboard-widget')
			items.value = TodoListItemEntity.listFromObjects(response.data)
		} finally {
			loading.value = false
		}
	}

	onMounted(load)
</script>
