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
		@onAdd="roleDialog.openAddDialog()"
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
				<span v-else>—</span>
			</template>
			<template v-else>{{ value ?? '—' }}</template>
		</template>
	</BasicTable>

	<ActivityRoleDialog
		ref="roleDialog"
		@created="loadItems"
		@updated="loadItems"
	/>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue'
	import { Role } from '@/dtos/response/activity/Role.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import type { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
	import type { NameTextFilter } from '@/dtos/request/activity/NameTextFilter.ts'
	import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
	import { useActivityRoleCrud } from '@/api/activity/activityRoleApi.ts'
	import { useColor } from '@/utils/colorPalette.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { getBgColor } = useColor()
	const { fetchFilteredTable, loading } = useFetchFilteredTable<Role, NameTextFilter>(Role, 'activity-role')
	const { deleteEntity } = useActivityRoleCrud()

	const items = ref<Role[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const roleDialog = ref<InstanceType<typeof ActivityRoleDialog>>()

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

	function onEdit(item: Role) {
		roleDialog.value!.openEditDialog(item)
	}

	async function onDelete(item: Role) {
		await deleteEntity(item.id)
		await loadItems()
	}
</script>
