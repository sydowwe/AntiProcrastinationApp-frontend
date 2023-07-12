<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <v-row justify="center">
                    <v-col cols="4" class="timeTile text-center">
                        <span class="timeDisplay">{{ hours }}</span>
                        <span class="descSpan">h</span>
                    </v-col>
                    <v-col cols="4" class="timeTile text-center">
                        <span class="timeDisplay">{{ minutes }}</span>
                        <span class="descSpan">m</span>
                    </v-col>
                    <v-col cols="4" class="timeTile text-center">
                        <span class="timeDisplay">{{ seconds }}</span>
                        <span class="descSpan">s</span>
                    </v-col>
                </v-row>
                <v-row justify="center" class="my-4">
                    <v-btn class="btn btn-primary text-light mr-4" @click="start" :disabled="intervalId !== null && !paused">Start</v-btn>
                    <v-btn class="btn btn-primary text-light mr-4" @click="pause" :disabled="intervalId === null || paused">Pause</v-btn>
                    <v-btn class="btn btn-primary text-light" @click="stop" :disabled="intervalId === null">Stop</v-btn>
                </v-row>
                <hr />
                <activity-selection-form :activity-length="activityLength"></activity-selection-form>
                <hr />
                <TimerTypeSelect></TimerTypeSelect>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    export default {
        components: {
            ActivitySelectionForm, TimerTypeSelect 
        },
        data() {
            return {
                hours: 0,
                seconds: 0,
                minutes: 0,
                paused: false,
                intervalId: null,
                activityLength: 0,
            };
        },
        created() {
            this.intervalId = null;

            addEventListener('stopwatchTick', (e) => {
                this.seconds = e.detail.seconds;
                this.minutes = e.detail.minutes;
                this.hours = e.detail.hours;
            });
            addEventListener('stopwatchStopped', (e) => {
                this.showSaveModal(`Hodiny: ${e.detail.hoursPassed} minúty: ${e.detail.minutesPassed} seconds: ${e.detail.secondsPassed}`);
            });

            // let url = ``;
            // axios.get(url).then((response) => {
            //   // Handle the response data
            // }).catch((error) => {
            //   // Handle the error
            // });
        },
        methods: {
            start() {
                this.paused = false;
                this.intervalId = setInterval(() => {
                    if (this.seconds < 59) {
                        this.seconds++;
                    } else if (this.minutes < 59) {
                        this.seconds = 0;
                        this.minutes++;
                    } else {
                        this.seconds = 0;
                        this.minutes = 0;
                        this.hours++;
                    }
                    const tickEvent = new CustomEvent('stopwatchTick', {
                        detail: {
                            hours: this.hours,
                            minutes: this.minutes,
                            seconds: this.seconds,
                        },
                    });
                    this.$emit('stopwatchTick', tickEvent.detail);
                }, 1000);
            },
            pause() {
                clearInterval(this.intervalId);
                this.paused = true;
            },
            stop() {
                const stopwatchStoppedEvent = new CustomEvent('stopwatchStopped', {
                    detail: {
                        hoursPassed: this.hours,
                        minutesPassed: this.minutes,
                        secondsPassed: this.seconds,
                    },
                });
                this.$emit('stopwatchStopped', stopwatchStoppedEvent.detail);
                clearInterval(this.intervalId);
                this.hours = this.minutes = this.seconds = 0;
                this.intervalId = null;
                this.paused = false;
            },
            showSaveModal(text) {
                // Implement your modal logic here
            },
        },
    };
</script>
