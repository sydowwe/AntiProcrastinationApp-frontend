<template>
    <div class="d-flex">
        <div class="flex-0-1 d-flex flex-column justify-space-between">
            <div class="d-flex align-center w-100">
                <VSheet class="startTime pa-1 w-100" rounded="lg" :elevation="15" color="green-darken-4">{{ formattedStartTimestamp }}</VSheet>
                <hr class="line" />
            </div>
            <div class="d-flex justify-end w-100">
                <VSheet class="length pa-1" rounded :elevation="15" color="teal-accent-4">{{ formattedLength }}</VSheet>
            </div>
            <div class="d-flex align-center w-100">
                <VSheet class="endTime pa-1 w-100" color="indigo-darken-3" rounded="lg" :elevation="15">{{ formattedEndTimestamp }}</VSheet>
                <hr class="line" />
            </div>
        </div>
        <VCard class="elevation-2 flex-1-0">
            <VCardTitle>{{ record.activity.name }}</VCardTitle>
            <VCardSubtitle>{{ record.activity.role?.name }}</VCardSubtitle>
            <VCardText>
                <div>{{ $t('activities.category') }}: {{ record.activity.category?.name }}</div>
            </VCardText>
        </VCard>
    </div>
</template>
<script setup lang="ts">
    import { computed } from 'vue';
    import { HistoryRecord } from '../classes/HistoryRecord';
    import { getTimeNiceFromTimeObject, getTimeObjectFromSeconds } from '../compositions/DateTimeFunctions';


    const props = defineProps({
        record: {
            type: HistoryRecord,
            required: true,
        },
    });

    const formattedStartTimestamp = computed(() => new Date(props.record.startTimestamp).toLocaleTimeString());
    const formattedLength = computed(() => getTimeNiceFromTimeObject(getTimeObjectFromSeconds(props.record.length)));
    const formattedEndTimestamp = computed(() => getEndOfActivityTime(props.record.startTimestamp, props.record.length));

    function getEndOfActivityTime(startTimestamp: Date, length: number) {
        const endInMillis = new Date(startTimestamp).getTime() + length * 1000;
        return new Date(endInMillis).toLocaleTimeString();
    }
</script>
<style scoped>
    .line {
        border-width: 2px;
        min-width: 1rem !important;
    }
</style>