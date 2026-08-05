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
					:color="getBgColor(value)"
					width="24"
					height="24"
					rounded="circle"
				/>
				<span v-else>â€”</span>
			</template>
			<template v-else>{{ value ?? 'â€”' }}</template>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import { Role } from '@/dtos/response/activity/Role.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { NameTextFilter } from '@/dtos/request/activity/NameTextFilter.ts'
	import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
	import { useActivityRoleCrud } from '@/api/activity/activityRoleApi.ts'
	import { useColor } from '@/utils/colorPalette.ts'
	import ActivityRoleForm from '@/components/activity/activityRole/ActivityRoleForm.vue'
	import { useDialog } from '@/composables/general/useDialog.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { getBgColor } = useColor()
	const { fetchFilteredTable, loading } = useFetchFilteredTable<Role, NameTextFilter>({
		responseClass: Role,
		entityName: 'activity-role',
	})
	const { deleteEntity } = useActivityRoleCrud()
	const { openDialog } = useDialog()

	const items = ref<Role[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

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

	async function onDelete(item: Role) {
		await deleteEntity(item.id)
		await loadItems()
	}
</script>
