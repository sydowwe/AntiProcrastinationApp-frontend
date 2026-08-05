<template>
	<BasicTable
		v-model="items"
		v-model:itemsPerPage="itemsPerPage"
		v-model:page="page"
		v-model:sortBy="sortBy"
		v-model:loading="loading"
		:columns
		:itemsLength
		showActions
		@onLoadItems="loadItems"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #formattedColumn="{ key, value }">
			<template v-if="key === 'color'">
				<VSheet
					v-if="value"
					:color="value"
					width="24"
					height="24"
					rounded="circle"
				/>
				<span v-else>—</span>
			</template>
			<template v-else>{{ value ?? '—' }}</template>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import { Category } from '@/dtos/response/activity/Category.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { NameTextFilter } from '@/dtos/request/activity/NameTextFilter.ts'
	import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
	import { useActivityCategoryCrud } from '@/api/activity/activityCategoryApi.ts'
	import ActivityCategoryForm from '@/components/activity/activityCategory/ActivityCategoryForm.vue'
	import { useDialog } from '@/composables/general/useDialog.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { fetchFilteredTable, loading } = useFetchFilteredTable<Category, NameTextFilter>({
		responseClass: Category,
		entityName: 'activity-category',
	})
	const { deleteEntity } = useActivityCategoryCrud()
	const { openDialog } = useDialog()

	const items = ref<Category[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const columns: TableColumn[] = [
		new TableColumn('role', 'Role'),
		new TableColumn('name', 'Name'),
		new TableColumn('text', 'Text', false),
		new TableColumn('color', 'Color', false),
	]

	watch(
		() => props.filter,
		() => {
			page.value = 1
			loadItems()
		},
		{ deep: true },
	)

	async function loadItems() {
		const hasFilter = !!props.filter.name || !!props.filter.text
		const request = new FilteredTableRequest<NameTextFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			hasFilter,
			hasFilter ? props.filter : null,
		)
		const result = await fetchFilteredTable(request)
		items.value = result.items
		itemsLength.value = result.itemsCount
	}

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

	async function onDelete(item: Category) {
		await deleteEntity(item.id)
		await loadItems()
	}
</script>
