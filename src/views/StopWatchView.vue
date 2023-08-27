<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <TimeDisplay :hours="hours" :minutes="minutes" :seconds="seconds"></TimeDisplay>
                <v-row justify="center" class="mt-4 mb-7">
                    <v-btn size="large" class="mr-4" color="green" @click="start" :disabled="intervalId !== null && !paused">Start</v-btn>
                    <v-btn size="large" class="mr-4" color="blue" @click="pause" :disabled="intervalId === null || paused">Pause</v-btn>
                    <v-btn size="large" color="red" @click="stop" :disabled="intervalId === null">Stop</v-btn>
                </v-row>
                <hr />
                <ActivitySelectionForm ref="activitySelectionForm" :activityLength="activityLength"></ActivitySelectionForm>
                <TimerTypeSelect current-type="stopwatch"></TimerTypeSelect>
                <SaveActivityDialog ref="saveDialog" @saved="saveActivity()"></SaveActivityDialog>
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
                hours: 0,
                minutes: 0,
                seconds: 0,
                paused: false,
                intervalId: null,
                activityLength: 0,
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
                }, 1000);
            },
            pause() {
                clearInterval(this.intervalId);
                this.paused = true;
            },
            stop() {
                clearInterval(this.intervalId);
                this.activityLength = this.hours * 3600 + this.minutes * 60 + this.seconds;
                this.showSaveDialog(`${this.hours != 0 ? this.hours + 'h' : ''} ${this.minutes != 0 ? this.minutes + 'm' : ''} ${this.seconds}s`);
                this.hours = this.minutes = this.seconds = 0;
                this.intervalId = null;
                this.paused = false;
            },
            showSaveDialog(timeSpentNice) {
                let activity = this.$refs.activitySelectionForm.selectedActivity;
                this.$refs.saveDialog.openDialog(activity, timeSpentNice);
            },
            saveActivity() {
                this.$refs.activitySelectionForm.addActivityToHistory();
            },
        },
    };
</script>
