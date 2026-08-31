<template>
	<BasicTable
		class="flex-fill"
		:items="tasks"
		v-model:itemsPerPage="itemsPerPage"
		v-model:page="page"
		v-model:sortBy="sortBy"
		:loading
		:columns
		:actions="tableActions"
		:itemsLength="tasks.length"
		:showSelect="false"
		@onAdd="taskDialog?.openAddDialog"
		@onLoadItems="loadItems"
	>
		<template #item.activity="{ item }">
			<div class="d-flex align-center ga-2">
				<VSheet
					:color="taskById(item.id)?.color || 'primary'"
					width="10"
					height="10"
					rounded="circle"
				/>
				{{ taskById(item.id)?.activity.name }}
			</div>
		</template>
		<template #item.time="{ item }">
			{{ taskById(item.id)?.startTime.getString() }} – {{ taskById(item.id)?.endTime.getString() }}
		</template>
		<template #item.recurrenceType="{ item }">
			<VChip
				size="small"
				:prependIcon="getRecurrenceTypeIcon(taskById(item.id)!.recurrenceType)"
				variant="tonal"
				color="primaryOutline"
			>
				{{ $t(`planner.recurrenceType.${item.recurrenceType}`) }}
			</VChip>
		</template>
		<template #item.isActive="{ item }">
			<VSwitch
				class="mx-auto pr-4"
				style="width: fit-content"
				:modelValue="item.isActive"
				color="successDark"
				hideDetails
				@update:modelValue="onToggleActive(taskById(item.id)!)"
			/>
		</template>
	</BasicTable>

	<RepeatingTaskDialog
		ref="taskDialog"
		@create="onCreate"
		@edit="onEdit"
	/>

	<MyDialog
		v-model="deleteDialog"
		:title="$t('general.delete')"
		:text="$t('planner.settings.deleteRepeatingTaskConfirm')"
		confirmBtnColor="error"
		:confirmBtnLabel="$t('general.delete')"
		@confirmed="confirmDelete"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import RepeatingTaskDialog from '@/core/dayPlanner/component/settings/RepeatingTaskDialog.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { TableAction } from '@/_common/dto/dto/table/TableAction.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useRepeatingPlannerTaskApi } from '@/core/dayPlanner/api/repeatingPlannerTaskApi.ts'
	import type { RepeatingPlannerTask } from '@/core/dayPlanner/dto/response/RepeatingPlannerTask.ts'
	import type { RepeatingPlannerTaskRequest } from '@/core/dayPlanner/dto/request/RepeatingPlannerTaskRequest.ts'
	import { getRecurrenceTypeIcon } from '@/core/dayPlanner/dto/enum/RecurrenceType.ts'

	const { t } = useI18n()
	const { fetchAll, fetchById, createWithResponse, update, deleteEntity } = useRepeatingPlannerTaskApi()

	const tasks = ref<RepeatingPlannerTask[]>([])
	const taskDialog = ref<InstanceType<typeof RepeatingTaskDialog>>()
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])
	const loading = ref(false)
	const deleteDialog = ref(false)
	const pendingDeleteId = ref<number | null>(null)

	const columns: TableColumn[] = [
		new TableColumn('activity', t('planner.settings.columns.activity'), false),
		new TableColumn('time', t('planner.settings.columns.time'), false),
		new TableColumn('recurrenceType', t('planner.settings.columns.recurrence'), false),
		new TableColumn('isActive', t('planner.settings.columns.active'), false),
	]

	const tableActions: TableAction[] = [
		new TableAction('edit', t('general.edit'), 'primaryOutline', 'tonal', 'pen', (item: RepeatingPlannerTask) =>
			taskDialog.value?.openEditDialog(item),
		),
		new TableAction(
			'delete',
			t('general.delete'),
			'secondaryOutline',
			'tonal',
			'trash',
			(item: RepeatingPlannerTask) => {
				pendingDeleteId.value = item.id
				deleteDialog.value = true
			},
		),
	]

	function taskById(id: number) {
		return tasks.value.find(t => t.id === id)
	}

	async function loadItems() {
		loading.value = true
		tasks.value = await fetchAll()
		loading.value = false
	}

	async function onCreate(req: RepeatingPlannerTaskRequest) {
		const created = await createWithResponse(req)
		tasks.value.push(created)
	}

	async function onEdit(id: number, req: RepeatingPlannerTaskRequest) {
		await update(id, req)
		const updated = await fetchById(id)
		const idx = tasks.value.findIndex(t => t.id === id)
		if (idx >= 0) tasks.value[idx] = updated
	}

	async function confirmDelete() {
		if (pendingDeleteId.value === null) return
		await deleteEntity(pendingDeleteId.value)
		tasks.value = tasks.value.filter(t => t.id !== pendingDeleteId.value)
		pendingDeleteId.value = null
	}

	async function onToggleActive(item: RepeatingPlannerTask) {
		const req: Partial<RepeatingPlannerTaskRequest> = { isActive: !item.isActive }
		await update(item.id, req as RepeatingPlannerTaskRequest)
		item.isActive = !item.isActive
	}
</script>
