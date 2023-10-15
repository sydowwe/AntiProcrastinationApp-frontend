<template lang="">
    <div class="d-flex">
        <div class="d-flex flex-column align-end justify-space-between">
            <div class="d-flex align-center w-100">
                <VSheet class="startTime pa-1" rounded="lg" :elevation="15" color="green-darken-4">{{ formattedStartTimestamp(record) }}</VSheet>
                <hr class="line" />
            </div>
            <div class="d-flex justify-end w-100">
                <VSheet class="length pa-1" rounded :elevation="15" color="teal-accent-4">{{ formattedLength(record) }}</VSheet>
            </div>
            <div class="d-flex align-center w-100">
                <VSheet class="endTime pa-1" color="indigo-darken-3" rounded="lg" :elevation="15">{{ formattedEndTimestamp(record) }}</VSheet>
                <hr class="line" />
            </div>
        </div>
        <v-card class="elevation-2">
            <v-card-title class="headline">{{ record.activity.name }}</v-card-title>
            <v-card-subtitle>{{ record.activity.role.name }}</v-card-subtitle>
            <v-card-text>
                <div>Category: {{ record.activity.category.name }}</div>
            </v-card-text>
        </v-card>
    </div>
</template>
<script>
    export default {
        props: {
            record: {
                type: Object,
                required: true,
            },
        },
        data() {
            return {
                lastDate: null,
            };
        },
        computed: {
            formattedStartTimestamp() {
                return (record) => this.getNiceTimestamp(record.startTimestamp);
            },
            formattedLength() {
                return (record) => this.getNiceTime(record.length);
            },
            formattedEndTimestamp() {
                return (record) => this.getNiceTimestamp(this.getEndOfActivityTime(record.startTimestamp, record.length));
            },
        },
        created() {
        },
        methods: {
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
                return new Date(endInMillis);
            },
            getNiceTimestamp(timestamp) {
                const newDate = new Date(timestamp);
                const currentDate = newDate.toLocaleDateString();
                const currentTime = newDate.toLocaleTimeString();
                if (currentDate !== this.lastDate) {
                    this.lastDate = currentDate;
                    return newDate.toLocaleString();
                } else {
                    return currentTime;
                }
            },
        },
    };
</script>
<style lang=""></style>
