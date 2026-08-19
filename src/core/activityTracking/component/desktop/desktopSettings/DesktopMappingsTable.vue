<template>
	<div class="d-flex flex-column ga-2">
		<DesktopMappingsFilter
			v-model="mappingFilter"
			v-model:formData="formData"
		/>
		<BasicTable
			:items="mappings"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			:loading
			:columns="columns"
			:itemsLength="totalItems"
			:showActionsHeader="false"
			@onLoadItems="load"
			@onEdit="emit('edit', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { useTrackerDesktopMappingCrud } from '@/core/activityTracking/api/desktopActivityTrackingApi.ts'
	import type { TrackerDesktopMappingResponse } from '@/core/activityTracking/dto/response/desktop/settings/TrackerDesktopMappingResponse.ts'
	import { TrackerDesktopMappingsFilter } from '@/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingsFilter.ts'
	import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import DesktopMappingsFilter from '@/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsFilter.vue'

	const emit = defineEmits<{ edit: [item: TrackerDesktopMappingResponse] }>()

	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()
	const { fetchFilteredTable: fetchFilteredTableMappings, tableLoading: loading } = useTrackerDesktopMappingCrud()

	const columns = [
		new TableColumn('isActive', t('activityTracking.settings.isActive')),
		new TableColumn('processName', t('activityTracking.settings.processName')),
		new TableColumn('processNameMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('productName', t('activityTracking.settings.productName')),
		new TableColumn('productNameMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('windowTitle', t('activityTracking.settings.windowTitle')),
		new TableColumn('windowTitleMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('activity.text', t('activities.activity')),
		new TableColumn('isIgnored', t('activityTracking.settings.isIgnored')),
	]

	const mappings = ref<TrackerDesktopMappingResponse[]>([])
	const totalItems = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('productName', 'asc')])
	const mappingFilter = ref(new TrackerDesktopMappingsFilter())
	const formData = ref(new ActivityFormRequest())

	async function load() {
		const req = new FilteredTableRequest<TrackerDesktopMappingsFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			true,
			mappingFilter.value,
		)
		try {
			const result = await fetchFilteredTableMappings(req)
			mappings.value = result.items
			totalItems.value = result.itemsCount
		} catch {
			showErrorSnackbar(t('activityTracking.settings.failedToLoadMappings'))
		}
	}

	defineExpose({ load })
</script>
