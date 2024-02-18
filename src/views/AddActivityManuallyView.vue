<template>
    <VRow justify="center" noGutters>
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <VRow class="mt-5" align="center" justify="center">
                <VCol class="bordered bordered-left" cols="12" md="7">
                    <VLabel>{{ $t('dateTime.when') }}</VLabel>
                    <DateTimePicker ref="dateTimePicker"></DateTimePicker>
                </VCol>
                <VCol class="bordered bordered-right" cols="12" md="5">
                    <VLabel>{{ $t('dateTime.length') }}</VLabel>
                    <TimePicker ref="timePicker"></TimePicker>
                </VCol>
                <VCol cols="auto">
                    <VBtn @click="saveActivity()" color="success">{{ $t('history.addActivityToHistory') }}</VBtn>
                </VCol>
            </VRow>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
//TODO
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
import TimePicker from '../components/TimeLengthPicker.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
import {ActivitySelectionFormType, DateTimePickerType, TimeLengthPickerType} from '@/classes/types/RefTypeInterfaces';
    import { ref } from 'vue';
    import {importDefaults} from '@/compositions/Defaults';
    const { i18n, showErrorSnackbar } = importDefaults();

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const dateTimePicker = ref<DateTimePickerType>({} as DateTimePickerType);
    const timePicker = ref<TimeLengthPickerType>({} as TimeLengthPickerType);
    const formDisabled = ref(false);

    function saveActivity() {
        if (activitySelectionForm.value.validate()) {
            if (dateTimePicker.value.dateTimeValue.valueOf() <= Date.now()) {
                if (timePicker.value.time.isNotZero()) {
                    activitySelectionForm.value?.addActivityToHistory(timePicker.value.time, dateTimePicker.value.dateTimeValue.valueOf());
                } else {
                    showErrorSnackbar(i18n.t('history.lengthNotSet'));
                }
            } else {
                alert('Really wanna add activity in future');
            }
        } else {
            alert('select activity');
        }
    }
</script>
<style scoped>
    .bordered {
        border: 1px solid white;
        border-collapse: collapse;
        padding: 10px 20px;
    }
    .bordered-left {
        border-radius: 5px 0 0 5px;
    }
    .bordered-right {
        border-radius: 0 5px 5px 0;
    }
</style>