<template>
    <VRow justify="center">
        <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <TimeDisplay :timeObject="time"></TimeDisplay>
            <VRow justify="center" class="mt-4 mb-7">
	            <TimerControls :intervalId :paused="paused" @start="start" @pause="pause" @stop="stop"></TimerControls>
            </VRow>
            <hr />
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <SaveActivityDialog ref="saveDialog" @saved="saveActivity" @resetTime="resetTime"></SaveActivityDialog>
        </v-col>
    </VRow>
</template>
<script setup lang="ts">
    import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue';
    import TimeDisplay from '@/components/general/dateTime/TimeDisplay.vue';
    import SaveActivityDialog from '../../components/dialogs/SaveActivityDialog.vue';
    import {Time, TimePrecise} from '@/classes/TimeUtils';
    import  type { ActivityDialogType, ActivitySelectionFormType } from '@/classes/types/RefTypeInterfaces';
    import { ref } from 'vue';
    import TimerControls from '@/components/addActivityToHistory/TimerControls.vue';

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);

    const time = ref(new TimePrecise());
    const paused = ref(false);
    const intervalId = ref(undefined as number | undefined);
    const startTimestamp = ref(new Date());
    const formDisabled = ref(false);

    function start() {
        if (activitySelectionForm.value.validate()) {
            formDisabled.value = true;
            paused.value = false;
            startTimestamp.value = new Date();
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
        }
    }
    function pause() {
        clearInterval(intervalId.value);
        paused.value = true;
        formDisabled.value = false;
    }
    function stop() {
        clearInterval(intervalId.value);
        showSaveDialog();
    }
    function resetTime() {
        time.value = new TimePrecise();
        paused.value = false;
        intervalId.value = undefined;
        formDisabled.value = false;
    }
    function showSaveDialog() {
        let activityName = activitySelectionForm.value.getSelectedActivityName;
        if (activityName !== null) {
            saveDialog.value.open(activityName, time.value.toTimeLength);
        }
    }
    function saveActivity(length: Time) {
        activitySelectionForm.value.saveActivityToHistory(startTimestamp.value, length);
    }
</script>
