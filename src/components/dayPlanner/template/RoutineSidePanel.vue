<template>
	<div
		class="flex-fill pa-4 d-flex flex-column"
		style="overflow-y: auto; min-height: 0"
	>
		<div
			v-if="loading"
			class="d-flex justify-center align-center flex-fill"
		>
			<VProgressCircular indeterminate />
		</div>
		<template v-else>
			<VSelect
				v-model="selectedPeriodId"
				class="flex-grow-0"
				:items="periodSelectItems"
				label="Period"
				density="compact"
				hideDetails
			/>
			<div
				v-if="displayItems.length > 0"
				class="mt-4 d-flex ga-2 justify-center"
			>
				<VChip>{{ inPlanCount }} / {{ totalCount }} tasks</VChip>
				<VChip>{{ inPlanCountAllPlanned }} / {{ displayItems.length }} fully planned</VChip>
			</div>
			<div
				v-if="displayItems.length === 0"
				class="text-center text-medium-emphasis py-6 text-caption"
			>
				No items in this period
			</div>
			<VList
				v-else
				density="compact"
				class="mt-1 pa-0"
			>
				<VListItem
					v-for="item in displayItems"
					:key="item.id"
					color="secondaryOutline"
					rounded="lg"
					class="px-2 py-1 my-1"
					style="cursor: pointer"
					:style="selectedItemId === item.id ? 'border: 1px solid rgb(var(--v-theme-secondaryOutline))' : ''"
					@click="toggleItem(item)"
				>
					<template #prepend>
						<VSheet
							class="text-caption text-medium-emphasis"
							:class="planCountForItem(item) >= (item.totalCount ?? 1) ? 'text-success' : ''"
							style="border: 1px solid rgb(var(--v-border-color)); border-radius: 8px; padding: 1px 6px"
						>
							{{ planCountForItem(item) }} / {{ item.totalCount ?? 1 }}
						</VSheet>
					</template>
					<VListItemTitle class="text-body-2 font-weight-medium">
						{{ item.activity.name }}
					</VListItemTitle>
					<VListItemSubtitle
						v-if="item.streak > 0 || item.suggestedTime"
						class="d-flex align-center ga-2 mt-1"
					>
						<span
							v-if="item.streak > 0"
							class="d-flex align-center ga-1"
						>
							<VIcon
								icon="fire-flame-curved"
								size="10"
								color="warning"
							/>
							<span class="text-caption">{{ item.streak }}</span>
						</span>
						<span
							v-if="item.suggestedTime"
							class="d-flex align-center ga-1"
						>
							<VIcon
								icon="clock"
								size="10"
							/>
							<span class="text-caption">{{ formatDuration(item.suggestedTime.getInMinutes) }}</span>
						</span>
					</VListItemSubtitle>
				</VListItem>
			</VList>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, inject, onMounted, ref, watch } from 'vue'
	import { useRoutineTodoListItemCrud } from '@/api/routineTodoList/routineTodoListApi.ts'
	import type { RoutineTodoListGroupedList } from '@/dtos/response/todoList/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'

	const emit = defineEmits<{
		'update:selectedItem': [item: RoutineTodoListItemEntity | null]
	}>()

	const { getAllGrouped } = useRoutineTodoListItemCrud()
	const groupedItems = ref<RoutineTodoListGroupedList[]>([])
	const loading = ref(true)
	const selectedPeriodId = ref<number | null>(null)
	const selectedItemId = ref<number | null>(null)

	const plannerStore = inject<IBaseDayPlannerStore<any, any>>('plannerStore')

	const periodSelectItems = computed(() =>
		groupedItems.value
			.filter(g => !g.timePeriod.isHidden)
			.map(g => ({ title: g.timePeriod.text, value: g.timePeriod.id as number })),
	)

	const currentGroup = computed(
		() => groupedItems.value.find(g => g.timePeriod.id === selectedPeriodId.value) ?? null,
	)

	const displayItems = computed<RoutineTodoListItemEntity[]>(() => currentGroup.value?.items ?? [])

	const plannedActivityCounts = computed(() => {
		const counts = new Map<number, number>()
		if (!plannerStore) return counts
		for (const task of plannerStore.tasks) {
			const id = task.activity.id
			counts.set(id, (counts.get(id) ?? 0) + 1)
		}
		return counts
	})

	function planCountForItem(item: RoutineTodoListItemEntity): number {
		return plannedActivityCounts.value.get(item.activity.id) ?? 0
	}

	const inPlanCount = computed(() => displayItems.value.reduce((sum, item) => sum + (planCountForItem(item) ?? 1), 0))
	const inPlanCountAllPlanned = computed(
		() => displayItems.value.filter(item => planCountForItem(item) === (item.totalCount ?? 1)).length,
	)
	const totalCount = computed(() => displayItems.value.reduce((sum, item) => sum + (item.totalCount ?? 1), 0))

	function formatDuration(minutes: number): string {
		if (minutes < 60) return `${minutes}m`
		const h = Math.floor(minutes / 60)
		const m = minutes % 60
		return m === 0 ? `${h}h` : `${h}h ${m}m`
	}

	function toggleItem(item: RoutineTodoListItemEntity) {
		if (selectedItemId.value === item.id) {
			selectedItemId.value = null
			emit('update:selectedItem', null)
		} else {
			selectedItemId.value = item.id
			emit('update:selectedItem', item)
		}
	}

	function clearSelection() {
		selectedItemId.value = null
		emit('update:selectedItem', null)
	}

	watch(
		() => plannerStore?.placingItem,
		item => {
			if (!item && selectedItemId.value !== null) clearSelection()
		},
	)

	watch(plannedActivityCounts, counts => {
		if (selectedItemId.value === null) return
		const selected = displayItems.value.find(i => i.id === selectedItemId.value)
		if (!selected) return
		if ((counts.get(selected.activity.id) ?? 0) >= (selected.totalCount ?? 1)) clearSelection()
	})

	defineExpose({ clearSelection })

	async function load() {
		loading.value = true
		try {
			groupedItems.value = await getAllGrouped()
			const firstVisible = groupedItems.value.find(g => !g.timePeriod.isHidden)
			if (firstVisible) selectedPeriodId.value = firstVisible.timePeriod.id as number
		} finally {
			loading.value = false
		}
	}

	onMounted(load)
</script>
