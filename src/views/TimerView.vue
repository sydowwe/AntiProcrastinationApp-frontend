<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <v-col cols="8" class="mx-auto">
                    <v-row>
                        <v-col cols="4" class="timeTile">
                            <v-text-field type="number" class="w-50" min="0" max="24" v-model="hours" outlined></v-text-field>
                            <span class="timeDisplay" v-show="!timeInputVisible">{{ hours }}</span>
                            <h2 class="text-center">h</h2>
                        </v-col>
                        <v-col cols="4" class="timeTile">
                            <v-text-field type="number" min="0" max="60" v-model="minutes" outlined></v-text-field>
                            <span class="timeDisplay" v-show="!timeInputVisible">{{ minutes }}</span>
                            <span class="descSpan">m</span>
                        </v-col>
                        <v-col cols="4" class="timeTile">
                            <v-text-field type="number" min="0" max="60" v-model="seconds" outlined></v-text-field>
                            <span class="timeDisplay" v-show="!timeInputVisible">{{ seconds }}</span>
                            <span class="descSpan">s</span>
                        </v-col>
                    </v-row>
                    <v-row justify="center" class="my-4">
                        <v-btn class="btn btn-primary text-light mr-4" @click="start" :disabled="intervalId !== null && !paused">Start</v-btn>
                        <v-btn class="btn btn-primary text-light mr-4" @click="pause" :disabled="intervalId === null || paused">Pause</v-btn>
                        <v-btn class="btn btn-primary text-light" @click="stop" :disabled="intervalId === null">Stop</v-btn>
                    </v-row>
                </v-col>
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
            ActivitySelectionForm,
            TimerTypeSelect,
        },
        data() {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0,
                timeRemaining: 0,
                initialTime: 0,
                paused: false,
                intervalId: null,
                timeInputVisible: true,
            };
        },
        created() {
            this.intervalId = null;

            // addEventListener('stopwatchTick', (e) => {
            //     this.seconds = e.detail.seconds;
            //     this.minutes = e.detail.minutes;
            //     this.hours = e.detail.hours;
            // });
            // addEventListener('stopwatchStopped', (e) => {
            //     this.showSaveModal(`Hodiny: ${e.detail.hoursPassed} minúty: ${e.detail.minutesPassed} seconds: ${e.detail.secondsPassed}`);
            // });

            // let url = ``;
            // axios.get(url).then((response) => {
            //   // Handle the response data
            // }).catch((error) => {
            //   // Handle the error
            // });
        },
        methods: {
            start() {
                const totalSeconds = this.hours * 3600 + this.minutes * 60 + this.seconds;
                if (totalSeconds > 0) {
                    this.timeInputVisible = false;
                    this.isTimerRunning = true;
                    this.isTimeZero = false;
                    this.$refs.timer.start(totalSeconds);
                } else {
                    alert('Zadaj nejaký čas!!');
                }
            },
            pause() {
                this.$refs.timer.pause();
                this.isTimerRunning = false;
            },
            reset() {
                this.$refs.timer.reset();
                this.timeInputVisible = true;
                this.isTimerRunning = false;
                this.isTimeZero = true;
            },
            formatTimeValue(value) {
                return String(value).padStart(2, '0');
            },
            handleTimerEnd(lengthInSeconds) {
                this.$refs.timer.reset();
                this.timeInputVisible = true;
                this.isTimerRunning = false;
                this.isTimeZero = true;
                addNewActivityToHistory(this.$refs.activitySelectionForm.activityId, lengthInSeconds * 1000);
            },
        },
    };
</script>
