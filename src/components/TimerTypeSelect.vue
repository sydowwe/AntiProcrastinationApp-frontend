<template>
    <VSelect label="Type of time measurment" v-model="selectedTimerType" :items="items" :clearable="false" @change="redirect()"></VSelect>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    export default defineComponent({
        props: {
            currentType: {
                type: String,
                default: 'timer',
            },
        },
        data() {
            return {
                selectedTimerType: this.currentType,
                items: [
                    { title: 'Timer', value: 'timer' },
                    { title: 'Stopwatch', value: 'stopwatch' },
                    { title: 'Alarm', value: 'alarm' },
                ],
            };
        },
        methods: {
            redirect() {
                console.log('asssssd');
                //this.$router.push('/' + this.selectedTimerType);
            },
        },
    });
</script>
