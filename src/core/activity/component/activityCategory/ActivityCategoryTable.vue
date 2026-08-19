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
	import { Category } from '@/core/activity/dto/response/Category.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
	import { useActivityCategoryCrud } from '@/core/activity/api/activityCategoryApi.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import ActivityCategoryForm from '@/core/activity/component/activityCategory/ActivityCategoryForm.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { getBgColor } = useColor()
	const { deleteEntity } = useActivityCategoryCrud()
	const { openDialog } = useDialog()

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, columns, loadItems, onDelete } = useLookupTable<
		Category,
		NameTextFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Category,
		entityName: 'activity-category',
		deleteEntity,
		columns: [
			new TableColumn('role', 'Role'),
			new TableColumn('name', 'Name'),
			new TableColumn('text', 'Text', false),
			new TableColumn('color', 'Color', false),
		],
		hasFilter: f => !!f.name || !!f.text,
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityCategoryForm,
			dialogProps: { title: 'Add new category', confirmBtnLabel: 'Create' },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Category) {
		const result = await openDialog({
			component: ActivityCategoryForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: 'Edit category', confirmBtnLabel: 'Save' },
		})
		if (result) await loadItems()
	}
</script>
