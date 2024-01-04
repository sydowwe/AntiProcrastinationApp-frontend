<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <VRow v-if="timeInputVisible" justify="center">
                    <VCol cols="12" lg="6" md="8" sm="10">
                        <TimePicker ref="timePicker" @timeChange="updateTimeInitial"></TimePicker>
                    </VCol>
                </VRow>
                <TimeDisplay v-else :timeObject="time"></TimeDisplay>
                <v-row justify="center" class="mt-4 mb-7">
                    <v-btn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== undefined && !paused">Start</v-btn>
                    <v-btn size="large" class="mr-4" color="primary" @click="pause" :disabled="intervalId === undefined || paused">Pause</v-btn>
                    <v-btn size="large" color="error" @click="stop" :disabled="intervalId === undefined">Stop</v-btn>
                </v-row>
                <hr />
                <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
                <!-- <TimerTypeSelect current-type="stopwatch"></TimerTypeSelect> -->

                <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
            </v-col>
        </v-row>
    </v-container>
</template>
<script lang="ts">
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import TimePicker from '../components/TimePicker.vue';
    import SaveActivityDialog from '../components/./dialogs/SaveActivityDialog.vue';
    import TimeDisplay from '../components/TimeDisplay.vue';
    import { showNotification, checkNotificationPermission } from '../scripts/notifications';
    import { TimeObject, getTimeObjectFromSeconds, getSecondsFromTimeObject, getTimeNiceFromTimeObject } from '../classes/TimeUtils';
    import { ActivityDialogType, ActivitySelectionFormType } from '../classes/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
    export default defineComponent({
        setup() {
            const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
            const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);
            return { activitySelectionForm, saveDialog };
        },
        components: {
            ActivitySelectionForm,
            SaveActivityDialog,
            TimerTypeSelect,
            TimePicker,
            TimeDisplay,
        },
        data() {
            return {
                time: new TimeObject(),
                timeInitial: new TimeObject(),
                timeInputVisible: true,
                timeRemaining: 0,
                paused: false,
                intervalId: undefined as number | undefined,
                startTimestamp: 0,
                formDisabled: false,
            };
        },
        created() {
            checkNotificationPermission();
        },
        methods: {
            start() {
                if (this.paused) {
                    this.resume();
                } else {
                    if (this.activitySelectionForm.validate()) {
                        this.formDisabled = true;
                        this.startTimestamp = Date.now();
                        this.timeInputVisible = false;
                        this.timeRemaining = getSecondsFromTimeObject(this.timeInitial);
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
                this.time = getTimeObjectFromSeconds(this.timeRemaining);
                this.intervalId = setInterval(() => {
                    if (this.timeRemaining == 0) {
                        this.stop();
                    } else {
                        this.timeRemaining--;
                        this.time = getTimeObjectFromSeconds(this.timeRemaining);
                    }
                }, 1000);
            },
            stop() {
                clearInterval(this.intervalId);
                const timeSpentNice = this.timeRemaining == 0 ? getTimeNiceFromTimeObject(this.timeInitial) : getTimeNiceFromTimeObject(getTimeObjectFromSeconds(this.getElapsedTimeInSeconds()));

                let activityName = this.activitySelectionForm.selectedActivityName;
                showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timeSpentNice}`);
                this.saveDialog.open(activityName, timeSpentNice);
            },
            resetTime() {
                this.time = {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                };
                this.paused = false;
                this.intervalId = undefined;
                this.formDisabled = false;
                this.timeInputVisible = true;
                this.timeRemaining = 0;
                this.startTimestamp = 0;
            },
            saveActivity() {
                const timeInSeconds = this.timeRemaining == 0 ? getSecondsFromTimeObject(this.timeInitial) : this.getElapsedTimeInSeconds();
                this.activitySelectionForm.addActivityToHistory(getTimeObjectFromSeconds(timeInSeconds), this.startTimestamp);
            },
            updateTimeInitial(timeInitial: TimeObject) {
                this.timeInitial = timeInitial;
            },
            getElapsedTimeInSeconds() {
                return getSecondsFromTimeObject(this.timeInitial) - getSecondsFromTimeObject(this.time);
            },
        },
    });
</script>
