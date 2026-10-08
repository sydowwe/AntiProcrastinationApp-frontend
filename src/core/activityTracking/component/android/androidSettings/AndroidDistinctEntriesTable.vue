<template>
	<div class="d-flex flex-column flex-fill ga-2">
		<AndroidDistinctEntriesActions
			v-model:mode="mode"
			v-model:formData="formData"
			:keptTarget
			@clear="emit('clear')"
			@save="emit('save')"
		/>
		<DataTable
			:items
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			:loading
			:columns="columns"
			:itemsLength="totalItems"
			:showActions="false"
			@onLoadItems="load"
		>
			<template #item.coveredBy="{ item }">
				<MappingSuggestionChip
					v-if="!item.coveredBy && suggestionFor(item.packageName)"
					:suggestion="suggestionFor(item.packageName)!"
					:createRule
					@created="onRuleCreated"
					@dismiss="dismiss(suggestionFor(item.packageName)!)"
				/>
				<MappingCoverageChip
					v-else
					:coveredBy="item.coveredBy"
					settingsRouteName="androidSettings"
				/>
			</template>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import DataTable from '@/_common/component/dataTable/DataTable.vue'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
	import { TrackerAndroidDistinctEntriesResponse } from '@/core/activityTracking/dto/response/android/settings/TrackerAndroidDistinctEntriesResponse.ts'
	import type { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'
	import { TrackerAndroidMappingRequest } from '@/core/activityTracking/dto/request/android/settings/TrackerAndroidMappingRequest.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
	import { useTableUrlState } from '@/_common/composable/table/useTableUrlState.ts'
	import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import AndroidDistinctEntriesActions from '@/core/activityTracking/component/android/androidSettings/AndroidDistinctEntriesActions.vue'
	import MappingCoverageChip from '@/core/activityTracking/component/settings/MappingCoverageChip.vue'
	import MappingSuggestionChip from '@/core/activityTracking/component/settings/MappingSuggestionChip.vue'
	import {
		getAndroidMappingSuggestions,
		useTrackerAndroidMappingCrud,
	} from '@/core/activityTracking/api/androidActivityTrackingApi.ts'
	import type { MappingSuggestion } from '@/core/activityTracking/dto/response/MappingSuggestion.ts'
	import { useMappingSuggestions } from '@/core/activityTracking/composable/useMappingSuggestions.ts'
	import type { MappingMode } from '@/core/activityTracking/composable/useMappingSettings.ts'
	import type { RoleCategoryTarget } from '@/core/activityTracking/dto/RoleCategoryTarget.ts'

	const props = defineProps<{
		filter: AndroidDistinctEntriesFilterRequest
		/** The edited rule's role/category target, offered as *Keep* (OP22). */
		keptTarget?: RoleCategoryTarget | null
	}>()
	const emit = defineEmits<{ clear: []; save: [] }>()
	const mode = defineModel<MappingMode>('mode')
	const formData = defineModel<ActivityFormRequest>('formData')
	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()
	const { loading, fetchFilteredTable } = useFetchFilteredTable({
		responseClass: TrackerAndroidDistinctEntriesResponse,
		entityName: 'activity-tracking/android',
	})
	const { create } = useTrackerAndroidMappingCrud()

	const columns = [
		new TableColumn('appLabel', t('activityTracking.settings.appLabel')),
		new TableColumn('packageName', t('activityTracking.settings.packageName')),
		// Computed server-side after the query; sending it as a sort key is a 400 (B24).
		new TableColumn('coveredBy', t('activityTracking.settings.coverage.column'), false),
	]

	const items = ref<TrackerAndroidDistinctEntriesResponse[]>([])
	const totalItems = ref(0)

	// FO9: rules learned from the user's own timers, keyed by package — the server only suggests an app that filled
	// the timers it appeared in, so a feed checked through every pomodoro is not offered as the work.
	const { suggestionFor, ensureLoaded, reload, dismiss } = useMappingSuggestions(
		getAndroidMappingSuggestions,
		'androidMappingSuggestionsDismissed',
	)

	// Exactly the package: a label can change with the app's language, the package does not.
	async function createRule(suggestion: MappingSuggestion) {
		const request = new TrackerAndroidMappingRequest(null, null, suggestion.key, PatternMatchType.Exact)
		request.activityId = suggestion.activityId
		await create(request)
	}

	async function onRuleCreated() {
		await Promise.all([reload(), load()])
	}
	// Page, size and sort round-trip through the URL (F15); the filter is the view's and travels beside them.
	const { page, itemsPerPage, sortBy } = useTableUrlState({
		defaultSortBy: [new VSortItem('appLabel', 'asc')],
	})

	async function load() {
		const req = new FilteredTableRequest<AndroidDistinctEntriesFilterRequest>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			true,
			props.filter,
		)
		ensureLoaded()
		try {
			const result = await fetchFilteredTable(req)
			items.value = result.items
			totalItems.value = result.itemsCount
		} catch {
			showErrorSnackbar(t('activityTracking.settings.failedToLoadDistinctEntries'))
		}
	}

	defineExpose({ load })
</script>
