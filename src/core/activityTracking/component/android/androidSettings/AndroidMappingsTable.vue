<template>
	<!-- `flex-fill` + the table's `flex-1-1`/`min-height: 0`: DataTable's body is `height: 0` and fills
	     its flex parent, so without a definite-height chain the rows are laid out and clipped (F12). -->
	<div class="d-flex flex-column flex-fill ga-2">
		<AndroidMappingsFilter
			v-model="mappingFilter"
			v-model:formData="formData"
		/>
		<BasicTable
			class="flex-1-1"
			style="min-height: 0"
			:items="mappings"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			:loading
			:columns="columns"
			:itemsLength="totalItems"
			:showActionsHeader="false"
			:highlightedId
			deleteConfirmationColumn="patternLabel"
			@onLoadItems="load"
			@onEdit="emit('edit', $event)"
			@onDelete="onDelete"
		>
			<template #item.isActive="{ item }">
				<VSwitch
					class="mx-auto"
					style="width: fit-content"
					:modelValue="item.isActive"
					:loading="togglingId === item.id"
					:disabled="togglingId === item.id"
					:aria-label="t('activityTracking.settings.ruleActive', { pattern: item.patternLabel })"
					color="primaryOutline"
					hideDetails
					@update:modelValue="onActiveChange(item, $event === true)"
				/>
			</template>
			<!-- A role/category rule has no activity; its target used to render blank here (OP22). -->
			<template #item.activity.text="{ item }">
				{{ item.activity?.text ?? roleCategoryTargetLabel(item) }}
			</template>
		</BasicTable>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { useTableUrlState } from '@/_common/composable/table/useTableUrlState.ts'
	import {
		applyMappingsControlsParams,
		mappingsControlsToParams,
	} from '@/core/activityTracking/composable/useDistinctEntriesUrlState.ts'
	import { useRoleCategoryTarget } from '@/core/activityTracking/composable/useRoleCategoryTarget.ts'
	import { useTrackerAndroidMappingCrud } from '@/core/activityTracking/api/androidActivityTrackingApi.ts'
	import { TrackerAndroidMappingRequest } from '@/core/activityTracking/dto/request/android/settings/TrackerAndroidMappingRequest.ts'
	import type { TrackerAndroidMappingResponse } from '@/core/activityTracking/dto/response/android/settings/TrackerAndroidMappingResponse.ts'
	import type { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'
	import { TrackerAndroidMappingsFilter } from '@/core/activityTracking/dto/request/android/settings/TrackerAndroidMappingsFilter.ts'
	import { TrackerAndroidMappingTypeEnum } from '@/core/activityTracking/dto/enum/TrackerAndroidMappingTypeEnum.ts'
	import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import AndroidMappingsFilter from '@/core/activityTracking/component/android/androidSettings/AndroidMappingsFilter.vue'

	const { filter, highlightedId = null } = defineProps<{
		/** The view's top-bar pattern — the one search both tabs share, applied on its Filter button (F13). */
		filter: AndroidDistinctEntriesFilterRequest
		/** The rule a distinct-entries *Rule* chip linked to (`?mappingId=`), tinted when it is on the page. */
		highlightedId?: number | null
	}>()
	const emit = defineEmits<{
		edit: [item: TrackerAndroidMappingResponse]
		activeChanged: [id: number, isActive: boolean]
	}>()

	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()
	const { roleCategoryTargetLabel } = useRoleCategoryTarget()
	const {
		fetchFilteredTable: fetchFilteredTableMappings,
		update,
		deleteEntity,
		tableLoading: loading,
	} = useTrackerAndroidMappingCrud()

	const columns = [
		new TableColumn('isActive', t('activityTracking.settings.isActive')),
		new TableColumn('appLabel', t('activityTracking.settings.appLabel')),
		new TableColumn('appLabelMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('packageName', t('activityTracking.settings.packageName')),
		new TableColumn('packageNameMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('activity.text', t('activityTracking.settings.mappingTarget')),
		new TableColumn('isIgnored', t('activityTracking.settings.isIgnored')),
	]

	const mappings = ref<TrackerAndroidMappingResponse[]>([])
	const totalItems = ref(0)
	// Page, size, sort and this tab's own controls round-trip through the URL (F15). The default sort
	// already holds `BasicTable`'s first column, so its mount-time push finds it and writes nothing (F1).
	const {
		page,
		itemsPerPage,
		sortBy,
		filter: mappingFilter,
	} = useTableUrlState<TrackerAndroidMappingsFilter>({
		defaultSortBy: [new VSortItem('appLabel', 'asc'), new VSortItem('isActive', 'asc')],
		defaultFilter: new TrackerAndroidMappingsFilter(),
		filterToParams: controls =>
			mappingsControlsToParams(
				controls,
				TrackerAndroidMappingTypeEnum.Activity,
				TrackerAndroidMappingTypeEnum.Ignored,
			),
		paramsToFilter: params =>
			applyMappingsControlsParams(
				new TrackerAndroidMappingsFilter(),
				params,
				Object.values(TrackerAndroidMappingTypeEnum),
			),
	})
	// The picker writes `formData`; the URL-synced filter is the one copy the request reads.
	const formData = ref(new ActivityFormRequest())
	formData.value.activityId = mappingFilter.value.activityId
	watch(
		() => formData.value.activityId,
		activityId => (mappingFilter.value.activityId = activityId),
	)

	// The mapping-only controls apply on change. Not a deep watch: the pattern fields wait for Filter,
	// as they do on the distinct-entries tab. Back to page 1 lets the table's own options event fetch.
	watch(
		() => [
			mappingFilter.value.type,
			mappingFilter.value.isActive,
			mappingFilter.value.isIgnored,
			mappingFilter.value.activityId,
		],
		() => {
			if (page.value !== 1) page.value = 1
			else load()
		},
	)

	/**
	 * The grid filter: this tab's own controls, plus the view's pattern and the picked activity. Each
	 * type's control counts only while it is shown — a hidden activity pick would empty the Ignored list.
	 */
	function buildFilter(): TrackerAndroidMappingsFilter {
		const { type, isActive } = mappingFilter.value
		const isIgnored = type === TrackerAndroidMappingTypeEnum.Ignored ? mappingFilter.value.isIgnored : null
		const activityId = type === TrackerAndroidMappingTypeEnum.Activity ? mappingFilter.value.activityId : null
		return new TrackerAndroidMappingsFilter(
			filter.appLabel?.trim() || undefined,
			filter.appLabelMatchType,
			filter.packageName?.trim() || undefined,
			filter.packageNameMatchType,
			type,
			isActive,
			isIgnored,
			activityId,
		)
	}

	async function load() {
		const req = new FilteredTableRequest<TrackerAndroidMappingsFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			true,
			buildFilter(),
		)
		try {
			const result = await fetchFilteredTableMappings(req)
			mappings.value = result.items
			totalItems.value = result.itemsCount
		} catch {
			showErrorSnackbar(t('activityTracking.settings.failedToLoadMappings'))
		}
	}

	// `BasicTable` has already confirmed by the time this fires; a failure is the interceptor's snackbar.
	async function onDelete(item: TrackerAndroidMappingResponse) {
		try {
			await deleteEntity(item.id)
		} catch {
			return
		}
		await load()
	}

	const togglingId = ref<number | null>(null)

	/**
	 * Disables or re-enables a rule without deleting it (O1). There is no patch route — the update is a
	 * full replace — so the row goes back whole with only `isActive` changed. A failure leaves the switch
	 * where it was; the interceptor's snackbar says why.
	 */
	async function onActiveChange(item: TrackerAndroidMappingResponse, isActive: boolean) {
		const req = TrackerAndroidMappingRequest.fromRow(item)
		req.isActive = isActive
		togglingId.value = item.id
		try {
			await update(item.id, req)
		} catch {
			return
		} finally {
			togglingId.value = null
		}
		item.isActive = isActive
		emit('activeChanged', item.id, isActive)
		// Filtered on *Is active*, the row no longer belongs on this page.
		if (mappingFilter.value.isActive != null) await load()
	}

	defineExpose({ load })
</script>
