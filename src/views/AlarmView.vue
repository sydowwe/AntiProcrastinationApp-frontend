<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <VRow v-if="timeInputVisible" justify="center">
                    <VCol cols="12" lg="6" md="8" sm="10">
                        <DateTimePicker ref="timePicker" @timeChange="updateTimeInitial"></DateTimePicker>
                    </VCol>
                </VRow>
                <v-row justify="center" class="mt-4 mb-7">
                    <v-btn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== null && !paused">Start</v-btn>
                    <v-btn size="large" class="mr-4" color="primary" @click="pause" :disabled="intervalId === null || paused">Pause</v-btn>
                    <v-btn size="large" color="error" @click="stop" :disabled="intervalId === null">Stop</v-btn>
                </v-row>
                <hr />
                <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
                <!-- <TimerTypeSelect current-type="stopwatch"></TimerTypeSelect> -->

                <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
    import SaveActivityDialog from '../components/./dialogs/SaveActivityDialog.vue';

    export default {
        components: {
            ActivitySelectionForm,
            SaveActivityDialog,
            TimerTypeSelect,
            DateTimePicker,
        },
        data() {
            return {
                time: {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
                timeInitial: {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
                timeInputVisible: true,
                timeRemaining: 0,
                paused: false,
                intervalId: null,
                startTimestamp: 0,
                formDisabled: false,
            };
        },
        created() {
            this.intervalId = null;
        },
        methods: {
            getTimeObjectFromSeconds(timeInSeconds) {
                return {
                    hours: parseInt(timeInSeconds / 3600),
                    minutes: parseInt((timeInSeconds % 3600) / 60),
                    seconds: parseInt(timeInSeconds % 60),
                };
            },
            getSecondsFromTimeObject(timeObject) {
                const timeInSeconds = timeObject.hours * 3600 + timeObject.minutes * 60 + timeObject.seconds;
                return timeInSeconds;
            },
            start() {
                if (this.$refs.activitySelectionForm.isValid()) {
                        this.formDisabled = true;
                        this.startTimestamp = Date.now();
                        this.timeInputVisible = false;
                        this.timeRemaining = this.getSecondsFromTimeObject(this.timeInitial);

                        this.resume();
                    } else {
                        alert('select activity please');
                    }


                const currentTime = new Date();
                const currentHours = currentTime.getHours();
                const currentMinutes = currentTime.getMinutes();
                const currentSeconds = currentTime.getSeconds();

                const alarmHours = this.alarmTime.hours;
                const alarmMinutes = this.alarmTime.minutes;
                const alarmSeconds = this.alarmTime.seconds;

                const hoursDiff = alarmHours - currentHours;
                const minutesDiff = alarmMinutes - currentMinutes;
                const secondsDiff = alarmSeconds - currentSeconds;

                const totalMilliseconds = hoursDiff * 60 * 60 * 1000 + minutesDiff * 60 * 1000 + secondsDiff * 1000;

                if (totalMilliseconds > 0) {
                    setTimeout(() => {
                        this.triggerAlarm();
                    }, totalMilliseconds);
                } else {
                    console.log('Invalid alarm time. Please set a future time.');
                }
            },

            triggerAlarm() {
                console.log('Alarm! Time to wake up!');
                // You can add more logic here, such as playing a sound.
            },            
            pause() {
                clearInterval(this.intervalId);
                this.paused = true;
            },
            resume() {
                this.paused = false;
                this.time = this.getTimeObjectFromSeconds(this.timeRemaining);
                this.intervalId = setInterval(() => {
                    if (this.timeRemaining == 0) {
                        this.stop(true);
                    } else {
                        this.timeRemaining--;
                        this.time = this.getTimeObjectFromSeconds(this.timeRemaining);
                    }
                }, 1000);
            },
            stop() {
                clearInterval(this.intervalId);
                const timeSpentNice = this.timeRemaining == 0 ? this.getTimeNice(this.timeInitial) : this.getTimeNice(this.getTimeObjectFromSeconds(this.getElapsedTimeInSeconds()));

                this.showSaveDialog(timeSpentNice);
            },
            resetTime() {
                this.time = {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                };
                this.paused = false;
                this.intervalId = null;
                this.formDisabled = false;
                this.timeInputVisible = true;
                this.timeRemaining = 0;
                this.startTimestamp = 0;
            },
            showSaveDialog(timeSpentNice) {
                let activityName = this.$refs.activitySelectionForm.selectedActivityName;
                this.$refs.saveDialog.openDialog(activityName, timeSpentNice);
            },
            saveActivity() {
                const timeInSeconds = this.timeRemaining == 0 ? this.timeInitial : this.getElapsedTimeInSeconds();
                this.$refs.activitySelectionForm.addActivityToHistory(this.getTimeObjectFromSeconds(timeInSeconds), this.startTimestamp);
            },
            updateTimeInitial(timeInitial) {
                this.timeInitial = timeInitial;
            },
            getElapsedTimeInSeconds() {
                return this.getSecondsFromTimeObject(this.timeInitial) - this.getSecondsFromTimeObject(this.time);
            },
            getTimeNice(timeObject) {
                return `${timeObject.hours != 0 ? timeObject.hours + 'h' : ''} ${timeObject.minutes != 0 ? timeObject.minutes + 'm' : ''} ${timeObject.seconds}s`;
            },
        },
    };
</script>
