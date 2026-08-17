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
			<ActivityNameCell
				:activity="item.activity"
				:class="{ experienced: item.isAnchored === true }"
			/>
		</template>
		<!-- Only a one-time entry can ever be "done"; a repeatable one shows an em dash, not a button. -->
		<template #item.isAnchored="{ item }">
			<ExperiencedCell
				:activityId="item.activityId"
				:activityName="item.activity.name"
				:isAnchored="item.isAnchored"
				:eligible="item.isOneTime"
				@anchored="emit('onReload')"
			/>
		</template>
		<template #item.isOneTime="{ item }">
			<VIcon
				:color="item.isOneTime ? 'primary' : 'grey'"
				:icon="item.isOneTime ? 'star' : 'rotate'"
				size="16"
			/>
		</template>
		<template #item.locationType="{ item }">
			<span>{{ item.locationType?.text ?? '—' }}</span>
		</template>
		<template #item.weatherDependency="{ item }">
			<div class="d-flex align-center ga-2">
				<span>{{ item.weatherDependency?.text ?? '—' }}</span>
				<ChipWithIcon
					v-if="isGoodToday(item)"
					icon="cloud-sun"
					color="success"
					size="small"
				>
					{{ $t('leisure.weatherFit.goodToday') }}
				</ChipWithIcon>
			</div>
		</template>
		<template #item.expectedCostTier="{ item }">
			<span>{{ item.expectedCostTier?.text ?? '—' }}</span>
		</template>
		<template #item.energyLevel="{ item }">
			<span>{{ item.energyLevel == null ? '—' : $t(`enums.energyLevel.${item.energyLevel}`) }}</span>
		</template>
		<template #item.effortType="{ item }">
			<span>{{ item.effortType == null ? '—' : $t(`enums.effortType.${item.effortType}`) }}</span>
		</template>
		<template #noData>
			<div class="empty-state">
				<VIcon
					icon="box-archive"
					size="40"
					class="mb-3"
					style="opacity: 0.3"
				/>
				<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.backlog') }}</p>
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
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import ExperiencedCell from '@/core/leisure/component/ExperiencedCell.vue'
	import BacklogProfileForm from '@/core/leisure/component/backlog/BacklogProfileForm.vue'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useActivityBacklogProfileCrud } from '@/core/leisure/api/activityBacklogProfileApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useWeatherFit, fitsToday } from '@/core/leisure/composable/useWeatherFit.ts'
	import { useI18n } from 'vue-i18n'

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
	const weatherFit = useWeatherFit()

	function isGoodToday(item: ActivityBacklogProfile): boolean {
		return fitsToday(item.weatherDependency?.id, weatherFit.value)
	}

	const columns: TableColumn[] = [
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('locationType', t('leisure.fields.locationType'), false),
		new TableColumn('weatherDependency', t('leisure.fields.weatherDependency'), false),
		new TableColumn('energyLevel', t('leisure.fields.energyLevel'), false),
		new TableColumn('expectedCostTier', t('leisure.fields.expectedCostTier'), false),
		new TableColumn('durationMinutes', t('leisure.fields.durationMinutes')),
		new TableColumn('isOneTime', t('leisure.fields.isOneTime'), false),
		// Not sortable until the API accepts `isAnchored` as a sort key — see BucketListTable.
		new TableColumn('isAnchored', t('leisure.fields.experienced'), false),
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

<style scoped>
	.experienced {
		opacity: 0.6;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		text-align: center;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}
</style>
