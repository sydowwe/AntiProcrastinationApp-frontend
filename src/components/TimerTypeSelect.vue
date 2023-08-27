<template>
    <v-select label="Type of time measurment" :items="items" variant="outlined" v-model="selectedTimerType" @change="redirect()"></v-select>
</template>
<script>
    export default {
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
    };
</script>
