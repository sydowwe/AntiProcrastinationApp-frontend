<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <TimeDisplay :hours="time.hours" :minutes="time.minutes" :seconds="time.seconds"></TimeDisplay>
                <v-row justify="center" class="mt-4 mb-7">
                    <v-btn size="large" class="mr-4" color="green" @click="start" :disabled="intervalId !== null && !paused">Start</v-btn>
                    <v-btn size="large" class="mr-4" color="blue" @click="pause" :disabled="intervalId === null || paused">Pause</v-btn>
                    <v-btn size="large" color="red" @click="stop" :disabled="intervalId === null">Stop</v-btn>
                </v-row>
                <hr />
                <ActivitySelectionForm ref="activitySelectionForm" :activity-length="time" :startTimestamp="startTimestamp" :formDisabled="formDisabled"></ActivitySelectionForm>
                <TimerTypeSelect current-type="stopwatch"></TimerTypeSelect>
                <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    import TimeDisplay from '../components/TimeDisplay.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    export default {
        components: {
            ActivitySelectionForm,
            TimerTypeSelect,
            TimeDisplay,
            SaveActivityDialog,
        },
        data() {
            return {
                time: {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
                paused: false,
                intervalId: null,
                startTimestamp: 0,
                formDisabled: false
            };
        },
        created() {
            this.intervalId = null;
            // let url = ``;
            // axios.get(url).then((response) => {
            //   // Handle the response data
            // }).catch((error) => {
            //   // Handle the error
            // });
        },
        methods: {
            start() {
                if (this.$refs.activitySelectionForm.isValid()) {
                    this.formDisabled = true;
                    this.paused = false;
                    this.startTimestamp = Date.now();
                    this.intervalId = setInterval(() => {
                        if (this.time.seconds < 59) {
                            this.time.seconds++;
                        } else if (this.time.minutes < 59) {
                            this.time.seconds = 0;
                            this.time.minutes++;
                        } else {
                            this.time.seconds = 0;
                            this.time.minutes = 0;
                            this.time.hours++;
                        }
                    }, 1000);
                } else {
                    alert('select activity please');
                }
            },
            pause() {
                clearInterval(this.intervalId);
                this.paused = true;
                this.formDisabled = false;
            },
            stop() {
                clearInterval(this.intervalId);
                this.showSaveDialog(`${this.time.hours != 0 ? this.time.hours + 'h' : ''} ${this.time.minutes != 0 ? this.time.minutes + 'm' : ''} ${this.time.seconds}s`);
            },
            resetTime() {
                this.time.hours = this.time.minutes = this.time.seconds = 0;
                this.paused = false;
                this.intervalId = null;
                this.formDisabled = false;
            },
            showSaveDialog(timeSpentNice) {
                let activityName = this.$refs.activitySelectionForm.selectedActivityName;
                this.$refs.saveDialog.openDialog(activityName, timeSpentNice);
            },
            saveActivity() {
                this.$refs.activitySelectionForm.addActivityToHistory();
            },
        },
    };
</script>
