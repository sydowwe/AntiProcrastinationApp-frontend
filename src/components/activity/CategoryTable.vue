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
		@onAdd="categoryDialog.openAddDialog()"
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

	<ActivityCategoryDialog
		ref="categoryDialog"
		@created="loadItems"
		@updated="loadItems"
	/>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue'
	import { Category } from '@/dtos/response/activity/Category.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import type { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
	import type { NameTextFilter } from '@/dtos/request/activity/NameTextFilter.ts'
	import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
	import { useActivityCategoryCrud } from '@/api/activity/activityCategoryApi.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { fetchFilteredTable, loading } = useFetchFilteredTable<Category, NameTextFilter>(
		Category,
		'activity-category',
	)
	const { deleteEntity } = useActivityCategoryCrud()

	const items = ref<Category[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const categoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>()

	const columns: TableColumn[] = [
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

	function onEdit(item: Category) {
		categoryDialog.value!.openEditDialog(item)
	}

	async function onDelete(item: Category) {
		await deleteEntity(item.id)
		await loadItems()
	}
</script>
