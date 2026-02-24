<template>
<div class="flex-fill mx-3 overflow-y-auto" style="min-height: 200px">
	<VRow justify="start" class="my-2 mx-0">
		<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
			<template v-for="(record, i) in firstHalf" :key="record.id">
				<div v-if="isDayChange(firstHalf, i)" class="w-100 bg-blue-grey rounded text-center mb-2">
					{{ formatLocalized(record.startTimestamp, 'L') }}
				</div>
				<HistoryRecordItem class="my-2 my-md-3 w-100" :record="record" @edit="handleEdit" @delete="handleDeleteRequest"/>
			</template>
		</VCol>
		<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
			<template v-for="(record, i) in secondHalf" :key="record.id">
				<div v-if="isDayChange(secondHalf, i)" class="w-100 bg-blue-grey rounded text-center mb-2">
					{{ formatLocalized(record.startTimestamp, 'L') }}
				</div>
				<HistoryRecordItem class="my-2 my-md-3 w-100" :record="record" @edit="handleEdit" @delete="handleDeleteRequest"/>
			</template>
		</VCol>
	</VRow>

	<MyDialog
		title="Delete confirmation"
		text="Are you sure you want to delete this activity history record?"
		v-model="deleteDialog"
		@confirmed="confirmDelete"
		confirmBtnColor="error"
	/>
	<EditActivityHistoryDialog ref="editDialogRef" @saved="fetchData"/>
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useMoment} from '@/utils/momentHelper.ts'
import {API} from '@/plugins/axiosConfig.ts'
import {DetailTimelineRequest} from '@/dtos/request/activityHistory/historyDetail/DetailTimelineRequest.ts'
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts'
import {useActivityHistoryCrud} from '@/api/ConcretesCrudComposable.ts'
import type {Time} from '@/dtos/dto/Time.ts'
import HistoryRecordItem from '@/components/history/HistoryRecordItem.vue'
import EditActivityHistoryDialog from '@/components/history/EditActivityHistoryDialog.vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'

const props = defineProps<{
	date: string
	timeFrom: Time
	timeTo: Time
}>()

const {formatLocalized} = useMoment()

// --- Data ---
const historyList = ref<ActivityHistory[]>([])
const firstHalf = computed(() => historyList.value.slice(0, Math.ceil(historyList.value.length / 2)))
const secondHalf = computed(() => historyList.value.slice(Math.ceil(historyList.value.length / 2)))

const hasMultipleDays = computed(() => {
	if (historyList.value.length < 2) return false
	const first = historyList.value[0]!.startTimestamp
	const last = historyList.value[historyList.value.length - 1]!.startTimestamp
	return first.getDate() !== last.getDate()
		|| first.getMonth() !== last.getMonth()
		|| first.getFullYear() !== last.getFullYear()
})

function isDayChange(list: ActivityHistory[], index: number): boolean {
	if (!hasMultipleDays.value) return false
	if (index === 0) return true
	const prev = list[index - 1]?.startTimestamp
	const curr = list[index]?.startTimestamp
	if (!prev || !curr) return false
	return prev.getFullYear() !== curr.getFullYear()
		|| prev.getMonth() !== curr.getMonth()
		|| prev.getDate() !== curr.getDate()
}

// --- Fetch ---
function fetchData() {
	const request = new DetailTimelineRequest(props.date, props.timeFrom, props.timeTo)
	API.post('/activity-history/filter', request)
		.then((response) => {
			historyList.value = ActivityHistory.listFromObjects(response.data)
		})
		.catch((error) => {
			console.log(error)
		})
}

watch(() => [props.date, props.timeFrom, props.timeTo], () => fetchData(), {immediate: true})

// --- Delete ---
const {deleteEntity} = useActivityHistoryCrud()
const deleteDialog = ref(false)
const deleteTargetId = ref<number | null>(null)

function handleDeleteRequest(id: number) {
	deleteTargetId.value = id
	deleteDialog.value = true
}

async function confirmDelete() {
	if (!deleteTargetId.value) return
	await deleteEntity(deleteTargetId.value)
	historyList.value = historyList.value.filter(r => r.id !== deleteTargetId.value)
	deleteDialog.value = false
	deleteTargetId.value = null
}

// --- Edit ---
const editDialogRef = ref<InstanceType<typeof EditActivityHistoryDialog>>()

function handleEdit(record: ActivityHistory) {
	editDialogRef.value?.open(record)
}
</script>
