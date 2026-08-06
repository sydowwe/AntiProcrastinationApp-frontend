<template>
	<VContainer
		fluid
		class="d-flex flex-column h-100"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
				<h1 class="text-h5">{{ $t('scheduler.jobs.title') }}</h1>
				<div class="d-flex align-center ga-3 flex-wrap">
					<VBtn
						variant="outlined"
						color="warning"
						prependIcon="triangle-exclamation"
						:to="{ name: 'schedulerNeedsAttention' }"
					>
						{{ $t('scheduler.needsAttention.title') }}
					</VBtn>
					<ExportMenu
						:loading="exporting"
						@export="exportList"
					/>
					<FilterPanel
						v-model="filter"
						:defaultFactory="() => new ScheduledJobFilter()"
						:chipFormatters
						@apply="reload"
					>
						<template #fields="{ draft }">
							<ScheduledJobFilterFields :draft />
						</template>
					</FilterPanel>
				</div>
			</div>

			<div class="d-flex align-center mb-2">
				<VSwitch
					v-model="onlyOverdue"
					color="errorDark"
					:label="$t('scheduler.job.onlyOverdue')"
					density="compact"
					hideDetails
					@update:modelValue="applyOverdueToggle"
				/>
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
				<template #item.jobKey="{ item, value }">
					<div class="d-flex flex-column py-1">
						<div class="d-flex align-center ga-2">
							<RouterLink
								class="text-primary font-weight-medium text-decoration-none"
								:to="{ name: 'schedulerJobDetail', params: { id: item.id } }"
							>
								{{ value }}
							</RouterLink>
							<ChipWithIcon
								v-if="item.isOrphaned"
								icon="link-slash"
								color="error"
								size="x-small"
							>
								{{ $t('scheduler.job.orphaned') }}
							</ChipWithIcon>
						</div>
						<span
							v-if="item.description"
							class="text-caption text-medium-emphasis"
						>
							{{ item.description }}
						</span>
					</div>
				</template>
				<template #item.scheduleType="{ item }">
					<ScheduleDisplay
						:scheduleType="item.scheduleType"
						:cronExpression="item.cronExpression"
						:intervalValue="item.intervalValue"
						:intervalUnit="item.intervalUnit"
					/>
				</template>
				<template #item.status="{ item, value }">
					<div class="d-flex align-center ga-2">
						<JobStatusChip :status="value" />
						<ChipWithIcon
							v-if="item.isOverdue"
							icon="clock"
							color="error"
							size="x-small"
						>
							{{ $t('scheduler.job.overdue') }}
						</ChipWithIcon>
					</div>
				</template>
				<template #item.lastRunAt="{ item, value }">
					<div
						v-if="value"
						class="d-flex align-center ga-2"
					>
						<RunOutcomeChip :outcome="item.lastOutcome ?? null" />
						<span class="text-caption text-medium-emphasis">{{ formatDateTime(value) }}</span>
					</div>
					<span
						v-else
						class="text-medium-emphasis"
					>
						{{ $t('scheduler.job.neverRun') }}
					</span>
				</template>
				<template #item.nextRunAt="{ value }">
					<span v-if="value">{{ formatDateTime(value) }}</span>
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
						@click="$router.push({ name: 'schedulerJobDetail', params: { id } })"
					>
						<VIcon size="15" />
					</VIconBtn>
					<JobActionButtons
						v-if="itemsById.get(id)"
						:jobId="id"
						:status="itemsById.get(id)!.status"
						:isOrphaned="itemsById.get(id)!.isOrphaned"
						iconOnly
						@triggered="loadItems"
						@statusChanged="loadItems"
					/>
				</template>
			</BasicTable>
		</template>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { isCancel } from 'axios'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ExportMenu from '@/_common/component/ExportMenu.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import ScheduleDisplay from '@/core/scheduler/component/ScheduleDisplay.vue'
	import JobStatusChip from '@/core/scheduler/component/JobStatusChip.vue'
	import RunOutcomeChip from '@/core/scheduler/component/RunOutcomeChip.vue'
	import JobActionButtons from '@/core/scheduler/component/JobActionButtons.vue'
	import ScheduledJobFilterFields from '@/core/scheduler/component/ScheduledJobFilterFields.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { ScheduledJobFilter } from '@/core/scheduler/dto/request/ScheduledJobFilter.ts'
	import type { ScheduledJobGridResponse } from '@/core/scheduler/dto/response/ScheduledJobGridResponse.ts'
	import { AllJobStatusList } from '@/core/scheduler/dto/enum/JobStatus.ts'
	import { AllScheduleTypeList } from '@/core/scheduler/dto/enum/ScheduleType.ts'
	import { AllRunOutcomeList } from '@/core/scheduler/dto/enum/RunOutcome.ts'
	import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
	import { exportScheduledJobs, useScheduledJobQuery } from '@/core/scheduler/api/SchedulerApi.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'
	import { useSchedulerFormat } from '@/core/scheduler/composable/useSchedulerFormat.ts'
	import { useAuth } from '@/_common/auth/authAdapter.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import {
		queryBool,
		queryDate,
		queryEnum,
		queryNumber,
		queryString,
	} from '@/core/scheduler/composable/listQueryState.ts'

	const i18n = useI18n()
	const route = useRoute()
	const router = useRouter()
	const auth = useAuth()
	const { showErrorSnackbar } = useSnackbar()
	const { formatDateTime } = useSchedulerFormat()
	const { loading, fetchFilteredTable } = useScheduledJobQuery()

	const isAdmin = computed(() => auth.isAdminRole())

	const DEFAULT_SORT_KEY = 'nextRunAt'
	const DEFAULT_PER_PAGE = 25

	// Hydrate the bookmarkable list state (filters, sort, page, overdue toggle) from the URL so a deep
	// link / browser back / shared URL restores the same view (CLAUDE.md "URL State" rule).
	const items = ref<ScheduledJobGridResponse[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(queryNumber(route.query.perPage, DEFAULT_PER_PAGE))
	const page = ref(queryNumber(route.query.page, 1))
	const sortBy = ref<VSortItem[]>([
		new VSortItem(queryString(route.query.sort) ?? DEFAULT_SORT_KEY, route.query.dir === 'desc' ? 'desc' : 'asc'),
	])
	const filter = ref(
		new ScheduledJobFilter(
			queryString(route.query.ownerModule),
			queryString(route.query.handlerKey),
			queryEnum(route.query.status, AllJobStatusList),
			queryEnum(route.query.scheduleType, AllScheduleTypeList),
			queryEnum(route.query.lastOutcome, AllRunOutcomeList),
			queryDate(route.query.nextRunFrom),
			queryDate(route.query.nextRunTo),
		),
	)
	const onlyOverdue = ref(queryBool(route.query.overdue))
	const exporting = ref(false)

	const columns = computed(() => [
		new TableColumn('jobKey', i18n.t('scheduler.job.jobKey')),
		new TableColumn('ownerModule', i18n.t('scheduler.job.ownerModule')),
		new TableColumn('handlerKey', i18n.t('scheduler.job.handlerKey'), false),
		new TableColumn('scheduleType', i18n.t('scheduler.job.schedule'), false),
		new TableColumn('status', i18n.t('scheduler.job.status')),
		new TableColumn('lastRunAt', i18n.t('scheduler.job.lastRun')),
		new TableColumn('nextRunAt', i18n.t('scheduler.job.nextRun')),
	])

	const itemsById = computed(() => new Map(items.value.map(item => [item.id, item])))

	const chipFormatters: ChipFormatters<ScheduledJobFilter> = {
		ownerModule: v => (v ? { label: `${i18n.t('scheduler.job.ownerModule')}: ${v}`, icon: 'cube' } : null),
		handlerKey: v => (v ? { label: `${i18n.t('scheduler.job.handlerKey')}: ${v}`, icon: 'code' } : null),
		status: v => (v ? { label: i18n.t(`scheduler.jobStatus.${v}`), icon: 'flag' } : null),
		scheduleType: v => (v ? { label: i18n.t(`scheduler.scheduleType.${v}`), icon: 'repeat' } : null),
		lastOutcome: v => (v ? { label: i18n.t(`scheduler.runOutcome.${v}`), icon: 'circle-check' } : null),
		nextRunFrom: v =>
			v ? { label: `${i18n.t('scheduler.job.nextRunFrom')}: ${formatDateTime(v)}`, icon: 'calendar' } : null,
		nextRunTo: v =>
			v ? { label: `${i18n.t('scheduler.job.nextRunTo')}: ${formatDateTime(v)}`, icon: 'calendar' } : null,
	}

	function buildRequest(unpaged = false): FilteredTableRequest<ScheduledJobFilter> {
		const effectiveFilter = new ScheduledJobFilter(
			filter.value.ownerModule,
			filter.value.handlerKey,
			filter.value.status,
			filter.value.scheduleType,
			filter.value.lastOutcome,
			filter.value.nextRunFrom,
			filter.value.nextRunTo,
			onlyOverdue.value ? true : null,
		)
		// Export must cover the whole filtered result set, not just the current page.
		return new FilteredTableRequest(
			unpaged ? -1 : itemsPerPage.value,
			unpaged ? 1 : page.value,
			sortBy.value,
			true,
			effectiveFilter,
		)
	}

	// Mirror the current list state back into the URL query so it stays bookmark/back/share-able.
	function syncQuery() {
		const query: Record<string, string> = {}
		if (page.value !== 1) query.page = String(page.value)
		if (itemsPerPage.value !== DEFAULT_PER_PAGE) query.perPage = String(itemsPerPage.value)
		const sort = sortBy.value[0]
		if (sort && (sort.key !== DEFAULT_SORT_KEY || sort.order === 'desc' || sort.order === true)) {
			query.sort = sort.key
			query.dir = sort.order === 'desc' || sort.order === true ? 'desc' : 'asc'
		}
		if (onlyOverdue.value) query.overdue = 'true'
		if (filter.value.ownerModule) query.ownerModule = filter.value.ownerModule
		if (filter.value.handlerKey) query.handlerKey = filter.value.handlerKey
		if (filter.value.status) query.status = filter.value.status
		if (filter.value.scheduleType) query.scheduleType = filter.value.scheduleType
		if (filter.value.lastOutcome) query.lastOutcome = filter.value.lastOutcome
		if (filter.value.nextRunFrom) query.nextRunFrom = filter.value.nextRunFrom.toISOString()
		if (filter.value.nextRunTo) query.nextRunTo = filter.value.nextRunTo.toISOString()
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

	function applyOverdueToggle() {
		reload()
	}

	async function exportList(format: ExportFormat) {
		if (exporting.value) return
		exporting.value = true
		try {
			const { blob, fileName } = await exportScheduledJobs(buildRequest(true), format)
			downloadBlob(blob, fileName)
		} catch {
			showErrorSnackbar(i18n.t('scheduler.exportError'))
		} finally {
			exporting.value = false
		}
	}

	// Initial load is triggered by the table's @onLoadItems (VDataTableServer emits update:options on mount).
</script>
