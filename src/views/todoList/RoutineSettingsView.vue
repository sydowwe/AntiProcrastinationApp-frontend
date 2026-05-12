<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-4">
		<div class="d-flex align-center ga-3">
			<h2>Time Periods</h2>
			<VBtn
				color="primary"
				prependIcon="plus"
				@click="timePeriodDialog?.openAddDialog()"
			>
				Add
			</VBtn>
		</div>
		<BasicTable
			v-model="timePeriods"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			v-model:loading="loading"
			:columns
			:itemsLength="timePeriods.length"
			:showSelect="false"
			:showActionsHeader="false"
			@onLoadItems="loadItems"
			@onEdit="timePeriodDialog?.openEditDialog($event)"
			@onDelete="onDelete"
		>
			<template #formattedColumn="{ id, key, value }">
				<template v-if="key === 'color'">
					<div class="d-flex justify-center">
						<VSheet
							v-if="value"
							:color="getBgColor(value)"
							width="22"
							height="22"
							rounded="circle"
						/>
						<VIcon
							v-else
							icon="clock"
							size="22"
						/>
					</div>
				</template>
				<template v-else-if="key === 'streakThreshold'">{{ value }}%</template>
				<template v-else-if="key === 'streakGraceDays'">
					{{ (value as number) > 0 ? `${value}d` : '—' }}
				</template>
				<template v-else-if="key === 'resetAnchorDay'">
					{{ (value as number) > 0 ? formatAnchorDay(id, value as number) : '—' }}
				</template>
				<template v-else-if="key === 'isHidden'">
					<VSwitch
						class="mx-auto pr-4"
						style="width: fit-content"
						:modelValue="value"
						color="primaryOutline"
						@update:modelValue="onVisibilityChange"
						hideDetails
					></VSwitch>
				</template>
				<template v-else>{{ value ?? '—' }}</template>
			</template>
		</BasicTable>
	</div>
	<TimePeriodDialog
		ref="timePeriodDialog"
		@created="onCreated"
		@updated="onUpdated"
	></TimePeriodDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import type { TimePeriodRequest } from '@/dtos/request/activityRecording/TimePeriodRequest.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { useRoutineTimePeriodCrud } from '@/api/routineTodoList/timePeriodApi.ts'
	import { useColor } from '@/utils/colorPalette.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import TimePeriodDialog from '@/components/toDoList/routine/dialog/TimePeriodDialog.vue'

	const { fetchAll, deleteEntity, changeTimePeriodVisibility } = useRoutineTimePeriodCrud()
	const { getBgColor } = useColor()

	const timePeriods = ref<RoutineTimePeriodEntity[]>([])
	const timePeriodDialog = ref<InstanceType<typeof TimePeriodDialog>>()
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('lengthInDays', 'asc')])
	const loading = ref(false)

	const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

	const columns: TableColumn[] = [
		new TableColumn('color', '', false),
		new TableColumn('text', 'Name'),
		new TableColumn('lengthInDays', 'Length (days)'),
		new TableColumn('resetAnchorDay', 'Reset anchor', false),
		new TableColumn('streakThreshold', 'Streak threshold'),
		new TableColumn('streakGraceDays', 'Grace days'),
		new TableColumn('isHidden', 'Is hidden'),
	]

	async function loadItems() {
		loading.value = true
		timePeriods.value = await fetchAll()
		loading.value = false
	}

	function periodById(id: number): RoutineTimePeriodEntity | undefined {
		return timePeriods.value.find(p => p.id === id)
	}

	function isWeekAligned(lengthInDays: number): boolean {
		return lengthInDays <= 7 || lengthInDays % 7 === 0
	}

	function formatAnchorDay(id: number, value: number): string {
		const period = periodById(id)
		if (!period) return String(value)
		if (isWeekAligned(period.lengthInDays)) return weekDayNames[value - 1] ?? String(value)
		return `${value}th`
	}

	function onCreated(created: RoutineTimePeriodEntity) {
		timePeriods.value.push(created)
	}

	function onUpdated(updatedId: number, updatedRequest: TimePeriodRequest) {
		const index = timePeriods.value.findIndex(p => p.id === updatedId)
		if (index !== -1) {
			timePeriods.value[index] = { ...timePeriods.value[index], ...updatedRequest }
		}
	}

	async function onDelete(item: RoutineTimePeriodEntity) {
		await deleteEntity(item.id)
		timePeriods.value = timePeriods.value.filter(p => p.id !== item.id)
	}

	function onVisibilityChange(isHidden: boolean, id: number) {
		changeTimePeriodVisibility(id)
		const a = timePeriods.value.find(timePeriod => timePeriod.id === id)
		if (a) a.isHidden = isHidden
	}
</script>
