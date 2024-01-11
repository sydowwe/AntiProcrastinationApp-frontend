<template>
    <VRow justify="center" noGutters>
        <VCol cols="10" sm="8" md="10" lg="8" class="pt-0 pt-md-2">
            <HistoryPanelFilter @filterApplied="handleFilterApplied"></HistoryPanelFilter>
        </VCol>
        <VCol cols="12" class="pt-md-0 px-sm-6 px-md-8 px-lg-10">
            <VRow justify="center">
                <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column align-center align-lg-end">
                    <HistoryRecordItem class="my-2 my-md-3 w-100" :record="record" v-for="record in records.slice(0, records.length / 2 + 1)" :key="record.id"></HistoryRecordItem>
                </VCol>
                <VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column align-center align-lg-end">
                    <HistoryRecordItem class="my-2 my-md-3 w-100" :record="record" v-for="record in records.slice(records.length / 2 + 1)" :key="record.id"></HistoryRecordItem>
                </VCol>
            </VRow>
        </VCol>
    </VRow>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import HistoryPanelFilter from '../components/HistoryPanelFilter.vue';
    import HistoryRecordItem from '../components/HistoryRecordItem.vue';
    import { HistoryRecord } from '../classes/HistoryRecord';
    import { HistoryFilter } from '../classes/History';
    export default defineComponent({
        components: { HistoryPanelFilter, HistoryRecordItem },
        data() {
            return {
                records: [] as HistoryRecord[],
                filter: new HistoryFilter(),
            };
        },
        created() {
            this.getAllRecords();
        },
        methods: {
            getAllRecords() {
                let url = `/history/get-all`;
                axios
                    .post(url)
                    .then((response) => {
                        this.records = HistoryRecord.listFromObjects(response.data);
                    })
                    .catch((error) => {});
            },
            handleFilterApplied(records: HistoryRecord[]) {
                this.records = records;
            },
        },
    });
</script>
../classes/HistoryRecord