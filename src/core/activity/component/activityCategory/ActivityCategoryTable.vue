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
			<!-- Never disabled: the server deletes a used category and only blanks its activities'
			     classification. `canDelete` is advisory there, so the count goes into the confirmation. -->
			<VIconBtn
				icon="trash"
				variant="tonal"
				size="small"
				color="base"
				:title="t('general.delete')"
				:disabled="busyId === item.id"
				@click="onDeleteCategory(item)"
			>
				<VIcon size="15"></VIcon>
			</VIconBtn>
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
				:explanation="t('activities.noCategoriesInTable')"
				:isFiltered
				:createLabel="t('activities.addNewCategory')"
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
	import { Category } from '@/core/activity/dto/response/Category.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
	import { useActivityCategoryCrud } from '@/core/activity/api/activityCategoryApi.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import ActivityCategoryForm from '@/core/activity/component/activityCategory/ActivityCategoryForm.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'

	const props = defineProps<{ filter: NameTextFilter }>()

	const { t } = useI18n()
	const { getBgColor } = useColor()
	const { deleteEntity } = useActivityCategoryCrud()
	const { openDialog, confirm } = useDialog()
	const { shouldConfirm } = useDeleteConfirmation()

	/** The row a delete is in flight for; its actions are dead until it resolves. */
	const busyId = ref<number | null>(null)

	const columns = computed(() => [
		// Key stays `role` — the server remaps it to its RoleSortKey. The value is every distinct role
		// worn by the category's activities, comma-joined; a category has no role of its own.
		new TableColumn('role', t('activities.rolesInUse')),
		new TableColumn('name', t('general.name')),
		new TableColumn('text', t('general.text'), false),
		new TableColumn('icon', t('activities.icon'), false),
		new TableColumn('color', t('activities.color'), false),
	])

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, isFiltered, loadItems, onDelete } = useLookupTable<
		Category,
		NameTextFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Category,
		entityName: 'activity-category',
		deleteEntity,
		columns,
		hasFilter: f => !!f.name || !!f.text,
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityCategoryForm,
			dialogProps: { title: t('activities.addNewCategory'), confirmBtnLabel: t('general.create') },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Category) {
		const result = await openDialog({
			component: ActivityCategoryForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('activities.editCategory'), confirmBtnLabel: t('general.save') },
		})
		if (result) await loadItems()
	}

	/**
	 * A used category takes other rows' state with it (its activities lose their classification), so
	 * it is a cascade in `useDeleteConfirmation`'s sense: it always confirms and says how many, whatever
	 * `askBeforeDelete` says. An unused one is a plain leaf, and the preference decides. There is no
	 * undo path here.
	 */
	async function onDeleteCategory(item: Category) {
		const cascades = item.usageCount > 0
		if (shouldConfirm({ cascades, undoable: false })) {
			const confirmed = await confirm({
				title: t('general.deleteConfirmationTitle'),
				text: t('general.deleteConfirmationText', { name: item.name }),
				detail: cascades ? t('activities.categoryDeleteCascade', { count: item.usageCount }) : undefined,
				confirmBtnColor: 'error',
				confirmBtnLabel: t('general.delete'),
			})
			if (!confirmed) return
		}

		busyId.value = item.id
		try {
			await onDelete(item)
		} finally {
			busyId.value = null
		}
	}
</script>
