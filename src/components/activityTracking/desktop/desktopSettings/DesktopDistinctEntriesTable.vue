<template>
	<div class="d-flex flex-column ga-2">
		<DesktopDistinctEntriesActions
			v-model:mode="mode"
			v-model:formData="formData"
			@clear="emit('clear')"
			@save="emit('save')"
		/>
		<DataTable
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
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import DataTable from '@/components/general/dataTable/DataTable.vue'
	import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
	import { TrackerDesktopDistinctEntriesResponse } from '@/dtos/response/activityTracking/desktop/settings/TrackerDesktopDistinctEntriesResponse.ts'
	import { DesktopDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'
	import { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
	import { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import DesktopDistinctEntriesActions from '@/components/activityTracking/desktop/desktopSettings/DesktopDistinctEntriesActions.vue'

	const props = defineProps<{ filter: DesktopDistinctEntriesFilterRequest }>()
	const emit = defineEmits<{ clear: []; save: [] }>()
	const mode = defineModel<'toActivity' | 'toIgnored'>('mode')
	const formData = defineModel<ActivityFormRequest>('formData')
	const { showErrorSnackbar } = useSnackbar()
	const { loading, fetchFilteredTable } = useFetchFilteredTable(
		TrackerDesktopDistinctEntriesResponse,
		'activity-tracking/desktop',
	)

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
