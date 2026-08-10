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
	import { ref, watch } from 'vue'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import ActivityForm from '@/core/activity/component/ActivityForm.vue'
	import { Activity } from '@/core/activity/dto/response/Activity.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
	import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const props = defineProps<{ filter: ActivityFilter }>()

	const { fetchFilteredTable, loading } = useFetchFilteredTable<Activity, ActivityFilter>({
		responseClass: Activity,
		entityName: 'activity',
	})
	const { deleteEntity } = useActivityCrud()
	const { openDialog } = useDialog()

	const items = ref<Activity[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const columns: TableColumn[] = [
		new TableColumn('name', 'Name'),
		new TableColumn('role.name', 'Role', false),
		new TableColumn('category.name', 'Category', false),
		new TableColumn('text', 'Text', false),
		new TableColumn('isUnavoidable', 'Unavoidable', false),
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
		const f = props.filter
		const hasFilter =
			!!f.name || !!f.text || !!f.roleName || !!f.roleIds?.length || !!f.categoryName || !!f.categoryIds?.length
		const request = new FilteredTableRequest<ActivityFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			hasFilter,
			hasFilter ? f : null,
		)
		const result = await fetchFilteredTable(request)
		items.value = result.items
		itemsLength.value = result.itemsCount
	}

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

	async function onDelete(item: Activity) {
		await deleteEntity(item.id)
		await loadItems()
	}
</script>
