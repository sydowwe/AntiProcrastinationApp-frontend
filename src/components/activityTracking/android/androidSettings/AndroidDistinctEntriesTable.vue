<template>
	<div class="d-flex flex-column flex-fill ga-2">
		<AndroidDistinctEntriesActions
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
	import { TrackerAndroidDistinctEntriesResponse } from '@/dtos/response/activityTracking/android/settings/TrackerAndroidDistinctEntriesResponse.ts'
	import type { AndroidDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/android/settings/AndroidDistinctEntriesFilterRequest.ts'
	import { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
	import type { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import AndroidDistinctEntriesActions from '@/components/activityTracking/android/androidSettings/AndroidDistinctEntriesActions.vue'

	const props = defineProps<{ filter: AndroidDistinctEntriesFilterRequest }>()
	const emit = defineEmits<{ clear: []; save: [] }>()
	const mode = defineModel<'toActivity' | 'toIgnored'>('mode')
	const formData = defineModel<ActivityFormRequest>('formData')
	const { showErrorSnackbar } = useSnackbar()
	const { loading, fetchFilteredTable } = useFetchFilteredTable(
		TrackerAndroidDistinctEntriesResponse,
		'activity-tracking/android',
	)

	const columns = [new TableColumn('appLabel', 'App Label'), new TableColumn('packageName', 'Package Name')]

	const items = ref<TrackerAndroidDistinctEntriesResponse[]>([])
	const totalItems = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('appLabel', 'asc')])

	async function load() {
		const req = new FilteredTableRequest<AndroidDistinctEntriesFilterRequest>(
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
