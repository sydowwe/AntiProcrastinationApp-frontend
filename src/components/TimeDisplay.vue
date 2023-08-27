<template>
    <v-container>
        <v-row align="center" justify="center">
            <v-col cols="2" v-for="(value, key) in computedTimeValues" :key="key">
                <v-card class="time-card">
                    <v-card-text class="text-center">
                        <span class="time-value">{{ formatTime(value) }}</span>
                        <span class="time-label">{{ timeLabels[key] }}</span>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        props: {
            hours: {
                type: Number,
                default: 0,
            },
            minutes: {
                type: Number,
                default: 0,
            },
            seconds: {
                type: Number,
                default: 0,
            },
        },
        data() {
            return {
                timeLabels: {
                    hours: 'H',
                    minutes: 'M',
                    seconds: 'S',
                },
            };
        },
        computed: {
            computedTimeValues() {
                return {
                    hours: this.hours,
                    minutes: this.minutes,
                    seconds: this.seconds,
                };
            },
        },
        methods: {
            formatTime(time) {
                if (typeof time !== 'number' || isNaN(time)) {
                    return '00';
                }
                if (time < 0) {
                    time = 0;
                }
                return Math.floor(time).toString().padStart(2, '0');
            },
        },
    };
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
