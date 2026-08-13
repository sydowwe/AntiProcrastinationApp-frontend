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
		deleteConfirmationColumn="activityName"
		@onLoadItems="emit('onLoadItems')"
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
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import BacklogProfileForm from '@/core/leisure/component/backlog/BacklogProfileForm.vue'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useActivityBacklogProfileCrud } from '@/core/leisure/api/activityBacklogProfileApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'

	// Paging/sorting/filtering state lives in the view's `useServerTable`; this component only
	// renders it and asks for a refetch.
	defineProps<{
		items: ActivityBacklogProfile[]
		loading: boolean
		itemsLength: number
	}>()
	const emit = defineEmits<{ onLoadItems: []; onReload: [] }>()
	const page = defineModel<number>('page', { required: true })
	const itemsPerPage = defineModel<number>('itemsPerPage', { required: true })
	const sortBy = defineModel<VSortItem[]>('sortBy', { required: true })
	const { deleteEntity } = useActivityBacklogProfileCrud()
	const { openDialog } = useDialog()
	const { t } = useI18n()

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

	async function openCreateDialog() {
		const result = await openDialog({
			component: BacklogProfileForm,
			dialogProps: { title: t('leisure.backlog'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}

	async function onEdit(item: ActivityBacklogProfile) {
		const result = await openDialog({
			component: BacklogProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.backlog'), confirmBtnLabel: t('general.save') },
		})
		if (result) emit('onReload')
	}

	async function onDelete(item: ActivityBacklogProfile) {
		await deleteEntity(item.activityId)
		emit('onReload')
	}
</script>
