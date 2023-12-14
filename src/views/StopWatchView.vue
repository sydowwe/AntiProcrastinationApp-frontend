<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <TimeDisplay :timeObject="time"></TimeDisplay>
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
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    import TimeDisplay from '../components/TimeDisplay.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    import { TimeObject} from '../classes/TimeUtils';
    import { DialogType, ActivitySelectionFormType } from '../classes/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
    export default defineComponent({
        setup() {
            const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
            const saveDialog = ref<DialogType>({} as DialogType);
            return { activitySelectionForm, saveDialog };
        },
        components: {
            ActivitySelectionForm,
            TimerTypeSelect,
            TimeDisplay,
            SaveActivityDialog,
        },
        data() {
            return {
                time: new TimeObject(),
                paused: false,
                intervalId: undefined as number | undefined,
                startTimestamp: 0,
                formDisabled: false,
            };
        },
        methods: {
            start() {
                if (this.activitySelectionForm.validate()) {
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
                this.intervalId = undefined;
                this.formDisabled = false;
            },
            showSaveDialog(timeSpentNice:string) {                
                let activityName = this.activitySelectionForm.selectedActivityName;
                console.log(activityName);
                
                if(activityName!==undefined){
                    this.saveDialog.open(activityName, timeSpentNice);
                }
            },
            saveActivity() {
                this.activitySelectionForm.addActivityToHistory(this.time, this.startTimestamp);
            },
        },
    });
</script>
../classes/TimeUtils