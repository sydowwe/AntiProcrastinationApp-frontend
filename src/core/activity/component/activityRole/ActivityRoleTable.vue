<template>
	<BasicTable
		:items
		v-model:itemsPerPage="itemsPerPage"
		v-model:page="page"
		v-model:sortBy="sortBy"
		:loading
		:columns
		:itemsLength
		showActions
		@onLoadItems="loadItems"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #item.color="{ item }">
			<VSheet
				v-if="item.color"
				:color="getBgColor(item.color)"
				width="24"
				height="24"
				rounded="circle"
			/>
			<span v-else>—</span>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { toRef } from 'vue'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import { Role } from '@/core/activity/dto/response/Role.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
	import { useActivityRoleCrud } from '@/core/activity/api/activityRoleApi.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import ActivityRoleForm from '@/core/activity/component/activityRole/ActivityRoleForm.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { getBgColor } = useColor()
	const { deleteEntity } = useActivityRoleCrud()
	const { openDialog } = useDialog()

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, columns, loadItems, onDelete } = useLookupTable<
		Role,
		NameTextFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Role,
		entityName: 'activity-role',
		deleteEntity,
		columns: [
			new TableColumn('name', 'Name'),
			new TableColumn('text', 'Text', false),
			new TableColumn('color', 'Color', false),
		],
		hasFilter: f => !!f.name || !!f.text,
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityRoleForm,
			dialogProps: { title: 'Add new role', confirmBtnLabel: 'Create' },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Role) {
		const result = await openDialog({
			component: ActivityRoleForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: 'Edit role', confirmBtnLabel: 'Save' },
		})
		if (result) await loadItems()
	}
</script>
