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
	>
		<template #actions="{ item }">
			<VIconBtn
				icon="pen"
				variant="tonal"
				size="small"
				color="secondaryOutline"
				:title="t('general.edit')"
				:disabled="busyId === item.id"
				@click="onEdit(item)"
			>
				<VIcon size="15"></VIcon>
			</VIconBtn>
			<!-- The server refuses a system role or a role in use with a 409, and `canDelete` predicts
			     exactly that, so the button is disabled and says why rather than letting the delete fail.
			     Same wrapper-tooltip and `aria-label` shape as `ActivityTable`'s trash button. -->
			<span class="d-inline-flex">
				<VIconBtn
					icon="trash"
					variant="tonal"
					size="small"
					color="base"
					:aria-label="deleteLabel(item)"
					:disabled="!item.canDelete || busyId === item.id"
					@click="onDeleteRole(item)"
				>
					<VIcon size="15"></VIcon>
				</VIconBtn>
				<VTooltip
					activator="parent"
					location="top"
					:text="deleteLabel(item)"
				/>
			</span>
		</template>
		<template #item.icon="{ item }">
			<VIcon
				v-if="item.icon"
				:icon="item.icon"
				size="18"
			/>
			<span v-else>—</span>
		</template>
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
		<template #noData>
			<TableEmptyState
				:explanation="t('activities.noRolesInTable')"
				:isFiltered
				:createLabel="t('activities.addNewRole')"
				@create="openCreateDialog"
			/>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { computed, ref, toRef } from 'vue'
	import { useI18n } from 'vue-i18n'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import TableEmptyState from '@/core/activity/component/TableEmptyState.vue'
	import { Role } from '@/core/activity/dto/response/Role.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
	import { useActivityRoleCrud } from '@/core/activity/api/activityRoleApi.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import ActivityRoleForm from '@/core/activity/component/activityRole/ActivityRoleForm.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { t } = useI18n()
	const { getBgColor } = useColor()
	const { deleteEntity } = useActivityRoleCrud()
	const { openDialog, confirm } = useDialog()

	/** The row a delete is in flight for; its actions are dead until it resolves. */
	const busyId = ref<number | null>(null)

	const columns = computed(() => [
		new TableColumn('name', t('general.name')),
		new TableColumn('text', t('general.text'), false),
		new TableColumn('icon', t('activities.icon'), false),
		new TableColumn('color', t('activities.color'), false),
	])

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, isFiltered, loadItems, onDelete } = useLookupTable<
		Role,
		NameTextFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Role,
		entityName: 'activity-role',
		deleteEntity,
		columns,
		hasFilter: f => !!f.name || !!f.text,
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityRoleForm,
			dialogProps: { title: t('activities.addNewRole'), confirmBtnLabel: t('general.create') },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Role) {
		const result = await openDialog({
			component: ActivityRoleForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('activities.editRole'), confirmBtnLabel: t('general.save') },
		})
		if (result) await loadItems()
	}

	function deleteLabel(item: Role): string {
		if (item.canDelete) return t('general.delete')
		return item.systemKey
			? t('activities.roleDeleteBlockedSystem')
			: t('activities.roleDeleteBlockedInUse', { count: item.usageCount })
	}

	/**
	 * Confirms unconditionally, like `ActivityTable`'s delete. `canDelete` means nothing references the
	 * role, so there is nothing to count and nothing for `useDeleteConfirmation` to weigh. A 409 from a
	 * race (an activity gained the role since the grid loaded) is the interceptor's snackbar.
	 */
	async function onDeleteRole(item: Role) {
		if (!item.canDelete) return
		const confirmed = await confirm({
			title: t('general.deleteConfirmationTitle'),
			text: t('general.deleteConfirmationText', { name: item.name }),
			confirmBtnColor: 'error',
			confirmBtnLabel: t('general.delete'),
		})
		if (!confirmed) return

		busyId.value = item.id
		try {
			await onDelete(item)
		} finally {
			busyId.value = null
		}
	}
</script>
