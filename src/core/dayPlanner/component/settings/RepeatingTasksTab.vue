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
		<!-- A paused rule is dimmed everywhere but its switch, which is how it is turned back on. -->
		<template #item.activity="{ item }">
			<div
				class="d-flex align-center ga-2"
				:style="pausedStyle(item.id)"
			>
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
			<span :style="pausedStyle(item.id)">
				{{ taskById(item.id)?.startTime.getString() }} – {{ taskById(item.id)?.endTime.getString() }}
			</span>
		</template>
		<template #item.recurrenceType="{ item }">
			<VChip
				size="small"
				:prependIcon="getRecurrenceTypeIcon(taskById(item.id)!.recurrenceType)"
				variant="tonal"
				color="primaryOutline"
				:style="pausedStyle(item.id)"
			>
				{{ $t(`planner.recurrenceType.${item.recurrenceType}`) }}
			</VChip>
		</template>
		<template #item.schedule="{ item }">
			<span :style="pausedStyle(item.id)">
				{{ taskById(item.id) ? describeRule(taskById(item.id)!) : '' }}
			</span>
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
		:persistent="false"
		:title="$t('general.delete')"
		:text="$t('planner.settings.deleteRepeatingTaskConfirm')"
		confirmBtnColor="error"
		:confirmBtnLabel="$t('general.delete')"
		@confirmed="confirmDelete"
	/>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import RepeatingTaskDialog from '@/core/dayPlanner/component/settings/RepeatingTaskDialog.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { TableAction } from '@/_common/dto/dto/table/TableAction.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useRepeatingPlannerTaskApi } from '@/core/dayPlanner/api/repeatingPlannerTaskApi.ts'
	import type { RepeatingPlannerTask } from '@/core/dayPlanner/dto/response/RepeatingPlannerTask.ts'
	import { RepeatingPlannerTaskRequest } from '@/core/dayPlanner/dto/request/RepeatingPlannerTaskRequest.ts'
	import { getRecurrenceTypeIcon } from '@/core/dayPlanner/dto/enum/RecurrenceType.ts'
	import { useRecurrenceSummary } from '@/core/dayPlanner/composable/useRecurrenceSummary.ts'

	const { t } = useI18n()
	const { describeRule } = useRecurrenceSummary()
	const { fetchAll, fetchById, createWithResponse, update, deleteEntity } = useRepeatingPlannerTaskApi()

	const tasks = ref<RepeatingPlannerTask[]>([])
	const taskDialog = ref<InstanceType<typeof RepeatingTaskDialog>>()
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])
	const loading = ref(false)
	const deleteDialog = ref(false)
	const pendingDeleteId = ref<number | null>(null)

	// Computed, not plain arrays: a list built at setup freezes whichever locale was active then — the
	// boot default, before the account's own locale lands — and the headers never follow.
	const columns = computed<TableColumn[]>(() => [
		new TableColumn('activity', t('planner.settings.columns.activity'), false),
		new TableColumn('time', t('planner.settings.columns.time'), false),
		new TableColumn('recurrenceType', t('planner.settings.columns.recurrence'), false),
		new TableColumn('schedule', t('planner.settings.columns.schedule'), false),
		new TableColumn('isActive', t('planner.settings.columns.active'), false),
	])

	const tableActions = computed<TableAction[]>(() => [
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
	])

	function taskById(id: number) {
		return tasks.value.find(t => t.id === id)
	}

	function pausedStyle(id: number) {
		return taskById(id)?.isActive === false ? 'opacity: 0.5' : undefined
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

	// The update is a full replace, validated like a create, so the toggle sends the whole rule. It used to
	// send `{ isActive }` alone, which the server rejected for its missing activity and importance.
	async function onToggleActive(item: RepeatingPlannerTask) {
		const req = RepeatingPlannerTaskRequest.fromEntity(item)
		req.isActive = !item.isActive
		await update(item.id, req)
		item.isActive = req.isActive
	}
</script>
