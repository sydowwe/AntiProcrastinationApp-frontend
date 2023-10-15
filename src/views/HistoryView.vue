<template>
    <v-row justify="center">
        <v-col cols="12" sm="10" md="10" lg="10">
            <HistoryPanelFilter @filter-applied="handleFilterApplied"></HistoryPanelFilter>
            <div v-for="record in records" :key="record.id" class="my-3">
                <HistoryRecordItem :record="record"></HistoryRecordItem>
            </div>
        </v-col>
    </v-row>
</template>

<script>
    import HistoryPanelFilter from '../components/HistoryPanelFilter.vue';
    import HistoryRecordItem from '../components/HistoryRecordItem.vue';
    export default {
        components: { HistoryPanelFilter, HistoryRecordItem },
        data() {
            return {
                records: [],
                selectedRole: null,
                selectedCategory: null,
                selectedActivity: null,
                isFromToDoList: false,
                dateNice: null,
                hoursBack: 24,
            };
        },
        computed: {},
        created() {
        },
        methods: {
            getAllRecords() {
                let url = `/history/get-last-x-hours-records`;
                let data = { date: this.date , hours: this.hoursBack };
                axios
                    .post(url, data)
                    .then((response) => {
                        this.records = response.data;
                        console.log(this.records);
                    })
                    .catch((error) => {});
            },
            handleFilterApplied(filterData) {
                this.selectedRole = filterData.selectedRole;
                this.selectedCategory = filterData.selectedCategory;
                this.selectedActivity = filterData.selectedActivity;
                this.isFromToDoList = filterData.isFromToDoList;
                this.date = filterData.date;
                this.hoursBack = filterData.hoursBack;
                this.getAllRecords();
            },
        },
    };
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
