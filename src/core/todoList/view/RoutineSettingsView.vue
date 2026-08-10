<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-4">
		<div class="d-flex align-center ga-3">
			<h2>Time Periods</h2>
			<VBtn
				color="primary"
				prependIcon="plus"
				@click="openAddDialog"
			>
				Add
			</VBtn>
		</div>
		<PersonalBestsPanel :timePeriods="timePeriods" />
		<BasicTable
			:items="timePeriods"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			:loading
			:columns
			:itemsLength="timePeriods.length"
			:showSelect="false"
			:showActionsHeader="false"
			@onLoadItems="loadItems"
			@onEdit="openEditDialog"
			@onDelete="onDelete"
		>
			<template #item.color="{ item }">
				<div class="d-flex justify-center">
					<VSheet
						v-if="item.color"
						:color="getBgColor(item.color)"
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
			<template #item.streakThreshold="{ item }">{{ item.streakThreshold }}%</template>
			<template #item.streakGraceDays="{ item }">
				{{ item.streakGraceDays > 0 ? `${item.streakGraceDays}d` : '—' }}
			</template>
			<template #item.resetAnchorDay="{ item }">
				{{ item.resetAnchorDay > 0 ? formatAnchorDay(item.id, item.resetAnchorDay) : '—' }}
			</template>
			<template #item.isHidden="{ item }">
				<VSwitch
					class="mx-auto pr-4"
					style="width: fit-content"
					:modelValue="item.isHidden"
					color="primaryOutline"
					@update:modelValue="onVisibilityChange($event, item.id)"
					hideDetails
				></VSwitch>
			</template>
		</BasicTable>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import type { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import TimePeriodForm from '@/core/todoList/component/routine/dialog/TimePeriodForm.vue'
	import PersonalBestsPanel from '@/core/todoList/component/routine/PersonalBestsPanel.vue'
	import { useI18n } from 'vue-i18n'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const { fetchAll, createWithResponse, update, deleteEntity, changeTimePeriodVisibility } =
		useRoutineTimePeriodCrud()
	const { getBgColor } = useColor()
	const { openDialog } = useDialog()
	const { t } = useI18n()

	const timePeriods = ref<RoutineTimePeriodEntity[]>([])
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

	async function openAddDialog() {
		const result = await openDialog<{ idToEdit: number | null; request: TimePeriodRequest }>({
			component: TimePeriodForm,
			dialogProps: {
				title: 'Add time period',
				confirmBtnLabel: t('general.create'),
			},
		})
		if (!result) return
		const created = await createWithResponse(result.request)
		timePeriods.value.push(created)
	}

	async function openEditDialog(entityToEdit: RoutineTimePeriodEntity) {
		const result = await openDialog<{ idToEdit: number | null; request: TimePeriodRequest }>({
			component: TimePeriodForm,
			componentProps: { entityToEdit },
			dialogProps: {
				title: 'Edit time period',
				confirmBtnLabel: t('general.save'),
			},
		})
		if (!result || result.idToEdit === null) return
		await update(result.idToEdit, result.request)
		const index = timePeriods.value.findIndex(p => p.id === result.idToEdit)
		if (index !== -1) {
			timePeriods.value[index] = { ...timePeriods.value[index], ...result.request }
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
