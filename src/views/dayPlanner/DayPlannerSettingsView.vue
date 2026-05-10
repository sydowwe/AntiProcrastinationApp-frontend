<template>
	<div class="py-4 h-100 w-100 d-flex flex-column">
		<div class="d-flex align-center ga-3">
			<h2>Day Planner Settings</h2>
		</div>

		<VTabs
			v-model="activeTab"
			color="primaryOutline"
		>
			<VTab value="repeating">Repeating Tasks</VTab>
		</VTabs>

		<VTabsWindow
			v-model="activeTab"
			class="flex-fill"
		>
			<VTabsWindowItem
				value="repeating"
				class="flex-fill d-flex flex-column ga-4 pt-3"
			>
				<BasicTable
					class="flex-fill"
					v-model="tasks"
					v-model:itemsPerPage="itemsPerPage"
					v-model:page="page"
					v-model:sortBy="sortBy"
					v-model:loading="loading"
					:columns
					:actions="tableActions"
					:itemsLength="tasks.length"
					:showSelect="false"
					@onAdd="taskDialog?.openAddDialog"
					@onLoadItems="loadItems"
				>
					<template #formattedColumn="{ id, key, value }">
						<template v-if="key === 'activity'">
							<div class="d-flex align-center ga-2">
								<VSheet
									:color="taskById(id)?.color || 'primary'"
									width="10"
									height="10"
									rounded="circle"
								/>
								{{ taskById(id)?.activity.name }}
							</div>
						</template>
						<template v-else-if="key === 'time'">
							{{ taskById(id)?.startTime.getString() }} – {{ taskById(id)?.endTime.getString() }}
						</template>
						<template v-else-if="key === 'recurrenceType'">
							<VChip
								size="small"
								:prependIcon="getRecurrenceTypeIcon(taskById(id)!.recurrenceType)"
								variant="tonal"
								color="primaryOutline"
							>
								{{ value }}
							</VChip>
						</template>
						<template v-else-if="key === 'isActive'">
							<VSwitch
								class="mx-auto pr-4"
								style="width: fit-content"
								:modelValue="value"
								color="successDark"
								hideDetails
								@update:modelValue="onToggleActive(taskById(id)!)"
							/>
						</template>
						<template v-else>{{ value ?? '—' }}</template>
					</template>
				</BasicTable>
			</VTabsWindowItem>
		</VTabsWindow>
	</div>

	<RepeatingTaskDialog
		ref="taskDialog"
		@create="onCreate"
		@edit="onEdit"
	/>

	<MyDialog
		v-model="deleteDialog"
		title="Delete"
		text="Delete this repeating task?"
		confirmBtnColor="error"
		confirmBtnLabel="Delete"
		@confirmed="confirmDelete"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import RepeatingTaskDialog from '@/components/dayPlanner/settings/RepeatingTaskDialog.vue'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { TableAction } from '@/dtos/dto/TableAction.ts'
	import { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { useRepeatingPlannerTaskApi } from '@/api/taskPlanner/repeatingPlannerTaskApi.ts'
	import type { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'
	import type { RepeatingPlannerTaskRequest } from '@/dtos/request/activityPlanning/RepeatingPlannerTaskRequest.ts'
	import { getRecurrenceTypeIcon } from '@/dtos/enum/RecurrenceType.ts'

	const { fetchAll, fetchById, createWithResponse, update, deleteEntity } = useRepeatingPlannerTaskApi()

	const tasks = ref<RepeatingPlannerTask[]>([])
	const taskDialog = ref<InstanceType<typeof RepeatingTaskDialog>>()
	const activeTab = ref('repeating')
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])
	const loading = ref(false)
	const deleteDialog = ref(false)
	const pendingDeleteId = ref<number | null>(null)

	const columns: TableColumn[] = [
		new TableColumn('activity', 'Activity', false),
		new TableColumn('time', 'Time', false),
		new TableColumn('recurrenceType', 'Recurrence', false),
		new TableColumn('isActive', 'Active', false),
	]

	const tableActions: TableAction[] = [
		new TableAction('edit', 'Edit', 'primaryOutline', 'tonal', 'pen', (item: RepeatingPlannerTask) =>
			taskDialog.value?.openEditDialog(item),
		),
		new TableAction('delete', 'Delete', 'secondaryOutline', 'tonal', 'trash', (item: RepeatingPlannerTask) => {
			pendingDeleteId.value = item.id
			deleteDialog.value = true
		}),
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
