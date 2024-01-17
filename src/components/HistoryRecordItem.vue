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
<script lang="ts">
    import { defineComponent } from 'vue';
    import { HistoryRecord } from '../classes/HistoryRecord';
    import { getTimeNiceFromTimeObject, getTimeObjectFromSeconds } from '../classes/TimeUtils';

    export default defineComponent({
        props: {
            record: {
                type: HistoryRecord,
                required: true,
            },
        },
        created() {
            console.log(typeof this.record.activity);
        },
        data() {
            return {
                lastDate: null as Date | null,
            };
        },
        computed: {
            formattedStartTimestamp() {
                return new Date(this.record?.startTimestamp).toLocaleTimeString();
            },
            formattedLength() {
                return getTimeNiceFromTimeObject(getTimeObjectFromSeconds(this.record?.length));
            },
            formattedEndTimestamp() {
                return this.getEndOfActivityTime(this.record?.startTimestamp, this.record?.length);
            },
        },
        methods: {
            getEndOfActivityTime(startTimestamp: Date, length: number) {
                const endInMillis =  new Date(startTimestamp).getTime() + length * 1000;
                return new Date(endInMillis).toLocaleTimeString();
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
../classes/HistoryRecord
