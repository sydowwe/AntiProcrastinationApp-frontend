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
			<template v-if="key === 'role.name' || key === 'category.name'">
				<span>{{ value ?? '—' }}</span>
			</template>
			<template v-else-if="key === 'isUnavoidable'">
				<VIcon
					:color="value ? 'successDark' : 'grey'"
					:icon="value ? 'check' : 'xmark'"
					size="16"
				/>
			</template>
			<template v-else>{{ value ?? '—' }}</template>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import ActivityForm from '@/components/activity/ActivityForm.vue'
	import { Activity } from '@/dtos/response/activity/Activity.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { ActivityFilter } from '@/dtos/request/activity/ActivityFilter.ts'
	import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
	import { useActivityCrud } from '@/api/activity/activityApi.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'

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
