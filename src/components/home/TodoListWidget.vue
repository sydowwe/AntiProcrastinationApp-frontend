<template>
	<VCard style="display: flex; flex-direction: column; overflow: hidden">
		<VCardTitle class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
			<span class="text-h6">{{ $t('home.todoList') }}</span>
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
					@click="router.push({ name: 'toDoList' })"
				/>
			</div>
		</VCardTitle>
		<VDivider />
		<VCardText style="flex: 1; overflow-y: auto; min-height: 0">
			<div
				v-if="loading"
				class="d-flex justify-center align-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>
			<div
				v-else-if="visibleItems.length === 0"
				class="text-center text-medium-emphasis py-4"
			>
				{{ $t('home.noUpcomingTasks') }}
			</div>
			<VList
				v-else
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
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { API } from '@/plugins/axiosConfig.ts'
	import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import NormalTodoListItem from '@/components/toDoList/normal/NormalTodoListItem.vue'

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
