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
		@onLoadItems="loadItems"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #formattedColumn="{ key, value }">
			<template v-if="key === 'experienceType'">
				<span>{{ value?.text ?? '—' }}</span>
			</template>
			<template v-else-if="key === 'requiresTravel'">
				<VIcon
					:color="value ? 'primary' : 'grey'"
					:icon="value ? 'plane' : 'house'"
					size="16"
				/>
			</template>
			<template v-else-if="key === 'comfortZoneStep'">
				<VChip
					:color="stepColor(value as number)"
					size="small"
				>
					{{ value }}/5
				</VChip>
			</template>
			<template v-else>{{ value ?? '—' }}</template>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import BucketListProfileForm from '@/core/leisure/component/bucketList/BucketListProfileForm.vue'
	import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
	import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const { filter } = defineProps<{ filter: ActivityBucketListProfileFilter }>()

	const { fetchFilteredTable, deleteEntity } = useActivityBucketListProfileCrud()
	const { openDialog } = useDialog()
	const { t } = useI18n()
	const loading = ref(false)

	const items = ref<ActivityBucketListProfile[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

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

	watch(
		() => filter,
		() => {
			page.value = 1
			loadItems()
		},
	)

	async function loadItems() {
		const request = new FilteredTableRequest<ActivityBucketListProfileFilter>(
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
			component: BucketListProfileForm,
			dialogProps: { title: t('leisure.bucketList'), confirmBtnLabel: t('general.create') },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: ActivityBucketListProfile) {
		const result = await openDialog({
			component: BucketListProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.bucketList'), confirmBtnLabel: t('general.save') },
		})
		if (result) await loadItems()
	}

	async function onDelete(item: ActivityBucketListProfile) {
		await deleteEntity(item.activityId)
		await loadItems()
	}
</script>
