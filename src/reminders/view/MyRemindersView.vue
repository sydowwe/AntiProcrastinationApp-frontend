<template>
	<VContainer
		fluid
		class="d-flex flex-column h-100"
	>
		<div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
			<div>
				<h1 class="text-h5">{{ $t('reminderDashboard.my.title') }}</h1>
				<p class="text-body-2 text-medium-emphasis mb-0">{{ $t('reminderDashboard.my.subtitle') }}</p>
			</div>
			<div class="d-flex align-center ga-3 flex-wrap">
				<VBtn
					variant="text"
					color="primaryOutline"
					prependIcon="gear"
					:to="{ name: 'reminderPreferences' }"
				>
					{{ $t('reminderDashboard.my.preferences') }}
				</VBtn>
				<FilterPanel
					v-model="filter"
					:defaultFactory="() => new MyReminderFilter()"
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
							v-model="draft.kind"
							:label="$t('reminders.key.kind')"
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
						v-if="item.subjectType !== null"
						class="text-caption text-medium-emphasis"
					>
						{{ item.subjectType }} #{{ item.subjectId }}
					</span>
				</div>
			</template>
			<template #item.scheduleType="{ item }">
				<ReminderScheduleDisplay
					:scheduleType="item.scheduleType"
					:cronExpression="item.cronExpression"
					:intervalPreset="item.intervalPreset"
					:dueAt="item.nextOccurrence"
				/>
			</template>
			<template #item.nextOccurrence="{ value }">
				<span v-if="value !== null">{{ formatInstant(value) }}</span>
				<span
					v-else
					class="text-medium-emphasis"
				>
					-
				</span>
			</template>

			<template #additionalActions="{ id }">
				<VIconBtn
					icon="clock"
					variant="tonal"
					size="small"
					color="primaryOutline"
					:title="$t('reminderDashboard.snooze.action')"
					:disabled="!canAct(id)"
					@click="openSnooze(id)"
				>
					<VIcon size="15" />
				</VIconBtn>
				<VIconBtn
					icon="bell-slash"
					variant="tonal"
					size="small"
					color="warning"
					:title="$t('reminderDashboard.dismiss.action')"
					:disabled="!canAct(id)"
					@click="openDismiss(id)"
				>
					<VIcon size="15" />
				</VIconBtn>
			</template>
		</BasicTable>

		<SnoozeDialog
			v-if="activeOccurrence"
			v-model="snoozeDialog"
			:occurrenceInstant="activeOccurrence"
			:loading="acting"
			@confirmed="confirmSnooze"
		/>

		<MyDialog
			v-model="dismissDialog"
			:title="$t('reminderDashboard.dismiss.title')"
			:text="$t('reminderDashboard.dismiss.text')"
			:confirmBtnLabel="$t('reminderDashboard.dismiss.confirm')"
			confirmBtnColor="warningDark"
			:confirmBtnDisabled="acting"
			@confirmed="confirmDismiss"
		/>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { isAxiosError } from 'axios'
	import { VDateInput } from 'vuetify/labs/components'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import ReminderScheduleDisplay from '@/core/reminders/component/ReminderScheduleDisplay.vue'
	import SnoozeDialog from '@/core/reminders/component/SnoozeDialog.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { MyReminderFilter } from '@/core/reminders/dto/request/MyReminderFilter.ts'
	import { DismissOccurrenceRequest } from '@/core/reminders/dto/request/DismissOccurrenceRequest.ts'
	import { SnoozeOccurrenceRequest } from '@/core/reminders/dto/request/SnoozeOccurrenceRequest.ts'
	import type { UpcomingReminderGridResponse } from '@/core/reminders/dto/response/UpcomingReminderGridResponse.ts'
	import { AllReminderScheduleTypeList } from '@/core/reminders/dto/enum/ReminderScheduleType.ts'
	import {
		dismissOccurrence,
		snoozeOccurrence,
		useMyReminderQuery,
	} from '@/core/reminders/api/ReminderDashboardApi.ts'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const i18n = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar, showSnackbar } = useSnackbar()
	const { formatInstant } = useReminderFormat()
	const { loading, fetchFilteredTable } = useMyReminderQuery()

	const items = ref<UpcomingReminderGridResponse[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('nextOccurrence', 'asc')])
	const filter = ref(new MyReminderFilter())

	const snoozeDialog = ref(false)
	const dismissDialog = ref(false)
	const activeReminderId = ref<number | null>(null)
	const acting = ref(false)

	const columns = computed(() => [
		new TableColumn('kind', i18n.t('reminders.key.kind')),
		new TableColumn('ownerModule', i18n.t('reminders.key.ownerModule')),
		new TableColumn('scheduleType', i18n.t('reminders.field.scheduleType'), false),
		new TableColumn('nextOccurrence', i18n.t('reminderDashboard.nextOccurrence')),
	])

	const itemsById = computed(() => new Map(items.value.map(item => [item.id, item])))

	const activeOccurrence = computed<Date | null>(() =>
		activeReminderId.value !== null ? (itemsById.value.get(activeReminderId.value)?.nextOccurrence ?? null) : null,
	)

	// Both actions require a future occurrence - guard the buttons (the server also enforces this, 400).
	function canAct(id: number): boolean {
		const next = itemsById.value.get(id)?.nextOccurrence
		return next !== null && next !== undefined && next.getTime() > Date.now()
	}

	const scheduleTypeOptions = computed(() =>
		AllReminderScheduleTypeList.map(s => ({ value: s, title: i18n.t(`reminders.scheduleType.${s}`) })),
	)

	const chipFormatters: ChipFormatters<MyReminderFilter> = {
		ownerModule: v => (v ? { label: `${i18n.t('reminders.key.ownerModule')}: ${v}`, icon: 'cube' } : null),
		kind: v => (v ? { label: `${i18n.t('reminders.key.kind')}: ${v}`, icon: 'bell' } : null),
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

	function buildRequest(): FilteredTableRequest<MyReminderFilter> {
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

	function openSnooze(id: number) {
		activeReminderId.value = id
		snoozeDialog.value = true
	}

	function openDismiss(id: number) {
		activeReminderId.value = id
		dismissDialog.value = true
	}

	function dropActiveRow() {
		items.value = items.value.filter(i => i.id !== activeReminderId.value)
		itemsLength.value = Math.max(0, itemsLength.value - 1)
	}

	async function confirmSnooze(snoozeUntil: Date) {
		if (activeReminderId.value === null || activeOccurrence.value === null || acting.value) return
		acting.value = true
		try {
			await snoozeOccurrence(
				new SnoozeOccurrenceRequest(activeReminderId.value, activeOccurrence.value, snoozeUntil),
			)
			showSuccessSnackbar(i18n.t('reminderDashboard.snooze.success', { time: formatInstant(snoozeUntil) }))
			// The occurrence is deferred - drop it from the upcoming list optimistically.
			dropActiveRow()
			snoozeDialog.value = false
			activeReminderId.value = null
		} catch (e: unknown) {
			handleActionError(e)
		} finally {
			acting.value = false
		}
	}

	async function confirmDismiss() {
		if (activeReminderId.value === null || activeOccurrence.value === null || acting.value) return
		acting.value = true
		try {
			await dismissOccurrence(new DismissOccurrenceRequest(activeReminderId.value, activeOccurrence.value))
			showSuccessSnackbar(i18n.t('reminderDashboard.dismiss.success'))
			dropActiveRow()
			dismissDialog.value = false
			activeReminderId.value = null
		} catch (e: unknown) {
			handleActionError(e)
		} finally {
			acting.value = false
		}
	}

	// 404 = not available to you (not yours / gone / strategy-resolved); 400 = past occurrence. Surface both
	// quietly and refresh so the list reflects reality, rather than dwelling on them as hard errors.
	function handleActionError(e: unknown) {
		snoozeDialog.value = false
		dismissDialog.value = false
		if (isAxiosError(e)) {
			if (e.response?.status === 404) {
				showSnackbar(i18n.t('reminderDashboard.actions.notAvailable'), { color: 'info' })
				dropActiveRow()
				activeReminderId.value = null
				return
			}
			if (e.response?.status === 400) {
				showSnackbar(i18n.t('reminderDashboard.actions.pastOccurrence'), { color: 'warning' })
				activeReminderId.value = null
				loadItems()
				return
			}
		}
		showErrorSnackbar(i18n.t('reminderDashboard.actions.error'))
		activeReminderId.value = null
	}
</script>
