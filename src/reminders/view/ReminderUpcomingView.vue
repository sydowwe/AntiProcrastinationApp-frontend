<template>
	<VContainer
		fluid
		class="d-flex flex-column h-100"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
				<h1 class="text-h5">{{ $t('reminderDashboard.upcoming.title') }}</h1>
				<div class="d-flex align-center ga-3 flex-wrap">
					<VBtn
						variant="outlined"
						color="primaryOutline"
						prependIcon="chart-simple"
						:to="{ name: 'reminderOverview' }"
					>
						{{ $t('reminderDashboard.overview.title') }}
					</VBtn>
					<VBtn
						variant="outlined"
						color="secondaryOutline"
						prependIcon="clock-rotate-left"
						:to="{ name: 'reminderDispatchHistory' }"
					>
						{{ $t('reminderDashboard.dispatch.title') }}
					</VBtn>
					<ExportMenu
						:loading="exporting"
						@export="exportList"
					/>
					<FilterPanel
						v-model="filter"
						:defaultFactory="() => new UpcomingReminderFilter()"
						:chipFormatters
						@apply="reload"
					>
						<template #fields="{ draft }">
							<VTextField
								v-model="draft.ownerModule"
								:label="$t('reminders.key.ownerModule')"
								hideDetails
							/>
							<VTextField
								v-model="draft.subjectType"
								:label="$t('reminders.key.subjectType')"
								hideDetails
							/>
							<VTextField
								v-model="draft.kind"
								:label="$t('reminders.key.kind')"
								hideDetails
							/>
							<VNumberInput
								v-model="draft.recipientUserId"
								:label="$t('reminderDashboard.recipient')"
								:min="1"
								controlVariant="stacked"
								hideDetails
							/>
							<VSelect
								v-model="draft.status"
								:items="statusOptions"
								itemTitle="title"
								itemValue="value"
								:label="$t('reminders.field.status')"
								hideDetails
							/>
							<VSelect
								v-model="draft.scheduleType"
								:items="scheduleTypeOptions"
								itemTitle="title"
								itemValue="value"
								:label="$t('reminders.field.scheduleType')"
								hideDetails
							/>
							<VDateInput
								v-model="draft.nextOccurrenceFrom"
								:label="$t('reminders.field.nextOccurrenceFrom')"
								hideDetails
							/>
							<VDateInput
								v-model="draft.nextOccurrenceTo"
								:label="$t('reminders.field.nextOccurrenceTo')"
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
				<template #item.kind="{ item, value }">
					<div class="d-flex flex-column py-1">
						<span class="font-weight-medium">{{ value }}</span>
						<span
							v-if="item.subjectType"
							class="text-caption text-medium-emphasis"
						>
							{{ item.subjectType }} #{{ item.subjectId }}
						</span>
					</div>
				</template>
				<template #item.scheduleType="{ item }">
					<div class="d-flex align-center ga-2">
						<ReminderScheduleDisplay
							:scheduleType="item.scheduleType"
							:cronExpression="item.cronExpression"
							:intervalPreset="item.intervalPreset"
							:dueAt="item.nextOccurrence"
						/>
						<ChipWithIcon
							v-if="item.hasLeadOffsets"
							icon="bell"
							color="secondaryOutline"
							size="x-small"
							:title="$t('reminderDashboard.upcoming.leadOffsetsHint')"
						>
							{{ $t('reminderDashboard.upcoming.leadOffsets') }}
						</ChipWithIcon>
					</div>
				</template>
				<template #item.status="{ value }">
					<ReminderStatusChip :status="value" />
				</template>
				<template #item.recipientCount="{ value }">
					<ChipWithIcon
						icon="users"
						color="secondaryOutline"
						size="small"
					>
						{{ value }}
					</ChipWithIcon>
				</template>
				<template #item.nextOccurrence="{ value }">
					<span v-if="value">{{ formatInstant(value) }}</span>
					<span
						v-else
						class="text-medium-emphasis"
					>
						-
					</span>
				</template>

				<template #additionalActions="{ id }">
					<VIconBtn
						icon="clock-rotate-left"
						variant="tonal"
						size="small"
						color="secondaryOutline"
						:title="$t('reminderDashboard.upcoming.viewHistory')"
						@click="$router.push({ name: 'reminderDispatchHistory', query: { reminderId: id } })"
					>
						<VIcon size="15" />
					</VIconBtn>
				</template>
			</BasicTable>
		</template>

		<VCard
			v-else
			class="pa-6 text-center"
		>
			<p class="text-error">{{ $t('general.forbidden') }}</p>
		</VCard>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { VDateInput } from 'vuetify/labs/components'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ExportMenu from '@/_common/component/ExportMenu.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import ReminderScheduleDisplay from '@/core/reminders/component/ReminderScheduleDisplay.vue'
	import ReminderStatusChip from '@/core/reminders/component/ReminderStatusChip.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { UpcomingReminderFilter } from '@/core/reminders/dto/request/UpcomingReminderFilter.ts'
	import type { UpcomingReminderGridResponse } from '@/core/reminders/dto/response/UpcomingReminderGridResponse.ts'
	import { AllReminderStatusList } from '@/core/reminders/dto/enum/ReminderStatus.ts'
	import { AllReminderScheduleTypeList } from '@/core/reminders/dto/enum/ReminderScheduleType.ts'
	import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
	import { exportUpcomingReminders, useUpcomingReminderQuery } from '@/core/reminders/api/ReminderDashboardApi.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const i18n = useI18n()
	const authStore = useAuthStore()
	const { showErrorSnackbar } = useSnackbar()
	const { formatInstant } = useReminderFormat()
	const { loading, fetchFilteredTable } = useUpcomingReminderQuery()

	const isAdmin = computed(() => authStore.isAdminRole())

	const items = ref<UpcomingReminderGridResponse[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('nextOccurrence', 'asc')])
	const filter = ref(new UpcomingReminderFilter())
	const exporting = ref(false)

	const columns = computed(() => [
		new TableColumn('kind', i18n.t('reminders.key.kind')),
		new TableColumn('ownerModule', i18n.t('reminders.key.ownerModule')),
		new TableColumn('scheduleType', i18n.t('reminders.field.scheduleType'), false),
		new TableColumn('status', i18n.t('reminders.field.status')),
		new TableColumn('recipientCount', i18n.t('reminderDashboard.recipients'), false),
		new TableColumn('nextOccurrence', i18n.t('reminderDashboard.nextOccurrence')),
	])

	const statusOptions = computed(() =>
		AllReminderStatusList.map(s => ({ value: s, title: i18n.t(`reminders.status.${s}`) })),
	)
	const scheduleTypeOptions = computed(() =>
		AllReminderScheduleTypeList.map(s => ({ value: s, title: i18n.t(`reminders.scheduleType.${s}`) })),
	)

	const chipFormatters: ChipFormatters<UpcomingReminderFilter> = {
		ownerModule: v => (v ? { label: `${i18n.t('reminders.key.ownerModule')}: ${v}`, icon: 'cube' } : null),
		subjectType: v => (v ? { label: `${i18n.t('reminders.key.subjectType')}: ${v}`, icon: 'tag' } : null),
		kind: v => (v ? { label: `${i18n.t('reminders.key.kind')}: ${v}`, icon: 'bell' } : null),
		recipientUserId: v => (v ? { label: `${i18n.t('reminderDashboard.recipient')}: #${v}`, icon: 'user' } : null),
		status: v => (v ? { label: i18n.t(`reminders.status.${v}`), icon: 'flag' } : null),
		scheduleType: v => (v ? { label: i18n.t(`reminders.scheduleType.${v}`), icon: 'repeat' } : null),
		nextOccurrenceFrom: v =>
			v
				? { label: `${i18n.t('reminders.field.nextOccurrenceFrom')}: ${formatInstant(v)}`, icon: 'calendar' }
				: null,
		nextOccurrenceTo: v =>
			v
				? { label: `${i18n.t('reminders.field.nextOccurrenceTo')}: ${formatInstant(v)}`, icon: 'calendar' }
				: null,
	}

	function buildRequest(): FilteredTableRequest<UpcomingReminderFilter> {
		return new FilteredTableRequest(itemsPerPage.value, page.value, sortBy.value, true, filter.value)
	}

	async function loadItems() {
		const result = await fetchFilteredTable(buildRequest())
		items.value = result.items
		itemsLength.value = result.itemsCount
	}

	function reload() {
		page.value = 1
		loadItems()
	}

	async function exportList(format: ExportFormat) {
		if (exporting.value) return
		exporting.value = true
		try {
			const { blob, fileName } = await exportUpcomingReminders(buildRequest(), format)
			downloadBlob(blob, fileName)
		} catch {
			showErrorSnackbar(i18n.t('reminderDashboard.exportError'))
		} finally {
			exporting.value = false
		}
	}
</script>
