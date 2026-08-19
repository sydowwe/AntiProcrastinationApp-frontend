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
	import { computed, toRef } from 'vue'
	import { useI18n } from 'vue-i18n'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import ActivityForm from '@/core/activity/component/ActivityForm.vue'
	import { Activity } from '@/core/activity/dto/response/Activity.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'

	const props = defineProps<{ filter: ActivityFilter }>()

	const { t } = useI18n()
	const { deleteEntity } = useActivityCrud()
	const { openDialog } = useDialog()

	const columns = computed(() => [
		new TableColumn('name', t('general.name')),
		new TableColumn('role.name', t('activities.role'), false),
		new TableColumn('category.name', t('activities.category'), false),
		new TableColumn('text', t('general.text'), false),
		new TableColumn('isUnavoidable', t('activities.unavoidable'), false),
	])

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, loadItems, onDelete } = useLookupTable<
		Activity,
		ActivityFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Activity,
		entityName: 'activity',
		deleteEntity,
		columns,
		hasFilter: f =>
			!!f.name || !!f.text || !!f.roleName || !!f.roleIds?.length || !!f.categoryName || !!f.categoryIds?.length,
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityForm,
			dialogProps: {
				title: t('activities.createNewActivity'),
				confirmBtnLabel: t('general.create'),
				isSmall: false,
			},
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Activity) {
		const result = await openDialog({
			component: ActivityForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('activities.editActivity'), confirmBtnLabel: t('general.save'), isSmall: false },
		})
		if (result) await loadItems()
	}
</script>
