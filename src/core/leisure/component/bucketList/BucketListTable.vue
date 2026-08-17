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
		<template #item.activity.name="{ item }">
			<ActivityNameCell :activity="item.activity" />
		</template>
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
				:color="comfortZoneColor(item.comfortZoneStep)"
				size="small"
			>
				{{ item.comfortZoneStep }}/5
			</VChip>
		</template>
		<template #noData>
			<div class="empty-state">
				<VIcon
					icon="star"
					size="40"
					class="mb-3"
					style="opacity: 0.3"
				/>
				<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.bucketList') }}</p>
				<VBtn
					color="success"
					variant="tonal"
					prependIcon="plus"
					@click="openCreateDialog"
				>
					{{ $t('general.add') }}
				</VBtn>
			</div>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import { comfortZoneColor } from '@/core/leisure/component/bucketList/comfortZoneColor.ts'
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

<style scoped>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		text-align: center;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}
</style>
