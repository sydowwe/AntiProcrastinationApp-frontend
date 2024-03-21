<template>
    <VRow justify="center" noGutters>
        <VCol cols="10" sm="8" md="10" lg="8" class="pt-0 pt-md-2">
            <HistoryPanelFilter @filterApplied="handleFilterApplied"></HistoryPanelFilter>
        </VCol>
        <VCol cols="12" class="pt-md-0 px-sm-6 px-md-8 px-lg-10">
            <VRow justify="center">
                <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column align-center align-lg-end">
                    <HistoryRecordItem
                        class="my-2 my-md-3 w-100"
                        :record="record"
                        v-for="record in records?.slice(0, records.length / 2 + 1)"
                        :key="record.id"
                    ></HistoryRecordItem>
                </VCol>
                <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column align-center align-lg-end">
                    <HistoryRecordItem
                        class="my-2 my-md-3 w-100"
                        :record="record"
                        v-for="record in records?.slice(records.length / 2 + 1)"
                        :key="record.id"
                    ></HistoryRecordItem>
                </VCol>
            </VRow>
        </VCol>
    </VRow>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import HistoryPanelFilter from '../components/HistoryPanelFilter.vue';
    import HistoryRecordItem from '../components/HistoryRecordItem.vue';
    import { History } from '@/classes/History';
    const records = ref([] as History[]);

    function handleFilterApplied(_records: History[]) {
        records.value = _records;
    }
</script>
