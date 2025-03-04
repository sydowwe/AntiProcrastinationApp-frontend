<template>
    <VRow justify="center" noGutters>
        <VCol cols="10" sm="8" md="10" lg="8"  class="pt-0 pt-md-2">
            <HistoryPanelFilter @filterApplied="handleFilterApplied"></HistoryPanelFilter>
        </VCol>
        <VCol cols="12" class="pt-md-0 px-sm-2 px-md-4 px-lg-6">
            <VRow justify="start" class="my-2">
                <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
	                <div class="w-100" v-for="groupedRecord in groupedRecords?.slice(0, midpoint)">
		                <div class="w-100 bg-blue-grey rounded text-center">{{formatLocalized(groupedRecord.date,'L')}}</div>
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
			            <div class="w-100 bg-blue-grey rounded text-center">{{groupedRecord.date}}</div>
			            <HistoryRecordItem
				            class="my-2 my-md-3 w-100"
				            :record="record"
				            v-for="record in groupedRecord.historyList"
				            :key="record.id"
			            ></HistoryRecordItem>
		            </div>
	            </VCol>
            </VRow>
        </VCol>
    </VRow>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import HistoryPanelFilter from '../components/history/HistoryPanelFilter.vue';
    import HistoryRecordItem from '../components/history/HistoryRecordItem.vue';
    import {History, HistoryFilter, HistoryGroupedByDate} from '@/classes/History';
    import {useMoment} from '@/compositions/general/MomentHelper';
    const groupedRecords = ref([] as HistoryGroupedByDate[]);
    const {formatLocalized} = useMoment();
	const midpoint = ref(Math.ceil(groupedRecords.value.length / 2 + 2));

    function handleFilterApplied(filterData: HistoryFilter, isDateRange: boolean) {
	    let filter = {...filterData, dateTo: filterData.dateTo ? new Date(filterData.dateTo) : null};
	    filter.dateTo?.setHours(23, 59, 59, 999);
	    if (isDateRange) {
		    filter.hoursBack = null;
		    filter.dateFrom?.setHours(0, 0, 1, 0);
	    } else {
		    filter.dateFrom = null;
	    }
	    axios
		    .post(`/activity-history/filter`, filter)
		    .then((response) => {
			    groupedRecords.value = HistoryGroupedByDate.listFromObjects(response.data)
		    })
		    .catch((error) => {
			    console.log(error);
		    });
    }
</script>
