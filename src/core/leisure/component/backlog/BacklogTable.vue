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
		<template #item.activity.name="{ item }">
			<span>{{ item.activity.name ?? '—' }}</span>
		</template>
		<template #item.isOneTime="{ item }">
			<VIcon
				:color="item.isOneTime ? 'primary' : 'grey'"
				:icon="item.isOneTime ? 'star' : 'rotate'"
				size="16"
			/>
		</template>
		<template
			v-for="col in lookupColumns"
			:key="col"
			#[`item.${col}`]="{ item }"
		>
			<span>{{ getLookupValue(item, col)?.text ?? '—' }}</span>
		</template>
		<template
			v-for="col in enumColumns"
			:key="col"
			#[`item.${col}`]="{ item }"
		>
			<span>{{ getEnumValue(item, col) == null ? '—' : $t(`enums.${col}.${getEnumValue(item, col)}`) }}</span>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import BacklogProfileForm from '@/core/leisure/component/backlog/BacklogProfileForm.vue'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
	import { useActivityBacklogProfileCrud } from '@/core/leisure/api/activityBacklogProfileApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'

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

	const lookupColumns = ['locationType', 'weatherDependency', 'expectedCostTier']
	const enumColumns = ['energyLevel', 'effortType']

	function getLookupValue(item: ActivityBacklogProfile, col: string) {
		return (item as unknown as Record<string, LookupResponse>)[col]
	}

	function getEnumValue(item: ActivityBacklogProfile, col: string) {
		return (item as unknown as Record<string, unknown>)[col]
	}

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
