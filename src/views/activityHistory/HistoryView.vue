<template>
    <VRow justify="center" noGutters>
        <VCol cols="10" sm="8" md="10" lg="8"  class="pt-0 pt-md-2">
            <HistoryPanelFilter @filterApplied="handleFilterApplied"></HistoryPanelFilter>
        </VCol>
        <VCol cols="12" class="pt-md-0 px-sm-2 px-md-4 px-lg-6">
            <VRow justify="start" class="my-2">
                <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
	                <div class="w-100" v-for="groupedRecord in groupedRecords?.slice(0, groupedRecords.length / 2 + 1)">
		                <div class="w-100 bg-blue-grey rounded text-center">{{formatLocalized(groupedRecord.date,'L')}}</div>
		                <HistoryRecordItem
			                class="my-2 my-md-3 w-100"
			                :record="record"
			                v-for="record in groupedRecord.historyList?.slice(0, groupedRecord.historyList.length / 2 + 1)"
			                :key="record.id"
		                ></HistoryRecordItem>
	                </div>
                </VCol>
	            <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
		            <div class="w-100" v-for="groupedRecord in groupedRecords?.slice(groupedRecords.length / 2 + 1)">
			            <div class="w-100 bg-blue-grey rounded text-center">{{formatLocalized(groupedRecord.date,'L')}}</div>
			            <HistoryRecordItem
				            class="my-2 my-md-3 w-100"
				            :record="record"
				            v-for="record in groupedRecord.historyList?.slice(0, groupedRecord.historyList.length / 2 + 1)"
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
    import HistoryPanelFilter from '../../components/HistoryPanelFilter.vue';
    import HistoryRecordItem from '../../components/HistoryRecordItem.vue';
    import {History, HistoryGroupedByDate} from '@/classes/History';
    import {useMoment} from '@/compositions/MomentHelper';
    const groupedRecords = ref([] as HistoryGroupedByDate[]);
    const {formatLocalized} = useMoment();

    function handleFilterApplied(_records: HistoryGroupedByDate[]) {
	    groupedRecords.value = _records;
    }
</script>
