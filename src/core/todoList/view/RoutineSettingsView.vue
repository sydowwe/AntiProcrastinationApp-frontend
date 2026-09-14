<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-4">
		<div class="d-flex align-center ga-3">
			<h2>{{ $t('routineTodoList.timePeriods.title') }}</h2>
			<VBtn
				color="primary"
				prependIcon="plus"
				@click="openAddDialog"
			>
				{{ $t('toDoList.add') }}
			</VBtn>
		</div>
		<PersonalBestsPanel :timePeriods="timePeriods" />
		<BasicTable
			:items="timePeriods"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			:loading
			:columns
			:itemsLength="timePeriods.length"
			deleteConfirmationColumn="text"
			:showSelect="false"
			:showActionsHeader="false"
			@onLoadItems="loadItems"
			@onEdit="openEditDialog"
			@onDelete="onDelete"
		>
			<template #item.color="{ item }">
				<div class="d-flex justify-center">
					<VSheet
						v-if="item.color"
						:color="getBgColor(item.color)"
						width="22"
						height="22"
						rounded="circle"
					/>
					<VIcon
						v-else
						icon="clock"
						size="22"
					/>
				</div>
			</template>
			<template #item.streakThreshold="{ item }">{{ item.streakThreshold }}%</template>
			<template #item.streakGraceDays="{ item }">
				{{ item.streakGraceDays > 0 ? `${item.streakGraceDays}d` : '—' }}
			</template>
			<template #item.resetAnchorDay="{ item }">
				{{ item.resetAnchorDay > 0 ? formatAnchorDay(item.id, item.resetAnchorDay) : '—' }}
			</template>
			<template #item.isHidden="{ item }">
				<VSwitch
					class="mx-auto pr-4"
					style="width: fit-content"
					:modelValue="item.isHidden"
					color="primaryOutline"
					@update:modelValue="onVisibilityChange($event, item.id)"
					hideDetails
				></VSwitch>
			</template>
		</BasicTable>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import axios from 'axios'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import type { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
	import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
	import { handleHttpCodes } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import TimePeriodForm from '@/core/todoList/component/routine/dialog/TimePeriodForm.vue'
	import PersonalBestsPanel from '@/core/todoList/component/routine/PersonalBestsPanel.vue'
	import { useAnchorDayOptions } from '@/core/todoList/composable/useAnchorDayOptions.ts'
	import { useI18n } from 'vue-i18n'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const { fetchAll, createWithResponse, update, deleteEntity, changeTimePeriodVisibility } =
		useRoutineTimePeriodCrud()
	const { fetchGroupedByTimePeriod } = useRoutineTodoListItemCrud()
	const { getBgColor } = useColor()
	const { openDialog } = useDialog()
	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()
	const { weekDayNames, formatAnchorDayOfMonth } = useAnchorDayOptions()

	const timePeriods = ref<RoutineTimePeriodEntity[]>([])
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([new VSortItem('lengthInDays', 'asc')])
	const loading = ref(false)

	// Computed, not a plain array: the headers have to follow a locale switch, and a `TableColumn[]`
	// built at setup time would freeze whichever locale happened to be active then.
	const columns = computed<TableColumn[]>(() => [
		new TableColumn('color', t('routineTodoList.timePeriods.color'), false),
		new TableColumn('text', t('routineTodoList.timePeriods.name')),
		new TableColumn('lengthInDays', t('routineTodoList.timePeriods.lengthColumn')),
		new TableColumn('resetAnchorDay', t('routineTodoList.timePeriods.resetAnchorColumn'), false),
		new TableColumn('streakThreshold', t('routineTodoList.timePeriods.streakThresholdColumn')),
		new TableColumn('streakGraceDays', t('routineTodoList.timePeriods.graceDays')),
		new TableColumn('isHidden', t('routineTodoList.timePeriods.isHidden')),
	])

	async function loadItems() {
		loading.value = true
		timePeriods.value = await fetchAll()
		loading.value = false
	}

	function periodById(id: number): RoutineTimePeriodEntity | undefined {
		return timePeriods.value.find(p => p.id === id)
	}

	function isWeekAligned(lengthInDays: number): boolean {
		return lengthInDays <= 7 || lengthInDays % 7 === 0
	}

	function formatAnchorDay(id: number, value: number): string {
		const period = periodById(id)
		if (!period) return String(value)
		if (isWeekAligned(period.lengthInDays)) return weekDayNames.value[value - 1] ?? String(value)
		return formatAnchorDayOfMonth(value)
	}

	// The request runs inside the form's confirm (see `TimePeriodForm`'s `submit` prop) so a refused
	// save keeps the dialog open. `_silent` for the same reason as `onDelete` below: `lengthInDays` is
	// unique per account and the server answers a bare 409 from the index, which the interceptor
	// words as an optimistic-concurrency conflict. The form turns it into an inline field error.
	function openAddDialog() {
		openDialog({
			component: TimePeriodForm,
			componentProps: {
				existingPeriods: timePeriods.value,
				submit: async (request: TimePeriodRequest) => {
					const created = await createWithResponse(request, { _silent: true })
					timePeriods.value.push(created)
				},
			},
			dialogProps: {
				title: t('routineTodoList.timePeriods.add'),
				confirmBtnLabel: t('general.create'),
			},
		})
	}

	function openEditDialog(entityToEdit: RoutineTimePeriodEntity) {
		openDialog({
			component: TimePeriodForm,
			componentProps: {
				entityToEdit,
				existingPeriods: timePeriods.value,
				submit: async (request: TimePeriodRequest) => {
					await update(entityToEdit.id, request, { _silent: true })
					const index = timePeriods.value.findIndex(p => p.id === entityToEdit.id)
					if (index !== -1) {
						timePeriods.value[index] = { ...timePeriods.value[index], ...request }
					}
				},
			},
			dialogProps: {
				title: t('routineTodoList.timePeriods.edit'),
				confirmBtnLabel: t('general.save'),
			},
		})
	}

	async function onDelete(item: RoutineTimePeriodEntity) {
		try {
			// `_silent` so the interceptor's generic 409 message never fires here. This endpoint answers 409
			// for a *referential* refusal — the period still has routines and the FK is `Restrict`
			// server-side — not for the optimistic-concurrency case that message was written for, so it
			// tells the user their record "was changed by someone else" and to refresh, neither of which is
			// true or helps (findings.md B9). Silencing is per call, so every other status falls through to
			// the shared handler below and keeps its normal message.
			await deleteEntity(item.id, { _silent: true })
		} catch (e) {
			const status = axios.isAxiosError(e) ? e.response?.status : undefined
			if (status === 409) await showDeleteBlocked(item)
			else handleHttpCodes(status ?? 0)
			return
		}
		timePeriods.value = timePeriods.value.filter(p => p.id !== item.id)
	}

	/**
	 * Names the way out of a refused delete, with the count when it can get one.
	 *
	 * The count costs a request this screen does not otherwise make, so it is fetched only here, in the
	 * failure path. If that fetch fails — or returns no group for the period, which would mean the server
	 * and this read disagree — it degrades to the same sentence without a number, never to silence.
	 */
	async function showDeleteBlocked(item: RoutineTimePeriodEntity) {
		const name = item.text ?? String(item.id)
		try {
			const groups = await fetchGroupedByTimePeriod()
			const count = groups.find(group => group.timePeriod.id === item.id)?.items.length ?? 0
			if (count === 0) {
				showErrorSnackbar(t('routineTodoList.timePeriods.deleteBlockedUnknownCount', { name }))
				return
			}
			showErrorSnackbar(t('routineTodoList.timePeriods.deleteBlocked', { name, count }, count))
		} catch {
			showErrorSnackbar(t('routineTodoList.timePeriods.deleteBlockedUnknownCount', { name }))
		}
	}

	function onVisibilityChange(isHidden: boolean, id: number) {
		changeTimePeriodVisibility(id)
		const a = timePeriods.value.find(timePeriod => timePeriod.id === id)
		if (a) a.isHidden = isHidden
	}
</script>
