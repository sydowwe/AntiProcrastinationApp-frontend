<template>
	<VCard
		v-if="visible"
		class="d-flex flex-column"
		color="surface"
		elevation="8"
		style="width: 415px; min-width: 280px"
	>
		<VCardTitle class="pt-5 px-5 pb-0 d-flex justify-space-between align-center">
			<span class="text-grey-lighten-1">Routine Tasks</span>
			<VIconBtn
				color="secondaryOutline"
				icon="xmark"
				variant="tonal"
				size="40"
				@click="closePanel"
			>
				<VIcon size="28"></VIcon>
			</VIconBtn>
		</VCardTitle>
		<VCardText
			class="flex-fill py-4 d-flex flex-column"
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
				<VChip
					v-if="displayItems.length > 0"
					class="mx-auto mt-4"
				>
					{{ inPlanCount }} / {{ displayItems.length }} in plan
				</VChip>
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
						:active="selectedItemId === item.id"
						activeColor="secondary"
						rounded="lg"
						class="my-1"
						style="cursor: pointer"
						@click="toggleItem(item)"
					>
						<template #prepend>
							<VSheet
								class="text-caption text-medium-emphasis"
								:class="
									planCountForItem(item) === (item.totalCount ? item.totalCount : 1)
										? 'text-success'
										: ''
								"
								style="
									border: 1px solid rgb(var(--v-border-color));
									border-radius: 8px;
									padding: 1px 6px;
								"
							>
								{{ planCountForItem(item) }} / {{ item.totalCount ? item.totalCount : 1 }}
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
						<template #append>
							<div class="d-flex align-center ga-1">
								<VIcon
									v-if="selectedItemId === item.id"
									icon="check"
									color="secondary"
									size="14"
								/>
							</div>
						</template>
					</VListItem>
				</VList>
			</template>
		</VCardText>
	</VCard>
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

	const visible = defineModel<boolean>('visible', { required: true })

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

	const displayItems = computed(() => currentGroup.value?.items ?? [])

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

	const inPlanCount = computed(() => displayItems.value.filter(item => planCountForItem(item) > 0).length)

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

	function closePanel() {
		selectedItemId.value = null
		emit('update:selectedItem', null)
		visible.value = false
	}

	watch(visible, newVal => {
		if (!newVal) {
			selectedItemId.value = null
			emit('update:selectedItem', null)
		}
	})

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
