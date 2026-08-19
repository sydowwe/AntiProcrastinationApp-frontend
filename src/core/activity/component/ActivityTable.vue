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
		<template #item.role.name="{ item }">
			<span>{{ item.role?.name ?? '—' }}</span>
		</template>
		<template #item.category.name="{ item }">
			<span>{{ item.category?.name ?? '—' }}</span>
		</template>
		<template #item.isUnavoidable="{ item }">
			<VIcon
				:color="item.isUnavoidable ? 'successDark' : 'grey'"
				:icon="item.isUnavoidable ? 'check' : 'xmark'"
				size="16"
			/>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { toRef } from 'vue'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import ActivityForm from '@/core/activity/component/ActivityForm.vue'
	import { Activity } from '@/core/activity/dto/response/Activity.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'

	const props = defineProps<{ filter: ActivityFilter }>()

	const { deleteEntity } = useActivityCrud()
	const { openDialog } = useDialog()

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, columns, loadItems, onDelete } = useLookupTable<
		Activity,
		ActivityFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Activity,
		entityName: 'activity',
		deleteEntity,
		columns: [
			new TableColumn('name', 'Name'),
			new TableColumn('role.name', 'Role', false),
			new TableColumn('category.name', 'Category', false),
			new TableColumn('text', 'Text', false),
			new TableColumn('isUnavoidable', 'Unavoidable', false),
		],
		hasFilter: f =>
			!!f.name || !!f.text || !!f.roleName || !!f.roleIds?.length || !!f.categoryName || !!f.categoryIds?.length,
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityForm,
			dialogProps: { title: 'Create Activity', confirmBtnLabel: 'Create', isSmall: false },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Activity) {
		const result = await openDialog({
			component: ActivityForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: 'Edit Activity', confirmBtnLabel: 'Save', isSmall: false },
		})
		if (result) await loadItems()
	}
</script>
