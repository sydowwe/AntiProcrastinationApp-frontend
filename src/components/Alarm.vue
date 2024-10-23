<template>
    <VRow justify="center">
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <VRow v-if="timeInputVisible" justify="center">
                <VCol cols="12" lg="6" md="8" sm="10">
                    <DateTimePicker ref="timePicker" :date-clearable="false" @timeChange="updateTimeInitial"></DateTimePicker>
                </VCol>
            </VRow>
            <VRow justify="center" class="mt-4 mb-7">
                <VBtn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== undefined && !paused">Set</VBtn>
                <VBtn size="large" color="error" @click="stop" :disabled="intervalId === undefined">Cancel</VBtn>
            </VRow>
            <hr />
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
    import ActivitySelectionForm from './ActivitySelectionForm.vue';
    import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
    import SaveActivityDialog from './dialogs/SaveActivityDialog.vue';
    import { TimeLengthObject } from '@/classes/TimeUtils';
    import { ActivityDialogType, ActivitySelectionFormType } from '@/classes/types/RefTypeInterfaces';
    import { ref } from 'vue';
    import {addActivityToHistory} from '@/compositions/SaveToHistoryComposition';

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);

    const alarmTime = ref(new TimeLengthObject());
    const timeInitial = ref(new TimeLengthObject());
    const timeRemaining = ref(0);
    const paused = ref(false);
    const startTimestamp = ref(new Date());
    const intervalId = ref(undefined as number | undefined);
    const timeInputVisible = ref(true);
    const formDisabled = ref(false);

    async function start() {
        if (activitySelectionForm.value.validate()) {
            formDisabled.value = true;
            startTimestamp.value = new Date();
            timeInputVisible.value = false;
            timeRemaining.value = timeInitial.value.getInSeconds;
            resume();
        }
        const currentTime = new Date();
        const hoursDiff = alarmTime.value.hours - currentTime.getHours();
        const minutesDiff = alarmTime.value.minutes - currentTime.getMinutes();
        const secondsDiff = alarmTime.value.seconds - currentTime.getSeconds();

        const totalMilliseconds = hoursDiff * 60 * 60 * 1000 + minutesDiff * 60 * 1000 + secondsDiff * 1000;

        if (totalMilliseconds > 0) {
            setTimeout(() => {
                triggerAlarm();
            }, totalMilliseconds);
        } else {
            console.log('Invalid alarm time. Please set a future time.');
        }
    }
    function triggerAlarm() {
        console.log('Alarm! Time to wake up!');
    }
    function pause() {
        clearInterval(intervalId.value);
        paused.value = true;
    }
    function resume() {
        paused.value = false;
        alarmTime.value = TimeLengthObject.fromSeconds(timeRemaining.value);
        intervalId.value = setInterval(() => {
            if (timeRemaining.value == 0) {
                stop();
            } else {
                timeRemaining.value--;
                alarmTime.value = TimeLengthObject.fromSeconds(timeRemaining.value);
            }
        }, 1000);
    }
    function stop() {
        clearInterval(intervalId.value);
	    saveDialog.value.open(activitySelectionForm.value.getSelectedActivityName as string, timePassed().getNice);
    }
    function resetTime() {
        alarmTime.value = new TimeLengthObject();
        paused.value = false;
        intervalId.value = undefined;
        formDisabled.value = false;
        timeInputVisible.value = true;
        timeRemaining.value = 0;
        startTimestamp.value = new Date();
    }
    function saveActivity() {
	    addActivityToHistory(startTimestamp.value, timePassed(),activitySelectionForm.value.getSelectedActivityId);
    }
    function updateTimeInitial(_timeInitial: TimeLengthObject) {
        timeInitial.value = _timeInitial;
    }
    function timePassed(){
	    return timeRemaining.value == 0 ? timeInitial.value : timeInitial.value.subtract(alarmTime.value);
    }
</script>
