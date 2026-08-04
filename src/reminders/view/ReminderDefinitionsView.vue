<template>
	<VContainer
		fluid
		class="d-flex flex-column h-100"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
				<h1 class="text-h5">{{ $t('reminders.list.title') }}</h1>
				<FilterPanel
					v-model="filter"
					:defaultFactory="() => new ReminderDefinitionFilter()"
					:chipFormatters
					@apply="loadItems"
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
				<template #item.subjectType="{ item }">
					<RouterLink
						class="text-primary font-weight-medium text-decoration-none"
						:to="{ name: 'reminderDefinitionDetail', params: { id: item.id } }"
					>
						{{ item.subjectType }} #{{ item.subjectId }}
					</RouterLink>
				</template>
				<template #item.scheduleType="{ item }">
					<ReminderScheduleDisplay :scheduleType="item.scheduleType" />
				</template>
				<template #item.status="{ value }">
					<ReminderStatusChip :status="value" />
				</template>
				<template #item.nextOccurrenceAt="{ value }">
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
						icon="eye"
						variant="tonal"
						size="small"
						color="secondaryOutline"
						:title="$t('general.show')"
						@click="$router.push({ name: 'reminderDefinitionDetail', params: { id } })"
					>
						<VIcon size="15" />
					</VIconBtn>
					<ReminderActionButtons
						v-if="itemsById.get(id)"
						:reminderKey="keyOf(itemsById.get(id)!)"
						:status="itemsById.get(id)!.status"
						iconOnly
						@statusChanged="loadItems"
					/>
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
	import ReminderScheduleDisplay from '@/core/reminders/component/ReminderScheduleDisplay.vue'
	import ReminderStatusChip from '@/core/reminders/component/ReminderStatusChip.vue'
	import ReminderActionButtons from '@/core/reminders/component/ReminderActionButtons.vue'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { ReminderDefinitionFilter } from '@/core/reminders/dto/request/ReminderDefinitionFilter.ts'
	import { ReminderKeyRequest } from '@/core/reminders/dto/request/ReminderKeyRequest.ts'
	import type { ReminderDefinitionGridResponse } from '@/core/reminders/dto/response/ReminderDefinitionGridResponse.ts'
	import { AllReminderStatusList } from '@/core/reminders/dto/enum/ReminderStatus.ts'
	import { AllReminderScheduleTypeList } from '@/core/reminders/dto/enum/ReminderScheduleType.ts'
	import { useReminderDefinitionQuery } from '@/core/reminders/api/ReminderDefinitionApi.ts'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'

	const i18n = useI18n()
	const authStore = useAuthStore()
	const { formatInstant } = useReminderFormat()
	const { loading, fetchFilteredTable } = useReminderDefinitionQuery()

	const isAdmin = computed(() => authStore.isAdminRole())

	const items = ref<ReminderDefinitionGridResponse[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('nextOccurrenceAt', 'asc')])
	const filter = ref(new ReminderDefinitionFilter())

	const columns = computed(() => [
		new TableColumn('ownerModule', i18n.t('reminders.key.ownerModule')),
		new TableColumn('subjectType', i18n.t('reminders.key.subject')),
		new TableColumn('kind', i18n.t('reminders.key.kind')),
		new TableColumn('scheduleType', i18n.t('reminders.field.scheduleType'), false),
		new TableColumn('status', i18n.t('reminders.field.status')),
		new TableColumn('nextOccurrenceAt', i18n.t('reminders.field.nextOccurrence')),
	])

	const itemsById = computed(() => new Map(items.value.map(item => [item.id, item])))

	function keyOf(row: ReminderDefinitionGridResponse): ReminderKeyRequest {
		return new ReminderKeyRequest(row.ownerModule, row.subjectType, row.subjectId, row.kind)
	}

	const statusOptions = computed(() =>
		AllReminderStatusList.map(s => ({ value: s, title: i18n.t(`reminders.status.${s}`) })),
	)
	const scheduleTypeOptions = computed(() =>
		AllReminderScheduleTypeList.map(s => ({ value: s, title: i18n.t(`reminders.scheduleType.${s}`) })),
	)

	const chipFormatters: ChipFormatters<ReminderDefinitionFilter> = {
		ownerModule: v => (v ? { label: `${i18n.t('reminders.key.ownerModule')}: ${v}`, icon: 'cube' } : null),
		subjectType: v => (v ? { label: `${i18n.t('reminders.key.subjectType')}: ${v}`, icon: 'tag' } : null),
		kind: v => (v ? { label: `${i18n.t('reminders.key.kind')}: ${v}`, icon: 'bell' } : null),
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

	function buildRequest(): FilteredTableRequest<ReminderDefinitionFilter> {
		return new FilteredTableRequest(itemsPerPage.value, page.value, sortBy.value, true, filter.value)
	}

	async function loadItems() {
		const result = await fetchFilteredTable(buildRequest())
		items.value = result.items
		itemsLength.value = result.itemsCount
	}
</script>
