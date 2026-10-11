<template>
	<!-- `flex-fill` + the table's `flex-1-1`/`min-height: 0`: DataTable's body is `height: 0` and fills
	     its flex parent, so without a definite-height chain the rows are laid out and clipped (F12). -->
	<div class="d-flex flex-column flex-fill ga-2">
		<DesktopMappingsFilter
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
	import { computed, ref, watch } from 'vue'
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
	import { useTrackerDesktopMappingCrud } from '@/core/activityTracking/api/desktopActivityTrackingApi.ts'
	import { TrackerDesktopMappingRequest } from '@/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingRequest.ts'
	import type { TrackerDesktopMappingResponse } from '@/core/activityTracking/dto/response/desktop/settings/TrackerDesktopMappingResponse.ts'
	import type { DesktopDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'
	import { TrackerDesktopMappingsFilter } from '@/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingsFilter.ts'
	import { TrackerDesktopMappingTypeEnum } from '@/core/activityTracking/dto/enum/TrackerDesktopMappingTypeEnum.ts'
	import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import DesktopMappingsFilter from '@/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsFilter.vue'

	const { filter, highlightedId = null } = defineProps<{
		/** The view's top-bar pattern — the one search both tabs share, applied on its Filter button (F13). */
		filter: DesktopDistinctEntriesFilterRequest
		/** The rule a distinct-entries *Rule* chip linked to (`?mappingId=`), tinted when it is on the page. */
		highlightedId?: number | null
	}>()
	const emit = defineEmits<{
		edit: [item: TrackerDesktopMappingResponse]
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
	} = useTrackerDesktopMappingCrud()

	// Computed so the headers follow a locale switch — a plain array freezes the boot locale.
	const columns = computed(() => [
		new TableColumn('isActive', t('activityTracking.settings.isActive')),
		new TableColumn('processName', t('activityTracking.settings.processName')),
		new TableColumn('processNameMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('productName', t('activityTracking.settings.productName')),
		new TableColumn('productNameMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('windowTitle', t('activityTracking.settings.windowTitle')),
		new TableColumn('windowTitleMatchType', t('activityTracking.settings.matchType')),
		new TableColumn('activity.text', t('activityTracking.settings.mappingTarget')),
		new TableColumn('isIgnored', t('activityTracking.settings.isIgnored')),
	])

	const mappings = ref<TrackerDesktopMappingResponse[]>([])
	const totalItems = ref(0)
	// Page, size, sort and this tab's own controls round-trip through the URL (F15). The default sort
	// already holds `BasicTable`'s first column, so its mount-time push finds it and writes nothing (F1).
	const {
		page,
		itemsPerPage,
		sortBy,
		filter: mappingFilter,
	} = useTableUrlState<TrackerDesktopMappingsFilter>({
		defaultSortBy: [new VSortItem('productName', 'asc'), new VSortItem('isActive', 'asc')],
		defaultFilter: new TrackerDesktopMappingsFilter(),
		filterToParams: controls =>
			mappingsControlsToParams(
				controls,
				TrackerDesktopMappingTypeEnum.Activity,
				TrackerDesktopMappingTypeEnum.Ignored,
			),
		paramsToFilter: params =>
			applyMappingsControlsParams(
				new TrackerDesktopMappingsFilter(),
				params,
				Object.values(TrackerDesktopMappingTypeEnum),
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
	function buildFilter(): TrackerDesktopMappingsFilter {
		const { type, isActive } = mappingFilter.value
		const isIgnored = type === TrackerDesktopMappingTypeEnum.Ignored ? mappingFilter.value.isIgnored : null
		const activityId = type === TrackerDesktopMappingTypeEnum.Activity ? mappingFilter.value.activityId : null
		return new TrackerDesktopMappingsFilter(
			filter.processName?.trim() || undefined,
			filter.processNameMatchType,
			filter.productName?.trim() || undefined,
			filter.productNameMatchType,
			filter.windowTitle?.trim() || undefined,
			filter.windowTitleMatchType,
			type,
			isActive,
			isIgnored,
			activityId,
		)
	}

	async function load() {
		const req = new FilteredTableRequest<TrackerDesktopMappingsFilter>(
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
	async function onDelete(item: TrackerDesktopMappingResponse) {
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
	async function onActiveChange(item: TrackerDesktopMappingResponse, isActive: boolean) {
		const req = TrackerDesktopMappingRequest.fromRow(item)
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
