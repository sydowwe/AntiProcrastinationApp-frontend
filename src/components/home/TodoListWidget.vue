<template>
	<VCard style="display: flex; flex-direction: column">
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
				<VListItem
					v-for="item in visibleItems"
					:key="item.id"
					class="px-1 rounded-lg mb-1 cursor-pointer"
					@click="toggleItem(item)"
				>
					<template #prepend>
						<VIcon
							:icon="item.isDone ? 'fas fa-circle-check' : 'far fa-circle'"
							:color="item.isDone ? 'success' : 'textMuted'"
							size="18"
							class="me-2"
						/>
					</template>
					<VListItemTitle
						class="text-body-2"
						:class="{ 'text-decoration-line-through text-medium-emphasis': item.isDone }"
					>
						{{ item.activity.name }}
					</VListItemTitle>
					<template #append>
						<div class="d-flex align-center ga-2">
							<template v-if="item.isMultipleCount && item.doneCount !== null && item.totalCount !== null">
								<span class="text-caption text-medium-emphasis">
									{{ item.doneCount }}/{{ item.totalCount }}
								</span>
							</template>
							<VChip
								v-if="item.dueDate"
								:color="dueDateColor(item.dueDate)"
								size="x-small"
								variant="tonal"
							>
								{{ dueDateLabel(item.dueDate) }}
							</VChip>
						</div>
					</template>
				</VListItem>
			</VList>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { API } from '@/plugins/axiosConfig.ts'
	import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'

	const router = useRouter()
	const { t } = useI18n()

	const items = ref<TodoListItemEntity[]>([])
	const loading = ref(true)
	const hideDone = ref(false)

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	function daysDiff(dueDate: string): number {
		const due = new Date(dueDate)
		due.setHours(0, 0, 0, 0)
		return Math.round((due.getTime() - today.getTime()) / 86_400_000)
	}

	function dueDateColor(dueDate: string): string {
		const diff = daysDiff(dueDate)
		if (diff < 0) return 'error'
		if (diff === 0) return 'primary'
		if (diff === 1) return 'warning'
		return 'success'
	}

	function dueDateLabel(dueDate: string): string {
		const diff = daysDiff(dueDate)
		if (diff < 0) return t('home.overdue')
		if (diff === 0) return t('home.dueToday')
		if (diff === 1) return t('home.dueTomorrow')
		return t('home.dueIn', { days: diff })
	}

	const sortedItems = computed(() =>
		[...items.value].sort((a, b) => {
			if (a.dueDate === null && b.dueDate === null) return 0
			if (a.dueDate === null) return 1
			if (b.dueDate === null) return -1
			return daysDiff(a.dueDate) - daysDiff(b.dueDate)
		}),
	)

	const visibleItems = computed(() =>
		hideDone.value ? sortedItems.value.filter(i => !i.isDone) : sortedItems.value,
	)

	async function toggleItem(item: TodoListItemEntity) {
		item.isDone = !item.isDone
		try {
			await API.patch('todo-list-item/toggle-is-done', { ids: [item.id] })
		} catch {
			item.isDone = !item.isDone
		}
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
