<template>
    <VRow class="my-0" align="center" justify="center" noGutters>
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
<script lang="ts">
    import { defineComponent } from 'vue';
    import { TimeObject } from '../classes/TimeUtils';
    export default defineComponent({
        data() {
            return {
                time: new TimeObject(),
            };
        },
        watch: {
            time: {
                handler(newTime: TimeObject) {
                    this.$emit('timeChange', newTime);
                },
                deep: true,
            },
        },
        methods: {
            get() {
                return this.time;
            },
        },
        emits: ['timeChange'],
    });
</script>
