<template>
<div class="w-100 d-flex flex-column">
	<VRow justify="center" noGutters class="flex-0-1">
		<VCol cols="10" sm="8" md="10" lg="8" class="pt-0 pt-md-2">
			<HistoryPanelFilter @filterApplied="handleFilterApplied"></HistoryPanelFilter>
		</VCol>
	</VRow>
	<VRow justify="start" class="my-2 flex-fill px-5 overflow-y-scroll" style="height: 0">
		<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
			<div class="w-100" v-for="groupedRecord in groupedRecords?.slice(0, midpoint)">
				<div class="w-100 bg-blue-grey rounded text-center">{{ formatLocalized(groupedRecord.date, 'L') }}</div>
				<HistoryRecordItem
					class="my-2 my-md-3 w-100"
					:record="record"
					v-for="record in groupedRecord.historyList"
					:key="record.id"
				></HistoryRecordItem>
			</div>
		</VCol>
		<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
			<div class="w-100" v-for="groupedRecord in groupedRecords?.slice(midpoint,groupedRecords.length)">
				<div class="w-100 bg-blue-grey rounded text-center">{{ groupedRecord.date }}</div>
				<HistoryRecordItem
					class="my-2 my-md-3 w-100"
					:record="record"
					v-for="record in groupedRecord.historyList"
					:key="record.id"
				></HistoryRecordItem>
			</div>
		</VCol>
	</VRow>
</div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import HistoryPanelFilter from '../components/history/HistoryPanelFilter.vue';
import HistoryRecordItem from '../components/history/HistoryRecordItem.vue';
import {ActivityHistory, ActivityHistoryFilter, HistoryGroupedByDate} from '@/classes/ActivityHistory.ts';
import {useMoment} from '@/scripts/momentHelper.ts';
import {useFilteredTable} from '@/composables/general/CrudComposition.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {FilteredTableRequest, SortByRequest} from '@/classes/Generic.ts';

const groupedRecords = ref([] as HistoryGroupedByDate[]);
const {formatLocalized} = useMoment();

const midpoint = computed(() => Math.ceil(groupedRecords.value.length / 2));


function handleFilterApplied(filterData: ActivityHistoryFilter, isDateRange: boolean) {
	let filter = {...filterData, dateTo: filterData.dateTo ? new Date(filterData.dateTo) : null};
	filter.dateTo?.setHours(23, 59, 59, 999);
	if (isDateRange) {
		filter.hoursBack = null;
		filter.dateFrom?.setHours(0, 0, 1, 0);
	} else {
		filter.dateFrom = null;
	}
	const request = new FilteredTableRequest<ActivityHistoryFilter>(100, 1, [new SortByRequest('date', false)], true, filter)
	API.post(`/activity-history/filtered-table`, request)
		.then((response) => {
			groupedRecords.value = HistoryGroupedByDate.listFromObjects(response.data)
		})
		.catch((error) => {
			console.log(error);
		});
}
</script>
