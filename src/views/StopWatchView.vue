<template>
    <VRow justify="center">
        <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <TimeDisplay :timeObject="time"></TimeDisplay>
            <VRow justify="center" class="mt-4 mb-7">
                <VBtn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== undefined && !paused">Start</VBtn>
                <VBtn size="large" class="mr-4" color="primary" @click="pause" :disabled="intervalId === undefined || paused">Pause</VBtn>
                <VBtn size="large" color="error" @click="stop" :disabled="intervalId === undefined">Stop</VBtn>
            </VRow>
            <hr />
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <!-- <TimerTypeSelect current-type="stopwatch"></TimerTypeSelect> -->
            <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
        </v-col>
    </VRow>
</template>
<script setup lang="ts">
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    import TimeDisplay from '../components/TimeDisplay.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { ActivityDialogType, ActivitySelectionFormType } from '../classes/types/RefTypeInterfaces';
    import { ref } from 'vue';

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);

    const time = ref(new TimeObject());
    const paused = ref(false);
    const intervalId = ref(undefined as number | undefined);
    const startTimestamp = ref(0);
    const formDisabled = ref(false);

    function start() {
        if (activitySelectionForm.value.validate()) {
            formDisabled.value = true;
            paused.value = false;
            startTimestamp.value = Date.now();
            intervalId.value = setInterval(() => {
                if (time.value.seconds < 59) {
                    time.value.seconds++;
                } else if (time.value.minutes < 59) {
                    time.value.seconds = 0;
                    time.value.minutes++;
                } else {
                    time.value.seconds = 0;
                    time.value.minutes = 0;
                    time.value.hours++;
                }
            }, 1000);
        } else {
            alert('select activity please');
        }
    }
    function pause() {
        clearInterval(intervalId.value);
        paused.value = true;
        formDisabled.value = false;
    }
    function stop() {
        clearInterval(intervalId.value);
        showSaveDialog(`${time.value.hours != 0 ? time.value.hours + 'h' : ''} ${time.value.minutes != 0 ? time.value.minutes + 'm' : ''} ${time.value.seconds}s`);
    }
    function resetTime() {
        time.value = new TimeObject();
        paused.value = false;
        intervalId.value = undefined;
        formDisabled.value = false;
    }
    function showSaveDialog(timeSpentNice: string) {
        let activityName = activitySelectionForm.value.selectedActivityName;
        if (activityName !== undefined) {
            saveDialog.value.open(activityName, timeSpentNice);
        }
    }
    function saveActivity() {
        activitySelectionForm.value.addActivityToHistory(time.value, startTimestamp.value);
    }
</script>
