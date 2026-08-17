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
		<template #item.difficultyLevel="{ item }">
			<span>{{ item.difficultyLevel == null ? '—' : $t(`enums.difficultyLevel.${item.difficultyLevel}`) }}</span>
		</template>
		<template #item.readinessStatus="{ item }">
			<span>{{ item.readinessStatus == null ? '—' : $t(`enums.readinessStatus.${item.readinessStatus}`) }}</span>
		</template>
		<template #item.isMessy="{ item }">
			<VIcon
				:color="item.isMessy ? 'warningDark' : 'grey'"
				:icon="item.isMessy ? 'check' : 'minus'"
				size="16"
			/>
		</template>
		<template #noData>
			<div class="empty-state">
				<VIcon
					icon="hammer"
					size="40"
					class="mb-3"
					style="opacity: 0.3"
				/>
				<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.projects') }}</p>
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
	import ProjectProfileForm from '@/core/leisure/component/project/ProjectProfileForm.vue'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	// Paging/sorting/filtering state lives in the view's `useServerTable`; this component only
	// renders it and asks for a refetch.
	defineProps<{
		items: ActivityProjectProfile[]
		loading: boolean
		itemsLength: number
	}>()
	const emit = defineEmits<{ onLoadItems: []; onReload: [] }>()
	const page = defineModel<number>('page', { required: true })
	const itemsPerPage = defineModel<number>('itemsPerPage', { required: true })
	const sortBy = defineModel<VSortItem[]>('sortBy', { required: true })
	const { deleteEntity } = useActivityProjectProfileCrud()
	const { openDialog } = useDialog()
	const { t } = useI18n()

	const columns: TableColumn[] = [
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('difficultyLevel', t('leisure.fields.difficultyLevel'), false),
		new TableColumn('readinessStatus', t('leisure.fields.readinessStatus'), false),
		new TableColumn('projectArea', t('leisure.fields.projectArea'), false),
		new TableColumn('estimatedHours', t('leisure.fields.estimatedHours')),
		new TableColumn('isMessy', t('leisure.fields.isMessy'), false),
	]

	async function openCreateDialog() {
		const result = await openDialog({
			component: ProjectProfileForm,
			dialogProps: { title: t('leisure.projects'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}

	async function onEdit(item: ActivityProjectProfile) {
		const result = await openDialog({
			component: ProjectProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.projects'), confirmBtnLabel: t('general.save') },
		})
		if (result) emit('onReload')
	}

	async function onDelete(item: ActivityProjectProfile) {
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
