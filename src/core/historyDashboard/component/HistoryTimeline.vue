<template>
	<div
		class="flex-fill mx-3 overflow-y-auto"
		style="min-height: 200px"
	>
		<VRow
			justify="start"
			class="my-2 mx-0"
		>
			<template v-if="singleColumn">
				<VCol
					cols="12"
					class="py-0 py-md-2 d-flex flex-column"
				>
					<template
						v-for="(record, i) in historyList"
						:key="record.id"
					>
						<div
							v-if="isDayChange(historyList, i)"
							class="w-100 bg-blue-grey rounded text-center mb-2"
						>
							{{ formatLocalized(record.startTimestamp, 'L') }}
						</div>
						<HistoryRecordItem
							class="my-2 my-md-3 w-100"
							:record="record"
							@edit="handleEdit"
							@delete="handleDeleteRequest"
						/>
					</template>
				</VCol>
			</template>
			<template v-else>
				<VCol
					cols="12"
					lg="6"
					class="py-0 py-md-2 d-flex flex-column"
				>
					<template
						v-for="(record, i) in firstHalf"
						:key="record.id"
					>
						<div
							v-if="isDayChange(firstHalf, i)"
							class="w-100 bg-blue-grey rounded text-center mb-2"
						>
							{{ formatLocalized(record.startTimestamp, 'L') }}
						</div>
						<HistoryRecordItem
							class="my-2 my-md-3 w-100"
							:record="record"
							@edit="handleEdit"
							@delete="handleDeleteRequest"
						/>
					</template>
				</VCol>
				<VCol
					cols="12"
					lg="6"
					class="py-0 py-md-2 d-flex flex-column"
				>
					<template
						v-for="(record, i) in secondHalf"
						:key="record.id"
					>
						<div
							v-if="isDayChange(secondHalf, i)"
							class="w-100 bg-blue-grey rounded text-center mb-2"
						>
							{{ formatLocalized(record.startTimestamp, 'L') }}
						</div>
						<HistoryRecordItem
							class="my-2 my-md-3 w-100"
							:record="record"
							@edit="handleEdit"
							@delete="handleDeleteRequest"
						/>
					</template>
				</VCol>
			</template>
		</VRow>

		<MyDialog
			v-model="deleteDialog"
			title="Delete confirmation"
			text="Are you sure you want to delete this activity history record?"
			confirmBtnColor="error"
			@confirmed="confirmDelete"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { formatLocalized } from '@/_common/utils/DateTimeHelper.ts'
	import { API } from '@/_common/axiosConfig.ts'
	import { DetailTimelineRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailTimelineRequest.ts'
	import { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
	import { useActivityHistoryCrud } from '@/core/activityHistory/api/activityHistoryApi.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import HistoryRecordItem from '@/core/activityHistory/component/HistoryRecordItem.vue'
	import EditActivityHistoryForm from '@/core/activityHistory/component/EditActivityHistoryForm.vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const props = defineProps<{
		date: string
		timeFrom: Time
		timeTo: Time
		singleColumn?: boolean
	}>()

	// --- Data ---
	const historyList = ref<ActivityHistory[]>([])
	const firstHalf = computed(() => historyList.value.slice(0, Math.ceil(historyList.value.length / 2)))
	const secondHalf = computed(() => historyList.value.slice(Math.ceil(historyList.value.length / 2)))

	// `startTimestamp` is an instant, so these day comparisons are browser-zone (C1 clock audit).
	// Deliberately left that way: the clock printed on each row next to the separator comes from
	// `formatToTime` (dayjs, browser-zone, no timezone plugin loaded), and a user-zone separator over
	// browser-zone times is worse than both being wrong together. Migrate the pair, or neither.
	const hasMultipleDays = computed(() => {
		if (historyList.value.length < 2) return false
		const first = historyList.value[0]!.startTimestamp
		const last = historyList.value[historyList.value.length - 1]!.startTimestamp
		return (
			first.getDate() !== last.getDate() ||
			first.getMonth() !== last.getMonth() ||
			first.getFullYear() !== last.getFullYear()
		)
	})

	function isDayChange(list: ActivityHistory[], index: number): boolean {
		if (!hasMultipleDays.value) return false
		if (index === 0) return true
		const prev = list[index - 1]?.startTimestamp
		const curr = list[index]?.startTimestamp
		if (!prev || !curr) return false
		return (
			prev.getFullYear() !== curr.getFullYear() ||
			prev.getMonth() !== curr.getMonth() ||
			prev.getDate() !== curr.getDate()
		)
	}

	// --- Fetch ---
	function fetchData() {
		const request = new DetailTimelineRequest(props.date, props.timeFrom, props.timeTo)
		API.post('/activity-history/filter', request)
			.then(response => {
				historyList.value = ActivityHistory.listFromObjects(response.data)
			})
			.catch(error => {
				console.log(error)
			})
	}

	watch(
		() => [props.date, props.timeFrom, props.timeTo],
		() => fetchData(),
		{ immediate: true },
	)

	// --- Delete ---
	const { deleteEntity } = useActivityHistoryCrud()
	const deleteDialog = ref(false)
	const deleteTargetId = ref<number | null>(null)
	const { shouldConfirm } = useDeleteConfirmation()

	// A leaf — one record, nothing hangs off it — but a record of something that actually happened,
	// and there is no undo path in this module today, so switching the preference off really does
	// delete it with no way back. See the P3 summary: this is the site that would most benefit from
	// an undo entry, and the only one where adding it is not a `core/todoList` refactor.
	async function handleDeleteRequest(id: number) {
		deleteTargetId.value = id
		if (shouldConfirm({ cascades: false, undoable: false })) {
			deleteDialog.value = true
		} else {
			await confirmDelete()
		}
	}

	async function confirmDelete() {
		if (!deleteTargetId.value) return
		await deleteEntity(deleteTargetId.value)
		historyList.value = historyList.value.filter(r => r.id !== deleteTargetId.value)
		deleteDialog.value = false
		deleteTargetId.value = null
	}

	// --- Edit ---
	const { openDialog } = useDialog()

	async function handleEdit(record: ActivityHistory) {
		const result = await openDialog({
			component: EditActivityHistoryForm,
			componentProps: { record },
			dialogProps: { title: 'Edit Activity History', isSmall: false },
		})
		if (result) fetchData()
	}
</script>
