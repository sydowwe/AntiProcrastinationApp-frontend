<template>
	<div class="d-flex flex-column">
		<div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-3">
			<div class="d-flex align-center ga-2">
				<span class="text-subtitle-1 font-weight-medium">{{ $t('scheduler.runHistory.title') }}</span>
				<VBtn
					variant="text"
					color="primaryOutline"
					prependIcon="rotate"
					size="small"
					:loading
					@click="reload"
				>
					{{ $t('scheduler.runHistory.refresh') }}
				</VBtn>
			</div>
			<div class="d-flex align-center ga-3 flex-wrap">
				<ExportMenu
					:loading="exporting"
					@export="exportRuns"
				/>
				<FilterPanel
					v-model="filter"
					:defaultFactory="defaultFilter"
					:chipFormatters
					@apply="reload"
				>
					<template #fields="{ draft }">
						<VSelect
							v-model="draft.outcome"
							:items="outcomeOptions"
							itemTitle="title"
							itemValue="value"
							:label="$t('scheduler.run.outcome')"
							density="comfortable"
							clearable
							hideDetails
						/>
						<VSelect
							v-model="draft.triggerSource"
							:items="triggerSourceOptions"
							itemTitle="title"
							itemValue="value"
							:label="$t('scheduler.run.triggerSource')"
							density="comfortable"
							clearable
							hideDetails
						/>
						<VDateInput
							v-model="draft.startedFrom"
							:label="$t('scheduler.run.startedFrom')"
							hideDetails
						/>
						<VDateInput
							v-model="draft.startedTo"
							:label="$t('scheduler.run.startedTo')"
							hideDetails
						/>
					</template>
				</FilterPanel>
			</div>
		</div>

		<BasicTable
			:items="items"
			v-model:page="page"
			v-model:itemsPerPage="itemsPerPage"
			v-model:sortBy="sortBy"
			:loading="loading"
			:columns
			:itemsLength
			:showSelect="false"
			:hasEdit="false"
			:hasDelete="false"
			:hasCreate="false"
			@onLoadItems="loadItems"
		>
			<template #item.startedAt="{ item, value }">
				<RouterLink
					class="text-info text-decoration-none"
					:to="{ name: 'schedulerRunDetail', params: { id: item.id } }"
				>
					{{ formatDateTime(value) }}
				</RouterLink>
			</template>
			<template #item.durationSeconds="{ value }">
				{{ formatRunDuration(value) }}
			</template>
			<template #item.outcome="{ value }">
				<RunOutcomeChip :outcome="value" />
			</template>
			<template #item.triggerSource="{ value }">
				<TriggerSourceChip :source="value" />
			</template>
			<template #item.errorSummary="{ value }">
				<span
					v-if="value !== null && value !== undefined && value !== ''"
					class="text-error text-caption"
					style="display: block; max-width: 320px"
				>
					{{ value }}
				</span>
				<span
					v-else
					class="text-medium-emphasis"
				>
					—
				</span>
			</template>

			<template #additionalActions="{ id }">
				<VIconBtn
					icon="eye"
					variant="tonal"
					size="small"
					color="secondaryOutline"
					:title="$t('general.show')"
					@click="$router.push({ name: 'schedulerRunDetail', params: { id } })"
				>
					<VIcon size="15" />
				</VIconBtn>
				<VIconBtn
					icon="rotate-right"
					variant="tonal"
					size="small"
					color="warning"
					:title="$t('scheduler.actions.replay')"
					@click="openReplay(id)"
				>
					<VIcon size="15" />
				</VIconBtn>
			</template>
		</BasicTable>

		<ReplayConfirmDialog
			v-model="replayDialog"
			:runId="replayRunId"
			:jobKey
			:loading="replaying"
			@confirmed="confirmReplay"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { isCancel } from 'axios'
	import { VDateInput } from 'vuetify/labs/components'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ExportMenu from '@/_common/component/ExportMenu.vue'
	import RunOutcomeChip from '@/core/scheduler/component/RunOutcomeChip.vue'
	import TriggerSourceChip from '@/core/scheduler/component/TriggerSourceChip.vue'
	import ReplayConfirmDialog from '@/core/scheduler/component/ReplayConfirmDialog.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { ScheduledJobRunFilter } from '@/core/scheduler/dto/request/ScheduledJobRunFilter.ts'
	import type { ScheduledJobRunGridResponse } from '@/core/scheduler/dto/response/ScheduledJobRunGridResponse.ts'
	import { AllRunOutcomeList, RunOutcome } from '@/core/scheduler/dto/enum/RunOutcome.ts'
	import { AllTriggerSourceList, TriggerSource } from '@/core/scheduler/dto/enum/TriggerSource.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
	import { exportScheduledJobRuns, replayRun, useScheduledJobRunQuery } from '@/core/scheduler/api/SchedulerApi.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'
	import { useSchedulerFormat } from '@/core/scheduler/composable/useSchedulerFormat.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { queryDate, queryEnum, queryNumber, queryString } from '@/core/scheduler/composable/listQueryState.ts'

	const { jobId, jobKey } = defineProps<{ jobId: number; jobKey: string }>()

	const i18n = useI18n()
	const route = useRoute()
	const router = useRouter()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { formatDateTime, formatRunDuration, replayError } = useSchedulerFormat()
	const { loading, fetchFilteredTable } = useScheduledJobRunQuery()

	const DEFAULT_SORT_KEY = 'startedAt'
	const DEFAULT_PER_PAGE = 25

	// Hydrate the bookmarkable run-log state (filters, sort, page) from the URL so a deep link /
	// browser back / shared URL restores the same view (CLAUDE.md "URL State" rule). jobId stays in
	// the route path, so it is not mirrored into the query here.
	const items = ref<ScheduledJobRunGridResponse[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(queryNumber(route.query.perPage, DEFAULT_PER_PAGE))
	const page = ref(queryNumber(route.query.page, 1))
	const sortBy = ref<VSortItem[]>([
		new VSortItem(queryString(route.query.sort) ?? DEFAULT_SORT_KEY, route.query.dir === 'asc' ? 'asc' : 'desc'),
	])
	const filter = ref(
		new ScheduledJobRunFilter(
			jobId,
			queryEnum(route.query.outcome, AllRunOutcomeList),
			queryEnum(route.query.triggerSource, AllTriggerSourceList),
			queryDate(route.query.startedFrom),
			queryDate(route.query.startedTo),
		),
	)
	const exporting = ref(false)

	const replayDialog = ref(false)
	const replayRunId = ref<number | null>(null)
	const replaying = ref(false)

	function defaultFilter(): ScheduledJobRunFilter {
		return new ScheduledJobRunFilter(jobId)
	}

	const columns = computed(() => [
		new TableColumn('startedAt', i18n.t('scheduler.run.startedAt')),
		new TableColumn('durationSeconds', i18n.t('scheduler.run.duration'), false),
		new TableColumn('outcome', i18n.t('scheduler.run.outcome')),
		new TableColumn('triggerSource', i18n.t('scheduler.run.triggerSource')),
		new TableColumn('errorSummary', i18n.t('scheduler.run.error'), false),
	])

	const outcomeOptions = getEnumSelectOptions(RunOutcome, 'scheduler.runOutcome')
	const triggerSourceOptions = getEnumSelectOptions(TriggerSource, 'scheduler.triggerSource')

	const chipFormatters: ChipFormatters<ScheduledJobRunFilter> = {
		outcome: v => (v ? { label: i18n.t(`scheduler.runOutcome.${v}`), icon: 'circle-check' } : null),
		triggerSource: v => (v ? { label: i18n.t(`scheduler.triggerSource.${v}`), icon: 'bolt' } : null),
		startedFrom: v =>
			v ? { label: `${i18n.t('scheduler.run.startedFrom')}: ${formatDateTime(v)}`, icon: 'calendar' } : null,
		startedTo: v =>
			v ? { label: `${i18n.t('scheduler.run.startedTo')}: ${formatDateTime(v)}`, icon: 'calendar' } : null,
	}

	function buildRequest(unpaged = false): FilteredTableRequest<ScheduledJobRunFilter> {
		// Always re-pin jobId so the run log stays scoped to this job regardless of filter edits.
		const effective = new ScheduledJobRunFilter(
			jobId,
			filter.value.outcome,
			filter.value.triggerSource,
			filter.value.startedFrom,
			filter.value.startedTo,
		)
		// Export must cover the whole filtered result set, not just the current page.
		return new FilteredTableRequest(
			unpaged ? -1 : itemsPerPage.value,
			unpaged ? 1 : page.value,
			sortBy.value,
			true,
			effective,
		)
	}

	// Mirror the current run-log state back into the URL query so it stays bookmark/back/share-able.
	function syncQuery() {
		const query: Record<string, string> = {}
		if (page.value !== 1) query.page = String(page.value)
		if (itemsPerPage.value !== DEFAULT_PER_PAGE) query.perPage = String(itemsPerPage.value)
		const sort = sortBy.value[0]
		const descending = sort?.order === 'desc' || sort?.order === true
		if (sort && (sort.key !== DEFAULT_SORT_KEY || !descending)) {
			query.sort = sort.key
			query.dir = descending ? 'desc' : 'asc'
		}
		if (filter.value.outcome) query.outcome = filter.value.outcome
		if (filter.value.triggerSource) query.triggerSource = filter.value.triggerSource
		if (filter.value.startedFrom) query.startedFrom = filter.value.startedFrom.toISOString()
		if (filter.value.startedTo) query.startedTo = filter.value.startedTo.toISOString()
		router.replace({ query })
	}

	async function loadItems() {
		syncQuery()
		try {
			// The helper aborts any in-flight request before issuing this one, so on rapid
			// page/sort/filter changes only the newest response lands here; older ones reject with a
			// cancellation we intentionally ignore instead of overwriting fresher data.
			const result = await fetchFilteredTable(buildRequest())
			items.value = result.items
			itemsLength.value = result.itemsCount
		} catch (e: unknown) {
			if (!isCancel(e)) throw e
		}
	}

	function reload() {
		page.value = 1
		loadItems()
	}

	async function exportRuns(format: ExportFormat) {
		if (exporting.value) return
		exporting.value = true
		try {
			const { blob, fileName } = await exportScheduledJobRuns(buildRequest(true), format)
			downloadBlob(blob, fileName)
		} catch {
			showErrorSnackbar(i18n.t('scheduler.exportError'))
		} finally {
			exporting.value = false
		}
	}

	function openReplay(runId: number) {
		replayRunId.value = runId
		replayDialog.value = true
	}

	async function confirmReplay() {
		if (replayRunId.value === null || replaying.value) return
		replaying.value = true
		try {
			await replayRun(replayRunId.value)
			showSuccessSnackbar(i18n.t('scheduler.replay.success'))
			replayDialog.value = false
			replayRunId.value = null
			// The replay runs in the background; refresh shortly so the new run shows up.
			await loadItems()
		} catch (e: unknown) {
			showErrorSnackbar(replayError(e))
		} finally {
			replaying.value = false
		}
	}

	// Initial load is triggered by the table's @onLoadItems (VDataTableServer emits update:options on mount).

	defineExpose({ reload })
</script>
