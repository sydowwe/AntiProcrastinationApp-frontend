<template>
    <VRow class="my-0" align="center" justify="center">
        <VCol cols="4">
            <VTextField :label="$t('dateTime.hours')" v-model="time.hours" type="number" min="0" max="24" :clearable="false" hide-details></VTextField>
        </VCol>
        <VCol cols="4">
            <VTextField :label="$t('dateTime.minutes')" v-model="time.minutes" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
        </VCol>
        <VCol cols="4">
            <VTextField :label="$t('dateTime.seconds')" v-model="time.seconds" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { TimeObject } from '../classes/TimeUtils';

    const time = ref(new TimeObject());
    defineExpose({time});
</script>
