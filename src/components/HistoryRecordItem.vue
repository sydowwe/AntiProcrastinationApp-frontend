<template lang="">
    <div class="d-flex">
        <div class="flex-0-1 d-flex flex-column justify-space-between">
            <div class="d-flex align-center w-100">
                <VSheet class="startTime pa-1 w-100" rounded="lg" :elevation="15" color="green-darken-4">{{ formattedStartTimestamp(record) }}</VSheet>
                <hr class="line" />
            </div>
            <div class="d-flex justify-end w-100">
                <VSheet class="length pa-1" rounded :elevation="15" color="teal-accent-4">{{ formattedLength(record) }}</VSheet>
            </div>
            <div class="d-flex align-center w-100">
                <VSheet class="endTime pa-1 w-100" color="indigo-darken-3" rounded="lg" :elevation="15">{{ formattedEndTimestamp(record) }}</VSheet>
                <hr class="line" />
            </div>
        </div>
        <v-card class="elevation-2 flex-1-0">
            <v-card-title >{{ record.activity.name }}</v-card-title>
            <v-card-subtitle>{{ record.activity.role.name }}</v-card-subtitle>
            <v-card-text>
                <div>Category: {{ record.activity.category.name }}</div>
            </v-card-text>
        </v-card>
    </div>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { ActivityRecord } from '../classes/ActivityRecord';
    import { getTimeNiceFromTimeObject, getTimeObjectFromSeconds } from '../classes/TimeUtils';

    export default defineComponent({
        props: {
            record: {
                type: ActivityRecord,
                required: true,
            },
        },
        created(){
            console.log(typeof this.record.activity);
            
        },
        data() {
            return {
                lastDate: null as Date | null,
            };
        },
        computed: {
            formattedStartTimestamp() {
                return (record: ActivityRecord) => this.getNiceTimestamp(record.startTimestamp);
            },
            formattedLength() {
                return (record: ActivityRecord) => getTimeNiceFromTimeObject(getTimeObjectFromSeconds(record.length));
            },
            formattedEndTimestamp() {
                return (record: ActivityRecord) => this.getNiceTimestamp(this.getEndOfActivityTime(record.startTimestamp, record.length));
            },
        },
        methods: {
            getEndOfActivityTime(startTimestamp: Date, length: number) {
                const endInMillis = new Date(startTimestamp).getTime() + length * 1000;
                return new Date(endInMillis);
            },
            getNiceTimestamp(timestamp: Date) {
                const dateTime = new Date(timestamp);
                if (timestamp !== this.lastDate) {
                    this.lastDate = timestamp;
                    return dateTime.toLocaleString();
                } else {
                    return dateTime.toLocaleTimeString();
                }
            },
        },
    });
</script>
<style scoped>
.line {
    border-width: 2px;
    min-width: 1rem !important;
}
</style>