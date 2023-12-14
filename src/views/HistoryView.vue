<template>
    <v-row justify="center">
        <v-col cols="12" sm="10" md="10" lg="10" class="pt-0 pt-md-2">
            <HistoryPanelFilter @filterApplied="handleFilterApplied"></HistoryPanelFilter>
            <div v-for="record in records" :key="record.id" class="my-3">
                <HistoryRecordItem :record="record"></HistoryRecordItem>
            </div>
        </v-col>
    </v-row>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import HistoryPanelFilter from '../components/HistoryPanelFilter.vue';
    import HistoryRecordItem from '../components/HistoryRecordItem.vue';
    import { ActivityRecord } from '../classes/ActivityRecord';
    import { HistoryFilter } from '../classes/History';
    export default defineComponent({
        components: { HistoryPanelFilter, HistoryRecordItem },
        data() {
            return {
                records: [] as ActivityRecord[],
                filter: new HistoryFilter(),
            };
        },
        methods: {
            getAllRecords() {
                let url = `/history/get-last-x-hours-records`;
                let data = { date: this.filter.date, hours: this.filter.hoursBack };
                axios
                    .post(url, data)
                    .then((response) => {
                        this.records = response.data as ActivityRecord[];
                    })
                    .catch((error) => {});
            },
            handleFilterApplied(filterData: HistoryFilter) {
                this.filter = filterData;
                this.getAllRecords();
            },
        },
    });
</script>
<style scoped>
    /* .startTime,
    .endTime {
    } */
    .line {
        border-width: 2px;
        min-width: 1rem !important;
    }
</style>
