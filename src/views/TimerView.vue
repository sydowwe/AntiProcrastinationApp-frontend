<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <VRow v-if="timeInputVisible" justify="center">
                    <VCol cols="12" lg="6" md="8" sm="10">
                        <TimePicker ref="timePicker" @timeChange="updateTimeInitial"></TimePicker>
                    </VCol>
                </VRow>
                <TimeDisplay v-else :hours="time.hours" :minutes="time.minutes" :seconds="time.seconds"></TimeDisplay>
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
    import TimePicker from '../components/TimePicker.vue';
    import SaveActivityDialog from '../components/./dialogs/SaveActivityDialog.vue';
    import TimeDisplay from '../components/TimeDisplay.vue';
    import {showNotification,checkNotificationPermission} from '../scripts/notifications';

    export default {
        components: {
            ActivitySelectionForm,
            SaveActivityDialog,
            TimerTypeSelect,
            TimePicker,
            TimeDisplay,
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
            checkNotificationPermission();
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
                if (this.paused) {
                    this.resume();
                } else {
                    if (this.$refs.activitySelectionForm.isValid()) {
                        this.formDisabled = true;
                        this.startTimestamp = Date.now();
                        this.timeInputVisible = false;
                        this.timeRemaining = this.getSecondsFromTimeObject(this.timeInitial);
                        this.resume();
                    } else {
                        alert('select activity please');
                    }
                }
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
                        this.stop();
                    } else {
                        this.timeRemaining--;
                        this.time = this.getTimeObjectFromSeconds(this.timeRemaining);
                    }
                }, 1000);
            },
            stop() {
                clearInterval(this.intervalId);
                const timeSpentNice = this.timeRemaining == 0 ? this.getTimeNice(this.timeInitial) 
                : this.getTimeNice(this.getTimeObjectFromSeconds(this.getElapsedTimeInSeconds()));

                let activityName = this.$refs.activitySelectionForm.selectedActivityName;
                showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timeSpentNice}`);
                this.showSaveDialog(timeSpentNice, activityName);
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
            showSaveDialog(timeSpentNice, activityName) {                
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
                return `${timeObject.hours != 0 ? timeObject.hours + 'h' : ''}${timeObject.minutes != 0 ? timeObject.minutes + 'm' : ''}${timeObject.seconds}s`;
            },
        },
    };
</script>
