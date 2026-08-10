<template>
	<div class="d-flex flex-column ga-2">
		<AndroidMappingsFilter
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
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { useTrackerAndroidMappingCrud } from '@/core/activityTracking/api/androidActivityTrackingApi.ts'
	import type { TrackerAndroidMappingResponse } from '@/core/activityTracking/dto/response/android/settings/TrackerAndroidMappingResponse.ts'
	import { TrackerAndroidMappingsFilter } from '@/core/activityTracking/dto/request/android/settings/TrackerAndroidMappingsFilter.ts'
	import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import AndroidMappingsFilter from '@/core/activityTracking/component/android/androidSettings/AndroidMappingsFilter.vue'

	const emit = defineEmits<{ edit: [item: TrackerAndroidMappingResponse] }>()

	const { showErrorSnackbar } = useSnackbar()
	const { fetchFilteredTable: fetchFilteredTableMappings, tableLoading: loading } = useTrackerAndroidMappingCrud()

	const columns = [
		new TableColumn('isActive', 'Is active'),
		new TableColumn('appLabel', 'App Label'),
		new TableColumn('appLabelMatchType', 'Match type'),
		new TableColumn('packageName', 'Package Name'),
		new TableColumn('packageNameMatchType', 'Match type'),
		new TableColumn('activity.text', 'Activity'),
		new TableColumn('isIgnored', 'Is ignored'),
	]

	const mappings = ref<TrackerAndroidMappingResponse[]>([])
	const totalItems = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('appLabel', 'asc')])
	const mappingFilter = ref(new TrackerAndroidMappingsFilter())
	const formData = ref(new ActivityFormRequest())

	async function load() {
		const req = new FilteredTableRequest<TrackerAndroidMappingsFilter>(
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
