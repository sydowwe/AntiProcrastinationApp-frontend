<template>
    <VRow justify="center">
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <VRow v-if="timeInputVisible" justify="center">
                <VCol cols="12" lg="6" md="8" sm="10">
                    <DateTimePicker ref="timePicker" @timeChange="updateTimeInitial"></DateTimePicker>
                </VCol>
            </VRow>
            <VRow justify="center" class="mt-4 mb-7">
                <VBtn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== null && !paused">Start</VBtn>
                <VBtn size="large" class="mr-4" color="primary" @click="pause" :disabled="intervalId === null || paused">Pause</VBtn>
                <VBtn size="large" color="error" @click="stop" :disabled="intervalId === null">Stop</VBtn>
            </VRow>
            <hr />
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
    import SaveActivityDialog from '../components/./dialogs/SaveActivityDialog.vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { getTimeNiceFromTimeObject, getSecondsFromTimeObject, getTimeObjectFromSeconds } from '../compositions/DateTimeFunctions';
    import { ActivityDialogType, ActivitySelectionFormType } from '../classes/types/RefTypeInterfaces';
    import { ref } from 'vue';

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);

    const alarmTime = ref(new TimeObject());
    const timeInitial = ref(new TimeObject());
    const timeRemaining = ref(0);
    const paused = ref(false);
    const startTimestamp = ref(0);
    const intervalId = ref(undefined as number | undefined);
    const timeInputVisible = ref(true);
    const formDisabled = ref(false);

    async function start() {
        if (await activitySelectionForm.value.validate()) {
            formDisabled.value = true;
            startTimestamp.value = Date.now();
            timeInputVisible.value = false;
            timeRemaining.value = getSecondsFromTimeObject(timeInitial.value);
            resume();
        } else {
            alert('select activity please');
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
        alarmTime.value = getTimeObjectFromSeconds(timeRemaining.value);
        intervalId.value = setInterval(() => {
            if (timeRemaining.value == 0) {
                stop();
            } else {
                timeRemaining.value--;
                alarmTime.value = getTimeObjectFromSeconds(timeRemaining.value);
            }
        }, 1000);
    }
    function stop() {
        clearInterval(intervalId.value);
        const timeSpentNice =
            timeRemaining.value == 0 ? getTimeNiceFromTimeObject(timeInitial.value) : getTimeNiceFromTimeObject(getTimeObjectFromSeconds(getElapsedTimeInSeconds()));
        showSaveDialog(timeSpentNice);
    }
    function resetTime() {
        alarmTime.value = new TimeObject();
        paused.value = false;
        intervalId.value = undefined;
        formDisabled.value = false;
        timeInputVisible.value = true;
        timeRemaining.value = 0;
        startTimestamp.value = 0;
    }
    function showSaveDialog(timeSpentNice: string) {
        let activityName = activitySelectionForm.value.selectedActivityName;
        saveDialog.value.open(activityName, timeSpentNice);
    }
    function saveActivity() {
        const timeInSeconds = timeRemaining.value == 0 ? getSecondsFromTimeObject(timeInitial.value) : getElapsedTimeInSeconds();
        activitySelectionForm.value.addActivityToHistory(getTimeObjectFromSeconds(timeInSeconds), startTimestamp.value);
    }
    function updateTimeInitial(_timeInitial: TimeObject) {
        timeInitial.value = _timeInitial;
    }
    function getElapsedTimeInSeconds() {
        return getSecondsFromTimeObject(timeInitial.value) - getSecondsFromTimeObject(alarmTime.value);
    }
</script>
