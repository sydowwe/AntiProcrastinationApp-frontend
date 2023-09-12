<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="my-5">
                <v-row v-for="(record, id) in records" :key="id" class="my-3">
                    <div class="d-flex flex-column align-end justify-space-between">
                        <div class="d-flex align-start w-100">
                            <VSheet class="startTime pa-1" rounded="lg" :elevation="15" color="green-darken-4">{{ getNiceTimestamp(record.startTimestamp) }}</VSheet>
                            <hr class="line"/>
                        </div>
                        <div class="d-flex justify-center w-100">
                            <VSheet class="length pa-1" rounded :elevation="15" color="teal-accent-4">{{ getNiceTime(record.length) }}</VSheet>
                        </div>
                        <div class="d-flex align-end w-100">
                            <VSheet class="endTime pa-1" color="indigo-darken-3"  border rounded="lg" :elevation="15">{{ getEndOfActivityTime(record.startTimestamp, record.length) }}</VSheet>
                            <hr class="line"/>
                        </div>
                    </div>
                    <v-card class="elevation-2" border="white">
                        <v-card-title class="headline">{{ record.activity.name }}</v-card-title>
                        <v-card-subtitle>{{ record.activity.role.name }}</v-card-subtitle>
                        <v-card-text>
                            <div>Category: {{ record.activity.category.name }}</div>
                        </v-card-text>
                    </v-card>
                </v-row>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        data() {
            return {
                records: [],
            };
        },
        created() {
            this.getAllRecords();
        },
        methods: {
            getAllRecords() {
                let url = `/history/get-last-x-hours-records`;
                let data = { date: new Date().toISOString(), hours: 72 };
                axios
                    .post(url, data)
                    .then((response) => {
                        this.records = response.data;
                        console.log(this.records);
                    })
                    .catch((error) => {});
            },
            getNiceTime(timeInSec) {
                const hours = Math.floor(timeInSec / 3600);
                const minutes = Math.floor((timeInSec % 3600) / 60);
                const seconds = timeInSec % 60;
                const timeParts = [];
                if (hours > 0) timeParts.push(`${hours}h`);
                if (minutes > 0) timeParts.push(`${minutes}m`);
                if (seconds > 0 && hours < 1) timeParts.push(`${seconds}s`);
                return timeParts.join(' ');
            },
            getEndOfActivityTime(startTimestamp, length) {
                const start = new Date(startTimestamp);
                const endInMillis = start.getTime() + length * 1000;
                const endTimestamp = new Date(endInMillis);
                return endTimestamp.toLocaleString();
            },
            getNiceTimestamp(timestamp) {
                return new Date(timestamp).toLocaleString();
            },
        },
    };
</script>

<style scoped>
    /* .startTime,
    .endTime {
    } */
    .length {
        width: initial !important;
    }
    .line{      
        border-width: 2px;
        min-width: 1rem !important;
    }
</style>
