<template>
	<VContainer
		fluid
		class="d-flex flex-column h-100"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
				<div class="d-flex align-center ga-3">
					<VBtn
						variant="text"
						prependIcon="arrow-left"
						:to="{ name: 'reminderUpcoming' }"
					>
						{{ $t('reminderDashboard.dispatch.backToUpcoming') }}
					</VBtn>
					<h1 class="text-h5">{{ $t('reminderDashboard.dispatch.title') }}</h1>
				</div>
				<div class="d-flex align-center ga-3 flex-wrap">
					<ExportMenu
						:loading="exporting"
						@export="exportList"
					/>
					<FilterPanel
						v-model="filter"
						:defaultFactory="() => new DispatchHistoryFilter()"
						:chipFormatters
						@apply="reload"
					>
						<template #fields="{ draft }">
							<VNumberInput
								v-model="draft.reminderId"
								:label="$t('reminderDashboard.dispatch.reminderId')"
								:min="1"
								controlVariant="stacked"
								hideDetails
							/>
							<VTextField
								v-model="draft.ownerModule"
								:label="$t('reminders.key.ownerModule')"
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
								v-model="draft.outcome"
								:items="outcomeOptions"
								itemTitle="title"
								itemValue="value"
								:label="$t('reminderDashboard.dispatch.outcome')"
								hideDetails
							/>
							<VDateInput
								v-model="draft.dispatchedFrom"
								:label="$t('reminderDashboard.dispatch.dispatchedFrom')"
								hideDetails
							/>
							<VDateInput
								v-model="draft.dispatchedTo"
								:label="$t('reminderDashboard.dispatch.dispatchedTo')"
								hideDetails
							/>
						</template>
					</FilterPanel>
				</div>
			</div>

			<VAlert
				type="info"
				variant="tonal"
				density="compact"
				class="mb-3"
				:text="$t('reminderDashboard.dispatch.appendOnlyHint')"
			/>

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
				<template #item.dispatchedAt="{ item, value }">
					<div class="d-flex flex-column py-1">
						<span>{{ formatInstant(value) }}</span>
						<span class="text-caption text-medium-emphasis">
							{{ $t('reminderDashboard.dispatch.occurrenceShort') }}:
							{{ formatInstant(item.occurrenceInstant) }}
						</span>
					</div>
				</template>
				<template #item.kind="{ item, value }">
					<div class="d-flex flex-column py-1">
						<span class="font-weight-medium">{{ value }}</span>
						<span class="text-caption text-medium-emphasis">{{ item.ownerModule }}</span>
					</div>
				</template>
				<template #item.outcome="{ item, value }">
					<div class="d-flex flex-column ga-1 py-1">
						<div class="d-flex align-center ga-2">
							<DispatchOutcomeChip :outcome="value" />
							<ChipWithIcon
								v-if="item.isReversal"
								icon="rotate-left"
								color="warning"
								size="x-small"
								:title="$t('reminderDashboard.dispatch.correctionHint')"
							>
								{{ $t('reminderDashboard.dispatch.corrects', { id: item.correctsDispatchId }) }}
							</ChipWithIcon>
						</div>
						<span
							v-if="item.skipReason"
							class="text-caption text-medium-emphasis"
						>
							{{ $t(`reminderDashboard.skipReason.${item.skipReason}`) }}
						</span>
					</div>
				</template>
				<template #item.notificationType="{ value }">
					<span
						v-if="value"
						class="text-body-2"
					>
						{{ value }}
					</span>
					<span
						v-else
						class="text-medium-emphasis"
					>
						-
					</span>
				</template>
				<template #item.recipientIds="{ item }">
					<RecipientChips :ids="item.recipientIds" />
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
	import { computed, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute } from 'vue-router'
	import { VDateInput } from 'vuetify/labs/components'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ExportMenu from '@/_common/component/ExportMenu.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import DispatchOutcomeChip from '@/core/reminders/component/DispatchOutcomeChip.vue'
	import RecipientChips from '@/core/reminders/component/RecipientChips.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { DispatchHistoryFilter } from '@/core/reminders/dto/request/DispatchHistoryFilter.ts'
	import type { DispatchHistoryGridResponse } from '@/core/reminders/dto/response/DispatchHistoryGridResponse.ts'
	import { AllDispatchOutcomeList } from '@/core/reminders/dto/enum/DispatchOutcome.ts'
	import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
	import { exportDispatchHistory, useDispatchHistoryQuery } from '@/core/reminders/api/ReminderDashboardApi.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const i18n = useI18n()
	const route = useRoute()
	const authStore = useAuthStore()
	const { showErrorSnackbar } = useSnackbar()
	const { formatInstant } = useReminderFormat()
	const { loading, fetchFilteredTable } = useDispatchHistoryQuery()

	const isAdmin = computed(() => authStore.isAdminRole())

	const items = ref<DispatchHistoryGridResponse[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('dispatchedAt', 'desc')])
	const filter = ref(new DispatchHistoryFilter())
	const exporting = ref(false)

	const columns = computed(() => [
		new TableColumn('dispatchedAt', i18n.t('reminderDashboard.dispatch.dispatchedAt')),
		new TableColumn('kind', i18n.t('reminders.key.kind'), false),
		new TableColumn('outcome', i18n.t('reminderDashboard.dispatch.outcome'), false),
		new TableColumn('notificationType', i18n.t('reminderDashboard.dispatch.notificationType'), false),
		new TableColumn('recipientIds', i18n.t('reminderDashboard.recipients'), false),
	])

	const outcomeOptions = computed(() =>
		AllDispatchOutcomeList.map(o => ({ value: o, title: i18n.t(`reminderDashboard.outcome.${o}`) })),
	)

	const chipFormatters: ChipFormatters<DispatchHistoryFilter> = {
		reminderId: v =>
			v ? { label: `${i18n.t('reminderDashboard.dispatch.reminderId')}: #${v}`, icon: 'bell' } : null,
		ownerModule: v => (v ? { label: `${i18n.t('reminders.key.ownerModule')}: ${v}`, icon: 'cube' } : null),
		recipientUserId: v => (v ? { label: `${i18n.t('reminderDashboard.recipient')}: #${v}`, icon: 'user' } : null),
		outcome: v => (v ? { label: i18n.t(`reminderDashboard.outcome.${v}`), icon: 'flag' } : null),
		dispatchedFrom: v =>
			v
				? {
						label: `${i18n.t('reminderDashboard.dispatch.dispatchedFrom')}: ${formatInstant(v)}`,
						icon: 'calendar',
					}
				: null,
		dispatchedTo: v =>
			v
				? {
						label: `${i18n.t('reminderDashboard.dispatch.dispatchedTo')}: ${formatInstant(v)}`,
						icon: 'calendar',
					}
				: null,
	}

	function buildRequest(): FilteredTableRequest<DispatchHistoryFilter> {
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
			const { blob, fileName } = await exportDispatchHistory(buildRequest(), format)
			downloadBlob(blob, fileName)
		} catch {
			showErrorSnackbar(i18n.t('reminderDashboard.exportError'))
		} finally {
			exporting.value = false
		}
	}

	onMounted(() => {
		// Deep-link support: ?reminderId=â€¦ pre-filters to one reminder's lineage (from upcoming/overview).
		const reminderIdParam = Number(route.query.reminderId)
		if (Number.isInteger(reminderIdParam) && reminderIdParam > 0) {
			filter.value.reminderId = reminderIdParam
		}
		loadItems()
	})
</script>
