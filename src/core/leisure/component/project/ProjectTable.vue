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
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import ProjectProfileForm from '@/core/leisure/component/project/ProjectProfileForm.vue'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import type { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const { filter } = defineProps<{ filter: ActivityProjectProfileFilter }>()

	const { fetchFilteredTable, deleteEntity } = useActivityProjectProfileCrud()
	const { openDialog } = useDialog()
	const { t } = useI18n()
	const loading = ref(false)

	const items = ref<ActivityProjectProfile[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const columns: TableColumn[] = [
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('difficultyLevel', t('leisure.fields.difficultyLevel'), false),
		new TableColumn('readinessStatus', t('leisure.fields.readinessStatus'), false),
		new TableColumn('projectArea', t('leisure.fields.projectArea'), false),
		new TableColumn('estimatedHours', t('leisure.fields.estimatedHours')),
		new TableColumn('isMessy', t('leisure.fields.isMessy'), false),
	]

	watch(
		() => filter,
		() => {
			page.value = 1
			loadItems()
		},
	)

	async function loadItems() {
		const request = new FilteredTableRequest<ActivityProjectProfileFilter>(
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
			component: ProjectProfileForm,
			dialogProps: { title: t('leisure.projects'), confirmBtnLabel: t('general.create') },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: ActivityProjectProfile) {
		const result = await openDialog({
			component: ProjectProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.projects'), confirmBtnLabel: t('general.save') },
		})
		if (result) await loadItems()
	}

	async function onDelete(item: ActivityProjectProfile) {
		await deleteEntity(item.activityId)
		await loadItems()
	}
</script>
