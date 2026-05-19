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
		deleteConfirmationColumn="activityName"
		@onLoadItems="loadItems"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #formattedColumn="{ key, value }">
			<template v-if="key === 'activity.name'">
				<span>{{ value ?? '—' }}</span>
			</template>
			<template v-else-if="key === 'isOneTime'">
				<VIcon
					:color="value ? 'primary' : 'grey'"
					:icon="value ? 'star' : 'rotate'"
					size="16"
				/>
			</template>
			<template v-else-if="enumColumns.includes(key)">
				<span>{{ value == null ? '—' : $t(`enums.${key}.${value}`) }}</span>
			</template>
			<template v-else>{{ value ?? '—' }}</template>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import BacklogProfileForm from '@/components/leisure/backlog/BacklogProfileForm.vue'
	import type { ActivityBacklogProfile } from '@/dtos/response/leisure/ActivityBacklogProfile.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import type { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
	import type { ActivityBacklogProfileFilter } from '@/dtos/request/leisure/ActivityBacklogProfileFilter.ts'
	import { useActivityBacklogProfileCrud } from '@/api/leisure/activityBacklogProfileApi.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const { filter } = defineProps<{ filter: ActivityBacklogProfileFilter }>()

	const { fetchFilteredTable, deleteEntity } = useActivityBacklogProfileCrud()
	const { openDialog } = useDialog()
	const { t } = useI18n()
	const loading = ref(false)

	const items = ref<ActivityBacklogProfile[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const enumColumns = ['locationType', 'weatherDependency', 'energyLevel', 'effortType', 'expectedCostTier']

	const columns: TableColumn[] = [
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('locationType', t('leisure.fields.locationType'), false),
		new TableColumn('weatherDependency', t('leisure.fields.weatherDependency'), false),
		new TableColumn('energyLevel', t('leisure.fields.energyLevel'), false),
		new TableColumn('expectedCostTier', t('leisure.fields.expectedCostTier'), false),
		new TableColumn('durationMinutes', t('leisure.fields.durationMinutes')),
		new TableColumn('isOneTime', t('leisure.fields.isOneTime'), false),
	]

	watch(
		() => filter,
		() => {
			page.value = 1
			loadItems()
		},
	)

	async function loadItems() {
		const request = new FilteredTableRequest<ActivityBacklogProfileFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			true,
			filter,
		)
		loading.value = true
		try {
			const result = await fetchFilteredTable(request)
			items.value = result.items
			itemsLength.value = result.itemsCount
		} finally {
			loading.value = false
		}
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: BacklogProfileForm,
			dialogProps: { title: t('leisure.backlog'), confirmBtnLabel: t('general.create') },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: ActivityBacklogProfile) {
		const result = await openDialog({
			component: BacklogProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.backlog'), confirmBtnLabel: t('general.save') },
		})
		if (result) await loadItems()
	}

	async function onDelete(item: ActivityBacklogProfile) {
		await deleteEntity(item.activityId)
		await loadItems()
	}
</script>
