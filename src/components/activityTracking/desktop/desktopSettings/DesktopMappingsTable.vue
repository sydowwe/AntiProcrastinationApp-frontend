<template>
	<div class="d-flex flex-column ga-2">
		<DesktopMappingsFilter
			v-model="mappingFilter"
			v-model:formData="formData"
		/>
		<BasicTable
			v-model="mappings"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			v-model:loading="loading"
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
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
	import { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { useTrackerDesktopMappingCrud } from '@/api/desktopActivityTrackingApi.ts'
	import type { TrackerDesktopMappingResponse } from '@/dtos/response/activityTracking/desktop/settings/TrackerDesktopMappingResponse.ts'
	import { TrackerDesktopMappingsFilter } from '@/dtos/request/activityTracking/desktop/settings/TrackerDesktopMappingsFilter.ts'
	import { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import DesktopMappingsFilter from '@/components/activityTracking/desktop/desktopSettings/DesktopMappingsFilter.vue'

	const emit = defineEmits<{ edit: [item: TrackerDesktopMappingResponse] }>()

	const { showErrorSnackbar } = useSnackbar()
	const { fetchFilteredTable: fetchFilteredTableMappings, tableLoading: loading } = useTrackerDesktopMappingCrud()

	const columns = [
		new TableColumn('isActive', 'Is active'),
		new TableColumn('processName', 'Process Name'),
		new TableColumn('processNameMatchType', 'Match type'),
		new TableColumn('productName', 'Product Name'),
		new TableColumn('productNameMatchType', 'Match type'),
		new TableColumn('windowTitle', 'Window Title'),
		new TableColumn('windowTitleMatchType', 'Match type'),
		new TableColumn('activity.text', 'Activity'),
		new TableColumn('isIgnored', 'Is ignored'),
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
			showErrorSnackbar('Failed to load mappings')
		}
	}

	defineExpose({ load })
</script>
