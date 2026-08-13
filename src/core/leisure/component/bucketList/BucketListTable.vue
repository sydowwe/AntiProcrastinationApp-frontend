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
		@onLoadItems="emit('onLoadItems')"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #item.experienceType="{ item }">
			<span>{{ item.experienceType?.text ?? '—' }}</span>
		</template>
		<template #item.requiresTravel="{ item }">
			<VIcon
				:color="item.requiresTravel ? 'primary' : 'grey'"
				:icon="item.requiresTravel ? 'plane' : 'house'"
				size="16"
			/>
		</template>
		<template #item.comfortZoneStep="{ item }">
			<VChip
				:color="stepColor(item.comfortZoneStep)"
				size="small"
			>
				{{ item.comfortZoneStep }}/5
			</VChip>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import BucketListProfileForm from '@/core/leisure/component/bucketList/BucketListProfileForm.vue'
	import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	// Paging/sorting/filtering state lives in the view's `useServerTable`; this component only
	// renders it and asks for a refetch.
	defineProps<{
		items: ActivityBucketListProfile[]
		loading: boolean
		itemsLength: number
	}>()
	const emit = defineEmits<{ onLoadItems: []; onReload: [] }>()
	const page = defineModel<number>('page', { required: true })
	const itemsPerPage = defineModel<number>('itemsPerPage', { required: true })
	const sortBy = defineModel<VSortItem[]>('sortBy', { required: true })
	const { deleteEntity } = useActivityBucketListProfileCrud()
	const { openDialog } = useDialog()
	const { t } = useI18n()

	const columns: TableColumn[] = [
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('experienceType', t('leisure.fields.experienceType'), false),
		new TableColumn('comfortZoneStep', t('leisure.fields.comfortZoneStep')),
		new TableColumn('requiresTravel', t('leisure.fields.requiresTravel'), false),
		new TableColumn('financialGoal', t('leisure.fields.financialGoal')),
		new TableColumn('inspirationSource', t('leisure.fields.inspirationSource'), false),
	]

	function stepColor(step: number): string {
		if (step <= 1) return 'success'
		if (step <= 3) return 'warning'
		return 'errorDark'
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: BucketListProfileForm,
			dialogProps: { title: t('leisure.bucketList'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}

	async function onEdit(item: ActivityBucketListProfile) {
		const result = await openDialog({
			component: BucketListProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.bucketList'), confirmBtnLabel: t('general.save') },
		})
		if (result) emit('onReload')
	}

	async function onDelete(item: ActivityBucketListProfile) {
		await deleteEntity(item.activityId)
		emit('onReload')
	}
</script>
