<template>
	<div class="d-flex flex-column flex-fill ga-2">
		<DesktopDistinctEntriesActions
			v-model:mode="mode"
			v-model:formData="formData"
			@clear="emit('clear')"
			@save="emit('save')"
		/>
		<DataTable
			class="flex-fill"
			v-model="items"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			v-model:loading="loading"
			:columns="columns"
			:itemsLength="totalItems"
			:showActions="false"
			@onLoadItems="load"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import DataTable from '@/components/general/dataTable/DataTable.vue'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { TrackerDesktopDistinctEntriesResponse } from '@/core/activityTracking/dto/response/desktop/settings/TrackerDesktopDistinctEntriesResponse.ts'
	import type { DesktopDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
	import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import DesktopDistinctEntriesActions from '@/core/activityTracking/component/desktop/desktopSettings/DesktopDistinctEntriesActions.vue'

	const props = defineProps<{ filter: DesktopDistinctEntriesFilterRequest }>()
	const emit = defineEmits<{ clear: []; save: [] }>()
	const mode = defineModel<'toActivity' | 'toIgnored'>('mode')
	const formData = defineModel<ActivityFormRequest>('formData')
	const { showErrorSnackbar } = useSnackbar()
	const { loading, fetchFilteredTable } = useFetchFilteredTable({
		responseClass: TrackerDesktopDistinctEntriesResponse,
		entityName: 'activity-tracking/desktop',
	})

	const columns = [
		new TableColumn('processName', 'Process Name'),
		new TableColumn('productName', 'Product Name'),
		new TableColumn('windowTitle', 'Window Title'),
	]

	const items = ref<TrackerDesktopDistinctEntriesResponse[]>([])
	const totalItems = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('productName', 'asc')])

	async function load() {
		const req = new FilteredTableRequest<DesktopDistinctEntriesFilterRequest>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			true,
			props.filter,
		)
		try {
			const result = await fetchFilteredTable(req)
			items.value = result.items
			totalItems.value = result.itemsCount
		} catch {
			showErrorSnackbar('Failed to load distinct entries')
		}
	}

	defineExpose({ load })
</script>
