<template>
    <VRow justify="center" noGutters>
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <VRow v-if="timeInputVisible" justify="center" noGutters>
                <VCol cols="12" lg="6" md="8" sm="10">
                    <TimePicker ref="timePicker" @timeChange="updateTimeInitial"></TimePicker>
                </VCol>
            </VRow>
            <TimeDisplay v-else :timeObject="time"></TimeDisplay>
            <VRow justify="center" class="mt-4 mb-7" noGutters>
                <VBtn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== undefined && !paused">Start</VBtn>
                <VBtn size="large" class="mr-4" color="primary" @click="pause" :disabled="intervalId === undefined || paused">Pause</VBtn>
                <VBtn size="large" color="error" @click="stop" :disabled="intervalId === undefined">Stop</VBtn>
            </VRow>
            <hr />
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <!-- <TimerTypeSelect current-type="stopwatch"></TimerTypeSelect> -->
            <SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
    import TimerTypeSelect from '../components/TimerTypeSelect.vue';
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import TimePicker from '../components/TimePicker.vue';
    import SaveActivityDialog from '../components/./dialogs/SaveActivityDialog.vue';
    import TimeDisplay from '../components/TimeDisplay.vue';
    import { showNotification, checkNotificationPermission } from '../scripts/notifications';
    import { TimeObject } from '../classes/TimeUtils';
    import { ActivityDialogType, ActivitySelectionFormType } from '../classes/types/RefTypeInterfaces';
    import { getTimeNiceFromTimeObject, getSecondsFromTimeObject, getTimeObjectFromSeconds } from '../compositions/DateTimeFunctions';
    import { ref } from 'vue';

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);

    const timeInitial = ref(new TimeObject());
    const timeInputVisible = ref(true);
    const timeRemaining = ref(0);
    const time = ref(new TimeObject());
    const paused = ref(false);
    const intervalId = ref(undefined as number | undefined);
    const startTimestamp = ref(0);
    const formDisabled = ref(false);

    checkNotificationPermission();

    function start() {
        if (paused) {
            resume();
        } else {
            if (activitySelectionForm.value.validate()) {
                formDisabled.value= true;
                startTimestamp.value= Date.now();
                timeInputVisible.value= false;
                timeRemaining.value= getSecondsFromTimeObject(timeInitial.value);
                resume();
            } else {
                alert('select activity please');
            }
        }
    }
    function pause() {
        clearInterval(intervalId.value);
        paused.value= true;
    }
    function resume() {
        paused.value= false;
        time.value= getTimeObjectFromSeconds(timeRemaining.value);
        intervalId.value= setInterval(() => {
            if (timeRemaining.value== 0) {
                stop();
            } else {
                timeRemaining.value--;
                time.value = getTimeObjectFromSeconds(timeRemaining.value);
            }
        }, 1000);
    }
    function stop() {
        clearInterval(intervalId.value);
        const timeSpentNice = timeRemaining.value == 0 ? getTimeNiceFromTimeObject(timeInitial.value) : getTimeNiceFromTimeObject(getTimeObjectFromSeconds(getElapsedTimeInSeconds()));

        let activityName = activitySelectionForm.value.selectedActivityName;
        showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timeSpentNice}`);
        saveDialog.value.open(activityName, timeSpentNice);
    }
    function resetTime() {
        time.value = new TimeObject();
        paused.value = false;
        intervalId.value = undefined;
        formDisabled.value = false;
        timeInputVisible.value = true;
        timeRemaining.value = 0;
        startTimestamp.value = 0;
    }
    function saveActivity() {
        const timeInSeconds = timeRemaining.value == 0 ? getSecondsFromTimeObject(timeInitial.value) : getElapsedTimeInSeconds();
        activitySelectionForm.value.addActivityToHistory(getTimeObjectFromSeconds(timeInSeconds), startTimestamp.value);
    }
    function updateTimeInitial(_timeInitial: TimeObject) {
        timeInitial.value = _timeInitial;
    }
    function getElapsedTimeInSeconds() {
        return getSecondsFromTimeObject(timeInitial.value) - getSecondsFromTimeObject(time.value);
    }
</script>