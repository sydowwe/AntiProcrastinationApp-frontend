//TODO fix
<template>
    <VRow align="center" justify="center" noGutters>
        <VCol cols="2" v-for="(value, key) in timeObject" :key="key">
            <VCard class="time-card">
                <VCardText class="text-center">
                    <span class="time-value">{{ formatTime(value as number) }}</span>
                    <span class="time-label">{{ timeLabels[key as keyof typeof timeLabels] }}</span>
                </VCardText>
            </VCard>
        </VCol>
    </VRow>
</template>

<script setup lang="ts">
    import { TimeObject } from '../classes/TimeUtils';
    defineProps({
        timeObject: {
            type: TimeObject,
            required: true,
        },
    });
    const timeLabels = {
        hours: 'H',
        minutes: 'M',
        seconds: 'S',
    };
    function formatTime(time: number) {
        if (isNaN(time) || time < 0) {
            return '00';
        }
        return Math.floor(time).toString().padStart(2, '0');
    }
</script>

<style scoped>
    .time-card {
        background-color: #4f0183;
        color: white;
        border-radius: 8px;
        margin: 8px;
    }
    .time-value {
        font-size: 36px;
        font-weight: bold;
    }
    .time-label {
        font-size: 20px;
    }
</style>
