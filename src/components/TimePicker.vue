<template>
    <div>
        <v-row class="my-0" align="center" justify="center">
            <v-col cols="4">
                <VTextField label="Hours" v-model="time.hours" type="number" min="0" max="24" :clearable="false" hide-details></VTextField>
            </v-col>
            <v-col cols="4">
                <VTextField label="Minutes" v-model="time.minutes" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
            </v-col>
            <v-col cols="4">
                <VTextField label="Seconds" v-model="time.seconds" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
            </v-col>
        </v-row>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                time: {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
            };
        },
        watch: {
            time: {
                handler(newTime) {
                    const formattedTime = {
                        hours: parseInt(newTime.hours),
                        minutes: parseInt(newTime.minutes),
                        seconds: parseInt(newTime.seconds),
                    };
                    this.$emit('timeChange', formattedTime);
                },
                deep: true,
            },
        },
        emits: ['timeChange']
    };
</script>
